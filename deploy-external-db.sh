#!/bin/bash

# ==============================================
# FAMACHAT DEPLOYMENT SCRIPT - EXTERNAL DATABASE
# ==============================================

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# ==============================================
# SCRIPT START
# ==============================================

DOMAIN=${1:-www.famachat.com.br}

print_header "🚀 Iniciando deploy do FamaChat com banco externo..."
print_status "Configurando deploy para domínio: $DOMAIN"

# ==============================================
# PRE-FLIGHT CHECKS
# ==============================================

print_status "Verificando pré-requisitos..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker não está instalado. Instale o Docker primeiro."
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null && ! docker-compose --version &> /dev/null; then
    print_error "Docker Compose não está instalado. Instale o Docker Compose primeiro."
    exit 1
fi

# Exit swarm mode if active
if docker info --format '{{.Swarm.LocalNodeState}}' | grep -q "active"; then
    print_warning "Docker Swarm detectado. Desabilitando modo swarm para usar docker-compose..."
    docker swarm leave --force 2>/dev/null || true
    print_status "Modo swarm desabilitado ✅"
fi

# Check PostgreSQL connection
print_status "Verificando conexão com PostgreSQL existente..."
if ! nc -z localhost 5432 2>/dev/null; then
    print_error "PostgreSQL não está acessível na porta 5432"
    exit 1
fi

print_status "Pré-requisitos verificados ✅"

# ==============================================
# ENVIRONMENT SETUP
# ==============================================

print_status "Configurando variáveis de ambiente..."

# Create .env.production if it doesn't exist
if [ ! -f .env.production ]; then
    cat > .env.production << EOF
# Application Settings
NODE_ENV=production
DOMAIN=$DOMAIN
PORT=5000
APP_URL=https://$DOMAIN

# Database (External PostgreSQL)
PGHOST=host.docker.internal
PGPORT=5432
PGDATABASE=famachat
PGUSER=postgres
PGPASSWORD=IwOLgVnyOfbN
DATABASE_URL=postgresql://postgres:IwOLgVnyOfbN@host.docker.internal:5432/famachat

# Redis
REDIS_URL=redis://redis:6379
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Security
SESSION_SECRET=EuCIxyXv8hgm64fhG2U8ytC3NoH59jsPxWaqwYFttMJI0mSNlSG1W73jbh2zu4+yUHLPecyaC5UMikeWz2B8qw==
JWT_SECRET=FamaChat2024SecretKeyForJWTTokenGeneration123456789
BCRYPT_ROUNDS=12

# External APIs
EVOLUTION_API_URL=https://evolution.famachat.com.br
EVOLUTION_API_KEY=IwOLgVnyOfbN
OPENAI_API_KEY=your_openai_api_key
GOOGLE_MAPS_API_KEY=AIzaSyAzqIdg1EKaI8cmb2W4iC6NfJs_D8vgEYY

# Facebook
FACEBOOK_APP_ID=1600246764019855
FACEBOOK_APP_SECRET=1600246764019855
FACEBOOK_PAGE_TOKEN=711015865662935

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
REQUEST_SIZE_LIMIT=50mb
URL_ENCODED_LIMIT=50mb
JSON_LIMIT=10mb
EOF
fi

print_status "Variáveis de ambiente configuradas ✅"

# ==============================================
# DATABASE SETUP
# ==============================================

print_status "Verificando banco de dados famachat..."

# Try to create database if it doesn't exist
docker exec -i $(docker ps --filter "ancestor=postgres" --format "{{.ID}}" | head -1) psql -U postgres -c "CREATE DATABASE famachat;" 2>/dev/null || true

print_status "Banco de dados verificado ✅"

# ==============================================
# DEPLOYMENT
# ==============================================

print_status "Construindo e iniciando serviços..."

# Stop existing services
print_status "Parando serviços existentes..."
docker-compose -f docker-compose.external-db.yml down 2>/dev/null || true

# Ask to remove old images
read -p "Remover imagens antigas do Docker? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Removendo imagens antigas..."
    docker system prune -f --volumes 2>/dev/null || true
    docker image prune -a -f 2>/dev/null || true
fi

# Build and start services
print_status "Construindo aplicação..."
DOMAIN=$DOMAIN docker-compose -f docker-compose.external-db.yml build --no-cache

print_status "Iniciando serviços..."
DOMAIN=$DOMAIN docker-compose -f docker-compose.external-db.yml up -d

# ==============================================
# HEALTH CHECK
# ==============================================

print_status "Aguardando inicialização dos serviços..."
sleep 30

# Check if services are running
print_status "Verificando status dos serviços..."

# Check Redis
if docker-compose -f docker-compose.external-db.yml ps redis | grep -q "Up"; then
    print_status "Redis: ✅ Funcionando"
else
    print_error "Redis: ❌ Não funcionando"
fi

# Check FamaChat app
if docker-compose -f docker-compose.external-db.yml ps famachat | grep -q "Up"; then
    print_status "FamaChat App: ✅ Funcionando"
else
    print_error "FamaChat App: ❌ Não funcionando"
    print_status "Exibindo logs da aplicação:"
    docker-compose -f docker-compose.external-db.yml logs famachat --tail=20
fi

# ==============================================
# FINAL CHECK
# ==============================================

print_status "Realizando teste de conectividade..."

# Wait a bit more for full startup
sleep 20

if curl -f http://localhost:5000/api/system/health >/dev/null 2>&1; then
    print_header "🎉 DEPLOY CONCLUÍDO COM SUCESSO!"
    echo ""
    print_status "✅ FamaChat está rodando em:"
    echo "   🌐 Local: http://localhost:5000"
    echo "   🌐 Externo: http://$DOMAIN"
    echo ""
    print_status "📊 Comandos úteis:"
    echo "   • Ver logs: docker-compose -f docker-compose.external-db.yml logs -f"
    echo "   • Parar: docker-compose -f docker-compose.external-db.yml down"
    echo "   • Status: docker-compose -f docker-compose.external-db.yml ps"
    echo ""
else
    print_error "❌ Aplicação não está respondendo corretamente"
    print_status "Verificando logs para diagnóstico:"
    docker-compose -f docker-compose.external-db.yml logs famachat --tail=30
    
    print_status "Status dos containers:"
    docker-compose -f docker-compose.external-db.yml ps
fi

print_status "Deploy finalizado!"