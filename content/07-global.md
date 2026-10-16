# Global — Navigation, Footer, Meta, Microcopy

The copy that appears on every page, plus the bits that get forgotten until
launch week.

---

## Navigation

> Work · Seven days · Capabilities · Studio · **Start a project**

Five items. "Seven days" sits second because it's the offer, not fifth because
it's alphabetical. "Start a project" is the button, visually distinct, present
on every page including itself.

**No Hindi in navigation.** Ever. Navigation is functional, and a hover
interaction on a nav item competes with the nav's own hover state.

**Mobile menu** — same five, plus email and `[[LinkedIn]]` at the bottom.

**Logo** links home. Alt text: `Girgit Labs`. Not "Girgit Labs logo" — screen
readers already say "image."

---

## Footer

> **Girgit Labs**
> `[[City, India]]` · Working worldwide
>
> **Studio** — Work · Seven days · Capabilities · Studio · Journal
> **Contact** — `[[hello@girgitlabs.com]]` · `[[LinkedIn]]` · `[[Instagram]]` ·
> `[[Behance / Dribbble]]`
> **For agencies** — `[[partners@girgitlabs.com]]`
>
> `[[Currently taking projects for MONTH]]`
>
> © `[[YEAR]]` Girgit Labs · Privacy · Terms

**Optional footer line**, if you want one more moment of the idea:

> *गिरगिट* — the one that changes colour. We think that's a compliment.

Use it or don't; don't use it *and* run the greeting rotator *and* the Fold 2
name story on the same page. Sparklin already runs a multilingual footer
marquee — the entry rotator is our version of that idea and it shouldn't appear
twice.

---

## Meta / SEO

Title tags. Under 60 characters, brand last.

| Page | Title | Description (under 155) |
|---|---|---|
| Home | `Girgit Labs — Digital design studio. Websites in 7 days.` | `A design studio with no house style. High-quality digital experiences, built fast — websites designed, built and live in seven days.` |
| Seven days | `The 7-Day Website — Girgit Labs` | `A complete, high-quality website designed, built and live in seven working days from approved scope. What you bring, how the week runs, what it costs.` |
| Work | `Work — Girgit Labs` | `Websites, digital products, branding and video. Different every time, on purpose.` |
| Capabilities | `Capabilities — Girgit Labs` | `Digital product design, websites, brand identity, video and AI-enabled experiences. Fixed price, fixed dates, never hourly.` |
| Studio | `Studio — Girgit Labs` | `A small design studio working from India for clients everywhere else. Expertise over hierarchy, and one owner per project.` |
| Start | `Start a project — Girgit Labs` | `Tell us what you're building. A reply within one working day from the person who'd run the project.` |

**Notes.**

Every description contains a fact, not an adjective. "Seven working days,"
"fixed price," "one working day" — search results are a place to be concrete.

**OG image** — one per page, 1200×630. The homepage's should be the Fold 2 name
line set large. It's the most shareable thing on the site and the one that makes
someone click.

**Structured data** — `Organization` and `LocalBusiness` on the homepage,
`Service` on the seven-day page, `CreativeWork` on case studies. Nothing exotic.

**`lang` attributes.** Page is `lang="en"`. Every Devanagari span carries
`lang="hi"`. Search engines and screen readers both need this and both do
noticeably worse without it.

---

## 404

> # This page changed colour and wandered off.
>
> It happens. Try the work, or tell us what you were looking for.
>
> → Work · → Start a project

**Notes.** One joke, on brand, no Hindi. If it feels too cute, the plain
version — *"That page doesn't exist."* — is fine and nobody was ever lost by a
sober 404.

---

## Microcopy

Small, high-frequency strings. Consistency here is most of what makes a site
feel made rather than assembled.

| Where | Copy |
|---|---|
| Case study back-link | ← All work |
| Next project | Next project → |
| Load more | More work |
| External link | `[[icon]]` — no text |
| Email copied | Copied |
| Cookie banner, if you must | We use `[[analytics]]` to see which pages people read. Nothing else. **OK** · **No thanks** |
| Newsletter, if you run one | Occasional writing on design, AI and building a studio. No pitch. |
| Journal author byline | Written by `[[Name]]` |
| Reading time | `[[N]] min |
| Image loading | Blur-up placeholder, never a spinner |

**Cookie banner note.** Default to no non-essential cookies and no banner at
all. If you add analytics, choose one that doesn't require consent —
it's less code, less legal surface, and one fewer thing between a Gulf or UK
prospect and your work.

---

## Accessibility copy

- **Skip link** — Skip to content
- **Greeting rotator** — `aria-hidden="true"`, with the real `<h1>` behind it
- **Hindi spans** — `aria-label="rang — Hindi for colour"`, and so on per the
  lexicon in `00-voice-and-hindi-system.md`
- **Decorative images** — `alt=""`, not a description
- **Case study images** — describe what's shown: `Homepage of the Sha Juharmal
  Phoolchand catalogue on desktop`, not `Project image 3`
- **Video** — captions on anything with speech. Non-negotiable if you're selling
  video as a capability.

---

## Pre-launch checklist

- [ ] No `[[placeholders]]` anywhere. Grep for `[[`.
- [ ] Every Devanagari string checked by a native reader — nuqta marks especially (ज़ फ़ क़ ग़).
- [ ] Every Hindi word passes the delete test: remove it, sentence still reads.
- [ ] Hindi words per page: Home 4, Seven days 3, Studio 1, Start 1. Work and Capabilities: none.
- [ ] Hover behaviour tested on touch (tap toggles) and keyboard (Enter/Space).
- [ ] No layout shift when a Hindi word swaps to English.
- [ ] Devanagari font subset loading, with a real fallback stack.
- [ ] "AI" appears at most once on the homepage and once on Studio. Never in an H1.
- [ ] No stat counter that can render `0+`.
- [ ] Availability month in the footer and on Start is current.
- [ ] Form tested end to end — success, error, and the email actually arrives.
- [ ] No invented metrics in any case study.
- [ ] Nothing published from the Sha Juharmal demo without real content and client permission.
