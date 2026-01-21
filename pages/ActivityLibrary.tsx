import React, { useState, useEffect } from 'react';
import { MOCK_INVENTORY } from '../constants';
import { Activity, InventoryItem } from '../types';
import { Search, Plus, BookOpen, Tag, Filter, CheckCircle, Clock, Star, X, Box, User, Save } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { LocalDatabase } from '../services/LocalDatabase';

export const ActivityLibrary: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'programs' | 'inventory'>('programs');
    const { patients } = useData();

    // Activities State
    const [activities, setActivities] = useState<Activity[]>([]);

    // Load activities on mount
    useEffect(() => {
        refreshActivities();
    }, []);

    const refreshActivities = () => {
        setActivities(LocalDatabase.getAllActivities());
    };

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDomain, setSelectedDomain] = useState<string>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Inventory State
    const [inventory, setInventory] = useState<InventoryItem[]>(MOCK_INVENTORY);
    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);

    // New Activity Form State
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newDomain, setNewDomain] = useState('Habilidades Visuais');
    const [newTarget, setNewTarget] = useState('');

    // New Inventory Item Form State
    const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
        name: '',
        category: 'REINFORCER',
        quantity: 1,
        location: '',
        status: 'AVAILABLE',
        assignedToPatientId: ''
    });

    const domains = Array.from(new Set(activities.map(a => a.domain)));

    const filteredActivities = activities.filter(a => {
        const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDomain = selectedDomain === 'all' || a.domain === selectedDomain;
        return matchesSearch && matchesDomain;
    });

    const handleAddActivity = () => {
        if (!newTitle || !newDescription || !newTarget) return;

        const newActivity: Activity = {
            id: `act-new-${Date.now()}`,
            title: newTitle,
            description: newDescription,
            domain: newDomain,
            target: newTarget,
            status: 'ACTIVE'
        };

        LocalDatabase.addActivity(newActivity);
        refreshActivities();

        setIsModalOpen(false);

        // Reset Form
        setNewTitle('');
        setNewDescription('');
        setNewDomain('Habilidades Visuais');
        setNewTarget('');
    };

    const handleAddInventoryItem = () => {
        if (!newItem.name || !newItem.location) return;

        const item: InventoryItem = {
            id: `inv-${Date.now()}`,
            name: newItem.name!,
            category: newItem.category as any,
            quantity: Number(newItem.quantity),
            location: newItem.location!,
            status: newItem.status as any,
            assignedToPatientId: newItem.assignedToPatientId
        };

        setInventory([...inventory, item]);
        setIsInventoryModalOpen(false);
        setNewItem({ name: '', category: 'REINFORCER', quantity: 1, location: '', status: 'AVAILABLE', assignedToPatientId: '' });
        alert('Item adicionado ao estoque!');
    };

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Biblioteca & Recursos</h1>
                    <p className="text-gray-500 text-sm">Gerencie programas de ensino e materiais da clínica.</p>
                </div>

                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('programs')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'programs' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                    >
                        Programas
                    </button>
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'inventory' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                    >
                        Inventário
                    </button>
                </div>

                {activeTab === 'programs' ? (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm"
                    >
                        <Plus className="w-5 h-5" /> Nova Atividade
                    </button>
                ) : (
                    <button
                        onClick={() => setIsInventoryModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm"
                    >
                        <Plus className="w-5 h-5" /> Novo Item de Estoque
                    </button>
                )}
            </div>

            {/* PROGRAMS TAB */}
            {activeTab === 'programs' && (
                <div className="space-y-6 animate-in fade-in">
                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nome ou descrição..."
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="relative min-w-[200px]">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                                className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white appearance-none outline-none focus:ring-2 focus:ring-blue-500"
                                value={selectedDomain}
                                onChange={(e) => setSelectedDomain(e.target.value)}
                            >
                                <option value="all">Todos os Domínios</option>
                                {domains.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Activity Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredActivities.map(act => (
                            <div key={act.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-1 rounded-md flex items-center gap-1">
                                            <Tag className="w-3 h-3" /> {act.domain}
                                        </span>
                                        <div className={`p-1.5 rounded-full ${act.status === 'ACTIVE' ? 'bg-green-100 text-green-600' :
                                                act.status === 'MAINTENANCE' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                                            }`}>
                                            {act.status === 'ACTIVE' && <Clock className="w-4 h-4" />}
                                            {act.status === 'MAINTENANCE' && <CheckCircle className="w-4 h-4" />}
                                            {act.status === 'MASTERED' && <Star className="w-4 h-4" />}
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                                        {act.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 line-clamp-3 mb-4 h-[60px]">
                                        {act.description}
                                    </p>
                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                        <span className="text-xs text-blue-800 font-bold block mb-1">Critério / Alvo:</span>
                                        <p className="text-xs text-blue-700">{act.target}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredActivities.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400">
                                <BookOpen className="w-16 h-16 mb-4 opacity-20" />
                                <p>Nenhuma atividade encontrada com estes filtros.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* INVENTORY TAB */}
            {activeTab === 'inventory' && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="font-bold text-gray-800 flex items-center gap-2">
                            <Box className="w-5 h-5 text-indigo-600" /> Inventário de Materiais
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4">Item</th>
                                    <th className="px-6 py-4">Categoria</th>
                                    <th className="px-6 py-4">Localização</th>
                                    <th className="px-6 py-4">Vinculado a</th>
                                    <th className="px-6 py-4">Qtd</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {inventory.map(item => {
                                    const patient = patients.find(p => p.id === item.assignedToPatientId);
                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-bold text-gray-900">{item.name}</td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs bg-gray-100 px-2 py-1 rounded uppercase font-bold text-gray-600">{item.category}</span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{item.location}</td>
                                            <td className="px-6 py-4">
                                                {patient ? (
                                                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded flex items-center gap-1 w-fit">
                                                        <User className="w-3 h-3" /> {patient.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-mono">{item.quantity}</td>
                                            <td className="px-6 py-4">
                                                <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${item.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                                                        item.status === 'LOW_STOCK' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {item.status === 'AVAILABLE' ? 'Disponível' : item.status === 'LOW_STOCK' ? 'Baixo Estoque' : 'Indisponível'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add Activity Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-blue-600" />
                                Cadastrar Nova Atividade
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Título da Atividade</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ex: Emparelhar Cores"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Domínio / Categoria</label>
                                <input
                                    list="domain-options"
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Selecione ou digite um novo..."
                                    value={newDomain}
                                    onChange={(e) => setNewDomain(e.target.value)}
                                />
                                <datalist id="domain-options">
                                    {domains.map(d => <option key={d} value={d} />)}
                                </datalist>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição do Procedimento</label>
                                <textarea
                                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    rows={3}
                                    placeholder="Descreva como o aplicador deve executar a atividade..."
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Meta / Critério de Sucesso</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ex: 80% de acerto em 3 sessões consecutivas"
                                    value={newTarget}
                                    onChange={(e) => setNewTarget(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddActivity}
                                disabled={!newTitle || !newDescription || !newTarget}
                                className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Salvar Atividade
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Inventory Modal */}
            {isInventoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Box className="w-5 h-5 text-indigo-600" />
                                Novo Item de Estoque
                            </h3>
                            <button onClick={() => setIsInventoryModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Material/Reforçador</label>
                                <input
                                    className="w-full border p-2.5 rounded-lg border-gray-300"
                                    placeholder="Ex: Massinha Play-Doh"
                                    value={newItem.name}
                                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                                    <select
                                        className="w-full border p-2.5 rounded-lg border-gray-300 bg-white"
                                        value={newItem.category}
                                        onChange={(e) => setNewItem({ ...newItem, category: e.target.value as any })}
                                    >
                                        <option value="REINFORCER">Reforçador</option>
                                        <option value="MATERIAL">Material Pedagógico</option>
                                        <option value="SENSORY">Sensorial</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                                    <input
                                        type="number"
                                        className="w-full border p-2.5 rounded-lg border-gray-300"
                                        value={newItem.quantity}
                                        onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Localização Física</label>
                                <input
                                    className="w-full border p-2.5 rounded-lg border-gray-300"
                                    placeholder="Ex: Armário A, Prateleira 2"
                                    value={newItem.location}
                                    onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vincular a Paciente (Opcional)</label>
                                <select
                                    className="w-full border p-2.5 rounded-lg border-gray-300 bg-white"
                                    value={newItem.assignedToPatientId}
                                    onChange={(e) => setNewItem({ ...newItem, assignedToPatientId: e.target.value })}
                                >
                                    <option value="">Uso Geral (Não vinculado)</option>
                                    {patients.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Se selecionado, este item aparecerá como material individual deste paciente.</p>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                            <button onClick={() => setIsInventoryModalOpen(false)} className="flex-1 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-lg">Cancelar</button>
                            <button
                                onClick={handleAddInventoryItem}
                                disabled={!newItem.name || !newItem.location}
                                className="flex-1 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                <Save className="w-4 h-4 inline mr-2" /> Salvar Item
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};