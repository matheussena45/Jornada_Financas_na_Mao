// =========================================================
// Jornada Finanças na Mão — protótipo jogável (Fluxo Linear Direto)
// =========================================================

const RANKING_KEY = "financas_na_mao_v1";
const MAX_LIVES = 6;
const INFO_PROXIMITY_RADIUS = 90;
const ANSWER_SECONDS = 15;
const ONCE_BUBBLE_MIN_MS = 4500;
const NARRATIVE_TYPE_SPEED_MS = 45;
const NARRATIVE_DEFAULT_DURATION_MS = 4000;

// ---------------------------------------------------------
// TEMA / IDENTIDADE VISUAL
// ---------------------------------------------------------
const THEME = {
  primary: 0x1a4329, // Verde-escuro financeiro
  primaryDark: 0x0d2415, // Verde muito escuro (fundos)
  accent: 0xf2a900, // Dourado
  accentLight: 0xffe27a,
  cream: 0xf5f0e6,
  danger: 0xc0392b,
  success: 0x4caf50,
  skin: 0xe8b892,
  hair: 0x2b1d12,
  shoe: 0x111111,
};

// ---------------------------------------------------------
// ÁUDIO
// ---------------------------------------------------------
const SFX = {
  bgm: new Audio("assets/audio/bgm.mp3"),
  type: new Audio("assets/audio/type_blip.wav"),
  tick: new Audio("assets/audio/countdown_tick.wav"),
  locked: new Audio("assets/audio/locked.mp3"),
  unlock: new Audio("assets/audio/unlock.mp3"),
  complete: new Audio("assets/audio/completed.wav"),
  victory: new Audio("assets/audio/victory.mp3"),
  gameover: new Audio("assets/audio/gameover.mp3"),
};
SFX.bgm.loop = true;
SFX.bgm.volume = 0.2;
SFX.type.volume = 0.03;
SFX.tick.volume = 1.0;
SFX.tick.loop = false;
SFX.locked.volume = 0.6;
SFX.unlock.volume = 0.8;
SFX.complete.volume = 0.8;

function playSfx(audio) {
  try {
    audio.currentTime = 0;
    audio.play();
  } catch (e) {}
}

function stopSfx(audio) {
  try {
    audio.pause();
    audio.currentTime = 0;
  } catch (e) {}
}
function startBgm() {
  SFX.bgm.play().catch(() => {});
}

// ---------------------------------------------------------
// PERSONAGENS JOGÁVEIS
// ---------------------------------------------------------
const CHARACTERS = [
  { id: "city_men_1", label: "Personagem 1", idleFrames: 6, walkFrames: 10 },
  { id: "city_girl_1", label: "Personagem 2", idleFrames: 6, walkFrames: 10 },
  { id: "city_men_3", label: "Personagem 3", idleFrames: 6, walkFrames: 10 },
];
const CHARACTER_FRAME_SIZE = 128;
const CHARACTER_BODY = { width: 44, height: 70, offsetX: 42, offsetY: 58 };
const CHARACTER_SCALE = 2.7;

// ---------------------------------------------------------
// ESTADO GLOBAL DO JOGO
// ---------------------------------------------------------
const GameData = {
  playerName: "Empresário",
  selectedCharacter: CHARACTERS[0].id,
  lives: MAX_LIVES,
  score: 0,
  phaseIndex: 0,
  infosSeen: new Set(),
  correctAnswers: 0,
  startTime: null,
  paused: false,
  sessionId: 0,
  hasEnded: false,
};

function resetGameData() {
  GameData.lives = MAX_LIVES;
  GameData.score = 0;
  GameData.phaseIndex = 0;
  GameData.infosSeen = new Set();
  GameData.correctAnswers = 0;
  GameData.startTime = Date.now();
  GameData.paused = false;
  GameData.sessionId += 1;
  GameData.hasEnded = false;
}

