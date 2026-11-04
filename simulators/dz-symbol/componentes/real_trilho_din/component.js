(function () {
    const LIB_KEY = 'real_trilho_din';
    const DEFAULT_LENGTH_MM = 200;
    const PX_PER_MM = 3.77;

    function mmToPx(mm) {
        return Math.round(mm * PX_PER_MM);
    }

    window.COMPONENTES[LIB_KEY] = {
        cat: 'Componentes Reais',
        nome: 'Trilho DIN',
        icone: 'fa-grip-lines',
        tipo: 'mecanico',
        tagDefault: 'TR1',
        foto: './componentes/real_trilho_din/preview.svg',
        html: () => {
            return `<div class="trilho-svg-container" style="width:100%; height:100%; pointer-events:none;"></div>`;
        }
    };

    window.initRealTrilhoDinComponent = function (componentEl) {
        if (!componentEl) return;
        componentEl.dataset.trilhoLength = componentEl.dataset.trilhoLength || String(DEFAULT_LENGTH_MM);

        const handleDblClick = (e) => {
            if (window.simulando) return;
            e.stopPropagation();
            const isMobile = (window.innerWidth < 800);
            
            if (isMobile) {
                if (typeof window.abrirModalPropriedadesComponente === 'function') {
                    window.abrirModalPropriedadesComponente(componentEl);
                }
            } else {
                const current = parseFloat(componentEl.dataset.trilhoLength || DEFAULT_LENGTH_MM);
                const novo = prompt('Comprimento do trilho (mm):', String(current));
                if (novo !== null) {
                    const parsed = parseFloat(novo.replace(',', '.'));
                    if (Number.isFinite(parsed) && parsed > 0) {
                        componentEl.dataset.trilhoLength = String(parsed);
                        window.refreshRealTrilhoDinComponent(componentEl);
                    }
                }
            }
        };

        componentEl.addEventListener('dblclick', handleDblClick);
        if (typeof window.bindMobileDoubleTap === 'function') {
            window.bindMobileDoubleTap(componentEl, handleDblClick);
        }

        window.refreshRealTrilhoDinComponent(componentEl);
    };

    window.refreshRealTrilhoDinComponent = function (componentEl) {
        if (!componentEl) return;
        const lengthMm = parseFloat(componentEl.dataset.trilhoLength || DEFAULT_LENGTH_MM);
        const rot = parseInt(componentEl.dataset.rot || '0');
        const widthPx = mmToPx(lengthMm);
        const heightPx = mmToPx(30); // Slimmer look (standard is 35, but visually 30 looks better here)
        
        componentEl.style.width = widthPx + 'px';
        componentEl.style.height = heightPx + 'px';
        componentEl.style.transform = `rotate(${rot}deg)`;
        componentEl.style.overflow = 'visible';
        componentEl.style.zIndex = '5';
        componentEl.style.background = 'transparent';
        componentEl.style.border = 'none';
        componentEl.style.boxShadow = 'none';

        const svgContainer = componentEl.querySelector('.trilho-svg-container');
        if (svgContainer) {
            const patternId = `trilho-pattern-${componentEl.id || Math.random().toString(36).substr(2, 9)}`;
            svgContainer.innerHTML = `
                <svg width="${widthPx}" height="${heightPx}" viewBox="0 0 ${widthPx} ${heightPx}" xmlns="http://www.w3.org/2000/svg" style="display:block;">
                    <defs>
                        <linearGradient id="metalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style="stop-color:#9da2a8;stop-opacity:1" />
                            <stop offset="12%" style="stop-color:#e2e6eb;stop-opacity:1" />
                            <stop offset="20%" style="stop-color:#bdc1c7;stop-opacity:1" />
                            <stop offset="24%" style="stop-color:#71767d;stop-opacity:1" />
                            <stop offset="26%" style="stop-color:#bdc3c9;stop-opacity:1" />
                            <stop offset="45%" style="stop-color:#f5f7f9;stop-opacity:1" />
                            <stop offset="55%" style="stop-color:#f5f7f9;stop-opacity:1" />
                            <stop offset="74%" style="stop-color:#bdc3c9;stop-opacity:1" />
                            <stop offset="76%" style="stop-color:#71767d;stop-opacity:1" />
                            <stop offset="80%" style="stop-color:#bdc1c7;stop-opacity:1" />
                            <stop offset="88%" style="stop-color:#e2e6eb;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#9da2a8;stop-opacity:1" />
                        </linearGradient>
                        
                        <pattern id="${patternId}" x="0" y="0" width="48" height="${heightPx}" patternUnits="userSpaceOnUse">
                            <!-- Horizontal Oblong Hole (as seen in image) -->
                            <rect x="8" y="${heightPx / 2 - 3.5}" width="26" height="7" rx="3.5" fill="rgba(0,0,0,0.55)" />
                            
                            <!-- Subtle Brand Emboss (visible in image between holes) -->
                            <text x="38" y="${heightPx / 2 + 3}" font-family="Arial, sans-serif" font-size="6" font-weight="900" 
                                fill="rgba(0,0,0,0.06)" transform="rotate(-90 38 ${heightPx/2 + 3})">BBUN</text>
                        </pattern>
                    </defs>

                    <!-- Shadow -->
                    <rect x="0" y="2" width="${widthPx}" height="${heightPx}" fill="rgba(0,0,0,0.2)" rx="1" />
                    
                    <!-- Main Body -->
                    <rect x="0" y="0" width="${widthPx}" height="${heightPx}" fill="url(#metalGrad)" rx="1" />
                    
                    <!-- Detail Lines (Edge Folds) -->
                    <line x1="0" y1="${heightPx * 0.23}" x2="${widthPx}" y2="${heightPx * 0.23}" stroke="rgba(0,0,0,0.2)" stroke-width="0.5" />
                    <line x1="0" y1="${heightPx * 0.25}" x2="${widthPx}" y2="${heightPx * 0.25}" stroke="rgba(255,255,255,0.4)" stroke-width="0.5" />
                    
                    <line x1="0" y1="${heightPx * 0.75}" x2="${widthPx}" y2="${heightPx * 0.75}" stroke="rgba(255,255,255,0.4)" stroke-width="0.5" />
                    <line x1="0" y1="${heightPx * 0.77}" x2="${widthPx}" y2="${heightPx * 0.77}" stroke="rgba(0,0,0,0.2)" stroke-width="0.5" />

                    <!-- Perforations and Branding Pattern -->
                    <rect x="0" y="0" width="${widthPx}" height="${heightPx}" fill="url(#${patternId})" />
                    
                    <!-- Subtle Metallic Borders -->
                    <rect x="0.5" y="0.5" width="${widthPx - 1}" height="${heightPx - 1}" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="0.5" rx="1" />
                </svg>
            `;
        }

        const tagLabel = componentEl.querySelector('.tag-label');
        if (tagLabel) {
            tagLabel.style.position = 'absolute';
            tagLabel.style.top = '-28px';
            tagLabel.style.left = '50%';
            tagLabel.style.transform = 'translateX(-50%)';
            tagLabel.style.background = 'rgba(255,255,255,0.9)';
            tagLabel.style.padding = '2px 6px';
            tagLabel.style.borderRadius = '4px';
            tagLabel.style.border = '1px solid #aaa';
            tagLabel.style.fontSize = '11px';
            tagLabel.style.fontWeight = 'bold';
            tagLabel.style.color = '#333';
            tagLabel.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            tagLabel.innerText = componentEl.dataset.tag || 'TR1';
        }
    };
})();
