// Draw primitive shapes

import { Diagram } from "./lib/diagrams/Diagram.js";
import { Element } from "./lib/elements/Element.js";
// Import primitive shapes
import { CircleShape } from "./lib/shapes/paths/CircleShape.js";
import { DiamondShape } from "./lib/shapes/paths/DiamondShape.js";
import { EllipseShape } from "./lib/shapes/paths/EllipseShape.js";
import { RectangleShape } from "./lib/shapes/paths/RectangleShape.js";
import { RoundedRectangleShape } from "./lib/shapes/paths/RoundedRectangleShape.js";
import { FoldedCornerRectangleShape } from "./lib/shapes/paths/FoldedCornerRectangleShape.js";
import { TabbedRectangleShape } from "./lib/shapes/paths/TabbedRectangleShape.js";
// Import other shapes
import { BlobShape } from "./lib/shapes/paths/BlobShape.js";
import { StarShape } from "./lib/shapes/paths/StarShape.js";
import { TriangleShape } from "./lib/shapes/paths/TriangleShape.js";
import { BoxShape } from "./lib/shapes/solids/BoxShape.js";

// Create a new Diagram instance and attach it to the document body
const diagram = new Diagram(document.body);

// Add elements

// Primitive shapes

diagram.addElement( new Element('circle', new CircleShape()) )
    .addWrappedText('Circle');

diagram.addElement( new Element('diamond', new DiamondShape()) )
    .addWrappedText('Diam ond')
    .positionRightOf('circle');

diagram.addElement( new Element('ellipse', new EllipseShape()) )
    .addWrappedText('Ellipse')
    .positionRightOf('diamond');

diagram.addElement( new Element('rectangle', new RectangleShape()) )
    .addWrappedText('Rectangle')
    .positionDownOf('circle');

diagram.addElement( new Element('rounded-rectangle', new RoundedRectangleShape()) )
    .addWrappedText('Rounded Rectangle')
    .positionRightOf('rectangle');

diagram.addElement( new Element('folded-corner-rectangle', new FoldedCornerRectangleShape()) )
    .addWrappedText('Folded Corner Rectangle')
    .positionRightOf('rounded-rectangle');

diagram.addElement( new Element('ellipse-rectangle', new TabbedRectangleShape()) )
    .addWrappedText('Tabbed Rectangle')
    .positionRightOf('folded-corner-rectangle');

diagram.addElement( new Element('star', new StarShape()) )
    .addWrappedText('Star')
    .positionDownOf('rectangle');

diagram.addElement( new Element('triangle', new TriangleShape()) )
    .addWrappedText('Triangle')
    .positionRightOf('star');

// Other shapes
diagram.addElement( new Element('blob', new BlobShape()) )
    .addWrappedText('Blob')
    .positionDownOf('star');

diagram.addElement( new Element('box', new BoxShape()) )
    .addWrappedText('Box')
    .positionRightOf('blob');

// After adding elements, center the diagram and fit it to the screen
diagram.arrange();
diagram.fitScreen();

// =================================================================================================


// // Draw a diagram using custom notation

// import { MyCustomNotationDiagram } from "./lib/notations/MyCustomNotationDiagram.js";

// // Create an instance of the custom notation diagram
// // This will set up the diagram in the specified container (e.g., document.body)
// var diagram = new MyCustomNotationDiagram(document.body);

// // Use the custom methods to add elements of our new notation
// diagram.addCustomStarNode('node1', 'Star');

// diagram.addMyCustomNode('node2', 'Blob')
//     .positionRightOf('node1') // Chained positioning relative to node1
//     .connectFrom('node1','E','W'); // Connects node1 (source) to node2 (target)

// diagram.addMyCustomNode('node3', 'Blob 2')
//     .positionDownOf('node1') // Position below node1
//     .connectFrom('node1', 'S', 'N'); // Connect South of node1 to North of node3

// // After adding elements, center the diagram and fit it to the screen
// diagram.arrange();
// diagram.fitScreen();


// =================================================================================================


// // Prepare a BPMN diagram

// import { BpmnDiagram } from "./lib/notations/BpmnDiagram.js";
// import * as dat from 'dat.gui';

// var diagram = new BpmnDiagram(document.body);


// // Set GUI

// const gui = new dat.GUI();
// const parameters = 
// {
//     mode: "VIEW",
//     toggleHelpers: function() { toggleHelpers() },
//     reset: function() { resetDiagram() },
//     export: function() { exportDiagram() },
//     import: function() { importDiagram() },
//     clear: function() { clearDiagram() },
//     camPosition: '...',
//     camLookAt: '...'
// };

