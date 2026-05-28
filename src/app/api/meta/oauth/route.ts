import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenant_id');
  const provider = req.nextUrl.searchParams.get('provider') || 'instagram';

  if (!tenantId) {
    return NextResponse.json({ error: 'tenant_id is required' }, { status: 400 });
  }

  const appId = process.env.META_APP_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/meta/callback`;

  if (!appId) {
    return NextResponse.json({ error: 'META_APP_ID not configured' }, { status: 500 });
  }

  const scopes = provider === 'facebook'
    ? 'pages_messaging,pages_show_list,pages_read_engagement'
    : 'instagram_basic,pages_show_list,pages_read_engagement';

  const state = Buffer.from(JSON.stringify({ tenantId, provider })).toString('base64');

  const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scopes}&response_type=code`;

  return NextResponse.redirect(url);
}
