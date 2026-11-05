/* ================= CONFIG ================= */
const DAYS = [["ПН", "Понедельник"], ["ВТ", "Вторник"], ["СР", "Среда"], ["ЧТ", "Четверг"], ["ПТ", "Пятница"], ["СБ", "Суббота"]];
const GROUPS = ["601-31", "601-41", "601-51", "601-61", "602-31", "602-41", "602-51", "602-61", "603-31", "603-41", "603-51", "603-52", "603-61", "603-62", "604-31", "604-41", "604-51", "604-61", "605-31", "605-41", "605-51", "605-61", "606-31", "606-32", "606-41", "606-42", "606-51", "606-52", "606-61", "606-62", "607-31", "607-32", "607-41", "607-42", "607-51", "607-52", "607-61", "607-62", "608-31", "608-32", "608-41", "608-51", "608-61", "608-62", "609-31", "609-32", "609-41", "609-42", "609-51", "609-52", "609-61", "609-62", "610-61"];
const PARTS = ["Верх", "Середина", "Низ", "Полное"], PARTS_L = ["верхняя часть", "средняя часть", "нижняя часть", "полное расписание"];
const DEPARTMENTS = [
  { id: "pi-uts", name: "ПИ + УТС", codes: ["609", "605"], groups: GROUPS.filter(g => g.startsWith("609-") || g.startsWith("605-")) },
  { id: "tit-eie", name: "ТиТ + ЭиЭ", codes: ["603", "610"], groups: GROUPS.filter(g => g.startsWith("603-") || g.startsWith("610-")) },
  { id: "itiss-isit", name: "ИТиСС + ИСиТ", codes: ["604", "607"], groups: GROUPS.filter(g => g.startsWith("604-") || g.startsWith("607-")) },
  { id: "ivt-pmii", name: "ИиВТ + ПМиИ", codes: ["601", "606"], groups: GROUPS.filter(g => g.startsWith("601-") || g.startsWith("606-")) },
  { id: "physics-build", name: "Физика + Строительство", codes: ["602", "608"], groups: GROUPS.filter(g => g.startsWith("602-") || g.startsWith("608-")) }
];
const TEACHER_CASES = ["Скоро", "Скоро", "Скоро"];
let activeDept = DEPARTMENTS[0].id;
const deptById = id => DEPARTMENTS.find(d => d.id === id) || DEPARTMENTS[0];
const deptForGroup = g => DEPARTMENTS.find(d => d.groups.includes(g)) || DEPARTMENTS[0];
const RN = { common: "Common", rare: "Rare", mythic: "Mythic", legendary: "Legendary" };
const COL = { common: "#D4D4D4", rare: "#00A0E0", mythic: "#FF00A0", legendary: "#ff9a1f" };
const RI = { common: 0, rare: 1, mythic: 2, legendary: 3 };
const FIX = { rare: .10, mythic: .05, legendary: .01 };                  // fixed drop chances
const PRICE = { common: 10, rare: 15, mythic: 20, legendary: 70 };        // шышиш
const DEFAULT_N = 5;     // pairs assumed for groups whose schedule file isn't filled yet
const FULL_K = { 1: .1, 2: .5, 3: 1 }, PIECE_K = { 2: .2, 3: 1 / 3 };
const NEXT = { common: "rare", rare: "mythic" };                        // contracts (no Legendary)
const IMG = { doc: "assets/icons/doc.svg", check: "assets/icons/check.svg" };
const CASE_IMG = ["assets/case_pn.png", "assets/case_vt.png", "assets/case_sr.png", "assets/case_cht.png", "assets/case_pt.png", "assets/case_sb.png"];
const CASE_SIZE = 8;     // schedules inside one case (chosen group + CASE_SIZE-1 random others)
const WEEK_ANCHOR = "2026-10-26";
const LOCK_CHANCE = .15, UNLOCK_COST = 10, LOCKED_PRICE = 1;                // illegible drops: chance / price to read / sell price
const FEED_REWARD = 1, CHEST_COST = 5, SKIN_PRICE = 40, REVIVE_COST = 200;   // + revive price of a dead telifon                      // telifon: coins per feeding / skin chest cost / skin sell price
const SKINS = [
  { id: "default", name: "Стандартный телифон", img: "assets/telifon.png", hue: 0, rarity: "default", description: "Классический внешний вид телифона. Базовый скин без особой редкости." },
  { id: "s1", name: "Мраморный градиент", img: "assets/telifon_marble-fade.png", hue: 0, description: "Мраморный узор с плавным переходом цветов. Классика, которая не выходит из моды." },
  { id: "s2", name: "Голографический", img: "assets/telifon_hologram.png", hue: 0, description: "Телифон проецирует себя на твой экран. Да пребудет с тобой телифон!" },
  { id: "s3", name: "Северное сияние", img: "assets/telifon_north-glow.png", hue: 0, description: "Глядя на северное сияние ты начинаешь соединять звезды, где столь прекрасное свечение и есть цвет некой фигуры. Получившийся результат и есть телифон." },
  { id: "s4", name: "Соевый", img: "assets/telifon_soeviy.png", hue: 0, description: "Телифон в очках и с поцелуем. Последнее, пожалуй, единственное, что позволяет не оскорблять его за соевость." },
  { id: "s5", name: "Вязанный", img: "assets/telifon_zov.png", hue: 0, description: "Телифон твоей бабушки." }
];  // placeholders

// Коллекционные кейсы телифона. Здесь удобно менять цену, состав, изображения и шансы.
// chances — относительные веса; они автоматически нормализуются при открытии кейса.
const COLLECTION_CASES = [
  {
    id: "halloween-2026", name: "HALLOWEEN 2026 COLLECTION", price: 7, image: "assets/telifon.png", rewards: [
      { id: "h26-1", name: "Призрак", img: "assets/HALLOWEEN 2026/telifon_ghost.png", chance: 79, description: "Бу-у-у! Испугался?! А это обыкновенный телифон!" },
      { id: "h26-2", name: "Крик", img: "assets/HALLOWEEN 2026/telifon_scream.png", chance: 15, description: "Где-то я эту маску уже видел..." },
      { id: "h26-3", name: "Слэшер", img: "assets/HALLOWEEN 2026/telifon_slasher.png", chance: 5, description: "Телифон хоккеист! А, может и не хоккеист..." },
      { id: "h26-4", name: "Вампир", img: "assets/HALLOWEEN 2026/telifon_vamp.png", chance: 1, description: "Он вампир! Какая твоя группа крови? Дай ему укусить, он клянется, не будет больно." }
    ]
  },
  {
    id: "new-year-2026", name: "NEW YEAR EVE 2026 COLLECTION", price: 7, image: "assets/telifon.png", rewards: [
      { id: "ny26-1", name: "Олененок", img: "assets/NEW YEAR EVE 2026/telifon_deer.png", chance: 15, description: "Милый телифон с рогами." },
      { id: "ny26-2", name: "Эльф", img: "assets/NEW YEAR EVE 2026/telifon_elf.png", chance: 80, description: "Один из тех, кто помогает Санте делать игрушки-телифоны." },
      { id: "ny26-3", name: "Праздничный", img: "assets/NEW YEAR EVE 2026/telifon_new-year.png", chance: 5, description: "Бр-р-р... Он, конечно, нарядный, но черт его возьми, как ему не холодно?!" },
    ]
  },
  {
    id: "jobs", name: "JOBS COLLECTION", price: 3, image: "assets/telifon.png", rewards: [
      { id: "jobs-1", name: "Космонавт", img: "assets/JOBS/telifon_cosmonaut.png", chance: 40, description: "Мечта многих в детстве, но только телифон смог воплотить ее в реальность!" },
      { id: "jobs-2", name: "Офисный работник", img: "assets/JOBS/telifon_employee.png", chance: 39, description: "Офисный работник. Ничего необычного. Скучен. Скучно. Скукота." },
      { id: "jobs-3", name: "Хакер", img: "assets/JOBS/telifon_hacker.png", chance: 5, description: "PENTAGON DESTROYER." },
      { id: "jobs-4", name: "Кассир", img: "assets/JOBS/telifon_mcdonalds.png", chance: 15, description: "Работник забегаловки. Где же он работает в таких цветах, а то без логотипа невозможно догадаться..." },
      { id: "jobs-5", name: "Рэпер", img: "assets/JOBS/telifon_rap.png", chance: 1, description: "New Gen Rapper Yeah Gng 67676767 Cool telifon.png Download Free." }
    ]
  },
  {
    id: "valentines", name: "VALENTINE'S DAY COLLECTION", price: 3, image: "assets/telifon.png", rewards: [
      { id: "val-1", name: "Ангел", img: "assets/VALENTINES DAY/telifon_angel.png", chance: 15, description: "Нимб над головою и сила божья." },
      { id: "val-2", name: "Разбитое сердце", img: "assets/VALENTINES DAY/telifon_broken-heart.png", chance: 15, description: "Даже телифону можно разбить сердце. Жалко красавчика." },
      { id: "val-3", name: "Тортик", img: "assets/VALENTINES DAY/telifon_cake.png", chance: 32, description: "Какой он вкусный! Попробуй!" },
      { id: "val-4", name: "Купидон", img: "assets/VALENTINES DAY/telifon_cupid.png", chance: 15, description: "'Любовь нельзя объяснить,' говорят они. Конечно, как объяснить то, что телифон-купидон существует?" },
      { id: "val-5", name: "Фембой", img: "assets/VALENTINES DAY/telifon_femboy.png", chance: 10, description: "Господи, Даня, как ты оказался здесь?!?!?!!" },
      { id: "val-6", name: "Любовь по-готически", img: "assets/VALENTINES DAY/telifon_goth-romance.png", chance: 10, description: "Даже готы способны любить." },
      { id: "val-7", name: "Роза", img: "assets/VALENTINES DAY/telifon_rose.png", chance: 1, description: "Благородный запах, листья, цвет их. Все про этот телифон." },
      { id: "val-8", name: "Маша", img: "assets/VALENTINES DAY/telifon_masha.png", chance: 1, description: "Не кусается. Ну, если не считать случаев, когда хочет внимания." },
      { id: "val-9", name: "Таня", img: "assets/VALENTINES DAY/telifon_tanya.png", chance: 1, description: "В серых глазах этого ненаглядного телифончика можно утонуть." }
    ]
  },
  {
    id: "cosplay", name: "COSPLAY COLLECTION", price: 3, image: "assets/telifon.png", rewards: [
      { id: "cos-1", name: "Американский", img: "assets/COSPLAY/telifon_capt-am.png", chance: 5, description: "Откуда он такой сбежал?" },
      { id: "cos-2", name: "Киберпанк", img: "assets/COSPLAY/telifon_cyberpunk.png", chance: 1, description: "Он реально хочет остаться в твоем инвентаре." },
      { id: "cos-3", name: "Зеленый монстр", img: "assets/COSPLAY/telifon_hulk.png", chance: 5, description: "Телифон крушить-ломать!" },
      { id: "cos-4", name: "Стальной человек", img: "assets/COSPLAY/telifon_iron-man.png", chance: 5, description: "Гений, миллиардер, плэйбой, филантроп." },
      { id: "cos-5", name: "ZXC DEMON", img: "assets/COSPLAY/telifon_kaneki.png", chance: 1, description: "1000 - 7 посчитают все, а что насчет 1000 - телифон?" },
      { id: "cos-6", name: "Скр-скр-скр", img: "assets/COSPLAY/telifon_pharaon.png", chance: 5, description: "Интересно, в мертвых ли он найках...?" },
      { id: "cos-7", name: "Радик", img: "assets/COSPLAY/telifon_pirate.png", chance: 15, description: "Пират. С радиком. ТП? Отменено. Колбасу? Украл." },
      { id: "cos-8", name: "Самурай", img: "assets/COSPLAY/telifon_samurai.png", chance: 52, description: "Телифон ронин." },
      { id: "cos-9", name: "Телифон-паук", img: "assets/COSPLAY/telifon_spider-man.png", chance: 5, description: "Телифон-паук хахаха) Поняли? Ладно, надо прекращать это, я понял..." },
      { id: "cos-10", name: "Телефон", img: "assets/COSPLAY/telifon_telephone.png", chance: 1, description: "Телифон-телефон. Да, это жестко." },
      { id: "cos-11", name: "Маелстром", img: "assets/COSPLAY/telifon_thor.png", chance: 5, description: "Дает +25 к урону, +25 к скорости атаки... А, точно, он крутой, да." }
    ]
  },
  {
    id: "repaint", name: "REPAINT COLLECTION", price: 1, image: "assets/telifon.png", rewards: [
      { id: "rep-1", name: "Голографический", img: "assets/REPAINT/telifon_hologram.png", chance: 5, description: "Телифон проецирует себя на твой экран. Да пребудет с тобой телифон!" },
      { id: "rep-2", name: "Мраморный градиент", img: "assets/REPAINT/telifon_marble-fade.png", chance: 15, description: "Мраморный узор с плавным переходом цветов. Классика, которая не выходит из моды." },
      { id: "rep-3", name: "Северное сияние", img: "assets/REPAINT/telifon_north-glow.png", chance: 1, description: "Глядя на северное сияние ты начинаешь соединять звезды, где столь прекрасное свечение и есть цвет некой фигуры. Получившийся результат и есть телифон." },
      { id: "rep-4", name: "Соевый", img: "assets/REPAINT/telifon_soeviy.png", chance: 15, description: "Телифон в очках и с поцелуем. Последнее, пожалуй, единственное, что позволяет не оскорблять его за соевость." },
      { id: "rep-5", name: "Вязанный", img: "assets/REPAINT/telifon_zov.png", chance: 64, description: "Телифон твоей бабушки." }
    ]
  },
  {
    id: "devs", name: "DEVS COLLECTION", price: 3, image: "assets/telifon.png", rewards: [
      { id: "dev-1", name: "Влад", img: "assets/DEVS/telifon_vova.png", chance: 54, description: "Самый умный человек в очках." },
      { id: "dev-2", name: "Арслан", img: "assets/DEVS/telifon_arslan.png", chance: 54, description: "Буткаты и казаки, вот в чем кайф." },
      { id: "dev-3", name: "Саня", img: "assets/DEVS/telifon_sanya.png", chance: 1, description: "В ожидании дембеля. Держись, друн." }
    ]
  }
];

