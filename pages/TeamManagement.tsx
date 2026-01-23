import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_FINANCIAL_SERVICES } from '../constants';
import { User, ContractType, Patient, ScheduleItem, ServiceItem, Clinic } from '../types';
import { Users, Clock, Calendar, DollarSign, Plus, Save, X, Search, Briefcase, FileText, CheckSquare, Settings, UserPlus, ChevronRight, Phone, Mail, MapPin, Star, Trash2 } from 'lucide-react';
import { LocalDatabase } from '../services/LocalDatabase';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

export const TeamManagement: React.FC = () => {
    const { user: currentUser } = useAuth();
    const { users: allUsers, patients, addUser, updateUser: updateContextUser, updatePatient } = useData();

    // Filter users by clinic (SAAS_ADMIN sees all, others see their clinic)
    const users = useMemo(() => {
        if (currentUser?.role === 'SAAS_ADMIN') return allUsers; // SAAS sees all
        if (!currentUser?.clinicId) return [];
        return allUsers.filter(u => u.clinicId === currentUser.clinicId);
    }, [allUsers, currentUser?.clinicId, currentUser?.role]);

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SCHEDULE' | 'PATIENTS'>('OVERVIEW');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // --- SCHEDULING STATE ---
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ day: number, time: string } | null>(null);
    const [assignForm, setAssignForm] = useState<{ patientId: string, serviceId: string }>({ patientId: '', serviceId: '' });

    // Clinics list for SAAS_ADMIN
    const [clinics, setClinics] = useState<{ id: string; name: string }[]>([]);
    const [selectedClinicId, setSelectedClinicId] = useState<string>('');

    // Load clinics for SAAS_ADMIN
    React.useEffect(() => {
        if (currentUser?.role === 'SAAS_ADMIN') {
            const allClinics = LocalDatabase.getClinics();
            setClinics(allClinics.map(c => ({ id: c.id, name: c.name })));
            if (allClinics.length > 0 && !selectedClinicId) {
                setSelectedClinicId(allClinics[0].id);
            }
        }
    }, [currentUser?.role]);

    // Form State for New User
    const [newUser, setNewUser] = useState<Partial<User>>({
        role: 'THERAPIST',
        email: '',
        password: '',
        financial: {
            contractType: 'PJ',
            salaryType: 'HOURLY',
            baseRate: 0,
            allowOvertime: true,
            workSchedule: {
                start: '08:00',
                end: '17:00',
                lunchDurationMinutes: 60,
                activeWeekDays: [1, 2, 3, 4, 5] // Default Mon-Fri
            },
            benefits: { mealValue: 0, transportValue: 0 },
            taxes: { deductINSS: false, deductIRRF: false }
        }
    });

    const filteredUsers = users.filter(u =>
        (u.role === 'THERAPIST' || u.role === 'SPECIALIST') &&
        u.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    // --- DERIVED DATA ---

    // 1. Get patients assigned to the selected therapist
    const therapistPatients = useMemo(() => {
        if (!selectedUser) return [];
        return patients.filter(p =>
            p.schedule?.some(s => s.therapistId === selectedUser.id)
        );
    }, [selectedUser, patients]);

    // 2. Generate Schedule Grid
    const scheduleGrid = useMemo(() => {
        if (!selectedUser || !selectedUser.financial) return [];

        const { start, end, activeWeekDays } = selectedUser.financial.workSchedule;
        const startHour = parseInt(start.split(':')[0]);
        const endHour = parseInt(end.split(':')[0]);

        const grid = activeWeekDays.map(dayIndex => {
            const slots = [];
            for (let h = startHour; h < endHour; h++) {
                const timeString = `${h.toString().padStart(2, '0')}:00`;

                // Check if occupied by ANY patient regarding this therapist
                let occupiedBy: { patient: Patient, serviceName: string } | null = null;

                // Real usage: Check Global Appointments or Patient Specific Schedule?
                // The prompt implies we check Patients Schedule config.
                patients.forEach(p => {
                    const scheduleItem = p.schedule?.find(s =>
                        s.therapistId === selectedUser.id &&
                        s.dayOfWeek === dayIndex &&
                        s.time === timeString
                    );
                    if (scheduleItem) {
                        const service = p.financialConfig?.services.find(srv => srv.id === scheduleItem.serviceId);
                        occupiedBy = { patient: p, serviceName: service?.name || 'Atendimento' };
                    }
                });

                slots.push({ time: timeString, occupiedBy });
            }
            return { dayIndex, dayName: weekDays[dayIndex], slots };
        });

        return grid;
    }, [selectedUser, patients, weekDays]);


    // --- ACTIONS ---

    const handleAddUser = async () => {
        console.log('🚀 VERSÃO NOVA DO CÓDIGO - handleAddUser chamado!');
        alert('🚀 CÓDIGO NOVO CARREGADO! Agora vou criar o usuário...');

        if (!newUser.name || !newUser.email || !newUser.password) {
            alert("Por favor, preencha nome, e-mail e senha.");
            return;
        }

        // SAAS_ADMIN can create users without a clinic, Regular ADMIN uses their own clinicId
        let targetClinicId: string = '';
        if (currentUser?.role === 'SAAS_ADMIN') {
            targetClinicId = selectedClinicId || ''; // Can be empty for SAAS_ADMIN
        } else {
            targetClinicId = currentUser?.clinicId || '';
            if (!targetClinicId) {
                alert("Erro: Você não está vinculado a uma clínica.");
                return;
            }
        }

        const createdUser: User = {
            id: `u-${Date.now()}`,
            clinicId: targetClinicId,
            name: newUser.name,
            role: newUser.role as any,
            email: newUser.email,
            password: newUser.password,
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(newUser.name)}&background=random`,
            performanceScore: 100,
            financial: newUser.financial
        };

        console.log('🆕 Creating user:', createdUser);

        // Save to PostgreSQL via API
        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(createdUser)
            });
            const result = await response.json();

            if (result.success) {
                setIsAddModalOpen(false);
                setNewUser({
                    role: 'THERAPIST',
                    email: '',
                    password: '',
                    financial: { ...newUser.financial }
                });

                const clinicName = clinics.find(c => c.id === targetClinicId)?.name || targetClinicId;
                alert(`✅ Colaborador "${createdUser.name}" cadastrado com sucesso!\n\nClínica: ${clinicName}\nLogin: ${createdUser.email}\nSenha: ${createdUser.password}\n\nEste usuário agora pode logar de QUALQUER dispositivo!`);

                // Refresh users list
                window.location.reload();
            } else {
                alert(`❌ Erro ao cadastrar: ${result.error || 'Erro desconhecido'}`);
            }
        } catch (error) {
            console.error('Error creating user:', error);
            alert('❌ Erro de conexão com o servidor. Tente novamente.');
        }
    };

    const openAssignModal = (day: number, time: string) => {
        setSelectedSlot({ day, time });
        setAssignForm({ patientId: '', serviceId: '' });
        setIsAssignModalOpen(true);
    };

    const handleAssignPatient = () => {
        if (!selectedSlot || !selectedUser || !assignForm.patientId || !assignForm.serviceId) return;

        const targetPatient = patients.find(p => p.id === assignForm.patientId);
        if (targetPatient) {
            const newItem: ScheduleItem = {
                id: `sch-${Date.now()}`,
                dayOfWeek: selectedSlot.day,
                time: selectedSlot.time,
                serviceId: assignForm.serviceId,
                therapistId: selectedUser.id
            };

            updatePatient(targetPatient.id, {
                schedule: [...(targetPatient.schedule || []), newItem]
            });

            setIsAssignModalOpen(false);
            alert("Paciente agendado com sucesso!");
        }
    };

    const toggleWeekDay = (dayIndex: number) => {
        if (!newUser.financial) return;
        const currentDays = newUser.financial.workSchedule.activeWeekDays;
        const newDays = currentDays.includes(dayIndex)
            ? currentDays.filter(d => d !== dayIndex)
            : [...currentDays, dayIndex].sort();
        setNewUser({
            ...newUser,
            financial: { ...newUser.financial, workSchedule: { ...newUser.financial.workSchedule, activeWeekDays: newDays } }
        });
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        if (!confirm(`Tem certeza que deseja excluir o colaborador "${selectedUser.name}"? Esta ação removerá o acesso dele ao sistema.`)) return;

        try {
            // Assuming ApiService is available globally or imported. 
            // Since we see 'fetch' being used directly in handleAddUser, let's stick to fetch for consistency OR use the ApiService pattern if imported.
            // But wait, in previous steps I removed LocalDatabase. Let's look at imports.
            // Oh, I see 'useData' is used. I should check if 'deleteUser' is exposed in 'useData' or if I should import ApiService directly.
            // Let's import the raw fetch for now to match handleAddUser style or better yet, use the DELETE api endpoint.

            const response = await fetch(`/api/users/${selectedUser.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('Usuário removido com sucesso!');
                setSelectedUser(null);
                window.location.reload(); // Simple refresh to sync state
            } else {
                const err = await response.json();
                alert(`Erro ao excluir: ${err.message || 'Erro desconhecido'}`);
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Erro de conexão ao excluir usuário.');
        }
    };

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestão de Equipe (RH)</h1>
                    <p className="text-gray-500 text-sm">Gerencie cadastros, contratos, agendas e carteira de pacientes.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" /> Cadastrar Novo Colaborador
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)]">
                {/* User List - Sidebar */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden lg:col-span-4 flex flex-col">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar colaborador..."
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                        {filteredUsers.map(user => (
                            <div
                                key={user.id}
                                onClick={() => setSelectedUser(user)}
                                className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors flex items-center gap-3 ${selectedUser?.id === user.id ? 'bg-blue-50 border-l-4 border-blue-500' : 'border-l-4 border-transparent'}`}
                            >
                                <img src={user.avatarUrl} className="w-12 h-12 rounded-full bg-gray-200 object-cover" alt="" />
                                <div className="flex-1">
                                    <p className="font-bold text-gray-900 text-sm">{user.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                            {user.financial?.contractType || 'N/A'}
                                        </span>
                                        <span className="text-xs text-gray-500 uppercase">
                                            {user.role === 'THERAPIST' ? 'Terapeuta' : 'Especialista'}
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Details Panel - Main Content */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 lg:col-span-8 flex flex-col overflow-hidden">
                    {selectedUser ? (
                        <div className="flex flex-col h-full">
                            {/* Header Profile */}
                            <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row gap-6 items-start">
                                <img src={selectedUser.avatarUrl} className="w-20 h-20 rounded-full border-4 border-gray-50 object-cover shadow-sm" alt="" />
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">{selectedUser.name}</h2>
                                            <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                                                <Briefcase className="w-4 h-4" />
                                                {selectedUser.role === 'THERAPIST' ? 'Terapeuta Comportamental (ABA)' : 'Especialista Clínico'}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleDeleteUser}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Excluir Colaborador"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Enviar Email"><Mail className="w-5 h-5" /></button>
                                            <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Ligar"><Phone className="w-5 h-5" /></button>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 mt-4 text-sm">
                                        <div className="flex items-center gap-1 text-gray-600">
                                            <MapPin className="w-4 h-4" /> Unidade Sede
                                        </div>
                                        <div className="flex items-center gap-1 text-yellow-600">
                                            <Star className="w-4 h-4 fill-current" /> Score: {selectedUser.performanceScore || 100}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* TABS */}
                            <div className="flex border-b border-gray-200 bg-gray-50/50">
                                {[
                                    { id: 'OVERVIEW', label: 'Dados Contratuais', icon: FileText },
                                    { id: 'SCHEDULE', label: 'Agenda & Disponibilidade', icon: Calendar },
                                    { id: 'PATIENTS', label: 'Carteira de Pacientes', icon: Users }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === tab.id
                                            ? 'border-blue-600 text-blue-700 bg-white'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        <tab.icon className="w-4 h-4" /> {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* CONTENT AREA */}
                            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">

                                {/* 1. OVERVIEW TAB */}
                                {activeTab === 'OVERVIEW' && (
                                    <div className="space-y-6 animate-in fade-in">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                                <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                                                    <DollarSign className="w-5 h-5 text-blue-600" /> Detalhes Contratuais
                                                </h3>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                                                        <span className="text-gray-500">Regime</span>
                                                        <span className="font-bold text-gray-900 bg-blue-50 px-2 py-0.5 rounded text-blue-700">
                                                            {selectedUser.financial?.contractType} - {selectedUser.financial?.salaryType === 'HOURLY' ? 'Horista' : 'Mensalista'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                                                        <span className="text-gray-500">Remuneração Base</span>
                                                        <span className="font-bold text-green-700">R$ {selectedUser.financial?.baseRate?.toFixed(2) || '0.00'}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Impostos (INSS/IRRF)</span>
                                                        <span className="font-bold text-gray-900">
                                                            {selectedUser.financial?.taxes?.deductINSS ? 'Desconta em Folha' : 'Não Desconta'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                                <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                                                    <Clock className="w-5 h-5 text-blue-600" /> Jornada Padrão
                                                </h3>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                                                        <span className="text-gray-500">Horário</span>
                                                        <span className="font-mono font-bold text-gray-900">
                                                            {selectedUser.financial?.workSchedule?.start || '--:--'} às {selectedUser.financial?.workSchedule?.end || '--:--'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                                                        <span className="text-gray-500">Dias Ativos</span>
                                                        <div className="flex gap-1">
                                                            {weekDays.map((day, idx) => (
                                                                <span key={day} className={`text-[9px] w-5 h-5 flex items-center justify-center rounded ${selectedUser.financial?.workSchedule?.activeWeekDays.includes(idx)
                                                                    ? 'bg-blue-600 text-white font-bold'
                                                                    : 'bg-gray-100 text-gray-300'
                                                                    }`}>
                                                                    {day.charAt(0)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 2. SCHEDULE TAB */}
                                {activeTab === 'SCHEDULE' && (
                                    <div className="animate-in fade-in h-full flex flex-col">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-bold text-gray-800">Grade de Horários & Disponibilidade</h3>
                                            <div className="flex gap-4 text-xs">
                                                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div> Livre</span>
                                                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div> Ocupado</span>
                                            </div>
                                        </div>

                                        {/* Refactored for Responsiveness: Added overflow-x-auto and min-w */}
                                        <div className="flex-1 overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-sm">
                                            <div className="flex" style={{ minWidth: `${scheduleGrid.length * 160}px` }}> {/* Dynamic min width based on days */}
                                                {scheduleGrid.map((day) => (
                                                    <div key={day.dayIndex} className="flex-1 border-r border-gray-100 last:border-0 min-w-[160px]">
                                                        <div className="bg-gray-50 p-2 text-center text-xs font-bold text-gray-600 border-b border-gray-200 uppercase sticky top-0 z-10">
                                                            {day.dayName}
                                                        </div>
                                                        <div className="divide-y divide-gray-100">
                                                            {day.slots.map((slot) => (
                                                                <div key={slot.time} className="p-2 h-24 flex flex-col relative group hover:bg-gray-50 transition-colors">
                                                                    <span className="text-[10px] text-gray-400 font-mono absolute top-1 right-1 bg-white/80 px-1 rounded">{slot.time}</span>

                                                                    {slot.occupiedBy ? (
                                                                        <div className="flex-1 bg-blue-50 border border-blue-200 rounded p-2 mt-4 flex flex-col justify-center cursor-pointer hover:bg-blue-100 hover:shadow-sm transition-all">
                                                                            <span className="text-xs font-bold text-blue-800 line-clamp-2 leading-tight">{slot.occupiedBy.patient.name}</span>
                                                                            <span className="text-[10px] text-blue-600 line-clamp-1 mt-1">{slot.occupiedBy.serviceName}</span>
                                                                        </div>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => openAssignModal(day.dayIndex, slot.time)}
                                                                            className="flex-1 border border-dashed border-gray-200 rounded mt-4 flex items-center justify-center text-gray-300 hover:text-green-600 hover:border-green-300 hover:bg-green-50 transition-all opacity-0 group-hover:opacity-100"
                                                                        >
                                                                            <Plus className="w-5 h-5" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 3. PATIENTS TAB */}
                                {activeTab === 'PATIENTS' && (
                                    <div className="space-y-4 animate-in fade-in">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="font-bold text-gray-800">Carteira de Pacientes ({therapistPatients.length})</h3>
                                        </div>

                                        {therapistPatients.length === 0 ? (
                                            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
                                                <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                <p>Este terapeuta não possui pacientes vinculados.</p>
                                                <p className="text-sm">Use a aba "Agenda" para adicionar.</p>
                                            </div>
                                        ) : (
                                            <div className="grid md:grid-cols-2 gap-4">
                                                {therapistPatients.map(patient => (
                                                    <div key={patient.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center hover:border-blue-300 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                                                                {patient.name[0]}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-gray-900 text-sm">{patient.name}</h4>
                                                                <p className="text-xs text-gray-500">{patient.diagnosis}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className={`text-[10px] font-bold px-2 py-1 rounded ${patient.financialConfig?.paymentMethod === 'PRIVATE' ? 'bg-green-100 text-green-700' : 'bg-purple-50 text-purple-700'
                                                                }`}>
                                                                {patient.financialConfig?.paymentMethod === 'PRIVATE' ? 'Particular' : 'Convênio'}
                                                            </span>
                                                            <p className="text-[10px] text-gray-400 mt-1">
                                                                {patient.schedule?.filter(s => s.therapistId === selectedUser.id).length} sessões/sem
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50 bg-gray-50">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-200">
                                <Users className="w-10 h-10 text-gray-300" />
                            </div>
                            <p className="font-medium text-lg">Selecione um colaborador</p>
                            <p className="text-sm">Visualize agenda, pacientes e dados.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ASSIGN PATIENT MODAL */}
            {isAssignModalOpen && selectedSlot && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Agendar Paciente</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            {weekDays[selectedSlot.day]} às <span className="font-mono font-bold text-gray-800">{selectedSlot.time}</span>
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Paciente</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white"
                                    value={assignForm.patientId}
                                    onChange={(e) => setAssignForm({ ...assignForm, patientId: e.target.value })}
                                >
                                    <option value="">Selecione...</option>
                                    {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>

                            {assignForm.patientId && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Serviço Contratado</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white"
                                        value={assignForm.serviceId}
                                        onChange={(e) => setAssignForm({ ...assignForm, serviceId: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        {patients.find(p => p.id === assignForm.patientId)?.financialConfig?.services.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 mt-6">
                            <button onClick={() => setIsAssignModalOpen(false)} className="flex-1 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg">Cancelar</button>
                            <button
                                onClick={handleAssignPatient}
                                disabled={!assignForm.patientId || !assignForm.serviceId}
                                className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD USER MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-blue-600" />
                                Cadastrar Contrato de Colaborador
                            </h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Clinic Selector for SAAS_ADMIN */}
                            {currentUser?.role === 'SAAS_ADMIN' && (
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                    <h4 className="text-sm font-bold text-purple-900 uppercase tracking-wide mb-2">Selecione a Clínica</h4>
                                    {clinics.length === 0 ? (
                                        <p className="text-sm text-red-600">⚠️ Nenhuma clínica cadastrada. Crie uma clínica no Painel SaaS primeiro.</p>
                                    ) : (
                                        <select
                                            className="w-full border border-purple-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                                            value={selectedClinicId}
                                            onChange={(e) => setSelectedClinicId(e.target.value)}
                                        >
                                            {clinics.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            )}

                            {/* Basic Info */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1 mb-3">Dados Pessoais</h4>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
                                            value={newUser.name || ''}
                                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 col-span-2 md:col-span-2">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail de Acesso</label>
                                            <input
                                                type="email"
                                                className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="nome@clinica.com"
                                                value={newUser.email || ''}
                                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Senha Provisória</label>
                                            <input
                                                type="text"
                                                className="w-full border border-blue-300 bg-blue-50 text-blue-800 font-mono rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Senha123"
                                                value={newUser.password || ''}
                                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Cargo / Função</label>
                                        <select
                                            className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                            value={newUser.role}
                                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                                        >
                                            <option value="THERAPIST">Terapeuta ABA</option>
                                            <option value="SPECIALIST">Especialista (Fono/TO)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Contract Configuration */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1 mb-3 flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Configuração do Contrato
                                </h4>

                                <div className="grid md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Contrato</label>
                                        <select
                                            className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                            value={newUser.financial?.contractType}
                                            onChange={(e) => {
                                                const type = e.target.value as ContractType;
                                                setNewUser({
                                                    ...newUser,
                                                    financial: {
                                                        ...newUser.financial!,
                                                        contractType: type,
                                                        // Auto-configure default taxes based on type
                                                        taxes: {
                                                            deductINSS: type === 'CLT',
                                                            deductIRRF: type === 'CLT'
                                                        }
                                                    }
                                                });
                                            }}
                                        >
                                            <option value="CLT">CLT (Carteira Assinada)</option>
                                            <option value="PJ">PJ (Prestador de Serviço)</option>
                                            <option value="ESTAGIO">Estagiário</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Modelo de Pagamento</label>
                                        <select
                                            className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                            value={newUser.financial?.salaryType}
                                            onChange={(e) => setNewUser({
                                                ...newUser,
                                                financial: { ...newUser.financial!, salaryType: e.target.value as any }
                                            })}
                                        >
                                            <option value="HOURLY">Horista (Por Hora)</option>
                                            <option value="MONTHLY">Mensalista (Fixo)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {newUser.financial?.salaryType === 'HOURLY' ? 'Valor Hora (R$)' : 'Salário Mensal (R$)'}
                                        </label>
                                        <input
                                            type="number"
                                            className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
                                            value={newUser.financial?.baseRate}
                                            onChange={(e) => setNewUser({
                                                ...newUser,
                                                financial: { ...newUser.financial!, baseRate: parseFloat(e.target.value) }
                                            })}
                                        />
                                    </div>
                                </div>

                                {/* Benefits & Taxes */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid md:grid-cols-2 gap-6">
                                    <div>
                                        <h5 className="font-bold text-gray-700 text-xs uppercase mb-2">Benefícios (Por dia)</h5>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-xs text-gray-500">Vale Refeição (R$)</label>
                                                <input
                                                    type="number"
                                                    className="w-full border border-gray-300 rounded p-1 text-sm"
                                                    value={newUser.financial?.benefits.mealValue}
                                                    onChange={(e) => setNewUser({
                                                        ...newUser,
                                                        financial: { ...newUser.financial!, benefits: { ...newUser.financial!.benefits, mealValue: parseFloat(e.target.value) } }
                                                    })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">Vale Transporte (R$)</label>
                                                <input
                                                    type="number"
                                                    className="w-full border border-gray-300 rounded p-1 text-sm"
                                                    value={newUser.financial?.benefits.transportValue}
                                                    onChange={(e) => setNewUser({
                                                        ...newUser,
                                                        financial: { ...newUser.financial!, benefits: { ...newUser.financial!.benefits, transportValue: parseFloat(e.target.value) } }
                                                    })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-gray-700 text-xs uppercase mb-2">Impostos & Descontos</h5>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 text-blue-600 rounded"
                                                    checked={newUser.financial?.taxes.deductINSS}
                                                    onChange={(e) => setNewUser({
                                                        ...newUser,
                                                        financial: { ...newUser.financial!, taxes: { ...newUser.financial!.taxes, deductINSS: e.target.checked } }
                                                    })}
                                                />
                                                <span className="text-sm text-gray-700">Descontar INSS em Folha</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 text-blue-600 rounded"
                                                    checked={newUser.financial?.taxes.deductIRRF}
                                                    onChange={(e) => setNewUser({
                                                        ...newUser,
                                                        financial: { ...newUser.financial!, taxes: { ...newUser.financial!.taxes, deductIRRF: e.target.checked } }
                                                    })}
                                                />
                                                <span className="text-sm text-gray-700">Descontar IRRF em Folha</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Schedule */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1 mb-3 flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Jornada de Trabalho
                                </h4>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Dias da Semana Ativos</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {weekDays.map((day, idx) => (
                                            <button
                                                key={day}
                                                onClick={() => toggleWeekDay(idx)}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${newUser.financial?.workSchedule.activeWeekDays.includes(idx)
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Entrada</label>
                                        <input
                                            type="time"
                                            className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
                                            value={newUser.financial?.workSchedule.start}
                                            onChange={(e) => setNewUser({
                                                ...newUser,
                                                financial: { ...newUser.financial!, workSchedule: { ...newUser.financial!.workSchedule, start: e.target.value } }
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Saída</label>
                                        <input
                                            type="time"
                                            className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
                                            value={newUser.financial?.workSchedule.end}
                                            onChange={(e) => setNewUser({
                                                ...newUser,
                                                financial: { ...newUser.financial!, workSchedule: { ...newUser.financial!.workSchedule, end: e.target.value } }
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Almoço (min)</label>
                                        <input
                                            type="number"
                                            className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
                                            value={newUser.financial?.workSchedule.lunchDurationMinutes}
                                            onChange={(e) => setNewUser({
                                                ...newUser,
                                                financial: { ...newUser.financial!, workSchedule: { ...newUser.financial!.workSchedule, lunchDurationMinutes: parseInt(e.target.value) } }
                                            })}
                                        />
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={newUser.financial?.allowOvertime}
                                            onChange={(e) => setNewUser({
                                                ...newUser,
                                                financial: { ...newUser.financial!, allowOvertime: e.target.checked }
                                            })}
                                            className="w-4 h-4 text-blue-600 rounded"
                                        />
                                        <span className="text-sm text-gray-700">Permitir pagamento de horas extras?</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="flex-1 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddUser}
                                disabled={!newUser.name || !newUser.financial?.baseRate}
                                className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" /> Salvar Cadastro
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};