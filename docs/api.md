# 🔌 API Documentation - MultiChat AI REST Endpoints

## Overview

MultiChat AI exposes several API endpoints for:
- Authentication & Authorization (via Supabase)
- Evolution API Webhooks (WhatsApp/IG/FB messages)
- CRM Operations (customers, tickets, products)
- AI Agent Interactions
- Analytics & Reporting
- Webhook subscriptions

---

## 🔐 Base URL & Authentication

### Base URLs

```
Production: https://app.multichat.ai/api
Development: http://localhost:3000/api
Evolution Webhook: https://app.multichat.ai/api/evolution/webhook
Meta Graph: https://graph.facebook.com/v18.0
LLM API (OpenAI): https://api.openai.com/v1
```

### Authentication Headers

All protected endpoints require:

```javascript
Authorization: Bearer <supabase_anon_key> // Public read access
// or
Authorization: Bearer <supabase_service_role_key> // Admin operations
```

Tenant context is automatically resolved from JWT claims.

---

## 📝 Core API Endpoints

### 1. Authentication & User Management

#### POST `/api/auth/signup`
Register new user

```json
{
  "email": "user@example.com",
  "password": "securePassword123!",
  "name": "John Doe",
  "tenant_name": "My Company"
}
```

**Response:**
```json
{
  "userId": "uuid",
  "tenantId": "uuid (auto-created)",
  "authToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Account created successfully"
}
```

#### POST `/api/auth/login`
Login with email/password

```json
{
  "email": "user@example.com",
  "password": "securePassword123!"
}
```

**Response:** Same as signup + refresh token rotation

#### POST `/api/auth/logout`
Invalidate session tokens

**Response:** `{ "success": true }`

#### POST `/api/auth/forgot-password`
Request password reset email

```json
{
  "email": "user@example.com"
}
```

---

### 2. Evolution API Webhook (WhatsApp/IG/FB)

#### POST `/api/evolution/webhook` ⭐ CRITICAL
Receives messages from Evolution API

**Headers:**
```
Content-Type: application/json
X-Webhook-Signature: <hmac-sha256-signature> // Validate!
```

**Request Body (from Evolution):**
```json
{
  "id": "msg_uuid_123",
  "timestamp": 1709856000,
  "contact": {
    "name": "João Silva",
    "phone": "+5511999999999"
  },
  "message": {
    "text": "Olá! Quero saber sobre o produto X",
    "type": "text"
  },
  "conversation_id": "conv_uuid_456",
  "direction": "incoming",
  "attachments": []
}
```

**Response (immediate acknowledgment):**
```json
{
  "status": "ok",
  "messageId": "msg_uuid_123"
}
```

**Async Processing:**
- Message saved to `messages` table
- AI processing queued
- Response sent back within 500ms (streaming or cached)

#### GET `/api/evolution/webhook/status`
Check webhook health

**Response:**
```json
{
  "status": "active",
  "last_received_at": "2024-03-10T14:30:00Z",
  "messages_processed_today": 1250,
  "avg_response_time_ms": 890
}
```

---

### 3. AI Agent Endpoints

#### POST `/api/ai/chat`
Send message to AI agent (streaming)

**Headers:**
```
Content-Type: application/json
Accept: text/event-stream // For streaming
X-Tenant-ID: tenant_uuid // Optional, from auth context
```

**Request:**
```json
{
  "conversation_id": "conv_uuid_123",
  "message": "Olá! Gostaria de saber mais sobre o produto X",
  "temperature": 0.7,
  "max_tokens": 4096,
  "rag_enabled": true // Use knowledge base (.MD files)
}
```

**Streaming Response (SSE):**
```
data: {"type": "stream_start", "messageId": "msg_uuid_abc"}

data: {"type": "chunk", "content": "Olá! Como posso ajudar você com o produto X?"}

data: {"type": "complete", "fullResponse": "Olá! Como posso..."}
```

**Non-Streaming Response:**
```json
{
  "messageId": "msg_uuid_abc",
  "role": "assistant",
  "content": "Olá! Como posso ajudar você com o produto X?",
  "tokens_used": 156,
  "response_time_ms": 890,
  "ai_context": {
    "rag_chunks_used": 3,
    "retrieved_from": ["instrucoes.md", "produtos.md"],
    "confidence_score": 0.89
  }
}
```

