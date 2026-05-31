import * as THREE from 'three';
import { DiagramEditMaterial } from '../materials/DiagramEditMaterial.js';
import { ExtrusionParameters, Colors } from '../diagrams/DiagramConstants.js';
import { StrokeStyles, CircleDimensions } from './paths/BasicShapeConstants.js';

class Shape {
    constructor(width, height, lineWidth = 1, extraConfig = {}) {
        // BACKWARD COMPATIBILITY: If first argument is a BufferGeometry, we are using the legacy constructor signature!
        if (width instanceof THREE.BufferGeometry) {
            this.geometry = width;
            this.material = height; // Second argument in old style is the material
            this.width = this.getSize().x;
            this.height = this.getSize().y;
            this.outerShape = null;
            return;
        }

        this.width = width;
        this.height = height;

        // Copy extra configuration properties to 'this' before calling rebuildGeometry()
        // so they are safely available to get2DPaths()/getSinglePath() during initialization!
        Object.assign(this, extraConfig);

        this.strokeStyle = this.strokeStyle || StrokeStyles.THIN;

        let targetLineWidth = lineWidth;
        if (extraConfig.strokeStyle) {
            if (this.strokeStyle === StrokeStyles.THICK) {
                targetLineWidth = CircleDimensions.LINE_WIDTH_THICK;
            } else if (this.strokeStyle === StrokeStyles.THIN || this.strokeStyle === StrokeStyles.DOUBLE) {
                targetLineWidth = CircleDimensions.LINE_WIDTH_THIN;
            } else if (this.strokeStyle === StrokeStyles.DASHED) {
                targetLineWidth = CircleDimensions.LINE_WIDTH_NORMAL;
            }
        }
        this.lineWidth = targetLineWidth;

        // Aliases for Element.getSize() and routing compatibility!
        this.shapeWidth = this.width;
        this.shapeHeight = this.height;
        this.shapeLineWidth = this.lineWidth;

        // Base properties
        this.color = Colors.ELEMENT_STROKE;
        this.extrusionSettings = ExtrusionParameters;

        // Instantiate material once at the base level
        this.material = new DiagramEditMaterial(this.color);
        this.geometry = null;
        this.outerShape = null;

        // Trigger initial geometry creation
        this.rebuildGeometry();
    }


    updatePoints(points) {
        this.points = points || [];
        this.rebuildGeometry();
    }

    /**
     * Rebuilds the 3D geometry from 2D paths provided by the subclass.
     */
    rebuildGeometry() {
        if (this.geometry) {
            this.geometry.dispose();
        }

        let shapes = [];

        if (this.strokeStyle === StrokeStyles.DOUBLE && typeof this.getSinglePath === 'function') {
            const spacing = 3; // Standard spacing between concentric borders

            // Outer Ring
            const outer = this.getSinglePath(this.width, this.height);
            const outerHole = this.getSinglePath(this.width - this.lineWidth * 2, this.height - this.lineWidth * 2);
            if (outer && outerHole) {
                const holePath = new THREE.Path();
                holePath.copy(outerHole);
                outer.holes.push(holePath);
            }

            // Inner Ring
            const innerW = this.width - this.lineWidth * 2 - spacing * 2;
            const innerH = this.height - this.lineWidth * 2 - spacing * 2;
            const inner = this.getSinglePath(innerW, innerH);
            const innerHole = this.getSinglePath(innerW - this.lineWidth * 2, innerH - this.lineWidth * 2);
            if (inner && innerHole) {
                const holePath = new THREE.Path();
                holePath.copy(innerHole);
                inner.holes.push(holePath);
            }

            if (outer && inner) {
                shapes = [outer, inner];
            } else if (outer) {
                shapes = [outer];
            }
        } else if (this.strokeStyle === StrokeStyles.DASHED && typeof this.getDashedPaths === 'function') {
            const dashed = this.getDashedPaths();
            shapes = Array.isArray(dashed) ? dashed : [dashed];
        } else if (typeof this.getSinglePath === 'function') {
            const outer = this.getSinglePath(this.width, this.height);
            const inner = this.getSinglePath(this.width - this.lineWidth * 2, this.height - this.lineWidth * 2);
            if (outer && inner) {
                const holePath = new THREE.Path();
                holePath.copy(inner);
                outer.holes.push(holePath);
            }
            if (outer) {
                shapes = [outer];
            }
        } else if (typeof this.get2DPaths === 'function') {
            // BACKWARD COMPATIBILITY for shapes/connectors that still use the old get2DPaths()
            const legacy = this.get2DPaths();
            shapes = Array.isArray(legacy) ? legacy : [legacy];
        }

        // Handle degenerate/empty paths safely (e.g. connector with < 2 points)
        if (!shapes || shapes.length === 0 || !shapes[0]) {
            this.geometry = new THREE.BufferGeometry();
            this.outerShape = null;
            return;
        }

        // Automatically extract solid outer shape for overlays/selections
        this.outerShape = shapes[0].clone();
        this.outerShape.holes = []; // Clear holes to make it a solid boundary

        // Build 3D extruded geometry natively
        const settings = this.tunedExtrudeSettings || this.extrusionSettings || ExtrusionParameters;
        this.geometry = new THREE.ExtrudeGeometry(shapes, settings);
    }

    /**
     * Base implementation of dimension updates.
     */
    updateDimensions(newWidth, newHeight, newLineWidth) {
        this.width = newWidth || this.width;
        this.height = newHeight || this.height;
        if (newLineWidth !== undefined) {
            this.lineWidth = newLineWidth;
        }

        // Keep aliases updated!
        this.shapeWidth = this.width;
        this.shapeHeight = this.height;
        this.shapeLineWidth = this.lineWidth;

        this.rebuildGeometry();
    }


    /**
     * Base implementation of material/uniform color updates.
     */
    updateColor(newColor) {
        this.color = newColor;
        if (this.material && this.material.color && typeof this.material.color.set === 'function') {
            this.material.color.set(newColor);
        } else if (this.material && this.material.uniforms && this.material.uniforms.color) {
            this.material.uniforms.color.value.set(newColor);
        }
    }

    getSize() {
        var size = new THREE.Vector3();
        if (this.geometry) {
            this.geometry.computeBoundingBox();
            this.geometry.boundingBox.getSize(size);
        }
        return size;
    }

    getOuterShape() {
        return this.outerShape;
    }
}

export { Shape };