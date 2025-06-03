import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { DiagramEditMaterial } from '../../materials/DiagramEditMaterial.js';
import { ExtrusionParameters } from '../../diagrams/DiagramConstants.js';

class TriangleShape extends Shape {
    constructor(size = 60, color = 0xffa500) {
        // Define the 2D path of the triangle
        const trianglePath = new THREE.Shape();
        trianglePath.moveTo(0, size / 2);        // Top point
        trianglePath.lineTo(size / 2, -size / 2); // Bottom-right point
        trianglePath.lineTo(-size / 2, -size / 2); // Bottom-left point
        trianglePath.closePath();                // Close the path

        // Extrude the 2D shape to give it some depth (for 3D appearance)
        const extrusionParameters = ExtrusionParameters;
        const geometry = new THREE.ExtrudeGeometry(trianglePath, extrusionParameters);
        
        // Define the material (appearance)
        const material = new DiagramEditMaterial(color); // Using a default Aurea EDEN material

        // Call the parent Shape constructor with the geometry and material
        super(geometry, material);

        // Optionally, define approximate width/height for layout purposes
        this.width = size;
        this.height = size;
    }
}

export { TriangleShape };
