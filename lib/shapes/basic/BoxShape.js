import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { DiagramEditMaterial } from '../../materials/DiagramEditMaterial.js';

class BoxShape extends Shape {
    constructor() {
        const color = 0x0000ff;
        super(new THREE.BoxGeometry(1, 1, 1), new DiagramEditMaterial(color));
    }
}

export { BoxShape };