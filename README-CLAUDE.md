# GRUB MONKEYS V5 — CLAUDE-READY

This package is a production-oriented refinement of the previous v4 site, plus the jukebox supplied separately.

## Pages
- `index.html` — shorter consumer homepage
- `menu.html` — full existing menu moved off the homepage
- `franchise.html` — detailed franchise content + enquiry form
- `styles.css` — shared brand/UI system
- `script.js` — shared navigation, TV, reviews, reveals
- `menu.js` — accessible menu tabs
- `franchise.js` — form submission
- `media/monkey-tv.mp4` — temporary silent Monkey TV reel made only from existing Grub Monkeys photos
- `media/monkey-tv-poster.png` — TV poster frame

## What changed
1. Removed misleading "Since the 60s" wording. The site now says "1960s-inspired."
2. Removed public aggregate-rating schema and homepage rating/review-total strip.
3. Removed hard-coded "Open Now" labels.
4. Rebuilt the hero around the stronger burger photo and a poster-style split composition.
5. Added original `MONKEY TV / CHANNEL 63` CRT section with a working silent reel and scene-jump controls.
6. Integrated the supplied Mixcloud classic-rock player into an original Grub Monkeys `MONKEY JUKEBOX`.
7. Moved the full menu to `menu.html`.
8. Moved the long franchise experience/form to `franchise.html`.
9. Replaced the unrelated story food photo with a branded Manipal-origin poster instead of pretending it is archival.
10. Made reviews manual-only.
11. Fixed mobile-nav `aria-expanded`, Escape closing, focus return and focus containment.
12. Upgraded menu tabs to accessible tab semantics and keyboard arrow navigation.
13. Added a honeypot and accessible status messaging to the franchise form.
14. Kept official colors and Jaro/Lexend fonts.

## Important asset TODOs
- Replace the temporary nav/footer lockup with the official Grub Monkeys SVG wordmark when available.
- Replace `media/monkey-tv.mp4` later with a professionally shot 15–30 second Grub Monkeys film. Keep the filename to avoid code changes.
- Add a genuine historic/original Manipal photograph if available.
- Add customer/lifestyle and location-specific photography.

## Franchise form security
The browser-side Supabase anon key was already present in v4 and has been preserved so the form remains functional.

**ACTION REQUIRED BEFORE LAUNCH:** verify Supabase Row Level Security in the dashboard so anonymous users can perform only the intended INSERT into `franchise_enquiries` and cannot SELECT, UPDATE or DELETE enquiry rows. Also consider server-side rate limiting / bot protection for production.

## Data verification
This pass intentionally removed unverified public ratings, review-count totals, "Open Now" labels, ROI wording and "Since the 60s" language. Before reintroducing any business metric, verify it against current business records.

## Jukebox
The jukebox uses the Mixcloud embed supplied in the uploaded Netlify package. Audio never autoplays; the visitor must press play.

## Deploy
This is still a static site with no build step. It can be uploaded directly to Netlify. Keep all files/folders together.

## V7 hero cassette detail
The homepage hero now includes a decorative Grub Monkeys cassette in the desktop negative space. The cassette shell itself remains stationary; only the two internal reel overlays rotate continuously via CSS (`.hero-cassette-reel-top` and `.hero-cassette-reel-bottom`). This is intentional. Do not replace it with whole-object rotation. It is hidden below 1280px to protect mobile/tablet hierarchy, and `prefers-reduced-motion` disables reel animation.

## V10 Retro Motion Note
The retro objects added in V9/V10 are not pre-rendered animated images. Their motion is implemented in HTML/CSS (with minimal JS only to trigger state changes / update real clock time / rotate flipboard text):
- chrome ORDER UP bell: CSS shape + press/rebound + chrome sheen
- flipboard: CSS 3D flip animation, JS only changes the message every few seconds
- motel key tag: CSS shape + idle sway + selection swing
- GRUB IRL polaroids: CSS frames + reveal/drift/hover straighten
- diner wall clock: CSS clock graphic, JS sets actual hand angles
- jukebox coin slot: CSS coin/slot + drop animation on click
- Hall of Fame blind: CSS striped blind + pull-up reveal
- matchbook: CSS shape + periodic lid flap / hover open
- Channel 63 TV: CSS CRT power/static overlays around native video
- hero cassette: still shell asset; only the two reel overlays spin via CSS, the cassette body remains stationary
All animations respect prefers-reduced-motion.


## V11 layout art-direction pass

This package includes the full V10 CSS-animation system plus a V11 homepage layout pass. Preserve the underlying brand direction and do not normalize the homepage back into equal cards or uniform sections. Key layout decisions now include an advertising-poster hero, oversized Monkey TV composition, asymmetric Hall of Fame, CSS diner-counter transition, quieter Manipal story, compact mechanical flipboard, roadside-directory locations with a selected-diner stage, near-full-screen jukebox, tabletop Polaroid social collage, pinned-note reviews, counter-pickup order section, compact franchise strip, and oversized final diner sign.

The retro objects are intentionally browser-native HTML/CSS where possible. Food and restaurant photography remain image assets. The hero cassette shell is an image asset, but its two reels are separate layers and animate independently. Keep `prefers-reduced-motion` support. Do not add more continuous motion unless it solves a specific interaction or fills deliberate negative space.

For locations, the roadside stage uses one generic diner-interior photograph rather than falsely implying it is a photograph of every selected branch. Replace it later only when branch-specific photography is available.
