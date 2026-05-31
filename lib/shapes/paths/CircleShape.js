import * as THREE from 'three';
import { Shape } from '../Shape';
import { CircleDimensions, StrokeStyles } from './BasicShapeConstants.js';

class CircleShape extends Shape {
    constructor(
        width = CircleDimensions.RADIUS * 2,
        height = CircleDimensions.RADIUS * 2,
        strokeStyle = StrokeStyles.THIN,
        extraConfig = {}
    ) {
        // Adjust initial dimensions based on radius fallback
        let targetWidth = width;
        let targetHeight = height;
        if (!width || !height) {
            targetWidth = CircleDimensions.RADIUS * 2;
            targetHeight = CircleDimensions.RADIUS * 2;
        }

        // Support passing legacy absolute line width numbers directly for backward compatibility
        let config = extraConfig;
        let targetStyle = strokeStyle;
        if (typeof strokeStyle === 'number') {
            config = { strokeStyle: legacyStrokeToStyle(strokeStyle), ...extraConfig };
            targetStyle = legacyStrokeToStyle(strokeStyle);
        }

        super(targetWidth, targetHeight, CircleDimensions.LINE_WIDTH_NORMAL, {
            strokeStyle: targetStyle,
            ...config
        });
        this.name = 'CircleShape';
    }

    getSinglePath(w, h) {
        const radius = Math.min(w, h) / 2;
        const path = new THREE.Shape();
        const centerX = 0;
        const centerY = 0;
        const controlPointDistance = radius * 0.552284749831; // (4/3)*tan(pi/8)

        path.moveTo(centerX, centerY - radius);
        path.bezierCurveTo(centerX + controlPointDistance, centerY - radius,
                          centerX + radius, centerY - controlPointDistance,
                          centerX + radius, centerY);
        path.bezierCurveTo(centerX + radius, centerY + controlPointDistance,
                          centerX + controlPointDistance, centerY + radius,
                          centerX, centerY + radius);
        path.bezierCurveTo(centerX - controlPointDistance, centerY + radius,
                          centerX - radius, centerY + controlPointDistance,
                          centerX - radius, centerY);
        path.bezierCurveTo(centerX - radius, centerY - controlPointDistance,
                          centerX - controlPointDistance, centerY - radius,
                          centerX, centerY - radius);
        return path;
    }

    getDashedPaths() {
        const radius = Math.min(this.width, this.height) / 2;
        const numDashes = 12;
        const step = (Math.PI * 2) / numDashes;
        const dashFraction = 0.6; // 60% dash, 40% gap
        const shapes = [];

        const outerR = radius;
        const innerR = radius - this.lineWidth;

        if (innerR <= 0) return null;

        for (let i = 0; i < numDashes; i++) {
            const theta1 = i * step;
            const theta2 = theta1 + step * dashFraction;

            const dashShape = new THREE.Shape();
            // Start at outer radius, theta1
            dashShape.moveTo(Math.cos(theta1) * outerR, Math.sin(theta1) * outerR);
            // Arc outer to theta2
            dashShape.absarc(0, 0, outerR, theta1, theta2, false);
            // Line to inner radius, theta2
            dashShape.lineTo(Math.cos(theta2) * innerR, Math.sin(theta2) * innerR);
            // Arc inner back to theta1 (clockwise/reverse)
            dashShape.absarc(0, 0, innerR, theta2, theta1, true);
            dashShape.closePath();

            shapes.push(dashShape);
        }
        return shapes;
    }
}

// Helper to resolve legacy numeric stroke widths
function legacyStrokeToStyle(lineWidth) {
    if (lineWidth === CircleDimensions.LINE_WIDTH_THICK) return StrokeStyles.THICK;
    if (lineWidth === CircleDimensions.LINE_WIDTH_THIN) return StrokeStyles.THIN;
    return StrokeStyles.THIN;
}

export { CircleShape };
