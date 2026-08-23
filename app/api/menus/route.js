function pickFirstImage(menu) {
  const images = Array.isArray(menu?.menu_images) ? [...menu.menu_images] : [];
  images.sort((a, b) => Number(a?.sort_order || 0) - Number(b?.sort_order || 0));
  return images[0]?.image_url || null;
}

export async function GET() {
  try {
    const supabaseUrl = process.env.BANNCHANG_SUPABASE_URL;
    const supabaseKey = process.env.BANNCHANG_SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return Response.json(
        {
          ok: false,
          error: 'ยังไม่ได้ตั้ง BANNCHANG_SUPABASE_URL / BANNCHANG_SUPABASE_KEY ใน Vercel',
        },
        { status: 500 }
      );
    }

    const url = new URL('/rest/v1/menu_items', supabaseUrl);
    url.searchParams.set('select', 'id,name,price,category,description,is_available,is_featured,menu_images(image_url,sort_order)');
    url.searchParams.set('is_available', 'eq.true');
    url.searchParams.set('order', 'id.asc');

    const response = await fetch(url, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        { ok: false, error: data?.message || data?.error || 'โหลดเมนูไม่สำเร็จ' },
        { status: response.status }
      );
    }

    const menus = (Array.isArray(data) ? data : []).map((menu) => ({
      id: menu.id,
      name: menu.name,
      price: Number(menu.price || 0),
      category: menu.category || 'อาหาร',
      description: menu.description || '',
      is_featured: menu.is_featured === true,
      image_url: pickFirstImage(menu),
    }));

    return Response.json({ ok: true, menus });
  } catch (error) {
    return Response.json({ ok: false, error: error.message || 'Unexpected error' }, { status: 500 });
  }
}
