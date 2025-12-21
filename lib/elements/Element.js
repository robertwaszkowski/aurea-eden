import * as THREE from 'three';
import { BoxShape } from '../shapes/solids/BoxShape.js';
import { TextShape } from '../shapes/text/TextShape.js';
import { IconShape } from '../shapes/icon/IconShape.js';
import { ValueBarShape } from '../shapes/bar/ValueBarShape.js';
import { DiagramDimensions } from '../diagrams/DiagramConstants.js';
import { IconDimensions } from '../shapes/icon/IconConstants.js';
import { Connector } from '../connectors/Connector.js';
import { RoundedCornerOrthogonalConnectorShape } from '../shapes/connector/RoundedCornerOrthogonalConnectorShape.js';

/**
 * Represents a diagram element that can be positioned, connected, and decorated with text, icons, and bars.
 * @extends THREE.Mesh
 */
class Element extends THREE.Mesh {
    /**
     * Creates a new diagram element.
     * @param {string} elementId - Unique identifier for the element
     * @param {Shape} [shape=new BoxShape()] - Shape of the element
     * @param {Object} [positionXY={ x: 0, y: 0 }] - Initial position of the element
     * @param {number} positionXY.x - X coordinate
     * @param {number} positionXY.y - Y coordinate
     */
    constructor(elementId, 
                shape = new BoxShape(),                // Default shape is BoxShape. Type is Shape (lib/shapes/Shape.js)
                positionXY = { x: 0, y: 0 } ) {        // Position of the center of the Element
        super(shape.geometry, shape.material);
        this.elementId = elementId;
        this.type = shape.constructor.name; // Derive type from shape's constructor name
        this.parameters = {}; // Parameters of the element
        this.shape = shape;
        this.position.set(positionXY.x, positionXY.y, 0); // Use set method to update position
        this.width = this.getSize().x;
        this.height = this.getSize().y;
        this.texts = [];
        this.icons = [];
        this.valueBars = [];
    }

    /**
     * Sets the diagram context for this element.
     * @param {Diagram} diagram - The diagram this element belongs to
     */
    setDiagram(diagram) {
        this.diagram = diagram;
    }
    
    // ================================================================
    // Element placement methods
    // ================================================================

    /**
     * Gets the size of the element's bounding box.
     * @returns {THREE.Vector3} The size vector containing width, height, and depth
     */
    getSize() {
        const size = new THREE.Vector3();
        this.shape.geometry.computeBoundingBox();
        this.shape.geometry.boundingBox.getSize(size);
        // console.log(`size: ${size.x}, ${size.y}, ${size.z}`);
        return size;
    }

    /**
     * Positions the element and its decorations at the specified coordinates.
     * @param {Object} position - The position coordinates
     * @param {number} position.x - X coordinate
     * @param {number} position.y - Y coordinate
     * @param {number} [position.z] - Optional Z coordinate
     * @returns {Element} This element for method chaining
     */
    positionAt(position) {
        if (position.z !== undefined) {
            this.position.set(position.x, position.y, position.z);
        } else {
            this.position.set(position.x, position.y, 0);
        }

        // Set the position of the element's texts, icons, and bars
        this.texts.forEach(text => {
            const offset = text.positionOffset;
            if (position.z !== undefined) {
                text.element.position.set(position.x + offset.x, position.y + offset.y, position.z + offset.z);
            } else {
                text.element.position.set(position.x + offset.x, position.y + offset.y, offset.z);
            }
        });
        this.icons.forEach(icon => {
            const offset = icon.positionOffset;
            if (position.z !== undefined) {
                icon.element.position.set(position.x + offset.x, position.y + offset.y, position.z + offset.z);
            } else {
                icon.element.position.set(position.x + offset.x, position.y + offset.y, offset.z);
            }
        });
        this.valueBars.forEach(bar => {
            const offset = bar.positionOffset;
            if (position.z !== undefined) {
                bar.element.position.set(position.x + offset.x, position.y + offset.y, position.z + offset.z);
            } else {
                bar.element.position.set(position.x + offset.x, position.y + offset.y, offset.z);
            }
        });

        return this;
    }

