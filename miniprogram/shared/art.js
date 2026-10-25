// ⚠ 自动生成，请勿手改。源文件在 demo/ 下，改完运行 node tools/build-miniprogram.mjs
// 源文件：demo/art.js
var window = require("../core/env.js"), localStorage = window.localStorage;
// 美术：SVG 程序化立绘 + 场景背景 → window.ART。设计说明见 docs/04-美术与UI设计.md。
// ART.char(id, expr, {crop:"head"}) 返回 SVG 字符串；ART.bg(id) 返回背景 SVG 字符串。
// 想换成正式插画：在 ART.IMG 里登记 { "char:xiaoman:smile": "img/xiaoman_smile.png", "bg:classroom": "img/classroom.jpg" }，同名优先用图片。
window.ART = (function () {
  let uid = 0;
  const LINE = "#3b2b2b";

  // ======================= 人物设定 =======================
  // age: teen 少年 / young 青年 / mid 中年 / elder 长辈
  const C = {
    // 《那一周》
    linlang: { name: "林朗", sex: "m", age: "young", skin: "#f7dcc8", hair: ["messy", "#2a2a33"], eye: "#3d4d6e", glasses: "rect", outfit: ["hoodie", "#6f7884", "#525a66"] },
    linwan: { name: "林晚", sex: "f", age: "young", skin: "#fbe2d2", hair: ["long", "#3a2620"], eye: "#6a3f2c", outfit: ["cardigan", "#e8d5b5", "#c9ab80"] },
    mom: { name: "妈妈", sex: "f", age: "elder", skin: "#f3d4bd", hair: ["perm", "#3b2c28", "#8d8580"], eye: "#4a3328", outfit: ["gown", "#bcd3e6", "#8fb0cc"] },
    dad: { name: "爸爸", sex: "m", age: "elder", skin: "#ecc8ad", hair: ["elder", "#8f8b88"], eye: "#3b2f2a", outfit: ["jacket", "#7a5a40", "#5b412c"] },
    drwang: { name: "王医生", sex: "m", age: "mid", skin: "#f2d3bc", hair: ["short", "#25242a"], eye: "#33302e", glasses: "rect", outfit: ["doctor", "#ffffff", "#9fb8d6"] },
    nurse: { name: "护士", sex: "f", age: "young", skin: "#fde4d4", hair: ["bun", "#3a2a24"], eye: "#5b3a2c", cap: "nurse", outfit: ["nurse", "#f6c7d2", "#e39fb1"] },
    // 《汇演前三天》
    xiaoman: { name: "苏小满", sex: "f", age: "teen", skin: "#fde6d6", hair: ["ponytail", "#4a2c22"], eye: "#8a4a2e", outfit: ["uniform_f", "#2f3c66", "#c8344a"], tie: "#c8344a" },
    chenyu: { name: "陈屿", sex: "m", age: "teen", skin: "#f8dfcc", hair: ["neat", "#1f2230"], eye: "#2f4466", outfit: ["uniform_m", "#2f3c66", "#3d5a99"] },
    linke: { name: "林可", sex: "f", age: "teen", skin: "#fde8dc", hair: ["bob", "#1e1a22"], eye: "#3b3550", outfit: ["uniform_f", "#2f3c66", "#c8344a"] },
    teacher_zhou: { name: "周老师", sex: "f", age: "mid", skin: "#f6d9c4", hair: ["lowbun", "#2b2224"], eye: "#3b2a24", glasses: "round", outfit: ["teacher", "#8d6fae", "#d9cfe8"] },
    daliu: { name: "大刘", sex: "m", age: "teen", skin: "#eec6a6", hair: ["spiky", "#1d1b1f"], eye: "#3a2b22", outfit: ["sport", "#2f6fd0", "#ffffff"] },
    // 《第一次带项目》
    xunuo: { name: "许诺", sex: "f", age: "young", skin: "#fde5d6", hair: ["shoulder", "#5a3426"], eye: "#7a4630", outfit: ["blazer_f", "#d8c3a5", "#f7f3ec"] },
    zhao: { name: "赵总监", sex: "m", age: "mid", skin: "#efcfb7", hair: ["sidepart", "#1f1e22", "#8e8c8c"], eye: "#2c2a2a", outfit: ["suit", "#2d3443", "#7a2232"] },
    laozhou: { name: "老周", sex: "m", age: "young", skin: "#f3d6c0", hair: ["short", "#232126"], eye: "#3a3633", glasses: "round", outfit: ["plaid", "#4f7a6a", "#2f4f43"] },
    client: { name: "何女士", sex: "f", age: "mid", skin: "#f8dccb", hair: ["shoulder", "#2a1d1c"], eye: "#3a2620", outfit: ["client", "#5d6170", "#1f2027"], necklace: true },
    // 练习关
    xiaoyu: { name: "小雨", sex: "f", age: "young", skin: "#fde6d8", hair: ["shoulder", "#7a4a33"], eye: "#6b4430", outfit: ["sweater", "#e7a6a0", "#c98179"] },
    xiaolin: { name: "小林", sex: "m", age: "young", skin: "#f8ddc9", hair: ["messy", "#3a2a22"], eye: "#4a3a30", outfit: ["tee", "#88a9c9", "#5d82a8"] },
    // 练习关里的"你"
    you_m: { name: "你", sex: "m", age: "young", skin: "#f6dac6", hair: ["neat", "#3b2a24"], eye: "#4a3a30", outfit: ["plaid", "#5a6f9a", "#34466e"] },
    you_f: { name: "你", sex: "f", age: "young", skin: "#fde4d4", hair: ["bob", "#6a4030"], eye: "#5a3b2b", outfit: ["blazer_f", "#8fb3d9", "#ffffff"] },
    you_sf: { name: "你", sex: "f", age: "teen", skin: "#fde6d8", hair: ["bun", "#2e2420"], eye: "#5a3a2a", outfit: ["uniform_f", "#3b5a4a", "#2f6fd0"] },
    roommate: { name: "室友", sex: "f", age: "young", skin: "#fce4d4", hair: ["bob", "#5b3b2d"], eye: "#5a3b2b", outfit: ["sweater", "#a8c7a0", "#7fa476"] }
  };

  // 年龄 × 性别 → 比例
  function P(c) {
    // 五官比例只随年龄变化，男女一致；性别只影响肩宽、腮红、发型和服装
    const teen = c.age === "teen", elder = c.age === "elder", mid = c.age === "mid", f = c.sex === "f";
    return {
      hs: teen ? 1.2 : elder ? 1.06 : 1.1,         // 头部缩放（少年头身比更"Q"）
      hy: teen ? 190 : 184,                       // 头部中心 y
      w: teen ? 75 : 76,                          // 脸半宽
      h2: teen ? 96 : elder ? 104 : 108,          // 下巴
      jaw: mid || elder ? 0.5 : 0.38,             // 下颌宽度（越小越尖）
      ew: teen ? 44 : elder ? 38 : 42,            // 眼宽
      eh: teen ? 44 : elder ? 22 : mid ? 28 : 36, // 眼高（越大越"少年感"）
      ey: teen ? 30 : 26,
      my: teen ? 74 : 78,
      sw: f ? (teen ? 104 : 110) : (teen ? 118 : elder ? 128 : 134), // 肩半宽
      blush: f ? (teen ? 0.5 : 0.32) : teen ? 0.22 : 0.08,
      wrinkle: elder ? 2 : mid ? 1 : 0,
      ex: 0.42                                    // 眼距（占脸半宽）
    };
  }

  // ---------- 颜色工具 ----------
  function shade(hex, k) { // k<0 变暗，k>0 变亮
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = v => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k);
    return "#" + [f(r), f(g), f(b)].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("");
  }

  // ---------- 头发 ----------
  // 刘海：从左鬓沿头顶到右鬓，再沿发梢从右往左回来（每缕用二次曲线，发梢尖、发根圆）
  function fringe(tips, opt = {}) {
    const L = opt.l || -96, R = opt.r || 96, sy = opt.sy || 10, top = opt.top || -128, sw = opt.sweep ?? 7;
    let d = `M ${L},${sy} C ${L - 6},${top * 0.62} ${L * 0.62},${top} 0,${top} C ${R * 0.62},${top} ${R + 6},${top * 0.62} ${R},${sy}`;
    const pts = [[R - 4, sy - 4], ...tips.slice().sort((a, b) => b[0] - a[0]), [L + 4, sy - 4]];
    let strands = "";
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      const depth = (opt.depth || 30) * (i % 2 ? 1 : 0.78);
      const mx = (x0 + x1) / 2 + sw, my = Math.min(y0, y1) - depth;
      // 一缕头发：发梢略向 sweep 方向勾，发缝处收窄成尖
      d += ` C ${x0 - 2},${y0 - (y0 - my) * 0.45} ${mx + (x0 - mx) * 0.3},${my + 4} ${mx},${my} C ${mx + (x1 - mx) * 0.3},${my + 4} ${x1 + sw * 0.6},${y1 - (y1 - my) * 0.5} ${x1},${y1}`;
      if (i < pts.length - 1) strands += `M ${x1 * 0.5 + sw},${top * 0.62} Q ${x1 * 0.92 + sw},${(top * 0.4 + y1) / 2} ${x1 + sw * 0.4},${y1 - 14} `;
    }
    const out = new String(d + " Z"); out.strands = strands;
    return out;
  }
  const capBack = (bottom, wide = 100, top = -134) => `M ${-wide},${bottom} C ${-wide - 16},${top * 0.6} ${-wide * 0.64},${top} 0,${top} C ${wide * 0.64},${top} ${wide + 16},${top * 0.6} ${wide},${bottom} Z`;
  // 鬓发：上宽下尖，略向内收（x 为靠脸一侧的边）
  const lock = (x, y0, y1, w = 16, curl = 0) => { const s = Math.sign(x) || 1, ix = s * 72, ox = s * 95, tin = y0 - 44, tout = y0 - 6, tip = s * (82 + w * 0.4) + curl;
    return `M ${ix},${tin} C ${ix},${(tin + y1) / 2} ${tip - s * 6},${y1 - 30} ${tip},${y1} C ${ox + s * 6},${y1 - 50} ${ox + s * 4},${(tout + y1) / 2} ${ox},${tout} Q ${s * 90},${tin - 2} ${ix},${tin} Z`; };

  function hairDef(style) {
    switch (style) {
      case "ponytail": return {
        back: [capBack(40, 98), "M 52,-112 C 150,-132 186,-26 160,96 C 150,150 130,190 126,236 C 112,186 126,120 104,40 C 96,0 80,-60 52,-112 Z"],
        front: [fringe([[-80, -22], [-52, -14], [-22, -8], [8, -12], [38, -8], [68, -18]], { depth: 20, sweep: 9 }),
          lock(-88, -6, 104, 12), lock(88, -6, 104, 12)],
        acc: `<circle cx="70" cy="-112" r="11" fill="#e05a6a" stroke="${LINE}" stroke-width="2.5"/>`
      };
      case "bob": return {
        back: ["M -104,74 C -122,-86 -66,-136 0,-136 C 66,-136 122,-86 104,74 C 96,90 72,92 62,76 L -62,76 C -72,92 -96,90 -104,74 Z"],
        front: [fringe([[-80, -24], [-54, -18], [-28, -20], [-2, -16], [24, -20], [50, -16], [76, -24]], { depth: 14, sweep: 5 }),
          lock(-90, -6, 84, 16, 4), lock(90, -6, 84, 16, -4)],
        acc: `<rect x="40" y="-62" width="26" height="8" rx="3" fill="#7fc6e8" stroke="${LINE}" stroke-width="2" transform="rotate(-18 52 -58)"/>`
      };
      case "long": return {
        back: ["M -100,0 C -118,-92 -66,-136 0,-136 C 66,-136 118,-92 100,0 C 112,110 128,220 120,330 C 60,346 -60,346 -120,330 C -128,220 -112,110 -100,0 Z"],
        front: [fringe([[-76, -26], [-46, -50], [-16, -34], [18, -20], [50, -12], [80, -4]], { depth: 20, sweep: 10 }),
          lock(-90, -6, 170, 16), lock(90, -6, 180, 16)]
      };
      case "shoulder": return {
        back: ["M -102,0 C -118,-92 -66,-136 0,-136 C 66,-136 118,-92 102,0 C 108,60 120,110 134,140 C 100,150 70,132 60,120 L -60,120 C -70,132 -100,150 -134,140 C -120,110 -108,60 -102,0 Z"],
        front: [fringe([[-80, -22], [-54, -28], [-26, -18], [2, -24], [30, -16], [58, -24], [82, -18]], { depth: 16, sweep: 8 }),
          lock(-90, -6, 124, 16, -8), lock(90, -6, 124, 16, 8)]
      };
      case "lowbun": return {
        back: [capBack(20, 96, -130), "M 20,-122 a 38,34 0 1,1 76,0 a 38,34 0 1,1 -76,0 Z"],
        front: [fringe([[-84, -34], [-56, -70], [-20, -84], [24, -76], [62, -60], [86, -32]], { depth: 22 }),
          lock(-90, -6, 52, 10), lock(90, -6, 40, 10)]
      };
      case "bun": return {
        back: [capBack(20, 96, -130), "M -34,-136 a 34,28 0 1,1 68,0 a 34,28 0 1,1 -68,0 Z"],
        front: [fringe([[-80, -30], [-50, -44], [-18, -36], [16, -46], [48, -34], [78, -28]], { depth: 24 }), lock(-88, -6, 60, 10)]
      };
      case "neat": return {
        back: [capBack(26, 98)],
        front: [fringe([[-84, -26], [-58, -22], [-30, -16], [-2, -22], [26, -16], [54, -24], [80, -30]], { depth: 30 }),
          lock(-90, -6, 34, 10), lock(90, -6, 34, 10)]
      };
      case "messy": return {
        back: [capBack(20, 100), "M -30,-130 L -18,-160 L -4,-134 Z", "M 10,-134 L 34,-166 L 34,-128 Z"],
        front: [fringe([[-84, -26], [-60, -36], [-34, -18], [-8, -32], [16, -14], [42, -34], [66, -22], [86, -32]], { depth: 34 }),
          lock(-92, -6, 40, 10), lock(92, -6, 40, 10)]
      };
      case "spiky": return {
        back: ["M -100,20 C -108,-40 -116,-80 -92,-104 L -110,-126 L -72,-124 L -70,-160 L -38,-136 L -20,-176 L 4,-140 L 30,-174 L 40,-136 L 76,-156 L 72,-118 L 112,-118 L 96,-92 C 116,-60 108,-20 100,20 Z"],
        front: [fringe([[-84, -50], [-56, -60], [-26, -50], [4, -64], [34, -52], [62, -62], [86, -48]], { depth: 30 })]
      };
      case "sidepart": return {
        back: [capBack(10, 96, -128)],
        front: [fringe([[-86, -34], [-62, -66], [-30, -74], [8, -70], [46, -60], [76, -46], [90, -26]], { depth: 22 })],
        gray: true
      };
      case "short": return {
        back: [capBack(14, 96, -128)],
        front: [fringe([[-86, -40], [-58, -64], [-28, -56], [2, -68], [32, -58], [60, -66], [86, -40]], { depth: 22 })]
      };
      case "elder": return {
        back: [capBack(0, 94, -122)],
        front: [fringe([[-86, -50], [-64, -92], [-30, -106], [10, -108], [48, -100], [76, -82], [88, -50]], { depth: 10, top: -124 })]
      };
      case "perm": {
        // 卷发：沿外轮廓排一圈小卷
        let curls = "";
        for (let i = 0; i <= 14; i++) {
          const a = Math.PI * (0.86 + i * 1.28 / 14); const r = 104;
          const x = Math.cos(a) * r, y = Math.sin(a) * r * 1.05;
          curls += `M ${x - 24},${y} a 24,24 0 1,0 48,0 a 24,24 0 1,0 -48,0 Z `;
        }
        return {
          back: [capBack(56, 104, -136), curls],
          front: [fringe([[-86, -24], [-62, -44], [-30, -58], [6, -54], [40, -46], [70, -34], [88, -16]], { depth: 26, sweep: 10 })],
          gray: true
        };
      }
    }
    return hairDef("short");
  }

  // ---------- 眼睛 ----------
  function eyes(c, p, expr, id) {
    const { ew, ey } = p; let eh = p.eh;
    const ex = p.w * p.ex;
    let t = eh * 0.56, b = eh * 0.46, tilt = 0, lookX = 0, lookY = 0, irisK = 1;
    if (expr === "sad" || expr === "cry") { t *= 0.72; tilt = -5; lookY = 3; }
    if (expr === "worry") { t *= 0.86; tilt = -3; }
    if (expr === "angry") { t *= 0.6; tilt = 7; }
    if (expr === "surprise") { t *= 1.18; b *= 1.1; irisK = 0.82; }
    if (expr === "smile") { b *= 0.72; t *= 0.94; lookY = -1; }
    if (expr === "think") { lookX = 7; lookY = -3; t *= 0.9; }
    if (expr === "shy") { t *= 0.78; lookY = 5; lookX = -4; }
    let out = "", brows = "";
    for (const s of [-1, 1]) {
      const cx = s * ex, cid = `e${id}${s > 0 ? "r" : "l"}`;
      // 眼形（局部坐标，外眼角在 +x，镜像到左眼）：上缘较平、外眼角微微上挑
      const shape = `M ${-ew / 2},${t * 0.05} C ${-ew * 0.3},${-t * 1.12} ${ew * 0.3},${-t * 1.16} ${ew / 2},${-t * 0.3 - tilt} C ${ew * 0.46},${b * 0.9} ${-ew * 0.18},${b * 1.22} ${-ew / 2},${t * 0.05} Z`;
      const tf = `translate(${cx},${ey}) scale(${s},1)`;
      const irx = ew * 0.36 * irisK, iry = Math.max(8, eh * 0.62) * irisK, ix = cx + lookX - s * 1, iy = ey + 1 + lookY;
      out += `<clipPath id="${cid}"><path d="${shape}" transform="${tf}"/></clipPath>`;
      out += `<path d="${shape}" transform="${tf}" fill="#fff"/>`;
      out += `<g clip-path="url(#${cid})">
        <ellipse cx="${ix}" cy="${iy}" rx="${irx}" ry="${iry}" fill="url(#ir${id})" stroke="${shade(c.eye, -0.55)}" stroke-width="1.6"/>
        <ellipse cx="${ix}" cy="${iy + iry * 0.08}" rx="${irx * 0.44}" ry="${iry * 0.5}" fill="${shade(c.eye, -0.65)}"/>
        <ellipse cx="${ix}" cy="${iy + iry * 0.55}" rx="${irx * 0.7}" ry="${iry * 0.28}" fill="${shade(c.eye, 0.5)}" opacity=".45"/>
        <ellipse cx="${ix - irx * 0.34}" cy="${iy - iry * 0.4}" rx="${Math.max(3, eh * 0.13)}" ry="${Math.max(3.5, eh * 0.16)}" fill="#fff"/>
        <circle cx="${ix + irx * 0.38}" cy="${iy + iry * 0.3}" r="${Math.max(1.6, eh * 0.06)}" fill="#fff" opacity=".9"/>
        <path d="M ${cx - ew},${ey - t * 1.4} L ${cx + ew},${ey - t * 1.4} L ${cx + ew},${ey - t * 0.3} Q ${cx},${ey - t * 0.75} ${cx - ew},${ey - t * 0.3} Z" fill="${shade(c.skin, -0.4)}" opacity=".2"/>
      </g>`;
      // 上睫毛：一条外粗内细的实心带，外眼角带一笔眼尾
      const lw = 5.5;
      const upper = `M ${-ew / 2 - 1},${t * 0.05 + 1} C ${-ew * 0.3},${-t * 1.12} ${ew * 0.3},${-t * 1.16} ${ew / 2 + 2},${-t * 0.3 - tilt}` +
        ` C ${ew * 0.3},${-t * 1.16 - lw} ${-ew * 0.3},${-t * 1.12 - lw * 0.6} ${-ew / 2 - 1},${t * 0.05 - 1} Z`;
      out += `<path d="${upper}" transform="${tf}" fill="#2a1d1d" stroke="#2a1d1d" stroke-width="2" stroke-linejoin="round"/>`;
      // 下眼线只给长辈（配合眼角皱纹），年轻角色保持干净
      if (p.wrinkle >= 2) out += `<path d="M ${ew * 0.02},${b * 1.08} Q ${ew * 0.3},${b * 1.02} ${ew * 0.47},${b * 0.55}" transform="${tf}" fill="none" stroke="#4a302b" stroke-width="2.2" stroke-linecap="round" opacity=".6"/>`;
      if (p.wrinkle >= 2) out += `<path d="M ${ew / 2 + 6},-2 l 8,-4 M ${ew / 2 + 6},4 l 9,1 M ${-ew * 0.2},${b * 1.6} q ${ew * 0.3},5 ${ew * 0.6},0" transform="${tf}" fill="none" stroke="${shade(c.skin, -0.32)}" stroke-width="2" stroke-linecap="round"/>`;
      // 眉毛
      let inner = 0, outer = 0;
      if (expr === "angry") { inner = 9; outer = -3; }
      if (expr === "sad" || expr === "cry" || expr === "worry") { inner = -9; outer = 3; }
      if (expr === "surprise") { inner = -10; outer = -8; }
      if (expr === "think") { inner = s > 0 ? -6 : 3; }
      const by = ey - t * 1.3 - 14;
      const bi = ew * 0.08, bo = ew * 0.5, bw = 4.4;
      brows += `<path d="M ${-bo + ew * 0.1},${-inner} Q ${0},${-6 - (inner + outer) / 2} ${bo},${-outer + 2}" transform="translate(${cx + s * bi},${by}) scale(${s},1)" fill="none" stroke="${shade(c.hair[1], -0.25)}" stroke-width="${bw}" stroke-linecap="round"/>`;
    }
    // 闭眼（眨眼用）
    let closed = "";
    for (const s of [-1, 1]) closed += `<path d="M ${s * ex - ew / 2},${ey + 2} Q ${s * ex},${ey + 10} ${s * ex + ew / 2},${ey + 2}" fill="none" stroke="#2a1d1d" stroke-width="4" stroke-linecap="round"/>`;
    return { open: out, closed, brows };
  }

  function glasses(type, p) {
    const ex = p.w * 0.43, ey = p.ey, gw = p.ew * 0.72, gh = Math.max(p.eh * 0.62, 20);
    const lens = s => type === "round"
      ? `<ellipse cx="${s * ex}" cy="${ey}" rx="${gw}" ry="${gh}"/>`
      : `<rect x="${s * ex - gw}" y="${ey - gh}" width="${gw * 2}" height="${gh * 2}" rx="8"/>`;
    return `<g fill="rgba(200,225,255,.16)" stroke="#2c2c34" stroke-width="3.2">${lens(-1)}${lens(1)}</g>
      <path d="M ${-ex + gw},${ey - 4} Q 0,${ey - 12} ${ex - gw},${ey - 4} M ${-ex - gw},${ey - 6} L ${-p.w},${ey - 12} M ${ex + gw},${ey - 6} L ${p.w},${ey - 12}" fill="none" stroke="#2c2c34" stroke-width="3"/>
      <path d="M ${-ex - gw * 0.5},${ey - gh * 0.5} l 10,-8 M ${ex - gw * 0.5},${ey - gh * 0.5} l 10,-8" stroke="#fff" stroke-width="3" opacity=".7" stroke-linecap="round"/>`;
  }

  function mouth(expr, p) {
    const y = p.my, ln = `fill="none" stroke="#6b3434" stroke-width="3.2" stroke-linecap="round"`, fl = `fill="#9b3a43" stroke="#6b3434" stroke-width="2.5" stroke-linejoin="round"`;
    const tongue = (w, dy) => `<path d="M ${-w},${y + dy} Q 0,${y + dy - 6} ${w},${y + dy} Q 0,${y + dy + 5} ${-w},${y + dy} Z" fill="#e57d86"/>`;
    const closed = {
      normal: `<path d="M -9,${y} Q 0,${y + 5} 10,${y - 1}" ${ln}/>`,
      smile: `<path d="M -11,${y - 1} Q 0,${y + 10} 11,${y - 1} Q 0,${y + 3} -11,${y - 1} Z" fill="#c9616b" stroke="#7a3a3a" stroke-width="2.2" stroke-linejoin="round"/>`,
      sad: `<path d="M -10,${y + 4} Q 0,${y - 4} 10,${y + 4}" ${ln}/>`,
      angry: `<path d="M -13,${y + 3} Q 0,${y - 3} 13,${y + 3}" ${ln} stroke-width="3.6"/>`,
      surprise: `<ellipse cx="0" cy="${y + 2}" rx="6" ry="8" ${fl}/>`,
      worry: `<path d="M -11,${y + 2} q 5,-4 11,0 q 5,4 11,0" ${ln}/>`,
      cry: `<path d="M -14,${y + 4} Q 0,${y - 8} 14,${y + 4} Q 0,${y + 9} -14,${y + 4} Z" ${fl}/>`,
      think: `<path d="M -5,${y + 1} Q 4,${y - 2} 12,${y + 2}" ${ln}/>`,
      shy: `<path d="M -6,${y} Q 0,${y + 4} 6,${y}" ${ln}/>`
    }[expr] || "";
    const big = expr === "surprise" || expr === "angry" || expr === "cry";
    const open = `<path d="M -${big ? 12 : 9},${y - 1} Q 0,${y + (big ? 20 : 14)} ${big ? 12 : 9},${y - 1} Q 0,${y - 4} -${big ? 12 : 9},${y - 1} Z" ${fl}/>${tongue(big ? 6 : 4, big ? 11 : 8)}`;
    return `<g class="mc">${closed}</g><g class="mo">${open}</g>`;
  }

  // ---------- 衣服（立绘坐标：宽 400，肩线 SY） ----------
  function outfit(c, p, SY, id) {
    const [type, c1, c2] = c.outfit, W = p.sw, X = 200;
    const L = X - W, R = X + W;
    // 溜肩 + 手臂：领口 → 肩头圆弧 → 手臂外沿；手臂与躯干之间画一道折线和阴影
    const body = `M ${X - 34},${SY - 14} C ${X - 82},${SY - 8} ${L + 8},${SY + 4} ${L - 2},${SY + 62} C ${L - 10},${SY + 200} ${L - 8},${SY + 330} ${L - 6},780 L ${R + 6},780 C ${R + 8},${SY + 330} ${R + 10},${SY + 200} ${R + 2},${SY + 62} C ${R - 8},${SY + 4} ${X + 82},${SY - 8} ${X + 34},${SY - 14} Q ${X},${SY - 20} ${X - 34},${SY - 14} Z`;
    const st = `stroke="${LINE}" stroke-width="2.6" stroke-linejoin="round"`;
    const armShade = s => { const o = s < 0 ? L : R, k = s; // k=-1 左臂
      return `M ${o + k * 2},${SY + 62} C ${o + k * 10},${SY + 200} ${o + k * 8},${SY + 330} ${o + k * 6},780 L ${o - k * 30},780 C ${o - k * 32},${SY + 330} ${o - k * 33},${SY + 210} ${o - k * 32},${SY + 118} C ${o - k * 26},${SY + 96} ${o - k * 12},${SY + 74} ${o + k * 2},${SY + 62} Z`; };
    const arms = `<path d="${armShade(-1)} ${armShade(1)}" fill="${shade(c1, -0.3)}" opacity=".32"/>
      <path d="M ${L + 32},${SY + 118} C ${L + 33},${SY + 210} ${L + 32},${SY + 330} ${L + 30},780 M ${R - 32},${SY + 118} C ${R - 33},${SY + 210} ${R - 32},${SY + 330} ${R - 30},780" fill="none" stroke="${shade(c1, -0.45)}" stroke-width="2.4" opacity=".7"/>
      <path d="M ${X - 26},${SY - 10} Q ${X},${SY + 6} ${X + 26},${SY - 10}" fill="none" stroke="${shade(c1, -0.4)}" stroke-width="10" opacity=".18"/>`;
    const grad = `<linearGradient id="cl${id}" x1="0" x2="1"><stop offset="0" stop-color="${shade(c1, -0.12)}"/><stop offset=".45" stop-color="${c1}"/><stop offset="1" stop-color="${shade(c1, -0.22)}"/></linearGradient>`;
    const base = `<path d="${body}" fill="url(#cl${id})" ${st}/>`;
    const vneck = (fill, depth = 110, half = 34) => `<path d="M ${X - half},${SY - 6} L ${X},${SY + depth} L ${X + half},${SY - 6} Z" fill="${fill}" ${st}/>`;
    const lapels = (col) => `<path d="M ${X - 38},${SY - 8} L ${X - 8},${SY + 150} L ${X - 62},${SY + 70} L ${X - 50},${SY + 30} Z M ${X + 38},${SY - 8} L ${X + 8},${SY + 150} L ${X + 62},${SY + 70} L ${X + 50},${SY + 30} Z" fill="${col}" ${st}/>`;
    let extra = "";
    switch (type) {
      case "uniform_f":
      case "uniform_m": {
        extra = vneck("#fbfbff", 132, 40) + `<path d="M ${X - 40},${SY - 6} L ${X - 18},${SY + 26} L ${X},${SY + 6} L ${X + 18},${SY + 26} L ${X + 40},${SY - 6}" fill="#fff" ${st}/>` + lapels(shade(c1, -0.12));
        extra += type === "uniform_f"
          ? `<path d="M ${X},${SY + 24} L ${X - 30},${SY + 10} L ${X - 28},${SY + 42} Z M ${X},${SY + 24} L ${X + 30},${SY + 10} L ${X + 28},${SY + 42} Z M ${X - 6},${SY + 24} l -10,40 l 10,-6 l 6,8 l 6,-8 l 10,6 l -10,-40 Z" fill="${c2}" ${st}/><circle cx="${X}" cy="${SY + 24}" r="7" fill="${shade(c2, -0.2)}" ${st}/>`
          : `<path d="M ${X - 9},${SY + 20} L ${X + 9},${SY + 20} L ${X + 13},${SY + 120} L ${X},${SY + 138} L ${X - 13},${SY + 120} Z" fill="${c2}" ${st}/><path d="M ${X - 9},${SY + 20} L ${X},${SY + 6} L ${X + 9},${SY + 20} Z" fill="${shade(c2, -0.2)}" ${st}/>`;
        extra += `<path d="M ${R - 70},${SY + 120} l 26,0 l 0,30 q -13,10 -26,0 Z" fill="#e3c25c" ${st} stroke-width="2"/>`;
        break;
      }
      case "sport":
        extra = `<path d="M ${X - 34},${SY - 12} L ${X - 30},${SY + 22} L ${X},${SY + 30} L ${X + 30},${SY + 22} L ${X + 34},${SY - 12}" fill="${shade(c1, 0.15)}" ${st}/>
          <path d="M ${X},${SY + 30} L ${X},780" stroke="${LINE}" stroke-width="3"/><path d="M ${X},${SY + 30} L ${X},780" stroke="#ddd" stroke-width="1.5" stroke-dasharray="4 4"/>
          <path d="M ${L + 6},${SY + 40} C ${L + 30},${SY + 6} ${X - 50},${SY - 2} ${X - 36},${SY - 4} M ${R - 6},${SY + 40} C ${R - 30},${SY + 6} ${X + 50},${SY - 2} ${X + 36},${SY - 4}" fill="none" stroke="${c2}" stroke-width="12"/>
          <path d="M ${L + 30},${SY + 100} L ${L + 20},780 M ${R - 30},${SY + 100} L ${R - 20},780" stroke="${c2}" stroke-width="10"/>`;
        break;
      case "hoodie":
        extra = `<path d="M ${X - 70},${SY - 2} C ${X - 80},${SY - 40} ${X + 80},${SY - 40} ${X + 70},${SY - 2} C ${X + 50},${SY + 40} ${X - 50},${SY + 40} ${X - 70},${SY - 2} Z" fill="${c2}" ${st}/>
          <path d="M ${X - 34},${SY - 4} Q ${X},${SY + 30} ${X + 34},${SY - 4}" fill="#3a3f48" ${st}/>
          <path d="M ${X - 16},${SY + 24} l -4,90 M ${X + 16},${SY + 24} l 4,90" stroke="#eee" stroke-width="4" stroke-linecap="round"/><circle cx="${X - 20}" cy="${SY + 116}" r="5" fill="#ddd" ${st} stroke-width="2"/><circle cx="${X + 20}" cy="${SY + 116}" r="5" fill="#ddd" ${st} stroke-width="2"/>
          <path d="M ${X - 80},${SY + 250} L ${X + 80},${SY + 250} L ${X + 96},780 M ${X - 80},${SY + 250} L ${X - 96},780" fill="none" stroke="${c2}" stroke-width="3"/>`;
        break;
      case "cardigan":
        extra = `<path d="M ${X - 44},${SY - 8} Q ${X},${SY + 34} ${X + 44},${SY - 8} L ${X + 30},780 L ${X - 30},780 Z" fill="#fbf8f2" ${st}/>
          <path d="M ${X - 44},${SY - 8} L ${X - 22},780 M ${X + 44},${SY - 8} L ${X + 22},780" stroke="${c2}" stroke-width="7"/>
          ${[0, 1, 2].map(i => `<circle cx="${X - 26 + i * 0}" cy="${SY + 110 + i * 70}" r="5" fill="${c2}" ${st} stroke-width="2"/>`).join("")}
          <path d="M ${X - 30},${SY + 6} q 30,22 60,0" fill="none" stroke="#c9b3a0" stroke-width="2"/>`;
        break;
      case "blazer_f":
        extra = `<path d="M ${X - 40},${SY - 8} Q ${X},${SY + 40} ${X + 40},${SY - 8} L ${X + 40},780 L ${X - 40},780 Z" fill="${c2}" ${st}/>` + lapels(shade(c1, -0.1)) +
          `<path d="M ${X - 34},${SY - 6} L ${X - 70},${SY + 230} M ${X + 34},${SY - 6} L ${X + 70},${SY + 230}" stroke="#3567c8" stroke-width="5" fill="none"/>
          <rect x="${X - 92}" y="${SY + 226}" width="44" height="58" rx="5" fill="#fff" ${st} stroke-width="2"/><rect x="${X - 86}" y="${SY + 234}" width="18" height="20" fill="#9ab"/><path d="M ${X - 86},${SY + 262} h 32 M ${X - 86},${SY + 272} h 24" stroke="#99a" stroke-width="3"/>`;
        break;
      case "suit":
        extra = vneck("#fff", 150, 36) + `<path d="M ${X - 9},${SY + 4} L ${X + 9},${SY + 4} L ${X + 14},${SY + 132} L ${X},${SY + 150} L ${X - 14},${SY + 132} Z" fill="${c2}" ${st}/>` + lapels(shade(c1, -0.18)) +
          `<path d="M ${R - 74},${SY + 120} l 26,-2 l -2,8 z" fill="#fff"/>`;
        break;
      case "plaid": {
        const pid = `pl${id}`;
        extra = `<defs><pattern id="${pid}" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="${c1}"/><path d="M0 20H40M20 0V40" stroke="${c2}" stroke-width="10" opacity=".55"/><path d="M0 6H40M6 0V40" stroke="#e8e0c8" stroke-width="2" opacity=".5"/></pattern></defs>
          <path d="${body}" fill="url(#${pid})" ${st}/>
          <path d="M ${X - 34},${SY - 6} Q ${X},${SY + 30} ${X + 34},${SY - 6} L ${X + 24},780 L ${X - 24},780 Z" fill="#3b3e45" ${st}/>
          <path d="M ${X - 44},${SY - 12} L ${X - 20},${SY + 44} L ${X - 8},${SY + 6} Z M ${X + 44},${SY - 12} L ${X + 20},${SY + 44} L ${X + 8},${SY + 6} Z" fill="${shade(c1, 0.1)}" ${st}/>`;
        break;
      }
      case "teacher":
        extra = `<path d="M ${X - 40},${SY - 8} Q ${X},${SY + 40} ${X + 40},${SY - 8} L ${X + 36},780 L ${X - 36},780 Z" fill="${c2}" ${st}/>
          <path d="M ${X - 30},${SY - 4} L ${X - 8},${SY + 30} L ${X - 2},${SY + 4} Z M ${X + 30},${SY - 4} L ${X + 8},${SY + 30} L ${X + 2},${SY + 4} Z" fill="#fff" ${st} stroke-width="2"/>
          <path d="M ${X - 34},${SY - 4} L ${X - 64},${SY + 240} M ${X + 34},${SY - 4} L ${X + 64},${SY + 240}" stroke="#c03a3a" stroke-width="4" fill="none"/><rect x="${X - 84}" y="${SY + 236}" width="40" height="52" rx="4" fill="#fff" ${st} stroke-width="2"/>`;
        break;
      case "doctor":
        extra = vneck(c2, 120, 36) + `<path d="M ${X - 8},${SY + 6} L ${X + 8},${SY + 6} L ${X + 12},${SY + 110} L ${X},${SY + 122} L ${X - 12},${SY + 110} Z" fill="#2f4a7a" ${st}/>` + lapels("#f2f2f2") +
          `<path d="M ${X - 50},${SY - 2} C ${X - 70},${SY + 80} ${X - 40},${SY + 140} ${X - 10},${SY + 150} M ${X + 50},${SY - 2} C ${X + 70},${SY + 80} ${X + 50},${SY + 120} ${X + 40},${SY + 130}" fill="none" stroke="#555" stroke-width="5"/><circle cx="${X + 40}" cy="${SY + 140}" r="12" fill="#bbb" ${st}/>
          <rect x="${R - 84}" y="${SY + 130}" width="40" height="8" fill="#ddd" ${st} stroke-width="2"/><path d="M ${R - 76},${SY + 118} v 18 M ${R - 64},${SY + 116} v 20" stroke="#3366aa" stroke-width="4"/>`;
        break;
      case "nurse":
        extra = vneck(shade(c1, 0.4), 70, 30) + `<rect x="${R - 84}" y="${SY + 110}" width="36" height="44" rx="3" fill="#fff" ${st} stroke-width="2"/>`;
        break;
      case "gown":
        extra = `<defs><pattern id="gw${id}" width="34" height="34" patternUnits="userSpaceOnUse"><rect width="34" height="34" fill="${c1}"/><circle cx="8" cy="8" r="3" fill="${c2}"/><circle cx="25" cy="25" r="3" fill="${c2}"/></pattern></defs>
          <path d="${body}" fill="url(#gw${id})" ${st}/><path d="M ${X - 36},${SY - 6} Q ${X},${SY + 28} ${X + 36},${SY - 6}" fill="none" ${st}/>
          <path d="M ${X - 36},${SY - 4} L ${X + 30},${SY + 200}" stroke="${shade(c2, -0.2)}" stroke-width="3" fill="none"/>`;
        break;
      case "jacket":
        extra = `<path d="M ${X - 46},${SY - 18} L ${X - 44},${SY + 30} L ${X},${SY + 40} L ${X + 44},${SY + 30} L ${X + 46},${SY - 18} Q ${X},${SY + 6} ${X - 46},${SY - 18} Z" fill="${shade(c1, -0.15)}" ${st}/>
          <path d="M ${X - 30},${SY + 4} Q ${X},${SY + 24} ${X + 30},${SY + 4} L ${X + 6},${SY + 40} L ${X - 6},${SY + 40} Z" fill="#c9c2b4" ${st} stroke-width="2"/>
          <path d="M ${X},${SY + 40} L ${X},780" stroke="${LINE}" stroke-width="3"/><path d="M ${L + 50},${SY + 200} h 50 M ${R - 50},${SY + 200} h -50" stroke="${shade(c1, -0.3)}" stroke-width="3"/>`;
        break;
      case "client":
        extra = `<path d="M ${X - 42},${SY - 8} Q ${X},${SY + 50} ${X + 42},${SY - 8} L ${X + 40},780 L ${X - 40},780 Z" fill="${c2}" ${st}/>` + lapels(shade(c1, -0.12)) +
          `<path d="M ${X - 30},${SY + 4} Q ${X},${SY + 46} ${X + 30},${SY + 4}" fill="none" stroke="#e8d38a" stroke-width="3"/><circle cx="${X}" cy="${SY + 26}" r="6" fill="#f3e3a6" ${st} stroke-width="2"/>`;
        break;
      case "sweater":
        extra = `<path d="M ${X - 40},${SY - 8} Q ${X},${SY + 30} ${X + 40},${SY - 8}" fill="none" stroke="${c2}" stroke-width="12"/>
          ${[...Array(7)].map((_, i) => `<path d="M ${X - 90 + i * 30},${SY + 60} l 0,400" stroke="${c2}" stroke-width="2" opacity=".5"/>`).join("")}`;
        break;
      case "tee":
        extra = `<path d="M ${X - 34},${SY - 8} Q ${X},${SY + 26} ${X + 34},${SY - 8}" fill="none" stroke="${c2}" stroke-width="8"/><path d="M ${X - 40},${SY + 120} h 80 v 60 h -80 z" fill="${shade(c1, 0.3)}" opacity=".7"/><text x="${X}" y="${SY + 160}" font-size="26" text-anchor="middle" fill="${c2}" font-family="monospace">{ }</text>`;
        break;
    }
    const pre = type === "plaid" || type === "gown" ? "" : base;
    return `<defs>${grad}</defs>${pre}${extra}${arms}`;
  }

  // ======================= 立绘 =======================
  function char(id, expr = "normal", opt = {}) {
    const c = C[id];
    if (!c) return "";
    const img = IMG[`char:${id}:${expr}`] || IMG[`char:${id}`];
    if (img) return `<img src="${img}" alt="${c.name}" style="height:100%;width:auto">`;
    const n = ++uid, p = P(c);
    const hd = hairDef(c.hair[0]), hc = c.hair[1], hl = shade(hc, 0.32), hdk = shade(hc, -0.35);
    const skinS = shade(c.skin, -0.12);
    const HY = p.hy, hs = p.hs, SY = HY + (p.h2 + 14) * hs;
    const face = `M ${-p.w},-20 C ${-p.w},-124 ${p.w},-124 ${p.w},-20 C ${p.w},32 ${p.w * 0.8},68 ${p.w * p.jaw},${p.h2 * 0.89} Q 0,${p.h2 * 1.04} ${-p.w * p.jaw},${p.h2 * 0.89} C ${-p.w * 0.8},68 ${-p.w},32 ${-p.w},-20 Z`;
    const hst = `stroke="${hdk}" stroke-width="2.6" stroke-linejoin="round"`;
    const backs = hd.back.map(d => `<path d="${d}" fill="${shade(hc, -0.12)}" ${hst}/>`).join("");
    const fronts = hd.front.slice().reverse().map(d => `<path d="${d}" fill="url(#hg${n})" ${hst}/>`).join("");
    const shadowFr = hd.front.map(d => `<path d="${d}" transform="translate(0,7)" fill="${skinS}" opacity=".7"/>`).join("");
    const e = eyes(c, p, expr, n);
    const blushK = expr === "shy" ? 0.85 : expr === "cry" ? 0.6 : p.blush;
    const ex = p.w * p.ex;
    const blush = blushK > 0.05 ? `<g fill="url(#bl${n})" opacity="${Math.min(1, blushK * 1.5)}"><ellipse cx="${-ex - 6}" cy="${p.ey + 30}" rx="17" ry="9"/><ellipse cx="${ex + 6}" cy="${p.ey + 30}" rx="17" ry="9"/></g>` +
      (expr === "shy" ? `<path d="M ${-ex - 14},${p.ey + 26} l 6,-6 M ${-ex - 4},${p.ey + 28} l 6,-6 M ${ex - 6},${p.ey + 28} l 6,-6 M ${ex + 4},${p.ey + 26} l 6,-6" stroke="#e0606f" stroke-width="2.5" stroke-linecap="round"/>` : "") : "";
    const tears = expr === "cry" ? `<path d="M ${-ex + 10},${p.ey + 16} q -6,20 -2,34 q 8,-2 6,-14 z M ${ex - 10},${p.ey + 16} q 6,20 2,34 q -8,-2 -6,-14 z" fill="#9fd4ff" stroke="#5fa6dd" stroke-width="1.5" opacity=".9"/>` : "";
    const sweat = expr === "worry" ? `<path d="M ${p.w - 6},-46 q 10,16 4,26 q -12,4 -12,-8 q 0,-8 8,-18 z" fill="#bfe3ff" stroke="#6fb0e0" stroke-width="2"/>` : "";
    const ears = c.sex === "f" && !["bun", "lowbun"].includes(c.hair[0]) ? "" : `<ellipse cx="${-p.w + 2}" cy="${p.ey + 8}" rx="13" ry="20" fill="${c.skin}" stroke="${shade(c.skin, -0.4)}" stroke-width="2.5"/><ellipse cx="${p.w - 2}" cy="${p.ey + 8}" rx="13" ry="20" fill="${c.skin}" stroke="${shade(c.skin, -0.4)}" stroke-width="2.5"/>`;
    const wr = p.wrinkle >= 1 ? `<path d="M ${-p.w * 0.36},${p.my - 20} q -8,14 -2,24 M ${p.w * 0.36},${p.my - 20} q 8,14 2,24" fill="none" stroke="${shade(c.skin, -0.25)}" stroke-width="2" stroke-linecap="round" opacity="${p.wrinkle >= 2 ? .8 : .45}"/>` : "";
    const gray = hd.gray && c.hair[2] ? `<g clip-path="url(#hf${n})" opacity=".85"><path d="M -110,-70 L -60,-70 L -70,40 L -110,40 Z M 110,-70 L 60,-70 L 70,40 L 110,40 Z" fill="${c.hair[2]}"/></g>` : "";
    const cap = c.cap === "nurse" ? `<path d="M -54,-124 Q 0,-150 54,-124 L 46,-96 Q 0,-110 -46,-96 Z" fill="#fff" stroke="${LINE}" stroke-width="2.5"/><path d="M -6,-128 h 12 M 0,-134 v 12" stroke="#e46" stroke-width="4"/>` : "";
    const nose = !p.wrinkle ? `<path d="M 2,${p.ey + 33} q 3,4 -2,5" fill="none" stroke="${shade(c.skin, -0.32)}" stroke-width="2.2" stroke-linecap="round"/>` : p.wrinkle ? `<path d="M -1,${p.ey + 26} q 5,10 -1,16 q 4,2 7,-1" fill="none" stroke="${shade(c.skin, -0.38)}" stroke-width="2.4" stroke-linecap="round"/>` : `<path d="M 1,${p.ey + 32} q 4,5 -2,7" fill="none" stroke="${shade(c.skin, -0.38)}" stroke-width="2.4" stroke-linecap="round"/>`;
    const backBehindBody = c.hair[0] === "long" || c.hair[0] === "shoulder";
    const head = `<g transform="translate(200,${HY}) scale(${hs})">
      ${backBehindBody ? "" : backs}
      ${ears}
      <path d="${face}" fill="url(#sk${n})" stroke="${shade(c.skin, -0.38)}" stroke-width="2.4"/>
      <g clip-path="url(#fc${n})">${shadowFr}</g>
      ${blush}${wr}
      <g class="eo">${e.open}</g><g class="ec">${e.closed}</g>
      ${nose}${mouth(expr, p)}
      ${tears}
      ${c.glasses ? glasses(c.glasses, p) : ""}
      ${fronts}
      <g clip-path="url(#hf${n})"><path d="${hd.front.map(d => d.strands || "").join(" ")}" fill="none" stroke="${hdk}" stroke-width="2" stroke-linecap="round" opacity=".55"/></g>
      <g opacity=".85">${e.brows}</g>
      <g clip-path="url(#hf${n})"><path d="M -76,-84 Q 0,-122 76,-84" fill="none" stroke="${hl}" stroke-width="9" opacity=".55" stroke-linecap="round"/><path d="M -46,-96 Q 0,-112 46,-96" fill="none" stroke="#fff" stroke-width="3" opacity=".35" stroke-linecap="round"/></g>
      ${gray}${hd.acc || ""}${cap}${sweat}
    </g>`;
    const neck = `<path d="M ${200 - 24 * hs},${HY + (p.h2 - 34) * hs} L ${200 - 26 * hs},${SY + 4} Q 200,${SY + 22} ${200 + 26 * hs},${SY + 4} L ${200 + 24 * hs},${HY + (p.h2 - 34) * hs} Z" fill="${c.skin}" stroke="${shade(c.skin, -0.42)}" stroke-width="2.5"/>
      <path d="M ${200 - 26 * hs},${HY + (p.h2 - 20) * hs} Q 200,${HY + (p.h2 + 22) * hs} ${200 + 26 * hs},${HY + (p.h2 - 20) * hs} L ${200 + 26 * hs},${HY + (p.h2 - 34) * hs} L ${200 - 26 * hs},${HY + (p.h2 - 34) * hs} Z" fill="${skinS}"/>`;
    const defs = `<defs>
      <linearGradient id="hg${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(hc, 0.12)}"/><stop offset=".6" stop-color="${hc}"/><stop offset="1" stop-color="${shade(hc, -0.2)}"/></linearGradient>
      <radialGradient id="sk${n}" cx=".5" cy=".38" r=".7"><stop offset="0" stop-color="${shade(c.skin, 0.08)}"/><stop offset="1" stop-color="${c.skin}"/></radialGradient>
      <linearGradient id="ir${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(c.eye, -0.45)}"/><stop offset=".55" stop-color="${c.eye}"/><stop offset="1" stop-color="${shade(c.eye, 0.45)}"/></linearGradient>
      <clipPath id="fc${n}"><path d="${face}"/></clipPath>
      <radialGradient id="bl${n}"><stop offset="0" stop-color="#ff8a9a" stop-opacity=".75"/><stop offset="1" stop-color="#ff8a9a" stop-opacity="0"/></radialGradient>
      <clipPath id="hf${n}">${hd.front.map(d => `<path d="${d}"/>`).join("")}</clipPath>
    </defs>`;
    const vb = opt.crop === "head" ? `${200 - 125 * hs} ${HY - 150 * hs} ${250 * hs} ${250 * hs}` : "0 -40 400 760";
    return `<svg class="char-svg" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">${defs}
      <g transform="translate(200,${HY}) scale(${hs})">${backBehindBody ? backs : ""}</g>
      ${outfit(c, p, SY, n)}${neck}${head}</svg>`;
  }

  // ======================= 背景 =======================
  // 1600×900，柔和渐变 + 透视，偏日系动画背景的配色
  const lin = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ""}/>`).join("")}</linearGradient>`;
  const rad = (id, c, a = 0.8) => `<radialGradient id="${id}"><stop offset="0" stop-color="${c}" stop-opacity="${a}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;
  const glow = (x, y, r, id) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.8}" fill="url(#${id})"/>`;
  // 窗：天空 + 窗框 + 可选城市剪影/月亮
  function win(x, y, w, h, sky, opt = {}) {
    const k = ++uid;
    let s = `<defs>${lin("ws" + k, sky)}</defs><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#ws${k})"/>`;
    if (opt.moon) s += `<circle cx="${x + w * 0.72}" cy="${y + h * 0.28}" r="${Math.min(w, h) * 0.08}" fill="#fff8d8" opacity=".9"/>`;
    if (opt.sun) s += `<circle cx="${x + w * 0.3}" cy="${y + h * 0.75}" r="${Math.min(w, h) * 0.16}" fill="#ffe2a8" opacity=".9"/>`;
    if (opt.city) {
      let bx = x; const rnd = mulberry(k);
      while (bx < x + w) { const bw = 30 + rnd() * 60, bh = h * (0.18 + rnd() * 0.4); s += `<rect x="${bx}" y="${y + h - bh}" width="${bw}" height="${bh}" fill="${opt.city}"/>`;
        if (opt.lit) for (let i = 0; i < 6; i++) if (rnd() > 0.45) s += `<rect x="${bx + 6 + rnd() * (bw - 14)}" y="${y + h - bh + 8 + rnd() * (bh - 16)}" width="5" height="7" fill="${opt.lit}"/>`;
        bx += bw + 4; }
    }
    if (opt.trees) s += `<ellipse cx="${x + w * 0.2}" cy="${y + h}" rx="${w * 0.3}" ry="${h * 0.35}" fill="${opt.trees}"/><ellipse cx="${x + w * 0.85}" cy="${y + h}" rx="${w * 0.25}" ry="${h * 0.28}" fill="${opt.trees}"/>`;
    const fr = opt.frame || "#e9e4dc";
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${fr}" stroke-width="16"/><path d="M ${x + w / 2},${y} V ${y + h}${opt.cross ? ` M ${x},${y + h * 0.42} H ${x + w}` : ""}" stroke="${fr}" stroke-width="10"/>`;
    return s;
  }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  // 走廊透视：消失点 (vx,vy)
  function corridor(o) {
    const { wall, wall2, floor, floor2, ceil, vx = 800, vy = 430, light } = o;
    const k = ++uid;
    let s = `<defs>${lin("cf" + k, [[0, floor2], [1, floor]])}${lin("cw" + k, [[0, wall2], [1, wall]], 1, 0)}${lin("cw2" + k, [[0, wall], [1, wall2]], 1, 0)}${rad("cl" + k, light || "#fff", .7)}</defs>
      <rect width="1600" height="900" fill="${ceil}"/>
      <path d="M 0,0 L ${vx - 120},${vy - 110} L ${vx - 120},${vy + 80} L 0,900 Z" fill="url(#cw${k})"/>
      <path d="M 1600,0 L ${vx + 120},${vy - 110} L ${vx + 120},${vy + 80} L 1600,900 Z" fill="url(#cw2${k})"/>
      <path d="M 0,900 L ${vx - 120},${vy + 80} L ${vx + 120},${vy + 80} L 1600,900 Z" fill="url(#cf${k})"/>
      <rect x="${vx - 120}" y="${vy - 110}" width="240" height="190" fill="${wall2}"/>`;
    // 顶灯
    for (let i = 0; i < 5; i++) { const t = i / 5, y = (vy - 110) * (1 - Math.pow(1 - t, 0.5)) * 0 + (1 - t) * 30 + t * (vy - 120), w = 260 * (1 - t) + 30;
      s += `<rect x="${vx - w / 2}" y="${y}" width="${w}" height="${10 * (1 - t) + 3}" rx="4" fill="#fffef4" opacity="${0.95 - t * 0.4}"/>`; }
    s += glow(vx, vy - 40, 420, "cl" + k);
    // 地面反光
    s += `<path d="M ${vx - 30},${vy + 80} L ${vx + 30},${vy + 80} L ${vx + 220},900 L ${vx - 220},900 Z" fill="#fff" opacity=".12"/>`;
    return s;
  }
  function doorOnWall(side, t0, t1, col, vx = 800, vy = 430) { // 侧墙上的门（t 为深度 0..1）
    const X = t => side < 0 ? (vx - 120) * t : 1600 - (1600 - vx - 120) * t;
    const top = t => 0 + (vy - 110) * t + 140 * (1 - t), bot = t => 900 - (900 - vy - 80) * t;
    const x0 = X(t0), x1 = X(t1);
    return `<path d="M ${x0},${top(t0)} L ${x1},${top(t1)} L ${x1},${bot(t1)} L ${x0},${bot(t0)} Z" fill="${col}" stroke="rgba(0,0,0,.18)" stroke-width="4"/>
      <path d="M ${x0 + (x1 - x0) * 0.2},${top(t0) + 60} L ${x1 - (x1 - x0) * 0.2},${top(t1) + 50} L ${x1 - (x1 - x0) * 0.2},${top(t1) + 140} L ${x0 + (x1 - x0) * 0.2},${top(t0) + 170} Z" fill="#cfe3ee" opacity=".7"/>`;
  }
  // 教室桌椅（远小近大）
  function desks(rows, col, top) {
    let s = "";
    for (let r = 0; r < rows; r++) {
      const t = r / (rows - 1), y = 520 + t * 300, sc = 0.55 + t * 0.6, n = 6;
      for (let i = 0; i < n; i++) {
        const cx = 800 + (i - (n - 1) / 2) * 240 * sc;
        s += `<g transform="translate(${cx},${y}) scale(${sc})"><rect x="-80" y="0" width="160" height="16" rx="3" fill="${top}"/><rect x="-74" y="16" width="148" height="60" fill="${col}"/><rect x="-70" y="76" width="8" height="70" fill="#7a8088"/><rect x="62" y="76" width="8" height="70" fill="#7a8088"/></g>`;
      }
    }
    return s;
  }
  function vignette(dark = 0.35) { const k = ++uid; return `<defs><radialGradient id="vg${k}" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${dark}"/></radialGradient></defs><rect width="1600" height="900" fill="url(#vg${k})"/>`; }
  function overlay(c, a) { return `<rect width="1600" height="900" fill="${c}" opacity="${a}"/>`; }
  function rays(x, y, col = "#fff8e0", a = 0.18) { let s = ""; for (let i = 0; i < 5; i++) s += `<path d="M ${x + i * 120},${y} L ${x + i * 120 + 90},${y} L ${x + i * 120 + 420},900 L ${x + i * 120 + 200},900 Z" fill="${col}" opacity="${a}"/>`; return s; }

  const BG = {
    home_night() { // 夜晚的家：客厅，台灯
      return `<rect width="1600" height="900" fill="#3a3550"/><rect y="640" width="1600" height="260" fill="#4a3f4f"/>
        ${win(980, 140, 420, 380, [[0, "#141a3a"], [1, "#3b4373"]], { moon: true, city: "#1b2040", lit: "#ffd98a", frame: "#5b5468" })}
        <rect x="120" y="470" width="620" height="200" rx="40" fill="#7b5f6b"/><rect x="140" y="420" width="580" height="110" rx="40" fill="#8e6f7c"/>
        <rect x="160" y="440" width="140" height="90" rx="20" fill="#d9b8a0"/><rect x="560" y="430" width="140" height="100" rx="20" fill="#b9c9d9"/>
        <rect x="820" y="560" width="120" height="110" fill="#5e4a3c"/><path d="M 850,560 L 830,470 L 930,470 L 910,560 Z" fill="#ffe4b0"/>
        <defs>${rad("hl", "#ffd796", .75)}</defs>${glow(880, 500, 360, "hl")}
        <rect x="0" y="640" width="1600" height="8" fill="#2c2636" opacity=".5"/>${vignette(.5)}`;
    },
    bedroom_night() { // 卧室（学生/出租屋）：书桌台灯
      return `<rect width="1600" height="900" fill="#2f3550"/><rect y="660" width="1600" height="240" fill="#3d3a4c"/>
        ${win(240, 120, 420, 400, [[0, "#0f1533"], [1, "#2d3a6e"]], { moon: true, city: "#151a36", lit: "#ffe39a", frame: "#4a4e66", cross: true })}
        <rect x="760" y="520" width="640" height="24" fill="#8a6a50"/><rect x="780" y="544" width="20" height="180" fill="#6a4f3a"/><rect x="1360" y="544" width="20" height="180" fill="#6a4f3a"/>
        <rect x="900" y="360" width="300" height="160" rx="8" fill="#20232e"/><rect x="912" y="372" width="276" height="136" fill="#7ab0e0" opacity=".6"/>
        <path d="M 1280,520 L 1300,400 L 1340,380" stroke="#ddd" stroke-width="10" fill="none"/><path d="M 1310,360 L 1390,380 L 1360,420 Z" fill="#f2e2b8"/>
        <defs>${rad("bl", "#ffdca0", .7)}${rad("bs", "#7ab0e0", .35)}</defs>${glow(1340, 480, 300, "bl")}${glow(1050, 440, 260, "bs")}
        <rect x="60" y="600" width="520" height="140" rx="20" fill="#5a5f86"/><rect x="60" y="560" width="160" height="80" rx="20" fill="#e8e3f0"/>
        <rect x="760" y="140" width="200" height="140" fill="#e9d9c0" opacity=".25"/>${vignette(.55)}`;
    },
    office_night() { // 深夜工位
      let s = `<rect width="1600" height="900" fill="#1d2433"/>
        ${win(0, 60, 1600, 460, [[0, "#0b1026"], [1, "#25305a"]], { city: "#11172e", lit: "#ffd27a", frame: "#2a3247" })}
        <rect y="520" width="1600" height="380" fill="#272f40"/>`;
      for (let i = 0; i < 4; i++) { const x = 80 + i * 400; s += `<rect x="${x}" y="560" width="360" height="22" fill="#3b4558"/><rect x="${x + 110}" y="420" width="150" height="110" rx="6" fill="#151a24"/><rect x="${x + 118}" y="428" width="134" height="92" fill="${i === 2 ? "#5d9ee8" : "#222a38"}"/><rect x="${x + 175}" y="530" width="20" height="30" fill="#151a24"/>`; }
      s += `<defs>${rad("ol", "#6aaef5", .55)}</defs>${glow(1065, 470, 380, "ol")}<rect x="1010" y="440" width="110" height="6" fill="#bfe0ff" opacity=".6"/>${vignette(.6)}`;
      return s;
    },
    open_office() { // 白天开放办公区
      let s = `<rect width="1600" height="900" fill="#e9eef3"/>
        ${win(60, 70, 1480, 380, [[0, "#9fd0f5"], [1, "#e6f4ff"]], { city: "#b7c9d9", frame: "#dfe5ea" })}
        <rect y="450" width="1600" height="450" fill="#cfd6de"/><rect y="450" width="1600" height="16" fill="#b5bec8"/>`;
      for (let i = 0; i < 5; i++) { const x = 40 + i * 320; s += `<rect x="${x}" y="560" width="290" height="20" fill="#f4f6f8"/><rect x="${x}" y="500" width="290" height="60" fill="#a9c4b4" opacity=".7"/><rect x="${x + 90}" y="420" width="120" height="86" rx="5" fill="#2b3240"/><rect x="${x + 96}" y="426" width="108" height="72" fill="#d6e8f8"/><rect x="${x + 140}" y="506" width="20" height="54" fill="#2b3240"/>`; }
      s += `<ellipse cx="1520" cy="520" rx="70" ry="110" fill="#5c9a6c"/><rect x="1490" y="560" width="60" height="80" fill="#d9c9b0"/>${rays(200, 70, "#fffbe8", .16)}${vignette(.18)}`;
      return s;
    },
    meeting_room() { // 会议室：长桌 + 投影
      return `<rect width="1600" height="900" fill="#dfe3e8"/><rect width="1600" height="90" fill="#cfd4da"/>
        <rect x="430" y="120" width="740" height="380" fill="#f8fafc" stroke="#b9c0c8" stroke-width="6"/>
        <rect x="470" y="160" width="300" height="24" fill="#5b86c4"/><rect x="470" y="210" width="640" height="14" fill="#c7d2de"/><rect x="470" y="240" width="560" height="14" fill="#c7d2de"/>
        <path d="M 500,460 L 560,360 L 640,400 L 720,300 L 800,330 L 880,240" fill="none" stroke="#e0624f" stroke-width="8"/><rect x="900" y="300" width="60" height="160" fill="#8fb4e0"/><rect x="980" y="360" width="60" height="100" fill="#8fb4e0"/><rect x="1060" y="250" width="60" height="210" fill="#e0a24f"/>
        <rect y="560" width="1600" height="340" fill="#9aa4ae"/>
        <path d="M 200,900 L 560,600 L 1040,600 L 1400,900 Z" fill="#6c5444"/><path d="M 560,600 L 1040,600 L 1060,616 L 540,616 Z" fill="#8a6c58"/>
        ${[0, 1, 2].map(i => `<rect x="${380 - i * 90}" y="${640 + i * 80}" width="90" height="130" rx="16" fill="#3b4250"/><rect x="${1130 + i * 90}" y="${640 + i * 80}" width="90" height="130" rx="16" fill="#3b4250"/>`).join("")}
        ${win(1260, 110, 300, 400, [[0, "#a9d6f5"], [1, "#eaf6ff"]], { city: "#bccddc", frame: "#d8dde3" })}${vignette(.22)}`;
    },
    cafe() {
      return `<rect width="1600" height="900" fill="#e9d7c0"/>
        ${win(120, 90, 700, 420, [[0, "#f7c98c"], [1, "#fde8c8"]], { trees: "#9bbf88", frame: "#7a5a40", cross: true })}
        <rect x="900" y="90" width="580" height="420" fill="#7a5a40"/>${[0, 1, 2].map(i => `<rect x="920" y="${120 + i * 130}" width="540" height="12" fill="#5d4330"/>` + [0, 1, 2, 3, 4, 5].map(j => `<rect x="${940 + j * 86}" y="${70 + i * 130}" width="44" height="50" rx="8" fill="${["#e6d2b0", "#c8a07a", "#f2efe8"][(i + j) % 3]}"/>`).join("")).join("")}
        <rect y="560" width="1600" height="340" fill="#b88d66"/><rect y="560" width="1600" height="12" fill="#8e6a4a"/>
        <ellipse cx="560" cy="700" rx="260" ry="54" fill="#f3e6d2"/><rect x="545" y="700" width="30" height="200" fill="#6a4c36"/>
        <rect x="490" y="640" width="54" height="56" rx="10" fill="#fff"/><path d="M 544,656 q 22,4 0,26" stroke="#fff" stroke-width="8" fill="none"/>
        ${[0, 1, 2].map(i => `<path d="M ${300 + i * 500},0 L ${300 + i * 500},120" stroke="#5d4330" stroke-width="3"/><path d="M ${270 + i * 500},120 L ${330 + i * 500},120 L ${314 + i * 500},90 L ${286 + i * 500},90 Z" fill="#3d3a36"/>`).join("")}
        <defs>${rad("cg", "#ffd9a0", .55)}</defs>${glow(470, 300, 520, "cg")}${rays(150, 90, "#fff1d0", .2)}${vignette(.25)}`;
    },
    street_night() {
      let s = `<defs>${lin("sn", [[0, "#0c1430"], [0.6, "#2b2f5a"], [1, "#5a3f62"]])}${rad("lamp", "#ffcf80", .8)}</defs><rect width="1600" height="900" fill="url(#sn)"/>`;
      const r = mulberry(7); let x = 0; while (x < 1600) { const w = 90 + r() * 140, h = 220 + r() * 300; s += `<rect x="${x}" y="${640 - h}" width="${w}" height="${h}" fill="#141a33"/>`; for (let i = 0; i < 10; i++) if (r() > 0.5) s += `<rect x="${x + 10 + r() * (w - 24)}" y="${640 - h + 16 + r() * (h - 40)}" width="10" height="14" fill="#ffd98a" opacity=".85"/>`; x += w + 10; }
      s += `<rect y="640" width="1600" height="260" fill="#25263a"/><path d="M 0,760 L 1600,700" stroke="#ffe08a" stroke-width="6" stroke-dasharray="60 50" opacity=".6"/>`;
      for (const lx of [300, 1200]) s += `<rect x="${lx}" y="300" width="10" height="400" fill="#3a3e55"/><path d="M ${lx},300 q 30,-30 70,-10" stroke="#3a3e55" stroke-width="10" fill="none"/>${glow(lx + 70, 300, 220, "lamp")}<ellipse cx="${lx + 70}" cy="720" rx="180" ry="30" fill="#ffcf80" opacity=".18"/>`;
      return s + vignette(.5);
    },
    hospital_corridor() {
      return corridor({ wall: "#e4ecef", wall2: "#c8d6dc", floor: "#b7c4c9", floor2: "#dfe6e8", ceil: "#eef3f4", light: "#ffffff" }) +
        doorOnWall(-1, 0.15, 0.42, "#9ec3d6") + doorOnWall(1, 0.2, 0.45, "#9ec3d6") + doorOnWall(-1, 0.62, 0.78, "#9ec3d6") +
        `<path d="M 0,610 L 680,500 M 1600,610 L 920,500" stroke="#7fb3a6" stroke-width="12" opacity=".7"/><rect x="760" y="352" width="80" height="26" rx="4" fill="#3aa676"/><text x="800" y="371" font-size="16" text-anchor="middle" fill="#fff">EXIT</text>` + vignette(.2);
    },
    corridor_night() {
      return corridor({ wall: "#36475a", wall2: "#22303f", floor: "#1f2a35", floor2: "#3b4b5c", ceil: "#1a2430", light: "#9fd0ff" }) +
        doorOnWall(-1, 0.15, 0.42, "#2c4a5f") + doorOnWall(1, 0.2, 0.45, "#2c4a5f") +
        `<rect x="760" y="352" width="80" height="26" rx="4" fill="#2b9c66"/><text x="800" y="371" font-size="16" text-anchor="middle" fill="#dfffe8">EXIT</text>
        <rect x="1180" y="560" width="220" height="40" rx="8" fill="#556677"/><rect x="1190" y="600" width="10" height="80" fill="#445"/><rect x="1380" y="600" width="10" height="80" fill="#445"/>` + overlay("#0b1830", .25) + vignette(.6);
    },
    hospital_room() {
      return `<rect width="1600" height="900" fill="#e8eef0"/>${win(980, 100, 480, 400, [[0, "#bfe0f5"], [1, "#f2f9ff"]], { trees: "#a6cfa0", frame: "#f4f6f7", cross: true })}
        <rect x="940" y="80" width="40" height="460" fill="#d6e6ee"/><rect x="1460" y="80" width="40" height="460" fill="#d6e6ee"/>
        <rect y="600" width="1600" height="300" fill="#cfd9dc"/><rect y="600" width="1600" height="10" fill="#b9c7cb"/>
        <rect x="160" y="420" width="700" height="60" rx="20" fill="#f7f9fa"/><rect x="160" y="480" width="700" height="180" fill="#dce8ee"/><rect x="140" y="320" width="40" height="400" rx="10" fill="#b5c3c9"/><rect x="160" y="400" width="200" height="70" rx="30" fill="#ffffff"/>
        <path d="M 360,450 L 860,450 L 860,600 L 300,600 Z" fill="#cfe0ea"/>
        <rect x="80" y="160" width="20" height="300" fill="#aab"/><rect x="40" y="160" width="100" height="10" fill="#aab"/><path d="M 60,170 q -10,40 0,80 q 30,10 30,-40 z" fill="#e9f3f8" stroke="#aab"/>
        <rect x="900" y="480" width="120" height="180" fill="#e3e3dc"/><rect x="920" y="440" width="40" height="40" rx="6" fill="#f2b74e"/>
        ${rays(1000, 100, "#ffffff", .2)}${vignette(.18)}`;
    },
    doctor_office() {
      return `<rect width="1600" height="900" fill="#e9eeee"/><rect x="200" y="120" width="520" height="320" fill="#1b232c"/><rect x="216" y="136" width="488" height="288" fill="#3a4a58"/>
        <path d="M 300,380 C 320,260 360,180 420,170 C 470,166 500,230 480,300 C 470,340 520,360 560,350" stroke="#eef4f8" stroke-width="10" fill="none" opacity=".85"/><circle cx="420" cy="190" r="34" fill="none" stroke="#eef4f8" stroke-width="8" opacity=".85"/>
        ${win(1100, 100, 380, 380, [[0, "#bfe0f5"], [1, "#f2f9ff"]], { trees: "#a6cfa0", frame: "#f4f6f7" })}
        <rect y="560" width="1600" height="340" fill="#c9d3d6"/><rect x="420" y="560" width="900" height="30" fill="#d7c6ad"/><rect x="440" y="590" width="860" height="200" fill="#bfae95"/>
        <rect x="560" y="500" width="160" height="60" fill="#fff"/><rect x="1000" y="470" width="150" height="100" rx="6" fill="#2b3240"/><rect x="1008" y="478" width="134" height="84" fill="#cfe8f5"/>
        ${vignette(.2)}`;
    },
    parking_night() {
      let s = `<defs>${lin("pn", [[0, "#080d1e"], [1, "#1d2848"]])}${rad("pl", "#ffcf80", .7)}</defs><rect width="1600" height="900" fill="url(#pn)"/>
        <rect x="0" y="120" width="1600" height="420" fill="#1a2238"/>`;
      for (let r2 = 0; r2 < 5; r2++) for (let c2 = 0; c2 < 14; c2++) s += `<rect x="${60 + c2 * 110}" y="${150 + r2 * 76}" width="60" height="36" fill="${(r2 * 7 + c2 * 3) % 5 === 0 ? "#ffe1a0" : "#2a3352"}"/>`;
      s += `<rect y="540" width="1600" height="360" fill="#262a36"/>${[0, 1, 2, 3, 4].map(i => `<path d="M ${200 + i * 300},560 L ${120 + i * 330},900" stroke="#ddd" stroke-width="6" opacity=".35"/>`).join("")}
        <rect x="1100" y="300" width="12" height="320" fill="#3a3e55"/>${glow(1106, 300, 260, "pl")}<ellipse cx="1106" cy="660" rx="260" ry="40" fill="#ffcf80" opacity=".16"/>
        <rect x="300" y="620" width="360" height="130" rx="40" fill="#3b4256"/><rect x="360" y="580" width="230" height="70" rx="30" fill="#4b5470"/><circle cx="380" cy="750" r="34" fill="#15161c"/><circle cx="590" cy="750" r="34" fill="#15161c"/>`;
      return s + vignette(.6);
    },
    hospital_gate() {
      return `<defs>${lin("hg", [[0, "#a7d8f7"], [1, "#eef8ff"]])}</defs><rect width="1600" height="900" fill="url(#hg)"/>
        <rect x="300" y="120" width="1000" height="520" fill="#eef1f2"/>${[0, 1, 2, 3].map(r2 => [0, 1, 2, 3, 4, 5, 6, 7].map(c2 => `<rect x="${340 + c2 * 120}" y="${150 + r2 * 100}" width="80" height="60" fill="#bcd8ea"/>`).join("")).join("")}
        <rect x="650" y="90" width="300" height="50" fill="#e04848"/><text x="800" y="126" font-size="32" text-anchor="middle" fill="#fff" font-weight="bold">市第二人民医院</text>
        <rect x="680" y="480" width="240" height="160" fill="#9fc6dc"/><rect y="640" width="1600" height="260" fill="#cfd3d6"/>
        <ellipse cx="160" cy="560" rx="180" ry="200" fill="#8cc08a"/><ellipse cx="1460" cy="580" rx="200" ry="190" fill="#8cc08a"/><rect x="150" y="600" width="20" height="120" fill="#7a5a40"/><rect x="1450" y="600" width="20" height="120" fill="#7a5a40"/>
        ${rays(500, 0, "#fffbe0", .22)}${vignette(.15)}`;
    },
    classroom(evening) {
      const sky = evening ? [[0, "#f59a6a"], [1, "#ffd9a8"]] : [[0, "#9fd4f7"], [1, "#e9f7ff"]];
      const k = ++uid;
      return `<rect width="1600" height="900" fill="${evening ? "#e8c9a8" : "#f1ebe0"}"/>
        <rect x="360" y="90" width="880" height="330" fill="#2f5446" stroke="#8a6a50" stroke-width="18"/>
        <text x="420" y="170" font-size="38" fill="#f4f4ea" font-family="Kaiti, STKaiti, serif" opacity=".9">元旦文艺汇演 · 倒计时 3 天</text>
        <path d="M 420,220 h 360 M 420,270 h 300" stroke="#e8e8da" stroke-width="5" opacity=".6"/><text x="1120" y="390" font-size="26" fill="#f4f4ea" opacity=".8" font-family="Kaiti, STKaiti, serif">值日：陈屿</text>
        <rect x="360" y="430" width="880" height="16" fill="#8a6a50"/>
        ${win(1290, 110, 290, 380, sky, { trees: evening ? "#c47a5a" : "#9cc98c", frame: "#e8e2d4", cross: true })}
        ${win(20, 110, 290, 380, sky, { trees: evening ? "#c47a5a" : "#9cc98c", frame: "#e8e2d4", cross: true })}
        <rect y="470" width="1600" height="430" fill="${evening ? "#c49a70" : "#d8c3a2"}"/>
        ${desks(3, evening ? "#a07850" : "#b9915f", evening ? "#e8c89a" : "#f0dcb8")}
        <rect x="760" y="40" width="80" height="40" rx="6" fill="#fff" stroke="#888" stroke-width="3"/><text x="800" y="70" font-size="22" text-anchor="middle" fill="#c33">高二(3)班</text>
        ${evening ? overlay("#ff9a50", .14) + rays(1290, 110, "#ffd8a0", .22) : rays(1290, 110, "#fffbe8", .18)}${vignette(evening ? .35 : .18)}`;
    },
    classroom_evening() { return BG.classroom(true); },
    school_corridor() {
      return corridor({ wall: "#f2ece0", wall2: "#d8cfbe", floor: "#c9b89a", floor2: "#e6dccb", ceil: "#f6f2ea", light: "#fff6dd", vx: 800 }) +
        `<g opacity=".9">${[0, 1, 2].map(i => { const t = 0.08 + i * 0.22; const x0 = 1600 - (1600 - 920) * t, x1 = 1600 - (1600 - 920) * (t + 0.15);
          return `<path d="M ${x0},${150 + 200 * t} L ${x1},${150 + 200 * (t + .15)} L ${x1},${520 - 40 * (t + .15)} L ${x0},${520 - 40 * t} Z" fill="#bfe4f7" stroke="#e9e2d2" stroke-width="10"/>`; }).join("")}</g>` +
        doorOnWall(-1, 0.12, 0.36, "#b48a5a") + doorOnWall(-1, 0.52, 0.68, "#b48a5a") +
        `<rect x="120" y="260" width="200" height="120" fill="#fff" stroke="#c9b28a" stroke-width="6" transform="skewY(14)"/><text x="160" y="300" font-size="22" fill="#c33" transform="skewY(14)">光荣榜</text>` + rays(1100, 150, "#fff8d8", .16) + vignette(.18);
    },
    teacher_office() {
      return `<rect width="1600" height="900" fill="#eee6d8"/>${win(1040, 90, 480, 400, [[0, "#a9d8f5"], [1, "#eef8ff"]], { trees: "#9cc98c", frame: "#e8e2d4", cross: true })}
        <rect x="80" y="100" width="460" height="460" fill="#a07850"/>${[0, 1, 2, 3].map(i => `<rect x="96" y="${120 + i * 110}" width="428" height="10" fill="#7a5a3c"/>` + [0, 1, 2, 3, 4, 5, 6, 7, 8].map(j => `<rect x="${104 + j * 46}" y="${130 + i * 110 - 0}" width="${24 + (j % 3) * 6}" height="${80 - (j % 2) * 14}" y2="0" fill="${["#c8574a", "#4a78c8", "#e0b44a", "#6aa86a", "#eee"][(i + j) % 5]}" transform="translate(0,${(j % 2) * 14})"/>`).join("")).join("")}
        <rect y="600" width="1600" height="300" fill="#c8b394"/><rect x="560" y="560" width="760" height="28" fill="#8a6a50"/><rect x="580" y="588" width="720" height="220" fill="#7a5a40"/>
        ${[0, 1, 2, 3].map(i => `<rect x="${640 + i * 30}" y="${470 - i * 18}" width="200" height="18" fill="${["#f4f4f0", "#e8f0f8", "#fff4e0", "#f0f0f0"][i]}" stroke="#bbb" stroke-width="2"/>`).join("")}
        <rect x="980" y="480" width="70" height="80" rx="8" fill="#fff"/><path d="M 1050,500 q 24,6 0,34" stroke="#fff" stroke-width="8" fill="none"/>
        <ellipse cx="1180" cy="520" rx="60" ry="50" fill="#6aa86a"/><rect x="1150" y="530" width="60" height="40" fill="#c8a07a"/>${rays(1060, 90, "#fffbe8", .18)}${vignette(.2)}`;
    },
    auditorium() {
      let s = `<defs>${lin("au", [[0, "#1a0f24"], [1, "#3a1f3a"]])}${rad("spot", "#fff1c8", .75)}</defs><rect width="1600" height="900" fill="url(#au)"/>
        <path d="M 0,0 L 320,0 Q 300,300 260,560 L 0,600 Z" fill="#8a1f2f"/><path d="M 1600,0 L 1280,0 Q 1300,300 1340,560 L 1600,600 Z" fill="#8a1f2f"/>
        <path d="M 0,0 H 1600 V 70 Q 800,130 0,70 Z" fill="#a82838"/>${[...Array(9)].map((_, i) => `<path d="M ${i * 40},0 Q ${i * 40 + 10},300 ${i * 32},580" stroke="#6a1522" stroke-width="4" fill="none"/><path d="M ${1600 - i * 40},0 Q ${1590 - i * 40},300 ${1600 - i * 32},580" stroke="#6a1522" stroke-width="4" fill="none"/>`).join("")}
        <rect x="560" y="120" width="480" height="60" rx="6" fill="#e8c35a"/><text x="800" y="162" font-size="34" text-anchor="middle" fill="#7a1a1a" font-weight="bold">元旦文艺汇演</text>
        <path d="M 160,560 L 1440,560 L 1600,700 L 0,700 Z" fill="#6a4a36"/><rect y="700" width="1600" height="200" fill="#120a14"/>`;
      for (let r2 = 0; r2 < 3; r2++) for (let c2 = 0; c2 < 18; c2++) s += `<path d="M ${c2 * 92 + (r2 % 2) * 46 - 20},${740 + r2 * 60} q 40,-36 80,0 v 40 h -80 z" fill="#2a1a2c"/>`;
      s += glow(800, 520, 380, "spot") + `<path d="M 700,0 L 900,0 L 1060,620 L 540,620 Z" fill="#fff6d8" opacity=".12"/>`;
      return s + vignette(.5);
    },
    rooftop_sunset() {
      return `<defs>${lin("rs", [[0, "#3a3a7a"], [0.45, "#e0708a"], [0.75, "#f6b26b"], [1, "#ffe1a0"]])}${rad("sun", "#fff0c0", .9)}</defs><rect width="1600" height="900" fill="url(#rs)"/>
        ${glow(1100, 520, 300, "sun")}<circle cx="1100" cy="540" r="70" fill="#fff2c8"/>
        ${(() => { let s = ""; const r = mulberry(3); let x = 0; while (x < 1600) { const w = 60 + r() * 120, h = 60 + r() * 200; s += `<rect x="${x}" y="${600 - h}" width="${w}" height="${h}" fill="#5a3a5a" opacity=".85"/>`; x += w + 6; } return s; })()}
        <rect y="600" width="1600" height="300" fill="#8a7a7a"/><rect y="600" width="1600" height="12" fill="#6a5a5a"/>
        ${[...Array(17)].map((_, i) => `<rect x="${i * 100}" y="470" width="6" height="140" fill="#3a2f3a"/>`).join("")}<rect y="470" width="1600" height="8" fill="#3a2f3a"/><rect y="530" width="1600" height="5" fill="#3a2f3a"/>
        <path d="M 200,140 q 30,-20 60,0 M 260,120 q 20,-14 40,0" stroke="#3a2f4a" stroke-width="4" fill="none"/>${vignette(.3)}`;
    },
    ward_night() { // 夜间病房：只剩床头灯和监护仪的光
      return BG.hospital_room() + overlay("#0a1430", .62) + `<defs>${rad("wn", "#ffd9a0", .55)}${rad("wm", "#7fffd0", .35)}</defs>${glow(300, 380, 260, "wn")}${glow(960, 470, 120, "wm")}
        <rect x="920" y="440" width="80" height="54" rx="6" fill="#0c1a1a" stroke="#4a6" stroke-width="3"/><path d="M 928,470 l 14,0 l 6,-14 l 8,26 l 6,-12 l 30,0" stroke="#7fffb0" stroke-width="3" fill="none"/>` + vignette(.6);
    },
    car_day() { // 车里：前挡风玻璃外是城市街道
      return `<defs>${lin("cd", [[0, "#a9d8f7"], [1, "#eef7ff"]])}</defs><rect width="1600" height="900" fill="url(#cd)"/>
        ${(() => { let s = ""; const r = mulberry(11); let x = 0; while (x < 1600) { const w = 80 + r() * 140, h = 120 + r() * 220; s += `<rect x="${x}" y="${520 - h}" width="${w}" height="${h}" fill="${["#c9d6e3", "#d8cfc4", "#b9c9d9"][Math.floor(r() * 3)]}"/>`; x += w + 8; } return s; })()}
        <ellipse cx="200" cy="500" rx="160" ry="120" fill="#8cc08a"/><ellipse cx="1420" cy="500" rx="170" ry="120" fill="#8cc08a"/><rect y="520" width="1600" height="80" fill="#9aa0a8"/>
        <path d="M 0,0 L 1600,0 L 1600,160 Q 800,90 0,160 Z" fill="#3a3a42"/><path d="M 0,560 Q 800,500 1600,560 L 1600,900 L 0,900 Z" fill="#4a4a54"/>
        <path d="M 0,0 L 140,0 L 60,600 L 0,620 Z M 1600,0 L 1460,0 L 1540,600 L 1600,620 Z" fill="#2e2e36"/>
        <rect x="740" y="150" width="120" height="40" rx="8" fill="#2e2e36"/><circle cx="420" cy="760" r="150" fill="none" stroke="#25252c" stroke-width="34"/>
        ${rays(300, 0, "#fffbe8", .16)}${vignette(.3)}`;
    },
    // 关键旁白用的黑场
    black() { return `<rect width="1600" height="900" fill="#000"/>`; }
  };
  const BG_ALIAS = { hospital: "hospital_corridor", ward: "hospital_room" };

  const IMG = {}; // 正式插画登记处

  function bg(id) {
    id = BG_ALIAS[id] || id;
    const img = IMG[`bg:${id}`];
    if (img) return `<img src="${img}" style="width:100%;height:100%;object-fit:cover">`;
    const f = BG[id];
    if (!f) return "";
    return `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">${f()}</svg>`;
  }

  return { char, bg, has: id => !!C[id], name: id => C[id] && C[id].name, list: () => Object.keys(C), bgs: () => Object.keys(BG), IMG };
})();
