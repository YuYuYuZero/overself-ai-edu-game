// 网页版共享模块（shared/，由 tools/build-miniprogram.mjs 从 demo/ 生成）用的 window 替身。
// 它们只通过 window.X 互相引用，另外用到 localStorage 和 AudioContext，这里补上小程序版本。
const env = {};

env.localStorage = {
  getItem(k) {
    try { const v = wx.getStorageSync(k); return v === "" || v == null ? null : String(v); } catch (e) { return null; }
  },
  setItem(k, v) { try { wx.setStorageSync(k, String(v)); } catch (e) {} },
  removeItem(k) { try { wx.removeStorageSync(k); } catch (e) {} }
};

// 小程序 WebAudio（基础库 2.19.0+）与浏览器接口一致，但文档没写全 AudioParam 的调度方法。
// 缺哪个就用定时器近似（到点直接跳到目标值），保证 audio.js 不改一行也能出声。
function fixParam(p, ctx) {
  if (!p) return;
  const at = (t, fn) => { const ms = ((t || 0) - ctx.currentTime) * 1000; if (ms > 4) setTimeout(fn, ms); else fn(); };
  const jump = function (v, t) { at(t, () => { try { p.value = v; } catch (e) {} }); return p; };
  try {
    if (typeof p.setValueAtTime !== "function") p.setValueAtTime = jump;
    if (typeof p.linearRampToValueAtTime !== "function") p.linearRampToValueAtTime = jump;
    if (typeof p.exponentialRampToValueAtTime !== "function") p.exponentialRampToValueAtTime = p.linearRampToValueAtTime;
    if (typeof p.setTargetAtTime !== "function") p.setTargetAtTime = jump;
    if (typeof p.cancelScheduledValues !== "function") p.cancelScheduledValues = function () { return p; };
  } catch (e) {}
}
function patch(ctx) {
  const wrap = (name, params) => {
    const orig = ctx[name];
    if (typeof orig !== "function") return;
    try {
      ctx[name] = function () {
        const node = orig.apply(ctx, arguments);
        for (const k of params) {
          if (!node[k]) { try { node[k] = { value: 0 }; } catch (e) {} }
          fixParam(node[k], ctx);
        }
        return node;
      };
    } catch (e) {}
  };
  wrap("createOscillator", ["frequency", "detune"]);
  wrap("createGain", ["gain"]);
  wrap("createBiquadFilter", ["frequency", "Q", "gain"]);
  wrap("createBufferSource", ["playbackRate"]);
  env.audioContext = ctx;
  return ctx;
}
if (typeof wx !== "undefined" && typeof wx.createWebAudioContext === "function") {
  env.AudioContext = function () { return patch(wx.createWebAudioContext()); };
}

module.exports = env;
