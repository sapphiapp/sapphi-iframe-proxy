// api/proxy.js
export default async function handler(req, res) {
  try {
    // Your Lovable custom domain (the real app you want to show)
    const upstream = "https://beta.sapphi.app";

    // Preserve path + query from the incoming request
    // e.g. /api/proxy/foo?x=1 -> https://beta.sapphi.app/foo?x=1
    const [pathname = "", search = ""] = (req.url || "").split("?"); // safer split
    const cleanPath = pathname.replace(/^\/api\/proxy/, "") || "/";
    const targetUrl = upstream + cleanPath + (search ? "?" + search : "");

    // Fetch from upstream; follow redirects
    const r = await fetch(targetUrl, {
      redirect: "follow",
      headers: {
        "User-Agent": req.headers["user-agent"] || "",
        "Accept": req.headers["accept"] || "*/*",
        "Accept-Language": req.headers["accept-language"] || "",
      },
      method: "GET",
    });

    // Copy response body
    const body = await r.arrayBuffer();

    // Copy/normalize headers
    const headers = {};
    r.headers.forEach((v, k) => (headers[k.toLowerCase()] = v));

    // 🔓 Remove frame blockers from upstream
    delete headers["x-frame-options"];
    delete headers["content-security-policy"];

    // Avoid double compression issues when proxying binary/HTML
    delete headers["content-encoding"];

    // ✅ Allow your sites to embed this
    headers["content-security-policy"] =
      "frame-ancestors 'self' https://*.framer.app https://*.framer.website https://sapphi.app https://www.sapphi.app";

    // Open CORS (safe here; you’re proxying public content)
    headers["access-control-allow-origin"] = "*";

    // Forward status + headers
    res.writeHead(r.status, headers);
    res.end(Buffer.from(body));
  } catch (err) {
    console.error("Proxy error:", err);
    res.writeHead(502, { "content-type": "text/plain" });
    res.end("Proxy upstream error.");
  }
}
