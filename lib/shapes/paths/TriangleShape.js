import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { TriangleDimensions } from './BasicShapeConstants.js';

class TriangleShape extends Shape {
    constructor(
        size = TriangleDimensions.SIZE,
        lineWidth = TriangleDimensions.LINE_WIDTH
    ) {
        super(size, size, lineWidth);
        this.name = 'TriangleShape';
    }

    get2DPaths() {
        const size = this.width;
        // Calculate the geometric line width needed for the hole to achieve the target visible line width
        let geometricLineWidthForHole = this.lineWidth;
        if (this.extrusionSettings.bevelEnabled && this.extrusionSettings.bevelSize > 0) {
            geometricLineWidthForHole = this.lineWidth + (2 * this.extrusionSettings.bevelSize);
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

        return [mainTrianglePath];
    }
}

export { TriangleShape };
