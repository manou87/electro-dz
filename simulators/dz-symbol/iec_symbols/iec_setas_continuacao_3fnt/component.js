window.COMPONENTES['iec_setas_continuacao_3fnt'] = {
    cat: 'Simbologia IEC',
    nome: 'Setas Continua\u00e7\u00e3o 3F + N + T',
    icone: 'fa-right-long',
    tipo: 'contato',
    tagDefault: 'X1',
    html: () => `
        <div style="width:156px;height:126px;position:relative;">
            <svg width="156" height="126" style="position:absolute;left:0;top:0;overflow:visible;">
                <circle cx="30" cy="18" r="2.4" fill="#111"/>
                <line x1="30" y1="18" x2="66" y2="18" stroke="#111" stroke-width="1.6"/>
                <polygon points="76,18 66,13.5 66,22.5" fill="#fff" stroke="#c0392b" stroke-width="1.2"/>
                <text x="84" y="22" fill="#111" font-size="10" font-weight="400">L1</text>

                <circle cx="30" cy="38" r="2.4" fill="#111"/>
                <line x1="30" y1="38" x2="66" y2="38" stroke="#111" stroke-width="1.6"/>
                <polygon points="76,38 66,33.5 66,42.5" fill="#fff" stroke="#c0392b" stroke-width="1.2"/>
                <text x="84" y="42" fill="#111" font-size="10" font-weight="400">L2</text>

                <circle cx="30" cy="58" r="2.4" fill="#111"/>
                <line x1="30" y1="58" x2="66" y2="58" stroke="#111" stroke-width="1.6"/>
                <polygon points="76,58 66,53.5 66,62.5" fill="#fff" stroke="#c0392b" stroke-width="1.2"/>
                <text x="84" y="62" fill="#111" font-size="10" font-weight="400">L3</text>

                <circle cx="30" cy="78" r="2.4" fill="#111"/>
                <line x1="30" y1="78" x2="66" y2="78" stroke="#111" stroke-width="1.6"/>
                <polygon points="76,78 66,73.5 66,82.5" fill="#fff" stroke="#c0392b" stroke-width="1.2"/>
                <text x="84" y="82" fill="#111" font-size="10" font-weight="400">N</text>

                <circle cx="30" cy="98" r="2.4" fill="#111"/>
                <line x1="30" y1="98" x2="66" y2="98" stroke="#111" stroke-width="1.6"/>
                <polygon points="76,98 66,93.5 66,102.5" fill="#fff" stroke="#27ae60" stroke-width="1.2"/>
                <text x="84" y="102" fill="#111" font-size="10" font-weight="400">PE</text>
            </svg>

            <div class="borne" data-pino="L1" style="left:calc(28px + var(--iec-setas-continuacao-3fnt-in-x, 0px));top:calc(18px + var(--iec-setas-continuacao-3fnt-l1-y, 0px));"></div>
            <div class="borne" data-pino="L2" style="left:calc(28px + var(--iec-setas-continuacao-3fnt-in-x, 0px));top:calc(38px + var(--iec-setas-continuacao-3fnt-l2-y, 0px));"></div>
            <div class="borne" data-pino="L3" style="left:calc(28px + var(--iec-setas-continuacao-3fnt-in-x, 0px));top:calc(58px + var(--iec-setas-continuacao-3fnt-l3-y, 0px));"></div>
            <div class="borne" data-pino="N" style="left:calc(28px + var(--iec-setas-continuacao-3fnt-in-x, 0px));top:calc(78px + var(--iec-setas-continuacao-3fnt-n-y, 0px));"></div>
            <div class="borne" data-pino="T" style="left:calc(28px + var(--iec-setas-continuacao-3fnt-in-x, 0px));top:calc(98px + var(--iec-setas-continuacao-3fnt-t-y, 0px));"></div>
        </div>
    `,
    behavior: () => ({
        novoEstado: true,
        shorts: []
    })
};
