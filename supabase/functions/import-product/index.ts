// Supabase Edge Function: import-product
// Fetches public product metadata (Open Graph / JSON-LD Product schema).
// It does not bypass logins, CAPTCHAs, anti-bot systems, or supplier restrictions.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function meta(html: string, key: string) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, "i"),
  ];
  for (const p of patterns) { const m = html.match(p); if (m?.[1]) return decode(m[1]); }
  return "";
}
function decode(s: string) {
  return s.replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'")
    .replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n)));
}
function productNode(node: any): any {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) { for (const n of node) { const found=productNode(n); if(found)return found; } return null; }
  const type = node["@type"];
  if ((Array.isArray(type) ? type : [type]).some((t:any)=>String(t).toLowerCase()==="product")) return node;
  if (node["@graph"]) return productNode(node["@graph"]);
  return null;
}
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({error:"POST required"}), {status:405,headers:{...cors,"Content-Type":"application/json"}});
  try {
    const body = await req.json();
    const url = new URL(String(body.url || ""));
    if (!["http:","https:"].includes(url.protocol)) throw new Error("Only http/https product URLs are supported.");
    const allowedHosts = ["meesho.com","flipkart.com","amazon.in","amazon.com"];
    if (!allowedHosts.some((host) => url.hostname === host || url.hostname.endsWith("."+host))) {
      throw new Error("Supported supplier URLs: Meesho, Flipkart, and Amazon.");
    }
    const response = await fetch(url.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; OGWorldProductImporter/1.0)", "Accept": "text/html,application/xhtml+xml" },
      redirect: "error",
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error(`Supplier page returned HTTP ${response.status}. It may block automated access.`);
    const html = (await response.text()).slice(0, 2_500_000);
    const scripts = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    let product:any = null;
    for (const match of scripts) { try { product = productNode(JSON.parse(match[1])); if(product) break; } catch {} }
    const offers = Array.isArray(product?.offers) ? product.offers[0] : product?.offers;
    const image = Array.isArray(product?.image) ? product.image[0] : product?.image;
    const host = url.hostname.toLowerCase();
    const source_name = host.includes("meesho") ? "Meesho" : host.includes("flipkart") ? "Flipkart" : "Other";
    const name = product?.name || meta(html,"og:title") || meta(html,"twitter:title");
    const description = product?.description || meta(html,"og:description") || meta(html,"description");
    const rawImage = image?.url || image || meta(html,"og:image") || meta(html,"twitter:image");
    const rawPrice = offers?.price || offers?.lowPrice || "";
    const price = Number(String(rawPrice).replace(/[^\d.]/g,""));
    return new Response(JSON.stringify({
      name: name ? decode(String(name)).trim() : "",
      description: description ? decode(String(description)).trim() : "",
      image_url: rawImage ? new URL(String(rawImage), response.url).toString() : "",
      source_cost: Number.isFinite(price) && price > 0 ? price : null,
      source_name,
      supplier_page: response.url,
    }), { headers: {...cors,"Content-Type":"application/json"} });
  } catch (e) {
    return new Response(JSON.stringify({error:e instanceof Error ? e.message : "Could not import this product URL."}), {status:400,headers:{...cors,"Content-Type":"application/json"}});
  }
});
