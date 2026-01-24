# Guia de Atualização da VPS - DOM Azul

Esta atualização migra o sistema para **PostgreSQL real** e remove os dados mockados no frontend, além de adicionar a tag de versão `V 1.5 - PG`.

## Passo a Passo para Atualizar

### 1. Acesse sua VPS via terminal (SSH)

### 2. Entre na pasta do projeto
```bash
cd dom
```

### 3. Dê permissão de execução ao script de deploy (se necessário)
```bash
chmod +x deploy.sh
```

### 4. Execute o deploy automatizado
Este comando vai baixar as atualizações, subir o banco de dados PostgreSQL no Docker e configurar tudo sozinho.
```bash
./deploy.sh
```

---

## O que fazer se algo der errado?

### Ver os logs do Backend
Se a aplicação não carregar, verifique se o backend conseguiu conectar no banco:
```bash
docker logs -f dom-azul-backend
```

### Ver os logs do Banco de Dados
```bash
docker logs -f dom-azul-db
```

### Resetar TUDO (Cuidado: Apaga os dados do banco)
Se o banco de dados corromper ou você quiser começar do zero absoluto:
```bash
docker-compose down -v
./deploy.sh
```

---

## Verificação de Sucesso
Após o script terminar, você deve ver:
1. `✅ Deploy Finalizado com Sucesso!` no terminal.
2. A tag `V 1.5 - PG` no rodapé da barra lateral esquerda ao abrir o site.
3. Os dados carregados agora vêm do banco de dados PostgreSQL.

**Credenciais padrão para teste:**
- **Email:** `ana@integrar.com`
- **Senha:** `123456`
- **Role:** Terapeuta (Clínica Integrar)

*Ou Super Admin:*
- **Email:** `admin@domazul.com`
- **Senha:** `DomAzul@2026`
