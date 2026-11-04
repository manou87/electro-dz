(function () {
    'use strict';

    window.PAINEL_ELETRICO_CHECKLIST = {
        title: 'Checklist do painel',
        subtitle: 'Apoio para montagem e revisão · salvo neste navegador',
        notice: 'Use esta checklist para acompanhar a montagem e lembrar os pontos que ainda precisam ser verificados. Abra cada tópico para consultar os detalhes e as referências relacionadas. Alguns requisitos dependem das características da máquina, do ambiente e do projeto; em caso de dúvida, consulte a documentação técnica e o profissional responsável.',
        items: [
            { title: 'Dispositivo geral de seccionamento', badge: 'Obrigatório no projeto', details: ['Especificar dispositivo de desligamento e seccionamento adequado ao projeto.', 'Definir quais circuitos devem ser seccionados e quais exceções são tecnicamente justificadas.', 'Prever impedimento de reenergização e bloqueio quando aplicável.', 'Identificar a condição operativa e o dispositivo.'] },
            { title: 'Proteção contra curto-circuito', badge: 'Obrigatório', details: ['Utilizar dispositivo de proteção contra sobrecorrente dimensionado conforme a demanda e o projeto.', 'Definir a proteção e sua coordenação para cada circuito conforme a norma técnica aplicável.'] },
            { title: 'Proteção contra sobrecarga', badge: 'Quando aplicável', details: ['Proteger motores com disjuntor-motor, relé térmico ou proteção eletrônica do inversor, quando permitido.', 'Conferir a regulagem de acordo com a carga e o projeto.'] },
            { title: 'Aterramento de proteção (PE)', badge: 'Obrigatório', details: ['Prever o meio de conexão ao condutor de proteção conforme o projeto e a norma técnica aplicável; as NRs citadas não prescrevem por si só o formato de barramento nem sua cor.', 'Aterrar carcaças, invólucros, blindagens e partes condutoras que possam ficar sob tensão, conforme a aplicabilidade.', 'Tratar a conexão funcional de blindagens separadamente, conforme o projeto e o fabricante.'] },
            { title: 'Barramento neutro', badge: 'Quando houver neutro', details: ['Instalar quando houver condutor neutro no equipamento.', 'Manter N e PE separados no equipamento; o esquema de aterramento e o ponto de separação devem seguir o projeto da instalação.', 'Identificar o neutro conforme a padronização aplicável.'] },
            { title: 'Identificação dos cabos', badge: 'Obrigatório no projeto', details: ['Definir no projeto como os condutores e circuitos serão identificados fisicamente.', 'Manter a identificação coerente com o diagrama e o memorial descritivo; a exigência de marcação nas duas extremidades deve vir da norma técnica ou especificação adotada.'] },
            { title: 'Identificação dos componentes', badge: 'Obrigatório no projeto', details: ['Identificar circuitos, dispositivos e equipamentos segundo o sistema definido no projeto.', 'Usar referências consistentes, como QF1, FU1, KM1, FR1, M1, PS1, PLC1 e HMI1, quando esse for o padrão adotado.', 'Manter as identificações coerentes com o diagrama elétrico.'] },
            { title: 'Canaletas e separação de circuitos', badge: 'Separação obrigatória', details: ['Organizar os cabos conforme os critérios do projeto.', 'Identificar e instalar separadamente circuitos de finalidades diferentes; compartilhamento somente quando tecnicamente permitido e definido no projeto.'] },
            { title: 'Bornes', details: ['Utilizar dispositivos de conexão apropriados; bornes de interface para a fiação externa do CLP são uma decisão de projeto, não exigência literal da NR-12.', 'Separar bornes de entradas, saídas, alimentação e terra conforme o projeto.', 'Identificar os bornes de acordo com o diagrama.'] },
            { title: 'Fonte de controle / 24 Vcc', badge: 'Quando aplicável', details: ['Definir a tensão da fonte de controle conforme os equipamentos e a apreciação de riscos; a NR-12 não exige especificamente 24 Vcc.', 'Para interfaces de operação abrangidas pelos itens 12.4.13 e 12.4.13.1, verificar os limites de extrabaixa tensão e as alternativas admitidas pela própria NR-12.'] },
            { title: 'Proteção da fonte', badge: 'Proteção obrigatória', details: ['Confirmar que o circuito que alimenta a fonte está protegido contra sobrecorrente.', 'Definir pelo projeto se a fonte terá proteção dedicada e dimensionar a coordenação conforme a demanda, o fabricante e a norma técnica aplicável.'] },
            { title: 'Proteção dos circuitos de controle', details: ['Proteger os circuitos de controle com fusível ou minidisjuntor.', 'Setorizar proteções quando necessário para facilitar diagnóstico e manutenção.'] },
            { title: 'Ventilação', badge: 'Quando necessária', details: ['Avaliar a dissipação térmica do conjunto.', 'Prever filtro, ventilador, exaustor e/ou termostato quando necessário.', 'Manter entradas e saídas de ar desobstruídas.'] },
            { title: 'Grau de proteção (IP)', badge: 'Obrigatório', details: ['Definir o grau IP conforme o ambiente de instalação.', 'Verificar se invólucro, prensa-cabos, ventilação e itens de porta preservam o grau requerido, como IP54, IP55 ou IP65.'] },
            { title: 'Placa de identificação', badge: 'Obrigatória para máquina', details: ['Identificar o painel conforme os critérios do projeto e da norma técnica aplicável.', 'Não confundir a placa do painel com a identificação da máquina exigida pelo item 12.12.7 da NR-12.', 'Na máquina, conferir todos os dados exigidos pelo item 12.12.7 conforme a data de fabricação.'] },
            { title: 'Documentação e diagramas elétricos', badge: 'Obrigatório no escopo', details: ['Manter atualizado o esquema unifilar da instalação nos termos da NR-10.', 'Manter o projeto elétrico atualizado e disponível às pessoas autorizadas.', 'Para sistemas de segurança de máquinas, verificar a exigência condicional de projeto, diagrama ou representação esquemática do item 12.5.17 da NR-12.', 'Manter uma cópia dentro do painel somente quando isso for definido pelo projeto ou procedimento da empresa.'] },
            { title: 'Etiqueta de advertência', badge: 'Obrigatório', details: ['Aplicar advertências adequadas aos riscos existentes.', 'Usar indicação visível, por exemplo: “Perigo — Alta tensão”.'] },
            { title: 'Etiqueta de tensão', details: ['Identificar de forma visível as tensões presentes.', 'Diferenciar alimentações como 220 V, 380 V, 440 V e 24 Vcc, conforme o painel.'] },
            { title: 'Proteção dos circuitos de emergência', badge: 'Conforme o risco', details: ['Utilizar relé de segurança quando determinado pela análise de risco.', 'Prever contatores redundantes quando exigido.', 'Integrar o circuito de emergência conforme a categoria/nível de desempenho requerido.'] },
            { title: 'Botão de emergência', badge: 'Obrigatório quando aplicável', details: ['Prever dispositivo de parada de emergência quando aplicável, observando também as exceções da NR-12.', 'Selecionar cores, forma e identificação conforme a norma técnica oficial aplicável; os itens citados da NR-12 não definem sozinhos a combinação vermelho/amarelo.', 'Garantir retenção do acionador e desacionamento somente por ação manual intencional.'] },
            { title: 'Porta e intertravamento', badge: 'Porta obrigatória', details: ['Manter a porta do painel fechada, exceto nas intervenções permitidas pela NR-12.', 'Avaliar pelo projeto e pela apreciação de riscos se a abertura deve provocar seccionamento ou intertravamento; o item 12.3.5(a) não determina sozinho o desligamento automático.', 'Quando houver acesso para manutenção, garantir controle de acesso e procedimento seguro.'] },
            { title: 'Iluminação interna', details: ['Prever iluminação interna quando ela facilitar inspeção e manutenção.', 'Posicionar a luminária sem criar obstáculos ou aquecimento indevido.'] },
            { title: 'Tomada de manutenção', details: ['Avaliar tomada de manutenção em 110 V ou 220 V conforme o projeto.', 'Identificar a tensão e prever proteção dedicada.'] },
            { title: 'Organização dos cabos', badge: 'Obrigatório no escopo', details: ['Fixar e acomodar os cabos sem tensão mecânica.', 'Respeitar raios de curvatura e realizar curvas suaves.', 'Evitar condutores soltos ou pressionados por tampas e componentes.'] },
            { title: 'Separação entre potência e sinal', badge: 'Obrigatório', details: ['Identificar e instalar separadamente cabos de potência e circuitos de comunicação, sinalização e controle, salvo compartilhamento tecnicamente permitido e definido no projeto.', 'Respeitar as distâncias, o roteamento e os cruzamentos especificados pelas normas técnicas e pelos fabricantes.'] },
            { title: 'Blindagem', badge: 'Conforme projeto', details: ['Verificar blindagem de cabos de encoder, RS485, Ethernet industrial e sinais analógicos.', 'Aterrar a blindagem conforme o projeto e a recomendação do fabricante.'] },
            { title: 'Identificação da porta', badge: 'Conforme projeto', details: ['Identificar o painel externamente com nome ou TAG legível quando definido pelo projeto.', 'Usar o padrão documental adotado, como PCC-01, QGBT-01 ou CCM-03.', 'Não tratar esses exemplos de TAG como exigência literal da NR-12.'] },
            { title: 'Dispositivos de segurança', badge: 'Obrigatório conforme risco', details: ['Confirmar os dispositivos definidos pela análise de risco.', 'Verificar relés, scanners, cortinas de luz, chaves de segurança e tapetes quando aplicáveis.', 'Validar integração, diagnóstico e atuação segura.'] },
            { title: 'Aterramento da porta', badge: 'Obrigatório quando aplicável', details: ['Incluir a porta condutora no sistema de aterramento quando ela puder ficar sob tensão.', 'Definir condutor, flexibilidade, identificação e terminais conforme a norma técnica e as condições mecânicas do projeto; as NRs citadas não fixam esses detalhes construtivos.'] },
            { title: 'Espaço para expansão', badge: 'Boa prática', details: ['Reservar, quando definido pelo projeto, cerca de 20% a 30% de espaço para futuras ampliações; esse percentual não é prescrito pelas normas citadas.', 'Manter o espaço útil e acessível, sem comprometer ventilação ou segurança.'] },
            { title: 'Reserva de trilho DIN', badge: 'Boa prática', details: ['Deixar trecho de trilho DIN disponível quando houver previsão de futuras modificações; a reserva não é uma exigência percentual da norma.', 'Manter a reserva protegida e compatível com acessibilidade e afastamentos necessários.'] },
            { title: 'Reserva de canaleta', badge: 'Boa prática', details: ['Dimensionar a canaleta para a fiação prevista e evitar ocupação que prejudique instalação, manutenção ou dissipação.', 'Deixar capacidade adicional somente quando ela fizer parte dos critérios do projeto; a norma citada não fixa um percentual geral de reserva.'] },
            { title: 'Espaço para dissipação', badge: 'Conforme fabricante', details: ['Respeitar as distâncias mínimas de inversores, soft starters, fontes e CLPs.', 'Seguir as orientações de montagem e ventilação de cada fabricante.'] },
            { title: 'Interface homem-máquina (IHM)', badge: 'Obrigatório no escopo', details: ['Garantir fixação adequada e localização segura.', 'Definir o grau de proteção conforme o ambiente, o projeto e o fabricante; não presumir IP65 sem especificação.', 'Identificar claramente as funções e proteger a alimentação.', 'Separar os cabos de comunicação dos cabos de potência conforme o projeto.'] }
        ],
        architecture: [
            'Chave seccionadora geral com bloqueio e disjuntor geral.',
            'DPS, quando exigido pelo projeto e pela instalação.',
            'Fonte 24 Vcc, CLP, expansões e módulos Ethernet/RS485.',
            'IHM, inversores de frequência e soft starters, quando aplicáveis.',
            'Contatores, relés auxiliares, relés de segurança e botão de emergência.',
            'Sinaleiros, botoeiras e bornes de potência, controle e comunicação.',
            'Barramentos PE e N, canaletas, trilhos DIN e identificação completa.',
            'Ventilação adequada, diagramas elétricos e placa de identificação.'
        ]
    };

    var normativeReferences = [
        ['NR-10 — itens 10.3.1 e 10.3.2'],
        ['NR-12 — item 12.3.7'],
        ['NR-12 — item 12.3.7 (proteção geral contra sobrecorrente); seleção e ajuste da proteção do motor dependem da norma técnica e do fabricante'],
        ['NR-10 — itens 10.2.8.3 e 10.3.4', 'NR-12 — item 12.3.2'],
        ['NR-10 — item 10.3.4'],
        ['NR-10 — item 10.3.9, alínea “c”', 'NR-12 — item 12.3.5, alínea “d”'],
        ['NR-10 — item 10.3.9, alínea “c”', 'NR-12 — item 12.3.5, alínea “d”'],
        ['NR-10 — item 10.3.3.1'],
        ['NR-12 — item 12.3.6; não há nesse item exigência literal de borneira para toda conexão externa'],
        ['NR-12 — itens 12.4.13 e 12.4.13.1; esses itens não obrigam especificamente 24 Vcc'],
        ['NR-12 — item 12.3.7'],
        ['NR-12 — item 12.3.7'],
        ['Sem requisito direto identificado na NR-10 ou NR-12 para ventilação interna do painel; validar norma técnica, cálculo térmico e fabricante'],
        ['NR-12 — item 12.3.5, alínea “e”'],
        ['NR-12 — item 12.12.7 para identificação da máquina; os dados próprios da placa do painel dependem da norma técnica e do projeto'],
        ['NR-10 — itens 10.2.3 e 10.3.7', 'NR-12 — item 12.5.17, somente quando aplicável aos sistemas de segurança'],
        ['NR-10 — item 10.10.1', 'NR-12 — item 12.3.5, alínea “b”, e itens 12.12.1 a 12.12.4'],
        ['NR-10 — item 10.10.1', 'NR-12 — item 12.12.5; referências relacionadas à identificação e às especificações, sem prescrever formato único de etiqueta de tensão'],
        ['NR-12 — itens 12.4.14, 12.5.2 e 12.6.3'],
        ['NR-12 — itens 12.6.1 a 12.6.5.1; observar as exceções do item 12.6.1.2'],
        ['NR-12 — item 12.3.5, alínea “a”; esse item não exige sozinho desligamento automático ao abrir a porta'],
        ['Sem requisito direto identificado na NR-10 ou NR-12 que obrigue iluminação dentro do painel'],
        ['Sem requisito direto identificado na NR-10 ou NR-12 que obrigue tomada de manutenção dentro do painel'],
        ['NR-12 — item 12.3.4 para condutores de alimentação'],
        ['NR-10 — item 10.3.3.1'],
        ['Sem requisito direto identificado na NR-10 ou NR-12 para o método de terminação da blindagem; seguir projeto, norma técnica e fabricante'],
        ['Sem requisito direto identificado na NR-10 ou NR-12 para TAG externa do painel no padrão PCC/QGBT/CCM; tratar como padrão de projeto'],
        ['NR-12 — itens 12.5.1 e 12.5.2'],
        ['NR-10 — item 10.3.4', 'NR-12 — item 12.3.2'],
        ['Sem requisito direto identificado na NR-10 ou NR-12 para reserva de 20% a 30%; percentual é critério de projeto'],
        ['Sem requisito direto identificado na NR-10 ou NR-12 para reserva de trilho DIN; é critério de projeto'],
        ['Sem requisito direto identificado na NR-10 ou NR-12 para percentual de reserva de canaleta; é critério de projeto'],
        ['Sem distância geral prescrita na NR-10 ou NR-12 para dissipação entre componentes; seguir cálculo térmico e fabricante'],
        ['NR-10 — item 10.3.3.1 para separação de circuitos com finalidades diferentes', 'NR-12 — itens 12.4.1, 12.4.13 e 12.4.13.1']
    ];

    window.PAINEL_ELETRICO_CHECKLIST.items.forEach(function (item, index) {
        item.references = normativeReferences[index] || ['Aplicabilidade a confirmar no projeto e na apreciação de riscos.'];
    });
})();
