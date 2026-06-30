import fs from "fs";

function parse() {
  const data = JSON.parse(fs.readFileSync("xiumius_data.json", "utf-8"));
  
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

  const content: any[] = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>|<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = pRegex.exec(raHtml)) !== null) {
    if (match[1]) {
      let pContent = match[1];
      
      const imgInP = pContent.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgInP) {
        let src = imgInP[1];
        if (src.startsWith("//")) src = "https:" + src;
        content.push({ type: "image", value: src });
        continue;
      }

      let text = pContent.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
      if (!text) continue;
      if (text === "*" || text === "•" || text === "·" || text === "🚩") continue;

      const isStrong = pContent.includes("<strong") || pContent.includes("font-weight: bold") || pContent.includes("font-weight:bold");
      if (isStrong && text.length < 50) {
        content.push({ type: "subheading", value: text });
      } else if (text.startsWith("*") && text.endsWith("*")) {
        content.push({ type: "quote", value: text.slice(1, -1) });
      } else {
        content.push({ type: "paragraph", value: text });
      }
    } else if (match[2]) {
      let src = match[2];
      if (src.startsWith("//")) src = "https:" + src;
      content.push({ type: "image", value: src });
    }
  }

  fs.writeFileSync("parsed_red_sail_1.json", JSON.stringify({
    title: "践行绿色发展理念，筑牢生态文明意识——用友党委参观阿苏卫循环经济园科普宣教展厅纪实",
    summary: "3月中旬，用友党委组织党员赴阿苏卫循环经济产业园科普宣教展厅参观学习，深刻感受环保科技对生态环境的积极作用。",
    content: content
  }, null, 2));
  console.log("Successfully parsed and saved to parsed_red_sail_1.json");
}

parse();
