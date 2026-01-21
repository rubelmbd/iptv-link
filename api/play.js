export default async function handler(req, res) {
    const { path } = req.query;
    if (!path) return res.status(400).send("Path missing");

    const baseUrl = "http://163.61.227.29:8000";
    const cleanPath = path.replace(/^\/+/, '');
    const targetUrl = `${baseUrl}/${cleanPath}`;

    // ১. ভিডিও ফাইল (.ts) হলে সরাসরি রিডাইরেক্ট করুন
    if (cleanPath.endsWith('.ts')) {
        return res.redirect(301, targetUrl);
    }

    try {
        const response = await fetch(targetUrl, {
            headers: { 'User-Agent': 'VLC/3.0.18' }
        });

        if (!response.ok) return res.status(response.status).send("Server Error");

        // ২. মেইন ফাইল (.m3u8) হলে এর ভেতরের লিঙ্কগুলো ফিক্স করুন
        let text = await response.text();
        const host = req.headers.host;

        // এটি সব HTTP লিঙ্ককে আপনার Vercel HTTPS লিঙ্কে কনভার্ট করবে
        const fixedContent = text.replace(/http:\/\/163\.61\.227\.29:8000\//g, `https://${host}/stream/`);

        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).send(fixedContent);

    } catch (error) {
        res.status(500).send("Crash: " + error.message);
    }
}