// ---------------------------------------------------------
// CONTEÚDO DAS FASES
// ---------------------------------------------------------
const PHASES = [
  {
    id: "fase1",
    name: "Padaria do Bairro",
    startX: 550,
    startDirection: "left",
    hasBoss: false,
    exitInitiallyOpen: false,
    showExitArrow: true,
    exitDirection: "backward",
    phaseNumber: 1,
    phaseLabel: "Prólogo",
    skyColor: 0x18233d,
    groundColor: 0x2c3350,
    decorColor: 0x22304f,
    levelWidth: 960,
    bg: "padaria_bg.jpg",
    doorX: 70,
    groundY: 490,
    characterScale: 3.2,
    infoSpots: [
      {
        x: 380,
        y: 220,
        text: "O caderninho de fiado somou R$ 800 este mês. Sem data de pagamento, esse dinheiro não existe no caixa.",
      },
    ],
  },
  {
    id: "fase2",
    name: "A Rua Comercial",
    startX: 330,
    startDirection: "right",
    hasBoss: true,
    exitInitiallyOpen: false,
    showExitArrow: true,
    exitDirection: "forward",
    phaseNumber: 2,
    phaseLabel: "Ato 2",
    skyColor: 0x0a0f1c,
    groundColor: 0x1f2438,
    decorColor: 0x161a2b,
    levelWidth: 1990,
    bg: "street_night_bg.jpg",
    bossX: 1850,
    bossY: 485,
    doorX: 1850,
    groundY: 485,
    characterScale: 2.0,
    infoSpots: [
      {
        x: 675,
        y: 320,
        text: "Não misture o dinheiro do dono com o da empresa: o caixa do comércio não é sua carteira pessoal!",
      },
      {
        x: 1045,
        y: 320,
        text: "Despesa fixa você paga vendendo ou não. Já a variável só aumenta quando as vendas aumentam.",
      },
      {
        x: 1355,
        y: 320,
        text: "Faturamento não é lucro: ver dinheiro entrando não adianta se nada sobrar após pagar as contas.",
      },
    ],
    boss: {
      name: "Empreendedor Veterano",
      portrait: {
        idle: "boss1_idle.png",
        talk: "boss1_talk.png",
        blink: "boss1_blink.png",
      },
      portraitHeight: 170,
      dialogueBottom: 200,
      greeting:
        "Te vi fechando a padaria preocupado. Quase quebrei misturando as contas. Vamos ver se você domina o básico:",
      introLines: [
        "Primeiro ponto essencial:",
        "Próxima questão:",
        "Última pergunta:",
      ],
      correctLines: [
        "Exato! Esse é o caminho.",
        "Na mosca! Boa visão.",
        "Perfeito! Raciocínio afiado.",
      ],
      wrongLines: [
        "Cuidado! Esse erro quebra empresas:",
        "Atenção: pense no caixa do dia a dia:",
        "Cuidado com essa armadilha:",
      ],
      resultMessages: {
        3: "Excelente! Mentalidade financeira afiada. Você está pronto para avançar.",
        2: "Muito bom! Mais um pouco de organização e você não terá surpresas no caixa.",
        1: "Bom começo, mas revise os conceitos para não se perder na prática.",
        0: "Sinal vermelho! Estude o básico antes que o caixa complique.",
      },
      questions: [
        {
          q: "Para que serve o fluxo de caixa?",
          options: [
            "Controlar funcionários",
            "Controlar entradas e saídas de dinheiro",
            "Fazer propaganda",
            "Calcular estoque",
          ],
          correct: 1,
          explanation:
            "O fluxo de caixa registra todo o dinheiro que realmente entra e sai diariamente da empresa.",
        },
        {
          q: "Para formar o preço de venda, é importante conhecer:",
          options: [
            "Apenas o concorrente",
            "Custos, despesas e margem desejada",
            "Apenas o custo do produto",
            "Apenas o valor que o cliente aceita",
          ],
          correct: 1,
          explanation:
            "O preço deve cobrir todos os custos e despesas e ainda garantir a margem de lucro.",
        },
        {
          q: "O que é lucro?",
          options: [
            "Tudo que a empresa vende",
            "Todo dinheiro que entra no caixa",
            "O resultado após descontar custos e despesas",
            "O dinheiro investido pelo dono",
          ],
          correct: 2,
          explanation:
            "Lucro é o valor líquido que sobra para a empresa após pagar todas as obrigações.",
        },
        {
          q: "O pró-labore é:",
          options: [
            "O faturamento",
            "A remuneração do sócio pelo trabalho",
            "O lucro da empresa",
            "Uma reserva de emergência",
          ],
          correct: 1,
          explanation:
            "Pró-labore é o salário fixo mensal do dono pelo trabalho executado no negócio.",
        },
        {
          q: "O controle financeiro deve ser feito:",
          options: [
            "Apenas quando faltar dinheiro",
            "Apenas no fim do ano",
            "Regularmente, para tomar boas decisões",
            "Só pelo contador",
          ],
          correct: 2,
          explanation:
            "Acompanhar o financeiro com frequência antecipa rombos no caixa e embasa decisões.",
        },
        {
          q: "Faturamento e lucro são a mesma coisa?",
          options: [
            "Sim, sempre",
            "Não. Lucro desconta custos e despesas do faturamento",
            "Sim, quando a venda é à vista",
            "Apenas para empresas sem funcionários",
          ],
          correct: 1,
          explanation:
            "Faturamento é o total vendido; lucro é apenas o que sobra após pagar as contas.",
        },
        {
          q: "O dinheiro da empresa deve ser separado do dinheiro pessoal?",
          options: [
            "Não, se o negócio for pequeno",
            "Apenas quando houver funcionários",
            "Sim, para organizar e conhecer as finanças",
            "Apenas para empresas grandes",
          ],
          correct: 2,
          explanation:
            "Misturar finanças pessoais com as da empresa mascara prejuízos e drena o caixa.",
        },
        {
          q: "Qual destes é um exemplo de despesa fixa?",
          options: [
            "Comissão sobre vendas",
            "Taxa da maquininha por venda",
            "Aluguel do estabelecimento",
            "Embalagem utilizada",
          ],
          correct: 2,
          explanation:
            "O aluguel vence todo mês, mesmo se a empresa não realizar nenhuma venda.",
        },
        {
          q: "O que é uma despesa variável?",
          options: [
            "Uma despesa que varia conforme as vendas",
            "Uma despesa paga uma vez por ano",
            "Uma retirada do proprietário",
            "Uma conta que nunca muda",
          ],
          correct: 0,
          explanation:
            "Custos com insumos, embalagens e taxas variam diretamente conforme as vendas.",
        },
        {
          q: "Registrar todas as entradas e saídas ajuda a empresa a:",
          options: [
            "Pagar menos impostos",
            "Tomar decisões com informações seguras",
            "Eliminar todos os custos",
            "Não precisar de planejamento",
          ],
          correct: 1,
          explanation:
            "Registros precisos mostram onde cortar gastos e evitam surpresas no final do mês.",
        },
      ],
    },
  },
  {
    id: "fase3",
    name: "A Chegada ao Sebrae",
    startX: 80,
    startDirection: "right",
    hasBoss: true,
    exitInitiallyOpen: false,
    showExitArrow: true,
    exitDirection: "forward",
    phaseNumber: 3,
    phaseLabel: "Ato 3",
    skyColor: 0x5a8fb2,
    groundColor: 0x8a95a5,
    decorColor: 0x4a5d73,
    levelWidth: 1990,
    bg: "street_day_bg.jpg",
    bossX: 1650,
    bossY: 485,
    doorX: 1650,
    groundY: 520,
    characterScale: 2.4,
    infoSpots: [
      {
        x: 440,
        y: 330,
        text: "Capital de Giro é o oxigênio da empresa: dinheiro necessário para manter as portas abertas até as vendas entrarem na conta.",
      },
      {
        x: 755,
        y: 330,
        text: "Cuidado com descontos: baixar o preço sem calcular a margem de lucro faz você pagar para trabalhar.",
      },
      {
        x: 1075,
        y: 340,
        text: "Comprar à vista e vender a prazo é perigoso: esse descompasso pode secar o caixa rapidamente.",
      },
    ],
    boss: {
      name: "Analista Financeiro",
      portrait: {
        idle: "boss2_idle.png",
        talk: "boss2_talk.png",
        blink: "boss2_blink.png",
      },
      portraitHeight: 200,
      dialogueBottom: 240,
      greeting:
        "Olá! Sou analista no Sebrae. Antes de entrarmos para usar o Finanças na Mão, vamos testar o controle do seu negócio:",
      introLines: [
        "Primeiro teste de controle:",
        "Aprofundando a gestão:",
        "Última pergunta antes de entrarmos:",
      ],
      correctLines: [
        "Isso! Domínio claro do caixa.",
        "Correto! Visão de gestor.",
        "Perfeito! Raciocínio preciso.",
      ],
      wrongLines: [
        "Atenção: isso drena o caixa:",
        "Não exatamente. Veja o detalhe:",
        "Cuidado com essa armadilha financeira:",
      ],
      resultMessages: {
        3: "Excelente! Conceitos dominados. O Finanças na Mão vai potencializar sua gestão!",
        2: "Muito bom! Base sólida, faltando apenas alinhar detalhes no dia a dia.",
        1: "Você tem noções básicas, mas o controle ainda escapa. O Sebrae vai te ajudar.",
        0: "Alerta vermelho! Ajustes urgentes são necessários para estancar perdas no caixa.",
      },
      questions: [
        {
          q: "Uma empresa vende muito, mas constantemente falta dinheiro. O que deve analisar primeiro?",
          options: ["Logomarca", "Fluxo de caixa", "Redes sociais", "Fachada"],
          correct: 1,
          explanation:
            "Faturamento alto não garante saldo: o Fluxo de Caixa revela onde o dinheiro está vazando.",
        },
        {
          q: "Você quer dar 20% de desconto em um produto. Antes disso, precisa saber:",
          options: [
            "Se o concorrente também dará desconto",
            "Se sua margem suporta esse desconto",
            "Se o cliente compra à vista",
            "Quanto tem na conta",
          ],
          correct: 1,
          explanation:
            "Desconto reduz seu lucro direto: confira antes se sua margem suporta a redução.",
        },
        {
          q: "O que é capital de giro?",
          options: [
            "Dinheiro para manter a operação da empresa",
            "O lucro anual da empresa",
            "Um tipo de imposto",
            "O patrimônio pessoal do dono",
          ],
          correct: 0,
          explanation:
            "É a reserva necessária para pagar contas diárias enquanto os recebimentos a prazo não caem.",
        },
        {
          q: "Uma retirada pessoal frequente e sem controle pode acarretar em:",
          options: [
            "Melhorar o caixa",
            "Comprometer as finanças da empresa",
            "Aumentar a margem",
            "Reduzir os custos",
          ],
          correct: 1,
          explanation:
            "Retiradas sem controle reduzem o capital de giro e deixam a empresa sem liquidez.",
        },
        {
          q: "As taxas cobradas pelas maquininhas de cartão são iguais para todas as empresas?",
          options: [
            "Sim, as taxas são padronizadas",
            "Sim, mudam apenas conforme o banco",
            "Não. Variam conforme operadora, modalidade e negociação",
            "Não, mas variam apenas pelo faturamento",
          ],
          correct: 2,
          explanation:
            "As taxas variam por operadora e plano; negociar reduz despesas e protege a margem.",
        },
        {
          q: "Sua empresa vende a prazo, mas paga fornecedores à vista. Qual ponto merece atenção?",
          options: [
            "O prazo entre pagamentos e recebimentos",
            "A quantidade de seguidores",
            "A logomarca",
            "O tamanho do estoque",
          ],
          correct: 0,
          explanation:
            "Pagar antes de receber exige alto capital de giro para não entrar no vermelho.",
        },
        {
          q: "Um produto vende bastante, mas você não sabe se ele dá lucro. O que precisa conhecer?",
          options: [
            "Apenas a quantidade vendida",
            "Seus custos, despesas, preço e margem",
            "Apenas o preço do concorrente",
            "O saldo da conta bancária",
          ],
          correct: 1,
          explanation:
            "Volume alto não garante lucro: é essencial conhecer custos e margens de cada item.",
        },
        {
          q: "Antes de fazer uma compra grande para o estoque, o empreendedor deve avaliar:",
          options: [
            "Apenas o desconto oferecido",
            "A necessidade da compra e seu impacto no caixa",
            "Apenas o preço do fornecedor",
            "O número de clientes cadastrados",
          ],
          correct: 1,
          explanation:
            "Estoque parado é dinheiro travado; avalie o impacto das parcelas no fluxo de caixa.",
        },
        {
          q: "Um cliente compra hoje no cartão e você recebe depois. Esse prazo deve ser considerado em qual controle?",
          options: [
            "Fluxo de caixa",
            "Controle de funcionários",
            "Plano de marketing",
            "Cadastro de clientes",
          ],
          correct: 0,
          explanation:
            "O fluxo de caixa deve prever a data exata em que o dinheiro realmente entrará na conta.",
        },
        {
          q: "Se os custos aumentam e o preço de venda continua igual, o que tende a acontecer?",
          options: [
            "A margem aumenta",
            "A margem diminui",
            "O faturamento dobra",
            "O lucro aumenta automaticamente",
          ],
          correct: 1,
          explanation:
            "Se os custos sobem e o preço permanece, a diferença reduz diretamente o lucro.",
        },
      ],
    },
  },
  {
    id: "fase4",
    name: "Consultoria Final",
    startX: 140,
    startDirection: "right",
    hasBoss: false,
    exitInitiallyOpen: true,
    showExitArrow: true,
    phaseNumber: 4,
    phaseLabel: "Ato Final",
    skyColor: 0x18233d,
    groundColor: 0x2c3350,
    decorColor: 0x22304f,
    levelWidth: 1990,
    bg: "sebrae_bg.jpg",
    doorX: 1770,
    groundY: 495,
    characterScale: 3.6,
    infoSpots: [
      {
        x: 400,
        y: 210,
        text: "Bem-vindo ao Sebrae Alto Oeste!",
      },
      {
        x: 960,
        y: 235,
        text: "Margem de Contribuição: é o que sobra da venda, após custos variáveis, para pagar as contas fixas.",
      },
      {
        x: 1320,
        y: 235,
        text: "Projeção é tudo: se faltará caixa no mês, antecipe-se e planeje com o Fluxo de Caixa!",
      },
    ],
  },
  {
    id: "fase5",
    name: "Sala do Chefe",
    startX: 80,
    startDirection: "right",
    hasBoss: true,
    exitInitiallyOpen: false,
    showExitArrow: false,
    phaseNumber: 5,
    phaseLabel: "Ato Final",
    skyColor: 0x18233d,
    groundColor: 0x2c3350,
    decorColor: 0x22304f,
    levelWidth: 1200,
    bg: "sala_chefe_bg.jpg",
    bossX: 700,
    bossY: 515,
    doorX: 1770,
    groundY: 495,
    characterScale: 4.0,
    infoSpots: [],
    boss: {
      name: "Consultor Chefe",
      portrait: {
        idle: "boss3_idle.png",
        talk: "boss3_talk.png",
        blink: "boss3_blink.png",
      },
      portraitHeight: 330,
      dialogueBottom: 330,
      greeting:
        "Bem-vindo ao Sebrae! Sou Franciel Monte. Vamos ao teste final para dominar o Finanças na Mão de vez!",
      merchanText:
        "Avaliação concluída! Hora de automatizar seu controle: aponte a câmera e conheça o Finanças na Mão:",
      qrCode: {
        image: "assets/images/qrcode_financas_na_mao.png",
        duration: 25,
        title: "Automatize sua Gestão!",
        text: "Aponte a câmera e conheça a solução Finanças na Mão do Sebrae:",
      },
      introLines: [
        "Primeiro teste avançado:",
        "Próxima questão:",
        "Última pergunta decisiva:",
      ],
      correctLines: [
        "Excelente! Conceito afiado.",
        "Exato! Pensamento de longo prazo.",
        "Perfeito! Domínio total.",
      ],
      wrongLines: [
        "Atenção a este detalhe:",
        "Não foi bem isso, veja a regra:",
        "Cuidado com essa armadilha:",
      ],
      resultMessages: {
        3: "Brilhante! Você está pronto para gerir as finanças do seu negócio com segurança.",
        2: "Muito bom! Com a nossa plataforma, pequenas dúvidas sumirão rápido.",
        1: "Há um caminho a percorrer, mas o Sebrae está aqui para apoiar sua gestão.",
        0: "Foi ótimo vir ao Sebrae. Vamos reestruturar sua gestão do zero!",
      },
      questions: [
        {
          q: "A DRE (Demonstração do Resultado do Exercício) ajuda principalmente a saber:",
          options: [
            "Se a empresa teve lucro ou prejuízo",
            "Quantos clientes compraram",
            "Quanto existe no estoque",
            "Qual funcionário vendeu mais",
          ],
          correct: 0,
          explanation:
            "A DRE confronta receitas e despesas para apurar se houve lucro ou prejuízo real.",
        },
        {
          q: "Você faturou R$ 30 mil no mês. Quanto sua empresa realmente ganhou?",
          options: [
            "R$ 30 mil",
            "O saldo que ficou na conta",
            "Só é possível saber após considerar custos e despesas",
            "Tudo que foi recebido à vista",
          ],
          correct: 2,
          explanation:
            "Faturamento é apenas o total recebido; lucro é o que sobra após pagar custos e despesas.",
        },
        {
          q: "Você olha o saldo da conta para saber se a empresa está indo bem. Isso é suficiente?",
          options: [
            "Sim, demonstra saúde financeira",
            "Sim, se não houver dívidas passadas",
            "Não, é preciso acompanhar receitas, custos e despesas",
            "Sim, mas apenas para o MEI",
          ],
          correct: 2,
          explanation:
            "Saldo positivo hoje não prevê contas, tributos e dívidas dos próximos dias.",
        },
        {
          q: "O caixa está positivo hoje, mas há muitas contas vencendo nos próximos dias. Qual informação é mais importante?",
          options: [
            "O saldo atual apenas",
            "A projeção do fluxo de caixa",
            "A quantidade de seguidores nas redes",
            "O faturamento do ano passado",
          ],
          correct: 1,
          explanation:
            "A projeção do fluxo de caixa antecipa se haverá dinheiro suficiente para honrar as contas.",
        },
        {
          q: "O que é ticket médio?",
          options: [
            "O total de vendas do mês",
            "O valor médio gasto por cliente em uma compra",
            "O lucro médio da empresa",
            "O preço do produto mais vendido",
          ],
          correct: 1,
          explanation:
            "É o valor médio gasto por cliente a cada compra realizada na empresa.",
        },
        {
          q: "Sua empresa aumentou o faturamento, mas o lucro caiu. Isso é possível?",
          options: [
            "Não, faturamento maior é igual a lucro maior",
            "Sim, se custos e despesas crescerem mais que as receitas",
            "Apenas quando as vendas são pagas à vista",
            "Somente quando a empresa pega empréstimos",
          ],
          correct: 1,
          explanation:
            "Se os custos crescerem mais rápido que as vendas, a margem encolhe e o lucro cai.",
        },
        {
          q: "Sua DRE mostra lucro, mas falta dinheiro no caixa. Uma possível causa é:",
          options: [
            "Muitas vendas a prazo ainda não recebidas",
            "Ter uma conta bancária de Pessoa Jurídica",
            "Controlar muito bem as despesas fixas",
            "Ter produtos em promoção no estoque",
          ],
          correct: 0,
          explanation:
            "Vendas a prazo registram lucro contábil na hora, mas o dinheiro demora a entrar no caixa.",
        },
        {
          q: "Dois produtos têm o mesmo preço de venda, mas custos diferentes. Eles geram a mesma margem?",
          options: [
            "Sim, porque o preço para o cliente é igual",
            "Não. O produto com menor custo tende a gerar maior margem",
            "Sim, se forem vendidos e entregues no mesmo dia",
            "Depende exclusivamente do faturamento geral",
          ],
          correct: 1,
          explanation:
            "Produtos com menor custo e mesmo preço de venda geram margens de lucro maiores.",
        },
        {
          q: "A empresa tem R$ 8 mil para receber e R$ 12 mil para pagar no mesmo período. O que isso indica?",
          options: [
            "Uma sobra de caixa de R$ 4 mil",
            "Uma necessidade de caixa de R$ 4 mil",
            "Um lucro de R$ 20 mil",
            "Um faturamento de R$ 12 mil",
          ],
          correct: 1,
          explanation:
            "As saídas superam as entradas em R$ 4 mil, exigindo aporte de capital de giro.",
        },
        {
          q: "Qual indicador mostra quanto sobra das vendas após os custos e despesas variáveis para ajudar a pagar as despesas fixas?",
          options: [
            "Faturamento Bruto",
            "Ticket Médio",
            "Margem de Contribuição",
            "Saldo Bancário",
          ],
          correct: 2,
          explanation:
            "É o valor que sobra de cada venda para pagar os custos fixos e gerar lucro.",
        },
      ],
    },
  },
];

