# MultiChat AI - CRM Unificado com Super Agente IA

## 🚀 Visão Geral

**MultiChat AI** é uma plataforma SaaS multi-tenant que conecta WhatsApp, Instagram e Facebook em um único painel inteligente, impulsionado por um **Super Agente de IA** treinável personalizado para cada cliente.

---

## 🎯 Diferencial Competitivo

- ✅ **Conexão Unificada**: WhatsApp + Instagram + Facebook no mesmo dashboard
- ✅ **Evolution API Hostinger**: Infraestrutura própria com controle total
- ✅ **Meta Graph API**: Integração oficial com Meta para FB/IG
- ✅ **IA Personalizável**: Cada cliente treina seu próprio agente com seus dados (.MD)
- ✅ **SaaS Multi-Tenant**: Arquitetura escalável para múltiplas empresas
- ✅ **Supabase Backend**: Auth, PostgreSQL, Storage como serviço
- ✅ **Templates .MD Treináveis**: Instruções, produtos, preços e automações

---

## 📋 Funcionalidades Principais

### CRM Completo
- Gestão de clientes (leads, oportunidades, fechados)
- Histórico completo de conversas unificado
- Sistema de tickets com priorização automática
- Automação de follow-up inteligente
- Dashboard analítico com métricas em tempo real

### Super Agente IA
- Treinamento personalizado por cliente (via .MD)
- RAG (Retrieval-Augmented Generation) com documentos do cliente
- Instruções customizáveis: `instrucoes.md`, `produtos.md`, `precos.md`
- Base de conhecimento dinâmica e atualizável
- LLM choice: OpenAI, Anthropic, Groq, etc.

### Automação Avançada
- Respostas automáticas contextuais
- Fluxos de atendimento pré-definidos (via .MD)
- Integração com CRMs externos (Pipedrive, HubSpot)
- Notificações e alertas inteligentes
- Webhooks para integrações customizadas

---

