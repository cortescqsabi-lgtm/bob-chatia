# 🔌 Evolution API Setup - Guia Completo Hostinger

## Visão Geral

Este guia detalha como instalar, configurar e conectar a **Evolution API** hospedada na **Hostinger**, integrando com o MultiChat AI SaaS via webhooks no Vercel.

---

## 📋 Pré-requisitos

### 1. Conta Hostinger

- ✅ Assinatura ativa (Hospedagem Web ou VPS)
- ✅ Acesso ao cPanel ou WHMCS
- ✅ Domínio configurado (opcional, pode usar IP direto no dev)

### 2. Conhecimentos Técnicos Necessários

- ✅ Docker instalado (ou acesso SSH para instalação)
- ✅ CLI básica de Linux
- ✅ Compreensão de webhooks e REST APIs

---

## 🚀 Instalação Evolution API na Hostinger

### Opção 1: Via cPanel (Mais Fácil)

#### 1. Acessar cPanel Hostinger

```bash
# URL do cPanel
https://seu-dominio.hostinger.com.br/cpanel

# Ou via IP direto
http://IP_DO_SEU_SERVIDOR:2083
```

#### 2. Instalar Docker no cPanel

No cPanel, vá para **Software** → **Docker** (ou **Manage Software**):

1. Clique em **"Install"** ou **"Enable"** para Docker
2. Selecione versão mais recente (`latest`)
3. Clique em **"Install"** e aguarde ~2-5 minutos
4. Verifique se está rodando: **Services** → **Docker** (status: Running)

#### 3. Acessar Terminal SSH

No cPanel, vá para **Software** → **Terminal & Shell** ou **SSH Access**:

```bash
# Comando SSH no terminal do cPanel
ssh root@seu-servidor.hostinger.com.br

# Ou se tiver porta específica
ssh root@seu-servidor:22
```

#### 4. Instalar Docker Compose (Opcional mas Recomendado)

```bash
# Dentro do SSH/terminal
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Adicionar usuário ao grupo docker (se não for root)
usermod -aG docker $USER
newgrp docker

# Verificar instalação
docker --version
docker-compose --version  # Se usar compose
```

### Opção 2: Via VPS/WHMCS (Mais Controle)

#### 1. SSH para Servidor VPS

```bash
ssh root@seu-servidor.hostinger.com.br
```

#### 2. Atualizar Sistema

```bash
sudo apt update && sudo apt upgrade -y
```

#### 3. Instalar Docker

```bash
# Adicionar repositório oficial do Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Iniciar e habilitar Docker
sudo systemctl start docker
sudo systemctl enable docker

# Verificar
docker --version
```

#### 4. Instalar Docker Compose

```bash
# Download oficial
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Dar permissão de execução
sudo chmod +x /usr/local/bin/docker-compose

# Verificar
docker-compose --version
```

---

## ⚙️ Configuração Evolution API

### 1. Pull Imagem Oficial

```bash
# Pull imagem mais recente
docker pull evolutionapi/evolution-api:latest

# Ou versão específica com bug fixes conhecidos
docker pull evolutionapi/evolution-api:v2.15.0
```

### 2. Configurar Environment Variables

Crie um arquivo `docker-compose.yml` ou use comandos inline:

```bash
# Configuração completa em um único comando
docker run -d \
  --name evolution-api \
  --restart=unless-stopped \
  --cpus=2 \
  --memory=2g \
  -p 3000:3000 \
  -e EVOLUTION_DB_PATH=/usr/local/app/data/db \
  -e EVOLUTION_LOG_LEVEL=info \
  -e WEBHOOK_URL=https://app.multichat.ai/api/evolution/webhook \
  -e PORT=3000 \
  -e NODE_ENV=production \
  -v /path/to/evolution-data:/usr/local/app/data \
  evolutionapi/evolution-api:latest
```

### 3. Configurar Persistência de Dados (Importante!)

Para não perder dados ao reiniciar container:

```bash
# Criar diretório para persistir dados
mkdir -p /home/user/evolution-data

# Run com volume mount
docker run -d \
  --name evolution-api \
  --restart=unless-stopped \
  --cpus=2 \
  --memory=2g \
  -p 3000:3000 \
  -e EVOLUTION_DB_PATH=/usr/local/app/data/db \
  -e EVOLUTION_LOG_LEVEL=info \
  -e WEBHOOK_URL=https://app.multichat.ai/api/evolution/webhook \
  -e PORT=3000 \
  -e NODE_ENV=production \
  -v /home/user/evolution-data:/usr/local/app/data \
  evolutionapi/evolution-api:latest
```

