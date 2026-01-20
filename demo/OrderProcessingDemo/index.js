// Prepare a BPMN diagram

import { BpmnDiagram } from "../../lib/notations/BpmnDiagram.js";

export default function createDiagram(container) {
    var diagram = new BpmnDiagram(container);

    // Add diagram elements

    diagram.addStartEvent('e1');

    diagram.addTask('a1')
        .positionRightOf('e1')
        .addWrappedText('Handle Quotations')
        .connectFrom('e1', 'E', 'W')
        .addValueBar(20);

    diagram.addTextAnnotation('ta1', 'Note: Quotations must be reviewed within 24h')
        .positionUpOf('a1')
        .connectFrom('a1', 'N', 'S', 'association');

    diagram.addGateway('g1')
        .positionRightOf('a1')
        .connectFrom('a1', 'E', 'W');

    diagram.addTask('a2')
        .positionRightOf('g1')
        .addWrappedText('Fill Order')
        .addValueBar(35)
        .connectFrom('g1', 'E', 'W');

    diagram.addTask('a3')
        .positionUpRightOf('a2')
        .addWrappedText('Ship Order')
        .addValueBar(30)
        .connectFrom('a2', 'N', 'W');

    diagram.addTask('a4')
        .positionDownRightOf('a2')
        .addWrappedText('Send Invoice')
        .addValueBar(60)
        .connectFrom('a2', 'S', 'W');

    diagram.addTask('a5')
        .positionRightOf('a4')
        .addWrappedText('Make Payment')
        .addValueBar(50)
        .connectFrom('a4', 'E', 'W');

    diagram.addTextAnnotation('ta2', 'Note: Payment must be received within 30 days')
        .positionDownOf('a4')
        .connectFrom('a5', 'S', 'E', 'association');

    diagram.addTask('a6')
        .positionRightOf('a5')
        .addWrappedText('Accept Payment')
        .addValueBar(30)
        .connectFrom('a5', 'E', 'W');

    diagram.addGateway('g2')
        .positionUpRightOf('a6')
        .connectFrom('a3', 'E', 'N')
        .connectFrom('a6', 'E', 'S');

    diagram.addUserTask('a7')
        .positionRightOf('g2')
        .addWrappedText('Close Order')
        .addValueBar(30)
        .connectFrom('g2', 'E', 'W');

    diagram.addEndEvent('e2')
        .positionRightOf('a7')
        .connectFrom('a7', 'E', 'W');

    // Non-standard connector
    const waypoints = [
        diagram.getElementById('g1').getNorthPoint(),
        {
            x: diagram.getElementById('g1').getNorthPoint().x,
            y: diagram.getElementById('a3').getNorthPoint().y + BpmnDiagram.Dimensions.DISTANCE_BETWEEN_ELEMENTS
        },
        {
            x: diagram.getElementById('a7').getNorthPoint().x,
            y: diagram.getElementById('a3').getNorthPoint().y + BpmnDiagram.Dimensions.DISTANCE_BETWEEN_ELEMENTS
        },
        diagram.getElementById('a7').getNorthPoint()
    ];
    diagram.addFlowConnector('f1', waypoints);

    // End of diagram preparation

    diagram.arrange();
    diagram.fitScreen();

    return diagram;
}