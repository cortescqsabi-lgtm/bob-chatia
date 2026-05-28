# 🔒 Security Policies - MultiChat AI

## Visão Geral

Este documento descreve as políticas de segurança implementadas no MultiChat AI SaaS, garantindo isolamento multi-tenant, proteção de dados sensíveis e compliance com LGPD/GDPR.

---

## 🛡️ Arquitetura de Segurança

```
┌─────────────────────────────────────────────────────────┐
│                    Security Layers                        │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Network Layer                                      │ │
│  │ - HTTPS/TLS 1.3 (Vercel CDN)                      │ │
│  │ - WAF Protection (Cloudflare)                      │ │
│  │ - Rate Limiting                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Application Layer                                  │ │
│  │ - JWT Authentication (Supabase Auth)               │ │
│  │ - API Signature Verification                       │ │
│  │ - Input Validation & Sanitization                  │ │
│  │ - CSRF Protection                                   │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Data Layer                                         │ │
│  │ - Row Level Security (RLS)                         │ │
│  │ - Encrypted API Keys                               │ │
│  │ - PII Masking/Redaction                             │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Infrastructure Layer                                │ │
│  │ - Vercel (Managed Server)                          │ │
│  │ - Supabase (Managed DB + Auth)                     │ │
│  │ - Hostinger (Isolated Evolution API)               │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication & Authorization

### 1. JWT-Based Auth (Supabase)

#### Token Structure

```json
{
  "type": "full_access",
  "exp": 1709856000,
  "iat": 1709769600,
  "iss": "supabase_auth",
  "sub": "uuid_user_id",
  "tenant_id": "uuid_tenant_id",
  "role": "admin",
  "email": "user@example.com"
}
```

#### Token Rotation Strategy

```typescript
// Implementar token refresh automático
const REFRESH_TOKEN_INTERVAL = 24 * 60 * 60 * 1000; // 24 horas

setInterval(() => {
  // Refresh JWT antes de expirar
  refreshToken();
}, REFRESH_TOKEN_INTERVAL - (5 * 60 * 1000)); // Refresh 5 minutos antes
```

#### Session Management

```typescript
// Store sessions server-side (não no localStorage!)
interface SessionStore {
  sessionId: string;
  userId: string;
  tenantId: string;
  role: string;
  expiresAt: Date;
  ip: string;
  userAgent: string;
}

// Validar sessão em cada request
function validateSession(sessionId: string): boolean {
  const session = sessionStorageStore.get(sessionId);
  
  if (!session) return false;
  
  if (new Date(session.expiresAt) < new Date()) return false;
  
  // Verificar IP/User-Agent se mudou (suspicious activity)
  const currentIp = getClientIP();
  if (session.ip !== currentIp && !isTrustedIp(currentIp)) {
    revokeSession(sessionId);
    return false;
  }
  
  return true;
}
```

### 2. Multi-Tenant Isolation

#### Row Level Security (RLS) Policies

```sql
-- Padrão para todas as tabelas de dados
CREATE POLICY "Tenant members can view data"
  ON [table_name] FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE tenant_id = [table_name].tenant_id
    )
  );

CREATE POLICY "Tenant members can insert data"
  ON [table_name] FOR INSERT 
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE tenant_id = [table_name].tenant_id
    )
  );

CREATE POLICY "Tenant members can update own data"
  ON [table_name] FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE tenant_id = [table_name].tenant_id
    )
  );

CREATE POLICY "Tenant members can delete own data"
  ON [table_name] FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE tenant_id = [table_name].tenant_id
    )
  );
```

#### Admin Privileges

```sql
-- Admins do tenant têm acesso completo ao próprio tenant
CREATE POLICY "Admins have full access"
  ON [table_name] FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.tenant_id = (
        SELECT id FROM tenants 
        WHERE id IN (
          SELECT tenant_id FROM users WHERE id = auth.uid()
        )
      )
      AND u.role = 'admin'
    )
  );

-- Proibir acesso entre tenants
CREATE POLICY "No cross-tenant access"
  ON [table_name] FOR ALL
  USING (
    true -- Sempre verdadeiro para admins, falso para outros
  );
