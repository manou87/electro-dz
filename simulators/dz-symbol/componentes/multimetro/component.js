window.RESIDENCIAL_MULTIMETRO_COMPONENT = Object.freeze({
    id: 'multimetro',
    label: 'Multimetro',
    assets: {
        body: 'componentes/multimetro/multimetro.webp',
        probeBlack: 'componentes/multimetro/ponteira_preta.webp',
        probeRed: 'componentes/multimetro/ponteira_vermelha.webp',
        selector: 'componentes/multimetro/seletor.webp'
    },
    selectorPositions: [
        { key: 'off', label: 'OFF', angle: -132 },
        { key: 'volt', label: 'V', angle: -82 },
        { key: 'cont', label: 'CONT', angle: 46 }
    ]
});
