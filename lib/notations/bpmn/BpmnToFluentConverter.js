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
        if (element.semanticType === 'anchor') {
            return `.addAnchorPoint('${elId}')`;
        }

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
        // Check if this specific sequence flow is a topologically identified back-edge
        // OR if the target node is the root of a multi-node branch that strictly loops backward
        const isIteration = (this.backEdges && this.backEdges.has(`${srcEl.id}->${tgtEl.id}`)) ||
            (this.backwardBranchRoots && this.backwardBranchRoots.has(tgtEl.id));

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
                const tIsIter = (this.backEdges && this.backEdges.has(`${srcEl.id}->${t.id}`)) ||
                    (this.backwardBranchRoots && this.backwardBranchRoots.has(t.id));
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
        // Sort alphabetically by ID to ensure consistent deterministic output
        const sorted = forwardTargets.slice().sort((a, b) => {
            return a.id.localeCompare(b.id);
        });

        const index = sorted.findIndex(t => t.id === tgtEl.id);
        return index === 0 ? 'E' : 'S';
    }

    /**
     * Determines which edges are topologically speaking "back edges" by running a Depth-First Search (DFS)
     * over the graph starting from the start event. Edges pointing to an active ancestor in the DFS tree
     * are strictly back edges (iterations). By prioritizing primary path children first, the primary path
     * forms the main trunk of the DFS tree.
     */
    _determineBackEdges(primaryPath) {
        this.backEdges = new Set();
        const visited = new Set();
        const recStack = new Set();

        const primaryPathIndexMap = new Map();
        if (primaryPath) {
            primaryPath.forEach((id, index) => primaryPathIndexMap.set(id, index));
        }

        const dfs = (nodeId) => {
            visited.add(nodeId);
            recStack.add(nodeId);

            // Fetch outgoing neighbors for this node
            const neighbors = this.adjacencyList.get(nodeId) || [];

            // Priority: Nodes on the primary path should be visited first.
            // This ensures they form the "trunk" of the DFS tree.
            const sortedNeighbors = [...neighbors].sort((a, b) => {
                const idxA = primaryPathIndexMap.has(a) ? primaryPathIndexMap.get(a) : Infinity;
                const idxB = primaryPathIndexMap.has(b) ? primaryPathIndexMap.get(b) : Infinity;
                return idxA - idxB;
            });

            for (const neighbor of sortedNeighbors) {
                if (!visited.has(neighbor)) {
                    dfs(neighbor);
                } else if (recStack.has(neighbor)) {
                    // This edge points to an ancestor currently in the recursive stack - definitely a cycle back-edge!
                    this.backEdges.add(`${nodeId}->${neighbor}`);
                }
            }
            recStack.delete(nodeId);
        };

        if (this.startEventId) {
            dfs(this.startEventId);
        }

        // Ensure disconnected subgraphs are processed
        for (const [id, _] of this.elements) {
            if (!visited.has(id)) {
                dfs(id);
            }
        }
    }

    /**
     * Main entry point to convert a BPMN XML string into Aurea Eden JS code
     */
    convert(xmlString, options = {}) {
        const stage = options.stage || 'lanes'; // 'baseline' | 'branches' | 'lanes'
        this._parseXml(xmlString);
        this._buildGraph();
        this.branches = []; // Reset branch list for each conversion
        this.backwardBranchRoots = new Set(); // Track branch starters that loop back

        const primaryPath = this._findPrimaryPath();
        if (!primaryPath || primaryPath.length === 0) {
            return "// Error: Could not find a valid path from Start to End event.";
        }

        // ── Topology stage: BFS level layout + straight arrows ──────────────────
        if (stage === 'topology') {
            return this._generateTopology(options);
        }

        // Pass the primaryPath so the DFS can prioritize it
        this._determineBackEdges(primaryPath);

        const generatedLines = [];
        const processedElementIds = new Set();
        const hiddenNodeIds = new Set();
        let codeCounter = 1;

        // Pre-compute a set for fast primary-path membership checks
        const primaryPathSet = new Set(primaryPath);

        // Pre-compute outgoing flow counts per element
        const outgoingFlows = new Map();
        for (const seq of this.sequences) {
            if (!outgoingFlows.has(seq.sourceRef)) outgoingFlows.set(seq.sourceRef, []);
            outgoingFlows.get(seq.sourceRef).push(seq.targetRef);
        }

        // --- Stage 1: The Baseline Spine ---
        generatedLines.push("// --- Stage 1: Primary Path (Baseline) ---");
        this.branches.push({ type: 'Primary Path', nodes: primaryPath });

        const hidePrimary = options.hiddenBranches && options.hiddenBranches.has('PRIMARY');

        for (let i = 0; i < primaryPath.length; i++) {
            const elId = primaryPath[i];
            const element = this.elements.get(elId);
            processedElementIds.add(elId);
            const varName = `step${codeCounter++}`;
            element.codeVarName = varName;

            if (hidePrimary) hiddenNodeIds.add(elId);

            let line = `const ${varName} = diagram`;
            line += this._getFluentMethod(element, elId);

            if (element.hasName) {
                line += `\n    .addWrappedText('${this._cleanText(element.name)}')`;
            }

            if (i > 0) {
                const prevEl = this.elements.get(primaryPath[i - 1]);
                line += `\n    .positionRightOf('${prevEl.id}')`;
            }

            line += hidePrimary ? `\n    .hide();` : `;`;
            if (i === 0 && !hidePrimary) line += ` // Starting anchor`;

            generatedLines.push(line);
            // Tag element with branchType so resolveOverlaps() can use it
            generatedLines.push(`diagram.getElementById('${elId}').branchType = 'primary';`);
        }

        // --- Branch Detection (Required for Stage 2 & 3) ---
        const detectedBranches = [];
        if (stage !== 'baseline') {
            let unprocessed = Array.from(this.elements.keys()).filter(id => !processedElementIds.has(id));
            let maxIterations = 1000;

            while (unprocessed.length > 0 && maxIterations-- > 0) {
                let processedInThisLoop = false;
                for (const elId of unprocessed) {
                    if (processedElementIds.has(elId)) continue;
                    const validIncomingEdges = this.sequences.filter(seq => seq.targetRef === elId && processedElementIds.has(seq.sourceRef));

                    if (validIncomingEdges.length > 0) {
                        const anchorEdge = validIncomingEdges[0];
                        const anchorEl = this.elements.get(anchorEdge.sourceRef);
                        const branchNodes = this._traceBranch(elId, processedElementIds, outgoingFlows);
                        const isBackward = this._isBackwardBranch(branchNodes, anchorEl.id, outgoingFlows);

                        if (isBackward) {
                            this.backwardBranchRoots.add(branchNodes[0]);
                        }

                        const branchObj = {
                            type: isBackward ? 'Iterative Branch' : 'Parallel Branch',
                            anchor: anchorEl.id,
                            nodes: branchNodes,
                            isBackward: isBackward
                        };

                        for (const branchElId of branchNodes) {
                            const branchEl = this.elements.get(branchElId);
                            branchEl.codeVarName = `step${codeCounter++}`;
                            processedElementIds.add(branchElId);
                        }

                        let startCol = this._findPrimaryPathIndex(branchObj.anchor, primaryPath);
                        if (startCol === -1) startCol = 0;
                        let mergeCol = this._findMergeCol(branchObj.nodes, primaryPath, outgoingFlows);
                        branchObj.span = Math.abs(mergeCol - startCol) + 1;

                        detectedBranches.push(branchObj);
                        processedInThisLoop = true;
                    }
                }
                if (!processedInThisLoop) break;
                unprocessed = Array.from(this.elements.keys()).filter(id => !processedElementIds.has(id));
            }

            // --- Shortcut Detection (Empty Branches) ---
            const shortcutEdgesToRemove = new Set();
            const newShortcutEdges = [];

            for (const seq of this.sequences) {
                const srcIdx = primaryPath.indexOf(seq.sourceRef);
                const tgtIdx = primaryPath.indexOf(seq.targetRef);

                // For now, focus on shortcuts strictly along the primary path.
                if (srcIdx !== -1 && tgtIdx !== -1 && Math.abs(tgtIdx - srcIdx) > 1) {
                    const isBackward = tgtIdx < srcIdx;

                    const anchorPointId = `${seq.sourceRef}_to_${seq.targetRef}_anchor`;

                    // Create the AnchorPoint virtual element
                    const anchorEl = {
                        id: anchorPointId,
                        name: '',
                        hasName: false,
                        type: 'bpmn:AnchorPoint',
                        semanticType: 'anchor',
                        codeVarName: `step${codeCounter++}`
                    };
                    this.elements.set(anchorPointId, anchorEl);
                    processedElementIds.add(anchorPointId);

                    const branchObj = {
                        type: isBackward ? 'Iterative Shortcut' : 'Parallel Shortcut',
                        anchor: seq.sourceRef,
                        nodes: [anchorPointId],
                        isBackward: isBackward,
                        isShortcut: true,
                        targetRef: seq.targetRef, // The node it merges into
                        span: Math.abs(tgtIdx - srcIdx)
                    };

                    if (isBackward) {
                        this.backwardBranchRoots.add(anchorPointId);
                    }

                    detectedBranches.push(branchObj);

                    // Mark old sequence for removal and add two new ones
                    shortcutEdgesToRemove.add(seq.id);
                    newShortcutEdges.push({
                        id: `${seq.id}_seg1`,
                        name: seq.name, // Keep label on the first segment
                        sourceRef: seq.sourceRef,
                        targetRef: anchorPointId
                    });
                    newShortcutEdges.push({
                        id: `${seq.id}_seg2`,
                        name: '',
                        sourceRef: anchorPointId,
                        targetRef: seq.targetRef
                    });

                    // Update outgoing flows for accurate lane assignment
                    outgoingFlows.set(anchorPointId, [seq.targetRef]);

                    let srcOutgoing = outgoingFlows.get(seq.sourceRef) || [];
                    srcOutgoing = srcOutgoing.filter(id => id !== seq.targetRef);
                    srcOutgoing.push(anchorPointId);
                    outgoingFlows.set(seq.sourceRef, srcOutgoing);
                }
            }

            if (shortcutEdgesToRemove.size > 0) {
                this.sequences = this.sequences.filter(seq => !shortcutEdgesToRemove.has(seq.id));
                this.sequences.push(...newShortcutEdges);
            }

            this.branches.push(...detectedBranches);
        }

        // --- Stage 2 & 3: Branched Elements and Lanes ---
        if (detectedBranches.length > 0) {
            generatedLines.push(`\n// --- Stage ${stage === 'lanes' ? '3' : '2'}: ${stage === 'lanes' ? 'Sorting and Lanes' : 'Unsorted Branches'} ---`);

            if (stage === 'lanes') {
                detectedBranches.sort((a, b) => a.span - b.span);
                const forwardBranches = detectedBranches.filter(b => !b.isBackward);
                const backwardBranches = detectedBranches.filter(b => b.isBackward);
                if (forwardBranches.length > 0) this._assignLanes(forwardBranches, primaryPath, outgoingFlows, false);
                if (backwardBranches.length > 0) this._assignLanes(backwardBranches, primaryPath, outgoingFlows, true);
            }

            for (const branch of detectedBranches) {
                const anchorEl = this.elements.get(branch.anchor);

                for (let i = 0; i < branch.nodes.length; i++) {
                    const branchElId = branch.nodes[i];
                    const branchEl = this.elements.get(branchElId);
                    const varName = branchEl.codeVarName;

                    let positionMethod;
                    let placementAnchorId;
                    let useShiftAndAlign = false;

                    if (i === 0) {
                        // First node of the branch uses lane placement
                        let baseAnchorId = anchorEl.id;

                        const isElementEndEvent = branchEl.type === 'bpmn:endEvent' || branchEl.type === 'bpmn:terminateEndEvent';
                        const isAnchorGateway = anchorEl.type.toLowerCase().includes('gateway');

                        if (isElementEndEvent && isAnchorGateway) {
                            positionMethod = 'positionUpOf';
                            placementAnchorId = anchorEl.id;

                        } else if (branch.isBackward) {
                            placementAnchorId = anchorEl.id;
                            if (stage === 'lanes' && branch.lane > 0 && branch.laneAnchorId) {
                                useShiftAndAlign = true;
                                positionMethod = `\n    .alignXWith('${placementAnchorId}')\n    .shiftUpOf('${branch.laneAnchorId}')`;
                            } else {
                                positionMethod = 'positionUpOf';
                            }
                        } else {
                            const anchorOutgoing = outgoingFlows.get(anchorEl.id) || [];
                            if (anchorOutgoing.length === 2 && !anchorEl.type.includes('Event')) {
                                const mainSuccessorId = anchorOutgoing.find(t => primaryPathSet.has(t));
                                if (mainSuccessorId && mainSuccessorId !== branchElId) {
                                    baseAnchorId = mainSuccessorId;
                                }
                            }
                            placementAnchorId = baseAnchorId;

                            if (stage === 'lanes' && branch.lane > 0 && branch.laneAnchorId) {
                                useShiftAndAlign = true;
                                positionMethod = `\n    .alignXWith('${placementAnchorId}')\n    .shiftDownOf('${branch.laneAnchorId}')`;
                            } else {
                                positionMethod = 'positionDownOf';
                            }
                        }
                    } else {
                        // Subsequent nodes chain off the previous node
                        placementAnchorId = branch.nodes[i - 1];
                        if (branch.isBackward) {
                            positionMethod = 'positionLeftOf';
                        } else {
                            positionMethod = 'positionRightOf';
                        }
                    }

                    let line = `const ${varName} = diagram`;
                    line += this._getFluentMethod(branchEl, branchElId);

                    if (branchEl.hasName) {
                        line += `\n    .addWrappedText('${this._cleanText(branchEl.name)}')`;
                    }

                    if (useShiftAndAlign) {
                        line += positionMethod;
                    } else {
                        line += `\n    .${positionMethod}('${placementAnchorId}')`;
                    }

                    const isHidden = options.hiddenBranches && options.hiddenBranches.has(branch.nodes[0]);
                    if (isHidden) {
                        hiddenNodeIds.add(branchElId);
                        line += `\n    .hide();`;
                    } else {
                        line += `;`;
                    }

                    generatedLines.push(line);
                    // Tag element with branchType so resolveOverlaps() can use it
                    const branchTypeTag = branch.isBackward ? 'iterative' : 'parallel';
                    generatedLines.push(`diagram.getElementById('${branchElId}').branchType = '${branchTypeTag}';`);
                }
            }
        }

        // --- Stage 4: Connectors (Integrated everywhere) ---
        generatedLines.push("\n// --- Connectors ---");
        for (const seq of this.sequences) {
            const src = this.elements.get(seq.sourceRef);
            const tgt = this.elements.get(seq.targetRef);
            const label = this._cleanText(seq.name);
            if (hiddenNodeIds.has(seq.sourceRef) || hiddenNodeIds.has(seq.targetRef)) continue;
            if (src && tgt && processedElementIds.has(src.id) && processedElementIds.has(tgt.id)) {
                const srcOutgoing = outgoingFlows.get(src.id) || [];
                const srcPort = srcOutgoing.length >= 2 ? this._sourcePort(src, tgt, srcOutgoing, primaryPathSet) : 'auto';
                let line = `diagram.connect('${src.id}', '${tgt.id}', '${srcPort}', 'auto'`;
                if (label) line += `, '${label}'`;
                line += `);`;
                generatedLines.push(line);
            }
        }

        return generatedLines.join('\n');
    }


    // ────────────────────────────────────────────────────────────────────────
    // Topology stage: BFS level layout + straight arrow connectors
    // ────────────────────────────────────────────────────────────────────────
    _generateTopology(options) {
        const SPACING_X = 200; // horizontal distance between BFS levels
        const SPACING_Y = 120; // vertical distance between nodes in the same level

        // Build outgoing adjacency
        const outgoing = new Map();
        for (const seq of this.sequences) {
            if (!outgoing.has(seq.sourceRef)) outgoing.set(seq.sourceRef, []);
            outgoing.get(seq.sourceRef).push(seq.targetRef);
        }

        // BFS from start event to assign column (level depth)
        const levels = new Map(); // nodeId → column index
        const queue = [];

        if (this.startEventId) {
            levels.set(this.startEventId, 0);
            queue.push(this.startEventId);
        }

        let head = 0;
        while (head < queue.length) {
            const nodeId = queue[head++];
            const nodeLevel = levels.get(nodeId);
            for (const successor of (outgoing.get(nodeId) || [])) {
                // Only assign level on first visit — this handles cycles (back edges)
                // by ignoring a node once it's already been placed.
                if (!levels.has(successor)) {
                    levels.set(successor, nodeLevel + 1);
                    queue.push(successor);
                }
            }
        }

        // Any nodes not reachable from start get placed at level 0
        for (const id of this.elements.keys()) {
            if (!levels.has(id)) levels.set(id, 0);
        }

        // Group nodes by column so we can assign rows
        const byColumn = new Map();
        for (const [id, col] of levels) {
            if (!byColumn.has(col)) byColumn.set(col, []);
            byColumn.get(col).push(id);
        }

        // Assign (col, row) → absolute position
        const positions = new Map(); // nodeId → { x, y }
        for (const [col, nodes] of byColumn) {
            const totalH = (nodes.length - 1) * SPACING_Y;
            for (let row = 0; row < nodes.length; row++) {
                const x = col * SPACING_X;
                const y = row * SPACING_Y - totalH / 2; // centre the column vertically
                positions.set(nodes[row], { x, y });
            }
        }

        // ── Code generation ────────────────────────────────────────────────
        const lines = [];
        lines.push('// --- Stage 0: Topology (BFS level layout, straight arrows) ---');

        let counter = 1;
        for (const [elId, element] of this.elements) {
            const varName = `top${counter++}`;
            element.codeVarName = varName;
            const pos = positions.get(elId) || { x: 0, y: 0 };

            let line = `const ${varName} = diagram`;
            line += this._getFluentMethod(element, elId);
            if (element.hasName) {
                line += `\n    .addWrappedText('${this._cleanText(element.name)}')`;
            }
            line += `\n    .setPosition(${Math.round(pos.x)}, ${Math.round(pos.y)}, 0);`;
            lines.push(line);
        }

        // Use the same high-level connect() API as all other stages:
        // it computes proper element-edge ports and routes connectors correctly.
        lines.push('\n// --- Topology Connections ---');
        for (const seq of this.sequences) {
            const srcEl = this.elements.get(seq.sourceRef);
            const tgtEl = this.elements.get(seq.targetRef);
            if (!srcEl || !tgtEl) continue;

            const label = this._cleanText(seq.name);
            let line = `diagram.connect('${seq.sourceRef}', '${seq.targetRef}', 'auto', 'auto'`;
            if (label) line += `, '${label}'`;
            line += `);`;
            lines.push(line);
        }

        // Expose branches (only the primary path) so the branch panel still works
        this.branches = [{ type: 'Primary Path', nodes: Array.from(this.elements.keys()) }];

        return lines.join('\n');
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

        // Extract process elements and sequence flows
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
                    type
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
     * Determines if a branch structurally loops backwards using the rigorous DFS back-edges map.
     * @param {string[]} branch Array of node IDs in the branch
     * @param {string} anchorId The anchor node this branch spawned from
     * @param {Map} outgoingFlows Map of element ID to its outgoing target IDs
     * @returns {boolean} True if the branch connects back via a topological back-edge
     */
    _isBackwardBranch(branch, anchorId, outgoingFlows) {
        if (!branch || branch.length === 0) return false;

        // Find the node this branch ultimately targets (if any)
        const finalBranchNodeId = branch[branch.length - 1];
        const outgoing = outgoingFlows.get(finalBranchNodeId) || [];

        if (outgoing.length === 0) return false; // Dead end, not a loop

        // If any of the outgoing edges from the end of this branch is a recognized back-edge,
        // then this branch's entire purpose is to form a backward loop (iteration).
        for (const targetId of outgoing) {
            if (this.backEdges && this.backEdges.has(`${finalBranchNodeId}->${targetId}`)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Finds the index of a node in the primary path.
     * @param {string} nodeId - The ID to search for
     * @param {string[]} primaryPath - The primary path array
     * @returns {number} The index in primaryPath, or -1 if not found
     */
    _findPrimaryPathIndex(nodeId, primaryPath) {
        return primaryPath.indexOf(nodeId);
    }

    /**
     * Walks outgoing edges from the last branch node to find where it rejoins the primary path.
     * @param {string[]} branchNodes - The branch node IDs
     * @param {string[]} primaryPath - The primary path array
     * @param {Map} outgoingFlows - Map of element ID to its outgoing target IDs
     * @returns {number} The primary path index of the merge node, or the end of the array if no merge
     */
    _findMergeCol(branchNodes, primaryPath, outgoingFlows) {
        if (!branchNodes || branchNodes.length === 0) return primaryPath.length;

        const lastNodeId = branchNodes[branchNodes.length - 1];
        let queue = [lastNodeId];
        let visited = new Set();
        let maxSearchDepth = 50;

        while (queue.length > 0 && maxSearchDepth-- > 0) {
            const currentId = queue.shift();

            // If we hit the primary path, this is the column
            const primaryIndex = this._findPrimaryPathIndex(currentId, primaryPath);
            if (primaryIndex !== -1 && currentId !== lastNodeId) { // found merge
                return primaryIndex;
            }

            if (visited.has(currentId)) continue;
            visited.add(currentId);

            const nextNodes = outgoingFlows.get(currentId) || [];
            for (const next of nextNodes) {
                queue.push(next);
            }
        }

        return primaryPath.length; // No formal merge found (e.g. branch ends abruptly or goes off infinitely)
    }

    /**
     * Assigns vertical lane indices to a list of branches using a column-range overlap strategy.
     * @param {Object[]} branches - The branches to process (must be all same direction, e.g. all forward or all backward)
     * @param {string[]} primaryPath - The primary path array
     * @param {Map} outgoingFlows - Map of element ID to its outgoing target IDs
     * @param {boolean} [isBackward=false] - True if these are iterative (upward) branches
     */
    _assignLanes(branches, primaryPath, outgoingFlows, isBackward = false) {
        // laneOccupancy[laneIndex] = array of [startCol, endCol] range tuples
        const laneOccupancy = [];

        for (const branch of branches) {
            let startCol = this._findPrimaryPathIndex(branch.anchor, primaryPath);
            if (startCol === -1) {
                // Should be very rare, but if anchor isn't on primary path (e.g. branch of branch), guess column 0
                startCol = 0;
            }

            let mergeCol = this._findMergeCol(branch.nodes, primaryPath, outgoingFlows);

            let laneIndex = 0;
            let foundLane = false;

            while (!foundLane) {
                if (!laneOccupancy[laneIndex]) {
                    laneOccupancy[laneIndex] = [];
                }

                // Check for overlaps in this lane
                let hasOverlap = false;
                for (const range of laneOccupancy[laneIndex]) {
                    // Check if [startCol, mergeCol] overlaps with range [range[0], range[1]]
                    // They overlap if max(start1, start2) <= min(end1, end2)
                    let maxStart = Math.max(startCol, range[0]);
                    let minEnd = Math.min(mergeCol, range[1]);

                    // Note: If mergeCol === range[0] (or vice versa), technically they touch on the exact same node.
                    // To be safe and prevent squeezing if branches meet at exactly a gateway, we treat <= as an overlap.
                    if (maxStart <= minEnd) {
                        hasOverlap = true;
                        break;
                    }
                }

                if (!hasOverlap) {
                    foundLane = true;
                    // assign
                    branch.lane = laneIndex;
                    laneOccupancy[laneIndex].push([startCol, mergeCol]);

                    // Finding the laneAnchor (the node in the lane "above" us that we should align under/over)
                    // If we are lane 0, our anchor is the primary path node (branch.anchor or mainSuccessorId, handled later)
                    if (laneIndex > 0) {
                        // Find the branch in lane N-1 that caused us to get pushed down.
                        // (We need an element to call `.shiftDownOf` on).
                        // We take the last node of the first overlapping branch found in lane N-1.
                        const previousLaneBranchesRow = branches.filter(b => b.lane === laneIndex - 1);
                        for (const prevB of previousLaneBranchesRow) {
                            let pStartCol = this._findPrimaryPathIndex(prevB.anchor, primaryPath);
                            let pMergeCol = this._findMergeCol(prevB.nodes, primaryPath, outgoingFlows);
                            let pMaxStart = Math.max(startCol, pStartCol);
                            let pMinEnd = Math.min(mergeCol, pMergeCol);
                            if (pMaxStart <= pMinEnd) { // This is the branch that overlaps!
                                branch.laneAnchorId = prevB.nodes[0]; // Anchor exactly below the start of the blocking branch
                                break;
                            }
                        }
                    }
                } else {
                    laneIndex++;
                }
            }
        }
    }

    _cleanText(text) {
        if (!text) return '';
        return text.replace(/\n/g, '\\n').replace(/'/g, "\\'");
    }
}
