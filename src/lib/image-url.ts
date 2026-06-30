import { apiUrl } from "./base-path";

const XIUMI_HOST =
  /(^|\.)xiumi\.us$|xiumius\.cn$/i;

/** Route 秀米等外链图片走同源代理，避免防盗链与 WebP 兼容问题。 */
export function resolveImageUrl(src: string): string {
  if (!src) return src;

  const normalized = src.startsWith("//") ? `https:${src}` : src;

  try {
    const { hostname } = new URL(normalized);
    if (XIUMI_HOST.test(hostname)) {
      return apiUrl(`/api/proxy-image?url=${encodeURIComponent(normalized)}`);
    }
  } catch {
    return src;
  }

  return normalized;
}
