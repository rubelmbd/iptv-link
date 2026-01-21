export default async function handler(req, res) {
    // URL থেকে ডাইনামিক পাথ সংগ্রহ করা (যেমন: play/a03p/index.m3u8)
    const { path } = req.query;
    
    if (!path) {
        return res.status(400).send("Path is required");
    }

    // আপনার প্রোভাইডারের বেস URL
    const baseUrl = "http://163.61.227.29:8000";
    const targetUrl = `${baseUrl}/${path}`;

    try {
        const response = await fetch(targetUrl);
        const contentType = response.headers.get('content-type');

        // হেডার সেট করা
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', contentType || 'application/x-mpegURL');

        // যদি এটি m3u8 ফাইল হয়, তবে আমরা সরাসরি ডাটা পাঠাবো
        const data = await response.text();
        res.status(200).send(data);
        
    } catch (error) {
        res.status(500).send("Streaming error: " + error.message);
    }
}