// var diagramMode = gui.add( parameters, 'mode', [ "VIEW", "ANALYZE" ] ).name('Diagram mode').listen();
// diagramMode.onChange(function(value) 
// { setDiagramMode(); });

// gui.add( parameters, 'toggleHelpers' ).name("Toggle Helpers");
// gui.add( parameters, 'reset' ).name("Reset Diagram");
// gui.add( parameters, 'export' ).name("Export Diagram");
// gui.add( parameters, 'import' ).name("Import Diagram");
// gui.add( parameters, 'clear' ).name("Clear Diagram");
// const cameraFolder = gui.addFolder('Camera');
// cameraFolder.add(parameters, 'camPosition').name("Position").listen();
// cameraFolder.add(parameters, 'camLookAt').name("LookAt").listen();

// function readCameraPosition() {
//     // Get camera vectors
//     const cameraPosition = diagram.camera.position.clone();
//     const cameraTarget = diagram.controls.target.clone();

//     // Update parameters object. Format as strings with fixed decimal places.
//     parameters.camPosition = `(${cameraPosition.x.toFixed(2)}, ${cameraPosition.y.toFixed(2)}, ${cameraPosition.z.toFixed(2)})`;
//     parameters.camLookAt = `(${cameraTarget.x.toFixed(2)}, ${cameraTarget.y.toFixed(2)}, ${cameraTarget.z.toFixed(2)})`;

//     // Force GUI update
//     for (let controller of gui.__controllers) {
//         controller.updateDisplay();
//     }
// }

// // Add event listener to update camera position
// diagram.controls.addEventListener('change', readCameraPosition);



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



// // Add diagram elements

// diagram.addStartEvent('e1');

// diagram.addTask('a1')
//     .positionRightOf('e1')
//     .addWrappedText('Handle Quotations')
//     .connectFrom('e1', 'E', 'W')
//     .addValueBar(20);

// diagram.addGateway('g1')
//     .positionRightOf('a1')
//     .connectFrom('a1', 'E', 'W');

// diagram.addTask('a2')
//     .positionRightOf('g1')
//     .addWrappedText('Fill Order')
//     .addValueBar(35)
//     .connectFrom('g1', 'E', 'W');

// diagram.addTask('a3')
//     .positionUpRightOf('a2')
//     .addWrappedText('Ship Order')
//     .addValueBar(30)
//     .connectFrom('a2', 'N', 'W');

// diagram.addTask('a4')
//     .positionDownRightOf('a2')
//     .addWrappedText('Send Invoice')
//     .addValueBar(60)
//     .connectFrom('a2', 'S', 'W');

// diagram.addTask('a5')
//     .positionRightOf('a4')
//     .addWrappedText('Make Payment')
//     .addValueBar(50)
//     .connectFrom('a4', 'E', 'W');

// diagram.addTask('a6')
//     .positionRightOf('a5')
//     .addWrappedText('Accept Payment')
//     .addValueBar(30)
//     .connectFrom('a5', 'E', 'W');

// diagram.addGateway('g2')
//     .positionUpRightOf('a6')
//     .connectFrom('a3', 'E', 'N')
//     .connectFrom('a6', 'E', 'S');

// diagram.addUserTask('a7')
//     .positionRightOf('g2')
//     .addWrappedText('Close Order')
//     .addValueBar(30)
//     .connectFrom('g2', 'E', 'W');

// diagram.addEndEvent('e2')
//     .positionRightOf('a7')
//     .connectFrom('a7', 'E', 'W');

// // Non-standard connector
// const waypoints = [
//     diagram.getElementById('g1').getNorthPoint(),
//     {   x: diagram.getElementById('g1').getNorthPoint().x,
//         y: diagram.getElementById('a3').getNorthPoint().y + BpmnDiagram.Dimensions.DISTANCE_BETWEEN_ELEMENTS },
//     {   x: diagram.getElementById('a7').getNorthPoint().x,
//         y: diagram.getElementById('a3').getNorthPoint().y + BpmnDiagram.Dimensions.DISTANCE_BETWEEN_ELEMENTS },    
//     diagram.getElementById('a7').getNorthPoint()
// ];
// diagram.addFlowConnector('f1', waypoints);

// // End of diagram preparation

// diagram.arrange();
// diagram.fitScreen();

