#!/bin/bash

# ==============================================
# FAMACHAT - INSTALAÇÃO AUTOMATIZADA VPS
# ==============================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de log
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCESSO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERRO]${NC} $1"
}

# Função para verificar se comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# ==============================================
# BANNER
# ==============================================
echo -e "${BLUE}"
echo "=========================================="
echo "      FAMACHAT - INSTALAÇÃO VPS"
echo "=========================================="
echo -e "${NC}"

# ==============================================
# VERIFICAÇÕES INICIAIS
# ==============================================
print_status "Verificando sistema operacional..."
if [[ ! -f /etc/os-release ]]; then
    print_error "Sistema operacional não suportado"
    exit 1
fi

source /etc/os-release
if [[ "$ID" != "ubuntu" && "$ID" != "debian" ]]; then
    print_warning "Sistema não testado. Recomendado: Ubuntu 20.04+ ou Debian 11+"
fi

print_status "Verificando privilégios..."
if [[ $EUID -eq 0 ]]; then
    print_warning "Executando como root. Recomendado executar como usuário regular com sudo"
fi

# ==============================================
# ATUALIZAÇÃO DO SISTEMA
# ==============================================
print_status "Atualizando sistema..."
sudo apt update -qq
sudo apt upgrade -y -qq

# ==============================================
# INSTALAÇÃO DE DEPENDÊNCIAS
# ==============================================
print_status "Instalando dependências básicas..."
sudo apt install -y -qq \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    jq

# ==============================================
# INSTALAÇÃO DO DOCKER
# ==============================================
if ! command_exists docker; then
    print_status "Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    print_success "Docker instalado com sucesso"
else
    print_success "Docker já está instalado"
fi

# ==============================================
# INSTALAÇÃO DO DOCKER COMPOSE
# ==============================================
if ! command_exists docker-compose; then
    print_status "Instalando Docker Compose..."
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | jq -r .tag_name)
    sudo curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose instalado com sucesso"
else
    print_success "Docker Compose já está instalado"
fi

# ==============================================
# CONFIGURAÇÃO DE DIRETÓRIO
# ==============================================
INSTALL_DIR="/opt/famachat"
print_status "Configurando diretório de instalação: $INSTALL_DIR"

if [[ -d "$INSTALL_DIR" ]]; then
    print_warning "Diretório já existe. Fazendo backup..."
    sudo mv "$INSTALL_DIR" "${INSTALL_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
fi

sudo mkdir -p "$INSTALL_DIR"
sudo chown -R $USER:$USER "$INSTALL_DIR"

# ==============================================
# CLONAGEM DO REPOSITÓRIO
# ==============================================
print_status "Solicitando URL do repositório Git..."
echo -n "Digite a URL do repositório Git do FamaChat: "
read REPO_URL

if [[ -z "$REPO_URL" ]]; then
    print_error "URL do repositório é obrigatória"
    exit 1
fi

print_status "Clonando repositório..."
git clone "$REPO_URL" "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Torna scripts executáveis
chmod +x *.sh

# ==============================================
# CONFIGURAÇÃO DE REDE DOCKER
# ==============================================
print_status "Configurando rede Docker..."

# Reinicia Docker se necessário
if ! docker network ls >/dev/null 2>&1; then
    print_status "Reiniciando serviço Docker..."
    sudo systemctl restart docker
    sleep 5
fi

# Cria rede network_public se não existe
if ! docker network ls | grep -q "network_public"; then
    print_status "Criando rede network_public..."
    docker network create --driver bridge network_public
    print_success "Rede network_public criada"
else
    print_success "Rede network_public já existe"
fi

# ==============================================
# CONFIGURAÇÃO DO AMBIENTE
# ==============================================
print_status "Configurando arquivo de ambiente..."

if [[ ! -f .env.production ]]; then
    print_error "Arquivo .env.production não encontrado no repositório"
    exit 1
fi

cp .env.production .env

print_status "Configure as seguintes variáveis no arquivo .env:"
echo ""
echo "Variáveis OBRIGATÓRIAS para editar:"
echo "1. DOMAIN - Seu domínio (ex: famachat.seudominio.com)"
echo "2. PGPASSWORD - Senha segura para PostgreSQL"
echo "3. SESSION_SECRET - Chave secreta para sessões (64+ caracteres)"
echo "4. JWT_SECRET - Chave secreta para JWT (64+ caracteres)"
echo "5. EVOLUTION_API_URL - URL da sua API Evolution"
echo "6. EVOLUTION_API_KEY - Chave da API Evolution"
echo "7. OPENAI_API_KEY - Chave da API OpenAI"
echo ""
echo "Pressione ENTER para abrir o editor nano..."
read

nano .env

# ==============================================
# BUILD DA APLICAÇÃO
# ==============================================
print_status "Fazendo build da aplicação..."
docker build -t famachat:latest .

