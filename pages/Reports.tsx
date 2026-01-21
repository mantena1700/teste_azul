import React, { useState, useRef, useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, ComposedChart, Area, Radar, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell, AreaChart
} from 'recharts';
import {
    TrendingUp, Users, BrainCircuit, Sparkles, Target, ArrowRight, Loader2,
    Calendar, HeartPulse, Filter, FileText, Download, Hexagon, Activity,
    Layers, AlertCircle, Clock, Award, HelpCircle, FileCheck, Edit3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { generateStrategicAnalysis, StrategicInsight } from '../services/geminiService';
import { Session, TrialResult } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useData } from '../contexts/DataContext';

export type ReportType = 'EVOLUTION' | 'BEHAVIOR' | 'RADAR' | 'TEAM' | 'GAP' | 'ABC' | 'HOURLY' | 'CUMULATIVE' | 'IOA' | 'NARRATIVE';

export const Reports: React.FC = () => {
    const { user } = useAuth();
    const { sessions, patients, users, activities } = useData();
    const role = user?.role || 'THERAPIST';

    // State for Filters
    const [activeTab, setActiveTab] = useState<'generator' | 'supervisor'>('generator');
    const [selectedReport, setSelectedReport] = useState<ReportType>('EVOLUTION');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [selectedTherapist, setSelectedTherapist] = useState<string>('all');
    const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || '');

    // Deriving Stats from REAL SESSIONS
    const filteredSessions = useMemo(() => {
        return sessions.filter(s => {
            if (selectedPatientId && s.patientId !== selectedPatientId) return false;
            if (selectedTherapist !== 'all' && s.therapistId !== selectedTherapist) return false;
            // Date filter could go here
            return true;
        });
    }, [sessions, selectedPatientId, selectedTherapist]);

    // 1. Evolution Data (Success Rate over time)
    const evolutionData = useMemo(() => {
        // Group by Date (or Week)
        const grouped: Record<string, { total: number, success: number }> = {};

        const sorted = [...filteredSessions].sort((a, b) => a.startTime - b.startTime);

        sorted.forEach(sess => {
            const date = new Date(sess.startTime).toLocaleDateString().slice(0, 5); // DD/MM
            if (!grouped[date]) grouped[date] = { total: 0, success: 0 };

            sess.trials.forEach(t => {
                grouped[date].total++;
                if (t.result === 'INDEPENDENT') grouped[date].success++;
            });
        });

        return Object.keys(grouped).map(date => ({
            name: date,
            successRate: grouped[date].total ? Math.round((grouped[date].success / grouped[date].total) * 100) : 0,
            target: 80
        }));
    }, [filteredSessions]);

    // 2. Hourly Data (Heatmap)
    const hourlyData = useMemo(() => {
        const counts: Record<number, number> = {};
        // Initialize 8am to 18pm
        for (let i = 8; i <= 18; i++) counts[i] = 0;

        filteredSessions.forEach(sess => {
            // Count events by hour
            sess.events.forEach(evt => {
                const hour = new Date(evt.timestamp).getHours();
                if (counts[hour] !== undefined) counts[hour]++;
            });
        });

        return Object.keys(counts).map(h => ({
            hour: `${h}:00`,
            intensity: counts[parseInt(h)]
        }));
    }, [filteredSessions]);

    // 3. Radar Data (By Domain)
    const radarData = useMemo(() => {
        const domainStats: Record<string, { total: number, success: number }> = {};
        filteredSessions.forEach(sess => {
            sess.trials.forEach(t => {
                const act = activities.find(a => a.id === t.activityId);
                if (act) {
                    const domain = act.domain || 'Geral';
                    if (!domainStats[domain]) domainStats[domain] = { total: 0, success: 0 };
                    domainStats[domain].total++;
                    if (t.result === 'INDEPENDENT') domainStats[domain].success++;
                }
            });
        });
        const data = Object.keys(domainStats).map(d => ({
            subject: d,
            A: domainStats[d].total ? Math.round((domainStats[d].success / domainStats[d].total) * 100) : 0,
            fullMark: 100
        }));
        return data.length > 0 ? data : [{ subject: 'Sem Dados', A: 0, fullMark: 100 }];
    }, [filteredSessions, activities]);

    // 4. Team Productivity
    const teamData = useMemo(() => {
        const stats: Record<string, { sessions: number, minutes: number }> = {};
        filteredSessions.forEach(s => {
            const tName = users.find(u => u.id === s.therapistId)?.name || 'Desconhecido';
            if (!stats[tName]) stats[tName] = { sessions: 0, minutes: 0 };
            stats[tName].sessions++;
            stats[tName].minutes += (s.endTime && s.startTime ? (s.endTime - s.startTime) / 60000 : 60); // Default 60 min if no end time
        });
        return Object.entries(stats).map(([name, data]) => ({
            name, sessions: data.sessions, hours: Math.round(data.minutes / 60), efficiency: 90
        }));
    }, [filteredSessions, users]);

    // 5. ABC Data (Function Hypothesis)
    const abcData = useMemo(() => {
        // Group by event type as proxy for function if ABC specific data not available
        const counts: Record<string, number> = {};
        filteredSessions.forEach(s => s.events.forEach(e => {
            const key = e.abcSpecifics?.consequence || e.type; // Use consequence or type
            counts[key] = (counts[key] || 0) + 1;
        }));
        const COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#8B5CF6', '#EF4444'];
        return Object.entries(counts).map(([name, value], i) => ({
            name, value, color: COLORS[i % COLORS.length]
        }));
    }, [filteredSessions]);

    // 6. Behavior Correlation Data
    const behaviorData = useMemo(() => {
        // Simplify: Day of week vs Success Rate vs Events
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const stats: Record<number, { trials: number, success: number, joy: number, frustration: number }> = {};

        filteredSessions.forEach(s => {
            const day = new Date(s.startTime).getDay();
            if (!stats[day]) stats[day] = { trials: 0, success: 0, joy: 0, frustration: 0 };

            s.trials.forEach(t => {
                stats[day].trials++;
                if (t.result === 'INDEPENDENT') stats[day].success++;
            });
            s.events.forEach(e => {
                if (['JOY', 'FOCUS'].includes(e.type)) stats[day].joy++;
                if (['FRUSTRATED', 'AGGRESSIVE', 'ANXIOUS'].includes(e.type)) stats[day].frustration++;
            });
        });

        return Object.keys(stats).map(d => ({
            name: days[parseInt(d)],
            successRate: stats[parseInt(d)].trials ? Math.round((stats[parseInt(d)].success / stats[parseInt(d)].trials) * 100) : 0,
            joy: stats[parseInt(d)].joy,
            frustration: stats[parseInt(d)].frustration
        }));
    }, [filteredSessions]);

    // Placeholders for GAP and CUMULATIVE (Complex logic, leaving empty for now)
    const gapData: any[] = [];
    const cumulativeData: any[] = [];

    // 3. IOA Calculation (Mock logic for now, or could compare sessions if we had dual data)
    const [ioaResult, setIoaResult] = useState(85);

    // AI State
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [strategicData, setStrategicData] = useState<StrategicInsight | null>(null);

    // Ref for PDF Export
    const reportRef = useRef<HTMLDivElement>(null);

    const selectedPatient = patients.find(p => p.id === selectedPatientId);

    const runStrategicAnalysis = async () => {
        if (!selectedPatient) return;
        setIsLoadingAI(true);
        const activePlan = selectedPatient.plans.find(p => p.status === 'ACTIVE') || selectedPatient.plans[0];
        // Use filtered sessions for analysis
        const result = await generateStrategicAnalysis(selectedPatient, filteredSessions, activePlan);
        setStrategicData(result);
        setIsLoadingAI(false);
    };


    const handleExportPDF = async () => {
        if (reportRef.current) {
            const canvas = await html2canvas(reportRef.current);
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`relatorio_aba_${selectedReport.toLowerCase()}.pdf`);
        }
    };

    // Helper component for Explanatory Legends
    const ReportLegend = ({ title, text }: { title: string, text: string }) => (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-100 rounded-lg flex gap-3">
            <div className="bg-white p-2 rounded-full shadow-sm border border-gray-100 h-fit">
                <HelpCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
                <h4 className="font-bold text-gray-800 text-sm mb-1">{title}</h4>
                <p className="text-xs text-gray-600 leading-relaxed">{text}</p>
            </div>
        </div>
    );

    const renderReportContent = () => {
        switch (selectedReport) {
            case 'EVOLUTION':
                return (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Curva de Aprendizado (Evolução PEI)</h3>
                            <p className="text-sm text-gray-500 mb-6">Comparativo entre a taxa de independência atingida e a meta estipulada no plano.</p>
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer>
                                    <ComposedChart data={evolutionData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                        <YAxis unit="%" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Legend />
                                        <Area type="monotone" dataKey="successRate" name="Taxa de Independência" fill="url(#colorSuccess)" stroke="#2563EB" strokeWidth={3} />
                                        <Line type="monotone" dataKey="target" name="Meta do Plano" stroke="#EF4444" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                                        <defs>
                                            <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                            <ReportLegend
                                title="Como ler este gráfico?"
                                text="A área azul representa a porcentagem de vezes que a criança acertou sozinha (independente). A linha vermelha pontilhada é a meta (geralmente 80% ou 90%). Se a área azul cruzar a linha vermelha e se manter, a habilidade foi aprendida."
                            />
                        </div>
                    </div>
                );

            case 'CUMULATIVE':
                return (
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Gráfico de Aquisição Cumulativa</h3>
                        <p className="text-sm text-gray-500 mb-6">Total de habilidades masterizadas ao longo do tempo.</p>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer>
                                <AreaChart data={cumulativeData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Area type="monotone" dataKey="masterizadas" name="Habilidades Masterizadas" stroke="#10B981" fill="#D1FAE5" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <ReportLegend
                            title="O que é Gráfico Cumulativo?"
                            text="Este é o gráfico mais importante para mostrar evolução a longo prazo. A linha NUNCA desce. Ela mostra o total de coisas novas que a criança aprendeu desde o início. Quanto mais inclinada a subida, mais rápido ela está aprendendo."
                        />
                    </div>
                );

            case 'IOA':
                return (
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Calculadora de IOA (Acordo entre Observadores)</h3>
                        <p className="text-sm text-gray-500 mb-6">Confiabilidade dos dados coletados entre dois terapeutas.</p>

                        <div className="flex justify-center items-center gap-8 mb-8">
                            <div className="w-40 h-40 rounded-full border-8 border-indigo-100 flex items-center justify-center relative">
                                <span className="text-4xl font-bold text-indigo-600">{ioaResult}%</span>
                                <span className="absolute bottom-8 text-xs font-bold uppercase text-gray-400">Concordância</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
                            <div className="p-3 bg-gray-50 rounded border">
                                <span className="text-xs font-bold text-gray-500 block">Terapeuta 1 (Registros)</span>
                                <span className="text-xl font-bold">20</span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded border">
                                <span className="text-xs font-bold text-gray-500 block">Terapeuta 2 (Registros)</span>
                                <span className="text-xl font-bold">17</span>
                            </div>
                        </div>

                        <ReportLegend
                            title="Supervisão de Qualidade"
                            text="Um IOA acima de 80% indica que a coleta de dados é confiável. Se estiver baixo, é necessário treinar a equipe para definir melhor os comportamentos alvo."
                        />
                    </div>
                );

            case 'NARRATIVE':
                return (
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg text-white">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Gerador de Relatório Narrativo (IA)</h3>
                                <p className="text-sm text-gray-500">Texto pronto para laudos e planos de saúde.</p>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 font-serif leading-relaxed text-gray-800 text-sm whitespace-pre-line shadow-inner">
                            {`RELATÓRIO DE EVOLUÇÃO CLÍNICA - ABA
                    
                    Paciente: ${selectedPatient?.name}
                    Período: Fevereiro/2024
                    
                    1. INTRODUÇÃO
                    O paciente encontra-se em acompanhamento terapêutico sob a abordagem da Análise do Comportamento Aplicada (ABA). Neste período, foram realizadas ${filteredSessions.length} sessões focadas nos domínios de Comunicação e Autonomia.

                    2. ANÁLISE DE DADOS
                    Observou-se uma tendência de aquisição ascendente nas taxas de resposta independente.
                    
                    3. BARREIRAS E COMPORTAMENTOS
                    (Dados de comportamento aqui)

                    4. PLANO DE AÇÃO
                    Recomenda-se manter o atual PEI.`}
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button className="text-purple-600 font-bold text-sm flex items-center gap-1 hover:underline">
                                <Edit3 className="w-4 h-4" /> Editar Texto
                            </button>
                        </div>
                    </div>
                );

            case 'RADAR':
                return (
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center">
                        <h3 className="text-lg font-bold text-gray-800 mb-2 w-full text-left">Equilíbrio de Domínios (Radar)</h3>
                        <p className="text-sm text-gray-500 mb-6 w-full text-left">Visualização da performance distribuída por áreas de desenvolvimento.</p>
                        <div className="h-[400px] w-full max-w-lg">
                            <ResponsiveContainer>
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#4B5563', fontSize: 12, fontWeight: 500 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                    <Radar name="Paciente" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                    <Tooltip />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-full">
                            <ReportLegend
                                title="Entendendo o Radar"
                                text="Este gráfico mostra se o desenvolvimento está equilibrado. Se o desenho estiver muito 'pontudo' para um lado, significa que a criança está muito bem em uma área (ex: Comunicação) mas precisa de mais foco em outra (ex: Social)."
                            />
                        </div>
                    </div>
                );

            case 'BEHAVIOR':
                return (
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Correlação: Emoção vs. Desempenho</h3>
                        <p className="text-sm text-gray-500 mb-6">Analise como o estado emocional impacta a taxa de acerto nas tentativas.</p>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer>
                                <ComposedChart data={behaviorData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                    <YAxis yAxisId="left" unit="%" axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend />
                                    <Bar yAxisId="right" dataKey="joy" name="Eventos de Alegria" stackId="a" fill="#22c55e" barSize={20} />
                                    <Bar yAxisId="right" dataKey="frustration" name="Eventos de Frustração" stackId="a" fill="#ef4444" barSize={20} />
                                    <Line yAxisId="left" type="monotone" dataKey="successRate" name="Taxa de Acerto" stroke="#6366f1" strokeWidth={3} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                        <ReportLegend
                            title="Correlação Emocional"
                            text="Cruza o desempenho (linha roxa) com o humor (barras). Isso ajuda a identificar se dias ruins são causados por frustração com a tarefa (tarefa difícil demais) ou fatores externos (sono, fome)."
                        />
                    </div>
                );

            case 'ABC':
                return (
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center">
                        <h3 className="text-lg font-bold text-gray-800 mb-2 w-full text-left">Análise Funcional ABC (Antecedent-Behavior-Consequence)</h3>
                        <p className="text-sm text-gray-500 mb-6 w-full text-left">Distribuição das prováveis funções do comportamento (Hipótese).</p>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={abcData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {abcData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-full">
                            <ReportLegend
                                title="Função do Comportamento"
                                text="Todo comportamento tem uma função. Este gráfico mostra 'por que' a criança faz o que faz. Se 'Demanda' é alto, ela provavelmente foge de tarefas difíceis. Se 'Atenção' é alto, ela quer interação social."
                            />
                        </div>
                    </div>
                );

            case 'HOURLY':
                return (
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Mapa de Calor Horário (Scatterplot)</h3>
                        <p className="text-sm text-gray-500 mb-6">Frequência de comportamentos por hora do dia. Identifique picos de desregulação.</p>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer>
                                <BarChart data={hourlyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="intensity" name="Frequência de Eventos" fill="#F87171" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <ReportLegend
                            title="Padrões Temporais"
                            text="Ajuda a identificar se comportamentos difíceis acontecem sempre no mesmo horário (ex: perto do almoço por fome, ou no final da tarde por cansaço)."
                        />
                    </div>
                );

            case 'GAP':
                return (
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Lacunas de Habilidade (Skills Gap)</h3>
                        <p className="text-sm text-gray-500 mb-6">Áreas onde o paciente requer maior nível de suporte (Dicas) ou apresenta mais erros.</p>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer>
                                <BarChart layout="vertical" data={gapData} margin={{ left: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#374151', fontSize: 12, fontWeight: 500 }} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend />
                                    <Bar dataKey="errorRate" name="% de Erros" fill="#FCA5A5" radius={[0, 4, 4, 0]} barSize={20} />
                                    <Bar dataKey="promptRate" name="% de Dicas (Ajuda)" fill="#93C5FD" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <ReportLegend
                            title="Nível de Ajuda Necessária"
                            text="Mostra onde a criança precisa de mais suporte. Barra azul grande indica dependência de ajuda (dicas) para realizar a tarefa. Barra vermelha indica erro (não sabe fazer)."
                        />
                    </div>
                );

            case 'TEAM':
                return (
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Produtividade da Equipe Clínica</h3>
                        <p className="text-sm text-gray-500 mb-6">Comparativo de volume de sessões e eficiência de registro.</p>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer>
                                <BarChart data={teamData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend />
                                    <Bar dataKey="sessions" name="Sessões Realizadas" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="hours" name="Horas Clínicas" fill="#A5B4FC" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );

            default:
                return <div>Selecione um relatório.</div>;
        }
    };

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {role === 'ADMIN' ? 'Centro de Inteligência' : 'Relatórios Clínicos'}
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Extraia dados cruzados e análises de longo prazo.
                    </p>
                </div>

                {/* Main Tab Switcher */}
                <div className="bg-white p-1 rounded-lg border border-gray-200 flex">
                    <button
                        onClick={() => setActiveTab('generator')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${activeTab === 'generator' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Filter className="w-4 h-4" /> Gerador de Relatórios
                    </button>
                    <button
                        onClick={() => setActiveTab('supervisor')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${activeTab === 'supervisor' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <BrainCircuit className="w-4 h-4" /> Supervisor Virtual
                    </button>
                </div>
            </div>

            {activeTab === 'generator' ? (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                    {/* Sidebar Filters */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Filter className="w-4 h-4 text-blue-600" /> Configuração
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Relatório</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        <button
                                            onClick={() => setSelectedReport('EVOLUTION')}
                                            className={`text-left px-3 py-2 rounded-lg text-sm border transition-all flex items-center gap-2 ${selectedReport === 'EVOLUTION' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                                        >
                                            <TrendingUp className="w-4 h-4" /> Evolução de Aprendizagem
                                        </button>
                                        <button
                                            onClick={() => setSelectedReport('CUMULATIVE')}
                                            className={`text-left px-3 py-2 rounded-lg text-sm border transition-all flex items-center gap-2 ${selectedReport === 'CUMULATIVE' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                                        >
                                            <Award className="w-4 h-4" /> Aquisição Cumulativa (ABA+)
                                        </button>
                                        <button
                                            onClick={() => setSelectedReport('BEHAVIOR')}
                                            className={`text-left px-3 py-2 rounded-lg text-sm border transition-all flex items-center gap-2 ${selectedReport === 'BEHAVIOR' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                                        >
                                            <HeartPulse className="w-4 h-4" /> Correlação Comportamental
                                        </button>
                                        <button
                                            onClick={() => setSelectedReport('RADAR')}
                                            className={`text-left px-3 py-2 rounded-lg text-sm border transition-all flex items-center gap-2 ${selectedReport === 'RADAR' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                                        >
                                            <Hexagon className="w-4 h-4" /> Radar de Habilidades
                                        </button>
                                        <button
                                            onClick={() => setSelectedReport('ABC')}
                                            className={`text-left px-3 py-2 rounded-lg text-sm border transition-all flex items-center gap-2 ${selectedReport === 'ABC' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                                        >
                                            <Activity className="w-4 h-4" /> Análise ABC (Função)
                                        </button>
                                        <button
                                            onClick={() => setSelectedReport('HOURLY')}
                                            className={`text-left px-3 py-2 rounded-lg text-sm border transition-all flex items-center gap-2 ${selectedReport === 'HOURLY' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                                        >
                                            <Clock className="w-4 h-4" /> Mapa de Calor Horário
                                        </button>
                                        <button
                                            onClick={() => setSelectedReport('GAP')}
                                            className={`text-left px-3 py-2 rounded-lg text-sm border transition-all flex items-center gap-2 ${selectedReport === 'GAP' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                                        >
                                            <AlertCircle className="w-4 h-4" /> Lacunas & Dificuldades
                                        </button>
                                        <button
                                            onClick={() => setSelectedReport('IOA')}
                                            className={`text-left px-3 py-2 rounded-lg text-sm border transition-all flex items-center gap-2 ${selectedReport === 'IOA' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                                        >
                                            <FileCheck className="w-4 h-4" /> Calculadora IOA
                                        </button>
                                        <button
                                            onClick={() => setSelectedReport('NARRATIVE')}
                                            className={`text-left px-3 py-2 rounded-lg text-sm border transition-all flex items-center gap-2 ${selectedReport === 'NARRATIVE' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                                        >
                                            <Sparkles className="w-4 h-4" /> Gerador Narrativo (IA)
                                        </button>
                                        {role === 'ADMIN' && (
                                            <button
                                                onClick={() => setSelectedReport('TEAM')}
                                                className={`text-left px-3 py-2 rounded-lg text-sm border transition-all flex items-center gap-2 ${selectedReport === 'TEAM' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                                            >
                                                <Users className="w-4 h-4" /> Produtividade da Equipe
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Paciente</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white"
                                        value={selectedPatientId}
                                        onChange={(e) => setSelectedPatientId(e.target.value)}
                                    >
                                        <option value="">Selecione...</option>
                                        {patients.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Terapeuta</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white"
                                        value={selectedTherapist}
                                        onChange={(e) => setSelectedTherapist(e.target.value)}
                                    >
                                        <option value="all">Todos</option>
                                        {users.filter(u => u.role === 'THERAPIST' || u.role === 'SPECIALIST').map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Período</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="date" className="border border-gray-300 rounded-lg p-1 text-xs" onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} />
                                        <input type="date" className="border border-gray-300 rounded-lg p-1 text-xs" onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} />
                                    </div>
                                </div>

                                <button
                                    onClick={handleExportPDF}
                                    className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-black transition-colors"
                                >
                                    <Download className="w-4 h-4" /> Baixar PDF
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Report Display Area */}
                    <div className="lg:col-span-3">
                        <div ref={reportRef} className="bg-white p-2 rounded-xl">
                            {/* Header for PDF */}
                            <div className="mb-6 p-4 border-b border-gray-100 hidden md:block" id="report-header">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Relatório de {
                                            selectedReport === 'EVOLUTION' ? 'Evolução Clínica' :
                                                selectedReport === 'BEHAVIOR' ? 'Análise Comportamental' :
                                                    selectedReport === 'RADAR' ? 'Competências por Domínio' :
                                                        selectedReport === 'GAP' ? 'Análise de Dificuldades' :
                                                            selectedReport === 'ABC' ? 'Função do Comportamento' :
                                                                selectedReport === 'CUMULATIVE' ? 'Aquisição Cumulativa' :
                                                                    selectedReport === 'HOURLY' ? 'Ocorrências por Horário' :
                                                                        selectedReport === 'IOA' ? 'Supervisão IOA' :
                                                                            selectedReport === 'NARRATIVE' ? 'Laudo Narrativo' : 'Produtividade'
                                        }</h2>
                                        <p className="text-sm text-gray-500">Paciente: {selectedPatient?.name} | Gerado em: {new Date().toLocaleDateString()}</p>
                                    </div>
                                    <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                                        CONFIDENCIAL
                                    </div>
                                </div>
                            </div>

                            {renderReportContent()}

                            {/* Footer Stats included in report */}
                            <div className="grid grid-cols-3 gap-4 mt-6">
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">
                                    <span className="block text-xs text-gray-500 uppercase">Sessões no Período</span>
                                    <span className="block text-xl font-bold text-gray-900">{filteredSessions.length}</span>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">
                                    <span className="block text-xs text-gray-500 uppercase">Total de Horas</span>
                                    <span className="block text-xl font-bold text-gray-900">{(filteredSessions.reduce((acc, s) => acc + (s.endTime && s.startTime ? (s.endTime - s.startTime) : 0), 0) / 3600000).toFixed(1)}h</span>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">
                                    <span className="block text-xs text-gray-500 uppercase">Total de Tentativas</span>
                                    <span className="block text-xl font-bold text-blue-600">{filteredSessions.reduce((acc, s) => acc + s.trials.length, 0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                    {/* SUPERVISOR VIRTUAL (STRATEGIC AI) - Kept largely same but cleaner */}
                    {!strategicData && !isLoadingAI ? (
                        <div className="bg-gradient-to-br from-indigo-900 to-purple-800 rounded-2xl p-8 text-white text-center shadow-xl">
                            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                                <Sparkles className="w-10 h-10 text-yellow-300" />
                            </div>
                            <h2 className="text-3xl font-bold mb-4">Análise Estratégica de Longo Prazo</h2>
                            <p className="text-indigo-200 max-w-2xl mx-auto mb-8 text-lg">
                                Nossa IA analisará todo o histórico de {selectedPatient?.name}, cruzará com o PEI ativo e identificará padrões ocultos que podem estar impedindo o progresso.
                            </p>
                            <button
                                onClick={runStrategicAnalysis}
                                className="bg-white text-indigo-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-50 transition-colors shadow-lg flex items-center gap-3 mx-auto"
                            >
                                <BrainCircuit className="w-6 h-6" /> Rodar Análise de Supervisor
                            </button>
                        </div>
                    ) : isLoadingAI ? (
                        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
                            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900">Processando Histórico Clínico...</h3>
                            <p className="text-gray-500 mt-2">Comparando sessões com metas do PEI...</p>
                        </div>
                    ) : strategicData ? (
                        <div className="space-y-6">
                            {/* Strategic Data Display (Same as before) */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className={`col-span-1 p-6 rounded-2xl border-l-8 shadow-sm bg-white ${strategicData.riskLevel === 'HIGH' ? 'border-red-500' :
                                    strategicData.riskLevel === 'MEDIUM' ? 'border-yellow-500' : 'border-green-500'
                                    }`}>
                                    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Probabilidade de Sucesso</h3>
                                    <div className="flex items-end gap-2">
                                        <span className={`text-5xl font-bold ${strategicData.riskLevel === 'HIGH' ? 'text-red-600' :
                                            strategicData.riskLevel === 'MEDIUM' ? 'text-yellow-600' : 'text-green-600'
                                            }`}>
                                            {strategicData.successProbability}%
                                        </span>
                                    </div>
                                </div>
                                <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                    <h3 className="flex items-center gap-2 font-bold text-purple-900 mb-4">
                                        <BrainCircuit className="w-5 h-5" /> Parecer do Supervisor Virtual
                                    </h3>
                                    <p className="text-gray-700 leading-relaxed">{strategicData.summary}</p>
                                </div>
                            </div>
                            <div className="flex justify-center">
                                <button
                                    onClick={() => setStrategicData(null)}
                                    className="text-gray-500 text-sm hover:text-purple-600 underline"
                                >
                                    Nova Análise
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
};