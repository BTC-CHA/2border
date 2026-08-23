export async function GET() {
  try {
    const pageId = process.env.FACEBOOK_PAGE_ID;
    const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

    if (!pageId || !token) {
      return Response.json({ ok: false, error: 'Facebook environment variables are not configured' }, { status: 500 });
    }

    const meUrl = new URL('https://graph.facebook.com/v26.0/me');
    meUrl.searchParams.set('fields', 'id,name');
    meUrl.searchParams.set('access_token', token);

    const meRes = await fetch(meUrl, { cache: 'no-store' });
    const me = await meRes.json();

    const pageUrl = new URL(`https://graph.facebook.com/v26.0/${pageId}`);
    pageUrl.searchParams.set('fields', 'id,name');
    pageUrl.searchParams.set('access_token', token);

    const pageRes = await fetch(pageUrl, { cache: 'no-store' });
    const page = await pageRes.json();

    return Response.json({
      ok: meRes.ok && pageRes.ok,
      configuredPageId: pageId,
      tokenIdentity: meRes.ok ? me : null,
      targetPage: pageRes.ok ? page : null,
      tokenMatchesConfiguredPage: meRes.ok ? String(me.id) === String(pageId) : false,
      meError: meRes.ok ? null : me?.error || me,
      pageError: pageRes.ok ? null : page?.error || page,
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message || 'Unexpected error' }, { status: 500 });
  }
}
