const ALLOWED_IMAGE_HOSTS = new Set([
  "img.xiumi.us",
  "statics.xiumi.us",
  "c.xiumius.cn",
  "v.xiumius.cn",
  "a.xiumius.cn",
  "b.xiumius.cn",
  "c2.yonyoucloud.com",
  "img.xiumius.cn",
]);

export function normalizeExternalImageUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  const withProtocol = trimmed.startsWith("//") ? `https:${trimmed}` : trimmed;
  try {
    const url = new URL(withProtocol);
    if (url.hostname.endsWith("xiumi.us")) {
      url.search = "";
    }
    return url.toString();
  } catch {
    return trimmed;
  }
}

export function isAllowedImageUrl(raw: string): boolean {
  try {
    const url = new URL(normalizeExternalImageUrl(raw));
    if (!["http:", "https:"].includes(url.protocol)) return false;
    return ALLOWED_IMAGE_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export async function fetchProxiedImage(raw: string): Promise<{
  buffer: Buffer;
  contentType: string;
}> {
  const target = normalizeExternalImageUrl(raw);
  if (!isAllowedImageUrl(target)) {
    throw new Error("Image URL not allowed");
  }

  const response = await fetch(target, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: "https://xiumius.cn/",
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Image fetch failed: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const contentType =
    response.headers.get("content-type")?.split(";")[0]?.trim() || "image/jpeg";

  return {
    buffer: Buffer.from(arrayBuffer),
    contentType,
  };
}
