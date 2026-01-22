-- DOM Azul Database Schema
-- PostgreSQL

-- 1. CLINICS (Clínicas)
CREATE TABLE IF NOT EXISTS clinics (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    corporate_name VARCHAR(255),
    cnpj VARCHAR(20) UNIQUE,
    email VARCHAR(255),
    phone VARCHAR(20),
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_district VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    address_zip VARCHAR(10),
    plan VARCHAR(20) DEFAULT 'PRO',
    active BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    max_users INTEGER DEFAULT 5,
    subscription_start_date DATE,
    subscription_next_due_date DATE,
    subscription_due_day INTEGER DEFAULT 10,
    subscription_value DECIMAL(10,2),
    subscription_payment_method VARCHAR(20),
    subscription_auto_renew BOOLEAN DEFAULT true,
    admin_user_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. USERS (Usuários)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    clinic_id VARCHAR(50) REFERENCES clinics(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'THERAPIST',
    avatar_url TEXT,
    performance_score INTEGER DEFAULT 100,
    -- Financial fields (JSON for flexibility)
    financial JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. PATIENTS (Pacientes)
CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(50) PRIMARY KEY,
    clinic_id VARCHAR(50) REFERENCES clinics(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    birth_date DATE,
    diagnosis TEXT,
    photo_url TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    parent_name VARCHAR(255),
    parent_phone VARCHAR(20),
    parent_email VARCHAR(255),
    address TEXT,
    notes TEXT,
    schedule JSONB DEFAULT '[]',
    programs JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. ACTIVITIES (Atividades/Programas ABA)
CREATE TABLE IF NOT EXISTS activities (
    id VARCHAR(50) PRIMARY KEY,
    clinic_id VARCHAR(50) REFERENCES clinics(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instruction TEXT,
    domain VARCHAR(100),
    target VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. SESSIONS (Sessões de Terapia)
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(50) PRIMARY KEY,
    clinic_id VARCHAR(50) REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE CASCADE,
    therapist_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'SCHEDULED',
    notes TEXT,
    -- Session data stored as JSON for flexibility
    events JSONB DEFAULT '[]',
    trials JSONB DEFAULT '[]',
    context JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. APPOINTMENTS (Agendamentos)
CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(50) PRIMARY KEY,
    clinic_id VARCHAR(50) REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE CASCADE,
    therapist_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    time VARCHAR(10) NOT NULL,
    duration INTEGER DEFAULT 60,
    service_name VARCHAR(255),
    room VARCHAR(100),
    status VARCHAR(20) DEFAULT 'SCHEDULED',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. FINANCIAL_TRANSACTIONS (Transações Financeiras)
CREATE TABLE IF NOT EXISTS financial_transactions (
    id VARCHAR(50) PRIMARY KEY,
    clinic_id VARCHAR(50) REFERENCES clinics(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- 'INCOME' or 'EXPENSE'
    category VARCHAR(100),
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    entity_id VARCHAR(50),
    entity_name VARCHAR(255),
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. MESSAGES (Mensagens)
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(50) PRIMARY KEY,
    clinic_id VARCHAR(50) REFERENCES clinics(id) ON DELETE CASCADE,
    sender_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    recipient_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'TEXT',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_clinic ON users(clinic_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_patients_clinic ON patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_sessions_clinic ON sessions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_sessions_patient ON sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_therapist ON sessions(therapist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic ON appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_transactions_clinic ON financial_transactions(clinic_id);

-- Insert default super admin (only if not exists)
INSERT INTO users (id, clinic_id, name, email, password, role, avatar_url)
VALUES (
    'u-saas',
    NULL,
    'Admin DOM Azul',
    'admin@domazul.com',
    'DomAzul@2026',
    'SAAS_ADMIN',
    'https://ui-avatars.com/api/?name=DOM+Azul&background=0D47A1&color=fff'
) ON CONFLICT (id) DO NOTHING;

-- Insert default ABA activities
INSERT INTO activities (id, clinic_id, title, description, instruction, domain, target, status) VALUES
('act-01', NULL, 'Emparelhamento Visual - Cores', 'Emparelhar cartões de cores idênticas.', 'Diga: "Coloca igual"', 'Habilidades Visuais', 'Emparelhar 5 cores', 'ACTIVE'),
('act-02', NULL, 'Identificação Receptiva - Animais', 'Apontar para o animal solicitado.', 'Diga: "Mostre o [Animal]"', 'Linguagem Receptiva', 'Identificar 10 animais', 'ACTIVE'),
('act-03', NULL, 'Imitação Motora Grossa', 'Imitar ações como bater palmas.', 'Faça a ação e diga: "Faz igual"', 'Imitação Motora', 'Imitar 5 ações', 'ACTIVE'),
('act-04', NULL, 'Mando - Itens Preferidos', 'Solicitar itens usando PECS ou gestos.', 'Espere a iniciativa da criança', 'Comunicação (Mando)', 'Solicitação 3x por sessão', 'ACTIVE'),
('act-05', NULL, 'Tato - Objetos Comuns', 'Nomear objetos ao ver o item.', 'Pergunte: "O que é isso?"', 'Linguagem Expressiva (Tato)', 'Nomear 10 itens', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;
