-- Migration: 00005_products_policy
-- Garante que a tabela products está acessível via service role (admin)
-- e adiciona política de isolamento por tenant

-- A tabela products já existe (criada em 00001_create_schema.sql)
-- Vamos garantir que a RLS permite acesso pelo service role
-- e criar políticas de isolamento por tenant

-- Remove políticas existentes se houver
DROP POLICY IF EXISTS "Tenant isolation products" ON products;

-- Política: usuários só veem produtos do próprio tenant
CREATE POLICY "Tenant isolation products" ON products
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Índice para busca rápida por SKU + tenant (upsert performance)
CREATE INDEX IF NOT EXISTS idx_products_tenant_sku ON products(tenant_id, sku);
CREATE INDEX IF NOT EXISTS idx_products_tenant_active ON products(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_tenant_category ON products(tenant_id, category);
