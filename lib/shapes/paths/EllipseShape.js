import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { EllipseDimensions } from './BasicShapeConstants.js';

class EllipseShape extends Shape {
    constructor(
        radiusX = EllipseDimensions.RADIUS_X,
        radiusY = EllipseDimensions.RADIUS_Y,
        lineWidth = EllipseDimensions.LINE_WIDTH,
        curveSegments = EllipseDimensions.CURVE_SEGMENTS
    ) {
        super(radiusX * 2, radiusY * 2, lineWidth, { curveSegments });
        // Inject curveSegments into base extrusionSettings
        this.extrusionSettings = { ...this.extrusionSettings, curveSegments: curveSegments };
        this.rebuildGeometry();
        this.name = 'EllipseShape';
    }


    get2DPaths() {
        const radiusX = this.width / 2;
        const radiusY = this.height / 2;

        const mainEllipsePath = new THREE.Shape();
        mainEllipsePath.ellipse(
            0, 0, // Center x, y
            radiusX, radiusY,
            0, 2 * Math.PI, // Start angle, End angle
            false, // Clockwise
            0 // Rotation
        );

        if (this.lineWidth > 0 && radiusX > this.lineWidth && radiusY > this.lineWidth) {
            const holePath = new THREE.Path();
            holePath.ellipse(
                0, 0,
                radiusX - this.lineWidth,
                radiusY - this.lineWidth,
                0, 2 * Math.PI,
                false,
                0
            );
            mainEllipsePath.holes.push(holePath);
        }

        return [mainEllipsePath];
    }

    updateDimensions(newRadiusX, newRadiusY, newLineWidth, newCurveSegments) {
        if (newCurveSegments !== undefined) {
            this.curveSegments = newCurveSegments;
            this.extrusionSettings = { ...this.extrusionSettings, curveSegments: newCurveSegments };
        }
        // Base class expects width and height representing the bounding box, i.e., 2 * radius
        const targetWidth = newRadiusX ? newRadiusX * 2 : this.width;
        const targetHeight = newRadiusY ? newRadiusY * 2 : this.height;

        super.updateDimensions(targetWidth, targetHeight, newLineWidth);
    }
}

export { EllipseShape };
