// =====================================================
// CADe Web ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â ENGINE ELÃƒÆ’Ã¢â‚¬Â°TRICA ORIGINAL (OLD)
// ExtraÃƒÆ’Ã‚Â­da integralmente do simulator.js original
// =====================================================

// ---------- CONTROLE DE SIMULAÃƒÆ’Ã¢â‚¬Â¡ÃƒÆ’Ã†â€™O ----------
let loopInterval = null;
let simulationStartWallMs = null;
let simulationElapsedMs = 0;
let simulationStartHintsTimer = null;

function setSimulationStartHintsVisible(visible) {
    if (simulationStartHintsTimer) {
        clearTimeout(simulationStartHintsTimer);
        simulationStartHintsTimer = null;
    }
    document.body.classList.toggle('simulation-start-hints', !!visible);
}

function pulseSimulationStartHints(durationMs = 2000) {
    setSimulationStartHintsVisible(true);
    simulationStartHintsTimer = setTimeout(() => {
        simulationStartHintsTimer = null;
        document.body.classList.remove('simulation-start-hints');
    }, durationMs);
}

function formatSimulationClock(ms) {
    const safeMs = Number.isFinite(ms) && ms > 0 ? ms : 0;
    const totalSeconds = Math.floor(safeMs / 1000);
    const tenths = Math.floor((safeMs % 1000) / 100);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    return `${hh}:${mm}:${ss}.${tenths}`;
}

function renderSimulationClock() {
    const el = document.getElementById('sim-clock');
    if (!el) return;
    el.innerText = formatSimulationClock(simulationElapsedMs);
}

function resetSimulationClock() {
    simulationStartWallMs = null;
    simulationElapsedMs = 0;
    window.simulationElapsedMs = 0;
    renderSimulationClock();
}

function startSimulationClock() {
    simulationStartWallMs = Date.now();
    simulationElapsedMs = 0;
    window.simulationElapsedMs = 0;
    renderSimulationClock();
}

function tickSimulationClock() {
    if (!simulando || !simulationStartWallMs) return;
    simulationElapsedMs = Date.now() - simulationStartWallMs;
    window.simulationElapsedMs = simulationElapsedMs;
    renderSimulationClock();
}

window.tickSimulationClock = tickSimulationClock;
window.getSimulationTimeMs = function () {
    return simulationElapsedMs;
};

function forEachWireAcrossWorkspaces(callback) {
    const seen = new Set();
    const visit = (arr) => {
        if (!Array.isArray(arr)) return;
        arr.forEach(f => {
            if (!f || !f.element || seen.has(f.element)) return;
            seen.add(f.element);
            callback(f);
        });
    };

    visit(typeof listaFios !== 'undefined' ? listaFios : []);
    if (typeof wiresByMode !== 'undefined' && wiresByMode) {
        Object.values(wiresByMode).forEach(visit);
    }
}

function getSimulationActiveWorkspace() {
    const mode = (typeof activeWorkspaceMode !== 'undefined' && activeWorkspaceMode === '2d')
        ? '2d'
        : 'simbologia';
    return document.querySelector(`.mode-workspace[data-mode="${mode}"]`)
        || document.querySelector('.mode-workspace.active')
        || document.querySelector('.mode-workspace');
}

function getSimulationActiveComponents(selector = '.component') {
    const workspace = getSimulationActiveWorkspace();
    if (!workspace) return [];
    return Array.from(workspace.querySelectorAll(selector) || []);
}

window.getSimulationActiveWorkspace = getSimulationActiveWorkspace;
window.getSimulationActiveComponents = getSimulationActiveComponents;

