# Automações e Workflows - [Nome da Empresa]

## 🔄 1. Boas-Vindas Automático

**Gatilho**: Primeiro contato do cliente  
**Tempo**: Imediato

```yaml
flow:
  action: send_message
  template: |
    Olá, {nome}! 👋 Bem-vindo à [Empresa]!
    Sou seu assistente virtual. Como posso ajudar?
```

## 🛒 2. Abandono de Carrinho

**Gatilho**: Cliente visualiza produto + 30min sem comprar  
**Tempo**: 2 horas após abandono

```yaml
flow:
  step_1:
    delay: 30min
    message: "Percebi que você se interessou por {produto}. Posso ajudar?"
  step_2:
    condition: "no_response"
    delay: 4h
    offer: "Desconto de 5%"
```

## 📦 3. Pós-Venda

**Gatilho**: Pedido entregue + 3 dias  
**Ação**: Solicitar avaliação

```yaml
flow:
  delay: 3d
  message: |
    Espero que seu pedido tenha chegado bem!
    Poderia avaliar sua experiência? ⭐
```

## 😴 4. Reconquista (30+ dias inativo)

**Gatilho**: Última interação > 30 dias  
**Tempo**: Imediato

```yaml
flow:
  conditions:
    - last_interaction_days: >30
  action: send_promotional
  template: |
    Olá! Saudades! Temos novidades para você...
```

## 🚨 5. Escala para Humano

**Gatilhos automáticos:**
- Cliente irritado (sentimento negativo detectado)
- 3+ tentativas sem resolução
- Palavras-chave: "humano", "atendente", "reclamação"
