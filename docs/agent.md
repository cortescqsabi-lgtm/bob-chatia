# 🤖 Super Agente IA - Configuração Completa

## Visão Geral

O **Super Agente IA** é o coração do MultiChat AI. Cada cliente treina seu próprio agente usando arquivos `.MD` personalizados que definem: instruções de atendimento, base de conhecimento de produtos, regras de preços e automações avançadas.

---

## 🎯 Arquitetura do Agente

```
┌─────────────────────────────────────────────────────────┐
│              Super Agente IA Architecture                │
│                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────┐  │
│  │   User Msg   │ →  │   RAG Engine │ →  │  LLM     │  │
│  └──────────────┘    └──────────────┘    └──────────┘  │
│                     (Busca em .MD do cliente)           │
│                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────┐  │
│  │  Context DB  │ ←─ │   Vector DB  │ ←─ │  Embed   │  │
│  └──────────────┘    └──────────────┘    └──────────┘  │
│                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────┐  │
│  │  History     │ ←─ │   Memory     │ ←─ │  Tools   │  │
│  └──────────────┘    └──────────────┘    └──────────┘  │
│                                                         │
│  Response → Evolution API / Meta Graph API              │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Estrutura de Arquivos .MD para Clientes

Cada cliente deve criar/pastar estes arquivos na pasta `knowledge/` de seu tenant:

### 1. **instrucoes.md** ⭐ CRÍTICO

```markdown
# Instruções de Atendimento - [Nome da Empresa]

## 🎭 Persona e Tom de Voz

Você é o atendente virtual da **[Nome da Empresa]**. Sua personalidade:

- **Tom**: Profissional, amigável, empático
- **Tom de voz**: Calmo, prestativo, humano
- **Personalidade**: Especialista em [área de atuação]

## 📝 Regras de Atendimento

### Prioridades
1. Sempre identifique-se como atendente da [Nome da Empresa]
2. Responda em português (pt-BR) a menos que o cliente use outro idioma
3. Mantenha respostas concisas (máx 3 parágrafos)
4. Use emojis moderadamente para humanizar
5. Nunca invente informações - se não souber, peça para falar com um humano

### Fluxo de Atendimento Padrão

1. **Saudação inicial**
   - Cumprimente o cliente
   - Apresente-se brevemente
   - Pergunte como posso ajudar

2. **Identificação do problema**
   - Faça perguntas claras e diretas
   - Use linguagem simples
   - Evite jargões técnicos

3. **Resolução**
   - Forneça solução passo a passo
   - Inclua exemplos práticos
   - Verifique se o cliente entendeu

4. **Encerramento**
   - Pergunte se precisa de mais ajuda
   - Ofereça canais alternativos
   - Deseje bom dia/tarde/noite

### Restrições Importantes

- ❌ Nunca peça dados sensíveis (CPF, senha, cartão)
- ❌ Não faça promessas que não podem ser cumpridas
- ❌ Não recomende produtos fora do catálogo aprovado
- ✅ Sempre valide informações críticas com humano
- ✅ Mantenha tom positivo mesmo em situações negativas

### Tratamento de Erros

Se o cliente estiver irritado:
1. Reconheça a frustração
2. Pedir desculpas genuínas
3. Ofereça solução imediata
4. Escala para humano se necessário

Exemplo:
"Entendo sua frustração, [Nome]. Peço desculpas pelo inconveniente. 
Vou resolver isso agora mesmo ou posso conectar você com um de nossos especialistas?"

---

## 🎓 Base de Conhecimento Específica

### Regras de Negócio

[Inserir regras específicas da empresa]

Exemplo:
- "Sempre confirme endereço antes de enviar"
- "Prazo para devolução: 30 dias"
- "Frete grátis acima de R$199,00"

### Jargões Internos

Evite usar termos técnicos sem explicação.
Substitua por linguagem coloquial quando possível.

---

## 🚫 O que NÃO fazer (Critical Rules)

NEVER:
- Inventar preços ou promoções
- Prometer prazos não confirmados
- Revelar informações de outros clientes
- Usar gírias muito informais
- Ignorar mensagens de emergência

ALWAYS:
- Validar informações com banco de dados
- Manter profissionalismo
- Priorizar segurança do cliente
- Documentar conversas importantes
```

### 2. **produtos.md**

```markdown
# Catálogo de Produtos - [Nome da Empresa]

## 📦 Produtos Disponíveis

### Categoria: [Nome da Categoria]

