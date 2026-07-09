import fs from "fs";
import path from "path";
import { normalizeExternalImageUrl } from "../lib/image-proxy";

type ContentInlineSegment = {
  type: "text" | "link";
  value: string;
  href?: string;
};

type ContentBlock = {
  type: "paragraph" | "quote" | "subheading" | "highlight" | "image" | "video" | "bulletList" | "link";
  value?: string | string[];
  segments?: ContentInlineSegment[];
  href?: string;
  align?: "center";
  caption?: string;
};

type ArticleSection = "光影速递" | "红帆领航" | "音像纪实";

type ExcelRow = {
  section: string;
  tag: string;
  date: string;
  title: string;
  url: string;
  imageUrl: string;
  summary: string;
  contributor?: string;
};

type Article = {
  id: string;
  section: ArticleSection;
  tag: string;
  title: string;
  date: string;
  author: string;
  contributor: string;
  summary: string;
  imageUrl: string;
  readTime: string;
  views: number;
  likes: number;
  content: ContentBlock[];
  quiz: [];
  aiNotes: string;
  aiSuggestions: string[];
};

const ROOT = path.join(import.meta.dirname, "..");
const EXCEL_JSON = path.join(ROOT, "scripts/excel-articles.json");
const OUTPUT = path.join(ROOT, "src/generated/vol-02/articles.json");
const MAGAZINE_OUTPUT = path.join(ROOT, "src/generated/vol-02/magazine-meta.json");

function decodeHtml(text: string) {
  return text
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&mdash;/g, "—")
    .replace(/&middot;/g, "·")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function stripHtml(html: string) {
  return decodeHtml(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function normalizeHref(href: string) {
  const trimmed = href.trim();
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return trimmed;
}

function parseInlineContent(html: string): ContentInlineSegment[] {
  const cleaned = html.replace(/<a\s+name=["'][^"']*["'][^>]*><\/a>/gi, "");
  const segments: ContentInlineSegment[] = [];
  const linkRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(cleaned)) !== null) {
    const textBefore = stripHtml(cleaned.slice(lastIndex, match.index));
    if (textBefore) segments.push({ type: "text", value: textBefore });

    const href = normalizeHref(match[1]);
    const linkText = stripHtml(match[2]);
    if (linkText && href) {
      segments.push({ type: "link", value: linkText, href });
    }
    lastIndex = linkRegex.lastIndex;
  }

  const trailingText = stripHtml(cleaned.slice(lastIndex));
  if (trailingText) segments.push({ type: "text", value: trailingText });

  return segments;
}

function getParagraphAlign(pTag: string): "center" | undefined {
  return /text-align:\s*center/i.test(pTag) ? "center" : undefined;
}

function joinSegmentText(segments: ContentInlineSegment[]) {
  return segments.map((segment) => segment.value).join("");
}

function buildTextBlock(pTag: string, pContent: string): ContentBlock | null {
  const segments = parseInlineContent(pContent);
  const plainText = joinSegmentText(segments);
  if (!plainText || plainText === "*" || plainText === "•" || plainText === "·") return null;

  const align = getParagraphAlign(pTag);
  const hasLinks = segments.some((segment) => segment.type === "link");
  const onlyLink =
    hasLinks && segments.length === 1 && segments[0].type === "link" && segments[0].href;

  if (onlyLink) {
    return {
      type: "link",
      value: segments[0].value,
      href: segments[0].href,
      align,
    };
  }

  const isStrong =
    pContent.includes("<strong") ||
    pContent.includes("font-weight: bold") ||
    pContent.includes("font-weight:bold");

  if (hasLinks) {
    if (isStrong && plainText.length < 50 && align === "center") {
      return { type: "subheading", segments, align };
    }
    return { type: "paragraph", segments, align };
  }

  if (isStrong && plainText.length < 50) {
    return { type: "subheading", value: plainText, align };
  }
  if (plainText.startsWith("*") && plainText.endsWith("*")) {
    return { type: "quote", value: plainText.slice(1, -1), align };
  }
  return { type: "paragraph", value: plainText, align };
}

function getBlockPlainText(block: ContentBlock): string {
  if (block.segments?.length) return joinSegmentText(block.segments);
  return typeof block.value === "string" ? block.value : "";
}

