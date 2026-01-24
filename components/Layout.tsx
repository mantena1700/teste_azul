import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Users, ClipboardList, MessageSquare, BarChart3,
  LogOut, BrainCircuit, Menu, Building2, ShieldCheck, User,
  Clock, Briefcase, BookOpen, DollarSign, Globe, UserPlus, X
} from 'lucide-react';
import { INITIAL_PLANS, ModuleType } from '../pages/SaaSAdmin';
import { MOCK_CLINICS } from '../constants';
import { LocalDatabase } from '../services/LocalDatabase';

export const Layout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };


  // --- PERMISSION SYSTEM LOGIC ---
  // Determines if the current user's clinic plan allows access to a module
  const hasAccess = (moduleKey: ModuleType): boolean => {
    if (!user) return false;

    // 1. Super Admin sees the SaaS Admin link, handled separately in nav items
    if (user.role === 'SAAS_ADMIN') return true;

    // 2. Find User's Clinic in LocalDatabase (Real Data Source)
    const clinics = LocalDatabase.getClinics();
    const userClinic = clinics.find(c => c.id === user.clinicId) || MOCK_CLINICS.find(c => c.id === user.clinicId);

    // Fallback for dev/test if no clinic assigned
    if (!userClinic) return true;

    // 3. Find Clinic's Plan in the SaaS Configuration
    // In a real app, fetch from API. Here we import INITIAL_PLANS from SaaSAdmin
    const clinicPlan = INITIAL_PLANS.find(p => p.id === userClinic.plan);

    // 4. If plan not found, default to restricted
    if (!clinicPlan) return false;

    // 5. Check if the plan includes the specific module
    return clinicPlan.modules.includes(moduleKey);
  };

  const navItems = [
    // --- SUPER ADMIN ---
    ...(user?.role === 'SAAS_ADMIN' ? [
      { to: '/saas-admin', icon: Globe, label: 'Admin SaaS' }
    ] : []),

    // --- CLINIC USERS (Therapist/Admin) ---
    ...(user?.role !== 'SAAS_ADMIN' ? [
      { to: '/', icon: LayoutDashboard, label: 'Visão Geral' }, // Always visible

      // Modules Check
      ...(hasAccess('SCHEDULE') ? [
        { to: '/session', icon: ClipboardList, label: 'Realizar Sessão' },
        { to: '/patients', icon: UserPlus, label: 'Gestão Pacientes' },
        { to: '/timeclock', icon: Clock, label: 'Ponto Eletrônico' },
      ] : []),

      ...(hasAccess('INVENTORY') ? [
        { to: '/activities', icon: BookOpen, label: 'Biblioteca & Estoque' },
      ] : []),

      // Always show profile demo for this app context, but in real app stick to perms
      { to: '/patient/p-001', icon: Users, label: 'Perfil (Demo)' },

      ...(hasAccess('REPORTS') ? [
        { to: '/reports', icon: BarChart3, label: 'Relatórios' },
      ] : []),

      ...(hasAccess('COMMUNICATION') ? [
        { to: '/communication', icon: MessageSquare, label: 'Diário' },
      ] : []),

      // Admin Specific Modules (Role Check + Module Check)
      ...(user?.role === 'ADMIN' && hasAccess('TEAM') ? [
        { to: '/team', icon: Briefcase, label: 'Gestão de Equipe' }
      ] : []),

      ...(user?.role === 'ADMIN' && hasAccess('FINANCIAL') ? [
        { to: '/financial', icon: DollarSign, label: 'Financeiro' }
      ] : [])
    ] : [])
  ];

  const NavContent = () => (
    <>
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shrink-0">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-gray-800 block leading-none">DOM Azul</span>
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Gestão ABA</span>
          </div>
        </div>
        {/* Close button for mobile */}
        <button className="lg:hidden text-gray-400" onClick={() => setIsMobileMenuOpen(false)}>
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* User Context Info */}
      <div className="px-4 py-4 space-y-3 bg-gray-50/50 border-b border-gray-100">
        {user?.role !== 'SAAS_ADMIN' ? (
          <div className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 overflow-hidden">
              <Building2 className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-bold text-gray-700 truncate">
                {MOCK_CLINICS.find(c => c.id === user?.clinicId)?.name || 'Minha Clínica'}
              </span>
            </div>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-sm font-bold shadow-sm">
            <Globe className="w-4 h-4 mr-2" /> Global Admin
          </div>
        )}

        <div className={`w-full flex items-center p-2 rounded-lg border text-xs font-bold uppercase tracking-wide gap-2 ${user?.role === 'ADMIN'
          ? 'bg-purple-50 border-purple-100 text-purple-700'
          : user?.role === 'SAAS_ADMIN'
            ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
            : 'bg-blue-50 border-blue-100 text-blue-700'
          }`}>
          {user?.role === 'ADMIN' ? <ShieldCheck className="w-3 h-3" /> :
            user?.role === 'SAAS_ADMIN' ? <Globe className="w-3 h-3" /> :
              <User className="w-3 h-3" />}
          <span>
            {user?.role === 'ADMIN' ? 'Gestor da Clínica' :
              user?.role === 'SAAS_ADMIN' ? 'Super Admin' : 'Terapeuta'}
          </span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${isActive
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <item.icon className={`w-5 h-5`} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
          <img src={user?.avatarUrl} alt="" className="w-9 h-9 rounded-full bg-gray-200 object-cover border border-gray-200" />
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2 w-full text-left text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair do Sistema
        </button>
        <div className="mt-4 pt-2 border-t border-gray-50 flex justify-center">
          <span className="text-[10px] text-gray-400 font-mono font-bold tracking-widest opacity-50">V 1.5 - PG</span>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col hidden lg:flex shadow-sm z-10">
        <NavContent />
      </aside>

      {/* Mobile/Tablet Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-72 bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-left duration-200">
            <NavContent />
          </div>
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between shrink-0 h-16 shadow-sm z-10">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-gray-800 text-lg">DOM Azul</span>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${user?.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
            user?.role === 'SAAS_ADMIN' ? 'bg-indigo-100 text-indigo-700' :
              'bg-blue-100 text-blue-700'
            }`}>
            {user?.role === 'ADMIN' ? 'AD' : user?.role === 'SAAS_ADMIN' ? 'SA' : 'TE'}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 safe-area-padding scroll-smooth">
          <Outlet />
        </div>
      </main>
    </div>
  );
};