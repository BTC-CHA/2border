export async function POST(request) {
  try {
    const { message } = await request.json();

    if (!message || !message.trim()) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    const pageId = process.env.FACEBOOK_PAGE_ID;
    const pageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

    if (!pageId || !pageToken) {
      return Response.json(
        { error: 'Facebook environment variables are not configured' },
        { status: 500 }
      );
    }

    const body = new URLSearchParams();
    body.set('message', message.trim());
    body.set('access_token', pageToken);

    const response = await fetch(`https://graph.facebook.com/v26.0/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: data?.error?.message || 'Facebook API request failed', details: data?.error || null },
        { status: response.status }
      );
    }

    return Response.json({ ok: true, id: data.id });
  } catch (error) {
    return Response.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
}
