// app/api/stream/route.js
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';  // caching বন্ধ রাখে
export const maxDuration = 300;           // Pro plan-এ কাজ করে, Hobby-তে partial

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  let path = searchParams.get('path');

  if (!path) {
    return NextResponse.json({ error: 'Path missing' }, { status: 400 });
  }

  path = path.replace(/^\/+/, '');  // leading / remove
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
        { error: `Upstream failed: ${upstreamRes.status} ${upstreamRes.statusText}` },
        { status: upstreamRes.status }
      );
    }

    // Headers setup
    const headers = new Headers(upstreamRes.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Expose-Headers', 'Content-Length, Content-Type');
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Connection', 'keep-alive');

    // IPTV-specific Content-Type
    const lowerPath = path.toLowerCase();
    if (lowerPath.endsWith('.ts') || lowerPath.includes('.ts?')) {
      headers.set('Content-Type', 'video/mp2t');
    } else if (lowerPath.endsWith('.m3u8') || lowerPath.includes('.m3u8?')) {
      headers.set('Content-Type', 'application/vnd.apple.mpegurl');
    }

    // Direct stream proxy (no buffering)
    return new NextResponse(upstreamRes.body, {
      status: upstreamRes.status,
      headers,
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: error.message || 'Proxy failed' }, { status: 502 });
  }
}