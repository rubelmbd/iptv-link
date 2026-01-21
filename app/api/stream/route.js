// app/api/stream/route.js
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  let path = searchParams.get('path');

  if (!path) {
    return NextResponse.json({ error: 'Path missing. Use ?path=...' }, { status: 400 });
  }

  // Clean path (remove leading / and encode if needed)
  path = path.replace(/^\/+/, '');

  const baseUrl = 'http://163.61.227.29:8000';
  const targetUrl = `${baseUrl}/${path}`;

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G960F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Mobile Safari/537.36',
        'Accept': '*/*',
        'Icy-MetaData': '1',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Upstream error: ${res.status}` }, { status: res.status });
    }

    const headers = new Headers(res.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Cache-Control', 'no-cache');

    // IPTV content types
    const lower = path.toLowerCase();
    if (lower.endsWith('.m3u8')) {
      headers.set('Content-Type', 'application/vnd.apple.mpegurl');
    } else if (lower.endsWith('.ts')) {
      headers.set('Content-Type', 'video/mp2t');
    }

    return new NextResponse(res.body, {
      status: res.status,
      headers,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Proxy failed' }, { status: 502 });
  }
}
