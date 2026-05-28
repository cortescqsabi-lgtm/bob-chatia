# 🚀 Deployment Guide - MultiChat AI na Vercel

## Visão Geral

Este guia detalha como deployar o MultiChat AI SaaS na **Vercel** (frontend/API) e configurar a integração com **Evolution API hospedada na Hostinger**.

---

## 🏗️ Arquiteta de Deploy

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (Frontend + API Routes)        │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Next.js App (Frontend Dashboard)                    │ │
│  │ Node.js Functions (API Endpoints)                   │ │
│  └─────────────────────────────────────────────────────┘ │
│                           ↓ HTTPS/SSL                    │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Supabase (Database + Auth + Storage)                │ │
│  └─────────────────────────────────────────────────────┘ │
│                           ↓                              │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Evolution API (Hostinger - Webhooks)                │ │
│  └─────────────────────────────────────────────────────┘ │
│                           ↓                              │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Meta Graph API (Meta Cloud - IG/Facebook)           │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Pré-requisitos

### Accounts & Services Necessários

- ✅ **Vercel Account** (gratuito ou Pro para production)
- ✅ **Supabase Project** configurado
- ✅ **Hostinger Account** (para Evolution API)
- ✅ **Meta Developer Account** (para IG/Facebook integration)
- ✅ **LLM API Keys** (OpenAI, Anthropic, Groq, etc.)

### Git Repository

```bash
# Clone do repositório (se ainda não fez)
git clone https://github.com/seuusuario/multichat-ai.git
cd multichat-ai
```

---

## 🚀 Deploy na Vercel - Passo a Passo

### 1. Preparação do Projeto

#### Estrutura de Pastas Esperada

