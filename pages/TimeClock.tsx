import React, { useState, useEffect } from 'react';
import { MOCK_USERS } from '../constants';
import { TimeLog } from '../types';
import * as ApiService from '../services/ApiService';
import { Clock, LogIn, LogOut, AlertCircle, Calendar, Plus, Save, X, Download, HelpCircle, Check, Ban, Camera, FileText, Upload } from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

export const TimeClock: React.FC = () => {
    const { user } = useAuth(); // Logged in user
    const { users } = useData(); // All users for admin view
    const role = user?.role || 'THERAPIST';

    const [logs, setLogs] = useState<TimeLog[]>([]);
    const [isWorking, setIsWorking] = useState(false);
    const [currentSessionStart, setCurrentSessionStart] = useState<number | null>(null);

    // Load Logs on Mount
    useEffect(() => {
        refreshLogs();
    }, [user?.id]);

    const refreshLogs = async () => {
        try {
            // If admin/manager, maybe fetch all logs? For now let's just fetch everything and filter in client or improve API
            // The API getLogs supports userId filter.
            // If ROLE is ADMIN, fetch ALL? Or just fetch all and filter locally?
            // Let's fetch all for simplicity if Admin, or just mine if Therapist.
            // Actually, the previous code fetched ALL logs from LocalDatabase via getLogs()

            const fetchedLogs = await ApiService.getTimeLogs(); // Fetch all
            setLogs(fetchedLogs || []);

            // Check if user is currently working (last log has In but no Out)
            // Filter for current user logs, sorted by date desc
            const myLogs = (fetchedLogs || []).filter((l: TimeLog) => l.userId === user?.id).sort((a: any, b: any) => b.clockIn - a.clockIn);
            if (myLogs.length > 0) {
                const lastLog = myLogs[0];
                if (!lastLog.clockOut && lastLog.type !== 'MANUAL') {
                    if (lastLog.type === 'REGULAR') {
                        setIsWorking(true);
                        setCurrentSessionStart(lastLog.clockIn);
                    }
                } else {
                    setIsWorking(false);
                    setCurrentSessionStart(null);
                }
            }
        } catch (error) {
            console.error("Failed to load time logs:", error);
        }
    };

    // Manual Entry Modal
    const [showManualModal, setShowManualModal] = useState(false);
    const [manualDate, setManualDate] = useState('');
    const [manualTimeIn, setManualTimeIn] = useState('');
    const [manualTimeOut, setManualTimeOut] = useState('');
    const [justification, setJustification] = useState('');
    const [hasPhoto, setHasPhoto] = useState(false); // Mock photo state

    // Confirmation Modal State
    const [confirmAction, setConfirmAction] = useState<'IN' | 'OUT' | null>(null);
    const [actionTime, setActionTime] = useState<Date | null>(null);

    // Rejection Modal State
    const [rejectingLogId, setRejectingLogId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    // Format Helpers
    const formatTime = (timestamp?: number) => {
        if (!timestamp) return '--:--';
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString: string) => {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    // Step 1: User clicks button, open confirmation modal
    const requestToggleClock = () => {
        setActionTime(new Date());
        setConfirmAction(isWorking ? 'OUT' : 'IN');
    };

    // Step 2: User confirmed, execute logic
    const finalizeToggleClock = async () => {
        if (!actionTime) return;

        const exactTime = Date.now();
        const today = new Date().toISOString().split('T')[0];

        try {
            if (confirmAction === 'IN') {
                const newLog: TimeLog = {
                    id: `tl-${exactTime}`,
                    userId: user?.id || 'u-1',
                    date: today,
                    clockIn: exactTime,
                    type: 'REGULAR',
                    status: 'APPROVED',
                    relatedSessionStart: exactTime + (1000 * 60 * 15),
                    // @ts-ignore
                    clinicId: user?.clinicId
                };
                // LOGIC: Save to API
                await ApiService.createTimeLog(newLog);
                await refreshLogs();

            } else if (confirmAction === 'OUT') {
                const myLogs = logs.filter(l => l.userId === user?.id && !l.clockOut && l.type === 'REGULAR').sort((a, b) => b.clockIn - a.clockIn);
                if (myLogs.length > 0) {
                    const activeLog = myLogs[0];
                    await ApiService.updateTimeLog(activeLog.id, { clockOut: exactTime });

                    // AUTOMATIC FINANCIAL CALCULATION
                    if (user?.financial?.baseRate) {
                        const durationHours = (exactTime - activeLog.clockIn) / 1000 / 60 / 60;
                        const totalValue = durationHours * user.financial.baseRate;

                        await ApiService.createTransaction({
                            id: `trx-payroll-${Date.now()}`,
                            date: today,
                            description: `Pagamento de Horas: ${user.name} (${durationHours.toFixed(2)}h)`,
                            amount: Number(totalValue.toFixed(2)),
                            type: 'EXPENSE',
                            category: 'EXPENSE_PAYROLL',
                            status: 'PENDING', // Pending approval by manager
                            entityId: user.id,
                            entityName: user.name,
                            paymentMethod: 'TRANSFER',
                            isSystemGenerated: true,
                            costCenter: 'RH',
                            // @ts-ignore
                            clinicId: user?.clinicId
                        });
                    }
                }
                await refreshLogs();
            }
        } catch (error) {
            console.error("Error updating time log:", error);
            alert("Erro ao salvar ponto. Tente novamente.");
        }

        setConfirmAction(null);
        setActionTime(null);
    };

    // Save Manual Entry
    const handleSaveManual = async () => {
        if (!manualDate || !manualTimeIn || !justification) return;

        const start = new Date(`${manualDate}T${manualTimeIn}`).getTime();
        const end = manualTimeOut ? new Date(`${manualDate}T${manualTimeOut}`).getTime() : undefined;

        const newLog: TimeLog = {
            id: `tl-manual-${Date.now()}`,
            userId: user?.id || 'u-1',
            date: manualDate,
            clockIn: start,
            clockOut: end,
            type: 'MANUAL',
            status: 'PENDING',
            justification: justification,
            relatedSessionStart: start + (1000 * 60 * 10),
            photoUrl: hasPhoto ? 'mock-url-photo.jpg' : undefined,
            // @ts-ignore
            clinicId: user?.clinicId
        };

        try {
            await ApiService.createTimeLog(newLog);
            await refreshLogs();

            setShowManualModal(false);
            setManualDate('');
            setManualTimeIn('');
            setManualTimeOut('');
            setJustification('');
            setHasPhoto(false);
            alert("Solicitação enviada para aprovação do administrador.");
        } catch (error) {
            console.error("Error saving manual log:", error);
            alert("Erro ao salvar solicitação.");
        }
    };

    const handleApprove = async (logId: string) => {
        try {
            await ApiService.updateTimeLog(logId, { status: 'APPROVED' });
            await refreshLogs();
        } catch (error) {
            console.error("Error approving log:", error);
        }
    };

    // Open Rejection Modal
    const initiateReject = (logId: string) => {
        setRejectingLogId(logId);
        setRejectionReason('');
    };

    // Confirm Rejection
    const confirmRejection = async () => {
        if (!rejectingLogId || !rejectionReason.trim()) return;

        try {
            await ApiService.updateTimeLog(rejectingLogId, {
                status: 'REJECTED',
                rejectionReason: rejectionReason
            });
            await refreshLogs();

            setRejectingLogId(null);
            setRejectionReason('');
        } catch (error) {
            console.error("Error rejecting log:", error);
        }
    };

    const calculateGap = (log: TimeLog) => {
        if (!log.relatedSessionStart || !log.clockIn) return null;
        const diff = (log.relatedSessionStart - log.clockIn) / 1000 / 60; // in minutes
        return Math.floor(diff);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const currentUser = user || (users || []).find(u => u.id === 'u-1'); // Use real users or fallback

        doc.setFillColor(37, 99, 235);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text("Relatório de Ponto - ABA Nexus", 14, 20);
        doc.setFontSize(12);
        doc.text("Clínica Integrar - Controle de Jornada", 14, 30);
        doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 150, 30);

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.text(`Colaborador: ${currentUser?.name}`, 14, 55);
        doc.text(`Cargo: Terapeuta ABA`, 14, 62);

        const myLogs = logs.filter(l => l.userId === currentUser?.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const tableBody = myLogs.map(log => {
            const date = formatDate(log.date);
            const entry = formatTime(log.clockIn);
            const exit = log.clockOut ? formatTime(log.clockOut) : '--:--';
            const type = log.type === 'MANUAL' ? 'Manual' : 'Regular';
            const status = log.status === 'APPROVED' ? 'Aprovado' : log.status === 'PENDING' ? 'Pendente' : 'Rejeitado';
            let note = log.justification ? log.justification : '-';
            if (log.status === 'REJECTED' && log.rejectionReason) {
                note += ` [RECUSADO: ${log.rejectionReason}]`;
            }

            let duration = '0.00';
            if (log.clockOut && log.clockIn && log.status === 'APPROVED') {
                duration = ((log.clockOut - log.clockIn) / 1000 / 60 / 60).toFixed(2);
            }

            return [date, entry, exit, duration + ' h', type, status, note];
        });

        autoTable(doc, {
            startY: 70,
            head: [['Data', 'Entrada', 'Saída', 'Horas', 'Tipo', 'Status', 'Observação']],
            body: tableBody,
            theme: 'striped',
            headStyles: { fillColor: [37, 99, 235] },
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: { 6: { cellWidth: 'auto' } }
        });

        const totalHours = myLogs
            .filter(l => l.clockOut && l.clockIn && l.status === 'APPROVED')
            .reduce((acc, l) => acc + ((l.clockOut! - l.clockIn) / 1000 / 60 / 60), 0);

        const finalY = (doc as any).lastAutoTable.finalY || 150;
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`Total de Horas Aprovadas: ${totalHours.toFixed(2)}h`, 14, finalY + 15);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text("Este documento serve como comprovante de registro de ponto eletrônico.", 14, finalY + 25);

        doc.save(`ponto_aba_nexus_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const pendingLogs = logs.filter(l => l.status === 'PENDING');
    const allLogs = logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="space-y-6 pb-20 md:pb-0">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Ponto Eletrônico</h1>
                    <p className="text-gray-500 text-sm">
                        {role === 'ADMIN'
                            ? 'Gestão de jornada, aprovações e auditoria.'
                            : 'Registre seus horários de entrada e saída.'}
                    </p>
                </div>
                {role === 'THERAPIST' && (
                    <div className="flex gap-2 w-full md:w-auto">
                        <button
                            onClick={handleExportPDF}
                            className="flex-1 md:flex-none text-gray-700 bg-white border border-gray-300 text-sm font-medium hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                            <Download className="w-4 h-4" /> Relatório Ponto
                        </button>
                        <button
                            onClick={() => setShowManualModal(true)}
                            className="flex-1 md:flex-none text-blue-600 bg-blue-50 text-sm font-medium hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Registro Manual
                        </button>
                    </div>
                )}
            </div>

            {/* THERAPIST VIEW */}
            {role === 'THERAPIST' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center">
                        <div className={`mb-6 p-6 rounded-full ${isWorking ? 'bg-green-100' : 'bg-gray-100'}`}>
                            <Clock className={`w-16 h-16 ${isWorking ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            {isWorking ? 'Você está em serviço' : 'Você não está trabalhando'}
                        </h2>
                        <p className="text-gray-500 mb-8">
                            {isWorking
                                ? `Entrada registrada às ${formatTime(currentSessionStart!)}`
                                : 'Clique abaixo para registrar sua chegada.'}
                        </p>

                        <button
                            onClick={requestToggleClock}
                            className={`w-full max-w-sm py-5 rounded-xl text-xl font-bold flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-md ${isWorking
                                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-200'
                                : 'bg-green-600 hover:bg-green-700 text-white shadow-green-200'
                                }`}
                        >
                            {isWorking ? (
                                <>
                                    <LogOut className="w-8 h-8" /> Encerrar Expediente
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-8 h-8" /> Registrar Entrada
                                </>
                            )}
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-gray-700">
                            Seus Últimos Registros
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {logs.filter(l => l.userId === user?.id).slice(0, 5).map(log => (
                                <div key={log.id} className="p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-10 rounded-full ${log.type === 'MANUAL' ? 'bg-amber-400' : 'bg-blue-500'}`} />
                                        <div>
                                            <p className="font-bold text-gray-800">{formatDate(log.date)}</p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    {log.type === 'MANUAL' && <AlertCircle className="w-3 h-3 text-amber-500" />}
                                                    {log.type === 'MANUAL' ? 'Registro Manual' : 'Ponto Regular'}
                                                </p>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${log.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                    log.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {log.status === 'APPROVED' ? 'Aprovado' : log.status === 'PENDING' ? 'Pendente' : 'Recusado'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-mono text-gray-700">
                                            <span className="text-green-600">{formatTime(log.clockIn)}</span>
                                            <span className="text-gray-300 mx-1">➜</span>
                                            <span className="text-red-500">{formatTime(log.clockOut)}</span>
                                        </p>
                                        {log.status === 'REJECTED' && (
                                            <p className="text-[10px] text-red-500 max-w-[100px] truncate" title={log.rejectionReason}>
                                                Motivo: {log.rejectionReason}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ADMIN VIEW */}
            {role === 'ADMIN' && (
                <div className="space-y-6">

                    {/* PENDING REQUESTS SECTION */}
                    {pendingLogs.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                            <h3 className="text-amber-800 font-bold flex items-center gap-2 mb-4">
                                <AlertCircle className="w-5 h-5" />
                                Solicitações de Ajuste Manual ({pendingLogs.length})
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                {pendingLogs.map(log => {
                                    const logUser = users.find(u => u.id === log.userId) || { name: 'Desconhecido', id: 'unknown' };
                                    return (
                                        <div key={log.id} className="bg-white p-4 rounded-lg shadow-sm border border-amber-100 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-xs">
                                                            {(logUser.name || '?')[0]}
                                                        </div>
                                                        <span className="font-bold text-gray-900">{logUser.name}</span>
                                                    </div>
                                                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{formatDate(log.date)}</span>
                                                </div>
                                                <p className="text-sm text-gray-600 italic border-l-2 border-amber-300 pl-2 my-2">
                                                    "{log.justification}"
                                                </p>
                                                {log.photoUrl && (
                                                    <div className="flex items-center gap-1 text-xs text-blue-600 mb-2">
                                                        <Camera className="w-3 h-3" />
                                                        <span>Foto anexada pelo colaborador</span>
                                                    </div>
                                                )}
                                                <div className="text-xs text-gray-500 mb-3">
                                                    Solicita: <span className="font-bold">{formatTime(log.clockIn)}</span> às <span className="font-bold">{formatTime(log.clockOut)}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mt-2">
                                                <button
                                                    onClick={() => initiateReject(log.id)}
                                                    className="flex-1 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded flex items-center justify-center gap-1"
                                                >
                                                    <Ban className="w-3 h-3" /> Recusar
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(log.id)}
                                                    className="flex-1 py-2 text-xs font-bold text-green-600 bg-green-50 hover:bg-green-100 rounded flex items-center justify-center gap-1"
                                                >
                                                    <Check className="w-3 h-3" /> Aprovar
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ALL LOGS TABLE */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 font-bold text-gray-800">Histórico Completo da Equipe</div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4">Colaborador</th>
                                        <th className="px-6 py-4">Data</th>
                                        <th className="px-6 py-4">Horário</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Gap (Ocioso)</th>
                                        <th className="px-6 py-4">Obs</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {allLogs.map(log => {
                                        const logUser = users.find(u => u.id === log.userId) || { name: 'Desconhecido', id: 'unknown' };
                                        const gap = calculateGap(log);

                                        return (
                                            <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500 text-xs">
                                                        {(logUser.name || '?').charAt(0)}
                                                    </div>
                                                    <span className="font-medium text-gray-900">{logUser.name}</span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">{formatDate(log.date)}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-mono text-gray-900 font-bold">
                                                            {formatTime(log.clockIn)} - {formatTime(log.clockOut)}
                                                        </span>
                                                        {log.type === 'MANUAL' && <span className="text-[10px] text-amber-600">Manual</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${log.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                        log.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {log.status === 'APPROVED' ? 'OK' : log.status === 'REJECTED' ? 'Recusado' : 'Pendente'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 border-r border-gray-100 bg-gray-50/50">
                                                    {gap !== null ? (
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${gap > 15 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                                                            }`}>
                                                            {gap} min
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-300">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 max-w-xs text-xs">
                                                    {log.status === 'REJECTED' ? (
                                                        <span className="text-red-600 font-bold">Recusa: {log.rejectionReason}</span>
                                                    ) : log.justification ? (
                                                        <span className="text-gray-600 italic" title={log.justification}>
                                                            "{log.justification}"
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 text-center">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmAction === 'IN' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                }`}>
                                <HelpCircle className="w-8 h-8" />
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {confirmAction === 'IN' ? 'Confirmar Entrada?' : 'Confirmar Saída?'}
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Você está prestes a registrar sua {confirmAction === 'IN' ? 'entrada' : 'saída'} às:
                                <br />
                                <span className="text-2xl font-mono font-bold text-gray-800 mt-2 block">
                                    {actionTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setConfirmAction(null); setActionTime(null); }}
                                    className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={finalizeToggleClock}
                                    className={`flex-1 py-3 text-white font-bold rounded-xl shadow-md transition-transform active:scale-95 ${confirmAction === 'IN' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                        }`}
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* REJECTION REASON MODAL */}
            {rejectingLogId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                        <h3 className="text-lg font-bold text-red-700 mb-2 flex items-center gap-2">
                            <Ban className="w-5 h-5" /> Motivo da Recusa
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            É obrigatório informar o motivo pelo qual este ponto está sendo rejeitado.
                        </p>
                        <textarea
                            autoFocus
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none mb-4"
                            rows={3}
                            placeholder="Ex: Horário inconsistente com a sessão..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setRejectingLogId(null)} className="flex-1 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">
                                Cancelar
                            </button>
                            <button
                                onClick={confirmRejection}
                                disabled={!rejectionReason.trim()}
                                className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Confirmar Recusa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Entry Modal */}
            {showManualModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-600" />
                                Justificar Ponto Esquecido
                            </h3>
                            <button onClick={() => setShowManualModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-yellow-50 text-yellow-800 text-sm p-3 rounded-lg flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <p>Este registro será submetido à aprovação do administrador e ficará como <strong>Pendente</strong>.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                                <input
                                    type="date"
                                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                                    value={manualDate}
                                    onChange={(e) => setManualDate(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Entrada</label>
                                    <input
                                        type="time"
                                        className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                                        value={manualTimeIn}
                                        onChange={(e) => setManualTimeIn(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Saída</label>
                                    <input
                                        type="time"
                                        className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                                        value={manualTimeOut}
                                        onChange={(e) => setManualTimeOut(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Justificativa (Obrigatório)</label>
                                <textarea
                                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    rows={3}
                                    placeholder="Descreva o motivo do esquecimento ou problema..."
                                    value={justification}
                                    onChange={(e) => setJustification(e.target.value)}
                                />
                            </div>

                            {/* Mock Photo Upload */}
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors" onClick={() => setHasPhoto(!hasPhoto)}>
                                {hasPhoto ? (
                                    <div className="flex flex-col items-center text-green-600">
                                        <Check className="w-8 h-8 mb-2" />
                                        <span className="font-bold text-sm">Foto Anexada com Sucesso</span>
                                        <span className="text-xs text-gray-400">Clique para remover</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-gray-500">
                                        <Camera className="w-8 h-8 mb-2" />
                                        <span className="font-medium text-sm">Adicionar Foto/Comprovante (Opcional)</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => setShowManualModal(false)}
                                className="flex-1 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveManual}
                                disabled={!manualDate || !manualTimeIn || !justification}
                                className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" /> Enviar p/ Aprovação
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};