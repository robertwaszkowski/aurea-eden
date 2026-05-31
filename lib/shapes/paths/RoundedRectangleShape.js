import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { RectangleDimensions } from './BasicShapeConstants.js';

class RoundedRectangleShape extends Shape {
    constructor(
        horizontalSize = RectangleDimensions.HORIZONTAL_SIZE,
        verticalSize = RectangleDimensions.VERTICAL_SIZE,
        cornerRadius = RectangleDimensions.CORNER_RADIUS,
        lineWidth = RectangleDimensions.LINE_WIDTH
    ) {
        super(horizontalSize, verticalSize, lineWidth, { cornerRadius });
        this.name = 'RoundedRectangleShape';
    }


    get2DPaths() {
        const width = this.width;
        const height = this.height;
        const outerRadius = this.cornerRadius;
        const innerRadius = this.cornerRadius - this.lineWidth;

        const roundedRect = (w, h, radius) => {
            const ctx = new THREE.Shape();
            const centerX = 0;
            const centerY = 0;
            const x = centerX - (w / 2);
            const y = centerY - (h / 2);
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + w - radius, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
            ctx.lineTo(x + w, y + h - radius);
            ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
            ctx.lineTo(x + radius, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            return ctx;
        };

        const activityShape = roundedRect(width, height, outerRadius);

        if (this.lineWidth > 0 && width > this.lineWidth * 2 && height > this.lineWidth * 2) {
            const activityHole = new THREE.Path();
            activityHole.copy(roundedRect(width - (2 * this.lineWidth), height - (2 * this.lineWidth), innerRadius));
            activityShape.holes.push(activityHole);
        }

        return [activityShape];
    }
}

export { RoundedRectangleShape };