function isXiumiusRawImageImg(tag: string): boolean {
  const cls = (tag.match(/class=["']([^"']*)["']/i) || [])[1] || "";
  return /tn-image-presenter/.test(cls) && /raw-image/.test(cls);
}

/** 秀米排版模板自带的装饰图（非正文实拍），路径含 /xmi/ua/19KxR/ */
function isXiumiusTemplatePackImage(src: string): boolean {
  return /\/xmi\/ua\/19KxR\//i.test(src);
}

function normalizeImgSrc(src: string) {
  let normalized = src;
  if (normalized.startsWith("//")) normalized = "https:" + normalized;
  return normalizeExternalImageUrl(normalized);
}

function shouldIncludeXiumiusImg(tag: string, rawImageOnly: boolean): boolean {
  if (!rawImageOnly) return true;
  return isXiumiusRawImageImg(tag);
}

function shouldIncludeXiumiusSrc(src: string, rawImageOnly: boolean): boolean {
  if (!rawImageOnly) return true;
  return !isXiumiusTemplatePackImage(src);
}

function parseXiumiusHtmlPass(raHtml: string, rawImageOnly: boolean): ContentBlock[] {
  const contentList: ContentBlock[] = [];
  const tokenRegex = /<p([^>]*)>([\s\S]*?)<\/p>|<img[^>]+>/gi;
  let match: RegExpExecArray | null;
  while ((match = tokenRegex.exec(raHtml)) !== null) {
    if (match[0].startsWith("<img")) {
      if (!shouldIncludeXiumiusImg(match[0], rawImageOnly)) continue;
      const srcMatch = match[0].match(/src=["']([^"']+)["']/i);
      if (!srcMatch) continue;
      if (!shouldIncludeXiumiusSrc(srcMatch[1], rawImageOnly)) continue;
      contentList.push({ type: "image", value: normalizeImgSrc(srcMatch[1]) });
      continue;
    }

    const pTag = match[1] || "";
    const pContent = match[2];
    const imgTagMatch = pContent.match(/<img[^>]+>/i);
    if (imgTagMatch) {
      if (!shouldIncludeXiumiusImg(imgTagMatch[0], rawImageOnly)) continue;
      const srcMatch = imgTagMatch[0].match(/src=["']([^"']+)["']/i);
      if (!srcMatch) continue;
      if (!shouldIncludeXiumiusSrc(srcMatch[1], rawImageOnly)) continue;
      contentList.push({ type: "image", value: normalizeImgSrc(srcMatch[1]) });
      continue;
    }

    const block = buildTextBlock(pTag, pContent);
    if (block) contentList.push(block);
  }
  return contentList;
}

function parseXiumiusHtml(raHtml: string): ContentBlock[] {
  const rawImageContent = parseXiumiusHtmlPass(raHtml, true);
  if (rawImageContent.some((block) => block.type === "image")) {
    return rawImageContent;
  }
  return parseXiumiusHtmlPass(raHtml, false);
}

async function fetchXiumiusContent(url: string): Promise<ContentBlock[]> {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!response.ok) throw new Error(`Xiumius fetch failed: ${response.status}`);
  const html = await response.text();
  const injectedDataMatch =
    html.match(/show_data_url%22%3A%22(.*?)%22%2C%22show_url/i) ||
    html.match(/%22show_data_url%22\s*%3A\s*%22(.*?)%22/i);
  if (!injectedDataMatch) throw new Error("No Xiumius data url");

  const showDataUrl = decodeURIComponent(injectedDataMatch[1]);
  const fullJsonUrl = showDataUrl.startsWith("http") ? showDataUrl : `https:${showDataUrl}`;
  const jsonRes = await fetch(fullJsonUrl);
  if (!jsonRes.ok) throw new Error("Xiumius JSON fetch failed");

  const jsonData: any = await jsonRes.json();
  let raHtml = "";
  if (jsonData.cubes) {
    for (const cube of jsonData.cubes) {
      for (const page of cube.pages || []) {
        for (const layer of page.layers || []) {
          if (layer._comp?._$raHTML) raHtml += layer._comp._$raHTML;
        }
      }
    }
  }
  if (!raHtml) throw new Error("Empty Xiumius content");
  return parseXiumiusHtml(raHtml);
}

