#!/bin/bash

# ==============================================
# FAMACHAT - INSTALAÇÃO RÁPIDA VPS
# ==============================================

echo "🚀 FamaChat - Instalação Rápida VPS"
echo "=================================="

# Verificar se está executando como root
if [[ $EUID -eq 0 ]]; then
   echo "❌ Não execute como root. Use um usuário regular com sudo."
   exit 1
fi

# Função para gerar senhas seguras
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Coleta informações básicas
echo ""
echo "📋 Configuração Básica:"
read -p "🌐 Domínio (ex: famachat.exemplo.com): " DOMAIN
read -p "📧 Seu email: " EMAIL
read -p "🔗 URL do repositório Git: " REPO_URL

if [[ -z "$DOMAIN" || -z "$REPO_URL" ]]; then
    echo "❌ Domínio e URL do repositório são obrigatórios"
    exit 1
fi

echo ""
echo "🔧 APIs Externas (pressione ENTER para pular):"
read -p "🤖 Evolution API URL: " EVOLUTION_URL
read -p "🔑 Evolution API Key: " EVOLUTION_KEY
read -p "🧠 OpenAI API Key: " OPENAI_KEY

# Gerar senhas seguras
DB_PASSWORD=$(generate_password)
SESSION_SECRET=$(generate_password)$(generate_password)
JWT_SECRET=$(generate_password)$(generate_password)

echo ""
echo "⚙️ Iniciando instalação..."

# Atualizar sistema
sudo apt update -qq && sudo apt upgrade -y -qq

# Instalar Docker se necessário
if ! command -v docker &> /dev/null; then
    echo "📦 Instalando Docker..."
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
fi

# Instalar Docker Compose se necessário  
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Instalando Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Criar diretório e clonar
INSTALL_DIR="/opt/famachat"
sudo mkdir -p "$INSTALL_DIR"
sudo chown -R $USER:$USER "$INSTALL_DIR"

echo "📥 Clonando repositório..."
git clone "$REPO_URL" "$INSTALL_DIR"
cd "$INSTALL_DIR"
chmod +x *.sh

# Configurar rede Docker
newgrp docker << END
if ! docker network ls | grep -q "network_public"; then
    docker network create network_public
fi
END

# Criar arquivo .env
echo "📝 Criando configuração..."
cat > .env << EOF
# Configuração Básica
DOMAIN=$DOMAIN
NODE_ENV=production
PORT=5000
APP_URL=https://$DOMAIN

# Banco de Dados
PGPASSWORD=$DB_PASSWORD
PGHOST=postgres
PGPORT=5432
PGDATABASE=famachat
PGUSER=postgres
DATABASE_URL=postgresql://postgres:$DB_PASSWORD@postgres:5432/famachat

# Redis
REDIS_URL=redis://redis:6379
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Segurança
SESSION_SECRET=$SESSION_SECRET
JWT_SECRET=$JWT_SECRET

# APIs Externas
EVOLUTION_API_URL=${EVOLUTION_URL:-https://evolution.famachat.com.br}
EVOLUTION_API_KEY=${EVOLUTION_KEY:-sua_chave_aqui}
OPENAI_API_KEY=${OPENAI_KEY:-sua_chave_aqui}
GOOGLE_MAPS_API_KEY=AIzaSyAzqIdg1EKaI8cmb2W4iC6NfJs_D8vgEYY

# Facebook (Opcional)
FACEBOOK_APP_ID=1600246764019855
FACEBOOK_APP_SECRET=1600246764019855
FACEBOOK_PAGE_TOKEN=711015865662935

# Registry
REGISTRY=famachat
EOF

# Build e deploy
echo "🔨 Fazendo build da aplicação..."
newgrp docker << END
cd "$INSTALL_DIR"
docker build -t famachat:latest .
docker-compose -f docker-compose.production.yml up -d
END

# Configurar firewall
echo "🔥 Configurando firewall..."
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Aguardar inicialização
echo "⏳ Aguardando inicialização (30s)..."
sleep 30

echo ""
echo "✅ Instalação concluída!"
echo "========================"
echo "🌐 Aplicação: http://localhost:5000"
echo "🔗 Domínio: https://$DOMAIN"
echo "📁 Diretório: $INSTALL_DIR"
echo ""
echo "🔑 Credenciais geradas:"
echo "• DB Password: $DB_PASSWORD"
echo "• Session Secret: [64 caracteres gerados]"
echo "• JWT Secret: [64 caracteres gerados]"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure DNS para apontar $DOMAIN para este servidor"
echo "2. Configure proxy reverso (Nginx/Traefik) para SSL"
echo "3. Edite APIs em: nano $INSTALL_DIR/.env"
echo "4. Teste: curl http://localhost:5000/api/system/health"
echo ""
echo "🔧 Comandos úteis:"
echo "• Ver logs: cd $INSTALL_DIR && docker-compose -f docker-compose.production.yml logs -f"
echo "• Reiniciar: cd $INSTALL_DIR && docker-compose -f docker-compose.production.yml restart"
echo ""

# Mostrar status
newgrp docker << END
cd "$INSTALL_DIR"
echo "📊 Status dos containers:"
docker-compose -f docker-compose.production.yml ps
END

echo "🎉 FamaChat instalado com sucesso!"