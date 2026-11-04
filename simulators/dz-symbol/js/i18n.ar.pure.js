/**
 * SimuDz - الترجمة العربية الكاملة الشاملة والنهائية (100% Arabic IEC Standard)
 */
(function() {
    'use strict';

    // 1. قاموس شامل لجميع مكونات وتماسات IEC بالعربية
    const AR_COMPONENTS = {
        iec_fase: 'طور (L)',
        iec_neutro: 'محايد (N)',
        iec_fonte_trifasica_nt: 'تغذية ثلاثية الأطوار (3P + N + T)',
        iec_fonte_ac_dc: 'تغذية تيار مستمر AC/DC (24Vdc)',
        iec_transformador_partida_trifasico: 'محول إقلاع 3 أطوار IEC',
        iec_setas_continuacao_3fnt: 'أسهم استمرار (3P + N + T)',
        iec_segmento_cabo_in: 'وصلة سلك (دخول IN)',
        iec_segmento_cabo_out: 'وصلة سلك (خروج OUT)',
        iec_lampada: 'مصباح إشارة / بيان',
        iec_bobina_contator: 'وشيعة ملامس (KM)',
        iec_bobina_temp: 'وشيعة مؤقت زمني (KA)',
        iec_contato_na: 'تماس مفتوح عادة (NO 13-14)',
        iec_contato_nf: 'تماس مغلق عادة (NC 21-22)',
        iec_contato_comum_na_nf: 'تماس تبديل مشترك (NO/NC)',
        iec_contato_temp_na: 'تماس مؤقت مفتوح (NO)',
        iec_contato_temp_nf: 'تماس مؤقت مغلق (NC)',
        iec_contato_rele_term_na: 'تماس مرحل حراري مفتوح (97-98 NO)',
        iec_contato_rele_term_nf: 'تماس مرحل حراري مغلق (95-96 NC)',
        iec_contator_forca: 'أقطاب استطاعة الملامس (1-3-5)',
        iec_disjuntor_motor: 'قاطع محرك مغناطيسي حراري',
        iec_disjuntor_termomagnetico: 'قاطع دارة مغناطيسي حراري ثلاثي/رباعي',
        iec_disjuntor_bipolar: 'قاطع ثنائي القطب (Ph+N)',
        iec_disjuntor_monopolar: 'قاطع أحادي القطب (1P)',
        iec_fusiveis: 'فواصم منصهرة (مصهرات)',
        iec_rele_termico: 'مرحل حماية حرارية (Relais Thermique)',
        iec_rele_falta_fase: 'مرحل مراقبة الطور / التتابع',
        iec_rele_seguranca: 'مرحل أمان وتحكم',
        iec_motor_tripolar: 'محرك ثلاثي الأطوار (U-V-W)',
        iec_motor_6_pontas: 'محرك 6 أطراف (U1-V1-W1 / U2-V2-W2)',
        iec_botao_na: 'زر ضاغط تشغيل (مفتوح NO)',
        iec_botao_nf: 'زر ضاغط إيقاف (مغلق NC)',
        iec_botao_pulsador_na_nf: 'زر ضاغط مزدوج (تشغيل/إيقاف)',
        iec_botao_pulsador_comum_na_nf: 'زر ضاغط مشترك NO/NC',
        iec_botoeira_emergencia_nf: 'زر توقف استعجالي (NC)',
        iec_botoeira_emergencia_na: 'زر توقف استعجالي (NO)',
        iec_botoeira_emergencia_dupla_nf: 'زر طوارئ مزدوج (2NC)',
        iec_chave_seletora_na: 'مفتاح تبديل دوار (NO)',
        iec_chave_seletora_nf: 'مفتاح تبديل دوار (NC)',
        iec_sensor_indutivo_na: 'حساس تحريضي (مفتوح NO)',
        iec_sensor_indutivo_nf: 'حساس تحريضي (مغلق NC)',
        iec_sensor_capacitivo_na: 'حساس سعوي (مفتوح NO)',
        iec_sensor_capacitivo_nf: 'حساس سعوي (مغلق NC)',
        iec_sensor_optico_na: 'حساس كهروضوئي (NO)',
        iec_sensor_optico_nf: 'حساس كهروضوئي (NC)',
        iec_sensor_fim_de_curso_na: 'نهاية شوط ميكانيكية (NO)',
        iec_sensor_fim_de_curso_nf: 'نهاية شوط ميكانيكية (NC)',
        iec_borne_sak: 'كتلة أطراف توصيل (SAK)'
    };

    // 2. ترجمة نصوص الواجهة من البرتغالية والفرنسية والإنجليزية إلى العربية
    const AR_TERMS = {
        'Contato NA': 'تماس مفتوح عادة (NO)',
        'Contato NF': 'تماس مغلق عادة (NC)',
        'Contato Temp NA': 'تماس مؤقت مفتوح (NO)',
        'Contato Temp NF': 'تماس مؤقت مغلق (NC)',
        'Contato Rele Térmico NA': 'تماس مرحل حراري مفتوح (NO)',
        'Contato Rele Termico NA': 'تماس مرحل حراري مفتوح (NO)',
        'Contato Relé Térmico NF': 'تماس مرحل حراري مغلق (NC)',
        'Contato Rele Termico NF': 'تماس مرحل حراري مغلق (NC)',
        'Contato Comum NA/NF': 'تماس مشترك NO/NC',
        'Bobina Contator': 'وشيعة ملامس (KM)',
        'Bobina Temporizadora': 'وشيعة مؤقت زمني (KA)',
        'Contator Força': 'ملامس استطاعة (1-3-5)',
        'Contator Forca': 'ملامس استطاعة (1-3-5)',
        'Contato Auxiliar': 'تماس مساعد',
        'Botao NA': 'زر تشغيل مفتوح (NO)',
        'Botão NA': 'زر تشغيل مفتوح (NO)',
        'Botao NF': 'زر إيقاف مغلق (NC)',
        'Botão NF': 'زر إيقاف مغلق (NC)',
        'Botao Emergencia NF': 'زر طوارئ مغلق (NC)',
        'Botão Emergência NF': 'زر طوارئ مغلق (NC)',
        'Botao Emergencia NA': 'زر طوارئ مفتوح (NO)',
        'Botão Emergência NA': 'زر طوارئ مفتوح (NO)',
        'Rele Termico': 'مرحل حراري',
        'Relé Térmico': 'مرحل حراري',
        'Disjuntor Motor IEC': 'قاطع محرك',
        'Disjuntor Termomagnetico IEC': 'قاطع مغناطيسي حراري',
        'Disjuntor Monopolar IEC': 'قاطع أحادي القطب',
        'Disjuntor Bipolar IEC': 'قاطع ثنائي القطب',
        'Conjunto de Fusiveis': 'طقم مصهرات',
        'Motor Tripolar IEC': 'محرك ثلاثي الأطوار',
        'Motor 3F (6 pontas)': 'محرك 6 أطراف',
        'Chave Seletora NA': 'مفتاح اختيار NO',
        'Chave Seletora NF': 'مفتاح اختيار NC',
        'Sensor Indutivo NA': 'حساس تحريضي NO',
        'Sensor Indutivo NF': 'حساس تحريضي NC',
        'Sensor Capacitivo NA': 'حساس سعوي NO',
        'Sensor Capacitivo NF': 'حساس سعوي NC',
        'Sinaleiro': 'مصباح إشارة',
        'Fase (L)': 'طور (L)',
        'Neutro (N)': 'محايد (N)',
        'Terra': 'أرضي (PE)',
        
        // Catégories & Outils
        'Simbologia IEC': 'الرموز المعيارية IEC',
        'Simbologia': 'الرموز IEC',
        'Fiação': 'الأسلاك والتوصيل',
        'Câblage': 'الأسلاك والتوصيل',
        'FIO': 'سلك',
        'EMENDA': 'تفرع سلكي',
        'AUTO FIO': 'توصيل تلقائي',
        'Edição': 'تحرير',
        'Desenho': 'رسم',
        'Seleção': 'تحديد',
        'Apagar': 'حذف',
        'Girar': 'تدوير (90°)',
        'Desfazer': 'تراجع',
        'Refazer': 'إعادة',
        'Copiar': 'نسخ',
        'Colar': 'لصق',
        'Info': 'معلومات',
        'Engenharia': 'تحريك',
        'Modo Engenharia': 'تحريك العرض',
        'Editar': 'تعديل',
        'Déplacer': 'تحريك',
        'Modifier': 'تعديل',
        'Sélection': 'تحديد',
        'Pivoter': 'تدوير (90°)',
        'Supprimer': 'حذف',
        'Annuler': 'تراجع',
        'Rétablir': 'إعادة',
        'SIMULAR': 'تشغيل المحاكاة',
        'PARAR': 'إيقاف المحاكاة',
        'Simulação': 'محاكاة',
        'Imprimer PDF': 'طباعة PDF',
        'Nouvelle feuille': 'صفحة جديدة',
        'Cartouche & Format': 'إعدادات الإطار والصفحة',
        'Renommer': 'إعادة تسمية',
        'Folha 1': 'الصفحة 1',
        'Folha': 'صفحة',
        'Outils': 'أدوات التحرير',
        'Propriétés du Composant': 'خصائص المكون',
        'Repère (Tag)': 'الرمز المرجعي (مثل: KM1)',
        'Fabricant': 'الشركة المصنعة',
        'Modèle': 'الطراز',
        'Comentário': 'ملاحظات',
        'Exibir modelo': 'إظهار الطراز',
        'Exibir fabricante': 'إظهار الشركة المصنعة',
        'Temporisation (s)': 'المدة الزمنية (بالثواني)',
        'Cor da lâmpada': 'لون المصباح',
        'Salvar': 'حفظ',
        'Cancelar': 'إلغاء',
        'Expandir tudo': 'فتح الكل',
        'Recolher tudo': 'طي الكل',
        'Menu Comandos': 'قائمة الأوامر',
        'Ferramentas': 'الأدوات',
        'Workspace escuro': 'مساحة عمل داكنة',
        'Configurar Folha': 'إعداد الصفحة',
        'Nome da folha': 'اسم الصفحة',
        'Nome do projeto': 'اسم المشروع',
        'Nova folha': 'صفحة جديدة',
        'Apagar a folha ativa': 'حذف الصفحة النشطة',
        'Espessura do desenho': 'سُمك الرسم',
        'Cor do desenho': 'لون الرسم',
        'Preencher': 'تعبئة',
        'Projeto': 'مشروع',
        'Desenho': 'رسم',
        'Fiação': 'الأسلاك والتوصيل',
        'Edição': 'تحرير',
        'Espessura': 'سُمك الخط',
        'Linhas': 'الخطوط',
        'Traço': 'الخط',
        'Forma': 'الشكل',

    };

    // Traduire le DOM récursivement
    function translateElements() {
        // 1. Bouton Simuler
        const btnPlay = document.getElementById('btn-play');
        if (btnPlay) {
            const isRunning = btnPlay.classList.contains('simulating') || btnPlay.innerText.includes('PARAR') || btnPlay.innerText.includes('ARRÊTER');
            btnPlay.innerHTML = isRunning 
                ? '<i class="fa-solid fa-stop"></i> إيقاف المحاكاة' 
                : '<i class="fa-solid fa-play"></i> تشغيل المحاكاة';
        }

        // 2. Boutons de navigation et textes
        document.querySelectorAll('.menu-component-btn[data-lib]').forEach(btn => {
            const lib = btn.dataset.lib;
            const arName = AR_COMPONENTS[lib];
            if (arName) {
                btn.title = arName;
                const label = btn.querySelector('.menu-component-name');
                if (label) label.textContent = arName;
            }
        });

        // 3. Titres et étiquettes
        document.querySelectorAll('span, button, p, h2, h3, label, a, .cat-title').forEach(el => {
            const txt = el.innerText.trim();
            if (AR_TERMS[txt]) {
                el.innerText = AR_TERMS[txt];
            }
            if (el.title && AR_TERMS[el.title.trim()]) {
                el.title = AR_TERMS[el.title.trim()];
            }
            if (el.getAttribute('data-label') && AR_TERMS[el.getAttribute('data-label').trim()]) {
                el.setAttribute('data-label', AR_TERMS[el.getAttribute('data-label').trim()]);
            }
        });

        
        // 5. Remplacement dynamique de Folha dans tous les boutons et onglets
        document.querySelectorAll('.sheet-tab, button, span').forEach(el => {
            if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
                const text = el.textContent;
                if (/^\s*Folha\s*(\d+)?\s*$/i.test(text)) {
                    el.textContent = text.replace(/Folha/i, 'الصفحة');
                } else if (/Folha/i.test(text)) {
                    el.textContent = text.replace(/Folha/gi, 'الصفحة');
                }
            }
        });

        // 4. Bornes des composants sur le canvas
        document.querySelectorAll('.pin-label').forEach(p => {
            // garder les numéros (13, 14, A1, A2, 95, 96, etc.) intacts
        });
    }

    // Configurer le bridge global
    window.SimuDzI18n = {
        getLanguage: () => 'ar',
        t: (k) => AR_TERMS[k] || k
    };
    window.SimuDzComponentI18n = {
        translateName: (lib, fallback) => AR_COMPONENTS[lib] || AR_TERMS[fallback] || fallback,
        translateCategory: (cat) => AR_TERMS[cat] || cat
    };

    // Lancer au chargement et sur mutations DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            translateElements();
            setInterval(translateElements, 1000);
        });
    } else {
        translateElements();
        setInterval(translateElements, 1000);
    }
})();