    /**
     * Sets the position of the element using individual coordinates.
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} z - Z coordinate
     * @returns {Element} This element for method chaining
     */
    setPosition(x, y, z) {
        const pos = new THREE.Vector3(x, y, z);
        this.positionAt(pos);
        return this;
    }

    /**
     * Gets the current position of the element.
     * @returns {THREE.Vector3} The position vector
     */
    getPosition() {
        return this.position;
        // return new THREE.Vector3(this.position.x, this.position.y);
    }

    /**
     * Positions this element to the right of another element.
     * @param {string} elementId - ID of the reference element
     * @returns {Element} This element for method chaining
     */
    positionRightOf(elementId) {
        const element = this.diagram.getElementById(elementId);
        const elementWidth = element.getSize().x;
        const thisWidth = this.getSize().x;
        // console.log(`positionRightOf(${element.elementId}), element.getSize().x: ${element.getSize().x}`);  
        this.setPosition(element.position.x + elementWidth / 2
                                + DiagramDimensions.DISTANCE_BETWEEN_ELEMENTS 
                                + thisWidth / 2, // x
                            element.position.y, // y
                            0 ); // z 
        return this;
    }

    /**
     * Positions this element to the left of another element.
     * @param {string} elementId - ID of the reference element
     * @returns {Element} This element for method chaining
     */
    positionLeftOf(elementId) {
        const element = this.diagram.getElementById(elementId);
        const elementWidth = element.getSize().x;
        const thisWidth = this.getSize().x;
        this.setPosition(element.position.x - elementWidth / 2
                                - DiagramDimensions.DISTANCE_BETWEEN_ELEMENTS 
                                - thisWidth / 2, // x
                            element.position.y, // y
                            0 ); // z 
        return this;
    }
    
    /**
     * Positions this element above another element.
     * @param {string} elementId - ID of the reference element
     * @returns {Element} This element for method chaining
     */
    positionUpOf(elementId) {
        const element = this.diagram.getElementById(elementId);
        const elementHeight = element.getSize().y;
        const thisHeight = this.getSize().y;
        this.setPosition(element.position.x, // x
                          element.position.y + elementHeight / 2 
                                            + DiagramDimensions.DISTANCE_BETWEEN_ELEMENTS 
                                            + thisHeight / 2, // y
                          0 ); // z
        return this;
    }

    /**
     * Positions this element below another element.
     * @param {string} elementId - ID of the reference element
     * @returns {Element} This element for method chaining
     */
    positionDownOf(elementId) {
        const element = this.diagram.getElementById(elementId);
        const elementHeight = element.getSize().y;
        const thisHeight = this.getSize().y;
        this.setPosition(element.position.x, // x
                          element.position.y - elementHeight / 2 
                                            - DiagramDimensions.DISTANCE_BETWEEN_ELEMENTS 
                                            - thisHeight / 2, // y
                          0 ); // z
 
        return this;
    }

    /**
     * Positions this element above and to the left of another element.
     * @param {string} elementId - ID of the reference element
     * @returns {Element} This element for method chaining
     */
    positionUpLeftOf(elementId) {
        const element = this.diagram.getElementById(elementId);
        const elementWidth = element.getSize().x;
        const elementHeight = element.getSize().y;
        const thisWidth = this.getSize().x;
        const thisHeight = this.getSize().y;
        this.setPosition(element.position.x - elementWidth / 2
                                - DiagramDimensions.DISTANCE_BETWEEN_ELEMENTS 
                                - thisWidth / 2, // x
                          element.position.y + elementHeight / 2 
                                            + DiagramDimensions.DISTANCE_BETWEEN_ELEMENTS 
                                            + thisHeight / 2, // y
                          0 ); // z
        return this;
    }

