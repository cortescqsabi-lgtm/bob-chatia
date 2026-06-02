'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { DEFAULT_TENANT_ID } from '@/lib/ai-agent';

interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  base_price: number;
  cost_price?: number;
  stock_quantity?: number;
  is_active: boolean;
  image_url?: string;
}

/* ─── SVG Icons ─── */
const S: Record<string, string> = {
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  filter: '<line x1="4" y1="6" x2="20" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="8" y1="18" x2="16" y2="18"/>',
};

function Icon({ n, s = 20, c = '' }: { n: string; s?: number; c?: string }) {
  return (
    <svg
      className={c}
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: S[n] || '' }}
    />
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [productModal, setProductModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [pName, setPName] = useState('');
  const [pSku, setPSku] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pCat, setPCat] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pCost, setPCost] = useState('');
  const [pStock, setPStock] = useState('');
  const [pImage, setPImage] = useState('');
  const [pActive, setPActive] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Import State
  const [productImporting, setProductImporting] = useState(false);
  const [productImportStatus, setProductImportStatus] = useState('');
  const [productImportPreview, setProductImportPreview] = useState<any[]>([]);
  const [productImportColumns, setProductImportColumns] = useState<string[]>([]);
  const [productImportStep, setProductImportStep] = useState<'idle' | 'preview' | 'done'>('idle');
  const [dragOver, setDragOver] = useState(false);

  const productFileRef = useRef<HTMLInputElement>(null);

  const getTenantId = useCallback(() => {
    if (typeof window === 'undefined') return DEFAULT_TENANT_ID;
    try {
      const u = localStorage.getItem('currentUser');
      if (u) return JSON.parse(u).tenant_id || DEFAULT_TENANT_ID;
    } catch {}
    return DEFAULT_TENANT_ID;
  }, []);

  const getTenantHeaders = useCallback((extra: Record<string, string> = {}) => {
    const tid = getTenantId();
    const headers: Record<string, string> = { ...extra };
    if (tid) headers['x-tenant-id'] = tid;
    return headers;
  }, [getTenantId]);

  const loadProducts = useCallback(async (search = '', category = '') => {
    setLoading(true);
    try {
      const headers = getTenantHeaders();
      const params = new URLSearchParams({ limit: '200' });
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      const r = await fetch(`/api/products?${params}`, { headers });
      const d = await r.json();
      setProducts(d.data || []);
      setProductCategories(d.categories || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [getTenantHeaders]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSaveProduct = async () => {
    if (!pName.trim() || !pPrice.trim()) return;
    const headers = getTenantHeaders({ 'Content-Type': 'application/json' });
    const body = {
      ...(editProduct ? { id: editProduct.id } : {}),
      sku: pSku.trim() || pName.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 30),
      name: pName.trim(),
      description: pDesc.trim() || null,
      category: pCat.trim() || null,
      base_price: parseFloat(pPrice.replace(',', '.')) || 0,
      cost_price: pCost ? parseFloat(pCost.replace(',', '.')) : null,
      stock_quantity: pStock ? parseInt(pStock) : 0,
      image_url: pImage.trim() || null,
      is_active: pActive,
    };
    const method = editProduct ? 'PUT' : 'POST';
    const r = await fetch('/api/products', { method, headers, body: JSON.stringify(body) });
    if (r.ok) {
      setProductModal(false);
      setEditProduct(null);
      setPName(''); setPSku(''); setPDesc(''); setPCat(''); setPPrice(''); setPCost(''); setPStock(''); setPImage(''); setPActive(true);
      loadProducts(productSearch, productCategory);
    } else {
      const errData = await r.json().catch(() => ({}));
      alert('Erro ao salvar produto: ' + (errData.error || 'Erro interno do servidor. Verifique se executou a migration SQL no painel do Supabase.'));
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const headers = getTenantHeaders({});
      const r = await fetch('/api/media/upload', {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await r.json();
      if (r.ok && data.url) {
        setPImage(data.url);
      } else {
        alert('Erro ao fazer upload: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (err) {
      alert('Erro de conexão ao enviar imagem.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Excluir este produto?')) return;
    const headers = getTenantHeaders();
    const r = await fetch(`/api/products?id=${id}`, { method: 'DELETE', headers });
    if (r.ok) {
      loadProducts(productSearch, productCategory);
    }
  };

  const handleProductImport = async (files: FileList | null) => {
    if (!files || !files[0]) return;
    const file = files[0];
    setProductImporting(true);
    setProductImportStatus('⏳ Lendo arquivo...');
    setProductImportStep('idle');
    try {
      const XLSX = await import('xlsx');
      const ab = await file.arrayBuffer();
      const wb = XLSX.read(ab, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (rows.length === 0) {
        setProductImportStatus('❌ Planilha vazia ou sem dados.');
        setProductImporting(false);
        return;
      }
      const cols = Object.keys(rows[0]);
      setProductImportColumns(cols);
      setProductImportPreview(rows.slice(0, 5));
      setProductImportStep('preview');
      setProductImportStatus(`✅ ${rows.length} linhas encontradas. Clique em "Confirmar Importação" para salvar.`);

      // Store rows in window temporarily
      (window as any).__productImportRows = rows;
    } catch (e: any) {
      setProductImportStatus('❌ Erro ao ler arquivo: ' + e.message);
    } finally {
      setProductImporting(false);
      if (productFileRef.current) productFileRef.current.value = '';
    }
  };

  const confirmProductImport = async () => {
    const rows = (window as any).__productImportRows;
    if (!rows) return;
    setProductImporting(true);
    setProductImportStatus('⏳ Importando produtos...');
    try {
      const headers = getTenantHeaders({ 'Content-Type': 'application/json' });
      const r = await fetch('/api/products/import', { method: 'POST', headers, body: JSON.stringify({ rows }) });
      const d = await r.json();
      if (d.success) {
        setProductImportStatus(`✅ Concluído! ${d.inserted} novos, ${d.updated} atualizados${d.skipped ? `, ${d.skipped} ignorados` : ''}.`);
        setProductImportStep('done');
        delete (window as any).__productImportRows;
        loadProducts(productSearch, productCategory);
      } else {
        setProductImportStatus('❌ ' + (d.error || 'Erro na importação'));
      }
    } catch (e: any) {
      setProductImportStatus('❌ ' + e.message);
    } finally {
      setProductImporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Catálogo de Produtos</h2>
          <p className="text-sm text-gray-500 mt-1">Gerencie a lista de produtos. O agente de IA consulta este catálogo estruturado em tempo real.</p>
        </div>
        <button
          onClick={() => {
            setEditProduct(null);
            setPName(''); setPSku(''); setPDesc(''); setPCat(''); setPPrice(''); setPCost(''); setPStock(''); setPImage(''); setPActive(true);
            setProductModal(true);
          }}
          className="flex items-center gap-2 bg-[#0084c7] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0070b0] transition shadow-sm"
        >
          <Icon n="plus" s={16} /> Novo Produto
        </button>
      </div>

      {/* Import Block */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-2xl mt-0.5">📊</span>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Importar Planilha (Excel / CSV)</h3>
            <p className="text-xs text-gray-500 mt-0.5">Importe vários produtos de uma vez. Se o SKU já existir, as informações serão atualizadas automaticamente se houver alterações.</p>
          </div>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleProductImport(e.dataTransfer.files); }}
          onClick={() => productFileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
            dragOver ? 'border-[#0084c7] bg-blue-50/40' : 'border-gray-200 hover:border-[#0084c7] hover:bg-gray-50/40'
          } ${productImporting ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input
            ref={productFileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => handleProductImport(e.target.files)}
          />
          <div className="text-3xl mb-2">{productImporting ? '⏳' : '📥'}</div>
          <p className="text-sm font-semibold text-gray-700">Clique ou arraste sua planilha aqui</p>
          <p className="text-xs text-gray-400 mt-1">Excel (.xlsx, .xls) ou CSV • Colunas suportadas: nome, sku, categoria, preco, custo, estoque, descricao</p>
        </div>

        {productImportStatus && (
          <p className={`mt-3 text-sm font-semibold ${
            productImportStatus.startsWith('✅') ? 'text-green-700' : productImportStatus.startsWith('❌') ? 'text-red-600' : 'text-blue-600'
          }`}>
            {productImportStatus}
          </p>
        )}

        {/* Spreadsheet preview before saving */}
        {productImportStep === 'preview' && productImportPreview.length > 0 && (
          <div className="mt-5 border border-gray-100 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pré-visualização (Primeiras 5 linhas)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-gray-600">
                <thead className="bg-gray-100/50">
                  <tr className="border-b border-gray-100">
                    {productImportColumns.slice(0, 8).map((col) => (
                      <th key={col} className="px-4 py-2 text-left font-semibold text-gray-600 truncate max-w-[120px]">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {productImportPreview.map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-none hover:bg-gray-50/50">
                      {productImportColumns.slice(0, 8).map((col) => (
                        <td key={col} className="px-4 py-2 truncate max-w-[120px] font-mono">{String(row[col] ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 px-4 py-3 flex gap-2 border-t border-gray-100">
              <button
                onClick={confirmProductImport}
                disabled={productImporting}
                className="bg-[#0084c7] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#0070b0] disabled:opacity-60 transition shadow-sm"
              >
                {productImporting ? 'Importando...' : 'Confirmar Importação'}
              </button>
              <button
                onClick={() => {
                  setProductImportStep('idle');
                  setProductImportStatus('');
                  setProductImportPreview([]);
                  delete (window as any).__productImportRows;
                }}
                className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filters and List */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="flex flex-col gap-3 mb-5 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Icon n="search" s={15} c="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="text"
              placeholder="Buscar por nome, SKU, categoria..."
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value);
                loadProducts(e.target.value, productCategory);
              }}
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20 placeholder:text-gray-400"
            />
          </div>
          {productCategories.length > 0 && (
            <select
              value={productCategory}
              onChange={(e) => {
                setProductCategory(e.target.value);
                loadProducts(productSearch, e.target.value);
              }}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-[#0084c7]/20 cursor-pointer"
            >
              <option value="">Todas as categorias</option>
              {productCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-gray-400">Carregando lista de produtos...</div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-gray-500 font-semibold text-base">Nenhum produto encontrado</p>
            <p className="text-sm text-gray-400 mt-1">Experimente mudar o filtro de busca ou adicione produtos.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Produto</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Categoria</th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Preço</th>
                  <th className="px-4 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Estoque</th>
                  <th className="px-4 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3.5"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, idx) => (
                  <tr key={p.id} className={`border-b border-gray-50 last:border-none hover:bg-gray-50/50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'}`}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-10 h-10 object-cover rounded-lg border border-gray-150 flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs font-semibold flex-shrink-0">📦</div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">{p.sku}</p>
                          {p.description && <p className="text-xs text-gray-500 mt-1 line-clamp-1 max-w-sm">{p.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      {p.category ? (
                        <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">{p.category}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <p className="font-bold text-gray-950">R$ {Number(p.base_price || 0).toFixed(2).replace('.', ',')}</p>
                      {p.cost_price != null && (
                        <p className="text-xs text-gray-400 mt-0.5">Custo: R$ {Number(p.cost_price).toFixed(2).replace('.', ',')}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center hidden md:table-cell">
                      <span className={`text-sm font-semibold ${(p.stock_quantity ?? 0) > 0 ? 'text-gray-700' : 'text-red-500 font-bold'}`}>
                        {p.stock_quantity ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {p.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => {
                            setEditProduct(p); setPName(p.name); setPSku(p.sku);
                            setPDesc(p.description || ''); setPCat(p.category || '');
                            setPPrice(String(p.base_price || ''));
                            setPCost(p.cost_price != null ? String(p.cost_price) : '');
                            setPStock(p.stock_quantity != null ? String(p.stock_quantity) : '');
                            setPActive(p.is_active);
                            setPImage(p.image_url || '');
                            setProductModal(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#0084c7] transition"
                          title="Editar"
                        >
                          <Icon n="edit" s={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition"
                          title="Excluir"
                        >
                          <Icon n="trash" s={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Product Modal */}
      {productModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setProductModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg text-gray-900">{editProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
              <button onClick={() => setProductModal(false)} className="text-gray-400 hover:text-gray-600">
                <Icon n="x" s={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Nome do Produto *</label>
                <input
                  type="text"
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20"
                  placeholder="Ex: Camiseta Básica Branca"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">SKU / Código</label>
                  <input
                    type="text"
                    value={pSku}
                    onChange={(e) => setPSku(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20 font-mono"
                    placeholder="CAM-BCO-M"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Categoria</label>
                  <input
                    type="text"
                    value={pCat}
                    onChange={(e) => setPCat(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20"
                    placeholder="Roupas"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Preço de Venda (R$) *</label>
                  <input
                    type="text"
                    value={pPrice}
                    onChange={(e) => setPPrice(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20"
                    placeholder="99,90"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Preço de Custo (R$)</label>
                  <input
                    type="text"
                    value={pCost}
                    onChange={(e) => setPCost(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20"
                    placeholder="45,00"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Estoque</label>
                <input
                  type="number"
                  value={pStock}
                  onChange={(e) => setPStock(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Descrição</label>
                <textarea
                  value={pDesc}
                  onChange={(e) => setPDesc(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20 resize-none"
                  placeholder="Características, tamanhos disponíveis, detalhes..."
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Foto / Imagem do Produto (URL)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pImage}
                    onChange={(e) => setPImage(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20"
                    placeholder="Ex: https://meusite.com.br/fotos/camiseta.jpg"
                  />
                  <label className="flex items-center justify-center bg-gray-50 hover:bg-gray-150 border border-gray-200 hover:border-gray-300 rounded-lg px-3 cursor-pointer text-gray-600 transition min-w-[42px] relative">
                    {uploadingImage ? (
                      <span className="w-4 h-4 border-2 border-[#0084c7] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadImage}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={pActive}
                  onChange={(e) => setPActive(e.target.checked)}
                  className="w-4 h-4 accent-[#0084c7]"
                />
                <span className="text-sm text-gray-700">Produto ativo (disponível para a IA consultar)</span>
              </label>

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setProductModal(false)}
                  className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveProduct}
                  className="flex-1 bg-[#0084c7] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#0070b0] transition shadow-sm"
                >
                  {editProduct ? 'Salvar alterações' : 'Criar produto'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
