# 🚀 Guia de Instalação FamaChat no VPS

## 📋 Pré-requisitos

### 1. Sistema Operacional
- Ubuntu 20.04+ ou Debian 11+
- Acesso root ou sudo
- Mínimo 2GB RAM, 20GB disco

### 2. Dependências Necessárias
```bash
# Atualize o sistema
sudo apt update && sudo apt upgrade -y

# Instale dependências básicas
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Instale Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instale Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Reinicie para aplicar permissões do Docker
sudo reboot
```

### 3. Configuração de Rede Docker
```bash
# Crie a rede network_public (se ainda não existe)
docker network create --driver bridge network_public

# Ou se usar Swarm:
docker swarm init
docker network create --driver overlay --attachable network_public
```

## 🔧 Instalação do FamaChat

### Passo 1: Clone o Repositório
```bash
# Navegue para o diretório desejado
cd /opt

# Clone o repositório
sudo git clone https://github.com/seu-usuario/famachat.git
cd famachat

# Configure permissões
sudo chown -R $USER:$USER /opt/famachat
chmod +x *.sh
```

### Passo 2: Configuração do Ambiente

#### Arquivo .env.production
```bash
# Copie e edite o arquivo de ambiente
cp .env.production .env

# Edite com suas configurações
nano .env
```

#### Configurações Essenciais no .env:
```env
# === CONFIGURAÇÕES BÁSICAS ===
DOMAIN=famachat.seudominio.com
PGPASSWORD=sua_senha_postgresql_segura
SESSION_SECRET=sua_chave_session_muito_segura_64_caracteres
JWT_SECRET=sua_chave_jwt_muito_segura_64_caracteres

# === APIs EXTERNAS ===
EVOLUTION_API_URL=https://evolution.famachat.com.br
EVOLUTION_API_KEY=sua_chave_evolution_api
OPENAI_API_KEY=sua_chave_openai
GOOGLE_MAPS_API_KEY=sua_chave_google_maps

# === FACEBOOK (OPCIONAL) ===
FACEBOOK_APP_ID=seu_facebook_app_id
FACEBOOK_APP_SECRET=seu_facebook_app_secret
FACEBOOK_PAGE_TOKEN=seu_facebook_page_token

# === CONFIGURAÇÕES AVANÇADAS ===
REGISTRY=famachat
NODE_ENV=production
PORT=5000
```

### Passo 3: Build da Aplicação
```bash
# Build da imagem Docker
docker build -t famachat:latest .

# Ou usando o Docker Compose
docker-compose -f docker-compose.production.yml build
```

### Passo 4: Deploy da Aplicação

#### Opção A: Deploy Standalone (Recomendado para VPS único)
```bash
# Execute o deploy standalone
./deploy-production.sh

# Ou manualmente:
docker-compose -f docker-compose.production.yml up -d
```

#### Opção B: Deploy Docker Swarm (Para cluster)
```bash
# Execute o deploy Swarm
./deploy-swarm.sh

# Ou manualmente:
docker stack deploy -c docker-compose.swarm.yml famachat
```

### Passo 5: Verificação da Instalação
```bash
# Verifique os containers
docker ps

# Verifique os logs
docker-compose -f docker-compose.production.yml logs -f famachat

# Teste a aplicação
curl http://localhost:5000/api/system/health
```

## 🌐 Configuração de Proxy Reverso (Traefik/Nginx)

### Se usar Traefik (Já configurado)
O FamaChat já vem configurado com labels do Traefik. Certifique-se que:
- Traefik está rodando na rede `network_public`
- Certificado SSL configurado
- DNS apontando para o servidor

### Se usar Nginx
```nginx
server {
    listen 80;
    server_name famachat.seudominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name famachat.seudominio.com;
    
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔒 Configurações de Segurança

### 1. Firewall
```bash
# Configure UFW
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable
```

### 2. Backup Automático
```bash
# Crie um cron job para backup
crontab -e

# Adicione (backup diário às 2h da manhã):
0 2 * * * cd /opt/famachat && docker-compose -f docker-compose.production.yml --profile backup up backup
```

### 3. Monitoramento
```bash
# Verifique o status periodicamente
watch docker ps

# Monitore logs em tempo real
docker-compose -f docker-compose.production.yml logs -f
```

## 🔄 Comandos de Manutenção

### Atualização
```bash
cd /opt/famachat
git pull origin main
docker build -t famachat:latest .
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d
```

### Backup Manual
```bash
docker-compose -f docker-compose.production.yml --profile backup up backup
```

### Restauração de Backup
```bash
# Liste os backups disponíveis
docker run --rm -v famachat_backup_data:/backup alpine ls -la /backup

# Restaure um backup específico
docker exec -i famachat-postgres psql -U postgres -d famachat < backup_file.sql
```

### Limpeza do Sistema
```bash
# Remova containers e imagens não utilizadas
docker system prune -a

# Remova volumes órfãos
docker volume prune
```

## 🚨 Troubleshooting

### Problemas Comuns:

1. **Erro de rede**: Verifique se `network_public` existe
2. **Permissões**: Certifique-se que o usuário está no grupo docker
3. **Porta ocupada**: Verifique se as portas 5000, 5432, 6379 estão livres
4. **SSL**: Configure certificados válidos para HTTPS
5. **DNS**: Certifique-se que o domínio aponta para o servidor

### Logs para Debug:
```bash
# Logs da aplicação
docker-compose -f docker-compose.production.yml logs famachat

# Logs do banco
docker-compose -f docker-compose.production.yml logs postgres

# Logs do Redis
docker-compose -f docker-compose.production.yml logs redis
```

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs dos containers
2. Confirme as configurações do .env
3. Teste a conectividade de rede
4. Verifique as APIs externas (Evolution, OpenAI)

## 🎉 Conclusão

Após seguir este guia, o FamaChat estará rodando em:
- **HTTP**: http://seu-ip:5000 
- **HTTPS**: https://famachat.seudominio.com (com proxy configurado)

A aplicação inclui:
- ✅ Frontend React
- ✅ Backend Node.js/Express
- ✅ Banco PostgreSQL
- ✅ Cache Redis  
- ✅ Integração WhatsApp (Evolution API)
- ✅ IA conversacional (OpenAI)
- ✅ Sistema de backup
- ✅ Monitoramento de saúde