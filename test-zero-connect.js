import { parse } from 'path';
import * as THREE from 'three';
import { Element } from './lib/elements/Element.js';
import { Connector } from './lib/connectors/Connector.js';
import { RoundedCornerOrthogonalConnectorShape } from './lib/shapes/connector/RoundedCornerOrthogonalConnectorShape.js';
import { Diagram } from './lib/diagrams/Diagram.js';

// Setup Mock DOM
import { JSDOM } from 'jsdom';
const dom = new JSDOM(`<!DOCTYPE html><div id="container"></div>`);
global.document = dom.window.document;
global.window = dom.window;

try {
    const container = document.getElementById('container');
    const diagram = new Diagram(container);
    
    // Create elements
    const e1 = new Element('e1', {
        geometry: new THREE.BoxGeometry(10, 10, 10),
        material: new THREE.MeshBasicMaterial()
    });
    e1.positionAt({x:0, y:0, z:0});
    
    const e2 = new Element('e2', {
        geometry: new THREE.BoxGeometry(10, 10, 10),
        material: new THREE.MeshBasicMaterial()
    });
    e2.positionAt({x:0, y:0, z:0});
    
    diagram.addElement(e1);
    diagram.addElement(e2);
    
    // Connect headless without explicit ports
    diagram.connect('e1', 'e2', 'auto', 'auto');
    
    console.log('Pending connections:', diagram.pendingConnections.length);
    
    // Arrange will trigger the internal connectTo
    diagram.arrange();
    
    console.log('Connectors array total:', diagram.connectors.length);
    if (diagram.connectors.length > 0) {
        console.log('Geometry vertices:', diagram.connectors[0].geometry.attributes.position.array.length);
    }
} catch(err) {
    console.error("Crash during connection:", err.message);
    console.error(err.stack);
}