// ---------------------------------------------------------
// HELPERS GERAIS
// ---------------------------------------------------------
function pickRandom(arr, n) {
  const copy = [...arr];
  const result = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

function shuffleQuestion(question) {
  const items = question.options.map((text, index) => ({
    text,
    isCorrect: index === question.correct,
  }));
  for (let i = items.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [items[i], items[randomIndex]] = [items[randomIndex], items[i]];
  }
  return {
    ...question,
    options: items.map((item) => item.text),
    correct: items.findIndex((item) => item.isCorrect),
  };
}

function updateHUD() {
  const currentPhase = PHASES[GameData.phaseIndex];
  document.getElementById("hud-objective").textContent =
    currentPhase?.objectiveHint ?? "";
  document.getElementById("hud-lives").textContent =
    "❤️".repeat(Math.max(GameData.lives, 0)) || "💀";
  document.getElementById("score-value").textContent = GameData.score;
  if (!currentPhase) return;
  document.getElementById("phase-label").textContent =
    currentPhase.phaseLabel ??
    `Fase ${currentPhase.phaseNumber ?? GameData.phaseIndex + 1}`;
  document.getElementById("phase-name").textContent = currentPhase.name;
}

function updateMuraisCounter(phaseId, total) {
  let count = 0;
  GameData.infosSeen.forEach((id) => {
    if (id.startsWith(`${phaseId}_`)) count += 1;
  });
  document.getElementById("hud-murais-count").textContent = count;
  document.getElementById("hud-murais-total").textContent = total;
}

function loadRanking() {
  try {
    return JSON.parse(localStorage.getItem(RANKING_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveRankingEntry(name, score, elapsedSeconds) {
  const ranking = loadRanking();
  ranking.push({
    name: name || "Anônimo",
    score,
    time: elapsedSeconds,
    date: new Date().toLocaleDateString("pt-BR"),
  });
  ranking.sort((a, b) => b.score - a.score);
  const top10 = ranking.slice(0, 10);
  localStorage.setItem(RANKING_KEY, JSON.stringify(top10));
  return top10;
}

function renderRankingInto(elId) {
  const list = loadRanking();
  const el = document.getElementById(elId);
  if (list.length === 0) {
    el.innerHTML = "<p>Ninguém no ranking ainda. Seja o primeiro!</p>";
    return;
  }
  const items = list
    .map(
      (r) =>
        `<li>${escapeHtml(r.name)} — ${r.score} pts (${r.time}s) — ${r.date}</li>`,
    )
    .join("");
  el.innerHTML = `<ol>${items}</ol>`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------------------------------------------------------
// FÓRMULA DE PONTUAÇÃO
// ---------------------------------------------------------
function computeFinalScore() {
  const livesBonus = GameData.lives * 50;
  return GameData.score + livesBonus;
}

function formatMessageForScore(score) {
  if (score >= 1000)
    return "Excelente empresário! Você domina os conceitos essenciais da gestão.";
  if (score >= 700)
    return "Muito bom! Você já entende bastante, mas ainda pode evoluir.";
  return "Você deu o primeiro passo. Vale a pena revisar alguns conceitos com calma.";
}

// ---------------------------------------------------------
// SISTEMA DE INPUT
// ---------------------------------------------------------
class KeyboardInputProvider {
  constructor(scene) {
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys({ A: "A", D: "D" });
  }
  isLeft() {
    return this.cursors.left.isDown || this.keys.A.isDown;
  }
  isRight() {
    return this.cursors.right.isDown || this.keys.D.isDown;
  }
}
class TouchInputProvider {
  constructor() {
    this.leftDown = false;
    this.rightDown = false;
    const bind = (el, setter) => {
      if (!el) return;
      const start = (e) => {
        e.preventDefault();
        setter(true);
      };
      const end = (e) => {
        e.preventDefault();
        setter(false);
      };
      el.addEventListener("touchstart", start, { passive: false });
      el.addEventListener("touchend", end);
      el.addEventListener("touchcancel", end);
      el.addEventListener("mousedown", start);
      el.addEventListener("mouseup", end);
      el.addEventListener("mouseleave", end);
    };
    bind(document.getElementById("btn-left"), (v) => {
      this.leftDown = v;
    });
    bind(document.getElementById("btn-right"), (v) => {
      this.rightDown = v;
    });
  }
  isLeft() {
    return this.leftDown;
  }
  isRight() {
    return this.rightDown;
  }
}

const touchInput = new TouchInputProvider();

class InputManager {
  constructor(scene) {
    this.providers = [new KeyboardInputProvider(scene), touchInput];
    this.enabled = true;
  }
  setEnabled(v) {
    this.enabled = v;
  }
  left() {
    return this.enabled && this.providers.some((p) => p.isLeft());
  }
  right() {
    return this.enabled && this.providers.some((p) => p.isRight());
  }
}

// ---------------------------------------------------------
// PIXEL ART
// ---------------------------------------------------------
function drawPixelTexture(scene, key, rows, palette, pixelSize) {
  if (scene.textures.exists(key)) return;
  const height = rows.length;
  const width = rows[0].length;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const ch = rows[y][x];
      if (ch === "." || palette[ch] === undefined) continue;
      g.fillStyle(palette[ch], 1);
      g.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    }
  }
  g.generateTexture(key, width * pixelSize, height * pixelSize);
  g.destroy();
}

const BOSS_PALETTE = { R: THEME.danger, K: 0x1a1a1a, G: 0x555555 };
const BOSS_FRAME = [
  "..RRRRRRRRRR..",
  ".RRRRRRRRRRRR.",
  "RRRRKKKKKKRRRR",
  "RRRRK....KRRRR",
  "RRRRKKKKKKRRRR",
  ".RRRRRRRRRRRR.",
  ".RRRRRRRRRRRR.",
  "..RRRRRRRRRR..",
  "...GGGGGGGG...",
  "...GGGGGGGG...",
  "...GGGGGGGG...",
  "...GG....GG...",
  "...GG....GG...",
  "...GG....GG...",
];

const POSTER_FRAME = [
  "............",
  "...BBBBBB...",
  "..BWWWWWWB..",
  ".BWWWWWWWWB.",
  ".BWWDWDWDWB.",
  ".BWWWWWWWWB.",
  "..BWWWWWWB..",
  "...BBBBBB...",
  ".....BB.....",
  "....BB......",
];

const POSTER_PALETTE = {
  B: 0xf5f0e6,
  W: 0xf5f0e6,
  D: 0x14213d,
};

const DOOR_PALETTE = { F: 0x8a5a2b, D: 0x6b4423, K: THEME.accent };
const DOOR_FRAME = [
  "FFFFFFFFFF",
  "FDDDDDDDDF",
  "FDDDDDDDDF",
  "FDDDDDDDDF",
  "FDDDDDDDDF",
  "FDDDDDDDDF",
  "FDDDDKDDDF",
  "FDDDDDDDDF",
  "FDDDDDDDDF",
  "FDDDDDDDDF",
  "FDDDDDDDDF",
  "FFFFFFFFFF",
];

function buildAllTextures(scene) {
  const PS = 4;
  drawPixelTexture(scene, "bossTex", BOSS_FRAME, BOSS_PALETTE, PS);
  drawPixelTexture(scene, "posterTex", POSTER_FRAME, POSTER_PALETTE, PS);
  drawPixelTexture(scene, "doorTex", DOOR_FRAME, DOOR_PALETTE, PS);

  if (!scene.textures.exists("ground")) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(THEME.primary, 1);
    g.fillRect(0, 0, 64, 64);
    g.lineStyle(2, THEME.primaryDark, 1);
    g.strokeRect(0, 0, 64, 64);
    g.generateTexture("ground", 64, 64);
    g.destroy();
  }
}

// ---------------------------------------------------------
// TELA DE FIM DE JOGO
// ---------------------------------------------------------
// ---------------------------------------------------------
// TELA DE FIM DE JOGO
// ---------------------------------------------------------
function endGame(won) {
  if (GameData.hasEnded) return;
  GameData.hasEnded = true;

  // Apenas silencia a música de fundo imediatamente
  stopSfx(SFX.bgm);

  const elapsedSeconds = Math.floor((Date.now() - GameData.startTime) / 1000);
  const finalScore = computeFinalScore();

  saveRankingEntry(GameData.playerName, finalScore, elapsedSeconds);

  // Esta função só será chamada DEPOIS do QR Code (se houver)
  const showGameOverScreen = () => {
    // ÁUDIOS E EFEITOS AGORA DISPARAM AQUI
    if (won) {
      playSfx(SFX.victory);
      if (typeof confetti === "function") {
        confetti({
          particleCount: 250,
          spread: 120,
          origin: { y: 0.5 },
          zIndex: 99999,
        });
      }
    } else {
      playSfx(SFX.gameover); // O som triste só toca quando essa tela aparecer!
    }

    // Mostra a interface
    document.getElementById("end-overlay").classList.remove("hidden");
    document.getElementById("end-title").textContent = won
      ? "🏆 Parabéns!"
      : "Game Over";
    document.getElementById("end-message").textContent = won
      ? "Você completou as quatro fases e agora conhece melhor os desafios da gestão empresarial!"
      : "Você ficou sem vidas no meio da jornada. Que tal tentar de novo?";

    document.getElementById("end-score").innerHTML = `
      Respostas corretas: ${GameData.correctAnswers}<br/>
      Vidas restantes: ${GameData.lives}<br/>
      Tempo total: ${elapsedSeconds}s<br/>
      Murais lidos (curiosidade, não pontua): ${GameData.infosSeen.size}<br/>
      <strong>Pontuação final: ${finalScore}</strong><br/>
      ${formatMessageForScore(finalScore)}
    `;
  };

  // Lógica de exibição: Se perdeu, exibe o QR Code primeiro e CHAMA a tela (com o som) depois.
  if (!won) {
    showQRCodeModal(
      {
        image: "assets/images/qrcode_financas_na_mao.png",
        duration: 30,
        title: "Não desista do seu negócio!",
        text: "Quer dominar a gestão do seu caixa e parar de perder dinheiro? Aponte a câmera e conheça a solução Finanças na Mão do Sebrae:",
      },
      () => {
        showGameOverScreen();
      },
    );
  } else {
    // Se ganhou, o QR code já passou lá no diálogo do boss, então vai direto pra tela final
    showGameOverScreen();
  }
}

// ---------------------------------------------------------
// BATALHA DE BOSS
// ---------------------------------------------------------
function positionBossDialogue(scene, bossSprite) {
  const bounds = bossSprite.getBounds();
  const scrollX = scene.cameras.main.scrollX;
  let screenX = bounds.centerX - scrollX;
  screenX = Math.min(Math.max(screenX, 170), 960 - 170);

  const dialogueEl = document.getElementById("boss-dialogue");
  dialogueEl.style.left = `${screenX}px`;

  const manualBottom = scene.config?.boss?.dialogueBottom;
  if (manualBottom !== undefined) {
    dialogueEl.style.bottom = `${manualBottom}px`;
  } else {
    const screenTopY = bounds.top;
    let bottom = 540 - screenTopY + 18;
    const boxHeight = dialogueEl.offsetHeight || 120;
    const minBottom = 160;
    const maxBottom = 540 - 60 - boxHeight;
    bottom = Math.min(Math.max(bottom, minBottom), maxBottom);
    dialogueEl.style.bottom = `${bottom}px`;
  }
}

const BOSS_INTRO_LINES = [
  "Vamos testar seus conhecimentos sobre isso!",
  "Aqui vai a próxima pergunta:",
  "Última pergunta, vamos lá:",
];
const BOSS_CORRECT_LINES = [
  "Isso mesmo! Mandou bem.",
  "Perfeito, é exatamente isso!",
  "Excelente resposta!",
];
const BOSS_WRONG_LINES = [
  "Não foi dessa vez.",
  "Quase! Deixa eu te explicar:",
  "Essa é traiçoeira, mas vamos entender:",
];
const TYPE_SPEED_MS = 40;
const INFO_TYPE_SPEED_MS = 35;

function pickLine(list, index) {
  return list[Math.min(index, list.length - 1)];
}

function startBossBattle(scene, phaseConfig, bossSprite, onComplete) {
  const mySession = GameData.sessionId;
  GameData.paused = true;
  scene.physics.pause();
  scene.inputManager.setEnabled(false);

  positionBossDialogue(scene, bossSprite);

  const overlay = document.getElementById("boss-overlay");
  const nameEl = document.getElementById("boss-name");
  const headerEl = document.getElementById("dialogue-header");
  const questionEl = document.getElementById("question-text");
  const answersPanelEl = document.getElementById("boss-answers-panel");
  const optionsEl = document.getElementById("question-options");

  overlay.classList.remove("hidden");
  nameEl.textContent = ` ${phaseConfig.boss.name}`;

  const questions = pickRandom(phaseConfig.boss.questions, 3).map((question) =>
    shuffleQuestion(question),
  );
  let qIndex = 0;
  let battleCorrectCount = 0;
  let timeLeft = ANSWER_SECONDS;
  let timerInterval = null;
  let typeInterval = null;
  let tickPlayedThisQuestion = false;
  const typeState = { instant: false };

  function isStale() {
    return mySession !== GameData.sessionId;
  }

  function typeText(text, onDone) {
    clearInterval(typeInterval);
    questionEl.textContent = "";
    headerEl.textContent = "";
    typeState.instant = false;
    scene.startBossTalkAnim?.();

    let i = 0;
    typeInterval = setInterval(() => {
      if (isStale()) {
        clearInterval(typeInterval);
        scene.stopBossTalkAnim?.();
        return;
      }
      const pauseModal = document.getElementById("pause-modal");
      if (pauseModal && !pauseModal.classList.contains("hidden")) {
        scene.stopBossTalkAnim?.();
        return;
      } else {
        scene.startBossTalkAnim?.();
      }

      if (typeState.instant) {
        questionEl.textContent = text;
        positionBossDialogue(scene, bossSprite);
        clearInterval(typeInterval);
        scene.stopBossTalkAnim?.();
        if (onDone) onDone();
        return;
      }

      i += 1;
      questionEl.textContent = text.slice(0, i);
      playSfx(SFX.type);
      positionBossDialogue(scene, bossSprite);

      if (i >= text.length) {
        clearInterval(typeInterval);
        scene.stopBossTalkAnim?.();
        if (onDone) onDone();
      }
    }, TYPE_SPEED_MS);
  }

  questionEl.onclick = () => {
    typeState.instant = true;
  };

  function playIntroThenQuestion(index) {
    if (isStale()) return;
    answersPanelEl.classList.add("hidden");
    const q = questions[index];
    const introLines = phaseConfig.boss.introLines || BOSS_INTRO_LINES;
    typeText(pickLine(introLines, index), () => {
      if (isStale()) return;
      setTimeout(() => {
        if (isStale()) return;
        typeText(q.q, () => revealOptions(q));
      }, 900);
    });
  }

  function revealOptions(q) {
    if (isStale()) return;
    answersPanelEl.classList.remove("hidden");
    optionsEl.innerHTML = "";

    q.options.forEach((optText, idx) => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = optText;
      btn.onclick = () => {
        if (isStale()) return;
        clearInterval(timerInterval);
        resolveAnswer(idx, q);
      };
      optionsEl.appendChild(btn);
    });

    timeLeft = ANSWER_SECONDS;
    tickPlayedThisQuestion = false;
    headerEl.textContent = `⏱ ${timeLeft}s`;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (isStale()) {
        clearInterval(timerInterval);
        return;
      }
      const pauseModal = document.getElementById("pause-modal");
      if (pauseModal && !pauseModal.classList.contains("hidden")) return;

      timeLeft -= 1;
      headerEl.textContent = `⏱ ${timeLeft}s`;

      if (timeLeft === 5 && !tickPlayedThisQuestion) {
        tickPlayedThisQuestion = true;
        playSfx(SFX.tick);
      }
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        resolveAnswer(null, q);
      }
    }, 1000);
  }

  function resolveAnswer(chosenIdx, q) {
    if (isStale()) return;
    stopSfx(SFX.tick);
    const timedOut = chosenIdx === null;
    const isCorrect = !timedOut && chosenIdx === q.correct;
    answersPanelEl.classList.add("hidden");

    if (isCorrect) {
      GameData.correctAnswers += 1;
      battleCorrectCount += 1;
      const BASE_POINTS = 60;
      const MAX_SPEED_BONUS = 40;
      const speedBonus = Math.round(
        (timeLeft / ANSWER_SECONDS) * MAX_SPEED_BONUS,
      );
      GameData.score += BASE_POINTS + speedBonus;
    } else {
      GameData.lives -= 1;
    }
    updateHUD();

    const correctLines = phaseConfig.boss.correctLines || BOSS_CORRECT_LINES;
    const wrongLines = phaseConfig.boss.wrongLines || BOSS_WRONG_LINES;

    let resultText;
    if (isCorrect) {
      resultText = pickLine(correctLines, qIndex);
    } else if (timedOut) {
      resultText = `O tempo acabou! Essa questão foi considerada incorreta. ${q.explanation}`;
    } else {
      resultText = `${pickLine(wrongLines, qIndex)} ${q.explanation}`;
    }

    typeText(resultText, () => {
      if (isStale()) return;
      const waitTime = isCorrect ? 1200 : 2400;
      setTimeout(() => {
        if (isStale()) return;
        qIndex += 1;
        if (GameData.lives <= 0) {
          overlay.classList.add("hidden");
          finishBossUI({ keepGamePaused: true });
          endGame(false);
          return;
        }
        if (qIndex < questions.length) {
          playIntroThenQuestion(qIndex);
        } else {
          finishBattleWithResult();
        }
      }, waitTime);
    });
  }

  function finishBattleWithResult() {
    const msg = phaseConfig.boss.resultMessages?.[battleCorrectCount];
    const proceedToMerchanOrFinish = () => {
      if (phaseConfig.boss.merchanText && phaseConfig.boss.qrCode) {
        typeText(phaseConfig.boss.merchanText, () => {
          setTimeout(() => {
            if (isStale()) return;
            overlay.classList.add("hidden");
            showQRCodeModal(phaseConfig.boss.qrCode, () => {
              finishBossUI();
              onComplete();
            });
          }, 1600);
        });
      } else {
        overlay.classList.add("hidden");
        finishBossUI();
        onComplete();
      }
    };
    if (msg) {
      typeText(msg, () => {
        setTimeout(() => {
          if (isStale()) return;
          proceedToMerchanOrFinish();
        }, 1800);
      });
    } else {
      proceedToMerchanOrFinish();
    }
  }

  function finishBossUI({ keepGamePaused = false } = {}) {
    clearInterval(timerInterval);
    clearInterval(typeInterval);
    questionEl.onclick = null;
    if (!keepGamePaused) {
      GameData.paused = false;
      scene.physics.resume();
      scene.inputManager.setEnabled(true);
    }
  }

  if (phaseConfig.boss.greeting) {
    typeText(phaseConfig.boss.greeting, () => {
      setTimeout(() => playIntroThenQuestion(qIndex), 900);
    });
  } else {
    playIntroThenQuestion(qIndex);
  }
}

