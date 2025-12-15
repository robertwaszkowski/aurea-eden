import * as THREE from 'three';
import { Shape } from '../Shape.js'; // Assuming this will be in lib/shapes/
import { DiagramEditMaterial } from '../../materials/DiagramEditMaterial.js';
import { ExtrusionParameters, Colors } from '../../diagrams/DiagramConstants.js';
import { StarDimensions } from './BasicShapeConstants.js'; // Assuming PathConstants.js or BasicShapeConstants.js

/**
 * Represents a 3D star shape with a hole, created by extruding a 2D star path.
 * The lineWidth parameter aims to define the final visible flat stroke width after beveling.
 * This version aims for parallel lines between the outer shape and the hole.
 */
class StarShape extends Shape {
    /**
     * Creates an instance of StarShape.
     * @param {number} [outerRadius=StarDimensions.OUTER_RADIUS] - The outer radius of the star.
     * @param {number} [innerRadius=StarDimensions.INNER_RADIUS] - The inner radius of the star.
     * @param {number} [numPoints=StarDimensions.NUM_POINTS] - The number of points on the star.
     * @param {number} [lineWidth=StarDimensions.LINE_WIDTH] - The desired final visible flat thickness of the star's stroke.
     * @param {number} [curveSegments=StarDimensions.CURVE_SEGMENTS] - Number of segments for ExtrudeGeometry processing.
     */
    constructor(
        outerRadius = StarDimensions.OUTER_RADIUS,
        innerRadius = StarDimensions.INNER_RADIUS,
        numPoints = StarDimensions.NUM_POINTS,
        lineWidth = StarDimensions.LINE_WIDTH, // Target visible line width
        curveSegments = StarDimensions.CURVE_SEGMENTS
    ) {
        const color = Colors.ELEMENT_STROKE;
        const currentExtrusionSettings = { ...ExtrusionParameters, curveSegments: curveSegments };

        let geometricLineWidthForHole = lineWidth;
        if (currentExtrusionSettings.bevelEnabled && currentExtrusionSettings.bevelSize > 0) {
            geometricLineWidthForHole = lineWidth + (2 * currentExtrusionSettings.bevelSize);
        }

        function _createStarPath(oR, iR, nP) {
            if (oR <= 0 || iR <= 0 || oR <= iR) {
                return null;
            }
            const path = new THREE.Shape();
            const angleOffset = -Math.PI / 2;
            const angleStep = (Math.PI * 2) / nP;
            path.moveTo(oR * Math.cos(angleOffset), oR * Math.sin(angleOffset));
            for (let i = 0; i < nP; i++) {
                const outerAngle = i * angleStep + angleOffset;
                path.lineTo(oR * Math.cos(outerAngle), oR * Math.sin(outerAngle));
                const innerAngle = outerAngle + angleStep / 2;
                path.lineTo(iR * Math.cos(innerAngle), iR * Math.sin(innerAngle));
            }
            path.closePath();
            return path;
        }

        const mainStarPath = _createStarPath(outerRadius, innerRadius, numPoints);

        if (!mainStarPath) {
            const fallbackGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
            const fallbackMaterial = new DiagramEditMaterial(Colors.ELEMENT_SELECTED_FILL);
            super(fallbackGeometry, fallbackMaterial);
            this.name = 'StarShape_Error';
            return;
        }

        const storableOuterShape = mainStarPath.clone();

        if (geometricLineWidthForHole > 0 && geometricLineWidthForHole < outerRadius) {
            const holeOuterRadius = outerRadius - geometricLineWidthForHole;
            // Calculate holeInnerRadius to maintain the same shape (ratio) as the outer star
            // holeInnerRadius / holeOuterRadius = innerRadius / outerRadius
            // holeInnerRadius = innerRadius * (holeOuterRadius / outerRadius)
            const holeInnerRadius = innerRadius * (holeOuterRadius / outerRadius);

            if (holeOuterRadius > 0 && holeInnerRadius > 0 && holeOuterRadius > holeInnerRadius) {
                const holePath = _createStarPath(holeOuterRadius, holeInnerRadius, numPoints);
                if (holePath) {
                    mainStarPath.holes.push(holePath);
                }
            }
        }

        const geometry = new THREE.ExtrudeGeometry(mainStarPath, currentExtrusionSettings);
        const material = new DiagramEditMaterial(color);

        super(geometry, material);

        this.outerShape = storableOuterShape;
        this.shapeOuterRadius = outerRadius;
        this.shapeInnerRadius = innerRadius;
        this.shapeNumPoints = numPoints;
        this.shapeLineWidth = lineWidth; 
        this.shapeGeometricLineWidthForHole = geometricLineWidthForHole;
        this.shapeCurveSegments = curveSegments;
        this.shapeDepth = currentExtrusionSettings.depth || ExtrusionParameters.depth;
        this.name = 'StarShape';
    }

