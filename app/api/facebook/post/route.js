async function resolvePageToken(configuredToken, pageId) {
  const meRes = await fetch(
    `https://graph.facebook.com/v26.0/me?fields=id,name&access_token=${encodeURIComponent(configuredToken)}`,
    { cache: 'no-store' }
  );
  const me = await meRes.json();

  if (meRes.ok && String(me.id) === String(pageId)) {
    return { token: configuredToken, source: 'page-token', identity: me };
  }

  const accountsRes = await fetch(
    `https://graph.facebook.com/v26.0/me/accounts?fields=id,name,access_token&access_token=${encodeURIComponent(configuredToken)}`,
    { cache: 'no-store' }
  );
  const accounts = await accountsRes.json();

  if (!accountsRes.ok) {
    const message = accounts?.error?.message || me?.error?.message || 'Unable to resolve Facebook Page token';
    throw new Error(message);
  }

  const page = (accounts.data || []).find((item) => String(item.id) === String(pageId));
  if (!page?.access_token) {
    throw new Error('Configured Facebook token cannot access the selected Page');
  }

  return { token: page.access_token, source: 'derived-from-user-token', identity: { id: page.id, name: page.name } };
}

export async function POST(request) {
  try {
    const { message } = await request.json();

    if (!message || !message.trim()) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    const pageId = process.env.FACEBOOK_PAGE_ID;
    const configuredToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

    if (!pageId || !configuredToken) {
      return Response.json(
        { error: 'Facebook environment variables are not configured' },
        { status: 500 }
      );
    }

    const resolved = await resolvePageToken(configuredToken, pageId);

    const body = new URLSearchParams();
    body.set('message', message.trim());
    body.set('access_token', resolved.token);

    const response = await fetch(`https://graph.facebook.com/v26.0/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        {
          error: data?.error?.message || 'Facebook API request failed',
          details: data?.error || null,
          tokenSource: resolved.source,
          tokenIdentity: resolved.identity,
        },
        { status: response.status }
      );
    }

    return Response.json({
      ok: true,
      id: data.id,
      tokenSource: resolved.source,
      tokenIdentity: resolved.identity,
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
}
