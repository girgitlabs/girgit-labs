# Girgit Labs — website: direction and tone

## Status (2026-10-24): fresh start
Everything from the first rebuild attempt was removed from `website/`, at the user's request. Only the direction and the tone below were kept.
- **Permanently deleted:** that attempt's files (page, sections, code-built 3D chameleon, hero video prompts) were removed at the user's request. Nothing from it remains.
- **The original video site** is still in `_archive/website-video/`.
- **What's left in `website/`:**
  - the logos and favicon
  - `serve.py`, the local server (`python serve.py`, then http://127.0.0.1:5178)
  - the contact backend: `functions/api/contact.js`, its tests in `tests/` and `.env.example`

No design or technical decisions carry over. Choose them fresh, with the user.

### Lessons from attempt 1
- **Agree the look before building.** Show the visual direction first (references, a mockup or a single section) and get approval. Several full builds were rejected on sight.
- **Iterate from what the user can see.** Browser preview is blocked for Claude in auto mode, so the user's screenshots are the feedback loop. Ask for them early.
- **The chameleon was the hardest part.** A code-built chameleon never reached the realistic or claytoon quality wanted. A real sculpted model is the realistic route. A free CC-BY option was found: "Chameleon" by Trouvaille on Sketchfab, https://sketchfab.com/3d-models/3877371976754df68d2b93a181bd4893. It was never downloaded.

## Direction (the founders' brief)
1. **Look:** simple but aggressive. Use the logo's neutrals: ink `#1C1A17` and paper `#F7F3EC`, with burnt orange `#B45309` as the single accent.
2. **Character:** a chameleon is the main moving element of the whole site. The founders asked for Claytoon (clay animation). Later the user asked for it to be realistic and inspired by the real world.
3. **Hero:** "You missed it, we didn't". Overwhelming visuals that stop, then call out the details you missed.
4. **Capabilities:** the chameleon adapts its skin to each service, moving rock to rock.
5. **Camouflage:** the chameleon hides. Find it and "You found us. Let's connect." springs up.
6. **Our Projects:** needed, but its direction is still deferred.
7. More sections will come later.

**Structural reference:** the founders' prototype, https://girgit-labs-deploy.vercel.app. Its order is hero, adaptation system (capabilities on rocks), camouflage, 360° vision (independent eyes), manifesto, work, then contact.

## Tone of the content
Source of truth: `content/` (read `00-voice-and-hindi-system.md` first) plus the prototype's copy.
- **Positioning:** *"We don't have a house style. We have yours."* The idea that runs through the whole site is *rang*: colour and adaptation.
- **Voice:**
  - Opinionated, specific, unafraid of a strong claim (Sparklin).
  - One idea carried throughout (Litmus).
  - One short line per project (Wolff Olins).
- **Sentences:** short, then a long one when it earns its place.
- **Claims:** carry evidence or get cut. "Structure is a fact. Adjectives are claims."
- **Banned words:** "passionate", "solutions", "leverage", "seamless", "journey", "in our DNA", "tribe", and stat counters.
- **Speed:** never say AI is why we're fast. The reasons are a small senior team, no handoffs, and the slow work done before the clock starts.
- **Person:** second person ("you'll see it on day 3").
- **Size:** never apologise for being small or new. Small is the advantage.
- **India:** a fact and a timezone advantage, never a discount. No chai jokes, no namaste sign-off.
- **Hindi:** a few inline Devanagari words that swap to English on hover. Nothing load-bearing ever sits behind a hover.
- **Prototype lines to keep in spirit:**
  - "You missed it. We didn't."
  - "We look closer. We move faster."
  - "We do not have one style. We have a response."
  - "Find what's hiding."
  - "We're always looking."
  - "No fixed formula. No boring solutions."
  - "Got a good idea? Let's make it real."
