-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, name)
);

-- Create conversation_tags junction table
CREATE TABLE IF NOT EXISTS conversation_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, tag_id)
);

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies (service_role bypasses these, but good practice)
CREATE POLICY "Allow all for authenticated" ON tags FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON conversation_tags FOR ALL USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tags_tenant ON tags(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversation_tags_conv ON conversation_tags(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_tags_tag ON conversation_tags(tag_id);

-- Insert default tags for tenant
INSERT INTO tags (tenant_id, name, color) VALUES
  ('00000000-0000-0000-0000-000000000001', 'vendas', '#7c3aed'),
  ('00000000-0000-0000-0000-000000000001', 'suporte', '#f59e0b'),
  ('00000000-0000-0000-0000-000000000001', 'orcamento', '#06b6d4'),
  ('00000000-0000-0000-0000-000000000001', 'reclamacao', '#ef4444'),
  ('00000000-0000-0000-0000-000000000001', 'lead', '#10b981')
ON CONFLICT (tenant_id, name) DO NOTHING;
