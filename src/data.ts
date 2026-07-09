import vol01Articles from "./generated/vol-01/articles.json";
import vol01Meta from "./generated/vol-01/magazine-meta.json";
import vol02Articles from "./generated/vol-02/articles.json";
import vol02Meta from "./generated/vol-02/magazine-meta.json";
import { withBasePath } from "./lib/base-path";

export interface ContentInlineSegment {
  type: "text" | "link";
  value: string;
  href?: string;
}

export interface ArticleContentBlock {
  type: "paragraph" | "quote" | "subheading" | "highlight" | "image" | "video" | "bulletList" | "link";
  value?: string | string[];
  segments?: ContentInlineSegment[];
  href?: string;
  align?: "center";
  caption?: string;
}

export interface Article {
  id: string;
  section: "光影速递" | "红帆领航" | "音像纪实";
  tag: "图片新闻" | "图片纪事" | "党建活动" | "党务工作" | "园区生活" | "党政学习";
  title: string;
  date: string;
  author: string;
  contributor: string;
  summary: string;
  imageUrl: string;
  readTime: string;
  views: number;
  likes: number;
  content: ArticleContentBlock[];
  quiz: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }[];
  aiNotes: string;
  aiSuggestions: string[];
}

export type MagazineVolumeId = "vol-01" | "vol-02";

export interface MagazineFeatures {
  mediaRecord: boolean;
}

interface MagazineMetaFile {
  volumeId: MagazineVolumeId;
  volumeLabel: string;
  issue: string;
  publishDate?: string;
  features?: Partial<MagazineFeatures>;
  editorial: string;
  editorialImageUrl: string;
  coverImageUrl: string;
}

export interface MagazineBundle {
  volumeId: MagazineVolumeId;
  volumeLabel: string;
  features: MagazineFeatures;
  articles: Article[];
  magazineInfo: {
    title: string;
    issue: string;
    date: string;
    editorial: string;
  };
  magazineAssets: {
    editorialImageUrl: string;
    coverImageUrl: string;
  };
}

function defaultVolumeFeatures(volumeId: MagazineVolumeId): MagazineFeatures {
  return {
    mediaRecord: volumeId === "vol-02",
  };
}

function defaultPublishDate(volumeId: MagazineVolumeId): string {
  return volumeId === "vol-01" ? "2026年6月" : "2026年7月";
}

function buildMagazineBundle(
  meta: MagazineMetaFile,
  articlesData: unknown[]
): MagazineBundle {
  const defaults = defaultVolumeFeatures(meta.volumeId);
  return {
    volumeId: meta.volumeId,
    volumeLabel: meta.volumeLabel,
    features: {
      mediaRecord: meta.features?.mediaRecord ?? defaults.mediaRecord,
    },
    articles: articlesData as Article[],
    magazineInfo: {
      title: "智绘用友红电子期刊",
      issue: meta.issue,
      date: meta.publishDate || defaultPublishDate(meta.volumeId),
      editorial: meta.editorial,
    },
    magazineAssets: {
      editorialImageUrl: meta.editorialImageUrl,
      coverImageUrl: meta.coverImageUrl,
    },
  };
}

const magazineVolumes: Record<MagazineVolumeId, MagazineBundle> = {
  "vol-01": buildMagazineBundle(vol01Meta as MagazineMetaFile, vol01Articles),
  "vol-02": buildMagazineBundle(vol02Meta as MagazineMetaFile, vol02Articles),
};

function getDefaultVolumeId(): MagazineVolumeId {
  const raw = import.meta.env.VITE_DEFAULT_VOLUME;
  if (raw === "vol-01") return "vol-01";
  if (raw === "vol-02") return "vol-02";
  return "vol-02";
}

export function resolveVolumeId(raw: string | null): MagazineVolumeId {
  if (raw === "01" || raw === "vol-01") return "vol-01";
  if (raw === "02" || raw === "vol-02") return "vol-02";
  return getDefaultVolumeId();
}

export function getDefaultVolume(): MagazineVolumeId {
  return getDefaultVolumeId();
}

export function getMagazineVolume(id: MagazineVolumeId): MagazineBundle {
  return magazineVolumes[id];
}

/** 本地开发默认卷（Vol. 02）；正式/测试环境由 VITE_DEFAULT_VOLUME 构建时注入 */
export const articles = magazineVolumes[getDefaultVolumeId()].articles;
export const magazineInfo = magazineVolumes[getDefaultVolumeId()].magazineInfo;
export const magazineAssets = magazineVolumes[getDefaultVolumeId()].magazineAssets;

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
    imageUrl: withBasePath("/common-info/party-group-qr.png"),
    imageAlt: "用友党委全体党员群二维码",
  },
  {
    id: "party-oath",
    title: "四、入党誓词",
    type: "image",
    imageUrl: withBasePath("/common-info/party-oath.png"),
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
