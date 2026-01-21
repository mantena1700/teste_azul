import React, { useState, useMemo, useEffect } from 'react';
import {
    Calendar as CalendarIcon, Clock, UserCheck, PlayCircle, Plus, Search,
    Filter, ChevronLeft, ChevronRight, CheckCircle2,
    User, X, MapPin, DoorOpen, Users, LayoutGrid, AlertCircle, Calendar,
    MoreHorizontal, Phone, MessageSquare, ArrowRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Appointment } from '../types';

const ROOMS = ['Sala 1 (Sensorial)', 'Sala 2 (Mesa)', 'Sala 3 (Atividades)', 'Sala 4 (Fono)', 'Sala 5 (T.O.)'];

export const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const { appointments, patients, users, addAppointment, updateAppointment, deleteAppointment } = useData();
    const navigate = useNavigate();
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SAAS_ADMIN';

    // --- STATE ---
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'THERAPIST' | 'ROOM'>('THERAPIST');
    const [patientSearch, setPatientSearch] = useState('');

    // Modals State
    const [isApptModalOpen, setIsApptModalOpen] = useState(false);
    const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);

    // Detail View State
    const [detailEntity, setDetailEntity] = useState<{ id: string, type: 'THERAPIST' | 'ROOM', name: string } | null>(null);

    // Form/Editing State
    const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
    const [apptForm, setApptForm] = useState({
        patientId: '',
        therapistId: '',
        serviceId: '',
        serviceName: 'Sessão ABA',
        date: new Date().toISOString().split('T')[0],
        time: '08:00',
        duration: 60,
        room: 'Sala 1 (Sensorial)',
        status: 'SCHEDULED'
    });

    // --- HELPERS ---
    const getDayName = (date: Date) => date.toLocaleDateString('pt-BR', { weekday: 'long' });
    const getDateString = (date: Date) => date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const getISODate = (date: Date) => date.toISOString().split('T')[0];

    const handleDateChange = (days: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + days);
        setCurrentDate(newDate);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SCHEDULED': return 'bg-blue-50 border-l-4 border-l-blue-500 text-blue-900';
            case 'CONFIRMED': return 'bg-indigo-50 border-l-4 border-l-indigo-500 text-indigo-900';
            case 'ARRIVED': return 'bg-yellow-50 border-l-4 border-l-yellow-500 text-yellow-900 animate-pulse';
            case 'IN_SESSION': return 'bg-purple-50 border-l-4 border-l-purple-500 text-purple-900';
            case 'COMPLETED': return 'bg-green-50 border-l-4 border-l-green-500 text-green-900 opacity-75';
            case 'CANCELED': return 'bg-gray-100 border-l-4 border-l-gray-400 text-gray-500 line-through';
            case 'NO_SHOW': return 'bg-red-50 border-l-4 border-l-red-500 text-red-900';
            default: return 'bg-gray-50 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'SCHEDULED': return <Clock className="w-3 h-3" />;
            case 'CONFIRMED': return <CheckCircle2 className="w-3 h-3" />;
            case 'ARRIVED': return <UserCheck className="w-3 h-3" />;
            case 'IN_SESSION': return <PlayCircle className="w-3 h-3" />;
            case 'COMPLETED': return <CheckCircle2 className="w-3 h-3" />;
            case 'CANCELED': return <X className="w-3 h-3" />;
            default: return null;
        }
    };

    const getPatientName = (id: string) => patients.find(p => p.id === id)?.name || 'Desconhecido';
    const getTherapistName = (id: string) => users.find(u => u.id === id)?.name || 'Desconhecido';

    // --- ACTIONS ---

    const handleSlotClick = (therapistId: string, time: string, room?: string) => {
        setEditingAppt(null);
        setApptForm({
            patientId: '',
            therapistId: viewMode === 'THERAPIST' ? therapistId : '',
            serviceId: '',
            serviceName: 'Sessão ABA',
            date: getISODate(currentDate),
            time: time,
            duration: 60,
            room: viewMode === 'ROOM' ? therapistId : (room || 'Sala 1 (Sensorial)'),
            status: 'SCHEDULED'
        });
        setIsApptModalOpen(true);
    };

    const handleEditAppt = (appt: Appointment) => {
        setEditingAppt(appt);
        setApptForm({
            patientId: appt.patientId,
            therapistId: appt.therapistId,
            serviceId: appt.serviceId || '',
            serviceName: appt.serviceName,
            date: appt.date,
            time: appt.time,
            duration: appt.duration,
            room: appt.room,
            status: appt.status as any
        });
        setIsApptModalOpen(true);
    };

    const handleSaveAppt = () => {
        if (editingAppt) {
            updateAppointment(editingAppt.id, apptForm as any);
        } else {
            addAppointment({
                id: `appt-${Date.now()}`,
                ...apptForm
            } as Appointment);
        }
        setIsApptModalOpen(false);
    };

    const handleDeleteAppt = () => {
        if (editingAppt && confirm('Tem certeza que deseja cancelar/remover este agendamento?')) {
            deleteAppointment(editingAppt.id);
            setIsApptModalOpen(false);
        }
    };

    const handleChangeStatus = (id: string, newStatus: Appointment['status']) => {
        updateAppointment(id, { status: newStatus });
    };

    // --- DERIVED: Available Services for Selected Patient ---
    const patientServices = useMemo(() => {
        if (!apptForm.patientId) return [];
        const patient = patients.find(p => p.id === apptForm.patientId);
        return patient?.financialConfig?.services || [];
    }, [apptForm.patientId, patients]);

    // --- FILTERED DATA LOGIC ---
    const currentISODate = getISODate(currentDate);

    const filteredAppointments = appointments.filter(a => {
        const isDateMatch = a.date === currentISODate;
        const patientName = getPatientName(a.patientId).toLowerCase();
        const isPatientMatch = !patientSearch || patientName.includes(patientSearch.toLowerCase());
        return isDateMatch && isPatientMatch;
    });

    const waitingPatients = appointments.filter(a => a.date === currentISODate && a.status === 'ARRIVED');

    // --- COMPONENT: CURRENT TIME INDICATOR ---
    const CurrentTimeLine = () => {
        const [now, setNow] = useState(new Date());
        useEffect(() => {
            const timer = setInterval(() => setNow(new Date()), 60000);
            return () => clearInterval(timer);
        }, []);
        const startHour = 7;
        const hours = now.getHours();
        const minutes = now.getMinutes();
        if (hours < startHour || hours > 19) return null;
        const topPosition = ((hours - startHour) * 96) + ((minutes / 60) * 96);
        return (
            <div
                className="absolute left-0 right-0 border-t-2 border-red-500 z-20 pointer-events-none flex items-center"
                style={{ top: `${topPosition}px` }}
            >
                <div className="bg-red-500 text-white text-[10px] font-bold px-1 rounded-r -mt-[1px]">
                    {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}
                </div>
                <div className="w-2 h-2 bg-red-500 rounded-full -ml-1"></div>
            </div>
        );
    };

    // --- RENDER ---

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Painel do Terapeuta</h2>
                <p className="text-gray-500">Acesse "Realizar Sessão" ou "Meus Pacientes" no menu lateral.</p>
                <Link to="/session" className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700">
                    Ir para Sessão Atual
                </Link>
            </div>
        );
    }

    const calendarColumns = viewMode === 'THERAPIST'
        ? users.filter(u => u.role === 'THERAPIST' || u.role === 'SPECIALIST').map(u => ({ id: u.id, title: u.name, type: 'THERAPIST' as const, avatar: u.avatarUrl }))
        : ROOMS.map(r => ({ id: r, title: r, type: 'ROOM' as const, avatar: null }));

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-4 overflow-hidden bg-gray-100/50 p-2 md:p-0">

            {/* === LEFT PANEL: RECEPTION CONTROLS === */}
            <div className="md:w-80 flex flex-col gap-3 shrink-0 h-full overflow-hidden">

                {/* 1. SEARCH & ACTIONS */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm shrink-0">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Atendimento Rápido</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                            placeholder="Buscar paciente..."
                            value={patientSearch}
                            onChange={(e) => setPatientSearch(e.target.value)}
                        />
                        {/* Live Search Results */}
                        {patientSearch && (
                            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl mt-1 z-50 max-h-48 overflow-y-auto">
                                {patients.filter(p => p.name.toLowerCase().includes(patientSearch.toLowerCase())).map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => navigate(`/patient/${p.id}`)}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between group"
                                    >
                                        <span className="text-sm font-medium text-gray-800">{p.name}</span>
                                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                                    </button>
                                ))}
                                {patients.filter(p => p.name.toLowerCase().includes(patientSearch.toLowerCase())).length === 0 && (
                                    <div className="p-3 text-xs text-gray-500 text-center">Nenhum paciente encontrado.</div>
                                )}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => setIsNewPatientModalOpen(true)}
                        className="w-full mt-3 bg-indigo-600 text-white py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Novo Paciente
                    </button>
                </div>

                {/* 2. CALENDAR NAVIGATOR */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm shrink-0">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-gray-700 text-sm">Calendário</h3>
                        <span className="text-xs text-gray-400 capitalize">{getDateString(currentDate)}</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 text-gray-400 font-bold">
                        <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-sm">
                        {Array.from({ length: 30 }).map((_, i) => {
                            const d = new Date();
                            d.setDate(d.getDate() - d.getDate() + i + 1);
                            const isToday = d.toDateString() === new Date().toDateString();
                            const isSelected = d.toDateString() === currentDate.toDateString();

                            return (
                                <button
                                    key={i}
                                    onClick={() => setCurrentDate(d)}
                                    className={`p-1.5 rounded-md hover:bg-gray-100 transition-colors text-xs ${isSelected ? 'bg-indigo-600 text-white font-bold' :
                                        isToday ? 'border border-indigo-600 text-indigo-600 font-bold' : 'text-gray-700'
                                        }`}
                                >
                                    {d.getDate()}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* 3. WAITING ROOM */}
                <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-0">
                    <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
                        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-yellow-600" /> Sala de Espera
                        </h3>
                        <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {waitingPatients.length}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                        {waitingPatients.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-4">
                                <Clock className="w-8 h-8 mb-2 opacity-20" />
                                <p className="text-xs">Recepção vazia.</p>
                            </div>
                        )}
                        {waitingPatients.map(wp => (
                            <div key={wp.id} className="bg-white border-l-4 border-l-yellow-400 border border-gray-200 p-3 rounded-lg shadow-sm flex flex-col gap-2 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-sm text-gray-900 leading-tight">{getPatientName(wp.patientId)}</p>
                                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                            <Clock className="w-3 h-3" /> {wp.time}
                                        </div>
                                        <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                                            <User className="w-3 h-3" /> {getTherapistName(wp.therapistId).split(' ')[0]}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleChangeStatus(wp.id, 'IN_SESSION')}
                                    className="w-full bg-green-50 text-green-700 border border-green-200 text-xs font-bold py-2 rounded flex items-center justify-center gap-1 hover:bg-green-100 transition-colors"
                                >
                                    <PlayCircle className="w-3 h-3" /> Enviar para Sala
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* === RIGHT PANEL: SCHEDULER GRID (FLUID) === */}
            <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden relative h-full">

                {/* TOOLBAR */}
                <div className="p-3 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center bg-white sticky top-0 z-20 gap-3 shrink-0">
                    <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto no-scrollbar">
                        <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200">
                            <button onClick={() => handleDateChange(-1)} className="p-1.5 hover:bg-white rounded shadow-sm transition-all"><ChevronLeft className="w-4 h-4 text-gray-600" /></button>
                            <button onClick={() => setCurrentDate(new Date())} className="px-3 text-xs font-bold text-gray-600 hover:text-indigo-600 whitespace-nowrap">Hoje</button>
                            <button onClick={() => handleDateChange(1)} className="p-1.5 hover:bg-white rounded shadow-sm transition-all"><ChevronRight className="w-4 h-4 text-gray-600" /></button>
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 capitalize whitespace-nowrap">
                            {getDayName(currentDate)}, {getDateString(currentDate)}
                        </h2>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        {/* View Toggle */}
                        <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                            <button
                                onClick={() => setViewMode('THERAPIST')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${viewMode === 'THERAPIST' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Users className="w-3 h-3" /> Terapeutas
                            </button>
                            <button
                                onClick={() => setViewMode('ROOM')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${viewMode === 'ROOM' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <DoorOpen className="w-3 h-3" /> Salas
                            </button>
                        </div>

                        <button
                            onClick={() => setIsApptModalOpen(true)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-sm flex items-center gap-2 active:scale-95 transition-all whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" /> Agendar
                        </button>
                    </div>
                </div>

                {/* SCROLLABLE GRID AREA */}
                <div className="flex-1 overflow-auto bg-gray-50/50 custom-scrollbar relative">
                    <div className="flex min-w-max pb-10">

                        {/* Time Axis (Sticky Left) */}
                        <div className="sticky left-0 z-30 w-14 bg-white border-r border-gray-200 shrink-0">
                            <div className="h-12 border-b border-gray-200 bg-white"></div>
                            {Array.from({ length: 13 }).map((_, i) => (
                                <div key={i} className="h-24 border-b border-gray-100 text-[10px] text-gray-400 font-bold relative bg-white box-border">
                                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-white px-1 z-10">{i + 7}:00</span>
                                </div>
                            ))}
                        </div>

                        {/* Dynamic Columns */}
                        <div className="flex relative">
                            <div className="absolute inset-0 pointer-events-none z-0">
                                <div className="h-12"></div>
                                <CurrentTimeLine />
                            </div>

                            {calendarColumns.map(column => {
                                const colAppts = filteredAppointments.filter(a =>
                                    viewMode === 'THERAPIST' ? a.therapistId === column.id : a.room === column.id
                                );

                                return (
                                    <div key={column.id} className="w-64 border-r border-gray-200 relative bg-white/50 even:bg-white">
                                        {/* Column Header */}
                                        <button
                                            onClick={() => setDetailEntity({ id: column.id, type: column.type, name: column.title })}
                                            className="w-full h-12 border-b border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center sticky top-0 z-20 shadow-sm px-2 cursor-pointer transition-colors group border-t-4 border-t-transparent hover:border-t-indigo-500"
                                        >
                                            <div className="flex items-center gap-2">
                                                {column.avatar && <img src={column.avatar} className="w-6 h-6 rounded-full border border-gray-200" alt="" />}
                                                <span className={`font-bold text-xs truncate group-hover:text-indigo-700 ${viewMode === 'ROOM' ? 'text-indigo-700' : 'text-gray-700'}`}>
                                                    {column.title}
                                                </span>
                                                <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-indigo-500" />
                                            </div>
                                        </button>

                                        {/* Slots & Appointments */}
                                        <div className="relative">
                                            {Array.from({ length: 13 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="h-24 border-b border-gray-100 group/slot cursor-pointer hover:bg-indigo-50/30 transition-colors relative"
                                                    onClick={() => handleSlotClick(column.id, `${i + 7}:00`)}
                                                >
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/slot:opacity-100">
                                                        <Plus className="w-4 h-4 text-indigo-300" />
                                                    </div>
                                                </div>
                                            ))}

                                            {colAppts.map(appt => {
                                                const startHour = parseInt(appt.time.split(':')[0]);
                                                const startMin = parseInt(appt.time.split(':')[1] || '0');
                                                const top = ((startHour - 7) * 96) + ((startMin / 60) * 96);
                                                const height = (appt.duration / 60) * 96;

                                                return (
                                                    <div
                                                        key={appt.id}
                                                        style={{ top: `${top}px`, height: `${height}px` }}
                                                        onClick={(e) => { e.stopPropagation(); handleEditAppt(appt); }}
                                                        className={`absolute left-1 right-1 p-2 shadow-sm cursor-pointer hover:shadow-md transition-all z-10 group overflow-hidden flex flex-col justify-between rounded-r-md ${getStatusColor(appt.status)} border border-gray-200/50`}
                                                    >
                                                        <div>
                                                            <div className="flex justify-between items-start">
                                                                <span className="font-bold text-xs truncate leading-tight">{getPatientName(appt.patientId)}</span>
                                                                {getStatusIcon(appt.status)}
                                                            </div>
                                                            <div className="text-[10px] opacity-80 mt-0.5 truncate">{appt.serviceName}</div>
                                                        </div>

                                                        <div className="flex justify-between items-end">
                                                            <span className="text-[10px] font-mono opacity-70">{appt.time}</span>
                                                            <div className="flex items-center gap-1 opacity-70 text-[10px]">
                                                                {viewMode === 'THERAPIST' ? (
                                                                    <><DoorOpen className="w-3 h-3" /> {appt.room.split(' ')[0]}</>
                                                                ) : (
                                                                    <><User className="w-3 h-3" /> {getTherapistName(appt.therapistId).split(' ')[0]}</>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MODALS --- */}

            {/* 1. APPOINTMENT MODAL */}
            {isApptModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                {editingAppt ? 'Gerenciar Agendamento' : 'Novo Agendamento'}
                            </h3>
                            <button onClick={() => setIsApptModalOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Paciente</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={apptForm.patientId}
                                        onChange={(e) => setApptForm({ ...apptForm, patientId: e.target.value })}
                                    >
                                        <option value="">Selecione o Paciente...</option>
                                        {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>

                                {/* SERVICE SELECTOR (Dynamically Loaded) */}
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Serviço / Procedimento</label>
                                    {patientServices.length > 0 ? (
                                        <select
                                            className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={apptForm.serviceId}
                                            onChange={(e) => {
                                                const svc = patientServices.find(s => s.id === e.target.value);
                                                setApptForm({
                                                    ...apptForm,
                                                    serviceId: e.target.value,
                                                    serviceName: svc?.name || 'Serviço'
                                                });
                                            }}
                                        >
                                            <option value="">Selecione o Serviço...</option>
                                            {patientServices.map(s => (
                                                <option key={s.id} value={s.id}>{s.name} - R$ {s.price}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-50 text-gray-600"
                                            value="Sessão Padrão (Sem Contrato Específico)"
                                            readOnly
                                        />
                                    )}
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Profissional</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={apptForm.therapistId}
                                        onChange={(e) => setApptForm({ ...apptForm, therapistId: e.target.value })}
                                    >
                                        <option value="">Selecione o Terapeuta...</option>
                                        {users.filter(u => u.role === 'THERAPIST' || u.role === 'SPECIALIST').map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data</label>
                                    <input
                                        type="date"
                                        className="w-full border border-gray-300 rounded-lg p-2.5"
                                        value={apptForm.date}
                                        onChange={(e) => setApptForm({ ...apptForm, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Horário</label>
                                    <input
                                        type="time"
                                        className="w-full border border-gray-300 rounded-lg p-2.5"
                                        value={apptForm.time}
                                        onChange={(e) => setApptForm({ ...apptForm, time: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sala de Atendimento</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg p-2.5 bg-white"
                                        value={apptForm.room}
                                        onChange={(e) => setApptForm({ ...apptForm, room: e.target.value })}
                                    >
                                        {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg p-2.5 bg-white"
                                        value={apptForm.status}
                                        onChange={(e) => setApptForm({ ...apptForm, status: e.target.value as any })}
                                    >
                                        <option value="SCHEDULED">Agendado</option>
                                        <option value="CONFIRMED">Confirmado</option>
                                        <option value="ARRIVED">Na Recepção (Chegou)</option>
                                        <option value="IN_SESSION">Em Atendimento</option>
                                        <option value="COMPLETED">Finalizado</option>
                                        <option value="CANCELED">Cancelado</option>
                                        <option value="NO_SHOW">Não Compareceu</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="p-5 bg-gray-50 border-t border-gray-100 flex gap-3">
                            {editingAppt && (
                                <button
                                    onClick={handleDeleteAppt}
                                    className="px-4 py-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-bold"
                                >
                                    Excluir
                                </button>
                            )}
                            <button onClick={() => setIsApptModalOpen(false)} className="flex-1 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-lg">Cancelar</button>
                            <button
                                onClick={handleSaveAppt}
                                className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-sm"
                            >
                                {editingAppt ? 'Salvar Alterações' : 'Confirmar Agendamento'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. NEW PATIENT MODAL */}
            {isNewPatientModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200 text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Novo Paciente</h3>
                        <p className="text-sm text-gray-500 mb-6">Você será redirecionado para a ficha completa de cadastro.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setIsNewPatientModalOpen(false)} className="flex-1 py-2.5 text-gray-600 font-bold bg-gray-100 hover:bg-gray-200 rounded-lg">Cancelar</button>
                            <button
                                onClick={() => navigate('/patients')}
                                className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-sm"
                            >
                                Ir para Cadastro
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};