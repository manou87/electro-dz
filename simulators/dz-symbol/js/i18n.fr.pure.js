/**
 * Traduction 100% Française Intégrale pour DZ Symbol (Mode Schémas IEC)
 */
(function() {
    'use strict';

    // Dictionnaire des composants IEC en Français Pur
    const frComponents = {
        iec_fase: 'Phase (L)',
        iec_neutro: 'Neutre (N)',
        iec_fonte_trifasica_nt: 'Alimentation Triphasée (3P + N + T)',
        iec_fonte_ac_dc: 'Alimentation AC/DC (24 Vcc)',
        iec_transformador_partida_trifasico: 'Transformateur de Démarrage 3~',
        iec_setas_continuacao_3fnt: 'Flèches de Continuité (3P + N + T)',
        iec_segmento_cabo_in: 'Renvoi de Fil (Entrée)',
        iec_segmento_cabo_out: 'Renvoi de Fil (Sortie)',
        iec_lampada: 'Voyant Lumineux',
        iec_bobina_contator: 'Bobine de Contacteur (KM)',
        iec_bobina_temp: 'Bobine Temporisée (KA)',
        iec_contato_na: 'Contact Normalement Ouvert (NO)',
        iec_contato_nf: 'Contact Normalement Fermé (NC)',
        iec_contato_comum_na_nf: 'Contact Inverseur (NO/NC)',
        iec_contato_temp_na: 'Contact Temporisé (NO)',
        iec_contato_temp_nf: 'Contact Temporisé (NC)',
        iec_contato_rele_term_na: 'Contact Relais Thermique (NO 97-98)',
        iec_contato_rele_term_nf: 'Contact Relais Thermique (NC 95-96)',
        iec_contator_forca: 'Pôles de Puissance Contacteur (1-3-5)',
        iec_disjuntor_motor: 'Disjoncteur Moteur Magnéto-Thermique',
        iec_disjuntor_termomagnetico: 'Disjoncteur Tétrapolaire / Tripolaire',
        iec_disjuntor_bipolar: 'Disjoncteur Bipolaire',
        iec_disjuntor_monopolar: 'Disjoncteur Unipolaire (Ph+N)',
        iec_fusiveis: 'Fusibles Sectionneurs',
        iec_rele_termico: 'Relais Thermique Tripolaire',
        iec_rele_falta_fase: 'Relais Contrôleur d\'Ordre / Absence de Phase',
        iec_motor_tripolar: 'Moteur Asynchrone Triphasé (U-V-W)',
        iec_motor_6_pontas: 'Moteur 6 Bornes (U1-V1-W1 / U2-V2-W2)',
        iec_botao_na: 'Bouton-Poussoir Marche (NO)',
        iec_botao_nf: 'Bouton-Poussoir Arrêt (NC)',
        iec_botao_pulsador_na_nf: 'Double Bouton Poussoir (Marche/Arrêt)',
        iec_botao_pulsador_comum_na_nf: 'Bouton Poussoir avec Commun',
        iec_botoeira_emergencia_nf: 'Arrêt d\'Urgence Coup de Poing (NC)',
        iec_botoeira_emergencia_na: 'Arrêt d\'Urgence Signalisation (NO)',
        iec_chave_seletora_na: 'Commutateur Rotatif 2 Positions (NO)',
        iec_chave_seletora_nf: 'Commutateur Rotatif 2 Positions (NC)',
        iec_sensor_indutivo_na: 'Capteur Inductif (NO)',
        iec_sensor_indutivo_nf: 'Capteur Inductif (NC)',
        iec_sensor_capacitivo_na: 'Capteur Capacitif (NO)',
        iec_sensor_capacitivo_nf: 'Capteur Capacitif (NC)',
        iec_sensor_optico_na: 'Capteur Photoélectrique (NO)',
        iec_sensor_optico_nf: 'Capteur Photoélectrique (NC)',
        iec_sensor_fim_de_curso_na: 'Fin de Course Mécanique (NO)',
        iec_sensor_fim_de_curso_nf: 'Fin de Course Mécanique (NC)',
        iec_borne_sak: 'Borne de Raccordement (Bornier SAK)'
    };

    // Dictionnaire des termes d'interface en Français
    const frUI = {
        'Cablagem': 'Câblage',
        'Fiação': 'Câblage',
        'EMENDA': 'ÉPISSURE',
        'AUTO CABO': 'AUTO FIL',
        'AUTO FIACAO': 'AUTO FIL',
        'Auto Fiação': 'AUTO FIL',
        'Simbologia IEC': 'Symboles IEC',
        'SIMULAR': 'SIMULER',
        'PARAR': 'ARRÊTER',
        'PAUSAR': 'PAUSE',
        'Voltar (Ctrl+Z)': 'Annuler (Ctrl+Z)',
        'Avancar (Ctrl+Y)': 'Rétablir (Ctrl+Y)',
        'Copiar seleção (Ctrl+C)': 'Copier la sélection (Ctrl+C)',
        'Colar seleção (Ctrl+V)': 'Coller la sélection (Ctrl+V)',
        'Mover Tela': 'Déplacer la vue (Pan)',
        'Diminuir zoom': 'Zoom arrière (-)',
        'Aumentar zoom': 'Zoom avant (+)',
        'Tela cheia': 'Plein écran',
        'Espessura fina': 'Fil fin (0.75 mm²)',
        'Espessura média': 'Fil standard (1.5 mm²)',
        'Espessura grossa': 'Fil puissance (2.5 mm²)',
        'Abrir menu de componentes': 'Bibliothèque de symboles',
        'Workspace escuro': 'Fond sombre',
        'Modo Simbologia': 'Mode Symboles IEC',
        'Modo 2D': 'Mode 2D',
        'Propriedades': 'Propriétés',
        'Nome': 'Désignation',
        'Identificador': 'Repère (ex: KM1)',
        'Salvar': 'Enregistrer',
        'Cancelar': 'Annuler',
        'Excluir': 'Supprimer'
    };

    // Injection automatique dans le DOM et les fonctions globales
    function translateDOM() {
        // 1. Bouton Simuler
        const btnPlay = document.getElementById('btn-play');
        if (btnPlay) {
            const isSim = btnPlay.classList.contains('simulating') || btnPlay.innerText.includes('PARAR');
            btnPlay.innerHTML = isSim ? '<i class="fa-solid fa-stop"></i> ARRÊTER' : '<i class="fa-solid fa-play"></i> SIMULER';
        }

        // 2. Boutons Filiation
        const btnEmenda = document.getElementById('btn-emenda');
        if (btnEmenda) btnEmenda.title = 'Épissure / Jonction de câble';

        const btnAuto = document.getElementById('btn-auto-wire');
        if (btnAuto) btnAuto.title = 'Câblage automatique entre bornes';

        // 3. Catégorie Header
        document.querySelectorAll('.cat-title, .sidebar-segment-title span, h3, h4').forEach(el => {
            const txt = el.innerText.trim();
            if (frUI[txt]) el.innerText = frUI[txt];
            if (txt.includes('Simbologia')) el.innerText = 'Symboles Normalisés IEC';
            if (txt.includes('Fiação') || txt.includes('Cablagem')) el.innerText = 'Câblage & Fils';
        });

        // 4. Cartes des composants
        document.querySelectorAll('.component-item').forEach(card => {
            const compId = card.getAttribute('data-component') || card.getAttribute('data-comp') || card.id;
            const nameEl = card.querySelector('.comp-name') || card.querySelector('span');
            if (nameEl) {
                // Si l'ID est dans le dictionnaire FR
                for (const [key, val] of Object.entries(frComponents)) {
                    if (compId && compId.includes(key.replace('iec_', ''))) {
                        nameEl.innerText = val;
                        card.title = val;
                        break;
                    }
                }
                const cur = nameEl.innerText.trim();
                if (frComponents[cur]) nameEl.innerText = frComponents[cur];
                if (frUI[cur]) nameEl.innerText = frUI[cur];
            }
        });

        // 5. Tooltips de la barre supérieure
        const tooltips = {
            'btn-undo': 'Annuler (Ctrl+Z)',
            'btn-redo': 'Rétablir (Ctrl+Y)',
            'btn-copy': 'Copier (Ctrl+C)',
            'btn-paste': 'Coller (Ctrl+V)',
            'btn-pan': 'Déplacer la feuille (Pan)',
            'btn-zoom-in': 'Agrandir le zoom (+)',
            'btn-zoom-out': 'Réduire le zoom (-)',
            'btn-fullscreen': 'Mode Plein Écran',
            'btn-sidebar-toggle': 'Afficher/Masquer la bibliothèque'
        };
        for (const [id, tip] of Object.entries(tooltips)) {
            const b = document.getElementById(id);
            if (b) b.title = tip;
        }
    }

    // Hook i18n global
    window.i18n = window.i18n || {};
    window.i18n.t = function(key, fallback) {
        return frUI[key] || frComponents[key] || fallback || key;
    };

    // Forcer la langue Française dans localStorage
    try {
        localStorage.setItem('simucir.comandos.language', 'fr');
        localStorage.setItem('dz.language', 'fr');
    } catch(e) {}

    // Observer pour traduire dynamiquement lors de l'ajout de composants
    window.addEventListener('DOMContentLoaded', () => {
        translateDOM();
        setInterval(translateDOM, 800);
    });

})();

