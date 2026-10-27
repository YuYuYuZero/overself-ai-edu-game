// 存档：与网页版用同一套 key 和 JSON 格式（localStorage → wx 本地缓存）。
const env = require("../shared/index.js");
const STORIES = env.STORIES;
const ls = env.localStorage;

function get(k) { try { return JSON.parse(ls.getItem(k)); } catch (e) { return null; } }
function set(k, v) { try { ls.setItem(k, JSON.stringify(v)); } catch (e) {} }

// 与网页版 Story.list / saved / cards 一致，供首页、测试结果页、技能卡页使用
const list = () => Object.values(STORIES).sort((a, b) => (a.order || 99) - (b.order || 99));
const saved = id => { const s = get(STORIES[id].key); return s && !s.ended ? s : null; };
const storyCards = () => list().reduce((all, st) =>
  all.concat(((get(st.key) || {}).cards || []).map(c => Object.assign({}, c, { story: st.title, P: st.POV[c.pov] }))), []);

// 练习关进度（网页版 game.js 的 complement.progress.v1）、MBTI 测试结果与作答草稿、结果页的形象性别（网页版 quiz-ui.js）
const PROGRESS = "complement.progress.v1", TYPE = "overself.mbti.v1", DRAFT = "overself.quiz.draft.v2", SEX = "overself.avatar.v1";
const progress = () => get(PROGRESS) || { stars: {}, cards: {} };
const saveProgress = p => set(PROGRESS, p);
const mbti = () => env.MBTI.normalize(get(TYPE)); // 兼容 v1 存档（22 题二选一）
const saveMbti = r => set(TYPE, r);
const quizDraft = () => get(DRAFT);
const saveQuizDraft = d => (d ? set(DRAFT, d) : ls.removeItem(DRAFT));
const avatarSex = () => (get(SEX) === "m" ? "m" : "f");
const saveAvatarSex = s => set(SEX, s === "m" ? "m" : "f");

module.exports = { get, set, list, saved, storyCards, progress, saveProgress, mbti, saveMbti, quizDraft, saveQuizDraft, avatarSex, saveAvatarSex };
