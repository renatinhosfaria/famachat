# FamaChat - Sistema de Gestão Imobiliária

Sistema completo para gestão de leads, clientes e vendas no mercado imobiliário brasileiro, com integração WhatsApp, IA e automações avançadas.

## 🚀 Tecnologias

- **Frontend**: React.js + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Cache**: Redis (com fallback para memória)
- **Container**: Docker + Docker Swarm
- **Proxy**: Traefik (SSL automático)

## 🔧 Integrações

- **WhatsApp**: Evolution API para automação
- **IA**: OpenAI GPT-4 para respostas inteligentes
- **Mapas**: Google Maps API
- **Social**: Facebook, Instagram, LinkedIn
- **Analytics**: Google Analytics

## 📦 Deploy Rápido

### VPS com Docker
```bash
# Clone o repositório
git clone https://github.com/renatinhosfaria/famachat.git
cd famachat

# Configure variáveis de ambiente
cp .env.production .env
# Edite .env com suas credenciais

# Deploy automático
chmod +x deploy.sh
./deploy.sh
```

### Docker Compose
```bash
docker-compose up -d
```

### Docker Swarm
```bash
docker stack deploy -c docker-compose.yml famachat
```

## 🔐 Configuração

### Variáveis Obrigatórias
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
```

### APIs Opcionais
```env
EVOLUTION_API_KEY=your_evolution_key
OPENAI_API_KEY=your_openai_key
GOOGLE_MAPS_API_KEY=your_maps_key
```

## 📊 Monitoramento

- Health: `/api/health`
- Cache: `/api/system/cache`
- Stats: `/api/system/stats`

## 🏗️ Arquitetura

- **Cache Híbrido**: Redis externo com fallback para memória
- **Migrations**: Automáticas no startup
- **SSL**: Certificados automáticos via Traefik
- **Escalabilidade**: Suporte a múltiplas instâncias
- **Observabilidade**: Logs estruturados e métricas

## 📱 Funcionalidades

- Gestão completa de leads e clientes
- Automação WhatsApp com IA
- Dashboard com métricas em tempo real
- Sistema de agendamentos e visitas
- Controle de vendas e comissões
- Relatórios e analytics avançados
- Sistema de usuários e permissões
- Integração com redes sociais

## 🛠️ Desenvolvimento

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar produção
npm start
```

## 📄 Licença

MIT License - veja LICENSE para detalhes.