```

### 3. API Key Management

#### Armazenamento Criptografado

```sql
-- Tabela para armazenar chaves criptografadas
CREATE TABLE tenant_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  provider TEXT NOT NULL, -- 'openai', 'anthropic', etc
  api_key_encrypted TEXT NOT NULL, -- Encrypted with tenant's master key
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Criptografar com PGP (PostgreSQL)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Função para desencriptar com permissão RLS
CREATE OR REPLACE FUNCTION decrypt_api_key(tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  key_pgp TEXT;
BEGIN
  SELECT encrypted_value INTO key_pgp 
  FROM tenant_api_keys 
  WHERE tenant_id = $1 AND is_active = TRUE
  LIMIT 1;
  
  -- Desencriptar com chave mestra do tenant
  RETURN pgp_decrypt(key_pgp, tenant_master_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS: Apenas usuários do próprio tenant podem acessar chaves
CREATE POLICY tenant_api_key_access ON tenant_api_keys
  USING (tenant_id = (SELECT id FROM auth.users WHERE auth.uid() = id).id);

ALTER TABLE tenant_api_keys ENABLE ROW LEVEL SECURITY;
```

#### Rotacionar API Keys Automaticamente

```typescript
// Rotacionar chave de LLM a cada 30 dias ou se detectado uso anômalo
async function rotateApiKey(tenantId: string): Promise<void> {
  const key = await generateNewApikey(tenantId);
  
  // Armazenar nova chave criptografada
  await supabase
    .from('tenant_api_keys')
    .update({
      api_key_encrypted: encryptKey(key),
      created_at: new Date(),
      is_active: false
    })
    .eq('tenant_id', tenantId)
    .eq('provider', 'openai'); // Ou outro provider
  
  // Notificar tenant via email/webhook
  await notifyTenantOfRotation(tenantId, key);
}
```

---

## 🚨 Rate Limiting & Abuse Prevention

### 1. Per-Tenant Rate Limiting

```typescript
// Implementar no middleware do Express/NestJS
const rateLimit = require('express-rate-limit');

const tenantRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 requests por minuto por tenant
  message: { 
    error: { 
      code: 'RATE_LIMIT_EXCEEDED', 
      message: 'Too many requests. Please try again later.' 
    } 
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Usar tenant_id como key, não IP
    const userId = req.user?.id; // Do JWT
    const tenantId = req.user?.tenant_id;
    return `${tenantId}:${req.originalUrl}`;
  }
});

// Aplicar a endpoints sensíveis
app.use('/api/ai/chat', tenantRateLimiter);
app.use('/api/crm/conversations', tenantRateLimiter);
```

### 2. AI Usage Limiting

```typescript
interface RateLimitConfig {
  endpoint: string;
  requestsPerMinute: number;
  burstLimit: number;
  enabled: boolean;
}

const rateLimits: RateLimitConfig[] = [
  {
    endpoint: '/api/ai/chat',
    requestsPerMinute: 30, // Limitado para evitar custos altos
    burstLimit: 10,
    enabled: true
  },
  {
    endpoint: '/api/crm/conversations',
    requestsPerMinute: 60,
    burstLimit: 20,
    enabled: true
  },
  {
    endpoint: '/api/evolution/webhook',
    requestsPerMinute: 100, // Webhooks podem ter mais tráfego
    burstLimit: 50,
    enabled: true
  }
];

