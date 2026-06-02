'use client';

import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    tenantName: 'VendaZap 360',
    timezone: 'America/Sao_Paulo',
    language: 'pt-BR'
  });
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Storage Settings States
  const [storageProvider, setStorageProvider] = useState<'supabase' | 'gcs'>('supabase');
  const [gcsBucketName, setGcsBucketName] = useState('');
  const [gcsProjectId, setGcsProjectId] = useState('');
  const [gcsClientEmail, setGcsClientEmail] = useState('');
  const [gcsPrivateKey, setGcsPrivateKey] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingStorage, setSavingStorage] = useState(false);

  // User management states
  const [users, setUsers] = useState<any[]>([]);
  const [userModal, setUserModal] = useState(false);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [uName, setUName] = useState('');
  const [uEmail, setUEmail] = useState('');
  const [uPassword, setUPassword] = useState('');
  const [uRole, setURole] = useState<'admin' | 'vendedor'>('vendedor');
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  // WhatsApp connection states
  const [whatsappStatus, setWhatsappStatus] = useState<any>({ connected: false, exists: false, qrcode: null });
  const [whatsappLoading, setWhatsappLoading] = useState(false);

  const checkWhatsappStatus = async (tId: string) => {
    try {
      const res = await fetch('/api/evolution/manage', {
        headers: { 'x-tenant-id': tId }
      });
      const data = await res.json();
      setWhatsappStatus(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleConnectWhatsapp = async () => {
    if (!currentUser) return;
    setWhatsappLoading(true);
    try {
      const res = await fetch('/api/evolution/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': currentUser.tenant_id
        },
        body: JSON.stringify({ action: 'connect' })
      });
      const data = await res.json();
      if (data.qrcode) {
        setWhatsappStatus((prev: any) => ({ ...prev, qrcode: data.qrcode, connected: false }));
      } else if (data.connected) {
        setWhatsappStatus((prev: any) => ({ ...prev, connected: true, qrcode: null }));
      }
    } catch (e) {
      alert('Erro ao conectar WhatsApp');
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleDisconnectWhatsapp = async () => {
    if (!currentUser || !confirm('Deseja realmente desconectar o WhatsApp?')) return;
    setWhatsappLoading(true);
    try {
      const res = await fetch('/api/evolution/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': currentUser.tenant_id
        },
        body: JSON.stringify({ action: 'disconnect' })
      });
      const data = await res.json();
      if (data.disconnected) {
        setWhatsappStatus({ connected: false, exists: false, qrcode: null });
        alert('WhatsApp desconectado!');
      }
    } catch (e) {
      alert('Erro ao desconectar WhatsApp');
    } finally {
      setWhatsappLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser || !whatsappStatus.qrcode || whatsappStatus.connected) return;
    
    const t = setInterval(async () => {
      try {
        const res = await fetch('/api/evolution/manage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': currentUser.tenant_id
          },
          body: JSON.stringify({ action: 'status' })
        });
        const data = await res.json();
        if (data.state === 'open') {
          setWhatsappStatus((prev: any) => ({ ...prev, connected: true, qrcode: null }));
          clearInterval(t);
          alert('WhatsApp conectado com sucesso!');
        }
      } catch (e) {
        console.error(e);
      }
    }, 5000);

    return () => clearInterval(t);
  }, [whatsappStatus.qrcode, whatsappStatus.connected, currentUser]);

  const loadUsers = async () => {
    try {
      const r = await fetch('/api/users');
      const d = await r.json();
      if (d.data) {
        setUsers(d.data);
        const stored = localStorage.getItem('currentUser');
        let sessionTenantId = '00000000-0000-0000-0000-000000000001';
        let sessionUserId = '';
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.tenant_id) sessionTenantId = parsed.tenant_id;
            if (parsed.id) sessionUserId = parsed.id;
          } catch {}
        }

        const found = d.data.find((u: any) => u.id === sessionUserId);
        if (found) {
          const updated = { ...found, tenant_id: sessionTenantId };
          setCurrentUser(updated);
          localStorage.setItem('userRole', updated.role);
          checkWhatsappStatus(updated.tenant_id);
          loadTenantSettings(updated.tenant_id);
        } else if (d.data.length > 0) {
          const updated = { ...d.data[0], tenant_id: sessionTenantId };
          setCurrentUser(updated);
          localStorage.setItem('userRole', updated.role);
          localStorage.setItem('currentUser', JSON.stringify(updated));
          checkWhatsappStatus(updated.tenant_id);
          loadTenantSettings(updated.tenant_id);
        }
      }
    } catch {}
  };

  useEffect(() => {
    // Load channels
    fetch('/api/crm/conversations?type=channels')
      .then(r => r.json())
      .then(d => { if (d.data) setChannels(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Load users
    loadUsers();
  }, []);

  const connectMeta = async (provider: string) => {
    const tenantId = currentUser?.tenant_id || '00000000-0000-0000-0000-000000000001';
    try {
      const res = await fetch(`/api/meta/oauth?tenant_id=${tenantId}&provider=${provider}&check=true`);
      const data = await res.json();
      if (!res.ok || !data.configured) {
        alert('A integração com Instagram/Facebook via Meta Graph API não está configurada neste servidor (META_APP_ID ausente).');
        return;
      }
      window.location.href = `/api/meta/oauth?tenant_id=${tenantId}&provider=${provider}`;
    } catch (e) {
      alert('Erro ao verificar configuração da integração Meta.');
    }
  };

  const handleSaveUser = async () => {
    if (!uName.trim() || !uEmail.trim() || (!editUser && !uPassword.trim())) return;
    const body: any = {
      id: editUser?.id,
      name: uName.trim(),
      email: uEmail.trim(),
      role: uRole
    };
    if (uPassword.trim()) {
      body.password = uPassword.trim();
    }
    const method = editUser ? 'PUT' : 'POST';
    const r = await fetch('/api/users', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (r.ok) {
      setUserModal(false);
      setEditUser(null);
      setUName('');
      setUEmail('');
      setUPassword('');
      setURole('vendedor');
      loadUsers();
    } else {
      const d = await r.json();
      alert(d.error || 'Erro ao salvar usuário');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Deseja realmente excluir este usuário?')) return;
    const r = await fetch('/api/users?id=' + id, { method: 'DELETE' });
    if (r.ok) loadUsers();
  };

  const loadTenantSettings = async (tId: string) => {
    try {
      const res = await fetch('/api/tenant', {
        headers: { 'x-tenant-id': tId }
      });
      const d = await res.json();
      if (d.data) {
        setSettings({
          tenantName: d.data.name || '',
          timezone: d.data.timezone || 'America/Sao_Paulo',
          language: d.data.language || 'pt-BR'
        });
        const sc = d.data.storage_config || { provider: 'supabase' };
        setStorageProvider(sc.provider || 'supabase');
        if (sc.gcs) {
          setGcsBucketName(sc.gcs.bucketName || '');
          setGcsProjectId(sc.gcs.projectId || '');
          setGcsClientEmail(sc.gcs.clientEmail || '');
          setGcsPrivateKey(sc.gcs.privateKey || '');
        } else {
          setGcsBucketName('');
          setGcsProjectId('');
          setGcsClientEmail('');
          setGcsPrivateKey('');
        }
      }
    } catch (e) {
      console.error('Erro ao carregar configurações do tenant:', e);
    }
  };

  const handleSaveGeneralSettings = async () => {
    if (!currentUser) return;
    setSavingSettings(true);
    try {
      const res = await fetch('/api/tenant', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': currentUser.tenant_id
        },
        body: JSON.stringify({
          name: settings.tenantName,
          timezone: settings.timezone,
          language: settings.language,
          storage_config: {
            provider: storageProvider,
            gcs: {
              bucketName: gcsBucketName,
              projectId: gcsProjectId,
              clientEmail: gcsClientEmail,
              privateKey: gcsPrivateKey
            }
          }
        })
      });
      if (res.ok) {
        alert('Configurações gerais salvas com sucesso!');
      } else {
        const err = await res.json();
        alert('Erro ao salvar configurações: ' + (err.error || 'Erro desconhecido'));
      }
    } catch (e) {
      alert('Erro ao se conectar com o servidor.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveStorageConfig = async () => {
    if (!currentUser) return;
    if (storageProvider === 'gcs') {
      if (!gcsBucketName.trim() || !gcsProjectId.trim() || !gcsClientEmail.trim() || !gcsPrivateKey.trim()) {
        alert('Todos os campos do Google Cloud Storage são obrigatórios.');
        return;
      }
    }
    setSavingStorage(true);
    try {
      const res = await fetch('/api/tenant', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': currentUser.tenant_id
        },
        body: JSON.stringify({
          name: settings.tenantName,
          timezone: settings.timezone,
          language: settings.language,
          storage_config: {
            provider: storageProvider,
            gcs: {
              bucketName: gcsBucketName.trim(),
              projectId: gcsProjectId.trim(),
              clientEmail: gcsClientEmail.trim(),
              privateKey: gcsPrivateKey.trim()
            }
          }
        })
      });
      if (res.ok) {
        alert('Configurações de armazenamento salvas com sucesso!');
      } else {
        const err = await res.json();
        alert('Erro ao salvar configurações: ' + (err.error || 'Erro desconhecido'));
      }
    } catch (e) {
      alert('Erro ao se conectar com o servidor.');
    } finally {
      setSavingStorage(false);
    }
  };

  const handleSwitchSimulatorUser = (userId: string) => {
    const found = users.find(u => u.id === userId);
    if (found) {
      setCurrentUser(found);
      localStorage.setItem('userRole', found.role);
      localStorage.setItem('currentUser', JSON.stringify(found));
      window.dispatchEvent(new Event('storage'));
      checkWhatsappStatus(found.tenant_id || '00000000-0000-0000-0000-000000000001');
      loadTenantSettings(found.tenant_id || '00000000-0000-0000-0000-000000000001');
      alert(`Perfil simulado alterado para: ${found.name} (${found.role === 'admin' ? 'Administrador' : 'Vendedor'})`);
    }
  };

  return (
    <div className="max-w-4xl pb-12 font-sans text-gray-800">
      <h1 className="text-2xl font-bold mb-6">Configurações do Sistema</h1>

      {/* Simulator Card */}
      <div className="bg-gradient-to-r from-blue-500 to-[#0084c7] text-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="font-bold text-lg mb-2">Simulador de Perfil de Acesso (Teste)</h2>
        <p className="text-xs text-blue-100 mb-4 max-w-2xl">
          Use esta ferramenta para alternar o usuário conectado. Perfis marcados como **Vendedor** ocultarão as opções de configuração e só terão acesso às abas de atendimento/agendamentos/campanhas/contatos.
        </p>
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold">Simular como:</label>
          <select
            value={currentUser?.id || ''}
            onChange={e => handleSwitchSimulatorUser(e.target.value)}
            className="bg-white text-gray-800 border border-blue-200 rounded-lg px-3 py-2 text-sm outline-none font-medium min-w-[240px]"
          >
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role === 'admin' ? 'Admin' : 'Vendedor'})
              </option>
            ))}
          </select>
          {currentUser && (
            <span className={`text-xs font-bold uppercase px-3 py-1.5 rounded-full ${currentUser.role === 'admin' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
              Ativo: {currentUser.role}
            </span>
          )}
        </div>
      </div>

      {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('meta_connected') === 'ok' && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          Redes sociais conectadas com sucesso!
        </div>
      )}

      {/* General Settings */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="font-bold text-base text-gray-800 mb-4">Geral</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Nome da Empresa</label>
            <input type="text" value={settings.tenantName} onChange={e=>setSettings(p=>({...p, tenantName: e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Fuso Horário</label>
            <select value={settings.timezone} onChange={e=>setSettings(p=>({...p, timezone: e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20 bg-white">
              <option value="America/Sao_Paulo">América/São Paulo (GMT-3)</option>
              <option value="America/Manaus">América/Manaus (GMT-4)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Idioma</label>
            <select value={settings.language} onChange={e=>setSettings(p=>({...p, language: e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20 bg-white">
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end pt-2 border-t border-gray-50">
          <button
            onClick={handleSaveGeneralSettings}
            disabled={savingSettings}
            className="bg-[#0084c7] hover:bg-[#0070b0] text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition disabled:opacity-60"
          >
            {savingSettings ? 'Salvando...' : 'Salvar Configurações Gerais'}
          </button>
        </div>
      </div>

      {/* Storage Settings */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="font-bold text-base text-gray-800 mb-1">Configurações de Armazenamento</h2>
        <p className="text-xs text-gray-400 mb-4">Escolha onde serão armazenadas as fotos de produtos cadastradas no sistema.</p>
        
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <label className="flex items-center gap-2 cursor-pointer bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex-1 hover:bg-gray-100 transition">
              <input
                type="radio"
                name="storageProvider"
                value="supabase"
                checked={storageProvider === 'supabase'}
                onChange={() => setStorageProvider('supabase')}
                className="w-4 h-4 accent-[#0084c7]"
              />
              <div>
                <span className="text-sm font-semibold text-gray-800 block">Supabase Storage (Padrão)</span>
                <span className="text-xs text-gray-400">Armazena no bucket de mídia integrado ao sistema.</span>
              </div>
            </label>
            <label className="flex items-center gap-2 cursor-pointer bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex-1 hover:bg-gray-100 transition">
              <input
                type="radio"
                name="storageProvider"
                value="gcs"
                checked={storageProvider === 'gcs'}
                onChange={() => setStorageProvider('gcs')}
                className="w-4 h-4 accent-[#0084c7]"
              />
              <div>
                <span className="text-sm font-semibold text-gray-800 block">Google Cloud Storage (GCS)</span>
                <span className="text-xs text-gray-400">Armazena em um bucket de sua propriedade.</span>
              </div>
            </label>
          </div>

          {storageProvider === 'gcs' && (
            <div className="border border-gray-150 rounded-xl p-4 bg-gray-50/50 space-y-4 animate-fadeIn">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Credenciais do Google Cloud Storage</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Nome do Bucket (GCS Bucket Name)</label>
                  <input
                    type="text"
                    value={gcsBucketName}
                    onChange={e => setGcsBucketName(e.target.value)}
                    placeholder="Ex: meu-bucket-produtos"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-white focus:ring-2 focus:ring-[#0084c7]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">ID do Projeto (GCP Project ID)</label>
                  <input
                    type="text"
                    value={gcsProjectId}
                    onChange={e => setGcsProjectId(e.target.value)}
                    placeholder="Ex: academic-atlas-245709"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-white focus:ring-2 focus:ring-[#0084c7]/20"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">E-mail da Conta de Serviço (Client Email)</label>
                  <input
                    type="email"
                    value={gcsClientEmail}
                    onChange={e => setGcsClientEmail(e.target.value)}
                    placeholder="Ex: storage-user@project.iam.gserviceaccount.com"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-white focus:ring-2 focus:ring-[#0084c7]/20"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Chave Privada (Private Key)</label>
                  <textarea
                    value={gcsPrivateKey}
                    onChange={e => setGcsPrivateKey(e.target.value)}
                    placeholder="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----"
                    rows={4}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none bg-white focus:ring-2 focus:ring-[#0084c7]/20 font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-50 mt-4">
          <button
            onClick={handleSaveStorageConfig}
            disabled={savingStorage}
            className="bg-[#0084c7] hover:bg-[#0070b0] text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition disabled:opacity-60"
          >
            {savingStorage ? 'Salvando...' : 'Salvar Configurações de Armazenamento'}
          </button>
        </div>
      </div>

      {/* Team / Users Management */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-base text-gray-800">Membros da Equipe</h2>
            <p className="text-xs text-gray-400 mt-0.5">Gerencie os usuários do sistema e defina seus papéis (Admin / Vendedor).</p>
          </div>
          <button
            onClick={() => {
              setEditUser(null);
              setUName('');
              setUEmail('');
              setUPassword('');
              setURole('vendedor');
              setUserModal(true);
            }}
            className="bg-[#0084c7] hover:bg-[#0070b0] text-white font-semibold text-xs px-4 py-2 rounded-lg transition"
          >
            + Cadastrar Usuário
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 text-xs font-semibold uppercase">
                <th className="py-3 px-2">Nome</th>
                <th className="py-3 px-2">E-mail</th>
                <th className="py-3 px-2">Perfil</th>
                <th className="py-3 px-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/50">
                  <td className="py-3.5 px-2 font-semibold text-gray-800">{u.name}</td>
                  <td className="py-3.5 px-2 text-gray-500 font-mono text-xs">{u.email}</td>
                  <td className="py-3.5 px-2">
                    <select
                      value={u.role}
                      onChange={async (e) => {
                        const newRole = e.target.value as 'admin' | 'vendedor';
                        const r = await fetch('/api/users', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: u.id, name: u.name, email: u.email, role: newRole })
                        });
                        if (r.ok) {
                          loadUsers();
                        } else {
                          const d = await r.json();
                          alert(d.error || 'Erro ao atualizar perfil');
                        }
                      }}
                      className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none bg-white font-semibold text-gray-700 focus:ring-1 focus:ring-[#0084c7]/20"
                    >
                      <option value="admin">Administrador</option>
                      <option value="vendedor">Vendedor</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-2 text-right">
                    <select
                      defaultValue=""
                      onChange={async (e) => {
                        const action = e.target.value;
                        if (action === 'edit') {
                          setEditUser(u);
                          setUName(u.name);
                          setUEmail(u.email);
                          setUPassword('');
                          setURole(u.role);
                          setUserModal(true);
                        } else if (action === 'delete') {
                          await handleDeleteUser(u.id);
                        }
                        e.target.value = '';
                      }}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none bg-white font-semibold text-[#0084c7] focus:ring-1 focus:ring-[#0084c7]/20"
                    >
                      <option value="" disabled>Ações</option>
                      <option value="edit">Editar</option>
                      <option value="delete" disabled={users.length <= 1}>Excluir</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* WhatsApp Connection */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-base text-gray-800">Conexão do WhatsApp</h2>
            <p className="text-xs text-gray-400 mt-0.5">Conecte o número de WhatsApp da sua empresa utilizando a Evolution API.</p>
          </div>
          <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${whatsappStatus.connected ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {whatsappStatus.connected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>

        {whatsappStatus.connected ? (
          <div>
            <p className="text-sm text-gray-600 mb-4">Seu WhatsApp está conectado e pronto para enviar/receber mensagens através da IA.</p>
            <button
              onClick={handleDisconnectWhatsapp}
              disabled={whatsappLoading}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition disabled:opacity-60"
            >
              {whatsappLoading ? 'Desconectando...' : 'Desconectar WhatsApp'}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-4">Gere um QR Code para conectar seu número de WhatsApp escaneando o código abaixo.</p>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <button
                onClick={handleConnectWhatsapp}
                disabled={whatsappLoading}
                className="bg-[#0084c7] hover:bg-[#0070b0] text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition disabled:opacity-60"
              >
                {whatsappLoading ? 'Gerando QR Code...' : whatsappStatus.qrcode ? 'Atualizar QR Code' : 'Gerar QR Code'}
              </button>

              {whatsappStatus.qrcode && (
                <div className="flex flex-col items-center p-4 border border-gray-100 rounded-xl bg-gray-50 shadow-inner">
                  <img
                    src={whatsappStatus.qrcode}
                    alt="Scan me"
                    className="w-48 h-48 object-contain bg-white rounded-lg shadow-sm"
                  />
                  <span className="text-[11px] text-gray-400 mt-2 font-medium animate-pulse text-center max-w-[200px]">
                    Abra o WhatsApp &gt; Aparelhos conectados &gt; Conectar um aparelho
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Connected Channels */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="font-bold text-base text-gray-800 mb-4">Canais Conectados</h2>
        {loading ? (
          <p className="text-gray-400 text-sm">Carregando...</p>
        ) : (
          <div className="space-y-3">
            {channels.length === 0 && (
              <p className="text-gray-400 text-sm italic">Nenhum canal conectado ainda.</p>
            )}
            {channels.map((ch: any) => (
              <div key={ch.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${ch.status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                  <span className="font-semibold text-sm text-gray-800">{ch.channel_name || ch.provider}</span>
                  <span className="text-xs text-gray-400 font-medium">{ch.provider === 'whatsapp' ? 'WhatsApp' : ch.provider === 'instagram' ? 'Instagram' : 'Facebook'}</span>
                </div>
                <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${ch.status === 'connected' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600'}`}>
                  {ch.status === 'connected' ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Social Oauth Connections */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="font-bold text-base text-gray-800 mb-1">Conectar Nova Rede Social</h2>
        <p className="text-xs text-gray-400 mb-4">Conecte suas contas empresariais para centralizar suas conversas no painel do VendaZap 360.</p>
        <div className="flex flex-wrap gap-4">
          <button onClick={() => connectMeta('instagram')} className="flex items-center gap-2 border border-pink-200 text-pink-600 px-6 py-2.5 rounded-xl hover:bg-pink-50 transition text-sm font-semibold">
            Instagram Direct
          </button>
          <button onClick={() => connectMeta('facebook')} className="flex items-center gap-2 border border-blue-200 text-blue-600 px-6 py-2.5 rounded-xl hover:bg-blue-50 transition text-sm font-semibold">
            Facebook Messenger
          </button>
        </div>
      </div>

      {/* Subscription Info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="font-bold text-base text-gray-800 mb-4">Assinatura e Limites</h2>
        <div className="flex justify-between items-center pb-4 border-b border-gray-50 mb-4">
          <div>
            <p className="font-semibold text-sm">Plano Professional</p>
            <p className="text-xs text-gray-400">R$ 297/mês • Cobrança Mensal</p>
          </div>
          <button className="border border-gray-200 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-gray-50 transition">Gerenciar Assinatura</button>
        </div>
        <div className="flex gap-3">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-semibold transition">Fazer Upgrade</button>
          <button className="border border-red-200 text-red-600 hover:bg-red-50 px-5 py-2 rounded-xl text-xs font-semibold transition">Cancelar Plano</button>
        </div>
      </div>

      {/* User Modal */}
      {userModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]" onClick={() => setUserModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-2">
              <h3 className="font-semibold text-lg text-gray-800">{editUser ? 'Editar Usuário' : 'Cadastrar Novo Usuário'}</h3>
              <button onClick={() => setUserModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Nome Completo</label>
                <input
                  type="text"
                  value={uName}
                  onChange={e => setUName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20"
                  placeholder="Ex: Pedro Alvares"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">E-mail (Login de acesso)</label>
                <input
                  type="email"
                  value={uEmail}
                  onChange={e => setUEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20"
                  placeholder="exemplo@vendazap.com"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Senha de Acesso</label>
                <input
                  type="password"
                  value={uPassword}
                  onChange={e => setUPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20"
                  placeholder={editUser ? 'Digite para alterar a senha' : 'Senha de login'}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Perfil de Acesso</label>
                <select
                  value={uRole}
                  onChange={e => setURole(e.target.value as any)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0084c7]/20 bg-white"
                >
                  <option value="admin">Administrador (Acesso Total)</option>
                  <option value="vendedor">Vendedor (Sem Configurações)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setUserModal(false)} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSaveUser} className="flex-1 bg-[#0084c7] text-white rounded-lg py-2 text-sm font-medium hover:bg-[#0070b0]">{editUser ? 'Salvar' : 'Cadastrar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
