# 🚀 FamaChat - Guia de Deploy no VPS

## Instalação em 3 Passos

### 1️⃣ Instalação Rápida (Recomendada)
```bash
# No seu VPS, execute:
curl -fsSL https://raw.githubusercontent.com/seu-usuario/famachat/main/quick-install.sh | bash
```

### 2️⃣ Instalação Completa
```bash
# Clone e execute o instalador completo:
git clone https://github.com/seu-usuario/famachat.git
cd famachat
chmod +x install-vps.sh
./install-vps.sh
```

### 3️⃣ Instalação Manual
Siga o guia detalhado em `INSTALACAO-VPS.md`

## Pré-requisitos Mínimos

- **Sistema**: Ubuntu 20.04+ ou Debian 11+
- **Recursos**: 2GB RAM, 20GB disco, 1 CPU
- **Acesso**: SSH com sudo
- **Rede**: Portas 80, 443 abertas

## Configurações Essenciais

Após a instalação, edite o arquivo `.env`:

```bash
cd /opt/famachat
nano .env
```

Configure obrigatoriamente:
- `DOMAIN` - Seu domínio
- `EVOLUTION_API_URL` - URL da API Evolution
- `EVOLUTION_API_KEY` - Chave da API Evolution  
- `OPENAI_API_KEY` - Chave da OpenAI

## Comandos Úteis

```bash
# Ver status
docker ps

# Ver logs
docker-compose -f docker-compose.production.yml logs -f famachat

# Reiniciar aplicação
docker-compose -f docker-compose.production.yml restart

# Atualizar
git pull && docker build -t famachat:latest . && docker-compose -f docker-compose.production.yml up -d

# Backup manual
docker-compose -f docker-compose.production.yml --profile backup up backup
```

## Acesso à Aplicação

- **Local**: http://localhost:5000
- **Público**: https://seu-dominio.com

## Suporte

Para problemas, verifique:
1. Logs dos containers: `docker-compose logs`
2. Status dos serviços: `docker ps`
3. Conectividade de rede: `curl http://localhost:5000/api/system/health`
4. Configurações de DNS e SSL