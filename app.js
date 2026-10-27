/* ================= CONFIG ================= */
const DAYS = [["ПН","Понедельник"],["ВТ","Вторник"],["СР","Среда"],["ЧТ","Четверг"],["ПТ","Пятница"],["СБ","Суббота"]];
const GROUPS = ["608-31", "608-32", "608-41", "608-51", "608-61", "608-62", "609-31", "609-32", "609-41", "609-42", "609-51", "609-52", "609-61", "609-62"];    // TODO: from DB (6 groups = 1 Legendary + 3 Common + Rare + Mythic)
const PARTS = ["Верх","Середина","Низ","Полное"], PARTS_L = ["верхняя часть","средняя часть","нижняя часть"];
const RN  = {common:"Common", rare:"Rare", mythic:"Mythic", legendary:"Legendary"};
const COL = {common:"#D4D4D4", rare:"#00A0E0", mythic:"#FF00A0", legendary:"#ff9a1f"};
const RI  = {common:0, rare:1, mythic:2, legendary:3};
const FIX = {rare:.10, mythic:.05, legendary:.01};                  // fixed drop chances
const PRICE = {common:10, rare:15, mythic:20, legendary:70};        // шышиш
const DEFAULT_N = 5;     // pairs assumed for groups whose schedule file isn't filled yet
// price factors by number of parts in the day's schedule (1 / 2 / 3 parts)
const FULL_K = {1: .1, 2: .5, 3: 1}, PIECE_K = {2: .2, 3: 1 / 3};
const NEXT = {common:"rare", rare:"mythic"};                        // contracts (no Legendary)
const IMG = {doc:"assets/doc.svg", check:"assets/check.svg"};
// one icon per case, in order ПН..СБ (change .svg -> .png when you add your own)
const CASE_IMG = ["assets/case_pn.png","assets/case_vt.png","assets/case_sr.png","assets/case_cht.png","assets/case_pt.png","assets/case_sb.png"];
const CASE_SIZE = 8;     // schedules inside one case (chosen group + CASE_SIZE-1 random others)
// Numerator/denominator is counted from this date: put ANY MONDAY OF A NUMERATOR WEEK (YYYY-MM-DD).
// Weeks then alternate automatically (next Monday = denominator, and so on, also across New Year).
const WEEK_ANCHOR = "2026-10-26";
const AVATARS = ["assets/av1.svg","assets/av2.svg","assets/av3.svg","assets/av4.svg","assets/av5.svg","assets/av6.svg"];

/* ================= STATE ================= */
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
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

// new chest for day d: own random schedules + own rarities, chosen group = Legendary
function newRound(d) {
  const o = GROUPS.filter(g => g !== st.group).sort(() => Math.random() - .5).slice(0, CASE_SIZE - 1);
  const rar = {}; o.forEach(g => rar[g] = "common");          // 1-2 part schedules stay Common
  // Mythic / Rare: schedules with 3 parts and the most pairs that day (ties = random, list is shuffled)
  const cand = o.filter(g => sizes(cnt(g, d)).length === 3).sort((a, b) => cnt(b, d) - cnt(a, d));
  if (cand[0]) rar[cand[0]] = "mythic";
  if (cand[1]) rar[cand[1]] = "rare";
  rar[st.group] = "legendary";
  return rounds[d] = { list: [st.group, ...o].sort(() => Math.random() - .5), rar, dropped: [] };
}
const R = d => rounds[d] || newRound(d);
function setGroup(g) {
  if (g !== st.group) { st.group = g; rounds = {}; }
  st.group = g; store.set("group", g); save();
}

