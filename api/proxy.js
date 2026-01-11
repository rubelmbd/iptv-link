export const config = {
  runtime: 'edge',
};

export default async (request) => {
  const targetBase = "http://163.61.227.29";
  const url = new URL(request.url);
  
  // আসল আইপিটিভি লিঙ্ক তৈরি
  const targetUrl = targetBase + url.pathname + url.search;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": targetBase + "/",
      },
    });

    const contentType = response.headers.get("content-type") || "";

    // যদি m3u8 ফাইল হয়, তবে লিঙ্কগুলো HTTPS ডোমেইন দিয়ে রিপ্লেস করা
    if (url.pathname.endsWith(".m3u8") || contentType.includes("mpegurl")) {
      let text = await response.text();
      const origin = `${url.protocol}//${url.host}/api/proxy`;
      
      // সব http লিঙ্ককে Vercel ডোমেইন দিয়ে রিপ্লেস করা
      const modifiedText = text.replaceAll(targetBase, origin);

      return new Response(modifiedText, {
        headers: {
          "content-type": "application/vnd.apple.mpegurl",
          "access-control-allow-origin": "*",
        },
      });
    }

    // ভিডিও চাঙ্ক (.ts) সরাসরি রিটার্ন করা
    return response;

  } catch (err) {
    return new Response("Error: " + err.message, { status: 500 });
  }
};