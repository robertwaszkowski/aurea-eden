import * as THREE from 'three';
import { Diagram } from '../diagrams/Diagram.js';
import { Element } from '../elements/Element.js';
import { Connector } from '../connectors/Connector.js';
// Import element shapes
import { CircleShape } from '../shapes/basic/CircleShape.js';
import { RoundedRectangleShape } from '../shapes/basic/RoundedRectangleShape.js';
import { DiamondShape } from '../shapes/basic/DiamondShape.js';
import { TextShape } from '../shapes/text/TextShape.js';
// Import connector shapes
import { RoundedCornerOrthogonalConnectorShape } from '../shapes/connector/RoundedCornerOrthogonalConnectorShape.js';
// Import dimensions
import { BpmnGatewayDimensions, BpmnIconDimensions } from './BpmnDiagramConstants.js';
// Import Activity icons
import manual from '../shapes/icon/bpmn/activities/manual.svg?raw';
import user from '../shapes/icon/bpmn/activities/user.svg?raw';
import script from '../shapes/icon/bpmn/activities/script.svg?raw';
import businessRule from '../shapes/icon/bpmn/activities/business-rule.svg?raw';
import service from '../shapes/icon/bpmn/activities/service.svg?raw';
import send from '../shapes/icon/bpmn/activities/send.svg?raw';
import receive from '../shapes/icon/bpmn/activities/receive.svg?raw';
// Import Gateway icons
import inclusive from '../shapes/icon/bpmn/gateways/inclusive.svg?raw';
import exclusive from '../shapes/icon/bpmn/gateways/exclusive.svg?raw';
import parallel from '../shapes/icon/bpmn/gateways/parallel.svg?raw';
import eventBased from '../shapes/icon/bpmn/gateways/event-based.svg?raw';
import complex from '../shapes/icon/bpmn/gateways/complex.svg?raw';
// Import Event icons
import compensation from '../shapes/icon/bpmn/events/compensation.svg?raw';
import conditional from '../shapes/icon/bpmn/events/conditional.svg?raw';
import error from '../shapes/icon/bpmn/events/error.svg?raw';
import escalation from '../shapes/icon/bpmn/events/escalation.svg?raw';
import intermediate from '../shapes/icon/bpmn/events/intermediate.svg?raw';
import intermediateCompensation from '../shapes/icon/bpmn/events/intermediate-compensation.svg?raw';
import intermediateConditional from '../shapes/icon/bpmn/events/intermediate-conditional.svg?raw';
import intermediateEscalation from '../shapes/icon/bpmn/events/intermediate-escalation.svg?raw';
import intermediateLinkCatch from '../shapes/icon/bpmn/events/intermediate-link-catch.svg?raw';
import intermediateLinkThrow from '../shapes/icon/bpmn/events/intermediate-link-throw.svg?raw';
import intermediateReceive from '../shapes/icon/bpmn/events/intermediate-receive.svg?raw';
import intermediateSend from '../shapes/icon/bpmn/events/intermediate-send.svg?raw';
import intermediateSignalCatch from '../shapes/icon/bpmn/events/intermediate-signal-catch.svg?raw';
import intermediateSignalThrow from '../shapes/icon/bpmn/events/intermediate-signal-throw.svg?raw';
import intermediateTimer from '../shapes/icon/bpmn/events/intermediate-timer.svg?raw';
import messageEnd from '../shapes/icon/bpmn/events/message-end.svg?raw';
import messageStart from '../shapes/icon/bpmn/events/message-start.svg?raw';
import signalEnd from '../shapes/icon/bpmn/events/signal-end.svg?raw';
import signalStart from '../shapes/icon/bpmn/events/signal-start.svg?raw';
import terminate from '../shapes/icon/bpmn/events/terminate.svg?raw';
import timer from '../shapes/icon/bpmn/events/timer.svg?raw';

import { add } from 'tween.js';

class BpmnDiagram extends Diagram {
    constructor(container) {
        super(container);
    }

    // --------------------------------------------------
    // Add BPMN Elements
    // --------------------------------------------------

    // Start Events
    addStartEvent(elementId) {
        return this.addElement( new Element(elementId, new CircleShape()) );
    }

    addMessageStartEvent(elementId) {
        return this.addElement( new Element(elementId, new CircleShape()) )
            .addIcon(messageStart, 'center', BpmnIconDimensions.ICON_SIZE_MEDIUM);
    }

    addTimerStartEvent(elementId) {
        return this.addElement( new Element(elementId, new CircleShape()) )
            .addIcon(timer, 'center', BpmnIconDimensions.ICON_SIZE_LARGE);
    }

