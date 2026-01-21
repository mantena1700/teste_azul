# DOM Azul - Plataforma de Gestão ABA

## 🚀 Deploy em VPS com Docker

### Pré-requisitos
- VPS com Ubuntu 20.04+ ou similar
- Docker e Docker Compose instalados
- Porta 80 liberada no firewall

### Instalação Rápida

1. **Clone ou copie os arquivos para a VPS:**
```bash
# Via Git (se tiver repositório)
git clone <seu-repositorio> /opt/dom-azul
cd /opt/dom-azul

# Ou via SCP (copiar do seu PC)
scp -r ./* usuario@seu-vps:/opt/dom-azul/
```

2. **Crie o arquivo .env (opcional - para API Gemini):**
```bash
cd /opt/dom-azul
echo "GEMINI_API_KEY=sua-chave-aqui" > .env
```

3. **Build e start:**
```bash
docker-compose up -d --build
```

4. **Verifique se está rodando:**
```bash
docker-compose ps
docker-compose logs -f
```

5. **Acesse no navegador:**
```
http://IP-DA-SUA-VPS
```

### Credenciais Iniciais

O sistema inicia **LIMPO** (sem dados mockados).

**Login Inicial:**
- Email: `admin@domazul.com`
- Senha: `DomAzul@2026`

Este é o Super Admin que pode criar clínicas e usuários.

### Comandos Úteis

```bash
# Ver logs
docker-compose logs -f

# Reiniciar
docker-compose restart

# Parar
docker-compose down

# Rebuild após atualizações
docker-compose up -d --build

# Ver status
docker-compose ps
```

### Configuração com HTTPS (Recomendado)

Para produção, use um proxy reverso com SSL. Exemplo com Traefik:

```yaml
# Adicione ao docker-compose.yml
networks:
  web:
    external: true

services:
  dom-azul:
    # ... configurações existentes ...
    networks:
      - web
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.dom-azul.rule=Host(`app.seudominio.com`)"
      - "traefik.http.routers.dom-azul.entrypoints=websecure"
      - "traefik.http.routers.dom-azul.tls.certresolver=letsencrypt"
```

### Estrutura de Arquivos

```
dom-azul/
├── Dockerfile          # Build da aplicação
├── docker-compose.yml  # Orquestração
├── nginx.conf          # Configuração do servidor web
├── .dockerignore       # Arquivos ignorados no build
├── .env                # Variáveis de ambiente (criar manualmente)
└── src/                # Código fonte
```

### Backup de Dados

⚠️ **IMPORTANTE**: Esta versão usa localStorage (dados no navegador).
Cada usuário/dispositivo tem seus próprios dados.

Para um sistema multi-usuário real, será necessário implementar um backend com banco de dados.

### Suporte

- Versão: 1.0.0 (SPA com localStorage)
- Próximas versões: Backend com PostgreSQL/MongoDB
