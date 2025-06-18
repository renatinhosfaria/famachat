# FamaChat - Sistema Completo de Gestão Imobiliária

Sistema avançado para gestão de leads, clientes e vendas imobiliárias com integração WhatsApp, IA e análise de performance.

## Arquitetura

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Cache**: Redis (híbrido com fallback em memória)
- **Containerização**: Docker + Docker Compose
- **Proxy**: Traefik com SSL automático

## Funcionalidades

### Dashboard Analytics
- Métricas em tempo real
- Relatórios de performance por usuário
- Gráficos de conversão
- Ranking de produtividade

### Gestão de Leads
- Captura automatizada via webhooks
- Distribuição inteligente
- Sistema de SLA com cascata
- Acompanhamento de conversão

### WhatsApp Integration
- Múltiplas instâncias simultâneas
- Templates personalizados
- Envio automatizado
- QR code para conexão

### IA Conversacional
- Integração OpenAI GPT-4
- Respostas automáticas
- Análise de sentimentos
- Sugestões inteligentes

### Sistema de Clientes
- Kanban board visual
- Histórico completo de interações
- Agendamentos integrados
- Pipeline de vendas

## Deploy Rápido

```bash
# 1. Clonar repositório
git clone https://github.com/renatinhosfaria/famachat.git
cd famachat

# 2. Configurar domínio e executar deploy
./deploy.sh famachat.seudominio.com
```

## Configuração Manual

### Pré-requisitos
- Docker 20.10+
- Docker Compose 2.0+
- Traefik configurado (opcional)

### Variáveis de Ambiente

Copie `.env.production` para `.env` e configure:

```env
# Domínio
APP_URL=https://famachat.seudominio.com

# APIs obrigatórias
OPENAI_API_KEY=sk-your-openai-key
EVOLUTION_API_URL=https://evolution.famachat.com.br
EVOLUTION_API_KEY=your-evolution-key

# APIs opcionais
GOOGLE_MAPS_API_KEY=your-maps-key
FACEBOOK_APP_ID=your-facebook-id
```

### Inicialização

```bash
# Construir e iniciar serviços
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f famachat
```

### Migrações

```bash
# Executar migrações do banco
docker-compose exec famachat npm run db:push
```

## URLs de Acesso

- **Aplicação**: http://localhost:5000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Comandos Úteis

```bash
# Parar serviços
docker-compose down

# Reiniciar aplicação
docker-compose restart famachat

# Backup do banco
docker-compose run --rm backup

# Logs em tempo real
docker-compose logs -f

# Acesso ao container
docker-compose exec famachat sh
```

## Monitoramento

### Health Checks
- Aplicação: `GET /api/system/health`
- Database: Health check automático
- Redis: Health check automático

### Métricas
- CPU e Memória via Docker stats
- Logs estruturados em `/app/logs`
- Métricas de API via endpoints

## Backup e Restore

### Backup Automático
```bash
docker-compose run --rm backup
```

### Restore Manual
```bash
# Copiar backup para container
docker cp backup.sql famachat-postgres:/backup.sql

# Restaurar
docker-compose exec postgres psql -U postgres -d famachat < /backup.sql
```

## Scaling

### Horizontal Scaling
```yaml
# docker-compose.yml
famachat:
  deploy:
    replicas: 3
```

### Load Balancer
Traefik configurado automaticamente para balanceamento.

## Troubleshooting

### Logs Detalhados
```bash
# Logs da aplicação
docker-compose logs famachat

# Logs do banco
docker-compose logs postgres

# Logs do Redis
docker-compose logs redis
```

### Problemas Comuns

**Erro de conexão com banco:**
```bash
# Verificar se PostgreSQL está rodando
docker-compose exec postgres pg_isready

# Verificar logs
docker-compose logs postgres
```

**Erro de permissão em uploads:**
```bash
# Corrigir permissões
docker-compose exec famachat chown -R famachat:nodejs /app/server/uploads
```

**Cache Redis indisponível:**
Sistema utiliza fallback automático para cache em memória.

## Desenvolvimento

### Ambiente Local
```bash
# Instalar dependências
npm install

# Iniciar desenvolvimento
npm run dev

# Build de produção
npm run build
```

### Estrutura do Projeto
```
famachat/
├── client/          # Frontend React
├── server/          # Backend Node.js
├── shared/          # Schemas compartilhados
├── docker-compose.yml
├── Dockerfile
└── deploy.sh
```

## Segurança

- Autenticação JWT
- Rate limiting configurado
- Sanitização de inputs
- HTTPS obrigatório em produção
- Secrets em variáveis de ambiente

## Suporte

Para problemas técnicos:
1. Verificar logs: `docker-compose logs`
2. Verificar health checks
3. Conferir configurações de ambiente
4. Consultar documentação das APIs integradas

## Licença

Proprietary - Fama Negócios Imobiliários