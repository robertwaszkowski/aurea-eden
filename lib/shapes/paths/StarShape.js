import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { StarDimensions } from './BasicShapeConstants.js';

class StarShape extends Shape {
    constructor(
        outerRadius = StarDimensions.OUTER_RADIUS,
        innerRadius = StarDimensions.INNER_RADIUS,
        numPoints = StarDimensions.NUM_POINTS,
        lineWidth = StarDimensions.LINE_WIDTH,
        curveSegments = StarDimensions.CURVE_SEGMENTS
    ) {
        super(outerRadius * 2, outerRadius * 2, lineWidth, { innerRadius, numPoints, curveSegments });
        this.extrusionSettings = { ...this.extrusionSettings, curveSegments: curveSegments };
        this.rebuildGeometry();
        this.name = 'StarShape';
    }


    get2DPaths() {
        const outerRadius = this.width / 2;
        const innerRadius = this.innerRadius * (outerRadius / (this.width / 2)); // Adjust innerRadius scale factor if width changes
        const numPoints = this.numPoints;

        let geometricLineWidthForHole = this.lineWidth;
        if (this.extrusionSettings.bevelEnabled && this.extrusionSettings.bevelSize > 0) {
            geometricLineWidthForHole = this.lineWidth + (2 * this.extrusionSettings.bevelSize);
        }

        const _createStarPath = (oR, iR, nP) => {
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
        };

        const mainStarPath = _createStarPath(outerRadius, innerRadius, numPoints);

        if (!mainStarPath) {
            // Return tiny default square if invalid
            const errorPath = new THREE.Shape();
            errorPath.rect(-0.05, -0.05, 0.1, 0.1);
            return [errorPath];
        }

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

        return [mainStarPath];
    }

    updateDimensions(newOuterRadius, newInnerRadius, newNumPoints, newLineWidth, newCurveSegments) {
        if (newCurveSegments !== undefined) {
            this.curveSegments = newCurveSegments;
            this.extrusionSettings = { ...this.extrusionSettings, curveSegments: newCurveSegments };
        }
        if (newInnerRadius !== undefined) this.innerRadius = newInnerRadius;
        if (newNumPoints !== undefined) this.numPoints = newNumPoints;

        const targetSize = newOuterRadius ? newOuterRadius * 2 : this.width;
        super.updateDimensions(targetSize, targetSize, newLineWidth);
    }
}

export { StarShape };
