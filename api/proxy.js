export default async function handler(req, res) {
  const upstream = "https://beta.sapphi.app"; // your Lovable custom domain
  const url = `${upstream}${req.url.replace("/api/proxy", "")}`;

  const r = await fetch(url, {
    headers: {
      "User-Agent": req.headers["user-agent"] || "",
      "Accept": req.headers["accept"] || "*/*",
    },
  });

  const body = await r.arrayBuffer();
  const headers = {};
  r.headers.forEach((v, k) => (headers[k.toLowerCase()] = v));

  // Remove frame blockers
  delete headers["x-frame-options"];
  headers["content-security-policy"] =
    "frame-ancestors 'self' https://*.framer.app https://*.framer.website https://sapphi.app https://www.sapphi.app";

  headers["access-control-allow-origin"] = "*";

  res.writeHead(r.status, headers);
  res.end(Buffer.from(body));
}
