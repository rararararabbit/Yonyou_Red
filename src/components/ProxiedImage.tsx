import React, { useState } from "react";
import { resolveImageUrl } from "../lib/image-url";

type ProxiedImageProps = React.ImgHTMLAttributes<HTMLImageElement>;

export default function ProxiedImage({
  src,
  alt = "",
  className,
  ...rest
}: ProxiedImageProps) {
  const [failed, setFailed] = useState(false);
  const resolved = src ? resolveImageUrl(src) : "";

  if (!resolved || failed) {
    return (
      <div
        className={`bg-gray-100 border border-gray-200 flex items-center justify-center text-[11px] text-gray-400 font-sans ${className || ""}`}
        role="img"
        aria-label={alt || "图片加载失败"}
      >
        图片加载失败
      </div>
    );
  }

  return (
    <img
      {...rest}
      src={resolved}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
