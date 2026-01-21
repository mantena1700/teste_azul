import React, { createContext, useContext, useState, useEffect } from 'react';
import { Patient, User, Appointment, Session, Activity } from '../types';


// Initial Mock Appointments to populate the calendar
// TODO: Migrate Appointments to LocalDatabase
const INITIAL_APPOINTMENTS: Appointment[] = [
    { id: '1', date: new Date().toISOString().split('T')[0], time: '08:00', duration: 120, patientId: 'p-001', therapistId: 'u-1', serviceName: 'Sessão ABA', status: 'IN_SESSION', room: 'Sala 1 (Sensorial)' },
    { id: '2', date: new Date().toISOString().split('T')[0], time: '10:00', duration: 60, patientId: 'p-002', therapistId: 'u-4', serviceName: 'Fonoaudiologia', status: 'COMPLETED', room: 'Sala 4 (Fono)' },
    { id: '3', date: new Date().toISOString().split('T')[0], time: '14:00', duration: 120, patientId: 'p-001', therapistId: 'u-1', serviceName: 'Sessão ABA', status: 'SCHEDULED', room: 'Sala 1 (Sensorial)' },
    { id: '4', date: new Date().toISOString().split('T')[0], time: '15:00', duration: 60, patientId: 'p-004', therapistId: 'u-4', serviceName: 'T.O.', status: 'ARRIVED', room: 'Sala 5 (T.O.)' },
];

interface DataContextType {
    patients: Patient[];
    users: User[];
    appointments: Appointment[];
    activities: Activity[];
    sessions: Session[];

    // Actions
    addPatient: (patient: Patient) => void;
    updatePatient: (id: string, data: Partial<Patient>) => void;
    addAppointment: (appt: Appointment) => void;
    updateAppointment: (id: string, data: Partial<Appointment>) => void;
    deleteAppointment: (id: string) => void;
    addSession: (session: Session) => void;
    getPatientById: (id: string) => Patient | undefined;
    getUserById: (id: string) => User | undefined;
    addUser: (user: User) => void;
    updateUser: (id: string, data: Partial<User>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

import { LocalDatabase } from '../services/LocalDatabase';

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initialize Local DB on first load
    useEffect(() => {
        LocalDatabase.initialize();
        // Load initial data into state
        setPatients(LocalDatabase.getPatients());
        setUsers(LocalDatabase.getUsers());
        setActivities(LocalDatabase.getAllActivities());
        setSessions(LocalDatabase.getSessions());
        // Load appointments from DB
        setAppointments(LocalDatabase.getAppointments());
    }, []);

    const [patients, setPatients] = useState<Patient[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);

    // --- ACTIONS ---

    const addPatient = (patient: Patient) => {
        LocalDatabase.addPatient(patient);
        setPatients(LocalDatabase.getPatients()); // Re-fetch to sync
    };

    const updatePatient = (id: string, data: Partial<Patient>) => {
        LocalDatabase.updatePatient(id, data);
        setPatients(LocalDatabase.getPatients());
    };

    const addUser = (user: User) => {
        LocalDatabase.addUser(user);
        setUsers(LocalDatabase.getUsers());
        console.log("Users refreshed after add:", LocalDatabase.getUsers().length);
    };

    const updateUser = (id: string, data: Partial<User>) => {
        LocalDatabase.updateUser(id, data);
        setUsers(LocalDatabase.getUsers());
    };

    const addAppointment = (appt: Appointment) => {
        LocalDatabase.addAppointment(appt);
        setAppointments(LocalDatabase.getAppointments());
    };

    const updateAppointment = (id: string, data: Partial<Appointment>) => {
        LocalDatabase.updateAppointment(id, data);
        setAppointments(LocalDatabase.getAppointments());
    };

    const deleteAppointment = (id: string) => {
        LocalDatabase.deleteAppointment(id);
        setAppointments(LocalDatabase.getAppointments());
    };

    const addSession = (session: Session) => {
        LocalDatabase.saveSession(session);
        setSessions(LocalDatabase.getSessions());

        // Also update appointment status if exists
        const relatedAppt = appointments.find(a =>
            a.patientId === session.patientId &&
            new Date(a.date).toDateString() === new Date(session.startTime).toDateString()
        );
        if (relatedAppt) {
            updateAppointment(relatedAppt.id, { status: 'COMPLETED' });
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
            updateUser
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