```
multichat-ai/
├── docs/                          # Documentação (criado)
├── frontend/                      # Next.js app
│   ├── app/                      # App Router
│   ├── components/               # React components
│   ├── lib/                      # Utilities
│   └── public/                   # Static assets
├── supabase/                     # Supabase configs
├── .env.example                  # Template de environment vars
├── package.json
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

#### package.json Configuration

```json
{
  "name": "multichat-ai",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.39.0",
    "stripe": "^14.9.0",
    "openai": "^4.20.0",
    "anthropic": "^0.15.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 2. Configuração de Environment Variables

#### .env.local (Development)

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Evolution API Webhook URL (Hostinger)
EVOLUTION_WEBHOOK_URL=https://app.multichat.ai/api/evolution/webhook

# Meta Graph API Configuration
META_GRAPH_API_URL=https://graph.facebook.com/v18.0
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret

# LLM Provider Configuration (Tenant-specific stored in DB)
DEFAULT_LLM_PROVIDER=openai
DEFAULT_LLM_MODEL=gpt-4-turbo

# Stripe Configuration (for billing)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxx

# JWT Secret (for session management)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Vercel Environment Variables (auto-loaded in production)
VERCEL_ENV=production
VERCEL_URL=your-app.vercel.app
```

#### .env.production (Production Template)

Crie um arquivo `.env.production` com valores de produção:

```env
# Supabase Production
NEXT_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key

# Evolution API Webhook (must be HTTPS)
EVOLUTION_WEBHOOK_URL=https://app.multichat.ai/api/evolution/webhook

# Stripe Production Keys
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxx

# Vercel auto-injects these in production
VERCEL_ENV=production
VERCEL_DEPLOYMENT=xxxxxx
```

### 3. Configurar Variáveis de Ambiente na Vercel

#### Acessar Dashboard Vercel

1. Acesse https://vercel.com/dashboard
2. Clique em **"Add New Project"**
3. Importe seu repositório Git (GitHub/GitLab/Bitbucket)
4. Nome do projeto: `multichat-ai`
5. Root Directory: `.` (ou pasta específica)

#### Add Environment Variables

No painel da Vercel, vá em **Settings → Environment Variables**:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Evolution API Webhook URL
EVOLUTION_WEBHOOK_URL=https://app.multichat.ai/api/evolution/webhook

# Meta Graph
META_APP_ID=123456789
META_APP_SECRET=your-app-secret

# Stripe (production only)
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxx

# JWT Secret
JWT_SECRET=change-this-in-production-secure-random-string

# LLM Default Settings
DEFAULT_LLM_PROVIDER=openai
DEFAULT_LLM_MODEL=gpt-4-turbo
```

**Importante:** As variáveis `NEXT_PUBLIC_*` começam com `NEXT_PUBLIC_` para serem expostas no cliente via `process.env`.

### 4. Build & Deploy Settings na Vercel

#### Build Command

No painel Vercel: **Settings → Build & Deployment → Build Command**

```bash
npm run build
```

#### Output Directory

```bash
.out
# ou
.next
```

#### Install Command

```bash
npm install
```

### 5. Deploy Inicial

Após configurar tudo, clique em **"Deploy"**. A Vercel vai:

1. Instalar dependências (`npm install`)
2. Rodar build (`npm run build`)
3. Gerar URL de preview (ex: `https://multichat-ai-git-main-seuusuario.vercel.app`)

### 6. Produção Deployment

Para deploy em produção:

1. Faça commit das mudanças
2. Vercel detecta branch `main` e deploy automaticamente
3. URL final: `https://app.multichat.ai` (após configurar custom domain)

---

## 🔗 Configuração Evolution API na Hostinger

### 1. Setup Evolution API Docker na Hostinger

#### Acessar cPanel Hostinger

1. Acesse https://www.hostinger.com.br/cliente
2. Vá em **"Gerenciar"** → Seu domínio
3. Clique em **"cPanel"**

#### Instalar Docker no cPanel

```bash
# SSH para seu servidor Hostinger
ssh root@seu-servidor.hostinger.com.br

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Iniciar Docker
sudo systemctl start docker
sudo systemctl enable docker

# Adicionar usuário ao grupo docker (se não for root)
sudo usermod -aG docker $USER
newgrp docker
```

#### Pull Evolution API Image

```bash
# Pull imagem oficial
docker pull evolutionapi/evolution-api:latest

# Ou versão específica com bug fixes
docker pull evolutionapi/evolution-api:v2.15.0
```

#### Run Evolution API Container

```bash
docker run -d \
  --name evolution-api \
  --restart=unless-stopped \
  -p 3000:3000 \
  -e EVOLUTION_DB_PATH=/usr/local/app/data/db \
  -e EVOLUTION_LOG_LEVEL=info \
  -e WEBHOOK_URL=https://app.multichat.ai/api/evolution/webhook \
  -e PORT=3000 \
  -e NODE_ENV=production \
  evolutionapi/evolution-api:latest
```

### 2. Configurar QR Code Authentication

#### Acessar Evolution API UI

```bash
# Abra navegador e acesse
http://seu-servidor.hostinger.com.br:3000/auth
```

O QR code aparecerá na tela. Escaneie com WhatsApp Business App para conectar.

### 3. Configurar Channels (WhatsApp, IG, FB)

#### Registrar Channel WhatsApp

1. No Evolution API UI, vá em **"Channels"** → **"Add New Channel"**
2. Escolha **WhatsApp**
3. Selecione número de telefone
4. Escaneie QR code que aparece na tela
5. Aguarde verificação do WhatsApp Business

#### Registrar Channel Instagram/Facebook

1. Vá em **"Channels"** → **"Add New Channel"**
2. Escolha **Instagram** ou **Facebook Messenger**
3. Siga instruções de autenticação OAuth2
4. Conecte Page/Account

### 4. Configurar Webhooks no Evolution API

No painel Evolution API:

```bash
# Via REST API do Evolution
curl -X POST http://localhost:3000/api/v1/channels/whatsapp_5511999999999/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://app.multichat.ai/api/evolution/webhook",
    "events": ["message", "status"]
  }'
```

---

## 🔐 Configuração Supabase

### 1. Criar Projeto Supabase

1. Acesse https://supabase.com/dashboard
2. Click **"New Project"**
3. Escolha:
   - **Template**: Empty
   - **Database Password**: Gere uma senha forte
   - **Region**: Brazil (São Paulo) se disponível, ou próximo
   - **Organization**: Seu nome empresa

### 2. Configurar Database Schema

No Supabase Dashboard → **SQL Editor**:

```sql
-- Execute o script completo de schema (criado em docs/database.md)
-- Ou execute migrations via CLI

npx supabase migration up
```

### 3. Configurar Row Level Security (RLS)

No Supabase Dashboard → **Authentication** → **Row Level Security**:

Verifique que todas as políticas estão ativas:

- ✅ `Users can view own profile`
- ✅ `Tenant members can view conversations`
- ✅ `Tenant members can insert messages`
- ✅ etc. (ver docs/database.md)

### 4. Gerar API Keys Supabase

No Supabase Dashboard → **Authentication** → **API**:

```bash
# Anon Key (frontend usa esta)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (backend usa esta - NÃO exponha!)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Adicione à Vercel env vars:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🌐 Custom Domain Configuration

### 1. Configurar Domínio na Vercel

No painel Vercel → **Settings → Domains**:

1. Adicione seu domínio: `app.seudominio.com`
2. Vercel gera DNS records necessários
3. Configure no seu registrar (GoDaddy, Namecheap, Hostinger)

#### DNS Records Necessários

```
# A Record
Type: A
Name: @
Value: 76.76.21.21 (Vercel IP)
TTL: 1h

# CNAME Record
Type: CNAME
Name: www
Value: app-seuusuario.vercel.app
TTL: 1h

# TXT Record (verification)
Type: TXT
Name: @
Value: v=spf1 include:_vercel.vercel.cloud ~all
TTL: 1h
```

### 2. Configurar SSL Certificate

Vercel gera SSL automaticamente após configurar domínio. Aguarde ~5 minutos para ativação.

### 3. Redirecionamento HTTPS

No painel Vercel → **Settings → Redirects**:

```json
[
  {
    "source": "/(.*)",
    "destination": "https://$1",
    "status": 301,
    "hop": true
  }
]
```

---

## 🔧 Post-Deploy Checklist

### 1. Testar Endpoints Básicos

```bash
# Testar API root
curl https://app.multichat.ai/api/health

# Espera resposta:
{
  "status": "ok",
  "version": "1.0.0",
  "environment": "production"
}
```

### 2. Verificar Evolution API Webhook

```bash
# Testar webhook endpoint
curl -X POST https://app.multichat.ai/api/evolution/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test_msg_123",
    "timestamp": 1709856000,
    "contact": {
      "name": "Test User",
      "phone": "+5511999999999"
    },
    "message": {
      "text": "Test message from webhook",
      "type": "text"
    },
    "conversation_id": "test_conv_456",
    "direction": "incoming",
    "attachments": []
  }'