// =====================================================
// TOGGLE SIMULAÃƒÆ’Ã¢â‚¬Â¡ÃƒÆ’Ã†â€™O
// =====================================================
function toggleSimulacao() {
    const btn = document.getElementById('btn-play');
    simulando = !simulando;

    if (simulando) {
        btn.innerHTML = '<i class="fa-solid fa-stop"></i> PARAR';
        btn.classList.add('simulando');
        document.body.classList.add('simulando');
        pulseSimulationStartHints(2000);
        if (typeof window.clearComponentSelection === 'function') window.clearComponentSelection();
        if (typeof window.clearWireSelection === 'function') window.clearWireSelection();
        ativarFerramenta('select', { forceDuringSimulation: true });
        if (typeof window.hideMouseGuides === 'function') window.hideMouseGuides();
        if (typeof window.rebindWireEndpoints === 'function') window.rebindWireEndpoints();

        // Sempre inicia a simulacao em estado parado.
        getSimulationActiveComponents().forEach(c => {
            c.dataset.manualOn = 'false';
            c.dataset.releTrip = 'false';
            c.dataset.pressionado = 'false';
            c.removeAttribute('data-state');
            c.querySelectorAll('.toggle-state-btn').forEach(btnToggle => {
                btnToggle.setAttribute('aria-pressed', 'false');
            });
        });

        // Visual neutro inicial apenas no workspace ativo.
        (Array.isArray(listaFios) ? listaFios : []).forEach(f => {
            if (typeof window.applyWireSimulationColor === 'function') {
                window.applyWireSimulationColor(f, '#7f8c8d');
            } else if (f.element) {
                f.element.style.stroke = '#7f8c8d';
            }
        });
        startSimulationClock();

        if (loopInterval) clearInterval(loopInterval);
        loopInterval = setInterval(engineStep, 50);
        if (typeof window.refreshAllComponentCursors === 'function') window.refreshAllComponentCursors();
        if (typeof window.updateSimulationInteractionLockUi === 'function') window.updateSimulationInteractionLockUi();
    } else {
        btn.innerHTML = '<i class="fa-solid fa-play"></i> SIMULAR';
        btn.classList.remove('simulando');
        document.body.classList.remove('simulando');
        setSimulationStartHintsVisible(false);
        if (typeof window.hideMouseGuides === 'function') window.hideMouseGuides();

        if (loopInterval) clearInterval(loopInterval);
        if (typeof window.hideCurto === 'function') window.hideCurto();
        resetSimulationClock();
        limparVisual();
        if (typeof window.clearComponentSelection === 'function') window.clearComponentSelection();
        if (typeof window.clearWireSelection === 'function') window.clearWireSelection();
        if (typeof window.__clearSimulationEditLocked === 'function') window.__clearSimulationEditLocked();
        if (typeof window.refreshAllComponentCursors === 'function') window.refreshAllComponentCursors();
        if (typeof window.updateSimulationInteractionLockUi === 'function') window.updateSimulationInteractionLockUi();
    }
}