// ---------------------------------------------------------
// BALÃO DE INFORMAÇÃO DOS NPCS
// ---------------------------------------------------------
let activeInfoId = null;
let infoTypeInterval = null;

function typeInfoText(element, text) {
  clearInterval(infoTypeInterval);
  element.textContent = "";
  let charIndex = 0;
  infoTypeInterval = setInterval(() => {
    const pauseModal = document.getElementById("pause-modal");
    if (pauseModal && !pauseModal.classList.contains("hidden")) {
      return;
    }
    charIndex += 1;
    element.textContent = text.slice(0, charIndex);
    playSfx(SFX.type);
    if (charIndex >= text.length) {
      clearInterval(infoTypeInterval);
      infoTypeInterval = null;
    }
  }, INFO_TYPE_SPEED_MS);
}

function animateInfoBubbleOpening(bubble) {
  bubble.classList.remove("info-bubble-opening");
  void bubble.offsetWidth;
  bubble.classList.add("info-bubble-opening");
}

function positionInfoBubble(scene, spot) {
  const bubble = document.getElementById("info-bubble");
  const camera = scene.cameras.main;
  let screenX = spot.x - camera.scrollX;
  let screenY = (spot.y ?? 300) - camera.scrollY;
  const halfBubbleWidth = 165;
  screenX = Phaser.Math.Clamp(screenX, halfBubbleWidth, 960 - halfBubbleWidth);
  screenY = Math.max(screenY, 115);
  bubble.style.left = `${screenX}px`;
  bubble.style.top = `${screenY - 8}px`;
}

