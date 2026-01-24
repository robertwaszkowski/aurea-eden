import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { DiagramEditMaterial } from '../../materials/DiagramEditMaterial.js';
import { Colors } from '../../diagrams/DiagramConstants.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import robotoRegular from './Roboto_Regular.json';

// Static cache for the font to avoid redundant parsing
let cachedFont = null;

/**
 * Represents a text shape in the diagram.
 * Uses ShapeGeometry to render text based on the Roboto Regular font.
 * Supports multiline text and basic alignments (left, center, right).
 * 
 * @extends Shape
 */
class TextShape extends Shape {
    /**
     * Creates a new TextShape instance.
     * 
     * @param {string} text - The text content to display.
     * @param {number} [size=9] - The font size.
     * @param {string} [align='left'] - Text alignment ('left', 'center', or 'right').
     */
    constructor(text, size = 9, align = 'left') {
        const color = Colors.ELEMENT_TEXT;

        if (!cachedFont) {
            const loader = new FontLoader();
            cachedFont = loader.parse(robotoRegular);
        }

        // Create geometry first without using 'this'
        const textGeometry = TextShape.createTextGeometry(text, cachedFont, size, align);

        // Construct the shape
        super(textGeometry, new DiagramEditMaterial(color));

        this.font = cachedFont;
        this.size = size;
        this.align = align;
    }

    /**
     * Calculates the width of a line of text for a given size.
     * 
     * @param {string} text - The text to measure.
     * @param {number} size - The font size.
     * @returns {number} The width of the text in world units.
     */
    static getLineLength(text, size) {
        if (!text) return 0;

        if (!cachedFont) {
            const loader = new FontLoader();
            cachedFont = loader.parse(robotoRegular);
        }

        const shapes = cachedFont.generateShapes(text, size);
        let width = 0;

        const geometry = new THREE.ShapeGeometry(shapes);
        geometry.computeBoundingBox();
        if (geometry.boundingBox) {
            width = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
        }
        geometry.dispose();

        return width;
    }

    /**
     * Updates the text content of the shape by regenerating its geometry.
     * 
     * @param {string} text - The new text content.
     */
    updateText(text) {
        if (this.geometry) {
            this.geometry.dispose();
        }
        this.geometry = TextShape.createTextGeometry(text, this.font, this.size, this.align);
    }

    /**
     * Generates the BufferGeometry for the given text, font, size and alignment.
     * Handles multiline text by merging individual line geometries.
     * 
     * @param {string} text - The text content.
     * @param {THREE.Font} font - The parsed font object.
     * @param {number} size - The font size.
     * @param {string} align - Text alignment ('left', 'center', or 'right').
     * @returns {THREE.BufferGeometry} The generated geometry.
     */
    static createTextGeometry(text, font, size, align) {
        // Handle multiline text for all alignments
        if (text.includes('\n')) {
            const lines = text.split('\n');
            const geometries = [];
            const lineHeight = size * 1.6;

            lines.forEach((line, index) => {
                if (!line.trim()) return;

                const shapes = font.generateShapes(line, size);
                const lineGeo = new THREE.ShapeGeometry(shapes);

                lineGeo.computeBoundingBox();
                const lineWidth = lineGeo.boundingBox.max.x - lineGeo.boundingBox.min.x;

                let xOffset = 0;
                if (align === 'center') {
                    xOffset = -0.5 * lineWidth;
                } else if (align === 'right') {
                    xOffset = -lineWidth;
                }
                // 'left' defaults to xOffset = 0

                const yOffset = (lines.length - 1 - index) * lineHeight;

                lineGeo.translate(xOffset, yOffset, 0);
                geometries.push(lineGeo);
            });

            if (geometries.length > 0) {
                const mergedGeo = BufferGeometryUtils.mergeGeometries(geometries);
                mergedGeo.center();
                return mergedGeo;
            }
        }

        const shapes = font.generateShapes(text, size);
        return new THREE.ShapeGeometry(shapes).center();
    }
}

export { TextShape };