/* ================= DROP LOGIC ================= */
const poolList = () => cur.list.filter(g => !cur.dropped.includes(g));
// Legendary 1%, Mythic 5%, Rare 10% are constant while present; Commons share the rest equally
function weights() {
  const pool = poolList(), w = {}; let fixed = 0;
  pool.forEach(g => { const f = FIX[cur.rar[g]]; if (f) { w[g] = f; fixed += f; } });
  const cm = pool.filter(g => cur.rar[g] === "common");
  cm.forEach(g => w[g] = (1 - fixed) / cm.length);
  return w;
}
function pickWinner() {
  const e = Object.entries(weights()); let x = Math.random(), acc = 0;
  for (const [g, v] of e) { acc += v; if (x < acc) return g; }
  return e[e.length - 1][0];
}
function renderDrops() {
  $("#drops").innerHTML = cur.list.map(g => `<div class="glass drop${cur.dropped.includes(g) ? " out" : ""}" style="--c:${COL[cur.rar[g]]}">
    <img src="${IMG.doc}" alt=""><span>${g}</span><small>${RN[cur.rar[g]]}</small></div>`).join("");
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
    try { const r = await fetch(`data/${encodeURIComponent(g)}.json`); if (r.ok) SCH[g] = await r.json(); } catch {}
  }));
}
// lessons of a day grouped by pair number (ПН..СБ key); null = file/day not filled yet
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
// how many pairs go into each part
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
  const subj = String(x.subject).trim(), room = String(x.room || "").trim(), week = x.week;
  const clean = t => t.replace(/,?\s*п\/г\s*\d\s*$/i, "").trim();
  if (subj.includes("|")) {                                         // position decides: left = п/г 1, right = п/г 2
    const [a, b] = subj.split("|").map(t => t.trim()), rr = room.split("|").map(t => t.trim());
    const both = a && b, out = [];
    if (a) out.push({ side: 0, subject: clean(a), room: both ? (rr.length > 1 ? rr[0] : room) : (rr.find(Boolean) || ""), week });
    if (b) out.push({ side: 1, subject: clean(b), room: both ? (rr.length > 1 ? rr[1] : room) : (rr.find(Boolean) || ""), week });
    return out;
  }
  const n = (subj.match(/п\/г\s*(\d)/i) || [])[1];                  // single subgroup without "|": side by its label
  return [{ side: n === "1" ? 0 : n === "2" ? 1 : null, subject: clean(subj), room, week }];
}
function slotHTML(sl, cw) {
  const dim = w => w && w !== cw ? " dim" : "";                     // other week = more transparent
  const full = [], side = [[], []];
  sl.items.forEach(x => itemCells(x).forEach(c => (c.side == null ? full : side[c.side]).push(c)));
  let html = full.map(c => `<div class="les${dim(c.week)}"><b>${esc(sl.num)}</b><span>${esc(c.subject)}</span><small>${esc(c.room)}${c.week ? " · " + WK[c.week] : ""}</small></div>`).join("");
  if (side[0].length || side[1].length) {
    const col = (arr, n) => arr.length
      ? arr.map(c => `<div class="cell${dim(c.week)}"><div class="lb">Подгруппа ${n}${c.week ? " · " + WK[c.week] : ""}</div><div class="t">${esc(c.subject)}</div>${c.room ? `<div class="rm">${esc(c.room)}</div>` : ""}</div>`).join("")
      : `<div class="cell ghost"><div class="lb">Подгруппа ${n}</div><div class="t">нет пары</div></div>`;
    html += `<div class="les sub"><b>${esc(sl.num)}</b><div class="col">${col(side[0], 1)}</div><div class="col">${col(side[1], 2)}</div></div>`;
  }
  return html;
}
function lessonsHTML(g, d, p) {
  if (!slotsOf(g, d)) return `<p class="empty">Расписание ещё не заполнено${location.protocol === "file:" ? " (открой сайт через локальный сервер)" : ""}</p>`;
  const part = partSlots(g, d, p);
  if (!part.length) return '<p class="empty">Пар нет</p>';
  const cw = weekType();
  return `<div class="wk">Сейчас: ${WK_FULL[cw]}</div>` + part.map(sl => slotHTML(sl, cw)).join("");
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
  ({ profile: renderProfile, settings: renderSettings, inventory: renderInv, upgrader: resetUp, contracts: resetCt })[tab]?.();
}
const showStage = id => $$(".stage").forEach(s => s.classList.toggle("active", s.id === id));
function goHome() { spinId++; spinning = false; showTab("home"); showStage("cases"); }
$$(".bar [data-tab]").forEach(b => b.onclick = () => {
  if (b.dataset.tab === "home") return goHome();
  spinId++; spinning = false; showTab(b.dataset.tab);
});

/* ================= GROUP LIST ================= */
function renderGroupList(box, onPick) {
  box.innerHTML = "";
  GROUPS.forEach(g => {
    const sel = g === st.group, b = document.createElement("button");
    b.className = "glass row opt" + (sel ? " sel" : "");
    const n = document.createElement("span"); n.textContent = g; b.append(n);
    if (sel) { const c = document.createElement("img"); c.src = IMG.check; c.alt = ""; c.className = "chk"; b.append(c); }
    b.onclick = () => { navigator.vibrate?.(8); onPick(g); };
    box.append(b);
  });
}
function openPicker() {
  renderGroupList($("#pickList"), g => { setGroup(g); $("#picker").classList.remove("open"); goHome(); });
  $("#picker").classList.add("open");
}
const renderSettings = () => renderGroupList($("#groups"), g => { setGroup(g); renderSettings(); });