// Редкость определяется шансом отдельно внутри каждой коллекции; описания можно менять у каждого скина.
COLLECTION_CASES.forEach(c => c.rewards.forEach(r => {
  const chance = Number(r.chance) || 0;
  r.rarity = chance >= 30 ? "common" : chance >= 15 ? "rare" : chance >= 5 ? "mythic" : "legendary";
  r.description ??= "Коллекционный скин для телифона. Украшает телифон и доступен в твоём инвентаре скинов.";
}));
const collectionSkin = id => COLLECTION_CASES.flatMap(c => c.rewards).find(s => s.id === id);
const AVATARS = ["assets/av1.svg", "assets/av2.svg", "assets/av3.svg", "assets/av4.svg", "assets/av5.svg", "assets/av6.svg"];
/* ================= STATE ================= */
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } }
};
const st = {
  group: GROUPS.includes(store.get("group", null)) ? store.get("group") : null,
  name: store.get("name", "Студент"),
  avatar: AVATARS.includes(store.get("avatar", "")) ? store.get("avatar") : AVATARS[0],
  history: store.get("hist2", [])
};
let rounds = store.get("rounds", {});     // one independent chest per day: {list, rar, dropped}
let cur = null;                           // chest of the case that is open now
let collectionDropped = store.get("collectionDropped", {});   // { caseId: [skinIds] }

// collection roulette state — must be declared before showTab (TDZ)
let colSpinId = 0, colSpinning = false, colWinner = null;
let colCards = [], colFastSpin = false, colCurrentCase = null;
const COL_N = 70, COL_START = 4, COL_WIN = 58;