// =====================================================
// ENGINE STEP (ORIGINAL)
// =====================================================
function engineStep() {
    try {
        tickSimulationClock();

        const mapaPotencial = new Map();
        const allBornes = [];
        const bancadaRect = document.getElementById('bancada').getBoundingClientRect();
        const simulationComponents = getSimulationActiveComponents();

        // 1. MAPEAMENTO INICIAL
        simulationComponents.forEach(comp => {
            const def = BIBLIOTECA[comp.dataset.lib];
            comp.querySelectorAll('.borne').forEach(b => {
                const rect = b.getBoundingClientRect();
                const lx = (rect.left + rect.width / 2 - bancadaRect.left) / zoomLevel;
                const ly = (rect.top + rect.height / 2 - bancadaRect.top) / zoomLevel;

                allBornes.push({ el: b, x: lx, y: ly });

                if (def) {
                    if (def.tipo === 'fonte-fase') mapaPotencial.set(b, 'FASE');
                    if (def.tipo === 'fonte-neutro') mapaPotencial.set(b, 'NEUTRO');
                }
            });
        });

        // 2. LOOP DE PROPAGAÃƒÆ’Ã¢â‚¬Â¡ÃƒÆ’Ã†â€™O
        let mudou = true;
        let loops = 0;

        while (mudou && loops < 50) {
            mudou = false;
            loops++;

            // A) FIOS
            listaFios.forEach(f => {
                let pot =
                    mapaPotencial.get(f.origem) ||
                    mapaPotencial.get(f.destino) ||
                    f._cachePot;

                if (!pot && f.points) {
                    for (let pt of f.points) {
                        for (let b of allBornes) {
                            if (Math.abs(pt.x - b.x) < 25 && Math.abs(pt.y - b.y) < 25) {
                                const p = mapaPotencial.get(b.el);
                                if (p) {
                                    pot = p;
                                    break;
                                }
                            }
                        }
                        if (pot) break;
                    }
                }

                if (pot) {
                    f._cachePot = pot;

                    if (f.origem && !mapaPotencial.get(f.origem)) {
                        mapaPotencial.set(f.origem, pot);
                        mudou = true;
                    }
                    if (f.destino && !mapaPotencial.get(f.destino)) {
                        mapaPotencial.set(f.destino, pot);
                        mudou = true;
                    }

                    if (f.points) {
                        for (let pt of f.points) {
                            for (let b of allBornes) {
                                if (
                                    Math.abs(pt.x - b.x) < 25 &&
                                    Math.abs(pt.y - b.y) < 25
                                ) {
                                    if (!mapaPotencial.get(b.el)) {
                                        mapaPotencial.set(b.el, pot);
                                        mudou = true;
                                    }
                                }
                            }
                        }
                    }
                }
            });

            // B) CONTATO FÃƒÆ’Ã‚ÂSICO
            for (let i = 0; i < allBornes.length; i++) {
                for (let j = i + 1; j < allBornes.length; j++) {
                    if (
                        Math.abs(allBornes[i].x - allBornes[j].x) < 20 &&
                        Math.abs(allBornes[i].y - allBornes[j].y) < 20
                    ) {
                        const p1 = mapaPotencial.get(allBornes[i].el);
                        const p2 = mapaPotencial.get(allBornes[j].el);

                        if (p1 && !p2) {
                            mapaPotencial.set(allBornes[j].el, p1);
                            mudou = true;
                        } else if (!p1 && p2) {
                            mapaPotencial.set(allBornes[i].el, p2);
                            mudou = true;
                        }
                    }
                }
            }

            // C) COMPONENTES INTERNOS
            const coilStates = new Map();
            simulationComponents.forEach(comp => {
                const def = BIBLIOTECA[comp.dataset.lib];
                if (!def || def.tipo !== 'bobina') return;

                const inputs = {};
                comp.querySelectorAll('.borne').forEach(b => {
                    const p = mapaPotencial.get(b);
                    if (b.dataset.pino && p) inputs[b.dataset.pino] = p;
                });

                const a1 = inputs['A1'];
                const a2 = inputs['A2'];
                const ligado = a1 && a2 && a1 !== a2;
                const tag = comp.dataset.tag || def.tagDefault;
                if (tag) coilStates.set(tag, ligado);
            });

            const thermalTripByTag = new Map();
            getSimulationActiveComponents('.component[data-lib="iec_rele_termico"]').forEach(comp => {
                const def = BIBLIOTECA[comp.dataset.lib] || {};
                const tag = (comp.dataset.tag || def.tagDefault || '').trim().toUpperCase();
                if (!tag) return;
                const tripped = (comp.dataset.releTrip === 'true') || (comp.dataset.manualOn === 'true');
                const prev = thermalTripByTag.get(tag) || false;
                thermalTripByTag.set(tag, prev || tripped);
            });

            simulationComponents.forEach(comp => {
                const def = BIBLIOTECA[comp.dataset.lib];
                if (!def || !def.behavior) return;

                const inputs = {};
                const bornes = Array.from(comp.querySelectorAll('.borne'));

                bornes.forEach(b => {
                    const p = mapaPotencial.get(b);
                    if (b.dataset.pino && p) inputs[b.dataset.pino] = p;
                    if (p) inputs['G'] = p;
                });

                const estado = comp._estadoMecanico || false;
                const tagNorm = (comp.dataset.tag || def.tagDefault || '').trim().toUpperCase();
                const overloadTrip = thermalTripByTag.get(tagNorm) || false;
                const props = {
                    pressionado: comp.dataset.pressionado === 'true',
                    tagEnergized:
                        (comp.dataset.lib === 'iec_rele_termico' ||
                            comp.dataset.lib === 'iec_contato_rele_term_na' ||
                            comp.dataset.lib === 'iec_contato_rele_term_nf')
                            ? overloadTrip
                            : (coilStates.get(comp.dataset.tag || def.tagDefault) || false),
                    overloadTrip
                };
                const res = def.behavior(inputs, estado, props, comp);

                if (res.shorts) {
                    res.shorts.forEach(par => {
                        const b1 = bornes.find(b => b.dataset.pino == par[0]);
                        const b2 = bornes.find(b => b.dataset.pino == par[1]);

                        if (b1 && b2) {
                            const v1 = mapaPotencial.get(b1);
                            const v2 = mapaPotencial.get(b2);

                            if (v1 && !v2) {
                                mapaPotencial.set(b2, v1);
                                mudou = true;
                            } else if (!v1 && v2) {
                                mapaPotencial.set(b1, v2);
                                mudou = true;
                            }
                        }
                    });
                }

                if (def.tipo === 'nodo') {
                    let p = null;
                    bornes.forEach(b => {
                        if (mapaPotencial.get(b)) p = mapaPotencial.get(b);
                    });
                    if (p) {
                        bornes.forEach(b => {
                            if (!mapaPotencial.get(b)) {
                                mapaPotencial.set(b, p);
                                mudou = true;
                            }
                        });
                    }
                }

                comp._proximoEstado = res.novoEstado;
                if (res.tipoVisual) comp._tipoVisual = res.tipoVisual;
            });
        }

        // 3. RENDER FINAL
        if (!simulando) return;

        simulationComponents.forEach(comp => {
            comp._estadoMecanico = comp._proximoEstado;
            const prevVisualState = String(comp._lastSoundState || comp.getAttribute('data-state') || '');
            if (comp._estadoMecanico)
                comp.setAttribute('data-state', comp._tipoVisual || 'ativo');
            else comp.removeAttribute('data-state');
            const nextVisualState = String(comp.getAttribute('data-state') || '');
            if (typeof window.__playRealComponentStateSound === 'function') {
                window.__playRealComponentStateSound(comp, prevVisualState, nextVisualState);
            }
            comp._lastSoundState = nextVisualState;
        });

        listaFios.forEach(f => {
            let pot =
                mapaPotencial.get(f.origem) ||
                mapaPotencial.get(f.destino) ||
                f._cachePot;

            let cor = '#7f8c8d';
            if (pot === 'FASE' || pot === 'NEUTRO') cor = '#ff0000';

            if (typeof window.applyWireSimulationColor === 'function') {
                window.applyWireSimulationColor(f, cor);
            } else if (f.element) {
                f.element.style.stroke = cor;
            }
        });
    } catch (err) {
        console.error(err);
    }
}

