window.COMPONENTES['real_temporizador'] = {
    cat: 'Componentes Reais',
    nome: 'Temporizador',
    icone: 'fa-clock',
    tipo: 'contato',
    tagDefault: 'RT1',
    foto: './componentes/real_temporizador/rele_temporizador.webp',
    html: () => `
        <div class="real-temporizador-wrap" style="width:70px;height:189px;position:relative;left:4px;">
            <img
                class="real-temporizador-img"
                src="./componentes/real_temporizador/rele_temporizador.webp"
                alt="Temporizador"
                style="width:100%;height:100%;object-fit:contain;pointer-events:none;"
            >
            <div class="timer-label real-temporizador-timer" data-timer-seconds="3" style="position:absolute;width:28px;text-align:center;font-family:monospace;font-weight:bold;color:#f00;background:rgba(0,0,0,0.8);border-radius:2px;">3s</div>
            <div class="real-temporizador-led real-temporizador-led-energy" title="Rele energizado"></div>
            <div class="real-temporizador-led real-temporizador-led-done" title="Tempo concluido"></div>

            <div class="borne" data-pino="A1" style="top:4px;left:6px;"></div>
            <div class="borne" data-pino="A2" style="top:4px;left:45px;"></div>
            <div class="borne" data-pino="18" style="bottom:4px;left:6px;"></div>
            <div class="borne" data-pino="15" style="bottom:4px;left:26px;"></div>
            <div class="borne" data-pino="16" style="bottom:4px;left:45px;"></div>
        </div>
    `,
    behavior: (inputs, estado, props, comp) => {
        const now = Date.now();
        const DEENERGIZE_HOLD_MS = 360;
        const timerLabel = comp?.querySelector?.('.timer-label');
        const ledEnergy = comp?.querySelector?.('.real-temporizador-led-energy');
        const ledDone = comp?.querySelector?.('.real-temporizador-led-done');

        const rawSeconds = timerLabel?.dataset?.timerSeconds || '3';
        const parsed = parseFloat(String(rawSeconds).replace(',', '.'));
        const delaySec = Number.isFinite(parsed) && parsed > 0 ? Math.max(1, Math.round(parsed)) : 3;

        const getNode = (pino) => {
            const b = comp?.querySelector?.(`.borne[data-pino="${pino}"]`);
            return b ? b._node : null;
        };
        const getPhaseIds = (node) => {
            const ids = new Set();
            if (!node || !node.potenciais) return ids;
            node.potenciais.forEach(p => {
                if (typeof p === 'string' && p.startsWith('FASE:')) {
                    ids.add(p.slice('FASE:'.length));
                }
            });
            return ids;
        };

        const nA1 = getNode('A1');
        const nA2 = getNode('A2');
        const a1F = nA1?.potenciais?.has?.('FASE') || false;
        const a1N = nA1?.potenciais?.has?.('NEUTRO') || false;
        const a2F = nA2?.potenciais?.has?.('FASE') || false;
        const a2N = nA2?.potenciais?.has?.('NEUTRO') || false;
        const hasNodeEvidence = !!(nA1?.potenciais && nA2?.potenciais);

        let energized = (a1F && a2N) || (a1N && a2F);
        if (!energized) {
            const p1 = getPhaseIds(nA1);
            const p2 = getPhaseIds(nA2);
            if (p1.size && p2.size) {
                energized = true;
                p1.forEach(id => {
                    if (p2.has(id)) energized = false;
                });
            }
        }
        if (!energized && !hasNodeEvidence && typeof props?.coilEnergized === 'boolean') {
            energized = props.coilEnergized;
        }
        if (!energized && !hasNodeEvidence) {
            const a1 = inputs['A1'];
            const a2 = inputs['A2'];
            energized = !!(a1 && a2 && a1 !== a2);
        }
        if (!energized) {
            const holdUntil = Number(comp?._rtDropHoldUntil || 0);
            if (holdUntil > now && comp?._rtHeldResult) {
                if (ledEnergy) ledEnergy.style.opacity = '1';
                if (ledDone) ledDone.style.opacity = comp._rtHeldDone ? '1' : '0.2';
                if (timerLabel && comp._rtHeldLabel) timerLabel.innerText = comp._rtHeldLabel;
                comp._rtDone = !!comp._rtHeldDone;
                return {
                    novoEstado: !!comp._rtHeldResult.novoEstado,
                    shorts: Array.isArray(comp._rtHeldResult.shorts) ? comp._rtHeldResult.shorts.slice() : [],
                    tipoVisual: comp._rtHeldResult.tipoVisual || ''
                };
            }

            comp._rtDropHoldUntil = 0;
            comp._rtHeldResult = null;
            comp._rtHeldDone = false;
            comp._rtHeldLabel = `${delaySec}s`;
            if (ledEnergy) ledEnergy.style.opacity = '0.2';
            if (ledDone) ledDone.style.opacity = '0.2';
            comp._rtStartMs = null;
            comp._rtDone = false;
            if (timerLabel) timerLabel.innerText = `${delaySec}s`;
            return { novoEstado: false, shorts: [['15', '16']], tipoVisual: '' };
        }

        if (ledEnergy) ledEnergy.style.opacity = '1';

        if (!comp._rtStartMs) comp._rtStartMs = now;
        const elapsedSec = (now - comp._rtStartMs) / 1000;
        const remaining = Math.max(0, delaySec - elapsedSec);

        if (timerLabel) timerLabel.innerText = `${Math.ceil(remaining)}s`;

        let result;
        if (remaining <= 0) {
            const gapMs = 35;
            const totalElapsedMs = now - comp._rtStartMs;
            const targetMs = delaySec * 1000;

            if (totalElapsedMs < targetMs + gapMs) {
                comp._rtDone = false;
                // Morto: Sem conexao para garantir troca limpa
                result = { novoEstado: false, shorts: [], tipoVisual: 'ativo' };
            } else {
                comp._rtDone = true;
                result = { novoEstado: true, shorts: [['15', '18']], tipoVisual: 'ativo' };
            }
        } else {
            comp._rtDone = false;
            result = { novoEstado: false, shorts: [['15', '16']], tipoVisual: 'temporizando' };
        }

        if (ledDone) ledDone.style.opacity = comp._rtDone ? '1' : '0.2';
        comp._rtDropHoldUntil = now + DEENERGIZE_HOLD_MS;
        comp._rtHeldDone = !!comp._rtDone;
        comp._rtHeldLabel = timerLabel?.innerText || `${delaySec}s`;
        comp._rtHeldResult = {
            novoEstado: !!result.novoEstado,
            shorts: Array.isArray(result.shorts) ? result.shorts.slice() : [],
            tipoVisual: result.tipoVisual || ''
        };
        return result;
    }
};
