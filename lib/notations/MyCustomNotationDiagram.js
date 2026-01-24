// My custom notation

import { Diagram } from '../diagrams/Diagram.js';
import { Element } from '../elements/Element.js'; // Will be used for defining elements
import { BlobShape } from '../shapes/paths/BlobShape.js'; // Import the custom shape
import { StarShape } from '../shapes/paths/StarShape.js';

class MyCustomNotationDiagram extends Diagram {
    constructor(container, options = {}) {
        super(container, options); // Essential: calls the parent Diagram class constructor
        // Notation-specific initializations can be performed here
        console.log("MyCustomNotationDiagram initialized!");
    }

    addMyCustomNode(elementId, labelText = "Custom Node") {
        // Create a new Element, associating it with our TriangleShape
        const customNodeElement = new Element(elementId, new BlobShape());

        // Add the element to the diagram's internal collection (important for rendering and management)
        this.addElement(customNodeElement);

        // Add a text label to the element
        if (labelText) {
            customNodeElement.addWrappedText(labelText);
        }

        // Return the element instance to allow for method chaining (e.g., positioning)
        return customNodeElement;
    }

    addCustomStarNode(elementId, labelText = "Star Node") {
        // Create a new Element with a StarShape (or any other shape needed)
        const starNodeElement = new Element(elementId, new StarShape());

        // Add the element to the diagram
        this.addElement(starNodeElement);

        // Add a text label to the element
        if (labelText) {
            starNodeElement.addWrappedText(labelText);
        }

        // Return the element instance for further manipulation
        return starNodeElement;
    }

    dispose() {
        // Call the parent class's dispose method to clean up Three.js objects and event listeners
        super.dispose();
    }

    // Add other custom element methods here, e.g., addMyCustomLink, addAnotherNodeType
}

export { MyCustomNotationDiagram };