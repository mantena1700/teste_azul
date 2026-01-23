// API Service - Replaces LocalDatabase for production PostgreSQL backend

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Helper for API calls
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers
        },
        ...options
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(error.message || 'API request failed');
    }

    return response.json();
}

// ==================== AUTH ====================
export async function login(email: string, password: string): Promise<{ success: boolean; user?: any; message?: string }> {
    return apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
}

// ==================== USERS ====================
export async function getUsers(clinicId?: string): Promise<any[]> {
    const query = clinicId ? `?clinicId=${clinicId}` : '';
    return apiCall(`/users${query}`);
}

export async function createUser(user: any): Promise<{ success: boolean; user: any }> {
    return apiCall('/users', {
        method: 'POST',
        body: JSON.stringify(user)
    });
}

export async function updateUser(id: string, updates: any): Promise<{ success: boolean }> {
    return apiCall(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
    });
}

export async function deleteUser(id: string): Promise<{ success: boolean }> {
    return apiCall(`/users/${id}`, {
        method: 'DELETE'
    });
}

// ==================== CLINICS ====================
export async function getClinics(): Promise<any[]> {
    return apiCall('/clinics');
}

export async function createClinic(clinic: any): Promise<{ success: boolean; clinic: any }> {
    return apiCall('/clinics', {
        method: 'POST',
        body: JSON.stringify(clinic)
    });
}

export async function updateClinic(id: string, updates: any): Promise<{ success: boolean }> {
    return apiCall(`/clinics/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
    });
}

// ==================== PATIENTS ====================
export async function getPatients(clinicId?: string): Promise<any[]> {
    const query = clinicId ? `?clinicId=${clinicId}` : '';
    return apiCall(`/patients${query}`);
}

export async function createPatient(patient: any): Promise<{ success: boolean; patient: any }> {
    return apiCall('/patients', {
        method: 'POST',
        body: JSON.stringify(patient)
    });
}

export async function updatePatient(id: string, updates: any): Promise<{ success: boolean }> {
    return apiCall(`/patients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
    });
}

// ==================== SESSIONS ====================
export async function getSessions(filters?: { clinicId?: string; patientId?: string; therapistId?: string }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.clinicId) params.append('clinicId', filters.clinicId);
    if (filters?.patientId) params.append('patientId', filters.patientId);
    if (filters?.therapistId) params.append('therapistId', filters.therapistId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiCall(`/sessions${query}`);
}

export async function createSession(session: any): Promise<{ success: boolean; session: any }> {
    return apiCall('/sessions', {
        method: 'POST',
        body: JSON.stringify(session)
    });
}

// ==================== APPOINTMENTS ====================
export async function getAppointments(filters?: { clinicId?: string; date?: string }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.clinicId) params.append('clinicId', filters.clinicId);
    if (filters?.date) params.append('date', filters.date);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiCall(`/appointments${query}`);
}

export async function createAppointment(appointment: any): Promise<{ success: boolean; appointment: any }> {
    return apiCall('/appointments', {
        method: 'POST',
        body: JSON.stringify(appointment)
    });
}

export async function updateAppointment(id: string, updates: any): Promise<{ success: boolean }> {
    return apiCall(`/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
    });
}

export async function deleteAppointment(id: string): Promise<{ success: boolean }> {
    return apiCall(`/appointments/${id}`, {
        method: 'DELETE'
    });
}

// ==================== ACTIVITIES ====================
export async function getActivities(clinicId?: string): Promise<any[]> {
    const query = clinicId ? `?clinicId=${clinicId}` : '';
    return apiCall(`/activities${query}`);
}

export async function createActivity(activity: any): Promise<{ success: boolean; activity: any }> {
    return apiCall('/activities', {
        method: 'POST',
        body: JSON.stringify(activity)
    });
}

// ==================== TRANSACTIONS ====================
export async function getTransactions(filters?: { clinicId?: string; type?: string; startDate?: string; endDate?: string }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.clinicId) params.append('clinicId', filters.clinicId);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiCall(`/transactions${query}`);
}

export async function createTransaction(transaction: any): Promise<{ success: boolean; transaction: any }> {
    return apiCall('/transactions', {
        method: 'POST',
        body: JSON.stringify(transaction)
    });
}

// ==================== HEALTH CHECK ====================
export async function healthCheck(): Promise<{ status: string; timestamp: string }> {
    return apiCall('/health');
}