#### POST `/api/ai/generate-summary`
Generate conversation summary

**Request:**
```json
{
  "conversation_id": "conv_uuid_123",
  "max_length": 500,
  "include_sentiment": true
}
```

**Response:**
```json
{
  "summary": "Cliente interessado no produto X, pediu orçamento e agendou visita técnica.",
  "sentiment": "positive",
  "sentiment_score": 0.85,
  "key_topics": ["product_x", "budget", "technical_visit"],
  "action_items": ["Send catalog", "Schedule demo"]
}
```

---

### 4. CRM Operations

#### GET `/api/crm/conversations`
List conversations for tenant

**Query Parameters:**
```
?tenant_id=uuid&page=1&limit=20&status=active&search=joao&channel_type=whatsapp
```

**Response:**
```json
{
  "data": [
    {
      "id": "conv_uuid_123",
      "contact_name": "João Silva",
      "contact_phone": "+5511999999999",
      "channel_type": "whatsapp",
      "last_message_at": "2024-03-10T14:30:00Z",
      "status": "active",
      "message_count": 45,
      "ai_summary": "Cliente interessado em produto X",
      "unread_count": 2
    }
  ],
  "meta": {
    "total": 125,
    "page": 1,
    "limit": 20,
    "has_more": true
  }
}
```

#### GET `/api/crm/conversations/:id/messages`
Get conversation message history

**Query Parameters:**
```
?tenant_id=uuid&page=1&limit=50&role=user,assistant
```

**Response:**
```json
{
  "data": [
    {
      "id": "msg_uuid_1",
      "role": "user",
      "content": "Olá! Quero saber sobre o produto X",
      "type": "text",
      "status": "read",
      "created_at": "2024-03-10T14:25:00Z"
    },
    {
      "id": "msg_uuid_2",
      "role": "assistant",
      "content": "Olá! Posso ajudar com o produto X. Ele tem as seguintes características...",
      "ai_generated": true,
      "tokens_used": 156,
      "created_at": "2024-03-10T14:25:50Z"
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 50
  }
}
```

#### POST `/api/crm/conversations/:id/messages`
Send message to conversation (auto-reply)

**Request:**
```json
{
  "conversation_id": "conv_uuid_123",
  "content": "Olá! Obrigado pelo interesse. Vou enviar as informações agora.",
  "type": "text",
  "ai_generated": true
}
```

**Response:**
```json
{
  "messageId": "msg_uuid_xyz",
  "status": "sent",
  "delivered_at": "2024-03-10T14:26:00Z"
}
```

#### GET `/api/crm/tickets`
List support tickets

**Query Parameters:**
```
?tenant_id=uuid&status=open,in_progress,resolved&priority=high,urgent&search=erro
```

**Response:**
```json
{
  "data": [
    {
      "id": "ticket_uuid_123",
      "subject": "Produto chegou com defeito",
      "description": "O produto X veio quebrado...",
      "status": "open",
      "priority": "high",
      "created_at": "2024-03-10T10:00:00Z",
      "first_response_at": null,
      "resolved_at": null,
      "conversation_id": "conv_uuid_456",
      "assigned_to": null,
      "labels": ["shipping", "defect"]
    }
  ],
  "meta": {
    "total": 12,
    "open_count": 5,
    "in_progress_count": 3,
    "resolved_count": 4
  }
}
```

#### POST `/api/crm/tickets`
Create new ticket from conversation

**Request:**
```json
{
  "conversation_id": "conv_uuid_123",
  "subject": "Cliente questionando preço",
  "description": "Cliente pediu desconto adicional...",
  "priority": "medium"
}
```

**Response:** Same as GET with id

---

### 5. Customers/Contacts Management

#### GET `/api/crm/customers`
List all customers for tenant

**Query Parameters:**
```
?tenant_id=uuid&search=joao&tags=new,premium&page=1&limit=20
```