# ==============================================
# DEPLOY DA APLICAÇÃO
# ==============================================
print_status "Escolha o tipo de deploy:"
echo "1. Standalone (Recomendado para VPS único)"
echo "2. Docker Swarm (Para cluster)"
echo -n "Digite sua escolha [1]: "
read DEPLOY_CHOICE

DEPLOY_CHOICE=${DEPLOY_CHOICE:-1}

case $DEPLOY_CHOICE in
    1)
        print_status "Executando deploy standalone..."
        docker-compose -f docker-compose.production.yml up -d
        DEPLOY_FILE="docker-compose.production.yml"
        ;;
    2)
        print_status "Inicializando Docker Swarm..."
        if ! docker info | grep -q "Swarm: active"; then
            docker swarm init
        fi
        
        print_status "Executando deploy Swarm..."
        docker stack deploy -c docker-compose.swarm.yml famachat
        DEPLOY_FILE="docker-compose.swarm.yml"
        ;;
    *)
        print_error "Opção inválida"
        exit 1
        ;;
esac

# ==============================================
# VERIFICAÇÃO DA INSTALAÇÃO
# ==============================================
print_status "Aguardando inicialização dos serviços..."
sleep 30

print_status "Verificando status dos containers..."
if [[ $DEPLOY_CHOICE -eq 1 ]]; then
    docker-compose -f "$DEPLOY_FILE" ps
else
    docker service ls
fi

print_status "Testando saúde da aplicação..."
for i in {1..10}; do
    if curl -s http://localhost:5000/api/system/health >/dev/null 2>&1; then
        print_success "Aplicação está respondendo!"
        break
    elif [[ $i -eq 10 ]]; then
        print_warning "Aplicação não está respondendo. Verifique os logs."
    else
        print_status "Tentativa $i/10 - aguardando aplicação..."
        sleep 10
    fi
done

# ==============================================
# CONFIGURAÇÃO DE FIREWALL
# ==============================================
print_status "Configurando firewall..."
if command_exists ufw; then
    sudo ufw --force reset
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow ssh
    sudo ufw allow 80
    sudo ufw allow 443
    sudo ufw --force enable
    print_success "Firewall configurado"
else
    print_warning "UFW não encontrado. Configure o firewall manualmente"
fi

# ==============================================
# CONFIGURAÇÃO DE BACKUP AUTOMÁTICO
# ==============================================
print_status "Configurando backup automático..."
CRON_JOB="0 2 * * * cd $INSTALL_DIR && docker-compose -f $DEPLOY_FILE --profile backup up backup >/dev/null 2>&1"

# Remove cron job existente se houver
crontab -l 2>/dev/null | grep -v "famachat.*backup" | crontab -

# Adiciona novo cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

print_success "Backup automático configurado para 2h da manhã"

# ==============================================
# INFORMAÇÕES FINAIS
# ==============================================
echo ""
echo -e "${GREEN}=========================================="
echo "       INSTALAÇÃO CONCLUÍDA!"
echo -e "==========================================${NC}"
echo ""
echo "📍 Diretório de instalação: $INSTALL_DIR"
echo "🌐 Aplicação local: http://localhost:5000"
echo "🔗 URL pública: https://$(grep DOMAIN .env | cut -d'=' -f2)"
echo ""
echo -e "${YELLOW}PRÓXIMOS PASSOS:${NC}"
echo "1. Configure seu proxy reverso (Nginx/Traefik) para HTTPS"
echo "2. Configure DNS para apontar para este servidor"
echo "3. Teste todas as funcionalidades"
echo "4. Configure monitoramento"
echo ""
echo -e "${YELLOW}COMANDOS ÚTEIS:${NC}"
echo "• Ver logs: cd $INSTALL_DIR && docker-compose -f $DEPLOY_FILE logs -f"
echo "• Reiniciar: cd $INSTALL_DIR && docker-compose -f $DEPLOY_FILE restart"
echo "• Parar: cd $INSTALL_DIR && docker-compose -f $DEPLOY_FILE down"
echo "• Atualizar: cd $INSTALL_DIR && git pull && docker build -t famachat:latest . && docker-compose -f $DEPLOY_FILE up -d"
echo ""
echo -e "${GREEN}✅ FamaChat instalado com sucesso!${NC}"

# ==============================================
# REINICIALIZAÇÃO OPCIONAL
# ==============================================
if groups $USER | grep -q docker; then
    echo ""
    print_warning "É recomendado reiniciar o sistema para aplicar todas as configurações."
    echo -n "Deseja reiniciar agora? [s/N]: "
    read REBOOT_CHOICE
    
    if [[ "$REBOOT_CHOICE" =~ ^[Ss]$ ]]; then
        print_status "Reiniciando sistema em 10 segundos..."
        sleep 10
        sudo reboot
    fi
fi