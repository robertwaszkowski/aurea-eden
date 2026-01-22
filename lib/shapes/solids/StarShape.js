import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { DiagramEditMaterial } from '../../materials/DiagramEditMaterial.js';

class StarShape extends Shape {
    constructor(radius = 15, depth = 10, color = 0xffff00) {
        const points = 5;
        const innerRadius = radius * 0.5;
        const outerRadius = radius;

        // Generate boundary points (z=0)
        const boundaryPoints = [];
        const angleStep = Math.PI / points;

        for (let i = 0; i < 2 * points; i++) {
            const angle = i * angleStep + Math.PI / 2; // Start from top (90 degrees, pointing up)
            const r = (i % 2 === 0) ? outerRadius : innerRadius;
            boundaryPoints.push({
                x: Math.cos(angle) * r,
                y: Math.sin(angle) * r
            });
        }

        // Vertices array for non-indexed geometry (to ensure flat shading/hard edges)
        const vertices = [];

        // Center Apexes
        const frontZ = depth / 2;
        const backZ = -depth / 2;

        const numPoints = boundaryPoints.length;

        // Front Faces: Connect CenterFront to boundary segments
        for (let i = 0; i < numPoints; i++) {
            const nextIndex = (i + 1) % numPoints;

            // Triangle: CenterFront -> Current -> Next
            vertices.push(0, 0, frontZ);
            vertices.push(boundaryPoints[i].x, boundaryPoints[i].y, 0);
            vertices.push(boundaryPoints[nextIndex].x, boundaryPoints[nextIndex].y, 0);
        }

        // Back Faces: Connect CenterBack to boundary segments
        for (let i = 0; i < numPoints; i++) {
            const nextIndex = (i + 1) % numPoints;

            // Triangle: CenterBack -> Next -> Current (reversed winding)
            vertices.push(0, 0, backZ);
            vertices.push(boundaryPoints[nextIndex].x, boundaryPoints[nextIndex].y, 0);
            vertices.push(boundaryPoints[i].x, boundaryPoints[i].y, 0);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.computeVertexNormals(); // Computes face normals since vertices are unique

        const material = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.3,
            roughness: 0.2,
            emissive: new THREE.Color(color),
            emissiveIntensity: 0.2 // Reduced glow
        });

        super(geometry, material);

        // Store the lights as an attachment group to be added by the Element
        const lightGroup = new THREE.Group();

        // 1. Center Light (Main illumination)
        const centerLight = new THREE.PointLight(color, 1.0, 200); // Reduced from 1.5
        centerLight.position.set(0, 0, depth + 100);
        lightGroup.add(centerLight);

        // 2. Diamond Pattern for Highlights (Top, Bottom, Left, Right)
        // Positioned at +/- 40 XY and +60 Z to catch the ~18deg facet slope
        const sideIntensity = 0.8; // Reduced from 1.2
        const sideDist = 150;
        const offsetXY = 40;
        const offsetZ = 60;

        const leftLight = new THREE.PointLight(color, sideIntensity, sideDist);
        leftLight.position.set(-offsetXY, 0, depth + offsetZ);
        lightGroup.add(leftLight);

        const rightLight = new THREE.PointLight(color, sideIntensity, sideDist);
        rightLight.position.set(offsetXY, 0, depth + offsetZ);
        lightGroup.add(rightLight);

        const topLight = new THREE.PointLight(color, sideIntensity, sideDist);
        topLight.position.set(0, offsetXY, depth + offsetZ);
        lightGroup.add(topLight);

        const bottomLight = new THREE.PointLight(color, sideIntensity, sideDist);
        bottomLight.position.set(0, -offsetXY, depth + offsetZ);
        lightGroup.add(bottomLight);

        this.attachment = lightGroup;
    }
}

export { StarShape };