    /**
     * Positions this element below and to the left of another element.
     * @param {string} elementId - ID of the reference element
     * @returns {Element} This element for method chaining
     */
    positionDownLeftOf(elementId) {
        const element = this.diagram.getElementById(elementId);
        const elementWidth = element.getSize().x;
        const elementHeight = element.getSize().y;
        const thisWidth = this.getSize().x;
        const thisHeight = this.getSize().y;
        this.setPosition(element.position.x - elementWidth / 2
                                - DiagramDimensions.DISTANCE_BETWEEN_ELEMENTS 
                                - thisWidth / 2, // x
                          element.position.y - elementHeight / 2 
                                            - DiagramDimensions.DISTANCE_BETWEEN_ELEMENTS 
                                            - thisHeight / 2, // y
                          0 ); // z
        return this;
    }

    /**
     * Positions this element above and to the right of another element.
     * @param {string} elementId - ID of the reference element
     * @returns {Element} This element for method chaining
     */
    positionUpRightOf(elementId) {
        const element = this.diagram.getElementById(elementId);
        const elementWidth = element.getSize().x;
        const elementHeight = element.getSize().y;
        const thisWidth = this.getSize().x;
        const thisHeight = this.getSize().y;
        this.setPosition(element.position.x + elementWidth / 2
                                + DiagramDimensions.DISTANCE_BETWEEN_ELEMENTS 
                                + thisWidth / 2, // x
                          element.position.y + elementHeight / 2 
                                            + DiagramDimensions.DISTANCE_BETWEEN_ELEMENTS 
                                            + thisHeight / 2, // y
                          0 ); // z
        return this;
    }
                    
    /**
     * Positions this element below and to the right of another element.
     * @param {string} elementId - ID of the reference element
     * @returns {Element} This element for method chaining
     */
    positionDownRightOf(elementId) {
        const element = this.diagram.getElementById(elementId);
        const elementWidth = element.getSize().x;
        const elementHeight = element.getSize().y;
        const thisWidth = this.getSize().x;
        const thisHeight = this.getSize().y;
        this.setPosition(element.position.x + elementWidth / 2
                                + DiagramDimensions.DISTANCE_BETWEEN_ELEMENTS 
                                + thisWidth / 2, // x
                          element.position.y - elementHeight / 2 
                                            - DiagramDimensions.DISTANCE_BETWEEN_ELEMENTS 
                                            - thisHeight / 2, // y
                          0 ); // z
        return this;
    }

       
    // =================================================================
    // Determine connecting points positions in geographical manner 
    // (N, S, E, W, NNE, NNW, NEE, NWW, SEE, SWW, SSE, SSW)
    // for connectors to connect to
    // ================================================================

    /**
     * Gets the north connection point of the element.
     * The point is positioned at the middle of the element's top edge.
     * @returns {THREE.Vector2} A 2D vector representing the north point coordinates
     *                         where x is the element's center x-coordinate
     *                         and y is the element's top edge y-coordinate
     */
    getNorthPoint() {
        return new THREE.Vector2( this.position.x, 
                                  this.position.y + this.getSize().y / 2 );
    }

    /**
     * Gets the south connection point of the element.
     * The point is positioned at the middle of the element's bottom edge.
     * @returns {THREE.Vector2} A 2D vector representing the south point coordinates
     *                         where x is the element's center x-coordinate
     *                         and y is the element's bottom edge y-coordinate
     */
    getSouthPoint() {
        return new THREE.Vector2( this.position.x, 
                                  this.position.y - this.getSize().y / 2 );
    }

    /**
     * Gets the east connection point of the element.
     * The point is positioned at the middle of the element's right edge.
     * @returns {THREE.Vector2} A 2D vector representing the east point coordinates
     *                         where x is the element's right edge x-coordinate
     *                         and y is the element's center y-coordinate
     */
    getEastPoint() {
        return new THREE.Vector2( this.position.x + this.getSize().x / 2, 
                                  this.position.y );
    }

    /**
     * Gets the west connection point of the element.
     * The point is positioned at the middle of the element's left edge.
     * @returns {THREE.Vector2} A 2D vector representing the west point coordinates
     *                         where x is the element's left edge x-coordinate
     *                         and y is the element's center y-coordinate
     */
    getWestPoint() {
        return new THREE.Vector2( this.position.x - this.getSize().x / 2, 
                                  this.position.y );
    }

