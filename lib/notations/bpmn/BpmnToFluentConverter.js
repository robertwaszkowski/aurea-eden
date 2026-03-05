export class BpmnToFluentConverter {
    constructor() {
        this.elements = new Map();
        this.sequences = [];
        this.adjacencyList = new Map();
        this.startEventId = null;
        this.endEventIds = [];        // Regular end events
        this.terminateEventIds = [];  // Terminate end events (treat as dead-ends for primary path)
        this.branches = [];           // Branch classification results, populated during convert()
    }

    /**
     * Returns the list of classified branches discovered during the last convert() call.
     * Each entry: { type: 'Primary Path'|'Parallel Branch'|'Iterative Branch', anchor?: string, nodes: string[] }
     */
    getBranches() {
        return this.branches;
    }

    // ─────────────────────────────────────────────────────────────
    // Shared helper: maps a bpmn element type to the diagram factory
    // method call string, e.g. 'bpmn:userTask' -> '.addUserTask(id)'
    // ─────────────────────────────────────────────────────────────
    _getFluentMethod(element, elId) {
        const typeName = element.type.replace('bpmn:', '');
        switch (typeName) {
            case 'task': return `.addTask('${elId}')`;
            case 'startEvent': return `.addStartEvent('${elId}')`;
            case 'endEvent': return `.addEndEvent('${elId}')`;
            case 'terminateEndEvent': return `.addTerminateEndEvent('${elId}')`;
            default: {
                const method = 'add' + typeName.charAt(0).toUpperCase() + typeName.slice(1);
                return `.${method}('${elId}')`;
            }
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Cardinal port from src toward tgt based on Gateway rules:
    // - Up port (N) for iterations (backward flow) and end events.
    // - Right (E) and down (S) ports for parallel/forward paths.
    // ─────────────────────────────────────────────────────────────
    _sourcePort(srcEl, tgtEl, srcOutgoingIds, primaryPathSet) {
        // Rule 1: Up port for end events
        const isEndEvent = tgtEl.type === 'bpmn:endEvent' || tgtEl.type === 'bpmn:terminateEndEvent';

        // Rule 2: Up port for iterations (backward flow)
        let isIteration = false;
        if (srcEl.x !== null && tgtEl.x !== null) {
            isIteration = tgtEl.x < srcEl.x;
        }

        if (isEndEvent || isIteration) {
            return 'N';
        }

        // Rule 3: Right (E) and down (S) for parallel/forward paths
        if (!srcOutgoingIds) return 'E'; // fallback

        const forwardTargets = srcOutgoingIds
            .map(id => this.elements.get(id))
            .filter(t => {
                if (!t) return false;
                const tIsEnd = t.type === 'bpmn:endEvent' || t.type === 'bpmn:terminateEndEvent';
                const tIsIter = (srcEl.x !== null && t.x !== null) ? (t.x < srcEl.x) : false;
                return !tIsEnd && !tIsIter;
            });

        // 1 forward target -> E
        if (forwardTargets.length <= 1) {
            return 'E';
        }

        // Multiple forward targets -> identify main vs secondary
        // Primary path gets E
        const mainTarget = forwardTargets.find(t => primaryPathSet && primaryPathSet.has(t.id));
        if (mainTarget) {
            if (mainTarget.id === tgtEl.id) return 'E';
            return 'S';
        }

        // Fallback if none are primary path
        const sorted = forwardTargets.slice().sort((a, b) => {
            const dyA = srcEl.y !== null && a.y !== null ? Math.abs(a.y - srcEl.y) : 0;
            const dyB = srcEl.y !== null && b.y !== null ? Math.abs(b.y - srcEl.y) : 0;
            return dyA - dyB;
        });

        const index = sorted.findIndex(t => t.id === tgtEl.id);
        return index === 0 ? 'E' : 'S';
    }

    /**
     * Main entry point to convert a BPMN XML string into Aurea Eden JS code
     */
    convert(xmlString, options = {}) {
        const cfg = { enablePhase1: true, enablePhase2: true, enablePhase3: true, ...options };
        this._parseXml(xmlString);
        this._buildGraph();
        this.branches = []; // Reset branch list for each conversion

        const primaryPath = this._findPrimaryPath();
        if (!primaryPath || primaryPath.length === 0) {
            return "// Error: Could not find a valid path from Start to End event.";
        }

        const generatedLines = [];
        const processedElementIds = new Set();
        let codeCounter = 1;

        // Pre-compute a set for fast primary-path membership checks
        const primaryPathSet = new Set(primaryPath);

        // Pre-compute outgoing flow counts per element
        const outgoingFlows = new Map();
        for (const seq of this.sequences) {
            if (!outgoingFlows.has(seq.sourceRef)) outgoingFlows.set(seq.sourceRef, []);
            outgoingFlows.get(seq.sourceRef).push(seq.targetRef);
        }

        // --- Step 1: The Primary Straight Path ---
        generatedLines.push("// --- Step 1: Primary Straight Path ---");
        this.branches.push({ type: 'Primary Path', nodes: primaryPath });
        for (let i = 0; i < primaryPath.length; i++) {
            const elId = primaryPath[i];
            const element = this.elements.get(elId);
            processedElementIds.add(elId);
            const varName = `step${codeCounter++}`;
            element.codeVarName = varName; // Store reference name for later Steps

            let line = `const ${varName} = diagram`;
            line += this._getFluentMethod(element, elId);

            // Only add a label if the BPMN source had a real (non-empty) name
            if (element.hasName) {
                line += `\n    .addWrappedText('${this._cleanText(element.name)}')`;
            }

            if (i > 0) {
                const prevEl = this.elements.get(primaryPath[i - 1]);
                line += `\n    .positionRightOf('${prevEl.id}');`;
            } else {
                line += `; // Starting anchor`;
            }

            generatedLines.push(line);
        }

        // --- Step 2: Off-path elements (Branches) ---
        generatedLines.push("\n// --- Step 2: Branched / Off-path Elements ---");

        let unprocessed = Array.from(this.elements.keys()).filter(id => !processedElementIds.has(id));
        let maxIterations = 1000; // safety

        if (cfg.enablePhase2) {
            while (unprocessed.length > 0 && maxIterations-- > 0) {
                let processedInThisLoop = false;

                for (const elId of unprocessed) {
                    // Guard: skip if this element was absorbed into a branch traced
                    // earlier in this same inner-loop pass (the `unprocessed` array is a
                    // snapshot from the start of the outer while iteration, so it can still
                    // contain elements that have since been added to processedElementIds).
                    if (processedElementIds.has(elId)) continue;

                    const element = this.elements.get(elId);

                    // Find an incoming sequence flow that comes from an already PROCESSED element
                    const validIncomingEdges = this.sequences.filter(seq => seq.targetRef === elId && processedElementIds.has(seq.sourceRef));

                    if (validIncomingEdges.length > 0) {
                        // We found an anchor for a new branch
                        const anchorEdge = validIncomingEdges[0];
                        const anchorEl = this.elements.get(anchorEdge.sourceRef);

                        // Trace the entire continuous branch
                        const branchNodes = this._traceBranch(elId, processedElementIds, outgoingFlows);

                        // Determine if it's an iterative branch (backward flow) using topology
                        const isBackward = this._isBackwardBranch(branchNodes, anchorEl.id, outgoingFlows);

                        // Record branch classification
                        this.branches.push({
                            type: isBackward ? 'Iterative Branch' : 'Parallel Branch',
                            anchor: anchorEl.id,
                            nodes: branchNodes
                        });

                        // Process the entire branch sequentially
                        for (let i = 0; i < branchNodes.length; i++) {
                            const branchElId = branchNodes[i];
                            const branchEl = this.elements.get(branchElId);

                            processedElementIds.add(branchElId);
                            processedInThisLoop = true;

                            const varName = `step${codeCounter++}`;
                            branchEl.codeVarName = varName;

                            let positionMethod;
                            let placementAnchorId;

                            if (i === 0) {
                                // Rule 1 & Rule 2 apply to the FIRST node of the branch
                                positionMethod = 'positionDownOf';
                                placementAnchorId = anchorEl.id;

                                const isElementEndEvent = branchEl.type === 'bpmn:endEvent' || branchEl.type === 'bpmn:terminateEndEvent';
                                const isAnchorGateway = anchorEl.type.toLowerCase().includes('gateway');

                                if (isElementEndEvent && isAnchorGateway) {
                                    // Rule 1: Terminating end events attached to a gateway snap UP
                                    positionMethod = 'positionUpOf';
                                    placementAnchorId = anchorEl.id;

                                } else if (isBackward) {
                                    // Iteration branches (backward flow) snap UP
                                    positionMethod = 'positionUpOf';
                                    placementAnchorId = anchorEl.id;

                                } else {
                                    // Rule 2 / Forward processing
                                    const anchorOutgoing = outgoingFlows.get(anchorEl.id) || [];
                                    if (anchorOutgoing.length === 2 && !anchorEl.type.includes('Event')) {
                                        // For a 2-output gateway/task, try to find the main path successor
                                        const mainSuccessorId = anchorOutgoing.find(t => primaryPathSet.has(t));
                                        if (mainSuccessorId && mainSuccessorId !== branchElId) {
                                            // Place the branch element below the main-path successor to keep lanes clean
                                            positionMethod = 'positionDownOf';
                                            placementAnchorId = mainSuccessorId;
                                        }
                                    }
                                }
                            } else {
                                // Rule 3 (Topology): Subsequent nodes in the branch just chain continuously
                                placementAnchorId = branchNodes[i - 1];

                                if (isBackward) {
                                    positionMethod = 'positionLeftOf';
                                } else {
                                    positionMethod = 'positionRightOf';
                                }
                            }

                            let line = `const ${varName} = diagram`;
                            line += this._getFluentMethod(branchEl, branchElId);

                            // Only add a label if the BPMN source had a real (non-empty) name
                            if (branchEl.hasName) {
                                line += `\n    .addWrappedText('${this._cleanText(branchEl.name)}')`;
                            }
                            line += `\n    .${positionMethod}('${placementAnchorId}');`;
                            generatedLines.push(line);
                        }
                    }
                }

                if (!processedInThisLoop) {
                    // We have disconnected elements or loops that don't trace back to start.
                    generatedLines.push(`// Warning: Could not find anchor path for ${unprocessed.length} isolated elements.`);
                    break;
                }
                // Update unprocessed list
                unprocessed = Array.from(this.elements.keys()).filter(id => !processedElementIds.has(id));
            }
        }


        // --- Step 3: Global Connectors ---
        // • Source has 2+ outgoing flows: compute the cardinal exit port (N/E/S/W)
        //   from the gateway toward each target using BPMN coordinates; target uses 'auto'.
        // • Single-output elements: fully automatic ('auto', 'auto').
        if (cfg.enablePhase3) {
            for (const seq of this.sequences) {
                const src = this.elements.get(seq.sourceRef);
                const tgt = this.elements.get(seq.targetRef);
                const label = this._cleanText(seq.name);
                if (src && tgt && processedElementIds.has(src.id) && processedElementIds.has(tgt.id)) {
                    const srcOutgoing = outgoingFlows.get(src.id) || [];
                    const srcPort = srcOutgoing.length >= 2 ? this._sourcePort(src, tgt, srcOutgoing, primaryPathSet) : 'auto';

                    let line = `${src.codeVarName}.connectTo('${tgt.id}', '${srcPort}', 'auto'`;
                    if (label) {
                        line += `, '${label}'`;
                    }
                    line += `);`;
                    generatedLines.push(line);
                }
            }
        }


        return generatedLines.join('\n');
    }

    _parseXml(xmlString) {
        this.elements.clear();
        this.sequences = [];
        this.startEventId = null;
        this.endEventIds = [];

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");

        // Walk ALL nodes in the document to extract data regardless of namespace prefixes.
        // This handles bpmn:, bpmn2:, semantic:, or any other prefix transparently.
        const allNodes = xmlDoc.getElementsByTagName('*');

        // First pass: build the shapeBounds map from BPMNShape nodes
        const shapeBounds = new Map();
        for (let i = 0; i < allNodes.length; i++) {
            const node = allNodes[i];
            const localName = node.localName || node.tagName.split(':').pop();
            if (localName === 'BPMNShape') {
                const bpmnElementRef = node.getAttribute('bpmnElement');
                // Find "Bounds" child node
                const children = node.childNodes;
                for (let j = 0; j < children.length; j++) {
                    const child = children[j];
                    const childLocalName = child.localName || (child.tagName ? child.tagName.split(':').pop() : '');
                    if (childLocalName === 'Bounds') {
                        if (bpmnElementRef) {
                            shapeBounds.set(bpmnElementRef, {
                                x: parseFloat(child.getAttribute('x')),
                                y: parseFloat(child.getAttribute('y')),
                                width: parseFloat(child.getAttribute('width')),
                                height: parseFloat(child.getAttribute('height'))
                            });
                        }
                        break;
                    }
                }
            }
        }

        // Second pass: extract process elements and sequence flows
        const ELEMENT_TYPES = ['startEvent', 'task', 'userTask', 'serviceTask', 'manualTask',
            'scriptTask', 'businessRuleTask', 'sendTask', 'receiveTask',
            'exclusiveGateway', 'inclusiveGateway', 'parallelGateway', 'eventBasedGateway', 'complexGateway',
            'endEvent'];

        for (let i = 0; i < allNodes.length; i++) {
            const node = allNodes[i];
            const localName = node.localName || node.tagName.split(':').pop();

            if (ELEMENT_TYPES.includes(localName)) {
                const id = node.getAttribute('id');
                if (!id) continue;

                // Track whether the BPMN source had a real, non-empty name
                const rawName = node.getAttribute('name');
                const hasName = !!(rawName && rawName.trim().length > 0);
                const name = hasName ? rawName.trim() : id; // fallback to id for internal use only
                const bounds = shapeBounds.get(id);

                // Determine the concrete type. For endEvents, check whether a
                // terminateEventDefinition child exists and change the type accordingly.
                let type = `bpmn:${localName}`;
                let isTerminate = false;
                if (localName === 'endEvent') {
                    const children = node.childNodes;
                    for (let j = 0; j < children.length; j++) {
                        const childLocal = children[j].localName || (children[j].tagName ? children[j].tagName.split(':').pop() : '');
                        if (childLocal === 'terminateEventDefinition') { isTerminate = true; break; }
                    }
                    if (isTerminate) type = 'bpmn:terminateEndEvent';
                }

                this.elements.set(id, {
                    id,
                    name,
                    hasName,   // true only if the BPMN source had a non-empty name=""
                    type,
                    x: bounds ? bounds.x : null,
                    y: bounds ? bounds.y : null
                });

                if (localName === 'startEvent' && !this.startEventId) this.startEventId = id;
                if (localName === 'endEvent') {
                    if (isTerminate) {
                        this.terminateEventIds.push(id);
                    } else {
                        this.endEventIds.push(id);
                    }
                }

            } else if (localName === 'sequenceFlow') {
                const sourceRef = node.getAttribute('sourceRef');
                const targetRef = node.getAttribute('targetRef');
                if (sourceRef && targetRef) {
                    this.sequences.push({
                        id: node.getAttribute('id'),
                        name: node.getAttribute('name') || '',
                        sourceRef,
                        targetRef
                    });
                }
            }
        }
    }

    _buildGraph() {
        this.adjacencyList.clear();
        for (const [id, _] of this.elements) {
            this.adjacencyList.set(id, []);
        }

        for (const seq of this.sequences) {
            const neighbors = this.adjacencyList.get(seq.sourceRef) || [];
            neighbors.push(seq.targetRef);
            this.adjacencyList.set(seq.sourceRef, neighbors);
        }
    }

    /**
     * Finds the LONGEST path from startEvent to a regular (non-terminate) endEvent using BFS.
     * This finds the main happy path rather than shortcut reject branches.
     */
    _findPrimaryPath() {
        if (!this.startEventId) return null;

        // Prefer regular end events. Fall back to terminate events if no regular end exists.
        const targetEndIds = this.endEventIds.length > 0 ? this.endEventIds : this.terminateEventIds;
        if (targetEndIds.length === 0) return null;

        // BFS to find ALL paths to any preferred end event, return the longest
        const allPaths = [];
        let queue = [[this.startEventId]];
        let visited = new Set();
        visited.add(this.startEventId);

        while (queue.length > 0) {
            const path = queue.shift();
            const currentNode = path[path.length - 1];

            if (targetEndIds.includes(currentNode)) {
                allPaths.push(path);
                continue; // Don't expand from end nodes
            }

            // Stop exploring beyond terminate events so they don't inflate branch paths
            if (this.terminateEventIds.includes(currentNode)) continue;

            const neighbors = this.adjacencyList.get(currentNode) || [];
            for (const neighbor of neighbors) {
                if (!path.includes(neighbor)) { // use path-local visited to allow branching
                    queue.push([...path, neighbor]);
                }
            }
        }

        if (allPaths.length === 0) return null;

        // Return the longest path (the main happy path)
        return allPaths.reduce((longest, current) => current.length > longest.length ? current : longest, []);
    }

    /**
     * Traces a continuous branch of unplaced elements starting from a specific node.
     * It stops when it hits a merge (element with multiple incoming flows), a split (multiple outgoing), 
     * an already placed element, or an end event.
     * @param {string} startNodeId The unplaced node to start tracing from
     * @param {Set<string>} processedElementIds Set of already placed nodes
     * @param {Map} outgoingFlows Map of element ID to its outgoing target IDs
     * @returns {string[]} Ordered array of node IDs forming the continuous branch
     */
    _traceBranch(startNodeId, processedElementIds, outgoingFlows) {
        const branch = [];
        let currentNodeId = startNodeId;

        while (currentNodeId) {
            branch.push(currentNodeId);

            // Check outgoing flows to see what's next
            const outgoing = outgoingFlows.get(currentNodeId) || [];

            // If it's a dead end or splits into multiple paths, this branch trace is over
            if (outgoing.length !== 1) {
                break;
            }

            const targetId = outgoing[0];

            // If the target is already placed, the branch merges here
            if (processedElementIds.has(targetId)) {
                break;
            }

            // If the target has multiple incoming flows, it's a merge point
            const targetIncomingCount = this.sequences.filter(s => s.targetRef === targetId).length;
            if (targetIncomingCount > 1) {
                // We don't trace through merges because a merge acts as an anchor for subsequent branches
                break;
            }

            // Otherwise, continue tracing through the target
            currentNodeId = targetId;
        }

        return branch;
    }

    /**
     * Determines if a branch structurally loops backwards using graph reachability.
     * It checks if walking forward from the end of the branch can ever reach the anchor node.
     * @param {string[]} branch Array of node IDs in the branch
     * @param {string} anchorId The anchor node this branch spawned from
     * @param {Map} outgoingFlows Map of element ID to its outgoing target IDs
     * @returns {boolean} True if the branch connects back to an ancestor of the anchor
     */
    _isBackwardBranch(branch, anchorId, outgoingFlows) {
        if (!branch || branch.length === 0) return false;

        // Find the node this branch ultimately targets (if any)
        const finalBranchNodeId = branch[branch.length - 1];
        const outgoing = outgoingFlows.get(finalBranchNodeId) || [];

        if (outgoing.length === 0) return false; // Dead end, not a loop

        // We will perform a BFS from the final branch node's targets
        // to see if we can reach the anchorId. If we can, this is a backward loop.
        const queue = [...outgoing];
        const visited = new Set();

        while (queue.length > 0) {
            const currentId = queue.shift();

            // If we've reached the anchor, the branch is looping back to it or before it
            if (currentId === anchorId) {
                return true;
            }

            if (visited.has(currentId)) continue;
            visited.add(currentId);

            const nextNodes = outgoingFlows.get(currentId) || [];
            for (const next of nextNodes) {
                queue.push(next);
            }
        }

        return false;
    }

    _cleanText(text) {
        if (!text) return '';
        return text.replace(/\n/g, '\\n').replace(/'/g, "\\'");
    }
}
