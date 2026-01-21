export default async function handler(req, res) {
    const { path } = req.query;
    
    if (!path) {
        return res.status(400).send("Path missing");
    }

    const baseUrl = "http://163.61.227.29:8000";
    // Path-এর শুরুতে যদি / থাকে তবে তা সরিয়ে ফেলা
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    const targetUrl = `${baseUrl}/${cleanPath}`;

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Referer': baseUrl,
                'Origin': baseUrl
            }
        });

        if (!response.ok) {
            // যদি ৪MD বা অন্য কোনো এরর আসে তবে সেটি ডিটেইলসহ দেখাবে
            return res.status(response.status).json({ 
                error: "Source Server Error", 
                status: response.status,
                requestedUrl: targetUrl 
            });
        }

        res.setHeader('Access-Control-Allow-Origin', '*');
        
        // .ts ভিডিও ফাইল হলে
        if (cleanPath.endsWith('.ts')) {
            const arrayBuffer = await response.arrayBuffer();
            res.setHeader('Content-Type', 'video/mp2t');
            return res.status(200).send(Buffer.from(arrayBuffer));
        }

        // .m3u8 প্লেলিস্ট হলে
        const text = await response.text();
        const host = req.headers.host;
        
        // সব লিঙ্ককে HTTPS প্রক্সি লিঙ্কে রূপান্তর
        const fixedContent = text.replace(/http:\/\/163\.61\.227\.29:8000\//g, `https://${host}/stream/`);

        res.setHeader('Content-Type', 'application/x-mpegURL');
        res.status(200).send(fixedContent);

    } catch (error) {
        res.status(500).json({ error: "Proxy Crash", details: error.message });
    }
}
