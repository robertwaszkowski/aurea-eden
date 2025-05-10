import * as THREE from 'three';

// class DiagramEditMaterial extends THREE.MeshPhongMaterial {
//   constructor(color) {
//     super({
//       color: color,
//       shininess: 60,
//       specular: 0x666666,
//       emissive: 0x444444,
//       emissiveIntensity: 0.6,
//       side: THREE.DoubleSide
//     });
//   }
// }

class DiagramEditMaterial extends THREE.MeshLambertMaterial {
  constructor(color) {
    super({
      vertexColors: false,
      color: color,
      side: THREE.DoubleSide,
      emissive: new THREE.Color(color),
      emissiveIntensity: .1
    });
  }
}

export { DiagramEditMaterial };