/* Lexis — curated high-value vocabulary seed.
 * Powers the self-test level estimate, the "recommended to learn" list, and the
 * on-page worth-learning highlighter. Tiers ≈ frequency/difficulty (2 common →
 * 6 sophisticated). Shared by app.js and content.js (loaded as a plain global).
 */
var LEXIS_SEED = {
  words: {
    2: ["reluctant", "thorough", "adequate", "deliberate", "straightforward", "genuine", "reliable", "emphasize", "significant", "abandon", "crucial", "notable", "distinct", "sufficient", "substantial", "convey", "endure", "foster", "hinder", "reinforce", "underlying", "widespread", "profound", "subtle", "vivid"],
    3: ["feasible", "coherent", "inevitable", "comprehensive", "versatile", "prevalent", "tangible", "concise", "robust", "scrutiny", "leverage", "mitigate", "advocate", "compelling", "diligent", "articulate", "consolidate", "delegate", "discern", "envision", "facilitate", "gauge", "intricate", "streamline", "underscore", "coherence", "resonate"],
    4: ["ambiguous", "meticulous", "resilient", "arbitrary", "plausible", "redundant", "conducive", "cumbersome", "holistic", "salient", "viable", "implicit", "intrinsic", "paradigm", "proponent", "threshold", "trajectory", "incremental", "empirical", "nuance", "aggregate", "byproduct", "contingent", "delineate", "extrapolate", "granular", "impetus", "juncture", "latent", "nominal", "preemptive", "quantify", "systemic", "unprecedented"],
    5: ["ubiquitous", "cognizant", "ostensible", "tenuous", "idiosyncratic", "juxtapose", "preclude", "proliferate", "succinct", "tangential", "venerable", "voracious", "astute", "cursory", "dearth", "eloquent", "exacerbate", "fastidious", "candor", "prudent", "capricious", "circumspect", "convoluted", "disparate", "esoteric", "extol", "germane", "innocuous", "nebulous", "ostentatious", "pervasive", "quintessential", "reticent", "spurious"],
    6: ["perfunctory", "sanguine", "quixotic", "laconic", "obfuscate", "recalcitrant", "sycophant", "pernicious", "insidious", "ineffable", "mercurial", "phlegmatic", "equivocate", "perspicacious", "inchoate", "sanctimonious", "serendipity", "abstruse", "cacophony", "denouement", "ebullient", "grandiloquent", "iconoclast", "inexorable", "magnanimous", "obstreperous", "pusillanimous", "recondite", "sesquipedalian", "taciturn", "truculent", "vicissitude"],
  },
  idioms: {
    3: ["break the ice", "on the same page", "cut corners", "the bottom line", "in the long run", "get the ball rolling", "back to the drawing board", "on the fly", "ballpark figure", "touch base", "the big picture", "hit the ground running"],
    4: ["on the fence", "the elephant in the room", "move the needle", "low-hanging fruit", "think outside the box", "raise the bar", "a double-edged sword", "food for thought", "a blessing in disguise", "the best of both worlds", "keep an eye on", "under the radar", "ahead of the curve", "on the back burner"],
    5: ["bite the bullet", "the tip of the iceberg", "play devil's advocate", "go out on a limb", "take with a grain of salt", "cut to the chase", "the ball is in your court", "a slippery slope", "read between the lines", "jump on the bandwagon", "the lion's share", "par for the course"],
    6: ["a wild goose chase", "the eleventh hour", "burn the midnight oil", "throw in the towel", "steal someone's thunder", "paint oneself into a corner", "a storm in a teacup", "grasp at straws", "a fish out of water", "the writing on the wall", "beat around the bush"],
  },
};

// Curated common collocations / phrasal patterns for the "Phrases" study list —
// distinct from full idioms (LEXIS_SEED.idioms): these are everyday verb/noun
// pairings (e.g. "roll out", "invest in") rather than figurative fixed expressions.
// Tiers follow the same 3(common)→6(sophisticated) ladder as LEXIS_SEED, and each
// entry carries a LEXIS_SCENE_CN key so Discover can group it by usage scene.
var LEXIS_PHRASE_SEED = {
  3: ["log out", "back up", "follow up on", "kick off", "carry out", "draw a conclusion", "work out", "eat well", "pay off", "save up", "abide by", "comply with", "come to life", "set the tone", "get in touch", "catch up with", "weigh the odds", "take a chance"],
  4: ["roll out", "scale up", "streamline operations", "delegate tasks", "test a hypothesis", "cite evidence", "cut back on", "keep fit", "invest in", "cash in on", "hold accountable", "enact legislation", "draw inspiration from", "pay homage to", "clear the air", "see eye to eye", "hedge your bets", "brace for impact"],
  5: ["future-proof", "phase out", "drive consensus", "set a precedent", "extrapolate from data", "corroborate findings", "curb cravings", "taper off", "hedge against", "write off", "uphold the law", "contest a ruling", "evoke emotion", "strike a chord", "build rapport", "break the silence", "mitigate the risk", "tip the scales"],
};
var LEXIS_PHRASE_SCENE = {
  "log out": "tech", "back up": "tech", "roll out": "tech", "scale up": "tech", "future-proof": "tech", "phase out": "tech",
  "follow up on": "biz", "kick off": "biz", "streamline operations": "biz", "delegate tasks": "biz", "drive consensus": "biz", "set a precedent": "biz",
  "carry out": "sci", "draw a conclusion": "sci", "test a hypothesis": "sci", "cite evidence": "sci", "extrapolate from data": "sci", "corroborate findings": "sci",
  "work out": "health", "eat well": "health", "cut back on": "health", "keep fit": "health", "curb cravings": "health", "taper off": "health",
  "pay off": "fin", "save up": "fin", "invest in": "fin", "cash in on": "fin", "hedge against": "fin", "write off": "fin",
  "abide by": "law", "comply with": "law", "hold accountable": "law", "enact legislation": "law", "uphold the law": "law", "contest a ruling": "law",
  "come to life": "arts", "set the tone": "arts", "draw inspiration from": "arts", "pay homage to": "arts", "evoke emotion": "arts", "strike a chord": "arts",
  "get in touch": "comm", "catch up with": "comm", "clear the air": "comm", "see eye to eye": "comm", "build rapport": "comm", "break the silence": "comm",
  "weigh the odds": "risk", "take a chance": "risk", "hedge your bets": "risk", "brace for impact": "risk", "mitigate the risk": "risk", "tip the scales": "risk",
};
// ---- Structural type of a multiword expression --------------------------
// For the PHRASE List, a TOPICAL scene ("商业·职场") is meaningless — "have to",
// "such as" and "go on" aren't about a subject. What actually helps the
// "I can read it but can't say it" gap is the *shape* of the chunk, because each
// shape is produced differently. Five buckets, checked in this order.
// ONE taxonomy, two levels, used by Discover, the notebook, the study cards and
// the review scope — so a term carries the same label everywhere it appears.
//   LEVEL 1 (the tabs):   单词 · 短语动词 · 固定表达
//   LEVEL 2 (the chips inside 固定表达): 习语 · 语法结构 · 连接·语篇 · 介词短语 · 固定搭配
// Rules are checked in a fixed order and the FIRST match wins, so every term
// lands in exactly one bucket — no item can appear under two labels.
var LEXIS_KIND_CN = { word: "Words", pv: "Phrasal verbs", expr: "Fixed expressions" };
var LEXIS_PTYPE_CN = { pv: "Phrasal verb", idiom: "Idiom",
  aux: "Grammar frame", disc: "Discourse", prep: "Prepositional", collo: "Collocation",
};
var LEXIS_PTYPE_RULE = [
  ["idiom", "the whole thing is figurative — the parts don't add up to it (a hand-curated list decides)", "break the ice · beat around the bush"],
  ["pv", "verb + particle, and the whole doesn't mean what the parts say", "pick up · keep up · come up with"],
  ["aux", "a grammar frame — a sentence pattern, not a vocabulary item", "have to · there is / are · going to"],
  ["disc", "a marker linking what comes before and after", "as well as · such as · rather than"],
  ["prep", "a set phrase headed by a preposition", "in terms of · on behalf of"],
  ["collo", "the rest — words that simply go together", "make a decision · heavy rain"],
];
var _PV_PARTICLES = new Set("up down out in on off away back over through along across around about after by for into upon with without together apart".split(" "));
var _PREP_HEADS = new Set("at in on by for with from of under over above below within without during before after against among between beyond behind beside toward towards through across around into onto out off up down".split(" "));
var _DISC_HEADS = new Set("as than that so such rather whether either neither nor let no not only even if unless while whereas therefore however moreover".split(" "));
var _AUX_RE = /^(?:there\s+(?:is|are|was|were)|it\s+(?:is|was)\b)|\b(?:have|has|had|is|are|was|were|be|been|going|used|ought|about|supposed|likely|able|due|bound)\s+to\b/;
// LEVEL 2. Shape is checked before idiomaticity, so every verb+particle lands in
// 短语动词 and none of them leak into 固定表达 — that split was the confusing part.
function lexisPhraseType(term) {
  var t = String(term || "").toLowerCase().trim();
  if (!t || t.indexOf(" ") < 0) return null;
  var w = t.split(/\s+/).filter(function (x) { return x !== "/"; });
  // 1. a curated idiom is an idiom, full stop. The list is hand-made and none of
  //    its entries are in the phrasal-verb pools, so this can safely win —
  //    without it "beat around the bush" gets filed as a phrasal verb.
  if (typeof LEXIS_IDIOM_SCENE !== "undefined" && LEXIS_IDIOM_SCENE[t]) return "idiom";
  // 2. verb + particle. The head must actually be a verb slot: "in touch with"
  //    starts with a preposition and is NOT a phrasal verb even though "with"
  //    is a particle.
  if (!_PREP_HEADS.has(w[0]) && !_DISC_HEADS.has(w[0]) && !/^(a|an|the|one's|sb|sth)$/.test(w[0]) && !_AUX_RE.test(t)) {
    for (var i = 1; i < Math.min(w.length, 4); i++) if (_PV_PARTICLES.has(w[i])) return "pv";
  }
  // 3. grammar frame, 4. discourse marker, 5. preposition-headed, 6. plain collocation
  if (_AUX_RE.test(t)) return "aux";
  if (_DISC_HEADS.has(w[0]) || (w.length > 1 && _DISC_HEADS.has(w[1]) && w[0] !== "go")) return "disc";
  if (_PREP_HEADS.has(w[0])) return "prep";
  return "collo";
}
// LEVEL 1 — which tab a term belongs to, on EVERY surface.
function lexisKindOf(term) {
  var t = String(term || "").toLowerCase().replace(/\s+/g, " ").trim();
  if (!t || t.indexOf(" ") < 0) return "word";
  return lexisPhraseType(t) === "pv" ? "pv" : "expr";
}

// ---- The PHaVE List (Garnier & Schmitt 2015) ----------------------------
// The 150 most frequent English phrasal verbs, each with only the senses that
// actually account for its use, the % of occurrences that sense covers, and an
// example. Phrasal verbs are the hardest chunk type for an advanced learner —
// the words are trivial, the meaning is not, and one verb can carry five
// unrelated senses. Knowing WHICH sense is worth learning is the point of this
// list. Rows: [verb, frequency rank, [{d: definition, p: % of uses, e: example}]].
// Source: Garnier, M. & Schmitt, N. (2015), "The PHaVE List: A pedagogical list
// of phrasal verbs and their most frequent meaning senses", Language Teaching
// Research — published free at norbertschmitt.co.uk. Personal-study use.
var LEXIS_PHAVE_LIST = (function () {
  var rows = [
    ["go on",1,[{d:"Happen, take place",p:64.5,e:"There is a debate going on right now between the two parties."},{d:"(+ To) Proceed to do or tackle STH after doing STH else",p:13.0,e:"Does anyone have any questions before I go on to the next chapter?"}]],
    ["pick up",2,[{d:"Get or take SB/STH from a place",p:70.5,e:"Can you pick up some food on the way home from work please?"}]],
    ["come back",3,[{d:"Return to a place or a conversation topic",p:96.5,e:"She came back to the kitchen with a bottle of fancy wine."}]],
    ["come up",4,[{d:"(+ with) Bring forth or produce",p:34.0,e:"She instantly came up with a solution to the problem."},{d:"(Be coming up) Be happening soon (esp. be broadcast soon)",p:27.5,e:"Coming up after the news, our cooking program will feature cheese."}]],
    ["go back",5,[{d:"Return to a place, time, situation, activity, conversation topic",p:90.0,e:"He washed the dishes and went back to his room."}]],
    ["find out",6,[{d:"Discover STH; obtain knowledge of STH",p:100.0,e:"We need to find out who did this to her."}]],
    ["come out",7,[{d:"Leave a place (room, building, container) or appear from it",p:38.0,e:"She went into the bank and came out with some money."},{d:"Become known or revealed after being kept secret",p:13.5,e:"The news came out that he was leaving the team."},{d:"(Come out and do STH) Make public knowledge a privately held position",p:11.5,e:"People need to come out and say what they think about it."},{d:"Become available or released to the public (film, record, book)",p:10.0,e:"Their new album is coming out next month."}]],
    ["go out",8,[{d:"Leave a room, building, car, or one\'s home to go to a social event",p:56.5,e:"We should go out for dinner sometime."},{d:"(Go out and do STH) Used as an intensifier, to highlight the active nature of what is being done",p:19.5,e:"Do you think he\'ll go out and buy the whole company?"}]],
    ["point out",9,[{d:"Direct attention toward STH (fact, idea, information)",p:89.0,e:"Experts have pointed out that eating too much sugar is extremely unhealthy."}]],
    ["grow up",10,[{d:"Gradually advance in age and maturity",p:98.0,e:"Seeing my kids growing up is such a lovely thing."}]],
    ["set up",11,[{d:"Establish or create STH; arrange for STH to happen or exist",p:64.5,e:"An advisory committee is being set up."},{d:"Place STH in a particular spot or position",p:16.5,e:"We need to set up a few more chairs so everyone can sit down."}]],
    ["turn out",12,[{d:"Prove or be discovered to happen or be",p:91.0,e:"Her suspicion turned out to be justified."}]],
    ["get out",13,[{d:"Leave a container (vehicle, room, building) or make SB/STH leave a container",p:75.5,e:"These prisoners have no hope of ever getting out of jail."}]],
    ["come in",14,[{d:"Enter a place or area (room, building)",p:65.0,e:"She opened the door and he came in."},{d:"Become involved in a situation",p:14.0,e:"We need experts to come in and give us advice."}]],
    ["take on",15,[{d:"Undertake or handle (role, task, responsibility, problem, issue)",p:42.0,e:"Nobody was willing to take on such an awful job."},{d:"Acquire or assume as one\'s own (quality, meaning, colour, shape)",p:41.5,e:"The story takes on a whole new meaning when you read it again."}]],
    ["give up",16,[{d:"Stop doing or having STH; abandon (activity, belief, possession)",p:80.5,e:"She had to give up smoking when she got pregnant."}]],
    ["make up",17,[{d:"Form the whole of an amount or entity",p:42.5,e:"Hispanics make up more than 15% of the U.S. population."},{d:"(+ for) Compensate for STH lacking, lost or missed",p:18.5,e:"Some solution has to be found to make up for such losses."},{d:"(Make up one\'s mind) Make a decision",p:15.5,e:"You should make up your mind about who you will vote for."}]],
    ["end up",18,[{d:"Finally do STH or be in a particular place, state, or situation after doing STH or as a consequence of it, esp. unexpectedly",p:100.0,e:"She ended up having to sell her car after her accident."}]],
    ["get back",19,[{d:"Return to a place, position, state, activity, conversation topic",p:78.5,e:"She got back to London last Monday."}]],
    ["look up",20,[{d:"Raise one\'s eyes",p:88.0,e:"He looked up from his book and shook his head."}]],
    ["figure out",21,[{d:"Come to understand or determine STH",p:100.0,e:"Despite her efforts, she couldn\'t figure out what had happened."}]],
    ["sit down",22,[{d:"Move from a standing position to a sitting position",p:100.0,e:"Please sit down and have a drink."}]],
    ["get up",23,[{d:"Rise or cause to rise after lying in bed or sitting/kneeling",p:92.0,e:"She got up out of her chair and put on her shoes."}]],
    ["take out",24,[{d:"Remove STH/SB from somewhere (container or abstract whole)",p:50.5,e:"He tore open the envelope and took out a few bills."},{d:"Invite to a recreational place or social event",p:13.5,e:"You should take her out to this new Chinese restaurant."},{d:"Obtain an official document or service from an authority",p:12.5,e:"I had to take out a loan to cover all my expenses."}]],
    ["come on",25,[{d:"Said to encourage SB to try harder, or do or say STH",p:50.0,e:"Come on, don\'t be shy and tell us your story."},{d:"Said to show SB disbelief, disagreement, or anger",p:19.5,e:"Oh come on, you're just lying to me!"}]],
    ["go down",26,[{d:"Move down to a lower level or position",p:29.0,e:"After hitting the iceberg, the ship began to go down."},{d:"Decrease in value or amount",p:27.0,e:"I don\'t think prices will go down."},{d:"Go from one place to another, esp. one that is further south or underneath",p:18.0,e:"We went down to Australia last year."}]],
    ["show up",27,[{d:"Make an appearance at a social or professional gathering",p:81.0,e:"She didn\'t show up at the meeting."}]],
    ["take off",28,[{d:"Remove STH (esp. piece of clothing or jewellery from one\'s body)",p:41.0,e:"I took off my shirt and went to bed."},{d:"Leave a place, especially suddenly",p:28.5,e:"They jumped into the car and took off."},{d:"Leave the ground and rise into the air",p:14.0,e:"The plane took off at 7am."}]],
    ["work out",29,[{d:"Plan, devise or think about STH carefully or in detail",p:33.0,e:"We still need to work out the details of the procedure."},{d:"Exercise in order to improve health or strength",p:23.0,e:"He works out at the gym five times a week."},{d:"(+ well/badly) Happen or develop in a particular way",p:15.0,e:"Everything worked out well in the end."},{d:"Prove to be successful",p:12.5,e:"Despite our efforts, it just didn\'t work out."}]],
    ["stand up",30,[{d:"Rise to a standing position after sitting or lying down",p:67.5,e:"He pushed away from the table and stood up."},{d:"(Stand up and say STH) Make public knowledge a privately held position",p:11.0,e:"Somebody\'s got to stand up and say what\'s wrong with this country."}]],
    ["come down",31,[{d:"Move from a higher spatial location to a lower one; fall/land onto the ground",p:32.5,e:"Come down from the roof or you will hurt yourself."},{d:"(+ to) Reduce itself to one particular thing that is the most important or essential matter",p:20.5,e:"What it all comes down to is that the rules have not been respected."},{d:"Become lower in amount or value",p:11.0,e:"Interest rates are currently coming down."}]],
    ["go ahead",32,[{d:"Proceed with a course of action without further hesitation",p:99.0,e:"Go ahead and ask me your question!"}]],
    ["go up",33,[{d:"Become higher in value; increase",p:47.5,e:"Oil prices have gone up last year."},{d:"Move upward, or from a lower spatial location to a higher one",p:20.5,e:"He could see a few hands go up in the audience."}]],
    ["look back",34,[{d:"Think of STH again; reconsider STH past",p:49.5,e:"Looking back on those days, we had a very happy life."},{d:"Look at STH/SB again after having momentarily looked elsewhere",p:30.0,e:"He closed the dictionary and looked back to his notes."}]],
    ["wake up",35,[{d:"Become (or make SB become) conscious again after being asleep",p:92.0,e:"I was so tired that I woke up at 10 this morning."}]],
    ["carry out",36,[{d:"Perform or complete (task, activity, study, experiment, attack, duties, etc)",p:63.5,e:"The experiment was carried out by a well-known academic."},{d:"Put into execution; implement (plan, idea, wishes, orders, views, etc)",p:34.0,e:"Economic reform will soon be carried out."}]],
    ["take over",37,[{d:"Gain control, management, or possession of STH/SB (task, job, political party, organisation)",p:96.5,e:"After her father died, she took over the company."}]],
    ["hold up",38,[{d:"Hold STH in a high position (e.g. above one\'s waist or head), so it can be seen or reached",p:54.0,e:"The professor held up the picture so everyone could see it."},{d:"Remain strong or in a fairly good condition after a bad period or the wear of time (person, business, device)",p:14.0,e:"These are really old shoes but they\'re holding up quite well."},{d:"Delay or prevent the progression of STH/SB",p:11.5,e:"We were held up by heavy traffic."}]],
    ["pull out",39,[{d:"Take STH/SB out of a container, thing or place",p:75.0,e:"He reached in his pocket and pulled out a gun."}]],
    ["turn around",40,[{d:"Move so as to face in the opposite direction",p:67.5,e:"She turned around and walked out the door."},{d:"Make STH become better or more successful than it previously was (economy, business)",p:24.5,e:"People have stopped believing the President could turn around the economy."}]],
    ["take up",41,[{d:"Use a particular amount of space, time or effort",p:25.5,e:"The rewriting of the document took up a whole afternoon."},{d:"Discuss or deal with (issue, idea, matter)",p:17.5,e:"The Senate will take up the issue tomorrow."},{d:"Start doing a particular job or activity, esp. for pleasure",p:10.5,e:"He took up gardening last year."},{d:"Grasp an object, often moving it from a lower to a higher position",p:10.0,e:"I have to take up the carpet before I start hoovering."}]],
    ["look down",42,[{d:"Lower one\'s eyes to see what is below",p:92.0,e:"She looked down at the ground to see what she stepped on."}]],
    ["put up",43,[{d:"Display or attach STH (e.g. to a wall) so it can be seen",p:23.0,e:"They put up a few posters on the wall."},{d:"(+ with) Be willing to accept STH unpleasant or not desirable; tolerate",p:19.0,e:"I won\'t put up with your bad behaviour for much longer."},{d:"Build or place STH somewhere",p:18.0,e:"They\'re putting up a new fence after the previous one fell apart."}]],
    ["bring back",44,[{d:"Make STH/SB return to a place, state, situation, or conversation topic",p:52.5,e:"This will bring back war into the country."},{d:"Bring STH one has taken from a place they come from",p:22.5,e:"This is the hat he brought back from South America."}]],
    ["bring up",45,[{d:"Raise for discussion or consideration",p:59.5,e:"I didn\'t think he would bring up the subject."},{d:"Care for/be responsible for a child until it becomes an adult",p:17.5,e:"She brought up her children under very difficult circumstances."}]],
    ["look out",46,[{d:"Look outside, or at the horizon",p:50.5,e:"She liked to go by the window and look out at the garden."},{d:"Take care of SB and make sure they are well; protect SB\'s interests",p:25.5,e:"We look out for each other as if we were family."}]],
    ["bring in",47,[{d:"Bring STH to a place or situation",p:52.0,e:"I brought in my laptop computer today because my office computer is broken."},{d:"Ask SB to do a particular job or task",p:30.5,e:"He had been brought in to save the company."}]],
    ["open up",48,[{d:"Make STH become available or possible, less limited",p:42.5,e:"This opened up opportunities he would never have imagined."},{d:"Open STH (door, gate, book, bag)",p:27.5,e:"She opened up the bag and grabbed some documents."}]],
    ["check out",49,[{d:"Have a look at; examine STH/SB (esp. to get more information or make a judgement)",p:97.0,e:"Check out our website for more information."}]],
    ["move on",50,[{d:"Start doing or discussing STH new (job, activity, conversation topic)",p:42.0,e:"Let\'s move on to our next topic."},{d:"Change physical location (spot, room, country)",p:28.0,e:"She lived in New York, then London, and finally moved on to Rome."},{d:"Forget about a difficult experience and move forward mentally/emotionally",p:25.0,e:"He\'s had a difficult year but he\'s now ready to move on."}]],
    ["put out",51,[{d:"Make STH known or accessible to the public (information, products)",p:47.0,e:"Police have put out a warning about thieves in the area."},{d:"Stop STH from burning or shining",p:14.0,e:"The fire has finally been put out."},{d:"Place STH somewhere in order for it to be seen or used",p:10.0,e:"I\'ve put out some glasses and a bottle of wine."}]],
    ["look around",52,[{d:"Examine a place or one\'s surroundings so as to view what it might contain or look for a particular thing",p:100.0,e:"They entered the shop and looked around but nobody was there."}]],
    ["catch up",53,[{d:"(Be/Get caught up) Become involved in STH which prevents SB from making progress or moving forward",p:26.0,e:"He is very busy and always caught up in his work."},{d:"Reach SB that is ahead by walking, running, or driving faster",p:18.0,e:"She was running so fast that it was impossible to catch up with her."},{d:"Reach the same level or standard as SB who is more advanced",p:14.0,e:"They made considerable improvements, which makes it hard for us to catch up."}]],
    ["go in",54,[{d:"Enter (place, area, room, building)",p:90.0,e:"This restaurant looks really nice; let\'s go in and have lunch."}]],
    ["break down",55,[{d:"Stop working or functioning; fail or collapse (vehicle, device, relationship, negotiations)",p:24.0,e:"Our car broke down yesterday."},{d:"Divide or separate into categories or smaller components so as to make it easier to understand or deal with",p:20.0,e:"Let\'s break down the task into three easy steps."},{d:"Lose control of one\'s emotions and yield to tears or distress",p:17.5,e:"He broke down at his son\'s funeral."},{d:"Undergo chemical decomposition; separate into different substances",p:13.5,e:"Digestion breaks down food into small molecules."}]],
    ["get off",56,[{d:"Go away from, leave (train, bus, aircraft, lift)",p:54.0,e:"You need to take the bus and get off at the third stop."},{d:"(Get off to a ... start) Begin something in a certain way",p:12.5,e:"The team has got off to a good start this season."},{d:"Manage to avoid serious trouble or consequences (esp. legal punishment)",p:12.0,e:"It\'s not right that he could commit such a crime and get off so easily."}]],
    ["keep up",57,[{d:"Move, progress or increase at the same rate or pace as SB/STH",p:46.0,e:"Workers\' income has not kept up with inflation."},{d:"Make STH continue",p:32.5,e:"This is amazing; keep up the good work!"}]],
    ["put down",58,[{d:"Place STH/SB on the floor or on a flat surface",p:62.0,e:"She put down her glass and left the bar."}]],
    ["reach out",59,[{d:"Stretch an arm in order to hold, touch, or get STH that is within short distance",p:48.5,e:"She reached out for the empty jar on the table."},{d:"Make an effort to address or communicate with SB, so as to help them or involve them in STH",p:39.5,e:"The government\'s efforts to reach out to right-wing voters have paid off."}]],
    ["go off",60,[{d:"Go somewhere, esp. for a particular purpose",p:44.5,e:"He decided to go off to college."},{d:"Emit a loud noise or sudden light as a signal or warning",p:22.0,e:"Let\'s hope the alarm doesn\'t go off."},{d:"Explode (bomb) or be fired (gun)",p:14.0,e:"They could hear bombs going off at a distance."}]],
    ["cut off",61,[{d:"Remove a part of STH by cutting it",p:27.0,e:"Take the carrots and cut the ends off."},{d:"Interrupt SB as they are speaking",p:24.5,e:"The teacher cut off the student in the middle of her sentence."},{d:"End the provision of STH, or be deprived of a provision (supply, money)",p:23.5,e:"The government decided to cut off food supplies."}]],
    ["turn back",62,[{d:"Turn around so as to face the opposite direction",p:51.5,e:"Before leaving through the door, he turned back to kiss her goodbye."},{d:"Go back (or make SB/STH go back) in the direction SB/STH has come from",p:25.5,e:"When the storm hit, we had to turn back."}]],
    ["pull up",63,[{d:"Stop or cause a vehicle to stop",p:47.0,e:"A van pulled up in front of them."},{d:"Move STH/SB from a lower position to a higher one; lift from the ground",p:35.5,e:"She pulled up her scarf to cover her cold face."}]],
    ["set out",64,[{d:"Start doing or working on STH, esp. with a particular goal in mind",p:42.5,e:"I set out to discover the truth behind the story."},{d:"Start a journey",p:26.5,e:"We set out for San Francisco on the following day."},{d:"Explain or present STH clearly, esp. officially and in writing",p:16.0,e:"The official recommendations were set out in the document."}]],
    ["clean up",65,[{d:"Get rid of dirt, mess, pollution, or chemical substances in a place or area",p:74.0,e:"Make sure you clean up your mess because I won\'t do it for you."},{d:"Make STH free from dangerous, unacceptable or controversial activities or contents",p:22.0,e:"He was asked to clean up his bad language during his interview."}]],
    ["shut down",66,[{d:"Stop (or make STH stop) working or operating (machine, computer, business, premise, strategy)",p:94.0,e:"You should shut down your computer at night to save electricity."}]],
    ["turn over",67,[{d:"Surrender possession or control to SB/STH (esp. in authority)",p:59.5,e:"The policeman turned over the criminal to the jail guard."},{d:"Change position so that the other side is facing towards the outside or the top, or another direction",p:34.0,e:"Put the chicken on the grill and turn it over a few times."}]],
    ["slow down",68,[{d:"Move, proceed or progress at a slower pace (vehicle, economy)",p:88.5,e:"Economic growth has dramatically slowed down."}]],
    ["wind up",69,[{d:"End up in a particular situation, condition or place, esp. an unpleasant one",p:87.0,e:"They wound up having to pay off his debts."}]],
    ["turn up",70,[{d:"Yield; be (or make STH be) found, discovered, or noticed",p:48.0,e:"The search turned up solid evidence against him."},{d:"Increase the volume or level of STH",p:21.5,e:"I really like this song; could you turn up the radio?"},{d:"Arrive or make an appearance somewhere",p:14.0,e:"He turned up to the meeting half an hour late."}]],
    ["line up",71,[{d:"Form or make SB/STH form into a line (also figurative)",p:75.0,e:"Dozens of taxis were lined up at the entrance."}]],
    ["take back",72,[{d:"Take STH/SB to a place, or time period (fig.), they were in before",p:50.0,e:"After dinner, he took her back to her house."},{d:"Regain possession or control over STH",p:33.5,e:"The politician\'s ultimate goal is to take back the Senate."}]],
    ["lay out",73,[{d:"Describe or explain STH clearly or in detail, esp. officially and in writing",p:46.0,e:"The whole strategy was laid out in detail in a twenty-page document."},{d:"Spread STH out on a flat surface, so it can be seen or used",p:35.0,e:"He laid out the plates on the table."}]],
    ["go over",74,[{d:"Move towards a place or person, esp. by crossing an area (room, city, country)",p:63.0,e:"She went over to the window so she could watch the scene."},{d:"Examine or discuss each part of STH in detail in order to understand or remember it better, or make sure it is correct",p:20.0,e:"We need to go over the list once again."}]],
    ["hang up",75,[{d:"Finish a conversation on the telephone by putting the receiver down or switching the phone off",p:76.5,e:"He hung up the phone without letting her answer his question."}]],
    ["go through",76,[{d:"Experience STH difficult or unpleasant",p:61.0,e:"You have to understand the tough situation she went through before judging her."},{d:"Be officially accepted or approved",p:10.0,e:"I hope the tax cut goes through next year."}]],
    ["hold on",77,[{d:"Refuse to let go of STH",p:57.0,e:"He held on to his job until the very last day."},{d:"Wait for a short time",p:35.5,e:"I\'ll be quick, please hold on for one minute."}]],
    ["pay off",78,[{d:"Pay the complete amount of STH",p:49.0,e:"It will take a dozen years for him to pay off his debts."},{d:"Pay back the effort spent in doing STH by becoming profitable or effective",p:48.5,e:"All the hard work will pay off in the end."}]],
    ["hold out",79,[{d:"Move one\'s hand or an object in one\'s hand forward or towards SB, in order to grab or give STH",p:61.0,e:"He took the keys and held them out to her."},{d:"Hold STH as likely to happen or succeed (hope, possibility, prospect, promise)",p:15.0,e:"We don\'t hold out much hope of finding the murderer."}]],
    ["break up",80,[{d:"End or cause to end or fail (esp. relationship)",p:59.0,e:"Their marriage broke up in 2007."},{d:"Divide into smaller parts or components",p:34.5,e:"The USSR broke up into more than 10 countries."}]],
    ["bring out",81,[{d:"Make a particular detail, quality or feeling more noticeable than it usually is",p:36.0,e:"This haircut brings out the natural curl in your hair."},{d:"Make SB or STH available for the public or an audience to see, know or buy",p:33.0,e:"The band was about to bring out their new album."},{d:"Take STH/SB out of a container or enclosed space",p:27.0,e:"They brought out another plate from the kitchen."}]],
    ["pull back",82,[{d:"Move backwards or make SB/STH move backwards",p:66.5,e:"She pulled back the hair from her face."},{d:"Withdraw or retreat from an activity or location, esp. military",p:31.0,e:"The army was forced to pull back due to bad weather."}]],
    ["hang on",83,[{d:"Wait for a short time",p:41.5,e:"Please hang on for a minute, I\'ll be quick."},{d:"Refuse to let go of STH",p:35.5,e:"He hung on to his job until the very last day."}]],
    ["build up",84,[{d:"Increase or cause STH to increase, accumulate, or strengthen, especially progressively",p:76.0,e:"Tension was building up among competitors."}]],
    ["throw out",85,[{d:"Refuse to accept or consider (esp. by people of authority)",p:29.0,e:"The president attempted to have the death penalty thrown out."},{d:"Put STH in a rubbish bin",p:25.5,e:"He threw out a dozen empty boxes that were piled up in the room."},{d:"Make SB leave a place, activity or organization, esp. forcibly and unexpectedly",p:21.0,e:"Several students were caught cheating and subsequently thrown out of school."}]],
    ["hang out",86,[{d:"Spend time relaxing or enjoying oneself",p:84.0,e:"I don't like to hang out with people I work with."}]],
    ["put on",87,[{d:"Put a piece of clothing or jewellery onto one\'s body",p:52.0,e:"You should put on your gloves, it\'s really cold outside."},{d:"Present or stage (play, show, competition)",p:14.5,e:"They put on such an incredible show last night!"}]],
    ["get down",88,[{d:"(+ to) Begin to pay serious attention to STH",p:26.0,e:"We should get down to discussing those issues as soon as possible."},{d:"Lower one\'s body as by kneeling, sitting or lying",p:22.5,e:"Get down on your knees so you can get a better view."},{d:"Come down from STH; descend (car, horse, tree)",p:17.5,e:"He loves climbing trees but finds it hard to get down."}]],
    ["come over",89,[{d:"Come to a place or area (spot, room, town, country), esp. towards SB or to join SB",p:95.0,e:"Could you come over and give me a hand with this?"}]],
    ["move in",90,[{d:"Settle into a new house or place",p:62.5,e:"He liked the house so much that he decided to move in immediately."},{d:"Go towards SB/STH, esp. to attack or take control of them",p:34.0,e:"The assault was led by Lieutenant Jones, moving in from behind the hill."}]],
    ["start out",91,[{d:"Start a life, existence, profession, or course of action in a particular way or by doing a particular thing",p:95.0,e:"She started out as a shop assistant and gradually climbed the employment ladder."}]],
    ["call out",92,[{d:"Speak or utter loudly",p:79.0,e:"He could hear a voice call out his name."}]],
    ["sit up",93,[{d:"Rise from a lying to a sitting position",p:93.5,e:"The sudden noise made her sit up in her bed and listen."}]],
    ["turn down",94,[{d:"Refuse or dismiss (request, offer, opportunity)",p:82.5,e:"This is an opportunity you would be foolish to turn down."}]],
    ["back up",95,[{d:"Move or drive backwards a short way",p:26.0,e:"He got into his car and backed up out of the alley."},{d:"Take action in order to support STH or make it happen",p:21.0,e:"Politicians often fail to back up their words with actions."},{d:"Establish as valid or genuine",p:20.5,e:"You have to back up your accusations with solid evidence."}]],
    ["put back",96,[{d:"Move STH/SB to a place, position, or state they were in before",p:85.5,e:"Could you put the milk back in the fridge please?"}]],
    ["send out",97,[{d:"Mail, send or distribute to a number of people",p:57.0,e:"Hundreds of copies were sent out to the local population."},{d:"Send SB to a place for a particular purpose",p:32.5,e:"Military troops were sent out to secure the region."}]],
    ["get in",98,[{d:"Go (or make STH/SB go) inside a place (car, house, room)",p:65.5,e:"The new security lock prevents thieves from getting in."},{d:"(+ on) Get involved in an exciting or profitable activity/opportunity",p:12.5,e:"You should get in on the act!"}]],
    ["blow up",99,[{d:"Explode or destroy STH with a bomb, or cause to be exploded or destroyed",p:75.5,e:"Several attempts were made at blowing up official buildings."}]],
    ["carry on",100,[{d:"Continue to do or be involved with STH, or make STH continue (especially despite difficulty)",p:66.0,e:"I would like to carry on working after I retire."},{d:"Engage or take part in",p:15.0,e:"His illness makes it difficult for him to carry on conversations."}]],
    ["set off",101,[{d:"Start on a trip or journey",p:30.5,e:"We will finish packing and set off in the morning."},{d:"Cause a device to explode, or a signal to start, esp. by accident",p:27.5,e:"He accidentally set off my car alarm."},{d:"Make STH happen or emerge, esp. without intending to",p:25.5,e:"Employees started to protest, setting off a dispute over workers\' rights."}]],
    ["keep on",102,[{d:"Continue doing STH without stopping, or repeatedly",p:92.5,e:"She wiped tears off her cheeks but kept on crying."}]],
    ["run out",103,[{d:"(+ of) Use STH (or become used) completely so that nothing is left",p:49.5,e:"We\'ve run out of biscuits."},{d:"Leave suddenly, as if in a hurry",p:34.0,e:"After the argument, she ran out into the garden and screamed."}]],
    ["make out",104,[{d:"See or hear with difficulty",p:60.5,e:"I could barely make out his face in the dark."},{d:"Represent as being a particular way, esp. falsely",p:11.0,e:"He was innocent, but the media made him out to be a criminal."},{d:"(Make it out) Deal with a difficult situation successfully",p:10.5,e:"We were lucky to make it out of the war alive."}]],
    ["shut up",105,[{d:"Stop (or make SB/STH stop) talking or making a noise",p:97.0,e:"Just sit down and shut up!"}]],
    ["turn off",106,[{d:"Stop a piece of equipment working temporarily or a supply flowing by turning a tap, pressing a button, or moving a switch",p:69.5,e:"People were asked to turn off their phones."},{d:"Cause to feel intense dislike",p:20.5,e:"His speech turned off left-wing voters."}]],
    ["bring about",107,[{d:"Cause to happen or emerge, esp. STH positive",p:100.0,e:"This decision will bring about change in the political sphere."}]],
    ["step back",108,[{d:"Move back by lifting one\'s foot and putting it down backwards",p:72.0,e:"He stepped back when the big man threatened him."},{d:"Stop being involved in STH so as to consider it more carefully/objectively",p:22.5,e:"We need to step back and take a broader perspective on the past events."}]],
    ["lay down",109,[{d:"Put STH away or down on a surface, esp. because one has stopped using it",p:31.0,e:"I laid down my book and stood up."},{d:"Lie flat on a surface, usually to rest",p:28.0,e:"He laid the child down on the bed and wished her good night."},{d:"Lay the foundations of; establish or create",p:17.0,e:"The principles of good conduct were laid down decades ago."}]],
    ["bring down",110,[{d:"Cause SB/STH to move downward or fall to the ground",p:32.5,e:"The rocket attack brought down the airliner."},{d:"Reduce the level, rate, or amount of STH",p:26.0,e:"The company\'s expenses need to be brought down."},{d:"Cause SB/STH in a position of power (government, president, system, organisation) to lose its power/status",p:25.0,e:"They helped bring down one of the most corrupt dictatorships in history."}]],
    ["stand out",111,[{d:"Distinguish oneself/itself by being better, more significant or more impressive than other people/things",p:60.5,e:"Excellent product quality is what made the brand stand out from its competitors."},{d:"Be easily seen or noticeable",p:38.0,e:"Flashing lights make planes stand out at night."}]],
    ["come along",112,[{d:"Appear or arrive; come into existence",p:72.5,e:"Such an opportunity comes along only once in a lifetime."},{d:"Go somewhere with SB",p:20.5,e:"We\'re going to the cinema tonight; you should come along with us!"}]],
    ["play out",113,[{d:"Happen or develop; be enacted or performed",p:79.5,e:"The way these negotiations play out will have important consequences."}]],
    ["break out",114,[{d:"Start suddenly, esp. STH undesirable and unpleasant",p:69.5,e:"Riots broke out that night."}]],
    ["go around",115,[{d:"Go from one place/person to another; circulate",p:76.0,e:"There is a rumour going around that she is pregnant."}]],
    ["walk out",116,[{d:"Leave a place or event, especially suddenly or angrily",p:81.5,e:"She walked out of the meeting feeling irritated by her colleagues."}]],
    ["get through",117,[{d:"(+ to) Succeed in reaching a physical destination or stage",p:27.0,e:"The food supplies never got through to the local population."},{d:"Be successfully communicated or understood",p:22.5,e:"He needed to speak slowly and clearly so his message would get through to the audience."},{d:"Succeed in contacting SB on the telephone",p:20.5,e:"I cannot seem to get through to the customer service department."},{d:"Overcome STH, esp. difficult or unpleasant",p:14.5,e:"He gave me useful advice, which helped me get through this difficult situation."}]],
    ["hold back",118,[{d:"Decide not to do or say STH",p:23.5,e:"They should not hold back from joining us if they want to."},{d:"Prevent SB/STH from reaching their full potential",p:21.0,e:"You cannot let a few unmotivated pupils hold back the rest of the group."},{d:"Prevent SB/STH from going somewhere",p:17.5,e:"Security guards tried to hold back the crowd."},{d:"Contain an unwanted physical manifestation (tears, laughter, sigh, sneeze)",p:16.0,e:"She was holding back the laughter with great effort."}]],
    ["write down",119,[{d:"Record information on paper",p:98.0,e:"You should write down his contact details in case you want to get in touch."}]],
    ["move back",120,[{d:"Return to a place one has lived in before",p:75.0,e:"We moved back to New York last year."}]],
    ["sit back",122,[{d:"Rest in a comfortable position against the back of a seat",p:66.0,e:"She sat back in her chair and turned on the TV."},{d:"(Sit back and do STH) Deliberately take no action/remain passive about STH",p:34.0,e:"We won\'t just sit back and watch the situation getting worse and worse."}]],
    ["rule out",123,[{d:"Exclude STH as a possibility, plausible cause or explanation",p:93.5,e:"They ruled out the possibility of a mass murder."}]],
    ["move up",124,[{d:"Move to a better position; advance to a higher level/rank",p:47.0,e:"She moved up from secretary to senior manager in just a few years."},{d:"Move upward, from a lower spatial location to a higher one",p:22.5,e:"She put her hand on his shoulder and moved it up along the back of his neck."}]],
    ["pick out",125,[{d:"Choose SB/STH among a number of alternatives",p:71.5,e:"She picked out the best-looking dress she could find."},{d:"Detect/be noticed among a group of things or people",p:19.0,e:"My mum could easily be picked out in the picture."}]],
    ["take down",126,[{d:"Remove STH that was previously put up or put in place",p:38.5,e:"After the exhibition, they took the paintings down."},{d:"Destroy, kill, or disable",p:27.5,e:"The terrorists tried to take down the President's plane."},{d:"Take SB to a place, esp. further south or at a lower level",p:18.0,e:"My dad decided to take us down to Florida."}]],
    ["get on",127,[{d:"(+ with) Continue doing STH after stopping",p:51.0,e:"We might as well get on with it if we want to finish on time."},{d:"Get on board some form of public transportation (train, bus, plane, elevator)",p:14.5,e:"He got on the bus to go to school."}]],
    ["give back",128,[{d:"Return STH to its original owner/provider",p:100.0,e:"It\'s nice to be able to give back to the community."}]],
    ["hand over",129,[{d:"Give STH to SB by holding it in one\'s hand and offering it to them",p:58.5,e:"She turned around to hand over her keys to her husband."},{d:"Surrender control or responsibility for STH/SB to SB else, esp. officially",p:41.5,e:"The government isn\'t willing to hand over power to local authorities."}]],
    ["sum up",130,[{d:"Express or represent the most important/representative facts, ideas, or characteristics of SB/STH, especially in a brief manner",p:97.0,e:"He summed up the whole discussion in just a few minutes."}]],
    ["move out",131,[{d:"Leave one\'s place of residence permanently",p:94.5,e:"Our neighbour is going to move out next month."}]],
    ["come off",132,[{d:"Become detached or removed from a larger whole",p:34.0,e:"The button is coming off my shirt."},{d:"Appear or seem to be a particular way",p:24.5,e:"He was tired and not prepared, and so came off poorly in the interview."},{d:"Be finished with STH; have completed STH",p:17.5,e:"The team just came off an incredibly successful season."}]],
    ["pass on",133,[{d:"Circulate or communicate; give STH to SB after receiving it from SB else (information, ideas, object)",p:37.5,e:"I got this message this morning and was asked to pass it on to you."},{d:"Transmit from one generation to the next (traditions, beliefs, skills, possessions)",p:37.0,e:"These ancient traditions have been passed on from generation to generation."},{d:"Die (euphemism)",p:12.5,e:"She has been very depressed since her mother passed on."}]],
    ["take in",134,[{d:"Provide a place for SB to live or stay",p:24.5,e:"The family took her in when she was abandoned by her parents."},{d:"Fully understand or grasp the meaning of STH",p:17.5,e:"You have to explain more thoroughly; it\'s too difficult to take in."},{d:"Deceive by behaving in a dishonest way",p:10.0,e:"He was very convincing, so I was easily taken in."}]],
    ["set down",135,[{d:"Put something on a surface or on the ground",p:75.0,e:"He carried the bags to his room and set them down."}]],
    ["sort out",136,[{d:"Do what is needed to solve a problem, conflict or difficult situation",p:51.0,e:"A few ideas were raised to sort out the company\'s financial issues."},{d:"Find out information so as to understand STH",p:25.5,e:"He will need some time to sort out the reasons for his failure."}]],
    ["follow up",137,[{d:"Take action about STH after a previous action or thing, esp. so as to reinforce its effect",p:48.5,e:"You won\'t be cured immediately after the operation; you will have to follow up with therapy."},{d:"Try to find more information about STH",p:45.5,e:"Detectives are following up on a few promising leads."}]],
    ["come through",138,[{d:"Be clearly perceived, noticed or seen (feeling, emotion, quality)",p:20.5,e:"Her disappointment came through by the tone of her voice."},{d:"Reach success or a desired goal despite difficulty",p:20.0,e:"He worked really hard, and despite some difficulties, he came through in the end."},{d:"Arrive at a destination; come into view (train, ship)",p:10.0,e:"We had to wait for a ship to come through and rescue us."}]],
    ["settle down",139,[{d:"Adopt a quieter and steadier lifestyle",p:31.0,e:"I just want to fall in love with the right guy and settle down."},{d:"Become calmer, quieter, more orderly",p:26.5,e:"We need things to settle down before we can make a serious decision."},{d:"Get into a comfortable position, either sitting or lying",p:20.0,e:"When he reached the top of the hill, he settled down in the grass to have a rest."}]],
    ["come around",140,[{d:"Come in the area near STH/SB",p:45.0,e:"He came around to my room and kissed me goodnight."},{d:"(+ to) Convert to an opinion or decision",p:22.0,e:"I believe she will come around to our way of thinking eventually."},{d:"Happen again as a regular event, at its usual time",p:10.0,e:"You\'ll have to wait until summer comes around."}]],
    ["fill in",141,[{d:"(+ for)Do SB\'s work temporarily because they cannot or will not do it themselves",p:31.0,e:"I had to fill in for her yesterday because she was ill."},{d:"(+ on)Give SB extra or missing information they want or need",p:29.5,e:"She filled Carol in on the plan."},{d:"Put material or substance into STH in order to make it full or complete",p:19.0,e:"All the remaining holes had to be filled in with concrete."}]],
    ["give out",142,[{d:"Give to each of a large number of people",p:40.0,e:"The committee gave out more than 100 copies in the last meeting."},{d:"Make known openly or publicly",p:33.5,e:"You should be more careful and not give out your phone number so easily."},{d:"Collapse/fail; stop functioning properly (heart, knees)",p:11.5,e:"At 95 years of age, her heart finally gave out."}]],
    ["give in",143,[{d:"Cease resistance to (liking/temptation/habit, or to SB\'s demands/control)",p:100.0,e:"She shouldn\'t give in to her children\'s demands."}]],
    ["go along",144,[{d:"Progress or proceed with an activity",p:44.0,e:"You will learn as you go along."},{d:"Act in cooperation or express agreement",p:28.0,e:"The Democrats are not likely to go along with the plan."},{d:"Go to a place or event, esp. without much planning",p:15.5,e:"Would you like to go along with us to the party?"}]],
    ["break off",145,[{d:"Separate a part (or become separate) from a larger piece",p:40.0,e:"He accidentally broke off a piece of wood from the fence."},{d:"Stop speaking, especially suddenly",p:28.0,e:"\"There is something that\...\" He broke off abruptly."},{d:"Put an end to STH (relationship, discussion, talks, negotiations)",p:24.0,e:"They broke off diplomatic relations in 1986."}]],
    ["put off",146,[{d:"Delay until a later time or date",p:68.0,e:"Now that I had more free time, there was no excuse to put off exercising any longer."},{d:"Cause to feel intense dislike",p:27.5,e:"The bad smell put everyone off."}]],
    ["come about",147,[{d:"Take place or happen/occur, esp. unexpectedly",p:81.5,e:"I did not expect this to come about."}]],
    ["close down",148,[{d:"Stop operating or functioning",p:87.0,e:"Non-profitable companies were closed down."}]],
    ["put in",149,[{d:"Put one thing inside another; include or insert",p:50.0,e:"You need to put in your contact details in case there is a problem."},{d:"Invest or devote so as to achieve STH (time, effort, work)",p:26.5,e:"I put in ten hours a day at the office."}]],
    ["set about",150,[{d:"Begin a course of action, usually with a specific purpose/objective in mind",p:97.0,e:"We set about laying the table before our guests arrived."}]],
  ];
  return rows.map(function (r) {
    var rank = r[1];
    var band = rank <= 30 ? "core" : rank <= 60 ? "very-common" : rank <= 100 ? "common" : "mid";
    return { term: r[0], rank: rank, band: band, senses: r[2], example: r[2][0] && r[2][0].e };
  });
})();
var LEXIS_PHAVE_MAP = (function () {
  var m = new Map();
  LEXIS_PHAVE_LIST.forEach(function (p) { m.set(p.term, p); });
  return m;
})();

// ---- The PHRASE List (Martinez & Schmitt 2012) --------------------------
// The 505 most frequent NON-TRANSPARENT multiword expressions in English —
// i.e. exactly the ones whose meaning you cannot work out from the individual
// words, which is why "I know every word but still can't say it" happens. Each
// row is [phrase, integrated BNC rank (lower = more common), example sentence].
// Source: Martinez, R. & Schmitt, N. (2012), "A Phrasal Expressions List",
// Applied Linguistics 33(3), appendix — published free for pedagogic use at
// norbertschmitt.co.uk. Used here for the owner's personal study app.
var LEXIS_PHRASE_LIST = (function () {
  var rows = [
    ["have to",107,"I exercise because I have to."],
    ["there is / are",165,"There are some problems."],
    ["such as",415,"We have questions, such as how it happened."],
    ["going to",463,"I'm going to think about it."],
    ["of course",483,"He said he'd come of course."],
    ["a few",489,"After a few drinks, she started to dance."],
    ["at least",518,"Well, you could email me at least."],
    ["such a",551,"She had such a strange sense of humor."],
    ["I mean",556,"It's fine, but, I mean, is it worth the price?"],
    ["a lot",598,"They go camping a lot in the summer."],
    ["rather than",631,"Children, rather than adults, tend to learn quickly."],
    ["so that",635,"Park it so that the wheels are curbed."],
    ["a little",655,"I like to work out a little before dinner."],
    ["a bit",674,"There was a bit of drama today at the office."],
    ["as well as",717,"She jogs as well as swims."],
    ["in fact",803,"The researchers tried several approaches, in fact."],
    ["go on",825,"He went on for a while before stopping for lunch."],
    ["is to",845,"Obama is to address the media this afternoon."],
    ["a number of",854,"A number of concerns were raised."],
    ["at all",879,"Do you have any kids at all?"],
    ["as if",888,"They walked together as if no time had passed."],
    ["used to",892,"It used to snow much more often."],
    ["was to",894,"The message was to be transmitted worldwide."],
    ["not only",908,"Not only was it cheap, it was delicious."],
    ["those who",913,"He would defend those who had no voice."],
    ["deal with",934,"The police had several issues to deal with."],
    ["lead to ('cause')",939,"Excessive smoking can lead to heart disease."],
    ["sort of",951,"It's sort of why I'm here."],
    ["the following",974,"He made the following remarks."],
    ["in order to",984,"We shared a room in order to reduce costs"],
    ["have got to",1033,"You have got to try this salad."],
    ["set up",1079,"The whole thing was set up beforehand."],
    ["as to",1082,"There was some confusion as to its whereabouts."],
    ["as well",1083,"I like it as well."],
    ["based on",1088,"Based on the reports, it seems it was an accident."],
    ["carry out",1146,"It was not as easy to carry out without funding."],
    ["take place",1169,"No one was sure exactly why it took place there."],
    ["tend to",1175,"I tend to think it's actually a political matter."],
    ["due to",1183,"Many people believe it is due to global warming."],
    ["fail to",1204,"I fail to see the humor in all this."],
    ["each other",1209,"The good thing is that they still have each other."],
    ["in terms of",1234,"What is your limit, in terms of price?"],
    ["no one",1262,"I will speak to no one about this."],
    ["pick up",1299,"She dropped by to pick up her friend."],
    ["up to (maximum)",1352,"Up to twenty people may be interviewed for the job."],
    ["a single ('any')",1356,"Not a single idea emerged from the meeting."],
    ["no longer",1371,"Fortunately, it is no longer a concern now."],
    ["look for",1387,"Bargains can be found if you know what to look for."],
    ["last night",1427,"What did he say last night?"],
    ["as a result",1438,"He was tired and as a result not very aware."],
    ["in addition (to)",1453,"The house was well located in addition."],
    ["work on",1487,"That kid needs to work on his attitude."],
    ["think about",1517,"I'm thinking about changing careers."],
    ["for instance",1529,"That holds true for even the governor for instance."],
    ["too much",1530,"I don't worry about it too much."],
    ["you see",1532,"And the problem you see is with awareness-raising."],
    ["in particular",1533,"There's nothing in particular wrong with it."],
    ["a couple of",1542,"They need a couple of minutes still."],
    ["instead of",1556,"He can go instead of me."],
    ["come back",1573,"But we can come back to that later."],
    ["look like",1591,"It's not what it looks like."],
    ["find out",1605,"How did you find out?"],
    ["point out",1638,"She pointed out that it was getting late."],
    ["apart from",1647,"Are there any others, apart from him?"],
    ["call for",1657,"Hard times call for tough measures."],
    ["manage to",1661,"Did you manage to get in touch at all?"],
    ["or two",1667,"He had a thing or two to drink, then left."],
    ["a further ('another')",1681,"It's a further reason to reconsider the project."],
    ["come out",1696,"It's supposed to come out on Friday."],
    ["be expected to",1713,"They can't be expected to just sit there and wait."],
    ["seek to",1716,"The new board sought to find alternative solutions."],
    ["go through",1733,"You can't imagine what I'm going through."],
    ["long term",1740,"It seems to work, but what of the long term effects?"],
    ["result in",1759,"Excessive criticism resulted in feelings of animosity."],
    ["that is (rephrasing)",1764,"It's yours, as long as you pay that is."],
    ["even though",1778,"I can't even though it looks easy enough."],
    ["a range of",1779,"Eventually, a range of events changed that."],
    ["make sure",1818,"I had to make sure before I opened the door."],
    ["take over",1843,"You can't just let the kids take over."],
    ["consist of",1850,"What does it consist of?"],
    ["as soon as",1861,"As soon as he can he will call you back."],
    ["at the time ('when this happened')",1873,"I was busy at the time."],
    ["on the other hand",1877,"On the other hand, the business did make a profit."],
    ["on one's own",1886,"You did this on your own?"],
    ["all right",1894,"If it's all right I think I'll head off to bed."],
    ["subject to",1900,"All baggage is subject to inspection."],
    ["in front of ('before')",1908,"She did not want to say anything in front of the kids."],
    ["to do with",1910,"I think it has something to do with physics."],
    ["go out",1912,"Brochures went out to prospective buyers."],
    ["a good / great deal ('much')",1920,"She means a great deal to me."],
    ["on the way",1929,"We can stop for lunch on the way."],
    ["as long as",1931,"It makes no difference as long as it's done."],
    ["so far ('until now')",1951,"Any questions so far?"],
    ["ought to",1958,"She hasn't but she ought to."],
    ["at the moment",1959,"They have a lot going on at the moment."],
    ["as though",1967,"He smiled then, as though remembering a joke."],
    ["come to ('evolve to')",1970,"We came to see it for what it was."],
    ["along with",1974,"Along with his dog, the cat slowly stopped eating."],
    ["may well ('could')",1982,"He hasn't yet but may well try before long."],
    ["get out",2001,"There was no way to get out of work that Friday."],
    ["followed by",2013,"The workshop will be followed by time for questions."],
    ["in (the sense) that",2018,"It's great in that there are so many restaurants."],
    ["the case ('true')",2022,"It's not the case that I don't love him."],
    ["take up",2038,"I don't wish to take up more time than is necessary."],
    ["account for",2060,"They'll need to account for their actions."],
    ["set out",2064,"She accomplished what she set out to do."],
    ["as far as",2067,"What are you thinking, as far as feasibility on this?"],
    ["concerned with",2068,"They spoke on issues concerned with culture."],
    ["about to",2075,"Things were about to change."],
    ["supposed to",2086,"I didn't go, but I was supposed to."],
    ["and so on",2087,"My parents arrived, then John, his wife, and so on."],
    ["come on",2105,"Come on, think about it!"],
    ["take on",2124,"You'd better think twice before taking on more work."],
    ["work out",2131,"I'm trying to work out what it stands for."],
    ["all over ('everywhere')",2135,"The news was all over the web."],
    ["other than",2149,"No one other than you could have come up with it."],
    ["out of ('in' / 'from')",2156,"In terms of colour, three out of five were silver."],
    ["turn out",2157,"How did it turn out?"],
    ["look after",2164,"She did more than just look after the finances."],
    ["at last",2173,"At last we met over coffee last week."],
    ["a variety of",2179,"And a variety of issues seemed to stall the process."],
    ["at first",2180,"Not at first, but just the other day there was one."],
    ["or so",2216,"A day or so later he called me back on my mobile."],
    ["in favour",2231,"I don't know about you but I'm in favour."],
    ["give up",2258,"You can't just give up."],
    ["get to ('arrive at')",2263,"When he got to the end he started to weep."],
    ["find oneself",2280,"I found myself driving home."],
    ["get up",2298,"It was easy getting up but the commute was awful."],
    ["carry on",2345,"He could simply not carry on."],
    ["go back",2361,"If I could I'd go back and do it all over again."],
    ["focus on",2371,"But today I'd like to focus on something different."],
    ["at once",2379,"I did it at once."],
    ["it takes",2384,"No matter what it takes."],
    ["as a whole",2404,"As a whole it's OK."],
    ["in practice",2407,"There was nothing she could do in practice."],
    ["by the time",2408,"By the time dinner started there were none left."],
    ["lots of",2409,"Lots of them do travel during the winter months."],
    ["said to be",2417,"The priest was said to be missing."],
    ["in time",2425,"You will in time."],
    ["in turn",2429,"The supermarket in turn will donate seven thousand."],
    ["once again",2437,"Once again, this was completely unforeseen."],
    ["all the time",2439,"I go there all the time."],
    ["on the basis",2442,"She came on the basis that it would help her."],
    ["kind of",2445,"The windows are kind of fogged up."],
    ["get into",2446,"I really got into what he was talking about."],
    ["rely on",2454,"He has no one else to rely on."],
    ["go for",2483,"I could really go for a hamburger right now."],
    ["aim to",2484,"They aim to complete the project by the spring."],
    ["make up ('comprise')",2498,"Hispanics make up a large part of the population."],
    ["appeal to",2531,"It appeals to younger learners."],
    ["end up",2536,"We ended up going anyway."],
    ["shake one's head",2548,"He just shook his head and laughed."],
    ["no more than ('only')",2557,"No more than five of them had auto insurance."],
    ["get back",2575,"What time will we get back?"],
    ["what about",2584,"x"],
    ["in other words",2586,"The groups are in other words conservative."],
    ["as for",2588,"As for the promotion, there may be other options."],
    ["not even",2599,"No one cared, not even when they saw the photos."],
    ["entitled to",2606,"You're entitled to your opinion."],
    ["prior to",2608,"Prior to the event, the organizers called the band."],
    ["choose to",2616,"You may choose to believe what the papers say."],
    ["something like ('around')",2622,"She makes something like five grand a month."],
    ["known to",2624,"He's known to be like that."],
    ["in touch (with)",2636,"Are you two at all in touch?"],
    ["in the end",2637,"In the end it's like what they say about horses."],
    ["in the way",2654,"I won't stand in the way."],
    ["care for",2657,"He doesn't care for it very much in his tea."],
    ["in the event",2658,"In the event you change your mind, let me know."],
    ["they say",2675,"They say it tastes like chicken."],
    ["so called",2688,"Any so called rumors are as easily their fault."],
    ["take into account",2702,"You must also take into account the rush hour."],
    ["in respect of",2709,"There was nothing in respect of drink."],
    ["out of ('using')",2711,"The walls are made out of wood."],
    ["at the same time ('conversely')",2719,"At the same time it may be worth it."],
    ["next to",2724,"Next to his sister, he was the best looking of them."],
    ["turn up",2734,"The money turned up later."],
    ["point of view",2735,"They all had a different point of view."],
    ["at present",2744,"There's nothing to do at present."],
    ["used to (accustomed)",2752,"It may take a while to get used to."],
    ["whether or not",2759,"It depends on whether or not he comes on time."],
    ["in place",2767,"There are systems in place to handle that."],
    ["no doubt ('surely')",2776,"She can and will no doubt improve over time."],
    ["full time",2785,"I'm a full time fan of his music."],
    ["sort out",2817,"They managed to sort out everything on their own."],
    ["in a way",2823,"It's funny in a way."],
    ["or something ('perhaps')",2826,"The sales clerk seemed distracted or something."],
    ["on behalf of",2827,"I'd like to apologize on behalf of the committee."],
    ["over there",2828,"He put it way over there."],
    ["in spite of",2829,"In spite of all the work there were few alterations."],
    ["that's it",2831,"That's it for today, I'm afraid."],
    ["in part",2848,"It is in part the reason people come here."],
    ["oh no",2857,"Oh no not again."],
    ["in mind",2859,"Do you have anything special in mind?"],
    ["one another",2868,"They looked at one another for a few minutes."],
    ["as follows",2871,"The plan is as follows."],
    ["the above",2879,"The above only underscores strength of the data."],
    ["to date",2888,"To date there have been over nine instances."],
    ["go into",2892,"I won't go into what he said."],
    ["too many",2898,"You don't see too many like that one, I'll tell you."],
    ["in the course of",2899,"In the course of the discussion the manager left."],
    ["more or less",2903,"It's more or less what we imagined I suppose."],
    ["short term",2906,"There are many short term gains to be had."],
    ["aimed at",2907,"The study is aimed at exploring how people use it."],
    ["go off",2919,"She went off without even saying goodbye."],
    ["in case",2926,"In case you're wondering, this isn't my natural color."],
    ["out there",2941,"There are simply no jobs out there right now."],
    ["led by",2942,"He was led by his competitive drive above all."],
    ["more and more",2967,"More and more it's about the customer."],
    ["have a look",2970,"Why don't you have a look?"],
    ["believe in",2981,"I don't believe in corporal punishment."],
    ["put it ('say')",2983,"There's no better way to put it, I think."],
    ["these days",2992,"It's what these days the media call 'viral'."],
    ["in charge",2999,"He was able to stay in charge while she was away."],
    ["feel like",3000,"I feel like eating out."],
    ["up to (until)",3016,"I walked up to the window and paused."],
    ["heard of",3022,"Haven't you ever heard of manners?"],
    ["take part in",3044,"It's something we all wanted to take part in."],
    ["in so far as",3059,"The plan was fine in so far as time and transport."],
    ["part time",3061,"She can take it on part time."],
    ["look forward to",3067,"It's something we can all look forward to."],
    ["as such",3094,"The film was not a horror as such."],
    ["bound to",3104,"It's bound to be better next time."],
    ["turn on",3113,"It won't turn on."],
    ["set to",3121,"He's set to arrive today."],
    ["move on",3134,"I'd like to move on if I may."],
    ["in contrast (to)",3149,"The inside was amazing in contrast."],
    ["this stage",3152,"We can't at this stage."],
    ["all but",3157,"She all but sent him chocolates and flowers."],
    ["above all",3160,"It is above all what people care most about."],
    ["rid of",3162,"She was happy to be rid of it."],
    ["in any case",3197,"It's not due till tomorrow in any case."],
    ["thanks to",3199,"And it's thanks to her research that we know that."],
    ["go away",3205,"The problem won't just go away."],
    ["once more",3207,"I call on you once more my fellow citizens."],
    ["oh well",3220,"It was due yesterday? Oh well."],
    ["follow up",3222,"I'd like to follow up on what that gentleman said."],
    ["would say",3224,"I don't know, but I would say at least twenty."],
    ["found to",3235,"It was found to be of little use in battle."],
    ["meant to",3240,"I haven't seen it but it's meant to be his best so far."],
    ["hang on",3263,"If you can hang on for just a second."],
    ["turn into",3265,"The idea turned into something amazing."],
    ["something about",3268,"There's something about her I find interesting."],
    ["by now",3295,"I thought they'd be here by now."],
    ["think so",3308,"Do you think so?"],
    ["go ahead",3320,"Why don't you go ahead and call him again?"],
    ["bring about",3322,"It was expected that he would bring about change."],
    ["had better",3323,"They had better listen."],
    ["in accordance with",3327,"The plan was execute in accordance with municipal guidelines."],
    ["call on",3328,"He called on his members of staff for advice."],
    ["at times",3331,"It can be slightly frustrating at times."],
    ["all the way",3340,"I'm with you all the way."],
    ["in effect",3349,"In effect it was like being in space."],
    ["afford to",3355,"It's something you can't afford to miss."],
    ["sight of",3357,"I can't stand the sight of it, to tell you the truth."],
    ["in advance",3362,"It's something you should do in advance."],
    ["on the part of",3379,"There are no barriers on the part of the government."],
    ["bring up",3387,"Did you manage to bring up the holiday pay?"],
    ["take off",3388,"I was hungry by the time we took off."],
    ["so as to",3390,"He cluttered his desk so as to appear busy."],
    ["take advantage",3396,"Some people just want to take advantage."],
    ["short of",3399,"Short of calling the doctor, I don't know what to do."],
    ["over the years",3402,"She has over the years visited many cities."],
    ["switch on",3406,"It's plugged in but it won't switch on."],
    ["by no means",3417,"We have by no means concluded the matter."],
    ["could hardly",3431,"I could hardly wait for the weekend."],
    ["come up with",3446,"Is that the best you could come up with?"],
    ["in question",3448,"The book in question was published last year."],
    ["in the first place",3450,"He couldn't see how it got there in the first place."],
    ["prove to be",3456,"The bicycle proved to be of immense value."],
    ["in common",3457,"What they have in common is their stamina."],
    ["no matter",3461,"No matter what they say, it's down to you now."],
    ["at this point",3465,"At this point there's no telling who might win."],
    ["in itself",3491,"The car in itself wasn't enough incentive."],
    ["the former",3502,"The former can actually require much more money."],
    ["if only",3511,"If only I'd known sooner."],
    ["yet to",3525,"The package is yet to arrive."],
    ["up to (decisions)",3534,"I'll leave it up to you if that's all right."],
    ["or whatever",3536,"The challenge or whatever is doing it under budget."],
    ["hand over",3548,"The responsibility was expected to be handed over."],
    ["in the light of",3554,"In the light of the results, we delayed the study."],
    ["in the same way",3560,"In the same way, Apple appeals to the young."],
    ["that much",3567,"I don't go out that much."],
    ["the extent to which",3601,"The extent to which the preceding can be asserted is largely dependent on what emerges in the study."],
    ["for some time",3632,"He's actually been studying for some time now."],
    ["in return (for)",3640,"In return I'd like to present you with this gift."],
    ["to death",3650,"The children were bored to death."],
    ["on the grounds",3652,"The decision was made on the grounds of safety."],
    ["oh dear",3670,"He didn't? Oh dear."],
    ["in full",3672,"She paid in full."],
    ["on board",3673,"Are you on board with the decision?"],
    ["to some extent",3686,"It is to some extent what is considered standard."],
    ["some kind of",3695,"What are you, some kind of genius?"],
    ["keep up",3700,"Keep up if you can."],
    ["no idea",3709,"You have no idea."],
    ["greater than",3712,"Anything greater than five is fine."],
    ["happen to (be)",3715,"This happens to be my first conference."],
    ["held that ('believed')",3718,"The congress held that it was acceptable."],
    ["faced with",3722,"Faced with defeat, he changed tactics."],
    ["do(ing) so",3733,"Unfortunately, doing so also meant facing traffic."],
    ["set off",3738,"We set off at noon."],
    ["put forward",3740,"The group put forward several other proposals."],
    ["from time to time",3760,"He does come round from time to time."],
    ["ever since",3762,"And they haven't been the same ever since."],
    ["just about",3763,"Am I finished? Just about."],
    ["as opposed to",3771,"Better now, as opposed to what?"],
    ["give rise to",3774,"The protests gave rise to new violence."],
    ["large scale",3780,"They were thinking on a large scale."],
    ["make sense",3782,"Doesn't it make sense to do it that way?"],
    ["by means of",3789,"It was possible to achieve by means of coercion."],
    ["in short",3790,"The employees were in short tired of it."],
    ["the means",3791,"He hasn't the means to get there."],
    ["a bit of a",3791,"He's a bit of a film fanatic."],
    ["break up",3796,"They did keep in touch after they broke up."],
    ["but then (again)",3803,"I went over budget, but then I expected I would."],
    ["all too",3830,"Why is this all too familiar?"],
    ["put up",3831,"The authorities put up a sign to notify the public."],
    ["good at",3847,"You need to find something you're good at."],
    ["a long way",3851,"A little bit of compassion can go a long way."],
    ["amount to",3854,"Unfortunately, the player never amounted to much."],
    ["for long",3861,"He did attend university, but not for long."],
    ["some more",3887,"I'll have to think some more before deciding."],
    ["in the absence of",3888,"In the absence of truth, there is only conjecture."],
    ["all sorts of",3895,"We have all sorts of time left."],
    ["get on with",3896,"I need to get on with my work."],
    ["no good",3902,"It's no good sitting there"],
    ["yet another",3939,"That's yet another day gone by with nothing done."],
    ["key to",3940,"Her input was key to the project's success."],
    ["i'm afraid",3947,"It hasn't arrived, I'm afraid."],
    ["that which",3955,"You cannot undo that which has already been done."],
    ["if so",3960,"If so, you may want to consider Greece."],
    ["right now",3973,"The best time is right now."],
    ["in view of",3979,"She reconsidered in view of her children."],
    ["in detail",3984,"I can explain in detail."],
    ["reflected in",3989,"The artist's angst is reflected in her painting."],
    ["no such",3992,"He said no such thing."],
    ["nothing but",4004,"I have nothing but respect for her."],
    ["in the face of",4020,"They quit in the face of the media scrutiny."],
    ["such that",4023,"It can be developed such that it does not interfere."],
    ["out of ('due to')",4025,"Most commuters drive out of pure necessity."],
    ["next door",4029,"The people next door didn't seem to mind."],
    ["to the point",4032,"It got to the point I couldn't breathe."],
    ["make its / one's way",4035,"The mouse made its way across the field."],
    ["in hand",4037,"It was well in hand by then."],
    ["get to ('opportunity')",4052,"Did you get to try the cheese?"],
    ["by the way",4058,"By the way, what day is the wedding?"],
    ["by contrast",4061,"The weather was by contrast a pleasant surprise."],
    ["run out",4062,"You need to get milk before you run out."],
    ["in principle",4063,"You can in principle."],
    ["add to",4071,"It does nothing to add to the scenery."],
    ["as yet",4072,"I'm not convinced as yet."],
    ["at risk",4077,"There's no reason to put passers by at risk."],
    ["a mere",4092,"She made a mere penny per shirt."],
    ["shown to",4093,"Dogs have been shown to help."],
    ["on the one hand",4095,"On the one hand, it's cheap."],
    ["by way of",4099,"It was only by way of bribery that they managed."],
    ["on the road",4107,"I can't wait to get on the road again."],
    ["bear in mind",4109,"It was designed bearing in mind environmental impact."],
    ["old fashioned",4113,"He's just a bit old fashioned sometimes."],
    ["for sale",4136,"The house is for sale."],
    ["or anything",4138,"I don't want any trouble or anything."],
    ["most likely",4143,"It is most likely the reason for the warming."],
    ["provide for",4153,"The other variables have been provided for."],
    ["even so",4165,"Even so, it's no way to treat a guest."],
    ["come across",4167,"They happened to come across a map."],
    ["first of all",4182,"It is first of all what most people prefer."],
    ["might as well",4195,"We're here now so we might as well."],
    ["limited to",4199,"The dinner was limited to seniors."],
    ["to me ('in my opinion')",4201,"To me what matters is that it gets done."],
    ["mind you",4207,"Mind you, that's one reason why I go there."],
    ["at a time ('simultaneously')",4210,"They went in two at a time."],
    ["half past",4232,"I make it half past."],
    ["with respect to",4233,"She had nothing to add with respect to the report."],
    ["consistent with",4242,"The results are consistent with our hypothesis."],
    ["way out",4248,"He lives way out in the country."],
    ["third party",4250,"They work with third party software too."],
    ["contrary to",4253,"The city is clean, contrary to popular belief."],
    ["worth of",4257,"Two dollars worth of wood was all he needed."],
    ["a good ('at least')",4259,"It took him a good six or seven years."],
    ["act on",4261,"She never acted on that rage."],
    ["except that",4262,"It seemed fine except that it was pink."],
    ["day to day",4278,"They carried on with their day to day tasks."],
    ["as usual",4282,"As usual he left it until the last minute."],
    ["long before",4290,"Long before I could quit I was offered a promotion."],
    ["long ago",4307,"I gave up on that idea long ago."],
    ["in conjunction with",4314,"The police, in conjunction with the fire department, managed to keep the crowd under control."],
    ["up to date",4319,"I try to keep up to date."],
    ["let alone",4333,"I can't run let alone walk."],
    ["quite a lot",4337,"I do swim quite a lot."],
    ["if you like",4342,"It was her 'chutzpah' if you like that impressed."],
    ["to the extent",4349,"He's interesting to the extent that he knows a lot."],
    ["so far as",4356,"So far as I know it's not the first time either."],
    ["given that",4362,"It was no surprise given that it was her job."],
    ["in line with",4372,"The decision is in line with the department's wishes."],
    ["on the whole",4374,"It was acceptable on the whole."],
    ["care to",4396,"Do you care to comment at all?"],
    ["take account of",4408,"We did not take account of the paperwork."],
    ["something like that",4461,"He said he had a meeting to go to or something like that."],
    ["make use of",4462,"We made use of the stopover."],
    ["when it comes to",4465,"I'm hopeless when it comes to goodbyes."],
    ["fill in",4466,"The victim filled in what was stolen."],
    ["for all ('considering')",4471,"For all his money, he does not seem very happy."],
    ["a question of",4482,"It's a question of trust."],
    ["for life",4484,"And he stayed there for life."],
    ["get away",4497,"They managed to get away."],
    ["in the meantime",4501,"I'll keep working on it in the meantime."],
    ["something of a",4522,"She's something of a mathematics wiz."],
    ["the odd",4523,"I do play the odd jazz tune."],
    ["little more than",4556,"It's little more than pageantry if you ask me."],
    ["would you like",4558,"Would you like tea?"],
    ["in need",4584,"We want to help children in need."],
    ["take for granted",4587,"It's just something I've always taken for granted."],
    ["in this respect",4605,"In this respect, our study refutes earlier research."],
    ["provided that",4606,"It's OK provided that he come up with the goods."],
    ["allow for ('calculate in')",4614,"Even if you allow for inflation, the price increase still seems exhorbitant."],
    ["catch up",4634,"I took extra classes just to catch up."],
    ["a go ('attempt')",4639,"Why don't you have a go?"],
    ["for the moment",4649,"For the moment things seem stable."],
    ["at the expense of",4656,"They were laughing at the expense of the photo."],
    ["put together",4670,"He put together the proposal in a matter of days."],
    ["things like that",4671,"He does karate and things like that, you see."],
    ["of little",4682,"It was of little relevance, really."],
    ["shut up",4683,"I just couldn't shut up."],
    ["as of",4703,"It was completed as of June."],
    ["over time",4704,"It might change over time."],
    ["would appear",4710,"They people have spoken, it would appear."],
    ["the other day",4711,"I thought of you the other day."],
    ["in theory",4712,"In theory that is why he went there."],
    ["thought of (as)",4713,"Beaches are thought of as vacation spots."],
    ["for good",4721,"It's gone for good."],
    ["opposed to",4726,"He's strangely opposed to gun control."],
    ["common sense",4749,"To me it's common sense."],
    ["bother to",4754,"He never bothered to reply."],
    ["as good as ('like')",4759,"It's as good as gone."],
    ["back up",4761,"I have proof to back up my story."],
    ["take care of",4791,"I'll take care of this customer."],
    ["the sight of",4816,"I can't stand the sight of it."],
    ["go round",4819,"I'll go round asking if anyone wants any more."],
    ["the whole thing",4834,"Why don't we just forget the whole thing?"],
    ["at one time",4837,"At one time I thought that too."],
    ["head to",4839,"Meanwhile, he decided to head to the hospital."],
    ["in a sense",4840,"The food was in a sense only part of the experience."],
    ["on average",4841,"How much does he make on average?"],
    ["way round",4846,"Do you know your way round?"],
    ["can tell",4850,"You can tell from the markings."],
    ["free from",4896,"I dream of a life free from stress."],
    ["and all that",4901,"I like art and all that."],
    ["as it were",4909,"The party was a smash as it were."],
    ["what if",4915,"What if we could fly?"],
    ["touch of",4917,"There was a touch of sadness in her voice."],
    ["better off",4919,"You're better off without him."],
    ["stand for",4932,"That symbol used to stand for something."],
    ["to blame",4944,"I think the government's to blame, really."],
    ["the bulk of",4950,"The bulk of it was done by noon."],
    ["a handful of",4955,"Only a handful of them were actually awake."],
    ["by virtue of",4991,"She won by virtue of her superior intellect."],
    ["turn down",5001,"I won't turn down such a great offer."],
    ["get on ('relate')",5010,"My parent don't really get on very well."],
    ["under way",5022,"Changes are already under way."],
    ["in the interest of",5025,"They stopped in the interest of time."],
    ["on the market",5051,"How long has it been on the market?"],
    ["by far",5060,"The rise in unemployment was by far the highest."],
    ["a degree of",5072,"There is a degree of irony in the story."],
    ["never mind",5082,"Never mind that it's my birthday today."],
    ["up and down",5134,"He was up and down the hall worrying about it."],
    ["in one's own right",5156,"Gesture is a form of expression in its own right."],
    ["a case of",5169,"Now it's just a case of getting them to subscribe."],
    ["more so",5171,"Boston is walkable, and San Francisco more so."],
    ["come up to",5193,"Men always come up to me first."],
    ["in which case",5216,"That means it's midnight, in which case it's closed."],
    ["no sign of",5222,"Still no sign of him?"],
    ["just as ('when')",5231,"I saw him just as he left."],
    ["for the sake of",5244,"He exaggerated his points for the sake of effect."],
    ["in a position to",5247,"I'm not in a position to comment right now."],
    ["to come",5255,"We'll see how things go in the weeks to come."],
    ["backed by",5285,"The group is backed by the drug trade."],
    ["at best",5303,"He's at best average."],
    ["wealth of",5306,"The library holds a wealth of knowledge."],
    ["that sort of thing",5309,"He drinks a lot and that sort of thing."],
    ["make out",5311,"He could barely make out her signature."],
    ["come to terms with",5323,"They were finally able to come to terms with the change in weather."],
    ["fond of",5348,"I'm not very fond of it, to be honest."],
    ["with a view to",5354,"It was written with a view to inspiring hope."],
    ["turn back",5361,"There was no turning back now."],
    ["get away with",5366,"Somehow they managed to get away with it."],
    ["no wonder",5384,"No wonder he's ranked first."],
    ["well being",5438,"It was good for their overall well being."],
    ["how about",5447,"How about tomorrow?"],
    ["to go ('remaining')",5463,"Two more to go."],
    ["straight away",5479,"They'll get to it straight away."],
    ["owing to",5485,"Owing to his honesty, he was held in high esteem."],
    ["hold up",5491,"Sorry"],
    ["look to",5492,"He constantly looked to us for advice and support."],
    ["lay out",5496,"The countries laid out plans for a peace agreement."],
    ["the lot",5497,"They tood the jewellery, the laptops, the lot."],
    ["keep on",5501,"Freeways kept on being built."],
    ["make up one's mind",5502,"You'd better make up your mind."],
    ["at work",5503,"There were strange forces at work."],
    ["come about",5504,"It all came about through a meeting back in April."],
  ];
  return rows.map(function (r) {
    var rank = r[1];
    var band = rank < 1200 ? "core" : rank < 2000 ? "very-common" : rank < 3000 ? "common" : rank < 4200 ? "mid" : "low";
    return { term: r[0], rank: rank, band: band, example: r[2] };
  });
})();
var LEXIS_PHRASE_EXAMPLE = (function () {
  var m = new Map();
  LEXIS_PHRASE_LIST.forEach(function (p) { if (p.example) m.set(p.term, p.example); });
  return m;
})();

// flat list: [{ term, tier, phrase }]
var LEXIS_PHRASE_SEED_FLAT = (function () {
  const out = [];
  for (const t of Object.keys(LEXIS_PHRASE_SEED)) for (const p of LEXIS_PHRASE_SEED[t]) out.push({ term: p, tier: +t, phrase: true });
  return out;
})();
function lexisPhraseScene(term) {
  var t = String(term || "").toLowerCase().trim();
  var hit = LEXIS_PHRASE_SCENE[t];
  if (hit) return hit;
  // The curated map only covers the ~50 seed collocations. For the 498-item
  // PHRASE List, take the scene of the phrase's most specific content word so
  // the category chips are useful there too (v1.52.0).
  var parts = t.split(/[^a-z']+/).filter(Boolean);
  for (var i = parts.length - 1; i >= 0; i--) {
    var d = lexisWordDomain(parts[i], true);   // specificOnly: skip the "general" fallback
    if (d && d.key !== "desc" && d.key !== "quant") return d.key;
  }
  return null;
}

// flat list: [{ term, tier, idiom }]
var LEXIS_SEED_FLAT = (function () {
  const out = [];
  for (const t of Object.keys(LEXIS_SEED.words)) for (const w of LEXIS_SEED.words[t]) out.push({ term: w, tier: +t, idiom: false });
  for (const t of Object.keys(LEXIS_SEED.idioms)) for (const w of LEXIS_SEED.idioms[t]) out.push({ term: w, tier: +t, idiom: true });
  return out;
})();

// Large frequency-ranked learning pool for 推荐学习清单 — Google Trillion-Word
// Corpus order with the LEXIS_COMMON basics stripped out. Recommendations page
// through this HIGH-FREQUENCY FIRST (no band mix); Shuffle advances the cursor.
// Encoded as "word <bandChar>" pairs joined by | ; bandChar c/m/l/r.
// ---- Pool hygiene ------------------------------------------------------
// The Google Trillion-Word Corpus behind LEXIS_FREQ is lowercased, so surnames,
// cities, brands and web/file-format tokens look like ordinary vocabulary. They
// are filtered out of LEXIS_FREQ below and reused by the notebook's "清理人名/
// 地名/无意义词" action, so no surface ever recommends "usr" or "louisville".
var LEXIS_PROPER_NOUNS = new Set("aaron aberdeen abraham acer acm adams adelaide adidas adobe adrian afghanistan africa alabama alan alaska albania albany albert alberta albuquerque alex alexander alexandria alexis alfred algeria ali alice allah allan allen alvin amanda amazon amber amd america american amsterdam amy anaheim anderson andorra andrea andreas andrew andrews andy angela angeles angola ann anna annapolis anne annie anthony antigua antonio aol apnic apollo apple april arabia argentina arizona arkansas arlington armenia armstrong arnold arthur aruba ashley asia asian asus athens atlanta auckland audi audrey aurora austin australia australian austria azerbaijan baghdad bahamas bahrain bailey baker bakersfield baltimore bangkok bangladesh barbados barbara barbie barcelona barry bath bbc beatles bedford beijing belarus belfast belgium belize bell ben benin benjamin bennett benz berkeley berlin bermuda bernard beth betty beverly bhutan bible bill billy birmingham bizrate black blair bloomberg bmw bob bobby boise bolivia bombay bosnia boston botswana boyd brad bradley brandon brazil brenda brian brighton brisbane bristol britain britannica british britney brooklyn brown bruce brunei brussels bryan bryant budapest buddha buffalo bulgaria burke burkina burlington burundi cadillac cairo calgary california calvin cambodia cambridge cameron cameroon campbell canada canadian canberra canon cardiff caribbean carl carlos carmen carol carolina caroline carolyn carroll carter casey casio catherine cbs chad chan chandler chapman charles charleston charlie charlotte chelsea cheryl chesapeake chevrolet chicago chile china chinese chris christ christian christianity christina christine christmas christopher chrysler cia cincinnati cindy cisco citibank citysearch claire clara clark clarke claude clayton cleveland clinton cnn cohen cole coleman colin collins cologne colombia colorado columbia columbus comoros compaq concord congo connecticut connie cook cooper copenhagen cornell cornwall craig crawford croatia cruz crystal cuba curtis cynthia cyprus czech dakota dale dallas dan dana daniel danny darren darwin dave david davidson davis dawn dayton dealtime dean deborah debra december del delaware delhi dell denmark dennis denver der derek detroit deutschland devon diana diane dick disney dixon djibouti dominic dominican don donald donna doris dorothy douglas dover doyle dubai dublin duncan durham dustin dwight dylan earl easter ebay ecuador ed eddie edgar edinburgh edmonton edward edwards edwin egypt eileen elaine eleanor elizabeth ellen elliott ellis emily eminem emma england epinions epson eric erica ericsson erik erin eritrea ernest espn essex estonia ethan ethiopia eugene europe european eva evans evelyn expedia facebook fairfield fbi fcc fda february fedex felix fernando ferrari fiji findarticles findlaw finland fiona firefox fisher fletcher flickr florida floyd ford foster france frances francis francisco frank frankfurt franklin fred freddie frederick fremont french fresno friday fujitsu gabon gabriel gail gambia gamecube gamespot garcia garland garmin gary gene geoffrey george georgia gerald german germany ghana gibraltar gibson gilbert glasgow glen glendale glenn gloria gmail gmc gomez gonzalez google gordon grace graham grant gray greece greek green greenland greensboro greg gregory grenada guam guatemala guinea guyana haiti halifax hall halloween hamburg hamilton hampton hans hansen harley harold harris harrison harry hartford harvard harvey hawaii hayes heather hector helen helena helsinki henderson henry herbert hewlett hill hilton hitachi holland holly honda honduras honolulu hopkins hotmail houston howard hp hudson hugh hughes hugo hungary hunter huntington hyundai ian ibm iceland icq idaho iii ikea illinois india indian indiana indianapolis indonesia intel invision iowa ipaq ipod iran iraq ireland irene irish irving isaac islam israel istanbul italian italy itunes ivan jack jackie jackson jacksonville jacob jakarta jake jamaica james jamie jane janet janice january japan japanese jason jay jean jeff jefferson jeffrey jelsoft jennifer jenny jeremy jerome jerry jersey jerusalem jesse jessica jesus jill jim jimmy joan joanne joe joel john johnny johnson johnston jon jonathan jones jordan jose joseph josh joshua joyce jr juan judith judy julia julian julie july june juneau justin jvc kansas karen karl kate katherine kathleen kathy katie kazakhstan keith kelkoo kelly ken kennedy kenneth kenny kentucky kenya kerry kevin kim kimberly king kingston kiribati kirk klein knight knowledgestorm kodak kong korea korean kristen kruger kurt kuwait kyle kyrgyzstan lancaster lance lanka laos laredo larry lars las latvia lauderdale laura lauren lawrence lebanon lee leeds lenovo leo leon leonard leone leslie lesotho lester lewis lexington lexmark lexus liberia libya liechtenstein lily lincoln linda linux lisa lisbon lithuania liverpool liz lloyd logan logitech lois london lonnie looksmart lopez lorenzo loretta lori los lou louis louise louisiana louisville lubbock lucas lucia lucy luis luke luther luxembourg lycos lynn mac macedonia macintosh macromedia madagascar madison madonna madrid maine malawi malaysia maldives mali malta manchester manhattan manila manitoba marc marco marcus margaret maria mariah marie marilyn mario marion mark marriott marshall martha martin marvin mary maryland mason massachusetts mastercard matt matthew maui maurice mauritius max maxwell mazda mc mcdonald medicaid medicare medline megan melbourne melissa melvin memphis mercedes mesa metallica mexican mexico meyer miami michael micheal michel michelle michigan microsoft mike milan miller milton milwaukee minneapolis minnesota minolta miriam mississippi missouri mitchell mitsubishi modesto moldova molly monaco monday mongolia monica monroe montana montenegro montgomery montreal morgan morocco morris morrison moscow moses motorola mozambique mozilla msn mtv mumbai munich murphy murray myanmar myers mysimon myspace nairobi namibia nancy naples nasa nascar nasdaq nashville nathan nathaniel nato nauru nba nbc ncaa nebraska nec neil nelson nepal netflix netherlands netscape nevada newark newcastle newfoundland newman nextel nfl nguyen nhl nhs niagara nicaragua nicholas nick nicolas nicole niger nigeria nike nikon nintendo nissan noah nokia norfolk norman norton norway norwegian notre nottingham november nsw nvidia nyc oakland oclc oconnor october oecd ohio oklahoma oliver olivia olympia olympic olympics olympus omaha oman ontario oracle oregon orlando orleans oscar oslo ottawa owen oxford packard pakistan palau palestine palmer pam pamela panama panasonic papua paraguay paris parker paso pat patricia patrick paul paula paypal pearl pearson pedro penn pennsylvania pentium pepsi perry perth peru pete peter petersburg peterson phil philadelphia philip philippines philips phillip phillips phoenix photoshop phyllis pierre pittsburgh playstation plymouth pokemon poland polish pontiac porsche porter portland portsmouth portugal powell prague preston pretoria price princeton prostores pubmed puerto qatar qld quebec queensland rachel raleigh ralph ramon randall randy raymond rebecca reed regina reid rene reno reuters reyes reynolds rhode rhonda rica ricardo rice richard richards richardson richmond rick ricky rita riverside robbie robert roberto roberts robertson robin robinson rochester rockford rodney rodriguez roger rogers roland romania rome ron ronald ronnie rosa rose ross roy ruby russell russia russian ruth rwanda ryan sacramento saint salem sally salvador sam samoa samsung samuel sanchez sandiego sandra santa sanyo sara sarah saskatchewan saturday saturn saudi savannah schmidt schneider scotland scott scottish scottsdale sean seattle sega senegal seoul september serbia seychelles shakespeare shakira shane shanghai shannon sharon sharp shaun shaw shawn sheffield sheila shelley sherman sherry shirley shopzilla shreveport shrewsbury sidney siemens simon simpson singapore skype slovakia slovenia smith smithsonian snyder somalia sony southampton spain spanish spencer spokane springfield sr sri stacy stan stanford stanley stella stephanie stephen steve steven stewart stockholm stockton stuart subaru sudan sue sullivan sunday suriname susan sussex suzuki swaziland sweden swedish switzerland sydney sylvia symantec syracuse syria tacoma tahoe taipei taiwan tajikistan tammy tampa tanya tanzania taylor techrepublic ted teddy tennessee teresa terry texas thailand theodore thinkpad thomas thompson thomson thursday tiffany tim timothy tina tobago toby todd togo tokyo toledo tom tommy tonga tony topeka toronto toshiba toyota tracy travis trenton treo trevor trinidad tripadvisor troy tucson tuesday tulsa tunisia turkey turkmenistan turner tuvalu twiki tyler uganda ukraine uruguay usa usda usgs usps utah uzbekistan valerie van vancouver vanessa vanuatu vatican vbulletin venezuela venice verde verizon vermont vernon veronica vicki victor victoria vienna vietnam vincent violet virginia visa volkswagen volvo von wagner wales walker wallace walmart walsh walter wanda ward warren warsaw washington watkins watson wayne weber wednesday wellington wendy wesley westminster white wichita william williams willie wilson winston wisconsin wong wood woods wordpress worldcat wright wto wyoming xbox xerox yahoo yamaha yemen york yorkshire young youtube yugoslavia yvonne zachary zambia zdnet zealand zimbabwe zurich".split(" "));
// Web-corpus artefacts, file/format tokens, abbreviations and adult/spam terms —
// not English vocabulary at all.
var LEXIS_JUNK_WORDS = new Set("admin ajax alt am ambien ansi aol apache args argv asap ascii asin asp aspx atom aud avg avi awk bar bash baz bdsm bin blackjack bmp bool br bsd btw cad casino centos cfg cgi changelog char chmod chown cialis cnet commit config craigslist cron css cst curl cvs daemon debian dev div diy dll dns doc docx dom ebay ed eds edt emacs emoticons enum escort est etc eur exe faq faqs fedora fetish foo freebsd ftp func fyi gay gbp gif git gmt gnu goto gpl grep howto hr href htm html http https ibid idx ieee ietf imdb img init int ip ipsum isbn iso issn jpeg jpg jpy js jsonp jsp len lesbian li licence localhost lol lorem lottery manpage max mediawiki min mit mp mp3 mp4 mpeg msn mysql naked nav netbsd next nginx no nos nude ol omg openbsd opml params pdf pdt permalink phentermine php phpbb pingback pm png poker porn porno posix postgres pp ppt prev pst qux rar readme redhat regex repo rfc ringtone ringtones rmb root roulette rss rsschannel rsync scp screensaver screensavers sed sex sexy sitemap sku slots smilies smtp soap solaris soma span sqlite src ssh stderr stdin stdout str sudo sudoers sum svg svn tcp td temp th tmp toc todo tr trackback tramadol ubuntu uddi ul unicode unix upc uri url usd usr utc utf util utils valium var viagra vim vol w3c wallpaper wallpapers wav webcam webmaster wget wiki wikimedia wikipedia wsdl www xanax xhtml xls xlsx xml xmlrpc xpath xslt xxx zip zsh".split(" "));
// Abbreviations and initialisms. They pass every other filter (real letters, a
// vowel, plausible length) but are not vocabulary anyone should study.
var LEXIS_ABBREV = new Set("acct addr admin aka alt amet amt api approx apr apt args argv arr asap asin atm attr aud aug auth ave avg avi bal bcc bin bldg blvd bool cad cc ceo cfg cfo char cio cli cny config consectetur coo corp cpu cto dec demo dept dest dev dist diy dns dob doc dolor dpi enum env eod eom eoy eta etc eur excl ext false faq feb fl flac fri ft func fwd gbp gbps ghz gif govt gps gpu gui hdd hr hwy ide idx inc incl info init inr int intro ipsum isbn issn jan jpg jpy jul jun kbps kph krw kwh lan lb len lib lite llc lorem ltd mah mar max mbps mgmt mhz min misc mkv mms mom mon mp mpeg mph msg mt nan nb nite nov null num obj oct oz param pdf pic pics pin pkg pkwy placeholder plc pls plz png ppi ppm pps ppt pr prev ps psi qa qoq qty ram rd re ref repo req rmb rom rpm rsvp sat sdk sep sept seq sku sms spec sq src ssd ssn std ste str struct sun svg temp tho thru thu thur thurs thx til tmp toc true tue tues typedef ui undef univ unk unknown untitled upc uri url usb usd usr ux var vid vids void vpn vs wan wav wed xls yd yoy ytd".split(" "));
// Genuine 2–3 letter English words. Anything shorter than 4 letters that is NOT
// in here is treated as an abbreviation/artefact — that rule alone clears out
// most of the corpus noise the explicit lists would never catch.
var LEXIS_SHORT_OK = new Set("ace act add ado aft age ago aid ail aim air ale all amp and ant any ape apt arc are ark arm art ash ask asp ate awe axe bad bag ban bar bat bay bed bee beg bet bid big bin bit boa bob bog boo bow box boy bra brr bud bug bum bun bus but buy bye cab cad cam can cap car cat caw cob cod cog con coo cop cot cow coy cry cub cud cue cup cur cut dab dad dam day den dew did die dig dim din dip doe dog don dot dry dub dud due dug duo dye ear eat ebb eel egg ego elf elk elm emu end eon era err eve ewe eye fad fan far fat fax fed fee few fig fin fir fit fix flu fly foe fog for fox fry fun fur gag gal gap gas gel gem get gig gin got gum gun gut guy gym had hag ham has hat hay hem hen her hew hex hey hid him hip his hit hoe hog hop hot how hub hue hug hum hut ice icy ill imp ink inn ion ire irk its ivy jab jam jar jaw jay jet jig job jog jot joy jug jut keg key kid kin kit lab lad lag lap law lax lay led leg let lid lie lip lit lob log lot low lug lye mad man map mar mat maw may men met mid mix mob mod mop mow mud mug mum nag nap net new nib nil nip nod nor nose not now nun nut oak oar oat odd ode off oft oil old one opt orb ore our out owe owl own pad pal pan par pat paw pay pea peg pen pep per pet pew pie pig pin pit ply pod pop pot pox pro pry pub pug pun pup pus put rag ram ran rap rat raw ray red ref rib rid rig rim rip rob rod roe rot row rub rue rug rum run rut rye sad sag sap sat saw say sea see set sew she shy sin sip sir sit six ski sky sly sob sod son sow soy spa spy sty sub sue sum sun sup tab tad tag tan tap tar tax tea tee ten the thy tie tin tip toe ton too top tot tow toy try tub tug two ugh urn use van vat vet vex via vie vow wad wag war was wax way web wed wee wet who why wig win wit woe wok won woo wow wry yak yam yap yaw yea yes yet yew you zap zen zip zoo".split(" "));
// true = this term should never be offered as a word to learn
function lexisIsNoiseWord(w) {
  var s = String(w || "").toLowerCase().trim();
  if (!s) return false;
  if (LEXIS_PROPER_NOUNS.has(s) || LEXIS_JUNK_WORDS.has(s) || LEXIS_ABBREV.has(s)) return true;
  if (!/[aeiouy]/.test(s)) return true;                       // no vowel → not a word (mgmt, wkly)
  if (s.length <= 3 && !LEXIS_SHORT_OK.has(s)) return true;   // short and not a real short word
  return false;
}

var LEXIS_FREQ = (function () {
  var B = { c: "common", m: "mid", l: "low", r: "rare" };
  var enc = "search c|may c|contact c|web c|services c|click c|date c|email c|used c|should c|post c|please c|available c|copyright c|message c|video c|rights c|links c|review c|order c|privacy c|items c|user c|general c|university c|january c|mail c|map c|reviews c|management c|united c|item c|must c|comments c|terms c|hotels c|using c|car c|posted c|address c|phone c|shipping c|reserved c|subject c|forum c|based c|check c|special c|index c|sign c|file c|south c|version c|section c|related c|security c|county c|american c|photo c|total c|download c|per c|access c|north c|resources c|current c|posts c|media c|pictures c|guide c|directory c|board c|location c|rating c|usa c|return c|sites c|profile c|previous c|events c|hours c|image c|department c|title c|description c|non c|insurance c|why c|shall c|property c|listing c|content c|reply c|december c|card c|source c|press c|print c|course c|teen c|stock c|credit c|join c|categories c|advanced c|west c|estate c|box c|conditions c|windows c|photos c|gay c|thread c|category c|note c|gallery c|register c|june c|october c|november c|library c|series c|features c|human c|provided c|yes c|required c|accessories c|forums c|march c|september c|july c|test c|server c|application c|cart c|staff c|san c|april c|users c|street c|topic c|comment c|standard c|blog c|login c|offers c|recent c|park c|act c|memory c|august c|quote c|options c|east c|single c|activities c|club c|girls c|additional c|password c|latest c|gift c|poker c|status c|browse c|range c|seller c|february c|audio c|files c|release c|analysis c|request c|fax c|picture c|needs c|possible c|might c|professional c|yet c|committee c|cards c|rss c|enter c|share c|garden c|added c|reference c|listed c|delivery c|popular c|term c|journal c|welcome c|central c|images c|original c|radio c|cell c|self c|council c|includes c|track c|discussion c|archive c|entertainment c|agreement c|format c|months c|log c|safety c|sure c|edition c|cars c|messages c|further c|updated c|association c|able c|having c|provides c|fun c|already c|common c|drive c|specific c|several c|gold c|called c|display c|limited c|powered c|means c|daily c|beach c|due c|electronics c|period c|database c|land c|average c|technical c|pro c|region c|island c|direct c|conference c|records c|district c|calendar c|front c|statement c|update c|ever c|downloads c|miles c|resource c|applications c|document c|works c|bill c|federal c|hosting c|final c|adult c|tickets c|centre c|requirements c|via c|cheap c|kids c|minutes c|else c|mark c|rock c|gifts c|europe c|topics c|individual c|tips c|plus c|auto c|cover c|edit c|together c|videos c|fast c|function c|unit c|lyrics c|subscribe c|submit c|included c|risk c|thanks c|deals c|various c|linux c|commercial c|weight c|advertising c|received c|newsletter c|archives c|magazine c|error c|camera c|construction c|toys c|registered c|clear c|golf c|domain c|chapter c|makes c|protection c|loan c|wide c|beauty c|manager c|listings c|engineering c|quick c|wireless c|license c|friday c|lake c|whole c|annual c|published c|later c|shows c|church c|active c|practice c|figure c|materials c|fire c|holiday c|chat c|designed c|speed c|loss c|discount c|higher c|created c|standards c|oil c|bit c|yellow c|advertise c|kingdom c|base c|french c|storage c|loans c|shoes c|entry c|orders c|availability c|africa c|summary c|notes c|agency c|king c|monday c|european c|copy c|western c|income c|employment c|overall c|bay c|river c|commission c|package c|contents c|port c|album c|started c|administration c|bar c|institute c|views c|double c|dog c|screen c|exchange c|types c|sponsored c|lines c|electronic c|benefits c|needed c|apply c|held c|printer c|condition c|effective c|asked c|eur c|sunday c|selection c|casino c|lost c|menu c|volume c|cross c|mortgage c|hope c|silver c|corporation c|wish c|mature c|rather c|addition c|certain c|usr c|executive c|lower c|union c|jewelry c|according c|particular c|names c|homepage c|gas c|skills c|bush c|islands c|advice c|military c|rental c|british c|teens c|pre c|huge c|facilities c|zip c|bid c|sellers c|middle c|cable c|opportunities c|division c|tuesday c|object c|lesbian c|appropriate c|logo c|length c|score c|statistics c|returns c|capital c|sample c|sent c|saturday c|christmas c|band c|flash c|choice c|registration c|thursday c|courses c|airport c|foreign c|furniture c|channel c|mode c|phones c|ideas c|wednesday c|structure c|summer c|contract c|button c|releases c|super c|male c|custom c|almost c|located c|multiple c|asian c|distribution c|editor c|inn c|industrial c|potential c|cnet c|los c|focus c|featured c|rooms c|female c|responsible c|communications c|associated c|cancer c|browser c|spring c|foundation c|friendly c|schedule c|documents c|communication c|purpose c|feature c|bed c|comes c|independent c|cameras c|brown c|physical c|operating c|hill c|maps c|deal c|ratings c|forms c|glass c|happy c|smith c|wanted c|developed c|thank c|safe c|unique c|survey c|prior c|telephone c|ready c|feed c|animal c|sources c|population c|regular c|secure c|navigation c|operations c|station c|christian c|round c|favorite c|option c|master c|valley c|rentals c|sea c|publications c|blood c|worldwide c|connection c|publisher c|hall c|larger c|anti c|parents c|transfer c|introduction c|strong c|tel c|wedding c|properties c|overview c|ship c|accommodation c|owners c|excellent c|paid c|perfect c|hair c|opportunity c|kit c|classic c|basis c|command c|cities c|express c|award c|distance c|tree c|assessment c|ensure c|thus c|involved c|extra c|interface c|partners c|rated c|guides c|maximum c|operation c|existing c|selected c|restaurants c|beautiful c|warning c|wine c|locations c|horse c|vote c|forward c|flowers c|stars c|lists c|owner c|animals c|useful c|directly c|manufacturer c|est c|mac c|housing c|takes c|iii c|gmt c|catalog c|searches c|max c|trying c|authority c|considered c|traffic c|programme c|joined c|input c|strategy c|feet c|agent c|valid c|bin c|senior c|teaching c|grand c|testing c|trial c|charge c|units c|instead c|canadian c|cool c|normal c|wrote c|enterprise c|ships c|entire c|educational c|metal c|positive c|chinese c|opinion c|asia c|football c|abstract c|uses c|output c|greater c|likely c|employees c|artists c|alternative c|processing c|responsibility c|resolution c|java c|guest c|seems c|publication c|pass c|relations c|trust c|van c|contains c|session c|multi c|photography c|republic c|fees c|components c|vacation c|century c|academic c|assistance c|completed c|skin c|graphics c|indian c|prev c|ads c|expected c|ring c|grade c|dating c|pacific c|mountain c|organizations c|pop c|filter c|mailing c|vehicle c|longer c|int c|northern c|panel c|german c|proposed c|default c|iraq c|boys c|outdoor c|deep c|otherwise c|allows c|rest c|protein c|plant c|reported c|hit c|transportation c|pool c|mini c|partner c|disclaimer c|boards c|faculty c|parties c|fish c|membership c|mission c|string c|modified c|pack c|released c|internal c|goods c|recommended c|born c|detailed c|japanese c|race c|approved c|background c|character c|maintenance c|ability c|maybe c|functions c|trademarks c|phentermine c|southern c|yourself c|winter c|battery c|youth c|pressure c|submitted c|debt c|keywords c|medium c|television c|interested c|core c|purposes c|sets c|dance c|wood c|msn c|itself c|defined c|playing c|awards c|fee c|studio c|reader c|virtual c|established c|rent c|las c|remote c|dark c|programming c|external c|apple c|regarding c|instructions c|min c|offered c|enjoy c|remove c|aid c|surface c|minimum c|visual c|host c|variety c|isbn c|manual c|block c|subjects c|agents c|increased c|repair c|fair c|civil c|steel c|fixed c|associates c|updates c|desktop c|classes c|gets c|sector c|capacity c|requires c|jersey c|fat c|fully c|electric c|instruments c|quotes c|officer c|driver c|dead c|respect c|unknown c|specified c|mike c|pst c|worth c|procedures c|poor c|eyes c|workers c|farm c|peace c|traditional c|campus c|tom c|creative c|coast c|benefit c|progress c|funding c|lord c|grant c|sub c|agree c|fiction c|hear c|watches c|goes c|led c|museum c|themselves c|fan c|transport c|interesting c|blogs c|evaluation c|accepted c|former c|implementation c|hits c|zone c|cat c|galleries c|references c|presented c|jack c|flat c|flow c|agencies c|literature c|respective c|spanish c|columbia c|setting c|scale c|highest c|helpful c|monthly c|frame c|musical c|definition c|secretary c|angeles c|networking c|path c|australian c|employee c|chief c|gives c|bottom c|magazines c|packages c|francisco c|changed c|pet c|heard c|individuals c|royal c|clean c|switch c|russian c|largest c|african c|titles c|relevant c|guidelines c|justice c|bible c|dev c|cup c|basket c|applied c|weekly c|vol c|installation c|described c|suite c|square c|chris c|attention c|advance c|skip c|diet c|army c|auction c|gear c|allowed c|correct c|lots c|piece c|sheet c|firm c|older c|elements c|species c|jump c|cells c|module c|resort c|facility c|random c|dvds c|certificate c|minister c|motion c|looks c|directions c|visitors c|documentation c|monitor c|forest c|calls c|coverage c|chance c|vision c|ball c|actions c|listen c|discuss c|accept c|automotive c|naked c|sold c|wind c|communities c|clinical c|situation c|sciences c|lowest c|highly c|publishing c|emergency c|currency c|leather c|determine c|temperature c|palm c|announcements c|actual c|stone c|bob c|commerce c|ringtones c|perhaps c|persons c|satellite c|fit c|tests c|village c|amateur c|met c|pain c|xbox c|factors c|coffee c|settings c|buyer c|steve c|easily c|oral c|ford c|poster c|edge c|functional c|root c|closed c|holidays c|ice c|pink c|zealand c|monitoring c|graduate c|replies c|shot c|architecture c|initial c|label c|sec c|league c|waste c|bus c|provider c|optional c|dictionary c|accounting c|manufacturing c|sections c|chair c|fishing c|phase c|fields c|bag c|fantasy c|motor c|professor c|context c|install c|shirt c|apparel c|continued c|mass c|crime c|count c|breast c|techniques c|quickly c|dollars c|religion c|claim c|driving c|permission c|surgery c|patch c|heat c|wild c|generation c|miss c|chemical c|brought c|himself c|component c|bug c|santa c|mid c|guarantee c|diamond c|israel c|soft c|servers c|alone c|seconds c|keyword c|interests c|congress c|fuel c|username c|produced c|italian c|paperback c|classifieds c|supported c|pocket c|saint c|rose c|freedom c|argument c|competition c|jim c|drugs c|joint c|premium c|providers c|fresh c|characters c|attorney c|upgrade c|factor c|thousands c|stream c|apartments c|hearing c|eastern c|auctions c|therapy c|entries c|dates c|generated c|signed c|upper c|administrative c|serious c|prime c|limit c|louis c|errors c|shops c|del c|efforts c|informed c|thoughts c|creek c|worked c|urban c|practices c|sorted c|reporting c|myself c|tours c|load c|affiliate c|labor c|immediately c|admin c|nursing c|defense c|designated c|tags c|heavy c|covered c|recovery c|joe c|guys c|integrated c|configuration c|merchant c|comprehensive c|expert c|universal c|solid c|cds c|presentation c|orange c|compliance c|vehicles c|theme c|rich c|campaign c|marine c|guitar c|finding c|ipod c|saying c|spirit c|claims c|challenge c|motorola c|acceptance c|strategies c|affairs c|touch c|intended c|hire c|election c|branch c|charges c|affiliates c|reasons c|magic c|mount c|smart c|talking c|ones c|latin c|multimedia c|certified c|corner c|rank c|computing c|element c|birth c|virus c|abuse c|interactive c|requests c|separate c|quarter c|procedure c|leadership c|tables c|define c|racing c|religious c|breakfast c|kong c|column c|plants c|faith c|chain c|developer c|identify c|avenue c|missing c|died c|approximately c|domestic c|sitemap c|recommendations c|moved c|comparison c|mental c|viewed c|extended c|sequence c|inch c|sorry c|centers c|lab c|reserve c|recipes c|cvs c|gamma c|plastic c|snow c|placed c|truth c|counter c|follows c|weekend c|camp c|ontario c|automatically c|des c|bridge c|native c|fill c|printing c|baseball c|owned c|approval c|draft c|chart c|played c|contacts c|jesus c|readers c|clubs c|lcd c|equal c|adventure c|matching c|shirts c|leaders c|posters c|institutions c|assistant c|variable c|advertisement c|parking c|headlines c|compared c|determined c|workshop c|codes c|kinds c|extension c|statements c|golden c|completely c|fort c|lighting c|senate c|forces c|funny c|gene c|turned c|portable c|tried c|electrical c|applicable c|disc c|returned c|pattern c|boat c|named c|theatre c|laser c|earlier c|manufacturers c|sponsor c|classical c|icon c|warranty c|dedicated c|direction c|harry c|basketball c|objects c|ends c|delete c|evening c|assembly c|nuclear c|taxes c|mouse c|signal c|criminal c|issued c|brain c|sexual c|powerful c|dream c|obtained c|false c|cast c|flower c|personnel c|passed c|supplied c|identified c|falls c|soul c|aids c|opinions c|promote c|stated c|stats c|professionals c|appears c|flag c|decided c|covers c|advantage c|hello c|priority c|newsletters c|adults c|clips c|savings c|graphic c|atom c|payments c|estimated c|binding c|brief c|ended c|anonymous c|iron c|straight c|script c|served c|wants c|miscellaneous c|prepared c|void c|dining c|alert c|integration c|tag c|interview c|mix c|framework c|disk c|installed c|queen c|vhs c|credits c|fix c|handle c|sweet c|desk c|criteria c|pubmed c|dave c|diego c|hong c|vice c|associate c|truck c|behavior c|enlarge c|ray c|frequently c|votes c|duty c|looked c|discussions c|bear c|festival c|laboratory c|ocean c|flights c|experts c|signs c|lack c|depth c|logged c|laptop c|vintage c|train c|exactly c|dry c|explore c|spa c|concept c|eligible c|checkout c|reality c|forgot c|handling c|origin c|gaming c|feeds c|billion c|destination c|faster c|intelligence c|bought c|con c|ups c|nations c|route c|followed c|specifications c|broken c|tripadvisor c|frank c|zoom c|blow c|battle c|residential c|anime c|decisions c|protocol c|query c|clip c|partnership c|editorial c|expression c|equity c|provisions c|speech c|wire c|principles c|suggestions c|rural c|shared c|replacement c|tape c|strategic c|judge c|spam c|acid c|bytes c|cent c|forced c|compatible c|apartment c|height c|null c|zero c|speaker c|filed c|netherlands c|consulting c|recreation c|managed c|failed c|marriage c|roll c|banks c|participants c|secret c|bath c|leads c|negative c|favorites c|theater c|springs c|var c|perform c|translation c|estimates c|font c|assets c|injury c|ministry c|drivers c|lawyer c|figures c|married c|protected c|proposal c|sharing c|portal c|waiting c|birthday c|beta c|gratis c|officials c|won c|slightly c|conduct c|contained c|lingerie c|legislation c|calling c|parameters c|jazz c|serving c|bags c|profiles c|comics c|doc c|postal c|controls c|combined c|ultimate c|representative c|frequency c|introduced c|departments c|residents c|noted c|displayed c|mom c|reduced c|physics c|rare c|spent c|performed c|extreme c|samples c|bars c|reviewed c|row c|forecast c|removed c|helps c|singles c|administrator c|cycle c|amounts c|accuracy c|dual c|usd c|sleep c|bird c|pharmacy c|static c|scene c|hunter c|addresses c|lady c|crystal c|famous c|writer c|chairman c|violence c|fans c|speakers c|academy c|dynamic c|gender c|permanent c|agriculture c|cleaning c|constitutes c|portfolio c|practical c|delivered c|collectibles c|infrastructure c|exclusive c|seat c|vendor c|originally c|utilities c|philosophy c|officers c|reduction c|aim c|bids c|referred c|supports c|nutrition c|recording c|regions c|junior c|toll c|les c|cape c|rings c|meaning c|tip c|wonderful c|ladies c|ticket c|announced c|guess c|agreed c|prevention c|ski c|soccer c|math c|import c|posting c|presence c|mentioned c|automatic c|healthcare c|viewing c|maintained c|increasing c|majority c|connected c|christ c|dan c|dogs c|directors c|aspects c|ahead c|moon c|participation c|scheme c|utility c|preview c|fly c|manner c|matrix c|combination c|devel c|amendment c|despite c|strength c|guaranteed c|turkey c|libraries c|proper c|distributed c|enterprises c|delta c|fear c|seeking c|inches c|convention c|shares c|principal c|standing c|comfort c|colors c|wars c|ordering c|alpha c|appeal c|cruise c|bonus c|certification c|previously c|hey c|bookmark c|buildings c|specials c|beat c|household c|batteries c|smoking c|bbc c|becomes c|drives c|arms c|tea c|improved c|trees c|avg c|positions c|dress c|subscription c|dealer c|contemporary c|sky c|nearby c|rom c|carried c|exposure c|hide c|permalink c|signature c|gambling c|refer c|miller c|provision c|outdoors c|caused c|luxury c|babes c|frames c|indeed c|newspaper c|toy c|circuit c|layer c|printed c|slow c|removal c|easier c|liability c|trademark c|hip c|printers c|faqs c|adding c|spot c|taylor c|trackback c|prints c|factory c|interior c|revised c|americans c|optical c|promotion c|relative c|amazing c|clock c|dot c|hiv c|identity c|suites c|conversion c|feeling c|hidden c|reasonable c|serial c|relief c|revision c|broadband c|pda c|rain c|dsl c|planet c|webmaster c|copies c|recipe c|zum c|permit c|seeing c|proof c|dna c|diff c|tennis c|bass c|prescription c|bedroom c|instance c|hole c|pets c|ride c|licensed c|specifically c|tim c|bureau c|represent c|conservation c|pair c|ideal c|specs c|recorded c|don c|pieces c|finished c|parks c|dinner c|lawyers c|stress c|cream c|runs c|yeah c|discover c|patterns c|boxes c|hills c|javascript c|fourth c|advisor c|marketplace c|evil c|aware c|evolution c|irish c|certificates c|objectives c|stations c|suggested c|remains c|acc c|greatest c|firms c|concerned c|euro c|operator m|structures m|generic m|encyclopedia m|usage m|cap m|ink m|charts m|mixed m|census m|interracial m|peak m|competitive m|exist m|wheel m|transit m|suppliers m|salt m|compact m|poetry m|lights m|tracking m|angel m|bell m|preparation m|attempt m|matches m|accordance m|width m|noise m|array m|discussed m|accurate m|reservations m|pin m|playstation m|alcohol m|greek m|instruction m|annotation m|raw m|walking m|smaller m|newest m|establish m|gnu m|happened m|expressed m|jeff m|extent m|sharp m|lesbians m|ben m|lane m|paragraph m|mathematics m|aol m|compensation m|export m|managers m|aircraft m|modules m|conflict m|conducted m|versions m|employer m|occur m|knows m|backup m|requested m|citizens m|heritage m|personals m|immediate m|trouble m|spread m|coach m|agricultural m|audience m|assigned m|jordan m|collections m|ages m|participate m|plug m|specialist m|virgin m|experienced m|investigation m|raised m|hat m|institution m|directed m|dealers m|searching m|sporting m|perl m|affected m|lib m|bike m|totally m|plate m|expenses m|indicate m|blonde m|proceedings m|transmission m|anderson m|utc m|characteristics m|der m|organic m|seek m|experiences m|albums m|cheats m|extremely m|verzeichnis m|contracts m|guests m|hosted m|diseases m|concerning m|developers m|equivalent m|chemistry m|tony m|neighborhood m|kits m|variables m|agenda m|anyway m|continues m|tracks m|advisory m|cam m|curriculum m|logic m|template m|prince m|circle m|soil m|grants m|psychology m|responses m|atlantic m|wet m|circumstances m|identification m|ram m|leaving m|wildlife m|appliances m|matt m|elementary m|speaking m|sponsors m|fox m|unlimited m|plain m|exit m|entered m|iran m|keys m|launch m|wave m|checking m|costa m|printable m|holy m|acts m|guidance m|mesh m|trail m|enforcement m|symbol m|crafts m|highway m|buddy m|hardcover m|observed m|dean m|setup m|poll m|booking m|glossary m|fiscal m|celebrity m|unix m|filled m|bond m|channels m|ericsson m|appendix m|notify m|blues m|chocolate m|pub m|portion m|scope m|supplier m|cables m|cotton m|bluetooth m|controlled m|requirement m|authorities m|biology m|dental m|killed m|border m|debate m|representatives m|starts m|pregnancy m|causes m|arkansas m|biography m|leisure m|attractions m|learned m|transactions m|notebook m|explorer m|historic m|attached m|opened m|husband m|disabled m|authorized m|crazy m|upcoming m|britain m|concert m|retirement m|scores m|financing m|efficiency m|comedy m|adopted m|efficient m|weblog m|linear m|commitment m|specialty m|bears m|jean m|hop m|carrier m|edited m|constant m|visa m|mouth m|jewish m|meter m|linked m|interviews m|concepts m|gun m|reflect m|pure m|wonder m|lessons m|fruit m|begins m|qualified m|reform m|lens m|alerts m|treated m|discovery m|draw m|mysql m|classified m|assume m|confidence m|alliance m|confirm m|offline m|leaves m|engineer m|lifestyle m|consistent m|replace m|clearance m|connections m|inventory m|converter m|organisation m|babe m|checks m|reached m|becoming m|safari m|objective m|indicated m|sugar m|crew m|legs m|sam m|stick m|securities m|pdt m|enabled m|genre m|slide m|volunteer m|tested m|rear m|democratic m|enhance m|exact m|bound m|parameter m|adapter m|processor m|node m|formal m|dimensions m|contribute m|lock m|hockey m|storm m|micro m|colleges m|laptops m|mile m|challenges m|editors m|mens m|threads m|bowl m|supreme m|brothers m|recognition m|presents m|ref m|tank m|submission m|dolls m|estimate m|encourage m|navy m|regulatory m|inspection m|cancel m|limits m|territory m|transaction m|weapons m|paint m|delay m|pilot m|outlet m|contributions m|continuous m|czech m|cambridge m|initiative m|novel m|pan m|execution m|disability m|ultra m|winner m|contractor m|episode m|examination m|potter m|dish m|plays m|bulletin m|indicates m|modify m|oxford m|adam m|truly m|epinions m|painting m|committed m|extensive m|affordable m|universe m|candidate m|databases m|patent m|slot m|psp m|outstanding m|perspective m|planned m|lodge m|messenger m|mirror m|tournament m|consideration m|discounts m|sterling m|sessions m|kernel m|stocks m|buyers m|journals m|gray m|catalogue m|antonio m|charged m|broad m|taiwan m|und m|chosen m|demo m|swiss m|hate m|terminal m|publishers m|behalf m|caribbean m|liquid m|rice m|loop m|salary m|reservation m|foods m|gourmet m|guard m|properly m|orleans m|nfl m|empire m|resume m|twenty m|newly m|raise m|prepare m|avatar m|illegal m|expansion m|vary m|hundreds m|arab m|lincoln m|helped m|premier m|purchased m|milk m|consent m|drama m|performing m|downtown m|keyboard m|contest m|collected m|bands m|boot m|suitable m|absolutely m|millions m|lunch m|audit m|push m|chamber m|guinea m|findings m|muscle m|featuring m|iso m|implement m|clicking m|scheduled m|polls m|typical m|tower m|sum m|calculator m|significantly m|chicken m|temporary m|attend m|shower m|alan m|tonight m|dear m|sufficient m|holdem m|shell m|province m|catholic m|oak m|vat m|awareness m|governor m|beer m|contribution m|measurement m|swimming m|spyware m|formula m|constitution m|packaging m|solar m|catch m|jane m|reliable m|consultation m|northwest m|sir m|doubt m|earn m|finder m|unable m|periods m|classroom m|democracy m|attacks m|kim m|wallpaper m|merchandise m|const m|resistance m|doors m|symptoms m|resorts m|biggest m|memorial m|visitor m|twin m|forth m|insert m|gateway m|dont m|alumni m|drawing m|candidates m|ordered m|biological m|transition m|happens m|preferences m|spy m|romance m|instrument m|bruce m|split m|themes m|heaven m|bits m|pregnant m|twice m|classification m|focused m|physician m|hollywood m|bargain m|wikipedia m|cellular m|asking m|blocks m|normally m|spiritual m|hunting m|diabetes m|suit m|shift m|chip m|res m|bodies m|photographs m|cutting m|wow m|simon m|writers m|marks m|flexible m|loved m|mapping m|numerous m|relatively m|birds m|satisfaction m|represents m|char m|indexed m|superior m|preferred m|saved m|paying m|cartoon m|shots m|intellectual m|granted m|choices m|carbon m|comfortable m|magnetic m|interaction m|listening m|effectively m|registry m|crisis m|outlook m|massive m|employed m|bright m|treat m|header m|poverty m|formed m|piano m|echo m|que m|grid m|sheets m|experimental m|puerto m|revolution m|consolidation m|displays m|plasma m|earnings m|voip m|mystery m|landscape m|dependent m|mechanical m|bidding m|consultants m|risks m|banner m|applicant m|charter m|fig m|cooperation m|counties m|acquisition m|ports m|implemented m|directories m|recognized m|dreams m|blogger m|notification m|licensing m|stands m|teach m|occurred m|textbooks m|rapid m|pull m|hairy m|diversity m|reverse m|deposit m|seminar m|investments m|latina m|nasa m|wheels m|specify m|accessibility m|dutch m|sensitive m|templates m|formats m|tab m|depends m|boots m|holds m|router m|concrete m|editing m|folder m|womens m|completion m|upload m|pulse m|universities m|technique m|contractors m|voting m|courts m|notices m|subscriptions m|calculate m|broadcast m|converted m|metro m|toshiba m|anniversary m|improvements m|strip m|specification m|pearl m|accident m|nick m|accessible m|accessory m|resident m|plot m|qty m|airline m|typically m|representation m|regard m|pump m|exists m|arrangements m|smooth m|conferences m|uniprotkb m|strike m|consumption m|flashing m|narrow m|afternoon m|threat m|surveys m|sitting m|putting m|consultant m|controller m|ownership m|committees m|legislative m|researchers m|trailer m|anne m|castle m|gardens m|missed m|unsubscribe m|antique m|labels m|willing m|molecular m|acting m|heads m|stored m|exam m|logos m|residence m|attorneys m|antiques m|density m|operators m|strange m|sustainable m|statistical m|beds m|mention m|innovation m|employers m|grey m|parallel m|amended m|operate m|bills m|bold m|bathroom m|stable m|opera m|definitions m|von m|lesson m|cinema m|asset m|scan m|elections m|drinking m|reaction m|blank m|enhanced m|entitled m|severe m|generate m|stainless m|newspapers m|hospitals m|deluxe m|humor m|aged m|monitors m|exception m|lived m|duration m|bulk m|successfully m|pursuant m|sci m|edt m|visits m|primarily m|tight m|domains m|capabilities m|pmid m|recommendation m|flying m|recruitment m|sin m|cute m|organized m|para m|adoption m|expensive m|pounds m|buffalo m|organisations m|plane m|explained m|seed m|programmes m|desire m|expertise m|mechanism m|camping m|jewellery m|meets m|welfare m|peer m|caught m|eventually m|marked m|driven m|measured m|medline m|bottle m|agreements m|innovative m|marshall m|massage m|rubber m|conclusion m|meat m|legend m|grace m|ing m|python m|monster m|alex m|bang m|villa m|bone m|columns m|disorders m|bugs m|collaboration m|hamilton m|detection m|ftp m|cookies m|inner m|formation m|tutorial m|med m|engineers m|entity m|cruises m|gate m|holder m|proposals m|moderator m|tutorials m|settlement m|roman m|duties m|valuable m|tone m|collectables m|ethics m|forever m|dragon m|busy m|captain m|fantastic m|imagine m|brings m|heating m|leg m|neck m|wing m|governments m|purchasing m|scripts m|abc m|stereo m|appointed m|taste m|dealing m|commit m|tiny m|operational m|rail m|airlines m|liberal m|livecam m|jay m|gap m|sides m|tube m|turns m|corresponding m|descriptions m|cache m|belt m|jacket m|determination m|animation m|oracle m|lease m|productions m|aviation m|hobbies m|proud m|excess m|disaster m|console m|commands m|telecommunications m|instructor m|giant m|achieved m|injuries m|shipped m|seats m|biz m|alarm m|voltage m|nintendo m|usual m|loading m|stamps m|appeared m|franklin m|angle m|rob m|vinyl m|highlights m|mining m|designers m|ongoing m|worst m|imaging m|betting m|scientists m|liberty m|blackjack m|argentina m|era m|convert m|possibility m|analyst m|commissioner m|dangerous m|garage m|exciting m|reliability m|thongs m|gcc m|unfortunately m|respectively m|volunteers m|attachment m|ringtone m|derived m|pleasure m|honor m|oriented m|eagle m|desktops m|pants m|columbus m|nurse m|prayer m|appointment m|workshops m|hurricane m|quiet m|luck m|postage m|producer m|represented m|mortgages m|dial m|responsibilities m|cheese m|comic m|carefully m|jet m|productivity m|investors m|crown m|par m|underground m|diagnosis m|maker m|crack m|principle m|picks m|vacations m|gang m|semester m|calculated m|fetish m|applies m|casinos m|appearance m|smoke m|apache m|filters m|incorporated m|craft m|cake m|notebooks m|apart m|fellow m|blind m|lounge m|mad m|algorithm m|semi m|coins m|andy m|gross m|strongly m|cafe m|valentine m|hilton m|ken m|proteins m|horror m|exp m|familiar m|capable m|debian m|till m|pen m|admission m|shoe m|elected m|victory m|sand m|terrorism m|joy m|editions m|mainly m|ethnic m|ran m|parliament m|actor m|finds m|seal m|situations m|fifth m|allocated m|citizen m|vertical m|corrections m|structural m|municipal m|describes m|prize m|occurs m|jon m|absolute m|disabilities m|consists m|anytime m|substance m|prohibited m|addressed m|lies m|pipe m|soldiers m|guardian m|lecture m|simulation m|layout m|initiatives m|ill m|concentration m|classics m|lbs m|lay m|interpretation m|horses m|lol m|dirty m|deck m|wayne m|donate m|taught m|bankruptcy m|optimization m|alive m|temple m|substances m|prove m|discovered m|wings m|breaks m|genetic m|restrictions m|participating m|waters m|promise m|thin m|exhibition m|prefer m|ridge m|cabinet m|modem m|mph m|sick m|dose m|evaluate m|tropical m|collect m|bet m|composition m|streets m|nationwide m|vector m|definitely m|shaved m|buffer m|purple m|existence m|commentary m|limousines m|developments m|def m|immigration m|destinations m|lets m|mutual m|pipeline m|necessarily m|syntax m|attribute m|prison m|skill m|chairs m|everyday m|apparently m|surrounding m|mountains m|moves m|popularity m|inquiry m|ethernet m|checked m|exhibit m|throw m|sierra m|visible m|cats m|desert m|postposted m|oldest m|rhode m|nba m|coordinator m|mercury m|handbook m|greg m|navigate m|summit m|victims m|epa m|spaces m|fundamental m|burning m|escape m|coupons m|somewhat m|receiver m|substantial m|progressive m|cialis m|boats m|glance m|scottish m|championship m|arcade m|richmond m|impossible m|ron m|tells m|obvious m|fiber m|depression m|graph m|covering m|platinum m|judgment m|bedrooms m|talks m|filing m|foster m|modeling m|passing m|awarded m|testimonials m|trials m|tissue m|memorabilia m|clinton m|masters m|bonds m|cartridge m|alberta m|explanation m|folk m|commons m|subsection m|fraud m|electricity m|permitted m|spectrum m|arrival m|okay m|pottery m|emphasis m|aspect m|workplace m|awesome m|mexican m|confirmed m|counts m|priced m|wallpapers m|hist m|crash m|lift m|desired m|inter m|closer m|assumes m|heights m|shadow m|riding m|infection m|firefox m|expense m|grove m|eligibility m|venture m|clinic m|korean m|healing m|princess m|mall m|entering m|packet m|spray m|studios m|involvement m|dad m|buttons m|placement m|observations m|vbulletin m|funded m|winners m|extend m|roads m|subsequent m|pat m|rolling m|fell m|motorcycle m|yard m|disclosure m|establishment m|memories m|arrived m|creates m|faces m|tourist m|mayor m|murder m|adequate m|senator m|yield m|presentations m|grades m|cartoons m|pour m|digest m|reg m|lodging m|tion m|dust m|hence m|wiki m|entirely m|replaced m|radar m|rescue m|undergraduate m|losses m|combat m|stopped m|occupation m|lakes m|donations m|associations m|citysearch m|closely m|radiation m|diary m|seriously m|kings m|shooting m|kent m|adds m|nsw m|ear m|flags m|pci m|baker m|launched m|elsewhere m|pollution m|conservative m|guestbook m|shock m|effectiveness m|walls m|abroad m|ebony m|tie m|ward m|drawn m|ian m|visited m|roof m|walker m|demonstrate m|atmosphere m|suggests m|kiss m|beast m|operated m|overseas m|purchases m|dodge m|counsel m|federation m|pizza m|invited m|yards m|assignment m|chemicals m|gordon m|mod m|farmers m|queries m|rush m|ukraine m|absence m|nearest m|cluster m|vendors m|mpeg m|yoga m|serves m|woods m|surprise m|lamp m|rico m|partial m|shoppers m|phil m|everybody m|couples m|ranking m|jokes m|cst m|ceo m|simpson m|twiki m|sublime m|counseling m|palace m|acceptable m|satisfied m|glad m|wins m|measurements m|verify m|globe m|trusted m|copper m|rack m|medication m|warehouse m|shareware m|rep m|dicke m|kerry m|receipt m|supposed m|ordinary m|ghost m|violation m|configure m|stability m|mit m|applying m|southwest m|boss m|pride m|institutional m|expectations m|independence m|reporter m|metabolism m|champion m|cloudy m|personally m|chile m|plenty m|solo m|sentence m|throat m|ignore m|uniform m|excellence m|wealth m|tall m|vacuum m|dancing m|attributes m|recognize m|brass m|writes m|plaza m|pdas m|survival m|quest m|publish m|sri m|screening m|toe m|thumbnail m|trans m|nova m|lifetime m|pioneer m|booty m|forgotten m|acrobat m|plates m|acres m|venue m|athletic m|thermal m|essays m|vital m|telling m|fairly m|coastal m|config m|charity m|intelligent m|excel m|modes m|obligation m|wake m|stupid m|harbor m|hungary m|traveler m|urw m|segment m|regardless m|lan m|enemy m|puzzle m|aluminum m|wells m|wishlist m|opens m|insight m|restricted m|republican m|secrets m|lucky m|latter m|merchants m|thick m|trailers m|repeat m|syndrome m|attendance m|penalty m|drum m|glasses m|enables m|nec m|iraqi m|builder m|vista m|chips m|terry m|flood m|foto m|ease m|arguments m|amsterdam m|arena m|adventures m|pupils m|announcement m|tabs m|appreciate m|expanded m|casual m|grown m|polish m|lovely m|extras m|centres m|clause m|smile m|lands m|troops m|indoor m|bulgaria m|armed m|broker m|charger m|regularly m|believed m|pine m|cooling m|tend m|gulf m|rick m|trucks m|mechanisms m|divorce m|shopper m|partly m|customize m|tradition m|candy m|pills m|tiger m|folks m|sensor m|exposed m|telecom m|hunt m|angels m|deputy m|indicators m|sealed m|thai m|emissions m|physicians m|loaded m|fred m|complaint m|scenes m|experiments m|afghanistan m|boost m|spanking m|scholarship m|governance m|mill m|founded m|supplements m|chronic m|icons m|moral m|den m|catering m|aud m|finger m|keeps m|pound m|locate m|camcorder m|trained m|burn m|implementing m|roses m|labs m|ourselves m|bread m|tobacco m|wooden m|motors m|tough m|incident m|gonna m|dynamics m|lie m|crm m|conversation m|chest m|pension m|billy m|revenues m|emerging m|worship m|capability m|craig m|herself m|producing m|churches m|precision m|damages m|reserves m|contributed m|solve m|shorts m|reproduction m|minority m|diverse m|amp m|ingredients m|johnny m|sole m|franchise m|recorder m|complaints m|facing m|promotions m|tones m|passion m|rehabilitation m|sight m|laid m|clay m|defence m|patches m|weak m|refund m|usc m|towns m|environments m|trembl m|divided m|reception m|amd m|wise m|emails m|cyprus m|odds m|correctly m|insider m|seminars m|consequences m|makers m|hearts m|geography m|integrity m|worry m|discrimination m|eve m|legacy m|marc m|pleased m|danger m|vitamin m|widely m|processed m|phrase m|genuine m|raising m|implications m|functionality m|paradise m|hybrid m|reads m|roles m|intermediate m|emotional m|sons m|leaf m|pad m|glory m|bigger m|billing m|diesel m|versus m|combine m|overnight m|geographic m|exceed m|rod m|saudi m|fault m|cuba m|hrs m|preliminary m|districts m|introduce m|silk m|promotional m|kate m|chevrolet m|babies m|compiled m|romantic m|revealed m|specialists m|generator m|albert m|examine m|jimmy m|graham m|suspension m|bristol m|compaq m|sad m|correction m|wolf m|slowly m|authentication m|communicate m|rugby m|supplement m|showtimes m|cal m|portions m|infant m|promoting m|sectors m|fluid m|grounds m|fits m|kick m|regards m|hurt m|machinery m|bandwidth m|unlike m|equation m|baskets m|probability m|pot m|dimension m|wright m|barry m|proven m|schedules m|admissions m|cached m|warren m|slip m|studied m|reviewer m|involves m|quarterly m|rpm m|devil m|grass m|comply m|florist m|illustrated m|cherry m|continental m|alternate m|deutsch m|achievement m|limitations m|webcam m|cuts m|funeral m|nutten m|earrings m|enjoyed m|automated m|chapters m|pee m|charlie m|quebec m|passenger m|convenient m|mars m|francis m|tvs m|sized m|manga m|noticed m|socket m|silent m|literary m|egg m|mhz m|signals m|caps m|orientation m|pill m|theft m|childhood m|swing m|symbols m|lat m|meta m|humans m|analog m|facial m|talent m|dated m|flexibility m|seeker m|wisdom m|shoot m|boundary m|mint m|packard m|offset m|payday m|elite m|spin m|holders m|believes m|swedish m|poems m|deadline m|jurisdiction m|robot m|displaying m|witness m|equipped m|encouraged m|sur m|winds m|powder m|broadway m|acquired m|assess m|wash m|cartridges m|stones m|entrance m|gnome m|roots m|declaration m|attempts m|gadgets m|noble m|automation m|rev m|gospel m|advantages m|shore m|loves m|induced m|knight m|preparing m|loose m|aims m|recipient m|extensions m|appeals m|earned m|illness m|islamic m|athletics m|southeast m|ieee m|alternatives m|pending m|determining m|lebanon m|corp m|personalized m|kennedy m|conditioning m|teenage m|soap m|triple m|cooper m|nyc m|vincent m|jam m|secured m|unusual m|answered m|partnerships m|destruction m|slots m|increasingly m|migration m|disorder m|routine m|toolbar m|basically m|rocks m|conventional m|titans m|applicants m|axis m|sought m|genes m|mounted m|habitat m|firewall m|median m|guns m|scanner m|occupational m|animated m|judicial m|rio m|adjustment m|hero m|integer m|treatments m|bachelor m|attitude m|camcorders m|engaged m|basics m|carpet m|struct m|lenses m|binary m|genetics m|attended m|difficulty m|punk m|collective m|coalition m|dropped m|enrollment m|duke m|pace m|wage m|producers m|collector m|arc m|hosts m|interfaces m|advertisers m|moments m|atlas m|strings m|dawn m|representing m|observation m|feels m|torture m|deleted m|coat m|mrs m|rica m|restoration m|convenience m|returning m|ralph m|opposition m|container m|defendant m|warner m|confirmation m|embedded m|inkjet m|supervisor m|wizard m|corps m|actors m|liver m|peripherals m|liable m|brochure m|bestsellers m|petition m|eminem m|recall m|antenna m|picked m|assumed m|departure m|belief m|killing m|bikini m|shoulder m|decor m|lookup m|harvard m|brokers m|roy m|ion m|diameter m|doll m|podcast m|peru m|interactions m|refine m|bidder m|singer m|herald m|literacy m|fails m|aging m|intervention m|fed m|plugin m|attraction m|diving m|invite m|modification m|latinas m|suppose m|customized m|reed m|moderate m|terror m|younger m|thirty m|mice m|opposite m|understood m|rapidly m|dealtime m|ban m|temp m|intro m|mercedes m|zus m|assurance m|clerk m|happening m|vast m|mills m|outline m|amendments m|tramadol m|holland m|receives m|jeans m|metropolitan m|compilation m|verification m|fonts m|ent m|odd m|wrap m|refers m|mood m|favor m|veterans m|quiz m|sigma m|attractive m|xhtml m|occasion m|recordings m|jefferson m|victim m|sleeping m|careful m|ext m|beam m|gardening m|obligations m|arrive m|orchestra m|sunset m|tracked m|minimal m|polyphonic m|lottery m|tops m|framed m|aside m|outsourcing m|licence m|adjustable m|allocation m|essay m|discipline m|amy m|demonstrated m|dialogue m|identifying m|alphabetical m|camps m|declared m|dispatched m|handheld m|trace m|disposal m|shut m|florists m|packs m|installing m|switches m|romania m|voluntary m|ncaa m|thou m|consult m|phd m|greatly m|blogging m|mask m|cycling m|midnight m|commonly m|photographer m|inform m|turkish m|coal m|cry m|messaging m|pentium m|quantum m|murray m|intent m|zoo m|largely m|pleasant m|announce m|constructed m|additions m|spoke m|aka m|arrow m|engagement m|sampling m|rough m|weird m|tee m|refinance m|lion m|inspired m|holes m|weddings m|blade m|suddenly m|oxygen m|cookie m|canyon m|goto m|meters m|calendars m|arrangement m|conclusions m|passes m|bibliography m|pointer m|compatibility m|stretch m|durham m|furthermore m|permits m|cooperative m|muslim m|neil m|sleeve m|netscape m|cleaner m|cricket m|beef m|feeding m|stroke m|township m|rankings m|measuring m|cad m|hats m|robin m|jacksonville m|strap m|headquarters m|crowd m|tcp m|transfers m|surf m|olympic m|transformation m|remained m|attachments m|dir m|entities m|customs m|administrators m|personality m|rainbow m|hook m|roulette m|decline m|gloves m|israeli m|medicare m|cord m|skiing m|cloud m|facilitate m|subscriber m|valve m|val m|hewlett m|explains m|proceed m|flickr m|feelings m|knife m|jamaica m|priorities m|shelf m|bookstore m|timing m|liked m|parenting m|adopt m|denied m|fotos m|incredible m|britney m|freeware m|donation m|outer m|crop m|deaths m|rivers m|commonwealth m|pharmaceutical m|manhattan m|tales m|katrina m|workforce m|islam m|nodes m|thumbs m|seeds m|cited m|lite m|ghz m|hub m|targeted m|organizational m|skype m|realized m|twelve m|founder m|decade m|gamecube m|dispute m|portuguese m|tired m|titten m|adverse m|excerpt m|eng m|steam m|discharge m|drinks m|ace m|voices m|acute m|halloween m|climbing m|stood m|sing m|tons m|perfume m|carol m|honest m|albany m|hazardous m|restore m|stack m|methodology m|sue m|housewares m|reputation m|resistant m|democrats m|recycling m|hang m|gbp m|curve m|creator m|amber m|qualifications m|museums m|slideshow m|tracker m|variation m|passage m|transferred m|trunk m|hiking m|pierre m|jelsoft m|headset m|photograph m|colombia m|waves m|camel m|distributor m|lamps m|underlying m|hood m|wrestling m|suicide m|archived m|photoshop m|chi m|arabia m|gathering m|projection m|juice m|chase m|mathematical m|logical m|sauce m|fame m|extract m|specialized m|diagnostic m|panama m|indianapolis m|payable m|corporations m|courtesy m|criticism m|automobile m|confidential m|rfc m|statutory m|accommodations m|athens m|northeast m|downloaded m|judges m|seo m|retired m|isp m|remarks m|detected m|decades m|paintings m|walked m|arising m|nissan m|bracelet m|ins m|eggs m|juvenile m|injection m|yorkshire m|populations m|protective m|afraid m|acoustic m|railway m|cassette m|initially m|indicator m|pointed m|mistake m|norton m|locked m|eliminate m|fusion m|mineral m|sunglasses m|ruby m|steering m|beads m|fortune m|preference m|canvas m|threshold m|parish m|claimed m|screens m|cemetery m|planner m|croatia m|flows m|stadium m|venezuela m|exploration m|mins m|fewer m|sequences m|coupon m|nurses m|ssl m|stem m|proxy m|astronomy m|lanka m|opt m|drew m|contests m|flu m|translate m|announces m|mlb m|costume m|tagged m|berkeley m|voted m|killer m|bikes m|gates m|adjusted m|rap m|tune m|bishop m|pulled m|corn m|shaped m|compression m|seasonal m|establishing m|farmer m|counters m|puts m|constitutional m|grew m|perfectly m|tin m|slave m|instantly m|cultures m|norfolk m|coaching m|examined m|trek m|encoding m|litigation m|submissions m|oem m|heroes m|painted m|lycos m|zdnet m|broadcasting m|horizontal m|artwork m|cosmetic m|resulted m|portrait m|terrorist m|informational m|ethical m|carriers m|ecommerce m|mobility m|floral m|builders m|ties m|struggle m|schemes m|suffering m|neutral m|fisher m|rat m|spears m|prospective m|bedding m|ultimately m|joining m|heading m|equally m|artificial m|bearing m|spectacular m|coordination m|connector m|brad m|combo m|seniors m|guilty m|affiliated m|activation m|naturally m|haven m|tablet m|jury m|dos m|tail m|subscribers m|charm m|lawn m|violent m|underwear m|basin m|soup m|potentially m|ranch m|constraints m|crossing m|inclusive m|dimensional m|cottage m|drunk m|considerable m|crimes m|resolved m|mozilla m|byte m|toner m|nose m|latex m|branches m|anymore m|oclc m|delhi m|holdings m|alien m|locator m|processors m|pantyhose m|plc m|broke m|nepal m|zimbabwe m|difficulties m|juan m|complexity m|msg m|constantly m|browsing m|resolve m|barcelona m|presidential m|documentary m|cod m|territories m|thesis m|thru m|jews m|nylon m|palestinian m|discs m|rocky m|bargains m|frequent m|trim m|ceiling m|pixels m|ensuring m|hispanic m|legislature m|hospitality m|gen m|procurement m|diamonds m|espn m|fleet m|untitled m|bunch m|totals m|marriott m|singing m|theoretical m|afford m|exercises m|starring m|referral m|nhl m|surveillance m|optimal m|quit m|distinct m|protocols m|lung m|highlight m|substitute m|inclusion m|hopefully m|brilliant m|turner m|sucking m|cents m|reuters m|gel m|todd m|spoken m|omega m|evaluated m|stayed m|civic m|assignments m|manuals m|doug m|sees m|termination m|watched m|saver m|thereof m|grill m|households m|redeem m|grain m|aaa m|authentic m|regime m|wanna l|wishes l|bull l|montgomery l|architectural l|louisville l|differ l|macintosh l|movements l|ranging l|monica l|repairs l|breath l|amenities l|virtually l|cole l|mart l|candle l|hanging l|colored l|authorization l|tale l|verified l|lynn l|formerly l|projector l|situated l|comparative l|std l|seeks l|herbal l|loving l|strictly l|routing l|docs l|stanley l|psychological l|surprised l|retailer l|vitamins l|elegant l|gains l|renewal l|vid l|genealogy l|opposed l|deemed l|scoring l|expenditure l|brooklyn l|sisters l|critics l|connectivity l|spots l|algorithms l|hacker l|similarly l|margin l|coin l|solely l|fake l|salon l|collaborative l|norman l|fda l|excluding l|turbo l|headed l|voters l|cure l|madonna l|commander l|arch l|thinks l|thats l|suggestion l|hdtv l|soldier l|asin l|aimed l|bomb l|harm l|interval l|mirrors l|spotlight l|tricks l|reset l|brush l|investigate l|thy l|expansys l|panels l|repeated l|assault l|spare l|logistics l|deer l|tongue l|bowling l|tri l|danish l|pal l|monkey l|proportion l|filename l|skirt l|florence l|honey l|analyzes l|drawings l|scenario l|lovers l|atomic l|approx l|symposium l|arabic l|gauge l|essentials l|junction l|faced l|mat l|solving l|transmitted l|weekends l|screenshots l|produces l|oven l|ted l|intensive l|chains l|kingston l|sixth l|engage l|deviant l|noon l|switching l|quoted l|adapters l|correspondence l|farms l|imports l|supervision l|cheat l|bronze l|expenditures l|sandy l|separation l|testimony l|suspect l|celebrities l|macro l|sender l|mandatory l|boundaries l|syndication l|gym l|celebration l|kde l|adjacent l|filtering l|tuition l|spouse l|exotic l|viewer l|signup l|threats l|luxembourg l|puzzles l|damaged l|cams l|receptor l|laugh l|joel l|surgical l|destroy l|citation l|pitch l|autos l|premises l|proved l|offensive l|imperial l|dozen l|deployment l|teeth l|cloth l|studying l|colleagues l|stamp l|lotus l|salmon l|olympus l|separated l|proc l|cargo l|tan l|directive l|salem l|mate l|starter l|upgrades l|likes l|butter l|pepper l|weapon l|luggage l|burden l|chef l|tapes l|zones l|races l|isle l|stylish l|slim l|maple l|luke l|grocery l|offshore l|governing l|retailers l|depot l|comp l|alt l|pie l|blend l|harrison l|occasionally l|cbs l|attending l|emission l|pete l|spec l|finest l|realty l|bow l|penn l|recruiting l|apparent l|instructional l|phpbb l|autumn l|probe l|midi l|permissions l|biotechnology l|toilet l|ranked l|jackets l|routes l|packed l|excited l|outreach l|helen l|mounting l|recover l|tied l|lopez l|balanced l|prescribed l|timely l|talked l|debug l|delayed l|chuck l|reproduced l|hon l|dale l|explicit l|calculation l|villas l|ebook l|consolidated l|exclude l|peeing l|occasions l|brooks l|equations l|newton l|oils l|exceptional l|anxiety l|bingo l|whilst l|spatial l|respondents l|ceramic l|prompt l|precious l|minds l|annually l|considerations l|scanners l|atm l|xanax l|pays l|fingers l|sunny l|ebooks l|delivers l|queensland l|necklace l|musicians l|leeds l|composite l|unavailable l|cedar l|arranged l|lang l|theaters l|advocacy l|raleigh l|stud l|fold l|essentially l|designing l|threaded l|qualify l|blair l|hopes l|assessments l|cms l|mason l|diagram l|burns l|pumps l|footwear l|vic l|peoples l|victor l|mario l|pos l|attach l|licenses l|utils l|removing l|advised l|brunswick l|spider l|phys l|ranges l|pairs l|sensitivity l|trails l|preservation l|hudson l|isolated l|calgary l|interim l|assisted l|divine l|streaming l|approve l|chose l|compound l|intensity l|technological l|syndicate l|abortion l|dialog l|venues l|blast l|wellness l|calcium l|newport l|antivirus l|addressing l|pole l|discounted l|indians l|shield l|harvest l|membrane l|prague l|previews l|constitute l|locally l|concluded l|pickup l|desperate l|mothers l|nascar l|iceland l|demonstration l|governmental l|manufactured l|candles l|graduation l|mega l|bend l|sailing l|variations l|moms l|sacred l|addiction l|chrome l|tommy l|springfield l|refused l|brake l|exterior l|greeting l|ecology l|oliver l|congo l|glen l|botswana l|nav l|delays l|synthesis l|olive l|undefined l|unemployment l|cyber l|scored l|enhancement l|newcastle l|clone l|velocity l|lambda l|relay l|composed l|tears l|performances l|oasis l|baseline l|cab l|angry l|societies l|silicon l|brazilian l|identical l|petroleum l|compete l|ist l|norwegian l|lover l|belong l|honolulu l|beatles l|lips l|retention l|exchanges l|pond l|rolls l|thomson l|barnes l|soundtrack l|wondering l|malta l|daddy l|ferry l|rabbit l|profession l|seating l|dam l|cnn l|separately l|physiology l|lil l|collecting l|das l|exports l|tire l|participant l|scholarships l|recreational l|dominican l|chad l|electron l|loads l|friendship l|heather l|passport l|motel l|unions l|treasury l|warrant l|sys l|solaris l|frozen l|occupied l|josh l|royalty l|scales l|rally l|observer l|sunshine l|strain l|drag l|ceremony l|somehow l|arrested l|provincial l|investigations l|icq l|ripe l|yamaha l|medications l|hebrew l|gained l|rochester l|dying l|laundry l|stuck l|solomon l|placing l|stops l|homework l|adjust l|assessed l|advertiser l|encryption l|filling l|downloadable l|sophisticated l|imposed l|silence l|scsi l|focuses l|soviet l|possession l|laboratories l|treaty l|vocal l|trainer l|organ l|stronger l|volumes l|advances l|vegetables l|lemon l|toxic l|dns l|thumbnails l|darkness l|pty l|nuts l|nail l|bizrate l|vienna l|implied l|span l|stanford l|sox l|stockings l|joke l|respondent l|packing l|statute l|rejected l|satisfy l|destroyed l|shelter l|chapel l|gamespot l|layers l|guided l|vulnerability l|accountability l|celebrate l|accredited l|appliance l|compressed l|bahamas l|mixture l|bench l|univ l|tub l|rider l|scheduling l|radius l|perspectives l|mortality l|logging l|hampton l|christians l|borders l|therapeutic l|pads l|butts l|inns l|bobby l|impressive l|sheep l|accordingly l|architect l|railroad l|lectures l|challenging l|wines l|nursery l|harder l|cups l|ash l|microwave l|cheapest l|accidents l|travesti l|relocation l|stuart l|contributors l|salvador l|ali l|salad l|monroe l|tender l|violations l|foam l|temperatures l|paste l|clouds l|competitions l|discretion l|tft l|tanzania l|preserve l|jvc l|poem l|unsigned l|cosmetics l|easter l|theories l|repository l|praise l|venice l|concentrations l|estonia l|christianity l|veteran l|streams l|landing l|signing l|executed l|katie l|negotiations l|realistic l|showcase l|integral l|asks l|relax l|namibia l|generating l|congressional l|synopsis l|prairie l|reunion l|composer l|bean l|sword l|absent l|photographic l|sells l|ecuador l|hoping l|accessed l|spirits l|modifications l|coral l|pixel l|float l|colin l|bias l|imported l|paths l|bubble l|por l|acquire l|contrary l|millennium l|tribune l|vessel l|acids l|focusing l|viruses l|cheaper l|admitted l|dairy l|admit l|mem l|fancy l|equality l|samoa l|tap l|stickers l|fisheries l|exceptions l|reactions l|leasing l|beliefs l|macromedia l|companion l|squad l|analyze l|scroll l|divisions l|swim l|wages l|additionally l|suffer l|forests l|fellowship l|nano l|invalid l|concerts l|martial l|males l|victorian l|retain l|execute l|tunnel l|genres l|cambodia l|patents l|copyrights l|chaos l|lithuania l|wheat l|chronicles l|obtaining l|beaver l|updating l|distribute l|readings l|decorative l|kijiji l|confused l|compiler l|enlargement l|eagles l|bases l|vii l|accused l|bee l|campaigns l|unity l|loud l|conjunction l|bride l|rats l|defines l|airports l|instances l|indigenous l|begun l|cfr l|brunette l|packets l|anchor l|socks l|validation l|parade l|corruption l|stat l|trigger l|incentives l|cholesterol l|gathered l|essex l|slovenia l|notified l|differential l|beaches l|folders l|dramatic l|surfaces l|terrible l|routers l|pendant l|dresses l|baptist l|scientist l|starsmerchant l|hiring l|clocks l|arthritis l|bios l|females l|wallace l|nevertheless l|reflects l|taxation l|fever l|pmc l|cuisine l|surely l|practitioners l|transcript l|myspace l|theorem l|inflation l|thee l|ruth l|pray l|stylus l|compounds l|pope l|drums l|contracting l|arnold l|structured l|reasonably l|jeep l|chicks l|bare l|hung l|cattle l|mba l|radical l|graduates l|rover l|recommends l|controlling l|treasure l|reload l|distributors l|flame l|levitra l|tanks l|assuming l|monetary l|elderly l|pit l|mono l|particles l|floating l|extraordinary l|tile l|indicating l|bolivia l|spell l|hottest l|stevens l|coordinate l|kuwait l|exclusively l|alleged l|limitation l|widescreen l|compile l|webster l|struck l|illustration l|plymouth l|warnings l|construct l|inquiries l|bridal l|annex l|mag l|gsm l|inspiration l|tribal l|curious l|freight l|rebate l|meetup l|eclipse l|sudan l|ddr l|downloading l|rec l|shuttle l|aggregate l|stunning l|cycles l|affects l|forecasts l|detect l|actively l|ciao l|ampland l|knee l|prep l|chem l|fastest l|butler l|shopzilla l|injured l|decorating l|payroll l|cookbook l|expressions l|ton l|courier l|uploaded l|shakespeare l|hints l|collapse l|americas l|connectors l|unlikely l|pros l|conflicts l|techno l|beverage l|tribute l|wired l|elvis l|immune l|latvia l|travelers l|forestry l|barriers l|cant l|rarely l|gpl l|infected l|offerings l|genesis l|barrier l|argue l|incorrect l|trains l|metals l|bicycle l|furnishings l|letting l|arise l|guatemala l|celtic l|irc l|jamie l|particle l|perception l|minerals l|advise l|humidity l|bottles l|boxing l|bangkok l|renaissance l|pathology l|bra l|ordinance l|photographers l|infections l|chess l|operates l|brisbane l|configured l|survive l|oscar l|festivals l|menus l|possibilities l|duck l|canal l|amino l|phi l|contributing l|herbs l|clinics l|mls l|cow l|manitoba l|analytical l|missions l|lying l|costumes l|strict l|dive l|saddam l|circulation l|drill l|offense l|bryan l|cet l|protest l|assumption l|jerusalem l|hobby l|tries l|transexuales l|invention l|nickname l|fiji l|technician l|inline l|executives l|enquiries l|washing l|audi l|staffing l|cognitive l|exploring l|trick l|enquiry l|closure l|raid l|ppc l|timber l|volt l|intense l|div l|playlist l|registrar l|showers l|supporters l|ruling l|steady l|dirt l|statutes l|withdrawal l|drops l|predicted l|wider l|saskatchewan l|cancellation l|plugins l|enrolled l|sensors l|screw l|ministers l|publicly l|hourly l|blame l|geneva l|freebsd l|veterinary l|acer l|prostores l|reseller l|dist l|handed l|suffered l|intake l|informal l|relevance l|incentive l|butterfly l|mechanics l|heavily l|swingers l|fifty l|headers l|mistakes l|numerical l|ons l|geek l|uncle l|defining l|counting l|reflection l|sink l|accompanied l|assure l|invitation l|devoted l|princeton l|sodium l|randy l|spirituality l|hormone l|meanwhile l|proprietary l|childrens l|brick l|grip l|naval l|thumbzilla l|medieval l|porcelain l|avi l|bridges l|pichunter l|watt l|thehun l|decent l|casting l|dayton l|translated l|shortly l|cameron l|columnists l|pins l|carlos l|reno l|andreas l|warrior l|diploma l|cabin l|innocent l|scanning l|ide l|consensus l|polo l|valium l|copying l|rpg l|delivering l|cordless l|horn l|eddie l|uganda l|fired l|journalism l|prot l|trivia l|perth l|frog l|grammar l|intention l|syria l|disagree l|klein l|harvey l|tires l|logs l|undertaken l|tgp l|hazard l|retro l|leo l|statewide l|semiconductor l|episodes l|boolean l|circular l|anger l|diy l|mainland l|illustrations l|suits l|chances l|interact l|snap l|happiness l|arg l|substantially l|bizarre l|glenn l|auckland l|olympics l|fruits l|identifier l|geo l|ribbon l|calculations l|doe l|jpeg l|conducting l|startup l|suzuki l|trinidad l|ati l|kissing l|wal l|handy l|swap l|exempt l|crops l|reduces l|accomplished l|calculators l|geometry l|impression l|abs l|slovakia l|flip l|guild l|correlation l|gorgeous l|capitol l|sim l|dishes l|rna l|barbados l|chrysler l|nervous l|refuse l|extends l|fragrance l|replica l|plumbing l|brussels l|tribe l|neighbors l|trades l|superb l|buzz l|transparent l|nuke l|rid l|trinity l|charleston l|handled l|legends l|boom l|calm l|champions l|floors l|selections l|projectors l|inappropriate l|exhaust l|speaks l|burton l|vocational l|davidson l|copied l|scotia l|farming l|gibson l|pharmacies l|fork l|troy l|roller l|introducing l|organize l|appreciated l|alter l|latino l|ghana l|edges l|mixing l|handles l|skilled l|fitted l|harmony l|distinguished l|asthma l|projected l|assumptions l|shareholders l|twins l|developmental l|rip l|zope l|regulated l|triangle l|amend l|anticipated l|oriental l|reward l|windsor l|zambia l|gmbh l|buf l|hydrogen l|webshots l|sprint l|comparable l|chick l|advocate l|sims l|confusion l|copyrighted l|tray l|inputs l|warranties l|genome l|escorts l|documented l|thong l|medal l|paperbacks l|coaches l|vessels l|walks l|sol l|keyboards l|sage l|knives l|eco l|vulnerable l|arrange l|artistic l|bat l|honors l|booth l|indie l|reflected l|unified l|bones l|breed l|detector l|ignored l|polar l|fallen l|precise l|sussex l|respiratory l|notifications l|msgid l|transexual l|mainstream l|invoice l|evaluating l|lip l|subcommittee l|sap l|gather l|suse l|maternity l|backed l|alfred l|colonial l|carey l|motels l|embassy l|cave l|journalists l|danny l|slight l|proceeds l|indirect l|amongst l|wool l|foundations l|msgstr l|arrest l|volleyball l|adipex l|horizon l|deeply l|toolbox l|ict l|marina l|liabilities l|prizes l|bosnia l|browsers l|decreased l|patio l|tolerance l|surfing l|creativity l|lloyd l|optics l|pursue l|lightning l|overcome l|eyed l|quotations l|grab l|inspector l|attract l|brighton l|beans l|bookmarks l|ellis l|disable l|snake l|leonard l|lending l|oops l|reminder l|searched l|behavioral l|riverside l|bathrooms l|plains l|sku l|insights l|abilities l|initiated l|sullivan l|midwest l|karaoke l|trap l|lonely l|fool l|nonprofit l|lancaster l|suspended l|hereby l|containers l|attitudes l|karl l|berry l|collar l|simultaneously l|racial l|integrate l|bermuda l|sociology l|mobiles l|screenshot l|exhibitions l|kelkoo l|confident l|retrieved l|exhibits l|officially l|consortium l|dies l|terrace l|bacteria l|pts l|replied l|seafood l|novels l|rrp l|recipients l|ought l|delicious l|traditions l|jail l|safely l|finite l|kidney l|periodically l|fixes l|sends l|durable l|mazda l|allied l|throws l|moisture l|hungarian l|roster l|referring l|symantec l|spencer l|nasdaq l|uruguay l|ooo l|transform l|timer l|tablets l|tuning l|gotten l|educators l|futures l|vegetable l|verse l|highs l|humanities l|independently l|custody l|scratch l|launches l|ipaq l|alignment l|britannica l|comm l|ellen l|competitors l|nhs l|rocket l|aye l|bullet l|towers l|racks l|lace l|nasty l|visibility l|latitude l|consciousness l|ste l|tumor l|ugly l|deposits l|mistress l|encounter l|trustees l|watts l|duncan l|reprints l|hart l|bernard l|resolutions l|ment l|accessing l|forty l|tubes l|attempted l|col l|midlands l|priest l|floyd l|analysts l|queue l|trance l|locale l|biol l|bundle l|hammer l|invasion l|witnesses l|runner l|rows l|administered l|notion l|skins l|mailed l|fujitsu l|spelling l|arctic l|exams l|rewards l|beneath l|strengthen l|frederick l|medicaid l|treo l|infrared l|seventh l|gods l|une l|welsh l|belly l|aggressive l|tex l|advertisements l|quarters l|stolen l|cia l|sublimedirectory l|soonest l|haiti l|disturbed l|determines l|sculpture l|poly l|ears l|dod l|fist l|naturals l|neo l|motivation l|lenders l|pharmacology l|fitting l|fixtures l|bloggers l|mere l|agrees l|passengers l|quantities l|petersburg l|consistently l|powerpoint l|cons l|surplus l|elder l|sonic l|obituaries l|cheers l|dig l|taxi l|punishment l|appreciation l|subsequently l|belarus l|nat l|zoning l|gravity l|providence l|thumb l|restriction l|incorporate l|backgrounds l|treasurer l|guitars l|essence l|flooring l|lightweight l|ethiopia l|mighty l|athletes l|humanity l|transcription l|holmes l|complications l|scholars l|dpi l|scripting l|gis l|remembered l|galaxy l|chester l|snapshot l|caring l|loc l|worn l|synthetic l|shaw l|segments l|testament l|expo l|dominant l|twist l|specifics l|itunes l|stomach l|partially l|buried l|newbie l|minimize l|darwin l|ranks l|wilderness l|debut l|generations l|tournaments l|bradley l|deny l|anatomy l|bali l|sponsorship l|headphones l|fraction l|trio l|proceeding l|cube l|defects l|volkswagen l|uncertainty l|breakdown l|milton l|marker l|reconstruction l|subsidiary l|strengths l|clarity l|rugs l|adelaide l|encouraging l|furnished l|monaco l|settled l|folding l|emirates l|terrorists l|airfare l|comparisons l|beneficial l|distributions l|vaccine l|belize l|fate l|viewpicture l|promised l|volvo l|penny l|robust l|bookings l|threatened l|minolta l|republicans l|discusses l|gui l|porter l|gras l|jungle l|ver l|responded l|rim l|abstracts l|zen l|ivory l|alpine l|dis l|prediction l|pharmaceuticals l|andale l|fabulous l|remix l|alias l|thesaurus l|individually l|battlefield l|literally l|newer l|kay l|ecological l|spice l|oval l|implies l|soma l|ser l|cooler l|appraisal l|consisting l|maritime l|periodic l|submitting l|overhead l|ascii l|prospect l|shipment l|breeding l|citations l|geographical l|donor l|mozambique l|tension l|benz l|trash l|shapes l|wifi l|tier l|fwd l|earl l|manor l|envelope l|homeland l|disclaimers l|championships l|excluded l|breeds l|rapids l|disco l|sheffield l|aus l|endif l|finishing l|emotions l|wellington l|incoming l|prospects l|lexmark l|cleaners l|bulgarian l|hwy l|eternal l|cashiers l|guam l|cite l|aboriginal l|rotation l|nam l|productive l|boulevard l|eugene l|gdp l|pig l|metric l|compliant l|minus l|penalties l|imagination l|hotmail l|refurbished l|armenia l|varied l|grande l|closest l|activated l|actress l|mess l|conferencing l|assign l|armstrong l|politicians l|trackbacks l|lit l|accommodate l|tigers l|aurora l|una l|slides l|milan l|premiere l|lender l|villages l|shade l|chorus l|rhythm l|digit l|argued l|dietary l|symphony l|clarke l|sudden l|accepting l|precipitation l|lions l|findlaw l|ada l|pools l|lyric l|claire l|isolation l|speeds l|sustained l|matched l|approximate l|rope l|carroll l|rational l|programmer l|fighters l|chambers l|dump l|greetings l|inherited l|warming l|incomplete l|vocals l|chronicle l|fountain l|chubby l|grave l|legitimate l|biographies l|burner l|yrs l|foo l|investigator l|gba l|plaintiff l|finnish l|gentle l|prisoners l|deeper l|muslims l|hose l|mediterranean l|nightlife l|footage l|howto l|worthy l|architects l|saints l|entrepreneur l|carries l|sig l|freelance l|duo l|excessive l|devon l|screensaver l|helena l|saves l|regarded l|valuation l|unexpected l|cigarette l|fog l|characteristic l|marion l|lobby l|egyptian l|tunisia l|metallica l|outlined l|consequently l|headline l|treating l|punch l|appointments l|str l|gotta l|cowboy l|narrative l|bahrain l|enormous l|karma l|consist l|queens l|academics l|pubs l|quantitative l|lucas l|screensavers l|subdivision l|tribes l|vip l|defeat l|clicks l|distinction l|honduras l|naughty l|hazards l|insured l|harper l|livestock l|mardi l|exemption l|tenant l|sustainability l|cabinets l|tattoo l|shake l|algebra l|shadows l|holly l|formatting l|silly l|nutritional l|yea l|mercy l|hartford l|freely l|marcus l|sunrise l|wrapping l|mild l|fur l|nicaragua l|weblogs l|timeline l|tar l|belongs l|readily l|affiliation l|soc l|fence l|nudist l|infinite l|ensures l|relatives l|lindsay l|clan l|legally l|shame l|satisfactory l|revolutionary l|bracelets l|sync l|civilian l|telephony l|fatal l|remedy l|realtors l|breathing l|briefly l|thickness l|adjustments l|graphical l|genius l|discussing l|aerospace l|fighter l|meaningful l|flesh l|retreat l|adapted l|estates l|rug l|democrat l|borough l|maintains l|shortcuts l|retained l|voyeurweb l|andrews l|marble l|extending l|specifies l|hull l|logitech l|surrey l|briefing l|belkin l|dem l|accreditation l|wav l|blackberry l|highland l|meditation l|modular l|microphone l|macedonia l|combining l|instrumental l|giants l|organizing l|shed l|balloon l|moderators l|winston l|memo l|ham l|solved l|tide l|kazakhstan l|hawaiian l|standings l|partition l|invisible l|gratuit l|consoles l|funk l|fbi l|qatar l|magnet l|translations l|porsche l|cayman l|jaguar l|reel l|sheer l|commodity l|posing l|kilometers l|bind l|thanksgiving l|rand l|hopkins l|urgent l|guarantees l|infants l|gothic l|cylinder l|witch l|buck l|indication l|congratulations l|tba l|cohen l|sie l|usgs l|puppy l|kathy l|acre l|graphs l|surround l|cigarettes l|revenge l|expires l|enemies l|lows l|controllers l|aqua l|chen l|consultancy l|finances l|accepts l|enjoying l|conventions l|eva l|patrol l|smell l|pest l|italiano l|coordinates l|rca l|carnival l|roughly l|sticker l|promises l|responding l|reef l|physically l|divide l|stakeholders l|hydrocodone l|gst l|consecutive l|cornell l|satin l|bon l|deserve l|attempting l|mailto l|promo l|representations l|chan l|worried l|tunes l|garbage l|competing l|combines l|mas l|beth l|bradford l|len l|phrases l|kai l|peninsula l|chelsea l|boring l|reynolds l|dom l|jill l|accurately l|speeches l|reaches l|schema l|considers l|sofa l|catalogs l|ministries l|vacancies l|quizzes l|parliamentary l|obj l|prefix l|lucia l|savannah l|barrel l|typing l|nerve l|dans l|planets l|deficit l|boulder l|pointing l|renew l|coupled l|viii l|myanmar l|metadata l|circuits l|floppy l|handbags l|jar l|somerset l|incurred l|acknowledge l|thoroughly l|antigua l|nottingham l|thunder l|tent l|caution l|identifies l|questionnaire l|qualification l|locks l|modelling l|namely l|miniature l|hack l|dare l|euros l|interstate l|pirates l|aerial l|hawk l|consequence l|rebel l|systematic l|perceived l|origins l|hired l|makeup l|textile l|lamb l|madagascar l|tobago l|presenting l|cos l|troubleshooting l|uzbekistan l|indexes l|pac l|erp l|centuries l|magnitude l|hindu l|fragrances l|vocabulary l|licking l|earthquake l|vpn l|fundraising l|fcc l|markers l|weights l|albania l|geological l|assessing l|lasting l|wicked l|eds l|introduces l|kills l|roommate l|webcams l|pushed l|webmasters l|computational l|acdbentity l|participated l|junk l|handhelds l|wax l|lucy l|answering l|hans l|impressed l|slope l|reggae l|failures l|poet l|conspiracy l|surname l|theology l|nails l|evident l|whats l|rides l|rehab l|epic l|saturn l|organizer l|nut l|allergy l|sake l|twisted l|combinations l|preceding l|merit l|enzyme l|cumulative l|zshops l|planes l|edmonton l|tackle l|disks l|condo l|pokemon l|amplifier l|ambien l|arbitrary l|prominent l|retrieve l|lexington l|vernon l|sans l|worldcat l|titanium l|irs l|fairy l|builds l|contacted l|shaft l|lean l|bye l|cdt l|recorders l|occasional l|leslie l|casio l|deutsche l|ana l|postings l|innovations l|kitty l|postcards l|dude l|drain l|monte l|fires l|algeria l|blessed l|luis l|reviewing l|cardiff l|cornwall l|favors l|potato l|panic l|explicitly l|sticks l|leone l|transsexual l|citizenship l|excuse l|reforms l|basement l|onion l|strand l|sandwich l|lawsuit l|alto l|informative l|girlfriend l|bloomberg l|cheque l|hierarchy l|influenced l|banners l|reject l|eau l|abandoned l|circles l|italic l|beats l|merry l|mil l|scuba l|gore l|complement l|cult l|dash l|passive l|mauritius l|valued l|cage l|checklist l|requesting l|courage l|verde l|lauderdale l|scenarios l|gazette l|divx l|extraction l|batman l|elevation l|hearings l|hugh l|lap l|utilization l|beverages l|calibration l|jake l|eval l|efficiently l|anaheim l|ping l|textbook l|dried l|entertaining l|prerequisite l|luther l|frontier l|settle l|refugees l|knights l|hypothesis l|palmer l|medicines l|flux l|derby l|sao l|peaceful l|altered l|pontiac l|regression l|doctrine l|scenic l|trainers l|muze l|enhancements l|renewable l|intersection l|passwords l|sewing l|consistency l|collectors l|conclude l|munich l|oman l|celebs l|gmc l|azerbaijan l|lighter l|rage l|adsl l|prix l|astrology l|advisors l|pavilion l|tactics l|trusts l|occurring l|supplemental l|travelling l|talented l|annie l|pillow l|induction l|derek l|precisely l|shorter l|harley l|spreading l|provinces l|relying l|finals l|paraguay l|steal l|parcel l|refined l|fifteen l|widespread l|incidence l|fears l|predict l|boutique l|acrylic l|rolled l|tuner l|avon l|incidents l|rays l|asn l|shannon l|toddler l|enhancing l|flavor l|alike l|walt l|homeless l|horrible l|hungry l|metallic l|acne l|blocked l|interference l|warriors l|palestine l|listprice l|libs l|undo l|cadillac l|atmospheric l|malawi l|sagem l|knowledgestorm l|dana l|halo l|ppm l|curtis l|parental l|referenced l|strikes l|lesser l|publicity l|marathon l|ant l|proposition l|gays l|pressing l|gasoline l|apt l|dressed l|scout l|belfast l|exec l|dealt l|niagara l|inf l|eos l|warcraft l|charms l|catalyst l|trader l|bucks l|allowance l|vcr l|denial l|uri l|designation l|thrown l|prepaid l|raises l|gem l|duplicate l|electro l|criterion l|badge l|wrist l|civilization l|analyzed l|vietnamese l|heath l|tremendous l|ballot l|lexus l|varying l|remedies l|validity l|trustee l|maui l|weighted l|angola l|performs l|plastics l|realm l|corrected l|jenny l|helmet l|salaries l|postcard l|elephant l|yemen l|encountered l|tsunami l|scholar l|nickel l|internationally l|surrounded l|psi l|buses l|expedia l|geology l|pct l|creatures l|coating l|commented l|wallet l|cleared l|smilies l|vids l|accomplish l|boating l|drainage l|shakira l|corners l|broader l|vegetarian l|rouge l|yeast l|yale l|newfoundland l|qld l|pas l|clearing l|investigated l|ambassador l|coated l|intend l|contacting l|vegetation l|doom l|findarticles l|louise l|kenny l|specially l|owen l|routines l|hitting l|yukon l|beings l|bite l|issn l|aquatic l|reliance l|habits l|striking l|myth l|infectious l|podcasts l|singh l|gig l|gilbert l|sas l|ferrari l|continuity l|brook l|outputs l|phenomenon l|ensemble l|insulin l|assured l|biblical l|weed l|conscious l|accent l|mysimon l|eleven l|wives l|ambient l|utilize l|mileage l|oecd l|prostate l|adaptor l|auburn l|unlock l|hyundai l|pledge l|vampire l|relates l|nitrogen l|xerox l|dice l|merger l|softball l|referrals l|quad l|dock l|differently l|firewire l|mods l|nextel l|framing l|musician l|blocking l|rwanda l|sorts l|integrating l|vsnet l|limiting l|dispatch l|revisions l|papua l|restored l|hint l|armor l|riders l|chargers l|remark l|dozens l|varies l|msie l|reasoning l|liz l|rendered l|picking l|charitable l|guards l|annotated l|ccd l|convinced l|openings l|buys l|burlington l|replacing l|watershed l|councils l|occupations l|acknowledged l|kruger l|pockets l|granny l|pork l|equilibrium l|viral l|inquire l|pipes l|characterized l|laden l|aruba l|cottages l|realtor l|merge l|privilege l|edgar l|develops l|qualifying l|chassis l|dubai l|estimation l|barn l|pushing l|llp l|fleece l|pediatric l|boc l|fare l|asus l|pierce l|allan l|dressing l|techrepublic l|sperm l|bald l|filme l|craps l|fuji l|frost l|leon l|institutes l|mold l|dame l|sally l|yacht l|tracy l|prefers l|drilling l|brochures l|herb l|tmp l|alot l|ate l|breach l|whale l|traveller l|appropriations l|suspected l|tomatoes l|benchmark l|beginners l|instructors l|highlighted l|bedford l|stationery l|idle l|mustang l|unauthorized l|clusters l|antibody l|competent l|momentum l|fin l|wiring l|pastor l|mud l|calvin l|uni l|shark l|contributor l|demonstrates l|phases l|grateful l|emerald l|gradually l|laughing l|grows l|cliff l|desirable l|tract l|ballet l|journalist l|abraham l|bumper l|afterwards l|webpage l|religions l|garlic l|hostels l|shine l|senegal l|explosion l|banned l|wendy l|briefs l|signatures l|diffs l|cove l|mumbai l|ozone l|disciplines l|casa l|daughters l|conversations l|radios l|tariff l|nvidia l|opponent l|pasta l|simplified l|muscles l|serum l|wrapped l|swift l|motherboard l|runtime l|inbox l|focal l|bibliographic l|eden l|distant l|incl l|champagne l|ala l|decimal l|deviation l|superintendent l|propecia l|dip l|nbc l|samba l|hostel l|housewives l|employ l|mongolia l|penguin l|magical l|inspections l|irrigation l|miracle l|manually l|reprint l|reid r|hydraulic r|centered r|robertson r|flex r|yearly r|penetration r|wound r|belle r|rosa r|conviction r|hash r|omissions r|writings r|hamburg r|lazy r|mpg r|retrieval r|qualities r|cindy r|fathers r|carb r|charging r|cas r|marvel r|lined r|cio r|dow r|prototype r|importantly r|petite r|apparatus r|upc r|terrain r|dui r|pens r|yen r|strips r|gossip r|rangers r|nomination r|empirical r|rotary r|worm r|dependence r|discrete r|beginner r|boxed r|lid r|sexuality r|polyester r|cubic r|deaf r|commitments r|sapphire r|kinase r|skirts r|mats r|remainder r|crawford r|labeled r|privileges r|televisions r|specializing r|marking r|commodities r|pvc r|serbia r|sheriff r|griffin r|declined r|guyana r|spies r|blah r|mime r|neighbor r|motorcycles r|elect r|highways r|thinkpad r|concentrate r|intimate r|reproductive r|preston r|deadly r|feof r|bunny r|chevy r|molecules r|rounds r|longest r|refrigerator r|tions r|intervals r|sentences r|dentists r|usda r|exclusion r|workstation r|holocaust r|keen r|flyer r|peas r|dosage r|receivers r|urls r|disposition r|variance r|navigator r|investigators r|cameroon r|baking r|marijuana r|adaptive r|computed r|baths r|enb r|cathedral r|brakes r|nirvana r|fairfield r|owns r|til r|invision r|sticky r|destiny r|generous r|madness r|emacs r|climb r|blowing r|fascinating r|landscapes r|heated r|lafayette r|jackie r|wto r|computation r|hay r|cardiovascular r|sparc r|cardiac r|salvation r|dover r|adrian r|predictions r|accompanying r|vatican r|brutal r|learners r|selective r|arbitration r|configuring r|token r|editorials r|zinc r|sacrifice r|seekers r|guru r|isa r|removable r|convergence r|yields r|gibraltar r|levy r|suited r|numeric r|anthropology r|skating r|kinda r|aberdeen r|emperor r|grad r|malpractice r|dylan r|bras r|belts r|blacks r|educated r|rebates r|reporters r|burke r|proudly r|pix r|necessity r|rendering r|mic r|inserted r|pulling r|basename r|obesity r|curves r|suburban r|touring r|clara r|vertex r|hepatitis r|nationally r|tomato r|andorra r|waterproof r|expired r|travels r|flush r|waiver r|pale r|specialties r|humanitarian r|invitations r|functioning r|delight r|survivor r|cingular r|economies r|alexandria r|bacterial r|moses r|counted r|undertake r|declare r|continuously r|johns r|valves r|gaps r|impaired r|achievements r|donors r|tear r|jewel r|teddy r|convertible r|ata r|teaches r|ventures r|nil r|bufing r|stranger r|tragedy r|julian r|nest r|pam r|dryer r|painful r|velvet r|tribunal r|ruled r|nato r|pensions r|prayers r|funky r|secretariat r|nowhere r|cop r|paragraphs r|gale r|joins r|adolescent r|nominations r|wesley r|dim r|lately r|cancelled r|scary r|mattress r|mpegs r|brunei r|likewise r|banana r|introductory r|slovak r|cakes r|stan r|reservoir r|occurrence r|idol r|mixer r|remind r|worcester r|sbjct r|demographic r|charming r|mai r|tooth r|disciplinary r|annoying r|respected r|stays r|disclose r|affair r|drove r|washer r|upset r|restrict r|springer r|mines r|portraits r|rebound r|logan r|mentor r|interpreted r|evaluations r|fought r|baghdad r|elimination r|metres r|hypothetical r|immigrants r|complimentary r|helicopter r|pencil r|freeze r|performer r|abu r|titled r|commissions r|sphere r|powerseller r|moss r|ratios r|concord r|graduated r|endorsed r|surprising r|walnut r|lance r|ladder r|italia r|unnecessary r|dramatically r|liberia r|sherman r|cork r|maximize r|hansen r|senators r|workout r|mali r|yugoslavia r|bleeding r|characterization r|colon r|likelihood r|lanes r|purse r|fundamentals r|contamination r|mtv r|endangered r|compromise r|optimize r|stating r|dome r|caroline r|leu r|expiration r|namespace r|align r|peripheral r|bless r|engaging r|negotiation r|crest r|opponents r|triumph r|nominated r|confidentiality r|electoral r|changelog r|welding r|deferred r|alternatively r|heel r|alloy r|condos r|plots r|polished r|yang r|gently r|greensboro r|locking r|casey r|controversial r|draws r|fridge r|blanket r|bloom r|simpsons r|lou r|elliott r|recovered r|fraser r|justify r|upgrading r|blades r|pgp r|loops r|surge r|frontpage r|trauma r|tahoe r|advert r|possess r|demanding r|defensive r|sip r|flashers r|subaru r|forbidden r|vanilla r|programmers r|monitored r|installations r|deutschland r|picnic r|souls r|arrivals r|spank r|practitioner r|motivated r|dumb r|smithsonian r|hollow r|vault r|securely r|examining r|fioricet r|groove r|revelation r|pursuit r|delegation r|wires r|dictionaries r|mails r|backing r|greenhouse r|sleeps r|blake r|transparency r|dee r|travis r|endless r|figured r|orbit r|currencies r|niger r|bacon r|survivors r|positioning r|heater r|colony r|cannon r|circus r|promoted r|forbes r|mae r|moldova r|mel r|descending r|paxil r|spine r|trout r|enclosed r|feat r|temporarily r|ntsc r|cooked r|thriller r|transmit r|apnic r|fatty r|pressed r|frequencies r|scanned r|reflections r|hunger r|mariah r|sic r|municipality r|usps r|detective r|surgeon r|cement r|experiencing r|fireplace r|endorsement r|planners r|disputes r|textiles r|missile r|intranet r|closes r|seq r|psychiatry r|persistent r|conf r|marco r|assists r|summaries r|glow r|gabriel r|auditor r|wma r|aquarium r|violin r|prophet r|cir r|bracket r|looksmart r|isaac r|oxide r|oaks r|magnificent r|erik r|colleague r|naples r|promptly r|modems r|adaptation r|harmful r|paintball r|prozac r|sexually r|enclosure r|acm r|dividend r|newark r|paso r|glucose r|phantom r|norm r|playback r|supervisors r|westminster r|turtle r|ips r|distances r|absorption r|treasures r|dsc r|warned r|neural r|ware r|fossil r|mia r|hometown r|badly r|transcripts r|apollo r|wan r|disappointed r|persian r|continually r|communist r|collectible r|handmade r|greene r|entrepreneurs r|robots r|grenada r|creations r|jade r|scoop r|acquisitions r|foul r|keno r|gtk r|earning r|mailman r|sanyo r|nested r|biodiversity r|excitement r|somalia r|movers r|verbal r|blink r|presently r|seas r|carlo r|workflow r|mysterious r|novelty r|tiles r|voyuer r|librarian r|subsidiaries r|switched r|stockholm r|tamil r|garmin r|pose r|fuzzy r|indonesian r|grams r|therapist r|richards r|mrna r|budgets r|toolkit r|promising r|relaxation r|goat r|render r|carmen r|ira r|sen r|thereafter r|hardwood r|erotica r|temporal r|sail r|forge r|commissioners r|dense r|dts r|brave r|forwarding r|awful r|nightmare r|airplane r|reductions r|southampton r|istanbul r|impose r|organisms r|sega r|telescope r|viewers r|asbestos r|portsmouth r|cdna r|meyer r|enters r|pod r|savage r|advancement r|harassment r|willow r|resumes r|bolt r|gage r|throwing r|existed r|generators r|wagon r|barbie r|dat r|soa r|knock r|urge r|smtp r|generates r|potatoes r|thorough r|replication r|inexpensive r|kurt r|receptors r|peers r|roland r|optimum r|neon r|interventions r|quilt r|huntington r|creature r|mounts r|syracuse r|internship r|lone r|refresh r|aluminium r|snowboard r|beastality r|webcast r|michel r|evanescence r|subtle r|coordinated r|notre r|shipments r|maldives r|stripes r|firmware r|antarctica r|cope r|shepherd r|canberra r|cradle r|chancellor r|mambo r|lime r|kirk r|flour r|controversy r|legendary r|bool r|sympathy r|choir r|beautifully r|blond r|expects r|cho r|jumping r|fabrics r|antibodies r|polymer r|hygiene r|wit r|poultry r|virtue r|burst r|examinations r|surgeons r|bouquet r|immunology r|promotes r|mandate r|wiley r|departmental r|bbs r|spas r|ind r|corpus r|johnston r|terminology r|gentleman r|fibre r|reproduce r|convicted r|shades r|jets r|indices r|roommates r|adware r|qui r|intl r|threatening r|spokesman r|zoloft r|activists r|frankfurt r|prisoner r|daisy r|halifax r|encourages r|ultram r|cursor r|assembled r|earliest r|donated r|stuffed r|restructuring r|insects r|terminals r|crude r|morrison r|maiden r|simulations r|sufficiently r|examines r|viking r|myrtle r|bored r|cleanup r|yarn r|knit r|conditional r|mug r|crossword r|bother r|budapest r|conceptual r|knitting r|attacked r|bhutan r|liechtenstein r|mating r|compute r|redhead r|arrives r|translator r|automobiles r|tractor r|allah r|continent r|unwrap r|fares r|longitude r|resist r|challenged r|telecharger r|hoped r|pike r|safer r|insertion r|instrumentation r|ids r|hugo r|wagner r|constraint r|groundwater r|touched r|strengthening r|cologne r|gzip r|wishing r|ranger r|smallest r|insulation r|newman r|marsh r|ricky r|ctrl r|scared r|theta r|infringement r|bent r|laos r|subjective r|monsters r|asylum r|lightbox r|robbie r|stake r|cocktail r|outlets r|swaziland r|varieties r|arbor r|mediawiki r|configurations r|poison r";
  return enc.split("|").map(function (pair) {
    var sp = pair.lastIndexOf(" ");
    return { term: pair.slice(0, sp), band: B[pair.slice(sp + 1)] };
  }).filter(function (x) { return x.term && !lexisIsNoiseWord(x.term); });
})();

var LEXIS_COMMON = new Set("a about above account accounts achieve achieving across action activity actually add affect affecting after again against age ago air all allow allowing along also although always am among amount an ancient and another answer answers any anybody anyone anything anywhere app appear appearing approach approaches apps are area areas arm around art article articles artist arts as ask assist at attack attacking author authors avoid avoiding away baby back bad balance bank banking barely basic batch batches be became because become been before began begin beginning behind being believe believing below beside besides best better between beyond big black blue body book books both boy brand brands break breaking bring bringing brother budget build building built business businesses but buy buying by call came can capture captured capturing care career careers carry carrying case cases cash cause causing center certainly change changes changing child children choose choosing city class clearly client clients climate close closing clothes clothing code coding cold collection college color colour come coming community companies company compare comparing complete completing complex complicated computer computers concern concerns connect connecting consider considering consumer consumers contain containing continue continuing contrast control cook cooking corporate cost costs could countries country couple court create creating creation critical crucial cultural culture currently customer customers cut damage data daughter day days death decide deciding decision decrease defend defending degree degrees deliver demand demands depend depending describe describing design designer designs detail details develop developing development device devices did die difference differences different difficult digital director disease do doctor doctors does doing dollar done door down drink drop drug during each early earth easy eat eating economic economics economy education effect effects effort eight either empty enable enabling end ending energy engine engines english enough environment environmental equipment especially essential even event every everyone everything everywhere evidence example examples except exercise expand expanding expect experience experiment explain explaining eye fabric face fact facts fail failing failure fall falling families family far fashion father feedback feel felt few field fight fighting film films finally finance financial find fine finish first fitness five flight floor follow following food foot for force forget form forming found four free friend friends from full fund funds future gain gaining game games gave generally get getting girl give given giving global go goal goals going gone good got government great green ground group groups grow growing growth guy had half hand hands happen hard hardly hardware has have he head health healthy heart help helping her here herein hers high him his historical history hold holding home homes hospital hot hotel hour house houses how however hundred i idea if impact impacts importance important improve improvement improving in include including increase increases industries industry influence influences information inside instant interest international internet into invest investing investment investor involve involving is issue issues it its job jobs journey just keep keeping kept key kid kill kind kitchen knew know knowing knowledge known language languages large last late law laws lead leader leading learn learning least leave left legal less let letter letters level levels life light like line link linking list little live lives living local long look looking lose losing lot love low machine machines made main maintain maintaining major make making man manage managing manufacture many market marketing markets match material matter matters me meal meals mean meant measure measures medical medicine meet meeting meetings member members men merely method methods million mind mine minor minute mobile model models modern moment money month more moreover morning most mostly mother move movement movie movies moving much music my name nation national natural nature near nearly necessary need needing needle neither network networks never new news next nice night nights nine no nobody none nonetheless nor not nothing notice noticing now number numbers observe observing obtain obviously of off offer offering office offices official often old on once one online only onto open opening or organization other others our ours out outcome outcomes outfit outfits outside over own page pages paper papers parent part particularly parts party past patient patients pay payment people percent percentage performance person personal pick place places plan planning plans platform platforms play player players point points police policies policy political politics position possibly power powers present president pretty prevent preventing price prices pricing primary private probably problem problems process processes produce product production products profit profits program programs project projects propose protect protecting provide providing public purchase put quality quantity question questions quite rate rates ratio reach reaching read reading real realise realize realizing really reason receive receiving recently recommend record red reduce reducing regional regulation regulations regulator regulators relate relating relation relationship relationships rely remain remaining remarkable remarkably remember remembering reorder report reports require requiring research researcher respond response responsive restaurant result resulting results retail reveal reveals revenue right rigid rise rising road role room rule rules run running said sale sales same save saving saw say says school schools science scientific season seasons second secondary see seem seemed seeming seen select selecting sell selling send sending sense serve service set seven shape shaping she shop shopping short show showed showing shown side significance significant similar similarity simple simply since sister sit site six size sizes small so social society software solution solutions some somebody someone something sometimes somewhere son song songs soon sort sound sounds space speak spend spending sport sports stage stages stand star start starting state states stay staying step steps still stop stopping store stores stories story student students studies study stuff style styles succeed success successful such suggest suggesting supplies supply support supporting system systems table take taken taking talk tangible target targets task tasks tax teacher teachers team teams tech technologies technology tell ten text texts texture than that the their theirs them then theory there thereby therefore these they thing things think thinking third this those though thought thousand three through throughout time times to today told tomorrow too took tool tools top tour tourism toward towards town trade trading training travel traveling treatment trend trends trip trips true try turn turning two type under underneath understand understanding unless until unto up upon us use usually value values very view visit visiting voice wait walk wall want wanting war warm was watch watching water way ways we wear wearing weather website websites week weeks well went were what whatever when whenever where whereas wherein wherever whether which while white who whoever wholesale whom whose wife will win window winning with within without woman women word words work worker working world worlds worse would write writing written wrong year years yesterday you young your yours".split(" "));

var LEXIS_MORPH = { prefixes:[["counter","反/对"],["circum","环绕"],["contra","反对"],["trans","横跨/转变"],["inter","之间"],["super","超越/上"],["under","在下/不足"],["hyper","过度"],["multi","多"],["micro","微小"],["macro","大"],["retro","向后"],["extra","额外/超出"],["ultra","极度/超"],["fore","预先/前"],["over","过度/上"],["semi","半"],["anti","反对"],["auto","自己/自动"],["omni","全部"],["mono","单一"],["poly","多"],["post","之后"],["tele","远"],["para","旁/半"],["mis","错误/坏"],["dis","否定/分开"],["non","非"],["pre","之前"],["pro","向前/支持"],["sub","在下"],["com","共同"],["con","共同"],["col","共同"],["cor","共同"],["tri","三"],["uni","一"],["per","贯穿/彻底"],["epi","在上/在旁"],["syn","共同"],["sym","共同"],["dia","贯穿"],["ex","向外/前任"],["re","再次/向后"],["un","不/否定"],["in","不/向内"],["im","不/向内"],["il","不"],["ir","不"],["de","去除/向下/加强"],["en","使…"],["em","使…"],["bi","二"],["ab","离开"],["ad","朝向"],["be","使…"],["a","无/不"]], suffixes:[["ization","…化(名)"],["isation","…化(名)"],["ability","…能力(名)"],["ibility","…能力(名)"],["acious","充满…的(形)"],["icious","充满…的(形)"],["ation","行为/状态(名)"],["ition","行为/状态(名)"],["ement","结果(名)"],["ative","…性的(形)"],["itive","…性的(形)"],["logy","…学(名)"],["able","可…的(形)"],["ible","可…的(形)"],["tion","行为/状态(名)"],["sion","行为/状态(名)"],["ment","结果(名)"],["ness","状态/性质(名)"],["ance","状态(名)"],["ence","状态(名)"],["ious","充满…的(形)"],["eous","充满…的(形)"],["uous","充满…的(形)"],["ical","…的(形)"],["hood","状态(名)"],["ship","身份/状态(名)"],["ward","朝…方向"],["wise","在…方面"],["ize","使…(动)"],["ise","使…(动)"],["ify","使…(动)"],["ous","充满…的(形)"],["ive","…性的(形)"],["ial","…的(形)"],["ful","充满…的(形)"],["ist","…者(名)"],["ism","…主义(名)"],["ity","…性(名)"],["ent","…的/…者"],["ant","…的/…者"],["ary","…的/与…有关(形)"],["ory","…的(形)"],["ish","…的(形)"],["ate","使…/…的"],["age","行为/状态(名)"],["dom","领域/状态(名)"],["fy","使…(动)"],["al","…的(形)"],["ic","…的(形)"],["ly","…地(副)"],["er","…者/更…"],["or","…者"],["ee","被…者"],["ty","…性(名)"],["y","…的(形)"]], roots:{"act":["做", "action, react, activate"],"agr":["田地/农", "agriculture, agrarian"],"ann":["年", "annual, anniversary"],"enn":["年", "biennial, perennial"],"aqu":["水", "aquarium, aquatic"],"aud":["听", "audio, audience, auditory"],"bene":["好", "benefit, benevolent"],"bio":["生命", "biology, biography, antibiotic"],"brev":["短", "brief, abbreviate"],"cap":["拿/取", "capture, capable, capacity"],"capt":["拿/取", "captive, caption"],"cept":["拿/取", "accept, concept, intercept"],"ceive":["拿/取", "receive, perceive, conceive"],"ced":["行/让", "precede, recede"],"ceed":["行", "proceed, exceed, succeed"],"cess":["行/让", "access, process, recession"],"chron":["时间", "chronology, synchronize, chronic"],"cid":["切/杀/落", "decide, incident"],"cis":["切", "precise, scissors, concise"],"claim":["喊", "exclaim, proclaim, claim"],"clam":["喊", "clamor, proclamation"],"clud":["关闭", "include, exclude, conclude"],"clus":["关闭", "conclusion, exclusive, seclusion"],"cogn":["知道", "recognize, cognition"],"cord":["心", "cordial, accord, concord"],"corp":["身体", "corporate, corpse, corps"],"cred":["相信", "credit, credible, incredible"],"cur":["跑/流/关心", "current, occur, recur"],"curr":["跑/流", "current, curriculum"],"curs":["跑", "cursor, excursion, cursory"],"dem":["人民", "democracy, epidemic, demographic"],"dic":["说", "dedicate, indicate"],"dict":["说", "predict, dictate, verdict, contradict"],"doc":["教", "doctor, document, doctrine"],"duc":["引导", "educate, induce, produce"],"duct":["引导", "conduct, product, aqueduct"],"equ":["相等", "equal, equation, equator"],"fac":["做", "factory, facile, facilitate"],"fact":["做", "manufacture, benefactor, factor"],"fect":["做", "affect, perfect, infect"],"fic":["做", "fiction, efficient, sufficient"],"fer":["带来/搬运", "transfer, refer, prefer, offer"],"fid":["信任", "confide, fidelity, confident"],"fin":["结束/界限", "final, define, infinite"],"flect":["弯曲", "reflect, deflect"],"flex":["弯曲", "flexible, reflex"],"flu":["流", "fluent, influence, fluid"],"form":["形状", "reform, transform, uniform"],"fort":["强", "effort, fortify, comfort"],"fract":["破", "fracture, fraction"],"frag":["破", "fragment, fragile"],"gen":["产生/种类", "generate, genetic, genius"],"geo":["地球", "geography, geology, geometry"],"grad":["步/级", "gradual, graduate, upgrade"],"gress":["步/行", "progress, aggressive, regress"],"graph":["写/图", "photograph, biography, paragraph"],"gram":["写", "grammar, telegram, diagram"],"grat":["感激/愉快", "grateful, congratulate, gratitude"],"hydr":["水", "hydrant, dehydrate, hydrogen"],"ject":["投掷", "reject, project, inject, eject"],"jud":["判断", "judge, prejudice, judicial"],"junct":["连接", "junction, conjunction"],"lect":["选/读", "collect, elect, select"],"leg":["读/法", "legible, legal, legend"],"liber":["自由", "liberty, liberal, liberate"],"loc":["地方", "local, locate, dislocate"],"log":["词/学", "logic, dialogue, apology"],"loqu":["说", "eloquent, colloquial"],"luc":["光", "translucent, lucid"],"lum":["光", "illuminate, luminous"],"man":["手", "manual, manage, manuscript"],"manu":["手", "manufacture, manuscript"],"mar":["海", "marine, maritime, submarine"],"mater":["母", "maternal, material"],"matr":["母", "matrix, matriarch"],"med":["中间", "medium, mediate, medieval"],"memor":["记忆", "memory, memorial, memorable"],"ment":["心/想", "mental, comment, mention"],"meter":["测量", "meter, diameter, thermometer"],"metr":["测量", "metric, symmetry, geometry"],"migr":["迁移", "migrate, immigrant, emigrate"],"min":["小/突出", "minimum, diminish, minor"],"miss":["送", "mission, dismiss, submit"],"mit":["送", "submit, transmit, admit"],"mob":["动", "mobile, mobility"],"mot":["动", "motion, promote, emotion"],"mov":["动", "move, remove, movement"],"mort":["死", "mortal, immortal, mortgage"],"nat":["出生", "native, nation, natural"],"nov":["新", "novel, innovate, novice"],"nom":["名字/法则", "nominate, economy, autonomy"],"nym":["名字", "synonym, anonymous, antonym"],"oper":["工作", "operate, cooperate, opera"],"path":["感受/病", "sympathy, empathy, pathology"],"ped":["脚/儿童", "pedal, pedestrian, pedagogy"],"pod":["脚", "podium, tripod"],"pel":["推", "propel, expel, compel"],"puls":["推/跳动", "impulse, pulse, repulse"],"pend":["挂/悬", "depend, suspend, pending"],"pens":["挂/称/花费", "suspense, expensive, pension"],"phil":["爱", "philosophy, philanthropy"],"phon":["声音", "telephone, symphony, phonics"],"photo":["光", "photograph, photosynthesis"],"plic":["折叠", "complicate, duplicate, implicit"],"ply":["折叠", "apply, reply, imply"],"pon":["放置", "postpone, opponent, component"],"pos":["放置", "expose, compose, position"],"port":["携带", "import, export, transport"],"pot":["能力", "potent, potential, omnipotent"],"press":["压", "pressure, express, impress"],"prim":["第一", "primary, prime, primitive"],"quir":["寻求", "inquire, require, acquire"],"quis":["寻求", "acquisition, exquisite"],"quest":["寻求", "question, request, conquest"],"reg":["统治/规则", "regulate, region, regular"],"rect":["直/正", "correct, direct, rectify"],"rupt":["破裂", "erupt, corrupt, disrupt, bankrupt"],"scrib":["写", "describe, subscribe, scribble"],"script":["写", "manuscript, prescription, transcript"],"sect":["切", "section, dissect, insect"],"sens":["感觉", "sense, sensitive, sensation"],"sent":["感觉", "sentiment, consent, resent"],"sequ":["跟随", "sequence, consequent, subsequent"],"serv":["服务/保存", "serve, preserve, servant"],"sign":["标记", "signal, signature, significant"],"simil":["相似", "similar, simile, assimilate"],"sist":["站立", "assist, resist, consist"],"spec":["看", "species, specific, spectacle"],"spect":["看", "inspect, respect, spectator, prospect"],"spic":["看", "conspicuous, suspicious"],"spir":["呼吸", "inspire, spirit, respiration"],"sta":["站立", "stable, status, stationary"],"stat":["站立/状态", "status, statue, statistic"],"struct":["建造", "construct, structure, instruct"],"sum":["拿/总和", "assume, consume, summary"],"tact":["接触", "contact, tactile, intact"],"tang":["接触", "tangible, tangent"],"techn":["技艺", "technology, technique, technical"],"tele":["远", "telephone, television, telescope"],"tempor":["时间", "temporary, contemporary"],"ten":["持有", "tenant, tenacious, tenant"],"tain":["持有", "contain, retain, maintain"],"tent":["持有/伸展", "content, attention, tension"],"tend":["伸展", "extend, intend, tendency"],"tens":["伸展", "tension, intense, extensive"],"term":["界限/结束", "terminate, term, terminal"],"terr":["土地", "territory, terrain, terrace"],"test":["证明", "testify, protest, testimony"],"text":["编织", "texture, context, textile"],"therm":["热", "thermometer, thermal"],"tort":["扭曲", "distort, torture, contort"],"tract":["拉", "attract, extract, contract, distract"],"trib":["给予", "tribute, distribute, contribute"],"turb":["搅乱", "disturb, turbulent, perturb"],"vac":["空", "vacant, vacuum, evacuate"],"vad":["走", "invade, evade, pervade"],"vas":["走", "evasive, pervasive"],"val":["价值/强", "value, valid, evaluate"],"ven":["来", "convene, intervene, avenue"],"vent":["来", "prevent, invent, event"],"ver":["真实", "verify, verdict, veracity"],"verb":["词", "verbal, proverb, verbatim"],"vers":["转", "reverse, version, universe"],"vert":["转", "convert, divert, introvert"],"via":["路", "via, deviate, obvious"],"vid":["看", "video, evident, provide"],"vis":["看", "vision, visible, revise, supervise"],"vinc":["征服", "convince, invincible"],"vict":["征服", "victory, convict, evict"],"viv":["生命", "survive, revive, vivid"],"vit":["生命", "vital, vitamin, vitality"],"voc":["叫/声音", "vocal, advocate, vocation"],"vok":["叫", "invoke, provoke, revoke"],"vol":["意愿", "voluntary, volition, benevolent"],"volv":["滚/转", "involve, revolve, evolve"],"volu":["滚/转", "volume, revolution"],"sci":["知道", "science, conscious, conscience"],"soci":["社会/同伴", "social, associate, society"],"sol":["单独/太阳", "solo, solitude, solar"],"solv":["解开", "solve, dissolve, resolve"],"solu":["解开", "solution, soluble, absolute"],"son":["声音", "sonic, resonate, sonata"],"morph":["形态", "morphology, amorphous, metamorphosis"],"circ":["圆/环", "circle, circular, circuit"],"civ":["公民", "civil, civilian, civic"],"clar":["清楚", "clarify, clear, declare"],"commun":["共同", "community, communicate, common"],"counter":["反对", "counter, encounter, counteract"],"dur":["持久/硬", "durable, endure, duration"],"luct":["挣扎/斗争", "reluctant, ineluctable"],"gran":["谷粒/种子", "grain, granular, granule"],"dorm":["睡", "dormant, dormitory"],"magn":["大/宏大", "magnify, magnificent, magnitude"],"clin":["倾斜", "incline, decline, recline"],"cline":["倾斜", "recline, decline"],"plaud":["鼓掌/赞同", "applaud, plaudit"],"plaus":["鼓掌/赞同", "plausible, applause"],"nounc":["宣告", "announce, pronounce, denounce"],"nunci":["宣告", "enunciate, annunciation"],"sacr":["神圣", "sacred, sacrifice"],"sanct":["神圣", "sanctuary, sanctify, sanction"],"spond":["承诺/回应", "respond, correspond"],"spons":["承诺/回应", "response, sponsor, responsible"],"strict":["拉紧", "strict, restrict, constrict"],"string":["拉紧", "stringent, astringent"],"vor":["吞食", "carnivore, voracious, devour"],"fus":["倒/流", "confuse, infuse, transfusion"],"fund":["倒/基础", "refund, fundamental, profound"],"found":["倒/基础", "foundation, profound, founder"],"grav":["重", "gravity, grave, aggravate"],"lev":["举/轻", "elevate, lever, alleviate"],"gest":["携带/带来", "gesture, digest, suggest"],"her":["粘附", "adhere, coherent, inherent"],"hes":["粘附", "adhesive, cohesion, hesitate"],"cad":["落", "cadence, cascade"],"cas":["落/机遇", "occasion, casual"],"don":["给", "donate, pardon, donor"],"noc":["伤害", "innocent, innocuous"],"nox":["伤害", "noxious, obnoxious"],"plac":["取悦/平静", "placid, placate, complacent"],"ambul":["走", "ambulance, amble, ambulatory"],"greg":["群", "gregarious, aggregate, segregate"],"later":["边", "lateral, bilateral, unilateral"],"urb":["城市", "urban, suburb, urbane"],"vag":["漫游", "vague, vagrant, extravagant"],"vig":["活力/警觉", "vigor, vigilant, invigorate"],"dol":["悲/痛", "condole, doleful, indolent"],"secut":["跟随", "consecutive, persecute, execute"],"hib":["拥有/持", "inhibit, prohibit, exhibit"],"hab":["拥有/持", "habit, inhabit, rehabilitate"],"cede":["行/让步", "concede, cede"],"lig":["捆绑/选", "oblige, ligament, eligible"],"nect":["连接", "connect, annex"],"pass":["感受/通过", "passion, compassion, passage"],"pati":["忍受", "patient, compatible"],"flict":["打击", "conflict, inflict, afflict"],"gnos":["知道", "diagnosis, prognosis, agnostic"],"jur":["法/发誓", "jury, perjure, conjure"],"just":["公正/法", "justice, adjust, justify"],"lud":["玩/戏", "allude, illusion, prelude"],"lus":["玩/戏", "illusion, elude, collusion"],"ephemer":["朝生暮死/短暂", "ephemeral, ephemera"],"anthrop":["人类", "anthropology, misanthrope, philanthropy"],"chrom":["颜色", "chromatic, monochrome"],"cosm":["宇宙/秩序", "cosmos, cosmopolitan, microcosm"],"dox":["观点/正统", "orthodox, paradox"],"heli":["太阳", "helium, heliocentric"],"hetero":["不同", "heterogeneous, heterodox"],"homo":["相同", "homogeneous, homonym"],"phag":["吃", "esophagus, bacteriophage"],"phob":["恐惧", "phobia, claustrophobia"],"psych":["心灵/精神", "psychology, psyche, psychiatry"],"soph":["智慧", "philosophy, sophisticated, sophomore"],"theo":["神", "theology, atheist, theocracy"],"zo":["动物", "zoology, protozoa"]} };

// Break a word into prefix + root + suffix using the tables above. Offline,
// shared by the look-up panel and the saved-word detail so both stay identical.
function lexisAnalyzeMorph(word) {
  var w = (word || "").toLowerCase();
  if (/[^a-z]/.test(w) || w.length < 4) return null;
  var M = LEXIS_MORPH, stem = w, prefix = null, suffix = null, i, j;
  var rootKeys = Object.keys(M.roots).sort(function (a, b) { return b.length - a.length; });
  // longest known root sitting at the very start of the word — used to stop a short
  // prefix (bi-, de-, be-) from splitting it: bio·graphy not bi·ography, dem·ocracy not de·mocracy
  var head = null;
  for (j = 0; j < rootKeys.length; j++) { if (rootKeys[j].length >= 3 && w.indexOf(rootKeys[j]) === 0) { head = rootKeys[j]; break; } }
  for (i = 0; i < M.prefixes.length; i++) {
    var p = M.prefixes[i][0];
    if (p.length >= 2 && stem.indexOf(p) === 0 && stem.length - p.length >= 3) {
      if (head && head.length > p.length) break; // a longer root starts here — don't strip into it
      prefix = { type: "prefix", text: p, meaning: M.prefixes[i][1] }; stem = stem.slice(p.length); break;
    }
  }
  for (i = 0; i < M.suffixes.length; i++) {
    var s = M.suffixes[i][0];
    if (stem.length - s.length >= 2 && stem.slice(-s.length) === s) { suffix = { type: "suffix", text: s, meaning: M.suffixes[i][1] }; stem = stem.slice(0, -s.length); break; }
  }
  // prefer the longest known root anchored at the stem start, then longest anywhere in the stem
  var root = null;
  for (j = 0; j < rootKeys.length; j++) { if (rootKeys[j].length >= 3 && stem.indexOf(rootKeys[j]) === 0) { root = rootKeys[j]; break; } }
  if (!root) for (j = 0; j < rootKeys.length; j++) { if (rootKeys[j].length >= 3 && stem.indexOf(rootKeys[j]) >= 0) { root = rootKeys[j]; break; } }
  if (!root) for (j = 0; j < rootKeys.length; j++) { if (rootKeys[j].length >= 4 && w.indexOf(rootKeys[j]) >= 0) { root = rootKeys[j]; break; } }
  var parts = [];
  if (prefix) parts.push(prefix);
  if (root) parts.push({ type: "root", text: root, meaning: M.roots[root][0], eg: M.roots[root][1] || "" });
  else parts.push({ type: "root", text: stem || w, meaning: "" });
  if (suffix) parts.push(suffix);
  // only worth a "word parts" card if we actually recognised a root or a real prefix —
  // a lone known suffix (…al, …ous) would just show an empty "词根义未收录" and helps nobody
  var meaningful = root || (prefix && prefix.meaning);
  if (!meaningful) return null;
  return { parts: parts };
}

// =====================================================================
// UNIFIED USAGE-SCENE TAXONOMY — one 9-key palette shared by words, phrases,
// idioms AND Discover articles, so "分类方式互相对齐": every content type in
// Discover is grouped the same way (plus frequency, which stays the primary
// sort). Word classification is a keyword/morpheme heuristic and returns null
// when unsure (no tag shown); phrase/idiom classification is a curated map
// (LEXIS_PHRASE_SCENE / LEXIS_IDIOM_SCENE, hand-tagged against these same
// keys); article classification (lexisArticleScene, app.js) runs the same
// word-level heuristic over the title/snippet text.
var LEXIS_SCENE_CN = {
  tech: "Tech", biz: "Business", sci: "Science", health: "Health",
  fin: "Finance", law: "Law & society", arts: "Arts & culture", comm: "Communication", risk: "Risk & judgement",
  emot: "Emotion", people: "People & family", time: "Time", move: "Movement",
  desc: "Description", place: "Places & travel", food: "Food & home", nature: "Nature",
  body: "Body & senses", edu: "Learning", quant: "Quantity",
  general: "Everyday",
};

// Broad keyword → scene lexicon so Discover and the Notebook can classify EVERYDAY
// words too, not just specialised jargon. ~2,200 entries across 20 scenes; checked
// before the regex rules. v1.52.0 widened this from 9 scenes / ~580 words, where
// 93% of the pool fell through to "general" and the category chips were useless.
var LEXIS_SCENE_WORDS = (function () {
  var groups = {
    tech: "computer software hardware data internet network device digital app application code coding program programmer system screen phone mobile smartphone online click upload download file server cloud tech gadget robot sensor chip pixel cyber wireless signal battery laptop tablet camera stream streaming platform interface bug update install setup account login password username email website webpage browser search engine algorithm automation gaming console keyboard mouse monitor router printer scanner memory storage backup encrypt virtual bandwidth firewall database dashboard plugin widget prototype toolkit compiler debug latency protocol terminal desktop offline sync syncing archive folder rendering pixelated firmware analytics telemetry hosting domain cache codec video videos audio image images picture pictures photo photos link links site sites websites web page pages user users profile logon logout register registration mail inbox spam attachment downloads uploads files format formats print scan copy paste edit editing editor version versions updates upgrade installation uninstall config configuration settings menu button toolbar sidebar homepage blog blogs blogger forum forums thread threads post posts comment comments feed feeds newsletter subscribe subscription unsubscribe keyword keywords tag tags index directory catalog archives traffic clicks browse window windows display resolution graphics template script scripting function functions input output processing buffer default remote access secure security encryption virus antivirus restore command java python javascript developer development machine machines electronic electronics devices bluetooth networking modem satellite ebook multimedia",
    biz: "business company companies market marketing sale sales customer client product production productivity manager management manage managing employee employer staff team teamwork office corporate corporation firm industry industrial enterprise startup founder executive director supervisor colleague coworker workplace career job jobs hire hiring recruit recruiting resume interview promotion salary wage contract negotiate negotiation deal deadline meeting agenda project strategy strategic tactic operations logistics supply chain vendor supplier retail retailer wholesale merchandise merchandising inventory warehouse shipment shipping distribution brand branding campaign advertising advertisement consumer competitor competition benchmark forecast quota target revenue turnover overhead outsourcing stakeholder shareholder headquarters subsidiary franchise procurement compliance workflow onboarding appraisal performance milestone deliverable roadmap pipeline pitch proposal invoice partnership merger acquisition service services businesses industries commercial commerce trade trading order orders item items products manufacture manufacturer manufacturing seller sellers buyer buyers purchase purchasing delivery deliveries stock stocks store stores shop shopping shopper cart checkout offer offers deals discount coupon selling sold price prices pricing quote quotes bid bidding auction auctions customers clients consumers markets advertise ads agency agencies agent agents partner partners association organization organizations department departments division offices employees employment careers recruitment vacancy position positions role roles managers executives directors administration administrative operational projects programs plan plans planning schedule contracts agreement meetings conference presentation report reports proposals billing accounts efficiency quality standard standards process processes procedure procedures policy guidelines audit assessment evaluation review reviews rating ratings feedback survey surveys questionnaire",
    sci: "science scientific scientist research researcher study studies experiment experimental laboratory lab theory theoretical hypothesis evidence analysis analyse analyze method methodology observation observe measure measurement sample variable control result findings conclusion physics chemistry chemical biology biological molecule molecular atom atomic electron proton neutron cell cells gene genetic genome dna evolution species organism bacteria microscope telescope astronomy planet planetary orbit gravity energy mass velocity acceleration temperature pressure density reaction compound element isotope catalyst enzyme protein equation formula calculation statistic statistical probability correlation causation empirical peer replication specimen simulation model modelling quantum sciences experiments test testing methods theories results conclusions finding statistics samples technology technical engineering engineer engineers mechanical electrical material materials structure structural systems component components mechanism functional models precision accuracy specification technique techniques innovation invention discovery",
    health: "health healthy healthcare medicine medical medication drug drugs doctor physician nurse hospital clinic patient patients treatment therapy therapist surgery surgeon diagnosis diagnose symptom symptoms disease illness sick sickness infection infected vaccine vaccination immune immunity antibiotic prescription pharmacy dose dosage recovery recover heal healing injury injured wound pain painful chronic acute cancer diabetes allergy allergic fever cough headache nausea insomnia fatigue stress anxiety depression mental wellbeing nutrition nutrient diet dietary calorie vitamin supplement exercise fitness workout training cardio strength muscle muscular stamina endurance flexibility hydration sleep rest recuperate rehabilitation checkup screening dentist dental wellness doctors nurses hospitals clinics treatments surgical diseases condition conditions injuries relief cure care caring nursing vision eye hearing emotional lifestyle nutritional weight exercises gym yoga sleeping vitamins supplements calories organic natural herbal",
    fin: "money finance financial bank banking savings saving deposit withdraw loan lend borrow credit debit debt interest rate mortgage investment invest investor fund funds portfolio share shares bond equity dividend capital asset assets liability profit loss income earnings expense expenditure cost budget budgeting tax taxes taxation refund insurance premium payment pay payroll cash currency exchange inflation deflation recession economy economic economics gdp trader broker hedge valuation liquidity solvency accounting accountant balance statement receipt transaction transfer installment collateral bankruptcy fintech wallet crypto cryptocurrency bitcoin markdown margin bill bills payments paid paying costs fee fees charge charges rates rebate card cards funding financing expenses spending investing investors value worth profitable losses loans lending borrowing banker transfers withdrawal coverage claim claims dollar dollars euro pound commission bonus wages pension retirement estate property",
    law: "law legal lawyer attorney court judge jury trial case lawsuit sue plaintiff defendant prosecution defence defense verdict sentence appeal testimony witness clause obligation rights right duty legislation legislature statute regulation regulate regulatory policies government governor governance parliament congress senate election elect vote voter voting democracy democratic republic constitution constitutional amendment citizen citizenship immigration visa passport border refugee asylum treaty diplomacy diplomatic sanction crime criminal offence offense theft fraud corruption bribery penalty fine punishment prison jail arrest police authority jurisdiction license permit privacy censorship protest activism reform welfare municipal laws legally courts judges trials cases sued suing witnesses appeals terms agreements obligations liable warranty guarantee guarantees disclaimer copyright trademark trademarks patent patents licence licensing permission permits regulations comply governments federal state county council councils committee authorities statutes act acts elections votes voters republican political politics politician citizens military army navy war peace penalties fines officer officers justice freedom liberty equality discrimination confidential confidentiality",
    arts: "art arts artist artistic painting painter paint sculpture sculptor gallery museum exhibition exhibit design designer aesthetic aesthetics style stylish fashion fashionable clothing garment textile fabric couture tailor pattern music musician musical song singer sing band album concert orchestra symphony melody rhythm harmony instrument guitar piano violin drum film movie cinema cinematic actor actress acting scene screenplay documentary theatre theater drama play playwright stage dance dancer ballet choreography literature literary novel novelist poetry poem poet prose fiction nonfiction author writer writing narrative story storytelling character plot genre culture cultural heritage tradition traditional folklore mythology myth history historical historian archaeology photograph photography photographer portrait landscape architecture architect craft handmade artisan artists designs designers styles clothes apparel garments shoes shoe dress dresses shirt shirts jeans jacket coat suit suits leather cotton silk wool jewelry jewellery diamond gold silver watch watches accessory accessories bag bags handbag perfume cosmetics makeup beauty hair salon songs singers bands albums track tracks lyrics concerts drums radio dj remix films movies studio studios actors producer scenes episode episodes series season show shows entertainment television celebrity star stars fan fans book books novels stories authors writers publication publications publisher publishing published magazine magazines journal journals article articles chapter chapters poems historic ancient antique classic classical modern contemporary drawing sketch crafts decor decoration decorative interior game games toy toys puzzle sport sports football soccer basketball baseball tennis golf hockey teams league championship tournament match matches player players coach",
    comm: "communication communicate conversation converse talk talking speak speaking speech say tell discuss discussion debate argue argument dialogue chat message text call reply respond response answer question ask inquiry explain explanation clarify clarification describe description express expression mention remark announce announcement declare inform notify notice sharing present persuade persuasion convince agree disagree disagreement apologize apology thank gratitude greet greeting introduce introduction invite invitation compliment praise criticize criticism suggest suggestion advise advice recommend recommendation warn remind confirm deny refuse accept reject rapport small gossip podcast broadcast media journalist journalism headline audience listener speaker contact contacts communications messages letter letters note notes calls telephone fax texting replies responses answers questions asking request requests inquiries opinion opinions suggestions information informed notification news press reporting reporter interviews publish sent send sending receive received receiving forward welcome thanks please sorry detail details confirmation social friend friends community topic topics subject",
    risk: "risk risky risks chance chances danger dangerous safe safety threat threats mistake mistakes fail failure success succeed win winning lose losing try trying effort efforts focus priority priorities doubt fear worry confidence courage patience caution warning avoid prevent prepare decide decision decisive choose choice option alternative tradeoff dilemma uncertainty uncertain probable likely unlikely gamble bet wager speculate speculation cautious reckless prudent deliberate hesitate hesitation commit commitment consequence outcome fallback contingency mitigate mitigation exposure vulnerable vulnerability resilience resilient robust fragile setback crisis emergency urgent urgency problem problems issue issues trouble difficulty difficulties challenge challenges solution solutions solve solving fix fixing repair error errors fault faults bugs failed successful won lost protect protection protective careful prevention avoiding decisions choices options select selection selected prefer preference consider considering judgement judgment evaluate compare comparison controlling handle handling responsible responsibility ability able capable opportunity opportunities possible possibility potential probably perhaps maybe",
    emot: "emotion feeling feel feels mood happy happiness glad joy joyful delight delighted pleased pleasure cheerful content contented satisfied satisfaction sad sadness unhappy sorrow grief grieve miserable depressed melancholy angry anger furious rage irritated irritation annoyed annoying frustrated frustration resentment bitter afraid scared frightened terrified anxious nervous worried uneasy calm calmness relaxed relieved peaceful serene excited excitement thrilled eager enthusiastic enthusiasm passionate passion love loving affection affectionate fond adore hate hatred dislike disgust ashamed shame embarrassed embarrassment guilt guilty proud pride jealous jealousy envy envious lonely loneliness homesick nostalgic nostalgia hopeful hope hopeless despair disappointed disappointment surprised surprise shocked amazed astonished curious curiosity bored boredom tired weary grateful thankful sympathetic sympathy empathy compassion kind kindness cruel mean generous selfish humble modest arrogant confident shy timid brave bold cowardly stubborn impatient honest dishonest loyal sincere cheeky temperament personality mindset attitude loves like likes liked favorite favourite enjoy enjoyed enjoyment fun comfort comfortable relax relaxing quiet hates upset regret frustrating concern concerned stressed hopes hoping wish wishes want wants wanted need needs needed desire interested interesting exciting amazing wonderful awesome cool nice lovely beautiful attractive charming respect trust trusted honesty friendly behavior behaviour feelings emotions",
    people: "people person family families parent parents mother father mom dad son daughter child children kid kids baby infant toddler teenager teen adult sibling brother sister grandparent grandmother grandfather grandchild aunt uncle cousin nephew niece relative relatives spouse husband wife marriage married marry wedding divorce divorced engagement fiance couple boyfriend girlfriend date dating romance romantic friendship acquaintance neighbour neighbor neighbourhood society relationship companion companionship roommate guest host visitor stranger crowd group gathering reunion generation ancestor descendant heir household upbringing parenting childhood adolescence adulthood elderly senior youth mentor babysitter nanny caregiver custody adoption rivalry persons individual individuals human humans man men woman women boy boys girl girls babies adults teenagers seniors sons daughters couples single relationships member members membership groups communities population public guests visitors name names surname personal identity gender male female age club union foundation charity volunteer volunteers crew",
    time: "time times timing moment moments instant second minute hour day days week weeks month months year years decade century era epoch period phase spring summer autumn fall winter morning noon afternoon evening night midnight dawn dusk sunrise sunset today tomorrow yesterday now then soon later earlier early late lately recently recent current currently past future eventually finally already still yet always never sometimes often frequently rarely seldom occasionally usually normally constantly continuously daily weekly monthly yearly annual annually temporary permanent brief briefly lengthy duration interval delay postpone defer scheduling calendar appointment overdue punctual prompt immediate instantly gradually suddenly abruptly meanwhile beforehand afterwards simultaneously ongoing forthcoming imminent overnight anniversary countdown frequency pace tempo routine habit habitual regular irregular sporadic intermittent dates hours minutes seconds periods seasons january february march april may june july august september october november december monday tuesday wednesday thursday friday saturday sunday weekend weekday holiday holidays nights quarterly latest new newest updated upcoming previous prior former final immediately scheduled schedules length long short old older oldest young younger ages aged begin beginning start started starting end ending finish finished complete completed continue continued frequent generally speed fast quick quickly slow slowly delayed pending progress",
    move: "move movement moving go going come coming walk walking run running jog sprint dash rush hurry hasten stroll wander roam step stride crawl climb ascend descend rise drop jump leap hop skip bounce slide slip glide swing spin rotate turn twist bend stretch reach grab grasp hold carry lift raise lower push pull drag drive driving ride riding fly flying sail swim swimming travel traveling journey trip commute depart departure arrive arrival enter exit leave return approach retreat follow chase pursue escape flee dodge deliver transport shift relocate migrate navigate steer accelerate brake halt stop pause proceed advance circulate flow drift float sink dive plunge tumble stumble stagger leaving returning entering carrying bring bringing take taking transferring put place placing set setting holding keep keeping remove removing dropping turning switch switching change changing up down over under across through around open opening close closing stopping",
    desc: "big large huge enormous immense vast giant gigantic massive tiny little miniature slight tall wide broad narrow thick thin slim slender fat heavy light dense hollow deep shallow high low steep flat smooth rough coarse soft hard rigid flexible stiff sharp blunt bright dark dim vivid dull colourful colorful pale faint clear vague obvious apparent evident subtle intricate complex complicated simple plain fancy elegant graceful clumsy awkward neat tidy messy chaotic orderly clean dirty filthy fresh stale mature immature strong weak powerful feeble sturdy durable delicate rare common ordinary unusual peculiar strange bizarre odd typical usual normal exceptional remarkable extraordinary outstanding excellent superb terrible awful dreadful mediocre adequate sufficient insufficient abundant plentiful scarce sparse extremely highly slightly barely hardly quite rather fairly somewhat entirely completely thoroughly partially utterly absolutely relatively comparatively increasingly special specific general unique particular private closed available unavailable free basic advanced professional expert easy difficult unclear detailed incomplete full empty partial total overall entire whole main major minor primary secondary important essential necessary required optional additional extra further other another same different similar various diverse multiple double triple original official unofficial actual real true false correct incorrect wrong accurate exact precise approximate initial popular famous unknown good better best bad worse worst great perfect poor pretty ugly stable unstable reliable efficient effective useful useless valuable cheap expensive affordable luxury quantity red blue green yellow black white brown orange purple pink grey gray golden colour color colors colours",
    place: "places location located locate area region district neighborhood zone territory city town village suburb countryside rural urban metropolitan downtown street road avenue lane highway motorway bridge tunnel intersection roundabout sidewalk pavement path trail route direction north south east west building house home apartment cottage mansion villa cabin tower skyscraper mall supermarket restaurant cafe bar pub hotel hostel airport station harbour harbor port dock stadium arena library school campus church temple mosque park garden playground campsite destination tourist tourism vacation itinerary luggage baggage suitcase ticket boarding flight airline train bus taxi subway metro tram ferry cruise rental accommodation checkin sightseeing landmark souvenir map navigation distance nearby faraway abroad overseas domestic locations areas regions districts zones cities towns suburban streets roads routes address addresses zip postal buildings houses homes apartments room rooms hotels resort resorts motel inn restaurants bars clubs centre center centres centers plaza square parks gardens hall halls facility facilities properties land terrain ground floor basement roof entrance lobby corridor travelling trips tour tours tourists destinations flights airlines airports stations trains buses ship ships boat boats car cars vehicle vehicles auto automotive automobile truck trucks motorcycle bike bicycle driver drivers parking rentals booking reservation reservations maps directions local locally regional national international global worldwide foreign northern southern eastern western central pacific atlantic",
    food: "food eat eating meal breakfast lunch dinner supper snack appetiser appetizer dessert dish cuisine recipe ingredient cook cooking cooked bake baking roast roasted grill grilled fry fried boil boiled steam steamed simmer stir chop slice dice mince seasoning spice spicy salt salty sugar sweet sour savoury savory bland tasty delicious flavour flavor taste texture crispy crunchy tender juicy greasy frozen raw ripe bread rice pasta noodle soup salad sandwich burger pizza meat beef pork chicken fish seafood vegetable fruit dairy cheese butter milk cream yoghurt yogurt egg bean nut grain flour oil vinegar sauce herb garlic onion pepper drink beverage water juice coffee tea wine beer cocktail kitchen fridge refrigerator oven stove microwave pan pot plate bowl cup mug fork knife spoon chopsticks napkin tablecloth laundry cleaning chore housework furniture sofa couch mattress pillow blanket curtain closet wardrobe drawer shelf vacuum broom detergent foods meals snacks recipes dishes ingredients noodles vegetables fruits eggs spices drinks beverages wines alcohol bottle bottles bedroom bathroom living dining garage appliance appliances dishwasher washer dryer bed bedding towel lamp lighting shelves cabinet",
    nature: "nature environment environmental ecosystem ecology climate weather rain rainy rainfall shower storm thunder lightning snow snowy frost ice hail wind windy breeze gale hurricane typhoon tornado flood drought heatwave sunshine sunny cloudy fog foggy mist humidity humid dry damp mountain hill valley cliff canyon plateau desert forest woods jungle rainforest tree trees plant flower grass leaf leaves branch root seed soil sand rock stone mineral river lake pond ocean sea wave tide beach coast shore island peninsula waterfall glacier volcano earthquake wildlife animal animals bird insect mammal reptile predator prey habitat biodiversity conservation sustainable sustainability pollution pollutant emission carbon renewable solar recycling recycle waste landfill deforestation endangered extinct extinction ecological warm cold hot sun wet air earth metal steel iron copper aluminum wood wooden glass plastic paper fire flame smoke power fuel gas petroleum coal electricity electric plants flowers forests mountains rivers lakes oceans seas beaches birds dog dogs cat cats horse horses pet pets",
    body: "body physical head face eyes ear ears nose mouth lip lips tooth teeth tongue throat neck shoulder shoulders arm arms elbow wrist hand hands finger fingers thumb chest back waist hip leg legs knee ankle foot feet toe skin bone bones joint blood heart lung lungs brain stomach liver kidney nerve nerves breathe breathing breath heartbeat pulse posture gesture facial smile frown blink stare gaze glance glimpse look see seeing sight visible hear sound listen listening loud silent smell scent aroma fragrance odour odor touch warmth chill heat sweat shiver tremble exhausted energetic flex asleep awake wake yawn bodies muscles voice looking watching sense senses wear wearing worn fit fitting size sizes",
    edu: "education educational schooling college university academy institute academic student pupil classmate teacher tutor professor lecturer instructor principal headmaster dean faculty class classroom lecture lesson course curriculum syllabus module semester term degree diploma bachelor master doctorate phd graduate graduation undergraduate scholarship tuition enrol enroll enrolment admission exam examination quiz assignment homework essay thesis dissertation coursework grade grading mark score transcript certificate qualification studying learn learning revise revision memorise memorize practise practice skill skills knowledge understand understanding comprehension literacy numeracy workshop seminar tutorial textbook notebook reference citation plagiarism discipline attendance apprenticeship internship vocational schools colleges universities students teachers classes courses lessons lectures trainer teach teaching taught learned exams tests grades scores certification degrees enrollment subjects textbooks references bibliography expertise experts beginner beginners intermediate guide guides guideline manual manuals instruction instructions handbook documentation tips tip howto faq overview summary abstract definition definitions dictionary glossary encyclopedia",
    quant: "number numbers amount sum figure count counting calculate add addition subtract subtraction multiply multiplication divide percentage percent fraction decimal ratio proportion average median increase decrease growth decline half quarter third dozen pair several few many much more most less least minimum maximum limit cap threshold range scale metric dimension width height depth volume capacity mile kilometre kilometer metre meter centimetre centimeter inch yard gram kilogram ounce litre liter gallon celsius fahrenheit unit abundance surplus deficit shortage excess equal equivalent approximately roughly exactly precisely estimate estimation tally aggregate cumulative amounts totals quantities level levels medium plus minus first fourth fifth last next top bottom upper middle one two three four five six seven eight nine ten hundred thousand million billion some any all none every each both either neither increased increasing decreased decreasing growing rising falling added adding measuring units piece pieces pairs sets batch bunch portion part parts section sections limits ranges scales weights miles inches pounds ton",
  };
  var m = new Map();
  for (var k in groups) groups[k].split(/\s+/).forEach(function (w) { if (w && !m.has(w)) m.set(w, k); });
  return m;
})();
var LEXIS_DOMAIN_RULES = [
  ["tech", /^(cyber|crypto|digital|comput|internet|online|download|upload|server|software|hardware|website|webpage|keyboard|username|password|login|logout|browser|database|encrypt|decrypt|bluetooth|wireless|firewall|malware|hyperlink|multimedia|smartphone|processor|automat|algorithm|robot|blockchain|bandwidth|megabyte|gigabyte|kilobyte)/],
  ["tech", /(software|hardware|bytes?|online|website|password|keyboard|username|digital)$/],
  ["health", /^(medic|surg|patient|hospital|clinic|disease|diagnos|therap|vaccin|infect|immun|nutrit|cardio|dental|pharma|symptom|anatom|neur|pediatr|psychiatr|bacteri|virus|antibiot|healthc)/],
  ["health", /(itis|osis|emia|pathy|ectomy|therapy)$/],
  ["sci", /^(physic|chemic|chemistr|biolog|molecul|atom|electron|photon|quantum|genetic|astronom|galax|particle|thermodynam|geolog|ecolog|enzyme|protein|hydrogen|oxygen|calcul|equation|experiment|laborator|scientif)/],
  ["fin", /^(financ|invest|econom|bank|budget|revenue|profit|dividend|mortgage|interest|inflation|currenc|fiscal|taxat|accountanc|stockhold|shareholder|creditor|debtor|liquidit|collateral)/],
  ["fin", /(payment|pricing|financial)$/],
  ["law", /^(legal|legisl|constitut|court|judic|jurisd|attorn|prosecut|defend|plaintiff|verdict|statute|felon|litig|testif|congress|senat|parliament|democra|govern|diplomat|election|policy|treaty|amendment)/],
  ["law", /(ocracy|ocratic)$/],
  ["biz", /^(market|manage|corporat|entrepren|commerc|logist|merchand|retail|wholesal|supplier|inventor|negoti|stakeholder|strateg|productivit|workforce|recruit|outsourc|franchise|startup)/],
  ["biz", /(holder|marketing)$/],
  ["arts", /^(paint|sculpt|theatr|orchestr|melod|rhythm|poet|novel|literar|cinema|photograph|choreograph|aesthet|gallery|exhibit|composer|符|музык)/],
  ["sci", /^(ecolog|climat|environ|biodivers|wildlif|forest|glacier|habitat|volcan|geograph|atmospher|pollut|renewable|ecosystem|meteor|hurricane)/],
  ["sci", /^(hypoth|method|analys|analyt|theoret|empiric|research|scholar|dissert|curricul|pedagog|academ|thesis|epistem|paradigm|synthes)/],
  // --- broad fallbacks (v1.52.0): run LAST so a specific domain always wins ---
  ["emot", /(phobia|mania)$/],
  ["emot", /^(joy|sorrow|anger|angri|griev|delight|content|resent|frustrat|nostalg|melanchol|empath|sympath|compassion|jealous|envious|remorse|elat|despond)/],
  ["people", /(hood|ship)$/],
  ["people", /^(family|famil|parent|matern|patern|sibling|marital|romant|neighbour|neighbor|communal|kinship)/],
  ["time", /^(chron|tempor|annual|monthly|weekly|daily|hourly|season|perpetu|interim|interval|prolong|postpon|precede|subsequen)/],
  ["edu", /^(academ|scholar|pedagog|didactic|tutor|curricul|syllab|literac|numerac|studious|erudit)/],
  ["quant", /^(quantif|numer|arithmetic|calcul|percent|proportion|multipl|divis|magnitud|measur|metric)/],
  ["quant", /(fold|ometer|metre|meter)$/],
  ["body", /^(cardi|derma|ocul|ophthalm|audit|olfact|gustat|tactile|musculo|skelet|respirat|circulat)/],
  ["nature", /^(eco|enviro|climat|meteor|botan|zoolog|agricultur|horticultur|marine|terrestrial|atmospher)/],
  ["place", /^(geograph|urban|suburb|municipal|metropolit|nautic|aviat|itinerar|touris|transit|commut)/],
  ["food", /^(culinar|gastronom|edible|nutrit|bever|brew|ferment|marinad)/],
  ["move", /^(ambul|migrat|transpor|propel|traject|locomot|navigat)/],
  ["move", /(wards?)$/],
  ["desc", /(ous|ful|less|able|ible|ish|esque|most)$/],
  ["desc", /ly$/],
];
// Classify a single word into a usage scene. Order: exact keyword lexicon →
// morphological regex rules → "general" fallback (so an everyday word shows
// 日常·通用 instead of nothing). Pass specificOnly=true to skip the fallback
// (used by article classification, which wants a *distinctive* scene or null).
// Shared conservative de-inflection: a few candidate base forms for a word, so
// "posted"/"images"/"provides"/"replenishing" can be matched against the pools
// instead of falling through as unknown. Used by BOTH lexisWordBand (frequency
// banding) and lexisWordDomain (usage scene).
function lexisStemCandidates(w) {
  var s = String(w || "").toLowerCase().trim();
  var out = [], m;
  var push = function (c) { if (c && c.length >= 2 && out.indexOf(c) < 0 && c !== s) out.push(c); };
  var one = typeof lexisSingularize === "function" ? lexisSingularize(s) : null;
  push(one);
  if ((m = /^(.+?)(ing|ed)$/.exec(s)) && m[1].length >= 2) {   // going → go, doing → do
    push(m[1]); push(m[1] + "e");
    if (/([^aeiou])\1$/.test(m[1])) push(m[1].slice(0, -1));   // stopped → stop
    if (/i$/.test(m[1])) push(m[1].slice(0, -1) + "y");         // tidied → tidy
  }
  if ((m = /^(.+?)(ly|ness|est|er|ment|ion|ation|ity)$/.exec(s)) && m[1].length >= 4) {
    push(m[1]); push(m[1] + "e");
    if (/i$/.test(m[1])) push(m[1].slice(0, -1) + "y");         // happily → happy
  }
  if (/s$/.test(s) && s.length >= 4) push(s.slice(0, -1));
  return out;
}

function lexisWordDomain(w, specificOnly) {
  if (!w) return null;
  var s = String(w).toLowerCase();
  var hit = LEXIS_SCENE_WORDS.get(s);
  if (hit) return { key: hit, cn: LEXIS_SCENE_CN[hit] };
  // try base forms before the regex rules — "images"/"posted"/"provides" should
  // land in the same scene as image/post/provide (v1.52.0)
  var cands = lexisStemCandidates(s);
  for (var c = 0; c < cands.length; c++) {
    hit = LEXIS_SCENE_WORDS.get(cands[c]);
    if (hit) return { key: hit, cn: LEXIS_SCENE_CN[hit] };
  }
  for (var i = 0; i < LEXIS_DOMAIN_RULES.length; i++) {
    if (LEXIS_DOMAIN_RULES[i][1].test(s)) {
      var k = LEXIS_DOMAIN_RULES[i][0];
      return { key: k, cn: LEXIS_SCENE_CN[k] };
    }
  }
  if (specificOnly) return null;
  if (/^[a-z][a-z'-]{2,}$/.test(s)) return { key: "general", cn: LEXIS_SCENE_CN.general };
  return null;
}

// Idiom usage-scenario map (49 curated idioms), tagged against the same
// 9-key LEXIS_SCENE_CN palette as words/phrases/articles.
var LEXIS_IDIOM_SCENE = {
  "break the ice": "comm", "on the same page": "comm", "touch base": "comm",
  "the elephant in the room": "comm", "cut to the chase": "comm", "read between the lines": "comm",
  "the ball is in your court": "comm", "play devil's advocate": "comm", "beat around the bush": "comm",
  "steal someone's thunder": "comm",
  "the bottom line": "biz", "back to the drawing board": "biz", "ballpark figure": "biz",
  "the big picture": "biz", "move the needle": "biz", "low-hanging fruit": "biz",
  "think outside the box": "biz", "raise the bar": "biz", "ahead of the curve": "biz",
  "the lion's share": "biz", "in the long run": "biz", "get the ball rolling": "biz",
  "on the fly": "biz", "hit the ground running": "biz", "on the back burner": "biz",
  "the eleventh hour": "biz", "burn the midnight oil": "biz",
  "cut corners": "risk", "on the fence": "risk", "a double-edged sword": "risk",
  "keep an eye on": "risk", "under the radar": "risk", "bite the bullet": "risk",
  "go out on a limb": "risk", "take with a grain of salt": "risk", "a slippery slope": "risk",
  "jump on the bandwagon": "risk", "throw in the towel": "risk", "grasp at straws": "risk",
  "food for thought": "risk", "a blessing in disguise": "risk", "the best of both worlds": "risk",
  "the tip of the iceberg": "risk", "par for the course": "risk", "a wild goose chase": "risk",
  "paint oneself into a corner": "risk", "a storm in a teacup": "risk", "a fish out of water": "risk",
  "the writing on the wall": "risk",
};
function lexisIdiomScene(term) {
  return LEXIS_IDIOM_SCENE[String(term || "").toLowerCase()] || null;
}

// ---- plural → singular ------------------------------------------------
// Selections drag in the sentence's inflected form ("temples"); the notebook
// wants the lemma ("temple"). Conservative on purpose: words that only look
// plural (news, analysis, business) and plural-only nouns are left alone.
var LEXIS_NEVER_SINGULAR = new Set(
  ("news mathematics physics economics politics statistics ethics athletics aerobics linguistics " +
   "series species means species headquarters measles billiards darts scissors glasses clothes " +
   "thanks belongings savings surroundings outskirts premises goods odds regards riches stairs " +
   "always perhaps sometimes towards besides unless plus versus bus gas lens bias campus virus " +
   "status focus census bonus chorus circus surplus consensus this his its us yes was has does " +
   "class glass grass press cross loss less across various serious previous obvious famous").split(" ")
);
var LEXIS_IRREGULAR_PLURAL = {
  children: "child", people: "person", men: "man", women: "woman", feet: "foot",
  teeth: "tooth", geese: "goose", mice: "mouse", lice: "louse", oxen: "ox",
  criteria: "criterion", phenomena: "phenomenon", curricula: "curriculum",
  analyses: "analysis", crises: "crisis", theses: "thesis", diagnoses: "diagnosis",
  hypotheses: "hypothesis", parentheses: "parenthesis", bases: "basis",
  indices: "index", matrices: "matrix", appendices: "appendix", vertices: "vertex",
  media: "medium", bacteria: "bacterium", stimuli: "stimulus", alumni: "alumnus",
  fungi: "fungus", nuclei: "nucleus", radii: "radius", axes: "axis",
};

// pool of known singular lemmas, used to sanity-check a stripped form
var LEXIS_LEMMA_POOL = (function () {
  var s = new Set();
  try {
    LEXIS_FREQ.forEach(function (r) { s.add(r.term); });
    LEXIS_COMMON.forEach(function (w) { s.add(w); });
    (LEXIS_SEED_FLAT || []).forEach(function (r) { s.add((r.term || r).toLowerCase()); });
  } catch (e) {}
  return s;
})();

// Returns the singular form, or null when the word should be left as-is.
// Single words only — phrases ("human rights") are never touched.
function lexisSingularize(word) {
  var w = String(word || "").trim();
  if (!w || /\s/.test(w)) return null;
  var l = w.toLowerCase();
  if (LEXIS_NEVER_SINGULAR.has(l)) return null;
  // irregulars first — many (children, mice, criteria) don't end in -s at all
  if (LEXIS_IRREGULAR_PLURAL[l]) return LEXIS_IRREGULAR_PLURAL[l];
  if (!/s$/.test(l) || l.length < 4) return null;
  // -ss / -us / -is are almost never regular plurals
  if (/(ss|us|is)$/.test(l)) return null;

  var cand = null;
  if (/ies$/.test(l) && l.length > 4) cand = l.slice(0, -3) + "y";       // studies → study
  else if (/ves$/.test(l)) {                                             // knives → knife
    var stem = l.slice(0, -3);
    cand = LEXIS_LEMMA_POOL.has(stem + "fe") ? stem + "fe" : stem + "f";
  }
  else if (/(ch|sh|x|z|s)es$/.test(l)) cand = l.slice(0, -2);            // boxes → box
  else if (/oes$/.test(l)) cand = l.slice(0, -2);                        // heroes → hero
  else cand = l.slice(0, -1);                                            // temples → temple
  if (!cand || cand.length < 2 || cand === l) return null;

  // Trust the pool when it knows either form; otherwise accept the strip only
  // for the plain -s case, which is the one that's safe to guess.
  if (LEXIS_LEMMA_POOL.has(cand)) return cand;
  if (LEXIS_LEMMA_POOL.has(l)) return null;   // the -s form is itself a lemma
  return /[^aeiou]s$/.test(l) ? cand : null;
}

// =========================================================================
// READING-BASED VOCABULARY ASSESSMENT · 阅读式词汇量评估
// -------------------------------------------------------------------------
// Ticking words one at a time is slow and unnatural. Here you read a short
// passage and tap ONLY the words you don't know; every other content word
// counts as a hit, so one ~230-word passage yields ~120 judgements instead of
// 40. Passages are original prose written for this app (no copyright issue),
// deliberately lexically rich so the mid/low/rare bands actually get sampled.
// =========================================================================
var LEXIS_PASSAGES = [
  {
    id: "shoplift",
    title: "The Woman Who Stole Nothing",
    cn: "Retail floor · the woman who stole nothing",
    text:
      "She came in every Thursday at four, and for six weeks nobody could work out what she was doing. She never bought anything. She never took anything either — the loss-prevention lead pulled the footage twice and found nothing incriminating, just a well-dressed woman in her fifties drifting through womenswear, lifting a sleeve, checking a hem, putting it back. On the seventh Thursday the assistant manager finally asked. She laughed, a little embarrassed, and explained that she had been a buyer for a department store that folded in 2009, and that she still could not shake the habit of reading a shop floor. The sleeve told her where the garment was made. The hem told her whether the margin was real. The way the mannequins were dressed told her whether the merchandiser trusted the range or was quietly hedging. She said the shop was doing one thing badly: the markdown rail sat at the entrance, which was a confession. Shoppers read a store the way you read a face, she said, and a discount rack by the door announces that nothing further in is worth full price. They moved the rail the following week. Full-price sell-through rose four points that month, and nobody could prove it was her, and nobody was willing to say it wasn't.",
  },
  {
    id: "model",
    title: "It Apologised, Then Made It Up Again",
    cn: "Working with AI · it apologised, then made it up again",
    text:
      "The email looked immaculate. Three paragraphs, a citation to a 2021 paper, a statistic to two decimal places, and a closing line so smooth it could have been ghostwritten by a consultant. The paper did not exist. Neither did the statistic. When the intern pointed this out, the model apologised — profusely, charmingly — and produced a corrected version containing a different fabricated citation. This is the part newcomers find hardest to internalise: the machine is not lying, because lying requires knowing. It is doing something stranger and more unsettling, which is generating the shape of a true sentence and letting you supply the belief. Fluency is not evidence. It never was — we simply never had a machine that could produce fluency without any of the understanding that used to come bundled with it. The people who get real leverage out of these tools have all made peace with one unglamorous discipline: constrain the task, demand sources you can click, and never let the model stand as the only thing between a claim and a reader. Do that, and it collapses the distance between having an idea and testing it. Skip it, and you have built yourself a very articulate liability.",
  },
  {
    id: "archive",
    title: "The Parish Register and the Price of Bread",
    cn: "History detective · the parish register and the price of bread",
    text:
      "Nobody wrote down the famine. There is no chronicle, no petition, no outraged pamphlet — the year passes in the official record as unremarkable. What survives is a burial register kept by a conscientious curate who noted every interment in a cramped hand, and a corn merchant's ledger from the next county listing the price of a bushel of wheat, month by month. Lay them side by side and the silence becomes deafening. Burials triple in the spring. The dead skew young and old, the way they always do when food runs short. Wheat has quadrupled since autumn. Nobody chronicled the famine because the people it killed were illiterate and the people who could write did not go hungry. This is the whole craft in miniature. Archives are not neutral: ledgers survive because clerks were paid to keep them, letters survive because families thought them worth a drawer, and the itinerant, the indigent and the merely unremarkable leave no paper at all. A historian who mistakes that silence for evidence of nothing will reconstruct a past populated entirely by the literate and the propertied — which is, conveniently, a flattering portrait commissioned by the powerful and then mistaken for the thing itself.",
  },
  {
    id: "gym",
    title: "Everyone in the Gym Is Wrong About the Same Thing",
    cn: "The gym · everyone gets the same thing wrong",
    text:
      "The man on the bench has a shaker bottle, a bespoke split, and a supplement stack that costs more than his rent. He has also not added weight to the bar in eleven months. Two racks over, a woman who owns none of that has quietly put forty kilos on her squat since spring, because she does the same four lifts every week and adds a little each time and goes home. That is the entire mechanism. Muscle responds to progressive overload and to almost nothing else; everything else is ornament. This is unwelcome news, because consistency is a duller virtue than intensity and considerably harder to sustain. The novice who trains to exhaustion on Monday is too sore to move on Wednesday, and a fortnight of enthusiasm yields less than a year of moderate, unremarkable sessions. Recovery is where the adaptation actually happens — the session is only the stimulus — and chronic under-sleeping will blunt a programme that no amount of effort can rescue. There is also the question of what you are training for. A physique optimised for photographs may be markedly less resilient than one built around carrying, climbing, and getting up off the floor unaided at seventy. The strength you accumulate in your forties is, fairly literally, the independence you will spend in your eighties.",
  },
  {
    id: "meeting",
    title: "The Decision That Was Made by the Calendar",
    cn: "Work · the decision the calendar made",
    text:
      "Nobody killed the project. That is what made it maddening. Everybody had been consulted, everybody had raised a thoughtful caveat, and the thing simply drifted — one more round of stakeholder input, one more revised deck — until the window closed and the competitor shipped and the question answered itself. The decision had been made by the calendar, which is the most common way large organisations decide anything. Two disciplines prevent it. The first is to stop asking what would settle the matter and start asking what would change my mind, and how cheaply can I find that out; the reframing turns a paralysing debate into a sequence of small, tractable experiments, and it also exposes the arguments that were never empirical at all — the ones where two people disagree about risk appetite and have been proxying it through market share for six weeks. The second is to separate the reversible from the irreversible. A price change can be rescinded in a week; a factory, an acquisition, a public promise cannot. Reversible calls deserve speed, because deliberating over them squanders the scarcest resource in the building, which is attention. And decide who decides — ambiguous ownership is how a decision ends up emerging months later by attrition, having been made by nobody accountable for it.",
  },
  {
    id: "neighbour",
    title: "The Neighbour Who Kept Score",
    cn: "Neighbours · the one who kept score",
    text:
      "For eleven years Margaret had kept a mental ledger of the fence. Half of it was hers, half was the Prentices', and by her reckoning she had paid for repairs three times to their once, which she mentioned to nobody and forgot about never. When the storm finally took the whole thing down she found herself, to her own considerable irritation, hoping it had fallen on their side. It had not. It lay flat across both gardens, impartial as weather, and Alan Prentice was out there at seven the next morning with a saw, working his way along it, and by the time she came out with two mugs of tea the awkwardness of eleven years had somehow been rendered ridiculous by the sheer banality of the job. They talked about brackets. They talked about whether to go treated pine or take out a loan and do it properly. Nobody apologised, because nobody had ever said anything worth apologising for — that was rather the point, and it was the whole grievance. Grudges between neighbours are almost never about the thing. They are about the accumulated indignity of having been, for years, slightly less considered than you felt you deserved, and they dissolve the moment somebody shows up with a saw.",
  },
  // Added v1.67.0 — six passages was not enough material to re-assess with: once
  // you had read them all, another round measured nothing new, so the estimate
  // could not get sharper. Same five topic areas, same lexical brief.
  {
    id: "returns",
    title: "The Depot That Ate the Margin",
    cn: "Retail · where the margin is actually decided",
    text:
      "Nobody photographs the returns depot, and that is a shame, because the margin of a fashion label is decided there rather than on the shop floor. A garment that comes back has already cost the company twice: once to send it out, once to retrieve it. What happens next is a series of small, unglamorous judgements. A woman in a hairnet unfolds the parcel, glances at the seams, and sorts it into one of four trolleys — resell, refurbish, liquidate, scrap. She makes that call in under nine seconds, several thousand times a week, and her accuracy is worth more to the business than any campaign the marketing team will run this year. Send a resellable dress to the liquidator and you have thrown away most of its value. Put a worn one back on the site and you have bought a furious review and a second return. The depot manager keeps a laminated card by the door listing the items that fool people: black knitwear, which hides wear; anything with a lining, which conceals a broken zip; white trainers, which look salvageable and never are. New staff take about six weeks to learn it, and the ones who never do are quietly moved to inbound. None of this appears in the annual report, where returns are a single line, expressed as a percentage, and described as an industry headwind.",
  },
  {
    id: "benchmark",
    title: "The Model That Marked Its Own Homework",
    cn: "Building with LLMs · a score that flattered itself",
    text:
      "The evaluation looked wonderful for three weeks, which should have been the first warning. The team had built a harness that asked the model a thousand questions and had a second copy of the same model grade the answers, and the score climbed steadily from sixty-one to eighty-four without anybody touching the underlying system. What had actually changed was the phrasing of the grading prompt. The judge had been told to reward answers that were clear and confident, and the model under test had learned, in the crude way these things learn, that hedging was punished. So it stopped hedging. It kept the same errors and delivered them with better posture. Nobody noticed until an intern read forty transcripts by hand over a weekend and found a fabricated citation that both copies had waved through, because the fake source was formatted impeccably and the judge was, in the end, marking presentation. The fix was tedious and thankless: a hundred questions with verified answers, written by people who knew the subject, held back and never shown to anyone tuning the system. The score dropped to fifty-three overnight. That number was worth more than the eighty-four, and it took the team a further month to persuade the executives of that, mostly by showing them the citation.",
  },
  {
    id: "canal",
    title: "The Ledger of a Canal Town",
    cn: "Social history · a town that stops being recorded",
    text:
      "The parish register for the canal town runs from 1798 to 1871, and for the first thirty years it reads like an account of a boom. Boatmen, wheelwrights, a lock keeper, two rope makers, an innkeeper who buried four wives. Baptisms outnumber burials in every year but two. Then, quite abruptly, in the middle of a page, the occupations begin to change. The rope makers vanish. A man is listed as a labourer where his father had been listed as a haulier. By the middle of the century half the entries give no trade at all, and the curate has started adding a word in the margin — removed, meaning the family had gone. What happened is legible in a single line of the county surveyor's report: the railway had reached the next valley, and the tonnage carried on the canal fell by two thirds inside a decade. The wharf silted up because nobody could justify dredging it. The inn survived, briefly, on the trade of men dismantling the very thing that had built it. What is striking in the register is how little of this is stated. Nobody writes that the town is dying. The evidence is entirely in what stops being recorded — a slow subtraction of trades, one line at a time, kept in a neat clerical hand until the last page.",
  },
  {
    id: "taper",
    title: "The Season He Trained Less",
    cn: "Training · the year he did a third less",
    text:
      "He had spent four years believing that the only honest variable was volume. More miles, more sessions, more mornings in the dark; when the times stopped improving he did what had always worked before, which was to add another day. By the third winter he was training eleven times a week and racing worse than he had at nineteen, and a therapist told him something he found insulting at the time: that he was not overtrained so much as under-recovered, and that the distinction mattered. The plan they settled on cut his week by a third. Two hard sessions, deliberately hard, with genuinely easy running between them and a full day off that he was forbidden to fill with anything strenuous. For six weeks he felt sluggish and fraudulent. He was convinced he was losing fitness, and he said so, repeatedly. Then in early spring the sessions began to feel absurdly comfortable at paces that had recently been a struggle, and he ran a personal best over six miles by fifty-one seconds. The uncomfortable lesson was not that less is more, which is a slogan and mostly false. It was that adaptation happens during the recovery and not during the effort, and that his willingness to suffer had been, for four years, the thing standing between him and the result he wanted.",
  },
];

// band pool sizes used to convert per-band coverage into a headline number.
// The first four mirror LEXIS_FREQ's own bands; "beyond" stands for everything
// past the ~8.3k pool (roughly ranks 11k–17k), which is where an advanced
// learner's remaining headroom actually lives.
var LEXIS_BAND_SIZE = { common: 1900, mid: 2750, low: 2850, rare: 850, beyond: 5000 };
var LEXIS_BAND_SEQ = ["common", "mid", "low", "rare", "beyond"];
var LEXIS_BAND_LABEL = { common: "常用", mid: "中频", low: "低频", rare: "生僻", beyond: "超纲(词库外)" };
var LEXIS_ASSESS_CORE = 2500; // basics assumed held before the pool starts

// word → frequency band, or null for the basics stoplist / pool noise (not
// worth counting). Names and web junk are already stripped from LEXIS_FREQ, so
// without the lexisIsNoiseWord guard a passage's "Montgomery" would fall
// through to 超纲 and be offered as a tappable rare word — inflating the
// unknown count in the band that carries the most weight.
// LEXIS_FREQ comes from a WEB corpus (search/click/email/copyright…), so it has
// systematic holes: ordinary written-English words like habit, drift, resilient,
// enthusiasm simply never made its top ranks. Without a supplement a third of a
// normal passage banded as 超纲 and the estimate was driven by that bucket.
// These are hand-banded against general English, not web frequency.
var LEXIS_FREQ_SUPP = (function () {
  var B = { c: "common", m: "mid", l: "low", r: "rare" };
  var enc =
    // everyday nouns / verbs / adjectives the web list skips
    "habit c|drift m|sustain m|resilient m|enthusiasm m|confess m|confession m|statistic c|statistics c|" +
    "leverage m|blunt m|novice l|sore m|intern m|hem l|garment m|mannequin l|markdown l|clerk m|shelf c|shelves c|" +
    "ledger l|parish l|famine m|burial m|bushel r|itinerant r|indigent r|illiterate l|literate m|historian m|" +
    "pamphlet l|outrage m|unremarkable l|conscientious l|cramped m|curate m|deafening l|skew l|quadruple l|" +
    "reconstruct m|populate m|flatter m|bespoke l|kilo m|squat m|overload m|ornament m|unwelcome m|dull c|" +
    "considerable c|physique l|optimise m|fortnight m|stimulus m|accumulate m|maddening l|thoughtful c|" +
    "embarrass c|embarrassed c|unsettling m|fluency m|articulate m|constrain m|fabricate m|newcomer m|" +
    "internalise l|unglamorous r|ghostwrite r|apologise c|profusely l|incriminate l|immaculate l|hedge m|" +
    "drifting c|womenswear r|menswear r|" +
    // v1.67.0 passages (returns / benchmark / canal / taper) — ordinary words the
    // web corpus skips, plus the genuinely specialist ones, banded by hand so no
    // token in a passage falls into 超纲. See the note on LEXIS_FREQ_SUPP above.
    "trolley m|trolleys m|refurbish l|scrap m|laminate l|laminated l|conceal m|conceals m|salvage l|salvageable l|" +
    "harness m|posture m|impeccable l|impeccably l|abrupt m|abruptly m|absurd m|absurdly m|slogan m|" +
    "strenuous l|sluggish l|fraudulent l|clerical l|dismantle m|dismantling m|" +
    "wheelwright r|innkeeper l|baptism l|baptisms l|haulier r|wharf r|silt r|silted r|dredge r|dredging r|" +
    "resell l|resellable r|liquidator l|knitwear l|hairnet r|inbound m|headwind l|tonnage l|surveyor m|legible l|" +
    // high-utility general vocabulary (spoken + literary) missing from the web list
    "ache c|admire c|advise c|afford c|alarm c|amaze c|amuse c|anger c|announce c|annoy c|anxious c|apologize c|" +
    "appetite m|applaud m|apron l|argue c|arrange c|arrest c|ashamed m|assume c|astonish m|attach c|attempt c|" +
    "attract c|awkward m|bake c|balance c|bargain m|basket c|beard m|beg m|behave c|belong c|bend c|betray m|" +
    "bite c|bitter m|blame c|blanket c|bleed m|bless m|blink m|blush l|boast l|boil c|bold m|borrow c|bounce m|" +
    "bow m|brave c|breathe c|breeze m|bribe m|brick c|bride m|broom l|brush c|bucket m|bury c|butcher l|calm c|" +
    "candle m|cane l|cape l|carve m|cautious m|ceiling c|cellar l|chase c|cheat m|cheek m|cheer c|chew m|chill m|" +
    "chin m|choke m|chop m|clap m|clay m|cliff m|climb c|cling m|closet m|cloth c|clumsy l|coal m|coward l|" +
    "crack c|craft c|crawl m|creep m|crew c|crime c|cripple l|crop c|crouch l|crowd c|cruel m|crush m|cry c|" +
    "cuddle l|cunning l|cupboard m|curious c|curl m|curse m|curtain m|cushion m|damp m|dare c|dawn m|deaf m|" +
    "decay m|deceive m|decorate c|delay c|delicate m|delight c|deny c|depart m|desert c|deserve c|despair m|" +
    "desperate c|destroy c|devote m|dig c|dip m|dirt c|disappoint c|disgust m|dismiss c|ditch m|dive m|divorce c|" +
    "dizzy m|dough l|drag c|drain m|drawer m|dread m|drown m|drum c|dust c|eager m|earn c|elbow m|elegant m|" +
    "embrace m|empty c|encourage c|endure m|enemy c|envy m|erase m|escape c|exhaust m|explode m|fade m|faint m|" +
    "fair c|faith c|fake m|fancy c|fasten m|fault c|feather m|fee c|fence c|fetch m|fierce m|fist m|flame m|" +
    "flap l|flash c|flat c|flee m|flesh m|float c|flood c|flour m|flow c|fluent m|fog m|fold c|fond m|fool c|" +
    "forbid m|forgive m|fork m|frame c|frighten m|frown l|fry m|fuel c|funeral m|fur m|furious m|gap c|gaze m|" +
    "gentle c|giggle l|glance m|glare l|glimpse m|glow m|glue m|goal c|grab c|grain m|grasp m|grateful m|grave m|" +
    "greed m|greet m|grief m|grin m|grind m|grip m|groan l|guard c|guilt m|gulf m|gum m|hammer m|handle c|hang c|" +
    "harbour l|harm c|harsh m|haste m|hatch m|hate c|haunt m|heal m|heap m|heap m|hedge m|heel m|hesitate m|" +
    "hide c|hint m|hollow m|honest c|hook m|hop m|horror m|host c|howl l|hug m|humble m|humour c|hunt c|hurry c|" +
    "hush l|hut m|idle m|ignore c|imitate m|impress c|inch c|indeed c|infect m|inherit m|injure c|innocent m|" +
    "insect m|insist c|inspire c|instinct m|insult m|intend c|interrupt m|invade m|invent c|iron c|jail m|jaw m|" +
    "jealous m|jerk m|jewel m|jog m|joke c|journey c|joy c|judge c|jug l|jump c|keen m|kettle m|kick c|kidnap m|" +
    "kneel m|knit m|knock c|knot m|labour c|lace m|ladder m|lame l|lamp m|lap m|lash l|lawn m|lazy m|leak m|" +
    "lean c|leap m|leather m|lend c|liar m|lick m|lid m|lift c|lightning m|limb m|limp l|lip c|loaf l|loan c|" +
    "lock c|lonely c|loose c|lord c|loud c|lousy l|luck c|lump m|lung m|luxury m|mad c|magic c|mailbox l|mane r|" +
    "marble m|march c|mask m|mat m|mate c|mattress m|meadow l|meanwhile c|melt m|mend m|mercy m|mess c|mild m|" +
    "mill m|mine c|mist m|moan l|mock m|modest m|moist m|mood c|moral c|mourn l|mud m|mug m|mumble l|murder c|" +
    "murmur l|mutter l|nail c|naked m|nap m|narrow c|nasty m|neat m|neglect m|nest m|net c|nod m|noise c|" +
    "nonsense m|noon m|notice c|nurse c|nut m|oath m|obey m|oblige m|odd c|offend m|onion m|owe m|owl m|pace c|" +
    "pack c|pad m|pale m|palm m|pan c|panic m|pant m|parcel m|pardon m|passion c|paste m|pat m|patch m|path c|" +
    "patience m|pave m|paw l|peace c|peak c|pearl m|peasant m|peel m|peer m|pen c|penny m|perfume m|permit c|" +
    "persuade c|pet c|pile c|pillow m|pinch m|pine m|pipe c|pit m|pity m|plain c|plank l|plead m|pleasant c|" +
    "pledge m|plough r|pluck l|plunge m|poke m|polish m|pond m|porch m|pork m|pot c|pour c|praise c|pray c|" +
    "preach l|precious m|pregnant m|press c|pretend c|prey m|pride c|priest m|prison c|proud c|pump m|punch m|" +
    "punish m|pupil m|purse m|push c|puzzle m|quarrel m|queue m|quit c|quiver r|rag m|rage m|raid m|rail c|" +
    "rain c|raise c|rake l|ranch m|rank c|rare c|rat m|rattle m|reach c|realm m|reap l|rear m|reckon m|refuse c|" +
    "regret c|rehearse m|reign m|rejoice r|relief c|reluctant m|remind c|rent c|repair c|reproach r|rescue c|" +
    "resent m|resist c|restless m|retreat m|revenge m|reward c|rib m|ribbon m|riddle m|ridge m|ridiculous m|" +
    "rifle m|rim m|ring c|rinse l|riot m|ripe m|rise c|roar m|roast m|rob m|rod m|roll c|roof c|root c|rope c|" +
    "rot m|rough c|row c|rub m|rubbish m|rude m|rug m|ruin m|rumour m|rush c|rust m|sack m|sacred m|sacrifice m|" +
    "saddle m|sail c|sake m|salute m|sand c|sauce m|saucer l|scar m|scarce m|scare m|scatter m|scent m|scold l|" +
    "scoop m|scrape m|scratch m|scream m|screw m|scrub l|seal m|seam m|seed c|seek c|seize m|seldom m|sew m|" +
    "shade m|shadow c|shake c|shallow m|shame c|shape c|share c|sharp c|shave m|shed m|sheep c|sheer m|shelter m|" +
    "shepherd m|shield m|shift c|shine c|shiver m|shock c|shoe c|shore m|shout c|shove l|shovel l|shrink m|" +
    "shrug m|shudder l|shut c|shy m|sigh m|sight c|sigh m|silk m|sin m|sink c|sip m|skill c|skip m|skirt m|" +
    "slam m|slap m|slave m|sleeve m|slice m|slide c|slight c|slim m|slip c|slope m|slow c|smash m|smell c|" +
    "smile c|smoke c|smooth c|snake m|snap m|sneak m|sniff m|snow c|soak m|soap m|sob l|sock m|soft c|soil c|" +
    "soldier c|sole m|solve c|soothe l|sorrow m|soul c|sour m|spade l|spare c|spark m|sparkle m|spear m|" +
    "spell c|spill m|spin m|spine m|spit m|splash m|split c|spoil m|sponge m|spoon m|spot c|spray m|spread c|" +
    "spring c|sprinkle m|squeeze m|stab m|stack m|staff c|stain m|stair c|stale l|stamp m|stare m|startle l|" +
    "starve m|steady c|steal c|steam m|steep m|steer m|stem c|step c|stick c|stiff m|sting m|stir m|stitch m|" +
    "stomach c|stool m|stoop l|storm c|stove m|straight c|strain m|strange c|strap m|straw m|stray m|stream c|" +
    "strength c|stretch c|strict m|stride m|strike c|string c|strip c|stripe m|stroke m|stroll l|struggle c|" +
    "stubborn m|stumble m|stun m|stupid c|sturdy l|submit c|suck m|sudden c|suffer c|sugar c|suggest c|suit c|" +
    "sulk r|summit m|sunk m|superb m|supper m|suppose c|surrender m|surround c|survive c|suspect c|swallow m|" +
    "swamp m|swear m|sweat m|sweep m|sweet c|swell m|swift m|swim c|swing c|switch c|sword m|sympathy m|" +
    "tail c|tale m|tame m|tangle m|tap c|tape c|tease m|tedious l|temper m|tempt m|tender m|tense m|tent m|" +
    "terrify m|thick c|thief m|thigh m|thin c|thirst m|thorn m|thorough m|thread m|threat c|thrill m|thrive m|" +
    "throat m|throne m|thumb m|thunder m|tickle l|tide m|tidy m|tie c|tight c|tile m|tilt m|timber m|tin m|" +
    "tiny c|tip c|tire c|toe m|toil r|tomb m|tongue m|tool c|tooth c|torch m|toss m|touch c|tough c|tow l|" +
    "towel m|tower c|trace c|track c|trade c|trail c|trap c|tray m|tread l|treasure m|treat c|tremble m|trend c|" +
    "trial c|tribe m|trick c|trim m|trip c|triumph m|trousers m|truck c|trunk m|trust c|truth c|tub m|tuck m|" +
    "tug l|tumble m|tune c|tunnel m|twig l|twin m|twist m|ugly m|umbrella m|uneasy m|upset c|urge c|urgent c|" +
    "vain m|valley c|vanish m|vast m|veil m|vein m|velvet m|verse m|vessel m|vice m|view c|vigour l|villain m|" +
    "vine m|virtue m|vivid m|vow m|wage c|waist m|wander m|warmth m|warn c|waste c|wave c|weak c|wealth c|" +
    "weapon c|weary m|weave m|wedge m|weed m|weep m|weigh c|weird m|whip m|whirl l|whisper m|whistle m|wicked m|" +
    "widow m|wilderness m|wink m|wipe m|wire c|wisdom m|wit m|withdraw c|wither l|witness c|wolf m|wonder c|" +
    "wool m|worm m|worry c|worship m|worth c|wound c|wrap c|wreck m|wrestle m|wrinkle m|wrist m|yawn l|" +
    "yell m|yield m|zeal r|" +
    // numbers, plus abstractions a web corpus under-represents
    "twenty c|thirty c|forty c|fifty c|sixty c|seventy c|eighty c|ninety c|dozen c|" +
    "ambiguous m|ambiguity m|irritation m|irritate m|deliberate m|deliberation m|reversible m|" +
    "grudge m|grievance l|indignity l|attrition l|caveat l|stakeholder m|squander l|rescind r|" +
    "apprentice m|ghostwriter r|cannot c";
  return enc.split("|").map(function (pair) {
    var sp = pair.lastIndexOf(" ");
    return { term: pair.slice(0, sp), band: B[pair.slice(sp + 1)] };
  }).filter(function (x) { return x.term && x.band; });
})();

// The pool is US-spelled; a BrE token would otherwise fall straight through to
// 超纲 ("apologised", "colour", "centre", "travelled").
function lexisAmericanize(w) {
  var s = w;
  s = s.replace(/isation(s?)$/, "ization$1").replace(/ised$/, "ized").replace(/ising$/, "izing")
       .replace(/ises$/, "izes").replace(/ise$/, "ize")
       .replace(/ysed$/, "yzed").replace(/ysing$/, "yzing").replace(/yse$/, "yze")
       .replace(/ogue(s?)$/, "og$1");
  if (s.length > 5) s = s.replace(/our(s?)$/, "or$1").replace(/tre(s?)$/, "ter$1");
  s = s.replace(/lled$/, "led").replace(/lling$/, "ling").replace(/llor$/, "lor").replace(/lment$/, "lment");
  return s;
}

// Every plausible base form of a token, breadth-first, for FREQUENCY BANDING.
// Deliberately more aggressive than lexisStemCandidates (which feeds answer
// matching and must not over-generate): here a wrong-but-unknown candidate
// costs nothing, while a missed one wrongly reports 超纲.
var LEXIS_BAND_SUFFIX = [
  "'s", "s", "es", "ies", "ed", "d", "ing", "ly", "ally", "er", "ers", "est", "or", "ors",
  "ness", "ment", "ments", "ion", "ions", "ation", "ations", "ition", "sion", "tion",
  "ity", "ities", "ive", "ative", "ous", "ious", "al", "ial", "ic", "ical", "ist", "ists",
  "ism", "ish", "ful", "less", "able", "ible", "ate", "ize", "ise", "ary", "ory",
  "ance", "ence", "ancy", "ency", "ship", "hood", "dom", "age", "ery", "y",
];
var LEXIS_BAND_PREFIX = ["un", "re", "dis", "non", "over", "under", "mis", "pre", "post",
  "anti", "co", "out", "up", "semi", "sub", "inter", "multi", "self", "well", "ill", "de", "in", "im", "ir"];

function lexisBandStems(word) {
  var out = [], seen = {};
  var push = function (c) {
    if (!c || c.length < 3 || seen[c]) return;
    seen[c] = 1; out.push(c);
  };
  var expand = function (s, depth) {
    if (depth > 2) return;
    var i, suf, base;
    for (i = 0; i < LEXIS_BAND_SUFFIX.length; i++) {
      suf = LEXIS_BAND_SUFFIX[i];
      if (s.length <= suf.length + 2 || s.slice(-suf.length) !== suf) continue;
      base = s.slice(0, -suf.length);
      var forms = [base, base + "e", base + "y"];
      if (/^(ation|ations|ition|ion|ions)$/.test(suf)) forms.push(base + "ate"); // irritation → irritate
      if (/([^aeiou])\1$/.test(base)) forms.push(base.slice(0, -1));   // stopped → stop
      if (/i$/.test(base)) forms.push(base.slice(0, -1) + "y");        // happily → happy
      forms.forEach(function (f) { if (f.length >= 3) { push(f); expand(f, depth + 1); } });
    }
    for (i = 0; i < LEXIS_BAND_PREFIX.length; i++) {
      var pre = LEXIS_BAND_PREFIX[i];
      if (s.length < pre.length + 4 || s.slice(0, pre.length) !== pre) continue;
      base = s.slice(pre.length);
      push(base); expand(base, depth + 1);
    }
  };
  expand(word, 0);
  return out;
}

var _lexisBandMap = null;
function _lexisBandLookup(w) {
  if (!_lexisBandMap) {
    _lexisBandMap = new Map();
    for (var i = 0; i < LEXIS_FREQ.length; i++) {
      var f = LEXIS_FREQ[i];
      if (!_lexisBandMap.has(f.term)) _lexisBandMap.set(f.term, f.band);
    }
    for (var j = 0; j < LEXIS_FREQ_SUPP.length; j++) {
      var g = LEXIS_FREQ_SUPP[j];
      if (!_lexisBandMap.has(g.term)) _lexisBandMap.set(g.term, g.band);
    }
  }
  return _lexisBandMap.get(w) || null;
}
var _LEXIS_BAND_RANK = { common: 0, mid: 1, low: 2, rare: 3, beyond: 4 };

// word → frequency band, or null for the basics stoplist / pool noise (not
// worth counting). Names and web junk are already stripped from LEXIS_FREQ, so
// without the lexisIsNoiseWord guard a passage's "Montgomery" would fall
// through to 超纲 and be offered as a tappable rare word — inflating the
// unknown count in the band that carries the most weight.
function lexisWordBand(word) {
  var w = String(word || "").toLowerCase().trim().replace(/[’]/g, "'");
  if (!w) return null;
  // contractions: score the head word ("wasn't" is was, not a rare word)
  w = w.replace(/n't$/, "").replace(/'(ll|re|ve|d|m|s)$/, "");
  var apos = w.indexOf("'");
  if (apos > 0) w = w.slice(0, apos);
  else if (apos === 0) w = w.slice(1);
  // hyphenated compounds: as hard as their hardest recognised part
  if (w.indexOf("-") > 0) {
    var parts = w.split("-").filter(function (x) { return x.length >= 2; });
    if (parts.length > 1) {
      var worst = null, anyWord = false;
      for (var i = 0; i < parts.length; i++) {
        var pb = lexisWordBand(parts[i]);
        if (pb === null) { anyWord = true; continue; }   // basic part
        anyWord = true;
        if (!worst || _LEXIS_BAND_RANK[pb] > _LEXIS_BAND_RANK[worst]) worst = pb;
      }
      return anyWord ? worst : null;
    }
    w = w.replace(/-/g, "");
  }
  if (w.length < 3) return null;
  if (LEXIS_COMMON.has(w)) return null;
  if (lexisIsNoiseWord(w)) return null;
  // Inflected / derived / British forms ("steered", "replenishing", "apologised",
  // "considerably") are not in the pool, and treating them all as 超纲 badly
  // inflates that bucket — score them in their base form's band instead. A form
  // takes the EASIEST band any of its bases reaches: the web corpus ranks
  // "badly"/"owns"/"stranger" as 生僻 purely because the base form absorbed the
  // hits, and a reader who knows "bad" is not meeting a rare word.
  var us = lexisAmericanize(w);
  var cands = [w];
  if (us !== w) cands.push(us);
  cands = cands.concat(lexisBandStems(w), us !== w ? lexisBandStems(us) : []);
  var best = null;
  for (var k = 0; k < cands.length; k++) {
    if (LEXIS_COMMON.has(cands[k])) return null;
    var hit = _lexisBandLookup(cands[k]);
    if (hit && (!best || _LEXIS_BAND_RANK[hit] < _LEXIS_BAND_RANK[best])) best = hit;
    if (best === "common") return best;
  }
  if (best) return best;
  var b = null;
  // closed compounds written solid ("cannot", "stakeholder", "newcomer"):
  // as hard as the harder half, and certainly not 超纲
  if (w.length >= 6) {
    var known = function (x) { return LEXIS_COMMON.has(x) ? "common" : _lexisBandLookup(x); };
    for (var c = 3; c <= w.length - 3; c++) {
      var l = known(w.slice(0, c)), r = known(w.slice(c));
      if (l && r) return _LEXIS_BAND_RANK[l] > _LEXIS_BAND_RANK[r] ? l : r;
    }
  }
  return "beyond";
}

// Split a passage into render tokens. Word tokens carry the band they count
// toward (null = basic/punctuation, shown as plain text and not tappable).
function lexisPassageTokens(text) {
  var out = [];
  var re = /[A-Za-z][A-Za-z'’-]*/g, last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ text: text.slice(last, m.index), word: false });
    var raw = m[0];
    var key = raw.toLowerCase().replace(/[’']s$/, "");
    // A capitalised word mid-sentence is a name ("the Prentices'", "Margaret") —
    // not vocabulary, and counting it would offer a tappable "rare" word that
    // says nothing about vocabulary size.
    var midSentence = /[^\s.!?"'“”(\[]\s*$/.test(text.slice(0, m.index));
    var isName = midSentence && /^[A-Z]/.test(raw);
    out.push({ text: raw, word: true, key: key, band: isName ? null : lexisWordBand(key) });
    last = m.index + raw.length;
  }
  if (last < text.length) out.push({ text: text.slice(last), word: false });
  return out;
}

// Estimate vocabulary size from what was read.
//   seen    — array of {key, band} for every countable word type encountered
//   unknown — Set of keys the reader tapped as "don't know"
// Per band: knownRatio = 1 − unknown/seen. estVocab = core + Σ bandSize×ratio.
// A band with too few samples inherits a decayed version of the last measured
// ratio rather than being scored as fully known — the honest direction to err.
function lexisEstimateFromReading(seen, unknown) {
  var byBand = {};
  LEXIS_BAND_SEQ.forEach(function (b) { byBand[b] = { seen: 0, unknown: 0 }; });
  var dedup = new Set();
  (seen || []).forEach(function (t) {
    if (!t || !t.band || !byBand[t.band] || dedup.has(t.key)) return;
    dedup.add(t.key);
    byBand[t.band].seen++;
    if (unknown && unknown.has(t.key)) byBand[t.band].unknown++;
  });
  var est = LEXIS_ASSESS_CORE, bands = [], lastRatio = 1, sampled = 0;
  LEXIS_BAND_SEQ.forEach(function (key) {
    var b = byBand[key], measured = b.seen >= 6;
    var ratio = measured ? 1 - b.unknown / b.seen : Math.max(0, lastRatio * 0.7);
    if (measured) { lastRatio = ratio; sampled += b.seen; }
    est += LEXIS_BAND_SIZE[key] * ratio;
    bands.push({ key: key, cn: LEXIS_BAND_LABEL[key], seen: b.seen, unknown: b.unknown, pct: ratio, measured: measured });
  });
  var estVocab = Math.round(est / 100) * 100;
  var confidence = sampled >= 120 ? "high" : sampled >= 60 ? "mid" : "low";
  // A thin sample can put the point estimate near the ceiling on very little
  // evidence, so report the honest interval alongside it — reading another
  // passage narrows it rather than just moving the number.
  var margin = confidence === "high" ? 0.08 : confidence === "mid" ? 0.16 : 0.28;
  return {
    estVocab: estVocab,
    range: [Math.round((estVocab * (1 - margin)) / 100) * 100, Math.round((estVocab * (1 + margin)) / 100) * 100],
    bands: bands,
    sampled: sampled,
    confidence: confidence,
    // where to start Discover: the rank you've reliably reached inside the pool
    frontierRank: Math.max(0, Math.min(LEXIS_FREQ.length - 1, Math.round(estVocab - LEXIS_ASSESS_CORE))),
  };
}


// ===========================================================================
// REVIEW ENGINE (shared by the extension and H5 — one behaviour, one place)
// ===========================================================================
// Why more than one drill type. Laufer & Goldstein (2004) separate four
// "strengths" of knowing a word: passive recognition (see word → pick meaning),
// active recognition (see meaning → pick word), passive recall (see word →
// produce meaning) and active recall (produce the word itself). Only the last
// predicts whether you can USE it, and staring at a card thinking "yes I know
// this" is the one with no criterion at all — it measures familiarity, not
// knowledge, which is why it feels productive and isn't. So the review ladder
// climbs recognition → cued production → free production as a word matures,
// and — following the encoding-variability line of work — asks for the word in
// SEVERAL different sentences rather than drilling one to death, because a
// word met in varied contexts is retrieved more flexibly later.
var LEXIS_DRILL_CN = {
  sense: "Which sense here?", word: "Pick the word", cloze: "Fill the gap", zh2en: "Say it in English",
  collo: "Collocation", dict: "Dictation", recall: "Recall",
};
// 全英学习环境 uses these instead — an immersion mode that still labels the card
// in Chinese isn't one.
var LEXIS_DRILL_EN = {
  sense: "Which sense here?", word: "Pick the word", cloze: "Fill the gap", zh2en: "Say it in English",
  collo: "Collocation", dict: "Dictation", recall: "Recall",
};

function lexisHashText(s) {
  var x = String(s || "").toLowerCase().replace(/\s+/g, " ").trim(), h = 0;
  for (var i = 0; i < x.length; i++) h = (h * 31 + x.charCodeAt(i)) | 0;
  return "s" + (h >>> 0).toString(36);
}

// Is this sentence worth putting in front of you? A captured fragment
// ("of the curve"), a truncated snippet or a URL-laden line teaches nothing —
// the original sentence you saved is often exactly this.
function lexisSentenceQuality(text, head) {
  var t = String(text || "").replace(/\s+/g, " ").trim();
  if (!t) return 0;
  if (/https?:\/\/|www\.|@[a-z]|[<>{}|]/i.test(t)) return 0;
  var n = t.split(" ").filter(Boolean).length;
  var hn = String(head || "").trim().split(/\s+/).filter(Boolean).length;
  if (n < hn + 3) return 0;                       // barely more than the headword
  var s = 1;
  if (n < 6) s -= 0.35;
  if (n > 26) s -= 0.2;
  if (n > 36) s -= 0.3;
  if (!/[.!?"”’]$/.test(t)) s -= 0.15;            // looks cut off
  if (!/^["“(\[A-Z]/.test(t)) s -= 0.12;          // starts mid-sentence
  if (/(^|\s)(…|\.\.\.)/.test(t)) s -= 0.25;
  if ((t.match(/\d/g) || []).length > 6) s -= 0.2;
  return Math.max(0, Math.min(1, s));
}

// Split a sentence around the target so it can be rendered with a real input
// box sitting IN the gap (pre + [input] + post) instead of a "____" placeholder
// and a separate field somewhere below.
function lexisClozeSplit(text, head) {
  var first = String(head || "").split(/\s*\/\s*/)[0].trim();
  if (!first || !text) return null;
  var re;
  try {
    re = new RegExp("\\b" + first.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+") + "\\w*", "i");
  } catch (e) { return null; }
  var m = re.exec(text);
  if (!m) return null;
  return { pre: text.slice(0, m.index), answer: m[0], post: text.slice(m.index + m[0].length) };
}

// Every sentence we could drill this word in, best first. Sources are labelled
// so the UI can say where a sentence came from ("我的例句" / "原句").
function lexisWordSentences(w) {
  var d = (w && w.data) || {}, head = (w && w.word) || "";
  var out = [], seen = {};
  var push = function (text, cn, source, bonus) {
    var t = String(text || "").replace(/\s+/g, " ").trim();
    if (!t) return;
    var k = lexisHashText(t);
    if (seen[k]) return;
    var q = lexisSentenceQuality(t, head);
    if (!q) return;
    if (!lexisClozeSplit(t, head)) return;        // target must actually appear
    seen[k] = 1;
    out.push({ key: k, text: t, cn: cn || "", source: source, quality: Math.min(1, q + (bonus || 0)) });
  };
  (d.userExamples || []).forEach(function (e) { push(e.text, e.translation, "mine", 0.25); });
  (d.examples || []).forEach(function (e) { push(e.text, e.translation, "example", e.translation ? 0.08 : 0); });
  (d.collocations || []).forEach(function (c) { push(c.example, c.exampleCn, "collo", -0.05); });
  push(w && w.context, "", "context", -0.05);
  ((w && w.sightings) || []).forEach(function (s) { push(s && s.context, "", "context", -0.08); });

  // Which SENSE you actually saved the word for. A sentence that uses a
  // different sense teaches the wrong thing — you looked up "glitch" as a
  // software fault and get drilled on a sentence about a video game. Sentences
  // whose sense disagrees with the captured one are pushed to the back, and
  // dropped outright when a matching one exists.
  // Default to the PRIMARY sense; the captured sentence overrides it only when
  // the match is confident. (A captured sentence often has too few content words
  // to pin a sense down — "a glitch in the build pipeline" doesn't — but the
  // primary sense is still the one you meant, not the video-game one.)
  var homeSense = null;
  if ((d.meanings || []).length > 1) {
    homeSense = 0;
    var origin = (w && w.context || "").trim();
    if (origin) {
      var os = lexisSenseFor(w, origin);
      if (os && os.confident) homeSense = os.index;
    }
  }
  if (homeSense !== null) {
    out.forEach(function (o) {
      if (o.source === "mine" || o.source === "context") { o.sense = homeSense; return; }
      var sf = lexisSenseFor(w, o.text);
      o.sense = sf ? sf.index : null;
      o.offSense = !!(sf && sf.confident && sf.index !== homeSense);
    });
    var onSense = out.filter(function (o) { return !o.offSense; });
    if (onSense.length >= 2) out = onSense;          // enough on-sense material: drop the rest
    else out.forEach(function (o) { if (o.offSense) o.quality -= 0.4; });
  }
  return out.sort(function (a, b) { return b.quality - a.quality; });
}

// Which sense is this sentence using? Content-word overlap with each
// definition — crude, but enough to tell "run a company" from "run a mile",
// and it is what lets the review say 「你存的那句是这个意思」 and then hand you a
// DIFFERENT sentence for the same sense.
var LEXIS_SENSE_STOP = new Set(("a an the of to in on at by for with as is are was were be been " +
  "or and but not that this these those it its his her their your our something someone " +
  "sb sth one ones you they we he she i him them us me who which what when").split(" "));
function lexisSenseFor(w, sentence) {
  var d = (w && w.data) || {}, ms = d.meanings || [];
  if (!ms.length) return null;
  var toks = String(sentence || "").toLowerCase().match(/[a-z][a-z'-]*/g) || [];
  var bag = {};
  toks.forEach(function (t) {
    if (LEXIS_SENSE_STOP.has(t) || t.length < 3) return;
    bag[t] = 1;
    (lexisStemCandidates(t) || []).forEach(function (c) { bag[c] = 1; });
  });
  // second signal: the usage SCENE. Definition words and sentence words rarely
  // overlap literally ("runs 400 stores" vs "be in charge of a business"), but
  // they land in the same scene bucket — that is what separates 经营 from 跑步.
  var sceneOf = function (words2) {
    var h = {};
    words2.forEach(function (t) {
      var dm = typeof lexisWordDomain === "function" ? lexisWordDomain(t, true) : null;
      if (dm && dm.key) h[dm.key] = (h[dm.key] || 0) + 1;
    });
    return h;
  };
  var sBag = sceneOf(Object.keys(bag));
  var sim = function (a, b) {
    var num = 0, na = 0, nb = 0, k;
    for (k in a) { na += a[k] * a[k]; if (b[k]) num += a[k] * b[k]; }
    for (k in b) nb += b[k] * b[k];
    return (na && nb) ? num / Math.sqrt(na * nb) : 0;
  };
  var best = -1, bestI = 0, second = -1;
  for (var i = 0; i < ms.length; i++) {
    var txt = ((ms[i].definition || "") + " " + (ms[i].cn || "")).toLowerCase();
    var dt = txt.match(/[a-z][a-z'-]*/g) || [];
    var hit = 0, tot = 0, keep = [];
    for (var j = 0; j < dt.length; j++) {
      if (LEXIS_SENSE_STOP.has(dt[j]) || dt[j].length < 3) continue;
      tot++; keep.push(dt[j]);
      if (bag[dt[j]]) hit++;
      else if ((lexisStemCandidates(dt[j]) || []).some(function (c) { return bag[c]; })) hit++;
    }
    var lex = tot ? hit / Math.sqrt(tot) : 0;
    var score = lex + 0.6 * sim(sBag, sceneOf(keep));
    score -= i * 0.01;                              // ties → the primary sense
    if (score > best) { second = best; best = score; bestI = i; }
    else if (score > second) second = score;
  }
  // only claim a sense when it actually beat the alternatives
  return { index: bestI, meaning: ms[bestI], confident: best > 0.28 && (ms.length < 2 || best - second > 0.12) };
}

// how many DIFFERENT sentences you have produced this word in
function lexisProduced(w) {
  var r = ((w && w.data) || {}).rev || {};
  return (r.produced || []).length;
}
// A word is "produced" only once you've written it into this many distinct
// sentences — one lucky fill-in is a fluke, three is a habit. Capped by how
// many usable sentences the entry actually has.
function lexisProduceTarget(w) {
  return Math.min(3, Math.max(1, lexisWordSentences(w).length));
}

function lexisShuffle(arr, seed) {
  var a = arr.slice(), s = seed || 1;
  for (var i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    var j = s % (i + 1);
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

// Build the drill for one card.
//   w    — the saved word
//   pool — other saved words, used for plausible multiple-choice distractors
//   opts — {force: mode, seed: n}
// Returns {mode, ...} or {mode:"recall"} when the entry is too thin to drill.
function lexisBuildDrill(w, pool, opts) {
  opts = opts || {};
  var d = w.data || {}, head = (w.word || "").trim();
  var reps = (w.srs && w.srs.reps) || 0;
  var rev = d.rev || {};
  var sents = lexisWordSentences(w);
  var seed = opts.seed || (lexisHashText(head + reps).charCodeAt(1) + reps * 7);
  var isChunk = /\s/.test(head);
  var others = (pool || []).filter(function (x) {
    return x && x.id !== w.id && (x.word || "").toLowerCase() !== head.toLowerCase();
  });

  // rotate through sentences instead of drilling the same one every time —
  // varied contexts are what make a word retrievable outside the one it was met in
  var used = rev.seen || [];
  var fresh = sents.filter(function (s) { return used.indexOf(s.key) < 0; });
  var pick = (fresh[0] || sents[0] || null);

  // What sense did YOUR captured sentence use? Shown alongside a different
  // drill sentence, which is the whole point: your original is often a poor
  // example, but it does tell us which meaning you cared about.
  var origin = (w.context || "").trim();
  var originSense = origin ? lexisSenseFor(w, origin) : null;

  // The ladder: recognition while the form-meaning link is still being built,
  // then cued production, then unaided production. A word that hasn't yet been
  // produced in enough different sentences stays on cloze — that is the gap
  // being closed, and rotating the sentence is what makes it stick.
  // A 选义 card only teaches something when the entry HAS more than one sense and
  // the drill sentence pins one of them down — then the distractors are the word's
  // OWN other senses and the choice is real discrimination. With a single sense the
  // distractors can only come from unrelated notebook entries, and the "correct"
  // option is just the headword paraphrased ("wild goose chase" → "a search that is
  // a waste of time"), so the card is answerable by topic-matching without knowing
  // the phrase at all. Single-sense entries therefore go straight to production.
  var senseSF = (pick && (d.meanings || []).length > 1) ? lexisSenseFor(w, pick.text) : null;
  var canSense = !!(senseSF && senseSF.confident && senseSF.meaning);

  var mode = opts.force;
  if (!mode) {
    var canZh = !!(pick && pick.cn) || !!d.cn;
    var canDict = !isChunk && !!(d.audioUs || d.audioUk || d.phonetic);
    // nothing to put a blank in — fall back to producing it from the meaning
    // (still a criterion) rather than to a "did I know that?" self-rating
    if (!sents.length) mode = (d.cn && opts.lang !== "en") ? "zh2en" : "recall";
    else if (reps === 0) mode = canSense ? "sense" : "cloze";
    else if (reps === 1) mode = others.length >= 3 ? "word" : "cloze";
    else if (reps <= 3) mode = "cloze";
    else {
      var ladder = ["cloze", canZh ? "zh2en" : "cloze", "cloze", canDict ? "dict" : (canZh ? "zh2en" : "cloze")];
      mode = ladder[reps % ladder.length];
      // not yet produced in enough distinct sentences → keep drilling those
      if (lexisProduced(w) < lexisProduceTarget(w) && fresh.length && mode === "dict") mode = "cloze";
    }
  }
  if ((mode === "cloze" || mode === "word") && !pick) mode = (d.cn && opts.lang !== "en") ? "zh2en" : "recall";
  if (mode === "zh2en" && !(pick && pick.cn) && !d.cn) mode = pick ? "cloze" : "recall";
  // auto-picked 选义 without a pinned sense would be the useless version — drop it
  if (mode === "sense" && !canSense && !opts.force) mode = pick ? "cloze" : "recall";

  var labels = (opts.lang === "en") ? LEXIS_DRILL_EN : LEXIS_DRILL_CN;
  var base = { mode: mode, cn: d.cn || "", sentence: pick, originSense: originSense,
    produced: lexisProduced(w), target: lexisProduceTarget(w), label: labels[mode] };

  if (mode === "sense") {
    // A sentence is only shown when we can actually tell WHICH sense it uses —
    // otherwise the "right" answer would be a coin flip on a polysemous word.
    var sf = senseSF || (pick ? lexisSenseFor(w, pick.text) : null);
    var withSentence = !!(sf && sf.confident && sf.meaning);
    var target = withSentence ? sf.meaning : (d.meanings || [])[0];
    // EVERY option on a card is in ONE language. Mixing 中文 and English options
    // made the card unanswerable — you were comparing a gloss against a
    // definition, not two meanings. Try the preferred language first; if it
    // can't produce enough distractors, switch the WHOLE card, never mix.
    var langs = (opts.lang === "en") ? ["en", "cn"] : ["cn", "en"];
    var built = null;
    for (var li = 0; li < langs.length && !built; li++) {
      var lang = langs[li];
      var glossOf = function (m) {
        if (!m) return "";
        return String((lang === "en" ? m.definition : m.cn) || "").trim();
      };
      var correct = glossOf(target) || (lang === "en" ? "" : d.cn) || "";
      if (!correct) continue;
      var wrong = [];
      // when a sentence pins the sense down, this word's OTHER senses are the
      // sharpest distractors there are — that is the discrimination being trained
      if (withSentence) (d.meanings || []).forEach(function (m) {
        if (wrong.length >= 2) return;
        var g = glossOf(m);
        if (g && g !== correct && wrong.indexOf(g) < 0) wrong.push(g);
      });
      // then glosses from other notebook words, in the same language
      lexisShuffle(others, seed).forEach(function (x) {
        if (wrong.length >= 3) return;
        var xd = x.data || {};
        var g = lang === "en"
          ? String(((xd.meanings || [])[0] || {}).definition || "").trim()
          : String(xd.cn || "").split(/[;；]/)[0].trim();
        if (!g || g === correct || wrong.indexOf(g) >= 0) return;
        if (Math.abs(g.length - correct.length) > (lang === "en" ? 40 : 14)) return;
        wrong.push(g);
      });
      if (wrong.length >= 2) built = { correct: correct, wrong: wrong, lang: lang };
    }
    if (!built) return pick
      ? Object.assign(base, { mode: "cloze", label: labels.cloze }, cloze(pick))
      : Object.assign(base, { mode: "recall", label: labels.recall });
    var opts2 = lexisShuffle([built.correct].concat(built.wrong.slice(0, 3)), seed + 3);
    return Object.assign(base, { options: opts2, answer: built.correct, optionLang: built.lang,
      sentence: withSentence ? pick : null, sentenceCn: withSentence ? pick.cn : "" });
  }

  if (mode === "word") {
    var sp = lexisClozeSplit(pick.text, head);
    var cands = [];
    (d.lookalikes || []).forEach(function (l) { if (l && l.word) cands.push(l.word); });
    (d.synonymsRich || []).forEach(function (s) { if (s && s.word) cands.push(s.word); });
    lexisShuffle(others, seed + 1).forEach(function (x) { cands.push(x.word); });
    var uniq = [], lower = { };
    lower[head.toLowerCase()] = 1;
    cands.forEach(function (c) {
      var lc = String(c || "").toLowerCase();
      if (!lc || lower[lc] || uniq.length >= 3) return;
      if (/\s/.test(lc) !== isChunk) return;         // don't offer a phrase against a word
      lower[lc] = 1; uniq.push(c);
    });
    if (uniq.length < 2) return Object.assign(base, { mode: "cloze", label: labels.cloze }, cloze(pick));
    return Object.assign(base, { pre: sp.pre, post: sp.post, answer: sp.answer,
      sentenceCn: pick.cn, options: lexisShuffle([sp.answer].concat(uniq), seed + 5) });
  }

  if (mode === "zh2en") {
    return Object.assign(base, { zh: (pick && pick.cn) || d.cn, answer: head,
      initial: head.slice(0, 1), full: pick ? pick.text : "" });
  }

  if (mode === "dict") {
    return Object.assign(base, { answer: head, audio: d.audioUs || d.audioUk || "", full: pick ? pick.text : "" });
  }

  if (mode === "cloze") return Object.assign(base, cloze(pick));
  return base;

  function cloze(s) {
    if (!s) return {};
    var sp2 = lexisClozeSplit(s.text, head);
    if (!sp2) return {};
    return { pre: sp2.pre, answer: sp2.answer, post: sp2.post, sentenceCn: s.cn, sentenceKey: s.key, source: s.source };
  }
}

// record that a sentence was seen / produced correctly (mutates w.data.rev)
function lexisMarkDrill(w, drill, correct) {
  var d = w.data || (w.data = {});
  var r = d.rev || (d.rev = { seen: [], produced: [] });
  r.seen = r.seen || []; r.produced = r.produced || [];
  var k = drill && (drill.sentenceKey || (drill.sentence && drill.sentence.key));
  if (k) {
    if (r.seen.indexOf(k) < 0) r.seen.push(k);
    if (r.seen.length > 24) r.seen = r.seen.slice(-24);
    var productive = drill.mode === "cloze" || drill.mode === "zh2en" || drill.mode === "dict";
    if (correct && productive && r.produced.indexOf(k) < 0) r.produced.push(k);
  } else if (correct && drill && drill.mode === "zh2en") {
    var kk = lexisHashText(drill.zh || "");
    if (r.produced.indexOf(kk) < 0) r.produced.push(kk);
  }
  return r;
}


// ---------------------------------------------------------------------------
// Chunk tabs, de-overlapped.
// The two sources genuinely overlap: 51 terms sit in BOTH lists, and 107 of the
// PHRASE List's 498 entries are structurally phrasal verbs — which is exactly
// why 短语动词 and 固定表达 felt like the same tab. So: every phrasal verb goes
// to ONE tab (PHaVE first, since it carries the sense breakdown), and 固定表达
// keeps everything that is NOT a phrasal verb, with idioms folded in — an idiom
// is a fixed expression, and one fewer tab is one less thing to decide.
// ---------------------------------------------------------------------------
var LEXIS_PV_ALL = (function () {
  var out = [], seen = {};
  (LEXIS_PHAVE_LIST || []).forEach(function (x) { var k = x.term.toLowerCase(); if (!seen[k]) { seen[k] = 1; out.push(x.term); } });
  (LEXIS_PHRASE_LIST || []).forEach(function (x) {
    var k = x.term.toLowerCase();
    if (!seen[k] && lexisPhraseType(x.term) === "pv") { seen[k] = 1; out.push(x.term); }
  });
  return out;
})();
var LEXIS_EXPR_ALL = (function () {
  var out = [], seen = {};
  (LEXIS_PV_ALL || []).forEach(function (t) { seen[t.toLowerCase()] = 1; });   // never repeat a phrasal verb here
  (LEXIS_PHRASE_LIST || []).forEach(function (x) {
    var k = x.term.toLowerCase();
    if (!seen[k] && lexisPhraseType(x.term) !== "pv") { seen[k] = 1; out.push(x.term); }
  });
  Object.keys(LEXIS_IDIOM_SCENE || {}).forEach(function (t) {
    var k = t.toLowerCase(); if (!seen[k]) { seen[k] = 1; out.push(t); }
  });
  (LEXIS_PHRASE_SEED_FLAT || []).forEach(function (x) {
    var t = x.term || x, k = String(t).toLowerCase();
    // the curated collocations run through the same filter — a phrasal verb
    // belongs in the other tab no matter which list it came from
    if (!seen[k] && k.indexOf(" ") > 0 && lexisPhraseType(t) !== "pv") { seen[k] = 1; out.push(t); }
  });
  return out;
})();
var LEXIS_IDIOM_SET = new Set(Object.keys(LEXIS_IDIOM_SCENE || {}).map(function (t) { return t.toLowerCase(); }));

// A pool term can carry a parenthetical disambiguator or a slash alternative —
// "at the time ('when this happened')", "there is / are". Fine in a study list,
// wrong as a headword you save. This is the form we show AND save.
function lexisCleanChunk(term) {
  return String(term || "").replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
}
// Every phrasal verb / fixed expression IN OUR OWN POOLS that uses this word.
//
// This replaces the Datamuse bigram "collocations". Those were statistical
// two-word co-occurrences with no relation to the taxonomy the rest of the app
// teaches, and each one needed a dictionary call plus a sentence call before it
// was readable at all — which is why that card sat on "loading…" for seconds.
// These come from the same curated pools Discover uses, carry the source paper's
// own example sentence, and cost NOTHING: no network, no await, no cache.
//
// Matching is stem-aware in both directions, so a saved "carried" still finds
// "carry on" and a saved "scales" still finds "tip the scales".
function lexisChunksWith(word, limit) {
  var w = String(word || "").toLowerCase().trim();
  if (!w) return [];
  // A saved entry is very often a PHRASE, a hyphenated compound, or a whole
  // clause ("latency-sensitive", "the history will write the verdict"). Matching
  // that whole string against the pools finds nothing, so this card came up
  // empty exactly where the entry had the least other content. Fall back to its
  // CONTENT WORDS: chunks built on the same verbs and nouns are the usable
  // English around what you saved.
  var heads = [w];
  if (/[\s\-–—\/]/.test(w)) {
    heads = w.split(/[\s\-–—\/]+/).filter(function (x) { return x && x.length > 1 && !LEXIS_BD_STOP[x]; });
    if (!heads.length) heads = [w];
  }
  var forms = {};
  heads.forEach(function (h) {
    forms[h] = 1;
    if (typeof lexisStemCandidates === "function") {
      try { lexisStemCandidates(h).forEach(function (c) { forms[c] = 1; }); } catch (e) {}
    }
  });
  var out = [], seen = {};
  var scan = function (pool, kind) {
    (pool || []).forEach(function (raw, i) {
      var term = lexisCleanChunk(raw);
      var lc = term.toLowerCase();
      if (!lc || lc === w || seen[lc]) return;
      var parts = lc.split(" ");
      var hit = parts.some(function (p) {
        if (forms[p]) return true;
        if (typeof lexisStemCandidates !== "function") return false;
        try { return lexisStemCandidates(p).some(function (c) { return forms[c]; }); } catch (e) { return false; }
      });
      if (!hit) return;
      seen[lc] = 1;
      var ph = (typeof LEXIS_PHAVE_MAP !== "undefined" && LEXIS_PHAVE_MAP.get) ? LEXIS_PHAVE_MAP.get(raw) : null;
      var sense = ph && ph.senses && ph.senses[0];
      out.push({
        term: term,
        kind: kind,
        ptype: (typeof lexisPhraseType === "function") ? lexisPhraseType(term) : "",
        example: ((typeof LEXIS_PHRASE_EXAMPLE !== "undefined" && LEXIS_PHRASE_EXAMPLE.get) ? LEXIS_PHRASE_EXAMPLE.get(raw) : "") || (sense && sense.example) || "",
        gloss: (sense && (sense.gloss || sense.meaning)) || "",
        rank: i,                                    // pools are already frequency-ordered
      });
    });
  };
  scan(typeof LEXIS_PV_ALL !== "undefined" ? LEXIS_PV_ALL : [], "pv");
  scan(typeof LEXIS_EXPR_ALL !== "undefined" ? LEXIS_EXPR_ALL : [], "expr");
  // an entry that comes with a real example teaches more than a bare term, so it
  // goes first; frequency breaks the tie
  out.sort(function (a, b) { return ((b.example ? 1 : 0) - (a.example ? 1 : 0)) || (a.rank - b.rank); });
  return out.slice(0, limit || 8);
}
// ===========================================================================
// BREAKDOWN — a notebook entry is never allowed to be empty
// ===========================================================================
// Two kinds of saved term will NEVER have a dictionary entry, no matter how good
// the look-up gets, and telling you "not found · possibly misspelled" is both
// wrong and useless:
//
//   1. PRODUCTIVE COMPOUNDS — "latency-sensitive", "customer-facing",
//      "data-driven". English builds these on demand; no dictionary lists them
//      because there is nothing to list. But they are perfectly transparent
//      ONCE you know the pattern, and the pattern is a small closed set.
//   2. FREE SENTENCES — "the history will write the verdict". This is a clause
//      you liked, not a lexical item. What you actually want back is what it is
//      made of and the fixed English around those words.
//
// So instead of a dead end we compose, OFFLINE and deterministically, from
// material we already have. Everything here is clearly LABELLED as composed —
// the standing rule that we never pass a component's meaning off as the whole
// term's meaning still holds; we just stop being silent about it.
var LEXIS_BD_STOP = (function () {
  var o = Object.create(null);
  ("a an the this that these those my your his her its our their some any each every no "
   + "of to in on at for with from by as and or but if so than then there here it he she they we you i "
   + "is are was were be been being am do does did will would can could shall should may might must "
   + "have has had not nor too very up down out off over about into onto upon within without "
   + "one ones s t re ve ll d m").split(" ").forEach(function (w) { o[w] = 1; });
  return o;
})();
// Productive second elements. Each is [English template, Chinese template]; X is
// the first element. These are the ones that actually turn up in tech / business
// reading, which is where the un-listable compounds come from.
var LEXIS_COMPOUND_TAIL = {
  sensitive: ["sensitive to X — it degrades or goes wrong when X is bad", "对 X 敏感的 —— X 一差就出问题"],
  driven: ["driven by X — X is what decides how it behaves", "由 X 驱动的"],
  based: ["based on X — X is what it is built on", "基于 X 的"],
  bound: ["limited by X — X is the bottleneck", "受 X 制约的"],
  aware: ["aware of X — it takes X into account", "考虑到 X 的"],
  friendly: ["easy on X — designed to suit X", "对 X 友好的"],
  hostile: ["works against X", "对 X 不友好的"],
  heavy: ["uses a lot of X", "X 占比很大的、很吃 X 的"],
  intensive: ["needs a lot of X", "X 密集型的"],
  free: ["with no X in it at all", "无 X 的"],
  proof: ["X can't damage or get through it", "防 X 的"],
  resistant: ["stands up to X", "抗 X 的"],
  ready: ["already prepared for X", "为 X 准备好的"],
  oriented: ["organised around X", "以 X 为导向的"],
  focused: ["concentrating on X", "专注于 X 的"],
  facing: ["pointed at X — X is who deals with it", "面向 X 的"],
  specific: ["true only for X, not in general", "特定于 X 的"],
  related: ["to do with X", "与 X 相关的"],
  wide: ["across the whole X", "覆盖整个 X 的"],
  level: ["at the level of X", "X 层面的"],
  first: ["X comes before everything else", "X 优先的"],
  led: ["with X in charge of it", "由 X 主导的"],
  backed: ["supported or funded by X", "由 X 支持的"],
  owned: ["belonging to X", "归 X 所有的"],
  run: ["operated by X", "由 X 运营的"],
  made: ["made by or in X", "由 X 制造的"],
  born: ["originating in X", "源自 X 的"],
  prone: ["tends to X — it happens to this a lot", "易于 X 的"],
  rich: ["with a lot of X in it", "富含 X 的"],
  poor: ["short of X", "缺少 X 的"],
  scale: ["of X size", "X 规模的"],
  term: ["over an X span of time", "X 期的"],
  grade: ["good enough for X", "达到 X 级别的"],
  like: ["resembling X", "像 X 一样的"],
  worthy: ["deserving X", "值得 X 的"],
  seeking: ["looking for X", "寻求 X 的"],
  agnostic: ["works with any X — X doesn't matter to it", "与 X 无关的、不挑 X 的"],
  native: ["built for X from the start, not adapted to it", "原生于 X 的"],
  centric: ["with X at the centre of it", "以 X 为中心的"],
  centered: ["with X at the centre of it", "以 X 为中心的"],
  centred: ["with X at the centre of it", "以 X 为中心的"],
  savvy: ["good at X", "精通 X 的"],
  shy: ["avoids X", "回避 X 的"],
};
// A compound we can explain with no network at all. Returns null when the
// pattern isn't one we know — we guess nothing.
function lexisCompoundGloss(term) {
  var t = String(term || "").toLowerCase().trim();
  if (!/^[a-z]+(?:[-–—][a-z]+)+$/.test(t)) return null;
  var parts = t.split(/[-–—]/).filter(Boolean);
  if (parts.length < 2) return null;
  var tail = parts[parts.length - 1];
  var tpl = Object.prototype.hasOwnProperty.call(LEXIS_COMPOUND_TAIL, tail) ? LEXIS_COMPOUND_TAIL[tail] : null;
  if (!tpl || !tpl.length) return null;
  var head = parts.slice(0, -1).join(" ");
  return { head: head, tail: tail, en: tpl[0].replace(/X/g, head), cn: tpl[1].replace(/X/g, head) };
}
// What a term is made of, for the parts we can look up individually.
//   compound → the hyphen pieces        phrase/sentence → the content words
function lexisBreakdownParts(term) {
  var t = String(term || "").trim().toLowerCase();
  if (!t) return { kind: "word", parts: [] };
  if (!/\s/.test(t) && /[-–—]/.test(t)) {
    return { kind: "compound", parts: t.split(/[-–—]+/).filter(Boolean).slice(0, 6) };
  }
  var w = t.replace(/[^a-z'\s-]/g, " ").split(/\s+/).filter(Boolean);
  if (w.length < 2) return { kind: "word", parts: w };
  var content = w.filter(function (x) { return x.length > 1 && !LEXIS_BD_STOP[x]; });
  return { kind: w.length > 4 ? "sentence" : "phrase", parts: (content.length ? content : w).slice(0, 6) };
}
// Fixed expressions sitting INSIDE what you saved. A clause you liked often
// contains a chunk that IS teachable on its own — that chunk is the part worth
// keeping, and it is free to find.
function lexisChunksInside(term, limit) {
  var t = " " + String(term || "").toLowerCase().replace(/[^a-z\s'-]/g, " ").replace(/\s+/g, " ").trim() + " ";
  if (t.trim().indexOf(" ") < 0) return [];
  var out = [], seen = {};
  var scan = function (pool, kind) {
    (pool || []).forEach(function (raw, i) {
      var c = lexisCleanChunk(raw), lc = c.toLowerCase();
      if (!lc || lc.indexOf(" ") < 0 || seen[lc]) return;
      if (t.indexOf(" " + lc + " ") < 0) return;
      seen[lc] = 1;
      out.push({ term: c, kind: kind, ptype: lexisPhraseType(c) || "", rank: i,
        example: ((typeof LEXIS_PHRASE_EXAMPLE !== "undefined" && LEXIS_PHRASE_EXAMPLE.get) ? LEXIS_PHRASE_EXAMPLE.get(raw) : "") || "" });
    });
  };
  scan(typeof LEXIS_PV_ALL !== "undefined" ? LEXIS_PV_ALL : [], "pv");
  scan(typeof LEXIS_EXPR_ALL !== "undefined" ? LEXIS_EXPR_ALL : [], "expr");
  out.sort(function (a, b) { return b.term.length - a.term.length || a.rank - b.rank; });
  return out.slice(0, limit || 4);
}
// The whole offline breakdown for a term. `glosses` (a {word: {pos, definition,
// cn}} map fetched once and stored on the entry) is optional — without it this
// still returns something worth reading.
function lexisTermBreakdown(term, glosses) {
  var bd = lexisBreakdownParts(term);
  var g = glosses || {};
  var gl = lexisCompoundGloss(term);
  // "对 latency 敏感的" reads worse than "对 延迟 敏感的" — once the first element
  // has its own Chinese, put it into the template.
  if (gl && g[gl.head] && g[gl.head].cn) gl.cn = gl.cn.split(gl.head).join(g[gl.head].cn);
  return {
    kind: bd.kind,
    gloss: gl,
    parts: bd.parts.map(function (p) {
      var x = g[p] || g[p.toLowerCase()] || null;
      return { word: p, pos: (x && x.pos) || "", definition: (x && x.definition) || "", cn: (x && x.cn) || "" };
    }),
    inside: lexisChunksInside(term, 4),
  };
}
// Is there enough here to be worth showing instead of "not found"?
function lexisBreakdownUseful(bd) {
  if (!bd || bd.kind === "word") return false;   // a single word isn't "made of" anything
  return !!(bd.gloss || (bd.inside && bd.inside.length) ||
    (bd.parts || []).some(function (p) { return p.definition || p.cn; }));
}

// ---- Phrase & idiom check: sampling -------------------------------------
// The old version was a plain even-step walk over each pool, so EVERY round
// asked the same 50 chunks — redoing the check measured nothing new, which is
// the whole point of redoing it. Now the walk runs over what you have NOT been
// asked yet: the even spread across the frequency range is preserved (the step
// is recomputed over what is left), each round is genuinely fresh, and when a
// pool runs out it starts over rather than returning nothing.
// `pos` stays the item's index in the FULL pool, because that is what the
// frontier means — how far into the pool Discover may skip.
function lexisChunkSample(judged, counts) {
  var done = {};
  (judged || []).forEach(function (t) { done[String(t).toLowerCase()] = 1; });
  var n = counts || { phrase: 24, pv: 14, idiom: 12 };
  var left = 0;
  var walk = function (src, want) {                 // even step across what's given
    var out = [];
    if (!src.length || want <= 0) return out;
    var step = Math.max(1, Math.floor(src.length / want));
    for (var i = 0; i < src.length && out.length < want; i += step) out.push(src[i]);
    return out;
  };
  var pools = [
    { src: "phrase", want: n.phrase, arr: (typeof LEXIS_PHRASE_LIST !== "undefined" ? LEXIS_PHRASE_LIST : []).map(function (x, i) {
      return { term: x.term, src: "phrase", pos: i, ex: x.example || "" }; }) },
    { src: "pv", want: n.pv, arr: (typeof LEXIS_PHAVE_LIST !== "undefined" ? LEXIS_PHAVE_LIST : []).map(function (x, i) {
      return { term: x.term, src: "pv", pos: i, ex: (x.senses && x.senses[0] && x.senses[0].example) || "" }; }) },
    { src: "idiom", want: n.idiom, arr: Object.keys(typeof LEXIS_IDIOM_SCENE !== "undefined" ? LEXIS_IDIOM_SCENE : {}).map(function (t, i) {
      return { term: t, src: "idiom", pos: i, ex: "" }; }) },
  ];
  var total = 0;
  pools.forEach(function (p) {
    p.fresh = p.arr.filter(function (x) { return !done[x.term.toLowerCase()]; });
    p.take = Math.min(p.want, p.fresh.length);
    left += p.fresh.length;
    total += p.want;
  });
  // The idiom pool is only ~49 deep, so at 12 a round it is spent after four
  // rounds while the phrase pool (498) still has hundreds left. Hand the slots a
  // dry pool can't fill to the pools that CAN — repeating a question you have
  // already answered measures nothing, and a round of 50 fresh chunks is the
  // whole reason to take the check again.
  var deficit = total - pools.reduce(function (s, p) { return s + p.take; }, 0);
  for (var pass = 0; pass < 3 && deficit > 0; pass++) {
    pools.forEach(function (p) {
      if (deficit <= 0) return;
      var give = Math.min(p.fresh.length - p.take, deficit);
      if (give > 0) { p.take += give; deficit -= give; }
    });
  }
  var out = [];
  pools.forEach(function (p) { out = out.concat(walk(p.fresh, p.take)); });
  // only when EVERY pool is spent do we revisit, and then from what's left over
  // rather than restarting at the top of the list
  if (deficit > 0) {
    var used = {};
    out.forEach(function (x) { used[x.term.toLowerCase()] = 1; });
    pools.forEach(function (p) {
      if (deficit <= 0) return;
      var rest = p.arr.filter(function (x) { return !used[x.term.toLowerCase()]; });
      walk(rest, Math.min(p.want, deficit)).forEach(function (x) {
        out.push(x); used[x.term.toLowerCase()] = 1; deficit--;
      });
    });
  }
  out.freshLeft = left;                       // 0 → every pool has been through once
  return out;
}
// Fold one round's answers into the running totals. Identical on both surfaces:
// a re-check has to ADD evidence, not replace it, or the second round is worth
// less than the first.
function lexisChunkTally(prev, items, markedSet) {
  prev = prev || {};
  var bySrc = {};
  ["phrase", "pv", "idiom"].forEach(function (src) {
    var g = items.filter(function (x) { return x.src === src; });
    if (!g.length && !(prev.bySrc && prev.bySrc[src])) return;
    var bad = g.filter(function (x) { return markedSet.has(x.term); });
    var pb = (prev.bySrc && prev.bySrc[src]) || {};
    var seen = (pb.seen || 0) + g.length;
    var unknown = (pb.unknown || 0) + bad.length;
    var rf = bad.length ? Math.min.apply(null, bad.map(function (x) { return x.pos; })) : null;
    var frontier;
    if (rf === null) frontier = (pb.frontier === undefined || pb.frontier === null)
      ? (g.length ? g[g.length - 1].pos : 0) : pb.frontier;
    else frontier = (pb.frontier === undefined || pb.frontier === null) ? rf : Math.min(pb.frontier, rf);
    bySrc[src] = { seen: seen, unknown: unknown, frontier: frontier, pct: seen ? 1 - unknown / seen : 1 };
  });
  var uniq = function (list) {
    var o = [], s = {};
    list.forEach(function (t) { var k = String(t).toLowerCase(); if (t && !s[k]) { s[k] = 1; o.push(t); } });
    return o;
  };
  var asked = {};
  items.forEach(function (x) { asked[x.term.toLowerCase()] = 1; });
  // a chunk you were asked again and did NOT tap this time is no longer unknown
  var keptUnknown = (prev.unknown || []).filter(function (t) {
    return !asked[String(t).toLowerCase()] || markedSet.has(t);
  });
  return {
    at: prev.at || 0,
    rounds: (prev.rounds || 0) + 1,
    seen: uniq((prev.seen || []).concat(items.map(function (x) { return x.term; }))),
    unknown: uniq(keptUnknown.concat(Array.from(markedSet))),
    bySrc: bySrc,
  };
}

// what each Discover tab actually is, in one line
var LEXIS_TAB_WHAT = {
  words: "Single words.",
  pv: "<b>Verb + particle</b>, where the whole doesn't mean what the parts say (pick up / keep up / go through). The hardest class to use correctly on purpose, so it gets its own tab — with the share of real occurrences each sense covers.",
  expr: "Everything else you have to memorise <b>whole</b>: collocations, prepositional phrases, discourse markers and idioms. No phrasal verbs here — they are all in the previous tab, never repeated.",
};


// ===========================================================================
// SYNC MERGE (shared — the extension and H5 must agree exactly or devices fight)
// ===========================================================================
// Three rules, and every symptom of the old merge traces to breaking one:
//
//   1. IDENTITY IS THE id, NOT THE WORD.  The old merge keyed by lowercased
//      headword. Rename an entry on one device (查不到 → 改成词典里的形式) and the
//      two devices produce the same id under two different keys: both survive,
//      the array ends up with two elements sharing one id, and deleting either
//      one removes BOTH (the UI filters by id). That is "调整前后共存" and
//      "删了老的把新的也删了" in one bug.
//   2. USER INTENT: NEWER WINS.  Deleting, renaming, marking 已掌握, writing 我的
//      例句, doing a review — the later action is the real one.
//   3. LOOKUP DATA: RICHER WINS, TIME IS IRRELEVANT.  The phone can only reach
//      CORS-open dictionaries, so its copy is legitimately thinner. Under
//      newer-wins it would overwrite a desktop entry you had re-fetched five
//      times to get right. Quality decides, and an empty field is always filled
//      from the other side — a merge can never lose content.
var LEXIS_DATA_FIELDS = ["meanings", "examples", "userExamples", "collocations", "synonyms",
  "synonymsRich", "synoGroups", "family", "lookalikes", "suggestions"];

function lexisDataScore(d) {
  if (!d) return -1;
  var n = function (k) { return Array.isArray(d[k]) ? d[k].length : 0; };
  var score = n("meanings") * 6 + n("examples") * 3 + n("userExamples") * 8 +
    n("collocations") * 2 + n("synonymsRich") * 2 + n("family") + n("lookalikes") +
    (d.cn ? 4 : 0) + (d.phonetic ? 2 : 0) + (d.audioUs || d.audioUk ? 1 : 0) + (d.freq ? 1 : 0);
  // Chinese on the senses is the thing that most often goes missing on a re-fetch
  (d.meanings || []).forEach(function (m) { if (m && m.cn) score += 2; });
  if (d.partGlosses) score += Object.keys(d.partGlosses).length * 2;  // a breakdown is content
  if (d.notFound) score -= 40;             // a 查不到 copy must never beat a real one
  return score;
}

// Merge two payloads: start from the better one, then fill every gap from the
// other. Nothing that exists on either side is ever dropped.
function lexisMergeData(a, b) {
  a = a || {}; b = b || {};
  var better = lexisDataScore(a) >= lexisDataScore(b) ? a : b;
  var other = better === a ? b : a;
  var out = {};
  var k;
  for (k in other) out[k] = other[k];
  for (k in better) out[k] = better[k];
  // per-field, take whichever side actually has more — the winner of the overall
  // score can still be the poorer copy on one particular field
  LEXIS_DATA_FIELDS.forEach(function (f) {
    var nb = Array.isArray(better[f]) ? better[f].length : 0;
    var no = Array.isArray(other[f]) ? other[f].length : 0;
    if (no > nb) out[f] = other[f];
  });
  ["cn", "phonetic", "audioUs", "audioUk", "audio", "contextMeaning", "image", "freq"].forEach(function (f) {
    if (!better[f] && other[f]) out[f] = other[f];
  });
  // the breakdown of a term no dictionary lists — union it, so a part glossed on
  // one device isn't dropped because the other copy scored higher overall
  if (a.partGlosses || b.partGlosses) {
    var pg = {}, pk;
    [other.partGlosses, better.partGlosses].forEach(function (m) {
      for (pk in (m || {})) if (m[pk]) pg[pk] = m[pk];
    });
    if (Object.keys(pg).length) out.partGlosses = pg;
  }
  // 我的例句 is hand-written and irreplaceable — union, never a pick
  var mine = [], seenEx = {};
  (a.userExamples || []).concat(b.userExamples || []).forEach(function (e) {
    var t = e && String(e.text || "").trim();
    if (!t || seenEx[t]) return;
    seenEx[t] = 1; mine.push(e);
  });
  if (mine.length) out.userExamples = mine;
  // which sentences you've been drilled on / produced — union both ways
  var ra = a.rev || {}, rb = b.rev || {};
  var uniq = function (x, y) {
    var o = [], seen2 = {};
    (x || []).concat(y || []).forEach(function (v) { if (v && !seen2[v]) { seen2[v] = 1; o.push(v); } });
    return o;
  };
  if (ra.seen || rb.seen || ra.produced || rb.produced) {
    out.rev = { seen: uniq(ra.seen, rb.seen).slice(-24), produced: uniq(ra.produced, rb.produced) };
  }
  out.notFound = !!(better.notFound && other.notFound);   // found anywhere = found
  return out;
}

// Merge two records that are the SAME entry (same id, or same headword before
// ids were compared).
function lexisMergeWordPair(a, b) {
  if (!a) return b;
  if (!b) return a;
  var newer = (b.updatedAt || 0) > (a.updatedAt || 0) ? b : a;
  var older = newer === b ? a : b;
  var out = {};
  var k;
  for (k in older) out[k] = older[k];
  for (k in newer) out[k] = newer[k];      // rule 2: headword / status / flags
  out.id = a.id || b.id;
  out.createdAt = Math.min(a.createdAt || Infinity, b.createdAt || Infinity) || (a.createdAt || b.createdAt);
  out.updatedAt = Math.max(a.updatedAt || 0, b.updatedAt || 0);
  out.data = lexisMergeData(a.data, b.data);   // rule 3
  // reviews actually happened — the side with more of them is the true state
  var sa = a.srs || {}, sb = b.srs || {};
  out.srs = ((sb.reps || 0) > (sa.reps || 0) || ((sb.reps || 0) === (sa.reps || 0) && (sb.interval || 0) > (sa.interval || 0))) ? sb : sa;
  if (a.mastered || b.mastered) out.mastered = true;
  // every original sentence ever captured, on any device
  var sights = [], seen = {};
  (a.sightings || []).concat(b.sightings || []).forEach(function (x) {
    var c = x && String(x.context || "").trim();
    if (!c || seen[c]) return;
    seen[c] = 1; sights.push(x);
  });
  out.sightings = sights.slice(-8);
  return out;
}

// Tombstone keys for an entry: its id AND its headword, so a delete sticks even
// if the other device knows the entry under an older name.
function lexisTombKeys(w) {
  var out = [];
  if (!w) return out;
  if (w.id) out.push(w.id);
  var t = String(w.word === undefined ? w : w.word || "").toLowerCase().replace(/\s+/g, " ").trim();
  if (t) { out.push("w:" + t); out.push(t); }   // bare form kept for pre-1.59 tombstones
  return out;
}
function lexisTombAt(tombs, w) {
  var best = 0;
  lexisTombKeys(w).forEach(function (k) { if (tombs && tombs[k] > best) best = tombs[k]; });
  return best;
}

// Collapse duplicates that a previous word-keyed merge may have left behind:
// same id twice, or the same headword twice. Repairs existing notebooks.
function lexisDedupeWords(list) {
  var byId = {}, order = [], dupes = 0;
  (list || []).forEach(function (w) {
    if (!w) return;
    var id = w.id || ("k:" + String(w.word || "").toLowerCase().trim());
    if (byId[id]) { byId[id] = lexisMergeWordPair(byId[id], w); dupes++; }
    else { byId[id] = w; order.push(id); }
  });
  var byWord = {}, out = [];
  order.forEach(function (id) {
    var w = byId[id];
    var k = String(w.word || "").toLowerCase().replace(/\s+/g, " ").trim();
    if (!k) { out.push(w); return; }
    if (byWord[k] !== undefined) { out[byWord[k]] = lexisMergeWordPair(out[byWord[k]], w); dupes++; }
    else { byWord[k] = out.length; out.push(w); }
  });
  return { words: out, dupes: dupes };
}

// The whole merge. local/remote are word arrays, tombs is the union map.
// Returns {words, changed}.
function lexisMergeNotebooks(local, remote, tombs) {
  tombs = tombs || {};
  var changed = false;
  var alive = function (w) { return (w.updatedAt || 0) > lexisTombAt(tombs, w); };
  var kept = (local || []).filter(function (w) {
    if (alive(w)) return true;
    changed = true; return false;                       // the other device deleted it
  });
  var byId = {}, byWord = {};
  kept.forEach(function (w, i) {
    if (w.id) byId[w.id] = i;
    var k = String(w.word || "").toLowerCase().replace(/\s+/g, " ").trim();
    if (k) byWord[k] = i;
  });
  (remote || []).forEach(function (r) {
    if (!r || !r.word) return;
    if (!alive(r)) { changed = true; return; }          // we deleted it — don't take it back
    var k = String(r.word || "").toLowerCase().replace(/\s+/g, " ").trim();
    var at = (r.id && byId[r.id] !== undefined) ? byId[r.id] : (byWord[k] !== undefined ? byWord[k] : -1);
    if (at < 0) {
      kept.push(r);
      if (r.id) byId[r.id] = kept.length - 1;
      if (k) byWord[k] = kept.length - 1;
      changed = true;
      return;
    }
    var before = JSON.stringify(kept[at]);
    kept[at] = lexisMergeWordPair(kept[at], r);
    if (JSON.stringify(kept[at]) !== before) changed = true;
    var nk = String(kept[at].word || "").toLowerCase().replace(/\s+/g, " ").trim();
    if (nk) byWord[nk] = at;
  });
  var d = lexisDedupeWords(kept);
  if (d.dupes) changed = true;
  return { words: d.words, changed: changed, dupes: d.dupes };
}

if (typeof window !== "undefined") { window.LEXIS_SEED = LEXIS_SEED; window.LEXIS_SEED_FLAT = LEXIS_SEED_FLAT; window.LEXIS_FREQ = LEXIS_FREQ; window.LEXIS_COMMON = LEXIS_COMMON; window.LEXIS_MORPH = LEXIS_MORPH; window.lexisAnalyzeMorph = lexisAnalyzeMorph; window.lexisWordDomain = lexisWordDomain; window.LEXIS_SCENE_CN = LEXIS_SCENE_CN; window.lexisIdiomScene = lexisIdiomScene; window.LEXIS_PHRASE_SEED = LEXIS_PHRASE_SEED; window.LEXIS_PHRASE_SEED_FLAT = LEXIS_PHRASE_SEED_FLAT; window.lexisPhraseScene = lexisPhraseScene; window.lexisSingularize = lexisSingularize; window.LEXIS_PASSAGES = LEXIS_PASSAGES; window.LEXIS_BAND_SIZE = LEXIS_BAND_SIZE; window.LEXIS_BAND_SEQ = LEXIS_BAND_SEQ; window.LEXIS_BAND_LABEL = LEXIS_BAND_LABEL; window.lexisWordBand = lexisWordBand; window.lexisPassageTokens = lexisPassageTokens; window.lexisEstimateFromReading = lexisEstimateFromReading; window.LEXIS_PROPER_NOUNS = LEXIS_PROPER_NOUNS; window.LEXIS_JUNK_WORDS = LEXIS_JUNK_WORDS; window.lexisIsNoiseWord = lexisIsNoiseWord; window.LEXIS_ABBREV = LEXIS_ABBREV; window.lexisStemCandidates = lexisStemCandidates; window.LEXIS_PHRASE_LIST = LEXIS_PHRASE_LIST; window.LEXIS_PHRASE_EXAMPLE = LEXIS_PHRASE_EXAMPLE; window.LEXIS_PTYPE_CN = LEXIS_PTYPE_CN; window.LEXIS_KIND_CN = LEXIS_KIND_CN; window.LEXIS_PTYPE_RULE = LEXIS_PTYPE_RULE; window.lexisKindOf = lexisKindOf; window.lexisDataScore = lexisDataScore; window.lexisMergeData = lexisMergeData; window.lexisMergeWordPair = lexisMergeWordPair; window.lexisMergeNotebooks = lexisMergeNotebooks; window.lexisDedupeWords = lexisDedupeWords; window.lexisTombKeys = lexisTombKeys; window.lexisTombAt = lexisTombAt; window.lexisPhraseType = lexisPhraseType; window.LEXIS_PHAVE_LIST = LEXIS_PHAVE_LIST; window.LEXIS_PHAVE_MAP = LEXIS_PHAVE_MAP; window.LEXIS_DRILL_CN = LEXIS_DRILL_CN; window.LEXIS_DRILL_EN = LEXIS_DRILL_EN; window.lexisHashText = lexisHashText; window.lexisSentenceQuality = lexisSentenceQuality; window.lexisClozeSplit = lexisClozeSplit; window.lexisWordSentences = lexisWordSentences; window.lexisSenseFor = lexisSenseFor; window.lexisProduced = lexisProduced; window.lexisProduceTarget = lexisProduceTarget; window.lexisBuildDrill = lexisBuildDrill; window.lexisMarkDrill = lexisMarkDrill; window.LEXIS_FREQ_SUPP = LEXIS_FREQ_SUPP; window.LEXIS_PV_ALL = LEXIS_PV_ALL; window.LEXIS_EXPR_ALL = LEXIS_EXPR_ALL; window.LEXIS_IDIOM_SET = LEXIS_IDIOM_SET; window.LEXIS_TAB_WHAT = LEXIS_TAB_WHAT; window.lexisChunksWith = lexisChunksWith; window.lexisCleanChunk = lexisCleanChunk; window.LEXIS_COMPOUND_TAIL = LEXIS_COMPOUND_TAIL; window.lexisCompoundGloss = lexisCompoundGloss; window.lexisBreakdownParts = lexisBreakdownParts; window.lexisChunksInside = lexisChunksInside; window.lexisTermBreakdown = lexisTermBreakdown; window.lexisBreakdownUseful = lexisBreakdownUseful; window.lexisChunkSample = lexisChunkSample; window.lexisChunkTally = lexisChunkTally; }