function updateInfoBubble(scene, playerX, infoSpots, phaseId, infoIcons) {
  if (scene.pinnedInfoUntil && Date.now() < scene.pinnedInfoUntil) {
    if (scene.pinnedSpot) positionInfoBubble(scene, scene.pinnedSpot);
    return;
  }
  scene.pinnedInfoUntil = null;
  scene.pinnedSpot = null;

  let nearest = null;
  let nearestDist = Infinity;

  infoSpots.forEach((spot, index) => {
    if (spot.once && scene.usedOnceSpots?.has(index)) return;
    const distance = Math.abs(playerX - spot.x);
    if (distance <= INFO_PROXIMITY_RADIUS && distance < nearestDist) {
      const text =
        spot.textAfterBoss && scene.doorOpen ? spot.textAfterBoss : spot.text;
      nearest = { id: `${phaseId}_${index}`, index, spot, text };
      nearestDist = distance;
    }
  });

  const bubble = document.getElementById("info-bubble");
  const content = bubble.querySelector(".info-bubble-content");

  if (nearest) {
    positionInfoBubble(scene, nearest.spot);
    if (activeInfoId !== nearest.id) {
      activeInfoId = nearest.id;
      GameData.infosSeen.add(nearest.id);
      updateMuraisCounter(phaseId, infoSpots.length);
      clearInterval(infoTypeInterval);

      if (infoIcons?.[nearest.index]) {
        infoIcons[nearest.index].setVisible(false);
      }
      if (nearest.spot.once) {
        scene.usedOnceSpots?.add(nearest.index);
        scene.pinnedInfoUntil = Date.now() + ONCE_BUBBLE_MIN_MS;
        scene.pinnedSpot = nearest.spot;
      }
      bubble.classList.remove("info-bubble-hidden");
      animateInfoBubbleOpening(bubble);
      typeInfoText(content, ` ${nearest.text}`);
    }
    return;
  }

  if (activeInfoId !== null) {
    const previousIndex = Number(activeInfoId.split("_").at(-1));
    const previousSpot = infoSpots[previousIndex];
    activeInfoId = null;
    clearInterval(infoTypeInterval);
    infoTypeInterval = null;
    bubble.classList.remove("info-bubble-opening");
    bubble.classList.add("info-bubble-hidden");
    setTimeout(() => {
      if (bubble.classList.contains("info-bubble-hidden"))
        content.textContent = "";
    }, 220);

    const staysHidden =
      previousSpot?.once && scene.usedOnceSpots?.has(previousIndex);
    if (infoIcons?.[previousIndex] && !staysHidden) {
      infoIcons[previousIndex].setVisible(true);
    }
  }
}

// ---------------------------------------------------------
// CENA PRINCIPAL DO PHASER
// ---------------------------------------------------------
function showPhaseIntro(phaseConfig, onComplete) {
  const intro = document.getElementById("phase-intro");
  const label = document.getElementById("phase-intro-label");
  const name = document.getElementById("phase-intro-name");
  label.textContent =
    phaseConfig.phaseLabel ?? `Fase ${phaseConfig.phaseNumber ?? ""}`;
  name.textContent = phaseConfig.name;
  intro.classList.remove("hidden", "phase-intro-visible");
  void intro.offsetWidth;
  intro.classList.add("phase-intro-visible");
  setTimeout(() => {
    intro.classList.add("hidden");
    intro.classList.remove("phase-intro-visible");
    if (onComplete) onComplete();
  }, 2600);
}

