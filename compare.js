/* Lexis — the shared PROMPTS. ONE implementation, four surfaces.
 *
 * Two of them live here: the contrast ("what is the difference between these
 * words") and the spelling story ("why is it spelled like this").
 *
 * A classic script that assigns to globalThis, exactly like data/examples.js:
 * the module service worker `import`s it for the side effect, the options page
 * and the H5 pull it in with a <script>, and the H5 keeps a byte-identical
 * copy. A second copy of a PROMPT is how the phone and the Mac start giving
 * different answers to "what is the difference between these three words".
 */
(function (g) {
  // ---------------------------------------------------------------------------
  // CONTRAST — "what is the difference between flourish, nurture and nourish?"
  //
  // The synonym list a dictionary gives you answers "which words are close".
  // That is not the question you have when you are stuck: you know roughly what
  // each one means and cannot choose. What settles it is ONE distinction (what is
  // given? who acts? does it take an object?) plus a sentence per word that the
  // others could not be substituted into.
  //
  // This is the prompt, and it lives here so the extension and the phone ask the
  // same question of the same model — a second copy is how the two surfaces start
  // giving different answers for the same three words.
  //
  // It is deliberately strict about two things:
  //   · every example must be one the OTHER words on the list could not take —
  //     an example that fits all three teaches nothing;
  //   · `axis_cn` must name the dividing line, not restate the glosses.
  function lexisComparePrompt(terms, context) {
  var list = (terms || []).map(function (t) { return String(t || "").trim(); }).filter(Boolean).slice(0, 5);
  var sys = "You are a precise bilingual lexicographer for an advanced Chinese learner of English. " +
    "You explain how near-synonyms and confusable words DIFFER. Never invent usage; if two words really are " +
    "interchangeable in a context, say so. Return ONLY strict minified JSON, no markdown, no prose outside JSON.";
  var user =
    "Contrast these English words: " + list.join(", ") + "\n" +
    (context ? "The learner met one of them here: \"" + String(context).slice(0, 300) + "\"\n" : "") +
    "The learner already knows roughly what each means and cannot choose between them.\n" +
    "Cover EXACTLY these " + list.length + " words — no others, and leave none out.\n" +
    "Answer in this order, and never repeat one part inside another:\n" +
    "1. shared_cn — what all of them have in common, ONE COMPLETE clause of about 15–30 Chinese " +
    "characters. It must end as a finished sentence: if it will not fit, say less — never stop " +
    "mid-clause on 但 / 而 / 并且. Say it ONCE here; it must not reappear under the individual words.\n" +
    "2. axis_cn — the single distinction that separates them, at most 40 Chinese characters. NAME THE " +
    "DIVIDING LINE: what is given, who acts, transitive or not, physical or abstract. " +
    "Good: 「给的是养分 / 是照料 / 还是把人带大」 — it says which word sits where. " +
    "Bad: 「描述这些词的区别:用法、使用者、意象」, which describes the task instead of answering it. " +
    "Also bad: 「提供者、接受者和行动类型」, which lists the dimensions without saying which word is which. " +
    "Never restate these instructions.\n" +
    "3. For EACH word: diff_cn (what THIS word does that the others do not, at most 25 Chinese characters — " +
    "a difference, never the shared meaning), meaning_en (one clause, what it denotes), " +
    "meaning_cn (a FAITHFUL translation of meaning_en and nothing else — not a comment, not a list of topics), " +
    "example (ONE natural English sentence the other words could NOT be substituted into; the English " +
    "sentence is required, never return only its translation), example_cn (that sentence in Chinese), " +
    "collocs (3 typical collocations).\n" +
    "4. pairs — one entry for EVERY pair of these words, {\"a\",\"b\",\"note_cn\"}, one clause on what swapping " +
    "a for b would change. Do not leave it empty.\n" +
    'Return JSON exactly: {"shared_cn":"…","axis_cn":"…","words":[{"word":"…","diff_cn":"…","meaning_en":"…","meaning_cn":"…","example":"…","example_cn":"…","collocs":["…"]}],"pairs":[{"a":"…","b":"…","note_cn":"…"}]}';
  return { sys: sys, user: user, terms: list };
  }
  // A HALF SENTENCE IS NOT AN ANSWER. Asked for "at most 30 Chinese characters",
// a model will happily stop dead on a conjunction — 「这三个词都涉及对人或动物的
// 照顾或提供保护,但」 — and the reader is left waiting for the half that says
// what actually differs. Trailing connectors (and the comma before them) come
// off, so the line at least ends where it stops.
function lexisCmpClean(text) {
  var t = String(text == null ? "" : text).trim();
  if (!t) return "";
  var prev = null;
  while (prev !== t) {
    prev = t;
    t = t.replace(/[,、,;;:：]?\s*(但是|但|而是|而|并且|并|不过|然而|以及|还有|同时|和|与|且|however|but|and)\s*[。.]?$/i, "").trim();
    t = t.replace(/[,、,;;:：]+$/, "").trim();
  }
  return t;
}
// WHY IS IT SPELLED LIKE THIS?
//
// The word-parts card answers "what pieces is it made of", which is not the
// question. The question is why THIS string of letters means THIS thing, and
// the answer that sticks is usually the origin: torment / torture / distort are
// all Latin torquere, "to twist" — once you see that, the spelling stops being
// arbitrary and the three words stop being interchangeable.
//
// A dictionary's etymology paragraph is not it either: it is written for
// reference, not for remembering. This asks for the same fact shaped as a hook,
// plus the words that share the root — because knowing one root pays for
// several words at once, which is the whole reason to learn a root at all.
function lexisSpellPrompt(term, senseHint) {
  var w = String(term || "").trim();
  var sys = "You are an etymologist writing for a Chinese learner of English who wants to REMEMBER a spelling. " +
    "Never invent an origin: if it is unknown or disputed, say so. Prefer the plain story over the technical one. " +
    "Return ONLY strict minified JSON, no markdown, no prose outside JSON.";
  var user =
    'Word: "' + w + '"\n' +
    (senseHint ? "It is being learned in this sense: " + String(senseHint).slice(0, 160) + "\n" : "") +
    "Explain why this word is spelled the way it is, so the spelling stops feeling arbitrary.\n" +
    "origin_cn: where the spelling comes from, ONE complete clause in Chinese — the source language, the " +
    "original form, and what it literally meant. If the origin is unknown, say so plainly instead of guessing.\n" +
    "hook_cn: a memory hook of at most 30 Chinese characters that ties that literal picture to the meaning the " +
    "learner meets today. Concrete, not a definition. Example for torment: 「拧」——torquere,拧得人受不了。\n" +
    "parts: the pieces of the spelling worth knowing, [{\"piece\":\"…\",\"meaning_cn\":\"…\"}]. Only real " +
    "morphemes with real meanings — an empty list if the word is not built from parts. Never split a word just " +
    "to fill this in (torment is NOT ment + ment).\n" +
    "kin: 2–4 English words that share the same root and are worth knowing, [{\"word\":\"…\",\"cn\":\"…\"}]. " +
    "Words the learner is likely to meet, not obscure ones. Empty if there are none.\n" +
    'Return JSON exactly: {"origin_cn":"…","hook_cn":"…","parts":[{"piece":"…","meaning_cn":"…"}],"kin":[{"word":"…","cn":"…"}]}';
  return { sys: sys, user: user, term: w };
}
// the cache key for one comparison: the same words in any order are one question
  function lexisCompareKey(terms) {
  return (terms || []).map(function (t) { return String(t || "").toLowerCase().trim(); })
    .filter(Boolean).sort().join("|");
  }


  g.lexisComparePrompt = lexisComparePrompt;
  g.lexisCompareKey = lexisCompareKey;
  g.lexisCmpClean = lexisCmpClean;
  g.lexisSpellPrompt = lexisSpellPrompt;
})(typeof globalThis !== "undefined" ? globalThis : this);
