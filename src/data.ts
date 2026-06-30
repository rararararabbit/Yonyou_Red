import articlesData from "./generated/articles.json";
import magazineMeta from "./generated/magazine-meta.json";

export interface Article {
  id: string;
  section: "光影速递" | "红帆领航";
  tag: "图片新闻" | "图片纪事" | "党建活动" | "党务工作" | "园区生活" | "党政学习";
  title: string;
  date: string;
  author: string;
  summary: string;
  imageUrl: string;
  readTime: string;
  views: number;
  likes: number;
  content: {
    type: "paragraph" | "quote" | "subheading" | "highlight" | "image" | "bulletList";
    value: string | string[];
    caption?: string;
  }[];
  quiz: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }[];
  aiNotes: string;
  aiSuggestions: string[];
}

export const magazineInfo = {
  title: "智绘用友红电子期刊",
  issue: "2026年第01期（总第01期）",
  date: "2026年6月",
  editorial: magazineMeta.editorial,
};

export const magazineAssets = {
  editorialImageUrl: magazineMeta.editorialImageUrl,
  coverImageUrl: magazineMeta.coverImageUrl,
};

export interface CommonInfoEntry {
  label: string;
  value: string;
  href?: string;
}

export type CommonInfoSectionType = "contact" | "image" | "text" | "remote";

export interface CommonInfoSection {
  id: string;
  title: string;
  type: CommonInfoSectionType;
  entries?: CommonInfoEntry[];
  imageUrl?: string;
  imageAlt?: string;
  text?: string;
  remoteSource?: "constitution" | "transfer-guide";
}

export const commonInfoSections: CommonInfoSection[] = [
  {
    id: "contact",
    title: "一、联系党委",
    type: "contact",
    entries: [
      { label: "电话", value: "010-86396688转60782，15011460830" },
      { label: "邮箱", value: "xuewen@yonyou.com", href: "mailto:xuewen@yonyou.com" },
    ],
  },
  {
    id: "party-fee",
    title: "二、缴纳党费",
    type: "text",
    text: "需安装红色成长营APP，按照党委提供的信息完成注册、审核、缴费的流程。\n详询党委组织部（联系方式见「一、联系党委」）",
  },
  {
    id: "party-group",
    title: "三、加入党委群（友空间）",
    type: "image",
    imageUrl: "/common-info/party-group-qr.png",
    imageAlt: "用友党委全体党员群二维码",
  },
  {
    id: "party-oath",
    title: "四、入党誓词",
    type: "image",
    imageUrl: "/common-info/party-oath.png",
    imageAlt: "中国共产党入党誓词",
  },
  {
    id: "constitution",
    title: "五、中国共产党章程",
    type: "remote",
    remoteSource: "constitution",
  },
  {
    id: "transfer-guide",
    title: "六、党组织关系转接指南",
    type: "remote",
    remoteSource: "transfer-guide",
  },
];

export const articles: Article[] = articlesData as Article[];
