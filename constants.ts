import { Activity, Patient, User, Message, TimeLog, Clinic, BehaviorType, MedicalRecordEntry, TrialResult, InventoryItem, SafetyPlanStep, FinancialTransaction, FinancialService, Appointment } from './types';
import { Smile, Frown, Zap, Moon, AlertTriangle, Flame, Brain, Hand, MessageCircle, Eye, Shield, CheckCheck, GlassWater, Accessibility, MessageSquarePlus, Activity as ActivityIcon, Clock } from 'lucide-react';

export const BEHAVIOR_OPTIONS: { type: BehaviorType; label: string; icon: any; color: string; bg: string }[] = [
  { type: 'JOY', label: 'Alegria / Engajado', icon: Smile, color: 'text-green-600', bg: 'bg-green-100' },
  { type: 'FOCUS', label: 'Focado / Atento', icon: Brain, color: 'text-blue-600', bg: 'bg-blue-100' },
  { type: 'REGULATED', label: 'Auto-regulação', icon: Zap, color: 'text-purple-600', bg: 'bg-purple-100' },
  { type: 'COMPLIANCE', label: 'Obediência (High-P)', icon: CheckCheck, color: 'text-teal-600', bg: 'bg-teal-100' },
  { type: 'MAND', label: 'Mando (Pediu)', icon: MessageSquarePlus, color: 'text-pink-600', bg: 'bg-pink-100' },
  { type: 'ABC_RECORD', label: 'Registro ABC', icon: ActivityIcon, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  { type: 'DURATION_LOG', label: 'Duração (Crise)', icon: Clock, color: 'text-slate-600', bg: 'bg-slate-200' },
  { type: 'TIRED', label: 'Cansado / Sono', icon: Moon, color: 'text-gray-600', bg: 'bg-gray-100' },
  { type: 'ANXIOUS', label: 'Desconforto / Ansioso', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100' },
  { type: 'FRUSTRATED', label: 'Frustração / Choro', icon: Frown, color: 'text-red-600', bg: 'bg-red-100' },
  { type: 'AGGRESSIVE', label: 'Agressividade / Birra', icon: Flame, color: 'text-red-800', bg: 'bg-red-200' },
  { type: 'TOILETING', label: 'Banheiro / Troca', icon: Accessibility, color: 'text-cyan-600', bg: 'bg-cyan-100' },
  { type: 'EATING_DRINKING', label: 'Água / Lanche', icon: GlassWater, color: 'text-blue-400', bg: 'bg-blue-50' },
];

export const PROMPT_HIERARCHY = [
  {
    id: TrialResult.INDEPENDENT,
    label: 'Independente',
    score: 3,
    color: 'bg-green-500',
    icon: Zap,
    definition: 'A criança realiza a tarefa sozinha, sem nenhuma ajuda.'
  },
  {
    id: TrialResult.GESTURAL_PROMPT,
    label: 'Gestual',
    score: 2,
    color: 'bg-teal-500',
    icon: Hand,
    definition: 'O terapeuta aponta ou faz um gesto em direção à resposta correta.'
  },
  {
    id: TrialResult.VERBAL_PROMPT,
    label: 'Verbal',
    score: 2,
    color: 'bg-blue-500',
    icon: MessageCircle,
    definition: 'O terapeuta fala parte da resposta ou dá uma dica falada.'
  },
  {
    id: TrialResult.MODELING,
    label: 'Modelo',
    score: 1,
    color: 'bg-indigo-500',
    icon: Eye,
    definition: 'O terapeuta demonstra a ação para a criança imitar.'
  },
  {
    id: TrialResult.PHYSICAL_PARTIAL,
    label: 'Físico Parcial',
    score: 1,
    color: 'bg-orange-500',
    icon: Shield,
    definition: 'Um leve toque (cotovelo/ombro) para guiar o início do movimento.'
  },
  {
    id: TrialResult.PHYSICAL_FULL,
    label: 'Físico Total',
    score: 0,
    color: 'bg-red-500',
    icon: Shield,
    definition: 'Mão sobre mão. O terapeuta guia todo o movimento da criança.'
  },
];

// --- PREMIUM MOCK DATA ---

export const MOCK_INVENTORY: InventoryItem[] = [
  { id: 'inv-1', name: 'Massinha Play-Doh', category: 'REINFORCER', quantity: 12, location: 'Armário A', status: 'AVAILABLE' },
  { id: 'inv-2', name: 'Bolhas de Sabão', category: 'REINFORCER', quantity: 3, location: 'Mesa 2', status: 'LOW_STOCK' },
  { id: 'inv-3', name: 'Mordedor Sensorial', category: 'SENSORY', quantity: 5, location: 'Caixa TO', status: 'AVAILABLE' },
  { id: 'inv-4', name: 'Cartões PECS Animais', category: 'MATERIAL', quantity: 1, location: 'Pasta Lucas', status: 'AVAILABLE' },
  { id: 'inv-5', name: 'Quebra-cabeça 4 peças', category: 'MATERIAL', quantity: 0, location: 'Emprestado', status: 'OUT_OF_STOCK' },
];

export const MOCK_SAFETY_PLAN: SafetyPlanStep[] = [
  { level: 'BASELINE', indicators: ['Sorrindo', 'Respondendo comandos', 'Brincando funcionalmente'], staffResponse: ['Manter demandas', 'Elogiar comportamentos adequados', 'Reforço intermitente'], color: 'bg-green-100 border-green-500 text-green-800' },
  { level: 'TRIGGER', indicators: ['Recusa verbal', 'Virar o rosto', 'Pequenos grunhidos'], staffResponse: ['Oferecer escolha forçada', 'Reduzir dificuldade da demanda', 'Lembrar do reforçador'], color: 'bg-blue-100 border-blue-500 text-blue-800' },
  { level: 'ESCALATION', indicators: ['Gritos altos', 'Jogar objetos leves', 'Pacing (andar de um lado para outro)'], staffResponse: ['Retirar demanda', 'Limpar ambiente', 'Minimizar interação verbal', 'Bloqueio visual'], color: 'bg-yellow-100 border-yellow-500 text-yellow-800' },
  { level: 'CRISIS', indicators: ['Agressão física', 'Auto-lesão (bater cabeça)', 'Destruição de propriedade'], staffResponse: ['Protocolo de Segurança (CPI)', 'Pedir ajuda', 'Proteger cabeça do paciente', 'Monitorar tempo'], color: 'bg-red-100 border-red-500 text-red-800' },
  { level: 'RECOVERY', indicators: ['Choro baixo', 'Cansaço', 'Busca por contato físico'], staffResponse: ['Não reintroduzir demanda imediatamente', 'Oferecer água', 'Reestabelecer rapport'], color: 'bg-gray-100 border-gray-500 text-gray-800' }
];

// Updated Mock Clinics with Full Structure
export const MOCK_CLINICS: Clinic[] = [
  {
    id: 'clinic-1',
    name: 'Clínica Integrar',
    corporateName: 'Integrar Terapias Especiais LTDA',
    cnpj: '12.345.678/0001-90',
    plan: 'PRO',
    active: true,
    status: 'ACTIVE',
    maxUsers: 10,
    email: 'financeiro@integrar.com',
    phone: '(11) 98765-4321',
    website: 'www.clinicaintegrar.com.br',
    address: {
      street: 'Rua das Flores',
      number: '123',
      district: 'Vila Mariana',
      city: 'São Paulo',
      state: 'SP',
      zip: '04000-000'
    },
    subscription: {
      startDate: '2023-01-10',
      nextDueDate: '2024-03-10',
      dueDay: 10,
      value: 499.00,
      paymentMethod: 'CREDIT_CARD',
      isAutoRenew: true
    },
    adminUserId: 'u-admin'
  },
  {
    id: 'clinic-2',
    name: 'Espaço Crescer',
    corporateName: 'Crescer e Aprender Psicologia ME',
    cnpj: '98.765.432/0001-10',
    plan: 'BASIC',
    active: true,
    status: 'TRIAL',
    maxUsers: 3,
    email: 'contato@espacocrescer.com',
    phone: '(21) 91234-5678',
    address: {
      street: 'Av. Atlântica',
      number: '500',
      complement: 'Sala 402',
      district: 'Copacabana',
      city: 'Rio de Janeiro',
      state: 'RJ',
      zip: '22000-000'
    },
    subscription: {
      startDate: '2024-02-15',
      nextDueDate: '2024-03-15',
      dueDay: 15,
      value: 199.00,
      paymentMethod: 'BOLETO',
      isAutoRenew: false
    },
    adminUserId: 'u-admin-2'
  }
];

// Banco de dados de atividades expandido com mais categorias
export const MOCK_ACTIVITIES: Activity[] = [
  // --- HABILIDADES VISUAIS ---
  {
    id: 'act-01',
    title: 'Emparelhamento Visual - Cores',
    description: 'Emparelhar cartões de cores idênticas em um arranjo de 3 itens.',
    instruction: 'Diga: "Coloca igual"',
    domain: 'Habilidades Visuais',
    target: 'Emparelhar 5 cores independentemente',
    status: 'ACTIVE'
  },
  {
    id: 'act-08',
    title: 'Emparelhamento Objeto com Imagem',
    description: 'Associar um objeto real (ex: carrinho) com a foto correspondente.',
    instruction: 'Diga: "Acha o igual"',
    domain: 'Habilidades Visuais',
    target: 'Emparelhar 10 itens diferentes',
    status: 'ACTIVE'
  },
  {
    id: 'act-09',
    title: 'Quebra-cabeça Simples',
    description: 'Completar quebra-cabeças de encaixe único ou até 3 peças.',
    instruction: 'Diga: "Monta"',
    domain: 'Habilidades Visuais',
    target: 'Montar 3 quebra-cabeças diferentes sem ajuda física',
    status: 'ACTIVE'
  },

  // --- LINGUAGEM RECEPTIVA ---
  {
    id: 'act-02',
    title: 'Identificação Receptiva - Animais',
    description: 'Apontar para o animal solicitado (Cachorro, Gato, Vaca) quando instruído "Mostre o..."',
    instruction: 'Diga: "Mostre o [Animal]"',
    domain: 'Linguagem Receptiva',
    target: 'Identificar 10 animais comuns',
    status: 'ACTIVE'
  },
  {
    id: 'act-10',
    title: 'Seguir Instruções de 1 Passo (Comandos)',
    description: 'Executar ações motoras simples sob comando (ex: "Bate palma", "Levanta braço").',
    instruction: 'Diga apenas o comando (ex: "Bate palma")',
    domain: 'Linguagem Receptiva',
    target: 'Responder a 5 comandos diferentes',
    status: 'MAINTENANCE'
  },
  {
    id: 'act-11',
    title: 'Identificação de Partes do Corpo',
    description: 'Tocar na parte do corpo solicitada (ex: "Cadê o nariz?", "Cadê a barriga?").',
    instruction: 'Diga: "Cadê [Parte do Corpo]?"',
    domain: 'Linguagem Receptiva',
    target: 'Identificar 6 partes do corpo',
    status: 'ACTIVE'
  },

  // --- HABILIDADES MOTORAS (IMITAÇÃO) ---
  {
    id: 'act-03',
    title: 'Imitação Motora Grossa',
    description: 'Imitar ações: Bater palmas, Tocar a cabeça, Bater os pés, Levantar braços.',
    instruction: 'Faça a ação e diga: "Faz igual"',
    domain: 'Imitação Motora',
    target: 'Imitar 5 ações motoras grossas',
    status: 'MAINTENANCE'
  },
  {
    id: 'act-12',
    title: 'Imitação Motora Fina',
    description: 'Imitar movimentos precisos dos dedos (ex: pinça, apontar, juntar as mãos).',
    instruction: 'Faça a ação e diga: "Faz assim"',
    domain: 'Imitação Motora',
    target: 'Imitar 3 movimentos finos',
    status: 'ACTIVE'
  },
  {
    id: 'act-13',
    title: 'Imitação com Objetos',
    description: 'Imitar ações funcionais com objetos (ex: empurrar carrinho, beber no copo, colocar bloco na caixa).',
    instruction: 'Use o objeto e diga: "Faz igual"',
    domain: 'Imitação Motora',
    target: 'Imitar 4 ações com objetos',
    status: 'ACTIVE'
  },

  // --- COMUNICAÇÃO (MANDO/TATO) ---
  {
    id: 'act-04',
    title: 'Mando (Solicitação) - Itens Preferidos',
    description: 'Solicitar "água" ou "brinquedo" usando PECS ou gestos espontaneamente.',
    instruction: 'Espere a iniciativa da criança (Contrive se necessário)',
    domain: 'Comunicação (Mando)',
    target: 'Solicitação espontânea 3 vezes por sessão',
    status: 'ACTIVE'
  },
  {
    id: 'act-05',
    title: 'Tato (Nomeação) - Objetos Comuns',
    description: 'Nomear objetos comuns (Copo, Carro, Bola) ao ver o item.',
    instruction: 'Mostre o item e pergunte: "O que é isso?"',
    domain: 'Linguagem Expressiva (Tato)',
    target: 'Nomear 10 itens do cotidiano',
    status: 'ACTIVE'
  },
  {
    id: 'act-14',
    title: 'Tato de Ações',
    description: 'Nomear o que alguém está fazendo (ex: "Dormindo", "Comendo", "Correndo") ao ver imagem ou ação.',
    instruction: 'Mostre a ação e pergunte: "O que ele está fazendo?"',
    domain: 'Linguagem Expressiva (Tato)',
    target: 'Nomear 5 verbos/ações',
    status: 'ACTIVE'
  },

  // --- INTRAVERBAL ---
  {
    id: 'act-07',
    title: 'Intraverbal - Completar Músicas',
    description: 'Completar a última palavra de músicas infantis familiares.',
    instruction: 'Cante e pause na última palavra: "A dona aranha subiu pela..."',
    domain: 'Intraverbal',
    target: 'Completar 3 músicas diferentes',
    status: 'ACTIVE'
  },
  {
    id: 'act-15',
    title: 'Preencher Lacunas (Função)',
    description: 'Completar frases sobre função (ex: "Você dorme na...", "Você bebe água no...").',
    instruction: 'Diga a frase incompleta: "Você dorme na..."',
    domain: 'Intraverbal',
    target: 'Responder 5 funções diferentes',
    status: 'ACTIVE'
  },

  // --- HABILIDADES SOCIAIS (NOVO) ---
  {
    id: 'act-18',
    title: 'Responder ao Nome',
    description: 'Olhar para o interlocutor quando chamado pelo nome em até 3 segundos.',
    instruction: 'Chame o nome da criança (apenas uma vez).',
    domain: 'Habilidades Sociais',
    target: 'Responder em 80% das oportunidades',
    status: 'ACTIVE'
  },
  {
    id: 'act-19',
    title: 'Troca de Turno (Turn Taking)',
    description: 'Esperar sua vez em um jogo simples ou atividade (ex: colocar peça na torre).',
    instruction: 'Diga: "Minha vez" e depois "Sua vez".',
    domain: 'Habilidades Sociais',
    target: 'Esperar a vez sem tentar pegar o objeto por 5 turnos',
    status: 'ACTIVE'
  },
  {
    id: 'act-20',
    title: 'Contato Visual sob Demanda',
    description: 'Olhar nos olhos quando solicitado "Olhe para mim".',
    instruction: 'Segure um reforçador na altura dos olhos e diga: "Olhe para mim".',
    domain: 'Habilidades Sociais',
    target: 'Manter contato visual por 2 segundos',
    status: 'ACTIVE'
  },

  // --- BRINCAR FUNCIONAL (NOVO) ---
  {
    id: 'act-21',
    title: 'Brincar Funcional - Carrinhos',
    description: 'Empurrar carrinho na pista/chão fazendo som de "vrum", sem apenas girar rodas.',
    instruction: 'Modele a brincadeira e diga: "Vamos andar de carro".',
    domain: 'Brincar',
    target: 'Brincar funcionalmente por 1 minuto',
    status: 'ACTIVE'
  },
  {
    id: 'act-22',
    title: 'Brincar Simbólico - Comidinha',
    description: 'Fingir que está comendo ou dando comida para boneco/bicho.',
    instruction: 'Diga: "O urso está com fome, dá comida pra ele".',
    domain: 'Brincar',
    target: 'Realizar 3 ações diferentes (mexer panela, servir, dar na boca)',
    status: 'ACTIVE'
  },

  // --- ACADÊMICO INICIAL (NOVO) ---
  {
    id: 'act-23',
    title: 'Emparelhamento Letras',
    description: 'Colocar a letra A sobre outra letra A (igualdade visual).',
    instruction: 'Diga: "Coloca igual".',
    domain: 'Acadêmico',
    target: 'Emparelhar vogais (A, E, I, O, U)',
    status: 'ACTIVE'
  },
  {
    id: 'act-24',
    title: 'Contagem Mecânica 1-10',
    description: 'Contar oralmente de 1 até 10.',
    instruction: 'Diga: "Vamos contar! 1, 2..." e espere.',
    domain: 'Acadêmico',
    target: 'Contar até 10 sem erros',
    status: 'ACTIVE'
  },

  // --- AUTONOMIA (SELF-HELP) ---
  {
    id: 'act-16',
    title: 'Lavar as Mãos (Análise de Tarefa)',
    description: 'Seguir a cadeia comportamental de lavar as mãos.',
    instruction: 'Diga: "Lave as mãos" e aguarde.',
    domain: 'Autonomia',
    target: 'Completar 80% dos passos independentemente',
    status: 'ACTIVE',
    isTaskAnalysis: true,
    steps: [
      'Abrir a torneira',
      'Molhar as mãos',
      'Pegar o sabão',
      'Esfregar as mãos (palma e dorso)',
      'Enxaguar o sabão',
      'Fechar a torneira',
      'Pegar toalha',
      'Secar as mãos'
    ]
  },
  {
    id: 'act-17',
    title: 'Tirar Sapatos',
    description: 'Remover sapatos ao entrar na sala/casa.',
    instruction: 'Diga: "Tire o sapato"',
    domain: 'Autonomia',
    target: 'Remover sapatos sem ajuda física',
    status: 'MASTERED'
  },
  {
    id: 'act-25',
    title: 'Escovar os Dentes (Análise de Tarefa)',
    description: 'Cadeia de escovação dentária.',
    instruction: 'Diga: "Escove os dentes".',
    domain: 'Autonomia',
    target: 'Completar passos essenciais',
    status: 'ACTIVE',
    isTaskAnalysis: true,
    steps: [
      'Pegar escova',
      'Molhar escova',
      'Abrir pasta',
      'Colocar pasta',
      'Escovar frente',
      'Escovar fundo',
      'Cuspir',
      'Enxaguar boca',
      'Lavar escova',
      'Secar boca'
    ]
  }
];

const MOCK_RECORDS: MedicalRecordEntry[] = [
  {
    id: 'mr-1',
    date: '2024-02-10T14:30:00',
    type: 'MEDICATION',
    authorId: 'u-admin',
    title: 'Alteração Medicamentosa',
    content: 'Neuropediatra alterou a dosagem do Risperidona para 0.5mg à noite. Monitorar sonolência diurna.',
    tags: ['Risperidona', 'Sono', 'Neuropediatra']
  },
  {
    id: 'mr-2',
    date: '2024-02-15T09:00:00',
    type: 'FAMILY_MEETING',
    authorId: 'u-3',
    title: 'Reunião Mensal com Pais',
    content: 'Mãe relata aumento de estereotipias motoras em casa. Discutimos estratégias de regulação sensorial antes de dormir. Pai satisfeito com evolução na fala.',
    tags: ['Família', 'Estereotipias', 'Regulação']
  },
  {
    id: 'mr-3',
    date: '2024-02-20T10:00:00',
    type: 'SCHOOL_REPORT',
    authorId: 'u-1',
    title: 'Relatório Escolar Bimestral',
    content: 'A professora de apoio informou que o Lucas interagiu com 2 colegas no recreio. Porém, mordeu um colega ao ter um brinquedo retirado.',
    tags: ['Escola', 'Socialização', 'Agressividade']
  },
  {
    id: 'mr-4',
    date: '2024-02-28T16:00:00',
    type: 'EVOLUTION',
    authorId: 'u-1',
    title: 'Fechamento Mensal Fev/24',
    content: 'Paciente estável. Aquisição de mando evoluindo bem. Atenção para os episódios de agressividade na escola, correlacionados com disputa de item tangível.',
    tags: ['Evolução', 'Mando', 'Agressividade']
  }
];

export const MOCK_PATIENT: Patient = {
  id: 'p-001',
  name: 'Lucas Silva',
  age: 6,
  diagnosis: 'TEA Nível 2 de Suporte, Não-verbal',
  startDate: '2023-05-10',
  guardianIds: ['u-2'],
  guardianNames: ['Mariana Silva', 'Carlos Silva'],
  anamnesisSummary: 'Gestação típica. Atraso nos marcos da fala. Diferenças no processamento sensorial (sensibilidade auditiva). Reforçadores: Brinquedos giratórios, bolhas de sabão, massinha.',
  photoUrl: undefined,
  safetyPlan: MOCK_SAFETY_PLAN,
  homeTasks: [
    { id: 'ht-1', title: 'Brincar com Carrinho', description: 'Realizar brincadeira funcional por 5 min.', assignedDate: '2024-03-01', status: 'COMPLETED', parentFeedback: 'Foi tranquilo.' },
    { id: 'ht-2', title: 'Pedir Água', description: 'Esperar ele apontar antes de entregar.', assignedDate: '2024-03-03', status: 'PENDING' }
  ],
  documents: [
    { id: 'doc-1', name: 'Laudo Neurológico 2024.pdf', type: 'PDF', uploadDate: '2024-01-10', category: 'LAUDO' },
    { id: 'doc-2', name: 'Video Modeling - Lavar Mãos.mp4', type: 'VIDEO', uploadDate: '2024-02-15', category: 'VIDEO_MODELING' }
  ],
  plans: [
    {
      id: 'plan-01',
      patientId: 'p-001',
      title: 'PEI - Ciclo Inicial 2024',
      startDate: '2024-01-15',
      endDate: '2024-06-15',
      status: 'ACTIVE',
      methodology: 'Aplicação de DTT (Tentativa Discreta) intensivo para habilidades de base e NET (Ensino Naturalístico) para generalização de mando.',
      goals: [
        {
          id: 'g-1',
          activityId: 'act-04',
          customTarget: 'Solicitar itens 5x por sessão sem dica verbal.',
          status: 'IN_PROGRESS',
          deadline: '2024-04-01'
        },
        {
          id: 'g-2',
          activityId: 'act-01',
          customTarget: 'Emparelhar cores primárias com 90% de precisão.',
          status: 'ACHIEVED',
          deadline: '2024-03-01'
        },
        {
          id: 'g-3',
          activityId: 'act-02',
          customTarget: 'Identificar animais da fazenda ao ouvir o nome.',
          status: 'IN_PROGRESS',
          deadline: '2024-05-01'
        }
      ]
    }
  ],
  medicalRecords: MOCK_RECORDS,
  // --- MOCK FINANCIAL CONTRACT ---
  financialConfig: {
    paymentMethod: 'INSURANCE',
    insuranceName: 'Unimed',
    insuranceNumber: '0012345678900',
    services: [
      { id: 'srv-1', name: 'Sessão ABA (2h)', price: 250.00, durationMinutes: 120 },
      { id: 'srv-2', name: 'Fonoaudiologia', price: 150.00, durationMinutes: 45 }
    ]
  },
  schedule: [
    { id: 'sch-1', dayOfWeek: 1, time: '14:00', serviceId: 'srv-1', therapistId: 'u-1' }, // Seg
    { id: 'sch-2', dayOfWeek: 3, time: '14:00', serviceId: 'srv-1', therapistId: 'u-1' }, // Qua
    { id: 'sch-3', dayOfWeek: 5, time: '14:00', serviceId: 'srv-1', therapistId: 'u-1' }, // Sex
  ]
};

export const MOCK_USERS: User[] = [
  // Super Admin do DOM Azul
  {
    id: 'u-saas',
    clinicId: undefined, // Sem clínica, acesso global
    name: 'Admin DOM Azul',
    role: 'SAAS_ADMIN',
    email: 'admin@domazul.com',
    password: 'DomAzul@2026',
    avatarUrl: 'https://ui-avatars.com/api/?name=DOM+Azul&background=0D47A1&color=fff'
  },
  // Equipe da Clínica Integrar (clinic-1)
  {
    id: 'u-1',
    clinicId: 'clinic-1',
    name: 'Dra. Ana Costa',
    role: 'THERAPIST',
    email: 'ana@integrar.com',
    password: '123456',
    avatarUrl: 'https://picsum.photos/id/64/100/100',
    performanceScore: 98,
    financial: {
      contractType: 'PJ',
      salaryType: 'HOURLY',
      baseRate: 85.00,
      allowOvertime: true,
      workSchedule: {
        start: '08:00',
        end: '17:00',
        lunchDurationMinutes: 60,
        activeWeekDays: [1, 2, 3, 4, 5] // Seg-Sex
      },
      benefits: { mealValue: 0, transportValue: 0 },
      taxes: { deductINSS: false, deductIRRF: false }
    }
  },
  { id: 'u-2', clinicId: 'clinic-1', name: 'Mariana Silva', role: 'PARENT', email: 'mariana@email.com', password: '123456', avatarUrl: 'https://picsum.photos/id/65/100/100' },
  { id: 'u-3', clinicId: 'clinic-1', name: 'Pedro Santos', role: 'SPECIALIST', email: 'pedro@email.com', password: '123456', avatarUrl: 'https://picsum.photos/id/66/100/100' },
  {
    id: 'u-4',
    clinicId: 'clinic-1',
    name: 'João Terapeuta',
    role: 'THERAPIST',
    email: 'joao@integrar.com',
    password: '123456',
    avatarUrl: 'https://picsum.photos/id/70/100/100',
    performanceScore: 85,
    financial: {
      contractType: 'CLT',
      salaryType: 'MONTHLY',
      baseRate: 3500.00,
      allowOvertime: false,
      workSchedule: {
        start: '09:00',
        end: '18:00',
        lunchDurationMinutes: 60,
        activeWeekDays: [1, 2, 3, 4, 5]
      },
      benefits: { mealValue: 25.00, transportValue: 12.00 },
      taxes: { deductINSS: true, deductIRRF: true }
    }
  },
  {
    id: 'u-5',
    clinicId: 'clinic-1',
    name: 'Carla Estagiária',
    role: 'THERAPIST',
    email: 'carla@integrar.com',
    password: '123456',
    avatarUrl: 'https://picsum.photos/id/72/100/100',
    performanceScore: 92,
    financial: {
      contractType: 'ESTAGIO',
      salaryType: 'HOURLY',
      baseRate: 20.00,
      allowOvertime: false,
      workSchedule: {
        start: '13:00',
        end: '17:00',
        lunchDurationMinutes: 0,
        activeWeekDays: [1, 3, 5] // Seg, Qua, Sex
      },
      benefits: { mealValue: 0, transportValue: 10.00 },
      taxes: { deductINSS: false, deductIRRF: false }
    }
  },
  {
    id: 'u-admin',
    clinicId: 'clinic-1',
    name: 'Diretoria Clínica',
    email: 'diretoria@integrar.com',
    password: '123456',
    role: 'ADMIN',
    avatarUrl: 'https://picsum.photos/id/80/100/100'
  },
  // Admin de outra clínica
  {
    id: 'u-admin-2',
    clinicId: 'clinic-2',
    name: 'Gestão Espaço Crescer',
    email: 'gestao@crescer.com',
    password: '123456',
    role: 'ADMIN',
    avatarUrl: 'https://ui-avatars.com/api/?name=Espaco+Crescer'
  }
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'm-1',
    authorId: 'u-2',
    content: 'O Lucas dormiu mal essa noite, pode estar um pouco irritado hoje durante a sessão.',
    timestamp: Date.now() - 86400000,
    type: 'ALERT',
    readBy: ['u-1']
  },
  {
    id: 'm-2',
    authorId: 'u-3',
    content: 'Na T.O. estamos trabalhando o movimento de pinça com massinha. Por favor, reforce se possível nas atividades de mesa.',
    timestamp: Date.now() - 43200000,
    type: 'GENERAL',
    readBy: ['u-1', 'u-2']
  }
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  { id: '1', date: new Date().toISOString().split('T')[0], time: '08:00', duration: 120, patientId: 'p-001', therapistId: 'u-1', serviceName: 'Sessão ABA', status: 'IN_SESSION', room: 'Sala 1 (Sensorial)' },
  { id: '2', date: new Date().toISOString().split('T')[0], time: '10:00', duration: 60, patientId: 'p-002', therapistId: 'u-4', serviceName: 'Fonoaudiologia', status: 'COMPLETED', room: 'Sala 4 (Fono)' },
  { id: '3', date: new Date().toISOString().split('T')[0], time: '14:00', duration: 120, patientId: 'p-001', therapistId: 'u-1', serviceName: 'Sessão ABA', status: 'SCHEDULED', room: 'Sala 1 (Sensorial)' },
  { id: '4', date: new Date().toISOString().split('T')[0], time: '15:00', duration: 60, patientId: 'p-004', therapistId: 'u-4', serviceName: 'T.O.', status: 'ARRIVED', room: 'Sala 5 (T.O.)' },
];

// Mock Time Logs for the last few days
const now = new Date();
const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
const dayBefore = new Date(now); dayBefore.setDate(now.getDate() - 2);

export const MOCK_TIME_LOGS: TimeLog[] = [
  {
    id: 'tl-1',
    userId: 'u-1',
    date: yesterday.toISOString().split('T')[0],
    clockIn: yesterday.setHours(9, 0, 0, 0),
    clockOut: yesterday.setHours(12, 0, 0, 0),
    type: 'REGULAR',
    status: 'APPROVED',
    relatedSessionStart: yesterday.setHours(9, 15, 0, 0)
  },
  {
    id: 'tl-2',
    userId: 'u-1',
    date: dayBefore.toISOString().split('T')[0],
    clockIn: dayBefore.setHours(13, 55, 0, 0),
    clockOut: dayBefore.setHours(16, 0, 0, 0),
    type: 'REGULAR',
    status: 'APPROVED',
    relatedSessionStart: dayBefore.setHours(14, 0, 0, 0)
  },
  {
    id: 'tl-3',
    userId: 'u-1',
    date: '2023-12-20',
    clockIn: new Date('2023-12-20T08:00:00').getTime(),
    clockOut: new Date('2023-12-20T10:00:00').getTime(),
    type: 'MANUAL',
    status: 'PENDING',
    justification: 'Esqueci o celular no carro, bati o ponto depois.',
    relatedSessionStart: new Date('2023-12-20T08:05:00').getTime()
  }
];

// --- NEW ERP FINANCIAL MOCK DATA ---
const curDate = new Date().toISOString().split('T')[0];
export const MOCK_EXPENSES: FinancialTransaction[] = [
  {
    id: 'exp-1',
    date: curDate,
    description: 'Aluguel Sede',
    amount: 2500.00,
    type: 'EXPENSE',
    category: 'EXPENSE_RENT',
    status: 'PAID',
    paymentMethod: 'TRANSFER',
    entityName: 'Imobiliária Central',
    costCenter: 'Administrativo'
  },
  {
    id: 'exp-2',
    date: curDate,
    description: 'Internet Fibra',
    amount: 120.00,
    type: 'EXPENSE',
    category: 'EXPENSE_SOFTWARE',
    status: 'PENDING',
    dueDate: curDate,
    paymentMethod: 'BOLETO',
    entityName: 'Vivo Empresas'
  },
  {
    id: 'exp-3',
    date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
    description: 'Compra Jogos Pedagógicos',
    amount: 350.50,
    type: 'EXPENSE',
    category: 'EXPENSE_MATERIAL',
    status: 'PAID',
    paymentMethod: 'CREDIT_CARD',
    costCenter: 'Clínico'
  }
];

// --- MOCK FINANCIAL SERVICES CATALOG ---
export const MOCK_FINANCIAL_SERVICES: FinancialService[] = [
  { id: 'fs-1', name: 'Sessão ABA (60min)', defaultPrice: 120.00, category: 'REVENUE_SESSION' },
  { id: 'fs-2', name: 'Sessão ABA (120min)', defaultPrice: 240.00, category: 'REVENUE_SESSION' },
  { id: 'fs-3', name: 'Avaliação Inicial', defaultPrice: 350.00, category: 'REVENUE_SESSION' },
  { id: 'fs-4', name: 'Supervisão Técnica', defaultPrice: 200.00, category: 'REVENUE_SESSION' },
  { id: 'fs-5', name: 'Venda Material Adaptado', defaultPrice: 50.00, category: 'REVENUE_PRODUCT' }
];