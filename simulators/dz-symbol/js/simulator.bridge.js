// =====================================================
// BRIDGE DE COMPATIBILIDADE - HTML ORIGINAL
// =====================================================

// ===============================
// FERRAMENTAS
// ===============================
window.setFerramenta = function (nome) {
    if (typeof ativarFerramenta === 'function') {
        ativarFerramenta(nome);
    }

    // estado visual (HTML original)
    document.querySelectorAll('.btn-tool').forEach(b => {
        b.classList.remove('ativo');
    });

    const btn =
        document.getElementById(`btn-${nome}`) ||
        document.getElementById(`btn-${nome === 'fio' ? 'wire' : nome}`);

    if (btn) btn.classList.add('ativo');
};

// ===============================
// EXPORTACAO SOB DEMANDA
// ===============================
const SimuDz_EXPORT_LIB_URLS = {
    html2canvas: 'vendor/html2canvas/html2canvas-1.4.1.min.js',
    jspdf: 'vendor/jspdf/jspdf-4.2.1.umd.min.js'
};

let simucirExportLibsPromise = null;

function loadSimuDzExternalScript(src, testFn) {
    if (typeof testFn === 'function' && testFn()) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const existing = Array.from(document.querySelectorAll('script[data-simucir-external-lib]'))
            .find(node => String(node.getAttribute('src') || '').trim() === src);

        if (existing) {
            if (typeof testFn === 'function' && testFn()) {
                resolve();
                return;
            }
            existing.addEventListener('load', () => resolve(), { once: true });
            existing.addEventListener('error', () => reject(new Error(`Falha ao carregar biblioteca externa: ${src}`)), { once: true });
            return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.defer = true;
        script.dataset.simucirExternalLib = 'true';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Falha ao carregar biblioteca externa: ${src}`));
        document.head.appendChild(script);
    });
}

function ensureSimuDzExportLibraries(opts = {}) {
    const needHtml2Canvas = opts.html2canvas !== false;
    const needJsPdf = !!opts.jspdf;

    if (!needHtml2Canvas && !needJsPdf) {
        return Promise.resolve();
    }

    if (simucirExportLibsPromise) {
        return simucirExportLibsPromise;
    }

    const tasks = [];
    if (needHtml2Canvas) {
        tasks.push(loadSimuDzExternalScript(
            SimuDz_EXPORT_LIB_URLS.html2canvas,
            () => typeof window.html2canvas === 'function'
        ));
    }
    if (needJsPdf) {
        tasks.push(loadSimuDzExternalScript(
            SimuDz_EXPORT_LIB_URLS.jspdf,
            () => typeof window.jspdf?.jsPDF === 'function'
        ));
    }

    simucirExportLibsPromise = Promise.all(tasks)
        .catch((err) => {
            simucirExportLibsPromise = null;
            throw err;
        })
        .then(() => undefined);

    return simucirExportLibsPromise;
}

// ===============================
// INFO - MODAL ORIGINAL
// ===============================
const INFO_COMPONENT_PAIRS = {
    iec_fonte_trifasica_nt: 'real_fonte_trifasica_nt',
    real_fonte_trifasica_nt: 'iec_fonte_trifasica_nt',
    iec_lampada: 'real_sinaleiro',
    real_sinaleiro: 'iec_lampada',
    iec_bobina_contator: 'real_contator',
    real_contator: 'iec_bobina_contator',
    iec_bobina_temp: 'real_temporizador',
    real_temporizador: 'iec_bobina_temp',
    iec_botao_na: 'real_botoeira_verde',
    real_botoeira_verde: 'iec_botao_na',
    iec_botao_nf: 'real_botoeira_vermelha',
    real_botoeira_vermelha: 'iec_botao_nf',
    iec_botoeira_emergencia_nf: 'real_botoeira_emergencia',
    iec_botoeira_emergencia_na: 'real_botoeira_emergencia',
    real_botoeira_emergencia: 'iec_botoeira_emergencia_nf',
    iec_contator_forca: 'real_contator_forca',
    real_contator_forca: 'iec_contator_forca',
    iec_rele_termico: 'real_rele_termico',
    real_rele_termico: 'iec_rele_termico',
    iec_contato_rele_term_na: 'real_rele_termico',
    iec_contato_rele_term_nf: 'real_rele_termico',
    iec_contato_temp_na: 'real_temporizador',
    iec_contato_temp_nf: 'real_temporizador',
    iec_contato_na: 'real_contato_auxiliar',
    iec_contato_nf: 'real_contato_auxiliar',
    real_contato_auxiliar: 'iec_contato_na',
    iec_disjuntor_monopolar: 'real_disjuntor_monopolar',
    real_disjuntor_monopolar: 'iec_disjuntor_monopolar',
    iec_disjuntor_bipolar: 'real_disjuntor_bipolar',
    real_disjuntor_bipolar: 'iec_disjuntor_bipolar',
    iec_disjuntor_motor: 'real_disjuntor_motor',
    real_disjuntor_motor: 'iec_disjuntor_motor',
    iec_motor_tripolar: 'real_motor_3_ligacoes',
    real_motor_3_ligacoes: 'iec_motor_tripolar',
    iec_motor_6_pontas: 'real_motor_6_ligacoes',
    real_motor_6_ligacoes: 'iec_motor_6_pontas',
    iec_chave_seletora_na: 'real_chave_seletora',
    iec_chave_seletora_nf: 'real_chave_seletora',
    real_chave_seletora: 'iec_chave_seletora_na'
};

function isRealLib(libKey) {
    return String(libKey || '').trim().toLowerCase().startsWith('real_');
}

function getInfoPairLibKey(libKey) {
    return INFO_COMPONENT_PAIRS[String(libKey || '').trim()] || '';
}

function getInfoPreviewCandidates(libKey, def) {
    const base = `./componentes/${libKey}`;
    const list = [];
    if (def?.foto) list.push(def.foto);
    if (def?.img) list.push(def.img);
    list.push(`${base}/info.webp`, `${base}/info.png`, `${base}/info.svg`);
    return [...new Set(list.filter(Boolean))];
}

function loadInfoPreview(previewImgEl, placeholderEl, libKey, def) {
    if (!previewImgEl || !placeholderEl) return;
    const paths = getInfoPreviewCandidates(libKey, def);
    previewImgEl.style.display = 'none';
    previewImgEl.removeAttribute('src');
    placeholderEl.style.display = 'flex';
    placeholderEl.textContent = 'Imagem n?o dispon?vel';

    const tryPath = (idx = 0) => {
        if (idx >= paths.length) return;
        previewImgEl.onload = () => {
            previewImgEl.style.display = 'block';
            placeholderEl.style.display = 'none';
        };
        previewImgEl.onerror = () => tryPath(idx + 1);
        previewImgEl.src = paths[idx];
    };
    tryPath(0);
}

window.abrirModalInfo = function (libKey) {
    const fonte = (typeof BIBLIOTECA !== 'undefined') ? BIBLIOTECA : window.BIBLIOTECA;
    const def = fonte?.[libKey];
    if (!def) return;

    document.getElementById('info-title').innerText = def.nome || '';
    document.getElementById('info-type').innerText = def.cat || '';

    const descEl = document.getElementById('info-desc');
    if (def.desc) {
        descEl.innerText = def.desc;
    } else {
        const pathTxt = `./componentes/${libKey}/descricao.txt`;
        fetch(pathTxt)
            .then(r => (r.ok ? r.text() : ''))
            .then(t => { descEl.innerText = t || ''; })
            .catch(() => { descEl.innerText = ''; });
    }

    const symbolicLib = isRealLib(libKey) ? getInfoPairLibKey(libKey) : libKey;
    const realLib = isRealLib(libKey) ? libKey : getInfoPairLibKey(libKey);
    const symbolicDef = symbolicLib ? fonte?.[symbolicLib] : null;
    const realDef = realLib ? fonte?.[realLib] : null;

    const symbolicCard = document.getElementById('info-symbolic-card');
    const realCard = document.getElementById('info-real-card');
    const symbolicName = document.getElementById('info-symbolic-name');
    const realName = document.getElementById('info-real-name');
    const symbolicImg = document.getElementById('info-symbolic-img');
    const realImg = document.getElementById('info-real-img');
    const symbolicPlaceholder = document.getElementById('info-symbolic-placeholder');
    const realPlaceholder = document.getElementById('info-real-placeholder');

    if (symbolicCard && symbolicName && symbolicImg && symbolicPlaceholder) {
        symbolicCard.style.display = 'flex';
        symbolicName.innerText = symbolicDef?.nome || 'Simbologia n?o dispon?vel';
        if (symbolicDef && symbolicLib) {
            loadInfoPreview(symbolicImg, symbolicPlaceholder, symbolicLib, symbolicDef);
        } else {
            symbolicImg.style.display = 'none';
            symbolicImg.removeAttribute('src');
            symbolicPlaceholder.style.display = 'flex';
            symbolicPlaceholder.textContent = 'Simbologia n?o dispon?vel';
        }
    }

    if (realCard && realName && realImg && realPlaceholder) {
        realCard.style.display = 'flex';
        realName.innerText = realDef?.nome || 'Componente real n?o dispon?vel';
        if (realDef && realLib) {
            loadInfoPreview(realImg, realPlaceholder, realLib, realDef);
        } else {
            realImg.style.display = 'none';
            realImg.removeAttribute('src');
            realPlaceholder.style.display = 'flex';
            realPlaceholder.textContent = 'Componente real n?o dispon?vel';
        }
    }

    document.getElementById('info-modal').style.display = 'flex';
};

window.fecharModalInfo = function () {
    document.getElementById('info-modal').style.display = 'none';
};

// ===============================
// SALVAR / EXPORTAR
// ===============================
function parsePolylinePoints(pointsAttr) {
    const raw = String(pointsAttr || '').trim();
    if (!raw) return [];
    return raw
        .split(/\s+/)
        .map(pair => pair.split(',').map(Number))
        .filter(pair => pair.length === 2 && Number.isFinite(pair[0]) && Number.isFinite(pair[1]))
        .map(([x, y]) => ({ x, y }));
}

function getWireObjectsForMode(mode) {
    const lists = [];
    if (typeof wiresByMode !== 'undefined' && wiresByMode && Array.isArray(wiresByMode[mode])) {
        lists.push(wiresByMode[mode]);
    }
    if (typeof listaFios !== 'undefined' && Array.isArray(listaFios)) {
        lists.push(listaFios);
    }
    const seen = new Set();
    const out = [];
    lists.forEach(list => {
        list.forEach(wireObj => {
            if (!wireObj?.element || seen.has(wireObj.element)) return;
            seen.add(wireObj.element);
            out.push(wireObj);
        });
    });
    return out;
}

function isSimulationWireVisualColor(color) {
    const txt = String(color || '').trim().toLowerCase().replace(/\s+/g, '');
    return txt === '#7f8c8d'
        || txt === '#ff0000'
        || txt === 'rgb(127,140,141)'
        || txt === 'rgb(255,0,0)'
        || txt === 'rgba(127,140,141,1)'
        || txt === 'rgba(255,0,0,1)';
}
function sanitizeConfiguredWireColor(color, fallback = '#b71c1c') {
    const txt = String(color || '').trim();
    if (!txt) return fallback;
    if (txt.length > 64) return fallback;
    if (/url\s*\(|javascript:|data:|expression\s*\(/i.test(txt)) return fallback;
    if (isSimulationWireVisualColor(txt)) return fallback;
    return txt;
}
function getPersistedWireBaseColor(wireObj, poly, fallback = '#b71c1c') {
    const candidates = [
        wireObj?.configColor,
        wireObj?.baseColor,
        wireObj?.colorOriginal,
        wireObj?.element?.dataset?.configColor,
        wireObj?.element?.dataset?.originalColor,
        poly?.dataset?.configColor,
        poly?.dataset?.originalColor
    ];
    for (const candidate of candidates) {
        const color = sanitizeConfiguredWireColor(candidate, '');
        if (color) return color;
    }
    const liveStroke = String(poly?.style?.stroke || '').trim();
    if (liveStroke && !isSimulationWireVisualColor(liveStroke)) return liveStroke;
    return fallback;
}
function restoreConfiguredWireColorsForMode(mode) {
    const normalizedMode = mode === '2d' ? '2d' : 'simbologia';
    const workspace = document.querySelector(`.mode-workspace[data-mode="${normalizedMode}"]`);
    const wireLayer = workspace?.querySelector('.mode-wire-layer');
    if (!wireLayer) return;
    const wireLookup = new Map();
    getWireObjectsForMode(normalizedMode).forEach(wireObj => {
        if (wireObj?.element) wireLookup.set(wireObj.element, wireObj);
    });
    wireLayer.querySelectorAll('polyline.user-wire').forEach(poly => {
        const wireObj = wireLookup.get(poly) || null;
        const baseColor = getPersistedWireBaseColor(wireObj, poly, '#b71c1c');
        if (wireObj && typeof window.clearWireSimulationColor === 'function') {
            window.clearWireSimulationColor(wireObj);
        } else if (wireObj) {
            delete wireObj.simulationColor;
        }
        delete poly.dataset.simulationColor;
        poly.style.stroke = baseColor;
        poly.dataset.originalColor = baseColor;
        poly.dataset.configColor = baseColor;
        if (wireObj) {
            wireObj.colorOriginal = baseColor;
            wireObj.baseColor = baseColor;
            wireObj.configColor = baseColor;
            if (typeof window.syncWireRenderAppearanceFromState === 'function') {
                window.syncWireRenderAppearanceFromState(wireObj);
            }
        }
    });
    if (typeof window.syncAllWireRenderAppearances === 'function') {
        setTimeout(window.syncAllWireRenderAppearances, 0);
        setTimeout(window.syncAllWireRenderAppearances, 80);
    }
}
function restoreConfiguredWireColors() {
    restoreConfiguredWireColorsForMode('simbologia');
    restoreConfiguredWireColorsForMode('2d');
}
window.restoreConfiguredWireColors = restoreConfiguredWireColors;
function getWorkspaceState(mode) {
    const workspace = document.querySelector(`.mode-workspace[data-mode="${mode}"]`);
    if (!workspace) return { componentes: [], fios: [], desenhos: [] };

    const bancada = workspace.querySelector('.mode-bancada');
    const drawingBackgroundLayer = workspace.querySelector('.mode-drawing-background-layer');
    const wireLayer = workspace.querySelector('.mode-wire-layer');
    const panelDrawingLayer = workspace.querySelector('.mode-panel-drawing-layer');
    const wireTopLayer = workspace.querySelector('.mode-wire-top-layer');

    const componentes = Array.from(bancada?.querySelectorAll('.component') || []).map(c => {
        const timerLabel = c.querySelector('.timer-label');
        const timerSeconds = timerLabel ? parseFloat(timerLabel.dataset.timerSeconds || '') : NaN;
        const pinLabels = Array.from(c.querySelectorAll('.pin-label')).map(label => String(label.innerText || '').trim());
        const crossRefCoilDx = parseFloat(c?.dataset?.crossRefCoilDx || '');
        const crossRefCoilDy = parseFloat(c?.dataset?.crossRefCoilDy || '');
        const crossRefContactDx = parseFloat(c?.dataset?.crossRefContactDx || '');
        const crossRefContactDy = parseFloat(c?.dataset?.crossRefContactDy || '');
        const reguaLengthMm = parseFloat(c?.dataset?.reguaLengthMm || '');
        const reguaAngle = parseFloat(c?.dataset?.reguaAngle || '');
        const reguaMarkerMm = parseFloat(c?.dataset?.reguaMarkerMm || '');
        const reguaDisplayUnit = String(c?.dataset?.reguaDisplayUnit || '').trim().toLowerCase();
        return {
            lib: c.dataset.lib,
            mode,
            top: c.style.top,
            left: c.style.left,
            rot: c.dataset.rot ? parseInt(c.dataset.rot, 10) : 0,
            tag: c.dataset.tag || '',
            comment: c.dataset.comment || '',
            model: c.dataset.model || '',
            manufacturer: c.dataset.manufacturer || '',
            showModelLabel: c.dataset.showModelLabel === 'true',
            showManufacturerLabel: c.dataset.showManufacturerLabel === 'true',
            modelLabelDx: Number.isFinite(parseFloat(c.dataset.modelLabelDx || '')) ? parseFloat(c.dataset.modelLabelDx || '') : undefined,
            modelLabelDy: Number.isFinite(parseFloat(c.dataset.modelLabelDy || '')) ? parseFloat(c.dataset.modelLabelDy || '') : undefined,
            manufacturerLabelDx: Number.isFinite(parseFloat(c.dataset.manufacturerLabelDx || '')) ? parseFloat(c.dataset.manufacturerLabelDx || '') : undefined,
            manufacturerLabelDy: Number.isFinite(parseFloat(c.dataset.manufacturerLabelDy || '')) ? parseFloat(c.dataset.manufacturerLabelDy || '') : undefined,
            pinLabels,
            manualOn: c.dataset.manualOn === 'true',
            releTrip: c.dataset.releTrip === 'true',
            sinalColor: c.dataset.sinalColor || '',
            lampColor: c.dataset.lampColor || '',
            timerSeconds: Number.isFinite(timerSeconds) && timerSeconds > 0 ? timerSeconds : undefined,
            crossRefCoilDx: Number.isFinite(crossRefCoilDx) ? crossRefCoilDx : undefined,
            crossRefCoilDy: Number.isFinite(crossRefCoilDy) ? crossRefCoilDy : undefined,
            crossRefContactDx: Number.isFinite(crossRefContactDx) ? crossRefContactDx : undefined,
            crossRefContactDy: Number.isFinite(crossRefContactDy) ? crossRefContactDy : undefined,
            reguaLengthMm: Number.isFinite(reguaLengthMm) ? reguaLengthMm : undefined,
            reguaAngle: Number.isFinite(reguaAngle) ? reguaAngle : undefined,
            reguaMarkerMm: Number.isFinite(reguaMarkerMm) ? reguaMarkerMm : undefined,
            reguaDisplayUnit: reguaDisplayUnit === 'cm' ? 'cm' : 'mm',
            customData: typeof window.exportComponentCustomData === 'function'
                ? window.exportComponentCustomData(c)
                : undefined
        };
    });

    const wireLookup = new Map();
    getWireObjectsForMode(mode).forEach(w => {
        if (w?.element) wireLookup.set(w.element, w);
    });
    const copyPoints = (pts) => {
        if (!Array.isArray(pts)) return [];
        return pts
            .map(p => ({
                x: Number.isFinite(p?.x) ? p.x : 0,
                y: Number.isFinite(p?.y) ? p.y : 0
            }))
            .filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
    };

    const fios = Array.from(wireLayer?.querySelectorAll('polyline.user-wire') || []).map(poly => {
        const wireObj = wireLookup.get(poly) || null;
        const points = copyPoints(wireObj?.points);
        const normalizedPoints = points.length >= 2
            ? points
            : parsePolylinePoints(poly.getAttribute('points'));
        const baseColor = getPersistedWireBaseColor(wireObj, poly, '#b71c1c');
        return {
            mode,
            id: wireObj?.id || '',
            color: baseColor,
            baseColor,
            configColor: baseColor,
            width: parseFloat(poly.style.getPropertyValue('--wire-width')) || null,
            number: wireObj?.number || '',
            labelDx: Number.isFinite(wireObj?.labelDx) ? wireObj.labelDx : 0,
            labelDy: Number.isFinite(wireObj?.labelDy) ? wireObj.labelDy : 0,
            points: normalizedPoints
        };
    }).filter(f => f.points.length >= 2);

    const drawingEntries = [
        ...Array.from(drawingBackgroundLayer?.querySelectorAll('.user-drawing') || []).map(el => ({ el, layer: 'background' })),
        ...Array.from(wireLayer?.querySelectorAll('.user-drawing') || []).map(el => ({ el, layer: 'below' })),
        ...Array.from(panelDrawingLayer?.querySelectorAll('.user-drawing') || []).map(el => ({ el, layer: 'panel' })),
        ...Array.from(wireTopLayer?.querySelectorAll('.user-drawing') || []).map(el => ({ el, layer: 'above' }))
    ];
    const desenhos = drawingEntries.map(({ el, layer }) => ({
        mode,
        layer,
        type: el.dataset.drawType || el.tagName.toLowerCase(),
        stroke: el.getAttribute('stroke') || el.style.stroke || '#2c3e50',
        strokeWidth: parseFloat(el.getAttribute('stroke-width') || el.style.strokeWidth || '2') || 2,
        fill: el.getAttribute('fill') || 'none',
        fillOpacity: parseFloat(el.getAttribute('fill-opacity') || el.style.fillOpacity || ''),
        text: el.tagName?.toLowerCase() === 'text' ? (el.textContent || '') : undefined,
        fontSize: parseFloat(el.getAttribute('font-size') || ''),
        fontFamily: el.getAttribute('font-family') || undefined,
        fontWeight: el.getAttribute('font-weight') || undefined,
        points: el.tagName?.toLowerCase() === 'polygon' ? String(el.getAttribute('points') || '') : undefined,
        x1: parseFloat(el.getAttribute('x1')),
        y1: parseFloat(el.getAttribute('y1')),
        x2: parseFloat(el.getAttribute('x2')),
        y2: parseFloat(el.getAttribute('y2')),
        x: parseFloat(el.getAttribute('x')),
        y: parseFloat(el.getAttribute('y')),
        width: parseFloat(el.getAttribute('width')),
        height: parseFloat(el.getAttribute('height')),
        cx: parseFloat(el.getAttribute('cx')),
        cy: parseFloat(el.getAttribute('cy')),
        rx: parseFloat(el.getAttribute('rx')),
        ry: parseFloat(el.getAttribute('ry'))
    }));

    return { componentes, fios, desenhos };
}

function buildActiveSheetPayload() {
    const simbologia = getWorkspaceState('simbologia');
    const modo2d = getWorkspaceState('2d');
    const componentes = [...simbologia.componentes, ...modo2d.componentes];
    const fiosByMode = {
        simbologia: simbologia.fios,
        '2d': modo2d.fios
    };
    const desenhosByMode = {
        simbologia: simbologia.desenhos || [],
        '2d': modo2d.desenhos || []
    };

    return {
        version: 2,
        menuMode: (typeof menuMode !== 'undefined') ? menuMode : 'simbologia',
        componentes,
        fiosByMode,
        desenhosByMode
    };
}

function extractPreferredSheetPayload(data) {
    if (!Array.isArray(data?.sheets) || !data.sheets.length) {
        return data || {};
    }

    const preferredId = String(data?.activeSheetId || '').trim();
    const preferred = data.sheets.find(item => String(item?.id || '').trim() === preferredId) || data.sheets[0];
    return cloneJsonPayload(preferred?.snapshot || preferred || {});
}

function applyActiveSheetPayload(data) {
    window.limparBancada();

    let totalReal = 0;
    let totalIec = 0;
    (data.componentes || []).forEach(c => {
        if ((c.lib || '').startsWith('real_')) totalReal++;
        if ((c.lib || '').startsWith('iec_')) totalIec++;
        const ultimo = adicionarComponente(c.lib, null, c.top, c.left, { allowOutOfMode: true });
        if (!ultimo) return;
        if (ultimo && c.rot) {
            ultimo.dataset.rot = c.rot;
            ultimo.style.transform = `rotate(${c.rot}deg)`;
        }
        if (ultimo && c.tag) {
            ultimo.dataset.tag = c.tag;
            const label = ultimo.querySelector('.tag-label');
            if (label) label.innerText = c.tag;
        }
        if (ultimo && typeof c.comment === 'string') ultimo.dataset.comment = c.comment;
        if (ultimo && typeof c.model === 'string') ultimo.dataset.model = c.model;
        if (ultimo && typeof c.manufacturer === 'string') ultimo.dataset.manufacturer = c.manufacturer;
        if (ultimo && typeof c.showModelLabel !== 'undefined') ultimo.dataset.showModelLabel = c.showModelLabel ? 'true' : 'false';
        if (ultimo && typeof c.showManufacturerLabel !== 'undefined') ultimo.dataset.showManufacturerLabel = c.showManufacturerLabel ? 'true' : 'false';
        if (ultimo && Number.isFinite(c.modelLabelDx)) ultimo.dataset.modelLabelDx = String(Math.round(c.modelLabelDx));
        if (ultimo && Number.isFinite(c.modelLabelDy)) ultimo.dataset.modelLabelDy = String(Math.round(c.modelLabelDy));
        if (ultimo && Number.isFinite(c.manufacturerLabelDx)) ultimo.dataset.manufacturerLabelDx = String(Math.round(c.manufacturerLabelDx));
        if (ultimo && Number.isFinite(c.manufacturerLabelDy)) ultimo.dataset.manufacturerLabelDy = String(Math.round(c.manufacturerLabelDy));
        if (ultimo && typeof window.importComponentCustomData === 'function') {
            window.importComponentCustomData(ultimo, c.customData, { source: 'sheet_payload' });
        }
        if (ultimo && Array.isArray(c.pinLabels) && c.pinLabels.length) {
            const pinNodes = Array.from(ultimo.querySelectorAll('.pin-label'));
            pinNodes.forEach((node, idx) => {
                const txt = c.pinLabels[idx];
                if (typeof txt === 'string' && txt.trim()) node.innerText = txt.trim();
            });
        }
        if (ultimo && typeof c.manualOn !== 'undefined') {
            ultimo.dataset.manualOn = c.manualOn ? 'true' : 'false';
        }
        if (ultimo && typeof c.releTrip !== 'undefined') {
            ultimo.dataset.releTrip = c.releTrip ? 'true' : 'false';
        }
        if (ultimo && c.sinalColor) {
            ultimo.dataset.sinalColor = String(c.sinalColor).toLowerCase();
        }
        if (ultimo && c.lampColor) {
            ultimo.dataset.lampColor = String(c.lampColor).toLowerCase();
            if (typeof window.applyIecLampColorToComponent === 'function') {
                window.applyIecLampColorToComponent(ultimo, ultimo.dataset.lampColor);
            }
        }
        if (ultimo && Number.isFinite(c.timerSeconds) && c.timerSeconds > 0) {
            const timerLabel = ultimo.querySelector('.timer-label');
            if (timerLabel) {
                timerLabel.dataset.timerSeconds = String(c.timerSeconds);
                timerLabel.innerText = `${c.timerSeconds.toFixed(1)}s`;
            }
        }
        if (ultimo && Number.isFinite(c.crossRefCoilDx)) {
            ultimo.dataset.crossRefCoilDx = String(Math.round(c.crossRefCoilDx));
        }
        if (ultimo && Number.isFinite(c.crossRefCoilDy)) {
            ultimo.dataset.crossRefCoilDy = String(Math.round(c.crossRefCoilDy));
        }
        if (ultimo && Number.isFinite(c.crossRefContactDx)) {
            ultimo.dataset.crossRefContactDx = String(Math.round(c.crossRefContactDx));
        }
        if (ultimo && Number.isFinite(c.crossRefContactDy)) {
            ultimo.dataset.crossRefContactDy = String(Math.round(c.crossRefContactDy));
        }
        if (ultimo && Number.isFinite(c.reguaLengthMm)) {
            ultimo.dataset.reguaLengthMm = String(Math.round(c.reguaLengthMm));
        }
        if (ultimo && Number.isFinite(c.reguaAngle)) {
            ultimo.dataset.reguaAngle = String(Math.round(c.reguaAngle));
        }
        if (ultimo && Number.isFinite(c.reguaMarkerMm)) {
            ultimo.dataset.reguaMarkerMm = String(c.reguaMarkerMm);
        }
        if (ultimo && (c.reguaDisplayUnit === 'mm' || c.reguaDisplayUnit === 'cm')) {
            ultimo.dataset.reguaDisplayUnit = c.reguaDisplayUnit;
        }
        if (
            ultimo &&
            ultimo.dataset.lib === 'real_regua_milimetrada' &&
            typeof window.refreshRealReguaMilimetradaComponent === 'function'
        ) {
            window.refreshRealReguaMilimetradaComponent(ultimo);
        }
    });

    let modeToShow = data?.menuMode || ((typeof menuMode !== 'undefined') ? menuMode : 'simbologia');
    if (totalReal > 0 && totalIec === 0) modeToShow = '2d';
    else if (totalIec > 0 && totalReal === 0) modeToShow = 'simbologia';

    const fiosByMode = data?.fiosByMode || {
        simbologia: (data.fios || []).filter(f => (f.mode || 'simbologia') === 'simbologia'),
        '2d': (data.fios || []).filter(f => (f.mode || 'simbologia') === '2d')
    };
    const desenhosByMode = data?.desenhosByMode || {
        simbologia: (data.desenhos || []).filter(d => (d.mode || 'simbologia') === 'simbologia'),
        '2d': (data.desenhos || []).filter(d => (d.mode || 'simbologia') === '2d')
    };
    const hasModeContent = (mode) => {
        const normalizedMode = mode === '2d' ? '2d' : 'simbologia';
        const hasComponents = (data.componentes || []).some(c => {
            const savedMode = String(c?.mode || '').trim().toLowerCase();
            if (savedMode) return savedMode === normalizedMode;
            const lib = String(c?.lib || '').trim().toLowerCase();
            return normalizedMode === '2d' ? lib.startsWith('real_') : lib.startsWith('iec_');
        });
        if (hasComponents) return true;
        if ((fiosByMode[normalizedMode] || []).length > 0) return true;
        if ((desenhosByMode[normalizedMode] || []).length > 0) return true;
        return normalizedMode === (modeToShow === '2d' ? '2d' : 'simbologia');
    };
    ['simbologia', '2d'].forEach(mode => {
        if (!hasModeContent(mode)) return;
        if (typeof setMenuMode === 'function') setMenuMode(mode);
        const bornes = obterBornesMapaDaWorkspace(mode);
        (fiosByMode[mode] || []).forEach(f => desenharFioSalvo(f, bornes));
        (desenhosByMode[mode] || []).forEach(d => desenharDesenhoSalvo(d));
        if (mode === '2d' && typeof window.validateAndRepair2DWires === 'function') {
            try {
                window.validateAndRepair2DWires({ reason: 'load_2d', force: true, limit: 12, repair: false });
            } catch (err) {
                console.warn('Falha ao validar fios 2D durante a importacao.', err);
            }
        }
        if (typeof window.rebindWireEndpoints === 'function') window.rebindWireEndpoints();
        if (typeof markWireIndexDirty === 'function') markWireIndexDirty();
        if (typeof renderWireJunctions === 'function') renderWireJunctions();
    });
    if (typeof setMenuMode === 'function') setMenuMode(modeToShow === '2d' ? '2d' : 'simbologia');
    if (typeof window.restoreConfiguredWireColors === 'function') {
        window.restoreConfiguredWireColors();
    }
    if (!document.body.classList.contains('simulando') && typeof limparVisual === 'function') {
        try { limparVisual(); } catch (_) { }
    }
    if (typeof window.syncAllWireRenderAppearances === 'function') {
        setTimeout(window.syncAllWireRenderAppearances, 0);
        setTimeout(window.syncAllWireRenderAppearances, 120);
    }
    requestAnimationFrame(() => {
        try {
            if (typeof window.restoreConfiguredWireColors === 'function') window.restoreConfiguredWireColors();
            if (!document.body.classList.contains('simulando') && typeof limparVisual === 'function') limparVisual();
            if (typeof window.syncAllWireRenderAppearances === 'function') {
                window.syncAllWireRenderAppearances();
                setTimeout(window.syncAllWireRenderAppearances, 120);
            }
        } catch (_) { }
    });
    if (typeof window.scheduleCrossReferenceRefresh === 'function') {
        window.scheduleCrossReferenceRefresh();
    }
}

function cloneJsonPayload(value) {
    try {
        return JSON.parse(JSON.stringify(value || {}));
    } catch (_) {
        return (value && typeof value === 'object') ? { ...value } : {};
    }
}

const PROJECT_IMPORT_LIMITS = Object.freeze({
    maxFileBytes: 20 * 1024 * 1024,
    maxNodes: 120000,
    maxDepth: 40,
    maxArrayLength: 50000,
    maxObjectKeys: 5000,
    maxSheets: 100,
    maxComponents: 3000,
    maxWires: 5000,
    maxPointsPerWire: 1000,
    maxDrawings: 3000,
    maxPinLabels: 80,
    maxTextLength: 500,
    maxShortTextLength: 120,
    maxCoordinateAbs: 100000
});

function createProjectImportError(message) {
    const err = new Error(message);
    err.name = 'SimuDzProjectImportError';
    return err;
}

function sanitizeImportedProjectGraph(value, depth = 0, state = { nodes: 0 }) {
    if (depth > PROJECT_IMPORT_LIMITS.maxDepth) {
        throw createProjectImportError('Arquivo de projeto muito profundo ou corrompido.');
    }
    if (!value || typeof value !== 'object') {
        return value;
    }

    state.nodes += 1;
    if (state.nodes > PROJECT_IMPORT_LIMITS.maxNodes) {
        throw createProjectImportError('Arquivo de projeto muito grande para importar com seguranca.');
    }

    if (Array.isArray(value)) {
        if (value.length > PROJECT_IMPORT_LIMITS.maxArrayLength) {
            throw createProjectImportError('Arquivo de projeto possui listas grandes demais.');
        }
        return value.map(item => sanitizeImportedProjectGraph(item, depth + 1, state));
    }

    const keys = Object.keys(value);
    if (keys.length > PROJECT_IMPORT_LIMITS.maxObjectKeys) {
        throw createProjectImportError('Arquivo de projeto possui objetos grandes demais.');
    }

    const cleaned = {};
    keys.forEach(key => {
        if (key === '__proto__' || key === 'prototype' || key === 'constructor') return;
        cleaned[key] = sanitizeImportedProjectGraph(value[key], depth + 1, state);
    });
    return cleaned;
}


function clampImportedNumber(value, fallback = 0, min = -PROJECT_IMPORT_LIMITS.maxCoordinateAbs, max = PROJECT_IMPORT_LIMITS.maxCoordinateAbs) {
    const n = parseFloat(value);
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

function sanitizeImportedId(value, fallback = '') {
    const cleaned = String(value || '')
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, '')
        .slice(0, 80);
    return cleaned || fallback;
}

function normalizeImportedMode(mode) {
    return String(mode || '').trim() === '2d' ? '2d' : 'simbologia';
}

function sanitizeImportedCssPx(value, fallback = 0) {
    return `${Math.round(clampImportedNumber(value, fallback))}px`;
}

function sanitizeImportedColor(value, fallback = '#2c3e50') {
    const txt = sanitizeConfiguredWireColor(value, '');
    if (!txt) return fallback;
    if (/^#[0-9a-f]{3,8}$/i.test(txt)) return txt;
    if (/^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i.test(txt)) return txt;
    const named = txt.toLowerCase();
    const allowedNames = new Set(['black', 'white', 'red', 'green', 'blue', 'yellow', 'orange', 'purple', 'gray', 'grey', 'brown', 'none']);
    if (allowedNames.has(named)) return named;
    return fallback;
}

function sanitizeImportedPoints(points) {
    if (!Array.isArray(points)) return [];
    return points
        .slice(0, PROJECT_IMPORT_LIMITS.maxPointsPerWire)
        .map(p => ({
            x: clampImportedNumber(p?.x, NaN),
            y: clampImportedNumber(p?.y, NaN)
        }))
        .filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
}

function sanitizeImportedSvgPoints(value) {
    const txt = String(value || '').trim().slice(0, 20000);
    if (!txt || /[^0-9.,\-\s]/.test(txt)) return '';
    return txt;
}

function sanitizeImportedComponent(component) {
    if (!component || typeof component !== 'object') return null;
    const lib = sanitizeImportedId(component.lib || '');
    const source = (typeof BIBLIOTECA !== 'undefined') ? BIBLIOTECA : window.BIBLIOTECA;
    if (!lib || !source || !source[lib]) return null;

    const pinLabels = Array.isArray(component.pinLabels)
        ? component.pinLabels
            .slice(0, PROJECT_IMPORT_LIMITS.maxPinLabels)
            .map(label => sanitizeImportedText(label, PROJECT_IMPORT_LIMITS.maxShortTextLength))
            .filter(Boolean)
        : [];
    const sinalColor = ['branco', 'verde', 'vermelho', 'amarelo', 'azul']
        .includes(String(component.sinalColor || '').toLowerCase())
        ? String(component.sinalColor).toLowerCase()
        : '';
    const lampColor = ['amarelo', 'vermelho', 'verde', 'azul', 'branco']
        .includes(String(component.lampColor || '').toLowerCase())
        ? String(component.lampColor).toLowerCase()
        : '';

    return {
        ...component,
        lib,
        mode: normalizeImportedMode(component.mode),
        top: sanitizeImportedCssPx(component.top),
        left: sanitizeImportedCssPx(component.left),
        rot: Math.round(clampImportedNumber(component.rot, 0, 0, 359)),
        tag: sanitizeImportedText(component.tag, PROJECT_IMPORT_LIMITS.maxShortTextLength),
        comment: sanitizeImportedText(component.comment, PROJECT_IMPORT_LIMITS.maxTextLength),
        model: sanitizeImportedText(component.model, PROJECT_IMPORT_LIMITS.maxShortTextLength),
        manufacturer: sanitizeImportedText(component.manufacturer, PROJECT_IMPORT_LIMITS.maxShortTextLength),
        pinLabels,
        manualOn: !!component.manualOn,
        releTrip: !!component.releTrip,
        sinalColor,
        lampColor,
        timerSeconds: clampImportedNumber(component.timerSeconds, NaN, 1, 3600),
        modelLabelDx: clampImportedNumber(component.modelLabelDx, NaN),
        modelLabelDy: clampImportedNumber(component.modelLabelDy, NaN),
        manufacturerLabelDx: clampImportedNumber(component.manufacturerLabelDx, NaN),
        manufacturerLabelDy: clampImportedNumber(component.manufacturerLabelDy, NaN),
        crossRefCoilDx: clampImportedNumber(component.crossRefCoilDx, NaN),
        crossRefCoilDy: clampImportedNumber(component.crossRefCoilDy, NaN),
        crossRefContactDx: clampImportedNumber(component.crossRefContactDx, NaN),
        crossRefContactDy: clampImportedNumber(component.crossRefContactDy, NaN),
        reguaLengthMm: clampImportedNumber(component.reguaLengthMm, NaN, 1, 50000),
        reguaAngle: clampImportedNumber(component.reguaAngle, NaN, -3600, 3600),
        reguaMarkerMm: clampImportedNumber(component.reguaMarkerMm, NaN, 0, 50000),
        reguaDisplayUnit: component.reguaDisplayUnit === 'cm' ? 'cm' : 'mm'
    };
}

function sanitizeImportedWire(wire) {
    if (!wire || typeof wire !== 'object') return null;
    const points = sanitizeImportedPoints(wire.points);
    if (points.length < 2) return null;
    const color = sanitizeImportedColor(wire.configColor || wire.baseColor || wire.color, '#b71c1c');
    return {
        ...wire,
        mode: normalizeImportedMode(wire.mode),
        id: sanitizeImportedId(wire.id || ''),
        color,
        baseColor: color,
        configColor: color,
        width: clampImportedNumber(wire.width, NaN, 1, 16),
        number: sanitizeImportedText(wire.number, 40),
        labelDx: clampImportedNumber(wire.labelDx, 0),
        labelDy: clampImportedNumber(wire.labelDy, 0),
        points
    };
}

function sanitizeImportedDrawing(shape) {
    if (!shape || typeof shape !== 'object') return null;
    const type = String(shape.type || '').toLowerCase();
    if (!['line', 'rect', 'circle', 'ellipse', 'polygon', 'text'].includes(type)) return null;
    return {
        ...shape,
        mode: normalizeImportedMode(shape.mode),
        type,
        stroke: sanitizeImportedColor(shape.stroke, '#2c3e50'),
        strokeWidth: clampImportedNumber(shape.strokeWidth, 2, 0.5, 24),
        fill: String(shape.fill || '').toLowerCase() === 'none' ? 'none' : sanitizeImportedColor(shape.fill, 'none'),
        fillOpacity: clampImportedNumber(shape.fillOpacity, NaN, 0, 1),
        text: sanitizeImportedText(shape.text, PROJECT_IMPORT_LIMITS.maxTextLength),
        fontSize: clampImportedNumber(shape.fontSize, 18, 6, 96),
        fontFamily: sanitizeImportedText(shape.fontFamily || 'Segoe UI, sans-serif', 80) || 'Segoe UI, sans-serif',
        fontWeight: sanitizeImportedText(shape.fontWeight || '600', 20) || '600',
        points: sanitizeImportedSvgPoints(shape.points),
        x1: clampImportedNumber(shape.x1, 0),
        y1: clampImportedNumber(shape.y1, 0),
        x2: clampImportedNumber(shape.x2, 0),
        y2: clampImportedNumber(shape.y2, 0),
        x: clampImportedNumber(shape.x, 0),
        y: clampImportedNumber(shape.y, 0),
        width: clampImportedNumber(shape.width, 1, 0, PROJECT_IMPORT_LIMITS.maxCoordinateAbs),
        height: clampImportedNumber(shape.height, 1, 0, PROJECT_IMPORT_LIMITS.maxCoordinateAbs),
        cx: clampImportedNumber(shape.cx, 0),
        cy: clampImportedNumber(shape.cy, 0),
        rx: clampImportedNumber(shape.rx, 1, 0, PROJECT_IMPORT_LIMITS.maxCoordinateAbs),
        ry: clampImportedNumber(shape.ry, 1, 0, PROJECT_IMPORT_LIMITS.maxCoordinateAbs)
    };
}

function sanitizeImportedSheetSnapshot(snapshot) {
    const source = (snapshot && typeof snapshot === 'object') ? snapshot : {};
    const next = { ...source };
    next.menuMode = normalizeImportedMode(source.menuMode);
    next.componentes = Array.isArray(source.componentes)
        ? source.componentes.slice(0, PROJECT_IMPORT_LIMITS.maxComponents).map(sanitizeImportedComponent).filter(Boolean)
        : [];

    const wireBucket = source.fiosByMode || {};
    const legacyWires = Array.isArray(source.fios) ? source.fios : [];
    next.fiosByMode = {
        simbologia: (Array.isArray(wireBucket.simbologia) ? wireBucket.simbologia : legacyWires.filter(w => normalizeImportedMode(w?.mode) === 'simbologia'))
            .slice(0, PROJECT_IMPORT_LIMITS.maxWires)
            .map(sanitizeImportedWire)
            .filter(Boolean),
        '2d': (Array.isArray(wireBucket['2d']) ? wireBucket['2d'] : legacyWires.filter(w => normalizeImportedMode(w?.mode) === '2d'))
            .slice(0, PROJECT_IMPORT_LIMITS.maxWires)
            .map(sanitizeImportedWire)
            .filter(Boolean)
    };

    const drawingBucket = source.desenhosByMode || {};
    const legacyDrawings = Array.isArray(source.desenhos) ? source.desenhos : [];
    next.desenhosByMode = {
        simbologia: (Array.isArray(drawingBucket.simbologia) ? drawingBucket.simbologia : legacyDrawings.filter(d => normalizeImportedMode(d?.mode) === 'simbologia'))
            .slice(0, PROJECT_IMPORT_LIMITS.maxDrawings)
            .map(sanitizeImportedDrawing)
            .filter(Boolean),
        '2d': (Array.isArray(drawingBucket['2d']) ? drawingBucket['2d'] : legacyDrawings.filter(d => normalizeImportedMode(d?.mode) === '2d'))
            .slice(0, PROJECT_IMPORT_LIMITS.maxDrawings)
            .map(sanitizeImportedDrawing)
            .filter(Boolean)
    };
    delete next.fios;
    delete next.desenhos;
    return next;
}

function sanitizeImportedProjectPayloadShape(payload) {
    const next = { ...payload };
    if (Array.isArray(next.sheets)) {
        next.sheets = next.sheets.slice(0, PROJECT_IMPORT_LIMITS.maxSheets).map((sheet, idx) => {
            const safeSheet = (sheet && typeof sheet === 'object') ? { ...sheet } : {};
            const fallbackId = `S${idx + 1}`;
            safeSheet.id = sanitizeImportedId(safeSheet.id, fallbackId);
            safeSheet.name = sanitizeImportedText(safeSheet.name || `Folha ${idx + 1}`, PROJECT_IMPORT_LIMITS.maxShortTextLength) || `Folha ${idx + 1}`;
            safeSheet.order = Math.round(clampImportedNumber(safeSheet.order, idx + 1, 1, PROJECT_IMPORT_LIMITS.maxSheets));
            safeSheet.snapshot = sanitizeImportedSheetSnapshot(safeSheet.snapshot || safeSheet);
            return safeSheet;
        });
        return next;
    }
    return sanitizeImportedSheetSnapshot(next);
}
function validateImportedProjectPayload(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw createProjectImportError('Arquivo de projeto invalido.');
    }
    const sanitized = sanitizeImportedProjectGraph(data);
    if (window.SimuDzProjectFiles) {
        try {
            window.SimuDzProjectFiles.assertCompatible(sanitized);
        } catch (err) {
            throw createProjectImportError(err?.message || 'Este arquivo pertence a outro simulador e nao pode ser carregado aqui.');
        }
    }
    return sanitizeImportedProjectPayloadShape(sanitized);
}

function parseImportedProjectJsonText(rawText) {
    const text = String(rawText || '').trim();
    if (!text) {
        throw createProjectImportError('Arquivo de projeto vazio.');
    }
    try {
        return validateImportedProjectPayload(JSON.parse(text));
    } catch (err) {
        if (err?.name === 'SimuDzProjectImportError') throw err;
        throw createProjectImportError('Arquivo de projeto invalido.');
    }
}

function getProjectImportErrorMessage(err, fallback = 'Arquivo de projeto invalido.') {
    const message = String(err?.message || '').trim();
    const finalMessage = message || fallback;
    if (window.SimuDzProjectFiles && typeof window.SimuDzProjectFiles.showWarning === 'function') {
        window.SimuDzProjectFiles.showWarning(finalMessage);
    }
    return finalMessage;
}

function isSafeProjectAssetReference(value) {
    const txt = String(value || '').trim();
    if (!txt) return false;
    if (/^data:image\/[^;]+;base64,/i.test(txt)) return true;
    if (txt.startsWith('./') || txt.startsWith('../') || txt.startsWith('/')) return true;
    if (/^(https?:)?\/\//i.test(txt)) {
        try {
            return new URL(txt, window.location.href).origin === window.location.origin;
        } catch (_) {
            return false;
        }
    }
    return false;
}

function logoExtensionFromMimeType(mimeType) {
    const mime = String(mimeType || '').toLowerCase();
    if (mime === 'image/png') return 'png';
    if (mime === 'image/jpeg') return 'jpg';
    if (mime === 'image/webp') return 'webp';
    return 'img';
}

function logoMimeTypeFromExtension(ext) {
    const txt = String(ext || '').toLowerCase();
    if (txt === 'png') return 'image/png';
    if (txt === 'jpg' || txt === 'jpeg') return 'image/jpeg';
    if (txt === 'webp') return 'image/webp';
    return 'image/webp';
}

function sanitizeLogoBaseName(name, fallback = 'logo') {
    const raw = String(name || '')
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-z0-9_-]+/gi, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
    return raw || fallback;
}

function parseImageDataUrl(dataUrl) {
    const txt = String(dataUrl || '').trim();
    const m = txt.match(/^data:(image\/[^;]+);base64,(.+)$/i);
    if (!m) return null;
    const mimeType = String(m[1] || '').toLowerCase();
    const base64 = String(m[2] || '').trim();
    if (!mimeType || !base64) return null;
    return { mimeType, base64, dataUrl: `data:${mimeType};base64,${base64}` };
}

function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || '').trim());
        reader.onerror = () => reject(new Error('Falha ao ler imagem.'));
        reader.readAsDataURL(blob);
    });
}

async function resolveLogoReferenceToDataUrl(logoRef) {
    const txt = String(logoRef || '').trim();
    if (!txt) return '';
    if (!isSafeProjectAssetReference(txt)) return '';
    if (/^data:image\/[^;]+;base64,/i.test(txt)) return txt;

    try {
        const resp = await fetch(txt, { cache: 'no-cache' });
        if (!resp.ok) return '';
        const blob = await resp.blob();
        if (!String(blob?.type || '').toLowerCase().startsWith('image/')) return '';
        return await blobToDataUrl(blob);
    } catch (_) {
        return '';
    }
}

async function ensurePayloadLogoAssets(payload) {
    if (!payload || typeof payload !== 'object' || !Array.isArray(payload.sheets)) {
        return { payload, resolvedCount: 0, skippedCount: 0 };
    }
    const assets = (payload.assets && typeof payload.assets === 'object') ? { ...payload.assets } : {};
    const logoAssets = (assets.logo && typeof assets.logo === 'object') ? { ...assets.logo } : {};
    let resolvedCount = 0;
    let skippedCount = 0;
    let changed = false;

    for (let i = 0; i < payload.sheets.length; i++) {
        const sheet = payload.sheets[i];
        const config = sheet?.pageConfig;
        if (!config || typeof config !== 'object') continue;

        const currentRef = String(config.logoDataUrl || '').trim();
        if (!currentRef) continue;
        const dataUrl = await resolveLogoReferenceToDataUrl(currentRef);
        const parsed = parseImageDataUrl(dataUrl);
        if (!parsed) {
            skippedCount++;
            continue;
        }

        const ext = logoExtensionFromMimeType(parsed.mimeType);
        const fallbackId = `sheet-${i + 1}`;
        const rawSheetId = sanitizeLogoBaseName(sheet?.id || fallbackId, fallbackId);
        const baseByMeta = sanitizeLogoBaseName(config?.logoMeta?.fileName || '', '');
        const baseByAssetPath = sanitizeLogoBaseName(String(config.logoAssetPath || '').split('/').pop() || '', '');
        const base = baseByMeta || baseByAssetPath || `logo-${rawSheetId}`;

        let fileName = `${base}.${ext}`;
        let suffix = 2;
        while (logoAssets[fileName] && String(logoAssets[fileName]?.base64 || '').trim() !== parsed.base64) {
            fileName = `${base}-${suffix}.${ext}`;
            suffix++;
        }

        logoAssets[fileName] = { mimeType: parsed.mimeType, base64: parsed.base64 };
        config.logoAssetPath = `assets/logo/${fileName}`;
        config.logoDataUrl = parsed.dataUrl;
        resolvedCount++;
        changed = true;
    }

    if (changed || Object.keys(logoAssets).length) {
        assets.logo = logoAssets;
        payload.assets = assets;
        const parsedVersion = parseInt(payload.version, 10);
        payload.version = Number.isFinite(parsedVersion) ? Math.max(parsedVersion, 4) : 4;
    }

    return { payload, resolvedCount, skippedCount };
}

function embedProjectLogoAssets(payload) {
    if (!payload || typeof payload !== 'object' || !Array.isArray(payload.sheets)) return payload;
    const assets = (payload.assets && typeof payload.assets === 'object') ? { ...payload.assets } : {};
    const logoAssets = (assets.logo && typeof assets.logo === 'object') ? { ...assets.logo } : {};
    let hasAnyLogo = false;

    payload.sheets.forEach((sheet, idx) => {
        const config = sheet?.pageConfig;
        if (!config || typeof config !== 'object') return;
        const logoDataUrl = String(config.logoDataUrl || '').trim();
        if (!logoDataUrl) return;
        const m = logoDataUrl.match(/^data:([^;]+);base64,(.+)$/i);
        if (!m) return;
        const mimeType = String(m[1] || '').toLowerCase();
        const base64 = String(m[2] || '').trim();
        if (!base64) return;

        const ext = logoExtensionFromMimeType(mimeType);
        const fallbackId = `sheet-${idx + 1}`;
        const rawSheetId = String(sheet?.id || fallbackId)
            .replace(/[^a-z0-9_-]+/gi, '-')
            .replace(/^-+|-+$/g, '')
            .toLowerCase() || fallbackId;
        const baseName = String(config?.logoMeta?.fileName || '')
            .replace(/\.[^/.]+$/, '')
            .replace(/[^a-z0-9_-]+/gi, '-')
            .replace(/^-+|-+$/g, '')
            .toLowerCase();
        const fileName = `${baseName || `logo-${rawSheetId}`}.${ext}`;
        logoAssets[fileName] = { mimeType, base64 };
        config.logoAssetPath = `assets/logo/${fileName}`;
        hasAnyLogo = true;
    });

    if (hasAnyLogo) {
        assets.logo = logoAssets;
        payload.assets = assets;
        const parsedVersion = parseInt(payload.version, 10);
        payload.version = Number.isFinite(parsedVersion) ? Math.max(parsedVersion, 4) : 4;
    }
    return payload;
}

function hydrateProjectLogosFromAssets(payload) {
    if (!payload || typeof payload !== 'object') return payload;
    const logoAssets = payload?.assets?.logo;
    if (!logoAssets || typeof logoAssets !== 'object') return payload;
    if (!Array.isArray(payload.sheets)) return payload;

    payload.sheets.forEach(sheet => {
        const config = sheet?.pageConfig;
        if (!config || typeof config !== 'object') return;
        const existingDataUrl = String(config.logoDataUrl || '').trim();
        if (/^data:image\/[^;]+;base64,/i.test(existingDataUrl)) return;
        const assetPath = String(config.logoAssetPath || '').trim();
        if (!assetPath) return;
        const assetName = assetPath.split('/').pop();
        if (!assetName) return;
        const asset = logoAssets[assetName];
        if (!asset || typeof asset !== 'object') return;
        const base64 = String(asset.base64 || '').trim();
        if (!base64) return;
        const ext = String(assetName.split('.').pop() || '').toLowerCase();
        const mimeType = String(asset.mimeType || '').toLowerCase() || logoMimeTypeFromExtension(ext);
        config.logoDataUrl = `data:${mimeType};base64,${base64}`;
    });
    return payload;
}

function buildProjectPayload() {
    let payload = null;
    if (typeof window.exportSheetsProjectPayload === 'function') {
        try {
            payload = window.exportSheetsProjectPayload();
        } catch (err) {
            console.error(err);
        }
    }
    if (!payload) payload = buildActiveSheetPayload();
    return window.SimuDzProjectFiles
        ? window.SimuDzProjectFiles.stampPayload(embedProjectLogoAssets(cloneJsonPayload(payload)))
        : embedProjectLogoAssets(cloneJsonPayload(payload));
}

function applyProjectPayload(data) {
    if (typeof window.resetInlineEngineeringRuntimeVars === 'function') {
        try { window.resetInlineEngineeringRuntimeVars(); } catch (_) { }
    }
    const incoming = hydrateProjectLogosFromAssets(validateImportedProjectPayload(data || {}));
    if (Array.isArray(incoming?.sheets) && incoming.sheets.length > 0) {
        if (typeof window.importSheetsProjectPayload === 'function') {
            try {
                const ok = window.importSheetsProjectPayload(incoming);
                if (ok) return;
            } catch (err) {
                console.error(err);
            }
        }
    }

    applyActiveSheetPayload(extractPreferredSheetPayload(incoming));
    if (typeof window.syncActiveSheetFromWorkspace === 'function') {
        try { window.syncActiveSheetFromWorkspace(); } catch (_) { }
    }
}

function scheduleApplyProjectPayload(data) {
    return new Promise((resolve, reject) => {
        const run = () => {
            try {
                applyProjectPayload(data);
                resolve();
            } catch (err) {
                reject(err);
            }
        };
        if (typeof window.requestAnimationFrame === 'function') {
            window.requestAnimationFrame(() => setTimeout(run, 0));
            return;
        }
        setTimeout(run, 0);
    });
}

function decodeBase64ToBytes(base64Text) {
    const bin = atob(String(base64Text || '').trim());
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
}

function triggerJsonDownload(payload) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const _now = new Date(); const _dStr = _now.getFullYear() + "-" + String(_now.getMonth()+1).padStart(2,"0") + "-" + String(_now.getDate()).padStart(2,"0"); a.download = `schema-electrique-${_dStr}.dz`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

async function salvarProjetoEmPasta(payload) {
    if (typeof window.showDirectoryPicker !== 'function') return false;
    const rootDir = await window.showDirectoryPicker({ mode: 'readwrite' });
    const projectBaseName = window.SimuDzProjectFiles ? window.SimuDzProjectFiles.baseName() : 'projeto-cade';
    const projectDir = await rootDir.getDirectoryHandle(projectBaseName, { create: true });
    const assetsDir = await projectDir.getDirectoryHandle('assets', { create: true });
    const logoDir = await assetsDir.getDirectoryHandle('logo', { create: true });

    const logoAssets = (payload?.assets?.logo && typeof payload.assets.logo === 'object')
        ? payload.assets.logo
        : {};
    const logoEntries = Object.entries(logoAssets);
    for (const [fileName, asset] of logoEntries) {
        const safeName = String(fileName || '').trim();
        if (!safeName) continue;
        const base64 = String(asset?.base64 || '').trim();
        if (!base64) continue;
        const mimeType = String(asset?.mimeType || '').toLowerCase() || logoMimeTypeFromExtension(safeName.split('.').pop());
        const bytes = decodeBase64ToBytes(base64);
        const fh = await logoDir.getFileHandle(safeName, { create: true });
        const writable = await fh.createWritable();
        await writable.write(new Blob([bytes], { type: mimeType }));
        await writable.close();
    }

    const projectFile = await projectDir.getFileHandle(projectBaseName + '.json', { create: true });
    const projectWritable = await projectFile.createWritable();
    await projectWritable.write(JSON.stringify(payload, null, 2));
    await projectWritable.close();
    return true;
}

function blockProjectActionDuringSimulation() {
    if (typeof window.isEditingLockedDuringSimulation === 'function' && window.isEditingLockedDuringSimulation()) {
        if (typeof window.__notifySimulationEditLocked === 'function') {
            window.__notifySimulationEditLocked();
        } else {
            alert('Pare a simulacao para editar o projeto.');
        }
        return true;
    }
    return false;
}
window.exportActiveSheetSnapshot = function () {
    return buildActiveSheetPayload();
};

window.importActiveSheetSnapshot = function (data) {
    applyActiveSheetPayload(data || {});
};

window.exportProjectSnapshot = function () {
    return buildActiveSheetPayload();
};

window.importProjectSnapshot = function (data) {
    applyActiveSheetPayload(data || {});
};

window.salvarProjeto = async function () {
    if (blockProjectActionDuringSimulation()) return;
    try {
        if (typeof limparVisual === 'function') {
            try { limparVisual(); } catch (_) { }
        }
        if (typeof window.restoreConfiguredWireColors === 'function') {
            window.restoreConfiguredWireColors();
        }
        const payloadBase = buildProjectPayload();
        const ensured = await ensurePayloadLogoAssets(payloadBase);
        const payload = ensured.payload;
        const logoAssets = (payload?.assets?.logo && typeof payload.assets.logo === 'object')
            ? payload.assets.logo
            : null;
        const hasLogoAssets = !!(logoAssets && Object.keys(logoAssets).length);
        const canSaveFolder = typeof window.showDirectoryPicker === 'function';

        if (hasLogoAssets && canSaveFolder) {
            const useFolder = confirm('Salvar em pasta com JSON e logos (assets/logo)?');
            if (useFolder) {
                try {
                    const ok = await salvarProjetoEmPasta(payload);
                    if (ok) return;
                } catch (err) {
                    const abortError = String(err?.name || '') === 'AbortError';
                    if (!abortError) throw err;
                }
            }
        }

        triggerJsonDownload(payload);
        if (ensured.skippedCount > 0 && ensured.resolvedCount <= 0) {
            alert('Nao foi possivel incorporar a logo ao salvar. Recarregue a logo na configuracao da folha e tente novamente.');
        }
    } catch (err) {
        console.error(err);
        alert('Falha ao salvar o projeto.');
    }
};

window.exportarImagem = async function () {
    if (blockProjectActionDuringSimulation()) return;

    try {
        await ensureSimuDzExportLibraries({ html2canvas: true });
        const canvas = await captureCurrentSheetFrameAsCanvas();
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = window.SimuDzProjectFiles ? window.SimuDzProjectFiles.fileName('png') : 'projeto-comandos.png';
        document.body.appendChild(a);
        a.click();
        a.remove();
    } catch (err) {
        console.error('Falha na captura profissional, tentando fallback:', err);
        const alvo = document.getElementById('zoom-container') || document.getElementById('viewport');
        if (!alvo || typeof html2canvas !== 'function') {
            alert('Exportacao de imagem nao disponivel');
            return;
        }

        html2canvas(alvo, { backgroundColor: '#ffffff', useCORS: true, scale: 2 })
            .then(canvas => {
                const a = document.createElement('a');
                a.href = canvas.toDataURL('image/png');
                a.download = window.SimuDzProjectFiles ? window.SimuDzProjectFiles.fileName('png') : 'projeto-comandos.png';
                document.body.appendChild(a);
                a.click();
                a.remove();
            })
            .catch(err2 => {
                console.error(err2);
                alert('Falha ao exportar a imagem.');
            });
    }
};

function waitForUiFrame(delayMs = 0) {
    return new Promise(resolve => {
        window.setTimeout(() => {
            window.requestAnimationFrame(() => resolve());
        }, Math.max(0, delayMs));
    });
}

function normalizePdfPaperSize(size) {
    const txt = String(size || '').trim().toUpperCase();
    if (txt === 'A2' || txt === 'A3' || txt === 'A4') return txt.toLowerCase();
    return 'a4';
}

function getOrderedSheetsForPdfExport() {
    if (typeof window.exportSheetsProjectPayload !== 'function') return null;
    const payload = window.exportSheetsProjectPayload();
    const rawSheets = Array.isArray(payload?.sheets) ? payload.sheets : [];
    if (!rawSheets.length) return null;
    const ordered = rawSheets
        .map((sheet, idx) => ({
            id: String(sheet?.id || '').trim(),
            name: String(sheet?.name || '').trim() || `Folha ${idx + 1}`,
            order: Number.isFinite(parseInt(sheet?.order, 10)) ? parseInt(sheet.order, 10) : (idx + 1),
            paperSize: normalizePdfPaperSize(sheet?.pageConfig?.paperSize),
            idx
        }))
        .filter(item => !!item.id)
        .sort((a, b) => {
            if (a.order !== b.order) return a.order - b.order;
            return a.idx - b.idx;
        });
    if (!ordered.length) return null;
    return {
        activeSheetId: String(payload?.activeSheetId || ordered[0].id),
        sheets: ordered
    };
}

function choosePdfExportMode(defaultMode = 'all') {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed',
            inset: '0',
            background: 'rgba(0,0,0,0.4)',
            zIndex: '6000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        });

        const card = document.createElement('div');
        Object.assign(card.style, {
            width: '360px',
            maxWidth: '92vw',
            background: '#fff',
            borderRadius: '8px',
            padding: '14px',
            boxShadow: '0 10px 28px rgba(0,0,0,0.24)',
            color: '#1f2d3a',
            fontFamily: 'Segoe UI, Arial, sans-serif'
        });
        card.innerHTML = `
            <div style="font-size:16px;font-weight:700;margin-bottom:12px;color:#1e293b;text-align:right;" dir="rtl">تصدير المخطط إلى PDF</div>
            <label style="display:flex;align-items:center;gap:8px;margin:10px 0;cursor:pointer;flex-direction:row-reverse;justify-content:flex-end;" dir="rtl">
                <input id="pdf-export-opt-active" type="checkbox">
                <span style="font-weight:600;color:#334155;">الصفحة الحالية فقط (الورقة النشطة)</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;margin:10px 0;cursor:pointer;flex-direction:row-reverse;justify-content:flex-end;" dir="rtl">
                <input id="pdf-export-opt-all" type="checkbox">
                <span style="font-weight:600;color:#334155;">جميع الصفحات (حسب الترتيب)</span>
            </label>
            <div style="display:flex;justify-content:flex-start;gap:8px;margin-top:16px;">
                <button id="pdf-export-ok" type="button" style="padding:8px 14px;border:none;background:#2563eb;color:#fff;border-radius:6px;cursor:pointer;font-weight:700;">تحميل PDF</button>
                <button id="pdf-export-cancel" type="button" style="padding:8px 14px;border:1px solid #cbd5e1;background:#f1f5f9;color:#475569;border-radius:6px;cursor:pointer;font-weight:600;">إلغاء</button>
            </div>
        `;
        overlay.appendChild(card);
        document.body.appendChild(overlay);

        const optActive = card.querySelector('#pdf-export-opt-active');
        const optAll = card.querySelector('#pdf-export-opt-all');
        const btnOk = card.querySelector('#pdf-export-ok');
        const btnCancel = card.querySelector('#pdf-export-cancel');
        if (!optActive || !optAll || !btnOk || !btnCancel) {
            overlay.remove();
            resolve(null);
            return;
        }

        optActive.checked = defaultMode === 'active';
        optAll.checked = defaultMode !== 'active';

        const keepExclusive = (source) => {
            if (source === optActive && optActive.checked) optAll.checked = false;
            if (source === optAll && optAll.checked) optActive.checked = false;
            if (!optActive.checked && !optAll.checked) {
                if (source === optActive) optAll.checked = true;
                else optActive.checked = true;
            }
        };
        optActive.addEventListener('change', () => keepExclusive(optActive));
        optAll.addEventListener('change', () => keepExclusive(optAll));

        const close = (value) => {
            overlay.remove();
            resolve(value);
        };
        btnCancel.addEventListener('click', () => close(null));
        btnOk.addEventListener('click', () => {
            const scope = optActive.checked ? 'active' : (optAll.checked ? 'all' : '');
            if (!scope) {
                close(null);
                return;
            }
            close({ scope });
        });
        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') close(null);
        });
        overlay.addEventListener('mousedown', (e) => {
            if (e.target === overlay) close(null);
        });
    });
}
const PDF_PRINT_MARGIN_MM = 9;
const PDF_CAPTURE_SCALE = 3;

async function resolveLoadedImageToDataUrl(imgEl) {
    const src = String(imgEl?.currentSrc || imgEl?.src || '').trim();
    if (!src) return '';
    if (/^data:image\//i.test(src)) return src;

    const w = Math.max(1, Math.round(imgEl?.naturalWidth || 0));
    const h = Math.max(1, Math.round(imgEl?.naturalHeight || 0));
    if (imgEl?.complete && w > 0 && h > 0) {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(imgEl, 0, 0, w, h);
                const dataUrl = canvas.toDataURL('image/png');
                if (/^data:image\/png;base64,/i.test(dataUrl)) return dataUrl;
            }
        } catch (_) { }
    }

    try {
        const resp = await fetch(src, { cache: 'force-cache' });
        if (!resp.ok) return '';
        const blob = await resp.blob();
        if (!String(blob?.type || '').toLowerCase().startsWith('image/')) return '';
        return await blobToDataUrl(blob);
    } catch (_) {
        return '';
    }
}

async function buildPdfImageEmbedMap() {
    const map = new Map();
    const tagged = [];
    const images = Array.from(document.querySelectorAll('#bancada img'));
    let idx = 1;
    for (const img of images) {
        const key = `pdfimg-${idx++}`;
        img.setAttribute('data-pdf-img-key', key);
        tagged.push(img);
        const dataUrl = renderPdfImageWithObjectFit(img) || await resolveLoadedImageToDataUrl(img);
        if (dataUrl) map.set(key, dataUrl);
    }
    const cleanup = () => {
        tagged.forEach(img => {
            try { img.removeAttribute('data-pdf-img-key'); } catch (_) { }
        });
    };
    return { map, cleanup };
}

function parsePdfObjectPositionToken(token, freeSpace, axisSize) {
    const value = String(token || '').trim().toLowerCase();
    if (!value || value === 'center') return freeSpace / 2;
    if (value === 'left' || value === 'top') return 0;
    if (value === 'right' || value === 'bottom') return freeSpace;
    if (value.endsWith('%')) {
        const percent = parseFloat(value);
        return Number.isFinite(percent) ? freeSpace * percent / 100 : freeSpace / 2;
    }
    if (value.endsWith('px')) {
        const pixels = parseFloat(value);
        return Number.isFinite(pixels) ? pixels : freeSpace / 2;
    }
    const numeric = parseFloat(value);
    if (!Number.isFinite(numeric)) return freeSpace / 2;
    return Math.abs(numeric) <= 1 ? freeSpace * numeric : Math.min(axisSize, numeric);
}

function getPdfObjectPosition(computed, freeX, freeY, boxWidth, boxHeight) {
    const raw = String(computed?.objectPosition || '50% 50%').trim();
    const tokens = raw.split(/\s+/).filter(Boolean);
    return {
        x: parsePdfObjectPositionToken(tokens[0] || '50%', freeX, boxWidth),
        y: parsePdfObjectPositionToken(tokens[1] || '50%', freeY, boxHeight)
    };
}

function renderPdfImageWithObjectFit(imgEl) {
    if (!(imgEl instanceof HTMLImageElement) || !imgEl.complete) return '';
    const sourceWidth = Number(imgEl.naturalWidth || 0);
    const sourceHeight = Number(imgEl.naturalHeight || 0);
    if (!(sourceWidth > 0 && sourceHeight > 0)) return '';

    let computed = null;
    try { computed = window.getComputedStyle(imgEl); } catch (_) { }
    if (!computed || computed.display === 'none' || computed.visibility === 'hidden') return '';

    const boxWidth = parseFloat(computed.width);
    const boxHeight = parseFloat(computed.height);
    if (!(boxWidth > 0 && boxHeight > 0)) return '';

    const fit = String(computed.objectFit || 'fill').trim().toLowerCase();

    let drawWidth = boxWidth;
    let drawHeight = boxHeight;
    if (fit === 'fill') {
        // SVGs IEC precisam ser rasterizados na caixa final para o PDF manter o viewport.
    } else if (fit === 'contain' || fit === 'scale-down') {
        let scale = Math.min(boxWidth / sourceWidth, boxHeight / sourceHeight);
        if (fit === 'scale-down') scale = Math.min(1, scale);
        drawWidth = sourceWidth * scale;
        drawHeight = sourceHeight * scale;
    } else if (fit === 'cover') {
        const scale = Math.max(boxWidth / sourceWidth, boxHeight / sourceHeight);
        drawWidth = sourceWidth * scale;
        drawHeight = sourceHeight * scale;
    } else if (fit === 'none') {
        drawWidth = sourceWidth;
        drawHeight = sourceHeight;
    } else {
        return '';
    }

    const libKey = String(imgEl.closest?.('.component')?.dataset?.lib || '');
    let centerCorrectedAxis = false;
    if (libKey === 'iec_disjuntor_bipolar') {
        drawWidth *= 0.5555555556;
        centerCorrectedAxis = true;
    } else if (libKey === 'iec_disjuntor_termomagnetico') {
        drawWidth = drawHeight * (sourceWidth / sourceHeight);
        centerCorrectedAxis = true;
    } else if (libKey === 'iec_botao_na') {
        drawHeight *= 0.5913043478;
        centerCorrectedAxis = true;
    } else if (libKey === 'iec_botao_nf') {
        drawHeight *= 0.5959302326;
        centerCorrectedAxis = true;
    }
    const rasterScale = centerCorrectedAxis
        ? Math.max(4, PDF_CAPTURE_SCALE)
        : Math.max(1, Math.min(2, Number(window.devicePixelRatio || 1)));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(boxWidth * rasterScale));
    canvas.height = Math.max(1, Math.round(boxHeight * rasterScale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const position = centerCorrectedAxis
        ? {
            x: (boxWidth - drawWidth) / 2,
            y: (boxHeight - drawHeight) / 2
        }
        : getPdfObjectPosition(
            computed,
            boxWidth - drawWidth,
            boxHeight - drawHeight,
            boxWidth,
            boxHeight
        );
    ctx.scale(rasterScale, rasterScale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    try {
        if (libKey === 'iec_disjuntor_bipolar') {
            ctx.save();
            ctx.globalAlpha = 0.55;
            [
                [-0.3, 0],
                [0.3, 0],
                [0, -0.3],
                [0, 0.3]
            ].forEach(([offsetX, offsetY]) => {
                ctx.drawImage(
                    imgEl,
                    position.x + offsetX,
                    position.y + offsetY,
                    drawWidth,
                    drawHeight
                );
            });
            ctx.restore();
        }
        ctx.drawImage(imgEl, position.x, position.y, drawWidth, drawHeight);
        return canvas.toDataURL('image/png');
    } catch (_) {
        return '';
    }
}
async function resolveEngineeringOverridesCssText() {
    const link = document.getElementById('engineering-overrides-link');
    if (!link) return '';
    try {
        const rules = link.sheet?.cssRules;
        if (rules && rules.length) {
            return Array.from(rules).map(rule => rule.cssText).join('\n');
        }
    } catch (_) { }

    const href = String(link.getAttribute('href') || link.href || '').trim();
    if (!href) return '';
    try {
        const resp = await fetch(href, { cache: 'no-cache' });
        if (!resp.ok) return '';
        return String(await resp.text() || '');
    } catch (_) {
        return '';
    }
}

function collectCurrentRootCssVariables() {
    const out = new Map();
    try {
        const cs = window.getComputedStyle(document.documentElement);
        for (let i = 0; i < cs.length; i++) {
            const name = cs[i];
            if (!name || !name.startsWith('--')) continue;
            const value = String(cs.getPropertyValue(name) || '').trim();
            if (!value) continue;
            out.set(name, value);
        }
    } catch (_) { }
    return out;
}

async function captureCurrentSheetFrameAsCanvas() {
    await ensureSimuDzExportLibraries({ html2canvas: true });
    if (typeof html2canvas !== 'function') {
        throw new Error('Biblioteca html2canvas indisponivel.');
    }
    const zoomContainer = document.getElementById('zoom-container');
    const frame = document.querySelector('#bancada > .project-sheet-frame');
    if (!zoomContainer || !frame) {
        throw new Error('Folha de projeto nao encontrada.');
    }
    const engineeringCssText = await resolveEngineeringOverridesCssText();
    const embeddedImages = await buildPdfImageEmbedMap();
    const rootCssVars = collectCurrentRootCssVariables();

    try {
        await waitForUiFrame(60);
        // Mesurer précisément les dimensions réelles de la feuille de schéma
        const frameW = Math.max(1, Math.round(frame.offsetWidth || frame.clientWidth || 1160));
        const frameH = Math.max(1, Math.round(frame.offsetHeight || frame.clientHeight || 820));
        const frameLeft = Math.max(0, Math.round(frame.offsetLeft || 0));
        const frameTop = Math.max(0, Math.round(frame.offsetTop || 0));

        const capturedCanvas = await html2canvas(zoomContainer, {
            backgroundColor: '#ffffff',
            useCORS: true,
            scale: 2.5,
            foreignObjectRendering: false,
            removeContainer: true,
            scrollX: 0,
            scrollY: 0,
            x: frameLeft,
            y: frameTop,
            width: frameW,
            height: frameH,
            onclone: (doc) => {
                // Evita overlays/estado de engenharia no PDF.
                try {
                    doc.body?.classList?.remove('engineering-mode');
                } catch (_) { }
                const engPanel = doc.getElementById('engineering-panel');
                if (engPanel) engPanel.style.display = 'none';
                if (engineeringCssText) {
                    const inlineStyle = doc.createElement('style');
                    inlineStyle.id = 'pdf-export-engineering-overrides';
                    inlineStyle.textContent = engineeringCssText;
                    doc.head.appendChild(inlineStyle);
                }
                if (rootCssVars.size) {
                    rootCssVars.forEach((value, key) => {
                        doc.documentElement.style.setProperty(key, value);
                    });
                }
                doc.querySelectorAll(
                    '.component[data-lib="iec_fase"] svg, .component[data-lib="iec_neutro"] svg'
                ).forEach((svg) => {
                    svg.setAttribute('height', '24');
                    svg.style.setProperty('height', '24px', 'important');
                    svg.style.setProperty('overflow', 'visible', 'important');
                    svg.querySelectorAll('text').forEach((text) => text.setAttribute('y', '13'));
                });
                // Remove grade e overlays somente durante o print para PDF.
                const printCleanStyle = doc.createElement('style');
                printCleanStyle.id = 'pdf-export-print-clean';
                printCleanStyle.textContent = `
                    .workbench {
                        background-image: none !important;
                        background-color: #ffffff !important;
                    }
                    #crosshair-h, #crosshair-v, #magnet-target {
                        display: none !important;
                    }
                    .component[data-lib="iec_fase"],
                    .component[data-lib="iec_neutro"],
                    .component[data-lib="iec_fase"] > .component-fine-adjust,
                    .component[data-lib="iec_neutro"] > .component-fine-adjust,
                    .component[data-lib="iec_fase"] svg,
                    .component[data-lib="iec_neutro"] svg {
                        overflow: visible !important;
                    }
                `;
                doc.head.appendChild(printCleanStyle);
                const clonedZoomContainer = doc.getElementById('zoom-container');
                if (clonedZoomContainer) {
                    clonedZoomContainer.style.transform = 'none';
                    clonedZoomContainer.style.transformOrigin = '0 0';
                }
                // Masquer la palette flottante et les barres d'outils sur le PDF exporté
                const floatingPal = doc.getElementById('floating-user-tools');
                if (floatingPal) floatingPal.style.display = 'none';
                const lockOverlay = doc.getElementById('dz-access-lock-overlay');
                if (lockOverlay) lockOverlay.style.display = 'none';
                // Assurer que tous les composants et textes SVG sont affichés
                doc.querySelectorAll('.component, .user-wire, .tag-label, .pin-label').forEach(el => {
                    el.style.visibility = 'visible';
                    el.style.opacity = '1';
                });
                doc.querySelectorAll('#bancada img[data-pdf-img-key]').forEach(img => {
                    const key = String(img.getAttribute('data-pdf-img-key') || '');
                    const dataUrl = embeddedImages.map.get(key);
                    if (!dataUrl) return;
                    img.setAttribute('src', dataUrl);
                    img.removeAttribute('srcset');
                });
                doc.querySelectorAll('.component.selected, .wire-junction.selected, .wire-label.selected').forEach(el => {
                    el.classList.remove('selected');
                });
            }
        });
        return capturedCanvas;
    } finally {
        embeddedImages.cleanup();
    }
}

window.exportarPdf = async function (opts = {}) {
    if (blockProjectActionDuringSimulation()) return;
    let finishPdfLoading = null;
    try {
        if (typeof window.syncActiveSheetFromWorkspace === 'function') {
            try { window.syncActiveSheetFromWorkspace(); } catch (_) { }
        }

        const ordered = getOrderedSheetsForPdfExport();
        if (!ordered || !ordered.sheets.length) {
            alert('لم يتم العثور على أي صفحة لتصديرها.');
            return;
        }
        const requestedMode = String(opts?.mode || '').toLowerCase();
        const pick = (requestedMode === 'active' || requestedMode === 'all')
            ? { scope: requestedMode }
            : await choosePdfExportMode('all');
        if (!pick || !pick.scope) return;
        const mode = pick.scope;
        const originalSheetId = ordered.activeSheetId;
        const activeSheetId = (typeof window.getActiveProjectSheetId === 'function')
            ? String(window.getActiveProjectSheetId() || originalSheetId)
            : originalSheetId;
        const targetSheets = mode === 'active'
            ? ordered.sheets.filter(s => s.id === activeSheetId)
            : ordered.sheets;
        if (!targetSheets.length) {
            alert('الصفحة النشطة غير موجودة.');
            return;
        }
        if (targetSheets.length > 1 && typeof window.activateProjectSheetById !== 'function') {
            alert('تبديل الصفحات غير متاح أثناء التصدير.');
            return;
        }

        finishPdfLoading = beginProjectLoading(
            'جاري إنشاء ملف PDF...',
            `Carregando recursos e preparando ${targetSheets.length === 1 ? 'a folha' : `${targetSheets.length} folhas`}.`
        );
        await waitForNextPaint();
        await ensureSimuDzExportLibraries({ jspdf: true });
        const jsPdfLib = window.jspdf?.jsPDF;
        if (typeof jsPdfLib !== 'function') {
            throw new Error('مكتبة تصدير PDF غير متاحة.');
        }

        let pdf = null;
        let exportedPages = 0;
        try {
            for (const [sheetIndex, sheet] of targetSheets.entries()) {
                updateProjectLoadingOverlay(
                    'جاري إنشاء ملف PDF...',
                    `Processando folha ${sheetIndex + 1} de ${targetSheets.length}.`
                );
                await waitForNextPaint();
                if (sheet.id !== activeSheetId) {
                    const ok = window.activateProjectSheetById(sheet.id, { skipCapture: true, resetHistory: false });
                    if (!ok) continue;
                }
                await waitForUiFrame(80);
                const canvas = await captureCurrentSheetFrameAsCanvas();
                if (!canvas) continue;

                const pageW = Math.max(1, Math.round(canvas.width));
                const pageH = Math.max(1, Math.round(canvas.height));
                const orientation = pageW >= pageH ? 'landscape' : 'portrait';
                const paperFormat = normalizePdfPaperSize(sheet.paperSize);
                const imgData = canvas.toDataURL('image/png');

                if (!pdf) {
                    pdf = new jsPdfLib({
                        orientation,
                        unit: 'mm',
                        format: paperFormat,
                        compress: true
                    });
                } else {
                    pdf.addPage(paperFormat, orientation);
                }
                const pageMmW = pdf.internal.pageSize.getWidth();
                const pageMmH = pdf.internal.pageSize.getHeight();
                const availableMmW = Math.max(10, pageMmW - (PDF_PRINT_MARGIN_MM * 2));
                const availableMmH = Math.max(10, pageMmH - (PDF_PRINT_MARGIN_MM * 2));
                const imageRatio = pageW / pageH;
                const boxRatio = availableMmW / availableMmH;
                let drawMmW = availableMmW;
                let drawMmH = availableMmH;
                if (imageRatio > boxRatio) {
                    drawMmH = drawMmW / imageRatio;
                } else {
                    drawMmW = drawMmH * imageRatio;
                }
                const drawX = (pageMmW - drawMmW) / 2;
                const drawY = (pageMmH - drawMmH) / 2;
                pdf.addImage(imgData, 'PNG', drawX, drawY, drawMmW, drawMmH, undefined, 'FAST');
                exportedPages++;
            }
        } finally {
            if (originalSheetId && mode === 'all') {
                try {
                    window.activateProjectSheetById(originalSheetId, { skipCapture: true, resetHistory: false });
                    await waitForUiFrame(60);
                } catch (_) { }
            }
        }

        if (!pdf || exportedPages <= 0) {
            alert('فشل إنشاء ملف PDF.');
            return;
        }
        updateProjectLoadingOverlay('Finalizando PDF...', 'Preparando o arquivo para download.');
        await waitForNextPaint();
        pdf.save('projeto-cade.pdf');
    } catch (err) {
        console.error(err);
        alert('فشل تصدير ملف PDF.');
    } finally {
        if (finishPdfLoading) await finishPdfLoading();
    }
};

// Alias para compatibilidade
window.salvarImagem = window.exportarImagem;

// ===============================
// CARREGAR / LIMPAR
// ===============================
window.limparBancada = function () {
    if (blockProjectActionDuringSimulation()) return;
    document.querySelectorAll('.mode-workspace .component').forEach(c => {
        if (typeof window.interact === 'function') {
            try { window.interact(c).unset(); } catch (_) { }
        }
        c.remove();
    });
    document.querySelectorAll('.mode-workspace .mode-drawing-background-layer, .mode-workspace .mode-wire-layer, .mode-workspace .mode-panel-drawing-layer, .mode-workspace .mode-wire-top-layer').forEach(svg => {
        svg.innerHTML = '';
    });
    if (typeof setMenuMode === 'function' && typeof listaFios !== 'undefined') {
        const atual = (typeof menuMode !== 'undefined') ? menuMode : 'simbologia';
        setMenuMode('simbologia');
        if (Array.isArray(listaFios)) listaFios.length = 0;
        try {
            setMenuMode('2d');
            if (Array.isArray(listaFios)) listaFios.length = 0;
        } catch (err) {
            console.warn('Falha ao limpar a workspace 2D.', err);
        }
        setMenuMode(atual === '2d' ? '2d' : 'simbologia');
    } else if (typeof listaFios !== 'undefined' && Array.isArray(listaFios)) {
        listaFios.length = 0;
    }
    if (typeof renderWireJunctions === 'function') renderWireJunctions();
    if (typeof cancelarFio === 'function') cancelarFio();
    if (typeof window.scheduleCrossReferenceRefresh === 'function') {
        window.scheduleCrossReferenceRefresh();
    }
};

function obterBornesMapa() {
    const banc = document.getElementById('bancada');
    if (!banc) return [];
    const br = banc.getBoundingClientRect();
    return Array.from(document.querySelectorAll('#bancada .borne')).map(b => {
        const r = b.getBoundingClientRect();
        return {
            el: b,
            x: (r.left + r.width / 2 - br.left) / zoomLevel,
            y: (r.top + r.height / 2 - br.top) / zoomLevel
        };
    });
}

function obterBornesMapaDaWorkspace(mode) {
    const workspace = document.querySelector(`.mode-workspace[data-mode="${mode}"]`);
    const bancada = workspace?.querySelector('.mode-bancada');
    if (!workspace || !bancada) return [];

    const br = bancada.getBoundingClientRect();
    return Array.from(bancada.querySelectorAll('.borne')).map(b => {
        const r = b.getBoundingClientRect();
        return {
            el: b,
            x: (r.left + r.width / 2 - br.left) / zoomLevel,
            y: (r.top + r.height / 2 - br.top) / zoomLevel
        };
    });
}

function ligarPontasAoBorne(fio, bornes) {
    if (!fio?.points?.length) return { origem: null, destino: null };
    const inicio = fio.points[0];
    const fim = fio.points[fio.points.length - 1];

    const closest = (pt) => {
        let best = null;
        let min = 30;
        bornes.forEach(b => {
            const d = Math.hypot(pt.x - b.x, pt.y - b.y);
            if (d < min) {
                min = d;
                best = b.el;
            }
        });
        return best;
    };

    return {
        origem: closest(inicio),
        destino: closest(fim)
    };
}

function desenharFioSalvo(fio, bornes) {
    if (!fio?.points?.length) return;
    const ligados = ligarPontasAoBorne(fio, bornes);
    if (typeof window.createWireFromPoints === 'function') {
        const baseColor = sanitizeConfiguredWireColor(fio.configColor || fio.baseColor || fio.color, '#b71c1c');
        const createdWire = window.createWireFromPoints(
            fio.points.map(p => ({ x: p.x, y: p.y })),
            {
                id: fio.id || '',
                color: baseColor,
                baseColor,
                configColor: baseColor,
                width: (Number.isFinite(fio.width) && fio.width > 0) ? fio.width : undefined,
                origem: ligados.origem || null,
                destino: ligados.destino || null,
                number: fio.number || '',
                labelDx: Number.isFinite(fio.labelDx) ? fio.labelDx : 0,
                labelDy: Number.isFinite(fio.labelDy) ? fio.labelDy : 0,
                skip2DRestrictions: true
            }
        );
        if (createdWire?.element) {
            createdWire.configColor = baseColor;
            createdWire.baseColor = baseColor;
            createdWire.colorOriginal = baseColor;
            createdWire.element.style.stroke = baseColor;
            createdWire.element.dataset.originalColor = baseColor;
            createdWire.element.dataset.configColor = baseColor;
            if (typeof window.syncWireRenderAppearanceFromState === 'function') {
                window.syncWireRenderAppearanceFromState(createdWire);
            }
        }
        return;
    }
}

function desenharDesenhoSalvo(shape) {
    const layerName = String(shape?.layer || '').toLowerCase();
    const svg = (layerName === 'background' || layerName === 'back')
        ? document.getElementById('drawing-background-layer')
        : layerName === 'panel' || layerName === 'mounting'
            ? document.getElementById('panel-drawing-layer')
            : layerName === 'above'
                ? document.getElementById('wire-top-layer')
                : document.getElementById('wire-layer');
    if (!svg || !shape) return;
    const ns = 'http://www.w3.org/2000/svg';
    const type = String(shape.type || '').toLowerCase();
    let el = null;
    if (type === 'line') {
        el = document.createElementNS(ns, 'line');
        el.setAttribute('x1', shape.x1);
        el.setAttribute('y1', shape.y1);
        el.setAttribute('x2', shape.x2);
        el.setAttribute('y2', shape.y2);
    } else if (type === 'rect') {
        el = document.createElementNS(ns, 'rect');
        el.setAttribute('x', shape.x);
        el.setAttribute('y', shape.y);
        el.setAttribute('width', shape.width);
        el.setAttribute('height', shape.height);
    } else if (type === 'circle' || type === 'ellipse') {
        el = document.createElementNS(ns, 'ellipse');
        el.setAttribute('cx', shape.cx);
        el.setAttribute('cy', shape.cy);
        el.setAttribute('rx', shape.rx);
        el.setAttribute('ry', shape.ry);
    } else if (type === 'polygon') {
        el = document.createElementNS(ns, 'polygon');
        el.setAttribute('points', shape.points || '');
    } else if (type === 'text') {
        el = document.createElementNS(ns, 'text');
        el.setAttribute('x', shape.x);
        el.setAttribute('y', shape.y);
        el.textContent = shape.text || 'Texto';
        el.setAttribute('font-size', Number.isFinite(shape.fontSize) ? shape.fontSize : 18);
        el.setAttribute('font-family', shape.fontFamily || 'Segoe UI, sans-serif');
        el.setAttribute('font-weight', shape.fontWeight || '600');
    }
    if (!el) return;
    el.setAttribute('class', 'user-drawing');
    el.dataset.drawType = type;
    el.dataset.drawingLayer = (layerName === 'background' || layerName === 'back') ? 'background' : (layerName === 'panel' || layerName === 'mounting') ? 'panel' : layerName === 'above' ? 'above' : 'below';
    el.setAttribute('stroke', shape.stroke || '#2c3e50');
    el.setAttribute('stroke-width', Number.isFinite(shape.strokeWidth) ? shape.strokeWidth : 2);
    el.setAttribute('fill', shape.fill || 'none');
    if (Number.isFinite(shape.fillOpacity)) {
        el.setAttribute('fill-opacity', shape.fillOpacity);
    } else {
        el.removeAttribute('fill-opacity');
    }
    if (typeof window.refreshDrawingInteractionProfile === 'function') {
        window.refreshDrawingInteractionProfile(el);
    }
    svg.appendChild(el);
}

const EXAMPLE_CIRCUITS_MANIFEST_PATH = 'circuitos_exemplo/manifest.json';
const EXAMPLE_CIRCUITS_DEFAULT_BASE = 'circuitos_exemplo/';
const PROJECT_LOADING_OVERLAY_MIN_MS = 350;
let projectLoadingOverlayDepth = 0;
let projectLoadingOverlayShownAt = 0;

function getProjectLoadingOverlayRefs() {
    return {
        overlay: document.getElementById('project-loading-overlay'),
        title: document.getElementById('project-loading-title'),
        subtitle: document.getElementById('project-loading-subtitle')
    };
}

function waitForNextPaint() {
    return new Promise((resolve) => {
        requestAnimationFrame(() => {
            setTimeout(resolve, 0);
        });
    });
}

function showProjectLoadingOverlay(title = 'Carregando circuito...', subtitle = 'Aguarde enquanto o simulador prepara os componentes.') {
    const refs = getProjectLoadingOverlayRefs();
    if (!refs.overlay) return;
    projectLoadingOverlayDepth += 1;
    if (refs.title) refs.title.textContent = title;
    if (refs.subtitle) refs.subtitle.textContent = subtitle;
    refs.overlay.classList.add('is-visible');
    refs.overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('project-loading-active');
    projectLoadingOverlayShownAt = Date.now();
}

function updateProjectLoadingOverlay(title, subtitle) {
    const refs = getProjectLoadingOverlayRefs();
    if (refs.title && title) refs.title.textContent = title;
    if (refs.subtitle && subtitle) refs.subtitle.textContent = subtitle;
}
async function hideProjectLoadingOverlay() {
    const refs = getProjectLoadingOverlayRefs();
    if (!refs.overlay) return;
    projectLoadingOverlayDepth = Math.max(0, projectLoadingOverlayDepth - 1);
    if (projectLoadingOverlayDepth > 0) return;
    const elapsed = Date.now() - projectLoadingOverlayShownAt;
    const remaining = Math.max(0, PROJECT_LOADING_OVERLAY_MIN_MS - elapsed);
    if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
    }
    refs.overlay.classList.remove('is-visible');
    refs.overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('project-loading-active');
}

function beginProjectLoading(title, subtitle) {
    showProjectLoadingOverlay(title, subtitle);
    let closed = false;
    return async function finishProjectLoading() {
        if (closed) return;
        closed = true;
        await hideProjectLoadingOverlay();
    };
}

function normalizeExamplesBasePath(input) {
    const raw = String(input || '').trim().replace(/\\/g, '/');
    if (!raw) return EXAMPLE_CIRCUITS_DEFAULT_BASE;
    if (raw.includes('..')) return EXAMPLE_CIRCUITS_DEFAULT_BASE;
    if (raw.startsWith('/') || /^[a-z]+:/i.test(raw)) return EXAMPLE_CIRCUITS_DEFAULT_BASE;
    return raw.endsWith('/') ? raw : `${raw}/`;
}

function sanitizeExampleFilePath(fileName) {
    const raw = String(fileName || '').trim().replace(/\\/g, '/');
    if (!raw) return '';
    if (raw.includes('..')) return '';
    if (raw.startsWith('/') || raw.startsWith('./') || /^[a-z]+:/i.test(raw)) return '';
    if (!raw.toLowerCase().endsWith('.json')) return '';
    return raw;
}

function normalizeExamplesManifest(manifestRaw) {
    const manifest = (manifestRaw && typeof manifestRaw === 'object') ? manifestRaw : {};
    const circuitsRaw = Array.isArray(manifest.circuits)
        ? manifest.circuits
        : (Array.isArray(manifest.files) ? manifest.files : []);
    const basePath = normalizeExamplesBasePath(manifest.basePath || EXAMPLE_CIRCUITS_DEFAULT_BASE);

    const circuits = circuitsRaw
        .map((item, idx) => {
            const file = sanitizeExampleFilePath(item?.file || item?.path || '');
            if (!file) return null;
            return {
                id: String(item?.id || `example-${idx + 1}`).trim() || `example-${idx + 1}`,
                name: String(item?.name || '').trim() || file.replace(/\.json$/i, ''),
                description: String(item?.description || '').trim(),
                updatedAt: String(item?.updatedAt || '').trim(),
                file,
                href: `${basePath}${file}`
            };
        })
        .filter(Boolean);

    return { basePath, circuits };
}

function setExamplesListHtml(html) {
    const host = document.getElementById('examples-list');
    if (!host) return;
    host.innerHTML = html;
}

function renderExamplesLoading() {
    setExamplesListHtml('<div class="examples-empty">' + (window.SimuDzI18n?.t('examples.loading') || 'Carregando circuitos de exemplo...') + '</div>');
}

function renderExamplesEmpty(message = null) {
    setExamplesListHtml(`<div class="examples-empty">${message || (window.SimuDzI18n?.t('examples.empty') || 'Nenhum circuito de exemplo encontrado.')}</div>`);
}

function renderExamplesList(circuits) {
    const host = document.getElementById('examples-list');
    if (!host) return;
    host.innerHTML = '';
    if (!Array.isArray(circuits) || !circuits.length) {
        renderExamplesEmpty();
        return;
    }
    circuits.forEach(item => {
        const row = document.createElement('div');
        row.className = 'examples-item';

        const title = document.createElement('div');
        title.className = 'examples-item-title';
        title.textContent = window.SimuDzExamplesI18n?.getExampleText(item, 'name') || item.name || item.file;
        row.appendChild(title);
        const translatedDescription = window.SimuDzExamplesI18n?.getExampleText(item, 'description') || item.description;
        if (translatedDescription) {
            const desc = document.createElement('div');
            desc.className = 'examples-item-desc';
            desc.textContent = translatedDescription;
            row.appendChild(desc);
        }

        const meta = document.createElement('div');
        meta.className = 'examples-item-meta';
        meta.textContent = item.updatedAt
            ? (window.SimuDzI18n?.t('examples.fileMetaUpdated', { file: item.file, updatedAt: item.updatedAt }) || `Arquivo: ${item.file} | Atualizado: ${item.updatedAt}`)
            : (window.SimuDzI18n?.t('examples.fileMeta', { file: item.file }) || `Arquivo: ${item.file}`);
        row.appendChild(meta);

        const actions = document.createElement('div');
        actions.className = 'examples-item-actions';
        const openBtn = document.createElement('button');
        openBtn.type = 'button';
        openBtn.className = 'examples-open-btn';
        openBtn.textContent = window.SimuDzI18n?.t('project.open') || 'Abrir';
        openBtn.addEventListener('click', () => abrirCircuitoExemploArquivo(item));
        actions.appendChild(openBtn);
        row.appendChild(actions);
        host.appendChild(row);
    });
}

async function fetchExamplesManifest() {
    const response = await fetch(`${EXAMPLE_CIRCUITS_MANIFEST_PATH}?v=${Date.now()}`, { cache: 'no-cache' });
    if (!response.ok) {
        throw new Error('Nao foi possivel ler o manifest de exemplos.');
    }
    const json = await response.json();
    return normalizeExamplesManifest(json);
}

async function abrirCircuitoExemploArquivo(item) {
    if (!item?.href) return;
    const finishLoading = beginProjectLoading(
        'Carregando exemplo...',
        'Abrindo o circuito de exemplo e posicionando os componentes na folha.'
    );
    try {
        await waitForNextPaint();
        const response = await fetch(`${item.href}?v=${Date.now()}`, { cache: 'no-cache' });
        if (!response.ok) {
            throw new Error(`Falha ao abrir arquivo de exemplo (${response.status}).`);
        }
        const payload = await response.json();
        await scheduleApplyProjectPayload(payload);
        if (typeof window.recordHistoryCheckpoint === 'function') {
            window.recordHistoryCheckpoint('carregar_circuito_exemplo');
        }
        window.fecharCatalogoCircuitosExemplo();
    } catch (err) {
        console.error(err);
        alert('Nao foi possivel abrir o circuito de exemplo selecionado.');
    } finally {
        await finishLoading();
    }
}

window.abrirCatalogoCircuitosExemplo = async function () {
    if (blockProjectActionDuringSimulation()) return;
    const modal = document.getElementById('examples-modal');
    if (!modal) return;
    if (!modal.dataset.boundClose) {
        modal.addEventListener('mousedown', (e) => {
            if (e.target === modal) window.fecharCatalogoCircuitosExemplo();
        });
        modal.dataset.boundClose = '1';
    }
    modal.style.display = 'flex';
    renderExamplesLoading();
    try {
        const manifest = await fetchExamplesManifest();
        renderExamplesList(manifest.circuits || []);
    } catch (err) {
        console.error(err);
        renderExamplesEmpty(window.SimuDzI18n?.t('examples.loadError') || 'Falha ao carregar lista de exemplos.');
    }
};

window.fecharCatalogoCircuitosExemplo = function () {
    const modal = document.getElementById('examples-modal');
    if (!modal) return;
    modal.style.display = 'none';
};

window.carregarProjeto = function (input) {
    if (blockProjectActionDuringSimulation()) {
        if (input) input.value = '';
        return;
    }
    const file = input?.files?.[0];
    if (!file) return;
    if (Number.isFinite(file.size) && file.size > PROJECT_IMPORT_LIMITS.maxFileBytes) {
        alert('Arquivo de projeto muito grande para importar com seguranca.');
        input.value = '';
        return;
    }

    const finishLoading = beginProjectLoading(
        'Carregando circuito...',
        'Lendo o arquivo do projeto e restaurando a montagem no simulador.'
    );

    const reader = new FileReader();
    reader.onload = () => {
        try {
            const data = parseImportedProjectJsonText(reader.result);
            scheduleApplyProjectPayload(data)
                .then(() => {
                    if (typeof window.recordHistoryCheckpoint === 'function') {
                        window.recordHistoryCheckpoint('carregar_projeto');
                    }
                })
                .catch((err) => {
                    console.error(err);
                    alert(getProjectImportErrorMessage(err));
                })
                .finally(async () => {
                    input.value = '';
                    await finishLoading();
                });
            return;
        } catch (err) {
            console.error(err);
            input.value = '';
            alert(getProjectImportErrorMessage(err));
            finishLoading();
        }
    };
    reader.onerror = async () => {
        alert('Nao foi possivel ler o arquivo do projeto.');
        input.value = '';
        await finishLoading();
    };

    reader.readAsText(file);
};

(function installPerformanceWrappers() {
    const wrapWindowFn = (name, metricName = name) => {
        const original = window[name];
        if (typeof original !== 'function' || original.__perfWrapped) return;
        const wrapped = function (...args) {
            const done = (typeof window.__simPerfStart === 'function')
                ? window.__simPerfStart(metricName)
                : null;
            try {
                return original.apply(this, args);
            } finally {
                if (typeof done === 'function') done();
            }
        };
        wrapped.__perfWrapped = true;
        wrapped.__perfOriginal = original;
        window[name] = wrapped;
    };

    wrapWindowFn('renderWireJunctions');
    wrapWindowFn('rebindWireEndpoints');
    wrapWindowFn('renderWireLabels');
    wrapWindowFn('scheduleCrossReferenceRefresh');
})();














