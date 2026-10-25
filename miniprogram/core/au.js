// 声音：直接复用网页版 audio.js（WebAudio 实时合成，零音频文件），外面包一层：
// 1) 每个调用都 try/catch —— 小程序 WebAudio 还是 Beta，出错只丢声音，不打断剧情；
// 2) 记住当前的音乐 / 环境音 / 心跳，小程序切到后台时停掉，回到前台再接上。
const env = require("../shared/index.js");

const AU = env.AU;
const cur = { bgm: undefined, amb: null, heart: 0 };
const safe = fn => function () {
  try { return fn.apply(null, arguments); } catch (e) { console.warn("[AU]", e); }
};

const api = {};
Object.keys(AU).forEach(k => { api[k] = safe(AU[k]); });
api.bgm = safe(name => { cur.bgm = name; AU.bgm(name); });
api.amb = safe(name => { cur.amb = name; AU.amb(name); });
api.heart = safe(t => { cur.heart = t; AU.heart(t); });
api.pause = safe(() => {
  AU.stopAll();
  const c = env.audioContext;
  if (c && typeof c.suspend === "function") c.suspend();
});
api.resume = safe(() => {
  const c = env.audioContext;
  if (c && typeof c.resume === "function") c.resume();
  if (cur.bgm !== undefined) AU.bgm(cur.bgm);
  AU.amb(cur.amb);
  AU.heart(cur.heart);
});

module.exports = api;
