import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { DEFAULT_TENANT_ID } from '@/lib/ai-agent';

function getTenantId(req: NextRequest) {
  return req.headers.get('x-tenant-id') || DEFAULT_TENANT_ID;
}

// Normaliza valor monetário do Excel (ex: "R$ 1.500,90" → 1500.90)
function parseMoney(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return val;
  const str = String(val)
    .replace(/R\$\s*/gi, '')
    .replace(/\./g, '')   // remove separador de milhar br
    .replace(',', '.')    // vírgula → ponto
    .trim();
  const n = parseFloat(str);
  return isNaN(n) ? null : n;
}

function parseInt2(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  const n = parseInt(String(val).replace(/\D/g, ''), 10);
  return isNaN(n) ? null : n;
}

// Mapeamento flexível de nomes de coluna → campo interno
const COL_MAP: Record<string, string> = {
  // SKU / código
  sku: 'sku', codigo: 'sku', code: 'sku', 'cod.': 'sku', cod: 'sku', referencia: 'sku', ref: 'sku',
  // Nome
  nome: 'name', name: 'name', produto: 'name', product: 'name', descricao_curta: 'name',
  // Descrição
  descricao: 'description', description: 'description', obs: 'description', observacao: 'description', detalhes: 'description',
  // Categoria
  categoria: 'category', category: 'category', grupo: 'category', line: 'category', linha: 'category',
  // Preço venda
  preco: 'base_price', price: 'base_price', valor: 'base_price', preco_venda: 'base_price',
  'preço': 'base_price', 'preço de venda': 'base_price', 'vlr venda': 'base_price', venda: 'base_price',
  'preço_venda': 'base_price', preco_unitario: 'base_price', 'preço unitário': 'base_price',
  // Preço custo
  custo: 'cost_price', cost: 'cost_price', preco_custo: 'cost_price', 'preço de custo': 'cost_price',
  'preço_custo': 'cost_price',
  // Estoque
  estoque: 'stock_quantity', stock: 'stock_quantity', quantidade: 'stock_quantity', qty: 'stock_quantity',
  saldo: 'stock_quantity', 'qtd estoque': 'stock_quantity',
  // Margem
  margem: 'margin_percent', margin: 'margin_percent',
  // Status
  ativo: 'is_active', active: 'is_active', status: 'is_active',
  // Foto / Imagem
  foto: 'image_url', imagem: 'image_url', image: 'image_url', photo: 'image_url', picture: 'image_url', url_foto: 'image_url', url_imagem: 'image_url',
};

function normalizeKey(key: string): string {
  return key.toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9_ ]/g, '')
    .replace(/\s+/g, '_');
}

function mapRow(rawRow: Record<string, any>): Record<string, any> {
  const mapped: Record<string, any> = {};
  for (const [rawKey, value] of Object.entries(rawRow)) {
    const normKey = normalizeKey(rawKey);
    // Tenta o mapa exato
    const field = COL_MAP[normKey] || COL_MAP[rawKey.toLowerCase().trim()];
    if (field) {
      mapped[field] = value;
    }
  }
  return mapped;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const tenantId = getTenantId(req);
    const body = await req.json();
    const { rows } = body as { rows: Record<string, any>[] };

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Nenhuma linha recebida' }, { status: 400 });
    }

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const rawRow of rows) {
      const row = mapRow(rawRow);

      // Nome é obrigatório
      if (!row.name && !row.sku) {
        skipped++;
        continue;
      }

      // SKU: se não tiver, gera a partir do nome
      if (!row.sku) {
        row.sku = (row.name as string)
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '_')
          .substring(0, 30);
      }

      const sku = String(row.sku).trim().toUpperCase();

      // Monta payload
      const payload: Record<string, any> = {
        tenant_id: tenantId,
        sku,
        name: String(row.name || sku).trim(),
        description: row.description ? String(row.description).trim() : null,
        category: row.category ? String(row.category).trim() : null,
        base_price: parseMoney(row.base_price) ?? 0,
        cost_price: parseMoney(row.cost_price),
        margin_percent: parseMoney(row.margin_percent),
        stock_quantity: parseInt2(row.stock_quantity) ?? 0,
        image_url: row.image_url ? String(row.image_url).trim() : null,
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      // Verifica se já existe pelo SKU + tenant
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('sku', sku)
        .maybeSingle();

      if (existing?.id) {
        // Update (sobrescreve)
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', existing.id)
          .eq('tenant_id', tenantId);

        if (error) { errors.push(`SKU ${sku}: ${error.message}`); }
        else updated++;
      } else {
        // Insert
        const { error } = await supabase
          .from('products')
          .insert(payload);

        if (error) { errors.push(`SKU ${sku}: ${error.message}`); }
        else inserted++;
      }
    }

    return NextResponse.json({
      success: true,
      inserted,
      updated,
      skipped,
      errors: errors.slice(0, 10), // máx 10 erros no retorno
      total: rows.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
