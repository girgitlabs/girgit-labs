# Girgit Labs — Voice & the Hindi Hover System

Read this before writing or editing any page. Everything else in `/content`
assumes these rules.

---

## 1. Positioning, in one line

**We don't have a house style. We have yours.** High-quality digital
experiences, built fast — websites live in seven days.

The breadth in the operating doc is not a gap waiting to be filled with a niche.
It is the product. A studio named after a creature that changes to match where
it stands has already explained why it works across sectors. Say it that way and
"we haven't specialised yet" becomes "we deliberately don't impose."

## 2. Voice

Reference weighting agreed with the founder:

- **Sparklin** — for voice. Opinionated, specific, unafraid of a strong claim.
- **Litmus** — for discipline. One idea (theirs is *push*) carried through the
  whole site. Ours is *rang* — colour, adaptation.
- **Wolff Olins** — for restraint on project lines. One short line per project,
  no paragraph.
- **SandCup** — the counter-example. Nothing on this site says "a tribe of
  creative minds," "in our DNA," "you ideate, we deliver," or shows a stat
  counter that can render as `0+`.

### Rules

**Short sentences. Then a long one when it earns its place.** Vary or it drones.

**Claims carry evidence or they get cut.** "Fast" is a claim. "Seven days from
approved scope, with checkpoints on day 1, day 3 and day 7" is evidence.

**Never say AI is why we're fast.** The operating doc is explicit: AI
strengthens execution, it isn't the loudest promise. The sayable version of the
speed is true and better anyway — small senior team, no handoffs, designers who
ship their own frontend, and all the slow work done before the clock starts.

**No "we are passionate about." No "solutions." No "leverage." No "seamless."
No "journey" as a noun for anything but travel.**

**Second person over third.** "You'll see it on day 3," not "clients see it."

**Never apologise for being small or new.** Small is the reason the work is
fast and the decision chain is short. Say it like an advantage, because it is.

### On India

We say where we are. We never explain it, apologise for it, or price against
it. India appears as a fact and a timezone advantage, never as a discount.
No chai jokes. No namaste-as-signoff. The Hindi in the copy carries the
cultural signal with far more confidence than any of that.

---

## 3. The Hindi hover system

Selected Hindi words appear inline in Devanagari. On hover — tap on touch — the
word swaps to its English meaning.

### The one rule that governs everything

**Nothing load-bearing goes behind a hover.**

A reader who never hovers, can't hover, or can't read Devanagari must lose
nothing. The Hindi word is always either:

- **(a) a restatement** — the sentence has already said it in English, and the
  Hindi is the emphasis; or
- **(b) a display pairing** — Hindi in large type directly above or beside the
  English line it belongs to.

If a sentence stops making sense when you delete the Hindi word, rewrite the
sentence. This is not negotiable — get it wrong and the site is broken for the
Gulf, UK and US clients who are priority one.

### Density

**Two to four per page. Never more.** Sprinkled everywhere it stops being a
detail and becomes a gimmick. The restraint is what makes it feel considered.

Never two in the same sentence. Never one in a CTA button. Never one in
navigation, form labels, error messages or legal copy.

### Markup

```html
<span class="hi" data-en="colour" lang="hi" tabindex="0" role="button"
      aria-label="rang — Hindi for colour">रंग</span>
```

- **Hover** swaps the text to `data-en`. Keep the width stable or the line
  reflows and the whole paragraph jumps — measure both strings, reserve the
  wider, centre the shorter.
- **Tap** toggles on touch devices. Tap again to return.
- **Keyboard** — focusable, Enter/Space toggles, visible focus ring.
- **Screen readers** get the `aria-label`, so they hear both.
- **No JS** — the Devanagari shows and the sentence still reads. That's the
  whole point of the load-bearing rule.
- **Reduced motion** — swap instantly, no crossfade.
- **First visit** — one subtle hint on the first Hindi word only, then never
  again. A dotted underline is enough; don't build a tooltip tutorial.

### Typography

Devanagari needs a real face — `Noto Sans Devanagari` or similar — matched in
weight and optical size to the Latin. Devanagari sits on a hanging headline
(शिरोरेखा) and has deeper descenders; set the line box to the taller of the two
so nothing shifts on swap.

---

## 4. Lexicon

Canonical. The same word always maps to the same English across the whole site.
Do not improvise new ones page by page.

| Devanagari | Roman | English (`data-en`) | Where it earns its place |
|---|---|---|---|
| रंग | rang | colour | The core idea. Home hero, the name fold. |
| सात दिन | saat din | seven days | The offer. Use once, in display type. |
| असली | asli | real | Proof, case studies, "real work for real businesses". |
| नक़्ल | naql | a copy | "We don't do naql" — against template work. |
| छाप | chhaap | imprint | What the client's brand leaves. Studio page. |
| ढाँचा | dhaancha | structure | Sitemap / IA / systems work. |
| खाका | khaaka | blueprint | Pre-production, the scope gate. |
| नींव | neenv | foundation | Groundwork before day 1. |
| रफ़्तार | raftaar | pace | Speed, but the good kind. |
| पक्का | pakka | solid, settled | A finished V1. Opposite of a rough MVP. |
| कच्चा | kachcha | unfinished | What we refuse to ship. Pairs with pakka. |
| भरोसा | bharosa | trust | Client relationship, referrals. |
| साफ़ | saaf | clear | Clean interfaces, clear scope. |
| ज़िद | zid | stubbornness | Pushing back on bad decisions. |
| वादा | vaada | promise | The seven-day commitment. |
| मिज़ाज | mizaaj | temperament | Every brand's own character. |
| फ़र्क़ | farq | difference | Before/after, results. |
| सोच | soch | thinking | Strategy, the journal. |
| कारीगर | kaarigar | craftsman | The team. Use sparingly — it's a big word. |
| शुरू | shuru | begin | The start-a-project page. Once. |

**Deliberately excluded:** जुगाड़ (*jugaad*). It means an improvised workaround
and it is exactly the impression a fast studio must not give. If it appears
anywhere it appears as a negative — "this isn't jugaad" — and honestly, better
not at all.

### Before launch

Every Devanagari string on the site gets checked by a native reader. Nuqta
marks (ज़, फ़, क़, ग़) are the usual failure point and they change the word.
A typo in the one Hindi word on a page is more visible than a typo anywhere
else on the site.

---

## 5. Placeholder convention

Anything the founder must supply is written as `[[SQUARE DOUBLE BRACKETS]]`.
Search for `[[` before launch; if any remain, the page isn't ready.
