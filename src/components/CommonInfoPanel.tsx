import React, { useEffect, useRef, useState } from "react";
import { ClipboardList, ChevronRight } from "lucide-react";
import { commonInfoSections, type CommonInfoSection } from "../data";
import { apiUrl } from "../lib/base-path";

function SectionCard({
  section,
  children,
  stretch = false,
  contentAlign = "start",
}: {
  section: CommonInfoSection;
  children: React.ReactNode;
  stretch?: boolean;
  contentAlign?: "start" | "center";
}) {
  return (
    <div
      className={`bg-white border border-[#E9E4DB]/70 rounded-none p-4 shadow-[0_2px_8px_rgba(0,0,0,0.01)] ${
        stretch ? "h-full flex flex-col" : ""
      }`}
    >
      <h3 className="text-xs font-serif font-bold text-red-primary pb-2 mb-3 border-b border-gray-100 flex items-center gap-1.5">
        <span className="w-1 h-3 bg-red-primary"></span>
        {section.title}
      </h3>
      <div
        className={
          stretch
            ? `flex-1 flex flex-col min-h-0 ${
                contentAlign === "center" ? "justify-center" : "justify-start"
              }`
            : ""
        }
      >
        {children}
      </div>
    </div>
  );
}

function RemoteContentBlock({
  source,
}: {
  source: "constitution" | "transfer-guide";
}) {
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    fetch(apiUrl(`/api/common-info/${source}`))
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error || "内容加载失败");
        }
        if (!cancelled) {
          setHtml(data.html);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "内容加载失败");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [source]);

  return (
    <div className="h-80 overflow-y-auto border border-[#E9E4DB] bg-[#FCFAF7] p-4 custom-scrollbar">
      {loading && <p className="editorial-note">内容加载中...</p>}
      {error && (
        <p className="text-xs text-red-600 font-serif leading-relaxed">{error}</p>
      )}
      {html && (
        <div
          className="common-info-remote text-xs text-gray-700 font-serif leading-relaxed [&_h2]:font-bold [&_h2]:text-red-primary [&_h2]:text-sm [&_h2]:mt-4 [&_h2]:mb-2 [&_p]:mb-2 [&_p]:text-justify [&_img]:max-w-full [&_img]:h-auto [&_img]:mx-auto [&_img]:my-3"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
}

function InfoSectionContent({ section }: { section: CommonInfoSection }) {
  if (section.type === "contact" && section.entries) {
    return (
      <dl className="space-y-2.5">
        {section.entries.map((entry) => (
          <div
            key={entry.label}
            className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-3"
          >
            <dt className="text-[10px] text-gray-400 font-sans shrink-0 sm:w-12">
              {entry.label}
            </dt>
            <dd className="text-xs text-gray-700 font-serif leading-relaxed">
              {entry.href ? (
                <a
                  href={entry.href}
                  className="text-red-primary hover:text-red-dark underline underline-offset-2"
                >
                  {entry.value}
                </a>
              ) : (
                entry.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  if (section.type === "image" && section.imageUrl) {
    const isQrCode = section.id === "party-group";
    const isMatchedPair = section.id === "party-group" || section.id === "party-oath";
    return (
      <div
        className={`flex justify-center items-center ${isMatchedPair ? "h-full" : ""}`}
      >
        <img
          src={section.imageUrl}
          alt={section.imageAlt || section.title}
          className={`w-auto h-auto object-contain rounded-sm border border-[#E9E4DB] shadow-sm ${
            isQrCode ? "max-w-[200px] max-h-full" : "max-w-full sm:max-w-md max-h-full"
          }`}
        />
      </div>
    );
  }

  if (section.type === "text" && section.text) {
    return (
      <p className="text-xs text-gray-700 font-serif leading-relaxed text-justify whitespace-pre-line overflow-y-auto custom-scrollbar">
        {section.text}
      </p>
    );
  }

  if (section.type === "remote" && section.remoteSource) {
    return <RemoteContentBlock source={section.remoteSource} />;
  }

  return null;
}

export default function CommonInfoPanel({
  compact = false,
  onViewAll,
}: {
  compact?: boolean;
  onViewAll?: () => void;
}) {
  const sections = compact ? commonInfoSections.slice(0, 2) : commonInfoSections;
  const contactRef = useRef<HTMLDivElement>(null);
  const [contactRowHeight, setContactRowHeight] = useState<number>();
  const [pairRowHeights, setPairRowHeights] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const updatePairing = () => setPairRowHeights(media.matches);
    updatePairing();
    media.addEventListener("change", updatePairing);
    return () => media.removeEventListener("change", updatePairing);
  }, []);

  useEffect(() => {
    const el = contactRef.current;
    if (!el) return;

    const updateHeight = () => {
      setContactRowHeight(el.getBoundingClientRect().height);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    window.addEventListener("resize", updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [sections, compact, pairRowHeights]);

  const isContactRow = (id: string) => id === "contact" || id === "party-fee";
  const isImageRow = (id: string) => id === "party-group" || id === "party-oath";

  return (
    <div className={compact ? "mx-4 md:mx-6 mb-4 md:mb-6" : "p-3 space-y-4"}>
      {compact && (
        <div className="flex items-center justify-between pb-3 border-b border-[#E9E4DB]/80 mb-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-red-primary" />
            <h3 className="text-xs font-serif font-bold text-gray-900">常用信息</h3>
          </div>
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="text-[10px] text-red-primary font-sans font-medium flex items-center gap-0.5 hover:text-red-dark transition-colors cursor-pointer"
            >
              查看全部 <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        {sections.map((section) => {
          const matchedContact = isContactRow(section.id);
          const matchedImage = isImageRow(section.id);
          const stretch = matchedImage || section.id === "party-fee";

          return (
          <div
            key={section.id}
            ref={section.id === "contact" ? contactRef : undefined}
            style={
              section.id === "party-fee" && contactRowHeight && pairRowHeights
                ? { height: `${contactRowHeight}px` }
                : undefined
            }
            className={[
              !compact && section.type === "remote" ? "md:col-span-2" : "",
              matchedImage ? "h-full" : "",
              matchedContact || (!stretch && section.type !== "remote") ? "self-start" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <SectionCard
              section={section}
              stretch={stretch}
              contentAlign={matchedImage ? "center" : "start"}
            >
              <InfoSectionContent section={section} />
            </SectionCard>
          </div>
          );
        })}
      </div>
    </div>
  );
}
