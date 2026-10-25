// 页面数据的批量更新 + 点击回调登记。
// 网页版引擎边拼 DOM 边挂 onclick；小程序这边引擎拼的是"描述对象"，里面的 tap: fn 在这里换成 id，
// 页面上统一 catchtap="onTap" data-id="{{item.id}}" 回调。同一轮同步代码里的多次 set 合并成一次 setData。
module.exports = function createUI(page) {
  let pending = null, cbs = [], dead = false, seq = 0;
  const handlers = new Map(); // id → { fn, scope }

  function flush() {
    const p = pending, list = cbs;
    pending = null; cbs = [];
    if (dead || !p) return;
    page.setData(p, list.length ? () => list.forEach(f => f()) : undefined);
  }
  function setPath(o, parts, v) {
    for (let i = 0; i < parts.length - 1; i++) {
      if (o[parts[i]] == null || typeof o[parts[i]] !== "object") o[parts[i]] = {};
      o = o[parts[i]];
    }
    o[parts[parts.length - 1]] = v;
  }
  // obj 的键可以是 "a" 或 "a.b.c"（只用点号路径）；父路径已在队列里时直接改那份对象
  function set(obj, cb) {
    if (!pending) { pending = {}; Promise.resolve().then(flush); }
    for (const k of Object.keys(obj)) {
      const parent = Object.keys(pending).find(p => k.indexOf(p + ".") === 0);
      if (parent) { setPath(pending[parent], k.slice(parent.length + 1).split("."), obj[k]); continue; }
      for (const p of Object.keys(pending)) if (p.indexOf(k + ".") === 0) delete pending[p];
      pending[k] = obj[k];
    }
    if (cb) cbs.push(cb);
  }

  function reg(fn, scope) { const id = "h" + (++seq); handlers.set(id, { fn, scope }); return id; }
  function drop(scope) { for (const [id, h] of handlers) if (h.scope === scope) handlers.delete(id); }
  function tap(id) { const h = id && handlers.get(id); if (h) h.fn(); }
  // 深拷贝描述对象：tap 函数换成 id（dis 为真的不登记，点了没反应）
  function strip(x, scope) {
    if (Array.isArray(x)) return x.filter(y => y != null && y !== false).map(y => strip(y, scope));
    if (x && typeof x === "object") {
      const o = {};
      for (const k of Object.keys(x)) {
        if (k === "tap") { if (typeof x.tap === "function" && !x.dis) o.id = reg(x.tap, scope); }
        else o[k] = strip(x[k], scope);
      }
      return o;
    }
    return x;
  }

  // 交互面板（选项、分类、拼句……）：blocks 为 [{ k: 类型, ... }]，见 templates/stage.wxml
  function panel(blocks, opt = {}) {
    drop("panel");
    if (!blocks) return set({ panel: null });
    const bs = strip(blocks, "panel").map((b, i) => Object.assign(b, { bid: b.k + i }));
    set({ panel: { big: !!opt.big, blocks: bs, to: opt.to || "" } });
  }

  return {
    set, reg, drop, tap, strip, panel,
    kill() { dead = true; pending = null; handlers.clear(); },
    get dead() { return dead; }
  };
};
