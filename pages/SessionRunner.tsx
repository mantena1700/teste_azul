import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { BEHAVIOR_OPTIONS, PROMPT_HIERARCHY } from '../constants';
import { Activity, TrialResult, Trial, Session, SessionEvent, BehaviorType, TokenBoardState, Patient } from '../types';
import { Play, Pause, CheckCircle, XCircle, Save, Activity as ActivityIcon, ChevronLeft, ArrowRight, HeartPulse, Star, Gift, Settings2, Sparkles, HelpCircle, Layers, Timer, Zap, MessageSquare, ArrowRightCircle, ListChecks, CheckSquare, Hourglass, MessageSquarePlus, Clock, X, User } from 'lucide-react';
import { useData } from '../contexts/DataContext';

export const SessionRunner: React.FC = () => {
    // Session Phases: SETUP (Antecedents) -> PAIRING (Play) -> RUNNING (Data) -> REVIEW
    const [phase, setPhase] = useState<'SETUP' | 'PAIRING' | 'RUNNING' | 'REVIEW'>('SETUP');
    const { addSession, activities, patients } = useData();
    const { user } = useAuth(); // Import user context
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [selectedPatientId, setSelectedPatientId] = useState<string>(searchParams.get('patientId') || '');
    const [selectedPatient, setSelectedPatient] = useState<Patient | undefined>(undefined);

    const [isActive, setIsActive] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const [trials, setTrials] = useState<Trial[]>([]);
    const [sessionEvents, setSessionEvents] = useState<SessionEvent[]>([]);
    const [sessionNotes, setSessionNotes] = useState('');
    const [sessionSaved, setSessionSaved] = useState(false);

    // Initial Patient Load
    useEffect(() => {
        if (selectedPatientId && patients.length > 0) {
            const found = patients.find(p => p.id === selectedPatientId);
            if (found) setSelectedPatient(found);
        }
    }, [selectedPatientId, patients]);

    // Real Data State
    // Using activities from Context now

    // ABA+ Features
    const [antecedents, setAntecedents] = useState<string[]>([]);
    const [currentReinforcer, setCurrentReinforcer] = useState('');
    const [tokenBoard, setTokenBoard] = useState<TokenBoardState>({ tokens: 0, targetTokens: 5, reward: '' });
    const [showRewardAnimation, setShowRewardAnimation] = useState(false);
    const [isHelpMode, setIsHelpMode] = useState(false); // "Professor Mode"
    const [showTools, setShowTools] = useState(false); // Collapsible Tools (High-P, DRO)

    // High-P (Momentum) State
    const [highPSteps, setHighPSteps] = useState<boolean[]>([false, false, false]);

    // DRO Timer State
    const [droActive, setDroActive] = useState(false);
    const [droTime, setDroTime] = useState(300); // 5 minutes default
    const [droInitialTime, setDroInitialTime] = useState(300);
    const droIntervalRef = useRef<any>(null);

    // Mand Counter State (ABA+)
    const [mandCount, setMandCount] = useState(0);

    // Visual Timer State (ABA+)
    const [visualTimerActive, setVisualTimerActive] = useState(false);
    const [visualTimerDuration, setVisualTimerDuration] = useState(120); // 2 mins default
    const [visualTimerRemaining, setVisualTimerRemaining] = useState(120);
    const visualTimerRef = useRef<any>(null);

    // Duration Tracker State (ABA+) - For tantrums/behaviors
    const [isDurationActive, setIsDurationActive] = useState(false);
    const [durationTimer, setDurationTimer] = useState(0);
    const durationIntervalRef = useRef<any>(null);

    // Quick ABC State (ABA+)
    const [showABCModal, setShowABCModal] = useState(false);
    const [abcForm, setAbcForm] = useState({ antecedent: '', behavior: '', consequence: '' });

    // Task Analysis State (ABA+)
    // Mapping step index to its current result/score
    const [taskAnalysisScores, setTaskAnalysisScores] = useState<Record<number, TrialResult | null>>({});

    // Mobile specific state
    const [mobileView, setMobileView] = useState<'list' | 'runner'>('list');

    // Animation state
    const [lastLoggedEvent, setLastLoggedEvent] = useState<BehaviorType | null>(null);

    // Main Session Timer
    useEffect(() => {
        let interval: any;
        if (isActive) {
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive]);

    // DRO Timer Logic
    useEffect(() => {
        if (droActive && droTime > 0) {
            droIntervalRef.current = setInterval(() => {
                setDroTime(prev => prev - 1);
            }, 1000);
        } else if (droTime === 0 && droActive) {
            // Timer finished - Reinforce!
            clearInterval(droIntervalRef.current);
            setDroActive(false);
            alert("⏰ TIMER DRO FINALIZADO! \n\nA criança ficou sem comportamento inadequado. REFORCE AGORA!");
            // Reset
            setDroTime(droInitialTime);
        }
        return () => clearInterval(droIntervalRef.current);
    }, [droActive, droTime, droInitialTime]);

    // Visual Timer Logic
    useEffect(() => {
        if (visualTimerActive && visualTimerRemaining > 0) {
            visualTimerRef.current = setInterval(() => {
                setVisualTimerRemaining(prev => prev - 1);
            }, 1000);
        } else if (visualTimerRemaining === 0 && visualTimerActive) {
            clearInterval(visualTimerRef.current);
            setVisualTimerActive(false);
            // Audio cue could go here
        }
        return () => clearInterval(visualTimerRef.current);
    }, [visualTimerActive, visualTimerRemaining]);

    // Duration Tracker Logic
    useEffect(() => {
        if (isDurationActive) {
            durationIntervalRef.current = setInterval(() => {
                setDurationTimer(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(durationIntervalRef.current);
        }
        return () => clearInterval(durationIntervalRef.current);
    }, [isDurationActive]);

    const resetDro = () => {
        setDroTime(droInitialTime);
        setDroActive(true); // Restart immediately upon problem behavior
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // --- TOKEN BOARD LOGIC ---
    const addToken = () => {
        if (tokenBoard.tokens < tokenBoard.targetTokens) {
            const newCount = tokenBoard.tokens + 1;
            setTokenBoard(prev => ({ ...prev, tokens: newCount }));

            if (newCount === tokenBoard.targetTokens) {
                setShowRewardAnimation(true);
            }
        }
    };

    const resetTokens = () => {
        setTokenBoard(prev => ({ ...prev, tokens: 0 }));
        setShowRewardAnimation(false);
    };

    // --- HIGH-P LOGIC ---
    const handleHighP = (index: number) => {
        const newSteps = [...highPSteps];
        if (!newSteps[index]) {
            newSteps[index] = true;
            setHighPSteps(newSteps);
            handleLogEvent('COMPLIANCE');
        }
    };

    const resetHighP = () => {
        setHighPSteps([false, false, false]);
    };

    // --- TASK ANALYSIS LOGIC ---
    const handleTaskAnalysisStep = (stepIndex: number, result: TrialResult) => {
        setTaskAnalysisScores(prev => ({ ...prev, [stepIndex]: result }));

        // Save specific trial for this step
        if (selectedActivity) {
            const newTrial: Trial = {
                id: `ta-${Date.now()}-${stepIndex}`,
                activityId: selectedActivity.id,
                result: result,
                timestamp: Date.now(),
                stepIndex: stepIndex
            };
            setTrials(prev => [...prev, newTrial]);
        }
    };

    // --- DURATION TRACKER LOGIC ---
    const toggleDurationTracker = () => {
        if (isDurationActive) {
            // STOPPING
            setIsDurationActive(false);
            const newEvent: SessionEvent = {
                id: `evt-dur-${Date.now()}`,
                timestamp: Date.now(),
                type: 'DURATION_LOG',
                activityId: selectedActivity?.id,
                durationSeconds: durationTimer
            };
            setSessionEvents(prev => [...prev, newEvent]);
            setLastLoggedEvent('DURATION_LOG');
            // Reset timer after logging (or keep it if we want to view it, but standard is reset)
            setDurationTimer(0);

            if (droActive) resetDro(); // Any duration behavior resets DRO
        } else {
            // STARTING
            setDurationTimer(0);
            setIsDurationActive(true);
        }
    };

    // --- ABC LOGIC ---
    const handleSaveABC = () => {
        if (!abcForm.behavior) return;
        const newEvent: SessionEvent = {
            id: `evt-abc-${Date.now()}`,
            timestamp: Date.now(),
            type: 'ABC_RECORD',
            activityId: selectedActivity?.id,
            abcSpecifics: {
                antecedent: abcForm.antecedent,
                consequence: abcForm.consequence
            }
        };
        setSessionEvents(prev => [...prev, newEvent]);
        setLastLoggedEvent('ABC_RECORD');
        setShowABCModal(false);
        setAbcForm({ antecedent: '', behavior: '', consequence: '' });
        if (droActive) resetDro();
    };

    const handleStartSession = () => {
        if (!selectedPatient) {
            alert("Selecione um paciente para iniciar.");
            return;
        }
        if (!currentReinforcer) {
            alert("Por favor, defina um item reforçador para iniciar a sessão.");
            return;
        }
        setPhase('PAIRING');
        setIsActive(true);
    };

    const handleStartWork = () => {
        setPhase('RUNNING');
    };

    const handleActivitySelect = (act: Activity) => {
        setSelectedActivity(act);
        setSessionSaved(false);
        setMobileView('runner');
        resetHighP();
        setTaskAnalysisScores({}); // Reset TA scores
    };

    const handleTrial = (result: TrialResult) => {
        if (!selectedActivity) return;

        const newTrial: Trial = {
            id: Math.random().toString(36).substr(2, 9),
            activityId: selectedActivity.id,
            result,
            timestamp: Date.now()
        };

        setTrials(prev => [...prev, newTrial]);
    };

    const handleLogEvent = (type: BehaviorType) => {
        if (!isActive) setIsActive(true);

        // Special handler for Mand counting
        if (type === 'MAND') {
            setMandCount(prev => prev + 1);
        }

        const newEvent: SessionEvent = {
            id: `evt-${Date.now()}`,
            timestamp: Date.now(),
            type: type,
            activityId: selectedActivity?.id
        };

        setSessionEvents(prev => [...prev, newEvent]);
        setLastLoggedEvent(type);
        setTimeout(() => setLastLoggedEvent(null), 1000);

        if (['AGGRESSIVE', 'FRUSTRATED', 'ANXIOUS'].includes(type) && droActive) {
            resetDro();
        }
    };

    const startVisualTimer = (durationSeconds: number) => {
        setVisualTimerDuration(durationSeconds);
        setVisualTimerRemaining(durationSeconds);
        setVisualTimerActive(true);
    };

    const finishAndSave = async () => {
        if (!selectedPatient) return;
        setIsActive(false);

        const sessionData: Session = {
            id: 'sess-' + Date.now(),
            patientId: selectedPatient.id,
            therapistId: user?.id || 'u-1',
            startTime: Date.now() - (elapsedTime * 1000),
            endTime: Date.now(),
            trials: trials,
            events: sessionEvents,
            notes: sessionNotes,
            sentiment: 'NEUTRAL', // Should make this selectable in a future polished modal
            reinforcer: currentReinforcer,
            antecedentStrategies: antecedents,
            // @ts-ignore
            clinicId: user?.clinicId
        };

        addSession(sessionData); // Use Context to save and update appointments

        setSessionSaved(true);

        setTimeout(() => {
            setMobileView('list');
            setPhase('SETUP');
            setSessionSaved(false);
            setTrials([]);
            setSessionEvents([]);
            setElapsedTime(0);
            setSessionNotes('');
            setAntecedents([]);
            setCurrentReinforcer('');
            resetTokens();
            setMandCount(0);
            navigate('/dashboard'); // Go back to dashboard after finish
        }, 1500);
    };

    // --- SUB-COMPONENTS ---

    const TokenBoardView = ({ mobile = false }) => (
        <div className={`bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-md border border-indigo-400 text-white relative overflow-hidden ${mobile ? 'p-3 mb-4' : 'p-6'}`}>
            {showRewardAnimation && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center animate-in fade-in">
                    <Sparkles className="w-12 h-12 md:w-16 md:h-16 text-yellow-300 animate-spin mb-2" />
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Reforço!</h3>
                    <button
                        onClick={resetTokens}
                        className="bg-white text-indigo-600 px-4 py-1.5 rounded-full font-bold shadow-lg text-sm"
                    >
                        Entregar
                    </button>
                </div>
            )}

            <div className="flex justify-between items-center mb-2 md:mb-4 relative z-0">
                <h2 className={`font-bold uppercase tracking-widest text-indigo-100 ${mobile ? 'text-[10px]' : 'text-xs'}`}>Economia de Fichas</h2>
                <div className="bg-indigo-700/50 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <Gift className="w-3 h-3" /> {currentReinforcer || '?'}
                </div>
            </div>

            <div className="flex justify-between items-center gap-2 relative z-0">
                {Array.from({ length: tokenBoard.targetTokens }).map((_, i) => (
                    <button
                        key={i}
                        onClick={addToken}
                        disabled={i < tokenBoard.tokens}
                        className={`rounded-full flex items-center justify-center transition-all transform ${mobile ? 'w-8 h-8' : 'w-10 h-10 md:w-12 md:h-12'
                            } ${i < tokenBoard.tokens
                                ? 'bg-yellow-400 text-yellow-700 shadow-lg scale-110'
                                : 'bg-indigo-800/50 text-indigo-300 border-2 border-dashed border-indigo-400/50 hover:bg-indigo-700'
                            }`}
                    >
                        <Star className={`${mobile ? 'w-4 h-4' : 'w-6 h-6'} ${i < tokenBoard.tokens ? 'fill-current' : ''}`} />
                    </button>
                ))}
            </div>
        </div>
    );

    const FirstThenBoard = () => (
        <div className="flex items-center bg-blue-50 border border-blue-200 rounded-lg p-2 mb-4 shadow-inner">
            <div className="flex-1 flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-blue-400">Primeiro</span>
                <span className="text-sm font-bold text-blue-900 leading-tight text-center">{selectedActivity?.title || 'Atividade'}</span>
            </div>
            <ArrowRightCircle className="w-6 h-6 text-blue-300 mx-2" />
            <div className="flex-1 flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-green-500">Depois</span>
                <span className="text-sm font-bold text-green-800 leading-tight text-center">{currentReinforcer || 'Reforço'}</span>
            </div>
        </div>
    );

    // --- RENDER START ---

    if (sessionSaved) {
        return (
            <div className="max-w-7xl mx-auto flex items-center justify-center h-[calc(100vh-200px)]">
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-green-100 text-center animate-in fade-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Sessão Registrada!</h2>
                    <p className="text-gray-500 mt-2">Dados salvos com sucesso no prontuário.</p>
                </div>
            </div>
        );
    }

    // 1. SETUP PHASE
    if (phase === 'SETUP') {
        return (
            <div className="max-w-3xl mx-auto pb-20">
                <div className="flex justify-end mb-2">
                    <button
                        onClick={() => setIsHelpMode(!isHelpMode)}
                        className={`flex items-center gap-2 text-sm font-bold px-3 py-1 rounded-full transition-colors ${isHelpMode ? 'bg-yellow-100 text-yellow-800' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <HelpCircle className="w-4 h-4" /> {isHelpMode ? 'Modo Professor Ativo' : 'Ajuda / Legendas'}
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-indigo-600 p-6 text-white">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Settings2 className="w-6 h-6" /> Preparação da Sessão
                        </h2>
                        <p className="text-indigo-100 mt-1">Configuração de Paciente, Antecedentes e Motivação</p>
                    </div>
                    <div className="p-8 space-y-8">
                        {/* Patient Selection Dropdown */}
                        {!selectedPatientId ? (
                            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 mb-6">
                                <label className="block text-sm font-bold text-yellow-800 mb-2 uppercase tracking-wide">
                                    Selecione o Paciente
                                </label>
                                <select
                                    className="w-full text-lg p-3 rounded-xl border border-yellow-300 bg-white"
                                    value={selectedPatientId}
                                    onChange={(e) => {
                                        setSelectedPatientId(e.target.value);
                                    }}
                                >
                                    <option value="">-- Selecione --</option>
                                    {patients.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center text-green-700 font-bold">
                                        <User />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-green-600 uppercase">Paciente Selecionado</p>
                                        <p className="text-lg font-bold text-gray-900">{selectedPatient?.name}</p>
                                    </div>
                                </div>
                                <button onClick={() => { setSelectedPatientId(''); setSelectedPatient(undefined); }} className="text-sm font-bold text-gray-400 hover:text-red-500">Alterar</button>
                            </div>
                        )}

                        {/* Reinforcer Selection */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                                O que a criança quer ganhar hoje? (Reforçador)
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {['Tablet/Vídeo', 'Massinha', 'Bolhas', 'Carrinhos', 'Comestível', 'Pula-Pula', 'Música', 'Outro'].map(item => (
                                    <button
                                        key={item}
                                        onClick={() => setCurrentReinforcer(item)}
                                        className={`p-4 rounded-xl border-2 font-bold text-sm transition-all ${currentReinforcer === item
                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 scale-105'
                                            : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-indigo-200'
                                            }`}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Antecedent Strategies */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                                Estratégias de Antecedente (Prevenção)
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {['Ambiente Organizado', 'Redução de Ruído', 'Agenda Visual', 'Premack (Primeiro/Depois)', 'Escolha Forçada', 'High-P Request'].map(strat => (
                                    <button
                                        key={strat}
                                        onClick={() => {
                                            setAntecedents(prev =>
                                                prev.includes(strat) ? prev.filter(p => p !== strat) : [...prev, strat]
                                            );
                                        }}
                                        className={`px-4 py-2 rounded-full text-xs font-bold transition-colors border ${antecedents?.includes(strat)
                                            ? 'bg-green-100 border-green-200 text-green-700'
                                            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {antecedents?.includes(strat) && <CheckCircle className="w-3 h-3 inline mr-1" />}
                                        {strat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <button
                                onClick={handleStartSession}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                            >
                                <Play className="w-6 h-6" /> Iniciar Pareamento
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 2. PAIRING PHASE
    if (phase === 'PAIRING') {
        return (
            <div className="max-w-4xl mx-auto h-[80vh] flex flex-col items-center justify-center pb-20 relative">
                <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500 max-w-2xl">
                    <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mx-auto relative">
                        <div className="absolute inset-0 border-4 border-green-200 rounded-full animate-ping opacity-20"></div>
                        <HeartPulse className="w-16 h-16 text-green-600 animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-bold text-gray-900 mb-2">Fase de Pareamento</h2>
                        <p className="text-xl text-gray-500">Brinque livremente sem demandas.</p>
                    </div>
                    <div className="text-6xl font-mono font-bold text-gray-800 tabular-nums">
                        {formatTime(elapsedTime)}
                    </div>
                    <button
                        onClick={handleStartWork}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-full font-bold text-xl shadow-xl transition-all transform hover:scale-105"
                    >
                        Iniciar Demandas (Mesa/NET)
                    </button>
                </div>
            </div>
        );
    }

    // 3. RUNNING PHASE (Standard Runner + Token Board)
    const isMobileListVisible = mobileView === 'list';
    const isMobileRunnerVisible = mobileView === 'runner';

    return (
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 h-full pb-20 md:pb-0">

            {/* Left Panel: Token Board & Activities (Desktop) */}
            <div className={`md:w-1/3 flex flex-col gap-4 md:gap-6 ${isMobileListVisible ? 'block' : 'hidden md:flex'}`}>

                {/* DESKTOP TOKEN BOARD */}
                <div className="hidden md:block">
                    <TokenBoardView />
                </div>

                {/* Timer Card & Mand Counter */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 text-center shrink-0 flex flex-col">
                    <div className="text-4xl font-mono font-bold text-gray-900 mb-4">{formatTime(elapsedTime)}</div>
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => setIsActive(!isActive)}
                            className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-2 ${isActive ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                                }`}
                        >
                            {isActive ? <><Pause className="w-4 h-4" /> Pausar</> : <><Play className="w-4 h-4" /> Retomar</>}
                        </button>
                    </div>

                    {/* MAND COUNTER (Simplified) */}
                    <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-gray-500">Mands Totais</span>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-pink-600">{mandCount}</span>
                            <button
                                onClick={() => handleLogEvent('MAND')}
                                className="bg-pink-100 text-pink-700 p-2 rounded-lg hover:bg-pink-200 transition-colors"
                                title="Registrar Mando (Pedido)"
                            >
                                <MessageSquarePlus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Activity List */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[300px]">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-700">Programas (PEI)</h3>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{activities.length} Ativos</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {activities.map(act => (
                            <div
                                key={act.id}
                                onClick={() => handleActivitySelect(act)}
                                className={`p-3 rounded-xl cursor-pointer border transition-all active:scale-95 group ${selectedActivity?.id === act.id
                                    ? 'bg-blue-50 border-blue-500 shadow-sm ring-1 ring-blue-500'
                                    : 'bg-white border-gray-200 hover:border-blue-300'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-gray-800 text-sm leading-tight line-clamp-1">{act.title}</h4>
                                    {selectedActivity?.id === act.id && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                                </div>
                                <div className="mt-2 flex justify-between items-center">
                                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full uppercase tracking-wide truncate max-w-[120px]">{act.domain}</span>
                                    {act.isTaskAnalysis && <ListChecks className="w-3 h-3 text-purple-500" />}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel: Data Entry */}
            <div className={`md:w-2/3 flex flex-col gap-4 md:gap-6 ${isMobileRunnerVisible ? 'flex flex-1 h-full' : 'hidden md:flex'}`}>

                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between mb-2">
                    <button onClick={() => setMobileView('list')} className="flex items-center text-gray-600 font-medium">
                        <ChevronLeft className="w-5 h-5" /> Programas
                    </button>
                    <div className="font-mono font-bold text-sm bg-gray-100 px-2 py-1 rounded">
                        {formatTime(elapsedTime)}
                    </div>
                </div>

                {/* MOBILE TOKEN BOARD */}
                <div className="md:hidden">
                    <TokenBoardView mobile />
                </div>

                {/* Active Task Card */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-8 flex flex-col relative h-full overflow-y-auto">
                    {!selectedActivity ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-center min-h-[400px]">
                            <ActivityIcon className="w-16 h-16 opacity-20 mb-4" />
                            <h3 className="text-xl font-bold text-gray-300 mb-2">Modo de Execução</h3>
                            <p className="text-gray-400">Selecione um programa à esquerda para coletar dados.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">

                            {/* First/Then Board (ABA+ Feature) */}
                            <FirstThenBoard />

                            {/* Activity Header */}
                            <div className="mb-4">
                                <div className="flex justify-between items-start">
                                    <span className="text-[10px] md:text-sm font-bold text-blue-600 uppercase tracking-wide bg-blue-50 px-3 py-1 rounded-full">{selectedActivity.domain}</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setIsHelpMode(!isHelpMode)}
                                            className={`text-xs flex items-center gap-1 font-bold px-2 py-1 rounded transition-colors ${isHelpMode ? 'bg-yellow-100 text-yellow-800' : 'text-gray-400 hover:bg-gray-100'}`}
                                        >
                                            <HelpCircle className="w-3 h-3" /> Legendas
                                        </button>
                                        {/* Mini history */}
                                        <div className="flex gap-1">
                                            {trials.filter(t => t.activityId === selectedActivity.id).slice(-8).map((t, i) => (
                                                <div key={i} className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${t.result === TrialResult.INDEPENDENT ? 'bg-green-500' :
                                                    t.result === TrialResult.INCORRECT ? 'bg-red-500' : 'bg-orange-400'
                                                    }`} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <h2 className="text-xl md:text-3xl font-bold text-gray-900 mt-2 leading-tight">{selectedActivity.title}</h2>

                                {/* SD Display - ABA+ Feature */}
                                {selectedActivity.instruction && (
                                    <div className="flex items-start gap-2 mt-2 bg-indigo-50 p-2 rounded-lg border border-indigo-100 text-indigo-900">
                                        <MessageSquare className="w-4 h-4 mt-0.5 shrink-0" />
                                        <span className="text-sm font-medium"><strong>Instrução (SD):</strong> {selectedActivity.instruction}</span>
                                    </div>
                                )}

                                <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg text-yellow-900 text-xs md:text-sm shadow-sm">
                                    <span className="font-bold uppercase text-[10px] text-yellow-600 block mb-1">Critério de Ensino</span>
                                    {selectedActivity.target}
                                </div>
                            </div>

                            {/* ABA+ ADVANCED TOOLS TOGGLE */}
                            <div className="mb-4">
                                <button
                                    onClick={() => setShowTools(!showTools)}
                                    className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors"
                                >
                                    <Layers className="w-4 h-4" />
                                    {showTools ? 'Ocultar Ferramentas Avançadas' : 'Ferramentas ABA+ (High-P, DRO, Timer, ABC)'}
                                </button>

                                {showTools && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-3 animate-in fade-in slide-in-from-top-2">
                                        {/* High-P Tool */}
                                        <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
                                            <h5 className="text-xs font-bold text-purple-800 flex items-center gap-1 mb-2">
                                                <Zap className="w-3 h-3" /> Sequência High-P
                                            </h5>
                                            <div className="flex gap-1">
                                                {[0, 1, 2].map(idx => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleHighP(idx)}
                                                        className={`flex-1 min-w-0 text-xs font-bold py-1 px-0.5 rounded border transition-colors truncate ${highPSteps[idx]
                                                            ? 'bg-green-500 text-white border-green-600'
                                                            : 'bg-white border-purple-200 text-purple-700 hover:bg-purple-100'
                                                            }`}
                                                    >
                                                        {highPSteps[idx] ? <CheckCircle className="w-3 h-3 mx-auto" /> : `Fácil ${idx + 1}`}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* DRO Timer */}
                                        <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                                            <h5 className="text-xs font-bold text-orange-800 flex items-center gap-1 mb-2">
                                                <Timer className="w-3 h-3" /> Timer DRO
                                            </h5>
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono text-lg font-bold text-orange-900">{formatTime(droTime)}</span>
                                                <button
                                                    onClick={() => setDroActive(!droActive)}
                                                    className={`px-3 py-1 rounded text-xs font-bold text-white ${droActive ? 'bg-orange-400' : 'bg-green-500'}`}
                                                >
                                                    {droActive ? 'Pausar' : 'Iniciar'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Visual Time Timer (New ABA+) */}
                                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                                            <h5 className="text-xs font-bold text-blue-800 flex items-center gap-1 mb-2">
                                                <Hourglass className="w-3 h-3" /> Timer Visual
                                            </h5>
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 transition-all duration-1000"
                                                        style={{ width: `${(visualTimerRemaining / visualTimerDuration) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-mono text-blue-600">{formatTime(visualTimerRemaining)}</span>
                                                <button onClick={() => startVisualTimer(120)} className="text-[10px] bg-white border border-blue-200 px-1 rounded">2m</button>
                                            </div>
                                        </div>

                                        {/* Duration Tracker (New ABA+) */}
                                        <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
                                            <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1 mb-2">
                                                <Clock className="w-3 h-3" /> Duração (Crise)
                                            </h5>
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono text-lg font-bold text-slate-900">{formatTime(durationTimer)}</span>
                                                <button
                                                    onClick={toggleDurationTracker}
                                                    className={`px-3 py-1 rounded text-xs font-bold text-white ${isDurationActive ? 'bg-red-500' : 'bg-slate-500'}`}
                                                >
                                                    {isDurationActive ? 'Parar' : 'Iniciar'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* === TASK ANALYSIS RENDER (If Applicable) === */}
                            {selectedActivity.isTaskAnalysis && selectedActivity.steps ? (
                                <div className="mb-6 border border-gray-200 rounded-xl overflow-hidden">
                                    <div className="bg-gray-50 p-3 border-b border-gray-100 flex justify-between items-center">
                                        <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                                            <ListChecks className="w-4 h-4 text-purple-600" />
                                            Análise de Tarefas (Encadeamento)
                                        </h4>
                                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                                            {Object.keys(taskAnalysisScores).length} / {selectedActivity.steps.length}
                                        </span>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {selectedActivity.steps.map((step, idx) => (
                                            <div key={idx} className={`p-3 flex items-center justify-between ${taskAnalysisScores[idx] ? 'bg-green-50' : 'bg-white'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-gray-100 text-gray-500 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                                                        {idx + 1}
                                                    </div>
                                                    <span className={`text-sm ${taskAnalysisScores[idx] ? 'text-gray-400 line-through' : 'text-gray-800 font-medium'}`}>
                                                        {step}
                                                    </span>
                                                </div>
                                                {/* Simplified Scoring for Task Analysis Steps */}
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => handleTaskAnalysisStep(idx, TrialResult.INDEPENDENT)}
                                                        className={`p-1.5 rounded border text-xs font-bold w-8 ${taskAnalysisScores[idx] === TrialResult.INDEPENDENT ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 text-gray-400 hover:border-green-500'}`}
                                                    >
                                                        +
                                                    </button>
                                                    <button
                                                        onClick={() => handleTaskAnalysisStep(idx, TrialResult.VERBAL_PROMPT)}
                                                        className={`p-1.5 rounded border text-xs font-bold w-8 ${taskAnalysisScores[idx] === TrialResult.VERBAL_PROMPT ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 text-gray-400 hover:border-blue-500'}`}
                                                    >
                                                        D
                                                    </button>
                                                    <button
                                                        onClick={() => handleTaskAnalysisStep(idx, TrialResult.INCORRECT)}
                                                        className={`p-1.5 rounded border text-xs font-bold w-8 ${taskAnalysisScores[idx] === TrialResult.INCORRECT ? 'bg-red-500 text-white border-red-500' : 'border-gray-300 text-gray-400 hover:border-red-500'}`}
                                                    >
                                                        -
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                /* === STANDARD DISCRETE TRIAL RENDER === */
                                <div className="mb-6">
                                    <div className="flex justify-between items-end mb-2">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase">Registro de Tentativas (DTT/NET)</h4>
                                        <span className="text-xs text-gray-400 font-mono">Total: {trials.filter(t => t.activityId === selectedActivity.id).length}</span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {PROMPT_HIERARCHY.map((prompt) => (
                                            <button
                                                key={prompt.id}
                                                onClick={() => handleTrial(prompt.id)}
                                                title={prompt.definition}
                                                className={`relative p-3 md:p-4 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 active:scale-95 group hover:shadow-md ${prompt.id === TrialResult.INCORRECT
                                                    ? 'bg-red-50 border-red-200 hover:bg-red-100'
                                                    : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                                    }`}
                                            >
                                                <div className={`p-1.5 md:p-2 rounded-full ${prompt.color.replace('bg-', 'text-')} bg-opacity-20 mb-1`}>
                                                    <prompt.icon className={`w-5 h-5 md:w-6 md:h-6 ${prompt.color.replace('bg-', 'text-')}`} />
                                                </div>
                                                <span className="font-bold text-gray-700 text-xs md:text-sm">{prompt.label}</span>
                                                {isHelpMode && (
                                                    <span className="text-[9px] text-gray-500 text-center leading-tight mt-1 px-1 bg-gray-50 rounded w-full">
                                                        {prompt.definition}
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                        {/* Error Button */}
                                        <button
                                            onClick={() => handleTrial(TrialResult.INCORRECT)}
                                            className="relative p-3 md:p-4 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 transition-all flex flex-col items-center justify-center gap-1 active:scale-95 group hover:shadow-md"
                                        >
                                            <div className="p-1.5 md:p-2 rounded-full text-red-600 bg-red-100 mb-1">
                                                <XCircle className="w-5 h-5 md:w-6 md:h-6" />
                                            </div>
                                            <span className="font-bold text-red-800 text-xs md:text-sm">Erro</span>
                                            {isHelpMode && (
                                                <span className="text-[9px] text-red-400 text-center mt-1">
                                                    Não reforçar. Corrigir.
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* BEHAVIOR / EMOTION TRACKER */}
                            <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                                        <HeartPulse className="w-3 h-3" /> Comportamento & Biológico
                                    </span>
                                    <div className="flex gap-2 items-center">
                                        {lastLoggedEvent && (
                                            <span className="text-xs font-bold text-blue-600 animate-pulse">
                                                Registrado: {BEHAVIOR_OPTIONS.find(b => b.type === lastLoggedEvent)?.label}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => setShowABCModal(true)}
                                            className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-bold hover:bg-indigo-200"
                                        >
                                            + ABC Rápido
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2">
                                    {BEHAVIOR_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.type}
                                            onClick={() => handleLogEvent(opt.type)}
                                            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all active:scale-90 hover:bg-white hover:shadow-sm ${lastLoggedEvent === opt.type ? 'ring-2 ring-blue-400 bg-white shadow-md' : 'bg-transparent'
                                                }`}
                                            title={opt.label}
                                        >
                                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${opt.bg} ${opt.color} mb-1`}>
                                                <opt.icon className="w-5 h-5 md:w-6 md:h-6" />
                                            </div>
                                            <span className="text-[9px] md:text-[10px] font-bold text-gray-600 text-center leading-tight truncate w-full">{opt.label.split('/')[0]}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Notes & Actions Divider */}
                            <div className="border-t border-gray-100 pt-4 mt-auto">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Notas Clínicas</label>
                                <textarea
                                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                                    rows={1}
                                    placeholder="Observações sobre a resposta da criança..."
                                    value={sessionNotes}
                                    onChange={(e) => setSessionNotes(e.target.value)}
                                />
                                <div className="mt-4 flex justify-end gap-4">
                                    <button
                                        onClick={finishAndSave}
                                        className="w-full md:w-auto bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                    >
                                        <Save className="w-5 h-5" /> Finalizar Sessão
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* QUICK ABC MODAL */}
            {showABCModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-indigo-800 flex items-center gap-2">
                                <ActivityIcon className="w-5 h-5" /> Registro ABC Rápido
                            </h3>
                            <button onClick={() => setShowABCModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-indigo-600 block mb-1">A - Antecedente (Gatilho)</label>
                                <input
                                    autoFocus
                                    className="w-full border border-indigo-200 rounded p-2 text-sm bg-indigo-50/50"
                                    placeholder="Ex: Retirei o tablet"
                                    value={abcForm.antecedent}
                                    onChange={(e) => setAbcForm({ ...abcForm, antecedent: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-indigo-600 block mb-1">B - Comportamento (Ação)</label>
                                <input
                                    className="w-full border border-indigo-200 rounded p-2 text-sm bg-indigo-50/50"
                                    placeholder="Ex: Gritou e se jogou"
                                    value={abcForm.behavior}
                                    onChange={(e) => setAbcForm({ ...abcForm, behavior: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-indigo-600 block mb-1">C - Consequência (Resposta)</label>
                                <input
                                    className="w-full border border-indigo-200 rounded p-2 text-sm bg-indigo-50/50"
                                    placeholder="Ex: Ignorar planejado / Bloqueio"
                                    value={abcForm.consequence}
                                    onChange={(e) => setAbcForm({ ...abcForm, consequence: e.target.value })}
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleSaveABC}
                            className="w-full mt-4 bg-indigo-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-indigo-700"
                        >
                            Salvar Registro
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};