    /**
     * Gets the north-east connection point of the element.
     * The point is positioned at the top-right corner of the element.
     * @returns {THREE.Vector2} A 2D vector representing the north-east point coordinates
     *                         where x is the element's right edge x-coordinate
     *                         and y is the element's top edge y-coordinate
     */
    getNorthEastPoint() {
        return new THREE.Vector2( this.position.x + this.getSize().x / 2, 
                                  this.position.y + this.getSize().y / 2 );
    }

    /**
     * Gets the north-west connection point of the element.
     * The point is positioned at the top-left corner of the element.
     * @returns {THREE.Vector2} A 2D vector representing the north-west point coordinates
     *                         where x is the element's left edge x-coordinate
     *                         and y is the element's top edge y-coordinate
     */
    getNorthWestPoint() {
        return new THREE.Vector2( this.position.x - this.getSize().x / 2, 
                                  this.position.y + this.getSize().y / 2 );
    }

    /**
     * Gets the south-east connection point of the element.
     * The point is positioned at the bottom-right corner of the element.
     * @returns {THREE.Vector2} A 2D vector representing the south-east point coordinates
     *                         where x is the element's right edge x-coordinate
     *                         and y is the element's bottom edge y-coordinate
     */
    getSouthEastPoint() {
        return new THREE.Vector2( this.position.x + this.getSize().x / 2, 
                                  this.position.y - this.getSize().y / 2 );
    }

    /**
     * Gets the south-west connection point of the element.
     * The point is positioned at the bottom-left corner of the element.
     * @returns {THREE.Vector2} A 2D vector representing the south-west point coordinates
     *                         where x is the element's left edge x-coordinate
     *                         and y is the element's bottom edge y-coordinate
     */
    getSouthWestPoint() {
        return new THREE.Vector2( this.position.x - this.getSize().x / 2, 
                                  this.position.y - this.getSize().y / 2 );
    }

    /**
     * Gets the north-north-east connection point of the element.
     * The point is positioned on the top edge, one-quarter of the width from the center towards the right.
     * @returns {THREE.Vector2} A 2D vector representing the north-north-east point coordinates
     *                         where x is the element's center x-coordinate plus one-quarter of the width
     *                         and y is the element's top edge y-coordinate
     */
    getNorthNorthEastPoint() {
        return new THREE.Vector2( this.position.x + this.getSize().x / 4, 
                                  this.position.y + this.getSize().y / 2 );
    }

    /**
     * Gets the north-north-west connection point of the element.
     * The point is positioned on the top edge, one-quarter of the width from the center towards the left.
     * @returns {THREE.Vector2} A 2D vector representing the north-north-west point coordinates
     *                         where x is the element's center x-coordinate minus one-quarter of the width
     *                         and y is the element's top edge y-coordinate
     */
    getNorthNorthWestPoint() {
        return new THREE.Vector2( this.position.x - this.getSize().x / 4, 
                                  this.position.y + this.getSize().y / 2 );
    }

    /**
     * Gets the north-east-east connection point of the element.
     * The point is positioned on the right edge, one-quarter of the height from the top.
     * @returns {THREE.Vector2} A 2D vector representing the north-east-east point coordinates
     * where x is the element's right edge x-coordinate
     * and y is the element's top edge y-coordinate plus one-quarter of the height
     */
    getNorthEastEastPoint() {
        return new THREE.Vector2( this.position.x + this.getSize().x / 2, 
                                  this.position.y + this.getSize().y / 4 );
    }

    /**
     * Gets the north-west-west connection point of the element.
     * The point is positioned on the left edge, one-quarter of the height from the top.
     * @returns {THREE.Vector2} A 2D vector representing the north-west-west point coordinates
     * where x is the element's left edge x-coordinate
     * and y is the element's top edge y-coordinate plus one-quarter of the height
     */
    getNorthWestWestPoint() {
        return new THREE.Vector2( this.position.x - this.getSize().x / 2, 
                                  this.position.y + this.getSize().y / 4 );
    }

