import fs from "fs";
import path from "path";

const URL = "https://v.xiumius.cn/board/v5/7Wp3Z/690652279";
const ARTICLES_PATH = path.join(import.meta.dirname, "../src/generated/vol-01/articles.json");
const TITLE = "践行绿色发展理念，筑牢生态文明意识——参观阿苏卫循环经济园";

function decodeHtml(text: string) {
  return text
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&mdash;/g, "—")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function stripHtml(html: string) {
  return decodeHtml(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function isXiumiusRawImageImg(tag: string): boolean {
  const cls = (tag.match(/class=["']([^"']*)["']/i) || [])[1] || "";
  return /tn-image-presenter/.test(cls) && /raw-image/.test(cls);
}

function isXiumiusTemplatePackImage(src: string): boolean {
  return /\/xmi\/ua\/19KxR\//i.test(src);
}

function normalizeImgSrc(src: string) {
  return src.startsWith("//") ? `https:${src}` : src;
}

type Block = { type: string; value: string };

function parsePass(raHtml: string, rawOnly: boolean): Block[] {
  const out: Block[] = [];
  const re = /<p[^>]*>([\s\S]*?)<\/p>|<img[^>]+>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raHtml)) !== null) {
    if (m[0].startsWith("<img")) {
      if (rawOnly && !isXiumiusRawImageImg(m[0])) continue;
      const src = (m[0].match(/src=["']([^"']+)["']/i) || [])[1];
      if (!src || (rawOnly && isXiumiusTemplatePackImage(src))) continue;
      out.push({ type: "image", value: normalizeImgSrc(src) });
      continue;
    }
    const p = m[1];
    const img = p.match(/<img[^>]+>/i);
    if (img) {
      if (rawOnly && !isXiumiusRawImageImg(img[0])) continue;
      const src = (img[0].match(/src=["']([^"']+)["']/i) || [])[1];
      if (!src || (rawOnly && isXiumiusTemplatePackImage(src))) continue;
      out.push({ type: "image", value: normalizeImgSrc(src) });
      continue;
    }
    const text = stripHtml(p);
    if (!text || text === "*") continue;
    const isStrong = p.includes("<strong");
    if (isStrong && text.length < 50) out.push({ type: "subheading", value: text });
    else out.push({ type: "paragraph", value: text });
  }
  return out;
}

function parseXiumiusHtml(raHtml: string): Block[] {
  const raw = parsePass(raHtml, true);
  if (raw.some((b) => b.type === "image")) return raw;
  return parsePass(raHtml, false);
}

async function fetchXiumiusContent(url: string): Promise<Block[]> {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  const html = await res.text();
  const m = html.match(/show_data_url%22%3A%22(.*?)%22%2C%22show_url/i);
  if (!m) throw new Error("no xiumius data url");
  const showDataUrl = decodeURIComponent(m[1]);
  const jsonUrl = showDataUrl.startsWith("http") ? showDataUrl : `https:${showDataUrl}`;
  const json = await (await fetch(jsonUrl)).json();
  let raHtml = "";
  for (const cube of json.cubes || []) {
    for (const page of cube.pages || []) {
      for (const layer of page.layers || []) {
        if (layer._comp?._$raHTML) raHtml += layer._comp._$raHTML;
      }
    }
  }
  if (!raHtml) throw new Error("empty xiumius html");
  return parseXiumiusHtml(raHtml);
}

async function main() {
  const content = await fetchXiumiusContent(URL);
  const articles = JSON.parse(fs.readFileSync(ARTICLES_PATH, "utf-8"));
  const article = articles.find((a: { title: string }) => a.title === TITLE);
  if (!article) throw new Error(`article not found: ${TITLE}`);

  article.content = content;
  const textLen = content
    .filter((b) => b.type === "paragraph" || b.type === "subheading")
    .map((b) => b.value)
    .join("").length;
  article.readTime = `${Math.max(2, Math.min(12, Math.ceil(textLen / 400)))}分钟`;

  fs.writeFileSync(ARTICLES_PATH, JSON.stringify(articles, null, 2), "utf-8");
  console.log(`Updated ${article.id}: ${content.length} blocks, ${content.filter((b) => b.type === "image").length} images`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
