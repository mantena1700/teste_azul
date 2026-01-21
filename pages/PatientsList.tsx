import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Patient, ScheduleItem, ServiceItem, PaymentMethod } from '../types';
import { Search, Plus, User, Calendar, CreditCard, Save, X, ChevronRight, Check, Trash2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PatientsList: React.FC = () => {
    const navigate = useNavigate();
    const { patients, addPatient, users } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Registration Wizard State
    const [step, setStep] = useState(1); // 1: Bio, 2: Financial, 3: Schedule
    const [newPatient, setNewPatient] = useState<Partial<Patient>>({
        name: '',
        age: 0,
        diagnosis: '',
        guardianIds: [], // Start with empty IDs for potentially new unregistered parents
        guardianNames: [], // Capture names as strings first
        financialConfig: {
            paymentMethod: 'PRIVATE',
            services: []
        },
        schedule: []
    });

    // Temporary state for lists within the form
    const [tempGuardian, setTempGuardian] = useState('');
    const [tempService, setTempService] = useState<Partial<ServiceItem>>({ name: '', price: 0, durationMinutes: 60 });
    const [tempSchedule, setTempSchedule] = useState<Partial<ScheduleItem>>({ dayOfWeek: 1, time: '14:00' });

    const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const therapists = users.filter(u => u.role === 'THERAPIST' || u.role === 'SPECIALIST');

    // --- WIZARD HANDLERS ---

    const handleNextStep = () => setStep(step + 1);
    const handlePrevStep = () => setStep(step - 1);

    const addGuardian = () => {
        if (tempGuardian) {
            setNewPatient({
                ...newPatient,
                guardianNames: [...(newPatient.guardianNames || []), tempGuardian],
                // Logic to optionally find existing user ID could go here in future
            });
            setTempGuardian('');
        }
    };

    const removeGuardian = (index: number) => {
        const updated = newPatient.guardianNames?.filter((_, i) => i !== index);
        setNewPatient({ ...newPatient, guardianNames: updated });
    };

    const addService = () => {
        if (tempService.name && tempService.price) {
            const service: ServiceItem = {
                id: `srv-${Date.now()}`,
                name: tempService.name!,
                price: Number(tempService.price),
                durationMinutes: Number(tempService.durationMinutes)
            };
            setNewPatient({
                ...newPatient,
                financialConfig: {
                    ...newPatient.financialConfig!,
                    services: [...(newPatient.financialConfig?.services || []), service]
                }
            });
            setTempService({ name: '', price: 0, durationMinutes: 60 });
        }
    };

    const removeService = (id: string) => {
        const updated = newPatient.financialConfig?.services.filter(s => s.id !== id);
        setNewPatient({
            ...newPatient,
            financialConfig: { ...newPatient.financialConfig!, services: updated || [] }
        });
    };

    const addScheduleItem = () => {
        if (tempSchedule.serviceId && tempSchedule.therapistId && tempSchedule.time) {
            const item: ScheduleItem = {
                id: `sch-${Date.now()}`,
                dayOfWeek: Number(tempSchedule.dayOfWeek),
                time: tempSchedule.time!,
                serviceId: tempSchedule.serviceId!,
                therapistId: tempSchedule.therapistId!
            };
            setNewPatient({
                ...newPatient,
                schedule: [...(newPatient.schedule || []), item]
            });
        }
    };

    const removeScheduleItem = (id: string) => {
        const updated = newPatient.schedule?.filter(s => s.id !== id);
        setNewPatient({ ...newPatient, schedule: updated });
    };

    const handleSavePatient = () => {
        if (!newPatient.name) return;
        const patient: Patient = {
            ...newPatient,
            id: `p-${Date.now()}`,
            startDate: new Date().toISOString().split('T')[0],
            anamnesisSummary: 'Cadastro inicial realizado via assistente.',
            photoUrl: undefined,
            guardianIds: [], // In a real flow, we would match names to actual User IDs here
            plans: [],
            medicalRecords: []
        } as Patient;

        addPatient(patient);
        setIsModalOpen(false);
        setStep(1);
        // Reset form
        setNewPatient({
            name: '',
            age: 0,
            diagnosis: '',
            guardianIds: [],
            guardianNames: [],
            financialConfig: { paymentMethod: 'PRIVATE', services: [] },
            schedule: []
        });
        alert('Paciente cadastrado com sucesso!');
    };

    const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestão de Pacientes</h1>
                    <p className="text-gray-500 text-sm">Cadastre, edite e gerencie os contratos e agendas.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5" /> Cadastrar Novo Paciente
                </button>
            </div>

            {/* Patient List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar paciente..."
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">Paciente</th>
                                <th className="px-6 py-4">Diagnóstico</th>
                                <th className="px-6 py-4">Responsáveis</th>
                                <th className="px-6 py-4">Contrato</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredPatients.map(patient => (
                                <tr key={patient.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => navigate(`/patient/${patient.id}`)}>
                                    <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                            {patient.name[0]}
                                        </div>
                                        {patient.name}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{patient.diagnosis}</td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {patient.guardianNames?.join(', ') || (patient.guardians as any)?.join(', ') || 'Sem registros'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${patient.financialConfig?.paymentMethod === 'PRIVATE' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                                            }`}>
                                            {patient.financialConfig?.paymentMethod === 'PRIVATE' ? 'Particular' : 'Convênio'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-blue-600 hover:text-blue-800 font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                            Gerenciar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* REGISTRATION WIZARD MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh]">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">Cadastro de Paciente</h3>
                                <p className="text-xs text-gray-500">Passo {step} de 3: {step === 1 ? 'Dados Básicos' : step === 2 ? 'Contrato & Serviços' : 'Agenda Fixa'}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-8 flex-1 overflow-y-auto">
                            {/* STEP 1: BIO & GUARDIANS */}
                            {step === 1 && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                                            <input className="w-full border p-2.5 rounded-lg border-gray-300" placeholder="Nome" value={newPatient.name} onChange={e => setNewPatient({ ...newPatient, name: e.target.value })} />
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Idade</label>
                                            <input type="number" className="w-full border p-2.5 rounded-lg border-gray-300" placeholder="Anos" value={newPatient.age} onChange={e => setNewPatient({ ...newPatient, age: parseInt(e.target.value) })} />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico</label>
                                            <input className="w-full border p-2.5 rounded-lg border-gray-300" placeholder="Ex: TEA Nível 1" value={newPatient.diagnosis} onChange={e => setNewPatient({ ...newPatient, diagnosis: e.target.value })} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Responsáveis</label>
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                className="flex-1 border p-2.5 rounded-lg border-gray-300"
                                                placeholder="Nome do Pai/Mãe"
                                                value={tempGuardian}
                                                onChange={e => setTempGuardian(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && addGuardian()}
                                            />
                                            <button onClick={addGuardian} className="bg-gray-100 px-4 rounded-lg font-bold text-gray-600 hover:bg-gray-200">Adicionar</button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {newPatient.guardianNames?.map((g, i) => (
                                                <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                                    {g} <button onClick={() => removeGuardian(i)}><X className="w-3 h-3 hover:text-red-500" /></button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: FINANCIAL & SERVICES */}
                            {step === 2 && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pagamento</label>
                                            <select
                                                className="w-full border p-2.5 rounded-lg border-gray-300 bg-white"
                                                value={newPatient.financialConfig?.paymentMethod}
                                                onChange={e => setNewPatient({
                                                    ...newPatient,
                                                    financialConfig: { ...newPatient.financialConfig!, paymentMethod: e.target.value as PaymentMethod }
                                                })}
                                            >
                                                <option value="PRIVATE">Particular</option>
                                                <option value="INSURANCE">Convênio / Plano</option>
                                                <option value="MIXED">Misto</option>
                                            </select>
                                        </div>
                                        {newPatient.financialConfig?.paymentMethod !== 'PRIVATE' && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Convênio</label>
                                                    <input
                                                        className="w-full border p-2.5 rounded-lg border-gray-300"
                                                        placeholder="Ex: Unimed"
                                                        value={newPatient.financialConfig?.insuranceName}
                                                        onChange={e => setNewPatient({
                                                            ...newPatient,
                                                            financialConfig: { ...newPatient.financialConfig!, insuranceName: e.target.value }
                                                        })}
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Número da Carteirinha</label>
                                                    <input
                                                        className="w-full border p-2.5 rounded-lg border-gray-300"
                                                        placeholder="000.000.000-00"
                                                        value={newPatient.financialConfig?.insuranceNumber}
                                                        onChange={e => setNewPatient({
                                                            ...newPatient,
                                                            financialConfig: { ...newPatient.financialConfig!, insuranceNumber: e.target.value }
                                                        })}
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="border-t border-gray-100 pt-4">
                                        <label className="block text-sm font-bold text-gray-900 mb-2">Serviços Contratados (Pacote)</label>
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-3 grid grid-cols-4 gap-2 items-end">
                                            <div className="col-span-2">
                                                <span className="text-xs text-gray-500 block mb-1">Nome do Serviço</span>
                                                <input className="w-full border p-2 rounded text-sm" placeholder="Ex: Sessão ABA" value={tempService.name} onChange={e => setTempService({ ...tempService, name: e.target.value })} />
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500 block mb-1">Valor Unit. (R$)</span>
                                                <input type="number" className="w-full border p-2 rounded text-sm" placeholder="0.00" value={tempService.price} onChange={e => setTempService({ ...tempService, price: parseFloat(e.target.value) })} />
                                            </div>
                                            <button onClick={addService} className="bg-green-600 text-white p-2 rounded font-bold text-sm h-[38px]">Adicionar</button>
                                        </div>

                                        <div className="space-y-2">
                                            {newPatient.financialConfig?.services.map(srv => (
                                                <div key={srv.id} className="flex justify-between items-center bg-white border border-gray-200 p-3 rounded-lg">
                                                    <div>
                                                        <p className="font-bold text-sm text-gray-800">{srv.name}</p>
                                                        <p className="text-xs text-gray-500">{srv.durationMinutes} min</p>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="font-mono text-sm font-bold text-gray-900">R$ {srv.price.toFixed(2)}</span>
                                                        <button onClick={() => removeService(srv.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                </div>
                                            ))}
                                            {newPatient.financialConfig?.services.length === 0 && <p className="text-sm text-gray-400 italic text-center">Nenhum serviço adicionado ainda.</p>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: SCHEDULE */}
                            {step === 3 && (
                                <div className="space-y-6">
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                                        <p className="text-sm text-blue-800">Defina os horários fixos de atendimento para gerar a agenda automática.</p>
                                    </div>

                                    <div className="grid grid-cols-4 gap-2 items-end bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <div>
                                            <span className="text-xs text-gray-500 block mb-1">Dia da Semana</span>
                                            <select className="w-full border p-2 rounded text-sm bg-white" value={tempSchedule.dayOfWeek} onChange={e => setTempSchedule({ ...tempSchedule, dayOfWeek: parseInt(e.target.value) })}>
                                                {weekDays.map((d, i) => <option key={i} value={i}>{d}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 block mb-1">Horário</span>
                                            <input type="time" className="w-full border p-2 rounded text-sm" value={tempSchedule.time} onChange={e => setTempSchedule({ ...tempSchedule, time: e.target.value })} />
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 block mb-1">Terapeuta</span>
                                            <select className="w-full border p-2 rounded text-sm bg-white" value={tempSchedule.therapistId} onChange={e => setTempSchedule({ ...tempSchedule, therapistId: e.target.value })}>
                                                <option value="">Selecione...</option>
                                                {therapists.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-span-4 md:col-span-1">
                                            <span className="text-xs text-gray-500 block mb-1">Serviço</span>
                                            <select className="w-full border p-2 rounded text-sm bg-white mb-2 md:mb-0" value={tempSchedule.serviceId} onChange={e => setTempSchedule({ ...tempSchedule, serviceId: e.target.value })}>
                                                <option value="">Selecione...</option>
                                                {newPatient.financialConfig?.services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                        <button onClick={addScheduleItem} className="col-span-4 bg-indigo-600 text-white p-2 rounded font-bold text-sm w-full mt-2">Adicionar Horário</button>
                                    </div>

                                    <div className="space-y-2">
                                        {newPatient.schedule?.map(item => {
                                            const therapist = therapists.find(t => t.id === item.therapistId);
                                            const service = newPatient.financialConfig?.services.find(s => s.id === item.serviceId);
                                            return (
                                                <div key={item.id} className="flex justify-between items-center bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-indigo-100 text-indigo-700 p-2 rounded-lg">
                                                            <Clock className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm text-gray-900">{weekDays[item.dayOfWeek]} às {item.time}</p>
                                                            <p className="text-xs text-gray-500">{service?.name} com {therapist?.name}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => removeScheduleItem(item.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            );
                                        })}
                                        {newPatient.schedule?.length === 0 && <p className="text-sm text-gray-400 italic text-center py-4">Nenhum horário fixo definido.</p>}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-between">
                            {step > 1 ? <button onClick={handlePrevStep} className="px-6 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100">Voltar</button> : <div />}
                            {step < 3 ? (
                                <button onClick={handleNextStep} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Próximo</button>
                            ) : (
                                <button onClick={handleSavePatient} className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-sm flex items-center gap-2">
                                    <Check className="w-4 h-4" /> Finalizar Cadastro
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};