    /**
     * Gets the south-south-east connection point of the element.
     * The point is positioned on the bottom edge, one-quarter of the width from the center towards the right.
     * @returns {THREE.Vector2} A 2D vector representing the south-south-east point coordinates
     * where x is the element's center x-coordinate plus one-quarter of the width
     * and y is the element's bottom edge y-coordinate
     */
    getSouthSouthEastPoint() {
        return new THREE.Vector2( this.position.x + this.getSize().x / 4, 
                                  this.position.y - this.getSize().y / 2 );
    }

    /**
     * Gets the south-south-west connection point of the element.
     * The point is positioned on the bottom edge, one-quarter of the width from the center towards the left.
     * @returns {THREE.Vector2} A 2D vector representing the south-south-west point coordinates
     * where x is the element's center x-coordinate minus one-quarter of the width
     * and y is the element's bottom edge y-coordinate
     */
    getSouthSouthWestPoint() {
        return new THREE.Vector2( this.position.x - this.getSize().x / 4, 
                                  this.position.y - this.getSize().y / 2 );
    }

    /**
     * Gets the south-east-east connection point of the element.
     * The point is positioned on the right edge, one-quarter of the height from the bottom.
     * @returns {THREE.Vector2} A 2D vector representing the south-east-east point coordinates
     * where x is the element's right edge x-coordinate
     * and y is the element's bottom edge y-coordinate plus one-quarter of the height
     */
    getSouthEastEastPoint() {
        return new THREE.Vector2( this.position.x + this.getSize().x / 2, 
                                  this.position.y - this.getSize().y / 4 );
    }

    /**
     * Gets the south-west-west connection point of the element.
     * The point is positioned on the left edge, one-quarter of the height from the bottom.
     * @returns {THREE.Vector2} A 2D vector representing the south-west-west point coordinates
     * where x is the element's left edge x-coordinate
     * and y is the element's bottom edge y-coordinate plus one-quarter of the height
     */
    getSouthWestWestPoint() {
        return new THREE.Vector2( this.position.x - this.getSize().x / 2, 
                                  this.position.y - this.getSize().y / 4 );
    }

    /**
     * Gets the position of a connection point on the element.
     * @param {string} position - Position identifier (N, S, E, W, NE, NW, etc.)
     * @returns {THREE.Vector2} The connection point coordinates
     * @throws {Error} If the position identifier is invalid
     */
    getPointPosition(position) {
        switch (position) {
            case 'N':
            case 'north':
                return this.getNorthPoint();
            case 'S':
            case 'south':
                return this.getSouthPoint();
            case 'E':
            case 'east':
                return this.getEastPoint();
            case 'W':
            case 'west':
                return this.getWestPoint();
            case 'NE':
            case 'northeast':
                return this.getNorthEastPoint();
            case 'NW':
            case 'northwest':
                return this.getNorthWestPoint();
            case 'SE':
            case 'southeast':
                return this.getSouthEastPoint();
            case 'SW':
            case 'southwest':
                return this.getSouthWestPoint();
            case 'NNE':
            case 'northnortheast':
                return this.getNorthNorthEastPoint();
            case 'NNW':
            case 'northnorthwest':
                return this.getNorthNorthWestPoint();
            case 'NEE':
            case 'northeast':
                return this.getNorthEastEastPoint();
            case 'NWW':
            case 'northwest':
                return this.getNorthWestWestPoint();
            case 'SSE':
            case 'southsoutheast':
                return this.getSouthSouthEastPoint();
            case 'SSW':
            case 'southsouthwest':
                return this.getSouthSouthWestPoint();
            case 'SEE':
            case 'southeast':
                return this.getSouthEastEastPoint();
            case 'SWW':
            case 'southwest':
                return this.getSouthWestWestPoint();
            default:
                throw new Error(`Unknown position: ${position}`);
        }
    }


    // ================================================================
    // Add Text methods
    // ================================================================

    /**
     * Adds text to the element.
     * @param {string} text - The text to add
     * @returns {Element} This element for method chaining
     */
    addText(text) {
        const textElement = new Element(this.elementId + '_text', new TextShape(text));
        this.diagram.addElement(textElement).positionAt(this.position);
        this.texts.push({ element: textElement, positionOffset: new THREE.Vector3(0, 0, 0) });
        return this;
    }

