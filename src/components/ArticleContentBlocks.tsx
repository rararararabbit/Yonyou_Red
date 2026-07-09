import React from "react";
import { ArticleContentBlock, ContentInlineSegment } from "../data";
import { ensureChinesePeriod } from "../lib/text";

function ArticleInlineLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 underline underline-offset-2 decoration-blue-600/50 hover:text-blue-700 hover:decoration-blue-700 transition-colors"
    >
      {children}
    </a>
  );
}

export function renderInlineSegments(segments: ContentInlineSegment[]) {
  return segments.map((segment, segmentIdx) =>
    segment.type === "link" && segment.href ? (
      <ArticleInlineLink key={segmentIdx} href={segment.href}>
        {segment.value}
      </ArticleInlineLink>
    ) : (
      <React.Fragment key={segmentIdx}>{segment.value}</React.Fragment>
    )
  );
}

export function ArticleParagraphBlock({
  block,
  className = "text-justify indent-8",
}: {
  block: ArticleContentBlock;
  className?: string;
}) {
  const alignClass = block.align === "center" ? "text-center" : "";
  const indentClass = block.align === "center" ? "" : "indent-8";

  if (block.segments?.length) {
    return (
      <p className={`${className} ${alignClass} ${indentClass}`.trim()}>
        {renderInlineSegments(block.segments)}
      </p>
    );
  }

  return <p className={`${className} ${alignClass} ${indentClass}`.trim()}>{block.value as string}</p>;
}

export function ArticleLinkBlock({ block }: { block: ArticleContentBlock }) {
  if (!block.href) return null;
  return (
    <p className={`${block.align === "center" ? "text-center" : "text-justify"} py-1`}>
      <ArticleInlineLink href={block.href}>{block.value as string}</ArticleInlineLink>
    </p>
  );
}

export function getParagraphPlainText(block: ArticleContentBlock): string {
  if (block.segments?.length) {
    return block.segments.map((segment) => segment.value).join("");
  }
  return typeof block.value === "string" ? block.value : "";
}

export function formatParagraphText(block: ArticleContentBlock, withPeriod = false): ArticleContentBlock {
  if (block.segments?.length) return block;
  const text = typeof block.value === "string" ? block.value : "";
  return {
    ...block,
    value: withPeriod ? ensureChinesePeriod(text) : text,
  };
}
