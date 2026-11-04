window.COMPONENTES['iec_fase'] = {
    cat: 'Simbologia IEC',
    nome: 'Fase (L)',
    icone: 'fa-bolt',
    tipo: 'fonte-fase',
    html: () => `
        <div style=\"width:50px;height:30px;position:relative;\">
            <svg width=\"40\" height=\"20\" style=\"position:relative;left:8px;top:8px;\">
                <text x=\"0\" y=\"15\" fill=\"red\" font-size=\"14\" font-weight=\"bold\">L</text>
                <line x1=\"15\" y1=\"10\" x2=\"40\" y2=\"10\" stroke=\"red\" stroke-width=\"2\"/>
                <circle cx=\"15\" cy=\"10\" r=\"3\" fill=\"red\"/>
            </svg>
            <div class=\"borne\" data-pino=\"L\" style=\"left:calc(40px + var(--iec-fase-borne-x));top:calc(11px + var(--iec-fase-borne-y));\"></div>
        </div>
    `,
    behavior: () => ({ novoEstado: true, shorts: [] })
};
