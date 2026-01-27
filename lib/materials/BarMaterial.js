import * as THREE from 'three';
import { Themes } from '../diagrams/DiagramConstants.js';

class BarMaterial extends THREE.MeshPhongMaterial {
  constructor(color, theme = 'LIGHT') {
    const themeConfig = Themes[theme];
    super({
      color: color,
      opacity: themeConfig.VALUE_BAR_OPACITY,
      transparent: true,
      shininess: 60,
      specular: 0x666666,
      emissive: color, // Use the data color as emissive for a better glow
      emissiveIntensity: theme === 'DARK' ? 0.6 : 0
    });
  }
}

export { BarMaterial };