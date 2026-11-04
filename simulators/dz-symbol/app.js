(function () {
    'use strict';

    const NS = 'http://www.w3.org/2000/svg';
    const XLINK_NS = 'http://www.w3.org/1999/xlink';
    const stage = document.getElementById('symbol-stage');
    const layer = document.getElementById('drawing-layer');
    const gridBg = document.getElementById('grid-bg');
    const border = document.getElementById('symbol-border');
    const minorGrid = document.getElementById('minor-grid');
    const majorGrid = document.getElementById('major-grid');
    const statusText = document.getElementById('status-text');
    const referenceLayer = document.getElementById('reference-layer');
    const referenceInfo = document.getElementById('reference-info');
    const terminalList = document.getElementById('terminal-list');
    const stageWrap = document.querySelector('.stage-wrap');
    const zoomDisplay = document.getElementById('zoom-display');
    const WORKSPACE_GRID = 20;
    const DEFAULT_CANVAS = { width: 80, height: 100, grid: WORKSPACE_GRID };
    const overlayLayer = document.getElementById('overlay-layer');

    const inputs = {
        preset: document.getElementById('symbol-preset'),
        width: document.getElementById('canvas-width'),
        height: document.getElementById('canvas-height'),
        grid: document.getElementById('grid-size'),
        zoom: document.getElementById('zoom-input'),
        snapDivision: document.getElementById('snap-division'),
        snap: document.getElementById('snap-enabled'),
        stroke: document.getElementById('stroke-color'),
        fill: document.getElementById('fill-color'),
        strokeWidth: document.getElementById('stroke-width'),
        fontSize: document.getElementById('font-size'),
        fillEnabled: document.getElementById('fill-enabled')
    };

    let activeTool = 'select';
    let selected = null;
    let selectedElements = [];
    let draft = null;
    let dragState = null;
    let selectDrag = null;
    let polygonPoints = [];
    let referencePoint = null;
    let textEditor = null;
    let terminals = [];
    let terminalDrag = null;
    let panDrag = null;

    function svgEl(tag, attrs) {
        const el = document.createElementNS(NS, tag);
        Object.entries(attrs || {}).forEach(([key, value]) => el.setAttribute(key, String(value)));
        return el;
    }

    function num(value, fallback) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function canvasSize() {
        return {
            width: num(inputs.width.value, DEFAULT_CANVAS.width),
            height: num(inputs.height.value, DEFAULT_CANVAS.height),
            grid: Math.max(5, num(inputs.grid.value, DEFAULT_CANVAS.grid))
        };
    }

    function snap(value) {
        if (!inputs.snap.checked) return value;
        const division = Math.max(1, Math.min(8, Math.round(num(inputs.snapDivision?.value, 4))));
        const base = canvasSize().grid / division;
        return Math.round(value / base) * base;
    }

    function snapPoint(point) {
        return {
            x: snap(point.x),
            y: snap(point.y)
        };
    }

    function pointerPoint(evt) {
        const pt = stage.createSVGPoint();
        pt.x = evt.clientX;
        pt.y = evt.clientY;
        const transformed = pt.matrixTransform(stage.getScreenCTM().inverse());
        return snapPoint({ x: transformed.x, y: transformed.y });
    }

    function readFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => resolve(String(reader.result || '')));
            reader.addEventListener('error', () => reject(reader.error || new Error('Falha ao ler arquivo.')));
            reader.readAsDataURL(file);
        });
    }

    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', () => reject(new Error('Falha ao carregar imagem.')));
            image.src = src;
        });
    }

    function setStatus(text) {
        statusText.textContent = text;
    }

    function fmt(value) {
        const fixed = Number(value).toFixed(3);
        return fixed.replace(/\.?0+$/, '');
    }
    const PROJECT_IMPORT_LIMITS = Object.freeze({
        maxFileBytes: 2 * 1024 * 1024,
        maxDrawingChars: 800000,
        maxTerminals: 300,
        maxCanvas: 20000,
        maxTextLength: 300
    });

    function clampImportedNumber(value, fallback = 0, min = -PROJECT_IMPORT_LIMITS.maxCanvas, max = PROJECT_IMPORT_LIMITS.maxCanvas) {
        const n = Number(value);
        if (!Number.isFinite(n)) return fallback;
        return Math.min(max, Math.max(min, n));
    }

    function sanitizeImportedText(value, maxLength = PROJECT_IMPORT_LIMITS.maxTextLength) {
        return String(value || '')
            .replace(/[\u0000-\u001f\u007f]/g, '')
            .replace(/[<>]/g, '')
            .replace(/javascript:/gi, '')
            .slice(0, Math.max(1, maxLength))
            .trim();
    }

    function sanitizeImportedColor(value, fallback = '#111827') {
        const txt = String(value || '').trim();
        if (!txt || txt.length > 64) return fallback;
        if (/url\s*\(|javascript:|data:|expression\s*\(/i.test(txt)) return fallback;
        if (/^#[0-9a-f]{3,8}$/i.test(txt)) return txt;
        if (/^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i.test(txt)) return txt;
        const named = txt.toLowerCase();
        const allowedNames = new Set(['black', 'white', 'red', 'green', 'blue', 'yellow', 'orange', 'purple', 'gray', 'grey', 'brown', 'none']);
        return allowedNames.has(named) ? named : fallback;
    }

    function sanitizeSymbolProjectData(data) {
        if (!data || typeof data !== 'object' || (data.format && data.format !== 'simucir-symbol-project')) return null;
        const canvas = data.canvas && typeof data.canvas === 'object' ? data.canvas : {};
        const appearance = data.appearance && typeof data.appearance === 'object' ? data.appearance : {};
        const terminalsRaw = Array.isArray(data.terminals) ? data.terminals : [];
        const drawing = String(data.drawing || '<g></g>').slice(0, PROJECT_IMPORT_LIMITS.maxDrawingChars);
        return {
            ...data,
            canvas: {
                width: clampImportedNumber(canvas.width, DEFAULT_CANVAS.width, 1, PROJECT_IMPORT_LIMITS.maxCanvas),
                height: clampImportedNumber(canvas.height, DEFAULT_CANVAS.height, 1, PROJECT_IMPORT_LIMITS.maxCanvas),
                grid: clampImportedNumber(canvas.grid, DEFAULT_CANVAS.grid, 1, 1000),
                zoom: clampImportedNumber(canvas.zoom, 520, 10, 2000),
                snapDivision: clampImportedNumber(canvas.snapDivision, 4, 1, 16),
                snap: canvas.snap !== false
            },
            appearance: {
                stroke: sanitizeImportedColor(appearance.stroke, '#111827'),
                fill: sanitizeImportedColor(appearance.fill, '#ffffff'),
                strokeWidth: clampImportedNumber(appearance.strokeWidth, 2, 0.1, 50),
                fontSize: clampImportedNumber(appearance.fontSize, 14, 4, 200),
                fillEnabled: !!appearance.fillEnabled
            },
            referencePoint: data.referencePoint && Number.isFinite(Number(data.referencePoint.x)) && Number.isFinite(Number(data.referencePoint.y))
                ? {
                    x: clampImportedNumber(data.referencePoint.x, 0),
                    y: clampImportedNumber(data.referencePoint.y, 0)
                }
                : null,
            terminals: terminalsRaw.slice(0, PROJECT_IMPORT_LIMITS.maxTerminals).map(item => ({
                id: sanitizeImportedText(item?.id, 80),
                label: normalizeTerminalLabel(sanitizeImportedText(item?.label, 40), terminalLabelSuggestion()),
                x: clampImportedNumber(item?.x, 0),
                y: clampImportedNumber(item?.y, 0)
            })),
            drawing
        };
    }

    function renderReferencePoint() {
        if (!referenceLayer) return;
        referenceLayer.innerHTML = '';
        if (!referencePoint) {
            if (referenceInfo) referenceInfo.textContent = 'Ponto de referencia: nao definido.';
            return;
        }
        const x = referencePoint.x;
        const y = referencePoint.y;
        referenceLayer.appendChild(svgEl('circle', {
            class: 'reference-marker',
            cx: x,
            cy: y,
            r: 2.25,
            fill: '#f59e0b',
            stroke: '#111827',
            'stroke-width': 0.45,
            'vector-effect': 'non-scaling-stroke'
        }));
        referenceLayer.appendChild(svgEl('line', {
            class: 'reference-marker',
            x1: x - 5,
            y1: y,
            x2: x + 5,
            y2: y,
            stroke: '#f59e0b',
            'stroke-width': 0.8,
            'vector-effect': 'non-scaling-stroke'
        }));
        referenceLayer.appendChild(svgEl('line', {
            class: 'reference-marker',
            x1: x,
            y1: y - 5,
            x2: x,
            y2: y + 5,
            stroke: '#f59e0b',
            'stroke-width': 0.8,
            'vector-effect': 'non-scaling-stroke'
        }));
        if (referenceInfo) referenceInfo.textContent = `Ponto de referencia: X ${fmt(x)}, Y ${fmt(y)}.`;
    }

    function normalizeTerminalLabel(value, fallback = 'X1') {
        const label = String(value == null ? '' : value).trim().replace(/\s+/g, '');
        return (label || fallback).toUpperCase();
    }

    function terminalId() {
        return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    }

    function terminalLabelSuggestion() {
        return `X${terminals.length + 1}`;
    }

    function updateTerminalPosition(id, point) {
        const terminal = terminals.find(item => item.id === id);
        if (!terminal) return;
        terminal.x = snap(point.x);
        terminal.y = snap(point.y);
        renderTerminals();
    }

    function removeTerminal(id) {
        terminals = terminals.filter(item => item.id !== id);
        renderTerminals();
        setStatus('Borne removido.');
    }

    function renameTerminal(id) {
        const terminal = terminals.find(item => item.id === id);
        if (!terminal) return;
        const next = window.prompt('Nome do borne:', terminal.label);
        if (next == null) return;
        terminal.label = normalizeTerminalLabel(next, terminal.label);
        renderTerminals();
        setStatus(`Borne ${terminal.label} atualizado.`);
    }

    function terminalPointerDown(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        terminalDrag = {
            id: evt.currentTarget.dataset.terminalId,
            point: pointerPoint(evt)
        };
        evt.currentTarget.setPointerCapture?.(evt.pointerId);
    }

    function terminalDblClick(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        renameTerminal(evt.currentTarget.dataset.terminalId);
    }

    function renderTerminals() {
        if (!overlayLayer) return;
        overlayLayer.querySelectorAll('.terminal-marker').forEach(node => node.remove());
        terminals.forEach((terminal) => {
            const group = svgEl('g', {
                class: 'terminal-marker',
                'data-terminal-id': terminal.id,
                transform: `translate(${fmt(terminal.x)} ${fmt(terminal.y)})`
            });
            group.appendChild(svgEl('circle', { cx: 0, cy: 0, r: 3.2 }));
            group.appendChild(svgEl('line', { x1: -7, y1: 0, x2: 7, y2: 0 }));
            group.appendChild(svgEl('line', { x1: 0, y1: -7, x2: 0, y2: 7 }));
            const label = svgEl('text', {
                x: 6,
                y: -6,
                'font-size': 5,
                'font-family': 'Arial, Helvetica, sans-serif'
            });
            label.textContent = terminal.label;
            group.appendChild(label);
            group.addEventListener('pointerdown', terminalPointerDown);
            group.addEventListener('dblclick', terminalDblClick);
            overlayLayer.appendChild(group);
        });

        if (!terminalList) return;
        terminalList.innerHTML = '';
        if (!terminals.length) {
            terminalList.textContent = 'Nenhum borne definido.';
            return;
        }
        terminals.forEach((terminal) => {
            const row = document.createElement('div');
            row.className = 'terminal-row';
            const label = document.createElement('span');
            label.textContent = `${terminal.label}: X ${fmt(terminal.x)}, Y ${fmt(terminal.y)}`;
            const edit = document.createElement('button');
            edit.type = 'button';
            edit.title = 'Renomear borne';
            edit.textContent = 'Editar';
            edit.addEventListener('click', () => renameTerminal(terminal.id));
            const del = document.createElement('button');
            del.type = 'button';
            del.title = 'Apagar borne';
            del.textContent = 'Apagar';
            del.className = 'danger';
            del.addEventListener('click', () => removeTerminal(terminal.id));
            row.append(label, edit, del);
            terminalList.appendChild(row);
        });
    }

    function addTerminalAt(point) {
        const label = normalizeTerminalLabel(window.prompt('Nome do borne:', terminalLabelSuggestion()), '');
        if (!label) return;
        terminals.push({
            id: terminalId(),
            label,
            x: snap(point.x),
            y: snap(point.y)
        });
        renderTerminals();
        setStatus(`Borne ${label} posicionado em X ${fmt(point.x)}, Y ${fmt(point.y)}.`);
    }

    function applyCanvas() {
        const size = canvasSize();
        const zoomValue = Math.max(40, Math.min(1200, num(inputs.zoom.value, 520)));
        inputs.zoom.value = zoomValue;
        if (zoomDisplay) zoomDisplay.textContent = `${zoomValue}%`;
        const zoom = zoomValue / 100;
        stage.setAttribute('width', size.width * zoom);
        stage.setAttribute('height', size.height * zoom);
        stage.setAttribute('viewBox', `0 0 ${size.width} ${size.height}`);
        gridBg.setAttribute('width', size.width);
        gridBg.setAttribute('height', size.height);
        border.setAttribute('width', size.width);
        border.setAttribute('height', size.height);
        minorGrid.setAttribute('width', size.grid / 2);
        minorGrid.setAttribute('height', size.grid / 2);
        minorGrid.firstElementChild.setAttribute('d', `M ${size.grid / 2} 0 L 0 0 0 ${size.grid / 2}`);
        majorGrid.setAttribute('width', size.grid);
        majorGrid.setAttribute('height', size.grid);
        majorGrid.firstElementChild.setAttribute('width', size.grid);
        majorGrid.firstElementChild.setAttribute('height', size.grid);
        majorGrid.lastElementChild.setAttribute('d', `M ${size.grid} 0 L 0 0 0 ${size.grid}`);
        renderReferencePoint();
    }

    function setZoom(value) {
        const next = Math.max(40, Math.min(1200, Math.round(num(value, 520) / 10) * 10));
        inputs.zoom.value = next;
        applyCanvas();
        setStatus(`Zoom ${next}%.`);
    }

    function bumpZoom(delta) {
        setZoom(num(inputs.zoom.value, 520) + delta);
    }

    function styleAttrs() {
        const filled = inputs.fillEnabled.checked;
        return {
            stroke: inputs.stroke.value,
            'stroke-width': num(inputs.strokeWidth.value, 1),
            fill: filled ? inputs.fill.value : 'none',
            'stroke-linecap': 'square',
            'stroke-linejoin': 'miter',
            'vector-effect': 'non-scaling-stroke'
        };
    }

    function textAttrs() {
        return {
            fill: inputs.stroke.value,
            'font-size': num(inputs.fontSize.value, 14),
            'font-family': 'Arial, Helvetica, sans-serif',
            'text-anchor': 'middle',
            'dominant-baseline': 'middle'
        };
    }

    function applyAppearanceToSelection() {
        if (!selectedElements.length) return;
        const stroke = inputs.stroke.value;
        const strokeWidth = num(inputs.strokeWidth.value, 2);
        const fill = inputs.fillEnabled.checked ? inputs.fill.value : 'none';
        const fontSize = num(inputs.fontSize.value, 14);
        selectedElements.forEach((el) => {
            const tag = el.tagName.toLowerCase();
            if (tag === 'text') {
                el.setAttribute('fill', stroke);
                el.setAttribute('font-size', fontSize);
                return;
            }
            el.setAttribute('stroke', stroke);
            el.setAttribute('stroke-width', strokeWidth);
            if (tag === 'rect' || tag === 'ellipse' || tag === 'polygon' || tag === 'path') {
                el.setAttribute('fill', fill);
            }
        });
        renderSelectionFields();
    }

    function syncAppearanceFromSelection() {
        const el = selectedElements.length === 1 ? selectedElements[0] : null;
        if (!el) return;
        const tag = el.tagName.toLowerCase();
        const stroke = tag === 'text' ? el.getAttribute('fill') : el.getAttribute('stroke');
        const strokeWidth = el.getAttribute('stroke-width');
        const fill = el.getAttribute('fill');
        const fontSize = el.getAttribute('font-size');
        if (stroke && /^#[0-9a-f]{6}$/i.test(stroke)) inputs.stroke.value = stroke;
        if (strokeWidth) inputs.strokeWidth.value = strokeWidth;
        if (fontSize) inputs.fontSize.value = fontSize;
        if (fill && fill !== 'none' && /^#[0-9a-f]{6}$/i.test(fill)) {
            inputs.fill.value = fill;
            inputs.fillEnabled.checked = true;
        } else if (tag !== 'text') {
            inputs.fillEnabled.checked = false;
        }
    }

    function setSelection(elements) {
        selectedElements.forEach((el) => el.classList.remove('symbol-selected'));
        selectedElements = Array.from(new Set((elements || []).filter(Boolean)));
        selected = selectedElements[0] || null;
        selectedElements.forEach((el) => el.classList.add('symbol-selected'));
        syncAppearanceFromSelection();
        renderSelectionFields();
    }

    function selectElement(el, additive = false) {
        const target = el && el.closest ? el.closest('.symbol-shape') : null;
        if (!target) {
            if (!additive) setSelection([]);
            return;
        }
        if (additive) {
            const next = selectedElements.includes(target)
                ? selectedElements.filter((item) => item !== target)
                : [...selectedElements, target];
            setSelection(next);
            return;
        }
        setSelection([target]);
    }

    function closeTextEditor(save = true) {
        if (!textEditor) return;
        const { input, el, originalText } = textEditor;
        if (save) {
            const next = input.value.trim();
            if (next) {
                el.textContent = next;
                setStatus('Texto atualizado.');
            } else {
                el.textContent = originalText;
                setStatus('Edicao de texto cancelada: o texto nao pode ficar vazio.');
            }
        } else {
            el.textContent = originalText;
            setStatus('Edicao de texto cancelada.');
        }
        input.remove();
        textEditor = null;
        renderSelectionFields();
    }

    function textScreenPoint(el) {
        const x = num(el.getAttribute('x'), 0);
        const y = num(el.getAttribute('y'), 0);
        const point = stage.createSVGPoint();
        point.x = x;
        point.y = y;
        return point.matrixTransform(stage.getScreenCTM());
    }

    function editTextElement(el) {
        if (!el || el.tagName.toLowerCase() !== 'text') return;
        closeTextEditor(true);
        selectElement(el);
        dragState = null;
        const screenPoint = textScreenPoint(el);
        const box = el.getBoundingClientRect();
        const input = document.createElement('input');
        const fontSize = Math.max(12, num(el.getAttribute('font-size'), 14) * (box.height ? box.height / num(el.getAttribute('font-size'), 14) : 1));
        input.className = 'svg-text-editor';
        input.type = 'text';
        input.value = el.textContent || '';
        input.style.left = `${screenPoint.x}px`;
        input.style.top = `${screenPoint.y}px`;
        input.style.minWidth = `${Math.max(48, box.width + 24)}px`;
        input.style.fontSize = `${fontSize}px`;
        document.body.appendChild(input);
        textEditor = { input, el, originalText: el.textContent || '' };
        input.addEventListener('keydown', (evt) => {
            if (evt.key === 'Enter') {
                evt.preventDefault();
                closeTextEditor(true);
            } else if (evt.key === 'Escape') {
                evt.preventDefault();
                closeTextEditor(false);
            }
        });
        input.addEventListener('blur', () => closeTextEditor(true));
        input.focus();
        input.select();
        setStatus('Editando texto. Enter salva, Esc cancela.');
    }

    function pointToSegmentDistance(point, start, end) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const lengthSquared = dx * dx + dy * dy;
        if (!lengthSquared) return Math.hypot(point.x - start.x, point.y - start.y);
        const ratio = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
        return Math.hypot(point.x - (start.x + ratio * dx), point.y - (start.y + ratio * dy));
    }

    function toScreenPoint(el, point) {
        const matrix = el.getScreenCTM?.();
        if (!matrix) return null;
        const svgPoint = stage.createSVGPoint();
        svgPoint.x = point.x;
        svgPoint.y = point.y;
        return svgPoint.matrixTransform(matrix);
    }

    function isPointerNearThinShape(evt, el, tolerance) {
        const pointer = { x: evt.clientX, y: evt.clientY };
        const tag = el.tagName.toLowerCase();
        if (tag === 'line') {
            const start = toScreenPoint(el, {
                x: num(el.getAttribute('x1'), 0),
                y: num(el.getAttribute('y1'), 0)
            });
            const end = toScreenPoint(el, {
                x: num(el.getAttribute('x2'), 0),
                y: num(el.getAttribute('y2'), 0)
            });
            return start && end && pointToSegmentDistance(pointer, start, end) <= tolerance;
        }
        if (tag === 'path' && el.getTotalLength && el.getPointAtLength) {
            const length = el.getTotalLength();
            const steps = Math.max(8, Math.min(80, Math.ceil(length / 3)));
            let previous = toScreenPoint(el, el.getPointAtLength(0));
            for (let index = 1; index <= steps; index += 1) {
                const current = toScreenPoint(el, el.getPointAtLength(length * index / steps));
                if (previous && current && pointToSegmentDistance(pointer, previous, current) <= tolerance) return true;
                previous = current;
            }
        }
        return false;
    }

    function findNearbyThinShape(evt, tolerance = 10) {
        const shapes = Array.from(layer.querySelectorAll('.symbol-shape')).reverse();
        return shapes.find((el) => {
            const tag = el.tagName.toLowerCase();
            if (tag !== 'line' && tag !== 'path') return false;
            return isPointerNearThinShape(evt, el, tolerance);
        }) || null;
    }

    function startSelectionDrag(evt, target) {
        if (!target) return;
        evt.preventDefault();
        evt.stopPropagation();

        if (evt.shiftKey) {
            selectElement(target, true);
        } else if (!selectedElements.includes(target)) {
            setSelection([target]);
        }

        const dragElements = selectedElements.slice();
        if (!dragElements.length) return;
        dragState = {
            point: pointerPoint(evt),
            elements: dragElements
        };
        target.setPointerCapture?.(evt.pointerId);
    }

    function getSelectionBBox() {
        const boxes = selectedElements.map(safeBBox).filter(Boolean);
        if (!boxes.length) return null;
        const x1 = Math.min(...boxes.map((box) => box.x));
        const y1 = Math.min(...boxes.map((box) => box.y));
        const x2 = Math.max(...boxes.map((box) => box.x + box.width));
        const y2 = Math.max(...boxes.map((box) => box.y + box.height));
        return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
    }

    function setTool(tool) {
        activeTool = tool;
        draft = null;
        polygonPoints = [];
        document.querySelectorAll('[data-tool]').forEach((button) => {
            button.classList.toggle('active', button.dataset.tool === tool);
        });
        document.body.classList.toggle('pan-tool-active', tool === 'pan');
        if (tool === 'polygon') {
            setStatus('Clique para criar pontos. Duplo clique finaliza.');
        } else if (tool === 'terminal') {
            setStatus('Clique para posicionar um borne. Arraste marcadores existentes para ajustar.');
        } else if (tool === 'pan') {
            setStatus('Arraste a area de desenho para navegar pela prancheta.');
        } else {
            setStatus('Ferramenta ativa: ' + tool + '.');
        }
    }

    function setShapeCommon(el) {
        el.classList.add('symbol-shape');
        el.addEventListener('pointerdown', onShapePointerDown);
        layer.appendChild(el);
        selectElement(el);
        return el;
    }

    function createDraft(tool, point) {
        const attrs = styleAttrs();
        if (tool === 'line') {
            return setShapeCommon(svgEl('line', { ...attrs, x1: point.x, y1: point.y, x2: point.x, y2: point.y }));
        }
        if (tool === 'arc' || tool === 'arc-v') {
            return setShapeCommon(svgEl('path', { ...attrs, d: `M ${point.x} ${point.y}` }));
        }
        if (tool === 'rect') {
            return setShapeCommon(svgEl('rect', { ...attrs, x: point.x, y: point.y, width: 0, height: 0 }));
        }
        if (tool === 'circle') {
            return setShapeCommon(svgEl('ellipse', { ...attrs, cx: point.x, cy: point.y, rx: 0, ry: 0 }));
        }
        return null;
    }

    function updateDraft(el, start, end) {
        if (!el) return;
        const tag = el.tagName.toLowerCase();
        if (tag === 'line') {
            el.setAttribute('x2', end.x);
            el.setAttribute('y2', end.y);
        } else if (tag === 'path' && activeTool === 'arc') {
            const x1 = Math.min(start.x, end.x);
            const x2 = Math.max(start.x, end.x);
            const y1 = Math.min(start.y, end.y);
            const y2 = Math.max(start.y, end.y);
            const cy = (y1 + y2) / 2;
            const rx = Math.max(0.01, (x2 - x1) / 2);
            const ry = Math.max(0.01, (y2 - y1) / 2);
            const sweep = end.y >= start.y ? 1 : 0;
            el.setAttribute('d', `M ${x1} ${cy} A ${rx} ${ry} 0 0 ${sweep} ${x2} ${cy}`);
        } else if (tag === 'path' && activeTool === 'arc-v') {
            const x1 = Math.min(start.x, end.x);
            const x2 = Math.max(start.x, end.x);
            const y1 = Math.min(start.y, end.y);
            const y2 = Math.max(start.y, end.y);
            const cx = (x1 + x2) / 2;
            const rx = Math.max(0.01, (x2 - x1) / 2);
            const ry = Math.max(0.01, (y2 - y1) / 2);
            const sweep = end.x >= start.x ? 0 : 1;
            el.setAttribute('d', `M ${cx} ${y1} A ${rx} ${ry} 0 0 ${sweep} ${cx} ${y2}`);
        } else if (tag === 'rect') {
            el.setAttribute('x', Math.min(start.x, end.x));
            el.setAttribute('y', Math.min(start.y, end.y));
            el.setAttribute('width', Math.abs(end.x - start.x));
            el.setAttribute('height', Math.abs(end.y - start.y));
        } else if (tag === 'ellipse') {
            el.setAttribute('cx', (start.x + end.x) / 2);
            el.setAttribute('cy', (start.y + end.y) / 2);
            el.setAttribute('rx', Math.abs(end.x - start.x) / 2);
            el.setAttribute('ry', Math.abs(end.y - start.y) / 2);
        }
        renderSelectionFields();
    }

    function onStagePointerDown(evt) {
        if (activeTool === 'pan' || evt.button === 1 || evt.ctrlKey) return;
        const point = pointerPoint(evt);
        if (activeTool === 'select') {
            if (evt.target === stage || evt.target === gridBg || evt.target === border) {
                const nearbyShape = findNearbyThinShape(evt);
                if (nearbyShape) {
                    startSelectionDrag(evt, nearbyShape);
                    return;
                }
                if (!evt.shiftKey) setSelection([]);
                selectDrag = {
                    start: point,
                    rect: svgEl('rect', {
                        class: 'selection-marquee',
                        x: point.x,
                        y: point.y,
                        width: 0,
                        height: 0
                    })
                };
                overlayLayer?.appendChild(selectDrag.rect);
            }
            return;
        }
        if (activeTool === 'reference') {
            referencePoint = point;
            renderReferencePoint();
            setStatus(`Ponto de referencia definido em X ${fmt(point.x)}, Y ${fmt(point.y)}.`);
            return;
        }
        if (activeTool === 'terminal') {
            addTerminalAt(point);
            return;
        }
        if (activeTool === 'text') {
            const content = window.prompt('Texto do simbolo:', 'A1');
            if (!content) return;
            const text = setShapeCommon(svgEl('text', { ...textAttrs(), x: point.x, y: point.y }));
            text.textContent = content;
            return;
        }
        if (activeTool === 'polygon') {
            polygonPoints.push(point);
            if (!draft) {
                draft = setShapeCommon(svgEl('polygon', { ...styleAttrs(), points: `${point.x},${point.y}` }));
            } else {
                draft.setAttribute('points', polygonPoints.map((p) => `${p.x},${p.y}`).join(' '));
            }
            setStatus(`${polygonPoints.length} ponto(s). Duplo clique finaliza.`);
            return;
        }
        draft = { el: createDraft(activeTool, point), start: point };
        stage.setPointerCapture(evt.pointerId);
    }

    function onStagePointerMove(evt) {
        if (selectDrag) {
            const point = pointerPoint(evt);
            selectDrag.rect.setAttribute('x', Math.min(selectDrag.start.x, point.x));
            selectDrag.rect.setAttribute('y', Math.min(selectDrag.start.y, point.y));
            selectDrag.rect.setAttribute('width', Math.abs(point.x - selectDrag.start.x));
            selectDrag.rect.setAttribute('height', Math.abs(point.y - selectDrag.start.y));
            return;
        }
        if (!draft || !draft.el) return;
        updateDraft(draft.el, draft.start, pointerPoint(evt));
    }

    function onStagePointerUp(evt) {
        if (selectDrag) {
            const point = pointerPoint(evt);
            const area = {
                x: Math.min(selectDrag.start.x, point.x),
                y: Math.min(selectDrag.start.y, point.y),
                width: Math.abs(point.x - selectDrag.start.x),
                height: Math.abs(point.y - selectDrag.start.y)
            };
            selectDrag.rect.remove();
            selectDrag = null;
            if (area.width >= 0.5 || area.height >= 0.5) {
                const hits = Array.from(layer.querySelectorAll('.symbol-shape')).filter((el) => {
                    const box = safeBBox(el);
                    if (!box) return false;
                    return box.x <= area.x + area.width &&
                        box.x + box.width >= area.x &&
                        box.y <= area.y + area.height &&
                        box.y + box.height >= area.y;
                });
                setSelection(evt.shiftKey ? [...selectedElements, ...hits] : hits);
            }
            return;
        }
        if (!draft || !draft.el || activeTool === 'polygon') return;
        stage.releasePointerCapture(evt.pointerId);
        const box = safeBBox(draft.el);
        if (!box || (box.width < 0.1 && box.height < 0.1)) draft.el.remove();
        draft = null;
    }

    function onStageDblClick(evt) {
        const textTarget = evt.target?.closest?.('text.symbol-shape');
        if (textTarget) {
            evt.preventDefault();
            editTextElement(textTarget);
            return;
        }
        if (activeTool !== 'polygon' || !draft) return;
        if (polygonPoints.length < 3) {
            draft.remove();
        }
        draft = null;
        polygonPoints = [];
        setStatus('Poligono finalizado. Ferramenta poligono continua ativa.');
    }

    function getTransformParts(el) {
        const transform = String(el.getAttribute('transform') || '');
        const translate = transform.match(/translate\(([-\d.]+)[ ,]([-\d.]+)\)/);
        const scale = transform.match(/scale\(([-\d.]+)\)/);
        return {
            x: translate ? Number(translate[1]) : 0,
            y: translate ? Number(translate[2]) : 0,
            scale: scale ? Number(scale[1]) : 1
        };
    }

    function setGroupTransform(el, x, y, scale) {
        const scaleText = scale !== 1 ? ` scale(${scale})` : '';
        el.setAttribute('transform', `translate(${snap(x)} ${snap(y)})${scaleText}`);
    }

    function moveTransformedElement(el, dx, dy) {
        const current = String(el.getAttribute('transform') || '').trim();
        const prefix = `translate(${fmt(snap(dx))} ${fmt(snap(dy))})`;
        el.setAttribute('transform', [prefix, current].filter(Boolean).join(' '));
    }

    function moveElement(el, dx, dy) {
        const tag = el.tagName.toLowerCase();
        if (el.hasAttribute('transform') && tag !== 'g') {
            moveTransformedElement(el, dx, dy);
            renderSelectionFields();
            return;
        }
        if (tag === 'line') {
            ['x1', 'x2'].forEach((key) => el.setAttribute(key, snap(num(el.getAttribute(key), 0) + dx)));
            ['y1', 'y2'].forEach((key) => el.setAttribute(key, snap(num(el.getAttribute(key), 0) + dy)));
        } else if (tag === 'rect') {
            el.setAttribute('x', snap(num(el.getAttribute('x'), 0) + dx));
            el.setAttribute('y', snap(num(el.getAttribute('y'), 0) + dy));
        } else if (tag === 'ellipse') {
            el.setAttribute('cx', snap(num(el.getAttribute('cx'), 0) + dx));
            el.setAttribute('cy', snap(num(el.getAttribute('cy'), 0) + dy));
        } else if (tag === 'polygon') {
            const points = String(el.getAttribute('points') || '').trim().split(/\s+/).map((pair) => {
                const [x, y] = pair.split(',').map(Number);
                return `${snap(x + dx)},${snap(y + dy)}`;
            });
            el.setAttribute('points', points.join(' '));
        } else if (tag === 'text') {
            el.setAttribute('x', snap(num(el.getAttribute('x'), 0) + dx));
            el.setAttribute('y', snap(num(el.getAttribute('y'), 0) + dy));
        } else if (tag === 'image') {
            el.setAttribute('x', snap(num(el.getAttribute('x'), 0) + dx));
            el.setAttribute('y', snap(num(el.getAttribute('y'), 0) + dy));
        } else if (tag === 'path') {
            const d = String(el.getAttribute('d') || '');
            const arc = d.match(/^M\s+([-\d.]+)\s+([-\d.]+)\s+A\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([01])\s+([01])\s+([-\d.]+)\s+([-\d.]+)$/);
            if (arc) {
                const [, x1, y1, rx, ry, rot, large, sweep, x2, y2] = arc;
                el.setAttribute(
                    'd',
                    `M ${fmt(snap(Number(x1) + dx))} ${fmt(snap(Number(y1) + dy))} A ${rx} ${ry} ${rot} ${large} ${sweep} ${fmt(snap(Number(x2) + dx))} ${fmt(snap(Number(y2) + dy))}`
                );
            }
        } else if (tag === 'g') {
            moveTransformedElement(el, dx, dy);
        }
        renderSelectionFields();
    }

    function onShapePointerDown(evt) {
        if (activeTool !== 'select') return;
        startSelectionDrag(evt, evt.currentTarget);
    }

    function onDocumentPointerMove(evt) {
        if (textEditor) return;
        if (terminalDrag) {
            updateTerminalPosition(terminalDrag.id, pointerPoint(evt));
            return;
        }
        if (!dragState) return;
        const next = pointerPoint(evt);
        const dx = next.x - dragState.point.x;
        const dy = next.y - dragState.point.y;
        if (dx || dy) {
            dragState.elements.forEach((el) => moveElement(el, dx, dy));
            dragState.point = next;
        }
    }

    function onDocumentPointerUp(evt) {
        if (terminalDrag) {
            const terminal = terminals.find(item => item.id === terminalDrag.id);
            try {
                evt.target?.releasePointerCapture?.(evt.pointerId);
            } catch (error) {
                // Pointer capture may already be gone after a quick click.
            }
            terminalDrag = null;
            if (terminal) setStatus(`Borne ${terminal.label} em X ${fmt(terminal.x)}, Y ${fmt(terminal.y)}.`);
            return;
        }
        if (!dragState) return;
        try {
            dragState.elements[0]?.releasePointerCapture?.(evt.pointerId);
        } catch (error) {
            // Pointer capture may already be gone after a quick click.
        }
        dragState = null;
    }

    function safeBBox(el) {
        try {
            return el.getBBox();
        } catch (error) {
            return null;
        }
    }

    function isRasterImageElement(el) {
        return !!el && el.tagName?.toLowerCase?.() === 'image';
    }

    function createSelectionField(label, value, options = {}) {
        const row = document.createElement('div');
        row.className = 'field-row';
        const span = document.createElement('span');
        span.textContent = label;
        const input = document.createElement('input');
        input.type = options.type || 'number';
        input.step = options.step || '0.25';
        if (options.min != null) input.min = String(options.min);
        input.value = options.format === false ? String(value) : Number(value).toFixed(2);
        input.readOnly = !!options.readonly;
        row.append(span, input);
        return { row, input };
    }

    function appendRasterResizeFields(wrap, imageEl) {
        const naturalWidth = Math.max(0.01, num(imageEl.dataset.naturalWidth, num(imageEl.getAttribute('width'), 1)));
        const naturalHeight = Math.max(0.01, num(imageEl.dataset.naturalHeight, num(imageEl.getAttribute('height'), 1)));
        const currentWidth = Math.max(0.01, num(imageEl.getAttribute('width'), naturalWidth));
        const currentHeight = Math.max(0.01, num(imageEl.getAttribute('height'), naturalHeight));
        const aspect = naturalHeight ? naturalWidth / naturalHeight : (currentWidth / currentHeight);

        const title = document.createElement('p');
        title.className = 'selection-subtitle';
        title.textContent = 'Redimensionar imagem';
        wrap.appendChild(title);

        const { row: widthRow, input: widthInput } = createSelectionField('Largura', currentWidth, { min: 0.01 });
        const { row: heightRow, input: heightInput } = createSelectionField('Altura', currentHeight, { min: 0.01 });
        wrap.append(widthRow, heightRow);

        const lockRow = document.createElement('label');
        lockRow.className = 'check-row selection-check-row';
        const lockInput = document.createElement('input');
        lockInput.type = 'checkbox';
        lockInput.checked = true;
        const lockText = document.createElement('span');
        lockText.textContent = 'Manter proporcao';
        lockRow.append(lockInput, lockText);
        wrap.appendChild(lockRow);

        const originalButton = document.createElement('button');
        originalButton.type = 'button';
        originalButton.className = 'ghost-btn selection-action-btn';
        originalButton.textContent = 'Tamanho original';
        wrap.appendChild(originalButton);

        const applySize = (source) => {
            let width = Math.max(0.01, num(widthInput.value, currentWidth));
            let height = Math.max(0.01, num(heightInput.value, currentHeight));
            if (lockInput.checked && aspect > 0) {
                if (source === 'width') {
                    height = width / aspect;
                    heightInput.value = Number(height).toFixed(2);
                } else if (source === 'height') {
                    width = height * aspect;
                    widthInput.value = Number(width).toFixed(2);
                }
            }
            imageEl.setAttribute('width', fmt(width));
            imageEl.setAttribute('height', fmt(height));
            setStatus(`Imagem redimensionada para ${fmt(width)} x ${fmt(height)}.`);
        };

        widthInput.addEventListener('input', () => applySize('width'));
        heightInput.addEventListener('input', () => applySize('height'));
        originalButton.addEventListener('click', () => {
            widthInput.value = Number(naturalWidth).toFixed(2);
            heightInput.value = Number(naturalHeight).toFixed(2);
            imageEl.setAttribute('width', fmt(naturalWidth));
            imageEl.setAttribute('height', fmt(naturalHeight));
            setStatus(`Imagem restaurada para ${fmt(naturalWidth)} x ${fmt(naturalHeight)}.`);
        });
    }

    function renderSelectionFields() {
        const wrap = document.getElementById('selection-fields');
        if (!selectedElements.length) {
            wrap.innerHTML = '<p>Nenhum elemento selecionado.</p>';
            return;
        }
        const box = getSelectionBBox() || { x: 0, y: 0, width: 0, height: 0 };
        wrap.innerHTML = '';
        if (selectedElements.length > 1) {
            const count = document.createElement('p');
            count.textContent = `${selectedElements.length} elementos selecionados.`;
            wrap.appendChild(count);
        }
        [
            ['X', box.x],
            ['Y', box.y],
            ['Largura', box.width],
            ['Altura', box.height]
        ].forEach(([label, value]) => {
            wrap.appendChild(createSelectionField(label, value, { readonly: true }).row);
        });
        if (selectedElements.length === 1 && isRasterImageElement(selectedElements[0])) {
            appendRasterResizeFields(wrap, selectedElements[0]);
        }
    }

    function sanitizeImported(svg) {
        svg.querySelectorAll('script, foreignObject').forEach((node) => node.remove());
        svg.querySelectorAll('*').forEach((node) => {
            [...node.attributes].forEach((attr) => {
                if (/^on/i.test(attr.name) || /^javascript:/i.test(attr.value) || /url\s*\(|data:/i.test(attr.value)) node.removeAttribute(attr.name);
            });
        });
    }

    function importSvgText(text) {
        const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
        const importedSvg = doc.querySelector('svg');
        if (!importedSvg || doc.querySelector('parsererror')) {
            setStatus('Arquivo SVG invalido.');
            return;
        }
        const ref = importedSvg.querySelector('metadata#simucir-reference-point');
        if (ref) {
            const x = Number(ref.getAttribute('data-x'));
            const y = Number(ref.getAttribute('data-y'));
            referencePoint = Number.isFinite(x) && Number.isFinite(y) ? snapPoint({ x, y }) : null;
            renderReferencePoint();
        } else {
            referencePoint = null;
            renderReferencePoint();
        }
        const terminalMeta = importedSvg.querySelector('metadata#simucir-terminals');
        if (terminalMeta) {
            try {
                const parsed = JSON.parse(terminalMeta.textContent || '[]');
                terminals = Array.isArray(parsed)
                    ? parsed
                        .filter(item => item && Number.isFinite(Number(item.x)) && Number.isFinite(Number(item.y)))
                        .map(item => ({
                            id: terminalId(),
                            label: normalizeTerminalLabel(item.label, terminalLabelSuggestion()),
                            x: snap(Number(item.x)),
                            y: snap(Number(item.y))
                        }))
                    : [];
            } catch (error) {
                terminals = [];
            }
        } else {
            terminals = [];
        }
        renderTerminals();
        sanitizeImported(importedSvg);
        const group = svgEl('g', {
            class: 'symbol-shape imported-symbol',
            fill: sanitizeImportedColor(importedSvg.getAttribute('fill'), 'none')
        });
        ['stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'vector-effect'].forEach((attr) => {
            const value = importedSvg.getAttribute(attr);
            if (value) group.setAttribute(attr, attr === 'stroke' ? sanitizeImportedColor(value, '#111827') : sanitizeImportedText(value, 60));
        });
        [...importedSvg.childNodes].forEach((node) => {
            if (node.nodeType === 1) {
                const el = node;
                if (el.tagName?.toLowerCase?.() === 'metadata' && (el.id === 'simucir-reference-point' || el.id === 'simucir-terminals')) return;
                group.appendChild(document.importNode(node, true));
            }
        });
        group.addEventListener('pointerdown', onShapePointerDown);
        layer.appendChild(group);
        setSelection([group]);
        setStatus('SVG importado sem redimensionar. Use Ajustar importado se precisar.');
    }

    function fitSelected() {
        if (!selectedElements.length) return;
        const box = getSelectionBBox();
        if (!box || !box.width || !box.height) return;
        const size = canvasSize();
        const padding = size.grid;
        const scale = Math.min((size.width - padding * 2) / box.width, (size.height - padding * 2) / box.height, 1);
        const tx = snap((size.width - box.width * scale) / 2 - box.x * scale);
        const ty = snap((size.height - box.height * scale) / 2 - box.y * scale);
        selectedElements.forEach((el) => {
            const current = String(el.getAttribute('transform') || '').trim();
            el.setAttribute('transform', `translate(${tx} ${ty}) scale(${scale}) ${current}`.trim());
        });
        renderSelectionFields();
    }

    function centerSelected() {
        if (!selectedElements.length) return;
        const box = getSelectionBBox();
        if (!box) return;
        const size = canvasSize();
        const dx = (size.width / 2) - (box.x + box.width / 2);
        const dy = (size.height / 2) - (box.y + box.height / 2);
        selectedElements.forEach((el) => moveElement(el, dx, dy));
    }

    function duplicateSelected() {
        if (!selectedElements.length) return;
        const clones = selectedElements.map((el) => {
            const clone = el.cloneNode(true);
            clone.classList.remove('symbol-selected');
            clone.addEventListener('pointerdown', onShapePointerDown);
            layer.appendChild(clone);
            moveElement(clone, canvasSize().grid, canvasSize().grid);
            return clone;
        });
        setSelection(clones);
    }

    function rotateSelected() {
        if (!selectedElements.length) return;
        const box = getSelectionBBox();
        if (!box) return;
        const cx = box.x + box.width / 2;
        const cy = box.y + box.height / 2;
        selectedElements.forEach((el) => {
            const tag = el.tagName.toLowerCase();
            if (tag === 'line') {
                const x1 = num(el.getAttribute('x1'), 0);
                const y1 = num(el.getAttribute('y1'), 0);
                const x2 = num(el.getAttribute('x2'), 0);
                const y2 = num(el.getAttribute('y2'), 0);
                el.setAttribute('x1', fmt(snap(cx - (y1 - cy))));
                el.setAttribute('y1', fmt(snap(cy + (x1 - cx))));
                el.setAttribute('x2', fmt(snap(cx - (y2 - cy))));
                el.setAttribute('y2', fmt(snap(cy + (x2 - cx))));
            } else {
                const current = String(el.getAttribute('transform') || '').trim();
                el.setAttribute('transform', `${current} rotate(90 ${fmt(cx)} ${fmt(cy)})`.trim());
            }
        });
        renderSelectionFields();
        setStatus('Selecao girada 90 graus.');
    }

    function cleanForExport(svg) {
        svg.querySelectorAll('#grid-bg,#symbol-border,defs').forEach((node) => node.remove());
        svg.querySelectorAll('.symbol-selected').forEach((node) => node.classList.remove('symbol-selected'));
        svg.querySelectorAll('[class]').forEach((node) => {
            const value = String(node.getAttribute('class') || '').replace(/\bsymbol-shape\b|\bimported-symbol\b|\bimported-raster\b/g, '').trim();
            if (value) node.setAttribute('class', value);
            else node.removeAttribute('class');
        });
        svg.querySelectorAll('*').forEach((node) => {
            node.removeAttribute('filter');
        });
    }

    function buildExportSvg() {
        const size = canvasSize();
        const exportSvg = svgEl('svg', {
            width: size.width,
            height: size.height,
            viewBox: `0 0 ${size.width} ${size.height}`,
            fill: 'none',
            xmlns: NS,
            'xmlns:xlink': XLINK_NS
        });
        if (referencePoint) {
            exportSvg.appendChild(svgEl('metadata', {
                id: 'simucir-reference-point',
                'data-x': fmt(referencePoint.x),
                'data-y': fmt(referencePoint.y),
                'data-purpose': 'grid-alignment'
            }));
        }
        if (terminals.length) {
            const terminalMetadata = svgEl('metadata', {
                id: 'simucir-terminals',
                'data-purpose': 'component-terminals'
            });
            terminalMetadata.textContent = JSON.stringify(terminals.map(item => ({
                label: item.label,
                x: Number(fmt(item.x)),
                y: Number(fmt(item.y))
            })));
            exportSvg.appendChild(terminalMetadata);
        }
        [...layer.childNodes].forEach((node) => exportSvg.appendChild(node.cloneNode(true)));
        cleanForExport(exportSvg);
        return '<?xml version="1.0" encoding="utf-8"?>\n' + new XMLSerializer().serializeToString(exportSvg) + '\n';
    }

    function canvasToBlob(canvas, mimeType, quality) {
        return new Promise((resolve) => canvas.toBlob(resolve, mimeType, quality));
    }

    function downloadBlob(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 0);
    }

    async function buildExportWebpBlob() {
        const size = canvasSize();
        const svgText = buildExportSvg();
        const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        try {
            const image = await loadImage(url);
            const scale = Math.max(1, Math.min(8, Math.ceil(num(inputs.zoom.value, 520) / 100)));
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(size.width * scale));
            canvas.height = Math.max(1, Math.round(size.height * scale));
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            const output = await canvasToBlob(canvas, 'image/webp', 0.92);
            if (!output) throw new Error('WebP indisponivel neste navegador.');
            return output;
        } finally {
            URL.revokeObjectURL(url);
        }
    }

    function projectData() {
        return {
            format: 'simucir-symbol-project',
            simulatorSlug: 'gerador_simbologia',
            savedAt: new Date().toISOString(),
            version: 1,
            canvas: {
                width: num(inputs.width.value, DEFAULT_CANVAS.width),
                height: num(inputs.height.value, DEFAULT_CANVAS.height),
                grid: num(inputs.grid.value, DEFAULT_CANVAS.grid),
                zoom: num(inputs.zoom.value, 520),
                snapDivision: num(inputs.snapDivision?.value, 4),
                snap: !!inputs.snap.checked
            },
            appearance: {
                stroke: inputs.stroke.value,
                fill: inputs.fill.value,
                strokeWidth: num(inputs.strokeWidth.value, 2),
                fontSize: num(inputs.fontSize.value, 14),
                fillEnabled: !!inputs.fillEnabled.checked
            },
            referencePoint,
            terminals: terminals.map(item => ({
                id: item.id,
                label: item.label,
                x: item.x,
                y: item.y
            })),
            drawing: new XMLSerializer().serializeToString(layer)
        };
    }

    function applyProjectData(data) {
        if (!data || typeof data !== 'object' || (data.format && data.format !== 'simucir-symbol-project')) {
            setStatus('Modelo editavel invalido.');
            return;
        }
        if (window.SimuDzProjectFiles) {
            try {
                window.SimuDzProjectFiles.assertCompatible(data, 'gerador_simbologia');
            } catch (error) {
                const message = error?.message || 'Este arquivo pertence a outro simulador.';
                window.SimuDzProjectFiles.showWarning(message);
                window.alert(message);
                setStatus(message);
                return;
            }
        }
        const canvas = data.canvas || {};
        inputs.preset.value = 'custom';
        inputs.width.value = canvas.width || DEFAULT_CANVAS.width;
        inputs.height.value = canvas.height || DEFAULT_CANVAS.height;
        inputs.grid.value = canvas.grid || DEFAULT_CANVAS.grid;
        inputs.zoom.value = canvas.zoom || 520;
        if (inputs.snapDivision) inputs.snapDivision.value = String(canvas.snapDivision || 4);
        inputs.snap.checked = canvas.snap !== false;

        const appearance = data.appearance || {};
        if (appearance.stroke) inputs.stroke.value = appearance.stroke;
        if (appearance.fill) inputs.fill.value = appearance.fill;
        inputs.strokeWidth.value = appearance.strokeWidth || 2;
        inputs.fontSize.value = appearance.fontSize || 14;
        inputs.fillEnabled.checked = !!appearance.fillEnabled;

        const doc = new DOMParser().parseFromString(String(data.drawing || '<g></g>'), 'image/svg+xml');
        const importedLayer = doc.querySelector('g');
        layer.innerHTML = '';
        if (importedLayer && !doc.querySelector('parsererror')) {
            [...importedLayer.childNodes].forEach((node) => {
                if (node.nodeType !== 1) return;
                const clone = document.importNode(node, true);
                clone.classList.add('symbol-shape');
                clone.classList.remove('symbol-selected');
                clone.addEventListener('pointerdown', onShapePointerDown);
                layer.appendChild(clone);
            });
        }

        referencePoint = data.referencePoint && Number.isFinite(Number(data.referencePoint.x)) && Number.isFinite(Number(data.referencePoint.y))
            ? { x: Number(data.referencePoint.x), y: Number(data.referencePoint.y) }
            : null;
        terminals = Array.isArray(data.terminals)
            ? data.terminals
                .filter(item => item && Number.isFinite(Number(item.x)) && Number.isFinite(Number(item.y)))
                .map(item => ({
                    id: String(item.id || terminalId()),
                    label: normalizeTerminalLabel(item.label, terminalLabelSuggestion()),
                    x: Number(item.x),
                    y: Number(item.y)
                }))
            : [];
        applyCanvas();
        renderReferencePoint();
        renderTerminals();
        setSelection([]);
        setStatus('Modelo editavel carregado.');
    }

    async function saveProject() {
        const suggestedName = window.SimuDzProjectFiles
            ? window.SimuDzProjectFiles.fileName('json', 'gerador_simbologia')
            : 'simucir_modelo_simbologia.json';
        const text = JSON.stringify(projectData(), null, 2);
        if ('showSaveFilePicker' in window) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName,
                    types: [{ description: 'Modelo SimuDz', accept: { 'application/json': ['.json'] } }]
                });
                const writable = await handle.createWritable();
                await writable.write(text);
                await writable.close();
                setStatus('Modelo editavel salvo.');
                return;
            } catch (error) {
                if (error && error.name === 'AbortError') return;
            }
        }
        const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = suggestedName;
        link.click();
        URL.revokeObjectURL(url);
        setStatus('Modelo editavel exportado por download.');
    }

    async function saveSvg() {
        const suggestedName = 'simucir_simbolo.svg';
        const text = buildExportSvg();
        const blob = new Blob([text], { type: 'image/svg+xml;charset=utf-8' });
        downloadBlob(blob, suggestedName);
        setStatus('SVG gerado para download.');
    }

    async function saveWebp() {
        const suggestedName = 'simucir_simbolo.webp';
        try {
            const blob = await buildExportWebpBlob();
            downloadBlob(blob, suggestedName);
            setStatus('WebP gerado para download.');
        } catch (error) {
            setStatus('Nao foi possivel gerar o WebP.');
        }
    }

    async function importRasterImageFile(file) {
        if (!file || !(/^image\/(png|webp)$/i.test(file.type || '') || /\.(png|webp)$/i.test(file.name || ''))) {
            setStatus('Selecione uma imagem PNG ou WebP valida.');
            return;
        }
        try {
            const dataUrl = await readFileAsDataUrl(file);
            const image = await loadImage(dataUrl);
            const size = canvasSize();
            const padding = Math.max(0, size.grid / 2);
            const maxWidth = Math.max(1, size.width - padding * 2);
            const maxHeight = Math.max(1, size.height - padding * 2);
            const scale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight, 1);
            const width = image.naturalWidth * scale;
            const height = image.naturalHeight * scale;
            const x = snap((size.width - width) / 2);
            const y = snap((size.height - height) / 2);
            const imported = svgEl('image', {
                class: 'symbol-shape imported-raster',
                x: fmt(x),
                y: fmt(y),
                width: fmt(width),
                height: fmt(height),
                preserveAspectRatio: 'xMidYMid meet',
                href: dataUrl
            });
            imported.dataset.naturalWidth = fmt(image.naturalWidth);
            imported.dataset.naturalHeight = fmt(image.naturalHeight);
            imported.setAttributeNS(XLINK_NS, 'xlink:href', dataUrl);
            imported.addEventListener('pointerdown', onShapePointerDown);
            layer.appendChild(imported);
            setSelection([imported]);
            setStatus('Imagem importada. Use Selecionar para mover ou Ajustar importado para centralizar.');
        } catch (error) {
            setStatus('Nao foi possivel importar a imagem.');
        }
    }

    function newSymbol() {
        if ((layer.childElementCount || terminals.length) && !window.confirm('Limpar o desenho atual?')) return;
        layer.innerHTML = '';
        referencePoint = null;
        terminals = [];
        renderReferencePoint();
        renderTerminals();
        setSelection([]);
        setStatus('Novo simbolo pronto.');
    }

    function beginPanDrag(evt) {
        if (!stageWrap) return;
        if (activeTool !== 'pan' && evt.button !== 1 && !evt.ctrlKey) return;
        evt.preventDefault();
        closeTextEditor(true);
        panDrag = {
            startX: evt.clientX,
            startY: evt.clientY,
            scrollLeft: stageWrap.scrollLeft,
            scrollTop: stageWrap.scrollTop
        };
        stageWrap.classList.add('is-panning');
        stageWrap.setPointerCapture?.(evt.pointerId);
    }

    function movePanDrag(evt) {
        if (!panDrag || !stageWrap) return;
        evt.preventDefault();
        stageWrap.scrollLeft = panDrag.scrollLeft - (evt.clientX - panDrag.startX);
        stageWrap.scrollTop = panDrag.scrollTop - (evt.clientY - panDrag.startY);
    }

    function endPanDrag(evt) {
        if (!panDrag || !stageWrap) return;
        try {
            stageWrap.releasePointerCapture?.(evt.pointerId);
        } catch (error) {
            // Pointer capture may already be released by the browser.
        }
        panDrag = null;
        stageWrap.classList.remove('is-panning');
    }

    document.querySelectorAll('[data-tool]').forEach((button) => {
        button.addEventListener('click', () => setTool(button.dataset.tool));
    });

    document.querySelectorAll('.swatches button').forEach((button) => {
        button.addEventListener('click', () => {
            inputs.stroke.value = button.dataset.color;
            applyAppearanceToSelection();
        });
    });

    [inputs.stroke, inputs.fill, inputs.strokeWidth, inputs.fontSize, inputs.fillEnabled].forEach((input) => {
        input.addEventListener('input', applyAppearanceToSelection);
        input.addEventListener('change', applyAppearanceToSelection);
    });

    inputs.preset.addEventListener('change', () => {
        if (inputs.preset.value !== 'custom') {
            const [w, h, g] = inputs.preset.value.split(',');
            inputs.width.value = w;
            inputs.height.value = h;
            inputs.grid.value = g;
        }
        applyCanvas();
    });

    [inputs.width, inputs.height, inputs.grid, inputs.zoom, inputs.snapDivision].forEach((input) => {
        const syncCanvasSettings = () => {
            inputs.preset.value = 'custom';
            applyCanvas();
        };
        input.addEventListener('input', syncCanvasSettings);
        input.addEventListener('change', syncCanvasSettings);
    });

    document.getElementById('zoom-out').addEventListener('click', () => bumpZoom(-10));
    document.getElementById('zoom-in').addEventListener('click', () => bumpZoom(10));
    stageWrap?.addEventListener('wheel', (evt) => {
        if (!evt.ctrlKey) return;
        evt.preventDefault();
        bumpZoom(evt.deltaY > 0 ? -10 : 10);
    }, { passive: false });
    stageWrap?.addEventListener('pointerdown', beginPanDrag);
    stageWrap?.addEventListener('pointermove', movePanDrag);
    stageWrap?.addEventListener('pointerup', endPanDrag);
    stageWrap?.addEventListener('pointercancel', endPanDrag);

    stage.addEventListener('pointerdown', onStagePointerDown);
    stage.addEventListener('pointermove', onStagePointerMove);
    stage.addEventListener('pointerup', onStagePointerUp);
    stage.addEventListener('dblclick', onStageDblClick);
    document.addEventListener('pointermove', onDocumentPointerMove);
    document.addEventListener('pointerup', onDocumentPointerUp);

    document.getElementById('open-svg').addEventListener('click', () => document.getElementById('svg-file-input').click());
    document.getElementById('open-image').addEventListener('click', () => document.getElementById('image-file-input').click());
    document.getElementById('open-project').addEventListener('click', () => document.getElementById('project-file-input').click());
    document.getElementById('project-file-input').addEventListener('change', (evt) => {
        const file = evt.target.files && evt.target.files[0];
        if (!file) return;
        file.text().then((text) => {
            try {
                applyProjectData(JSON.parse(text));
            } catch (error) {
                setStatus('Nao foi possivel abrir o modelo editavel.');
            }
        });
        evt.target.value = '';
    });
    document.getElementById('svg-file-input').addEventListener('change', (evt) => {
        const file = evt.target.files && evt.target.files[0];
        if (!file) return;
        file.text().then(importSvgText);
        evt.target.value = '';
    });
    document.getElementById('image-file-input').addEventListener('change', (evt) => {
        const file = evt.target.files && evt.target.files[0];
        if (!file) return;
        importRasterImageFile(file);
        evt.target.value = '';
    });
    document.getElementById('save-project').addEventListener('click', saveProject);
    document.getElementById('save-svg').addEventListener('click', saveSvg);
    document.getElementById('save-webp').addEventListener('click', saveWebp);
    document.getElementById('new-symbol').addEventListener('click', newSymbol);
    document.getElementById('delete-selected').addEventListener('click', () => {
        if (!selectedElements.length) return;
        selectedElements.forEach((el) => el.remove());
        setSelection([]);
    });
    document.getElementById('duplicate-selected').addEventListener('click', duplicateSelected);
    document.getElementById('rotate-selected').addEventListener('click', rotateSelected);
    document.getElementById('bring-front').addEventListener('click', () => selectedElements.forEach((el) => layer.appendChild(el)));
    document.getElementById('send-back').addEventListener('click', () => selectedElements.slice().reverse().forEach((el) => layer.insertBefore(el, layer.firstChild)));
    document.getElementById('fit-import').addEventListener('click', fitSelected);
    document.getElementById('center-selected').addEventListener('click', centerSelected);

    document.addEventListener('keydown', (evt) => {
        if (/input|select/i.test(document.activeElement.tagName)) return;
        if ((evt.key === 'Delete' || evt.key === 'Backspace') && selectedElements.length) {
            selectedElements.forEach((el) => el.remove());
            setSelection([]);
        }
        if ((evt.key === 'r' || evt.key === 'R') && selectedElements.length) rotateSelected();
        if (evt.key === 'Escape') setTool('select');
    });

    applyCanvas();
})();
