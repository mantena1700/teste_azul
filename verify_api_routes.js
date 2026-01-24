import http from 'http';

const API_BASE_URL = 'http://localhost:4000/api';

const ENDPOINTS_TO_CHECK = [
    { method: 'GET', path: '/health' },
    { method: 'GET', path: '/users' },
    { method: 'GET', path: '/clinics' },
    { method: 'GET', path: '/patients' },
    { method: 'GET', path: '/sessions' },
    { method: 'GET', path: '/appointments' },
    { method: 'GET', path: '/activities' },
    { method: 'GET', path: '/transactions' },
    { method: 'GET', path: '/financial-services' },
    { method: 'GET', path: '/timelogs' },
    { method: 'POST', path: '/auth/login' }
];

console.log('🚀 Iniciando verificação de rotas da API...\n');
console.log(`📡 Base URL: ${API_BASE_URL}`);
console.log('---------------------------------------------------');

async function checkRoute(endpoint) {
    const url = `${API_BASE_URL}${endpoint.path}`;

    return new Promise((resolve) => {
        const req = http.request(url, { method: endpoint.method }, (res) => {
            let statusIcon = '✅';
            if (res.statusCode === 404) statusIcon = '❌';
            if (res.statusCode >= 500) statusIcon = '🔥';

            let statusText = `Status: ${res.statusCode}`;
            if (res.statusCode === 404) statusText += ' (Não Encontrado - 404)';
            if (res.statusCode === 200) statusText += ' (OK)';
            if (res.statusCode === 500) statusText += ' (Erro Interno - 500)';

            console.log(`${statusIcon} ${endpoint.method.padEnd(4)} ${endpoint.path.padEnd(25)} -> ${statusText}`);
            resolve({ path: endpoint.path, status: res.statusCode });
        });

        req.on('error', (e) => {
            console.log(`💀 ${endpoint.method.padEnd(4)} ${endpoint.path.padEnd(25)} -> Falha na conexão: ${e.message}`);
            resolve({ path: endpoint.path, status: 0 });
        });

        // Timeout
        req.setTimeout(5000, () => {
            console.log(`⏱️ ${endpoint.method.padEnd(4)} ${endpoint.path.padEnd(25)} -> Timeout (backend demorou responder)`);
            req.destroy();
            resolve({ path: endpoint.path, status: 408 });
        });

        req.end();
    });
}

async function run() {
    const results = [];
    for (const endpoint of ENDPOINTS_TO_CHECK) {
        results.push(await checkRoute(endpoint));
    }

    console.log('---------------------------------------------------');
    const failures = results.filter(r => r.status === 404 || r.status === 0 || r.status >= 500);

    if (failures.length === 0) {
        console.log('🎉 Todas as rotas verificadas parecem estar ativas!');
    } else {
        console.log(`⚠️  ${failures.length} rotas apresentaram problemas.`);
    }
}

run();