# Espera resposta:
{
  "status": "ok",
  "messageId": "test_msg_123"
}
```

### 3. Verificar Supabase Connection

No dashboard do frontend, abra DevTools Console e verifique:

```javascript
// Deve conectar sem erro
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('Supabase connected:', supabase);
```

### 4. Testar Fluxo Completo

1. ✅ Acesse landing page: `https://app.multichat.ai`
2. ✅ Cadastre-se (tenants onboarding)
3. ✅ Conecte Evolution API via QR Code
4. ✅ Envie mensagem de teste no WhatsApp
5. ✅ Verifique se IA responde corretamente
6. ✅ Verifique analytics dashboard

---

## 📊 Monitoring & Logging

### 1. Configurar Sentry (Error Tracking)

```bash
npm install @sentry/nextjs
```

No `next.config.js`:

```javascript
module.exports = {
  sentry: {
    org: "your-sentry-org",
    project: "multichat-ai",
    authToken: process.env.SENTRY_AUTH_TOKEN,
    url: "https://your-org.sentry.io/"
  }
};
```

### 2. Configurar Logs na Vercel

No painel Vercel → **Settings → Logs**:

- Enable **"Enable logs"**
- Configure log retention (30 days recommended)
- Set log level para `info` em production

### 3. Configurar Google Analytics (Opcional)

No `next.config.js`:

```javascript
const withAnalytics = require('@vercel/analytics/next');

module.exports = withAnalytics({
  // ... other config
});
```

---

## 🔒 Security Hardening

### 1. Helmet Headers (Next.js Middleware)

Crie `middleware.ts` em `src/middleware.ts`:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('X-Download-Options', 'noexec');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '0'); // Disable for Next.js SPA

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### 2. Rate Limiting na Vercel Edge Functions

No `middleware.ts`, adicione rate limiting:

