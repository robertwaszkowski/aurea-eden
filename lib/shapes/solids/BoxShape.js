import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { DiagramEditMaterial } from '../../materials/DiagramEditMaterial.js';

class BoxShape extends Shape {
    constructor(width = 40, height = 40, depth = 40, color = 0x0000ff) {
        super(new THREE.BoxGeometry(width, height, depth), new DiagramEditMaterial(color));
    }
}

export { BoxShape };