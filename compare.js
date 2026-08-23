/* Lexis — the contrast prompt. ONE implementation, four surfaces.
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
    "For EACH word give: meaning_en (one clause, what it actually denotes), meaning_cn, " +
    "vibe_cn (语感/使用场合, at most 20 Chinese characters: register, connotation, who does it to what), " +
    "example (ONE natural sentence that the OTHER words on this list could NOT be substituted into), " +
    "example_cn, and collocs (3 typical collocations).\n" +
    "Then give axis_cn: the single distinction that separates these words, at most 40 Chinese characters — " +
    "name the dividing line (what is given / who acts / transitive or not / abstract or physical), do not restate the meanings.\n" +
    "Then pairs: for each genuinely confusable pair, {\"a\":\"…\",\"b\":\"…\",\"note_cn\":\"swapping them would change …\"}.\n" +
    'Return JSON exactly: {"axis_cn":"…","words":[{"word":"…","meaning_en":"…","meaning_cn":"…","vibe_cn":"…","example":"…","example_cn":"…","collocs":["…"]}],"pairs":[{"a":"…","b":"…","note_cn":"…"}]}';
  return { sys: sys, user: user, terms: list };
  }
  // the cache key for one comparison: the same words in any order are one question
  function lexisCompareKey(terms) {
  return (terms || []).map(function (t) { return String(t || "").toLowerCase().trim(); })
    .filter(Boolean).sort().join("|");
  }


  g.lexisComparePrompt = lexisComparePrompt;
  g.lexisCompareKey = lexisCompareKey;
})(typeof globalThis !== "undefined" ? globalThis : this);
