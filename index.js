import { BpmnDiagram } from "./bpmn-diagram.es.js";

// import * as dat from './dat.gui.min.js';

var diagram = new BpmnDiagram(document.body);

// Set GUI
// const gui = new dat.GUI();
// const parameters = 
// {
//     mode: "VIEW",
//     toggleHelpers: function() { toggleHelpers() },
//     reset: function() { resetDiagram() },
//     export: function() { exportDiagram() },
//     import: function() { importDiagram() },
//     clear: function() { clearDiagram() }
// };

// var diagramMode = gui.add( parameters, 'mode', [ "VIEW", "ANALYZE" ] ).name('Diagram mode').listen();
// diagramMode.onChange(function(value) 
// { setDiagramMode(); });


// gui.add( parameters, 'toggleHelpers' ).name("Toggle Helpers");
// gui.add( parameters, 'reset' ).name("Reset Diagram");
// gui.add( parameters, 'export' ).name("Export Diagram");
// gui.add( parameters, 'import' ).name("Import Diagram");
// gui.add( parameters, 'clear' ).name("Clear Diagram");
// gui.open();

// function setDiagramMode() {
//     var value = parameters.mode;
//     diagram.setMode(value);
//     console.log(diagram);
// }

// function toggleHelpers() {
//     if (diagram.helpers) {
//         diagram.hideHelpers();
//     } else {
//         diagram.showHelpers();
//     }
// }

// function resetDiagram() {
//     parameters.mode = "VIEW";
//     diagram.reset();
//     console.log(diagram);
// }

// function importDiagram() {
//     console.log('Importing diagram');
//     const input = document.createElement('input');
//     input.type = 'file';
//     input.accept = '.bpmn';
//     input.onchange = (event) => {
//         const file = event.target.files[0];
//         if (file) {
//             console.log(file);
//             diagram.import(file);
//         }
//     };
//     input.click();
// }

// function exportDiagram() {
//     diagram.export();
// }

// function clearDiagram() {
//     diagram.clear();
// }


// ////////////////////////////////////////////////////////////////////////////////////
// 20250313 - BPMN example - source: https://www.omg.org/spec/BPMN/2.0.2/PDF page 268
// ////////////////////////////////////////////////////////////////////////////////////

diagram.addStartEvent('e1');

diagram.addTask('a1')
    .positionRightOf('e1')
    .addWrappedText('Handle Quotations')
    .connectFrom('e1', 'E', 'W')
    .addValueBar(20);

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
    {   x: diagram.getElementById('g1').getNorthPoint().x,
        y: diagram.getElementById('a3').getNorthPoint().y + BpmnDiagram.Dimensions.DISTANCE_BETWEEN_ELEMENTS },
    {   x: diagram.getElementById('a7').getNorthPoint().x,
        y: diagram.getElementById('a3').getNorthPoint().y + BpmnDiagram.Dimensions.DISTANCE_BETWEEN_ELEMENTS },    
    diagram.getElementById('a7').getNorthPoint()
];
diagram.addFlowConnector('f1', waypoints);
console.log(`waypoints: ${waypoints}`);

diagram.center();
diagram.fitScreen();

