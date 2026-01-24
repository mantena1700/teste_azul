const http = require('http');

const API_URL = 'http://localhost:3001/api';
const COLORS = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    bold: "\x1b[1m"
};

// Helper for making HTTP requests
function request(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = data ? JSON.parse(data) : {};
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runTest(name, fn) {
    process.stdout.write(`${COLORS.blue}TESTING ${name}...${COLORS.reset} `);
    try {
        await fn();
        console.log(`${COLORS.green}${COLORS.bold}PASS ✅${COLORS.reset}`);
        return true;
    } catch (e) {
        console.log(`${COLORS.red}${COLORS.bold}FAIL ❌${COLORS.reset}`);
        console.error(`  Reason: ${e.message}`);
        if (e.response) console.error(`  Response: ${JSON.stringify(e.response)}`);
        return false;
    }
}

async function checkSystem() {
    console.log(`${COLORS.bold}=== DOM AZUL SYSTEM DIAGNOSTICS ===${COLORS.reset}\n`);

    let stats = { passed: 0, failed: 0 };

    // 1. Health Check
    await runTest('API Health Check', async () => {
        const res = await request('GET', '/health');
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        if (res.data.status !== 'ok') throw new Error('Status not OK');
    }) ? stats.passed++ : stats.failed++;

    // 2. Users (Write & Read)
    let testUserId = `test-user-${Date.now()}`;
    await runTest('User Creation & Retrieval', async () => {
        // Create
        const createRes = await request('POST', '/users', {
            id: testUserId,
            name: 'Test System Bot',
            email: `bot-${Date.now()}@test.com`,
            password: '123',
            role: 'THERAPIST'
        });
        if (createRes.status !== 200) throw new Error('Failed to create user');

        // Read
        const listRes = await request('GET', '/users');
        const found = listRes.data.find(u => u.id === testUserId);
        if (!found) throw new Error('Created user not found in list (DB Persistence Failure)');
    }) ? stats.passed++ : stats.failed++;

    // 3. Patients (Write & Read)
    let testPatientId = `test-patient-${Date.now()}`;
    await runTest('Patient Creation & Retrieval', async () => {
        const createRes = await request('POST', '/patients', {
            id: testPatientId,
            name: 'Patient Test Bot',
            diagnosis: 'Test Diagnosis',
            status: 'ACTIVE'
        });
        if (createRes.status !== 200) throw new Error('Failed to create patient');

        const listRes = await request('GET', '/patients');
        const found = listRes.data.find(p => p.id === testPatientId);
        if (!found) throw new Error('Created patient not found in list');
    }) ? stats.passed++ : stats.failed++;

    // 4. Time Logs (POINT) - Critical Check
    await runTest('TimeLog (Ponto) Creation', async () => {
        const createRes = await request('POST', '/timelogs', {
            userId: testUserId,
            date: new Date().toISOString().split('T')[0],
            clockIn: Date.now(),
            type: 'REGULAR',
            status: 'APPROVED'
        });

        if (createRes.status !== 200) throw new Error(`Failed to create timelog. Status: ${createRes.status}. Msg: ${JSON.stringify(createRes.data)}`);

        // Verify
        const listRes = await request('GET', `/timelogs?userId=${testUserId}`);
        if (listRes.data.length === 0) throw new Error('Timelog saved but not returned in query');
    }) ? stats.passed++ : stats.failed++;

    // 5. Sessions - Critical Check
    await runTest('Session Creation & Saving', async () => {
        const createRes = await request('POST', '/sessions', {
            patientId: testPatientId,
            therapistId: testUserId,
            startTime: Date.now(),
            endTime: Date.now() + 3600000,
            status: 'COMPLETED',
            notes: 'System Test Session'
        });

        if (createRes.status !== 200) throw new Error(`Failed to save session. Status: ${createRes.status}. Msg: ${JSON.stringify(createRes.data)}`);

        // Verify
        const listRes = await request('GET', '/sessions');
        const found = listRes.data.find(s => s.notes === 'System Test Session' && s.patientId === testPatientId);
        if (!found) throw new Error('Session saved but not found in DB');
    }) ? stats.passed++ : stats.failed++;

    // 6. Financial
    await runTest('Financial Transaction', async () => {
        const createRes = await request('POST', '/transactions', {
            description: 'System Test Revenue',
            amount: 100.00,
            type: 'INCOME',
            date: new Date().toISOString().split('T')[0],
            category: 'TEST'
        });
        if (createRes.status !== 200) throw new Error('Failed to create transaction');
    }) ? stats.passed++ : stats.failed++;

    console.log('\n---------------------------------------------------');
    if (stats.failed === 0) {
        console.log(`${COLORS.green}${COLORS.bold}ALL SYSTEMS OPERATIONAL. FULL INTEGRITY CONFIRMED.${COLORS.reset}`);
    } else {
        console.log(`${COLORS.red}${COLORS.bold}SYSTEM DEGRADED. ${stats.failed} CHECKS FAILED.${COLORS.reset}`);
    }
}

// Start
// Wait for server to be ready ideally, but we assume it's running
setTimeout(checkSystem, 1000);
