import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { DiagramEditMaterial } from '../../materials/DiagramEditMaterial.js';
import { ExtrusionParameters, Colors } from '../../diagrams/DiagramConstants.js';
import { RectangleDimensions } from './BasicShapeConstants.js';

/**
 * Represents a 3D text annotation shape (an open rectangle bracket), created by extruding a 2D path.
 */
class TextAnnotationShape extends Shape {
    /**
     * Creates an instance of TextAnnotationShape.
     * @param {number} [width=RectangleDimensions.HORIZONTAL_SIZE] - The width of the annotation.
     * @param {number} [height=RectangleDimensions.VERTICAL_SIZE] - The height of the annotation.
     * @param {number} [lineWidth=2] - The thickness of the bracket stroke.
     */
    constructor(
        width = 100, // Default width often narrower for annotations? Or standard size.
        height = 50,
        lineWidth = 2
    ) {
        const color = Colors.ELEMENT_STROKE;
        const extrusionSettings = ExtrusionParameters;

        // Create the bracket path (open rectangle)
        // We need to create a closed shape that REPRESENTS the stroke of the bracket
        //  __________
        // |  ______  |
        // | |      | |
        // | |      | | 
        // |_|      |_|

        const halfWidth = width / 2;
        const halfHeight = height / 2;

        // Define the path
        const bracketPath = new THREE.Shape();

        // Outer boundary (Counter-Clockwise)
        // Start top-right (outer)
        bracketPath.moveTo(halfWidth, halfHeight);
        // Top-left (outer)
        bracketPath.lineTo(-halfWidth, halfHeight);
        // Bottom-left (outer)
        bracketPath.lineTo(-halfWidth, -halfHeight);
        // Bottom-right (outer)
        bracketPath.lineTo(halfWidth, -halfHeight);

        // Inner boundary (Clockwise to create the "thickness")
        // Bottom-right (inner)
        bracketPath.lineTo(halfWidth, -halfHeight + lineWidth);
        // Bottom-left (inner)
        bracketPath.lineTo(-halfWidth + lineWidth, -halfHeight + lineWidth);
        // Top-left (inner)
        bracketPath.lineTo(-halfWidth + lineWidth, halfHeight - lineWidth);
        // Top-right (inner)
        bracketPath.lineTo(halfWidth, halfHeight - lineWidth);

        // Close back to start
        bracketPath.closePath();

        // Create geometry
        const geometry = new THREE.ExtrudeGeometry(bracketPath, extrusionSettings);
        const material = new DiagramEditMaterial(color);

        super(geometry, material);

        this.outerShape = bracketPath;
        this.shapeWidth = width;
        this.shapeHeight = height;
        this.shapeLineWidth = lineWidth;
        this.shapeDepth = extrusionSettings.depth || ExtrusionParameters.depth;

        this.name = 'TextAnnotationShape';
    }

    // No updateDimensions implementation strictly required for MVP unless requested, 
    // but following pattern would be good. 
}

export { TextAnnotationShape };