// =====================================================
// LIMPAR VISUAL
// =====================================================
function limparVisual() {
    if (typeof window.resetEngineNewState === 'function') {
        window.resetEngineNewState();
    }

    document.querySelectorAll('.component').forEach(c => {
        c.removeAttribute('data-state');
        c.dataset.manualOn = 'false';
        c.dataset.releTrip = 'false';
        delete c._estadoMecanico;
        delete c._proximoEstado;
        delete c._tipoVisual;
        delete c._activeShorts;
        delete c._realContatorOpenUntilMs;
        if (c.dataset.pressionado === 'true') c.dataset.pressionado = 'false';
        c.querySelectorAll('.toggle-state-btn').forEach(btn => {
            btn.setAttribute('aria-pressed', 'false');
        });
    });

    forEachWireAcrossWorkspaces(f => {
        const original = f.configColor || f.baseColor || f.colorOriginal || f.element?.dataset?.configColor || f.element?.dataset?.originalColor || '#7f8c8d';
        if (typeof window.clearWireSimulationColor === 'function') {
            window.clearWireSimulationColor(f);
        } else {
            delete f.simulationColor;
            if (f.element) delete f.element.dataset.simulationColor;
        }
        if (f.element) {
            f.element.style.stroke = original;
            if (!f.element.dataset.originalColor) f.element.dataset.originalColor = original;
            if (!f.element.dataset.configColor) f.element.dataset.configColor = original;
        }
        delete f._cachePot;
    });

    // Fallback robusto: garante reset de TODOS os fios visuais, mesmo fora das listas em memoria.
    document.querySelectorAll('.mode-workspace .mode-wire-layer polyline.user-wire').forEach(poly => {
        if (!poly) return;
                const baseColor = poly.dataset.configColor || poly.dataset.originalColor || poly.style.stroke || '#7f8c8d';
        if (!poly.dataset.originalColor) {
            poly.dataset.originalColor = baseColor;
        }
        if (!poly.dataset.configColor) {
            poly.dataset.configColor = baseColor;
        }
        poly.style.stroke = poly.dataset.configColor || poly.dataset.originalColor || '#7f8c8d';
    });
}

resetSimulationClock();










