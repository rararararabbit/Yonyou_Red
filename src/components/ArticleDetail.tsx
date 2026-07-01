import React, { useState } from "react";
import { motion } from "motion/react";
import { X, Calendar, Heart, Eye, Award, Maximize2, Minimize2, PenLine } from "lucide-react";
import ProxiedImage from "./ProxiedImage";
import { Article } from "../data";
import { ensureChinesePeriod } from "../lib/text";

interface ArticleDetailProps {
  article: Article;
  onClose: () => void;
}

export default function ArticleDetail({ article, onClose }: ArticleDetailProps) {
  // States for Likes
  const [hasLiked, setHasLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(article.likes);
  const [isMaximized, setIsMaximized] = useState(false);

  const lightShadowIntroIdx =
    article.section === "光影速递"
      ? article.content.findIndex((item) => item.type === "paragraph")
      : -1;

  // Handle Like Action
  const handleLike = () => {
    if (hasLiked) {
      setLikesCount(prev => prev - 1);
      setHasLiked(false);
    } else {
      setLikesCount(prev => prev + 1);
      setHasLiked(true);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 bg-black/60 z-50 flex items-center justify-center ${
        isMaximized ? "p-0" : "px-4 sm:px-6 lg:px-8 py-6"
      }`}
    >
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className={`bg-[#FCFAF7] w-full shadow-2xl flex flex-col overflow-hidden border border-gray-200 ${
          isMaximized
            ? "h-screen max-w-none max-h-none rounded-none"
            : "max-w-7xl h-full max-h-[calc(100vh-3rem)] sm:rounded-sm"
        }`}
      >
        {/* Header bar */}
        <div className="bg-red-primary px-4 py-3.5 text-white flex items-center justify-between border-b-4 border-gold-primary shrink-0">
          <div className="flex items-center gap-2">
            <span className="bg-gold-primary text-red-dark text-[9px] font-bold px-2 py-0.5 rounded-none uppercase tracking-widest font-sans">
              {article.tag}
            </span>
            <h3 className="font-serif italic text-xs sm:text-sm font-bold text-white leading-snug">
              {article.title}
            </h3>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              id="toggle-article-size-btn"
              type="button"
              onClick={() => setIsMaximized((v) => !v)}
              className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-none hover:bg-black/20 text-white transition-colors text-[10px] font-sans tracking-wide"
              title={isMaximized ? "退出全屏" : "全屏浏览"}
            >
              {isMaximized ? (
                <>
                  <Minimize2 className="w-4 h-4 text-gold-primary" />
                  <span className="text-gold-primary hidden md:inline">退出全屏</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 text-gold-primary" />
                  <span className="text-gold-primary hidden md:inline">全屏浏览</span>
                </>
              )}
            </button>
            <button 
              id="close-article-btn"
              onClick={onClose} 
              className="p-1 rounded-none hover:bg-black/20 text-white transition-colors"
            >
              <X className="w-5 h-5 text-gold-primary" />
            </button>
          </div>
        </div>

        {/* Article content container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Beautiful WeChat-style Article Typesetting */}
          <div className="flex-1 overflow-y-auto p-3 space-y-5 bg-white wechat-body custom-scrollbar">
            {/* Meta */}
            <div>
              <h1 className="font-serif font-bold text-xl sm:text-2xl text-gray-900 leading-tight mb-4">
                {article.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 font-sans">
                {article.contributor && (
                  <span className="flex items-center gap-1 text-red-primary font-medium">
                    <PenLine className="w-3.5 h-3.5" /> 供稿方：{article.contributor}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {article.date}
                </span>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  阅读约 {article.readTime}
                </span>
              </div>
            </div>

            {/* Content list rendering */}
            <div className="space-y-5 text-sm sm:text-base leading-relaxed text-gray-700">
              {article.content.map((item, idx) => {
                if (item.type === "paragraph") {
                  const text = item.value as string;
                  const displayText =
                    idx === lightShadowIntroIdx ? ensureChinesePeriod(text) : text;
                  return (
                    <p key={idx} className="text-justify indent-8">
                      {displayText}
                    </p>
                  );
                }
                
                if (item.type === "subheading") {
                  return (
                    <div key={idx} className="flex items-center gap-2 pt-4 pb-1">
                      <span className="w-1.5 h-6 bg-red-primary rounded-none"></span>
                      <h2 className="font-serif text-base sm:text-lg font-bold text-red-dark">
                        {item.value as string}
                      </h2>
                    </div>
                  );
                }

                if (item.type === "quote") {
                  return (
                    <div key={idx} className="bg-[#FCFAF7] border-l-4 border-red-primary py-3.5 px-4 rounded-none my-4 italic text-gray-800 border-y border-r border-gray-200/50">
                      <p className="text-sm font-sans font-light">{item.value as string}</p>
                    </div>
                  );
                }

                if (item.type === "bulletList") {
                  return (
                    <ul key={idx} className="space-y-3 bg-gray-50/70 p-4 rounded-none border border-gray-100 list-none pl-2">
                      {(item.value as string[]).map((li, liIdx) => {
                        // Highlight bold portions like **text**
                        const parts = li.split("**");
                        return (
                          <li key={liIdx} className="text-sm text-gray-700 flex items-start gap-2 font-light">
                            <span className="text-red-primary mt-1 select-none">✦</span>
                            <span>
                              {parts.map((pStr, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-gray-900 font-semibold">{pStr}</strong> : pStr)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  );
                }

                if (item.type === "highlight") {
                  return (
                    <div key={idx} className="bg-[#FFFDF0] border border-[#F8D147]/45 p-4 rounded-none my-4 text-sm text-amber-950 font-medium relative overflow-hidden">
                      <div className="absolute right-0 bottom-0 text-gold-primary/10 select-none pointer-events-none translate-x-2 translate-y-2">
                        <Award className="w-24 h-24" />
                      </div>
                      <p className="relative z-10 font-light leading-relaxed">{item.value as string}</p>
                    </div>
                  );
                }

                if (item.type === "image") {
                  return (
                    <div key={idx} className="my-6 space-y-2">
                      <div className="rounded-none bg-gray-100 shadow-sm border border-gray-200">
                        <ProxiedImage
                          src={item.value as string}
                          alt={item.caption || "插图"}
                          className="w-full h-auto block"
                        />
                      </div>
                      {item.caption && (
                        <p className="text-xs text-center text-gray-500 font-sans italic px-4 font-light">
                          {item.caption}
                        </p>
                      )}
                    </div>
                  );
                }

                return null;
              })}
            </div>

            {/* Bottom reading footprint & likes */}
            <div className="mt-12 pt-6 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-sans">
              <div className="flex items-center gap-4 font-light">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4 text-gray-400" />
                  {article.views + (hasLiked ? 1 : 0)} 次阅读
                </span>
              </div>
              <button 
                id="article-like-btn"
                onClick={handleLike}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none border transition-all ${
                  hasLiked 
                    ? "bg-red-light text-red-primary border-red-primary/30" 
                    : "border-gray-200 hover:border-red-primary hover:text-red-primary"
                }`}
              >
                <Heart className={`w-4 h-4 ${hasLiked ? "fill-red-primary text-red-primary" : ""}`} />
                <span className="font-serif">{likesCount}</span>
              </button>
            </div>
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
}
