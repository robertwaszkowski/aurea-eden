import * as THREE from 'three';
import { RoundedCornerOrthogonalConnectorShape } from '../shapes/connector/RoundedCornerOrthogonalConnectorShape.js';

class Connector extends THREE.Mesh {
    constructor(elementId, 
                shape = new RoundedCornerOrthogonalConnectorShape(), 
                sourceElement = null,
                targetElement = null,
                sourcePoint = { x: 0, y: 0 },
                targetPoint = { x: 2, y: 2 },
                waypoints = [{ x: 0, y: 1 }, { x: 2, y: 1 }], 
                properties = {}) {
        super(shape.geometry, shape.material);
        this.elementId = elementId;
        this.sourceElement = sourceElement;
        this.targetElement = targetElement;
        this.shape = shape;
        this.points = [sourcePoint, ...waypoints, targetPoint];
        this.properties = properties;
    }

    setDiagram(diagram) {
        this.diagram = diagram;
    }

    static determinePoints(sourcePoint, targetPoint, sourcePosition, targetPosition) { //TODO: rozbudować o sourcePosition i targetPosition (np. trzyelementowe konektory)
        let waypoints = [];

        if (sourcePoint.x !== targetPoint.x && sourcePoint.y !== targetPoint.y) {
            // if source position starts with W or E then use the y coordinate of the source point
            // and the x coordinate of the target point
            if (sourcePosition.startsWith('W') || sourcePosition.startsWith('E')) {
                waypoints.push({ x: targetPoint.x, y: sourcePoint.y });
            }
            // if source position starts with N or S then use the x coordinate of the source point
            // and the y coordinate of the target point
            if (sourcePosition.startsWith('N') || sourcePosition.startsWith('S')) {
                waypoints.push({ x: sourcePoint.x, y: targetPoint.y });
            }
        }

        return [sourcePoint, ...waypoints, targetPoint];
    }    

}

export { Connector };