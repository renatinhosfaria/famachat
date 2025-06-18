#!/bin/bash

# Quick deployment script without Traefik
set -e

DOMAIN=${1:-www.famachat.com.br}

echo "🚀 Deploy rápido FamaChat - $DOMAIN"

# Create network if needed
docker network create traefik 2>/dev/null || true

# Exit swarm mode if active
docker swarm leave --force 2>/dev/null || true

# Stop existing services
docker-compose -f docker-compose.simple.yml down 2>/dev/null || true

# Start services
echo "Iniciando serviços..."
DOMAIN=$DOMAIN docker-compose -f docker-compose.simple.yml up -d

# Wait for services
echo "Aguardando serviços..."
sleep 30

# Check health
if curl -f http://localhost:5000/api/system/health >/dev/null 2>&1; then
    echo "✅ Aplicação rodando em:"
    echo "   - http://localhost:5000"
    echo "   - http://$DOMAIN (se DNS configurado)"
    echo ""
    echo "Para ver logs: docker-compose -f docker-compose.simple.yml logs -f"
else
    echo "❌ Erro na inicialização. Verificando logs..."
    docker-compose -f docker-compose.simple.yml logs famachat --tail=20
fi