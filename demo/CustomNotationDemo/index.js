
import { MyCustomNotationDiagram } from "../../lib/notations/MyCustomNotationDiagram.js";

export default (container, options = {}) => {
    // Create an instance of the custom notation diagram
    // This will set up the diagram in the specified container (e.g., document.body)
    var diagram = new MyCustomNotationDiagram(container, options);

    // Use the custom methods to add elements of our new notation
    diagram.addCustomStarNode('node1', 'Star');

    diagram.addMyCustomNode('node2', 'Blob')
        .positionRightOf('node1') // Chained positioning relative to node1
        .connectFrom('node1', 'E', 'W'); // Connects node1 (source) to node2 (target)

    diagram.addMyCustomNode('node3', 'Blob 2')
        .positionDownOf('node1') // Position below node1
        .connectFrom('node1', 'S', 'N'); // Connect South of node1 to North of node3

    // After adding elements, center the diagram and fit it to the screen
    diagram.arrange();
    diagram.fitScreen();

    return diagram;
}
