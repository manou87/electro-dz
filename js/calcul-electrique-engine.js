/** Core: Ohm, Puissance, Chute, Section — app/calculator.tsx */
(function(g){
'use strict';
const CT=g.ElectroDzCableThermal;if(!CT)throw new Error('cableThermal');
const {groupingFactorK4Iec60364,thermalOk,computeThermalSizing}=CT;
const I18N={fr:{"calcCardDescOhmLaw":"Tension, intensité, résistance","calcCardDescPowerEnergy":"Calculs de puissance et énergie","calcCardDescCopperResistance":"Résistance du cuivre avec température","calcCardDescVoltageDrop":"Calcul de la chute de tension","calcCardDescCableSection":"Dimensionnement des câbles","calcCardDescSelectivity":"DDR et disjoncteurs magnéto-thermiques","installMethod_A1_name":"Conduit encastré mur isolant","installMethod_A1_desc":"Mur isolant thermique (méthode A — dérating forte)","installMethod_A2_name":"Conduit encastré maçonnerie","installMethod_A2_desc":"Mur en béton ou brique (méthode A)","installMethod_B1_name":"Conduit apparent","installMethod_B1_desc":"Conduit fixé en apparent — référence facteur 1 (indicatif)","installMethod_B2_name":"Moulure/plinthe","installMethod_B2_desc":"Moulure ou plinthe électrique","installMethod_C_name":"Chemin de câbles","installMethod_C_desc":"Couche unique sur chemin perforé / aéré — ventilation en général au moins équivalente au conduit apparent (IEC méthode C)","installMethod_D1_name":"Conduit enterré","installMethod_D1_desc":"Conduit enterré dans le sol (méthode D)","installMethod_D2_name":"Câble enterré direct","installMethod_D2_desc":"Câble enterré sans conduit (méthode D)","installMethod_E_name":"Goulotte","installMethod_E_desc":"Goulotte / fourreau (souvent moins favorable que plateau ouvert)","installMethod_F_name":"Plancher technique","installMethod_F_desc":"Plancher technique ventilé","installMethod_G_name":"Vide de construction","installMethod_G_desc":"Vide sanitaire ou combles","ddrDesc_AC":"Courant alternatif sinusoïdal","ddrDesc_A":"Courant alternatif + composante continue","ddrDesc_B":"Courant alternatif + continu + haute fréquence","ddrDesc_F":"Courant alternatif + composante continue 1 kHz","ddrDesc_EV":"Véhicules électriques","ddrDesc_Bplus":"B+ avec protection renforcée","breakerCurve_B_name":"Courbe B","breakerCurve_B_desc":"Déclenchement instantané 3–5 In","breakerCurve_C_name":"Courbe C","breakerCurve_C_desc":"Déclenchement instantané 5–10 In","breakerCurve_D_name":"Courbe D","breakerCurve_D_desc":"Déclenchement instantané 10–20 In","breakerCurve_K_name":"Courbe K","breakerCurve_K_desc":"Déclenchement instantané 8–12 In","breakerCurve_Z_name":"Courbe Z","breakerCurve_Z_desc":"Déclenchement instantané 2–3 In","selectivityTypesMismatch":"❌ Non sélectif — types incompatibles","selectivityChronoAppend":"⚠️ Sélectivité chronométrique non activée (temps de déclenchement identiques ~40 ms)","selectivityRecCriticalDDR":"🚨 CRITIQUE : types de DDR incompatibles","selectivityRecProblemPrefix":"Problème :","selectivityRecMandatoryUpstream":"Solution obligatoire : modifier le type DDR amont pour détecter les mêmes défauts","selectivityRecCompatibleTypesPrefix":"Types compatibles :","selectivityRecChronoDisabled":"⚠️ Sélectivité chronométrique non activée (temps de déclenchement identiques ~40 ms)","selectivityRecUseSelectiveDDR":"Recommandation : utiliser un DDR amont sélectif avec retard > 130 ms pour améliorer la sélectivité","calcSaveAssociationTitle":"Association requise","calcSaveAssociationBody":"Choisissez au moins un chantier ou un devis (ou les deux).","calcSavedTitle":"Enregistré","calcSavedBody":"Le calcul a été associé au chantier et/ou au devis.","calcSaveErrorGeneric":"Impossible d’enregistrer","calcAlertPowerVoltage":"Veuillez remplir la puissance et la tension","calcAlertCurrentVoltage":"Veuillez remplir le courant et la tension","calcAlertCurrentResistance":"Veuillez remplir le courant et la résistance","calcAlertVoltageCurrent":"Veuillez remplir la tension et le courant","calcAlertPowerTime":"Veuillez remplir la puissance et le temps","calcAlertCurrentLengthSection":"Veuillez remplir le courant, la longueur et la section","calcAlertCurrentLength":"Veuillez remplir l’intensité et la longueur","calcAlertFillSelectivity":"Veuillez remplir tous les champs","calcAlertLengthSectionTemp":"Veuillez remplir la longueur, la section et la température","calcAlertCosPhiRange":"cos φ doit être compris entre 0 et 1","calcAlertPowerBalanceMin":"Saisissez au moins une ligne avec une puissance installée Pi > 0 (W).","calcAlertPowerBalancePositive":"La puissance de demande totale doit être positive.","selectivityLabelBreakerUpstream":"Disjoncteur amont (A)","selectivityLabelBreakerDownstream":"Disjoncteur aval (A)","selectivityLabelDDRUpstream":"DDR amont (mA)","selectivityLabelDDRDownstream":"DDR aval (mA)","selectivityLabelDDRTypeUpstream":"Type DDR amont","selectivityLabelDDRTypeDownstream":"Type DDR aval","selectivityLabelDDRSelectiveQ":"DDR amont sélectif ?","selectiveDDRHintYes":"DDR sélectif avec retard de déclenchement > 130 ms","selectiveDDRHintNo":"DDR standard — pas de sélectivité possible avec le DDR aval","calcResultMethodLabel":"Mode de pose :","calcResultSelectivityTypeLabel":"Type de sélectivité :","calcRecommendationsLabel":"Recommandations :","calcSelectiveDDRLabel":"DDR sélectif :","calcSelectiveDDRActive":"✓ Activé (≥ 300 mA)","calcAdditionalDataLabel":"Données supplémentaires :","calcPowerComputedLabel":"Puissance calculée :","calcIntensityLabel":"Intensité :","calcVoltageLabel":"Tension :","calcCosPhiLabel":"cos φ :","calcSectionComputedLabel":"Section calculée :","calcSectionNormalizedLabel":"Section normalisée :","cableInputCircuitCurrent":"Intensité du circuit","cableInputCableLength":"Longueur du câble","cableInputCosPhi":"cos φ (facteur de puissance)","cableInputInstallModeIEC":"Mode de pose IEC 60364-5-52","cableInputExplainPose":"Explication des modes de pose","cableInsulationExplainBtn":"Explication des matériaux","cableInsulationLabel":"Type d'isolation","cableModalRecommendedTitle":"Section recommandée","cableModalCalcNonStd":"Section calculée (non normalisée) :","cableModalParallelBundle":"Groupement de câbles normalisé (section totale) :","cableModalNormNext":"Section normalisée (immédiatement supérieure) :","cableModalDetails":"Détails :","cableModalNonConform":"⚠️ Rendu hors limites standards","cableModalDimResult":"Résultat dimensionnement","cableModalRefSection":"Section calculée (réf.) :","cableModalCorrectionFactors":"Facteurs de correction","cableModalVerifications":"Vérifications","cableModalAdmissibleCurrent":"Intensité admissible :","cableLabelMax":"max","cableLabelFactor":"facteur","cableLabelTotalFactor":"Coefficient total :","cableAltParallelTpl":"{n} câbles en parallèle {mm} mm²","cableAltSpecialTpl":"⚠️ Intensité trop élevée ({i} A) — consulter un spécialiste","cableAltInsufficient":"Section insuffisante","cableInterpNormSolution":"✅ Solution normalisée recommandée :","cableInterpTotalSection":"Section totale :","cableInterpMaxCurrent":"Intensité max :","cableInterpVoltageDrop":"Chute de tension :","cableInterpOtherSolutions":"📋 Autres solutions normalisées possibles :","cableInterpTheoreticalOver":"⚠️ Section calculée théorique : {s} mm² (> 240 mm²)","cableInterpNoSingleLarge":"• Les sections > 240 mm² ne sont pas recommandées pour un câble unique (rayon de courbure)","cableInterpUseParallel":"• Utiliser impérativement des câbles en parallèle","cableInterpFactorsApplied":"• Facteurs de correction appliqués","cableInterpNoSolution":"❌ Aucune solution normalisée de câble trouvée avec les paramètres actuels.","cableInterpSuggestions":"📋 Solutions possibles :","cableInterpMoreParallel":"• Augmenter le nombre de câbles en parallèle","cableInterpConsultTGBT":"• Consulter un spécialiste pour une étude TGBT","cableInterpMaxSingleCable":"• Section maximale câble unitaire (240 mm²) :","cableInterpOkSection":"✅ Section {mm} mm²","cableInterpAdmissible":"• Intensité admissible :","cableCalcConductivity":"Conductivité (κ)","cableCalcMaxDeltaU":"Chute de tension max (ΔU)","cableCalcFormulasTitle":"📌 Détail des formules (critère max) :","cableCalcLineDrop":"1) Chute de tension S₁ =","cableCalcLineThermal":"2) Thermique empirique S₂","cableCalcIzCorrected":"(Iz corrigé)","cableCalcSfin":"S_fin = max(S₁, S₂)","cableCalcIecTitle":"📌 Détails des contraintes thermo-normatives (IEC 60364) :","cableCalcInsulationLine":"Type isolation :","cableCalcInstallLine":"Mode de pose :","cableCalcTempLine":"Température :","cableCalcGroupLine":"Groupement :","cableCalcCircuitsUnit":"circuit(s)","cableCalcIzRequiredLine":"Intensité requise corrigée (Iz) :","cableCalcFinalAlt":"Solution normalisée finale :","cableCalcFinalNorm":"Section normalisée finale (immédiatement supérieure) :","cableNormDescNonConform":"Section maximale câble : {mm} mm² (non conforme)","cableCaptionTempPvc":"70°C max","cableCaptionTemp90":"90°C max","cableMemoryTitle":"Section câble : {s}","cableMemorySummary":"{calc} mm² (calc.) → {norm}","selectivity_AC_AC":"Sélectivité totale - Même type","selectivity_AC_A":"❌ Non sélectif - AC ne détecte pas DC pulsé","selectivity_AC_B":"❌ Non sélectif - AC ne détecte pas DC continu","selectivity_AC_F":"❌ Non sélectif - AC ne détecte pas haute fréquence","selectivity_AC_EV":"❌ Non sélectif - AC ne détecte pas défauts EV","selectivity_AC_Bplus":"❌ Non sélectif - AC ne détecte pas DC continu","selectivity_A_AC":"❌ Non sélectif - A détecte tous les défauts que AC détecte, donc déclenche toujours en premier","selectivity_A_A":"Sélectivité totale - Même type","selectivity_A_B":"❌ Non sélectif - A ne peut pas protéger B (DC continu)","selectivity_A_F":"❌ Non sélectif - A ne peut pas protéger F (haute fréquence)","selectivity_A_EV":"❌ Non sélectif - A ne peut pas protéger EV","selectivity_A_Bplus":"❌ Non sélectif - A ne peut pas protéger B+","selectivity_B_AC":"❌ Non sélectif - B détecte tous les défauts que AC détecte, donc déclenche toujours en premier","selectivity_B_A":"❌ Non sélectif - B détecte tous les défauts que A détecte, donc déclenche toujours en premier","selectivity_B_B":"Sélectivité totale - Même type","selectivity_B_F":"❌ Non sélectif - B détecte tous les défauts que F détecte, donc déclenche toujours en premier","selectivity_B_EV":"❌ Non sélectif - B ne peut pas protéger EV","selectivity_B_Bplus":"❌ Non sélectif - B ne peut pas protéger B+","selectivity_F_AC":"❌ Non sélectif - F détecte tous les défauts que AC détecte, donc déclenche toujours en premier","selectivity_F_A":"❌ Non sélectif - F détecte tous les défauts que A détecte, donc déclenche toujours en premier","selectivity_F_B":"❌ Non sélectif - F ne peut pas protéger B (B détecte plus de types)","selectivity_F_F":"Sélectivité totale - Même type","selectivity_F_EV":"❌ Non sélectif - F ne peut pas protéger EV","selectivity_F_Bplus":"❌ Non sélectif - F ne peut pas protéger B+","selectivity_EV_AC":"❌ Non sélectif - EV détecte tous les défauts que AC détecte, donc déclenche toujours en premier","selectivity_EV_A":"❌ Non sélectif - EV détecte tous les défauts que A détecte, donc déclenche toujours en premier","selectivity_EV_B":"❌ Non sélectif - EV détecte tous les défauts que B détecte, donc déclenche toujours en premier","selectivity_EV_F":"❌ Non sélectif - EV détecte tous les défauts que F détecte, donc déclenche toujours en premier","selectivity_EV_EV":"Sélectivité totale - Même type","selectivity_EV_Bplus":"❌ Non sélectif - EV détecte tous les défauts que B+ détecte, donc déclenche toujours en premier","selectivity_Bplus_AC":"❌ Non sélectif - B+ détecte tous les défauts que AC détecte, donc déclenche toujours en premier","selectivity_Bplus_A":"❌ Non sélectif - B+ détecte tous les défauts que A détecte, donc déclenche toujours en premier","selectivity_Bplus_B":"❌ Non sélectif - B+ détecte tous les défauts que B détecte, donc déclenche toujours en premier","selectivity_Bplus_F":"❌ Non sélectif - B+ détecte tous les défauts que F détecte, donc déclenche toujours en premier","selectivity_Bplus_EV":"❌ Non sélectif - B+ ne peut pas protéger EV","selectivity_Bplus_Bplus":"Sélectivité totale - Même type"},ar:{"calcCardDescOhmLaw":"الجهد، التيار، المقاومة","calcCardDescPowerEnergy":"حسابات القدرة والطاقة","calcCardDescCopperResistance":"مقاومة النحاس مع درجة الحرارة","calcCardDescVoltageDrop":"حساب هبوط الجهد","calcCardDescCableSection":"تحديد مقطع الكابلات","calcCardDescSelectivity":"قواطع تفاضلية وقواطع مغناطيسية حرارية","installMethod_A1_name":"مجرى مدمج في جدار معزول","installMethod_A1_desc":"جدار معزول حرارياً (طريقة A — تخفيض قوي)","installMethod_A2_name":"مجرى مدمج في بناء","installMethod_A2_desc":"جدار خرساني أو طوب (طريقة A)","installMethod_B1_name":"مجرى ظاهر","installMethod_B1_desc":"مجرى مثبت ظاهراً — مرجع المعامل 1 (إرشادي)","installMethod_B2_name":"قاعدة/زاوية","installMethod_B2_desc":"قاعدة كهربائية أو زاوية","installMethod_C_name":"مسار كابلات","installMethod_C_desc":"طبقة واحدة على مسار مثقوب/مهوى — تهوية غالباً مماثلة للمجرى الظاهر (IEC طريقة C)","installMethod_D1_name":"مجرى مدفون","installMethod_D1_desc":"مجرى مدفون في التربة (طريقة D)","installMethod_D2_name":"كابل مدفون مباشرة","installMethod_D2_desc":"كابل مدفون بدون مجرى (طريقة D)","installMethod_E_name":"قناة","installMethod_E_desc":"قناة / غلاف (غالباً أقل ملاءمة من السطح المفتوح)","installMethod_F_name":"أرضية فنية","installMethod_F_desc":"أرضية فنية مهواة","installMethod_G_name":"فراغ بناء","installMethod_G_desc":"فراغ صحي أو علية","ddrDesc_AC":"تيار متردد جيبي","ddrDesc_A":"تيار متردد + مكون مستمر","ddrDesc_B":"تيار متردد + مستمر + تردد عالٍ","ddrDesc_F":"تيار متردد + مكون مستمر 1 كهرتز","ddrDesc_EV":"مركبات كهربائية","ddrDesc_Bplus":"B+ بحماية معززة","breakerCurve_B_name":"منحنى B","breakerCurve_B_desc":"قطع فوري 3–5 In","breakerCurve_C_name":"منحنى C","breakerCurve_C_desc":"قطع فوري 5–10 In","breakerCurve_D_name":"منحنى D","breakerCurve_D_desc":"قطع فوري 10–20 In","breakerCurve_K_name":"منحنى K","breakerCurve_K_desc":"قطع فوري 8–12 In","breakerCurve_Z_name":"منحنى Z","breakerCurve_Z_desc":"قطع فوري 2–3 In","selectivityTypesMismatch":"❌ غير انتقائي — أنواع غير متوافقة","selectivityChronoAppend":"⚠️ الانتقائية الزمنية غير مفعّلة (~40 ms)","selectivityRecCriticalDDR":"🚨 حرج: أنواع قواطع تفاضلية غير متوافقة","selectivityRecProblemPrefix":"المشكلة:","selectivityRecMandatoryUpstream":"حل إلزامي: تغيير نوع القاطع التفاضلي العلوي ليكتشف نفس الأعطال","selectivityRecCompatibleTypesPrefix":"أنواع متوافقة:","selectivityRecChronoDisabled":"⚠️ الانتقائية الزمنية غير مفعّلة (~40 ms)","selectivityRecUseSelectiveDDR":"توصية: استخدام قاطع تفاضلي علوي انتقائي بتأخير > 130 ms","calcSaveAssociationTitle":"الربط مطلوب","calcSaveAssociationBody":"اختر مشروعاً أو عرض أسعار (أو كليهما).","calcSavedTitle":"تم الحفظ","calcSavedBody":"تم ربط الحساب بالمشروع و/أو عرض الأسعار.","calcSaveErrorGeneric":"تعذّر الحفظ","calcAlertPowerVoltage":"يرجى إدخال القدرة والجهد","calcAlertCurrentVoltage":"يرجى إدخال التيار والجهد","calcAlertCurrentResistance":"يرجى إدخال التيار والمقاومة","calcAlertVoltageCurrent":"يرجى إدخال الجهد والتيار","calcAlertPowerTime":"يرجى إدخال القدرة والزمن","calcAlertCurrentLengthSection":"يرجى إدخال التيار والطول والمقطع","calcAlertCurrentLength":"يرجى إدخال الشدة والطول","calcAlertFillSelectivity":"يرجى ملء جميع الحقول","calcAlertLengthSectionTemp":"يرجى إدخال الطول والمقطع ودرجة الحرارة","calcAlertCosPhiRange":"يجب أن يكون cos φ بين 0 و 1","calcAlertPowerBalanceMin":"أدخل سطراً واحداً على الأقل بقدرة مثبتة Pi > 0 (واط).","calcAlertPowerBalancePositive":"يجب أن تكون القدرة المطلوبة الإجمالية موجبة.","selectivityLabelBreakerUpstream":"قاطع علوي (أ)","selectivityLabelBreakerDownstream":"قاطع سفلي (أ)","selectivityLabelDDRUpstream":"قاطع تفاضلي علوي (ملي أمبير)","selectivityLabelDDRDownstream":"قاطع تفاضلي سفلي (ملي أمبير)","selectivityLabelDDRTypeUpstream":"نوع القاطع التفاضلي العلوي","selectivityLabelDDRTypeDownstream":"نوع القاطع التفاضلي السفلي","selectivityLabelDDRSelectiveQ":"قاطع تفاضلي علوي انتقائي؟","selectiveDDRHintYes":"قاطع تفاضلي انتقائي بتأخير قطع > 130 ms","selectiveDDRHintNo":"قاطع تفاضلي عادي — لا انتقائية مع القاطع السفلي","calcResultMethodLabel":"طريقة التركيب:","calcResultSelectivityTypeLabel":"نوع الانتقائية:","calcRecommendationsLabel":"التوصيات:","calcSelectiveDDRLabel":"قاطع تفاضلي انتقائي:","calcSelectiveDDRActive":"✓ مفعّل (≥ 300 ملي أمبير)","calcAdditionalDataLabel":"بيانات إضافية:","calcPowerComputedLabel":"القدرة المحسوبة:","calcIntensityLabel":"الشدة:","calcVoltageLabel":"الجهد:","calcCosPhiLabel":"cos φ :","calcSectionComputedLabel":"المقطع المحسوب:","calcSectionNormalizedLabel":"المقطع المعياري:","cableInputCircuitCurrent":"شدة الدائرة","cableInputCableLength":"طول الكابل","cableInputCosPhi":"cos φ (معامل القدرة)","cableInputInstallModeIEC":"طريقة التركيب IEC 60364-5-52","cableInputExplainPose":"شرح طرق التركيب","cableInsulationExplainBtn":"شرح المواد","cableInsulationLabel":"نوع العزل","cableModalRecommendedTitle":"المقطع الموصى به","cableModalCalcNonStd":"المقطع المحسوب (غير معياري):","cableModalParallelBundle":"تجميع كابلات معيارية (المقطع الإجمالي):","cableModalNormNext":"مقطع معياري (الأكبر مباشرة):","cableModalDetails":"التفاصيل:","cableModalNonConform":"⚠️ خارج الحدود المعيارية","cableModalDimResult":"نتيجة التقدير","cableModalRefSection":"المقطع المحسوب (مرجع):","cableModalCorrectionFactors":"معاملات التصحيح","cableModalVerifications":"التحققات","cableModalAdmissibleCurrent":"الشدة المسموحة:","cableLabelMax":"أقصى","cableLabelFactor":"معامل","cableLabelTotalFactor":"المعامل الإجمالي:","cableAltParallelTpl":"{n} كابلات موازية {mm} مم²","cableAltSpecialTpl":"⚠️ شدة مرتفعة جداً ({i} أ) — استشر مختصاً","cableAltInsufficient":"مقطع غير كافٍ","cableInterpNormSolution":"✅ الحل المعياري الموصى به:","cableInterpTotalSection":"المقطع الإجمالي:","cableInterpMaxCurrent":"أقصى شدة:","cableInterpVoltageDrop":"هبوط الجهد:","cableInterpOtherSolutions":"📋 حلول معيارية أخرى ممكنة:","cableInterpTheoreticalOver":"⚠️ المقطع النظري المحسوب: {s} مم² (> 240 مم²)","cableInterpNoSingleLarge":"• المقاطع > 240 مم² غير موصى بها لكابل واحد (نصف قطر الانحناء)","cableInterpUseParallel":"• استخدم حتماً كابلات موازية","cableInterpFactorsApplied":"• معاملات التصحيح مطبقة","cableInterpNoSolution":"❌ لم يُعثر على حل معياري بالمعطيات الحالية.","cableInterpSuggestions":"📋 حلول ممكنة:","cableInterpMoreParallel":"• زيادة عدد الكابلات الموازية","cableInterpConsultTGBT":"• استشر مختصاً لدراسة لوحة التوزيع","cableInterpMaxSingleCable":"• أقصى مقطع كابل مفرد (240 مم²):","cableInterpOkSection":"✅ مقطع {mm} مم²","cableInterpAdmissible":"• الشدة المسموحة:","cableCalcConductivity":"التوصيلية (κ)","cableCalcMaxDeltaU":"أقصى هبوط جهد (ΔU)","cableCalcFormulasTitle":"📌 تفاصيل الصيغ (أقصى معيار):","cableCalcLineDrop":"1) هبوط الجهد S₁ =","cableCalcLineThermal":"2) حراري تقريبي S₂","cableCalcIzCorrected":"(Iz مصحح)","cableCalcSfin":"S_fin = max(S₁, S₂)","cableCalcIecTitle":"📌 قيود حرارية معيارية (IEC 60364):","cableCalcInsulationLine":"نوع العزل:","cableCalcInstallLine":"طريقة التركيب:","cableCalcTempLine":"درجة الحرارة:","cableCalcGroupLine":"التجميع:","cableCalcCircuitsUnit":"دائرة/دوائر","cableCalcIzRequiredLine":"الشدة المطلوبة المصححة (Iz):","cableCalcFinalAlt":"الحل المعياري النهائي:","cableCalcFinalNorm":"المقطع المعياري النهائي (الأكبر مباشرة):","cableNormDescNonConform":"أقصى مقطع كابل: {mm} مم² (غير مطابق)","cableCaptionTempPvc":"أقصى 70°م","cableCaptionTemp90":"أقصى 90°م","cableMemoryTitle":"مقطع الكابل : {s}","cableMemorySummary":"{calc} مم² (محسوب) → {norm}","selectivity_AC_AC":"انتقائية كاملة — نفس النوع","selectivity_AC_A":"❌ غير انتقائي — AC لا يكتشف التيار المستمر النابض","selectivity_AC_B":"❌ غير انتقائي — AC لا يكتشف التيار المستمر","selectivity_AC_F":"❌ غير انتقائي — AC لا يكتشف الترددات العالية","selectivity_AC_EV":"❌ غير انتقائي — AC لا يكتشف أعطال مركبات كهربائية","selectivity_AC_Bplus":"❌ غير انتقائي — AC لا يكتشف التيار المستمر","selectivity_A_AC":"❌ غير انتقائي — A يكتشف كل الأعطال التي يكتشفها AC فينقطع أولاً","selectivity_A_A":"انتقائية كاملة — نفس النوع","selectivity_A_B":"❌ غير انتقائي — A لا يحمي من نوع B (تيار مستمر)","selectivity_A_F":"❌ غير انتقائي — A لا يحمي من نوع F (تردد عالٍ)","selectivity_A_EV":"❌ غير انتقائي — A لا يحمي من نوع EV","selectivity_A_Bplus":"❌ غير انتقائي — A لا يحمي من نوع B+","selectivity_B_AC":"❌ غير انتقائي — B يكتشف كل الأعطال التي يكتشفها AC فينقطع أولاً","selectivity_B_A":"❌ غير انتقائي — B يكتشف كل الأعطال التي يكتشفها A فينقطع أولاً","selectivity_B_B":"انتقائية كاملة — نفس النوع","selectivity_B_F":"❌ غير انتقائي — B يكتشف كل الأعطال التي يكتشفها F فينقطع أولاً","selectivity_B_EV":"❌ غير انتقائي — B لا يحمي من نوع EV","selectivity_B_Bplus":"❌ غير انتقائي — B لا يحمي من نوع B+","selectivity_F_AC":"❌ غير انتقائي — F يكتشف كل الأعطال التي يكتشفها AC فينقطع أولاً","selectivity_F_A":"❌ غير انتقائي — F يكتشف كل الأعطال التي يكتشفها A فينقطع أولاً","selectivity_F_B":"❌ غير انتقائي — F لا يحمي من نوع B (B يكتشف أنواعاً أكثر)","selectivity_F_F":"انتقائية كاملة — نفس النوع","selectivity_F_EV":"❌ غير انتقائي — F لا يحمي من نوع EV","selectivity_F_Bplus":"❌ غير انتقائي — F لا يحمي من نوع B+","selectivity_EV_AC":"❌ غير انتقائي — EV يكتشف كل الأعطال التي يكتشفها AC فينقطع أولاً","selectivity_EV_A":"❌ غير انتقائي — EV يكتشف كل الأعطال التي يكتشفها A فينقطع أولاً","selectivity_EV_B":"❌ غير انتقائي — EV يكتشف كل الأعطال التي يكتشفها B فينقطع أولاً","selectivity_EV_F":"❌ غير انتقائي — EV يكتشف كل الأعطال التي يكتشفها F فينقطع أولاً","selectivity_EV_EV":"انتقائية كاملة — نفس النوع","selectivity_EV_Bplus":"❌ غير انتقائي — EV يكتشف كل الأعطال التي يكتشفها B+ فينقطع أولاً","selectivity_Bplus_AC":"❌ غير انتقائي — B+ يكتشف كل الأعطال التي يكتشفها AC فينقطع أولاً","selectivity_Bplus_A":"❌ غير انتقائي — B+ يكتشف كل الأعطال التي يكتشفها A فينقطع أولاً","selectivity_Bplus_B":"❌ غير انتقائي — B+ يكتشف كل الأعطال التي يكتشفها B فينقطع أولاً","selectivity_Bplus_F":"❌ غير انتقائي — B+ يكتشف كل الأعطال التي يكتشفها F فينقطع أولاً","selectivity_Bplus_EV":"❌ غير انتقائي — B+ لا يحمي من نوع EV","selectivity_Bplus_Bplus":"انتقائية كاملة — نفس النوع"}};
const LB={fr:{invalidValues:'Veuillez entrer des valeurs numériques valides',copper:'Cuivre',aluminum:'Aluminium',powerBalanceTri:'Triphasé',powerBalanceMono:'Monophasé'},ar:{invalidValues:'يرجى إدخال قيم رقمية صحيحة',copper:'النحاس',aluminum:'الألمنيوم',powerBalanceTri:'ثلاثي الأطوار',powerBalanceMono:'أحادي الطور'}};
function getT(l){const k=l==='ar'?'ar':'fr';return {...LB[k],...(I18N[k]||I18N.fr)};}
function cableTextTpl(tpl,vars){return tpl.replace(/\{(\w+)\}/g,(_,k)=>String(vars[k]??''));}

const normalizedSections = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500, 630, 800, 1000];
// Calibres de disjoncteurs normalisés IEC 60364-5-52
const normalizedBreakerCalibers = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000];
const temperatureFactorsPVC = [
    { temp: 10, factor: 1.22 },
    { temp: 15, factor: 1.15 },
    { temp: 20, factor: 1.10 },
    { temp: 25, factor: 1.08 },
    { temp: 30, factor: 1.0 }, // Référence
    { temp: 35, factor: 0.91 },
    { temp: 40, factor: 0.82 },
    { temp: 45, factor: 0.71 },
    { temp: 50, factor: 0.58 },
    { temp: 55, factor: 0.41 },
    { temp: 60, factor: 0.0 }
];
// PR/EPR/XLPE (Polyéthylène réticulé / Éthylène-propylène) - Température max: 90°C
const temperatureFactorsEPR = [
    { temp: 10, factor: 1.15 },
    { temp: 15, factor: 1.12 },
    { temp: 20, factor: 1.08 },
    { temp: 25, factor: 1.05 },
    { temp: 30, factor: 1.0 }, // Référence
    { temp: 35, factor: 0.94 },
    { temp: 40, factor: 0.87 },
    { temp: 45, factor: 0.79 },
    { temp: 50, factor: 0.71 },
    { temp: 55, factor: 0.61 },
    { temp: 60, factor: 0.50 },
    { temp: 65, factor: 0.38 },
    { temp: 70, factor: 0.24 },
    { temp: 75, factor: 0.0 }
];
// Tableau de correspondance type d'isolation → facteurs
const insulationTemperatureFactors = {
    'PVC': temperatureFactorsPVC,
    'PR': temperatureFactorsEPR,
    'EPR': temperatureFactorsEPR,
    'XLPE': temperatureFactorsEPR
};
// Fonction pour calculer le facteur de correction de température par interpolation linéaire
// Selon le type d'isolation (PVC, PR, EPR, XLPE)
function getTemperatureFactor(temperature, insulationType = 'PVC') {
    // Utiliser le tableau correspondant au type d'isolation, défaut PVC
    const factors = insulationTemperatureFactors[insulationType] || temperatureFactorsPVC;
    // Trier les facteurs par température croissante
    const sortedFactors = [...factors].sort((a, b) => a.temp - b.temp);
    // Si la température est inférieure ou égale à la première valeur
    if (temperature <= sortedFactors[0].temp) {
        return sortedFactors[0].factor;
    }
    // Si la température est supérieure ou égale à la dernière valeur
    if (temperature >= sortedFactors[sortedFactors.length - 1].temp) {
        return sortedFactors[sortedFactors.length - 1].factor;
    }
    // Trouver les deux points entre lesquels interpoler
    for (let i = 0; i < sortedFactors.length - 1; i++) {
        const temp1 = sortedFactors[i].temp;
        const temp2 = sortedFactors[i + 1].temp;
        const factor1 = sortedFactors[i].factor;
        const factor2 = sortedFactors[i + 1].factor;
        if (temperature >= temp1 && temperature <= temp2) {
            // Interpolation linéaire: factor = factor1 + (factor2 - factor1) * (temp - temp1) / (temp2 - temp1)
            const factor = factor1 + (factor2 - factor1) * (temperature - temp1) / (temp2 - temp1);
            return factor;
        }
    }
    // Par défaut, retourner 1.0
    return 1.0;
}
// Facteurs de correction groupement IEC 60364-5-52
const groupingFactors = [
    { circuits: 1, factor: 1.0 },
    { circuits: 2, factor: 0.8 },
    { circuits: 3, factor: 0.7 },
    { circuits: 4, factor: 0.65 },
    { circuits: 5, factor: 0.6 },
    { circuits: 6, factor: 0.57 },
    { circuits: 7, factor: 0.54 },
    { circuits: 8, factor: 0.52 },
    { circuits: 9, factor: 0.5 },
    { circuits: 10, factor: 0.48 }
];
const IEC_GROUPING_MIN_CIRCUITS = groupingFactors[0]?.circuits ?? 1;
const IEC_GROUPING_MAX_CIRCUITS = groupingFactors[groupingFactors.length - 1]?.circuits ?? 10;
const conductorResistivity = {
    Cu: 0.0185, // Cuivre Ω⋅mm²/m
    Al: 0.0295 // Aluminium Ω⋅mm²/m
};
const maxVoltageDrops = {
    lighting: 3, // Éclairage 3%
    power: 5, // Force motrice 5%
    mixed: 4 // Installation mixte 4%
};
const installationMethods = [{ id: 'A1' }, { id: 'A2' }, { id: 'B1' }, { id: 'B2' }, { id: 'C' }, { id: 'D1' }, { id: 'D2' }, { id: 'E' }, { id: 'F' }, { id: 'G' }];
function calculatePower(opts) {
    const lang = opts.lang || 'ar';
    const current = String(opts.current ?? '');
    const voltage = String(opts.voltage ?? '230');
    const cosPhi = String(opts.cosPhi ?? '1');
    const t = getT(lang);
    if (!current || !voltage) {
        return { error: true, message: t.calcAlertCurrentVoltage };
    }
    const I = parseFloat(current);
    const U = parseFloat(voltage);
    const cosPhiValue = parseFloat(cosPhi);
    if (isNaN(I) || isNaN(U) || isNaN(cosPhiValue)) {
        return { error: true, message: t.invalidValues };
    }
    // P = U * I * cosPhi * (sqrt(3) en triphasé)
    const isTriphase = U >= 400;
    const P = isTriphase ? (U * I * cosPhiValue * Math.sqrt(3)) : (U * I * cosPhiValue);
    return { ok: true, data: {
            type: 'power',
            formula: isTriphase ? 'P = U × I × cos φ × √3' : 'P = U × I × cos φ',
            calculation: isTriphase
                ? `${U} × ${I} × ${cosPhiValue} × √3`
                : `${U} × ${I} × ${cosPhiValue}`,
            result: P.toFixed(2),
            unit: 'W',
            interpretation: P > 3000 ? 'Puissance élevée - Vérifier la protection' : 'Puissance normale'
        } };
}
function calculateVoltageDrop(opts) {
    const lang = opts.lang || 'ar';
    const current = String(opts.current ?? '');
    const length = String(opts.length ?? '');
    const section = String(opts.section ?? '');
    const voltage = String(opts.voltage ?? '230');
    const conductorType = opts.conductorType || 'Cu';
    const t = getT(lang);
    if (!current || !length || !section) {
        return { error: true, message: t.calcAlertCurrentLengthSection };
    }
    const I = parseFloat(current);
    const L = parseFloat(length);
    const S = parseFloat(section);
    const U = parseFloat(voltage);
    // Résistivité selon le type de conducteur IEC 60364-5-52
    const rho = conductorResistivity[conductorType];
    if (isNaN(I) || isNaN(L) || isNaN(S) || isNaN(U)) {
        return { error: true, message: t.invalidValues };
    }
    // Calcul de la chute de tension selon IEC 60364-5-52
    // Formule: ΔU = (k × ρ × L × I) / S
    // k = 2 pour monophasé, k = √3 pour triphasé (400V/690V)
    const isTriphase = U >= 400;
    const k = isTriphase ? Math.sqrt(3) : 2;
    const deltaU = (k * rho * L * I) / S;
    const deltaUPercent = (deltaU / U) * 100;
    // Chute de tension maximale fixe à 4% (installation mixte) IEC 60364-5-52
    const maxDropPercent = 4;
    const isAcceptable = deltaUPercent <= maxDropPercent;
    return { ok: true, data: {
            type: 'voltage_drop',
            formula: `ΔU = (${isTriphase ? '√3' : '2'} × ρ × L × I) / S`,
            calculation: `Intensité: ${I.toFixed(2)}A\nLongueur: ${L}m\nSection: ${S}mm²\nTension: ${U}V (${isTriphase ? t.powerBalanceTri : t.powerBalanceMono})\nType conducteur: ${conductorType === 'Cu' ? t.copper : t.aluminum}\n\nFormule: ΔU = (${k.toFixed(3)} × ρ × L × I) / S\nCalcul: (${k.toFixed(3)} × ${rho} × ${L} × ${I}) / ${S}\nΔU = ${deltaU.toFixed(2)}V\n\nChute de tension: ${deltaUPercent.toFixed(2)}% (max: ${maxDropPercent}%)`,
            result: deltaU.toFixed(2),
            unit: 'V',
            percent: deltaUPercent.toFixed(2),
            maxPercent: maxDropPercent,
            additionalData: {
                current: I.toFixed(2),
                length: L.toFixed(0),
                section: S.toFixed(2),
                voltage: U.toFixed(0),
                voltageDrop: deltaU.toFixed(2),
                voltageDropPercent: deltaUPercent.toFixed(2),
                maxVoltageDropPercent: maxDropPercent,
                conductorType: conductorType === 'Cu' ? t.copper : t.aluminum,
                resistivity: rho,
                isAcceptable: isAcceptable
            },
            interpretation: isAcceptable
                ? `✅ Chute de tension conforme (${deltaUPercent.toFixed(2)}% ≤ ${maxDropPercent}%)`
                : `⚠️ Chute de tension excessive (${deltaUPercent.toFixed(2)}% > ${maxDropPercent}%) - Augmenter la section de câble`
        } };
}
function calculateCableSection(opts) {
    const lang = opts.lang || 'ar';
    const t = getT(lang);
    const current = String(opts.current ?? '');
    const length = String(opts.length ?? '');
    const voltage = String(opts.voltage ?? '230');
    const cosPhi = String(opts.cosPhi ?? '0.85');
    const temperature = String(opts.temperature ?? '20');
    const circuitCount = String(opts.circuitCount ?? '1');
    const conductorType = opts.conductorType || 'Cu';
    const insulationType = opts.insulationType || 'PVC';
    const selectedMethod = opts.selectedMethod || 'B1';
    if (!current || !length) {
        return { error: true, message: t.calcAlertCurrentLength };
    }
    const I = parseFloat(current);
    const isTriphase = voltage === '400'; // Utiliser l'état voltage existant
    const U = isTriphase ? 400 : 230;
    const L = parseFloat(length);
    const cosPhiValue = parseFloat(cosPhi) || 0.85; // Valeur par défaut
    const temp = parseFloat(temperature) || 20; // Température par défaut
    const requestedCircuits = parseInt(circuitCount, 10);
    const circuits = Number.isFinite(requestedCircuits)
        ? Math.min(IEC_GROUPING_MAX_CIRCUITS, Math.max(IEC_GROUPING_MIN_CIRCUITS, requestedCircuits))
        : IEC_GROUPING_MIN_CIRCUITS;
    if (String(circuits) !== circuitCount) {
        setCircuitCount(String(circuits));
    }
    // Calcul de la puissance à partir de l'intensité et de la tension
    // P = U * I * cosPhi * (sqrt(3) en triphasé, 1 en monophasé)
    const P = isTriphase
        ? U * I * cosPhiValue * Math.sqrt(3)
        : U * I * cosPhiValue;
    // Conductivité (κ) selon le matériau (56 pour Cuivre, 37 pour Aluminium)
    const kappa = conductorType === 'Cu' ? 56 : 37;
    if (isNaN(I) || isNaN(U) || isNaN(L) || isNaN(cosPhiValue) || isNaN(temp) || isNaN(circuits)) {
        return { error: true, message: t.invalidValues };
    }
    // Chute de tension maximale
    const maxDropPercent = maxVoltageDrops['mixed']; // Utiliser 'mixed' par défaut (4%)
    const deltaU = U * (maxDropPercent / 100);
    // Calcul de la section NORMALE (sans coefficients correctifs) via chute de tension
    // Formule Monophasé (230V): S = (2 × L × I × cosφ) / (κ × ΔU)
    // Formule Triphasé (400V): S = (√3 × L × I × cosφ) / (κ × ΔU)
    const b = isTriphase ? Math.sqrt(3) : 2;
    const S1 = (b * L * I * cosPhiValue) / (kappa * deltaU);
    // Facteurs IEC 60364-5-52 : k1 (température) + k4 (groupement) — Fig. G12 / G16
    const tempFactor = getTemperatureFactor(temp, insulationType);
    const k4Iec = groupingFactorK4Iec60364(selectedMethod, circuits);
    const requiredCurrent = I / (tempFactor * k4Iec);
    // Coefficients utilisés APRÈS le calcul normal, pour vérifier/ajuster la section commerciale.
    // On conserve S2 comme indicateur thermique (informatif), mais il ne dimensionne plus directement.
    let jadm = 2.5; // Pose en air / chemin / plateau (hors canalisation enterrée type D)
    if (selectedMethod === 'B1' || selectedMethod === 'B2')
        jadm = 2.0; // Méthodes B — canalisation
    else if (selectedMethod === 'D1' || selectedMethod === 'D2')
        jadm = 3.0; // Méthode D — enterré
    const S2 = requiredCurrent / jadm; // indicatif uniquement
    // Section de calcul de base = S1 (logique Caneco/Calculette: section normale d'abord)
    const S_fin = S1;
    const S = S_fin;
    // Trouver la section normalisée qui peut supporter cette intensité
    let recommendedSection = 0;
    let isConform = false;
    let maxCurrent = 0;
    let actualVoltageDropPercent = 0;
    // Trier les sections par ordre croissant
    // IMPORTANT: Limiter aux sections de câbles normalisées <= 240mm² uniquement
    const cableSections = normalizedSections.filter(s => s <= 240).sort((a, b) => a - b);
    const maxSingleCableSection = cableSections[cableSections.length - 1] ?? 240;
    // Plus petite section normalisée ≥ S_fin (on n'accepte pas une taille catalogue < section calculée)
    const minSectionFromCalculation = S_fin <= maxSingleCableSection
        ? (cableSections.find((sec) => sec >= S_fin) ?? maxSingleCableSection)
        : maxSingleCableSection;
    // La section de base est S1; S2 reste un indicateur de contrôle thermique.
    const dominantCriterion = 'S1';
    const rejectedSections = [];
    // Trouver la section qui respecte à la fois l'intensité ET la chute de tension
    // Uniquement parmi les sections de câbles <= 240mm², et >= minSectionFromCalculation
    for (const section of cableSections) {
        if (section < minSectionFromCalculation)
            continue;
        if (!thermalOk(I, section, selectedMethod, circuits, conductorType === 'Cu' ? 'Cu' : 'Al', insulationType, temp)) {
            const ts = computeThermalSizing(I, section, selectedMethod, circuits, conductorType === 'Cu' ? 'Cu' : 'Al', insulationType, temp);
            rejectedSections.push({
                mm: section,
                reason: 'thermal',
                izTable: ts.effectiveIz,
                izReq: I,
            });
            continue;
        }
        const testVoltageDrop = (b * L * I * cosPhiValue) / (kappa * section);
        const testVoltageDropPercent = (testVoltageDrop / U) * 100;
        if (testVoltageDropPercent > maxDropPercent) {
            const tsDrop = computeThermalSizing(I, section, selectedMethod, circuits, conductorType === 'Cu' ? 'Cu' : 'Al', insulationType, temp);
            rejectedSections.push({
                mm: section,
                reason: 'drop',
                izTable: tsDrop.effectiveIz,
                izReq: I,
                du: testVoltageDropPercent,
            });
            continue;
        }
        recommendedSection = section;
        break;
    }
    // Si aucune section conforme <= 240mm² n'est trouvée, on utilisera les alternatives normalisées
    // Ne jamais recommander directement une section > 240mm² comme section de câble
    if (recommendedSection === 0) {
        recommendedSection = 240; // Section maximale pour câbles normalisés
    }
    // Calculer les alternatives normalisées si la section dépasse 240mm²
    let alternatives = [];
    let useAlternatives = false;
    // Vérifier si l'intensité dépasse la capacité de la section maximale de câble (240mm²)
    const maxCable240Current = computeThermalSizing(I, 240, selectedMethod, circuits, conductorType === 'Cu' ? 'Cu' : 'Al', insulationType, temp).effectiveIz;
    // Si la section calculée théorique dépasse 240mm² OU si l'intensité dépasse la capacité de 240mm²,
    // utiliser TOUJOURS les alternatives normalisées (câbles en parallèle)
    // Ne JAMAIS recommander directement une section > 240mm² comme section de câble
    if (S > 240 || I > maxCable240Current) {
        useAlternatives = true;
        // Recherche UNIQUEMENT de solutions avec des CÂBLES en parallèle
        // Prendre les sections normalisées moyennes à grandes (de 50mm² à 300mm²)
        const parallelSections = normalizedSections.filter(s => s >= 50 && s <= 300);
        // Étendre la recherche jusqu'à 10 câbles en parallèle
        for (let nbCables = 2; nbCables <= 10; nbCables++) {
            for (const parSection of parallelSections) {
                const totalParSection = parSection * nbCables;
                const iPerCable = I / nbCables;
                const parTs = computeThermalSizing(iPerCable, parSection, selectedMethod, circuits, conductorType === 'Cu' ? 'Cu' : 'Al', insulationType, temp);
                const parTotalCurrent = parTs.effectiveIz * nbCables;
                const parVoltageDrop = (b * L * I * cosPhiValue) / (kappa * totalParSection);
                const parVoltageDropPercent = (parVoltageDrop / U) * 100;
                // Vérifier que les câbles en parallèle peuvent supporter l'intensité réelle et respectent la chute de tension
                if (parTotalCurrent >= I && parVoltageDropPercent <= maxDropPercent) {
                    alternatives.push({
                        type: 'parallele',
                        description: cableTextTpl(t.cableAltParallelTpl, { n: nbCables, mm: parSection }),
                        sections: `${nbCables}x${parSection}mm²`,
                        totalSection: totalParSection,
                        maxCurrent: parTotalCurrent,
                        voltageDrop: parVoltageDropPercent
                    });
                    break; // Prendre la première combinaison conforme (la section la plus petite pour ce nb de câbles)
                }
            }
            if (alternatives.length >= 1)
                break; // S'arrêter après avoir trouvé la première solution fonctionnelle optimale
        }
    }
    // Si on utilise les alternatives normalisées, utiliser la première alternative comme solution principale
    // IMPORTANT: Ne JAMAIS recommander directement une section > 240mm² comme section de câble
    let finalRecommendedSection = recommendedSection;
    let finalMaxCurrent = 0;
    let finalVoltageDropPercent = 0;
    if (useAlternatives) {
        if (alternatives.length > 0) {
            // Utiliser la première alternative comme solution principale
            const primaryAlternative = alternatives[0];
            finalRecommendedSection = primaryAlternative.totalSection;
            finalMaxCurrent = primaryAlternative.maxCurrent;
            finalVoltageDropPercent = primaryAlternative.voltageDrop;
            isConform = primaryAlternative.type !== 'special';
        }
        else {
            // Aucune alternative trouvée - l'intensité est trop élevée même pour les barres maximales
            // Utiliser la section maximale de câble (240mm²) comme référence mais indiquer qu'il faut consulter un spécialiste
            const correctedCurrent = computeThermalSizing(I, 240, selectedMethod, circuits, conductorType === 'Cu' ? 'Cu' : 'Al', insulationType, temp).effectiveIz;
            const actualVoltageDrop = (b * L * I * cosPhiValue) / (kappa * 240);
            finalVoltageDropPercent = (actualVoltageDrop / U) * 100;
            finalRecommendedSection = 240; // Section maximale pour câbles normalisés
            finalMaxCurrent = correctedCurrent;
            isConform = false; // Non conforme car dépasse les capacités des câbles normalisés
            // Créer une description explicite pour ce cas
            alternatives.push({
                type: 'special',
                description: cableTextTpl(t.cableAltSpecialTpl, { i: I.toFixed(1) }),
                sections: t.cableAltInsufficient,
                totalSection: 0,
                maxCurrent: correctedCurrent,
                voltageDrop: finalVoltageDropPercent
            });
        }
    }
    else {
        // Section <= 240mm² conforme
        const correctedCurrent = computeThermalSizing(I, recommendedSection, selectedMethod, circuits, conductorType === 'Cu' ? 'Cu' : 'Al', insulationType, temp).effectiveIz;
        const actualVoltageDrop = (b * L * I * cosPhiValue) / (kappa * recommendedSection);
        finalVoltageDropPercent = (actualVoltageDrop / U) * 100;
        const isCurrentOk = I <= correctedCurrent;
        const isVoltageDropOk = finalVoltageDropPercent <= maxDropPercent;
        isConform = isCurrentOk && isVoltageDropOk;
        finalMaxCurrent = correctedCurrent;
    }
    maxCurrent = finalMaxCurrent;
    actualVoltageDropPercent = finalVoltageDropPercent;
    // Calibre de disjoncteur recommandé (1.25 × I pour la protection)
    const recommendedBreaker = normalizedBreakerCalibers.find(caliber => caliber >= I * 1.25) || normalizedBreakerCalibers[normalizedBreakerCalibers.length - 1];
    // Messages d'interprétation détaillés
    let interpretation = '';
    if (useAlternatives) {
        if (alternatives.length > 0) {
            const primaryAlt = alternatives[0];
            let altText = `${t.cableInterpNormSolution}\n\n${primaryAlt.description}\n• ${t.cableInterpTotalSection} ${primaryAlt.totalSection} mm²\n• ${t.cableInterpMaxCurrent} ${primaryAlt.maxCurrent.toFixed(1)} A\n• ${t.cableInterpVoltageDrop} ${primaryAlt.voltageDrop.toFixed(2)}% (max: ${maxDropPercent}%)\n`;
            if (alternatives.length > 1) {
                altText += `\n${t.cableInterpOtherSolutions}\n\n`;
                alternatives.slice(1).forEach((alt, idx) => {
                    altText += `${idx + 2}. ${alt.description}\n   • ${t.cableInterpTotalSection} ${alt.totalSection} mm²\n   • ${t.cableInterpMaxCurrent} ${alt.maxCurrent.toFixed(1)} A\n   • ${t.cableInterpVoltageDrop} ${alt.voltageDrop.toFixed(2)}%\n\n`;
                });
            }
            altText += `\n${cableTextTpl(t.cableInterpTheoreticalOver, { s: S.toFixed(2) })}\n${t.cableInterpNoSingleLarge}\n${t.cableInterpUseParallel}\n${t.cableInterpFactorsApplied}`;
            interpretation = altText;
        }
        else {
            interpretation = `${cableTextTpl(t.cableInterpTheoreticalOver, { s: S.toFixed(2) })}\n\n${t.cableInterpNoSolution}\n\n${t.cableInterpSuggestions}\n${t.cableInterpMoreParallel}\n${t.cableInterpConsultTGBT}\n\n${t.cableInterpMaxSingleCable} ${maxCurrent.toFixed(1)} A\n• ${t.cableInterpVoltageDrop} ${actualVoltageDropPercent.toFixed(2)}%`;
        }
    }
    else {
        interpretation = `${cableTextTpl(t.cableInterpOkSection, { mm: String(finalRecommendedSection) })}\n${t.cableInterpAdmissible} ${maxCurrent.toFixed(1)} A\n• ${t.cableInterpVoltageDrop} ${actualVoltageDropPercent.toFixed(2)}% (max: ${maxDropPercent}%)\n${t.cableInterpFactorsApplied}`;
    }
    const cableMethodName = installationMethods.find(m => m.id === selectedMethod)?.name || 'B1';
    const cableInsCaption = insulationType === 'PVC' ? t.cableCaptionTempPvc : t.cableCaptionTemp90;
    const cableCalculationDetail = [
        `${t.calcIntensityLabel} ${I.toFixed(2)} A`,
        `${t.cableInputCableLength}: ${L} m`,
        `${t.conductorType}: ${conductorType === 'Cu' ? t.copper : t.aluminum}`,
        `${t.cableCalcConductivity}: ${kappa}`,
        `${t.cosPhi}: ${cosPhiValue}`,
        `${t.cableCalcMaxDeltaU}: ${deltaU.toFixed(2)} V`,
        '',
        t.cableCalcFormulasTitle,
        `${t.cableCalcLineDrop} (${b.toFixed(3)} × ${L} × ${I} × ${cosPhiValue}) / (${kappa} × ${deltaU.toFixed(2)}) = ${S1.toFixed(2)} mm²`,
        `${t.cableCalcLineThermal} = ${requiredCurrent.toFixed(2)} ${t.cableCalcIzCorrected} / ${jadm.toFixed(1)} = ${S2.toFixed(2)} mm² (informatif)`,
        `${t.cableCalcSfin} = ${useAlternatives && alternatives.length > 0 ? alternatives[0].sections : `${finalRecommendedSection} mm²`} (${t.calcSectionNormalizedLabel || 'section normalisée'})`,
        '',
        t.cableCalcIecTitle,
        `${t.cableCalcInsulationLine} ${insulationType} (${cableInsCaption})`,
        `${t.cableCalcInstallLine} ${cableMethodName} (J_adm = ${jadm.toFixed(1)})`,
        `${t.cableCalcTempLine} ${temp}°C (×${tempFactor.toFixed(3)})`,
        `${t.cableCalcGroupLine} ${circuits} ${t.cableCalcCircuitsUnit} (k4 CEI 60364-5-52 ×${k4Iec.toFixed(3)})`,
        `${t.cableCalcIzRequiredLine} Ib / (k1·k4) = ${requiredCurrent.toFixed(2)} A`,
        '',
        useAlternatives && alternatives.length > 0
            ? `${t.cableCalcFinalAlt} ${alternatives[0].description} (${alternatives[0].sections})`
            : `${t.cableCalcFinalNorm} ${finalRecommendedSection} mm²`,
    ].join('\n');
    return { ok: true, data: {
            type: 'cable_section',
            formula: isTriphase ? 'S = (√3 × L × I × cosφ) / (κ × ΔU)' : 'S = (2 × L × I × cosφ) / (κ × ΔU)',
            calculation: cableCalculationDetail,
            result: `${useAlternatives && alternatives.length > 0 ? alternatives[0].sections : `${finalRecommendedSection}mm²`}`,
            additionalData: {
                power: P.toFixed(1),
                current: I.toFixed(2),
                voltage: U.toFixed(1),
                cosPhi: cosPhiValue.toFixed(2),
                calculatedSection: S_fin.toFixed(2),
                normalizedSection: useAlternatives && alternatives.length > 0 ? alternatives[0].sections : `${finalRecommendedSection}mm²`,
                normalizedSectionValue: finalRecommendedSection,
                normalizedSectionDescription: useAlternatives && alternatives.length > 0
                    ? alternatives[0].description
                    : useAlternatives
                        ? cableTextTpl(t.cableNormDescNonConform, { mm: String(finalRecommendedSection) })
                        : undefined,
                recommendedBreaker: recommendedBreaker,
                maxCurrent: maxCurrent.toFixed(1),
                actualVoltageDrop: actualVoltageDropPercent.toFixed(2),
                maxVoltageDrop: maxDropPercent,
                conductorType: conductorType === 'Cu' ? t.copper : t.aluminum,
                method: installationMethods.find(m => m.id === selectedMethod)?.name || 'B1',
                isConform: isConform,
                methodFactor: 1,
                tempFactor: tempFactor,
                groupFactor: k4Iec,
                insulationType: insulationType,
                insulationMaxTemp: insulationType === 'PVC' ? '70°C' : '90°C',
                temperature: temp.toString(),
                alternatives: alternatives.length > 0 ? alternatives : undefined,
                useAlternatives: useAlternatives,
                dimensioningCause: useAlternatives
                    ? undefined
                    : {
                        dominant: dominantCriterion,
                        s1: S1.toFixed(2),
                        s2: S2.toFixed(2),
                        sTie: S_fin.toFixed(2),
                        requiredCurrent: requiredCurrent.toFixed(1),
                        minCommercial: minSectionFromCalculation,
                        rejected: rejectedSections,
                        chosenMm: finalRecommendedSection,
                        maxDropStr: String(maxDropPercent),
                    },
            },
            interpretation: interpretation
        } };
}

function calculateOhm({u,i,r}){const U=u===''||u==null?NaN:parseFloat(u),I=i===''||i==null?NaN:parseFloat(i),R=r===''||r==null?NaN:parseFloat(r),hU=!isNaN(U),hI=!isNaN(I),hR=!isNaN(R);if((hU?1:0)+(hI?1:0)+(hR?1:0)!==2)return{error:true,message:'2/3'};if(hU&&hI)return{ok:true,data:{result:(hU&&U>=400?U/(I*Math.sqrt(3)):U/I).toFixed(2),unit:'Ω'}};if(hU&&hR)return{ok:true,data:{result:(U/R).toFixed(2),unit:'A'}};return{ok:true,data:{result:(R*I).toFixed(2),unit:'V'}};}
g.ElectroDzCalcCore={calculateOhm,calculatePower:(p)=>calculatePower({...p,lang:p.lang||'ar'}),calculateVoltageDrop:(p)=>calculateVoltageDrop({...p,lang:p.lang||'ar'}),calculateCableSection,_getT:getT,I18N};
})(typeof window!=='undefined'?window:globalThis);
