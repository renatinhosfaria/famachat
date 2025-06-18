#!/bin/bash

# ==============================================
# FAMACHAT - PRODUCTION DEPLOYMENT
# ==============================================

set -e

echo "🚀 Iniciando deploy de produção do FamaChat..."

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
    print_error "Uso: ./deploy-production.sh <seu-dominio.com>"
    print_error "Exemplo: ./deploy-production.sh famachat.minhaempresa.com"
    exit 1
fi

DOMAIN=$1
export DOMAIN=$DOMAIN

print_status "Configurando deploy de produção para: $DOMAIN"

# ==============================================
# ENVIRONMENT DETECTION
# ==============================================

print_status "Detectando ambiente Docker..."

# Determine docker compose command
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    print_error "Docker Compose não encontrado"
    exit 1
fi

# Check if running in Swarm mode
if docker info | grep -q "Swarm: active"; then
    print_status "Docker Swarm detectado - usando configuração Swarm"
    COMPOSE_FILE="docker-compose.swarm.yml"
    DEPLOY_MODE="swarm"
else
    print_status "Docker standalone detectado - usando configuração de produção"
    COMPOSE_FILE="docker-compose.production.yml"
    DEPLOY_MODE="standalone"
fi

# ==============================================
# NETWORK VERIFICATION
# ==============================================

print_status "Verificando rede network_public..."

if ! docker network ls | grep -q "network_public"; then
    print_warning "Rede network_public não encontrada. Criando..."
    
    if [ "$DEPLOY_MODE" = "swarm" ]; then
        docker network create --driver overlay --attachable network_public
    else
        docker network create --driver bridge network_public
    fi
    
    print_status "Rede network_public criada"
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
    
    print_warning "Configure suas chaves de API no arquivo .env:"
    print_warning "  - OPENAI_API_KEY"
    print_warning "  - EVOLUTION_API_KEY" 
    print_warning "  - GOOGLE_MAPS_API_KEY"
    
    read -p "Pressione Enter após configurar as chaves..."
fi

source .env

# ==============================================
# PRE-DEPLOYMENT CLEANUP
# ==============================================

print_status "Limpando deployment anterior..."

if [ "$DEPLOY_MODE" = "swarm" ]; then
    if docker stack ls | grep -q "famachat"; then
        print_status "Removendo stack existente..."
        docker stack rm famachat
        
        # Wait for complete removal
        while docker stack ls | grep -q "famachat"; do
            print_status "Aguardando remoção completa..."
            sleep 5
        done
    fi
else
    $DOCKER_COMPOSE -f $COMPOSE_FILE down 2>/dev/null || true
fi

# ==============================================
# BUILD PHASE
# ==============================================

print_status "Construindo aplicação..."

if [ "$DEPLOY_MODE" = "swarm" ]; then
    # Build image for swarm
    docker build -t famachat:latest .
    
    # Tag for registry if using one
    if [ ! -z "$REGISTRY" ]; then
        print_status "Fazendo push para registry..."
        docker tag famachat:latest $REGISTRY/famachat:latest
        docker push $REGISTRY/famachat:latest
    fi
else
    # Build with docker-compose
    $DOCKER_COMPOSE -f $COMPOSE_FILE build --no-cache
fi

# ==============================================
# DEPLOYMENT PHASE
# ==============================================

print_status "Iniciando deployment..."

if [ "$DEPLOY_MODE" = "swarm" ]; then
    print_status "Fazendo deploy do stack..."
    docker stack deploy -c $COMPOSE_FILE famachat
else
    print_status "Iniciando serviços..."
    $DOCKER_COMPOSE -f $COMPOSE_FILE up -d
fi

# ==============================================
# HEALTH MONITORING
# ==============================================

print_status "Monitorando inicialização dos serviços..."

if [ "$DEPLOY_MODE" = "swarm" ]; then
    # Monitor swarm services
    timeout=300
    while [ $timeout -gt 0 ]; do
        running_services=$(docker stack ps famachat --filter "desired-state=running" --format "{{.CurrentState}}" | grep -c "Running" || echo "0")
        total_services=$(docker stack ps famachat --format "{{.Name}}" | wc -l)
        
        if [ "$running_services" -eq "$total_services" ] && [ "$total_services" -gt 0 ]; then
            print_status "Todos os serviços Swarm estão rodando"
            break
        fi
        
        print_status "Aguardando serviços: $running_services/$total_services prontos"
        sleep 10
        timeout=$((timeout - 10))
    done
