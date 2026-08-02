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
  const K = { words: "lexis_words", settings: "lexis_settings", assess: "lexis_assess", deleted: "lexis_deleted" };
  const DEFAULT_SETTINGS = { chinese: true, dailyNewLimit: 15, dailyGoal: 20, showExamples: true, autoEnrich: true, reviewDrill: "auto", glossLang: "both", gistToken: "", gistId: "" };
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
    if (w.length <= 4) {
      const head = (light || w).filter((x) => !PH_SKIP.test(x))[0];
      if (head && /^[a-z][a-z'-]*$/.test(head)) add(head);
    }
    return out.slice(0, 8);
  }
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
      ? "rated against the curated list"
      : isPhrase
        ? `Zipf ${f.zipf} · ≈ ${f.perMillion}/million`
        : `Zipf ${f.zipf} · ≈ ${f.perMillion}/million · estimated rank ~${fmtRank(f.rankEst)}`;
    return `<div class="card"><h2 class="sec">Frequency${isPhrase ? "(phrase)" : ""}</h2>
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
  // dictionaryapi.dev groups senses by part of speech in its own order, so sense
  // #1 of "sensitive" is the rare NOUN. The pos with the MOST senses is the
  // word's real job. (Same helper in background.js — keep them in step.)
  function bestSense(list) {
    const groups = new Map();
    (list || []).forEach((m) => {
      if (!m || !m.definition) return;
      const k = (m.pos || "").toLowerCase();
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(m);
    });
    let best = null;
    groups.forEach((v) => { if (!best || v.length > best.length) best = v; });
    return best ? best[0] : null;
  }
  const partGlossCache = {};
  async function fetchPartGlosses(parts, wantCn) {
    const out = {};
    await Promise.all((parts || []).slice(0, 6).map(async (raw) => {
      const k = String(raw || "").toLowerCase().replace(/[^a-z'-]/g, "");
      if (!k || k.length < 2) return;
      if (partGlossCache[k]) { out[k] = partGlossCache[k]; return; }
      let g = null;
      const dict = await withTimeout(fetchDictionary(k), 7000, null);
      const dm0 = dict && bestSense(dict.meanings);
      if (dm0) g = { pos: dm0.pos || "", definition: dm0.definition };
      if (!g) {
        const wk = await withTimeout(fetchWiktionary(k), 7000, null);
        const s = wk && bestSense(wk.senses);
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
        ${p.phonetic ? `<span class="phon">${esc(p.phonetic)}</span>` : ""}
        ${spk("US", p.audioUs)}
        ${freqChip(p.freq)}
      </div>
      ${p.cn ? `<div class="cn-gloss">${esc(p.cn)}</div>` : ""}
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
    if (p.meanings.length) {
      // A saved phrase is often a surface fragment whose dictionary headword is
      // shorter ("quibble about" → "quibble"). We look that up rather than showing
      // nothing — but the definition belongs to the shorter form, so name it.
      h += `<div class="card"><h2 class="sec">Meanings${p.sensesFrom ? ` <span class="sense-src">${esc(DICT_NAME[p.sensesFrom] || p.sensesFrom)}</span>` : ""}</h2>`
        + (p.sensesOf ? `<div class="senses-of">Defined as <b>${esc(p.sensesOf)}</b> — no dictionary entry for the phrase as you saved it.</div>` : "")
        + p.meanings.map((m) =>
        `<div class="mean">${m.pos ? `<span class="pos">${esc(m.pos)}</span> ` : ""}<span class="def">${esc(m.definition)}</span>${m.cn ? `<div class="cn">${esc(m.cn)}</div>` : ""}</div>`).join("") + `</div>`;
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
    // Synonyms — each synonym with its own pos / band / definition
    const synRich = (p.synonymsRich && p.synonymsRich.length) ? p.synonymsRich
      : (p.synonyms || []).map((w) => ({ word: w }));
    if (synRich.length) {
      h += `<div class="card"><h2 class="sec">Synonyms</h2>` + synRich.map((s) =>
        `<div class="syn"><div class="syn-h"><button class="syn-w" data-look="${esc(s.word)}">${esc(s.word)}</button>${s.pos ? `<span class="pos">${esc(s.pos)}</span>` : ""}${s.band ? `<span class="mfreq freq-${s.band}">${esc(s.bandCn || "")}</span>` : ""}</div>${s.definition ? `<div class="syn-d">${esc(s.definition)}${s.cn ? ` · ${esc(s.cn)}` : ""}</div>` : ""}</div>`).join("") + `</div>`;
    }
    // Look-alikes (easily confused)
    if (p.lookalikes && p.lookalikes.length) {
      h += `<div class="card"><h2 class="sec">Look-alikes</h2>` + p.lookalikes.map((c) =>
        `<div class="conf"><button class="conf-w" data-look="${esc(c.word)}">${esc(c.word)}</button><span class="conf-d">${esc(c.definition || c.cn || "")}</span></div>`).join("") + `</div>`;
    }
    // 词频 (detail-only, like the extension: a measured stat, not part of the meaning)
    if (opts.meter) h += freqMeterHTML(p.freq, p.isPhrase);
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
    if (words.some((w) => w.lookup === p.term)) return false;
    untombstone(p.term);   // saving it again is an explicit "I want this back"
    words.unshift({
      id: "w" + now() + Math.random().toString(36).slice(2, 6),
      word: p.term, lookup: p.term, createdAt: now(), updatedAt: now(),
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
        // the composed entry for a term no dictionary lists — see the breakdown
        // card in cardHTML(); without this it was thrown away on save
        partGlosses: p.partGlosses || null,
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
  function go(tab) {
    if (tab === "lookup") tab = "notebook";
    current = tab;
    document.querySelectorAll(".tabbar button").forEach((b) => b.classList.toggle("on", b.dataset.tab === tab));
    ({ notebook: renderNotebook, review: renderReview, discover: renderDiscover, me: renderMe }[tab])();
    window.scrollTo(0, 0);
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
      // is this exact sentence already recorded on the saved word?
      const ctxKnown = !ctx || (existing && (existing.sightings || []).some((s) => (s.context || "").trim() === ctx) || (existing && (existing.context || "").trim() === ctx));
      let saveBtn;
      if (!existing) saveBtn = `<button class="btn sage" id="saveBtn">Save to notebook</button>`;
      else if (ctx && !ctxKnown) saveBtn = `<button class="btn sage" id="appendBtn">＋ Add this sentence</button>`;
      else saveBtn = `<button class="btn" id="openNbBtn">📖 Already saved · open</button>`;
      const ctxCard = ctx ? contextCardHTML({ word: p.term || term, context: ctx, createdAt: now() }) : "";
      box.innerHTML = `<div class="lookup-bar"><button class="btn" id="lkBack">← Notebook</button></div>`
        + ctxCard + cardHTML(p, { saveBtn, pending, meter: true, addExample: true });
      $("#lkBack").addEventListener("click", closeLookup);
      wireCard(box);
      wireExampleEditor(box, p, () => paint(pending));
      const sb = $("#saveBtn");
      if (sb) sb.addEventListener("click", () => {
        if (ctx) p.source = "Paste & save";
        if (saveWord(p)) { toast(ctx ? "Saved <b>" + esc(p.term) + "</b>(with its sentence)" : "Saved <b>" + esc(p.term) + "</b>"); paint(false); refreshBadge(); }
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
  // SAME three buckets as Discover — 单词 / Phrasal verbs / Fixed expressions — from the same
  // shared classifier, so a term carries one label everywhere it appears. The
  // finer split (习语/介词短语/…) is the chip row below.
  const NB_KINDS = [["all", "All"], ["word", "Words"], ["pv", "Phrasal verbs"], ["expr", "Fixed expressions"]];
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
    if ((s.interval || 0) >= 21 && produced) return { key: "mastered", cn: "Mastered" };
    if ((s.interval || 0) >= 21) return { key: "familiar", cn: `Familiar · produced  ${done}/${need}` };
    if ((s.lapses || 0) >= 4) return { key: "leech", cn: "Tricky" };
    if ((s.reps || 0) >= 3) return { key: "familiar", cn: "Familiar" };
    if ((s.reps || 0) >= 1) return { key: "learning", cn: "Learning" };
    return { key: "new", cn: "New" };
  }
  const NB_BAND_ORDER = { core: 0, "very-common": 1, common: 2, mid: 3, low: 4, rare: 5 };
  const NB_SORTS = [["new", "Recently saved"], ["freq", "Frequency"], ["due", "Due"], ["az", "A–Z"]];
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
    const kindCounts = { all: words.length, word: 0, pv: 0, expr: 0 };
    words.forEach((w) => { kindCounts[nbKindOf(w)]++; });
    view.innerHTML = `
      <div class="subtabs nb-only" id="nbkinds">
        ${NB_KINDS.map(([k, cn]) => `<button data-k="${k}" class="${nbKind === k ? "on" : ""}">${cn} ${kindCounts[k]}</button>`).join("")}
      </div>
      <div class="subtabs nb-only" id="nbtabs">
        <button data-f="all" class="${nbFilter === "all" ? "on" : ""}">All</button>
        <button data-f="due" class="${nbFilter === "due" ? "on" : ""}">due ${dueWords().length}</button>
        <button data-f="learning" class="${nbFilter === "learning" ? "on" : ""}">Learning</button>
        <button data-f="mastered" class="${nbFilter === "mastered" ? "on" : ""}">Mastered</button>
      </div>
      <form class="search" id="nbsearch" style="margin-bottom:10px">
        <input id="nbq" placeholder="Search your notebook, or type a new word to look it up…" value="${esc(nbQuery)}" autocomplete="off" autocapitalize="off" spellcheck="false">
        <button class="btn icon" type="button" id="pasteBtn" title="Paste from clipboard">📋</button>
        <button class="btn primary" type="submit">Look up</button>
      </form>
      <div class="sortbar nb-only" id="nbsort">
        <button class="catf ctrl-toggle" id="nbMore">Filter · sort ▾</button>
        <span class="ctrl-wrap">Sort: ${NB_SORTS.map(([k, cn]) =>
          `<button class="catf${nbSort === k ? " on" : ""}" data-s="${k}">${cn}</button>`).join("")}
          <span class="muted" style="font-size:12px;flex-basis:100%">The tag after each word is its <b>frequency</b>: core / very common / common / mid / low / rare — the earlier, the more worth learning first.</span>
        </span>
      </div>
      <div id="result"></div>
      <div id="nbcats" class="ctrl-wrap nb-only"></div>
      <span class="ctrl-wrap nb-only">${kindRuleHTML()}</span>
      <div id="nblist" class="nb-only"></div>`;
    view.querySelectorAll("#nbkinds button").forEach((b) => b.addEventListener("click", () => { nbKind = b.dataset.k; nbScene = null; renderNotebook(); }));
    view.querySelectorAll("#nbtabs button").forEach((b) => b.addEventListener("click", () => { nbFilter = b.dataset.f; renderNotebook(); }));
    // one toggle instead of three permanent rows of controls above the list
    $("#nbMore").addEventListener("click", () => {
      nbCtrlsOpen = !nbCtrlsOpen;
      view.querySelectorAll(".ctrl-wrap").forEach((n) => n.classList.toggle("open", nbCtrlsOpen));
      $("#nbMore").textContent = nbCtrlsOpen ? "Collapse ▴" : "Filter · sort ▾";
    });
    if (nbCtrlsOpen) { view.querySelectorAll(".ctrl-wrap").forEach((n) => n.classList.add("open")); $("#nbMore").textContent = "Collapse ▴"; }
    view.querySelectorAll("#nbsort [data-s]").forEach((b) => b.addEventListener("click", () => { nbSort = b.dataset.s; renderNotebook(); }));
    $("#nbsearch").addEventListener("submit", (e) => {
      e.preventDefault();
      const t = ($("#nbq") ? $("#nbq").value : nbQuery).trim();
      if (t) doLookup(t);      // same tab: saved words open their entry, new ones get looked up
    });
    $("#pasteBtn").addEventListener("click", pasteAndSave);
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
          ? `<div class="empty"><div class="big">🔍</div>No “${esc(q)}」。<div class="row" style="justify-content:center;margin-top:12px"><button class="btn primary" id="nbLookup">Look up “${esc(q)}」</button></div></div>`
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
          ? `<span class="mfreq nf">${composed ? "composed" : "not found"}</span>` : freqChip(d.freq);
        return `<div class="item" data-open="${w.id}">
          <div style="min-width:0"><div class="w serif">${esc(w.word)} ${tag} <span class="mstat m-${m.key}">${m.cn}</span></div><div class="meta">${esc(d.cn || ((d.meanings || [])[0] && d.meanings[0].definition) || composed || "")}</div></div>
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
  const normAns = (s2) => String(s2 || "").toLowerCase().replace(/[^a-z' ]/g, "").replace(/\s+/g, " ").trim();
  // Accept inflected forms — typing "going on" for "go on" is knowing the chunk,
  // not getting it wrong. Compares word-by-word through the shared de-inflector.
  function answerMatches(typed, expected, headword) {
    const t = normAns(typed);
    if (!t) return false;
    const stems = (x) => {
      const c = window.lexisStemCandidates ? window.lexisStemCandidates(x) : [];
      return new Set([x].concat(c));
    };
    for (const target of [expected, headword]) {
      const a = normAns(target).split(" "), b = t.split(" ");
      if (!a.length || a.length !== b.length) continue;
      if (a.every((wd, i) => wd === b[i] || stems(wd).has(b[i]) || stems(b[i]).has(wd))) return true;
    }
    return false;
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
          seed: ((w.srs && w.srs.reps) || 0) + session.done + 1 })
      : { mode: "recall" };
    if (enOnly()) session.drill = stripCn(session.drill);
    session.drillFor = w.id;
    return session.drill;
  }
  const DRILL_HINT_CN = {
    sense: "Which of these is it, here??",
    word: "Which word fits this sentence??",
    cloze: "Write it into the gap.",
    zh2en: "From the meaning alone, write the word.",
    dict: "Listen, then write what you hear.",
    recall: "Think first, then reveal.",
  };
  const DRILL_HINT_EN = {
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
    const os = dr.mode !== "sense" && dr.originSense && dr.originSense.confident && dr.originSense.meaning;
    const head = `<div class="rv-mode"><span class="rv-mode-t">${esc(dr.label || "")}</span>${need}</div>` +
      (os && dr.source !== "context"
        ? `<div class="rv-origin">${T.origin(esc(enOnly() ? (os.definition || os.cn || "") : (os.cn || os.definition || "")))}</div>` : "");

    const hi = (t) => esc(t).replace(new RegExp("(" + (w.word || "").split(/\s*\/\s*/)[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+") + "\\w*)", "i"), "<mark>$1</mark>");
    const blank = (extra) => `<input id="czin" class="cz-in" ${extra || ""} autocomplete="off" autocapitalize="off" spellcheck="false">`;
    const optsHTML = (list) => `<div class="rv-opts">${(list || []).map((o, i) => `<button class="rv-opt" data-opt="${i}">${esc(o)}</button>`).join("")}</div>`;
    let front;
    if (dr.mode === "sense") {
      front = (dr.sentence ? `<div class="rv-sent">${hi(dr.sentence.text)}</div>` : `<div class="hw serif">${esc(w.word)}</div>`) + optsHTML(dr.options);
    } else if (dr.mode === "word") {
      front = `<div class="rv-sent">${esc(dr.pre)}<span class="cz-gap">?</span>${esc(dr.post)}</div>
        ${dr.sentenceCn ? `<div class="muted" style="font-size:13px;margin-top:8px">${esc(dr.sentenceCn)}</div>` : ""}` + optsHTML(dr.options);
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
        ${d.cn && !dr.sentenceCn ? `<div class="cn-gloss" style="font-size:14px">${esc(d.cn)}</div>` : ""}
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
      ${d.cn ? `<div class="cn-gloss">${esc(d.cn)}</div>` : ""}
      ${(d.meanings || []).slice(0, 2).map((m) => `<div class="mean" style="text-align:left">${m.pos ? `<span class="pos">${esc(m.pos)}</span> ` : ""}${esc(m.definition)}${m.cn ? `<div class="cn">${esc(m.cn)}</div>` : ""}</div>`).join("")}
      ${full ? `<div class="ex" style="text-align:left">${hi(full)}${(dr.sentenceCn || (dr.sentence && dr.sentence.cn)) ? `<div class="tr">${esc(dr.sentenceCn || dr.sentence.cn)}</div>` : ""}</div>` : ""}`;

    const mcq = dr.mode === "sense" || dr.mode === "word";
    view.innerHTML = scopeBar + `
      <div class="progress"><i style="width:${pct}%"></i></div>
      <div class="card rev-card">
        ${head}
        ${back ? answer : front}
        ${back && session.verdict ? `<div class="verdict ${session.verdict}">${session.verdict === "ok" ? T.ok : T.no}</div>` : ""}
      </div>
      ${back ? gradeBar(w) : (mcq ? "" : `<button class="btn primary" id="flip" style="width:100%;padding:14px">${dr.mode === "recall" ? T.reveal : T.check}</button>`)}`;
    wireScope();
    const spk = $("#rspk");
    if (spk) spk.addEventListener("click", () => speak(w.word, d.audioUs));
    if (dr.mode === "dict" && !back && spk) setTimeout(() => spk.click(), 300);
    if (!back) {
      const inp = $("#czin");
      const reveal = () => {
        if (inp && dr.answer && normAns(inp.value)) session.verdict = answerMatches(inp.value, dr.answer, w.word) ? "ok" : "no";
        session.showBack = true; drawCard();
      };
      const flip = $("#flip");
      if (flip) flip.addEventListener("click", reveal);
      // on a multiple-choice card the tap IS the answer
      view.querySelectorAll("[data-opt]").forEach((b) => b.addEventListener("click", () => {
        session.verdict = String((dr.options || [])[+b.dataset.opt]) === String(dr.answer) ? "ok" : "no";
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
  function gradeBar(w) {
    const en = enOnly();
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
        window.lexisMarkDrill(rec, session.drill, g !== "again" && session.verdict !== "no");
      }
      rec.updatedAt = now(); setWords(words);
    }
    session.queue.shift();
    if (g === "again" && rec) session.queue.push(rec); // re-show at end
    else bumpRevStats();
    session.done += 1; session.showBack = false; session.verdict = null;
    session.drill = null; session.drillFor = null;
    drawCard();
  }

  // ---- DISCOVER (offline study lists from vocab.js) ----
  let dTab = "words", dCursor = { words: 0, phrases: 0, pv: 0 };
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
  function levelWindow(poolLen) {
    const a = getAssess();
    const est = a.reading ? readingEstimate(a.reading) : null;
    const v = est ? est.estVocab : a.estVocab || 0;
    if (!v) return { mode: "none", estVocab: 0 };
    const startIdx = Math.max(0, Math.round(v - 2500));
    if (poolLen - startIdx < 250) return { mode: "beyond", estVocab: v, startIdx: 0, left: Math.max(0, poolLen - startIdx) };
    return { mode: "above", estVocab: v, startIdx, left: poolLen - startIdx };
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
    return `<details class="kind-rule"><summary>How are these decided??</summary>
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
      s2 += `<br><b>Not calibrated yet</b> — this list starts at the very top of the 8,000-word frequency pool, which is why it looks easy. One <button class="linklike" id="dCal">reading assessment</button> (~2 min; a passage judges 60–100 words at once) sets your level and Discover jumps to it — no ticking words one by one.`;
    else if (lvl.mode === "beyond")
      s2 += `<br>Your estimated vocabulary  <b>${lvl.estVocab.toLocaleString()}</b> <b>already exceeds this 8k pool</b>, so it now leads with <b>rarest first</b>. Your real headroom is in  <b>Phrases</b> and <b>Idioms</b>.`;
    else if (lvl.mode === "above")
      s2 += `<br>Skipping everything below your level; starting around <b>≈${lvl.estVocab.toLocaleString()}</b> — ${lvl.left.toLocaleString()} left.`;
    if (w) s2 += `<br>and leads with ${w.map((k) => FREQ_CN[k] || k).join(" › ")}」——your weakest bands in the assessment.`;
    return s2;
  }

  function renderDiscover() {
    view.innerHTML = `
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
    if ($("#dCal")) $("#dCal").addEventListener("click", () => renderReadingPick());
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
        <span class="term serif">${esc(term)}</span>
        ${scene ? `<span class="g">${esc(scene)}</span>` : ""}
        <span class="act">
          <button class="btn" data-act="learn">Learn</button>
          <button class="btn sage" data-act="master">Mastered</button>
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
    const incomplete = incompleteWords().length;
    const ck = chunkState();
    view.innerHTML = `
      <div class="card">
        <h2 class="sec">Overview</h2>
        <div class="row" style="justify-content:space-between">
          <div><div class="stat">${words.length}</div><div class="muted">words</div></div>
          <div><div class="stat">${dueWords().length}</div><div class="muted">due</div></div>
          <div><div class="stat">${mastered}</div><div class="muted">Mastered</div></div>
        </div>
      </div>
      <div class="card">
        <h2 class="sec">Vocabulary estimate</h2>
        <div class="stat">${(rEst ? rEst.estVocab : knownN).toLocaleString()}</div>
        <div class="muted">${rEst
          ? `Reading assessment ·  ${(a.reading.passages || []).length}  read · confidence  ${({ high: "high", mid: "medium", low: "low" })[rEst.confidence]}(goal: 15,000 word families)`
          : "marked known + notebook (goal: 15,000 word families) · not assessed yet"}</div>
        <div class="meter"><i style="width:${Math.min(100, ((rEst ? rEst.estVocab : knownN) / 15000) * 100)}%"></i></div>
        <div class="row" style="margin-top:8px">
          <button class="btn primary" id="readAssessBtn">📖 Reading assessment${rEst ? "(continue)" : ""}</button>
          <button class="btn" id="assessBtn">Tick word by word</button>
        </div>
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
        <label class="set">Show examples <input type="checkbox" id="setEx" ${s.showExamples ? "checked" : ""}></label>
        <label class="set">Auto top-up (examples / gloss / frequency) <input type="checkbox" id="setAuto" ${s.autoEnrich !== false ? "checked" : ""}></label>
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
      <p class="muted" style="text-align:center;font-size:12px">Lexis H5 v1.66.0 · Data lives only in this browser</p>`;

    // settings you actually touch stay visible; sync/data/maintenance fold away
    $("#advToggle").addEventListener("click", () => {
      const open = $("#adv").classList.toggle("open");
      $("#advToggle").textContent = open ? "⚙️ Data & sync ▴" : "⚙️ Data & sync ▾";
    });
    $("#setCn").addEventListener("change", (e) => { s.chinese = e.target.checked; setSettings(s); });
    view.querySelectorAll("[data-gloss]").forEach((b) => b.addEventListener("click", () => {
      const s3 = getSettings(); s3.glossLang = b.dataset.gloss; setSettings(s3);
      if (session) { session.drill = null; session.drillFor = null; }
      renderMe();
    }));
    $("#setEx").addEventListener("change", (e) => { s.showExamples = e.target.checked; setSettings(s); });
    $("#setAuto").addEventListener("change", (e) => { s.autoEnrich = e.target.checked; setSettings(s); });
    $("#setLimit").addEventListener("change", (e) => { s.dailyNewLimit = +e.target.value || 15; setSettings(s); });
    $("#setGoal").addEventListener("change", (e) => { s.dailyGoal = +e.target.value || 20; setSettings(s); });
    $("#assessBtn").addEventListener("click", startAssess);
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
      if (btn) btn.textContent = "Pulling……";
      let id = (s.gistId || "").trim();
      if (id) {
        const r = await fetch("https://api.github.com/gists/" + id, { headers: hdr });
        if (r.ok) {
          const g = await r.json(); const f = g.files && g.files[FILE];
          if (f && f.content) { try { const d = JSON.parse(f.content); mergeRemote(Array.isArray(d) ? d : d.words, Array.isArray(d) ? {} : d.deleted); if (!Array.isArray(d)) mergeRemoteAssess(d.assess); } catch (e) {} }
        } else if (r.status === 404) { id = ""; }
        else if (r.status === 401) throw new Error("invalid token");
      }
      if (btn) btn.textContent = "Pushing……";
      const body = JSON.stringify({ description: "Lexis vocab sync", public: false, files: { [FILE]: { content: JSON.stringify({ words: getWords(), assess: assessPayload(), deleted: getTombs(), syncedAt: now() }) } } });
      const resp = id
        ? await fetch("https://api.github.com/gists/" + id, { method: "PATCH", headers: hdr, body })
        : await fetch("https://api.github.com/gists", { method: "POST", headers: hdr, body });
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const g = await resp.json();
      if (g.id && g.id !== s.gistId) { s.gistId = g.id; setSettings(s); }
      refreshBadge();
      if (!opts.silent) { toast(`Synced ✓ ${getWords().length} words`); go("me"); }
      else if (changed && (current === "notebook" || current === "review" || current === "me")) go(current); // reflect pulled words
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
    view.innerHTML = `
      <div class="row" style="margin-bottom:12px"><button class="btn" id="back">← Back</button></div>
      <div class="card">
        <h2 class="sec">Reading assessment</h2>
        <p class="muted" style="font-size:13px;margin:0">Read a short passage and <b>tap only the words you don't know</b>。Everything you leave counts as known — about 100 judgements per passage, far faster than ticking one at a time. Two or more passages gives a sharper number.</p>
        ${est ? `<div class="row" style="margin-top:10px"><span class="stat">${est.estVocab.toLocaleString()}</span><span class="muted">current estimate · sampled  ${est.sampled}  · confidence  ${({ high: "high", mid: "medium", low: "low" })[est.confidence]}</span></div>` : ""}
      </div>
      ${passages.map((p) => `<div class="item" data-pass="${esc(p.id)}">
        <div style="min-width:0"><div class="w serif">${esc(p.title)}</div><div class="meta">${esc(p.cn)} · ~${p.text.split(/\s+/).length} words</div></div>
        <span class="st chip">${done.has(p.id) ? "read · read again" : "Start"}</span></div>`).join("")}
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
    $("#more").addEventListener("click", renderReadingPick);
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
  function chunkSample() {
    const pick = (arr, n) => {
      if (!arr.length) return [];
      const step = Math.max(1, Math.floor(arr.length / n));
      const out = [];
      for (let i = 0; i < arr.length && out.length < n; i += step) out.push(arr[i]);
      return out;
    };
    const pl = (window.LEXIS_PHRASE_LIST || []).map((x, i) => ({ term: x.term, src: "phrase", pos: i, ex: x.example }));
    const pv = (window.LEXIS_PHAVE_LIST || []).map((x, i) => ({ term: x.term, src: "pv", pos: i, ex: x.example }));
    const id = Object.keys(window.LEXIS_IDIOM_SCENE || {}).map((t, i) => ({ term: t, src: "idiom", pos: i, ex: "" }));
    return pick(pl, 24).concat(pick(pv, 14), pick(id, 12));
  }
  function chunkState() { return getAssess().chunk || null; }
  const CHUNK_SRC_CN = { phrase: "Fixed expressions", pv: "Phrasal verbs", idiom: "Idioms" };

  function renderChunkAssess() {
    const items = chunkSample();
    const marked = new Set(((chunkState() || {}).unknown) || []);
    view.innerHTML = `
      <div class="row" style="margin-bottom:12px"><button class="btn" id="back">← Back</button></div>
      <div class="card">
        <h2 class="sec">Phrase & idiom check</h2>
        <p class="muted" style="font-size:13px;margin:0">${items.length} chunks <b>sampled evenly</b> across the frequency range. <b>Tap the ones you couldn't produce</b>——Recognising it but not reaching for it when you speak counts as couldn't. That gap is exactly "I know every word and still can't say it".</p>
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
    $("#ckDone").addEventListener("click", () => {
      const a = getAssess();
      const bySrc = {};
      ["phrase", "pv", "idiom"].forEach((src) => {
        const g = items.filter((x) => x.src === src);
        const bad = g.filter((x) => marked.has(x.term));
        // frontier = the most common thing you still can't produce; everything
        // easier than that is a waste of your time to be shown.
        const frontier = bad.length ? Math.min.apply(null, bad.map((x) => x.pos)) : (g.length ? g[g.length - 1].pos : 0);
        bySrc[src] = { seen: g.length, unknown: bad.length, frontier, pct: g.length ? 1 - bad.length / g.length : 1 };
      });
      a.chunk = { at: now(), unknown: Array.from(marked), bySrc };
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
        <div class="muted" style="font-size:12px;margin-top:8px">Discover 's three chunk tabs now <b>skip what you can already use</b>,and start where you couldn't produce it.</div></div>
      ${unk.length ? `<div class="card"><h2 class="sec">Couldn't produce ·  ${unk.length}</h2>
        <div class="row">${unk.slice(0, 60).map((t) => `<span class="chip" data-look="${esc(t)}">${esc(t)}</span>`).join("")}</div>
        <div class="row" style="margin-top:10px"><button class="btn sage" id="ckAdd">Add all to notebook</button></div></div>` : ""}
      <div class="row"><button class="btn" id="ckAgain" style="flex:1">Redo the check</button><button class="btn" id="ckDisc" style="flex:1">Study these chunks →</button></div>`;
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