let inv = store.get("inv", []), coins = store.get("coins", 100);
const tele = Object.assign({ coins: 0, last: "", skins: ["default"], skin: "default", name: "" }, store.get("tele", {}));
if (!Array.isArray(tele.skins)) tele.skins = [];
if (!tele.skins.includes("default")) tele.skins.unshift("default");
if (!tele.skin) tele.skin = "default";
const save = () => {
  store.set("rounds", rounds); store.set("inv", inv); store.set("tele", tele);
  store.set("coins", coins); store.set("hist2", st.history); $("#coins").textContent = coins;
  document.body.classList.toggle("has-group", !!st.group);
};
const say = (id, t) => $(id).textContent = t;
const autoMsgTimers = {};
function setMsg(sel, type, text, icon = "✦", ms = 0) {
  const el = $(sel);
  if (!el) return;
  if (autoMsgTimers[sel]) { clearTimeout(autoMsgTimers[sel]); autoMsgTimers[sel] = null; }
  el.innerHTML = `<span class="msg-badge ${type}"><span class="msg-icon">${icon}</span>${text}</span>`;
  if (ms > 0) {
    autoMsgTimers[sel] = setTimeout(() => {
      const badge = el.querySelector(".msg-badge");
      if (badge) {
        badge.classList.add("is-fading");
        setTimeout(() => { if (el.contains(badge)) el.innerHTML = ""; }, 300);
      }
    }, ms);
  }
}
const fmt = x => (Math.round(x * 10000) / 100).toString().replace(".", ",") + "%";
const rnd = n => Math.floor(Math.random() * n);
function roundKey(d, deptId = activeDept) { return `${deptId}:${d}`; }
function newRound(d, deptId = activeDept) {
  const dept = deptById(deptId), list = [...dept.groups];
  const rar = {}; list.forEach(g => rar[g] = "common");
  const candidates = list.filter(g => sizes(cnt(g, d)).length === 3).sort((a, b) => cnt(b, d) - cnt(a, d));
  if (candidates[0]) rar[candidates[0]] = "mythic";
  if (candidates[1]) rar[candidates[1]] = "rare";
  const legendary = list.includes(st.group) ? st.group : (candidates[2] || candidates[0] || list[0]);
  if (legendary) rar[legendary] = "legendary";
  const key = roundKey(d, deptId);
  return rounds[key] = { list, rar, dropped: [], deptId, day: d };
}
const R = (d, deptId = activeDept) => rounds[roundKey(d, deptId)] || newRound(d, deptId);
function setGroup(g) {
  if (g !== st.group) { st.group = g; rounds = {}; }
  st.group = g; store.set("group", g); save();
}
/* ================= DROP LOGIC ================= */
const poolList = () => cur.list.filter(g => !cur.dropped.includes(g));
function weights() {
  const pool = poolList(), w = {}; let fixed = 0;
  pool.forEach(g => { const f = FIX[cur.rar[g]]; if (f) { w[g] = f; fixed += f; } });
  const cm = pool.filter(g => cur.rar[g] === "common");
  if (cm.length) cm.forEach(g => w[g] = Math.max(0, 1 - fixed) / cm.length);
  else if (pool.length) {
    const total = pool.reduce((sum, g) => sum + (w[g] || 0), 0) || pool.length;
    pool.forEach(g => w[g] = (w[g] || 1) / total);
  }
  return w;
}
function pickWinner() {
  const e = Object.entries(weights()); let x = Math.random(), acc = 0;
  for (const [g, v] of e) { acc += v; if (x < acc) return g; }
  return e[e.length - 1][0];
}
function renderDrops() {
  const odds = weights();
  const available = cur.list.filter(g => !cur.dropped.includes(g));
  const box = $("#drops");
  box.innerHTML = cur.list.map(g => {
    const r = cur.rar[g], gone = cur.dropped.includes(g), chance = gone ? 0 : (odds[g] || 0);
    return `<article class="glass drop rarity-${r}${gone ? " out" : ""}" style="--c:${COL[r]}">
      <div class="drop-visual"><img src="${IMG.doc}" alt=""><span class="drop-glint"></span></div>
      <span class="drop-group">${esc(g)}</span><small class="drop-rarity">${RN[r]}</small></article>`;
  }).join("");
  const counter = $("#dropCount");
  if (counter) counter.textContent = `${String(available.length).padStart(2, "0")} ДОСТУПНО`;
}
/* ================= INVENTORY HELPERS ================= */
const same = (a, b) => a.g === b.g && a.d === b.d && a.r === b.r && a.p === b.p && !a.x === !b.x;
const count = it => inv.filter(x => same(x, it)).length;
function take(it, n = 1) { for (let i = 0; i < n; i++) { const k = inv.findIndex(x => same(x, it)); if (k >= 0) inv.splice(k, 1); } }
const price = it => {
  if (it.x) return LOCKED_PRICE;
  const k = sizes(cnt(it.g, it.d)).length;
  return Math.max(1, Math.floor(PRICE[it.r] * (it.p === 3 ? FULL_K[k] : PIECE_K[k])));
};
const label = it => `${it.g} · ${DAYS[it.d][0]} · ${PARTS[it.p]}`;
const inner = (it, n) => `${it.x ? '<img class="lockmark" src="assets/icons/lock.svg" alt="" title="Зашифровано">' : ""}<img src="${IMG.doc}" alt=""><b>${it.g}</b><small>${DAYS[it.d][0]} · ${PARTS[it.p]}</small><small>${RN[it.r]}${n > 1 ? ` ×${n}` : ""}</small>`;
const optHTML = (it, n) => `<span style="color:${COL[it.r]}">${label(it)}${it.x ? " · зашифровано" : ""}</span><small>${RN[it.r]}${n > 1 ? ` ×${n}` : ""}</small>`;
function uniq(list) {
  const m = new Map();
  list.forEach(x => { const k = [x.g, x.d, x.r, x.p, !!x.x].join("|"); m.has(k) ? m.get(k).n++ : m.set(k, { it: x, n: 1 }); });
  return [...m.values()];
}
/* ---------- schedules (data/<group>.json) ---------- */
const SCH = {};
async function loadSchedules() {
  await Promise.all(GROUPS.map(async g => {
    try { const r = await fetch(`data/${encodeURIComponent(g)}.json`); if (r.ok) SCH[g] = await r.json(); } catch { }
  }));
}
function slotsOf(g, d) {
  const raw = SCH[g]?.days?.[DAYS[d][0]];
  if (!Array.isArray(raw)) return null;
  const m = new Map();
  raw.filter(x => x.subject && String(x.subject).trim()).forEach(x => {
    if (!m.has(x.num)) m.set(x.num, { num: x.num, items: [] });
    m.get(x.num).items.push(x);
  });
  return [...m.values()].sort((a, b) => a.num - b.num);
}
const cnt = (g, d) => slotsOf(g, d)?.length ?? DEFAULT_N;
function sizes(n) {
  if (n <= 1) return [n];            // one part = the full schedule
  if (n === 2) return [1, 1];        // top, bottom
  if (n === 3) return [1, 1, 1];
  if (n === 4) return [2, 2];        // top, bottom
  const s = Math.floor(n / 3);       // 7 -> 2/3/2, 8 -> 2/4/2, 6 -> 2/2/2 (middle gets the extra)
  return [s, n - 2 * s, s];
}
const needParts = (g, d) => { const k = sizes(cnt(g, d)).length; return k === 1 ? [3] : k === 2 ? [0, 2] : [0, 1, 2]; };
function partSlots(g, d, p) {
  const s = slotsOf(g, d) || [];
  if (p === 3) return s;
  const sz = sizes(s.length), i = sz.length === 2 ? (p === 0 ? 0 : 1) : p;
  const a = sz.slice(0, i).reduce((x, y) => x + y, 0);
  return s.slice(a, a + sz[i]);
}
const scr = t => String(t).replace(/\S/g, () => "▓▒░█▚▞▙▟"[rnd(8)]);   // locked text: real characters never reach the DOM
const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
/* ---------- numerator / denominator (auto) ---------- */
const WK = { num: "чис", den: "знам" }, WK_FULL = { num: "числитель", den: "знаменатель" };
function weekType(date = new Date()) {
  const q = new URLSearchParams(location.search).get("week");      // ?week=num / ?week=den  -> for testing
  if (q === "num" || q === "den") return q;
  const [y, mo, d] = WEEK_ANCHOR.split("-").map(Number);
  const monday = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate() - (date.getDay() + 6) % 7);
  const diff = Math.round((monday - Date.UTC(y, mo - 1, d)) / 604800000);
  return diff % 2 === 0 ? "num" : "den";
}
/* ---------- subgroups: "A, п/г 1 | B, п/г 2" -> left / right ---------- */
function itemCells(x) {
  const subj = String(x.subject || "").trim(), room = String(x.room || "").trim(), week = x.week;
  const clean = t => t.replace(/,?\s*п\/г\s*\d\s*$/i, "").trim();
  const segments = subj.includes("|") ? subj.split("|").map(t => t.trim()) : [subj];
  if (segments.some(t => /п\/г\s*[1-3]/i.test(t)) || subj.includes("|")) {
    const rooms = room.includes("|") ? room.split("|").map(t => t.trim()) : [];
    return segments.map((text, i) => {
      if (!text) return null;
      const match = text.match(/п\/г\s*(\d)/i);
      const side = match ? Math.max(0, Math.min(2, Number(match[1]) - 1)) : i;
      const roomValue = rooms.length ? (rooms[i] || "") : room;
      return { side, subject: clean(text), room: roomValue, week };
    }).filter(Boolean);
  }
  return [{ side: null, subject: subj, room, week }];
}
function slotHTML(sl, cw, E = esc) {
  const dim = w => w && w !== cw ? " dim" : "";
  const full = [], side = [[], [], []];
  sl.items.forEach(x => itemCells(x).forEach(c => (c.side == null ? full : side[c.side]).push(c)));
  const card = c => `<div class="lesson-main"><span class="lesson-subject">${E(c.subject)}</span><small class="lesson-meta">${c.room ? `<span class="room-tag">${E(c.room)}</span>` : ""}${c.week ? `<span class="week-tag">${WK[c.week]}</span>` : ""}</small></div>`;
  let html = full.map(c => `<article class="les lesson-card${dim(c.week)}"><b class="lesson-number">${E(sl.num)}</b>${card(c)}</article>`).join("");
  if (side.some(a => a.length)) {
    const count = side[2].length ? 3 : 2;
    const col = (arr, n) => arr.length
      ? arr.map(c => `<div class="cell${dim(c.week)}"><div class="lb">Подгруппа ${n}${c.week ? " · " + WK[c.week] : ""}</div><div class="t">${E(c.subject)}</div>${c.room ? `<div class="rm">${E(c.room)}</div>` : ""}</div>`).join("")
      : `<div class="cell ghost"><div class="lb">Подгруппа ${n}</div><div class="t">нет пары</div></div>`;
    html += `<article class="les sub lesson-card split-card" style="--sub-count:${count}"><b class="lesson-number">${E(sl.num)}</b><div class="subgroup-grid">${side.slice(0, count).map((arr, i) => `<div class="col">${col(arr, i + 1)}</div>`).join("")}</div></article>`;
  }
  return html;
}
function lessonsHTML(g, d, p, locked = false) {
  const slots = slotsOf(g, d);
  if (!slots) return `<div class="schedule-empty"><span class="empty-mark">⌁</span><strong>Расписание ещё не заполнено</strong><p>${location.protocol === "file:" ? "Открой сайт через локальный сервер, чтобы загрузить данные." : "Для этой группы пока нет опубликованных пар на выбранный день."}</p></div>`;
  const part = partSlots(g, d, p);
  if (!part.length) return '<div class="schedule-empty"><span class="empty-mark">✓</span><strong>На этот день пар нет</strong><p>Можно выдохнуть — свободный день.</p></div>';
  const cw = weekType();
  return `<div class="schedule-meta"><div class="schedule-meta-title"><span class="eyebrow">SCHEDULE DROP</span><strong>${esc(g)} <i>·</i> ${DAYS[d][1]}</strong><small>${PARTS_L[p]}</small></div><div class="wk"><span class="week-dot"></span>${WK_FULL[cw]}</div></div><div class="lesson-list${locked ? " is-locked" : ""}">${part.map(sl => slotHTML(sl, cw, locked ? scr : esc)).join("")}</div>`;
}
function choose(title, opts, desc = "", previewImg = "") {
  return new Promise(res => {
    const m = $("#modal"), box = m.querySelector(".list");
    m.querySelector("h2").textContent = title;
    box.innerHTML = "";
    if (previewImg) {
      const p = document.createElement("div");
      p.className = "choose-preview";
      p.innerHTML = `<img src="${esc(previewImg)}" alt="">`;
      box.append(p);
    }
    if (desc) {
      const d = document.createElement("div");
      d.className = "glass row opt opt-static";
      d.textContent = desc;
      box.append(d);
    }
    const done = v => { m.classList.remove("open"); res(v); };
    opts.forEach(o => { const b = document.createElement("button"); b.className = "glass row opt"; b.innerHTML = o.html; b.onclick = () => done(o.val); box.append(b); });
    const x = document.createElement("button"); x.className = "glass row opt"; x.textContent = "Отмена"; x.onclick = () => done(null);
    box.append(x); m.classList.add("open");
  });
}
/* ================= NAVIGATION ================= */
/* ================= NAVIGATION ================= */
let spinId = 0, spinning = false, curIdx = 0, winner = null, part = 0;
function showTab(tab) {
  colSpinId++;
  colSpinning = false;
  document.body.classList.toggle("info-hidden", tab === "settings");
  document.body.classList.remove("result-active");
  if (tab !== "upgrader" && upWheelCancel) upWheelCancel();
  $("#collectionOpening")?.classList.remove("active");
  $("#collectionResult")?.classList.remove("active");
  $$(".screen").forEach(s => s.classList.toggle("active", s.id === tab));
  $$(".bar [data-tab]").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  const pageNames = { home: "Главная", inventory: "Коллекция", upgrader: "Upgrader", contracts: "Контрактный центр", profile: "Профиль игрока", telifon: "Телифон", settings: "Настройки" };
  const title = $("#pageTitle");
  if (title) title.textContent = pageNames[tab] || "Raspisanie Drop";
  const ru = $("#railUser"), rg = $("#railGroup"), ra = $("#railAvatarImg");
  if (ru) ru.textContent = st.name || "Студент";
  if (rg) rg.textContent = st.group ? `Группа ${st.group}` : "Группа не выбрана";
  if (ra) ra.src = st.avatar;
  ({ profile: renderProfile, settings: renderSettings, inventory: renderInv, upgrader: resetUp, contracts: resetCt, telifon: renderTele })[tab]?.();
}
const showStage = id => $$(".stage").forEach(s => s.classList.toggle("active", s.id === id));
function goHome() { spinId++; spinning = false; showTab("home"); renderCases(); showStage("cases"); }
$$(".bar [data-tab]").forEach(b => b.onclick = () => {
  if (b.dataset.tab === "home") return goHome();
  spinId++; spinning = false; showTab(b.dataset.tab);
});
/* ================= GROUP LIST ================= */
function renderGroupList(box, onPick, query = "") {
  box.innerHTML = "";
  const q = query.trim().toLowerCase();
  DEPARTMENTS.forEach(dept => {
    const groups = dept.groups.filter(g => g.toLowerCase().includes(q));
    if (!groups.length) return;
    const section = document.createElement("section"); section.className = "group-dept";
    const title = document.createElement("h4"); title.className = "group-dept-title"; title.textContent = `${dept.name} · ${groups.length}`; section.append(title);
    const grid = document.createElement("div"); grid.className = "group-dept-grid";
    groups.forEach(g => {
      const sel = g === st.group, b = document.createElement("button");
      b.className = "glass row opt" + (sel ? " sel" : "");
      const n = document.createElement("span"); n.textContent = g; b.append(n);
      b.onclick = () => { navigator.vibrate?.(8); onPick(g); }; grid.append(b);
    });
    section.append(grid); box.append(section);
  });
}
function openPicker() {
  const list = $("#pickList"), search = $("#groupSearch");
  const pick = g => {
    setGroup(g);
    activeDept = deptForGroup(g).id;
    renderCases();
    $("#picker").classList.remove("open");
    goHome();
    if (!store.get("welcomeShown", false)) {
      store.set("welcomeShown", true);
      setTimeout(() => showWelcome(), 280);
    }
  };
  if (search) search.value = "";
  renderGroupList(list, pick);
  if (search) search.oninput = () => renderGroupList(list, pick, search.value);
  $("#picker").classList.add("open");
}
const renderSettings = () => renderGroupList($("#groups"), g => { setGroup(g); activeDept = deptForGroup(g).id; renderSettings(); renderCases(); say("#pageTitle", "Настройки"); });
/* ================= CASES + SPIN ================= */
function scheduleProgress(group, day) {
  if (!group) return { done: 0, total: 3 };
  const need = needParts(group, day);
  const owned = new Set();
  inv.filter(x => x.g === group && x.d === day && !x.x).forEach(x => {
    if (x.p !== 3 && need.includes(x.p)) owned.add(x.p);   // полное расписание НЕ считается частью
  });
  return { done: owned.size, total: need.length };
}
function renderCases() {
  const cats = $("#caseCategories");
  cats.innerHTML = DEPARTMENTS.map(d => `<button class="case-cat${d.id === activeDept ? " active" : ""}" data-dept="${d.id}"><span>${d.name}</span><small>${d.groups.length} направлений</small></button>`).join("");
  cats.querySelectorAll("[data-dept]").forEach(b => b.onclick = () => { activeDept = b.dataset.dept; renderCases(); });
  const dept = deptById(activeDept); $("#caseCategoryTitle").textContent = `${dept.name} · ${dept.groups.length} направлений`;
  $("#grid").innerHTML = DAYS.map((day, i) => {
    const group = st.group;
    const { done, total } = scheduleProgress(group, i);
    const hasFull = !!group && inv.some(x => x.g === group && x.d === i && x.p === 3 && !x.x);
    const isStarted = hasFull || done > 0;
    const pct = hasFull ? 100 : Math.min(100, Math.round(done / Math.max(1, total) * 100));
    let badge = "";
    if (group) {
      const label = hasFull ? "✓" : `${done}/${total}`;
      const cls = `tile-progress${hasFull ? " is-complete" : isStarted ? "" : " is-empty"}`;
      const aria = hasFull ? "Расписание полностью собрано" : `Собрано ${done} из ${total}`;
      badge = `<span class="${cls}" style="--progress:${pct}%" aria-label="${aria}"><b>${label}</b></span>`;
    }
    return `<button class="glass tint tile" data-i="${i}" data-dept="${dept.id}">
      ${badge}
      <img class="chest" src="${CASE_IMG[i]}" alt="">
      <span class="tile-day">${day[1]}</span>
    </button>`;
  }).join("");
  $("#grid").querySelectorAll(".tile").forEach(t => t.onclick = () => openCase(+t.dataset.i, t.dataset.dept));
  $("#teacherGrid").innerHTML = TEACHER_CASES.map((day, i) => `<button class="teacher-case" disabled><span class="teacher-placeholder">✦</span><b>${day}</b><small>Скоро</small></button>`).join("");
}
renderCases();
$("#backCases").onclick = () => { spinId++; spinning = false; renderCases(); btn.disabled = coins < 10; showStage("cases"); };
const N = 70, START = 4, WIN = 58;
const track = $("#track"), strip = $("#strip"), btn = $("#spinBtn");
let cards = [];
let fastSpin = false;
function trackMetrics() {
  const cardWidth = cards[0]?.offsetWidth || 84;
  const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 14;
  return { cardWidth, gap, pitch: cardWidth + gap };
}
const ease = t => { const sm = t * t * (3 - 2 * t), q = 1 - Math.pow(1 - t, 4); return sm * (1 - t) + q * t; };
function buildTrack() {
  if (!poolList().length) cur = newRound(curIdx, activeDept);
  const pool = poolList();
  if (!pool.length) throw new Error("Не удалось собрать предметы для рулетки");
  track.innerHTML = ""; cards = [];
  for (let i = 0; i < N; i++) {
    const g = i === WIN ? winner : pool[rnd(pool.length)], c = document.createElement("div");
    c.className = "card"; c.style.setProperty("--c", COL[cur.rar[g]]);
    c.innerHTML = `<img src="${IMG.doc}" alt=""><b></b>`; c.querySelector("b").textContent = g;
    track.append(c); cards.push(c);
  }
}
function place(scroll) {
  const w = strip.clientWidth;
  const { cardWidth, pitch } = trackMetrics();
  track.style.transform = `translate3d(${w / 2 - cardWidth / 2 - scroll}px,0,0)`;
  for (let i = 0; i < N; i++) {
    const d = i * pitch - scroll;
    if (Math.abs(d) > w / 2 + cardWidth) continue;
    const near = Math.max(0, 1 - Math.abs(d) / (pitch * 1.6));
    cards[i].style.transform = `scale(${0.8 + 0.4 * near})`;
    cards[i].style.opacity = Math.max(0.4, 1 - Math.abs(d) / (w / 2));
  }
}
function openCase(i, deptId = activeDept, autoSpin = false) {
  if (autoSpin && coins < 10) { setMsg("#resultNote", "warning", "Не хватает шышиш — потапай на телифон, чтобы получить ещё", "!"); return; }
  activeDept = deptId; curIdx = i; cur = R(i, deptId);
  if (!poolList().length) cur = newRound(i, activeDept);
  winner = pickWinner(); const nd = needParts(winner, i); part = nd[rnd(nd.length)];
  say("#spinLabel", `${deptById(deptId).name} · ${DAYS[i][1]}`);
  $("#spinNote").innerHTML = "";
  if (coins < 10) {
    setMsg("#spinNote", "warning", "Не хватает шышиш — потапай на телифон, чтобы получить ещё", "!");
  } else {
    $("#spinNote").innerHTML = "";
  }
  $("#spinBtn").disabled = coins < 10;
  btn.disabled = coins < 10; spinning = false;
  setSpinBtnText("Открыть кейс");
  buildTrack(); renderDrops(); showStage("spin");
  requestAnimationFrame(() => {
    place(START * trackMetrics().pitch);
    if (autoSpin) requestAnimationFrame(() => spin());
  });
}
function spin() {
  if (spinning) return;
  spinning = true; btn.disabled = true;
  setSpinBtnText("Открытие...", false);
  const id = ++spinId, dur = fastSpin ? 1100 : 5000 + Math.random() * 2000, t0 = performance.now();
  const pitch = trackMetrics().pitch;
  const startScroll = START * pitch;
  const endScroll = WIN * pitch;
  const travel = endScroll - startScroll;
  navigator.vibrate?.(15);
  (function frame(now) {
    if (id !== spinId) return;
    const p = Math.min(1, (now - t0) / dur);
    place(startScroll + ease(p) * travel);
    if (p < 1) return requestAnimationFrame(frame);
    place(endScroll);
    setTimeout(() => { if (id === spinId) finish(); }, 450);
  })(t0);
}
btn.onclick = () => {
  if (spinning) return;
  if (coins < 10) {
    setMsg("#spinNote", "warning", "Не хватает шышиш — потапай на телифон, чтобы получить ещё", "!");
    return;
  }
  $("#spinNote").innerHTML = "";
  spin();
};
function setSpinBtnText(text, withPrice = true) {
  const b = $("#spinBtn");
  if (!b) return;
  b.innerHTML = `<span class="btn-star">✦</span><span class="btn-main">${text}${withPrice ? '<small>за 10 шышиш</small>' : ''}</span>`;
}
$("#fastSpinBtn").onclick = () => {
  fastSpin = !fastSpin;
  $("#fastSpinBtn").textContent = `Быстрая прокрутка: ${fastSpin ? "вкл." : "выкл."}`;
  $("#fastSpinBtn").classList.toggle("green", fastSpin);
};
$("#resultBackCase").onclick = () => {
  openCase(curIdx, activeDept, false);
};
$("#resultSpinAgain").onclick = () => openCase(curIdx, activeDept, true);
function finish() {
  $("#result").classList.remove("inventory-view");
  spinning = false;
  const it = { g: winner, d: curIdx, r: cur.rar[winner], p: part, ...(Math.random() < LOCK_CHANCE && { x: true }) };
  inv.push(it);
  st.history.unshift({ ...it, t: Date.now() }); st.history = st.history.slice(0, 50);
  if (!cur.dropped.includes(winner)) cur.dropped.push(winner);
  let note = "";
  const commonsLeft = cur.list.some(g => cur.rar[g] === "common" && !cur.dropped.includes(g));
  if (!commonsLeft) {
    newRound(curIdx, activeDept); note = "Все Common выпали — кейс обновлён";
  }
  coins -= 10;
  save();
  const lb = $("#resultLabel"); lb.textContent = `${it.g} • ${RN[it.r]} • ${PARTS_L[it.p]} • ${DAYS[it.d][0]}${it.x ? " • зашифровано" : ""}`; lb.style.color = COL[it.r];
  $("#resultNote").innerHTML = "";
  const noteHTML = note ? `<div class="result-note-badge">✦ ${note}</div>` : "";
  $("#panel").innerHTML = lessonsHTML(it.g, it.d, it.p, it.x) + noteHTML;
  navigator.vibrate?.([20, 40, 20]); showStage("result");
}
/* ================= INVENTORY ================= */
let sortBy = "rarity", rev = false, view = [];
const SORTS = {
  rarity: ["Редкость", (a, b) => RI[a.r] - RI[b.r]],
  group: ["Группа", (a, b) => GROUPS.indexOf(a.g) - GROUPS.indexOf(b.g)],
  alpha: ["А–Я", (a, b) => label(a).localeCompare(label(b), "ru")],
  price: ["Цена", (a, b) => price(a) - price(b)],
  day: ["По дням", (a, b) => a.d - b.d || GROUPS.indexOf(a.g) - GROUPS.indexOf(b.g)]
};
function renderInv() {
  $("#sorts").innerHTML = Object.entries(SORTS).map(([k, [n]]) => `<button class="glass pill chipb${k === sortBy ? " on" : ""}" data-s="${k}">${n}</button>`).join("")
    + `<button class="glass pill chipb${rev ? " on" : ""}" data-s="rev">⇅ Обратно</button>`;
  view = uniq(inv).sort((a, b) => SORTS[sortBy][1](a.it, b.it) || label(a.it).localeCompare(label(b.it), "ru"));
  if (rev) view.reverse();
  $("#invGrid").innerHTML = view.length ? view.map((e, i) => {
    const isFull = e.it.p === 3;
    const { done, total } = scheduleProgress(e.it.g, e.it.d);
    const isStarted = isFull || done > 0;
    const pct = isFull ? 100 : Math.min(100, Math.round(done / Math.max(1, total) * 100));
    const label = isFull ? "✓" : `${done}/${total}`;
    const cls = `schedule-card-progress${isFull ? " is-complete" : isStarted ? "" : " is-empty"}`;
    const aria = isFull ? "Расписание полностью собрано" : `Собрано ${done} из ${total}`;
    const badge = `<span class="${cls}" style="--progress:${pct}%" aria-label="${aria}"><b>${label}</b></span>`;
    return `<button class="glass icard schedule-inv-card" data-i="${i}" style="--c:${COL[e.it.r]};--card-i:${i}">${badge}${inner(e.it, e.n)}</button>`;
  }).join("") : '<p class="empty">Пока пусто</p>';
  const progress = new Map();
  inv.filter(x => !x.x).forEach(x => {
    const key = `${x.g}|${x.d}`;
    if (!progress.has(key)) progress.set(key, { g: x.g, d: x.d, parts: new Set() });
    if (x.p === 3) needParts(x.g, x.d).forEach(p => progress.get(key).parts.add(p)); else progress.get(key).parts.add(x.p);
  });
  const host = $("#scheduleProgress");
  if (host) host.innerHTML = "";
}
$("#sorts").onclick = e => { const s = e.target.dataset.s; if (!s) return; s === "rev" ? rev = !rev : sortBy = s; renderInv(); };
$("#invGrid").onclick = e => { const b = e.target.closest("[data-i]"); if (b) itemMenu(view[+b.dataset.i].it); };
function viewItem(it) {
  $("#result").classList.add("inventory-view"); showTab("home");
  const lb = $("#resultLabel"); lb.textContent = `${it.g} • ${RN[it.r]} • ${it.p === 3 ? DAYS[it.d][1] : PARTS_L[it.p] + " • " + DAYS[it.d][0]}`; lb.style.color = COL[it.r];
  say("#resultNote", ""); $("#panel").innerHTML = lessonsHTML(it.g, it.d, it.p); showStage("result");
}
async function itemMenu(it) {
  const opts = [], have = p => inv.some(x => same(x, { ...it, p })), need = needParts(it.g, it.d);
  if (it.x) opts.push({ html: `Расшифровать за ${UNLOCK_COST} шышиш`, val: "unlock" });
  else opts.push({ html: it.p === 3 ? "Открыть расписание" : "Открыть часть", val: "view" });
  if (!it.x && it.p < 3 && need.every(have)) opts.push({ html: "Собрать расписание", val: "asm" });
  opts.push({ html: `Продать за ${price(it)} шышиш`, val: "sell" });
  const a = await choose(label(it) + (it.x ? " · зашифровано" : ""), opts);
  if (a === "view") return viewItem(it);
  if (a === "unlock") {
    if (coins < UNLOCK_COST) return choose(`Не хватает шышиш: нужно ${UNLOCK_COST}, у тебя ${coins}`, []);
    coins -= UNLOCK_COST; take(it); const open = { ...it }; delete open.x; inv.push(open); save(); renderInv(); return viewItem(open);
  }
  if (a === "asm") { need.forEach(p => take({ ...it, p })); inv.push({ ...it, p: 3 }); }
  if (a === "sell") { take(it); coins += price(it); }
  save(); renderInv();
}
/* ================= UPGRADER ================= */
let upSrc = null, upDst = null, upBusy = false;
let upWheelCancel = null;
let upLastMsg = "";
function upChance(s, t) {
  const d = RI[t] - RI[s];
  return Math.max(0, 1 - .24 - (d > 0 ? .25 * d : 0) - (FIX[t] || 0) * .75);
}
function resetUp() {
  if (upWheelCancel) upWheelCancel();
  upSrc = upDst = null; upBusy = false; paintUp();
  $("#upMsg").innerHTML = upLastMsg;
}
function paintUp() {
  const s = $("#upSrc"), d = $("#upDst");
  s.innerHTML = upSrc ? inner(upSrc, 1) : "+"; s.style.setProperty("--c", upSrc ? COL[upSrc.r] : "");
  const t = upDst && upSrc && { g: upDst, d: upSrc.d, r: R(upSrc.d, deptForGroup(upSrc.g).id).rar[upDst], p: 3 };
  d.innerHTML = t ? inner(t, 1) : "+"; d.style.setProperty("--c", t ? COL[t.r] : "");
  const c = upSrc && t ? upChance(upSrc.r, t.r) : null;
  say("#upPct", c == null ? "%?" : fmt(c));
  const ring = $("#wheelRing");
  if (ring) {
    ring.style.setProperty("--chance-angle", c == null ? "0deg" : `${c * 360}deg`);
    ring.style.background = c == null ? "conic-gradient(#62566a 0deg, #33273a 360deg)" : `conic-gradient(#64e6a8 ${c * 360}deg,#f16b7d 0)`;
  }
}
$("#upSrc").onclick = async () => {
  if (upBusy) return;
  const l = uniq(inv.filter(x => x.p === 3 && !x.x && x.r !== "legendary"));
  if (!l.length) return setMsg("#upMsg", "warning", "Нет подходящих расписаний (Common, Rare, Mythic)", "!");
  const v = await choose("Что улучшаем?", l.map(e => ({ html: optHTML(e.it, e.n), val: e.it })));
  if (v) {
    upSrc = v; upDst = null;
    upLastMsg = "";
    $("#upMsg").innerHTML = "";
    const orbit = $("#ptrOrbit");
    if (orbit) { orbit.style.transition = "none"; orbit.style.transform = "rotate(0deg)"; }
    paintUp();
  }
};
$("#upDst").onclick = async () => {
  if (upBusy) return;
  if (!upSrc) return setMsg("#upMsg", "warning", "Сначала выбери расписание", "!");
  const rr = R(upSrc.d, deptForGroup(upSrc.g).id), l = rr.list.filter(g => !(upSrc.r === "legendary" && rr.rar[g] === "legendary"));
  const v = await choose("Что хотим получить?", l.map(g => ({ html: `<span style="color:${COL[rr.rar[g]]}">${g}</span><small>${RN[rr.rar[g]]}</small>`, val: g })));
  if (v) { upDst = v; paintUp(); }
};
function spinWheel(roll) {
  return new Promise(resolve => {
    const t0 = performance.now(), duration = 4600, turns = 5, end = 360 * turns + roll * 360;
    const orbit = $("#ptrOrbit");
    if (!orbit) { setTimeout(resolve, 100); return; }

    upWheelCancel = () => {
      if (orbit) {
        orbit.style.transition = "none";
        orbit.style.transform = `rotate(${end}deg)`;   // прыжок в финальный угол
      }
      upWheelCancel = null;
      resolve();
    };

    orbit.style.transition = "none"; orbit.style.transform = "rotate(0deg)";
    requestAnimationFrame(() => requestAnimationFrame(() => {
      (function frame(now) {
        if (!upWheelCancel) return;                    // цикл прерван — выходим
        const p = Math.min(1, (now - t0) / duration), angle = ease(p) * end;
        orbit.style.transform = `rotate(${angle}deg)`;
        if (p < 1) requestAnimationFrame(frame);
        else {
          upWheelCancel = null;
          setTimeout(resolve, 300);
        }
      })(performance.now());
    }));
  });
}
$("#upGo").onclick = async () => {
  if (upBusy) return;
  if (!upSrc || !upDst) return setMsg("#upMsg", "warning", "Выбери расписание и цель", "!");
  const tr = R(upSrc.d, deptForGroup(upSrc.g).id).rar[upDst];
  if (upSrc.r === "legendary" && tr === "legendary") return setMsg("#upMsg", "warning", "Legendary → Legendary нельзя", "✕");
  upBusy = true; upLastMsg = ""; $("#upMsg").innerHTML = "";
  const c = upChance(upSrc.r, tr), roll = Math.random(), src = upSrc, dst = upDst;
  take(src); save();
  await spinWheel(roll);
  const ok = roll < c;
  if (ok) inv.push({ g: dst, d: src.d, r: tr, p: 3 });
  save();
  upLastMsg = ok
    ? `<span class="msg-badge success"><span class="msg-icon">✦</span>Успех! Расписание в инвентаре</span>`
    : `<span class="msg-badge fail"><span class="msg-icon">✕</span>Неудача — расписание сгорело</span>`;
  $("#upMsg").innerHTML = upLastMsg;
  upSrc = upDst = null; upBusy = false; paintUp();
};
/* ================= CONTRACTS ================= */
let ctSel = null, signed = false, drawing = false;
const sig = $("#sig"), cx = sig.getContext("2d"), INK = "#26336f";
function clearSig() { cx.clearRect(0, 0, sig.width, sig.height); signed = false; }
function resetCt() { ctSel = null; clearSig(); paintCt(); $("#ctMsg").innerHTML = ""; say("#sigLbl", "Ваша подпись"); }
function paintCt() {
  $("#ctSlots").innerHTML = Array.from({ length: 10 }, () =>
    `<div class="glass mini"${ctSel ? ` style="--c:${COL[ctSel.r]}"` : ""}>${ctSel ? inner(ctSel, 1) : ""}</div>`).join("");
  const o = $("#ctOut"); o.style.setProperty("--c", ctSel ? COL[NEXT[ctSel.r]] : "");
  o.innerHTML = ctSel ? `<img src="${IMG.doc}" alt=""><b>${ctSel.g}</b><small>${RN[NEXT[ctSel.r]]} · ?</small>` : "?";
}
$("#ctPick").onclick = async () => {
  const l = uniq(inv.filter(x => x.p === 3 && !x.x && NEXT[x.r])).filter(e => e.n >= 10);
  if (!l.length) return setMsg("#ctMsg", "warning", "Нужно 10 одинаковых полных расписаний (Common или Rare)", "!");
  const v = await choose("10 одинаковых расписаний", l.map(e => ({ html: optHTML(e.it, e.n), val: e.it })));
  if (v) { ctSel = v; paintCt(); $("#ctMsg").innerHTML = ""; }
};
const pos = e => {
  const r = sig.getBoundingClientRect(); return [(e.clientX - r.left) * sig.width / r.width, (e.clientY - r.top) * sig.height / r.height,
  e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom];
};
cx.strokeStyle = cx.fillStyle = INK; cx.lineWidth = 2.4; cx.lineCap = cx.lineJoin = "round";
sig.onpointerdown = e => {
  sig.setPointerCapture(e.pointerId); drawing = true; signed = true;
  const [x, y] = pos(e); cx.beginPath(); cx.arc(x, y, 1.3, 0, 7); cx.fill(); cx.beginPath(); cx.moveTo(x, y);   // a tap = a dot
};
sig.onpointermove = e => {
  if (!drawing) return;
  const [x, y, inside] = pos(e);
  if (!inside) { drawing = false; return; }                // can't leave the box
  cx.lineTo(x, y); cx.stroke();
};
sig.onpointerup = sig.onpointercancel = () => drawing = false;
$("#sigClear").onclick = clearSig;
$("#ctGo").onclick = () => {
  if (!ctSel) return setMsg("#ctMsg", "warning", "Сначала выбери расписания", "!");
  if (!signed) return setMsg("#ctMsg", "warning", "Поставь подпись — хотя бы точку", "!");
  take(ctSel, 10);
  const it = { g: ctSel.g, d: rnd(DAYS.length), r: NEXT[ctSel.r], p: 3 };
  inv.push(it); save(); resetCt();
  $("#ctMsg").innerHTML = `<span class="msg-badge reward"><span class="msg-icon">✦</span>Получено: <b style="color:${COL[it.r]}">${esc(label(it))} (${RN[it.r]})</b></span>`;
};
let seq = "";
addEventListener("keydown", e => {
  if (!$("#contracts").classList.contains("active")) return;
  const ch = { KeyC: "с", KeyD: "в", KeyJ: "о" }[e.code];     // physical keys of С, В, О
  seq = (seq + (ch || "_")).slice(-3);
  if (seq === "сво") say("#sigLbl", "Согласен на контракт");
});
/* ================= TELIFON ================= */
const today = () => new Date().toLocaleDateString("sv"), skinOf = id => SKINS.find(s => s.id === id) || collectionSkin(id);
if (!tele.born) tele.born = today();                                                    // day the telifon started to be counted
const telDead = () => Math.round((new Date(today()) - new Date(tele.last || tele.born)) / 864e5) >= 2;   // a whole day without feeding
// death wipes the telifocoins (checked whenever the telifon is used)
const telCheck = () => { const dead = telDead(); if (dead && tele.coins) { tele.coins = 0; save(); } return dead; };
telCheck();
const skinHTML = s => `<img class="skin-prev" src="${s ? s.img : "assets/telifon.png"}" alt="">`;
let skinFilters = { rarity: "all", collection: "all", name: "", sort: "rarity", reverse: false };
let lastTapAt = 0, tapDay = store.get("teleTapDay", ""), tapsToday = store.get("teleTapsToday", 0);
const TAP_COOLDOWN = 350;
function renderTele() {
  const s = skinOf(tele.skin) || skinOf("default"), dead = telCheck(), fed = !dead && tele.last === today(), owned = new Map();
  tele.skins.forEach(id => owned.set(id, (owned.get(id) || 0) + 1));
  $("#pet").innerHTML = skinHTML(s); $("#pet").classList.toggle("fed", fed); $("#pet").classList.toggle("dead", dead);
  const equippedRarity = s?.rarity || "default"; $("#pet").style.setProperty("--pet-glow", equippedRarity === "default" ? "transparent" : (COL[equippedRarity] || "transparent"));
  const nm = tele.name.trim() || "Телифон", ps = $("#petStatus"), stt = dead ? "dead" : fed ? "fed" : "hungry";
  $("#petNameInput").value = tele.name; ps.textContent = "• " + { dead: "мертв", fed: "сыт", hungry: "голоден" }[stt]; ps.dataset.s = stt;
  say("#petHint", dead ? `${nm} умер: ты не кормил его целый день, телифокоины сгорели. Воскреси за ${REVIVE_COST} шышиш` : fed ? `${nm} сыт. Приходи завтра — снова будет голоден` : `${nm} голоден! Покорми его любым полным расписанием`);
  say("#teleCoins", tele.coins); renderCollectionCases(); $("#feedBtn").disabled = false;
  $("#feedBtn").classList.toggle("is-fed", fed);
  $("#feedBtn").textContent = fed ? "Уже сыт" : "Покормить";
  $("#feedBtn").style.display = dead ? "none" : "";
  $("#reviveBtn").style.display = dead ? "" : "none"; say("#chestBtn", "Коллекции кейсов");
  renderSkinInventory();
}
function renderSkinInventory() {
  if (!tele.skin) tele.skin = "default";
  const host = $("#skinGrid");
  const all = [...new Set(tele.skins)];
  const rarityOrder = { common: 0, rare: 1, mythic: 2, legendary: 3, default: -1 };
  const items = all.map(id => ({ id, skin: skinOf(id), count: tele.skins.filter(x => x === id).length }))
    .filter(x => x.skin)
    .filter(x => skinFilters.rarity === "all" || (x.skin.rarity || "default") === skinFilters.rarity)
    .filter(x => skinFilters.collection === "all" || COLLECTION_CASES.some(c => c.id === skinFilters.collection && c.rewards.some(r => r.id === x.id)))
    .filter(x => x.skin.name.toLowerCase().includes(skinFilters.name.toLowerCase()))
    .sort((a, b) => {
      let cmp = 0;
      if (skinFilters.sort === "name") cmp = a.skin.name.localeCompare(b.skin.name, "ru");
      else if (skinFilters.sort === "collection") {
        const ca = COLLECTION_CASES.find(c => c.rewards.some(r => r.id === a.id))?.name || "Стандартный";
        const cb = COLLECTION_CASES.find(c => c.rewards.some(r => r.id === b.id))?.name || "Стандартный";
        cmp = ca.localeCompare(cb, "ru");
      } else cmp = rarityOrder[a.skin.rarity || "default"] - rarityOrder[b.skin.rarity || "default"];
      return skinFilters.reverse ? -cmp : cmp;
    });
  host.innerHTML = `<div class="skin-filters">
    <input id="skinNameFilter" class="glass pill input" placeholder="Поиск по имени" value="${esc(skinFilters.name)}">
    <select id="skinRarityFilter" class="glass pill input"><option value="all">Все редкости</option><option value="common">Common</option><option value="rare">Rare</option><option value="mythic">Mythic</option><option value="legendary">Legendary</option><option value="default">Обычный</option></select>
    <select id="skinCollectionFilter" class="glass pill input"><option value="all">Все коллекции</option>${COLLECTION_CASES.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select>
    <select id="skinSortBy" class="glass pill input"><option value="rarity">Сортировать: редкость</option><option value="name">Сортировать: имя</option><option value="collection">Сортировать: коллекция</option></select>
    <button class="btn glass small" id="skinSortReverse">Порядок: ${skinFilters.reverse ? "обратный" : "прямой"}</button>
  </div>` + (items.length ? `<div class="skin-cards">${items.map(({ id, skin, count }) => {
    const rarity = skin.rarity || "default";
    const isUsing = id === tele.skin;
    const c = COL[rarity] || (rarity === "default" ? "#D4D4D4" : "transparent");
    return `<button class="glass icard skin-card rarity-${rarity}${isUsing ? " using" : ""}" data-id="${esc(id)}" style="--c:${c}">${isUsing ? '<span class="skin-used-badge">✓</span>' : ""}${skinHTML(skin)}<b>${esc(skin.name)}</b><small>${RN[rarity] || "Обычный"}${count > 1 ? ` · ×${count}` : ""}${isUsing ? " · используется" : ""}</small></button>`;
  }).join("")}</div>` : '<p class="empty">По этим фильтрам скинов нет.</p>');
  $("#skinRarityFilter").value = skinFilters.rarity;
  $("#skinCollectionFilter").value = skinFilters.collection;
  $("#skinSortBy").value = skinFilters.sort;
  $("#skinNameFilter").oninput = e => { skinFilters.name = e.target.value; renderSkinInventory(); const el = $("#skinNameFilter"); el.focus(); el.setSelectionRange(el.value.length, el.value.length); };
  $("#skinRarityFilter").onchange = e => { skinFilters.rarity = e.target.value; renderSkinInventory(); };
  $("#skinCollectionFilter").onchange = e => { skinFilters.collection = e.target.value; renderSkinInventory(); };
  $("#skinSortBy").onchange = e => { skinFilters.sort = e.target.value; renderSkinInventory(); };
  $("#skinSortReverse").onclick = () => { skinFilters.reverse = !skinFilters.reverse; renderSkinInventory(); };
}
$("#feedBtn").onclick = async () => {
  if (telCheck()) return setMsg("#telMsg", "warning", "Телифон умер. Сначала воскреси его", "✕");
    if (tele.last === today()) return setMsg("#telMsg", "info", "Телифон уже сыт. Возвращайся завтра", "✦", 3000);
  const l = uniq(inv.filter(x => x.p === 3 && !x.x));
  if (!l.length) return setMsg("#telMsg", "warning", "Нужно полное читаемое расписание — собери или расшифруй в инвентаре", "!");
  const v = await choose("Чем кормим телифон?", l.map(e => ({ html: optHTML(e.it, e.n), val: e.it })));
  if (!v) return;
  take(v); tele.coins += FEED_REWARD; tele.last = today(); save(); renderTele(); setMsg("#telMsg", "success", `Ням! +${FEED_REWARD} телифокоин`, "✦");
};
function renderCollectionCases() {
  const host = $("#collectionCases");
  if (!host) return;
  host.innerHTML = COLLECTION_CASES.map(c => {
    const sorted = [...c.rewards].sort((a, b) => (RI[a.rarity] ?? 99) - (RI[b.rarity] ?? 99));
    return `<article class="collection-case glass">
      <img src="${esc(c.image)}" alt="" class="collection-cover">
      <div class="collection-copy"><b>${esc(c.name)}</b><small>${c.rewards.length} скинов · ${c.price} телифокоинов</small></div>
      <button class="btn glass green small" data-open-collection="${esc(c.id)}">Открыть</button>
      <div class="collection-rewards">${sorted.map(r => `<div class="collection-reward rarity-${r.rarity}" style="--c:${COL[r.rarity]}" data-skin-id="${esc(r.id)}" role="button" tabindex="0"><img src="${esc(r.img)}" alt=""><span>${esc(r.name)}</span><small>${RN[r.rarity]} · ${r.chance}%</small></div>`).join("")}</div>
    </article>`;
  }).join("");
}
$("#chestBtn").onclick = () => { renderCollectionCases(); $("#collectionCases").scrollIntoView({ behavior: "smooth", block: "start" }); };
$("#collectionCases").onclick = e => {
  const reward = e.target.closest("[data-skin-id]");
  if (reward) {
    const skin = collectionSkin(reward.dataset.skinId);
    if (skin) showSkinViewer(skin);
    return;
  }
  const button = e.target.closest("[data-open-collection]");
  if (!button) return;
  const c = COLLECTION_CASES.find(x => x.id === button.dataset.openCollection);
  if (c) showCollectionOpening(c.id);
};

