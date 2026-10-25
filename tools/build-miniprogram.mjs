// 把网页版（demo/）里与界面无关的模块同步给微信小程序（miniprogram/shared/）。
// 剧情、练习关、MBTI 题目、立绘、音频两边共用同一份源码：改完 demo/ 里的这些文件后运行
//   node tools/build-miniprogram.mjs
// 网页版界面（vn.js / story.js / game.js / style.css）在小程序里有对应的原生实现（miniprogram/core、pages），不在这里同步。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SHARED = ["art.js", "audio.js", "scenarios.js", "story-data.js", "story-campus.js", "story-work.js"];
const IMAGES = ["logo-icon.png"];
const out = path.join(root, "miniprogram/shared");
const NOTE = "// ⚠ 自动生成，请勿手改。源文件在 demo/ 下，改完运行 node tools/build-miniprogram.mjs";

fs.mkdirSync(out, { recursive: true });
for (const f of SHARED) {
  const src = fs.readFileSync(path.join(root, "demo", f), "utf8");
  // 小程序没有 DOM：共享模块只能通过 window.X 互相引用，外加 localStorage / AudioContext（由 core/env.js 提供）
  const bad = src.match(/\b(document|navigator|location)\.\w+/);
  if (bad) throw new Error(`demo/${f} 用到了 ${bad[0]}，小程序里没有，不能直接共用`);
  const head = `${NOTE}\n// 源文件：demo/${f}\nvar window = require("../core/env.js"), localStorage = window.localStorage;\n`;
  fs.writeFileSync(path.join(out, f), head + src);
}
fs.writeFileSync(path.join(out, "index.js"),
  `${NOTE}\n// 按网页版 index.html 的顺序加载共享模块，导出挂满 ART / AU / QUIZ / MBTI / ROUTES / STORIES 的 window 替身。\n` +
  SHARED.map(f => `require("./${f}");`).join("\n") + `\nmodule.exports = require("../core/env.js");\n`);

fs.mkdirSync(path.join(root, "miniprogram/img"), { recursive: true });
for (const f of IMAGES) fs.copyFileSync(path.join(root, "demo/img", f), path.join(root, "miniprogram/img", f));

console.log(`已同步 ${SHARED.length} 个共享模块、${IMAGES.length} 张图片 → miniprogram/`);
