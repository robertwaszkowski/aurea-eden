import * as THREE from 'three';

class BarMaterial extends THREE.MeshPhongMaterial {
  constructor(color) {
    super({
      color: color,
      opacity: 0.5,
      transparent: true,
      shininess: 60,
      specular: 0x666666,
      emissive: 0x444444,
      emissiveIntensity: 0.3
    });
  }
}

export { BarMaterial };

// BarMaterial.js (Temporary for debugging)

// import * as THREE from 'three';

// class BarMaterial extends THREE.MeshBasicMaterial { // Changed from MeshPhongMaterial
//   constructor(color) {
//     super({
//       color: color, // We only care about the color for this test
//       opacity: 0.5,
//       transparent: true
//     });
//   }
// }

// export { BarMaterial };