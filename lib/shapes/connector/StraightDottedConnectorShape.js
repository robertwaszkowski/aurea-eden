import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { ConnectorDimensions } from './ConnectorConstants.js';

class StraightDottedConnectorShape extends Shape {
    constructor(connectorPoints) {
        super(1, 1, 1, {
            points: connectorPoints || [],
            name: 'StraightDottedConnectorShape'
        });
    }

    get2DPaths() {
        if (!this.points || this.points.length < 2) return null;

        const start = this.points[0];
        const end = this.points[this.points.length - 1]; // Use first and last
        const p1 = new THREE.Vector2(start.x, start.y);
        const p2 = new THREE.Vector2(end.x, end.y);

        const lineWidth = ConnectorDimensions.CONNECTOR_LINE_WIDTH;

        const radius = lineWidth * 0.8;
        const gapLength = radius * 6; // Intermediate spacing

        const direction = new THREE.Vector2().subVectors(p2, p1);
        const totalLength = direction.length();

        if (totalLength < 1e-3) return null;

        direction.normalize();

        const shapes = [];

        let currentDist = 0;
        // Center the dots along the line
        while (currentDist <= totalLength) {
            // Center of the dot
            const center = new THREE.Vector2().copy(p1).add(direction.clone().multiplyScalar(currentDist));

            const dotShape = new THREE.Shape();
            dotShape.absarc(center.x, center.y, radius, 0, Math.PI * 2, false);

            shapes.push(dotShape);

            currentDist += (radius * 2) + gapLength;
        }

        return shapes;
    }
}

export { StraightDottedConnectorShape };