/* ================= CASES + SPIN ================= */
$("#grid").innerHTML = DAYS.map((_, i) =>
  `<button class="glass tint tile" data-i="${i}"><img class="chest" src="${CASE_IMG[i]}" alt=""></button>`).join("");
$$(".tile").forEach(t => t.onclick = () => openCase(+t.dataset.i));

const N = 70, START = 2, WIN = 58, CARD = 84, GAP = 14, P = CARD + GAP;
const track = $("#track"), strip = $("#strip"), btn = $("#spinBtn");
let cards = [];
const ease = t => { const sm = t * t * (3 - 2 * t), q = 1 - Math.pow(1 - t, 4); return sm * (1 - t) + q * t; };

function buildTrack() {
  const pool = poolList(); track.innerHTML = ""; cards = [];
  for (let i = 0; i < N; i++) {
    const g = i === WIN ? winner : pool[rnd(pool.length)], c = document.createElement("div");
    c.className = "card"; c.style.setProperty("--c", COL[cur.rar[g]]);
    c.innerHTML = `<img src="${IMG.doc}" alt=""><b></b>`; c.querySelector("b").textContent = g;
    track.append(c); cards.push(c);
  }
}
function place(scroll) {
  const w = strip.clientWidth;
  track.style.transform = `translateX(${w / 2 - CARD / 2 - scroll}px)`;
  for (let i = 0; i < N; i++) {
    const d = i * P - scroll;
    if (Math.abs(d) > w / 2 + CARD) continue;
    const near = Math.max(0, 1 - Math.abs(d) / (P * 1.6));
    cards[i].style.transform = `scale(${0.8 + 0.4 * near})`;
    cards[i].style.opacity = Math.max(0.4, 1 - Math.abs(d) / (w / 2));
  }
}
function openCase(i) {
  curIdx = i; cur = R(i); winner = pickWinner(); const nd = needParts(winner, i); part = nd[rnd(nd.length)];          // each part 33.3%
  say("#spinLabel", `${DAYS[i][1]} • ${st.group}`);
  btn.disabled = false; spinning = false;
  buildTrack(); renderDrops(); showStage("spin");
  requestAnimationFrame(() => place(START * P));
}
function spin() {
  if (spinning) return;
  spinning = true; btn.disabled = true;
  const id = ++spinId, dur = 5000 + Math.random() * 2000, t0 = performance.now();
  const travel = (WIN - START) * P + (Math.random() - 0.5) * CARD * 0.7;
  navigator.vibrate?.(15);
  (function frame(now) {
    if (id !== spinId) return;
    const p = Math.min(1, (now - t0) / dur);
    place(START * P + ease(p) * travel);
    if (p < 1) return requestAnimationFrame(frame);
    setTimeout(() => { if (id === spinId) finish(); }, 800);
  })(t0);
}
btn.onclick = spin;

function finish() {
  spinning = false;
  const it = { g: winner, d: curIdx, r: cur.rar[winner], p: part };
  inv.push(it);
  st.history.unshift({ ...it, t: Date.now() }); st.history = st.history.slice(0, 50);
  cur.dropped.push(winner);
  let note = "";
  if (!cur.list.some(g => !cur.dropped.includes(g) && cur.rar[g] === "common")) { newRound(curIdx); note = "Все Common выпали — прогресс сундука сброшен"; }
  save();
  const lb = $("#resultLabel"); lb.textContent = `${it.g} • ${RN[it.r]} • ${PARTS_L[it.p]} • ${DAYS[it.d][0]}`; lb.style.color = COL[it.r];
  say("#resultNote", note); $("#panel").innerHTML = lessonsHTML(it.g, it.d, it.p);
  navigator.vibrate?.([20, 40, 20]); showStage("result");
}

/* ================= INVENTORY ================= */
let sortBy = "rarity", rev = false, view = [];
const SORTS = {
  rarity: ["Редкость", (a, b) => RI[a.r] - RI[b.r]],
  group:  ["Группа",   (a, b) => GROUPS.indexOf(a.g) - GROUPS.indexOf(b.g)],
  alpha:  ["А–Я",      (a, b) => label(a).localeCompare(label(b), "ru")],
  price:  ["Цена",     (a, b) => price(a) - price(b)]
};
function renderInv() {
  $("#sorts").innerHTML = Object.entries(SORTS).map(([k, [n]]) => `<button class="glass pill chipb${k === sortBy ? " on" : ""}" data-s="${k}">${n}</button>`).join("")
    + `<button class="glass pill chipb${rev ? " on" : ""}" data-s="rev">⇅ Обратно</button>`;
  view = uniq(inv).sort((a, b) => SORTS[sortBy][1](a.it, b.it) || label(a.it).localeCompare(label(b.it), "ru"));
  if (rev) view.reverse();
  $("#invGrid").innerHTML = view.length ? view.map((e, i) => `<button class="glass icard" data-i="${i}" style="--c:${COL[e.it.r]}">${inner(e.it, e.n)}</button>`).join("")
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
    showTab("home"); const lb = $("#resultLabel"); lb.textContent = `${it.g} • ${RN[it.r]} • ${DAYS[it.d][1]}`; lb.style.color = COL[it.r];
    say("#resultNote", ""); $("#panel").innerHTML = lessonsHTML(it.g, it.d, 3); return showStage("result");
  }
  if (a === "asm") { need.forEach(p => take({ ...it, p })); inv.push({ ...it, p: 3 }); }
  if (a === "sell") { take(it); coins += price(it); }
  save(); renderInv();
}