**Response:**
```json
{
  "data": [
    {
      "id": "cust_uuid_123",
      "name": "João Silva",
      "phone": "+5511999999999",
      "email": "joao@example.com",
      "avatar_url": "https://example.com/avatar.jpg",
      "tags": ["new", "premium"],
      "total_messages": 45,
      "last_message_at": "2024-03-10T14:30:00Z",
      "status": "active",
      "created_at": "2024-03-01T10:00:00Z"
    }
  ],
  "meta": {
    "total": 156,
    "page": 1,
    "limit": 20
  }
}
```

#### GET `/api/crm/customers/:id`
Get customer details + conversation history

**Response:**
```json
{
  "id": "cust_uuid_123",
  "name": "João Silva",
  "phone": "+5511999999999",
  "email": "joao@example.com",
  "tags": ["new", "premium"],
  "notes": "Cliente VIP - tratar com cuidado",
  "total_messages": 45,
  "conversation_count": 8,
  "last_interaction_at": "2024-03-10T14:30:00Z",
  "ai_summary": "Interessado em produto X e Y, pediu orçamento",
  "created_at": "2024-03-01T10:00:00Z"
}
```

#### POST `/api/crm/customers/:id/messages`
Send direct message to customer (no AI)

**Request:**
```json
{
  "customer_id": "cust_uuid_123",
  "content": "Olá João! Aqui é o suporte do MultiChat AI.",
  "type": "text"
}
```

---

### 6. Products & Pricing

#### GET `/api/crm/products`
List products from knowledge base

**Query Parameters:**
```
?tenant_id=uuid&category=eletronicos&search=iPhone&page=1&limit=20
```

**Response:**
```json
{
  "data": [
    {
      "id": "prod_uuid_123",
      "sku": "IPHONE-15-PRO-MAX",
      "name": "iPhone 15 Pro Max 256GB",
      "description": "O mais poderoso iPhone até hoje...",
      "category": "smartphones",
      "base_price": 14999.00,
      "cost_price": 11999.00,
      "margin_percent": 20.00,
      "stock_quantity": 25,
      "is_active": true,
      "is_featured": true,
      "created_at": "2024-03-01T10:00:00Z"
    }
  ],
  "meta": {
    "total": 156,
    "page": 1,
    "limit": 20
  }
}
```

#### GET `/api/crm/products/:id`
Get product details + recommendations

**Response:**
```json
{
  "id": "prod_uuid_123",
  "sku": "IPHONE-15-PRO-MAX",
  "name": "iPhone 15 Pro Max 256GB",
  "description": "O mais poderoso iPhone até hoje...",
  "category": "smartphones",
  "base_price": 14999.00,
  "cost_price": 11999.00,
  "margin_percent": 20.00,
  "stock_quantity": 25,
  "is_active": true,
  "is_featured": true,
  "images": [
    "https://example.com/iphone15pro.jpg",
    "https://example.com/iphone15pro_back.jpg"
  ],
  "specifications": {
    "display": "6.7\" Super Retina XDR",
    "storage": "256GB",
    "camera": "48MP Main + 12MP Ultra Wide + 12MP Telephoto",
    "battery": "Up to 29 hours video playback"
  },
  "related_products": [
    {
      "id": "prod_uuid_456",
      "name": "iPhone Case Silicone",
      "price": 199.00,
      "margin_percent": 30.00
    }
  ],
  "created_at": "2024-03-01T10:00:00Z"
}
```

#### GET `/api/crm/pricing-rules`
Get pricing rules from precos.md

**Response:**
```json
{
  "base_prices": [
    {
      "sku": "IPHONE-15-PRO-MAX",
      "name": "iPhone 15 Pro Max 256GB",
      "price": 14999.00,
      "cost": 11999.00
    }
  ],
  "discount_rules": [
    {
      "customer_tier": "bronze",
      "max_discount_percent": 0,
      "conditions": []
    },
    {
      "customer_tier": "silver",
      "max_discount_percent": 5,
      "conditions": ["min_purchase_3_times"]
    },
    {
      "campaign_code": "BLACKFRIDAY",
      "discount_percent": 30,
      "valid_until": "2024-11-30T23:59:59Z"
    }
  ],
  "volume_discounts": [
    {
      "quantity_min": 3,
      "extra_discount_percent": 5
    },
    {
      "quantity_min": 6,
      "extra_discount_percent": 10
    }
  ]
}
```

---

### 7. AI Configuration & Knowledge Base

