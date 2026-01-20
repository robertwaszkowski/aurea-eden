import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { DiagramEditMaterial } from '../../materials/DiagramEditMaterial.js';
import { Colors } from '../../diagrams/DiagramConstants.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
// import helveticaRegular from 'three/examples/fonts/helvetiker_regular.typeface.json';
import robotoRegular from './Roboto_Regular.json';

// Static cache for the font
let cachedFont = null;

class TextShape extends Shape {
    constructor(text, size = 8) {

        const color = Colors.ELEMENT_TEXT;

        if (!cachedFont) {
            const loader = new FontLoader();
            cachedFont = loader.parse(robotoRegular);
        }

        const textGeometry = new TextGeometry(text, {
            font: cachedFont,
            size: size,
            depth: .2, // .0125,
            curveSegments: 12
        }).center();

        // Construct the shape
        super(textGeometry, new DiagramEditMaterial(color));

        this.font = cachedFont;
        this.size = size;
    }

    /**
     * Calculates the length of a line of text for a given size.
     * @param {string} text - The text to measure
     * @param {number} size - The font size
     * @returns {number} The width of the text
     */
    static getLineLength(text, size) {
        if (!text) return 0;

        if (!cachedFont) {
            const loader = new FontLoader();
            cachedFont = loader.parse(robotoRegular);
        }

        const shapes = cachedFont.generateShapes(text, size);
        let width = 0;

        // Simplified width calculation based on bounding box of shapes 
        // Iterate through shapes to find min/max x
        // However, generateShapes returns an array of shapes. Compute geometry is expensive.
        // A faster estimation or creating a temporary geometry is needed.
        // Let's use a temporary geometry since we need accuracy.

        // Note: generating geometry is what we wanted to avoid, but generateShapes is lighter than TextGeometry?
        // Actually TextGeometry uses generateShapes internally. 
        // But we don't need to extrude it. We can just use ShapeGeometry (2D).

        // Even simpler: Font.generateShapes returns Three.Shape objects. 
        // We can compute the bounding box of these shapes.

        /* 
           Using ShapeGeometry is reliable.
        */
        const geometry = new THREE.ShapeGeometry(shapes);
        geometry.computeBoundingBox();
        if (geometry.boundingBox) {
            width = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
        }
        geometry.dispose();

        return width;
    }

    updateText(text) {
        if (this.geometry) {
            this.geometry.dispose();
        }

        this.geometry = new TextGeometry(text, {
            font: this.font,
            size: this.size,
            depth: .2,
            curveSegments: 12
        }).center();
    }
}

export { TextShape };