(function () {
    const LIB_KEY = 'real_terminal_generico';
    const STYLE_ID = 'real-terminal-generico-style';
    const IMAGE_SRC = './componentes/real_terminal_generico/terminal_generico.webp';
    const TIP_CONTACT_POINTS = [88, 98, 108, 118, 128, 138, 148]
        .flatMap(top => [24.5, 32.5, 40.5].map(left => ({ left, top })));

    function ensureStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
.component[data-lib="${LIB_KEY}"] {
    z-index: 43 !important;
    overflow: visible;
    --real-terminal-generico-borne-x: 0px;
    --real-terminal-generico-borne-y: 0px;
}
.component[data-lib="${LIB_KEY}"] .tag-label {
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
}
.real-terminal-generico-wrap {
    position: relative;
    width: 65px;
    height: 160px;
}
.real-terminal-generico-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
    user-select: none;
    transition: filter 120ms ease;
}
.component[data-lib="${LIB_KEY}"].terminal-generic-align-hit .real-terminal-generico-img {
    filter:
        drop-shadow(0 0 1px rgba(255, 38, 38, 0.95))
        drop-shadow(0 0 4px rgba(255, 38, 38, 0.72))
        drop-shadow(0 0 8px rgba(255, 38, 38, 0.4));
}
.real-terminal-generico-borne {
    transform: translate(calc(-50% + var(--real-terminal-generico-borne-x, 0px)), calc(-50% + var(--real-terminal-generico-borne-y, 0px)));
}
.real-terminal-generico-tip-borne {
    transform: translate(-50%, -50%);
    opacity: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
    pointer-events: none !important;
}
.real-terminal-generico-tip-support-borne {
    opacity: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
    pointer-events: none !important;
}
body.engineering-mode.engineering-show-bornes .component[data-lib="${LIB_KEY}"] .real-terminal-generico-tip-borne {
    opacity: 0.35 !important;
    background: rgba(255, 180, 0, 0.7) !important;
    pointer-events: none !important;
}
`;
        document.head.appendChild(style);
    }

    function buildHtml() {
        return `
            <div class="real-terminal-generico-wrap">
                <img class="real-terminal-generico-img" src="${IMAGE_SRC}" alt="Terminal generico">
                <div class="borne real-terminal-generico-borne" data-pino="TOP" title="Entrada do cabo" style="left:32.5px;top:55px;transform:translate(calc(-50% + var(--real-terminal-generico-borne-x-1, var(--real-terminal-generico-borne-x, 0px))), calc(-50% + var(--real-terminal-generico-borne-y-1, var(--real-terminal-generico-borne-y, 0px))));"></div>
                <div class="borne real-terminal-generico-tip-borne" data-pino="TIP" title="Ponta metalica" style="left:32.5px;top:138px;transform:translate(calc(-50% + var(--real-terminal-generico-borne-x-2, var(--real-terminal-generico-borne-x, 0px))), calc(-50% + var(--real-terminal-generico-borne-y-2, var(--real-terminal-generico-borne-y, 0px))));"></div>
                ${TIP_CONTACT_POINTS.map(({ left, top }, index) => `
                    <div class="borne real-terminal-generico-tip-support-borne" data-pino="TIP_SUPPORT_${index + 1}" style="left:${left}px;top:${top}px;transform:translate(calc(-50% + var(--real-terminal-generico-borne-x-2, var(--real-terminal-generico-borne-x, 0px))), calc(-50% + var(--real-terminal-generico-borne-y-2, var(--real-terminal-generico-borne-y, 0px))));"></div>
                `).join('')}
            </div>
        `;
    }

    ensureStyle();
    window.COMPONENTES = window.COMPONENTES || {};
    window.BIBLIOTECA = window.BIBLIOTECA || window.COMPONENTES;

    window.COMPONENTES[LIB_KEY] = {
        cat: 'Componentes Reais',
        nome: 'Terminal Generico',
        icone: 'fa-plug-circle-bolt',
        tipo: 'conector',
        tagDefault: 'TG1',
        foto: IMAGE_SRC,
        html: buildHtml,
        behavior: () => ({
            novoEstado: true,
            shorts: [
                ['TOP', 'TIP'],
                ...TIP_CONTACT_POINTS.map((_, index) => ['TIP', `TIP_SUPPORT_${index + 1}`])
            ],
            tipoVisual: 'ativo-local'
        })
    };
})();
