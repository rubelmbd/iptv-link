import fetch from 'node-fetch';

export default async function handler(req, res) {
    // ডাইনামিক পাথ সংগ্রহ (যেমন: play/a03p/index.m3u8)
    const { path } = req.query;
    
    if (!path) {
        return res.status(400).send("Path missing");
    }

    const baseUrl = "http://163.61.227.29:8000";
    const targetUrl = `${baseUrl}/${path}`;

    try {
        const response = await fetch(targetUrl, {
            headers: { 'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18' }
        });

        // CORS হেডার সেট করা
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');

        // যদি এটি ভিডিও ফাইল (.ts) হয়, তবে সরাসরি স্ট্রিম করুন
        if (path.endsWith('.ts')) {
            res.setHeader('Content-Type', 'video/mp2t');
            return response.body.pipe(res);
        }

        // যদি এটি m3u8 ফাইল হয়, তবে ভেতরের লিঙ্কগুলো ঠিক করতে হবে
        const text = await response.text();
        const host = req.headers.host;
        
        // ভেতরের সব লিঙ্ককে আমাদের প্রক্সির মাধ্যমে ঘুরিয়ে দেওয়া
        // এটি Mixed Content এর স্থায়ী সমাধান
        const fixedContent = text.replace(/http:\/\/163\.61\.227\.29:8000\//g, `https://${host}/stream/`);

        res.setHeader('Content-Type', 'application/x-mpegURL');
        res.status(200).send(fixedContent);

    } catch (error) {
        res.status(500).send("Proxy Error: " + error.message);
    }
}
