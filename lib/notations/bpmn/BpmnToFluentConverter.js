export class BpmnToFluentConverter {
    constructor() {
        this.elements = new Map();
        this.sequences = [];
        this.adjacencyList = new Map();
        this.startEventId = null;
        this.endEventIds = [];        // Regular end events
        this.terminateEventIds = [];  // Terminate end events (treat as dead-ends for primary path)
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
    convert(xmlString) {
        this._parseXml(xmlString);
        this._buildGraph();

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

        while (unprocessed.length > 0 && maxIterations-- > 0) {
            let processedInThisLoop = false;

            for (const elId of unprocessed) {
                const element = this.elements.get(elId);

                // Find an incoming sequence flow that comes from an already PROCESSED element
                const validIncomingEdges = this.sequences.filter(seq => seq.targetRef === elId && processedElementIds.has(seq.sourceRef));

                if (validIncomingEdges.length > 0) {
                    // We found an anchor
                    const anchorEdge = validIncomingEdges[0];
                    const anchorEl = this.elements.get(anchorEdge.sourceRef);

                    processedElementIds.add(elId);
                    processedInThisLoop = true;

                    const varName = `step${codeCounter++}`;
                    element.codeVarName = varName;

                    // ── Placement strategy ────────────────────────────────────────────────
                    //
                    // Rule: for a 2-output source (gateway/task diverging into two lanes),
                    //   the branch element should be placed BELOW the main-path successor
                    //   of that source — not below the source itself.
                    //   This naturally aligns it in column with the element it will merge
                    //   back into, and keeps the gateway clean.
                    //
                    // For all other cases, fall through to the Y-coordinate heuristic:
                    //   |Δy| ≤ 25px  → positionRightOf (same lane)
                    //   Δy < -25     → positionUpOf
                    //   Δy > 25      → positionDownOf
                    // ─────────────────────────────────────────────────────────────────────
                    let positionMethod = 'positionDownOf';
                    let placementAnchorId = anchorEl.id;

                    const isElementEndEvent = element.type === 'bpmn:endEvent' || element.type === 'bpmn:terminateEndEvent';
                    const isAnchorGateway = anchorEl.type.toLowerCase().includes('gateway');

                    if (isElementEndEvent && isAnchorGateway) {
                        positionMethod = 'positionUpOf';
                        placementAnchorId = anchorEl.id;
                    } else {
                        const anchorOutgoing = outgoingFlows.get(anchorEl.id) || [];
                        if (anchorOutgoing.length === 2) {
                            // Find which outgoing target is on the primary path (the main flow)
                            const mainSuccessorId = anchorOutgoing.find(t => primaryPathSet.has(t));
                            if (mainSuccessorId && mainSuccessorId !== elId) {
                                // Place the branch element below the main-path successor
                                positionMethod = 'positionDownOf';
                                placementAnchorId = mainSuccessorId;
                            } else {
                                // Fall back to Y-coordinate heuristic vs the anchor element
                                const Y_TOLERANCE = 25;
                                if (element.y !== null && anchorEl.y !== null) {
                                    const dy = element.y - anchorEl.y;
                                    if (Math.abs(dy) <= Y_TOLERANCE) positionMethod = 'positionRightOf';
                                    else if (dy < 0) positionMethod = 'positionUpOf';
                                }
                            }
                        } else {
                            // Standard Y-coordinate heuristic
                            const Y_TOLERANCE = 25;
                            if (element.y !== null && anchorEl.y !== null) {
                                const dy = element.y - anchorEl.y;
                                if (Math.abs(dy) <= Y_TOLERANCE) positionMethod = 'positionRightOf';
                                else if (dy < 0) positionMethod = 'positionUpOf';
                            }
                        }
                    }

                    let line = `const ${varName} = diagram`;
                    line += this._getFluentMethod(element, elId);

                    // Only add a label if the BPMN source had a real (non-empty) name
                    if (element.hasName) {
                        line += `\n    .addWrappedText('${this._cleanText(element.name)}')`;
                    }
                    line += `\n    .${positionMethod}('${placementAnchorId}');`;
                    generatedLines.push(line);
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


        // --- Step 3: Global Connectors ---
        // • Source has 2+ outgoing flows: compute the cardinal exit port (N/E/S/W)
        //   from the gateway toward each target using BPMN coordinates; target uses 'auto'.
        // • Single-output elements: fully automatic ('auto', 'auto').
        generatedLines.push("\n// --- Step 3: Global Connectors ---");
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

    _cleanText(text) {
        if (!text) return '';
        return text.replace(/\n/g, '\\n').replace(/'/g, "\\'");
    }
}
