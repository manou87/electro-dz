window.COMPONENTES['real_fonte_trifasica_nt'] = {
    cat: 'Componentes Reais',
    nome: 'Fonte Trifásica + N + T',
    icone: 'fa-plug',
    tipo: 'fonte-mista',
    foto: './componentes/real_fonte_trifasica_nt/info.svg',
    html: () => `
        <div style="width:210px;height:120px;position:relative;">
            <svg width="210" height="120" style="position:absolute;left:0;top:0;">
                <rect x="12" y="10" width="168" height="98" rx="8" fill="#ecf1f6" stroke="#2d3436" stroke-width="2"/>
                <rect x="20" y="18" width="152" height="16" rx="4" fill="#dfe6e9" />
                <text x="96" y="30" fill="#2d3436" font-size="11" font-weight="700" text-anchor="middle">ALIMENTAÇÃO 3F + N + T</text>

                <!-- L1 -->
                <text x="36" y="50" fill="#d63031" font-size="11" font-weight="700" text-anchor="middle">L1</text>
                <circle cx="36" cy="65" r="7" fill="#d63031"/>
                <line x1="36" y1="72" x2="36" y2="108" stroke="#d63031" stroke-width="2.5" stroke-linecap="round"/>

                <!-- L2 -->
                <text x="64" y="50" fill="#e17055" font-size="11" font-weight="700" text-anchor="middle">L2</text>
                <circle cx="64" cy="65" r="7" fill="#e17055"/>
                <line x1="64" y1="72" x2="64" y2="108" stroke="#e17055" stroke-width="2.5" stroke-linecap="round"/>

                <!-- L3 -->
                <text x="92" y="50" fill="#6c5ce7" font-size="11" font-weight="700" text-anchor="middle">L3</text>
                <circle cx="92" cy="65" r="7" fill="#6c5ce7"/>
                <line x1="92" y1="72" x2="92" y2="108" stroke="#6c5ce7" stroke-width="2.5" stroke-linecap="round"/>

                <!-- N -->
                <text x="120" y="50" fill="#0984e3" font-size="11" font-weight="700" text-anchor="middle">N</text>
                <circle cx="120" cy="65" r="7" fill="#0984e3"/>
                <line x1="120" y1="72" x2="120" y2="108" stroke="#0984e3" stroke-width="2.5" stroke-linecap="round"/>

                <!-- T -->
                <text x="148" y="50" fill="#00b894" font-size="11" font-weight="700" text-anchor="middle">T</text>
                <circle cx="148" cy="65" r="7" fill="#00b894"/>
                <line x1="148" y1="72" x2="148" y2="108" stroke="#00b894" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
            <div class="borne" data-pino="L1" data-potential="FASE" style="left:22px;top:55px;"></div>
            <div class="borne" data-pino="L2" data-potential="FASE" style="left:50px;top:55px;"></div>
            <div class="borne" data-pino="L3" data-potential="FASE" style="left:78px;top:55px;"></div>
            <div class="borne" data-pino="N" data-potential="NEUTRO" style="left:106px;top:55px;"></div>
            <div class="borne" data-pino="T" style="left:134px;top:55px;"></div>
        </div>
    `,
    behavior: () => ({ novoEstado: true, shorts: [] })
};