// ---------------------------------------------------------
// SISTEMA DO NARRADOR ANIMADO
// ---------------------------------------------------------
function chamarNarrador(cena, avatarKeys, audioKey, texto, onComplete) {
  const overlay = cena.add
    .rectangle(480, 270, 960, 540, 0x000000, 0.8)
    .setOrigin(0.5)
    .setDepth(100)
    .setScrollFactor(0)
    .setInteractive();
  const box = cena.add.graphics().setDepth(101).setScrollFactor(0);
  box.fillStyle(0x002b54, 1);
  box.lineStyle(4, 0xff8f00, 1);
  box.fillRoundedRect(230, 80, 500, 340, 16);
  box.strokeRoundedRect(230, 80, 500, 340, 16);

  const avatar = cena.add
    .image(480, 190, avatarKeys.idle)
    .setDepth(102)
    .setScrollFactor(0);
  const targetHeight = 165;
  const sourceImage = cena.textures.get(avatarKeys.idle).getSourceImage();
  if (sourceImage && sourceImage.height > 0) {
    const scale = targetHeight / sourceImage.height;
    avatar.setScale(scale);
  }

  const messageText = cena.add
    .text(480, 295, "", {
      fontSize: "20px",
      fontFamily: "Arial",
      color: "#F4F7F9",
      align: "center",
      wordWrap: { width: 420 },
    })
    .setOrigin(0.5, 0)
    .setDepth(102)
    .setScrollFactor(0);

  const hintText = cena.add
    .text(480, 385, "Clique para continuar ➡", {
      fontSize: "16px",
      fontStyle: "italic",
      color: "#FFB347",
    })
    .setOrigin(0.5, 0)
    .setDepth(102)
    .setScrollFactor(0)
    .setAlpha(0);

  let voice;
  if (audioKey && cena.cache.audio.exists(audioKey)) {
    voice = cena.sound.add(audioKey);
    voice.play();
  }

  const isMultiFrame = avatarKeys.idle === "narrador_idle";
  const talkSequence = isMultiFrame
    ? [
        "narrador_idle",
        "narrador_talk_1",
        "narrador_talk_2",
        "narrador_talk_2",
        "narrador_talk_1",
      ]
    : [avatarKeys.idle, avatarKeys.talk || avatarKeys.idle];

  const blinkSequence = isMultiFrame
    ? ["narrador_blink_1", "narrador_blink_4", "narrador_blink_1"]
    : null;

  let isTalking = true;
  let talkIndex = 0;
  let isBlinking = false;
  let blinkIndex = 0;
  let tempoAtePiscar = Phaser.Math.Between(35, 70);
  const textoSeguro = texto || "";

  const animInterval = setInterval(() => {
    tempoAtePiscar--;
    if (isBlinking && blinkSequence) {
      avatar.setTexture(blinkSequence[blinkIndex]);
      blinkIndex++;
      if (blinkIndex >= blinkSequence.length) {
        isBlinking = false;
        blinkIndex = 0;
      }
      return;
    }
    if (tempoAtePiscar <= 0 && blinkSequence) {
      isBlinking = true;
      blinkIndex = 0;
      tempoAtePiscar = Phaser.Math.Between(25, 45);
      return;
    }
    if (isTalking) {
      avatar.setTexture(talkSequence[talkIndex]);
      talkIndex = (talkIndex + 1) % talkSequence.length;
    } else {
      avatar.setTexture(avatarKeys.idle);
    }
  }, 90);

  let charIndex = 0;
  let isTyping = true;
  const typeInterval = setInterval(() => {
    charIndex++;
    messageText.setText(textoSeguro.slice(0, charIndex));
    playSfx(SFX.type);

    if (charIndex >= textoSeguro.length) {
      clearInterval(typeInterval);
      isTyping = false;
      isTalking = false;
      avatar.setTexture(avatarKeys.idle);
      hintText.setAlpha(1);
    }
  }, 40);

  overlay.on("pointerdown", () => {
    if (isTyping) {
      clearInterval(typeInterval);
      messageText.setText(textoSeguro);
      isTyping = false;
      isTalking = false;
      avatar.setTexture(avatarKeys.idle);
      hintText.setAlpha(1);
    } else {
      clearInterval(animInterval);
      if (voice && voice.isPlaying) voice.stop();
      overlay.destroy();
      box.destroy();
      avatar.destroy();
      messageText.destroy();
      hintText.destroy();
      if (onComplete) onComplete();
    }
  });
}

// ---------------------------------------------------------
// CLASSE DAS FASES
// ---------------------------------------------------------
class PhaseScene extends Phaser.Scene {
  constructor() {
    super("PhaseScene");
  }

  init(data) {
    this.phaseIndex = data.phaseIndex || 0;
    this.config = PHASES[this.phaseIndex];
  }

  preload() {
    buildAllTextures(this);

    // Carregamento do Narrador transferido da antiga MapScene
    if (!this.textures.exists("narrador_idle")) {
      this.load.image(
        "narrador_idle",
        "assets/characters/narrador_blink_1.png",
      );
      this.load.image(
        "narrador_talk_1",
        "assets/characters/narrador_talk_1.png",
      );
      this.load.image(
        "narrador_talk_2",
        "assets/characters/narrador_talk_2.png",
      );
      this.load.image(
        "narrador_blink_1",
        "assets/characters/narrador_blink_1.png",
      );
      this.load.image(
        "narrador_blink_4",
        "assets/characters/narrador_blink_4.png",
      );
    }

    const cfg = this.config;
    const bgKey = `bg_${cfg.id}`;
    if (!this.textures.exists(bgKey)) {
      this.load.image(bgKey, `assets/backgrounds/${cfg.bg}`);
    }

    const hasBoss = cfg.hasBoss !== false && cfg.boss;
    if (hasBoss && cfg.boss.portrait) {
      const idleKey = `boss_${cfg.id}_idle`;
      const talkKey = `boss_${cfg.id}_talk`;
      const blinkKey = `boss_${cfg.id}_blink`;
      if (!this.textures.exists(idleKey)) {
        this.load.image(idleKey, `assets/bosses/${cfg.boss.portrait.idle}`);
        if (cfg.boss.portrait.talk)
          this.load.image(talkKey, `assets/bosses/${cfg.boss.portrait.talk}`);
        if (cfg.boss.portrait.blink)
          this.load.image(blinkKey, `assets/bosses/${cfg.boss.portrait.blink}`);
      }
    }

    const charId = GameData.selectedCharacter;
    if (!this.textures.exists(`char_${charId}_idle`)) {
      this.load.spritesheet(
        `char_${charId}_idle`,
        `assets/characters/${charId}/Idle.png`,
        {
          frameWidth: CHARACTER_FRAME_SIZE,
          frameHeight: CHARACTER_FRAME_SIZE,
        },
      );
      this.load.spritesheet(
        `char_${charId}_walk`,
        `assets/characters/${charId}/Walk.png`,
        {
          frameWidth: CHARACTER_FRAME_SIZE,
          frameHeight: CHARACTER_FRAME_SIZE,
        },
      );
    }
  }

