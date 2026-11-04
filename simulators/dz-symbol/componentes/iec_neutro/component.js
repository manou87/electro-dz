window.COMPONENTES['iec_neutro'] = {
    cat: 'Simbologia IEC',
    nome: 'Neutro (N)',
    icone: 'fa-minus',
    tipo: 'fonte-neutro',
    html: () => `
        <div style=\"width:50px;height:30px;position:relative;\">
            <svg width=\"40\" height=\"20\" style=\"position:relative;left:8px;top:8px;\">
                <text x=\"0\" y=\"15\" fill=\"blue\" font-size=\"14\" font-weight=\"bold\">N</text>
                <line x1=\"15\" y1=\"10\" x2=\"40\" y2=\"10\" stroke=\"blue\" stroke-width=\"2\"/>
                <circle cx=\"15\" cy=\"10\" r=\"3\" fill=\"blue\"/>
            </svg>
            <div class=\"borne\" data-pino=\"N\" style=\"left:calc(40px + var(--iec-neutro-borne-x));top:calc(10px + var(--iec-neutro-borne-y));\"></div>
        </div>
    `,
    behavior: () => ({ novoEstado: true, shorts: [] })
};
