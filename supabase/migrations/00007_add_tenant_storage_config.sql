-- Migration: 00007_add_tenant_storage_config
-- Description: Adiciona coluna de configuração de armazenamento na tabela de tenants

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS storage_config JSONB DEFAULT '{"provider": "supabase"}';