```typescript
import rateLimit from 'rate-limit-library';

export function middleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for');
  
  if (ip && process.env.RATE_LIMIT_ENABLED === 'true') {
    // Implementar rate limiting customizado
  }
}
```

### 3. CORS Configuration

No `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.CORS_ORIGIN || 'https://app.multichat.ai'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,PUT,DELETE,OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type,Authorization,X-Webhook-Signature'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
```

---

## 🚨 Troubleshooting Comum

### Problema: Evolution Webhook não recebe mensagens

**Causa**: URL do webhook incorreta ou SSL expirado

**Solução**:
```bash
# Verificar se webhook URL está correta no Evolution API UI
curl http://localhost:3000/api/v1/config/webhook

# Deve retornar:
{
  "webhook_url": "https://app.multichat.ai/api/evolution/webhook"
}
```

### Problema: Supabase RLS bloqueia acesso

**Causa**: Políticas RLS não configuradas corretamente

**Solução**:
```sql
-- Verificar políticas ativas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  restrictive,
  securedesc
FROM pg_policies;

-- Se necessário, recriar políticas (ver docs/database.md)
```

### Problema: Build fails com "Module not found"

**Causa**: Dependências faltando ou version incompatível

**Solução**:
```bash
# Limpar cache e reinstalar
rm -rf node_modules .next
npm install

# Verificar versão do Node.js
node --version  # Deve ser >=18.0.0

# Re-deploy na Vercel
```

### Problema: AI responses muito lentas

**Causa**: LLM API rate-limited ou contexto muito grande

**Solução**:
```bash
# Verificar usage logs no Supabase
SELECT * FROM ai_usage_logs 
WHERE success = false 
ORDER BY created_at DESC 
LIMIT 10;

# Ajustar max_tokens e temperature nos .MD files
```

### Problema: QR Code não aparece

**Causa**: Evolution API container não rodando ou porta bloqueada

**Solução**:
```bash
# Verificar se container está rodando
docker ps | grep evolution-api

# Se não estiver, reiniciar
docker restart evolution-api

# Verificar logs
docker logs -f evolution-api

# Verificar firewall Hostinger
# Permitir porta 3000 no cPanel → Security Level
```

---

## 📈 Scaling Considerations

### 1. Vercel Tier Selection

| Tier | Quando Usar | Limites |
|------|-------------|---------|
| **Hobby** | Dev/Test | 100GB bandwidth/mês |
| **Pro** ($20/mês) | Production inicial | 100GB bandwidth + Functions unlimited |
| **Enterprise** | High traffic | Custom limits + Edge functions |

### 2. Database Scaling (Supabase)

No Supabase Dashboard → **Settings**:

- Enable **Auto Backup** (daily recommended)
- Set **Connection Pooling** para production
- Configure **Replication** se necessário

### 3. Evolution API Scaling

Para múltiplos tenants, considere:

```bash
# Container com multiple workers
docker run -d \
  --name evolution-api \
  --cpus=4 \
  --memory=4g \
  --restart=unless-stopped \
  -p 3000:3000 \
  evolutionapi/evolution-api:latest
```

---

## 📝 Maintenance Checklist

### Semanal

- [ ] Verificar logs de erro no Sentry/Vercel
- [ ] Monitorar uso de messages per tenant
- [ ] Rotacionar backups do Supabase
- [ ] Verificar SSL certificate expiration

### Mensal

- [ ] Review de performance (Lighthouse scores)
- [ ] Update dependências (`npm audit fix`)
- [ ] Cleanup de logs antigos no Supabase
- [ ] Teste de disaster recovery

### Trimestral

- [ ] Security audit completo
- [ ] Performance profiling
- [ ] Database optimization (VACUUM, reindex)
- [ ] Feature flag review

---

## 🎓 Recursos Adicionais

### Vercel Documentation
- https://vercel.com/docs
- https://nextjs.org/docs/deployment

### Supabase Documentation
- https://supabase.com/docs
- https://supabase.com/docs/guides/getting-started/quickstarts

### Evolution API Documentation
- https://github.com/EvolutionAPI/Evolution-API

### Best Practices
- Next.js: https://nextjs.org/docs/optimizing-performance
- Security: https://vercel.com/docs/deployments/security

---

*Guia completo de deploy na Vercel + Evolution API Hostinger!* 🚀✨