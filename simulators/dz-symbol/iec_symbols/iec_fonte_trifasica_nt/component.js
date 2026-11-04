window.COMPONENTES['iec_fonte_trifasica_nt'] = {
    cat: 'Simbologia IEC',
    nome: 'Fonte Trif\u00e1sica + N + T',
    icone: 'fa-plug-circle-bolt',
    tipo: 'fonte-mista',
    html: () => `
        <div style="width:136px;height:126px;position:relative;">
            <svg width="136" height="126" style="position:absolute;left:0;top:0;overflow:visible;">
                <text x="18" y="22" fill="#111" font-size="11" font-weight="400">L1</text>
                <line x1="38" y1="18" x2="86" y2="18" stroke="#111" stroke-width="1.6"/>
                <circle cx="38" cy="18" r="2.4" fill="#111"/>

                <text x="18" y="42" fill="#111" font-size="11" font-weight="400">L2</text>
                <line x1="38" y1="38" x2="86" y2="38" stroke="#111" stroke-width="1.6"/>
                <circle cx="38" cy="38" r="2.4" fill="#111"/>

                <text x="18" y="62" fill="#111" font-size="11" font-weight="400">L3</text>
                <line x1="38" y1="58" x2="86" y2="58" stroke="#111" stroke-width="1.6"/>
                <circle cx="38" cy="58" r="2.4" fill="#111"/>

                <text x="22" y="82" fill="#111" font-size="11" font-weight="400">N</text>
                <line x1="38" y1="78" x2="86" y2="78" stroke="#111" stroke-width="1.6"/>
                <circle cx="38" cy="78" r="2.4" fill="#111"/>

                <text x="16" y="102" fill="#111" font-size="11" font-weight="400">PE</text>
                <line x1="38" y1="98" x2="86" y2="98" stroke="#111" stroke-width="1.6"/>
                <circle cx="38" cy="98" r="2.4" fill="#111"/>
            </svg>

            <div class="borne" data-pino="L1" data-potential="FASE" style="left:calc(84px + var(--iec-fonte-3fnt-borne-x));top:calc(18px + var(--iec-fonte-3fnt-l1-y));"></div>
            <div class="borne" data-pino="L2" data-potential="FASE" style="left:calc(84px + var(--iec-fonte-3fnt-borne-x));top:calc(38px + var(--iec-fonte-3fnt-l2-y));"></div>
            <div class="borne" data-pino="L3" data-potential="FASE" style="left:calc(84px + var(--iec-fonte-3fnt-borne-x));top:calc(58px + var(--iec-fonte-3fnt-l3-y));"></div>
            <div class="borne" data-pino="N" data-potential="NEUTRO" style="left:calc(84px + var(--iec-fonte-3fnt-borne-x));top:calc(78px + var(--iec-fonte-3fnt-n-y));"></div>
            <div class="borne" data-pino="T" style="left:calc(84px + var(--iec-fonte-3fnt-borne-x));top:calc(98px + var(--iec-fonte-3fnt-t-y));"></div>
        </div>
    `,
    behavior: () => ({ novoEstado: true, shorts: [] })
};
