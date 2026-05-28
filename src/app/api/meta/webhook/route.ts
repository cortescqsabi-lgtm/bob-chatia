import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.object === 'whatsapp_v2' || body.entry) {
      return Response.json({ status: 'ok' });
    }
    return Response.json({ status: 'ok' });
  } catch {
    return Response.json({ error: 'Invalid webhook' }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('hub.mode');
  const token = req.nextUrl.searchParams.get('hub.verify_token');
  const challenge = req.nextUrl.searchParams.get('hub.challenge');
  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return Response.json({ error: 'Invalid verification' }, { status: 403 });
}
