import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { RectangleDimensions } from './BasicShapeConstants.js';

class FoldedCornerRectangleShape extends Shape {
    constructor(
        width = RectangleDimensions.HORIZONTAL_SIZE,
        height = RectangleDimensions.VERTICAL_SIZE,
        foldSize = RectangleDimensions.FOLD_SIZE,
        lineWidth = RectangleDimensions.LINE_WIDTH
    ) {
        super(width, height, lineWidth, { foldSize });
        this.name = 'FoldedCornerRectangleShape';
    }


    get2DPaths() {
        const width = this.width;
        const height = this.height;
        const foldSize = this.foldSize;
        const geometricLineWidthForHole = this.lineWidth;

        // Helper function to create the folded corner path
        const _createFoldedPath = (w, h, fS) => {
            const actualFoldSize = Math.min(fS, w / 2, h / 2);
            if (actualFoldSize <= 0) { // If foldSize is zero or negative, draw a simple rectangle
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
        };

        const mainPath = _createFoldedPath(width, height, foldSize);

        if (geometricLineWidthForHole > 0) {
            const innerWidth = width - 2 * geometricLineWidthForHole;
            const innerHeight = height - 2 * geometricLineWidthForHole;
            let innerFoldSize = foldSize * (innerWidth / width); // Proportional scaling
            innerFoldSize = Math.min(innerFoldSize, innerWidth / 2, innerHeight / 2);

            if (innerWidth > 0 && innerHeight > 0) {
                const holePath = _createFoldedPath(innerWidth, innerHeight, innerFoldSize);
                mainPath.holes.push(holePath);
            }
        }

        return [mainPath];
    }

    updateDimensions(newWidth, newHeight, newFoldSize, newLineWidth) {
        if (newFoldSize !== undefined) this.foldSize = newFoldSize;
        super.updateDimensions(newWidth, newHeight, newLineWidth);
    }
}

export { FoldedCornerRectangleShape };