    addConditionalStartEvent(elementId) {
        return this.addElement( new Element(elementId, new CircleShape()) )
            .addIcon(conditional, 'center', BpmnIconDimensions.ICON_SIZE_MEDIUM);
    }

    addSignalStartEvent(elementId) {
        return this.addElement( new Element(elementId, new CircleShape()) )
            .addIcon(signalStart, 'center', BpmnIconDimensions.ICON_SIZE_MEDIUM);
    }

    // Intermediate Events
    addIntermediateEvent(elementId) {
        return this.addElement( new Element(elementId, new CircleShape()) )
            .addIcon(intermediate, 'center', BpmnIconDimensions.ICON_SIZE_LARGE);
    }

    addIntermediateMessageCatchEvent(elementId) {
        return this.addElement( new Element(elementId, new CircleShape()) )
            .addIcon(intermediateReceive, 'center', BpmnIconDimensions.ICON_SIZE_LARGE);
    }

    addIntermediateMessageThrowEvent(elementId) {
        return this.addElement( new Element(elementId, new CircleShape()) )
            .addIcon(intermediateSend, 'center', BpmnIconDimensions.ICON_SIZE_LARGE);
    }

    addIntermediateTimerEvent(elementId) {
        return this.addElement( new Element(elementId, new CircleShape()) )
            .addIcon(intermediateTimer, 'center', BpmnIconDimensions.ICON_SIZE_LARGE);
    }

    addIntermediateEscalationEvent(elementId) {
        return this.addElement( new Element(elementId, new CircleShape()) )
            .addIcon(intermediateEscalation, 'center', BpmnIconDimensions.ICON_SIZE_LARGE);
    }

    addIntermediateConditionalEvent(elementId) {
        return this.addElement( new Element(elementId, new CircleShape()) )
            .addIcon(intermediateConditional, 'center', BpmnIconDimensions.ICON_SIZE_LARGE);
    }

    addIntermediateLinkCatchEvent(elementId) {
        return this.addElement( new Element(elementId, new CircleShape()) )
            .addIcon(intermediateLinkCatch, 'center', BpmnIconDimensions.ICON_SIZE_LARGE);
    }

    addIntermediateLinkThrowEvent(elementId) {
        return this.addElement( new Element(elementId, new CircleShape()) )
            .addIcon(intermediateLinkThrow, 'center', BpmnIconDimensions.ICON_SIZE_LARGE);
    }

    addIntermediateCompensationEvent(elementId) {
        return this.addElement( new Element(elementId, new CircleShape()) )
            .addIcon(intermediateCompensation, 'center', BpmnIconDimensions.ICON_SIZE_LARGE);
    }

    addIntermediateSignalCatchEvent(elementId) {
        return this.addElement( new Element(elementId, new CircleShape()) )
            .addIcon(intermediateSignalCatch, 'center', BpmnIconDimensions.ICON_SIZE_LARGE);
    }

    addIntermediateSignalThrowEvent(elementId) {
        return this.addElement( new Element(elementId, new CircleShape()) )
            .addIcon(intermediateSignalThrow, 'center', BpmnIconDimensions.ICON_SIZE_LARGE);
    }

    // End Events
    addEndEvent(elementId) {
        return this.addElement( new Element(elementId, new CircleShape(BpmnGatewayDimensions.END_EVENT_LINE_WIDTH)) )
    }

    addMessageEndEvent(elementId) {
        return this.addElement( new Element(elementId, new CircleShape(BpmnGatewayDimensions.END_EVENT_LINE_WIDTH)) )
            .addIcon(messageEnd, 'center', BpmnIconDimensions.ICON_SIZE_MEDIUM);
    }

    addEscalationEndEvent(elementId) {
        return this.addElement( new Element(elementId, new CircleShape(BpmnGatewayDimensions.END_EVENT_LINE_WIDTH)) )
            .addIcon(escalation, 'center', BpmnIconDimensions.ICON_SIZE_MEDIUM);
    }

    addErrorEndEvent(elementId) {
        return this.addElement( new Element(elementId, new CircleShape(BpmnGatewayDimensions.END_EVENT_LINE_WIDTH)) )
            .addIcon(error, 'center', BpmnIconDimensions.ICON_SIZE_MEDIUM);
    }

    addCompensateEndEvent(elementId) {
        return this.addElement( new Element(elementId, new CircleShape(BpmnGatewayDimensions.END_EVENT_LINE_WIDTH)) )
            .addIcon(compensation, 'center', BpmnIconDimensions.ICON_SIZE_MEDIUM);
    }

