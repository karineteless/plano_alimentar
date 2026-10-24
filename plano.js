/* Plano alimentar SMV · 6ª edição
   Fonte: PDF da nutricionista (Juma Siqueira).
   Para atualizar quando vier um plano novo, edite SÓ este arquivo.

   Estrutura:
   refeicoes[] → { id, nome, hora, opcional?, bebida?, opcoes[] }
   opcoes[]    → { id, titulo, sigla, subtitulo?, grupos[], nota? }
   grupos[]    → { alt[] }               item principal + substituições
               | { rotulo, alt[], nota? } "escolha uma" entre as alternativas
               flags: frutas (link p/ tabela de frutas), receita (capuccino), res (texto curto do resumo)
   fimDeSemana → { dias[], refeicoes{ <id da refeição>: { regra, dica?, outroDia?, opcoes[]? } }, doces }
               opções flex: flex:true (cor dourada), umaVez:true (1 dia por fim de semana)
*/
const WHEY15 = { alt: ['Whey protein (15 g = ½ dosador)', 'Proteína da carne (15 g = ½ dose, diluir em água)'], res: 'Whey 15 g' };
const BEBIDA = 'Café/chá ou suco de 1 limão diluído em água – puros ou com adoçante.';
const FRUTA = { alt: ['1 fruta de sua preferência – veja as porções equivalentes'], frutas: true, res: 'Fruta' };

/* Café da manhã flexível (fim de semana) — também pode substituir o lanche da tarde em 1 dia */
const CAFE_FLEX = [
  { id: 'cf1', titulo: 'Flex 1', sigla: 'F1', subtitulo: 'Pão com queijo', flex: true, umaVez: true, grupos: [
    { rotulo: 'Pão · 50 g ou cuscuz', alt: ['2 fatias de forma (normal ou integral)', 'Pão francês (50 g)', 'Cuscuz cozido (100 g)'], res: 'Pão 50 g/cuscuz' },
    { alt: ['Mussarela (30 g)'], res: 'Mussarela 30 g' },
    { rotulo: 'Cremoso · 15 g', alt: ['Creme de ricota light', 'Requeijão light'], res: 'Ricota/requeijão' },
    FRUTA,
  ]},
  { id: 'cf2', titulo: 'Flex 2', sigla: 'F2', subtitulo: 'Pão de queijo assado', flex: true, umaVez: true, grupos: [
    { alt: ['Pão de queijo assado (80 g)'], res: 'Pão de queijo 80 g' },
    WHEY15,
  ]},
  { id: 'cf3', titulo: 'Flex 3', sigla: 'F3', subtitulo: 'Pão de queijo de frigideira', flex: true, umaVez: true, grupos: [
    { alt: ['Ovo (1 unid.) + 1 clara'], res: 'Ovo + clara' },
    { alt: ['Goma de tapioca (35 g)'], res: 'Tapioca 35 g' },
    { alt: ['Mussarela (20 g)'], res: 'Mussarela 20 g' },
    { alt: ['Requeijão light (10 g)'] },
    WHEY15,
    FRUTA,
  ]},
  { id: 'cf4', titulo: 'Flex 4', sigla: 'F4', subtitulo: 'Pão com banana e mel', flex: true, umaVez: true, grupos: [
    { rotulo: 'Pão · 50 g', alt: ['2 fatias de forma (normal ou integral)', 'Pão francês'], res: 'Pão 50 g' },
    { alt: ['1ª fatia (25 g): ½ banana prata + 1 fatia de mussarela + 4 g de mel'], res: 'Banana + mel' },
    { alt: ['2ª fatia: 1 fatia de mussarela'], res: 'Mussarela' },
    WHEY15,
  ]},
  { id: 'cf5', titulo: 'Flex 5', sigla: 'F5', subtitulo: 'Capuccino com leite', flex: true, umaVez: true, grupos: [
    { alt: ['Capuccino SMV (20 g) diluído em leite desnatado (200 ml) – quente ou gelado', 'Capuccino SMV (20 g) diluído em água'], receita: true, res: 'Capuccino' },
  ], nota: 'No PDF esta opção termina em “+” sem o complemento — confirme com a nutricionista.' },
];

