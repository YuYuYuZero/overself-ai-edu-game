# 微信小程序版

《MBTI 性格修炼手册》的原生微信小程序版本，和网页版（`demo/`）放在同一个仓库里，**剧情、练习关、MBTI 题库与计分、立绘、音频、分享卡片的绘制用的是同一份源码**：

| 内容 | 网页版 | 小程序版 |
|---|---|---|
| 剧情数据、练习关 | `demo/story-*.js`、`demo/scenarios.js` | `shared/`（由脚本从 `demo/` 生成，勿手改） |
| MBTI 题库、计分、16 型档案 | `demo/quiz.js` | `shared/quiz.js` |
| 分享卡片的 Canvas 绘制 | `demo/share-card.js` | `shared/share-card.js`；人物 PNG 在分包 `packageShare/portraits/` |
| SVG 立绘与场景背景 | `demo/art.js` | `shared/art.js` → `core/svg.js` 转成图片 |
| WebAudio 程序化音乐音效 | `demo/audio.js` | `shared/audio.js` → `core/au.js`（`wx.createWebAudioContext`） |
| 故事引擎（经历 → 镜面 → 倒带 → 复盘） | `demo/story.js` | `core/story.js`（逐段对应，DOM 换成页面数据） |
| 视觉小说舞台 | `demo/vn.js` | `core/vn.js` + `templates/stage.wxml` |
| 首页、练习关、技能卡 | `demo/game.js` | `pages/index`、`route`、`level`、`cards` |
| 测试与结果页 | `demo/quiz-ui.js` | `pages/quiz` |
| 分享卡片页 | `demo/quiz-ui.js` › share | `packageShare/card`（分包） |

存档格式和 key 与网页版一致。

## 改了剧情之后

```bash
node tools/build-miniprogram.mjs   # 把 demo/ 里的共享模块同步到 miniprogram/shared/
node tools/mp-e2e.mjs              # 小程序逻辑层自动通关：3 个故事 × 2 个视角、目录跳章、读档、练习关、测试、分享卡片、首页
node tools/render-portraits.mjs    # 改了 art.js 的人物画法 / 16 型形象之后：重新渲染分享卡用的人物 PNG
```

只改 `story-*.js` / `scenarios.js` / `quiz.js` / `art.js` / `audio.js` / `share-card.js` 时，小程序这边不用动代码，同步一下就行。新增故事：网页版照常加 `story-xxx.js`，再把文件名加进 `tools/build-miniprogram.mjs` 的 `SHARED` 列表。

## 目录

```
miniprogram/
├── project.config.json   AppID 与编译设置（ES6 转 ES5 + 增强编译）
├── app.js / app.json / app.wxss
├── shared/               ⚠ 自动生成：网页版的数据、题库、立绘、音频、分享卡绘制（套一层 window 替身）
├── core/
│   ├── env.js            window 替身：localStorage → wx 本地缓存，AudioContext → wx.createWebAudioContext
│   ├── au.js             音频外壳：出错不打断剧情；切后台时停音乐，回来再接上
│   ├── svg.js            SVG 字符串 → data URI；把眨眼、说话口型的动画写进 SVG 自己的 <style>
│   ├── vn.js             舞台控制器（与网页版 vn.js 接口一致）
│   ├── story.js          故事引擎
│   ├── level.js          练习关引擎
│   ├── ui.js             批量 setData + 点击回调登记（引擎拼"描述对象"，tap 函数换成 id）
│   ├── lay.js            屏幕尺寸、胶囊位置、是否横屏（land）
│   ├── stage-page.js     故事页 / 练习关页共用的舞台事件，含横屏切换（onResize / onRotate）
│   └── text.js / store.js / color.js
├── templates/            舞台、交互面板、进度条（故事页和练习关页共用）
├── pages/                index 首页 / story 故事 / quiz 测试与结果 / route 练习路线 / level 练习关 / cards 技能卡
├── packageShare/         分包：card 分享卡片页 + portraits/ 16 型 × 男女人物 PNG（约 640KB，不占主包）
└── img/                  logo；正式小程序码放这里（qrcode.png），见下文「分享卡片」
```

## 在开发者工具里打开

微信开发者工具 → 导入项目 → 目录选 `miniprogram/`，AppID 会从 `project.config.json` 读出来。

## 预览与上传（命令行）

用官方的 [miniprogram-ci](https://www.npmjs.com/package/miniprogram-ci)，需要小程序后台「开发管理 → 开发设置 → 小程序代码上传」里下载的**代码上传密钥**，并把本机公网 IP 加进白名单（或关闭白名单）。**密钥不要放进仓库**（`.gitignore` 已忽略 `*.key`）。

```bash
# 生成预览二维码（管理员 / 开发者用微信扫码，在手机上看）
npx miniprogram-ci preview --pp ./miniprogram --pkp /path/to/private.wx34e4c1801e438c80.key \
  --appid wx34e4c1801e438c80 --uv 3.2.0 -r 1 --enable-es6 true --enable-es7 true \
  --qrcode-format image --qrcode-output-dest /tmp/preview.jpg

# 上传为开发版本
npx miniprogram-ci upload --pp ./miniprogram --pkp /path/to/private.wx34e4c1801e438c80.key \
  --appid wx34e4c1801e438c80 --uv 3.2.0 --ud "版本说明" -r 1 --enable-es6 true --enable-es7 true --enable-minify true
```

## 上线

上传后的版本出现在小程序后台「版本管理 → 开发版本」，之后的步骤都在后台完成：

1. 设为**体验版**，加体验成员，在手机上完整玩一遍。
2. 填好「基本信息」（名称、头像、简介）和**服务类目**。
3. 完成**小程序备案**（未备案的小程序不能上架）。
4. 开发版本 → **提交审核**；审核通过后点「发布」。

## 横屏

故事页和练习关页的配置是 `"pageOrientation": "auto"`：手机横过来，舞台就切到横屏布局（立绘站满舞台、对话框压在腿上、选项面板移到右半边，和网页版电脑宽屏一致）。HUD 上的「横屏 / 竖屏」按钮会调用 `wx.setPageOrientation`（基础库里有、官方文档没写的接口）；没有这个接口时提示用户把手机横过来，并关闭系统的竖排方向锁定。首页、测试、结果页这些以阅读为主的页面保持竖屏。

在开发者工具里看横屏：模拟器顶部工具栏的「旋转」按钮。

## 分享卡片

测试结果页 →「生成分享卡片」→ 分包页 `packageShare/card`：画一张 750×1200 的海报（`wx.showShareImageMenu` 发给朋友 / 保存 / 朋友圈），再画一张 5:4 封面作为转发卡片的图。真机的 Canvas 画不了 SVG，人物用 `tools/render-portraits.mjs` 预先渲染好的 PNG。

**放上小程序码**：小程序后台「工具 → 生成小程序码」下载，存成 `miniprogram/img/qrcode.png`，把 `packageShare/card/card.js` 顶部的 `QR` 改成 `"/img/qrcode.png"`。开发者工具生成的「预览二维码」是临时的，不要放进卡片。

## 和网页版的差别

- 舞台、面板、页面用 WXML 重写，交互与网页版一致；没有键盘快捷键（网页版的 Esc 关目录）。
- 立绘与背景以 SVG 图片显示；立绘的眨眼、说话口型照常动。
- 声音依赖 `wx.createWebAudioContext`（基础库 2.19.0+）。不支持时静音运行，剧情不受影响。
- 小程序切到后台时自动停掉音乐、心跳和环境音，回来再接上。
