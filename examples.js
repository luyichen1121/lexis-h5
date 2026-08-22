// Shared example-sentence quality gate.
//
// Tatoeba's `sort=relevance` puts the SHORTEST exact match first, so taking the
// top three gave "She vanished." / "Tom vanished." / "They vanished." — three
// spellings of the same nothing — while "He vanished without a trace." and
// "The bird vanished from view." sat unread further down the same response.
// An example earns its place by showing how the word COMBINES: what follows it,
// what it takes as an object, which preposition it lives with. A bare
// subject+verb+period shows none of that, and three of them in a row look like
// the feature is broken.
//
// ONE copy, four surfaces: written as a classic script that assigns to
// globalThis, so the module service worker can `import` it for its side effect,
// a page can load it with <script>, and the H5 keeps a byte-identical copy.
// (See CLAUDE.md §0 — a second copy of this is how the two stemmers drifted.)
(function (g) {
  "use strict";

  var STOP = new Set(("a an the of to in on at for with and or but is are was were be been being am " +
    "it its this that these those he she they you i we him her them his their my your our as by from " +
    "into over about not no do does did have has had will would can could should may might must than " +
    "then there here so if when while what which who there's it's").split(/\s+/));

  // Tatoeba's filler cast. "Tom" alone heads a sixth of the whole corpus; a
  // sentence built on one carries no information the learner can use.
  var PLACEHOLDER = /^(tom|mary|ken|bob|john|jim|nancy|alice|bill|mike|jane|sam|emily|kate|taro|yumi|jack|ann|anne|betty|fred|george|nick|paul|susan|dan|linda|jimmy|marie|beth)$/;
  var PRON = /^(i|you|he|she|it|we|they|him|her|them|his|hers|theirs|its|my|your|our|myself|yourself|himself|herself|itself|ourselves|themselves)$/;
  var PREP = new Set(("about above across after against along among around as at before behind below " +
    "beneath beside besides between beyond by down during except for from in inside into like near of " +
    "off on onto out outside over past since through throughout to toward towards under underneath " +
    "until up upon with within without back away over off").split(/\s+/));

  function toks(s) {
    return String(s || "").toLowerCase()
      .replace(/[^a-z0-9'’\- ]+/g, " ")
      .split(/\s+/).filter(Boolean);
  }

  // Where the term's tokens start inside the sentence, or -1.
  function termAt(t, tt) {
    if (!tt.length) return -1;
    for (var i = 0; i + tt.length <= t.length; i++) {
      var ok = true;
      for (var k = 0; k < tt.length; k++) if (t[i + k] !== tt[k]) { ok = false; break; }
      if (ok) return i;
    }
    return -1;
  }

  // > 0 usable, higher is better; < 0 means "teaches nothing", drop it.
  function lexisExampleScore(text, term) {
    var raw = String(text || "").trim();
    if (!raw) return -1;
    var t = toks(raw), n = t.length;
    if (!n) return -1;
    var tt = toks(term);
    // Hard floors. Three words cannot show a collocation, and a sentence that is
    // half headword is a dictionary stub, not a use.
    if (n < 4) return -1;
    if (n > 28) return -1;
    if (tt.length && tt.length / n >= 0.55) return -1;

    var s = 0;
    var inTerm = new Set(tt);
    var content = 0;
    for (var i = 0; i < n; i++) if (!STOP.has(t[i]) && !inTerm.has(t[i])) content++;
    s += Math.min(content, 5);

    // Length shape: long enough to carry a clause, short enough to hold in mind.
    if (n >= 7 && n <= 22) s += 3;
    else if (n >= 5) s += 1.5;
    else s += 0.5;
    if (n > 26) s -= 1.5;

    // What FOLLOWS the word is the part a dictionary gloss can't give you.
    var at = termAt(t, tt);
    if (at >= 0) {
      var after = t[at + tt.length];
      if (!after) s -= 2;                   // "She vanished." — full stop, no information
      else if (PREP.has(after)) s += 3;     // "vanished without a trace", "vanished from view"
      else s += 1.5;
    } else s -= 3;                          // the term isn't even in it as saved

    for (var j = 0; j < n; j++) {
      if (PLACEHOLDER.test(t[j])) { s -= 2.5; break; }
    }
    if (PRON.test(t[0]) && n <= 6) s -= 1.5;
    // "The function f vanishes on the set X." — symbolic, not English usage.
    var letters = 0;
    for (var m = 0; m < n; m++) if (t[m].length === 1 && t[m] !== "a" && t[m] !== "i") letters++;
    s -= Math.min(letters * 3, 6);
    if (/[,;:]/.test(raw)) s += 0.8;
    return s;
  }

  // "She vanished." / "Tom vanished." / "They vanished." are one sentence wearing
  // three subjects. Collapse the interchangeable parts so only one survives.
  function lexisExampleSkeleton(text, term) {
    var t = toks(text), tt = toks(term), out = [], i = 0;
    while (i < t.length) {
      if (tt.length && termAt(t.slice(i, i + tt.length), tt) === 0) { out.push("§"); i += tt.length; continue; }
      var w = t[i++];
      if (w === "the" || w === "a" || w === "an") continue;
      out.push(PRON.test(w) || PLACEHOLDER.test(w) ? "•" : w);
    }
    return out.join(" ");
  }

  // list: [{text, translation}] or ["..."]. opts: {max, context}
  // `context` is the sentence YOU captured — an example about what you actually
  // met outranks an equally good one about something else. It is a tiebreaker,
  // deliberately too small to lift a stub back over a real sentence.
  function lexisPickExamples(list, term, opts) {
    opts = opts || {};
    var max = opts.max || 3;
    var ctx = new Set(toks(opts.context || "").filter(function (w) { return !STOP.has(w); }));
    var seen = new Set(), scored = [];
    (list || []).forEach(function (raw, i) {
      var ex = (typeof raw === "string") ? { text: raw, translation: "" } : (raw || {});
      var text = String(ex.text || "").trim();
      if (!text) return;
      var key = text.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      // an example fetched for a different form of the word is judged against
      // THAT form — otherwise every base-word fallback reads as "term missing"
      var s = lexisExampleScore(text, ex.from || term);
      if (s < 0) return;
      if (ctx.size) {
        var tt = toks(text), hit = 0, uniq = new Set(tt);
        uniq.forEach(function (w) { if (ctx.has(w)) hit++; });
        s += uniq.size ? 2.5 * (hit / Math.sqrt(uniq.size)) : 0;
      }
      scored.push({ ex: ex, i: i, s: s });
    });
    scored.sort(function (a, b) { return (b.s - a.s) || (a.i - b.i); });
    var out = [], skel = new Set();
    for (var k = 0; k < scored.length && out.length < max; k++) {
      var sk = lexisExampleSkeleton(scored[k].ex.text, scored[k].ex.from || term);
      if (sk && skel.has(sk)) continue;
      skel.add(sk);
      out.push(scored[k].ex);
    }
    return out;
  }

  g.lexisExampleScore = lexisExampleScore;
  g.lexisExampleSkeleton = lexisExampleSkeleton;
  g.lexisPickExamples = lexisPickExamples;
})(typeof globalThis !== "undefined" ? globalThis : self);
