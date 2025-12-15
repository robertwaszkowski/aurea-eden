import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { DiagramEditMaterial } from '../../materials/DiagramEditMaterial.js';
import { ExtrusionParameters, Colors } from '../../diagrams/DiagramConstants.js';
import { RectangleDimensions } from './BasicShapeConstants.js';

/**
 * Represents a 3D sharp-cornered rectangle shape with a hole, created by extruding a 2D rectangular path.
 */
class RectangleShape extends Shape {
    /**
     * Creates an instance of RectangleShape.
     * @param {number} [width=RectangleDimensions.HORIZONTAL_SIZE] - The width of the rectangle.
     * @param {number} [height=RectangleDimensions.VERTICAL_SIZE] - The height of the rectangle.
     * @param {number} [lineWidth=RectangleDimensions.LINE_WIDTH] - The thickness of the rectangle's stroke.
     */
    constructor(
        width = RectangleDimensions.HORIZONTAL_SIZE,
        height = RectangleDimensions.VERTICAL_SIZE,
        lineWidth = RectangleDimensions.LINE_WIDTH
    ) {
        const color = Colors.ELEMENT_STROKE;
        const extrusionSettings = ExtrusionParameters;

        // Define the 2D path of the outer rectangle
        const halfWidth = width / 2;
        const halfHeight = height / 2;

        const mainRectPath = new THREE.Shape();
        mainRectPath.moveTo(-halfWidth, -halfHeight);
        mainRectPath.lineTo(halfWidth, -halfHeight);
        mainRectPath.lineTo(halfWidth, halfHeight);
        mainRectPath.lineTo(-halfWidth, halfHeight);
        mainRectPath.closePath();

        // Store a clone of the main path as the outer shape (without the hole)
        const storableOuterShape = mainRectPath.clone();

        // Define the 2D path for the hole if lineWidth is positive and makes sense
        if (lineWidth > 0 && width > lineWidth * 2 && height > lineWidth * 2) {
            const innerWidth = width - lineWidth * 2;
            const innerHeight = height - lineWidth * 2;
            const halfInnerWidth = innerWidth / 2;
            const halfInnerHeight = innerHeight / 2;

            const holePath = new THREE.Path(); // Use THREE.Path for holes
            holePath.moveTo(-halfInnerWidth, -halfInnerHeight);
            holePath.lineTo(halfInnerWidth, -halfInnerHeight);
            holePath.lineTo(halfInnerWidth, halfInnerHeight);
            holePath.lineTo(-halfInnerWidth, halfInnerHeight);
            holePath.closePath();
            mainRectPath.holes.push(holePath);
        }

        // Create geometry and material using the main path (which now includes the hole)
        const geometry = new THREE.ExtrudeGeometry(mainRectPath, extrusionSettings);
        const material = new DiagramEditMaterial(color);

        // Call the parent Shape constructor FIRST
        super(geometry, material);

        // Store the original outer path (without hole)
        this.outerShape = storableOuterShape;

        // Store dimensions for potential use
        this.shapeWidth = width;
        this.shapeHeight = height;
        this.shapeLineWidth = lineWidth; // Store lineWidth
        this.shapeDepth = extrusionSettings.depth || ExtrusionParameters.depth;

        // Add a name to the object for easier identification in the scene
        this.name = 'RectangleShape';
    }

    /**
     * Returns the 2D THREE.Shape path that defines the outer boundary of this rectangle (without any holes).
     * @returns {THREE.Shape} The outer shape path.
     */
    getOuterShape() {
        return this.outerShape;
    }

    /**
     * Updates the dimensions (width, height, and lineWidth) of the rectangle.
     * This requires creating new geometry.
     * @param {number} newWidth - The new width.
     * @param {number} newHeight - The new height.
     * @param {number} [newLineWidth] - The new line width. If undefined, uses existing.
     * @param {object} [newExtrusionSettings] - Optional new extrusion settings.
     */
    updateDimensions(newWidth, newHeight, newLineWidth, newExtrusionSettings) {
        const width = newWidth || this.shapeWidth;
        const height = newHeight || this.shapeHeight;
        const lineWidth = (newLineWidth !== undefined) ? newLineWidth : this.shapeLineWidth;

        const currentExtrusionSettings = newExtrusionSettings || (this.geometry.parameters && this.geometry.parameters.options) || ExtrusionParameters;

        const halfWidth = width / 2;
        const halfHeight = height / 2;

        const mainRectPath = new THREE.Shape();
        mainRectPath.moveTo(-halfWidth, -halfHeight);
        mainRectPath.lineTo(halfWidth, -halfHeight);
        mainRectPath.lineTo(halfWidth, halfHeight);
        mainRectPath.lineTo(-halfWidth, halfHeight);
        mainRectPath.closePath();

        const storableOuterShape = mainRectPath.clone();

        if (lineWidth > 0 && width > lineWidth * 2 && height > lineWidth * 2) {
            const innerWidth = width - lineWidth * 2;
            const innerHeight = height - lineWidth * 2;
            const halfInnerWidth = innerWidth / 2;
            const halfInnerHeight = innerHeight / 2;

            const holePath = new THREE.Path();
            holePath.moveTo(-halfInnerWidth, -halfInnerHeight);
            holePath.lineTo(halfInnerWidth, -halfInnerHeight);
            holePath.lineTo(halfInnerWidth, halfInnerHeight);
            holePath.lineTo(-halfInnerWidth, halfInnerHeight);
            holePath.closePath();
            mainRectPath.holes.push(holePath);
        }

        this.outerShape = storableOuterShape; // Update stored outerShape (without hole)

        if (this.geometry) {
            this.geometry.dispose();
        }

        this.geometry = new THREE.ExtrudeGeometry(mainRectPath, currentExtrusionSettings); // Use main path with hole

        this.shapeWidth = width;
        this.shapeHeight = height;
        this.shapeLineWidth = lineWidth;
        this.shapeDepth = currentExtrusionSettings.depth || ExtrusionParameters.depth;
    }

    /**
     * Updates the color of the rectangle.
     * @param {number} newColor - The new color value.
     */
    updateColor(newColor) {
        if (this.material && this.material.color && typeof this.material.color.set === 'function') {
            this.material.color.set(newColor);
        } else if (this.material && this.material.uniforms && this.material.uniforms.color) {
            this.material.uniforms.color.value.set(newColor);
        }
    }
}

export { RectangleShape };
