import fetch from 'node-fetch';

export default async function handler(req, res) {
    const { path } = req.query;
    if (!path) return res.status(400).send("Path missing");

    const baseUrl = "http://163.61.227.29:8000";
    const cleanPath = path.replace(/^\/+/, '');
    const targetUrl = `${baseUrl}/${cleanPath}`;

    try {
        const response = await fetch(targetUrl, {
            headers: {
                // Televizo এবং অন্যান্য অ্যাপের জন্য এই User-Agent টি খুব কার্যকর
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G960F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Mobile Safari/537.36',
                'Accept': '*/*',
                'Icy-MetaData': '1' // কিছু IPTV সার্ভারের জন্য এটি প্রয়োজন হয়
            },
            timeout: 10000 // ১০ সেকেন্ড ওয়েট করবে
        });

        // CORS এবং অ্যাপের জন্য প্রয়োজনীয় হেডার
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type');

        if (cleanPath.endsWith('.ts')) {
            // ভিডিও ফাইলের ক্ষেত্রে Content-Type খুব গুরুত্বপূর্ণ
            res.setHeader('Content-Type', 'video/mp2t');
            res.setHeader('Connection', 'keep-alive');
            return response.body.pipe(res);
        }

        if (cleanPath.endsWith('.m3u8')) {
            let text = await response.text();
            const host = req.headers.host;
            const protocol = 'https'; // Vercel সবসময় https ব্যবহার করে
            
            // সব লিঙ্ক পরিবর্তন করা
            const fixedContent = text.replace(/http:\/\/163\.61\.227\.29:8000\//g, `${protocol}://${host}/stream/`);

            // মিম টাইপ পরিবর্তন (এটি Televizo-র জন্য খুব জরুরি)
            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
            return res.status(200).send(fixedContent);
        }

    } catch (error) {
        res.status(500).send("Error: " + error.message);
    }
}
