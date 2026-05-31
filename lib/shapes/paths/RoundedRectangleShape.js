import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { RectangleDimensions, StrokeStyles } from './BasicShapeConstants.js';

class RoundedRectangleShape extends Shape {
    constructor(
        horizontalSize = RectangleDimensions.HORIZONTAL_SIZE,
        verticalSize = RectangleDimensions.VERTICAL_SIZE,
        cornerRadius = RectangleDimensions.CORNER_RADIUS,
        strokeStyle = StrokeStyles.THIN,
        extraConfig = {}
    ) {
        let targetStyle = strokeStyle;
        let config = extraConfig;
        if (typeof strokeStyle === 'number') {
            config = { strokeStyle: StrokeStyles.THIN, ...extraConfig };
            targetStyle = StrokeStyles.THIN;
        }

        super(horizontalSize, verticalSize, RectangleDimensions.LINE_WIDTH, {
            cornerRadius,
            strokeStyle: targetStyle,
            ...config
        });
        this.name = 'RoundedRectangleShape';
    }

    getSinglePath(w, h) {
        const radius = this.cornerRadius;
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
    }
}

export { RoundedRectangleShape };