import { NextRequest } from 'next/server';

const EVO_BASE = 'https://b2zap-evolution-api.yagj5r.easypanel.host';
const EVO_KEY = '6E2E0D3A6099-4278-AC96-7E140F89A1E8';

export async function GET() {
  try {
    const r = await fetch(EVO_BASE + '/instance/fetchInstances', {
      headers: { 'apikey': EVO_KEY, 'Content-Type': 'application/json' }
    });
    const instances = await r.json();
    return Response.json({ instances });
  } catch (error) {
    return Response.json({ error: (error as Error).message, instances: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, instanceName } = await req.json();

    if (action === 'disconnect') {
      const r = await fetch(EVO_BASE + '/instance/logout/' + instanceName, {
        method: 'DELETE',
        headers: { 'apikey': EVO_KEY, 'Content-Type': 'application/json' }
      });
      const data = await r.json();
      return Response.json({ success: r.ok, data });
    }

    if (action === 'delete') {
      const r = await fetch(EVO_BASE + '/instance/delete/' + instanceName, {
        method: 'DELETE',
        headers: { 'apikey': EVO_KEY, 'Content-Type': 'application/json' }
      });
      const data = await r.json();
      return Response.json({ success: r.ok, data });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
