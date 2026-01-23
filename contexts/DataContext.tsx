import React, { createContext, useContext, useState, useEffect } from 'react';
import { Patient, User, Appointment, Session, Activity } from '../types';
import * as ApiService from '../services/ApiService';
import { useAuth } from './AuthContext';

// Initial Mock Appointments to populate the calendar
// TODO: Migrate Appointments to backend properly if needed
const INITIAL_APPOINTMENTS: Appointment[] = [];

interface DataContextType {
    patients: Patient[];
    users: User[];
    appointments: Appointment[];
    activities: Activity[];
    sessions: Session[];

    // Actions
    addPatient: (patient: Patient) => Promise<void>;
    updatePatient: (id: string, data: Partial<Patient>) => Promise<void>;
    addAppointment: (appt: Appointment) => Promise<void>;
    updateAppointment: (id: string, data: Partial<Appointment>) => Promise<void>;
    deleteAppointment: (id: string) => Promise<void>;
    addSession: (session: Session) => Promise<void>;
    getPatientById: (id: string) => Patient | undefined;
    getUserById: (id: string) => User | undefined;
    addUser: (user: User) => Promise<void>;
    updateUser: (id: string, data: Partial<User>) => Promise<void>;

    // Refresh data manually if needed
    refreshData: () => Promise<void>;
    isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch all data from API
    const refreshData = async () => {
        setIsLoading(true);
        try {
            // Fetch in parallel for speed
            // Note: If user is logged in, we could pass filters. 
            // For now, fetching all data the user has access to.
            const [fetchedUsers, fetchedPatients, fetchedActivities, fetchedAppointments, fetchedSessions] = await Promise.all([
                ApiService.getUsers(),
                ApiService.getPatients(),
                ApiService.getActivities(),
                ApiService.getAppointments(),
                ApiService.getSessions()
            ]);

            setUsers(fetchedUsers || []);
            setPatients(fetchedPatients || []);
            setActivities(fetchedActivities || []);
            setAppointments(fetchedAppointments || []);
            setSessions(fetchedSessions || []);

            console.log('✅ Data synced with PostgreSQL DB');
        } catch (error) {
            console.error('❌ Failed to fetch data from API:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        refreshData();
    }, [user]); // Refresh when user changes/logs in

    // --- ACTIONS ---

    const addPatient = async (patient: Patient) => {
        try {
            await ApiService.createPatient(patient);
            await refreshData();
        } catch (error) {
            console.error('Error adding patient:', error);
            alert('Erro ao salvar paciente no banco de dados.');
        }
    };

    const updatePatient = async (id: string, data: Partial<Patient>) => {
        try {
            await ApiService.updatePatient(id, data);
            await refreshData();
        } catch (error) {
            console.error('Error updating patient:', error);
        }
    };

    const addUser = async (newUser: User) => {
        try {
            await ApiService.createUser(newUser);
            await refreshData();
        } catch (error) {
            console.error('Error adding user:', error);
            alert('Erro ao criar usuário no banco de dados.');
        }
    };

    const updateUser = async (id: string, data: Partial<User>) => {
        try {
            await ApiService.updateUser(id, data);
            await refreshData();
        } catch (error) {
            console.error('Error updating user:', error);
        }
    };

    const addAppointment = async (appt: Appointment) => {
        try {
            await ApiService.createAppointment(appt);
            await refreshData();
        } catch (error) {
            console.error('Error adding appointment:', error);
        }
    };

    const updateAppointment = async (id: string, data: Partial<Appointment>) => {
        try {
            await ApiService.updateAppointment(id, data);
            await refreshData();
        } catch (error) {
            console.error('Error updating appointment:', error);
        }
    };

    const deleteAppointment = async (id: string) => {
        try {
            await ApiService.deleteAppointment(id);
            await refreshData();
        } catch (error) {
            console.error('Error deleting appointment:', error);
        }
    };

    const addSession = async (session: Session) => {
        try {
            await ApiService.createSession(session);

            // Also update appointment status if exists
            const relatedAppt = appointments.find(a =>
                a.patientId === session.patientId &&
                new Date(a.date).toDateString() === new Date(session.startTime).toDateString()
            );
            if (relatedAppt) {
                await ApiService.updateAppointment(relatedAppt.id, { status: 'COMPLETED' });
            }

            await refreshData();
        } catch (error) {
            console.error('Error saving session:', error);
        }
    };

    const getPatientById = (id: string) => patients.find(p => p.id === id);
    const getUserById = (id: string) => users.find(u => u.id === id);

    return (
        <DataContext.Provider value={{
            patients,
            users,
            appointments,
            activities,
            sessions,
            addPatient,
            updatePatient,
            addAppointment,
            updateAppointment,
            deleteAppointment,
            addSession,
            getPatientById,
            getUserById,
            addUser,
            updateUser,
            refreshData,
            isLoading
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};