    /**
     * Adds wrapped text that fits within the element's bounds.
     * @param {string} text - The text to add and wrap
     * @param {THREE.Vector3} [offset=new THREE.Vector3(0, 0, 3)] - Optional offset for the text position
     * @returns {Element} This element for method chaining
     */
    addWrappedText(text, offset = new THREE.Vector3(0, 0, 3), size = 8) {
        if (!text) {
            console.warn('addWrappedText: text is null or undefined');
            return this;
        }
        let wrappedText = text.replace(/\s+/g, '\n');
        let wrappedTextElement = new Element(this.elementId + '_text', new TextShape(wrappedText, size));
        let candidateTextElement;

        while (true) {
            let words = wrappedText.split('\n');
            let minLength = Infinity;
            let minIndex = -1;

            for (let i = 0; i < words.length - 1; i++) {
                let combinedLength = words[i].length + words[i + 1].length;
                if (combinedLength < minLength) {
                    minLength = combinedLength;
                    minIndex = i;
                }
            }

            if (minIndex === -1) break;

            words[minIndex] = words[minIndex] + ' ' + words[minIndex + 1];
            words.splice(minIndex + 1, 1);
            wrappedText = words.join('\n');

            candidateTextElement = new Element(this.elementId + '_text', new TextShape(wrappedText, size));

            if (candidateTextElement.getSize().x <= this.getSize().x * .9) {
                wrappedTextElement = candidateTextElement;
            } else {
                break;
            }
        }

        this.diagram.addElement(wrappedTextElement)
            .positionAt({
                x: this.position.x + offset.x,
                y: this.position.y + offset.y,
                z: this.position.z + offset.z
            });
        this.texts.push({ element: wrappedTextElement, positionOffset: offset });
        return this;
    }

    // ================================================================
    // Add icons methods
    // ================================================================

    /**
     * Gets the placeholder position for an icon at the top of the element.
     * The position is calculated by taking the element's top edge and offsetting it inward
     * by half the icon size plus padding.
     * @returns {THREE.Vector2} A 2D vector representing the placeholder coordinates
     *                         where x is the element's center x-coordinate
     *                         and y is the element's top edge y-coordinate minus (icon size/2 + padding)
     */
    getTopIconPlaceholder() {
        return new THREE.Vector2(
            this.position.x, 
            this.position.y + this.getSize().y / 2 - IconDimensions.ICON_SIZE_SMALL / 2 - IconDimensions.ICON_PADDING);
    }

    /**
     * Gets the placeholder position for an icon at the bottom of the element.
     * The position is calculated by taking the element's bottom edge and offsetting it inward
     * by half the icon size plus padding.
     * @returns {THREE.Vector2} A 2D vector representing the placeholder coordinates
     *                         where x is the element's center x-coordinate
     *                         and y is the element's bottom edge y-coordinate plus (icon size/2 + padding)
     */
    getBottomIconPlaceholder() {
        return new THREE.Vector2(
            this.position.x, 
            this.position.y - this.getSize().y / 2 + IconDimensions.ICON_SIZE_SMALL / 2 + IconDimensions.ICON_PADDING);
    }

    /**
     * Gets the placeholder position for an icon at the left of the element.
     * The position is calculated by taking the element's left edge and offsetting it inward
     * by half the icon size plus padding.
     * @returns {THREE.Vector2} A 2D vector representing the placeholder coordinates
     *                         where x is the element's left edge x-coordinate plus (icon size/2 + padding)
     *                         and y is the element's center y-coordinate
     */
    getLeftIconPlaceholder() {
        return new THREE.Vector2(
            this.position.x - this.getSize().x / 2 + IconDimensions.ICON_SIZE_SMALL / 2 + IconDimensions.ICON_PADDING, this.position.y);
    }

