import * as THREE from 'three';
import { Shape } from '../Shape.js';

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
        // Custom shallower extrusion settings for Pools / Lanes
        const extrudeSettings = {
            steps: 1,
            depth: 0.4,
            bevelEnabled: true,
            bevelThickness: 0.1,
            bevelSize: 0.1,
            bevelOffset: 0,
            bevelSegments: 2
        };

        super(width, height, 1);
        this.extrusionSettings = extrudeSettings; // Override base settings
        this.rebuildGeometry(); // Rebuild geometry with shallow swimlane-specific settings

        // Interaction/Bounds Plane (Invisible) - stays exactly at the boundary width/height
        const planeGeo = new THREE.PlaneGeometry(width, height);
        const invisibleMaterial = new THREE.MeshBasicMaterial({ visible: false });
        this.boundsMesh = new THREE.Mesh(planeGeo, invisibleMaterial);
        this.attachment = this.boundsMesh;
        this.name = 'SwimlaneShape';
    }

    get2DPaths() {
        const halfBorder = 1; // 2-unit total thickness, 1 unit on each side of the boundary
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;

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

        return [rectShape];
    }

    updateDimensions(newWidth, newHeight) {
        super.updateDimensions(newWidth, newHeight);
        if (this.boundsMesh) {
            this.boundsMesh.geometry.dispose();
            this.boundsMesh.geometry = new THREE.PlaneGeometry(this.width, this.height);
        }
    }
}

export { SwimlaneShape };
