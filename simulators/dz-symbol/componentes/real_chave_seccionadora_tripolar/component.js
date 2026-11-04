(function () {
    'use strict';

    var LIB_KEY = 'real_chave_seccionadora_tripolar';
    var BASE_PATH = './componentes/real_chave_seccionadora_tripolar/';

    function ensureStyle() {
        if (document.getElementById('real-chave-seccionadora-tripolar-style')) return;
        var style = document.createElement('style');
        style.id = 'real-chave-seccionadora-tripolar-style';
        style.textContent = [
            '.real-chave-seccionadora-tripolar-wrap{position:relative;width:170px;height:239px;}',
            '.real-chave-seccionadora-tripolar-img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none;user-select:none;}',
            '.real-chave-seccionadora-tripolar-on{display:none;}',
            '.component[data-lib="' + LIB_KEY + '"][data-manual-on="true"] .real-chave-seccionadora-tripolar-off{display:none;}',
            '.component[data-lib="' + LIB_KEY + '"][data-manual-on="true"] .real-chave-seccionadora-tripolar-on{display:block;}',
            '.real-chave-seccionadora-tripolar-toggle{position:absolute!important;left:18%!important;top:17%!important;width:64%!important;height:66%!important;border:0;background:transparent;cursor:pointer;z-index:20;}'
        ].join('');
        document.head.appendChild(style);
    }

    function borne(pin, x, verticalPosition, side) {
        return '<div class="borne" data-pino="' + pin + '" data-terminal-side="' + side + '" style="left:' + x + 'px;' + verticalPosition + '"></div>';
    }

    function html() {
        return [
            '<div class="real-chave-seccionadora-tripolar-wrap">',
            '<img class="real-chave-seccionadora-tripolar-img real-chave-seccionadora-tripolar-off" src="' + BASE_PATH + 'chave_seccionadora_0.webp" alt="Chave seccionadora tripolar desligada" width="315" height="443" decoding="async">',
            '<img class="real-chave-seccionadora-tripolar-img real-chave-seccionadora-tripolar-on" src="' + BASE_PATH + 'chave_seccionadora_1.webp" alt="Chave seccionadora tripolar ligada" width="315" height="443" decoding="async">',
            '<button type="button" class="toggle-state-btn real-disjuntor-toggle real-chave-seccionadora-tripolar-toggle" title="Ligar ou desligar a chave seccionadora" aria-label="Ligar ou desligar a chave seccionadora"></button>',
            borne('1', 28, 'top:9px;', 'top'),
            borne('3', 85, 'top:9px;', 'top'),
            borne('5', 142, 'top:9px;', 'top'),
            borne('2', 28, 'bottom:9px;', 'bottom'),
            borne('4', 85, 'bottom:9px;', 'bottom'),
            borne('6', 142, 'bottom:9px;', 'bottom'),
            '</div>'
        ].join('');
    }

    ensureStyle();
    window.COMPONENTES = window.COMPONENTES || {};
    window.BIBLIOTECA = window.BIBLIOTECA || window.COMPONENTES;
    window.COMPONENTES[LIB_KEY] = {
        cat: 'Componentes Reais',
        nome: 'Chave Seccionadora Tripolar',
        icone: 'fa-power-off',
        tipo: 'chave',
        tagDefault: 'QS1',
        showTag: true,
        foto: BASE_PATH + 'chave_seccionadora_0.webp',
        html: html,
        behavior: function (inputs, estado, props, componentEl) {
            var ligado = componentEl && componentEl.dataset.manualOn === 'true';
            return {
                novoEstado: ligado,
                shorts: ligado ? [['1', '2'], ['3', '4'], ['5', '6']] : [],
                tipoVisual: ligado ? 'ativo' : ''
            };
        }
    };
})();
