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

async function uploadPhoto({ pageId, token, message, file }) {
  const graphForm = new FormData();
  graphForm.append('access_token', token);
  graphForm.append('published', 'true');
  if (message) graphForm.append('caption', message);
  graphForm.append('source', file, file.name || 'upload.jpg');

  return fetch(`https://graph.facebook.com/v26.0/${pageId}/photos`, {
    method: 'POST',
    body: graphForm,
    cache: 'no-store',
  });
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
      response = await uploadPhoto({ pageId, token: resolved.token, message: cleanMessage, file: imageFile });
      type = 'photo';
    } else if (cleanImageUrl) {
      let parsed;
      try {
        parsed = new URL(cleanImageUrl);
      } catch {
        return Response.json({ error: 'Image URL is invalid' }, { status: 400 });
      }
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return Response.json({ error: 'Image URL must use http or https' }, { status: 400 });
      }

      const imageRes = await fetch(cleanImageUrl, { cache: 'no-store' });
      if (!imageRes.ok) {
        return Response.json({ error: `Could not download image (${imageRes.status})` }, { status: 400 });
      }

      const mime = imageRes.headers.get('content-type') || 'image/jpeg';
      if (!mime.startsWith('image/')) {
        return Response.json({ error: `URL did not return an image (${mime})` }, { status: 400 });
      }

      const bytes = await imageRes.arrayBuffer();
      const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
      const remoteFile = new File([bytes], `remote-image.${ext}`, { type: mime });
      response = await uploadPhoto({ pageId, token: resolved.token, message: cleanMessage, file: remoteFile });
      type = 'photo';
    } else {
      const body = new URLSearchParams();
      body.set('access_token', resolved.token);
      body.set('message', cleanMessage);

      response = await fetch(`https://graph.facebook.com/v26.0/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        cache: 'no-store',
      });
      type = 'text';
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
