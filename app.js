/* Lexis H5 — lightweight web app port of the Lexis vocabulary-notebook extension.
   No build step, no backend. Storage = localStorage. Network = direct fetch to
   CORS-friendly dictionary sources. Offline data (seed/freq/morphology) comes
   from vocab.js (the same file the extension ships). */
(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const el = (h) => { const d = document.createElement("div"); d.innerHTML = h.trim(); return d.firstElementChild; };
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // A Chinese gloss is stored as the dictionary's whole 英汉 block — every part
  // of speech at once, plus Youdao's transliterated-surname line. `glossLine` is
  // for the places with room for ONE line (a notebook row, the back of a review
  // card): it keeps the part of speech that place is already claiming.
  // `glossFull` is for the card that shows the entry: it only drops the surname.
  // Both live in vocab.js so this says exactly what the extension says.
  const glossLine = (cn, pos, max) =>
    (typeof window.lexisGlossLine === "function" ? window.lexisGlossLine(cn, pos, max) : String(cn || ""));
  const glossFull = (cn) =>
    (typeof window.lexisCleanGloss === "function" ? window.lexisCleanGloss(cn) : String(cn || ""));
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
  const K = { words: "lexis_words", settings: "lexis_settings", assess: "lexis_assess", deleted: "lexis_deleted",
              // Episodes recorded on the desktop. The phone keeps only a LIGHT
              // index — title, link, and the vocabulary without its sentences —
              // because iOS caps localStorage at ~5MB per origin and one hour of
              // transcript is ~150KB: hoarding them here would blow the quota and
              // take the notebook's own writes down with it. The full record is
              // fetched from its own gist file when you open an episode.
              videos: "lexis_video_index" };
  // vocabLevel: the one number that says "words this common are already mine".
  // 0 = defer to the reading assessment. It is the SAME key the extension keeps,
  // so it rides the settings the two surfaces already share rather than becoming
  // a second, phone-only idea of your level.
  const DEFAULT_SETTINGS = { chinese: true, dailyNewLimit: 15, dailyGoal: 20, showExamples: true, autoEnrich: true, reviewDrill: "auto", glossLang: "both", vocabLevel: 6000, vocabLevelSet: false, gistToken: "", gistId: "" };
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
  let repairedDupes = 0;
  // Repair: the pre-1.59 word-keyed merge could leave two entries sharing one id
  // (a rename that synced under two names). The UI deletes by id, so such a pair
  // made deleting one wipe both. Runs once at boot.
  // Bumped whenever the LOOK-UP itself changes (not the stored shape). The sweep
  // gives up on a word after SWEEP_MAX_TRIES so a term with genuinely no entry
  // isn't re-fetched forever — but that budget was spent under the OLD look-up,
  // so a pipeline change has to hand it back. Without this, the entries the fix
  // was written for ("quibble about", "crouch down") are precisely the ones that
  // never retry. LOOKUP_VER 2 = the shortened-headword ladder in phraseVariants();
  // 3 = the breakdown, which gives the un-listable terms content for the first time.
  const LOOKUP_VER = 3;
  function repairWords() {
    let list = load(K.words, []);
    let changed = false;
    if (Number(localStorage.getItem("lexis_lookup_ver") || 0) < LOOKUP_VER) {
      list.forEach((w) => {
        const d = w.data;
        if (d && d.fixTries && !(d.meanings || []).length) { d.fixTries = 0; changed = true; }
      });
      localStorage.setItem("lexis_lookup_ver", String(LOOKUP_VER));
    }
    if (window.lexisDedupeWords) {
      const d = window.lexisDedupeWords(list);
      if (d.dupes) { repairedDupes = d.dupes; list = d.words; changed = true; }
    }
    if (changed) { _suppressAutoSync = true; save(K.words, list); _suppressAutoSync = false; }
  }

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
  // ---- deletion tombstones -------------------------------------------------
  // Sync merges the UNION of both devices by "newer updatedAt wins", so a delete
  // is invisible to it and the other device hands the word straight back. A
  // tombstone records WHEN you deleted it; the merge then drops any copy older
  // than that. Saving the word again clears its tombstone.
  const TOMB_TTL = 120 * 864e5;
  // Keyed by BOTH the entry id and its headword (see lexisTombKeys) — a delete
  // must stick even if the other device knows the entry by an older name.
  const tombKeys = (w) => (window.lexisTombKeys ? window.lexisTombKeys(w) : [norm(w && w.word !== undefined ? w.word : w)]);
  const getTombs = () => load(K.deleted, {}) || {};
  function tombstone(list) {
    const t = getTombs(), ts = now();
    (Array.isArray(list) ? list : [list]).forEach((w) => tombKeys(w).forEach((k) => { if (k) t[k] = ts; }));
    save(K.deleted, t);
    if (!_suppressAutoSync) scheduleAutoSync();
  }
  function untombstone(list) {
    const t = getTombs(); let hit = false;
    (Array.isArray(list) ? list : [list]).forEach((w) => tombKeys(w).forEach((k) => { if (k && t[k]) { delete t[k]; hit = true; } }));
    if (hit) save(K.deleted, t);
  }
  function pruneTombs(t) {
    const cutoff = now() - TOMB_TTL; let hit = false;
    Object.keys(t).forEach((k) => { if (!t[k] || t[k] < cutoff) { delete t[k]; hit = true; } });
    return hit;
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

  // English-only study: keep the Chinese in storage (so the switch is instant and
  // reversible) but show none of it. Filtering at the render boundary is the only
  // version of this that can't be half-done.
  const enOnly = () => getSettings().glossLang === "en";
  // English-only makes every Chinese fetch dead weight — the gloss and the
  // per-example translation are requested, paid for, then hidden. Same switch
  // the extension uses (settingsWantsCn in background.js).
  const wantCnNow = () => { const s2 = getSettings(); return s2.chinese !== false && s2.glossLang !== "en"; };
  function stripCn(o) {
    if (!o || typeof o !== "object") return o;
    if (Array.isArray(o)) return o.map(stripCn);
    const out = {};
    for (const k in o) {
      if (k === "cn" || k === "translation" || k === "exampleCn" || k === "sentenceCn" || k === "contextMeaning") out[k] = "";
      else out[k] = (o[k] && typeof o[k] === "object") ? stripCn(o[k]) : o[k];
    }
    return out;
  }
  const asShown = (o) => (enOnly() ? stripCn(o) : o);

  // A toast that can carry an Undo. Every destructive action goes through this
  // instead of a confirm() dialog — confirming is friction on the 99% of taps that
  // were intentional, and gives you nothing on the 1% that weren't.
  function toast(msg, undo) {
    let t = $(".toast"); if (!t) { t = el(`<div class="toast"></div>`); document.body.appendChild(t); }
    t.innerHTML = msg + (undo ? ` <button class="toast-undo">Undo</button>` : "");
    t.classList.toggle("actionable", !!undo);
    t.classList.add("show");
    clearTimeout(toast._t);
    const hide = () => t.classList.remove("show");
    toast._t = setTimeout(hide, undo ? 6000 : 1800);
    if (undo) {
      const b = t.querySelector(".toast-undo");
      b.addEventListener("click", () => { clearTimeout(toast._t); hide(); undo(); });
    }
  }

  // ---- audio ----
  // the words this card offers to contrast: the headword plus what the sources
  // already flagged as close or easily confused
  // the neighbours worth contrasting — near-synonyms AND look-alikes, commonest
  // first (see cmpCandidates in the extension: same rule, same reason)
  function cmpCandsH5(p) {
    const seen = new Set([norm(p.term)]);
    const out = [];
    const fam = new Set((p.family || []).map((x) => norm(x.word || x)));
    const push = (w, kind, i) => {
      const k = norm(w);
      if (!k || seen.has(k) || /\s/.test(k)) return;
      // same word family is not a contrast (nurture / nurturing) — see vocab.js
      if (fam.has(k)) return;
      if (typeof window.lexisSameFamily === "function" && window.lexisSameFamily(p.term, k)) return;
      seen.add(k);
      const r = rankInfoOf(w, null);
      out.push({ word: w, kind, i, rank: (r && r.rank) || null });
    };
    (p.lookalikes || []).forEach((x, i) => push(x.word, "look-alike", i));
    (p.synonymsRich || []).forEach((x, i) => push(x.word, "synonym", i));
    // the raw Datamuse list is the noisy one (`norrish`, `nutrify`, `nourisher`
    // for `nourish`) — only reach for it when the vetted lists came up short
    if (out.length < 4) (p.synonyms || []).forEach((x, i) => push(x, "synonym", i + 20));
    const band = (r) => (!r ? 4 : r <= 10000 ? 0 : r <= 15000 ? 1 : r <= 20000 ? 2 : 3);
    out.sort((a, b) => band(a.rank) - band(b.rank) || a.i - b.i);
    return out.slice(0, 8);
  }
  function cmpChipsH5(p) {
    const cands = cmpCandsH5(p);
    if (!cands.length) return "";
    const on = new Set(cmpSeedH5(p).toLowerCase().split(/[,;、]+/).map((x) => x.trim()));
    return `<div class="cmp-cands">${cands.map((c) => `
      <button class="cmp-cand${on.has(c.word.toLowerCase()) ? " on" : ""}" data-cmpadd="${esc(c.word)}"
        title="${esc(c.kind)}">${esc(c.word)}${c.rank ? `<span class="cmp-cand-r">#${Number(c.rank).toLocaleString("en-US")}</span>` : ""}</button>`).join("")}</div>`;
  }
  function cmpSeedH5(p) {
    const near = ((p.lookalikes || []).map((x) => x.word))
      .concat((p.synonymsRich || []).map((x) => x.word))
      .concat(p.synonyms || [])
      .filter((x) => x && norm(x) !== norm(p.term));
    return [p.term].concat([...new Set(near)].slice(0, 2)).join(", ");
  }
  function spellHTMLH5(sp) {
    if (!sp) return "";
    return (sp.hook_cn ? `<div class="sp-hook">${esc(sp.hook_cn)}</div>` : "")
      + (sp.origin_cn ? `<div class="sp-origin">${esc(sp.origin_cn)}</div>` : "")
      + ((sp.parts || []).length ? `<div class="sp-parts">${sp.parts.map((x) =>
          `<span class="sp-piece"><b>${esc(x.piece)}</b>${esc(x.meaning_cn || "")}</span>`).join("")}</div>` : "")
      + ((sp.kin || []).length ? `<div class="sp-kin"><span class="sp-kin-h">同根</span>${sp.kin.map((x) =>
          `<button class="chip2" data-look="${esc(x.word)}">${esc(x.word)}${x.cn ? " " + esc(x.cn) : ""}</button>`).join("")}</div>` : "");
  }
  async function aiSpellH5(term, sense) {
    const s = getSettings();
    if (!s.aiKey) throw new Error("no key");
    const pr = window.lexisSpellPrompt(term, sense);
    const out = await aiJSONH5(pr.sys, pr.user, 900);
    if (!out || (!out.origin_cn && !out.hook_cn)) throw new Error("bad answer");
    const clean = (t) => (typeof window.lexisCmpClean === "function" ? window.lexisCmpClean(t) : String(t || "").trim());
    out.origin_cn = clean(out.origin_cn); out.hook_cn = clean(out.hook_cn);
    out.parts = (out.parts || []).filter((x) => x && x.piece && x.meaning_cn).slice(0, 4);
    out.kin = (out.kin || []).filter((x) => x && x.word && norm(x.word) !== norm(term)).slice(0, 4);
    out.at = now();
    return out;
  }
  function compareHTMLH5(c) {
    if (!c || !Array.isArray(c.words) || !c.words.length) return "";
    return (c.shared_cn ? `<div class="cmp-shared"><span class="lbl">共同点</span>${esc(c.shared_cn)}</div>` : "")
      + (c.axis_cn ? `<div class="cmp-axis"><span class="lbl">分界线</span>${esc(c.axis_cn)}</div>` : "")
      + c.words.map((x) => `<div class="cmp-w">
          <div class="cmp-h"><span class="cmp-t">${esc(x.word)}</span></div>
          ${(x.diff_cn || x.vibe_cn) ? `<div class="cmp-diff">${esc(x.diff_cn || x.vibe_cn)}</div>` : ""}
          ${x.meaning_en ? `<div class="cmp-m">${esc(x.meaning_en)}</div>` : ""}
          ${x.meaning_cn ? `<div class="cmp-mcn">${esc(x.meaning_cn)}</div>` : ""}
          ${x.example ? `<div class="cmp-ex">${esc(x.example)}</div>` : ""}
          ${x.example_cn ? `<div class="cmp-excn">${esc(x.example_cn)}</div>` : ""}
          ${(x.collocs || []).length ? `<div class="cmp-col">${x.collocs.slice(0, 3).map((y) => `<span>${esc(y)}</span>`).join("")}</div>` : ""}
        </div>`).join("")
      + ((c.pairs || []).length ? `<div class="cmp-pairs">${c.pairs.map((q) =>
          `<div class="cmp-pair"><b>${esc(q.a)} · ${esc(q.b)}</b> ${esc(q.note_cn || "")}</div>`).join("")}</div>` : "");
  }
  // One provider layer, same three as the extension. Groq is the free one and
  // is CORS-open, which is why this works in a browser at all.
  const AI_BASE_H5 = { groq: "https://api.groq.com/openai/v1/chat/completions",
                       openai: "https://api.openai.com/v1/chat/completions" };
  const AI_MODEL_H5 = { groq: "llama-3.3-70b-versatile", openai: "gpt-4o-mini", anthropic: "claude-3-5-haiku-latest" };
  const AI_MODELS_H5 = { groq: "https://api.groq.com/openai/v1/models", openai: "https://api.openai.com/v1/models" };
  async function pickModelH5(provider, key) {
    const url = AI_MODELS_H5[provider];
    if (!url) return "";
    const r = await fetch(url, { headers: { Authorization: "Bearer " + key } });
    if (!r.ok) return "";
    const j = await r.json();
    const ids = ((j && j.data) || []).map((m) => m && m.id).filter(Boolean)
      .filter((id) => !/whisper|guard|tts|embed|vision/i.test(id));
    if (!ids.length) return "";
    const score = (id) => (/llama/i.test(id) ? 4 : 0) + (/70b|versatile|maverick|scout/i.test(id) ? 3 : 0) +
                          (/instruct|chat/i.test(id) ? 2 : 0) + (/8b|mini|instant/i.test(id) ? -1 : 0);
    ids.sort((a, b) => score(b) - score(a) || a.localeCompare(b));
    return ids[0] || "";
  }
  // one provider call, shared by both prompts
  async function aiJSONH5(sys, user, maxTokens) {
    const s = getSettings();
    if (!s.aiKey) throw new Error("no key");
    // the key names its own service — see aiProviderOf() in background.js
    const k = String(s.aiKey || "").trim();
    const provider = /^gsk_/i.test(k) ? "groq" : /^sk-ant-/i.test(k) ? "anthropic"
      : /^sk-/i.test(k) ? "openai" : (s.aiProvider || "groq");
    let model = s.aiModel || AI_MODEL_H5[provider] || AI_MODEL_H5.groq;
    let text = "";
    if (provider === "anthropic") {
      const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": s.aiKey, "anthropic-version": "2023-06-01",
                   "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model, max_tokens: maxTokens || 2000, system: sys, messages: [{ role: "user", content: user }] }) });
      if (!r.ok) throw new Error("anthropic " + r.status);
      const j2 = await r.json();
      text = (j2.content || []).map((b) => b.text || "").join("");
    } else {
      const call = (m) => fetch(AI_BASE_H5[provider] || AI_BASE_H5.groq, { method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + s.aiKey },
        body: JSON.stringify({ model: m, temperature: 0.2, response_format: { type: "json_object" },
          messages: [{ role: "system", content: sys }, { role: "user", content: user }] }) });
      let r = await call(model);
      // a hardcoded model name is a date stamp — ask what this key can call
      if (r.status === 404 || r.status === 400) {
        const picked = await pickModelH5(provider, s.aiKey).catch(() => "");
        if (picked && picked !== model) {
          model = picked;
          const st = getSettings(); st.aiModel = picked; setSettings(st);
          r = await call(model);
        }
      }
      if (r.status === 429) throw new Error("rate limit on " + model + " — wait a moment and try again");
      if (!r.ok) throw new Error(provider + " " + r.status);
      const j2 = await r.json();
      text = (j2.choices && j2.choices[0] && j2.choices[0].message && j2.choices[0].message.content) || "";
    }
    let parsed = null;
    try { parsed = JSON.parse(text); } catch (e) {
      const m2 = String(text).match(/\{[\s\S]*\}/);
      if (m2) { try { parsed = JSON.parse(m2[0]); } catch (e2) {} }
    }
    if (parsed) { parsed.model = model; parsed.by = provider; }
    return parsed;
  }
  async function aiCompareH5(terms, context) {
    const pr = window.lexisComparePrompt(terms, context);
    if (pr.terms.length < 2) throw new Error("need two words");
    const parsed = await aiJSONH5(pr.sys, pr.user, 2000);
    if (!parsed || !Array.isArray(parsed.words) || !parsed.words.length) throw new Error("bad answer");
    // what was asked is what comes back
    const want = pr.terms.map((t) => norm(t));
    const byWord = new Map((parsed.words || []).map((w) => [norm(w.word), w]));
    parsed.words = want.map((t) => byWord.get(t)).filter(Boolean);
    parsed.missing = want.filter((t) => !byWord.has(t));
    parsed.pairs = (parsed.pairs || []).filter((q) => want.includes(norm(q.a)) && want.includes(norm(q.b)));
    // same repairs the extension makes
    const clean = (t) => (typeof window.lexisCmpClean === "function" ? window.lexisCmpClean(t) : String(t || "").trim());
    parsed.shared_cn = clean(parsed.shared_cn);
    parsed.axis_cn = clean(parsed.axis_cn);
    (parsed.pairs || []).forEach((q) => { q.note_cn = clean(q.note_cn); });
    (parsed.words || []).forEach((w) => {
      w.meaning_cn = clean(w.meaning_cn);
      w.diff_cn = clean(w.diff_cn);
      if (w.diff_cn && w.diff_cn === parsed.shared_cn) w.diff_cn = "";
      if (/^这[三两几]个词|都涉及|都表示/.test(String(w.diff_cn || ""))) w.diff_cn = "";
    });
    parsed.terms = pr.terms; parsed.at = now();
    return parsed;
  }


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
      // the API's own order puts "Fop, dandy." first for `exquisite` and the
      // archaic verb first for `recurring` — see lexisRankSenses in vocab.js
      return { phonetic, audioUs, audioUk, meanings: lexisRankSenses(meanings, term) };
    } catch (e) { return null; }
  }

  const stripTags = (s) => String(s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  const DICT_NAME = { wiktionary: "Wiktionary", dictionaryapi: "dictionaryapi.dev", datamuse: "Datamuse",
    thefreedictionary: "The Free Dictionary" };
  const POS_SHORT = { noun: "n.", verb: "v.", adjective: "adj.", adverb: "adv.", pronoun: "pron.", preposition: "prep.",
    conjunction: "conj.", interjection: "interj.", determiner: "det.", numeral: "num.", phrase: "phr.",
    "prepositional phrase": "phr.", "verb phrase": "phr.", "noun phrase": "phr.", proverb: "prov.", idiom: "idiom" };
  const posShort = (p) => POS_SHORT[String(p || "").toLowerCase()] || String(p || "").toLowerCase().slice(0, 12);

  // Wiktionary (free, CORS-open). The only source here that covers PHRASES and
  // IDIOMS, and a second supply of examples for plain words.
  // Dictionaries file a phrase under its GENERIC form: you meet "get your head
  // on straight", Wiktionary has "get one's head on straight". Without this the
  // look-up just fails and a perfectly real phrase looks 查不出来. Mirrors
  // phraseVariants()/tryVariants() in the extension's background.js.
  const PH_POSS = /^(my|your|his|her|its|our|their)$/i;
  const PH_OBJ = /^(me|you|him|her|us|them)$/i;
  const PH_PAST = { lost: "lose", took: "take", made: "make", got: "get", gave: "give", went: "go",
    came: "come", kept: "keep", held: "hold", broke: "break", caught: "catch", fell: "fall",
    felt: "feel", found: "find", left: "leave", paid: "pay", ran: "run", said: "say", saw: "see",
    sold: "sell", sent: "send", spent: "spend", stood: "stand", threw: "throw", won: "win", wore: "wear" };
  function baseVerbForm(x) {
    const l = String(x || "").toLowerCase();
    if (PH_PAST[l]) return PH_PAST[l];
    if (/^(is|are|was|were|been|being)$/.test(l)) return "be";
    if (/^(has|had)$/.test(l)) return "have";
    if (/ied$/.test(l)) return l.slice(0, -3) + "y";
    if (/[^aeiou]ed$/.test(l) && l.length > 4) return l.slice(0, -2);
    if (/ing$/.test(l) && l.length > 5) return l.slice(0, -3);
    if (/[^s]s$/.test(l) && l.length > 3) return l.slice(0, -1);
    return null;
  }
  function phraseVariants(term) {
    const t = String(term || "").toLowerCase().replace(/\s+/g, " ").trim();
    if (!t || !/\s/.test(t)) return [];
    const w = t.split(" ");
    const out = [];
    const add = (x) => { const v = x.replace(/\s+/g, " ").trim(); if (v && v !== t && out.indexOf(v) < 0) out.push(v); };
    add(w.map((x) => (PH_POSS.test(x) ? "one's" : x)).join(" "));
    add(w.map((x, i) => (PH_OBJ.test(x) && i > 0 ? "sb" : x)).join(" "));
    add(w.map((x) => (PH_POSS.test(x) ? "somebody's" : x)).join(" "));
    const base = baseVerbForm(w[0]);
    if (base) {
      add([base].concat(w.slice(1)).join(" "));
      add([base].concat(w.slice(1).map((x) => (PH_POSS.test(x) ? "one's" : x))).join(" "));
    }
    if (/^(a|an|the)$/.test(w[0])) add(w.slice(1).join(" "));
    // Shortening ladder — mirrors background.js phraseVariants(). Everything above
    // rewrites the phrase into another form of the SAME unit, which is not enough:
    // what you save is a surface fragment carrying material the headword lacks —
    // "get carried away" → "carried away", "tip the scales to" → "tip the scales",
    // "quibble about" → "quibble", "crouch down" → "crouch". Only reached after the
    // verbatim phrase has already missed, so a real phrasal verb is never harmed.
    const light = PH_LIGHT.test(w[0]) && w.length > 2 ? w.slice(1) : null;
    if (light) add(light.join(" "));
    const trimTail = (arr) => { let a = arr.slice(); while (a.length > 1 && PH_TAIL.test(a[a.length - 1])) a = a.slice(0, -1); return a; };
    const tailed = trimTail(w);
    if (tailed.length !== w.length) add(tailed.join(" "));
    if (light) add(trimTail(light).join(" "));
    // a negator is never dropped — "not only" → `only` is an inverted meaning,
    // not a shorter one (see PH_NEG in background.js)
    if (w.length <= 4 && !w.some((x) => PH_NEG.test(x))) {
      const head = (light || w).filter((x) => !PH_SKIP.test(x))[0];
      if (head && /^[a-z][a-z'-]*$/.test(head)) add(head);
    }
    return out.slice(0, 8);
  }
  // A NEGATOR is never dropped. Every other rung of this ladder trades a fragment
  // for a shorter form of the same unit; taking the head out of "not only" hands
  // back `only` — whose entry ("Alone in a category") is not a shorter version of
  // the meaning, it is the opposite of it, and it arrived as 单独在一个类别中。 in
  // a row that should read 不仅. A miss is recoverable (the term itself gets
  // translated instead); an inverted definition is not.
  const PH_NEG = /^(not|no|never|nor|neither|none|nothing|nobody|without|n't|cannot)$/;
  const PH_TAIL = /^(about|of|to|for|with|on|in|at|from|into|onto|over|by|as|up|down|out|off|away|back|through|around|against|that|it|sth|sb|somebody|someone|something|one's|his|her|their|your|my|its|the|a|an)$/;
  const PH_LIGHT = /^(get|gets|got|gotten|getting|be|is|am|are|was|were|been|being|become|becomes|became|becoming|feel|feels|felt|feeling|seem|seems|seemed)$/;
  const PH_SKIP = /^(a|an|the|to|of|in|on|at|by|for|with|from|into|onto|over|about|as|and|or|but|not|no|it|its|this|that|these|those|my|your|his|her|their|our|one's|be|is|am|are|was|were|been|being|have|has|had|do|does|did|will|would|can|could|shall|should|may|might|must|get|got|make|made|take|took)$/;
  // try the term, then its generic forms — first hit wins
  async function wiktionaryDeep(term) {
    let first = await fetchWiktionary(term).catch(() => null);
    if (first && first.senses && first.senses.length) return first;
    // The phrase itself gets a second chance before we fall back to a shortened
    // form — one flaky response was enough to send us down the ladder, which is
    // why an entry could say "defined as <shorter form>" and then quietly get its
    // own definition after a couple of Re-fetches. Mirrors tryVariants().
    await new Promise((r) => setTimeout(r, 700));
    const retry = await fetchWiktionary(term).catch(() => null);
    if (retry && retry.senses && retry.senses.length) return retry;
    if (!first) first = retry;
    for (const v of phraseVariants(term)) {
      const r = await fetchWiktionary(v).catch(() => null);
      if (r && r.senses && r.senses.length) { r.variantOf = v; return r; }
    }
    return first;
  }

  // ---- Origin: why people say this -------------------------------------------
  // Mirrors fetchOrigin() in the extension's background.js — same two tiers
  // (Wiktionary Etymology, else the literal reading of the phrase's core image),
  // same cleaning. The Action API sends origin=* so it is reachable from the
  // browser, unlike Youdao/M-W.
  const WIKI_API = "https://en.wiktionary.org/w/api.php";
  const wikiTitle = (t) => encodeURIComponent(String(t).trim().replace(/\s+/g, "_"));
  const JUNK_DEF = /^(simple past|past participle|present participle|third-person|second-person|first-person|plural|singular|nominative|comparative|superlative|alternative (form|spelling|letter-case)|inflection|gerund|obsolete (form|spelling)|misspelling|initialism|abbreviation|acronym|synonym|archaic (form|spelling))\b|\bform of\b|\bof\s+[a-z-]+\.?$/i;
  function cleanWikiHtml(html) {
    let s = String(html || "");
    s = s.replace(/<ol class="references"[\s\S]*?<\/ol>/gi, "").replace(/<sup[\s\S]*?<\/sup>/gi, "")
         .replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<h[1-6][\s\S]*?<\/h[1-6]>/gi, "")
         .replace(/<[^>]+>/g, " ");
    s = s.replace(/&(nbsp|#160);/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
         .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
         .replace(/&#(\d+);/g, (m, n) => { try { return String.fromCodePoint(+n); } catch (e) { return m; } });
    s = s.replace(/\s+/g, " ").trim().replace(/^\[\s*edit\s*\]\s*/i, "")
         .replace(/\s+([,.;:!?)\]\u201d])/g, "$1").replace(/([(\[\u201c])\s+/g, "$1");
    const treeAt = s.indexOf("Etymology tree");
    if (treeAt >= 0) {
      const m = s.slice(treeAt).match(/\b(From|Borrowed|Probably|Possibly|Ultimately|Attested|By |Calque|Coined|Compare|Uncertain|Back-formation|Blend|Contraction|Clipping|Inherited|Doublet|Abbreviation|Alteration)\b/);
      s = m ? s.slice(treeAt + m.index) : s.replace(/^.*?\bder\.\s+\S+\s+/, "");
    }
    return s.trim();
  }
  function trimToSentences(s, max) {
    const lim = max || 360;
    if (s.length <= lim) return s;
    const cut = s.slice(0, lim);
    const stop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
    return stop > 80 ? cut.slice(0, stop + 1) : cut.replace(/\s+\S*$/, "") + "\u2026";
  }
  async function fetchEtymology(term) {
    let secs;
    try {
      const j = await jget(`${WIKI_API}?action=parse&page=${wikiTitle(term)}&prop=sections&format=json&formatversion=2&origin=*`);
      secs = j && j.parse && j.parse.sections;
    } catch (e) { return null; }
    if (!Array.isArray(secs)) return null;
    let lang = "", idx = null;
    for (const sec of secs) {
      if (sec.toclevel === 1) { lang = sec.line || ""; continue; }
      if (lang === "English" && /^Etymology/i.test(sec.line || "")) { idx = sec.index; break; }
    }
    if (idx == null) return null;
    try {
      const j2 = await jget(`${WIKI_API}?action=parse&page=${wikiTitle(term)}&prop=text&section=${encodeURIComponent(idx)}&format=json&formatversion=2&origin=*`);
      const txt = cleanWikiHtml(j2 && j2.parse && j2.parse.text);
      if (!txt || txt.length < 12) return null;
      return { text: trimToSentences(txt), of: String(term).toLowerCase(), kind: "etymology" };
    } catch (e) { return null; }
  }
  function imageCandidates(term) {
    const w = String(term || "").toLowerCase().replace(/\s+/g, " ").trim().split(" ");
    if (w.length < 2) return [];
    const out = [];
    const add = (a) => { const v = a.join(" ").trim(); if (v && v !== w.join(" ") && out.indexOf(v) < 0) out.push(v); };
    let i = 0; while (i < w.length - 1 && PH_SKIP.test(w[i])) i++;
    let j = w.length; while (j > i + 1 && PH_TAIL.test(w[j - 1])) j--;
    add(w.slice(i, j));
    if (j - i > 2) add(w.slice(j - 2, j));
    if (j - i > 1) add(w.slice(j - 1, j));
    out.slice().forEach((v) => {
      const last = v.split(" ").pop();
      if (!/[a-z]{3,}s$/.test(last) || /ss$/.test(last)) return;
      // "scales" → "scale", not "scal" — only the -es- plural loses two letters
      const sg = /ies$/.test(last) ? last.replace(/ies$/, "y")
        : /(s|x|z|ch|sh)es$/.test(last) ? last.slice(0, -2) : last.replace(/s$/, "");
      add(v.split(" ").slice(0, -1).concat([sg]));
    });
    return out.slice(0, 5);
  }
  async function fetchOrigin(term) {
    const t = String(term || "").toLowerCase().trim();
    if (!t) return null;
    const ety = await fetchEtymology(t).catch(() => null);
    if (ety) return ety;
    if (!/\s/.test(t)) return null;
    for (const c of imageCandidates(t)) {
      const wik = await fetchWiktionary(c).catch(() => null);
      const usable = ((wik && wik.senses) || []).filter((x) => x.definition && x.definition.length > 20 && !JUNK_DEF.test(x.definition));
      const def = usable.find((x) => /noun/i.test(x.pos || "")) || usable[0];
      if (def) return { text: trimToSentences(def.definition, 240), of: c, kind: "literal" };
    }
    return null;
  }

  async function fetchWiktionary(term, followed) {
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
    if (!senses.length) return examples.length ? { senses, examples } : null;
    const ranked = lexisRankSenses(senses, term);
    // An inflected form's page IS only a pointer ("simple past … of devise").
    // Follow it once and answer with the lemma, saying so, rather than print it.
    if (!followed && ranked.every((m) => lexisIsFormOf(m.definition))) {
      const base = lexisFormOfBase(ranked[0].definition);
      if (base && base !== term.toLowerCase()) {
        const b = await fetchWiktionary(base, true).catch(() => null);
        if (b && (b.senses || []).length) {
          return { senses: b.senses, examples: examples.length ? examples : b.examples, variantOf: base };
        }
      }
    }
    return { senses: ranked.slice(0, 6), examples };
  }

  // Authentic example sentences from Tatoeba (human-written). The old api_v0 has
  // no CORS headers, so H5 uses the "unstable" API, which does.
  async function fetchTatoeba(term) {
    let j;
    try {
      // limit=100, not 20. `sort=relevance` returns the SHORTEST exact match
      // first, so the first twenty rows for "vanished" are twenty ways of
      // writing "Tom vanished." and the sentences that show the word doing
      // something ("vanished into thin air", "vanished before Rima's eyes")
      // start around row thirty of the same free request.
      j = await jget("https://api.tatoeba.org/unstable/sentences?lang=eng&sort=relevance&limit=100&q=" + encodeURIComponent(term));
    } catch (e) { return []; }
    const rows = (j && j.data) || [];
    let re;
    try { re = new RegExp("\\b" + term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+"), "i"); }
    catch (e) { return []; }
    const out = [];
    for (const r of rows) {
      const text = ((r && r.text) || "").trim();
      if (!text || !re.test(text)) continue;
      if (out.some((o) => o.text === text)) continue;
      out.push({ text, translation: "" });
      if (out.length >= 60) break;
    }
    // `sort=relevance` returns the SHORTEST exact match first, so taking the top
    // few gave "She vanished." / "Tom vanished." / "They vanished." while the
    // sentences that show the word in use sat further down the same payload.
    return window.lexisPickExamples ? window.lexisPickExamples(out, term, { max: 4 }) : out.slice(0, 4);
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
  const FREQ_CN = { core: "core", "very-common": "very common", common: "common", mid: "mid", low: "low", rare: "rare" };
  const FREQ_NOTE = { core: "everyday core", "very-common": "everyday", common: "common", mid: "leans written", low: "written / technical", rare: "rare" };
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
  // the shelf (band chip) AND the position on it (rank) — shared with the
  // extension through lexisRankInfo() in vocab.js, so the two never disagree
  function rankInfoOf(term, f) {
    return (typeof window.lexisRankInfo === "function") ? window.lexisRankInfo(term, f) : null;
  }
  // compact band chip + rank (notebook list + card headline)
  // ONE frequency vocabulary across all three targets: the four word-family
  // bands the extension's subtitles and notebook use, the same swatches, the
  // same rank. H5 doesn't ship data/freqrank.txt (196KB is a bad trade on a
  // phone), but `famRank` rides along inside data.freq through the gist, so any
  // word the extension enriched shows the identical band here. A word H5 looked
  // up by itself has no family rank and honestly says "unranked".
  const BAND_LABEL = { r1: "top 10k", r2: "10\u201315k", r3: "15\u201320k", r4: "20k+", r0: "unranked" };
  function famRankOf(term, f) {
    if (f && f.famRank) return f.famRank;
    const k = String(term || "").toLowerCase().trim();
    if (/\s/.test(k) && typeof window.lexisPhraseRank === "function") {
      const pr = window.lexisPhraseRank(k);
      if (pr && pr.rank) return pr.rank;
    }
    return null;
  }
  function famBandOf(r) {
    return !r ? "r0" : r <= 10000 ? "r1" : r <= 15000 ? "r2" : r <= 20000 ? "r3" : "r4";
  }
  function bandChip(rank) {
    const b = famBandOf(rank);
    return `<span class="mfreq band-${b}"><i class="bsw ${b}"></i>${BAND_LABEL[b]}</span>`;
  }
  // A phrase is ranked among phrases (PHaVE stops at 150, the Phrasal
  // Expressions List at 5,504). Running that number through the word-family
  // bands made every listed phrase "top 10k" and every other one "unranked" —
  // two values for 677 phrases. It gets its own chip, naming its list.
  const isMulti = (t) => /\s/.test(String(t || "").trim());
  const phraseInfoOf = (t) =>
    (typeof window.lexisPhraseInfo === "function") ? window.lexisPhraseInfo(String(t || "").toLowerCase().trim()) : null;
  function phraseChip(term) {
    // a verb pattern is not a phrase and is on no list — "not on the phrase
    // lists" would report a gap in our data about something that was never
    // supposed to be there
    const vp = (typeof lexisVPatInfo === "function") ? lexisVPatInfo(term) : null;
    if (vp) return `<span class="mfreq phr cur" title="A verb and the preposition it takes. Patterns aren't on any frequency list.">verb pattern</span>`;
    const i = phraseInfoOf(term);
    return i
      ? `<span class="mfreq phr${i.src === "cur" ? " cur" : ""}" title="${esc(i.title)}">${esc(i.text)}</span>`
      : `<span class="mfreq band-r0" title="Neither published phrase list ranks this one and it isn't a chunk Lexis teaches. Phrases carry no word-family rank.">not on the phrase lists</span>`;
  }
  function freqChip(f, term) {
    if (isMulti(term)) return phraseChip(term);
    const r = famRankOf(term, f);
    if (!r) return bandChip(null);
    return bandChip(r) + `<span class="mrank">#${r.toLocaleString("en-US")}</span>`;
  }
  // one line, not a 7-segment block — you opened the card to read the meaning
  function freqMeterHTML(f, isPhrase, term) {
    if (isMulti(term)) {
      const i = phraseInfoOf(term);
      if (!i) return "";
      const note = i.src === "pv" ? "of the 149 commonest phrasal verbs"
                 : i.src === "expr" ? "in the Phrasal Expressions List, commonest first"
                 : "taught in Discover · no corpus rank";
      return `<div class="freq-line">${phraseChip(term)}<span class="fnote">${esc(note)}</span></div>`;
    }
    const r = famRankOf(term, f);
    if (!r) return "";
    return `<div class="freq-line">${bandChip(r)}<span class="mrank">#${r.toLocaleString("en-US")}</span>` +
      `<span class="fnote">of 44,796 word families, commonest first</span></div>`;
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
    const out = { synonyms: [], synonymsRich: [], family: [], lookalikes: [], collocations: [], defs: [] };
    // Last-resort dictionary: Datamuse answers reliably, needs no key and is
    // CORS-open, so the card is never empty just because two other sources were
    // slow. It returns nothing for a non-word rather than something plausible.
    if (!isPhrase) {
      try {
        const own = await withTimeout(jget(dmURL("sp", term, "max=1&md=dp")), 6000, []);
        const hit = (own || [])[0];
        if (hit && String(hit.word || "").toLowerCase() === term.toLowerCase() && Array.isArray(hit.defs)) {
          out.defs = hit.defs.slice(0, 5).map((d) => {
            const i = d.indexOf("\t");
            const pos = i > 0 ? ({ n: "noun", v: "verb", adj: "adjective", adv: "adverb" }[d.slice(0, i)] || "") : "";
            const def = (i > 0 ? d.slice(i + 1) : d).trim();
            return { pos: POS_SHORT[pos] || pos, definition: def.charAt(0).toUpperCase() + def.slice(1) };
          }).filter((m) => m.definition);
        }
      } catch (e) {}
    }
    // synonyms with each word's own pos / band / definition (Synonyms)
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
    // A VERB PATTERN answers itself, offline. No dictionary has an entry for
    // "conceal sth from sb", so every source below can only come back empty and
    // the card would print "no entry" over something perfectly real.
    const vrow = (typeof window.lexisVPatInfo === "function") ? window.lexisVPatInfo(term) : null;
    if (vrow) {
      return {
        term: vrow.term, cn: vrow.cn, vpat: vrow, done: true, isPhrase: true,
        phonetic: "", audioUs: "", audioUk: "", freq: null,
        meanings: [{ pos: "verb pattern", definition: vrow.term, cn: vrow.cn }],
        examples: [], synonyms: [], synonymsRich: [], family: [], lookalikes: [],
        collocations: [], sensesFrom: "Lexis verb patterns",
      };
    }
    const isPhrase = /\s/.test(term);
    const [dict, wik, dm, cn, freq] = await Promise.all([
      isPhrase ? Promise.resolve(null) : withTimeout(fetchDictionary(term), 8000, null),
      withTimeout(wiktionaryDeep(term), 9000, null),   // …and its generic forms, for phrases
      withTimeout(fetchDatamuse(term), 8000, { synonyms: [], synonymsRich: [], family: [], lookalikes: [], collocations: [] }),
      // a word-for-word MT of an idiom is misleading ("领先于曲线"), so for phrases
      // the CN gloss comes from the translated definition in phase 2 instead.
      wantCnNow() && !isPhrase ? withTimeout(fetchCn(term), 7000, "") : Promise.resolve(""),
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
    // ONE dictionary wins, the others are only a safety net. Merging two
    // dictionaries is what produced the same meaning twice in different words —
    // and no token-overlap test catches that reliably.
    const dmDefs = (dm && dm.defs) || null;
    let sensesFrom = "";
    if (dict && (dict.meanings || []).length) { sensesFrom = "dictionaryapi"; dict.meanings.forEach(addSense); }
    else if (wik && (wik.senses || []).length) { sensesFrom = "wiktionary"; wik.senses.forEach(addSense); }
    else if (dmDefs && dmDefs.length) { sensesFrom = "datamuse"; dmDefs.forEach(addSense); }
    // the hit came from a shortened form of the phrase — label it (see cardHTML)
    const sensesOf = (sensesFrom === "wiktionary" && wik.variantOf && wik.variantOf !== norm(term)) ? wik.variantOf : "";
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
      lookalikes: dm.lookalikes, collocations: dm.collocations, suggestions, sensesFrom, sensesOf,
    };
  }

  // ---- phase 2 (自动增补): top up thin example sets from Tatoeba and add the
  // Chinese line under every example + the first senses. Mutates and returns `p`.
  // Best-effort and idempotent, so it is safe to re-run on a saved word.
  async function enrichPreview(p) {
    if (!p || p.error) return p;
    if (p.vpat) return p;                 // complete already, and nothing to ask
    const wantCn = wantCnNow();
    // Wiktionary often supplies bare collocations ("meticulous search") rather
    // than sentences, so top up from Tatoeba unless we already have real ones,
    // then float the sentence-like examples to the top.
    const wordy = (t) => String(t || "").trim().split(/\s+/).length >= 5;
    const addEx = (list, from) => {
      (list || []).forEach((m) => {
        if (!(p.examples || []).some((e) => e.text === m.text))
          p.examples = (p.examples || []).concat([{ text: m.text, translation: "", from: from || "" }]);
      });
    };
    if ((p.examples || []).filter((e) => wordy(e.text)).length < 2) {
      addEx(await withTimeout(fetchTatoeba(p.term), 8000, []));
    }
    // WHY people say this — two extra Wiktionary calls, so phase 2, never phase 1
    if (!p.origin) {
      const og = await withTimeout(fetchOrigin(p.term), 11000, null);
      if (og && og.text) p.origin = og;
    }
    // A derived form ("perceptively") often has no corpus sentences of its own,
    // which is why the 例句 card came up empty. Fall back to the base word — a
    // sentence with "perceptive" still shows you how the family is used, and the
    // card says where it came from.
    if (!(p.examples || []).length && !p.isPhrase && window.lexisStemCandidates) {
      for (const base of window.lexisStemCandidates(p.term)) {
        if (base.length < 4) continue;
        const w2 = await withTimeout(fetchWiktionary(base), 6000, null);
        addEx((w2 && w2.examples) || [], base);
        if (!(p.examples || []).length) addEx(await withTimeout(fetchTatoeba(base), 7000, []), base);
        if ((p.examples || []).length) break;
      }
    }
    // One gate decides what an example is worth, here and in the extension: a
    // bare subject + verb + full stop teaches nothing, and three of them wearing
    // different subjects are one sentence, not three.
    p.examples = window.lexisPickExamples
      ? window.lexisPickExamples(p.examples || [], p.term, { max: 4, context: p.context || "" })
      : (p.examples || []).slice(0, 4);
    if (wantCn) {
      const needEx = (p.examples || []).filter((e) => !e.translation);
      // every sense missing one, not the first three — a fourth row in English
      // only, next to three bilingual rows, reads as a bug (it is one batch)
      const needSense = (p.meanings || []).filter((m) => !m.cn && m.definition);
      const batch = needEx.map((e) => e.text).concat(needSense.map((m) => m.definition));
      if (batch.length) {
        const zh = await translateBatch(batch);
        needEx.forEach((e, i) => { if (zh[i]) e.translation = zh[i]; });
        needSense.forEach((m, i) => { const t = zh[needEx.length + i]; if (t) m.cn = t; });
      }
      if (!p.cn) p.cn = ((p.meanings || [])[0] || {}).cn || await withTimeout(fetchCn(p.term), 7000, "");
    }
    if (!p.freq) p.freq = (await withTimeout(fetchFreq(p.term), 6000, null)) || curatedFreq(p.term);
    // No sense anywhere and the term is MADE of parts → gloss the parts, so the
    // entry has real content instead of "没有找到释义". A plain single word is
    // skipped on purpose: there, an empty result is a transient failure or a
    // typo, and glossing the word with itself would be a lie dressed as help.
    if (!(p.meanings || []).length && !p.partGlosses && window.lexisBreakdownParts) {
      const bp = window.lexisBreakdownParts(p.term);
      if (bp.kind !== "word" && bp.parts.length) {
        const pg = await fetchPartGlosses(bp.parts, wantCn);
        if (Object.keys(pg).length) p.partGlosses = pg;
      }
    }
    p.enriched = true;
    return p;
  }
  // ---- breakdown: a term no dictionary lists still gets content ------------
  // "latency-sensitive" is built on demand by a productive pattern and "the
  // history will write the verdict" is a clause, not a lexical item — neither
  // will EVER have an entry. The pattern gloss, the chunks inside it and the
  // classification are computed offline in data/vocab.js; only a one-line gloss
  // per part needs the network. Mirrors fetchPartGlosses() in background.js.
  // Which sense to show is one engine, shared with the extension — see
  // lexisRankSenses in vocab.js. A second opinion here is how the same word
  // ends up glossed differently on the phone than on the Mac.
  const bestSense = (list, term) => lexisBestSense(list, term);
  const partGlossCache = {};
  async function fetchPartGlosses(parts, wantCn) {
    const out = {};
    await Promise.all((parts || []).slice(0, 6).map(async (raw) => {
      const k = String(raw || "").toLowerCase().replace(/[^a-z'-]/g, "");
      if (!k || k.length < 2) return;
      if (partGlossCache[k]) { out[k] = partGlossCache[k]; return; }
      let g = null;
      const dict = await withTimeout(fetchDictionary(k), 7000, null);
      const dm0 = dict && bestSense(dict.meanings, k);
      if (dm0) g = { pos: dm0.pos || "", definition: dm0.definition };
      if (!g) {
        const wk = await withTimeout(fetchWiktionary(k), 7000, null);
        const s = wk && bestSense(wk.senses, k);
        if (s) g = { pos: s.pos || "", definition: s.definition };
      }
      if (!g) return;
      if (wantCn) { try { g.cn = await withTimeout(fetchCn(k), 6000, ""); } catch (e) {} }
      partGlossCache[k] = g;
      out[k] = g;
    }));
    return out;
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
    return `<div class="card"><h2 class="sec">Word parts</h2><div class="morph">${parts}</div></div>`;
  }
  function cardHTML(p0, opts) {
    const p = asShown(p0);
    opts = opts || {};
    if (p.error) return `<div class="empty">Something went wrong — try again.</div>`;
    const spk = (label, url) => `<button class="speak" data-audio="${esc(url || "")}" data-w="${esc(p.term)}" title="${label}">🔊</button>`;
    let h = `<div class="card">
      <div class="row" style="align-items:baseline">
        <span class="hw serif">${esc(p.term)}</span>
        ${p.vpat ? "" : `${p.phonetic ? `<span class="phon">${esc(p.phonetic)}</span>` : ""}${spk("US", p.audioUs)}${freqChip(p.freq, p.term)}`}
      </div>
      ${p.cn ? `<div class="cn-gloss">${esc(glossFull(p.cn))}</div>` : ""}
      ${p.vpat ? `<p class="muted" style="font-size:12px;margin:6px 0 0;line-height:1.6">Verb pattern · Lexis. You already know
        <b>${esc(p.vpat.v)}</b> — the part that isn't guessable is that it takes <b>${esc(p.vpat.p)}</b>,
        and the object usually sits in between. No dictionary lists the pattern itself.</p>` : ""}
      ${opts.saveBtn ? `<div class="row" style="margin-top:12px">${opts.saveBtn}</div>` : ""}
    </div>`;

    // Breakdown — the composed entry for a term no dictionary lists (and never
    // will): a productive compound, or a clause you liked. Everything here is
    // labelled as composed; we still never pass a part's meaning off as the
    // whole term's meaning.
    const bdObj = (!p.meanings.length && window.lexisTermBreakdown)
      ? window.lexisTermBreakdown(p.term, p.partGlosses) : null;
    const bdOk = !!(bdObj && window.lexisBreakdownUseful && window.lexisBreakdownUseful(bdObj));
    if (bdOk) {
      const KIND0 = window.LEXIS_KIND_CN || {};
      const bparts = bdObj.parts.filter((x) => x.definition || x.cn);
      h += `<div class="card"><h2 class="sec">Breakdown</h2>
        <p class="muted" style="font-size:12px;margin:0 0 8px">${bdObj.kind === "compound"
          ? "No dictionary entry — but it is transparent once you see the pattern."
          : "No dictionary entry: a free combination, not a fixed expression. Here is what it is built from."}</p>
        ${bdObj.gloss ? `<div class="bd-gloss serif">${esc(bdObj.gloss.en)}${bdObj.gloss.cn && !enOnly() ? `<div class="bd-cn">${esc(bdObj.gloss.cn)}</div>` : ""}
          <div class="bd-pat">A regular pattern: <b>X-${esc(bdObj.gloss.tail)}</b> — English builds these on demand.</div></div>` : ""}
        ${bparts.map((x) => `<div class="bd-part"><button class="bd-w" data-look="${esc(x.word)}">${esc(x.word)}</button>${x.pos ? ` <small>${esc(x.pos)}</small>` : ""}
          <div class="bd-d">${esc(x.definition)}${x.cn ? ` · ${esc(x.cn)}` : ""}</div></div>`).join("")}
        ${(bdObj.inside || []).length ? `<div class="bd-inside"><p class="muted" style="font-size:12px;margin:0 0 6px">Fixed expressions inside it — the part worth keeping on its own:</p>
          ${bdObj.inside.map((c) => `<div class="chk-row"><div class="chk-h"><button class="chk-w" data-look="${esc(c.term)}">${esc(c.term)}</button>
            <span class="chk-tag chk-${esc(c.kind)}">${esc(KIND0[c.kind] || c.kind)}</span>
            <button class="chk-add" data-addchunk="${esc(c.term)}">＋</button></div></div>`).join("")}</div>` : ""}
      </div>`;
    }
    if (!p.meanings.length && !bdOk && !p.isPhrase && !p.cn) {
      if (p.suggestions && p.suggestions.length) {
        // if this term is already saved, picking a suggestion should FIX that
        // entry — not silently add a second one and leave the broken original
        const saved = findWord(p.term);
        h += `<div class="card"><h2 class="sec">Dictionary forms</h2>` +
          p.suggestions.map((s) => `<div class="item" data-look="${esc(s.word)}"><span class="w serif">${esc(s.word)}</span><span class="meta">${esc(s.definition)}</span>${saved ? `<button class="btn" data-replace="${esc(s.word)}" data-replace-id="${esc(saved.id)}" style="margin-left:auto;font-size:12px;padding:5px 10px">Use this instead</button>` : ""}</div>`).join("") +
          (saved ? `<div class="muted" style="font-size:12px;margin-top:6px">Use this instead <b>replaces</b> the saved entry and re-queries it — never adds a second.</div>` : "") + `</div>`;
      } else {
        // Sentences we DID find are evidence the phrase is real even when no
        // dictionary lists it — the same "先别急着删" card the extension shows.
        const real = (p.examples || []).filter((e) => e && e.text);
        h += real.length
          ? `<div class="card"><h2 class="sec">Real usage ·  ${real.length}</h2>
              <p class="muted" style="font-size:12px;margin:0 0 8px">No standalone dictionary entry, but these are real corpus uses — the expression does exist. Don't delete it yet.</p>
              ${real.slice(0, 5).map((e) => `<div class="ex">${esc(e.text)}${e.translation ? `<div class="tr">${esc(e.translation)}</div>` : ""}</div>`).join("")}</div>`
          : `<div class="card muted">No definition found. The dictionary may file it under another form (your → one's),Re-fetching usually finds it.</div>`;
      }
    }
    // highlight the headword inside example sentences
    const hi = (txt) => {
      try {
        const re = new RegExp("\\b(" + p.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+") + "\\w*)", "ig");
        return esc(txt).replace(re, "<mark>$1</mark>");
      } catch (e) { return esc(txt); }
    };
    // 释义 (memory-first)
    if (p.meanings.length && !p.vpat) {
      // A saved phrase is often a surface fragment whose dictionary headword is
      // shorter ("quibble about" → "quibble"). We look that up rather than showing
      // nothing — but the definition belongs to the shorter form, so name it.
      h += `<div class="card"><h2 class="sec">Meanings${p.sensesFrom ? ` <span class="sense-src">${esc(DICT_NAME[p.sensesFrom] || p.sensesFrom)}</span>` : ""}</h2>`
        + (p.sensesOf ? `<div class="senses-of">Defined as <b>${esc(p.sensesOf)}</b> — no dictionary entry for the phrase as you saved it.</div>` : "")
        + p.meanings.map((m) =>
        `<div class="mean">${m.pos ? `<span class="pos">${esc(m.pos)}</span> ` : ""}<span class="def">${esc(m.definition)}</span>${m.cn ? `<div class="cn">${esc(m.cn)}</div>` : ""}</div>`).join("") + `</div>`;
    }
    // TELL THEM APART — the same card the extension has, asking the same
    // question of the same model (data/compare.js). Groq answers CORS-open, so
    // the phone can do this itself; there is no service worker here to relay it.
    if (!p.vpat) {
      const c = p.compare;
      h += `<div class="card" id="cmpSec"><h2 class="sec">Tell them apart</h2>
        <div class="cmp-in"><input class="cmp-terms" id="cmpTerms" value="${esc(cmpSeedH5(p))}" placeholder="flourish, nurture, nourish"/>
        <button class="btn" id="cmpGo">Compare</button></div>
        ${cmpChipsH5(p)}
        <div id="cmpBox">${c && c.words ? compareHTMLH5(c) : (getSettings().aiKey
          ? `<div class="cmp-note">Two or three words, comma-separated. One request; the answer is kept with the word.</div>`
          : `<div class="cmp-note">Needs a model key — <b>Groq is free</b> (console.groq.com, no card). Paste it in Me · ⚙️.</div>`)}</div></div>`;
    }
    // 例句 — your OWN sentences first (they're the ones you'll actually remember),
    // then the fetched ones. While phase 2 is still running we keep the section
    // visible with a spinner, so a slow source never reads as "no examples".
    if (opts.examples !== false) {
      const mine = p.userExamples || [];
      const exs = p.examples || [];
      if (mine.length || exs.length || opts.pending || opts.addExample) {
        h += `<div class="card"><h2 class="sec">Examples</h2>` +
          mine.map((e, i) => `<div class="ex mine">${hi(e.text)}${e.translation ? `<div class="tr">${esc(e.translation)}</div>` : ""}<div class="src">My sentences${opts.addExample ? ` · <button class="linklike" data-delex="${i}">delete</button>` : ""}</div></div>`).join("") +
          exs.map((e) => `<div class="ex">${hi(e.text)}${e.translation ? `<div class="tr">${esc(e.translation)}</div>` : ""}${e.from ? `<div class="src">from the same family  <b>${esc(e.from)}</b></div>` : ""}</div>`).join("") +
          (opts.pending ? `<div class="muted" style="font-size:12px"><span class="spin"></span> Topping up examples and gloss……</div>` : "") +
          (!exs.length && !mine.length && !opts.pending ? `<div class="muted" style="font-size:13px">No corpus sentence for this one — writing your own works better anyway.</div>` : "") +
          (opts.addExample ? `<div class="row" style="margin-top:10px"><button class="btn" id="addExBtn">＋ Add my own sentence</button></div>` : "") +
          `</div>`;
      }
    }
    // Phrasal verbs / Fixed expressions that use this word — straight out of the
    // same pools Discover uses: offline, instant, tagged the same way, and each
    // one savable. Replaces the Datamuse bigrams, which matched no category the
    // app teaches and needed a request per phrase before they were readable.
    let chunkList = (typeof window.lexisChunksWith === "function") ? window.lexisChunksWith(p.term, 8) : [];
    // A word the pools don't cover still gets this card: the statistical
    // combinations run through the SAME classifier and wear the SAME chips,
    // instead of a second card with its own vocabulary next to this one.
    let chunkStat = false;
    if (!chunkList.length && (p.collocations || []).length) {
      chunkStat = true;
      chunkList = p.collocations.map((c) => {
        const t = window.lexisCleanChunk ? window.lexisCleanChunk(String(c.phrase || c || "")) : String(c.phrase || c || "");
        return { term: t, kind: (window.lexisKindOf ? window.lexisKindOf(t) : "expr"),
          ptype: (window.lexisPhraseType ? window.lexisPhraseType(t) : ""), gloss: c.definition || "", example: c.example || "" };
      }).filter((c) => c.term);
    }
    if (chunkList.length) {
      const KIND = window.LEXIS_KIND_CN || {}, PT = window.LEXIS_PTYPE_CN || {};
      const saved = new Set(getWords().map((w) => norm(w.word)));
      h += `<div class="card"><h2 class="sec">Phrasal verbs · Fixed expressions</h2>` +
        (chunkStat ? `<p class="muted" style="font-size:12px;margin:0 0 8px">Not in the curated pools — these are the combinations this word actually occurs in, tagged the same way.</p>` : "") +
        chunkList.map((c) => `<div class="chk-row">
          <div class="chk-h"><button class="chk-w" data-look="${esc(c.term)}">${esc(c.term)}</button>
            <span class="chk-tag chk-${esc(c.kind)}">${esc(KIND[c.kind] || c.kind)}</span>
            ${c.ptype && c.ptype !== c.kind ? `<span class="chk-tag">${esc(PT[c.ptype] || c.ptype)}</span>` : ""}
            ${saved.has(norm(c.term)) ? `<span class="chk-add saved">saved</span>` : `<button class="chk-add" data-addchunk="${esc(c.term)}">＋</button>`}</div>
          ${c.gloss ? `<div class="chk-d">${esc(c.gloss)}</div>` : ""}
          ${c.example ? `<div class="chk-e">${esc(c.example)}</div>` : ""}
        </div>`).join("") + `</div>`;
    }
    // Word parts
    h += morphHTML(p.morph);
    // 词族 (with pos)
    if (p.family && p.family.length) h += `<div class="card"><h2 class="sec">Word family</h2><div class="row">` +
      p.family.map((f) => { const w = f.word || f; const pos = f.pos ? ` <small>${esc(f.pos)}</small>` : ""; return `<span class="chip" data-look="${esc(w)}">${esc(w)}${pos}</span>`; }).join("") + `</div></div>`;
    // Why this spelling — the question the word-parts card only looked like it
    // was answering. See lexisSpellPrompt in compare.js.
    if (!p.vpat && !p.isPhrase) {
      const sp = p.spell;
      h += `<div class="card" id="spSec"><h2 class="sec">Why this spelling</h2>
        <div class="cmp-in"><button class="btn" id="spGo">${sp ? "Ask again" : "Explain the spelling"}</button></div>
        <div id="spBox">${sp && (sp.origin_cn || sp.hook_cn) ? spellHTMLH5(sp) : (getSettings().aiKey
          ? `<div class="cmp-note">One request, kept with the word.</div>`
          : `<div class="cmp-note">Needs a model key — <b>Groq is free</b> (console.groq.com), Me · ⚙️.</div>`)}</div></div>`;
    }
    // Origin — knowing the picture behind a phrase is what makes it recallable
    if (p.origin && p.origin.text) {
      const o = p.origin, lit = o.kind === "literal";
      h += `<div class="card"><h2 class="sec">Origin</h2><div class="origin-card">`
        + (lit ? `<div class="org-lead">Literally, <b>${esc(o.of)}</b> is:</div>`
               : (o.of && o.of !== norm(p.term) ? `<div class="org-lead">Origin of <b>${esc(o.of)}</b></div>` : ""))
        + `<div class="org-body">${esc(o.text)}</div>`
        + `<div class="org-src">${lit ? "literal sense" : "etymology"} · Wiktionary</div></div></div>`;
    }
    // Synonyms and look-alikes are the contrast card's chips — ranked, ordered
    // and clickable. Listing them a second time here, inert, was two places
    // saying the same thing (owner: 「这俩部分的功能有点雷同吧」).
    // 词频 (detail-only, like the extension: a measured stat, not part of the meaning)
    if (opts.meter) h += freqMeterHTML(p.freq, p.isPhrase || /\s/.test(p.term || ""), p.term);
    return h;
  }
  function wireCard(root) {
    root.querySelectorAll("[data-audio]").forEach((b) => b.addEventListener("click", () => speak(b.dataset.w, b.dataset.audio)));
    root.querySelectorAll("[data-replace]").forEach((b) => b.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const to = b.dataset.replace;
      const ws = getWords();
      const rec = ws.find((x) => x.id === b.dataset.replaceId);
      if (!rec || !confirm(`Replace “${rec.word}」to “${to}」and re-query?\n(The existing entry is replaced, not duplicated.`)) return;
      replaceWordTerm(rec, to);
    }));
    root.querySelectorAll("[data-look]").forEach((b) => b.addEventListener("click", () => doLookup(b.dataset.look)));
    // ＋ on a phrasal verb / fixed expression: look it up properly and keep it,
    // without leaving the card you are reading
    root.querySelectorAll("[data-addchunk]").forEach((b) => b.addEventListener("click", async (ev) => {
      ev.stopPropagation();
      const t = b.dataset.addchunk;
      b.textContent = "…"; b.disabled = true;
      await autoAdd(t, "", "From a look-up card");
      b.textContent = "saved"; b.classList.add("saved");
    }));
  }
  // ---- My sentences: sentences you type in yourself ------------------------
  // Kept in `data.userExamples` and always rendered ABOVE the fetched ones. The
  // Chinese line is auto-translated (best effort) so you only type the English.
  function wireExampleEditor(root, p, onChange) {
    // "Why this spelling" — same shape as the contrast: one request, kept on the word
    const sg = root.querySelector("#spGo");
    if (sg) sg.addEventListener("click", async () => {
      const box = root.querySelector("#spBox");
      if (!getSettings().aiKey) { box.innerHTML = `<div class="cmp-note">No model key yet — Groq is free (console.groq.com), Me · ⚙️.</div>`; return; }
      box.innerHTML = `<div class="cmp-note">asking…</div>`;
      sg.disabled = true;
      try {
        const out = await aiSpellH5(p.term, ((p.meanings || [])[0] || {}).definition || "");
        p.spell = out;
        box.innerHTML = spellHTMLH5(out);
        sg.textContent = "Ask again";
        onChange && onChange();
      } catch (e) {
        box.innerHTML = `<div class="cmp-note err">Couldn't get it — ${esc(String((e && e.message) || e))}.</div>`;
      }
      sg.disabled = false;
    });
    // "Tell them apart" — one request, cached on the word so it is paid once
    const cg = root.querySelector("#cmpGo");
    if (cg) cg.addEventListener("click", async () => {
      const box = root.querySelector("#cmpBox"), inp = root.querySelector("#cmpTerms");
      const terms = String((inp && inp.value) || "").split(/[,;、]+/).map((t) => t.trim()).filter(Boolean).slice(0, 5);
      if (terms.length < 2) { box.innerHTML = `<div class="cmp-note">Give at least two words, comma-separated.</div>`; return; }
      if (!getSettings().aiKey) { box.innerHTML = `<div class="cmp-note">No model key yet — Groq is free (console.groq.com) and goes in Me · ⚙️.</div>`; return; }
      box.innerHTML = `<div class="cmp-note">asking…</div>`;
      cg.disabled = true;
      try {
        const out = await aiCompareH5(terms, p.context || "");
        p.compare = out;
        box.innerHTML = compareHTMLH5(out);
        onChange && onChange();
      } catch (e) {
        box.innerHTML = `<div class="cmp-note err">Couldn't get the comparison — ${esc(String((e && e.message) || e))}.</div>`;
      }
      cg.disabled = false;
    });
    root.querySelectorAll("[data-cmpadd]").forEach((b) => b.addEventListener("click", (ev) => {
      ev.preventDefault();
      const inp = root.querySelector("#cmpTerms");
      if (!inp) return;
      const w = b.dataset.cmpadd;
      const list = inp.value.split(/[,;、]+/).map((x) => x.trim()).filter(Boolean);
      const at = list.findIndex((x) => x.toLowerCase() === w.toLowerCase());
      if (at >= 0) list.splice(at, 1); else list.push(w);
      inp.value = list.join(", ");
      b.classList.toggle("on", at < 0);
    }));
    // the box arrives pre-filled, so Enter is the gesture — it did nothing before
    const cti = root.querySelector("#cmpTerms");
    if (cti) cti.addEventListener("keydown", (ev) => {
      if (ev.key !== "Enter") return;
      ev.preventDefault();
      const g = root.querySelector("#cmpGo");
      if (g) g.click();
    });
    const add = root.querySelector("#addExBtn");
    if (add) add.addEventListener("click", async () => {
      const text = (prompt("Write a sentence using “" + p.term + "」 example:", "") || "").trim();
      if (!text) return;
      p.userExamples = (p.userExamples || []).concat([{ text, translation: "", at: now() }]);
      onChange();
      if (wantCnNow()) {
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
    const key = norm(p.term);
    if (words.some((w) => w.lookup === key)) return false;
    untombstone(key);      // saving it again is an explicit "I want this back"
    words.unshift({
      id: "w" + now() + Math.random().toString(36).slice(2, 6),
      word: p.term, lookup: key, createdAt: now(), updatedAt: now(),
      context: p.context || "",
      // every original sentence is kept as a dated sighting so past examples never get lost
      sightings: p.context ? [{ context: p.context, at: now(), source: p.source || "Paste & save" }] : [],
      status: p.meanings.length || p.cn ? "ready" : "notfound",
      data: {
        phonetic: p.phonetic, audioUs: p.audioUs, audioUk: p.audioUk, cn: p.cn, freq: p.freq || null,
        meanings: p.meanings, examples: p.examples, userExamples: p.userExamples || [], morph: p.morph,
        synonyms: p.synonyms, synonymsRich: p.synonymsRich, family: p.family,
        lookalikes: p.lookalikes, collocations: p.collocations, isPhrase: p.isPhrase,
        origin: p.origin || null, sensesOf: p.sensesOf || "", sensesFrom: p.sensesFrom || "",
        compare: p.compare || null,     // a contrast you paid for travels with the word
        spell: p.spell || null,         // …and so does the spelling story
        // the composed entry for a term no dictionary lists — see the breakdown
        // card in cardHTML(); without this it was thrown away on save
        partGlosses: p.partGlosses || null,
        // a verb pattern is complete the moment it is saved: nothing to fetch,
        // and no sweep may go looking and overwrite it with "not found"
        vpat: !!p.vpat, done: !!p.done,
      },
      srs: { due: now(), interval: 0, ease: 2.5, reps: 0, lapses: 0, last: 0 },
    });
    setWords(words);
    return true;
  }
  // Replace a saved entry's headword in place and re-query it — never leave the
  // broken original sitting in the notebook next to a new one.
  async function replaceWordTerm(rec, to) {
    untombstone(to);
    toast("Re-querying……");
    const p = await lookupFull(to);
    const ws = getWords();
    const r2 = ws.find((x) => x.id === rec.id);
    if (!r2) return;
    r2.word = p.term; r2.lookup = norm(p.term);
    r2.data = Object.assign({}, r2.data, {
      cn: p.cn, phonetic: p.phonetic, audioUs: p.audioUs, audioUk: p.audioUk, freq: p.freq || null,
      meanings: p.meanings, examples: p.examples, synonyms: p.synonyms, synonymsRich: p.synonymsRich,
      family: p.family, lookalikes: p.lookalikes, collocations: p.collocations, isPhrase: p.isPhrase,
      suggestions: [], notFound: !p.meanings.length && !p.cn,
    });
    r2.status = p.meanings.length || p.cn ? "ready" : "notfound";
    r2.updatedAt = now();
    setWords(ws);
    toast("Renamed to  <b>" + esc(p.term) + "</b>");
    openDetail(r2.id);
  }

  function removeWord(id) {
    const gone = getWords().find((w) => w.id === id);
    setWords(getWords().filter((w) => w.id !== id));
    if (gone) tombstone(gone);   // …so it stays deleted on the other devices
  }
  function wordToPreview(w) {
    const d = w.data || {};
    return { term: w.word, isPhrase: d.isPhrase, cn: d.cn, freq: d.freq || null, phonetic: d.phonetic, audioUs: d.audioUs, audioUk: d.audioUk,
      meanings: d.meanings || [], examples: d.examples || [], userExamples: d.userExamples || [], morph: d.morph, synonyms: d.synonyms || [],
      synonymsRich: d.synonymsRich || [], family: d.family || [], lookalikes: d.lookalikes || [], collocations: d.collocations || [],
      origin: d.origin || null, sensesOf: d.sensesOf || "", sensesFrom: d.sensesFrom || "",
      partGlosses: d.partGlosses || null, extraLoaded: true };
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
    fill("sensesOf", p.sensesOf); fill("sensesFrom", p.sensesFrom);
    fill("origin", p.origin);
    if (p.partGlosses && Object.keys(p.partGlosses).length) {
      d.partGlosses = Object.assign({}, d.partGlosses || {}, p.partGlosses); changed = true;
    }
    // Settled: it has what an entry needs, so nothing looks it up again on its
    // own. Same rule as the extension's enrich() — see needsSupplement().
    // A term no dictionary lists settles on its BREAKDOWN: asking again next week
    // will not produce an entry that does not exist.
    const wasDone = d.done;
    const hasBreakdown = !!(d.partGlosses && Object.keys(d.partGlosses).length);
    d.done = !!(((d.meanings || []).length && ((d.examples || []).length || (d.userExamples || []).length))
      || (!(d.meanings || []).length && hasBreakdown)) && (!wantCnNow() || d.cn);
    if (d.done && !wasDone) { d.doneAt = now(); changed = true; }
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
          lose.context && !(lose.sightings || []).length ? [{ context: lose.context, at: lose.createdAt, source: "merged" }] : []);
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

  // ---- SRS ---------------------------------------------------------------
  // The scheduler lives in vocab.js, shared byte-for-byte with the extension —
  // two copies of this drifted apart is the one thing that would make the same
  // notebook behave differently on the phone.
  function schedule(srs, grade) { return window.lexisSchedule(srs, grade); }
  function intervalLabel(d) { if (d < 1) return "10 min"; if (d < 30) return d + "d"; return Math.round(d / 30) + "mo"; }
  const dueWords = () => getWords().filter((w) => (w.srs ? w.srs.due : 0) <= now());

  // =======================================================================
  //  VIEWS
  // =======================================================================
  const view = $("#view");
  let current = "lookup";

  function refreshBadge() {
    const n = dueWords().length;
    $("#dueBadge").textContent = n ? n + "  due" : "";
  }

  // 查词 and Notebook are one tab — the search box at the top of the notebook does
  // both: it filters what you've saved as you type, and looks up anything you
  // haven't. `nbView` says whether the tab is currently showing the list, a
  // look-up result, or a saved word's detail.
  let nbView = { mode: "list", term: "", ctx: "", id: null };
  // Every tab shares ONE document scroll. Sending it to the top on every go()
  // meant scrolling down the notebook cost you your place in Discover, and you
  // had to scroll back down each time you switched — and a background sync
  // repaint (go(current)) yanked you to the top mid-read. Each tab now keeps
  // its own offset: saved on the way out, restored on the way in, top for a tab
  // you have never opened. Repainting the tab you are already on restores the
  // offset it just saved, so it no longer moves you at all.
  const tabScroll = Object.create(null);
  function go(tab) {
    if (tab === "lookup") tab = "notebook";
    tabScroll[current] = window.scrollY;
    current = tab;
    document.querySelectorAll(".tabbar button").forEach((b) => b.classList.toggle("on", b.dataset.tab === tab));
    ({ notebook: renderNotebook, review: renderReview, discover: renderDiscover, me: renderMe }[tab])();
    window.scrollTo(0, tabScroll[tab] || 0);
    refreshBadge();
  }

  // ---- select-to-look-up ---------------------------------------------------
  // Long-press-select any text in the app (a passage, an example, a definition)
  // and a chip offers 查词 / ＋Notebook — and, while reading an assessment passage,
  // 不懂 for a whole chunk. Same mechanism the extension's content script gives
  // you on a normal web page; the app itself had nothing.
  let selChip = null, selTerm = "", passagePhrases = null;
  // a drag that overshoots a sentence boundary shouldn't produce "anything. S" —
  // keep the longest clause of the selection, then trim the punctuation off it
  function selClause(s) {
    const parts = String(s || "").split(/[.!?;:,]/).map(cleanTerm).filter(Boolean);
    return parts.length > 1 ? parts.sort((a, b) => b.length - a.length)[0] : cleanTerm(s);
  }
  function hideSelChip() { if (selChip) selChip.classList.remove("show"); selTerm = ""; }
  function onSelectionChanged() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return hideSelChip();
    const raw = selClause(sel.toString());
    const n = raw.split(" ").filter(Boolean).length;
    if (!raw || n > 6 || raw.length > 60 || !/[A-Za-zÀ-ÿ]{2,}/.test(raw)) return hideSelChip();
    const range = sel.getRangeAt(0);
    let node = range.commonAncestorContainer;
    if (node.nodeType === 3) node = node.parentElement;
    if (!node || node.closest("input, textarea, .selchip")) return hideSelChip();
    selTerm = raw;
    const inPassage = !!node.closest("#ptext") && !!passagePhrases;
    if (!selChip) {
      selChip = el(`<div class="selchip"></div>`);
      document.body.appendChild(selChip);
      selChip.addEventListener("click", (e) => {
        const b = e.target.closest("button"); if (!b || !selTerm) return;
        const t = selTerm, act = b.dataset.act;
        hideSelChip();
        try { window.getSelection().removeAllRanges(); } catch (err) {}
        if (act === "look") { doLookup(t); return; }
        if (act === "unk" && passagePhrases) { passagePhrases.add(t.toLowerCase()); toast("Chunk marked <b>" + esc(t) + "</b>"); return; }
        if (act === "save") saveFromSelection(t);
      });
    }
    selChip.innerHTML = `<span class="selchip-t">${esc(raw)}</span>
      <button data-act="look">Look up</button>
      ${inPassage ? `<button data-act="unk">Don't know</button>` : ""}
      <button data-act="save">＋Notebook</button>`;
    selChip.classList.add("show");
    const rect = range.getBoundingClientRect();
    const half = selChip.offsetWidth / 2;
    selChip.style.left = Math.min(Math.max(rect.left + rect.width / 2, half + 8), window.innerWidth - half - 8) + "px";
    selChip.style.top = (rect.top > 52 ? rect.top - 10 : rect.bottom + 40) + "px";
  }
  async function saveFromSelection(t) {
    toast("Looking up……");
    const p = await lookupFull(t);
    if (saveWord(p)) { toast("Added to your notebook <b>" + esc(t) + "</b>"); refreshBadge(); }
    else toast("Already in your notebook");
  }
  document.addEventListener("mouseup", () => setTimeout(onSelectionChanged, 10));
  document.addEventListener("touchend", () => setTimeout(onSelectionChanged, 250));
  document.addEventListener("selectionchange", () => { const s = window.getSelection(); if (!s || s.isCollapsed) hideSelChip(); });
  document.addEventListener("scroll", hideSelChip, true);

  // ---- LOOKUP ----
  // ctx = the sentence the word came from, when the caller has one (?q=&ctx=,
  // mirroring the extension's #look/<term>/<context>). It is shown above the
  // card AND carried into saveWord, so Original context survives the save.
  // Show a look-up result inside the notebook tab (they are one tab now), hiding
  // the list behind it. closeLookup() puts the list back.
  function openLookupPane() {
    if (current !== "notebook") go("notebook");
    document.body.classList.add("looking");
    window.scrollTo(0, 0); // a fresh look-up card starts at the top, not at the list's offset
    return $("#result");
  }
  function closeLookup() {
    document.body.classList.remove("looking");
    const box = $("#result"); if (box) box.innerHTML = "";
  }
  async function doLookup(term, ctx) {
    term = norm(term);
    if (!term) return;
    // 查词与Notebook本质是同一件事:已经收藏的词直接打开它的Notebook页面(释义/例句都在,
    // 外加Original context、Mastery、My sentences和删除按钮),而不是再给一张只读的查词卡。
    // 带 ctx 的粘贴/快捷指令流程除外——那一步要先让你确认是否追加这条原句。
    const already = findWord(term);
    if (already && !ctx) { openDetail(already.id); return; }
    const box = openLookupPane();
    if (!box) return;
    box.innerHTML = `<div class="lookup-bar"><button class="btn" id="lkBack">← Notebook</button></div>
      <div class="empty"><span class="spin"></span> Looking up……</div>`;
    $("#lkBack").addEventListener("click", closeLookup);
    const seq = ++doLookup._seq;
    const p = await lookup(term);
    if (seq !== doLookup._seq) return;             // a newer look-up已经开始
    if (ctx) p.context = ctx;

    // paint the card; called twice — once with the fast core, once after 自动增补
    const paint = (pending) => {
      const existing = findWord(term);
      // 自动增补 repaints the card — don't yank the caret out of the sentence box
      const oldTa = $("#ctxTa");
      const keepTa = (oldTa && document.activeElement === oldTa) ? { v: oldTa.value, s: oldTa.selectionStart } : null;
      // is this exact sentence already recorded on the saved word?
      const ctxKnown = !ctx || (existing && (existing.sightings || []).some((s) => (s.context || "").trim() === ctx) || (existing && (existing.context || "").trim() === ctx));
      let saveBtn;
      if (!existing) saveBtn = `<button class="btn sage" id="saveBtn">Save to notebook</button>`;
      else if (ctx && !ctxKnown) saveBtn = `<button class="btn sage" id="appendBtn">＋ Add this sentence</button>`;
      else saveBtn = `<button class="btn" id="openNbBtn">📖 Already saved · open</button>`;
      // Before it's saved the sentence is editable — on the phone nothing can
      // read a sentence off the page for you, so typing one has to be possible
      // at the moment you look the word up, not only afterwards.
      const ctxCard = existing
        ? (ctx ? contextCardHTML({ word: p.term || term, context: ctx, createdAt: now() }) : "")
        : `<div class="card"><h2 class="sec">Sentence · 原句</h2>
             <textarea class="lk-ta" id="ctxTa" rows="2" placeholder="No sentence captured — write your own">${esc(p.context || ctx || "")}</textarea>
             <div class="muted" style="font-size:11px;margin-top:5px">Saved with the word as its original context.</div></div>`;
      box.innerHTML = `<div class="lookup-bar"><button class="btn" id="lkBack">← Notebook</button></div>`
        + ctxCard + cardHTML(p, { saveBtn, pending, meter: true, addExample: true });
      const cta = $("#ctxTa");
      if (cta) {
        cta.addEventListener("input", () => { p.context = cta.value; });
        if (keepTa) { cta.value = keepTa.v; cta.focus(); try { cta.setSelectionRange(keepTa.s, keepTa.s); } catch (e) {} }
      }
      $("#lkBack").addEventListener("click", closeLookup);
      wireCard(box);
      wireExampleEditor(box, p, () => paint(pending));
      const sb = $("#saveBtn");
      if (sb) sb.addEventListener("click", () => {
        const ta = $("#ctxTa");
        if (ta) p.context = ta.value.trim();
        if (ctx) p.source = "Paste & save";
        if (saveWord(p)) { toast(p.context ? "Saved <b>" + esc(p.term) + "</b> (with its sentence)" : "Saved <b>" + esc(p.term) + "</b>"); paint(false); refreshBadge(); }
        else toast("Already in your notebook");
      });
      const ob = $("#openNbBtn");
      if (ob) ob.addEventListener("click", () => { const w = findWord(term); if (w) openDetail(w.id); });
      const ab = $("#appendBtn");
      if (ab) ab.addEventListener("click", () => {
        const ws = getWords(); const rec = ws.find((w) => w.lookup === term);
        if (!rec) return;
        rec.sightings = rec.sightings || (rec.context ? [{ context: rec.context, at: rec.createdAt || now(), source: "Paste & save" }] : []);
        rec.sightings.unshift({ context: ctx, at: now(), source: "Paste & save" });
        if (!rec.context) rec.context = ctx;
        rec.updatedAt = now(); setWords(ws); refreshBadge();
        toast("Sentence added to  <b>" + esc(term) + "</b>");
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
  // Set once you pick a sort yourself. Until then the Mastered tab orders by
  // recency — frequency answers "what should I learn next", which is not the
  // question you ask about words you have already finished.
  let nbSortPicked = false;
  // SAME three buckets as Discover — 单词 / Phrasal verbs / Fixed expressions — from the same
  // shared classifier, so a term carries one label everywhere it appears. The
  // finer split (习语/介词短语/…) is the chip row below.
  const NB_KINDS = [["all", "All"], ["word", "Words"], ["pv", "Phrasal verbs"], ["expr", "Fixed expressions"]];
  // Confusables is not a kind of entry — it is a different object (sets of words
  // you asked about), so it gets its own switch, not a fifth chip in that row.
  let nbTable = "words";  // "words" | "cmp" — which LIST the notebook shows
  // Every "tell them apart" answer is stored on the entry it was asked from, so
  // this list is DERIVED — no second store, no second sync. It is exactly the
  // set of words you have been confusing. (Same shape as the extension's.)
  function nbCompares() {
    const seen = new Set(), out = [];
    getWords().forEach((w) => {
      const c = (w.data || {}).compare;
      if (!c || !Array.isArray(c.words) || !c.words.length) return;
      const terms = (c.terms && c.terms.length ? c.terms : c.words.map((x) => x.word));
      const key = (typeof window.lexisCompareKey === "function") ? window.lexisCompareKey(terms) : terms.join("|").toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ key, terms, c, from: w });
    });
    return out.sort((a, b) => ((b.c.at || 0) - (a.c.at || 0)));
  }
  function renderComparesH5() {
    const rows = nbCompares();
    if (!rows.length) {
      return `<div class="card"><p class="muted" style="line-height:1.7">No comparisons yet. Open any word and use <b>Tell them apart</b> — the answer is kept with the word, and every set you ask about shows up here.</p></div>`;
    }
    return rows.map((r) => `<div class="card">
      <div class="cmp-cands">${r.terms.map((t) => {
        const saved = getWords().some((w) => w.lookup === norm(t));
        return `<button class="cmp-cand${saved ? " on" : ""}" data-look="${esc(t)}">${esc(t)}</button>`;
      }).join("")}</div>
      ${r.c.shared_cn ? `<div class="cmp-shared"><span class="lbl">共同点</span>${esc(r.c.shared_cn)}</div>` : ""}
      ${r.c.axis_cn ? `<div class="cmp-axis"><span class="lbl">分界线</span>${esc(r.c.axis_cn)}</div>` : ""}
      <details><summary class="muted" style="font-size:12px">The whole answer</summary>${compareHTMLH5(r.c)}</details>
    </div>`).join("");
  }
  const _kindCache = new Map();
  function nbKindOf(w) {
    const t = norm(w.word || "");
    if (_kindCache.has(t)) return _kindCache.get(t);
    const k = window.lexisKindOf ? window.lexisKindOf(t) : (/\s/.test(t) ? "expr" : "word");
    _kindCache.set(t, k);
    return k;
  }
  // mastery status from the SRS state (mirrors the extension's masteryOf tiers)
  function masteryOfH5(w) {
    const s = w.srs || {};
    // Mastered also needs the word WRITTEN into several different sentences —
    // spacing alone only shows you recognised it on schedule
    const need = window.lexisProduceTarget ? window.lexisProduceTarget(w) : 0;
    const done = window.lexisProduced ? window.lexisProduced(w) : 0;
    const produced = need < 2 || done >= need;
    if ((s.interval || 0) >= 21 && produced) return { key: "mastered", cn: "Known" };
    if ((s.interval || 0) >= 21) return { key: "familiar", cn: `Familiar · produced  ${done}/${need}` };
    if ((s.lapses || 0) >= 4) return { key: "leech", cn: "Tricky" };
    if ((s.reps || 0) >= 3) return { key: "familiar", cn: "Familiar" };
    if ((s.reps || 0) >= 1) return { key: "learning", cn: "Learning" };
    return { key: "new", cn: "Not learned" };
  }
  const NB_BAND_ORDER = { core: 0, "very-common": 1, common: 2, mid: 3, low: 4, rare: 5 };
  const NB_SORTS = [["new", "Recently saved"], ["freq", "Frequency"], ["due", "Due"], ["az", "A–Z"]];
  function effNbSort() {
    return nbSortPicked ? nbSort : (nbFilter === "mastered" ? "new" : nbSort);
  }
  function nbSortList(list) {
    const l = list.slice();
    const nbSort = effNbSort();
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
    const kindCounts = { all: words.length, word: 0, pv: 0, expr: 0 };
    words.forEach((w) => { kindCounts[nbKindOf(w)]++; });
    view.innerHTML = `
      <div class="subtabs nb-only" id="nbkinds">
        ${NB_KINDS.map(([k, cn]) => `<button data-k="${k}" class="${nbKind === k ? "on" : ""}">${cn} ${kindCounts[k]}</button>`).join("")}
      </div>
      ${/* a link away to a different object, not a second row of filters */""}
      ${nbTable === "cmp"
        ? `<button class="nb-switch on nb-only" data-v="words">← Entries</button>`
        : (nbCompares().length ? `<button class="nb-switch nb-only" data-v="cmp">Confusables <b>${nbCompares().length}</b> →</button>` : "")}
      <div class="subtabs nb-only" id="nbtabs">
        <button data-f="all" class="${nbFilter === "all" ? "on" : ""}">All</button>
        <button data-f="learning" class="${nbFilter === "learning" ? "on" : ""}">Learning</button>
        <button data-f="mastered" class="${nbFilter === "mastered" ? "on" : ""}">Known</button>
      </div>
      <form class="search" id="nbsearch" style="margin-bottom:10px">
        <input id="nbq" placeholder="Search your notebook, or type a new word to look it up…" value="${esc(nbQuery)}" autocomplete="off" autocapitalize="off" spellcheck="false">
        <button class="btn icon" type="button" id="pasteBtn" title="Paste from clipboard">📋</button>
        <button class="btn primary" type="submit">Look up</button>
      </form>
      <div class="sortbar nb-only" id="nbsort">
        <button class="catf ctrl-toggle" id="nbMore">Filter · sort ▾</button>
        <span class="ctrl-wrap">Sort: ${NB_SORTS.map(([k, cn]) =>
          `<button class="catf${effNbSort() === k ? " on" : ""}" data-s="${k}">${cn}</button>`).join("")}
          <span class="muted" style="font-size:12px;flex-basis:100%">The tag after each word is its <b>frequency</b>: core / very common / common / mid / low / rare — the earlier, the more worth learning first.</span>
        </span>
      </div>
      <div id="result"></div>
      <div id="nbcats" class="ctrl-wrap nb-only"></div>
      <span class="ctrl-wrap nb-only">${kindRuleHTML()}</span>
      <div id="nblist" class="nb-only"></div>`;
    view.querySelectorAll("#nbkinds button").forEach((b) => b.addEventListener("click", () => { nbKind = b.dataset.k; nbScene = null; renderNotebook(); }));
    view.querySelectorAll("[data-v]").forEach((b) => b.addEventListener("click", () => { nbTable = b.dataset.v; renderNotebook(); }));
    view.querySelectorAll("#nbtabs button").forEach((b) => b.addEventListener("click", () => { nbFilter = b.dataset.f; renderNotebook(); }));
    // one toggle instead of three permanent rows of controls above the list
    $("#nbMore").addEventListener("click", () => {
      nbCtrlsOpen = !nbCtrlsOpen;
      view.querySelectorAll(".ctrl-wrap").forEach((n) => n.classList.toggle("open", nbCtrlsOpen));
      $("#nbMore").textContent = nbCtrlsOpen ? "Collapse ▴" : "Filter · sort ▾";
    });
    if (nbCtrlsOpen) { view.querySelectorAll(".ctrl-wrap").forEach((n) => n.classList.add("open")); $("#nbMore").textContent = "Collapse ▴"; }
    view.querySelectorAll("#nbsort [data-s]").forEach((b) => b.addEventListener("click", () => { nbSort = b.dataset.s; nbSortPicked = true; renderNotebook(); }));
    $("#nbsearch").addEventListener("submit", (e) => {
      e.preventDefault();
      const t = ($("#nbq") ? $("#nbq").value : nbQuery).trim();
      if (t) doLookup(t);      // same tab: saved words open their entry, new ones get looked up
    });
    $("#pasteBtn").addEventListener("click", pasteAndSave);
    const qi = $("#nbq");
    qi.addEventListener("input", () => { nbQuery = qi.value; drawNbList(); });

    function drawNbList() {
      // the comparisons tab renders a different list entirely
      if (nbTable === "cmp") {
        const cb = $("#nblist");
        cb.innerHTML = renderComparesH5();
        cb.querySelectorAll("[data-look]").forEach((n) => n.addEventListener("click", () => doLookup(n.dataset.look)));
        return;
      }
      let list = words.slice();
      // "cmp" is the comparisons tab, not a kind of word — see renderComparesH5
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
          ? `<div class="empty"><div class="big">🔍</div>No match for “${esc(q)}”.<div class="row" style="justify-content:center;margin-top:12px"><button class="btn primary" id="nbLookup">Look up “${esc(q)}」</button></div></div>`
          : `<div class="empty"><div class="big">📖</div>${nbScene ? "Nothing in this category — press All." : "No words yet. Look one up and save it."}</div>`;
        const nl = $("#nbLookup");
        if (nl) nl.addEventListener("click", () => doLookup(q));
        return;
      }
      box.innerHTML = list.map((w0) => {
        const w = asShown(w0);          // 全英模式:这一行也不该冒出中文
        const d = w.data || {};
        const m = masteryOfH5(w);
        const dueIn = w.srs && w.srs.due > now() ? "next " + intervalLabel(Math.round((w.srs.due - now()) / DAY)) : "due";
        // the old status dot said nothing useful — the frequency band does
        // a composed entry is not a broken one — say "composed", and show the
        // pattern gloss rather than an empty second line
        const cbd = (!((d.meanings || []).length) && window.lexisTermBreakdown)
          ? window.lexisTermBreakdown(w.word, d.partGlosses) : null;
        const composed = (cbd && window.lexisBreakdownUseful(cbd))
          ? ((cbd.gloss && cbd.gloss.en) || (cbd.parts.find((x) => x.definition) || {}).definition || "") : "";
        const tag = w.status === "notfound"
          ? `<span class="mfreq nf">${composed ? "composed" : "not found"}</span>` : freqChip(d.freq, w.word);
        return `<div class="item" data-open="${w.id}">
          <div style="min-width:0"><div class="w serif">${esc(w.word)} ${tag} <span class="mstat m-${m.key}">${m.cn}</span></div><div class="meta">${esc(glossLine(d.cn, (d.meanings || [])[0] && d.meanings[0].pos) || ((d.meanings || [])[0] && d.meanings[0].definition) || composed || "")}</div></div>
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
    if (!todo.length) { if (opts.manual) toast("Every entry in your notebook is complete ✓"); return 0; }
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
      return `<div class="ex">${hi(s.context)}${meta ? `<div class="src">source: ${esc(meta)}</div>` : ""}</div>`;
    }).join("");
    return `<div class="card"><h2 class="sec">Original context${list.length > 1 ? ` · ${list.length}` : ""}</h2>${rows}</div>`;
  }

  // Mastery — the SRS state the review engine already tracks, made visible
  function masteryCardHTML(w) {
    const s = w.srs || {};
    const iv = s.interval || 0;
    const pct = Math.min(100, Math.round((iv / 21) * 100)); // 21 天间隔 = 判定Mastered
    const next = s.due ? (s.due <= now() ? "now" : intervalLabel(Math.max(1, Math.round((s.due - now()) / DAY)))) : "now";
    return `<div class="card"><h2 class="sec">Mastery</h2>
      <div class="meter"><i style="width:${pct}%"></i></div>
      <div class="muted" style="font-size:12px"><b>${s.reps || 0}</b> correct in a row · interval <b>${iv ? iv + "d" : "not started"}</b> · next review <b>${esc(next)}</b>${s.lapses ? ` · lapsed ${s.lapses}×` : ""}</div>
    </div>`;
  }
  // a saved word is "thin" if the look-up sections it should have are missing —
  // this is what triggers the silent 自动增补 when you open it.
  function needsSupplement(w) {
    const d = w.data || {};
    // A notebook KEEPS things. Once an entry has what an entry needs it is
    // settled and nothing re-queries it on its own — only the explicit 增补 /
    // Re-fetch button does. Before this, opening a word could kick off another
    // round of fetches every time, which is why definitions kept "needing" a
    // re-query and why a source having a bad minute could blank a good entry.
    if (d.done) return false;
    // a term no dictionary lists, but that HAS its breakdown, is finished too —
    // re-querying it next week cannot produce an entry that doesn't exist
    if (!(d.meanings || []).length && d.partGlosses && Object.keys(d.partGlosses).length) return false;
    if (!d.freq && !d.freqTried) return true;
    if (!(d.meanings || []).length) return true;
    if (!(d.examples || []).length) return true;
    if (wantCnNow() && !(d.examples || []).some((e) => e.translation)) return true;
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
    if (manual) toast("Topping up……");
    const p = await lookupFull(w.word);
    const changed = mergeIntoWord(id, p);
    if (manual) toast(changed ? "Topped up ✓" : "Nothing new to add");
    if (current === "notebook") { if ($("#det")) openDetail(id); }
  }

  function openDetail(id) {
    const w = getWords().find((x) => x.id === id);
    if (!w) return;
    document.body.classList.remove("looking");
    const auto = getSettings().autoEnrich !== false && !_supplemented.has(id) && needsSupplement(w);
    view.innerHTML = `<div class="row" style="margin-bottom:12px">
        <button class="btn" id="back">← Back</button>
        <button class="btn" id="sup" style="margin-left:auto">${auto ? "Topping up…" : "Top up"}</button>
        <button class="btn" id="edit">Edit</button>
        <button class="btn" id="del">Delete</button>
      </div><div id="det"></div>`;
    const isMastered = masteryOfH5(w).key === "mastered";
    const prev = wordToPreview(w);
    $("#det").innerHTML = cardHTML(prev, { examples: getSettings().showExamples, meter: true, pending: auto, addExample: true })
      + contextCardHTML(w) + masteryCardHTML(w)
      + `<div class="card"><h2 class="sec">Actions</h2><div class="row">
          <button class="btn" id="revNow">Review now</button>
          <button class="btn ${isMastered ? "" : "sage"}" id="tglMaster">${isMastered ? "Unmark known" : "Mark as known"}</button>
          <button class="btn" id="resetProg">Reset progress</button>
        </div></div>`;
    wireCard($("#det"));
    // My sentences edits write straight through to the saved word
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
      const before = JSON.parse(JSON.stringify((getWords().find((x) => x.id === id) || {}).srs || {}));
      toast(isMastered ? "Unmarked" : "Marked as known", () => { patchSrs(() => before); openDetail(id); });
      openDetail(id);
    });
    $("#resetProg").addEventListener("click", () => {
      const prevSrs = JSON.parse(JSON.stringify(w.srs || {}));
      patchSrs(() => ({ due: now(), interval: 0, ease: 2.5, reps: 0, lapses: 0, last: 0 }));
      toast("Progress reset", () => { patchSrs(() => prevSrs); openDetail(id); });
      openDetail(id);
    });
    $("#sup").addEventListener("click", () => supplement(id, true));
    if (auto) supplement(id, false);
    $("#back").addEventListener("click", () => go("notebook"));
    $("#del").addEventListener("click", () => {
      const snapshot = getWords().find((x) => x.id === id);
      removeWord(id); go("notebook"); refreshBadge();
      toast("Deleted <b>" + esc(w.word) + "</b>", () => {
        const ws = getWords();
        if (!ws.some((x) => x.id === id)) { snapshot.updatedAt = now(); ws.unshift(snapshot); untombstone(snapshot); setWords(ws); }
        toast("Restored"); refreshBadge(); openDetail(id);
      });
    });
    $("#edit").addEventListener("click", async () => {
      const next = cleanTerm(prompt("Edit entry:", w.word) || "");
      if (!next || next === w.word) return;
      toast("Re-querying……");
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
      toast("Updated");
      openDetail(id);
    });
  }

  // ---- REVIEW ----
  // Two modes. 认释义 (receptive) is the classic card. 会说 (productive) blanks the
  // target out of a real sentence and asks you to supply it — a constructed-response
  // task, which is how the literature actually measures productive knowledge, and
  // the thing that closes the "I can read it but can't say it" gap. Productive is
  // only offered when we have a usable sentence to blank.
  let session = null;
  let revScope = "all";        // all | phrase — 短语/习语 have their own queue
  let revFine = false;         // show the 4-level grade bar instead of 不会/会了
  const REV_SCOPES = [["all", "All"], ["phrase", "Phrases & idioms only"]];

  const isChunk = (w) => /\s/.test((w.word || "").trim());
  function scopedDue() {
    const due = dueWords();
    return revScope === "phrase" ? due.filter(isChunk) : due;
  }
  // Answer checking lives in vocab.js as lexisCheckAnswer — it has to report WHY
  // an answer was wrong (typo / inflection / genuinely wrong) so the card can
  // give real feedback and derive its own grade, and both surfaces have to make
  // that call identically.

  // ---- corrective feedback ------------------------------------------------
  // Flipping the card over and showing the answer is not feedback. The three
  // ways of being wrong are different events and are named separately.
  function feedbackHTML(chk) {
    if (!chk) return "";
    const msg = {
      exact: "Correct",
      inflection: `Correct — here it takes the form <b>${esc(chk.want)}</b>`,
      typo: "Right word, spelled wrong",
      wrong: "Not this one",
      empty: "No answer — here it is",
    }[chk.kind] || "";
    const cmp = (chk.kind === "exact" || chk.kind === "empty") ? ""
      : `<div class="rv-fb-cmp"><span class="you">${esc(chk.typed)}</span><span class="arr">→</span><span class="want">${esc(chk.want)}</span></div>`;
    return `<div class="rv-fb ${chk.ok ? "ok" : "no"}"><div class="rv-fb-msg">${msg}</div>${cmp}</div>`;
  }
  // The episode a sentence was heard in — one tap back to that second.
  function videoRefHTML(dr) {
    const v = dr.video || (dr.sentence && dr.sentence.video);
    if (!v || !v.url) return "";
    const at = v.at != null ? window.lexisFmtAt(v.at) : "";
    return `<div class="rv-vid"><a href="${esc(v.url)}" target="_blank" rel="noopener">▸ ${esc(vidTitleH5(v.title) || "the episode")}${at ? " · " + at : ""}</a> <span>— where you heard it</span></div>`;
  }

  // ---- streak / daily progress -------------------------------------------
  // A queue of due cards is a chore. A streak you don't want to break, a goal you
  // can finish in five minutes, and a visible "今天还差 3 个" are what actually get
  // someone to open the app — so the review tab opens on that, not on a card.
  const dayKey = (t) => { const d = new Date(t || now()); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); };
  function revStats() {
    const s2 = getSettings();
    const r = s2.rev || { day: "", count: 0, streak: 0, lastDay: "" };
    if (r.day !== dayKey()) { r.count = 0; r.day = dayKey(); }
    return r;
  }
  function bumpRevStats() {
    const s2 = getSettings();
    const r = revStats();
    const today = dayKey();
    if (r.lastDay !== today) {
      const y = dayKey(now() - DAY);
      r.streak = r.lastDay === y ? (r.streak || 0) + 1 : 1;
      r.lastDay = today;
    }
    r.count = (r.count || 0) + 1;
    s2.rev = r; setSettings(s2);
  }

  function renderReview() {
    const due = scopedDue();
    const scopeBar = `<div class="subtabs" id="revscope">${REV_SCOPES.map(([k, cn]) =>
      `<button data-rs="${k}" class="${revScope === k ? "on" : ""}">${cn}</button>`).join("")}</div>`;
    // an in-progress session goes straight back to the card
    if (session && session.queue.length && session.scope === revScope) { drawCard(); return; }
    const st = revStats();
    const goal = getSettings().dailyGoal || 20;
    const doneToday = st.count || 0;
    const pct = Math.min(100, Math.round((doneToday / goal) * 100));
    const chunks = due.filter(isChunk).length;
    const est = Math.max(1, Math.round(Math.min(due.length, goal - doneToday || due.length) * 0.25));
    view.innerHTML = scopeBar + `
      <div class="card rev-home">
        <div class="rev-streak">${st.streak > 0 ? `🔥 <b>${st.streak}</b>-day streak` : "Start today off"}</div>
        <div class="stat" style="font-size:34px">${due.length}</div>
        <div class="muted"> due · including  ${chunks}  of them phrases or idioms</div>
        <div class="meter"><i style="width:${pct}%"></i></div>
        <div class="muted" style="font-size:12px">today ${doneToday} / ${goal} · about ${est} min</div>
        ${due.length ? `<div class="row" style="margin-top:16px">
            <button class="btn primary" id="revStart" style="flex:1;padding:15px;font-size:16px">Start review</button>
          </div>
          <div class="row" style="margin-top:8px;justify-content:center">
            ${[10, 20, 0].map((n) => `<button class="catf" data-len="${n}">${n ? n + "" : "All"}</button>`).join("")}
          </div>`
          : `<div class="muted" style="margin-top:16px">✅ ${revScope === "phrase" ? "No phrases or idioms due." : "All done for today."}</div>`}
      </div>
      ${doneToday ? `<div class="card"><h2 class="sec">Today</h2><div class="muted" style="font-size:13px">reviewed <b>${doneToday}</b>${doneToday >= goal ? " · goal reached 🎉" : ` · ${goal - doneToday} to go`}</div></div>` : ""}`;
    wireScope();
    const start = $("#revStart");
    if (start) {
      const begin = (n) => {
        const q = n ? due.slice(0, n) : due.slice();
        session = { queue: q, total: q.length, done: 0, showBack: false, scope: revScope };
        drawCard();
      };
      start.addEventListener("click", () => begin(Math.min(due.length, goal)));
      view.querySelectorAll("[data-len]").forEach((b) => b.addEventListener("click", () => begin(+b.dataset.len)));
    }
  }
  function wireScope() {
    view.querySelectorAll("#revscope button").forEach((b) => b.addEventListener("click", () => {
      revScope = b.dataset.rs; session = null; renderReview();
    }));
  }
  // ---- one drill per card, built once so a redraw doesn't reshuffle it -----
  function currentDrill(w) {
    if (session.drill && session.drillFor === w.id) return session.drill;
    const s2 = getSettings();
    const force = s2.reviewDrill && s2.reviewDrill !== "auto" ? s2.reviewDrill : null;
    session.drill = window.lexisBuildDrill
      ? window.lexisBuildDrill(w, getWords(), { force, lang: enOnly() ? "en" : "cn",
          // Cards SHOWN this session — paces the tap-only breather slots and
          // makes the session open on one. Deliberately not session.done, which
          // on this surface counts every card but on the extension counts only
          // the ones you got right; a shared engine needs the same input on both.
          slot: session.shown || 0,
          seed: ((w.srs && w.srs.reps) || 0) + session.done + 1 })
      : { mode: "recall" };
    if (enOnly()) session.drill = stripCn(session.drill);
    session.drillFor = w.id;
    // How long you took separates "knew it" from "worked it out", and it costs
    // nothing to collect.
    session.askedAt = now();
    return session.drill;
  }
  const DRILL_HINT_CN = {
    en2cn: "Which of these does it mean?",
    flip: "Decide for yourself, then turn it over.",
    sense: "Which of these is it, here??",
    word: "Which word fits this sentence??",
    cloze: "Write it into the gap.",
    zh2en: "From the meaning alone, write the word.",
    dict: "Listen, then write what you hear.",
    recall: "Think first, then reveal.",
  };
  const DRILL_HINT_EN = {
    en2cn: "Which of these does it mean?",
    flip: "Decide for yourself, then turn it over.",
    sense: "Which of these is it, here?",
    word: "Which word fits this sentence?",
    cloze: "Write it into the gap.",
    zh2en: "From the meaning alone, write the word.",
    dict: "Listen, then write what you hear.",
    recall: "Think first, then reveal.",
  };
  // in 全英 mode the card's own wording is English too
  const RV_T = () => (enOnly()
    ? { hint: DRILL_HINT_EN, prod: (a, b) => `used in ${a}/${b} sentences`, origin: (g) => `Your saved sentence meant: <b>${g}</b> — try it in another one`,
        mine: "my sentence", ctx: "the sentence you saved it from", check: "Check", reveal: "Show meaning",
        ok: "✓ correct", no: "✗ look again" }
    : { hint: DRILL_HINT_EN, prod: (a, b) => `used in ${a}/${b} sentences`, origin: (g) => `Your saved sentence meant: <b>${g}</b> — try it in another one`,
        mine: "My sentences", ctx: "the sentence you saved it from", check: "Check", reveal: "Show meaning",
        ok: "✓ correct", no: "✗ look again" });
  function drawCard() {
    const w = session.queue[0];
    if (!w) {
      const n = session.total;
      session = null; refreshBadge();
      renderReview();
      toast(`🎉 Round complete · ${n}`);
      return;
    }
    const pct = Math.round((session.done / session.total) * 100);
    const dr = currentDrill(w);          // built from the real record…
    const d = (asShown(w) || {}).data || {};   // …displayed through the language filter
    const back = session.showBack;
    const scopeBar = `<div class="subtabs" id="revscope">${REV_SCOPES.map(([k, cn]) =>
      `<button data-rs="${k}" class="${revScope === k ? "on" : ""}">${cn}</button>`).join("")}</div>`;

    const T = RV_T();
    const need = dr.target > 1
      ? `<span class="rv-prod${dr.produced >= dr.target ? " ok" : ""}">${T.prod(Math.min(dr.produced, dr.target), dr.target)}</span>` : "";
    // your saved sentence is often a poor example, but it does say which sense
    // you cared about — name that, then drill a different sentence
    const os = ["sense", "en2cn", "flip"].indexOf(dr.mode) < 0 && dr.originSense && dr.originSense.confident && dr.originSense.meaning;
    const head = `<div class="rv-mode"><span class="rv-mode-t">${esc(dr.label || "")}</span>${need}</div>` +
      (os && dr.source !== "context"
        ? `<div class="rv-origin">${T.origin(esc(enOnly() ? (os.definition || os.cn || "") : (os.cn || os.definition || "")))}</div>` : "");

    const hi = (t) => esc(t).replace(new RegExp("(" + (w.word || "").split(/\s*\/\s*/)[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+") + "\\w*)", "i"), "<mark>$1</mark>");
    const blank = (extra) => `<input id="czin" class="cz-in" ${extra || ""} autocomplete="off" autocapitalize="off" spellcheck="false">`;
    const optsHTML = (list) => `<div class="rv-opts">${(list || []).map((o, i) => `<button class="rv-opt" data-opt="${i}">${esc(o)}</button>`).join("")}</div>`;
    let front;
    if (dr.mode === "sense") {
      front = (dr.sentence ? `<div class="rv-sent">${hi(dr.sentence.text)}</div>${videoRefHTML(dr)}` : `<div class="hw serif">${esc(w.word)}</div>`) + optsHTML(dr.options);
    } else if (dr.mode === "word") {
      front = `<div class="rv-sent">${esc(dr.pre)}<span class="cz-gap">?</span>${esc(dr.post)}</div>
        ${dr.sentenceCn ? `<div class="muted" style="font-size:13px;margin-top:8px">${esc(dr.sentenceCn)}</div>` : ""}${videoRefHTML(dr)}` + optsHTML(dr.options);
    } else if (dr.mode === "en2cn") {
      // headword only — a sentence here would let you match a gloss to its
      // topic without knowing the word, the flaw that killed single-sense 选义
      front = `<div class="hw serif">${esc(w.word)}</div>
        ${d.phonetic ? `<div class="phon">${esc(d.phonetic)}</div>` : ""}
        <button class="speak" id="rspk" style="font-size:26px">🔊</button>` + optsHTML(dr.options);
    } else if (dr.mode === "flip") {
      // no context sentence either: it usually gives the meaning away, which
      // would make an already criterion-free self-rating weaker still
      front = `<div class="hw serif">${esc(w.word)}</div>
        ${d.phonetic ? `<div class="phon">${esc(d.phonetic)}</div>` : ""}
        <button class="speak" id="rspk" style="font-size:26px">🔊</button>`;
    } else if (dr.mode === "zh2en") {
      front = `<div class="rv-zh">${esc(dr.zh)}</div>
        <div class="rv-sent">${blank(`style="width:${Math.max(7, (dr.answer || "").length + 3)}ch" placeholder="${esc(dr.initial)}…"`)}</div>`;
    } else if (dr.mode === "dict") {
      front = `<button class="speak" id="rspk" style="font-size:30px">🔊</button>
        <div class="rv-sent">${blank(`style="width:${Math.max(7, (dr.answer || "").length + 3)}ch"`)}</div>`;
    } else if (dr.mode === "cloze" && dr.pre !== undefined) {
      // the box sits IN the gap, not underneath the sentence
      front = `<div class="rv-sent">${esc(dr.pre)}${blank(`style="width:${Math.max(6, (dr.answer || "").length + 2)}ch"`)}${esc(dr.post)}</div>
        ${dr.sentenceCn ? `<div class="muted" style="font-size:13px;margin-top:8px">${esc(dr.sentenceCn)}</div>` : ""}
        ${d.cn && !dr.sentenceCn ? `<div class="cn-gloss" style="font-size:14px">${esc(glossLine(d.cn, (d.meanings || [])[0] && d.meanings[0].pos))}</div>` : ""}
        ${videoRefHTML(dr)}
        ${dr.source === "mine" ? `<div class="rv-src">${T.mine}</div>` : dr.source === "context" ? `<div class="rv-src">${T.ctx}</div>` : ""}`;
    } else {
      front = `<div class="hw serif">${esc(w.word)}</div>
        ${d.phonetic ? `<div class="phon">${esc(d.phonetic)}</div>` : ""}`;
    }
    front += `<div class="muted" style="margin-top:16px;font-size:12px">${T.hint[dr.mode] || ""}</div>`;

    const full = dr.sentence ? dr.sentence.text : (dr.pre !== undefined ? dr.pre + dr.answer + dr.post : (dr.full || ""));
    const answer = `<hr class="hr">
      <div class="hw serif">${esc(w.word)}</div>
      ${d.phonetic ? `<div class="phon">${esc(d.phonetic)}</div>` : ""}
      <button class="speak" id="rspk" style="font-size:26px">🔊</button>
      ${d.cn ? `<div class="cn-gloss">${esc(glossLine(d.cn, (d.meanings || [])[0] && d.meanings[0].pos))}</div>` : ""}
      ${(d.meanings || []).slice(0, 2).map((m) => `<div class="mean" style="text-align:left">${m.pos ? `<span class="pos">${esc(m.pos)}</span> ` : ""}${esc(m.definition)}${m.cn ? `<div class="cn">${esc(m.cn)}</div>` : ""}</div>`).join("")}
      ${full ? `<div class="ex" style="text-align:left">${hi(full)}${(dr.sentenceCn || (dr.sentence && dr.sentence.cn)) ? `<div class="tr">${esc(dr.sentenceCn || dr.sentence.cn)}</div>` : ""}</div>${videoRefHTML(dr)}` : ""}`;

    const mcq = dr.mode === "sense" || dr.mode === "word" || dr.mode === "en2cn";
    view.innerHTML = scopeBar + `
      <div class="progress"><i style="width:${pct}%"></i></div>
      <div class="card rev-card">
        ${head}
        ${back ? answer : front}
        ${back && session.check ? feedbackHTML(session.check)
          : back && session.verdict ? `<div class="verdict ${session.verdict}">${session.verdict === "ok" ? T.ok : T.no}</div>` : ""}
      </div>
      ${back ? gradeBar(w, dr) : (mcq ? "" : `<button class="btn primary" id="flip" style="width:100%;padding:14px">${dr.mode === "recall" || dr.mode === "flip" ? T.reveal : T.check}</button>`)}`;
    wireScope();
    const spk = $("#rspk");
    if (spk) spk.addEventListener("click", () => speak(w.word, d.audioUs));
    if (dr.mode === "dict" && !back && spk) setTimeout(() => spk.click(), 300);
    if (!back) {
      const inp = $("#czin");
      const reveal = () => {
        // A blank box IS an answer — it says you couldn't produce the word.
        // Revealing with no verdict is how a miss used to become whatever grade
        // you felt like giving it afterwards.
        if (inp && dr.answer) {
          session.ms = now() - (session.askedAt || now());
          session.check = window.lexisCheckAnswer(inp.value, dr.answer, w.word, (w.data || {}).lookalikes);
          session.verdict = session.check.ok ? "ok" : "no";
        }
        session.showBack = true; drawCard();
      };
      const flip = $("#flip");
      if (flip) flip.addEventListener("click", reveal);
      // on a multiple-choice card the tap IS the answer
      view.querySelectorAll("[data-opt]").forEach((b) => b.addEventListener("click", () => {
        const chosen = (dr.options || [])[+b.dataset.opt];
        const right = String(chosen) === String(dr.answer);
        session.ms = now() - (session.askedAt || now());
        session.check = { ok: right, kind: right ? "exact" : "wrong", typed: String(chosen || ""), want: String(dr.answer || "") };
        session.verdict = right ? "ok" : "no";
        session.showBack = true; drawCard();
      }));
      if (inp) { inp.focus(); inp.addEventListener("keydown", (e) => { if (e.key === "Enter") reveal(); }); }
    } else {
      view.querySelectorAll("[data-grade]").forEach((b) => b.addEventListener("click", () => grade(w, b.dataset.grade)));
      const f = $("#revFine");
      if (f) f.addEventListener("click", () => { revFine = !revFine; drawCard(); });
    }
  }
  // Two big targets by default (thumb-friendly); the 4-level SRS bar is one tap away.
  function gradeBar(w, dr) {
    const en = enOnly();
    // A self-rated card keeps the three buttons that card has always had, but
    // they only move the schedule — production and Mastered are unreachable
    // from here by construction (the drill carries no sentence to mark).
    if (dr && dr.selfRate) return `<div class="rev-two rev-three">
      <button class="btn big-no" data-grade="again">Don't know<span class="d">back in 10 min</span></button>
      <button class="btn" data-grade="hard">Shaky<span class="d">${intervalLabel(schedule(w.srs, "hard").interval)}</span></button>
      <button class="btn big-yes" data-grade="good">Know it<span class="d">${intervalLabel(schedule(w.srs, "good").interval)}</span></button>
      <span class="muted" style="font-size:11px;width:100%;text-align:center">self-marked · doesn't count toward produced</span>
    </div>`;
    // The card knew whether you were right. Letting you then pick your own grade
    // was the hole in the loop — a wrong answer plus "Got it" pushed the interval
    // out exactly as if you'd known it. When there is an objective result it now
    // drives the schedule, and the buttons become a named override.
    const auto = session.check ? window.lexisGradeFor(session.check, session.ms, dr) : null;
    if (auto && !revFine) {
      const when = auto === "again" ? "back in 10 min" : intervalLabel(schedule(w.srs, auto).interval);
      // Factual, not a verdict on you — "Not yet" is where the word stands.
      const said = { again: "Not yet", hard: "Nearly", good: "Got it" }[auto];
      const over = auto === "again"
        ? (session.check.kind === "empty" ? "" : `<button class="linklike" data-grade="good">I did know it</button> · `)
        : `<button class="linklike" data-grade="again">I guessed</button> · `;
      return `<div class="rev-two rev-auto">
        <button class="btn ${auto === "again" ? "big-no" : "big-yes"}" data-grade="${auto}">Next<span class="d">${said} · ${when}</span></button>
        <div class="rv-over">${over}<button class="linklike" id="revFine">finer grades ▾</button></div>
      </div>`;
    }
    if (!revFine) return `<div class="rev-two">
      <button class="btn big-no" data-grade="again">Don't know<span class="d">back in 10 min</span></button>
      <button class="btn big-yes" data-grade="good">Got it<span class="d">${intervalLabel(schedule(w.srs, "good").interval)}</span></button>
      <button class="linklike" id="revFine">${en ? "finer grades ▾" : "finer grades ▾"}</button>
    </div>`;
    const g = (k, label) => { const days = schedule(w.srs, k).interval || 10 / 1440; return `<button class="btn" data-grade="${k}">${label}<span class="d">${intervalLabel(days)}</span></button>`; };
    return `<div class="rev-actions">
        <button class="btn" data-grade="again" style="color:#c05a5a">Again<span class="d">10 min</span></button>
        ${g("hard", "Hard")}${g("good", "Good")}
        <button class="btn sage" data-grade="easy">Easy<span class="d">${intervalLabel(schedule(w.srs, "easy").interval)}</span></button>
      </div>
      <div class="row" style="justify-content:center"><button class="linklike" id="revFine">Collapse ▴</button></div>`;
  }
  function grade(w, g) {
    const words = getWords();
    const rec = words.find((x) => x.id === w.id);
    if (rec) {
      rec.srs = schedule(rec.srs, g);
      // "会了" on a productive drill counts as producing the word in THAT
      // sentence; Mastered needs several different ones
      if (window.lexisMarkDrill && session.drill) {
        window.lexisMarkDrill(rec, session.drill, g !== "again" && session.verdict !== "no",
          session.check && session.check.kind);
      }
      rec.updatedAt = now(); setWords(words);
    }
    session.queue.shift();
    if (g === "again" && rec) {
      // Coming straight back is short-term memory, not review — the answer is
      // still on screen in your head. Put a real gap in when the queue allows it.
      const len = session.queue.length;
      session.queue.splice(Math.min(len, Math.max(3, Math.floor(len / 2))), 0, rec);
    } else bumpRevStats();
    session.done += 1;
    session.shown = (session.shown || 0) + 1;    // every card, hit or miss — paces the breathers
    session.showBack = false; session.verdict = null;
    session.check = null; session.ms = 0;
    session.drill = null; session.drillFor = null;
    drawCard();
  }

  // ---- DISCOVER (offline study lists from vocab.js) ----
  // Discover has two halves: your own material first, the word pools after.
  // Same split the extension got in v1.87.0 — a pool you can grind at any time
  // shouldn't stand in front of the episode you actually watched.
  let dSection = null;         // decided on first render: your own material if you have any
  let dTab = "words", dCursor = { words: 0, phrases: 0, pv: 0 };
  let vidOpen = null;          // episode id being viewed
  let vidTab = "vocab";        // vocab | script
  // Hear one line without leaving the page. A YouTube embed takes `start` and
  // `end` in the URL, so "play this sentence and stop" needs no API and no key.
  // Built only once you ask for a line — the same rule as the extension.
  let vidPlay = null;          // { id, from, to, n } — n forces a reload on replay
  function vidEmbedIdH5(url) {
    const m = String(url || "").match(/[?&]v=([A-Za-z0-9_-]{6,})/);
    return m ? m[1] : "";
  }
  function vidLineEndH5(full, t) {
    const ls = (full && full.lines) || [];
    for (let i = 0; i < ls.length; i++) if (ls[i].t > t + 0.4) return Math.ceil(ls[i].t);
    return Math.ceil(t) + 12;
  }
  function vidPlayerH5(id) {
    if (!vidPlay || vidPlay.id !== id) return "";
    const q = `start=${vidPlay.from}&end=${vidPlay.to}&autoplay=1&rel=0&modestbranding=1&_=${vidPlay.n}`;
    // pinned above the tab bar rather than pushing the list you are reading down
    return `<div class="vplayer"><iframe src="https://www.youtube.com/embed/${esc(id)}?${q}"
        allow="autoplay; encrypted-media"></iframe>
      <div class="vplayer-x"><span>${fmtSecH5(vidPlay.from)} – ${fmtSecH5(vidPlay.to)}</span>
        <button id="vidStop">✕</button></div></div>`;
  }
  // multi-select, and it starts on the two you are working with — same rule as
  // the extension (see its note)
  let vidStatus = new Set(["new", "learning"]);
  let vidBands = new Set();
  const vidStatusOn = (st) => vidStatus.has(st === "learning" || st === "mastered" ? st : "new");

  let vidSel = new Set();      // words ticked for the notebook
  const vidFull = {};          // id → the full record, fetched on demand, memory only
  const vidLoad = {};          // id → "loading" | "fail" — a spinner that never stops is a lie
  let dScene = { words: null, phrases: null, pv: null }; // active filter per tab
  const PAGE = 12;
  // usage-scene of a term, memoized. kind = "words"|"phrases"|"idioms" (Discover)
  // or "wordNb" for a notebook entry (guesses word vs phrase/idiom by spaces).
  const _sceneCacheH5 = new Map();
  function sceneOfH5(term, kind) {
    const ck = kind + " " + term;
    if (_sceneCacheH5.has(ck)) return _sceneCacheH5.get(ck);
    let out = null;
    try {
      // 短语 are classified by their SHAPE (语法结构/Phrasal verbs/介词短语/连接·语篇/Fixed expressions),
      // not by topic — "have to" and "such as" aren't about a subject, and the
      // shape is what tells you how to produce them.
      if (kind === "pv") { _sceneCacheH5.set(ck, null); return null; }   // ranked by frequency only
      if (kind === "phrases" && window.lexisPhraseType) {
        const pt = window.lexisPhraseType(term);
        out = pt ? { key: pt, cn: (window.LEXIS_PTYPE_CN || {})[pt] || pt } : null;
        _sceneCacheH5.set(ck, out); return out;
      }
      if (kind === "wordNb") {
        // same level-2 labels Discover uses for a chunk; usage scene for a word
        out = /\s/.test(String(term).trim())
          ? sceneOfH5(term, "phrases")
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
    items.forEach((t) => { const k = sceneOfH5(t, kind); const key = k ? k.key : "_other", cn = k ? k.cn : "other";
      if (!counts.has(key)) counts.set(key, { cn, n: 0 }); counts.get(key).n++; });
    if (counts.size <= 1 && counts.has("_other")) return "";
    const chip = (key, cn, n, on, muted) =>
      `<button class="catf${on ? " on" : ""}${muted ? " muted" : ""}" ${attr}="${esc(key)}">${esc(cn)} <b>${n}</b></button>`;
    const chips = [chip("__all__", "All", items.length, !active, false)];
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
      ? `<button class="catf more" ${attr}="__more__">${restN} more ▾</button>` +
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
  // ONE number for "my level", shared by this pool and by what a saved article
  // or episode shows. A manual setting wins — you know your own level better
  // than one passage does — then the reading assessment, then nothing. `src`
  // matters because the note has to say WHICH of those you are reading: a number
  // you typed and a number that was measured are not the same claim.
  function levelInfo() {
    const a = getAssess();
    const est = bestEstimate();
    const measured = est ? est.estVocab : a.estVocab || 0;
    // THE BOX IS THE LEVEL. The assessment is reference, not an override — it
    // measures what you RECOGNISE, and that is reliably far above what you can
    // USE, which is what this number is for. Same rule as the extension.
    const st = getSettings();
    const chosen = Number(st.vocabLevel) || 0;
    if (chosen > 0) return { v: chosen, src: st.vocabLevelSet ? "manual" : "default", measured };
    if (measured) return { v: measured, src: "assess", measured };
    return { v: 0, src: "none", measured: 0 };
  }
  // Same fallback the extension's marking engines use, so the two surfaces hide
  // and show exactly the same words in a synced snapshot.
  function effLevel() { return levelInfo().v || 6000; }

  function levelWindow(poolLen) {
    const info = levelInfo();
    const v = info.v;
    const tail = { src: info.src, measured: info.measured };
    // "Not calibrated" = you have neither typed a level nor been measured. The
    // shipped 6,000 is fine to MARK against but is not a claim about you, so the
    // study list must not start 3,500 words in for someone who never said
    // anything (CLAUDE.md §8) — that still holds now that the box outranks the
    // assessment everywhere else.
    const uncalibrated = !getSettings().vocabLevelSet && !info.measured;
    if (!v || uncalibrated) return { mode: "none", estVocab: 0, ...tail };
    const startIdx = Math.max(0, Math.round(v - 2500));
    if (poolLen - startIdx < 250) return { mode: "beyond", estVocab: v, startIdx: 0, left: Math.max(0, poolLen - startIdx), ...tail };
    return { mode: "above", estVocab: v, startIdx, left: poolLen - startIdx, ...tail };
  }

  // how far into a chunk pool the 摸底 says we can skip (0 when never assessed)
  function chunkFrontier(src, poolLen) {
    const c = getAssess().chunk;
    const b = c && c.bySrc && c.bySrc[src];
    if (!b) return 0;
    return Math.max(0, Math.min(b.frontier || 0, Math.max(0, poolLen - 20)));
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
    // Fixed expressions = every multiword chunk that is NOT a phrasal verb, idioms folded
    // in; Phrasal verbs = all of them, in one place. The two lists used to share 51
    // identical terms, which is why the tabs felt like the same thing.
    if (kind === "phrases") {
      const all = (window.LEXIS_EXPR_ALL || []).filter((t) => !known.has(norm(t)));
      return all.slice(chunkFrontier("phrase", all.length));
    }
    if (kind === "pv") {
      const pool = (window.LEXIS_PV_ALL || []).filter((t) => !known.has(norm(t)));
      return pool.slice(chunkFrontier("pv", pool.length));
    }
    return [];
  }
  // one honest line telling you WHY this batch is what it is
  // The tagging is automatic — you just save what you meet — so the rule has to
  // be inspectable, otherwise a label looks arbitrary. Folded away by default.
  function kindRuleHTML() {
    const rules = window.LEXIS_PTYPE_RULE || [];
    const cn = window.LEXIS_PTYPE_CN || {};
    if (!rules.length) return "";
    return `<details class="kind-rule"><summary>How are these grouped?</summary>
      <div class="kr-body">
        <p class="kr-lead">Tagged automatically on save; <b>rules run top to bottom and the first match wins</b>,so every entry lands in exactly one bucket, never two.</p>
        <div class="kr-l1"><b>Word</b> = no space ·  <b>Phrasal verbs</b> = rule 2 below ·  <b>Fixed expressions</b> = everything else</div>
        <ol class="kr-list">${rules.map(([k, why, eg]) =>
          `<li><b>${esc(cn[k] || k)}</b> ${esc(why)}<span class="kr-eg">${esc(eg)}</span></li>`).join("")}</ol>
      </div></details>`;
  }

  function discoverHint() {
    const what = window.LEXIS_TAB_WHAT || {};
    if (dTab === "pv") return what.pv || "";
    if (dTab === "phrases") return what.expr || "";
    const w = weakBandOrder();
    const lvl = levelWindow((window.LEXIS_FREQ || []).length);
    let s2 = "Recommended by frequency. Known feeds the assessment; Learn adds to your notebook.";
    // Saying nothing here reads as "this IS your level". It isn't — with no
    // calibration the list simply starts at the top of an 8k frequency pool,
    // i.e. the commonest words in English, which is why it looks too easy.
    if (lvl.mode === "none")
      s2 += `<br><b>No level set</b> — this list starts at the very top of the 8,000-word frequency pool, which is why it looks easy. Type one below, or take one <button class="linklike" id="dCal">reading assessment</button> (~2 min; a passage judges 60–100 words at once) and it measures one for you.`;
    else if (lvl.mode === "beyond")
      s2 += `<br>Your <b>${lvl.estVocab.toLocaleString()}</b> <b>already exceeds this 8k pool</b>, so it now leads with <b>rarest first</b>. Your real headroom is in <b>Phrasal verbs</b> and <b>Fixed expressions</b>.`;
    else if (lvl.mode === "above")
      s2 += `<br>Starting around <b>≈${lvl.estVocab.toLocaleString()}</b> — ${lvl.left.toLocaleString()} left. ${
        lvl.src === "manual"
          ? `That is the level you <b>set</b>${lvl.measured ? `, not the ${lvl.measured.toLocaleString()} your reading assessment measured` : ", not a measured one"}.`
          : "Measured by your reading assessment."} Lower it to pull commoner words back in.`;
    if (w) s2 += `<br>Weakest bands first: ${w.map((k) => FREQ_CN[k] || k).join(" › ")}.`;
    // The knob belongs where its effect is visible, not on the Me tab — the same
    // reason the extension carries one in Discover and on every library page.
    // It is the SAME setting: one number, both surfaces.
    return s2 + `<br><span class="lvl-set">My vocabulary size
        <input class="num" type="number" min="0" max="40000" step="500" inputmode="numeric" value="${Number(getSettings().vocabLevel) || 0}" id="dLvl"/>
        <span class="muted">0 = use my assessment. Also decides which words a saved article or episode shows.</span></span>`;
  }

  // ---- My library · Videos ------------------------------------------------
  // Episodes are RECORDED on the desktop (the phone has no YouTube sidebar) and
  // read here. What the phone can do is the part that matters on a phone:
  // decide which of the words go into the notebook, and re-read the transcript.
  const videoIdx = () => load(K.videos, {}) || {};
  // a phrase is saved the way you met it and listed in citation form, so both
  // sides are canonicalised — otherwise a phrase you own keeps reading as new
  function vidCanon(t) {
    const x = norm(t);
    if (!/\s/.test(x) || typeof window.lexisFindChunks !== "function") return x;
    try {
      const tk = window.lexisPhraseToks(x), m = (window.lexisFindChunks(tk) || [])[0];
      return m && m.len === tk.length ? m.term : x;
    } catch (e) { return x; }
  }
  function vidWordState(key) {
    const k = norm(key), kc = vidCanon(k);
    const w = getWords().find((x) => x.lookup === k || (/\s/.test(x.lookup || "") && vidCanon(x.lookup) === kc));
    if (!w) {
      const known = (getAssess().known || []).map(norm);
      return known.includes(k) || known.includes(kc) ? "mastered" : "new";
    }
    const m = masteryOfH5(w);
    return (w.mastered || (w.srs && w.srs.interval >= 180) || (m && m.key === "mastered")) ? "mastered" : "learning";
  }
  const VID_BANDS = [
    { k: "r1", label: "Top 10k" }, { k: "r2", label: "10–15k" }, { k: "r3", label: "15–20k" },
    { k: "r4", label: "20k+" }, { k: "r0", label: "unranked" },
    { k: "ck", label: "Phrases & patterns" },
  ];
  // one GROUP as well as one chip — a heading the legend cannot filter to is
  // the same split under another name
  const vidGrpKey = (w) => { const k = vidBandKey(w); return k === "vp" ? "ck" : k; };
  // a phrase is ranked among phrases, so it never gets filed under a word band —
  // and a verb pattern is on no frequency list at all
  // one bucket for everything that is more than one word — see the extension
  const vidBandIsH5 = (w, band) => {
    const k = vidBandKey(w);
    return band === "ck" ? (k === "ck" || k === "vp") : k === band;
  };
  const vidBandKey = (w) => (w && w.p) ? "vp" : (w && w.c) ? "ck"
    : (!w || !w.r) ? "r0" : w.r <= 10000 ? "r1" : w.r <= 15000 ? "r2" : w.r <= 20000 ? "r3" : "r4";

  // What this snapshot holds AT YOUR CURRENT LEVEL. The record keeps everything
  // down to a floor, so changing your level re-answers the question for material
  // saved months ago instead of freezing the answer at the level you happened to
  // hold the day it was recorded.
  function vidSnap(v) {
    return (typeof window.lexisSnapWords === "function")
      ? window.lexisSnapWords((v && v.words) || [], effLevel()) : ((v && v.words) || []);
  }

  let libFilter = "all";      // all | page | video — which kind of material
  function hostOfH5(u) { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return ""; } }
  function renderLibrary() {
    const idx = videoIdx();
    const ids = Object.keys(idx).sort((a, b) => (idx[b].u || 0) - (idx[a].u || 0));
    if (!ids.length) {
      return `<div class="empty">
          <div class="big">📚</div>
          <h3>Nothing saved yet</h3>
          <p class="muted">On your Mac: save an <b>article</b> from the LEXIS tab on the page edge,
             or an <b>episode</b> from the YouTube sidebar. Either turns up here — its vocabulary,
             and the full text with Chinese to re-read.</p>
          <button class="btn" data-dsec="vocab">Study word lists instead →</button>
        </div>`;
    }
    // an article is scrolled and an episode is played — the library says which
    // on every card, and lets you ask for one kind. A kind you own nothing of
    // is not offered: a filter that can only produce an empty list isn't one.
    const nPage = ids.filter((x) => (idx[x] || {}).kind === "page").length;
    const nVid = ids.length - nPage;
    if ((libFilter === "page" && !nPage) || (libFilter === "video" && !nVid)) libFilter = "all";
    const shown = libFilter === "all" ? ids
      : ids.filter((x) => (((idx[x] || {}).kind === "page")) === (libFilter === "page"));
    const lchip = (k, label, n) => n
      ? `<button class="catf${libFilter === k ? " on" : ""}" data-lf="${k}">${esc(label)} <b>${n}</b></button>` : "";
    const bar = (nPage && nVid)
      ? `<div class="chips" style="margin-bottom:8px">${lchip("all", "All", ids.length)}${lchip("page", "Articles", nPage)}${lchip("video", "Videos", nVid)}</div>`
      : "";
    return bar + shown.map((id) => {
      const v = idx[id];
      const ws = vidSnap(v);
      const fresh = ws.filter((w) => vidWordState(w.k || w.w) === "new");
      const by = {};
      fresh.forEach((w) => { const k = vidBandKey(w); by[k] = (by[k] || 0) + 1; });
      const bars = VID_BANDS.filter((b) => by[b.k]).map((b) =>
        `<span class="vbit"><i class="bsw ${b.k}"></i>${by[b.k]} ${esc(b.label)}</span>`).join("");
      const isPage = v.kind === "page";
      // the article's own picture sits OVER the paper card, so a refused
      // hotlink falls back to the paper design instead of a broken image box
      const thumb = isPage
        ? `<div class="vpaper"><span>${esc(v.site || hostOfH5(v.url) || "article")}</span>` +
          (v.img ? `<img class="vshot" src="${esc(v.img)}" alt="" loading="lazy" onerror="this.remove()"/>` : "") +
          `<i class="vkind">Article</i></div>`
        : `<div class="vpaper vthumb"><img src="https://i.ytimg.com/vi/${esc(id)}/mqdefault.jpg" alt="" loading="lazy"/><i class="vkind">Video</i></div>`;
      return `<div class="vcard${isPage ? " page" : ""}" data-vid="${esc(id)}">
          ${thumb}
          <div class="vc-b">
            <div class="vc-t">${esc(v.t || id)}</div>
            <div class="vc-n">${fresh.length ? `<b>${fresh.length}</b> to learn` : "all learned"}${v.partial ? " · not downloaded yet" : ""}</div>
            ${bars ? `<div class="vc-cap">by how common they are</div><div class="vc-bars">${bars}</div>` : ""}
          </div>
        </div>`;
    }).join("");
  }

  // The full record — transcript and the sentence each word was said in — is
  // fetched only when you open the episode, and kept in memory. Writing it to
  // localStorage is what would break the phone: iOS gives the origin ~5MB.
  async function loadVideoFull(id) {
    if (vidFull[id]) return vidFull[id];
    vidLoad[id] = "loading";
    const idx = videoIdx()[id];
    const s = getSettings();
    const t = (s.gistToken || "").trim(), gid = (s.gistId || "").trim();
    const hdr = t ? { Authorization: "Bearer " + t, Accept: "application/vnd.github+json" } : {};
    try {
      if (idx && idx.raw) {
        // NO Authorization on a raw gist URL. The raw host does not answer a CORS
      // preflight (OPTIONS → 403, no Access-Control-Allow-Headers), and sending
      // a header the browser considers non-simple is what forces one — so every
      // fetch of an episode file failed on the phone with "the episode's file
      // wasn't in the gist" while the file was sitting right there. The raw URL
      // carries the gist id and the blob sha, so it needs no token.
      const r = await fetch(idx.raw);
        if (r.ok) { vidFull[id] = JSON.parse(await r.text()); delete vidLoad[id]; return vidFull[id]; }
      }
      if (gid) {
        const r = await fetch("https://api.github.com/gists/" + gid, { headers: hdr });
        if (r.ok) {
          const g = await r.json();
          const f = g.files && g.files["v-" + String(id).replace(/[^A-Za-z0-9_-]/g, "") + ".json"];
          let txt = f && f.content;
          if (f && !txt && f.raw_url) { const rr = await fetch(f.raw_url); if (rr.ok) txt = await rr.text(); }   // no token — see above
          if (txt) { vidFull[id] = JSON.parse(txt); delete vidLoad[id]; return vidFull[id]; }
        }
      }
    } catch (e) {}
    vidLoad[id] = "fail";
    return null;
  }
  // what to say while the episode's own file is (or isn't) on its way
  function vidWaitNote(id, what) {
    if (vidLoad[id] === "loading") return `<p class="muted" style="font-size:12px"><span class="spin"></span> Fetching ${what}…</p>`;
    const s = getSettings();
    return `<p class="muted" style="font-size:12px">Couldn't fetch ${what} —${(s.gistToken || "").trim() && (s.gistId || "").trim()
      ? " the episode's file wasn't in the gist. Sync on the Mac once and try again."
      : " set up cloud sync in Me · ⚙️ first; the transcript lives in the gist, not on this phone."}</p>`;
  }

  // ONE swatch row for both tabs, and it is the filter: in Vocabulary it
  // narrows the list, in Transcript it decides which marks are drawn. Same
  // shape as the extension's episode page and the subtitle sidebar.
  const vidTitleH5 = (t, id) => (typeof window.lexisCleanTitle === "function"
    ? window.lexisCleanTitle(t || "", "YouTube") : (t || "")) || id || "";
  function vidLegendH5(rows) {
    // counts describe the tab you are on, and All is an explicit way back —
    // clearing a filter by tapping the active chip again is not discoverable
    const scope = rows.filter((x) =>
      vidStatusOn(x.st));
    const counts = {};
    scope.forEach((x) => { const k = vidBandKey(x); counts[k] = (counts[k] || 0) + 1; });
    const nL = rows.filter((x) => x.st === "learning").length;
    const nM = rows.filter((x) => x.st === "mastered").length;
    const sw = (key, label, n, on) =>
      n ? `<button class="vb ${key} clk${on ? " on" : ""}" data-vband="${key}"><i></i>${esc(label)} <b>${n}</b></button>`
        : `<span class="vb ${key} nil" title="none in this view"><i></i>${esc(label)} <b>0</b></span>`;
    const st = (key, label, n, tab) =>
      n ? `<button class="vb ${key} clk${vidStatus.has(tab) ? " on" : ""}" data-vf="${tab}"><i></i>${esc(label)} <b>${n}</b></button>`
        : `<span class="vb ${key} nil" title="none in this episode"><i></i>${esc(label)} <b>0</b></span>`;
    return `<div class="vlegend">
        <button class="vb all clk${vidBands.size ? "" : " on"}" data-vband="__all__" title="Every bucket — clears the band, not the filter above">All bands <b>${scope.length}</b></button>
        ${sw("r1", "Top 10k", counts.r1 || 0, vidBands.has("r1"))}
        ${sw("r2", "10–15k", counts.r2 || 0, vidBands.has("r2"))}
        ${sw("r3", "15–20k", counts.r3 || 0, vidBands.has("r3"))}
        ${sw("r4", "20k+", counts.r4 || 0, vidBands.has("r4"))}
        ${sw("r0", "unranked", counts.r0 || 0, vidBands.has("r0"))}
        ${sw("ck", "phrases", (counts.ck || 0) + (counts.vp || 0), vidBands.has("ck"))}
        ${/* the legend explains the MARKS, and only the transcript draws them —
              see the extension's note */
          vidTab === "script"
            ? `${st("nb", "learning", nL, "learning")}${st("mastered", "known", nM, "mastered")}`
            : ""}
        ${(() => {
          // The box has to show the number IN FORCE. settings.vocabLevel and
          // effLevel() are the same only once you have set a level by hand:
          // assess and never touch it, and the list filters at your measured
          // size while the control says 6,000 — every band under your real
          // level then reads 0 and looks broken.
          const info = levelInfo();
          const why = info.src === "manual" ? "You set this."
            : info.src === "default" ? "The default. This box wins over the assessment on purpose: the test measures what you RECOGNISE, this is what you can use."
            : info.src === "assess" ? `From your assessment (≈${info.measured.toLocaleString()}) because this box is empty. Type a number to take it back.`
            : "Nothing set or measured yet.";
          return `<span class="lvl-set sm" title="Words ranked inside this count as already yours and are left out. ${esc(why)}">lvl <input class="num" type="number" min="0" max="40000" step="500" inputmode="numeric" id="vLvl" value="${effLevel()}"/></span>`;
        })()}
      </div>`;
  }
  function vidMarkOn(x) {
    if (vidBands.size && ![...vidBands].some((b) => vidBandIsH5(x, b))) return false;
    if (!vidStatusOn(x.st)) return false;
    return true;
  }
  // Phrases and patterns are DERIVED at render, not read out of the snapshot —
  // the legend counted `words` rows while the transcript marked them by running
  // the matcher, so an old recording underlined `give rise to` in green and the
  // legend right above it said "phrase 0" and would not be clicked. Same engine,
  // one answer. See the extension's vidDerivedUnits() for the long version.
  // The sentence a derived row carries — the SENTENCE, not the whole line.
  // A transcript line often runs two sentences together ("…a vast emptiness.
  // Out of this endless"), and handing the whole line back is the same defect
  // the sidebar had: a context box holding one sentence you wanted and one you
  // didn't. Same rule as contextOf() in the sidebar — the sentence the match
  // sits in, and the next line only when that sentence is genuinely unfinished.
  const _VS_END = /[.!?。！？]["'\)\]]?\s*$/;
  function vidSentenceAt(lines, i, off) {
    var g = function (k) { return (lines[k] || {}).x || ""; };
    if (typeof window.lexisSentenceAt === "function") return window.lexisSentenceAt(g(i), off, g(i - 1), g(i + 1));
    return String(g(i)).replace(/\s+/g, " ").trim().slice(0, 300);
  }

  const _vidUnits = {};
  function vidDerivedUnits(v) {
    if (!v || !v.lines) return [];
    const key = (v.id || "") + ":" + v.lines.length + ":" + (v.updatedAt || 0);
    if (_vidUnits[key]) return _vidUnits[key];
    const out = [], seen = {};
    if (typeof window.lexisFindUnits === "function" && typeof window.lexisPassageTokens === "function") {
      const lines = v.lines;
      lines.forEach((l, i) => {
        const toks = window.lexisPassageTokens(l.x || "");
        const lw = [], off = [];
        let at = 0;
        toks.forEach((t) => { if (t.word) { lw.push(t.key || t.text.toLowerCase()); off.push(at); } at += t.text.length; });
        if (lw.length < 2) return;
        let u;
        try { u = window.lexisFindUnits(lw); } catch (e) { return; }
        (u.chunks || []).forEach((c) => {
          if (typeof window.lexisChunkWorthMarking === "function" && !window.lexisChunkWorthMarking(c.term)) return;
          if (seen[c.term]) return;
          seen[c.term] = 1;
          out.push({ w: c.term, k: c.term, r: c.rank || null, c: 1, p: 0, cn: "",
                     s: vidSentenceAt(lines, i, off[c.i] || 0), at: l.t || 0 });
        });
        (u.vpats || []).forEach((vp) => {
          const k = vp.term.toLowerCase();
          if (seen[k]) return;
          seen[k] = 1;
          out.push({ w: vp.term, k: k, r: null, c: 0, p: 1, cn: vp.cn || "",
                     s: vidSentenceAt(lines, i, off[vp.i] || 0), at: l.t || 0 });
        });
      });
    }
    _vidUnits[key] = out;
    return out;
  }
  function renderVideoDetail() {
    const id = vidOpen, light = videoIdx()[id] || {};
    const full = vidFull[id];
    // an article and an episode are the same record; only the words for it differ
    const isPage = (light.kind || (full && full.kind)) === "page";
    const rec = { words: (full && full.words) || light.words || [], lvl: (full && full.lvl) || light.lvl || 0 };
    const words = vidSnap(rec);
    const rows0 = words.map((w) => ({
      w: w.w, k: w.k || norm(w.w), r: w.r || null, c: w.c ? 1 : 0,
      // `p` = a verb pattern; it brings its own Chinese, because no dictionary
      // has an entry for "conceal sth from sb" to go and ask
      p: w.p ? 1 : 0, cn: w.cn || "",
      s: w.s || "", at: w.at || 0, st: vidWordState(w.k || w.w),
    }));
    // anything the transcript marks but the snapshot never recorded
    const have = {};
    rows0.forEach((x) => { have[x.k] = 1; });
    vidDerivedUnits(full).forEach((d) => {
      if (have[d.k]) return;
      have[d.k] = 1;
      rows0.push({ ...d, st: vidWordState(d.k) });
    });
    // one family, one row — the same fold as the extension, from vocab.js
    const rows = (typeof window.lexisFoldFamilies === "function")
      ? window.lexisFoldFamilies(rows0.map((x) => ({ ...x, term: x.w, rank: x.r, sentence: x.s, start: x.at })))
          .map((x) => ({ ...x, w: x.term, r: x.rank, s: x.sentence, at: x.start }))
      : rows0;
    const by = {
      new: rows.filter((x) => x.st === "new"), learning: rows.filter((x) => x.st === "learning"),
      mastered: rows.filter((x) => x.st === "mastered"), all: rows,
    };

    const head = `
      <div class="row" style="margin-bottom:10px">
        <button class="btn" id="vidBack">← Library</button>
        <a class="btn" href="${esc(light.url || full && full.url || "")}" target="_blank" rel="noopener">${isPage ? "Read ↗" : "Watch ↗"}</a>
      </div>
      <h2 class="serif" style="margin:0 0 2px;font-size:20px">${esc(vidTitleH5(light.t || (full && full.title), id))}</h2>
      <div class="muted" style="font-size:12px;margin-bottom:10px">${isPage && (light.site || hostOfH5(light.url)) ? esc(light.site || hostOfH5(light.url)) + " · " : ""}${rows.length} words · <b>${by.new.length}</b> not learned yet${full ? ` · ${(full.lines || []).length} ${isPage ? "paragraphs" : "lines"}` : ""}</div>
      ${(() => {
        // A snapshot can only show what it wrote down. Recorded while your level
        // was higher than it is now, the commoner words are missing from the
        // FILE, not from this page — no amount of turning the knob brings them
        // back, and only re-saving on the Mac does. Say so, rather than letting
        // a short list read as "this had nothing easy in it".
        const floor = (typeof window.lexisSnapFloor === "function") ? window.lexisSnapFloor(rec) : 0;
        const cur = effLevel();
        return floor && floor > cur + 200
          ? `<div class="vfloor">Recorded at a level of ≈<b>${Number(floor).toLocaleString()}</b> — words commoner than that were never written into this snapshot, so your level of ${cur.toLocaleString()} can't pull them back. Re-save it on the Mac to pick them up.</div>`
          : "";
      })()}
      ${vidPlayerH5(vidEmbedIdH5(light.url || (full && full.url)))}
      <div class="subtabs" id="vtabs">
        <button data-vt="vocab" class="${vidTab === "vocab" ? "on" : ""}">Vocabulary</button>
        <button data-vt="script" class="${vidTab === "script" ? "on" : ""}">${isPage ? "Text" : "Transcript"}</button>
      </div>`;

    if (vidTab === "script") {
      if (!full) return head + `<div class="empty">${vidWaitNote(id, "the transcript")}</div>`;
      const byKey = {}; rows.forEach((x) => { byKey[x.k] = x; });
      const lines = (full.lines || []).map((l, i) => {
        const toks = (typeof window.lexisPassageTokens === "function")
          ? window.lexisPassageTokens(l.x) : [{ text: l.x, word: false }];
        const at = [], lw = [];
        toks.forEach((t, j) => { if (t.word) { at.push(j); lw.push(t.key || t.text.toLowerCase()); } });
        const opens = {}, closes = {};
        if (typeof window.lexisFindUnits === "function" && lw.length > 1) {
          // same exclusion as every other surface — grammar frames are not vocabulary
          try {
            const u = window.lexisFindUnits(lw) || { chunks: [], vpats: [] };
            (u.chunks || [])
              .filter((c) => typeof window.lexisChunkWorthMarking !== "function" || window.lexisChunkWorthMarking(c.term))
              .forEach((c) => { opens[at[c.i]] = c; closes[at[c.i + c.len - 1]] = true; });
            // a pattern marks its two ANCHORS only — the words in between belong
            // to the sentence, not to the pattern
            (u.vpats || []).forEach((vp) => {
              const jv = at[vp.i], p0 = at[vp.j], p1 = at[vp.j + vp.plen - 1];
              if (opens[jv] === undefined && closes[jv] === undefined) { opens[jv] = { vp, len: 1 }; closes[jv] = true; }
              if (opens[p0] === undefined && closes[p1] === undefined) { opens[p0] = { vp, len: p1 - p0 + 1 }; closes[p1] = true; }
            });
          } catch (e) {}
        }
        // Tapping a word looks it up — reading a transcript IS looking words
        // up. A word inside a marked phrase carries no tap target of its own so
        // the tap lands on the PHRASE: "call" does not answer "call out".
        let inChunk = 0;
        const en = toks.map((t, j) => {
          const c = opens[j];
          const cTerm = c ? (c.vp ? c.vp.term : c.term) : "";
          const cs = c ? vidWordState(cTerm) : "";
          const ckOn = c ? vidMarkOn(c.vp ? { p: 1, st: cs } : { c: 1, r: c.rank || null, st: cs }) : false;
          const pre = c
            ? `<c class="${c.vp ? "vp" : "ck"}${ckOn ? "" : " off"}${cs === "learning" ? " nb" : cs === "mastered" ? " mastered" : ""}" data-vlook="${esc(cTerm)}" title="${esc(cTerm)}${c.vp ? " · " + esc(c.vp.cn) : ""}">`
            : "";
          if (c) inChunk = c.len;
          const post = closes[j] ? "</c>" : "";
          // clear the flag AFTER this token is built — clearing it on the
          // closing token gave the phrase's LAST word a tap target of its own,
          // and being the inner element it swallowed the phrase's tap
          const endsChunk = !!closes[j];
          if (!t.word) { if (endsChunk) inChunk = 0; return pre + esc(t.text) + post; }
          const term = (t.text.match(/[A-Za-z][A-Za-z'-]*/) || [t.text])[0];
          const hit = byKey[(t.key || t.text.toLowerCase())];
          const cls = (hit && vidMarkOn(hit)) ? (hit.st === "learning" ? "nb" : hit.st === "mastered" ? "mastered" : vidBandKey(hit)) : "";
          const link = inChunk ? "" : ` data-vlook="${esc(term)}"`;
          const html = pre + `<w class="${cls}"${link} title="${esc(hit ? hit.w : term)}">${esc(t.text)}</w>` + post;
          if (endsChunk) inChunk = 0;
          return html;
        }).join("");
        // a paragraph has no second to jump to — the gutter carries its number
        // rather than a link that would go nowhere
        return `<div class="vline">
            ${isPage
              ? `<span class="vl-n">${i + 1}</span>`
              : vidEmbedIdH5(full.url)
                ? `<button class="vl-t" data-vplay="${Math.max(0, Math.floor(l.t || 0))}">${fmtSecH5(l.t)}</button>`
                : `<a href="${esc(full.url)}&t=${Math.max(0, Math.floor(l.t || 0))}s" target="_blank" rel="noopener">${fmtSecH5(l.t)}</a>`}
            <div><div>${en}</div>${l.z ? `<div class="vl-zh">${esc(l.z)}</div>` : ""}</div>
          </div>`;
      }).join("");
      return head + vidLegendH5(rows) + `<div class="vscript">${lines || "<p class='muted'>No transcript was recorded.</p>"}</div>`;
    }

    // The Chinese for a row's sentence is already on file — the transcript pass
    // paid for it and it rides the sync in `lines[].z`. It was simply never
    // shown here, so the extension's list had a bilingual column and this one
    // didn't. Matching is by CONTAINMENT, not by exact text: an episode row
    // holds one sentence cut out of its caption line, an article row one cut
    // out of its paragraph, so the line's own text is never equal to it.
    const zhSeen = {}, sentSeen = {};
    // re-cut a sentence a pre-fix snapshot stored as a fragment — see lexisSnapSentence
    const sentOfRow = (x) => {
      // the WORD is part of the answer — see the extension's note
      const k = x.s + "\u0000" + x.at + "\u0000" + (x.w || "");
      if (sentSeen[k] !== undefined) return sentSeen[k];
      const out = (typeof window.lexisSnapSentence === "function")
        ? window.lexisSnapSentence((full && full.lines) || [], x.s, x.at, x.w) : x.s;
      sentSeen[k] = out;
      return out;
    };
    const zhOf = (sent, at) => {
      const k = sent + "\u0000" + at;
      if (zhSeen[k] !== undefined) return zhSeen[k];
      const hit = (typeof window.lexisSnapZh === "function")
        ? window.lexisSnapZh((full && full.lines) || [], sent, at) : "";
      zhSeen[k] = hit;
      return hit;
    };
    const chip = (k, label, n) => `<button class="catf${k === "__all__" ? (vidStatus.size === 3 ? " on" : "") : (vidStatus.has(k) ? " on" : "")}" data-vf="${k}">${esc(label)} <b>${n}</b></button>`;
    let list = rows.filter((x) => vidStatusOn(x.st)).slice().sort((a, b) =>
      (a.p ? 2 : a.c ? 1 : 0) - (b.p ? 2 : b.c ? 1 : 0) || (a.r || 999999) - (b.r || 999999));
    if (vidBands.size) list = list.filter((x) => [...vidBands].some((b) => vidBandIsH5(x, b)));
    let out = "", lastBand = "";
    list.forEach((x) => {
      const b = vidGrpKey(x);
      if (b !== lastBand) {
        lastBand = b;
        const meta = VID_BANDS.find((z) => z.k === b);
        out += `<div class="vgrp"><i class="bsw ${b}"></i>${esc(meta ? meta.label : b)}
                  <b>${list.filter((y) => vidGrpKey(y) === b).length}</b></div>`;
      }
      const tag = x.st === "learning" ? `<span class="chip">learning</span>`
                : x.st === "mastered" ? `<span class="chip">known</span>` : "";
      out += `<label class="vrow${x.st === "mastered" ? " done" : ""}">
          <input type="checkbox" data-vpick="${esc(x.k)}" ${vidSel.has(x.k) ? "checked" : ""}/>
          <div>
            <div><span class="serif" style="font-size:16px">${esc(x.w)}</span>${x.p ? "" : `<button class="study-say" data-say="${esc(x.w)}" title="Pronounce">🔊</button>`}${(x.forms || []).length ? `<span class="vr">also ${esc(x.forms.join(" / "))}</span>` : ""}
              <span class="vr">${x.p ? "verb pattern" : x.c ? (x.r ? "phrase #" + x.r.toLocaleString("en-US") : "taught chunk") : (x.r ? "#" + x.r.toLocaleString("en-US") : "—")}</span>${tag}</div>
            ${x.p && x.cn ? `<div class="vcn">${esc(x.cn)}</div>` : ""}
            ${x.s ? (() => {
              const sx = sentOfRow(x), z = zhOf(sx, x.at);
              const id2 = vidEmbedIdH5(light.url || (full && full.url));
              const rg2 = (typeof window.lexisSnapRange === "function")
                ? window.lexisSnapRange((full && full.lines) || [], sx, x.at) : { from: Math.max(0, Math.floor(x.at || 0)) };
              return `<div class="vs">${
                id2 ? `<button class="vl-t vs-at" data-vplay="${rg2.from}" data-vsent="${esc(sx)}" title="Hear the original">▸ ${fmtSecH5(rg2.from)}</button> ` : ""}${esc(sx)}${z ? `<div class="vsz">${esc(z)}</div>` : ""}</div>`;
            })() : ""}
          </div>
        </label>`;
    });
    return head + `
      ${vidLegendH5(rows)}
      <div class="catbar">${chip("new", "Not learned", by.new.length)}${chip("learning", "Learning", by.learning.length)}${chip("mastered", "Known", by.mastered.length)}${chip("__all__", "All", by.all.length)}</div>
      ${full ? "" : vidWaitNote(id, "the sentences")}
      <div>${out || "<p class='muted'>Nothing in this group.</p>"}</div>
      ${(() => {
        // Marking known used to be one-way: the row's checkbox went disabled and,
        // once nothing was left "new", the whole bar stopped rendering — so a
        // list you had marked through had no control left to take it back with.
        // Counts are split because ticking a mastered row means something
        // different from ticking a new one.
        // three different selections, three counts: "Add" only applies to a word
        // that is not an entry yet, "Mark known" to anything not already
        // mastered, "Don't know after all" is the way back from mastered
        const selAdd = rows.filter((x) => x.st === "new" && vidSel.has(x.k)).length;
        const selNew = rows.filter((x) => x.st !== "mastered" && vidSel.has(x.k)).length;
        const selMas = rows.filter((x) => x.st === "mastered" && vidSel.has(x.k)).length;
        if (!rows.length) return "";
        return `<div class="vact">
          ${by.new.length ? `<button class="btn" id="vidAll">Select all</button>` : ""}
          <button class="btn" id="vidNone">Clear</button>
          <button class="btn" id="vidUnknown" style="${selMas ? "" : "display:none"}" title="Put these back in the recommendations and take them out of your vocabulary size">Don't know ${selMas} after all</button>
          <button class="btn" id="vidKnown" ${selNew ? "" : "disabled"} title="I already know these — stop recommending them and let them count towards your vocabulary size">Mark ${selNew} known</button>
          <button class="btn sage" id="vidAdd" ${selAdd ? "" : "disabled"}>＋ Add ${selAdd}</button>
        </div>`;
      })()}`;
  }
  function fmtSecH5(t) {
    t = Math.max(0, Math.floor(t || 0));
    return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0");
  }

  function renderDiscover() {
    // Land on your own material when there is any, and on the word pools when
    // there isn't — an empty library every time would be a door into a wall.
    if (dSection === null) dSection = Object.keys(videoIdx()).length ? "library" : "vocab";
    if (dSection === "library") return renderDiscoverLibrary();
    view.innerHTML = `
      <div class="subtabs" id="dsec">
        <button data-dsec="library" class="">My library</button>
        <button data-dsec="vocab" class="on">Vocabulary</button>
      </div>
      <div class="subtabs" id="dtabs">
        <button data-d="words" class="${dTab === "words" ? "on" : ""}">Words</button>
        <button data-d="pv" class="${dTab === "pv" ? "on" : ""}">Phrasal verbs</button>
        <button data-d="phrases" class="${dTab === "phrases" ? "on" : ""}">Fixed expressions</button>
      </div>
      <p class="muted" style="font-size:13px;margin-top:0">${discoverHint()}</p>
      ${kindRuleHTML()}
      <div id="dcats"></div>
      <div id="dlist"></div>
      <div class="row" style="margin-top:14px"><button class="btn" id="dmore" style="flex:1">Shuffle ↻</button></div>`;
    view.querySelectorAll("#dtabs button").forEach((b) => b.addEventListener("click", () => { dTab = b.dataset.d; renderDiscover(); }));
    bindSectionSwitch();
    if ($("#dCal")) $("#dCal").addEventListener("click", () => renderReadingPick());
    // `change`, not `input`: on a phone every keystroke would repaint the list
    // under your thumb while you are still typing the number
    if ($("#dLvl")) $("#dLvl").addEventListener("change", (e) => {
      const s = getSettings();
      // settings deliberately never ride the gist (it would carry the token), so
      // this is a per-device number — the phone can hold a different level from
      // the Mac, and that is a choice, not a sync bug
      s.vocabLevel = Math.max(0, parseInt(e.target.value, 10) || 0);
      s.vocabLevelSet = true;
      setSettings(s);
      renderDiscover();
    });
    $("#dmore").addEventListener("click", () => { dCursor[dTab] += PAGE; drawStudy(); });
    drawStudy();
  }
  function bindSectionSwitch() {
    view.querySelectorAll("[data-dsec]").forEach((b) => b.addEventListener("click", () => {
      dSection = b.dataset.dsec; vidOpen = null; renderDiscover();
    }));
  }
  function renderDiscoverLibrary() {
    const sec = `
      <div class="subtabs" id="dsec">
        <button data-dsec="library" class="on">My library</button>
        <button data-dsec="vocab" class="">Vocabulary</button>
      </div>`;
    if (!vidOpen) {
      view.innerHTML = sec + renderLibrary();
      bindSectionSwitch();
      // the Articles / Videos chips — bound BEFORE the card handler, since a
      // chip is not a card and would otherwise just do nothing
      view.querySelectorAll("[data-lf]").forEach((c) => c.addEventListener("click", () => {
        libFilter = c.dataset.lf; renderDiscover();
      }));
      view.querySelectorAll("[data-vid]").forEach((c) => c.addEventListener("click", () => {
        vidOpen = c.dataset.vid; vidTab = "vocab"; vidStatus = new Set(["new", "learning"]); vidBands.clear(); vidSel.clear();
        renderDiscover();
        // the sentences and the transcript live in the episode's own gist file
        loadVideoFull(vidOpen).then(() => { if (vidOpen) renderDiscover(); });
      }));
      return;
    }
    view.innerHTML = sec + renderVideoDetail();
    bindSectionSwitch();
    const back = $("#vidBack");
    if (back) back.addEventListener("click", () => { vidOpen = null; vidSel.clear(); renderDiscover(); });
    view.querySelectorAll("[data-vt]").forEach((b) => b.addEventListener("click", () => { vidTab = b.dataset.vt; renderDiscover(); }));
    view.querySelectorAll("[data-vlook]").forEach((el) => el.addEventListener("click", (ev) => {
      ev.preventDefault(); ev.stopPropagation();
      go("notebook"); openLookupPane(); doLookup(el.dataset.vlook, "");
    }));
    view.querySelectorAll("[data-vf]").forEach((b) => b.addEventListener("click", () => {
      const k = b.dataset.vf;
      if (k === "__all__" || k === "all") vidStatus = new Set(["new", "learning", "mastered"]);
      else {
        if (vidStatus.has(k)) vidStatus.delete(k); else vidStatus.add(k);
        // turning the last one off means "all of them", not an empty list
        if (!vidStatus.size) vidStatus = new Set(["new", "learning", "mastered"]);
      }
      renderDiscover();
    }));
    // the word on its own — the ▸ next to it plays the sentence as it was said,
    // which is a different question. The row is a <label>, so a click here must
    // not tick its checkbox.
    view.querySelectorAll("[data-say]").forEach((b) => b.addEventListener("click", (ev) => {
      ev.preventDefault(); ev.stopPropagation();
      speak(b.dataset.say, "");
    }));
    view.querySelectorAll("[data-vplay]").forEach((b) => b.addEventListener("click", (ev) => {
      ev.preventDefault(); ev.stopPropagation();          // the row is a <label> — don't tick it
      const f = vidFull[vidOpen], id = vidEmbedIdH5((videoIdx()[vidOpen] || {}).url || (f && f.url));
      if (!id) return;
      const at = Math.max(0, parseInt(b.dataset.vplay, 10) || 0);
      const sent = b.dataset.vsent || "";
      // the time comes from the same locator that produced the sentence
      const rg = (sent && typeof window.lexisSnapRange === "function")
        ? window.lexisSnapRange((f && f.lines) || [], sent, at)
        : { from: at, to: vidLineEndH5(f, at) };
      vidPlay = { id, from: rg.from, to: rg.to, n: (vidPlay ? vidPlay.n : 0) + 1 };
      renderDiscover();
    }));
    const stopB = view.querySelector("#vidStop");
    if (stopB) stopB.addEventListener("click", () => { vidPlay = null; renderDiscover(); });
    view.querySelectorAll("[data-vband]").forEach((b) => b.addEventListener("click", () => {
      const k = b.dataset.vband;
      // "All bands" clears the selection, which IS every band; anything else toggles
      if (k === "__all__") vidBands.clear();
      else if (vidBands.has(k)) vidBands.delete(k);
      else vidBands.add(k);
      renderDiscover();
    }));
    const vl = $("#vLvl");
    if (vl) vl.addEventListener("change", (e) => {
      const s = getSettings();
      s.vocabLevel = Math.max(0, parseInt(e.target.value, 10) || 0);
      s.vocabLevelSet = true;
      setSettings(s); renderDiscover();
    });
    view.querySelectorAll("[data-vpick]").forEach((c) => c.addEventListener("change", () => {
      if (c.checked) vidSel.add(c.dataset.vpick); else vidSel.delete(c.dataset.vpick);
      // every button reads these counts — refresh them all, or the one left
      // behind keeps its render-time label and its render-time disabled. Split,
      // because a selection of mastered rows must not arm "Add".
      const sel = [...vidSel];
      const nAdd = sel.filter((k) => vidWordState(k) === "new").length;
      const nNew = sel.filter((k) => vidWordState(k) !== "mastered").length;
      const nMas = sel.filter((k) => vidWordState(k) === "mastered").length;
      const go = $("#vidAdd"), kn = $("#vidKnown"), un = $("#vidUnknown");
      if (go) { go.textContent = `＋ Add ${nAdd}`; go.disabled = nAdd === 0; }
      if (kn) { kn.textContent = `Mark ${nNew} known`; kn.disabled = nNew === 0; }
      if (un) { un.textContent = `Don't know ${nMas} after all`; un.style.display = nMas ? "" : "none"; }
    }));
    const all = $("#vidAll"), none = $("#vidNone"), add = $("#vidAdd"), known = $("#vidKnown");
    if (all) all.addEventListener("click", () => {
      // only what is actually in front of you: a word hidden by your level must
      // not be swept into the notebook by a button labelled "select all"
      const rec = vidFull[vidOpen] || videoIdx()[vidOpen] || {};
      vidSnap(rec).forEach((w) => { const k = w.k || norm(w.w); if (vidWordState(k) === "new") vidSel.add(k); });
      renderDiscover();
    });
    if (none) none.addEventListener("click", () => { vidSel.clear(); renderDiscover(); });
    if (add) add.addEventListener("click", () => addPickedFromVideo(add));
    // "I already know this" is a calibration signal, not a notebook entry: it
    // stops the word being recommended and counts towards your vocabulary size
    if (known) known.addEventListener("click", () => {
      // only the not-learned ones: a mastered row is tickable now, and that tick
      // means the opposite of this button
      const sel = [...vidSel].filter((k) => vidWordState(k) !== "mastered");
      if (!sel.length) return;
      // Same meaning, two stores: a word you are LEARNING already has an entry
      // with SRS history, so it is marked mastered there rather than shadowed by
      // a calibration tick that would leave it in the review queue underneath.
      const a = getAssess(), have = new Set((a.known || []).map(norm));
      const ws = getWords();
      let touched = false;
      sel.forEach((k) => {
        const w = ws.find((x) => norm(x.word) === norm(k));
        if (w) { w.mastered = true; w.updatedAt = Date.now(); touched = true; }
        else if (!have.has(norm(k))) a.known.push(String(k));
      });
      setAssess(a);
      if (touched) setWords(ws);
      vidSel.clear();
      renderDiscover();
      toast(`Marked ${sel.length} known`);
    });
    const unknown = $("#vidUnknown");
    if (unknown) unknown.addEventListener("click", async () => {
      const sel = [...vidSel].filter((k) => vidWordState(k) === "mastered");
      if (!sel.length) return;
      // Two things can make a word read "mastered", so both have to be undone
      // or the chip comes straight back: the calibration set, and a notebook
      // entry that is flagged mastered or has drifted past the 180-day interval.
      const a = getAssess();
      const drop = new Set(sel.map(norm));
      a.known = (a.known || []).filter((w) => !drop.has(norm(w)));
      setAssess(a);
      const ws = getWords();
      let touched = false;
      ws.forEach((w) => {
        if (!drop.has(norm(w.word))) return;
        w.mastered = false;
        // back in play, history intact — "don't know after all" is not "reset
        // progress", and zeroing reps would un-learn the drill ladder (§8)
        const prev = w.srs || {};
        w.srs = { due: Date.now(), interval: 0, ease: prev.ease || 2.5,
                  reps: prev.reps || 0, lapses: prev.lapses || 0, last: prev.last || 0 };
        w.updatedAt = Date.now();
        touched = true;
      });
      if (touched) setWords(ws);
      const n = sel.length;
      vidSel.clear();
      renderDiscover();
      toast(`${n} back in the recommendations`);
    });
  }
  // Save the ticked words. Each one is a real look-up, so they go three at a
  // time with the count ticking down rather than fifty requests at once — the
  // phone is usually on the worse connection of the two.
  async function addPickedFromVideo(btn) {
    const rec = vidFull[vidOpen] || videoIdx()[vidOpen] || {};
    const light = videoIdx()[vidOpen] || {};
    const items = (rec.words || []).filter((w) => vidSel.has(w.k || norm(w.w)));
    if (!items.length) return;
    btn.disabled = true;
    let done = 0, saved = 0;
    const base = (rec.url || light.url || "").split("&")[0];
    const one = async (w) => {
      const term = norm(w.w);
      try {
        if (!findWord(term)) {
          // A verb pattern has no dictionary entry anywhere — looking it up can
          // only end in "not found" printed over something correct.
          const p = w.p
            ? { term: w.w, lookup: term, cn: w.cn || "", vpat: true, done: true,
                meanings: [{ pos: "verb pattern", definition: w.w, cn: w.cn || "" }], examples: [] }
            : await lookupFull(term);
          p.context = w.s || "";
          p.source = light.t || rec.title || "YouTube";
          if (saveWord(p)) saved++;
          // the episode and the second it was said at, so review can send you back
          const rec2 = getWords().find((x) => x.lookup === term);
          if (rec2) {
            rec2.url = base + (w.at != null ? "&t=" + Math.max(0, Math.floor(w.at)) + "s" : "");
            rec2.title = light.t || rec.title || "";
            setWords(getWords());
          }
        }
      } catch (e) {}
      done++;
      btn.textContent = `Saving ${done}/${items.length}…`;
    };
    const queue = items.slice();
    await Promise.all([0, 1, 2].map(async () => { while (queue.length) await one(queue.shift()); }));
    vidSel.clear();
    toast(`Added <b>${saved}</b> to your notebook`);
    refreshBadge();
    renderDiscover();
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
    if (!items.length) { box.innerHTML = `<div class="empty">Nothing more to recommend.</div>`; return; }
    box.innerHTML = items.map((term) => {
      // same classifier the category chips use, so a card's tag always matches the
      // bar above it (phrases → structural type, not topic)
      const sc = sceneOfH5(term, dTab);
      const scene = sc ? sc.cn : "";
      // an example sentence is the single most useful thing on a chunk card —
      // you learn a phrase from seeing it used, not from the phrase alone
      // Phrasal verbs get their sense breakdown (which meaning is worth learning, and
      // what share of real uses it covers) instead of a single example
      const pv = dTab === "pv" && window.LEXIS_PHAVE_MAP && window.LEXIS_PHAVE_MAP.get(norm(term));
      const ex = pv ? "" : (window.LEXIS_PHRASE_EXAMPLE && window.LEXIS_PHRASE_EXAMPLE.get(norm(term))) || "";
      const hiEx = ex ? esc(ex).replace(new RegExp("(" + term.split(/\s*\/\s*/)[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+") + "\\w*)", "i"), "<mark>$1</mark>") : "";
      return `<div class="study${ex ? " has-ex" : ""}" data-term="${esc(term)}">
        <span class="term serif">${esc(term)}</span><button class="study-say" data-act="say" title="Pronounce">🔊</button>
        ${(() => { const r = rankInfoOf(term, null); return r ? `<span class="mrank" title="${esc(r.title)}">${esc(r.text)}</span>` : ""; })()}
        ${scene ? `<span class="g">${esc(scene)}</span>` : ""}
        <span class="act">
          <button class="btn" data-act="learn">Learn</button>
          <button class="btn sage" data-act="master">Mark known</button>
        </span>
        ${hiEx ? `<div class="study-ex">${hiEx}</div>` : ""}
        ${pv ? pv.senses.map((sn) => `<div class="pv-sense"><span class="pv-pct">${sn.p}%</span><b>${esc(sn.d)}</b><div class="study-ex">${esc(sn.e)}</div></div>`).join("") : ""}</div>`;
    }).join("");
    box.querySelectorAll(".study").forEach((row) => {
      const term = row.dataset.term;
      row.querySelector('[data-act="learn"]').addEventListener("click", async () => {
        toast("Looking up……"); const p = await lookupFull(term);
        saveWord(p); toast("Added to your notebook <b>" + esc(term) + "</b>"); row.remove(); refreshBadge();
      });
      // hearing the word is part of learning it — the study pool is offline, so
      // this is the browser's own voice (same as the review card's ▸)
      const say = row.querySelector('[data-act="say"]');
      if (say) say.addEventListener("click", (ev) => { ev.stopPropagation(); speak(term, ""); });
      row.querySelector('[data-act="master"]').addEventListener("click", () => {
        const a = getAssess(); if (!a.known.map(norm).includes(norm(term))) a.known.push(term);
        setAssess(a); toast("Marked known"); row.remove();
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
    const qEst = quickEstimate();
    const bEst = bestEstimate();
    const incomplete = incompleteWords().length;
    const ck = chunkState();
    view.innerHTML = `
      <div class="card">
        <h2 class="sec">Overview</h2>
        <div class="row" style="justify-content:space-between">
          <div><div class="stat">${words.length}</div><div class="muted">words</div></div>
          <div><div class="stat">${dueWords().length}</div><div class="muted">due</div></div>
          <div><div class="stat">${mastered}</div><div class="muted">known</div></div>
        </div>
      </div>
      <div class="card">
        <h2 class="sec">Vocabulary estimate</h2>
        <div class="stat">${(bEst ? bEst.estVocab : knownN).toLocaleString()}</div>
        <div class="muted">${rEst
          ? `Reading assessment ·  ${(a.reading.passages || []).length}  read · confidence  ${({ high: "high", mid: "medium", low: "low" })[rEst.confidence]}(goal: 15,000 word families)`
          : bEst
          ? `Quick check · ${bEst.rounds} round${bEst.rounds === 1 ? "" : "s"} · ${bEst.faYes} of ${bEst.faSeen} invented words claimed (goal: 15,000 word families)`
          : "marked known + notebook (goal: 15,000 word families) · not assessed yet"}</div>
        <div class="meter"><i style="width:${Math.min(100, ((bEst ? bEst.estVocab : knownN) / 15000) * 100)}%"></i></div>
        <div class="row" style="margin-top:8px">
          <button class="btn ${rEst || qEst ? "" : "primary"}" id="quickBtn">⚡ Quick check${qEst ? "(another round)" : "(2 min)"}</button>
          <button class="btn ${rEst ? "" : "primary"}" id="readAssessBtn">📖 Reading assessment${rEst ? "(continue)" : ""}</button>
          <button class="btn" id="assessBtn">Tick word by word</button>
        </div>
        ${qEst ? `<div class="muted" style="font-size:12px;margin-top:8px">Quick check: ${qEst.reliable ? `≈<b>${qEst.estVocab.toLocaleString()}</b>` : "<b>not reported</b> — too many invented words claimed"} · <button class="linklike" id="quickRes">See result</button></div>`
          : `<div class="muted" style="font-size:12px;margin-top:8px">The quick check tags roughly one word in five as an invented one, and takes whatever share of those you claim back off your score — that correction is what makes a self-marked test worth anything.</div>`}
      </div>
      <div class="card">
        <h2 class="sec">Chunk production</h2>
        ${ck ? `<div class="row" style="gap:14px">${["phrase", "pv", "idiom"].map((k) => {
              const b = ck.bySrc[k]; if (!b) return "";
              return `<div><div class="stat" style="font-size:20px">${Math.round(b.pct * 100)}%</div><div class="muted" style="font-size:12px">${CHUNK_SRC_CN[k]}</div></div>`;
            }).join("")}</div>
            <div class="muted" style="font-size:12px;margin-top:6px">Discover skip what you can already use.</div>`
          : `<p class="muted" style="font-size:13px;margin:0">Once your word count is high, what blocks you is usually chunks, not words. One quick check tells Discover where to start you on phrases and idioms.</p>`}
        <div class="row" style="margin-top:8px"><button class="btn ${ck ? "" : "primary"}" id="chunkBtn">🧩 Phrase & idiom check${ck ? "(redo)" : ""}</button>
          ${ck ? `<button class="btn" id="chunkRes">See result</button>` : ""}</div>
      </div>
      <div class="card">
        <h2 class="sec">Settings</h2>
        <label class="set">Chinese gloss <input type="checkbox" id="setCn" ${s.chinese ? "checked" : ""}></label>
        <label class="set">Gloss language
          <span class="subtabs" style="margin:0">
            <button class="${(s.glossLang || "both") === "both" ? "on" : ""}" data-gloss="both">Both</button>
            <button class="${s.glossLang === "en" ? "on" : ""}" data-gloss="en">English</button>
          </span></label>
        <p class="muted" style="font-size:12px;margin:-4px 0 8px;line-height:1.6">「English= English-only study:No Chinese gloss or example translation anywhere, and review options are English definitions. The Chinese stays stored — switch back any time.</p>
        <label class="set" style="align-items:flex-start">Review card <span class="subtabs" style="margin:0;flex-wrap:wrap;justify-content:flex-end">${[["auto", "Auto"], ["en2cn", "Word→meaning"], ["cloze", "Cloze"], ["zh2en", "Meaning→word"], ["flip", "Flip card"]].map(([k, lab]) =>
            `<button class="${(s.reviewDrill || "auto") === k ? "on" : ""}" data-drill="${k}">${lab}</button>`).join("")}</span></label>
        <p class="muted" style="font-size:12px;margin:-4px 0 8px;line-height:1.6">Auto climbs a ladder as a word matures: pick the meaning → pick the word → write it into a sentence. <b>Flip card</b> is the classic self-marked card — it moves the schedule, but it never counts toward <b>produced</b> and can't earn <b>known</b>, because you weren't asked to produce anything.</p>
        <label class="set">Model key (“Tell them apart”) <input type="password" id="setAiKey" autocomplete="off" placeholder="gsk_…" value="${esc(s.aiKey || "")}" style="width:130px"></label>
        <p class="muted" style="font-size:12px;margin:-4px 0 8px;line-height:1.6"><b>Groq is free</b> — console.groq.com, no card. It only powers the written comparison of confusable words (flourish / nurture / nourish); everything else here works without it. The key stays on this device and never rides the sync.</p>
        <label class="set">Show examples <input type="checkbox" id="setEx" ${s.showExamples ? "checked" : ""}></label>
        <label class="set">Auto top-up (examples / gloss / frequency) <input type="checkbox" id="setAuto" ${s.autoEnrich !== false ? "checked" : ""}></label>
        <label class="set">My vocabulary size <input type="number" id="setLvl" value="${Number(s.vocabLevel) || 0}" min="0" max="40000" step="500" inputmode="numeric" style="width:88px"></label>
        <p class="muted" style="font-size:12px;margin:-4px 0 8px;line-height:1.6"><b>One number, everywhere.</b> Words commoner than this count as already yours: skipped in Discover's word list, and hidden from a saved article or episode. Lower it to bring commoner words back — saved material re-filters as you change it, down to the level it was recorded at. <b>0</b> uses your reading-assessment estimate instead. Kept on this device only, since settings never ride the sync.</p>
        <label class="set">New words per day <input type="number" id="setLimit" value="${s.dailyNewLimit}" min="1" max="100" style="width:70px"></label>
        <label class="set">Daily review goal <input type="number" id="setGoal" value="${s.dailyGoal || 20}" min="5" max="200" step="5" style="width:70px"></label>
      </div>
      <div class="row" style="margin:2px 0 12px"><button class="btn" id="advToggle" style="width:100%">⚙️ Data & sync ▾</button></div>
      <div id="adv" class="adv">
      <div class="card">
        <h2 class="sec">☁️ Cloud sync</h2>
        <p class="muted" style="font-size:12px;margin:0 0 8px;line-height:1.7"><b>Merge rules (identical on the desktop):</b>① An entry's identity is its  <b>id</b>,not its spelling, so renaming never splits it in two;② <b>Your actions</b>(delete, rename, Known, your own sentences, review progress)<b>the later one wins</b>;③ <b>Look-up data</b>(definitions, examples, gloss, collocations)<b>the richer copy wins regardless of when it was fetched</b> —— a thin phone result never overwrites a good desktop one.</p>
        <p class="muted" style="font-size:12px;margin:0 0 8px">Shares one private GitHub Gist with the Chrome extension. Press Sync to = pull, merge and push back. The token stays on this device and is never uploaded.<a href="https://github.com/settings/tokens/new?scopes=gist&description=Lexis%20Sync" target="_blank">Generate a token</a>(gist scope only).</p>
        <label class="set">Token <input type="password" id="setGistToken" value="${esc(s.gistToken || "")}" placeholder="ghp_…" autocomplete="off" style="width:150px"></label>
        <label class="set">Gist ID <input type="text" id="setGistId" value="${esc(s.gistId || "")}" placeholder="blank = created on first sync" autocomplete="off" style="width:150px"></label>
        <div class="row" style="margin-top:8px"><button class="btn sage" id="syncBtn">☁️ Sync</button></div>
      </div>
      <div class="card">
        <h2 class="sec">Notebook upkeep</h2>
        <p class="muted" style="font-size:12px;margin:0 0 8px">Thin entries — missing a definition, examples, gloss or frequency — are topped up when you open the notebook, <b>Auto top-up in the background</b>,a few at a time. You can also do them all now.</p>
        <div class="row">
          <button class="btn ${incomplete ? "sage" : ""}" id="fixAll">${incomplete ? `Top up now ${incomplete}  thin entries` : "all complete ✓"}</button>
        </div>
        <div class="row" style="margin-top:8px"><button class="btn" id="tidyWords">Clean out names & junk · normalise plurals</button></div>
      </div>
      <div class="card">
        <h2 class="sec">Data</h2>
        <div class="row"><button class="btn" id="exp">Export JSON</button><button class="btn" id="imp">Import</button><button class="btn" id="clr" style="color:#c05a5a">Erase all</button></div>
        <input type="file" id="impFile" accept="application/json" hidden>
      </div>
      </div>
      <p class="muted" style="text-align:center;font-size:12px">Lexis H5 v1.113.2 · Data lives only in this browser</p>`;

    // settings you actually touch stay visible; sync/data/maintenance fold away
    $("#advToggle").addEventListener("click", () => {
      const open = $("#adv").classList.toggle("open");
      $("#advToggle").textContent = open ? "⚙️ Data & sync ▴" : "⚙️ Data & sync ▾";
    });
    $("#setCn").addEventListener("change", (e) => { s.chinese = e.target.checked; setSettings(s); });
    view.querySelectorAll("[data-drill]").forEach((b) => b.addEventListener("click", () => {
      const s3 = getSettings(); s3.reviewDrill = b.dataset.drill; setSettings(s3);
      if (session) { session.drill = null; session.drillFor = null; }
      renderMe();
    }));
    view.querySelectorAll("[data-gloss]").forEach((b) => b.addEventListener("click", () => {
      const s3 = getSettings(); s3.glossLang = b.dataset.gloss; setSettings(s3);
      if (session) { session.drill = null; session.drillFor = null; }
      renderMe();
    }));
    $("#setEx").addEventListener("change", (e) => { s.showExamples = e.target.checked; setSettings(s); });
    // typed, not pasted-and-forgotten: save on blur so a half-typed key is never stored
    $("#setAiKey").addEventListener("change", (e) => {
      s.aiKey = String(e.target.value || "").trim();
      if (!s.aiProvider) s.aiProvider = "groq";
      setSettings(s); toast(s.aiKey ? "Key saved on this device" : "Key cleared");
    });
    $("#setAuto").addEventListener("change", (e) => { s.autoEnrich = e.target.checked; setSettings(s); });
    $("#setLvl").addEventListener("change", (e) => { s.vocabLevel = Math.max(0, parseInt(e.target.value, 10) || 0);
      s.vocabLevelSet = true; setSettings(s); });
    $("#setLimit").addEventListener("change", (e) => { s.dailyNewLimit = +e.target.value || 15; setSettings(s); });
    $("#setGoal").addEventListener("change", (e) => { s.dailyGoal = +e.target.value || 20; setSettings(s); });
    $("#assessBtn").addEventListener("click", startAssess);
    $("#quickBtn").addEventListener("click", renderQuickTest);
    if ($("#quickRes")) $("#quickRes").addEventListener("click", renderQuickResult);
    $("#readAssessBtn").addEventListener("click", renderReadingPick);
    $("#chunkBtn").addEventListener("click", renderChunkAssess);
    if ($("#chunkRes")) $("#chunkRes").addEventListener("click", renderChunkResult);
    $("#setGistToken").addEventListener("change", (e) => { s.gistToken = e.target.value.trim(); setSettings(s); });
    $("#setGistId").addEventListener("change", (e) => { s.gistId = e.target.value.trim(); setSettings(s); startSyncPolling(); });
    $("#syncBtn").addEventListener("click", () => cloudSync($("#syncBtn")));
    $("#exp").addEventListener("click", exportData);
    $("#imp").addEventListener("click", () => $("#impFile").click());
    $("#impFile").addEventListener("change", importData);
    $("#clr").addEventListener("click", () => {
      // the one action that stays behind a confirm — it wipes settings + token too
      if (confirm("Erase every word and setting on this device?This cannot be undone. The cloud Gist is unaffected.")) { localStorage.clear(); toast("Cleared"); go("me"); }
    });
    $("#fixAll").addEventListener("click", async (e) => {
      const btn = e.target;
      if (!incomplete) { toast("Every entry in your notebook is complete ✓"); return; }
      btn.disabled = true;
      const n = await sweepIncomplete({ manual: true, onProgress: (i, t, w) => { btn.textContent = `Topping up… ${i}/${t} · ${w}`; } });
      toast(n ? `Topped up ${n}  entries ✓` : "No more content is available for these");
      go("me");
    });
    $("#tidyWords").addEventListener("click", () => {
      const r = tidyNotebook();
      toast(r.removed || r.merged
        ? `Cleaned ${r.removed} names / junk entries` + (r.merged ? `, merged ${r.merged} inflected duplicates` : "")
        : "Your notebook is already clean ✓");
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
    if (!t) { if (!opts.silent) toast("Add a GitHub token first (gist scope only)"); return; }
    _syncing = true;
    const btn = opts.btn, label = btn ? btn.textContent : "";
    const FILE = "lexis.json";
    const hdr = { Authorization: "Bearer " + t, Accept: "application/vnd.github+json" };
    const key = (x) => String(x || "").toLowerCase().trim();
    let changed = false;
    // The whole merge lives in vocab.js so this and the extension cannot drift.
    // Rules: identity is the id (not the word), user intent = newer wins,
    // look-up data = richer wins regardless of when it was fetched.
    const mergeRemote = (remoteWords, remoteTombs) => {
      const tombs = getTombs();
      let tombChanged = false;
      Object.keys(remoteTombs || {}).forEach((k) => {
        const t = remoteTombs[k] || 0;
        if (t > (tombs[k] || 0)) { tombs[k] = t; tombChanged = true; }
      });
      if (pruneTombs(tombs)) tombChanged = true;
      if (tombChanged) save(K.deleted, tombs);
      const r = window.lexisMergeNotebooks
        ? window.lexisMergeNotebooks(getWords(), remoteWords || [], tombs)
        : { words: getWords(), changed: false };
      if (r.changed) changed = true;
      _suppressAutoSync = true; setWords(r.words); _suppressAutoSync = false;
    };

    // The vocabulary calibration (Mastered set + 阅读式评估) carries no secrets and is
    // useless if it only lives on one device, so it rides along with the words.
    // Whole-object newer-wins: it is a single evolving record, not a per-item list.
    const assessPayload = () => { const a = getAssess(); return { known: a.known || [], reading: a.reading || null, chunk: a.chunk || null, quick: a.quick || null, estVocab: a.estVocab || 0, updatedAt: a.updatedAt || 0 }; };
    const mergeRemoteAssess = (remote) => {
      if (!remote) return;
      const a = getAssess();
      if ((remote.updatedAt || 0) <= (a.updatedAt || 0)) return;
      if (Array.isArray(remote.known)) a.known = remote.known;
      if (remote.reading) a.reading = remote.reading;
      if (remote.chunk) a.chunk = remote.chunk;
      if (remote.quick) a.quick = remote.quick;
      if (remote.estVocab) a.estVocab = remote.estVocab;
      a.updatedAt = remote.updatedAt || now();
      setAssess(a, true); changed = true;
    };
    // Episodes live one-per-file in the same gist (v-<id>.json). The phone reads
    // them but never records them — recording needs the YouTube sidebar, which a
    // web page cannot have — so this is a one-way projection, and it keeps only
    // what a phone can act on: which episodes exist, how much of each is still
    // unlearned, and the word list. Sentences and transcript stay in the file.
    const mergeRemoteVideos = (remoteIdx, files) => {
      if (!remoteIdx) return false;
      const idx = load(K.videos, {}) || {};
      let touched = false;
      Object.keys(remoteIdx).forEach((vid) => {
        const r = remoteIdx[vid] || {};
        if (r.del) { if (idx[vid]) { delete idx[vid]; touched = true; } return; }
        if (idx[vid] && (idx[vid].u || 0) >= (r.u || 0)) return;
        const f = files && files["v-" + String(vid).replace(/[^A-Za-z0-9_-]/g, "") + ".json"];
        if (!f) return;
        let v = null;
        if (f.content) { try { v = JSON.parse(f.content); } catch (e) {} }
        // >1MB arrives truncated with a raw_url instead of content — record the
        // link and let the episode page fetch it when it is actually opened
        if (!v && f.raw_url) {
          // truncated (>1MB): the index is all we have, so take what it carries
          idx[vid] = { u: r.u || 0, t: r.t || vid, url: r.url || "", kind: r.kind || "",
                       site: r.site || "", lvl: r.lvl || 0, raw: f.raw_url, words: [], partial: true };
          touched = true; return;
        }
        if (!v || !v.id) return;
        idx[vid] = {
          u: v.updatedAt || v.savedAt || 0, t: v.title || vid, url: v.url || "",
          // an article and an episode share this store; `kind` is what the card
          // and the detail page branch on, so it has to ride in the LIGHT index
          // — otherwise the phone must download the whole file just to know
          // which one it is looking at
          kind: v.kind || "", site: v.site || "", img: v.image || "",
          // the level it was recorded at, so the phone can filter to YOUR level
          // and say honestly when an easy word is missing from the file rather
          // than from the page — one number, not a re-download
          lvl: v.lvl || 0,
          s: v.savedAt || 0, raw: f.raw_url || "", lines: (v.lines || []).length,
          // the words WITHOUT their sentences — that is the bulky half
          words: (v.words || []).map((w) => ({ w: w.w, k: w.k, r: w.r || null, c: w.c ? 1 : 0,
            p: w.p ? 1 : 0, cn: w.p ? (w.cn || "") : "" })),
        };
        touched = true;
      });
      if (touched) save(K.videos, idx);
      return touched;
    };

    // The phone doesn't own the episode index — the desktop writes it. But a
    // push replaces the whole of lexis.json, so it has to hand the index back
    // untouched, or a phone sync would erase every episode's existence (and
    // with it the deletions the desktop is still waiting to see).
    let remoteVideoIdx = null;
    try {
      if (btn) btn.textContent = "Pulling……";
      let id = (s.gistId || "").trim();
      if (id) {
        const r = await fetch("https://api.github.com/gists/" + id, { headers: hdr });
        if (r.ok) {
          const g = await r.json(); const f = g.files && g.files[FILE];
          if (f && f.content) { try { const d = JSON.parse(f.content); mergeRemote(Array.isArray(d) ? d : d.words, Array.isArray(d) ? {} : d.deleted); if (!Array.isArray(d)) { mergeRemoteAssess(d.assess); remoteVideoIdx = d.videoIndex || null; if (mergeRemoteVideos(d.videoIndex, g.files)) changed = true; } } catch (e) {} }
        } else if (r.status === 404) { id = ""; }
        else if (r.status === 401) throw new Error("invalid token");
      }
      if (btn) btn.textContent = "Pushing……";
      const body = JSON.stringify({ description: "Lexis vocab sync", public: false, files: { [FILE]: { content: JSON.stringify({ words: getWords(), assess: assessPayload(), deleted: getTombs(), videoIndex: remoteVideoIdx || undefined, syncedAt: now() }) } } });
      const resp = id
        ? await fetch("https://api.github.com/gists/" + id, { method: "PATCH", headers: hdr, body })
        : await fetch("https://api.github.com/gists", { method: "POST", headers: hdr, body });
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const g = await resp.json();
      if (g.id && g.id !== s.gistId) { s.gistId = g.id; setSettings(s); }
      refreshBadge();
      if (!opts.silent) { toast(`Synced ✓ ${getWords().length} words`); go("me"); }
      // …including discover: a silent pull is the ONLY way episodes ever arrive
      // on the phone, so the one view that shows them must be in this list or you
      // sit looking at "No episodes yet" while they are already in localStorage.
      else if (changed && (current === "notebook" || current === "review" || current === "me" || current === "discover")) go(current);
    } catch (err) {
      if (!opts.silent) toast("Sync failed:" + (err.message || err));
      if (btn) btn.textContent = label || "☁️ Sync";
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
        if (n < 0) { toast("Invalid file"); return; }
        toast(`merged ${n}  words ✓`); refreshBadge(); go("me");
      } catch (x) { toast("Invalid file"); }
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
    // Unread first: re-reading a passage adds no judgements (the estimator
    // counts each word type once), so what can still move the number goes on top.
    const fresh = passages.filter((p) => !done.has(p.id));
    const ordered = fresh.concat(passages.filter((p) => done.has(p.id)));
    view.innerHTML = `
      <div class="row" style="margin-bottom:12px"><button class="btn" id="back">← Back</button></div>
      <div class="card">
        <h2 class="sec">Reading assessment</h2>
        <p class="muted" style="font-size:13px;margin:0">Read a short passage and <b>tap only the words you don't know</b>。Everything you leave counts as known — about 100 judgements per passage, far faster than ticking one at a time. Two or more passages gives a sharper number.</p>
        ${est ? `<div class="row" style="margin-top:10px"><span class="stat">${est.estVocab.toLocaleString()}</span><span class="muted">current estimate · sampled  ${est.sampled}  · confidence  ${({ high: "high", mid: "medium", low: "low" })[est.confidence]}</span></div>` : ""}
      </div>
      ${!fresh.length && passages.length ? `<div class="card"><p class="muted" style="font-size:12px;margin:0">You have read all ${passages.length}. Re-reading one adds nothing — each word type is only counted once — so the sharper number now comes from the <b>phrase &amp; idiom check</b>, which draws a new set every round.</p></div>` : ""}
      ${ordered.map((p) => `<div class="item${done.has(p.id) ? " pass-done" : ""}" data-pass="${esc(p.id)}">
        <div style="min-width:0"><div class="w serif">${esc(p.title)}</div><div class="meta">${esc(p.cn)} · ~${p.text.split(/\s+/).length} words</div></div>
        <span class="st chip">${done.has(p.id) ? "read" : "Start"}</span></div>`).join("")}
      <div class="row" style="margin-top:14px">
        <button class="btn" id="wordwise">Tick word by word instead</button>
        ${est ? `<button class="btn sage" id="seeRes">See the result</button>` : ""}
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
    const phrases = new Set();
    view.innerHTML = `
      <div class="row" style="margin-bottom:12px"><button class="btn" id="back">← Back</button>
        <span class="muted" style="margin-left:auto;font-size:12px" id="mcount">0 marked</span></div>
      <div class="card">
        <h2 class="sec">${esc(p.title)}</h2>
        <p class="muted" style="font-size:12px;margin:0 0 10px">Tap the words you <b>don't know</b> (tap again to undo). Basic words aren't tappable and don't count.<br>
        Is it a <b>chunk</b>? Press and hold to <b>select those words</b>, then pick Don't know or Look up on the bar that appears.</p>
        <div class="passage" id="ptext">${toks.map((t, i) => t.word
          ? (t.band ? `<span class="rw" data-i="${i}" data-k="${esc(t.key)}" data-b="${esc(t.band)}">${esc(t.text)}</span>` : esc(t.text))
          : esc(t.text)).join("")}</div>
        <div id="phbox"></div>
      </div>
      <div class="row"><button class="btn primary" id="pdone" style="flex:1;padding:13px">Done — work it out →</button></div>`;
    $("#back").addEventListener("click", renderReadingPick);
    const cnt = $("#mcount");
    // Chunks marked unknown are listed under the passage rather than highlighted
    // inside it: a phrase spans several tokens and rewriting the passage DOM
    // would fight the per-word marking. They carry no band, so they don't touch
    // the size estimate — they go to the notebook, which is the actual point.
    const drawPh = () => {
      const box = $("#phbox");
      const list = Array.from(phrases);
      box.innerHTML = list.length
        ? `<div class="ph-lbl">Chunks marked ·  ${list.length}</div><div class="row" style="flex-wrap:wrap;gap:6px">${list.map((t) => `<span class="chip ph-chip">${esc(t)} <button class="ph-x" data-phdel="${esc(t)}">✕</button></span>`).join("")}</div>`
        : "";
      box.querySelectorAll("[data-phdel]").forEach((b) => b.addEventListener("click", () => { phrases.delete(b.dataset.phdel); drawPh(); }));
    };
    passagePhrases = { add: (t) => { phrases.add(t); drawPh(); } };
    view.querySelectorAll(".rw").forEach((n) => n.addEventListener("click", () => {
      const k = n.dataset.k;
      if (marked.has(k)) marked.delete(k); else marked.add(k);
      view.querySelectorAll(`.rw[data-k="${CSS.escape(k)}"]`).forEach((m) => m.classList.toggle("unk", marked.has(k)));
      cnt.textContent = `marked ${marked.size}  marked`;
    }));
    $("#pdone").addEventListener("click", () => {
      const a = getAssess();
      const r = a.reading || { seen: {}, unknown: [], passages: [] };
      const unknown = new Set(r.unknown || []);
      phrases.forEach((t) => unknown.add(t));
      const knownAdd = [];
      view.querySelectorAll(".rw").forEach((n) => {
        r.seen[n.dataset.k] = n.dataset.b;
        if (marked.has(n.dataset.k)) unknown.add(n.dataset.k);
        else { unknown.delete(n.dataset.k); knownAdd.push(n.dataset.k); }  // read and understood
      });
      r.unknown = Array.from(unknown);
      r.passages = Array.from(new Set((r.passages || []).concat([p.id])));
      r.at = now();
      // words you read without stumbling feed the same Mastered set the rest of the
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
    const conf = { high: "high", mid: "medium", low: "low" }[est.confidence];
    const bars = est.bands.map((b) => `
      <div class="lvl">
        <span class="lvl-bl mfreq freq-${b.key === "beyond" ? "rare" : b.key}">${esc(b.cn)}</span>
        <span class="lvl-track"><i class="freq-${b.key === "beyond" ? "rare" : b.key}" style="width:${Math.round(b.pct * 100)}%"></i></span>
        <span class="lvl-n">${b.measured ? Math.round(b.pct * 100) + "% · " + b.seen + " sampled"
          : (b.key === "beyond" ? Math.round(b.pct * 100) + "% · inferred" : "too few samples")}</span>
      </div>`).join("");
    const unk = (r.unknown || []).slice(0, 60);
    view.innerHTML = `
      <div class="row" style="margin-bottom:12px"><button class="btn" id="back">← Back</button></div>
      <div class="card">
        <h2 class="sec">Estimated vocabulary</h2>
        <div class="stat">${est.estVocab.toLocaleString()}</div>
        <div class="muted"> word families ·  ${(r.passages || []).length}  read ·  ${est.sampled}  · confidence  ${conf}${
          est.confidence === "high" ? "" : `<br>Still a thin sample — probably between  <b>${est.range[0].toLocaleString()}–${est.range[1].toLocaleString()}</b> . One more passage narrows it.`}</div>
        <div class="meter"><i style="width:${Math.min(100, (est.estVocab / 15000) * 100)}%"></i></div>
        <div class="muted" style="font-size:12px">goal: 15,000 word families — enough to follow English film, TV and podcasts</div>
      </div>
      <div class="card"><h2 class="sec">Coverage by band</h2>${bars}
        <div class="muted" style="font-size:12px;margin-top:8px">counted from the words you read:the share you did not tap in that band. Discover now leads with your weakest ones.</div></div>
      ${unk.length ? `<div class="card"><h2 class="sec">Words you marked ·  ${(r.unknown || []).length}</h2>
        <div class="row">${unk.map((w) => `<span class="chip" data-look="${esc(w)}">${esc(w)}</span>`).join("")}</div>
        <div class="row" style="margin-top:10px"><button class="btn sage" id="addUnk">Add all to notebook</button></div></div>` : ""}
      <div class="row"><button class="btn" id="more" style="flex:1">Read another →</button><button class="btn" id="toDisc" style="flex:1">Learn new words in Discover</button></div>`;
    $("#back").addEventListener("click", () => go("me"));
    // "Read another" means another one — open an UNREAD passage directly instead
    // of returning to a list whose first card is the one you just finished.
    $("#more").addEventListener("click", () => {
      const readIds = new Set(readingState().passages || []);
      const left = (window.LEXIS_PASSAGES || []).filter((p) => !readIds.has(p.id));
      if (!left.length) { renderReadingPick(); return; }
      renderPassage(left[Math.floor(Math.random() * left.length)].id);
    });
    $("#toDisc").addEventListener("click", () => go("discover"));
    wireCard(view);
    const au = $("#addUnk");
    if (au) au.addEventListener("click", async () => {
      const list = (readingState().unknown || []).filter((w) => !findWord(w));
      if (!list.length) { toast("All of these are already in your notebook"); return; }
      au.disabled = true;
      for (let i = 0; i < list.length; i++) {
        au.textContent = `Adding… ${i + 1}/${list.length}…`;
        saveWord(await lookupFull(list[i]));
      }
      toast(`Added ${list.length} words`); refreshBadge(); renderReadingResult();
    });
  }


  // ---- Phrase & idiom check -----------------------------------------------------
  // Frequency alone can't tell Discover where to start on chunks: "have to" is
  // rank 1 and trivially known, while a rank-300 phrasal verb may not be. So we
  // sample across the whole rank range and ask the one question that matters for
  // this gap — can you PRODUCE it, not can you recognise it. The lowest rank you
  // still can't produce becomes the frontier Discover starts from.
  // Every round asks about chunks you have NOT been asked before — see
  // lexisChunkSample() in vocab.js. Redoing it used to hand back the same 50.
  function chunkSample() {
    const c = chunkState() || {};
    return window.lexisChunkSample ? window.lexisChunkSample(c.seen || []) : [];
  }
  function chunkState() { return getAssess().chunk || null; }
  const CHUNK_SRC_CN = { phrase: "Fixed expressions", pv: "Phrasal verbs", idiom: "Idioms" };

  function renderChunkAssess() {
    const items = chunkSample();
    // A new round starts BLANK. Pre-ticking it with the previous round's answers
    // was half of why redoing the check felt like nothing had changed.
    const marked = new Set();
    const cst = chunkState() || {};
    const round = (cst.rounds || 0) + 1;
    view.innerHTML = `
      <div class="row" style="margin-bottom:12px"><button class="btn" id="back">← Back</button>
        ${round > 1 ? `<button class="btn" id="ckReset" style="margin-left:auto">Start over</button>` : ""}</div>
      <div class="card">
        <h2 class="sec">Phrase & idiom check</h2>
        <p class="muted" style="font-size:13px;margin:0">${items.length} chunks <b>sampled evenly</b> across the frequency range. <b>Tap the ones you couldn't produce</b>——Recognising it but not reaching for it when you speak counts as couldn't. That gap is exactly "I know every word and still can't say it".</p>
        ${round > 1 ? `<p class="muted" style="font-size:12px;margin:8px 0 0">Round ${round} · <b>all new</b> — ${(cst.seen || []).length} chunks judged so far and none of them are here.${items.freshLeft === 0 ? " Every pool has been through once, so this round revisits earlier ones." : ""} Results add to the previous rounds.</p>` : ""}
      </div>
      ${["phrase", "pv", "idiom"].map((src) => {
        const g = items.filter((x) => x.src === src);
        if (!g.length) return "";
        return `<div class="card"><h2 class="sec">${CHUNK_SRC_CN[src]} · ${g.length}</h2>
          <div class="row">${g.map((x) =>
            `<button class="chunk-chip${marked.has(x.term) ? " unk" : ""}" data-ck="${esc(x.term)}">${esc(x.term)}</button>`).join("")}</div></div>`;
      }).join("")}
      <div class="row"><button class="btn primary" id="ckDone" style="flex:1;padding:13px">Work it out →</button>
        <span class="muted" id="ckN" style="font-size:12px">${marked.size} tapped</span></div>`;
    $("#back").addEventListener("click", () => go("me"));
    view.querySelectorAll("[data-ck]").forEach((b) => b.addEventListener("click", () => {
      const t = b.dataset.ck;
      if (marked.has(t)) marked.delete(t); else marked.add(t);
      b.classList.toggle("unk", marked.has(t));
      $("#ckN").textContent = marked.size + " tapped";
    }));
    if ($("#ckReset")) $("#ckReset").addEventListener("click", () => {
      const a = getAssess(); a.chunk = null; setAssess(a);
      toast("Chunk check reset — the next round starts from the top again");
      renderChunkAssess();
    });
    $("#ckDone").addEventListener("click", () => {
      const a = getAssess();
      // ADD to the previous rounds rather than replacing them — frontier is the
      // most common thing you still can't produce, across every round.
      a.chunk = Object.assign(window.lexisChunkTally(a.chunk, items, marked), { at: now() });
      // words you could produce count as mastered, so Discover stops offering them
      const good = items.filter((x) => !marked.has(x.term)).map((x) => x.term);
      a.known = Array.from(new Set([].concat(a.known || [], good)));
      setAssess(a);
      renderChunkResult();
    });
  }

  function renderChunkResult() {
    const c = chunkState();
    if (!c) { renderChunkAssess(); return; }
    const rows = ["phrase", "pv", "idiom"].map((src) => {
      const b = c.bySrc[src]; if (!b) return "";
      return `<div class="lvl">
        <span class="lvl-bl mfreq">${CHUNK_SRC_CN[src]}</span>
        <span class="lvl-track"><i style="width:${Math.round(b.pct * 100)}%"></i></span>
        <span class="lvl-n">can produce ${Math.round(b.pct * 100)}% · ${b.seen} sampled</span></div>`;
    }).join("");
    const unk = c.unknown || [];
    view.innerHTML = `
      <div class="row" style="margin-bottom:12px"><button class="btn" id="back">← Back</button></div>
      <div class="card"><h2 class="sec">Chunk production</h2>${rows}
        <div class="muted" style="font-size:12px;margin-top:8px">${c.rounds > 1 ? `<b>${c.rounds} rounds</b> · ${(c.seen || []).length} chunks judged in total — every round asks about new ones and these totals include all of them.<br>` : ""}Discover 's three chunk tabs now <b>skip what you can already use</b>,and start where you couldn't produce it.</div></div>
      ${unk.length ? `<div class="card"><h2 class="sec">Couldn't produce ·  ${unk.length}</h2>
        <div class="row">${unk.slice(0, 60).map((t) => `<span class="chip" data-look="${esc(t)}">${esc(t)}</span>`).join("")}</div>
        <div class="row" style="margin-top:10px"><button class="btn sage" id="ckAdd">Add all to notebook</button></div></div>` : ""}
      <div class="row"><button class="btn" id="ckAgain" style="flex:1">Another 50 chunks →</button><button class="btn" id="ckDisc" style="flex:1">Study these chunks →</button></div>`;
    $("#back").addEventListener("click", () => go("me"));
    $("#ckAgain").addEventListener("click", renderChunkAssess);
    $("#ckDisc").addEventListener("click", () => { dTab = "pv"; go("discover"); });
    wireCard(view);
    const add = $("#ckAdd");
    if (add) add.addEventListener("click", async () => {
      const list = unk.filter((t) => !findWord(t));
      if (!list.length) { toast("All of these are already in your notebook"); return; }
      add.disabled = true;
      for (let i = 0; i < list.length; i++) { add.textContent = `Adding… ${i + 1}/${list.length}…`; saveWord(await lookupFull(list[i])); }
      toast(`Added ${list.length}  chunks`); refreshBadge(); renderChunkResult();
    });
  }

  // ---- quick check — Yes/No test with pseudowords (maths in vocab.js) ----
  function quickState() { return getAssess().quick || null; }
  function quickEstimate() {
    return window.lexisQuickEstimate ? window.lexisQuickEstimate(quickState()) : null;
  }
  // reading first (it judges words in context), then the quick check — but only
  // when its own false-alarm rate says the answers were judgements about words
  function bestEstimate() {
    const a = getAssess();
    const r = a.reading ? readingEstimate(a.reading) : null;
    if (r) return r;
    const q = quickEstimate();
    return q && q.reliable ? q : null;
  }

  function renderQuickTest() {
    const items = window.lexisQuickRound ? window.lexisQuickRound(quickState()) : [];
    const yes = new Set();                       // every round starts blank
    const round = ((quickState() || {}).rounds || 0) + 1;
    const prev = quickEstimate();
    view.innerHTML = `
      <div class="row" style="margin-bottom:12px"><button class="btn" id="back">← Back</button>
        ${round > 1 ? `<button class="btn" id="qkReset" style="margin-left:auto">Start over</button>` : ""}</div>
      <div class="card">
        <h2 class="sec">Quick check</h2>
        <p class="muted" style="font-size:13px;margin:0"><b>Tap only the words you know</b> — know meaning it, not having seen it. Anything you leave alone counts as not known. ${items.length} words, about two minutes.</p>
        <p class="muted" style="font-size:12px;margin:8px 0 0">Some of these <b>are not English words at all</b>, and they are here on purpose: a test you mark yourself is worth nothing unless it can tell when you are over-claiming, so whatever share of the invented ones you tap gets taken back off your score. Don't hunt for them — just answer honestly.</p>
        ${round > 1 ? `<p class="muted" style="font-size:12px;margin:8px 0 0">Round ${round} · <b>all new words</b>${prev ? ` — currently ≈<b>${prev.estVocab.toLocaleString()}</b>, and this round concentrates where you started to falter.` : ""}</p>` : ""}
      </div>
      <div class="card"><div class="row">${items.map((x) =>
        `<button class="chunk-chip" data-qk="${esc(x.term)}">${esc(x.term)}</button>`).join("")}</div></div>
      <div class="row"><button class="btn primary" id="qkDone" style="flex:1;padding:13px">Work it out →</button>
        <span class="muted" id="qkN" style="font-size:12px">0 marked known</span></div>`;
    $("#back").addEventListener("click", () => go("me"));
    view.querySelectorAll("[data-qk]").forEach((b) => b.addEventListener("click", () => {
      const t = b.dataset.qk;
      if (yes.has(t)) yes.delete(t); else yes.add(t);
      b.classList.toggle("kn", yes.has(t));
      $("#qkN").textContent = yes.size + " marked known";
    }));
    if ($("#qkReset")) $("#qkReset").addEventListener("click", () => {
      const a = getAssess(); a.quick = null; setAssess(a);
      toast("Quick check reset — the next round starts from the top again");
      renderQuickTest();
    });
    $("#qkDone").addEventListener("click", () => {
      const a = getAssess();
      a.quick = Object.assign(window.lexisQuickTally(a.quick, items, yes), { at: now() });
      const est = window.lexisQuickEstimate(a.quick);
      // marks made in a round where a third of the nonwords were claimed are
      // not evidence, so they do not become "known"
      if (est && est.reliable) {
        const good = items.filter((x) => !x.fake && yes.has(x.term)).map((x) => x.term.toLowerCase());
        a.known = Array.from(new Set([].concat(a.known || [], good)));
      }
      setAssess(a);
      renderQuickResult();
    });
  }

  function renderQuickResult() {
    const est = quickEstimate();
    if (!est) { renderQuickTest(); return; }
    const rows = est.byLevel.map((b) => `<div class="lvl">
      <span class="lvl-bl mfreq">${b.lo.toLocaleString()}–${b.hi.toLocaleString()}</span>
      <span class="lvl-track"><i style="width:${Math.round(b.pct * 100)}%"></i></span>
      <span class="lvl-n">${Math.round(b.pct * 100)}%${b.measured ? ` · ${b.seen} asked` : " · estimated"}</span></div>`).join("");
    const a = getAssess();
    const rEst = a.reading ? readingEstimate(a.reading) : null;
    // the false-alarm line is the point of the design, so it is stated either way
    const faLine = est.faSeen
      ? (est.faYes
        ? `You marked <b>${est.faYes}</b> of the ${est.faSeen} invented words as known (${Math.round(est.faRate * 100)}%), so ${Math.round(est.faRate * 100)}% of your other answers were discounted as the same reflex.`
        : `You marked <b>none</b> of the ${est.faSeen} invented words — nothing was discounted, and this is your raw score.`)
      : "";
    view.innerHTML = `
      <div class="row" style="margin-bottom:12px"><button class="btn" id="back">← Back</button></div>
      ${est.reliable ? "" : `<div class="card"><h2 class="sec">⚠️ Not reported as a score</h2>
        <p class="muted" style="font-size:13px;margin:0">You marked ${est.faYes} of the ${est.faSeen} invented words as known. Above about a third, the answers stop being judgements about words and the correction can no longer separate what you know from what you waved through. Take it again and leave anything you are unsure of untapped.</p></div>`}
      <div class="card">
        <h2 class="sec">Estimated vocabulary · quick check</h2>
        <div class="stat">${est.reliable ? `≈ ${est.estVocab.toLocaleString()}` : "—"}</div>
        <div class="muted" style="font-size:12px">${est.reliable ? `${est.range[0].toLocaleString()}–${est.range[1].toLocaleString()} word families` : "unusable answers"} · ${est.rounds > 1 ? `${est.rounds} rounds · ` : ""}${est.sampled} real words judged</div>
        <div style="margin-top:12px">${rows}</div>
        <div class="muted" style="font-size:12px;margin-top:8px">${faLine}</div>
      </div>
      ${rEst ? `<div class="card"><p class="muted" style="font-size:12px;margin:0">Your reading assessment says <b>${rEst.estVocab.toLocaleString()}</b>. The two are measured differently — reading judges words <b>in context</b> and tops out near 15,900, this one judges them in isolation against a 20,000-family list — so they won't match exactly. <b>Where they disagree, trust the reading number</b>: recognising a word alone is easier than using one in a sentence.</p></div>` : ""}
      <div class="row"><button class="btn" id="qkAgain" style="flex:1">Another round →</button>
        <button class="btn" id="qkRead" style="flex:1">Reading assessment</button></div>`;
    $("#back").addEventListener("click", () => go("me"));
    $("#qkAgain").addEventListener("click", renderQuickTest);
    $("#qkRead").addEventListener("click", renderReadingPick);
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
        <h2 class="sec">Quick vocabulary check</h2>
        <p class="muted">Tick the ones you <b>know</b> — sampled from frequent to rare; the estimate follows.</p>
        <div id="agrid" class="row" style="gap:8px">${picks.map((w) =>
          `<button class="chip" data-w="${esc(w)}" style="padding:8px 12px;font-size:14px">${esc(w)}</button>`).join("")}</div>
        <div class="row" style="margin-top:14px"><button class="btn primary" id="adone" style="flex:1">Finish</button></div>
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
      setAssess(a); toast("Estimated vocabulary ≈ " + a.estVocab.toLocaleString() + " words"); go("me");
    });
  }

  // ---- quick-add from share sheet / shortcut: ?add=word ----------------
  async function autoAdd(rawTerm, context, source) {
    const term = norm(rawTerm);
    if (!term) return;
    const ctx = (context || "").trim();
    const src = (source || "").trim() || "Paste & save";
    const box = openLookupPane();
    if (box) box.innerHTML = `<div class="empty"><span class="spin"></span> Saving… <b>${esc(term)}</b>…</div>`;
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
            toast("Sentence added to  <b>" + esc(term) + "</b>");
            if (box) doLookup(term); return;
          }
        }
      }
      toast("Already in your notebook");
      if (box) doLookup(term);
      return;
    }
    const p = await lookupFull(term);
    p.context = ctx; p.source = src;
    saveWord(p);
    toast(ctx ? "Saved <b>" + esc(term) + "</b>(with its sentence)" : "Saved <b>" + esc(term) + "</b>");
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
    if (!text) { toast("Clipboard is empty — copy a word or a sentence in another app first"); return; }
    if (current !== "notebook") go("notebook");
    const alphaWords = text.match(/[A-Za-z][A-Za-z'’-]*/g) || [];
    if (!alphaWords.length) { toast("No English word on the clipboard"); return; }
    // single word → look it up first (Save button on the card); a sentence → tap the target word
    if (alphaWords.length === 1) { doLookup(alphaWords[0]); return; }
    showWordPicker(text, alphaWords);
  }

  // paste of a whole sentence: tap the target word → LOOK IT UP (with the sentence as 原句),
  // then decide to save from the card. Phrase → look up the whole selection.
  function showWordPicker(sentence, words) {
    const box = openLookupPane(); if (!box) return;
    const html = esc(sentence).replace(/[A-Za-z][A-Za-z'’-]*/g, (m) => `<span class="pickw" data-w="${esc(m)}">${m}</span>`);
    box.innerHTML = `<div class="card"><h2 class="sec">Tap the word to look up</h2>
      <div class="ex pick-sentence">${html}</div>
      <p class="muted" style="font-size:12px;margin-top:8px">Tap any word to see its definition before saving — the whole sentence is kept as its context;For a phrase, use Look up whole sentence.</p>
      <div class="row" style="margin-top:10px"><button class="btn" id="pickPhrase">Look up the whole sentence</button></div></div>`;
    box.querySelectorAll(".pickw").forEach((n) => n.addEventListener("click", () => doLookup(n.dataset.w, sentence)));
    const pp = $("#pickPhrase"); if (pp) pp.addEventListener("click", () => doLookup(sentence, sentence));
  }

  // ---- boot ----
  document.querySelectorAll(".tabbar button").forEach((b) => b.addEventListener("click", () => go(b.dataset.tab)));
  go("notebook");
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
    if (!add && q) {
      // A whole sentence arrived as the "term" (long macOS selection, or a
      // Shortcut that grabbed the paragraph). Don't look that up — show it and
      // let the word be tapped, with the sentence kept as its context. Mirrors
      // the extension's routeLook().
      const qw = q.match(/[A-Za-z][A-Za-z'’-]*/g) || [];
      if (q.split(/\s+/).filter(Boolean).length > 6 && qw.length > 1) showWordPicker(q, qw);
      else doLookup(q, (qs.get("ctx") || "").trim());
    }
  } catch (e) {}

  // auto-sync: pull the shared gist on open, and again whenever the app regains focus
  // (fixes the iOS split-storage gap — every surface converges through the gist)
  repairWords();
  if (repairedDupes) setTimeout(() => toast(`Repaired ${repairedDupes}  duplicate entries`), 600);
  if (syncReady()) syncNow({ silent: true });
  startSyncPolling();
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { syncNow({ silent: true }); startSyncPolling(); } });
  window.addEventListener("focus", () => syncNow({ silent: true }));
  // top up thin entries shortly after launch, without delaying first paint
  setTimeout(() => sweepIncomplete(), 4000);
})();
