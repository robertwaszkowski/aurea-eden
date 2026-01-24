import { Diagram } from "../../lib/diagrams/Diagram.js";
import { Element } from "../../lib/elements/Element.js";
// Import primitive shapes
import { CircleShape } from "../../lib/shapes/paths/CircleShape.js";
import { DiamondShape } from "../../lib/shapes/paths/DiamondShape.js";
import { BoxShape } from "../../lib/shapes/solids/BoxShape.js";
import { RoundedRectangleShape } from "../../lib/shapes/paths/RoundedRectangleShape.js";

export default (container, options = {}) => {
    // Create a new Diagram instance and attach it to the document body
    const diagram = new Diagram(container, options);

    // Add elements

    // Primitive shapes

    diagram.addElement(new Element('circle', new CircleShape()))
        .addWrappedText('Circle');

    diagram.addElement(new Element('diamond', new DiamondShape()))
        .addWrappedText('Diam ond')
        .positionRightOf('circle');

    diagram.addElement(new Element('box', new BoxShape()))
        .addWrappedText('Box')
        .positionRightOf('diamond');

    diagram.addElement(new Element('rounded-rectangle', new RoundedRectangleShape()))
        .addWrappedText('Rounded Rectangle')
        .positionDownOf('circle');

    // After adding elements, center the diagram and fit it to the screen
    diagram.arrange();
    diagram.fitScreen();

    return diagram;
}

