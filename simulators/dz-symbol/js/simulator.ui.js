// =====================================================
// CADe Web ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â UI DEFINITIVA (TODOS OS BOTÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ES FUNCIONANDO)
// =====================================================

var ferramentaAtiva = null;
var zoomLevel = 1.0;
const MIN_ZOOM_LEVEL = 0.25;
const MAX_ZOOM_LEVEL = 3;
var panX = 0, panY = 0;
var isPanning = false;
var startPanX = 0, startPanY = 0;
var activePanPointerId = null;
var middleMousePanActive = false;
var pinchZoomActive = false;
var pinchStartDistance = 0;
var pinchStartZoom = 1;
var pinchStartWorldX = 0;
var pinchStartWorldY = 0;
var lastResponsiveMobile = null;
var simulando = false;
var menuMode = 'simbologia';
var activeWorkspaceMode = 'simbologia';
let categoriasAbertas = false;
const MENU_CLASSIFICATIONS = [
    { id: 'fontes', title: 'Pot\u00eancia', icon: 'fa-bolt' },
    { id: 'acionamentos', title: 'Acionamentos', icon: 'fa-toggle-on' },
    { id: 'protecao', title: 'Prote\u00e7\u00e3o', icon: 'fa-shield-halved' },
    { id: 'motores', title: 'Motores', icon: 'fa-fan' },
    { id: 'sensores', title: 'Sensores', icon: 'fa-satellite-dish' },
    { id: 'bobinas', title: 'Bobinas', icon: 'fa-magnet' },
    { id: 'outros', title: 'Outros', icon: 'fa-ellipsis' }
];
const modeWorkspaces = {};
const wiresByMode = { simbologia: null, '2d': null };
window.GRID_SIZE = window.GRID_SIZE || 20;
const GRID_SIZE = window.GRID_SIZE;
const MOBILE_BREAKPOINT = 900;
const SINALEIRO_CORES = ['branco', 'verde', 'vermelho', 'amarelo', 'azul'];
const IEC_LAMP_CORES = ['amarelo', 'vermelho', 'verde', 'azul', 'branco'];
const IEC_LAMP_COLOR_HEX = {
    amarelo: '#ffd000',
    vermelho: '#e74c3c',
    verde: '#2ecc71',
    azul: '#3498db',
    branco: '#f5f5f5'
};
const REAL_COMPONENT_SOUND_SOURCES = Object.freeze({
    botao_chave: './sons/botao_chave.mp3',
    contator: './sons/contator.mp3',
    rele: './sons/rele.mp3'
});
const ENGINEERING_MODE_AVAILABLE = (function () {
    if (typeof window.SimuDz_IS_LOCAL_ENV === 'boolean') return window.SimuDz_IS_LOCAL_ENV;
    const hostname = String(window.location.hostname || '').trim().toLowerCase();
    if (window.location.protocol === 'file:') return true;
    if (!hostname) return false;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname.endsWith('.local')) return true;
    if (/^10\./.test(hostname) || /^192\.168\./.test(hostname)) return true;
    const private172 = hostname.match(/^172\.(\d{1,3})\./);
    if (private172) {
        const secondOctet = Number(private172[1]);
        if (secondOctet >= 16 && secondOctet <= 31) return true;
    }
    return false;
}());
const realComponentSoundBases = new Map();

function syncEngineeringAvailabilityUI() {
    const controls = document.querySelectorAll('#btn-engineering-toggle, button[onclick*="toggleEngineeringMode"]');
    const panel = document.getElementById('engineering-panel');
    controls.forEach((node) => {
        node.hidden = !ENGINEERING_MODE_AVAILABLE;
        node.style.display = ENGINEERING_MODE_AVAILABLE ? '' : 'none';
    });
    if (panel) panel.style.display = ENGINEERING_MODE_AVAILABLE ? '' : 'none';
    document.body.classList.toggle('engineering-available', ENGINEERING_MODE_AVAILABLE);
}

function getRealComponentSoundBase(kind) {
    const src = REAL_COMPONENT_SOUND_SOURCES[kind];
    if (!src) return null;
    let base = realComponentSoundBases.get(kind);
    if (base) return base;
    base = new Audio(src);
    base.preload = 'auto';
    realComponentSoundBases.set(kind, base);
    return base;
}

function playRealComponentSound(kind) {
    const base = getRealComponentSoundBase(kind);
    if (!base) return;
    try {
        const audio = base.cloneNode();
        audio.volume = 0.9;
        const playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => { });
        }
    } catch (_) { }
}

function getRealComponentActivationSoundKind(comp, prevState, nextState) {
    const lib = String(comp?.dataset?.lib || '').trim().toLowerCase();
    const prev = String(prevState || '').trim().toLowerCase();
    const next = String(nextState || '').trim().toLowerCase();
    if (!lib.startsWith('real_')) return '';
    if (lib === 'real_contator' || lib === 'real_contator_forca') {
        const wasOn = !!prev;
        const isOn = !!next;
        return !wasOn && isOn ? 'contator' : '';
    }
    if (lib === 'real_temporizador') {
        return prev !== 'ativo' && next === 'ativo' ? 'rele' : '';
    }
    if (lib.startsWith('real_disjuntor_')) {
        return prev !== next ? 'botao_chave' : '';
    }
    if (lib === 'real_rele_termico') {
        return prev !== 'trip' && next === 'trip' ? 'rele' : '';
    }
    return '';
}

window.__playRealComponentSound = playRealComponentSound;
window.__playRealComponentStateSound = function (comp, prevState, nextState) {
    if (!simulando || !comp) return;
    const kind = getRealComponentActivationSoundKind(comp, prevState, nextState);
    if (kind) playRealComponentSound(kind);
};

let simulationInteractionLockOverlay = null;
let simulationInteractionLockHideTimer = null;
let simulationInteractionLockLastShownAt = 0;
const SIMULATION_LOCK_MESSAGE = 'Pare a simulacao para editar o projeto.';

function clearSimulationInteractionLockMessage() {
    if (simulationInteractionLockHideTimer) {
        clearTimeout(simulationInteractionLockHideTimer);
        simulationInteractionLockHideTimer = null;
    }
    if (simulationInteractionLockOverlay?.isConnected) simulationInteractionLockOverlay.remove();
    simulationInteractionLockOverlay = null;
}

function showSimulationInteractionLockMessage(message = SIMULATION_LOCK_MESSAGE) {
    const text = String(message || SIMULATION_LOCK_MESSAGE).trim() || SIMULATION_LOCK_MESSAGE;
    const now = Date.now();
    if (simulationInteractionLockOverlay?.isConnected && (now - simulationInteractionLockLastShownAt) < 900) return;
    simulationInteractionLockLastShownAt = now;
    clearSimulationInteractionLockMessage();
    simulationInteractionLockOverlay = document.createElement('div');
    simulationInteractionLockOverlay.textContent = text;
    Object.assign(simulationInteractionLockOverlay.style, {
        position: 'fixed',
        top: '86px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: '20050',
        padding: '10px 16px',
        borderRadius: '10px',
        background: 'rgba(22, 28, 36, 0.96)',
        color: '#f5f7fa',
        fontSize: '14px',
        fontWeight: '600',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 10px 26px rgba(0,0,0,0.28)',
        pointerEvents: 'none'
    });
    document.body.appendChild(simulationInteractionLockOverlay);
    simulationInteractionLockHideTimer = setTimeout(() => {
        clearSimulationInteractionLockMessage();
    }, 1800);
}

function isSimulationInteractiveComponent(componentEl) {
    if (!componentEl) return false;
    const lib = String(componentEl.dataset.lib || '').trim().toLowerCase();
    if (!lib || lib === 'real_regua_milimetrada') return false;
    if (componentEl.dataset.clickableSim === 'true') return true;
    if (/^real_botoeira_/.test(lib)) return true;
    if (/^iec_botao_/.test(lib)) return true;
    if (/^iec_botoeira_emergencia_/.test(lib)) return true;
    if (/^iec_chave_seletora_/.test(lib)) return true;
    return lib === 'real_chave_seletora' || lib === 'real_botoeira_emergencia';
}

function isSimulationAllowedTarget(target) {
    if (!target) return false;
    if (target.closest('#btn-play, #btn-pan, #btn-select, #sheet-toggle-topbar-btn')) return true;
    if (target.closest('#multimeter-fab, #multimeter-scene')) return true;
    if (target.closest('.toggle-state-btn, .manual-on-btn, .manual-off-btn, .rele-trip-btn, .rele-reset-btn')) return true;
    const componentEl = target.closest('.component');
    return isSimulationInteractiveComponent(componentEl);
}

function isViewportPanGestureAllowedDuringSimulation(e) {
    if (!simulando || !e?.target) return false;
    if (!isEventInsideViewport(e.target)) return false;
    if (ferramentaAtiva === 'pan') return true;
    return Number.isFinite(e?.button) && e.button === 1;
}
function isSimulationEditShortcutEvent(e, fromTextInput = false) {
    if (!simulando || fromTextInput) return false;
    const key = String(e.key || '').toLowerCase();
    if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'z', 'y', 'd', 's', 'o', 'p'].includes(key)) return true;
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'delete', 'backspace', 'enter'].includes(key)) return true;
    return e.code === 'Space';
}

function handleSimulationLockedAction(e, message = SIMULATION_LOCK_MESSAGE) {
    if (!simulando) return false;
    const target = e?.target;
    if (isSimulationAllowedTarget(target)) return false;
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (e && typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    showSimulationInteractionLockMessage(message);
    return true;
}

let simulationInteractionGuardsInstalled = false;
function installSimulationInteractionGuards() {
    if (simulationInteractionGuardsInstalled) return;
    simulationInteractionGuardsInstalled = true;
    const shouldBlockEvent = (e) => {
        const target = e?.target;
        if (!simulando || !target) return false;
        if (isSimulationAllowedTarget(target)) return false;
        if (isViewportPanGestureAllowedDuringSimulation(e)) return false;
        return !!target.closest('.sidebar, .top-bar, .sheet-bar, .engineering-panel, #viewport, .modal');
    };
    ['pointerdown', 'click', 'dblclick'].forEach((eventName) => {
        document.addEventListener(eventName, (e) => {
            if (!shouldBlockEvent(e)) return;
            handleSimulationLockedAction(e);
        }, true);
    });
}

function updateSimulationInteractionLockUi() {
    const lockedNodes = document.querySelectorAll('.top-bar button, .sidebar button, .sidebar .color-dot, .sidebar .wire-thickness-dot, .sheet-bar button, .engineering-panel button, .engineering-panel input, .engineering-panel textarea, .engineering-panel select, .engineering-panel label');
    lockedNodes.forEach((node) => {
        const allow = !!node.closest('#btn-play, #btn-pan, #btn-select, #sheet-toggle-topbar-btn, #btn-sidebar-toggle, #btn-commands-tools-toggle, #btn-zoom-out, #btn-zoom-in, #btn-reset-view, .top-link-btn');
        node.classList.toggle('sim-edit-locked-control', simulando && !allow);
        if (simulando && !allow) node.setAttribute('aria-disabled', 'true');
        else node.removeAttribute('aria-disabled');
    });
    syncMirroredSidebarControls();
}

window.__notifySimulationEditLocked = showSimulationInteractionLockMessage;
window.__clearSimulationEditLocked = clearSimulationInteractionLockMessage;
window.__handleSimulationLockedAction = handleSimulationLockedAction;
window.isEditingLockedDuringSimulation = function () {
    return !!simulando;
};
window.updateSimulationInteractionLockUi = updateSimulationInteractionLockUi;
const MENU_COMPONENT_DRAG_THRESHOLD = 6;
let sinaleiroModalTarget = null;
let iecLampModalTarget = null;
let symbolicComponentModalTarget = null;
let menuComponentDrag = null;
let selectMarquee = null;
let selectMarqueePointerId = null;
let selectMarqueeStart = null;
let selectMarqueeCurrent = null;
let selectMarqueeMoved = false;
let componentTapSuppressUntil = 0;
const MOBILE_DOUBLE_TAP_INTERVAL_MS = 320;
const MOBILE_DOUBLE_TAP_MAX_DELTA_PX = 18;
let lastMobileDoubleTapTarget = null;
let historyUndoStack = [];
let historyRedoStack = [];
let historyLastSnapshot = '';
let historyRestoreInProgress = false;
let historyCheckpointTimer = null;
let historyLastPointerUpCheckpointAt = 0;
const HISTORY_LIMIT = 80;
const HISTORY_MAX_ACTIVE_WIRES_FOR_HEAVY_CHECKPOINT = 420;
const HISTORY_MAX_ACTIVE_POINTS_FOR_HEAVY_CHECKPOINT = 14000;
const HISTORY_MAX_SNAPSHOT_CHARS = 2500000;
let drawingSession = null;
let polygonSession = null;
const selectedDrawings = new Set();
let drawingDragState = null;
let drawingStrokeColor = '#2c3e50';
let drawingStrokeWidth = 2;
let drawingFillColor = '#74b9ff';
let drawingFillEnabled = false;
let topbarToolsMenuOpen = false;
let mobileSidebarPanel = 'menu';
let mobileQuickActionPlacementState = null;
let primaryToolButtonPlacementState = null;
let topChromeCollapsed = false;
let drawingEditTarget = null;
let engineeringMode = false;
let engineeringShowBornes = false;
let engineeringShowTerminals = false;
let engineeringShowPerformance = false;
let engineeringShowIecDiagnostic = false;
const engineeringOverrides = new Map();
const ENGINEERING_BLOCK_START = '/* ENGINEERING_OVERRIDES_START */';
const ENGINEERING_BLOCK_END = '/* ENGINEERING_OVERRIDES_END */';
let projectSheets = [];

function bindMobileDoubleTap(targetEl, handler) {
    if (!targetEl || typeof handler !== 'function') return;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchMoved = false;

    targetEl.addEventListener('touchstart', (e) => {
        if ((e.touches?.length || 0) !== 1) {
            touchMoved = true;
            return;
        }
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchMoved = false;
    }, { passive: true });

    targetEl.addEventListener('touchmove', (e) => {
        const touch = e.touches?.[0];
        if (!touch) return;
        if (Math.hypot(touch.clientX - touchStartX, touch.clientY - touchStartY) > MOBILE_DOUBLE_TAP_MAX_DELTA_PX) {
            touchMoved = true;
        }
    }, { passive: true });

    targetEl.addEventListener('touchcancel', () => {
        touchMoved = true;
    }, { passive: true });

    targetEl.addEventListener('touchend', (e) => {
        if (simulando) return;
        if (typeof isMobileViewport === 'function' && !isMobileViewport()) return;
        if (touchMoved) return;

        const touch = e.changedTouches?.[0];
        if (!touch) return;

        const now = Date.now();
        const sameTarget = lastMobileDoubleTapTarget?.element === targetEl;
        const withinInterval = sameTarget && (now - lastMobileDoubleTapTarget.at) <= MOBILE_DOUBLE_TAP_INTERVAL_MS;
        const withinDelta = sameTarget && Math.hypot(
            touch.clientX - lastMobileDoubleTapTarget.x,
            touch.clientY - lastMobileDoubleTapTarget.y
        ) <= MOBILE_DOUBLE_TAP_MAX_DELTA_PX;

        if (withinInterval && withinDelta) {
            lastMobileDoubleTapTarget = null;
            if (e.cancelable) e.preventDefault();
            e.stopPropagation();
            handler(e);
            return;
        }

        lastMobileDoubleTapTarget = {
            element: targetEl,
            at: now,
            x: touch.clientX,
            y: touch.clientY
        };
    }, { passive: false });
}
let activeProjectSheetId = null;
let projectSheetIdSeed = 1;
let circuitClipboard = null;
let suppressWorkspaceAutoZoom = false;
let sheetConfigLogoDraftDataUrl = '';
let sheetConfigLogoDraftMeta = null;
let engineeringSheetScaleTargetActive = false;
let engineeringPerformanceRafId = 0;
let engineeringPerformanceObserver = null;
let wireIssueOverlay = null;
let wireIssueOverlayHideTimer = null;
const engineeringPerformanceMetrics = new Map();
const engineeringPerformanceState = {
    enabled: false,
    frameCount: 0,
    lastFpsSampleTs: 0,
    fps: 0,
    longTaskCount: 0,
    maxLongTaskMs: 0,
    lastLongTaskMs: 0,
    lastPanelUpdateAt: 0,
    recentEvents: []
};
const engineeringIecDiagnosticState = {
    enabled: false,
    stepId: 0,
    lines: []
};
const SHEET_DEFAULT_PAPER_SIZE = 'A4';
const SHEET_RENDER_PX_PER_MM = 3.77;
const ENGINEERING_SHEET_SCALE_VAR = '--project-sheet-scale-offset';
const SHEET_BASE_COLS = 17;
const SHEET_BASE_ROWS = 8;
const SHEET_BASE_SIZE_MM = { width: 420, height: 297 };
const SHEET_PAPER_SPECS_MM = {
    A2: { width: 594, height: 420 },
    A3: { width: 420, height: 297 },
    A4: { width: 297, height: 210 }
};
const SHEET_LOGO_ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const SHEET_LOGO_MAX_INPUT_BYTES = 5 * 1024 * 1024;
const SHEET_LOGO_MAX_OUTPUT_BYTES = 900 * 1024;
const SHEET_LOGO_OUTPUT_MIME = 'image/webp';
const SHEET_LOGO_OUTPUT_QUALITY = 0.86;
const SHEET_LOGO_MAX_OUTPUT_WIDTH = 640;
const SHEET_LOGO_MAX_OUTPUT_HEIGHT = 320;
const CROSS_REF_COIL_TYPES = new Set(['bobina', 'bobina_temporizada']);
const CROSS_REF_EXCLUDED_LIBS = new Set(['iec_setas_continuacao_3fnt']);
const CROSS_REF_CABLE_SEGMENT_LIBS = new Set(['iec_segmento_cabo_in', 'iec_segmento_cabo_out']);
let crossRefRefreshTimer = null;
let crossRefDragState = null;
let componentDragGuideActive = false;

function getWorkspaceDarkStorageKey() {
    const segment = document.body?.dataset?.simulatorSegment || 'simucir';
    return `simucir-workspace-dark-${segment}`;
}

function applyWorkspaceDarkModeState(enabled) {
    const active = !!enabled;
    document.body.classList.toggle('workspace-dark-mode', active);
    const toggle = document.getElementById('workspace-dark-toggle');
    if (toggle) toggle.checked = active;
}

function toggleWorkspaceDarkMode(forceState = null) {
    const current = document.body.classList.contains('workspace-dark-mode');
    const next = forceState === null ? !current : !!forceState;
    applyWorkspaceDarkModeState(next);
    try {
        localStorage.setItem(getWorkspaceDarkStorageKey(), next ? '1' : '0');
    } catch (_) { }
    return next;
}

window.toggleWorkspaceDarkMode = toggleWorkspaceDarkMode;

// =====================================================
// INIT
// =====================================================
window.addEventListener('load', () => {
    initModeWorkspaces();
    syncResponsiveState();
    syncPrimaryToolButtonPlacement();
    setupMobileSidebarAutoClose();
    setupTopbarToolsMenuAutoClose();
    syncTopChromeCollapsedUi();
    setMenuMode('simbologia');
    if (typeof window.setEspessuraFio === 'function') {
        window.setEspessuraFio(2, { preserveTool: true });
    }
    try {
        applyWorkspaceDarkModeState(localStorage.getItem(getWorkspaceDarkStorageKey()) === '1');
    } catch (_) {
        applyWorkspaceDarkModeState(false);
    }

    // ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“Ãƒâ€šÃ‚Â¶ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â Simular
    const btnPlay = document.getElementById('btn-play');
    if (btnPlay) btnPlay.onclick = toggleSimulacao;

    // ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚Â§Ãƒâ€šÃ‚Â° Ferramentas
    bindTool('select');
    bindTool('fio');
    bindTool('emenda');
    bindTool('borracha');
    bindTool('rotacao');
    bindTool('info');
    bindTool('pan');
    bindTool('draw-line');
    bindTool('draw-rect');
    bindTool('draw-circle');
    bindTool('draw-polygon');
    bindTool('draw-text');

    // ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Ãƒâ€šÃ‚Â¾ Salvar
    const btnSalvar = document.getElementById('btn-save');
    if (btnSalvar && typeof salvarProjeto === 'function') {
        btnSalvar.onclick = salvarProjeto;
    }

    // ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“Ãƒâ€šÃ‚Â¼ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â Salvar imagem
    const btnImg = document.getElementById('btn-save-img');
    if (btnImg && typeof salvarImagem === 'function') {
        btnImg.onclick = salvarImagem;
    }
    updateClipboardButtons();
    const drawColorInput = document.getElementById('draw-color-input');
    if (drawColorInput) setCorDesenho(drawColorInput.value);
    const drawFillColorInput = document.getElementById('draw-fill-color-input');
    if (drawFillColorInput) setCorPreenchimentoDesenho(drawFillColorInput.value);
    const drawFillToggleInput = document.getElementById('draw-fill-toggle-input');
    if (drawFillToggleInput) setPreenchimentoDesenhoAtivo(!!drawFillToggleInput.checked);
    const drawWidthSelect = document.getElementById('draw-width-select');
    if (drawWidthSelect) setEspessuraDesenho(drawWidthSelect.value);

    // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â Teclas
    document.addEventListener('keydown', e => {
        const key = String(e.key || '').toLowerCase();
        const fromTextInput = isTextInputTarget(e.target);
        if (isSimulationEditShortcutEvent(e, fromTextInput)) {
            e.preventDefault();
            showSimulationInteractionLockMessage();
            return;
        }

        if ((e.ctrlKey || e.metaKey) && key === 'z') {
            e.preventDefault();
            if (e.shiftKey) redoAcao();
            else undoAcao();
            return;
        }
        if ((e.ctrlKey || e.metaKey) && key === 'y') {
            e.preventDefault();
            redoAcao();
            return;
        }
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && key === 'c') {
            if (fromTextInput) return;
            const copied = copySelectedCircuitFragment();
            if (copied) e.preventDefault();
            return;
        }
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && key === 'v') {
            if (fromTextInput || simulando) return;
            const pasted = pasteCircuitClipboard();
            if (pasted) {
                e.preventDefault();
                scheduleHistoryCheckpoint('paste_selection');
            }
            return;
        }
        if ((e.ctrlKey || e.metaKey) && key === 'd' && !simulando) {
            if (!fromTextInput) {
                const duplicated = duplicateSelectedDrawings();
                if (duplicated) {
                    e.preventDefault();
                    scheduleHistoryCheckpoint('duplicate_drawing');
                }
            }
            return;
        }
        if (e.key === 'Escape') {
            if (polygonSession?.shape) {
                polygonSession.shape.remove();
                polygonSession = null;
                e.preventDefault();
                return;
            }
            const drawingEditModal = document.getElementById('drawing-edit-modal');
            if (drawingEditModal && drawingEditModal.style.display === 'flex') {
                closeDrawingEditModal();
                e.preventDefault();
                return;
            }
            closeTopbarToolsMenu();
            if (typeof cancelarFio === 'function') cancelarFio();
            ativarFerramenta('select');
        }
        if (!simulando && e.key === 'Enter' && polygonSession?.shape) {
            const finalized = finalizePolygonSession();
            if (finalized) {
                e.preventDefault();
                scheduleHistoryCheckpoint('add_polygon');
            }
            return;
        }
        if (e.code === 'Space') ativarFerramenta('pan');
        if (!simulando && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            if (!fromTextInput) {
                const moved = moveSelectedDrawingsByStep(e.key, e.shiftKey ? 5 : 1);
                if (moved) {
                    e.preventDefault();
                    scheduleHistoryCheckpoint('nudge_drawing');
                }
            }
        }
        if ((e.key === 'Delete' || e.key === 'Backspace') && !simulando) {
            if (fromTextInput) return;
            if (e.repeat) return;

            // Prioridade absoluta: delete de fios selecionados.
            // A rotina interna jÃƒÆ’Ã‚Â¡ considera seleÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o por memÃƒÆ’Ã‚Â³ria e por classe no DOM.
            const wiresChanged = (typeof window.deleteSelectedWires === 'function')
                ? !!window.deleteSelectedWires()
                : false;
            if (wiresChanged) {
                e.preventDefault();
                return;
            }

            const drawingsChanged = deleteSelectedDrawings();
            const componentsChanged = deleteSelectedComponents();
            if (drawingsChanged || componentsChanged) {
                e.preventDefault();
            }
        }
    });

    document.addEventListener('keyup', e => {
        if (!simulando && e.code === 'Space') ativarFerramenta('select');
    });

    // ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“Ãƒâ€šÃ‚Â±ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â Zoom / Pan
    const vp = document.getElementById('viewport');
    vp.addEventListener('wheel', e => {
        e.preventDefault();
        setZoom(zoomLevel + (e.deltaY < 0 ? 0.1 : -0.1), e.clientX, e.clientY);
    }, { passive: false });
    vp.addEventListener('touchstart', onTouchStartViewport, { passive: false, capture: true });
    vp.addEventListener('touchmove', onTouchMoveViewport, { passive: false, capture: true });
    vp.addEventListener('touchend', onTouchEndViewport, { passive: false, capture: true });
    vp.addEventListener('touchcancel', onTouchEndViewport, { passive: false, capture: true });
    vp.addEventListener('mousedown', onMouseDownMiddlePan, { capture: true });
    vp.addEventListener('auxclick', e => {
        if (e.button === 1) e.preventDefault();
    });

    vp.addEventListener('pointerdown', onPointerDownGlobal, { capture: true });
    window.addEventListener('pointermove', onPointerMoveGlobal);
    window.addEventListener('pointerup', onPointerUpGlobal);
    window.addEventListener('pointercancel', onPointerUpGlobal);
    window.addEventListener('mousemove', onMouseMoveMiddlePan);
    window.addEventListener('mouseup', onMouseUpMiddlePan);
    window.addEventListener('mousedown', onWindowMouseDownMiddlePan, true);
    initSelectionMarquee();
    initDrawingTools();

    const app = document.querySelector('.app-container');
    if (app) {
        if (isMobileViewport()) app.classList.remove('sidebar-hidden');
        else app.classList.remove('sidebar-open');
    }

    initSinaleiroModal();
    initIecLampModal();
    initSymbolicComponentPropsModal();
    initDrawingEditModal();
    updateDrawingEditButtonState();
    resetInlineEngineeringRuntimeVars();
    loadExistingEngineeringOverrides({ preserveExisting: false });
    syncEngineeringModeUI();
    recarregarVarsEngenharia();
    initProjectSheets();
    installSimulationInteractionGuards();
    updateSimulationInteractionLockUi();
    resetView();
    const engineeringVars = document.getElementById('engineering-vars');
    if (engineeringVars) {
        engineeringVars.addEventListener('input', () => {
            if (!engineeringMode) return;
            renderEngineeringSlidersFromTextarea();
        });
    }
    const engineeringShowBornesInput = document.getElementById('engineering-show-bornes');
    if (engineeringShowBornesInput) {
        engineeringShowBornesInput.checked = engineeringShowBornes;
        engineeringShowBornesInput.addEventListener('change', () => {
            setEngineeringBornesVisible(!!engineeringShowBornesInput.checked);
        });
    }
    const engineeringShowTerminalsInput = document.getElementById('engineering-show-terminals');
    if (engineeringShowTerminalsInput) {
        engineeringShowTerminalsInput.checked = engineeringShowTerminals;
        engineeringShowTerminalsInput.addEventListener('change', () => {
            setEngineeringTerminalsVisible(!!engineeringShowTerminalsInput.checked);
        });
    }
    const engineeringShowPerformanceInput = document.getElementById('engineering-show-performance');
    if (engineeringShowPerformanceInput) {
        engineeringShowPerformanceInput.checked = engineeringShowPerformance;
        engineeringShowPerformanceInput.addEventListener('change', () => {
            setEngineeringPerformanceVisible(!!engineeringShowPerformanceInput.checked);
        });
    }
    const engineeringShowIecDiagnosticInput = document.getElementById('engineering-show-iec-diagnostic');
    if (engineeringShowIecDiagnosticInput) {
        engineeringShowIecDiagnosticInput.checked = engineeringShowIecDiagnostic;
        engineeringShowIecDiagnosticInput.addEventListener('change', () => {
            setEngineeringIecDiagnosticVisible(!!engineeringShowIecDiagnosticInput.checked);
        });
    }
    initHistoryManager();
    scheduleCrossReferenceRefresh();
});

// =====================================================
// UTIL ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â bind de ferramenta
// =====================================================
function bindTool(nome) {
    const btn = document.getElementById(`btn-${nome}`) || (nome === 'fio' ? document.getElementById('btn-wire') : null);
    if (!btn) return;
    if (nome === 'select') {
        btn.onclick = () => ativarFerramenta(ferramentaAtiva === 'select' ? '' : 'select');
        return;
    }
    if (nome === 'fio') {
        btn.onclick = () => {
            if (simulando) return;
            if (ferramentaAtiva === 'fio') {
                if (typeof window.cancelarFio === 'function') window.cancelarFio();
                if (typeof window.setWireAssistEnabled === 'function') window.setWireAssistEnabled(false);
                if (typeof window.hideMouseGuides === 'function') window.hideMouseGuides();
                ativarFerramenta('select');
                return;
            }
            if (typeof window.setWireAssistEnabled === 'function') window.setWireAssistEnabled(false);
            ativarFerramenta('fio');
        };
        return;
    }
    if (nome === 'pan') {
        btn.onclick = () => ativarFerramenta(ferramentaAtiva === 'pan' ? 'select' : 'pan');
        return;
    }
    btn.onclick = () => ativarFerramenta(nome);
}

function isTextInputTarget(target) {
    const tag = String(target?.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || !!target?.isContentEditable;
}

function isDrawTool(nome = ferramentaAtiva) {
    return nome === 'draw-line' || nome === 'draw-rect' || nome === 'draw-circle' || nome === 'draw-polygon' || nome === 'draw-text';
}

function getComponentCursorForCurrentState(componentEl) {
    if (simulando) {
        return componentEl?.dataset?.clickableSim === 'true' ? 'pointer' : 'default';
    }
    return ferramentaAtiva === 'select' ? 'grab' : '';
}

function refreshComponentCursor(componentEl) {
    if (!componentEl) return;
    const next = getComponentCursorForCurrentState(componentEl);
    if (next) componentEl.style.cursor = next;
    else componentEl.style.removeProperty('cursor');
}

function refreshAllComponentCursors() {
    document.querySelectorAll('.component').forEach(refreshComponentCursor);
}

function rebindComponentDragInteractions(componentEl) {
    if (!componentEl || typeof window.interact !== 'function') return;
    try {
        window.interact(componentEl).unset();
    } catch (_) { }
    initInteractDrag(componentEl);
}

function getDrawBackgroundLayer() {
    return document.getElementById('drawing-background-layer');
}

function getDrawLayer() {
    return document.getElementById('wire-layer');
}

function getDrawPanelLayer() {
    return document.getElementById('panel-drawing-layer');
}

function getDrawTopLayer() {
    return document.getElementById('wire-top-layer');
}

function normalizeDrawingLayerName(layerName = 'below') {
    const value = String(layerName || '').toLowerCase();
    if (value === 'background' || value === 'back') return 'background';
    if (value === 'panel' || value === 'mounting') return 'panel';
    if (value === 'above' || value === 'front') return 'above';
    return 'below';
}

function getDrawingLayerName(el) {
    if (el?.closest?.('.mode-drawing-background-layer')) return 'background';
    if (el?.closest?.('.mode-panel-drawing-layer')) return 'panel';
    return el?.closest?.('.mode-wire-top-layer') ? 'above' : 'below';
}

function getDrawingLayerByName(layerName = 'below') {
    const normalized = normalizeDrawingLayerName(layerName);
    if (normalized === 'background') return getDrawBackgroundLayer();
    if (normalized === 'panel') return getDrawPanelLayer();
    if (normalized === 'above') return getDrawTopLayer();
    return getDrawLayer();
}

function getDrawingLayers() {
    return [getDrawBackgroundLayer(), getDrawLayer(), getDrawPanelLayer(), getDrawTopLayer()].filter(Boolean);
}

const FRONTAL_BASE_COMPONENT_LIBS = new Set([
    'real_botoeira_verde_frontal',
    'real_botoeira_vermelha_frontal',
    'real_botoeira_emergencia_frontal',
    'real_chave_seletora_frontal'
]);
let frontalBaseSyncFrame = 0;
let frontalBaseObservers = [];

function ensureFrontalBaseLayer(workspace) {
    if (!workspace) return null;
    let layer = workspace.querySelector('.mode-frontal-base-layer');
    if (layer) return layer;
    layer = document.createElement('div');
    layer.className = 'mode-frontal-base-layer';
    workspace.appendChild(layer);
    return layer;
}

const FRONTAL_BASE_OVERLAY_STYLE_PROPS = [
    'position', 'left', 'top', 'right', 'bottom', 'width', 'height',
    'min-width', 'max-width', 'padding', 'margin', 'transform', 'transform-origin',
    'display', 'align-items', 'justify-content', 'font-family', 'font-size', 'font-weight',
    'line-height', 'color', 'background', 'border', 'border-radius', 'box-shadow',
    'white-space', 'text-align', 'z-index', 'opacity'
];

function cloneFrontalBaseOverlayElement(source) {
    if (!source) return null;
    const clone = source.cloneNode(true);
    const computed = window.getComputedStyle(source);
    FRONTAL_BASE_OVERLAY_STYLE_PROPS.forEach((property) => {
        const value = computed.getPropertyValue(property);
        if (value) clone.style.setProperty(property, value);
    });
    clone.style.setProperty('visibility', 'visible');
    clone.style.setProperty('pointer-events', 'none');
    return clone;
}

function syncFrontalBaseLayers() {
    frontalBaseSyncFrame = 0;
    document.querySelectorAll('.mode-workspace').forEach((workspace) => {
        const layer = ensureFrontalBaseLayer(workspace);
        const bancada = workspace.querySelector('.mode-bancada');
        if (!layer || !bancada) return;
        layer.replaceChildren();
        bancada.querySelectorAll('.component').forEach((componentEl) => {
            const lib = String(componentEl.dataset.lib || '');
            if (!FRONTAL_BASE_COMPONENT_LIBS.has(lib)) return;
            const sourceBase = componentEl.querySelector('.real-botoeira-frontal-base, .real-chave-seletora-frontal-base');
            const sourceWrap = sourceBase?.parentElement;
            if (!sourceBase || !sourceWrap) return;

            const portal = document.createElement('div');
            portal.className = 'frontal-base-portal';
            portal.dataset.lib = lib;
            portal.style.cssText = componentEl.style.cssText;

            const wrap = sourceWrap.cloneNode(false);
            wrap.removeAttribute('id');
            wrap.appendChild(sourceBase.cloneNode(true));
            sourceWrap.querySelectorAll('.pin-label').forEach((label) => {
                const clone = cloneFrontalBaseOverlayElement(label);
                if (clone) wrap.appendChild(clone);
            });
            portal.appendChild(wrap);

            const sourceTag = componentEl.querySelector(':scope > .tag-label');
            const tagClone = cloneFrontalBaseOverlayElement(sourceTag);
            if (tagClone) portal.appendChild(tagClone);
            layer.appendChild(portal);
        });
    });
    document.body?.classList.add('frontal-base-portals-ready');
}

function scheduleFrontalBaseLayerSync() {
    if (frontalBaseSyncFrame) return;
    frontalBaseSyncFrame = requestAnimationFrame(syncFrontalBaseLayers);
}

function initFrontalBaseLayerSync() {
    frontalBaseObservers.forEach(observer => observer.disconnect());
    frontalBaseObservers = [];
    document.querySelectorAll('.mode-workspace').forEach((workspace) => {
        ensureFrontalBaseLayer(workspace);
        const bancada = workspace.querySelector('.mode-bancada');
        if (!bancada) return;
        const observer = new MutationObserver(scheduleFrontalBaseLayerSync);
        observer.observe(bancada, {
            subtree: true,
            childList: true,
            characterData: true,
            attributes: true,
            attributeFilter: ['style', 'data-lib']
        });
        frontalBaseObservers.push(observer);
    });
    scheduleFrontalBaseLayerSync();
}

window.scheduleFrontalBaseLayerSync = scheduleFrontalBaseLayerSync;

function snapToGrid(v) {
    return Math.round(v / GRID_SIZE) * GRID_SIZE;
}

function isFreeMoveComponentLib(libKey) {
    return String(libKey || '').trim().toLowerCase() === 'real_regua_milimetrada';
}

function isFreeMoveComponent(componentEl) {
    return isFreeMoveComponentLib(componentEl?.dataset?.lib);
}

function setCorDesenho(color) {
    drawingStrokeColor = String(color || '#2c3e50');
    ['draw-color-input', 'draw-color-input-sidebar'].forEach((id) => {
        const input = document.getElementById(id);
        if (input) input.value = drawingStrokeColor;
    });
}

function setEspessuraDesenho(width) {
    const w = parseFloat(width);
    drawingStrokeWidth = Number.isFinite(w) && w > 0 ? w : 2;
    ['draw-width-select', 'draw-width-select-sidebar'].forEach((id) => {
        const input = document.getElementById(id);
        if (input) input.value = String(drawingStrokeWidth);
    });
}

function setCorPreenchimentoDesenho(color) {
    drawingFillColor = String(color || '#74b9ff');
    ['draw-fill-color-input', 'draw-fill-color-input-sidebar'].forEach((id) => {
        const input = document.getElementById(id);
        if (input) input.value = drawingFillColor;
    });
    applyFillSettingsToActiveDrawings();
}

function setPreenchimentoDesenhoAtivo(enabled) {
    drawingFillEnabled = !!enabled;
    ['draw-fill-toggle-input', 'draw-fill-toggle-input-sidebar'].forEach((id) => {
        const input = document.getElementById(id);
        if (input) input.checked = drawingFillEnabled;
    });
    const sidebarTile = document.getElementById('draw-fill-tile-sidebar');
    if (sidebarTile) sidebarTile.classList.toggle('ativo', drawingFillEnabled);
    applyFillSettingsToActiveDrawings();
}

window.setCorDesenho = setCorDesenho;
window.setEspessuraDesenho = setEspessuraDesenho;
window.setCorPreenchimentoDesenho = setCorPreenchimentoDesenho;
window.setPreenchimentoDesenhoAtivo = setPreenchimentoDesenhoAtivo;
window.refreshDrawingInteractionProfile = refreshDrawingInteractionProfile;
window.refreshAllComponentCursors = refreshAllComponentCursors;

function normalizeIecLampColor(color) {
    const c = String(color || '').trim().toLowerCase();
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c)) return c;
    return IEC_LAMP_CORES.includes(c) ? c : 'amarelo';
}

function applyIecLampColorToComponent(componentEl, color) {
    if (!componentEl || componentEl.dataset.lib !== 'iec_lampada') return;
    const normalized = normalizeIecLampColor(color || componentEl.dataset.lampColor || 'amarelo');
    componentEl.dataset.lampColor = normalized;
    const hex = IEC_LAMP_COLOR_HEX[normalized] || normalized || IEC_LAMP_COLOR_HEX.amarelo;
    componentEl.style.setProperty('--iec-lamp-color', hex);
}

window.applyIecLampColorToComponent = applyIecLampColorToComponent;

function clearDrawingSelection() {
    selectedDrawings.forEach(el => el?.classList?.remove('selected'));
    selectedDrawings.clear();
    updateDrawingEditButtonState();
}

function selectDrawing(el, additive = false) {
    if (!el) return;
    if (!additive) clearDrawingSelection();
    if (additive && selectedDrawings.has(el)) {
        selectedDrawings.delete(el);
        el.classList.remove('selected');
        return;
    }
    selectedDrawings.add(el);
    el.classList.add('selected');
    updateDrawingEditButtonState();
}

function removeDrawingElement(el) {
    if (!el) return false;
    selectedDrawings.delete(el);
    el.remove();
    updateDrawingEditButtonState();
    return true;
}

function deleteSelectedDrawings() {
    if (!selectedDrawings.size) return false;
    const toDelete = Array.from(selectedDrawings);
    clearDrawingSelection();
    toDelete.forEach(el => el.remove());
    updateDrawingEditButtonState();
    return toDelete.length > 0;
}

function getSingleSelectedDrawing() {
    return selectedDrawings.size === 1 ? Array.from(selectedDrawings)[0] : null;
}

function updateDrawingEditButtonState() {
    const btn = document.getElementById('btn-edit-drawing');
    const hasAnyDrawingSelected = selectedDrawings.size > 0;
    if (btn) btn.disabled = simulando || !getSingleSelectedDrawing();
    ['btn-drawing-down', 'btn-drawing-up'].forEach((id) => {
        const layerBtn = document.getElementById(id);
        if (layerBtn) layerBtn.disabled = simulando || !hasAnyDrawingSelected;
    });
    syncMirroredSidebarControls();
}

function readNumInput(id, fallback = 0) {
    const el = document.getElementById(id);
    if (!el) return fallback;
    const v = parseFloat(el.value);
    return Number.isFinite(v) ? v : fallback;
}

function parsePolygonPointsAttr(pointsAttr) {
    const raw = String(pointsAttr || '').trim();
    if (!raw) return [];
    return raw
        .split(/\s+/)
        .map(pair => pair.split(',').map(Number))
        .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))
        .map(([x, y]) => ({ x, y }));
}

function polygonPointsToAttr(points = []) {
    return points.map(p => `${p.x},${p.y}`).join(' ');
}

function updatePolygonPreview() {
    if (!polygonSession?.shape) return;
    const pts = polygonSession.points || [];
    const temp = polygonSession.tempPoint;
    const all = temp ? [...pts, temp] : pts;
    polygonSession.shape.setAttribute('points', polygonPointsToAttr(all));
}

function isNearPolygonStartPoint(point, threshold = (GRID_SIZE * 0.75)) {
    if (!polygonSession?.points?.length || !point) return false;
    const first = polygonSession.points[0];
    if (!first) return false;
    const dx = point.x - first.x;
    const dy = point.y - first.y;
    return Math.hypot(dx, dy) <= threshold;
}

function finalizePolygonSession() {
    if (!polygonSession?.shape) return false;
    const pts = polygonSession.points || [];
    if (pts.length < 3) {
        polygonSession.shape.remove();
        polygonSession = null;
        return false;
    }
    polygonSession.shape.classList.remove('drawing-preview');
    polygonSession.shape.dataset.drawType = 'polygon';
    polygonSession.shape.setAttribute('points', polygonPointsToAttr(pts));
    refreshDrawingInteractionProfile(polygonSession.shape);
    clearDrawingSelection();
    selectDrawing(polygonSession.shape, false);
    polygonSession = null;
    return true;
}

function openDrawingEditModal() {
    const modal = document.getElementById('drawing-edit-modal');
    const target = getSingleSelectedDrawing();
    if (!modal || !target) return;

    drawingEditTarget = target;
    const type = String(target.dataset.drawType || '').toLowerCase();

    const typeInput = document.getElementById('drawing-edit-type');
    const strokeInput = document.getElementById('drawing-edit-stroke');
    const strokeWidthInput = document.getElementById('drawing-edit-stroke-width');
    const fillEnabledInput = document.getElementById('drawing-edit-fill-enabled');
    const fillInput = document.getElementById('drawing-edit-fill');

    if (typeInput) typeInput.value = type;
    if (strokeInput) strokeInput.value = target.getAttribute('stroke') || '#2c3e50';
    if (strokeWidthInput) strokeWidthInput.value = String(parseFloat(target.getAttribute('stroke-width') || '2') || 2);
    if (fillEnabledInput) fillEnabledInput.checked = (target.getAttribute('fill') || 'none') !== 'none';
    if (fillInput) fillInput.value = ((target.getAttribute('fill') || '#74b9ff').toLowerCase() === 'none') ? '#74b9ff' : (target.getAttribute('fill') || '#74b9ff');

    const lineFields = document.getElementById('drawing-edit-line-fields');
    const rectFields = document.getElementById('drawing-edit-rect-fields');
    const ellipseFields = document.getElementById('drawing-edit-ellipse-fields');
    const polygonFields = document.getElementById('drawing-edit-polygon-fields');
    const textFields = document.getElementById('drawing-edit-text-fields');
    if (lineFields) lineFields.style.display = type === 'line' ? 'grid' : 'none';
    if (rectFields) rectFields.style.display = type === 'rect' ? 'grid' : 'none';
    if (ellipseFields) ellipseFields.style.display = (type === 'circle' || type === 'ellipse') ? 'grid' : 'none';
    if (polygonFields) polygonFields.style.display = type === 'polygon' ? 'grid' : 'none';
    if (textFields) textFields.style.display = type === 'text' ? 'grid' : 'none';

    if (type === 'line') {
        const x1 = document.getElementById('drawing-edit-x1');
        const y1 = document.getElementById('drawing-edit-y1');
        const x2 = document.getElementById('drawing-edit-x2');
        const y2 = document.getElementById('drawing-edit-y2');
        if (x1) x1.value = target.getAttribute('x1') || '0';
        if (y1) y1.value = target.getAttribute('y1') || '0';
        if (x2) x2.value = target.getAttribute('x2') || '0';
        if (y2) y2.value = target.getAttribute('y2') || '0';
    } else if (type === 'rect') {
        const x = document.getElementById('drawing-edit-x');
        const y = document.getElementById('drawing-edit-y');
        const w = document.getElementById('drawing-edit-width');
        const h = document.getElementById('drawing-edit-height');
        if (x) x.value = target.getAttribute('x') || '0';
        if (y) y.value = target.getAttribute('y') || '0';
        if (w) w.value = target.getAttribute('width') || '20';
        if (h) h.value = target.getAttribute('height') || '20';
    } else if (type === 'polygon') {
        const p = document.getElementById('drawing-edit-polygon-points');
        if (p) p.value = target.getAttribute('points') || '';
    } else if (type === 'text') {
        const tx = document.getElementById('drawing-edit-text-x');
        const ty = document.getElementById('drawing-edit-text-y');
        const tsize = document.getElementById('drawing-edit-text-size');
        const tcontent = document.getElementById('drawing-edit-text-content');
        if (tx) tx.value = target.getAttribute('x') || '0';
        if (ty) ty.value = target.getAttribute('y') || '0';
        if (tsize) tsize.value = target.getAttribute('font-size') || '18';
        if (tcontent) tcontent.value = target.textContent || '';
    } else {
        const cx = document.getElementById('drawing-edit-cx');
        const cy = document.getElementById('drawing-edit-cy');
        const rx = document.getElementById('drawing-edit-rx');
        const ry = document.getElementById('drawing-edit-ry');
        if (cx) cx.value = target.getAttribute('cx') || '0';
        if (cy) cy.value = target.getAttribute('cy') || '0';
        if (rx) rx.value = target.getAttribute('rx') || '10';
        if (ry) ry.value = target.getAttribute('ry') || '10';
    }

    modal.style.display = 'flex';
}

function closeDrawingEditModal() {
    const modal = document.getElementById('drawing-edit-modal');
    if (modal) modal.style.display = 'none';
    drawingEditTarget = null;
}

function applyDrawingEditFromModal() {
    const target = drawingEditTarget || getSingleSelectedDrawing();
    if (!target) return;
    const type = String(target.dataset.drawType || '').toLowerCase();

    const stroke = document.getElementById('drawing-edit-stroke')?.value || '#2c3e50';
    const strokeWidth = Math.max(1, readNumInput('drawing-edit-stroke-width', 2));
    const fillEnabled = !!document.getElementById('drawing-edit-fill-enabled')?.checked;
    const fillColor = document.getElementById('drawing-edit-fill')?.value || '#74b9ff';

    if (type === 'text') {
        target.setAttribute('fill', stroke);
        target.setAttribute('stroke', 'none');
        target.removeAttribute('stroke-width');
    } else {
        target.setAttribute('stroke', stroke);
        target.setAttribute('stroke-width', String(strokeWidth));
    }

    if (type === 'line') {
        target.setAttribute('x1', String(snapToGrid(readNumInput('drawing-edit-x1', 0))));
        target.setAttribute('y1', String(snapToGrid(readNumInput('drawing-edit-y1', 0))));
        target.setAttribute('x2', String(snapToGrid(readNumInput('drawing-edit-x2', 0))));
        target.setAttribute('y2', String(snapToGrid(readNumInput('drawing-edit-y2', 0))));
    } else if (type === 'rect') {
        target.setAttribute('x', String(snapToGrid(readNumInput('drawing-edit-x', 0))));
        target.setAttribute('y', String(snapToGrid(readNumInput('drawing-edit-y', 0))));
        target.setAttribute('width', String(Math.max(1, snapToGrid(readNumInput('drawing-edit-width', GRID_SIZE)))));
        target.setAttribute('height', String(Math.max(1, snapToGrid(readNumInput('drawing-edit-height', GRID_SIZE)))));
    } else if (type === 'polygon') {
        const parsed = parsePolygonPointsAttr(document.getElementById('drawing-edit-polygon-points')?.value || '');
        if (parsed.length >= 3) {
            const snapped = parsed.map(p => ({ x: snapToGrid(p.x), y: snapToGrid(p.y) }));
            target.setAttribute('points', polygonPointsToAttr(snapped));
        }
    } else if (type === 'text') {
        target.setAttribute('x', String(snapToGrid(readNumInput('drawing-edit-text-x', 0))));
        target.setAttribute('y', String(snapToGrid(readNumInput('drawing-edit-text-y', 0))));
        target.setAttribute('font-size', String(Math.max(8, readNumInput('drawing-edit-text-size', 18))));
        target.textContent = (document.getElementById('drawing-edit-text-content')?.value || '').trim() || 'Texto';
    } else {
        target.setAttribute('cx', String(snapToGrid(readNumInput('drawing-edit-cx', 0))));
        target.setAttribute('cy', String(snapToGrid(readNumInput('drawing-edit-cy', 0))));
        target.setAttribute('rx', String(Math.max(1, snapToGrid(readNumInput('drawing-edit-rx', GRID_SIZE / 2)))));
        target.setAttribute('ry', String(Math.max(1, snapToGrid(readNumInput('drawing-edit-ry', GRID_SIZE / 2)))));
    }

    if (fillEnabled && type !== 'line' && type !== 'text') {
        target.setAttribute('fill', fillColor);
        target.setAttribute('fill-opacity', '1');
    } else if (type !== 'text') {
        target.setAttribute('fill', 'none');
        target.removeAttribute('fill-opacity');
    }
    refreshDrawingInteractionProfile(target);
    closeDrawingEditModal();
    scheduleHistoryCheckpoint('edit_drawing');
}

window.abrirModalEdicaoDesenho = openDrawingEditModal;
window.fecharModalEdicaoDesenho = closeDrawingEditModal;

function applyFillToDrawingElement(el) {
    if (!el) return;
    const type = String(el?.dataset?.drawType || '').toLowerCase();
    const isFillable = type === 'rect' || type === 'circle' || type === 'ellipse' || type === 'polygon';
    if (!isFillable) {
        if (type === 'text') return;
        el.setAttribute('fill', 'none');
        el.removeAttribute('fill-opacity');
        el.setAttribute('pointer-events', type === 'line' ? 'bounding-box' : 'stroke');
        return;
    }
    if (drawingFillEnabled) {
        el.setAttribute('fill', drawingFillColor);
        el.setAttribute('fill-opacity', '1');
        el.setAttribute('pointer-events', 'all');
    } else {
        el.setAttribute('fill', 'none');
        el.removeAttribute('fill-opacity');
        el.setAttribute('pointer-events', 'stroke');
    }
}

function refreshDrawingInteractionProfile(el) {
    if (!el) return;
    const type = String(el?.dataset?.drawType || '').toLowerCase();
    if (type === 'line') {
        // Facilita clique/arraste de linha fina.
        el.setAttribute('pointer-events', 'bounding-box');
        return;
    }
    if (type === 'text') {
        el.setAttribute('pointer-events', 'bounding-box');
        return;
    }
    if (type === 'polygon') {
        const fill = String(el.getAttribute('fill') || '').toLowerCase();
        el.setAttribute('pointer-events', fill && fill !== 'none' ? 'all' : 'stroke');
        return;
    }
    const fill = String(el.getAttribute('fill') || '').toLowerCase();
    el.setAttribute('pointer-events', fill && fill !== 'none' ? 'all' : 'stroke');
}

function applyFillSettingsToActiveDrawings() {
    if (drawingSession?.shape) {
        applyFillToDrawingElement(drawingSession.shape);
        refreshDrawingInteractionProfile(drawingSession.shape);
    }
    selectedDrawings.forEach(el => {
        applyFillToDrawingElement(el);
        refreshDrawingInteractionProfile(el);
    });
}

function duplicateSelectedDrawings() {
    if (!selectedDrawings.size) return false;

    const shift = GRID_SIZE;
    const originals = Array.from(selectedDrawings);
    clearDrawingSelection();

    originals.forEach(orig => {
        const copy = orig.cloneNode(false);
        copy.classList.remove('drawing-preview');
        copy.classList.remove('selected');

        const type = String(copy?.dataset?.drawType || '').toLowerCase();
        if (type === 'line') {
            copy.setAttribute('x1', snapToGrid((parseFloat(orig.getAttribute('x1')) || 0) + shift));
            copy.setAttribute('y1', snapToGrid((parseFloat(orig.getAttribute('y1')) || 0) + shift));
            copy.setAttribute('x2', snapToGrid((parseFloat(orig.getAttribute('x2')) || 0) + shift));
            copy.setAttribute('y2', snapToGrid((parseFloat(orig.getAttribute('y2')) || 0) + shift));
        } else if (type === 'rect') {
            copy.setAttribute('x', snapToGrid((parseFloat(orig.getAttribute('x')) || 0) + shift));
            copy.setAttribute('y', snapToGrid((parseFloat(orig.getAttribute('y')) || 0) + shift));
        } else if (type === 'polygon') {
            const moved = parsePolygonPointsAttr(orig.getAttribute('points') || '')
                .map(p => ({ x: snapToGrid(p.x + shift), y: snapToGrid(p.y + shift) }));
            copy.setAttribute('points', polygonPointsToAttr(moved));
        } else if (type === 'text') {
            copy.setAttribute('x', snapToGrid((parseFloat(orig.getAttribute('x')) || 0) + shift));
            copy.setAttribute('y', snapToGrid((parseFloat(orig.getAttribute('y')) || 0) + shift));
            copy.textContent = orig.textContent || 'Texto';
        } else {
            copy.setAttribute('cx', snapToGrid((parseFloat(orig.getAttribute('cx')) || 0) + shift));
            copy.setAttribute('cy', snapToGrid((parseFloat(orig.getAttribute('cy')) || 0) + shift));
        }
        const svg = getDrawingLayerByName(getDrawingLayerName(orig));
        if (!svg) return;
        svg.appendChild(copy);
        copy.dataset.drawingLayer = getDrawingLayerName(copy);
        refreshDrawingInteractionProfile(copy);
        selectDrawing(copy, true);
    });

    return true;
}

function moveSelectedDrawingsByStep(key, step = 1) {
    if (!selectedDrawings.size) return false;
    const amount = Math.max(1, parseInt(step, 10) || 1) * GRID_SIZE;
    let dx = 0;
    let dy = 0;

    if (key === 'ArrowLeft') dx = -amount;
    if (key === 'ArrowRight') dx = amount;
    if (key === 'ArrowUp') dy = -amount;
    if (key === 'ArrowDown') dy = amount;
    if (!dx && !dy) return false;

    Array.from(selectedDrawings).forEach(el => {
        const base = readDrawingGeometry(el);
        applyDrawingTranslation(el, base, dx, dy);
    });
    return true;
}

function createDrawingElement(tipo) {
    const svg = getDrawLayer();
    if (!svg) return null;
    const ns = 'http://www.w3.org/2000/svg';
    let el = null;
    if (tipo === 'draw-line') el = document.createElementNS(ns, 'line');
    if (tipo === 'draw-rect') el = document.createElementNS(ns, 'rect');
    if (tipo === 'draw-circle') el = document.createElementNS(ns, 'ellipse');
    if (tipo === 'draw-polygon') el = document.createElementNS(ns, 'polygon');
    if (tipo === 'draw-text') el = document.createElementNS(ns, 'text');
    if (!el) return null;
    el.setAttribute('class', 'user-drawing');
    el.dataset.drawType = tipo.replace('draw-', '');
    if (tipo === 'draw-text') {
        el.setAttribute('fill', drawingStrokeColor);
        el.setAttribute('font-size', '18');
        el.setAttribute('font-family', 'Segoe UI, sans-serif');
        el.setAttribute('font-weight', '600');
        el.setAttribute('stroke', 'none');
        el.textContent = 'Texto';
    } else {
        el.setAttribute('stroke', drawingStrokeColor);
        el.setAttribute('stroke-width', drawingStrokeWidth);
        applyFillToDrawingElement(el);
    }
    refreshDrawingInteractionProfile(el);
    return el;
}

function updateDrawingElementGeometry(el, tipo, start, end) {
    if (!el || !start || !end) return;
    const x1 = snapToGrid(start.x);
    const y1 = snapToGrid(start.y);
    const x2 = snapToGrid(end.x);
    const y2 = snapToGrid(end.y);

    if (tipo === 'draw-line') {
        el.setAttribute('x1', x1);
        el.setAttribute('y1', y1);
        el.setAttribute('x2', x2);
        el.setAttribute('y2', y2);
        return;
    }

    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);

    if (tipo === 'draw-rect') {
        el.setAttribute('x', left);
        el.setAttribute('y', top);
        el.setAttribute('width', width);
        el.setAttribute('height', height);
        return;
    }

    if (tipo === 'draw-circle') {
        el.setAttribute('cx', left + (width / 2));
        el.setAttribute('cy', top + (height / 2));
        el.setAttribute('rx', width / 2);
        el.setAttribute('ry', height / 2);
        return;
    }

    if (tipo === 'draw-text') {
        el.setAttribute('x', x2);
        el.setAttribute('y', y2);
        return;
    }

    if (tipo === 'draw-polygon') {
        el.setAttribute('points', polygonPointsToAttr([
            { x: x1, y: y1 },
            { x: x2, y: y1 },
            { x: x2, y: y2 }
        ]));
    }
}

function getDrawingBoundsFromElement(el) {
    if (!el || !el.getBBox) return null;
    try {
        const box = el.getBBox();
        return {
            left: box.x,
            top: box.y,
            right: box.x + box.width,
            bottom: box.y + box.height
        };
    } catch (_) {
        return null;
    }
}

function readDrawingGeometry(el) {
    const type = String(el?.dataset?.drawType || '').toLowerCase();
    if (type === 'line') {
        return {
            x1: parseFloat(el.getAttribute('x1')) || 0,
            y1: parseFloat(el.getAttribute('y1')) || 0,
            x2: parseFloat(el.getAttribute('x2')) || 0,
            y2: parseFloat(el.getAttribute('y2')) || 0
        };
    }
    if (type === 'rect') {
        return {
            x: parseFloat(el.getAttribute('x')) || 0,
            y: parseFloat(el.getAttribute('y')) || 0,
            width: parseFloat(el.getAttribute('width')) || 0,
            height: parseFloat(el.getAttribute('height')) || 0
        };
    }
    if (type === 'text') {
        return {
            x: parseFloat(el.getAttribute('x')) || 0,
            y: parseFloat(el.getAttribute('y')) || 0
        };
    }
    if (type === 'polygon') {
        return {
            points: parsePolygonPointsAttr(el.getAttribute('points') || '')
        };
    }
    return {
        cx: parseFloat(el.getAttribute('cx')) || 0,
        cy: parseFloat(el.getAttribute('cy')) || 0,
        rx: parseFloat(el.getAttribute('rx')) || 0,
        ry: parseFloat(el.getAttribute('ry')) || 0
    };
}

function applyDrawingTranslation(el, base, dx, dy) {
    const type = String(el?.dataset?.drawType || '').toLowerCase();
    if (type === 'line') {
        el.setAttribute('x1', snapToGrid(base.x1 + dx));
        el.setAttribute('y1', snapToGrid(base.y1 + dy));
        el.setAttribute('x2', snapToGrid(base.x2 + dx));
        el.setAttribute('y2', snapToGrid(base.y2 + dy));
        return;
    }
    if (type === 'rect') {
        el.setAttribute('x', snapToGrid(base.x + dx));
        el.setAttribute('y', snapToGrid(base.y + dy));
        return;
    }
    if (type === 'text') {
        el.setAttribute('x', snapToGrid(base.x + dx));
        el.setAttribute('y', snapToGrid(base.y + dy));
        return;
    }
    if (type === 'polygon') {
        const pts = Array.isArray(base.points) ? base.points : [];
        const moved = pts.map(p => ({ x: snapToGrid(p.x + dx), y: snapToGrid(p.y + dy) }));
        el.setAttribute('points', polygonPointsToAttr(moved));
        return;
    }
    el.setAttribute('cx', snapToGrid(base.cx + dx));
    el.setAttribute('cy', snapToGrid(base.cy + dy));
}

function moveDrawingOneStep(el, direction) {
    if (!el) return false;
    const currentLayer = getDrawingLayerName(el);
    const parent = el.parentNode;
    if (!parent) return false;

    if (direction === 'up') {
        const next = el.nextElementSibling;
        if (next) {
            parent.insertBefore(next, el);
            return true;
        }
        if (currentLayer === 'background') {
            const wireLayer = getDrawLayer();
            if (wireLayer) {
                wireLayer.insertBefore(el, wireLayer.firstChild || null);
                return true;
            }
        }
        if (currentLayer === 'below') {
            const panelLayer = getDrawPanelLayer();
            if (panelLayer) {
                panelLayer.insertBefore(el, panelLayer.firstChild || null);
                return true;
            }
        }
        if (currentLayer === 'panel') {
            const topLayer = getDrawTopLayer();
            if (topLayer) {
                topLayer.insertBefore(el, topLayer.firstChild || null);
                return true;
            }
        }
        return false;
    }

    const prev = el.previousElementSibling;
    if (prev) {
        parent.insertBefore(el, prev);
        return true;
    }
    if (currentLayer === 'above') {
        const panelLayer = getDrawPanelLayer();
        if (panelLayer) {
            panelLayer.appendChild(el);
            return true;
        }
    }
    if (currentLayer === 'panel') {
        const wireLayer = getDrawLayer();
        if (wireLayer) {
            wireLayer.appendChild(el);
            return true;
        }
    }
    if (currentLayer === 'below') {
        const backgroundLayer = getDrawBackgroundLayer();
        if (backgroundLayer) {
            backgroundLayer.appendChild(el);
            return true;
        }
    }
    return false;
}

function setDrawingLayerOrder(action) {
    if (simulando || !selectedDrawings.size) return false;
    const selected = Array.from(selectedDrawings).filter(el => el?.classList?.contains('user-drawing'));
    if (!selected.length) return false;

    let changed = false;
    if (action === 'front') {
        const topLayer = getDrawTopLayer();
        if (!topLayer) return false;
        selected.forEach(el => {
            if (el.parentNode !== topLayer || el.nextElementSibling) changed = true;
            topLayer.appendChild(el);
        });
    } else if (action === 'back') {
        const bottomLayer = getDrawBackgroundLayer();
        if (!bottomLayer) return false;
        selected.slice().reverse().forEach(el => {
            if (el.parentNode !== bottomLayer || el.previousElementSibling) changed = true;
            bottomLayer.insertBefore(el, bottomLayer.firstChild || null);
        });
    } else if (action === 'up') {
        selected.forEach(el => { changed = moveDrawingOneStep(el, 'up') || changed; });
    } else if (action === 'down') {
        selected.slice().reverse().forEach(el => { changed = moveDrawingOneStep(el, 'down') || changed; });
    }

    if (!changed) return false;
    selected.forEach(el => {
        el.dataset.drawingLayer = getDrawingLayerName(el);
        refreshDrawingInteractionProfile(el);
        selectedDrawings.add(el);
        el.classList.add('selected');
    });
    updateDrawingEditButtonState();
    scheduleHistoryCheckpoint(`drawing_layer_${action}`);
    return true;
}

window.subirCamadaDesenho = () => setDrawingLayerOrder('up');
window.descerCamadaDesenho = () => setDrawingLayerOrder('down');
window.enviarDesenhoParaFrente = () => setDrawingLayerOrder('front');
window.enviarDesenhoParaTras = () => setDrawingLayerOrder('back');

function initDrawingTools() {
    const viewport = document.getElementById('viewport');
    if (!viewport) return;

    viewport.addEventListener('dblclick', (e) => {
        if (simulando || ferramentaAtiva !== 'select') return;
        const targetDrawing = e.target?.closest?.('.user-drawing');
        if (!targetDrawing) return;
        selectDrawing(targetDrawing, false);
        openDrawingEditModal();
    }, true);

    viewport.addEventListener('contextmenu', (e) => {
        if (simulando) return;
        if (polygonSession?.shape && ferramentaAtiva === 'draw-polygon') {
            const finalized = finalizePolygonSession();
            if (finalized) scheduleHistoryCheckpoint('add_polygon');
            e.preventDefault();
            return;
        }
        e.preventDefault();
        ativarFerramenta('select');
    });

    viewport.addEventListener('pointerdown', (e) => {
        if (simulando) return;
        if (e.button === 2) {
            e.preventDefault();
            ativarFerramenta('select');
            return;
        }
        const targetDrawing = e.target?.closest?.('.user-drawing');

        if (ferramentaAtiva === 'borracha' && targetDrawing) {
            e.preventDefault();
            e.stopPropagation();
            if (removeDrawingElement(targetDrawing)) {
                scheduleHistoryCheckpoint('erase_drawing');
            }
            return;
        }

        if (ferramentaAtiva === 'select' && targetDrawing) {
            e.preventDefault();
            e.stopPropagation();
            selectDrawing(targetDrawing, !!(e.shiftKey || e.ctrlKey || e.metaKey));
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            const active = selectedDrawings.size ? Array.from(selectedDrawings) : [targetDrawing];
            drawingDragState = {
                pointerId: e.pointerId,
                startX: e.clientX,
                startY: e.clientY,
                moved: false,
                items: active,
                baseByEl: new Map(active.map(el => [el, readDrawingGeometry(el)]))
            };
            return;
        }

        if (!isDrawTool(ferramentaAtiva)) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (targetDrawing || e.target?.closest('.component') || e.target?.closest('.sidebar') || e.target?.closest('.top-bar') || e.target?.closest('.modal')) return;

        const pt = getWorkspacePointFromClient(e.clientX, e.clientY);
        if (!pt) return;
        const svg = getDrawLayer();
        if (ferramentaAtiva === 'draw-polygon') {
            if (!svg) return;
            const snapped = { x: snapToGrid(pt.x), y: snapToGrid(pt.y) };
            if (!polygonSession) {
                const shape = createDrawingElement('draw-polygon');
                if (!shape) return;
                shape.classList.add('drawing-preview');
                svg.appendChild(shape);
                polygonSession = { shape, points: [snapped], tempPoint: snapped };
                updatePolygonPreview();
            } else {
                if (polygonSession.points.length >= 3 && isNearPolygonStartPoint(snapped)) {
                    const finalized = finalizePolygonSession();
                    if (finalized) scheduleHistoryCheckpoint('add_polygon');
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                polygonSession.points.push(snapped);
                polygonSession.tempPoint = snapped;
                updatePolygonPreview();
            }
            if (e.detail >= 2) {
                const finalized = finalizePolygonSession();
                if (finalized) scheduleHistoryCheckpoint('add_polygon');
            }
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        if (ferramentaAtiva === 'draw-text') {
            const shape = createDrawingElement('draw-text');
            if (!svg || !shape) return;
            shape.setAttribute('x', snapToGrid(pt.x));
            shape.setAttribute('y', snapToGrid(pt.y));
            const userText = window.prompt('Texto:', 'Texto');
            if (userText !== null) {
                const normalized = String(userText).trim();
                shape.textContent = normalized || 'Texto';
            }
            svg.appendChild(shape);
            clearDrawingSelection();
            selectDrawing(shape, false);
            scheduleHistoryCheckpoint('add_text');
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        const shape = createDrawingElement(ferramentaAtiva);
        if (!svg || !shape) return;

        clearDrawingSelection();
        shape.classList.add('drawing-preview');
        svg.appendChild(shape);
        drawingSession = {
            pointerId: e.pointerId,
            tipo: ferramentaAtiva,
            start: { x: snapToGrid(pt.x), y: snapToGrid(pt.y) },
            current: { x: snapToGrid(pt.x), y: snapToGrid(pt.y) },
            shape
        };
        updateDrawingElementGeometry(shape, drawingSession.tipo, drawingSession.start, drawingSession.current);
        e.preventDefault();
        e.stopPropagation();
    }, true);

    window.addEventListener('pointermove', (e) => {
        if (drawingDragState && e.pointerId === drawingDragState.pointerId) {
            const dx = (e.clientX - drawingDragState.startX) / zoomLevel;
            const dy = (e.clientY - drawingDragState.startY) / zoomLevel;
            const sdx = snapToGrid(dx);
            const sdy = snapToGrid(dy);
            drawingDragState.moved = drawingDragState.moved || Math.abs(sdx) >= 1 || Math.abs(sdy) >= 1;
            drawingDragState.items.forEach(el => {
                const base = drawingDragState.baseByEl.get(el);
                if (!base) return;
                applyDrawingTranslation(el, base, sdx, sdy);
            });
            e.preventDefault();
            return;
        }
        if (polygonSession?.shape && ferramentaAtiva === 'draw-polygon') {
            const pt2 = getWorkspacePointFromClient(e.clientX, e.clientY);
            if (!pt2) return;
            polygonSession.tempPoint = { x: snapToGrid(pt2.x), y: snapToGrid(pt2.y) };
            updatePolygonPreview();
            e.preventDefault();
            return;
        }
        if (!drawingSession || e.pointerId !== drawingSession.pointerId) return;
        const pt = getWorkspacePointFromClient(e.clientX, e.clientY);
        if (!pt) return;
        drawingSession.current = { x: snapToGrid(pt.x), y: snapToGrid(pt.y) };
        updateDrawingElementGeometry(drawingSession.shape, drawingSession.tipo, drawingSession.start, drawingSession.current);
        e.preventDefault();
    }, true);

    const finishDrawing = (e) => {
        if (drawingDragState && (!e || e.pointerId === drawingDragState.pointerId)) {
            const moved = drawingDragState.moved;
            drawingDragState = null;
            if (moved) scheduleHistoryCheckpoint('move_drawing');
            return;
        }
        if (polygonSession?.shape && ferramentaAtiva === 'draw-polygon') return;
        if (!drawingSession || (e && e.pointerId !== drawingSession.pointerId)) return;
        const sess = drawingSession;
        drawingSession = null;
        if (!sess.shape) return;

        const bounds = getDrawingBoundsFromElement(sess.shape);
        if (!bounds || (Math.abs(bounds.right - bounds.left) < 2 && Math.abs(bounds.bottom - bounds.top) < 2)) {
            sess.shape.remove();
            return;
        }

        sess.shape.classList.remove('drawing-preview');
        sess.shape.dataset.drawType = sess.tipo.replace('draw-', '');
        selectDrawing(sess.shape, false);
        scheduleHistoryCheckpoint('add_drawing');
    };

    window.addEventListener('pointerup', finishDrawing, true);
    window.addEventListener('pointercancel', finishDrawing, true);
}

function getHistorySnapshotString(reason = '') {
    if (typeof window.exportProjectSnapshot !== 'function') return '';
    try {
        const heavyReason = reason === 'delete_selection' || reason === 'pointerup';
        if (heavyReason) {
            let activeWireCount = 0;
            let activePointCount = 0;
            if (Array.isArray(listaFios)) {
                activeWireCount = listaFios.length;
                for (let i = 0; i < listaFios.length; i++) {
                    const wire = listaFios[i];
                    activePointCount += Array.isArray(wire?.points) ? wire.points.length : 0;
                    if (activePointCount > HISTORY_MAX_ACTIVE_POINTS_FOR_HEAVY_CHECKPOINT) break;
                }
            } else {
                activeWireCount = document.querySelectorAll('#wire-layer .user-wire').length;
            }
            if (
                activeWireCount > HISTORY_MAX_ACTIVE_WIRES_FOR_HEAVY_CHECKPOINT ||
                activePointCount > HISTORY_MAX_ACTIVE_POINTS_FOR_HEAVY_CHECKPOINT
            ) {
                return '';
            }
        }

        const snapshot = JSON.stringify(window.exportProjectSnapshot());
        if (!snapshot || snapshot.length > HISTORY_MAX_SNAPSHOT_CHARS) return '';
        return snapshot;
    } catch (_) {
        return '';
    }
}

function updateHistoryButtons() {
    const undoBtn = document.getElementById('btn-undo');
    const redoBtn = document.getElementById('btn-redo');
    if (undoBtn) undoBtn.disabled = historyUndoStack.length <= 1 || historyRestoreInProgress;
    if (redoBtn) redoBtn.disabled = historyRedoStack.length === 0 || historyRestoreInProgress;
}

function recordHistoryCheckpoint(reason = '') {
    if (historyRestoreInProgress) return;
    const snap = getHistorySnapshotString(reason);
    if (!snap) return;
    if (snap === historyLastSnapshot) return;

    historyUndoStack.push(snap);
    if (historyUndoStack.length > HISTORY_LIMIT) historyUndoStack.shift();
    historyRedoStack = [];
    historyLastSnapshot = snap;
    updateHistoryButtons();
}

function scheduleHistoryCheckpoint(reason = '') {
    if (historyRestoreInProgress) return;
    if (reason === 'pointerup') {
        const now = Date.now();
        if ((now - historyLastPointerUpCheckpointAt) < 1200) return;
        historyLastPointerUpCheckpointAt = now;
    }
    if (historyCheckpointTimer) clearTimeout(historyCheckpointTimer);
    const delayMs = reason === 'delete_selection' ? 180 : 60;
    historyCheckpointTimer = window.setTimeout(() => {
        historyCheckpointTimer = null;
        const runner = () => recordHistoryCheckpoint(reason);
        if (
            (reason === 'delete_selection' || reason === 'pointerup') &&
            typeof window.requestIdleCallback === 'function'
        ) {
            window.requestIdleCallback(() => runner(), { timeout: 500 });
            return;
        }
        runner();
    }, delayMs);
}

function restoreHistorySnapshot(snapshotString) {
    if (!snapshotString || typeof window.importProjectSnapshot !== 'function') return false;
    try {
        historyRestoreInProgress = true;
        window.importProjectSnapshot(JSON.parse(snapshotString));
        historyLastSnapshot = snapshotString;
        return true;
    } catch (err) {
        console.error(err);
        return false;
    } finally {
        historyRestoreInProgress = false;
        updateHistoryButtons();
    }
}

let lastUndoRedoTime = 0;
function undoAcao() {
    if (historyRestoreInProgress) return;
    // Empêcher les déclenchements multiples involontaires (rebond tactile ou double-clic rapide)
    const now = Date.now();
    if (now - lastUndoRedoTime < 200) return;
    lastUndoRedoTime = now;

    // Annuler tout enregistrement différé en cours
    if (historyCheckpointTimer) {
        clearTimeout(historyCheckpointTimer);
        historyCheckpointTimer = null;
    }

    if (historyUndoStack.length <= 1) return;
    const current = historyUndoStack.pop();
    if (current) historyRedoStack.push(current);

    // Récupérer le snapshot précédent strict
    const prev = historyUndoStack[historyUndoStack.length - 1];
    if (prev) {
        restoreHistorySnapshot(prev);
    }
}

function redoAcao() {
    if (historyRestoreInProgress) return;
    const now = Date.now();
    if (now - lastUndoRedoTime < 200) return;
    lastUndoRedoTime = now;

    if (historyCheckpointTimer) {
        clearTimeout(historyCheckpointTimer);
        historyCheckpointTimer = null;
    }

    if (!historyRedoStack.length) return;
    const next = historyRedoStack.pop();
    if (!next) return;
    const ok = restoreHistorySnapshot(next);
    if (ok) {
        historyUndoStack.push(next);
    }
}

function initHistoryManager() {
    historyUndoStack = [];
    historyRedoStack = [];
    historyLastSnapshot = '';
    recordHistoryCheckpoint('init');
}

window.recordHistoryCheckpoint = recordHistoryCheckpoint;
window.scheduleHistoryCheckpoint = scheduleHistoryCheckpoint;
window.undoAcao = undoAcao;
window.redoAcao = redoAcao;

// =====================================================
// ZOOM / PAN
// =====================================================
function updateTransform() {
    document.getElementById('zoom-container')
        .style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
}

function setZoom(v, anchorClientX = null, anchorClientY = null) {
    const prevZoom = zoomLevel;
    const nextZoom = Math.min(Math.max(MIN_ZOOM_LEVEL, v), MAX_ZOOM_LEVEL);
    if (!Number.isFinite(nextZoom)) return;
    if (Math.abs(nextZoom - prevZoom) < 1e-6) {
        const zdSame = document.getElementById('zoom-display');
        if (zdSame) zdSame.innerText = Math.round(nextZoom * 100) + '%';
        return;
    }

    const vp = document.getElementById('viewport');
    const vr = vp?.getBoundingClientRect();
    const localAnchorX = (Number.isFinite(anchorClientX) && vr)
        ? (anchorClientX - vr.left)
        : ((vp?.clientWidth || 0) / 2);
    const localAnchorY = (Number.isFinite(anchorClientY) && vr)
        ? (anchorClientY - vr.top)
        : ((vp?.clientHeight || 0) / 2);

    // Mantem o ponto de foco fixo na tela durante o zoom.
    const worldX = (localAnchorX - panX) / prevZoom;
    const worldY = (localAnchorY - panY) / prevZoom;

    zoomLevel = nextZoom;
    panX = localAnchorX - (worldX * zoomLevel);
    panY = localAnchorY - (worldY * zoomLevel);

    updateTransform();
    const zd = document.getElementById('zoom-display');
    if (zd) zd.innerText = Math.round(zoomLevel * 100) + '%';
}

function getDefaultZoomForViewport(mode = activeWorkspaceMode) {
    if (mode === '2d') return 0.7;
    if (mode === 'simbologia' && !isMobileViewport()) return 0.9;
    if (isMobileViewport()) return 1;
    return 1;
}

function getInitialSheetViewportZoom() {
    const viewport = document.getElementById('viewport');
    const activeSheet = getSheetById(activeProjectSheetId);
    const config = getSheetPageConfig(activeSheet);
    const paperSize = normalizeSheetPaperSize(config?.paperSize || SHEET_DEFAULT_PAPER_SIZE);
    const sheetPx = getSheetPixelSizeByPaper(paperSize);
    const vpW = viewport?.clientWidth || 1280;
    const vpH = viewport?.clientHeight || 720;
    const fitW = vpW / (sheetPx.widthPx + 220);
    const fitH = vpH / (sheetPx.heightPx + 220);
    const fit = Math.min(fitW, fitH);
    const fallback = getDefaultZoomForViewport();
    if (!Number.isFinite(fit) || fit <= 0) return fallback;
    return Math.min(1, Math.max(MIN_ZOOM_LEVEL, fit));
}

function getWorkspaceDimensions() {
    const zoomContainer = document.getElementById('zoom-container');
    if (!zoomContainer) return { width: 5000, height: 5000 };
    const rect = zoomContainer.getBoundingClientRect();
    const css = getComputedStyle(zoomContainer);
    const width =
        (Number.isFinite(rect.width) && rect.width > 0 ? rect.width : parseFloat(css.width)) || 5000;
    const height =
        (Number.isFinite(rect.height) && rect.height > 0 ? rect.height : parseFloat(css.height)) || 5000;
    return { width, height };
}

function centerWorkspaceInViewport() {
    const viewport = document.getElementById('viewport');
    if (!viewport) return;
    const ws = getWorkspaceDimensions();
    const vpW = viewport.clientWidth || 0;
    const vpH = viewport.clientHeight || 0;
    panX = Math.round((vpW - (ws.width * zoomLevel)) / 2);
    panY = Math.round((vpH - (ws.height * zoomLevel)) / 2);
}

function resetView() {
    zoomLevel = getInitialSheetViewportZoom();
    panX = 0;
    panY = 0;
    updateTransform();
    const zd = document.getElementById('zoom-display');
    if (zd) zd.innerText = Math.round(zoomLevel * 100) + '%';
}

function syncFullscreenButtonState() {
    const btn = document.getElementById('btn-fullscreen');
    if (!btn) return;
    const isFullscreen = !!document.fullscreenElement;
    btn.classList.toggle('is-active', isFullscreen);
    btn.setAttribute('aria-pressed', isFullscreen ? 'true' : 'false');
    btn.title = isFullscreen ? 'Sair da tela cheia' : 'Tela cheia';
    const icon = btn.querySelector('i');
    if (icon) {
        icon.classList.remove('fa-expand', 'fa-compress');
        icon.classList.add(isFullscreen ? 'fa-compress' : 'fa-expand');
    }
}
async function toggleFullscreenMode() {
    try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
    } catch (_) {}
    syncFullscreenButtonState();
}
document.addEventListener('fullscreenchange', syncFullscreenButtonState);
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncFullscreenButtonState, { once: true });
} else {
    window.setTimeout(syncFullscreenButtonState, 0);
}// =====================================================
// FERRAMENTAS (ESTADO VISUAL CORRETO)
// =====================================================
function ativarFerramenta(nome, opts = {}) {
    if (simulando && !opts.forceDuringSimulation) {
        const allowDuringSimulation = nome === 'pan' || nome === 'select';
        if (!allowDuringSimulation) {
            showSimulationInteractionLockMessage();
            return;
        }
    }
    if (!simulando && nome === 'emenda' && activeWorkspaceMode === '2d') {
        nome = 'select';
    }

    ferramentaAtiva = nome;

    // ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚Âµ Estado visual
    document.querySelectorAll('.btn-tool')
        .forEach(b => b.classList.remove('ativo'));

    const btn =
        document.getElementById(`btn-${nome}`) ||
        document.getElementById(`btn-${nome === 'fio' ? 'wire' : nome}`);
    if (btn) btn.classList.add('ativo');
    document.querySelectorAll(`.btn-tool[data-tool="${nome}"]`)
        .forEach(b => b.classList.add('ativo'));
    const engineeringBtn = document.getElementById('btn-engineering-toggle');
    if (engineeringBtn) engineeringBtn.classList.toggle('ativo', engineeringMode);
    document.body.classList.toggle('wire-tool-active', nome === 'fio');

    // ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€¦Ã‚Â½Ãƒâ€šÃ‚Â¯ Cursor
    const bancada = document.getElementById('bancada');
    if (bancada) {
        bancada.classList.remove('cursor-fio', 'cursor-fio-assist', 'cursor-borracha', 'cursor-info', 'cursor-emenda', 'cursor-draw');
        if (nome === 'fio') bancada.classList.add('cursor-fio');
        if (nome === 'emenda') bancada.classList.add('cursor-emenda');
        if (nome === 'borracha') bancada.classList.add('cursor-borracha');
        if (nome === 'info') bancada.classList.add('cursor-info');
        if (isDrawTool(nome)) bancada.classList.add('cursor-draw');
    }
    if (nome !== 'emenda' && typeof window.hideEmendaSnap === 'function') {
        window.hideEmendaSnap();
    }

    if (nome !== 'fio' && typeof cancelarFio === 'function') cancelarFio();
    if (nome !== 'draw-polygon' && polygonSession?.shape) {
        polygonSession.shape.remove();
        polygonSession = null;
    }
    if (nome !== 'select') clearDrawingSelection();
    if (isMobileViewport()) closeTopbarToolsMenu();
    refreshAllComponentCursors();
    updateMobileQuickActionButtons();
    syncMirroredSidebarControls();
    if (typeof window.syncWireAssistButton === 'function') {
        window.syncWireAssistButton();
    }
}

// =====================================================
// PAN
// =====================================================
function onPointerDownGlobal(e) {
    if (pinchZoomActive) return;
    const isMiddleMouse = e.pointerType === 'mouse' && e.button === 1;
    const canPanByTool = ferramentaAtiva === 'pan' && (e.pointerType !== 'mouse' || e.button === 0);
    if (!canPanByTool && !isMiddleMouse) return;
    e.preventDefault();
    e.stopPropagation();
    // For middle-mouse panning, avoid pointer capture to prevent browser-specific conflicts.
    if (!isMiddleMouse) {
        const viewport = document.getElementById('viewport');
        if (viewport && typeof viewport.setPointerCapture === 'function') {
            viewport.setPointerCapture(e.pointerId);
        }
    }
    isPanning = true;
    activePanPointerId = e.pointerId;
    startPanX = e.clientX - panX;
    startPanY = e.clientY - panY;
}

function onPointerMoveGlobal(e) {
    if (pinchZoomActive) return;
    if (!isPanning) return;
    if (activePanPointerId !== null && e.pointerId !== activePanPointerId) return;
    e.preventDefault();
    panX = e.clientX - startPanX;
    panY = e.clientY - startPanY;
    updateTransform();
}

function onPointerUpGlobal(e) {
    if (activePanPointerId !== null && e && e.pointerId !== activePanPointerId) return;
    const viewport = document.getElementById('viewport');
    if (viewport && e && typeof viewport.releasePointerCapture === 'function') {
        try { viewport.releasePointerCapture(e.pointerId); } catch (_) { }
    }
    isPanning = false;
    activePanPointerId = null;
}

function onMouseDownMiddlePan(e) {
    if (e.button !== 1) return;
    if (!isEventInsideViewport(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    middleMousePanActive = true;
    isPanning = true;
    activePanPointerId = 'mouse-middle';
    startPanX = e.clientX - panX;
    startPanY = e.clientY - panY;
}

function onMouseMoveMiddlePan(e) {
    const middlePressed = (e.buttons & 4) === 4;
    if (!middleMousePanActive && middlePressed) {
        middleMousePanActive = true;
        isPanning = true;
        activePanPointerId = 'mouse-middle';
        startPanX = e.clientX - panX;
        startPanY = e.clientY - panY;
    }
    if (!middleMousePanActive || activePanPointerId !== 'mouse-middle') return;
    if (!middlePressed) {
        middleMousePanActive = false;
        isPanning = false;
        activePanPointerId = null;
        return;
    }
    e.preventDefault();
    panX = e.clientX - startPanX;
    panY = e.clientY - startPanY;
    updateTransform();
}

function onMouseUpMiddlePan(e) {
    if (e.button !== 1) return;
    middleMousePanActive = false;
    if (activePanPointerId === 'mouse-middle') {
        isPanning = false;
        activePanPointerId = null;
    }
}

function onWindowMouseDownMiddlePan(e) {
    if (e.button !== 1) return;
    if (!isEventInsideViewport(e.target)) return;
    onMouseDownMiddlePan(e);
}

function isEventInsideViewport(target) {
    const vp = document.getElementById('viewport');
    return !!(vp && target && (target === vp || vp.contains(target)));
}

function getTouchDistance(t1, t2) {
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
}

function onTouchStartViewport(e) {
    if (!e.touches || e.touches.length < 2) return;
    const vp = document.getElementById('viewport');
    if (!vp) return;
    const t1 = e.touches[0];
    const t2 = e.touches[1];
    const dist = getTouchDistance(t1, t2);
    if (!Number.isFinite(dist) || dist < 8) return;
    const rect = vp.getBoundingClientRect();
    const centerX = (t1.clientX + t2.clientX) / 2;
    const centerY = (t1.clientY + t2.clientY) / 2;
    pinchZoomActive = true;
    pinchStartDistance = dist;
    pinchStartZoom = zoomLevel;
    pinchStartWorldX = (centerX - rect.left - panX) / zoomLevel;
    pinchStartWorldY = (centerY - rect.top - panY) / zoomLevel;
    e.preventDefault();
}

function onTouchMoveViewport(e) {
    if (!pinchZoomActive) return;
    if (!e.touches || e.touches.length < 2) return;
    const vp = document.getElementById('viewport');
    if (!vp) return;
    const t1 = e.touches[0];
    const t2 = e.touches[1];
    const dist = getTouchDistance(t1, t2);
    if (!Number.isFinite(dist) || dist < 8 || pinchStartDistance < 8) return;
    const rect = vp.getBoundingClientRect();
    const centerX = (t1.clientX + t2.clientX) / 2;
    const centerY = (t1.clientY + t2.clientY) / 2;
    const rawZoom = pinchStartZoom * (dist / pinchStartDistance);
    zoomLevel = Math.min(Math.max(MIN_ZOOM_LEVEL, rawZoom), MAX_ZOOM_LEVEL);
    panX = (centerX - rect.left) - (pinchStartWorldX * zoomLevel);
    panY = (centerY - rect.top) - (pinchStartWorldY * zoomLevel);
    updateTransform();
    const zd = document.getElementById('zoom-display');
    if (zd) zd.innerText = Math.round(zoomLevel * 100) + '%';
    e.preventDefault();
}

function onTouchEndViewport(e) {
    if (!pinchZoomActive) return;
    if (e.touches && e.touches.length >= 2) return;
    pinchZoomActive = false;
}

function getSelectedComponents() {
    return Array.from(document.querySelectorAll('#bancada .component.component-selected'));
}

function insertAfterNode(parent, node, referenceNode) {
    if (!parent || !node) return;
    if (referenceNode && referenceNode.parentElement === parent) {
        parent.insertBefore(node, referenceNode.nextSibling);
        return;
    }
    parent.appendChild(node);
}

function syncPrimaryToolButtonPlacement() {
    const selectBtn = document.getElementById('btn-select');
    const wireBtn = document.getElementById('btn-wire');
    const wireTools = document.getElementById('wire-primary-tools');
    const simControls = document.querySelector('.top-bar .simulation-controls');
    const playBtn = document.getElementById('btn-play');
    if (!selectBtn || !wireBtn || !wireTools || !simControls || !playBtn) return;

    if (!primaryToolButtonPlacementState) {
        primaryToolButtonPlacementState = {
            desktopParent: wireTools,
            selectOriginalParent: selectBtn.parentElement,
            selectOriginalNextSibling: selectBtn.nextElementSibling,
            wireOriginalParent: wireBtn.parentElement,
            wireOriginalNextSibling: wireBtn.nextElementSibling
        };
    }

    const mobile = typeof isMobileViewport === 'function' && isMobileViewport();
    if (mobile) {
        if (selectBtn.parentElement !== simControls) {
            simControls.insertBefore(selectBtn, playBtn);
        }
        if (wireBtn.parentElement !== simControls) {
            insertAfterNode(simControls, wireBtn, playBtn);
        }
        return;
    }

    // No modo desktop, garantimos que fiquem no desktopParent (wireTools)
    const desktopParent = primaryToolButtonPlacementState.desktopParent || wireTools;
    if (selectBtn.parentElement !== desktopParent) {
        desktopParent.insertBefore(selectBtn, desktopParent.firstChild || null);
    }
    if (wireBtn.parentElement !== desktopParent || wireBtn.previousElementSibling !== selectBtn) {
        insertAfterNode(desktopParent, wireBtn, selectBtn);
    }
}

function syncMobileQuickActionPlacement() {
    const finishBtn = document.getElementById('btn-mobile-finish-wire');
    const simControls = document.querySelector('.top-bar .simulation-controls');
    const toolbarActions = document.querySelector('.top-bar .toolbar-actions');
    if (!finishBtn || !simControls || !toolbarActions) return;

    if (!mobileQuickActionPlacementState) {
        mobileQuickActionPlacementState = {
            finishParent: finishBtn.parentElement,
            finishNextSibling: finishBtn.nextElementSibling || null
        };
    }

    const mobile = typeof isMobileViewport === 'function' && isMobileViewport();
    if (mobile) {
        if (finishBtn.parentElement !== simControls) {
            simControls.appendChild(finishBtn);
        }
        return;
    }

    const originalParent = mobileQuickActionPlacementState.finishParent || toolbarActions;
    const originalNext = mobileQuickActionPlacementState.finishNextSibling;
    if (finishBtn.parentElement === originalParent) return;
    if (originalNext && originalNext.parentElement === originalParent) {
        originalParent.insertBefore(finishBtn, originalNext);
    } else {
        originalParent.appendChild(finishBtn);
    }
}

function updateMobileQuickActionButtons() {
    const editBtn = document.getElementById('btn-mobile-edit-selected');
    const finishBtn = document.getElementById('btn-mobile-finish-wire');
    const mobile = typeof isMobileViewport === 'function' && isMobileViewport();
    const selectedComponentsCount = getSelectedComponents().length;
    const selectedWiresCount =
        typeof window.getSelectedWireElements === 'function'
            ? (window.getSelectedWireElements() || []).length
            : 0;
    const canEdit =
        mobile &&
        !simulando &&
        (
            selectedComponentsCount === 1 ||
            (selectedComponentsCount === 0 && selectedWiresCount === 1)
        );
    const canFinish = mobile && !simulando && !!(typeof window.isWireDrawingInProgress === 'function' && window.isWireDrawingInProgress());

    if (editBtn) {
        editBtn.hidden = !canEdit;
        editBtn.disabled = !canEdit;
        editBtn.classList.toggle('mobile-quick-visible', canEdit);
    }
    if (finishBtn) {
        finishBtn.hidden = !canFinish;
        finishBtn.disabled = !canFinish;
        finishBtn.classList.toggle('mobile-quick-visible', canFinish);
    }
    syncMobileQuickActionPlacement();
}

function openSelectedComponentEditMobile() {
    if (simulando) return false;
    const selected = getSelectedComponents();
    if (selected.length >= 1) {
        const comp = selected[0];
        if (typeof abrirModalPropriedadesComponente === 'function' && isSymbolicPropertiesComponent(comp)) {
            abrirModalPropriedadesComponente(comp);
            return true;
        }
        const def = (typeof BIBLIOTECA !== 'undefined') ? BIBLIOTECA[comp.dataset.lib] : {};
        const atual = comp.dataset.tag || getDefaultTag(def, comp.dataset.lib);
        const novo = prompt('اسم المرجع / العنصر (مثال: K1, K2):', atual);
        if (novo !== null) {
            comp.dataset.tag = novo.trim();
            const l = comp.querySelector('.tag-label');
            if (l) l.innerText = comp.dataset.tag;
            if (typeof scheduleCrossReferenceRefresh === 'function') scheduleCrossReferenceRefresh();
            if (typeof scheduleHistoryCheckpoint === 'function') scheduleHistoryCheckpoint('tag_component');
            return true;
        }
        return true;
    }
    
    // Si aucun composant n'est sélectionné, demander à l'utilisateur de cliquer sur un composant
    alert('يرجى تحديد عنصر أولاً لتعديل اسمه (K1, K2...) أو أطرافه
Veuillez d'abord cliquer sur un composant pour modifier son repère (K1, K2...).');
    return false;
}

window.updateMobileQuickActionButtons = updateMobileQuickActionButtons;
window.openSelectedComponentEditMobile = openSelectedComponentEditMobile;

function updateClipboardButtons() {
    const pasteBtn = document.getElementById('btn-paste');
    if (pasteBtn) pasteBtn.disabled = !circuitClipboard;
    syncMirroredSidebarControls();
}

function syncMirroredSidebarControls() {
    document.querySelectorAll('[data-mirror-source]').forEach((node) => {
        const selector = String(node.dataset.mirrorSource || '').trim();
        if (!selector) return;
        const source = document.querySelector(selector);
        if (!source) return;
        if ('disabled' in node) node.disabled = !!source.disabled;
        node.classList.toggle('ativo', source.classList.contains('ativo'));
        node.classList.toggle('toggle-on', source.classList.contains('toggle-on'));
        const ariaDisabled = source.getAttribute('aria-disabled');
        if (ariaDisabled !== null) node.setAttribute('aria-disabled', ariaDisabled);
        else node.removeAttribute('aria-disabled');
    });
}

function initBoundsAccumulator() {
    return {
        left: Number.POSITIVE_INFINITY,
        top: Number.POSITIVE_INFINITY,
        right: Number.NEGATIVE_INFINITY,
        bottom: Number.NEGATIVE_INFINITY
    };
}

function pushBoundsPoint(bounds, x, y) {
    if (!bounds) return;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    bounds.left = Math.min(bounds.left, x);
    bounds.top = Math.min(bounds.top, y);
    bounds.right = Math.max(bounds.right, x);
    bounds.bottom = Math.max(bounds.bottom, y);
}

function pushBoundsRect(bounds, left, top, right, bottom) {
    pushBoundsPoint(bounds, left, top);
    pushBoundsPoint(bounds, right, bottom);
}

function finalizeBounds(bounds) {
    if (!bounds) return null;
    if (!Number.isFinite(bounds.left) || !Number.isFinite(bounds.top)) {
        return { left: 0, top: 0, right: 0, bottom: 0 };
    }
    return bounds;
}

function readComponentClipboardData(componentEl) {
    if (!componentEl) return null;
    const timerLabel = componentEl.querySelector('.timer-label');
    const timerSeconds = parseFloat(timerLabel?.dataset?.timerSeconds || '');
    const pinLabels = Array.from(componentEl.querySelectorAll('.pin-label'))
        .map(label => String(label.innerText || '').trim());
    const crossRefCoilDx = parseFloat(componentEl.dataset.crossRefCoilDx || '');
    const crossRefCoilDy = parseFloat(componentEl.dataset.crossRefCoilDy || '');
    const crossRefContactDx = parseFloat(componentEl.dataset.crossRefContactDx || '');
    const crossRefContactDy = parseFloat(componentEl.dataset.crossRefContactDy || '');
    const reguaLengthMm = parseFloat(componentEl.dataset.reguaLengthMm || '');
    const reguaAngle = parseFloat(componentEl.dataset.reguaAngle || '');
    const reguaMarkerMm = parseFloat(componentEl.dataset.reguaMarkerMm || '');
    const reguaDisplayUnit = String(componentEl.dataset.reguaDisplayUnit || '').trim().toLowerCase();
    return {
        lib: componentEl.dataset.lib || '',
        top: parseFloat(componentEl.style.top) || 0,
        left: parseFloat(componentEl.style.left) || 0,
        rot: parseInt(componentEl.dataset.rot || '0', 10) || 0,
        tag: String(componentEl.dataset.tag || '').trim(),
        comment: String(componentEl.dataset.comment || '').trim(),
        model: String(componentEl.dataset.model || '').trim(),
        manufacturer: String(componentEl.dataset.manufacturer || '').trim(),
        showModelLabel: componentEl.dataset.showModelLabel === 'true',
        showManufacturerLabel: componentEl.dataset.showManufacturerLabel === 'true',
        modelLabelDx: Number.isFinite(parseFloat(componentEl.dataset.modelLabelDx || '')) ? parseFloat(componentEl.dataset.modelLabelDx || '') : null,
        modelLabelDy: Number.isFinite(parseFloat(componentEl.dataset.modelLabelDy || '')) ? parseFloat(componentEl.dataset.modelLabelDy || '') : null,
        manufacturerLabelDx: Number.isFinite(parseFloat(componentEl.dataset.manufacturerLabelDx || '')) ? parseFloat(componentEl.dataset.manufacturerLabelDx || '') : null,
        manufacturerLabelDy: Number.isFinite(parseFloat(componentEl.dataset.manufacturerLabelDy || '')) ? parseFloat(componentEl.dataset.manufacturerLabelDy || '') : null,
        manualOn: componentEl.dataset.manualOn === 'true',
        releTrip: componentEl.dataset.releTrip === 'true',
        sinalColor: String(componentEl.dataset.sinalColor || '').trim(),
        lampColor: String(componentEl.dataset.lampColor || '').trim(),
        timerSeconds: Number.isFinite(timerSeconds) && timerSeconds > 0 ? timerSeconds : null,
        pinLabels,
        crossRefCoilDx: Number.isFinite(crossRefCoilDx) ? crossRefCoilDx : null,
        crossRefCoilDy: Number.isFinite(crossRefCoilDy) ? crossRefCoilDy : null,
        crossRefContactDx: Number.isFinite(crossRefContactDx) ? crossRefContactDx : null,
        crossRefContactDy: Number.isFinite(crossRefContactDy) ? crossRefContactDy : null,
        reguaLengthMm: Number.isFinite(reguaLengthMm) ? reguaLengthMm : null,
        reguaAngle: Number.isFinite(reguaAngle) ? reguaAngle : null,
        reguaMarkerMm: Number.isFinite(reguaMarkerMm) ? reguaMarkerMm : null,
        reguaDisplayUnit: reguaDisplayUnit === 'cm' ? 'cm' : 'mm',
        customData: typeof window.exportComponentCustomData === 'function'
            ? window.exportComponentCustomData(componentEl)
            : null
    };
}

function applyComponentClipboardData(componentEl, data) {
    if (!componentEl || !data) return;
    const rot = parseInt(data.rot, 10) || 0;
    componentEl.dataset.rot = String(rot);
    componentEl.style.transform = `rotate(${rot}deg)`;

    if (data.tag) {
        componentEl.dataset.tag = data.tag;
        const tagLabel = componentEl.querySelector('.tag-label');
        if (tagLabel) tagLabel.innerText = data.tag;
    }

    if (typeof data.comment === 'string') componentEl.dataset.comment = data.comment;
    if (typeof data.model === 'string') componentEl.dataset.model = data.model;
    if (typeof data.manufacturer === 'string') componentEl.dataset.manufacturer = data.manufacturer;
    componentEl.dataset.showModelLabel = data.showModelLabel ? 'true' : 'false';
    componentEl.dataset.showManufacturerLabel = data.showManufacturerLabel ? 'true' : 'false';
    if (Number.isFinite(data.modelLabelDx)) componentEl.dataset.modelLabelDx = String(Math.round(data.modelLabelDx));
    if (Number.isFinite(data.modelLabelDy)) componentEl.dataset.modelLabelDy = String(Math.round(data.modelLabelDy));
    if (Number.isFinite(data.manufacturerLabelDx)) componentEl.dataset.manufacturerLabelDx = String(Math.round(data.manufacturerLabelDx));
    if (Number.isFinite(data.manufacturerLabelDy)) componentEl.dataset.manufacturerLabelDy = String(Math.round(data.manufacturerLabelDy));

    componentEl.dataset.manualOn = data.manualOn ? 'true' : 'false';
    componentEl.dataset.releTrip = data.releTrip ? 'true' : 'false';

    if (data.sinalColor) componentEl.dataset.sinalColor = data.sinalColor;
    if (data.lampColor) {
        componentEl.dataset.lampColor = data.lampColor;
        if (typeof window.applyIecLampColorToComponent === 'function') {
            window.applyIecLampColorToComponent(componentEl, data.lampColor);
        }
    }
    if (typeof window.importComponentCustomData === 'function') {
        window.importComponentCustomData(componentEl, data.customData, { source: 'clipboard' });
    }

    if (Array.isArray(data.pinLabels) && data.pinLabels.length) {
        const pinNodes = Array.from(componentEl.querySelectorAll('.pin-label'));
        pinNodes.forEach((node, idx) => {
            const txt = data.pinLabels[idx];
            if (typeof txt === 'string' && txt.trim()) node.innerText = txt.trim();
        });
    }

    if (Number.isFinite(data.timerSeconds) && data.timerSeconds > 0) {
        const timerLabel = componentEl.querySelector('.timer-label');
        if (timerLabel) {
            timerLabel.dataset.timerSeconds = String(Math.max(1, Math.round(data.timerSeconds)));
            timerLabel.innerText = `${timerLabel.dataset.timerSeconds}s`;
        }
    }

    if (Number.isFinite(data.crossRefCoilDx)) componentEl.dataset.crossRefCoilDx = String(Math.round(data.crossRefCoilDx));
    if (Number.isFinite(data.crossRefCoilDy)) componentEl.dataset.crossRefCoilDy = String(Math.round(data.crossRefCoilDy));
    if (Number.isFinite(data.crossRefContactDx)) componentEl.dataset.crossRefContactDx = String(Math.round(data.crossRefContactDx));
    if (Number.isFinite(data.crossRefContactDy)) componentEl.dataset.crossRefContactDy = String(Math.round(data.crossRefContactDy));
    if (Number.isFinite(data.reguaLengthMm)) componentEl.dataset.reguaLengthMm = String(Math.round(data.reguaLengthMm));
    if (Number.isFinite(data.reguaAngle)) componentEl.dataset.reguaAngle = String(Math.round(data.reguaAngle));
    if (Number.isFinite(data.reguaMarkerMm)) componentEl.dataset.reguaMarkerMm = String(data.reguaMarkerMm);
    if (data.reguaDisplayUnit === 'cm' || data.reguaDisplayUnit === 'mm') {
        componentEl.dataset.reguaDisplayUnit = data.reguaDisplayUnit;
    }
    if (
        componentEl.dataset.lib === 'real_regua_milimetrada' &&
        typeof window.refreshRealReguaMilimetradaComponent === 'function'
    ) {
        window.refreshRealReguaMilimetradaComponent(componentEl);
    }
    syncComponentMetaLabels(componentEl);
}

function getComponentDefinitionByElement(componentEl) {
    if (!componentEl) return null;
    return BIBLIOTECA[componentEl.dataset.lib] || null;
}

function exportComponentCustomData(componentEl) {
    const def = getComponentDefinitionByElement(componentEl);
    if (!def || typeof def.exportData !== 'function') return null;
    try {
        return def.exportData(componentEl);
    } catch (error) {
        console.error('Falha ao exportar dados customizados do componente.', error);
        return null;
    }
}

function importComponentCustomData(componentEl, payload, context = {}) {
    const def = getComponentDefinitionByElement(componentEl);
    if (!def || typeof def.importData !== 'function') return false;
    try {
        def.importData(componentEl, payload, context);
        return true;
    } catch (error) {
        console.error('Falha ao importar dados customizados do componente.', error);
        return false;
    }
}

window.exportComponentCustomData = exportComponentCustomData;
window.importComponentCustomData = importComponentCustomData;

function buildClipboardBorneRef(borneEl, componentIndexByEl) {
    if (!borneEl || !(componentIndexByEl instanceof Map)) return null;
    const componentEl = borneEl.closest('.component');
    if (!componentEl || !componentIndexByEl.has(componentEl)) return null;
    const borneIndex = Array.from(componentEl.querySelectorAll('.borne')).indexOf(borneEl);
    if (borneIndex < 0) return null;
    return {
        componentIndex: componentIndexByEl.get(componentEl),
        borneIndex
    };
}

function resolveClipboardBorneRef(ref, pastedComponents = []) {
    if (!ref || !Array.isArray(pastedComponents)) return null;
    const comp = pastedComponents[ref.componentIndex];
    if (!comp) return null;
    const bornes = Array.from(comp.querySelectorAll('.borne'));
    return bornes[ref.borneIndex] || null;
}

function readDrawingClipboardData(el) {
    if (!el) return null;
    const type = String(el.dataset.drawType || el.tagName || '').toLowerCase();
    const base = {
        type,
        stroke: el.getAttribute('stroke') || el.style.stroke || '#2c3e50',
        strokeWidth: parseFloat(el.getAttribute('stroke-width') || el.style.strokeWidth || '2') || 2,
        fill: el.getAttribute('fill') || 'none',
        fillOpacity: parseFloat(el.getAttribute('fill-opacity') || el.style.fillOpacity || ''),
        text: type === 'text' ? (el.textContent || '') : '',
        fontSize: parseFloat(el.getAttribute('font-size') || ''),
        fontFamily: el.getAttribute('font-family') || '',
        fontWeight: el.getAttribute('font-weight') || '',
        layer: getDrawingLayerName(el)
    };

    if (type === 'line') {
        base.x1 = parseFloat(el.getAttribute('x1')) || 0;
        base.y1 = parseFloat(el.getAttribute('y1')) || 0;
        base.x2 = parseFloat(el.getAttribute('x2')) || 0;
        base.y2 = parseFloat(el.getAttribute('y2')) || 0;
        return base;
    }
    if (type === 'rect') {
        base.x = parseFloat(el.getAttribute('x')) || 0;
        base.y = parseFloat(el.getAttribute('y')) || 0;
        base.width = parseFloat(el.getAttribute('width')) || 0;
        base.height = parseFloat(el.getAttribute('height')) || 0;
        return base;
    }
    if (type === 'polygon') {
        base.points = String(el.getAttribute('points') || '');
        return base;
    }
    if (type === 'text') {
        base.x = parseFloat(el.getAttribute('x')) || 0;
        base.y = parseFloat(el.getAttribute('y')) || 0;
        return base;
    }
    base.cx = parseFloat(el.getAttribute('cx')) || 0;
    base.cy = parseFloat(el.getAttribute('cy')) || 0;
    base.rx = parseFloat(el.getAttribute('rx')) || 0;
    base.ry = parseFloat(el.getAttribute('ry')) || 0;
    return base;
}

function createDrawingFromClipboardData(shape, dx, dy) {
    const svg = getDrawingLayerByName(shape?.layer || 'below');
    if (!svg || !shape) return null;
    const ns = 'http://www.w3.org/2000/svg';
    const type = String(shape.type || '').toLowerCase();
    let el = null;

    if (type === 'line') {
        el = document.createElementNS(ns, 'line');
        el.setAttribute('x1', snapToGrid((shape.x1 || 0) + dx));
        el.setAttribute('y1', snapToGrid((shape.y1 || 0) + dy));
        el.setAttribute('x2', snapToGrid((shape.x2 || 0) + dx));
        el.setAttribute('y2', snapToGrid((shape.y2 || 0) + dy));
    } else if (type === 'rect') {
        el = document.createElementNS(ns, 'rect');
        el.setAttribute('x', snapToGrid((shape.x || 0) + dx));
        el.setAttribute('y', snapToGrid((shape.y || 0) + dy));
        el.setAttribute('width', Number.isFinite(shape.width) ? shape.width : 0);
        el.setAttribute('height', Number.isFinite(shape.height) ? shape.height : 0);
    } else if (type === 'polygon') {
        el = document.createElementNS(ns, 'polygon');
        const points = parsePolygonPointsAttr(shape.points || '')
            .map(pt => ({
                x: snapToGrid((pt.x || 0) + dx),
                y: snapToGrid((pt.y || 0) + dy)
            }));
        el.setAttribute('points', polygonPointsToAttr(points));
    } else if (type === 'text') {
        el = document.createElementNS(ns, 'text');
        el.setAttribute('x', snapToGrid((shape.x || 0) + dx));
        el.setAttribute('y', snapToGrid((shape.y || 0) + dy));
        el.textContent = shape.text || 'Texto';
        el.setAttribute('font-size', Number.isFinite(shape.fontSize) ? shape.fontSize : 18);
        el.setAttribute('font-family', shape.fontFamily || 'Segoe UI, sans-serif');
        el.setAttribute('font-weight', shape.fontWeight || '600');
    } else {
        el = document.createElementNS(ns, 'ellipse');
        el.setAttribute('cx', snapToGrid((shape.cx || 0) + dx));
        el.setAttribute('cy', snapToGrid((shape.cy || 0) + dy));
        el.setAttribute('rx', Number.isFinite(shape.rx) ? shape.rx : 0);
        el.setAttribute('ry', Number.isFinite(shape.ry) ? shape.ry : 0);
    }
    if (!el) return null;

    el.setAttribute('class', 'user-drawing');
    el.dataset.drawType = type;
    el.dataset.drawingLayer = normalizeDrawingLayerName(shape?.layer);
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
    return el;
}

function wirePointClipboardKey(pt) {
    if (!pt) return '';
    const x = Math.round(Number(pt.x) || 0);
    const y = Math.round(Number(pt.y) || 0);
    return `${x}:${y}`;
}

function getWireEndpointComponents(wire) {
    return {
        origemComp: wire?.origem?.closest?.('.component') || null,
        destinoComp: wire?.destino?.closest?.('.component') || null
    };
}

function shouldIncludeWireBySelectedBoundary(wire, selectedComponentSet) {
    if (!(selectedComponentSet instanceof Set) || selectedComponentSet.size === 0) return true;
    const { origemComp, destinoComp } = getWireEndpointComponents(wire);
    const endpoints = [origemComp, destinoComp].filter(Boolean);
    if (!endpoints.length) return true;
    return endpoints.every(comp => selectedComponentSet.has(comp));
}

function buildWirePointAdjacencyMap(allWires = []) {
    const map = new Map();
    allWires.forEach(wire => {
        if (!wire || !Array.isArray(wire.points) || wire.points.length < 2) return;
        const seen = new Set();
        wire.points.forEach(pt => {
            const key = wirePointClipboardKey(pt);
            if (!key || seen.has(key)) return;
            seen.add(key);
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(wire);
        });
    });
    return map;
}

function collectConnectedWiresForClipboard(selectedComponentSet, selectedWireElements) {
    if (typeof listaFios === 'undefined' || !Array.isArray(listaFios) || !listaFios.length) return [];
    const allWires = listaFios.filter(w =>
        !!(w && w.element && Array.isArray(w.points) && w.points.length >= 2)
    );
    if (!allWires.length) return [];

    const included = new Set();
    const queue = [];
    const enqueue = (wire) => {
        if (!wire || included.has(wire)) return;
        included.add(wire);
        queue.push(wire);
    };

    allWires.forEach(wire => {
        const { origemComp, destinoComp } = getWireEndpointComponents(wire);
        const explicitSelected = selectedWireElements.has(wire.element);
        const betweenSelected = !!(
            origemComp &&
            destinoComp &&
            selectedComponentSet.has(origemComp) &&
            selectedComponentSet.has(destinoComp)
        );
        const touchesSelected = !!(
            (origemComp && selectedComponentSet.has(origemComp)) ||
            (destinoComp && selectedComponentSet.has(destinoComp))
        );
        if (explicitSelected || betweenSelected || touchesSelected) {
            enqueue(wire);
        }
    });

    if (!queue.length) return [];
    const adjacencyByPoint = buildWirePointAdjacencyMap(allWires);
    while (queue.length) {
        const current = queue.shift();
        const localSeen = new Set();
        (current.points || []).forEach(pt => {
            const key = wirePointClipboardKey(pt);
            if (!key || localSeen.has(key)) return;
            localSeen.add(key);
            const neighbors = adjacencyByPoint.get(key) || [];
            neighbors.forEach(neighbor => {
                if (included.has(neighbor)) return;
                if (!shouldIncludeWireBySelectedBoundary(neighbor, selectedComponentSet)) return;
                enqueue(neighbor);
            });
        });
    }
    return Array.from(included);
}

function copySelectedCircuitFragment() {
    const selectedComponents = getSelectedComponents();
    const selectedDrawingsArray = Array.from(selectedDrawings);
    const selectedWireElements = new Set(
        (typeof window.getSelectedWireElements === 'function')
            ? (window.getSelectedWireElements() || [])
            : []
    );

    const selectedComponentSet = new Set(selectedComponents);
    const componentIndexByEl = new Map(selectedComponents.map((comp, idx) => [comp, idx]));
    const selectedWires = collectConnectedWiresForClipboard(selectedComponentSet, selectedWireElements);

    if (!selectedComponents.length && !selectedDrawingsArray.length && !selectedWires.length) {
        return false;
    }

    const bounds = initBoundsAccumulator();

    const componentsData = selectedComponents.map(comp => {
        const data = readComponentClipboardData(comp);
        const left = parseFloat(comp.style.left) || 0;
        const top = parseFloat(comp.style.top) || 0;
        const width = Math.max(comp.offsetWidth || 0, GRID_SIZE);
        const height = Math.max(comp.offsetHeight || 0, GRID_SIZE);
        pushBoundsRect(bounds, left, top, left + width, top + height);
        return data;
    }).filter(Boolean);

    const wiresData = selectedWires.map(wire => {
        wire.points.forEach(pt => pushBoundsPoint(bounds, pt.x, pt.y));
        return {
            points: wire.points.map(pt => ({ x: pt.x, y: pt.y })),
            color: wire.colorOriginal || wire.element.style.stroke || '#b71c1c',
            width: Number.isFinite(wire.width) ? wire.width : null,
            number: String(wire.number || '').trim(),
            labelDx: Number.isFinite(wire.labelDx) ? wire.labelDx : 0,
            labelDy: Number.isFinite(wire.labelDy) ? wire.labelDy : 0,
            origemRef: buildClipboardBorneRef(wire.origem, componentIndexByEl),
            destinoRef: buildClipboardBorneRef(wire.destino, componentIndexByEl)
        };
    });

    const drawingsData = selectedDrawingsArray.map(drawing => {
        const rect = getDrawingBoundsFromElement(drawing);
        if (rect) pushBoundsRect(bounds, rect.left, rect.top, rect.right, rect.bottom);
        return readDrawingClipboardData(drawing);
    }).filter(Boolean);

    circuitClipboard = {
        version: 1,
        mode: activeWorkspaceMode,
        bounds: finalizeBounds(bounds),
        components: componentsData,
        wires: wiresData,
        drawings: drawingsData,
        pasteCount: 0
    };
    updateClipboardButtons();
    return true;
}

function pasteCircuitClipboard() {
    if (!circuitClipboard) return false;
    if (simulando) return false;

    const targetMode = circuitClipboard.mode || activeWorkspaceMode;
    if (targetMode !== activeWorkspaceMode && typeof setMenuMode === 'function') {
        setMenuMode(targetMode);
    }

    const nextPasteCount = (parseInt(circuitClipboard.pasteCount, 10) || 0) + 1;
    const dx = nextPasteCount * GRID_SIZE;
    const dy = nextPasteCount * GRID_SIZE;

    clearComponentSelection();
    if (typeof window.clearWireSelection === 'function') window.clearWireSelection();
    clearDrawingSelection();

    const pastedComponents = [];
    const pastedWireElements = [];
    (circuitClipboard.components || []).forEach(compData => {
        if (!compData?.lib) return;
        const rawTop = (parseFloat(compData.top) || 0) + dy;
        const rawLeft = (parseFloat(compData.left) || 0) + dx;
        const freeMove = isFreeMoveComponentLib(compData.lib);
        const nextTop = freeMove ? rawTop : snapToGrid(rawTop);
        const nextLeft = freeMove ? rawLeft : snapToGrid(rawLeft);
        const comp = adicionarComponente(compData.lib, null, nextTop, nextLeft, {
            allowOutOfMode: true,
            highlightOnCreate: false,
            ensureVisibleOnCreate: false,
            autoWireOnCreate: false
        });
        if (!comp) {
            pastedComponents.push(null);
            return;
        }
        applyComponentClipboardData(comp, compData);
        setComponentSelected(comp, true);
        pastedComponents.push(comp);
    });

    (circuitClipboard.wires || []).forEach(wireData => {
        const shiftedPoints = Array.isArray(wireData?.points)
            ? wireData.points.map(pt => ({
                x: snapToGrid((pt.x || 0) + dx),
                y: snapToGrid((pt.y || 0) + dy)
            }))
            : [];
        if (shiftedPoints.length < 2) return;
        if (typeof window.createWireFromPoints !== 'function') return;
        const origem = resolveClipboardBorneRef(wireData.origemRef, pastedComponents);
        const destino = resolveClipboardBorneRef(wireData.destinoRef, pastedComponents);
        const createdWire = window.createWireFromPoints(shiftedPoints, {
            color: wireData.color || undefined,
            width: Number.isFinite(wireData.width) ? wireData.width : undefined,
            origem: origem || null,
            destino: destino || null,
            number: wireData.number || '',
            labelDx: Number.isFinite(wireData.labelDx) ? wireData.labelDx : 0,
            labelDy: Number.isFinite(wireData.labelDy) ? wireData.labelDy : 0
        });
        if (createdWire?.element) pastedWireElements.push(createdWire.element);
    });

    const pastedDrawings = [];
    (circuitClipboard.drawings || []).forEach(shape => {
        const drawing = createDrawingFromClipboardData(shape, dx, dy);
        if (!drawing) return;
        pastedDrawings.push(drawing);
        selectDrawing(drawing, true);
    });

    if (typeof window.rebindWireEndpoints === 'function') window.rebindWireEndpoints();
    if (typeof window.renderWireJunctions === 'function') window.renderWireJunctions();
    if (typeof window.renderWireLabels === 'function') window.renderWireLabels();
    if (typeof window.selectWire === 'function' && pastedWireElements.length) {
        pastedWireElements.forEach((poly) => {
            window.selectWire(poly, true);
        });
    }
    if (typeof window.setWireSelectionPinned === 'function' && pastedWireElements.length) {
        window.setWireSelectionPinned(true);
    }
    if (engineeringMode) recarregarVarsEngenharia();

    circuitClipboard.pasteCount = nextPasteCount;
    updateClipboardButtons();
    const changed = pastedComponents.some(Boolean) || pastedDrawings.length > 0 || (circuitClipboard.wires || []).length > 0;
    if (changed) scheduleCrossReferenceRefresh();
    return changed;
}

window.copiarSelecaoCircuito = function () {
    if (simulando) {
        showSimulationInteractionLockMessage();
        return false;
    }
    return copySelectedCircuitFragment();
};

window.colarSelecaoCircuito = function () {
    if (simulando) {
        showSimulationInteractionLockMessage();
        return false;
    }
    const pasted = pasteCircuitClipboard();
    if (pasted) scheduleHistoryCheckpoint('paste_selection');
    return pasted;
};

function deleteSelectedComponents() {
    const comps = getSelectedComponents();
    if (!comps.length) return false;

    comps.forEach(c => {
        if (!c) return;
        if (typeof window.interact === 'function') {
            try { window.interact(c).unset(); } catch (_) { }
        }
        c.remove();
    });

    if (typeof window.cleanupDisconnectedWireEndpoints === 'function') {
        window.cleanupDisconnectedWireEndpoints();
    }
    if (typeof window.requestRenderWireJunctions === 'function') {
        window.requestRenderWireJunctions();
    } else if (typeof window.renderWireJunctions === 'function') {
        window.renderWireJunctions();
    }
    if (engineeringMode) recarregarVarsEngenharia();
    scheduleCrossReferenceRefresh();
    return true;
}

function clearComponentSelection() {
    getSelectedComponents().forEach(c => {
        c.classList.remove('component-selected');
        clearSelectionFrameVars(c);
    });
    if (engineeringMode) recarregarVarsEngenharia();
    updateMobileQuickActionButtons();
}

function setComponentSelected(componentEl, selected) {
    if (!componentEl) return;
    if (selected) engineeringSheetScaleTargetActive = false;
    componentEl.classList.toggle('component-selected', !!selected);
    if (selected) applySelectionFrameVars(componentEl);
    if (!selected) clearSelectionFrameVars(componentEl);
    if (engineeringMode) recarregarVarsEngenharia();
    updateMobileQuickActionButtons();
}

function selectSingleComponent(componentEl) {
    clearComponentSelection();
    setComponentSelected(componentEl, true);
    if (engineeringMode) recarregarVarsEngenharia();
}

function getComponentVisualRect(componentEl) {
    const lib = String(componentEl?.dataset?.lib || '');
    if (lib === 'real_canaleta_reta' || lib === 'real_canaleta_canto_90') {
        const canaletaWrap = componentEl?.querySelector?.('.real-canaleta-wrap');
        const rect = canaletaWrap?.getBoundingClientRect?.();
        if (rect) return rect;
    }
    if (isFreeMoveComponent(componentEl)) {
        return componentEl?.getBoundingClientRect?.() || null;
    }
    const wrapper = componentEl?.querySelector?.(':scope > .component-fine-adjust');
    const rect = wrapper?.getBoundingClientRect?.() || componentEl?.getBoundingClientRect?.();
    return rect || null;
}

function updateSelectionRectVisual(rect) {
    if (!selectMarquee) return;
    selectMarquee.style.left = `${Math.round(rect.left)}px`;
    selectMarquee.style.top = `${Math.round(rect.top)}px`;
    selectMarquee.style.width = `${Math.round(rect.width)}px`;
    selectMarquee.style.height = `${Math.round(rect.height)}px`;
}

function getBorneCenterInWorkspace(borneEl) {
    const bancada = document.getElementById('bancada');
    if (!borneEl || !bancada) return null;
    const br = bancada.getBoundingClientRect();
    const r = borneEl.getBoundingClientRect();
    return {
        x: (r.left + (r.width / 2) - br.left) / zoomLevel,
        y: (r.top + (r.height / 2) - br.top) / zoomLevel
    };
}

function syncMovedWiresWithComponents(movedComponents, delta = null, opts = {}) {
    if (!Array.isArray(movedComponents) || !movedComponents.length) return;
    if (typeof listaFios === 'undefined' || !Array.isArray(listaFios) || !listaFios.length) return;
    const includeSelected = !!opts?.includeSelected;
    const liveDrag = !!opts?.liveDrag;
    const skipRender = !!opts?.skipRender;
    const skipRebind = !!opts?.skipRebind;
    const skipIndex = !!opts?.skipIndex;

    const movedBornes = new Set();
    movedComponents.forEach(comp => {
        comp.querySelectorAll('.borne').forEach(b => movedBornes.add(b));
    });

    const dx = Number.isFinite(delta?.dx) ? delta.dx : 0;
    const dy = Number.isFinite(delta?.dy) ? delta.dy : 0;
    if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return;

    const samePoint = (a, b, tol = 1.2) => {
        if (!a || !b) return false;
        return Math.abs((a.x || 0) - (b.x || 0)) <= tol && Math.abs((a.y || 0) - (b.y || 0)) <= tol;
    };

    const pointOnSegment = (pt, a, b, tol = 1.2) => {
        if (!pt || !a || !b) return false;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len2 = dx * dx + dy * dy;
        if (len2 <= 1e-9) {
            return Math.hypot((pt.x || 0) - (a.x || 0), (pt.y || 0) - (a.y || 0)) <= tol;
        }
        const len = Math.sqrt(len2);
        const cross = Math.abs((pt.y - a.y) * dx - (pt.x - a.x) * dy);
        const perpDist = cross / len;
        if (perpDist > tol) return false;
        const dot = (pt.x - a.x) * dx + (pt.y - a.y) * dy;
        const margin = tol / len;
        const t = dot / len2;
        return t >= -margin && t <= (1 + margin);
    };

    const hasJunctionBetween = (wireA, wireB) => {
        const pointsA = wireA?.points || [];
        const pointsB = wireB?.points || [];
        if (pointsA.length < 2 || pointsB.length < 2) return false;

        for (let i = 0; i < pointsA.length; i++) {
            for (let j = 0; j < pointsB.length; j++) {
                if (samePoint(pointsA[i], pointsB[j])) return true;
            }
        }

        const endpointsA = [pointsA[0], pointsA[pointsA.length - 1]];
        const endpointsB = [pointsB[0], pointsB[pointsB.length - 1]];

        for (let i = 0; i < endpointsA.length; i++) {
            const ep = endpointsA[i];
            for (let j = 0; j < pointsB.length - 1; j++) {
                const a = pointsB[j];
                const b = pointsB[j + 1];
                if (samePoint(ep, a) || samePoint(ep, b)) continue;
                if (pointOnSegment(ep, a, b)) return true;
            }
        }

        for (let i = 0; i < endpointsB.length; i++) {
            const ep = endpointsB[i];
            for (let j = 0; j < pointsA.length - 1; j++) {
                const a = pointsA[j];
                const b = pointsA[j + 1];
                if (samePoint(ep, a) || samePoint(ep, b)) continue;
                if (pointOnSegment(ep, a, b)) return true;
            }
        }

        return false;
    };

    const selectedWireEls = new Set(
        Array.from(document.querySelectorAll('#wire-layer .user-wire.wire-selected'))
    );
    const autoCandidates = [];
    let updatedAny = false;

    const hasFixedBorneEndpoint = (wireObj) => {
        if (!wireObj) return true;
        const origemFixed = !!(wireObj.origem && !movedBornes.has(wireObj.origem));
        const destinoFixed = !!(wireObj.destino && !movedBornes.has(wireObj.destino));
        return origemFixed || destinoFixed;
    };

    const reanchorEndpointWithNeighbor = (wireObj, endpointIdx, neighborIdx, targetPos) => {
        if (!wireObj || !Array.isArray(wireObj.points) || !targetPos) return false;
        if (endpointIdx < 0 || endpointIdx >= wireObj.points.length) return false;
        const oldEnd = { ...wireObj.points[endpointIdx] };
        wireObj.points[endpointIdx] = {
            ...wireObj.points[endpointIdx],
            x: targetPos.x,
            y: targetPos.y
        };

        if (
            wireObj.points.length > 2 &&
            neighborIdx >= 0 &&
            neighborIdx < wireObj.points.length
        ) {
            const oldNeighbor = wireObj.points[neighborIdx] || null;
            if (oldNeighbor) {
                const horizontal =
                    Math.abs((oldNeighbor.x || 0) - (oldEnd.x || 0)) >=
                    Math.abs((oldNeighbor.y || 0) - (oldEnd.y || 0));
                if (horizontal) {
                    wireObj.points[neighborIdx] = {
                        ...wireObj.points[neighborIdx],
                        y: targetPos.y
                    };
                } else {
                    wireObj.points[neighborIdx] = {
                        ...wireObj.points[neighborIdx],
                        x: targetPos.x
                    };
                }
            }
        }
        return true;
    };

    listaFios.forEach(f => {
        if (!f || !Array.isArray(f.points) || f.points.length < 2 || !f.element) return;
        if (!includeSelected && selectedWireEls.has(f.element)) return;

        const origemMoved = !!(f.origem && movedBornes.has(f.origem));
        const destinoMoved = !!(f.destino && movedBornes.has(f.destino));
        const anchoredToMoved = origemMoved || destinoMoved;
        if (!anchoredToMoved) return;

        // Se nao ha ponta fixa em borne externo, o segmento inteiro deve transladar
        // junto com o grupo (inclusive quando uma ponta e emenda/solta).
        if (!hasFixedBorneEndpoint(f)) {
            autoCandidates.push(f);
            return;
        }

        const firstIdx = 0;
        const lastIdx = f.points.length - 1;
        let changed = false;

        if (origemMoved) {
            const startPos = getBorneCenterInWorkspace(f.origem);
            changed = reanchorEndpointWithNeighbor(f, firstIdx, firstIdx + 1, startPos) || changed;
        }
        if (destinoMoved) {
            const endPos = getBorneCenterInWorkspace(f.destino);
            changed = reanchorEndpointWithNeighbor(f, lastIdx, lastIdx - 1, endPos) || changed;
        }

        if (changed) {
            f.element.setAttribute('points', f.points.map(p => `${p.x},${p.y}`).join(' '));
            updatedAny = true;
        }
    });

    if (!autoCandidates.length) {
        if (!updatedAny) return;
        if (!skipRebind && typeof window.rebindWireEndpoints === 'function') window.rebindWireEndpoints();
        if (!skipIndex && typeof markWireIndexDirty === 'function') markWireIndexDirty();
        if (!skipRender && typeof renderWireJunctions === 'function') renderWireJunctions();
        return;
    }
    const autoMoveSet = new Set(autoCandidates);
    const totalWires = Array.isArray(listaFios) ? listaFios.length : 0;
    const expandChain = !!opts?.expandChain;
    const canExpandChain = expandChain && totalWires <= 80 && !liveDrag;
    const MAX_CHAIN_EXPANSION_PASSES = 6;
    const MAX_CHAIN_COMPARISONS = 2500;

    // Expande para segmentos de emenda conectados ao conjunto movido.
    // Isso preserva barramentos/ramificacoes sem borne nas pontas.
    if (canExpandChain) {
        let expanded = true;
        let pass = 0;
        let comparisons = 0;
        while (expanded && pass < MAX_CHAIN_EXPANSION_PASSES && comparisons < MAX_CHAIN_COMPARISONS) {
            expanded = false;
            pass++;
            listaFios.forEach(other => {
                if (!other || !Array.isArray(other.points) || other.points.length < 2 || !other.element) return;
                if (!includeSelected && selectedWireEls.has(other.element)) return;
                if (autoMoveSet.has(other)) return;
                if (hasFixedBorneEndpoint(other)) return;
                let touchesAutoSet = false;
                for (const base of autoMoveSet) {
                    comparisons++;
                    if (comparisons >= MAX_CHAIN_COMPARISONS) break;
                    if (hasJunctionBetween(base, other)) {
                        touchesAutoSet = true;
                        break;
                    }
                }
                if (!touchesAutoSet) return;
                autoMoveSet.add(other);
                expanded = true;
            });
        }
    } else {
        // Em drag ao vivo (ou modo seguro), move apenas os segmentos candidatos
        // sem tentar expandir cadeia completa de emendas.
        autoCandidates.forEach(w => autoMoveSet.add(w));
    }

    // Mantem toda a cadeia de emendas conectada aos componentes movidos.
    // Evita "sumir" emenda na soltura quando parte dos segmentos nao entrou na selecao.
    // O bloqueio por ponta fixa em borne ja foi aplicado acima.

    listaFios.forEach(f => {
        if (!f || !Array.isArray(f.points) || f.points.length < 2 || !f.element) return;
        if (!autoMoveSet.has(f)) return;

        const firstIdx = 0;
        const lastIdx = f.points.length - 1;

        // Nao aplicar snap aqui: os fios ja podem estar em coordenadas decimais
        // durante drag, e snap misto quebra continuidade de emendas.
        f.points = f.points.map(p => ({
            ...p,
            x: p.x + dx,
            y: p.y + dy
        }));

        // Reancora nas duas pontas para garantir continuidade exata nos bornes.
        const startPos = getBorneCenterInWorkspace(f.origem);
        const endPos = getBorneCenterInWorkspace(f.destino);
        if (startPos) f.points[firstIdx] = { ...f.points[firstIdx], x: startPos.x, y: startPos.y };
        if (endPos) f.points[lastIdx] = { ...f.points[lastIdx], x: endPos.x, y: endPos.y };

        f.element.setAttribute('points', f.points.map(p => `${p.x},${p.y}`).join(' '));
        updatedAny = true;
    });

    if (!updatedAny) return;
    if (!skipRebind && typeof window.rebindWireEndpoints === 'function') window.rebindWireEndpoints();
    if (!skipIndex && typeof markWireIndexDirty === 'function') markWireIndexDirty();
    if (!skipRender && typeof renderWireJunctions === 'function') renderWireJunctions();
}

let dragWireRefreshQueued = false;
let dragWireRefreshLastAt = 0;
function scheduleDragWireRefresh() {
    if (dragWireRefreshQueued) return;
    const MIN_REFRESH_MS = 90;
    const now = Date.now();
    const waitMs = Math.max(0, MIN_REFRESH_MS - (now - dragWireRefreshLastAt));
    dragWireRefreshQueued = true;
    const run = () => {
        dragWireRefreshQueued = false;
        dragWireRefreshLastAt = Date.now();
        if (typeof window.renderWireJunctions === 'function') window.renderWireJunctions();
    };
    if (waitMs <= 0 && typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(run);
    } else {
        setTimeout(run, waitMs);
    }
}

function finalizeDraggedComponentsAndWires(dragGroup, getStartForComponent) {
    if (!Array.isArray(dragGroup) || !dragGroup.length) return;

    const rawByComp = new Map();
    dragGroup.forEach(comp => {
        const rawLeft = parseFloat(comp?.style?.left) || 0;
        const rawTop = parseFloat(comp?.style?.top) || 0;
        rawByComp.set(comp, { left: rawLeft, top: rawTop });
        if (isFreeMoveComponent(comp)) {
            comp.style.left = `${rawLeft}px`;
            comp.style.top = `${rawTop}px`;
        } else {
            comp.style.left = Math.round(rawLeft / GRID_SIZE) * GRID_SIZE + 'px';
            comp.style.top = Math.round(rawTop / GRID_SIZE) * GRID_SIZE + 'px';
        }
    });

    if (typeof window.reanchorSelectedWiresToComponents === 'function') {
        window.reanchorSelectedWiresToComponents(dragGroup);
    }
    if (typeof window.handleAutoWireAfterComponentsDrop === 'function') {
        window.handleAutoWireAfterComponentsDrop(dragGroup, { showGuides: false });
    }
    scheduleCrossReferenceRefresh();
}

function initSelectionMarquee() {
    const viewport = document.getElementById('viewport');
    if (!viewport) return;

    viewport.addEventListener('pointerdown', (e) => {
        if (simulando || ferramentaAtiva !== 'select') return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (menuComponentDrag) return;
        if (typeof window.isWireAssistDrawingInProgress === 'function' && window.isWireAssistDrawingInProgress()) {
            return;
        }

        const target = e.target;
        if (
            target.closest('.component') ||
            target.closest('.user-wire') ||
            target.closest('.user-drawing') ||
            target.closest('.sidebar') ||
            target.closest('.top-bar') ||
            target.closest('.modal')
        ) {
            return;
        }

        const rect = viewport.getBoundingClientRect();
        const startX = e.clientX - rect.left;
        const startY = e.clientY - rect.top;
        selectMarqueePointerId = e.pointerId;
        selectMarqueeStart = { x: startX, y: startY, additive: !!(e.shiftKey || e.ctrlKey || e.metaKey) };
        selectMarqueeCurrent = { x: startX, y: startY };
        selectMarqueeMoved = false;

        if (!selectMarquee) {
            selectMarquee = document.createElement('div');
            selectMarquee.className = 'selection-rect';
            viewport.appendChild(selectMarquee);
        }
        updateSelectionRectVisual({ left: startX, top: startY, width: 0, height: 0 });
        selectMarquee.style.display = 'block';
    }, true);

    window.addEventListener('pointermove', (e) => {
        if (selectMarqueePointerId === null || e.pointerId !== selectMarqueePointerId || !selectMarqueeStart) return;
        const viewportRect = viewport.getBoundingClientRect();
        const curX = e.clientX - viewportRect.left;
        const curY = e.clientY - viewportRect.top;
        const left = Math.min(selectMarqueeStart.x, curX);
        const top = Math.min(selectMarqueeStart.y, curY);
        const width = Math.abs(curX - selectMarqueeStart.x);
        const height = Math.abs(curY - selectMarqueeStart.y);
        selectMarqueeCurrent = { x: curX, y: curY };
        selectMarqueeMoved = selectMarqueeMoved || width > 5 || height > 5;
        if (selectMarquee) {
            const crossing = curX < selectMarqueeStart.x;
            selectMarquee.classList.toggle('crossing', crossing);
        }
        updateSelectionRectVisual({ left, top, width, height });
    }, true);

    const finish = (e) => {
        if (selectMarqueePointerId === null || !selectMarqueeStart) return;
        if (e && e.pointerId !== selectMarqueePointerId) return;

        const additive = selectMarqueeStart.additive;
        const box = selectMarquee?.getBoundingClientRect();
        if (selectMarquee) selectMarquee.style.display = 'none';

        if (box && selectMarqueeMoved) {
            const crossing = (selectMarqueeCurrent?.x ?? selectMarqueeStart.x) < selectMarqueeStart.x;
            const selectMode = crossing ? 'touch' : 'inside';
            if (!additive) {
                clearComponentSelection();
                clearDrawingSelection();
            }
            const comps = Array.from(document.querySelectorAll('#bancada .component'));
            comps.forEach(comp => {
                const r = comp.getBoundingClientRect();
                const hit = selectMode === 'touch'
                    ? !(r.right < box.left || r.left > box.right || r.bottom < box.top || r.top > box.bottom)
                    : (r.left >= box.left && r.right <= box.right && r.top >= box.top && r.bottom <= box.bottom);
                if (hit) setComponentSelected(comp, true);
            });
            if (typeof window.selectWiresByScreenRect === 'function') {
                window.selectWiresByScreenRect(box, additive, selectMode, { persist: true });
            }
            const drawings = getDrawingLayers().flatMap(layer => Array.from(layer.querySelectorAll('.user-drawing')));
            drawings.forEach(d => {
                const r = d.getBoundingClientRect();
                const hit = selectMode === 'touch'
                    ? !(r.right < box.left || r.left > box.right || r.bottom < box.top || r.top > box.bottom)
                    : (r.left >= box.left && r.right <= box.right && r.top >= box.top && r.bottom <= box.bottom);
                if (hit) selectDrawing(d, true);
            });
            componentTapSuppressUntil = Date.now() + 180;
        } else if (!additive && !selectMarqueeMoved) {
            clearComponentSelection();
            if (typeof window.clearWireSelection === 'function') window.clearWireSelection();
            clearDrawingSelection();
        }

        selectMarqueePointerId = null;
        selectMarqueeStart = null;
        selectMarqueeCurrent = null;
        selectMarqueeMoved = false;
        if (selectMarquee) selectMarquee.classList.remove('crossing');
    };

    window.addEventListener('pointerup', finish, true);
    window.addEventListener('pointercancel', finish, true);
}

function getEventClientPoint(event) {
    const x = Number.isFinite(event?.client?.x)
        ? event.client.x
        : (Number.isFinite(event?.clientX) ? event.clientX : (Number.isFinite(event?.pageX) ? event.pageX : NaN));
    const y = Number.isFinite(event?.client?.y)
        ? event.client.y
        : (Number.isFinite(event?.clientY) ? event.clientY : (Number.isFinite(event?.pageY) ? event.pageY : NaN));
    return { x, y };
}
function updateMouseGuidesForComponent(componentEl) {
    if (!componentEl?.getBoundingClientRect) return;
    const rect = componentEl.getBoundingClientRect();
    const clientX = rect.left + (rect.width / 2);
    const clientY = rect.top + (rect.height / 2);
    updateMouseGuidesAtClient(clientX, clientY);
}
function updateMouseGuidesAtClient(clientX, clientY) {
    const h = document.getElementById('crosshair-h');
    const v = document.getElementById('crosshair-v');
    const viewport = document.getElementById('viewport');
    if (!h || !v || !viewport) return;

    const bancada = document.getElementById('bancada');
    const assistCursorAtivo = !!bancada?.classList?.contains('cursor-fio-assist');
    const shouldShow = !simulando && (ferramentaAtiva === 'fio' || assistCursorAtivo || componentDragGuideActive);
    if (!shouldShow) {
        h.style.display = 'none';
        v.style.display = 'none';
        return;
    }

    const rect = viewport.getBoundingClientRect();
    const inside =
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom;

    if (!inside) {
        h.style.display = 'none';
        v.style.display = 'none';
        return;
    }

    h.style.left = `${rect.left}px`;
    h.style.width = `${rect.width}px`;
    h.style.top = `${clientY}px`;
    h.style.display = 'block';

    v.style.top = `${rect.top}px`;
    v.style.height = `${rect.height}px`;
    v.style.left = `${clientX}px`;
    v.style.display = 'block';
}
function setComponentDragGuidesActive(active) {
    componentDragGuideActive = !!active;
    if (!componentDragGuideActive && typeof window.hideMouseGuides === 'function') {
        window.hideMouseGuides();
    }
}

function isComponentInteractionBlockedByWireMode(target = null) {
    const wireInProgress = !!(typeof window.isWireAssistDrawingInProgress === 'function' && window.isWireAssistDrawingInProgress());
    if (!(ferramentaAtiva === 'fio' || wireInProgress)) return false;
    const targetEl = target && target.nodeType === 1 ? target : null;
    if (targetEl?.closest?.('.borne')) return false;
    return true;
}

function initInteractDrag(componentEl) {
    if (typeof window.interact !== 'function') return false;

    const resolveDragHost = (event) => {
        const candidate = event?.currentTarget || event?.target;
        const host = candidate?.closest?.('.component') || candidate;
        return host && host.classList && host.classList.contains('component') ? host : null;
    };

    window.interact(componentEl).draggable({
        ignoreFrom: '.pin-label, .timer-label, .rele-controls, .toggle-state-btn, .manual-on-btn, .manual-off-btn, .real-regua-controls, .real-regua-controls *, .real-regua-marker, .real-regua-marker *, [data-timer-action], .wifi-add, .wifi-device button, .wifi-reset',
        listeners: {
            start(event) {
                const target = resolveDragHost(event);
                if (!target) return;
                if (isComponentInteractionBlockedByWireMode(event?.target || event?.currentTarget || null)) {
                    if (event?.interaction && typeof event.interaction.stop === 'function') {
                        event.interaction.stop();
                    }
                    return;
                }
                if (!simulando && ferramentaAtiva === 'select') {
                    setComponentDragGuidesActive(true);
                    updateMouseGuidesForComponent(target);
                    if (typeof window.previewPlacementGuidesForComponent === 'function') {
                        window.previewPlacementGuidesForComponent(target);
                    }
                }
                const activeSelected = getSelectedComponents();
                const dragGroup =
                    (target.classList.contains('component-selected') && activeSelected.length > 1)
                        ? activeSelected
                        : [target];

                target._dragGroup = dragGroup;
                target._dragMoved = false;
                target._dragStartByComp = new Map();

                dragGroup.forEach(comp => {
                    comp._dragRawLeft = parseFloat(comp.style.left) || comp.offsetLeft || 0;
                    comp._dragRawTop = parseFloat(comp.style.top) || comp.offsetTop || 0;
                    target._dragStartByComp.set(comp, { left: comp._dragRawLeft, top: comp._dragRawTop });
                });
                if (typeof window.pauseWireSelectionAutoClear === 'function') {
                    window.pauseWireSelectionAutoClear();
                }
            },
            move(event) {
                const target = resolveDragHost(event);
                if (!target) return;
                if (isComponentInteractionBlockedByWireMode(event?.target || event?.currentTarget || null)) return;
                if ((simulando && target.dataset.lib !== 'real_wifi_smart_phone') || ferramentaAtiva !== 'select') return;
                const dragGroup = Array.isArray(target._dragGroup) && target._dragGroup.length
                    ? target._dragGroup
                    : [target];
                target._dragMoved = true;
                updateMouseGuidesForComponent(target);
                if (typeof window.previewPlacementGuidesForComponent === 'function') {
                    window.previewPlacementGuidesForComponent(target);
                }
                const primaryComp = dragGroup[0] || target;
                const prevDisplayLeft = parseFloat(primaryComp?.style?.left) || primaryComp?.offsetLeft || 0;
                const prevDisplayTop = parseFloat(primaryComp?.style?.top) || primaryComp?.offsetTop || 0;

                dragGroup.forEach(comp => {
                    if (typeof comp._dragRawLeft !== 'number') {
                        comp._dragRawLeft = parseFloat(comp.style.left) || comp.offsetLeft || 0;
                    }
                    if (typeof comp._dragRawTop !== 'number') {
                        comp._dragRawTop = parseFloat(comp.style.top) || comp.offsetTop || 0;
                    }

                    comp._dragRawLeft += (event.dx / zoomLevel);
                    comp._dragRawTop += (event.dy / zoomLevel);

                    const freeMove = isFreeMoveComponent(comp);
                    const nextLeft = freeMove ? comp._dragRawLeft : snapToGrid(comp._dragRawLeft);
                    const nextTop = freeMove ? comp._dragRawTop : snapToGrid(comp._dragRawTop);
                    comp.style.left = `${nextLeft}px`;
                    comp.style.top = `${nextTop}px`;
                });
                const nextDisplayLeft = parseFloat(primaryComp?.style?.left) || primaryComp?.offsetLeft || 0;
                const nextDisplayTop = parseFloat(primaryComp?.style?.top) || primaryComp?.offsetTop || 0;
                const deltaLeft = nextDisplayLeft - prevDisplayLeft;
                const deltaTop = nextDisplayTop - prevDisplayTop;
                if (
                    (Math.abs(deltaLeft) > 0.001 || Math.abs(deltaTop) > 0.001) &&
                    typeof window.moveSelectedWiresByDelta === 'function'
                ) {
                    window.moveSelectedWiresByDelta({ dx: deltaLeft, dy: deltaTop }, dragGroup, { snap: false });
                }
            },
            end(event) {
                const target = resolveDragHost(event);
                setComponentDragGuidesActive(false);
                if (!target) return;
                const dragGroup = Array.isArray(target._dragGroup) && target._dragGroup.length
                    ? target._dragGroup
                    : [target];
                if (typeof window.clearAutoWireGuides === 'function') {
                    window.clearAutoWireGuides();
                }
                if (target._dragMoved) {
                    finalizeDraggedComponentsAndWires(
                        dragGroup,
                        (comp) => target._dragStartByComp?.get(comp) || null
                    );
                }
                dragGroup.forEach(comp => {
                    delete comp._dragRawLeft;
                    delete comp._dragRawTop;
                });
                if (typeof window.resumeWireSelectionAutoClear === 'function') {
                    window.resumeWireSelectionAutoClear();
                }
                delete target._dragGroup;
                delete target._dragMoved;
                delete target._dragStartByComp;
            }
        }
    });

    return true;
}

function getDefaultTag(def, key) {
    const nextByPrefix = (prefix) => {
        let max = 0;
        document.querySelectorAll('#bancada .component').forEach(c => {
            const t = (c.dataset.tag || '').trim().toUpperCase();
            const m = t.match(new RegExp(`^${prefix}(\\d+)$`));
            if (!m) return;
            const n = parseInt(m[1], 10);
            if (!Number.isNaN(n) && n > max) max = n;
        });
        return `${prefix}${max + 1}`;
    };

    if (def.tagDefault && /\d+$/.test(def.tagDefault)) {
        const prefix = def.tagDefault.replace(/\d+$/, '').toUpperCase();
        return nextByPrefix(prefix);
    }

    const libKey = String(key || '').trim().toLowerCase();
    const nome = String(def?.nome || '').trim().toLowerCase();

    const isAny = (...tokens) => tokens.some(token => libKey.includes(token) || nome.includes(token));
    const isTemporization = isAny('temporizador', 'temporiz', 'temp');

    switch (def.tipo) {
        case 'fonte-fase': return nextByPrefix('L');
        case 'fonte-neutro': return nextByPrefix('N');
        case 'fonte-mista': return nextByPrefix('L');
        case 'carga': return nextByPrefix('H');
        case 'motor': return nextByPrefix('M');
        case 'sinaleiro': return nextByPrefix('H');
        case 'bobina':
            return isTemporization ? nextByPrefix('D') : nextByPrefix('K');
        case 'contato':
            return isTemporization ? nextByPrefix('D') : nextByPrefix('K');
        case 'contator':
            return nextByPrefix('K');
        case 'bobina_temporizada':
            return nextByPrefix('D');
        case 'botao': return nextByPrefix('S');
        case 'protecao': {
            if (isAny('disjuntor', 'seccionador', 'interruptor')) return nextByPrefix('Q');
            if (isAny('fusivel', 'fusiveis', 'rele_term', 'rele termico', 'para-raio', 'pararaio')) return nextByPrefix('F');
            return nextByPrefix('F');
        }
        default: return nextByPrefix((key || 'X').slice(0, 1).toUpperCase());
    }
}

function getSpawnPosition() {
    const viewport = document.getElementById('viewport');
    const app = document.querySelector('.app-container');
    const sidebar = document.querySelector('.sidebar');

    const visibleLeft = (-panX) / zoomLevel;
    const visibleTop = (-panY) / zoomLevel;

    const mobile = isMobileViewport();
    const sidebarOverViewport = !!(app && sidebar && app.classList.contains('sidebar-open') && mobile);
    const sidebarOffsetPx = sidebarOverViewport ? sidebar.getBoundingClientRect().width : 0;

    const viewportRect = viewport ? viewport.getBoundingClientRect() : { width: 900, height: 600 };
    const spawnX = mobile
        ? visibleLeft + ((viewportRect.width * 0.52) / zoomLevel)
        : visibleLeft + ((sidebarOffsetPx + 140) / zoomLevel);
    const spawnY = mobile
        ? visibleTop + ((viewportRect.height * 0.45) / zoomLevel)
        : visibleTop + ((viewportRect.height * 0.35) / zoomLevel);

    return {
        left: Math.max(0, spawnX),
        top: Math.max(0, spawnY)
    };
}

function applyComponentFineAdjust(componentEl, libKey) {
    if (!componentEl || !libKey) return;
    if (!libKey.startsWith('iec_') && !libKey.startsWith('real_')) return;

    const cssKey = libKey.replaceAll('_', '-');
    const offsetXVar = `--${cssKey}-offset-x`;
    const offsetYVar = `--${cssKey}-offset-y`;
    const scaleVar = `--${cssKey}-scale`;
    const scaleXVar = `--${cssKey}-scale-x`;
    const wrapper = document.createElement('div');
    wrapper.className = 'component-fine-adjust';
    wrapper.style.position = 'relative';
    wrapper.style.transformOrigin = 'top left';
    wrapper.style.transform = `translate(var(${offsetXVar}, 0px), var(${offsetYVar}, 0px)) scaleX(var(${scaleXVar}, 1)) scale(var(${scaleVar}, 1))`;

    const fixedOverlays = [];
    while (componentEl.firstChild) {
        const child = componentEl.firstChild;
        if (
            child.classList &&
            (
                child.classList.contains('borne') ||
                child.classList.contains('pin-label')
            )
        ) {
            fixedOverlays.push(child);
            componentEl.removeChild(child);
            continue;
        }
        wrapper.appendChild(child);
    }

    componentEl.appendChild(wrapper);
    fixedOverlays.forEach(el => componentEl.appendChild(el));

    applyIndependentRealBorneVars(componentEl, libKey);
}

function applyIndependentRealBorneVars(componentEl, libKey) {
    if (!componentEl || !libKey || !libKey.startsWith('real_')) return;

    // Ja possui controles independentes por borne (X1/X2) com variaveis dedicadas.
    if (libKey === 'real_sinaleiro') return;

    const cssKey = libKey.replaceAll('_', '-');
    const bornes = Array.from(componentEl.querySelectorAll('.borne'));
    bornes.forEach((borneEl, idx) => {
        const n = idx + 1;
        const xVar = `--${cssKey}-borne-x-${n}`;
        const yVar = `--${cssKey}-borne-y-${n}`;
        const fallbackX = `--${cssKey}-borne-x`;
        const fallbackY = `--${cssKey}-borne-y`;
        borneEl.style.transform = `translate(var(${xVar}, var(${fallbackX})), var(${yVar}, var(${fallbackY})))`;
    });
}

function getEngineeringSelectedComponent() {
    const comps = getSelectedComponents();
    return comps.length === 1 ? comps[0] : null;
}

function getEngineeringCssKey(componentEl) {
    const lib = componentEl?.dataset?.lib || '';
    return lib ? lib.replaceAll('_', '-') : '';
}

function getEngineeringPinLabelVarName(componentEl, pinIndex) {
    const base = getEngineeringCssKey(componentEl);
    const idx = parseInt(pinIndex, 10);
    if (!base || !Number.isFinite(idx) || idx < 0) return '';
    return `--${base}-pin-label-${idx + 1}`;
}

function quoteEngineeringStringValue(value) {
    return JSON.stringify(String(value ?? '').trim());
}

function readEngineeringStringVar(name) {
    if (!name) return '';
    const raw = String(
        document.documentElement.style.getPropertyValue(name) ||
        getComputedStyle(document.documentElement).getPropertyValue(name) ||
        ''
    ).trim();
    if (!raw) return '';
    try {
        const parsed = JSON.parse(raw);
        return typeof parsed === 'string' ? parsed.trim() : String(parsed ?? '').trim();
    } catch (_) {
        return raw.replace(/^['"]|['"]$/g, '').trim();
    }
}

function syncEngineeringPinLabelVar(componentEl, pinNode) {
    if (!componentEl || !pinNode) return;
    const pinNodes = Array.from(componentEl.querySelectorAll('.pin-label'));
    const idx = pinNodes.indexOf(pinNode);
    if (idx < 0) return;
    const name = getEngineeringPinLabelVarName(componentEl, idx);
    if (!name) return;
    const text = String(pinNode.innerText || '').trim();
    pinNode.dataset.pinLabel = text;
    setEngineeringVar(name, quoteEngineeringStringValue(text));
}

function applyEngineeringPinLabelDefaults(componentEl) {
    if (!componentEl) return;
    Array.from(componentEl.querySelectorAll('.pin-label')).forEach((pinNode, idx) => {
        const name = getEngineeringPinLabelVarName(componentEl, idx);
        const text = readEngineeringStringVar(name);
        if (!text) return;
        pinNode.innerText = text;
        pinNode.dataset.pinLabel = text;
    });
}

function getEngineeringVarPrefixesForComponent(componentEl) {
    const lib = componentEl?.dataset?.lib || '';
    const base = getEngineeringCssKey(componentEl);
    const prefixes = base ? [base] : [];

    const aliasesByLib = {
        iec_bobina_contator: ['iec-bobina'],
        iec_bobina_temp: ['iec-bobina'],
        iec_fonte_trifasica_nt: ['iec-fonte-3fnt']
    };

    (aliasesByLib[lib] || []).forEach(alias => {
        if (!prefixes.includes(alias)) prefixes.push(alias);
    });

    if (lib.startsWith('real_') && !prefixes.includes('real-tag')) {
        prefixes.push('real-tag');
    }
    if (lib.startsWith('iec_') && !prefixes.includes('iec-tag')) {
        prefixes.push('iec-tag');
    }

    return prefixes;
}

function collectEngineeringVarsForComponent(componentEl) {
    const lib = String(componentEl?.dataset?.lib || '');
    const prefixes = getEngineeringVarPrefixesForComponent(componentEl);
    if (!prefixes.length) return [];
    const primaryPrefix = prefixes[0];
    const rootVars = getRootCustomProperties();
    const lines = [];
    const allNames = new Set();

    const hasPrefixMatch = (name) => prefixes.some(prefix => name.startsWith(`--${prefix}-`));

    for (const name of Object.keys(rootVars)) {
        if (!hasPrefixMatch(name)) continue;
        allNames.add(name);
    }

    // Descobre variaveis usadas inline no HTML do componente (ex.: borne individual).
    // Isso permite exibir sliders mesmo quando a var ainda nao existe no :root.
    const collectVarsFromStyleText = (styleText) => {
        const text = String(styleText || '');
        const rgx = /var\(\s*(--[a-z0-9\-]+)/gi;
        let m = null;
        while ((m = rgx.exec(text))) {
            const varName = String(m[1] || '').trim();
            if (varName && hasPrefixMatch(varName)) allNames.add(varName);
        }
    };
    collectVarsFromStyleText(componentEl.getAttribute?.('style'));
    componentEl.querySelectorAll?.('[style]').forEach(el => collectVarsFromStyleText(el.getAttribute('style')));

    const selectionVars = [
        `--${primaryPrefix}-sel-offset-x`,
        `--${primaryPrefix}-sel-offset-y`,
        `--${primaryPrefix}-sel-width-extra`,
        `--${primaryPrefix}-sel-height-extra`
    ];
    selectionVars.forEach(name => allNames.add(name));

    const bornesCount = componentEl.querySelectorAll?.(':scope > .borne')?.length || 0;
    allNames.add(`--${primaryPrefix}-terminal-rotate`);
    allNames.add(`--${primaryPrefix}-terminal-insert`);
    allNames.add(`--${primaryPrefix}-terminal-shift`);
    if (primaryPrefix === 'real-motor-3-ligacoes') {
        allNames.add('--real-motor-3-indicator-x');
        allNames.add('--real-motor-3-indicator-y');
    }
    if (primaryPrefix === 'real-motor-6-ligacoes') {
        allNames.add('--real-motor-6-indicator-x');
        allNames.add('--real-motor-6-indicator-y');
    }
    // Temporizadores: Detectar se o componente possui label de cronÃƒÂ´metro
    if (componentEl.querySelector('.timer-label') || lib.includes('temporizador')) {
        if (lib.startsWith('real_') || primaryPrefix.startsWith('real-')) {
            allNames.add('--real-temporizador-timer-x');
            allNames.add('--real-temporizador-timer-y');
        } else {
            // No CSS comandos, o seletor genÃƒÂ©rico .component .timer-label usa --iec-bobina-temp-timer
            allNames.add('--iec-bobina-temp-timer-x');
            allNames.add('--iec-bobina-temp-timer-y');
        }
    }

    for (let i = 1; i <= bornesCount; i++) {
        allNames.add(`--${primaryPrefix}-terminal-rotate-${i}`);
        allNames.add(`--${primaryPrefix}-terminal-insert-${i}`);
        allNames.add(`--${primaryPrefix}-terminal-shift-${i}`);
    }
    if (String(componentEl?.dataset?.lib || '') === 'real_rele_termico') {
        allNames.add(`--${primaryPrefix}-terminal-rotate-14`);
        allNames.add(`--${primaryPrefix}-terminal-rotate-a2`);
    }

    const getDefaultVarValue = (name) => {
        const n = String(name || '').toLowerCase();
        if (n.includes('-scale')) return '1';
        if (n.includes('-terminal-rotate')) return '0deg';
        return '0px';
    };

    const getResolvedVarValue = (name) => {
        const direct = String(rootVars[name] || '').trim();
        if (direct) return direct;

        // Para bornes individuais (ex.: --...-borne-x-1), herda do ajuste global --...-borne-x.
        const borneMatch = String(name || '').match(/^(--.+-borne-[xy])-\d+$/i);
        if (borneMatch && borneMatch[1]) {
            const globalBorne = String(rootVars[borneMatch[1]] || '').trim();
            if (globalBorne) return globalBorne;
        }

        return getDefaultVarValue(name);
    };

    Array.from(allNames).sort((a, b) => a.localeCompare(b)).forEach(name => {
        const value = getResolvedVarValue(name);
        lines.push(`${name}: ${value};`);
    });

    return lines.sort((a, b) => a.localeCompare(b));
}

function getRootCustomProperties() {
    const vars = {};
    const rootEl = document.documentElement;

    // 1) Preferencia: regras CSS carregadas (:root), pega style.css + overrides.
    for (const sheet of Array.from(document.styleSheets || [])) {
        let rules = null;
        try {
            rules = sheet.cssRules || sheet.rules;
        } catch (_) {
            // ignora folhas bloqueadas (cross-origin)
            continue;
        }
        if (!rules) continue;

        for (const rule of Array.from(rules)) {
            if (!rule || !rule.selectorText) continue;
            if (!String(rule.selectorText).includes(':root')) continue;
            const style = rule.style;
            if (!style) continue;
            for (let i = 0; i < style.length; i++) {
                const prop = style[i];
                if (!prop || !prop.startsWith('--')) continue;
                const val = (style.getPropertyValue(prop) || '').trim();
                if (val) vars[prop] = val;
            }
        }
    }

    // 2) Complementa com inline runtime (quando user aplica no painel sem salvar).
    const inlineStyle = rootEl.style;
    for (let i = 0; i < inlineStyle.length; i++) {
        const prop = inlineStyle[i];
        if (!prop || !prop.startsWith('--')) continue;
        const val = (inlineStyle.getPropertyValue(prop) || '').trim();
        if (val) vars[prop] = val;
    }

    // 3) Fallback para navegadores com enum incompleta.
    const computed = getComputedStyle(rootEl);
    for (let i = 0; i < computed.length; i++) {
        const prop = computed[i];
        if (!prop || !prop.startsWith('--')) continue;
        if (vars[prop]) continue;
        const val = (computed.getPropertyValue(prop) || '').trim();
        if (val) vars[prop] = val;
    }

    return vars;
}

function resetInlineEngineeringRuntimeVars() {
    const rootStyle = document.documentElement.style;
    const propsToRemove = [];
    for (let i = 0; i < rootStyle.length; i++) {
        const prop = rootStyle[i];
        if (!prop) continue;
        if (prop === ENGINEERING_SHEET_SCALE_VAR || prop.startsWith('--iec-') || prop.startsWith('--real-')) {
            propsToRemove.push(prop);
        }
    }
    propsToRemove.forEach(prop => rootStyle.removeProperty(prop));
    engineeringOverrides.clear();
}

function loadExistingEngineeringOverrides(opts = {}) {
    const preserveExisting = opts.preserveExisting !== false;
    const rootEl = document.documentElement;
    for (const sheet of Array.from(document.styleSheets || [])) {
        const href = String(sheet?.href || '');
        if (!href || !href.toLowerCase().includes('engineering_overrides.css')) continue;
        let rules = null;
        try {
            rules = sheet.cssRules || sheet.rules;
        } catch (_) {
            continue;
        }
        if (!rules) continue;
        for (const rule of Array.from(rules)) {
            if (!rule?.selectorText || !String(rule.selectorText).includes(':root')) continue;
            const style = rule.style;
            if (!style) continue;
            for (let i = 0; i < style.length; i++) {
                const prop = style[i];
                if (!prop || !prop.startsWith('--')) continue;
                const val = (style.getPropertyValue(prop) || '').trim();
                if (!val) continue;
                if (preserveExisting && engineeringOverrides.has(prop)) {
                    continue;
                }
                engineeringOverrides.set(prop, val);
                rootEl.style.setProperty(prop, val);
            }
        }
    }
}

function parseEngineeringVarLine(line) {
    const m = String(line || '').trim().match(/^(--[a-z0-9\-]+)\s*:\s*([^;]+);?$/i);
    if (!m) return null;
    const name = m[1].trim();
    const rawValue = m[2].trim();
    const nm = rawValue.match(/^(-?\d+(?:\.\d+)?)([a-z%]*)$/i);
    if (!nm) return { name, rawValue, numeric: false };
    return {
        name,
        rawValue,
        numeric: true,
        num: parseFloat(nm[1]),
        unit: (nm[2] || '').toLowerCase()
    };
}

function getEngineeringSliderSpec(v) {
    const name = v.name.toLowerCase();
    if (name.includes('-scale')) return { min: 0.1, max: 3, step: 0.01 };
    if (name.includes('-terminal-rotate')) return { min: -180, max: 180, step: 1 };
    if (name.includes('-terminal-insert') || name.includes('-terminal-shift')) return { min: -60, max: 60, step: 1 };
    if (v.unit === '%') {
        if (name.includes('-indicator-')) return { min: 0, max: 100, step: 0.1 };
        return { min: -200, max: 200, step: 1 };
    }

    if (name.includes('-glow-') || name.includes('-size')) return { min: 0, max: 300, step: 1 };
    return { min: -300, max: 300, step: 1 };
}

function getEngineeringVarGroup(varName) {
    const n = String(varName || '').toLowerCase();
    if (n.includes('-sel-')) return 'Selecao';
    if (n.includes('-terminal-')) return 'Bornes';
    if (n.includes('-borne-') || n.endsWith('-borne-x') || n.endsWith('-borne-y')) return 'Bornes';
    if (n.includes('-label-')) return 'Labels';
    if (n.includes('-offset-')) return 'Offsets';
    if (n.includes('-scale')) return 'Escala';
    if (n.includes('-timer-') || n.includes('-luz-') || n.includes('-indicator-')) return 'Indicadores';
    return 'Outros';
}

function setEngineeringVar(name, value) {
    document.documentElement.style.setProperty(name, value);
    engineeringOverrides.set(name, value);
    if (name === ENGINEERING_SHEET_SCALE_VAR) {
        updateProjectSheetFrameMeta();
    }
}

function updateEngineeringTextareaForSelected() {
    const textarea = document.getElementById('engineering-vars');
    const selected = getEngineeringSelectedComponent();
    if (!textarea) return;
    if (selected) {
        textarea.value = collectEngineeringVarsForComponent(selected).join('\n');
        return;
    }
    if (engineeringSheetScaleTargetActive) {
        const rootVars = getRootCustomProperties();
        const rawScale = String(
            rootVars[ENGINEERING_SHEET_SCALE_VAR]
            || getComputedStyle(document.documentElement).getPropertyValue(ENGINEERING_SHEET_SCALE_VAR)
            || ''
        ).trim();
        const parsedScale = parseFloat(rawScale);
        const safeScale = Number.isFinite(parsedScale) && parsedScale > 0 ? parsedScale : 1;
        textarea.value = `${ENGINEERING_SHEET_SCALE_VAR}: ${safeScale};`;
    }
}

function renderEngineeringSlidersFromTextarea() {
    const host = document.getElementById('engineering-sliders');
    const textarea = document.getElementById('engineering-vars');
    const selected = getEngineeringSelectedComponent();
    if (!host || !textarea || (!selected && !engineeringSheetScaleTargetActive) || !engineeringMode) {
        if (host) host.innerHTML = '';
        return;
    }

    const entries = textarea.value
        .split(/\r?\n/)
        .map(parseEngineeringVarLine)
        .filter(v => v && v.numeric);

    host.innerHTML = '';
    const groups = new Map();
    entries.forEach(v => {
        const g = getEngineeringVarGroup(v.name);
        if (!groups.has(g)) groups.set(g, []);
        groups.get(g).push(v);
    });

    const orderedGroups = ['Offsets', 'Escala', 'Bornes', 'Labels', 'Selecao', 'Indicadores', 'Outros'];
    orderedGroups.forEach(groupName => {
        const groupEntries = groups.get(groupName) || [];
        if (!groupEntries.length) return;

        const groupEl = document.createElement('div');
        groupEl.className = 'engineering-group';
        const titleEl = document.createElement('div');
        titleEl.className = 'engineering-group-title';
        titleEl.textContent = groupName;
        groupEl.appendChild(titleEl);

        groupEntries.forEach(v => {
            const spec = getEngineeringSliderSpec(v);
            const row = document.createElement('div');
            row.className = 'engineering-slider-row';

            const label = document.createElement('label');
            label.title = v.name;
            label.textContent = v.name.replace(/^--/, '');

            const range = document.createElement('input');
            range.type = 'range';
            range.min = String(spec.min);
            range.max = String(spec.max);
            range.step = String(spec.step);
            range.value = String(Number.isFinite(v.num) ? v.num : 0);

            const num = document.createElement('input');
            num.type = 'number';
            num.min = String(spec.min);
            num.max = String(spec.max);
            num.step = String(spec.step);
            num.value = String(Number.isFinite(v.num) ? v.num : 0);

            const applyValue = (raw) => {
                const parsed = parseFloat(raw);
                if (!Number.isFinite(parsed)) return;
                const next = `${parsed}${v.unit || ''}`;
                setEngineeringVar(v.name, next);
                range.value = String(parsed);
                num.value = String(parsed);
                if (selected) applySelectionFrameVars(selected);
                updateEngineeringTextareaForSelected();
            };

            range.addEventListener('input', () => applyValue(range.value));
            num.addEventListener('input', () => applyValue(num.value));

            row.appendChild(label);
            row.appendChild(range);
            row.appendChild(num);
            groupEl.appendChild(row);
        });

        host.appendChild(groupEl);
    });
}

function renderEngineeringPinLabelFields() {
    const host = document.getElementById('engineering-pin-labels');
    const selected = getEngineeringSelectedComponent();
    if (!host) return;

    host.innerHTML = '';
    host.classList.remove('has-fields');

    if (!engineeringMode || !selected || engineeringSheetScaleTargetActive) {
        return;
    }

    const pinNodes = Array.from(selected.querySelectorAll('.pin-label'));
    if (!pinNodes.length) {
        return;
    }

    host.classList.add('has-fields');

    const groupEl = document.createElement('div');
    groupEl.className = 'engineering-group';

    const titleEl = document.createElement('div');
    titleEl.className = 'engineering-group-title';
    titleEl.textContent = 'Tags dos Bornes';
    groupEl.appendChild(titleEl);

    pinNodes.forEach((node, idx) => {
        const row = document.createElement('div');
        row.className = 'engineering-pin-label-row';

        const label = document.createElement('label');
        const pinKey = String(
            node.dataset.pinLabel ||
            node.dataset.pino ||
            node.innerText ||
            `Borne ${idx + 1}`
        ).trim();
        label.textContent = pinKey || `Borne ${idx + 1}`;

        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 20;
        input.value = String(node.innerText || '').trim();

        const applyValue = (rawValue) => {
            const nextValue = String(rawValue || '').trim();
            node.innerText = nextValue;
            node.dataset.pinLabel = nextValue;
            syncEngineeringPinLabelVar(selected, node);
        };

        input.addEventListener('input', () => applyValue(input.value));
        input.addEventListener('change', () => scheduleHistoryCheckpoint('engineering_pin_labels'));

        row.appendChild(label);
        row.appendChild(input);
        groupEl.appendChild(row);
    });

    host.appendChild(groupEl);
}

function applySelectionFrameVars(componentEl) {
    if (!componentEl) return;
    const prefixes = getEngineeringVarPrefixesForComponent(componentEl);
    if (!prefixes.length) return;
    const primaryPrefix = prefixes[0];
    const rootStyle = getComputedStyle(document.documentElement);
    componentEl.style.setProperty('--sel-offset-x', (rootStyle.getPropertyValue(`--${primaryPrefix}-sel-offset-x`) || '0px').trim() || '0px');
    componentEl.style.setProperty('--sel-offset-y', (rootStyle.getPropertyValue(`--${primaryPrefix}-sel-offset-y`) || '0px').trim() || '0px');
    componentEl.style.setProperty('--sel-width-extra', (rootStyle.getPropertyValue(`--${primaryPrefix}-sel-width-extra`) || '0px').trim() || '0px');
    componentEl.style.setProperty('--sel-height-extra', (rootStyle.getPropertyValue(`--${primaryPrefix}-sel-height-extra`) || '0px').trim() || '0px');

    // PropagaÃƒÂ§ÃƒÂ£o de variÃƒÂ¡veis de Temporizador
    const tX = rootStyle.getPropertyValue('--real-temporizador-timer-x').trim();
    if (tX) componentEl.style.setProperty('--real-temporizador-timer-x', tX);
    const tY = rootStyle.getPropertyValue('--real-temporizador-timer-y').trim();
    if (tY) componentEl.style.setProperty('--real-temporizador-timer-y', tY);

    const iX = rootStyle.getPropertyValue('--iec-bobina-temp-timer-x').trim();
    if (iX) componentEl.style.setProperty('--iec-bobina-temp-timer-x', iX);
    const iY = rootStyle.getPropertyValue('--iec-bobina-temp-timer-y').trim();
    if (iY) componentEl.style.setProperty('--iec-bobina-temp-timer-y', iY);
}

function clearSelectionFrameVars(componentEl) {
    if (!componentEl) return;
    componentEl.style.removeProperty('--sel-offset-x');
    componentEl.style.removeProperty('--sel-offset-y');
    componentEl.style.removeProperty('--sel-width-extra');
    componentEl.style.removeProperty('--sel-height-extra');
    componentEl.style.removeProperty('--real-temporizador-timer-x');
    componentEl.style.removeProperty('--real-temporizador-timer-y');
    componentEl.style.removeProperty('--iec-bobina-temp-timer-x');
    componentEl.style.removeProperty('--iec-bobina-temp-timer-y');
}

function parseInlinePxFromCalc(styleText, propName) {
    const text = String(styleText || '');
    const rgx = new RegExp(`${propName}\\s*:\\s*calc\\(\\s*(-?\\d+(?:\\.\\d+)?)px`, 'i');
    const m = text.match(rgx);
    return m ? parseFloat(m[1]) : NaN;
}

function parseBorneVarName(styleText, prefix, axis) {
    const text = String(styleText || '');
    const rgx = new RegExp(`var\\(\\s*(--${prefix}-borne-${axis}(?:-\\d+)?)`, 'i');
    const m = text.match(rgx);
    return m ? String(m[1]).trim() : '';
}

function roundEngineeringNumber(value, digits = 3) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    const p = Math.pow(10, Math.max(0, digits));
    return Math.round(n * p) / p;
}

async function resolveSvgNaturalSizeFromImage(imgEl) {
    if (!imgEl) return null;
    const nw = Number(imgEl.naturalWidth || 0);
    const nh = Number(imgEl.naturalHeight || 0);
    if (nw > 0 && nh > 0) return { width: nw, height: nh };

    const src = String(imgEl.currentSrc || imgEl.src || '').trim();
    if (!src) return null;
    try {
        const resp = await fetch(src, { cache: 'no-cache' });
        if (!resp.ok) return null;
        const txt = await resp.text();
        const viewBoxMatch = txt.match(/viewBox\s*=\s*"([^"]+)"/i);
        if (viewBoxMatch) {
            const nums = viewBoxMatch[1].trim().split(/[,\s]+/).map(Number);
            if (nums.length === 4 && Number.isFinite(nums[2]) && Number.isFinite(nums[3]) && nums[2] > 0 && nums[3] > 0) {
                return { width: nums[2], height: nums[3] };
            }
        }
        const widthMatch = txt.match(/\bwidth\s*=\s*"([0-9.]+)"/i);
        const heightMatch = txt.match(/\bheight\s*=\s*"([0-9.]+)"/i);
        const w = widthMatch ? parseFloat(widthMatch[1]) : NaN;
        const h = heightMatch ? parseFloat(heightMatch[1]) : NaN;
        if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
            return { width: w, height: h };
        }
    } catch (_) { }
    return null;
}

function getAutoAdjustWrapper(componentEl) {
    if (!componentEl) return null;
    const root = componentEl.querySelector('.component-fine-adjust') || componentEl;
    const candidates = Array.from(root.querySelectorAll(':scope > *'));
    return candidates.find(el => {
        if (!el || !el.querySelector || !el.querySelector('img')) return false;
        const styleText = String(el.getAttribute('style') || '');
        return /width\s*:\s*-?\d+(?:\.\d+)?px/i.test(styleText) && /height\s*:\s*-?\d+(?:\.\d+)?px/i.test(styleText);
    }) || null;
}

async function autoAjustarComponenteSvg() {
    const selected = getEngineeringSelectedComponent();
    if (!selected) {
        alert('Selecione 1 componente para autoajuste.');
        return;
    }
    const prefixes = getEngineeringVarPrefixesForComponent(selected);
    const primaryPrefix = prefixes[0];
    if (!primaryPrefix) {
        alert('Componente sem prefixo de engenharia.');
        return;
    }

    const wrapper = getAutoAdjustWrapper(selected);
    if (!wrapper) {
        alert('Nao foi possivel encontrar a caixa principal do simbolo.');
        return;
    }
    const wrapperStyle = String(wrapper.getAttribute('style') || '');
    const wMatch = wrapperStyle.match(/width\s*:\s*(-?\d+(?:\.\d+)?)px/i);
    const hMatch = wrapperStyle.match(/height\s*:\s*(-?\d+(?:\.\d+)?)px/i);
    const baseW = wMatch ? parseFloat(wMatch[1]) : NaN;
    const baseH = hMatch ? parseFloat(hMatch[1]) : NaN;
    if (!Number.isFinite(baseW) || !Number.isFinite(baseH) || baseW <= 0 || baseH <= 0) {
        alert('Dimensoes da caixa nao encontradas no componente.');
        return;
    }

    const img = wrapper.querySelector('img');
    const natural = await resolveSvgNaturalSizeFromImage(img);
    if (!natural || !Number.isFinite(natural.width) || !Number.isFinite(natural.height) || natural.width <= 0 || natural.height <= 0) {
        alert('Nao foi possivel ler as dimensoes do SVG.');
        return;
    }

    const targetW = (baseH * natural.width) / natural.height;
    const sx = targetW / baseW;
    if (!Number.isFinite(sx) || sx <= 0.05 || sx >= 10) {
        alert('Autoajuste cancelado: escala horizontal invalida.');
        return;
    }

    setEngineeringVar(`--${primaryPrefix}-scale-x`, String(roundEngineeringNumber(sx)));

    let adjustedAnyBorneX = false;
    const bornes = Array.from(selected.querySelectorAll(':scope > .borne'));
    bornes.forEach(b => {
        const styleText = String(b.getAttribute('style') || '');
        const baseX = parseInlinePxFromCalc(styleText, 'left');
        if (!Number.isFinite(baseX)) return;
        const xVar = parseBorneVarName(styleText, primaryPrefix, 'x');
        if (!xVar) return;
        const nextOffset = roundEngineeringNumber(baseX * (sx - 1), 2);
        setEngineeringVar(xVar, `${nextOffset}px`);
        adjustedAnyBorneX = true;
    });

    if (!adjustedAnyBorneX) {
        const fallback = roundEngineeringNumber(((baseW / 2) * (sx - 1)), 2);
        setEngineeringVar(`--${primaryPrefix}-borne-x`, `${fallback}px`);
    }

    setEngineeringVar(`--${primaryPrefix}-scale`, '1');
    if (selected) applySelectionFrameVars(selected);
    updateEngineeringTextareaForSelected();
    renderEngineeringSlidersFromTextarea();
    scheduleHistoryCheckpoint('engineering_auto_svg');

    const pct = roundEngineeringNumber(sx * 100, 1);
    alert(`Autoajuste aplicado (${pct}% no eixo X). Revise e faca microajuste, se necessario.`);
}

function syncEngineeringModeUI() {
    if (!ENGINEERING_MODE_AVAILABLE) engineeringMode = false;
    syncEngineeringAvailabilityUI();
    document.body.classList.toggle('engineering-mode', engineeringMode);
    const btn = document.getElementById('btn-engineering-toggle');
    if (btn) btn.classList.toggle('ativo', ENGINEERING_MODE_AVAILABLE && engineeringMode);
    if (!engineeringMode) {
        engineeringShowBornes = false;
        engineeringShowTerminals = false;
        engineeringShowPerformance = false;
        engineeringShowIecDiagnostic = false;
    }
    setEngineeringBornesVisible(engineeringShowBornes);
    setEngineeringTerminalsVisible(engineeringShowTerminals);
    setEngineeringPerformanceVisible(engineeringShowPerformance);
    setEngineeringIecDiagnosticVisible(engineeringShowIecDiagnostic);
    syncEngineeringMonitorFocus();
    syncMirroredSidebarControls();
}

function syncEngineeringMonitorFocus() {
    const focused = !!(engineeringMode && (engineeringShowPerformance || engineeringShowIecDiagnostic));
    document.body.classList.toggle('engineering-monitor-focus', focused);
}

function setEngineeringBornesVisible(force = null) {
    engineeringShowBornes = force === null ? !engineeringShowBornes : !!force;
    const input = document.getElementById('engineering-show-bornes');
    if (input && input.checked !== engineeringShowBornes) {
        input.checked = engineeringShowBornes;
    }
    document.body.classList.toggle(
        'engineering-show-bornes',
        engineeringMode && engineeringShowBornes
    );
}

function setEngineeringTerminalsVisible(force = null) {
    engineeringShowTerminals = force === null ? !engineeringShowTerminals : !!force;
    const input = document.getElementById('engineering-show-terminals');
    if (input && input.checked !== engineeringShowTerminals) {
        input.checked = engineeringShowTerminals;
    }
    document.body.classList.toggle(
        'engineering-show-terminals',
        engineeringMode && engineeringShowTerminals
    );
    if (typeof window.renderWireJunctions === 'function') {
        window.renderWireJunctions();
    }
}

function resetEngineeringPerformanceState() {
    engineeringPerformanceMetrics.clear();
    engineeringPerformanceState.frameCount = 0;
    engineeringPerformanceState.lastFpsSampleTs = 0;
    engineeringPerformanceState.fps = 0;
    engineeringPerformanceState.longTaskCount = 0;
    engineeringPerformanceState.maxLongTaskMs = 0;
    engineeringPerformanceState.lastLongTaskMs = 0;
    engineeringPerformanceState.lastPanelUpdateAt = 0;
    engineeringPerformanceState.recentEvents = [];
}

function resetEngineeringIecDiagnosticState() {
    engineeringIecDiagnosticState.stepId = 0;
    engineeringIecDiagnosticState.lines = [];
}

function formatEngineeringBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return '-';
    const mib = bytes / (1024 * 1024);
    return `${mib.toFixed(mib >= 256 ? 0 : 1)} MB`;
}

function recordEngineeringPerformanceMetric(name, durationMs) {
    if (!engineeringPerformanceState.enabled) return;
    if (!name || !Number.isFinite(durationMs)) return;
    const key = String(name);
    const current = engineeringPerformanceMetrics.get(key) || {
        count: 0,
        totalMs: 0,
        maxMs: 0,
        lastMs: 0
    };
    current.count += 1;
    current.totalMs += durationMs;
    current.lastMs = durationMs;
    current.maxMs = Math.max(current.maxMs, durationMs);
    engineeringPerformanceMetrics.set(key, current);
}

function recordEngineeringPerformanceEvent(message) {
    const text = String(message || '').trim();
    if (!text) return;
    const stamp = new Date().toLocaleTimeString('pt-BR', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    engineeringPerformanceState.recentEvents.unshift(`${stamp} ${text}`);
    engineeringPerformanceState.recentEvents = engineeringPerformanceState.recentEvents.slice(0, 6);
}

function recordEngineeringIecDiagnosticLine(message) {
    const text = String(message || '').trim();
    if (!text) return;
    engineeringIecDiagnosticState.lines.unshift(text);
    engineeringIecDiagnosticState.lines = engineeringIecDiagnosticState.lines.slice(0, 30);
}

function formatEngineeringDiagList(values, emptyLabel = '-') {
    if (!Array.isArray(values) || !values.length) return emptyLabel;
    return values.map(v => String(v || '').trim()).filter(Boolean).join(', ') || emptyLabel;
}

function getEngineeringWireEndpointLabel(borneEl) {
    const pin = String(borneEl?.dataset?.pino || '').trim();
    return pin || '-';
}

window.__simPerfStart = function (name) {
    if (!engineeringPerformanceState.enabled || typeof performance === 'undefined') return null;
    const start = performance.now();
    return () => {
        recordEngineeringPerformanceMetric(name, performance.now() - start);
    };
};

window.__simPerfLogEvent = function (message) {
    recordEngineeringPerformanceEvent(message);
};

window.__simIecDiagEnabled = function () {
    return !!(engineeringMode && engineeringShowIecDiagnostic);
};

window.__simIecDiagStartStep = function (payload = {}) {
    if (!window.__simIecDiagEnabled()) return;
    engineeringIecDiagnosticState.stepId += 1;
    const step = engineeringIecDiagnosticState.stepId;
    const mode = String(payload?.mode || activeWorkspaceMode || 'simbologia');
    const components = Number(payload?.components || 0);
    const nodes = Number(payload?.nodes || 0);
    const wires = Number(payload?.wires || 0);
    const line = `passo ${step} inicio | modo ${mode} | comps ${components} | nos ${nodes} | fios ${wires}`;
    recordEngineeringIecDiagnosticLine(line);
    // try { console.log(`[iec-diag] ${line}`); } catch (_) {}
};

window.__simIecDiagIter = function (payload = {}) {
    if (!window.__simIecDiagEnabled()) return;
    const iter = Number(payload?.iter || 0);
    const coils = formatEngineeringDiagList(payload?.coils || []);
    const changed = formatEngineeringDiagList(payload?.changed || []);
    const potentials = Number(payload?.potentials || 0);
    const tags = formatEngineeringDiagList(payload?.tags || [], '');
    const tagsText = tags ? ` | tags ${tags}` : '';
    const line = `it ${iter} | bobinas ${coils}${tagsText} | mudou ${changed} | pots ${potentials}`;
    recordEngineeringIecDiagnosticLine(line);
    // try { console.log(`[iec-diag] ${line}`); } catch (_) {}
};

window.__simIecDiagFinish = function (payload = {}) {
    if (!window.__simIecDiagEnabled()) return;
    const step = engineeringIecDiagnosticState.stepId;
    const reason = String(payload?.reason || 'fim');
    const coils = formatEngineeringDiagList(payload?.coils || []);
    const shortText = payload?.short ? 'sim' : 'nao';
    const iters = Number(payload?.iterations || 0);
    const line = `passo ${step} fim | motivo ${reason} | iter ${iters} | curto ${shortText} | bobinas ${coils}`;
    recordEngineeringIecDiagnosticLine(line);
    // try { console.log(`[iec-diag] ${line}`); } catch (_) {}
    renderEngineeringPerformancePanel();
};

function buildEngineeringPerformanceText() {
    const workspaceMode = (typeof activeWorkspaceMode !== 'undefined' && activeWorkspaceMode === '2d') ? '2d' : 'simbologia';
    const wireCount = Array.isArray(listaFios) ? listaFios.length : document.querySelectorAll('#wire-layer .user-wire').length;
    const wirePointCount = Array.isArray(listaFios)
        ? listaFios.reduce((sum, wire) => sum + (Array.isArray(wire?.points) ? wire.points.length : 0), 0)
        : 0;
    const componentCount = document.querySelectorAll('#bancada .component').length;
    const borneCount = document.querySelectorAll('#bancada .borne').length;
    const junctionCount = document.querySelectorAll('#wire-layer .wire-junction').length;
    const terminalCount = document.querySelectorAll('#wire-layer .wire-terminal, #wire-top-layer .wire-terminal').length;
    const overlayCount = document.querySelectorAll('#wire-top-layer .wire-top-overlay, #wire-top-layer .wire-short-path-overlay').length;

    const memory = performance?.memory || null;
    const memoryText = memory
        ? `${formatEngineeringBytes(memory.usedJSHeapSize)} / ${formatEngineeringBytes(memory.totalJSHeapSize)}`
        : 'indisponivel neste navegador';

    const metricNames = [
        ['renderWireJunctions', 'juncoes'],
        ['rebindWireEndpoints', 'rebind'],
        ['renderWireLabels', 'rotulos'],
        ['scheduleCrossReferenceRefresh', 'cross-ref']
    ];
    const metricLines = metricNames.map(([key, label]) => {
        const metric = engineeringPerformanceMetrics.get(key);
        if (!metric || metric.count <= 0) return `${label}: -`;
        const avgMs = metric.totalMs / metric.count;
        return `${label}: avg ${avgMs.toFixed(1)} ms | max ${metric.maxMs.toFixed(1)} | last ${metric.lastMs.toFixed(1)} | calls ${metric.count}`;
    });

    const topWireLines = Array.isArray(listaFios)
        ? listaFios
            .map((wireObj, idx) => ({
                idx,
                id: String(wireObj?.id || `#${idx + 1}`),
                number: String(wireObj?.number || '').trim(),
                points: Array.isArray(wireObj?.points) ? wireObj.points.length : 0,
                from: getEngineeringWireEndpointLabel(wireObj?.origem),
                to: getEngineeringWireEndpointLabel(wireObj?.destino),
                stats: (typeof window.getWireGeometryStats === 'function')
                    ? window.getWireGeometryStats(wireObj?.points || [])
                    : null
            }))
            .sort((a, b) => b.points - a.points)
            .slice(0, 5)
            .map((wire, index) => {
                const suffix = wire.number ? ` n:${wire.number}` : '';
                const ratio = Number.isFinite(wire?.stats?.ratio) ? wire.stats.ratio.toFixed(1) : '-';
                const box = wire?.stats ? `${Math.round(wire.stats.width)}x${Math.round(wire.stats.height)}` : '-';
                return `${index + 1}. ${wire.id}${suffix} ${wire.from}->${wire.to} | ${wire.points} pts | box ${box} | ratio ${ratio}`;
            })
        : [];

    return [
        `modo: ${workspaceMode}`,
        `fps: ${engineeringPerformanceState.fps.toFixed(1)}`,
        `heap js: ${memoryText}`,
        `componentes: ${componentCount} | bornes: ${borneCount}`,
        `fios: ${wireCount} | pontos: ${wirePointCount}`,
        `juncoes: ${junctionCount} | terminais: ${terminalCount} | overlays: ${overlayCount}`,
        `long tasks: ${engineeringPerformanceState.longTaskCount} | max: ${engineeringPerformanceState.maxLongTaskMs.toFixed(1)} ms | last: ${engineeringPerformanceState.lastLongTaskMs.toFixed(1)} ms`,
        '',
        'metricas:',
        ...metricLines,
        '',
        'top fios:',
        ...(topWireLines.length ? topWireLines : ['-']),
        '',
        'eventos:',
        ...((engineeringPerformanceState.recentEvents && engineeringPerformanceState.recentEvents.length)
            ? engineeringPerformanceState.recentEvents
            : ['-']),
        '',
        'diag simulacao:',
        ...((engineeringIecDiagnosticState.lines && engineeringIecDiagnosticState.lines.length)
            ? engineeringIecDiagnosticState.lines
            : ['-'])
    ].join('\n');
}

function renderEngineeringPerformancePanel() {
    const output = document.getElementById('engineering-performance-output');
    if (!output) return;
    const visible = !!(engineeringMode && (engineeringShowPerformance || engineeringShowIecDiagnostic));
    output.hidden = !visible;
    if (!visible) {
        output.textContent = '';
        return;
    }
    output.textContent = buildEngineeringPerformanceText();
}

function stopEngineeringPerformanceMonitor() {
    engineeringPerformanceState.enabled = false;
    if (engineeringPerformanceRafId) {
        cancelAnimationFrame(engineeringPerformanceRafId);
        engineeringPerformanceRafId = 0;
    }
    if (engineeringPerformanceObserver) {
        try { engineeringPerformanceObserver.disconnect(); } catch (_) { }
        engineeringPerformanceObserver = null;
    }
    renderEngineeringPerformancePanel();
}

function setEngineeringIecDiagnosticVisible(force = null) {
    engineeringShowIecDiagnostic = force === null ? !engineeringShowIecDiagnostic : !!force;
    const input = document.getElementById('engineering-show-iec-diagnostic');
    if (input && input.checked !== engineeringShowIecDiagnostic) {
        input.checked = engineeringShowIecDiagnostic;
    }
    engineeringIecDiagnosticState.enabled = engineeringMode && engineeringShowIecDiagnostic;
    if (!engineeringIecDiagnosticState.enabled) {
        resetEngineeringIecDiagnosticState();
    }
    syncEngineeringMonitorFocus();
    renderEngineeringPerformancePanel();
}

function tickEngineeringPerformanceMonitor(now) {
    if (!engineeringPerformanceState.enabled) return;
    engineeringPerformanceState.frameCount += 1;
    if (!engineeringPerformanceState.lastFpsSampleTs) {
        engineeringPerformanceState.lastFpsSampleTs = now;
    }
    const elapsed = now - engineeringPerformanceState.lastFpsSampleTs;
    if (elapsed >= 600) {
        engineeringPerformanceState.fps = (engineeringPerformanceState.frameCount * 1000) / elapsed;
        engineeringPerformanceState.frameCount = 0;
        engineeringPerformanceState.lastFpsSampleTs = now;
    }
    if ((now - engineeringPerformanceState.lastPanelUpdateAt) >= 700) {
        engineeringPerformanceState.lastPanelUpdateAt = now;
        renderEngineeringPerformancePanel();
    }
    engineeringPerformanceRafId = requestAnimationFrame(tickEngineeringPerformanceMonitor);
}

function startEngineeringPerformanceMonitor() {
    if (engineeringPerformanceState.enabled) return;
    resetEngineeringPerformanceState();
    engineeringPerformanceState.enabled = true;
    if (typeof window.PerformanceObserver === 'function') {
        try {
            engineeringPerformanceObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries ? list.getEntries() : [];
                entries.forEach((entry) => {
                    const duration = Number(entry?.duration) || 0;
                    if (duration <= 0) return;
                    engineeringPerformanceState.longTaskCount += 1;
                    engineeringPerformanceState.lastLongTaskMs = duration;
                    engineeringPerformanceState.maxLongTaskMs = Math.max(engineeringPerformanceState.maxLongTaskMs, duration);
                });
            });
            engineeringPerformanceObserver.observe({ entryTypes: ['longtask'] });
        } catch (_) {
            engineeringPerformanceObserver = null;
        }
    }
    engineeringPerformanceRafId = requestAnimationFrame(tickEngineeringPerformanceMonitor);
    renderEngineeringPerformancePanel();
}

function setEngineeringPerformanceVisible(force = null) {
    engineeringShowPerformance = force === null ? !engineeringShowPerformance : !!force;
    const input = document.getElementById('engineering-show-performance');
    if (input && input.checked !== engineeringShowPerformance) {
        input.checked = engineeringShowPerformance;
    }
    if (engineeringMode && engineeringShowPerformance) {
        startEngineeringPerformanceMonitor();
    } else {
        stopEngineeringPerformanceMonitor();
    }
    syncEngineeringMonitorFocus();
}

function simplificarFios2dMonitorados() {
    if (typeof window.validateAndRepair2DWires !== 'function') {
        alert('Rotina de diagnostico indisponivel.');
        return;
    }
    const stats = window.validateAndRepair2DWires({
        reason: 'manual_mark',
        force: true,
        limit: 100,
        repair: false
    });
    renderEngineeringPerformancePanel();
    const count = Number(stats?.issuesFound || 0);
    if (!count) {
        alert('Nenhum cabo patologico foi identificado.');
        return;
    }
    if (typeof window.showWireIssueOverlay === 'function') {
        window.showWireIssueOverlay(`${count} cabo(s) com geometria corrompida marcados em rosa. RefaÃƒÆ’Ã‚Â§a esses cabos.`);
    }
    alert(
        `${count} cabo(s) com geometria corrompida foram marcados em rosa.\n` +
        `RefaÃƒÆ’Ã‚Â§a manualmente esses cabos.`
    );
}

function hideWireIssueOverlay() {
    if (wireIssueOverlayHideTimer) {
        clearTimeout(wireIssueOverlayHideTimer);
        wireIssueOverlayHideTimer = null;
    }
    if (wireIssueOverlay?.isConnected) wireIssueOverlay.remove();
    wireIssueOverlay = null;
}

function showWireIssueOverlay(message) {
    const text = String(message || '').trim();
    if (!text) return;
    hideWireIssueOverlay();
    wireIssueOverlay = document.createElement('div');
    wireIssueOverlay.textContent = text;
    Object.assign(wireIssueOverlay.style, {
        position: 'fixed',
        top: '98px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(176, 58, 46, 0.96)',
        color: '#fff',
        padding: '10px 18px',
        borderRadius: '10px',
        fontWeight: '700',
        fontSize: '13px',
        lineHeight: '1.3',
        zIndex: '10020',
        boxShadow: '0 10px 24px rgba(0,0,0,0.25)',
        pointerEvents: 'none',
        maxWidth: 'calc(100vw - 40px)',
        textAlign: 'center'
    });
    document.body.appendChild(wireIssueOverlay);
    wireIssueOverlayHideTimer = setTimeout(() => {
        hideWireIssueOverlay();
    }, 5200);
}

function recarregarVarsEngenharia() {
    const targetEl = document.getElementById('engineering-target');
    const textarea = document.getElementById('engineering-vars');
    const selected = getEngineeringSelectedComponent();
    if (!textarea || !targetEl) return;
    if (!engineeringMode) {
        targetEl.innerText = 'Selecione 1 componente';
        textarea.value = '';
        engineeringSheetScaleTargetActive = false;
        updateProjectSheetFrameMeta();
        renderEngineeringPinLabelFields();
        renderEngineeringSlidersFromTextarea();
        return;
    }
    if (selected) {
        engineeringSheetScaleTargetActive = false;
        const tag = selected.dataset.tag || selected.dataset.lib || '';
        targetEl.innerText = tag;
        textarea.value = collectEngineeringVarsForComponent(selected).join('\n');
        applySelectionFrameVars(selected);
        updateProjectSheetFrameMeta();
        renderEngineeringPinLabelFields();
        renderEngineeringSlidersFromTextarea();
        return;
    }
    if (engineeringSheetScaleTargetActive) {
        targetEl.innerText = 'Folha (escala global)';
        updateEngineeringTextareaForSelected();
        updateProjectSheetFrameMeta();
        renderEngineeringPinLabelFields();
        renderEngineeringSlidersFromTextarea();
        return;
    }
    targetEl.innerText = 'Selecione 1 componente';
    textarea.value = '';
    updateProjectSheetFrameMeta();
    renderEngineeringPinLabelFields();
    renderEngineeringSlidersFromTextarea();
}

function aplicarVarsEngenharia() {
    const selected = getEngineeringSelectedComponent();
    const textarea = document.getElementById('engineering-vars');
    const sheetTarget = engineeringSheetScaleTargetActive;
    if (!engineeringMode || (!selected && !sheetTarget) || !textarea) return;
    const content = String(textarea.value || '');
    const lines = content.split(/\r?\n/);
    let changedSheetScale = false;
    lines.forEach(raw => {
        const line = raw.trim();
        if (!line || line.startsWith('/*')) return;
        const m = line.match(/^(--[a-z0-9\-]+)\s*:\s*([^;]+);?$/i);
        if (!m) return;
        const name = m[1].trim();
        const value = m[2].trim();
        document.documentElement.style.setProperty(name, value);
        engineeringOverrides.set(name, value);
        if (name === ENGINEERING_SHEET_SCALE_VAR) changedSheetScale = true;
    });
    if (selected) {
        applyEngineeringPinLabelDefaults(selected);
        applySelectionFrameVars(selected);
    }
    updateEngineeringTextareaForSelected();
    renderEngineeringSlidersFromTextarea();
    if (changedSheetScale || sheetTarget) updateProjectSheetFrameMeta();
    scheduleHistoryCheckpoint('engineering_vars');
}

function syncEngineeringDraftToOverrides() {
    const textarea = document.getElementById('engineering-vars');
    if (!textarea) return;
    const lines = String(textarea.value || '').split(/\r?\n/);
    let changedSheetScale = false;
    lines.forEach(raw => {
        const line = raw.trim();
        if (!line || line.startsWith('/*')) return;
        const m = line.match(/^(--[a-z0-9\-]+)\s*:\s*([^;]+);?$/i);
        if (!m) return;
        const name = m[1].trim();
        const value = m[2].trim();
        document.documentElement.style.setProperty(name, value);
        engineeringOverrides.set(name, value);
        if (name === ENGINEERING_SHEET_SCALE_VAR) changedSheetScale = true;
    });
    if (changedSheetScale) updateProjectSheetFrameMeta();
}

function activateEngineeringSheetScaleTarget() {
    if (!ENGINEERING_MODE_AVAILABLE) return;
    engineeringSheetScaleTargetActive = true;
    clearComponentSelection();
    if (typeof window.clearWireSelection === 'function') window.clearWireSelection();
    clearDrawingSelection();
    if (!engineeringMode) {
        toggleEngineeringMode(true);
    } else {
        recarregarVarsEngenharia();
    }
}

window.activateEngineeringSheetScaleTarget = activateEngineeringSheetScaleTarget;

function onProjectSheetCornerClick(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    activateEngineeringSheetScaleTarget();
}

function getProjectSheetScaleFactor() {
    const raw = String(
        getComputedStyle(document.documentElement).getPropertyValue(ENGINEERING_SHEET_SCALE_VAR) || ''
    ).trim();
    const parsed = parseFloat(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function mergeInlineRootVarsIntoOverrides() {
    const inlineStyle = document.documentElement.style;
    for (let i = 0; i < inlineStyle.length; i++) {
        const prop = inlineStyle[i];
        if (!prop || !prop.startsWith('--')) continue;
        const val = (inlineStyle.getPropertyValue(prop) || '').trim();
        if (!val) continue;
        engineeringOverrides.set(prop, val);
    }
}

function buildEngineeringCssBlock() {
    const entries = Array.from(engineeringOverrides.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    if (!entries.length) return `${ENGINEERING_BLOCK_START}\n:root {\n}\n${ENGINEERING_BLOCK_END}\n`;
    const body = entries.map(([k, v]) => `    ${k}: ${v};`).join('\n');
    return `${ENGINEERING_BLOCK_START}\n:root {\n${body}\n}\n${ENGINEERING_BLOCK_END}\n`;
}

function upsertEngineeringBlock(originalCss, block) {
    const start = originalCss.indexOf(ENGINEERING_BLOCK_START);
    const end = originalCss.indexOf(ENGINEERING_BLOCK_END);
    if (start >= 0 && end > start) {
        const tailIdx = end + ENGINEERING_BLOCK_END.length;
        return `${originalCss.slice(0, start).trimEnd()}\n\n${block}\n${originalCss.slice(tailIdx).trimStart()}`;
    }
    return `${originalCss.trimEnd()}\n\n${block}`;
}

async function salvarVarsEngenhariaNoCodigo() {
    // 1) preserva o que o usuario acabou de editar no painel (mesmo sem clicar em Aplicar).
    syncEngineeringDraftToOverrides();
    // 1.1) reforca merge com valores runtime atuais do :root.
    mergeInlineRootVarsIntoOverrides();
    // 2) mescla com o que ja existe no arquivo sem sobrescrever os valores atuais.
    loadExistingEngineeringOverrides({ preserveExisting: true });
    const block = buildEngineeringCssBlock();
    try {
        if ('showSaveFilePicker' in window) {
            const handle = await window.showSaveFilePicker({
                suggestedName: 'engineering_overrides.css',
                types: [{ description: 'CSS', accept: { 'text/css': ['.css'] } }]
            });
            let current = '';
            try {
                current = await fetch('./engineering_overrides.css').then(r => r.ok ? r.text() : '');
            } catch (_) {
                current = '';
            }
            const next = upsertEngineeringBlock(current || '', block);
            const writable = await handle.createWritable();
            await writable.write(next);
            await writable.close();
            alert('VariÃƒÆ’Ã‚Â¡veis salvas em engineering_overrides.css sem perder os ajustes anteriores.');
            return;
        }
    } catch (err) {
        console.error(err);
    }
    const blob = new Blob([block], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'engineering_overrides.css';
    a.click();
    URL.revokeObjectURL(url);
    alert('Navegador sem gravaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o direta. Baixei o arquivo de overrides.');
}

function toggleEngineeringMode(force = null) {
    if (!ENGINEERING_MODE_AVAILABLE) {
        engineeringMode = false;
        syncEngineeringModeUI();
        return false;
    }
    engineeringMode = force === null ? !engineeringMode : !!force;
    syncEngineeringModeUI();
    recarregarVarsEngenharia();
}

window.toggleEngineeringMode = toggleEngineeringMode;
window.aplicarVarsEngenharia = aplicarVarsEngenharia;
window.recarregarVarsEngenharia = recarregarVarsEngenharia;
window.simplificarFios2dMonitorados = simplificarFios2dMonitorados;
window.showWireIssueOverlay = showWireIssueOverlay;
window.hideWireIssueOverlay = hideWireIssueOverlay;
window.salvarVarsEngenhariaNoCodigo = salvarVarsEngenhariaNoCodigo;
window.autoAjustarComponenteSvg = autoAjustarComponenteSvg;
window.resetInlineEngineeringRuntimeVars = resetInlineEngineeringRuntimeVars;
window.refreshCrossReferences = renderCrossReferencesForActiveSheet;
window.scheduleCrossReferenceRefresh = scheduleCrossReferenceRefresh;

// =====================================================
// COMPONENTES
// =====================================================
function adicionarComponente(k, id, t, l, opts = {}) {
    if (simulando) return;

    const def = BIBLIOTECA[k];
    const allowOutOfMode = !!opts.allowOutOfMode;
    if (!def || (!allowOutOfMode && !componenteNoModoAtual(k, def))) return;
    const d = document.createElement('div');

    d.className = 'component';
    d.dataset.lib = k;
    const spawn = getSpawnPosition();
    const parsedTop = parseFloat(t);
    const parsedLeft = parseFloat(l);
    const topVal = Number.isFinite(parsedTop) ? parsedTop : Math.round(spawn.top);
    const leftVal = Number.isFinite(parsedLeft) ? parsedLeft : Math.round(spawn.left);
    if (isFreeMoveComponentLib(k)) {
        d.style.top = `${topVal}px`;
        d.style.left = `${leftVal}px`;
    } else {
        d.style.top = Math.round(topVal / GRID_SIZE) * GRID_SIZE + 'px';
        d.style.left = Math.round(leftVal / GRID_SIZE) * GRID_SIZE + 'px';
    }
    d.innerHTML = def.html(d.id);
    applyComponentFineAdjust(d, k);
    applyEngineeringPinLabelDefaults(d);

    const tag = d.dataset.tag || getDefaultTag(def, k);
    d.dataset.tag = tag;
    const label = document.createElement('div');
    label.className = 'tag-label';
    label.innerText = d.dataset.tag;
    d.appendChild(label);
    ensureComponentMetaLabels(d);
    syncComponentMetaLabels(d);

    const targetMode = getModeByComponent(k, def);
    const targetBancada = getWorkspaceBancada(targetMode) || document.getElementById('bancada');
    targetBancada.appendChild(d);
    if (def && typeof def.mountComponent === 'function') {
        try {
            def.mountComponent(d, { source: 'add_component', options: opts });
        } catch (error) {
            console.error('Falha ao montar componente customizado.', error);
        }
    }
    if (opts && opts.ensureVisibleOnCreate) {
        posicionarComponenteNoCentroVisivel(d);
    }
    if (opts && opts.highlightOnCreate) {
        highlightNovoComponente(d);
    }
    if (opts && opts.autoWireOnCreate && typeof window.handleAutoWireAfterComponentDrop === 'function') {
        window.handleAutoWireAfterComponentDrop(d);
    }
    const isPressable = !!(def && def.pressable === 'momentary');
    const usingInteractDrag = initInteractDrag(d);

    d.addEventListener('mousedown', e => {
        if (isComponentInteractionBlockedByWireMode(e.target)) {
            return;
        }
        if (e.button !== 0) return;
        if (simulando) return;
        if (Date.now() < componentTapSuppressUntil) return;
        if (e.target?.closest?.('.cross-ref-label')) return;
        if (e.target?.closest?.('.real-regua-controls')) return;
        if (e.target?.closest?.('.real-regua-marker')) return;

        if (ferramentaAtiva === 'borracha') {
            if (typeof window.interact === 'function') {
                try { window.interact(d).unset(); } catch (_) { }
            }
            d.remove();
            scheduleCrossReferenceRefresh();
            scheduleHistoryCheckpoint('delete_component');
            return;
        }

        if (ferramentaAtiva === 'rotacao') {
            const r = (parseInt(d.dataset.rot || 0) + 90) % 360;
            d.dataset.rot = r;
            d.style.transform = `rotate(${r}deg)`;
            scheduleHistoryCheckpoint('rotate_component');
            return;
        }

        if (ferramentaAtiva === 'info') {
            if (typeof abrirModalInfo === 'function') {
                abrirModalInfo(d.dataset.lib);
            }
            return;
        }

        if (ferramentaAtiva !== 'select') return;
        const visualRect = getComponentVisualRect(d);
        const insideVisualRect = !visualRect ||
            (e.clientX >= visualRect.left && e.clientX <= visualRect.right && e.clientY >= visualRect.top && e.clientY <= visualRect.bottom);
        if (!insideVisualRect) {
            if (typeof window.handleWireLabelPointerDownAtClient === 'function') {
                const consumed = window.handleWireLabelPointerDownAtClient(e.clientX, e.clientY, {
                    additive: !!(e.shiftKey || e.ctrlKey || e.metaKey),
                    pointerId: e.pointerId,
                    pointerType: e.pointerType || 'mouse',
                    button: e.button
                });
                if (consumed) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
            return;
        }

        const additive = !!(e.shiftKey || e.ctrlKey || e.metaKey);
        if (additive) {
            setComponentSelected(d, !d.classList.contains('component-selected'));
        } else if (!d.classList.contains('component-selected') || getSelectedComponents().length <= 1) {
            selectSingleComponent(d);
        }

        if (usingInteractDrag) return;

        const startX = e.clientX;
        const startY = e.clientY;
        const dragGroup =
            (d.classList.contains('component-selected') && getSelectedComponents().length > 1)
                ? getSelectedComponents()
                : [d];
        const startByComp = dragGroup.map(comp => ({
            comp,
            top: comp.offsetTop,
            left: comp.offsetLeft
        }));
        const anchorStart = startByComp[0]
            ? { left: startByComp[0].left, top: startByComp[0].top }
            : null;
        let moved = false;

        if (typeof window.pauseWireSelectionAutoClear === 'function') {
            window.pauseWireSelectionAutoClear();
        }

        const onMove = ev => {
            moved = true;
            setComponentDragGuidesActive(true);
            updateMouseGuidesForComponent(dragGroup[0] || d);
            if (typeof window.previewPlacementGuidesForComponents === 'function') {
                window.previewPlacementGuidesForComponents(dragGroup);
            }
            const primaryComp = dragGroup[0] || d;
            const prevDisplayLeft = parseFloat(primaryComp?.style?.left) || primaryComp?.offsetLeft || 0;
            const prevDisplayTop = parseFloat(primaryComp?.style?.top) || primaryComp?.offsetTop || 0;
            const dx = (ev.clientX - startX) / zoomLevel;
            const dy = (ev.clientY - startY) / zoomLevel;
            startByComp.forEach(item => {
                const nx = item.left + dx;
                const ny = item.top + dy;
                const freeMove = isFreeMoveComponent(item.comp);
                const nextLeft = freeMove ? nx : snapToGrid(nx);
                const nextTop = freeMove ? ny : snapToGrid(ny);
                item.comp.style.left = `${nextLeft}px`;
                item.comp.style.top = `${nextTop}px`;
            });
            const nextDisplayLeft = parseFloat(primaryComp?.style?.left) || primaryComp?.offsetLeft || 0;
            const nextDisplayTop = parseFloat(primaryComp?.style?.top) || primaryComp?.offsetTop || 0;
            const deltaLeft = nextDisplayLeft - prevDisplayLeft;
            const deltaTop = nextDisplayTop - prevDisplayTop;
            if (
                (Math.abs(deltaLeft) > 0.001 || Math.abs(deltaTop) > 0.001) &&
                typeof window.moveSelectedWiresByDelta === 'function'
            ) {
                window.moveSelectedWiresByDelta({ dx: deltaLeft, dy: deltaTop }, dragGroup, { snap: false });
            }
        };

        const onUp = () => {
            setComponentDragGuidesActive(false);
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            if (typeof window.clearAutoWireGuides === 'function') {
                window.clearAutoWireGuides();
            }
            if (moved) {
                finalizeDraggedComponentsAndWires(dragGroup, () => anchorStart);
                scheduleHistoryCheckpoint('move_component');
            }
            if (typeof window.resumeWireSelectionAutoClear === 'function') {
                window.resumeWireSelectionAutoClear();
            }
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    });

    d.addEventListener('pointerdown', e => {
        if (isComponentInteractionBlockedByWireMode(e.target)) {
            return;
        }
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (simulando || ferramentaAtiva !== 'select') return;
        if (Date.now() < componentTapSuppressUntil) return;
        const target = e.target;
        if (
            target.closest('.cross-ref-label') ||
            target.closest('.pin-label') ||
            target.closest('.timer-label') ||
            target.closest('.component-meta-label') ||
            target.closest('.rele-controls') ||
            target.closest('.real-regua-controls') ||
            target.closest('.real-regua-marker')
        ) {
            return;
        }

        const additive = !!(e.shiftKey || e.ctrlKey || e.metaKey);
        if (additive) {
            setComponentSelected(d, !d.classList.contains('component-selected'));
        } else if (!d.classList.contains('component-selected') || getSelectedComponents().length <= 1) {
            selectSingleComponent(d);
        }
    });

    const handleComponentDoubleActivate = (e) => {
        if (e.target?.closest?.('.real-regua-controls')) return;
        if (e.target?.closest?.('.real-regua-marker')) return;
        if (simulando) return;
        e.stopPropagation();
        if (def && typeof def.onDoubleActivate === 'function') {
            try {
                if (def.onDoubleActivate(d, { event: e }) === true) {
                    return;
                }
            } catch (error) {
                console.error('Falha ao abrir acao customizada do componente.', error);
            }
        }
        if (d.dataset.lib === 'real_sinaleiro') {
            abrirModalSinaleiro(d);
            return;
        }
        if (isSymbolicPropertiesComponent(d)) {
            abrirModalPropriedadesComponente(d);
            return;
        }
        const atual = d.dataset.tag || getDefaultTag(def, k);
        const novo = prompt('Nome do componente/conjunto (ex: K1):', atual);
        if (!novo) return;
        d.dataset.tag = novo.trim();
        const l = d.querySelector('.tag-label');
        if (l) l.innerText = d.dataset.tag;
        scheduleCrossReferenceRefresh();
        scheduleHistoryCheckpoint('tag_component');
    };

    // Option double-clic sur composant annulée selon la demande utilisateur
    // d.addEventListener('dblclick', handleComponentDoubleActivate);
    // bindMobileDoubleTap(d, handleComponentDoubleActivate);

    d.querySelectorAll('.pin-label').forEach(pinLabel => {
        pinLabel.addEventListener('mousedown', e => e.stopPropagation());
        const handlePinLabelDoubleActivate = (e) => {
            e.stopPropagation();
            if (simulando) return;
            if (isSymbolicPropertiesComponent(d)) {
                abrirModalPropriedadesComponente(d);
                return;
            }
            const atual = pinLabel.innerText.trim();
            const novo = prompt('N?mero/identifica??o do contato:', atual);
            if (!novo) return;
            pinLabel.innerText = novo.trim();
            pinLabel.dataset.pinLabel = pinLabel.innerText;
            syncEngineeringPinLabelVar(d, pinLabel);
            scheduleHistoryCheckpoint('pin_label');
        };
        // pinLabel.addEventListener('dblclick', handlePinLabelDoubleActivate);
        // bindMobileDoubleTap(pinLabel, handlePinLabelDoubleActivate);
    });

    d.querySelectorAll('.timer-label').forEach(timerLabel => {
        timerLabel.addEventListener('mousedown', e => e.stopPropagation());
        const handleTimerLabelDoubleActivate = (e) => {
            e.stopPropagation();
            if (simulando) return;
            if (isSymbolicPropertiesComponent(d)) {
                abrirModalPropriedadesComponente(d);
                return;
            }
            const atual = parseFloat(timerLabel.dataset.timerSeconds || '3');
            const novo = prompt('Tempo da bobina (segundos):', String(atual));
            if (!novo) return;
            const parsed = parseFloat(String(novo).replace(',', '.'));
            if (!Number.isFinite(parsed) || parsed <= 0) return;
            const secs = Math.max(1, Math.round(parsed));
            timerLabel.dataset.timerSeconds = String(secs);
            timerLabel.innerText = `${secs}s`;
            scheduleHistoryCheckpoint('timer_label');
        };
        // timerLabel.addEventListener('dblclick', handleTimerLabelDoubleActivate);
        // bindMobileDoubleTap(timerLabel, handleTimerLabelDoubleActivate);
    });

    const releTripBtn = d.querySelector('.rele-trip-btn');
    if (releTripBtn) {
        releTripBtn.addEventListener('mousedown', e => e.stopPropagation());
        releTripBtn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            if (!simulando) return;
            d.dataset.releTrip = 'true';
            if (typeof window.engineStep === 'function') window.engineStep();
            scheduleHistoryCheckpoint('rele_trip');
        });
    }
    const releResetBtn = d.querySelector('.rele-reset-btn');
    if (releResetBtn) {
        releResetBtn.addEventListener('mousedown', e => e.stopPropagation());
        releResetBtn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            if (!simulando) return;
            d.dataset.releTrip = 'false';
            if (typeof window.engineStep === 'function') window.engineStep();
            scheduleHistoryCheckpoint('rele_reset');
        });
    }

    const toggleStateBtn = d.querySelector('.toggle-state-btn');
    if (toggleStateBtn) {
        const syncToggleAria = () => {
            const isOn = d.dataset.manualOn === 'true';
            toggleStateBtn.setAttribute('aria-pressed', isOn ? 'true' : 'false');
        };
        syncToggleAria();
        toggleStateBtn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            if (!simulando) return;
            const current = d.dataset.manualOn === 'true';
            const next = current ? 'false' : 'true';
            d.dataset.manualOn = next;
            if ((d.dataset.lib === 'real_chave_seletora' || d.dataset.lib === 'real_botoeira_emergencia') && typeof window.__playRealComponentSound === 'function') {
                window.__playRealComponentSound('botao_chave');
            }
            if (d.dataset.lib === 'iec_rele_termico') {
                d.dataset.releTrip = next;
            }
            syncToggleAria();
            if (typeof window.engineStep === 'function') {
                window.engineStep();
            }
            scheduleHistoryCheckpoint('toggle_state');
        });
    }

    const manualOnBtn = d.querySelector('.manual-on-btn');
    if (manualOnBtn) {
        manualOnBtn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            if (!simulando) return;
            d.dataset.manualOn = 'true';
            if (d.dataset.lib === 'real_disjuntor_motor' && typeof window.__playRealComponentSound === 'function') {
                window.__playRealComponentSound('botao_chave');
            }
            if (typeof window.engineStep === 'function') {
                window.engineStep();
            }
            scheduleHistoryCheckpoint('manual_on');
        });
    }

    const manualOffBtn = d.querySelector('.manual-off-btn');
    if (manualOffBtn) {
        manualOffBtn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            if (!simulando) return;
            d.dataset.manualOn = 'false';
            if (d.dataset.lib === 'real_disjuntor_motor' && typeof window.__playRealComponentSound === 'function') {
                window.__playRealComponentSound('botao_chave');
            }
            if (typeof window.engineStep === 'function') {
                window.engineStep();
            }
            scheduleHistoryCheckpoint('manual_off');
        });
    }

    if (d.dataset.lib === 'real_sinaleiro') {
        d.dataset.sinalColor = (d.dataset.sinalColor || 'verde').toLowerCase();
    }
    if (d.dataset.lib === 'iec_lampada') {
        applyIecLampColorToComponent(d, d.dataset.lampColor || 'amarelo');
    }
    if (
        d.dataset.lib === 'real_regua_milimetrada' &&
        typeof window.initRealReguaMilimetradaComponent === 'function'
    ) {
        window.initRealReguaMilimetradaComponent(d);
    }
    if (
        d.dataset.lib === 'real_canaleta_reta' &&
        typeof window.initRealCanaletaRetaComponent === 'function'
    ) {
        window.initRealCanaletaRetaComponent(d);
    }
    if (
        d.dataset.lib === 'real_canaleta_canto_90' &&
        typeof window.initRealCanaletaCanto90Component === 'function'
    ) {
        window.initRealCanaletaCanto90Component(d);
    }
    if (
        d.dataset.lib === 'real_trilho_din' &&
        typeof window.initRealTrilhoDinComponent === 'function'
    ) {
        window.initRealTrilhoDinComponent(d);
    }

    d.querySelectorAll('img[data-fallback-png]').forEach(img => {
        img.addEventListener('error', () => {
            const fallback = img.getAttribute('data-fallback-png');
            if (!fallback || img.dataset.fallbackTried === 'true') return;
            img.dataset.fallbackTried = 'true';
            img.src = fallback;
        }, { once: true });
    });
    d.querySelectorAll('img').forEach(img => {
        img.draggable = false;
        img.addEventListener('dragstart', ev => ev.preventDefault());
    });

    // BotÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âµes momentÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢neos
    if (isPressable) {
        const setPress = (val) => {
            d.dataset.pressionado = val ? 'true' : 'false';
            // Recalcula imediatamente para nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o perder pulsos curtos de botoes momentaneos.
            if (simulando && typeof window.engineStep === 'function') {
                window.engineStep();
            }
        };
        const release = () => {
            window.setTimeout(() => setPress(false), 80);
        };

        d.style.cursor = 'pointer';
        d.addEventListener('pointerdown', e => {
            if (!simulando) return;
            e.preventDefault();
            e.stopPropagation();
            if ((d.dataset.lib || '').startsWith('real_botoeira_') && typeof window.__playRealComponentSound === 'function') {
                window.__playRealComponentSound('botao_chave');
            }
            setPress(true);
        });
        d.addEventListener('pointerup', e => {
            if (!simulando) return;
            e.preventDefault();
            e.stopPropagation();
            release();
        });
        d.addEventListener('pointerleave', () => {
            if (!simulando) return;
            release();
        });
        window.addEventListener('pointerup', () => {
            if (!simulando) return;
            release();
        });
    }

    const simClickable =
        !!def?.clickableSim ||
        !!isPressable ||
        !!toggleStateBtn ||
        !!manualOnBtn ||
        !!manualOffBtn ||
        !!releTripBtn ||
        !!releResetBtn ||
        d.dataset.lib === 'real_sinaleiro' ||
        d.dataset.lib === 'real_regua_milimetrada';
    if (simClickable) d.dataset.clickableSim = 'true';
    else delete d.dataset.clickableSim;
    refreshComponentCursor(d);
    d.addEventListener('pointerenter', () => refreshComponentCursor(d));
    scheduleCrossReferenceRefresh();

    return d;
}
window.adicionarComponente = adicionarComponente;

function posicionarComponenteNoCentroVisivel(componentEl) {
    const viewport = document.getElementById('viewport');
    if (!componentEl || !viewport) return;

    const visibleLeft = (-panX) / zoomLevel;
    const visibleTop = (-panY) / zoomLevel;
    const visibleWidth = (viewport.clientWidth || 320) / zoomLevel;
    const visibleHeight = (viewport.clientHeight || 560) / zoomLevel;

    const compW = Math.max(componentEl.offsetWidth || 0, 40);
    const compH = Math.max(componentEl.offsetHeight || 0, 40);

    const targetLeft = visibleLeft + ((visibleWidth - compW) / 2);
    const targetTop = visibleTop + ((visibleHeight * 0.45) - (compH / 2));

    if (isFreeMoveComponent(componentEl)) {
        componentEl.style.left = `${targetLeft}px`;
        componentEl.style.top = `${Math.max(0, targetTop)}px`;
    } else {
        componentEl.style.left = Math.round(targetLeft / GRID_SIZE) * GRID_SIZE + 'px';
        componentEl.style.top = Math.round(Math.max(0, targetTop) / GRID_SIZE) * GRID_SIZE + 'px';
    }
}

function highlightNovoComponente(componentEl) {
    // Destaque vermelho de "novo componente" desativado por decisao de UX.
    document.querySelectorAll('.newly-created-highlight-overlay').forEach(el => el.remove());
}

function isSymbolicPropertiesComponent(componentEl) {
    const lib = String(componentEl?.dataset?.lib || '').trim().toLowerCase();
    if (lib.startsWith('iec_') || lib === 'real_trilho_din') return true;
    if (componentEl.querySelector('.timer-label')) return true;
    return false;
}

function fecharModalPropriedadesComponente() {
    const modal = document.getElementById('symbolic-component-modal');
    if (modal) modal.style.display = 'none';
    symbolicComponentModalTarget = null;
}

function abrirModalPropriedadesComponente(componentEl) {
    if (!componentEl || !isSymbolicPropertiesComponent(componentEl) || simulando) return;
    const modal = document.getElementById('symbolic-component-modal');
    const tagInput = document.getElementById('symbolic-component-tag');
    const manufacturerInput = document.getElementById('symbolic-component-manufacturer');
    const modelInput = document.getElementById('symbolic-component-model');
    const commentInput = document.getElementById('symbolic-component-comment');
    const showModelCheckbox = document.getElementById('symbolic-component-show-model');
    const showManufacturerCheckbox = document.getElementById('symbolic-component-show-manufacturer');
    const timerRow = document.getElementById('symbolic-component-timer-row');
    const timerInput = document.getElementById('symbolic-component-timer');
    const lampRow = document.getElementById('symbolic-component-lamp-row');
    const lampColor = document.getElementById('symbolic-component-lamp-color');
    const pinFields = document.getElementById('symbolic-component-pin-fields');
    if (!modal || !tagInput || !manufacturerInput || !modelInput || !commentInput || !pinFields) return;

    symbolicComponentModalTarget = componentEl;
    const def = BIBLIOTECA[componentEl.dataset.lib] || {};
    tagInput.value = componentEl.dataset.tag || getDefaultTag(def, componentEl.dataset.lib);
    manufacturerInput.value = componentEl.dataset.manufacturer || '';
    modelInput.value = componentEl.dataset.model || '';
    commentInput.value = componentEl.dataset.comment || '';
    if (showModelCheckbox) showModelCheckbox.checked = componentEl.dataset.showModelLabel === 'true';
    if (showManufacturerCheckbox) showManufacturerCheckbox.checked = componentEl.dataset.showManufacturerLabel === 'true';

    const timerLabel = componentEl.querySelector('.timer-label');
    if (timerRow && timerInput) {
        if (timerLabel) {
            timerRow.style.display = 'contents';
            timerInput.value = String(Math.max(1, parseInt(timerLabel.dataset.timerSeconds || '3', 10) || 3));
        } else {
            timerRow.style.display = 'none';
            timerInput.value = '';
        }
    }

    if (lampRow && lampColor) {
        if (componentEl.dataset.lib === 'iec_lampada') {
            lampRow.style.display = 'contents';
            lampColor.value = normalizeIecLampColor(componentEl.dataset.lampColor || 'amarelo');
        } else {
            lampRow.style.display = 'none';
        }
    }

    const trilhoRow = document.getElementById('symbolic-component-trilho-row');
    const trilhoLengthInput = document.getElementById('symbolic-component-trilho-length');
    const trilhoRotInput = document.getElementById('symbolic-component-trilho-rot');
    if (trilhoRow && trilhoLengthInput && trilhoRotInput) {
        if (componentEl.dataset.lib === 'real_trilho_din') {
            trilhoRow.style.display = 'contents';
            trilhoLengthInput.value = componentEl.dataset.trilhoLength || '200';
            trilhoRotInput.value = componentEl.dataset.rot || '0';
        } else {
            trilhoRow.style.display = 'none';
        }
    }

    pinFields.innerHTML = '';
    Array.from(componentEl.querySelectorAll('.pin-label')).forEach((node, idx) => {
        const label = document.createElement('label');
        label.textContent = `Borne ${idx + 1}`;
        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 20;
        input.value = String(node.innerText || '').trim();
        input.dataset.pinIndex = String(idx);
        pinFields.appendChild(label);
        pinFields.appendChild(input);
    });

    modal.style.display = 'flex';
    window.setTimeout(() => {
        tagInput.focus();
        tagInput.select();
    }, 0);
}

function salvarModalPropriedadesComponente() {
    const componentEl = symbolicComponentModalTarget;
    if (!componentEl) {
        fecharModalPropriedadesComponente();
        return;
    }
    const tagInput = document.getElementById('symbolic-component-tag');
    const manufacturerInput = document.getElementById('symbolic-component-manufacturer');
    const modelInput = document.getElementById('symbolic-component-model');
    const commentInput = document.getElementById('symbolic-component-comment');
    const showModelCheckbox = document.getElementById('symbolic-component-show-model');
    const showManufacturerCheckbox = document.getElementById('symbolic-component-show-manufacturer');
    const timerInput = document.getElementById('symbolic-component-timer');
    const lampColor = document.getElementById('symbolic-component-lamp-color');
    const tagValue = String(tagInput?.value || '').trim();
    if (tagValue) {
        componentEl.dataset.tag = tagValue;
        const tagLabel = componentEl.querySelector('.tag-label');
        if (tagLabel) tagLabel.innerText = tagValue;
    }
    componentEl.dataset.manufacturer = String(manufacturerInput?.value || '').trim();
    componentEl.dataset.model = String(modelInput?.value || '').trim();
    componentEl.dataset.comment = String(commentInput?.value || '').trim();
    componentEl.dataset.showModelLabel = showModelCheckbox?.checked ? 'true' : 'false';
    componentEl.dataset.showManufacturerLabel = showManufacturerCheckbox?.checked ? 'true' : 'false';

    Array.from(document.querySelectorAll('#symbolic-component-pin-fields input[data-pin-index]')).forEach(input => {
        const idx = parseInt(input.dataset.pinIndex || '-1', 10);
        if (idx < 0) return;
        const node = componentEl.querySelectorAll('.pin-label')[idx];
        if (node) node.innerText = String(input.value || '').trim();
    });

    const timerLabel = componentEl.querySelector('.timer-label');
    if (timerLabel && timerInput) {
        const parsed = parseFloat(String(timerInput.value || '').replace(',', '.'));
        if (Number.isFinite(parsed) && parsed > 0) {
            const secs = Math.max(1, Math.round(parsed));
            timerLabel.dataset.timerSeconds = String(secs);
            timerLabel.innerText = `${secs}s`;
        }
    }

    if (componentEl.dataset.lib === 'iec_lampada' && lampColor && typeof window.applyIecLampColorToComponent === 'function') {
        window.applyIecLampColorToComponent(componentEl, normalizeIecLampColor(lampColor.value || 'amarelo'));
    }

    const trilhoLengthInput = document.getElementById('symbolic-component-trilho-length');
    const trilhoRotInput = document.getElementById('symbolic-component-trilho-rot');
    if (componentEl.dataset.lib === 'real_trilho_din' && trilhoLengthInput && trilhoRotInput) {
        componentEl.dataset.trilhoLength = trilhoLengthInput.value || '200';
        componentEl.dataset.rot = trilhoRotInput.value || '0';
        if (typeof window.refreshRealTrilhoDinComponent === 'function') {
            window.refreshRealTrilhoDinComponent(componentEl);
        }
    }

    syncComponentMetaLabels(componentEl);
    scheduleCrossReferenceRefresh();
    scheduleHistoryCheckpoint('symbolic_component_properties');
    fecharModalPropriedadesComponente();
}

function initSymbolicComponentPropsModal() {
    const modal = document.getElementById('symbolic-component-modal');
    const saveBtn = document.getElementById('symbolic-component-save');
    const tagInput = document.getElementById('symbolic-component-tag');
    if (!modal) return;
    if (saveBtn) saveBtn.addEventListener('click', salvarModalPropriedadesComponente);
    [
        document.getElementById('symbolic-component-manufacturer'),
        document.getElementById('symbolic-component-model'),
        document.getElementById('symbolic-component-comment'),
        document.getElementById('symbolic-component-timer'),
        document.getElementById('symbolic-component-lamp-color')
    ].filter(Boolean).forEach(input => {
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter' && input.tagName !== 'TEXTAREA') {
                e.preventDefault();
                salvarModalPropriedadesComponente();
            }
        });
    });
    if (tagInput) {
        tagInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                salvarModalPropriedadesComponente();
            }
        });
    }
    modal.addEventListener('mousedown', e => {
        if (e.target === modal) fecharModalPropriedadesComponente();
    });
}

window.fecharModalPropriedadesComponente = fecharModalPropriedadesComponente;

let componentMetaLabelDragState = null;

function isComponentMetaLabelRole(role) {
    return role === 'model' || role === 'manufacturer';
}

function getComponentMetaOffsetDatasetKeys(role) {
    return role === 'manufacturer'
        ? { dx: 'manufacturerLabelDx', dy: 'manufacturerLabelDy' }
        : { dx: 'modelLabelDx', dy: 'modelLabelDy' };
}

function getComponentMetaBasePosition(componentEl, role) {
    const height = Math.max(componentEl?.offsetHeight || 0, 40);
    if (role === 'manufacturer') return { x: -6, y: Math.round((height * 0.5) + 36) };
    return { x: -6, y: Math.round((height * 0.5) + 18) };
}

function getComponentMetaOffset(componentEl, role) {
    const keys = getComponentMetaOffsetDatasetKeys(role);
    const dx = parseFloat(componentEl?.dataset?.[keys.dx] || '0');
    const dy = parseFloat(componentEl?.dataset?.[keys.dy] || '0');
    return { dx: Number.isFinite(dx) ? dx : 0, dy: Number.isFinite(dy) ? dy : 0 };
}

function setComponentMetaOffset(componentEl, role, dx, dy) {
    if (!componentEl || !isComponentMetaLabelRole(role)) return;
    const keys = getComponentMetaOffsetDatasetKeys(role);
    componentEl.dataset[keys.dx] = String(Number.isFinite(dx) ? Math.round(dx) : 0);
    componentEl.dataset[keys.dy] = String(Number.isFinite(dy) ? Math.round(dy) : 0);
}

function applyComponentMetaLabelPosition(labelEl, componentEl, role) {
    if (!labelEl || !componentEl || !isComponentMetaLabelRole(role)) return;
    const base = getComponentMetaBasePosition(componentEl, role);
    const offset = getComponentMetaOffset(componentEl, role);
    labelEl.style.left = `${Math.round(base.x + offset.dx)}px`;
    labelEl.style.top = `${Math.round(base.y + offset.dy)}px`;
}

function endComponentMetaLabelDrag(commitHistory = false) {
    if (!componentMetaLabelDragState) return;
    window.removeEventListener('pointermove', onComponentMetaLabelPointerMove);
    window.removeEventListener('pointerup', onComponentMetaLabelPointerUp);
    window.removeEventListener('pointercancel', onComponentMetaLabelPointerUp);
    const moved = !!componentMetaLabelDragState.moved;
    componentMetaLabelDragState = null;
    if (moved && commitHistory) scheduleHistoryCheckpoint('component_meta_label_drag');
}

function onComponentMetaLabelPointerMove(e) {
    if (!componentMetaLabelDragState) return;
    const drag = componentMetaLabelDragState;
    const dx = (e.clientX - drag.startClientX) / zoomLevel;
    const dy = (e.clientY - drag.startClientY) / zoomLevel;
    setComponentMetaOffset(drag.componentEl, drag.role, drag.startOffset.dx + dx, drag.startOffset.dy + dy);
    applyComponentMetaLabelPosition(drag.labelEl, drag.componentEl, drag.role);
    drag.moved = true;
}

function onComponentMetaLabelPointerUp() {
    endComponentMetaLabelDrag(true);
}

function beginComponentMetaLabelDrag(e, labelEl, componentEl, role) {
    if (!labelEl || !componentEl || !isComponentMetaLabelRole(role)) return;
    if (simulando || ferramentaAtiva !== 'select') return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    endComponentMetaLabelDrag(false);
    componentMetaLabelDragState = {
        labelEl,
        componentEl,
        role,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startOffset: getComponentMetaOffset(componentEl, role),
        moved: false
    };
    window.addEventListener('pointermove', onComponentMetaLabelPointerMove);
    window.addEventListener('pointerup', onComponentMetaLabelPointerUp);
    window.addEventListener('pointercancel', onComponentMetaLabelPointerUp);
}

function ensureComponentMetaLabels(componentEl) {
    if (!componentEl || !isSymbolicPropertiesComponent(componentEl)) return;
    const specs = [
        { role: 'model', className: 'component-model-label' },
        { role: 'manufacturer', className: 'component-manufacturer-label' }
    ];
    specs.forEach(spec => {
        let labelEl = componentEl.querySelector(`.component-meta-label[data-role="${spec.role}"]`);
        if (!labelEl) {
            labelEl = document.createElement('div');
            labelEl.className = `component-meta-label ${spec.className}`;
            labelEl.dataset.role = spec.role;
            labelEl.addEventListener('pointerdown', e => beginComponentMetaLabelDrag(e, labelEl, componentEl, spec.role));
            const handleMetaLabelDoubleActivate = (e) => {
                e.stopPropagation();
                if (!simulando) abrirModalPropriedadesComponente(componentEl);
            };
            labelEl.addEventListener('dblclick', handleMetaLabelDoubleActivate);
            bindMobileDoubleTap(labelEl, handleMetaLabelDoubleActivate);
            componentEl.appendChild(labelEl);
        }
    });
}

function syncComponentMetaLabels(componentEl) {
    if (!componentEl || !isSymbolicPropertiesComponent(componentEl)) return;
    ensureComponentMetaLabels(componentEl);
    const modelLabel = componentEl.querySelector('.component-meta-label[data-role="model"]');
    const manufacturerLabel = componentEl.querySelector('.component-meta-label[data-role="manufacturer"]');
    if (modelLabel) {
        const text = String(componentEl.dataset.model || '').trim();
        const visible = componentEl.dataset.showModelLabel === 'true' && !!text;
        modelLabel.textContent = text;
        modelLabel.style.display = visible ? 'block' : 'none';
        if (visible) applyComponentMetaLabelPosition(modelLabel, componentEl, 'model');
    }
    if (manufacturerLabel) {
        const text = String(componentEl.dataset.manufacturer || '').trim();
        const visible = componentEl.dataset.showManufacturerLabel === 'true' && !!text;
        manufacturerLabel.textContent = text;
        manufacturerLabel.style.display = visible ? 'block' : 'none';
        if (visible) applyComponentMetaLabelPosition(manufacturerLabel, componentEl, 'manufacturer');
    }
}

window.syncComponentMetaLabels = syncComponentMetaLabels;

function getSinaleiroColorChecks() {
    return Array.from(document.querySelectorAll('.sinaleiro-color-check'));
}

function selectSinaleiroColor(color) {
    const checks = getSinaleiroColorChecks();
    let found = false;
    checks.forEach(check => {
        const isCurrent = check.dataset.color === color;
        check.checked = isCurrent;
        if (isCurrent) found = true;
    });
    if (!found && checks[0]) checks[0].checked = true;
}

function getSelectedSinaleiroColor() {
    const selected = getSinaleiroColorChecks().find(check => check.checked);
    const color = selected?.dataset?.color || 'verde';
    return SINALEIRO_CORES.includes(color) ? color : 'verde';
}

function abrirModalSinaleiro(componentEl) {
    if (!componentEl || componentEl.dataset.lib !== 'real_sinaleiro') return;
    const modal = document.getElementById('sinaleiro-modal');
    const tagInput = document.getElementById('sinaleiro-tag-input');
    if (!modal || !tagInput) return;

    sinaleiroModalTarget = componentEl;
    const def = BIBLIOTECA[componentEl.dataset.lib] || {};
    tagInput.value = componentEl.dataset.tag || getDefaultTag(def, componentEl.dataset.lib);
    tagInput.disabled = simulando;

    const color = (componentEl.dataset.sinalColor || 'verde').toLowerCase();
    selectSinaleiroColor(SINALEIRO_CORES.includes(color) ? color : 'verde');

    modal.style.display = 'flex';
    window.setTimeout(() => {
        tagInput.focus();
        tagInput.select();
    }, 0);
}

function fecharModalSinaleiro() {
    const modal = document.getElementById('sinaleiro-modal');
    if (modal) modal.style.display = 'none';
    sinaleiroModalTarget = null;
}

function salvarModalSinaleiro() {
    if (!sinaleiroModalTarget) {
        fecharModalSinaleiro();
        return;
    }

    const tagInput = document.getElementById('sinaleiro-tag-input');
    const selectedColor = getSelectedSinaleiroColor();
    sinaleiroModalTarget.dataset.sinalColor = selectedColor;

    const nextTag = (tagInput?.value || '').trim();
    if (!simulando && nextTag) {
        sinaleiroModalTarget.dataset.tag = nextTag;
        const label = sinaleiroModalTarget.querySelector('.tag-label');
        if (label) label.innerText = nextTag;
    }

    if (simulando && typeof window.engineStep === 'function') window.engineStep();
    scheduleHistoryCheckpoint('sinaleiro_modal');
    fecharModalSinaleiro();
}

function initSinaleiroModal() {
    const modal = document.getElementById('sinaleiro-modal');
    const saveBtn = document.getElementById('sinaleiro-modal-save');
    const tagInput = document.getElementById('sinaleiro-tag-input');
    if (!modal) return;

    getSinaleiroColorChecks().forEach(check => {
        check.addEventListener('change', () => {
            if (check.checked) {
                selectSinaleiroColor(check.dataset.color);
                return;
            }
            if (!getSinaleiroColorChecks().some(i => i.checked)) check.checked = true;
        });
    });

    if (saveBtn) saveBtn.addEventListener('click', salvarModalSinaleiro);

    if (tagInput) {
        tagInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                salvarModalSinaleiro();
            }
        });
    }

    modal.addEventListener('mousedown', e => {
        if (e.target === modal) fecharModalSinaleiro();
    });
}

window.fecharModalSinaleiro = fecharModalSinaleiro;

function getIecLampColorChecks() {
    return Array.from(document.querySelectorAll('.iec-lamp-color-check'));
}

function selectIecLampColor(color) {
    const normalized = normalizeIecLampColor(color);
    const checks = getIecLampColorChecks();
    let found = false;
    checks.forEach(check => {
        const isCurrent = (check.dataset.color || '') === normalized;
        check.checked = isCurrent;
        if (isCurrent) found = true;
    });
    if (!found && checks[0]) checks[0].checked = true;
}

function getSelectedIecLampColor() {
    const selected = getIecLampColorChecks().find(check => check.checked);
    const color = selected?.dataset?.color || 'amarelo';
    return normalizeIecLampColor(color);
}

function abrirModalIecLampada(componentEl) {
    if (!componentEl || componentEl.dataset.lib !== 'iec_lampada') return;
    const modal = document.getElementById('iec-lamp-modal');
    if (!modal) return;
    iecLampModalTarget = componentEl;
    selectIecLampColor(componentEl.dataset.lampColor || 'amarelo');
    modal.style.display = 'flex';
}

function fecharModalIecLampada() {
    const modal = document.getElementById('iec-lamp-modal');
    if (modal) modal.style.display = 'none';
    iecLampModalTarget = null;
}

function salvarModalIecLampada() {
    if (!iecLampModalTarget) {
        fecharModalIecLampada();
        return;
    }
    const color = getSelectedIecLampColor();
    applyIecLampColorToComponent(iecLampModalTarget, color);
    scheduleHistoryCheckpoint('iec_lamp_color');
    fecharModalIecLampada();
}

function initIecLampModal() {
    const modal = document.getElementById('iec-lamp-modal');
    const saveBtn = document.getElementById('iec-lamp-modal-save');
    if (!modal) return;

    getIecLampColorChecks().forEach(check => {
        check.addEventListener('change', () => {
            if (check.checked) {
                selectIecLampColor(check.dataset.color || 'amarelo');
                return;
            }
            if (!getIecLampColorChecks().some(i => i.checked)) check.checked = true;
        });
    });

    if (saveBtn) saveBtn.addEventListener('click', salvarModalIecLampada);
    modal.addEventListener('mousedown', e => {
        if (e.target === modal) fecharModalIecLampada();
    });
}

window.fecharModalIecLampada = fecharModalIecLampada;

function getHighlightTarget(componentEl) {
    if (!componentEl) return null;
    const children = Array.from(componentEl.children || []);
    const visualChild = children.find(child => {
        if (!child.classList) return true;
        return !(
            child.classList.contains('borne') ||
            child.classList.contains('pin-label') ||
            child.classList.contains('tag-label') ||
            child.classList.contains('timer-label') ||
            child.classList.contains('component-meta-label')
        );
    });
    return visualChild || componentEl;
}

function getWorkspacePointFromClient(clientX, clientY) {
    const viewport = document.getElementById('viewport');
    if (!viewport) return null;
    const rect = viewport.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    return {
        x: ((-panX) + localX) / zoomLevel,
        y: ((-panY) + localY) / zoomLevel
    };
}

function positionMenuDraggedComponent(componentEl, clientX, clientY) {
    if (!componentEl) return false;
    const pt = getWorkspacePointFromClient(clientX, clientY);
    if (!pt || !Number.isFinite(pt.x) || !Number.isFinite(pt.y)) return false;
    const w = Math.max(componentEl.offsetWidth || 40, 40);
    const h = Math.max(componentEl.offsetHeight || 40, 40);
    const freeMove = isFreeMoveComponent(componentEl);
    const left = freeMove
        ? (pt.x - (w / 2))
        : Math.round((pt.x - (w / 2)) / GRID_SIZE) * GRID_SIZE;
    const top = freeMove
        ? (pt.y - (h / 2))
        : Math.round((pt.y - (h / 2)) / GRID_SIZE) * GRID_SIZE;
    componentEl.style.left = `${left}px`;
    componentEl.style.top = `${top}px`;
    return true;
}

function setViewportDropHighlight(active) {
    const viewport = document.getElementById('viewport');
    if (!viewport) return;
    viewport.classList.toggle('drop-target-active', !!active);
}

function cleanupMenuComponentDrag() {
    setViewportDropHighlight(false);
    setComponentDragGuidesActive(false);
    if (typeof window.clearAutoWireGuides === 'function') {
        window.clearAutoWireGuides();
    }
    menuComponentDrag = null;
    window.removeEventListener('pointermove', onMenuComponentDragMove, true);
    window.removeEventListener('pointerup', onMenuComponentDragEnd, true);
    window.removeEventListener('pointercancel', onMenuComponentDragEnd, true);
}

function onMenuComponentDragMove(e) {
    if (!menuComponentDrag || e.pointerId !== menuComponentDrag.pointerId) return;

    const dx = e.clientX - menuComponentDrag.startX;
    const dy = e.clientY - menuComponentDrag.startY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const dist = Math.hypot(dx, dy);

    // Touch: prioritize natural vertical scroll in sidebar.
    // Only start drag if gesture is predominantly horizontal/intentional.
    if (!menuComponentDrag.started && menuComponentDrag.pointerType !== 'mouse') {
        if (absDy > absDx * 1.15) return;
    }

    if (!menuComponentDrag.started && dist >= MENU_COMPONENT_DRAG_THRESHOLD) {
        menuComponentDrag.started = true;
    }
    if (!menuComponentDrag.started) return;

    const app = document.querySelector('.app-container');
    const sidebar = document.querySelector('.sidebar');
    const mobileSidebarOpen = !!(isMobileViewport() && app?.classList.contains('sidebar-open'));
    if (mobileSidebarOpen && !menuComponentDrag.sidebarAutoClosed) {
        const sr = sidebar?.getBoundingClientRect();
        const pointerInsideSidebar = !!sr &&
            e.clientX >= sr.left && e.clientX <= sr.right &&
            e.clientY >= sr.top && e.clientY <= sr.bottom;
        if (!pointerInsideSidebar && typeof toggleSidebar === 'function') {
            toggleSidebar(false);
            menuComponentDrag.sidebarAutoClosed = true;
        }
    }

    menuComponentDrag.lastClientX = e.clientX;
    menuComponentDrag.lastClientY = e.clientY;
    const viewport = document.getElementById('viewport');
    const vr = viewport?.getBoundingClientRect();
    const inside = !!vr &&
        e.clientX >= vr.left && e.clientX <= vr.right &&
        e.clientY >= vr.top && e.clientY <= vr.bottom;
    setViewportDropHighlight(inside);

    const draggingComp = menuComponentDrag.componentEl;
    if (inside && draggingComp) {
        positionMenuDraggedComponent(draggingComp, e.clientX, e.clientY);
        setComponentDragGuidesActive(true);
        updateMouseGuidesForComponent(draggingComp);
        if (typeof window.previewPlacementGuidesForComponent === 'function') {
            window.previewPlacementGuidesForComponent(draggingComp);
        }
        const canPreviewAutoWire =
            typeof window.isAutoWireEnabled === 'function'
                ? window.isAutoWireEnabled()
                : true;
        if (canPreviewAutoWire && typeof window.previewAutoWireGuidesForComponents === 'function') {
            window.previewAutoWireGuidesForComponents([draggingComp]);
        } else if (canPreviewAutoWire && typeof window.previewAutoWireGuidesForComponent === 'function') {
            window.previewAutoWireGuidesForComponent(draggingComp);
        }
    } else {
        setComponentDragGuidesActive(false);
        if (typeof window.clearAutoWireGuides === 'function') {
            window.clearAutoWireGuides();
        }
    }
}

function onMenuComponentDragEnd(e) {
    if (!menuComponentDrag || e.pointerId !== menuComponentDrag.pointerId) return;

    const viewport = document.getElementById('viewport');
    const app = document.querySelector('.app-container');
    const mobileSidebarOpen = !!(isMobileViewport() && app?.classList.contains('sidebar-open'));
    const vr = viewport?.getBoundingClientRect();
    const endClientX = Number.isFinite(e.clientX) ? e.clientX : menuComponentDrag.lastClientX;
    const endClientY = Number.isFinite(e.clientY) ? e.clientY : menuComponentDrag.lastClientY;
    const droppedInViewport = !!vr &&
        Number.isFinite(endClientX) && Number.isFinite(endClientY) &&
        endClientX >= vr.left && endClientX <= vr.right &&
        endClientY >= vr.top && endClientY <= vr.bottom;
    const sidebar = document.querySelector('.sidebar');
    const sr = sidebar?.getBoundingClientRect();
    const droppedInSidebar = !!sr &&
        Number.isFinite(endClientX) && Number.isFinite(endClientY) &&
        endClientX >= sr.left && endClientX <= sr.right &&
        endClientY >= sr.top && endClientY <= sr.bottom;
    const componentEl = menuComponentDrag.componentEl;
    const promptQuantityOnDrop = !!menuComponentDrag.promptQuantityOnDrop;
    const batchMaxQuantity = Math.max(1, parseInt(menuComponentDrag.batchMaxQuantity, 10) || 100);
    const batchComponentName = String(menuComponentDrag.batchComponentName || 'componentes').toLowerCase();
    const batchSpacing = menuComponentDrag.batchSpacing || { x: GRID_SIZE, y: 0 };
    const shouldKeep = !!componentEl && !simulando && droppedInViewport;
    if (shouldKeep && componentEl) {
        positionMenuDraggedComponent(componentEl, endClientX, endClientY);
    }

    cleanupMenuComponentDrag();

    if (!shouldKeep) {
        if (componentEl && (droppedInSidebar || !droppedInViewport)) {
            componentEl.remove();
        }
        return;
    }

    if (mobileSidebarOpen && typeof toggleSidebar === 'function') {
        toggleSidebar(false);
    }

    const previousTool = ferramentaAtiva;
    if (previousTool === 'fio' && typeof cancelarFio === 'function') cancelarFio();

    // Garantia de usabilidade: depois de soltar um componente, volta para selecao
    // para permitir arraste imediato do item recÃƒÆ’Ã‚Â©m-posicionado.
    if (previousTool !== 'select') {
        ativarFerramenta('select');
    }
    let batchQuantity = 1;
    if (promptQuantityOnDrop) {
        while (true) {
            const answer = window.prompt(
                `Quantos ${batchComponentName} deseja adicionar?`,
                String(batchQuantity)
            );
            if (answer == null) break;
            const parsed = parseInt(String(answer).trim(), 10);
            if (Number.isFinite(parsed) && parsed >= 1 && parsed <= batchMaxQuantity) {
                batchQuantity = parsed;
                break;
            }
            window.alert(`Informe uma quantidade entre 1 e ${batchMaxQuantity}.`);
        }
    }
    const createdBatch = [componentEl];
    const baseTop = parseFloat(componentEl.style.top) || componentEl.offsetTop || 0;
    const baseLeft = parseFloat(componentEl.style.left) || componentEl.offsetLeft || 0;
    for (let index = 1; index < batchQuantity; index += 1) {
        const next = adicionarComponente(
            componentEl.dataset.lib,
            null,
            baseTop + (Number(batchSpacing.y) || 0) * index,
            baseLeft + (Number(batchSpacing.x) || 0) * index,
            {
                highlightOnCreate: false,
                ensureVisibleOnCreate: false,
                autoWireOnCreate: false
            }
        );
        if (next) createdBatch.push(next);
    }
    clearComponentSelection();
    createdBatch.forEach(comp => {
        setComponentSelected(comp, true);
        rebindComponentDragInteractions(comp);
        refreshComponentCursor(comp);
        highlightNovoComponente(comp);
    });
    const def = BIBLIOTECA[componentEl.dataset.lib] || null;
    createdBatch.forEach(comp => {
        if (def && typeof def.onPlaced === 'function') {
            try {
                def.onPlaced(comp, { source: 'menu_drag_drop', skipBotoeiraConfig: !!comp.dataset.skipBotoeiraConfig, skipChaveSeletoraConfig: !!comp.dataset.skipChaveSeletoraConfig });
            } catch (error) {
                console.error('Falha ao finalizar insercao do componente customizado.', error);
            }
        }
        if (typeof window.handleAutoWireAfterComponentDrop === 'function') {
            window.handleAutoWireAfterComponentDrop(comp, { showGuides: false });
        }
    });
    if (!(def && def.deferInitialHistoryCheckpoint)) {
        scheduleHistoryCheckpoint('add_component');
    }
}

function beginMenuComponentDrag(e, item) {
    if (simulando) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    // No touch, allow natural vertical scrolling of the sidebar list.
    // Keep preventDefault for mouse to avoid text selection while dragging.
    if (e.pointerType === 'mouse') {
        e.preventDefault();
        e.stopPropagation();
    }
    cleanupMenuComponentDrag();
    const key = item?.key;
    const def = BIBLIOTECA[key];
    if (!key || !def) return;
    const targetMode = getModeByComponent(key, def);
    if (typeof switchWorkspace === 'function' && targetMode && activeWorkspaceMode !== targetMode) {
        switchWorkspace(targetMode);
    }
    const created = adicionarComponente(
        key,
        null,
        null,
        null,
        {
            highlightOnCreate: false,
            ensureVisibleOnCreate: true,
            autoWireOnCreate: false
        }
    );
    if (!created) return;
    positionMenuDraggedComponent(created, e.clientX, e.clientY);
    menuComponentDrag = {
        key,
        pointerType: e.pointerType || 'mouse',
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        lastClientX: e.clientX,
        lastClientY: e.clientY,
        started: false,
        componentEl: created,
        sidebarAutoClosed: false,
        promptQuantityOnDrop: !!def.promptQuantityOnAdd,
        batchMaxQuantity: Math.max(1, parseInt(def.maxAddQuantity, 10) || 100),
        batchComponentName: String(def.nome || 'componentes'),
        batchSpacing: def.batchSpacing || { x: GRID_SIZE, y: 0 }
    };

    window.addEventListener('pointermove', onMenuComponentDragMove, true);
    window.addEventListener('pointerup', onMenuComponentDragEnd, true);
    window.addEventListener('pointercancel', onMenuComponentDragEnd, true);
}

// =====================================================
// MENU LATERAL
// =====================================================
function normalizeMenuClassificationText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
}

function getMenuClassification(item = {}) {
    const key = normalizeMenuClassificationText(item.key);
    const tipo = normalizeMenuClassificationText(item.tipo);
    const nome = normalizeMenuClassificationText(item.nome);
    const cat = normalizeMenuClassificationText(item.cat);
    const text = [key, tipo, nome, cat].join(' ');

    if (key.includes('segmento_cabo') || tipo.includes('segmento_cabo')) return 'outros';

    if (key.includes('contato_rele_term')) return 'acionamentos';

    if (tipo.includes('sensor') || key.includes('sensor') || nome.includes('boia')) return 'sensores';
    if (
        tipo.includes('protecao') ||
        key.includes('disjuntor') ||
        key.includes('fusivel') ||
        key.includes('fusiveis') ||
        key.includes('rele_falta_fase') ||
        key.includes('rele_termico') ||
        text.includes('rele termico') ||
        text.includes('falta de fase') ||
        text.includes('seguranca')
    ) return 'protecao';

    if (
        tipo.includes('fonte') ||
        tipo.includes('transformador') ||
        tipo.includes('barramento') ||
        key.includes('fonte') ||
        key.includes('transformador') ||
        key.includes('fase') ||
        key.includes('neutro') ||
        key.includes('terra') ||
        key.includes('setas_continuacao')
    ) return 'fontes';

    if (tipo.includes('motor') || key.includes('motor') || key.includes('bomba')) return 'motores';
    if (tipo.includes('bobina') || key.includes('bobina')) return 'bobinas';
    if (
        tipo.includes('botao') ||
        tipo.includes('chave') ||
        tipo.includes('contato') ||
        tipo.includes('contator') ||
        tipo.includes('temporizador') ||
        tipo.includes('sinaleiro') ||
        tipo.includes('rele') ||
        tipo.includes('controle') ||
        key.includes('contator') ||
        key.includes('botoeira') ||
        key.includes('seletora') ||
        key.includes('temporizador') ||
        key.includes('programador') ||
        key.includes('wifi')
    ) return 'acionamentos';
    return 'outros';
}
function createMenuComponentButton(item) {
    const b = document.createElement('button');
    b.className = 'menu-component-btn';
    const lang = window.SimuDzI18n?.getLanguage?.() || 'pt-BR';
    const translatedName = window.SimuDzComponentI18n?.translateName?.(item.key, item.nome, lang) || item.nome;
    b.title = translatedName;
    b.dataset.lib = item.key;
    b.dataset.i18nComponentOriginal = item.nome;

    const simbolo = criarPreviewSimboloMenu(item);
    if (simbolo) b.appendChild(simbolo);

    const nome = document.createElement('span');
    nome.className = 'menu-component-name';
    nome.textContent = translatedName;
    b.appendChild(nome);
    b.addEventListener('click', ev => ev.preventDefault());
    b.addEventListener('pointerdown', ev => beginMenuComponentDrag(ev, item));
    return b;
}

function setMenuCategoryOpen(content, open) {
    if (!content) return;
    content.classList.toggle('open', !!open);
    const category = content.closest('.menu-category');
    const header = category?.querySelector('.cat-header');
    if (header) header.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function gerarMenus() {
    const container = document.getElementById('menu-container');
    if (!container) return;

    container.innerHTML = '';

    const actions = document.createElement('div');
    actions.className = 'menu-actions menu-class-actions';
    const toggleAllBtn = document.createElement('button');
    toggleAllBtn.id = 'btn-toggle-cats';
    toggleAllBtn.type = 'button';
    toggleAllBtn.onclick = toggleCategorias;
    actions.appendChild(toggleAllBtn);
    container.appendChild(actions);

    const categorias = new Map(MENU_CLASSIFICATIONS.map(group => [group.id, { ...group, items: [] }]));
    for (let k in BIBLIOTECA) {
        const i = BIBLIOTECA[k];
        if (!componenteNoModoAtual(k, i)) continue;
        const item = { key: k, ...i };
        const groupId = getMenuClassification(item);
        const group = categorias.get(groupId) || categorias.get('outros');
        group.items.push(item);
    }

    Array.from(categorias.values())
        .filter(group => group.items.length)
        .forEach(group => {
            const div = document.createElement('div');
            div.className = 'menu-category';
            div.dataset.menuClass = group.id;

            const header = document.createElement('button');
            header.className = 'cat-header';
            header.type = 'button';
            header.setAttribute('aria-expanded', categoriasAbertas ? 'true' : 'false');

            const icon = document.createElement('i');
            icon.className = `fa-solid ${group.icon || 'fa-folder'}`;
            header.appendChild(icon);

            const title = document.createElement('span');
            title.className = 'cat-title';
            const lang = window.SimuDzI18n?.getLanguage?.() || 'pt-BR';
            title.dataset.i18nCategoryOriginal = group.title;
            title.textContent = window.SimuDzComponentI18n?.translateCategory?.(group.title, lang) || group.title;
            header.appendChild(title);

            const count = document.createElement('span');
            count.className = 'cat-count';
            count.textContent = String(group.items.length);
            header.appendChild(count);

            const chevron = document.createElement('i');
            chevron.className = 'fa-solid fa-chevron-down menu-cat-chevron';
            header.appendChild(chevron);

            const content = document.createElement('div');
            content.className = categoriasAbertas ? 'cat-content open' : 'cat-content';

            header.onclick = () => {
                setMenuCategoryOpen(content, !content.classList.contains('open'));
                syncCategoriasButtonText();
            };

            group.items.forEach(i => content.appendChild(createMenuComponentButton(i)));

            div.appendChild(header);
            div.appendChild(content);
            container.appendChild(div);
        });

    syncCategoriasButtonText();
}
function criarPreviewSimboloMenu(item) {
    const preview = document.createElement('div');
    preview.className = 'menu-symbol-preview';

    if (item?.foto) {
        const img = document.createElement('img');
        img.src = item.foto;
        img.alt = item.nome || 'Simbolo';
        preview.appendChild(img);
        return preview;
    }

    if (typeof item?.html === 'function') {
        const host = document.createElement('div');
        host.innerHTML = item.html('menu-preview');
        const simbolo = host.querySelector('svg, img');
        if (simbolo) {
            const clone = simbolo.cloneNode(true);
            if (clone.tagName) {
                const tag = clone.tagName.toLowerCase();
                if (tag === 'svg') {
                    const widthAttr = parseFloat(clone.getAttribute('width') || '0');
                    const heightAttr = parseFloat(clone.getAttribute('height') || '0');
                    if (!clone.getAttribute('viewBox') && widthAttr > 0 && heightAttr > 0) {
                        clone.setAttribute('viewBox', `0 0 ${widthAttr} ${heightAttr}`);
                    }
                    clone.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                }
                clone.removeAttribute('style');
                clone.style.width = '100%';
                clone.style.height = '100%';
                clone.style.objectFit = 'contain';
                clone.style.display = 'block';
            }
            preview.appendChild(clone);
            return preview;
        }
    }

    if (item?.icone) {
        const icon = document.createElement('i');
        icon.className = `fa-solid ${item.icone}`;
        preview.appendChild(icon);
        return preview;
    }

    return null;
}

function formatProjectSheetDate(dateObj = new Date()) {
    const d = String(dateObj.getDate()).padStart(2, '0');
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const y = String(dateObj.getFullYear());
    return `${d}/${m}/${y}`;
}

function formatFileSize(bytes) {
    const size = Number(bytes);
    if (!Number.isFinite(size) || size <= 0) return '0 B';
    if (size < 1024) return `${Math.round(size)} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function sheetLogoExtensionFromMime(mimeType) {
    const mime = String(mimeType || '').toLowerCase();
    if (mime === 'image/jpeg') return 'jpg';
    if (mime === 'image/png') return 'png';
    if (mime === 'image/webp') return 'webp';
    return 'img';
}

function sanitizeSheetLogoFileName(fileName, mimeType) {
    const rawBase = String(fileName || 'logo')
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-z0-9_-]+/gi, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
    const base = rawBase || 'logo';
    return `${base}.${sheetLogoExtensionFromMime(mimeType)}`;
}

function inferSheetLogoMimeFromDataUrl(dataUrl) {
    const txt = String(dataUrl || '').trim();
    const m = txt.match(/^data:([^;]+);base64,/i);
    if (!m) return '';
    return String(m[1] || '').toLowerCase();
}

function normalizeSheetLogoMeta(meta) {
    if (!meta || typeof meta !== 'object') return null;
    const mimeType = String(meta.mimeType || '').trim().toLowerCase();
    const width = parseInt(meta.width, 10);
    const height = parseInt(meta.height, 10);
    const bytes = parseInt(meta.bytes, 10);
    const fileName = String(meta.fileName || '').trim();
    const normalized = {
        mimeType: mimeType.startsWith('image/') ? mimeType : '',
        width: Number.isFinite(width) && width > 0 ? width : null,
        height: Number.isFinite(height) && height > 0 ? height : null,
        bytes: Number.isFinite(bytes) && bytes > 0 ? bytes : null,
        fileName
    };
    if (!normalized.mimeType && !normalized.width && !normalized.height && !normalized.bytes && !normalized.fileName) {
        return null;
    }
    if (!normalized.mimeType) normalized.mimeType = SHEET_LOGO_OUTPUT_MIME;
    if (!normalized.fileName) normalized.fileName = sanitizeSheetLogoFileName('logo', normalized.mimeType);
    return normalized;
}

function readBlobAsDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || '').trim());
        reader.onerror = () => reject(new Error('Falha ao ler arquivo de imagem.'));
        reader.readAsDataURL(blob);
    });
}

function loadImageFromDataUrl(dataUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Falha ao abrir a imagem.'));
        img.src = dataUrl;
    });
}

function canvasToBlobAsync(canvas, mimeType, quality) {
    return new Promise(resolve => {
        canvas.toBlob(blob => resolve(blob), mimeType, quality);
    });
}

async function convertSheetLogoFile(file) {
    const mimeType = String(file?.type || '').toLowerCase();
    const ext = String(file?.name || '').trim().toLowerCase();
    const extAllowed = /\.(png|jpg|jpeg|webp)$/i.test(ext);
    if (!SHEET_LOGO_ALLOWED_MIME_TYPES.has(mimeType) && !extAllowed) {
        const lista = ['PNG', 'JPG', 'JPEG', 'WEBP'].join(', ');
        throw new Error(`Formato nao suportado. Use: ${lista}.`);
    }
    const inputSize = Number(file?.size || 0);
    if (!Number.isFinite(inputSize) || inputSize <= 0) {
        throw new Error('Arquivo de logo invalido.');
    }
    if (inputSize > SHEET_LOGO_MAX_INPUT_BYTES) {
        throw new Error(`Arquivo muito grande (${formatFileSize(inputSize)}). Maximo permitido: ${formatFileSize(SHEET_LOGO_MAX_INPUT_BYTES)}.`);
    }

    const inputDataUrl = await readBlobAsDataUrl(file);
    const image = await loadImageFromDataUrl(inputDataUrl);
    const sourceWidth = Math.max(1, Math.round(image.naturalWidth || image.width || 1));
    const sourceHeight = Math.max(1, Math.round(image.naturalHeight || image.height || 1));
    const ratio = Math.min(
        1,
        SHEET_LOGO_MAX_OUTPUT_WIDTH / sourceWidth,
        SHEET_LOGO_MAX_OUTPUT_HEIGHT / sourceHeight
    );
    const outputWidth = Math.max(1, Math.round(sourceWidth * ratio));
    const outputHeight = Math.max(1, Math.round(sourceHeight * ratio));

    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Nao foi possivel processar a imagem da logo.');
    ctx.clearRect(0, 0, outputWidth, outputHeight);
    ctx.drawImage(image, 0, 0, outputWidth, outputHeight);

    let outputBlob = await canvasToBlobAsync(canvas, SHEET_LOGO_OUTPUT_MIME, SHEET_LOGO_OUTPUT_QUALITY);
    if (!outputBlob) {
        outputBlob = await canvasToBlobAsync(canvas, 'image/png');
    }
    if (!outputBlob) throw new Error('Falha ao converter a logo.');

    if (outputBlob.size > SHEET_LOGO_MAX_OUTPUT_BYTES) {
        const fallbackCompressed = await canvasToBlobAsync(canvas, SHEET_LOGO_OUTPUT_MIME, 0.72);
        if (fallbackCompressed && fallbackCompressed.size < outputBlob.size) {
            outputBlob = fallbackCompressed;
        }
    }
    if (outputBlob.size > SHEET_LOGO_MAX_OUTPUT_BYTES) {
        throw new Error(`A logo convertida ficou muito grande (${formatFileSize(outputBlob.size)}). Use uma imagem menor.`);
    }

    const outputDataUrl = await readBlobAsDataUrl(outputBlob);
    const outputMimeType = String(outputBlob.type || SHEET_LOGO_OUTPUT_MIME).toLowerCase();
    return {
        dataUrl: outputDataUrl,
        meta: normalizeSheetLogoMeta({
            mimeType: outputMimeType,
            width: outputWidth,
            height: outputHeight,
            bytes: outputBlob.size,
            fileName: sanitizeSheetLogoFileName(file?.name || 'logo', outputMimeType)
        })
    };
}

function normalizeSheetPaperSize(size) {
    const txt = String(size || '').trim().toUpperCase();
    return SHEET_PAPER_SPECS_MM[txt] ? txt : SHEET_DEFAULT_PAPER_SIZE;
}

function getSheetPaperSpecMm(size) {
    return SHEET_PAPER_SPECS_MM[normalizeSheetPaperSize(size)] || SHEET_PAPER_SPECS_MM[SHEET_DEFAULT_PAPER_SIZE];
}

function getSheetGridByPaperSize(size) {
    const mm = getSheetPaperSpecMm(size);
    const cols = Math.max(
        6,
        Math.round(SHEET_BASE_COLS * (mm.width / SHEET_BASE_SIZE_MM.width))
    );
    const rows = Math.max(
        4,
        Math.round(SHEET_BASE_ROWS * (mm.height / SHEET_BASE_SIZE_MM.height))
    );
    return { cols, rows };
}

function getSheetPixelSizeByPaper(size) {
    const mm = getSheetPaperSpecMm(size);
    return {
        widthPx: Math.round(mm.width * SHEET_RENDER_PX_PER_MM),
        heightPx: Math.round(mm.height * SHEET_RENDER_PX_PER_MM)
    };
}

function buildDefaultSheetPageConfig(sheetName = '') {
    const grid = getSheetGridByPaperSize(SHEET_DEFAULT_PAPER_SIZE);
    return {
        paperSize: SHEET_DEFAULT_PAPER_SIZE,
        gridCols: grid.cols,
        gridRows: grid.rows,
        legendTitle: '',
        author: '',
        project: '',
        dateText: '',
        autoDate: true,
        logoDataUrl: '',
        logoMeta: null
    };
}

function normalizeSheetPageConfig(config, sheetName = '') {
    const base = buildDefaultSheetPageConfig(sheetName);
    const incoming = (config && typeof config === 'object') ? config : {};
    const autoDate = incoming.autoDate !== false;
    const paperSize = normalizeSheetPaperSize(incoming.paperSize || base.paperSize);
    const sizeGrid = getSheetGridByPaperSize(paperSize);
    const parsedCols = parseInt(incoming.gridCols, 10);
    const parsedRows = parseInt(incoming.gridRows, 10);
    const gridCols = Number.isFinite(parsedCols)
        ? Math.max(2, Math.min(99, parsedCols))
        : sizeGrid.cols;
    const gridRows = Number.isFinite(parsedRows)
        ? Math.max(2, Math.min(99, parsedRows))
        : sizeGrid.rows;
    const logoDataUrlRaw = String(incoming.logoDataUrl || '').trim();
    const logoDataUrl = /^data:image\/[^;]+;base64,/i.test(logoDataUrlRaw) ? logoDataUrlRaw : '';
    const baseLogoMeta = normalizeSheetLogoMeta(incoming.logoMeta);
    const dataUrlMimeType = inferSheetLogoMimeFromDataUrl(logoDataUrl);
    const logoMeta = logoDataUrl
        ? normalizeSheetLogoMeta({
            ...(baseLogoMeta || {}),
            mimeType: baseLogoMeta?.mimeType || dataUrlMimeType || SHEET_LOGO_OUTPUT_MIME,
            fileName: baseLogoMeta?.fileName || sanitizeSheetLogoFileName('logo', baseLogoMeta?.mimeType || dataUrlMimeType || SHEET_LOGO_OUTPUT_MIME)
        })
        : null;

    return {
        paperSize,
        gridCols,
        gridRows,
        legendTitle: String(incoming.legendTitle || '').trim(),
        author: String(incoming.author || '').trim(),
        project: String(incoming.project || '').trim(),
        dateText: String(incoming.dateText || '').trim(),
        autoDate,
        logoDataUrl,
        logoMeta
    };
}

function getSheetPageConfig(sheet) {
    return normalizeSheetPageConfig(sheet?.pageConfig, sheet?.name || '');
}

function sheetRowIndexToLabel(index) {
    let n = Math.max(0, parseInt(index, 10) || 0);
    let out = '';
    do {
        out = String.fromCharCode(65 + (n % 26)) + out;
        n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return out;
}

function normalizeCrossRefTag(value) {
    return String(value || '').trim().toUpperCase();
}

function normalizeCrossRefTagForLib(libKey, tagValue) {
    const baseTag = normalizeCrossRefTag(tagValue);
    if (!baseTag) return '';

    const lib = String(libKey || '').trim().toLowerCase();
    const def = BIBLIOTECA[String(libKey || '').trim()] || null;
    const tipo = String(def?.tipo || '').trim().toLowerCase();
    const nome = String(def?.nome || '').trim().toLowerCase();
    const isTemporization =
        tipo === 'bobina_temporizada' ||
        lib.includes('temporizador') ||
        lib.includes('_temp') ||
        nome.includes('temporiz');

    if (!isTemporization) return baseTag;

    const m = baseTag.match(/^(?:K|KT|D)(\d+)$/i);
    if (!m) return baseTag;
    return `D${m[1]}`;
}

function getCrossRefOffsetDatasetKeys(role) {
    return role === 'coil'
        ? { dx: 'crossRefCoilDx', dy: 'crossRefCoilDy' }
        : { dx: 'crossRefContactDx', dy: 'crossRefContactDy' };
}

function getCrossRefBasePosition(componentEl, role) {
    const width = Math.max(componentEl?.offsetWidth || 0, role === 'coil' ? 60 : 40);
    const height = Math.max(componentEl?.offsetHeight || 0, 80);
    if (role === 'cable-in') return { x: 2, y: Math.round(height * 0.5) };
    if (role === 'cable-out') return { x: width - 2, y: Math.round(height * 0.5) };
    if (role === 'coil') {
        return { x: Math.round(width * 0.5), y: height + 10 };
    }
    return { x: width + 6, y: Math.round(height * 0.45) };
}

function getCrossRefComponentOffset(componentEl, role) {
    const keys = getCrossRefOffsetDatasetKeys(role);
    const dx = parseFloat(componentEl?.dataset?.[keys.dx] || '0');
    const dy = parseFloat(componentEl?.dataset?.[keys.dy] || '0');
    return {
        dx: Number.isFinite(dx) ? dx : 0,
        dy: Number.isFinite(dy) ? dy : 0
    };
}

function setCrossRefComponentOffset(componentEl, role, dx, dy) {
    if (!componentEl) return;
    const keys = getCrossRefOffsetDatasetKeys(role);
    const nextDx = Number.isFinite(dx) ? Math.round(dx) : 0;
    const nextDy = Number.isFinite(dy) ? Math.round(dy) : 0;
    componentEl.dataset[keys.dx] = String(nextDx);
    componentEl.dataset[keys.dy] = String(nextDy);
}

function getCrossRefLayoutPreset(componentEl, role) {
    if (role !== 'coil') return 'default';
    const lib = String(componentEl?.dataset?.lib || '').trim();
    if (lib === 'iec_rele_termico') return 'left';
    if (lib === 'iec_bobina_contator' || lib === 'iec_bobina_temp' || lib.includes('bobina_contator')) return 'bottom-row';
    const def = BIBLIOTECA[lib];
    const tipo = String(def?.tipo || '').trim().toLowerCase();
    if (tipo === 'contator') return 'bottom-row';
    return 'default';
}

function getActiveSheetGeometryForCrossRef() {
    const activeSheet = getSheetById(activeProjectSheetId) || projectSheets[0] || null;
    const config = getSheetPageConfig(activeSheet);
    return getSheetGeometryByConfig(config, { preferDom: true });
}

function applyCrossRefLabelPosition(labelEl, componentEl, role) {
    if (!labelEl || !componentEl) return;
    const preset = getCrossRefLayoutPreset(componentEl, role);
    const left = parseFloat(componentEl.style.left) || 0;
    const top = parseFloat(componentEl.style.top) || 0;
    const width = Math.max(componentEl?.offsetWidth || 0, role === 'coil' ? 60 : 40);
    const height = Math.max(componentEl?.offsetHeight || 0, 80);
    let base = getCrossRefBasePosition(componentEl, role);
    if (role === 'coil' && preset === 'left') {
        base = { x: -24, y: Math.round(height * 0.5) };
    } else if (role === 'coil' && preset === 'bottom-row') {
        const geometry = getActiveSheetGeometryForCrossRef();
        if (geometry) {
            const labelHeight = Math.max(labelEl.offsetHeight || 0, 86);
            const bottomMargin = 10;
            const targetY = Math.round(geometry.mainY + geometry.mainH - bottomMargin - labelHeight);
            base = { x: Math.round(width * 0.5), y: targetY - top };
        }
    }
    const offset = getCrossRefComponentOffset(componentEl, role);
    const effectiveDx = (role === 'coil' && preset === 'bottom-row') ? 0 : offset.dx;
    labelEl.style.left = `${Math.round(base.x + effectiveDx)}px`;
    labelEl.style.top = `${Math.round(base.y + offset.dy)}px`;
}

function getCrossReferenceRoleByLib(libKey) {
    const lib = String(libKey || '').trim();
    if (!lib || CROSS_REF_EXCLUDED_LIBS.has(lib)) return '';
    if (lib === 'iec_rele_termico') return 'coil';
    const def = BIBLIOTECA[lib];
    if (lib === 'iec_segmento_cabo_in') return 'cable-in';
    if (lib === 'iec_segmento_cabo_out') return 'cable-out';
    const tipo = String(def?.tipo || '').trim().toLowerCase();
    if (CROSS_REF_COIL_TYPES.has(tipo)) return 'coil';
    if (tipo === 'contato') return 'contact';
    return '';
}

function getCrossRefModeForLib(libKey) {
    const lib = String(libKey || '').trim();
    const def = BIBLIOTECA[lib];
    return getModeByComponent(lib, def);
}

function getCrossRefContactKind(libKey) {
    const lib = String(libKey || '').trim().toLowerCase();
    if (!lib) return '--';
    if (/(^|_)na($|_)/.test(lib)) return 'NO';
    if (/(^|_)nf($|_)/.test(lib)) return 'NC';
    if (lib.includes('contator_forca')) return 'NO';
    if (lib.includes('contato_auxiliar') || lib.includes('temporizador')) return 'NO/NC';
    return '--';
}

function getSheetGeometryByConfig(pageConfig, opts = {}) {
    const config = normalizeSheetPageConfig(pageConfig || {}, '');
    const defaultGrid = getSheetGridByPaperSize(config.paperSize);
    const parsedCols = parseInt(config.gridCols, 10);
    const parsedRows = parseInt(config.gridRows, 10);
    const cols = Number.isFinite(parsedCols) ? Math.max(2, Math.min(99, parsedCols)) : defaultGrid.cols;
    const rows = Number.isFinite(parsedRows) ? Math.max(2, Math.min(99, parsedRows)) : defaultGrid.rows;

    if (opts && opts.preferDom) {
        const frame = document.querySelector('#bancada > .project-sheet-frame');
        const mainArea = frame?.querySelector('.project-sheet-main-area');
        if (frame && mainArea) {
            const mainX = (frame.offsetLeft || 0) + (mainArea.offsetLeft || 0);
            const mainY = (frame.offsetTop || 0) + (mainArea.offsetTop || 0);
            const mainW = Math.max(1, mainArea.clientWidth || mainArea.offsetWidth || 1);
            const mainH = Math.max(1, mainArea.clientHeight || mainArea.offsetHeight || 1);
            return { cols, rows, mainX, mainY, mainW, mainH };
        }
    }

    const size = getSheetPixelSizeByPaper(config.paperSize);
    const scale = getProjectSheetScaleFactor();
    const widthPx = Math.max(200, Math.round(size.widthPx * scale));
    const heightPx = Math.max(160, Math.round(size.heightPx * scale));
    const topBandPx = Math.max(22, Math.round(heightPx * 0.017));
    const leftBandPx = Math.max(36, Math.round(widthPx * 0.016));
    const footerPx = Math.max(78, Math.round(heightPx * 0.082));
    return {
        cols,
        rows,
        mainX: leftBandPx,
        mainY: topBandPx,
        mainW: Math.max(1, widthPx - leftBandPx),
        mainH: Math.max(1, heightPx - topBandPx - footerPx)
    };
}

function resolveSheetCellByPoint(point, geometry) {
    const gx = Number.isFinite(point?.x) ? point.x : 0;
    const gy = Number.isFinite(point?.y) ? point.y : 0;
    const relX = Math.min(0.999999, Math.max(0, (gx - geometry.mainX) / geometry.mainW));
    const relY = Math.min(0.999999, Math.max(0, (gy - geometry.mainY) / geometry.mainH));
    const col = Math.min(geometry.cols, Math.max(1, Math.floor(relX * geometry.cols) + 1));
    const rowIndex = Math.min(geometry.rows - 1, Math.max(0, Math.floor(relY * geometry.rows)));
    const row = sheetRowIndexToLabel(rowIndex);
    return { row, rowIndex, col };
}

function buildCrossRefRecord(libKey, tag, order, mode, point, geometry) {
    const role = getCrossReferenceRoleByLib(libKey);
    const normalizedTag = normalizeCrossRefTagForLib(libKey, tag);
    if (!role || !normalizedTag || !geometry) return null;
    const cell = resolveSheetCellByPoint(point, geometry);
    return {
        lib: libKey,
        role,
        tag: normalizedTag,
        kind: role === 'contact'
            ? getCrossRefContactKind(libKey)
            : (role === 'cable-in' ? 'IN' : (role === 'cable-out' ? 'OUT' : '')),
        mode: String(mode || 'simbologia'),
        order: Number.isFinite(order) && order > 0 ? order : 1,
        row: cell.row,
        rowIndex: cell.rowIndex,
        col: cell.col,
        location: `${Number.isFinite(order) && order > 0 ? order : 1}-${cell.row}${cell.col}`
    };
}

function buildCrossRefRecordFromLiveComponent(componentEl, order, config) {
    if (!componentEl) return null;
    const lib = componentEl.dataset.lib || '';
    const role = getCrossReferenceRoleByLib(lib);
    if (!role) return null;
    const left = parseFloat(componentEl.style.left) || 0;
    const top = parseFloat(componentEl.style.top) || 0;
    const width = Math.max(componentEl.offsetWidth || 0, role === 'coil' ? 60 : 40);
    const height = Math.max(componentEl.offsetHeight || 0, 80);
    const geometry = getSheetGeometryByConfig(config, { preferDom: true });
    const mode = getCrossRefModeForLib(lib);
    return buildCrossRefRecord(
        lib,
        componentEl.dataset.tag || '',
        order,
        mode,
        { x: left + (width / 2), y: top + (height / 2) },
        geometry
    );
}

function buildCrossRefRecordFromSnapshotComponent(componentData, order, config) {
    if (!componentData) return null;
    const lib = String(componentData.lib || '');
    const role = getCrossReferenceRoleByLib(lib);
    if (!role) return null;
    const left = parseFloat(componentData.left) || 0;
    const top = parseFloat(componentData.top) || 0;
    const isCableSegment = role === 'cable-in' || role === 'cable-out';
    const width = role === 'coil' ? 60 : (isCableSegment ? 60 : 40);
    const height = isCableSegment ? 40 : 80;
    const geometry = getSheetGeometryByConfig(config);
    const mode = String(componentData.mode || getCrossRefModeForLib(lib) || 'simbologia');
    return buildCrossRefRecord(
        lib,
        componentData.tag || '',
        order,
        mode,
        { x: left + (width / 2), y: top + (height / 2) },
        geometry
    );
}

function sortCrossRefRecords(records = []) {
    return [...records].sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        if (a.rowIndex !== b.rowIndex) return a.rowIndex - b.rowIndex;
        if (a.col !== b.col) return a.col - b.col;
        return String(a.lib || '').localeCompare(String(b.lib || ''));
    });
}

function collectCrossReferenceRecordsForProject() {
    const activeBancada = document.getElementById('bancada');
    if (!projectSheets.length) {
        const fallbackConfig = buildDefaultSheetPageConfig('Folha');
        const order = 1;
        return Array.from(activeBancada?.querySelectorAll('.component') || [])
            .map(comp => buildCrossRefRecordFromLiveComponent(comp, order, fallbackConfig))
            .filter(Boolean);
    }

    const records = [];
    projectSheets.forEach((sheet, idx) => {
        const order = Number.isFinite(sheet?.order) && sheet.order > 0 ? sheet.order : (idx + 1);
        const config = getSheetPageConfig(sheet);
        if (sheet?.id === activeProjectSheetId) {
            Array.from(activeBancada?.querySelectorAll('.component') || [])
                .forEach(comp => {
                    const rec = buildCrossRefRecordFromLiveComponent(comp, order, config);
                    if (rec) records.push(rec);
                });
            return;
        }

        const snapshotComponents = Array.isArray(sheet?.snapshot?.componentes)
            ? sheet.snapshot.componentes
            : [];
        snapshotComponents.forEach(componentData => {
            const rec = buildCrossRefRecordFromSnapshotComponent(componentData, order, config);
            if (rec) records.push(rec);
        });
    });

    return records;
}

function toUniqueLocationList(records = [], limit = 5) {
    const unique = [];
    const seen = new Set();
    sortCrossRefRecords(records).forEach(rec => {
        const loc = String(rec?.location || '').trim();
        if (!loc || seen.has(loc)) return;
        seen.add(loc);
        unique.push(loc);
    });
    if (unique.length <= limit) return unique.join(', ');
    const base = unique.slice(0, limit).join(', ');
    return `${base} +${unique.length - limit}`;
}

function getCrossRefItems(records = [], limit = Infinity) {
    const items = [];
    sortCrossRefRecords(records).forEach(rec => {
        const loc = String(rec?.location || '').trim();
        const kind = String(rec?.kind || '--').trim() || '--';
        if (!loc) return;
        items.push({ kind, loc });
    });
    if (!Number.isFinite(limit) || limit < 1) return items;
    return items.slice(0, Math.max(1, Math.floor(limit)));
}

function splitCrossRefItemsByType(items = [], maxPerSide = 6) {
    const no = [];
    const nc = [];
    const pushValue = (arr, loc) => { if (loc) arr.push(loc); };

    items.forEach(item => {
        const kind = String(item?.kind || '').trim().toUpperCase();
        const loc = String(item?.loc || '').trim();
        if (!loc) return;
        if (kind === 'NO') {
            pushValue(no, loc);
            return;
        }
        if (kind === 'NC') {
            pushValue(nc, loc);
            return;
        }
        if (kind === 'NO/NC') {
            pushValue(no, loc);
            pushValue(nc, loc);
            return;
        }
        pushValue(no, loc);
    });

    const limit = Math.max(1, Math.floor(Number.isFinite(maxPerSide) ? maxPerSide : 6));
    return {
        no: no.slice(0, limit),
        nc: nc.slice(0, limit),
        noExtra: Math.max(0, no.length - limit),
        ncExtra: Math.max(0, nc.length - limit)
    };
}

function formatContactReferenceText(records = []) {
    const locs = toUniqueLocationList(records, 2);
    return `(${locs || '-'})`;
}

function formatCableReferenceText(records = [], label = '') {
    const locs = toUniqueLocationList(records, 2);
    return `${label || 'PAR'} ${locs || '-'}`;
}

function renderCrossReferencesForActiveSheet() {
    const bancada = document.getElementById('bancada');
    if (!bancada) return;

    Array.from(bancada.querySelectorAll('.component > .cross-ref-label')).forEach(el => el.remove());

    const mode = String(activeWorkspaceMode || menuMode || 'simbologia');
    const projectRecords = collectCrossReferenceRecordsForProject().filter(rec => rec.mode === mode);
    if (!projectRecords.length) return;

    const contactsByTag = new Map();
    const coilsByTag = new Map();
    const cableInByTag = new Map();
    const cableOutByTag = new Map();
    projectRecords.forEach(rec => {
        let map = null;
        if (rec.role === 'coil') map = coilsByTag;
        else if (rec.role === 'contact') map = contactsByTag;
        else if (rec.role === 'cable-in') map = cableInByTag;
        else if (rec.role === 'cable-out') map = cableOutByTag;
        if (!map) return;
        if (!map.has(rec.tag)) map.set(rec.tag, []);
        map.get(rec.tag).push(rec);
    });

    const getCrossRefClassByRole = (role) => {
        if (role === 'coil' || role === 'contact') return role;
        if (role === 'cable-in' || role === 'cable-out') return role;
        return 'contact';
    };

    Array.from(bancada.querySelectorAll('.component')).forEach(componentEl => {
        const lib = componentEl.dataset.lib || '';
        const role = getCrossReferenceRoleByLib(lib);
        const tag = normalizeCrossRefTagForLib(lib, componentEl.dataset.tag || '');
        if (!role || !tag) return;

        const label = document.createElement('div');
        label.className = `cross-ref-label ${getCrossRefClassByRole(role)}`;
        if (role === 'coil') {
            const contacts = contactsByTag.get(tag) || [];
            const allItems = getCrossRefItems(contacts);
            const grouped = splitCrossRefItemsByType(allItems, 6);

            const titleEl = document.createElement('div');
            titleEl.className = 'cross-ref-master-tag';
            titleEl.textContent = tag;
            label.appendChild(titleEl);

            const tableEl = document.createElement('div');
            tableEl.className = 'cross-ref-master-table';

            const makeColumn = (title, values, extra) => {
                const colEl = document.createElement('div');
                colEl.className = 'cross-ref-master-col';

                const headEl = document.createElement('div');
                headEl.className = 'cross-ref-master-col-head';
                headEl.textContent = title;
                colEl.appendChild(headEl);

                const valuesEl = document.createElement('div');
                valuesEl.className = 'cross-ref-master-col-values';
                if (values.length) {
                    values.forEach(loc => {
                        const valueEl = document.createElement('div');
                        valueEl.className = 'cross-ref-master-col-value';
                        valueEl.textContent = loc;
                        valuesEl.appendChild(valueEl);
                    });
                } else {
                    const valueEl = document.createElement('div');
                    valueEl.className = 'cross-ref-master-col-value';
                    valueEl.textContent = '-';
                    valuesEl.appendChild(valueEl);
                }

                if (extra > 0) {
                    const moreEl = document.createElement('div');
                    moreEl.className = 'cross-ref-master-col-value more';
                    moreEl.textContent = `+${extra}`;
                    valuesEl.appendChild(moreEl);
                }

                colEl.appendChild(valuesEl);
                return colEl;
            };

            tableEl.appendChild(makeColumn('NO', grouped.no, grouped.noExtra));
            tableEl.appendChild(makeColumn('NC', grouped.nc, grouped.ncExtra));
            label.appendChild(tableEl);
        } else if (role === 'contact') {
            const coils = coilsByTag.get(tag) || [];
            label.textContent = formatContactReferenceText(coils);
        } else if (role === 'cable-in') {
            const outs = cableOutByTag.get(tag) || [];
            label.textContent = formatCableReferenceText(outs, 'OUT');
        } else if (role === 'cable-out') {
            const ins = cableInByTag.get(tag) || [];
            label.textContent = formatCableReferenceText(ins, 'IN');
        }
        componentEl.appendChild(label);
        applyCrossRefLabelPosition(label, componentEl, role);
        label.addEventListener('pointerdown', (e) => beginCrossRefLabelDrag(e, label, componentEl, role));
        label.addEventListener('dblclick', (e) => e.stopPropagation());
    });
}

function scheduleCrossReferenceRefresh() {
    if (crossRefRefreshTimer) {
        window.clearTimeout(crossRefRefreshTimer);
    }
    crossRefRefreshTimer = window.setTimeout(() => {
        crossRefRefreshTimer = null;
        renderCrossReferencesForActiveSheet();
    }, 40);
}

function endCrossRefLabelDrag(commitHistory = true) {
    if (!crossRefDragState) return;
    window.removeEventListener('pointermove', onCrossRefLabelPointerMove);
    window.removeEventListener('pointerup', onCrossRefLabelPointerUp);
    window.removeEventListener('pointercancel', onCrossRefLabelPointerUp);
    const moved = !!crossRefDragState.moved;
    crossRefDragState = null;
    if (moved && commitHistory) {
        scheduleHistoryCheckpoint('cross_ref_drag');
    }
}

function onCrossRefLabelPointerMove(e) {
    if (!crossRefDragState) return;
    const drag = crossRefDragState;
    const dx = (e.clientX - drag.startClientX) / zoomLevel;
    const dy = (e.clientY - drag.startClientY) / zoomLevel;
    setCrossRefComponentOffset(drag.componentEl, drag.role, drag.startOffset.dx + dx, drag.startOffset.dy + dy);
    applyCrossRefLabelPosition(drag.labelEl, drag.componentEl, drag.role);
    drag.moved = true;
}

function onCrossRefLabelPointerUp() {
    endCrossRefLabelDrag(true);
}

function beginCrossRefLabelDrag(e, labelEl, componentEl, role) {
    if (!labelEl || !componentEl) return;
    if (simulando || ferramentaAtiva !== 'select') return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    endCrossRefLabelDrag(false);
    crossRefDragState = {
        labelEl,
        componentEl,
        role,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startOffset: getCrossRefComponentOffset(componentEl, role),
        moved: false
    };

    window.addEventListener('pointermove', onCrossRefLabelPointerMove);
    window.addEventListener('pointerup', onCrossRefLabelPointerUp);
    window.addEventListener('pointercancel', onCrossRefLabelPointerUp);
}

function createProjectSheetFrameElement() {
    const frame = document.createElement('div');
    frame.className = 'project-sheet-frame';

    const corner = document.createElement('div');
    corner.className = 'project-sheet-corner';
    corner.title = 'Engenharia: ajustar escala global da folha';
    corner.addEventListener('click', onProjectSheetCornerClick);
    frame.appendChild(corner);

    const topScale = document.createElement('div');
    topScale.className = 'project-sheet-top-scale';
    frame.appendChild(topScale);

    const leftScale = document.createElement('div');
    leftScale.className = 'project-sheet-left-scale';
    frame.appendChild(leftScale);

    const mainArea = document.createElement('div');
    mainArea.className = 'project-sheet-main-area';
    frame.appendChild(mainArea);

    const footer = document.createElement('div');
    footer.className = 'project-sheet-footer';
    footer.innerHTML = `
        <div class="project-sheet-footer-left">
            <div class="project-sheet-logo-slot">
                <img class="project-sheet-logo-img" alt="Logo">
                <span class="project-sheet-logo-text">LOGO</span>
            </div>
            <div class="project-sheet-footer-left-meta">
                <div class="project-sheet-footer-row">Autor : <span class="project-sheet-author-value"></span></div>
                <div class="project-sheet-footer-row">Data : <span class="project-sheet-date-value">${formatProjectSheetDate()}</span></div>
            </div>
        </div>
        <div class="project-sheet-footer-center"><span class="project-sheet-title-value"></span></div>
        <div class="project-sheet-footer-right">
            <div class="project-sheet-footer-row">Projeto : <span class="project-sheet-project-value"></span></div>
            <div class="project-sheet-footer-row">Folha : <span class="project-sheet-page-value">1/1</span></div>
        </div>
    `;
    frame.appendChild(footer);

    return frame;
}

function ensureProjectSheetFrame(bancada) {
    if (!bancada) return;
    if (bancada.querySelector(':scope > .project-sheet-frame')) return;
    bancada.prepend(createProjectSheetFrameElement());
}

function updateProjectSheetFrameMeta() {
    const total = Math.max(projectSheets.length || 0, 1);
    const activeSheet = getSheetById(activeProjectSheetId) || projectSheets[0] || null;
    const activeOrder = Number.isFinite(activeSheet?.order) && activeSheet.order > 0 ? activeSheet.order : 1;
    const pageText = `${activeOrder}/${total}`;
    const config = getSheetPageConfig(activeSheet);
    const defaultGrid = getSheetGridByPaperSize(config.paperSize);
    const parsedCols = parseInt(config.gridCols, 10);
    const parsedRows = parseInt(config.gridRows, 10);
    const grid = {
        cols: Number.isFinite(parsedCols) ? Math.max(2, Math.min(99, parsedCols)) : defaultGrid.cols,
        rows: Number.isFinite(parsedRows) ? Math.max(2, Math.min(99, parsedRows)) : defaultGrid.rows
    };
    const size = getSheetPixelSizeByPaper(config.paperSize);
    const sheetScaleFactor = getProjectSheetScaleFactor();
    const scaledWidthPx = Math.max(200, Math.round(size.widthPx * sheetScaleFactor));
    const scaledHeightPx = Math.max(160, Math.round(size.heightPx * sheetScaleFactor));
    const dateText = config.autoDate ? formatProjectSheetDate() : (config.dateText || formatProjectSheetDate());
    const titleText = config.legendTitle || String(activeSheet?.name || '').trim() || 'Folha';
    const topBandPx = Math.max(22, Math.round(scaledHeightPx * 0.017));
    const leftBandPx = Math.max(36, Math.round(scaledWidthPx * 0.016));
    const footerPx = Math.max(78, Math.round(scaledHeightPx * 0.082));

    document.querySelectorAll('.project-sheet-frame').forEach(frame => {
        frame.style.width = `${scaledWidthPx}px`;
        frame.style.height = `${scaledHeightPx}px`;
        frame.style.setProperty('--project-sheet-top-size', `${topBandPx}px`);
        frame.style.setProperty('--project-sheet-left-size', `${leftBandPx}px`);
        frame.style.setProperty('--project-sheet-footer-size', `${footerPx}px`);
        frame.classList.toggle('sheet-engineering-target-active', engineeringMode && engineeringSheetScaleTargetActive);

        const topScale = frame.querySelector('.project-sheet-top-scale');
        const leftScale = frame.querySelector('.project-sheet-left-scale');
        if (topScale) {
            topScale.innerHTML = '';
            topScale.style.gridTemplateColumns = `repeat(${grid.cols}, 1fr)`;
            for (let n = 1; n <= grid.cols; n++) {
                const cell = document.createElement('div');
                cell.className = 'project-sheet-top-cell';
                cell.textContent = String(n);
                topScale.appendChild(cell);
            }
        }
        if (leftScale) {
            leftScale.innerHTML = '';
            leftScale.style.gridTemplateRows = `repeat(${grid.rows}, 1fr)`;
            for (let i = 0; i < grid.rows; i++) {
                const cell = document.createElement('div');
                cell.className = 'project-sheet-left-cell';
                cell.textContent = sheetRowIndexToLabel(i);
                leftScale.appendChild(cell);
            }
        }

        const authorEl = frame.querySelector('.project-sheet-author-value');
        const projectEl = frame.querySelector('.project-sheet-project-value');
        const titleEl = frame.querySelector('.project-sheet-title-value');
        const dateEl = frame.querySelector('.project-sheet-date-value');
        const pageEl = frame.querySelector('.project-sheet-page-value');
        const logoImg = frame.querySelector('.project-sheet-logo-img');
        const logoText = frame.querySelector('.project-sheet-logo-text');
        if (authorEl) authorEl.textContent = config.author;
        if (projectEl) projectEl.textContent = config.project;
        if (titleEl) titleEl.textContent = titleText;
        if (dateEl) dateEl.textContent = dateText;
        if (pageEl) pageEl.textContent = pageText;
        if (logoImg) {
            if (config.logoDataUrl) {
                logoImg.src = config.logoDataUrl;
                logoImg.style.display = 'block';
                if (logoText) logoText.style.display = 'none';
            } else {
                logoImg.removeAttribute('src');
                logoImg.style.display = 'none';
                if (logoText) logoText.style.display = 'inline';
            }
        }
    });
    scheduleCrossReferenceRefresh();
}

function initModeWorkspaces() {
    const zoomContainer = document.getElementById('zoom-container');
    const wire = document.getElementById('wire-layer');
    let drawingBackground = document.getElementById('drawing-background-layer');
    let panelDrawing = document.getElementById('panel-drawing-layer');
    let wireTop = document.getElementById('wire-top-layer');
    const bancada = document.getElementById('bancada');
    if (!zoomContainer || !wire || !bancada) return;
    if (!drawingBackground) {
        drawingBackground = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        drawingBackground.setAttribute('id', 'drawing-background-layer');
        drawingBackground.setAttribute('width', '5000');
        drawingBackground.setAttribute('height', '5000');
        drawingBackground.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }
    if (!panelDrawing) {
        panelDrawing = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        panelDrawing.setAttribute('id', 'panel-drawing-layer');
        panelDrawing.setAttribute('width', '5000');
        panelDrawing.setAttribute('height', '5000');
        panelDrawing.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }
    if (!wireTop) {
        wireTop = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        wireTop.setAttribute('id', 'wire-top-layer');
        wireTop.setAttribute('width', '5000');
        wireTop.setAttribute('height', '5000');
        wireTop.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }

    const wsSimb = document.createElement('div');
    wsSimb.className = 'mode-workspace';
    wsSimb.dataset.mode = 'simbologia';
    drawingBackground.classList.add('mode-drawing-background-layer');
    wire.classList.add('mode-wire-layer');
    panelDrawing.classList.add('mode-panel-drawing-layer');
    wireTop.classList.add('mode-wire-top-layer');
    bancada.classList.add('mode-bancada');
    bancada.insertBefore(drawingBackground, bancada.firstChild);
    wsSimb.appendChild(wire);
    wsSimb.appendChild(bancada);
    wsSimb.appendChild(panelDrawing);
    wsSimb.appendChild(wireTop);
    zoomContainer.appendChild(wsSimb);

    const ws2d = createWorkspace('2d');
    ws2d.style.display = 'none';
    zoomContainer.appendChild(ws2d);

    modeWorkspaces.simbologia = wsSimb;
    modeWorkspaces['2d'] = ws2d;
    ensureProjectSheetFrame(wsSimb.querySelector('.mode-bancada'));
    ensureProjectSheetFrame(ws2d.querySelector('.mode-bancada'));

    if (typeof listaFios !== 'undefined') {
        wiresByMode.simbologia = listaFios;
        wiresByMode['2d'] = [];
    }

    moveExistingComponentsToProperWorkspace();
    initFrontalBaseLayerSync();
}

function createWorkspace(mode) {
    const ws = document.createElement('div');
    ws.className = 'mode-workspace';
    ws.dataset.mode = mode;

    const svgBackground = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgBackground.setAttribute('class', 'mode-drawing-background-layer');
    svgBackground.setAttribute('width', '5000');
    svgBackground.setAttribute('height', '5000');
    svgBackground.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'mode-wire-layer');
    svg.setAttribute('width', '5000');
    svg.setAttribute('height', '5000');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    const svgPanel = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgPanel.setAttribute('class', 'mode-panel-drawing-layer');
    svgPanel.setAttribute('width', '5000');
    svgPanel.setAttribute('height', '5000');
    svgPanel.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    const svgTop = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgTop.setAttribute('class', 'mode-wire-top-layer');
    svgTop.setAttribute('width', '5000');
    svgTop.setAttribute('height', '5000');
    svgTop.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    const bancada = document.createElement('div');
    bancada.className = 'workbench mode-bancada';
    ensureProjectSheetFrame(bancada);

    bancada.insertBefore(svgBackground, bancada.firstChild);
    ws.appendChild(svg);
    ws.appendChild(bancada);
    ws.appendChild(svgPanel);
    ws.appendChild(svgTop);
    return ws;
}

function switchWorkspace(mode) {
    const target = mode === '2d' ? '2d' : 'simbologia';
    if (!modeWorkspaces[target]) return;

    if (typeof cancelarFio === 'function') cancelarFio();
    const prev = activeWorkspaceMode;
    if (prev) storeActiveSheetViewportStateForMode(prev);
    if (typeof listaFios !== 'undefined' && prev) wiresByMode[prev] = listaFios;

    Object.entries(modeWorkspaces).forEach(([modeKey, ws]) => {
        if (!ws) return;
        const drawingBackground = ws.querySelector('.mode-drawing-background-layer');
        const wire = ws.querySelector('.mode-wire-layer') || ws.querySelector('svg');
        const panelDrawing = ws.querySelector('.mode-panel-drawing-layer');
        const wireTop = ws.querySelector('.mode-wire-top-layer');
        const bancada = ws.querySelector('.mode-bancada') || ws.querySelector('.workbench');
        if (drawingBackground) drawingBackground.removeAttribute('id');
        if (wire) wire.removeAttribute('id');
        if (panelDrawing) panelDrawing.removeAttribute('id');
        if (wireTop) wireTop.removeAttribute('id');
        if (bancada) bancada.removeAttribute('id');
        ws.style.display = modeKey === target ? 'block' : 'none';
    });

    const nextWs = modeWorkspaces[target];
    const nextDrawingBackground = nextWs?.querySelector('.mode-drawing-background-layer');
    const nextWire = nextWs?.querySelector('.mode-wire-layer') || nextWs?.querySelector('svg');
    const nextPanelDrawing = nextWs?.querySelector('.mode-panel-drawing-layer');
    const nextWireTop = nextWs?.querySelector('.mode-wire-top-layer');
    const nextBancada = nextWs?.querySelector('.mode-bancada') || nextWs?.querySelector('.workbench');
    if (nextDrawingBackground) nextDrawingBackground.id = 'drawing-background-layer';
    if (nextWire) nextWire.id = 'wire-layer';
    if (nextPanelDrawing) nextPanelDrawing.id = 'panel-drawing-layer';
    if (nextWireTop) nextWireTop.id = 'wire-top-layer';
    if (nextBancada) nextBancada.id = 'bancada';

    activeWorkspaceMode = target;
    document.documentElement.dataset.workspaceMode = target;
    clearComponentSelection();
    if (typeof window.clearWireSelection === 'function') window.clearWireSelection();
    clearDrawingSelection();

    if (prev !== target && !suppressWorkspaceAutoZoom) {
        restoreActiveSheetViewportStateForMode(target);
    }

    if (typeof listaFios !== 'undefined') {
        listaFios = wiresByMode[target] || [];
        wiresByMode[target] = listaFios;
    }
    if (prev !== target && target === '2d' && typeof window.setEspessuraFio === 'function') {
        window.setEspessuraFio(2, { preserveTool: true });
    }
    // Reaplica o cursor/ferramenta na bancada ativa apos troca de workspace.
    ativarFerramenta(ferramentaAtiva);
    if (typeof window.rebindWireEndpoints === 'function') window.rebindWireEndpoints();
    enforceComponentVisibilityForMode(target);
    if (typeof markWireIndexDirty === 'function') markWireIndexDirty();
    if (typeof renderWireJunctions === 'function') renderWireJunctions();
    scheduleCrossReferenceRefresh();
}

function getModeByComponent(key, item) {
    const chave = (key || '').toLowerCase();
    const categoria = (item?.cat || '').toLowerCase();
    if (chave.startsWith('real_') || categoria.includes('reais')) return '2d';
    return 'simbologia';
}

function getWorkspaceBancada(mode) {
    return modeWorkspaces[mode]?.querySelector('.mode-bancada') || null;
}

function moveExistingComponentsToProperWorkspace() {
    const wsSimbBancada = getWorkspaceBancada('simbologia');
    const ws2dBancada = getWorkspaceBancada('2d');
    if (!wsSimbBancada || !ws2dBancada) return;

    const allComponents = Array.from(document.querySelectorAll('.mode-workspace .component'));
    allComponents.forEach(comp => {
        const lib = comp.dataset.lib || '';
        const def = BIBLIOTECA[lib];
        const targetMode = getModeByComponent(lib, def);
        const targetBancada = targetMode === '2d' ? ws2dBancada : wsSimbBancada;
        if (comp.parentElement !== targetBancada) {
            targetBancada.appendChild(comp);
        }
    });
}

function enforceComponentVisibilityForMode(mode) {
    const bancada = document.getElementById('bancada');
    if (!bancada) return;
    const comps = Array.from(bancada.querySelectorAll('.component'));
    comps.forEach(comp => {
        const lib = comp.dataset.lib || '';
        const def = BIBLIOTECA[lib];
        const compMode = getModeByComponent(lib, def);
        comp.style.display = compMode === mode ? '' : 'none';
    });
}

function componenteNoModoAtual(key, item) {
    if (item?.hiddenInMenu) return false;
    const chave = (key || '').toLowerCase();
    const categoria = (item?.cat || '').toLowerCase();

    if (menuMode === '2d') {
        return chave.startsWith('real_') || categoria.includes('reais');
    }

    return chave.startsWith('iec_') || categoria.includes('iec');
}

function setMenuMode(mode) {
    menuMode = mode === '2d' ? '2d' : 'simbologia';
    switchWorkspace(menuMode);

    const tabSimbologia = document.getElementById('tab-simbologia');
    const tab2d = document.getElementById('tab-2d');
    if (tabSimbologia) tabSimbologia.classList.toggle('active', menuMode === 'simbologia');
    if (tab2d) tab2d.classList.toggle('active', menuMode === '2d');

    gerarMenus();
}

function toggleCategorias() {
    const contents = Array.from(document.querySelectorAll('#menu-container .cat-content'));
    if (!contents.length) return;
    const shouldOpen = contents.some(c => !c.classList.contains('open'));
    categoriasAbertas = shouldOpen;
    contents.forEach(c => setMenuCategoryOpen(c, shouldOpen));
    syncCategoriasButtonText();
}

function syncCategoriasButtonText() {
    const btn = document.getElementById('btn-toggle-cats');
    if (!btn) return;
    const someClosed = Array.from(document.querySelectorAll('#menu-container .cat-content'))
        .some(c => !c.classList.contains('open'));
    btn.innerHTML = someClosed
        ? '<i class="fa-solid fa-expand"></i><span>Expandir tudo</span>'
        : '<i class="fa-solid fa-compress"></i><span>Recolher tudo</span>';
    btn.title = someClosed ? 'Expandir todas as classes' : 'Recolher todas as classes';
}
function buildEmptyActiveSheetSnapshot() {
    return {
        version: 2,
        menuMode: (typeof menuMode !== 'undefined') ? menuMode : 'simbologia',
        componentes: [],
        fiosByMode: { simbologia: [], '2d': [] },
        desenhosByMode: { simbologia: [], '2d': [] }
    };
}

function getCurrentSheetViewportState() {
    return {
        zoomLevel: Number.isFinite(zoomLevel) ? zoomLevel : 1,
        panX: Number.isFinite(panX) ? panX : 0,
        panY: Number.isFinite(panY) ? panY : 0
    };
}

function normalizeSheetViewportState(viewState) {
    if (!viewState || typeof viewState !== 'object') return null;
    const z = parseFloat(viewState.zoomLevel);
    if (!Number.isFinite(z)) return null;
    const x = parseFloat(viewState.panX);
    const y = parseFloat(viewState.panY);
    return {
        zoomLevel: Math.min(Math.max(MIN_ZOOM_LEVEL, z), MAX_ZOOM_LEVEL),
        panX: Number.isFinite(x) ? x : 0,
        panY: Number.isFinite(y) ? y : 0
    };
}

function buildEmptySheetViewportStatesByMode() {
    return {
        simbologia: null,
        '2d': null
    };
}

function normalizeSheetViewportStatesByMode(viewStatesByMode) {
    const normalized = buildEmptySheetViewportStatesByMode();
    if (!viewStatesByMode || typeof viewStatesByMode !== 'object') return normalized;
    const simbologia = normalizeSheetViewportState(viewStatesByMode.simbologia);
    const mode2d = normalizeSheetViewportState(viewStatesByMode['2d']);
    if (simbologia) normalized.simbologia = simbologia;
    if (mode2d) normalized['2d'] = mode2d;
    return normalized;
}

function setSheetViewportStateForMode(sheet, mode, viewState = getCurrentSheetViewportState()) {
    if (!sheet || typeof sheet !== 'object') return null;
    const normalizedMode = mode === '2d' ? '2d' : 'simbologia';
    const normalizedState = normalizeSheetViewportState(viewState);
    if (!normalizedState) return null;
    sheet.viewStatesByMode = normalizeSheetViewportStatesByMode(sheet.viewStatesByMode);
    sheet.viewStatesByMode[normalizedMode] = normalizedState;
    return normalizedState;
}

function getSheetViewportStateForMode(sheet, mode) {
    if (!sheet || typeof sheet !== 'object') return null;
    const normalizedMode = mode === '2d' ? '2d' : 'simbologia';
    const byMode = normalizeSheetViewportState(sheet?.viewStatesByMode?.[normalizedMode]);
    if (byMode) return byMode;

    const legacyState = normalizeSheetViewportState(sheet.viewState);
    const snapshotMode = sheet?.snapshot?.menuMode === '2d' ? '2d' : 'simbologia';
    if (legacyState && snapshotMode === normalizedMode) return legacyState;
    return null;
}

function storeActiveSheetViewportStateForMode(mode = activeWorkspaceMode) {
    const sheet = getSheetById(activeProjectSheetId);
    if (!sheet) return null;
    const currentState = getCurrentSheetViewportState();
    sheet.viewState = currentState;
    return setSheetViewportStateForMode(sheet, mode, currentState);
}

function restoreActiveSheetViewportStateForMode(mode = activeWorkspaceMode, opts = {}) {
    const normalizedMode = mode === '2d' ? '2d' : 'simbologia';
    const sheet = opts?.sheet || getSheetById(activeProjectSheetId);
    const resetIfMissing = opts?.resetIfMissing !== false;
    const targetState = getSheetViewportStateForMode(sheet, normalizedMode);
    if (targetState) return applySheetViewportState(targetState);
    if (resetIfMissing) {
        resetView();
        return true;
    }
    return false;
}

function applySheetViewportState(viewState) {
    const normalized = normalizeSheetViewportState(viewState);
    if (!normalized) return false;
    zoomLevel = normalized.zoomLevel;
    panX = normalized.panX;
    panY = normalized.panY;
    updateTransform();
    const zd = document.getElementById('zoom-display');
    if (zd) zd.innerText = Math.round(zoomLevel * 100) + '%';
    return true;
}

function cloneSheetSnapshot(snapshot) {
    try {
        return JSON.parse(JSON.stringify(snapshot || buildEmptyActiveSheetSnapshot()));
    } catch (_) {
        return buildEmptyActiveSheetSnapshot();
    }
}

function getSheetById(sheetId) {
    return projectSheets.find(s => s && s.id === sheetId) || null;
}

function createProjectSheetId() {
    let next = '';
    do {
        next = `S${projectSheetIdSeed++}`;
    } while (getSheetById(next));
    return next;
}

function getNextProjectSheetName() {
    const used = new Set(projectSheets.map(s => String(s?.name || '').trim().toUpperCase()));
    let n = 1;
    while (used.has(`FOLHA ${n}`)) n++;
    return `Folha ${n}`;
}

function normalizeProjectSheetOrder() {
    projectSheets.forEach((sheet, idx) => {
        if (!sheet) return;
        sheet.order = idx + 1;
    });
}

function getProjectSheetDisplayName(sheet) {
    const ord = Number.isFinite(sheet?.order) ? sheet.order : 0;
    const ordTxt = ord > 0 ? `${ord}. ` : '';
    return `${ordTxt}${sheet?.name || 'Folha'}`;
}

function captureActiveSheetSnapshot() {
    const sheet = getSheetById(activeProjectSheetId);
    if (!sheet) return;
    if (typeof window.restoreConfiguredWireColors === 'function') {
        try { window.restoreConfiguredWireColors(); } catch (_) { }
    }
    if (typeof window.exportActiveSheetSnapshot === 'function') {
        sheet.snapshot = cloneSheetSnapshot(window.exportActiveSheetSnapshot());
        storeActiveSheetViewportStateForMode();
        return;
    }
    if (typeof window.exportProjectSnapshot === 'function') {
        sheet.snapshot = cloneSheetSnapshot(window.exportProjectSnapshot());
        storeActiveSheetViewportStateForMode();
        return;
    }
    sheet.snapshot = cloneSheetSnapshot(sheet.snapshot);
    storeActiveSheetViewportStateForMode();
}

function renderProjectSheetTabs() {
    const tabsHost = document.getElementById('sheet-tabs');
    if (!tabsHost) return;
    normalizeProjectSheetOrder();
    tabsHost.innerHTML = '';

    projectSheets.forEach(sheet => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `sheet-tab${sheet.id === activeProjectSheetId ? ' active' : ''}`;
        btn.textContent = getProjectSheetDisplayName(sheet);
        btn.title = 'Clique para abrir. Duplo clique para renomear.';
        btn.addEventListener('click', () => activateProjectSheet(sheet.id));
        btn.addEventListener('dblclick', (e) => {
            e.preventDefault();
            const atual = String(sheet.name || '').trim() || 'Folha';
            const novo = prompt('Nome da folha:', atual);
            if (novo === null) return;
            const txt = String(novo || '').trim();
            if (!txt) return;
            sheet.name = txt;
            renderProjectSheetTabs();
            scheduleHistoryCheckpoint('sheet_rename');
        });
        tabsHost.appendChild(btn);
    });
    updateSheetActionButtons();
    updateProjectSheetFrameMeta();
}

function updateSheetActionButtons() {
    const configBtn = document.getElementById('sheet-config-btn');
    const renameBtn = document.getElementById('sheet-rename-btn');
    const deleteBtn = document.getElementById('sheet-delete-btn');
    const hasActive = !!getSheetById(activeProjectSheetId);
    if (configBtn) configBtn.disabled = !hasActive;
    if (renameBtn) renameBtn.disabled = !hasActive;
    if (deleteBtn) deleteBtn.disabled = !hasActive || projectSheets.length <= 1;
}

function refreshSheetConfigModalGridPreview(forceFill = true) {
    const sizeInput = document.getElementById('sheet-config-size');
    const colsInput = document.getElementById('sheet-config-cols');
    const rowsInput = document.getElementById('sheet-config-rows');
    if (!sizeInput || !colsInput || !rowsInput) return;
    const size = normalizeSheetPaperSize(sizeInput.value);
    const grid = getSheetGridByPaperSize(size);
    const hasCols = Number.isFinite(parseInt(colsInput.value, 10));
    const hasRows = Number.isFinite(parseInt(rowsInput.value, 10));
    if (forceFill || !hasCols) colsInput.value = `${grid.cols}`;
    if (forceFill || !hasRows) rowsInput.value = `${grid.rows}`;
}

function syncSheetConfigModalDateState() {
    const autoDateInput = document.getElementById('sheet-config-auto-date');
    const dateInput = document.getElementById('sheet-config-date');
    if (!autoDateInput || !dateInput) return;
    dateInput.disabled = !!autoDateInput.checked;
}

function setSheetConfigLogoPreview(dataUrl = '') {
    const preview = document.getElementById('sheet-config-logo-preview');
    const img = document.getElementById('sheet-config-logo-img');
    const empty = document.getElementById('sheet-config-logo-empty');
    if (!preview || !img || !empty) return;
    const hasImage = !!String(dataUrl || '').trim();
    preview.classList.toggle('has-image', hasImage);
    if (hasImage) {
        img.src = dataUrl;
        img.style.display = 'block';
        empty.style.display = 'none';
    } else {
        img.removeAttribute('src');
        img.style.display = 'none';
        empty.style.display = 'inline';
    }
}

function openProjectSheetConfigModal() {
    const modal = document.getElementById('sheet-config-modal');
    const sheet = getSheetById(activeProjectSheetId);
    if (!modal || !sheet) return;
    const config = getSheetPageConfig(sheet);

    const sizeInput = document.getElementById('sheet-config-size');
    const titleInput = document.getElementById('sheet-config-title');
    const authorInput = document.getElementById('sheet-config-author');
    const projectInput = document.getElementById('sheet-config-project');
    const dateInput = document.getElementById('sheet-config-date');
    const autoDateInput = document.getElementById('sheet-config-auto-date');
    const colsInput = document.getElementById('sheet-config-cols');
    const rowsInput = document.getElementById('sheet-config-rows');
    if (sizeInput) sizeInput.value = config.paperSize;
    if (colsInput) colsInput.value = `${config.gridCols}`;
    if (rowsInput) rowsInput.value = `${config.gridRows}`;
    if (titleInput) {
        titleInput.value = config.legendTitle || '';
        titleInput.placeholder = String(sheet.name || 'Nome da folha');
    }
    if (authorInput) authorInput.value = config.author || '';
    if (projectInput) projectInput.value = config.project || '';
    if (dateInput) dateInput.value = config.dateText || formatProjectSheetDate();
    if (autoDateInput) autoDateInput.checked = !!config.autoDate;
    sheetConfigLogoDraftDataUrl = config.logoDataUrl || '';
    sheetConfigLogoDraftMeta = normalizeSheetLogoMeta(config.logoMeta);
    if (!sheetConfigLogoDraftMeta && sheetConfigLogoDraftDataUrl) {
        const inferred = inferSheetLogoMimeFromDataUrl(sheetConfigLogoDraftDataUrl) || SHEET_LOGO_OUTPUT_MIME;
        sheetConfigLogoDraftMeta = normalizeSheetLogoMeta({
            mimeType: inferred,
            fileName: sanitizeSheetLogoFileName('logo', inferred)
        });
    }
    setSheetConfigLogoPreview(sheetConfigLogoDraftDataUrl);

    refreshSheetConfigModalGridPreview(false);
    syncSheetConfigModalDateState();

    modal.style.display = 'flex';
}

function closeProjectSheetConfigModal() {
    const modal = document.getElementById('sheet-config-modal');
    if (!modal) return;
    modal.style.display = 'none';
}

function saveActiveProjectSheetConfig() {
    const sheet = getSheetById(activeProjectSheetId);
    if (!sheet) return;

    const sizeInput = document.getElementById('sheet-config-size');
    const titleInput = document.getElementById('sheet-config-title');
    const authorInput = document.getElementById('sheet-config-author');
    const projectInput = document.getElementById('sheet-config-project');
    const dateInput = document.getElementById('sheet-config-date');
    const autoDateInput = document.getElementById('sheet-config-auto-date');
    const colsInput = document.getElementById('sheet-config-cols');
    const rowsInput = document.getElementById('sheet-config-rows');

    const nextConfig = normalizeSheetPageConfig({
        paperSize: sizeInput?.value,
        gridCols: colsInput?.value,
        gridRows: rowsInput?.value,
        legendTitle: titleInput?.value || '',
        author: authorInput?.value || '',
        project: projectInput?.value || '',
        dateText: dateInput?.value || '',
        autoDate: !!autoDateInput?.checked,
        logoDataUrl: sheetConfigLogoDraftDataUrl || '',
        logoMeta: sheetConfigLogoDraftMeta
    }, sheet.name || '');

    sheet.pageConfig = nextConfig;
    updateProjectSheetFrameMeta();
    closeProjectSheetConfigModal();
    scheduleHistoryCheckpoint('sheet_config');
}

function initProjectSheetConfigModal() {
    const modal = document.getElementById('sheet-config-modal');
    const configBtn = document.getElementById('sheet-config-btn');
    const saveBtn = document.getElementById('sheet-config-save');
    const sizeInput = document.getElementById('sheet-config-size');
    const autoDateInput = document.getElementById('sheet-config-auto-date');
    const logoPickBtn = document.getElementById('sheet-config-logo-pick');
    const logoClearBtn = document.getElementById('sheet-config-logo-clear');
    const logoInput = document.getElementById('sheet-config-logo-input');
    if (!modal) return;

    if (configBtn) configBtn.onclick = openProjectSheetConfigModal;
    if (saveBtn) saveBtn.onclick = saveActiveProjectSheetConfig;
    if (sizeInput) sizeInput.addEventListener('change', () => refreshSheetConfigModalGridPreview(true));
    if (autoDateInput) autoDateInput.addEventListener('change', syncSheetConfigModalDateState);
    if (logoPickBtn && logoInput) {
        logoPickBtn.addEventListener('click', () => logoInput.click());
    }
    if (logoClearBtn) {
        logoClearBtn.addEventListener('click', () => {
            sheetConfigLogoDraftDataUrl = '';
            sheetConfigLogoDraftMeta = null;
            if (logoInput) logoInput.value = '';
            setSheetConfigLogoPreview('');
        });
    }
    if (logoInput) {
        logoInput.addEventListener('change', async () => {
            const file = logoInput.files?.[0];
            if (!file) return;
            try {
                const converted = await convertSheetLogoFile(file);
                sheetConfigLogoDraftDataUrl = converted.dataUrl || '';
                sheetConfigLogoDraftMeta = normalizeSheetLogoMeta(converted.meta);
                setSheetConfigLogoPreview(sheetConfigLogoDraftDataUrl);
            } catch (err) {
                const msg = String(err?.message || 'Nao foi possivel carregar a logo.');
                alert(msg);
            } finally {
                logoInput.value = '';
            }
        });
    }
    modal.addEventListener('mousedown', e => {
        if (e.target === modal) closeProjectSheetConfigModal();
    });
}

window.fecharModalConfigFolha = closeProjectSheetConfigModal;

function activateProjectSheet(sheetId, opts = {}) {
    const next = getSheetById(sheetId);
    if (!next) return false;
    next.pageConfig = getSheetPageConfig(next);
    next.viewStatesByMode = normalizeSheetViewportStatesByMode(next.viewStatesByMode);
    const skipCapture = !!opts.skipCapture;
    const resetHistory = opts.resetHistory !== false;

    if (!skipCapture) captureActiveSheetSnapshot();
    activeProjectSheetId = next.id;

    const snapshot = cloneSheetSnapshot(next.snapshot);
    const prevSuppressAutoZoom = suppressWorkspaceAutoZoom;
    suppressWorkspaceAutoZoom = true;
    try {
        if (typeof window.importActiveSheetSnapshot === 'function') {
            window.importActiveSheetSnapshot(snapshot);
        } else if (typeof window.importProjectSnapshot === 'function') {
            window.importProjectSnapshot(snapshot);
        }
    } finally {
        suppressWorkspaceAutoZoom = prevSuppressAutoZoom;
    }
    restoreActiveSheetViewportStateForMode(activeWorkspaceMode, { sheet: next });
    if (typeof window.restoreConfiguredWireColors === 'function') {
        try { window.restoreConfiguredWireColors(); } catch (_) { }
        requestAnimationFrame(() => { try { window.restoreConfiguredWireColors(); } catch (_) { } });
    }

    renderProjectSheetTabs();
    scheduleCrossReferenceRefresh();
    if (resetHistory && typeof initHistoryManager === 'function') {
        initHistoryManager();
    }
    return true;
}

function addProjectSheet() {
    captureActiveSheetSnapshot();
    const sheetName = getNextProjectSheetName();
    const initialViewState = getCurrentSheetViewportState();
    const sheet = {
        id: createProjectSheetId(),
        name: sheetName,
        order: projectSheets.length + 1,
        snapshot: buildEmptyActiveSheetSnapshot(),
        viewState: initialViewState,
        viewStatesByMode: buildEmptySheetViewportStatesByMode(),
        pageConfig: buildDefaultSheetPageConfig(sheetName)
    };
    setSheetViewportStateForMode(sheet, activeWorkspaceMode, initialViewState);
    projectSheets.push(sheet);
    activateProjectSheet(sheet.id, { skipCapture: true });
    scheduleHistoryCheckpoint('sheet_add');
}

function renameActiveProjectSheet() {
    const sheet = getSheetById(activeProjectSheetId);
    if (!sheet) return;
    const atual = String(sheet.name || '').trim() || 'Folha';
    const novo = prompt('Nome da folha ativa:', atual);
    if (novo === null) return;
    const txt = String(novo || '').trim();
    if (!txt) return;
    sheet.name = txt;
    renderProjectSheetTabs();
    scheduleHistoryCheckpoint('sheet_rename');
}

function deleteActiveProjectSheet() {
    const current = getSheetById(activeProjectSheetId);
    if (!current) return;
    if (projectSheets.length <= 1) return;
    const ok = confirm(`Apagar a folha ativa "${current.name || 'Folha'}"?`);
    if (!ok) return;

    captureActiveSheetSnapshot();
    const idx = projectSheets.findIndex(s => s.id === current.id);
    if (idx < 0) return;
    projectSheets.splice(idx, 1);

    const fallback = projectSheets[Math.max(0, Math.min(idx, projectSheets.length - 1))];
    if (!fallback) return;
    activateProjectSheet(fallback.id, { skipCapture: true });
    scheduleHistoryCheckpoint('sheet_delete');
}

function initProjectSheets() {
    const tabsHost = document.getElementById('sheet-tabs');
    if (!tabsHost) return;
    const addBtn = document.getElementById('sheet-add-btn');
    const configBtn = document.getElementById('sheet-config-btn');
    const renameBtn = document.getElementById('sheet-rename-btn');
    const deleteBtn = document.getElementById('sheet-delete-btn');
    if (addBtn) addBtn.onclick = addProjectSheet;
    if (configBtn) configBtn.onclick = openProjectSheetConfigModal;
    if (renameBtn) renameBtn.onclick = renameActiveProjectSheet;
    if (deleteBtn) deleteBtn.onclick = deleteActiveProjectSheet;
    initProjectSheetConfigModal();

    if (!projectSheets.length) {
        const firstId = createProjectSheetId();
        const firstSnapshot = (typeof window.exportActiveSheetSnapshot === 'function')
            ? cloneSheetSnapshot(window.exportActiveSheetSnapshot())
            : buildEmptyActiveSheetSnapshot();
        const initialViewState = getCurrentSheetViewportState();
        projectSheets = [{
            id: firstId,
            name: 'Folha 1',
            order: 1,
            snapshot: firstSnapshot,
            viewState: initialViewState,
            viewStatesByMode: buildEmptySheetViewportStatesByMode(),
            pageConfig: buildDefaultSheetPageConfig('Folha 1')
        }];
        setSheetViewportStateForMode(projectSheets[0], activeWorkspaceMode, initialViewState);
        activeProjectSheetId = firstId;
    }
    projectSheets = projectSheets.map(sheet => ({
        ...sheet,
        viewStatesByMode: normalizeSheetViewportStatesByMode(sheet?.viewStatesByMode),
        pageConfig: normalizeSheetPageConfig(sheet?.pageConfig, sheet?.name || '')
    }));
    renderProjectSheetTabs();
}

window.exportSheetsProjectPayload = function () {
    if (!projectSheets.length) initProjectSheets();
    normalizeProjectSheetOrder();
    captureActiveSheetSnapshot();
    return {
        version: 3,
        activeSheetId: activeProjectSheetId,
        sheets: projectSheets.map(sheet => ({
            id: sheet.id,
            name: String(sheet.name || 'Folha').trim() || 'Folha',
            order: Number.isFinite(sheet.order) ? sheet.order : null,
            snapshot: cloneSheetSnapshot(sheet.snapshot),
            viewState: normalizeSheetViewportState(sheet.viewState),
            viewStatesByMode: normalizeSheetViewportStatesByMode(sheet.viewStatesByMode),
            pageConfig: normalizeSheetPageConfig(sheet.pageConfig, sheet.name || '')
        }))
    };
};

window.importSheetsProjectPayload = function (data) {
    const incomingRaw = Array.isArray(data?.sheets) ? data.sheets : [];
    const incoming = incomingRaw
        .map((item, idx) => ({
            item,
            idx,
            order: parseInt(item?.order, 10)
        }))
        .sort((a, b) => {
            const aHas = Number.isFinite(a.order) && a.order > 0;
            const bHas = Number.isFinite(b.order) && b.order > 0;
            if (aHas && bHas) return a.order - b.order;
            if (aHas) return -1;
            if (bHas) return 1;
            return a.idx - b.idx;
        })
        .map(x => x.item);
    if (!incoming.length) return false;

    const nextSheets = [];
    incoming.forEach(item => {
        const id = String(item?.id || createProjectSheetId()).trim() || createProjectSheetId();
        if (nextSheets.some(s => s.id === id)) return;
        nextSheets.push({
            id,
            name: String(item?.name || '').trim() || getNextProjectSheetName(),
            order: Number.isFinite(parseInt(item?.order, 10)) ? parseInt(item.order, 10) : null,
            snapshot: cloneSheetSnapshot(item?.snapshot || item),
            viewState: normalizeSheetViewportState(item?.viewState),
            viewStatesByMode: normalizeSheetViewportStatesByMode(item?.viewStatesByMode),
            pageConfig: normalizeSheetPageConfig(item?.pageConfig, String(item?.name || '').trim() || 'Folha')
        });
    });
    if (!nextSheets.length) return false;

    projectSheets = nextSheets;
    normalizeProjectSheetOrder();
    const ids = new Set(projectSheets.map(s => s.id));
    activeProjectSheetId = ids.has(String(data?.activeSheetId || ''))
        ? String(data.activeSheetId)
        : projectSheets[0].id;

    const maxSeed = projectSheets
        .map(s => {
            const m = String(s.id || '').match(/^S(\d+)$/);
            return m ? parseInt(m[1], 10) : 0;
        })
        .reduce((acc, n) => Math.max(acc, n), 0);
    projectSheetIdSeed = Math.max(projectSheetIdSeed, maxSeed + 1);

    renderProjectSheetTabs();
    let ok = false;
    try {
        ok = activateProjectSheet(activeProjectSheetId, { skipCapture: true, resetHistory: false });
    } catch (err) {
        console.error(err);
        ok = false;
    }
    if (ok && typeof initHistoryManager === 'function') initHistoryManager();
    return ok;
};

window.syncActiveSheetFromWorkspace = function () {
    if (!projectSheets.length) return;
    captureActiveSheetSnapshot();
    renderProjectSheetTabs();
};

window.activateProjectSheetById = function (sheetId, opts = {}) {
    const options = (opts && typeof opts === 'object') ? opts : {};
    return activateProjectSheet(sheetId, {
        skipCapture: options.skipCapture !== false,
        resetHistory: options.resetHistory === true
    });
};

window.getActiveProjectSheetId = function () {
    return activeProjectSheetId;
};

window.prepareActiveSheetForExport = function (marginPx = 16) {
    const viewport = document.getElementById('viewport');
    const frame = document.querySelector('#bancada > .project-sheet-frame');
    if (!viewport || !frame) return null;

    const margin = Math.max(0, Number(marginPx) || 0);
    const frameWidth = Math.max(1, frame.offsetWidth || frame.clientWidth || 1);
    const frameHeight = Math.max(1, frame.offsetHeight || frame.clientHeight || 1);
    const vpW = Math.max(1, viewport.clientWidth || 1);
    const vpH = Math.max(1, viewport.clientHeight || 1);
    const fitZoom = Math.min(
        MAX_ZOOM_LEVEL,
        Math.max(
            MIN_ZOOM_LEVEL,
            Math.min(
                (vpW - margin * 2) / frameWidth,
                (vpH - margin * 2) / frameHeight
            )
        )
    );

    zoomLevel = fitZoom;
    panX = Math.round(margin - (frame.offsetLeft * zoomLevel));
    panY = Math.round(margin - (frame.offsetTop * zoomLevel));
    updateTransform();
    const zd = document.getElementById('zoom-display');
    if (zd) zd.innerText = Math.round(zoomLevel * 100) + '%';

    const viewportRect = viewport.getBoundingClientRect();
    const frameRect = frame.getBoundingClientRect();
    const x = Math.max(0, Math.round(frameRect.left - viewportRect.left));
    const y = Math.max(0, Math.round(frameRect.top - viewportRect.top));
    const maxWidth = Math.max(1, Math.round(viewportRect.width - x));
    const maxHeight = Math.max(1, Math.round(viewportRect.height - y));
    const width = Math.max(1, Math.min(Math.round(frameRect.width), maxWidth));
    const height = Math.max(1, Math.min(Math.round(frameRect.height), maxHeight));

    return { x, y, width, height };
};

function toggleSidebar(forceState = null) {
    const app = document.querySelector('.app-container');
    if (!app) return;
    const isMobile = isMobileViewport();

    if (isMobile) {
        const current = app.classList.contains('sidebar-open');
        const next = forceState === null ? !current : !!forceState;
        app.classList.toggle('sidebar-open', next);
    } else {
        const current = app.classList.contains('sidebar-hidden');
        const next = forceState === null ? !current : !!forceState;
        app.classList.toggle('sidebar-hidden', next);
    }
    applyMobileSidebarPanel();
}

function applyMobileSidebarPanel() {
    const sidebar = document.querySelector('.sidebar');
    const app = document.querySelector('.app-container');
    const btnMenu = document.getElementById('btn-sidebar-toggle');
    const btnTools = document.getElementById('btn-commands-tools-toggle');
    const panel = mobileSidebarPanel === 'tools' ? 'tools' : 'menu';
    const open = !!(app && app.classList.contains('sidebar-open'));
    if (sidebar) sidebar.dataset.mobilePanel = panel;
    if (app) app.dataset.mobilePanel = panel;
    const visible = isMobileViewport()
        ? open
        : !!(app && !app.classList.contains('sidebar-hidden'));
    if (btnMenu) btnMenu.classList.toggle('toggle-on', visible && panel === 'menu');
    if (btnTools) btnTools.classList.toggle('toggle-on', visible && panel === 'tools');
}

window.applyCommandsSidebarPanel = applyMobileSidebarPanel;

function toggleSidebarPanel(panel = 'menu', forceState = null) {
    const app = document.querySelector('.app-container');
    if (!app) return;
    const normalized = panel === 'tools' ? 'tools' : 'menu';
    const currentPanel = app.dataset.mobilePanel || mobileSidebarPanel || 'menu';

    if (!isMobileViewport()) {
        mobileSidebarPanel = normalized;
        applyMobileSidebarPanel();
        const currentlyHidden = app.classList.contains('sidebar-hidden');
        if (forceState !== null) {
            toggleSidebar(forceState);
            return;
        }
        if (currentlyHidden) {
            toggleSidebar(false);
            return;
        }
        if (currentPanel === normalized) {
            toggleSidebar();
        }
        return;
    }

    const currentOpen = app.classList.contains('sidebar-open');
    const samePanel = currentPanel === normalized;
    const next = forceState === null ? !(currentOpen && samePanel) : !!forceState;
    mobileSidebarPanel = normalized;
    app.classList.toggle('sidebar-open', next);
    app.dataset.mobilePanel = normalized;
    applyMobileSidebarPanel();
}

window.toggleSidebarPanel = toggleSidebarPanel;

function setupMobileSidebarAutoClose() {
    let downInsideSidebar = false;
    let downOnToggle = false;

    document.addEventListener('pointerdown', (e) => {
        if (!isMobileViewport()) return;
        const sidebar = document.querySelector('.sidebar');
        const btnToggle = document.getElementById('btn-sidebar-toggle');
        const btnTools = document.getElementById('btn-commands-tools-toggle');
        const target = e.target;
        downInsideSidebar = !!(sidebar && sidebar.contains(target));
        downOnToggle = !!(
            (btnToggle && btnToggle.contains(target)) ||
            (btnTools && btnTools.contains(target))
        );
    }, true);

    document.addEventListener('pointerup', (e) => {
        if (!isMobileViewport()) return;
        const app = document.querySelector('.app-container');
        const sidebar = document.querySelector('.sidebar');
        const btnToggle = document.getElementById('btn-sidebar-toggle');
        const btnTools = document.getElementById('btn-commands-tools-toggle');
        if (!app || !sidebar || !app.classList.contains('sidebar-open')) return;
        const target = e.target;
        const upInsideSidebar = !!sidebar.contains(target);
        const upOnToggle = !!(
            (btnToggle && btnToggle.contains(target)) ||
            (btnTools && btnTools.contains(target))
        );

        // Close only when gesture started and ended outside menu/toggle.
        if (!downInsideSidebar && !upInsideSidebar && !downOnToggle && !upOnToggle) {
            toggleSidebar(false);
        }
    }, true);
}

function initDrawingEditModal() {
    const modal = document.getElementById('drawing-edit-modal');
    const saveBtn = document.getElementById('drawing-edit-save');
    if (!modal) return;
    if (saveBtn) saveBtn.addEventListener('click', applyDrawingEditFromModal);
    modal.addEventListener('mousedown', e => {
        if (e.target === modal) closeDrawingEditModal();
    });
}

function isCompactTopbarLayout() {
    return document.body.classList.contains('mobile-layout');
}

function applyTopbarToolsMenuState() {
    const topbar = document.querySelector('.top-bar');
    if (!topbar) return;
    topbar.classList.toggle('topbar-tools-open', !!topbarToolsMenuOpen);
}

function syncTopChromeCollapsedUi() {
    document.body.classList.toggle('top-chrome-collapsed', !!topChromeCollapsed);
    const btn = document.getElementById('sheet-toggle-topbar-btn');
    if (!btn) return;
    btn.classList.toggle('ativo', !!topChromeCollapsed);
    btn.title = topChromeCollapsed ? 'Mostrar barra superior' : 'Ocultar barra superior';
    btn.setAttribute('aria-pressed', topChromeCollapsed ? 'true' : 'false');
    const icon = btn.querySelector('i');
    if (icon) {
        icon.className = topChromeCollapsed ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-up';
    }
}

function toggleTopChromeCollapsed(forceState = null) {
    topChromeCollapsed = forceState === null ? !topChromeCollapsed : !!forceState;
    syncTopChromeCollapsedUi();
}

window.toggleTopChromeCollapsed = toggleTopChromeCollapsed;

function closeTopbarToolsMenu() {
    topbarToolsMenuOpen = false;
    applyTopbarToolsMenuState();
}

function toggleTopbarToolsMenu(forceState = null) {
    const next = forceState === null ? !topbarToolsMenuOpen : !!forceState;
    topbarToolsMenuOpen = next;
    applyTopbarToolsMenuState();
}

window.toggleTopbarToolsMenu = toggleTopbarToolsMenu;

function setupTopbarToolsMenuAutoClose() {
    document.addEventListener('pointerdown', (e) => {
        if (!topbarToolsMenuOpen) return;
        const target = e.target;
        const container = document.getElementById('draw-controls-container');
        const btn = document.getElementById('btn-more-tools');
        if (container && container.contains(target)) return;
        if (btn && btn.contains(target)) return;
        closeTopbarToolsMenu();
    }, true);
}

window.addEventListener('resize', () => {
    syncResponsiveState();
    syncPrimaryToolButtonPlacement();
    const app = document.querySelector('.app-container');
    if (!app) return;
    if (isMobileViewport()) {
        app.classList.remove('sidebar-hidden');
    } else {
        app.classList.remove('sidebar-open');
    }
});

function isMobileViewport() {
    const viewportWidth = window.innerWidth || document.documentElement?.clientWidth || 0;
    return viewportWidth > 0 && viewportWidth <= MOBILE_BREAKPOINT;
}

function syncResponsiveState() {
    const mobile = isMobileViewport();
    document.body.classList.toggle('mobile-layout', mobile);
    const app = document.querySelector('.app-container');
    if (app) {
        if (mobile) app.classList.remove('sidebar-hidden');
        else app.classList.remove('sidebar-open');
    }
    if (lastResponsiveMobile === null) {
        lastResponsiveMobile = mobile;
        applyTopbarToolsMenuState();
        applyMobileSidebarPanel();
        updateMobileQuickActionButtons();
        syncPrimaryToolButtonPlacement();
        syncMobileQuickActionPlacement();
        return;
    }
    if (lastResponsiveMobile !== mobile) {
        lastResponsiveMobile = mobile;
        if (!mobile) closeTopbarToolsMenu();
        else applyTopbarToolsMenuState();
        applyMobileSidebarPanel();
        updateMobileQuickActionButtons();
        syncPrimaryToolButtonPlacement();
        syncMobileQuickActionPlacement();
        window.requestAnimationFrame(() => resetView());
        return;
    }
    applyMobileSidebarPanel();
    updateMobileQuickActionButtons();
    syncPrimaryToolButtonPlacement();
    syncMobileQuickActionPlacement();
}

// =====================================================
// LINHAS GUIA (MIRA)
// =====================================================
document.addEventListener('mousemove', e => {
    updateMouseGuidesAtClient(e.clientX, e.clientY);
});

document.getElementById('viewport')?.addEventListener('mouseleave', () => {
    if (typeof window.hideMouseGuides === 'function') window.hideMouseGuides();
});

window.hideMouseGuides = function () {
    const h = document.getElementById('crosshair-h');
    const v = document.getElementById('crosshair-v');
    if (h) h.style.display = 'none';
    if (v) v.style.display = 'none';
};
window.updateMouseGuidesAtClient = updateMouseGuidesAtClient;




































// =====================================================
// LINHAS GUIA (MIRA)
// =====================================================
document.addEventListener('mousemove', e => {
    updateMouseGuidesAtClient(e.clientX, e.clientY);
});

document.getElementById('viewport')?.addEventListener('mouseleave', () => {
    if (typeof window.hideMouseGuides === 'function') window.hideMouseGuides();
});

window.hideMouseGuides = function () {
    const h = document.getElementById('crosshair-h');
    const v = document.getElementById('crosshair-v');
    if (h) h.style.display = 'none';
    if (v) v.style.display = 'none';
};
window.updateMouseGuidesAtClient = updateMouseGuidesAtClient;

 
 
 





































window.ferramentaAtiva = ferramentaAtiva;
window.simulando = simulando;
window.activeWorkspaceMode = activeWorkspaceMode;
window.zoomLevel = zoomLevel;
window.panX = panX;
window.panY = panY;