---

## 📱 Configuração QR Code Authentication

### 1. Acessar Evolution API UI

Abra navegador e acesse:

```bash
http://seu-servidor.hostinger.com.br:3000/auth
# ou
https://seu-dominio.hostinger.com.br:3000/auth
```

### 2. Escanear QR Code

1. Instale **WhatsApp Business App** no celular
2. Vá em **Configurações** → **Conexões** → **Conectar dispositivo**
3. Escaneie o QR code que aparece na tela Evolution API
4. Aguarde verificação (pode levar 1-5 minutos)

### 3. Verificar Status da Conexão

No navegador, acesse:

```bash
http://seu-servidor.hostinger.com.br:3000/api/v1/channels
```

Deve mostrar channel ativo com status `active`.

---

## 🔗 Configurar Channels (WhatsApp, Instagram, Facebook)

### 1. WhatsApp Channel (Já configurado no QR Code)

O WhatsApp é registrado automaticamente ao escanear o QR code.

#### Verificar Channel WhatsApp:

```bash
http://seu-servidor.hostinger.com.br:3000/api/v1/channels/whatsapp_5511999999999
```

Deve retornar:
```json
{
  "id": "whatsapp_5511999999999",
  "type": "whatsapp",
  "status": "active",
  "phone_number": "+5511999999999"
}
```

### 2. Instagram Business Channel

#### Pré-requisitos:
- ✅ Conta Instagram Business verificada
- ✅ Facebook Page vinculada
- ✅ Meta Developer Account com app registrado

#### Configurar via API:

```bash
# POST para criar channel de Instagram
curl -X POST http://localhost:3000/api/v1/channels \
  -H "Content-Type: application/json" \
  -d '{
    "type": "instagram",
    "name": "ig_business_account",
    "access_token": "IGQVJXa...token_meta",
    "page_access_token": "EAAG..."
  }'
```

#### Obter Instagram Access Token:

1. Acesse https://developers.facebook.com/
2. Vá em **My Apps** → Crie novo app ou selecione existente
3. Adicione **Instagram Basic Display** product
4. Configure OAuth permissions: `instagram_basic`, `pages_show_list`
5. Gere access token no Developer Dashboard

### 3. Facebook Messenger Channel

Similar ao Instagram, mas para páginas do Facebook.

```bash
curl -X POST http://localhost:3000/api/v1/channels \
  -H "Content-Type: application/json" \
  -d '{
    "type": "facebook",
    "name": "fb_page_messenger",
    "access_token": "EAAG...",
    "page_id": "123456789"
  }'
```

---

## 🔌 Configurar Webhooks no Evolution API

### 1. Via UI do Evolution API

1. Acesse: `http://localhost:3000/api/v1/config/webhook`
2. Configure URL para apontar para Vercel:
   ```
   https://app.multichat.ai/api/evolution/webhook
   ```
3. Enable eventos:
   - ✅ `message` (mensagens recebidas)
   - ✅ `status` (leitura/delivery status)
4. Salvar configuração

### 2. Via REST API

```bash
curl -X POST http://localhost:3000/api/v1/channels/whatsapp_5511999999999/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://app.multichat.ai/api/evolution/webhook",
    "events": ["message", "status"],
    "verify_ssl": true
  }'
```

### 3. Webhooks por Channel

Cada channel pode ter webhook próprio:

```bash
# WhatsApp webhook
curl -X POST http://localhost:3000/api/v1/channels/whatsapp_5511999999999/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://app.multichat.ai/api/evolution/webhook",
    "events": ["message", "status"]
  }'

# Instagram webhook (se suportado)
curl -X POST http://localhost:3000/api/v1/channels/instagram_ig123/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://app.multichat.ai/api/meta/webhook",
    "events": ["message"]
  }'
```

---

## 🔐 Environment Variables Completas

Crie arquivo `.env` no diretório do Evolution API:

```bash
# Configuração básica
EVOLUTION_DB_PATH=/usr/local/app/data/db
EVOLUTION_LOG_LEVEL=info
PORT=3000
NODE_ENV=production

# Webhook URL (Vercel)
WEBHOOK_URL=https://app.multichat.ai/api/evolution/webhook

# Meta Graph API (se usar Instagram/Facebook)
META_GRAPH_API_URL=https://graph.facebook.com/v18.0
META_APP_ID=123456789
META_APP_SECRET=your-app-secret-here

# Rate Limiting (opcional)
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000

# SSL/TLS Configuration
SSL_ENABLED=false # Use true se tiver certificado próprio
SSL_CERT_PATH=/etc/ssl/cert.pem
SSL_KEY_PATH=/etc/ssl/key.key

# Health Check
HEALTH_CHECK_INTERVAL=300000 # 5 minutos
```

