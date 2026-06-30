import fs from "fs";

function parse() {
  const data = JSON.parse(fs.readFileSync("xiumius_data.json", "utf-8"));
  
  // Let's find _$raHTML in any layers
  let raHtml = "";
  if (data.cubes) {
    for (const cube of data.cubes) {
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

  if (!raHtml) {
    console.log("No _$raHTML found");
    return;
  }

  // Now, let's extract elements from raHtml.
  // We can use a simple HTML parser or regex to extract paragraphs, headings, quotes, and images in sequential order!
  // Let's extract <p> tags, <strong> headings, <img> tags, etc.
  // A regex that matches tags sequentially:
  const tagRegex = /<(p|img|strong|em)[^>]*>([\s\S]*?)<\/\1>|<img[^>]+src=["']([^"']+)["']/gi;
  
  // Let's do a more robust split or parse using cheerio or simple DOM parser? We can just do a regex parser!
  // Let's write a small script to parse raHtml into content blocks.
  const content: any[] = [];
  
  // Let's parse raHtml by splitting into tokens or matching tags
  // Actually, we can use a DOM parser or a regex. Let's do a regex on paragraphs and headers.
  // In raHtml, each block of text is wrapped in a <p> tag.
  // Inside <p>, some have <strong> which are subheadings.
  // Some have <img>.
  
  // Let's find all <p>...</p> and <img>
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>|<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = pRegex.exec(raHtml)) !== null) {
    if (match[1]) {
      // It's a paragraph
      let pContent = match[1];
      
      // Check if it has <img>
      const imgInP = pContent.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgInP) {
        let src = imgInP[1];
        if (src.startsWith("//")) src = "https:" + src;
        content.push({ type: "image", value: src });
        continue;
      }

      // Strip inner html tags
      let text = pContent.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
      if (!text) continue;
      if (text === "*" || text === "•" || text === "·") continue;

      // Check if it was a strong subheading
      const isStrong = pContent.includes("<strong") || pContent.includes("font-weight: bold") || pContent.includes("font-weight:bold");
      if (isStrong && text.length < 50) {
        content.push({ type: "subheading", value: text });
      } else if (text.startsWith("*") && text.endsWith("*")) {
        content.push({ type: "quote", value: text.slice(1, -1) });
      } else {
        content.push({ type: "paragraph", value: text });
      }
    } else if (match[2]) {
      // It's an image
      let src = match[2];
      if (src.startsWith("//")) src = "https:" + src;
      content.push({ type: "image", value: src });
    }
  }

  console.log("=== PARSED CONTENT STRUCTURE ===");
  console.log(JSON.stringify(content, null, 2));
}

parse();
