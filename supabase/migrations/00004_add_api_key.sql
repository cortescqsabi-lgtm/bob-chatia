-- Add api_key column to ai_configurations table to support custom client tokens
ALTER TABLE ai_configurations ADD COLUMN IF NOT EXISTS api_key TEXT;
