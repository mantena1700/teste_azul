#!/bin/bash
echo "🚀 Iniciando Deploy do DOM Azul..."

echo "⬇️ Baixando atualizações..."
git pull origin main

echo "🛑 Parando containers..."
docker-compose stop

echo "🧹 Removendo container frontend antigo..."
docker-compose rm -f -s frontend

echo "🏗️ Reconstruindo frontend (force-recreate)..."
docker-compose up -d --force-recreate --build frontend

echo "🚀 Subindo backend e caddy..."
docker-compose up -d --no-deps backend caddy

echo "🧹 Limpando imagens antigas..."
docker image prune -f

echo "✅ Deploy Finalizado com Sucesso!"
