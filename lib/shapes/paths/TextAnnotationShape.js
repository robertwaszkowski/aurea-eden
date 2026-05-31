import * as THREE from 'three';
import { Shape } from '../Shape.js';

/**
 * Represents a 3D text annotation shape (an open rectangle bracket), created by extruding a 2D path.
 */
class TextAnnotationShape extends Shape {
    constructor(
        width = 100,
        height = 50,
        lineWidth = 1
    ) {
        super(width, height, lineWidth);
        this.name = 'TextAnnotationShape';
    }

    get2DPaths() {
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        const bracketLength = 10; // Short horizontal legs

        const bracketPath = new THREE.Shape();

        // Outer boundary (Counter-Clockwise)
        bracketPath.moveTo(-halfWidth + bracketLength, halfHeight);
        bracketPath.lineTo(-halfWidth, halfHeight);
        bracketPath.lineTo(-halfWidth, -halfHeight);
        bracketPath.lineTo(-halfWidth + bracketLength, -halfHeight);

        // Inner boundary (Clockwise)
        bracketPath.lineTo(-halfWidth + bracketLength, -halfHeight + this.lineWidth);
        bracketPath.lineTo(-halfWidth + this.lineWidth, -halfHeight + this.lineWidth);
        bracketPath.lineTo(-halfWidth + this.lineWidth, halfHeight - this.lineWidth);
        bracketPath.lineTo(-halfWidth + bracketLength, halfHeight - this.lineWidth);

        bracketPath.closePath();

        return [bracketPath];
    }
}

export { TextAnnotationShape };
