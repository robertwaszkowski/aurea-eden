import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { DiamondDimensions, StrokeStyles } from './BasicShapeConstants.js';

class DiamondShape extends Shape {
    constructor(
        width = DiamondDimensions.DIAGONAL,
        height = DiamondDimensions.DIAGONAL,
        strokeStyle = StrokeStyles.THIN,
        extraConfig = {}
    ) {
        let targetStyle = strokeStyle;
        let config = extraConfig;
        if (typeof strokeStyle === 'number') {
            config = { strokeStyle: StrokeStyles.THIN, ...extraConfig };
            targetStyle = StrokeStyles.THIN;
        }

        super(width, height, DiamondDimensions.LINE_WIDTH, {
            strokeStyle: targetStyle,
            ...config
        });
        this.name = 'DiamondShape';
    }

    getSinglePath(w, h) {
        // To preserve perfectly uniform border thickness for the diamond:
        // If this is the inner path (w < this.width), we apply the mathematical diagonal scaling offset
        let finalW = w;
        let finalH = h;
        if (w < this.width) {
            const widthOffset = this.lineWidth * Math.sqrt(2) * 2;
            finalW = Math.max(0, this.width - widthOffset);
            finalH = Math.max(0, this.height - widthOffset);
        }

        const ctx = new THREE.Shape();
        const centerX = 0;
        const centerY = 0;
        ctx.moveTo(centerX - finalW / 2, centerY);
        ctx.lineTo(centerX, centerY - finalH / 2);
        ctx.lineTo(centerX + finalW / 2, centerY);
        ctx.lineTo(centerX, centerY + finalH / 2);
        ctx.lineTo(centerX - finalW / 2, centerY);
        ctx.closePath();
        return ctx;
    }
}

export { DiamondShape };