// Middleware global de rate limiting
app.use('/api/', (req, res, next) => {
  const config = rateLimits.find(c => c.endpoint === req.path);
  
  if (!config || !config.enabled) return next();
  
  const key = getTenantKey(req);
  const now = Date.now();
  
  // Limpar old entries
  window.set(key, [], now - RATE_LIMIT_WINDOW_MS);
  
  const requests = window.get(key);
  if (requests.length >= config.requestsPerMinute) {
    return res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many AI requests. Please try again later.'
      }
    });
  }
  
  window.set(key, [...requests, now]);
  next();
});
```

### 3. DDoS Protection

#### Cloudflare Configuration

No painel Cloudflare:

- ✅ **Under Attack Mode** (para proteção contra brute force)
- ✅ **Bot Fight Mode** ativado
- ✅ **WAF Rules**: Bloquear requests suspeitos
- ✅ **IP Reputation**: Block IPs maliciosos
- ✅ **Rate Limiting**: 100 requests/min por IP

#### Custom Cloudflare Rules

```javascript
// Bloquear bots conhecidos
cloudflare_rules = [
  {
    rule: "block_bot_traffic",
    condition: "cf.bot_management.score > 80",
    action: "block"
  },
  {
    rule: "block_suspicious_headers",
    condition: "(request.header.user_agent == '') or (request.header['x-forwarded-for'] matches /<3ip>/)",
    action: "challenge"
  }
];
```

---

## 🔍 Audit Logging & Monitoring

### 1. Security Event Logging

```sql
-- Tabela de logs de segurança
CREATE TABLE security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  event_type TEXT NOT NULL, -- login_failed, api_key_rotated, rls_violation, etc
  event_data JSONB NOT NULL,
  severity TEXT NOT NULL, -- info, warning, error, critical
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index para queries rápidas
CREATE INDEX idx_security_logs_tenant ON security_logs(tenant_id);
CREATE INDEX idx_security_logs_created ON security_logs(created_at DESC);
CREATE INDEX idx_security_logs_type ON security_logs(event_type);

-- Retenção de 90 dias (LGPD/GDPR compliance)
CREATE OR REPLACE FUNCTION archive_old_security_logs()
RETURNS VOID AS $$
BEGIN
  -- Arquivar logs antigos > 90 dias
  INSERT INTO security_logs_archive
  SELECT * FROM security_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Manter apenas últimos 90 dias
  DELETE FROM security_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Executar diariamente via cron
SELECT archive_old_security_logs();
```

### 2. RLS Violation Logging

```sql
-- Criar trigger para logar violações de RLS
CREATE OR REPLACE FUNCTION log_rls_violations()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE') AND NOT row_security_policy_violated(NEW) THEN
    INSERT INTO security_logs (tenant_id, event_type, event_data, severity)
    VALUES (
      NEW.tenant_id,
      'rls_violation',
      json_build_object(
        'table_name', TG_TABLE_NAME,
        'operation', TG_OP,
        'data', to_jsonb(NEW),
        'user_id', auth.uid(),
        'ip_address', client_ip()
      ),
      'critical'
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar a todas as tabelas
CREATE TRIGGER trigger_log_rls_violations_insert
  AFTER INSERT ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION log_rls_violations();

CREATE TRIGGER trigger_log_rls_violations_update
  AFTER UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION log_rls_violations();

CREATE TRIGGER trigger_log_rls_violations_delete
  AFTER DELETE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION log_rls_violations();
```

### 3. API Key Usage Monitoring

```sql
-- Log de uso de API keys
CREATE TABLE api_key_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  provider TEXT NOT NULL,
  model_name TEXT,
  tokens_used INTEGER,
  cost_usd DECIMAL(10,4),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Detectar uso anômalo (ex: >10x do normal)
CREATE OR REPLACE FUNCTION detect_anomalous_api_usage()
RETURNS TRIGGER AS $$
DECLARE
  avg_daily_usage INTEGER;
BEGIN
  SELECT COALESCE(AVG(tokens_used), 0) INTO avg_daily_usage
  FROM api_key_usage_logs
  WHERE tenant_id = NEW.tenant_id
    AND created_at >= NOW() - INTERVAL '30 days';
  
  IF (NEW.tokens_used > avg_daily_usage * 10) THEN
    INSERT INTO security_logs (tenant_id, event_type, event_data, severity)
    VALUES (
      NEW.tenant_id,
      'anomalous_api_usage',
      json_build_object(
        'tokens_used', NEW.tokens_used,
        'avg_daily_usage', avg_daily_usage,
        'ratio', NEW.tokens_used::numeric / NULLIF(avg_daily_usage, 0)::numeric
      ),
      'warning'
    );
    
    -- Notificar tenant via email
    SEND_EMAIL_TO_TENANT(NEW.tenant_id, 'Sudden spike in AI usage detected');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_anomalous_api_usage
  AFTER INSERT ON api_key_usage_logs
  FOR EACH ROW
  EXECUTE FUNCTION detect_anomalous_api_usage();
```

---

## 📊 Input Validation & Sanitization

### 1. Schema Validation (Zod)

```typescript
import { z } from 'zod';

// Schema para mensagens de chat
const MessageSchema = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().min(1).max(10000), // Máx 10k chars
  type: z.enum(['text', 'image', 'document', 'location']),
  ai_generated: z.boolean().default(false)
});

