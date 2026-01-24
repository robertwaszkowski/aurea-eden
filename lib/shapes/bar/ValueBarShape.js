// Replace the entire contents of ValueBarShape.js with this code

import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { BarMaterial } from '../../materials/BarMaterial.js';
import { ExtrusionParameters } from './ValueBarConstants.js';

class ValueBarShape extends Shape {
    /**
     * Creates a new ValueBarShape.
     * This is a simple component that receives a pre-calculated height and color.
     * @param {THREE.Shape} shape The 2D base shape of the bar.
     * @param {number} height The final, normalized height of the bar.
     * @param {THREE.Color} color The final, pre-calculated color for the bar.
     * @param {string} theme The current diagram theme.
     */
    constructor(shape, height, color, theme = 'LIGHT') {
        if (!(shape instanceof THREE.Shape)) {
            throw new TypeError('shape must be an instance of THREE.Shape');
        }
        if (typeof height !== 'number') {
            throw new TypeError('height must be a number.');
        }
        if (!(color instanceof THREE.Color)) {
            throw new TypeError('color must be an instance of THREE.Color.');
        }

        const extrusionParameters = { ...ExtrusionParameters, depth: height };
        const barGeometry = new THREE.ExtrudeGeometry(shape, extrusionParameters);

        // Use the height and color that were passed in directly
        super(barGeometry, new BarMaterial(color, theme));

        this.type = 'ValueBarShape';
    }
}

export { ValueBarShape };