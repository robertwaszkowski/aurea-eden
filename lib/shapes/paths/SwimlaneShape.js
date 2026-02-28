import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { Colors } from '../../diagrams/DiagramConstants.js';
import { DiagramEditMaterial } from '../../materials/DiagramEditMaterial.js';

/**
 * Represents a 3D rectangular bounding box used for Pools and Lanes with extruded 3D borders.
 * The border is 2 units wide and centered on the theoretical boundary (1 unit in, 1 unit out).
 */
class SwimlaneShape extends Shape {
    /**
     * Creates an instance of SwimlaneShape.
     * @param {number} width - The width of the swimlane.
     * @param {number} height - The height of the swimlane.
     */
    constructor(width, height) {
        const color = Colors.ELEMENT_STROKE;
        const halfBorder = 1; // 2-unit total thickness, 1 unit on each side of the boundary

        const extrudeSettings = {
            steps: 1,
            depth: 0.4,
            bevelEnabled: true,
            bevelThickness: 0.1,
            bevelSize: 0.1,
            bevelOffset: 0,
            bevelSegments: 2
        };

        const halfWidth = width / 2;
        const halfHeight = height / 2;

        // Center the 2-unit border on the boundary:
        // Outer rect sits 1 unit outside the boundary
        const rectShape = new THREE.Shape();
        rectShape.moveTo(-halfWidth - halfBorder, -halfHeight - halfBorder);
        rectShape.lineTo(halfWidth + halfBorder, -halfHeight - halfBorder);
        rectShape.lineTo(halfWidth + halfBorder, halfHeight + halfBorder);
        rectShape.lineTo(-halfWidth - halfBorder, halfHeight + halfBorder);
        rectShape.closePath();

        // Inner hole sits 1 unit inside the boundary
        const holePath = new THREE.Path();
        holePath.moveTo(-halfWidth + halfBorder, -halfHeight + halfBorder);
        holePath.lineTo(halfWidth - halfBorder, -halfHeight + halfBorder);
        holePath.lineTo(halfWidth - halfBorder, halfHeight - halfBorder);
        holePath.lineTo(-halfWidth + halfBorder, halfHeight - halfBorder);
        holePath.closePath();
        rectShape.holes.push(holePath);

        const geometry = new THREE.ExtrudeGeometry(rectShape, extrudeSettings);
        super(geometry, new DiagramEditMaterial(color));

        // Interaction/Bounds Plane (Invisible) - stays exactly at the boundary width/height
        const planeGeo = new THREE.PlaneGeometry(width, height);
        const invisibleMaterial = new THREE.MeshBasicMaterial({ visible: false });
        this.boundsMesh = new THREE.Mesh(planeGeo, invisibleMaterial);

        this.attachment = this.boundsMesh;

        this.outerShape = rectShape;
        this.shapeWidth = width;
        this.shapeHeight = height;
        this.name = 'SwimlaneShape';
    }

    getOuterShape() {
        return this.outerShape;
    }

    updateDimensions(newWidth, newHeight) {
        const width = newWidth || this.shapeWidth;
        const height = newHeight || this.shapeHeight;
        const halfBorder = 1;

        const extrudeSettings = {
            steps: 1,
            depth: 0.4,
            bevelEnabled: true,
            bevelThickness: 0.1,
            bevelSize: 0.1,
            bevelOffset: 0,
            bevelSegments: 2
        };

        const halfWidth = width / 2;
        const halfHeight = height / 2;

        const rectShape = new THREE.Shape();
        rectShape.moveTo(-halfWidth - halfBorder, -halfHeight - halfBorder);
        rectShape.lineTo(halfWidth + halfBorder, -halfHeight - halfBorder);
        rectShape.lineTo(halfWidth + halfBorder, halfHeight + halfBorder);
        rectShape.lineTo(-halfWidth - halfBorder, halfHeight + halfBorder);
        rectShape.closePath();

        const holePath = new THREE.Path();
        holePath.moveTo(-halfWidth + halfBorder, -halfHeight + halfBorder);
        holePath.lineTo(halfWidth - halfBorder, -halfHeight + halfBorder);
        holePath.lineTo(halfWidth - halfBorder, halfHeight - halfBorder);
        holePath.lineTo(-halfWidth + halfBorder, halfHeight - halfBorder);
        holePath.closePath();
        rectShape.holes.push(holePath);

        if (this.geometry) {
            this.geometry.dispose();
        }
        this.geometry = new THREE.ExtrudeGeometry(rectShape, extrudeSettings);

        if (this.boundsMesh) {
            this.boundsMesh.geometry.dispose();
            this.boundsMesh.geometry = new THREE.PlaneGeometry(width, height);
        }

        this.outerShape = rectShape;
        this.shapeWidth = width;
        this.shapeHeight = height;
    }

    updateColor(newColor) {
        if (this.material && this.material.color && typeof this.material.color.set === 'function') {
            this.material.color.set(newColor);
        }
    }
}

export { SwimlaneShape };
