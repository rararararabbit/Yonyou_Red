import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { sendStudyReflectionEmail } from "./lib/study-reflection-mail";
import { getConstitutionHtml, getTransferGuideHtml } from "./lib/common-info-fetch";
import { fetchProxiedImage, isAllowedImageUrl } from "./lib/image-proxy";

dotenv.config();

const BASE_PATH = (process.env.BASE_PATH || "").replace(/\/$/, "");
const PORT = Number(process.env.PORT) || 3000;
const mountPath = BASE_PATH || "/";

const app = express();
const router = express.Router();

app.use(express.json());

// Initialize Gemini client with graceful fallback check
let aiClient: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Successfully initialized Gemini API Client for AI+Party Building");
  } catch (error) {
    console.error("Failed to initialize Gemini API Client:", error);
  }
} else {
  console.log("Gemini API Key is not set or is using placeholder. Using premium fallback responders.");
}

// 1. Health check & configuration status
router.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    aiConfigured: aiClient !== null,
    timestamp: new Date().toISOString()
  });
});

// 1b. Proxy external article images (秀米防盗链)
router.get("/api/proxy-image", async (req, res) => {
  const url = String(req.query.url || "");
  if (!url || !isAllowedImageUrl(url)) {
    return res.status(400).json({ ok: false, error: "Invalid image URL" });
  }

  try {
    const { buffer, contentType } = await fetchProxiedImage(url);
    res.set("Content-Type", contentType);
    res.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
    res.send(buffer);
  } catch (error: any) {
    console.error("Image proxy error:", error?.message || error);
    res.status(502).json({ ok: false, error: "Image proxy failed" });
  }
});

// 1c. Common info remote content
router.get("/api/common-info/constitution", async (_req, res) => {
  try {
    const html = await getConstitutionHtml();
    res.json({ ok: true, html });
  } catch (error: any) {
    console.error("Constitution fetch error:", error);
    res.status(500).json({ ok: false, error: error?.message || "党章内容加载失败" });
  }
});

router.get("/api/common-info/transfer-guide", async (_req, res) => {
  try {
    const html = await getTransferGuideHtml();
    res.json({ ok: true, html });
  } catch (error: any) {
    console.error("Transfer guide fetch error:", error);
    res.status(500).json({ ok: false, error: error?.message || "转接指南加载失败" });
  }
});

