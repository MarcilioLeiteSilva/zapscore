import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  try {
    const origin = new URL(url).origin;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
        'Referer': origin,
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });

    if (response.ok) {
      const contentType = response.headers.get('content-type') || 'image/png';
      const buffer = await response.arrayBuffer();

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
      });
    }

    // Fallback: proxy central da API Zapscore (NestJS)
    const backendProxyUrl = `https://zapscore-zapscore-api.gtalg3.easypanel.host/news/proxy-image?url=${encodeURIComponent(url)}`;
    const backendRes = await fetch(backendProxyUrl);
    if (backendRes.ok) {
      const ct = backendRes.headers.get('content-type') || 'image/png';
      const buf = await backendRes.arrayBuffer();
      return new NextResponse(buf, {
        headers: {
          'Content-Type': ct,
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
      });
    }

    return new NextResponse(`Failed to fetch image: ${response.status}`, { status: response.status });
  } catch (error) {
    // Tentativa final de resiliência via backend NestJS
    try {
      const backendProxyUrl = `https://zapscore-zapscore-api.gtalg3.easypanel.host/news/proxy-image?url=${encodeURIComponent(url)}`;
      const backendRes = await fetch(backendProxyUrl);
      if (backendRes.ok) {
        const ct = backendRes.headers.get('content-type') || 'image/png';
        const buf = await backendRes.arrayBuffer();
        return new NextResponse(buf, {
          headers: {
            'Content-Type': ct,
            'Cache-Control': 'public, max-age=86400, s-maxage=86400',
          },
        });
      }
    } catch (_) {}

    console.error('Proxy image error:', error);
    return new NextResponse('Internal Server Error fetching image', { status: 500 });
  }
}
