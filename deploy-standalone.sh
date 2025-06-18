#!/bin/bash

# ==============================================
# FAMACHAT - DOCKER COMPOSE STANDALONE DEPLOYMENT
# ==============================================

set -e

echo "🚀 Iniciando deploy do FamaChat (Docker Compose Standalone)..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if domain is provided
if [ -z "$1" ]; then
    print_error "Uso: ./deploy-standalone.sh <seu-dominio.com>"
    print_error "Exemplo: ./deploy-standalone.sh famachat.minhaempresa.com"
    exit 1
fi

DOMAIN=$1
export DOMAIN=$DOMAIN

print_status "Configurando deploy standalone para: $DOMAIN"

# ==============================================
# PRE-DEPLOYMENT CHECKS
# ==============================================

print_status "Verificando pré-requisitos..."

if ! command -v docker &> /dev/null; then
    print_error "Docker não está instalado"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose não está instalado"
    exit 1
fi

# Determine docker compose command
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

print_status "Usando comando: $DOCKER_COMPOSE"

# ==============================================
# ENVIRONMENT SETUP
# ==============================================

print_status "Configurando variáveis de ambiente..."

if [ ! -f .env ]; then
    print_warning "Arquivo .env não encontrado. Criando..."
    cp .env.production .env
    sed -i "s/famachat.seudominio.com/$DOMAIN/g" .env
    
    print_warning "Configure suas chaves de API no arquivo .env antes de continuar"
    print_warning "Principais variáveis a configurar:"
    print_warning "  - OPENAI_API_KEY"
    print_warning "  - EVOLUTION_API_KEY" 
    print_warning "  - GOOGLE_MAPS_API_KEY"
    
    read -p "Pressione Enter após configurar as chaves..."
fi

source .env

# ==============================================
# STOP EXISTING SERVICES
# ==============================================

print_status "Parando serviços existentes..."
$DOCKER_COMPOSE -f docker-compose.standalone.yml down 2>/dev/null || true

# ==============================================
# BUILD AND START
# ==============================================

print_status "Construindo e iniciando serviços..."

# Build without cache
print_status "Construindo aplicação..."
$DOCKER_COMPOSE -f docker-compose.standalone.yml build --no-cache

# Start services
print_status "Iniciando serviços..."
$DOCKER_COMPOSE -f docker-compose.standalone.yml up -d

# ==============================================
# HEALTH CHECKS
# ==============================================

print_status "Aguardando serviços ficarem prontos..."

# Wait for PostgreSQL
print_status "Verificando PostgreSQL..."
timeout=60
while ! $DOCKER_COMPOSE -f docker-compose.standalone.yml exec postgres pg_isready -U postgres >/dev/null 2>&1; do
    sleep 2
    timeout=$((timeout - 2))
    if [ $timeout -le 0 ]; then
        print_error "PostgreSQL não respondeu"
        $DOCKER_COMPOSE -f docker-compose.standalone.yml logs postgres
        exit 1
    fi
done

# Wait for Redis
print_status "Verificando Redis..."
timeout=30
while ! $DOCKER_COMPOSE -f docker-compose.standalone.yml exec redis redis-cli ping >/dev/null 2>&1; do
    sleep 2
    timeout=$((timeout - 2))
    if [ $timeout -le 0 ]; then
        print_error "Redis não respondeu"
        $DOCKER_COMPOSE -f docker-compose.standalone.yml logs redis
        exit 1
    fi
done

# Wait for Application
print_status "Verificando aplicação..."
timeout=120
while ! curl -f http://localhost:5000/api/system/health >/dev/null 2>&1; do
    sleep 5
    timeout=$((timeout - 5))
    if [ $timeout -le 0 ]; then
        print_error "Aplicação não respondeu"
        $DOCKER_COMPOSE -f docker-compose.standalone.yml logs famachat
        exit 1
    fi
done

# ==============================================
# DATABASE MIGRATIONS
# ==============================================

print_status "Executando migrações..."
$DOCKER_COMPOSE -f docker-compose.standalone.yml exec famachat npm run db:push

# ==============================================
# SUCCESS REPORT
# ==============================================

print_status "Verificando status final..."
$DOCKER_COMPOSE -f docker-compose.standalone.yml ps

echo ""
echo "🎉 Deploy concluído com sucesso!"
echo ""
echo "📋 Informações do deploy:"
echo "   • Domínio: $DOMAIN"
echo "   • Aplicação: http://localhost:5000"
echo "   • PostgreSQL: localhost:5432"
echo "   • Redis: localhost:6379"
echo ""
echo "🔧 Comandos úteis:"
echo "   • Ver logs: $DOCKER_COMPOSE -f docker-compose.standalone.yml logs -f"
echo "   • Parar: $DOCKER_COMPOSE -f docker-compose.standalone.yml down"
echo "   • Reiniciar: $DOCKER_COMPOSE -f docker-compose.standalone.yml restart"
echo ""
echo "🌐 Acesso:"
echo "   • Local: http://localhost:5000"
echo "   • Produção: https://$DOMAIN (configure DNS e proxy)"