import * as THREE from 'three';
import { BpmnExporter } from './BpmnExporter.js';
import { BpmnToFluentConverter } from './BpmnToFluentConverter.js';
// Import Diagram and Element classes and constants
import { Diagram } from '../../diagrams/Diagram.js';
import { DiagramDimensions } from '../../diagrams/DiagramConstants.js';
import { Element } from '../../elements/Element.js';
import { Connector } from '../../connectors/Connector.js';
// Import element shapes
import { CircleShape } from '../../shapes/paths/CircleShape.js';
import { RoundedRectangleShape } from '../../shapes/paths/RoundedRectangleShape.js';
import { DiamondShape } from '../../shapes/paths/DiamondShape.js';
import { SwimlaneShape } from '../../shapes/paths/SwimlaneShape.js';
import { TextShape } from '../../shapes/text/TextShape.js';
import { TextAnnotationShape } from '../../shapes/paths/TextAnnotationShape.js';
import { StraightDottedConnectorShape } from '../../shapes/connector/StraightDottedConnectorShape.js';
import { StraightArrowConnectorShape } from '../../shapes/connector/StraightArrowConnectorShape.js';

import { DashedOrthogonalConnectorShape } from '../../shapes/connector/DashedOrthogonalConnectorShape.js';
// Import connector shapes
import { RoundedCornerOrthogonalConnectorShape } from '../../shapes/connector/RoundedCornerOrthogonalConnectorShape.js';
// Import Activity icons
import manual from '../../shapes/icon/bpmn/activities/manual.svg?raw';
import user from '../../shapes/icon/bpmn/activities/user.svg?raw';
import script from '../../shapes/icon/bpmn/activities/script.svg?raw';
import businessRule from '../../shapes/icon/bpmn/activities/business-rule.svg?raw';
import service from '../../shapes/icon/bpmn/activities/service.svg?raw';
import send from '../../shapes/icon/bpmn/activities/send.svg?raw';
import receive from '../../shapes/icon/bpmn/activities/receive.svg?raw';
import subProcessMarker from '../../shapes/icon/bpmn/activities/sub-process-marker.svg?raw';
// Import Gateway icons
import inclusive from '../../shapes/icon/bpmn/gateways/inclusive.svg?raw';
import exclusive from '../../shapes/icon/bpmn/gateways/exclusive.svg?raw';
import parallel from '../../shapes/icon/bpmn/gateways/parallel.svg?raw';
import eventBased from '../../shapes/icon/bpmn/gateways/event-based.svg?raw';
import complex from '../../shapes/icon/bpmn/gateways/complex.svg?raw';
// Import Event icons
import compensation from '../../shapes/icon/bpmn/events/compensation.svg?raw';
import conditional from '../../shapes/icon/bpmn/events/conditional.svg?raw';
import error from '../../shapes/icon/bpmn/events/error.svg?raw';
import escalation from '../../shapes/icon/bpmn/events/escalation.svg?raw';
import intermediate from '../../shapes/icon/bpmn/events/intermediate.svg?raw';
import intermediateCompensation from '../../shapes/icon/bpmn/events/intermediate-compensation.svg?raw';
import intermediateConditional from '../../shapes/icon/bpmn/events/intermediate-conditional.svg?raw';
import intermediateEscalation from '../../shapes/icon/bpmn/events/intermediate-escalation.svg?raw';
import intermediateLinkCatch from '../../shapes/icon/bpmn/events/intermediate-link-catch.svg?raw';
import intermediateLinkThrow from '../../shapes/icon/bpmn/events/intermediate-link-throw.svg?raw';
import intermediateReceive from '../../shapes/icon/bpmn/events/intermediate-receive.svg?raw';
import intermediateSend from '../../shapes/icon/bpmn/events/intermediate-send.svg?raw';
import intermediateSignalCatch from '../../shapes/icon/bpmn/events/intermediate-signal-catch.svg?raw';
import intermediateSignalThrow from '../../shapes/icon/bpmn/events/intermediate-signal-throw.svg?raw';
import intermediateTimer from '../../shapes/icon/bpmn/events/intermediate-timer.svg?raw';
import messageEnd from '../../shapes/icon/bpmn/events/message-end.svg?raw';
import messageStart from '../../shapes/icon/bpmn/events/message-start.svg?raw';
import signalEnd from '../../shapes/icon/bpmn/events/signal-end.svg?raw';
import signalStart from '../../shapes/icon/bpmn/events/signal-start.svg?raw';
import terminate from '../../shapes/icon/bpmn/events/terminate.svg?raw';
import timer from '../../shapes/icon/bpmn/events/timer.svg?raw';

const BPMN_DIMS = {
    DISTANCE_BETWEEN_ELEMENTS: DiagramDimensions.DISTANCE_BETWEEN_ELEMENTS,
    START_EVENT_LINE_WIDTH: 1,
    END_EVENT_LINE_WIDTH: 2.4,
    ICON_SIZE_SMALL: 10,
    ICON_SIZE_MEDIUM: 18,
    // Default BPMN element sizes
    EVENT_SIZE: 36,
    TASK_WIDTH: 100,
    TASK_HEIGHT: 80,
    GATEWAY_SIZE: 50,
    TEXT_ANNOTATION_WIDTH: 100,
    TEXT_ANNOTATION_HEIGHT: 50,
    // Default BPMN font sizes
    FONT_SIZE_TASK: 9,
    FONT_SIZE_ANNOTATION: 9,
    FONT_SIZE_EVENT: 7,
    FONT_SIZE_GATEWAY: 7,
    FONT_SIZE_FLOW: 7,
    // Default BPMN alignments
    TEXT_ALIGN_TASK: 'center',
    TEXT_ALIGN_ANNOTATION: 'left',
    TEXT_ALIGN_EVENT: 'center',
    TEXT_ALIGN_GATEWAY: 'center',
    TEXT_ALIGN_FLOW: 'center',
    // Default BPMN offsets
    TEXT_OFFSET_DEFAULT: { x: 0, y: 0, z: 3 },
    TEXT_OFFSET_ANNOTATION: { x: 0, y: 0, z: 3 },
    LABEL_GAP_BELOW: 8,
    FLOW_LABEL_GAP_X: 15,
    FLOW_LABEL_GAP_Y: 10,
    ANCHOR_POINT_SIZE: 12,
    // Default BPMN face-camera behaviors (ANALYZE mode)
    FACE_CAMERA_TASK: true,
    FACE_CAMERA_EVENT: false,
    FACE_CAMERA_GATEWAY: false,
    FACE_CAMERA_ANNOTATION: false,
    FACE_CAMERA_FLOW: false
};

const BPMN_COLORS = {
    PRIMARY: 0x333333,    // Dark Grey (Light Mode Default)
    HIGHLIGHT: 0x00aaff,  // Electric Cyan (Dark Mode Tasks)
    MUTED: 0x888888,      // Muted Grey (Dark Mode Flows)
    SILVER: 0xbbbbbb,     // Silver (Dark Mode Annotations)
    OFF_WHITE: 0xeeeeee   // Clean White (Dark Mode Labels)
};

class BpmnDiagram extends Diagram {
    constructor(container, options = {}) {
        super(container, options);
    }

    /**
     * Re-calculates and applies a native topology-based auto-layout using Breadth-First-Search.
     * Overrides manual positioning and ensures sequence flows route cleanly.
     *
     * @param {Array<Object>} overrides - Optional dependency-sorted placement overrides.
     * @returns {Promise<void>}
     */
    async autoLayout(overrides = []) {
        // --- PRE-ALIGNMENT: Headless Diagram Failsafe ---
        // 1. Flush any pending connections into actual geometric edges
        if (this.pendingConnections && this.pendingConnections.length > 0) {
            this.arrange();
        }

        // 2. Apply a dummy stagger to strictly overlapping [0,0] nodes. 
        // This mathematically fools bpmn-js's PathRouter into rendering the requisite <di:waypoints>,
        // preventing it from aborting the XML SequenceFlow export entirely.
        let staggerIndex = 1; // start at 1 so first node can stay at 0,0
        for (const el of this.elements) {
            if (el.position.x === 0 && el.position.y === 0) {
                el.position.x = staggerIndex * 150;
                el.position.y = staggerIndex * 120;
                // Force an update to instantly commit the dummy bounds
                el.updateMatrixWorld(true);
                staggerIndex++;
            }
        }

        // Pass 1: Baseline BFS Topology Alignment
        
        // 1. Export the diagram's internal state to a sterile BPMN XML string
        const exporter = new BpmnExporter();
        const xmlContent = await exporter.export(this);

        // 2 & 3. Feed the XML to BpmnToFluentConverter to generate the mathematical layout
        const converter = new BpmnToFluentConverter();
        const layoutScript = converter.convert(xmlContent, { stage: 'lanes' });

        // Safely dispose the current visual diagram elements before recreating them
        this.clear();

        // 4. Execute the generated JS string internally against the live diagram instance
        const layoutFunction = new Function('diagram', `
            try {
                ${layoutScript}
            } catch (err) {
                console.error("Error executing autoLayout topology script:", err);
            }
        `);
        
        layoutFunction(this);

        // Pass 2: Explicit Dependency-Sorted Overrides
        if (overrides && overrides.length > 0) {
            // Topologically sort based on relativeToId to prevent stranded elements
            const sortedOverrides = [];
            const visited = new Set();
            const visiting = new Set();
            
            const overrideMap = new Map();
            overrides.forEach(o => overrideMap.set(o.elementId, o));
            
            const visit = (elementId) => {
                if (visited.has(elementId)) return;
                if (visiting.has(elementId)) {
                    console.warn(`Cycle detected in autoLayout overrides for elementId: ${elementId}`);
                    return;
                }
                visiting.add(elementId);
                
                const override = overrideMap.get(elementId);
                if (override && override.relativeToId && overrideMap.has(override.relativeToId)) {
                    visit(override.relativeToId);
                }
                
                visiting.delete(elementId);
                visited.add(elementId);
                if (override) sortedOverrides.push(override);
            };
            
            overrides.forEach(o => visit(o.elementId));

            // Apply overrides sequentially
            for (const override of sortedOverrides) {
                const element = this.getElementById(override.elementId);
                if (element && typeof element[override.placementCommand] === 'function') {
                    element[override.placementCommand](override.relativeToId);
                } else if (!element) {
                    console.warn(`autoLayout constraint failed: Element ${override.elementId} not found`);
                }
            }
        }

        // Finalize routing and resolve overlaps mathematically
        this.arrange();
        this.resolveOverlaps();
    }

    // --------------------------------------------------
    // BPMN Diagram Dimensions
    // --------------------------------------------------
    static get Dimensions() {
        return BPMN_DIMS;
    }

    static get Colors() {
        return BPMN_COLORS;
    }

    // --------------------------------------------------
    // Add BPMN Elements
    // --------------------------------------------------

    // Swimlanes (Pools / Lanes)
    addSwimlane(elementId, width = 100, height = 100) {
        // Swimlanes are foundational backgrounds, meaning they must sit beneath all interactive nodes.
        // We will default their local z-index extremely low (e.g. -5).
        const _el = this.addElement(new Element(elementId, new SwimlaneShape(width, height)));
        _el.semanticType = 'swimlane';

        // Attach the 1px stroke outline which the SwimlaneShape constructed
        if (_el.shape.lineSegments) {
            _el.add(_el.shape.lineSegments);
        }

        // Disable face-camera for swimlanes so they truly act like flat bounding boxes
        _el.textStyle = {
            fontSize: BPMN_DIMS.FONT_SIZE_ANNOTATION,
            align: 'center',
            offset: new THREE.Vector3(0, 0, 1),
            faceCamera: false
        };
        return _el;
    }

