#!/bin/bash

# ==============================================
# FAMACHAT - NETWORK SETUP SCRIPT
# ==============================================

set -e

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

print_status "Configurando redes Docker para FamaChat..."

# Function to create network if it doesn't exist
create_network_if_not_exists() {
    local network_name=$1
    local description=$2
    
    if docker network ls --format "table {{.Name}}" | grep -q "^${network_name}$"; then
        print_status "Rede '${network_name}' já existe"
        return 0
    fi
    
    print_warning "Criando rede '${network_name}' - ${description}"
    
    if docker network create "${network_name}" \
        --driver bridge \
        --attachable \
        --scope local; then
        print_status "Rede '${network_name}' criada com sucesso"
    else
        print_error "Falha ao criar rede '${network_name}'"
        return 1
    fi
}

# Create required networks
create_network_if_not_exists "traefik" "Rede para proxy Traefik"
create_network_if_not_exists "network_public" "Rede pública para comunicação externa"

# Verify network creation
print_status "Verificando redes criadas:"
echo ""
echo "Redes Docker ativas:"
docker network ls --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}"

echo ""
print_status "Detalhes das redes FamaChat:"

# Show Traefik network details
if docker network inspect traefik >/dev/null 2>&1; then
    echo "Rede Traefik:"
    docker network inspect traefik --format "  Subnet: {{range .IPAM.Config}}{{.Subnet}}{{end}}"
    docker network inspect traefik --format "  Gateway: {{range .IPAM.Config}}{{.Gateway}}{{end}}"
fi

# Show network_public details  
if docker network inspect network_public >/dev/null 2>&1; then
    echo "Rede network_public:"
    docker network inspect network_public --format "  Subnet: {{range .IPAM.Config}}{{.Subnet}}{{end}}"
    docker network inspect network_public --format "  Gateway: {{range .IPAM.Config}}{{.Gateway}}{{end}}"
fi

# Test network connectivity
print_status "Testando conectividade de rede..."

# Create temporary containers to test network connectivity
docker run --rm --network traefik alpine:latest ping -c 1 8.8.8.8 >/dev/null 2>&1 && \
    print_status "Conectividade externa OK na rede Traefik" || \
    print_warning "Problemas de conectividade na rede Traefik"

docker run --rm --network network_public alpine:latest ping -c 1 8.8.8.8 >/dev/null 2>&1 && \
    print_status "Conectividade externa OK na rede network_public" || \
    print_warning "Problemas de conectividade na rede network_public"

echo ""
print_status "Configuração de rede completa!"
print_status "As redes estão prontas para o deploy do FamaChat"

echo ""
echo "Próximos passos:"
echo "1. Execute: ./deploy.sh www.famachat.com.br"
echo "2. Verifique os logs: docker-compose -f docker-compose.production.yml logs -f"