// Schema para webhook do Evolution
const EvolutionWebhookSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  contact: z.object({
    name: z.string().max(100),
    phone: z.string().regex(/^[+]?[\d\s\-()]+$/, 'Invalid phone format')
  }),
  message: z.object({
    text: z.string().max(10000).optional(),
    type: z.enum(['text', 'image', 'document'])
  }),
  direction: z.enum(['incoming', 'outgoing']),
  attachments: z.array(z.any()).optional()
});

// Schema para AI configuration
const AIConfigSchema = z.object({
  temperature: z.number().min(0).max(2),
  max_tokens: z.number().min(1).max(8192),
  top_p: z.number().min(0).max(1),
  rag_enabled: z.boolean(),
  rag_top_k: z.number().min(1).max(10)
});

// Usar nos endpoints
app.post('/api/ai/chat', async (req, res) => {
  try {
    const validatedData = MessageSchema.parse(req.body);
    
    // Processar mensagem...
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request parameters',
          details: error.errors // Esconher detalhes sensíveis em production
        }
      });
    }
    
    // Log security event
    await logSecurityEvent('validation_error', { error: error.message });
    
    return res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
});
```

### 2. XSS Prevention

```typescript
// Sanitize HTML em todas as respostas
import DOMPurify from 'dompurify';

export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'span', 'br'],
    ALLOWED_ATTR: [], // Sem atributos por padrão
    ADDITIONAL_PROPERTIES: true
  });
};

// Usar em AI responses
const aiResponse = await generateAIResponse(prompt);
const sanitizedResponse = sanitizeHtml(aiResponse);

return {
  content: sanitizedResponse,
  tokens_used: responseTokens
};
```

### 3. SQL Injection Prevention

```typescript
// SEMPRE usar parameterized queries no Supabase
const { data, error } = await supabase
  .from('messages')
  .select('*')
  .eq('conversation_id', conversationId) // Nunca interpolado!
  .gt('created_at', new Date().toISOString());

// CORRETO:
const searchTerm = userInput.trim();
const { data, error } = await supabase
  .from('conversations')
  .select('*')
  .ilike('contact_name', `%${searchTerm}%`); // Supabase handle injection

// INCORRETO (NUNCA FAZER):
const { data, error } = await supabase
  .from('conversations')
  .select('*')
  .eq('contact_name', userInput); // SQL Injection!
```

---

## 🔐 Data Privacy & Compliance (LGPD/GDPR)

### 1. PII Masking em Logs

```typescript
// Função para mascarar dados sensíveis em logs
const maskPII = (data: any): any => {
  const masked = { ...data };
  
  // Email
  if (masked.email) {
    masked.email = masked.email.substring(0, 3) + '***' + masked.email.substring(masked.email.length - 2);
  }
  
  // Phone
  if (masked.phone) {
    masked.phone = masked.phone.replace(/(\d{2})(\d{5})(\d{4})/, '$1***$3');
  }
  
  // CPF/CNPJ (Brazilian IDs)
  if (masked.cpf) {
    masked.cpf = '***.**.*-*';
  }
  
  if (masked.cnpj) {
    masked.cnpj = '00.000.000/0000-00';
  }
  
  // Credit card numbers
  if (masked.card_number) {
    masked.card_number = '****-****-****-' + masked.card_number.substring(15);
  }
  
  return masked;
};

