// 把 16 型 × 男女的人物形象渲染成 PNG，给小程序分享卡片用（小程序的 Canvas 在真机上画不了 SVG）。
//   node tools/render-portraits.mjs      → miniprogram/packageShare/portraits/ENFP-f.png …
// 改了 demo/art.js 的人物画法或 TYPE_LOOK 之后重新运行。需要 Chrome；装了 Python 的 Pillow 会顺手压成 128 色 PNG（约 25KB / 张）。
import { mkdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { launch } from "./lib/chrome.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "miniprogram/packageShare/portraits");
const TYPES = ["INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP", "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"];
const W = 340, H = 646, KEEP = 0.82; // 分享卡上只露到胸口，裁掉下面 18%
mkdirSync(out, { recursive: true });

const b = await launch({ width: W, height: H, scale: 2 });
await b.send("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });
await b.open(`file://${root}/tools/art-preview.html?m=none`);
await b.eval(`document.body.style.cssText = "margin:0;background:transparent"`);
const files = [];
for (const t of TYPES) for (const s of ["f", "m"]) {
  const expr = t[0] === "E" ? "smile" : "normal";
  await b.eval(`document.body.innerHTML = '<style>.mo,.ec{display:none}</style><div style="width:${W}px;height:${H}px">' +
    ART.char(ART.typeChar("${t}", "${s}"), "${expr}").replace("<svg", '<svg style="width:100%;height:100%;display:block"') + "</div>"`, 150);
  const f = path.join(out, `${t}-${s}.png`);
  const r = await b.send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: W, height: Math.round(H * KEEP), scale: 1 } });
  (await import("node:fs")).writeFileSync(f, Buffer.from(r.data, "base64"));
  files.push(f);
}
if (b.errors.length) console.log("页面报错：", b.errors);
b.close();

try {
  execFileSync("python3", ["-c", `
import sys
from PIL import Image
for f in sys.argv[1:]:
    Image.open(f).convert("RGBA").quantize(colors=128, method=Image.Quantize.FASTOCTREE).save(f, optimize=True)
`, ...files]);
} catch (e) { console.log("（没有 Pillow，保留原始 PNG：pip3 install pillow 后重跑可以缩小体积）"); }
const total = files.reduce((n, f) => n + statSync(f).size, 0);
console.log(`已生成 ${files.length} 张形象图 → ${path.relative(root, out)}/（共 ${(total / 1024).toFixed(0)} KB）`);
