/**
 * BpmnConverterDemo
 *
 * Shows the same BPMN process rendered in two stacked panels:
 *   TOP    — Native XML import  (BpmnDiagram.buildDiagram)
 *   BOTTOM — Auto-generated JS  (BpmnToFluentConverter.convert)
 *
 * A toolbar lets the user switch between several BPMN source files.
 */

import { BpmnDiagram } from '../../lib/notations/bpmn/BpmnDiagram.js';
import { BpmnToFluentConverter } from '../../lib/notations/bpmn/BpmnToFluentConverter.js';

// All available BPMN sources — imported as raw XML strings at build time
import xmlSimple from '../VueWrapperBpmnDemo/simple-process-template.bpmn?raw';
import xmlHardware from '../VueWrapperBpmnDemo/hardware-retailer-template.bpmn?raw';
import xmlWniosek from '../VueWrapperBpmnDemo/wniosek-o-wsparcie.bpmn?raw';
import xmlIncident from '../VueWrapperBpmnDemo/incident-management-template.bpmn?raw';

const DIAGRAM_FILES = [
    { label: 'Simple Process', xml: xmlSimple },
    { label: 'Hardware Retailer', xml: xmlHardware },
    { label: 'Wniosek o Wsparcie', xml: xmlWniosek },
    { label: 'Incident Management', xml: xmlIncident },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper: create a labelled card wrapper
// ─────────────────────────────────────────────────────────────────────────────
function createCard(parentContainer, title, subtitle) {
    const card = document.createElement('div');
    card.style.cssText = `
        display: flex;
        flex-direction: column;
        flex: 1 1 0;
        min-height: 0;
        border-bottom: 1px solid #ddd;
        position: relative;
    `;

    const bar = document.createElement('div');
    bar.style.cssText = `
        padding: 6px 16px;
        background: #f5f5f5;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        align-items: baseline;
        gap: 12px;
        flex-shrink: 0;
    `;

    const h = document.createElement('span');
    h.textContent = title;
    h.style.cssText = 'font-size: 13px; font-weight: 600; color: #333; font-family: sans-serif;';
    bar.appendChild(h);

    if (subtitle) {
        const s = document.createElement('span');
        s.textContent = subtitle;
        s.style.cssText = 'font-size: 11px; color: #888; font-family: monospace;';
        bar.appendChild(s);
    }

    card.appendChild(bar);

    const canvas = document.createElement('div');
    canvas.style.cssText = 'flex: 1 1 0; min-height: 0; position: relative;';
    card.appendChild(canvas);

    parentContainer.appendChild(card);
    return canvas;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core render: build both panels from a given XML string
// ─────────────────────────────────────────────────────────────────────────────
function renderBothPanels(topCanvas, bottomCanvas, xmlString, options) {
    // Clear existing children and dispose any old Three.js context
    [topCanvas, bottomCanvas].forEach(c => {
        while (c.firstChild) c.removeChild(c.firstChild);
    });

    // TOP: native XML import
    const nativeDiagram = new BpmnDiagram(topCanvas, options);
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    nativeDiagram.buildDiagram(xmlDoc);
    nativeDiagram.fitScreen();

    // BOTTOM: fluent API via converter
    const fluentDiagram = new BpmnDiagram(bottomCanvas, options);
    const diagram = fluentDiagram; // alias used in eval'd code

    const converter = new BpmnToFluentConverter();
    const generatedCode = converter.convert(xmlString);

    try {
        // eslint-disable-next-line no-new-func
        new Function('diagram', generatedCode)(diagram);
    } catch (err) {
        console.error('[BpmnConverterDemo] Error executing generated code:', err);
        console.log('Generated code:\n' + generatedCode);
    }

    fluentDiagram.arrange();
    fluentDiagram.fitScreen();

    return fluentDiagram;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export — called by the demo app loader
// ─────────────────────────────────────────────────────────────────────────────
export default function initDemo(container, options = {}) {

    // ── Outer layout: toolbar + two diagram panes ───────────────────────────
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
    `;

    // ── Toolbar with file selector ──────────────────────────────────────────
    const toolbar = document.createElement('div');
    toolbar.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 6px 16px;
        background: #1e293b;
        flex-shrink: 0;
        border-bottom: 2px solid #334155;
    `;

    const label = document.createElement('span');
    label.textContent = 'BPMN Source:';
    label.style.cssText = 'font-size: 12px; color: #94a3b8; font-family: sans-serif; white-space: nowrap;';
    toolbar.appendChild(label);

    const select = document.createElement('select');
    select.id = 'bpmn-file-selector';
    select.style.cssText = `
        font-size: 13px;
        font-family: sans-serif;
        padding: 4px 8px;
        border-radius: 4px;
        border: 1px solid #475569;
        background: #0f172a;
        color: #e2e8f0;
        cursor: pointer;
        outline: none;
    `;
    DIAGRAM_FILES.forEach((f, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = f.label;
        select.appendChild(opt);
    });
    toolbar.appendChild(select);
    container.appendChild(toolbar);

    // ── Diagrams area ───────────────────────────────────────────────────────
    const diagramArea = document.createElement('div');
    diagramArea.style.cssText = `
        display: flex;
        flex-direction: column;
        flex: 1 1 0;
        min-height: 0;
        overflow: hidden;
    `;
    container.appendChild(diagramArea);

    const topCanvas = createCard(diagramArea, 'Native XML Import', 'BpmnDiagram.buildDiagram(xmlDoc)');
    const bottomCanvas = createCard(diagramArea, 'Auto-generated Fluent API', 'BpmnToFluentConverter.convert(xml)');

    // ── Initial render ──────────────────────────────────────────────────────
    let currentDiagram = renderBothPanels(topCanvas, bottomCanvas, DIAGRAM_FILES[0].xml, options);

    // ── On file change, re-render both panels ───────────────────────────────
    select.addEventListener('change', () => {
        const idx = parseInt(select.value, 10);
        currentDiagram = renderBothPanels(topCanvas, bottomCanvas, DIAGRAM_FILES[idx].xml, options);
    });

    return currentDiagram;
}