// =========================================================================
// GESTION DU DÉPLACEMENT DE L'ÉCRAN À 1 SEUL DOIGT (PAN TOUCH TACTILE)
// =========================================================================
(function() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchInitialPanX = 0;
    let touchInitialPanY = 0;
    let isTouchPanning = false;

    window.addEventListener('load', () => {
        const viewport = document.getElementById('viewport');
        if (!viewport) return;

        viewport.addEventListener('touchstart', (e) => {
            // Uniquement si 1 seul doigt sur l'écran
            if (e.touches.length === 1) {
                const target = e.target;
                // Vérifier si le toucher est sur un composant, un fil ou une borne
                if (target.closest('.component') || 
                    target.closest('.componente') || 
                    target.closest('.pin') || 
                    target.closest('.borne') || 
                    target.closest('.pin-label') || 
                    target.closest('.tag-label') || 
                    target.closest('.ponto-conexao') || 
                    target.closest('.linha-fio') || 
                    target.closest('svg') || 
                    target.closest('.user-drawing') ||
                    target.closest('.sidebar-panel') ||
                    target.closest('.top-bar') ||
                    target.closest('#mobile-drawer-toggle')) {
                    isTouchPanning = false;
                    return;
                }
                isTouchPanning = true;
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                touchInitialPanX = typeof panX !== 'undefined' ? panX : 0;
                touchInitialPanY = typeof panY !== 'undefined' ? panY : 0;
            }
        }, { passive: false });

        viewport.addEventListener('touchmove', (e) => {
            if (isTouchPanning && e.touches.length === 1) {
                e.preventDefault(); // Empêcher le scroll par défaut du navigateur
                const deltaX = e.touches[0].clientX - touchStartX;
                const deltaY = e.touches[0].clientY - touchStartY;

                if (typeof panX !== 'undefined' && typeof panY !== 'undefined' && typeof updateTransform === 'function') {
                    panX = touchInitialPanX + deltaX;
                    panY = touchInitialPanY + deltaY;
                    updateTransform();
                }
            }
        }, { passive: false });

        const endTouchPan = () => {
            isTouchPanning = false;
        };

        viewport.addEventListener('touchend', endTouchPan);
        viewport.addEventListener('touchcancel', endTouchPan);
    });
})();