    // Start Events
    addStartEvent(elementId, width = BPMN_DIMS.EVENT_SIZE, height = BPMN_DIMS.EVENT_SIZE) {
        const _el = this.addElement(new Element(elementId, new CircleShape(width, height)));
        _el.semanticType = 'start-event';
        _el.bpmnType = 'bpmn:StartEvent';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_EVENT, align: BPMN_DIMS.TEXT_ALIGN_EVENT, offset: new THREE.Vector3(0, -(height / 2) - BPMN_DIMS.LABEL_GAP_BELOW, 3), vAlign: 'top', faceCamera: BPMN_DIMS.FACE_CAMERA_EVENT };
        return _el;
    }

    addMessageStartEvent(elementId, width = BPMN_DIMS.EVENT_SIZE, height = BPMN_DIMS.EVENT_SIZE) {
        const _el = this.addElement(new Element(elementId, new CircleShape(width, height)))
            .addIcon(messageStart, 'center', BPMN_DIMS.ICON_SIZE_MEDIUM);
        _el.semanticType = 'start-event';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_EVENT, align: BPMN_DIMS.TEXT_ALIGN_EVENT, offset: new THREE.Vector3(0, -(height / 2) - BPMN_DIMS.LABEL_GAP_BELOW, 3), vAlign: 'top', faceCamera: BPMN_DIMS.FACE_CAMERA_EVENT };
        return _el;
    }

    addTimerStartEvent(elementId, width = BPMN_DIMS.EVENT_SIZE, height = BPMN_DIMS.EVENT_SIZE) {
        const _el = this.addElement(new Element(elementId, new CircleShape(width, height)))
            .addIcon(timer, 'center', BPMN_DIMS.ICON_SIZE_LARGE);
        _el.semanticType = 'start-event';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_EVENT, align: BPMN_DIMS.TEXT_ALIGN_EVENT, offset: new THREE.Vector3(0, -(height / 2) - BPMN_DIMS.LABEL_GAP_BELOW, 3), vAlign: 'top', faceCamera: BPMN_DIMS.FACE_CAMERA_EVENT };
        return _el;
    }

    addConditionalStartEvent(elementId, width = BPMN_DIMS.EVENT_SIZE, height = BPMN_DIMS.EVENT_SIZE) {
        const _el = this.addElement(new Element(elementId, new CircleShape(width, height)))
            .addIcon(conditional, 'center', BPMN_DIMS.ICON_SIZE_MEDIUM);
        _el.semanticType = 'start-event';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_EVENT, align: BPMN_DIMS.TEXT_ALIGN_EVENT, offset: new THREE.Vector3(0, -(height / 2) - BPMN_DIMS.LABEL_GAP_BELOW, 3), vAlign: 'top', faceCamera: BPMN_DIMS.FACE_CAMERA_EVENT };
        return _el;
    }

    addSignalStartEvent(elementId, width = BPMN_DIMS.EVENT_SIZE, height = BPMN_DIMS.EVENT_SIZE) {
        const _el = this.addElement(new Element(elementId, new CircleShape(width, height)))
            .addIcon(signalStart, 'center', BPMN_DIMS.ICON_SIZE_MEDIUM);
        _el.semanticType = 'start-event';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_EVENT, align: BPMN_DIMS.TEXT_ALIGN_EVENT, offset: new THREE.Vector3(0, -(height / 2) - BPMN_DIMS.LABEL_GAP_BELOW, 3), vAlign: 'top', faceCamera: BPMN_DIMS.FACE_CAMERA_EVENT };
        return _el;
    }

    // Intermediate Events
    addIntermediateEvent(elementId, width = BPMN_DIMS.EVENT_SIZE, height = BPMN_DIMS.EVENT_SIZE) {
        const _el = this.addElement(new Element(elementId, new CircleShape(width, height)))
            .addIcon(intermediate, 'center', BPMN_DIMS.ICON_SIZE_LARGE);
        _el.semanticType = 'event';
        _el.bpmnType = 'bpmn:IntermediateCatchEvent';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_EVENT, align: BPMN_DIMS.TEXT_ALIGN_EVENT, offset: new THREE.Vector3(0, -(height / 2) - BPMN_DIMS.LABEL_GAP_BELOW, 3), vAlign: 'top', faceCamera: BPMN_DIMS.FACE_CAMERA_EVENT };
        return _el;
    }

    addIntermediateMessageCatchEvent(elementId, width = BPMN_DIMS.EVENT_SIZE, height = BPMN_DIMS.EVENT_SIZE) {
        const _el = this.addElement(new Element(elementId, new CircleShape(width, height)))
            .addIcon(intermediateReceive, 'center', BPMN_DIMS.ICON_SIZE_LARGE);
        _el.semanticType = 'event';
        _el.bpmnType = 'bpmn:IntermediateCatchEvent';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_EVENT, align: BPMN_DIMS.TEXT_ALIGN_EVENT, offset: new THREE.Vector3(0, -(height / 2) - BPMN_DIMS.LABEL_GAP_BELOW, 3), vAlign: 'top', faceCamera: BPMN_DIMS.FACE_CAMERA_EVENT };
        return _el;
    }

    addIntermediateMessageThrowEvent(elementId, width = BPMN_DIMS.EVENT_SIZE, height = BPMN_DIMS.EVENT_SIZE) {
        const _el = this.addElement(new Element(elementId, new CircleShape(width, height)))
            .addIcon(intermediateSend, 'center', BPMN_DIMS.ICON_SIZE_LARGE);
        _el.semanticType = 'event';
        _el.bpmnType = 'bpmn:IntermediateThrowEvent';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_EVENT, align: BPMN_DIMS.TEXT_ALIGN_EVENT, offset: new THREE.Vector3(0, -(height / 2) - BPMN_DIMS.LABEL_GAP_BELOW, 3), vAlign: 'top', faceCamera: BPMN_DIMS.FACE_CAMERA_EVENT };
        return _el;
    }

    addIntermediateTimerEvent(elementId, width = BPMN_DIMS.EVENT_SIZE, height = BPMN_DIMS.EVENT_SIZE) {
        const _el = this.addElement(new Element(elementId, new CircleShape(width, height)))
            .addIcon(intermediateTimer, 'center', BPMN_DIMS.ICON_SIZE_LARGE);
        _el.semanticType = 'event';
        _el.bpmnType = 'bpmn:IntermediateCatchEvent';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_EVENT, align: BPMN_DIMS.TEXT_ALIGN_EVENT, offset: new THREE.Vector3(0, -(height / 2) - BPMN_DIMS.LABEL_GAP_BELOW, 3), vAlign: 'top', faceCamera: BPMN_DIMS.FACE_CAMERA_EVENT };
        return _el;
    }

    addIntermediateEscalationEvent(elementId, width = BPMN_DIMS.EVENT_SIZE, height = BPMN_DIMS.EVENT_SIZE) {
        const _el = this.addElement(new Element(elementId, new CircleShape(width, height)))
            .addIcon(intermediateEscalation, 'center', BPMN_DIMS.ICON_SIZE_LARGE);
        _el.semanticType = 'event';
        _el.bpmnType = 'bpmn:IntermediateThrowEvent';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_EVENT, align: BPMN_DIMS.TEXT_ALIGN_EVENT, offset: new THREE.Vector3(0, -(height / 2) - BPMN_DIMS.LABEL_GAP_BELOW, 3), vAlign: 'top', faceCamera: BPMN_DIMS.FACE_CAMERA_EVENT };
        return _el;
    }

    addIntermediateConditionalEvent(elementId, width = BPMN_DIMS.EVENT_SIZE, height = BPMN_DIMS.EVENT_SIZE) {
        const _el = this.addElement(new Element(elementId, new CircleShape(width, height)))
            .addIcon(intermediateConditional, 'center', BPMN_DIMS.ICON_SIZE_LARGE);
        _el.semanticType = 'event';
        _el.bpmnType = 'bpmn:IntermediateCatchEvent';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_EVENT, align: BPMN_DIMS.TEXT_ALIGN_EVENT, offset: new THREE.Vector3(0, -(height / 2) - BPMN_DIMS.LABEL_GAP_BELOW, 3), vAlign: 'top', faceCamera: BPMN_DIMS.FACE_CAMERA_EVENT };
        return _el;
    }

    addIntermediateLinkCatchEvent(elementId, width = BPMN_DIMS.EVENT_SIZE, height = BPMN_DIMS.EVENT_SIZE) {
        const _el = this.addElement(new Element(elementId, new CircleShape(width, height)))
            .addIcon(intermediateLinkCatch, 'center', BPMN_DIMS.ICON_SIZE_LARGE);
        _el.semanticType = 'event';
        _el.bpmnType = 'bpmn:IntermediateCatchEvent';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_EVENT, align: BPMN_DIMS.TEXT_ALIGN_EVENT, offset: new THREE.Vector3(0, -(height / 2) - BPMN_DIMS.LABEL_GAP_BELOW, 3), vAlign: 'top', faceCamera: BPMN_DIMS.FACE_CAMERA_EVENT };
        return _el;
    }

    addIntermediateLinkThrowEvent(elementId, width = BPMN_DIMS.EVENT_SIZE, height = BPMN_DIMS.EVENT_SIZE) {
        const _el = this.addElement(new Element(elementId, new CircleShape(width, height)))
            .addIcon(intermediateLinkThrow, 'center', BPMN_DIMS.ICON_SIZE_LARGE);
        _el.semanticType = 'event';
        _el.bpmnType = 'bpmn:IntermediateThrowEvent';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_EVENT, align: BPMN_DIMS.TEXT_ALIGN_EVENT, offset: new THREE.Vector3(0, -(height / 2) - BPMN_DIMS.LABEL_GAP_BELOW, 3), vAlign: 'top', faceCamera: BPMN_DIMS.FACE_CAMERA_EVENT };
        return _el;
    }

    addIntermediateCompensationEvent(elementId, width = BPMN_DIMS.EVENT_SIZE, height = BPMN_DIMS.EVENT_SIZE) {
        const _el = this.addElement(new Element(elementId, new CircleShape(width, height)))
            .addIcon(intermediateCompensation, 'center', BPMN_DIMS.ICON_SIZE_LARGE);
        _el.semanticType = 'event';
        _el.bpmnType = 'bpmn:IntermediateThrowEvent';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_EVENT, align: BPMN_DIMS.TEXT_ALIGN_EVENT, offset: new THREE.Vector3(0, -(height / 2) - BPMN_DIMS.LABEL_GAP_BELOW, 3), vAlign: 'top', faceCamera: BPMN_DIMS.FACE_CAMERA_EVENT };
        return _el;
    }

    addIntermediateSignalCatchEvent(elementId, width = BPMN_DIMS.EVENT_SIZE, height = BPMN_DIMS.EVENT_SIZE) {
        const _el = this.addElement(new Element(elementId, new CircleShape(width, height)))
            .addIcon(intermediateSignalCatch, 'center', BPMN_DIMS.ICON_SIZE_LARGE);
        _el.semanticType = 'event';
        _el.bpmnType = 'bpmn:IntermediateCatchEvent';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_EVENT, align: BPMN_DIMS.TEXT_ALIGN_EVENT, offset: new THREE.Vector3(0, -(height / 2) - BPMN_DIMS.LABEL_GAP_BELOW, 3), vAlign: 'top', faceCamera: BPMN_DIMS.FACE_CAMERA_EVENT };
        return _el;
    }

    addIntermediateSignalThrowEvent(elementId, width = BPMN_DIMS.EVENT_SIZE, height = BPMN_DIMS.EVENT_SIZE) {
        const _el = this.addElement(new Element(elementId, new CircleShape(width, height)))
            .addIcon(intermediateSignalThrow, 'center', BPMN_DIMS.ICON_SIZE_LARGE);
        _el.semanticType = 'event';
        _el.bpmnType = 'bpmn:IntermediateThrowEvent';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_EVENT, align: BPMN_DIMS.TEXT_ALIGN_EVENT, offset: new THREE.Vector3(0, -(height / 2) - BPMN_DIMS.LABEL_GAP_BELOW, 3), vAlign: 'top', faceCamera: BPMN_DIMS.FACE_CAMERA_EVENT };
        return _el;
    }

    // End Events
    addEndEvent(elementId, width = BPMN_DIMS.EVENT_SIZE, height = BPMN_DIMS.EVENT_SIZE) {
        const _el = this.addElement(new Element(elementId, new CircleShape(width, height, BPMN_DIMS.END_EVENT_LINE_WIDTH)));
        _el.semanticType = 'end-event';
        _el.bpmnType = 'bpmn:EndEvent';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_EVENT, align: BPMN_DIMS.TEXT_ALIGN_EVENT, offset: new THREE.Vector3(0, -(height / 2) - BPMN_DIMS.LABEL_GAP_BELOW, 3), vAlign: 'top', faceCamera: BPMN_DIMS.FACE_CAMERA_EVENT };
        return _el;
    }

    addMessageEndEvent(elementId, width = BPMN_DIMS.EVENT_SIZE, height = BPMN_DIMS.EVENT_SIZE) {
        const _el = this.addElement(new Element(elementId, new CircleShape(width, height, BPMN_DIMS.END_EVENT_LINE_WIDTH)))
            .addIcon(messageEnd, 'center', BPMN_DIMS.ICON_SIZE_MEDIUM);
        _el.semanticType = 'end-event';
        _el.bpmnType = 'bpmn:EndEvent';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_EVENT, align: BPMN_DIMS.TEXT_ALIGN_EVENT, offset: new THREE.Vector3(0, -(height / 2) - BPMN_DIMS.LABEL_GAP_BELOW, 3), vAlign: 'top', faceCamera: BPMN_DIMS.FACE_CAMERA_EVENT };
        return _el;
    }

    addEscalationEndEvent(elementId, width = BPMN_DIMS.EVENT_SIZE, height = BPMN_DIMS.EVENT_SIZE) {
        const _el = this.addElement(new Element(elementId, new CircleShape(width, height, BPMN_DIMS.END_EVENT_LINE_WIDTH)))
            .addIcon(escalation, 'center', BPMN_DIMS.ICON_SIZE_MEDIUM);
        _el.semanticType = 'end-event';
        _el.bpmnType = 'bpmn:EndEvent';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_EVENT, align: BPMN_DIMS.TEXT_ALIGN_EVENT, offset: new THREE.Vector3(0, -(height / 2) - BPMN_DIMS.LABEL_GAP_BELOW, 3), vAlign: 'top', faceCamera: BPMN_DIMS.FACE_CAMERA_EVENT };
        return _el;
    }

    addErrorEndEvent(elementId, width = BPMN_DIMS.EVENT_SIZE, height = BPMN_DIMS.EVENT_SIZE) {
        const _el = this.addElement(new Element(elementId, new CircleShape(width, height, BPMN_DIMS.END_EVENT_LINE_WIDTH)))
            .addIcon(error, 'center', BPMN_DIMS.ICON_SIZE_MEDIUM);
        _el.semanticType = 'end-event';
        _el.bpmnType = 'bpmn:EndEvent';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_EVENT, align: BPMN_DIMS.TEXT_ALIGN_EVENT, offset: new THREE.Vector3(0, -(height / 2) - BPMN_DIMS.LABEL_GAP_BELOW, 3), vAlign: 'top', faceCamera: BPMN_DIMS.FACE_CAMERA_EVENT };
        return _el;
    }

    addCompensateEndEvent(elementId, width = BPMN_DIMS.EVENT_SIZE, height = BPMN_DIMS.EVENT_SIZE) {
        const _el = this.addElement(new Element(elementId, new CircleShape(width, height, BPMN_DIMS.END_EVENT_LINE_WIDTH)))
            .addIcon(compensation, 'center', BPMN_DIMS.ICON_SIZE_MEDIUM);
        _el.semanticType = 'end-event';
        _el.bpmnType = 'bpmn:EndEvent';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_EVENT, align: BPMN_DIMS.TEXT_ALIGN_EVENT, offset: new THREE.Vector3(0, -(height / 2) - BPMN_DIMS.LABEL_GAP_BELOW, 3), vAlign: 'top', faceCamera: BPMN_DIMS.FACE_CAMERA_EVENT };
        return _el;
    }

    addSignalEndEvent(elementId, width = BPMN_DIMS.EVENT_SIZE, height = BPMN_DIMS.EVENT_SIZE) {
        const _el = this.addElement(new Element(elementId, new CircleShape(width, height, BPMN_DIMS.END_EVENT_LINE_WIDTH)))
            .addIcon(signalEnd, 'center', BPMN_DIMS.ICON_SIZE_MEDIUM);
        _el.semanticType = 'end-event';
        _el.bpmnType = 'bpmn:EndEvent';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_EVENT, align: BPMN_DIMS.TEXT_ALIGN_EVENT, offset: new THREE.Vector3(0, -(height / 2) - BPMN_DIMS.LABEL_GAP_BELOW, 3), vAlign: 'top', faceCamera: BPMN_DIMS.FACE_CAMERA_EVENT };
        return _el;
    }

    addTerminateEndEvent(elementId, width = BPMN_DIMS.EVENT_SIZE, height = BPMN_DIMS.EVENT_SIZE) {
        const _el = this.addElement(new Element(elementId, new CircleShape(width, height, BPMN_DIMS.END_EVENT_LINE_WIDTH)))
            .addIcon(terminate, 'center', BPMN_DIMS.ICON_SIZE_MEDIUM);
        _el.semanticType = 'end-event';
        _el.bpmnType = 'bpmn:EndEvent';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_EVENT, align: BPMN_DIMS.TEXT_ALIGN_EVENT, offset: new THREE.Vector3(0, -(height / 2) - BPMN_DIMS.LABEL_GAP_BELOW, 3), vAlign: 'top', faceCamera: BPMN_DIMS.FACE_CAMERA_EVENT };
        return _el;
    }


    // Tasks
    addSubProcess(elementId, width = BPMN_DIMS.TASK_WIDTH, height = BPMN_DIMS.TASK_HEIGHT, isExpanded = false) {
        const _el = this.addElement(new Element(elementId, new RoundedRectangleShape(width, height)));
        _el.semanticType = 'subprocess';
        _el.bpmnType = 'bpmn:SubProcess';

        if (isExpanded) {
            _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_TASK, align: 'top-left', offset: { x: 5, y: -5, z: 0 }, faceCamera: false };
        } else {
            _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_TASK, align: BPMN_DIMS.TEXT_ALIGN_TASK, offset: BPMN_DIMS.TEXT_OFFSET_DEFAULT, faceCamera: BPMN_DIMS.FACE_CAMERA_TASK };
            _el.addIcon(subProcessMarker, 'bottom', BPMN_DIMS.ICON_SIZE_SMALL);
        }
        return _el;
    }

    addCallActivity(elementId, width = BPMN_DIMS.TASK_WIDTH, height = BPMN_DIMS.TASK_HEIGHT) {
        const _el = this.addElement(new Element(elementId, new RoundedRectangleShape(width, height, 10, 3)));
        _el.semanticType = 'callactivity';
        _el.bpmnType = 'bpmn:CallActivity';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_TASK, align: BPMN_DIMS.TEXT_ALIGN_TASK, offset: BPMN_DIMS.TEXT_OFFSET_DEFAULT, faceCamera: BPMN_DIMS.FACE_CAMERA_TASK };
        return _el;
    }

    addTask(elementId, width = BPMN_DIMS.TASK_WIDTH, height = BPMN_DIMS.TASK_HEIGHT) {
        const _el = this.addElement(new Element(elementId, new RoundedRectangleShape(width, height)));
        _el.semanticType = 'task';
        _el.bpmnType = 'bpmn:Task';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_TASK, align: BPMN_DIMS.TEXT_ALIGN_TASK, offset: BPMN_DIMS.TEXT_OFFSET_DEFAULT, faceCamera: BPMN_DIMS.FACE_CAMERA_TASK };
        return _el;
    }

    addManualTask(elementId, width = BPMN_DIMS.TASK_WIDTH, height = BPMN_DIMS.TASK_HEIGHT) {
        const _el = this.addElement(new Element(elementId, new RoundedRectangleShape(width, height)))
            .addIcon(manual, 'top-left', BPMN_DIMS.ICON_SIZE_SMALL);
        _el.semanticType = 'task';
        _el.bpmnType = 'bpmn:ManualTask';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_TASK, align: BPMN_DIMS.TEXT_ALIGN_TASK, offset: BPMN_DIMS.TEXT_OFFSET_DEFAULT, faceCamera: BPMN_DIMS.FACE_CAMERA_TASK };
        return _el;
    }

    addUserTask(elementId, width = BPMN_DIMS.TASK_WIDTH, height = BPMN_DIMS.TASK_HEIGHT) {
        const _el = this.addElement(new Element(elementId, new RoundedRectangleShape(width, height)))
            .addIcon(user, 'top-left', BPMN_DIMS.ICON_SIZE_SMALL);
        _el.semanticType = 'task';
        _el.bpmnType = 'bpmn:UserTask';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_TASK, align: BPMN_DIMS.TEXT_ALIGN_TASK, offset: BPMN_DIMS.TEXT_OFFSET_DEFAULT, faceCamera: BPMN_DIMS.FACE_CAMERA_TASK };
        return _el;
    }

    addScriptTask(elementId, width = BPMN_DIMS.TASK_WIDTH, height = BPMN_DIMS.TASK_HEIGHT) {
        const _el = this.addElement(new Element(elementId, new RoundedRectangleShape(width, height)))
            .addIcon(script, 'top-left', BPMN_DIMS.ICON_SIZE_SMALL);
        _el.semanticType = 'task';
        _el.bpmnType = 'bpmn:ScriptTask';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_TASK, align: BPMN_DIMS.TEXT_ALIGN_TASK, offset: BPMN_DIMS.TEXT_OFFSET_DEFAULT, faceCamera: BPMN_DIMS.FACE_CAMERA_TASK };
        return _el;
    }

    addBusinessRuleTask(elementId, width = BPMN_DIMS.TASK_WIDTH, height = BPMN_DIMS.TASK_HEIGHT) {
        const _el = this.addElement(new Element(elementId, new RoundedRectangleShape(width, height)))
            .addIcon(businessRule, 'top-left', BPMN_DIMS.ICON_SIZE_SMALL);
        _el.semanticType = 'task';
        _el.bpmnType = 'bpmn:BusinessRuleTask';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_TASK, align: BPMN_DIMS.TEXT_ALIGN_TASK, offset: BPMN_DIMS.TEXT_OFFSET_DEFAULT, faceCamera: BPMN_DIMS.FACE_CAMERA_TASK };
        return _el;
    }

    addServiceTask(elementId, width = BPMN_DIMS.TASK_WIDTH, height = BPMN_DIMS.TASK_HEIGHT) {
        const _el = this.addElement(new Element(elementId, new RoundedRectangleShape(width, height)))
            .addIcon(service, 'top-left', BPMN_DIMS.ICON_SIZE_SMALL);
        _el.semanticType = 'task';
        _el.bpmnType = 'bpmn:ServiceTask';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_TASK, align: BPMN_DIMS.TEXT_ALIGN_TASK, offset: BPMN_DIMS.TEXT_OFFSET_DEFAULT, faceCamera: BPMN_DIMS.FACE_CAMERA_TASK };
        return _el;
    }

    addSendTask(elementId, width = BPMN_DIMS.TASK_WIDTH, height = BPMN_DIMS.TASK_HEIGHT) {
        const _el = this.addElement(new Element(elementId, new RoundedRectangleShape(width, height)))
            .addIcon(send, 'top-left', BPMN_DIMS.ICON_SIZE_SMALL);
        _el.semanticType = 'task';
        _el.bpmnType = 'bpmn:SendTask';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_TASK, align: BPMN_DIMS.TEXT_ALIGN_TASK, offset: BPMN_DIMS.TEXT_OFFSET_DEFAULT, faceCamera: BPMN_DIMS.FACE_CAMERA_TASK };
        return _el;
    }

    addReceiveTask(elementId, width = BPMN_DIMS.TASK_WIDTH, height = BPMN_DIMS.TASK_HEIGHT) {
        const _el = this.addElement(new Element(elementId, new RoundedRectangleShape(width, height)))
            .addIcon(receive, 'top-left', BPMN_DIMS.ICON_SIZE_SMALL);
        _el.semanticType = 'task';
        _el.bpmnType = 'bpmn:ReceiveTask';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_TASK, align: BPMN_DIMS.TEXT_ALIGN_TASK, offset: BPMN_DIMS.TEXT_OFFSET_DEFAULT, faceCamera: BPMN_DIMS.FACE_CAMERA_TASK };
        return _el;
    }

    /**
     * Adds an invisible anchor point used primarily for routing "empty" branches
     * and long shortcuts to maintain clean layout without introducing business logic.
     * @param {string} elementId - Unique identifier for the anchor point.
     * @returns {Element} The created anchor point element.
     */
    addAnchorPoint(elementId) {
        const size = BPMN_DIMS.ANCHOR_POINT_SIZE;
        const _el = this.addElement(new Element(elementId, new CircleShape(size, size)));

        // Mark as anchor for special handling in exporter and layout
        _el.semanticType = 'anchor';

        // Highly transparent material
        if (_el.material) {
            _el.material.transparent = true;
            _el.material.opacity = 0.35;
            _el.material.color.setHex(BPMN_COLORS.MUTED);
        }

        return _el;
    }

    // Gateways
    addGateway(elementId, width = BPMN_DIMS.GATEWAY_SIZE, height = BPMN_DIMS.GATEWAY_SIZE) {
        const _el = this.addExclusiveGateway(elementId, width, height);
        _el.semanticType = 'gateway';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_GATEWAY, align: BPMN_DIMS.TEXT_ALIGN_GATEWAY, offset: new THREE.Vector3(0, -(height / 2) - BPMN_DIMS.LABEL_GAP_BELOW, 3), vAlign: 'top', faceCamera: BPMN_DIMS.FACE_CAMERA_GATEWAY };
        return _el;
    }

    addInclusiveGateway(elementId, width = BPMN_DIMS.GATEWAY_SIZE, height = BPMN_DIMS.GATEWAY_SIZE) {
        const _el = this.addElement(new Element(elementId, new DiamondShape(width, height)))
            .addIcon(inclusive, 'center', width);
        _el.semanticType = 'gateway';
        _el.bpmnType = 'bpmn:InclusiveGateway';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_GATEWAY, align: BPMN_DIMS.TEXT_ALIGN_GATEWAY, offset: new THREE.Vector3(0, -(height / 2) - BPMN_DIMS.LABEL_GAP_BELOW, 3), vAlign: 'top', faceCamera: BPMN_DIMS.FACE_CAMERA_GATEWAY };
        return _el;
    }

    addExclusiveGateway(elementId, width = BPMN_DIMS.GATEWAY_SIZE, height = BPMN_DIMS.GATEWAY_SIZE) {
        const _el = this.addElement(new Element(elementId, new DiamondShape(width, height)))
            .addIcon(exclusive, 'center', width);
        _el.semanticType = 'gateway';
        _el.bpmnType = 'bpmn:ExclusiveGateway';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_GATEWAY, align: BPMN_DIMS.TEXT_ALIGN_GATEWAY, offset: new THREE.Vector3(0, -(height / 2) - BPMN_DIMS.LABEL_GAP_BELOW, 3), vAlign: 'top', faceCamera: BPMN_DIMS.FACE_CAMERA_GATEWAY };
        return _el;
    }

    addParallelGateway(elementId, width = BPMN_DIMS.GATEWAY_SIZE, height = BPMN_DIMS.GATEWAY_SIZE) {
        const _el = this.addElement(new Element(elementId, new DiamondShape(width, height)))
            .addIcon(parallel, 'center', width);
        _el.semanticType = 'gateway';
        _el.bpmnType = 'bpmn:ParallelGateway';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_GATEWAY, align: BPMN_DIMS.TEXT_ALIGN_GATEWAY, offset: new THREE.Vector3(0, -(height / 2) - BPMN_DIMS.LABEL_GAP_BELOW, 3), vAlign: 'top', faceCamera: BPMN_DIMS.FACE_CAMERA_GATEWAY };
        return _el;
    }

    addEventBasedGateway(elementId, width = BPMN_DIMS.GATEWAY_SIZE, height = BPMN_DIMS.GATEWAY_SIZE) {
        const _el = this.addElement(new Element(elementId, new DiamondShape(width, height)))
            .addIcon(eventBased, 'center', width);
        _el.semanticType = 'gateway';
        _el.bpmnType = 'bpmn:EventBasedGateway';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_GATEWAY, align: BPMN_DIMS.TEXT_ALIGN_GATEWAY, offset: new THREE.Vector3(0, -(height / 2) - BPMN_DIMS.LABEL_GAP_BELOW, 3), vAlign: 'top', faceCamera: BPMN_DIMS.FACE_CAMERA_GATEWAY };
        return _el;
    }

    addComplexGateway(elementId, width = BPMN_DIMS.GATEWAY_SIZE, height = BPMN_DIMS.GATEWAY_SIZE) {
        const _el = this.addElement(new Element(elementId, new DiamondShape(width, height)))
            .addIcon(complex, 'center', width);
        _el.semanticType = 'gateway';
        _el.bpmnType = 'bpmn:ComplexGateway';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_GATEWAY, align: BPMN_DIMS.TEXT_ALIGN_GATEWAY, offset: new THREE.Vector3(0, -(height / 2) - BPMN_DIMS.LABEL_GAP_BELOW, 3), vAlign: 'top', faceCamera: BPMN_DIMS.FACE_CAMERA_GATEWAY };
        return _el;
    }

    // Text Annotations
    addTextAnnotation(elementId, text, width = BPMN_DIMS.TEXT_ANNOTATION_WIDTH, height = BPMN_DIMS.TEXT_ANNOTATION_HEIGHT) {
        const _el = this.addElement(new Element(elementId, new TextAnnotationShape(width, height)));
        _el.semanticType = 'annotation';
        _el.textStyle = { fontSize: BPMN_DIMS.FONT_SIZE_ANNOTATION, align: BPMN_DIMS.TEXT_ALIGN_ANNOTATION, offset: BPMN_DIMS.TEXT_OFFSET_ANNOTATION, faceCamera: BPMN_DIMS.FACE_CAMERA_ANNOTATION };
        return _el.addWrappedText(text, null, null, null, width);
    }



    // --------------------------------------------------
    // Add BPMN Connectors
    // --------------------------------------------------

    addFlowConnector(elementId, points) {
        return this.addConnector(new Connector(elementId, new RoundedCornerOrthogonalConnectorShape(points)));
    }

    addAssociationConnector(elementId, points) {
        return this.addConnector(new Connector(elementId, new StraightDottedConnectorShape(points)));
    }

    addStraightArrowConnector(elementId, points) {
        return this.addConnector(new Connector(elementId, new StraightArrowConnectorShape(points)));
    }

    addDashedOrthogonalConnector(elementId, points) {
        return this.addConnector(new Connector(elementId, new DashedOrthogonalConnectorShape(points)));
    }

    // --------------------------------------------------
    // Import BPMN Diagram from .bpmn file (XML)
    // --------------------------------------------------

    import(file) {
        if (!file) {
            console.error('No file provided for import.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            if (file.name.endsWith('.bpmn')) {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(event.target.result, "text/xml");
                this.buildDiagram(xmlDoc);
            } else {
                console.warn('File format not supported.');
            }
        };
        reader.readAsText(file);
    }

    buildDiagram(xmlDoc) {
        const bpmnNamespace = "http://www.omg.org/spec/BPMN/20100524/MODEL";
        const bpmndiNamespace = "http://www.omg.org/spec/BPMN/20100524/DI";
        const dcNamespace = "http://www.omg.org/spec/DD/20100524/DC";
        const diNamespace = "http://www.omg.org/spec/DD/20100524/DI";

        // Pre-process BPMNShape bounds to a map
        const layoutMap = {};
        const bpmnDiagrams = xmlDoc.getElementsByTagNameNS(bpmndiNamespace, 'BPMNDiagram');
        const mainDiagram = bpmnDiagrams.length > 0 ? bpmnDiagrams[0] : xmlDoc;
        const bpmnShapes = mainDiagram.getElementsByTagNameNS(bpmndiNamespace, 'BPMNShape');
        for (let i = 0; i < bpmnShapes.length; i++) {
            const bpmnElementId = bpmnShapes[i].getAttribute('bpmnElement');
            const isExpanded = bpmnShapes[i].getAttribute('isExpanded') === 'true';
            const bounds = bpmnShapes[i].getElementsByTagNameNS(dcNamespace, 'Bounds')[0];
            if (bounds) {
                layoutMap[bpmnElementId] = {
                    width: parseFloat(bounds.getAttribute('width')),
                    height: parseFloat(bounds.getAttribute('height')),
                    x: parseFloat(bounds.getAttribute('x')),
                    y: parseFloat(bounds.getAttribute('y')) * (-1),
                    isExpanded: isExpanded
                };
            }
        }

        const getDims = (id) => {
            const layout = layoutMap[id];
            return layout ? { width: layout.width, height: layout.height } : {};
        };
        const getRawLayout = (id) => layoutMap[id] || {};

        // 1. Add Swimlanes and Pools first (so they render securely behind everything else)
        const participants = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'participant');
        for (let i = 0; i < participants.length; i++) {
            const partId = participants[i].getAttribute('id');
            const name = participants[i].getAttribute('name');
            const layout = getRawLayout(partId);
            if (layout.width && layout.height) {
                const el = this.addSwimlane(partId, layout.width, layout.height);
                el.positionAt({
                    x: layout.x + (layout.width / 2),
                    y: layout.y - (layout.height / 2),
                    z: -5 // Sink underneath geometry
                });
                if (name) {
                    // Vertical text pinned to left border
                    const labelOffset = new THREE.Vector3(- (layout.width / 2) + 15, 0, 1);
                    el.addWrappedText(name, labelOffset, BPMN_DIMS.FONT_SIZE_ANNOTATION, 'center', layout.height, 0);
                    // Rotate the text sideways
                    if (el.texts && el.texts.length > 0) {
                        const txtGeo = el.texts[el.texts.length - 1].element;
                        txtGeo.shape.geometry.rotateZ(Math.PI / 2);
                    }
                }
            }
        }

        const lanes = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'lane');
        for (let i = 0; i < lanes.length; i++) {
            const laneId = lanes[i].getAttribute('id');
            const name = lanes[i].getAttribute('name');
            const layout = getRawLayout(laneId);
            if (layout.width && layout.height) {
                const el = this.addSwimlane(laneId, layout.width, layout.height);
                el.positionAt({
                    x: layout.x + (layout.width / 2),
                    y: layout.y - (layout.height / 2),
                    z: -4 // Sink underneath geometry, but slightly above participant pools
                });
                if (name) {
                    // Vertical text pinned to left border
                    const labelOffset = new THREE.Vector3(- (layout.width / 2) + 15, 0, 1);
                    el.addWrappedText(name, labelOffset, BPMN_DIMS.FONT_SIZE_ANNOTATION, 'center', layout.height, 0);
                    // Rotate the text sideways
                    if (el.texts && el.texts.length > 0) {
                        const txtGeo = el.texts[el.texts.length - 1].element;
                        txtGeo.shape.geometry.rotateZ(Math.PI / 2);
                    }
                }
            }
        }

        // Add start events
        const startEvents = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'startEvent');
        for (let i = 0; i < startEvents.length; i++) {
            // Read startEvent id and name
            const startEventId = startEvents[i].getAttribute('id');
            // Read dimensions
            if (!layoutMap[startEventId]) continue;
            const { width, height } = getDims(startEventId);

            // Add start event element to the diagram
            if (startEvents[i].getElementsByTagNameNS(bpmnNamespace, 'messageEventDefinition').length > 0) {
                this.addMessageStartEvent(startEventId, width, height);
            } else if (startEvents[i].getElementsByTagNameNS(bpmnNamespace, 'timerEventDefinition').length > 0) {
                this.addTimerStartEvent(startEventId, width, height);
            } else if (startEvents[i].getElementsByTagNameNS(bpmnNamespace, 'conditionalEventDefinition').length > 0) {
                this.addConditionalStartEvent(startEventId, width, height);
            } else if (startEvents[i].getElementsByTagNameNS(bpmnNamespace, 'signalEventDefinition').length > 0) {
                this.addSignalStartEvent(startEventId, width, height);
            } else {
                // Simple start event
                this.addStartEvent(startEventId, width, height);
            }
        }

        // Add end events
        const endEvents = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'endEvent');
        for (let i = 0; i < endEvents.length; i++) {
            // Read endEvent id and name
            const endEventId = endEvents[i].getAttribute('id');
            if (!layoutMap[endEventId]) continue;
            
            const name = endEvents[i].getAttribute('name');
            // Read endEvent incoming[] and outgoing[]
            const incoming = endEvents[i].getElementsByTagNameNS(bpmnNamespace, 'incoming');
            const outgoing = endEvents[i].getElementsByTagNameNS(bpmnNamespace, 'outgoing');

            // Add end event element to the diagram
            if (endEvents[i].getElementsByTagNameNS(bpmnNamespace, 'messageEventDefinition').length > 0) {
                this.addMessageEndEvent(endEventId);
            } else if (endEvents[i].getElementsByTagNameNS(bpmnNamespace, 'escalationEventDefinition').length > 0) {
                this.addEscalationEndEvent(endEventId);
            } else if (endEvents[i].getElementsByTagNameNS(bpmnNamespace, 'errorEventDefinition').length > 0) {
                this.addErrorEndEvent(endEventId);
            } else if (endEvents[i].getElementsByTagNameNS(bpmnNamespace, 'compensateEventDefinition').length > 0) {
                this.addCompensateEndEvent(endEventId);
            } else if (endEvents[i].getElementsByTagNameNS(bpmnNamespace, 'signalEventDefinition').length > 0) {
                this.addSignalEndEvent(endEventId);
            } else if (endEvents[i].getElementsByTagNameNS(bpmnNamespace, 'terminateEventDefinition').length > 0) {
                this.addTerminateEndEvent(endEventId);
            } else {
                // Simple end event
                this.addEndEvent(endEventId);
            }
        }


        // Add intermediate catch events
        const intermediateCatchEvents = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'intermediateCatchEvent');
        for (let i = 0; i < intermediateCatchEvents.length; i++) {
            // Read intermediateCatchEvent id and name
            const intermediateCatchEventId = intermediateCatchEvents[i].getAttribute('id');
            const name = intermediateCatchEvents[i].getAttribute('name');

            // Read dimensions
            if (!layoutMap[intermediateCatchEventId]) continue;
            const { width, height } = getDims(intermediateCatchEventId);

            // Add intermediate catch event element to the diagram
            if (intermediateCatchEvents[i].getElementsByTagNameNS(bpmnNamespace, 'messageEventDefinition').length > 0) {
                this.addIntermediateMessageCatchEvent(intermediateCatchEventId);
            } else if (intermediateCatchEvents[i].getElementsByTagNameNS(bpmnNamespace, 'timerEventDefinition').length > 0) {
                this.addIntermediateTimerEvent(intermediateCatchEventId);
            } else if (intermediateCatchEvents[i].getElementsByTagNameNS(bpmnNamespace, 'conditionalEventDefinition').length > 0) {
                this.addIntermediateConditionalEvent(intermediateCatchEventId);
            } else if (intermediateCatchEvents[i].getElementsByTagNameNS(bpmnNamespace, 'linkEventDefinition').length > 0) {
                this.addIntermediateLinkCatchEvent(intermediateCatchEventId);
            } else if (intermediateCatchEvents[i].getElementsByTagNameNS(bpmnNamespace, 'signalEventDefinition').length > 0) {
                this.addIntermediateSignalCatchEvent(intermediateCatchEventId);
            } else {
                // Simple intermediate catch event
                this.addIntermediateEvent(intermediateCatchEventId);
            }
        }

        // Add intermediate throw events
        const intermediateThrowEvents = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'intermediateThrowEvent');
        for (let i = 0; i < intermediateThrowEvents.length; i++) {
            // Read intermediateCatchEvent id and name
            const intermediateThrowEventId = intermediateThrowEvents[i].getAttribute('id');
            const name = intermediateThrowEvents[i].getAttribute('name');

            // Read dimensions
            if (!layoutMap[intermediateThrowEventId]) continue;
            const { width, height } = getDims(intermediateThrowEventId);

            // Add intermediate throw event element to the diagram
            if (intermediateThrowEvents[i].getElementsByTagNameNS(bpmnNamespace, 'messageEventDefinition').length > 0) {
                this.addIntermediateMessageThrowEvent(intermediateThrowEventId);
            } else if (intermediateThrowEvents[i].getElementsByTagNameNS(bpmnNamespace, 'escalationEventDefinition').length > 0) {
                this.addIntermediateEscalationEvent(intermediateThrowEventId);
            } else if (intermediateThrowEvents[i].getElementsByTagNameNS(bpmnNamespace, 'linkEventDefinition').length > 0) {
                this.addIntermediateLinkThrowEvent(intermediateThrowEventId);
            } else if (intermediateThrowEvents[i].getElementsByTagNameNS(bpmnNamespace, 'compensateEventDefinition').length > 0) {
                this.addIntermediateCompensationEvent(intermediateThrowEventId);
            } else if (intermediateThrowEvents[i].getElementsByTagNameNS(bpmnNamespace, 'signalEventDefinition').length > 0) {
                this.addIntermediateSignalThrowEvent(intermediateThrowEventId);
            } else {
                // Simple intermediate throw event
                this.addIntermediateEvent(intermediateThrowEventId);
            }
        }






        // Add sub processes
        const subProcesses = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'subProcess');
        for (let i = 0; i < subProcesses.length; i++) {
            const subProcessId = subProcesses[i].getAttribute('id');
            const name = subProcesses[i].getAttribute('name');
            const incoming = subProcesses[i].getElementsByTagNameNS(bpmnNamespace, 'incoming');
            const outgoing = subProcesses[i].getElementsByTagNameNS(bpmnNamespace, 'outgoing');

            const layout = getRawLayout(subProcessId);
            const isExpanded = layout.isExpanded || false;
            
            if (!layoutMap[subProcessId]) continue;

            // Adjust label properties depending on expansion state
            let align = BPMN_DIMS.TEXT_ALIGN_TASK;
            let offset = BPMN_DIMS.TEXT_OFFSET_DEFAULT;
            let vAlign = 'center';
            
            if (isExpanded) {
                align = 'center';
                vAlign = 'top';
                offset = new THREE.Vector3(0, -10, 0); 
            }

            this.addSubProcess(subProcessId, layout.width, layout.height, isExpanded)
                .addWrappedText(name, offset, BPMN_DIMS.FONT_SIZE_TASK, align, layout.width * 0.9, layout.height, vAlign);
        }

        // Add call activities
        const callActivities = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'callActivity');
        for (let i = 0; i < callActivities.length; i++) {
            const callActivityId = callActivities[i].getAttribute('id');
            const name = callActivities[i].getAttribute('name');
            const incoming = callActivities[i].getElementsByTagNameNS(bpmnNamespace, 'incoming');
            const outgoing = callActivities[i].getElementsByTagNameNS(bpmnNamespace, 'outgoing');

            if (!layoutMap[callActivityId]) continue;
            const { width, height } = getDims(callActivityId);
            this.addCallActivity(callActivityId, width, height)
                .addWrappedText(name, BPMN_DIMS.TEXT_OFFSET_DEFAULT, BPMN_DIMS.FONT_SIZE_TASK, BPMN_DIMS.TEXT_ALIGN_TASK);
        }

        // Add tasks
        const tasks = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'task');
        for (let i = 0; i < tasks.length; i++) {
            // Read task id and name
            const taskId = tasks[i].getAttribute('id');
            const name = tasks[i].getAttribute('name');
            // Read task incoming[] and outgoing[]
            const incoming = tasks[i].getElementsByTagNameNS(bpmnNamespace, 'incoming');
            const outgoing = tasks[i].getElementsByTagNameNS(bpmnNamespace, 'outgoing');

            if (!layoutMap[taskId]) continue;
            const { width, height } = getDims(taskId);
            this.addTask(taskId, width, height)
                .addWrappedText(name, BPMN_DIMS.TEXT_OFFSET_DEFAULT, BPMN_DIMS.FONT_SIZE_TASK, BPMN_DIMS.TEXT_ALIGN_TASK);
        }

        // Add manual tasks
        const manualTasks = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'manualTask');
        for (let i = 0; i < manualTasks.length; i++) {
            // Read manualTask id and name
            const manualTaskId = manualTasks[i].getAttribute('id');
            const name = manualTasks[i].getAttribute('name');
            // Read manualTask incoming[] and outgoing[]
            const incoming = manualTasks[i].getElementsByTagNameNS(bpmnNamespace, 'incoming');
            const outgoing = manualTasks[i].getElementsByTagNameNS(bpmnNamespace, 'outgoing');
            if (!layoutMap[manualTaskId]) continue;
            const { width, height } = getDims(manualTaskId);
            this.addManualTask(manualTaskId, width, height)
                .addWrappedText(name, BPMN_DIMS.TEXT_OFFSET_DEFAULT, BPMN_DIMS.FONT_SIZE_TASK, BPMN_DIMS.TEXT_ALIGN_TASK);
        }

        // Add user tasks
        const userTasks = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'userTask');
        for (let i = 0; i < userTasks.length; i++) {
            // Read userTask id and name
            const userTaskId = userTasks[i].getAttribute('id');
            const name = userTasks[i].getAttribute('name');
            // Read userTask incoming[] and outgoing[]
            const incoming = userTasks[i].getElementsByTagNameNS(bpmnNamespace, 'incoming');
            const outgoing = userTasks[i].getElementsByTagNameNS(bpmnNamespace, 'outgoing');
            if (!layoutMap[userTaskId]) continue;
            const { width, height } = getDims(userTaskId);
            this.addUserTask(userTaskId, width, height)
                .addWrappedText(name, BPMN_DIMS.TEXT_OFFSET_DEFAULT, BPMN_DIMS.FONT_SIZE_TASK, BPMN_DIMS.TEXT_ALIGN_TASK);
        }

        // Add script tasks
        const scriptTasks = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'scriptTask');
        for (let i = 0; i < scriptTasks.length; i++) {
            // Read scriptTask id and name
            const scriptTaskId = scriptTasks[i].getAttribute('id');
            const name = scriptTasks[i].getAttribute('name');
            // Read scriptTask incoming[] and outgoing[]
            const incoming = scriptTasks[i].getElementsByTagNameNS(bpmnNamespace, 'incoming');
            const outgoing = scriptTasks[i].getElementsByTagNameNS(bpmnNamespace, 'outgoing');
            if (!layoutMap[scriptTaskId]) continue;
            const { width, height } = getDims(scriptTaskId);
            this.addScriptTask(scriptTaskId, width, height)
                .addWrappedText(name, BPMN_DIMS.TEXT_OFFSET_DEFAULT, BPMN_DIMS.FONT_SIZE_TASK, BPMN_DIMS.TEXT_ALIGN_TASK);
        }

        // Add business rule tasks
        const businessRuleTasks = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'businessRuleTask');
        for (let i = 0; i < businessRuleTasks.length; i++) {
            // Read businessRuleTask id and name
            const businessRuleTaskId = businessRuleTasks[i].getAttribute('id');
            const name = businessRuleTasks[i].getAttribute('name');
            // Read businessRuleTask incoming[] and outgoing[]
            const incoming = businessRuleTasks[i].getElementsByTagNameNS(bpmnNamespace, 'incoming');
            const outgoing = businessRuleTasks[i].getElementsByTagNameNS(bpmnNamespace, 'outgoing');
            if (!layoutMap[businessRuleTaskId]) continue;
            const { width, height } = getDims(businessRuleTaskId);
            this.addBusinessRuleTask(businessRuleTaskId, width, height)
                .addWrappedText(name, BPMN_DIMS.TEXT_OFFSET_DEFAULT, BPMN_DIMS.FONT_SIZE_TASK, BPMN_DIMS.TEXT_ALIGN_TASK);
        }

        // Add service tasks
        const serviceTasks = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'serviceTask');
        for (let i = 0; i < serviceTasks.length; i++) {
            // Read serviceTask id and name
            const serviceTaskId = serviceTasks[i].getAttribute('id');
            const name = serviceTasks[i].getAttribute('name');
            // Read serviceTask incoming[] and outgoing[]
            const incoming = serviceTasks[i].getElementsByTagNameNS(bpmnNamespace, 'incoming');
            const outgoing = serviceTasks[i].getElementsByTagNameNS(bpmnNamespace, 'outgoing');
            if (!layoutMap[serviceTaskId]) continue;
            const { width, height } = getDims(serviceTaskId);
            this.addServiceTask(serviceTaskId, width, height)
                .addWrappedText(name, BPMN_DIMS.TEXT_OFFSET_DEFAULT, BPMN_DIMS.FONT_SIZE_TASK, BPMN_DIMS.TEXT_ALIGN_TASK);
        }

        // Add send tasks
        const sendTasks = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'sendTask');
        for (let i = 0; i < sendTasks.length; i++) {
            // Read sendTask id and name
            const sendTaskId = sendTasks[i].getAttribute('id');
            const name = sendTasks[i].getAttribute('name');
            // Read sendTask incoming[] and outgoing[]
            const incoming = sendTasks[i].getElementsByTagNameNS(bpmnNamespace, 'incoming');
            const outgoing = sendTasks[i].getElementsByTagNameNS(bpmnNamespace, 'outgoing');
            if (!layoutMap[sendTaskId]) continue;
            const { width, height } = getDims(sendTaskId);
            this.addSendTask(sendTaskId, width, height)
                .addWrappedText(name, BPMN_DIMS.TEXT_OFFSET_DEFAULT, BPMN_DIMS.FONT_SIZE_TASK, BPMN_DIMS.TEXT_ALIGN_TASK);
        }

        // Add receive tasks
        const receiveTasks = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'receiveTask');
        for (let i = 0; i < receiveTasks.length; i++) {
            // Read receiveTask id and name
            const receiveTaskId = receiveTasks[i].getAttribute('id');
            const name = receiveTasks[i].getAttribute('name');
            // Read receiveTask incoming[] and outgoing[]
            const incoming = receiveTasks[i].getElementsByTagNameNS(bpmnNamespace, 'incoming');
            const outgoing = receiveTasks[i].getElementsByTagNameNS(bpmnNamespace, 'outgoing');
            if (!layoutMap[receiveTaskId]) continue;
            const { width, height } = getDims(receiveTaskId);
            this.addReceiveTask(receiveTaskId, width, height)
                .addWrappedText(name, BPMN_DIMS.TEXT_OFFSET_DEFAULT, BPMN_DIMS.FONT_SIZE_TASK, BPMN_DIMS.TEXT_ALIGN_TASK);
        }

        // Add inclusive gateways
        const inclusiveGateways = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'inclusiveGateway');
        for (let i = 0; i < inclusiveGateways.length; i++) {
            // Read gateway id and name
            const gatewayId = inclusiveGateways[i].getAttribute('id');
            const name = inclusiveGateways[i].getAttribute('name');
            // Read gateway incoming[] and outgoing[]
            const incoming = inclusiveGateways[i].getElementsByTagNameNS(bpmnNamespace, 'incoming');
            const outgoing = inclusiveGateways[i].getElementsByTagNameNS(bpmnNamespace, 'outgoing');

            if (!layoutMap[gatewayId]) continue;
            const { width, height } = getDims(gatewayId);
            this.addInclusiveGateway(gatewayId, width, height);
        }

        // Add exclusive gateways
        const exclusiveGateways = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'exclusiveGateway');
        for (let i = 0; i < exclusiveGateways.length; i++) {
            // Read gateway id and name
            const gatewayId = exclusiveGateways[i].getAttribute('id');
            const name = exclusiveGateways[i].getAttribute('name');
            // Read gateway incoming[] and outgoing[]
            const incoming = exclusiveGateways[i].getElementsByTagNameNS(bpmnNamespace, 'incoming');
            const outgoing = exclusiveGateways[i].getElementsByTagNameNS(bpmnNamespace, 'outgoing');

            if (!layoutMap[gatewayId]) continue;
            const { width, height } = getDims(gatewayId);
            this.addExclusiveGateway(gatewayId, width, height);
        }

        // Add parallel gateways
        const parallelGateways = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'parallelGateway');
        for (let i = 0; i < parallelGateways.length; i++) {
            // Read gateway id and name
            const gatewayId = parallelGateways[i].getAttribute('id');
            const name = parallelGateways[i].getAttribute('name');
            // Read gateway incoming[] and outgoing[]
            const incoming = parallelGateways[i].getElementsByTagNameNS(bpmnNamespace, 'incoming');
            const outgoing = parallelGateways[i].getElementsByTagNameNS(bpmnNamespace, 'outgoing');

            if (!layoutMap[gatewayId]) continue;
            const { width, height } = getDims(gatewayId);
            this.addParallelGateway(gatewayId, width, height);
        }

        // Add event-based gateways
        const eventBasedGateways = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'eventBasedGateway');
        for (let i = 0; i < eventBasedGateways.length; i++) {
            // Read gateway id and name
            const gatewayId = eventBasedGateways[i].getAttribute('id');
            const name = eventBasedGateways[i].getAttribute('name');
            // Read gateway incoming[] and outgoing[]
            const incoming = eventBasedGateways[i].getElementsByTagNameNS(bpmnNamespace, 'incoming');
            const outgoing = eventBasedGateways[i].getElementsByTagNameNS(bpmnNamespace, 'outgoing');

            if (!layoutMap[gatewayId]) continue;
            const { width, height } = getDims(gatewayId);
            this.addEventBasedGateway(gatewayId, width, height);
        }

        // Add complex gateways
        const complexGateways = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'complexGateway');
        for (let i = 0; i < complexGateways.length; i++) {
            // Read gateway id and name
            const gatewayId = complexGateways[i].getAttribute('id');
            const name = complexGateways[i].getAttribute('name');
            // Read gateway incoming[] and outgoing[]
            const incoming = complexGateways[i].getElementsByTagNameNS(bpmnNamespace, 'incoming');
            const outgoing = complexGateways[i].getElementsByTagNameNS(bpmnNamespace, 'outgoing');

            if (!layoutMap[gatewayId]) continue;
            const { width, height } = getDims(gatewayId);
            this.addComplexGateway(gatewayId, width, height);
        }

        // Add sequence flows
        const sequenceFlows = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'sequenceFlow');
        for (let i = 0; i < sequenceFlows.length; i++) {
            // Read sequenceFlow id, name, sourceRef, and targetRef
            const sequenceFlowId = sequenceFlows[i].getAttribute('id');
            const name = sequenceFlows[i].getAttribute('name');
            const sourceRef = sequenceFlows[i].getAttribute('sourceRef');
            const targetRef = sequenceFlows[i].getAttribute('targetRef');
        }

        // Add text annotations
        const textAnnotations = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'textAnnotation');
        for (let i = 0; i < textAnnotations.length; i++) {
            const id = textAnnotations[i].getAttribute('id');
            const textNode = textAnnotations[i].getElementsByTagNameNS(bpmnNamespace, 'text')[0];
            const text = textNode ? textNode.textContent : '';

            if (!layoutMap[id]) continue;
            const { width, height } = getDims(id);
            this.addTextAnnotation(id, text, width, height);
        }


        // Place elements on the diagram
        const bpmnShapesToPosition = mainDiagram.getElementsByTagNameNS(bpmndiNamespace, 'BPMNShape');

        for (let i = 0; i < bpmnShapesToPosition.length; i++) {
            const bpmnShape = bpmnShapesToPosition[i];
            const bpmnShapeId = bpmnShape.getAttribute('id');
            const bpmnElementId = bpmnShape.getAttribute('bpmnElement');
            const bounds = bpmnShape.getElementsByTagNameNS(dcNamespace, 'Bounds')[0];
            if (bounds) {
                const x = parseFloat(bounds.getAttribute('x'));
                const y = parseFloat(bounds.getAttribute('y')) * (-1);
                const width = parseFloat(bounds.getAttribute('width'));
                const height = parseFloat(bounds.getAttribute('height'));


                const position = new THREE.Vector3(x + (width / 2), y - (height / 2), 0);
                const element = this.getElementById(bpmnElementId);
                if (!element) {
                    console.warn(`Element with id ${bpmnElementId} not found.`);
                    continue;
                }

                element.positionAt(position);

                // Read label value from the semantic element
                // FIX: use querySelector for safer cross-browser XML node fetching
                let bpmnElement = xmlDoc.getElementById(bpmnElementId);
                // Fallback to traverse if xmlDoc.getElementById doesn't work for DOMParser
                if (!bpmnElement) {
                    const allEls = xmlDoc.getElementsByTagName('*');
                    for (let kk = 0; kk < allEls.length; kk++) {
                        if (allEls[kk].getAttribute('id') === bpmnElementId) {
                            bpmnElement = allEls[kk];
                            break;
                        }
                    }
                }
                const bpmnElementName = bpmnElement ? bpmnElement.getAttribute('name') : null;

                if (bpmnElementName && bpmnElementName.trim() !== '') {
                    let hasExplicitBounds = false;
                    let labelX, labelY, labelWidth, labelHeight;
                    const bpmnLabel = bpmnShape.getElementsByTagNameNS(bpmndiNamespace, 'BPMNLabel');

                    if (bpmnLabel.length > 0) {
                        const labelBounds = bpmnLabel[0].getElementsByTagNameNS(dcNamespace, 'Bounds')[0];
                        if (labelBounds) {
                            labelX = parseFloat(labelBounds.getAttribute('x'));
                            labelY = parseFloat(labelBounds.getAttribute('y')) * (-1);
                            labelWidth = parseFloat(labelBounds.getAttribute('width'));
                            labelHeight = parseFloat(labelBounds.getAttribute('height'));
                            hasExplicitBounds = true;
                        }
                    }

                    const bpmnTagName = bpmnElement.tagName.split(':').pop().toLowerCase();
                    const isTaskOrProcess = bpmnTagName.includes('task') || bpmnTagName === 'subprocess' || bpmnTagName === 'callactivity';
                    const isSwimlane = bpmnTagName === 'participant' || bpmnTagName === 'lane';

                    // Add an external text node ONLY if it's an event/gateway/flow etc.
                    // (Tasks, Subprocesses, and Swimlanes have their internal text added at creation, so we completely ignore external BPMNLabels for them)
                    if (!isTaskOrProcess && !isSwimlane) {
                        let offset;
                        if (hasExplicitBounds) {
                            const labelPosition = new THREE.Vector3(labelX + (labelWidth / 2), labelY - (labelHeight / 2), 0);
                            offset = new THREE.Vector3().subVectors(labelPosition, position);
                            offset.z = 3;
                        } else {
                            // Fallback for unlabeled elements (place text below)
                            labelWidth = width * 2.5; // Wider width allows Camunda-style horizontal text
                            labelHeight = 0; // 0 height prevents vAlign='top' from shifting the text upward, making the offset strictly the top edge
                            offset = new THREE.Vector3(0, -(height / 2 + 5), 3); // Slightly tighter offset matching Camunda
                        }

                        // Determine font size and alignment based on element type
                        let fontSize = BPMN_DIMS.FONT_SIZE_FLOW; // default to flow size
                        let textAlign = BPMN_DIMS.TEXT_ALIGN_FLOW; // default to flow alignment

                        if (bpmnTagName.includes('event')) {
                            fontSize = BPMN_DIMS.FONT_SIZE_EVENT;
                            textAlign = BPMN_DIMS.TEXT_ALIGN_EVENT;
                        } else if (bpmnTagName.includes('gateway')) {
                            fontSize = BPMN_DIMS.FONT_SIZE_GATEWAY;
                            textAlign = BPMN_DIMS.TEXT_ALIGN_GATEWAY;
                        }

                        element.addWrappedText(bpmnElementName, offset, fontSize, textAlign, labelWidth, labelHeight, 'top');
                    }
                }
            }
        }

        // Connect elements with sequence flows
        const bpmnEdges = mainDiagram.getElementsByTagNameNS(bpmndiNamespace, 'BPMNEdge');

        for (let i = 0; i < bpmnEdges.length; i++) {
            const bpmnEdge = bpmnEdges[i];
            const bpmnEdgeId = bpmnEdge.getAttribute('id');
            const bpmnElementId = bpmnEdge.getAttribute('bpmnElement');
            const associations = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'association');
            const messageFlows = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'messageFlow');

            const association = Array.from(associations).find(assoc => assoc.getAttribute('id') === bpmnElementId);
            const messageFlow = Array.from(messageFlows).find(flow => flow.getAttribute('id') === bpmnElementId);
            const sequenceFlow = Array.from(sequenceFlows).find(flow => flow.getAttribute('id') === bpmnElementId);

            const sequenceFlowName = sequenceFlow ? sequenceFlow.getAttribute('name') : (messageFlow ? messageFlow.getAttribute('name') : null);

            // get waypoints
            const waypoints = bpmnEdge.getElementsByTagNameNS(diNamespace, 'waypoint');
            const rawPoints = [];
            for (let j = 0; j < waypoints.length; j++) {
                const waypoint = waypoints[j];
                rawPoints.push({
                    x: parseFloat(waypoint.getAttribute('x')),
                    y: parseFloat(waypoint.getAttribute('y')) * (-1)
                });
            }

            // Snapping logic - skip if it's an association (associations are often diagonal)
            const connectorPoints = [];
            if (rawPoints.length > 0) {
                if (association) {
                    // Direct path for associations
                    rawPoints.forEach(p => connectorPoints.push(new THREE.Vector2(p.x, p.y)));
                } else {
                    // Snap each segment to its dominant axis for flows
                    connectorPoints.push(new THREE.Vector2(rawPoints[0].x, rawPoints[0].y));
                    for (let j = 1; j < rawPoints.length; j++) {
                        const prev = connectorPoints[j - 1];
                        const cur = rawPoints[j];
                        const dx = Math.abs(cur.x - prev.x);
                        const dy = Math.abs(cur.y - prev.y);
                        if (dx >= dy) {
                            connectorPoints.push(new THREE.Vector2(cur.x, prev.y));
                        } else {
                            connectorPoints.push(new THREE.Vector2(prev.x, cur.y));
                        }
                    }
                }
            }

            // Remove intermediate waypoints that are collinear with their neighbours.
            // RoundedCornerOrthogonalConnectorShape treats every intermediate point as
            // a directional turn corner; collinear "pass-through" points produce
            // broken geometry and wrong arrowheads.
            const filteredPoints = connectorPoints.filter((pt, idx) => {
                if (idx === 0 || idx === connectorPoints.length - 1) return true; // always keep endpoints
                const prev = connectorPoints[idx - 1];
                const next = connectorPoints[idx + 1];
                const collinearH = (prev.y === pt.y && pt.y === next.y);
                const collinearV = (prev.x === pt.x && pt.x === next.x);
                return !collinearH && !collinearV;
            });

            // Add connector to the diagram
            let connector;
            if (association) {
                connector = this.addAssociationConnector(bpmnEdgeId, filteredPoints);
            } else if (messageFlow) {
                connector = this.addDashedOrthogonalConnector(bpmnEdgeId, filteredPoints);
            } else {
                connector = this.addFlowConnector(bpmnEdgeId, filteredPoints);
            }

            // Add label to the connector (BPMNLabel)
            let labelX, labelY, labelWidth, labelHeight;
            let hasExplicitBounds = false;

            const bpmnLabel = bpmnEdge.getElementsByTagNameNS(bpmndiNamespace, 'BPMNLabel');
            if (bpmnLabel.length > 0) {
                const labelBounds = bpmnLabel[0].getElementsByTagNameNS(dcNamespace, 'Bounds')[0];
                if (labelBounds) {
                    labelX = parseFloat(labelBounds.getAttribute('x'));
                    labelY = parseFloat(labelBounds.getAttribute('y')) * (-1);
                    labelWidth = parseFloat(labelBounds.getAttribute('width'));
                    labelHeight = parseFloat(labelBounds.getAttribute('height'));
                    hasExplicitBounds = true;
                }
            }

            if (sequenceFlowName) {
                let labelPosition;
                if (hasExplicitBounds) {
                    labelPosition = new THREE.Vector3(labelX + (labelWidth / 2), labelY - (labelHeight / 2), 0);
                } else {
                    // Fallback for unlabeled flow: find the longest segment and use its midpoint
                    if (filteredPoints.length > 1) {
                        let longestSegment = { p1: null, p2: null, length: -1 };
                        for (let k = 1; k < filteredPoints.length; k++) {
                            const p1 = filteredPoints[k - 1];
                            const p2 = filteredPoints[k];
                            const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
                            if (dist > longestSegment.length) {
                                longestSegment = { p1, p2, length: dist };
                            }
                        }

                        labelPosition = new THREE.Vector3(
                            (longestSegment.p1.x + longestSegment.p2.x) / 2,
                            (longestSegment.p1.y + longestSegment.p2.y) / 2,
                            0
                        );

                        // Constrain wrap width to the segment length (with visual bounds) to prevent text overhanging short lines
                        labelWidth = Math.max(60, Math.min(longestSegment.length * 0.9, 150));
                        labelHeight = 0;

                        // Perpendicular shifting:
                        // If vertical, push text slightly to the right so the line doesn't cross it
                        // If horizontal, push text slightly up so it rests on the line
                        const isVertical = Math.abs(longestSegment.p1.x - longestSegment.p2.x) < 0.01;
                        if (isVertical) {
                            labelPosition.x += BPMN_DIMS.FLOW_LABEL_GAP_X;
                            // Reset vAlign='top' math interference by subtracting height if needed, but since labelHeight is 0,
                            // we just shift Y up a bit to perfectly center the letters next to the line midpoint
                            labelPosition.y += BPMN_DIMS.FLOW_LABEL_GAP_Y / 2;
                        } else {
                            labelPosition.y += BPMN_DIMS.FLOW_LABEL_GAP_Y;
                        }
                    } else if (filteredPoints.length === 1) {
                        labelPosition = new THREE.Vector3(filteredPoints[0].x, filteredPoints[0].y + BPMN_DIMS.FLOW_LABEL_GAP_Y, 0);
                        labelWidth = 100;
                        labelHeight = 0;
                    } else {
                        continue;
                    }

                }

                // Create an invisible anchor element to attach the wrapped text to
                const anchorId = 'anchor_' + bpmnEdgeId;
                const anchor = new Element(anchorId, new CircleShape(1, 1));
                anchor.semanticType = 'flow';
                anchor.themable = true;
                this.addElement(anchor).positionAt(labelPosition);
                anchor.visible = false; // Hide the anchor itself

                // Add wrapped text to the anchor
                anchor.addWrappedText(sequenceFlowName, new THREE.Vector3(0, 0, 3), BPMN_DIMS.FONT_SIZE_FLOW, BPMN_DIMS.TEXT_ALIGN_FLOW, labelWidth, labelHeight, 'top');
            }
        }
        this.arrange();
        this.fitScreen();
        this.setTheme(this.theme);
        this.setMode(this.mode);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // OVERLAP RESOLUTION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Post-layout pass that eliminates visual overlaps using two sub-passes:
     *
     *   Sub-pass A (Connector vs. Label):
     *     Flips the label's vertical positionOffset to the opposite side of its
     *     parent element. The element itself is never moved.
     *
     *   Sub-pass B (Element vs. Element):
     *     Iteratively pushes lower-priority branch elements using the fluent
     *     relative positioning API (shiftRightOf / shiftDownOf / shiftUpOf).
     *     Primary path elements are never moved.
     *     Runs up to MAX_ITERATIONS passes, then calls arrange() to reconcile
     *     connector points.
     *
     * Requires elements to have a `branchType` property ('primary' | 'parallel' | 'iterative')
     * set by BpmnToFluentConverter before arrange() is called.
     */
    resolveOverlaps() {
        const MAX_ITERATIONS = 30;

        // ── Helper: element AABB with margin ─────────────────────────────────
        const getAABB = (el, margin = 0) => {
            const size = el.getSize();
            return {
                left: el.position.x - size.x / 2 - margin,
                right: el.position.x + size.x / 2 + margin,
                bottom: el.position.y - size.y / 2 - margin,
                top: el.position.y + size.y / 2 + margin
            };
        };

        const aabbsOverlap = (a, b) =>
            a.left < b.right && a.right > b.left && a.bottom < b.top && a.top > b.bottom;

        // ── Filter to candidate semantic elements ────────────────────────────
        // Only elements explicitly tagged with a branchType by the converter
        // participate in collision detection. Icon sub-elements, swimlane labels,
        // and other internal THREE.js children have no branchType and are excluded.
        const candidateElements = this.elements.filter(el =>
            el.branchType !== undefined &&
            el.semanticType !== 'anchor' &&
            el.semanticType !== 'overlapMarker' &&
            !el.isTextElement &&
            el.visible !== false
        );

        // ── Sub-pass A: Connector vs. Label → flip label ──────────────────────
        try {
            const overlaps = this.detectOverlaps();

            for (const overlap of overlaps.connectorVsLabel) {
                // Resolve the label's owner element id from overlap.labelOwner
                // labelOwner format is either "elementId" or "elementId (flow label)"
                const ownerId = overlap.labelOwner.replace(/ \(flow label\)$/, '');
                const ownerEl = this.elements.find(el => el.elementId === ownerId);
                if (!ownerEl || !ownerEl.texts || ownerEl.texts.length === 0) continue;

                for (const textEntry of ownerEl.texts) {
                    // Flip vertical offset
                    textEntry.positionOffset.y = -textEntry.positionOffset.y;
                    // Re-apply absolute position
                    textEntry.element.positionAt({
                        x: ownerEl.position.x + textEntry.positionOffset.x,
                        y: ownerEl.position.y + textEntry.positionOffset.y,
                        z: textEntry.element.position.z
                    });
                }
            }
        } catch (e) {
            console.warn('[resolveOverlaps] Sub-pass A failed:', e);
        }

        // ── Sub-pass B: Element vs. Element → push ───────────────────────────
        const MARGIN = 4; // extra padding beyond DISTANCE_BETWEEN_ELEMENTS

        let iteration = 0;
        let hadOverlap = true;

        while (hadOverlap && iteration < MAX_ITERATIONS) {
            hadOverlap = false;
            iteration++;

            for (let i = 0; i < candidateElements.length; i++) {
                const elA = candidateElements[i];

                for (let j = i + 1; j < candidateElements.length; j++) {
                    const elB = candidateElements[j];

                    if (!aabbsOverlap(getAABB(elA, MARGIN), getAABB(elB, MARGIN))) continue;
                    hadOverlap = true;

                    // Determine which element to move (lower priority yields)
                    const priorityOf = (el) => {
                        if (el.branchType === 'primary') return 1;
                        if (el.branchType === 'parallel' || el.branchType === 'iterative') return 2;
                        return 3; // untagged / isolated elements
                    };

                    const prioA = priorityOf(elA);
                    const prioB = priorityOf(elB);

                    // If both are primary path, skip — we cannot resolve this
                    if (prioA === 1 && prioB === 1) continue;

                    // The one with higher priority number moves
                    const mover = prioA >= prioB ? elA : elB;
                    const anchor = prioA >= prioB ? elB : elA;

                    // Try horizontal push first (stays in same lane row)
                    mover.shiftRightOf(anchor.elementId);

                    // If the horizontal push still overlaps anchor, fallback to lane push
                    if (aabbsOverlap(getAABB(mover, MARGIN), getAABB(anchor, MARGIN))) {
                        const branchType = mover.branchType;
                        if (branchType === 'iterative') {
                            mover.shiftUpOf(anchor.elementId);
                        } else {
                            // parallel or untagged → push down
                            mover.shiftDownOf(anchor.elementId);
                        }
                    }
                }
            }
        }

        if (iteration >= MAX_ITERATIONS) {
            console.warn(`[resolveOverlaps] Reached max iterations (${MAX_ITERATIONS}). Some overlaps may remain.`);
        }

        // Reconcile all connector points after elements have moved
        this.arrange();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // OVERLAP HIGHLIGHTING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Removes all orange overlap marker elements previously added by highlightOverlaps().
     */
    clearOverlapHighlights() {
        const markers = this.elements.filter(el => el.semanticType === 'overlapMarker');
        for (const marker of markers) {
            this.removeElement(marker.elementId);
        }
    }

    /**
     * Detects all visual overlaps and places a semi-transparent orange rectangle
     * in the scene at every overlap location.
     *
     * Category 1 markers are placed at the label's bounding box.
     * Category 2 markers are placed at the intersection zone between the two segments.
     *
     * Existing markers are cleared before new ones are drawn.
     */
    highlightOverlaps() {
        this.clearOverlapHighlights();

        const overlaps = this.detectOverlaps();
        let markerIndex = 0;

        const ORANGE = 0xf97316;
        const MIN_SIZE = 16; // minimum marker dimension in world units

        const addMarker = (cx, cy, w, h) => {
            const markerId = `__overlapMarker_${markerIndex++}`;
            const width = Math.max(w, MIN_SIZE);
            const height = Math.max(h, MIN_SIZE);

            const el = this.addElement(new Element(markerId, new RoundedRectangleShape(width, height)));
            el.semanticType = 'overlapMarker';
            el.isTextElement = false;
            el.themable = false;

            if (el.material) {
                el.material.transparent = true;
                el.material.opacity = 0.45;
                el.material.color.setHex(ORANGE);
                el.material.depthTest = false; // always render on top
            }

            el.positionAt({ x: cx, y: cy, z: 6 });
            return el;
        };

        // ── Category 1: Connector vs. Label ──────────────────────────────────
        // Place marker at the center of the label's AABB (already computed inside detectOverlaps).
        // We reconstruct the label AABB here from the owning text element position + size.
        for (const overlap of overlaps.connectorVsLabel) {
            // Find the label element described by overlap.labelOwner
            const ownerEl = this.elements.find(el => el.elementId === overlap.labelOwner);
            if (!ownerEl) continue;

            // Look through its texts[] for the matching text element
            for (const textEntry of (ownerEl.texts || [])) {
                const textEl = textEntry.element;
                if (!textEl || !textEl.position) continue;
                try {
                    const size = textEl.getSize();
                    if (!size || size.x === 0) continue;
                    addMarker(textEl.position.x, textEl.position.y, size.x + 10, size.y + 10);
                } catch (e) { /* skip */ }
                break; // one marker per overlap entry
            }
        }

        // ── Category 2: Connector vs. Connector ────────────────────────────────
        // Compute the actual intersection zone for each overlapping pair.
        const getPoints = (conn) => {
            if (conn.sourceElement && conn.targetElement && conn.sourcePosition && conn.targetPosition) {
                try {
                    return conn.constructor.determinePoints(
                        conn.sourceElement,
                        conn.targetElement,
                        conn.sourcePosition,
                        conn.targetPosition,
                        conn.properties?.waypoints,
                        conn.properties?.waypointPorts
                    );
                } catch (e) { return conn.points || []; }
            }
            return conn.points || [];
        };

        for (const overlap of overlaps.connectorVsConnector) {
            const connA = this.connectors.find(c => c.elementId === overlap.connectorA);
            const connB = this.connectors.find(c => c.elementId === overlap.connectorB);
            if (!connA || !connB) continue;

            const ptsA = getPoints(connA);
            const ptsB = getPoints(connB);

            const p1 = ptsA[overlap.segmentA];
            const p2 = ptsA[overlap.segmentA + 1];
            const p3 = ptsB[overlap.segmentB];
            const p4 = ptsB[overlap.segmentB + 1];
            if (!p1 || !p2 || !p3 || !p4) continue;

            const dx1 = p2.x - p1.x, dy1 = p2.y - p1.y;
            const dx2 = p4.x - p3.x, dy2 = p4.y - p3.y;
            const denom = dx1 * dy2 - dy1 * dx2;

            if (Math.abs(denom) > 0.001) {
                // Non-parallel: find the exact crossing point
                const t = ((p3.x - p1.x) * dy2 - (p3.y - p1.y) * dx2) / denom;
                const ix = p1.x + t * dx1;
                const iy = p1.y + t * dy1;
                addMarker(ix, iy, MIN_SIZE, MIN_SIZE);
            } else {
                // Collinear / parallel: find the overlapping range and mark its midpoint
                const isHoriz = Math.abs(dx1) > Math.abs(dy1);
                if (isHoriz) {
                    const overlapMinX = Math.max(Math.min(p1.x, p2.x), Math.min(p3.x, p4.x));
                    const overlapMaxX = Math.min(Math.max(p1.x, p2.x), Math.max(p3.x, p4.x));
                    const sharedY = (p1.y + p3.y) / 2;
                    addMarker((overlapMinX + overlapMaxX) / 2, sharedY, Math.abs(overlapMaxX - overlapMinX), MIN_SIZE);
                } else {
                    const overlapMinY = Math.max(Math.min(p1.y, p2.y), Math.min(p3.y, p4.y));
                    const overlapMaxY = Math.min(Math.max(p1.y, p2.y), Math.max(p3.y, p4.y));
                    const sharedX = (p1.x + p3.x) / 2;
                    addMarker(sharedX, (overlapMinY + overlapMaxY) / 2, MIN_SIZE, Math.abs(overlapMaxY - overlapMinY));
                }
            }
        }

        return overlaps;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // OVERLAP DETECTION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Detects and classifies visual overlaps in the rendered diagram.
     *
     * Category 1: Connector vs. Label — a connector segment intersects a label's bounding box.
     * Category 2: Connector vs. Connector — two connector segments intersect or run collinearly.
     *
     * Uses:
     *   - Cohen-Sutherland AABB clipping for segment-vs-AABB tests.
     *   - Parametric line intersection for segment-vs-segment tests.
     *   - Collinearity + range-overlap detection for parallel overlapping segments.
     *
     * @returns {{ connectorVsLabel: Array, connectorVsConnector: Array }}
     */
    detectOverlaps() {
        const TOLERANCE = 5; // world units – proximity threshold for near-miss connector overlaps

        // ── Helpers ─────────────────────────────────────────────────────────

        /**
         * Safely computes the current connector waypoints from live element positions
         * WITHOUT mutating the connector object or its geometry.
         * Falls back to the stored connector.points if elements are missing.
         */
        const getPoints = (conn) => {
            if (conn.sourceElement && conn.targetElement && conn.sourcePosition && conn.targetPosition) {
                try {
                    // Dynamically import is not available here — use the already-imported Connector class
                    // We access it through the connector's own static method via its constructor
                    return conn.constructor.determinePoints(
                        conn.sourceElement,
                        conn.targetElement,
                        conn.sourcePosition,
                        conn.targetPosition,
                        conn.properties?.waypoints,
                        conn.properties?.waypointPorts
                    );
                } catch (e) {
                    return conn.points || [];
                }
            }
            return conn.points || [];
        };

        const outcode = (x, y, aabb) => {
            let code = 0;
            if (x < aabb.left) code |= 1; // LEFT
            if (x > aabb.right) code |= 2; // RIGHT
            if (y < aabb.bottom) code |= 4; // BOTTOM
            if (y > aabb.top) code |= 8; // TOP
            return code;
        };

        /**
         * Cohen-Sutherland segment-vs-AABB intersection test.
         * Returns true if segment (x1,y1)→(x2,y2) intersects or is inside the AABB.
         */
        const segmentIntersectsAABB = (x1, y1, x2, y2, aabb) => {
            let code1 = outcode(x1, y1, aabb);
            let code2 = outcode(x2, y2, aabb);

            while (true) {
                if (!(code1 | code2)) return true;  // Both inside
                if (code1 & code2) return false; // Both outside same region

                // Pick the outside point
                const codeOut = code1 || code2;
                let x, y;
                const dx = x2 - x1;
                const dy = y2 - y1;

                if (codeOut & 8) { x = x1 + dx * (aabb.top - y1) / dy; y = aabb.top; }
                else if (codeOut & 4) { x = x1 + dx * (aabb.bottom - y1) / dy; y = aabb.bottom; }
                else if (codeOut & 2) { y = y1 + dy * (aabb.right - x1) / dx; x = aabb.right; }
                else { y = y1 + dy * (aabb.left - x1) / dx; x = aabb.left; }

                if (codeOut === code1) { x1 = x; y1 = y; code1 = outcode(x1, y1, aabb); }
                else { x2 = x; y2 = y; code2 = outcode(x2, y2, aabb); }
            }
        };

        /**
         * Parametric segment-vs-segment intersection.
         * Returns true if segments (p1→p2) and (p3→p4) intersect within [0,1].
         * Also returns true for collinear overlapping segments.
         */
        const segmentsIntersect = (p1, p2, p3, p4) => {
            const dx1 = p2.x - p1.x; const dy1 = p2.y - p1.y;
            const dx2 = p4.x - p3.x; const dy2 = p4.y - p3.y;
            const denom = dx1 * dy2 - dy1 * dx2;

            if (Math.abs(denom) > 0.001) {
                // Non-parallel segments — check parametric t/u ∈ [0,1]
                const t = ((p3.x - p1.x) * dy2 - (p3.y - p1.y) * dx2) / denom;
                const u = ((p3.x - p1.x) * dy1 - (p3.y - p1.y) * dx1) / denom;
                return t >= 0 && t <= 1 && u >= 0 && u <= 1;
            }

            // Parallel — check for collinearity (same line) and range overlap
            const cross = (p3.x - p1.x) * dy1 - (p3.y - p1.y) * dx1;
            if (Math.abs(cross) > TOLERANCE) return false; // Parallel but not on same line

            // Collinear — do the projected ranges overlap?
            if (Math.abs(dx1) > Math.abs(dy1)) {
                // Use X axis projection
                const [minA, maxA] = [Math.min(p1.x, p2.x) - TOLERANCE, Math.max(p1.x, p2.x) + TOLERANCE];
                const [minB, maxB] = [Math.min(p3.x, p4.x), Math.max(p3.x, p4.x)];
                return maxB >= minA && maxA >= minB;
            } else {
                // Use Y axis projection
                const [minA, maxA] = [Math.min(p1.y, p2.y) - TOLERANCE, Math.max(p1.y, p2.y) + TOLERANCE];
                const [minB, maxB] = [Math.min(p3.y, p4.y), Math.max(p3.y, p4.y)];
                return maxB >= minA && maxA >= minB;
            }
        };

        /**
         * Builds the AABB for a label element (text element or connector label).
         * Returns null if the element has no position or size.
         */
        const getLabelAABB = (labelEl, padding = TOLERANCE) => {
            if (!labelEl || !labelEl.position) return null;
            try {
                const size = labelEl.getSize();
                if (!size || size.x === 0) return null;
                return {
                    left: labelEl.position.x - size.x / 2 - padding,
                    right: labelEl.position.x + size.x / 2 + padding,
                    bottom: labelEl.position.y - size.y / 2 - padding,
                    top: labelEl.position.y + size.y / 2 + padding
                };
            } catch (e) {
                return null;
            }
        };

        // ── Collect all labels from diagram elements ─────────────────────────
        const allLabels = [];

        // Element name labels (stored in element.texts[])
        for (const el of this.elements) {
            if (el.isTextElement || el.semanticType === 'flow' || el.semanticType === 'anchor') continue;
            for (const textEntry of (el.texts || [])) {
                const textEl = textEntry.element;
                if (!textEl || !textEl.position) continue;
                const aabb = getLabelAABB(textEl);
                if (aabb) allLabels.push({ aabb, ownerName: el.elementId, text: textEl.textContent || '' });
            }
        }

        // Connector labels (connector.labelElement)
        for (const conn of this.connectors) {
            if (conn.labelElement) {
                const aabb = getLabelAABB(conn.labelElement);
                if (aabb) allLabels.push({ aabb, ownerName: conn.elementId + ' (flow label)', text: conn.label || '' });
            }
        }

        // ── Category 1: Connector vs. Label ──────────────────────────────────
        const connectorVsLabel = [];

        for (const conn of this.connectors) {
            const pts = getPoints(conn);
            if (pts.length < 2) continue;

            for (let si = 0; si < pts.length - 1; si++) {
                const p1 = pts[si], p2 = pts[si + 1];

                for (const lbl of allLabels) {
                    // Don't flag a connector against its own label
                    if (lbl.ownerName === conn.elementId + ' (flow label)') continue;

                    if (segmentIntersectsAABB(p1.x, p1.y, p2.x, p2.y, lbl.aabb)) {
                        connectorVsLabel.push({
                            type: 'connector-vs-label',
                            connectorId: conn.elementId,
                            connectorFrom: conn.sourceElement?.elementId || '?',
                            connectorTo: conn.targetElement?.elementId || '?',
                            segmentIndex: si,
                            labelOwner: lbl.ownerName,
                            labelText: lbl.text.replace(/\n/g, ' ')
                        });
                    }
                }
            }
        }

        // ── Category 2: Connector vs. Connector ────────────────────────────────
        const connectorVsConnector = [];
        const seenPairs = new Set();

        for (let ci = 0; ci < this.connectors.length; ci++) {
            const connA = this.connectors[ci];
            const ptsA = getPoints(connA);
            if (ptsA.length < 2) continue;

            for (let cj = ci + 1; cj < this.connectors.length; cj++) {
                const connB = this.connectors[cj];
                const ptsB = getPoints(connB);
                if (ptsB.length < 2) continue;

                outer: for (let si = 0; si < ptsA.length - 1; si++) {
                    for (let sj = 0; sj < ptsB.length - 1; sj++) {
                        if (segmentsIntersect(ptsA[si], ptsA[si + 1], ptsB[sj], ptsB[sj + 1])) {
                            const pairKey = [connA.elementId, connB.elementId].sort().join('||');
                            if (!seenPairs.has(pairKey)) {
                                seenPairs.add(pairKey);
                                connectorVsConnector.push({
                                    type: 'connector-vs-connector',
                                    connectorA: connA.elementId,
                                    fromA: connA.sourceElement?.elementId || '?',
                                    toA: connA.targetElement?.elementId || '?',
                                    connectorB: connB.elementId,
                                    fromB: connB.sourceElement?.elementId || '?',
                                    toB: connB.targetElement?.elementId || '?',
                                    segmentA: si,
                                    segmentB: sj
                                });
                            }
                            break outer;
                        }
                    }
                }
            }
        }

        return { connectorVsLabel, connectorVsConnector };
    }
}

export { BpmnDiagram };
export { BpmnExporter } from './BpmnExporter.js';
export { BpmnToFluentConverter } from './BpmnToFluentConverter.js';
