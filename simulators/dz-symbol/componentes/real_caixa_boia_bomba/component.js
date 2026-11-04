(() => {
    const BASE_PATH = './animacoes_2d/caixa_e_boia';
    const FRAME_MIN = 0;
    const FRAME_MAX = 5;
    const FRAME_STEP_MS = 1000;
    const PUMP_STICKY_MS = 400;
    const OVERFLOW_DELAY_MS = 1000;

    function getBorneNode(comp, pino) {
        const borne = comp?.querySelector?.(`.borne[data-pino="${pino}"]`);
        return borne?._node || null;
    }

    function getPotentialSet(node) {
        return node?.potenciais instanceof Set ? node.potenciais : null;
    }

    function hasPotential(node, token) {
        return !!getPotentialSet(node)?.has?.(token);
    }

    function hasAnyPhase(node) {
        const potentials = getPotentialSet(node);
        if (!potentials) return false;
        if (potentials.has('FASE')) return true;
        for (const potential of potentials) {
            if (typeof potential === 'string' && potential.startsWith('FASE:')) return true;
        }
        return false;
    }

    function extractPhaseIds(node) {
        const ids = new Set();
        const potentials = getPotentialSet(node);
        if (!potentials) return ids;
        potentials.forEach(potential => {
            if (typeof potential !== 'string') return;
            const match = potential.match(/^FASE:(.+)$/);
            if (match && match[1]) ids.add(match[1]);
        });
        return ids;
    }

    function hasVoltageBetween(nodeA, nodeB) {
        if (!nodeA || !nodeB) return false;

        const aHasPhase = hasAnyPhase(nodeA);
        const bHasPhase = hasAnyPhase(nodeB);
        const aHasNeutral = hasPotential(nodeA, 'NEUTRO');
        const bHasNeutral = hasPotential(nodeB, 'NEUTRO');

        if ((aHasPhase && bHasNeutral) || (aHasNeutral && bHasPhase)) {
            return true;
        }

        const phaseIdsA = extractPhaseIds(nodeA);
        const phaseIdsB = extractPhaseIds(nodeB);
        if (!phaseIdsA.size || !phaseIdsB.size) return false;

        for (const phaseA of phaseIdsA) {
            for (const phaseB of phaseIdsB) {
                if (phaseA !== phaseB) return true;
            }
        }

        return false;
    }

    function clampFrame(value) {
        const parsed = parseInt(value, 10);
        if (!Number.isFinite(parsed)) return FRAME_MIN;
        return Math.min(FRAME_MAX, Math.max(FRAME_MIN, parsed));
    }

    function getStoredFrame(comp) {
        return clampFrame(comp?.dataset?.animFrameIndex);
    }

    function setStoredFrame(comp, frame) {
        if (!comp) return;
        comp.dataset.animFrameIndex = String(clampFrame(frame));
    }

    function getLatchedFloatContact(comp, frameIndex) {
        if (!comp) return frameIndex >= FRAME_MAX ? 'BOIA_MARROM' : 'BOIA_AZUL';

        const previous = String(comp.dataset.floatContact || '').toUpperCase();
        let next = previous === 'BOIA_MARROM' ? 'BOIA_MARROM' : 'BOIA_AZUL';

        if (frameIndex <= FRAME_MIN) {
            next = 'BOIA_AZUL';
        } else if (frameIndex >= FRAME_MAX) {
            next = 'BOIA_MARROM';
        }

        comp.dataset.floatContact = next;
        return next;
    }

    function resolveAnimationMode(comp, pumpOn) {
        const draining = comp?.dataset?.manualOn === 'true';
        if (draining) return 'drain';
        if (pumpOn) return 'fill';
        return 'hold';
    }

    function getPumpSeenAt(comp) {
        const value = parseInt(comp?.dataset?.pumpSeenAt || '0', 10);
        return Number.isFinite(value) ? value : 0;
    }

    function getStablePumpOn(comp, rawPumpOn) {
        if (!comp) return !!rawPumpOn;

        const now = Date.now();
        if (rawPumpOn) {
            comp.dataset.pumpSeenAt = String(now);
            comp.dataset.pumpRawOn = 'true';
            comp.dataset.pumpStableOn = 'true';
            return true;
        }

        const lastSeenAt = getPumpSeenAt(comp);
        const stableOn = lastSeenAt > 0 && (now - lastSeenAt) <= PUMP_STICKY_MS;
        comp.dataset.pumpRawOn = 'false';
        comp.dataset.pumpStableOn = stableOn ? 'true' : 'false';
        return stableOn;
    }

    function advanceFrame(comp, mode) {
        if (!comp) return FRAME_MIN;

        const now = Date.now();
        const currentFrame = getStoredFrame(comp);
        const lastTick = parseInt(comp.dataset.animLastTick || `${now}`, 10);
        const previousMode = String(comp.dataset.animMode || 'hold').toLowerCase();
        const nextMode = String(mode || 'hold').toLowerCase();

        if (previousMode !== nextMode) {
            comp.dataset.animMode = nextMode;
            comp.dataset.animLastTick = String(now);
            return currentFrame;
        }

        if (!Number.isFinite(lastTick)) {
            comp.dataset.animMode = nextMode;
            comp.dataset.animLastTick = String(now);
            setStoredFrame(comp, currentFrame);
            return currentFrame;
        }

        if (nextMode === 'hold') {
            comp.dataset.animLastTick = String(now);
            return currentFrame;
        }

        const elapsed = now - lastTick;
        if (elapsed < FRAME_STEP_MS) {
            return currentFrame;
        }

        const steps = Math.max(1, Math.floor(elapsed / FRAME_STEP_MS));
        const nextFrame = nextMode === 'fill'
            ? Math.min(FRAME_MAX, currentFrame + steps)
            : Math.max(FRAME_MIN, currentFrame - steps);

        comp.dataset.animLastTick = String(lastTick + (steps * FRAME_STEP_MS));
        setStoredFrame(comp, nextFrame);

        if (nextMode === 'drain' && nextFrame === FRAME_MIN) {
            comp.dataset.manualOn = 'false';
            comp.dataset.animMode = 'hold';
            comp.dataset.animLastTick = String(now);
        }

        return nextFrame;
    }

    function updateOverflowState(comp, frameIndex, pumpOn) {
        if (!comp) return false;

        const now = Date.now();
        const canOverflow =
            frameIndex >= FRAME_MAX &&
            !!pumpOn &&
            comp.dataset.manualOn !== 'true';

        if (!canOverflow) {
            comp.dataset.overflowSince = '0';
            comp.dataset.overflowActive = 'false';
            return false;
        }

        const startedAt = parseInt(comp.dataset.overflowSince || '0', 10);
        if (!Number.isFinite(startedAt) || startedAt <= 0) {
            comp.dataset.overflowSince = String(now);
            comp.dataset.overflowActive = 'false';
            return false;
        }

        const overflowActive = (now - startedAt) >= OVERFLOW_DELAY_MS;
        comp.dataset.overflowActive = overflowActive ? 'true' : 'false';
        return overflowActive;
    }

    function syncVisual(comp, frameIndex, pumpOn, overflowActive) {
        if (!comp) return;

        const frames = Array.from(comp.querySelectorAll('.real-caixa-boia-frame'));
        frames.forEach(frame => {
            frame.classList.toggle('is-active', frame.dataset.frame === String(frameIndex));
        });

        const water = comp.querySelector('.real-caixa-boia-agua');
        if (water) {
            const showWater = !!pumpOn && comp.dataset.manualOn !== 'true';
            water.classList.toggle('is-active', showWater);
        }

        const drainButton = comp.querySelector('.real-caixa-boia-drain-btn');
        if (drainButton) {
            const draining = comp.dataset.manualOn === 'true';
            drainButton.classList.toggle('is-active', draining);
            drainButton.textContent = draining ? 'Parar' : 'Esvaziar';
        }

        const overflowMessage = comp.querySelector('.real-caixa-boia-overflow-msg');
        if (overflowMessage) {
            overflowMessage.classList.toggle('is-active', !!overflowActive);
        }
    }

    window.COMPONENTES['real_caixa_boia_bomba'] = {
        cat: 'Animacoes 2D',
        nome: 'Caixa d\'agua + boia + bomba',
        icone: 'fa-water',
        tipo: 'animacao_2d',
        tagDefault: 'CX1',
        foto: `${BASE_PATH}/caixa_3.webp`,
        desc: 'Animacao 2D de caixa d\'agua com boia eletrica e bomba. A boia usa preto como comum, azul no frame 0 e marrom no frame 5. A bomba liga com azul e marrom; verde e terra sem funcao logica.',
        html: () => `
            <div
                class="real-caixa-boia-wrap"
                style="width:var(--real-caixa-boia-bomba-width, 960px);height:var(--real-caixa-boia-bomba-height, 720px);position:relative;"
            >
                <div class="real-caixa-boia-scene">
                    <img class="real-caixa-boia-frame is-active" data-frame="0" src="${BASE_PATH}/caixa_0.webp" alt="Caixa frame 0">
                    <img class="real-caixa-boia-frame" data-frame="1" src="${BASE_PATH}/caixa_1.webp" alt="Caixa frame 1">
                    <img class="real-caixa-boia-frame" data-frame="2" src="${BASE_PATH}/caixa_2.webp" alt="Caixa frame 2">
                    <img class="real-caixa-boia-frame" data-frame="3" src="${BASE_PATH}/caixa_3.webp" alt="Caixa frame 3">
                    <img class="real-caixa-boia-frame" data-frame="4" src="${BASE_PATH}/caixa_4.webp" alt="Caixa frame 4">
                    <img class="real-caixa-boia-frame" data-frame="5" src="${BASE_PATH}/caixa_5.webp" alt="Caixa frame 5">
                    <img class="real-caixa-boia-agua" src="${BASE_PATH}/agua.webp" alt="Agua ligada">
                </div>

                <button class="toggle-state-btn real-caixa-boia-drain-btn" type="button" title="Esvaziar a caixa">Esvaziar</button>
                <div class="real-caixa-boia-overflow-msg" aria-live="polite">Caixa derramando</div>

                <div class="pin-label real-caixa-boia-pin-label real-caixa-boia-pin-boia-comum" data-pin-label="C">C</div>
                <div class="pin-label real-caixa-boia-pin-label real-caixa-boia-pin-boia-azul" data-pin-label="A0">A0</div>
                <div class="pin-label real-caixa-boia-pin-label real-caixa-boia-pin-boia-marrom" data-pin-label="A5">A5</div>
                <div class="pin-label real-caixa-boia-pin-label real-caixa-boia-pin-bomba-azul" data-pin-label="AZ">AZ</div>
                <div class="pin-label real-caixa-boia-pin-label real-caixa-boia-pin-bomba-marrom" data-pin-label="MR">MR</div>
                <div class="pin-label real-caixa-boia-pin-label real-caixa-boia-pin-bomba-terra" data-pin-label="PE">PE</div>

                <div class="borne" title="Boia comum (preto)" data-pino="BOIA_COMUM" style="left:36px;top:74px;"></div>
                <div class="borne" title="Boia azul - fecha no frame 0" data-pino="BOIA_AZUL" style="left:36px;top:126px;"></div>
                <div class="borne" title="Boia marrom - fecha no frame 5" data-pino="BOIA_MARROM" style="left:36px;top:178px;"></div>

                <div class="borne" title="Bomba azul" data-pino="BOMBA_AZUL" style="left:36px;top:252px;"></div>
                <div class="borne" title="Bomba marrom" data-pino="BOMBA_MARROM" style="left:36px;top:304px;"></div>
                <div class="borne" title="Terra" data-pino="BOMBA_TERRA" style="left:36px;top:336px;"></div>
            </div>
        `,
        behavior: (inputs, estado, props, comp) => {
            if (!comp) return { novoEstado: false, shorts: [] };

            const bombaAzul = getBorneNode(comp, 'BOMBA_AZUL');
            const bombaMarrom = getBorneNode(comp, 'BOMBA_MARROM');
            const rawPumpOn = hasVoltageBetween(bombaAzul, bombaMarrom);
            const pumpOn = getStablePumpOn(comp, rawPumpOn);
            const animMode = resolveAnimationMode(comp, pumpOn);
            const frameIndex = advanceFrame(comp, animMode);
            const activeFloatContact = getLatchedFloatContact(comp, frameIndex);
            const overflowActive = updateOverflowState(comp, frameIndex, pumpOn);

            const shorts = [['BOIA_COMUM', activeFloatContact]];

            syncVisual(comp, frameIndex, pumpOn, overflowActive);

            return {
                novoEstado: rawPumpOn,
                shorts,
                tipoVisual: overflowActive ? 'alerta' : (pumpOn ? 'ativo' : '')
            };
        }
    };
})();