$("#collectionCases").addEventListener("keydown", e => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const reward = e.target.closest("[data-skin-id]");
  if (!reward) return;
  e.preventDefault();
  const skin = collectionSkin(reward.dataset.skinId);
  if (skin) showSkinViewer(skin);
});

/* ================= COLLECTION CASE OPENING (roulette) ================= */

function colTrackMetrics() {
  const track = $("#collectionOpenTrack");
  if (!colCards[0]) return { cardWidth: 94, gap: 13, pitch: 107 };
  const cardWidth = colCards[0].offsetWidth;
  const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 13;
  return { cardWidth, gap, pitch: cardWidth + gap };
}

function pickColWinner(rewards, caseId) {
  const dropped = collectionDropped[caseId] || [];
  const pool = rewards.filter(r => !dropped.includes(r.id));
  if (!pool.length) return null;

  const w = {}; let fixed = 0;
  pool.forEach(r => {
    if (r.rarity !== "common") {
      w[r.id] = Math.max(0, Number(r.chance) || 0);
      fixed += w[r.id];
    }
  });
  const commons = pool.filter(r => r.rarity === "common");
  if (commons.length) {
    const remaining = Math.max(0, 100 - fixed);
    commons.forEach(r => w[r.id] = remaining / commons.length);
  } else {
    const total = pool.reduce((s, r) => s + (w[r.id] || 0), 0) || 1;
    pool.forEach(r => w[r.id] = (w[r.id] || 1) / total);
  }

  const total = Object.values(w).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (const r of pool) {
    roll -= w[r.id];
    if (roll < 0) return r;
  }
  return pool[pool.length - 1];
}

