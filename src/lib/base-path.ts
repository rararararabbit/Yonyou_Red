/** Normalize Vite base URL (always ends with /). */
export function getBasePath(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.endsWith("/") ? base : `${base}/`;
}

/** Prefix an absolute app path with the deploy base path. */
export function withBasePath(path: string): string {
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  return `${getBasePath()}${normalized}`.replace(/\/{2,}/g, "/");
}

/** API endpoint under the current deploy base path. */
export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return withBasePath(normalized);
}