#### GET `/api/ai/config`
Get AI configuration for tenant

**Response:**
```json
{
  "tenant_id": "tenant_uuid_123",
  "llm_provider": "openai",
  "model_name": "gpt-4-turbo",
  "temperature": 0.7,
  "max_tokens": 4096,
  "top_p": 0.9,
  "rag_enabled": true,
  "rag_top_k": 3,
  "rag_threshold": 0.75,
  "max_cost_per_response": 0.10,
  "fallback_to_cache": true
}
```

#### PUT `/api/ai/config`
Update AI configuration

**Request:**
```json
{
  "temperature": 0.8,
  "rag_enabled": true,
  "rag_top_k": 5,
  "max_cost_per_response": 0.15
}
```

#### POST `/api/ai/knowledge-base/upload`
Upload .MD file to knowledge base

**Request (multipart/form-data):**
```
File: instrucoes.md
Content-Type: text/markdown
```

**Response:**
```json
{
  "file_id": "kb_uuid_123",
  "file_name": "instrucoes.md",
  "chunks_created": 45,
  "embedding_model": "text-embedding-ada-002",
  "processing_time_ms": 2500,
  "status": "indexed"
}
```

#### GET `/api/ai/knowledge-base/files`
List knowledge base files

**Response:**
```json
{
  "files": [
    {
      "id": "kb_uuid_1",
      "file_name": "instrucoes.md",
      "file_path": "/knowledge/instrucoes.md",
      "chunk_size": 500,
      "chunk_overlap": 100,
      "is_default": true,
      "created_at": "2024-03-01T10:00:00Z"
    },
    {
      "id": "kb_uuid_2",
      "file_name": "produtos.md",
      "file_path": "/knowledge/produtos.md",
      "chunk_size": 500,
      "chunk_overlap": 100,
      "is_default": true,
      "created_at": "2024-03-01T10:05:00Z"
    }
  ]
}
```

#### DELETE `/api/ai/knowledge-base/files/:id`
Delete knowledge base file

**Response:** `{ "success": true, "message": "File deleted and embeddings removed" }`

---

### 8. Automations & Workflows

#### GET `/api/automations/workflows`
List workflows for tenant

**Query Parameters:**
```
?tenant_id=uuid&status=draft,active,paused&page=1&limit=20
```

**Response:**
```json
{
  "data": [
    {
      "id": "workflow_uuid_123",
      "name": "Welcome New Customer",
      "description": "Enviado quando cliente faz primeiro contato",
      "trigger_type": "message_received",
      "conditions": {
        "type": "conversation_start",
        "and": [
          { "field": "client_tier", "operator": "=", "value": "any" }
        ]
      },
      "actions": [
        {
          "type": "send_message",
          "template": "welcome_v1",
          "delay_minutes": 0,
          "personalization": true
        }
      ],
      "schedule_interval": null,
      "status": "active",
      "enabled": true,
      "created_at": "2024-03-01T10:00:00Z"
    }
  ],
  "meta": {
    "total": 5,
    "page": 1,
    "limit": 20
  }
}
```

#### POST `/api/automations/workflows`
Create new workflow

**Request:**
```json
{
  "name": "Cart Abandonment Follow-up",
  "description": "Enviado quando cliente abandona carrinho",
  "trigger_type": "time_based",
  "conditions": {
    "type": "cart_abandoned",
    "and": [
      { "field": "hours_since_abandonment", "operator": ">=", "value": 2 }
    ]
  },
  "actions": [
    {
      "type": "send_message",
      "template": "cart_recovery_v1",
      "personalization": true,
      "variables": {
        "nome_cliente": "$contact.name",
        "produto_visualizado": "$last_product"
      }
    }
  ],
  "schedule_interval": null,
  "status": "draft"
}
```

**Response:** Same as GET with id

#### PUT `/api/automations/workflows/:id`
Update workflow

#### DELETE `/api/automations/workflows/:id`
Delete workflow

---

### 9. Analytics & Reporting

#### GET `/api/analytics/overview`
Get tenant analytics dashboard data

**Query Parameters:**
```
?tenant_id=uuid&period=7d,30d,90d,ytd,all&start_date=2024-01-01&end_date=2024-03-10
```