| Produto | Preço | SKU | Estoque | Descrição |
|---------|-------|-----|---------|-----------|
| Produto 1 | R$99,90 | PROD-001 | 50 | Breve descrição... |
| Produto 2 | R$149,90 | PROD-002 | 30 | Breve descrição... |

### Detalhes do Produto: [Nome]

**Preço**: R$XX,XX  
**SKU**: XXX-XXX  
**Estoque**: XX unidades  
**Categoria**: [Categoria]  

**Descrição Completa**:
[Descrição detalhada do produto com benefícios e características]

**Especificações Técnicas**:
- Dimensões: XX x XX x XX cm
- Peso: XX kg
- Material: [Material]
- Garantia: [X] meses/anos

**Indicações de Uso**:
- Público-alvo
- Cenários de uso
- Compatibilidade

**Diferenciais**:
1. [Diferencial 1]
2. [Diferencial 2]
3. [Diferencial 3]

### Promoções Ativas

| Produto | Oferta | Validade | Código |
|---------|--------|----------|--------|
| PROD-XXX | -20% | DD/MM/AAAA | PROMO1 |

---

## 🔍 Regras de Recomendação

### Quando Recomendar Produto X

- Cliente menciona [palavra-chave]
- Necessidade: [necessidade específica]
- Orçamento indicado: R$XX-XXX

### Cross-selling Oportunities

Se cliente comprou [produto A], sugerir também:
- [produto B] (complementar)
- [produto C] (upgrade)

### Up-selling Oportunidades

Se cliente demonstra interesse em [categoria], apresentar:
- Opção premium com benefícios extras
- Kit completo com desconto

---

## 📊 Produtos por Segmento

### Segmento Premium
[Lista de produtos premium]

### Segmento Econômico
[Lista de produtos econômicos]

### Segmento Best-Seller
[Lista de produtos mais vendidos]

---

## ⚠️ Produtos Restritos/Exclusivos

**Acesso Restrito**: [Produtos que requerem autorização]

**Exclusivo Online**: [Produtos disponíveis apenas online]

**Preço Confidencial**: [Produtos com preços sob demanda]
```

### 3. **precos.md** ⭐ CRÍTICO

```markdown
# Regras de Preços e Descontos - [Nome da Empresa]

## 💰 Tabela de Preços Oficial

| Produto | Preço Original | Preço Promocional | Margem Mínima |
|---------|---------------|-------------------|---------------|
| PROD-001 | R$99,90 | R$89,90 | 30% |
| PROD-002 | R$149,90 | R$139,90 | 25% |
| PROD-003 | R$199,90 | R$179,90 | 20% |

## 🎯 Regras de Desconto

### Por Nível do Cliente

| Nível | Desconto Máximo | Requisitos |
|-------|-----------------|------------|
| Bronze | 0% | Novo cliente |
| Prata | 5% | 3+ compras |
| Ouro | 10% | 10+ compras ou R$500 gasto |
| Platina | 15% | R$2.000+ gasto ou parceiro estratégico |

### Por Campanha

| Código | Desconto | Validade | Produtos Incluídos |
|--------|----------|----------|-------------------|
| BLACKFRIDAY | -30% | DD/MM/AAAA | Todos exceto premium |
| LANÇAMENTO | -20% | DD/MM/AAAA | Novos produtos |
| FEEDBACK | -10% | Indefinido | Pesquisa enviada + compra |

### Por Volume

| Quantidade | Desconto Extra |
|------------|----------------|
| 3+ unidades | -5% adicional |
| 6+ unidades | -10% adicional |
| 12+ unidades | -15% adicional |
| 24+ unidades | -20% adicional |

## 🚫 Regras de Preço (Critical)

### O QUE NUNCA FAZER

❌ Nunca dar desconto acima do máximo permitido por nível
❌ Nunca revelar margens ou custos internos
❌ Nunca negociar preços com clientes comuns
❌ Nunca aplicar descontos em produtos restritos sem autorização
❌ Nunca prometer frete grátis sem verificar elegibilidade

### O QUE SEMPRE FAZER

✅ Sempre consultar tabela oficial antes de responder
✅ Sempre confirmar nível do cliente no histórico
✅ Sempre validar período promocional ativo
✅ Sempre documentar justificativa de desconto
✅ Sempre sugerir produtos alternativos se preço não for viável

## 📋 Fluxo de Validação de Preço

