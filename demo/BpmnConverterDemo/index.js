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
function createCard(parentContainer, title, subtitle, barId) {
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
    if (barId) bar.id = barId;
    bar.style.cssText = `
        padding: 6px 16px;
        background: #f5f5f5;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
        flex-wrap: wrap;
    `;

    const h = document.createElement('span');
    h.textContent = title;
    h.style.cssText = 'font-size: 13px; font-weight: 600; color: #333; font-family: sans-serif; white-space: nowrap;';
    bar.appendChild(h);

    if (subtitle) {
        const s = document.createElement('span');
        s.textContent = subtitle;
        s.style.cssText = 'font-size: 11px; color: #888; font-family: monospace; white-space: nowrap;';
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
// Helper: show a modal popup listing all elements in a branch with their types
// ─────────────────────────────────────────────────────────────────────────────
function showBranchModal(branch, elementsMap) {
    // Remove any existing modal
    const existing = document.getElementById('branch-modal-overlay');
    if (existing) existing.remove();

    const BADGE_COLORS = {
        'Primary Path': { accent: '#6ee7b7', text: '#065f46', bg: '#d1fae5' },
        'Parallel Branch': { accent: '#93c5fd', text: '#1e3a8a', bg: '#dbeafe' },
        'Iterative Branch': { accent: '#fdba74', text: '#7c2d12', bg: '#ffedd5' },
    };
    const colors = BADGE_COLORS[branch.type] || { accent: '#94a3b8', text: '#1e293b', bg: '#f1f5f9' };

    // Type label mapping for display
    const TYPE_LABELS = {
        'bpmn:startEvent': 'Start Event',
        'bpmn:endEvent': 'End Event',
        'bpmn:terminateEndEvent': 'Terminate End Event',
        'bpmn:task': 'Task',
        'bpmn:userTask': 'User Task',
        'bpmn:serviceTask': 'Service Task',
        'bpmn:manualTask': 'Manual Task',
        'bpmn:scriptTask': 'Script Task',
        'bpmn:businessRuleTask': 'Business Rule Task',
        'bpmn:sendTask': 'Send Task',
        'bpmn:receiveTask': 'Receive Task',
        'bpmn:exclusiveGateway': 'Exclusive Gateway',
        'bpmn:inclusiveGateway': 'Inclusive Gateway',
        'bpmn:parallelGateway': 'Parallel Gateway',
        'bpmn:eventBasedGateway': 'Event-Based Gateway',
        'bpmn:complexGateway': 'Complex Gateway',
    };

    // Overlay (backdrop)
    const overlay = document.createElement('div');
    overlay.id = 'branch-modal-overlay';
    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        font-family: sans-serif;
    `;

    // Modal box
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: #1e293b;
        border-radius: 10px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.55);
        min-width: 380px;
        max-width: 520px;
        display: flex;
        flex-direction: column;
        border: 1px solid #334155;
    `;
    overlay.appendChild(modal);

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
        padding: 14px 18px 12px;
        background: #0f172a;
        border-bottom: 1px solid #334155;
        display: flex;
        align-items: center;
        gap: 10px;
    `;

    const typeBadge = document.createElement('span');
    typeBadge.textContent = branch.type;
    typeBadge.style.cssText = `
        padding: 2px 10px;
        border-radius: 999px;
        background: ${colors.bg};
        color: ${colors.text};
        font-size: 11px;
        font-weight: 700;
        font-family: monospace;
        border: 1px solid ${colors.accent};
        white-space: nowrap;
    `;
    header.appendChild(typeBadge);

    if (branch.anchor) {
        const anchorLbl = document.createElement('span');
        anchorLbl.style.cssText = 'font-size: 11px; color: #64748b; white-space: nowrap;';
        anchorLbl.textContent = `anchored at: `;
        const anchorId = document.createElement('code');
        anchorId.style.cssText = 'color: #94a3b8; font-size: 11px;';
        anchorId.textContent = branch.anchor;
        anchorLbl.appendChild(anchorId);
        header.appendChild(anchorLbl);
    }

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
        margin-left: auto;
        background: none;
        border: none;
        color: #64748b;
        font-size: 16px;
        cursor: pointer;
        line-height: 1;
        padding: 0 2px;
    `;
    closeBtn.onmouseover = () => closeBtn.style.color = '#e2e8f0';
    closeBtn.onmouseout = () => closeBtn.style.color = '#64748b';
    closeBtn.onclick = () => overlay.remove();
    header.appendChild(closeBtn);
    modal.appendChild(header);

    // Element list
    const list = document.createElement('ol');
    list.style.cssText = `
        margin: 0;
        padding: 12px 18px 16px 42px;
    `;

    for (const nodeId of branch.nodes) {
        const el = elementsMap && elementsMap.get(nodeId);
        const rawType = el ? el.type : null;
        const typeLabel = (rawType && TYPE_LABELS[rawType]) || (rawType ? rawType.replace('bpmn:', '') : 'Unknown');
        const displayName = (el && el.hasName) ? el.name : null;

        const item = document.createElement('li');
        item.style.cssText = `
            padding: 6px 0;
            border-bottom: 1px solid #1e3a52;
            color: #cbd5e1;
            font-size: 12px;
            line-height: 1.5;
        `;

        const typeTag = document.createElement('span');
        typeTag.textContent = typeLabel;
        typeTag.style.cssText = `
            display: inline-block;
            padding: 1px 7px;
            border-radius: 4px;
            background: #334155;
            color: ${colors.accent};
            font-size: 10px;
            font-family: monospace;
            margin-right: 8px;
            vertical-align: middle;
        `;
        item.appendChild(typeTag);

        const idCode = document.createElement('code');
        idCode.textContent = nodeId;
        idCode.style.cssText = 'color: #94a3b8; font-size: 11px;';
        item.appendChild(idCode);

        if (displayName) {
            const nameLbl = document.createElement('span');
            nameLbl.textContent = ` — ${displayName}`;
            nameLbl.style.cssText = 'color: #e2e8f0; font-style: italic; font-size: 11px;';
            item.appendChild(nameLbl);
        }

        list.appendChild(item);
    }

    // Remove bottom border from last item
    if (list.lastChild) list.lastChild.style.borderBottom = 'none';
    modal.appendChild(list);

    // Footer
    const footer = document.createElement('div');
    footer.style.cssText = 'padding: 8px 18px; border-top: 1px solid #334155; font-size: 10px; color: #475569; text-align: right;';
    footer.textContent = `${branch.nodes.length} element${branch.nodes.length !== 1 ? 's' : ''} · click backdrop or press Esc to close`;
    modal.appendChild(footer);

    document.body.appendChild(overlay);

    // Close on backdrop click
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    // Close on Escape
    const escHandler = (e) => { if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', escHandler); } };
    document.addEventListener('keydown', escHandler);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: render/refresh branch analysis badges into the bottom card's header
// ─────────────────────────────────────────────────────────────────────────────
function renderBranchPanel(branches, elementsMap, barId, options, triggerRender) {
    const bar = document.createElement('div'); // to avoid undefined, but we will find it by ID
    const actualBar = document.getElementById(barId);
    if (!actualBar) return;

    // Remove any previously rendered branch badges (keep title and subtitle spans)
    const oldPanel = actualBar.querySelector('.branch-panel');
    if (oldPanel) oldPanel.remove();

    if (!branches || branches.length === 0) return;

    const BADGE_COLORS = {
        'Primary Path': { bg: '#d1fae5', border: '#6ee7b7', text: '#065f46' },
        'Parallel Branch': { bg: '#dbeafe', border: '#93c5fd', text: '#1e3a8a' },
        'Iterative Branch': { bg: '#ffedd5', border: '#fdba74', text: '#7c2d12' },
    };

    const panel = document.createElement('div');
    panel.className = 'branch-panel';
    panel.style.cssText = `
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
        margin-left: auto;
    `;

    // Separator
    const sep = document.createElement('span');
    sep.textContent = '|';
    sep.style.cssText = 'color: #ccc; font-size: 13px; font-weight: 300; margin-right: 4px;';
    panel.appendChild(sep);

    // Label
    const lbl = document.createElement('span');
    lbl.textContent = 'Branches:';
    lbl.style.cssText = 'font-size: 11px; color: #888; font-family: sans-serif; white-space: nowrap;';
    panel.appendChild(lbl);

    for (const branch of branches) {
        const colors = BADGE_COLORS[branch.type] || { bg: '#f3f4f6', border: '#d1d5db', text: '#374151' };
        const firstNode = branch.nodes[0] || '';

        let branchKey = branch.type === 'Primary Path' ? 'PRIMARY' : firstNode;

        const badge = document.createElement('span');
        badge.title = 'Click checkbox to toggle visibility. Click text to inspect elements.';
        badge.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 2px 8px;
            border-radius: 999px;
            border: 1px solid ${colors.border};
            background: ${colors.bg};
            font-size: 10px;
            font-family: monospace;
            color: ${colors.text};
            white-space: nowrap;
            transition: filter 0.15s;
        `;

        const isHidden = options && options.hiddenBranches && options.hiddenBranches.has(branchKey);
        if (isHidden) {
            badge.style.opacity = '0.5';
            badge.style.background = 'transparent';
        }

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = !isHidden;
        cb.style.cursor = 'pointer';
        cb.addEventListener('change', () => {
            if (options && options.hiddenBranches) {
                if (cb.checked) options.hiddenBranches.delete(branchKey);
                else options.hiddenBranches.add(branchKey);
            }
            if (triggerRender) triggerRender();
        });
        badge.appendChild(cb);

        const textWrapper = document.createElement('span');
        textWrapper.style.cursor = 'pointer';
        textWrapper.style.display = 'inline-flex';
        textWrapper.style.alignItems = 'center';
        textWrapper.style.gap = '5px';
        textWrapper.onmouseover = () => badge.style.filter = 'brightness(0.9)';
        textWrapper.onmouseout = () => badge.style.filter = '';
        textWrapper.addEventListener('click', () => showBranchModal(branch, elementsMap));

        // Type label (bold)
        const typeSpan = document.createElement('b');
        typeSpan.textContent = branch.type;
        textWrapper.appendChild(typeSpan);

        // Node summary
        const detail = document.createElement('span');
        detail.style.opacity = '0.75';
        detail.textContent = `(${branch.nodes.length}): ${firstNode}`;
        textWrapper.appendChild(detail);

        badge.appendChild(textWrapper);
        panel.appendChild(badge);
    }

    actualBar.appendChild(panel);
}

// ─────────────────────────────────────────────────────────────────────────────
// Core render: build both panels from a given XML string
// ─────────────────────────────────────────────────────────────────────────────
function renderBothPanels(topCanvas, bottomCanvas, xmlString, options, triggerRender) {
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
    const generatedCode = converter.convert(xmlString, options);

    try {
        // eslint-disable-next-line no-new-func
        new Function('diagram', generatedCode)(diagram);
    } catch (err) {
        console.error('[BpmnConverterDemo] Error executing generated code:', err);
        console.log('Generated code:\n' + generatedCode);
    }

    // Render branch analysis badges into the bottom card header
    renderBranchPanel(converter.getBranches(), converter.elements, 'bottom-card-bar', options, triggerRender);

    fluentDiagram.arrange();
    fluentDiagram.fitScreen();

    return fluentDiagram;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export — called by the demo app loader
// ─────────────────────────────────────────────────────────────────────────────
import { BpmnExporter } from '../../lib/notations/bpmn/BpmnExporter.js';

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

    // Add spacer
    const spacer = document.createElement('div');
    spacer.style.flex = '1';
    toolbar.appendChild(spacer);

    // Export Button
    const exportBtn = document.createElement('button');
    exportBtn.textContent = 'Export Auto-generated to BPMN';
    exportBtn.style.cssText = `
        font-size: 12px;
        font-family: sans-serif;
        padding: 4px 12px;
        border-radius: 4px;
        border: 1px solid #3b82f6;
        background: #2563eb;
        color: white;
        cursor: pointer;
        outline: none;
        transition: background 0.2s;
    `;
    exportBtn.onmouseover = () => exportBtn.style.background = '#1d4ed8';
    exportBtn.onmouseout = () => exportBtn.style.background = '#2563eb';

    exportBtn.addEventListener('click', async () => {
        if (!currentDiagram) return;

        try {
            const exporter = new BpmnExporter();
            const xmlString = await exporter.export(currentDiagram);

            const blob = new Blob([xmlString], { type: 'application/xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const currentLabel = DIAGRAM_FILES[select.value].label.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            a.download = `exported_${currentLabel}.bpmn`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export diagram:', error);
            alert('Export failed. Check console for details.');
        }
    });

    toolbar.appendChild(exportBtn);

    let currentStage = 'lanes';
    const stateVars = { hiddenBranches: new Set() };

    const triggerRender = (resetState = false) => {
        if (resetState === true) {
            stateVars.hiddenBranches.clear();
        }
        const idx = parseInt(select.value, 10);
        currentDiagram = renderBothPanels(topCanvas, bottomCanvas, DIAGRAM_FILES[idx].xml, { ...options, stage: currentStage, ...stateVars }, triggerRender);
    };

    const STAGES = [
        { label: 'Baseline', value: 'baseline' },
        { label: 'Branches', value: 'branches' },
        { label: 'Lanes', value: 'lanes' }
    ];

    const pipelineContainer = document.createElement('div');
    pipelineContainer.style.cssText = `
        display: flex;
        align-items: center;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(8px);
        padding: 2px;
        border-radius: 8px;
        border: 1px solid #334155;
        margin-left: 12px;
    `;
    toolbar.appendChild(pipelineContainer);

    const renderPipeline = () => {
        pipelineContainer.innerHTML = '';
        STAGES.forEach((stage, index) => {
            const stageIndex = STAGES.findIndex(s => s.value === currentStage);
            const isActive = index <= stageIndex;
            const step = document.createElement('div');
            step.style.cssText = `
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 4px 12px;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                user-select: none;
                font-family: sans-serif;
                font-size: 11px;
                font-weight: 500;
                position: relative;
            `;

            if (isActive) {
                step.style.background = '#2563eb';
                step.style.color = 'white';
                step.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
            } else {
                step.style.color = '#64748b';
            }

            step.onmouseover = () => {
                if (!isActive) step.style.background = 'rgba(51, 65, 85, 0.5)';
                else step.style.background = '#1d4ed8';
            };
            step.onmouseout = () => {
                if (!isActive) step.style.background = 'transparent';
                else step.style.background = '#2563eb';
            };

            step.onclick = () => {
                currentStage = stage.value;
                renderPipeline();
                triggerRender(false);
            };

            const num = document.createElement('span');
            num.textContent = index + 1;
            num.style.cssText = `
                width: 16px;
                height: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                font-size: 9px;
                background: ${isActive ? 'rgba(255,255,255,0.2)' : '#334155'};
                color: ${isActive ? 'white' : '#94a3b8'};
                font-weight: 800;
            `;
            step.appendChild(num);

            const text = document.createElement('span');
            text.textContent = stage.label;
            step.appendChild(text);

            pipelineContainer.appendChild(step);

            // Add chevron between steps (except last)
            if (index < STAGES.length - 1) {
                const chevron = document.createElement('span');
                chevron.innerHTML = '›';
                chevron.style.cssText = `
                    color: #475569;
                    font-size: 14px;
                    margin: 0 2px;
                    font-weight: 300;
                `;
                pipelineContainer.appendChild(chevron);
            }
        });
    };

    renderPipeline();

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
    const bottomCanvas = createCard(diagramArea, 'Auto-generated Fluent API', 'BpmnToFluentConverter.convert(xml)', 'bottom-card-bar');

    // ── Initial render ──────────────────────────────────────────────────────
    let currentDiagram = renderBothPanels(topCanvas, bottomCanvas, DIAGRAM_FILES[0].xml, { ...options, stage: currentStage, ...stateVars }, triggerRender);

    // ── On file change, re-render both panels ───────────────────────────────
    select.addEventListener('change', () => triggerRender(true));

    return currentDiagram;
}
