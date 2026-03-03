export class BpmnToFluentConverter {
    constructor() {
        this.elements = new Map();
        this.sequences = [];
        this.adjacencyList = new Map();
        this.startEventId = null;
        this.endEventIds = [];
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

        // --- Step 1: The Primary Straight Path ---
        generatedLines.push("// --- Step 1: Primary Straight Path ---");
        for (let i = 0; i < primaryPath.length; i++) {
            const elId = primaryPath[i];
            const element = this.elements.get(elId);
            processedElementIds.add(elId);
            const varName = `step${codeCounter++}`;
            element.codeVarName = varName; // Store reference name for later Steps

            let line = `const ${varName} = diagram`;
            const typeName = element.type.replace('bpmn:', '');
            const MethodName = 'add' + typeName.charAt(0).toUpperCase() + typeName.slice(1);

            // Check if it's a known generic type that uses a different factory method
            if (typeName === 'task' || typeName === 'startEvent' || typeName === 'endEvent') {
                if (typeName === 'task') line += `.addTask('${elId}')`;
                else if (typeName === 'startEvent') line += `.addStartEvent('${elId}')`;
                else if (typeName === 'endEvent') line += `.addEndEvent('${elId}')`;
            } else {
                // Dynamically call things like .addExclusiveGateway or .addUserTask
                line += `.${MethodName}('${elId}')`;
            }

            line += `\n    .addWrappedText('${this._cleanText(element.name)}')`;

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

                    // Determine up vs down. If no positional data, just alternate or default down.
                    // For now, default down.
                    let positionMethod = 'positionDownOf';
                    if (element.y !== null && anchorEl.y !== null) {
                        if (element.y < anchorEl.y) {
                            positionMethod = 'positionUpOf';
                        }
                    }

                    let line = `const ${varName} = diagram`;
                    const typeName = element.type.replace('bpmn:', '');
                    const MethodName = 'add' + typeName.charAt(0).toUpperCase() + typeName.slice(1);

                    if (typeName === 'task' || typeName === 'startEvent' || typeName === 'endEvent') {
                        if (typeName === 'task') line += `.addTask('${elId}')`;
                        else if (typeName === 'startEvent') line += `.addStartEvent('${elId}')`;
                        else if (typeName === 'endEvent') line += `.addEndEvent('${elId}')`;
                    } else {
                        // Dynamically call things like .addExclusiveGateway or .addUserTask
                        line += `.${MethodName}('${elId}')`;
                    }

                    line += `\n    .addWrappedText('${this._cleanText(element.name)}')`;
                    line += `\n    .${positionMethod}('${anchorEl.id}');`;
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
        generatedLines.push("\n// --- Step 3: Global Connectors ---");
        for (const seq of this.sequences) {
            const src = this.elements.get(seq.sourceRef);
            const tgt = this.elements.get(seq.targetRef);
            const label = this._cleanText(seq.name);
            if (src && tgt && processedElementIds.has(src.id) && processedElementIds.has(tgt.id)) {
                let line = `${src.codeVarName}.connectTo('${tgt.id}', 'auto', 'auto'`;
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

        // Parse diagram positioning metadata (BPMNDiagram) if available
        const shapeBounds = new Map();
        const shapes = xmlDoc.getElementsByTagNameNS('*', 'BPMNShape');
        for (let i = 0; i < shapes.length; i++) {
            const shape = shapes[i];
            const bpmnElementRef = shape.getAttribute('bpmnElement');
            const bounds = shape.getElementsByTagNameNS('*', 'Bounds')[0];
            if (bpmnElementRef && bounds) {
                shapeBounds.set(bpmnElementRef, {
                    x: parseFloat(bounds.getAttribute('x')),
                    y: parseFloat(bounds.getAttribute('y')),
                    width: parseFloat(bounds.getAttribute('width')),
                    height: parseFloat(bounds.getAttribute('height'))
                });
            }
        }
        // Helper to extract common node types by iterating all nodes and checking localName
        const allNodes = xmlDoc.getElementsByTagName('*');

        for (let i = 0; i < allNodes.length; i++) {
            const node = allNodes[i];
            const localName = node.localName || node.tagName.split(':').pop();

            if (['startEvent', 'task', 'userTask', 'serviceTask',
                'exclusiveGateway', 'inclusiveGateway', 'parallelGateway', 'endEvent'].includes(localName)) {

                const id = node.getAttribute('id');
                const name = node.getAttribute('name') || id;
                const type = `bpmn:${localName}`;
                const bounds = shapeBounds.get(id);

                this.elements.set(id, {
                    id,
                    name,
                    type,
                    x: bounds ? bounds.x : null,
                    y: bounds ? bounds.y : null
                });

                if (localName === 'startEvent' && !this.startEventId) this.startEventId = id;
                if (localName === 'endEvent') this.endEventIds.push(id);
            } else if (localName === 'sequenceFlow') {
                this.sequences.push({
                    id: node.getAttribute('id'),
                    name: node.getAttribute('name') || '',
                    sourceRef: node.getAttribute('sourceRef'),
                    targetRef: node.getAttribute('targetRef')
                });
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
     * Finds the shortest path from startEvent to any endEvent using BFS
     */
    _findPrimaryPath() {
        if (!this.startEventId || this.endEventIds.length === 0) return null;

        let queue = [[this.startEventId]];
        let visited = new Set();
        visited.add(this.startEventId);

        while (queue.length > 0) {
            const path = queue.shift();
            const currentNode = path[path.length - 1];

            if (this.endEventIds.includes(currentNode)) {
                return path; // Found the shortest path to an end!
            }

            const neighbors = this.adjacencyList.get(currentNode) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push([...path, neighbor]);
                }
            }
        }
        return null;
    }

    _cleanText(text) {
        if (!text) return '';
        return text.replace(/\n/g, '\\n').replace(/'/g, "\\'");
    }
}
