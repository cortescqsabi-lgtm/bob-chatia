import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const stateParam = req.nextUrl.searchParams.get('state');

  if (!code || !stateParam) {
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
  }

  let state: { tenantId: string; provider: string };
  try {
    state = JSON.parse(Buffer.from(stateParam, 'base64').toString());
  } catch {
    return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
  }

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/meta/callback`;

  if (!appId || !appSecret) {
    return NextResponse.json({ error: 'Meta App not configured' }, { status: 500 });
  }

  try {
    const tokenResp = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`);
    const tokenData = await tokenResp.json();

    if (!tokenData.access_token) {
      return NextResponse.json({ error: 'Failed to get access token', details: tokenData }, { status: 400 });
    }

    const longTokenResp = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`);
    const longTokenData = await longTokenResp.json();
    const accessToken = longTokenData.access_token || tokenData.access_token;

    const pagesResp = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`);
    const pagesData = await pagesResp.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      return NextResponse.json({ error: 'No Facebook pages found' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const results = [];

    for (const page of pagesData.data) {
      const channelType = state.provider === 'facebook' ? 'facebook' : 'instagram';

      const { data: existing } = await supabase
        .from('channels')
        .select('id')
        .eq('tenant_id', state.tenantId)
        .eq('channel_name', page.name)
        .maybeSingle();

      if (!existing) {
        await supabase.from('channels').insert({
          tenant_id: state.tenantId,
          provider: channelType,
          channel_name: page.name,
          phone_number: page.id,
          status: 'connected',
          webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/meta/webhook`
        });
      }

      results.push({ page: page.name, id: page.id });
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?meta_connected=ok&pages=${results.length}`);
  } catch (error) {
    return NextResponse.json({ error: 'OAuth failed', message: (error as Error).message }, { status: 500 });
  }
}
