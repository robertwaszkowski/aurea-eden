import * as THREE from 'three';

export const ExtrusionParameters = {
    steps: 2,
    depth: 5, // 200,
    bevelEnabled: true,
    bevelThickness: .025,  // 1,
    bevelSize: .075,  // 3,
    bevelOffset: 0,
    bevelSegments: 1
};

// Bar colors ( Material colors: https://www.materialui.co/colors )
// export const ColorPalette = [
//     new THREE.Color( 0xf44336 ), // red
//     new THREE.Color( 0xE91E63 ), // pink
//     new THREE.Color( 0x9C27B0 ), // purple
//     new THREE.Color( 0x673AB7 ), // deep purple
//     new THREE.Color( 0x3F51B5 ), // indigo
//     new THREE.Color( 0x2196F3 ), // blue
//     new THREE.Color( 0x03A9F4 ), // light blue
//     new THREE.Color( 0x00BCD4 ), // cyan
//     new THREE.Color( 0x009688 ), // teal
//     new THREE.Color( 0x4CAF50 ), // green
//     new THREE.Color( 0x8BC34A ), // light green
//     new THREE.Color( 0xCDDC39 ), // lime
//     new THREE.Color( 0xFFEB3B ), // yellow
//     new THREE.Color( 0xFFC107 ), // amber
//     new THREE.Color( 0xFF9800 ), // orange
//     new THREE.Color( 0xFF5722 ), // deep orange
//     new THREE.Color( 0x795548 ), // brown
//     new THREE.Color( 0x9E9E9E ), // grey
//     new THREE.Color( 0x607D8B )  // blue grey
// ];
