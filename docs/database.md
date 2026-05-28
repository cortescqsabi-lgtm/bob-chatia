# 🗄️ DATABASE - Supabase Schema & RLS Policies

## Visão Geral

Este documento descreve o esquema completo do banco de dados do MultiChat AI, implementado no Supabase PostgreSQL. Inclui todas as tabelas, índices, funções, triggers e Row Level Security (RLS) policies para garantir isolamento multi-tenant seguro.

---

## 📊 Core Schema

### Tenants Table (Root Tenant Isolation)

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  name TEXT NOT NULL,
  legal_name TEXT,
  domain_name TEXT UNIQUE, -- Para branding customizado
  
  -- Plan & Billing
  plan TEXT NOT NULL DEFAULT 'free', 
    -- free, starter, professional, enterprise
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  monthly_limit INTEGER NOT NULL DEFAULT 100,
  overage_rate DECIMAL(10,2) DEFAULT 0.00,
  
  -- AI Configuration (Encrypted values in settings table)
  llm_provider TEXT DEFAULT 'openai',
  llm_model_name TEXT DEFAULT 'gpt-3.5-turbo',
  
  -- Integrations
  evolution_webhook_url TEXT,
  meta_access_token_encrypted TEXT,
  
  -- Settings & Preferences
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  currency TEXT DEFAULT 'BRL',
  language TEXT DEFAULT 'pt-BR',
  
  -- Status
  status TEXT DEFAULT 'active', -- active, suspended, cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_plan ON tenants(plan);
CREATE INDEX idx_tenants_stripe_customer ON tenants(stripe_customer_id);

-- Triggers
CREATE OR REPLACE FUNCTION update_tenants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_tenants_updated_at();
```

### Users Table (Extends Supabase Auth)

```sql
-- Extende auth.users com dados adicionais
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  
  -- Profile Info
  tenant_id UUID REFERENCES tenants(id),
  full_name TEXT,
  email TEXT NOT NULL,
  avatar_url TEXT,
  
  -- Role & Permissions
  role TEXT DEFAULT 'member', -- admin, member, viewer
  permissions JSONB DEFAULT '{"can_manage_billing": false, "can_manage_team": false}',
  
  -- Metadata
  last_login_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- RLS Policy
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Usuários podem ler seus próprios dados
CREATE POLICY "Users can view own profile" 
  ON users FOR SELECT USING (auth.uid() = id);

-- Admins do tenant podem ver todos os usuários
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
      AND u.tenant_id = (SELECT id FROM tenants WHERE id IN (
        SELECT tenant_id FROM users WHERE id = auth.uid()
      ))
    )
  );

-- Insert function para onboarding
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, full_name, avatar_url, tenant_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
    -- Atribuir ao primeiro tenant ou deixar vazio para onboarding
    NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

### Conversations Table (WhatsApp/IG/FB)

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant & Channel Info
  tenant_id UUID REFERENCES tenants(id),
  channel_type TEXT NOT NULL, 
    -- whatsapp, instagram, facebook
  channel_identifier TEXT NOT NULL, -- Phone number, IG username, Page ID
  
  -- Contact Info
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  avatar_url TEXT,
  
  -- Conversation Status
  last_message_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active', -- active, archived, blocked
  is_pinned BOOLEAN DEFAULT FALSE,
  
  -- AI Context
  ai_summary TEXT,
  ai_sentiment TEXT, -- positive, neutral, negative
  ai_priority TEXT, -- low, medium, high, urgent
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes (CRITICAL for performance)
CREATE INDEX idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX idx_conversations_channel ON conversations(channel_type, channel_identifier);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX idx_conversations_status ON conversations(status);

-- RLS Policy - Only tenant members can view their tenant's conversations
CREATE POLICY "Tenant members can view conversations"
  ON conversations FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE tenant_id = conversations.tenant_id)
  );

-- Insert trigger for AI processing
CREATE OR REPLACE FUNCTION process_new_conversation()
RETURNS TRIGGER AS $$
BEGIN
  -- Trigger para processar nova conversa com AI
  INSERT INTO ai_processing_queue (conversation_id, status)
  VALUES (NEW.id, 'pending');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_conversation_created
  AFTER INSERT ON conversations
  FOR EACH ROW
  WHEN (NEW.tenant_id IS NOT NULL)
  EXECUTE FUNCTION process_new_conversation();