window.PLANO = {
  versao: 'SMV · 6ª edição',
  titular: 'Karine',
  objetivo: 'Emagrecimento',
  nutricionista: 'Juma Siqueira',

  refeicoes: [
    { id: 'cafe', nome: 'Café da manhã', hora: '07:00 / 08:00', bebida: BEBIDA, opcoes: [
      { id: 'c1', titulo: 'Opção 1', sigla: 'Op1', grupos: [
        { alt: ['Iogurte natural integral (170 ml)'], res: 'Iogurte' },
        { alt: ['Fruta – veja as porções equivalentes'], frutas: true, res: 'Fruta' },
        WHEY15,
      ], nota: 'Se quiser, requeijão light ou creme de ricota light (pouca quantidade – até 1 colher de chá).' },
      { id: 'c2', titulo: 'Opção 2', sigla: 'Op2', grupos: [
        { alt: ['Pão de forma Artesano (1 fatia)'], res: 'Pão artesano' },
        { rotulo: 'Recheio · 60 g', alt: ['Frango desfiado', 'Atum'], res: 'Frango/atum' },
        { alt: ['Mussarela (1 fatia – 20 g)'], res: 'Mussarela' },
        { alt: ['Orégano e tomate a gosto'] },
        { rotulo: 'Fruta', alt: ['1 kiwi', '1 ameixa', 'Morango (100 g)'], res: 'Fruta' },
      ]},
      { id: 'c3', titulo: 'Opção 3', sigla: 'Op3', grupos: [
        { alt: ['Capuccino SMV (20 g) diluído em água quente ou gelada'], receita: true, res: 'Capuccino' },
        { rotulo: 'Pão ou torrada', alt: ['1 fatia de forma normal (25 g)', '1 fatia de forma integral', '½ pão francês', '2 torradas Bauducco multigrãos', '1 pacotinho de Magic Toast'], res: 'Pão/torrada' },
        { alt: ['Mussarela (20 g)'], res: 'Mussarela' },
        WHEY15,
      ]},
    ]},

    { id: 'almoco', nome: 'Almoço', hora: '12:00 / 13:00', opcoes: [
      { id: 'a1', titulo: 'Prato', sigla: '✓', grupos: [
        { rotulo: 'Proteína · 130 g', alt: ['Peito de frango', 'Moela de frango', 'Lombo suíno', 'Filé mignon (boi ou suíno, sem capa de gordura)', 'Patinho', 'Atum', 'Peixe branco'], res: 'Proteína 130 g' },
        { rotulo: 'Legumes · livre', nota: '2 colheres de servir ou pelo menos ¼ do prato. Exceto batatas e tubérculos.', alt: ['Cenoura', 'Brócolis', 'Couve-flor', 'Abobrinha', 'Outros legumes'], res: 'Legumes' },
        { rotulo: 'Carboidrato · 80 g', nota: 'Macarrão de preferência de massa de arroz (sem obrigatoriedade).', alt: ['Arroz', 'Macarrão', 'Batata-doce', 'Batata baroa'], res: 'Carboidrato 80 g' },
        { rotulo: 'Leguminosas · 60 g', nota: '½ concha – 2 colheres de sopa.', alt: ['Feijão', 'Grão-de-bico', 'Quinoa', 'Ervilha', 'Milho', 'Lentilha'], res: 'Leguminosa 60 g' },
        { rotulo: 'Vegetais e hortaliças · à vontade', nota: 'Todos os dias.', alt: ['Alface', 'Acelga', 'Espinafre', 'Taioba', 'Couve', 'Mostarda', 'Almeirão', 'Aspargos', 'Pepino', 'Rabanete', 'Palmito', 'Pimentão', 'Agrião', 'Rúcula', 'Salsinha', 'Cebolinha', 'Alho', 'Cebola', 'Alho-poró', 'Vagem', 'Repolho verde e roxo', 'Tomate'], res: 'Salada' },
      ]},
    ]},

    { id: 'lanche', nome: 'Lanche da tarde', hora: '15:00 / 16:00', bebida: BEBIDA, opcoes: [
      { id: 'l1', titulo: 'Opção 1', sigla: 'Op1', grupos: [
        { rotulo: 'Base', alt: ['Iogurte desnatado (200 ml)', 'Leite desnatado (200 ml ou 26 g em pó)'], res: 'Iogurte/leite' },
        WHEY15,
        { rotulo: 'Opcional', alt: ['Frutas vermelhas (até 100 g)', '1 maracujá'] },
      ]},
      { id: 'l2', titulo: 'Opção 2', sigla: 'Op2', grupos: [
        { alt: ['Magic Toast Marilan (1 pacotinho)'], res: 'Magic Toast' },
        { rotulo: 'Recheio · 50 g (2 colheres de sopa)', alt: ['Peito de frango desfiado', 'Atum'], res: 'Frango/atum' },
        { rotulo: 'Creme · 20 g (1 colher de sopa)', alt: ['Creme de ricota light', 'Maionese light'] },
        { alt: ['Passata ou molho de tomate de até 3 ingredientes (a gosto)'] },
        { alt: ['Manjericão e orégano a gosto'] },
      ]},
      { id: 'l3', titulo: 'Opção 3', sigla: 'Op3', grupos: [
        { alt: ['Fruta – veja as porções equivalentes'], frutas: true, res: 'Fruta' },
        { alt: ['Chocolate 70% (10 g – 2 quadradinhos)'], res: 'Chocolate 70%' },
        WHEY15,
      ]},
    ]},

    { id: 'pre', nome: 'Pré-treino', hora: 'Dia de treino', opcional: true, opcoes: [
      { id: 'p1', titulo: 'Pré-treino', sigla: '✓', grupos: [
        { alt: ['1 banana prata + fio de mel + canela a gosto'], res: 'Banana + mel' },
      ]},
    ]},

    { id: 'jantar', nome: 'Jantar', hora: '18:00 / 20:00', opcoes: [
      { id: 'j1', titulo: 'Opção 1', sigla: 'Op1', subtitulo: 'Hambúrguer fit', grupos: [
        { rotulo: 'Pão · 50 g', alt: ['2 fatias de forma (de preferência integral)', 'Pão de hambúrguer Bauducco (50 g)', 'Pão francês'], res: 'Pão 50 g' },
        { rotulo: 'Proteína · 120 g', alt: ['Frango', 'Lombo suíno', 'Patinho', 'Atum'], res: 'Proteína 120 g' },
        { alt: ['Mostarda Heinz a gosto + ketchup com moderação'] },
        { rotulo: 'Vegetais · à vontade', alt: ['Palmito', 'Alface', 'Rúcula', 'Tomate'], res: 'Vegetais' },
      ]},
      { id: 'j2', titulo: 'Opção 2', sigla: 'Op2', subtitulo: 'Wrap de ricota', grupos: [
        { alt: ['Rap10 Fit (1 unid.)'], res: 'Rap10' },
        { alt: ['Ricota (30 g) amassada com sal, limão, orégano e temperos a gosto'], res: 'Ricota 30 g' },
        { alt: ['Tomate-cereja picado'] },
        { alt: ['Whey protein (30 g = 1 dosador) em água ou em creminho', 'Proteína da carne (30 g = 1 dosador, diluir em água)'], res: 'Whey 30 g' },
      ]},
      { id: 'j3', titulo: 'Opção 3', sigla: 'Op3', subtitulo: 'Saladão SMV', grupos: [
        { alt: ['Mix de folhas: alface roxa + americana + rúcula ou agrião (ou folhas de sua preferência)'], res: 'Folhas' },
        { rotulo: 'Complementos · os que tiver em casa', alt: ['Tomate-cereja', 'Pepino em meia-lua', 'Cenoura ralada', 'Cebola roxa', 'Beterraba', 'Vagem', 'Quiabo', 'Brócolis', 'Ovo de codorna (até 3)'] },
        { rotulo: 'Proteína · 130 g', alt: ['Peito de frango desfiado ou em cubos', 'Patinho moído ou em pedaços', 'Atum em pedaços'], res: 'Proteína 130 g' },
        { rotulo: 'Sementes · 12 g', alt: ['Girassol', 'Abóbora', 'Linhaça', 'Gergelim', 'Chia'] },
        { rotulo: 'Leguminosas · 50 g', alt: ['Milho', 'Grão-de-bico', 'Ervilha', 'Lentilha'] },
        { rotulo: 'Carboidrato', alt: ['Magic Toast picada (3 torradinhas)', 'Batata inglesa (100 g)', 'Macarrão parafuso (50 g)'], res: 'Carboidrato' },
        { rotulo: 'Molho opcional', alt: ['Iogurte desnatado (170 ml) + salsinha + limão-siciliano + alho + sal', 'Mostarda e mel (2 c. sopa de mostarda : 1 c. sopa rasa de mel)'] },
      ]},
      { id: 'j4', titulo: 'Opção 4', sigla: 'Op4', subtitulo: 'Pão + ovos', grupos: [
        { rotulo: 'Pão · 50 g', alt: ['2 fatias de forma (de preferência integral)', 'Pão de hambúrguer Bauducco (50 g)', 'Pão francês'], res: 'Pão 50 g' },
        { alt: ['Ovos (2 unid.)'], res: '2 ovos' },
        { rotulo: 'Complemento de proteína', alt: ['Whey protein (15 g = ½ dosador)', '3 claras de ovo', 'Frango desfiado (50 g)', 'Proteína da carne (15 g = ½ dose)'], res: '+ proteína' },
      ]},
    ]},
  ],

  frutas: [
    'Maçã (1 unid. pequena)', 'Pera (1 unid. pequena)', 'Abacaxi (120 g – 2 rodelas médias)', 'Uva (60 g)',
    'Manga (80 g)', 'Banana prata (65 g – 1 unid. pequena)', 'Mamão papaya (110 g – ½ unid. pequena)',
    'Melão (150 g – 1 fatia média)', 'Morango (150 g – 7 unid.)', 'Kiwi (2 unid.)',
    'Ameixa vermelha fresca (2 pequenas ou 1 grande)', 'Pêssego fresco (2 pequenos ou 1 grande)',
  ],
  adocantes: ['sucralose', 'xilitol', 'eritritol', 'stevia'],

  extras: [
    { id: 'e1', texto: 'Pipoca na pipoqueira elétrica (25 g)' },
    { id: 'e2', texto: 'Fruta: morango, melão, melancia, acerola ou frutas vermelhas (100 g) · ou 1 kiwi, pêssego ou ameixa' },
    { id: 'e3', texto: 'Iogurte desnatado (200 ml) com morango (60 g)' },
    { id: 'e4', texto: 'Suspiro Wheyviv' },
    { id: 'e5', texto: 'Doce de leite HeyMu (40 g)' },
    { id: 'e6', texto: 'Gelatina zero com até 15 g de creme de leite' },
    { id: 'e7', texto: '1 fatia de pão com geleia 100% fruta ou diet (20 g)' },
    { id: 'e8', texto: 'Trufa zero Cacau Show (13 g)' },
    { id: 'e9', texto: 'Macarrão konjac com 50 g de patinho e molho de tomate' },
    { id: 'e10', texto: 'Doce de leite tradicional (20 g)' },
  ],
  chaExtras: 'Chá de camomila, erva-doce ou capim-cidreira (1 xícara).',

  capuccino: {
    nome: 'Capuccino SMV',
    itens: [['Leite em pó desnatado', '250 g'], ['Café solúvel', '50 g'], ['Cacau em pó', '50 g'], ['Canela', '5 g'], ['Bicarbonato', '4 g']],
    nota: 'Junte todos os ingredientes, misture num pote e retire sua porção (20 g).',
  },

  hidratacao: { baseMl: 2500, formula: '70 kg × 35 ml ≈ 2.500 ml/dia', porHoraTreinoMl: 300, incrementoMl: 500 },

  /* Cardápio flexível de fim de semana (PDF "SMV - Cardápio flexível").
     dias: 0 = domingo … 5 = sexta, 6 = sábado. Nesses dias as opções "Flex" aparecem
     junto das habituais na tela Hoje. umaVez: só 1 dia por fim de semana (o app avisa). */
  fimDeSemana: {
    nome: 'Cardápio flexível',
    dias: [5, 6, 0],
    refeicoes: {
      cafe: {
        regra: 'Em um dos dias do fim de semana, escolha uma das opções de café da manhã flexível.',
        outroDia: 'No outro dia, mantenha o café habitual e, se quiser, + 1 porção extra: queijo, 1 fruta ou 1 fatia de pão.',
        dica: 'Flex F1–F5 em um dos dias do fim de semana',
        opcoes: CAFE_FLEX,
      },
      almoco: {
        regra: 'Mantenha as quantidades de carboidratos, leguminosas e demais alimentos da dieta. A flexibilidade é na escolha e no preparo da proteína.',
        exemplos: ['Frango com 30 g (1 c. sopa cheia) de requeijão light ou um pouco de creme de leite, sem exageros', 'Sobrecoxa assada', 'Frango à parmegiana assado com 40 g de mussarela', 'Bife de alcatra'],
        sobremesa: 'Sobremesa opcional: 1 porção de fruta. Se não comer a fruta, pode acrescentar + 100 g de batata inglesa assada no almoço.',
        dica: 'Preparo da proteína livre · sobremesa: 1 fruta ou +100 g de batata assada',
      },
      lanche: {
        regra: 'Siga as opções e quantidades da dieta. Se preferir, troque o lanche por uma opção do café flexível em apenas 1 dia do fim de semana.',
        outroDia: 'Nos outros dias, siga as opções habituais do lanche (ou F2/F3).',
        opcoes: [
          { id: 'lf1', titulo: 'Flex 1', sigla: 'F1', subtitulo: 'Café flexível no lugar do lanche', flex: true, umaVez: true, grupos: [
            { rotulo: 'Uma das opções do café flexível', alt: CAFE_FLEX.map(o => `${o.sigla} · ${o.subtitulo}`), res: 'Café flexível' },
          ], nota: 'As quantidades de cada opção estão no café da manhã (fim de semana).' },
          { id: 'lf2', titulo: 'Flex 2', sigla: 'F2', subtitulo: 'Proteína + pipoca', flex: true, grupos: [
            { alt: ['Proteína prevista na dieta (whey 15 g ou proteína da carne 15 g)'], res: 'Proteína' },
            { alt: ['Milho de pipoca (65 g)'], res: 'Pipoca 65 g' },
          ]},
          { id: 'lf3', titulo: 'Flex 3', sigla: 'F3', subtitulo: 'Muffin proteico de banana e aveia', flex: true, grupos: [
            { alt: ['Banana prata amassada (1 unid. média – 70 g)'], res: 'Banana' },
            { alt: ['Ovo (1 unid.)'], res: 'Ovo' },
            { alt: ['Farelo de aveia (15 g – 1 c. sopa)'], res: 'Aveia' },
            { rotulo: 'Para adoçar', alt: ['Chocolate (15 g)', 'Doce de leite (30 g)'] },
          ], nota: 'Misture tudo e asse em forminha por 20 min a 180 °C.' },
        ],
      },
      jantar: {
        regra: 'Além das opções habituais, nos dias de fim de semana você pode escolher uma destas.',
        dica: 'Flex: hambúrguer turbo, pastel, poke ou pedido especial',
        opcoes: [
          { id: 'jf1', titulo: 'Flex 1', sigla: 'F1', subtitulo: 'Hambúrguer fit turbo', flex: true, grupos: [
            { rotulo: 'Pão', alt: ['Pão (50 g) + batata inglesa (100 g)', 'Pão de hambúrguer normal (90 g)'], res: 'Pão' },
            { rotulo: 'Proteína · quantidade da dieta', alt: ['Frango', 'Lombo suíno', 'Patinho', 'Atum'], res: 'Proteína' },
            { alt: ['Mussarela (30 g)'], res: 'Mussarela 30 g' },
            { alt: ['Mostarda Heinz a gosto + ketchup com moderação'] },
            { rotulo: 'Vegetais · à vontade', alt: ['Palmito', 'Alface', 'Rúcula', 'Tomate'] },
            { rotulo: 'Acréscimo opcional', alt: ['Cream cheese light (até 20 g – 1 c. sopa)', 'Geleia de pimenta (até 20 g – 1 c. sopa)', 'Barbecue (2 c. sopa)', 'Maionese light Hellmann’s (até 25 g)', 'Mussarela (1 fatia – 20 g)'] },
          ]},
          { id: 'jf2', titulo: 'Flex 2', sigla: 'F2', subtitulo: 'Pastel na airfryer', flex: true, grupos: [
            { alt: ['Massa de pastel (80 g)'], res: 'Massa 80 g' },
            { alt: ['Mussarela (30 g)'], res: 'Mussarela 30 g' },
            { rotulo: 'Proteína · quantidade da dieta', alt: ['Peito de frango', 'Camarão', 'Patinho'], res: 'Proteína' },
            { alt: ['Requeijão light (30 g)'] },
            { alt: ['Mostarda e ketchup a gosto'] },
          ], nota: 'Monte o pastel, borrife um pouco de gordura (ou passe um pouco de manteiga) para dourar e leve à airfryer.' },
          { id: 'jf3', titulo: 'Flex 3', sigla: 'F3', subtitulo: 'Poke', flex: true, grupos: [
            { rotulo: 'Proteína', alt: ['Camarão', 'Salmão', 'Peixe branco'], res: 'Peixe/camarão' },
            { alt: ['Arroz'], res: 'Arroz' },
            { alt: ['Cream cheese'] },
            { alt: ['Crispy de couve'] },
            { alt: ['Outros vegetais não fritos, à vontade'] },
          ], nota: 'Poke da sua cidade com ingredientes semelhantes.' },
          { id: 'jf4', titulo: 'Flex 4', sigla: 'F4', subtitulo: 'Pedido especial', flex: true, grupos: [
            { rotulo: 'Pedidos especiais dentro da dieta', alt: ['Aka Poke', 'Sanduba da Green', 'Escondidinho Sabor e Saúde'], res: 'Pedido' },
          ]},
        ],
      },
    },
    doces: {
      regra: 'Escolha 1 doce por dia. A numeração vai do menor para o maior valor calórico (pode variar conforme marca e porção).',
      livre: 'Gelatina zero açúcar, em quantidade livre.',
      itens: [
        { id: 'd1', texto: 'Geladinho de morango: 70 g + 100 ml de iogurte de morango desnatado' },
        { id: 'd2', texto: 'Doce de leite: 1 colher de sopa rasa (20 g)' },
        { id: 'd3', texto: 'Chocolate: 2 quadradinhos (10 g), sem açúcar ou, de preferência, amargo' },
        { id: 'd4', texto: 'Picolé sem açúcar: 1 unidade' },
        { id: 'd5', texto: 'Batom: 1 unidade' },
        { id: 'd6', texto: 'Sorvete zero açúcar: 1 bola' },
        { id: 'd7', texto: 'Ouro Branco: 1 unidade' },
        { id: 'd8', texto: 'Sorvete Chokito de caixinha: 1 unidade' },
        { id: 'd9', texto: 'Trento: 1 unidade' },
        { id: 'd10', texto: 'Bolo: 1 fatia pequena, que caiba num prato de sobremesa (substitui o lanche da tarde)', substitui: 'lanche' },
      ],
      /* Regra do bolo: no dia seguinte, só as opções 1 a 4 */
      bolo: { id: 'd10', diaSeguinte: ['d1', 'd2', 'd3', 'd4'], regra: 'Se escolher a opção 10 (bolo), no dia seguinte escolha apenas entre as opções 1 e 4.' },
    },
  },
};