    getOuterShape() {
        return this.outerShape;
    }

    updateDimensions(newOuterRadius, newInnerRadius, newNumPoints, newLineWidth, newCurveSegments, newExtrusionSettingsOverride) {
        const outerRadius = newOuterRadius || this.shapeOuterRadius;
        const innerRadius = newInnerRadius || this.shapeInnerRadius;
        const numPoints = newNumPoints || this.shapeNumPoints;
        const targetVisibleLineWidth = (newLineWidth !== undefined) ? newLineWidth : this.shapeLineWidth;
        const curveSegments = (newCurveSegments !== undefined) ? newCurveSegments : this.shapeCurveSegments;

        let currentExtrusionSettings = { ...ExtrusionParameters, curveSegments: curveSegments };
        if (newExtrusionSettingsOverride) {
            currentExtrusionSettings = { ...currentExtrusionSettings, ...newExtrusionSettingsOverride };
        } else if (this.geometry.parameters && this.geometry.parameters.options) {
            currentExtrusionSettings = { ...this.geometry.parameters.options, curveSegments: curveSegments };
        }
        
        let geometricLineWidthForHole = targetVisibleLineWidth;
        if (currentExtrusionSettings.bevelEnabled && currentExtrusionSettings.bevelSize > 0) {
            geometricLineWidthForHole = targetVisibleLineWidth + (2 * currentExtrusionSettings.bevelSize);
        }

        function _createStarPath(oR, iR, nP) {
             if (oR <= 0 || iR <=0 || oR <= iR) return null;
            const path = new THREE.Shape();
            const angleOffset = -Math.PI / 2;
            const angleStep = (Math.PI * 2) / nP;
            path.moveTo(oR * Math.cos(angleOffset), oR * Math.sin(angleOffset));
            for (let i = 0; i < nP; i++) {
                const outerAngle = i * angleStep + angleOffset;
                path.lineTo(oR * Math.cos(outerAngle), oR * Math.sin(outerAngle));
                const innerAngle = outerAngle + angleStep / 2;
                path.lineTo(iR * Math.cos(innerAngle), iR * Math.sin(innerAngle));
            }
            path.closePath();
            return path;
        }

        const mainStarPath = _createStarPath(outerRadius, innerRadius, numPoints);
        if (!mainStarPath) {
            return; 
        }
        const storableOuterShape = mainStarPath.clone();

        if (geometricLineWidthForHole > 0 && geometricLineWidthForHole < outerRadius) {
            const holeOuterRadius = outerRadius - geometricLineWidthForHole;
            const holeInnerRadius = innerRadius * (holeOuterRadius / outerRadius);

            if (holeOuterRadius > 0 && holeInnerRadius > 0 && holeOuterRadius > holeInnerRadius) {
                const holePath = _createStarPath(holeOuterRadius, holeInnerRadius, numPoints);
                if (holePath) {
                    mainStarPath.holes.push(holePath);
                }
            }
        }

        this.outerShape = storableOuterShape;

        if (this.geometry) {
            this.geometry.dispose();
        }
        this.geometry = new THREE.ExtrudeGeometry(mainStarPath, currentExtrusionSettings);

        this.shapeOuterRadius = outerRadius;
        this.shapeInnerRadius = innerRadius;
        this.shapeNumPoints = numPoints;
        this.shapeLineWidth = targetVisibleLineWidth;
        this.shapeGeometricLineWidthForHole = geometricLineWidthForHole;
        this.shapeCurveSegments = curveSegments;
        this.shapeDepth = currentExtrusionSettings.depth || ExtrusionParameters.depth;
    }

    updateColor(newColor) {
        if (this.material && this.material.color && typeof this.material.color.set === 'function') {
             this.material.color.set(newColor);
        } else if (this.material && this.material.uniforms && this.material.uniforms.color) { 
            this.material.uniforms.color.value.set(newColor);
        }
    }
}

export { StarShape };