```
1. Cliente solicita produto X
2. Verificar preço atual em PRODUTOS.md
3. Consultar nível do cliente no histórico
4. Verificar campanhas ativas
5. Calcular desconto máximo permitido
6. Verificar margem mínima (deve ser ≥ 20%)
7. Responder com preço final validado
```

## 🎁 Programas de Fidelidade

### Pontos por Compra

- R$1,00 = 1 ponto
- 100 pontos = R$5,00 de desconto
- Válido por 12 meses

### Dias de Aniversário

- Desconto especial: 20% em qualquer produto
- Válido apenas no mês do aniversário

### Cashback

- 3% cashback em compras acima de R$500/mês
- Acumulado e resgatável a qualquer momento

---

## ⚖️ Políticas Comerciais

### Devolução e Troca

- Prazo: 30 dias para devolução, 90 dias para troca
- Condição: Produto sem uso, tags intactas
- Frete: Por conta do cliente (exceto defeito de fabricação)

### Garantia

- Produtos eletrônicos: 12 meses
- Produtos de vestuário: 3 meses
- Defeito de fabricação: Substituição imediata

### Prazos de Entrega

| Modalidade | Prazo | Frete |
|------------|-------|-------|
| Sedex | 3-5 dias úteis | Grátis > R$199 |
| Correios Padrão | 7-10 dias úteis | R$15,90 |
| Retirada na Loja | Imediato | Grátis |

---

## 📞 Escala para Humano

Solicitar atendimento humano quando:
- Cliente questionar preço múltiplas vezes
- Situções de emergência ou reclamação séria
- Pedido fora das regras estabelecidas
- Clientes VIP/Platinum com solicitações especiais

Exemplo de resposta:
"Entendo sua preocupação, [Nome]. Como este é um caso especial, vou conectar você diretamente com nosso especialista em [área] que vai resolver tudo agora mesmo. Posso fazer isso?"
```

### 4. **automacoes.md** ⭐ AVANÇADO

```markdown
# Automações Avançadas - MultiChat AI

## 🤖 Sistema de Automação Inteligente

### Fluxos Automatizados Disponíveis

#### 1. Boas-Vindas Automático

**Gatilho**: Primeiro contato com o cliente  
**Ação**: Enviar mensagem de boas-vindas personalizada

```yaml
trigger:
  event: new_contact
  conditions:
    - client_tier: any
    - conversation_count: 0

action:
  type: message
  template: welcome_v1
  delay: immediate
  content: |
    Olá, {nome_cliente}! 👋 Bem-vindo à [Nome da Empresa]!
    
    Sou seu assistente virtual e estou aqui para ajudar com:
    ✅ Dúvidas sobre nossos produtos
    ✅ Orçamentos personalizados
    ✅ Informações sobre promoções
    ✅ Suporte pós-compra
    
    Como posso te ajudar hoje?
```

#### 2. Follow-up Abandono de Carrinho

**Gatilho**: Cliente visualiza produto mas não compra  
**Ação**: Enviar mensagem após X horas

```yaml
trigger:
  event: cart_abandonment
  conditions:
    - time_since_view: >30min
    - product_category: any
    
action:
  type: message
  template: cart_recovery_v1
  delay: 2h
  content: |
    Olá, {nome_cliente}! 👋
    
    Percebi que você estava interessado em {produto}.
    
    Quer saber mais detalhes ou precisa de ajuda para finalizar sua compra?
    Estou aqui para te ajudar! 💬
```

#### 3. Abandonamento de Checkout

**Gatilho**: Cliente inicia checkout mas não completa  
**Ação**: Enviar mensagem com incentivo

```yaml
trigger:
  event: checkout_abandonment
  conditions:
    - time_since_start: >5min
    - cart_value: >100
    
action:
  type: message
  template: checkout_help_v1
  delay: 1h
  content: |
    Olá, {nome_cliente}! 👋
    
    Vi que você estava finalizando sua compra. Precisa de alguma ajuda?
    
    Posso te ajudar com:
    📦 Informações sobre frete
    💳 Opções de pagamento
    🎁 Cupons de desconto disponíveis
    
    Como posso te ajudar agora?
```

#### 4. Reconquista Inativo

**Gatilho**: Cliente não interage há X dias  
**Ação**: Enviar mensagem de reconexão