function buildColTrack(rewards) {
  const track = $("#collectionOpenTrack");
  track.innerHTML = ""; colCards = [];
  for (let i = 0; i < COL_N; i++) {
    const r = (i === COL_WIN && colWinner) ? colWinner : rewards[rnd(rewards.length)];
    const c = document.createElement("div");
    c.className = "card";
    c.style.setProperty("--c", COL[r.rarity]);
    c.innerHTML = `<img src="${esc(r.img)}" alt=""><b>${esc(r.name)}</b>`;
    track.append(c); colCards.push(c);
  }
}

function setColWinnerCard(reward) {
  const c = colCards[COL_WIN];
  if (!c || !reward) return;
  c.style.setProperty("--c", COL[reward.rarity]);
  c.innerHTML = `<img src="${esc(reward.img)}" alt=""><b>${esc(reward.name)}</b>`;
}

function colPlace(scroll) {
  const strip = $("#collectionStrip");
  const track = $("#collectionOpenTrack");
  if (!strip || !track) return;
  const w = strip.clientWidth;
  const { cardWidth, pitch } = colTrackMetrics();
  track.style.transform = `translate3d(${w / 2 - cardWidth / 2 - scroll}px,0,0)`;
  for (let i = 0; i < COL_N; i++) {
    const d = i * pitch - scroll;
    if (Math.abs(d) > w / 2 + cardWidth) continue;
    const near = Math.max(0, 1 - Math.abs(d) / (pitch * 1.6));
    colCards[i].style.transform = `scale(${0.8 + 0.4 * near})`;
    colCards[i].style.opacity = Math.max(0.4, 1 - Math.abs(d) / (w / 2));
  }
}

