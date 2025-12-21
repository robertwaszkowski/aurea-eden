import { Shape } from '../Shape.js';
import { DiagramEditMaterial } from '../../materials/DiagramEditMaterial.js';
import { Colors } from '../../diagrams/DiagramConstants.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
// import helveticaRegular from 'three/examples/fonts/helvetiker_regular.typeface.json';
import robotoRegular from './Roboto_Regular.json';

class TextShape extends Shape {
    constructor(text, size = 8) {

        const color = Colors.ELEMENT_TEXT;

        const loader = new FontLoader();
        const font = loader.parse( robotoRegular ); 
        const textGeometry = new TextGeometry( text, {
                font: font,
                size: size,
                depth: .2, // .0125,
                curveSegments: 12
            } ).center();

        // Construct the shape
        super(textGeometry, new DiagramEditMaterial( color ));

        this.font = font;
        this.size = size;
    }

    updateText(text) {
        if (this.geometry) {
            this.geometry.dispose();
        }

        this.geometry = new TextGeometry( text, {
            font: this.font,
            size: this.size,
            depth: .2,
            curveSegments: 12
        } ).center();
    }
}

export { TextShape };