```yaml
trigger:
  event: customer_inactive
  conditions:
    - last_interaction_days: >30
    - customer_tier: [prata, ouro, platina]
    
action:
  type: message
  template: reengagement_v1
  delay: immediate
  content: |
    Olá, {nome_cliente}! 👋
    
    Faz um tempo que não conversamos! 
    Temos novidades incríveis para você:
    
    🎉 Novos produtos lançados
    📦 Promoções exclusivas
    ⭐ Ofertas relâmpago
    
    Quer ver o que temos de novo?
```

#### 5. Pós-Venda / Solicitação Avaliações

**Gatilho**: Cliente confirma recebimento  
**Ação**: Solicitar avaliação após X dias

```yaml
trigger:
  event: order_delivered
  conditions:
    - days_since_delivery: >3
    
action:
  type: message
  template: review_request_v1
  delay: immediate
  content: |
    Olá, {nome_cliente}! 📦
    
    Espero que seu pedido tenha chegado tudo certo!
    
    Se estiver satisfeito com sua compra, 
    poderíamos pedir uma avaliação?
    
    Sua opinião ajuda outros clientes a tomar decisões! ⭐⭐⭐⭐⭐
```

#### 6. Promoção Personalizada

**Gatilho**: Cliente visualiza categoria específica  
**Ação**: Enviar ofertas relevantes

```yaml
trigger:
  event: category_interest
  conditions:
    - viewed_categories: [eletronicos, vestuario]
    - days_since_last_purchase: >14
    
action:
  type: message
  template: promo_personalized_v1
  delay: 24h
  content: |
    Olá, {nome_cliente}! 🎉
    
    Como você demonstrou interesse em produtos de 
    [categoria], temos uma promoção especial para você:
    
    🏷️ Desconto exclusivo: XX% OFF
    ⏰ Válido até: DD/MM/AAAA
    
    Clique aqui para ver as ofertas: {link_promocao}
    
    Código: PROMO-{cliente_id}
```

---

## 🔧 Configuração de Automações por Cliente

Cada cliente pode configurar suas próprias automações via painel:

### Painel de Automações (UI)

```
┌─────────────────────────────────────────┐
│  ⚙️ Configurações → Automações         │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  📋 Boas-vindas                   │ │
│  │     Ativo: [ON]                   │ │
│  │     Template: welcome_v1          │ │
│  │     Delay: imediato               │ │
│  │     Personalizar: [YES/NO]        │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  🛒 Abandono Carrinho             │ │
│  │     Ativo: [ON]                   │ │
│  │     Delay: 2 horas                │ │
│  │     Template: cart_recovery_v1    │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [+ Nova Automação]                    │
│                                         │
│  Configurações Globais:                 │
│  - Hora de envio: [horário]            │
│  - Dias da semana: [selecionar]        │
│  - Fuso horário: [configurar]          │
└─────────────────────────────────────────┘
```

### API para Criar Automações Customizadas

```typescript
// POST /api/tenants/{tenantId}/automations
const automation = {
  name: "Novo Lead Hot",
  trigger: {
    type: "conversation_start",
    conditions: [
      { field: "message_keyword", operator: "contains", value: "orçamento" },
      { field: "hour", operator: "between", values: ["9", "17"] }
    ]
  },
  action: {
    type: "send_message",
    template: "lead_followup_v1",
    variables: {
      nome_cliente: "$client.name",
      produto_interesse: "$last_product"
    },
    delay: 5, // minutos
    personalization: true
  }
};
```

---

## 📊 Métricas de Automação

### Dashboard de Performance

| Métrica | Fórmula | Meta |
|---------|---------|------|
| Taxa de Resposta | (Respostas / Envios) × 100 | >65% |
| Conversão Follow-up | (Compras pós-followup / Followups) × 100 | >25% |
| Redução Abandono | ((Antes - Depois) / Antes) × 100 | >40% |
| ROI Automações | (Receita Adicional - Custo) / Custo | >300% |

### A/B Testing de Templates

```typescript
// Configurar teste A/B para template
const abTest = {
  name: "welcome_v1_vs_v2",
  variants: [
    { id: "A", template: "welcome_v1", weight: 50 },
    { id: "B", template: "welcome_v2", weight: 50 }
  ],
  duration_days: 7,
  winner_criteria: "response_rate"
};
```

---

## 🚨 Alertas e Notificações

### Níveis de Prioridade

| Nível | Gatilho | Ação | Canal |
|-------|---------|------|-------|
| 🔴 Crítico | Cliente irritado + >3x tentativas | Escalar humano imediato | WhatsApp + Email |
| 🟠 Alto | Pedido pendente >24h | Notificar supervisor | Email + Slack |
| 🟡 Médio | Taxa resposta <50% | Revisar templates | Dashboard |
| 🟢 Baixo | Métricas normais | Monitoramento contínuo | Relatório semanal |

