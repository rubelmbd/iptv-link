export default async function handler(req, res) {
    const { path } = req.query;
    
    if (!path) {
        return res.status(400).send("Path missing. Use /stream/play/...");
    }

    const baseUrl = "http://163.61.227.29:8000";
    const cleanPath = path.replace(/^\/+/, '');
    const targetUrl = `${baseUrl}/${cleanPath}`;

    try {
        const response = await fetch(targetUrl, {
            headers: {
                // VLC এবং Televizo এর জন্য উপযোগী User-Agent
                'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
                'Accept': '*/*',
                'Connection': 'keep-alive'
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ 
                error: "Source Server Error", 
                status: response.status 
            });
        }

        // গুরুত্বপূর্ণ হেডারস
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');

        // যদি ভিডিও ডাটা (.ts) হয়
        if (cleanPath.endsWith('.ts')) {
            const arrayBuffer = await response.arrayBuffer();
            res.setHeader('Content-Type', 'video/mp2t');
            // ভিডিও ফাইল ক্যাশে করা যেন বাফারিং কম হয়
            res.setHeader('Cache-Control', 'public, max-age=3600'); 
            return res.status(200).send(Buffer.from(arrayBuffer));
        }

        // যদি প্লেলিস্ট (.m3u8) হয়
        const text = await response.text();
        const host = req.headers.host;
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        
        // প্লেলিস্টের ভেতরে থাকা সব লিঙ্ককে ডাইনামিকলি প্রক্সি ইউআরএলে রূপান্তর
        // এখানে Regex আপডেট করা হয়েছে যাতে স্ল্যাশ থাকলেও সমস্যা না হয়
        const fixedContent = text.replace(/http:\/\/163\.61\.227\.29:8000\//g, `${protocol}://${host}/stream/`);

        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl'); // Standard M3U8 MIME
        res.setHeader('Cache-Control', 'no-store'); // প্লেলিস্ট ক্যাশে করা যাবে না
        res.status(200).send(fixedContent);

    } catch (error) {
        res.status(500).json({ error: "Proxy Crash", details: error.message });
    }
}