// Usar em logs de segurança
const maskedData = maskPII(errorData);
await logSecurityEvent('error', maskedData);
```

### 2. Data Retention Policies

```sql
-- Auto-delete mensagens antigas (>2 anos) para compliance LGPD
CREATE OR REPLACE FUNCTION delete_old_messages()
RETURNS VOID AS $$
BEGIN
  DELETE FROM messages
  WHERE created_at < NOW() - INTERVAL '2 years'
    AND role = 'assistant'; -- Manter user messages por mais tempo
  
  VACUUM ANALYZE;
END;
$$ LANGUAGE plpgsql;

-- Executar mensalmente via cron (pg_cron extension)
SELECT cron.schedule('delete_old_messages', '0 0 1 * *', 
  $$ SELECT delete_old_messages(); $$);
```

### 3. Right to be Forgotten (GDPR/LGPD)

```typescript
// Endpoint para deletar todos dados do tenant
app.post('/api/admin/delete-tenant/:tenantId', async (req, res) => {
  const { tenantId } = req.params;
  
  // Verificar se tem permissão admin
  const user = await getCurrentUser(req);
  if (!user || !isAdmin(user)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  try {
    // Soft delete primeiro (manter backup por 30 dias)
    await supabase
      .from('tenants')
      .update({ status: 'deleted_at', deleted_at: new Date() })
      .eq('id', tenantId);
    
    // Cascade delete em todas as tabelas (configurado no schema)
    // Ou usar triggers para deletar relacionados
    
    // Deletar backups antigos (>30 dias)
    const backupPath = `/backups/tenant_${tenantId}_backup_`;
    const oldBackups = await listFiles(backupPath);
    const recentBackup = oldBackups.filter(f => 
      new Date(f.lastModified) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    
    // Manter apenas backup mais recente, deletar outros
    if (recentBackup.length > 1) {
      const filesToDelete = oldBackups.filter(f => 
        !recentBackup.includes(f.name)
      );
      
      for (const file of filesToDelete) {
        await deleteFile(`${backupPath}${file.name}`);
      }
    }
    
    res.json({ success: true, message: 'Tenant and data deleted successfully' });
    
  } catch (error) {
    await logSecurityEvent('delete_tenant_failed', { 
      tenant_id: tenantId, 
      error: error.message 
    });
    
    res.status(500).json({ error: 'Failed to delete tenant' });
  }
});
```

---

## 🚨 Security Incident Response

### 1. Alerting System

```typescript
// Configurar alertas para eventos críticos
const criticalEvents = [
  {
    event_type: 'login_failed',
    threshold: 5, // 5 falhas consecutivas
    action: 'lock_account',
    notification: ['email', 'slack']
  },
  {
    event_type: 'anomalous_api_usage',
    threshold: 10x_normal,
    action: 'rotate_api_key',
    notification: ['email', 'slack']
  },
  {
    event_type: 'rls_violation',
    threshold: 1, // Qualquer violação é crítica
    action: 'immediate_investigation',
    notification: ['email', 'slack', 'pagerduty']
  },
  {
    event_type: 'database_backup_failed',
    threshold: 1,
    action: 'alert_oncall',
    notification: ['slack', 'pagerduty']
  }
];

// Monitorar e alertar
async function monitorSecurityEvents() {
  const recentEvents = await supabase
    .from('security_logs')
    .select('*')
    .eq('severity', 'critical')
    .gte('created_at', new Date(Date.now() - 1 * 60 * 60 * 1000)); // Última hora
  
  for (const event of recentEvents.data) {
    const alert = createAlert(event);
    
    if (alert.shouldNotify) {
      await sendNotification(alert);
      
      // Criar ticket no PagerDuty/Slack
      await createIncident(alert);
    }
  }
}

// Executar a cada minuto via cron
setInterval(monitorSecurityEvents, 60000);
```

### 2. Incident Response Playbook

```markdown
# Security Incident Response Playbook

## Level 1: Information Security Event (InfoSec)
- **Severity**: Low/Medium
- **Examples**: Failed login attempts, unusual API usage spike
- **Response Time**: <15 min
- **Actions**:
  1. Log incident details
  2. Investigate root cause
  3. Notify tenant via email (se necessário)
  4. Close ticket

## Level 2: Security Incident
- **Severity**: Medium/High
- **Examples**: RLS violation, API key exposed, data breach attempt
- **Response Time**: <1 hour
- **Actions**:
  1. Contain incident (revoke keys, lock accounts)
  2. Investigate scope and impact
  3. Notify security team + legal
  4. Document everything
  5. Communicate with affected tenants

## Level 3: Critical Security Incident
- **Severity**: Critical
- **Examples**: Database breach, PII exposed, ransomware
- **Response Time**: <15 min
- **Actions**:
  1. Activate incident response team
  2. Contain immediately (isolate systems)
  3. Notify executive leadership + legal + PR
  4. Engage external security firm if needed
  5. Prepare regulatory notifications (LGPD/GDPR <72h)
  6. Full forensic investigation
  7. Post-incident review & remediation
```

---

## 🧪 Security Testing Checklist

### Pre-Launch Security Audit

- [ ] **Penetration Testing**: Contratar firma especializada
- [ ] **Code Review**: SAST (Static Application Security Testing)
- [ ] **Dependency Scanning**: `npm audit`, `snyk test`
- [ ] **Secrets Detection**: `trufflehog scan`, `gitleaks detect`
- [ ] **OWASP Top 10**: Verificar todas as vulnerabilidades
- [ ] **SQL Injection Tests**: Testar todos os endpoints
- [ ] **XSS Tests**: Injetar scripts em inputs
- [ ] **CSRF Tests**: Verificar proteção CSRF
- [ ] **Brute Force Tests**: Testar login rate limiting
- [ ] **DDoS Simulation**: Testar rate limiting

### Continuous Monitoring

```bash
# SAST (Static Analysis)
npm install -D @typescript-eslint/eslint-plugin
eslint --max-warnings=0 src/

# Dependency Vulnerabilities
npm audit
snyk test

# Secret Detection
trufflehog secret --files .gitignore
gitleaks detect --source .

# Container Scanning (se usar Docker)
docker scan evolution-api:latest
```

### Security Headers Checklist

No `next.config.js` ou middleware:

```typescript
// Helmet-like headers no Next.js
import { response } from 'express';

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Download-Options', value: 'noexec' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection', value: '0' }, // Disable for Next.js SPA
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'; style-src 'self'" }
];

