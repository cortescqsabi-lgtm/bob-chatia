import { NextRequest } from 'next/server';

const EVO_BASE = 'https://b2zap-evolution-api.yagj5r.easypanel.host';
const EVO_KEY = process.env.EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';
const TENANT_ID = '00000000-0000-0000-0000-000000000001';

async function evoFetch(path: string, options: any = {}) {
  const url = EVO_BASE + path;
  const headers = { 'apikey': EVO_KEY, 'Content-Type': 'application/json', ...options.headers };
  const r = await fetch(url, { ...options, headers });
  const data = await r.json();
  return { status: r.status, data };
}

export async function GET() {
  const { data } = await evoFetch('/instance/fetchInstances');
  const instances = Array.isArray(data) ? data : [];

  const b2zap = instances.find((i: any) => i.name === 'b2zap');
  return Response.json({
    exists: !!b2zap,
    connected: b2zap?.connectionStatus === 'open',
    instance: b2zap || null,
    instances
  });
}

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json();

    if (action === 'connect') {
      const { data: existing } = await evoFetch('/instance/fetchInstances');
      const instances = Array.isArray(existing) ? existing : [];
      let instance = instances.find((i: any) => i.name === 'b2zap');

      if (instance) {
        if (instance.connectionStatus === 'open') {
          await evoFetch('/webhook/set/b2zap', {
            method: 'POST',
            body: JSON.stringify({ webhook: { url: 'https://bob-chatia.vercel.app/api/evolution/webhook', enabled: true } })
          });
          return Response.json({ connected: true, qrcode: null, message: 'Ja conectado' });
        }
        await evoFetch('/instance/delete/b2zap', { method: 'DELETE' });
      }

      const { status, data } = await evoFetch('/instance/create', {
        method: 'POST',
        body: JSON.stringify({
          instanceName: 'b2zap',
          integration: 'WHATSAPP-BAILEYS',
          qrcode: true,
          webhook: { url: 'https://bob-chatia.vercel.app/api/evolution/webhook', enabled: true }
        })
      });

      if (status === 201 && data?.qrcode?.base64) {
        return Response.json({ connected: false, qrcode: data.qrcode.base64, instance: data.instance });
      }

      return Response.json({ error: 'Falha ao criar instancia', details: data }, { status: 500 });
    }

    if (action === 'disconnect') {
      const { status } = await evoFetch('/instance/delete/b2zap', { method: 'DELETE' });
      return Response.json({ disconnected: status === 200 });
    }

    if (action === 'status') {
      const { data: state } = await evoFetch('/instance/connectionState/b2zap');
      return Response.json({ state: state?.instance || null });
    }

    return Response.json({ error: 'Acao desconhecida' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
