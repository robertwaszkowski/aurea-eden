import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { DiagramEditMaterial } from '../../materials/DiagramEditMaterial.js';
import { ExtrusionParameters, Colors } from '../../diagrams/DiagramConstants.js';
import { ConnectorDimensions } from './ConnectorConstants.js';

class StraightDottedConnectorShape extends Shape {
    constructor(connectorPoints) {
        if (!connectorPoints || connectorPoints.length < 2) {
            console.error("StraightDottedConnectorShape requires at least 2 points.");
            // Return empty shape or handle error
            super(new THREE.BufferGeometry(), new DiagramEditMaterial(Colors.ELEMENT_STROKE));
            return;
        }

        const start = connectorPoints[0];
        const end = connectorPoints[connectorPoints.length - 1]; // Use first and last
        const p1 = new THREE.Vector2(start.x, start.y);
        const p2 = new THREE.Vector2(end.x, end.y);

        const lineWidth = ConnectorDimensions.CONNECTOR_LINE_WIDTH;
        const color = Colors.ELEMENT_STROKE;
        const extrudeSettings = ExtrusionParameters;

        // Dotted line parameters
        // For dots, we want circles. Diameter roughly equal to line width.
        const dotRadius = lineWidth; // slightly larger than line width for visibility? Or match. 
        // Screenshot shows dots clearly visible. Let's try 1.5 * lineWidth/2 radius

        // Actually, let's keep it simple first. Radius = lineWidth / 2 * scalar
        const radius = lineWidth * 0.8;
        const gapLength = radius * 6; // Intermediate spacing

        const direction = new THREE.Vector2().subVectors(p2, p1);
        const totalLength = direction.length();
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

        // Create geometry from array of shapes
        const geometry = new THREE.ExtrudeGeometry(shapes, extrudeSettings);

        super(geometry, new DiagramEditMaterial(color));
        this.name = 'StraightDottedConnectorShape';
    }
}

export { StraightDottedConnectorShape };