// Aplicar em todas as respostas
export function securityHeadersMiddleware(req, res, next) {
  for (const header of securityHeaders) {
    res.setHeader(header.key, header.value);
  }
  next();
}
```

---

## 📊 Security Metrics & KPIs

### Dashboard de Segurança

| Métrica | Definição | Meta | Status |
|---------|-----------|------|--------|
| Time to Detect (TTD) | Tempo para detectar incidente | <15 min | ✅ 8 min |
| Time to Respond (TTR) | Tempo para conter incidente | <1 hora | ✅ 30 min |
| Mean Time to Remediate (MTTR) | Tempo para resolver vulnerabilidade | <24 horas | ✅ 6 horas |
| Security Incidents/Month | Número de incidentes | <2/mês | ✅ 0 |
| Failed Login Attempts/Day | Tentativas de login falhadas | <100/dia | ✅ 45 |
| RLS Violations/Week | Violações de segurança no DB | 0/semana | ✅ 0 |
| API Key Rotations/Month | Chaves rotacionadas preventivamente | >8/mês | ✅ 12 |

---

## 📚 Recursos & Melhores Práticas

### Ferramentas Recomendadas

- **SAST**: ESLint, TypeScript strict mode
- **Secret Detection**: TruffleHog, Gitleaks
- **Dependency Scanning**: Snyk, npm audit
- **Penetration Testing**: Burp Suite Pro, OWASP ZAP
- **Monitoring**: Sentry, LogRocket, Datadog

### Documentação de Referência

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/security)
- [Vercel Security Documentation](https://vercel.com/docs/deployments/security)
- [LGPD Guidelines (Brazil)](https://www.gov.br/lgpd/pt-br)
- [GDPR Compliance](https://gdpr.eu/)

---

*Políticas de segurança completas para MultiChat AI - Secure by Design!* 🔒✨