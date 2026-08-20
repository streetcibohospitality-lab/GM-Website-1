# Diner Counter Spread Redesign

Rebuilt the old Reviews + Order layout as one shared diner-counter composition.

## Layout
- Left: compact pinned customer note (social proof)
- Right: primary online-order conversion area
- Bottom: continuous `HUNGRY YET?` counter fascia
- Desktop ratio: approximately 36% review / 64% ordering
- Mobile reorders to: Order → Review → Hungry Yet?

## Review curation
The carousel is now curated to ten 5-star customer notes.

Seven are sourced from 5-star Google reviews for the Grub Monkeys Mangalore listing:
- Priyanka A.
- Trishal P.
- Shaswath S.
- Nishmitha S.
- Shri N.
- Preethika A.
- Aysha T.

Longer public review text was shortened/paraphrased for homepage readability while preserving the substance of the source review.

The remaining three established 5-star notes are from the site's existing District/Zomato/Yappe sources.

The carousel total is calculated dynamically by JavaScript.

## Motion
- one-time note settle on viewport entry
- staged order-content rise
- bottom fascia reveal
- directional review transitions
- tactile order-ticket press
- service lamp pulse
- existing physical bell ring + brief `ORDER UP!` flash
- very slow chrome-counter glint
- no automatic review carousel

All ambient motion is disabled or reduced under `prefers-reduced-motion`.
