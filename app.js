/* Lexis H5 — lightweight web app port of the Lexis vocabulary-notebook extension.
   No build step, no backend. Storage = localStorage. Network = direct fetch to
   CORS-friendly dictionary sources. Offline data (seed/freq/morphology) comes
   from vocab.js (the same file the extension ships). */
(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const el = (h) => { const d = document.createElement("div"); d.innerHTML = h.trim(); return d.firstElementChild; };
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const DAY = 86400000;
  const now = () => Date.now();
  const norm = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ").replace(/^[^\w']+|[^\w']+$/g, "");
  // Pure person/company/place names filtered out of LEXIS_FREQ recommendations
  // and the notebook (mirrors the same list in the Chrome extension's app.js).
  const PROPER_NOUNS = new Set("aaron adams alexander alice allen amanda andrea andrew angela ann anna anthony arthur ashley austin bailey barbara benjamin bennett betty beverly brandon brian bryant campbell carl carter catherine charles charlotte christina christine christopher clark coleman collins cruz daniel david davis deborah dennis diana diane donald donna douglas edward edwards elizabeth emily emma eric evans garcia gary george gerald gregory harold harris hayes henderson henry howard hughes jackson jacob james janet jason jeffrey jennifer jeremy jerry jesse jessica joan john johnson jonathan jones jose joseph joshua joyce judy julia julie justin karen keith kelly kenneth kevin kyle larry laura lauren lawrence lee lewis linda lisa madison margaret maria marie marilyn martha martin mary matthew melissa michael michelle mitchell moore morris murphy myers nancy nathan nelson nicholas nicole pamela parker patricia patrick paul perry peter peterson phillips powell rachel raymond rebecca richard richardson robert roberts robinson roger rogers ronald ross russell ryan samuel sandra sara sarah scott sean sharon stephanie stephen steven stewart susan thomas thompson timothy tyler victoria walter washington watson william williams wilson adidas adobe amazon bmw canon cisco dell disney ebay epson google hitachi honda ibm intel kodak mastercard mcdonald microsoft mitsubishi morgan nike nikon nokia panasonic paypal philip philips samsung siemens sony tiffany toyota verizon wordpress yahoo alabama alaska albuquerque america arizona arlington atlanta australia austria baltimore bangladesh beijing belgium berlin birmingham boston brazil california canada carolina chicago china cincinnati cleveland colorado connecticut dakota dallas delaware denmark denver detroit dublin edinburgh egypt england finland florida france georgia germany glasgow greece hampshire hawaii houston idaho illinois india indiana indonesia iowa ireland italy japan kansas kentucky kenya korea liverpool london louisiana madrid maine malaysia manchester maryland massachusetts melbourne memphis mesa mexico miami michigan milwaukee minneapolis minnesota mississippi missouri montana montreal morocco moscow nashville nebraska nevada nigeria norway oakland ohio oklahoma omaha oregon orlando ottawa pakistan paris pennsylvania philadelphia philippines phoenix pittsburgh poland portland portugal rome russia sacramento scotland seattle shanghai singapore spain sweden switzerland sydney tampa tennessee texas thailand tokyo toronto tucson tulsa utah vancouver vegas vermont vietnam virginia wales wichita wisconsin wyoming york".split(" "));

  // ---- storage ----------------------------------------------------------
  const K = { words: "lexis_words", settings: "lexis_settings", assess: "lexis_assess" };
  const DEFAULT_SETTINGS = { chinese: true, dailyNewLimit: 15, showExamples: true, gistToken: "", gistId: "" };
  function load(k, fb) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? fb : v; } catch (e) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  // Strip punctuation a selection dragged in ("word," / “word” / (word).),
  // keeping word-internal apostrophes & hyphens (don't, well-known).
  function cleanTerm(s) {
    return String(s || "")
      .replace(/\s+/g, " ")
      .replace(/^[\s"'“”‘’(){}\[\]«»¡¿.,;:!?…·—–\-]+/, "")
      .replace(/[\s"'“”‘’(){}\[\]«»…·—–\-.,;:!?]+$/, "")
      .trim();
  }

  // punctuation + plural → singular (see lexisSingularize in vocab.js)
  function normTerm(s) {
    const t = cleanTerm(s);
    const one = typeof lexisSingularize === "function" ? lexisSingularize(t) : null;
    if (!one) return t;
    return /^[A-Z]/.test(t) ? one.charAt(0).toUpperCase() + one.slice(1) : one;
  }

  const setWords = (w) => save(K.words, w);
  // One-time sweep: clean stray punctuation off saved headwords, folding any
  // collision into the entry that already owns the cleaned term.
  function getWords() {
    const words = load(K.words, []);
    const byLookup = new Map();
    words.forEach((w) => { if (w.lookup) byLookup.set(w.lookup, w); });
    let changed = 0;
    const drop = new Set();
    for (const w of words) {
      const clean = normTerm(w.word);
      if (!clean || clean === w.word) continue;
      const lk = clean.toLowerCase().trim();
      const dupe = byLookup.get(lk);
      if (dupe && dupe !== w) {
        dupe.sightings = (dupe.sightings || []).concat(
          [{ context: w.context, url: w.url, title: w.title, at: w.createdAt }],
          w.sightings || []
        );
        drop.add(w.id);
      } else {
        w.word = clean; w.lookup = lk; byLookup.set(lk, w);
      }
      changed++;
    }
    const out = drop.size ? words.filter((w) => !drop.has(w.id)) : words;
    if (changed) setWords(out);
    return out;
  }
  const getSettings = () => Object.assign({}, DEFAULT_SETTINGS, load(K.settings, {}));
  const setSettings = (s) => save(K.settings, s);
  const getAssess = () => load(K.assess, { known: [], level: null, estVocab: 0 });
  const setAssess = (a) => save(K.assess, a);

  function toast(msg) {
    let t = $(".toast"); if (!t) { t = el(`<div class="toast"></div>`); document.body.appendChild(t); }
    t.innerHTML = msg; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 1800);
  }

  // ---- audio ----
  function speak(word, url) {
    if (url) { try { new Audio(url).play(); return; } catch (e) {} }
    try { const u = new SpeechSynthesisUtterance(word); u.lang = "en-US"; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {}
  }

  // ---- network lookup (client-side, CORS-friendly sources) --------------
  function withTimeout(p, ms, fb) {
    return Promise.race([Promise.resolve(p).catch(() => fb), new Promise((r) => setTimeout(() => r(fb), ms))]);
  }
  async function jget(url) { const r = await fetch(url); if (!r.ok) throw new Error(r.status); return r.json(); }

  async function fetchDictionary(term) {
    try {
      const arr = await jget("https://api.dictionaryapi.dev/api/v2/entries/en/" + encodeURIComponent(term));
      if (!Array.isArray(arr) || !arr.length) return null;
      let phonetic = "", audioUs = "", audioUk = "";
      const meanings = [];
      for (const e of arr) {
        phonetic = phonetic || e.phonetic || (e.phonetics || []).map((p) => p.text).find(Boolean) || "";
        for (const p of e.phonetics || []) {
          if (!p.audio) continue;
          if (/us|american/i.test(p.audio) && !audioUs) audioUs = p.audio;
          else if (/uk|british/i.test(p.audio) && !audioUk) audioUk = p.audio;
          else if (!audioUs) audioUs = p.audio;
        }
        for (const m of e.meanings || [])
          for (const d of m.definitions || [])
            if (d.definition) meanings.push({ pos: m.partOfSpeech || "", definition: d.definition, cn: "", example: d.example || "" });
      }
      return { phonetic, audioUs, audioUk, meanings };
    } catch (e) { return null; }
  }

  // ---- Datamuse helpers: pos tag → short label, frequency → band, parse item -
  const DM_POS = { n: "n.", v: "v.", adj: "adj.", adv: "adv.", u: "", prop: "" };
  function posFromTags(tags) {
    const t = (tags || []).find((x) => DM_POS[x] !== undefined);
    return t ? DM_POS[t] : "";
  }
  // occurrences-per-million (Datamuse "f:") → frequency band, mirroring the extension
  function bandOf(f) {
    if (f >= 50) return { key: "common", cn: "常用" };
    if (f >= 5) return { key: "mid", cn: "中频" };
    if (f >= 0.4) return { key: "low", cn: "低频" };
    return { key: "rare", cn: "生僻" };
  }
  function parseDm(it) {
    let pos = "", def = "";
    if (Array.isArray(it.defs) && it.defs[0]) {
      const parts = it.defs[0].split("\t");
      if (parts.length > 1) { pos = DM_POS[parts[0]] !== undefined ? DM_POS[parts[0]] : parts[0] + "."; def = parts[1]; }
      else def = parts[0];
      def = def.replace(/<[^>]+>/g, "").trim();
    }
    if (!pos) pos = posFromTags(it.tags);
    let f = 0;
    (it.tags || []).forEach((t) => { if (t.indexOf("f:") === 0) f = parseFloat(t.slice(2)) || 0; });
    const b = bandOf(f);
    return { word: it.word, pos, band: b.key, bandCn: b.cn, definition: def };
  }
  // Levenshtein distance (small words) — used to keep only genuine look-alikes
  function lev(a, b) {
    const m = a.length, n = b.length; if (Math.abs(m - n) > 2) return 9;
    const d = Array.from({ length: m + 1 }, (_, i) => [i].concat(new Array(n).fill(0)));
    for (let j = 0; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  }
  const dmURL = (rel, term, extra) => "https://api.datamuse.com/words?" + rel + "=" + encodeURIComponent(term) + (extra ? "&" + extra : "");
  // function words to drop from collocations so we keep "make sure / make up", not "make a / make the"
  const COLLO_STOP = new Set("a an the it its it's this that these those he she they them we you i my your his her our their of to in on at by for with from as is are was were be been being do does did have has had will would can could should may might must not no and or but so if then than too very".split(" "));

  async function fetchDatamuse(term) {
    const isPhrase = /\s/.test(term);
    const out = { synonyms: [], synonymsRich: [], family: [], lookalikes: [], collocations: [] };
    // synonyms with each word's own pos / band / definition (近义辨析)
    try {
      const syn = await withTimeout(jget(dmURL("ml", term, "max=10&md=dpf")), 6000, []);
      out.synonymsRich = (syn || []).filter((x) => x.word && x.word !== term).slice(0, 8).map(parseDm);
      out.synonyms = out.synonymsRich.map((s) => s.word);
    } catch (e) {}
    if (!isPhrase) {
      // word family — same root, different affixes, with pos
      try {
        const fam = await withTimeout(jget(dmURL("rel_der", term, "max=12&md=p")), 6000, []);
        out.family = (fam || []).filter((x) => x.word && x.word !== term).slice(0, 10)
          .map((x) => ({ word: x.word, pos: posFromTags(x.tags) }));
      } catch (e) {}
      // easily-confused look-alikes — sounds-like neighbours within edit distance 2
      try {
        const sl = await withTimeout(jget(dmURL("sl", term, "max=20&md=df")), 6000, []);
        out.lookalikes = (sl || []).filter((x) => x.word && x.word !== term && lev(term, x.word) <= 2)
          .map((x) => { const d = parseDm(x); return { word: x.word, definition: d.definition, cn: "" }; })
          .filter((c) => c.definition) // drop junk misspellings with no gloss (e.g. "effekt")
          .slice(0, 6);
      } catch (e) {}
      // common collocations — words that frequently follow / precede this one
      try {
        const [after, before] = await Promise.all([
          withTimeout(jget(dmURL("rel_bga", term, "max=6")), 5000, []),
          withTimeout(jget(dmURL("rel_bgb", term, "max=6")), 5000, []),
        ]);
        const stop = COLLO_STOP;
        const coll = [];
        (after || []).filter((x) => !stop.has(x.word)).slice(0, 5).forEach((x) => coll.push({ phrase: term + " " + x.word }));
        (before || []).filter((x) => !stop.has(x.word)).slice(0, 5).forEach((x) => coll.push({ phrase: x.word + " " + term }));
        out.collocations = coll.slice(0, 8);
      } catch (e) {}
    }
    return out;
  }

  // Chinese gloss via MyMemory (free, CORS-open) — best effort.
  async function fetchCn(term) {
    try {
      const j = await jget("https://api.mymemory.translated.net/get?langpair=en|zh-CN&q=" + encodeURIComponent(term));
      const t = j && j.responseData && j.responseData.translatedText;
      if (t && !/^[\x00-\x7F]*$/.test(t)) return t;
    } catch (e) {}
    return "";
  }

  async function fetchSuggestions(term) {
    try {
      const sp = await withTimeout(jget("https://api.datamuse.com/words?max=4&md=d&sp=" + encodeURIComponent(term)), 5000, []);
      return (sp || []).map((it) => {
        let def = "";
        if (Array.isArray(it.defs) && it.defs[0]) { const p = it.defs[0].split("\t"); def = (p.length > 1 ? p[1] : p[0]).replace(/<[^>]+>/g, ""); }
        return { word: it.word, definition: def };
      }).filter((s) => s.word && s.word !== term);
    } catch (e) { return []; }
  }

  // full lookup: merge dictionary + datamuse + morphology + cn gloss
  async function lookup(rawTerm) {
    const term = norm(rawTerm);
    if (!term) return { error: true };
    const isPhrase = /\s/.test(term);
    const [dict, dm, cn] = await Promise.all([
      isPhrase ? Promise.resolve(null) : withTimeout(fetchDictionary(term), 8000, null),
      withTimeout(fetchDatamuse(term), 8000, { synonyms: [], synonymsRich: [], family: [], lookalikes: [], collocations: [] }),
      getSettings().chinese ? withTimeout(fetchCn(term), 7000, "") : Promise.resolve(""),
    ]);
    const meanings = [];
    const seen = new Set();
    for (const m of (dict && dict.meanings) || []) {
      const key = m.definition.toLowerCase().replace(/[^a-z ]/g, "").split(/\s+/).slice(0, 8).join(" ");
      if (seen.has(key)) continue; seen.add(key);
      meanings.push(m); if (meanings.length >= 4) break;
    }
    const examples = [];
    for (const m of (dict && dict.meanings) || []) if (m.example) { examples.push({ text: m.example, translation: "" }); if (examples.length >= 3) break; }
    let morph = null;
    try { if (!isPhrase && window.lexisAnalyzeMorph) morph = window.lexisAnalyzeMorph(term); } catch (e) {}
    let suggestions = [];
    if (!meanings.length && !isPhrase) suggestions = await fetchSuggestions(term);
    return {
      term, isPhrase, cn,
      phonetic: (dict && dict.phonetic) || "",
      audioUs: (dict && dict.audioUs) || "", audioUk: (dict && dict.audioUk) || "",
      meanings, examples, morph,
      synonyms: dm.synonyms, synonymsRich: dm.synonymsRich, family: dm.family,
      lookalikes: dm.lookalikes, collocations: dm.collocations, suggestions,
    };
  }

  // ---- render a word card (shared: look-up + notebook detail) -----------
  function morphHTML(morph) {
    if (!morph || !morph.parts || !morph.parts.length) return "";
    const parts = morph.parts.map((p, i) => {
      const meaning = p.meaning ? `<small>${esc(p.meaning)}</small>` : "";
      return (i ? `<span class="mplus">+</span>` : "") + `<div class="mpart"><b>${esc(p.text)}</b>${meaning}</div>`;
    }).join("");
    return `<div class="card"><h2 class="sec">词根拆解</h2><div class="morph">${parts}</div></div>`;
  }
  function cardHTML(p, opts) {
    opts = opts || {};
    if (p.error) return `<div class="empty">出错了，请重试。</div>`;
    const spk = (label, url) => `<button class="speak" data-audio="${esc(url || "")}" data-w="${esc(p.term)}" title="${label}">🔊</button>`;
    let h = `<div class="card">
      <div class="row" style="align-items:baseline">
        <span class="hw serif">${esc(p.term)}</span>
        ${p.phonetic ? `<span class="phon">${esc(p.phonetic)}</span>` : ""}
        ${spk("US", p.audioUs)}
      </div>
      ${p.cn ? `<div class="cn-gloss">${esc(p.cn)}</div>` : ""}
      ${opts.saveBtn ? `<div class="row" style="margin-top:12px">${opts.saveBtn}</div>` : ""}
    </div>`;

    if (!p.meanings.length && !p.isPhrase && !p.cn) {
      if (p.suggestions && p.suggestions.length) {
        h += `<div class="card"><h2 class="sec">你要找的是不是</h2>` +
          p.suggestions.map((s) => `<div class="item" data-look="${esc(s.word)}"><span class="w serif">${esc(s.word)}</span><span class="meta">${esc(s.definition)}</span></div>`).join("") + `</div>`;
      } else h += `<div class="card muted">没有找到释义。</div>`;
    }
    // highlight the headword inside example sentences
    const hi = (txt) => {
      try {
        const re = new RegExp("\\b(" + p.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+") + "\\w*)", "ig");
        return esc(txt).replace(re, "<mark>$1</mark>");
      } catch (e) { return esc(txt); }
    };
    // 释义 (memory-first)
    if (p.meanings.length) {
      h += `<div class="card"><h2 class="sec">释义</h2>` + p.meanings.map((m) =>
        `<div class="mean">${m.pos ? `<span class="pos">${esc(m.pos)}</span> ` : ""}<span class="def">${esc(m.definition)}</span>${m.cn ? `<div class="cn">${esc(m.cn)}</div>` : ""}</div>`).join("") + `</div>`;
    }
    // 例句
    if (p.examples && p.examples.length && (opts.examples !== false)) {
      h += `<div class="card"><h2 class="sec">例句</h2>` + p.examples.map((e) =>
        `<div class="ex">${hi(e.text)}${e.translation ? `<div class="tr">${esc(e.translation)}</div>` : ""}</div>`).join("") + `</div>`;
    }
    // 常用搭配 (collocations)
    if (p.collocations && p.collocations.length) {
      h += `<div class="card"><h2 class="sec">常用搭配</h2><div class="row">` +
        p.collocations.map((c) => { const ph = c.phrase || c; return `<span class="chip" data-look="${esc(ph)}">${esc(ph)}</span>`; }).join("") + `</div></div>`;
    }
    // 词根拆解
    h += morphHTML(p.morph);
    // 词族 (with pos)
    if (p.family && p.family.length) h += `<div class="card"><h2 class="sec">词族</h2><div class="row">` +
      p.family.map((f) => { const w = f.word || f; const pos = f.pos ? ` <small>${esc(f.pos)}</small>` : ""; return `<span class="chip" data-look="${esc(w)}">${esc(w)}${pos}</span>`; }).join("") + `</div></div>`;
    // 近义辨析 — each synonym with its own pos / band / definition
    const synRich = (p.synonymsRich && p.synonymsRich.length) ? p.synonymsRich
      : (p.synonyms || []).map((w) => ({ word: w }));
    if (synRich.length) {
      h += `<div class="card"><h2 class="sec">近义辨析</h2>` + synRich.map((s) =>
        `<div class="syn"><div class="syn-h"><button class="syn-w" data-look="${esc(s.word)}">${esc(s.word)}</button>${s.pos ? `<span class="pos">${esc(s.pos)}</span>` : ""}${s.band ? `<span class="mfreq freq-${s.band}">${esc(s.bandCn || "")}</span>` : ""}</div>${s.definition ? `<div class="syn-d">${esc(s.definition)}${s.cn ? ` · ${esc(s.cn)}` : ""}</div>` : ""}</div>`).join("") + `</div>`;
    }
    // 形近词 (easily confused)
    if (p.lookalikes && p.lookalikes.length) {
      h += `<div class="card"><h2 class="sec">形近词</h2>` + p.lookalikes.map((c) =>
        `<div class="conf"><button class="conf-w" data-look="${esc(c.word)}">${esc(c.word)}</button><span class="conf-d">${esc(c.definition || c.cn || "")}</span></div>`).join("") + `</div>`;
    }
    return h;
  }
  function wireCard(root) {
    root.querySelectorAll("[data-audio]").forEach((b) => b.addEventListener("click", () => speak(b.dataset.w, b.dataset.audio)));
    root.querySelectorAll("[data-look]").forEach((b) => b.addEventListener("click", () => { go("lookup"); doLookup(b.dataset.look); }));
  }

  // ---- notebook ops -----------------------------------------------------
  function findWord(term) { const t = norm(term); return getWords().find((w) => w.lookup === t); }
  function saveWord(p) {
    const words = getWords();
    if (words.some((w) => w.lookup === p.term)) return false;
    words.unshift({
      id: "w" + now() + Math.random().toString(36).slice(2, 6),
      word: p.term, lookup: p.term, createdAt: now(), updatedAt: now(),
      context: p.context || "",
      status: p.meanings.length || p.cn ? "ready" : "notfound",
      data: {
        phonetic: p.phonetic, audioUs: p.audioUs, audioUk: p.audioUk, cn: p.cn,
        meanings: p.meanings, examples: p.examples, morph: p.morph,
        synonyms: p.synonyms, synonymsRich: p.synonymsRich, family: p.family,
        lookalikes: p.lookalikes, collocations: p.collocations, isPhrase: p.isPhrase,
      },
      srs: { due: now(), interval: 0, ease: 2.5, reps: 0, lapses: 0, last: 0 },
    });
    setWords(words);
    return true;
  }
  function removeWord(id) { setWords(getWords().filter((w) => w.id !== id)); }
  function wordToPreview(w) {
    const d = w.data || {};
    return { term: w.word, isPhrase: d.isPhrase, cn: d.cn, phonetic: d.phonetic, audioUs: d.audioUs, audioUk: d.audioUk,
      meanings: d.meanings || [], examples: d.examples || [], morph: d.morph, synonyms: d.synonyms || [],
      synonymsRich: d.synonymsRich || [], family: d.family || [], lookalikes: d.lookalikes || [], collocations: d.collocations || [], extraLoaded: true };
  }

  // ---- SRS (ported from extension app.js) -------------------------------
  function schedule(srs, grade) {
    let { interval = 0, ease = 2.5, reps = 0, lapses = 0 } = srs || {};
    let due;
    if (grade === "again") { reps = 0; lapses += 1; ease = Math.max(1.3, ease - 0.2); interval = 0; due = now() + 10 * 60000; }
    else {
      if (grade === "hard") ease = Math.max(1.3, ease - 0.15);
      else if (grade === "easy") ease = Math.min(3.2, ease + 0.15);
      if (reps === 0) interval = grade === "easy" ? 4 : 1;
      else if (reps === 1) interval = grade === "hard" ? 3 : grade === "easy" ? 7 : 4;
      else { const mult = grade === "hard" ? 1.2 : grade === "easy" ? ease * 1.3 : ease; interval = Math.round(interval * mult); }
      interval = Math.max(1, interval); reps += 1; due = now() + interval * DAY;
    }
    return { interval, ease: Math.round(ease * 100) / 100, reps, lapses, last: now(), due };
  }
  function intervalLabel(d) { if (d < 1) return "10 分钟"; if (d < 30) return d + " 天"; return Math.round(d / 30) + " 个月"; }
  const dueWords = () => getWords().filter((w) => (w.srs ? w.srs.due : 0) <= now());

  // =======================================================================
  //  VIEWS
  // =======================================================================
  const view = $("#view");
  let current = "lookup";

  function refreshBadge() {
    const n = dueWords().length;
    $("#dueBadge").textContent = n ? n + " 个待复习" : "";
  }

  function go(tab) {
    current = tab;
    document.querySelectorAll(".tabbar button").forEach((b) => b.classList.toggle("on", b.dataset.tab === tab));
    ({ lookup: renderLookup, notebook: renderNotebook, review: renderReview, discover: renderDiscover, me: renderMe }[tab])();
    window.scrollTo(0, 0);
    refreshBadge();
  }

  // ---- LOOKUP ----
  function renderLookup() {
    view.innerHTML = `
      <form class="search" id="sform">
        <input id="q" placeholder="输入单词或短语…" autocomplete="off" autocapitalize="off" spellcheck="false">
        <button class="btn primary" type="submit">查</button>
      </form>
      <div class="row" style="margin-top:8px"><button class="btn sage" id="pasteBtn" style="width:100%">📋 粘贴保存(从剪贴板)</button></div>
      <div id="result"></div>`;
    $("#sform").addEventListener("submit", (e) => { e.preventDefault(); doLookup($("#q").value); });
    $("#pasteBtn").addEventListener("click", pasteAndSave);
    const recent = getWords().slice(0, 8);
    if (recent.length) $("#result").innerHTML =
      `<h2 class="sec">最近保存</h2>` + recent.map((w) =>
        `<div class="item" data-open="${w.id}"><span class="dot ${w.status}"></span><span class="w serif">${esc(w.word)}</span><span class="meta">${esc((w.data && w.data.cn) || "")}</span></div>`).join("");
    view.querySelectorAll("[data-open]").forEach((n) => n.addEventListener("click", () => openDetail(n.dataset.open)));
  }

  async function doLookup(term) {
    term = norm(term);
    if (!term) return;
    const q = $("#q"); if (q) q.value = term;
    const box = $("#result");
    box.innerHTML = `<div class="empty"><span class="spin"></span> 查询中…</div>`;
    const p = await lookup(term);
    const saved = !!findWord(term);
    const saveBtn = saved
      ? `<button class="btn" id="savedBtn" disabled>已在生词本</button>`
      : `<button class="btn sage" id="saveBtn">保存到生词本</button>`;
    box.innerHTML = cardHTML(p, { saveBtn });
    wireCard(box);
    const sb = $("#saveBtn");
    if (sb) sb.addEventListener("click", () => {
      if (saveWord(p)) { toast("已保存 <b>" + esc(p.term) + "</b>"); doLookup(term); refreshBadge(); }
      else toast("已经在生词本里了");
    });
  }

  // ---- NOTEBOOK ----
  let nbFilter = "all", nbScene = null;
  function renderNotebook() {
    const words = getWords();
    view.innerHTML = `
      <div class="subtabs" id="nbtabs">
        <button data-f="all" class="${nbFilter === "all" ? "on" : ""}">全部 ${words.length}</button>
        <button data-f="due" class="${nbFilter === "due" ? "on" : ""}">待复习 ${dueWords().length}</button>
        <button data-f="recent" class="${nbFilter === "recent" ? "on" : ""}">最近</button>
      </div>
      <div id="nbcats"></div>
      <div id="nblist"></div>`;
    view.querySelectorAll("#nbtabs button").forEach((b) => b.addEventListener("click", () => { nbFilter = b.dataset.f; renderNotebook(); }));
    let list = words.slice();
    if (nbFilter === "due") list = dueWords();
    if (nbFilter === "recent") list = words.slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 30);
    // category chip bar (built from the pre-scene list)
    const cats = $("#nbcats");
    if (cats && list.length) {
      cats.innerHTML = catBarH5(list.map((w) => w.word), "wordNb", nbScene, "data-nbscene");
      cats.querySelectorAll("[data-nbscene]").forEach((b) => b.addEventListener("click", () => {
        const key = b.dataset.nbscene;
        nbScene = (key === "__all__" || nbScene === key) ? null : key;
        renderNotebook();
      }));
    }
    if (nbScene) {
      list = list.filter((w) => { const k = sceneOfH5(w.word, "wordNb"); return (k ? k.key : "_other") === nbScene; })
        .sort((a, b) => freqRankH5(a.word) - freqRankH5(b.word)); // highest-frequency first
    }
    const box = $("#nblist");
    if (!list.length) { box.innerHTML = `<div class="empty"><div class="big">📖</div>${nbScene ? "这个分类下暂无生词，点「全部」。" : "还没有生词。去「查词」保存几个吧。"}</div>`; return; }
    box.innerHTML = list.map((w) => {
      const dueIn = w.srs && w.srs.due > now() ? "下次 " + intervalLabel(Math.round((w.srs.due - now()) / DAY)) : "待复习";
      return `<div class="item" data-open="${w.id}">
        <span class="dot ${w.status}"></span>
        <div><div class="w serif">${esc(w.word)}</div><div class="meta">${esc((w.data && w.data.cn) || (w.data && (w.data.meanings || [])[0] && w.data.meanings[0].definition) || "")}</div></div>
        <span class="st chip">${dueIn}</span></div>`;
    }).join("");
    box.querySelectorAll("[data-open]").forEach((n) => n.addEventListener("click", () => openDetail(n.dataset.open)));
  }

  // original-sentence card for the saved-word detail (highlights the headword)
  function contextCardHTML(w) {
    const ctx = (w.context || "").trim();
    if (!ctx) return "";
    let body = esc(ctx);
    try {
      const re = new RegExp("(" + w.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
      body = esc(ctx).replace(re, "<mark>$1</mark>");
    } catch (e) {}
    return `<div class="card"><h2 class="sec">原句语境</h2><div class="ex">${body}</div></div>`;
  }

  function openDetail(id) {
    const w = getWords().find((x) => x.id === id);
    if (!w) return;
    view.innerHTML = `<div class="row" style="margin-bottom:12px">
        <button class="btn" id="back">← 返回</button>
        <button class="btn" id="edit" style="margin-left:auto">编辑词条</button>
        <button class="btn" id="del">删除</button>
      </div><div id="det"></div>`;
    $("#det").innerHTML = cardHTML(wordToPreview(w), { examples: getSettings().showExamples }) + contextCardHTML(w);
    wireCard($("#det"));
    $("#back").addEventListener("click", () => go(current === "lookup" ? "lookup" : "notebook"));
    $("#del").addEventListener("click", () => { if (confirm("删除 “" + w.word + "”？")) { removeWord(id); toast("已删除"); go("notebook"); } });
    $("#edit").addEventListener("click", async () => {
      const next = cleanTerm(prompt("修改词条：", w.word) || "");
      if (!next || next === w.word) return;
      toast("正在重新查询…");
      const p = await lookup(next);           // refetch meanings for the new term
      const words = getWords();
      const rec = words.find((x) => x.id === id);
      if (!rec) return;
      rec.word = p.term || next;
      rec.lookup = norm(rec.word);
      rec.updatedAt = now();
      rec.status = (p.meanings || []).length || p.cn ? "ready" : "notfound";
      rec.data = Object.assign({}, rec.data, {
        phonetic: p.phonetic, audioUs: p.audioUs, audioUk: p.audioUk, cn: p.cn,
        meanings: p.meanings, examples: p.examples, morph: p.morph,
        synonyms: p.synonyms, family: p.family, isPhrase: p.isPhrase,
      });
      setWords(words);
      toast("已更新");
      openDetail(id);
    });
  }

  // ---- REVIEW ----
  let session = null;
  function renderReview() {
    const due = dueWords();
    if (!due.length) {
      view.innerHTML = `<div class="empty"><div class="big">✅</div>没有待复习的词。<br><span class="muted">保存新词后会按间隔重复排期。</span></div>`;
      session = null; return;
    }
    if (!session || !session.queue.length) session = { queue: due.slice(), total: due.length, done: 0, showBack: false };
    drawCard();
  }
  function drawCard() {
    const w = session.queue[0];
    if (!w) { view.innerHTML = `<div class="empty"><div class="big">🎉</div>本轮完成！复习了 ${session.total} 个词。</div>`; session = null; refreshBadge(); return; }
    const pct = Math.round((session.done / session.total) * 100);
    const d = w.data || {};
    const back = session.showBack;
    view.innerHTML = `
      <div class="progress"><i style="width:${pct}%"></i></div>
      <div class="card rev-card">
        <div class="hw serif">${esc(w.word)}</div>
        ${w.data && w.data.phonetic ? `<div class="phon">${esc(w.data.phonetic)}</div>` : ""}
        <button class="speak" id="rspk" style="font-size:26px">🔊</button>
        ${back ? `<hr class="hr">
          ${d.cn ? `<div class="cn-gloss">${esc(d.cn)}</div>` : ""}
          ${(d.meanings || []).slice(0, 2).map((m) => `<div class="mean" style="text-align:left">${m.pos ? `<span class="pos">${esc(m.pos)}</span> ` : ""}${esc(m.definition)}</div>`).join("")}`
          : `<div class="muted" style="margin-top:14px">想想它的意思</div>`}
      </div>
      ${back ? gradeBar(w) : `<button class="btn primary" id="flip" style="width:100%;padding:14px">显示释义</button>`}`;
    $("#rspk").addEventListener("click", () => speak(w.word, w.data && w.data.audioUs));
    if (!back) $("#flip").addEventListener("click", () => { session.showBack = true; drawCard(); });
    else view.querySelectorAll("[data-grade]").forEach((b) => b.addEventListener("click", () => grade(w, b.dataset.grade)));
  }
  function gradeBar(w) {
    const g = (k, label) => { const days = schedule(w.srs, k).interval || 10 / 1440; return `<button class="btn" data-grade="${k}">${label}<span class="d">${intervalLabel(days)}</span></button>`; };
    return `<div class="rev-actions">
      <button class="btn" data-grade="again" style="color:#c05a5a">重来<span class="d">10 分钟</span></button>
      ${g("hard", "困难")}${g("good", "记得")}
      <button class="btn sage" data-grade="easy">简单<span class="d">${intervalLabel(schedule(w.srs, "easy").interval)}</span></button>
    </div>`;
  }
  function grade(w, g) {
    const words = getWords();
    const rec = words.find((x) => x.id === w.id);
    if (rec) { rec.srs = schedule(rec.srs, g); rec.updatedAt = now(); setWords(words); }
    session.queue.shift();
    if (g === "again" && rec) session.queue.push(rec); // re-show at end
    session.done += 1; session.showBack = false;
    drawCard();
  }

  // ---- DISCOVER (offline study lists from vocab.js) ----
  let dTab = "words", dCursor = { words: 0, phrases: 0, idioms: 0 };
  let dScene = { words: null, phrases: null, idioms: null }; // active usage-scene filter per tab
  const PAGE = 12;
  // usage-scene of a term, memoized. kind = "words"|"phrases"|"idioms" (Discover)
  // or "wordNb" for a notebook entry (guesses word vs phrase/idiom by spaces).
  const _sceneCacheH5 = new Map();
  function sceneOfH5(term, kind) {
    const ck = kind + " " + term;
    if (_sceneCacheH5.has(ck)) return _sceneCacheH5.get(ck);
    let out = null;
    try {
      if (kind === "wordNb") {
        out = /\s/.test(String(term).trim())
          ? (sceneOfH5(term, "idioms") || sceneOfH5(term, "phrases"))
          : sceneOfH5(term, "words");
        _sceneCacheH5.set(ck, out); return out;
      }
      let raw = null;
      if (kind === "words" && window.lexisWordDomain) raw = window.lexisWordDomain(term);
      else if (kind === "idioms" && window.lexisIdiomScene) raw = window.lexisIdiomScene(term);
      else if (kind === "phrases" && window.lexisPhraseScene) raw = window.lexisPhraseScene(term);
      if (raw && typeof raw === "object") out = { key: raw.key || "", cn: raw.cn || "" };
      else if (typeof raw === "string") out = { key: raw, cn: (window.LEXIS_SCENE_CN && window.LEXIS_SCENE_CN[raw]) || "" };
      if (out && !out.cn) out = null;
    } catch (e) {}
    _sceneCacheH5.set(ck, out);
    return out;
  }
  // frequency rank (lower = more common); Infinity if outside the pool.
  let _freqRankH5 = null;
  function freqRankH5(t) {
    if (!_freqRankH5) {
      _freqRankH5 = new Map();
      (window.LEXIS_FREQ || []).forEach((x, i) => { const w = norm(typeof x === "string" ? x : x.term || ""); if (w && !_freqRankH5.has(w)) _freqRankH5.set(w, i); });
    }
    const r = _freqRankH5.get(norm(t));
    return r == null ? Infinity : r;
  }
  // clickable category-filter chips shared by Discover + Notebook (H5).
  // items = string terms; kind drives the classifier; active = current scene key;
  // attr = data-attribute name for the chip (dscene / nbscene).
  function catBarH5(items, kind, active, attr) {
    const counts = new Map();
    items.forEach((t) => { const k = sceneOfH5(t, kind); const key = k ? k.key : "_other", cn = k ? k.cn : "其他";
      if (!counts.has(key)) counts.set(key, { cn, n: 0 }); counts.get(key).n++; });
    if (counts.size <= 1 && counts.has("_other")) return "";
    const chip = (key, cn, n, on, muted) =>
      `<button class="catf${on ? " on" : ""}${muted ? " muted" : ""}" ${attr}="${esc(key)}">${esc(cn)} <b>${n}</b></button>`;
    const chips = [chip("__all__", "全部", items.length, !active, false)];
    [...counts.entries()].sort((a, b) => b[1].n - a[1].n)
      .forEach(([key, v]) => chips.push(chip(key, v.cn, v.n, active === key, key === "_other")));
    return `<div class="catbar">${chips.join("")}</div>`;
  }
  function knownSet() {
    const s = new Set(getAssess().known.map(norm));
    getWords().forEach((w) => s.add(w.lookup));
    return s;
  }
  function discoverPool(kind) {
    const known = knownSet();
    const term = (x) => (typeof x === "string" ? x : x.term || x.phrase || x.word || (Array.isArray(x) ? x[0] : ""));
    if (kind === "words") return (window.LEXIS_FREQ || []).map(term).filter((w) => w && !known.has(norm(w)) && !PROPER_NOUNS.has(norm(w)));
    if (kind === "phrases") return (window.LEXIS_PHRASE_SEED_FLAT || []).map(term).filter((p) => p && !known.has(norm(p)));
    if (kind === "idioms") return Object.keys(window.LEXIS_IDIOM_SCENE || {}).filter((p) => !known.has(norm(p)));
    return [];
  }
  function renderDiscover() {
    view.innerHTML = `
      <div class="subtabs" id="dtabs">
        <button data-d="words" class="${dTab === "words" ? "on" : ""}">单词</button>
        <button data-d="phrases" class="${dTab === "phrases" ? "on" : ""}">短语搭配</button>
        <button data-d="idioms" class="${dTab === "idioms" ? "on" : ""}">习语</button>
      </div>
      <p class="muted" style="font-size:13px;margin-top:0">按词频推荐，点分类学习该场景的高频词，标「已掌握」同步评估，「学习」加入生词本。</p>
      <div id="dcats"></div>
      <div id="dlist"></div>
      <div class="row" style="margin-top:14px"><button class="btn" id="dmore" style="flex:1">换一批 ↻</button></div>`;
    view.querySelectorAll("#dtabs button").forEach((b) => b.addEventListener("click", () => { dTab = b.dataset.d; renderDiscover(); }));
    $("#dmore").addEventListener("click", () => { dCursor[dTab] += PAGE; drawStudy(); });
    drawStudy();
  }
  function drawStudy() {
    const fullPool = discoverPool(dTab);
    // category chip bar (built from the full pool, so counts reflect everything)
    const cats = $("#dcats");
    if (cats) {
      cats.innerHTML = catBarH5(fullPool, dTab, dScene[dTab], "data-dscene");
      cats.querySelectorAll("[data-dscene]").forEach((b) => b.addEventListener("click", () => {
        const key = b.dataset.dscene;
        dScene[dTab] = (key === "__all__" || dScene[dTab] === key) ? null : key;
        dCursor[dTab] = 0; drawStudy();
      }));
    }
    const active = dScene[dTab];
    const pool = active
      ? fullPool.filter((t) => { const k = sceneOfH5(t, dTab); return (k ? k.key : "_other") === active; })
      : fullPool;
    if (dCursor[dTab] >= pool.length) dCursor[dTab] = 0;
    const items = pool.slice(dCursor[dTab], dCursor[dTab] + PAGE);
    const box = $("#dlist");
    if (!items.length) { box.innerHTML = `<div class="empty">暂无更多推荐。</div>`; return; }
    box.innerHTML = items.map((term) => {
      let scene = "";
      try {
        let raw = null;
        if (dTab === "words" && window.lexisWordDomain) raw = window.lexisWordDomain(term);
        else if (dTab === "idioms" && window.lexisIdiomScene) raw = window.lexisIdiomScene(term);
        else if (dTab === "phrases" && window.lexisPhraseScene) raw = window.lexisPhraseScene(term);
        if (raw && typeof raw === "object") scene = raw.cn || "";
        else if (typeof raw === "string") scene = (window.LEXIS_SCENE_CN && window.LEXIS_SCENE_CN[raw]) || "";
      } catch (e) {}
      return `<div class="study" data-term="${esc(term)}">
        <span class="term serif">${esc(term)}</span>
        ${scene ? `<span class="g">${esc(scene)}</span>` : ""}
        <span class="act">
          <button class="btn" data-act="learn">学习</button>
          <button class="btn sage" data-act="master">已掌握</button>
        </span></div>`;
    }).join("");
    box.querySelectorAll(".study").forEach((row) => {
      const term = row.dataset.term;
      row.querySelector('[data-act="learn"]').addEventListener("click", async () => {
        toast("查询中…"); const p = await lookup(term);
        saveWord(p); toast("已加入生词本 <b>" + esc(term) + "</b>"); row.remove(); refreshBadge();
      });
      row.querySelector('[data-act="master"]').addEventListener("click", () => {
        const a = getAssess(); if (!a.known.map(norm).includes(norm(term))) a.known.push(term);
        setAssess(a); toast("已标记掌握"); row.remove();
      });
    });
  }

  // ---- ME / settings + assess summary ----
  function renderMe() {
    const s = getSettings();
    const a = getAssess();
    const words = getWords();
    const mastered = words.filter((w) => w.srs && w.srs.interval >= 21).length;
    const knownN = new Set([].concat(a.known.map(norm), words.map((w) => w.lookup))).size;
    view.innerHTML = `
      <div class="card">
        <h2 class="sec">概览</h2>
        <div class="row" style="justify-content:space-between">
          <div><div class="stat">${words.length}</div><div class="muted">生词</div></div>
          <div><div class="stat">${dueWords().length}</div><div class="muted">待复习</div></div>
          <div><div class="stat">${mastered}</div><div class="muted">已掌握</div></div>
        </div>
      </div>
      <div class="card">
        <h2 class="sec">词汇量估算</h2>
        <div class="stat">${knownN.toLocaleString()}</div>
        <div class="muted">已标记掌握 + 生词本（目标 15,000 词族）</div>
        <div class="meter"><i style="width:${Math.min(100, (knownN / 15000) * 100)}%"></i></div>
        <div class="row" style="margin-top:8px"><button class="btn" id="assessBtn">快速评估</button></div>
      </div>
      <div class="card">
        <h2 class="sec">设置</h2>
        <label class="set">中文释义 <input type="checkbox" id="setCn" ${s.chinese ? "checked" : ""}></label>
        <label class="set">显示例句 <input type="checkbox" id="setEx" ${s.showExamples ? "checked" : ""}></label>
        <label class="set">每日新词上限 <input type="number" id="setLimit" value="${s.dailyNewLimit}" min="1" max="100" style="width:70px"></label>
      </div>
      <div class="card">
        <h2 class="sec">☁️ 云同步</h2>
        <p class="muted" style="font-size:12px;margin:0 0 8px">和电脑 Chrome 扩展共用一个私有 GitHub Gist。点「同步」= 拉取 → 按新版优先合并 → 推回。Token 只存本机、绝不上传。<a href="https://github.com/settings/tokens/new?scopes=gist&description=Lexis%20Sync" target="_blank">生成 token</a>(只勾 gist)。</p>
        <label class="set">Token <input type="password" id="setGistToken" value="${esc(s.gistToken || "")}" placeholder="ghp_…" autocomplete="off" style="width:150px"></label>
        <label class="set">Gist ID <input type="text" id="setGistId" value="${esc(s.gistId || "")}" placeholder="留空首次自动创建" autocomplete="off" style="width:150px"></label>
        <div class="row" style="margin-top:8px"><button class="btn sage" id="syncBtn">☁️ 同步</button></div>
      </div>
      <div class="card">
        <h2 class="sec">数据</h2>
        <div class="row"><button class="btn" id="exp">导出 JSON</button><button class="btn" id="imp">导入</button><button class="btn" id="clr" style="color:#c05a5a">清空</button></div>
        <input type="file" id="impFile" accept="application/json" hidden>
        <div class="row" style="margin-top:8px"><button class="btn" id="stripProperNouns">清理人名/公司名/地名单词</button></div>
      </div>
      <p class="muted" style="text-align:center;font-size:12px">Lexis H5 · 数据仅存本机浏览器</p>`;

    $("#setCn").addEventListener("change", (e) => { s.chinese = e.target.checked; setSettings(s); });
    $("#setEx").addEventListener("change", (e) => { s.showExamples = e.target.checked; setSettings(s); });
    $("#setLimit").addEventListener("change", (e) => { s.dailyNewLimit = +e.target.value || 15; setSettings(s); });
    $("#assessBtn").addEventListener("click", startAssess);
    $("#setGistToken").addEventListener("change", (e) => { s.gistToken = e.target.value.trim(); setSettings(s); });
    $("#setGistId").addEventListener("change", (e) => { s.gistId = e.target.value.trim(); setSettings(s); });
    $("#syncBtn").addEventListener("click", () => cloudSync($("#syncBtn")));
    $("#exp").addEventListener("click", exportData);
    $("#imp").addEventListener("click", () => $("#impFile").click());
    $("#impFile").addEventListener("change", importData);
    $("#clr").addEventListener("click", () => { if (confirm("清空所有生词与设置？此操作不可恢复。")) { localStorage.clear(); toast("已清空"); go("me"); } });
    $("#stripProperNouns").addEventListener("click", () => {
      const before = getWords();
      const after = before.filter((w) => !PROPER_NOUNS.has(norm(w.word)));
      const removed = before.length - after.length;
      if (removed) setWords(after);
      toast(removed ? "已移除 " + removed + " 个人名/公司名/地名单词" : "生词本里没有找到人名/公司名/地名单词");
      go("me");
    });
  }

  // ---- GitHub Gist cloud sync: pull → merge (newer-wins) → push ----------
  async function cloudSync(btn) {
    const s = getSettings();
    const t = (s.gistToken || "").trim();
    if (!t) { toast("先填 GitHub token(只勾 gist 权限)"); return; }
    const FILE = "lexis.json";
    const hdr = { Authorization: "Bearer " + t, Accept: "application/vnd.github+json" };
    const key = (x) => String(x || "").toLowerCase().trim();
    const label = btn ? btn.textContent : "";
    const mergeRemote = (remoteWords) => {
      const byKey = new Map(getWords().map((w) => [key(w.word), w]));
      for (const w of remoteWords || []) {
        if (!w || !w.word) continue;
        const k = key(w.word), old = byKey.get(k);
        if (!old || (w.updatedAt || 0) >= (old.updatedAt || 0)) byKey.set(k, w);
      }
      setWords(Array.from(byKey.values()));
    };
    try {
      if (btn) btn.textContent = "拉取中…";
      let id = (s.gistId || "").trim();
      if (id) {
        const r = await fetch("https://api.github.com/gists/" + id, { headers: hdr });
        if (r.ok) {
          const g = await r.json(); const f = g.files && g.files[FILE];
          if (f && f.content) { try { const d = JSON.parse(f.content); mergeRemote(Array.isArray(d) ? d : d.words); } catch (e) {} }
        } else if (r.status === 404) { id = ""; }
        else if (r.status === 401) throw new Error("token 无效");
      }
      if (btn) btn.textContent = "推送中…";
      const body = JSON.stringify({ description: "Lexis vocab sync", public: false, files: { [FILE]: { content: JSON.stringify({ words: getWords(), syncedAt: now() }) } } });
      const resp = id
        ? await fetch("https://api.github.com/gists/" + id, { method: "PATCH", headers: hdr, body })
        : await fetch("https://api.github.com/gists", { method: "POST", headers: hdr, body });
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const g = await resp.json();
      s.gistId = g.id; setSettings(s); refreshBadge();
      toast(`已同步 ✓ 共 ${getWords().length} 词`);
      go("me");
    } catch (err) { toast("同步失败:" + (err.message || err)); if (btn) btn.textContent = label || "☁️ 同步"; }
  }

  function exportData() {
    const blob = new Blob([JSON.stringify({ words: getWords(), settings: getSettings(), assess: getAssess() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "lexis-backup.json"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  // merge an incoming word list into the notebook (upsert by lowercased word);
  // accepts both shapes: a bare array (extension export) or {words,settings,assess} (h5 export).
  function mergeImport(d) {
    const incoming = Array.isArray(d) ? d : (d && d.words) || null;
    if (!incoming) return -1;
    const key = (s) => String(s || "").toLowerCase().trim();
    const byKey = new Map(getWords().map((w) => [key(w.word), w]));
    let n = 0;
    for (const w of incoming) {
      if (!w || !w.word) continue;
      const k = key(w.word), old = byKey.get(k);
      // keep the newer of the two on conflict so re-imports don't downgrade fresher data
      if (!old || (w.updatedAt || 0) >= (old.updatedAt || 0)) { byKey.set(k, w); n++; }
    }
    setWords(Array.from(byKey.values()));
    if (!Array.isArray(d)) { if (d.settings) setSettings(d.settings); if (d.assess) setAssess(d.assess); }
    return n;
  }
  function importData(e) {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const n = mergeImport(JSON.parse(r.result));
        if (n < 0) { toast("文件无效"); return; }
        toast(`已合并 ${n} 个单词 ✓`); refreshBadge(); go("me");
      } catch (x) { toast("文件无效"); }
    };
    r.readAsText(f);
  }

  // ---- quick assess (mark words known from a frequency-graded sample) ----
  function startAssess() {
    const pool = (window.LEXIS_FREQ || []).map((w) => (typeof w === "string" ? w : w.term || w.word)).filter(Boolean);
    // sample across the frequency range
    const picks = [];
    const step = Math.max(1, Math.floor(pool.length / 40));
    for (let i = 0; i < pool.length && picks.length < 40; i += step) picks.push(pool[i]);
    const known = getAssess().known.map(norm);
    const chosen = new Set(known);
    view.innerHTML = `
      <div class="card">
        <h2 class="sec">词汇量快速评估</h2>
        <p class="muted">勾选你**认识**的词（从高频到低频取样），完成后估算词汇量。</p>
        <div id="agrid" class="row" style="gap:8px">${picks.map((w) =>
          `<button class="chip" data-w="${esc(w)}" style="padding:8px 12px;font-size:14px">${esc(w)}</button>`).join("")}</div>
        <div class="row" style="margin-top:14px"><button class="btn primary" id="adone" style="flex:1">完成评估</button></div>
      </div>`;
    view.querySelectorAll("#agrid .chip").forEach((b) => b.addEventListener("click", () => {
      const w = norm(b.dataset.w);
      if (chosen.has(w)) { chosen.delete(w); b.style.background = ""; b.style.color = ""; }
      else { chosen.add(w); b.style.background = "var(--sage)"; b.style.color = "#fff"; }
    }));
    $("#adone").addEventListener("click", () => {
      const a = getAssess();
      a.known = Array.from(new Set([].concat(a.known, picks.filter((w) => chosen.has(norm(w))))));
      // rough estimate: proportion known * pool size, floored
      const ratio = picks.filter((w) => chosen.has(norm(w))).length / picks.length;
      a.estVocab = Math.round(ratio * (pool.length || 8000));
      setAssess(a); toast("估算词汇量约 " + a.estVocab.toLocaleString() + " 词"); go("me");
    });
  }

  // ---- quick-add from share sheet / shortcut: ?add=word ----------------
  async function autoAdd(rawTerm, context) {
    const term = norm(rawTerm);
    if (!term) return;
    const ctx = (context || "").trim();
    const box = $("#result");
    if ($("#q")) $("#q").value = term;
    if (box) box.innerHTML = `<div class="empty"><span class="spin"></span> 正在保存 <b>${esc(term)}</b>…</div>`;
    if (findWord(term)) {
      // already saved — just attach this new sighting's context if we have one
      if (ctx) { const ws = getWords(); const rec = ws.find((w) => w.lookup === term); if (rec && !rec.context) { rec.context = ctx; rec.updatedAt = now(); setWords(ws); } }
      toast("已经在生词本里了");
      if (box) doLookup(term);
      return;
    }
    const p = await lookup(term);
    p.context = ctx;
    saveWord(p);
    toast(ctx ? "已保存 <b>" + esc(term) + "</b>(含原句)" : "已保存 <b>" + esc(term) + "</b>");
    refreshBadge();
    if (box) doLookup(term);
  }

  // ---- paste from clipboard → look up → save (no shortcut needed) -------
  async function pasteAndSave() {
    let text = "";
    try {
      if (navigator.clipboard && navigator.clipboard.readText) text = await navigator.clipboard.readText();
    } catch (e) { text = ""; }
    text = (text || "").trim();
    if (!text) { toast("剪贴板是空的,先在别的 App 里拷贝一个单词或一句话"); return; }
    if (current !== "lookup") go("lookup");
    const alphaWords = text.match(/[A-Za-z][A-Za-z'’-]*/g) || [];
    if (!alphaWords.length) { toast("剪贴板里没有英文词"); return; }
    // single word → save straight away; a sentence → let you tap the target word
    if (alphaWords.length === 1) { autoAdd(alphaWords[0], ""); return; }
    showWordPicker(text, alphaWords);
  }

  // paste of a whole sentence: tap the target word → save it with the sentence as 原句
  function showWordPicker(sentence, words) {
    const box = $("#result"); if (!box) return;
    const html = esc(sentence).replace(/[A-Za-z][A-Za-z'’-]*/g, (m) => `<span class="pickw" data-w="${esc(m)}">${m}</span>`);
    box.innerHTML = `<div class="card"><h2 class="sec">点选要保存的词</h2>
      <div class="ex pick-sentence">${html}</div>
      <p class="muted" style="font-size:12px;margin-top:8px">点句中任意词即可保存,并把整句作为原句语境;短语请点「整句保存」。</p>
      <div class="row" style="margin-top:10px"><button class="btn" id="pickPhrase">整句作为短语保存</button></div></div>`;
    box.querySelectorAll(".pickw").forEach((n) => n.addEventListener("click", () => autoAdd(n.dataset.w, sentence)));
    const pp = $("#pickPhrase"); if (pp) pp.addEventListener("click", () => autoAdd(sentence, sentence));
  }

  // ---- boot ----
  document.querySelectorAll(".tabbar button").forEach((b) => b.addEventListener("click", () => go(b.dataset.tab)));
  go("lookup");
  refreshBadge();
  try {
    const qs = new URLSearchParams(location.search);
    const add = qs.get("add");
    if (add) {
      autoAdd(add, qs.get("ctx") || ""); // optional &ctx= carries the original sentence
      // clean the URL so a refresh doesn't re-add
      history.replaceState(null, "", location.pathname);
    }
  } catch (e) {}
})();
