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
    const pageId = process.env.FACEBOOK_PAGE_ID;
    const configuredToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

    if (!pageId || !configuredToken) {
      return Response.json({ error: 'Facebook environment variables are not configured' }, { status: 500 });
    }

    const contentType = request.headers.get('content-type') || '';
    let cleanMessage = '';
    let cleanImageUrl = '';
    let imageFile = null;

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      cleanMessage = String(form.get('message') || '').trim();
      const candidate = form.get('image');
      if (candidate && typeof candidate !== 'string' && candidate.size > 0) {
        imageFile = candidate;
      }
    } else {
      const json = await request.json();
      cleanMessage = String(json.message || '').trim();
      cleanImageUrl = String(json.imageUrl || '').trim();
    }

    if (!cleanMessage && !cleanImageUrl && !imageFile) {
      return Response.json({ error: 'Message or image is required' }, { status: 400 });
    }

    const resolved = await resolvePageToken(configuredToken, pageId);
    let response;
    let type;

    if (imageFile) {
      const graphForm = new FormData();
      graphForm.append('access_token', resolved.token);
      graphForm.append('published', 'true');
      if (cleanMessage) graphForm.append('caption', cleanMessage);
      graphForm.append('source', imageFile, imageFile.name || 'upload.jpg');

      response = await fetch(`https://graph.facebook.com/v26.0/${pageId}/photos`, {
        method: 'POST',
        body: graphForm,
        cache: 'no-store',
      });
      type = 'photo';
    } else {
      const body = new URLSearchParams();
      body.set('access_token', resolved.token);

      let endpoint;
      if (cleanImageUrl) {
        endpoint = `https://graph.facebook.com/v26.0/${pageId}/photos`;
        body.set('url', cleanImageUrl);
        body.set('published', 'true');
        if (cleanMessage) body.set('caption', cleanMessage);
        type = 'photo';
      } else {
        endpoint = `https://graph.facebook.com/v26.0/${pageId}/feed`;
        body.set('message', cleanMessage);
        type = 'text';
      }

      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        cache: 'no-store',
      });
    }

    const data = await response.json();

    if (!response.ok) {
      return Response.json({
        error: data?.error?.message || 'Facebook API request failed',
        details: data?.error || null,
        tokenSource: resolved.source,
        tokenIdentity: resolved.identity,
      }, { status: response.status });
    }

    return Response.json({
      ok: true,
      type,
      id: data.post_id || data.id || null,
      result: data,
      tokenSource: resolved.source,
      tokenIdentity: resolved.identity,
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
}
