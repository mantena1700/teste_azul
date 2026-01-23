#!/bin/bash
echo "🚀 Iniciando Deploy do DOM Azul..."
set -e # Para o script se houver erro


echo "⬇️ Baixando atualizações..."
git pull origin main

echo "💥 Derrubando tudo (Reset total para evitar erros)..."
docker-compose down --remove-orphans

echo "🧹 Garantindo limpeza de redes..."
docker network prune -f

echo "🏗️ Reconstruindo e subindo tudo do zero..."
docker-compose up -d --build --force-recreate

echo "🧹 Limpando imagens antigas..."
docker image prune -f

echo "✅ Deploy Finalizado com Sucesso!"
