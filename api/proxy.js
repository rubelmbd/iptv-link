export const config = {
  runtime: 'edge',
};

export default async (request) => {
  const targetBase = "http://163.61.227.29"; // আপনার IPTV IP
  const url = new URL(request.url);
  
  // আসল লিঙ্কের পাথ তৈরি করা
  const targetUrl = targetBase + url.pathname + url.search;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": targetBase + "/",
        "X-Forwarded-For": "103.145.2.20" // বাংলাদেশি আইপি মাস্কিং
      }
    });

    if (!response.ok) {
      return new Response(`IPTV Server Response Error: ${response.status}`, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "";

    // যদি m3u8 ফাইল হয় তবে ভিতরের লিঙ্ক পরিবর্তন
    if (url.pathname.endsWith(".m3u8") || contentType.includes("mpegurl")) {
      let text = await response.text();
      const origin = `${url.protocol}//${url.host}`;
      
      // গুরুত্বপূর্ণ: এই লাইনটি আপনার Mixed Content এরর দূর করবে
      const modifiedText = text.split(targetBase).join(origin);

      return new Response(modifiedText, {
        headers: {
          "content-type": "application/vnd.apple.mpegurl",
          "access-control-allow-origin": "*",
          "cache-control": "no-cache"
        },
      });
    }

    // ভিডিও চাঙ্ক সরাসরি পাস করা
    return response;

  } catch (err) {
    // এই এরর মেসেজটি আপনাকে বলবে আসলে কী সমস্যা হচ্ছে
    return new Response("Proxy Connection Failed: " + err.message, { status: 500 });
  }
};