```

### Messages Table (Chat History)

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  conversation_id UUID REFERENCES conversations(id),
  tenant_id UUID REFERENCES tenants(id),
  
  -- Message Content
  role TEXT NOT NULL, -- user, assistant, system
  content TEXT NOT NULL,
  
  -- Message Type & Media
  type TEXT DEFAULT 'text', -- text, image, document, location, sticker
  media_url TEXT,
  caption TEXT,
  
  -- Status Tracking
  status TEXT DEFAULT 'sent', -- sent, delivered, read, failed
  direction TEXT NOT NULL, -- incoming, outgoing
  
  -- AI Processing
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_tokens_used INTEGER,
  ai_response_time_ms INTEGER,
  ai_context_chunks JSONB, -- Chunks do RAG usados
  
  -- Thread Management
  thread_id TEXT,
  parent_message_id UUID REFERENCES messages(id),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes (VERY IMPORTANT for chat UI performance)
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_tenant_created ON messages(tenant_id, created_at DESC);
CREATE INDEX idx_messages_role_created ON messages(role, created_at);
CREATE INDEX idx_messages_status ON messages(status);

-- RLS Policy
CREATE POLICY "Tenant members can view messages"
  ON messages FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE tenant_id = messages.tenant_id)
  );

-- Partitioning para mensagens antigas (arquitetura avançada)
-- Cria partitions mensais automaticamente
CREATE OR REPLACE FUNCTION create_message_partitions()
RETURNS VOID AS $$
DECLARE
  current_month DATE;
  month_name TEXT;
BEGIN
  SELECT TO_CHAR(NOW(), 'YYYY-MM') INTO current_month;
  month_name := TO_CHAR(current_month, 'Mon');
  
  -- Cria partition para mês atual
  EXECUTE format(
    'CREATE TABLE messages_20%I_%I (LIKE messages INCLUDING DEFAULTS) 
     PARTITION OF messages (created_at) 
     FOR VALUES FROM (''' || current_month || ''') TO (''' || 
     TO_DATE(current_month::text || '-01', 'YYYY-MM-DD') + INTERVAL '1 month'::interval)::text || ''')',
    EXTRACT(YEAR FROM current_month),
    month_name
  );
END;
$$ LANGUAGE plpgsql;
```

### Tickets Table (Customer Support)

```sql
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  tenant_id UUID REFERENCES tenants(id),
  conversation_id UUID REFERENCES conversations(id),
  
  -- Ticket Info
  subject TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium', -- low, medium, high, urgent
  
  -- Status Tracking
  status TEXT DEFAULT 'open', -- open, in_progress, resolved, closed
  assigned_to UUID REFERENCES users(id),
  
  -- SLA Metrics
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  first_response_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  sla_deadline TIMESTAMP WITH TIME ZONE,
  
  -- Labels & Metadata
  labels TEXT[], -- Array de tags: ['billing', 'technical', 'urgent']
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tickets_tenant ON tickets(tenant_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_conversation ON tickets(conversation_id);

-- RLS Policy
CREATE POLICY "Tenant members can view tickets"
  ON tickets FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE tenant_id = tickets.tenant_id)
  );

-- Triggers for status changes
CREATE OR REPLACE FUNCTION update_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_updated_at();
```

### Products & Pricing Tables