    addSignalEndEvent(elementId) {
        return this.addElement( new Element(elementId, new CircleShape(BpmnGatewayDimensions.END_EVENT_LINE_WIDTH)) )
            .addIcon(signalEnd, 'center', BpmnIconDimensions.ICON_SIZE_MEDIUM);
    }

    addTerminateEndEvent(elementId) {
        return this.addElement( new Element(elementId, new CircleShape(BpmnGatewayDimensions.END_EVENT_LINE_WIDTH)) )
            .addIcon(terminate, 'center', BpmnIconDimensions.ICON_SIZE_MEDIUM);
    }


    // Tasks
    addTask(elementId) {
        return this.addElement( new Element(elementId, new RoundedRectangleShape()) );
    }

    addManualTask(elementId) {
        return this.addElement( new Element(elementId, new RoundedRectangleShape()) )
            .addIcon(manual, 'top-left', BpmnIconDimensions.ICON_SIZE_SMALL);
    }

    addUserTask(elementId) {
        return this.addElement( new Element(elementId, new RoundedRectangleShape()) )
            .addIcon(user, 'top-left', BpmnIconDimensions.ICON_SIZE_SMALL);
    }

    addScriptTask(elementId) {
        return this.addElement( new Element(elementId, new RoundedRectangleShape()) )
            .addIcon(script, 'top-left', BpmnIconDimensions.ICON_SIZE_SMALL);
    }

    addBusinessRuleTask(elementId) {
        return this.addElement( new Element(elementId, new RoundedRectangleShape()) )
            .addIcon(businessRule, 'top-left', BpmnIconDimensions.ICON_SIZE_SMALL);
    }

    addServiceTask(elementId) {
        return this.addElement( new Element(elementId, new RoundedRectangleShape()) )
            .addIcon(service, 'top-left', BpmnIconDimensions.ICON_SIZE_SMALL);
    }

    addSendTask(elementId) {
        return this.addElement( new Element(elementId, new RoundedRectangleShape()) )
            .addIcon(send, 'top-left', BpmnIconDimensions.ICON_SIZE_SMALL);
    }

    addReceiveTask(elementId) {
        return this.addElement( new Element(elementId, new RoundedRectangleShape()) )
            .addIcon(receive, 'top-left', BpmnIconDimensions.ICON_SIZE_SMALL);
    }

    // Gateways
    addGateway(elementId) {
        return this.addExclusiveGateway(elementId);
    }

    addInclusiveGateway(elementId) {
        return this.addElement( new Element(elementId, new DiamondShape()) )
            .addIcon(inclusive, 'center', BpmnIconDimensions.ICON_SIZE_LARGE);
    }

    addExclusiveGateway(elementId) {
        return this.addElement( new Element(elementId, new DiamondShape()) )
            .addIcon(exclusive, 'center', BpmnIconDimensions.ICON_SIZE_MEDIUM);
    }

    addParallelGateway(elementId) {
        return this.addElement( new Element(elementId, new DiamondShape()) )
            .addIcon(parallel, 'center', BpmnIconDimensions.ICON_SIZE_LARGE);
    }

    addEventBasedGateway(elementId) {
        return this.addElement( new Element(elementId, new DiamondShape()) )
            .addIcon(eventBased, 'center', BpmnIconDimensions.ICON_SIZE_LARGE);
    }

    addComplexGateway(elementId) {
        return this.addElement( new Element(elementId, new DiamondShape()) )
            .addIcon(complex, 'center', BpmnIconDimensions.ICON_SIZE_MEDIUM);
    }



    // --------------------------------------------------
    // Add BPMN Connectors
    // --------------------------------------------------

