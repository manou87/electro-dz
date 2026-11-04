window.COMPONENTES['iec_rele_termico'] = {
    cat: 'Simbologia IEC',
    nome: 'مرحل حراري',
    icone: 'fa-temperature-high',
    tipo: 'contato',
    showTag: true,
    tagDefault: 'F1',
    foto: './componentes/iec_rele_termico/rele_termico_0.svg',
    html: () => `
        <div class="iec-dual-state-wrap" style="width:80px;height:80px;position:relative;">
            <img class="iec-dual-state-img iec-dual-state-img-off" src="./componentes/iec_rele_termico/rele_termico_0.svg" alt="Relé térmico normal">
            <img class="iec-dual-state-img iec-dual-state-img-on" src="./componentes/iec_rele_termico/rele_termico_1.svg" alt="Relé térmico acionado">
            <button type="button" class="toggle-state-btn" title="Simular sobrecorrente" aria-label="Simular sobrecorrente"></button>

            <div class="borne" data-pino="1" style="left:calc(8px + var(--iec-rele-termico-borne-x-1, var(--iec-rele-termico-borne-x)));top:calc(-10px + var(--iec-rele-termico-borne-y-1, var(--iec-rele-termico-borne-y)));"></div>
            <div class="borne" data-pino="3" style="left:calc(29px + var(--iec-rele-termico-borne-x-3, var(--iec-rele-termico-borne-x)));top:calc(-10px + var(--iec-rele-termico-borne-y-3, var(--iec-rele-termico-borne-y)));"></div>
            <div class="borne" data-pino="5" style="left:calc(50px + var(--iec-rele-termico-borne-x-5, var(--iec-rele-termico-borne-x)));top:calc(-10px + var(--iec-rele-termico-borne-y-5, var(--iec-rele-termico-borne-y)));"></div>
            <div class="borne" data-pino="2" style="left:calc(8px + var(--iec-rele-termico-borne-x-2, var(--iec-rele-termico-borne-x)));top:calc(69px + var(--iec-rele-termico-borne-y-2, var(--iec-rele-termico-borne-y)));"></div>
            <div class="borne" data-pino="4" style="left:calc(29px + var(--iec-rele-termico-borne-x-4, var(--iec-rele-termico-borne-x)));top:calc(69px + var(--iec-rele-termico-borne-y-4, var(--iec-rele-termico-borne-y)));"></div>
            <div class="borne" data-pino="6" style="left:calc(50px + var(--iec-rele-termico-borne-x-6, var(--iec-rele-termico-borne-x)));top:calc(69px + var(--iec-rele-termico-borne-y-6, var(--iec-rele-termico-borne-y)));"></div>
        </div>
    `,
    behavior: (inputs, estado, props) => {
        const trip = !!(props?.overloadTrip ?? props?.tagEnergized);
        return {
            novoEstado: trip,
            // No modelo IEC, este simbolo atua como elemento de comando/sinalizacao.
            // O disparo termico nao abre o caminho de potencia aqui; quem comuta
            // o circuito sao os contatos auxiliares (95-96 / 97-98) com a mesma TAG.
            shorts: [['1', '2'], ['3', '4'], ['5', '6']]
        };
    }
};


