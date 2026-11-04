window.COMPONENTES['real_fusivel_tripolar'] = {
    cat: 'Componentes Reais',
    nome: 'Fusivel Tripolar',
    icone: 'fa-bolt',
    tipo: 'protecao',
    tagDefault: 'FU1',
    foto: './componentes/real_fusivel_tripolar/fusivel_tripolar.webp',
    html: () => `
        <div class="real-fusivel-tripolar-wrap" style="width:166px;height:182px;position:relative;left:2px;">
            <img
                class="real-fusivel-tripolar-img"
                src="./componentes/real_fusivel_tripolar/fusivel_tripolar.webp"
                alt="Fusivel tripolar"
                style="width:100%;height:100%;object-fit:contain;pointer-events:none;"
            >
            <div class="borne" data-pino="1" data-label="1" style="top:5px;left:28px;"></div>
            <div class="borne" data-pino="3" data-label="3" style="top:5px;left:69px;"></div>
            <div class="borne" data-pino="5" data-label="5" style="top:5px;left:109px;"></div>
            <div class="borne" data-pino="2" data-label="2" style="bottom:5px;left:28px;"></div>
            <div class="borne" data-pino="4" data-label="4" style="bottom:5px;left:69px;"></div>
            <div class="borne" data-pino="6" data-label="6" style="bottom:5px;left:109px;"></div>
        </div>
    `,
    behavior: () => ({
        novoEstado: true,
        shorts: [['1', '2'], ['3', '4'], ['5', '6']],
        tipoVisual: 'ativo'
    })
};
