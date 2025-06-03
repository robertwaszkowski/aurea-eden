import * as THREE from 'three';
import { Shape } from '../Shape.js'; // Assuming this will be in lib/shapes/
import { DiagramEditMaterial } from '../../materials/DiagramEditMaterial.js';
import { ExtrusionParameters, Colors } from '../../diagrams/DiagramConstants.js';
import { TriangleDimensions } from './BasicShapeConstants.js';

/**
 * Represents a 3D triangle shape with a hole, created by extruding a 2D triangular path.
 * The lineWidth parameter aims to define the final visible flat stroke width after beveling.
 */
class TriangleShape extends Shape {
    /**
     * Creates an instance of TriangleShape.
     * For simplicity, this example creates an equilateral triangle pointing upwards, centered at (0,0) by its centroid.
     * @param {number} [size=TriangleDimensions.SIZE] - The height of the equilateral triangle.
     * @param {number} [lineWidth=TriangleDimensions.LINE_WIDTH] - The desired final visible flat thickness of the triangle's stroke.
     */
    constructor(
        size = TriangleDimensions.SIZE,
        lineWidth = TriangleDimensions.LINE_WIDTH // This is the target visible line width
    ) {
        const color = Colors.ELEMENT_STROKE;
        const currentExtrusionSettings = ExtrusionParameters;

        // Calculate the geometric line width needed for the hole to achieve the target visible line width
        let geometricLineWidthForHole = lineWidth;
        if (currentExtrusionSettings.bevelEnabled && currentExtrusionSettings.bevelSize > 0) {
            geometricLineWidthForHole = lineWidth + (2 * currentExtrusionSettings.bevelSize);
        }

        const height = size; 
        const topY = (2 / 3) * height;
        const bottomY = -(1 / 3) * height;
        const halfBase = height / Math.sqrt(3); 

        const mainTrianglePath = new THREE.Shape();
        mainTrianglePath.moveTo(0, topY);
        mainTrianglePath.lineTo(halfBase, bottomY);
        mainTrianglePath.lineTo(-halfBase, bottomY);
        mainTrianglePath.closePath();

        const storableOuterShape = mainTrianglePath.clone();

        if (geometricLineWidthForHole > 0 && height > 3 * geometricLineWidthForHole) { 
            const scaleFactor = (height - 3 * geometricLineWidthForHole) / height;

            const innerTopY = topY * scaleFactor;
            const innerBottomY = bottomY * scaleFactor;
            const innerHalfBase = halfBase * scaleFactor;

            const holePath = new THREE.Path();
            holePath.moveTo(0, innerTopY);
            holePath.lineTo(innerHalfBase, innerBottomY);
            holePath.lineTo(-innerHalfBase, innerBottomY);
            holePath.closePath();
            mainTrianglePath.holes.push(holePath);
        }

        const geometry = new THREE.ExtrudeGeometry(mainTrianglePath, currentExtrusionSettings);
        const material = new DiagramEditMaterial(color);

        super(geometry, material);

        this.outerShape = storableOuterShape;
        this.shapeSize = size; 
        this.shapeLineWidth = lineWidth; // Store the target visible line width
        this.shapeGeometricLineWidthForHole = geometricLineWidthForHole; // Store the calculated width for geometry
        this.shapeDepth = currentExtrusionSettings.depth || ExtrusionParameters.depth;
        this.name = 'TriangleShape';
    }

    getOuterShape() {
        return this.outerShape;
    }

    updateDimensions(newSize, newLineWidth, newExtrusionSettingsOverride) {
        const size = newSize || this.shapeSize; 
        const targetVisibleLineWidth = (newLineWidth !== undefined) ? newLineWidth : this.shapeLineWidth;
        
        const currentExtrusionSettings = newExtrusionSettingsOverride || (this.geometry.parameters && this.geometry.parameters.options) || ExtrusionParameters;

        let geometricLineWidthForHole = targetVisibleLineWidth;
        if (currentExtrusionSettings.bevelEnabled && currentExtrusionSettings.bevelSize > 0) {
            geometricLineWidthForHole = targetVisibleLineWidth + (2 * currentExtrusionSettings.bevelSize);
        }

        const height = size;
        const topY = (2 / 3) * height;
        const bottomY = -(1 / 3) * height;
        const halfBase = height / Math.sqrt(3);

        const mainTrianglePath = new THREE.Shape();
        mainTrianglePath.moveTo(0, topY);
        mainTrianglePath.lineTo(halfBase, bottomY);
        mainTrianglePath.lineTo(-halfBase, bottomY);
        mainTrianglePath.closePath();

        const storableOuterShape = mainTrianglePath.clone();

        if (geometricLineWidthForHole > 0 && height > 3 * geometricLineWidthForHole) {
            const scaleFactor = (height - 3 * geometricLineWidthForHole) / height;

            const innerTopY = topY * scaleFactor;
            const innerBottomY = bottomY * scaleFactor;
            const innerHalfBase = halfBase * scaleFactor;

            const holePath = new THREE.Path();
            holePath.moveTo(0, innerTopY);
            holePath.lineTo(innerHalfBase, innerBottomY);
            holePath.lineTo(-innerHalfBase, innerBottomY);
            holePath.closePath();
            mainTrianglePath.holes.push(holePath);
        }

        this.outerShape = storableOuterShape;

        if (this.geometry) {
            this.geometry.dispose();
        }
        this.geometry = new THREE.ExtrudeGeometry(mainTrianglePath, currentExtrusionSettings);

        this.shapeSize = size;
        this.shapeLineWidth = targetVisibleLineWidth; // Store the target visible line width
        this.shapeGeometricLineWidthForHole = geometricLineWidthForHole;
        this.shapeDepth = currentExtrusionSettings.depth || ExtrusionParameters.depth;
    }

    updateColor(newColor) {
        if (this.material && this.material.color && typeof this.material.color.set === 'function') {
             this.material.color.set(newColor);
        } else if (this.material && this.material.uniforms && this.material.uniforms.color) { 
            this.material.uniforms.color.value.set(newColor);
        }
    }
}

export { TriangleShape };