else
    # Monitor docker-compose services
    timeout=180
    
    # Wait for PostgreSQL
    print_status "Verificando PostgreSQL..."
    while ! $DOCKER_COMPOSE -f $COMPOSE_FILE exec postgres pg_isready -U postgres >/dev/null 2>&1; do
        sleep 5
        timeout=$((timeout - 5))
        if [ $timeout -le 0 ]; then break; fi
    done
    
    # Wait for Redis
    print_status "Verificando Redis..."
    while ! $DOCKER_COMPOSE -f $COMPOSE_FILE exec redis redis-cli ping >/dev/null 2>&1; do
        sleep 5
        timeout=$((timeout - 5))
        if [ $timeout -le 0 ]; then break; fi
    done
fi

# ==============================================
# APPLICATION HEALTH CHECK
# ==============================================

print_status "Verificando saúde da aplicação..."

APP_ENDPOINT="http://localhost:5000"
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
    
    if [ "$DEPLOY_MODE" = "swarm" ]; then
        print_status "Logs do serviço:"
        docker service logs famachat_famachat --tail=20
    else
        print_status "Logs da aplicação:"
        $DOCKER_COMPOSE -f $COMPOSE_FILE logs famachat --tail=20
    fi
fi

# ==============================================
# DATABASE MIGRATIONS
# ==============================================

print_status "Executando migrações do banco de dados..."

if [ "$DEPLOY_MODE" = "swarm" ]; then
    # Find a running famachat container
    CONTAINER_ID=$(docker ps --filter "label=com.docker.stack.namespace=famachat" --filter "label=com.docker.swarm.service.name=famachat_famachat" --format "{{.ID}}" | head -n1)
    if [ ! -z "$CONTAINER_ID" ]; then
        docker exec $CONTAINER_ID npm run db:push
    else
        print_warning "Não foi possível encontrar container para executar migrações"
    fi
else
    $DOCKER_COMPOSE -f $COMPOSE_FILE exec famachat npm run db:push
fi

# ==============================================
# FINAL STATUS REPORT
# ==============================================

print_status "Status final do deployment:"

if [ "$DEPLOY_MODE" = "swarm" ]; then
    echo ""
    echo "📊 Serviços do Stack:"
    docker stack services famachat
    
    echo ""
    echo "📝 Tarefas dos Serviços:"
    docker stack ps famachat
    
    echo ""
    echo "🛠️ Comandos úteis (Swarm):"
    echo "   • Ver logs: docker service logs famachat_famachat -f"
    echo "   • Escalar: docker service scale famachat_famachat=3"
    echo "   • Atualizar: docker service update famachat_famachat"
    echo "   • Remover: docker stack rm famachat"
    
else
    echo ""
    echo "📊 Status dos Serviços:"
    $DOCKER_COMPOSE -f $COMPOSE_FILE ps
    
    echo ""
    echo "🛠️ Comandos úteis (Compose):"
    echo "   • Ver logs: $DOCKER_COMPOSE -f $COMPOSE_FILE logs -f"
    echo "   • Reiniciar: $DOCKER_COMPOSE -f $COMPOSE_FILE restart"
    echo "   • Parar: $DOCKER_COMPOSE -f $COMPOSE_FILE down"
    echo "   • Backup: $DOCKER_COMPOSE -f $COMPOSE_FILE run --rm backup"
fi

echo ""
echo "🌐 URLs de Acesso:"
echo "   • Local: http://localhost:5000"
echo "   • Produção: https://$DOMAIN"
echo ""
echo "🔒 Configurações de Segurança:"
echo "   • SSL/TLS: Automático via Traefik"
echo "   • Rede: network_public (isolada)"
echo "   • Firewall: Configure para permitir portas 80, 443"
echo ""
echo "📋 Próximos Passos:"
echo "   1. Configure DNS: $DOMAIN -> IP do servidor"
echo "   2. Verifique certificado SSL em https://$DOMAIN"
echo "   3. Configure monitoramento e backups"
echo "   4. Teste todas as integrações (WhatsApp, OpenAI)"
echo ""
echo "🎉 Deploy de produção concluído com sucesso!"