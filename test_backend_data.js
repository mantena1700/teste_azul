import http from 'http';

const API_BASE_URL = 'http://localhost:3001/api';

// Funcao auxiliar para fazer o request e ler o corpo da resposta
function fetchJson(endpoint) {
    return new Promise((resolve, reject) => {
        const req = http.get(`${API_BASE_URL}${endpoint}`, (res) => {
            let data = '';

            // A cada pedaço de dado recebido, junta na variavel
            res.on('data', (chunk) => {
                data += chunk;
            });

            // Quando terminar de receber, tenta ler como JSON
            res.on('end', () => {
                try {
                    console.log(`\n🔍 Testando: ${endpoint}`);
                    console.log(`   Status: ${res.statusCode}`);

                    if (res.statusCode === 200) {
                        const json = JSON.parse(data);
                        console.log('   ✅ Resposta (Dados vindos do PostgreSQL):');
                        // Mostra apenas os primeiros 2 itens para nao poluir o terminal ou o objeto inteiro se for pequeno
                        console.log(JSON.stringify(json, null, 2));
                    } else {
                        console.log('   ⚠️  Erro ou sem conteúdo body:', data);
                    }
                    resolve();
                } catch (e) {
                    console.log('   ❌ Erro ao ler JSON da resposta:', e.message);
                    console.log('   Conteúdo recebido:', data);
                    resolve();
                }
            });
        });

        req.on('error', (e) => {
            console.error(`   💀 Erro na conexão com ${endpoint}: ${e.message}`);
            resolve();
        });
    });
}

async function runTests() {
    console.log('=============================================');
    console.log('🧪 TESTE DE DADOS REAIS DO BACKEND (POSTGRES)');
    console.log('=============================================');

    // 1. Health Check (Verifica se o DB esta conectado)
    await fetchJson('/health');

    // 2. Usuarios (Verifica se o Seed criou o admin)
    await fetchJson('/users');

    // 3. Clinicas (Verifica tabelas vazias ou seeds)
    await fetchJson('/clinics');

    // 4. Pacientes
    await fetchJson('/patients');

    console.log('\n=============================================');
    console.log('🏁 Fim dos testes.');
}

runTests();