function parseYonyouArticleHtml(html: string): ContentBlock[] {
  const match = html.match(/<div class="essay-cont">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/);
  if (!match) throw new Error("No essay-cont");

  const essayHtml = match[1]
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\sstyle="[^"]*"/gi, "");

  const blocks: ContentBlock[] = [];
  const tokenRegex = /<(p|h2|h3|img)([^>]*)>([\s\S]*?)<\/\1>|<img([^>]+)>/gi;
  let m: RegExpExecArray | null;
  while ((m = tokenRegex.exec(essayHtml)) !== null) {
    if (m[0].startsWith("<img")) {
      const srcMatch = m[0].match(/src=["']([^"']+)["']/i);
      if (srcMatch) blocks.push({ type: "image", value: srcMatch[1] });
      continue;
    }
    const tag = m[1].toLowerCase();
    const attrs = m[2] || "";
    const inner = m[3];
    const imgInBlock = inner.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgInBlock) {
      blocks.push({ type: "image", value: imgInBlock[1] });
      continue;
    }

    if (tag === "p") {
      const block = buildTextBlock(attrs, inner);
      if (block) blocks.push(block);
      continue;
    }

    const text = stripHtml(inner);
    if (!text) continue;
    if (tag === "h2" || tag === "h3") blocks.push({ type: "subheading", value: text });
  }

  if (blocks.length === 0) {
    const paragraphs = essayHtml.match(/<p([^>]*)>([\s\S]*?)<\/p>/gi) || [];
    for (const p of paragraphs) {
      const match = p.match(/<p([^>]*)>([\s\S]*?)<\/p>/i);
      if (!match) continue;
      const block = buildTextBlock(match[1] || "", match[2]);
      if (block) blocks.push(block);
    }
  }
  return blocks;
}

async function fetchArticleContent(url: string): Promise<ContentBlock[]> {
  if (url.includes("xiumius.cn")) return fetchXiumiusContent(url);
  if (url.includes("yonyoucloud.com")) {
    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!response.ok) throw new Error(`Yonyou fetch failed: ${response.status}`);
    return parseYonyouArticleHtml(await response.text());
  }
  throw new Error(`Unsupported URL: ${url}`);
}

function isVideoUrl(url: string): boolean {
  return /\.mp4(\?|$)/i.test(url);
}

function fallbackContent(summary: string, imageUrl: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  if (summary) {
    for (const line of summary.split("\n").filter((part) => part.trim())) {
      blocks.push({ type: "paragraph", value: line });
    }
  }
  if (imageUrl) {
    blocks.push(
      isVideoUrl(imageUrl)
        ? { type: "video", value: imageUrl }
        : { type: "image", value: imageUrl }
    );
  }
  return blocks;
}

function resolveSection(row: ExcelRow): ArticleSection {
  if (row.section === "红帆领航") return "红帆领航";
  if (row.section === "音像纪实") return "音像纪实";
  return "光影速递";
}

function normalizeDate(raw: string) {
  const monthMap: Record<string, string> = {
    "2月": "2026-02",
    "3月": "2026-03",
    "4月": "2026-04",
    "5月": "2026-05",
    "6月": "2026-06",
    "7月": "2026-07",
  };
  return monthMap[raw] || "2026";
}

function slugify(title: string, index: number) {
  const base =
    title
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || `article-${index}`;
  return `${base}-${index}`;
}

function estimateReadTime(content: ContentBlock[]) {
  const text = content
    .filter((b) =>
      b.type === "paragraph" ||
      b.type === "quote" ||
      b.type === "subheading" ||
      b.type === "link"
    )
    .map((b) => getBlockPlainText(b))
    .join("");
  const minutes = Math.max(2, Math.min(12, Math.ceil(text.length / 400)));
  return `${minutes}分钟`;
}