    /**
     * Gets the placeholder position for an icon at the right of the element.
     * The position is calculated by taking the element's right edge and offsetting it inward
     * by half the icon size plus padding.
     * @returns {THREE.Vector2} A 2D vector representing the placeholder coordinates
     *                         where x is the element's right edge x-coordinate minus (icon size/2 + padding)
     *                         and y is the element's center y-coordinate
     */
    getRightIconPlaceholder() {
        return new THREE.Vector2(
            this.position.x + this.getSize().x / 2 - IconDimensions.ICON_SIZE_SMALL / 2 - IconDimensions.ICON_PADDING, 
            this.position.y);
    }

    /**
     * Gets the placeholder position for an icon at the top-left corner of the element.
     * The position is calculated by taking the element's top-left corner and offsetting it inward
     * by half the icon size plus padding along both axes.
     * @returns {THREE.Vector2} A 2D vector representing the placeholder coordinates
     *                         where x is the element's left edge x-coordinate plus (icon size/2 + padding)
     *                         and y is the element's top edge y-coordinate minus (icon size/2 + padding)
     */
    getTopLeftIconPlaceholder() {
        return new THREE.Vector2(
            this.position.x - this.getSize().x / 2 + IconDimensions.ICON_SIZE_SMALL / 2 + IconDimensions.ICON_PADDING, 
            this.position.y + this.getSize().y / 2 - IconDimensions.ICON_SIZE_SMALL / 2 - IconDimensions.ICON_PADDING
            );
    }

    /**
     * Gets the placeholder position for an icon at the top-right corner of the element.
     * The position is calculated by taking the element's top-right corner and offsetting it inward
     * by half the icon size plus padding along both axes.
     * @returns {THREE.Vector2} A 2D vector representing the placeholder coordinates
     *                         where x is the element's right edge x-coordinate minus (icon size/2 + padding)
     *                         and y is the element's top edge y-coordinate minus (icon size/2 + padding)
     */
    getTopRightIconPlaceholder() {
        return new THREE.Vector2(
            this.position.x + this.getSize().x / 2 - IconDimensions.ICON_SIZE_SMALL / 2 - IconDimensions.ICON_PADDING, 
            this.position.y + this.getSize().y / 2 - IconDimensions.ICON_SIZE_SMALL / 2 - IconDimensions.ICON_PADDING);
    }

    /**
     * Gets the placeholder position for an icon at the bottom-left corner of the element.
     * The position is calculated by taking the element's bottom-left corner and offsetting it inward
     * by half the icon size plus padding along both axes.
     * @returns {THREE.Vector2} A 2D vector representing the placeholder coordinates
     *                         where x is the element's left edge x-coordinate plus (icon size/2 + padding)
     *                         and y is the element's bottom edge y-coordinate plus (icon size/2 + padding)
     */
    getBottomLeftIconPlaceholder() {
        return new THREE.Vector2(
            this.position.x - this.getSize().x / 2 + IconDimensions.ICON_SIZE_SMALL / 2 + IconDimensions.ICON_PADDING, 
            this.position.y - this.getSize().y / 2 + IconDimensions.ICON_SIZE_SMALL / 2 + IconDimensions.ICON_PADDING);
    }

    /**
     * Gets the placeholder position for an icon at the bottom-right corner of the element.
     * The position is calculated by taking the element's bottom-right corner and offsetting it inward
     * by half the icon size plus padding along both axes.
     * @returns {THREE.Vector2} A 2D vector representing the placeholder coordinates
     *                         where x is the element's right edge x-coordinate minus (icon size/2 + padding)
     *                         and y is the element's bottom edge y-coordinate plus (icon size/2 + padding)
     */
    getBottomRightIconPlaceholder() {
        return new THREE.Vector2(
            this.position.x + this.getSize().x / 2 - IconDimensions.ICON_SIZE_SMALL / 2 - IconDimensions.ICON_PADDING, 
            this.position.y - this.getSize().y / 2 + IconDimensions.ICON_SIZE_SMALL / 2 + IconDimensions.ICON_PADDING);
    }

    /**
     * Gets the placeholder position for an icon at the center of the element.
     * The position is at the element's center.
     * @returns {THREE.Vector2} A 2D vector representing the placeholder coordinates
     *                         where x is the element's center x-coordinate
     *                         and y is the element's center y-coordinate
     */
    getCenterIconPlaceholder() {
        return new THREE.Vector2(this.position.x, this.position.y);
    }

