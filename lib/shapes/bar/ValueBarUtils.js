import * as THREE from 'three';

/**
 * Calculates a color on a sequential HSL scale from Red (low) to Green (high).
 * @param {number} value The current value (e.g., bar height).
 * @param {number} min The minimum possible value in the dataset.
 * @param {number} max The maximum possible value in the dataset.
 * @returns {THREE.Color} A THREE.Color object representing the calculated color.
 */
export function getColorForValue(value, min, max) {
    const color = new THREE.Color();
    if (min === max) {
        color.setHSL(0.25, 1.0, 0.5);
        return color;
    }
    let ratio = (value - min) / (max - min);
    ratio = Math.max(0, Math.min(ratio, 1));

    const hue = ratio * (120 / 360);
    color.setHSL(hue, 1.0, 0.5);
    return color;

}