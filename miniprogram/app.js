// MBTI 性格修炼手册（Overself）· 微信小程序版。
// 剧情、练习关、MBTI 题目、立绘、音频与网页版共用 demo/ 下的源码（由 tools/build-miniprogram.mjs 同步到 shared/）。
const AU = require("./core/au");

App({
  onShow() { AU.resume(); },
  onHide() { AU.pause(); }
});