// 1b. Fetch and parse external article from Xiumius
router.get("/api/articles/red-sail-1", async (req, res) => {
  const targetUrl = "https://c.xiumius.cn/board/v5/3x9y0/689978552";
  
  const defaultArticleContent = [
    {
      type: "paragraph",
      value: "2026年3月19日，正值初春，北京的暖阳驱散了残冬的寒意。"
    },
    {
      type: "paragraph",
      value: "中午12点30分，用友软件园西区北门，一辆中巴准时启动，载着15名用友党员和业务骨干一路向北，驶向昌平区小汤山阿苏卫。这条路，他们走过不止一次——用友党委的党建活动，从不满足于会议室里的学习研讨，而是将脚步延伸至工厂车间、纪念馆堂、科学院所，让党员在真实的场景中触摸时代的脉搏。这一次，目的地是阿苏卫循环经济园——一个让“垃圾”重生为资源的地方，一个见证中国生态文明建设步伐的地方。"
    },
    {
      type: "paragraph",
      value: "车窗外，城市的高楼渐渐退远，取而代之的是开阔的郊野。车内，张纪雄书记与同行的党员同志们轻声交流，话题从近期的业务进展延伸到即将开始的参观体验。约三十分钟后，车稳稳停下。"
    },
    {
      type: "subheading",
      value: "直面垃圾山：震撼的起点"
    },
    {
      type: "paragraph",
      value: "一下车，一座巍然矗立的“小山”便映入眼帘。这座现已封场的填埋场，填埋着近三十年来北京市居民产生的生活垃圾，总量约2600万吨。这一刻，“垃圾减量”不再是一句标语，而是一场关于城市、关于未来、关于每个人生活方式选择的具体叩问。"
    },
    {
      type: "paragraph",
      value: "用友的党员们在此驻足良久。讲解员介绍，这里曾经是北京市生活垃圾的终端汇聚地，而今通过科学管理和循环经济改造，正在逐步转型。“直面垃圾山”——这是阿苏卫参访的第一个环节，也是最令人深思的环节。"
    },
    {
      type: "image",
      value: "https://img.xiumi.us/xmi/ua/1zZWL/i/e32858105cee1eef39dbfbce5f5dccfc-sz_1578234.png?x-oss-process=style/xmwebp",
      caption: "用友党委参观阿苏卫循环经济园全体合影"
    },
    {
      type: "image",
      value: "https://img.xiumi.us/xmi/ua/1zZWL/i/466ffa86d89b0754097b70074e2157be-sz_2166230.png?x-oss-process=style/xmwebp",
      caption: "阿苏卫循环经济园实景"
    },
    {
      type: "subheading",
      value: "处理核心：万吨巨抓与绿色能源"
    },
    {
      type: "paragraph",
      value: "从垃圾山下来，参观队伍移步至垃圾吊控制室。"
    },
    {
      type: "paragraph",
      value: "透过玻璃窗望去，一台巨大的抓斗正缓缓张开“铁爪”，精准地抓起一满斗垃圾，缓缓升起、移动、投放——整个过程干净利落。讲解员介绍，这台大型抓斗一次能抓起约10吨垃圾，操作员通过控制台远程操控，精准而有力。"
    },
    {
      type: "paragraph",
      value: "这些被抓起的生活垃圾，经卸料大厅放入垃圾储坑后，需要经过5至7天的发酵，待其含水量降低、热值提升后，才能送入焚烧炉进行高温焚烧发电。阿苏卫焚烧发电厂日处理生活垃圾约3000吨，每天焚烧产生的电力能够满足约14000户居民的用电需求——化“腐朽”为“神奇”，垃圾在这里获得了第二次生命。"
    },
    {
      type: "paragraph",
      value: "在中央控制室的大屏幕上，实时显示着焚烧厂各环节的运行状态：垃圾入料口、炉膛焚烧情况、炉渣出料口……每一个数据、每一条曲线，都指向同一个目标：安全、稳定、高效。"
    },
    {
      type: "image",
      value: "https://img.xiumi.us/xmi/ua/1zZWL/i/e8bd2b03a3c114af439a52d3a8b0f758-sz_1639033.png?x-oss-process=style/xmwebp",
      caption: "阿苏卫循环经济园控制中心"
    },
    {
      type: "subheading",
      value: "科技赋能：展厅里的沉浸式课堂"
    },
    {
      type: "paragraph",
      value: "参观的最后一站，是阿苏卫循环经济园科普宣教展厅。"
    },
    {
      type: "paragraph",
      value: "作为国家AAA级生活垃圾焚烧发电厂、北京市唯一一座五星级生活垃圾处理设施，同时也是北京市新时代文明实践基地，阿苏卫循环经济园的科普宣教展厅承载着向社会公众传播生态文明理念的使命——年接待参观人员约2500人次。"
    },
    {
      type: "paragraph",
      value: "在讲解员的引导下，用友参观团队先后走过中厅、南厅、北厅三大展区，通过VR体验、实景讲解、游戏互动等多元化形式，系统了解生活垃圾分类、清运、焚烧发电的全流程。"
    },
    {
      type: "image",
      value: "https://img.xiumi.us/xmi/ua/1zZWL/i/cd265463d640bc90c224f173d7c7d373-sz_1806449.png?x-oss-process=style/xmwebp",
      caption: "参观科普宣教展厅"
    },
    {
      type: "paragraph",
      value: "VR体验区是展厅中最受欢迎的环节。党员们戴上设备，“置身”于垃圾分类与处理的全流程之中——在虚拟的街道上分类投放，在模拟的中转站观察转运，在数字化的焚烧炉旁感受高温的力量。更让他们流连忘返的是那些寓教于乐的互动游戏：“垃圾分类互动桌”、“快乐吊操手”、“垃圾消消乐”……这些原本严肃的环保知识，在游戏化的设计中被轻松习得。"
    },
    {
      type: "paragraph",
      value: "“以前只知道垃圾会被运走处理，没想到背后有这么多复杂的工序和科技含量，更没想到北京每天产生这么多垃圾。”一位党员在VR体验区驻足良久，轻声感叹。2025年，阿苏卫循环经济园预计发电量达4.48亿千瓦时，为首都绿色低碳发展注入清洁动能——每一个数字背后，都是生态文明建设实实在在的进步。"
    },
    {
      type: "image",
      value: "https://img.xiumi.us/xmi/ua/1zZWL/i/fcb266e7bd794b788728b5a28608f8a6-sz_1330912.png?x-oss-process=style/xmwebp",
      caption: "党员体验垃圾分类互动游戏"
    },
    {
      type: "subheading",
      value: "文化解读"
    },
    {
      type: "paragraph",
      value: "用友党建始终秉持“红色用友，数智征程”的品牌理念，以高质量党建引领和保障企业高质量发展。在党建工作中，用友全面厘清党建与发展、党务与业务、成效与绩效三组辩证关系，将党的政治优势转化为企业发展优势。此次用友党委参观阿苏卫循环经济园科普宣教展厅，正是党建带业务理念的生动实践。在绿色发展与循环经济成为时代发展趋势的背景下，用友积极响应国家号召，将党建工作与企业业务发展紧密结合。"
    },
    {
      type: "paragraph",
      value: "从党建文化层面来看，用友党建强调坚守党的信念，坚定公司使命和远景。参观阿苏卫循环经济园科普宣教展厅，有助于党员们深刻理解绿色发展和循环经济的重要意义，进一步增强党性意识，厚植爱国情怀，坚定理想信念。这与用友党建中“赓续红色血脉，强化党性意识”的工作方向相契合，通过实地参观学习，让党员们在实践中感悟党的精神，传承红色基因。"
    },
    {
      type: "paragraph",
      value: "在党建带业务方面，用友一直致力于推动党建与业务的深度融合。绿色发展和循环经济是当前企业发展的重要方向，参观循环经济园可以为用友的业务发展提供新的思路和机遇。例如，用友可以将数智化技术应用于循环经济领域，为相关企业提供更高效的管理解决方案，实现党建引领业务创新发展。同时，这也体现了用友融合式党建举措中与客户党委共建促业务的理念，有助于提升在环保领域的影响力，推动业务拓展。此外，用友党建注重社会责任的融入，参观阿苏卫循环经济园体现了用友积极履行社会责任、为推动社会绿色发展贡献力量的决心。"
    },
    {
      type: "image",
      value: "https://img.xiumi.us/xmi/ua/1zZWL/i/59b714d6b4d12028967e94d5f5f86675-sz_1144608.png?x-oss-process=style/xmwebp",
      caption: "用友红色党建引领"
    },
    {
      type: "subheading",
      value: "精神回响"
    },
    {
      type: "paragraph",
      value: "从中国国家版本馆的“藏之名山、传之后世”，到航天二院的“特别能吃苦、特别能战斗、特别能攻关、特别能奉献”；从卢沟桥畔的“铭记历史，吾辈自强”，到此刻阿苏卫循环经济园的“变废为宝，循环再生”——用友党委的每一次党建活动，都像是在一幅徐徐展开的画卷上落笔，每一笔都厚重而有力量。"
    },
    {
      type: "paragraph",
      value: "这一次，笔触落在了生态文明上。"
    },
    {
      type: "paragraph",
      value: "“绿水青山就是金山银山”，生态文明建设是关系中华民族永续发展的根本大计。对于用友这家以“用创想与技术推动商业和社会进步”为使命的企业而言，这不仅是一句口号，更是渗透在每一次业务决策、每一场组织活动中的行动自觉。"
    },
    {
      type: "paragraph",
      value: "参观循环经济园，让党员们亲眼看见——47米高的垃圾山警示着减量的紧迫，10吨重的机械抓斗展示着科技的力量，日处理3000吨的循环经济体系诠释着绿色发展的真实内涵。这些亲眼所见的震撼，远比任何文字材料都来得深刻。"
    },
    {
      type: "paragraph",
      value: "而这，也正是用友党建最打动人的地方：它从不满足于精神层面的学习，而是始终在寻找精神与现实之间的连接点。用友党建工作遵循“一坚守，双责任，三作用，五融合，六实践”的方法论，其中的“五融合”——党建与战略融合、与业务融合、与文化融合、与组织融合、与责任融合——在此次参观活动中得到了具象化的诠释。"
    },
    {
      type: "image",
      value: "https://img.xiumi.us/xmi/ua/1zZWL/i/675c22d707a8b32577dad1a8620faf12-sz_1075789.png?x-oss-process=style/xmwebp",
      caption: "绿色低碳环保实践"
    },
    {
      type: "subheading",
      value: "编者手记"
    },
    {
      type: "paragraph",
      value: "约四十五分钟的参观，转瞬即逝。"
    },
    {
      type: "paragraph",
      value: "当大巴再次启动，驶离阿苏卫循环经济园时，车内的气氛比来时更热烈了几分。党员们三三两两交谈着，分享着各自的参观感受。有人谈到了AI和大数据在垃圾分类中的应用前景，有人思索着循环经济产业链上的管理信息化需求，还有人单纯为那些默默工作的城市环卫人而感动。"
    },
    {
      type: "paragraph",
      value: "这，或许就是用友党建活动最朴素的意义——不是灌输，而是激发；不是说教，而是体验。当十五个人从同一个展厅走出来，他们带走的不是同一份标准答案，而是十五种不同的触动与思考。然后这些触动，会在各自的岗位上慢慢发酵，化为更主动的工作姿态、更开阔的业务视野、更坚定的使命感。"
    },
    {
      type: "paragraph",
      value: "下一次，用友党委的脚步又将迈向何方？"
    },
    {
      type: "paragraph",
      value: "值得期待。"
    },
    {
      type: "quote",
      value: "谨以此报道，记录用友党委2026年3月19日阿苏卫循环经济园参观学习之行。"
    }
  ];

  try {
    console.log("Fetching live article from Xiumius:", targetUrl);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 seconds timeout
    
    const response = await fetch(targetUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch from Xiumius: ${response.statusText}`);
    }

    const html = await response.text();
    console.log("Successfully fetched article HTML, length:", html.length);

    // Extract the injectedData showInfo JSON containing show_data_url
    const injectedDataMatch =
      html.match(/show_data_url%22%3A%22(.*?)%22%2C%22show_url/i) ||
      html.match(/%22show_data_url%22\s*%3A\s*%22(.*?)%22/i);
    if (injectedDataMatch) {
      const showDataUrlEncoded = injectedDataMatch[1];
      const showDataUrl = decodeURIComponent(showDataUrlEncoded);
      const fullJsonUrl = showDataUrl.startsWith("http") ? showDataUrl : "https:" + showDataUrl;
      console.log("Found Xiumius data JSON url:", fullJsonUrl);

      const jsonRes = await fetch(fullJsonUrl);
      if (jsonRes.ok) {
        const jsonData: any = await jsonRes.json();
        console.log("Successfully fetched Xiumius JSON data!");

        // Extract _$raHTML from cubes -> pages -> layers
        let raHtml = "";
        if (jsonData.cubes) {
          for (const cube of jsonData.cubes) {
            if (cube.pages) {
              for (const page of cube.pages) {
                if (page.layers) {
                  for (const layer of page.layers) {
                    if (layer._comp && layer._comp._$raHTML) {
                      raHtml += layer._comp._$raHTML;
                    }
                  }
                }
              }
            }
          }
        }

        if (raHtml) {
          console.log("Parsing content dynamically from _$raHTML...");
          const contentList: any[] = [];
          const pRegex = /<p[^>]*>([\s\S]*?)<\/p>|<img[^>]+src=["']([^"']+)["']/gi;
          let match;
          while ((match = pRegex.exec(raHtml)) !== null) {
            if (match[1]) {
              let pContent = match[1];
              // Image inside paragraph
              const imgInP = pContent.match(/<img[^>]+src=["']([^"']+)["']/i);
              if (imgInP) {
                let src = imgInP[1];
                if (src.startsWith("//")) src = "https:" + src;
                contentList.push({ type: "image", value: src });
                continue;
              }

              let text = pContent.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
              if (!text) continue;
              if (text === "*" || text === "•" || text === "·") continue;

              const isStrong = pContent.includes("<strong") || pContent.includes("font-weight: bold") || pContent.includes("font-weight:bold");
              if (isStrong && text.length < 50) {
                contentList.push({ type: "subheading", value: text });
              } else if (text.startsWith("*") && text.endsWith("*")) {
                contentList.push({ type: "quote", value: text.slice(1, -1) });
              } else {
                contentList.push({ type: "paragraph", value: text });
              }
            } else if (match[2]) {
              let src = match[2];
              if (src.startsWith("//")) src = "https:" + src;
              contentList.push({ type: "image", value: src });
            }
          }

          if (contentList.length > 0) {
            return res.json({
              title: "践行绿色发展理念，筑牢生态文明意识——参观阿苏卫循环经济园",
              summary: "3月中旬，用友党委组织党员赴阿苏卫循环经济产业园科普宣教展厅参观学习，深刻感受环保科技对生态环境的积极作用。",
              content: contentList
            });
          }
        }
      }
    }

    // Default to our beautifully extracted robust version if parsing failed
    console.log("Using pre-extracted high-fidelity fallback...");
    return res.json({
      title: "践行绿色发展理念，筑牢生态文明意识——参观阿苏卫循环经济园",
      summary: "3月中旬，用友党委组织党员赴阿苏卫循环经济产业园科普宣教展厅参观学习，深刻感受环保科技对生态环境的积极作用。",
      content: defaultArticleContent
    });

  } catch (error: any) {
    console.error("Error fetching or parsing article:", error.message);
    return res.json({
      title: "践行绿色发展理念，筑牢生态文明意识——参观阿苏卫循环经济园",
      summary: "3月中旬，用友党委组织党员赴阿苏卫循环经济产业园科普宣教展厅参观学习，深刻感受环保科技对生态环境的积极作用。",
      content: defaultArticleContent
    });
  }
});

// 2. Red Sail AI Mentor - Interactive Assistant Chat
router.post("/api/ai/assistant", async (req, res) => {
  const { articleId, title, summary, message, history = [] } = req.body;

  if (!message) {
    return res.status(400).json({ error: "消息内容不能为空" });
  }

  // Graceful fallback if AI is not configured
  if (!aiClient) {
    return simulateMentorChat(title, message, res);
  }

  try {
    const formattedHistory = history.map((h: any) => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.content }]
    }));

    const systemInstruction = `
      你是一位资深的“红帆党建AI导师”，专门指导企业党员和职工进行政治理论学习、组织生活理解、党务常识咨询，以及如何实现“AI+党建”的创新实践。
      当前用户正在阅读的杂志文章是：《${title}》
      文章摘要是：${summary}
      
      你的回复要求：
      1. 政治站位高，观点正确，态度亲切、令人鼓舞、富有正能量。
      2. 语言要接地气，避免一味堆砌空洞口号。紧密结合文章主题，将理论与企业高质量生产力、科技创新（特别是AI赋能）相结合。
      3. 鼓励党员在岗位上发挥先锋模范作用，带头解决实际业务攻坚难题。
      4. 如果用户提问与文章或党建无关，请礼貌地将话题引回到党建与企业高质量发展的主题上来。
      5. 请用简洁优雅的排版格式（可以用 markdown 格式的列表或加粗）来进行答复，字数控制在 200-400 字以内。
    `;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        ...formattedHistory,
        { role: "user", parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Gemini API error during assistant chat:", error);
    // Fallback to simulation on error
    simulateMentorChat(title, message, res);
  }
});

// 3. AI Study Notes Generator
router.post("/api/ai/generate-notes", async (req, res) => {
  const { title, summary, content } = req.body;

  if (!title) {
    return res.status(400).json({ error: "文章标题不能为空" });
  }

  if (!aiClient) {
    return res.json({
      notes: `### 📌 【内置红帆AI学习卡片】
**《${title}》核心导读**

* **思想价值**：本文重点展现了我支部推动高质量发展的坚定决心，通过开展形式多样的创新实践，将党建工作的政治优势转化为凝聚共识、攻坚克难的组织优势。
* **先锋精神**：鼓励全体党员在科技研发、业务突破、志愿服务等各个岗位上主动亮身份、当排头兵，做到“平常时候看得出来，关键时刻站得出来”。
* **AI+党建实践**：紧扣“AI+党建”时代命题，倡导用先进的算法与智能化工具重塑传统工作流，推动党群工作走向精细化、科学化，实现科技赋能、红帆领航。
* **岗位践行指南**：把“红船精神”和“先锋作风”带到工位上，带头解决业务指标瓶颈；用科技志愿服务传递温暖，破除老龄化数字鸿沟。`
    });
  }

  try {
    const prompt = `
      请针对以下党建文章，生成一份深度、实用的“红帆AI学习卡片”（党建研学笔记）。
      文章标题：《${title}》
      文章简要：${summary}
      文章内容：${JSON.stringify(content)}

      请严格按照以下四个板块生成，并使用优雅清晰的 Markdown 语法：
      ### 📌 核心思想总结
      （用2-3句话，提炼本文最核心的政治站位与工作部署）

      ### 💡 理论对标研学
      （结合新时代中国特色社会主义思想，指出该项活动所践行的理论根源或政策导向）

      ### 🚩 先锋模范解析
      （解析文章中的先进事迹或优秀作风，提炼党员应向其学习的具体优秀品质）

      ### 🚀 生产力赋能建议
      （提出2条具体、具备可操作性的“AI+党建”或“数字党群”赋能企业业务、攻坚克难的实践建议）
    `;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.5,
      }
    });

    res.json({ notes: response.text });
  } catch (error: any) {
    console.error("Gemini API error during notes generation:", error);
    res.json({
      notes: `### 📌 核心思想总结
本篇文章着重呈现了我司党组织在践行初心使命、服务企业高质量发展中的主动担当，深刻诠释了党建引领的实质内涵。

### 💡 理论对标研学
活动深度契合高水平科技自立自强与“我为群众办实事”的战略精神，是基层党建与现代企业治理结合的典型案例。

### 🚩 先锋模范解析
党员突击骨干展现出“召之即来、来之能战”的过硬作风，把党旗插在项目攻坚、志愿服务的第一线，发挥了无可替代的哨兵和表率作用。

### 🚀 生产力赋能建议
1. **建立党员AI突击积分制**：将技术公关成效与党性考核直接挂钩。
2. **拓展智慧党建共建社区**：利用企业技术专长，常态化开展科技助老公益，打造红帆特色服务品牌。`
    });
  }
});

// 4. Study reflection submission (互动研学角 · 发邮件)
router.post("/api/study-reflection", async (req, res) => {
  const name = String(req.body.name || "").trim() || "匿名读者";
  const comment = String(req.body.comment || "").trim();
  const title = String(req.body.title || "").trim() || "红帆领航电子杂志";

  if (!comment) {
    return res.status(400).json({ ok: false, message: "请填写思想感悟内容" });
  }
  if (name.length > 50) {
    return res.status(400).json({ ok: false, message: "姓名过长，请缩短后重试" });
  }
  if (comment.length > 2000) {
    return res.status(400).json({ ok: false, message: "感悟内容过长，请缩短后重试" });
  }

  try {
    await sendStudyReflectionEmail({ name, comment, title, req });
    res.json({
      ok: true,
      message: "感悟已提交，我们会尽快整理，优秀感悟将会在下期期刊中展示",
    });
  } catch (error: any) {
    console.error("Study reflection email error:", error);
    res.status(500).json({
      ok: false,
      message: error?.message || "提交失败，请稍后重试",
    });
  }
});

// 5. Red Mentor Comment Review (红色导师点评)
router.post("/api/ai/reply-comment", async (req, res) => {
  const { title, username, comment } = req.body;

  if (!comment) {
    return res.status(400).json({ error: "评论内容不能为空" });
  }

  if (!aiClient) {
    return simulateCommentReview(username, comment, res);
  }

  try {
    const prompt = `
      你是一位党支部内的“红帆特约评论员”（红色导师）。
      一位名叫“${username}”的同志，在阅读了党建杂志文章《${title}》后，发表了以下心得体会/评论：
      “${comment}”

      请你作为党组织导师，写一段简短、温暖、肯定并极具理论升华作用的“红色导师点评（红帆寄语）”。
      要求：
      1. 首先对该同志的发言给予真诚肯定和表扬（如：“${username}同志，你的学习心得非常深刻……”）。
      2. 结合其评论内容，用充满正能量、富有感染力的语言进行总结与启发。
      3. 鼓励其继续在岗位上发挥光和热。
      4. 严格字数控制在 100-150 字以内，简明扼要。
    `;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.8,
      }
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Gemini API error during comment reply:", error);
    simulateCommentReview(username, comment, res);
  }
});

// Helper: Simulate mentor chat for graceful fallback
function simulateMentorChat(articleTitle: string, userMsg: string, res: any) {
  let reply = "";
  const msg = userMsg.toLowerCase();

  if (msg.includes("学习") || msg.includes("收获") || msg.includes("怎么学")) {
    reply = "同志，你好！很高兴看到你对这篇报道的学习热忱。学习的关键在于“学思用贯通，知信行统一”。本期文章重点就在于将党建的组织活力注入日常工作。建议你结合自己的岗位实际，列出一个“微行动清单”，比如每周利用AI工具提高10%的文档效率，或者主动在小组攻坚中认领一个难题，这就是最好的红帆实践！";
  } else if (msg.includes("ai") || msg.includes("技术") || msg.includes("科技")) {
    reply = "非常深刻的思考！“AI+党建”的核心并不是冷冰冰的技术堆砌，而是把“以人民为中心”的温度融入智慧算法，用智能手段把党务工作减负增效，把理论知识送入寻常百姓家。作为科技工作者或基层党员，我们有责任坚守“科技向善”底线，让先进算法在红帆指引下更好地服务生产生活！";
  } else if (msg.includes("先锋") || msg.includes("党员") || msg.includes("榜样")) {
    reply = "榜样是一面镜子，也是最好的集结号！文章里先锋岗党员们的深夜坚守、志愿者手把手的关怀，折射出的正是共产党人的奉献本色。在现代企业中，先锋模范不是高高在上的雕像，而是身边“多想一步、多走一步、多帮一把”的温暖身影。相信你也能在自己的岗位上，亮出属于你的党员底色！";
  } else {
    reply = `同志，你好！针对你提到的关于《${articleTitle}》的话题，这正是我们本期电子期刊所大力提倡的“拼搏精神”与“创新实践”。作为企业的一份子，把党建学习成果内化为在技术开发、客户服务或管理支撑中的进取心，就是红帆精神最好的传承。期待你在接下来的工作中，继续发挥带头表率作用！`;
  }

  res.json({ reply: reply, isSimulated: true });
}

// Helper: Simulate comment review for graceful fallback
function simulateCommentReview(username: string, comment: string, res: any) {
  const responses = [
    `👍 ${username}同志，你的体会十分深刻！能从细节处感知党建对生产力的赋能作用，说明你是用心研读了本刊。正如你所说，把红色精神带到日常工位，将每一项业务视作攻坚战，就是新时代先锋本色的最好体现。继续加油，发挥带头作用！`,
    `👏 感谢${username}同志的精彩分享！科技是硬实力，党建是软凝聚，你的评论一针见血地指出了两者融合的价值所在。希望你继续保持这种学习热情，不仅自己学，也带动身边的同事一起多读书、善思考，为企业高质量发展贡献红色智慧！`,
    `🚩 说的非常好！${username}同志，你的感悟充满了朝气和正能量。把初心写在行动里，把责任扛在双肩上。在平凡的工作中追求卓越，就是最生动的组织生活。祝愿你在接下来的攻坚任务中再立新功！`
  ];
  const idx = Math.floor(Math.random() * responses.length);
  res.json({ reply: responses[idx], isSimulated: true });
}

// Integration of Vite Middleware and Static Assets
async function startServer() {
  app.use(mountPath, router);

  if (process.env.NODE_ENV !== "production") {
    const viteBase = mountPath === "/" ? "/" : `${mountPath}/`;
    const vite = await createViteServer({
      base: viteBase,
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(mountPath, vite.middlewares);
    console.log(`Vite Development Middleware loaded at ${mountPath}`);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(mountPath, express.static(distPath));
    app.get(`${mountPath === "/" ? "" : mountPath}/*`, (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log(`Production static asset serving configured at ${mountPath}`);
  }

  app.listen(PORT, "0.0.0.0", () => {
    const suffix = BASE_PATH ? BASE_PATH : "";
    console.log(`Express server running on http://localhost:${PORT}${suffix}`);
  });
}

startServer();