```sql
-- Produtos catalogados
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant References
  tenant_id UUID REFERENCES tenants(id),
  
  -- Product Info
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  
  -- Pricing
  base_price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2),
  margin_percent DECIMAL(5,2),
  
  -- Inventory
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);

-- Knowledge base files (.MD templates)
CREATE TABLE knowledge_base_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant References
  tenant_id UUID REFERENCES tenants(id),
  
  -- File Info
  file_name TEXT NOT NULL, -- instrucoes.md, produtos.md, precos.md, automacoes.md
  file_path TEXT NOT NULL,
  content_hash TEXT, -- Para versioning
  
  -- RAG Configuration
  embedding_vector VECTOR(1536), -- OpenAI embedding dimension
  chunk_size INTEGER DEFAULT 500,
  chunk_overlap INTEGER DEFAULT 100,
  
  -- Metadata
  is_default BOOLEAN DEFAULT FALSE,
  priority INTEGER DEFAULT 1,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_kb_files_tenant ON knowledge_base_files(tenant_id);
CREATE INDEX idx_kb_files_name ON knowledge_base_files(file_name);

-- RLS Policy
CREATE POLICY "Tenant members can view KB files"
  ON knowledge_base_files FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE tenant_id = knowledge_base_files.tenant_id)
  );
```

### AI Usage & Billing

```sql
-- AI usage logs para billing
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  tenant_id UUID REFERENCES tenants(id),
  conversation_id UUID REFERENCES conversations(id),
  
  -- Usage Metrics
  provider TEXT NOT NULL, -- openai, anthropic, groq, ollama
  model_name TEXT NOT NULL,
  tokens_input INTEGER,
  tokens_output INTEGER,
  total_tokens INTEGER,
  
  -- Cost Tracking
  cost_usd DECIMAL(10,4),
  cost_brl DECIMAL(12,2),
  
  -- Performance
  response_time_ms INTEGER,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes (CRITICAL for billing reports)
CREATE INDEX idx_ai_usage_tenant ON ai_usage_logs(tenant_id);
CREATE INDEX idx_ai_usage_tenant_date ON ai_usage_logs(tenant_id, created_at DESC);
CREATE INDEX idx_ai_usage_conversation ON ai_usage_logs(conversation_id);

-- Usage counters (aggregated daily)
CREATE TABLE usage_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  tenant_id UUID REFERENCES tenants(id),
  
  -- Counter Info
  counter_type TEXT NOT NULL, -- messages, api_calls, storage_gb
  
  -- Values
  current_value INTEGER DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_usage_counters_tenant ON usage_counters(tenant_id);
CREATE INDEX idx_usage_counters_type_date ON usage_counters(counter_type, period_start DESC);

-- RLS Policy
CREATE POLICY "Tenant members can view usage"
  ON ai_usage_logs FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE tenant_id = ai_usage_logs.tenant_id)
  );
```

### Automations Table

```sql
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  tenant_id UUID REFERENCES tenants(id),
  
  -- Workflow Definition
  name TEXT NOT NULL,
  description TEXT,
  
  -- Trigger Configuration
  trigger_type TEXT NOT NULL, -- message_received, time_based, keyword, user_action
  conditions JSONB NOT NULL, -- JSON com condições
  
  -- Actions
  actions JSONB NOT NULL, -- JSON com ações
  
  -- Schedule (for time-based triggers)
  schedule_interval TEXT, -- Cron expression: "0 9 * * 1-5"
  
  -- Status
  status TEXT DEFAULT 'draft', -- draft, active, paused, deleted
  enabled BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow executions tracking
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  workflow_id UUID REFERENCES workflows(id),
  tenant_id UUID REFERENCES tenants(id),
  
  -- Execution Info
  trigger_event TEXT NOT NULL,
  trigger_data JSONB,
  status TEXT DEFAULT 'pending', -- pending, running, completed, failed
  
  -- Results
  result_data JSONB,
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_workflows_tenant ON workflows(tenant_id);
CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_workflows_executions_workflow ON workflow_executions(workflow_id);

-- RLS Policy
CREATE POLICY "Tenant members can view workflows"
  ON workflows FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE tenant_id = workflows.tenant_id)
  );
```

---

## 🔒 Row Level Security (RLS) Policies Summary

### Multi-Tenancy Isolation

Todos as tabelas seguem este padrão:

```sql
-- Padrão para todas as tabelas de dados
CREATE POLICY "Tenant members can view data"
  ON [table_name] FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE tenant_id = [table_name].tenant_id)
  );

CREATE POLICY "Tenant members can insert data"
  ON [table_name] FOR INSERT 
  WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE tenant_id = [table_name].tenant_id)
  );

CREATE POLICY "Tenant members can update own data"
  ON [table_name] FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM users WHERE tenant_id = [table_name].tenant_id)
  );

CREATE POLICY "Tenant members can delete own data"
  ON [table_name] FOR DELETE USING (
    auth.uid() IN (SELECT id FROM users WHERE tenant_id = [table_name].tenant_id)
  );
```