    addFlowConnector(elementId, points) {
        return this.addConnector( new Connector(elementId, new RoundedCornerOrthogonalConnectorShape(points)) );
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
                console.log(xmlDoc);
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

        // Add start events
        const startEvents = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'startEvent');
        for (let i = 0; i < startEvents.length; i++) {
            // Read startEvent id and name
            const startEventId = startEvents[i].getAttribute('id');
            console.log('startEventId:', startEventId);
            const name = startEvents[i].getElementsByTagNameNS(bpmnNamespace, 'name');
            console.log('name:', name);
            // Read startEvent incoming[] and outgoing[]
            const incoming = startEvents[i].getElementsByTagNameNS(bpmnNamespace, 'incoming');
            console.log('incoming:', incoming);
            for (let j = 0; j < incoming.length; j++) {
                console.log('incoming:', incoming[j].textContent);
            }            const outgoing = startEvents[i].getElementsByTagNameNS(bpmnNamespace, 'outgoing');
            console.log('outgoing:', outgoing);
            for (let j = 0; j < outgoing.length; j++) {
                console.log('outgoing:', outgoing[j].textContent);
            }
            // Add start event element to the diagram
            if (startEvents[i].getElementsByTagNameNS(bpmnNamespace, 'messageEventDefinition').length > 0) {
                this.addMessageStartEvent(startEventId);
            } else if (startEvents[i].getElementsByTagNameNS(bpmnNamespace, 'timerEventDefinition').length > 0) {
                this.addTimerStartEvent(startEventId);
            } else if (startEvents[i].getElementsByTagNameNS(bpmnNamespace, 'conditionalEventDefinition').length > 0) {
                this.addConditionalStartEvent(startEventId);
            } else if (startEvents[i].getElementsByTagNameNS(bpmnNamespace, 'signalEventDefinition').length > 0) {
                this.addSignalStartEvent(startEventId); 
            } else {
                // Simple start event
                this.addStartEvent(startEventId);
            }
        }

