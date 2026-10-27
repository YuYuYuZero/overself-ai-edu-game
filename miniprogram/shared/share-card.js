// ⚠ 自动生成，请勿手改。源文件在 demo/ 下，改完运行 node tools/build-miniprogram.mjs
// 源文件：demo/share-card.js
var window = require("../core/env.js"), localStorage = window.localStorage;
// 分享卡片：只用 Canvas 2D 的基础接口绘制，网页版（<canvas>）与小程序（canvas type="2d"）共用 → window.ShareCard。
// 调用方负责建画布、按像素比缩放、加载图片（网页 new Image() / 小程序 canvas.createImage()），这里只管画。
//   ShareCard.poster(ctx, data, imgs)  竖版海报 750×1200（保存到相册 / 发朋友圈）
//   ShareCard.cover(ctx, data, imgs)   5:4 封面 500×400（微信转发卡片的 imageUrl）
//   ShareCard.data(res, opt)           把测试结果整理成绘制用的数据
// imgs: { portrait 人物半身像, logo, qr 小程序码 / 二维码 }，都可以缺省。
window.ShareCard = (function () {
  const FONT = '-apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
  const PAPER = "#f6f1e7", INK = "#24223a", MUTED = "#8b8698", LINE = "#e5ddcd";
  const font = (px, w) => `${w || "normal"} ${px}px ${FONT}`;

  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function text(ctx, s, x, y, px, color, w, align) {
    ctx.font = font(px, w); ctx.fillStyle = color; ctx.textAlign = align || "left"; ctx.textBaseline = "alphabetic";
    ctx.fillText(s, x, y);
  }
  // 中文按字折行（英文单词不拆），最多 lines 行，超出加省略号
  function wrap(ctx, s, x, y, maxW, px, lh, color, lines, w) {
    ctx.font = font(px, w); ctx.fillStyle = color; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    const tokens = s.match(/[A-Za-z0-9%.\-]+|./g) || [];
    const out = []; let cur = "";
    for (const t of tokens) {
      if (ctx.measureText(cur + t).width > maxW && cur) { out.push(cur); cur = t.trim() ? t : ""; }
      else cur += t;
    }
    if (cur) out.push(cur);
    const shown = out.slice(0, lines || out.length);
    if (lines && out.length > lines) {
      let last = shown[lines - 1];
      while (last && ctx.measureText(last + "…").width > maxW) last = last.slice(0, -1);
      shown[lines - 1] = last + "…";
    }
    shown.forEach((l, i) => ctx.fillText(l, x, y + i * lh));
    return shown.length;
  }
  // 逐字排开的大字母（Canvas 没有可靠的 letterSpacing）
  function spaced(ctx, s, x, y, px, color, gap) {
    ctx.font = font(px, "bold"); ctx.fillStyle = color; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    for (const ch of s) { ctx.fillText(ch, x, y); x += ctx.measureText(ch).width + gap; }
    return x - gap;
  }
  function band(ctx, x, y, w, h, g, r) {
    const lg = ctx.createLinearGradient(x, y, x + w, y + h);
    lg.addColorStop(0, g.color); lg.addColorStop(1, g.deep);
    ctx.save(); rr(ctx, x, y, w, h, r); ctx.fillStyle = lg; ctx.fill(); ctx.clip();
    // 背景里两道浅色圆弧 + 斜线纹，压出层次
    ctx.globalAlpha = 0.12; ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(x + w * 0.86, y + h * 0.18, h * 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.08;
    ctx.beginPath(); ctx.arc(x + w * 0.08, y + h * 1.05, h * 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.07; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
    for (let i = -h; i < w; i += 26) { ctx.beginPath(); ctx.moveTo(x + i, y + h); ctx.lineTo(x + i + h, y); ctx.stroke(); }
    ctx.restore();
  }
  // 印章：红底白字的方章
  function seal(ctx, x, y, s, label) {
    ctx.save();
    ctx.translate(x + s / 2, y + s / 2); ctx.rotate(-0.08);
    rr(ctx, -s / 2, -s / 2, s, s, s * 0.14); ctx.fillStyle = "#c8372d"; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,.75)"; rr(ctx, -s / 2 + 5, -s / 2 + 5, s - 10, s - 10, s * 0.1); ctx.stroke();
    ctx.font = font(s * 0.3, "bold"); ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(label[0], 0, -s * 0.17); ctx.fillText(label[1], 0, s * 0.19);
    ctx.restore();
  }

  // 四个维度的双向条：左右两端是两个字母，填充从中线向偏向的一侧长出去
  function dimBar(ctx, r, x, y, w, g) {
    text(ctx, `${r.an} ${r.a}`, x, y, 22, r.left ? INK : MUTED, r.left ? "bold" : "normal");
    text(ctx, `${r.b} ${r.bn}`, x + w, y, 22, r.left ? MUTED : INK, r.left ? "normal" : "bold", "right");
    const by = y + 16, bh = 14, mid = x + w / 2;
    rr(ctx, x, by, w, bh, bh / 2); ctx.fillStyle = "#ebe4d6"; ctx.fill();
    const len = (r.p - 50) / 50 * (w / 2);
    if (len > 0.5) {
      ctx.save(); rr(ctx, x, by, w, bh, bh / 2); ctx.clip();
      ctx.fillStyle = g.color; ctx.fillRect(r.left ? mid - len : mid, by, len, bh);
      ctx.restore();
    }
    ctx.fillStyle = "#fff"; ctx.fillRect(mid - 1.5, by - 3, 3, bh + 6);
    const label = `${r.p}% ${r.letterName} · ${r.clarity.label}`;
    text(ctx, label, mid, by + bh + 28, 19, g.deep, "bold", "center");
  }

  // 人物从头顶往下画，高度按图片自身比例：网页版用整张立绘 SVG，小程序用裁到胸口的 PNG（tools/render-portraits.mjs）
  function portrait(ctx, img, x, y, w) {
    if (!img || !img.width) return;
    try { ctx.drawImage(img, x, y, w, w * img.height / img.width); } catch (e) {}
  }

  const W = 750, H = 1200;
  function poster(ctx, d, imgs) {
    imgs = imgs || {};
    const g = d.group;
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
    // 点阵纸
    ctx.fillStyle = "rgba(36,34,58,.06)";
    for (let yy = 12; yy < H; yy += 24) for (let xx = 12; xx < W; xx += 24) ctx.fillRect(xx, yy, 2, 2);

    // 顶部色块：类型、名称、气质组、一句话 + 人物
    const BX = 28, BY = 28, BW = W - 56, BH = 560;
    band(ctx, BX, BY, BW, BH, g, 36);
    ctx.save(); rr(ctx, BX, BY, BW, BH, 36); ctx.clip();
    portrait(ctx, imgs.portrait, BX + BW - 352, BY + 92, 340);
    ctx.restore();

    if (imgs.logo) { ctx.save(); rr(ctx, 60, 60, 48, 48, 12); ctx.clip(); ctx.drawImage(imgs.logo, 60, 60, 48, 48); ctx.restore(); }
    text(ctx, "MBTI 性格修炼手册", imgs.logo ? 120 : 60, 92, 24, "#fff", "bold");
    text(ctx, "我的人格类型", 60, 172, 24, "rgba(255,255,255,.82)");
    spaced(ctx, d.type, 56, 300, 124, "#fff", 4);
    text(ctx, d.name, 60, 362, 40, "#fff", "bold");
    ctx.font = font(22, "bold");
    const chip = `${g.name} · ${d.groupKey}`, cw = ctx.measureText(chip).width + 32;
    rr(ctx, 60, 388, cw, 40, 20); ctx.fillStyle = "rgba(255,255,255,.2)"; ctx.fill();
    text(ctx, chip, 76, 416, 22, "#fff", "bold");
    wrap(ctx, `「${d.tagline}」`, 60, 480, 360, 24, 38, "rgba(255,255,255,.92)", 3);
    seal(ctx, BX + BW - 100, BY + 30, 68, "修炼");

    // 四个维度
    let y = BY + BH + 52;
    text(ctx, "四个维度", 60, y, 26, INK, "bold");
    if (d.modeLabel) text(ctx, d.modeLabel, W - 60, y, 18, MUTED, "normal", "right");
    y += 44;
    const colW = (W - 120 - 40) / 2;
    d.dims.forEach((r, i) => dimBar(ctx, r, 60 + (i % 2) * (colW + 40), y + Math.floor(i / 2) * 100, colW, g));
    y += 2 * 100;

    // 另一面
    rr(ctx, 44, y, W - 88, 142, 22); ctx.fillStyle = g.soft; ctx.fill();
    text(ctx, d.unlockTitle, 72, y + 48, 26, g.deep, "bold");
    wrap(ctx, d.growth, 72, y + 88, W - 160, 21, 32, "#4e4b63", 2);

    // 底部：二维码 + 引导语
    const fy = H - 122;
    ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.setLineDash && ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.moveTo(44, fy - 22); ctx.lineTo(W - 44, fy - 22); ctx.stroke();
    ctx.setLineDash && ctx.setLineDash([]);
    const qx = W - 44 - 112;
    if (imgs.qr) {
      rr(ctx, qx - 6, fy - 6, 124, 124, 14); ctx.fillStyle = "#fff"; ctx.fill();
      ctx.drawImage(imgs.qr, qx, fy, 112, 112);
    }
    text(ctx, d.cta || "测出你的 MBTI，体验另一面", 60, fy + 34, 26, INK, "bold");
    text(ctx, d.footer || "", 60, fy + 72, 20, "#4e4b63");
    text(ctx, "MBTI 是理解自己的一种语言，不是心理诊断", 60, fy + 104, 17, MUTED);
  }

  const CW = 500, CH = 400;
  function cover(ctx, d, imgs) {
    imgs = imgs || {};
    const g = d.group;
    band(ctx, 0, 0, CW, CH, g, 0);
    portrait(ctx, imgs.portrait, CW - 236, 46, 230);
    text(ctx, "我的 MBTI 是", 36, 80, 24, "rgba(255,255,255,.85)");
    spaced(ctx, d.type, 32, 186, 96, "#fff", 2);
    text(ctx, d.name, 36, 240, 30, "#fff", "bold");
    ctx.font = font(20, "bold");
    const chip = g.name, cw = ctx.measureText(chip).width + 28;
    rr(ctx, 36, 264, cw, 36, 18); ctx.fillStyle = "rgba(255,255,255,.22)"; ctx.fill();
    text(ctx, chip, 50, 289, 20, "#fff", "bold");
    rr(ctx, 0, CH - 64, CW, 64, 0); ctx.fillStyle = "rgba(0,0,0,.22)"; ctx.fill();
    text(ctx, "测测你的另一面 →", 36, CH - 24, 24, "#fff", "bold");
  }

  // 测试结果 → 绘制数据。opt: { footer, cta }
  function data(res, opt) {
    const M = window.MBTI, t = res.type, gk = M.groupOf(t), prof = M.profiles[t], tf = t[2], c = M.complement[tf];
    return {
      type: t, name: M.names[t], groupKey: gk, group: M.groups[gk], tagline: prof.tagline,
      dims: M.dimRows(res), growth: prof.growth, unlockTitle: `我的另一面：${tf} 解锁 ${c.to} · ${c.title}`,
      modeLabel: res.mode === "quick" ? "快速版 24 题" : res.mode === "full" ? "专业版 60 题" : "",
      footer: (opt && opt.footer) || "", cta: opt && opt.cta
    };
  }

  // 立绘 SVG → 能当 <img> / canvas 图片用的 data URI：去掉重复属性（XML 解析会报错）、补上宽高、关掉张嘴 / 闭眼图层
  function svgUri(svg) {
    if (!svg || svg.indexOf("<svg") !== 0) return "";
    svg = svg.replace(/<([a-zA-Z][\w:-]*)((?:\s+[\w:-]+="[^"]*")+)\s*(\/?)>/g, (m, tag, attrs, close) => {
      const seen = {};
      const kept = attrs.match(/\s+[\w:-]+="[^"]*"/g).filter(a => { const k = a.trim().split("=")[0]; return seen[k] ? false : (seen[k] = true); });
      return `<${tag}${kept.join("")}${close ? "/" : ""}>`;
    }).replace(/^<svg([^>]*)>/, (m, a) => {
      a = a.replace(/\s(style|class)="[^"]*"/g, "");
      const vb = /viewBox="([^"]+)"/.exec(a);
      if (vb) { const p = vb[1].trim().split(/[\s,]+/).map(Number); a += ` width="${p[2]}" height="${p[3]}"`; }
      return `<svg${a}><style>.mo,.ec{opacity:0}</style>`;
    });
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  return { W, H, CW, CH, poster, cover, data, svgUri };
})();
