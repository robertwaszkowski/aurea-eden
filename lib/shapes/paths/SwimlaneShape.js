import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { Colors } from '../../diagrams/DiagramConstants.js';

/**
 * Represents a 3D rectangular bounding box used for Pools and Lanes.
 * Uses an invisible mesh for bounds, providing a LineSegments object for actual 1px rendering.
 */
class SwimlaneShape extends Shape {
    /**
     * Creates an instance of SwimlaneShape.
     * @param {number} width - The width of the swimlane.
     * @param {number} height - The height of the swimlane.
     */
    constructor(width, height) {
        const color = Colors.ELEMENT_STROKE;

        // Create a flat 2D plane geometry for Mesh raycasting/bounds
        const planeGeo = new THREE.PlaneGeometry(width, height);
        // Invisible material so the Mesh itself doesn't render blocking artifacts
        const invisibleMaterial = new THREE.MeshBasicMaterial({ visible: false });

        super(planeGeo, invisibleMaterial);

        // Extract just the edges to draw the outline (LineSegments)
        const edgesGeo = new THREE.EdgesGeometry(planeGeo);
        // Use a basic LineBasicMaterial for the stroke, guaranteed 1px on-screen thickness
        this.lineSegments = new THREE.LineSegments(edgesGeo, new THREE.LineBasicMaterial({ color: color, linewidth: 1 }));

        // Store standard shape properties
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        const mainRectPath = new THREE.Shape();
        mainRectPath.moveTo(-halfWidth, -halfHeight);
        mainRectPath.lineTo(halfWidth, -halfHeight);
        mainRectPath.lineTo(halfWidth, halfHeight);
        mainRectPath.lineTo(-halfWidth, halfHeight);
        mainRectPath.closePath();
        this.outerShape = mainRectPath;

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

        const planeGeo = new THREE.PlaneGeometry(width, height);
        const edgesGeo = new THREE.EdgesGeometry(planeGeo);

        const halfWidth = width / 2;
        const halfHeight = height / 2;
        const mainRectPath = new THREE.Shape();
        mainRectPath.moveTo(-halfWidth, -halfHeight);
        mainRectPath.lineTo(halfWidth, -halfHeight);
        mainRectPath.lineTo(halfWidth, halfHeight);
        mainRectPath.lineTo(-halfWidth, halfHeight);
        mainRectPath.closePath();
        this.outerShape = mainRectPath;

        if (this.geometry) {
            this.geometry.dispose();
        }

        this.geometry = planeGeo;

        if (this.lineSegments) {
            this.lineSegments.geometry.dispose();
            this.lineSegments.geometry = edgesGeo;
        }

        this.shapeWidth = width;
        this.shapeHeight = height;
    }

    updateColor(newColor) {
        if (this.lineSegments && this.lineSegments.material && this.lineSegments.material.color && typeof this.lineSegments.material.color.set === 'function') {
            this.lineSegments.material.color.set(newColor);
        }
    }
}

export { SwimlaneShape };
