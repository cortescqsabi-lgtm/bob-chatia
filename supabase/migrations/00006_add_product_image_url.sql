-- Migration: 00006_add_product_image_url
-- Description: Adiciona coluna de URL da foto do produto na tabela de produtos

ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