/** 按标题裁剪正文：去掉指定标记之后的内容 */
function trimArticleContent(title: string, content: ContentBlock[]): ContentBlock[] {
  const trimRules: Record<string, string> = {
    "2026年协同云及人力协同党支部参观香山革命纪念馆": "往期「文化活动」回顾",
  };
  const marker = trimRules[title];
  if (!marker) return content;

  const cutIndex = content.findIndex(
    (block) => getBlockPlainText(block).includes(marker)
  );
  return cutIndex === -1 ? content : content.slice(0, cutIndex);
}

function ensureChinesePeriod(text: string): string {
  const trimmed = text.trimEnd();
  if (!trimmed || /[。！？…!?]$/.test(trimmed)) return trimmed;
  return `${trimmed}。`;
}

/** 光影速递详情说明文字（首段正文）末尾补句号 */
function normalizeLightShadowIntro(
  section: string,
  content: ContentBlock[]
): ContentBlock[] {
  if (section !== "光影速递") return content;
  const introIdx = content.findIndex((block) => block.type === "paragraph");
  if (introIdx === -1) return content;
  const block = content[introIdx];
  if (block.segments?.length) return content;
  if (typeof block.value !== "string") return content;
  const normalized = [...content];
  normalized[introIdx] = {
    ...block,
    value: ensureChinesePeriod(block.value),
  };
  return normalized;
}

async function main() {
  const rows: ExcelRow[] = JSON.parse(fs.readFileSync(EXCEL_JSON, "utf-8"));
  const editorialRow = rows.find((r) => r.title === "卷首语" || r.title.includes("卷首语"));
  const coverRow = rows.find((r) => r.section === "主封面");
  const articleRows = rows.filter(
    (r) => r.title && r.title !== "卷首语" && !r.title.includes("卷首语") && r.section !== "主封面"
  );

  const articles: Article[] = [];
  let redSailCount = 0;
  let lightCount = 0;
  let mediaCount = 0;

  for (let i = 0; i < articleRows.length; i++) {
    const row = articleRows[i];
    const section = resolveSection(row);
    const id =
      section === "红帆领航"
        ? `red-sail-${++redSailCount}`
        : section === "音像纪实"
          ? `media-record-${++mediaCount}`
          : `light-shadow-${++lightCount}`;

    let content: ContentBlock[] = [];
    if (section === "音像纪实" && isVideoUrl(row.imageUrl)) {
      content = fallbackContent(row.summary, row.imageUrl);
    } else if (row.url) {
      try {
        console.log(`Fetching [${id}] ${row.title}`);
        content = await fetchArticleContent(row.url);
        console.log(`  -> ${content.length} blocks`);
      } catch (error: any) {
        console.warn(`  !! failed: ${error.message}`);
        content = fallbackContent(row.summary, row.imageUrl);
      }
    } else {
      content = fallbackContent(row.summary, row.imageUrl);
    }

    if (content.length === 0) content = fallbackContent(row.summary, row.imageUrl);
    content = trimArticleContent(row.title, content);
    content = normalizeLightShadowIntro(section, content);

    const summary =
      section === "光影速递" ? ensureChinesePeriod(row.summary) : row.summary;

    articles.push({
      id,
      section,
      tag: row.tag || "党建活动",
      title: row.title,
      date: normalizeDate(row.date),
      author: "用友党委",
      contributor: row.contributor || "用友党委",
      summary,
      imageUrl: row.imageUrl,
      readTime: estimateReadTime(content),
      views: 800 + i * 37,
      likes: 120 + i * 11,
      content,
      quiz: [],
      aiNotes: summary,
      aiSuggestions: [],
    });
  }

  const magazineMeta = {
    volumeId: "vol-02",
    volumeLabel: "Vol. 02",
    issue: "2026年七一特刊（总第02期）",
    publishDate: "2026年7月",
    features: {
      mediaRecord: true,
    },
    editorial: editorialRow?.summary || "",
    editorialImageUrl: editorialRow?.imageUrl || coverRow?.imageUrl || "",
    coverImageUrl: coverRow?.imageUrl || editorialRow?.imageUrl || "",
  };

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(articles, null, 2), "utf-8");
  fs.writeFileSync(MAGAZINE_OUTPUT, JSON.stringify(magazineMeta, null, 2), "utf-8");
  console.log(`Wrote ${articles.length} articles`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