### Webhooks para Integrações Externas

```typescript
// POST /api/webhooks/automation-events
{
  "event": "automation_triggered",
  "tenant_id": "xxx",
  "automation_name": "followup_cart",
  "recipient": "+5511999999999",
  "template_used": "cart_recovery_v1",
  "scheduled_at": "2024-01-15T14:30:00Z",
  "status": "pending"
}
```

---

## 🎯 Melhores Práticas

### ✅ DO'S (Faça)

- Teste todas as automações antes de ativar
- Monitore taxas de resposta diariamente
- Personalize mensagens com dados do cliente
- Use linguagem natural, não robótica
- Inclua call-to-action clara em cada mensagem
- A/B teste templates regularmente
- Documente todas as mudanças

### ❌ DON'TS (Não faça)

- Não envie mensagens fora do horário comercial (a menos que configurado)
- Não use automações para vender agressivamente
- Não ignore clientes que pedem atendimento humano
- Não use templates genéricos sem personalização
- Não ative todas as automações de uma vez (faça gradualmente)
```

### 5. **config_llm.md** - Configuração do LLM

```markdown
# Configuração Super Agente IA - LLM Settings

## 🎯 Seleção de Modelo

### Modelos Suportados

| Provedor | Modelos | Preço/mil tokens (input) | Preço/mil tokens (output) | Latência |
|----------|---------|--------------------------|---------------------------|----------|
| OpenAI | gpt-4-turbo, gpt-3.5-turbo | US$ 0.01 / $0.002 | US$ 0.03 / $0.06 | ~500ms |
| Anthropic | claude-3-opus, claude-3-sonnet | US$ 0.008 / $0.004 | US$ 0.024 / $0.048 | ~600ms |
| Groq | llama-3-70b, mixtral-8x7b | US$ 0.0005 / $0.001 | US$ 0.0015 / $0.002 | ~100ms ⚡ |
| Ollama (Local) | llama3, mistral, codellama | Gratuito* | Gratuito* | Depende hardware |

\*Requer GPU potente ou CPU multi-core

### Recomendação por Uso

| Cenário | Modelo Recomendado | Justificativa |
|---------|-------------------|---------------|
| Produção (qualidade) | gpt-4-turbo | Melhor compreensão contextual |
| Custo-benefício | claude-3-sonnet | Excelente razão preço/qualidade |
| Alta velocidade | llama-3-70b via Groq | Latência ultra baixa |
| Privacidade total | Ollama local | Dados não saem do servidor |

---

## ⚙️ Configuração por Tenant

Cada cliente configura seu próprio LLM no painel:

```typescript
interface TenantAIConfig {
  tenant_id: string;
  
  // Provider configuration
  llm_provider: 'openai' | 'anthropic' | 'groq' | 'ollama';
  
  // API credentials (encrypted in Supabase)
  api_key_hash: string;
  api_endpoint?: string; // For local models like Ollama
  
  // Model selection
  model_name: string;
  
  // Performance settings
  temperature: number; // 0.7 (creative) to 0.2 (precise)
  max_tokens: number; // Max response length
  top_p: number; // Nucleus sampling
  frequency_penalty: number; // Reduce repetition
  
  // RAG configuration
  rag_enabled: boolean;
  rag_top_k: number; // Top K chunks to retrieve
  rag_threshold: number; // Similarity threshold (0-1)
  
  // Context settings
  max_context_length: number; // Max tokens in context window
  system_prompt_template: string; // Template for system prompt
  
  // Cost controls
  max_cost_per_response: number; // Budget per response
  fallback_to_cache: boolean; // Use cached responses when possible
  
  // Monitoring
  track_usage: boolean;
  usage_alert_threshold: number; // Alert at X% of monthly budget
}
```

### Exemplo de Configuração JSON

```json
{
  "tenant_id": "tenant_xxxxx",
  "llm_provider": "openai",
  "api_key_hash": "sha256:abc123...",
  "model_name": "gpt-4-turbo",
  "temperature": 0.7,
  "max_tokens": 4096,
  "top_p": 0.9,
  "frequency_penalty": 0.5,
  "rag_enabled": true,
  "rag_top_k": 3,
  "rag_threshold": 0.75,
  "max_context_length": 8192,
  "system_prompt_template": "docs/instrucoes.md",
  "max_cost_per_response": 0.10,
  "fallback_to_cache": true,
  "track_usage": true,
  "usage_alert_threshold": 80
}
```

