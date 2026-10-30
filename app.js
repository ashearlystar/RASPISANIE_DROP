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
const IMG = { doc: "assets/doc.svg", check: "assets/check.svg" };
const CASE_IMG = ["assets/case_pn.png", "assets/case_vt.png", "assets/case_sr.png", "assets/case_cht.png", "assets/case_pt.png", "assets/case_sb.png"];
const CASE_SIZE = 8;     // schedules inside one case (chosen group + CASE_SIZE-1 random others)
const WEEK_ANCHOR = "2026-10-26";
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
let inv = store.get("inv", []), coins = store.get("coins", 0);
const save = () => {
  store.set("rounds", rounds); store.set("inv", inv);
  store.set("coins", coins); store.set("hist2", st.history); $("#coins").textContent = coins;
};
const say = (id, t) => $(id).textContent = t;
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
const same = (a, b) => a.g === b.g && a.d === b.d && a.r === b.r && a.p === b.p;
const count = it => inv.filter(x => same(x, it)).length;
function take(it, n = 1) { for (let i = 0; i < n; i++) { const k = inv.findIndex(x => same(x, it)); if (k >= 0) inv.splice(k, 1); } }
const price = it => {
  const k = sizes(cnt(it.g, it.d)).length;
  return Math.max(1, Math.floor(PRICE[it.r] * (it.p === 3 ? FULL_K[k] : PIECE_K[k])));
};
const label = it => `${it.g} · ${DAYS[it.d][0]} · ${PARTS[it.p]}`;
const inner = (it, n) => `<img src="${IMG.doc}" alt=""><b>${it.g}</b><small>${DAYS[it.d][0]} · ${PARTS[it.p]}</small><small>${RN[it.r]}${n > 1 ? ` ×${n}` : ""}</small>`;
const optHTML = (it, n) => `<span style="color:${COL[it.r]}">${label(it)}</span><small>${RN[it.r]}${n > 1 ? ` ×${n}` : ""}</small>`;
function uniq(list) {
  const m = new Map();
  list.forEach(x => { const k = [x.g, x.d, x.r, x.p].join("|"); m.has(k) ? m.get(k).n++ : m.set(k, { it: x, n: 1 }); });
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
function slotHTML(sl, cw) {
  const dim = w => w && w !== cw ? " dim" : "";
  const full = [], side = [[], [], []];
  sl.items.forEach(x => itemCells(x).forEach(c => (c.side == null ? full : side[c.side]).push(c)));
  const card = c => `<div class="lesson-main"><span class="lesson-subject">${esc(c.subject)}</span><small class="lesson-meta">${c.room ? `<span class="room-tag">${esc(c.room)}</span>` : ""}${c.week ? `<span class="week-tag">${WK[c.week]}</span>` : ""}</small></div>`;
  let html = full.map(c => `<article class="les lesson-card${dim(c.week)}"><b class="lesson-number">${esc(sl.num)}</b>${card(c)}</article>`).join("");
  if (side.some(a => a.length)) {
    const count = side[2].length ? 3 : 2;
    const col = (arr, n) => arr.length
      ? arr.map(c => `<div class="cell${dim(c.week)}"><div class="lb">Подгруппа ${n}${c.week ? " · " + WK[c.week] : ""}</div><div class="t">${esc(c.subject)}</div>${c.room ? `<div class="rm">${esc(c.room)}</div>` : ""}</div>`).join("")
      : `<div class="cell ghost"><div class="lb">Подгруппа ${n}</div><div class="t">нет пары</div></div>`;
    html += `<article class="les sub lesson-card split-card" style="--sub-count:${count}"><b class="lesson-number">${esc(sl.num)}</b><div class="subgroup-grid">${side.slice(0, count).map((arr, i) => `<div class="col">${col(arr, i + 1)}</div>`).join("")}</div></article>`;
  }
  return html;
}
function lessonsHTML(g, d, p) {
  const slots = slotsOf(g, d);
  if (!slots) return `<div class="schedule-empty"><span class="empty-mark">⌁</span><strong>Расписание ещё не заполнено</strong><p>${location.protocol === "file:" ? "Открой сайт через локальный сервер, чтобы загрузить данные." : "Для этой группы пока нет опубликованных пар на выбранный день."}</p></div>`;
  const part = partSlots(g, d, p);
  if (!part.length) return '<div class="schedule-empty"><span class="empty-mark">✓</span><strong>На этот день пар нет</strong><p>Можно выдохнуть — свободный день.</p></div>';
  const cw = weekType();
  return `<div class="schedule-meta"><div class="schedule-meta-title"><span class="eyebrow">SCHEDULE DROP</span><strong>${esc(g)} <i>·</i> ${DAYS[d][1]}</strong><small>${PARTS_L[p]}</small></div><div class="wk"><span class="week-dot"></span>${WK_FULL[cw]}</div></div><div class="lesson-list">${part.map(sl => slotHTML(sl, cw)).join("")}</div>`;
}
function choose(title, opts) {
  return new Promise(res => {
    const m = $("#modal"), box = m.querySelector(".list");
    m.querySelector("h2").textContent = title; box.innerHTML = "";
    const done = v => { m.classList.remove("open"); res(v); };
    opts.forEach(o => { const b = document.createElement("button"); b.className = "glass row opt"; b.innerHTML = o.html; b.onclick = () => done(o.val); box.append(b); });
    const x = document.createElement("button"); x.className = "glass row opt"; x.textContent = "Отмена"; x.onclick = () => done(null);
    box.append(x); m.classList.add("open");
  });
}
/* ================= NAVIGATION ================= */
let spinId = 0, spinning = false, curIdx = 0, winner = null, part = 0;
function showTab(tab) {
  $$(".screen").forEach(s => s.classList.toggle("active", s.id === tab));
  $$(".bar [data-tab]").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  const pageNames = { home: "Главная", inventory: "Коллекция", upgrader: "Upgrader", contracts: "Контрактный центр", profile: "Профиль игрока", settings: "Настройки" };
  const title = $("#pageTitle");
  if (title) title.textContent = pageNames[tab] || "Raspisanie Drop";
  const ru = $("#railUser"), rg = $("#railGroup");
  if (ru) ru.textContent = st.name || "Студент";
  if (rg) rg.textContent = st.group ? `Группа ${st.group}` : "Группа не выбрана";
  ({ profile: renderProfile, settings: renderSettings, inventory: renderInv, upgrader: resetUp, contracts: resetCt })[tab]?.();
}
const showStage = id => $$(".stage").forEach(s => s.classList.toggle("active", s.id === id));
function goHome() { spinId++; spinning = false; showTab("home"); showStage("cases"); }
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
  const pick = g => { setGroup(g); activeDept = deptForGroup(g).id; renderCases(); $("#picker").classList.remove("open"); goHome(); };
  if (search) search.value = "";
  renderGroupList(list, pick);
  if (search) search.oninput = () => renderGroupList(list, pick, search.value);
  $("#picker").classList.add("open");
}
const renderSettings = () => renderGroupList($("#groups"), g => { setGroup(g); activeDept = deptForGroup(g).id; renderSettings(); renderCases(); say("#pageTitle", "Настройки"); });
/* ================= CASES + SPIN ================= */
function renderCases() {
  const cats = $("#caseCategories");
  cats.innerHTML = DEPARTMENTS.map(d => `<button class="case-cat${d.id === activeDept ? " active" : ""}" data-dept="${d.id}"><span>${d.name}</span><small>${d.groups.length} направлений</small></button>`).join("");
  cats.querySelectorAll("[data-dept]").forEach(b => b.onclick = () => { activeDept = b.dataset.dept; renderCases(); });
  const dept = deptById(activeDept); $("#caseCategoryTitle").textContent = `${dept.name} · ${dept.groups.length} направлений`;
  $("#grid").innerHTML = DAYS.map((day, i) => `<button class="glass tint tile" data-i="${i}" data-dept="${dept.id}"><img class="chest" src="${CASE_IMG[i]}" alt=""><span class="tile-day">${day[1]}</span></button>`).join("");
  $("#grid").querySelectorAll(".tile").forEach(t => t.onclick = () => openCase(+t.dataset.i, t.dataset.dept));
  $("#teacherGrid").innerHTML = TEACHER_CASES.map((day, i) => `<button class="teacher-case" disabled><span class="teacher-placeholder">✦</span><b>${day}</b><small>Скоро</small></button>`).join("");
}
renderCases();
$("#backCases").onclick = () => { spinId++; spinning = false; btn.disabled = false; showStage("cases"); };
const N = 70, START = 4, WIN = 58;
const track = $("#track"), strip = $("#strip"), btn = $("#spinBtn");
let cards = [];
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
  activeDept = deptId; curIdx = i; cur = R(i, deptId);
  if (!poolList().length) cur = newRound(i, activeDept);
  winner = pickWinner(); const nd = needParts(winner, i); part = nd[rnd(nd.length)];          // each part 33.3%
  say("#spinLabel", `${deptById(deptId).name} · ${DAYS[i][1]}`);
  btn.disabled = false; spinning = false;
  buildTrack(); renderDrops(); showStage("spin");
  requestAnimationFrame(() => {
    place(START * trackMetrics().pitch);
    if (autoSpin) requestAnimationFrame(() => spin());
  });
}
function spin() {
  if (spinning) return;
  spinning = true; btn.disabled = true;
  const id = ++spinId, dur = 5000 + Math.random() * 2000, t0 = performance.now();
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
btn.onclick = spin;
$("#resultBackCase").onclick = () => {
  spinning = false;
  btn.disabled = false;
  showStage("spin");
};
$("#resultSpinAgain").onclick = () => openCase(curIdx, activeDept, true);
function finish() {
  $("#result").classList.remove("inventory-view");
  spinning = false;
  const it = { g: winner, d: curIdx, r: cur.rar[winner], p: part };
  inv.push(it);
  st.history.unshift({ ...it, t: Date.now() }); st.history = st.history.slice(0, 50);
  if (!cur.dropped.includes(winner)) cur.dropped.push(winner);
  let note = "";
  if (!cur.list.some(g => !cur.dropped.includes(g))) { newRound(curIdx, activeDept); note = "Кейс собран полностью — его содержимое обновлено"; }
  save();
  const lb = $("#resultLabel"); lb.textContent = `${it.g} • ${RN[it.r]} • ${PARTS_L[it.p]} • ${DAYS[it.d][0]}`; lb.style.color = COL[it.r];
  say("#resultNote", note); $("#panel").innerHTML = lessonsHTML(it.g, it.d, it.p);
  navigator.vibrate?.([20, 40, 20]); showStage("result");
}
/* ================= INVENTORY ================= */
let sortBy = "rarity", rev = false, view = [];
const SORTS = {
  rarity: ["Редкость", (a, b) => RI[a.r] - RI[b.r]],
  group: ["Группа", (a, b) => GROUPS.indexOf(a.g) - GROUPS.indexOf(b.g)],
  alpha: ["А–Я", (a, b) => label(a).localeCompare(label(b), "ru")],
  price: ["Цена", (a, b) => price(a) - price(b)]
};
function renderInv() {
  $("#sorts").innerHTML = Object.entries(SORTS).map(([k, [n]]) => `<button class="glass pill chipb${k === sortBy ? " on" : ""}" data-s="${k}">${n}</button>`).join("")
    + `<button class="glass pill chipb${rev ? " on" : ""}" data-s="rev">⇅ Обратно</button>`;
  view = uniq(inv).sort((a, b) => SORTS[sortBy][1](a.it, b.it) || label(a.it).localeCompare(label(b.it), "ru"));
  if (rev) view.reverse();
  $("#invGrid").innerHTML = view.length ? view.map((e, i) => `<button class="glass icard" data-i="${i}" style="--c:${COL[e.it.r]};--card-i:${i}">${inner(e.it, e.n)}</button>`).join("")
    : '<p class="empty">Пока пусто</p>';
}
$("#sorts").onclick = e => { const s = e.target.dataset.s; if (!s) return; s === "rev" ? rev = !rev : sortBy = s; renderInv(); };
$("#invGrid").onclick = e => { const b = e.target.closest("[data-i]"); if (b) itemMenu(view[+b.dataset.i].it); };
async function itemMenu(it) {
  const opts = [], have = p => inv.some(x => same(x, { ...it, p }));
  const need = needParts(it.g, it.d);
  if (it.p < 3 && need.every(have)) opts.push({ html: "Собрать расписание", val: "asm" });
  if (it.p === 3) opts.push({ html: "Открыть расписание", val: "view" });
  opts.push({ html: `Продать за ${price(it)} шышиш`, val: "sell" });
  const a = await choose(label(it), opts);
  if (a === "view") {
    $("#result").classList.add("inventory-view");
    showTab("home"); const lb = $("#resultLabel"); lb.textContent = `${it.g} • ${RN[it.r]} • ${DAYS[it.d][1]}`; lb.style.color = COL[it.r];
    say("#resultNote", ""); $("#panel").innerHTML = lessonsHTML(it.g, it.d, 3); return showStage("result");
  }
  if (a === "asm") { need.forEach(p => take({ ...it, p })); inv.push({ ...it, p: 3 }); }
  if (a === "sell") { take(it); coins += price(it); }
  save(); renderInv();
}
/* ================= UPGRADER ================= */
let upSrc = null, upDst = null, upBusy = false;
function upChance(s, t) {
  const d = RI[t] - RI[s];
  return Math.max(0, 1 - .24 - (d > 0 ? .25 * d : 0) - (FIX[t] || 0) * .75);
}
function resetUp() { upSrc = upDst = null; upBusy = false; paintUp(); say("#upMsg", ""); }
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
  const l = uniq(inv.filter(x => x.p === 3));
  if (!l.length) return say("#upMsg", "Нет полных расписаний — собери 3 части в инвентаре");
  const v = await choose("Что улучшаем?", l.map(e => ({ html: optHTML(e.it, e.n), val: e.it })));
  if (v) { upSrc = v; upDst = null; paintUp(); }
};
$("#upDst").onclick = async () => {
  if (upBusy) return;
  if (!upSrc) return say("#upMsg", "Сначала выбери расписание");
  const rr = R(upSrc.d, deptForGroup(upSrc.g).id), l = rr.list.filter(g => !(upSrc.r === "legendary" && rr.rar[g] === "legendary"));
  const v = await choose("Что хотим получить?", l.map(g => ({ html: `<span style="color:${COL[rr.rar[g]]}">${g}</span><small>${RN[rr.rar[g]]}</small>`, val: g })));
  if (v) { upDst = v; paintUp(); }
};
function spinWheel(roll) {
  return new Promise(resolve => {
    const t0 = performance.now(), duration = 4600, turns = 5, end = 360 * turns + roll * 360;
    const orbit = $("#ptrOrbit");
    if (!orbit) { setTimeout(resolve, 100); return; }
    orbit.style.transition = "none"; orbit.style.transform = "rotate(0deg)";
    requestAnimationFrame(() => requestAnimationFrame(() => {
      (function frame(now) {
        const p = Math.min(1, (now - t0) / duration), angle = ease(p) * end;
        orbit.style.transform = `rotate(${angle}deg)`;
        if (p < 1) requestAnimationFrame(frame);
        else setTimeout(resolve, 300);
      })(performance.now());
    }));
  });
}
$("#upGo").onclick = async () => {
  if (upBusy) return;
  if (!upSrc || !upDst) return say("#upMsg", "Выбери расписание и цель");
  const tr = R(upSrc.d, deptForGroup(upSrc.g).id).rar[upDst];
  if (upSrc.r === "legendary" && tr === "legendary") return say("#upMsg", "Legendary → Legendary нельзя");
  upBusy = true; say("#upMsg", "");
  const c = upChance(upSrc.r, tr), roll = Math.random(), src = upSrc, dst = upDst;
  take(src); save();
  await spinWheel(roll);
  const ok = roll < c;
  if (ok) inv.push({ g: dst, d: src.d, r: tr, p: 3 });
  save(); say("#upMsg", ok ? "Успех! Расписание в инвентаре" : "Неудача — расписание сгорело");
  upSrc = upDst = null; upBusy = false; paintUp();
};
/* ================= CONTRACTS ================= */
let ctSel = null, signed = false, drawing = false;
const sig = $("#sig"), cx = sig.getContext("2d"), INK = "#26336f";
function clearSig() { cx.clearRect(0, 0, sig.width, sig.height); signed = false; }
function resetCt() { ctSel = null; clearSig(); paintCt(); say("#ctMsg", ""); say("#sigLbl", "Ваша подпись"); }
function paintCt() {
  $("#ctSlots").innerHTML = Array.from({ length: 10 }, () =>
    `<div class="glass mini"${ctSel ? ` style="--c:${COL[ctSel.r]}"` : ""}>${ctSel ? inner(ctSel, 1) : ""}</div>`).join("");
  const o = $("#ctOut"); o.style.setProperty("--c", ctSel ? COL[NEXT[ctSel.r]] : "");
  o.innerHTML = ctSel ? `<img src="${IMG.doc}" alt=""><b>${ctSel.g}</b><small>${RN[NEXT[ctSel.r]]} · ?</small>` : "?";
}
$("#ctPick").onclick = async () => {
  const l = uniq(inv.filter(x => x.p === 3 && NEXT[x.r])).filter(e => e.n >= 10);
  if (!l.length) return say("#ctMsg", "Нужно 10 одинаковых полных расписаний (Common или Rare)");
  const v = await choose("10 одинаковых расписаний", l.map(e => ({ html: optHTML(e.it, e.n), val: e.it })));
  if (v) { ctSel = v; paintCt(); say("#ctMsg", ""); }
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
  if (!ctSel) return say("#ctMsg", "Сначала выбери расписания");
  if (!signed) return say("#ctMsg", "Поставь подпись — хотя бы точку");
  take(ctSel, 10);
  const it = { g: ctSel.g, d: rnd(DAYS.length), r: NEXT[ctSel.r], p: 3 };
  inv.push(it); save(); resetCt();
  say("#ctMsg", `Получено: ${label(it)} (${RN[it.r]})`);
};
let seq = "";
addEventListener("keydown", e => {
  if (!$("#contracts").classList.contains("active")) return;
  const ch = { KeyC: "с", KeyD: "в", KeyJ: "о" }[e.code];     // physical keys of С, В, О
  seq = (seq + (ch || "_")).slice(-3);
  if (seq === "сво") say("#sigLbl", "Согласен на контракт");
});
/* ================= PROFILE ================= */
function renderProfile() {
  $("#avatar").innerHTML = `<img src="${st.avatar}" alt="">`;
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
loadSchedules().then(() => { save(); }).catch(err => console.warn("Не удалось загрузить часть расписаний", err));
