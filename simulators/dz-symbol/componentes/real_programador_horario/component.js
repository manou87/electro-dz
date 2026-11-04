(function () {
    'use strict';

    const LIB_KEY = 'real_programador_horario';
    const STYLE_ID = 'real-programador-horario-style';
    const ASSET = './componentes/real_programador_horario/assets/programador_horario.webp';
    const SUPPLY_A = '1';
    const SUPPLY_B = '2';
    const COMMON = '3';
    const NO = '4';
    const NC = '5';
    const DAY_LABELS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
    const DAY_NAMES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const DAY_PRESETS = [
        { label: 'MO TU WE TH FR', days: [1, 1, 1, 1, 1, 0, 0] },
        { label: 'SA SU', days: [0, 0, 0, 0, 0, 1, 1] },
        { label: 'ALL', days: [1, 1, 1, 1, 1, 1, 1] },
        { label: 'MO', days: [1, 0, 0, 0, 0, 0, 0] },
        { label: 'TU', days: [0, 1, 0, 0, 0, 0, 0] },
        { label: 'WE', days: [0, 0, 1, 0, 0, 0, 0] },
        { label: 'TH', days: [0, 0, 0, 1, 0, 0, 0] },
        { label: 'FR', days: [0, 0, 0, 0, 1, 0, 0] },
        { label: 'SA', days: [0, 0, 0, 0, 0, 1, 0] },
        { label: 'SU', days: [0, 0, 0, 0, 0, 0, 1] }
    ];
    const EMPTY_PROGRAMS = [
        { days: [0, 0, 0, 0, 0, 0, 0], hour: 0, minute: 0, action: 'ON' },
        { days: [0, 0, 0, 0, 0, 0, 0], hour: 0, minute: 0, action: 'OFF' }
    ];

    function isSimulating() {
        return typeof simulando !== 'undefined' && !!simulando;
    }

    function asText(value) {
        return String(value == null ? '' : value).trim().toUpperCase();
    }

    function hasToken(set, token) {
        return !!set?.has?.(token);
    }

    function getPhaseIds(set) {
        const ids = new Set();
        set?.forEach?.((value) => {
            const text = asText(value);
            if (text.startsWith('FASE:')) ids.add(text.slice(5));
            if (text.startsWith('TRACE:')) ids.add(text.slice(6));
            if (text === 'FASE') ids.add('GEN');
        });
        return ids;
    }

    function setsIntersect(a, b) {
        for (const item of a) if (b.has(item)) return true;
        return false;
    }

    function getBorne(comp, pin) {
        return comp?.querySelector?.(`.borne[data-pino="${pin}"]`) || null;
    }

    function getNode(comp, pin) {
        return getBorne(comp, pin)?._node || null;
    }

    function getPotentials(comp, pin) {
        return getNode(comp, pin)?.potenciais || new Set();
    }

    function getComponents() {
        if (typeof window.getSimulationActiveComponents === 'function') {
            return window.getSimulationActiveComponents();
        }
        return Array.from(document.querySelectorAll('.component'));
    }

    function sourcePhaseVoltageForNode(node) {
        const phaseIds = getPhaseIds(node?.potenciais || new Set());
        const sources = getComponents().filter((comp) => comp?.dataset?.lib === 'real_fonte_trifasica_nt');
        for (const source of sources) {
            for (const pin of ['L1', 'L2', 'L3']) {
                if (getNode(source, pin) === node) {
                    return source.dataset.phaseVoltage === '220' ? 220 : 127;
                }
                if (phaseIds.has(pin) && getBorne(source, pin)) {
                    return source.dataset.phaseVoltage === '220' ? 220 : 127;
                }
            }
        }
        return 127;
    }

    function measuredVoltage(comp, pinA, pinB) {
        const nodeA = getNode(comp, pinA);
        const nodeB = getNode(comp, pinB);
        if (!nodeA || !nodeB || nodeA === nodeB) return 0;

        const a = getPotentials(comp, pinA);
        const b = getPotentials(comp, pinB);
        const idsA = getPhaseIds(a);
        const idsB = getPhaseIds(b);
        const aPhase = hasToken(a, 'FASE') || idsA.size > 0;
        const bPhase = hasToken(b, 'FASE') || idsB.size > 0;
        const aNeutral = hasToken(a, 'NEUTRO');
        const bNeutral = hasToken(b, 'NEUTRO');

        if ((aPhase && bNeutral) || (bPhase && aNeutral)) {
            return sourcePhaseVoltageForNode(aPhase ? nodeA : nodeB);
        }
        if (aPhase && bPhase) {
            if (idsA.size && idsB.size && setsIntersect(idsA, idsB)) return 0;
            return sourcePhaseVoltageForNode(nodeA) === 220 ? 380 : 220;
        }
        return 0;
    }

    function getSupplyState(comp) {
        const v = measuredVoltage(comp, SUPPLY_A, SUPPLY_B);
        const a = getPotentials(comp, SUPPLY_A);
        const b = getPotentials(comp, SUPPLY_B);
        const hasInput = (a?.size || 0) > 0 || (b?.size || 0) > 0;
        if (!hasInput || v <= 0) return { powered: false, wrong: false, voltage: 0 };
        const valid = (v >= 95 && v <= 135) || (v >= 200 && v <= 240);
        return { powered: valid, wrong: !valid, voltage: Math.round(v) };
    }

    function normalizeMode(value) {
        const mode = asText(value).replace(/[\s-]+/g, '_');
        if (mode === 'ON' || mode === 'OFF' || mode === 'AUTO_ON' || mode === 'AUTO_OFF') return mode;
        if (mode === 'AUTO') return 'AUTO_OFF';
        return 'AUTO_OFF';
    }

    function isAutoMode(mode) {
        return mode === 'AUTO_ON' || mode === 'AUTO_OFF';
    }

    function modeOutputState(mode) {
        if (mode === 'ON' || mode === 'AUTO_ON') return true;
        return false;
    }

    function displayMode(mode) {
        if (mode === 'AUTO_ON') return 'AUTO ON';
        if (mode === 'AUTO_OFF') return 'AUTO OFF';
        return `${mode} MODE`;
    }

    function getMode(comp) {
        const mode = normalizeMode(comp?.dataset?.timerMode);
        if (comp && comp.dataset.timerMode !== mode) comp.dataset.timerMode = mode;
        return mode;
    }

    function cloneProgram(p) {
        return {
            days: Array.isArray(p?.days) && p.days.length === 7 ? p.days.map(v => v ? 1 : 0) : [0, 0, 0, 0, 0, 0, 0],
            hour: clampInt(p?.hour, 0, 23),
            minute: clampInt(p?.minute, 0, 59),
            action: asText(p?.action) === 'OFF' ? 'OFF' : 'ON'
        };
    }

    function getPrograms(comp) {
        try {
            const parsed = JSON.parse(comp?.dataset?.timerPrograms || '');
            if (Array.isArray(parsed) && parsed.length) return parsed.slice(0, 16).map(cloneProgram);
        } catch (_) { }
        const defaults = EMPTY_PROGRAMS.map(cloneProgram);
        if (comp) comp.dataset.timerPrograms = JSON.stringify(defaults);
        return defaults;
    }

    function savePrograms(comp, programs) {
        if (!comp) return;
        comp.dataset.timerPrograms = JSON.stringify((programs || []).slice(0, 16).map(cloneProgram));
    }

    function clampInt(value, min, max) {
        const n = Math.round(Number(value));
        if (!Number.isFinite(n)) return min;
        return Math.max(min, Math.min(max, n));
    }

    function mod(value, size) {
        return ((value % size) + size) % size;
    }

    function getBaseClock(comp) {
        let base = Number(comp?.dataset?.timerClockMinutes);
        if (!Number.isFinite(base)) {
            base = (8 * 60); // segunda 08:00
            if (comp) comp.dataset.timerClockMinutes = String(base);
        }
        return mod(Math.round(base), 7 * 24 * 60);
    }

    function getCurrentClock(comp) {
        const base = getBaseClock(comp);
        const elapsedMs = isSimulating() ? Number(window.simulationElapsedMs || 0) : 0;
        // Acelera a experiencia: 1 segundo real de simulacao = 1 minuto no programador.
        const elapsedMinutes = Number.isFinite(elapsedMs) ? Math.floor(elapsedMs / 1000) : 0;
        const total = mod(base + elapsedMinutes, 7 * 24 * 60);
        return {
            total,
            day: Math.floor(total / (24 * 60)),
            hour: Math.floor((total % (24 * 60)) / 60),
            minute: total % 60
        };
    }

    function setClock(comp, day, hour, minute) {
        if (!comp) return;
        const total = (mod(day, 7) * 24 * 60) + (mod(hour, 24) * 60) + mod(minute, 60);
        const elapsedMs = isSimulating() ? Number(window.simulationElapsedMs || 0) : 0;
        const elapsedMinutes = Number.isFinite(elapsedMs) ? Math.floor(elapsedMs / 1000) : 0;
        comp.dataset.timerClockMinutes = String(mod(total - elapsedMinutes, 7 * 24 * 60));
    }

    function dayPresetIndex(days) {
        const key = (days || []).map(v => v ? '1' : '0').join('');
        const idx = DAY_PRESETS.findIndex(p => p.days.map(v => v ? '1' : '0').join('') === key);
        return idx;
    }

    function daysLabel(days) {
        if (!Array.isArray(days) || days.length !== 7) return '--';
        const preset = DAY_PRESETS.find(p => p.days.every((v, idx) => !!v === !!days[idx]));
        if (preset) return preset.label;
        return DAY_LABELS.filter((_, idx) => days[idx]).join(' ') || '--';
    }

    function format2(n) {
        return String(clampInt(n, 0, 99)).padStart(2, '0');
    }

    function getEditIndex(comp) {
        const idx = Number(comp?.dataset?.timerEditIndex || 0);
        return Number.isFinite(idx) ? Math.max(0, Math.floor(idx)) : 0;
    }

    function isProgramming(comp) {
        return comp?.dataset?.timerProgramMode === 'true';
    }

    function getProgramCommandAtClock(comp, clock = getCurrentClock(comp)) {
        let command = '';
        getPrograms(comp).forEach((program) => {
            if (!program.days?.[clock.day]) return;
            if (program.hour !== clock.hour || program.minute !== clock.minute) return;
            command = program.action === 'OFF' ? 'OFF' : 'ON';
        });
        return command;
    }

    function syncAutoModeWithClock(comp) {
        if (!comp) return getMode(comp);
        let mode = getMode(comp);
        if (!isAutoMode(mode)) return mode;
        const clock = getCurrentClock(comp);
        const clockKey = `${clock.day}:${clock.hour}:${clock.minute}`;
        const command = getProgramCommandAtClock(comp, clock);
        if (command && comp.dataset.timerLastCommandKey !== clockKey) {
            mode = command === 'ON' ? 'AUTO_ON' : 'AUTO_OFF';
            comp.dataset.timerMode = mode;
            comp.dataset.timerLastCommandKey = clockKey;
        }
        if (!command) {
            delete comp.dataset.timerLastCommandKey;
        }
        return mode;
    }

    function shouldCloseNO(comp, supply) {
        if (!supply.powered) return false;
        const mode = syncAutoModeWithClock(comp);
        return modeOutputState(mode);
    }

    function dayIndicatorHtml(activeDays) {
        const mask = Array.isArray(activeDays) && activeDays.length === 7
            ? activeDays.map(v => !!v)
            : [false, false, false, false, false, false, false];
        const labels = DAY_LABELS.map((label, idx) => `<span class="real-programador-day-label" data-active="${mask[idx] ? 'true' : 'false'}">${label}</span>`).join('');
        const arrows = DAY_LABELS.map((_, idx) => `<span class="real-programador-day-arrow" data-active="${mask[idx] ? 'true' : 'false'}">&#9650;</span>`).join('');
        return `<span class="real-programador-days-row">${labels}</span><span class="real-programador-days-row real-programador-days-arrows">${arrows}</span>`;
    }

    function currentDayMask(day) {
        return DAY_LABELS.map((_, idx) => idx === mod(day, 7));
    }

    function renderDisplayText(comp, supply, outputOn) {
        const clock = getCurrentClock(comp);
        const mode = syncAutoModeWithClock(comp);
        if (supply.wrong) {
            return { daysHtml: dayIndicatorHtml(currentDayMask(clock.day)), main: 'ERR', bottom: 'WRONG WIRE' };
        }
        if (isProgramming(comp)) {
            const programs = getPrograms(comp);
            const idx = getEditIndex(comp) % Math.max(1, programs.length);
            const p = programs[idx] || cloneProgram(EMPTY_PROGRAMS[0]);
            return {
                daysHtml: dayIndicatorHtml(p.days),
                main: p.days.some(Boolean) ? `${format2(p.hour)}:${format2(p.minute)}` : '--:--',
                bottom: `P${Math.floor(idx / 2) + 1} ${p.action} ${daysLabel(p.days)}`
            };
        }
        return {
            daysHtml: dayIndicatorHtml(currentDayMask(clock.day)),
            main: supply.powered ? `${format2(clock.hour)}:${format2(clock.minute)}` : 'OFF',
            bottom: displayMode(mode)
        };
    }

    function updateVisual(comp, supply, outputOn) {
        if (!comp) return;
        const mode = getMode(comp);
        comp.dataset.timerPowered = supply.powered ? 'true' : 'false';
        comp.dataset.timerOutputOn = outputOn ? 'true' : 'false';

        const text = renderDisplayText(comp, supply, outputOn);
        const display = comp.querySelector('.real-programador-display');
        if (display) {
            display.querySelector('[data-timer-display-top]').innerHTML = text.daysHtml;
            display.querySelector('[data-timer-display-main]').textContent = text.main;
            display.querySelector('[data-timer-display-bottom]').textContent = text.bottom;
        }

        const modeLabel = comp.querySelector('.real-programador-mode');
        if (modeLabel) modeLabel.textContent = displayMode(mode);

        const led = comp.querySelector('.real-programador-led');
        if (led) {
            led.classList.toggle('powered', !!supply.powered && !supply.wrong);
            led.classList.toggle('on', !!supply.powered && !supply.wrong && !!outputOn);
            led.classList.toggle('off', !!supply.powered && !supply.wrong && !outputOn);
        }

        const badge = comp.querySelector('.real-programador-status');
        if (badge) {
            badge.textContent = '';
            badge.hidden = true;
            delete badge.dataset.kind;
        }
    }

    function refreshComponent(comp) {
        const supply = getSupplyState(comp);
        const outputOn = shouldCloseNO(comp, supply);
        updateVisual(comp, supply, outputOn);
    }

    function cycleMode(comp) {
        if (!comp) return;
        const current = syncAutoModeWithClock(comp);
        const order = ['ON', 'OFF', 'AUTO_ON', 'AUTO_OFF'];
        const next = order[(Math.max(0, order.indexOf(current)) + 1) % order.length];
        comp.dataset.timerMode = next;
        if (!isAutoMode(next)) delete comp.dataset.timerLastCommandKey;
        runStepOrRefresh(comp);
    }

    function runStepOrRefresh(comp) {
        if (isSimulating() && typeof window.engineStep === 'function') window.engineStep();
        else refreshComponent(comp);
        if (typeof scheduleHistoryCheckpoint === 'function') scheduleHistoryCheckpoint('programador_horario');
    }

    function ensureProgramSlot(comp) {
        const programs = getPrograms(comp);
        while (programs.length < 2) programs.push(cloneProgram(programs.length % 2 ? EMPTY_PROGRAMS[1] : EMPTY_PROGRAMS[0]));
        savePrograms(comp, programs);
        return programs;
    }

    function handleTimerButton(comp, action) {
        if (!comp) return;
        const clock = getCurrentClock(comp);
        const programs = ensureProgramSlot(comp);
        let idx = getEditIndex(comp) % programs.length;
        const current = programs[idx];

        if (action === 'prog') {
            if (!isProgramming(comp)) {
                comp.dataset.timerProgramMode = 'true';
                comp.dataset.timerEditIndex = '0';
            } else {
                idx += 1;
                if (idx >= programs.length) {
                    const addOn = cloneProgram(EMPTY_PROGRAMS[0]);
                    const addOff = cloneProgram(EMPTY_PROGRAMS[1]);
                    programs.push(addOn, addOff);
                    idx = programs.length - 2;
                    if (programs.length > 8) {
                        comp.dataset.timerProgramMode = 'false';
                        idx = 0;
                    }
                    savePrograms(comp, programs.slice(0, 8));
                }
                comp.dataset.timerEditIndex = String(idx);
            }
            runStepOrRefresh(comp);
            return;
        }

        if (action === 'clock') {
            comp.dataset.timerProgramMode = 'false';
            runStepOrRefresh(comp);
            return;
        }

        if (action === 'reset') {
            comp.dataset.timerProgramMode = 'false';
            comp.dataset.timerMode = 'AUTO_OFF';
            delete comp.dataset.timerLastCommandKey;
            comp.dataset.timerClockMinutes = String(8 * 60);
            savePrograms(comp, EMPTY_PROGRAMS);
            runStepOrRefresh(comp);
            return;
        }

        if (action === 'manual') {
            if (isProgramming(comp)) {
                current.days = [0, 0, 0, 0, 0, 0, 0];
                current.hour = 0;
                current.minute = 0;
                programs[idx] = current;
                savePrograms(comp, programs);
                runStepOrRefresh(comp);
                return;
            }
            comp.dataset.timerProgramMode = 'false';
            cycleMode(comp);
            return;
        }

        if (isProgramming(comp)) {
            if (action === 'day') {
                const nextPreset = DAY_PRESETS[(dayPresetIndex(current.days) + 1) % DAY_PRESETS.length];
                current.days = nextPreset.days.slice();
            }
            if (action === 'hour') current.hour = mod(current.hour + 1, 24);
            if (action === 'minute') current.minute = mod(current.minute + 1, 60);
            programs[idx] = current;
            savePrograms(comp, programs);
            runStepOrRefresh(comp);
            return;
        }

        if (action === 'day') setClock(comp, clock.day + 1, clock.hour, clock.minute);
        if (action === 'hour') setClock(comp, clock.day, clock.hour + 1, clock.minute);
        if (action === 'minute') setClock(comp, clock.day, clock.hour, clock.minute + 1);
        runStepOrRefresh(comp);
    }

    function ensureStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
.component[data-lib="${LIB_KEY}"] > .tag-label { display: none !important; }
.real-programador-wrap {
    position: relative;
    width: 172px;
    height: 374px;
    transform:
        translate(var(--real-programador-horario-offset-x, 0px), var(--real-programador-horario-offset-y, 0px))
        scale(var(--real-programador-horario-scale-x, 1), var(--real-programador-horario-scale, 1));
    transform-origin: center center;
}
.real-programador-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
    user-select: none;
}
.real-programador-borne { transform: translate(-50%, -50%); }
.real-programador-led {
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #263238;
    box-shadow: 0 0 0 1px rgba(0,0,0,.35) inset;
    pointer-events: none;
}
.real-programador-led.off {
    background: #22c55e;
    box-shadow: 0 0 8px rgba(34,197,94,.9), 0 0 0 1px rgba(255,255,255,.28) inset;
}
.real-programador-led.on {
    background: #f44336;
    box-shadow: 0 0 8px rgba(244,67,54,.9), 0 0 0 1px rgba(255,255,255,.28) inset;
}
.real-programador-display {
    position: absolute;
    display: grid;
    grid-template-rows: 14px 15px 9px;
    align-items: center;
    justify-items: center;
    color: #1b2a1d;
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
    background: rgba(126, 157, 126, .78);
    border-radius: 2px;
    overflow: hidden;
    pointer-events: none;
}
.real-programador-display-top { width: 100%; display: grid; gap: 0; align-self: stretch; padding: 1px 3px 0; box-sizing: border-box; font-size: 4.6px; font-weight: 900; line-height: 1; }
.real-programador-days-row { display: grid; grid-template-columns: repeat(7, 1fr); width: 100%; text-align: center; }
.real-programador-days-arrows { margin-top: -1px; }
.real-programador-day-arrow { visibility: hidden; font-size: 4.8px; line-height: 1; }
.real-programador-day-arrow[data-active="true"] { visibility: visible; }
.real-programador-display-bottom { max-width: 100%; padding: 0 2px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 6.2px; font-weight: 800; letter-spacing: -.03em; }
.real-programador-display-main { font-size: 13px; font-weight: 900; letter-spacing: .02em; }
.real-programador-mode {
    position: absolute;
    left: calc(42px + var(--real-programador-horario-mode-x, 0px));
    top: calc(171px + var(--real-programador-horario-mode-y, 0px));
    min-width: 48px;
    padding: 2px 4px;
    border-radius: 7px;
    text-align: center;
    color: #fff;
    background: rgba(20, 75, 150, .92);
    font: 700 9px/1.2 system-ui, sans-serif;
    pointer-events: none;
    display: none;
}
.real-programador-btn {
    position: absolute;
    width: 23px;
    height: 21px;
    border: 0;
    padding: 0;
    border-radius: 3px;
    background: transparent;
    color: transparent;
    cursor: pointer;
}
.real-programador-btn:hover { background: transparent; }
body.engineering-mode .real-programador-btn {
    background: rgba(245,158,11,.22);
    outline: 1.5px dashed #f59e0b;
}
.real-programador-status {
    position: absolute;
    left: 50%;
    bottom: -22px;
    transform: translateX(-50%);
    white-space: nowrap;
    padding: 2px 7px;
    border-radius: 999px;
    background: #0f766e;
    color: #fff;
    font: 700 10px/1.3 system-ui, sans-serif;
    box-shadow: 0 1px 4px rgba(0,0,0,.16);
    pointer-events: none;
}
.real-programador-status[data-kind="erro"] { background: #dc2626; }
`;
        document.head.appendChild(style);
    }

    function timerButton(action, label, cls, title, left, top, width = 23, height = 21) {
        const style = `left:calc(${left}px + var(--real-programador-horario-${action}-x, 0px));top:calc(${top}px + var(--real-programador-horario-${action}-y, 0px));width:${width}px;height:${height}px;`;
        return `<button type="button" class="real-programador-btn ${cls}" data-timer-action="${action}" style="${style}" title="${title}" aria-label="${label}">${label}</button>`;
    }

    function html() {
        return `
            <div class="real-programador-wrap">
                <img class="real-programador-img" src="${ASSET}" alt="Programador horario">
                <div class="real-programador-led" title="Output" style="left:calc(10px + var(--real-programador-horario-led-x, 0px));top:calc(80px + var(--real-programador-horario-led-y, 0px));"></div>
                <div class="real-programador-display" style="left:calc(33px + var(--real-programador-horario-display-x, 0px));top:calc(86px + var(--real-programador-horario-display-y, 0px));width:var(--real-programador-horario-display-width, 67px);height:var(--real-programador-horario-display-height, 38px);">
                    <span class="real-programador-display-top" data-timer-display-top></span>
                    <span class="real-programador-display-main" data-timer-display-main>08:00</span>
                    <span class="real-programador-display-bottom" data-timer-display-bottom>AUTO OFF</span>
                </div>
                <div class="real-programador-mode">AUTO OFF</div>
                ${timerButton('prog', 'P', 'real-programador-btn-prog', 'Program / next program', 17, 151)}
                ${timerButton('day', 'D+', 'real-programador-btn-day', 'Set program day or days', 47, 151)}
                ${timerButton('hour', 'H+', 'real-programador-btn-hour', 'Set hour', 76, 151)}
                ${timerButton('minute', 'M+', 'real-programador-btn-minute', 'Set minute', 104, 151)}
                ${timerButton('clock', 'CLOCK', 'real-programador-btn-clock', 'Back to clock', 17, 187)}
                ${timerButton('reset', 'RESET', 'real-programador-btn-reset', 'Reset clock and programs', 48, 187)}
                ${timerButton('manual', 'MANUAL', 'real-programador-btn-manual', 'Toggle AUTO / ON / OFF or clear selected program', 82, 187, 38, 21)}
                <span class="real-programador-status" hidden></span>

                <div class="borne real-programador-borne" data-pino="1" style="left:31px;top:16px;"></div>
                <div class="borne real-programador-borne" data-pino="2" style="left:65px;top:16px;"></div>
                <div class="borne real-programador-borne" data-pino="5" style="left:35px;top:272px;"></div>
                <div class="borne real-programador-borne" data-pino="4" style="left:66px;top:272px;"></div>
                <div class="borne real-programador-borne" data-pino="3" style="left:97px;top:272px;"></div>
            </div>
        `;
    }

    function exportData(comp) {
        return {
            timerMode: getMode(comp),
            timerPrograms: getPrograms(comp),
            timerClockMinutes: getCurrentClock(comp).total,
            timerProgramMode: isProgramming(comp),
            timerEditIndex: getEditIndex(comp)
        };
    }

    function importData(comp, payload) {
        if (!comp || !payload || typeof payload !== 'object') return;
        comp.dataset.timerMode = normalizeMode(payload.timerMode);
        if (Array.isArray(payload.timerPrograms)) savePrograms(comp, payload.timerPrograms);
        const clockMinutes = Number(payload.timerClockMinutes);
        if (Number.isFinite(clockMinutes)) {
            comp.dataset.timerClockMinutes = String(mod(Math.round(clockMinutes), 7 * 24 * 60));
        }
        comp.dataset.timerProgramMode = payload.timerProgramMode === true ? 'true' : 'false';
        const editIndex = Number(payload.timerEditIndex);
        comp.dataset.timerEditIndex = String(Number.isFinite(editIndex) ? Math.max(0, Math.floor(editIndex)) : 0);
        delete comp.dataset.timerLastCommandKey;
        refreshComponent(comp);
    }
    ensureStyle();

    window.COMPONENTES = window.COMPONENTES || {};
    window.BIBLIOTECA = window.COMPONENTES;
    window.COMPONENTES[LIB_KEY] = {
        cat: 'Componentes Reais',
        nome: 'Programador Horário',
        icone: 'fa-clock',
        tipo: 'temporizador',
        foto: ASSET,
        showTag: false,
        clickableSim: true,
        html,
        mountComponent: comp => {
            comp.dataset.clickableSim = 'true';
            refreshComponent(comp);
        },
        exportData,
        importData,
        behavior: (inputs, estado, props, comp) => {
            const supply = getSupplyState(comp);
            const outputOn = shouldCloseNO(comp, supply);
            updateVisual(comp, supply, outputOn);
            return {
                novoEstado: !!outputOn,
                shorts: outputOn ? [[COMMON, NO]] : [[COMMON, NC]],
                tipoVisual: outputOn ? 'ativo-local' : ''
            };
        }
    };

    document.addEventListener('click', (event) => {
        const btn = event.target?.closest?.(`.component[data-lib="${LIB_KEY}"] [data-timer-action]`);
        if (!btn) return;
        event.preventDefault();
        if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
        event.stopPropagation();
        handleTimerButton(btn.closest('.component'), btn.dataset.timerAction);
    }, true);
})();