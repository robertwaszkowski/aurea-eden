import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { DiagramEditMaterial } from '../../materials/DiagramEditMaterial.js';
import { Colors } from '../../diagrams/DiagramConstants.js';
import { ConnectorDimensions } from './ConnectorConstants.js';

/**
 * Dashed orthogonal connector: dashed line with an open circle at start and open triangle at end.
 * Optimized for sharp 3D aesthetics with tuned beveling and precise start/end offsets.
 */
class DashedOrthogonalConnectorShape extends Shape {
    constructor(connectorPoints) {
        if (!connectorPoints || connectorPoints.length < 2) {
            super(new THREE.BufferGeometry(), new DiagramEditMaterial(Colors.ELEMENT_STROKE));
            return;
        }

        const lineWidth = ConnectorDimensions.CONNECTOR_LINE_WIDTH;
        const color = Colors.ELEMENT_STROKE;

        const tunedExtrudeSettings = {
            steps: 1,
            depth: 0.4,
            bevelEnabled: true,
            bevelThickness: 0.1,
            bevelSize: 0.1,
            bevelOffset: 0,
            bevelSegments: 2
        };

        // Arrowhead/StartCircle dimensions
        const headWidth = ConnectorDimensions.CONNECTOR_ARROWHEAD_WIDTH * 2;
        const headLength = ConnectorDimensions.CONNECTOR_ARROWHEAD_LENGTH;
        const startCircleRadius = 4;

        // Tuned Dashes
        const dashLength = 4;
        const gapLength = 6;

        const shapes = [];

        for (let i = 0; i < connectorPoints.length - 1; i++) {
            const p1 = connectorPoints[i];
            const p2 = connectorPoints[i + 1];

            const segmentDir = new THREE.Vector2().subVectors(p2, p1);
            const segmentLen = segmentDir.length();
            segmentDir.normalize();

            const normal = new THREE.Vector2(-segmentDir.y, segmentDir.x).multiplyScalar(lineWidth / 2);

            // dashening starts after the circle and ends before the arrowhead
            let currentPos = (i === 0) ? startCircleRadius : 0;
            const stopPos = (i === connectorPoints.length - 2) ? (segmentLen - headLength) : segmentLen;

            while (currentPos < stopPos) {
                const drawLen = Math.min(dashLength, stopPos - currentPos);
                if (drawLen <= 0) break;

                const dashShape = new THREE.Shape();
                const startPoint = new THREE.Vector2().copy(p1).add(segmentDir.clone().multiplyScalar(currentPos));
                const endPoint = new THREE.Vector2().copy(p1).add(segmentDir.clone().multiplyScalar(currentPos + drawLen));

                dashShape.moveTo(startPoint.x + normal.x, startPoint.y + normal.y);
                dashShape.lineTo(endPoint.x + normal.x, endPoint.y + normal.y);
                dashShape.lineTo(endPoint.x - normal.x, endPoint.y - normal.y);
                dashShape.lineTo(startPoint.x - normal.x, startPoint.y - normal.y);
                dashShape.closePath();

                shapes.push(dashShape);
                currentPos += dashLength + gapLength;
            }
        }

        // 1. Add Start Circle (Open)
        const start = connectorPoints[0];
        const startCircle = new THREE.Shape();
        startCircle.absarc(start.x, start.y, startCircleRadius, 0, Math.PI * 2, false);
        const innerHole = new THREE.Path();
        innerHole.absarc(start.x, start.y, startCircleRadius - (lineWidth), 0, Math.PI * 2, true);
        startCircle.holes.push(innerHole);
        shapes.push(startCircle);

        // 2. Add End Arrowhead (Open Triangle)
        const end = connectorPoints[connectorPoints.length - 1];
        const last = connectorPoints[connectorPoints.length - 2];
        const endDir = new THREE.Vector2().subVectors(end, last).normalize();
        const endNormal = new THREE.Vector2(-endDir.y, endDir.x);

        // Outer triangle vertices
        const tip = end;
        const baseLeft = new THREE.Vector2().copy(end).sub(endDir.clone().multiplyScalar(headLength)).add(endNormal.clone().multiplyScalar(headWidth / 2));
        const baseRight = new THREE.Vector2().copy(end).sub(endDir.clone().multiplyScalar(headLength)).sub(endNormal.clone().multiplyScalar(headWidth / 2));

        const arrowShape = new THREE.Shape();
        arrowShape.moveTo(tip.x, tip.y);
        arrowShape.lineTo(baseLeft.x, baseLeft.y);
        arrowShape.lineTo(baseRight.x, baseRight.y);
        arrowShape.closePath();

        // Inner triangle with perfectly parallel edges
        // We calculate the bisectors at each vertex to find the inner points
        const wallThickness = lineWidth * 1.5;

        // Vectors for edges
        const vTipToBaseLeft = new THREE.Vector2().subVectors(baseLeft, tip).normalize();
        const vTipToBaseRight = new THREE.Vector2().subVectors(baseRight, tip).normalize();
        const vBaseLeftToBaseRight = new THREE.Vector2().subVectors(baseRight, baseLeft).normalize();

        // Bisector at Tip
        const bisectorTip = new THREE.Vector2().addVectors(vTipToBaseLeft, vTipToBaseRight).normalize();
        const angleTip = Math.acos(vTipToBaseLeft.dot(vTipToBaseRight));
        const distTip = wallThickness / Math.sin(angleTip / 2);
        const innerTip = new THREE.Vector2().copy(tip).add(bisectorTip.multiplyScalar(distTip));

        // Bisector at BaseLeft
        const vBaseLeftToTip = vTipToBaseLeft.clone().negate();
        const bisectorBaseLeft = new THREE.Vector2().addVectors(vBaseLeftToTip, vBaseLeftToBaseRight).normalize();
        const angleBaseLeft = Math.acos(vBaseLeftToTip.dot(vBaseLeftToBaseRight));
        const distBaseLeft = wallThickness / Math.sin(angleBaseLeft / 2);
        const innerBaseLeft = new THREE.Vector2().copy(baseLeft).add(bisectorBaseLeft.multiplyScalar(distBaseLeft));

        // Bisector at BaseRight
        const vBaseRightToTip = vTipToBaseRight.clone().negate();
        const vBaseRightToBaseLeft = vBaseLeftToBaseRight.clone().negate();
        const bisectorBaseRight = new THREE.Vector2().addVectors(vBaseRightToTip, vBaseRightToBaseLeft).normalize();
        const angleBaseRight = Math.acos(vBaseRightToTip.dot(vBaseRightToBaseLeft));
        const distBaseRight = wallThickness / Math.sin(angleBaseRight / 2);
        const innerBaseRight = new THREE.Vector2().copy(baseRight).add(bisectorBaseRight.multiplyScalar(distBaseRight));

        const arrowHole = new THREE.Path();
        arrowHole.moveTo(innerTip.x, innerTip.y);
        arrowHole.lineTo(innerBaseLeft.x, innerBaseLeft.y);
        arrowHole.lineTo(innerBaseRight.x, innerBaseRight.y);
        arrowHole.closePath();
        arrowShape.holes.push(arrowHole);

        shapes.push(arrowShape);

        const geometry = new THREE.ExtrudeGeometry(shapes, tunedExtrudeSettings);
        super(geometry, new DiagramEditMaterial(color));
        this.name = 'DashedOrthogonalConnectorShape';
    }
}

export { DashedOrthogonalConnectorShape };
