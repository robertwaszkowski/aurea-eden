import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { RectangleDimensions } from './BasicShapeConstants.js';

/**
 * Represents a 3D sharp-cornered rectangle shape with a hole, created by extruding a 2D rectangular path.
 */
class RectangleShape extends Shape {
    constructor(
        width = RectangleDimensions.HORIZONTAL_SIZE,
        height = RectangleDimensions.VERTICAL_SIZE,
        lineWidth = RectangleDimensions.LINE_WIDTH
    ) {
        super(width, height, lineWidth);
        this.name = 'RectangleShape';
    }

    get2DPaths() {
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;

        const mainRectPath = new THREE.Shape();
        mainRectPath.moveTo(-halfWidth, -halfHeight);
        mainRectPath.lineTo(halfWidth, -halfHeight);
        mainRectPath.lineTo(halfWidth, halfHeight);
        mainRectPath.lineTo(-halfWidth, halfHeight);
        mainRectPath.closePath();

        // Define the 2D path for the hole if lineWidth is positive
        if (this.lineWidth > 0 && this.width > this.lineWidth * 2 && this.height > this.lineWidth * 2) {
            const innerWidth = this.width - this.lineWidth * 2;
            const innerHeight = this.height - this.lineWidth * 2;
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

        return [mainRectPath];
    }
}

export { RectangleShape };
