import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { CircleDimensions } from './BasicShapeConstants.js';

class CircleShape extends Shape {
    constructor(
        width = CircleDimensions.RADIUS * 2,
        height = CircleDimensions.RADIUS * 2,
        lineWidth = CircleDimensions.LINE_WIDTH_NORMAL
    ) {
        // Adjust initial dimensions based on radius fallback
        let targetWidth = width;
        let targetHeight = height;
        if (!width || !height) {
            targetWidth = CircleDimensions.RADIUS * 2;
            targetHeight = CircleDimensions.RADIUS * 2;
        }

        super(targetWidth, targetHeight, lineWidth);
        this.name = 'CircleShape';
    }

    get2DPaths() {
        const radius = Math.min(this.width, this.height) / 2;

        const drawCircle = (r) => {
            const path = new THREE.Shape();
            const centerX = 0;
            const centerY = 0;
            const controlPointDistance = r * 0.552284749831; // (4/3)*tan(pi/8)

            path.moveTo(centerX, centerY - r);
            path.bezierCurveTo(centerX + controlPointDistance, centerY - r,
                              centerX + r, centerY - controlPointDistance,
                              centerX + r, centerY);
            path.bezierCurveTo(centerX + r, centerY + controlPointDistance,
                              centerX + controlPointDistance, centerY + r,
                              centerX, centerY + r);
            path.bezierCurveTo(centerX - controlPointDistance, centerY + r,
                              centerX - r, centerY + controlPointDistance,
                              centerX - r, centerY);
            path.bezierCurveTo(centerX - r, centerY - controlPointDistance,
                              centerX - controlPointDistance, centerY - r,
                              centerX, centerY - r);
            return path;
        };

        const outerRing = drawCircle(radius);

        // Define the inner hole path representing the inner boundary of the stroke outline
        if (this.lineWidth > 0 && radius > this.lineWidth) {
            const holePath = new THREE.Path();
            holePath.copy(drawCircle(radius - this.lineWidth));
            outerRing.holes.push(holePath);
        }

        return [outerRing];
    }
}

export { CircleShape };