---

## 📊 Monitoramento e Logs

### 1. Verificar Logs do Container

```bash
# Logs em tempo real
docker logs -f evolution-api

# Últimos 100 lines
docker logs --tail=100 evolution-api

# Logs específicos de erro
docker logs --tail=100 --since=30m evolution-api | grep ERROR
```

### 2. Verificar Status do Channel

```bash
http://localhost:3000/api/v1/channels/whatsapp_5511999999999
```

Resposta esperada:
```json
{
  "id": "whatsapp_5511999999999",
  "type": "whatsapp",
  "status": "active",
  "phone_number": "+5511999999999",
  "last_seen_at": "2024-03-10T14:30:00Z"
}
```

### 3. Health Check Endpoint

```bash
http://localhost:3000/health
```

Resposta:
```json
{
  "status": "ok",
  "uptime_seconds": 86400,
  "connected_channels": 1,
  "last_webhook_received_at": "2024-03-10T14:25:00Z"
}
```

---

## 🔄 Reiniciar Evolution API

### Reiniciar Container

```bash
# Stop container atual
docker stop evolution-api

# Remove volume temporário (opcional - perderá dados não persistidos)
docker rm evolution-api

# Start novo container com mesma configuração
docker run -d \
  --name evolution-api \
  --restart=unless-stopped \
  --cpus=2 \
  --memory=2g \
  -p 3000:3000 \
  -e EVOLUTION_DB_PATH=/usr/local/app/data/db \
  -e EVOLUTION_LOG_LEVEL=info \
  -e WEBHOOK_URL=https://app.multichat.ai/api/evolution/webhook \
  -e PORT=3000 \
  -e NODE_ENV=production \
  -v /home/user/evolution-data:/usr/local/app/data \
  evolutionapi/evolution-api:latest
```

### Backup de Dados Antes de Reiniciar

```bash
# Criar backup do diretório de dados
tar -czf evolution-backup-$(date +%Y%m%d-%H%M%S).tar.gz /home/user/evolution-data

# Ou backup completo com docker
docker run --rm \
  -v evolution-api-data:/data \
  alpine tar czf - /data | gzip > /backups/evolution-backup-$(date +%Y%m%d-%H%M%S).tar.gz
```

---

## 🚨 Troubleshooting Comum

### Problema 1: QR Code não aparece ou falha na verificação

**Causas:**
- WhatsApp bloqueou número (spam)
- Número não é Business Account
- Firewall bloqueando porta 3000

**Soluções:**
```bash
# Verificar se porta 3000 está acessível
telnet seu-servidor.hostinger.com.br 3000

# Ou usar curl
curl http://seu-servidor.hostinger.com.br:3000/health

# Liberar porta no cPanel Hostinger
# Security Level → Medium ou Low (não Strict)
```

### Problema 2: Webhook não recebe mensagens

**Causas:**
- URL do webhook incorreta
- SSL expirado ou inválido
- Evolution API não restartado após configurar webhook

**Soluções:**
```bash
# Verificar configuração de webhook atual
curl http://localhost:3000/api/v1/config/webhook

# Reiniciar container para aplicar nova configuração
docker restart evolution-api

# Testar webhook manualmente
curl -X POST http://localhost:3000/api/v1/channels/whatsapp_5511999999999/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://app.multichat.ai/api/evolution/webhook",
    "events": ["message", "status"]
  }'
```

### Problema 3: Container reinicia sozinho

**Causa**: Falta de memória ou CPU no servidor Hostinger

**Solução:**
```bash
# Verificar uso de recursos
docker stats evolution-api

# Aumentar recursos no docker run
--cpus=4 \
--memory=4g

# Ou usar cgroups do sistema
sudo systemctl edit docker
# Adicionar:
[Service]
LimitNOFILE=65535
```

### Problema 4: Mensagens não processadas (fila cheia)

**Causa**: Evolution API sobrecarregado

**Solução:**
```bash
# Verificar queue no container
docker exec evolution-api ps aux | grep worker

# Aumentar workers se suportado
EVOLUTION_WORKERS=4

# Ou usar fila externa (Redis/RabbitMQ) para escalabilidade
```

