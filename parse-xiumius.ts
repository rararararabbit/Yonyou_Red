import fs from "fs";

function parse() {
  const html = fs.readFileSync("xiumius.html", "utf-8");
  
  // Let's find any text inside elements
  // Xiumius puts texts in <p> or <span> or <section> elements
  // Let's use a simple HTML parser or regex
  const textMatches = html.match(/<section[^>]*>([\s\S]*?)<\/section>|<p[^>]*>([\s\S]*?)<\/p>|<span[^>]*>([\s\S]*?)<\/span>/gi);
  
  const seen = new Set<string>();
  const lines: string[] = [];
  
  if (textMatches) {
    for (const match of textMatches) {
      // Strip html tags
      const text = match.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
      if (text.length > 5 && !seen.has(text) && !text.includes("xiumi") && !text.includes("/*") && !text.includes("*/") && !text.includes("display:") && !text.includes("@")) {
        seen.add(text);
        lines.push(text);
      }
    }
  }

  // Find all images
  const imgMatches = html.match(/<img[^>]+src=["']([^"']+)["']/gi);
  const images: string[] = [];
  if (imgMatches) {
    for (const match of imgMatches) {
      const srcMatch = match.match(/src=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        const src = srcMatch[1];
        if (src.startsWith("http") && !src.includes("xiumi") && !src.includes("icon") && !src.includes("logo")) {
          if (!images.includes(src)) {
            images.push(src);
          }
        }
      }
    }
  }

  console.log("=== PARSED TEXT LINES ===");
  console.log(JSON.stringify(lines, null, 2));
  console.log("=== IMAGES ===");
  console.log(JSON.stringify(images, null, 2));
}

parse();
