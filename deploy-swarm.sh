#!/bin/bash

# ==============================================
# FAMACHAT - DOCKER SWARM DEPLOYMENT
# ==============================================

set -e

echo "🚀 Iniciando deploy do FamaChat no Docker Swarm..."

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
    print_error "Uso: ./deploy-swarm.sh <seu-dominio.com>"
    print_error "Exemplo: ./deploy-swarm.sh famachat.minhaempresa.com"
    exit 1
fi

DOMAIN=$1
export DOMAIN=$DOMAIN

print_status "Configurando deploy Docker Swarm para: $DOMAIN"

# ==============================================
# SWARM INITIALIZATION
# ==============================================

print_status "Verificando Docker Swarm..."

if ! docker info | grep -q "Swarm: active"; then
    print_warning "Docker Swarm não está ativo. Inicializando..."
    docker swarm init
    print_status "Docker Swarm inicializado"
else
    print_status "Docker Swarm já está ativo"
fi

# ==============================================
# NETWORK SETUP
# ==============================================

print_status "Configurando redes..."

# Check if network_public exists
if ! docker network ls | grep -q "network_public"; then
    print_warning "Rede network_public não encontrada. Criando..."
    docker network create --driver overlay network_public
else
    print_status "Rede network_public encontrada"
fi

# ==============================================
# ENVIRONMENT SETUP
# ==============================================

print_status "Configurando variáveis de ambiente..."

if [ ! -f .env ]; then
    print_warning "Arquivo .env não encontrado. Criando..."
    cp .env.production .env
    sed -i "s/famachat.seudominio.com/$DOMAIN/g" .env
    
    print_warning "Configure suas chaves de API no arquivo .env"
    read -p "Pressione Enter após configurar..."
fi

source .env

# ==============================================
# BUILD AND PUSH IMAGE
# ==============================================

print_status "Construindo imagem Docker..."

# Build image
docker build -t famachat:latest .

# Tag for registry if using one
if [ ! -z "$REGISTRY" ]; then
    print_status "Fazendo push para registry..."
    docker tag famachat:latest $REGISTRY/famachat:latest
    docker push $REGISTRY/famachat:latest
fi

# ==============================================
# DEPLOY STACK
# ==============================================

print_status "Fazendo deploy do stack..."

# Remove existing stack if exists
if docker stack ls | grep -q "famachat"; then
    print_status "Removendo stack existente..."
    docker stack rm famachat
    
    # Wait for stack to be completely removed
    while docker stack ls | grep -q "famachat"; do
        print_status "Aguardando remoção completa..."
        sleep 5
    done
fi

# Deploy new stack
print_status "Fazendo deploy do novo stack..."
docker stack deploy -c docker-compose.swarm.yml famachat

# ==============================================
# WAIT FOR SERVICES
# ==============================================

print_status "Aguardando serviços ficarem prontos..."

# Wait for services to be running
timeout=300
while [ $timeout -gt 0 ]; do
    running_services=$(docker stack ps famachat --filter "desired-state=running" --format "{{.CurrentState}}" | grep -c "Running" || echo "0")
    total_services=$(docker stack ps famachat --format "{{.Name}}" | wc -l)
    
    if [ "$running_services" -eq "$total_services" ] && [ "$total_services" -gt 0 ]; then
        print_status "Todos os serviços estão rodando"
        break
    fi
    
    print_status "Aguardando serviços: $running_services/$total_services prontos"
    sleep 10
    timeout=$((timeout - 10))
done

if [ $timeout -le 0 ]; then
    print_error "Timeout aguardando serviços. Verificando status..."
    docker stack ps famachat
    exit 1
fi

# ==============================================
# HEALTH CHECKS
# ==============================================

print_status "Verificando saúde dos serviços..."

# Get application endpoint
APP_ENDPOINT="http://localhost:5000"
if command -v curl &> /dev/null; then
    timeout=120
    while [ $timeout -gt 0 ]; do
        if curl -f "$APP_ENDPOINT/api/system/health" >/dev/null 2>&1; then
            print_status "Aplicação respondendo corretamente"
            break
        fi
        print_status "Aguardando aplicação ficar pronta..."
        sleep 10
        timeout=$((timeout - 10))
    done
    
    if [ $timeout -le 0 ]; then
        print_warning "Aplicação não respondeu no tempo esperado"
        print_status "Verificando logs dos serviços..."
        docker service logs famachat_famachat --tail=20
    fi
fi

# ==============================================
# STATUS REPORT
# ==============================================

print_status "Status do deployment:"
echo ""
echo "📊 Serviços do Stack:"
docker stack services famachat

echo ""
echo "📝 Tarefas dos Serviços:"
docker stack ps famachat

echo ""
echo "🔗 URLs de Acesso:"
echo "   • Local: http://localhost:5000"
echo "   • Produção: https://$DOMAIN"

echo ""
echo "🛠️ Comandos úteis:"
echo "   • Ver logs: docker service logs famachat_famachat -f"
echo "   • Escalar serviço: docker service scale famachat_famachat=3"
echo "   • Atualizar serviço: docker service update famachat_famachat"
echo "   • Remover stack: docker stack rm famachat"
echo "   • Status dos nós: docker node ls"

echo ""
echo "🎉 Deploy concluído!"