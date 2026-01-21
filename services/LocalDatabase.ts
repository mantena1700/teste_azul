import { User, Patient, Activity, Clinic, TimeLog, Session, Message, Appointment, FinancialTransaction, FinancialService } from '../types';

// Constants for LocalStorage Keys
const STORAGE_KEYS = {
    USERS: 'dom_users',
    PATIENTS: 'dom_patients',
    ACTIVITIES: 'dom_activities',
    CLINICS: 'dom_clinics',
    TIME_LOGS: 'dom_time_logs',
    SESSIONS: 'dom_sessions',
    MESSAGES: 'dom_messages',
    APPOINTMENTS: 'dom_appointments',
    FINANCIAL_TRANSACTIONS: 'dom_financial_transactions',
    FINANCIAL_SERVICES: 'dom_financial_services'
};

// Default Super Admin (only user created on fresh install)
const DEFAULT_SUPER_ADMIN: User = {
    id: 'u-saas',
    clinicId: undefined,
    name: 'Admin DOM Azul',
    role: 'SAAS_ADMIN',
    email: 'admin@domazul.com',
    password: 'DomAzul@2026',
    avatarUrl: 'https://ui-avatars.com/api/?name=DOM+Azul&background=0D47A1&color=fff'
};

// Default ABA Activities Library (essential for therapy)
const DEFAULT_ACTIVITIES: Activity[] = [
    { id: 'act-01', title: 'Emparelhamento Visual - Cores', description: 'Emparelhar cartões de cores idênticas.', instruction: 'Diga: "Coloca igual"', domain: 'Habilidades Visuais', target: 'Emparelhar 5 cores', status: 'ACTIVE' },
    { id: 'act-02', title: 'Identificação Receptiva - Animais', description: 'Apontar para o animal solicitado.', instruction: 'Diga: "Mostre o [Animal]"', domain: 'Linguagem Receptiva', target: 'Identificar 10 animais', status: 'ACTIVE' },
    { id: 'act-03', title: 'Imitação Motora Grossa', description: 'Imitar ações como bater palmas.', instruction: 'Faça a ação e diga: "Faz igual"', domain: 'Imitação Motora', target: 'Imitar 5 ações', status: 'ACTIVE' },
    { id: 'act-04', title: 'Mando - Itens Preferidos', description: 'Solicitar itens usando PECS ou gestos.', instruction: 'Espere a iniciativa da criança', domain: 'Comunicação (Mando)', target: 'Solicitação 3x por sessão', status: 'ACTIVE' },
    { id: 'act-05', title: 'Tato - Objetos Comuns', description: 'Nomear objetos ao ver o item.', instruction: 'Pergunte: "O que é isso?"', domain: 'Linguagem Expressiva (Tato)', target: 'Nomear 10 itens', status: 'ACTIVE' },
];

export class LocalDatabase {

