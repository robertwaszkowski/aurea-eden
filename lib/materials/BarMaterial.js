import * as THREE from 'three';

class BarMaterial extends THREE.MeshPhongMaterial {
  constructor(color) {
    super({
      color: color,
      opacity: 0.3, 
      transparent: true,
      shininess: 60,
      specular: 0x666666,
      emissive: 0x444444,
      emissiveIntensity: 0.6
    });
  }
}

export { BarMaterial };