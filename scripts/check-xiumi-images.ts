import fs from "fs";
import { fetchProxiedImage } from "../lib/image-proxy";

const articles = JSON.parse(
  fs.readFileSync("src/generated/articles.json", "utf8")
) as Array<{
  imageUrl?: string;
  content?: Array<{ type: string; value?: string }>;
}>;

const urls = new Set<string>();
for (const a of articles) {
  for (const b of a.content || []) {
    if (b.type === "image" && b.value) urls.add(b.value);
  }
  if (a.imageUrl?.includes("xiumi")) urls.add(a.imageUrl);
}

type Fail = { url: string; direct: number; proxy: string };

async function testDirect(url: string) {
  const r = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    redirect: "follow",
  });
  return r.status;
}

async function main() {
  const all = [...urls];
  let ok = 0;
  const fail: Fail[] = [];
  let directBlocked = 0;

  for (const url of all) {
    let directStatus = 0;
    try {
      directStatus = await testDirect(url);
      if (directStatus >= 400) directBlocked++;
      const { buffer } = await fetchProxiedImage(url);
      if (buffer.length > 100) ok++;
      else fail.push({ url, direct: directStatus, proxy: "tiny buffer" });
    } catch (e: any) {
      fail.push({ url, direct: directStatus, proxy: e.message });
    }
  }

  console.log("Total xiumi images:", all.length);
  console.log("Proxy OK:", ok);
  console.log("Proxy FAIL:", fail.length);
  console.log("Direct fetch 4xx/5xx:", directBlocked);
  if (fail.length) {
    console.log("\nFailures:");
    for (const f of fail) {
      console.log(`- ${f.url.slice(-70)}\n  direct=${f.direct} proxy=${f.proxy}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
