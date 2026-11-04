(function () {
    'use strict';

    const DEFAULT_LANGUAGE = 'ar';

    const examples = {
        'exemplo-vazio': {
            name: { 'ar': 'Exemplo Vazio', en: 'Empty Example', es: 'Ejemplo Vacío', fr: 'Exemple vide' },
            description: {
                'ar': 'Circuito base vazio para iniciar novos exemplos.',
                en: 'Empty base circuit for starting new examples.',
                es: 'Circuito base vacío para iniciar nuevos ejemplos.',
                fr: 'Circuit de base vide pour démarrer de nouveaux exemples.'
            }
        },
        'partida-direta': {
            name: { 'ar': 'Partida Direta', en: 'Direct Starter', es: 'Arranque Directo', fr: 'Démarrage direct' },
            description: {
                'ar': 'Partida direta de motor trifásico.',
                en: 'Direct starter for a three-phase motor.',
                es: 'Arranque directo de motor trifásico.',
                fr: 'Démarrage direct d’un moteur triphasé.'
            }
        },
        'partida-direta-reversao': {
            name: { 'ar': 'Partida Direta com Reversão', en: 'Direct Reversing Starter', es: 'Arranque Directo con Inversión', fr: 'Démarrage direct avec inversion' },
            description: {
                'ar': 'Partida direta de motor trifásico com reversão.',
                en: 'Direct starter for a three-phase motor with reversing.',
                es: 'Arranque directo de motor trifásico con inversión.',
                fr: 'Démarrage direct d’un moteur triphasé avec inversion.'
            }
        },
        'partida-direta-2d': {
            name: { 'ar': 'Partida Direta em 2D', en: 'Direct Starter in 2D', es: 'Arranque Directo en 2D', fr: 'Démarrage direct en 2D' },
            description: {
                'ar': 'Partida direta de motor trifásico com componentes realistas.',
                en: 'Direct starter for a three-phase motor with realistic components.',
                es: 'Arranque directo de motor trifásico con componentes realistas.',
                fr: 'Démarrage direct d’un moteur triphasé avec composants réalistes.'
            }
        },
        'partida-direta-2d-rele-termico': {
            name: { 'ar': 'Partida Direta em 2D com Relé Térmico', en: 'Direct Starter in 2D with Thermal Relay', es: 'Arranque Directo en 2D con Relé Térmico', fr: 'Démarrage direct en 2D avec relais thermique' },
            description: {
                'ar': 'Partida direta de motor trifásico em 2D com relé térmico de proteção.',
                en: 'Direct starter for a three-phase motor in 2D with a protective thermal relay.',
                es: 'Arranque directo de motor trifásico en 2D con relé térmico de protección.',
                fr: 'Démarrage direct d’un moteur triphasé en 2D avec relais thermique de protection.'
            }
        },
        'partida-direta-reversao-2d': {
            name: { 'ar': 'Partida Direta com Reversão em 2D', en: 'Direct Reversing Starter in 2D', es: 'Arranque Directo con Inversión en 2D', fr: 'Démarrage direct avec inversion en 2D' },
            description: {
                'ar': 'Partida direta de motor trifásico com reversão e componentes realistas.',
                en: 'Direct starter for a three-phase motor with reversing and realistic components.',
                es: 'Arranque directo de motor trifásico con inversión y componentes realistas.',
                fr: 'Démarrage direct d’un moteur triphasé avec inversion et composants réalistes.'
            }
        },
        'partida-estrela-triangulo': {
            name: { 'ar': 'Partida Estrela-Triângulo', en: 'Star-Delta Starter', es: 'Arranque Estrella-Triángulo', fr: 'Démarrage étoile-triangle' },
            description: {
                'ar': 'Circuito de partida estrela-triângulo de motor trifásico.',
                en: 'Star-delta starter circuit for a three-phase motor.',
                es: 'Circuito de arranque estrella-triángulo de motor trifásico.',
                fr: 'Circuit de démarrage étoile-triangle pour moteur triphasé.'
            }
        },
        'partida-estrela-triangulo-2d': {
            name: { 'ar': 'Partida Estrela-Triângulo em 2D', en: 'Star-Delta Starter in 2D', es: 'Arranque Estrella-Triángulo en 2D', fr: 'Démarrage étoile-triangle en 2D' },
            description: {
                'ar': 'Circuito de partida estrela-triângulo com componentes realistas.',
                en: 'Star-delta starter circuit with realistic components.',
                es: 'Circuito de arranque estrella-triángulo con componentes realistas.',
                fr: 'Circuit de démarrage étoile-triangle avec composants réalistes.'
            }
        },
        'partida-estrela-triangulo-reversao': {
            name: { 'ar': 'Partida Estrela-Triângulo com Reversão', en: 'Star-Delta Reversing Starter', es: 'Arranque Estrella-Triángulo con Inversión', fr: 'Démarrage étoile-triangle avec inversion' },
            description: {
                'ar': 'Circuito de partida estrela-triângulo com reversão.',
                en: 'Star-delta starter circuit with reversing.',
                es: 'Circuito de arranque estrella-triángulo con inversión.',
                fr: 'Circuit de démarrage étoile-triangle avec inversion.'
            }
        },
        'partida-estrela-triangulo-reversao-2d': {
            name: { 'ar': 'Partida Estrela-Triângulo com Reversão em 2D', en: 'Star-Delta Reversing Starter in 2D', es: 'Arranque Estrella-Triángulo con Inversión en 2D', fr: 'Démarrage étoile-triangle avec inversion en 2D' },
            description: {
                'ar': 'Partida estrela-triângulo com reversão e componentes realistas.',
                en: 'Star-delta starter with reversing and realistic components.',
                es: 'Arranque estrella-triángulo con inversión y componentes realistas.',
                fr: 'Démarrage étoile-triangle avec inversion et composants réalistes.'
            }
        },
        'partida-compensada': {
            name: { 'ar': 'Partida Compensada', en: 'Autotransformer Starter', es: 'Arranque Compensado', fr: 'Démarrage par autotransformateur' },
            description: {
                'ar': 'Circuito de partida compensada de motor trifásico.',
                en: 'Autotransformer starter circuit for a three-phase motor.',
                es: 'Circuito de arranque compensado de motor trifásico.',
                fr: 'Circuit de démarrage par autotransformateur pour moteur triphasé.'
            }
        },
        'rele-de-tempo': {
            name: { 'ar': 'Relé de Tempo', en: 'Time Relay', es: 'Relé de Tiempo', fr: 'Relais temporisé' },
            description: {
                'ar': 'Exemplo de uso de relé de tempo para acionamento.',
                en: 'Example using a time relay for actuation.',
                es: 'Ejemplo de uso de relé de tiempo para accionamiento.',
                fr: 'Exemple d’utilisation d’un relais temporisé pour la commande.'
            }
        }
    };

    function currentLanguage() {
        return window.SimuCirI18n?.getLanguage?.() || DEFAULT_LANGUAGE;
    }

    function fromPack(pack, fallback, lang = currentLanguage()) {
        if (!pack) return fallback;
        return pack[lang] || pack.en || pack[DEFAULT_LANGUAGE] || fallback;
    }

    function getExampleText(item, field) {
        const id = String(item?.id || '').trim();
        const fallback = field === 'description' ? item?.description : item?.name;
        return fromPack(examples[id]?.[field], fallback || '', currentLanguage());
    }

    window.SimuCirExamplesI18n = Object.freeze({
        examples,
        getExampleText
    });


    /* SimuDz: Arabic examples (inside IIFE) */
    try {
      var __SIMUDZ_EX = {"exemplo-vazio":{"name":"مثال فارغ","description":"دائرة أساسية فارغة لبدء أمثلة جديدة."},"partida-direta":{"name":"تشغيل مباشر","description":"تشغيل مباشر لمحرك ثلاثي الأطوار."},"partida-direta-reversao":{"name":"Direct Reversing Starter","description":"تشغيل مباشر لمحرك ثلاثي الأطوار مع عكس الاتجاه."},"partida-estrela-triangulo":{"name":"Star-Delta Starter","description":"Star-delta starter circuit for a three-phase motor."},"partida-estrela-triangulo-reversao":{"name":"Star-Delta Reversing Starter","description":"Star-delta starter circuit with reversing."},"partida-compensada":{"name":"Autotransformer Starter","description":"Autotransformer starter circuit for a three-phase motor."}};
      Object.keys(examples).forEach(function(id){
        var row = examples[id];
        if (!row) return;
        if (row.name && __SIMUDZ_EX[id] && __SIMUDZ_EX[id].name) row.name.ar = __SIMUDZ_EX[id].name;
        if (row.description && __SIMUDZ_EX[id] && __SIMUDZ_EX[id].description) {
          row.description.ar = __SIMUDZ_EX[id].description;
        }
      });
    } catch (__simudzExErr) {}

}());