function spinCollection() {
  if (colSpinning) return;
  colSpinning = true;
  const id = ++colSpinId;
  const dur = colFastSpin ? 1100 : 5000 + Math.random() * 2000;
  const t0 = performance.now();
  const pitch = colTrackMetrics().pitch;
  const startScroll = COL_START * pitch;
  const endScroll = COL_WIN * pitch;
  const travel = endScroll - startScroll;
  navigator.vibrate?.(15);
  (function frame(now) {
    if (id !== colSpinId) return;
    const p = Math.min(1, (now - t0) / dur);
    colPlace(startScroll + ease(p) * travel);
    if (p < 1) return requestAnimationFrame(frame);
    colPlace(endScroll);
    setTimeout(() => { if (id === colSpinId) colFinish(); }, 450);
  })(t0);
}

function colFinish() {
  colSpinning = false;
  const reward = colWinner, c = colCurrentCase;
  if (!reward || !c) return;
  if (tele.coins < c.price) return;
  tele.coins -= c.price;
  tele.skins.push(reward.id);

  const droppedBefore = collectionDropped[c.id] || [];
  const wouldBeDropped = [...droppedBefore, reward.id];
  const commons = c.rewards.filter(r => r.rarity === "common");
  const wasReset = commons.length > 0 && commons.every(r => wouldBeDropped.includes(r.id));
  recordColDrop(c.id, reward.id, c.rewards);

  save();

  const lbl = $("#collectionResultLabel");
  lbl.textContent = `${reward.name} • ${RN[reward.rarity]}`;
  lbl.style.color = COL[reward.rarity];

  $("#collectionResultPanel").innerHTML = `
  <div class="schedule-meta">
    <div class="schedule-meta-title">
      <span class="eyebrow">TELIFON SKIN DROP</span>
      <strong>${esc(reward.name)}</strong>
      <small>${esc(c.name)}</small>
    </div>
    <div class="wk">${RN[reward.rarity]}</div>
  </div>
  <div class="collection-result-visual" style="--c:${COL[reward.rarity]}">
    <img src="${esc(reward.img)}" alt="">
  </div>
  <p class="collection-result-description">${esc(reward.description || "Коллекционный скин для телифона.")}</p>
  ${wasReset ? `<p class="collection-result-note">✦ Все Common выпали — кейс обновлён</p>` : ""}
`;

  const btn = $("#collectionOpenBtn");
  btn.innerHTML = `<span class="btn-star">✦</span><span class="btn-main">Открыть ещё раз<small>за ${c.price} телифокоинов</small></span>`;
  btn.disabled = tele.coins < c.price;

  $("#collectionOpening").classList.remove("active");
  $("#collectionResult").classList.add("active");
  renderTele();
  navigator.vibrate?.([20, 40, 20]);
}
$("#petNameInput").oninput = e => { tele.name = e.target.value.slice(0, 16); save(); };
function spawnFloatCoin(x, y) {
  const pet = $("#pet");
  if (!pet) return;
  if (x == null || y == null) {
    const r = pet.getBoundingClientRect();
    x = r.left + r.width / 2;
    y = r.top + r.height / 2;
  }
  const c = document.createElement("div");
  c.className = "float-coin";
  c.style.left = x + "px";
  c.style.top = y + "px";
  c.style.setProperty("--dx", (Math.random() - 0.5) * 60 + "px");
  c.innerHTML = '<img src="assets/coin.svg" alt="">';
  document.body.append(c);
  setTimeout(() => c.remove(), 950);
}

