import fetch from "node-fetch";
import fs from "fs";

async function test() {
  const url = "https://sd.xiumius.cn/xmi/pd/1zZWL/ac3c1b7ac239ee980859b63d145827ce/1782303966030.json?_ver=1782303958000";
  try {
    const res = await fetch(url);
    const data = await res.json();
    fs.writeFileSync("xiumius_data.json", JSON.stringify(data, null, 2));
    console.log("JSON written successfully to xiumius_data.json");
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

test();
