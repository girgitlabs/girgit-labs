# Girgit Labs — landing page

A static one-page site built from *Landing Page Content — Draft 02*. It uses plain HTML, CSS and JS with no build step, and can be hosted anywhere.

## Run it locally

```bash
python serve.py
```

Then open http://127.0.0.1:5178. Use `serve.py` rather than `python -m http.server`: the film needs HTTP Range support to seek, and the built-in server doesn't have it.

## Files

| Path | What it is |
|---|---|
| `index.html` | The page. Generated, so edit `src/index.template.html` and run `python build.py`. |
| `css/styles.css` | All styles. Brand tokens are at the top. |
| `js/film.js` | The scroll-driven background film, plus the brightness-following dim layer. |
| `js/main.js` | Nav, Hindi hover words, reveals, Services highlight, and the form. |
| `assets/video/` | `forest-1280.mp4` (desktop) and `forest-portrait.mp4` (phones, a centre crop), both encoded with a keyframe every 5 frames for smooth scrubbing. Also the posters and stills. |
| `serve.py` | A local preview server with Range support. |

## The film

One continuous 12-second shot sits fixed behind the page, and scroll position sets its playback time. Each section owns a stretch of film in `data-film="start,end"`:

| Section | Film | On screen | Layout |
|---|---|---|---|
| Hero | 0–1.8s | Pre-dawn forest, chameleon hidden on the branch above | Copy anchored bottom-left; the section is 170vh, so the dawn plays while the headline holds. |
| Services | 1.8–5.6s | Sunrise, it walks the branch, then close on the eye | One frosted card per service in the left column; the chameleon keeps the right. |
| Work | 5.6–7.6s | The eye locks on and the tongue strikes | A two-column preview grid on the left; the strike plays centre-right. |
| Testimonials | 7.6–8.6s | The camera circles behind it | Quote card on the left. |
| About | 8.6–9.9s | Its view over the misty forest | Copy on the left. |
| Contact | 9.9–12s | Dusk, fireflies, it settles into the dark | The form takes the right side; the frame is dark by then. |

**Contrast:** three layers keep the copy readable.
- `.film__veil` is a constant wash, darkest on the left.
- `.film__dim` follows the film's measured brightness, frame by frame.
- `.glass` panels sit behind smaller copy.

Checked across all sampled frames, off-white text in the copy column stays at 9.7:1 or better against the 95th-percentile brightest backdrop pixel.

**Retiming:** change the `data-film` values. **Replacing the film:** re-encode with frequent keyframes, for example `ffmpeg -i in.mp4 -an -c:v libx264 -crf 26 -g 5 -keyint_min 5 -sc_threshold 0 -bf 0 -movflags +faststart out.mp4`, then re-measure `LEFT_LUMA` in `js/film.js`.

**Reduced motion:** the film doesn't scrub; each section shows a still from its own moment.

## Hindi words

These are the reconstructed Draft 02 words: नज़रिया (Perspective, hero and About), सोच (Thinking, Services), खोजबीन (Exploration, Work), शुरुआत (Beginning, Contact). They reveal the English on hover, on tap for touch screens, and on Enter/Space from the keyboard. Screen readers hear both. **Have a native reader check them before launch.**

## Before publishing

- [ ] Connect the form. It works on Netlify as-is (`data-netlify`). On any other host, set `FORM_ENDPOINT` in `js/main.js`. On localhost it only simulates sending.
- [ ] Confirm the email address (`hello@girgitlabs.com` is a placeholder) and the Instagram and LinkedIn URLs in the footer.
- [ ] Replace the six portfolio placeholder cards with real projects.
- [ ] Add approved testimonials.
- [ ] Confirm the final service categories.
- [ ] Add the legal links (Privacy, Terms) once they exist.
