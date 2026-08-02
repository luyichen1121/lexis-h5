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
  // Names / places / brands / web junk that must never be offered as vocabulary.
  // The list itself lives in vocab.js (LEXIS_PROPER_NOUNS + LEXIS_JUNK_WORDS, both
  // shared with the extension); this is only the accessor. PROPER_NOUNS below is
  // the pre-v1.52 fallback, kept so a stale cached vocab.js can't unfilter Discover.
  const isNoise = (t) => (window.lexisIsNoiseWord ? window.lexisIsNoiseWord(t) : PROPER_NOUNS.has(t));
  const PROPER_NOUNS = new Set("aaron adams alexander alice allen amanda andrea andrew angela ann anna anthony arthur ashley austin bailey barbara benjamin bennett betty beverly brandon brian bryant campbell carl carter catherine charles charlotte christina christine christopher clark coleman collins cruz daniel david davis deborah dennis diana diane donald donna douglas edward edwards elizabeth emily emma eric evans garcia gary george gerald gregory harold harris hayes henderson henry howard hughes jackson jacob james janet jason jeffrey jennifer jeremy jerry jesse jessica joan john johnson jonathan jones jose joseph joshua joyce judy julia julie justin karen keith kelly kenneth kevin kyle larry laura lauren lawrence lee lewis linda lisa madison margaret maria marie marilyn martha martin mary matthew melissa michael michelle mitchell moore morris murphy myers nancy nathan nelson nicholas nicole pamela parker patricia patrick paul perry peter peterson phillips powell rachel raymond rebecca richard richardson robert roberts robinson roger rogers ronald ross russell ryan samuel sandra sara sarah scott sean sharon stephanie stephen steven stewart susan thomas thompson timothy tyler victoria walter washington watson william williams wilson adidas adobe amazon bmw canon cisco dell disney ebay epson google hitachi honda ibm intel kodak mastercard mcdonald microsoft mitsubishi morgan nike nikon nokia panasonic paypal philip philips samsung siemens sony tiffany toyota verizon wordpress yahoo alabama alaska albuquerque america arizona arlington atlanta australia austria baltimore bangladesh beijing belgium berlin birmingham boston brazil california canada carolina chicago china cincinnati cleveland colorado connecticut dakota dallas delaware denmark denver detroit dublin edinburgh egypt england finland florida france georgia germany glasgow greece hampshire hawaii houston idaho illinois india indiana indonesia iowa ireland italy japan kansas kentucky kenya korea liverpool london louisiana madrid maine malaysia manchester maryland massachusetts melbourne memphis mesa mexico miami michigan milwaukee minneapolis minnesota mississippi missouri montana montreal morocco moscow nashville nebraska nevada nigeria norway oakland ohio oklahoma omaha oregon orlando ottawa pakistan paris pennsylvania philadelphia philippines phoenix pittsburgh poland portland portugal rome russia sacramento scotland seattle shanghai singapore spain sweden switzerland sydney tampa tennessee texas thailand tokyo toronto tucson tulsa utah vancouver vegas vermont vietnam virginia wales wichita wisconsin wyoming york".split(" "));

  // ---- storage ----------------------------------------------------------
  const K = { words: "lexis_words", settings: "lexis_settings", assess: "lexis_assess" };
  const DEFAULT_SETTINGS = { chinese: true, dailyNewLimit: 15, showExamples: true, autoEnrich: true, gistToken: "", gistId: "" };
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

  let _suppressAutoSync = false; // true while syncNow writes merged data, so we don't loop
  const setWords = (w) => { save(K.words, w); if (!_suppressAutoSync) scheduleAutoSync(); };
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
          (w.context || "").trim() ? [{ context: w.context, url: w.url, title: w.title, at: w.createdAt }] : [],
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
  // stamp every write so the gist merge can tell whose calibration is newer.
  // keepStamp = this write IS the merge result, so don't re-stamp or re-arm sync.
  const setAssess = (a, keepStamp) => {
    if (!keepStamp) a.updatedAt = now();
    save(K.assess, a);
    if (!keepStamp && !_suppressAutoSync) scheduleAutoSync();
  };

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
            if (d.definition) meanings.push({ pos: posShort(m.partOfSpeech), definition: d.definition, cn: "", example: d.example || "" });
      }
      return { phonetic, audioUs, audioUk, meanings };
    } catch (e) { return null; }
  }

  const stripTags = (s) => String(s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  const POS_SHORT = { noun: "n.", verb: "v.", adjective: "adj.", adverb: "adv.", pronoun: "pron.", preposition: "prep.",
    conjunction: "conj.", interjection: "interj.", determiner: "det.", numeral: "num.", phrase: "phr.",
    "prepositional phrase": "phr.", "verb phrase": "phr.", "noun phrase": "phr.", proverb: "谚语", idiom: "习语" };
  const posShort = (p) => POS_SHORT[String(p || "").toLowerCase()] || String(p || "").toLowerCase().slice(0, 12);

  // Wiktionary (free, CORS-open). The only source here that covers PHRASES and
  // IDIOMS, and a second supply of examples for plain words.
  async function fetchWiktionary(term) {
    const title = term.trim().replace(/\s+/g, "_");
    let j;
    try { j = await jget("https://en.wiktionary.org/api/rest_v1/page/definition/" + encodeURIComponent(title)); }
    catch (e) { return null; }
    const en = j && j.en;
    if (!Array.isArray(en) || !en.length) return null;
    const senses = [], examples = [];
    for (const block of en) {
      const pos = posShort(block.partOfSpeech);
      for (const d of block.definitions || []) {
        const def = stripTags(d.definition || "");
        if (def && def.length > 2 && senses.length < 6) senses.push({ pos, definition: def, cn: "" });
        for (const ex of d.parsedExamples || d.examples || []) {
          if (examples.length >= 4) break;
          const t = stripTags(typeof ex === "string" ? ex : ex.example || ex.text || "");
          if (t && t.length > 4) examples.push({ text: t, translation: "" });
        }
      }
    }
    return senses.length || examples.length ? { senses, examples } : null;
  }

  // Authentic example sentences from Tatoeba (human-written). The old api_v0 has
  // no CORS headers, so H5 uses the "unstable" API, which does.
  async function fetchTatoeba(term) {
    let j;
    try {
      j = await jget("https://api.tatoeba.org/unstable/sentences?lang=eng&sort=relevance&limit=20&q=" + encodeURIComponent(term));
    } catch (e) { return []; }
    const rows = (j && j.data) || [];
    let re;
    try { re = new RegExp("\\b" + term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+"), "i"); }
    catch (e) { return []; }
    const out = [];
    for (const r of rows) {
      const text = ((r && r.text) || "").trim();
      if (!text || !re.test(text)) continue;
      const n = text.split(/\s+/).length;
      if (n < 4 || n > 26) continue;            // too stubby / too rambling to learn from
      if (out.some((o) => o.text === text)) continue;
      out.push({ text, translation: "" });
      if (out.length >= 4) break;
    }
    return out;
  }

  // Chinese translation. Google's gtx endpoint is CORS-open, free and far better
  // than MyMemory; MyMemory stays as the fallback. Batched via newline-joining.
  async function translateBatch(list) {
    const items = (list || []).map((s) => String(s || "").replace(/\s+/g, " ").trim());
    if (!items.length) return [];
    try {
      const j = await withTimeout(jget("https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=" +
        encodeURIComponent(items.join("\n"))), 8000, null);
      const chunks = j && j[0];
      if (Array.isArray(chunks)) {
        const joined = chunks.map((c) => (c && c[0]) || "").join("");
        const parts = joined.split("\n").map((s) => s.trim());
        if (parts.length >= items.length) return items.map((_, i) => parts[i] || "");
      }
    } catch (e) {}
    return items.map(() => "");
  }
  async function translateOne(text) { return (await translateBatch([text]))[0] || ""; }

  // ---- Datamuse helpers: pos tag → short label, frequency → band, parse item -
  const DM_POS = { n: "n.", v: "v.", adj: "adj.", adv: "adv.", u: "", prop: "" };
  function posFromTags(tags) {
    const t = (tags || []).find((x) => DM_POS[x] !== undefined);
    return t ? DM_POS[t] : "";
  }
  // ---- ONE canonical frequency vocabulary (same band keys/labels as the extension),
  // shared by the notebook chip, the detail meter and the synonym tags.
  const FREQ_CN = { core: "极高频", "very-common": "高频", common: "常用", mid: "中频", low: "低频", rare: "生僻" };
  const FREQ_NOTE = { core: "日常核心", "very-common": "日常常用", common: "常用", mid: "偏书面", low: "书面/专业", rare: "罕见" };
  const BAND_FILL = { core: 7, "very-common": 6, common: 5, mid: 4, low: 3, rare: 2 };
  // occurrences-per-million (Datamuse "f:") → Zipf band, mirroring background.js
  function bandOf(f) {
    const zipf = Math.log10(f > 0 ? f : 1e-4) + 3;
    let key = "rare";
    if (zipf >= 6) key = "core";
    else if (zipf >= 5) key = "very-common";
    else if (zipf >= 4) key = "common";
    else if (zipf >= 3) key = "mid";
    else if (zipf >= 2) key = "low";
    return { key, cn: FREQ_CN[key] };
  }
  // full frequency profile for the headword (Datamuse, free, no key)
  async function fetchFreq(term) {
    try {
      const j = await withTimeout(jget("https://api.datamuse.com/words?max=1&md=f&sp=" + encodeURIComponent(term)), 6000, null);
      const hit = Array.isArray(j) && j[0];
      if (!hit || !hit.tags || norm(hit.word) !== norm(term)) return null;
      const ftag = hit.tags.find((t) => t.indexOf("f:") === 0);
      if (!ftag) return null;
      const perMillion = parseFloat(ftag.slice(2));
      if (!isFinite(perMillion) || perMillion <= 0) return null;
      const zipf = Math.round((Math.log10(perMillion) + 3) * 100) / 100;
      const b = bandOf(perMillion);
      // Zipf's law: rank × frequency ≈ const. Rough, hence "≈".
      let rankEst = Math.round(50000 / perMillion);
      if (rankEst >= 1000) { const mag = Math.pow(10, Math.floor(Math.log10(rankEst)) - 1); rankEst = Math.round(rankEst / mag) * mag; }
      return { perMillion: Math.round(perMillion * 1000) / 1000, zipf, band: b.key, bandCn: b.cn, rankEst };
    } catch (e) { return null; }
  }
  const fmtRank = (n) => (n == null ? "" : n > 150000 ? "150k+" : n.toLocaleString("en-US"));
  // Curated fallback band from the offline pools — Datamuse can only price single
  // words, so idioms/phrases ("ahead of the curve") would otherwise show nothing.
  let _curatedBands = null;
  function curatedFreq(term) {
    if (!_curatedBands) {
      _curatedBands = new Map();
      const T2B = { 2: "common", 3: "mid", 4: "mid", 5: "low", 6: "rare" };
      const put = (t, b) => { const k = norm(t); if (k && b && !_curatedBands.has(k)) _curatedBands.set(k, b); };
      (window.LEXIS_FREQ || []).forEach((x) => put(typeof x === "string" ? x : x.term, x && x.band));
      (window.LEXIS_SEED_FLAT || []).forEach((s) => put(s.term, T2B[s.tier]));
      (window.LEXIS_PHRASE_SEED_FLAT || []).forEach((s) => put(s.term, T2B[s.tier]));
    }
    const b = _curatedBands.get(norm(term));
    return b ? { band: b, bandCn: FREQ_CN[b], curated: true } : null;
  }
  // compact band chip (notebook list + card headline)
  function freqChip(f) {
    if (!f || !f.band) return "";
    return `<span class="mfreq freq-${f.band}">${FREQ_CN[f.band] || ""}</span>`;
  }
  // 7-segment meter for the detail / look-up card
  function freqMeterHTML(f, isPhrase) {
    if (!f || !f.band) return "";
    const filled = Math.max(1, Math.min(7, Math.round(f.curated ? BAND_FILL[f.band] || 3 : f.zipf || 3)));
    const segs = Array.from({ length: 7 }, (_, i) => `<span class="fseg ${i < filled ? "on freq-" + f.band : ""}"></span>`).join("");
    const label = FREQ_CN[f.band] + (FREQ_NOTE[f.band] ? " · " + FREQ_NOTE[f.band] : "");
    const nums = f.curated
      ? "按精选词库的常用度评估"
      : isPhrase
        ? `Zipf ${f.zipf} · ≈ ${f.perMillion}/百万词`
        : `Zipf ${f.zipf} · ≈ ${f.perMillion}/百万词 · 估算词频排名 ~${fmtRank(f.rankEst)}`;
    return `<div class="card"><h2 class="sec">词频${isPhrase ? "(短语)" : ""}</h2>
      <div class="fbars">${segs}</div>
      <div class="finfo"><span class="fband freq-${f.band}">${esc(label)}</span><span class="fnums">${nums}</span></div>
    </div>`;
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
        // real words only — Datamuse also returns bare punctuation ("resilient .")
        const ok = (x) => x && x.word && !COLLO_STOP.has(x.word) && /^[a-z][a-z'-]*$/i.test(x.word);
        const coll = [];
        (after || []).filter(ok).slice(0, 5).forEach((x) => coll.push({ phrase: term + " " + x.word }));
        (before || []).filter(ok).slice(0, 5).forEach((x) => coll.push({ phrase: x.word + " " + term }));
        out.collocations = coll.slice(0, 8);
      } catch (e) {}
    }
    return out;
  }

  // Chinese gloss: gtx first (better quality), MyMemory as fallback.
  async function fetchCn(term) {
    const g = await translateOne(term);
    if (g && !/^[\x00-\x7F]*$/.test(g)) return g;
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

  // ---- core lookup: dictionaryapi.dev + Wiktionary + Datamuse + frequency + CN gloss.
  // Wiktionary is what makes PHRASES/IDIOMS work at all here (dictionaryapi.dev is
  // single-word only) and doubles as a second supply of examples.
  async function lookup(rawTerm) {
    const term = norm(rawTerm);
    if (!term) return { error: true };
    const isPhrase = /\s/.test(term);
    const [dict, wik, dm, cn, freq] = await Promise.all([
      isPhrase ? Promise.resolve(null) : withTimeout(fetchDictionary(term), 8000, null),
      withTimeout(fetchWiktionary(term), 8000, null),
      withTimeout(fetchDatamuse(term), 8000, { synonyms: [], synonymsRich: [], family: [], lookalikes: [], collocations: [] }),
      // a word-for-word MT of an idiom is misleading ("领先于曲线"), so for phrases
      // the CN gloss comes from the translated definition in phase 2 instead.
      getSettings().chinese && !isPhrase ? withTimeout(fetchCn(term), 7000, "") : Promise.resolve(""),
      withTimeout(fetchFreq(term), 6000, null),
    ]);
    // meanings: dictionary senses first, Wiktionary filling the rest (deduped)
    const meanings = [];
    const seen = new Set();
    const addSense = (m) => {
      if (!m || !m.definition) return;
      const clean = m.definition.toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
      if (!clean) return;
      const key = clean.split(" ").slice(0, 8).join(" ");
      if (seen.has(key)) return;
      // Wiktionary often re-states one clause of a sense dictionaryapi.dev already
      // merged — drop anything wholly contained in (or containing) a kept sense.
      if (meanings.some((x) => x._k.indexOf(clean) >= 0 || clean.indexOf(x._k) >= 0)) return;
      seen.add(key);
      meanings.push({ pos: m.pos || "", definition: m.definition, cn: m.cn || "", example: m.example || "", _k: clean });
    };
    ((dict && dict.meanings) || []).forEach(addSense);
    ((wik && wik.senses) || []).forEach(addSense);
    meanings.splice(5);
    meanings.forEach((m) => delete m._k);
    // examples: dictionary usage lines + Wiktionary citations (Tatoeba comes in phase 2)
    const examples = [];
    const pushEx = (t) => {
      const s = String(t || "").trim();
      if (!s || s.length < 5 || examples.some((e) => e.text === s)) return;
      examples.push({ text: s, translation: "" });
    };
    ((dict && dict.meanings) || []).forEach((m) => m.example && pushEx(m.example));
    ((wik && wik.examples) || []).forEach((e) => pushEx(e.text));
    let morph = null;
    try { if (!isPhrase && window.lexisAnalyzeMorph) morph = window.lexisAnalyzeMorph(term); } catch (e) {}
    let suggestions = [];
    if (!meanings.length && !isPhrase) suggestions = await fetchSuggestions(term);
    return {
      term, isPhrase, cn, freq: freq || curatedFreq(term),
      phonetic: (dict && dict.phonetic) || "",
      audioUs: (dict && dict.audioUs) || "", audioUk: (dict && dict.audioUk) || "",
      meanings, examples: examples.slice(0, 4), morph,
      synonyms: dm.synonyms, synonymsRich: dm.synonymsRich, family: dm.family,
      lookalikes: dm.lookalikes, collocations: dm.collocations, suggestions,
    };
  }

  // ---- phase 2 (自动增补): top up thin example sets from Tatoeba and add the
  // Chinese line under every example + the first senses. Mutates and returns `p`.
  // Best-effort and idempotent, so it is safe to re-run on a saved word.
  async function enrichPreview(p) {
    if (!p || p.error) return p;
    const wantCn = getSettings().chinese;
    // Wiktionary often supplies bare collocations ("meticulous search") rather
    // than sentences, so top up from Tatoeba unless we already have real ones,
    // then float the sentence-like examples to the top.
    const wordy = (t) => String(t || "").trim().split(/\s+/).length >= 5;
    if ((p.examples || []).filter((e) => wordy(e.text)).length < 2) {
      const more = await withTimeout(fetchTatoeba(p.term), 8000, []);
      p.examples = (p.examples || []).concat(
        more.filter((m) => !(p.examples || []).some((e) => e.text === m.text))
      );
    }
    p.examples = (p.examples || [])
      .map((e, i) => ({ e, i }))
      .sort((a, b) => (wordy(b.e.text) ? 1 : 0) - (wordy(a.e.text) ? 1 : 0) || a.i - b.i)
      .map((x) => x.e).slice(0, 4);
    if (wantCn) {
      const needEx = (p.examples || []).filter((e) => !e.translation);
      const needSense = (p.meanings || []).slice(0, 3).filter((m) => !m.cn);
      const batch = needEx.map((e) => e.text).concat(needSense.map((m) => m.definition));
      if (batch.length) {
        const zh = await translateBatch(batch);
        needEx.forEach((e, i) => { if (zh[i]) e.translation = zh[i]; });
        needSense.forEach((m, i) => { const t = zh[needEx.length + i]; if (t) m.cn = t; });
      }
      if (!p.cn) p.cn = ((p.meanings || [])[0] || {}).cn || await withTimeout(fetchCn(p.term), 7000, "");
    }
    if (!p.freq) p.freq = (await withTimeout(fetchFreq(p.term), 6000, null)) || curatedFreq(p.term);
    p.enriched = true;
    return p;
  }
  // one-shot lookup with phase 2 already applied (used when saving without a card)
  async function lookupFull(term) { return enrichPreview(await lookup(term)); }

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
        ${freqChip(p.freq)}
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
    // 例句 — your OWN sentences first (they're the ones you'll actually remember),
    // then the fetched ones. While phase 2 is still running we keep the section
    // visible with a spinner, so a slow source never reads as "no examples".
    if (opts.examples !== false) {
      const mine = p.userExamples || [];
      const exs = p.examples || [];
      if (mine.length || exs.length || opts.pending || opts.addExample) {
        h += `<div class="card"><h2 class="sec">例句</h2>` +
          mine.map((e, i) => `<div class="ex mine">${hi(e.text)}${e.translation ? `<div class="tr">${esc(e.translation)}</div>` : ""}<div class="src">我的例句${opts.addExample ? ` · <button class="linklike" data-delex="${i}">删除</button>` : ""}</div></div>`).join("") +
          exs.map((e) => `<div class="ex">${hi(e.text)}${e.translation ? `<div class="tr">${esc(e.translation)}</div>` : ""}</div>`).join("") +
          (opts.pending ? `<div class="muted" style="font-size:12px"><span class="spin"></span> 正在增补例句与中文…</div>` : "") +
          (opts.addExample ? `<div class="row" style="margin-top:10px"><button class="btn" id="addExBtn">＋ 添加我的例句</button></div>` : "") +
          `</div>`;
      }
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
    // 词频 (detail-only, like the extension: a measured stat, not part of the meaning)
    if (opts.meter) h += freqMeterHTML(p.freq, p.isPhrase);
    return h;
  }
  function wireCard(root) {
    root.querySelectorAll("[data-audio]").forEach((b) => b.addEventListener("click", () => speak(b.dataset.w, b.dataset.audio)));
    root.querySelectorAll("[data-look]").forEach((b) => b.addEventListener("click", () => { go("lookup"); doLookup(b.dataset.look); }));
  }
  // ---- 我的例句: sentences you type in yourself ------------------------
  // Kept in `data.userExamples` and always rendered ABOVE the fetched ones. The
  // Chinese line is auto-translated (best effort) so you only type the English.
  function wireExampleEditor(root, p, onChange) {
    const add = root.querySelector("#addExBtn");
    if (add) add.addEventListener("click", async () => {
      const text = (prompt("写一句用到「" + p.term + "」的例句:", "") || "").trim();
      if (!text) return;
      p.userExamples = (p.userExamples || []).concat([{ text, translation: "", at: now() }]);
      onChange();
      if (getSettings().chinese) {
        const zh = await translateOne(text);
        const hit = (p.userExamples || []).find((e) => e.text === text);
        if (zh && hit) { hit.translation = zh; onChange(); }
      }
    });
    root.querySelectorAll("[data-delex]").forEach((b) => b.addEventListener("click", () => {
      const i = +b.dataset.delex;
      p.userExamples = (p.userExamples || []).filter((_, k) => k !== i);
      onChange();
    }));
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
      // every original sentence is kept as a dated sighting so past examples never get lost
      sightings: p.context ? [{ context: p.context, at: now(), source: p.source || "粘贴保存" }] : [],
      status: p.meanings.length || p.cn ? "ready" : "notfound",
      data: {
        phonetic: p.phonetic, audioUs: p.audioUs, audioUk: p.audioUk, cn: p.cn, freq: p.freq || null,
        meanings: p.meanings, examples: p.examples, userExamples: p.userExamples || [], morph: p.morph,
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
    return { term: w.word, isPhrase: d.isPhrase, cn: d.cn, freq: d.freq || null, phonetic: d.phonetic, audioUs: d.audioUs, audioUk: d.audioUk,
      meanings: d.meanings || [], examples: d.examples || [], userExamples: d.userExamples || [], morph: d.morph, synonyms: d.synonyms || [],
      synonymsRich: d.synonymsRich || [], family: d.family || [], lookalikes: d.lookalikes || [], collocations: d.collocations || [], extraLoaded: true };
  }
  // Non-destructive merge of a fresh preview into a saved word: only ADD or
  // improve fields, never wipe one a transiently-down source returned empty
  // (same rule as the extension's enrich()). Returns true if anything changed.
  function mergeIntoWord(id, p) {
    if (!p || p.error) return false;
    const words = getWords();
    const rec = words.find((w) => w.id === id);
    if (!rec) return false;
    const d = rec.data || (rec.data = {});
    let changed = false;
    const fill = (k, v, better) => {
      const cur = d[k];
      const has = Array.isArray(cur) ? cur.length : !!cur;
      const good = Array.isArray(v) ? v.length : !!v;
      if (!good) return;
      if (!has || (better && better(cur, v))) { d[k] = v; changed = true; }
    };
    const longer = (a, b) => (Array.isArray(b) ? b.length > (a || []).length : false);
    fill("phonetic", p.phonetic); fill("audioUs", p.audioUs); fill("audioUk", p.audioUk);
    fill("cn", p.cn); fill("freq", p.freq); fill("morph", p.morph);
    fill("meanings", p.meanings, longer);
    fill("examples", p.examples, longer);
    fill("collocations", p.collocations, longer);
    fill("synonyms", p.synonyms, longer);
    fill("synonymsRich", p.synonymsRich, longer);
    fill("family", p.family, longer);
    fill("lookalikes", p.lookalikes, longer);
    // examples/senses that gained a Chinese line count as an improvement too
    const cnGain = (arr, key) => (arr || []).some((x) => x && x[key]);
    if (p.examples && cnGain(p.examples, "translation") && !cnGain(d.examples, "translation")) { d.examples = p.examples; changed = true; }
    if (p.meanings && cnGain(p.meanings, "cn") && !cnGain(d.meanings, "cn")) { d.meanings = p.meanings; changed = true; }
    if (changed) {
      if (rec.status === "notfound" && (d.meanings || []).length) rec.status = "ready";
      rec.updatedAt = now();
      setWords(words);
    }
    return changed;
  }

  // ---- 清理 / 规整 -------------------------------------------------------
  // Drops entries that are not vocabulary at all (surnames, cities, brands, web
  // junk — the shared lexisIsNoiseWord list) and folds inflected duplicates onto
  // their base form, keeping the richer entry and inheriting the other's original
  // sentences so nothing you captured is lost.
  function tidyNotebook() {
    const words = getWords();
    const noise = isNoise;
    const kept = [], drop = [];
    words.forEach((w) => (noise(norm(w.word)) ? drop : kept).push(w));
    // fold plural / inflected duplicates onto the base form we already have
    const byKey = new Map();
    kept.forEach((w) => byKey.set(norm(w.word), w));
    const richness = (w) => {
      const d = w.data || {};
      return (d.meanings || []).length * 3 + (d.examples || []).length + (d.userExamples || []).length * 5 + (d.cn ? 2 : 0);
    };
    let merged = 0;
    const gone = new Set();
    for (const w of kept) {
      const k = norm(w.word);
      if (gone.has(w.id)) continue;
      const cands = (window.lexisStemCandidates ? window.lexisStemCandidates(k) : []);
      for (const c of cands) {
        const base = byKey.get(c);
        if (!base || base === w || gone.has(base.id)) continue;
        const keep = richness(base) >= richness(w) ? base : w;
        const lose = keep === base ? w : base;
        keep.sightings = (keep.sightings || []).concat(lose.sightings || [],
          lose.context && !(lose.sightings || []).length ? [{ context: lose.context, at: lose.createdAt, source: "合并" }] : []);
        if (keep.data && lose.data && !(keep.data.userExamples || []).length && (lose.data.userExamples || []).length)
          keep.data.userExamples = lose.data.userExamples;
        keep.updatedAt = now();
        gone.add(lose.id); merged++;
        break;
      }
    }
    const out = kept.filter((w) => !gone.has(w.id));
    if (drop.length || merged) setWords(out);
    return { removed: drop.length, merged };
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
        `<div class="item" data-open="${w.id}"><span class="w serif">${esc(w.word)}</span>${freqChip(w.data && w.data.freq)}<span class="meta">${esc((w.data && w.data.cn) || "")}</span></div>`).join("");
    view.querySelectorAll("[data-open]").forEach((n) => n.addEventListener("click", () => openDetail(n.dataset.open)));
  }

  // ctx = the sentence the word came from, when the caller has one (?q=&ctx=,
  // mirroring the extension's #look/<term>/<context>). It is shown above the
  // card AND carried into saveWord, so 原句语境 survives the save.
  async function doLookup(term, ctx) {
    term = norm(term);
    if (!term) return;
    // 查词与生词本本质是同一件事:已经收藏的词直接打开它的生词本页面(释义/例句都在,
    // 外加原句语境、掌握进度、我的例句和删除按钮),而不是再给一张只读的查词卡。
    // 带 ctx 的粘贴/快捷指令流程除外——那一步要先让你确认是否追加这条原句。
    const already = findWord(term);
    if (already && !ctx) { openDetail(already.id); return; }
    const q = $("#q"); if (q) q.value = term;
    const box = $("#result");
    box.innerHTML = `<div class="empty"><span class="spin"></span> 查询中…</div>`;
    const seq = ++doLookup._seq;
    const p = await lookup(term);
    if (seq !== doLookup._seq) return;             // a newer look-up已经开始
    if (ctx) p.context = ctx;

    // paint the card; called twice — once with the fast core, once after 自动增补
    const paint = (pending) => {
      const existing = findWord(term);
      // is this exact sentence already recorded on the saved word?
      const ctxKnown = !ctx || (existing && (existing.sightings || []).some((s) => (s.context || "").trim() === ctx) || (existing && (existing.context || "").trim() === ctx));
      let saveBtn;
      if (!existing) saveBtn = `<button class="btn sage" id="saveBtn">保存到生词本</button>`;
      else if (ctx && !ctxKnown) saveBtn = `<button class="btn sage" id="appendBtn">＋ 添加此原句</button>`;
      else saveBtn = `<button class="btn" id="openNbBtn">📖 已在生词本 · 打开</button>`;
      const ctxCard = ctx ? contextCardHTML({ word: p.term || term, context: ctx, createdAt: now() }) : "";
      box.innerHTML = ctxCard + cardHTML(p, { saveBtn, pending, meter: true, addExample: true });
      wireCard(box);
      wireExampleEditor(box, p, () => paint(pending));
      const sb = $("#saveBtn");
      if (sb) sb.addEventListener("click", () => {
        if (ctx) p.source = "粘贴保存";
        if (saveWord(p)) { toast(ctx ? "已保存 <b>" + esc(p.term) + "</b>(含原句)" : "已保存 <b>" + esc(p.term) + "</b>"); paint(false); refreshBadge(); }
        else toast("已经在生词本里了");
      });
      const ob = $("#openNbBtn");
      if (ob) ob.addEventListener("click", () => { const w = findWord(term); if (w) openDetail(w.id); });
      const ab = $("#appendBtn");
      if (ab) ab.addEventListener("click", () => {
        const ws = getWords(); const rec = ws.find((w) => w.lookup === term);
        if (!rec) return;
        rec.sightings = rec.sightings || (rec.context ? [{ context: rec.context, at: rec.createdAt || now(), source: "粘贴保存" }] : []);
        rec.sightings.unshift({ context: ctx, at: now(), source: "粘贴保存" });
        if (!rec.context) rec.context = ctx;
        rec.updatedAt = now(); setWords(ws); refreshBadge();
        toast("已添加原句到 <b>" + esc(term) + "</b>");
        paint(false);
      });
    };
    const wantExtra = getSettings().autoEnrich !== false && !p.error;
    paint(wantExtra);
    if (!wantExtra) return;
    await enrichPreview(p);
    if (seq !== doLookup._seq) return;
    paint(false);
    // if the word was saved from the core card, fold the supplemented data in too
    const saved = findWord(term);
    if (saved) mergeIntoWord(saved.id, p);
  }
  doLookup._seq = 0;

  // ---- NOTEBOOK ----
  let nbFilter = "all", nbScene = null, nbSort = "new", nbQuery = "", nbKind = "all", nbCtrlsOpen = false;
  const NB_KINDS = [["all", "全部"], ["word", "单词"], ["phrase", "词组"], ["idiom", "习语"]];
  // 单词 / 词组 / 习语 — a saved entry is an idiom when the curated idiom sets know
  // it (or it is a figurative multi-word expression), a 词组 when it is any other
  // multi-word entry, otherwise a plain 单词.
  const _kindCache = new Map();
  function nbKindOf(w) {
    const t = norm(w.word || "");
    if (_kindCache.has(t)) return _kindCache.get(t);
    let k = "word";
    if (/\s/.test(t)) {
      const idioms = window.LEXIS_IDIOM_SCENE || {};
      const seedIdiom = (window.LEXIS_SEED_FLAT || []).some((s) => s.idiom && norm(s.term) === t);
      k = (idioms[t] || seedIdiom) ? "idiom" : "phrase";
    }
    _kindCache.set(t, k);
    return k;
  }
  // mastery status from the SRS state (mirrors the extension's masteryOf tiers)
  function masteryOfH5(w) {
    const s = w.srs || {};
    if ((s.interval || 0) >= 21) return { key: "mastered", cn: "已掌握" };
    if ((s.lapses || 0) >= 4) return { key: "leech", cn: "易忘" };
    if ((s.reps || 0) >= 3) return { key: "familiar", cn: "熟悉" };
    if ((s.reps || 0) >= 1) return { key: "learning", cn: "学习中" };
    return { key: "new", cn: "新词" };
  }
  const NB_BAND_ORDER = { core: 0, "very-common": 1, common: 2, mid: 3, low: 4, rare: 5 };
  const NB_SORTS = [["new", "最新保存"], ["freq", "词频"], ["due", "待复习"], ["az", "字母"]];
  function nbSortList(list) {
    const l = list.slice();
    if (nbSort === "freq") {
      // by band first (常用→生僻), then by corpus rank inside the band
      return l.sort((a, b) => {
        const ba = NB_BAND_ORDER[(a.data && a.data.freq || {}).band];
        const bb = NB_BAND_ORDER[(b.data && b.data.freq || {}).band];
        return (ba == null ? 9 : ba) - (bb == null ? 9 : bb) || freqRankH5(a.word) - freqRankH5(b.word);
      });
    }
    if (nbSort === "due") return l.sort((a, b) => ((a.srs && a.srs.due) || 0) - ((b.srs && b.srs.due) || 0));
    if (nbSort === "az") return l.sort((a, b) => a.word.localeCompare(b.word));
    return l.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); // "new" (default)
  }
  function renderNotebook() {
    const words = getWords();
    const kindCounts = { all: words.length, word: 0, phrase: 0, idiom: 0 };
    words.forEach((w) => { kindCounts[nbKindOf(w)]++; });
    view.innerHTML = `
      <div class="subtabs" id="nbkinds">
        ${NB_KINDS.map(([k, cn]) => `<button data-k="${k}" class="${nbKind === k ? "on" : ""}">${cn} ${kindCounts[k]}</button>`).join("")}
      </div>
      <div class="subtabs" id="nbtabs">
        <button data-f="all" class="${nbFilter === "all" ? "on" : ""}">全部</button>
        <button data-f="due" class="${nbFilter === "due" ? "on" : ""}">待复习 ${dueWords().length}</button>
        <button data-f="learning" class="${nbFilter === "learning" ? "on" : ""}">学习中</button>
        <button data-f="mastered" class="${nbFilter === "mastered" ? "on" : ""}">已掌握</button>
      </div>
      <form class="search" id="nbsearch" style="margin-bottom:10px">
        <input id="nbq" placeholder="搜索生词本,或输入新词直接查…" value="${esc(nbQuery)}" autocomplete="off" autocapitalize="off" spellcheck="false">
        <button class="btn primary" type="submit">查</button>
      </form>
      <div class="sortbar" id="nbsort">
        <button class="catf ctrl-toggle" id="nbMore">筛选 · 排序 ▾</button>
        <span class="ctrl-wrap">排序:${NB_SORTS.map(([k, cn]) =>
          `<button class="catf${nbSort === k ? " on" : ""}" data-s="${k}">${cn}</button>`).join("")}
          <span class="muted" style="font-size:12px;flex-basis:100%">词后的标签是<b>词频</b>:极高频 / 高频 / 常用 / 中频 / 低频 / 生僻——越靠前越值得先掌握。</span>
        </span>
      </div>
      <div id="nbcats" class="ctrl-wrap"></div>
      <div id="nblist"></div>`;
    view.querySelectorAll("#nbkinds button").forEach((b) => b.addEventListener("click", () => { nbKind = b.dataset.k; nbScene = null; renderNotebook(); }));
    view.querySelectorAll("#nbtabs button").forEach((b) => b.addEventListener("click", () => { nbFilter = b.dataset.f; renderNotebook(); }));
    // one toggle instead of three permanent rows of controls above the list
    $("#nbMore").addEventListener("click", () => {
      nbCtrlsOpen = !nbCtrlsOpen;
      view.querySelectorAll(".ctrl-wrap").forEach((n) => n.classList.toggle("open", nbCtrlsOpen));
      $("#nbMore").textContent = nbCtrlsOpen ? "收起 ▴" : "筛选 · 排序 ▾";
    });
    if (nbCtrlsOpen) { view.querySelectorAll(".ctrl-wrap").forEach((n) => n.classList.add("open")); $("#nbMore").textContent = "收起 ▴"; }
    view.querySelectorAll("#nbsort [data-s]").forEach((b) => b.addEventListener("click", () => { nbSort = b.dataset.s; renderNotebook(); }));
    $("#nbsearch").addEventListener("submit", (e) => {
      e.preventDefault();
      const t = nbQuery.trim();
      if (t) { go("lookup"); doLookup(t); }      // 生词本里直接查词:已收藏的会打开词条,新词走查询
    });
    const qi = $("#nbq");
    qi.addEventListener("input", () => { nbQuery = qi.value; drawNbList(); });

    function drawNbList() {
      let list = words.slice();
      if (nbKind !== "all") list = list.filter((w) => nbKindOf(w) === nbKind);
      if (nbFilter === "due") list = list.filter((w) => (w.srs ? w.srs.due : 0) <= now());
      else if (nbFilter === "learning") list = list.filter((w) => ["learning", "familiar", "leech"].includes(masteryOfH5(w).key));
      else if (nbFilter === "mastered") list = list.filter((w) => masteryOfH5(w).key === "mastered");
      const q = nbQuery.trim().toLowerCase();
      if (q) list = list.filter((w) => {
        const d = w.data || {};
        return w.word.toLowerCase().includes(q) || (d.cn || "").toLowerCase().includes(q) ||
          (w.context || "").toLowerCase().includes(q) ||
          (d.meanings || []).some((m) => (m.definition || "").toLowerCase().includes(q));
      });
      // category chip bar (built from the pre-scene list, so counts reflect everything)
      const cats = $("#nbcats");
      if (cats) {
        cats.innerHTML = list.length ? catBarH5(list.map((w) => w.word), "wordNb", nbScene, "data-nbscene") : "";
        cats.querySelectorAll("[data-nbscene]").forEach((b) => b.addEventListener("click", () => {
          const key = b.dataset.nbscene;
          if (key === "__more__") { b.parentElement.classList.add("open"); b.remove(); return; }
          nbScene = (key === "__all__" || nbScene === key) ? null : key;
          drawNbList();
        }));
      }
      if (nbScene) list = list.filter((w) => { const k = sceneOfH5(w.word, "wordNb"); return (k ? k.key : "_other") === nbScene; });
      list = nbSortList(list);
      const box = $("#nblist");
      if (!list.length) {
        box.innerHTML = q
          ? `<div class="empty"><div class="big">🔍</div>生词本里没有「${esc(q)}」。<div class="row" style="justify-content:center;margin-top:12px"><button class="btn primary" id="nbLookup">查一下「${esc(q)}」</button></div></div>`
          : `<div class="empty"><div class="big">📖</div>${nbScene ? "这个分类下暂无生词,点「全部」。" : "还没有生词。去「查词」保存几个吧。"}</div>`;
        const nl = $("#nbLookup");
        if (nl) nl.addEventListener("click", () => { go("lookup"); doLookup(q); });
        return;
      }
      box.innerHTML = list.map((w) => {
        const d = w.data || {};
        const m = masteryOfH5(w);
        const dueIn = w.srs && w.srs.due > now() ? "下次 " + intervalLabel(Math.round((w.srs.due - now()) / DAY)) : "待复习";
        // the old status dot said nothing useful — the frequency band does
        const tag = w.status === "notfound" ? `<span class="mfreq nf">未找到</span>` : freqChip(d.freq);
        return `<div class="item" data-open="${w.id}">
          <div style="min-width:0"><div class="w serif">${esc(w.word)} ${tag} <span class="mstat m-${m.key}">${m.cn}</span></div><div class="meta">${esc(d.cn || ((d.meanings || [])[0] && d.meanings[0].definition) || "")}</div></div>
          <span class="st chip">${dueIn}</span></div>`;
      }).join("");
      box.querySelectorAll("[data-open]").forEach((n) => n.addEventListener("click", () => openDetail(n.dataset.open)));
      backfillFreq(list);
      sweepIncomplete();          // quietly top up whatever is still thin
    }
    drawNbList();
  }

  // 自动增补: words saved before frequency existed (or synced in from elsewhere)
  // get their band filled in quietly, a few per render, then the list redraws.
  let _backfilling = false;
  async function backfillFreq(list) {
    if (_backfilling || getSettings().autoEnrich === false) return;
    const todo = list.filter((w) => w.data && !w.data.freq && !w.data.freqTried).slice(0, 8);
    if (!todo.length) return;
    _backfilling = true;
    let hit = false;
    try {
      for (const w of todo) {
        const f = (await fetchFreq(w.word)) || curatedFreq(w.word);
        const words = getWords();
        const rec = words.find((x) => x.id === w.id);
        if (!rec) continue;
        rec.data = rec.data || {};
        if (f) { rec.data.freq = f; hit = true; } else { rec.data.freqTried = true; }
        rec.updatedAt = now();
        setWords(words);
      }
    } catch (e) {} finally { _backfilling = false; }
    if (hit && current === "notebook") renderNotebook();
  }

  // ---- background sweep: keep the whole notebook complete -----------------
  // Anything that fails needsSupplement() gets a full re-fetch, quietly, a few at
  // a time with a pause between them so it never competes with what you're doing.
  // Each word is attempted at most twice ever (data.fixTries), so a term that
  // genuinely has no examples doesn't get re-fetched forever.
  let _sweeping = false;
  const SWEEP_BATCH = 4, SWEEP_GAP = 1500, SWEEP_MAX_TRIES = 2;
  function incompleteWords() {
    return getWords().filter((w) => (w.data && (w.data.fixTries || 0) < SWEEP_MAX_TRIES) && needsSupplement(w));
  }
  async function sweepIncomplete(opts) {
    opts = opts || {};
    if (_sweeping || (getSettings().autoEnrich === false && !opts.manual)) return 0;
    const todo = incompleteWords().slice(0, opts.manual ? 40 : SWEEP_BATCH);
    if (!todo.length) { if (opts.manual) toast("生词本里的内容都是完整的 ✓"); return 0; }
    _sweeping = true;
    let fixed = 0;
    try {
      for (let i = 0; i < todo.length; i++) {
        const w = todo[i];
        if (opts.onProgress) opts.onProgress(i + 1, todo.length, w.word);
        const p = await lookupFull(w.word);
        if (mergeIntoWord(w.id, p)) fixed++;
        const ws = getWords(); const rec = ws.find((x) => x.id === w.id);
        if (rec) { rec.data = rec.data || {}; rec.data.fixTries = (rec.data.fixTries || 0) + 1; setWords(ws); }
        if (i < todo.length - 1) await new Promise((r) => setTimeout(r, SWEEP_GAP));
      }
    } catch (e) {} finally { _sweeping = false; }
    if (fixed && (current === "notebook" || current === "me")) go(current);
    return fixed;
  }

  // original-sentence card for the saved-word detail — shows every kept sighting
  // (each with its saved date + source label), headword highlighted.
  function contextCardHTML(w) {
    let list = (w.sightings || []).slice();
    list = list.filter((s) => (s.context || "").trim());
    // a merge can leave behind sightings with no text — don't let that hide the
    // entry's own original sentence
    if (!list.length && (w.context || "").trim()) list = [{ context: w.context, at: w.createdAt, source: "" }];
    if (!list.length) return "";
    const hi = (t) => { try { return esc(t).replace(new RegExp("(" + w.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig"), "<mark>$1</mark>"); } catch (e) { return esc(t); } };
    const fmt = (at) => { try { const d = new Date(at); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); } catch (e) { return ""; } };
    const rows = list.map((s) => {
      const meta = [s.source, s.at ? fmt(s.at) : ""].filter(Boolean).join(" · ");
      return `<div class="ex">${hi(s.context)}${meta ? `<div class="src">来源:${esc(meta)}</div>` : ""}</div>`;
    }).join("");
    return `<div class="card"><h2 class="sec">原句语境${list.length > 1 ? ` · ${list.length}` : ""}</h2>${rows}</div>`;
  }

  // 掌握进度 — the SRS state the review engine already tracks, made visible
  function masteryCardHTML(w) {
    const s = w.srs || {};
    const iv = s.interval || 0;
    const pct = Math.min(100, Math.round((iv / 21) * 100)); // 21 天间隔 = 判定已掌握
    const next = s.due ? (s.due <= now() ? "现在" : intervalLabel(Math.max(1, Math.round((s.due - now()) / DAY)))) : "现在";
    return `<div class="card"><h2 class="sec">掌握进度</h2>
      <div class="meter"><i style="width:${pct}%"></i></div>
      <div class="muted" style="font-size:12px">连续答对 <b>${s.reps || 0}</b> 次 · 当前间隔 <b>${iv ? iv + " 天" : "未开始"}</b> · 下次复习 <b>${esc(next)}</b>${s.lapses ? ` · 曾卡壳 ${s.lapses} 次` : ""}</div>
    </div>`;
  }
  // a saved word is "thin" if the look-up sections it should have are missing —
  // this is what triggers the silent 自动增补 when you open it.
  function needsSupplement(w) {
    const d = w.data || {};
    if (!d.freq && !d.freqTried) return true;
    if (!(d.meanings || []).length) return true;
    if (!(d.examples || []).length) return true;
    if (getSettings().chinese && !(d.examples || []).some((e) => e.translation)) return true;
    if (!(d.collocations || []).length && !(d.synonymsRich || []).length) return true;
    return false;
  }

  // re-run the full look-up for a saved word and fold the result in
  // non-destructively. Tried at most once per word per session so a word that
  // genuinely has no examples doesn't re-fetch on every open.
  const _supplemented = new Set();
  async function supplement(id, manual) {
    if (!manual && _supplemented.has(id)) return;
    _supplemented.add(id);
    const w = getWords().find((x) => x.id === id);
    if (!w) return;
    if (manual) toast("正在增补…");
    const p = await lookupFull(w.word);
    const changed = mergeIntoWord(id, p);
    if (manual) toast(changed ? "已增补 ✓" : "没有可增补的新内容");
    if (current === "notebook" || current === "lookup") { if ($("#det")) openDetail(id); }
  }

  function openDetail(id) {
    const w = getWords().find((x) => x.id === id);
    if (!w) return;
    const auto = getSettings().autoEnrich !== false && !_supplemented.has(id) && needsSupplement(w);
    view.innerHTML = `<div class="row" style="margin-bottom:12px">
        <button class="btn" id="back">← 返回</button>
        <button class="btn" id="sup" style="margin-left:auto">${auto ? "增补中…" : "增补"}</button>
        <button class="btn" id="edit">编辑</button>
        <button class="btn" id="del">删除</button>
      </div><div id="det"></div>`;
    const isMastered = masteryOfH5(w).key === "mastered";
    const prev = wordToPreview(w);
    $("#det").innerHTML = cardHTML(prev, { examples: getSettings().showExamples, meter: true, pending: auto, addExample: true })
      + contextCardHTML(w) + masteryCardHTML(w)
      + `<div class="card"><h2 class="sec">操作</h2><div class="row">
          <button class="btn" id="revNow">立即复习</button>
          <button class="btn ${isMastered ? "" : "sage"}" id="tglMaster">${isMastered ? "取消已掌握" : "标为已掌握"}</button>
          <button class="btn" id="resetProg">重置进度</button>
        </div></div>`;
    wireCard($("#det"));
    // 我的例句 edits write straight through to the saved word
    wireExampleEditor($("#det"), prev, () => {
      const ws = getWords(); const rec = ws.find((x) => x.id === id);
      if (!rec) return;
      rec.data = rec.data || {};
      rec.data.userExamples = prev.userExamples || [];
      rec.updatedAt = now(); setWords(ws);
      openDetail(id);
    });
    const patchSrs = (fn) => {
      const ws = getWords(); const rec = ws.find((x) => x.id === id);
      if (!rec) return;
      rec.srs = fn(rec.srs || {}); rec.updatedAt = now(); setWords(ws); refreshBadge();
    };
    $("#revNow").addEventListener("click", () => { patchSrs((s) => Object.assign({}, s, { due: now() })); go("review"); });
    $("#tglMaster").addEventListener("click", () => {
      patchSrs((s) => isMastered
        ? { due: now(), interval: 0, ease: s.ease || 2.5, reps: 0, lapses: s.lapses || 0, last: now() }
        : { due: now() + 30 * DAY, interval: 30, ease: s.ease || 2.5, reps: Math.max(s.reps || 0, 3), lapses: s.lapses || 0, last: now() });
      toast(isMastered ? "已取消" : "已标为已掌握"); openDetail(id);
    });
    $("#resetProg").addEventListener("click", () => {
      patchSrs(() => ({ due: now(), interval: 0, ease: 2.5, reps: 0, lapses: 0, last: 0 }));
      toast("进度已重置"); openDetail(id);
    });
    $("#sup").addEventListener("click", () => supplement(id, true));
    if (auto) supplement(id, false);
    $("#back").addEventListener("click", () => go(current === "lookup" ? "lookup" : "notebook"));
    $("#del").addEventListener("click", () => { if (confirm("删除 “" + w.word + "”？")) { removeWord(id); toast("已删除"); go("notebook"); } });
    $("#edit").addEventListener("click", async () => {
      const next = cleanTerm(prompt("修改词条：", w.word) || "");
      if (!next || next === w.word) return;
      toast("正在重新查询…");
      const p = await lookupFull(next);       // refetch meanings + examples for the new term
      const words = getWords();
      const rec = words.find((x) => x.id === id);
      if (!rec) return;
      rec.word = p.term || next;
      rec.lookup = norm(rec.word);
      rec.updatedAt = now();
      rec.status = (p.meanings || []).length || p.cn ? "ready" : "notfound";
      rec.data = Object.assign({}, rec.data, {
        phonetic: p.phonetic, audioUs: p.audioUs, audioUk: p.audioUk, cn: p.cn, freq: p.freq || null, freqTried: false,
        meanings: p.meanings, examples: p.examples, morph: p.morph,
        synonyms: p.synonyms, synonymsRich: p.synonymsRich, family: p.family,
        lookalikes: p.lookalikes, collocations: p.collocations, isPhrase: p.isPhrase,
      });
      setWords(words);
      _supplemented.delete(id);
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
          ${(d.meanings || []).slice(0, 2).map((m) => `<div class="mean" style="text-align:left">${m.pos ? `<span class="pos">${esc(m.pos)}</span> ` : ""}${esc(m.definition)}${m.cn ? `<div class="cn">${esc(m.cn)}</div>` : ""}</div>`).join("")}
          ${(d.examples || []).slice(0, 1).map((e) => `<div class="ex" style="text-align:left">${esc(e.text)}${e.translation ? `<div class="tr">${esc(e.translation)}</div>` : ""}</div>`).join("")}`
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
      // 短语 are classified by their SHAPE (语法结构/短语动词/介词短语/连接·语篇/固定表达),
      // not by topic — "have to" and "such as" aren't about a subject, and the
      // shape is what tells you how to produce them.
      if (kind === "phrases" && window.lexisPhraseType) {
        const pt = window.lexisPhraseType(term);
        out = pt ? { key: pt, cn: (window.LEXIS_PTYPE_CN || {})[pt] || pt } : null;
        _sceneCacheH5.set(ck, out); return out;
      }
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
    // 20 scenes is 3 rows of chips on a phone. Show the 6 biggest (plus whichever
    // one is active) and hide the tail behind 更多 — the long tail is rarely what
    // you want and it pushed the actual list below the fold.
    const sorted = [...counts.entries()].sort((a, b) => b[1].n - a[1].n);
    const HEAD = 6;
    sorted.forEach(([key, v], i) => {
      if (i < HEAD || active === key) chips.push(chip(key, v.cn, v.n, active === key, key === "_other"));
    });
    const restN = sorted.length - Math.min(HEAD, sorted.length);
    const rest = restN > 0
      ? `<button class="catf more" ${attr}="__more__">更多 ${restN} 类 ▾</button>` +
        `<span class="catmore">${sorted.slice(HEAD).filter(([k]) => k !== active)
          .map(([key, v]) => chip(key, v.cn, v.n, false, key === "_other")).join("")}</span>`
      : "";
    return `<div class="catbar">${chips.join("")}${rest}</div>`;
  }
  function knownSet() {
    const s = new Set(getAssess().known.map(norm));
    getWords().forEach((w) => s.add(w.lookup));
    return s;
  }
  // Ordering hint from the reading assessment: put the frequency bands you scored
  // WORST on first, so Discover shows words you probably don't know instead of
  // marching from the top of the pool every time.
  function weakBandOrder() {
    const a = getAssess();
    const est = a.reading ? readingEstimate(a.reading) : null;
    if (!est) return null;
    const weak = est.bands.filter((b) => b.measured && b.key !== "beyond" && b.pct < 0.95)
      .sort((x, y) => x.pct - y.pct).map((b) => b.key);
    return weak.length ? weak : null;
  }
  // Where does this learner's frontier sit inside the 8k pool? LEXIS_FREQ index i
  // ≈ overall rank 2500 + i, so an estimate of 14k means the whole pool is below
  // them — in that case there is nothing useful left to recommend by frequency and
  // the honest move is to say so and push them toward phrases/idioms.
  function levelWindow(poolLen) {
    const a = getAssess();
    const est = a.reading ? readingEstimate(a.reading) : null;
    const v = est ? est.estVocab : a.estVocab || 0;
    if (!v) return { mode: "none", estVocab: 0 };
    const startIdx = Math.max(0, Math.round(v - 2500));
    if (poolLen - startIdx < 250) return { mode: "beyond", estVocab: v, startIdx: 0, left: Math.max(0, poolLen - startIdx) };
    return { mode: "above", estVocab: v, startIdx, left: poolLen - startIdx };
  }

  function discoverPool(kind) {
    const known = knownSet();
    const term = (x) => (typeof x === "string" ? x : x.term || x.phrase || x.word || (Array.isArray(x) ? x[0] : ""));
    if (kind === "words") {
      let pool = (window.LEXIS_FREQ || []).filter((x) => term(x) && !known.has(norm(term(x))) && !isNoise(norm(term(x))));
      const lvl = levelWindow(pool.length);
      // Start at your level instead of at the top of the pool — otherwise page 1
      // is always the most common words, which is why Discover felt too easy.
      if (lvl.mode === "above") pool = pool.slice(lvl.startIdx);
      // rarest-first, but skip the last ~8% of the corpus — that tail is mostly
      // artefacts, not vocabulary, and leading with it makes the list look broken
      else if (lvl.mode === "beyond") pool = pool.slice(0, Math.floor(pool.length * 0.92)).reverse();
      const order = weakBandOrder();
      if (!order) return pool.map(term);
      const rk = new Map(order.map((k, i) => [k, i]));
      // stable sort → still frequency-ordered inside each band
      return pool.slice().sort((a2, b2) => (rk.has(a2.band) ? rk.get(a2.band) : 99) - (rk.has(b2.band) ? rk.get(b2.band) : 99)).map(term);
    }
    if (kind === "phrases") {
      // The PHRASE List (498 non-transparent multiword expressions, Martinez &
      // Schmitt) first, in corpus-frequency order — these are the chunks behind
      // "I know the words but can't say it" — then the curated collocations.
      const pl = (window.LEXIS_PHRASE_LIST || []).map((x) => x.term);
      const seed = (window.LEXIS_PHRASE_SEED_FLAT || []).map(term);
      const seen = new Set();
      return pl.concat(seed).filter((t) => {
        const k = norm(t);
        if (!k || known.has(k) || seen.has(k)) return false;
        seen.add(k); return true;
      });
    }
    if (kind === "idioms") return Object.keys(window.LEXIS_IDIOM_SCENE || {}).filter((p) => !known.has(norm(p)));
    return [];
  }
  // one honest line telling you WHY this batch is what it is
  function discoverHint() {
    if (dTab === "phrases") return "按语料词频排序的 <b>498 条高频固定表达</b>(PHRASE List)——「单词都认识却说不出来」的就是这些。分类按<b>结构</b>而不是话题,每条给一句真实例句。";
    if (dTab === "idioms") return "地道习语,按常用度排序,分类是使用场景。先看懂例句里的用法,再点「学习」加入生词本。";
    const w = weakBandOrder();
    const lvl = levelWindow((window.LEXIS_FREQ || []).length);
    let s2 = "按词频推荐,标「已掌握」同步评估,「学习」加入生词本。";
    if (lvl.mode === "beyond")
      s2 += `<br>你的估算词汇量 <b>${lvl.estVocab.toLocaleString()}</b> 已经<b>超过这个 8 千词库</b>,所以已切换成<b>生僻词优先</b>。真正的提升空间在 <b>短语搭配</b> 和 <b>习语</b> 两个 tab。`;
    else if (lvl.mode === "above")
      s2 += `<br>已跳过你水平以下的词,从 <b>≈${lvl.estVocab.toLocaleString()} 词</b>处开始推,还剩 ${lvl.left.toLocaleString()} 个。`;
    if (w) s2 += `<br>并优先推「${w.map((k) => FREQ_CN[k] || k).join(" › ")}」——你评估里最薄弱的频段。`;
    return s2;
  }

  function renderDiscover() {
    view.innerHTML = `
      <div class="subtabs" id="dtabs">
        <button data-d="words" class="${dTab === "words" ? "on" : ""}">单词</button>
        <button data-d="phrases" class="${dTab === "phrases" ? "on" : ""}">短语搭配</button>
        <button data-d="idioms" class="${dTab === "idioms" ? "on" : ""}">习语</button>
      </div>
      <p class="muted" style="font-size:13px;margin-top:0">${discoverHint()}</p>
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
        if (key === "__more__") { b.parentElement.classList.add("open"); b.remove(); return; }
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
      // same classifier the category chips use, so a card's tag always matches the
      // bar above it (phrases → structural type, not topic)
      const sc = sceneOfH5(term, dTab);
      const scene = sc ? sc.cn : "";
      // an example sentence is the single most useful thing on a chunk card —
      // you learn a phrase from seeing it used, not from the phrase alone
      const ex = (window.LEXIS_PHRASE_EXAMPLE && window.LEXIS_PHRASE_EXAMPLE.get(norm(term))) || "";
      const hiEx = ex ? esc(ex).replace(new RegExp("(" + term.split(/\s*\/\s*/)[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+") + "\\w*)", "i"), "<mark>$1</mark>") : "";
      return `<div class="study${ex ? " has-ex" : ""}" data-term="${esc(term)}">
        <span class="term serif">${esc(term)}</span>
        ${scene ? `<span class="g">${esc(scene)}</span>` : ""}
        <span class="act">
          <button class="btn" data-act="learn">学习</button>
          <button class="btn sage" data-act="master">已掌握</button>
        </span>
        ${hiEx ? `<div class="study-ex">${hiEx}</div>` : ""}</div>`;
    }).join("");
    box.querySelectorAll(".study").forEach((row) => {
      const term = row.dataset.term;
      row.querySelector('[data-act="learn"]').addEventListener("click", async () => {
        toast("查询中…"); const p = await lookupFull(term);
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
    const rEst = a.reading ? readingEstimate(a.reading) : null;
    const incomplete = incompleteWords().length;
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
        <div class="stat">${(rEst ? rEst.estVocab : knownN).toLocaleString()}</div>
        <div class="muted">${rEst
          ? `阅读评估 · 已读 ${(a.reading.passages || []).length} 篇 · 置信度 ${({ high: "高", mid: "中", low: "低" })[rEst.confidence]}(目标 15,000 词族)`
          : "已标记掌握 + 生词本(目标 15,000 词族)· 还没做过评估"}</div>
        <div class="meter"><i style="width:${Math.min(100, ((rEst ? rEst.estVocab : knownN) / 15000) * 100)}%"></i></div>
        <div class="row" style="margin-top:8px">
          <button class="btn primary" id="readAssessBtn">📖 阅读评估${rEst ? "(继续)" : ""}</button>
          <button class="btn" id="assessBtn">逐词勾选</button>
        </div>
      </div>
      <div class="card">
        <h2 class="sec">设置</h2>
        <label class="set">中文释义 <input type="checkbox" id="setCn" ${s.chinese ? "checked" : ""}></label>
        <label class="set">显示例句 <input type="checkbox" id="setEx" ${s.showExamples ? "checked" : ""}></label>
        <label class="set">自动增补(例句/中文/词频) <input type="checkbox" id="setAuto" ${s.autoEnrich !== false ? "checked" : ""}></label>
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
        <h2 class="sec">生词本维护</h2>
        <p class="muted" style="font-size:12px;margin:0 0 8px">内容不完整的词条(缺释义/例句/中文/词频)会在你打开生词本时<b>自动后台补全</b>,每次几个。也可以在这里一次补完。</p>
        <div class="row">
          <button class="btn ${incomplete ? "sage" : ""}" id="fixAll">${incomplete ? `立即补全 ${incomplete} 个不完整词条` : "内容都完整 ✓"}</button>
        </div>
        <div class="row" style="margin-top:8px"><button class="btn" id="tidyWords">清理人名/地名/无意义词 · 规整复数</button></div>
      </div>
      <div class="card">
        <h2 class="sec">数据</h2>
        <div class="row"><button class="btn" id="exp">导出 JSON</button><button class="btn" id="imp">导入</button><button class="btn" id="clr" style="color:#c05a5a">清空</button></div>
        <input type="file" id="impFile" accept="application/json" hidden>
      </div>
      <p class="muted" style="text-align:center;font-size:12px">Lexis H5 v1.53.1 · 数据仅存本机浏览器</p>`;

    $("#setCn").addEventListener("change", (e) => { s.chinese = e.target.checked; setSettings(s); });
    $("#setEx").addEventListener("change", (e) => { s.showExamples = e.target.checked; setSettings(s); });
    $("#setAuto").addEventListener("change", (e) => { s.autoEnrich = e.target.checked; setSettings(s); });
    $("#setLimit").addEventListener("change", (e) => { s.dailyNewLimit = +e.target.value || 15; setSettings(s); });
    $("#assessBtn").addEventListener("click", startAssess);
    $("#readAssessBtn").addEventListener("click", renderReadingPick);
    $("#setGistToken").addEventListener("change", (e) => { s.gistToken = e.target.value.trim(); setSettings(s); });
    $("#setGistId").addEventListener("change", (e) => { s.gistId = e.target.value.trim(); setSettings(s); startSyncPolling(); });
    $("#syncBtn").addEventListener("click", () => cloudSync($("#syncBtn")));
    $("#exp").addEventListener("click", exportData);
    $("#imp").addEventListener("click", () => $("#impFile").click());
    $("#impFile").addEventListener("change", importData);
    $("#clr").addEventListener("click", () => { if (confirm("清空所有生词与设置？此操作不可恢复。")) { localStorage.clear(); toast("已清空"); go("me"); } });
    $("#fixAll").addEventListener("click", async (e) => {
      const btn = e.target;
      if (!incomplete) { toast("生词本里的内容都是完整的 ✓"); return; }
      btn.disabled = true;
      const n = await sweepIncomplete({ manual: true, onProgress: (i, t, w) => { btn.textContent = `补全中 ${i}/${t} · ${w}`; } });
      toast(n ? `已补全 ${n} 个词条 ✓` : "这些词条已经拿不到更多内容了");
      go("me");
    });
    $("#tidyWords").addEventListener("click", () => {
      const r = tidyNotebook();
      toast(r.removed || r.merged
        ? `已清理 ${r.removed} 个人名/地名/无意义词` + (r.merged ? `,合并 ${r.merged} 个复数/变形重复` : "")
        : "生词本已经很干净了 ✓");
      go("me");
    });
  }

  // ---- GitHub Gist cloud sync: pull → merge (newer-wins) → push ----------
  // --- auto-sync scheduling: pull on open/focus, debounced push on any change ---
  let _syncing = false, _autoSyncTimer = null, _pollTimer = null, _lastSync = 0;
  const PUSH_DEBOUNCE = 1200;   // a save should reach the other devices fast
  const POLL_MS = 45000;        // …and theirs should reach us without a manual tap
  const syncReady = () => { const s = getSettings(); return !!(s.gistToken || "").trim() && !!(s.gistId || "").trim(); };
  function scheduleAutoSync() {
    if (!syncReady()) return;
    clearTimeout(_autoSyncTimer);
    _autoSyncTimer = setTimeout(() => syncNow({ silent: true }), PUSH_DEBOUNCE);
  }
  // Poll while the tab is actually in front. Cheap (one conditional GET) and it
  // is what makes "save on the phone → it's on the Mac" feel automatic instead of
  // requiring a focus change on the other device.
  function startSyncPolling() {
    clearInterval(_pollTimer);
    if (!syncReady()) return;
    _pollTimer = setInterval(() => {
      if (document.hidden || _syncing) return;
      if (now() - _lastSync < POLL_MS - 2000) return;
      syncNow({ silent: true });
    }, POLL_MS);
  }

  // core: pull remote gist → merge (newer-wins) → push back. opts.silent = no toast/redraw noise.
  async function syncNow(opts) {
    opts = opts || {};
    if (_syncing) return;
    const s = getSettings();
    const t = (s.gistToken || "").trim();
    if (!t) { if (!opts.silent) toast("先填 GitHub token(只勾 gist 权限)"); return; }
    _syncing = true;
    const btn = opts.btn, label = btn ? btn.textContent : "";
    const FILE = "lexis.json";
    const hdr = { Authorization: "Bearer " + t, Accept: "application/vnd.github+json" };
    const key = (x) => String(x || "").toLowerCase().trim();
    let changed = false;
    const mergeRemote = (remoteWords) => {
      const cur = getWords();
      const byKey = new Map(cur.map((w) => [key(w.word), w]));
      const before = cur.length;
      for (const w of remoteWords || []) {
        if (!w || !w.word) continue;
        const k = key(w.word), old = byKey.get(k);
        if (!old || (w.updatedAt || 0) > (old.updatedAt || 0)) { byKey.set(k, w); changed = true; }
      }
      const merged = Array.from(byKey.values());
      if (merged.length !== before) changed = true;
      _suppressAutoSync = true; setWords(merged); _suppressAutoSync = false;
    };
    // The vocabulary calibration (已掌握 set + 阅读式评估) carries no secrets and is
    // useless if it only lives on one device, so it rides along with the words.
    // Whole-object newer-wins: it is a single evolving record, not a per-item list.
    const assessPayload = () => { const a = getAssess(); return { known: a.known || [], reading: a.reading || null, estVocab: a.estVocab || 0, updatedAt: a.updatedAt || 0 }; };
    const mergeRemoteAssess = (remote) => {
      if (!remote) return;
      const a = getAssess();
      if ((remote.updatedAt || 0) <= (a.updatedAt || 0)) return;
      if (Array.isArray(remote.known)) a.known = remote.known;
      if (remote.reading) a.reading = remote.reading;
      if (remote.estVocab) a.estVocab = remote.estVocab;
      a.updatedAt = remote.updatedAt || now();
      setAssess(a, true); changed = true;
    };
    try {
      if (btn) btn.textContent = "拉取中…";
      let id = (s.gistId || "").trim();
      if (id) {
        const r = await fetch("https://api.github.com/gists/" + id, { headers: hdr });
        if (r.ok) {
          const g = await r.json(); const f = g.files && g.files[FILE];
          if (f && f.content) { try { const d = JSON.parse(f.content); mergeRemote(Array.isArray(d) ? d : d.words); if (!Array.isArray(d)) mergeRemoteAssess(d.assess); } catch (e) {} }
        } else if (r.status === 404) { id = ""; }
        else if (r.status === 401) throw new Error("token 无效");
      }
      if (btn) btn.textContent = "推送中…";
      const body = JSON.stringify({ description: "Lexis vocab sync", public: false, files: { [FILE]: { content: JSON.stringify({ words: getWords(), assess: assessPayload(), syncedAt: now() }) } } });
      const resp = id
        ? await fetch("https://api.github.com/gists/" + id, { method: "PATCH", headers: hdr, body })
        : await fetch("https://api.github.com/gists", { method: "POST", headers: hdr, body });
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const g = await resp.json();
      if (g.id && g.id !== s.gistId) { s.gistId = g.id; setSettings(s); }
      refreshBadge();
      if (!opts.silent) { toast(`已同步 ✓ 共 ${getWords().length} 词`); go("me"); }
      else if (changed && (current === "notebook" || current === "review" || current === "me")) go(current); // reflect pulled words
    } catch (err) {
      if (!opts.silent) toast("同步失败:" + (err.message || err));
      if (btn) btn.textContent = label || "☁️ 同步";
    } finally { _syncing = false; _lastSync = now(); }
  }
  // button handler (manual sync from Settings)
  function cloudSync(btn) { return syncNow({ btn }); }

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

  // ---- reading-based vocabulary assessment (阅读式评估) -------------------
  // Read a passage, tap ONLY the words you don't know. Every other content word
  // counts as known, so one passage supplies ~100 judgements instead of 40 taps.
  // Engine (passages, banding, estimate) lives in vocab.js — shared with the
  // extension so both surfaces produce the same number.
  function readingState() {
    const a = getAssess();
    return a.reading || { seen: {}, unknown: [], passages: [] };
  }
  function readingSeenList(r) {
    return Object.keys(r.seen || {}).map((k) => ({ key: k, band: r.seen[k] }));
  }
  function readingEstimate(r) {
    if (typeof window.lexisEstimateFromReading !== "function") return null;
    const list = readingSeenList(r);
    if (!list.length) return null;
    return window.lexisEstimateFromReading(list, new Set(r.unknown || []));
  }

  function renderReadingPick() {
    const passages = window.LEXIS_PASSAGES || [];
    const r = readingState();
    const done = new Set(r.passages || []);
    const est = readingEstimate(r);
    view.innerHTML = `
      <div class="row" style="margin-bottom:12px"><button class="btn" id="back">← 返回</button></div>
      <div class="card">
        <h2 class="sec">阅读式词汇量评估</h2>
        <p class="muted" style="font-size:13px;margin:0">读一段短文,<b>只点你不认识的词</b>。没点的词都算你认识——一篇约等于 100 次判断,比一个个勾选快得多。读 2 篇以上结果更准。</p>
        ${est ? `<div class="row" style="margin-top:10px"><span class="stat">${est.estVocab.toLocaleString()}</span><span class="muted">当前估算 · 已取样 ${est.sampled} 词 · 置信度 ${({ high: "高", mid: "中", low: "低" })[est.confidence]}</span></div>` : ""}
      </div>
      ${passages.map((p) => `<div class="item" data-pass="${esc(p.id)}">
        <div style="min-width:0"><div class="w serif">${esc(p.title)}</div><div class="meta">${esc(p.cn)} · 约 ${p.text.split(/\s+/).length} 词</div></div>
        <span class="st chip">${done.has(p.id) ? "已读 · 重读" : "开始"}</span></div>`).join("")}
      <div class="row" style="margin-top:14px">
        <button class="btn" id="wordwise">改用逐词勾选</button>
        ${est ? `<button class="btn sage" id="seeRes">查看评估结果</button>` : ""}
      </div>`;
    $("#back").addEventListener("click", () => go("me"));
    $("#wordwise").addEventListener("click", startAssess);
    if ($("#seeRes")) $("#seeRes").addEventListener("click", () => renderReadingResult());
    view.querySelectorAll("[data-pass]").forEach((n) => n.addEventListener("click", () => renderPassage(n.dataset.pass)));
  }

  function renderPassage(id) {
    const p = (window.LEXIS_PASSAGES || []).find((x) => x.id === id);
    if (!p) return;
    const toks = window.lexisPassageTokens(p.text);
    const marked = new Set();
    view.innerHTML = `
      <div class="row" style="margin-bottom:12px"><button class="btn" id="back">← 返回</button>
        <span class="muted" style="margin-left:auto;font-size:12px" id="mcount">已标记 0 个生词</span></div>
      <div class="card">
        <h2 class="sec">${esc(p.title)}</h2>
        <p class="muted" style="font-size:12px;margin:0 0 10px">点掉你<b>不认识</b>的词(再点一次取消)。基础词不可点,不计入统计。</p>
        <div class="passage" id="ptext">${toks.map((t, i) => t.word
          ? (t.band ? `<span class="rw" data-i="${i}" data-k="${esc(t.key)}" data-b="${esc(t.band)}">${esc(t.text)}</span>` : esc(t.text))
          : esc(t.text)).join("")}</div>
      </div>
      <div class="row"><button class="btn primary" id="pdone" style="flex:1;padding:13px">读完了,算一下 →</button></div>`;
    $("#back").addEventListener("click", renderReadingPick);
    const cnt = $("#mcount");
    view.querySelectorAll(".rw").forEach((n) => n.addEventListener("click", () => {
      const k = n.dataset.k;
      if (marked.has(k)) marked.delete(k); else marked.add(k);
      view.querySelectorAll(`.rw[data-k="${CSS.escape(k)}"]`).forEach((m) => m.classList.toggle("unk", marked.has(k)));
      cnt.textContent = `已标记 ${marked.size} 个生词`;
    }));
    $("#pdone").addEventListener("click", () => {
      const a = getAssess();
      const r = a.reading || { seen: {}, unknown: [], passages: [] };
      const unknown = new Set(r.unknown || []);
      const knownAdd = [];
      view.querySelectorAll(".rw").forEach((n) => {
        r.seen[n.dataset.k] = n.dataset.b;
        if (marked.has(n.dataset.k)) unknown.add(n.dataset.k);
        else { unknown.delete(n.dataset.k); knownAdd.push(n.dataset.k); }  // read and understood
      });
      r.unknown = Array.from(unknown);
      r.passages = Array.from(new Set((r.passages || []).concat([p.id])));
      r.at = now();
      // words you read without stumbling feed the same 已掌握 set the rest of the
      // app uses, so Discover stops offering them
      a.known = Array.from(new Set([].concat(a.known || [], knownAdd)));
      a.reading = r;
      const est = readingEstimate(r);
      if (est) { a.estVocab = est.estVocab; a.frontierRank = est.frontierRank; }
      setAssess(a);
      renderReadingResult();
    });
  }

  function renderReadingResult() {
    const r = readingState();
    const est = readingEstimate(r);
    if (!est) { renderReadingPick(); return; }
    const conf = { high: "高", mid: "中", low: "低" }[est.confidence];
    const bars = est.bands.map((b) => `
      <div class="lvl">
        <span class="lvl-bl mfreq freq-${b.key === "beyond" ? "rare" : b.key}">${esc(b.cn)}</span>
        <span class="lvl-track"><i class="freq-${b.key === "beyond" ? "rare" : b.key}" style="width:${Math.round(b.pct * 100)}%"></i></span>
        <span class="lvl-n">${b.measured ? Math.round(b.pct * 100) + "% · 取样 " + b.seen : "取样不足"}</span>
      </div>`).join("");
    const unk = (r.unknown || []).slice(0, 60);
    view.innerHTML = `
      <div class="row" style="margin-bottom:12px"><button class="btn" id="back">← 返回</button></div>
      <div class="card">
        <h2 class="sec">估算词汇量</h2>
        <div class="stat">${est.estVocab.toLocaleString()}</div>
        <div class="muted">词族 · 已读 ${(r.passages || []).length} 篇 · 取样 ${est.sampled} 词 · 置信度 ${conf}${
          est.confidence === "high" ? "" : `<br>取样还不多,实际大概在 <b>${est.range[0].toLocaleString()}–${est.range[1].toLocaleString()}</b> 之间——再读一篇会收窄。`}</div>
        <div class="meter"><i style="width:${Math.min(100, (est.estVocab / 15000) * 100)}%"></i></div>
        <div class="muted" style="font-size:12px">目标 15,000 词族(无障碍看懂英美影视/播客)</div>
      </div>
      <div class="card"><h2 class="sec">各频段掌握度</h2>${bars}
        <div class="muted" style="font-size:12px;margin-top:8px">按你在文中读到的词统计:该频段没点掉的比例。Discover 会优先推你最薄弱的频段。</div></div>
      ${unk.length ? `<div class="card"><h2 class="sec">你标记的生词 · ${(r.unknown || []).length}</h2>
        <div class="row">${unk.map((w) => `<span class="chip" data-look="${esc(w)}">${esc(w)}</span>`).join("")}</div>
        <div class="row" style="margin-top:10px"><button class="btn sage" id="addUnk">全部加入生词本</button></div></div>` : ""}
      <div class="row"><button class="btn" id="more" style="flex:1">再读一篇 →</button><button class="btn" id="toDisc" style="flex:1">去 Discover 学新词</button></div>`;
    $("#back").addEventListener("click", () => go("me"));
    $("#more").addEventListener("click", renderReadingPick);
    $("#toDisc").addEventListener("click", () => go("discover"));
    wireCard(view);
    const au = $("#addUnk");
    if (au) au.addEventListener("click", async () => {
      const list = (readingState().unknown || []).filter((w) => !findWord(w));
      if (!list.length) { toast("都已经在生词本里了"); return; }
      au.disabled = true;
      for (let i = 0; i < list.length; i++) {
        au.textContent = `加入中 ${i + 1}/${list.length}…`;
        saveWord(await lookupFull(list[i]));
      }
      toast(`已加入 ${list.length} 个词`); refreshBadge(); renderReadingResult();
    });
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
  async function autoAdd(rawTerm, context, source) {
    const term = norm(rawTerm);
    if (!term) return;
    const ctx = (context || "").trim();
    const src = (source || "").trim() || "粘贴保存";
    const box = $("#result");
    if ($("#q")) $("#q").value = term;
    if (box) box.innerHTML = `<div class="empty"><span class="spin"></span> 正在保存 <b>${esc(term)}</b>…</div>`;
    if (findWord(term)) {
      // already saved — append this new original sentence as another dated sighting
      if (ctx) {
        const ws = getWords(); const rec = ws.find((w) => w.lookup === term);
        if (rec) {
          rec.sightings = rec.sightings || (rec.context ? [{ context: rec.context, at: rec.createdAt || now(), source: src }] : []);
          if (!rec.sightings.some((s) => (s.context || "").trim() === ctx)) {
            rec.sightings.unshift({ context: ctx, at: now(), source: src });
            if (!rec.context) rec.context = ctx;
            rec.updatedAt = now(); setWords(ws);
            toast("已添加一条原句到 <b>" + esc(term) + "</b>");
            if (box) doLookup(term); return;
          }
        }
      }
      toast("已经在生词本里了");
      if (box) doLookup(term);
      return;
    }
    const p = await lookupFull(term);
    p.context = ctx; p.source = src;
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
    // single word → look it up first (Save button on the card); a sentence → tap the target word
    if (alphaWords.length === 1) { doLookup(alphaWords[0]); return; }
    showWordPicker(text, alphaWords);
  }

  // paste of a whole sentence: tap the target word → LOOK IT UP (with the sentence as 原句),
  // then decide to save from the card. Phrase → look up the whole selection.
  function showWordPicker(sentence, words) {
    const box = $("#result"); if (!box) return;
    const html = esc(sentence).replace(/[A-Za-z][A-Za-z'’-]*/g, (m) => `<span class="pickw" data-w="${esc(m)}">${m}</span>`);
    box.innerHTML = `<div class="card"><h2 class="sec">点选要查的词</h2>
      <div class="ex pick-sentence">${html}</div>
      <p class="muted" style="font-size:12px;margin-top:8px">点句中任意词先查看释义,再决定保存(整句会作为原句语境一并保存);短语请点「整句查询」。</p>
      <div class="row" style="margin-top:10px"><button class="btn" id="pickPhrase">整句作为短语查询</button></div></div>`;
    box.querySelectorAll(".pickw").forEach((n) => n.addEventListener("click", () => doLookup(n.dataset.w, sentence)));
    const pp = $("#pickPhrase"); if (pp) pp.addEventListener("click", () => doLookup(sentence, sentence));
  }

  // ---- boot ----
  document.querySelectorAll(".tabbar button").forEach((b) => b.addEventListener("click", () => go(b.dataset.tab)));
  go("lookup");
  refreshBadge();
  try {
    const qs = new URLSearchParams(location.search);
    const add = qs.get("add");
    if (add) {
      autoAdd(add, qs.get("ctx") || "", qs.get("src") || ""); // optional &ctx= sentence, &src= source label
      // clean the URL so a refresh doesn't re-add
      history.replaceState(null, "", location.pathname);
    }
    // ?q=<term> — look up WITHOUT saving (mirrors the extension's #look/<term> deep link)
    const q = (qs.get("q") || "").trim();
    if (!add && q) { go("lookup"); doLookup(q, (qs.get("ctx") || "").trim()); }
  } catch (e) {}

  // auto-sync: pull the shared gist on open, and again whenever the app regains focus
  // (fixes the iOS split-storage gap — every surface converges through the gist)
  if (syncReady()) syncNow({ silent: true });
  startSyncPolling();
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { syncNow({ silent: true }); startSyncPolling(); } });
  window.addEventListener("focus", () => syncNow({ silent: true }));
  // top up thin entries shortly after launch, without delaying first paint
  setTimeout(() => sweepIncomplete(), 4000);
})();