### Problema 5: SSL Certificate Errors

**Causa**: Hostinger não fornece SSL automático na porta 3000

**Solução:**
```bash
# Opção 1: Usar HTTPS via reverse proxy (Nginx)
docker run -d \
  --name nginx-proxy \
  --restart=unless-stopped \
  -p 80:80 \
  -p 443:443 \
  -v /etc/nginx/nginx.conf:/etc/nginx/nginx.conf:ro \
  nginx:alpine

# Configurar Nginx com SSL (certbot)
apt-get update && apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d app.multichat.ai

# Opção 2: Usar apenas HTTP no desenvolvimento
EVOLUTION_WEBHOOK_URL=http://localhost:3000/api/evolution/webhook
```

---

## 🔧 Otimização de Performance

### 1. Aumentar Workers (Multi-threading)

Se a imagem suportar, configure múltiplos workers:

```bash
docker run -d \
  --name evolution-api \
  --cpus=4 \
  --memory=4g \
  -e EVOLUTION_WORKERS=4 \
  -e EVOLUTION_DB_PATH=/usr/local/app/data/db \
  -e WEBHOOK_URL=https://app.multichat.ai/api/evolution/webhook \
  evolutionapi/evolution-api:latest
```

### 2. Otimizar Banco de Dados Local

Evolution API usa SQLite local por padrão. Para alta carga:

```bash
# Migrar para PostgreSQL (avançado)
# Requer setup adicional de connection string

EVOLUTION_DB_URL=postgresql://user:password@localhost:5432/evolution_db
```

### 3. Rate Limiting Configuração

Para evitar bloqueios do WhatsApp:

```bash
# Adicionar no .env
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_BURST=20
```

---

## 📈 Scaling para Múltiplos Tenants

### Arquitetura Multi-Tenant

Para suportar múltiplas empresas no mesmo servidor:

```bash
# Container único com multiple channels (WhatsApp, IG, FB)
docker run -d \
  --name evolution-multi-tenant \
  --cpus=4 \
  --memory=4g \
  -p 3000:3000 \
  -e WEBHOOK_URL=https://app.multichat.ai/api/evolution/webhook \
  -e EVOLUTION_LOG_LEVEL=info \
  evolutionapi/evolution-api:latest

# Cada tenant tem seus channels registrados separadamente
# Tenant A: +5511999999999, +5521888888888
# Tenant B: +5531777777777, +5541666666666
```

### Webhooks por Tenant (Advanced)

Se precisar isolar webhooks por tenant:

```bash
# Tenant A webhook
curl -X POST http://localhost:3000/api/v1/channels/whatsapp_5511999999999/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://app.multichat.ai/api/evolution/tenant-a/webhook",
    "events": ["message"]
  }'

# Tenant B webhook
curl -X POST http://localhost:3000/api/v1/channels/whatsapp_5522999999999/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://app.multichat.ai/api/evolution/tenant-b/webhook",
    "events": ["message"]
  }'
```

No backend Vercel, roteie por tenant_id nos handlers.

---

## 📝 Checklist de Deploy Final

- [ ] Docker instalado e rodando no Hostinger
- [ ] Evolution API container iniciado
- [ ] QR code escaneado e channel WhatsApp ativo
- [ ] Webhook URL configurado apontando para Vercel (HTTPS)
- [ ] Channels Instagram/Facebook registrados (se necessário)
- [ ] Environment variables configuradas corretamente
- [ ] Logs verificando sem erros
- [ ] Health check retornando status ok
- [ ] Backup de dados configurado

---

## 🚀 Comandos Úteis para Manutenção

```bash
# Verificar status do container
docker ps | grep evolution-api

# Reiniciar container
docker restart evolution-api

# Verificar logs em tempo real
docker logs -f evolution-api

# Executar comando dentro do container
docker exec -it evolution-api bash

# Backup dos dados
tar -czf evolution-backup-$(date +%Y%m%d).tar.gz /home/user/evolution-data

# Restaurar backup
tar -xzf evolution-backup-20240310.tar.gz -C /home/user/evolution-data

# Stop container
docker stop evolution-api

# Start container
docker start evolution-api

# Remove container (perde dados!)
docker rm evolution-api

# Pull nova versão da imagem
docker pull evolutionapi/evolution-api:latest

# Verificar espaço em disco
df -h

# Limpar containers parados
docker system prune -a
```

---

*Guia completo de setup Evolution API na Hostinger!* 🔌✨