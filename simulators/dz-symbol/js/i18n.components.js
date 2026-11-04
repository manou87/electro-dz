(function () {
    'use strict';

    const DEFAULT_LANGUAGE = 'ar';

    const categories = {
        'Simbologia IEC': {
            'ar': 'Simbologia IEC',
            en: 'IEC Symbols',
            es: 'Simbologia IEC'
        },
        'Componentes Reais': {
            'ar': 'Componentes Reais',
            en: 'Real Components',
            es: 'Componentes Reales'
        },
        'Comandos Realistas': {
            'ar': 'Comandos Realistas',
            en: 'Realistic Controls',
            es: 'Comandos Realistas'
        },
        'Animacoes 2D': {
            'ar': 'Animacoes 2D',
            en: '2D Animations',
            es: 'Animaciones 2D'
        }
    };

    const components = {
        iec_fase: { 'ar': 'طور (L)', en: 'Phase (L)', es: 'Fase (L)' },
        iec_neutro: { 'ar': 'حيادي (N)', en: 'Neutral (N)', es: 'Neutro (N)' },
        iec_fonte_trifasica_nt: { 'ar': 'مصدر ثلاثي الأطوار + N + أرضي', en: 'Three-phase Source + N + G', es: 'Fuente Trifasica + N + T' },
        iec_fonte_ac_dc: { 'ar': 'تغذية AC/DC 24Vdc', en: '24 VDC AC/DC Power Supply', es: 'Fuente AC/DC 24 Vcc' },
        iec_transformador_partida_trifasico: { 'ar': 'محول إقلاع ثلاثي الأطوار IEC', en: 'IEC 3-Phase Starting Transformer', es: 'Trafo Partida 3F IEC' },
        iec_setas_continuacao_3fnt: { 'ar': 'أسهم استمرار 3P + N + أرضي', en: 'Continuation Arrows 3P + N + G', es: 'Flechas Continuacion 3F + N + T' },
        iec_segmento_cabo_in: { 'ar': 'طرف كابل دخول IN', en: 'Cable Segment IN', es: 'Segmento de Cable IN' },
        iec_segmento_cabo_out: { 'ar': 'طرف كابل خروج OUT', en: 'Cable Segment OUT', es: 'Segmento de Cable OUT' },
        iec_lampada: { 'ar': 'مصباح إشارة', en: 'Indicator Light', es: 'Senalero' },
        iec_bobina_contator: { 'ar': 'وشيعة كونتاكتور', en: 'Contactor Coil', es: 'Bobina Contactor' },
        iec_bobina_temp: { 'ar': 'وشيعة مؤقت زمني', en: 'Timer Coil', es: 'Bobina Temporizadora' },
        iec_botao_na: { 'ar': 'زر ضاغط مفتوح (NO)', en: 'NO Push Button', es: 'Boton NA' },
        iec_botao_nf: { 'ar': 'زر ضاغط مغلق (NC)', en: 'NC Push Button', es: 'Boton NC' },
        iec_botao_pulsador_na_nf: { 'ar': 'زر ضاغط مزدوج NO/NC', en: 'NO/NC Push Button', es: 'Pulsador NA/NC' },
        iec_botao_pulsador_comum_na_nf: { 'ar': 'زر ضاغط مشترك NO/NC', en: 'Common NO/NC Push Button', es: 'Pulsador Comun NA/NC' },
        iec_botoeira_emergencia_na: { 'ar': 'زر طوارئ مفتوح (NO)', en: 'NO Emergency Button', es: 'Boton Emergencia NA' },
        iec_botoeira_emergencia_nf: { 'ar': 'زر طوارئ مغلق (NC)', en: 'NC Emergency Button', es: 'Boton Emergencia NC' },
        iec_botoeira_emergencia_dupla_nf: { 'ar': 'زر طوارئ مزدوج (2NC)', en: 'Dual NC Emergency Button', es: 'Boton Emergencia Doble NC' },
        iec_contato_na: { 'ar': 'تماس مفتوح (NO)', en: 'NO Contact', es: 'Contacto NA' },
        iec_contato_nf: { 'ar': 'تماس مغلق (NC)', en: 'NC Contact', es: 'Contacto NC' },
        iec_contato_comum_na_nf: { 'ar': 'تماس مشترك NO/NC', en: 'Common NO/NC Contact', es: 'Contacto Comun NA/NC' },
        iec_contato_temp_na: { 'ar': 'تماس مؤقت مفتوح (NO)', en: 'Timed NO Contact', es: 'Contacto Temp NA' },
        iec_contato_temp_nf: { 'ar': 'تماس مؤقت مغلق (NC)', en: 'Timed NC Contact', es: 'Contacto Temp NC' },
        iec_contator_forca: { 'ar': 'كونتاكتور استطاعة', en: 'Power Contactor', es: 'Contactor de Potencia' },
        iec_rele_seguranca: { 'ar': 'مرحل أمان', en: 'Safety Relay', es: 'Rele de Seguridad' },
        iec_rele_falta_fase: { 'ar': 'مرحل سقوط الطور', en: 'Phase Failure Relay', es: 'Rele de Falta de Fase' },
        iec_rele_termico: { 'ar': 'مرحل حراري', en: 'Thermal Relay', es: 'Rele Termico' },
        iec_contato_rele_term_na: { 'ar': 'تماس مرحل حراري مفتوح (NO)', en: 'Thermal Relay NO Contact', es: 'Contacto Rele Termico NA' },
        iec_contato_rele_term_nf: { 'ar': 'تماس مرحل حراري مغلق (NC)', en: 'Thermal Relay NC Contact', es: 'Contacto Rele Termico NC' },
        iec_disjuntor_monopolar: { 'ar': 'قاطع أحادي القطب IEC', en: 'IEC Single-Pole Breaker', es: 'Interruptor Monopolar IEC' },
        iec_disjuntor_bipolar: { 'ar': 'قاطع ثنائي القطب IEC', en: 'IEC Two-Pole Breaker', es: 'Interruptor Bipolar IEC' },
        iec_disjuntor_termomagnetico: { 'ar': 'قاطع مغناطيسي حراري IEC', en: 'IEC Thermal-Magnetic Breaker', es: 'Interruptor Termomagnetico IEC' },
        iec_disjuntor_motor: { 'ar': 'قاطع محرك IEC', en: 'IEC Motor Circuit Breaker', es: 'Guardamotor IEC' },
        iec_fusiveis: { 'ar': 'طقم مصهرات', en: 'Fuse Set', es: 'Conjunto de Fusibles' },
        iec_motor_tripolar: { 'ar': 'محرك ثلاثي الأطوار IEC', en: 'IEC Three-Pole Motor', es: 'Motor Tripolar IEC' },
        iec_motor_6_pontas: { 'ar': 'محرك 3 أطوار (6 أطراف)', en: '3-Phase Motor (6 Leads)', es: 'Motor 3F (6 puntas)' },
        iec_chave_seletora_na: { 'ar': 'مفتاح اختيار مفتوح (NO)', en: 'NO Selector Switch', es: 'Selector NA' },
        iec_chave_seletora_nf: { 'ar': 'مفتاح اختيار مغلق (NC)', en: 'NC Selector Switch', es: 'Selector NC' },
        iec_sensor_indutivo_na: { 'ar': 'حساس تقاربي حثي (NO)', en: 'NO Inductive Sensor', es: 'Sensor Inductivo NA' },
        iec_sensor_indutivo_nf: { 'ar': 'حساس تقاربي حثي (NC)', en: 'NC Inductive Sensor', es: 'Sensor Inductivo NC' },
        iec_sensor_capacitivo_na: { 'ar': 'حساس تقاربي سعوي (NO)', en: 'NO Capacitive Sensor', es: 'Sensor Capacitivo NA' },
        iec_sensor_capacitivo_nf: { 'ar': 'حساس تقاربي سعوي (NC)', en: 'NC Capacitive Sensor', es: 'Sensor Capacitivo NC' },

        real_contator: { 'ar': 'كونتاكتور مساعد', en: 'Auxiliary Contactor', es: 'Contactor Auxiliar' },
        real_rele_termico: { 'ar': 'مرحل حراري', en: 'Thermal Relay', es: 'Rele Termico' },
        real_rele_seguranca: { 'ar': 'مرحل أمان', en: 'Safety Relay', es: 'Rele de Seguridad' },
        real_rele_falta_fase: { 'ar': 'مرحل حماية الطور', en: 'Phase Failure Relay', es: 'Rele de Falta de Fase' },
        real_contator_forca: { 'ar': 'كونتاكتور استطاعة', en: 'Power Contactor', es: 'Contactor de Potencia' },
        real_contato_auxiliar: { 'ar': 'تماس مساعد', en: 'Auxiliary Contact', es: 'Contacto Auxiliar' },
        real_botoeira_vermelha: { 'ar': 'زر ضاغط أحمر', en: 'Red Push Button', es: 'Botonera Roja' },
        real_botoeira_verde: { 'ar': 'زر ضاغط أخضر', en: 'Green Push Button', es: 'Botonera Verde' },
        real_botoeira_emergencia: { 'ar': 'زر طوارئ', en: 'Emergency Push Button', es: 'Botonera de Emergencia' },
        real_botoeira_emergencia_dupla: { 'ar': 'زر طوارئ مزدوج NC', en: 'Emergency Push Button 2NC', es: 'Botonera Emergencia 2NC' },
        real_fonte_trifasica_nt: { 'ar': 'مصدر ثلاثي الأطوار + N + أرضي', en: 'Three-phase Source + N + G', es: 'Fuente Trifasica + N + T' },
        real_fonte_24v: { 'ar': 'مزود طاقة 24V', en: '100-220V / 24VDC Power Supply', es: 'Fuente 100-220V / 24Vcc' },
        real_transformador_partida_trifasico: { 'ar': 'محول إقلاع 3 أطوار', en: 'Real 3-Phase Starting Transformer', es: 'Trafo Partida 3F Real' },
        real_motor_3_ligacoes: { 'ar': 'محرك 3 أطوار (3 أطراف)', en: '3-Phase Motor (3 Leads)', es: 'Motor 3F (3 conexiones)' },
        real_motor_6_ligacoes: { 'ar': 'محرك 3 أطوار (6 أطراف)', en: '3-Phase Motor (6 Leads)', es: 'Motor 3F (6 conexiones)' },
        real_sinaleiro: { 'ar': 'مصباح إشارة', en: 'Indicator Light', es: 'Senalero' },
        real_caixa_boia_bomba: { 'ar': "عوامة كهربائية لمضخة'agua + boia + bomba", en: 'Water Tank + Float + Pump', es: 'Caja de agua + boya + bomba' },
        real_disjuntor_monopolar: { 'ar': 'قاطع أحادي', en: 'Single-Pole Breaker', es: 'Interruptor Monopolar' },
        real_disjuntor_bipolar: { 'ar': 'قاطع ثنائي', en: 'Two-Pole Breaker', es: 'Interruptor Bipolar' },
        real_disjuntor_tripolar: { 'ar': 'قاطع ثلاثي', en: 'Three-Pole Breaker', es: 'Interruptor Tripolar' },
        real_fusivel_tripolar: { 'ar': 'مصهر ثلاثي', en: 'Three-Pole Fuse', es: 'Fusible Tripolar' },
        real_disjuntor_motor: { 'ar': 'قاطع محرك', en: 'Motor Circuit Breaker', es: 'Guardamotor' },
        real_temporizador: { 'ar': 'مؤقت زمني', en: 'Timer', es: 'Temporizador' },
        real_chave_seletora: { 'ar': 'مفتاح اختيار', en: 'Selector Switch', es: 'Selector' },
        real_barramento_neutro: { 'ar': 'شريط الحيادي', en: 'Neutral Busbar', es: 'Barramiento Neutro' },
        real_barramento_terra: { 'ar': 'شريط الأرضي', en: 'Ground Busbar', es: 'Barramiento Tierra' },
        real_barramento_pente_monofasico: { 'ar': 'شريط توصيل أحادي', en: 'Comb Busbar', es: 'Peine de Conexion' },
        real_barramento_pente_bifasico: { 'ar': 'شريط توصيل ثنائي', en: '2-Phase Comb Busbar', es: 'Peine de Conexion 2F' },
        real_barramento_pente_trifasico: { 'ar': 'شريط توصيل ثلاثي', en: '3-Phase Comb Busbar', es: 'Peine de Conexion 3F' },
        real_canaleta_reta: { 'ar': 'مجرى أسلاك مستقيم', en: 'Straight Wire Duct', es: 'Canaleta Recta' },
        real_canaleta_canto_90: { 'ar': 'مجرى أسلاك 90°', en: '90 Degree Wire Duct Corner', es: 'Canaleta Esquina 90' },
        real_borne_sak: { 'ar': 'طرف توصيل SAK', en: 'SAK Terminal Block', es: 'Borne SAK' },
        real_terminal_generico: { 'ar': 'طرف عام', en: 'Generic Terminal', es: 'Terminal Generico' },
        real_regua_milimetrada: { 'ar': 'مسطرة قياس', en: 'mm/cm Ruler', es: 'Regla mm/cm' },
        real_trilho_din: { 'ar': 'سكة DIN', en: 'DIN Rail', es: 'Riel DIN' }
    };
    const FRENCH_CATEGORIES = {
        "Simbologia IEC": "Symboles IEC",
        "Componentes Reais": "Composants réels",
        "Comandos Realistas": "Commandes réalistes",
        "Animacoes 2D": "Animations 2D"
    };

    const FRENCH_COMPONENTS = {
        iec_fase: "Phase (L)",
        iec_neutro: "Neutre (N)",
        iec_fonte_trifasica_nt: "Alimentation triphasée + N + T",
        iec_fonte_ac_dc: "Alimentation AC/DC 24 Vcc",
        iec_transformador_partida_trifasico: "Transformateur de démarrage 3F IEC",
        iec_setas_continuacao_3fnt: "Flèches de continuité 3F + N + T",
        iec_segmento_cabo_in: "Segment de câble IN",
        iec_segmento_cabo_out: "Segment de câble OUT",
        iec_lampada: "Voyant",
        iec_bobina_contator: "Bobine de contacteur",
        iec_bobina_temp: "Bobine temporisée",
        iec_botao_na: "Bouton NO",
        iec_botao_nf: "Bouton NF",
        iec_botao_pulsador_na_nf: "Bouton-poussoir NO/NF",
        iec_botao_pulsador_comum_na_nf: "Bouton-poussoir commun NO/NF",
        iec_botoeira_emergencia_na: "Bouton d'urgence NO",
        iec_botoeira_emergencia_nf: "Bouton d'urgence NF",
        iec_botoeira_emergencia_dupla_nf: "Bouton d'urgence double NF",
        iec_contato_na: "Contact NO",
        iec_contato_nf: "Contact NF",
        iec_contato_comum_na_nf: "Contact commun NO/NF",
        iec_contato_temp_na: "Contact temporisé NO",
        iec_contato_temp_nf: "Contact temporisé NF",
        iec_contator_forca: "Contacteur de puissance",
        iec_rele_seguranca: "Relais de sécurité",
        iec_rele_falta_fase: "Relais de manque de phase",
        iec_rele_termico: "Relais thermique",
        iec_contato_rele_term_na: "Contact NO de relais thermique",
        iec_contato_rele_term_nf: "Contact NF de relais thermique",
        iec_disjuntor_monopolar: "Disjoncteur unipolaire IEC",
        iec_disjuntor_bipolar: "Disjoncteur bipolaire IEC",
        iec_disjuntor_termomagnetico: "Disjoncteur thermomagnétique IEC",
        iec_disjuntor_motor: "Disjoncteur moteur IEC",
        iec_fusiveis: "Ensemble de fusibles",
        iec_motor_tripolar: "Moteur tripolaire IEC",
        iec_motor_6_pontas: "Moteur 3F (6 bornes)",
        iec_chave_seletora_na: "Sélecteur NO",
        iec_chave_seletora_nf: "Sélecteur NF",
        iec_sensor_indutivo_na: "Capteur inductif NO",
        iec_sensor_indutivo_nf: "Capteur inductif NF",
        iec_sensor_capacitivo_na: "Capteur capacitif NO",
        iec_sensor_capacitivo_nf: "Capteur capacitif NF",
        real_contator: "Contacteur auxiliaire",
        real_rele_termico: "Relais thermique",
        real_rele_seguranca: "Relais de sécurité",
        real_rele_falta_fase: "Relais de manque de phase",
        real_contator_forca: "Contacteur de puissance",
        real_contato_auxiliar: "Contact auxiliaire",
        real_botoeira_vermelha: "Bouton rouge",
        real_botoeira_verde: "Bouton vert",
        real_botoeira_emergencia: "Bouton d'urgence",
        real_botoeira_emergencia_dupla: "Bouton d'urgence 2NF",
        real_fonte_trifasica_nt: "Alimentation triphasée + N + T",
        real_fonte_24v: "Alimentation 100-220 V / 24 Vcc",
        real_transformador_partida_trifasico: "Transformateur de démarrage 3F réel",
        real_motor_3_ligacoes: "Moteur 3F (3 connexions)",
        real_motor_6_ligacoes: "Moteur 3F (6 connexions)",
        real_sinaleiro: "Voyant",
        real_caixa_boia_bomba: "Réservoir d'eau + flotteur + pompe",
        real_disjuntor_monopolar: "Disjoncteur unipolaire",
        real_disjuntor_bipolar: "Disjoncteur bipolaire",
        real_disjuntor_tripolar: "Disjoncteur tripolaire",
        real_fusivel_tripolar: "Fusible tripolaire",
        real_disjuntor_motor: "Disjoncteur moteur",
        real_temporizador: "Temporisateur",
        real_chave_seletora: "Sélecteur",
        real_barramento_neutro: "Barre de neutre",
        real_barramento_terra: "Barre de terre",
        real_barramento_pente_monofasico: "Peigne de raccordement",
        real_barramento_pente_bifasico: "Peigne de raccordement 2F",
        real_barramento_pente_trifasico: "Peigne de raccordement 3F",
        real_canaleta_reta: "Goulotte droite",
        real_canaleta_canto_90: "Angle de goulotte 90",
        real_borne_sak: "Bornier SAK",
        real_terminal_generico: "Borne générique",
        real_regua_milimetrada: "Règle mm/cm",
        real_trilho_din: "Rail DIN"
    };

    Object.keys(FRENCH_CATEGORIES).forEach((key) => {
        if (categories[key]) categories[key].fr = FRENCH_CATEGORIES[key];
    });

    Object.keys(FRENCH_COMPONENTS).forEach((key) => {
        if (components[key]) components[key].fr = FRENCH_COMPONENTS[key];
    });
    const FULL_COMMANDS_CATEGORIES = {
        'Potência': { 'ar': 'Potência', en: 'Power', es: 'Potencia', fr: 'Puissance' },
        'Acionamentos': { 'ar': 'Acionamentos', en: 'Controls', es: 'Accionamientos', fr: 'Commandes' },
        'Proteção': { 'ar': 'Proteção', en: 'Protection', es: 'Protección', fr: 'Protection' },
        'Motores': { 'ar': 'Motores', en: 'Motors', es: 'Motores', fr: 'Moteurs' },
        'Sensores': { 'ar': 'Sensores', en: 'Sensors', es: 'Sensores', fr: 'Capteurs' },
        'Bobinas': { 'ar': 'Bobinas', en: 'Coils', es: 'Bobinas', fr: 'Bobines' },
        'Outros': { 'ar': 'Outros', en: 'Others', es: 'Otros', fr: 'Autres' }
    };

    const FULL_COMMANDS_COMPONENTS = {
        checklist_painel: { 'ar': 'Checklist do Painel', en: 'Panel Checklist', es: 'Checklist del Panel', fr: 'Checklist du panneau' },
        iec_borne_sak: { 'ar': 'Borne SAK IEC', en: 'IEC SAK Terminal Block', es: 'Borne SAK IEC', fr: 'Bornier SAK IEC' },
        multimetro: { 'ar': 'Multímetro', en: 'Multimeter', es: 'Multímetro', fr: 'Multimètre' },
        real_botoeira_config: { 'ar': 'Botoeira Configurável', en: 'Configurable Push Button', es: 'Botonera Configurable', fr: 'Bouton configurable' },
        real_botoeira_vermelha_frontal: { 'ar': 'زر أحمر واجهة', en: 'Front Red Push Button', es: 'Botonera Roja Frontal', fr: 'Bouton rouge frontal' },
        real_botoeira_verde_frontal: { 'ar': 'زر أخضر واجهة', en: 'Front Green Push Button', es: 'Botonera Verde Frontal', fr: 'Bouton vert frontal' },
        real_botoeira_emergencia_frontal: { 'ar': 'زر طوارئ واجهة', en: 'Front Emergency Push Button', es: 'Botonera de Emergencia Frontal', fr: 'Bouton d’urgence frontal' },
        real_chave_seccionadora_tripolar: { 'ar': 'قاطع عازل ثلاثي الأطوار', en: 'Three-Pole Disconnect Switch', es: 'Seccionador Tripolar', fr: 'Sectionneur tripolaire' },
        real_chave_seletora_frontal: { 'ar': 'Chave Seletora Frontal', en: 'Front Selector Switch', es: 'Selector Frontal', fr: 'Sélecteur frontal' },
        real_programador_horario: { 'ar': 'Programador Horário', en: 'Time Switch', es: 'Programador Horario', fr: 'Programmateur horaire' },
        real_transformador_comandos: { 'ar': 'Transformador de Comandos', en: 'Control Transformer', es: 'Transformador de Comandos', fr: 'Transformateur de commande' },
        real_wifi_smart_switch: { 'ar': 'Smart Switch Wi-Fi', en: 'Wi-Fi Smart Switch', es: 'Smart Switch Wi-Fi', fr: 'Smart Switch Wi-Fi' }
    };

    Object.keys(FULL_COMMANDS_CATEGORIES).forEach((key) => {
        categories[key] = FULL_COMMANDS_CATEGORIES[key];
    });

    Object.keys(FULL_COMMANDS_COMPONENTS).forEach((key) => {
        components[key] = FULL_COMMANDS_COMPONENTS[key];
    });
    function valueFromPack(pack, lang, fallback) {
        if (!pack) return fallback;
        if (!lang || lang === DEFAULT_LANGUAGE) return fallback || pack[DEFAULT_LANGUAGE];
        return pack[lang] || fallback || pack[DEFAULT_LANGUAGE];
    }

    function translateName(lib, fallback, lang) {
        const key = String(lib || '').trim();
        return valueFromPack(components[key], lang || DEFAULT_LANGUAGE, fallback);
    }

    function translateCategory(category, lang) {
        const key = String(category || '').trim();
        return valueFromPack(categories[key], lang || DEFAULT_LANGUAGE, category);
    }

    function getCurrentLanguage() {
        return window.SimuCirI18n?.getLanguage?.() || DEFAULT_LANGUAGE;
    }

    function translateRenderedMenu(root = document) {
        const lang = getCurrentLanguage();
        root.querySelectorAll?.('.menu-category').forEach((categoryEl) => {
            const header = categoryEl.querySelector(':scope > .cat-header');
            const titleEl = header?.querySelector('.cat-title');
            if (!titleEl) return;
            const original = titleEl.dataset.i18nCategoryOriginal || titleEl.textContent || '';
            titleEl.dataset.i18nCategoryOriginal = original;
            titleEl.textContent = translateCategory(original, lang);
        });
        root.querySelectorAll?.('.menu-component-btn[data-lib]').forEach((button) => {
            const label = button.querySelector('.menu-component-name');
            const original = button.dataset.i18nComponentOriginal || label?.textContent || button.title || '';
            button.dataset.i18nComponentOriginal = original;
            const translated = translateName(button.dataset.lib, original, lang);
            button.title = translated;
            if (label) label.textContent = translated;
        });
    }

    window.SimuCirComponentI18n = Object.freeze({
        categories,
        components,
        translateName,
        translateCategory,
        translateRenderedMenu
    });

    window.addEventListener('simucir:languagechange', () => {
        if (typeof window.gerarMenus === 'function') window.gerarMenus();
        window.setTimeout(() => translateRenderedMenu(document), 0);
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => translateRenderedMenu(document), { once: true });
    } else {
        translateRenderedMenu(document);
    }


    /* SimuDz: Arabic component/category labels (inside IIFE) */
    try {
      var __SIMUDZ_COMP = {"iec_fase":"طور (L)","iec_neutro":"محايد (N)","iec_fonte_trifasica_nt":"مصدر ثلاثي الأطوار + N + أرضي","iec_fonte_ac_dc":"مزود طاقة AC/DC 24 فولت","iec_transformador_partida_trifasico":"محول بدء 3 أطوار IEC","iec_setas_continuacao_3fnt":"أسهم استمرار 3 أطوار + N + أرضي","iec_segmento_cabo_in":"مقطع كابل IN","iec_segmento_cabo_out":"مقطع كابل OUT","iec_lampada":"إشارة ضوئية","iec_bobina_contator":"ملف كونتاكتور","iec_bobina_temp":"ملف مؤقت","iec_botao_na":"زر ضغط NO","iec_botao_nf":"زر ضغط NC","iec_botao_pulsador_na_nf":"زر ضغط NO/NC","iec_botao_pulsador_comum_na_nf":"زر ضغط مشترك NO/NC","iec_botoeira_emergencia_na":"زر طوارئ NO","iec_botoeira_emergencia_nf":"زر طوارئ NC","iec_botoeira_emergencia_dupla_nf":"زر طوارئ مزدوج NC","iec_contato_na":"ملامس NO","iec_contato_nf":"ملامس NC","iec_contato_comum_na_nf":"ملامس مشترك NO/NC","iec_contato_temp_na":"ملامس مؤقت NO","iec_contato_temp_nf":"ملامس مؤقت NC","iec_contator_forca":"كونتاكتور قدرة","iec_rele_seguranca":"مرحّل أمان","iec_rele_falta_fase":"مرحّل فقد طور","iec_rele_termico":"مرحّل حراري","iec_contato_rele_term_na":"ملامس مرحّل حراري NO","iec_contato_rele_term_nf":"ملامس مرحّل حراري NC","iec_disjuntor_monopolar":"قاطع أحادي القطب IEC","iec_disjuntor_bipolar":"قاطع ثنائي القطب IEC","iec_disjuntor_termomagnetico":"قاطع حراري مغناطيسي IEC","iec_disjuntor_motor":"قاطع محرك IEC","iec_fusiveis":"مجموعة فيوزات","iec_motor_tripolar":"محرك ثلاثي الأقطاب IEC","iec_motor_6_pontas":"محرك 3 أطوار (6 أطراف)","iec_chave_seletora_na":"مفتاح اختيار NO","iec_chave_seletora_nf":"مفتاح اختيار NC","iec_sensor_indutivo_na":"حساس حثي NO","iec_sensor_indutivo_nf":"حساس حثي NC","iec_sensor_capacitivo_na":"حساس سعوي NO","iec_sensor_capacitivo_nf":"حساس سعوي NC","real_contator":"كونتاكتور مساعد","real_rele_termico":"مرحّل حراري","real_rele_seguranca":"مرحّل أمان","real_rele_falta_fase":"مرحّل فقد طور","real_contator_forca":"كونتاكتور قدرة","real_contato_auxiliar":"ملامس مساعد","real_botoeira_vermelha":"زر ضغط أحمر","real_botoeira_verde":"زر ضغط أخضر","real_botoeira_emergencia":"زر طوارئ","real_botoeira_emergencia_dupla":"زر طوارئ 2NC","real_fonte_trifasica_nt":"مصدر ثلاثي الأطوار حقيقي + N + أرضي","real_fonte_24v":"مزود 100-220V / 24VDC","real_transformador_partida_trifasico":"محول بدء 3 أطوار حقيقي","real_motor_3_ligacoes":"محرك 3 أطوار (3 أطراف)","real_motor_6_ligacoes":"محرك 3 أطوار (6 أطراف)","real_sinaleiro":"إشارة ضوئية حقيقية","real_disjuntor_monopolar":"قاطع أحادي","real_disjuntor_bipolar":"قاطع ثنائي","real_disjuntor_tripolar":"قاطع ثلاثي","real_fusivel_tripolar":"فيوز ثلاثي","real_disjuntor_motor":"قاطع محرك","real_temporizador":"مؤقت","real_chave_seletora":"مفتاح اختيار","real_chave_seccionadora_tripolar":"مفتاح فصل ثلاثي الأقطاب","real_botoeira_emergencia_frontal":"زر طوارئ (واجهة)","real_botoeira_verde_frontal":"زر ضغط أخضر (واجهة)","real_botoeira_vermelha_frontal":"زر ضغط أحمر (واجهة)","real_barramento_neutro":"قضيب محايد","real_barramento_terra":"قضيب أرضي","real_barramento_pente_monofasico":"قضيب مشطي","real_barramento_pente_bifasico":"قضيب مشطي ثنائي","real_barramento_pente_trifasico":"قضيب مشطي ثلاثي","real_canaleta_reta":"قناة أسلاك مستقيمة","real_canaleta_canto_90":"زاوية قناة أسلاك 90°","real_borne_sak":"كتلة أطراف SAK","real_terminal_generico":"طرف عام","real_regua_milimetrada":"مسطرة مم/سم","real_trilho_din":"سكة DIN","real_caixa_boia_bomba":"صندوق عوامة مضخة","autofalante":"مكبر صوت","capacitor_ceramico":"مكثف خزفي","capacitor_ceramico_pf":"مكثف خزفي","capacitor_eletrolitico":"مكثف إلكتروليتي","cristal":"بلورة","cristal_4":"بلورة بأربعة أطراف","diodo":"صمام مقوم","diodo_zener":"صمام زينر","fusivel":"فيوز","indutor":"ملف","led":"LED","potenciometro":"ريوستات","regulador_7805":"منظم 7805","regulador_7809":"منظم 7809","resistor_1w":"مقاومة 1 واط","resistor_5k_10w":"مقاومة 5 كΩ / 10 واط","ressonador":"رنان","transistor_bc":"ترانزستور BC","transistor_bd":"ترانزستور BD","jfet":"ترانزستور JFET","mosfet":"ترانزستور MOSFET","triac":"ترياكي","chave_fenda":"مفك براغي","transistor_tip":"ترانزستور TIP","multimetro":"رقمي HM-2030","multimetro_2":"رقمي DT838","multimetro_analogico":"تناظري YX-360"};
      var __SIMUDZ_CAT = {"Simbologia IEC":"رموز IEC","Componentes Reais":"مكونات حقيقية","Comandos Realistas":"أوامر واقعية","Animacoes 2D":"رسوم ثنائية الأبعاد","Potência":"قدرة","Potencia":"قدرة","Acionamentos":"تشغيل","Proteção":"الحماية","Protecao":"حماية","Motores":"محركات","Sensores":"مستشعرات","Bobinas":"ملفات","Outros":"Others","Eletromecânicos":"كهروميكانيكية","Capacitores":"المكثفات","Osciladores":"المذبذبات","Diodos":"الثنائيات","Passivos":"عناصر سلبية","Resistores":"المقاومات","Semicondutores":"أشباه الموصلات","Transistores":"الترانزستورات","Ferramentas":"الأدوات","Instrumentos":"الأجهزة"};
      Object.keys(components).forEach(function(id){
        var pack = components[id];
        if (!pack || typeof pack !== 'object') return;
        if (__SIMUDZ_COMP[id]) pack.ar = __SIMUDZ_COMP[id];
      });
      Object.keys(__SIMUDZ_CAT).forEach(function(name){
        if (!categories[name]) categories[name] = {};
        categories[name].ar = __SIMUDZ_CAT[name];
      });
      valueFromPack = function(pack, lang, fallback) {
        if (!pack) return fallback;
        var L = lang || DEFAULT_LANGUAGE;
        if (pack[L] != null && pack[L] !== '') return pack[L];
        if (fallback != null && fallback !== '') return fallback;
        return pack[DEFAULT_LANGUAGE] || fallback;
      };
      if (typeof translateRenderedMenu === 'function') {
        try { translateRenderedMenu(document); } catch (__e) {}
      }
      if (typeof window.gerarMenus === 'function') {
        try { window.gerarMenus(); } catch (__e2) {}
      }
    } catch (__simudzCompErr) {}

}());




