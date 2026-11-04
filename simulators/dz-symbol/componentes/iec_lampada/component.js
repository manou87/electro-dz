window.COMPONENTES['iec_lampada'] = {
    cat: 'Simbologia IEC',
    nome: 'Sinaleiro',
    icone: 'fa-lightbulb',
    foto: './componentes/iec_lampada/info.svg',
    tipo: 'carga',
    html: () => `
        <svg width=\"40\" height=\"60\">
            <circle cx=\"20\" cy=\"30\" r=\"15\" fill=\"white\" stroke=\"black\" stroke-width=\"2\" class=\"lamp-body\"/>
            <line x1=\"20\" y1=\"0\" x2=\"20\" y2=\"15\" stroke=\"black\" stroke-width=\"2\"/>
            <line x1=\"20\" y1=\"45\" x2=\"20\" y2=\"60\" stroke=\"black\" stroke-width=\"2\"/>
        </svg>
        <div class=\"borne\" data-pino=\"X1\" style=\"left:calc(12px + var(--iec-lampada-borne-x));top:calc(-5px + var(--iec-lampada-borne-top-y));\"></div>
        <div class=\"borne\" data-pino=\"X2\" style=\"left:calc(12px + var(--iec-lampada-borne-x));top:calc(55px + var(--iec-lampada-borne-bottom-y));\"></div>
    `,
    behavior: (inputs) => {
        const x1 = inputs['X1'];
        const x2 = inputs['X2'];
        const parse = (v) => String(v || '').trim().toUpperCase();
        const p1 = parse(x1);
        const p2 = parse(x2);
        const isPhase = (p) => p === 'FASE' || p.startsWith('FASE:');
        const isNeutro = (p) => p === 'NEUTRO';
        const phaseId = (p) => p.startsWith('FASE:') ? p.slice(5) : '';
        const faseNeutro = (isPhase(p1) && isNeutro(p2)) || (isNeutro(p1) && isPhase(p2));

        let faseFase = false;
        if (isPhase(p1) && isPhase(p2)) {
            const id1 = phaseId(p1);
            const id2 = phaseId(p2);
            faseFase = (id1 && id2) ? id1 !== id2 : true; // fallback para fases sem id
        }

        return { novoEstado: faseNeutro || faseFase, shorts: [] };
    }
};