**Response:**
```json
{
  "period": {
    "start_date": "2024-03-03",
    "end_date": "2024-03-10",
    "days": 7
  },
  "metrics": {
    "total_messages": 1250,
    "ai_responses": 890,
    "avg_response_time_ms": 890,
    "response_rate_percent": 65.2,
    "active_conversations": 45,
    "new_customers": 12,
    "tickets_created": 8,
    "products_inquired": 34,
    "estimated_revenue_brl": 125000.00
  },
  "trends": {
    "messages_by_day": [
      {"date": "2024-03-03", "count": 180},
      {"date": "2024-03-04", "count": 220},
      // ...
    ],
    "messages_by_channel": {
      "whatsapp": 890,
      "instagram": 245,
      "facebook": 115
    },
    "messages_by_time": {
      "morning": 320,
      "afternoon": 560,
      "evening": 370
    }
  },
  "top_products_inquired": [
    {"name": "iPhone 15 Pro Max", "count": 45},
    {"name": "Samsung Galaxy S24", "count": 32}
  ],
  "sentiment_distribution": {
    "positive": 65,
    "neutral": 25,
    "negative": 10
  }
}
```

#### GET `/api/analytics/usage`
Get AI usage statistics for billing

**Query Parameters:**
```
?tenant_id=uuid&period=7d,30d,90d,ytd,all
```

**Response:**
```json
{
  "period": {
    "start_date": "2024-03-03",
    "end_date": "2024-03-10",
    "days": 7
  },
  "usage_by_provider": [
    {
      "provider": "openai",
      "model_name": "gpt-4-turbo",
      "total_requests": 890,
      "total_tokens_input": 125000,
      "total_tokens_output": 345000,
      "total_cost_usd": 23.45,
      "avg_response_time_ms": 650
    }
  ],
  "daily_usage": [
    {
      "date": "2024-03-10",
      "requests": 145,
      "tokens_input": 20000,
      "tokens_output": 56000,
      "cost_usd": 3.89
    }
  ],
  "summary": {
    "total_requests": 890,
    "total_tokens_input": 125000,
    "total_tokens_output": 345000,
    "total_cost_usd": 23.45,
    "avg_response_time_ms": 650
  }
}
```

---

### 10. Meta Graph API Integration

#### POST `/api/meta/webhook` ⭐ CRITICAL
Receives messages from Meta Graph API (IG/FB)

**Headers:**
```
Content-Type: application/json
X-Page-Access-Token: <encrypted> // Optional, for verification
```

