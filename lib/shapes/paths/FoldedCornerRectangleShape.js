import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { DiagramEditMaterial } from '../../materials/DiagramEditMaterial.js';
import { ExtrusionParameters, Colors } from '../../diagrams/DiagramConstants.js';
import { RectangleDimensions } from './BasicShapeConstants.js';

/**
 * Represents a 3D rectangle shape with a folded corner (like a document or note),
 * with a hole, created by extruding a 2D path.
 * The lineWidth parameter now defines the geometric distance for the hole,
 * and bevels will reduce this to the final visible stroke.
 */
class FoldedCornerRectangleShape extends Shape {
    /**
     * Creates an instance of FoldedCornerRectangleShape.
     * The fold is typically applied to the top-right corner.
     * @param {number} [width=RectangleDimensions.HORIZONTAL_SIZE] - The total width of the rectangle.
     * @param {number} [height=RectangleDimensions.VERTICAL_SIZE] - The total height of the rectangle.
     * @param {number} [foldSize=RectangleDimensions.FOLD_SIZE] - The size of the edge of the folded part of the corner.
     * @param {number} [lineWidth=RectangleDimensions.LINE_WIDTH] - The geometric thickness for the hole creation.
     */
    constructor(
        width = RectangleDimensions.HORIZONTAL_SIZE,
        height = RectangleDimensions.VERTICAL_SIZE,
        foldSize = RectangleDimensions.FOLD_SIZE,
        lineWidth = RectangleDimensions.LINE_WIDTH
    ) {
        const color = Colors.ELEMENT_STROKE;
        const currentExtrusionSettings = ExtrusionParameters;

        // geometricLineWidthForHole is now directly the lineWidth parameter.
        // The bevels will reduce this to the final visible stroke.
        const geometricLineWidthForHole = lineWidth;

        // Helper function to create the folded corner path
        function _createFoldedPath(w, h, fS) {
            const actualFoldSize = Math.min(fS, w / 2, h / 2);
            if (actualFoldSize <=0) { // If foldSize is zero or negative, draw a simple rectangle
                const path = new THREE.Shape();
                const halfW = w / 2;
                const halfH = h / 2;
                path.moveTo(-halfW, -halfH);
                path.lineTo(halfW, -halfH);
                path.lineTo(halfW, halfH);
                path.lineTo(-halfW, halfH);
                path.closePath();
                return path;
            }

            const path = new THREE.Shape();
            const halfW = w / 2;
            const halfH = h / 2;

            path.moveTo(-halfW, -halfH); // Start at bottom-left
            path.lineTo(halfW, -halfH);  // To bottom-right

            // Top-right corner with fold:
            path.lineTo(halfW, halfH - actualFoldSize);          // Up along right edge, stop before fold
            path.lineTo(halfW - actualFoldSize, halfH);          // Line of the fold itself
            
            path.lineTo(-halfW, halfH);  // To top-left
            path.closePath(); // Close path back to bottom-left
            return path;
        }

        const mainPath = _createFoldedPath(width, height, foldSize);
        const storableOuterShape = mainPath.clone();

        if (geometricLineWidthForHole > 0) {
            const innerWidth = width - 2 * geometricLineWidthForHole;
            const innerHeight = height - 2 * geometricLineWidthForHole;
            // Scale foldSize proportionally, or cap it if the inner dimensions are too small
            let innerFoldSize = foldSize * (innerWidth / width); // Proportional scaling
            innerFoldSize = Math.min(innerFoldSize, innerWidth / 2, innerHeight / 2);


            if (innerWidth > 0 && innerHeight > 0) {
                const holePath = _createFoldedPath(innerWidth, innerHeight, innerFoldSize);
                mainPath.holes.push(holePath);
            }
        }

        const geometry = new THREE.ExtrudeGeometry(mainPath, currentExtrusionSettings);
        const material = new DiagramEditMaterial(color);

        super(geometry, material);

        this.outerShape = storableOuterShape;
        this.shapeWidth = width;
        this.shapeHeight = height;
        this.shapeFoldSize = foldSize;
        this.shapeLineWidth = lineWidth; // This is now the geometric line width for the hole
        this.shapeDepth = currentExtrusionSettings.depth || ExtrusionParameters.depth;
        this.name = 'FoldedCornerRectangleShape';
    }

    getOuterShape() {
        return this.outerShape;
    }

    updateDimensions(newWidth, newHeight, newFoldSize, newLineWidth, newExtrusionSettingsOverride) {
        const width = newWidth || this.shapeWidth;
        const height = newHeight || this.shapeHeight;
        const foldSize = (newFoldSize !== undefined) ? newFoldSize : this.shapeFoldSize;
        const geometricLineWidthForHole = (newLineWidth !== undefined) ? newLineWidth : this.shapeLineWidth; // Use directly

        const currentExtrusionSettings = newExtrusionSettingsOverride || (this.geometry.parameters && this.geometry.parameters.options) || ExtrusionParameters;

        // Helper function (copied for clarity, could be a static method or outside class if preferred)
        function _createFoldedPath(w, h, fS) {
            const actualFoldSize = Math.min(fS, w / 2, h / 2);
             if (actualFoldSize <=0) {
                const path = new THREE.Shape();
                const halfW = w / 2;
                const halfH = h / 2;
                path.moveTo(-halfW, -halfH);
                path.lineTo(halfW, -halfH);
                path.lineTo(halfW, halfH);
                path.lineTo(-halfW, halfH);
                path.closePath();
                return path;
            }
            const path = new THREE.Shape();
            const halfW = w / 2;
            const halfH = h / 2;
            path.moveTo(-halfW, -halfH); 
            path.lineTo(halfW, -halfH);  
            path.lineTo(halfW, halfH - actualFoldSize);          
            path.lineTo(halfW - actualFoldSize, halfH);          
            path.lineTo(-halfW, halfH); 
            path.closePath(); 
            return path;
        }

        const mainPath = _createFoldedPath(width, height, foldSize);
        const storableOuterShape = mainPath.clone();

        if (geometricLineWidthForHole > 0) {
            const innerWidth = width - 2 * geometricLineWidthForHole;
            const innerHeight = height - 2 * geometricLineWidthForHole;
            let innerFoldSize = foldSize * (innerWidth / width);
            innerFoldSize = Math.min(innerFoldSize, innerWidth / 2, innerHeight / 2);

            if (innerWidth > 0 && innerHeight > 0) {
                const holePath = _createFoldedPath(innerWidth, innerHeight, innerFoldSize);
                mainPath.holes.push(holePath);
            }
        }

        this.outerShape = storableOuterShape;

        if (this.geometry) {
            this.geometry.dispose();
        }
        this.geometry = new THREE.ExtrudeGeometry(mainPath, currentExtrusionSettings);

        this.shapeWidth = width;
        this.shapeHeight = height;
        this.shapeFoldSize = foldSize;
        this.shapeLineWidth = geometricLineWidthForHole; // This is the geometric line width
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

export { FoldedCornerRectangleShape };
