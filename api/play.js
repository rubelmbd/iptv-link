export default async function handler(req, res) {
    // ডাইনামিক পাথ সংগ্রহ (যেমন: play/a03p/index.m3u8)
    const { path } = req.query;
    
    if (!path) {
        return res.status(400).send("Path missing. Use /stream/play/...");
    }

    const baseUrl = "http://163.61.227.29:8000";
    // পাথের শুরুর অপ্রয়োজনীয় স্ল্যাশ পরিষ্কার করা
    const cleanPath = path.replace(/^\/+/, '');
    const targetUrl = `${baseUrl}/${cleanPath}`;

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': baseUrl
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ 
                error: "Source Server Error", 
                status: response.status,
                requestedUrl: targetUrl 
            });
        }

        // CORS Headers সেট করা যাতে আপনার ওয়েবসাইট থেকে প্লে হয়
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');

        // যদি এটি ভিডিও ফাইল (.ts) হয়
        if (cleanPath.endsWith('.ts')) {
            const arrayBuffer = await response.arrayBuffer();
            res.setHeader('Content-Type', 'video/mp2t');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            return res.status(200).send(Buffer.from(arrayBuffer));
        }

        // যদি এটি প্লেলিস্ট (.m3u8) হয়
        const text = await response.text();
        const host = req.headers.host;
        
        // প্লেলিস্টের ভেতরের সব HTTP লিঙ্ককে আমাদের প্রক্সির মাধ্যমে ঘুরিয়ে দেওয়া
        // এটি Mixed Content সমস্যার চূড়ান্ত সমাধান
        const fixedContent = text.replace(/http:\/\/163\.61\.227\.29:8000\//g, `https://${host}/stream/`);

        res.setHeader('Content-Type', 'application/x-mpegURL');
        res.status(200).send(fixedContent);

    } catch (error) {
        res.status(500).json({ error: "Proxy Crash", details: error.message });
    }
}