        // Add end events
        const endEvents = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'endEvent');
        for (let i = 0; i < endEvents.length; i++) {
            // Read endEvent id and name
            const endEventId = endEvents[i].getAttribute('id');
            console.log('endEventId:', endEventId);
            const name = endEvents[i].getElementsByTagNameNS(bpmnNamespace, 'name');
            console.log('name:', name);
            // Read endEvent incoming[] and outgoing[]
            const incoming = endEvents[i].getElementsByTagNameNS(bpmnNamespace, 'incoming');
            console.log('incoming:', incoming);
            for (let j = 0; j < incoming.length; j++) {
                console.log('incoming:', incoming[j].textContent);
            }
            const outgoing = endEvents[i].getElementsByTagNameNS(bpmnNamespace, 'outgoing');
            console.log('outgoing:', outgoing);
            for (let j = 0; j < outgoing.length; j++) {
                console.log('outgoing:', outgoing[j].textContent);
            }
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
            console.log('intermediateCatchEventId:', intermediateCatchEventId);
            const name = intermediateCatchEvents[i].getElementsByTagNameNS(bpmnNamespace, 'name');
            console.log('name:', name);
            // Read intermediateCatchEvent incoming[] and outgoing[]
            const incoming = intermediateCatchEvents[i].getElementsByTagNameNS(bpmnNamespace, 'incoming');
            console.log('incoming:', incoming);
            for (let j = 0; j < incoming.length; j++) {
                console.log('incoming:', incoming[j].textContent);
            }
            const outgoing = intermediateCatchEvents[i].getElementsByTagNameNS(bpmnNamespace, 'outgoing');
            console.log('outgoing:', outgoing);
            for (let j = 0; j < outgoing.length; j++) {
                console.log('outgoing:', outgoing[j].textContent);
            }
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
            console.log('intermediateThrowEventId:', intermediateThrowEventId);
            const name = intermediateThrowEvents[i].getElementsByTagNameNS(bpmnNamespace, 'name');
            console.log('name:', name);
            // Read intermediateCatchEvent incoming[] and outgoing[]
            const incoming = intermediateThrowEvents[i].getElementsByTagNameNS(bpmnNamespace, 'incoming');
            console.log('incoming:', incoming);
            for (let j = 0; j < incoming.length; j++) {
                console.log('incoming:', incoming[j].textContent);
            }
            const outgoing = intermediateThrowEvents[i].getElementsByTagNameNS(bpmnNamespace, 'outgoing');
            console.log('outgoing:', outgoing);
            for (let j = 0; j < outgoing.length; j++) {
                console.log('outgoing:', outgoing[j].textContent);
            }
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
            console.log('taskId:', taskId);
            const name = tasks[i].getAttribute('name');
            console.log('name:', name);
            // Read task incoming[] and outgoing[]
            const incoming = tasks[i].getElementsByTagNameNS(bpmnNamespace, 'incoming');
            console.log('incoming:', incoming);
            for (let j = 0; j < incoming.length; j++) {
                console.log('incoming:', incoming[j].textContent);
            }
            const outgoing = tasks[i].getElementsByTagNameNS(bpmnNamespace, 'outgoing');
            console.log('outgoing:', outgoing);
            for (let j = 0; j < outgoing.length; j++) {
                console.log('outgoing:', outgoing[j].textContent);
            }
            this.addTask(taskId)
                .addWrappedText(name);
        }

        // Add manual tasks
        const manualTasks = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'manualTask');
        for (let i = 0; i < manualTasks.length; i++) {
            // Read manualTask id and name
            const manualTaskId = manualTasks[i].getAttribute('id');
            console.log('manualTaskId:', manualTaskId);
            const name = manualTasks[i].getAttribute('name');
            console.log('name:', name);
            // Read manualTask incoming[] and outgoing[]
            const incoming = manualTasks[i].getElementsByTagNameNS(bpmnNamespace, 'incoming');
            console.log('incoming:', incoming);
            for (let j = 0; j < incoming.length; j++) {
                console.log('incoming:', incoming[j].textContent);
            }
            const outgoing = manualTasks[i].getElementsByTagNameNS(bpmnNamespace, 'outgoing');
            console.log('outgoing:', outgoing);
            for (let j = 0; j < outgoing.length; j++) {
                console.log('outgoing:', outgoing[j].textContent);
            }
            this.addManualTask(manualTaskId)
                .addWrappedText(name);
        }

        // Add user tasks
        const userTasks = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'userTask');
        for (let i = 0; i < userTasks.length; i++) {
            // Read userTask id and name
            const userTaskId = userTasks[i].getAttribute('id');
            console.log('userTaskId:', userTaskId);
            const name = userTasks[i].getAttribute('name');
            console.log('name:', name);
            // Read userTask incoming[] and outgoing[]
            const incoming = userTasks[i].getElementsByTagNameNS(bpmnNamespace, 'incoming');
            console.log('incoming:', incoming);
            for (let j = 0; j < incoming.length; j++) {
                console.log('incoming:', incoming[j].textContent);
            }
            const outgoing = userTasks[i].getElementsByTagNameNS(bpmnNamespace, 'outgoing');
            console.log('outgoing:', outgoing);
            for (let j = 0; j < outgoing.length; j++) {
                console.log('outgoing:', outgoing[j].textContent);
            }
            this.addUserTask(userTaskId)
                .addWrappedText(name);
        }

        // Add script tasks
        const scriptTasks = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'scriptTask');
        for (let i = 0; i < scriptTasks.length; i++) {
            // Read scriptTask id and name
            const scriptTaskId = scriptTasks[i].getAttribute('id');
            console.log('scriptTaskId:', scriptTaskId);
            const name = scriptTasks[i].getAttribute('name');
            console.log('name:', name);
            // Read scriptTask incoming[] and outgoing[]
            const incoming = scriptTasks[i].getElementsByTagNameNS(bpmnNamespace, 'incoming');
            console.log('incoming:', incoming);
            for (let j = 0; j < incoming.length; j++) {
                console.log('incoming:', incoming[j].textContent);
            }
            const outgoing = scriptTasks[i].getElementsByTagNameNS(bpmnNamespace, 'outgoing');
            console.log('outgoing:', outgoing);
            for (let j = 0; j < outgoing.length; j++) {
                console.log('outgoing:', outgoing[j].textContent);
            }
            this.addScriptTask(scriptTaskId)
                .addWrappedText(name);
        }

        // Add business rule tasks
        const businessRuleTasks = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'businessRuleTask');
        for (let i = 0; i < businessRuleTasks.length; i++) {
            // Read businessRuleTask id and name
            const businessRuleTaskId = businessRuleTasks[i].getAttribute('id');
            console.log('businessRuleTaskId:', businessRuleTaskId);
            const name = businessRuleTasks[i].getAttribute('name');
            console.log('name:', name);
            // Read businessRuleTask incoming[] and outgoing[]
            const incoming = businessRuleTasks[i].getElementsByTagNameNS(bpmnNamespace, 'incoming');
            console.log('incoming:', incoming);
            for (let j = 0; j < incoming.length; j++) {
                console.log('incoming:', incoming[j].textContent);
            }
            const outgoing = businessRuleTasks[i].getElementsByTagNameNS(bpmnNamespace, 'outgoing');
            console.log('outgoing:', outgoing);
            for (let j = 0; j < outgoing.length; j++) {
                console.log('outgoing:', outgoing[j].textContent);
            }
            this.addBusinessRuleTask(businessRuleTaskId)
                .addWrappedText(name);
        }

        // Add service tasks
        const serviceTasks = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'serviceTask');
        for (let i = 0; i < serviceTasks.length; i++) {
            // Read serviceTask id and name
            const serviceTaskId = serviceTasks[i].getAttribute('id');
            console.log('serviceTaskId:', serviceTaskId);
            const name = serviceTasks[i].getAttribute('name');
            console.log('name:', name);
            // Read serviceTask incoming[] and outgoing[]
            const incoming = serviceTasks[i].getElementsByTagNameNS(bpmnNamespace, 'incoming');
            console.log('incoming:', incoming);
            for (let j = 0; j < incoming.length; j++) {
                console.log('incoming:', incoming[j].textContent);
            }
            const outgoing = serviceTasks[i].getElementsByTagNameNS(bpmnNamespace, 'outgoing');
            console.log('outgoing:', outgoing);
            for (let j = 0; j < outgoing.length; j++) {
                console.log('outgoing:', outgoing[j].textContent);
            }
            this.addServiceTask(serviceTaskId)
                .addWrappedText(name);
        }

        // Add send tasks
        const sendTasks = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'sendTask');
        for (let i = 0; i < sendTasks.length; i++) {
            // Read sendTask id and name
            const sendTaskId = sendTasks[i].getAttribute('id');
            console.log('sendTaskId:', sendTaskId);
            const name = sendTasks[i].getAttribute('name');
            console.log('name:', name);
            // Read sendTask incoming[] and outgoing[]
            const incoming = sendTasks[i].getElementsByTagNameNS(bpmnNamespace, 'incoming');
            console.log('incoming:', incoming);
            for (let j = 0; j < incoming.length; j++) {
                console.log('incoming:', incoming[j].textContent);
            }
            const outgoing = sendTasks[i].getElementsByTagNameNS(bpmnNamespace, 'outgoing');
            console.log('outgoing:', outgoing);
            for (let j = 0; j < outgoing.length; j++) {
                console.log('outgoing:', outgoing[j].textContent);
            }
            this.addSendTask(sendTaskId)
                .addWrappedText(name);
        }
        
        // Add receive tasks
        const receiveTasks = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'receiveTask');
        for (let i = 0; i < receiveTasks.length; i++) {
            // Read receiveTask id and name
            const receiveTaskId = receiveTasks[i].getAttribute('id');
            console.log('receiveTaskId:', receiveTaskId);
            const name = receiveTasks[i].getAttribute('name');
            console.log('name:', name);
            // Read receiveTask incoming[] and outgoing[]
            const incoming = receiveTasks[i].getElementsByTagNameNS(bpmnNamespace, 'incoming');
            console.log('incoming:', incoming);
            for (let j = 0; j < incoming.length; j++) {
                console.log('incoming:', incoming[j].textContent);
            }
            const outgoing = receiveTasks[i].getElementsByTagNameNS(bpmnNamespace, 'outgoing');
            console.log('outgoing:', outgoing);
            for (let j = 0; j < outgoing.length; j++) {
                console.log('outgoing:', outgoing[j].textContent);
            }
            this.addReceiveTask(receiveTaskId)
                .addWrappedText(name);
        }

        // Add inclusive gateways
        const inclusiveGateways = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'inclusiveGateway');
        for (let i = 0; i < inclusiveGateways.length; i++) {
            // Read gateway id and name
            const gatewayId = inclusiveGateways[i].getAttribute('id');
            console.log('gatewayId:', gatewayId);
            const name = inclusiveGateways[i].getAttribute('name');
            console.log('name:', name);
            // Read gateway incoming[] and outgoing[]
            const incoming = inclusiveGateways[i].getElementsByTagNameNS(bpmnNamespace, 'incoming');
            console.log('incoming:', incoming);
            for (let j = 0; j < incoming.length; j++) {
                console.log('incoming:', incoming[j].textContent);
            }
            const outgoing = inclusiveGateways[i].getElementsByTagNameNS(bpmnNamespace, 'outgoing');
            console.log('outgoing:', outgoing);
            for (let j = 0; j < outgoing.length; j++) {
                console.log('outgoing:', outgoing[j].textContent);
            }
            this.addInclusiveGateway(gatewayId);
        }

        // Add exclusive gateways
        const exclusiveGateways = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'exclusiveGateway');
        for (let i = 0; i < exclusiveGateways.length; i++) {
            // Read gateway id and name
            const gatewayId = exclusiveGateways[i].getAttribute('id');
            console.log('gatewayId:', gatewayId);
            const name = exclusiveGateways[i].getAttribute('name');
            console.log('name:', name);
            // Read gateway incoming[] and outgoing[]
            const incoming = exclusiveGateways[i].getElementsByTagNameNS(bpmnNamespace, 'incoming');
            console.log('incoming:', incoming);
            for (let j = 0; j < incoming.length; j++) {
                console.log('incoming:', incoming[j].textContent);
            }
            const outgoing = exclusiveGateways[i].getElementsByTagNameNS(bpmnNamespace, 'outgoing');
            console.log('outgoing:', outgoing);
            for (let j = 0; j < outgoing.length; j++) {
                console.log('outgoing:', outgoing[j].textContent);
            }
            this.addExclusiveGateway(gatewayId);
        }

        // Add parallel gateways
        const parallelGateways = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'parallelGateway');
        for (let i = 0; i < parallelGateways.length; i++) {
            // Read gateway id and name
            const gatewayId = parallelGateways[i].getAttribute('id');
            console.log('gatewayId:', gatewayId);
            const name = parallelGateways[i].getAttribute('name');
            console.log('name:', name);
            // Read gateway incoming[] and outgoing[]
            const incoming = parallelGateways[i].getElementsByTagNameNS(bpmnNamespace, 'incoming');
            console.log('incoming:', incoming);
            for (let j = 0; j < incoming.length; j++) {
                console.log('incoming:', incoming[j].textContent);
            }
            const outgoing = parallelGateways[i].getElementsByTagNameNS(bpmnNamespace, 'outgoing');
            console.log('outgoing:', outgoing);
            for (let j = 0; j < outgoing.length; j++) {
                console.log('outgoing:', outgoing[j].textContent);
            }
            this.addParallelGateway(gatewayId);
        }

        // Add event-based gateways
        const eventBasedGateways = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'eventBasedGateway');
        for (let i = 0; i < eventBasedGateways.length; i++) {
            // Read gateway id and name
            const gatewayId = eventBasedGateways[i].getAttribute('id');
            console.log('gatewayId:', gatewayId);
            const name = eventBasedGateways[i].getAttribute('name');
            console.log('name:', name);
            // Read gateway incoming[] and outgoing[]
            const incoming = eventBasedGateways[i].getElementsByTagNameNS(bpmnNamespace, 'incoming');
            console.log('incoming:', incoming);
            for (let j = 0; j < incoming.length; j++) {
                console.log('incoming:', incoming[j].textContent);
            }
            const outgoing = eventBasedGateways[i].getElementsByTagNameNS(bpmnNamespace, 'outgoing');
            console.log('outgoing:', outgoing);
            for (let j = 0; j < outgoing.length; j++) {
                console.log('outgoing:', outgoing[j].textContent);
            }
            this.addEventBasedGateway(gatewayId);
        }

        // Add complex gateways
        const complexGateways = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'complexGateway');
        for (let i = 0; i < complexGateways.length; i++) {
            // Read gateway id and name
            const gatewayId = complexGateways[i].getAttribute('id');
            console.log('gatewayId:', gatewayId);
            const name = complexGateways[i].getAttribute('name');
            console.log('name:', name);
            // Read gateway incoming[] and outgoing[]
            const incoming = complexGateways[i].getElementsByTagNameNS(bpmnNamespace, 'incoming');
            console.log('incoming:', incoming);
            for (let j = 0; j < incoming.length; j++) {
                console.log('incoming:', incoming[j].textContent);
            }
            const outgoing = complexGateways[i].getElementsByTagNameNS(bpmnNamespace, 'outgoing');
            console.log('outgoing:', outgoing);
            for (let j = 0; j < outgoing.length; j++) {
                console.log('outgoing:', outgoing[j].textContent);
            }
            this.addComplexGateway(gatewayId);
        }

        // Add sequence flows
        const sequenceFlows = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'sequenceFlow');
        for (let i = 0; i < sequenceFlows.length; i++) {
            // Read sequenceFlow id, name, sourceRef, and targetRef
            const sequenceFlowId = sequenceFlows[i].getAttribute('id');
            console.log('sequenceFlowId:', sequenceFlowId);
            const name = sequenceFlows[i].getAttribute('name');
            console.log('name:', name);
            const sourceRef = sequenceFlows[i].getAttribute('sourceRef');
            console.log('sourceRef:', sourceRef);
            const targetRef = sequenceFlows[i].getAttribute('targetRef');
            console.log('targetRef:', targetRef);
        }


        // Place elements on the diagram
        const bpmnShapes = xmlDoc.getElementsByTagNameNS(bpmndiNamespace, 'BPMNShape');

        for (let i = 0; i < bpmnShapes.length; i++) {
            const bpmnShape = bpmnShapes[i];
            const bpmnShapeId = bpmnShape.getAttribute('id');
            const bpmnElementId = bpmnShape.getAttribute('bpmnElement');
            const bounds = bpmnShape.getElementsByTagNameNS(dcNamespace, 'Bounds')[0];
            if (bounds) {
                const x = parseFloat(bounds.getAttribute('x'));
                const y = parseFloat(bounds.getAttribute('y')) * (-1);
                const width = parseFloat(bounds.getAttribute('width'));
                const height = parseFloat(bounds.getAttribute('height'));

                console.log(`BPMNShape: ${bpmnShapeId}, ${bpmnElementId}, x: ${x}, y: ${y}, width: ${width}, height: ${height}`);

                const position = new THREE.Vector3(x + (width / 2), y - (height / 2), 0);
                const element = this.getElementById(bpmnElementId);
                if (element) {
                    element.positionAt(position);
                } else {
                    console.warn(`Element with id ${bpmnElementId} not found.`);
                }

                // Add label to the element (BPMNLabel)
                let labelX, labelY, labelWidth, labelHeight;
                const bpmnLabel = bpmnShape.getElementsByTagNameNS(bpmndiNamespace, 'BPMNLabel');
                if (bpmnLabel.length > 0) {
                    const labelBounds = bpmnLabel[0].getElementsByTagNameNS(dcNamespace, 'Bounds')[0];
                    if (labelBounds) {
                        labelX = parseFloat(labelBounds.getAttribute('x'));
                        labelY = parseFloat(labelBounds.getAttribute('y')) * (-1);
                        labelWidth = parseFloat(labelBounds.getAttribute('width'));
                        labelHeight = parseFloat(labelBounds.getAttribute('height'));
                        console.log(`Label position (Shape): x: ${labelX}, y: ${labelY}, width: ${labelWidth}, height: ${labelHeight}`);

                        // Read label value from elements like bpmn:task, bpmn:startEvent, etc.
                        const bpmnElement = xmlDoc.getElementById(bpmnElementId);
                        const bpmnElementName = bpmnElement.getAttribute('name');
                        console.log(`bpmnElementName: ${bpmnElementName}`);

                        // Add label to the element
                        if (bpmnElementName) {
                            const labelPosition = new THREE.Vector3(labelX + (labelWidth / 2), labelY - (labelHeight / 2), 0);
                            this.addElement(new Element('t1', new TextShape(bpmnElementName)))
                                .positionAt(labelPosition);
                        }
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
            const sequenceFlow = Array.from(sequenceFlows).find(flow => flow.getAttribute('id') === bpmnElementId);
            const sequenceFlowName = sequenceFlow ? sequenceFlow.getAttribute('name') : null;

            // get waypoints
            const waypoints = bpmnEdge.getElementsByTagNameNS(diNamespace, 'waypoint');
            const connectorPoints = [];
            for (let j = 0; j < waypoints.length; j++) {
                const waypoint = waypoints[j];
                const x = parseFloat(waypoint.getAttribute('x'));
                const y = parseFloat(waypoint.getAttribute('y')) * (-1);
                connectorPoints.push(new THREE.Vector2(x, y));
                console.log(`BPMNEdge: ${bpmnElementId}, x: ${x}, y: ${y}`);
            }
            console.log('connectorPoints:', connectorPoints);

            // Add connector to the diagram
            this.addConnector(this.addFlowConnector(bpmnEdgeId, connectorPoints));

            // Add label to the connector (BPMNLabel)
            let labelX, labelY, labelWidth, labelHeight;
            const bpmnLabel = bpmnEdge.getElementsByTagNameNS(bpmndiNamespace, 'BPMNLabel');
            if (bpmnLabel.length > 0) {
                const labelBounds = bpmnLabel[0].getElementsByTagNameNS(dcNamespace, 'Bounds')[0];
                if (labelBounds) {
                    labelX = parseFloat(labelBounds.getAttribute('x'));
                    labelY = parseFloat(labelBounds.getAttribute('y')) * (-1);
                    labelWidth = parseFloat(labelBounds.getAttribute('width'));
                    labelHeight = parseFloat(labelBounds.getAttribute('height'));
                    console.log(`Label position: x: ${labelX}, y: ${labelY}, width: ${labelWidth}, height: ${labelHeight}`);
                }
            }
            if (sequenceFlowName) {
                const labelPosition = new THREE.Vector3(labelX + (labelWidth / 2), labelY - (labelHeight / 2), 0);
                this.addElement(new Element('t1', new TextShape(sequenceFlowName)))
                    .positionAt(labelPosition);
            }
        }
        this.center();
    }
}

export { BpmnDiagram };