---

## 🔐 Segurança API Keys

### Armazenamento Seguro (Supabase)

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
  
  RETURN pgp_decrypt(key_pgp, tenant_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### RLS Policies para API Keys

```sql
-- Apenas usuários do próprio tenant podem acessar chaves
CREATE POLICY tenant_api_key_access ON tenant_api_keys
  USING (tenant_id = (SELECT id FROM auth.users WHERE auth.uid() = id).id);

-- Proibir acesso cruzado entre tenants
ALTER TABLE tenant_api_keys ENABLE ROW LEVEL SECURITY;
```

---

## 📊 Monitoramento e Otimização

### Métricas de Performance

| Métrica | Meta | Alerta | Ação |
|---------|------|--------|------|
| Latência média | <2s | >3s | Escalar ou otimizar prompts |
| Taxa de sucesso | >95% | <80% | Verificar contexto RAG |
| Custo por resposta | <US$0.10 | >US$0.20 | Reduzir max_tokens |
| Cache hit rate | >60% | <30% | Aumentar cache TTL |

### Logs de Uso (para billing)

```typescript
interface UsageLog {
  tenant_id: string;
  timestamp: Date;
  provider: string;
  model: string;
  tokens_input: number;
  tokens_output: number;
  cost_usd: number;
  response_time_ms: number;
  success: boolean;
  error_message?: string;
}

// Tabela em Supabase
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  tokens_input INTEGER,
  tokens_output INTEGER,
  cost_usd DECIMAL(10,4),
  response_time_ms INTEGER,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  conversation_id UUID REFERENCES conversations(id)
);

-- Index para queries de billing
CREATE INDEX idx_usage_tenant_date ON ai_usage_logs(tenant_id, timestamp DESC);
```

---

## 🚀 Otimizações Avançadas

### Prompt Caching

```typescript
interface CacheConfig {
  enabled: boolean;
  ttl_minutes: number; // Time to live
  cache_key_format: string; // Template for cache key
  
  // Cache strategies
  strategy: 'lru' | 'lfu' | 'time-based';
  max_size_mb: number;
}

const cacheConfig: CacheConfig = {
  enabled: true,
  ttl_minutes: 30,
  cache_key_format: '{tenant_id}:{prompt_hash}:{context_hash}',
  strategy: 'lru',
  max_size_mb: 100
};
```

### Batch Processing para Mensagens

```typescript
interface BatchConfig {
  batch_size: number; // Messages per batch
  batch_interval_ms: number; // Time between batches
  
  // Parallel processing
  parallel_requests: number;
  
  // Retry logic
  max_retries: number;
  retry_delay_ms: number;
}

const batchConfig: BatchConfig = {
  batch_size: 10,
  batch_interval_ms: 500,
  parallel_requests: 3,
  max_retries: 2,
  retry_delay_ms: 1000
};
```

---

## 📝 Checklist de Configuração LLM

Para cada tenant, configurar:

- [ ] Selecionar provedor de LLM (OpenAI/Anthropic/Groq/Ollama)
- [ ] Gerar e armazenar API key criptografada
- [ ] Escolher modelo específico (ex: gpt-4-turbo)
- [ ] Ajustar temperature (0.2-1.0) conforme necessidade
- [ ] Configurar RAG (habilitar/desabilitar)
- [ ] Definir max_tokens e top_p
- [ ] Configurar budget por resposta
- [ ] Ativar logging de uso para billing
- [ ] Testar com mensagem de exemplo
- [ ] Monitorar latência e custos

---

## 🎓 Melhores Práticas

### ✅ DOs

- Use Groq para alta velocidade (latência 10x menor)
- Habilite cache para reduzir custos em 60%+
- Ajuste temperature: baixo (0.3) para tarefas precisas, alto (0.8) para criativas
- Monitore uso diário e ajuste limites
- Use fallback models quando API estiver sobrecarregada

### ❌ DON'Ts

- Não use gpt-4 para todos os casos (use 3.5-turbo quando suficiente)
- Não ignore erros de rate limiting (implemente retry logic)
- Não armazene chaves em texto puro no frontend
- Não configure max_tokens muito alto sem necessidade
```

---

Agora vou criar o restante dos arquivos essenciais! Continua? 🚀