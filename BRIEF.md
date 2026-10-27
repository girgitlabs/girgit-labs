# Girgit Labs — master creative brief (from the user, 2026-10-27)

Source of truth for direction from this date. Supersedes earlier palette and type choices in PLAN.md and the v2 build where they conflict.

## Role
Act as creative developer and technical partner: art direction, interaction design, motion design, frontend engineering and creative problem-solving.

## Brand idea
Girgit is a chameleon. The studio takes inspiration from how chameleons observe their surroundings, adapt to different contexts and respond to what's happening around them.
- **Core principle:** *We do not have one style. We have a response.*
- **Disciplines:** branding, UI/UX, product design, website design and development, app design, motion, creative experimentation.
- **The website must express the brand through interactions,** not just explain it through text.

## Visual identity
- **Typeface:** Satoshi as the primary typeface.
  - Tightly kerned display headings.
  - Expressive scale contrasts.
  - Clear, readable body text.
- **Base palette (restrained, editorial):**

  | Colour | Hex |
  |---|---|
  | Warm ivory | `#F4EFE5` |
  | Black | `#111111` |
  | Deep forest green | `#142118` |
  | Olive and sage | accents |

- **Expressive palette (only in deliberate, high-energy moments):**

  | Colour | Hex |
  |---|---|
  | Hot pink | `#FF168C` |
  | Electric blue | `#173BFF` |
  | Acid green | `#43FF18` |
  | Signal yellow | `#FFE500` |

- **Sections:** each feels visually distinct, but all belong to the same brand.

## Creative rules
- No generic agency templates or generic AI-generated layouts.
- Not every section colourful and busy. Use contrast between calm and chaos.
- Animations are meaningful, not decorative.
- The chameleon is a character *and* an interaction system.
- Copy is concise, confident, conversational and slightly mischievous.
- Never invent clients, testimonials, awards or business claims.
- Never claim that a static image is a genuinely animated 3D model.

## Technical rules
- **Before changing anything:** inspect the existing project, and preserve its framework and existing work.
- **Use the right technology for each job:**

  | Need | Use |
  |---|---|
  | Graphic compositions and vector illustration | CSS and SVG |
  | Interactions | JavaScript |
  | Scroll-linked scenes | A suitable scroll-animation library |
  | Genuine 3D | Three.js, or an existing 3D solution |

- **Priorities:** responsive layouts, accessibility, reduced-motion support, performance.
- **Ship the real thing:** build and test the actual website, not a mock-up.
- **Work section by section:**
  - After each section, run it locally, inspect the result and fix issues before proceeding.
  - Never generate the whole experience in one unverified pass.
- **Missing assets:** explain what's needed and implement an honest temporary alternative.
- **Start only on instruction:** wait for the user's section-specific instruction before implementing anything.
