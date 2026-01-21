// app/api/stream/route.js
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  let path = searchParams.get('path');

  if (!path) {
    return NextResponse.json({ error: 'Path missing' }, { status: 400 });
  }

  path = path.replace(/^\/+/, '');
  const baseUrl = 'http://163.61.227.29:8000';
  const targetUrl = `${baseUrl}/${path}`;

  try {
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G960F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Mobile Safari/537.36',
        'Accept': '*/*',
        'Icy-MetaData': '1',
      },
      redirect: 'follow',
    });

    if (!upstreamRes.ok) {
      return NextResponse.json(
        { error: `Upstream: ${upstreamRes.status}` },
        { status: upstreamRes.status }
      );
    }

    const headers = new Headers(upstreamRes.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Cache-Control', 'no-cache, no-store');

    if (path.toLowerCase().endsWith('.ts')) {
      headers.set('Content-Type', 'video/mp2t');
    } else if (path.toLowerCase().endsWith('.m3u8')) {
      headers.set('Content-Type', 'application/vnd.apple.mpegurl');
    }

    return new NextResponse(upstreamRes.body, { status: upstreamRes.status, headers });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }
}
