import * as THREE from 'three';

/**
 * Calculates a color on a sequential HSL scale.
 * Default (colorsInverted=false): Red (low) → Green (high) — higher is better.
 * Inverted (colorsInverted=true): Green (low) → Red (high) — lower is better.
 *
 * @param {number} value The current value.
 * @param {number} min The minimum possible value in the dataset.
 * @param {number} max The maximum possible value in the dataset.
 * @param {boolean} [colorsInverted=false] If true, flips the color scale so higher = redder.
 * @returns {THREE.Color} A THREE.Color object representing the calculated color.
 */
export function getColorForValue(value, min, max, colorsInverted = false) {
    const color = new THREE.Color();
    if (min === max) {
        color.setHSL(0.25, 1.0, 0.5);
        return color;
    }
    let ratio = (value - min) / (max - min);
    ratio = Math.max(0, Math.min(ratio, 1));

    if (colorsInverted) {
        ratio = 1 - ratio; // flip: high value → low ratio → red hue
    }

    const hue = ratio * (120 / 360);
    color.setHSL(hue, 1.0, 0.5);
    return color;
}

/**
 * Creates a THREE.Shape for one bar slot within an element, preserving the
 * element's rounded-rectangle corner radius on the outer edges of the first
 * and last slot. Inner edges between slots are straight.
 *
 * @param {number} elementWidth  - Total element width (local space, centered at 0)
 * @param {number} elementHeight - Total element height (local space, centered at 0)
 * @param {number} barIndex      - 0-based index of this bar
 * @param {number} totalBars     - Total number of bars
 * @param {number} [cornerRadius=10]   - Corner radius of the element shape
 * @param {number} [gapFraction=0.05]  - Fraction of each slot used as inner gap
 * @returns {THREE.Shape}
 */
export function createRoundedBarSlotShape(
    elementWidth, elementHeight, barIndex, totalBars,
    cornerRadius = 10, gapFraction = 0.05
) {
    const slotWidth = elementWidth / totalBars;
    const gap = slotWidth * gapFraction;

    // X bounds of this slot column within the element (local coords, element centered at 0)
    const rawLeft = -elementWidth / 2 + barIndex * slotWidth;
    const rawRight = rawLeft + slotWidth;

    // Apply inner gaps: left gap only when bar has a left neighbour, right gap only when bar has a right neighbour
    const hasLeftNeighbour = barIndex > 0;
    const hasRightNeighbour = barIndex < totalBars - 1;

    const x0 = rawLeft + (hasLeftNeighbour ? gap : 0);   // left X of this bar
    const x1 = rawRight - (hasRightNeighbour ? gap : 0);   // right X of this bar
    const y0 = -elementHeight / 2;  // bottom
    const y1 = elementHeight / 2;  // top

    // Corner radius clamped so it never exceeds half of the slot width or height
    const r = Math.min(cornerRadius, (x1 - x0) / 2, elementHeight / 2);

    // Flags: which corners of THIS slot coincide with the outer corners of the element
    const roundBL = !hasLeftNeighbour;   // bottom-left
    const roundTL = !hasLeftNeighbour;   // top-left
    const roundBR = !hasRightNeighbour;  // bottom-right
    const roundTR = !hasRightNeighbour;  // top-right

    const shape = new THREE.Shape();

    // Trace the path clockwise starting from bottom-left (matching Three.js winding)
    // Bottom edge: left to right
    shape.moveTo(x0 + (roundBL ? r : 0), y0);
    shape.lineTo(x1 - (roundBR ? r : 0), y0);

    // Bottom-right corner
    if (roundBR) shape.quadraticCurveTo(x1, y0, x1, y0 + r);
    else shape.lineTo(x1, y0);

    // Right edge: bottom to top
    shape.lineTo(x1, y1 - (roundTR ? r : 0));

    // Top-right corner
    if (roundTR) shape.quadraticCurveTo(x1, y1, x1 - r, y1);
    else shape.lineTo(x1, y1);

    // Top edge: right to left
    shape.lineTo(x0 + (roundTL ? r : 0), y1);

    // Top-left corner
    if (roundTL) shape.quadraticCurveTo(x0, y1, x0, y1 - r);
    else shape.lineTo(x0, y1);

    // Left edge: top to bottom
    shape.lineTo(x0, y0 + (roundBL ? r : 0));

    // Bottom-left corner
    if (roundBL) shape.quadraticCurveTo(x0, y0, x0 + r, y0);

    shape.closePath();
    return shape;
}
