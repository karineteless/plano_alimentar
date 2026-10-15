/* Plano alimentar SMV · 6ª edição
   Fonte: PDF da nutricionista (Juma Siqueira).
   Para atualizar quando vier um plano novo, edite SÓ este arquivo.

   Estrutura:
   refeicoes[] → { id, nome, hora, opcional?, bebida?, opcoes[] }
   opcoes[]    → { id, titulo, sigla, subtitulo?, grupos[], nota? }
   grupos[]    → { alt[] }               item principal + substituições
               | { rotulo, alt[], nota? } "escolha uma" entre as alternativas
               flags: frutas (link p/ tabela de frutas), receita (capuccino), res (texto curto do resumo)
*/
const WHEY15 = { alt: ['Whey protein (15 g = ½ dosador)', 'Proteína da carne (15 g = ½ dose, diluir em água)'], res: 'Whey 15 g' };
const BEBIDA = 'Café/chá ou suco de 1 limão diluído em água – puros ou com adoçante.';

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
};
