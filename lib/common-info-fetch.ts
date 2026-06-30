const CONSTITUTION_URL = "https://www.12371.cn/special/zggcdzc/zggcdzcqw/";
const TRANSFER_GUIDE_URL =
  "https://c2.yonyoucloud.com/yonbip-ec-link/rest/pub_article/yonbip/upesn/esn/2877623/20220805/1637/eeb3f5f7-d46e-48af-8e91-95aa41af1e21.html";

function sanitizeHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\sstyle="[^"]*"/gi, "")
    .replace(/\sstyle='[^']*'/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/&nbsp;/g, " ");
}

function decodeHtmlEntities(text: string) {
  return text
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&mdash;/g, "—")
    .replace(/&middot;/g, "·")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

async function fetchHtml(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export function extractConstitutionContent(html: string) {
  const startMarker = 'id="contentELMT1666753383742151"';
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) {
    throw new Error("未找到党章正文内容");
  }

  const slice = html.slice(startIdx);
  const endIdx = slice.indexOf("</div>\n</div>\n</div>");
  const contentArea = endIdx === -1 ? slice : slice.slice(0, endIdx);

  const boxes: string[] = [];
  const boxRegex = /<div class="text_box"[^>]*>([\s\S]*?)<\/div>/g;
  let match: RegExpExecArray | null;
  while ((match = boxRegex.exec(contentArea)) !== null) {
    boxes.push(match[1]);
  }

  if (boxes.length === 0) {
    throw new Error("未解析到党章正文");
  }

  return sanitizeHtml(decodeHtmlEntities(boxes.join("")));
}

export function extractTransferGuideContent(html: string) {
  const match = html.match(/<div class="essay-cont">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/);
  if (!match) {
    throw new Error("未找到组织关系转接指南正文");
  }
  return sanitizeHtml(decodeHtmlEntities(match[1]));
}

let constitutionCache: { html: string; fetchedAt: number } | null = null;
let transferGuideCache: { html: string; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 1000 * 60 * 60;

export async function getConstitutionHtml() {
  if (constitutionCache && Date.now() - constitutionCache.fetchedAt < CACHE_TTL_MS) {
    return constitutionCache.html;
  }
  const html = await fetchHtml(CONSTITUTION_URL);
  const content = extractConstitutionContent(html);
  constitutionCache = { html: content, fetchedAt: Date.now() };
  return content;
}

export async function getTransferGuideHtml() {
  if (transferGuideCache && Date.now() - transferGuideCache.fetchedAt < CACHE_TTL_MS) {
    return transferGuideCache.html;
  }
  const html = await fetchHtml(TRANSFER_GUIDE_URL);
  const content = extractTransferGuideContent(html);
  transferGuideCache = { html: content, fetchedAt: Date.now() };
  return content;
}
