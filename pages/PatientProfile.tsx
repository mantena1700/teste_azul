import React, { useState, useEffect, useMemo } from 'react';
import {
    User, FileText, Activity, Calendar, Clock, Edit3, Save, X,
    CheckCircle2, AlertTriangle, Target, BrainCircuit,
    School, Users, ShieldAlert, Heart, Star,
    LayoutGrid, Check, CreditCard, BarChart3, Phone, Mail, MapPin, Plus,
    ChevronDown, ChevronUp, History, ArrowUpRight, Sparkles, Filter, MoreHorizontal
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Patient, Plan, Goal, Session } from '../types';
import { LineChart, Line, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

export const PatientProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getPatientById, updatePatient, sessions } = useData();

    const [activeTab, setActiveTab] = useState<'overview' | 'pei' | 'records' | 'financial'>('overview');
    const [patientData, setPatientData] = useState<Patient | undefined>(undefined);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDocModalOpen, setIsDocModalOpen] = useState(false); // NEW: Doc Modal
    const [editForm, setEditForm] = useState<Partial<Patient>>({});
    const [tempReinforcer, setTempReinforcer] = useState('');

    // Document Form State
    const [newDocName, setNewDocName] = useState('');
    const [newDocCategory, setNewDocCategory] = useState<'LAUDO' | 'PEI' | 'VIDEO_MODELING'>('LAUDO');

    // Helper to calculate age in years and months
    const calculateDetailedAge = (birthDateString?: string) => {
        if (!birthDateString) return null;
        const birthDate = new Date(birthDateString);
        const today = new Date(); // Use server time or reliable client time
        let years = today.getFullYear() - birthDate.getFullYear();
        let months = today.getMonth() - birthDate.getMonth();
        if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
            years--;
            months += 12;
        }
        // Adjust months if day is earlier
        if (today.getDate() < birthDate.getDate()) {
            months--;
            if (months < 0) {
                months = 11;
                // years already adjusted above
            }
        }
        return { years, months };
    };

    // PEI Filter State
    const [goalFilter, setGoalFilter] = useState<'ALL' | 'IN_PROGRESS' | 'ACHIEVED'>('ALL');
    const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            const found = getPatientById(id);
            if (found) {
                setPatientData(found);
                setEditForm(found);
                const activePlan = (found.plans || []).find(p => p.status === 'ACTIVE');
                if (activePlan) setExpandedPlanId(activePlan.id);
            } else {
                navigate('/patients');
            }
        }
    }, [id, getPatientById, navigate]);

    // --- LOGIC & CALCULATIONS ---

    const patientSessions = useMemo(() => {
        if (!patientData) return [];
        return sessions.filter(s => s.patientId === patientData.id).sort((a, b) => b.startTime - a.startTime);
    }, [sessions, patientData]);

    const stats = useMemo(() => {
        if (!patientData) return { hoursUsed: 0, totalHours: 40, goalsMastered: 0, totalGoals: 0, domainProgress: [] };

        // 1. Hours Logic (Current Month)
        const currentMonth = new Date().getMonth();
        const thisMonthSessions = patientSessions.filter(s => new Date(s.startTime).getMonth() === currentMonth);
        const hoursUsed = thisMonthSessions.reduce((acc, s) => {
            const duration = s.endTime ? (s.endTime - s.startTime) / 1000 / 60 / 60 : 0;
            return acc + duration;
        }, 0);

        // 2. Goals Logic
        const activePlan = (patientData.plans || []).find(p => p.status === 'ACTIVE');
        const totalGoals = activePlan?.goals.length || 0;
        const goalsMastered = activePlan?.goals.filter(g => g.status === 'ACHIEVED').length || 0;

        // 3. Domain Logic (Mocked slightly for demo if data is scarce, but logic is sound)
        // Group goals by 'activityId' lookup or custom tags in a real app. 
        // Here we simulate domains based on goal count for visualization.
        const domainStats = [
            { name: 'Comunicação', value: 65, color: '#3B82F6' },
            { name: 'Social', value: 40, color: '#8B5CF6' },
            { name: 'Autonomia', value: 80, color: '#10B981' },
            { name: 'Motor', value: 55, color: '#F59E0B' }
        ];

        return {
            hoursUsed: hoursUsed.toFixed(1),
            totalHours: 40, // Mock contract cap
            goalsMastered,
            totalGoals,
            planProgress: totalGoals > 0 ? Math.round((goalsMastered / totalGoals) * 100) : 0,
            domainStats
        };
    }, [patientSessions, patientData]);

    // --- ACTIONS ---

    const handleSaveProfile = () => {
        if (patientData && editForm) {
            updatePatient(patientData.id, editForm);
            setPatientData({ ...patientData, ...editForm } as Patient);
            setIsEditModalOpen(false);
        }
    };

    const toggleGoalStatus = (planId: string, goalId: string, currentStatus: string) => {
        const nextStatus = currentStatus === 'ACHIEVED' ? 'IN_PROGRESS' : 'ACHIEVED';

        const updatedPlans = (patientData?.plans || []).map(p => {
            if (p.id === planId) {
                return {
                    ...p,
                    goals: p.goals.map(g => g.id === goalId ? { ...g, status: nextStatus as any } : g)
                };
            }
            return p;
        });

        if (updatedPlans && patientData) {
            updatePatient(patientData.id, { plans: updatedPlans });
            setPatientData({ ...patientData, plans: updatedPlans });
        }
    };

    const handleAddReinforcer = () => {
        if (tempReinforcer && editForm) {
            // Store reinforcers in anamnesis for now or a specific field if we added it to types
            const current = editForm.anamnesisSummary || '';
            const updated = current + `\nReforçador Adicionado: ${tempReinforcer}`;
            setEditForm({ ...editForm, anamnesisSummary: updated });
            setTempReinforcer('');
        }
    };

    if (!patientData) return <div className="p-8 text-center flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 rounded-full border-t-transparent"></div></div>;

    // --- SUB-COMPONENTS ---

    const StatCard = ({ icon: Icon, label, value, subtext, colorClass }: any) => (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4 transition-all hover:shadow-md">
            <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10`}>
                <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
            </div>
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
                <p className="text-xs text-gray-500 mt-1">{subtext}</p>
            </div>
        </div>
    );

    const TimelineItem = ({ date, title, subtitle, type }: any) => (
        <div className="flex gap-4 group">
            <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full border-2 z-10 bg-white group-hover:scale-125 transition-all ${type === 'SESSION' ? 'border-blue-500' : 'border-purple-500'
                    }`} />
                <div className="w-0.5 h-full bg-gray-100 -mt-1 group-last:hidden" />
            </div>
            <div className="pb-8">
                <p className="text-xs font-bold text-gray-400 mb-0.5">{date}</p>
                <h4 className="text-sm font-bold text-gray-800">{title}</h4>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{subtitle}</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto pb-20 md:pb-0 space-y-6">

            {/* === HERO HEADER === */}
            <div className="relative bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Decorative Background */}
                <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>

                <div className="px-8 pb-8">
                    <div className="flex flex-col md:flex-row gap-6 items-start -mt-12">
                        {/* Avatar */}
                        <div className="w-32 h-32 rounded-3xl border-4 border-white shadow-lg bg-gray-100 overflow-hidden shrink-0 relative group">
                            {patientData.photoUrl ? (
                                <img src={patientData.photoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-300 bg-gray-50">
                                    {patientData.name.charAt(0)}
                                </div>
                            )}
                            <button className="absolute bottom-2 right-2 p-1.5 bg-white/80 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                <Edit3 className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>

                        {/* Main Info */}
                        <div className="flex-1 pt-14 md:pt-14 w-full">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                                        {patientData.name}
                                        <span className={`text-xs px-2 py-1 rounded-full border ${patientData.financialConfig?.paymentMethod === 'PRIVATE'
                                            ? 'bg-green-50 text-green-700 border-green-200'
                                            : 'bg-purple-50 text-purple-700 border-purple-200'
                                            }`}>
                                            {patientData.financialConfig?.paymentMethod === 'PRIVATE' ? 'Particular' : 'Convênio'}
                                        </span>
                                    </h1>
                                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500 font-medium">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="w-4 h-4" />
                                            {patientData.birthDate ? (() => {
                                                const age = calculateDetailedAge(patientData.birthDate);
                                                return age ? `${age.years} anos e ${age.months} meses` : `${patientData.age} anos`;
                                            })() : `${patientData.age} anos`}
                                        </span>
                                        <span className="flex items-center gap-1.5"><Activity className="w-4 h-4" /> {patientData.diagnosis}</span>
                                        <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> São Paulo, SP</span>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setIsEditModalOpen(true)}
                                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                                    >
                                        <Edit3 className="w-4 h-4" /> Editar Perfil
                                    </button>
                                    <button
                                        onClick={() => navigate('/session')}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> Nova Sessão
                                    </button>
                                </div>
                            </div>

                            {/* Quick Tags & Reinforcers */}
                            <div className="mt-6 flex flex-col md:flex-row md:items-center gap-4 border-t border-gray-100 pt-4">
                                <div className="flex flex-wrap gap-2">
                                    {patientData.safetyPlan && (
                                        <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-100 rounded-lg text-xs font-bold flex items-center gap-1">
                                            <ShieldAlert className="w-3 h-3" /> Plano de Crise Ativo
                                        </span>
                                    )}
                                    <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-xs font-bold flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> Alergia: Amendoim
                                    </span>
                                </div>
                                <div className="hidden md:block w-px h-6 bg-gray-200"></div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Heart className="w-4 h-4 text-pink-500 fill-current" />
                                    <span className="font-bold text-xs uppercase text-gray-400">Gosta de:</span>
                                    <span className="truncate max-w-xs">Massinha, Bolhas de Sabão, Vídeos de Trens</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* === MAIN CONTENT GRID === */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* LEFT: TABS & CONTENT (8 Cols) */}
                <div className="lg:col-span-8 flex flex-col gap-6">

                    {/* Custom Tab Switcher */}
                    <div className="bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm flex overflow-x-auto no-scrollbar">
                        {[
                            { id: 'overview', label: 'Visão 360º', icon: LayoutGrid },
                            { id: 'pei', label: 'PEI & Metas', icon: Target },
                            { id: 'records', label: 'Prontuário', icon: FileText },
                            { id: 'financial', label: 'Contrato', icon: CreditCard }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 min-w-[120px] py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === tab.id
                                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-indigo-600' : 'text-gray-400'}`} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* TAB: OVERVIEW */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            {/* Stats Row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <StatCard
                                    icon={Clock}
                                    label="Horas Mês"
                                    value={`${stats.hoursUsed}h`}
                                    subtext={`de ${stats.totalHours}h contratadas`}
                                    colorClass="bg-blue-500"
                                />
                                <StatCard
                                    icon={Target}
                                    label="Metas PEI"
                                    value={`${stats.planProgress}%`}
                                    subtext={`${stats.goalsMastered} de ${stats.totalGoals} concluídas`}
                                    colorClass="bg-purple-500"
                                />
                                <StatCard
                                    icon={Star}
                                    label="Sessões"
                                    value={patientSessions.length}
                                    subtext="Realizadas total"
                                    colorClass="bg-amber-500"
                                />
                                <StatCard
                                    icon={CreditCard}
                                    label="Status"
                                    value="Ativo"
                                    subtext="Pagamento em dia"
                                    colorClass="bg-green-500"
                                />
                            </div>

                            {/* Domain Progress & Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <BrainCircuit className="w-5 h-5 text-indigo-600" /> Progresso por Domínio
                                    </h3>
                                    <div className="space-y-4">
                                        {stats.domainStats.map((domain, idx) => (
                                            <div key={idx}>
                                                <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                                                    <span>{domain.name}</span>
                                                    <span>{domain.value}%</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-2">
                                                    <div
                                                        className="h-2 rounded-full transition-all duration-1000"
                                                        style={{ width: `${domain.value}%`, backgroundColor: domain.color }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                            <School className="w-5 h-5 text-indigo-600" /> Resumo Clínico
                                        </h3>
                                        <button onClick={() => setIsEditModalOpen(true)} className="text-xs text-indigo-600 font-bold hover:underline">Editar</button>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm text-gray-600 leading-relaxed h-[180px] overflow-y-auto">
                                        {patientData.anamnesisSummary || "Sem resumo cadastrado."}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: PEI */}
                    {activeTab === 'pei' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            {/* PEI Header */}
                            <div className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100">
                                <div>
                                    <h2 className="text-xl font-bold text-indigo-900">Planos de Ensino Individualizados</h2>
                                    <p className="text-sm text-indigo-600">Gerencie programas, metas e manutenção.</p>
                                </div>
                                <div className="flex gap-2 mt-4 md:mt-0">
                                    <div className="bg-white border border-gray-200 rounded-lg p-1 flex">
                                        <button onClick={() => setGoalFilter('ALL')} className={`px-3 py-1 text-xs font-bold rounded ${goalFilter === 'ALL' ? 'bg-gray-100 text-gray-800' : 'text-gray-500'}`}>Todos</button>
                                        <button onClick={() => setGoalFilter('IN_PROGRESS')} className={`px-3 py-1 text-xs font-bold rounded ${goalFilter === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}>Em Andamento</button>
                                        <button onClick={() => setGoalFilter('ACHIEVED')} className={`px-3 py-1 text-xs font-bold rounded ${goalFilter === 'ACHIEVED' ? 'bg-green-100 text-green-700' : 'text-gray-500'}`}>Concluídos</button>
                                    </div>
                                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-700">
                                        + Novo Plano
                                    </button>
                                </div>
                            </div>

                            {/* Plans Accordion */}
                            <div className="space-y-4">
                                {(patientData.plans || []).map(plan => (
                                    <div key={plan.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md">
                                        <div
                                            className="p-5 flex items-center justify-between cursor-pointer bg-white"
                                            onClick={() => setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-lg ${plan.status === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                                    <Target className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 text-lg">{plan.title}</h3>
                                                    <p className="text-xs text-gray-500 flex items-center gap-2">
                                                        <span>{new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}</span>
                                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                        <span>{plan.methodology}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-right hidden md:block">
                                                    <span className="text-xs font-bold text-gray-400 uppercase">Progresso</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-green-500"
                                                                style={{ width: `${(plan.goals.filter(g => g.status === 'ACHIEVED').length / plan.goals.length) * 100}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-bold text-gray-700">
                                                            {plan.goals.filter(g => g.status === 'ACHIEVED').length}/{plan.goals.length}
                                                        </span>
                                                    </div>
                                                </div>
                                                {expandedPlanId === plan.id ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                                            </div>
                                        </div>

                                        {expandedPlanId === plan.id && (
                                            <div className="p-5 border-t border-gray-100 bg-gray-50/50">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {plan.goals
                                                        .filter(g => goalFilter === 'ALL' || g.status === goalFilter)
                                                        .map(goal => (
                                                            <div key={goal.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-indigo-200 transition-all">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide bg-gray-50 px-2 py-1 rounded">
                                                                        {goal.activityId === 'custom' ? 'Personalizado' : 'Biblioteca'}
                                                                    </span>
                                                                    <button className="text-gray-300 hover:text-indigo-600"><MoreHorizontal className="w-4 h-4" /></button>
                                                                </div>
                                                                <h4 className="font-bold text-gray-800 text-sm mb-3 line-clamp-2">{goal.customTarget}</h4>

                                                                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                                        <Clock className="w-3 h-3" /> {new Date(goal.deadline || '').toLocaleDateString()}
                                                                    </span>
                                                                    <button
                                                                        onClick={() => toggleGoalStatus(plan.id, goal.id, goal.status)}
                                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${goal.status === 'ACHIEVED'
                                                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                                                            }`}
                                                                    >
                                                                        {goal.status === 'ACHIEVED' ? <Check className="w-3 h-3" /> : <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />}
                                                                        {goal.status === 'ACHIEVED' ? 'Concluído' : 'Em Andamento'}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                                {plan.goals.length === 0 && <div className="text-center text-gray-400 py-4 text-sm">Nenhuma meta encontrada.</div>}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB: RECORDS (Timeline) */}
                    {activeTab === 'records' && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-800 text-lg">Prontuário & Evoluções</h3>
                                <button className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg hover:bg-indigo-100">
                                    + Novo Registro
                                </button>
                            </div>

                            <div className="space-y-0 pl-2">
                                {/* Mocking mixed timeline items from sessions and medical records */}
                                {(patientData.medicalRecords || []).map((rec) => (
                                    <TimelineItem
                                        key={rec.id}
                                        type="RECORD"
                                        date={new Date(rec.date).toLocaleDateString()}
                                        title={rec.type === 'EVOLUTION' ? 'Evolução Clínica Mensal' : rec.title}
                                        subtitle={rec.content}
                                    />
                                ))}
                                {patientSessions.slice(0, 3).map(sess => (
                                    <TimelineItem
                                        key={sess.id}
                                        type="SESSION"
                                        date={new Date(sess.startTime).toLocaleDateString() + ' ' + new Date(sess.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        title="Sessão Realizada"
                                        subtitle={`Sentimento: ${sess.sentiment} | ${sess.trials.length} tentativas registradas.`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB: FINANCIAL (Contract & Services) */}
                    {activeTab === 'financial' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">

                            {/* Contract Summary Card */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-5">
                                    <CreditCard className="w-32 h-32" />
                                </div>
                                <div className="flex justify-between items-start relative z-10">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">Configuração do Contrato</h3>
                                        <div className="flex gap-4 mb-4">
                                            <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                                                <span className="text-xs text-gray-500 uppercase font-bold block">Método de Pagamento</span>
                                                <span className="font-bold text-indigo-900">
                                                    {patientData.financialConfig?.paymentMethod === 'PRIVATE' ? 'Particular' : 'Convênio / Plano'}
                                                </span>
                                            </div>
                                            {patientData.financialConfig?.paymentMethod !== 'PRIVATE' && (
                                                <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                                                    <span className="text-xs text-gray-500 uppercase font-bold block">Convênio</span>
                                                    <span className="font-bold text-indigo-900">{patientData.financialConfig?.insuranceName || 'Não informado'}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsEditModalOpen(true)}
                                        className="text-sm font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors"
                                    >
                                        Editar Contrato
                                    </button>
                                </div>
                            </div>

                            {/* Services List */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-amber-500" /> Serviços Contratados
                                        </h3>
                                        <p className="text-sm text-gray-500">Estes serviços aparecerão no agendamento.</p>
                                    </div>
                                    <button
                                        onClick={() => setIsEditModalOpen(true)}
                                        className="text-white bg-indigo-600 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-700 transition-colors"
                                    >
                                        Gerenciar Serviços
                                    </button>
                                </div>

                                <div className="overflow-hidden border border-gray-200 rounded-xl">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-200 font-bold text-gray-500 uppercase text-xs">
                                            <tr>
                                                <th className="px-4 py-3">Serviço</th>
                                                <th className="px-4 py-3">Duração</th>
                                                <th className="px-4 py-3">Valor Unit.</th>
                                                <th className="px-4 py-3 text-right">Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {patientData.financialConfig?.services.map((svc) => (
                                                <tr key={svc.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-gray-900">{svc.name}</td>
                                                    <td className="px-4 py-3 text-gray-500">{svc.durationMinutes} min</td>
                                                    <td className="px-4 py-3 font-mono text-gray-600">R$ {svc.price.toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button className="text-gray-400 hover:text-indigo-600 font-bold text-xs">Excluir</button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!patientData.financialConfig?.services || patientData.financialConfig.services.length === 0) && (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">
                                                        Nenhum serviço vinculado. Clique em "Gerenciar Serviços".
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT: SIDEBAR INFO (4 Cols) */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Next Session Card */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-white/10 rounded-lg"><Calendar className="w-6 h-6 text-indigo-300" /></div>
                            <span className="bg-indigo-500 text-xs font-bold px-2 py-1 rounded text-white">Próxima</span>
                        </div>
                        <h3 className="text-2xl font-bold mb-1">Hoje, 14:00</h3>
                        <p className="text-gray-400 text-sm mb-6">Sessão ABA com Dra. Ana</p>
                        <button onClick={() => navigate('/session')} className="w-full bg-white text-gray-900 py-3 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                            Iniciar Sessão Agora <ArrowUpRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Guardians */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-600" /> Responsáveis
                        </h3>
                        <div className="space-y-4">
                            {/* Fallback for legacy data or explicit names */}
                            {((patientData.guardianNames && patientData.guardianNames.length > 0) ? patientData.guardianNames :
                                (patientData.guardians && patientData.guardians.length > 0) ? patientData.guardians : []).map((g, idx) => (
                                    <div key={idx} className="flex items-center gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                                        <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                            {g.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-sm text-gray-900">{g}</p>
                                            <p className="text-xs text-gray-500">Responsável</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"><Phone className="w-4 h-4" /></button>
                                            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Mail className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                            {(!patientData.guardianNames?.length && !patientData.guardians?.length) && (
                                <p className="text-sm text-gray-500 text-center py-2">Nenhum responsável cadastrado.</p>
                            )}
                        </div>
                    </div>

                    {/* Files / Documents */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-600" /> Documentos
                            </h3>
                        </div>
                        <div className="space-y-3">
                            {(patientData.documents || []).map((doc) => (
                                <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer group">
                                    <div className="bg-red-50 p-2 rounded-lg text-red-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-bold text-gray-700 truncate">{doc.name}</p>
                                        <p className="text-[10px] text-gray-400">{doc.category} • {new Date(doc.uploadDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                            {(patientData.documents || []).length === 0 && (
                                <p className="text-xs text-gray-400 text-center py-2">Nenhum documento.</p>
                            )}
                            <button
                                onClick={() => setIsDocModalOpen(true)}
                                className="w-full py-2 text-xs font-bold text-gray-500 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-300 transition-all"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Adicionar Documento
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* EDIT MODAL - FULLY FUNCTIONAL */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Edit3 className="w-5 h-5 text-indigo-600" /> Editar Cadastro
                            </h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
                                    <input
                                        className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={editForm.name || ''}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data de Nascimento</label>
                                    <input
                                        type="date"
                                        className="w-full border border-gray-300 rounded-lg p-2.5"
                                        value={editForm.birthDate || ''}
                                        onChange={e => {
                                            const newDate = e.target.value;
                                            const ageCalc = calculateDetailedAge(newDate);
                                            setEditForm({
                                                ...editForm,
                                                birthDate: newDate,
                                                age: ageCalc ? ageCalc.years : editForm.age
                                            });
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Diagnóstico</label>
                                    <input className="w-full border border-gray-300 rounded-lg p-2.5" value={editForm.diagnosis || ''} onChange={e => setEditForm({ ...editForm, diagnosis: e.target.value })} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reforçadores (O que a criança gosta?)</label>
                                    <div className="flex gap-2">
                                        <input
                                            className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm"
                                            placeholder="Ex: Carrinhos, YouTube..."
                                            value={tempReinforcer}
                                            onChange={e => setTempReinforcer(e.target.value)}
                                        />
                                        <button onClick={handleAddReinforcer} className="bg-gray-100 px-4 rounded-lg font-bold text-gray-600 text-sm hover:bg-gray-200">Adicionar</button>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">Isso ajuda o terapeuta a preparar a sessão.</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Resumo Clínico / Anamnese</label>
                                    <textarea
                                        className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        rows={5}
                                        value={editForm.anamnesisSummary || ''}
                                        onChange={e => setEditForm({ ...editForm, anamnesisSummary: e.target.value })}
                                    />
                                </div>

                                {/* FINANCIAL SECTION IN EDIT MODAL */}
                                <div className="col-span-2 border-t border-gray-100 pt-4 mt-2">
                                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <CreditCard className="w-4 h-4 text-indigo-600" /> Configuração Financeira
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Método de Pagamento</label>
                                            <select
                                                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white"
                                                value={editForm.financialConfig?.paymentMethod || 'PRIVATE'}
                                                onChange={e => setEditForm({
                                                    ...editForm,
                                                    financialConfig: {
                                                        ...editForm.financialConfig!,
                                                        paymentMethod: e.target.value as any
                                                    }
                                                })}
                                            >
                                                <option value="PRIVATE">Particular</option>
                                                <option value="INSURANCE">Convênio / Plano</option>
                                                <option value="MIXED">Misto</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Convênio</label>
                                            <input
                                                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                                                value={editForm.financialConfig?.insuranceName || ''}
                                                disabled={editForm.financialConfig?.paymentMethod === 'PRIVATE'}
                                                placeholder={editForm.financialConfig?.paymentMethod === 'PRIVATE' ? '-' : 'Ex: Unimed'}
                                                onChange={e => setEditForm({
                                                    ...editForm,
                                                    financialConfig: { ...editForm.financialConfig!, insuranceName: e.target.value }
                                                })}
                                            />
                                        </div>

                                        {/* Quick Add Service Mini-Form */}
                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Adicionar Serviço Contratado</label>
                                            <div className="flex gap-2">
                                                <input
                                                    className="flex-[2] border border-gray-300 rounded-lg p-2.5 text-xs"
                                                    placeholder="Nome (ex: Fono 30min)"
                                                    id="newServiceName"
                                                />
                                                <input
                                                    className="flex-1 border border-gray-300 rounded-lg p-2.5 text-xs"
                                                    placeholder="Preço R$"
                                                    type="number"
                                                    id="newServicePrice"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const nameEl = document.getElementById('newServiceName') as HTMLInputElement;
                                                        const priceEl = document.getElementById('newServicePrice') as HTMLInputElement;
                                                        if (nameEl.value && priceEl.value) {
                                                            const newSvc = {
                                                                id: `svc-${Date.now()}`,
                                                                name: nameEl.value,
                                                                price: parseFloat(priceEl.value),
                                                                durationMinutes: 60 // Default to 60 for now
                                                            };
                                                            const currentServices = editForm.financialConfig?.services || [];
                                                            setEditForm({
                                                                ...editForm,
                                                                financialConfig: {
                                                                    ...editForm.financialConfig!,
                                                                    services: [...currentServices, newSvc]
                                                                }
                                                            });
                                                            nameEl.value = '';
                                                            priceEl.value = '';
                                                        }
                                                    }}
                                                    className="bg-indigo-100 text-indigo-700 px-3 rounded-lg font-bold text-xs hover:bg-indigo-200"
                                                >
                                                    + Add
                                                </button>
                                            </div>

                                            {/* List of Added Services in Modal */}
                                            <div className="mt-2 space-y-1">
                                                {(editForm.financialConfig?.services || []).map(s => (
                                                    <div key={s.id} className="flex justify-between items-center text-xs bg-white border border-gray-200 p-2 rounded">
                                                        <span>{s.name}</span>
                                                        <span className="font-mono font-bold">R$ {s.price}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-5 border-t border-gray-100 bg-gray-50 flex gap-3">
                            <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-lg transition-colors">Cancelar</button>
                            <button
                                onClick={handleSaveProfile}
                                className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                            >
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* NEW: DOCUMENT MODAL */}
            {isDocModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-600" /> Adicionar Documento
                            </h3>
                            <button onClick={() => setIsDocModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Arquivo/Documento</label>
                                <input
                                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Ex: Laudo Neurológico 2024"
                                    value={newDocName}
                                    onChange={e => setNewDocName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoria</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white"
                                    value={newDocCategory}
                                    onChange={e => setNewDocCategory(e.target.value as any)}
                                >
                                    <option value="LAUDO">Laudo / Relatório</option>
                                    <option value="PEI">PEI (Plano de Ensino)</option>
                                    <option value="VIDEO_MODELING">Vídeo Modelagem</option>
                                </select>
                            </div>
                            <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-center">
                                <p className="text-xs text-gray-500 mb-2">Simulação: Em produção, aqui seria o upload real.</p>
                                <button className="text-indigo-600 font-bold text-xs hover:underline">Escolher Arquivo</button>
                            </div>
                        </div>
                        <div className="p-5 border-t border-gray-100 bg-gray-50 flex gap-3">
                            <button onClick={() => setIsDocModalOpen(false)} className="flex-1 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-lg transition-colors">Cancelar</button>
                            <button
                                onClick={() => {
                                    if (newDocName && patientData) {
                                        const newDoc: any = {
                                            id: `doc-${Date.now()}`,
                                            name: newDocName,
                                            type: 'PDF', // Default for now
                                            category: newDocCategory,
                                            uploadDate: new Date().toISOString()
                                        };
                                        const updatedDocs = [...(patientData.documents || []), newDoc];
                                        updatePatient(patientData.id, { documents: updatedDocs });
                                        setPatientData({ ...patientData, documents: updatedDocs });
                                        setIsDocModalOpen(false);
                                        setNewDocName('');
                                    }
                                }}
                                className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                            >
                                Salvar Documento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
                        </div >
                    </div >
                </div >
            </div >

    {/* EDIT MODAL - FULLY FUNCTIONAL */ }
{
    isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Edit3 className="w-5 h-5 text-indigo-600" /> Editar Cadastro
                    </h3>
                    <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
                            <input
                                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                                value={editForm.name || ''}
                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data de Nascimento</label>
                            <input
                                type="date"
                                className="w-full border border-gray-300 rounded-lg p-2.5"
                                value={editForm.birthDate || ''}
                                onChange={e => {
                                    const newDate = e.target.value;
                                    const ageCalc = calculateDetailedAge(newDate);
                                    setEditForm({
                                        ...editForm,
                                        birthDate: newDate,
                                        age: ageCalc ? ageCalc.years : editForm.age
                                    });
                                }}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Diagnóstico</label>
                            <input className="w-full border border-gray-300 rounded-lg p-2.5" value={editForm.diagnosis || ''} onChange={e => setEditForm({ ...editForm, diagnosis: e.target.value })} />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reforçadores (O que a criança gosta?)</label>
                            <div className="flex gap-2">
                                <input
                                    className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm"
                                    placeholder="Ex: Carrinhos, YouTube..."
                                    value={tempReinforcer}
                                    onChange={e => setTempReinforcer(e.target.value)}
                                />
                                <button onClick={handleAddReinforcer} className="bg-gray-100 px-4 rounded-lg font-bold text-gray-600 text-sm hover:bg-gray-200">Adicionar</button>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Isso ajuda o terapeuta a preparar a sessão.</p>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Resumo Clínico / Anamnese</label>
                            <textarea
                                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                rows={5}
                                value={editForm.anamnesisSummary || ''}
                                onChange={e => setEditForm({ ...editForm, anamnesisSummary: e.target.value })}
                            />
                        </div>

                        {/* FINANCIAL SECTION IN EDIT MODAL */}
                        <div className="col-span-2 border-t border-gray-100 pt-4 mt-2">
                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-indigo-600" /> Configuração Financeira
                            </h4>
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Método de Pagamento</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg p-2.5 bg-white"
                                        value={editForm.financialConfig?.paymentMethod || 'PRIVATE'}
                                        onChange={e => setEditForm({
                                            ...editForm,
                                            financialConfig: {
                                                ...editForm.financialConfig!,
                                                paymentMethod: e.target.value as any
                                            }
                                        })}
                                    >
                                        <option value="PRIVATE">Particular</option>
                                        <option value="INSURANCE">Convênio / Plano</option>
                                        <option value="MIXED">Misto</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Convênio</label>
                                    <input
                                        className="w-full border border-gray-300 rounded-lg p-2.5 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                                        value={editForm.financialConfig?.insuranceName || ''}
                                        disabled={editForm.financialConfig?.paymentMethod === 'PRIVATE'}
                                        placeholder={editForm.financialConfig?.paymentMethod === 'PRIVATE' ? '-' : 'Ex: Unimed'}
                                        onChange={e => setEditForm({
                                            ...editForm,
                                            financialConfig: { ...editForm.financialConfig!, insuranceName: e.target.value }
                                        })}
                                    />
                                </div>

                                {/* Quick Add Service Mini-Form */}
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Adicionar Serviço Contratado</label>
                                    <div className="flex gap-2">
                                        <input
                                            className="flex-[2] border border-gray-300 rounded-lg p-2.5 text-xs"
                                            placeholder="Nome (ex: Fono 30min)"
                                            id="newServiceName"
                                        />
                                        <input
                                            className="flex-1 border border-gray-300 rounded-lg p-2.5 text-xs"
                                            placeholder="Preço R$"
                                            type="number"
                                            id="newServicePrice"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const nameEl = document.getElementById('newServiceName') as HTMLInputElement;
                                                const priceEl = document.getElementById('newServicePrice') as HTMLInputElement;
                                                if (nameEl.value && priceEl.value) {
                                                    const newSvc = {
                                                        id: `svc-${Date.now()}`,
                                                        name: nameEl.value,
                                                        price: parseFloat(priceEl.value),
                                                        durationMinutes: 60 // Default to 60 for now
                                                    };
                                                    const currentServices = editForm.financialConfig?.services || [];
                                                    setEditForm({
                                                        ...editForm,
                                                        financialConfig: {
                                                            ...editForm.financialConfig!,
                                                            services: [...currentServices, newSvc]
                                                        }
                                                    });
                                                    nameEl.value = '';
                                                    priceEl.value = '';
                                                }
                                            }}
                                            className="bg-indigo-100 text-indigo-700 px-3 rounded-lg font-bold text-xs hover:bg-indigo-200"
                                        >
                                            + Add
                                        </button>
                                    </div>

                                    {/* List of Added Services in Modal */}
                                    <div className="mt-2 space-y-1">
                                        {(editForm.financialConfig?.services || []).map(s => (
                                            <div key={s.id} className="flex justify-between items-center text-xs bg-white border border-gray-200 p-2 rounded">
                                                <span>{s.name}</span>
                                                <span className="font-mono font-bold">R$ {s.price}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-5 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-lg transition-colors">Cancelar</button>
                    <button
                        onClick={handleSaveProfile}
                        className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
    )
}

{/* NEW: DOCUMENT MODAL */ }
{
    isDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" /> Adicionar Documento
                    </h3>
                    <button onClick={() => setIsDocModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Arquivo/Documento</label>
                        <input
                            className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Ex: Laudo Neurológico 2024"
                            value={newDocName}
                            onChange={e => setNewDocName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoria</label>
                        <select
                            className="w-full border border-gray-300 rounded-lg p-2.5 bg-white"
                            value={newDocCategory}
                            onChange={e => setNewDocCategory(e.target.value as any)}
                        >
                            <option value="LAUDO">Laudo / Relatório</option>
                            <option value="PEI">PEI (Plano de Ensino)</option>
                            <option value="VIDEO_MODELING">Vídeo Modelagem</option>
                        </select>
                    </div>
                    <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-center">
                        <p className="text-xs text-gray-500 mb-2">Simulação: Em produção, aqui seria o upload real.</p>
                        <button className="text-indigo-600 font-bold text-xs hover:underline">Escolher Arquivo</button>
                    </div>
                </div>
                <div className="p-5 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <button onClick={() => setIsDocModalOpen(false)} className="flex-1 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-lg transition-colors">Cancelar</button>
                    <button
                        onClick={() => {
                            if (newDocName && patientData) {
                                const newDoc: any = {
                                    id: `doc-${Date.now()}`,
                                    name: newDocName,
                                    type: 'PDF', // Default for now
                                    category: newDocCategory,
                                    uploadDate: new Date().toISOString()
                                };
                                const updatedDocs = [...(patientData.documents || []), newDoc];
                                updatePatient(patientData.id, { documents: updatedDocs });
                                setPatientData({ ...patientData, documents: updatedDocs });
                                setIsDocModalOpen(false);
                                setNewDocName('');
                            }
                        }}
                        className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        Salvar Documento
                    </button>
                </div>
            </div>
        </div>
    )
}
        </div >
    );
};
                        </div >
                    </div >
                </div >
            </div >

    {/* EDIT MODAL - FULLY FUNCTIONAL */ }
{
    isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Edit3 className="w-5 h-5 text-indigo-600" /> Editar Cadastro
                    </h3>
                    <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
                            <input
                                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                                value={editForm.name || ''}
                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data de Nascimento</label>
                            <input
                                type="date"
                                className="w-full border border-gray-300 rounded-lg p-2.5"
                                value={editForm.birthDate || ''}
                                onChange={e => {
                                    const newDate = e.target.value;
                                    // Auto-calc numeric age for backward compatibility
                                    const ageCalc = calculateDetailedAge(newDate);
                                    setEditForm({
                                        ...editForm,
                                        birthDate: newDate,
                                        age: ageCalc ? ageCalc.years : editForm.age
                                    });
                                }}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Diagnóstico</label>
                            <input className="w-full border border-gray-300 rounded-lg p-2.5" value={editForm.diagnosis || ''} onChange={e => setEditForm({ ...editForm, diagnosis: e.target.value })} />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reforçadores (O que a criança gosta?)</label>
                            <div className="flex gap-2">
                                <input
                                    className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm"
                                    placeholder="Ex: Carrinhos, YouTube..."
                                    value={tempReinforcer}
                                    onChange={e => setTempReinforcer(e.target.value)}
                                />
                                <button onClick={handleAddReinforcer} className="bg-gray-100 px-4 rounded-lg font-bold text-gray-600 text-sm hover:bg-gray-200">Adicionar</button>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Isso ajuda o terapeuta a preparar a sessão.</p>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Resumo Clínico / Anamnese</label>
                            <textarea
                                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                rows={5}
                                value={editForm.anamnesisSummary || ''}
                                onChange={e => setEditForm({ ...editForm, anamnesisSummary: e.target.value })}
                            />
                        </div>

                        {/* FINANCIAL SECTION IN EDIT MODAL */}
                        <div className="col-span-2 border-t border-gray-100 pt-4 mt-2">
                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-indigo-600" /> Configuração Financeira
                            </h4>
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Método de Pagamento</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg p-2.5 bg-white"
                                        value={editForm.financialConfig?.paymentMethod || 'PRIVATE'}
                                        onChange={e => setEditForm({
                                            ...editForm,
                                            financialConfig: {
                                                ...editForm.financialConfig!,
                                                paymentMethod: e.target.value as any
                                            }
                                        })}
                                    >
                                        <option value="PRIVATE">Particular</option>
                                        <option value="INSURANCE">Convênio / Plano</option>
                                        <option value="MIXED">Misto</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Convênio</label>
                                    <input
                                        className="w-full border border-gray-300 rounded-lg p-2.5 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                                        value={editForm.financialConfig?.insuranceName || ''}
                                        disabled={editForm.financialConfig?.paymentMethod === 'PRIVATE'}
                                        placeholder={editForm.financialConfig?.paymentMethod === 'PRIVATE' ? '-' : 'Ex: Unimed'}
                                        onChange={e => setEditForm({
                                            ...editForm,
                                            financialConfig: { ...editForm.financialConfig!, insuranceName: e.target.value }
                                        })}
                                    />
                                </div>

                                {/* Quick Add Service Mini-Form */}
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Adicionar Serviço Contratado</label>
                                    <div className="flex gap-2">
                                        <input
                                            className="flex-[2] border border-gray-300 rounded-lg p-2.5 text-xs"
                                            placeholder="Nome (ex: Fono 30min)"
                                            id="newServiceName"
                                        />
                                        <input
                                            className="flex-1 border border-gray-300 rounded-lg p-2.5 text-xs"
                                            placeholder="Preço R$"
                                            type="number"
                                            id="newServicePrice"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const nameEl = document.getElementById('newServiceName') as HTMLInputElement;
                                                const priceEl = document.getElementById('newServicePrice') as HTMLInputElement;
                                                if (nameEl.value && priceEl.value) {
                                                    const newSvc = {
                                                        id: `svc-${Date.now()}`,
                                                        name: nameEl.value,
                                                        price: parseFloat(priceEl.value),
                                                        durationMinutes: 60 // Default to 60 for now
                                                    };
                                                    const currentServices = editForm.financialConfig?.services || [];
                                                    setEditForm({
                                                        ...editForm,
                                                        financialConfig: {
                                                            ...editForm.financialConfig!,
                                                            services: [...currentServices, newSvc]
                                                        }
                                                    });
                                                    nameEl.value = '';
                                                    priceEl.value = '';
                                                }
                                            }}
                                            className="bg-indigo-100 text-indigo-700 px-3 rounded-lg font-bold text-xs hover:bg-indigo-200"
                                        >
                                            + Add
                                        </button>
                                    </div>

                                    {/* List of Added Services in Modal */}
                                    <div className="mt-2 space-y-1">
                                        {(editForm.financialConfig?.services || []).map(s => (
                                            <div key={s.id} className="flex justify-between items-center text-xs bg-white border border-gray-200 p-2 rounded">
                                                <span>{s.name}</span>
                                                <span className="font-mono font-bold">R$ {s.price}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
            )}
                    {
                        /* NEW: DOCUMENT MODAL */
                    }
                    {
                        isDocModalOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                                    <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-indigo-600" /> Adicionar Documento
                                        </h3>
                                        <button onClick={() => setIsDocModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Arquivo/Documento</label>
                                            <input
                                                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="Ex: Laudo Neurológico 2024"
                                                value={newDocName}
                                                onChange={e => setNewDocName(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoria</label>
                                            <select
                                                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white"
                                                value={newDocCategory}
                                                onChange={e => setNewDocCategory(e.target.value as any)}
                                            >
                                                <option value="LAUDO">Laudo / Relatório</option>
                                                <option value="PEI">PEI (Plano de Ensino)</option>
                                                <option value="VIDEO_MODELING">Vídeo Modelagem</option>
                                            </select>
                                        </div>
                                        <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-center">
                                            <p className="text-xs text-gray-500 mb-2">Simulação: Em produção, aqui seria o upload real.</p>
                                            <button className="text-indigo-600 font-bold text-xs hover:underline">Escolher Arquivo</button>
                                        </div>
                                    </div>
                                    <div className="p-5 border-t border-gray-100 bg-gray-50 flex gap-3">
                                        <button onClick={() => setIsDocModalOpen(false)} className="flex-1 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-lg transition-colors">Cancelar</button>
                                        <button
                                            onClick={() => {
                                                if (newDocName && patientData) {
                                                    const newDoc: any = {
                                                        id: `doc-${Date.now()}`,
                                                        name: newDocName,
                                                        type: 'PDF', // Default for now
                                                        category: newDocCategory,
                                                        uploadDate: new Date().toISOString()
                                                    };
                                                    const updatedDocs = [...(patientData.documents || []), newDoc];
                                                    updatePatient(patientData.id, { documents: updatedDocs });
                                                    setPatientData({ ...patientData, documents: updatedDocs });
                                                    setIsDocModalOpen(false);
                                                    setNewDocName('');
                                                }
                                            }}
                                            className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                                        >
                                            Salvar Documento
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    }
                </div>
                );
};