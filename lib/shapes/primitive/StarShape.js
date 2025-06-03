import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { DiagramEditMaterial } from '../../materials/DiagramEditMaterial.js';

class StarShape extends Shape {
    /**
     * Creates a star shape.
     * @param {number} [outerRadius=30] - The outer radius of the star.
     * @param {number} [innerRadius=15] - The inner radius of the star.
     * @param {number} [numPoints=8] - The number of points on the star.
     * @param {number} [color=0xffff00] - The color of the star (default is yellow).
     */
    constructor(outerRadius = 30, innerRadius = 15, numPoints = 8, color = 0x00bfff) {
        const starPath = new THREE.Shape();

        // Adjust angles to make the top point go upwards
        const angleOffset = -Math.PI / 2; // Start with a point straight up
        const angleStep = (Math.PI * 2) / numPoints;

        starPath.moveTo(
            outerRadius * Math.cos(angleOffset),
            outerRadius * Math.sin(angleOffset)
        );

        for (let i = 0; i < numPoints; i++) {
            // Outer point
            const outerAngle = i * angleStep + angleOffset;
            starPath.lineTo(
                outerRadius * Math.cos(outerAngle),
                outerRadius * Math.sin(outerAngle)
            );

            // Inner point
            const innerAngle = outerAngle + angleStep / 2;
            starPath.lineTo(
                innerRadius * Math.cos(innerAngle),
                innerRadius * Math.sin(innerAngle)
            );
        }

        // Close the path to the first point (which was an outer point)
        starPath.closePath();

        // Extrude the 2D shape to give it some depth
        const extrudeSettings = { depth: 1, bevelEnabled: false };
        const geometry = new THREE.ExtrudeGeometry(starPath, extrudeSettings);

        // Define the material (appearance)
        const material = new DiagramEditMaterial(color);

        // Call the parent Shape constructor
        super(geometry, material);

        // Define approximate width/height for layout purposes
        // For a star, this is roughly twice the outer radius
        this.width = outerRadius * 2;
        this.height = outerRadius * 2;
        this.numPoints = numPoints; // Store for potential future use
    }
}

export { StarShape };