### Admin Privileges

Admins do tenant têm acesso completo:

```sql
CREATE POLICY "Admins have full access"
  ON [table_name] FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.tenant_id = (SELECT id FROM tenants WHERE id IN (
        SELECT tenant_id FROM users WHERE id = auth.uid()
      ))
      AND u.role = 'admin'
    )
  );
```

---

## 📈 Performance Optimization

### Critical Indexes

```sql
-- Conversations (chat UI performance)
CREATE INDEX idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

-- Messages (most important - chat history)
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_tenant_created ON messages(tenant_id, created_at DESC);
CREATE INDEX idx_messages_role_created ON messages(role, created_at);

-- Usage for billing reports
CREATE INDEX idx_ai_usage_tenant_date ON ai_usage_logs(tenant_id, created_at DESC);

-- Tickets (support dashboard)
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
```

### Materialized Views para Analytics

```sql
-- Daily conversation stats
CREATE MATERIALIZED VIEW mv_daily_conversation_stats AS
SELECT 
  date_trunc('day', c.last_message_at) as stat_date,
  c.tenant_id,
  COUNT(*) as message_count,
  COUNT(CASE WHEN m.role = 'assistant' THEN 1 END) as ai_responses,
  AVG(EXTRACT(EPOCH FROM (m.created_at - c.last_message_at))::numeric) as avg_response_time_ms
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id AND m.role = 'assistant'
GROUP BY date_trunc('day', c.last_message_at), c.tenant_id;

CREATE INDEX ON mv_daily_conversation_stats(tenant_id, stat_date DESC);

-- Refresh daily at midnight
CREATE OR REPLACE FUNCTION refresh_daily_stats()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_conversation_stats;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔄 Migration Scripts

### Add New Column Safely

```sql
-- Adiciona coluna sem bloquear tabelas
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS ai_sentiment TEXT;

-- Index após adicionar coluna
CREATE INDEX IF NOT EXISTS idx_conversations_ai_sentiment 
ON conversations(tenant_id, ai_sentiment);
```

### Data Migration Example

```sql
-- Mover dados antigos para tabela archive
CREATE TABLE conversations_archive_2024_01 LIKE conversations;

INSERT INTO conversations_archive_2024_01
SELECT * FROM conversations 
WHERE created_at < '2024-02-01';

-- Atualizar timestamp
UPDATE conversations_archive_2024_01 
SET archived_at = NOW();
```

---

## 🧪 Testing Queries

### Tenant Usage Report

```sql
SELECT 
  t.id,
  t.name as tenant_name,
  t.plan,
  SUM(CASE WHEN m.role = 'user' THEN 1 ELSE 0 END) as total_messages,
  SUM(CASE WHEN m.role = 'assistant' THEN 1 ELSE 0 END) as ai_responses,
  COUNT(DISTINCT c.id) as active_conversations
FROM tenants t
LEFT JOIN conversations c ON c.tenant_id = t.id
LEFT JOIN messages m ON m.conversation_id = c.id
WHERE t.status = 'active'
GROUP BY t.id, t.name, t.plan
ORDER BY total_messages DESC;
```

### AI Cost Analysis

```sql
SELECT 
  t.id,
  t.name as tenant_name,
  aul.provider,
  aul.model_name,
  SUM(aul.tokens_input) as total_input_tokens,
  SUM(aul.tokens_output) as total_output_tokens,
  SUM(aul.cost_usd) as total_cost_usd
FROM ai_usage_logs aul
JOIN tenants t ON aul.tenant_id = t.id
WHERE aul.success = TRUE
GROUP BY t.id, t.name, aul.provider, aul.model_name
ORDER BY total_cost_usd DESC;
```

---

*Supabase Schema completo para MultiChat AI - Multitenant CRM com IA!* 🗄️✨