$("#pet").onclick = e => {
  const now = Date.now();
  if (now - lastTapAt < TAP_COOLDOWN) { setMsg("#telTapMsg", "warning", "Не так быстро! Подожди мгновение", "!", 1000); return; }
  lastTapAt = now; coins += 1;

  spawnFloatCoin(e.clientX, e.clientY);

  const pet = $("#pet");
  pet.classList.remove("tap-pop");
  void pet.offsetWidth;
  pet.classList.add("tap-pop");
  setTimeout(() => pet.classList.remove("tap-pop"), 260);

  save(); renderTele(); setMsg("#telTapMsg", "success", "+1 шышиш", "✦", 1000);
};

$("#reviveBtn").onclick = async () => {
  if (coins < REVIVE_COST) return setMsg("#telMsg", "warning", `Нужно ${REVIVE_COST} шышиш, у тебя ${coins}`, "!");
  if (!await choose(`Воскресить телифон за ${REVIVE_COST} шышиш?`, [{ html: "Воскресить", val: 1 }])) return;
  coins -= REVIVE_COST; tele.last = ""; tele.born = today(); save(); renderTele(); setMsg("#telMsg", "success", "Телифон ожил! Корми его хотя бы раз в день", "✦");
};
$("#skinGrid").onclick = async e => {
  const b = e.target.closest("[data-id]"); if (!b) return;
  const k = skinOf(b.dataset.id); if (!k) return;
  const curSkin = tele.skin || "default";
  const choices = [];
  if (curSkin !== k.id) choices.push({ html: "Использовать", val: "use" });
  else choices.push({ html: "Снять скин", val: "unequip" });
  if (k.id !== "default") choices.push({ html: `Продать за ${SKIN_PRICE} шышиш`, val: "sell" });
  const a = await choose(
    `${k.name} · ${RN[k.rarity] || "Обычный"}`,
    choices,
    k.description || "Коллекционный скин для телифона.",
    k.img
  );
  if (a === "use") tele.skin = k.id;
  if (a === "unequip") tele.skin = "default";
  if (a === "sell") { tele.skins.splice(tele.skins.indexOf(k.id), 1); coins += SKIN_PRICE; if (tele.skin === k.id && !tele.skins.includes(k.id)) tele.skin = null; }
  save(); renderTele();
  if (!tele.skins.includes("default")) tele.skins.unshift("default");
};
/* ================= PROFILE ================= */
function renderProfile() {
  $("#avatar").innerHTML = `<img src="${st.avatar}" alt="">`;
  const ra = $("#railAvatarImg");
  if (ra) ra.src = st.avatar;
  $("#name").value = st.name; say("#pGroup", `Группа: ${st.group ?? "—"}`);
  const h = $("#history"); h.innerHTML = "";
  if (!st.history.length) { h.innerHTML = '<p class="empty">Пока пусто</p>'; return; }
  st.history.forEach((r, i) => {
    const row = document.createElement("div"); row.className = "glass row"; row.style.setProperty("--row-i", i);
    const a = document.createElement("span"), b = document.createElement("small");
    a.textContent = `${r.g} • ${DAYS[r.d][0]} • ${RN[r.r]} • ${PARTS[r.p]}`; a.style.color = COL[r.r];
    b.textContent = new Date(r.t).toLocaleString("ru", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    row.append(a, b); h.append(row);
  });
}
$("#avatar").onclick = () => { st.avatar = AVATARS[(AVATARS.indexOf(st.avatar) + 1) % AVATARS.length]; store.set("avatar", st.avatar); renderProfile(); };
$("#name").oninput = e => { st.name = e.target.value; store.set("name", st.name); };
/* ================= START ================= */
Object.keys(rounds).forEach(k => { const r = rounds[k]; if (!k.includes(":") || !r.rar || !Array.isArray(r.list) || !r.list.every(g => GROUPS.includes(g))) delete rounds[k]; });
if (st.group) activeDept = deptForGroup(st.group).id;
renderCases();
showTab("home");
openPicker();
loadSchedules().then(() => { renderCases(); save(); }).catch(err => console.warn("Не удалось загрузить часть расписаний", err));
/* ================= COLLECTION OPENING (stage + result) ================= */
function showCollectionOpening(id) {
  const c = COLLECTION_CASES.find(x => x.id === id); if (!c) return;
  const stage = $("#collectionOpening"); if (!stage) return;
  colSpinning = false; colSpinId++;
  colCurrentCase = c;
  colWinner = null;
  stage.dataset.case = id;
  $("#collectionOpenTitle").textContent = c.name;

  const available = ensureCollectionPool(c);
  const dropped = collectionDropped[c.id] || [];
  const sorted = [...c.rewards].sort((a, b) => (RI[a.rarity] ?? 99) - (RI[b.rarity] ?? 99));
  $("#collectionOpenDrops").innerHTML = sorted.map(r => {
    const gone = dropped.includes(r.id);
    return `<article class="glass drop rarity-${r.rarity}${gone ? " out" : ""}" style="--c:${COL[r.rarity]}"><div class="drop-visual"><img src="${esc(r.img)}" alt=""><span class="drop-glint"></span></div><span class="drop-group">${esc(r.name)}</span><small class="drop-rarity">${RN[r.rarity]}</small></article>`;
  }).join("");
  $("#collectionDropCount").textContent = `${String(available.length).padStart(2, "0")} ДОСТУПНО`;

  if (tele.coins < c.price) {
    setMsg("#collectionOpenHint", "warning", "Покорми телифон полным расписанием, чтобы получить телифокоины", "!");
  } else {
    $("#collectionOpenHint").innerHTML = "";
  }
  const btn = $("#collectionOpenBtn");
  btn.innerHTML = `<span class="btn-star">✦</span><span class="btn-main">Открыть коллекцию<small>за ${c.price} телифокоинов</small></span>`;
  btn.disabled = tele.coins < c.price || available.length === 0;
  $("#collectionResult").classList.remove("active");
  $("#telifon").classList.remove("active");
  stage.classList.add("active");
  requestAnimationFrame(() => {
    buildColTrack(c.rewards);
    colPlace(COL_START * colTrackMetrics().pitch);
  });
}

function closeCollectionOpening() {
  $("#collectionOpening").classList.remove("active");
  $("#collectionResult").classList.remove("active");
  showTab("telifon");
}

$("#collectionOpenBack").onclick = closeCollectionOpening;

$("#collectionFastSpinBtn").onclick = () => {
  colFastSpin = !colFastSpin;
  $("#collectionFastSpinBtn").textContent = `Быстрая прокрутка: ${colFastSpin ? "вкл." : "выкл."}`;
  $("#collectionFastSpinBtn").classList.toggle("green", colFastSpin);
};

$("#collectionOpenBtn").onclick = () => {
  const stage = $("#collectionOpening");
  const c = COLLECTION_CASES.find(x => x.id === stage.dataset.case);
  if (!c || colSpinning) return;
  if (tele.coins < c.price) {
    setMsg("#collectionOpenHint", "warning", "Покорми телифон полным расписанием, чтобы получить телифокоины", "!");
    return;
  }
  colCurrentCase = c;
  ensureCollectionPool(c);
  colWinner = pickColWinner(c.rewards, c.id);
  if (!colWinner) {
    setMsg("#collectionOpenHint", "warning", "Все скины уже выпали. Кейс обновится, когда выпадут все Common", "!");
    return;
  }
  setColWinnerCard(colWinner);
  $("#collectionOpenHint").innerHTML = "";
  const btn = $("#collectionOpenBtn");
  btn.innerHTML = '<span class="btn-star">✦</span><span class="btn-main">Открытие...</span>';
  btn.disabled = true;
  requestAnimationFrame(() => {
    colPlace(COL_START * colTrackMetrics().pitch);
    requestAnimationFrame(() => spinCollection());
  });
};

function recordColDrop(caseId, skinId, rewards) {
  if (!collectionDropped[caseId]) collectionDropped[caseId] = [];
  if (!collectionDropped[caseId].includes(skinId)) collectionDropped[caseId].push(skinId);
  const commons = rewards.filter(r => r.rarity === "common");
  const allCommonsDropped = commons.length > 0 && commons.every(r => collectionDropped[caseId].includes(r.id));
  if (allCommonsDropped) delete collectionDropped[caseId];    // сброс
  store.set("collectionDropped", collectionDropped);
}

function ensureCollectionPool(c) {
  const dropped = collectionDropped[c.id] || [];
  const available = c.rewards.filter(r => !dropped.includes(r.id));
  if (available.length === 0 && c.rewards.length > 0) {
    delete collectionDropped[c.id];
    store.set("collectionDropped", collectionDropped);
    return c.rewards;
  }
  return available;
}

$("#collectionResultBack").onclick = () => {
  const c = colCurrentCase;
  $("#collectionResult").classList.remove("active");
  if (c) showCollectionOpening(c.id);
  else showTab("telifon");
};

$("#collectionResultAgain").onclick = () => {
  const c = colCurrentCase;
  if (!c) return;
  $("#collectionResult").classList.remove("active");
  showCollectionOpening(c.id);
  requestAnimationFrame(() => {
    if (tele.coins >= c.price) $("#collectionOpenBtn").click();
  });
};

/* ================= SKIN VIEWER ================= */
function showSkinViewer(skin) {
  if (!skin) return;
  const v = $("#skinViewer"), body = $("#skinViewerBody");
  const color = COL[skin.rarity] || "#ffffff";
  body.innerHTML = `
    <div class="collection-result-visual" style="--c:${color}">
      <img src="${esc(skin.img)}" alt="">
    </div>
    <h2>${esc(skin.name)}</h2>
    <p class="skin-viewer-rarity" style="color:${color}">${RN[skin.rarity] || "Обычный"}</p>
    <p class="collection-result-description">${esc(skin.description || "Коллекционный скин для телифона.")}</p>
  `;
  v.classList.add("open");
}

$("#skinViewerClose").onclick = () => $("#skinViewer").classList.remove("open");
$("#skinViewer").onclick = e => { if (e.target.id === "skinViewer") $("#skinViewer").classList.remove("open"); };

/* ================= INFO & WELCOME ================= */
const INFO_CONTENT = {
  home: {
    title: "Главная — кейсы расписаний",
    html: `
      <h3>Как открыть кейс</h3>
      <ul>
        <li>Группа выбирается при первом заходе или через «Настройки».</li>
        <li><b>Категории сверху</b> — это объединенные направления. У каждого свой пул групп.</li>
        <li><b>Плитка дня недели</b> — это и есть кейс. Нажми, чтобы открыть.</li>
      </ul>
      <h3>Что выпадает</h3>
      <ul>
        <li>Расписание случайной группы объединенных направлений на выбранный день.</li>
        <li>Оно может быть <b>частью</b> (верх, середина (при наличии), низ) или <b>полным</b> — если у дня меньше 3 пар.</li>
        <li>Открытие стоит <b>10 шышиш</b>.</li>
      </ul>
      <h3>Круг прогресса</h3>
      <p>В левом верхнем углу плитки — сколько частей расписания <b>твоей группы</b> за этот день уже собрано (например, 2/3). Когда есть все части или полное расписание — круг становится зелёным с ✓.</p>
    `
  },
  profile: {
    title: "Профиль игрока",
    html: `
      <h3>Аватар</h3>
      <p>Клик по изображению — переключает на следующий из готовых вариантов. Смена сохраняется.</p>
      <h3>Имя</h3>
      <p>Введи любое имя до 24 символов — оно отображается в боковом меню и в твоих подписях.</p>
      <h3>История круток</h3>
      <p>Последние <b>50</b> открытий кейсов расписаний с датой и редкостью. История сохраняется локально в браузере.</p>
    `
  },
  spin: {
    title: "Открытие кейса расписания",
    html: `
      <h3>Редкости и шансы</h3>
      <ul>
        <li>Каждая группа в кейсе имеет редкость: <b>Common</b>, <b>Rare</b>, <b>Mythic</b>, <b>Legendary</b>.</li>
        <li>Примерные шансы: Rare ~10%, Mythic ~5%, Legendary ~1%, остальное — Common.</li>
      </ul>
      <h3>Что выпадает</h3>
      <ul>
        <li>Случайная <b>часть</b> расписания выпавшей группы: верх, середина (при наличии) или низ (или полное — для коротких дней).</li>
        <li><b>15%</b> шанс — расписание «зашифровано», прочитать можно в инвентаре за <b>10 шышиш</b>.</li>
      </ul>
      <h3>Сброс кейса</h3>
      <ul>
        <li>Одно и то же расписание <b>не может выпасть дважды</b>, пока кейс не сброшен.</li>
        <li>Когда выпадают все <b>Common</b> — кейс сбрасывается, и пул начинается заново.</li>
      </ul>
    `
  },
  inventory: {
    title: "Инвентарь",
    html: `
      <h3>Что здесь</h3>
      <ul>
        <li>Все выбитые расписания — части и полные.</li>
        <li>Зашифрованные помечены <b>замком</b> — их можно расшифровать за 10 шышиш.</li>
      </ul>
      <h3>Как собирать расписание</h3>
      <ul>
        <li>Нажми на часть → если у тебя уже есть все нужные части для этой группы+дня, появится кнопка <b>«Собрать расписание»</b>.</li>
        <li>Полное расписание идёт на корм телифону, в Контракты и в Upgrader.</li>
      </ul>
      <h3>Круг прогресса</h3>
      <p>Слева вверху — <b>X/N</b>: сколько частей этого расписания у тебя уже есть (N — сколько нужно всего: 2 для коротких дней, 3 для длинных). Полное расписание показывается без бейджа.</p>
      <h3>Сортировки</h3>
      <p>Кнопки сверху: по редкости, группе, алфавиту, цене, дню недели.</p>
    `
  },
  upgrader: {
    title: "Upgrader",
    html: `
      <h3>Как работает</h3>
      <ul>
        <li>Слева — расписание, которое улучшаем (<b>источник</b>).</li>
        <li>Справа — какое расписание хотим получить (<b>цель</b>), из групп того же дня.</li>
        <li>Шанс успеха показан в центре и зависит от разницы редкостей и редкости цели. Чем выше цель — тем ниже шанс.</li>
      </ul>
      <h3>Ограничения</h3>
      <ul>
        <li>В источнике — только <b>полное</b> читаемое расписание (не зашифрованное).</li>
        <li><b>Legendary → Legendary</b> запрещено.</li>
      </ul>
      <h3>Результат</h3>
      <p>Успех — в инвентарь попадает <b>полное</b> расписание цели (случайный день). Неудача — источник <b>сгорает</b>.</p>
    `
  },
  contracts: {
    title: "Контракты",
    html: `
      <h3>Что нужно</h3>
      <ul>
        <li><b>10 одинаковых</b> полных расписаний — Common или Rare, той же группы и дня.</li>
        <li>Все должны быть читаемыми (не зашифрованными).</li>
      </ul>
      <h3>Что получишь</h3>
      <p>Одно расписание следующей редкости (<b>Common → Rare</b>, <b>Rare → Mythic</b>) — случайной группы и случайного дня.</p>
      <h3>Подпись</h3>
      <p>Нарисуй что угодно в поле подписи (даже точку) — без подписи контракт не засчитается.</p>
      <p class="info-muted">Секрет: набери на клавиатуре волшебную комбинацию — текст подписи изменится!</p>
    `
  },
  telifon: {
    title: "Телифон и коллекции",
    html: `
      <h3>Заработок шышиш</h3>
      <ul>
        <li><b>Тапай по телифону</b> → +1 шышиш (с небольшим кулдауном).</li>
        <li>Раз в день корми его <b>полным расписанием</b> → получаешь <b>+1 телифокоин</b>.</li>
        <li>Если не покормить день — телифон умрёт, телифокоины сгорят. Воскресить за <b>200 шышиш</b>.</li>
      </ul>
      <h3>Коллекции кейсов</h3>
      <ul>
        <li>Ниже — кейсы со скинами телифона. Открываются за <b>телифокоины</b>.</li>
        <li>Кликни на <b>миниатюру скина</b> — увидишь его крупно и прочитаешь описание.</li>
        <li>Кнопка «Открыть» перенаправляет на экран открытия коллекции.</li>
      </ul>
      <h3>Мои скины</h3>
      <ul>
        <li>Все выбитые скины. Их можно <b>использовать</b>, <b>снять</b> или <b>продать</b>.</li>
        <li>Стандартный скин продать нельзя.</li>
        <li>Фильтры: имя, редкость, коллекция. Сортировка по редкости / имени / коллекции.</li>
      </ul>
    `
  },
  collectionOpening: {
    title: "Открытие коллекции",
    html: `
      <h3>Как открыть</h3>
      <ul>
        <li>Стоимость указана прямо на кнопке «Открыть коллекцию».</li>
        <li>Оплата — <b>телифокоины</b>.</li>
      </ul>
      <h3>Что выпадает</h3>
      <ul>
        <li>Скин одной из редкостей коллекции — со своим шансом.</li>
        <li><b>Один и тот же скин не может выпасть дважды</b>, пока коллекция не сброшена.</li>
        <li>Когда выпадают все <b>Common</b>-скины — коллекция сбрасывается.</li>
      </ul>
      <h3>После открытия</h3>
      <p>Показывается крупное превью скина с описанием. Скин сразу попадает в «Мои скины» на экране Телифона.</p>
    `
  }
};

function currentInfoKey() {
  if ($("#collectionOpening")?.classList.contains("active")) return "collectionOpening";
  if ($("#spin")?.classList.contains("active")) return "spin";
  if ($("#inventory")?.classList.contains("active")) return "inventory";
  if ($("#telifon")?.classList.contains("active")) return "telifon";
  if ($("#upgrader")?.classList.contains("active")) return "upgrader";
  if ($("#contracts")?.classList.contains("active")) return "contracts";
  if ($("#profile")?.classList.contains("active")) return "profile";
  return "home";
}

function showInfo() {
  const content = INFO_CONTENT[currentInfoKey()];
  if (!content) return;
  $("#infoTitle").textContent = content.title;
  $("#infoBody").innerHTML = content.html;
  $("#infoModal").classList.add("open");
}
$("#infoBtn").onclick = showInfo;
$("#infoModalClose").onclick = () => $("#infoModal").classList.remove("open");
$("#infoModal").onclick = e => { if (e.target.id === "infoModal") $("#infoModal").classList.remove("open"); };

function showWelcome() { $("#welcomeModal").classList.add("open"); }
$("#welcomeClose").onclick = () => $("#welcomeModal").classList.remove("open");
$("#welcomeOk").onclick = () => $("#welcomeModal").classList.remove("open");
$("#welcomeModal").onclick = e => { if (e.target.id === "welcomeModal") $("#welcomeModal").classList.remove("open"); };
$("#howToPlayBtn").onclick = showWelcome;

/* показ welcome при повторном заходе, если ещё не видел */
if (st.group && !store.get("welcomeShown", false)) {
  store.set("welcomeShown", true);
  setTimeout(() => showWelcome(), 600);
}
document.body.classList.toggle("has-group", !!st.group);