    /**
     * Gets the position for an icon placeholder.
     * @param {string} position - Position identifier (top, bottom, left, right, etc.)
     * @returns {THREE.Vector2} The placeholder position
     * @throws {Error} If the position identifier is invalid
     */
    getIconPlaceholder(position) {
        switch (position) {
            case 'top':
                return this.getTopIconPlaceholder();
            case 'bottom':
                return this.getBottomIconPlaceholder();
            case 'left':
                return this.getLeftIconPlaceholder();
            case 'right':
                return this.getRightIconPlaceholder();
            case 'top-left':
                return this.getTopLeftIconPlaceholder();
            case 'top-right':
                return this.getTopRightIconPlaceholder();
            case 'bottom-left':
                return this.getBottomLeftIconPlaceholder();
            case 'bottom-right':
                return this.getBottomRightIconPlaceholder();
            case 'center':
                return this.getCenterIconPlaceholder();
            default:
                throw new Error(`Unknown icon position: ${position}`);
        }
    }

    /**
     * Adds an icon to the element.
     * @param {string} icon - The icon identifier
     * @param {string} [placeholder='center'] - Position of the icon
     * @param {number} [size=IconDimensions.ICON_SIZE_MEDIUM] - Size of the icon
     * @returns {Element} This element for method chaining
     */
    addIcon(icon, placeholder = 'center', size = IconDimensions.ICON_SIZE_MEDIUM) {
        let position;
        if (typeof placeholder === 'string') {
            position = this.getIconPlaceholder(placeholder);
        }
        const iconElement = new Element(this.elementId + '_icon_placeholder', new IconShape(icon, size));
        this.diagram.addElement(iconElement).positionAt(position);
        this.icons.push({ element: iconElement, positionOffset: new THREE.Vector3(position.x - this.position.x, position.y - this.position.y, 0) });
        return this;
    }


    // ================================================================
    // Add Analysis methods
    // ================================================================

    /**
     * Adds a value bar for analysis mode.
     * @param {number} value - The value to represent (must be positive)
     * @returns {Element} This element for method chaining
     */
    addValueBar(value) {
        // This method ONLY stores the original value.
        // It does NOT create any shapes.
        // The actual bar shape will be created later in Diagram.js when mode is set to 'analysis'.
        this.parameters['value'] = value;
        return this; // Return 'this' to allow for method chaining.
    }

    // ================================================================
    // Add connecting methods
    // ================================================================

    /**
     * Creates a connector from another element to this element.
     * @param {string} sourceElementId - ID of the source element
     * @param {string} sourcePosition - Connection point on the source element
     * @param {string} targetPosition - Connection point on this element
     * @returns {Element} This element for method chaining
     * @throws {Error} If the diagram is not set or source element is not found
     */
    connectFrom(sourceElementId, sourcePosition, targetPosition) {
        if (!this.diagram) {
            throw new Error("Diagram is not set for this element.");
        }

        const targetElement = this;
        const sourceElement = this.diagram.getElementById(sourceElementId);

        if (!sourceElement) {
            throw new Error(`Element with ID ${sourceElementId} not found.`);
        }

        const sourcePoint = sourceElement.getPointPosition(sourcePosition);
        const targetPoint = targetElement.getPointPosition(targetPosition);

        const points = Connector.determinePoints(sourcePoint, targetPoint, sourcePosition, targetPosition);

        this.diagram.addConnector(new Connector(`connector-${sourceElement.elementId}-${targetElement.elementId}`, 
            new RoundedCornerOrthogonalConnectorShape(points))); //TODO: Zrobić bardziej ogólnie - nie wiadomo jaki connector wybrać (może flowFrom?)

        return this;
    }

    /**
     * Updates the text content of the element if it is a text element.
     * @param {string} text - The new text content.
     */
    updateTextContent(text) {
        if (this.shape && typeof this.shape.updateText === 'function') {
            this.shape.updateText(text);
        } else {
            console.warn('updateTextContent called on an element that does not support text updates.');
        }
    }

}

export { 
    Element
};
