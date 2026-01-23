import React, { useState, useEffect } from 'react';
import { MOCK_CLINICS } from '../constants';
import * as ApiService from '../services/ApiService'; // Use API instead of LocalDatabase
import { Clinic, User as UserType } from '../types';
import {
    Building2, Plus, Users, CheckCircle, Search, Globe,
    CreditCard, Layers, Lock, Unlock,
    Calendar, DollarSign, BarChart3, Box, MessageSquare,
    XCircle, CheckSquare, Edit3, Trash2, ShieldCheck,
    Activity, MapPin, User, FileText, Phone, Mail,
    TrendingUp, AlertTriangle, ArrowUpRight, Monitor, Settings,
    LogOut, Filter, ChevronRight, Download, Save, Palette
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

// --- DEFINIÇÃO DE MÓDULOS (PERMISSÕES) ---
export type ModuleType = 'SCHEDULE' | 'FINANCIAL' | 'TEAM' | 'REPORTS' | 'INVENTORY' | 'COMMUNICATION';

export interface SaaSPlan {
    id: string;
    name: string;
    price: number;
    maxUsers: number;
    storageGB: number;
    features: string[];
    modules: ModuleType[];
    color: string;
    badgeColor: string;
    recommended?: boolean;
}

// --- DADOS ESTRUTURAIS ---
export const AVAILABLE_MODULES: { key: ModuleType; label: string; description: string; icon: any }[] = [
    { key: 'SCHEDULE', label: 'Agenda Inteligente', description: 'Gestão de sessões, recorrência e salas.', icon: Calendar },
    { key: 'COMMUNICATION', label: 'Portal da Família', description: 'Chat, diário e troca de arquivos.', icon: MessageSquare },
    { key: 'REPORTS', label: 'B.I. Clínico', description: 'Gráficos de evolução, IA e análise de dados.', icon: BarChart3 },
    { key: 'INVENTORY', label: 'Gestão de Recursos', description: 'Estoque de materiais e biblioteca de atividades.', icon: Box },
    { key: 'FINANCIAL', label: 'ERP Financeiro', description: 'Faturamento, repasse e fluxo de caixa.', icon: DollarSign },
    { key: 'TEAM', label: 'RH & Produtividade', description: 'Gestão de contratos, folha e performance.', icon: Users },
];

export const INITIAL_PLANS: SaaSPlan[] = [
    {
        id: 'BASIC',
        name: 'Start',
        price: 199.00,
        maxUsers: 3,
        storageGB: 10,
        features: ['Agenda Básica', 'Diário'],
        modules: ['SCHEDULE', 'COMMUNICATION'],
        color: 'border-gray-200',
        badgeColor: 'bg-gray-100 text-gray-600'
    },
    {
        id: 'PRO',
        name: 'Growth',
        price: 499.00,
        maxUsers: 10,
        storageGB: 50,
        features: ['Relatórios', 'Estoque'],
        modules: ['SCHEDULE', 'COMMUNICATION', 'REPORTS', 'INVENTORY', 'TEAM'],
        color: 'border-blue-200',
        badgeColor: 'bg-blue-100 text-blue-600',
        recommended: true
    },
    {
        id: 'ENTERPRISE',
        name: 'Scale',
        price: 999.00,
        maxUsers: 50,
        storageGB: 500,
        features: ['Financeiro', 'RH Completo'],
        modules: ['SCHEDULE', 'COMMUNICATION', 'REPORTS', 'INVENTORY', 'FINANCIAL', 'TEAM'],
        color: 'border-purple-200',
        badgeColor: 'bg-purple-100 text-purple-600'
    }
];

const MRR_DATA = [
    { month: 'Jan', value: 12500 }, { month: 'Fev', value: 13200 },
    { month: 'Mar', value: 14800 }, { month: 'Abr', value: 18500 },
    { month: 'Mai', value: 22000 }, { month: 'Jun', value: 25400 },
];

const CHURN_DATA = [
    { name: 'Ativos', value: 95, color: '#10B981' },
    { name: 'Churn', value: 5, color: '#EF4444' },
];

// --- CLINIC FORM DEFAULT STATE ---
const EMPTY_CLINIC_FORM: Partial<Clinic> = {
    name: '',
    corporateName: '',
    cnpj: '',
    email: '',
    phone: '',
    address: { street: '', number: '', district: '', city: '', state: '', zip: '' },
    plan: 'PRO',
    active: true,
    status: 'ACTIVE',
    maxUsers: 5,
    subscription: {
        startDate: new Date().toISOString().split('T')[0],
        nextDueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
        dueDay: 10,
        value: 499.00,
        paymentMethod: 'BOLETO',
        isAutoRenew: true
    },
    adminUserId: '',
    adminTempPassword: ''
};

export const SaaSAdmin: React.FC = () => {
    const [activeView, setActiveView] = useState<'DASHBOARD' | 'CLINICS' | 'PLANS' | 'USERS'>('DASHBOARD');

    // Data - Initialize from ApiService
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [users, setUsers] = useState<UserType[]>([]);
    const [plans, setPlans] = useState<SaaSPlan[]>(INITIAL_PLANS);
    const [searchTerm, setSearchTerm] = useState('');

    // Load data from API on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const [fetchedClinics, fetchedUsers] = await Promise.all([
                    ApiService.getClinics(),
                    ApiService.getUsers()
                ]);
                setClinics(fetchedClinics || []);
                setUsers(fetchedUsers || []);
            } catch (error) {
                console.error("Failed to load SaaS data:", error);
            }
        };
        loadData();
    }, []);

    // Modals
    const [isClinicModalOpen, setIsClinicModalOpen] = useState(false);
    const [clinicWizardStep, setClinicWizardStep] = useState<'CORP' | 'ADDR' | 'ADMIN' | 'FINANCE'>('CORP');
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);

    // Edit States
    const [editingClinic, setEditingClinic] = useState<Partial<Clinic>>(EMPTY_CLINIC_FORM);
    const [adminForm, setAdminForm] = useState({ name: '', email: '' });
    const [editingPlan, setEditingPlan] = useState<Partial<SaaSPlan>>({ modules: [] });
    const [editingUser, setEditingUser] = useState<Partial<UserType>>({});


    // --- LOGIC: CLINICS ---

    // --- LOGIC: CLINICS ---

    // Helper to refresh data
    const refreshData = async () => {
        const [fetchedClinics, fetchedUsers] = await Promise.all([
            ApiService.getClinics(),
            ApiService.getUsers()
        ]);
        setClinics(fetchedClinics || []);
        setUsers(fetchedUsers || []);
    };

    const handleSaveClinic = async () => {
        if (!editingClinic.name || !editingClinic.cnpj) {
            alert("Por favor, preencha os dados obrigatórios (Nome e CNPJ).");
            return;
        }

        try {
            if (editingClinic.id) {
                // Update existing clinic
                await ApiService.updateClinic(editingClinic.id, editingClinic);

                // If password or admin email is changed
                if (editingClinic.adminTempPassword && editingClinic.adminUserId) {
                    await ApiService.updateUser(editingClinic.adminUserId, {
                        password: editingClinic.adminTempPassword
                    });
                }
            } else {
                // Create new clinic
                const newClinicId = `c-${Date.now()}`;
                const newAdminId = `admin-${Date.now()}`;

                const newClinic: Clinic = {
                    ...editingClinic,
                    id: newClinicId,
                    adminUserId: newAdminId
                } as Clinic;

                // Create Admin User
                const newAdminUser: UserType = {
                    id: newAdminId,
                    clinicId: newClinicId,
                    name: adminForm.name || 'Admin',
                    email: adminForm.email || editingClinic.email, // Fallback
                    password: editingClinic.adminTempPassword || '123456',
                    role: 'ADMIN',
                    avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(adminForm.name || 'Admin')}&background=random`
                };

                // Create Clinic FIRST
                await ApiService.createClinic(newClinic);
                // Then Create User
                await ApiService.createUser(newAdminUser);
            }

            await refreshData();
            setIsClinicModalOpen(false);
            setAdminForm({ name: '', email: '' });
            alert("Clínica e Usuário Admin salvos com sucesso!");

        } catch (error) {
            console.error("Error saving clinic:", error);
            alert("Erro ao salvar clínica. Verifique o console.");
        }
    };

    const toggleClinicStatus = async (id: string) => {
        const clinic = clinics.find(c => c.id === id);
        if (!clinic) return;

        try {
            await ApiService.updateClinic(id, {
                active: !clinic.active,
                status: !clinic.active ? 'ACTIVE' : 'BLOCKED'
            });
            await refreshData();
        } catch (error) {
            console.error("Error toggling clinic status:", error);
        }
    };

    const openNewClinicModal = () => {
        setEditingClinic(EMPTY_CLINIC_FORM);
        setClinicWizardStep('CORP');
        setIsClinicModalOpen(true);
    };

    const openEditClinicModal = (clinic: Clinic) => {
        setEditingClinic({ ...clinic });
        setClinicWizardStep('CORP');
        setIsClinicModalOpen(true);
    };

    const filteredClinics = clinics.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cnpj.includes(searchTerm)
    );

    // --- LOGIC: PLANS ---

    const openNewPlanModal = () => {
        setEditingPlan({
            name: '',
            price: 0,
            maxUsers: 5,
            modules: ['SCHEDULE'],
            features: [],
            color: 'border-gray-200',
            badgeColor: 'bg-gray-100 text-gray-600'
        });
        setIsPlanModalOpen(true);
    };

    const openEditPlanModal = (plan: SaaSPlan) => {
        setEditingPlan({ ...plan });
        setIsPlanModalOpen(true);
    };

    const togglePlanModule = (moduleKey: ModuleType) => {
        const currentModules = editingPlan.modules || [];
        if (currentModules.includes(moduleKey)) {
            setEditingPlan({ ...editingPlan, modules: currentModules.filter(m => m !== moduleKey) });
        } else {
            setEditingPlan({ ...editingPlan, modules: [...currentModules, moduleKey] });
        }
    };

    const handleSavePlan = () => {
        if (!editingPlan.name) return;

        if (editingPlan.id) {
            setPlans(plans.map(p => p.id === editingPlan.id ? { ...p, ...editingPlan } as SaaSPlan : p));
        } else {
            const newPlan: SaaSPlan = {
                ...editingPlan as SaaSPlan,
                id: editingPlan.name.toUpperCase().replace(/\s+/g, '_'),
                storageGB: 10,
                features: editingPlan.modules?.map(m => AVAILABLE_MODULES.find(am => am.key === m)?.label || m) || []
            };
            setPlans([...plans, newPlan]);
        }
        setIsPlanModalOpen(false);
    };

    const handleDeletePlan = () => {
        if (!editingPlan.id) return;
        if (confirm('Tem certeza? Clínicas neste plano precisarão ser migradas.')) {
            setPlans(plans.filter(p => p.id !== editingPlan.id));
            setIsPlanModalOpen(false);
        }
    };


    const openNewUserModal = () => {
        setEditingUser({
            role: 'THERAPIST',
            password: '123456', // Default simple password asking to change later
            active: true
        });
        setIsUserModalOpen(true);
    };

    const openEditUserModal = (user: UserType) => {
        setEditingUser({ ...user });
        setIsUserModalOpen(true);
    };

    const handleSaveUser = async () => {
        // Validation relaxed: Clinic is OPTIONAL for testing purposes
        if (!editingUser.name || !editingUser.email) {
            alert("Nome e Email são obrigatórios.");
            return;
        }

        try {
            if (editingUser.id) {
                // Update
                await ApiService.updateUser(editingUser.id, editingUser);
            } else {
                // Create
                const newUser: UserType = {
                    ...editingUser,
                    id: `u-${Date.now()}`,
                    avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(editingUser.name)}&background=random`
                } as UserType;
                await ApiService.createUser(newUser);
            }

            await refreshData();
            setIsUserModalOpen(false);
        } catch (error) {
            console.error("Error saving user:", error);
            alert("Erro ao salvar usuário.");
        }
    };

    const handleDeleteUser = async () => {
        if (!editingUser.id) return;
        if (confirm('Tem certeza que deseja remover este usuário?')) {
            try {
                await ApiService.deleteUser(editingUser.id);
                await refreshData();
                setIsUserModalOpen(false);
                alert('Usuário removido com sucesso!');
            } catch (error) {
                console.error("Error deleting user:", error);
                alert("Erro ao remover usuário.");
            }
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- COMPONENTS ---

    const StatCard = ({ title, value, sub, icon: Icon, colorClass }: any) => (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start justify-between group hover:shadow-md transition-all">
            <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                <p className={`text-xs font-medium mt-1 flex items-center gap-1 ${colorClass.text}`}>
                    <TrendingUp className="w-3 h-3" /> {sub}
                </p>
            </div>
            <div className={`p-3 rounded-xl ${colorClass.bg} ${colorClass.text} group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 md:pb-0">

            {/* === TOP BAR === */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-20 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-600 p-2 rounded-lg">
                        <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 leading-none">Painel Master SaaS</h1>
                        <p className="text-xs text-gray-500 mt-1">Administração Multi-Inquilino</p>
                    </div>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                    {[
                        { id: 'DASHBOARD', label: 'Visão Geral', icon: Activity },
                        { id: 'CLINICS', label: 'Clínicas (Tenants)', icon: Building2 },
                        { id: 'USERS', label: 'Usuários', icon: Users },
                        { id: 'PLANS', label: 'Planos & Config', icon: Layers },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveView(tab.id as any)}
                            className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${activeView === tab.id
                                ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-black/5'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" /> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-6 max-w-[1600px] mx-auto space-y-8">

                {/* === VIEW: DASHBOARD === */}
                {activeView === 'DASHBOARD' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        {/* KPI ROW */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <StatCard
                                title="Receita Recorrente (MRR)"
                                value="R$ 25.400"
                                sub="+12% vs mês anterior"
                                icon={DollarSign}
                                colorClass={{ bg: 'bg-green-100', text: 'text-green-600' }}
                            />
                            <StatCard
                                title="Clínicas Ativas"
                                value={clinics.filter(c => c.active).length.toString()}
                                sub="2 novas esta semana"
                                icon={Building2}
                                colorClass={{ bg: 'bg-blue-100', text: 'text-blue-600' }}
                            />
                            <StatCard
                                title="Usuários Totais"
                                value="142"
                                sub="Across all tenants"
                                icon={Users}
                                colorClass={{ bg: 'bg-purple-100', text: 'text-purple-600' }}
                            />
                            <StatCard
                                title="Churn Rate"
                                value="2.1%"
                                sub="Abaixo da média (5%)"
                                icon={AlertTriangle}
                                colorClass={{ bg: 'bg-orange-100', text: 'text-orange-600' }}
                            />
                        </div>

                        {/* CHARTS ROW */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-gray-800">Crescimento de Receita (MRR)</h3>
                                    <select className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 outline-none">
                                        <option>Últimos 6 meses</option>
                                        <option>Este Ano</option>
                                    </select>
                                </div>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer>
                                        <AreaChart data={MRR_DATA}>
                                            <defs>
                                                <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(val) => `R$${val / 1000}k`} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                            <Area type="monotone" dataKey="value" stroke="#4F46E5" fill="url(#colorMrr)" strokeWidth={3} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <h3 className="font-bold text-gray-800 mb-2">Saúde da Base</h3>
                                <p className="text-xs text-gray-500 mb-6">Distribuição de status das contas.</p>
                                <div className="h-[250px] w-full">
                                    <ResponsiveContainer>
                                        <BarChart data={CHURN_DATA} layout="vertical">
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={60} tick={{ fontSize: 12, fontWeight: 700 }} />
                                            <Bar dataKey="value" barSize={30} radius={[0, 4, 4, 0]}>
                                                {CHURN_DATA.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 p-4 bg-gray-50 rounded-xl text-center">
                                    <p className="text-xs text-gray-500">LTV Médio</p>
                                    <p className="text-xl font-bold text-gray-900">R$ 4.250</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* === VIEW: CLINICS (TENANTS) === */}
                {activeView === 'CLINICS' && (
                    <div className="space-y-6 animate-in fade-in">
                        {/* Actions Toolbar */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    placeholder="Buscar clínica, CNPJ ou email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                                <button className="px-4 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50">
                                    <Filter className="w-4 h-4" /> Filtros
                                </button>
                                <button
                                    onClick={openNewClinicModal}
                                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5"
                                >
                                    <Plus className="w-4 h-4" /> Nova Clínica
                                </button>
                            </div>
                        </div>

                        {/* Clinics Grid/Table */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 border-b border-gray-200 text-gray-500 text-xs uppercase font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Empresa / Tenant</th>
                                        <th className="px-6 py-4">Plano & Status</th>
                                        <th className="px-6 py-4">Vencimento</th>
                                        <th className="px-6 py-4">Usuários</th>
                                        <th className="px-6 py-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredClinics.map(clinic => {
                                        const plan = plans.find(p => p.id === clinic.plan);
                                        return (
                                            <tr key={clinic.id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm">
                                                            {clinic.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900 text-sm">{clinic.name}</p>
                                                            <p className="text-xs text-gray-500 font-mono">{clinic.cnpj}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1.5 items-start">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${clinic.active
                                                            ? 'bg-green-50 text-green-700 border-green-200'
                                                            : 'bg-red-50 text-red-700 border-red-200'
                                                            }`}>
                                                            {clinic.active ? 'Ativo' : 'Bloqueado'}
                                                        </span>
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${plan?.badgeColor || 'bg-gray-100'}`}>
                                                            {plan?.name || clinic.plan}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                        <span>Dia {clinic.subscription.dueDay}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-400 mt-0.5">Próx: {new Date(clinic.subscription.nextDueDate).toLocaleDateString()}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-full max-w-[80px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-indigo-500 w-3/4"></div>
                                                        </div>
                                                        <span className="text-xs font-medium text-gray-600">8/{clinic.maxUsers}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => openEditClinicModal(clinic)}
                                                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Editar"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => toggleClinicStatus(clinic.id)}
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Bloquear/Desbloquear"
                                                        >
                                                            {clinic.active ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                                        </button>
                                                        <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Login como Admin">
                                                            <Monitor className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* === VIEW: PLANS === */}
                {activeView === 'PLANS' && (
                    <div className="space-y-8 animate-in fade-in">
                        <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Planos & Monetização</h2>
                                <p className="text-gray-500 mt-1">Configure os níveis de acesso, preços e módulos.</p>
                            </div>
                            <button
                                onClick={openNewPlanModal}
                                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-sm flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Criar Novo Plano
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                            {plans.map(plan => (
                                <div
                                    key={plan.id}
                                    className={`relative bg-white rounded-3xl p-8 border-2 transition-all hover:-translate-y-2 hover:shadow-xl ${plan.color}`}
                                >
                                    {plan.recommended && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md">
                                            Mais Popular
                                        </div>
                                    )}
                                    <div className="text-center border-b border-gray-100 pb-6 mb-6">
                                        <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                                        <div className="mt-4 flex items-baseline justify-center gap-1">
                                            <span className="text-4xl font-extrabold text-gray-900">R$ {plan.price}</span>
                                            <span className="text-gray-500">/mês</span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-2">{plan.maxUsers} Usuários Incluídos</p>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        {AVAILABLE_MODULES.map(mod => {
                                            const included = plan.modules.includes(mod.key);
                                            return (
                                                <div key={mod.key} className={`flex items-start gap-3 ${included ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                                                    <CheckCircle className={`w-5 h-5 shrink-0 ${included ? 'text-green-500' : 'text-gray-300'}`} />
                                                    <div>
                                                        <span className="text-sm font-bold text-gray-800 block">{mod.label}</span>
                                                        {included && <span className="text-[10px] text-gray-500 leading-tight">{mod.description}</span>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={() => openEditPlanModal(plan)}
                                        className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Settings className="w-4 h-4" /> Configurar Plano
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* === VIEW: USERS === */}
                {activeView === 'USERS' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    placeholder="Buscar usuário por nome ou email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={openNewUserModal}
                                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5"
                            >
                                <Plus className="w-4 h-4" /> Novo Usuário
                            </button>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 border-b border-gray-200 text-gray-500 text-xs uppercase font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Usuário</th>
                                        <th className="px-6 py-4">Função</th>
                                        <th className="px-6 py-4">Clínica</th>
                                        <th className="px-6 py-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredUsers.map(user => {
                                        const userClinic = clinics.find(c => c.id === user.clinicId);
                                        return (
                                            <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}`} className="w-10 h-10 rounded-full" alt="" />
                                                        <div>
                                                            <p className="font-bold text-gray-900 text-sm">{user.name}</p>
                                                            <p className="text-xs text-gray-500 font-mono">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold uppercase">
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {userClinic ? (
                                                        <div className="flex items-center gap-2">
                                                            <Building2 className="w-4 h-4 text-gray-400" />
                                                            <span className="text-sm text-gray-700">{userClinic.name}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-red-400 text-xs italic">Não vinculado</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => openEditUserModal(user)}
                                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>

            {/* ==================================================================================== */}
            {/* PLAN EDITOR MODAL (Re-added) */}
            {/* ==================================================================================== */}
            {isPlanModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Layers className="w-6 h-6 text-indigo-600" />
                                    {editingPlan.id ? 'Editar Plano' : 'Criar Novo Plano'}
                                </h3>
                                <p className="text-sm text-gray-500">Defina os limites e módulos disponíveis neste pacote.</p>
                            </div>
                            <button onClick={() => setIsPlanModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="w-6 h-6" /></button>
                        </div>

                        <div className="p-8 overflow-y-auto bg-gray-50/30 flex-1">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                                {/* Left: Basic Info */}
                                <div className="lg:col-span-1 space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nome do Plano</label>
                                        <input
                                            className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="Ex: Premium Plus"
                                            value={editingPlan.name || ''}
                                            onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Preço Mensal (R$)</label>
                                        <input
                                            type="number"
                                            className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono font-bold text-lg"
                                            value={editingPlan.price}
                                            onChange={e => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Usuários</label>
                                            <input
                                                type="number"
                                                className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={editingPlan.maxUsers}
                                                onChange={e => setEditingPlan({ ...editingPlan, maxUsers: parseInt(e.target.value) })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Storage (GB)</label>
                                            <input
                                                type="number"
                                                className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={editingPlan.storageGB || 10}
                                                onChange={e => setEditingPlan({ ...editingPlan, storageGB: parseInt(e.target.value) })}
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${editingPlan.recommended ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-indigo-300'}`}>
                                                {editingPlan.recommended && <CheckSquare className="w-4 h-4 text-white" />}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={editingPlan.recommended}
                                                onChange={e => setEditingPlan({ ...editingPlan, recommended: e.target.checked })}
                                            />
                                            <span className="text-sm font-bold text-indigo-900">Destacar como "Recomendado"</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Right: Modules Grid */}
                                <div className="lg:col-span-2">
                                    <div className="flex items-center gap-2 mb-4">
                                        <ShieldCheck className="w-5 h-5 text-indigo-600" />
                                        <h4 className="font-bold text-gray-800">Módulos Inclusos (Permissões)</h4>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {AVAILABLE_MODULES.map(mod => {
                                            const isActive = editingPlan.modules?.includes(mod.key);
                                            return (
                                                <div
                                                    key={mod.key}
                                                    onClick={() => togglePlanModule(mod.key)}
                                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4 group ${isActive
                                                        ? 'bg-white border-indigo-600 shadow-md ring-1 ring-indigo-500/20'
                                                        : 'bg-gray-50 border-transparent hover:bg-white hover:border-gray-200'
                                                        }`}
                                                >
                                                    <div className={`p-2 rounded-lg shrink-0 transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'
                                                        }`}>
                                                        <mod.icon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <span className={`block text-sm font-bold mb-1 ${isActive ? 'text-indigo-900' : 'text-gray-500'}`}>
                                                            {mod.label}
                                                        </span>
                                                        <span className="text-xs text-gray-400 leading-tight block">
                                                            {mod.description}
                                                        </span>
                                                    </div>
                                                    <div className={`ml-auto w-5 h-5 rounded-full border flex items-center justify-center ${isActive ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                                                        }`}>
                                                        {isActive && <CheckSquare className="w-3 h-3 text-white" />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-white flex justify-between items-center">
                            {editingPlan.id ? (
                                <button onClick={handleDeletePlan} className="text-red-500 hover:text-red-700 text-sm font-bold flex items-center gap-2 px-4 py-2 hover:bg-red-50 rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" /> Excluir Plano
                                </button>
                            ) : <div></div>}

                            <div className="flex gap-3">
                                <button onClick={() => setIsPlanModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">Cancelar</button>
                                <button onClick={handleSavePlan} className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2">
                                    <Save className="w-4 h-4" /> Salvar Configurações
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================================================================================== */}
            {/* PROFESSIONAL WIZARD MODAL FOR CLINIC REGISTRATION (Mantido da versão anterior) */}
            {/* ==================================================================================== */}
            {isClinicModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex overflow-hidden animate-in fade-in zoom-in duration-300">

                        {/* LEFT SIDEBAR NAVIGATION */}
                        <div className="w-72 bg-gray-50 border-r border-gray-200 flex flex-col justify-between p-6">
                            <div>
                                <div className="flex items-center gap-2 mb-8 text-indigo-700">
                                    <Building2 className="w-6 h-6" />
                                    <span className="font-bold text-lg tracking-tight">Cadastro Corp.</span>
                                </div>

                                <nav className="space-y-2">
                                    {[
                                        { id: 'CORP', label: 'Dados Jurídicos', icon: FileText, desc: 'CNPJ, Razão Social' },
                                        { id: 'ADDR', label: 'Endereço & Local', icon: MapPin, desc: 'Sede da clínica' },
                                        { id: 'ADMIN', label: 'Gestor da Conta', icon: User, desc: 'Acesso Super Admin' },
                                        { id: 'FINANCE', label: 'Contrato & Plano', icon: CreditCard, desc: 'Billing e Vencimento' }
                                    ].map(step => (
                                        <button
                                            key={step.id}
                                            onClick={() => setClinicWizardStep(step.id as any)}
                                            className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${clinicWizardStep === step.id
                                                ? 'bg-white shadow-sm ring-1 ring-black/5 text-indigo-700'
                                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                                }`}
                                        >
                                            <div className={`p-2 rounded-lg ${clinicWizardStep === step.id ? 'bg-indigo-50' : 'bg-gray-200/50'}`}>
                                                <step.icon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="block text-sm font-bold">{step.label}</span>
                                                <span className="block text-[10px] opacity-70 font-medium">{step.desc}</span>
                                            </div>
                                            {clinicWizardStep === step.id && <ChevronRight className="w-4 h-4 ml-auto text-indigo-400" />}
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <p className="text-xs text-blue-800 font-bold mb-1">Suporte Técnico</p>
                                <p className="text-[10px] text-blue-600">Precisa de ajuda com o onboarding? Chame no Slack.</p>
                            </div>
                        </div>

                        {/* MAIN CONTENT AREA */}
                        <div className="flex-1 flex flex-col">
                            <div className="flex-1 overflow-y-auto p-8 lg:p-12">
                                <div className="max-w-2xl mx-auto">

                                    {/* STEP 1: CORPORATE */}
                                    {clinicWizardStep === 'CORP' && (
                                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900">Identificação da Empresa</h2>
                                                <p className="text-gray-500 mt-1">Insira os dados fiscais da clínica para faturamento.</p>
                                            </div>

                                            <div className="grid gap-6">
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">CNPJ</label>
                                                    <input
                                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono"
                                                        placeholder="00.000.000/0001-00"
                                                        value={editingClinic.cnpj}
                                                        onChange={e => setEditingClinic({ ...editingClinic, cnpj: e.target.value })}
                                                        autoFocus
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Razão Social</label>
                                                    <input
                                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                        placeholder="Razão Social Ltda"
                                                        value={editingClinic.corporateName}
                                                        onChange={e => setEditingClinic({ ...editingClinic, corporateName: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Nome Fantasia (Tenant)</label>
                                                    <input
                                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                        placeholder="Nome que aparecerá no sistema"
                                                        value={editingClinic.name}
                                                        onChange={e => setEditingClinic({ ...editingClinic, name: e.target.value })}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Telefone</label>
                                                        <input
                                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                            value={editingClinic.phone}
                                                            onChange={e => setEditingClinic({ ...editingClinic, phone: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Email Comercial</label>
                                                        <input
                                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                            value={editingClinic.email}
                                                            onChange={e => setEditingClinic({ ...editingClinic, email: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 2: ADDRESS */}
                                    {clinicWizardStep === 'ADDR' && (
                                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900">Endereço da Sede</h2>
                                                <p className="text-gray-500 mt-1">Localização principal para contrato.</p>
                                            </div>

                                            <div className="grid gap-6">
                                                <div className="flex gap-4">
                                                    <div className="w-1/3">
                                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">CEP</label>
                                                        <input
                                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                            placeholder="00000-000"
                                                            value={editingClinic.address?.zip}
                                                            onChange={e => setEditingClinic({ ...editingClinic, address: { ...editingClinic.address!, zip: e.target.value } })}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Logradouro</label>
                                                        <input
                                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                            placeholder="Rua / Av..."
                                                            value={editingClinic.address?.street}
                                                            onChange={e => setEditingClinic({ ...editingClinic, address: { ...editingClinic.address!, street: e.target.value } })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex gap-4">
                                                    <div className="w-1/4">
                                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Número</label>
                                                        <input
                                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                            value={editingClinic.address?.number}
                                                            onChange={e => setEditingClinic({ ...editingClinic, address: { ...editingClinic.address!, number: e.target.value } })}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Bairro</label>
                                                        <input
                                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                            value={editingClinic.address?.district}
                                                            onChange={e => setEditingClinic({ ...editingClinic, address: { ...editingClinic.address!, district: e.target.value } })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Cidade</label>
                                                        <input
                                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                            value={editingClinic.address?.city}
                                                            onChange={e => setEditingClinic({ ...editingClinic, address: { ...editingClinic.address!, city: e.target.value } })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Estado (UF)</label>
                                                        <input
                                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                            maxLength={2}
                                                            placeholder="SP"
                                                            value={editingClinic.address?.state}
                                                            onChange={e => setEditingClinic({ ...editingClinic, address: { ...editingClinic.address!, state: e.target.value.toUpperCase() } })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 3: ADMIN */}
                                    {clinicWizardStep === 'ADMIN' && (
                                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900">Primeiro Acesso (Admin)</h2>
                                                <p className="text-gray-500 mt-1">Este usuário terá permissão total para configurar a clínica.</p>
                                            </div>

                                            <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl flex items-start gap-3">
                                                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                                <p className="text-sm text-yellow-800 leading-relaxed">
                                                    As credenciais serão enviadas para o e-mail cadastrado aqui. Certifique-se de que é um e-mail válido.
                                                </p>
                                            </div>

                                            <div className="grid gap-6">
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Nome do Gestor</label>
                                                    <input
                                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                        placeholder="Ex: Dr. Roberto"
                                                        value={adminForm.name}
                                                        onChange={e => setAdminForm({ ...adminForm, name: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">E-mail de Login</label>
                                                    <input
                                                        type="email"
                                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                        placeholder="admin@clinica.com"
                                                        value={adminForm.email}
                                                        onChange={e => setAdminForm({ ...adminForm, email: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Senha Temporária</label>
                                                    <input
                                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                        value={editingClinic.adminTempPassword}
                                                        onChange={e => setEditingClinic({ ...editingClinic, adminTempPassword: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 4: FINANCE & PLAN */}
                                    {clinicWizardStep === 'FINANCE' && (
                                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900">Plano e Faturamento</h2>
                                                <p className="text-gray-500 mt-1">Defina os termos comerciais.</p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                                {plans.map(p => (
                                                    <div
                                                        key={p.id}
                                                        onClick={() => setEditingClinic({ ...editingClinic, plan: p.id as any })}
                                                        className={`cursor-pointer border-2 rounded-2xl p-4 transition-all hover:shadow-md ${editingClinic.plan === p.id
                                                            ? 'border-indigo-600 bg-indigo-50/50'
                                                            : 'border-gray-100 hover:border-gray-300'
                                                            }`}
                                                    >
                                                        <div className="flex justify-between items-center mb-2">
                                                            <h4 className={`font-bold ${editingClinic.plan === p.id ? 'text-indigo-900' : 'text-gray-700'}`}>{p.name}</h4>
                                                            {editingClinic.plan === p.id && <CheckCircle className="w-5 h-5 text-indigo-600" />}
                                                        </div>
                                                        <p className="text-sm font-medium text-gray-500">R$ {p.price}/mês</p>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Dia de Vencimento</label>
                                                    <select
                                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                        value={editingClinic.subscription?.dueDay}
                                                        onChange={e => setEditingClinic({
                                                            ...editingClinic,
                                                            subscription: { ...editingClinic.subscription!, dueDay: parseInt(e.target.value) }
                                                        })}
                                                    >
                                                        {[1, 5, 10, 15, 20, 25].map(d => <option key={d} value={d}>Todo dia {d}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Status da Assinatura</label>
                                                    <select
                                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                        value={editingClinic.status}
                                                        onChange={e => setEditingClinic({ ...editingClinic, status: e.target.value as any })}
                                                    >
                                                        <option value="ACTIVE">Ativo (Regular)</option>
                                                        <option value="TRIAL">Período de Teste</option>
                                                        <option value="OVERDUE">Inadimplente</option>
                                                        <option value="BLOCKED">Suspenso</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </div>

                            {/* FOOTER ACTIONS */}
                            <div className="p-6 border-t border-gray-200 bg-white flex justify-between items-center">
                                <button
                                    onClick={() => setIsClinicModalOpen(false)}
                                    className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                                >
                                    Cancelar
                                </button>

                                <div className="flex gap-3">
                                    {clinicWizardStep !== 'CORP' && (
                                        <button
                                            onClick={() => {
                                                if (clinicWizardStep === 'FINANCE') setClinicWizardStep('ADMIN');
                                                if (clinicWizardStep === 'ADMIN') setClinicWizardStep('ADDR');
                                                if (clinicWizardStep === 'ADDR') setClinicWizardStep('CORP');
                                            }}
                                            className="px-6 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                                        >
                                            Voltar
                                        </button>
                                    )}

                                    {clinicWizardStep !== 'FINANCE' ? (
                                        <button
                                            onClick={() => {
                                                if (clinicWizardStep === 'CORP') setClinicWizardStep('ADDR');
                                                if (clinicWizardStep === 'ADDR') setClinicWizardStep('ADMIN');
                                                if (clinicWizardStep === 'ADMIN') setClinicWizardStep('FINANCE');
                                            }}
                                            className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5"
                                        >
                                            Próximo
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleSaveClinic}
                                            className="px-8 py-3 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                                        >
                                            <CheckCircle className="w-5 h-5" /> Finalizar Contrato
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* User Modal */}
            {isUserModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-xl font-bold text-gray-900">
                                {editingUser.id ? 'Editar Usuário' : 'Novo Usuário'}
                            </h3>
                            <button onClick={() => setIsUserModalOpen(false)}><XCircle className="w-6 h-6 text-gray-400" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Clínica</label>
                                <select
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={editingUser.clinicId || ''}
                                    onChange={e => setEditingUser({ ...editingUser, clinicId: e.target.value })}
                                >
                                    <option value="">Selecione uma clínica...</option>
                                    {clinics.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.corporateName})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nome Completo</label>
                                <input
                                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={editingUser.name || ''}
                                    onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email</label>
                                <input
                                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={editingUser.email || ''}
                                    onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Senha</label>
                                    <input
                                        className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={editingUser.password || ''}
                                        onChange={e => setEditingUser({ ...editingUser, password: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Função</label>
                                    <select
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={editingUser.role || 'THERAPIST'}
                                        onChange={e => setEditingUser({ ...editingUser, role: e.target.value as any })}
                                    >
                                        <option value="ADMIN">Administrador</option>
                                        <option value="THERAPIST">Terapeuta</option>
                                        <option value="PARENT">Responsável/Pais</option>
                                        <option value="SPECIALIST">Especialista</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-between">
                            {editingUser.id ? (
                                <button onClick={handleDeleteUser} className="text-red-500 font-bold hover:bg-red-50 px-4 py-2 rounded-lg">Excluir</button>
                            ) : <div />}
                            <div className="flex gap-2">
                                <button onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 font-bold text-gray-500 hover:bg-gray-200 rounded-lg">Cancelar</button>
                                <button onClick={handleSaveUser} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700">Salvar Usuário</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};