/* ================= UPGRADER ================= */
let upSrc = null, upDst = null, upBusy = false;
// -24% for using it, -25% per skipped rarity (only upwards), -(fixed drop chance)*3/4
function upChance(s, t) {
  const d = RI[t] - RI[s];
  return Math.max(0, 1 - .24 - (d > 0 ? .25 * d : 0) - (FIX[t] || 0) * .75);
}
function resetUp() { upSrc = upDst = null; upBusy = false; paintUp(); say("#upMsg", ""); }
function paintUp() {
  const s = $("#upSrc"), d = $("#upDst");
  s.innerHTML = upSrc ? inner(upSrc, 1) : "+"; s.style.setProperty("--c", upSrc ? COL[upSrc.r] : "");
  const t = upDst && upSrc && { g: upDst, d: upSrc.d, r: R(upSrc.d).rar[upDst], p: 3 };
  d.innerHTML = t ? inner(t, 1) : "+"; d.style.setProperty("--c", t ? COL[t.r] : "");
  const c = upSrc && t ? upChance(upSrc.r, t.r) : null;
  say("#upPct", c == null ? "%?" : fmt(c));
  $("#wheel").style.background = c == null ? "#555" : `conic-gradient(#3ccf5a ${c * 360}deg,#e0452f 0)`;
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
  const rr = R(upSrc.d), l = rr.list.filter(g => !(upSrc.r === "legendary" && rr.rar[g] === "legendary"));
  const v = await choose("Что хотим получить?", l.map(g => ({ html: `<span style="color:${COL[rr.rar[g]]}">${g}</span><small>${RN[rr.rar[g]]}</small>`, val: g })));
  if (v) { upDst = v; paintUp(); }
};
function spinWheel(roll) {
  return new Promise(r => {
    const t0 = performance.now(), end = 360 * 5 + roll * 360;
    (function f(n) {
      const p = Math.min(1, (n - t0) / 5000);
      $("#ptr").style.transform = `rotate(${ease(p) * end}deg)`;
      p < 1 ? requestAnimationFrame(f) : setTimeout(r, 500);
    })(t0);
  });
}
$("#upGo").onclick = async () => {
  if (upBusy) return;
  if (!upSrc || !upDst) return say("#upMsg", "Выбери расписание и цель");
  const tr = R(upSrc.d).rar[upDst];
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
const sig = $("#sig"), cx = sig.getContext("2d"), INK = "#1636c9";
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
const pos = e => { const r = sig.getBoundingClientRect(); return [(e.clientX - r.left) * sig.width / r.width, (e.clientY - r.top) * sig.height / r.height,
  e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom]; };
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
// easter egg: С → В → О on the contracts screen
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
  st.history.forEach(r => {
    const row = document.createElement("div"); row.className = "glass row";
    const a = document.createElement("span"), b = document.createElement("small");
    a.textContent = `${r.g} • ${DAYS[r.d][0]} • ${RN[r.r]} • ${PARTS[r.p]}`; a.style.color = COL[r.r];
    b.textContent = new Date(r.t).toLocaleString("ru", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    row.append(a, b); h.append(row);
  });
}
$("#avatar").onclick = () => { st.avatar = AVATARS[(AVATARS.indexOf(st.avatar) + 1) % AVATARS.length]; store.set("avatar", st.avatar); renderProfile(); };
$("#name").oninput = e => { st.name = e.target.value; store.set("name", st.name); };

/* ================= START ================= */
Object.keys(rounds).forEach(d => { const r = rounds[d]; if (!r.rar || r.rar[st.group] !== "legendary" || !r.list.every(g => GROUPS.includes(g))) delete rounds[d]; });
loadSchedules().finally(() => { save(); showTab("home"); openPicker(); });
