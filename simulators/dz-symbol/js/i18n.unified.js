/**
 * SimuDz - Système International Bilingue Intégral : Français & Arabe
 * Supporte le basculement dynamique instantané Français <-> Arabe
 */
(function() {
    'use strict';

    const STORAGE_KEY = 'simudz_language';

    // 1. Dictionnaire complet des composants IEC (FR & AR)
    const COMPONENTS = {
        iec_fase: { fr: 'Phase (L)', ar: 'طور (L)' },
        iec_neutro: { fr: 'Neutre (N)', ar: 'محايد (N)' },
        iec_fonte_trifasica_nt: { fr: 'Alimentation Triphasée (3P + N + T)', ar: 'تغذية ثلاثية الأطوار (3P + N + T)' },
        iec_fonte_ac_dc: { fr: 'Alimentation AC/DC (24 Vcc)', ar: 'تغذية تيار مستمر AC/DC (24Vdc)' },
        iec_transformador_partida_trifasico: { fr: 'Transformateur de Démarrage 3~', ar: 'محول إقلاع 3 أطوار IEC' },
        iec_setas_continuacao_3fnt: { fr: 'Flèches de Continuité (3P + N + T)', ar: 'أسهم استمرار (3P + N + T)' },
        iec_segmento_cabo_in: { fr: 'Renvoi de Fil (Entrée IN)', ar: 'وصلة سلك (دخول IN)' },
        iec_segmento_cabo_out: { fr: 'Renvoi de Fil (Sortie OUT)', ar: 'وصلة سلك (خروج OUT)' },
        iec_lampada: { fr: 'Voyant Lumineux', ar: 'مصباح إشارة / بيان' },
        iec_bobina_contator: { fr: 'Bobine Contacteur (KM)', ar: 'وشيعة ملامس (KM)' },
        iec_bobina_temp: { fr: 'Bobine Temporisée (KA)', ar: 'وشيعة مؤقت زمني (KA)' },
        iec_contato_na: { fr: 'Contact Ouvert (NO 13-14)', ar: 'تماس مفتوح عادة (NO 13-14)' },
        iec_contato_nf: { fr: 'Contact Fermé (NC 21-22)', ar: 'تماس مغلق عادة (NC 21-22)' },
        iec_contato_comum_na_nf: { fr: 'Contact Inverseur (NO/NC)', ar: 'تماس تبديل مشترك (NO/NC)' },
        iec_contato_temp_na: { fr: 'Contact Temporisé (NO)', ar: 'تماس مؤقت مفتوح (NO)' },
        iec_contato_temp_nf: { fr: 'Contact Temporisé (NC)', ar: 'تماس مؤقت مغلق (NC)' },
        iec_contato_rele_term_na: { fr: 'Contact Relais Thermique (NO 97-98)', ar: 'تماس مرحل حراري مفتوح (97-98 NO)' },
        iec_contato_rele_term_nf: { fr: 'Contact Relais Thermique (NC 95-96)', ar: 'تماس مرحل حراري مغلق (95-96 NC)' },
        iec_contator_forca: { fr: 'Pôles Puissance Contacteur (1-3-5)', ar: 'أقطاب استطاعة الملامس (1-3-5)' },
        iec_disjuntor_motor: { fr: 'Disjoncteur Moteur Magnéto-Thermique', ar: 'قاطع محرك مغناطيسي حراري' },
        iec_disjuntor_termomagnetico: { fr: 'Disjoncteur Tétrapolaire / Tripolaire', ar: 'قاطع دارة مغناطيسي حراري ثلاثي/رباعي' },
        iec_disjuntor_bipolar: { fr: 'Disjoncteur Bipolaire (Ph+N)', ar: 'قاطع ثنائي القطب (Ph+N)' },
        iec_disjuntor_monopolar: { fr: 'Disjoncteur Unipolaire (1P)', ar: 'قاطع أحادي القطب (1P)' },
        iec_fusiveis: { fr: 'Sectionneur à Fusibles', ar: 'فواصم منصهرة (مصهرات)' },
        iec_rele_termico: { fr: 'Relais Thermique (Protection)', ar: 'مرحل حماية حرارية (Relais Thermique)' },
        iec_rele_falta_fase: { fr: 'Relais Contrôleur Ordre de Phase', ar: 'مرحل مراقبة الطور / التتابع' },
        iec_rele_seguranca: { fr: 'Relais de Sécurité', ar: 'مرحل أمان وتحكم' },
        iec_motor_tripolar: { fr: 'Moteur Triphasé (U-V-W)', ar: 'محرك ثلاثي الأطوار (U-V-W)' },
        iec_motor_6_pontas: { fr: 'Moteur 6 Bornes (U1-V1-W1/U2-V2-W2)', ar: 'محرك 6 أطراف (U1-V1-W1 / U2-V2-W2)' },
        iec_botao_na: { fr: 'Bouton-Poussoir Marche (NO)', ar: 'زر ضاغط تشغيل (مفتوح NO)' },
        iec_botao_nf: { fr: 'Bouton-Poussoir Arrêt (NC)', ar: 'زر ضاغط إيقاف (مغلق NC)' },
        iec_botao_pulsador_na_nf: { fr: 'Double Bouton (Marche / Arrêt)', ar: 'زر ضاغط مزدوج (تشغيل/إيقاف)' },
        iec_botao_pulsador_comum_na_nf: { fr: 'Bouton Poussoir avec Commun', ar: 'زر ضاغط مشترك NO/NC' },
        iec_botoeira_emergencia_nf: { fr: 'Arrêt d Urgence (NC)', ar: 'زر توقف استعجالي (NC)' },
        iec_botoeira_emergencia_na: { fr: 'Arrêt d Urgence (NO)', ar: 'زر توقف استعجالي (NO)' },
        iec_botoeira_emergencia_dupla_nf: { fr: 'Arrêt d Urgence Double (2NC)', ar: 'زر طوارئ مزدوج (2NC)' },
        iec_chave_seletora_na: { fr: 'Commutateur Rotatif 2 Pos (NO)', ar: 'مفتاح تبديل دوار (NO)' },
        iec_chave_seletora_nf: { fr: 'Commutateur Rotatif 2 Pos (NC)', ar: 'مفتاح تبديل دوار (NC)' },
        iec_sensor_indutivo_na: { fr: 'Capteur Inductif (NO)', ar: 'حساس تحريضي (مفتوح NO)' },
        iec_sensor_indutivo_nf: { fr: 'Capteur Inductif (NC)', ar: 'حساس تحريضي (مغلق NC)' },
        iec_sensor_capacitivo_na: { fr: 'Capteur Capacitif (NO)', ar: 'حساس سعوي (مفتوح NO)' },
        iec_sensor_capacitivo_nf: { fr: 'Capteur Capacitif (NC)', ar: 'حساس سعوي (مغلق NC)' },
        iec_sensor_optico_na: { fr: 'Capteur Photoélectrique (NO)', ar: 'حساس كهروضوئي (NO)' },
        iec_sensor_optico_nf: { fr: 'Capteur Photoélectrique (NC)', ar: 'حساس كهروضوئي (NC)' },
        iec_sensor_fim_de_curso_na: { fr: 'Fin de Course Mécanique (NO)', ar: 'نهاية شوط ميكانيكية (NO)' },
        iec_sensor_fim_de_curso_nf: { fr: 'Fin de Course Mécanique (NC)', ar: 'نهاية شوط ميكانيكية (NC)' },
        iec_borne_sak: { fr: 'Borne de Raccordement (SAK)', ar: 'كتلة أطراف توصيل (SAK)' }
    };

    // 2. Dictionnaire des catégories
    const CATEGORIES = {
        fontes: { fr: 'Puissance & Sources', ar: 'تغذية ومصادر قدرة' },
        acionamentos: { fr: 'Actionneurs & Contacts', ar: 'تشغيل وملامسات' },
        protecao: { fr: 'Protection & Coupures', ar: 'الحماية والفواصم' },
        motores: { fr: 'Moteurs Électriques', ar: 'محركات كهربائية' },
        sensores: { fr: 'Capteurs & Fins de Course', ar: 'مستشعرات ونهايات شوط' },
        bobinas: { fr: 'Bobines & Signalisation', ar: 'وشائع وإشارات' },
        outros: { fr: 'Autres & Raccordements', ar: 'ملحقات وتوصيلات' }
    };

    // 3. Dictionnaire complet des termes d interface (UI)
    const UI_TERMS = {
        'SIMULAR': { fr: 'SIMULER', ar: 'تشغيل المحاكاة' },
        'PARAR': { fr: 'ARRÊTER', ar: 'إيقاف المحاكاة' },
        'تشغيل': { fr: 'SIMULER', ar: 'تشغيل' },
        'إيقاف': { fr: 'ARRÊTER', ar: 'إيقاف' },
        'سلك': { fr: 'Fil', ar: 'سلك' },
        'FIO': { fr: 'Fil', ar: 'سلك' },
        'تحديد': { fr: 'Sélection', ar: 'تحديد' },
        'Seleção': { fr: 'Sélection', ar: 'تحديد' },
        'حذف': { fr: 'Supprimer', ar: 'حذف' },
        'Apagar': { fr: 'Supprimer', ar: 'حذف' },
        'تدوير (90°)': { fr: 'Pivoter 90°', ar: 'تدوير (90°)' },
        'Girar': { fr: 'Pivoter', ar: 'تدوير' },
        'تراجع': { fr: 'Annuler', ar: 'تراجع' },
        'Desfazer': { fr: 'Annuler', ar: 'تراجع' },
        'إعادة': { fr: 'Rétablir', ar: 'إعادة' },
        'Refazer': { fr: 'Rétablir', ar: 'إعادة' },
        'نسخ': { fr: 'Copier', ar: 'نسخ' },
        'Copiar': { fr: 'Copier', ar: 'نسخ' },
        'لصق': { fr: 'Coller', ar: 'لصق' },
        'Colar': { fr: 'Coller', ar: 'لصق' },
        'تحريك': { fr: 'Déplacer', ar: 'تحريك' },
        'Mover Tela': { fr: 'Déplacer', ar: 'تحريك' },
        'تعديل K1/K2': { fr: 'Repère K1/K2', ar: 'تعديل K1/K2' },
        'الملتيميتر': { fr: 'Multimètre', ar: 'الملتيميتر' },
        'الملتيميتر (Multimètre)': { fr: 'Multimètre de mesure', ar: 'الملتيميتر' },
        'حفظ .dz': { fr: 'Enregistrer .dz', ar: 'حفظ .dz' },
        'فتح .dz': { fr: 'Ouvrir .dz', ar: 'فتح .dz' },
        'أدوات': { fr: 'Outils', ar: 'أدوات' },
        'قائمة الأوامر': { fr: 'Bibliothèque IEC', ar: 'قائمة الأوامر' },
        'Menu Comandos': { fr: 'Bibliothèque IEC', ar: 'قائمة الأوامر' },
        'الأدوات': { fr: 'Boîte à Outils', ar: 'الأدوات' },
        'Ferramentas': { fr: 'Boîte à Outils', ar: 'الأدوات' },
        'مساحة عمل داكنة': { fr: 'Fond Sombre', ar: 'مساحة عمل داكنة' },
        'Workspace escuro': { fr: 'Fond Sombre', ar: 'مساحة عمل داكنة' },
        'تحرير': { fr: 'Édition', ar: 'تحرير' },
        'Edição': { fr: 'Édition', ar: 'تحرير' },
        'رسم': { fr: 'Dessin', ar: 'رسم' },
        'Desenho': { fr: 'Dessin', ar: 'رسم' },
        'مشروع': { fr: 'Projet', ar: 'مشروع' },
        'Projeto': { fr: 'Projet', ar: 'مشروع' },
        'الأسلاك والتوصيل': { fr: 'Câblage & Fils', ar: 'الأسلاك والتوصيل' },
        'Fiação': { fr: 'Câblage & Fils', ar: 'الأسلاك والتوصيل' },
        'فتح الكل': { fr: 'Tout Développer', ar: 'فتح الكل' },
        'Expandir tudo': { fr: 'Tout Développer', ar: 'فتح الكل' },
        'طي الكل': { fr: 'Tout Réduire', ar: 'طي الكل' },
        'Recolher tudo': { fr: 'Tout Réduire', ar: 'طي الكل' },
        'لون السلك': { fr: 'Couleur Fil', ar: 'لون السلك' },
        'Nouvelle feuille': { fr: 'Nouvelle page', ar: 'صفحة جديدة' },
        'Cartouche & Format': { fr: 'Cartouche & Format', ar: 'إعدادات الإطار والصفحة' },
        'إعداد الصفحة والإطار': { fr: 'Configuration du Folio', ar: 'إعداد الصفحة والإطار' },
        'Configurar Folha': { fr: 'Configuration du Folio', ar: 'إعداد الصفحة والإطار' },
        'اسم الصفحة': { fr: 'Titre du folio', ar: 'اسم الصفحة' },
        'Nome da folha': { fr: 'Titre du folio', ar: 'اسم الصفحة' },
        'اسم المشروع': { fr: 'Nom du projet', ar: 'اسم المشروع' },
        'Nome do projeto': { fr: 'Nom du projet', ar: 'اسم المشروع' },
        'Propriétés du Composant': { fr: 'Propriétés du Composant', ar: 'خصائص المكون' },
        'Repère (Tag)': { fr: 'Repère (ex: KM1, Q1)', ar: 'الرمز المرجعي (مثل: KM1)' },
        'Fabricant': { fr: 'Fabricant', ar: 'الشركة المصنعة' },
        'Modèle': { fr: 'Modèle / Référence', ar: 'الطراز' },
        'Comentário': { fr: 'Commentaire / Notes', ar: 'ملاحظات' },
        'Exibir modelo': { fr: 'Afficher le modèle', ar: 'إظهار الطراز' },
        'Exibir fabricante': { fr: 'Afficher le fabricant', ar: 'إظهار الشركة المصنعة' },
        'Temporisation (s)': { fr: 'Temporisation (secondes)', ar: 'المدة الزمنية (بالثواني)' },
        'Cor da lâmpada': { fr: 'Couleur du voyant', ar: 'لون المصباح' },
        'Salvar': { fr: 'Enregistrer', ar: 'حفظ' },
        'Cancelar': { fr: 'Annuler', ar: 'إلغاء' },
        'حفظ': { fr: 'Enregistrer', ar: 'حفظ' },
        'إلغاء': { fr: 'Annuler', ar: 'إلغاء' },
        'المقطع 1': { fr: 'Section 1 (0.75mm²)', ar: 'مقطع 1 (رفيع)' },
        'المقطع 2': { fr: 'Section 2 (1.5mm²)', ar: 'مقطع 2 (متوسط)' },
        'المقطع 3': { fr: 'Section 3 (2.5mm²)', ar: 'مقطع 3 (سميك)' }
    };

    function getLang() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('simucir.comandos.language');
            if (saved === 'ar' || saved === 'fr') return saved;
        } catch (_) {}
        return 'fr'; // Par défaut : Français
    }

    function setLang(newLang) {
        if (newLang !== 'fr' && newLang !== 'ar') newLang = 'fr';
        try {
            localStorage.setItem(STORAGE_KEY, newLang);
            localStorage.setItem('simucir.comandos.language', newLang);
            localStorage.setItem('dz.language', newLang);
        } catch (_) {}

        document.documentElement.setAttribute('lang', newLang);
        document.documentElement.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');

        updateLanguageSelectorUI();
        applyTranslations();

        if (typeof window.gerarMenus === 'function') {
            try { window.gerarMenus(); } catch (_) {}
        }
    }

    function updateLanguageSelectorUI() {
        const toggleBtn = document.getElementById('btn-dz-lang-toggle');
        if (!toggleBtn) return;
        const current = getLang();
        if (current === 'fr') {
            toggleBtn.innerHTML = '<img src="assets/flags/fr.svg" style="width:20px;height:14px;border-radius:2px;object-fit:cover;" alt="FR"><span style="font-size:11px;font-weight:700;">FR</span><i class="fa-solid fa-chevron-down" style="font-size:9px;opacity:0.7;"></i>';
            toggleBtn.title = 'Langue : Français (Cliquer pour changer en العربية)';
        } else {
            toggleBtn.innerHTML = '<span style="font-size:14px;">🇩🇿</span><span style="font-size:11px;font-weight:700;">عربي</span><i class="fa-solid fa-chevron-down" style="font-size:9px;opacity:0.7;"></i>';
            toggleBtn.title = 'اللغة: العربية (انقر للتبديل إلى Français)';
        }
    }

    function buildLanguageSelector() {
        if (document.getElementById('dz-lang-selector-wrap')) return;
        const container = document.querySelector('.top-bar .control-group');
        if (!container) return;

        const wrap = document.createElement('div');
        wrap.id = 'dz-lang-selector-wrap';
        wrap.style.cssText = 'position:relative;display:inline-flex;align-items:center;margin:0 4px;';

        const btn = document.createElement('button');
        btn.id = 'btn-dz-lang-toggle';
        btn.type = 'button';
        btn.className = 'btn-top-dz';
        btn.style.cssText = 'background:#1e293b!important;border:1px solid #475569!important;color:#f8fafc!important;gap:5px;cursor:pointer;';
        btn.onclick = (e) => {
            e.stopPropagation();
            menu.style.display = menu.style.display === 'none' ? 'grid' : 'none';
        };

        const menu = document.createElement('div');
        menu.id = 'dz-lang-dropdown-menu';
        menu.style.cssText = 'display:none;position:absolute;top:calc(100% + 6px);left:0;background:#1e293b;border:2px solid #38bdf8;border-radius:8px;padding:6px;box-shadow:0 12px 28px rgba(0,0,0,0.8);z-index:99999;min-width:140px;gap:4px;';

        const optFR = document.createElement('button');
        optFR.type = 'button';
        optFR.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 8px;background:transparent;border:none;color:#f8fafc;font-size:12px;font-weight:600;cursor:pointer;border-radius:4px;width:100%;text-align:left;';
        optFR.innerHTML = '<img src="assets/flags/fr.svg" style="width:20px;height:14px;border-radius:2px;object-fit:cover;"> Français';
        optFR.onmouseover = () => optFR.style.background = '#334155';
        optFR.onmouseout = () => optFR.style.background = 'transparent';
        optFR.onclick = () => { setLang('fr'); menu.style.display = 'none'; };

        const optAR = document.createElement('button');
        optAR.type = 'button';
        optAR.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 8px;background:transparent;border:none;color:#f8fafc;font-size:12px;font-weight:600;cursor:pointer;border-radius:4px;width:100%;text-align:left;';
        optAR.innerHTML = '<span style="font-size:16px;">🇩🇿</span> العربية';
        optAR.onmouseover = () => optAR.style.background = '#334155';
        optAR.onmouseout = () => optAR.style.background = 'transparent';
        optAR.onclick = () => { setLang('ar'); menu.style.display = 'none'; };

        menu.appendChild(optFR);
        menu.appendChild(optAR);
        wrap.appendChild(btn);
        wrap.appendChild(menu);

        container.appendChild(wrap);

        document.addEventListener('click', (e) => {
            if (!wrap.contains(e.target)) menu.style.display = 'none';
        });

        updateLanguageSelectorUI();
    }

    function applyTranslations() {
        const lang = getLang();

        // 1. Boutons bibliothèque composants
        document.querySelectorAll('.menu-component-btn[data-lib]').forEach(btn => {
            const lib = btn.dataset.lib;
            const entry = COMPONENTS[lib];
            if (entry) {
                const name = entry[lang] || entry.fr;
                btn.title = name;
                const label = btn.querySelector('.menu-component-name');
                if (label) label.textContent = name;
            }
        });

        // 2. Catégories de la bibliothèque
        document.querySelectorAll('.menu-category').forEach(cat => {
            const classId = cat.dataset.menuClass;
            const entry = CATEGORIES[classId];
            if (entry) {
                const titleEl = cat.querySelector('.cat-title');
                if (titleEl) titleEl.textContent = entry[lang] || entry.fr;
            }
        });

        // 3. Boutons et étiquettes statiques
        document.querySelectorAll('span, button, p, h2, h3, label, a').forEach(el => {
            if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
                const txt = el.textContent.trim();
                if (UI_TERMS[txt] && UI_TERMS[txt][lang]) {
                    el.textContent = UI_TERMS[txt][lang];
                }
            }
            if (el.title) {
                const t = el.title.trim();
                if (UI_TERMS[t] && UI_TERMS[t][lang]) {
                    el.title = UI_TERMS[t][lang];
                }
            }
            if (el.getAttribute('data-label')) {
                const l = el.getAttribute('data-label').trim();
                if (UI_TERMS[l] && UI_TERMS[l][lang]) {
                    el.setAttribute('data-label', UI_TERMS[l][lang]);
                }
            }
        });

        // 4. Onglets de page / folio (Folha X -> Page X ou الصفحة X)
        document.querySelectorAll('.sheet-tab').forEach(tab => {
            const text = tab.textContent || '';
            if (/Folha/i.test(text) || /الصفحة/i.test(text) || /Page/i.test(text)) {
                const num = (text.match(/d+/) || ['1'])[0];
                tab.textContent = lang === 'fr' ? ('Page ' + num) : ('الصفحة ' + num);
            }
        });

        // 5. Bouton Lecture dans la palette flottante
        const floatingPlay = document.getElementById('floating-play-text');
        if (floatingPlay) {
            const isSimulating = document.getElementById('floating-btn-play')?.classList.contains('is-running');
            if (isSimulating) {
                floatingPlay.textContent = lang === 'fr' ? 'Arrêter' : 'إيقاف';
            } else {
                floatingPlay.textContent = lang === 'fr' ? 'Simuler' : 'تشغيل';
            }
        }
    }

    // Exposer l API globale pour le moteur
    window.SimuDzI18n = {
        getLanguage: getLang,
        setLanguage: setLang,
        t: (k) => (UI_TERMS[k] && UI_TERMS[k][getLang()]) || k
    };

    window.SimuDzComponentI18n = {
        translateName: (lib, fallback) => (COMPONENTS[lib] && COMPONENTS[lib][getLang()]) || fallback,
        translateCategory: (catId) => (CATEGORIES[catId] && CATEGORIES[catId][getLang()]) || catId
    };

    // Initialisation
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            buildLanguageSelector();
            applyTranslations();
            setInterval(applyTranslations, 1200);
        });
    } else {
        buildLanguageSelector();
        applyTranslations();
        setInterval(applyTranslations, 1200);
    }
})();
