#!/bin/bash
# Script de Deploy Automatizado - DOM Azul V 1.5 - PG

echo "🚀 Iniciando Deploy do DOM Azul (Versão PostgreSQL)..."
set -e # Para o script se houver erro

# 1. Baixar atualizações
echo "⬇️ Baixando atualizações do Git..."
git pull origin main

# 2. Reconstruir containers
echo "🏗️ Reconstruindo e subindo containers (isso pode levar alguns minutos)..."
# Usamos --force-recreate para garantir que as novas variáveis de ambiente e volumes sejam aplicados
docker-compose down --remove-orphans
docker-compose up -d --build --force-recreate

# 3. Aguardar o banco de dados e o backend iniciarem
echo "⏳ Aguardando serviços iniciarem..."
sleep 15

# 4. Aplicar Schema e Seeds
echo "📜 Aplicando Schema do Banco de Dados PostgreSQL..."
docker exec dom-azul-backend node apply_schema.js || {
    echo "⚠️ Erro ao aplicar schema pelo backend. Tentando via PSQL direto..."
    # Fallback caso o backend falhe na conexão inicial
    docker exec -i dom-azul-db psql -U domazul_user -d domazul < database/schema.sql
}

# 5. Limpeza
echo "🧹 Limpando imagens antigas e não utilizadas..."
docker image prune -f

echo "✅ Deploy Finalizado com Sucesso!"
echo "🌐 Acesse sua aplicação e verifique a tag 'V 1.5 - PG' no rodapé do menu."
echo "💪 Banco de Dados PostgreSQL Ativo e Sincronizado."