**Request Body (from Meta):**
```json
{
  "object": "whatsapp_v2",
  "entry": [
    {
      "id": "meta_entry_id",
      "time": 1709856000,
      "changes": [
        {
          "value": {
            "messaging_product": {
              "sender": "5511999999999",
              "recipient": {
                "id": "page_id"
              },
              "message": {
                "mid": "wamid.meta.msg.abc",
                "type": "text",
                "text": {
                  "body": "Olá! Quero saber sobre o produto X"
                }
              }
            }
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

**Response:** Same as Evolution webhook (immediate ack)

#### GET `/api/meta/accounts`
List connected Meta accounts

**Response:**
```json
{
  "data": [
    {
      "id": "meta_uuid_123",
      "facebook_page_id": "123456789",
      "instagram_business_id": "ig_business_123",
      "whatsapp_business_id": "wa_business_123",
      "page_name": "Minha Loja",
      "access_token_encrypted": "...",
      "is_verified": false,
      "status": "active",
      "last_sync_at": "2024-03-10T14:30:00Z"
    }
  ]
}
```

#### POST `/api/meta/accounts/connect`
Connect new Meta account via OAuth2

**Response:** Returns authorization URL for user to complete OAuth flow

---

### 11. Billing & Subscription

#### GET `/api/billing/subscription`
Get current subscription status

**Response:**
```json
{
  "tenant_id": "tenant_uuid_123",
  "plan": "professional",
  "monthly_limit": 5000,
  "current_usage": {
    "messages_this_month": 2450,
    "ai_responses_this_month": 1890
  },
  "overage": {
    "messages_over_limit": 0,
    "estimated_overage_cost_brl": 0.00
  },
  "billing_cycle": {
    "start_date": "2024-03-01",
    "end_date": "2024-03-31"
  },
  "next_billing_date": "2024-04-01",
  "amount_due_brl": 297.00,
  "payment_status": "paid"
}
```

#### GET `/api/billing/invoices`
List tenant invoices

**Query Parameters:**
```
?tenant_id=uuid&status=paid,pending,cancelled&page=1&limit=20
```

**Response:**
```json
{
  "data": [
    {
      "id": "invoice_uuid_123",
      "stripe_invoice_id": "in_xxxxxxxxx",
      "amount_due_brl": 297.00,
      "currency": "BRL",
      "status": "paid",
      "due_date": "2024-03-31T23:59:59Z",
      "pdf_url": "https://invoices.multichat.ai/pd/in_xxxxxxxxx.pdf",
      "created_at": "2024-03-01T00:00:00Z",
      "paid_at": "2024-03-01T10:30:00Z"
    }
  ],
  "meta": {
    "total": 8,
    "page": 1,
    "limit": 20
  }
}
```

#### GET `/api/billing/usage-limits`
Get current usage limits and warnings

**Response:**
```json
{
  "tenant_id": "tenant_uuid_123",
  "plan": "professional",
  "limits": {
    "messages_per_month": 5000,
    "conversations_active": 50,
    "ai_responses_per_day": 100
  },
  "current_usage": {
    "messages_this_month": 2450,
    "percent_of_limit": 49.00,
    "ai_responses_today": 34,
    "conversations_active": 12
  },
  "warnings": [],
  "overages": false
}
```

---

### 12. Webhook Subscriptions (Outgoing)

#### POST `/api/webhooks/subscribe`
Subscribe to events via webhook

**Request:**
```json
{
  "url": "https://myapp.com/api/multichat-events",
  "events": ["conversation.created", "message.received", "ticket.created", "usage.limit_reached"],
  "secret": "whsec_xxxxxxxxxx" // For HMAC verification
}
```

**Response:**
```json
{
  "webhook_id": "webhook_uuid_123",
  "events_subscribed": ["conversation.created", "message.received", "ticket.created", "usage.limit_reached"],
  "status": "active",
  "created_at": "2024-03-10T14:30:00Z"
}
```

#### GET `/api/webhooks/subscriptions`
List active webhook subscriptions

**Response:**
```json
{
  "data": [
    {
      "id": "webhook_uuid_123",
      "url": "https://myapp.com/api/multichat-events",
      "events": ["conversation.created", "message.received"],
      "status": "active",
      "last_triggered_at": "2024-03-10T14:25:00Z",
      "failure_count": 0,
      "created_at": "2024-03-10T14:30:00Z"
    }
  ]
}
```

#### DELETE `/api/webhooks/subscriptions/:id`
Unsubscribe from webhook events

---

## 🛡️ Error Responses

All endpoints return consistent error format:

### 4xx Client Errors

```json
{
  "error": {
    "code": "VALIDATION_ERROR", // or specific code
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### 5xx Server Errors

```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred",
    "request_id": "req_abc123xyz" // For support tickets
  }
}
```

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| AUTH_REQUIRED | Missing or invalid auth header | 401 |
| TENANT_NOT_FOUND | Tenant doesn't exist | 404 |
| USAGE_LIMIT_REACHED | Monthly limit exceeded | 429 |
| AI_SERVICE_UNAVAILABLE | LLM API down | 503 |
| WEBHOOK_SIGNATURE_INVALID | Invalid webhook signature | 401 |

---

## 🔒 Security Best Practices

### Webhook Signature Verification (Evolution/Meta)

```javascript
// Validate Evolution webhook signature
const crypto = require('crypto');

function verifyWebhookSignature(req, expectedSecret) {
  const signature = req.headers['x-webhook-signature'];
  const payload = JSON.stringify(req.body);
  const computedSignature = crypto
    .createHmac('sha256', expectedSecret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(computedSignature, 'hex')
  );
}
```

### Rate Limiting Per Tenant

```javascript
// Implement in Express middleware
const rateLimit = require('express-rate-limit');

const tenantRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per tenant
  message: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } }
});

app.use('/api/ai/chat', tenantRateLimiter);
```

---

*API Documentation completa para MultiChat AI - Todos os endpoints prontos!* 🔌✨