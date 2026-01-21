export default async function handler(req, res) {
    const { path } = req.query;
    
    if (!path) {
        return res.status(400).send("Path missing");
    }

    const baseUrl = "http://163.61.227.29:8000";
    const targetUrl = `${baseUrl}/${path}`;

    try {
        const response = await fetch(targetUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch from source: ${response.status}`);
        }

        // CORS Headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');

        // যদি ভিডিও ফাইল (.ts) হয়
        if (path.endsWith('.ts')) {
            const arrayBuffer = await response.arrayBuffer();
            res.setHeader('Content-Type', 'video/mp2t');
            return res.status(200).send(Buffer.from(arrayBuffer));
        }

        // যদি প্লেলিস্ট (.m3u8) হয়
        const text = await response.text();
        const host = req.headers.host;
        
        // সব HTTP লিঙ্ককে নিজের ডোমেইনের HTTPS লিঙ্কে কনভার্ট করা
        const fixedContent = text.replace(/http:\/\/163\.61\.227\.29:8000\//g, `https://${host}/stream/`);

        res.setHeader('Content-Type', 'application/x-mpegURL');
        res.status(200).send(fixedContent);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Stream Error", details: error.message });
    }
}
