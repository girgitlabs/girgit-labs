# Girgit Labs — Multilingual Greeting Set

23 greetings for the intro / hero rotator. Ordered for a cycling reveal that
lands on English.

## Why this device fits Girgit

Three reasons, so it's a positioning statement and not just decoration:

1. **It states "international first" without saying it.** A visitor in Dubai,
   London or Toronto sees their own language before they read a word of pitch.
2. **It is the name, performed.** Girgit adapts to whoever walks in. The
   rotator does that literally, in the first two seconds, before any copy
   claims it.
3. **It is a speed demonstration.** 23 states resolving in ~4 seconds sets the
   tempo of the whole site before the 7-day promise is ever mentioned.

## The set

| # | Greeting | Romanized | Language | Note |
|---|---|---|---|---|
| 1 | Hello | — | English | Anchor. Also the final resting state. |
| 2 | Hi | — | English, informal | |
| 3 | नमस्ते | Namaste | Hindi | |
| 4 | مرحبا | Marhaba | Arabic | **RTL.** Gulf is priority market #1. |
| 5 | खम्मा घणी | Khamma Ghani | Rajasthani / Marwari | See note below. |
| 6 | வணக்கம் | Vanakkam | Tamil | |
| 7 | নমস্কার | Nomoshkar | Bengali | |
| 8 | કેમ છો | Kem chho | Gujarati | |
| 9 | ਸਤ ਸ੍ਰੀ ਅਕਾਲ | Sat Sri Akal | Punjabi | Longest string — check wrapping. |
| 10 | Bonjour | — | French | France + Canada. |
| 11 | Hola | — | Spanish | Spain + US Hispanic market. |
| 12 | Olá | — | Portuguese | |
| 13 | Ciao | — | Italian | |
| 14 | Hallo | — | German | |
| 15 | Hej | — | Swedish | |
| 16 | Cześć | — | Polish | |
| 17 | Привет | Privet | Russian | Informal, kept short on purpose. |
| 18 | Γειά σου | Yia sou | Greek | |
| 19 | שלום | Shalom | Hebrew | **RTL.** |
| 20 | Merhaba | — | Turkish | |
| 21 | 你好 | Nǐ hǎo | Mandarin | |
| 22 | こんにちは | Konnichiwa | Japanese | |
| 23 | 안녕하세요 | Annyeonghaseyo | Korean | |

### On Khamma Ghani

This is the one greeting on the list nobody expects. It's Rajasthani, it's
warm, and it quietly says the team is from somewhere specific rather than from
nowhere. Keep it only if the connection is real — a fake regional greeting is
worse than no regional greeting. If it stays, it should sit in the first third
of the cycle where people are still watching, not buried at #18.

### Spares

If you want to swap any out: **Xin chào** (Vietnamese), **สวัสดี / Sawasdee**
(Thai), **Halo** (Indonesian), **Kumusta** (Filipino), **Jambo** (Swahili),
**Sawubona** (Zulu), **Hoi** (Dutch), **Hei** (Norwegian), **नमस्कार**
(Marathi), **ನಮಸ್ಕಾರ** (Kannada).

Six of the 23 are Indian languages. That is deliberate but it is a dial — if
"international first" should read harder, cut Bengali and Gujarati and pull in
Vietnamese and Thai.

## Ordering logic

Not alphabetical and not random. The cycle runs:

