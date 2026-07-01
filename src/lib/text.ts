/** 说明文字末尾补全中文句号 */
export function ensureChinesePeriod(text: string): string {
  const trimmed = text.trimEnd();
  if (!trimmed || /[。！？…!?]$/.test(trimmed)) return trimmed;
  return `${trimmed}。`;
}
