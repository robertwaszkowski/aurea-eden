import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { RectangleDimensions, StrokeStyles } from './BasicShapeConstants.js';

/**
 * Represents a 3D sharp-cornered rectangle shape with a hole, created by extruding a 2D rectangular path.
 */
class RectangleShape extends Shape {
    constructor(
        width = RectangleDimensions.HORIZONTAL_SIZE,
        height = RectangleDimensions.VERTICAL_SIZE,
        strokeStyle = StrokeStyles.THIN,
        extraConfig = {}
    ) {
        let targetStyle = strokeStyle;
        let config = extraConfig;
        if (typeof strokeStyle === 'number') {
            config = { strokeStyle: StrokeStyles.THIN, ...extraConfig };
            targetStyle = StrokeStyles.THIN;
        }

        super(width, height, RectangleDimensions.LINE_WIDTH, {
            strokeStyle: targetStyle,
            ...config
        });
        this.name = 'RectangleShape';
    }

    getSinglePath(w, h) {
        const halfWidth = w / 2;
        const halfHeight = h / 2;

        const mainRectPath = new THREE.Shape();
        mainRectPath.moveTo(-halfWidth, -halfHeight);
        mainRectPath.lineTo(halfWidth, -halfHeight);
        mainRectPath.lineTo(halfWidth, halfHeight);
        mainRectPath.lineTo(-halfWidth, halfHeight);
        mainRectPath.closePath();

        return mainRectPath;
    }
}

export { RectangleShape };
