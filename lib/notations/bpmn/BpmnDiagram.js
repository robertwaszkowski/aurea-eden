import * as THREE from 'three';
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
        const bpmnShapes = xmlDoc.getElementsByTagNameNS(bpmndiNamespace, 'BPMNShape');
        for (let i = 0; i < bpmnShapes.length; i++) {
            const bpmnElementId = bpmnShapes[i].getAttribute('bpmnElement');
            const bounds = bpmnShapes[i].getElementsByTagNameNS(dcNamespace, 'Bounds')[0];
            if (bounds) {
                layoutMap[bpmnElementId] = {
                    width: parseFloat(bounds.getAttribute('width')),
                    height: parseFloat(bounds.getAttribute('height')),
                    x: parseFloat(bounds.getAttribute('x')),
                    y: parseFloat(bounds.getAttribute('y')) * (-1)
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






        // Add tasks
        const tasks = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'task');
        for (let i = 0; i < tasks.length; i++) {
            // Read task id and name
            const taskId = tasks[i].getAttribute('id');
            const name = tasks[i].getAttribute('name');
            // Read task incoming[] and outgoing[]
            const incoming = tasks[i].getElementsByTagNameNS(bpmnNamespace, 'incoming');
            const outgoing = tasks[i].getElementsByTagNameNS(bpmnNamespace, 'outgoing');

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

            const { width, height } = getDims(id);
            this.addTextAnnotation(id, text, width, height);
        }


        // Place elements on the diagram
        const bpmnShapesToPosition = xmlDoc.getElementsByTagNameNS(bpmndiNamespace, 'BPMNShape');

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
        const bpmnEdges = xmlDoc.getElementsByTagNameNS(bpmndiNamespace, 'BPMNEdge');

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
}

export { BpmnDiagram };

