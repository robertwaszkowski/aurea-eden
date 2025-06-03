import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { DiagramEditMaterial } from '../../materials/DiagramEditMaterial.js';
import { ExtrusionParameters, Colors } from '../../diagrams/DiagramConstants.js';
import { EllipseDimensions } from './BasicShapeConstants.js';

/**
 * Represents a 3D ellipse shape with a hole, created by extruding a 2D elliptical path.
 * This is distinct from CircleShape, which would have equal radii.
 */
class EllipseShape extends Shape {
    /**
     * Creates an instance of EllipseShape.
     * @param {number} [radiusX=EllipseDimensions.RADIUS_X] - The radius of the ellipse along its local x-axis.
     * @param {number} [radiusY=EllipseDimensions.RADIUS_Y] - The radius of the ellipse along its local y-axis.
     * @param {number} [lineWidth=EllipseDimensions.LINE_WIDTH] - The thickness of the ellipse's stroke.
     * @param {number} [curveSegments=EllipseDimensions.CURVE_SEGMENTS] - Number of segments for the curve. Higher is smoother.
     */
    constructor(
        radiusX = EllipseDimensions.RADIUS_X,
        radiusY = EllipseDimensions.RADIUS_Y,
        lineWidth = EllipseDimensions.LINE_WIDTH,
        curveSegments = EllipseDimensions.CURVE_SEGMENTS // Added curveSegments
    ) {
        const color = Colors.ELEMENT_STROKE;
        // Combine global ExtrusionParameters with the specific curveSegments for this shape
        const currentExtrusionSettings = { ...ExtrusionParameters, curveSegments: curveSegments };

        // Define the 2D path of the outer ellipse
        const mainEllipsePath = new THREE.Shape();
        // The .ellipse() method itself doesn't take curveSegments directly for its path definition.
        // The curveSegments are used by ExtrudeGeometry when processing the Shape.
        mainEllipsePath.ellipse(
            0, 0, // Center x, y
            radiusX, radiusY,
            0, 2 * Math.PI, // Start angle, End angle
            false, // Clockwise
            0 // Rotation
        );

        const storableOuterShape = mainEllipsePath.clone();

        if (lineWidth > 0 && radiusX > lineWidth && radiusY > lineWidth) {
            const holePath = new THREE.Path();
            holePath.ellipse(
                0, 0,
                radiusX - lineWidth,
                radiusY - lineWidth,
                0, 2 * Math.PI,
                false,
                0
            );
            mainEllipsePath.holes.push(holePath);
        }

        const geometry = new THREE.ExtrudeGeometry(mainEllipsePath, currentExtrusionSettings); // Pass updated settings
        const material = new DiagramEditMaterial(color);

        super(geometry, material);

        this.outerShape = storableOuterShape;
        this.shapeRadiusX = radiusX;
        this.shapeRadiusY = radiusY;
        this.shapeLineWidth = lineWidth;
        this.shapeCurveSegments = curveSegments; // Store curveSegments
        this.shapeDepth = currentExtrusionSettings.depth || ExtrusionParameters.depth;

        this.name = 'EllipseShape';
    }

    getOuterShape() {
        return this.outerShape;
    }

    /**
     * Updates the dimensions (radii, lineWidth, and curveSegments) of the ellipse.
     * This requires creating new geometry.
     * @param {number} newRadiusX - The new radius along the x-axis.
     * @param {number} newRadiusY - The new radius along the y-axis.
     * @param {number} [newLineWidth] - The new line width.
     * @param {number} [newCurveSegments] - The new number of curve segments.
     * @param {object} [newExtrusionSettingsOverride] - Optional FULL extrusion settings override.
     */
    updateDimensions(newRadiusX, newRadiusY, newLineWidth, newCurveSegments, newExtrusionSettingsOverride) {
        const radiusX = newRadiusX || this.shapeRadiusX;
        const radiusY = newRadiusY || this.shapeRadiusY;
        const lineWidth = (newLineWidth !== undefined) ? newLineWidth : this.shapeLineWidth;
        const curveSegments = (newCurveSegments !== undefined) ? newCurveSegments : this.shapeCurveSegments;

        // Determine extrusion settings:
        // Start with global defaults, overlay with current shape's curveSegments,
        // then allow full override if newExtrusionSettingsOverride is provided.
        let effectiveExtrusionSettings = { ...ExtrusionParameters, curveSegments: curveSegments };
        if (newExtrusionSettingsOverride) {
            effectiveExtrusionSettings = { ...effectiveExtrusionSettings, ...newExtrusionSettingsOverride };
        } else if (this.geometry.parameters && this.geometry.parameters.options) {
            // If no full override, but geometry exists, try to preserve other existing options
            // and only update curveSegments if it changed.
            effectiveExtrusionSettings = { ...this.geometry.parameters.options, curveSegments: curveSegments };
        }


        const mainEllipsePath = new THREE.Shape();
        mainEllipsePath.ellipse(0, 0, radiusX, radiusY, 0, 2 * Math.PI, false, 0);

        const storableOuterShape = mainEllipsePath.clone();

        if (lineWidth > 0 && radiusX > lineWidth && radiusY > lineWidth) {
            const holePath = new THREE.Path();
            holePath.ellipse(0, 0, radiusX - lineWidth, radiusY - lineWidth, 0, 2 * Math.PI, false, 0);
            mainEllipsePath.holes.push(holePath);
        }

        this.outerShape = storableOuterShape;

        if (this.geometry) {
            this.geometry.dispose();
        }

        this.geometry = new THREE.ExtrudeGeometry(mainEllipsePath, effectiveExtrusionSettings);

        this.shapeRadiusX = radiusX;
        this.shapeRadiusY = radiusY;
        this.shapeLineWidth = lineWidth;
        this.shapeCurveSegments = curveSegments; // Update stored curveSegments
        this.shapeDepth = effectiveExtrusionSettings.depth || ExtrusionParameters.depth;
    }

    updateColor(newColor) {
        if (this.material && this.material.color && typeof this.material.color.set === 'function') {
             this.material.color.set(newColor);
        } else if (this.material && this.material.uniforms && this.material.uniforms.color) { 
            this.material.uniforms.color.value.set(newColor);
        }
    }
}

export { EllipseShape };
