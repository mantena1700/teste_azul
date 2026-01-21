import { GoogleGenAI } from "@google/genai";
import { Session, Patient, Activity, Plan, MedicalRecordEntry } from "../types";
import { BEHAVIOR_OPTIONS } from "../constants";

// Use Vite's import.meta.env instead of process.env
const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY || '';

// Lazy initialization - only create the client when actually needed
let aiClient: GoogleGenAI | null = null;
const getAIClient = () => {
  const key = getApiKey();
  if (!key) {
    console.warn('⚠️ Gemini API Key not configured. AI features will be disabled.');
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
};

export const generateSessionInsights = async (
  session: Session,
  patient: Patient,
  activities: Activity[]
): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "Chave de API não configurada. Por favor, adicione sua API Key do Gemini.";

  try {
    // Enrich session data
    const enrichedTrials = session.trials.map(t => {
      const act = activities.find(a => a.id === t.activityId);
      return {
        ...t,
        activityName: act ? act.title : 'Atividade Desconhecida',
        domain: act ? act.domain : 'Desconhecido'
      };
    });

    // Translate events
    const humanReadableEvents = (session.events || []).map(e => {
      const label = BEHAVIOR_OPTIONS.find(b => b.type === e.type)?.label || e.type;
      return `${label} em ${new Date(e.timestamp).toLocaleTimeString()}`;
    });

    const prompt = `
      Você é um Supervisor Clínico Sênior em Análise do Comportamento Aplicada (ABA).
      Analise os dados da sessão a seguir para o paciente ${patient.name} (Idade: ${patient.age}).

      Contexto da Sessão:
      - Duração: ${session.endTime ? ((session.endTime - session.startTime) / 60000).toFixed(1) : 'Em andamento'} minutos
      - Notas do Aplicador: "${session.notes}"
      - Sentimento Geral: ${session.sentiment}

      Registros Comportamentais / Emocionais (Importante):
      ${humanReadableEvents.length > 0 ? humanReadableEvents.join(', ') : 'Nenhum evento comportamental específico registrado.'}

      Pontos de Dados (Tentativas/Trials):
      ${JSON.stringify(enrichedTrials.slice(0, 50))} 
      (Nota: lista truncada se for muito longa)

      Por favor, forneça um insight clínico estruturado em Português do Brasil, cobrindo:
      1. **Resumo de Desempenho**: Taxas de sucesso por domínio.
      2. **Análise Comportamental**: Correlacione os eventos emocionais (se houver) com o desempenho. Ex: "Houve queda no desempenho após episódios de frustração?".
      3. **Padrões Identificados**: Alguma atividade específica gerou mais erros ou necessidade de dicas?
      4. **Recomendações**: Sugestões práticas para o aplicador lidar com os comportamentos observados.
      
      Mantenha o tom profissional, encorajador e objetivo.
    `;

    const response = await ai!.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Não foi possível gerar insights.";

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Erro ao gerar insights da IA. Verifique sua conexão ou chave de API.";
  }
};

export interface StrategicInsight {
  summary: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  successProbability: number; // 0-100
  recommendations: string[];
  hiddenPatterns: string[];
}

export const generateStrategicAnalysis = async (
  patient: Patient,
  sessionsHistory: Session[], // Last 10-30 sessions
  activePlan: Plan
): Promise<StrategicInsight> => {
  const ai = getAIClient();
  if (!ai) throw new Error("API Key missing");

  try {
    const prompt = `
            Você é um Sistema Especialista em Gestão de Casos ABA.
            Analise o progresso longitudinal do paciente e prever sucesso do PEI.

            PACIENTE: ${patient.name}, ${patient.age} anos.
            
            DADOS HISTÓRICOS (Últimas sessões resumidas):
            ${JSON.stringify(sessionsHistory.slice(0, 15).map(s => ({
      date: new Date(s.startTime).toLocaleDateString(),
      duration: ((s.endTime || 0) - s.startTime) / 60000,
      successRate: (s.trials.filter(t => t.result === 'INDEPENDENT').length / s.trials.length) * 100,
      behavioralEvents: (s.events || []).map(e => e.type), // Include emotions in history
      notes: s.notes
    })))}

            TAREFA:
            1. Analise a "Velocidade de Aquisição".
            2. Identifique "Padrões Ocultos" cruzando Desempenho vs. Emoções (Ex: "Dias com mais 'TIRED' tem 30% menos acertos").
            3. Sugira "Estratégias de Correção de Rota".

            OUTPUT ESPERADO (JSON ONLY):
            {
                "summary": "Resumo executivo...",
                "riskLevel": "LOW" | "MEDIUM" | "HIGH",
                "successProbability": 85,
                "recommendations": ["Rec 1", "Rec 2"],
                "hiddenPatterns": ["Padrão 1", "Padrão 2"]
            }
        `;

    const response = await ai!.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const jsonText = response.text || "{}";
    return JSON.parse(jsonText) as StrategicInsight;

  } catch (error) {
    console.error("Strategic AI Error", error);
    return {
      summary: "Não foi possível realizar a análise estratégica no momento.",
      riskLevel: 'MEDIUM',
      successProbability: 0,
      recommendations: [],
      hiddenPatterns: []
    };
  }
};

export const analyzeMedicalRecords = async (records: MedicalRecordEntry[]): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "API Key indisponível.";

  try {
    const prompt = `
          Você é um Auditor Clínico Inteligente analisando o prontuário de um paciente com TEA.
          
          Aqui estão as entradas cronológicas do prontuário (textos não estruturados):
          ${JSON.stringify(records.map(r => `[${r.date}] (${r.type}) ${r.title}: ${r.content}`))}

          Sua tarefa é conectar os pontos.
          1. Verifique se mudanças de medicação coincidem com relatos escolares ou de família (positivos ou negativos).
          2. Identifique queixas recorrentes da família.
          3. Gere uma "Linha do Tempo Clínica Resumida" destacando apenas eventos críticos.

          Responda em formato Markdown, claro e direto.
      `;

    const response = await ai!.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });

    return response.text || "Sem dados suficientes.";
  } catch (error) {
    console.error("Medical Record AI Error", error);
    return "Erro na análise do prontuário.";
  }
};

export const generatePlanAdjustments = async (
  history: Session[],
  currentPlan: string
): Promise<string> => {
  return "Funcionalidade de ajuste de plano em desenvolvimento.";
};