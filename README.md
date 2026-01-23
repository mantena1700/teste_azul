# DOM Azul - Plataforma de Gestão ABA

Bienvenido à documentação oficial do projeto DOM Azul.

## 📚 Documentação por Módulo

Para facilitar o desenvolvimento e manutenção, a documentação foi dividida por áreas:

- **[🤖 Backend / API](./backend/README.md)**: Estrutura do servidor, conexões com banco de dados e padrões de API.
- **[🎨 Frontend Pages](./pages/README.md)**: Documentação das telas principais, roteamento e lógica de negócio.
- **[🧩 Components](./components/README.md)**: Biblioteca de componentes reutilizáveis e UI.
- **[🔌 Services](./services/README.md)**: Integração com a API e helpers de comunicação.
- **[💾 Database](./database/README.md)**: Esquema do banco de dados (PostgreSQL) e scripts de migração.
- **[🔄 Contexts](./contexts/README.md)**: Gerenciamento de estado global (Auth, Data).

---

## 🚀 Deploy em VPS com Docker

### Pré-requisitos
- VPS com Ubuntu 20.04+
- Git, Docker e Docker Compose instalados

### Instalação Rápida

1. **Clone o repositório:**
```bash
git clone <seu-repositorio> /opt/dom-azul
cd /opt/dom-azul
```

2. **Inicie o sistema:**
```bash
chmod +x deploy.sh
./deploy.sh
```

Isso irá:
- Baixar as últimas atualizações.
- Construir os containers Docker (Frontend + Backend).
- Iniciar o banco de dados PostgreSQL.
- Aplicar as migrações de esquema automaticamente.

3. **Acesse no navegador:**
`http://IP-DA-SUA-VPS` ou `https://seu-dominio.com` (se configurado).

### Credenciais Iniciais

O sistema inicia com um usuário Super Admin padrão:
- **Email**: `admin@domazul.com`
- **Senha**: `DomAzul@2026`

---

## 🏗️ Estrutura do Projeto

```
dom-azul/
├── backend/            # Servidor Node.js/Express
├── components/         # Componentes UI reutilizáveis (React)
├── contexts/           # Estado Global (React Context)
├── database/           # Scripts SQL e Schema
├── pages/              # Telas da aplicação
├── services/           # Comunicação com API
├── deploy.sh           # Script de automação de deploy
├── docker-compose.yml  # Orquestração de containers
└── README.md           # Este arquivo
```

## 🛠️ Comandos Úteis

```bash
# Ver logs em tempo real
docker-compose logs -f

# Reiniciar serviços
docker-compose restart

# Parar tudo
docker-compose down
```
