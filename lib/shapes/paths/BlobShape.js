// Add a custom shape

import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { ExtrusionParameters } from '../../diagrams/DiagramConstants.js';
import { DiagramEditMaterial } from '../../materials/DiagramEditMaterial.js';

class BlobShape extends Shape {

    constructor(size = 60, color = 0xFFB74D) {
        const blobPath = new THREE.Shape();

        // The 's' factor scales the normalized coordinates to the desired size.
        // We define the shape in a conceptual [-1, 1] box and then scale it.
        const s = size / 2;

        // Starting point (P0) - top-right-ish
        blobPath.moveTo(s * 0.5, s * 0.6);

        // Curve to P1 (right, slightly down)
        blobPath.quadraticCurveTo(s * 0.8, s * 0.7,   s * 0.9, s * 0.15);  // CP1, P1
        // Curve to P2 (bottom-right lobe)
        blobPath.quadraticCurveTo(s * 0.95, s * -0.4,  s * 0.65, s * -0.7); // CP2, P2
        // Curve to P3 (bottom-left lobe)
        blobPath.quadraticCurveTo(s * 0.2, s * -0.9,   s * -0.4, s * -0.65); // CP3, P3
        // Curve to P4 (left side prominence)
        blobPath.quadraticCurveTo(s * -0.85, s * -0.45, s * -0.8, s * 0.05); // CP4, P4
        // Curve to P5 (top-left lobe)
        blobPath.quadraticCurveTo(s * -0.7, s * 0.65,  s * -0.25, s * 0.75); // CP5, P5
        // Curve back to P0 (top side, closing the shape)
        blobPath.quadraticCurveTo(s * 0.15, s * 0.85,  s * 0.5, s * 0.6);   // CP6, P0

        // Extrude the 2D shape to give it some depth
        const extrusionParameters = ExtrusionParameters;
        const geometry = new THREE.ExtrudeGeometry(blobPath, extrusionParameters);

        // Define the material (appearance)
        const material = new DiagramEditMaterial(color);

        // Call the parent Shape constructor
        super(geometry, material);

        // Define approximate width/height for layout purposes
        this.width = size;
        this.height = size;

    }

}

export { BlobShape };
