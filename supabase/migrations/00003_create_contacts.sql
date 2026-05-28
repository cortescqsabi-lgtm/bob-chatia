-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  channel_type TEXT NOT NULL DEFAULT 'whatsapp' CHECK (channel_type IN ('whatsapp', 'instagram', 'facebook')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, phone)
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON contacts FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_contacts_tenant ON contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);

-- Insert existing contacts from conversations
INSERT INTO contacts (tenant_id, name, phone, email, avatar_url, channel_type)
SELECT DISTINCT ON (c.contact_phone)
  c.tenant_id,
  COALESCE(c.contact_name, 'Unknown'),
  c.contact_phone,
  c.contact_email,
  c.profile_pic_url,
  c.channel_type
FROM conversations c
WHERE c.contact_phone IS NOT NULL AND c.contact_phone != ''
ON CONFLICT (tenant_id, phone) DO NOTHING;