  create() {
    document.getElementById("hud").style.display = "flex";
    document.getElementById("touch-controls").style.display = "flex";

    activeInfoId = null;
    clearInterval(infoTypeInterval);
    infoTypeInterval = null;
    const infoBubble = document.getElementById("info-bubble");
    infoBubble.classList.remove("hidden", "info-bubble-opening");
    infoBubble.classList.add("info-bubble-hidden");
    infoBubble.querySelector(".info-bubble-content").textContent = "";

    const cfg = this.config;
    this.cameras.main.setBackgroundColor(cfg.skyColor);
    this.physics.world.setBounds(0, 0, cfg.levelWidth, 540);
    this.cameras.main.setBounds(0, 0, cfg.levelWidth, 540);

    const bgKey = `bg_${cfg.id}`;
    const bgTex = this.textures.get(bgKey).getSourceImage();
    const bgScale = 540 / bgTex.height;
    const bg = this.add.tileSprite(
      cfg.levelWidth / 2,
      270,
      cfg.levelWidth,
      540,
      bgKey,
    );
    bg.setTileScale(bgScale, bgScale);
    bg.setScrollFactor(1);

    this.groundGroup = this.physics.add.staticGroup();
    for (let x = 0; x < cfg.levelWidth; x += 64) {
      this.groundGroup
        .create(x + 32, 500, "ground")
        .setVisible(false)
        .refreshBody();
    }

    const charId = GameData.selectedCharacter;
    const charDef = CHARACTERS.find((c) => c.id === charId);

    if (!this.anims.exists(`${charId}_idle`)) {
      this.anims.create({
        key: `${charId}_idle`,
        frames: this.anims.generateFrameNumbers(`char_${charId}_idle`, {
          start: 0,
          end: charDef.idleFrames - 1,
        }),
        frameRate: 6,
        repeat: -1,
      });
    }
    if (!this.anims.exists(`${charId}_walk`)) {
      this.anims.create({
        key: `${charId}_walk`,
        frames: this.anims.generateFrameNumbers(`char_${charId}_walk`, {
          start: 0,
          end: charDef.walkFrames - 1,
        }),
        frameRate: 12,
        repeat: -1,
      });
    }

    const groundY = cfg.groundY ?? 460;
    const charScale = cfg.characterScale ?? CHARACTER_SCALE;
    const startX = cfg.startX ?? 80;
    const startDirection = cfg.startDirection ?? "right";

    this.player = this.physics.add.sprite(
      startX,
      groundY,
      `char_${charId}_idle`,
      0,
    );
    this.player.setOrigin(0.5, 1);
    this.player.body.setAllowGravity(false);
    this.player.setSize(CHARACTER_BODY.width, CHARACTER_BODY.height);
    this.player.body.setOffset(CHARACTER_BODY.offsetX, CHARACTER_BODY.offsetY);
    this.player.setScale(charScale);
    this.player.setFlipX(startDirection === "left");
    this.player.setCollideWorldBounds(true);
    this.player.setDragX(900);
    this.player.setMaxVelocity(220, 0);
    this.player.anims.play(`${charId}_idle`);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    this.infoIcons = [];
    this.usedOnceSpots = new Set();

    cfg.infoSpots.forEach((spot, index) => {
      const icon = this.add
        .image(spot.x, spot.y ?? 300, "posterTex")
        .setOrigin(0.5, 1)
        .setDepth(20)
        .setAlpha(0.75);
      this.tweens.add({
        targets: icon,
        y: icon.y - 4,
        duration: 650,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      this.infoIcons.push(icon);
    });
    this.infoSpots = cfg.infoSpots;

    const doorX = cfg.doorX;
    const hasBoss = cfg.hasBoss !== false && cfg.boss;
    this.bossTriggered = false;

    if (hasBoss) {
      const bossX = cfg.bossX;
      const bossY = cfg.bossY;

      if (cfg.boss.portrait) {
        const idleKey = `boss_${cfg.id}_idle`;
        const talkKey = `boss_${cfg.id}_talk`;
        const blinkKey = `boss_${cfg.id}_blink`;
        const portraitHeight = cfg.boss.portraitHeight ?? 260;
        const flip = cfg.boss.portraitFlip === true;

        const idleTex = this.textures.get(idleKey).getSourceImage();
        const talkTex = this.textures.exists(talkKey)
          ? this.textures.get(talkKey).getSourceImage()
          : idleTex;
        const hasBlink = this.textures.exists(blinkKey);
        const blinkTex = hasBlink
          ? this.textures.get(blinkKey).getSourceImage()
          : idleTex;

        const idleBaseScale = portraitHeight / idleTex.height;
        const talkBaseScale = portraitHeight / talkTex.height;
        const blinkBaseScale = portraitHeight / blinkTex.height;

        this.bossIdleSprite = this.add
          .image(bossX, bossY, idleKey)
          .setOrigin(0.5, 1)
          .setScale(idleBaseScale)
          .setFlipX(flip);
        this.bossTalkSprite = this.add
          .image(bossX, bossY, talkKey)
          .setOrigin(0.5, 1)
          .setScale(talkBaseScale)
          .setFlipX(flip)
          .setVisible(false);
        this.bossBlinkSprite = this.add
          .image(bossX, bossY, hasBlink ? blinkKey : idleKey)
          .setOrigin(0.5, 1)
          .setScale(blinkBaseScale)
          .setFlipX(flip)
          .setVisible(false);
        this.bossSprite = this.bossIdleSprite;

        const addBreathingTween = (targetSprite, baseScale) => {
          this.tweens.add({
            targets: targetSprite,
            scaleY: baseScale * 1.02,
            scaleX: baseScale * 0.995,
            duration: 700,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
          });
        };
        addBreathingTween(this.bossIdleSprite, idleBaseScale);
        addBreathingTween(this.bossTalkSprite, talkBaseScale);
        addBreathingTween(this.bossBlinkSprite, blinkBaseScale);

        this.bossTalkInterval = null;
        this.bossBlinkInterval = setInterval(() => {
          if (!hasBlink || GameData.menuPaused || this.bossTalkInterval) return;
          if (Math.random() > 0.3) return;
          this.bossIdleSprite.setVisible(false);
          this.bossBlinkSprite.setVisible(true);
          setTimeout(() => {
            if (!this.bossTalkInterval) {
              this.bossBlinkSprite.setVisible(false);
              this.bossIdleSprite.setVisible(true);
            }
          }, 150);
        }, 2200);

        this.startBossTalkAnim = () => {
          if (this.bossTalkInterval) return;
          this.bossBlinkSprite.setVisible(false);
          this.bossTalkInterval = setInterval(() => {
            if (GameData.menuPaused) return;
            const showTalk = !this.bossTalkSprite.visible;
            this.bossTalkSprite.setVisible(showTalk);
            this.bossIdleSprite.setVisible(!showTalk);
          }, 160);
        };
        this.stopBossTalkAnim = () => {
          clearInterval(this.bossTalkInterval);
          this.bossTalkInterval = null;
          this.bossTalkSprite.setVisible(false);
          this.bossBlinkSprite.setVisible(false);
          this.bossIdleSprite.setVisible(true);
        };
      } else {
        this.bossSprite = this.add
          .image(bossX, bossY, "bossTex")
          .setOrigin(0.5, 1);
      }

      this.bossZone = this.add.zone(bossX, bossY, 70, 100);
      this.physics.add.existing(this.bossZone, true);
      this.physics.add.overlap(this.player, this.bossZone, () => {
        if (!this.bossTriggered && !GameData.paused) {
          this.bossTriggered = true;
          this.player.setVelocity(0, 0);
          startBossBattle(this, cfg, this.bossSprite, () =>
            this.onBossDefeated(),
          );
        }
      });
    }

    if (cfg.showExitArrow !== false) {
      const exitY = groundY;
      const arrowPointsLeft = (cfg.exitDirection || "forward") === "backward";
      const exitStartsOpen = cfg.exitInitiallyOpen === true;

      this.doorGlow = this.add
        .circle(doorX, exitY - 90, 46, THEME.accent, 0.25)
        .setVisible(exitStartsOpen);
      this.door = this.add
        .text(doorX, exitY - 90, "➜", {
          fontSize: "64px",
          fontStyle: "bold",
          color: "#f2a900",
        })
        .setOrigin(0.5)
        .setFlipX(arrowPointsLeft)
        .setVisible(exitStartsOpen);

      this.tweens.add({
        targets: this.doorGlow,
        scale: { from: 0.85, to: 1.15 },
        alpha: { from: 0.15, to: 0.35 },
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      this.tweens.add({
        targets: this.door,
        x: doorX + (arrowPointsLeft ? -12 : 12),
        duration: 650,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      this.doorX = doorX;
      this.doorTriggerRadius = 70;
      this.doorOpen = exitStartsOpen;
    } else {
      this.doorOpen = false;
    }

    this.phaseTransitioning = false;
    this.inputManager = new InputManager(this);
    this.levelWidth = cfg.levelWidth;

    updateHUD();
    updateMuraisCounter(cfg.id, cfg.infoSpots.length);
    this.inputManager.setEnabled(false);

    showPhaseIntro(cfg, () => {
      let textoNarrador = null;

      if (cfg.id === "fase1") {
        GameData.paused = true;
        this.physics.pause();
        this.inputManager.setEnabled(false);

        // NOVO: Apresentação inicial do narrador
        chamarNarrador(
          this,
          {
            idle: "narrador_idle",
            talkOpen: "narrador_talk_open",
            talkMid: "narrador_talk_mid",
            blink: "narrador_blink",
          },
          null,
          `Olá, ${GameData.playerName}! Me chamo Gilmara, Trainee do Sebrae, e vou te guiar ao longo de toda essa jornada.`,
          () => {
            // Parte 1: O dia a dia
            chamarNarrador(
              this,
              {
                idle: "narrador_idle",
                talkOpen: "narrador_talk_open",
                talkMid: "narrador_talk_mid",
                blink: "narrador_blink",
              },
              null,
              `Mais um dia de muito trabalho na padaria! Pães quentinhos saindo do forno a todo vapor.`,
              () => {
                // Parte 2: O conflito do fiado
                chamarNarrador(
                  this,
                  {
                    idle: "narrador_idle",
                    talkOpen: "narrador_talk_open",
                    talkMid: "narrador_talk_mid",
                    blink: "narrador_blink",
                  },
                  null,
                  "Logo cedo, um cliente habitual pediu para levar pães e frios dizendo: 'Anota no caderninho que acerto no fim do mês!'. Sem jeito de dizer não, você anotou.",
                  () => {
                    // Parte 3: O problema no caixa
                    chamarNarrador(
                      this,
                      {
                        idle: "narrador_idle",
                        talkOpen: "narrador_talk_open",
                        talkMid: "narrador_talk_mid",
                        blink: "narrador_blink",
                      },
                      null,
                      "O expediente acabou. Na hora de pagar o fornecedor de farinha... cadê o dinheiro? O caixa está vazio e o caderno cheio de promessas!",
                      () => {
                        // Parte 4: Chamada para ação e liberação da porta
                        chamarNarrador(
                          this,
                          {
                            idle: "narrador_idle",
                            talkOpen: "narrador_talk_open",
                            talkMid: "narrador_talk_mid",
                            blink: "narrador_blink",
                          },
                          null,
                          "Vender fiado sem controle quase quebrou o seu negócio. É hora de buscar ajuda na cidade para organizar as contas. Vá até a saída!",
                          () => {
                            // Libera os controles e faz a seta de saída aparecer
                            GameData.paused = false;
                            this.physics.resume();
                            this.inputManager.setEnabled(true);

                            this.doorOpen = true;
                            this.door.setVisible(true);
                            this.doorGlow.setVisible(true);
                          },
                        );
                      },
                    );
                  },
                );
              },
            );
          },
        );
      } else if (cfg.id === "fase2") {
        GameData.paused = true;
        this.physics.pause();
        this.inputManager.setEnabled(false);
        chamarNarrador(
          this,
          {
            idle: "narrador_idle",
            talkOpen: "narrador_talk_open",
            talkMid: "narrador_talk_mid",
            blink: "narrador_blink",
          },
          null,
          "Você sai da padaria frustrado. O prejuízo no caixa não sai da sua cabeça... É hora de caminhar até em casa e buscar respostas.",
          () => {
            GameData.paused = false;
            this.physics.resume();
            this.inputManager.setEnabled(true);
          },
        );
      } else if (cfg.id === "fase3") {
        GameData.paused = true;
        this.physics.pause();
        this.inputManager.setEnabled(false);
        chamarNarrador(
          this,
          {
            idle: "narrador_idle",
            talkOpen: "narrador_talk_open",
            talkMid: "narrador_talk_mid",
            blink: "narrador_blink",
          },
          null,
          "Seguindo o conselho do vizinho, você decide buscar ajuda profissional. A caminhada termina em frente ao escritório do Sebrae.",
          () => {
            GameData.paused = false;
            this.physics.resume();
            this.inputManager.setEnabled(true);
          },
        );
      } else if (cfg.id === "fase4") {
        // Narrador da nova Fase 4 (Ato Final)
        GameData.paused = true;
        this.physics.pause();
        this.inputManager.setEnabled(false);
        chamarNarrador(
          this,
          {
            idle: "narrador_idle",
            talkOpen: "narrador_talk_open",
            talkMid: "narrador_talk_mid",
            blink: "narrador_blink",
          },
          null,
          "Agora é hora de aprender sobre uma ferramenta do Sebrae que te fará ter os números da sua empresa na palma da mão!",
          () => {
            GameData.paused = false;
            this.physics.resume();
            this.inputManager.setEnabled(true);
          },
        );
      } else {
        this.inputManager.setEnabled(true);
      }
    });
  }

  onBossDefeated() {
    if (this.config.showExitArrow === false) {
      this.time.delayedCall(1500, () => {
        this.goToNextPhase();
      });
      return;
    }
    this.doorOpen = true;
    this.door.setVisible(true);
    this.doorGlow.setVisible(true);
  }

  goToNextPhase() {
    const next = this.phaseIndex + 1;
    if (next >= PHASES.length) {
      endGame(true);
    } else {
      GameData.phaseIndex = next;
      updateHUD();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("PhaseScene", { phaseIndex: next });
      });
    }
  }

  update() {
    updateInfoBubble(
      this,
      this.player.x,
      this.infoSpots,
      this.config.id,
      this.infoIcons,
    );

    if (GameData.paused) {
      this.player.setVelocityX(0);
      const idleAnim = `${GameData.selectedCharacter}_idle`;
      if (this.player.anims.currentAnim?.key !== idleAnim) {
        this.player.anims.play(idleAnim, true);
      }
      return;
    }

    if (this.doorOpen && !this.phaseTransitioning && this.doorX !== undefined) {
      if (Math.abs(this.player.x - this.doorX) < this.doorTriggerRadius) {
        this.phaseTransitioning = true;
        this.goToNextPhase();
      }
    }

    if (!this.inputManager.enabled) {
      this.player.setVelocityX(0);
      const idleAnim = `${GameData.selectedCharacter}_idle`;
      if (this.player.anims.currentAnim?.key !== idleAnim) {
        this.player.anims.play(idleAnim, true);
      }
      return;
    }

    const charId = GameData.selectedCharacter;
    const left = this.inputManager.left();
    const right = this.inputManager.right();

    let vx = 0;
    if (left) {
      vx = -160;
      this.player.setFlipX(true);
    }
    if (right) {
      vx = 160;
      this.player.setFlipX(false);
    }
    this.player.setVelocityX(vx);

    const desiredAnim = vx !== 0 ? `${charId}_walk` : `${charId}_idle`;
    if (this.player.anims.currentAnim?.key !== desiredAnim) {
      this.player.anims.play(desiredAnim, true);
    }
  }
}

// ---------------------------------------------------------
// CONFIGURAÇÃO DO PHASER
// ---------------------------------------------------------
const config = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: 960,
  height: 540,
  pixelArt: true,
  backgroundColor: "#000000",
  physics: {
    default: "arcade",
    arcade: { gravity: { y: 1200 }, debug: false },
  },
  scene: [],
};

const game = new Phaser.Game(config);

function fitGameToScreen() {
  const wrapper = document.getElementById("game-wrapper");
  if (!wrapper) return;

  const scale = Math.min(window.innerWidth / 960, window.innerHeight / 540);
  
  // 1.25 a 1.30 estica entre 25% e 30% na vertical
  // Ajuste esse valor se quiser esticar um pouco mais ou menos
  const fatorVertical = 1.25; 

  wrapper.style.transform = `translate(-50%, -50%) scale(${scale}, ${scale * fatorVertical})`;
}
window.addEventListener("resize", fitGameToScreen);
fitGameToScreen();
game.scene.add("PhaseScene", PhaseScene, false);

// ---------------------------------------------------------
// MENU INICIAL
// ---------------------------------------------------------
function showPanel(id) {
  document
    .querySelectorAll(".menu-panel")
    .forEach((p) => p.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  if (id === "panel-ranking") renderRankingInto("ranking-list-menu");
}

document
  .querySelectorAll(".menu-btn[data-target], .back-btn[data-target]")
  .forEach((btn) => {
    btn.addEventListener("click", () => showPanel(btn.dataset.target));
  });

const nameInput = document.getElementById("player-name-start");
const nameWarning = document.getElementById("name-warning");

document.querySelectorAll(".character-option").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".character-option")
      .forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    GameData.selectedCharacter = btn.dataset.character;
    document.getElementById("hud-character-icon").src =
      `assets/thumbnails/${GameData.selectedCharacter}.png`;
  });
});

