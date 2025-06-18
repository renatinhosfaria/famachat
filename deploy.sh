#!/bin/bash

# ==============================================
# FAMACHAT - DEPLOYMENT SCRIPT
# ==============================================

set -e  # Exit on any error

echo "🚀 Iniciando deploy do FamaChat..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
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
    print_error "Uso: ./deploy.sh <seu-dominio.com>"
    print_error "Exemplo: ./deploy.sh famachat.minhaempresa.com"
    exit 1
fi

DOMAIN=$1
export DOMAIN=$DOMAIN

print_status "Configurando deploy para domínio: $DOMAIN"

# ==============================================
# PRE-DEPLOYMENT CHECKS
# ==============================================

print_status "Verificando pré-requisitos..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker não está instalado. Instale o Docker primeiro."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose não está instalado. Instale o Docker Compose primeiro."
    exit 1
fi

# Check if Traefik network exists
if ! docker network ls | grep -q "traefik"; then
    print_warning "Rede Traefik não encontrada. Criando rede..."
    docker network create traefik
    print_status "Rede Traefik criada ✅"
fi

# Check if running in Docker Swarm mode
if docker info --format '{{.Swarm.LocalNodeState}}' | grep -q "active"; then
    print_warning "Docker Swarm detectado. Desabilitando modo swarm para usar docker-compose..."
    docker swarm leave --force 2>/dev/null || true
    print_status "Modo swarm desabilitado ✅"
fi

print_status "Pré-requisitos verificados ✅"

# ==============================================
# ENVIRONMENT SETUP
# ==============================================

print_status "Configurando variáveis de ambiente..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    print_warning "Arquivo .env não encontrado. Criando a partir do template..."
    cp .env.production .env
    
    # Replace domain placeholder
    sed -i "s/famachat.seudominio.com/$DOMAIN/g" .env
    
    print_warning "⚠️  IMPORTANTE: Configure suas chaves de API no arquivo .env"
    print_warning "   - OPENAI_API_KEY: Sua chave da OpenAI"
    print_warning "   - EVOLUTION_API_KEY: Sua chave da Evolution API"
    print_warning "   - GOOGLE_MAPS_API_KEY: Sua chave do Google Maps"
    
    read -p "Pressione Enter após configurar as chaves de API no arquivo .env..."
fi

# Load environment variables
source .env

print_status "Variáveis de ambiente configuradas ✅"

# ==============================================
# DATABASE INITIALIZATION
# ==============================================

print_status "Preparando inicialização do banco de dados..."

# Create init scripts directory
mkdir -p init-scripts

# Create database initialization script
cat > init-scripts/01-init.sql << EOF
-- FamaChat Database Initialization
CREATE DATABASE IF NOT EXISTS famachat;
CREATE USER IF NOT EXISTS 'famachat'@'%' IDENTIFIED BY '$PGPASSWORD';
GRANT ALL PRIVILEGES ON famachat.* TO 'famachat'@'%';
FLUSH PRIVILEGES;
EOF

print_status "Scripts de inicialização criados ✅"

# ==============================================
# BACKUP SCRIPTS
# ==============================================

print_status "Configurando scripts de backup..."

mkdir -p scripts

cat > scripts/backup.sh << EOF
#!/bin/bash
# FamaChat Backup Script
BACKUP_DIR="/backup"
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="famachat_backup_\$DATE.sql"

echo "Iniciando backup do banco de dados..."
pg_dump -h postgres -U postgres -d famachat > "\$BACKUP_DIR/\$BACKUP_FILE"

if [ \$? -eq 0 ]; then
    echo "Backup realizado com sucesso: \$BACKUP_FILE"
    
    # Keep only last 7 backups
    cd \$BACKUP_DIR
    ls -t famachat_backup_*.sql | tail -n +8 | xargs rm -f
    echo "Backups antigos removidos (mantendo últimos 7)"
else
    echo "Erro no backup!"
    exit 1
fi
EOF

chmod +x scripts/backup.sh

print_status "Scripts de backup configurados ✅"

# ==============================================
# DOCKER BUILD & DEPLOY
# ==============================================

print_status "Construindo e iniciando serviços..."

# Stop existing services
print_status "Parando serviços existentes..."
docker-compose -f docker-compose.production.yml down 2>/dev/null || true

# Remove old images (optional)
read -p "Remover imagens antigas do Docker? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Removendo imagens antigas..."
    docker-compose -f docker-compose.production.yml down --rmi all --volumes --remove-orphans 2>/dev/null || true
fi

# Build and start services
print_status "Construindo aplicação..."
docker-compose -f docker-compose.production.yml build --no-cache

print_status "Iniciando serviços..."
docker-compose -f docker-compose.production.yml up -d

# ==============================================
# HEALTH CHECKS
# ==============================================

print_status "Aguardando serviços ficarem prontos..."

# Wait for PostgreSQL
print_status "Aguardando PostgreSQL..."
timeout=60
while ! docker-compose -f docker-compose.production.yml exec postgres pg_isready -U postgres >/dev/null 2>&1; do
    sleep 2
    timeout=$((timeout - 2))
    if [ $timeout -le 0 ]; then
        print_error "PostgreSQL não respondeu a tempo"
        exit 1
    fi
done

# Wait for Redis
print_status "Aguardando Redis..."
timeout=30
while ! docker-compose -f docker-compose.production.yml exec redis redis-cli ping >/dev/null 2>&1; do
    sleep 2
    timeout=$((timeout - 2))
    if [ $timeout -le 0 ]; then
        print_error "Redis não respondeu a tempo"
        exit 1
    fi
done

# Wait for Application
print_status "Aguardando aplicação..."
timeout=120
while ! curl -f http://localhost:5000/api/system/health >/dev/null 2>&1; do
    sleep 5
    timeout=$((timeout - 5))
    if [ $timeout -le 0 ]; then
        print_error "Aplicação não respondeu a tempo"
        print_error "Verificando logs..."
        docker-compose -f docker-compose.production.yml logs famachat --tail=20
        exit 1
    fi
done

# ==============================================
# DATABASE MIGRATIONS
# ==============================================

print_status "Executando migrações do banco de dados..."
docker-compose -f docker-compose.production.yml exec famachat npm run db:push

# ==============================================
# FINAL VERIFICATION
# ==============================================

print_status "Verificando status dos serviços..."

# Check service status
docker-compose -f docker-compose.production.yml ps

print_status "Verificando conectividade..."

# Test application endpoints
if curl -f http://localhost:5000/api/system/health >/dev/null 2>&1; then
    print_status "✅ Aplicação respondendo em http://localhost:5000"
else
    print_error "❌ Aplicação não está respondendo"
fi

# ==============================================
# SUCCESS MESSAGE
# ==============================================

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
echo "   • Ver logs: docker-compose -f docker-compose.production.yml logs -f"
echo "   • Parar serviços: docker-compose -f docker-compose.production.yml down"
echo "   • Reiniciar: docker-compose -f docker-compose.production.yml restart"
echo "   • Backup: docker-compose -f docker-compose.production.yml run --rm backup"
echo ""
echo "⚠️  Lembre-se de:"
echo "   • Configurar DNS do domínio $DOMAIN para este servidor"
echo "   • Verificar se Traefik está configurado com SSL"
echo "   • Configurar backups automáticos"
echo ""
echo "🌐 Acesso:"
echo "   • Local: http://localhost:5000"
echo "   • Produção: https://$DOMAIN (após configurar DNS)"
echo ""