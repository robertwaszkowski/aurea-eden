import * as THREE from 'three';
import { DiagramEditMaterial } from '../materials/DiagramEditMaterial.js';
import { ExtrusionParameters, Colors } from '../diagrams/DiagramConstants.js';

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
        this.lineWidth = lineWidth;

        // Aliases for Element.getSize() and routing compatibility!
        this.shapeWidth = width;
        this.shapeHeight = height;
        this.shapeLineWidth = lineWidth;

        // Base properties
        this.color = Colors.ELEMENT_STROKE;
        this.extrusionSettings = ExtrusionParameters;

        // Copy extra configuration properties to 'this' before calling rebuildGeometry()
        // so they are safely available to get2DPaths() during initialization!
        Object.assign(this, extraConfig);

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

        // Subclasses implement get2DPaths() to supply 2D paths/shapes
        const shapes = this.get2DPaths();

        // Handle degenerate/empty paths safely (e.g. connector with < 2 points)
        if (!shapes || (Array.isArray(shapes) && shapes.length === 0)) {
            this.geometry = new THREE.BufferGeometry();
            this.outerShape = null;
            return;
        }

        // Wrap single shape in an array for ExtrudeGeometry
        const shapesArray = Array.isArray(shapes) ? shapes : [shapes];

        // Automatically extract solid outer shape for overlays/selections
        if (shapesArray.length > 0) {
            this.outerShape = shapesArray[0].clone();
            this.outerShape.holes = []; // Clear holes to make it a solid boundary
        } else {
            this.outerShape = null;
        }

        // Build 3D extruded geometry natively
        const settings = this.tunedExtrudeSettings || this.extrusionSettings || ExtrusionParameters;
        this.geometry = new THREE.ExtrudeGeometry(shapesArray, settings);
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