**Hello → Hi** (establish the word) → **Hindi → Arabic → Rajasthani** (identity
and priority market, early, while attention is highest) → **Indian languages** →
**European** → **Cyrillic / Greek / Hebrew** → **CJK** (most visually distinct,
kept for the back half so the rotator doesn't peak too soon) → resolve on
**Hello**.

Randomising per visit is tempting. Don't — you lose control of the first three
frames, which are the only ones most people see.

## Implementation notes

**Timing.** ~120–160ms per greeting, easing to ~400ms on the last three, then
hold on "Hello". Total ≈ 4s. Anything longer and it stops being a flourish and
starts being a loading screen.

**Never block content.** The greeting is an overlay or a hero state, not a
gate. Text and nav must be in the DOM and reachable from frame one. If JS
fails, the page shows "Hello" and nothing is lost.

**RTL.** Arabic (#4) and Hebrew (#19) need `dir="rtl"` set per item, not on the
container. With a centred rotator this is invisible to the eye but correct for
screen readers and for any punctuation added later.

**Fonts.** No single typeface covers Latin + Devanagari + Arabic + Gurmukhi +
Tamil + Bengali + Gujarati + Cyrillic + Greek + Hebrew + CJK. Set an explicit
fallback stack or the browser substitutes something ugly mid-cycle and the
whole effect cheapens:

```css
font-family: /* your display face */,
  "Noto Sans Devanagari", "Noto Sans Arabic", "Noto Sans Gurmukhi",
  "Noto Sans Tamil", "Noto Sans Bengali", "Noto Sans Gujarati",
  "Noto Sans Hebrew", "Noto Sans JP", "Noto Sans KR", "Noto Sans SC",
  system-ui, sans-serif;
```

Subset aggressively — you need roughly 40 glyphs, not 40 full fonts. Each
greeting is a handful of characters; a unicode-range subset per script keeps
this under ~15KB total.

**Metrics.** Devanagari and Gurmukhi have taller ascenders and deeper
descenders than Latin. Fix the rotator's line box height to the tallest item so
the layout doesn't jump on every frame.

**Accessibility.** Wrap the rotator in `aria-hidden="true"` and put a plain
`<h1>` with the real headline behind it. The greeting is decoration; screen
readers should hear the actual page, not 23 words for "hello".

**Reduced motion.** `prefers-reduced-motion: reduce` → skip the cycle, render
"Hello" immediately, no fade.

**Once per session.** Store a flag so returning visitors and internal
navigation don't sit through it again. A rotator you cannot skip is charming
once and irritating twice.

## Data

```js
const GREETINGS = [
  { text: "Hello",         lang: "en",    dir: "ltr" },
  { text: "Hi",            lang: "en",    dir: "ltr" },
  { text: "नमस्ते",          lang: "hi",    dir: "ltr" },
  { text: "مرحبا",          lang: "ar",    dir: "rtl" },
  { text: "खम्मा घणी",       lang: "raj",   dir: "ltr" },
  { text: "வணக்கம்",         lang: "ta",    dir: "ltr" },
  { text: "নমস্কার",         lang: "bn",    dir: "ltr" },
  { text: "કેમ છો",          lang: "gu",    dir: "ltr" },
  { text: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ",     lang: "pa",    dir: "ltr" },
  { text: "Bonjour",       lang: "fr",    dir: "ltr" },
  { text: "Hola",          lang: "es",    dir: "ltr" },
  { text: "Olá",           lang: "pt",    dir: "ltr" },
  { text: "Ciao",          lang: "it",    dir: "ltr" },
  { text: "Hallo",         lang: "de",    dir: "ltr" },
  { text: "Hej",           lang: "sv",    dir: "ltr" },
  { text: "Cześć",         lang: "pl",    dir: "ltr" },
  { text: "Привет",        lang: "ru",    dir: "ltr" },
  { text: "Γειά σου",      lang: "el",    dir: "ltr" },
  { text: "שלום",           lang: "he",    dir: "rtl" },
  { text: "Merhaba",       lang: "tr",    dir: "ltr" },
  { text: "你好",           lang: "zh",    dir: "ltr" },
  { text: "こんにちは",       lang: "ja",    dir: "ltr" },
  { text: "안녕하세요",       lang: "ko",    dir: "ltr" },
];
```

## Before this ships

Every non-Latin string here should be checked by someone who reads the script.
Machine-correct is not the same as native-correct, and a misspelled greeting on
the first frame of the site is an expensive way to fail. The Arabic, Hebrew,
Tamil, Bengali, Gujarati and Punjabi entries are the ones to verify first.
