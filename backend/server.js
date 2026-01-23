const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

// PostgreSQL connection
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'domazul',
    user: process.env.DB_USER || 'domazul_user',
    password: process.env.DB_PASSWORD || 'DomAzul@2026',
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== AUTH ====================
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await pool.query(
            'SELECT * FROM users WHERE LOWER(email) = LOWER($1) AND password = $2',
            [email, password]
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];
            // Convert snake_case to camelCase
            res.json({
                success: true,
                user: {
                    id: user.id,
                    clinicId: user.clinic_id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatarUrl: user.avatar_url,
                    performanceScore: user.performance_score,
                    financial: user.financial
                }
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== USERS ====================
app.get('/api/users', async (req, res) => {
    try {
        const { clinicId } = req.query;
        let query = 'SELECT * FROM users';
        let params = [];

        if (clinicId) {
            query += ' WHERE clinic_id = $1';
            params.push(clinicId);
        }

        const result = await pool.query(query, params);
        const users = result.rows.map(u => ({
            id: u.id,
            clinicId: u.clinic_id,
            name: u.name,
            email: u.email,
            role: u.role,
            avatarUrl: u.avatar_url,
            performanceScore: u.performance_score,
            financial: u.financial
        }));
        res.json(users);
    } catch (err) {
        console.error('Get users error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        const { id, clinicId, name, email, password, role, avatarUrl, performanceScore, financial } = req.body;
        const result = await pool.query(
            `INSERT INTO users (id, clinic_id, name, email, password, role, avatar_url, performance_score, financial)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [id || `u-${Date.now()}`, clinicId, name, email, password, role || 'THERAPIST', avatarUrl, performanceScore || 100, JSON.stringify(financial)]
        );
        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        console.error('Create user error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

app.put('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Build dynamic update query
        const fields = [];
        const values = [];
        let paramIndex = 1;

        if (updates.name) { fields.push(`name = $${paramIndex++}`); values.push(updates.name); }
        if (updates.email) { fields.push(`email = $${paramIndex++}`); values.push(updates.email); }
        if (updates.password) { fields.push(`password = $${paramIndex++}`); values.push(updates.password); }
        if (updates.role) { fields.push(`role = $${paramIndex++}`); values.push(updates.role); }
        if (updates.financial) { fields.push(`financial = $${paramIndex++}`); values.push(JSON.stringify(updates.financial)); }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        const result = await pool.query(query, values);

        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        console.error('Update user error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Check if user is being used elsewhere first? (Optional)
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// ==================== CLINICS ====================
app.get('/api/clinics', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM clinics ORDER BY created_at DESC');
        const clinics = result.rows.map(c => ({
            id: c.id,
            name: c.name,
            corporateName: c.corporate_name,
            cnpj: c.cnpj,
            email: c.email,
            phone: c.phone,
            address: {
                street: c.address_street,
                number: c.address_number,
                district: c.address_district,
                city: c.address_city,
                state: c.address_state,
                zip: c.address_zip
            },
            plan: c.plan,
            active: c.active,
            status: c.status,
            maxUsers: c.max_users,
            subscription: {
                startDate: c.subscription_start_date,
                nextDueDate: c.subscription_next_due_date,
                dueDay: c.subscription_due_day,
                value: c.subscription_value,
                paymentMethod: c.subscription_payment_method,
                isAutoRenew: c.subscription_auto_renew
            },
            adminUserId: c.admin_user_id
        }));
        res.json(clinics);
    } catch (err) {
        console.error('Get clinics error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/clinics', async (req, res) => {
    try {
        const c = req.body;
        const result = await pool.query(
            `INSERT INTO clinics (id, name, corporate_name, cnpj, email, phone, 
             address_street, address_number, address_district, address_city, address_state, address_zip,
             plan, active, status, max_users, subscription_start_date, subscription_next_due_date,
             subscription_due_day, subscription_value, subscription_payment_method, subscription_auto_renew, admin_user_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
             RETURNING *`,
            [
                c.id || `c-${Date.now()}`, c.name, c.corporateName, c.cnpj, c.email, c.phone,
                c.address?.street, c.address?.number, c.address?.district, c.address?.city, c.address?.state, c.address?.zip,
                c.plan || 'PRO', c.active !== false, c.status || 'ACTIVE', c.maxUsers || 5,
                c.subscription?.startDate, c.subscription?.nextDueDate, c.subscription?.dueDay || 10,
                c.subscription?.value, c.subscription?.paymentMethod, c.subscription?.isAutoRenew !== false, c.adminUserId
            ]
        );
        res.json({ success: true, clinic: result.rows[0] });
    } catch (err) {
        console.error('Create clinic error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

app.put('/api/clinics/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const c = req.body;

        await pool.query(
            `UPDATE clinics SET name = $2, corporate_name = $3, cnpj = $4, email = $5, phone = $6,
             address_street = $7, address_number = $8, address_district = $9, address_city = $10, 
             address_state = $11, address_zip = $12, plan = $13, active = $14, status = $15,
             max_users = $16, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [id, c.name, c.corporateName, c.cnpj, c.email, c.phone,
                c.address?.street, c.address?.number, c.address?.district, c.address?.city, c.address?.state, c.address?.zip,
                c.plan, c.active, c.status, c.maxUsers]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Update clinic error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== PATIENTS ====================
app.get('/api/patients', async (req, res) => {
    try {
        const { clinicId } = req.query;
        let query = 'SELECT * FROM patients';
        let params = [];

        if (clinicId) {
            query += ' WHERE clinic_id = $1';
            params.push(clinicId);
        }
        query += ' ORDER BY name';

        const result = await pool.query(query, params);
        const patients = result.rows.map(p => ({
            id: p.id,
            clinicId: p.clinic_id,
            name: p.name,
            birthDate: p.birth_date,
            diagnosis: p.diagnosis,
            photoUrl: p.photo_url,
            status: p.status,
            parentName: p.parent_name,
            parentPhone: p.parent_phone,
            parentEmail: p.parent_email,
            address: p.address,
            notes: p.notes,
            schedule: p.schedule || [],
            programs: p.programs || []
        }));
        res.json(patients);
    } catch (err) {
        console.error('Get patients error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/patients', async (req, res) => {
    try {
        const p = req.body;
        const result = await pool.query(
            `INSERT INTO patients (id, clinic_id, name, birth_date, diagnosis, photo_url, status,
             parent_name, parent_phone, parent_email, address, notes, schedule, programs)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             RETURNING *`,
            [
                p.id || `p-${Date.now()}`, p.clinicId, p.name, p.birthDate, p.diagnosis, p.photoUrl, p.status || 'ACTIVE',
                p.parentName, p.parentPhone, p.parentEmail, p.address, p.notes,
                JSON.stringify(p.schedule || []), JSON.stringify(p.programs || [])
            ]
        );
        res.json({ success: true, patient: result.rows[0] });
    } catch (err) {
        console.error('Create patient error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

app.put('/api/patients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const p = req.body;

        await pool.query(
            `UPDATE patients SET name = $2, birth_date = $3, diagnosis = $4, photo_url = $5, status = $6,
             parent_name = $7, parent_phone = $8, parent_email = $9, address = $10, notes = $11,
             schedule = $12, programs = $13, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [id, p.name, p.birthDate, p.diagnosis, p.photoUrl, p.status,
                p.parentName, p.parentPhone, p.parentEmail, p.address, p.notes,
                JSON.stringify(p.schedule || []), JSON.stringify(p.programs || [])]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Update patient error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== SESSIONS ====================
app.get('/api/sessions', async (req, res) => {
    try {
        const { clinicId, patientId, therapistId } = req.query;
        let query = 'SELECT * FROM sessions WHERE 1=1';
        let params = [];
        let paramIndex = 1;

        if (clinicId) { query += ` AND clinic_id = $${paramIndex++}`; params.push(clinicId); }
        if (patientId) { query += ` AND patient_id = $${paramIndex++}`; params.push(patientId); }
        if (therapistId) { query += ` AND therapist_id = $${paramIndex++}`; params.push(therapistId); }

        query += ' ORDER BY start_time DESC';

        const result = await pool.query(query, params);
        const sessions = result.rows.map(s => ({
            id: s.id,
            clinicId: s.clinic_id,
            patientId: s.patient_id,
            therapistId: s.therapist_id,
            startTime: s.start_time,
            endTime: s.end_time,
            status: s.status,
            notes: s.notes,
            events: s.events || [],
            trials: s.trials || [],
            context: s.context
        }));
        res.json(sessions);
    } catch (err) {
        console.error('Get sessions error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/sessions', async (req, res) => {
    try {
        const s = req.body;
        const result = await pool.query(
            `INSERT INTO sessions (id, clinic_id, patient_id, therapist_id, start_time, end_time, status, notes, events, trials, context)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [
                s.id || `s-${Date.now()}`, s.clinicId, s.patientId, s.therapistId,
                s.startTime, s.endTime, s.status || 'SCHEDULED', s.notes,
                JSON.stringify(s.events || []), JSON.stringify(s.trials || []), JSON.stringify(s.context)
            ]
        );
        res.json({ success: true, session: result.rows[0] });
    } catch (err) {
        console.error('Create session error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// ==================== APPOINTMENTS ====================
app.get('/api/appointments', async (req, res) => {
    try {
        const { clinicId, date } = req.query;
        let query = 'SELECT * FROM appointments WHERE 1=1';
        let params = [];
        let paramIndex = 1;

        if (clinicId) { query += ` AND clinic_id = $${paramIndex++}`; params.push(clinicId); }
        if (date) { query += ` AND date = $${paramIndex++}`; params.push(date); }

        query += ' ORDER BY date, time';

        const result = await pool.query(query, params);
        const appointments = result.rows.map(a => ({
            id: a.id,
            clinicId: a.clinic_id,
            patientId: a.patient_id,
            therapistId: a.therapist_id,
            date: a.date,
            time: a.time,
            duration: a.duration,
            serviceName: a.service_name,
            room: a.room,
            status: a.status,
            notes: a.notes
        }));
        res.json(appointments);
    } catch (err) {
        console.error('Get appointments error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/appointments', async (req, res) => {
    try {
        const a = req.body;
        const result = await pool.query(
            `INSERT INTO appointments (id, clinic_id, patient_id, therapist_id, date, time, duration, service_name, room, status, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [
                a.id || `apt-${Date.now()}`, a.clinicId, a.patientId, a.therapistId,
                a.date, a.time, a.duration || 60, a.serviceName, a.room, a.status || 'SCHEDULED', a.notes
            ]
        );
        res.json({ success: true, appointment: result.rows[0] });
    } catch (err) {
        console.error('Create appointment error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

app.put('/api/appointments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const a = req.body;

        await pool.query(
            `UPDATE appointments SET patient_id = $2, therapist_id = $3, date = $4, time = $5, 
             duration = $6, service_name = $7, room = $8, status = $9, notes = $10, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [id, a.patientId, a.therapistId, a.date, a.time, a.duration, a.serviceName, a.room, a.status, a.notes]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Update appointment error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/appointments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM appointments WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Delete appointment error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== TIME LOGS (PONTO) ====================
app.get('/api/timelogs', async (req, res) => {
    try {
        const { userId } = req.query;
        let query = 'SELECT * FROM time_logs';
        let params = [];
        if (userId) {
            query += ' WHERE user_id = $1';
            params.push(userId);
        }
        query += ' ORDER BY clock_in DESC';
        const result = await pool.query(query, params);
        res.json(result.rows.map(l => ({
            id: l.id,
            userId: l.user_id,
            date: l.date,
            clockIn: Number(l.clock_in),
            clockOut: l.clock_out ? Number(l.clock_out) : null,
            type: l.type,
            status: l.status,
            justification: l.justification,
            rejectionReason: l.rejection_reason,
            relatedSessionStart: l.related_session_start ? Number(l.related_session_start) : null,
            photoUrl: l.photo_url
        })));
    } catch (err) {
        console.error('Get timelogs error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/timelogs', async (req, res) => {
    try {
        const l = req.body;
        const result = await pool.query(
            `INSERT INTO time_logs (id, user_id, date, clock_in, clock_out, type, status, justification, related_session_start, photo_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *`,
            [l.id, l.userId, l.date, l.clockIn, l.clockOut, l.type, l.status, l.justification, l.relatedSessionStart, l.photoUrl]
        );
        res.json({ success: true, log: result.rows[0] });
    } catch (err) {
        console.error('Create timelog error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

app.put('/api/timelogs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, clockOut, rejectionReason } = req.body;

        let query = 'UPDATE time_logs SET updated_at = CURRENT_TIMESTAMP';
        let params = [];
        let pIndex = 1;

        if (status) { query += `, status = $${pIndex++}`; params.push(status); }
        if (clockOut) { query += `, clock_out = $${pIndex++}`; params.push(clockOut); }
        if (rejectionReason) { query += `, rejection_reason = $${pIndex++}`; params.push(rejectionReason); }

        params.push(id);
        query += ` WHERE id = $${pIndex} RETURNING *`;

        const result = await pool.query(query, params);
        res.json({ success: true, log: result.rows[0] });
    } catch (err) {
        console.error('Update timelog error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== ACTIVITIES ====================
app.get('/api/activities', async (req, res) => {
    try {
        const { clinicId } = req.query;
        let query = 'SELECT * FROM activities WHERE clinic_id IS NULL';
        let params = [];

        if (clinicId) {
            query += ' OR clinic_id = $1';
            params.push(clinicId);
        }
        query += ' ORDER BY title';

        const result = await pool.query(query, params);
        const activities = result.rows.map(a => ({
            id: a.id,
            clinicId: a.clinic_id,
            title: a.title,
            description: a.description,
            instruction: a.instruction,
            domain: a.domain,
            target: a.target,
            status: a.status
        }));
        res.json(activities);
    } catch (err) {
        console.error('Get activities error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/activities', async (req, res) => {
    try {
        const a = req.body;
        const result = await pool.query(
            `INSERT INTO activities (id, clinic_id, title, description, instruction, domain, target, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [a.id || `act-${Date.now()}`, a.clinicId, a.title, a.description, a.instruction, a.domain, a.target, a.status || 'ACTIVE']
        );
        res.json({ success: true, activity: result.rows[0] });
    } catch (err) {
        console.error('Create activity error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// ==================== FINANCIAL ====================
app.get('/api/transactions', async (req, res) => {
    try {
        const { clinicId, type, startDate, endDate } = req.query;
        let query = 'SELECT * FROM financial_transactions WHERE 1=1';
        let params = [];
        let paramIndex = 1;

        if (clinicId) { query += ` AND clinic_id = $${paramIndex++}`; params.push(clinicId); }
        if (type) { query += ` AND type = $${paramIndex++}`; params.push(type); }
        if (startDate) { query += ` AND date >= $${paramIndex++}`; params.push(startDate); }
        if (endDate) { query += ` AND date <= $${paramIndex++}`; params.push(endDate); }

        query += ' ORDER BY date DESC';

        const result = await pool.query(query, params);
        const transactions = result.rows.map(t => ({
            id: t.id,
            clinicId: t.clinic_id,
            type: t.type,
            category: t.category,
            description: t.description,
            amount: parseFloat(t.amount),
            date: t.date,
            status: t.status,
            entityId: t.entity_id,
            entityName: t.entity_name,
            paymentMethod: t.payment_method
        }));
        res.json(transactions);
    } catch (err) {
        console.error('Get transactions error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/transactions', async (req, res) => {
    try {
        const t = req.body;
        const result = await pool.query(
            `INSERT INTO financial_transactions (id, clinic_id, type, category, description, amount, date, status, entity_id, entity_name, payment_method)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [
                t.id || `txn-${Date.now()}`, t.clinicId, t.type, t.category, t.description,
                t.amount, t.date, t.status || 'PENDING', t.entityId, t.entityName, t.paymentMethod
            ]
        );
        res.json({ success: true, transaction: result.rows[0] });
    } catch (err) {
        console.error('Create transaction error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

app.put('/api/transactions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const fields = [];
        const values = [];
        let pIndex = 1;

        if (updates.status) { fields.push(`status = $${pIndex++}`); values.push(updates.status); }
        if (updates.amount) { fields.push(`amount = $${pIndex++}`); values.push(updates.amount); }

        values.push(id);
        const query = `UPDATE financial_transactions SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${pIndex} RETURNING *`;
        const result = await pool.query(query, values);
        res.json({ success: true, transaction: result.rows[0] });
    } catch (err) {
        console.error('Update transaction error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/transactions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM financial_transactions WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Delete transaction error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== FINANCIAL SERVICES ====================
app.get('/api/financial-services', async (req, res) => {
    try {
        const { clinicId } = req.query;
        let query = 'SELECT * FROM financial_services';
        let params = [];
        if (clinicId) { query += ' WHERE clinic_id = $1'; params.push(clinicId); }
        const result = await pool.query(query, params);
        res.json(result.rows.map(s => ({
            id: s.id,
            clinicId: s.clinic_id,
            name: s.name,
            defaultPrice: parseFloat(s.default_price),
            category: s.category,
            description: s.description
        })));
    } catch (err) {
        console.error('Get financial services error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/financial-services', async (req, res) => {
    try {
        const s = req.body;
        const result = await pool.query(
            `INSERT INTO financial_services (id, clinic_id, name, default_price, category, description)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [s.id || `fs-${Date.now()}`, s.clinicId, s.name, s.defaultPrice, s.category, s.description]
        );
        res.json({ success: true, service: result.rows[0] });
    } catch (err) {
        console.error('Create financial service error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/financial-services/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, defaultPrice } = req.body;
        await pool.query(
            'UPDATE financial_services SET name = $2, default_price = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
            [id, name, defaultPrice]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Update financial service error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 DOM Azul API running on port ${PORT}`);
});
