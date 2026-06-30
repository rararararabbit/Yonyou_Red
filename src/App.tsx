import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, Image as ImageIcon, MessageSquare, Flame, 
  Search, ArrowRight, Heart, Share2, Award, Compass, 
  HelpCircle, ChevronRight, CheckCircle2, Send, Sparkles, LogIn,
  ClipboardList
} from "lucide-react";

import { articles, magazineInfo, magazineAssets, Article } from "./data";
import ArticleDetail from "./components/ArticleDetail";
import CommonInfoPanel from "./components/CommonInfoPanel";
import { apiUrl } from "./lib/base-path";

export default function App() {
  const [currentTab, setCurrentTab] = useState<"home" | "red-sail" | "light-shadow" | "comments" | "info">("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  
  // Custom Comment State
  const [newCommentName, setNewCommentName] = useState("");
  const [newCommentText, setNewCommentText] = useState("");
  const [commentingLoading, setCommentingLoading] = useState(false);
  const [commentSubmitError, setCommentSubmitError] = useState("");
  const [commentSubmitSuccess, setCommentSubmitSuccess] = useState("");

  const tabScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    tabScrollRef.current?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, [currentTab]);

  useEffect(() => {
    if (!commentSubmitSuccess) return;
    const timer = setTimeout(() => setCommentSubmitSuccess(""), 3000);
    return () => clearTimeout(timer);
  }, [commentSubmitSuccess]);

  const [localArticles] = useState<Article[]>(articles);

  // Filter articles based on search
  const filteredArticles = localArticles.filter(art => 
    art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    art.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const redSailArticles = filteredArticles.filter(art => art.section === "红帆领航");
  const lightShadowArticles = filteredArticles.filter(art => art.section === "光影速递");

  // Submitting a new comment on the interactive board
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const username = newCommentName.trim() || "匿名读者";
    const commentContent = newCommentText.trim();
    const articleTitle = selectedArticle?.title || magazineInfo.title;

    setCommentSubmitError("");
    setCommentSubmitSuccess("");
    setCommentingLoading(true);

    try {
      const emailRes = await fetch(apiUrl("/api/study-reflection"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: username,
          comment: commentContent,
          title: articleTitle,
        }),
      });
      const emailData = await emailRes.json();
      if (!emailRes.ok || !emailData.ok) {
        throw new Error(emailData.message || "提交失败，请稍后重试");
      }

      setNewCommentText("");
      setNewCommentName("");
      setCommentSubmitSuccess("提交成功");
    } catch (err) {
      console.error("思想感悟提交失败:", err);
      setCommentSubmitError(
        err instanceof Error ? err.message : "提交失败，请稍后重试"
      );
    } finally {
      setCommentingLoading(false);
    }
  };

  // Render Mobile Web Client layout
  const renderWeChatAppContent = () => {
    return (
      <div className="flex-1 flex flex-col h-full bg-gray-50 select-none relative">
        
        {/* VIEWPORT CONTROLLER: RENDER ACTIVE TABS */}
        <div ref={tabScrollRef} className="flex-1 overflow-y-auto overflow-x-hidden p-0 pb-6 custom-scrollbar">
          <AnimatePresence mode="wait">
            
            {/* 1. COVER / HOME TAB */}
            {currentTab === "home" && (
              <motion.div
                key="home-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col h-full"
              >
                {/* Magazine Editorial Box - Premium Fashion/Editorial Layout */}
                <div className="m-4 md:m-6 p-6 sm:p-8 bg-[#FDFBF7] border border-[#E9E4DB] relative overflow-hidden group shadow-[0_2px_15px_rgba(0,0,0,0.01)] transition-all">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#F5EFE4] to-transparent rounded-bl-full opacity-40 pointer-events-none" />
                  <div className="absolute -left-3 -top-6 text-[#E9E4DB]/45 font-serif text-[10rem] select-none pointer-events-none leading-none">
                    “
                  </div>
                  
                  <div className="relative space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E9E4DB]/80 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-1 h-3 bg-red-primary"></span>
                        <span className="text-xs font-serif font-bold text-red-primary">本期卷首语</span>
                      </div>
                      <span className="text-[9px] font-mono tracking-widest text-[#A59D90]">{magazineInfo.issue}</span>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      {/* Beautifully framed smaller image */}
                      <div className="flex justify-center shrink-0 mx-auto md:mx-0">
                        <div className="w-32 md:w-36 aspect-[3/4] overflow-hidden bg-[#FCFAF7] border border-[#E9E4DB] shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-transform duration-500 hover:scale-[1.02] shrink-0">
                          <img
                            src={magazineAssets.editorialImageUrl}
                            alt="智绘用友红 卷首语插图"
                            className="w-full h-full object-cover transition-all duration-500"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>

                      {/* Content text - beautifully drop-capped paragraphs */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="space-y-4">
                          {magazineInfo.editorial.split('\n').filter(p => p.trim() !== "").map((para, idx) => (
                            <p
                              key={idx}
                              className={`text-xs text-gray-700 leading-relaxed text-justify font-serif font-normal tracking-wide ${
                                idx === 0
                                  ? "first-letter:text-3xl first-letter:font-bold first-letter:text-red-primary first-letter:mr-1.5 first-letter:float-left first-letter:leading-none"
                                  : ""
                              }`}
                            >
                              {para}
                            </p>
                          ))}
                        </div>
                        <div className="flex justify-end mt-4 items-center gap-2 pt-3 border-t border-dashed border-[#E9E4DB]/60">
                          <span className="editorial-note">— 《智绘用友红》编辑部</span>
                          <div className="w-4 h-[1px] bg-gray-300"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Integrated Dual Columns */}
                <div className="flex flex-col gap-6 sm:gap-8 p-4 sm:p-6 bg-[#FCFAF7]/50 flex-1 border-t border-[#E9E4DB]/60">
                  
                  {/* Column 1: 红帆领航 */}
                  <div className="w-full flex flex-col gap-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-200 gap-2">
                      <h3 className="text-[12px] font-bold text-gray-900 tracking-[0.2em] uppercase flex items-center gap-2 font-sans">
                        <Flame className="w-4 h-4 text-red-primary animate-pulse shrink-0" />
                        红帆领航 / STUDIES
                      </h3>
                      <button
                        type="button"
                        onClick={() => { setSelectedArticle(null); setCurrentTab("red-sail"); }}
                        className="text-[10px] text-red-primary font-sans font-medium flex items-center gap-0.5 hover:text-red-dark transition-colors cursor-pointer shrink-0"
                      >
                        查看全部 <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    
                    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar scroll-smooth">
                      {redSailArticles.length === 0 ? (
                        <div className="w-full py-10 text-center text-xs text-gray-400 italic bg-white border border-[#E9E4DB] rounded-none">
                          暂无相关文献
                        </div>
                      ) : (
                        redSailArticles.map((art) => (
                          <div
                            key={art.id}
                            onClick={() => setSelectedArticle(art)}
                            className="w-[160px] sm:w-[200px] md:w-[220px] shrink-0 bg-white border border-[#E9E4DB]/70 hover:border-red-primary/40 rounded-none overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_12px_30px_rgba(193,16,46,0.05)] transition-all duration-300 cursor-pointer flex flex-col group"
                          >
                            <div className="w-full aspect-[4/3] overflow-hidden bg-gray-50 border-b border-gray-100">
                              <img
                                src={art.imageUrl}
                                alt={art.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="p-3 flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="text-[8px] bg-red-primary/10 text-red-primary border border-red-primary/20 font-bold px-1.5 py-0.5 tracking-wider uppercase rounded-none font-sans">
                                    {art.tag}
                                  </span>
                                  <span className="text-[9px] text-gray-400 font-mono shrink-0">{art.date}</span>
                                </div>
                                <h4 className="text-xs font-serif font-bold text-gray-900 leading-snug group-hover:text-red-primary transition-colors duration-200 line-clamp-2">
                                  {art.title}
                                </h4>
                                <p className="text-[10px] text-gray-500 mt-1.5 font-sans font-light leading-relaxed line-clamp-2">
                                  {art.summary}
                                </p>
                              </div>
                              <div className="flex items-center justify-end mt-2.5 pt-1.5 border-t border-gray-100 text-[9px] text-gray-400">
                                <span className="text-red-primary font-mono font-bold flex items-center gap-0.5 shrink-0">
                                  阅读详情 <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Column 2: 光影速递 */}
                  <div className="w-full flex flex-col gap-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-200 gap-2">
                      <h3 className="text-[12px] font-bold text-gray-900 tracking-[0.2em] uppercase flex items-center gap-2 font-sans">
                        <ImageIcon className="w-4 h-4 text-red-primary shrink-0" />
                        光影速递 / ALBUM
                      </h3>
                      <button
                        type="button"
                        onClick={() => { setSelectedArticle(null); setCurrentTab("light-shadow"); }}
                        className="text-[10px] text-red-primary font-sans font-medium flex items-center gap-0.5 hover:text-red-dark transition-colors cursor-pointer shrink-0"
                      >
                        查看全部 <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    
                    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar scroll-smooth">
                      {lightShadowArticles.length === 0 ? (
                        <div className="w-full py-10 text-center text-xs text-gray-400 italic bg-white border border-[#E9E4DB] rounded-none">
                          暂无图片风采
                        </div>
                      ) : (
                        lightShadowArticles.map((art) => (
                          <div
                            key={art.id}
                            onClick={() => setSelectedArticle(art)}
                            className="w-[160px] sm:w-[200px] md:w-[220px] shrink-0 bg-white border border-[#E9E4DB]/70 hover:border-red-primary/40 rounded-none overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_12px_30px_rgba(193,16,46,0.05)] transition-all duration-300 cursor-pointer flex flex-col group"
                          >
                            <div className="w-full aspect-video overflow-hidden bg-gray-50 border-b border-gray-100">
                              <img
                                src={art.imageUrl}
                                alt={art.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="p-3 flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="text-[8px] bg-red-primary/10 text-red-primary border border-red-primary/20 font-bold px-1.5 py-0.5 tracking-wider uppercase rounded-none font-sans">
                                    {art.tag}
                                  </span>
                                  <span className="text-[9px] text-gray-400 font-mono shrink-0">{art.date}</span>
                                </div>
                                <h4 className="text-xs font-serif font-bold text-gray-900 leading-snug group-hover:text-red-primary transition-colors duration-200 line-clamp-2">
                                  {art.title}
                                </h4>
                                <p className="text-[10px] text-gray-500 mt-1.5 font-sans font-light leading-relaxed line-clamp-2">
                                  {art.summary}
                                </p>
                              </div>
                              <div className="flex items-center justify-end mt-2.5 pt-1.5 border-t border-gray-100 text-[9px] text-gray-400">
                                <span className="text-red-primary font-mono font-bold flex items-center gap-0.5 shrink-0">
                                  阅读详情 <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

                {/* Common Info Module */}
                <div className="border-t border-[#E9E4DB]/60 bg-[#FCFAF7]/50 pt-6 pb-2">
                  <CommonInfoPanel
                    compact
                    onViewAll={() => { setSelectedArticle(null); setCurrentTab("info"); }}
                  />
                  <p className="mx-4 md:mx-6 mt-3 mb-2 text-[10px] sm:text-xs text-gray-500 font-sans font-light text-center leading-relaxed">
                    党委群、党组织关系等更多详细信息请前往
                    <button
                      type="button"
                      onClick={() => { setSelectedArticle(null); setCurrentTab("info"); }}
                      className="text-blue-600 hover:text-blue-700 hover:underline underline-offset-2 font-medium mx-0.5 cursor-pointer"
                    >
                      常用信息
                    </button>
                    查看
                  </p>
                </div>
              </motion.div>
            )}

            {/* 2. RED SAIL TAB (红帆领航 - 党建活动) */}
            {currentTab === "red-sail" && (
              <motion.div
                key="red-sail-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-3 space-y-4"
              >
                {/* Header Banner */}
                <div className="bg-red-primary border-t-4 border-gold-primary rounded-sm p-4 text-white shadow-md relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 text-[#F8D147]/5 pointer-events-none translate-x-4 translate-y-4">
                    <Flame className="w-32 h-32" />
                  </div>
                  <span className="text-[9px] bg-gold-primary text-red-dark font-bold px-2 py-0.5 rounded-none uppercase tracking-wider">
                    理论学习与组织生活 / STUDIES
                  </span>
                  <h2 className="font-serif italic text-xl font-bold mt-1 text-gold-primary">
                    红帆领航板块
                  </h2>
                  <p className="text-[10px] text-red-light/95 mt-1 font-sans font-light leading-relaxed">
                    精选党建主题活动与公开资讯，打造支部指尖学习强国阵地。
                  </p>
                </div>

                {/* Article Cards - 党建活动 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {redSailArticles.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-xs text-gray-400 italic">暂无相关文献</div>
                  ) : (
                    redSailArticles.map((art) => (
                      <div
                        key={art.id}
                        onClick={() => setSelectedArticle(art)}
                        className="bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm hover:shadow-md hover:border-red-primary/10 transition-all flex flex-col cursor-pointer group"
                      >
                        <div className="w-full aspect-[4/3] overflow-hidden bg-gray-50">
                          <img 
                            src={art.imageUrl} 
                            alt={art.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        <div className="p-3.5 space-y-2 flex-1 flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] bg-red-primary/10 text-red-primary border border-red-primary/20 font-bold px-1.5 py-0.5 tracking-wider uppercase rounded-none font-sans">
                              {art.tag}
                            </span>
                            <span className="text-[9px] text-gray-400 font-mono">{art.date}</span>
                          </div>
                          <h3 className="font-serif text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-red-primary transition-colors">
                            {art.title}
                          </h3>
                          <p className="text-xs text-gray-500 leading-relaxed text-justify font-light line-clamp-3 flex-1">
                            {art.summary}
                          </p>
                          
                          <div className="pt-2 flex justify-end items-center border-t border-gray-100">
                            <button
                              id={`read-art-btn-${art.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedArticle(art);
                              }}
                              className="bg-red-primary hover:bg-red-dark text-white text-[10px] font-bold px-3 py-1.5 rounded-sm transition-all flex items-center gap-1 active:scale-95 cursor-pointer font-serif"
                            >
                              <span>查看详细内容</span>
                              <ArrowRight className="w-3 h-3 text-gold-primary" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* 3. LIGHT SHADOW TAB (光影速递) */}
            {currentTab === "light-shadow" && (
              <motion.div
                key="light-shadow-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-3 space-y-5"
              >
                {/* Section Header */}
                <div className="bg-red-primary border-t-4 border-gold-primary rounded-sm p-4 text-white shadow-md relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 text-[#F8D147]/5 pointer-events-none translate-x-4 translate-y-4">
                    <ImageIcon className="w-32 h-32" />
                  </div>
                  <span className="text-[9px] bg-gold-primary text-red-dark font-bold px-2 py-0.5 rounded-none uppercase tracking-wider">
                    多重视角 记录风采 / ALBUM
                  </span>
                  <h2 className="font-serif italic text-xl font-bold mt-1 text-gold-primary">
                    光影速递板块
                  </h2>
                  <p className="text-[10px] text-red-light/95 mt-1 font-sans font-light leading-relaxed">
                    图片纪事与图片新闻，镜头定格党员干劲，凝聚向心奋斗伟力。
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {lightShadowArticles.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-xs text-gray-400 italic">暂无图片风采</div>
                  ) : (
                    lightShadowArticles.map((art) => (
                      <div
                        key={art.id}
                        onClick={() => setSelectedArticle(art)}
                        className="bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm hover:shadow-md hover:border-red-primary/10 transition-all flex flex-col cursor-pointer group"
                      >
                        <div className="w-full aspect-video overflow-hidden bg-gray-50">
                          <img
                            src={art.imageUrl}
                            alt={art.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        <div className="p-3.5 space-y-2 flex-1 flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] bg-red-primary/10 text-red-primary border border-red-primary/20 font-bold px-1.5 py-0.5 tracking-wider uppercase rounded-none font-sans">
                              {art.tag}
                            </span>
                            <span className="text-[9px] text-gray-400 font-mono">{art.date}</span>
                          </div>
                          <h3 className="font-serif text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-red-primary transition-colors">
                            {art.title}
                          </h3>
                          <p className="text-xs text-gray-500 leading-relaxed text-justify font-light line-clamp-3 flex-1">
                            {art.summary}
                          </p>

                          <div className="pt-2 flex items-center justify-end text-[10px] text-gray-400 border-t border-gray-50">
                            <span className="text-red-primary font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                              点击进入详情 <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </motion.div>
            )}

            {/* 4. COMMENTS TAB (互动交流) */}
            {currentTab === "comments" && (
              <motion.div
                key="comments-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-3 space-y-4"
              >
                {/* Header Banner */}
                <div className="bg-red-primary border-t-4 border-gold-primary rounded-sm p-4 text-white shadow-md relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 text-[#F8D147]/5 pointer-events-none translate-x-4 translate-y-4">
                    <MessageSquare className="w-32 h-32" />
                  </div>
                  <span className="text-[9px] bg-gold-primary text-red-dark font-bold px-2 py-0.5 rounded-none uppercase tracking-wider">
                    学思结合 凝心铸魂 / HUB
                  </span>
                  <h2 className="font-serif italic text-xl font-bold mt-1 text-gold-primary">
                    互动研学角
                  </h2>
                  <p className="text-[10px] text-red-light/95 mt-1 font-sans font-light leading-relaxed">
                    在阅读中思考，在交流中升华。党员及群众的心得分享板。
                  </p>
                </div>

                {/* Add Comment Form */}
                <form onSubmit={handleSubmitComment} className="bg-white border border-gray-200 rounded-sm p-4 shadow-sm space-y-3 font-sans">
                  <h3 className="text-xs font-serif font-bold text-gray-800 flex items-center gap-1.5 pb-2 border-b border-gray-100 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-red-primary animate-pulse" />
                    发表您的研读感悟 / WRITE THOUGHT
                  </h3>
                  
                  <div className="space-y-2 text-xs">
                    <input
                      id="comment-name-input"
                      type="text"
                      placeholder="姓名与支部职务（例如：王亮-第三小组党员）"
                      value={newCommentName}
                      onChange={(e) => setNewCommentName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-sm px-3 py-2 outline-none focus:bg-white focus:border-red-primary focus:ring-1 focus:ring-red-primary font-light"
                    />
                    <textarea
                      id="comment-text-input"
                      placeholder="请结合文章撰写您的思想感悟，我们将记录与整理，优秀感悟将会在下期期刊中展示出来"
                      rows={3}
                      required
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-sm px-3 py-2 outline-none focus:bg-white focus:border-red-primary focus:ring-1 focus:ring-red-primary resize-none font-light"
                    />
                  </div>

                  {commentSubmitError && (
                    <p className="text-[11px] text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-sm">
                      {commentSubmitError}
                    </p>
                  )}

                  <button
                    id="submit-comment-btn"
                    type="submit"
                    disabled={commentingLoading || !newCommentText.trim()}
                    className="w-full bg-red-primary hover:bg-red-dark text-white text-xs font-bold py-2 rounded-sm transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-serif"
                  >
                    <Send className="w-3.5 h-3.5 text-gold-primary" />
                    {commentingLoading ? "提交中..." : "提交思想感悟"}
                  </button>
                </form>

              </motion.div>
            )}

            {/* 5. COMMON INFO TAB (常用信息) */}
            {currentTab === "info" && (
              <motion.div
                key="info-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col"
              >
                <div className="bg-red-primary border-t-4 border-gold-primary rounded-sm m-3 p-4 text-white shadow-md relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 text-[#F8D147]/5 pointer-events-none translate-x-4 translate-y-4">
                    <ClipboardList className="w-32 h-32" />
                  </div>
                  <span className="text-[9px] bg-gold-primary text-red-dark font-bold px-2 py-0.5 rounded-none uppercase tracking-wider">
                    党务指南 便捷查阅 / INFO
                  </span>
                  <h2 className="font-serif italic text-xl font-bold mt-1 text-gold-primary">
                    常用信息
                  </h2>
                  <p className="text-[10px] text-red-light/95 mt-1 font-sans font-light leading-relaxed">
                    组织联络、组织生活、党务服务与学习资源，一站式查阅。
                  </p>
                </div>

                <CommonInfoPanel />
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF9F6] text-gray-800 relative border-t-8 border-red-primary flex flex-col" style={{ overflowX: 'clip' }}>
      {/* Aesthetic decors from Artistic Flair theme */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-red-primary/3 rounded-bl-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold-primary/3 rounded-tr-full pointer-events-none" />

      {/* HEADER BLOCK - Full Width Sticky Header */}
      <header className="sticky top-0 z-30 w-full border-b border-[#E9E4DB] bg-[#FAF9F6]/95 backdrop-blur-md transition-all shadow-sm">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-mono tracking-[0.3em] text-[#A59D90] uppercase block">RED SAIL PUBLISHING</span>
              <span className="h-[1px] w-8 bg-[#E9E4DB]" />
              <span className="text-[9px] bg-red-primary text-white font-mono tracking-widest px-1.5 py-0.5 uppercase">
                Vol. 01
              </span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold text-[#1A1A1A] tracking-tighter leading-none flex items-baseline gap-1">
                智绘用友红 <span className="font-serif italic font-normal text-red-primary text-base sm:text-lg md:text-xl ml-2">Digital Magazine</span>
              </h1>
              <p className="text-[9px] md:text-[10px] text-gray-500 tracking-[0.2em] uppercase font-sans font-medium mt-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-primary animate-ping" />
                “AI+党建” 创新实践与风采展示 · 激发高质量组织新动能
              </p>
            </div>
          </div>

          {/* Editor & Navigation */}
          <div className="flex flex-col items-end gap-2 shrink-0 w-full md:w-auto">
            <p className="editorial-note font-bold whitespace-nowrap">
              主编：用友党委研发党支部
            </p>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full md:w-auto justify-start md:justify-end">
            <button
              id="top-nav-home"
              onClick={() => { setSelectedArticle(null); setCurrentTab("home"); }}
              className={`px-4 py-2 text-xs font-sans font-semibold tracking-[0.15em] border-b-2 transition-all cursor-pointer whitespace-nowrap uppercase ${
                currentTab === "home"
                  ? "border-red-primary text-red-primary bg-red-primary/[0.03]"
                  : "border-transparent text-gray-500 hover:text-red-primary hover:bg-gray-100/50"
              }`}
            >
              期刊首页 / HOME
            </button>
            <button
              id="top-nav-red-sail"
              onClick={() => { setSelectedArticle(null); setCurrentTab("red-sail"); }}
              className={`px-4 py-2 text-xs font-sans font-semibold tracking-[0.15em] border-b-2 transition-all cursor-pointer whitespace-nowrap uppercase ${
                currentTab === "red-sail"
                  ? "border-red-primary text-red-primary bg-red-primary/[0.03]"
                  : "border-transparent text-gray-500 hover:text-red-primary hover:bg-gray-100/50"
              }`}
            >
              红帆领航 / STUDIES
            </button>
            <button
              id="top-nav-light-shadow"
              onClick={() => { setSelectedArticle(null); setCurrentTab("light-shadow"); }}
              className={`px-4 py-2 text-xs font-sans font-semibold tracking-[0.15em] border-b-2 transition-all cursor-pointer whitespace-nowrap uppercase ${
                currentTab === "light-shadow"
                  ? "border-red-primary text-red-primary bg-red-primary/[0.03]"
                  : "border-transparent text-gray-500 hover:text-red-primary hover:bg-gray-100/50"
              }`}
            >
              光影速递 / ALBUM
            </button>
            <button
              id="top-nav-comments"
              onClick={() => { setSelectedArticle(null); setCurrentTab("comments"); }}
              className={`px-4 py-2 text-xs font-sans font-semibold tracking-[0.15em] border-b-2 transition-all cursor-pointer whitespace-nowrap uppercase ${
                currentTab === "comments"
                  ? "border-red-primary text-red-primary bg-red-primary/[0.03]"
                  : "border-transparent text-gray-500 hover:text-red-primary hover:bg-gray-100/50"
              }`}
            >
              互动研学 / HUB
            </button>
            <button
              id="top-nav-info"
              onClick={() => { setSelectedArticle(null); setCurrentTab("info"); }}
              className={`px-4 py-2 text-xs font-sans font-semibold tracking-[0.15em] border-b-2 transition-all cursor-pointer whitespace-nowrap uppercase ${
                currentTab === "info"
                  ? "border-red-primary text-red-primary bg-red-primary/[0.03]"
                  : "border-transparent text-gray-500 hover:text-red-primary hover:bg-gray-100/50"
              }`}
            >
              常用信息 / INFO
            </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="w-full max-w-7xl mx-auto flex flex-col flex-1 relative z-10 px-4 sm:px-6 lg:px-8">

        {/* WORKSPACE CONTENT GRID */}
        <div className="flex-1 w-full py-6">
          <div className="w-full bg-white border border-gray-200 shadow-xl rounded-sm min-h-[600px] lg:min-h-[750px] flex flex-col overflow-hidden relative">
            <div className="flex-1 flex flex-col">
              {renderWeChatAppContent()}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="py-6 border-t border-gray-200/50 text-center flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="editorial-note text-red-primary/60">融物理空间与AI智慧 · 共筑指尖智慧党建</p>
          <p className="editorial-note">版面设计：用户体验部</p>
        </footer>

      </div>

      <AnimatePresence>
        {commentSubmitSuccess && (
          <motion.div
            key="comment-success-toast"
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ type: "spring", damping: 22, stiffness: 320 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] max-w-[min(90vw,22rem)] px-4 py-3 bg-white border border-green-200 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex items-center gap-2.5 pointer-events-none"
          >
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-green-50 shrink-0">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </span>
            <span className="text-xs sm:text-sm font-sans font-medium text-gray-800 leading-snug pr-1">
              {commentSubmitSuccess}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DETAILED ARTICLE READER MODAL OVERLAY */}
      <AnimatePresence>
        {selectedArticle && (
          <ArticleDetail 
            article={selectedArticle} 
            onClose={() => setSelectedArticle(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
