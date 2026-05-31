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

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic BPMN source discovery
// ─────────────────────────────────────────────────────────────────────────────
const bpmnModules = import.meta.glob('../../data/bpmn/*.bpmn', { query: '?raw', eager: true });

const DIAGRAM_FILES = Object.keys(bpmnModules)
    .map(path => {
        const filename = path.split('/').pop();
        const label = filename
            .replace('.bpmn', '')
            .replace(/[_-]/g, ' ')
            .replace(/\b[a-z]/g, match => match.toUpperCase());
        
        return {
            label,
            xml: bpmnModules[path].default || bpmnModules[path]
        };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

// ─────────────────────────────────────────────────────────────────────────────
// Helper: create a labelled card wrapper
// ─────────────────────────────────────────────────────────────────────────────
function createCard(parentContainer, title, subtitle, barId, isPreview = false) {
    const card = document.createElement('div');
    
    const previewStyle = `
        position: absolute;
        bottom: 12px;
        right: 12px;
        width: 380px;
        height: 250px;
        z-index: 1000;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(0, 0, 0, 0.15);
        border-radius: 8px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    
    const flexStyle = `
        display: flex;
        flex-direction: column;
        flex: 1 1 0;
        min-height: 0;
        border-bottom: 1px solid #ddd;
        position: relative;
    `;

    card.style.cssText = isPreview === true ? previewStyle : flexStyle;
    
    if (isPreview === true) {
        card.className = 'preview-window';
    }

    const bar = document.createElement('div');
    if (barId) bar.id = barId;
    
    // UIX optimization: relative position, nowrap flex for preview headers to prevent wrapping
    bar.style.cssText = isPreview === true ? `
        padding: 6px 36px 6px 16px;
        background: #f5f5f5;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
        position: relative;
        overflow: hidden;
    ` : `
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
    h.style.cssText = 'font-size: 13px; font-weight: 600; color: #333; font-family: sans-serif; white-space: nowrap; flex-shrink: 0;';
    bar.appendChild(h);

    if (subtitle) {
        const s = document.createElement('span');
        s.textContent = subtitle;
        // Clip subtitle in preview window to prevent any layout wrapping or overlapping
        s.style.cssText = isPreview === true ? `
            font-size: 11px;
            color: #888;
            font-family: monospace;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 140px;
            flex-shrink: 1;
        ` : `
            font-size: 11px;
            color: #888;
            font-family: monospace;
            white-space: nowrap;
        `;
        bar.appendChild(s);
    }

    card.appendChild(bar);

    const canvas = document.createElement('div');
    canvas.style.cssText = 'flex: 1 1 0; min-height: 0; position: relative;';
    card.appendChild(canvas);

    parentContainer.appendChild(card);

    if (isPreview === true) {
        let isMaximized = false;
        let isMinimized = false;
        
        const minBtn = document.createElement('button');
        const maxBtn = document.createElement('button');
        
        // Pinned strictly to the top-right corner of the header bar to prevent wrapping
        const maxBtnStyle = `
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #64748b;
            font-size: 14px;
            cursor: pointer;
            line-height: 1;
            padding: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: background 0.15s, color 0.15s;
            z-index: 10;
        `;
        
        const minBtnStyle = `
            position: absolute;
            right: 34px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #64748b;
            font-size: 14px;
            cursor: pointer;
            line-height: 1;
            padding: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: background 0.15s, color 0.15s;
            z-index: 10;
        `;

        maxBtn.style.cssText = maxBtnStyle;
        minBtn.style.cssText = minBtnStyle;
        
        const updateIcon = () => {
            if (isMaximized) {
                maxBtn.innerHTML = `
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" xmlns="http://www.w3.org/2000/svg">
                        <rect x="4" y="2" width="10" height="10" rx="1.5"/>
                        <path d="M2 14V6c0-.828.672-1.5 1.5-1.5H6" />
                    </svg>
                `;
                maxBtn.title = 'Restore preview';
            } else {
                maxBtn.innerHTML = `
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="2" width="12" height="12" rx="1.5"/>
                    </svg>
                `;
                maxBtn.title = 'Maximize preview';
            }
        };

        const updateMinIcon = () => {
            if (isMinimized) {
                minBtn.innerHTML = `
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" xmlns="http://www.w3.org/2000/svg">
                        <line x1="3" y1="8" x2="13" y2="8"/>
                        <line x1="8" y1="3" x2="8" y2="13"/>
                    </svg>
                `;
                minBtn.title = 'Expand preview';
            } else {
                minBtn.innerHTML = `
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" xmlns="http://www.w3.org/2000/svg">
                        <line x1="3" y1="8" x2="13" y2="8"/>
                    </svg>
                `;
                minBtn.title = 'Minimize preview';
            }
        };

        updateIcon();
        updateMinIcon();
        
        maxBtn.onmouseover = () => {
            maxBtn.style.background = 'rgba(0,0,0,0.05)';
            maxBtn.style.color = '#1e293b';
        };
        maxBtn.onmouseout = () => {
            maxBtn.style.background = 'none';
            maxBtn.style.color = '#64748b';
        };

        minBtn.onmouseover = () => {
            minBtn.style.background = 'rgba(0,0,0,0.05)';
            minBtn.style.color = '#1e293b';
        };
        minBtn.onmouseout = () => {
            minBtn.style.background = 'none';
            minBtn.style.color = '#64748b';
        };

        maxBtn.onclick = (e) => {
            e.stopPropagation();
            if (isMinimized) {
                isMinimized = false;
                updateMinIcon();
            }
            isMaximized = !isMaximized;
            updateIcon();
            if (isMaximized) {
                card.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 2000;
                    background: white;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                `;
                // Remove truncation in maximized mode since we have plenty of width
                if (subtitle) {
                    const subtitleSpan = bar.querySelector('span:nth-of-type(2)');
                    if (subtitleSpan) subtitleSpan.style.maxWidth = 'none';
                }
            } else {
                card.style.cssText = previewStyle;
                // Re-enable truncation in preview mode
                if (subtitle) {
                    const subtitleSpan = bar.querySelector('span:nth-of-type(2)');
                    if (subtitleSpan) subtitleSpan.style.maxWidth = '140px';
                }
            }
            window.dispatchEvent(new Event('resize'));
        };

        minBtn.onclick = (e) => {
            e.stopPropagation();
            if (isMaximized) {
                isMaximized = false;
                updateIcon();
                if (subtitle) {
                    const subtitleSpan = bar.querySelector('span:nth-of-type(2)');
                    if (subtitleSpan) subtitleSpan.style.maxWidth = '140px';
                }
            }
            isMinimized = !isMinimized;
            updateMinIcon();
            if (isMinimized) {
                card.style.cssText = `
                    position: absolute;
                    bottom: 12px;
                    right: 12px;
                    width: 380px;
                    height: 32px;
                    z-index: 1000;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(0, 0, 0, 0.15);
                    border-radius: 8px;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                `;
            } else {
                card.style.cssText = previewStyle;
            }
            window.dispatchEvent(new Event('resize'));
        };

        bar.appendChild(minBtn);
        bar.appendChild(maxBtn);
    }

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
        display: ${options && options.branchesExpanded === false ? 'none' : 'flex'};
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
// TOP panel: native XML import
// ─────────────────────────────────────────────────────────────────────────────
function renderTopPanel(topCanvas, xmlString, options) {
    while (topCanvas.firstChild) topCanvas.removeChild(topCanvas.firstChild);
    const nativeDiagram = new BpmnDiagram(topCanvas, options);
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    nativeDiagram.buildDiagram(xmlDoc);
    nativeDiagram.fitScreen();
    return nativeDiagram;
}

// ─────────────────────────────────────────────────────────────────────────────
// BOTTOM panel: fluent API via converter
// ─────────────────────────────────────────────────────────────────────────────
function renderBottomPanel(bottomCanvas, xmlString, options, triggerRender) {
    while (bottomCanvas.firstChild) bottomCanvas.removeChild(bottomCanvas.firstChild);

    const fluentDiagram = new BpmnDiagram(bottomCanvas, options);
    const diagram = fluentDiagram; // alias used in eval'd code

    // stage 'overlaps' passes 'lanes' to the converter; all others pass through unchanged
    const converterStage = options.stage === 'overlaps' ? 'lanes' : options.stage;
    const converterOptions = { ...options, stage: converterStage };
    const converter = new BpmnToFluentConverter();
    const generatedCode = converter.convert(xmlString, converterOptions);

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

    // ── Overlap Resolution (only when stage is 'overlaps') ─────────────────────
    if (options.stage === 'overlaps') {
        try {
            fluentDiagram.resolveOverlaps();
            fluentDiagram.fitScreen();
        } catch (err) {
            console.warn('[Overlap Resolution] Failed:', err);
        }
    }

    // ── Overlap Detection & Highlighting ────────────────────────────────────
    try {
        const overlaps = fluentDiagram.highlightOverlaps();
        const totalOverlaps = overlaps.connectorVsLabel.length + overlaps.connectorVsConnector.length;
        console.groupCollapsed(`%c[Overlap Report] ${totalOverlaps} overlap(s) detected`, 'color: #f59e0b; font-weight: bold;');
        if (overlaps.connectorVsLabel.length > 0) {
            console.group(`%cCategory 1: Connector vs. Label (${overlaps.connectorVsLabel.length})`, 'color: #ef4444;');
            console.table(overlaps.connectorVsLabel.map(o => ({
                'Connector ID': o.connectorId, 'From': o.connectorFrom, 'To': o.connectorTo,
                'Segment #': o.segmentIndex, 'Label of': o.labelOwner, 'Label Text': o.labelText
            })));
            console.groupEnd();
        } else {
            console.log('%c✓ No Connector vs. Label overlaps', 'color: #22c55e;');
        }
        if (overlaps.connectorVsConnector.length > 0) {
            console.group(`%cCategory 2: Connector vs. Connector (${overlaps.connectorVsConnector.length})`, 'color: #ef4444;');
            console.table(overlaps.connectorVsConnector.map(o => ({
                'Connector A': o.connectorA, 'From A': o.fromA, 'To A': o.toA,
                'Connector B': o.connectorB, 'From B': o.fromB, 'To B': o.toB,
                'Segment A #': o.segmentA, 'Segment B #': o.segmentB
            })));
            console.groupEnd();
        } else {
            console.log('%c✓ No Connector vs. Connector overlaps', 'color: #22c55e;');
        }
        console.groupEnd();
    } catch (err) {
        console.warn('[Overlap Detection] Failed:', err);
    }

    return fluentDiagram;
}

// ─────────────────────────────────────────────────────────────────────────────
// Combined render (both panels) — used by triggerRender
// ─────────────────────────────────────────────────────────────────────────────
function renderBothPanels(topCanvas, bottomCanvas, xmlString, options, triggerRender) {
    renderTopPanel(topCanvas, xmlString, options);
    return renderBottomPanel(bottomCanvas, xmlString, options, triggerRender);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export — called by the demo app loader
// ─────────────────────────────────────────────────────────────────────────────
import { BpmnExporter } from '../../lib/notations/bpmn/BpmnExporter.js';

export default function initDemo(container, options = {}) {

    // ── Outer layout: two diagram panes ─────────────────────────────────────
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
    `;

    // ── File selector (injected into top card bar after card creation) ───────
    const select = document.createElement('select');
    select.id = 'bpmn-file-selector';
    select.style.cssText = `
        font-size: 12px;
        font-family: sans-serif;
        padding: 3px 6px;
        border-radius: 4px;
        border: 1px solid #cbd5e1;
        background: white;
        color: #334155;
        cursor: pointer;
        outline: none;
        margin-left: auto;
        flex-shrink: 0;
    `;
    DIAGRAM_FILES.forEach((f, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = f.label;
        select.appendChild(opt);
    });

    // ── Export Button (injected into bottom card bar) ─────────────────────
    const exportBtn = document.createElement('button');
    exportBtn.textContent = 'Export BPMN';
    exportBtn.style.cssText = `
        font-size: 11px;
        font-family: sans-serif;
        padding: 3px 10px;
        border-radius: 4px;
        border: 1px solid #3b82f6;
        background: #2563eb;
        color: white;
        cursor: pointer;
        outline: none;
        transition: background 0.2s;
        flex-shrink: 0;
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

    let currentStage = 'overlaps';
    const stateVars = { hiddenBranches: new Set(), branchesExpanded: false };

    const triggerRender = (resetState = false) => {
        if (resetState === true) {
            stateVars.hiddenBranches.clear();
        }
        const idx = parseInt(select.value, 10);
        const diagramInfo = DIAGRAM_FILES[idx];
        console.log(`%c[BpmnConverterDemo] Loading diagram: ${diagramInfo.label}`, 'color: #3b82f6; font-weight: bold;');
        currentDiagram = renderBothPanels(topCanvas, bottomCanvas, diagramInfo.xml, { ...options, stage: currentStage, ...stateVars }, triggerRender);
    };

    const STAGES = [
        { label: 'Topology', value: 'topology' },
        { label: 'Baseline', value: 'baseline' },
        { label: 'Branches', value: 'branches' },
        { label: 'Lanes', value: 'lanes' },
        { label: 'Overlaps', value: 'overlaps' }
    ];

    const pipelineContainer = document.createElement('div');
    pipelineContainer.style.cssText = `
        display: flex;
        align-items: center;
        background: rgba(15, 23, 42, 0.06);
        padding: 2px;
        border-radius: 8px;
        border: 1px solid #cbd5e1;
        flex-shrink: 0;
    `;

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

    // ── Diagrams area ───────────────────────────────────────────────────────
    const diagramArea = document.createElement('div');
    diagramArea.style.cssText = `
        display: flex;
        flex-direction: column;
        flex: 1 1 0;
        min-height: 0;
        overflow: hidden;
        position: relative;
    `;
    container.appendChild(diagramArea);

    const topCanvas = createCard(diagramArea, 'Native XML Import', 'BpmnDiagram.buildDiagram(xmlDoc)', 'top-card-bar', true);
    const bottomCanvas = createCard(diagramArea, 'Auto-generated Fluent API', 'BpmnToFluentConverter.convert(xml)', 'bottom-card-bar', false);



    // ── Auto Layout button ───────────────────────────────────────────────────
    const autoLayoutBtn = document.createElement('button');
    autoLayoutBtn.textContent = '▶ Auto Layout';
    autoLayoutBtn.style.cssText = `
        font-size: 11px;
        font-family: sans-serif;
        padding: 3px 10px;
        border-radius: 4px;
        border: 1px solid #22c55e;
        background: #16a34a;
        color: white;
        cursor: pointer;
        outline: none;
        transition: background 0.2s;
        flex-shrink: 0;
    `;
    autoLayoutBtn.onmouseover = () => { if (!autoLayoutBtn.disabled) autoLayoutBtn.style.background = '#15803d'; };
    autoLayoutBtn.onmouseout = () => { if (!autoLayoutBtn.disabled) autoLayoutBtn.style.background = '#16a34a'; };

    const ANIM_DELAY = 1800; // ms between each stage

    autoLayoutBtn.addEventListener('click', async () => {
        autoLayoutBtn.disabled = true;
        autoLayoutBtn.style.opacity = '0.5';
        autoLayoutBtn.textContent = '⏳ Running…';

        const idx = parseInt(select.value, 10);
        const xmlString = DIAGRAM_FILES[idx].xml;

        for (const stage of STAGES) {
            currentStage = stage.value;
            renderPipeline();
            currentDiagram = renderBottomPanel(
                bottomCanvas, xmlString,
                { ...options, stage: stage.value, ...stateVars },
                triggerRender
            );
            await new Promise(r => setTimeout(r, ANIM_DELAY));
        }

        autoLayoutBtn.disabled = false;
        autoLayoutBtn.style.opacity = '1';
        autoLayoutBtn.textContent = '▶ Auto Layout';
    });

    // ── Branch toggle icon button ────────────────────────────────────────────
    const branchToggleBtn = document.createElement('button');
    const updateBranchToggleBtn = () => {
        const expanded = stateVars.branchesExpanded;
        branchToggleBtn.innerHTML = expanded
            ? `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                 <circle cx="4" cy="3" r="1.5"/>
                 <circle cx="4" cy="13" r="1.5"/>
                 <circle cx="12" cy="3" r="1.5"/>
                 <path d="M4 4.5v4a2.5 2.5 0 0 0 2.5 2.5H10a2 2 0 0 1 2-2V4.5" stroke="currentColor" stroke-width="1.4" fill="none"/>
               </svg>`
            : `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                 <circle cx="4" cy="3" r="1.5"/>
                 <circle cx="4" cy="13" r="1.5"/>
                 <circle cx="12" cy="3" r="1.5"/>
                 <path d="M4 4.5v4a2.5 2.5 0 0 0 2.5 2.5H10a2 2 0 0 1 2-2V4.5" stroke="currentColor" stroke-width="1.4" fill="none" opacity="0.35"/>
               </svg>`;
        branchToggleBtn.title = expanded ? 'Collapse branches' : 'Expand branches';
        branchToggleBtn.style.color = expanded ? '#3b82f6' : '#94a3b8';
        branchToggleBtn.style.borderColor = expanded ? '#93c5fd' : '#cbd5e1';
    };
    branchToggleBtn.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        border-radius: 5px;
        border: 1px solid #93c5fd;
        background: transparent;
        cursor: pointer;
        outline: none;
        transition: background 0.15s, color 0.15s;
        flex-shrink: 0;
        padding: 0;
    `;
    branchToggleBtn.onmouseover = () => branchToggleBtn.style.background = 'rgba(59,130,246,0.08)';
    branchToggleBtn.onmouseout = () => branchToggleBtn.style.background = 'transparent';
    updateBranchToggleBtn();
    branchToggleBtn.addEventListener('click', () => {
        stateVars.branchesExpanded = !stateVars.branchesExpanded;
        updateBranchToggleBtn();
        triggerRender();
    });

    // Inject BPMN Source selector, divider, pipeline + Export BPMN + Auto Layout + Branch toggle into bottom card bar
    const bottomBarEl = document.getElementById('bottom-card-bar');
    if (bottomBarEl) {
        const srcLabel = document.createElement('span');
        srcLabel.textContent = 'Source:';
        srcLabel.style.cssText = 'font-size: 11px; color: #888; font-family: sans-serif; white-space: nowrap; margin-left: auto; flex-shrink: 0;';
        bottomBarEl.appendChild(srcLabel);
        bottomBarEl.appendChild(select);

        const sep = document.createElement('span');
        sep.textContent = '|';
        sep.style.cssText = 'color: #ccc; font-size: 13px; font-weight: 300; margin: 0 4px; flex-shrink: 0;';
        bottomBarEl.appendChild(sep);

        bottomBarEl.appendChild(pipelineContainer);
        bottomBarEl.appendChild(branchToggleBtn);
        bottomBarEl.appendChild(exportBtn);
        bottomBarEl.appendChild(autoLayoutBtn);
    }

    // ── Initial render ──────────────────────────────────────────────────────
    let currentDiagram = renderBothPanels(topCanvas, bottomCanvas, DIAGRAM_FILES[0].xml, { ...options, stage: currentStage, ...stateVars }, triggerRender);

    // ── On file change, re-render both panels ───────────────────────────────
    select.addEventListener('change', () => triggerRender(true));

    return currentDiagram;
}
