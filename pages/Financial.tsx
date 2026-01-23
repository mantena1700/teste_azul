import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_TIME_LOGS, MOCK_EXPENSES, MOCK_FINANCIAL_SERVICES } from '../constants';
import { User, TimeLog, PayrollAdjustment, FinancialTransaction, TransactionCategory, TransactionStatus, FinancialService } from '../types';
import { DollarSign, Download, Calendar, Filter, FileText, TrendingUp, Users, Edit3, Plus, Trash2, X, Save, Wallet, ArrowUpRight, ArrowDownLeft, PieChart, TrendingDown, Briefcase, CreditCard, Landmark, CheckCircle, AlertCircle, Clock, Search, Layers, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import * as ApiService from '../services/ApiService'; // Use API
import { useData } from '../contexts/DataContext';

export const Financial: React.FC = () => {
    const { sessions, patients, users } = useData();
    const { user } = useAuth(); // Get user for clinicId
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'TRANSACTIONS' | 'PAYABLES' | 'RECEIVABLES' | 'SERVICES'>('DASHBOARD');

    // --- GLOBAL FILTERS STATE ---
    const [filterDateStart, setFilterDateStart] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [filterDateEnd, setFilterDateEnd] = useState(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterSearch, setFilterSearch] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    // --- SERVICE REGISTRY STATE ---
    const [services, setServices] = useState<FinancialService[]>([]);
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [newService, setNewService] = useState<Partial<FinancialService>>({
        name: '', defaultPrice: 0, category: 'REVENUE_SESSION'
    });

    // --- TRANSACTION MODAL STATE ---
    const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [newTransaction, setNewTransaction] = useState<Partial<FinancialTransaction>>({
        type: 'EXPENSE',
        category: 'EXPENSE_OTHER',
        status: 'PENDING',
        paymentMethod: 'PIX',
        date: new Date().toISOString().split('T')[0],
        costCenter: 'Geral'
    });

    // Load Data
    useEffect(() => {
        if (user?.clinicId) {
            refreshData();
        }
    }, [user?.clinicId]);

    const refreshData = async () => {
        if (!user?.clinicId) return;
        try {
            const [fetchedTrans, fetchedServices] = await Promise.all([
                ApiService.getTransactions({ clinicId: user.clinicId }),
                ApiService.getFinancialServices(user.clinicId)
            ]);
            setTransactions(fetchedTrans || []);
            setServices(fetchedServices || []);
        } catch (error) {
            console.error("Failed to load financial data:", error);
        }
    };

    const therapists = users.filter(u => u.role === 'THERAPIST' || u.role === 'SPECIALIST');

    // --- HELPER: PAYROLL CALCULATION ---
    const calculatePayrollCost = (user: User) => {
        if (!user.financial) return 0;
        // Filter logs based on the date range provided
        const userLogs = MOCK_TIME_LOGS.filter(l => {
            return l.userId === user.id &&
                l.status === 'APPROVED' &&
                l.date >= filterDateStart &&
                l.date <= filterDateEnd;
        });

        let totalWorkedMinutes = 0;
        userLogs.forEach(log => {
            if (log.clockIn && log.clockOut) {
                totalWorkedMinutes += (log.clockOut - log.clockIn) / 1000 / 60;
            }
        });
        const hours = totalWorkedMinutes / 60;

        let cost = 0;
        if (user.financial.salaryType === 'HOURLY') {
            cost = hours * user.financial.baseRate;
        } else {
            cost = user.financial.baseRate; // Simplification for monthly
        }
        return cost;
    };

    // --- 1. CORE LOGIC: UNIFY & FILTER DATA ---
    const allTransactions = useMemo(() => {
        let trans: FinancialTransaction[] = [...transactions];

        // 2. Revenue from Sessions (System Generated from Real Sessions)
        sessions.forEach(sess => {
            const patient = patients.find(p => p.id === sess.patientId);
            if (!patient) return;

            // Check if session has a billValue or calculate based on patient config
            // For now, assuming a fixed value or based on duration if not set
            const value = sess.billValue || 250.00; // Default fallback

            trans.push({
                id: `inc-${sess.id}`,
                date: new Date(sess.startTime).toISOString().split('T')[0],
                description: `Sessão ABA - ${patient.name}`,
                amount: value,
                type: 'INCOME',
                category: 'REVENUE_SESSION',
                status: sess.billed ? 'PAID' : 'PENDING',
                entityId: patient.id,
                entityName: patient.name,
                isSystemGenerated: true,
                costCenter: 'Clínico'
            });
        });

        // 3. Expenses from Payroll (System Generated) - Dynamic based on therapists
        therapists.forEach(therapist => {
            // Only generate if within range approx
            const cost = calculatePayrollCost(therapist); // This uses current filter range
            if (cost > 0) {
                trans.push({
                    id: `pay-${therapist.id}-gen`, // Simplified ID
                    date: filterDateEnd, // Assume end of period for accrual
                    description: `Folha de Pagamento - ${therapist.name}`,
                    amount: cost,
                    type: 'EXPENSE',
                    category: 'EXPENSE_PAYROLL',
                    status: 'SCHEDULED',
                    entityId: therapist.id,
                    entityName: therapist.name,
                    isSystemGenerated: true,
                    costCenter: 'RH'
                });
            }
        });

        // --- FILTERING ---
        return trans.filter(t => {
            const matchesDate = t.date >= filterDateStart && t.date <= filterDateEnd;
            const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
            const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
            const matchesSearch = !filterSearch ||
                t.description.toLowerCase().includes(filterSearch.toLowerCase()) ||
                (t.entityName && t.entityName.toLowerCase().includes(filterSearch.toLowerCase()));

            return matchesDate && matchesCategory && matchesStatus && matchesSearch;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [filterDateStart, filterDateEnd, filterCategory, filterStatus, filterSearch, transactions]);

    // --- 2. DASHBOARD CALCULATIONS ---
    const totalRevenue = allTransactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = allTransactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
    const balance = totalRevenue - totalExpense;
    const pendingRevenue = allTransactions.filter(t => t.type === 'INCOME' && t.status !== 'PAID').reduce((acc, t) => acc + t.amount, 0);

    const chartData = [
        { name: 'Receitas', value: totalRevenue, fill: '#10B981' },
        { name: 'Despesas', value: totalExpense, fill: '#EF4444' },
    ];

    // --- HANDLERS ---

    const handleSaveTransaction = async () => {
        if (!newTransaction.description || !newTransaction.amount) return;

        const trans: FinancialTransaction = {
            id: `ft-${Date.now()}`,
            date: newTransaction.date!,
            description: newTransaction.description!,
            amount: Number(newTransaction.amount),
            type: newTransaction.type!,
            category: newTransaction.category!,
            status: newTransaction.status!,
            paymentMethod: newTransaction.paymentMethod,
            entityName: newTransaction.entityName,
            costCenter: newTransaction.costCenter,
            entityId: newTransaction.entityId
        };

        // Add clinicId
        if (user?.clinicId) {
            (trans as any).clinicId = user.clinicId;
        }

        try {
            await ApiService.createTransaction(trans);
            await refreshData();

            setIsExpenseModalOpen(false);
            // Reset
            setNewTransaction({
                type: 'EXPENSE',
                category: 'EXPENSE_OTHER',
                status: 'PENDING',
                paymentMethod: 'PIX',
                date: new Date().toISOString().split('T')[0],
                costCenter: 'Geral'
            });
            alert('Lançamento salvo com sucesso!');
        } catch (error) {
            console.error("Error saving transaction:", error);
            alert("Erro ao salvar lançamento financeiro.");
        }
    };

    const handleSaveService = async () => {
        if (!newService.name || !newService.defaultPrice) return;
        const srv: FinancialService = {
            id: `fs-new-${Date.now()}`,
            name: newService.name,
            defaultPrice: newService.defaultPrice,
            category: newService.category || 'REVENUE_SESSION',
            description: newService.description,
            // @ts-ignore
            clinicId: user?.clinicId
        };

        try {
            await ApiService.createFinancialService(srv);
            await refreshData();

            setIsServiceModalOpen(false);
            setNewService({ name: '', defaultPrice: 0, category: 'REVENUE_SESSION' });
            alert('Serviço cadastrado com sucesso!');
        } catch (error) {
            console.error("Error saving service:", error);
            alert("Erro ao salvar serviço.");
        }
    };

    const selectServiceForTransaction = (srv: FinancialService) => {
        setNewTransaction({
            ...newTransaction,
            type: srv.category.startsWith('REVENUE') ? 'INCOME' : 'EXPENSE',
            category: srv.category,
            description: srv.name,
            amount: srv.defaultPrice,
            costCenter: srv.category.startsWith('REVENUE') ? 'Clínico' : 'Geral'
        });
    };

    const getStatusBadge = (status: TransactionStatus) => {
        switch (status) {
            case 'PAID': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Pago</span>;
            case 'PENDING': return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-bold w-fit">Pendente</span>;
            case 'OVERDUE': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><AlertCircle className="w-3 h-3" /> Atrasado</span>;
            case 'SCHEDULED': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold w-fit">Agendado</span>;
        }
    };

    const CATEGORY_LABELS: Record<string, string> = {
        'REVENUE_SESSION': 'Receita (Sessões)',
        'REVENUE_PRODUCT': 'Venda de Produtos',
        'EXPENSE_PAYROLL': 'Folha de Pagamento',
        'EXPENSE_RENT': 'Aluguel/Imóvel',
        'EXPENSE_MATERIAL': 'Materiais/Insumos',
        'EXPENSE_SOFTWARE': 'Software/Sistemas',
        'EXPENSE_TAX': 'Impostos',
        'EXPENSE_MAINTENANCE': 'Manutenção',
        'EXPENSE_OTHER': 'Outros'
    };

    return (
        <div className="space-y-6 pb-20 md:pb-0">

            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Landmark className="w-8 h-8 text-indigo-700" /> ERP Financeiro
                    </h1>
                    <p className="text-gray-500 text-sm">Controle completo de caixa, fornecedores e serviços.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsExpenseModalOpen(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 shadow-sm transition-all hover:-translate-y-0.5"
                    >
                        <Plus className="w-4 h-4" /> Novo Lançamento
                    </button>
                </div>
            </div>

            {/* TABS Navigation */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'DASHBOARD', label: 'Visão Geral', icon: PieChart },
                        { id: 'TRANSACTIONS', label: 'Extrato', icon: FileText },
                        { id: 'PAYABLES', label: 'A Pagar', icon: ArrowDownLeft },
                        { id: 'RECEIVABLES', label: 'A Receber', icon: ArrowUpRight },
                        { id: 'SERVICES', label: 'Catálogo de Serviços', icon: Layers } // New Tab
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === tab.id
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" /> {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* === GLOBAL ADVANCED FILTERS BAR === */}
            {activeTab !== 'SERVICES' && (
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                            <Filter className="w-4 h-4" /> Filtros Ativos
                        </h3>
                        <button
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                            {showAdvancedFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            {showAdvancedFilters ? 'Ocultar' : 'Expandir'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="col-span-1 md:col-span-2 lg:col-span-1">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Período</label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="date"
                                    value={filterDateStart}
                                    onChange={(e) => setFilterDateStart(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-2 text-xs"
                                />
                                <span className="text-gray-400">-</span>
                                <input
                                    type="date"
                                    value={filterDateEnd}
                                    onChange={(e) => setFilterDateEnd(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-2 text-xs"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Categoria</label>
                            <select
                                className="w-full border border-gray-300 rounded-lg p-2 text-xs bg-white"
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                            >
                                <option value="all">Todas</option>
                                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>

                        {showAdvancedFilters && (
                            <>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Status</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg p-2 text-xs bg-white"
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                    >
                                        <option value="all">Todos</option>
                                        <option value="PAID">Pago / Recebido</option>
                                        <option value="PENDING">Pendente</option>
                                        <option value="OVERDUE">Atrasado</option>
                                        <option value="SCHEDULED">Agendado</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Busca (Descrição/Entidade)</label>
                                    <div className="relative">
                                        <Search className="absolute left-2 top-1.5 w-3.5 h-3.5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Nome, Fornecedor..."
                                            className="w-full border border-gray-300 rounded-lg pl-7 pr-2 py-2 text-xs outline-none focus:border-indigo-500"
                                            value={filterSearch}
                                            onChange={(e) => setFilterSearch(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ================= DASHBOARD VIEW ================= */}
            {activeTab === 'DASHBOARD' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
                    {/* Executive Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Receita Total</p>
                            <div className="flex items-center justify-between mt-2">
                                <h3 className="text-2xl font-bold text-green-600">R$ {totalRevenue.toFixed(2)}</h3>
                                <div className="p-2 bg-green-50 rounded-lg text-green-600"><TrendingUp className="w-5 h-5" /></div>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Despesa Total</p>
                            <div className="flex items-center justify-between mt-2">
                                <h3 className="text-2xl font-bold text-red-600">R$ {totalExpense.toFixed(2)}</h3>
                                <div className="p-2 bg-red-50 rounded-lg text-red-600"><TrendingDown className="w-5 h-5" /></div>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Resultado (Lucro)</p>
                            <div className="flex items-center justify-between mt-2">
                                <h3 className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>R$ {balance.toFixed(2)}</h3>
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Wallet className="w-5 h-5" /></div>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">A Receber (Pendente)</p>
                            <div className="flex items-center justify-between mt-2">
                                <h3 className="text-2xl font-bold text-orange-500">R$ {pendingRevenue.toFixed(2)}</h3>
                                <div className="p-2 bg-orange-50 rounded-lg text-orange-500"><Clock className="w-5 h-5" /></div>
                            </div>
                        </div>
                    </div>

                    {/* Chart & Detailed Breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* CHART */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h4 className="font-bold text-gray-800 mb-6">Fluxo de Caixa (Período Selecionado)</h4>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer>
                                    <BarChart data={chartData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="#f3f4f6" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} />
                                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Bar dataKey="value" barSize={40} radius={[0, 4, 4, 0]} label={{ position: 'right', fill: '#6B7280', fontSize: 12 }} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* MINI LIST: Recent Transactions */}
                        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                            <h4 className="font-bold text-gray-800 mb-4">Últimas Movimentações</h4>
                            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                                {allTransactions.slice(0, 5).map(t => (
                                    <div key={t.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className={`w-2 h-8 rounded-full shrink-0 ${t.type === 'INCOME' ? 'bg-green-500' : 'bg-red-500'}`} />
                                            <div className="truncate">
                                                <p className="text-xs font-bold text-gray-900 truncate">{t.description}</p>
                                                <p className="text-[10px] text-gray-500">{new Date(t.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <span className={`text-xs font-bold whitespace-nowrap ${t.type === 'INCOME' ? 'text-green-700' : 'text-red-700'}`}>
                                            {t.type === 'INCOME' ? '+' : '-'} R$ {t.amount.toFixed(0)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => setActiveTab('TRANSACTIONS')}
                                className="mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-800 w-full text-center"
                            >
                                Ver Extrato Completo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= TRANSACTIONS LIST (EXTRATO) ================= */}
            {(activeTab === 'TRANSACTIONS' || activeTab === 'PAYABLES' || activeTab === 'RECEIVABLES') && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in">
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-gray-800">
                            {activeTab === 'TRANSACTIONS' ? 'Extrato Detalhado' : activeTab === 'PAYABLES' ? 'Contas a Pagar' : 'Contas a Receber'}
                        </h3>
                        <button className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline">
                            <Download className="w-4 h-4" /> Exportar Planilha
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-white text-gray-500 font-medium border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4">Data</th>
                                    <th className="px-6 py-4">Descrição</th>
                                    <th className="px-6 py-4">Entidade/Pagador</th>
                                    <th className="px-6 py-4">Categoria</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Valor</th>
                                    <th className="px-6 py-4 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {allTransactions
                                    .filter(t => {
                                        if (activeTab === 'PAYABLES') return t.type === 'EXPENSE';
                                        if (activeTab === 'RECEIVABLES') return t.type === 'INCOME';
                                        return true;
                                    })
                                    .map(t => (
                                        <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-gray-600 font-mono text-xs">{new Date(t.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-gray-900">{t.description}</p>
                                                {t.isSystemGenerated && (
                                                    <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
                                                        Automático
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {t.entityName || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200">
                                                    {CATEGORY_LABELS[t.category] || t.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(t.status)}
                                            </td>
                                            <td className={`px-6 py-4 text-right font-mono font-bold ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                                {t.type === 'INCOME' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-center flex justify-center gap-2">
                                                <button className="p-1 text-gray-400 hover:text-blue-600"><Edit3 className="w-4 h-4" /></button>
                                                {!t.isSystemGenerated && (
                                                    <button className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                {allTransactions.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8 text-gray-400">Nenhum lançamento encontrado com os filtros atuais.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ================= SERVICE REGISTRY TAB (NEW) ================= */}
            {activeTab === 'SERVICES' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in">
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-gray-800">Catálogo de Serviços Padronizados</h3>
                        <button
                            onClick={() => setIsServiceModalOpen(true)}
                            className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-indigo-700"
                        >
                            <Plus className="w-4 h-4" /> Adicionar Serviço
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-white text-gray-500 font-medium border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4">Nome do Serviço</th>
                                    <th className="px-6 py-4">Categoria Financeira</th>
                                    <th className="px-6 py-4">Valor Padrão (R$)</th>
                                    <th className="px-6 py-4 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {services.map(srv => (
                                    <tr key={srv.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-bold text-gray-900">{srv.name}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600 border border-gray-200">
                                                {CATEGORY_LABELS[srv.category]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono font-medium">R$ {srv.defaultPrice.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ================= NEW TRANSACTION MODAL (ENHANCED) ================= */}
            {isExpenseModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900">Novo Lançamento Financeiro</h3>
                            <button onClick={() => setIsExpenseModalOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto">
                            {/* Type Toggle */}
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setNewTransaction({ ...newTransaction, type: 'INCOME' })}
                                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${newTransaction.type === 'INCOME' ? 'bg-green-500 text-white shadow' : 'text-gray-600'}`}
                                >
                                    Receita
                                </button>
                                <button
                                    onClick={() => setNewTransaction({ ...newTransaction, type: 'EXPENSE' })}
                                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${newTransaction.type === 'EXPENSE' ? 'bg-red-500 text-white shadow' : 'text-gray-600'}`}
                                >
                                    Despesa
                                </button>
                            </div>

                            {/* Import Service */}
                            <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                                <label className="block text-[10px] font-bold text-indigo-700 uppercase mb-1 flex items-center gap-1">
                                    <Layers className="w-3 h-3" /> Puxar do Catálogo (Opcional)
                                </label>
                                <select
                                    className="w-full border border-indigo-200 rounded p-2 text-sm bg-white"
                                    onChange={(e) => {
                                        const srv = services.find(s => s.id === e.target.value);
                                        if (srv) selectServiceForTransaction(srv);
                                    }}
                                    defaultValue=""
                                >
                                    <option value="">Selecione um serviço padrão...</option>
                                    {services.map(s => <option key={s.id} value={s.id}>{s.name} - R$ {s.defaultPrice}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrição</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder={newTransaction.type === 'INCOME' ? 'Ex: Venda de Livro' : 'Ex: Aluguel Sala 2'}
                                        value={newTransaction.description || ''}
                                        onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Valor (R$)</label>
                                    <input
                                        type="number"
                                        className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={newTransaction.amount || ''}
                                        onChange={(e) => setNewTransaction({ ...newTransaction, amount: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data</label>
                                    <input
                                        type="date"
                                        className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={newTransaction.date}
                                        onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoria</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-sm"
                                        value={newTransaction.category}
                                        onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value as any })}
                                    >
                                        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-sm"
                                        value={newTransaction.status}
                                        onChange={(e) => setNewTransaction({ ...newTransaction, status: e.target.value as any })}
                                    >
                                        <option value="PAID">Pago / Recebido</option>
                                        <option value="PENDING">Pendente</option>
                                        <option value="SCHEDULED">Agendado</option>
                                    </select>
                                </div>

                                {/* Dynamic Entity Field - REFACTORED FOR REAL DATA */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                        {newTransaction.type === 'INCOME' ? 'Paciente / Cliente' : 'Fornecedor / Colaborador'}
                                    </label>

                                    {newTransaction.type === 'INCOME' ? (
                                        <select
                                            className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                            value={newTransaction.entityId || ''}
                                            onChange={(e) => {
                                                const selectedPatient = patients.find(p => p.id === e.target.value);
                                                if (selectedPatient) {
                                                    setNewTransaction({
                                                        ...newTransaction,
                                                        entityId: selectedPatient.id,
                                                        entityName: selectedPatient.name
                                                    });
                                                }
                                            }}
                                        >
                                            <option value="">Selecione o Paciente...</option>
                                            {patients.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                            <option value="EXTERNAL">Cliente Externo / Outro</option>
                                        </select>
                                    ) : (
                                        <div className="relative">
                                            <input
                                                list="suppliers-list"
                                                type="text"
                                                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="Buscar Fornecedor..."
                                                value={newTransaction.entityName || ''}
                                                onChange={(e) => setNewTransaction({ ...newTransaction, entityName: e.target.value })}
                                            />
                                            <datalist id="suppliers-list">
                                                {users.map(u => <option key={u.id} value={u.name} />)}
                                                <option value="Imobiliária Central" />
                                                <option value="Vivo Empresas" />
                                                <option value="Sabesp" />
                                                <option value="Enel" />
                                                <option value="Amazon AWS" />
                                            </datalist>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Centro de Custo</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-sm"
                                        value={newTransaction.costCenter}
                                        onChange={(e) => setNewTransaction({ ...newTransaction, costCenter: e.target.value })}
                                    >
                                        <option value="Geral">Geral / Administrativo</option>
                                        <option value="Clínico">Atendimento Clínico</option>
                                        <option value="RH">Recursos Humanos</option>
                                        <option value="Marketing">Marketing & Vendas</option>
                                        <option value="Infraestrutura">Infraestrutura</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 bg-gray-50 border-t border-gray-100 flex gap-3">
                            <button onClick={() => setIsExpenseModalOpen(false)} className="flex-1 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-lg transition-colors">Cancelar</button>
                            <button
                                onClick={handleSaveTransaction}
                                className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                            >
                                Salvar Lançamento
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= SERVICE CATALOG MODAL ================= */}
            {isServiceModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900">Novo Serviço Padronizado</h3>
                            <button onClick={() => setIsServiceModalOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Serviço</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg p-2.5"
                                    placeholder="Ex: Sessão Fonoaudiologia"
                                    value={newService.name}
                                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoria Financeira</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white"
                                    value={newService.category}
                                    onChange={(e) => setNewService({ ...newService, category: e.target.value as any })}
                                >
                                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Preço Padrão (R$)</label>
                                <input
                                    type="number"
                                    className="w-full border border-gray-300 rounded-lg p-2.5"
                                    value={newService.defaultPrice}
                                    onChange={(e) => setNewService({ ...newService, defaultPrice: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="p-5 bg-gray-50 border-t border-gray-100 flex gap-3">
                            <button onClick={() => setIsServiceModalOpen(false)} className="flex-1 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-lg">Cancelar</button>
                            <button
                                onClick={handleSaveService}
                                className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700"
                            >
                                Salvar Serviço
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};