## 🏗️ Arquitetura Técnica

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js + Vercel)          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Dashboard | Config IA | Billing | Landing Page      │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                           ↓ HTTPS/SSL
┌─────────────────────────────────────────────────────────┐
│                  API Routes (Vercel Functions)           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ /api/auth/*    │ /api/conversations/*               │ │
│  │ /api/ai/chat   │ /api/crm/*                         │ │
│  │ /api/analytics │ /api/webhooks/evolution            │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                  Supabase (Backend as Service)           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │
│  │ Auth (JWT)   │ │ PostgreSQL   │ │ Storage      │     │
│  └──────────────┘ └──────────────┘ └──────────────┘     │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              EXTERNAL INTEGRATIONS (Webhooks)            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │
│  │ Evolution API│ │ Meta Graph   │ │ LLM APIs     │     │
│  │ (Hostinger)  │ │ (Meta Cloud) │ │ (OpenAI, etc)│     │
│  └──────────────┘ └──────────────┘ └──────────────┘     │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Estrutura do Projeto

```
multichat-ai/
├── docs/
│   ├── README.md              # Visão geral deste arquivo
│   ├── ARCHITECTURE.md        # Arquitetura detalhada
│   ├── agent.md               # Configuração do Super Agente IA
│   ├── pma.md                 # Estratégia de Produto & Marketing
│   ├── sprints.md             # Roadmap em sprints
│   ├── api.md                 # Documentação da API REST
│   ├── database.md            # Esquema do banco de dados
│   ├── deployment.md          # Guia de deploy na Vercel
│   ├── evolution-setup.md     # Setup Evolution API Hostinger
│   └── security.md            # Políticas de segurança
├── frontend/                  # Next.js app (Vercel)
├── backend/                   # Node.js para lógica de API
├── supabase/                  # Configuração Supabase
└── tests/                     # Testes automatizados
```

---

## 🚀 Começando

### Pré-requisitos
- Node.js 18+
- Supabase account (gratuito)
- Meta Facebook Developer Account
- Evolution API rodando na Hostinger
- Chave de API do LLM (OpenAI, Anthropic, Groq, etc)

### Instalação Rápida

```bash
# Clone o repositório
git clone https://github.com/seuusuario/multichat-ai.git
cd multichat-ai

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env
nano .env  # Preencha com suas credenciais

# Rode migrations do Supabase
npx prisma migrate dev

# Inicie o desenvolvimento
npm run dev
```

---

## 📖 Documentação Completa

| Arquivo | Descrição |
|---------|-----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Arquitetura detalhada e decisões técnicas |
| [agent.md](./agent.md) | Configuração do Super Agente IA (prompts, RAG, .MD templates) |
| [pma.md](./pma.md) | Estratégia de produto, marketing e vendas |
| [sprints.md](./sprints.md) | Roadmap em sprints detalhado |
| [API.md](./API.md) | Documentação completa das APIs REST |
| [DATABASE.md](./DATABASE.md) | Esquema completo do banco de dados Supabase |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Guia de deploy na Vercel |
| [EVOLUTION-SETUP.md](./EVOLUTION-SETUP.md) | Setup Evolution API na Hostinger |

---

## 💰 Modelo de Negócio

### Plano Gratuito (7 dias de teste)
- 100 mensagens/mês
- 1 canal conectado
- Agente IA básico
- Suporte comunitário

### Plano Starter - R$97/mês
- 1.000 mensagens/mês
- 3 canais conectados
- Agente IA treinável (.MD)
- Dashboard básico

### Plano Professional - R$297/mês
- 5.000 mensagens/mês
- Canais ilimitados
- Agente IA avançado + RAG
- Dashboard analítico completo
- API access

### Plano Enterprise - Customizado
- Mensagens ilimitadas
- Canais ilimitados
- Agente IA enterprise
- SLA garantido
- Suporte dedicado

---

## 🔒 Segurança e Compliance

- ✅ LGPD/GDPR compliant
- ✅ Criptografia de dados em repouso e trânsito (TLS 1.3)
- ✅ Autenticação OAuth2 + JWT com Supabase Auth
- ✅ Rate limiting por tenant (max 100 req/min/plano)
- ✅ Auditoria completa de logs no banco
- ✅ Backup automático diário do Supabase

---

## 🔑 Integração Evolution API Hostinger

### Configuração Básica

```bash
# Na Hostinger, instale Evolution API
docker run -d \
  --name evolution-api \
  -p 3000:3000 \
  -v /path/to/evolution-data:/usr/local/app/data \
  evolutionapi/evolution-api

# Configure webhooks no painel Evolution
WEBHOOK_URL=https://seu-app.vercel.app/api/evolution/webhook

# Acesse o QR Code
http://seu-server-hostinger:3000/auth
```

### Environment Variables (Hostinger)

```env
# .env do servidor Evolution API
EVOLUTION_DB_PATH=/usr/local/app/data/db
EVOLUTION_LOG_LEVEL=info
WEBHOOK_URL=https://seu-app.vercel.app/api/evolution/webhook
PORT=3000
NODE_ENV=production
```

---

## 🤝 Contribuindo

Este é um projeto open-source. Sinta-se à vontade para:
- Reportar bugs
- Sugerir melhorias
- Enviar PRs com novas features
- Documentar workflows

---

## 📞 Contato e Suporte

- Email: support@multichat.ai
- Discord: https://discord.gg/multichat
- GitHub Issues: https://github.com/usuario/multichat-ai/issues

---

## 📄 Licença

MIT License - Veja o arquivo [LICENSE](./LICENSE) para detalhes.

---

## ⚡ Próximos Passes

- [ ] Finalizar integração Evolution API Hostinger
- [ ] Implementar RAG com vector DB (Pinecone/Supabase Vector)
- [ ] Criar dashboard analítico completo
- [ ] Desenvolver sistema de automação avançada
- [ ] Implementar billing e subscriptions (Stripe/Paddle)
- [ ] Deploy em produção na Vercel

---

*MultiChat AI - Conectando conversas, transformando atendimento* 🚀