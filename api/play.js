// api/stream.js   (অথবা যে ফাইলেই রাখো)
import fetch from 'node-fetch';

export const config = {
  runtime: 'nodejs',          // default হলেও স্পষ্ট করে দিলাম
  maxDuration: 300,           // Vercel Pro/Hobby-তে সর্বোচ্চ যতটা দেওয়া যায় (সেকেন্ড)
};

export default async function handler(req, res) {
  const { path } = req.query;
  if (!path) {
    return res.status(400).json({ error: "Path missing" });
  }

  const baseUrl = "http://163.61.227.29:8000";
  const cleanPath = path.replace(/^\/+/, '');
  const targetUrl = `${baseUrl}/${cleanPath}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,                 // GET/HEAD সাপোর্ট
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 10; SM-G960F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Mobile Safari/537.36',
        'Accept': '*/*',
        'Icy-MetaData': '1',
      },
      // timeout বাদ দিলাম → Vercel নিজে থেকে handle করবে
    });

    if (!response.ok) {
      return res.status(response.status).send(`Upstream error: ${response.statusText}`);
    }

    // CORS হেডার (সবসময় দরকার)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type, Content-Range');

    // OPTIONS preflight
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // .ts → binary video segment
    if (cleanPath.toLowerCase().endsWith('.ts') || cleanPath.includes('.ts?')) {
      res.setHeader('Content-Type', 'video/mp2t');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Transfer-Encoding', 'chunked');

      // node-fetch → body.pipe(res) → Vercel-এ অনেক সময় ঠিক হয় না
      // তাই Readable.fromWeb ব্যবহার করা ভালো
      if (response.body) {
        // Node 18+ এ Readable.fromWeb আছে
        const nodeStream = require('stream').Readable.fromWeb(response.body);
        nodeStream.pipe(res);
      } else {
        res.status(500).send("No response body");
      }
      return;
    }

    // .m3u8 playlist → URL rewrite
    if (cleanPath.toLowerCase().endsWith('.m3u8') || cleanPath.includes('.m3u8?')) {
      let text = await response.text();

      const host = req.headers.host;
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const proxyPrefix = `${protocol}://${host}/api/stream/`;  // ফাংশনের পুরো পাথ দাও

      // সব absolute + relative URL fix
      const fixed = text
        .replace(/http:\/\/163\.61\.227\.29:8000\//g, proxyPrefix)
        .replace(/(?<!:)\/\//g, proxyPrefix)                 // relative //
        .replace(/([^\w])\/([^\/])/g, `$1${proxyPrefix}$2`); // relative /

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'no-cache, no-store');
      return res.status(200).send(fixed);
    }

    // অন্য ফাইল (key, .key ইত্যাদি)
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
    if (response.body) {
      const nodeStream = require('stream').Readable.fromWeb(response.body);
      nodeStream.pipe(res);
    }

  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Proxy error: " + err.message });
  }
}