    // --- INITIALIZATION (PRODUCTION - NO MOCK DATA) ---
    static initialize() {
        // Only seed if completely empty (first access ever)
        if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
            console.log('🚀 First run: Initializing clean database with Super Admin');
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([DEFAULT_SUPER_ADMIN]));
        }
        // Initialize empty arrays for other entities if not present
        if (!localStorage.getItem(STORAGE_KEYS.PATIENTS)) {
            localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
            // Seed with essential ABA activities (these are professional, not "mock")
            localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(DEFAULT_ACTIVITIES));
        }
        if (!localStorage.getItem(STORAGE_KEYS.CLINICS)) {
            localStorage.setItem(STORAGE_KEYS.CLINICS, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.TIME_LOGS)) {
            localStorage.setItem(STORAGE_KEYS.TIME_LOGS, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.SESSIONS)) {
            localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) {
            localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) {
            localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify([]));
        }
    }

    // --- GENERIC GETTERS ---
    private static get<T>(key: string): T[] {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    }

    private static set<T>(key: string, data: T[]) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    // --- PUBLIC API ---

    // USERS
    static getUsers(): User[] { return this.get(STORAGE_KEYS.USERS); }
    static addUser(user: User) {
        const list = this.getUsers();
        list.push(user);
        this.set(STORAGE_KEYS.USERS, list);
    }
    static updateUser(id: string, updates: Partial<User>) {
        const list = this.getUsers();
        const index = list.findIndex(u => u.id === id);
        if (index !== -1) {
            list[index] = { ...list[index], ...updates };
            this.set(STORAGE_KEYS.USERS, list);
        }
    }

    // PATIENTS
    static getPatients(): Patient[] { return this.get(STORAGE_KEYS.PATIENTS); }
    static addPatient(patient: Patient) {
        const list = this.getPatients();
        list.push(patient);
        this.set(STORAGE_KEYS.PATIENTS, list);
    }
    static updatePatient(id: string, updates: Partial<Patient>) {
        const list = this.getPatients();
        const index = list.findIndex(p => p.id === id);
        if (index !== -1) {
            list[index] = { ...list[index], ...updates };
            this.set(STORAGE_KEYS.PATIENTS, list);
        }
    }

    // SESSIONS (Critical for ABA)
    static getSessions(): Session[] { return this.get(STORAGE_KEYS.SESSIONS); }
    static saveSession(session: Session) {
        const list = this.getSessions();
        // Check if exists to update, else push
        const index = list.findIndex(s => s.id === session.id);
        if (index !== -1) {
            list[index] = session;
        } else {
            list.push(session);
        }
        this.set(STORAGE_KEYS.SESSIONS, list);
    }

    // GENERIC HELPERS
    // ACTIVITIES
    static getAllActivities(): Activity[] { return this.get(STORAGE_KEYS.ACTIVITIES); }
    static addActivity(activity: Activity) {
        const list = this.getAllActivities();
        list.push(activity);
        this.set(STORAGE_KEYS.ACTIVITIES, list);
    }
    static updateActivity(id: string, updates: Partial<Activity>) {
        const list = this.getAllActivities();
        const index = list.findIndex(a => a.id === id);
        if (index !== -1) {
            list[index] = { ...list[index], ...updates };
            this.set(STORAGE_KEYS.ACTIVITIES, list);
        }
    }

    // FINANCIAL
    static getFinancialTransactions(): FinancialTransaction[] { return this.get(STORAGE_KEYS.FINANCIAL_TRANSACTIONS); }
    static addFinancialTransaction(trans: FinancialTransaction) {
        const list = this.getFinancialTransactions();
        list.push(trans);
        this.set(STORAGE_KEYS.FINANCIAL_TRANSACTIONS, list);
    }
    static updateFinancialTransaction(id: string, updates: Partial<FinancialTransaction>) {
        const list = this.getFinancialTransactions();
        const index = list.findIndex(t => t.id === id);
        if (index !== -1) {
            list[index] = { ...list[index], ...updates };
            this.set(STORAGE_KEYS.FINANCIAL_TRANSACTIONS, list);
        }
    }

    static getFinancialServices(): FinancialService[] { return this.get(STORAGE_KEYS.FINANCIAL_SERVICES); }
    static addFinancialService(srv: FinancialService) {
        const list = this.getFinancialServices();
        list.push(srv);
        this.set(STORAGE_KEYS.FINANCIAL_SERVICES, list);
    }
    static deleteFinancialService(id: string) {
        const list = this.getFinancialServices();
        const newList = list.filter(s => s.id !== id);
        this.set(STORAGE_KEYS.FINANCIAL_SERVICES, newList);
    }

    static getClinics(): Clinic[] { return this.get(STORAGE_KEYS.CLINICS); }
    static getTimeLogs(): TimeLog[] { return this.get(STORAGE_KEYS.TIME_LOGS); }
    static addTimeLog(log: TimeLog) {
        const list = this.getTimeLogs();
        list.push(log);
        this.set(STORAGE_KEYS.TIME_LOGS, list);
    }
    static updateTimeLog(id: string, updates: Partial<TimeLog>) {
        const list = this.getTimeLogs();
        const index = list.findIndex(l => l.id === id);
        if (index !== -1) {
            list[index] = { ...list[index], ...updates };
            this.set(STORAGE_KEYS.TIME_LOGS, list);
        }
    }


    // CLINICS
    static addClinic(clinic: Clinic) {
        const list = this.getClinics();
        list.push(clinic);
        this.set(STORAGE_KEYS.CLINICS, list);
    }
    static updateClinic(id: string, updates: Partial<Clinic>) {
        const list = this.getClinics();
        const index = list.findIndex(c => c.id === id);
        if (index !== -1) {
            list[index] = { ...list[index], ...updates };
            this.set(STORAGE_KEYS.CLINICS, list);
        }
    }
    static setClinics(clinics: Clinic[]) {
        this.set(STORAGE_KEYS.CLINICS, clinics);
    }

    // APPOINTMENTS
    static getAppointments(): Appointment[] { return this.get(STORAGE_KEYS.APPOINTMENTS); }
    static addAppointment(appt: Appointment) {
        const list = this.getAppointments();
        list.push(appt);
        this.set(STORAGE_KEYS.APPOINTMENTS, list);
    }
    static updateAppointment(id: string, updates: Partial<Appointment>) {
        const list = this.getAppointments();
        const index = list.findIndex(a => a.id === id);
        if (index !== -1) {
            list[index] = { ...list[index], ...updates };
            this.set(STORAGE_KEYS.APPOINTMENTS, list);
        }
    }
    static deleteAppointment(id: string) {
        const list = this.getAppointments();
        const newList = list.filter(a => a.id !== id);
        this.set(STORAGE_KEYS.APPOINTMENTS, newList);
    }

    // RESET (For debugging)
    static hardReset() {
        localStorage.clear();
        window.location.reload();
    }

    static factoryReset() {
        localStorage.clear();

        // Seed ONLY the Super Admin
        const superAdmin: User = {
            id: 'u-saas',
            clinicId: undefined,
            name: 'Admin DOM Azul',
            role: 'SAAS_ADMIN',
            email: 'admin@domazul.com',
            password: 'DomAzul@2026',
            avatarUrl: 'https://ui-avatars.com/api/?name=DOM+Azul&background=0D47A1&color=fff'
        };

        this.set(STORAGE_KEYS.USERS, [superAdmin]);
        this.set(STORAGE_KEYS.CLINICS, []); // Clean clinics
        this.set(STORAGE_KEYS.PATIENTS, []);
        this.set(STORAGE_KEYS.SESSIONS, []);

        window.location.reload();
    }
}