document.getElementById("confirm-name-btn").addEventListener("click", () => {
  const name = nameInput.value.trim();
  if (!name) {
    nameWarning.textContent = "Digite seu nome antes de começar 🙂";
    nameWarning.classList.remove("hidden");
    nameInput.focus();
    return;
  }
  const nameTaken = loadRanking().some(
    (r) => r.name.trim().toLowerCase() === name.toLowerCase(),
  );
  if (nameTaken) {
    nameWarning.textContent =
      "Esse nome já está no ranking! Escolha outro (ex: adicione um sobrenome).";
    nameWarning.classList.remove("hidden");
    nameInput.focus();
    return;
  }
  nameWarning.classList.add("hidden");
  startBgm();
  GameData.playerName = name;
  resetGameData();
  updateHUD();
  document.getElementById("touch-controls").style.display = "flex";
  document.getElementById("start-overlay").classList.add("hidden");

  // Agora inicializa direto na Fase 1 em vez do Mapa
  game.scene.start("PhaseScene", { phaseIndex: 0 });
});

function setGlobalVolume(val) {
  const v = Math.max(0, Math.min(1, val));
  SFX.bgm.volume = v * 0.2;
  const label = document.getElementById("volume-label");
  if (label) label.textContent = `${Math.round(v * 100)}%`;
}

const volumeBtn = document.getElementById("volume-btn");
const volumePopup = document.getElementById("volume-popup");
const volumeSlider = document.getElementById("volume-slider");

if (volumeSlider) volumeSlider.value = "1";
setGlobalVolume(1);

volumeBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  volumePopup.classList.toggle("hidden");
});

volumeSlider.addEventListener("input", (e) => {
  setGlobalVolume(parseFloat(e.target.value));
});

document.addEventListener("click", (e) => {
  if (!volumePopup.contains(e.target) && e.target !== volumeBtn) {
    volumePopup.classList.add("hidden");
  }
});

const pauseBtn = document.getElementById("pause-btn");
const pauseModal = document.getElementById("pause-modal");

pauseBtn.addEventListener("click", () => {
  GameData.paused = true;
  pauseModal.classList.remove("hidden");
  game.scene.scenes.forEach((scene) => {
    if (scene.scene.isActive()) {
      scene.scene.pause();
    }
  });
});

document.getElementById("resume-btn").addEventListener("click", () => {
  GameData.paused = false;
  pauseModal.classList.add("hidden");
  game.scene.scenes.forEach((scene) => {
    if (scene.scene.isPaused()) {
      scene.scene.resume();
    }
  });
});

// =========================================================
// EVENTOS DA TELA DE GAME OVER E RANKING
// =========================================================
const viewRankingBtn = document.getElementById("view-ranking-btn");
const restartBtn = document.getElementById("restart-btn");
const closeRankingBtn = document.getElementById("close-ranking-btn");
const rankingOverlay = document.getElementById("ranking-overlay");
const endOverlay = document.getElementById("end-overlay");

if (viewRankingBtn) {
  viewRankingBtn.addEventListener("click", () => {
    rankingOverlay.classList.remove("hidden");
    renderRankingInto("ranking-list-content");
  });
}

if (closeRankingBtn) {
  closeRankingBtn.addEventListener("click", () => {
    rankingOverlay.classList.add("hidden");
  });
}

if (restartBtn) {
  restartBtn.addEventListener("click", () => {
    endOverlay.classList.add("hidden");
    rankingOverlay.classList.add("hidden");
    document.getElementById("boss-overlay").classList.add("hidden");
    document.getElementById("info-bubble").classList.add("info-bubble-hidden");
    document.getElementById("qrcode-modal")?.classList.add("hidden");

    stopSfx(SFX.bgm);
    resetGameData();

    document.getElementById("hud").style.display = "none";
    document.getElementById("touch-controls").style.display = "none";

    game.scene.scenes.forEach((scene) => {
      if (scene.input && scene.input.keyboard) {
        scene.input.keyboard.clearCaptures();
      }
    });

    // Para totalmente a PhaseScene antes de voltar ao menu
    game.scene.stop("PhaseScene");

    document.getElementById("start-overlay").classList.remove("hidden");
    showPanel("panel-menu");

    const nameInput = document.getElementById("player-name-start");
    if (nameInput) nameInput.value = "";
    const nameWarning = document.getElementById("name-warning");
    if (nameWarning) nameWarning.classList.add("hidden");
  });
}

function showQRCodeModal(qrConfig, onDone) {
  const modal = document.getElementById("qrcode-modal");
  const img = document.getElementById("qrcode-img");
  const timerSpan = document.getElementById("qrcode-timer");
  const closeBtn = document.getElementById("qrcode-close-btn");
  const titleEl = document.getElementById("qrcode-title");
  const textEl = document.getElementById("qrcode-text");

  if (!modal || !img) {
    if (onDone) onDone();
    return;
  }

  if (qrConfig.image) img.src = qrConfig.image;
  if (qrConfig.title && titleEl) titleEl.textContent = qrConfig.title;
  if (qrConfig.text && textEl) textEl.textContent = qrConfig.text;

  let timeLeft = qrConfig.duration || 30;
  timerSpan.textContent = timeLeft;
  modal.classList.remove("hidden");

  let qrInterval = null;

  const cleanup = () => {
    clearInterval(qrInterval);
    modal.classList.add("hidden");
    closeBtn.onclick = null;
    if (onDone) onDone();
  };

  closeBtn.onclick = () => {
    cleanup();
  };

  qrInterval = setInterval(() => {
    timeLeft -= 1;
    timerSpan.textContent = timeLeft;
    if (timeLeft <= 0) {
      cleanup();
    }
  }, 1000);
}
