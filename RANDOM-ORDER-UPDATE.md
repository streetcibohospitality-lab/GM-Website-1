# What Should I Order? — Random Menu Recommendation Update

The homepage recommendation machine now uses curated pools built from item names in the current `menu.html`.

## Appetite logic

- **Hungry** → 1 menu pick (a lighter main)
- **Very Hungry** → 2 menu picks (main + side)
- **Destroy Me** → 4 menu picks (feast main + side + extra + shake/drink)

## Random behavior

- A randomized recommendation is shown automatically on first view.
- Clicking any hunger level creates a fresh recommendation.
- Clicking Veg / Chicken / Other creates a fresh recommendation.
- `PULL AGAIN` creates another fresh recommendation.
- The engine avoids immediately repeating the exact same combination for the same hunger + lane when possible.

## Lane curation

- **Veg** uses vegetarian burgers, Po'Boys, MOAW/Fresco choices and vegetarian sides from the current menu.
- **Chicken** uses chicken burgers, MOAW/hot dogs, chicken Po'Boys/Fresco items and chicken-heavy sides/extras from the current menu.
- **Other** is curated primarily from seafood plus the menu's clearly non-chicken meat options.

All core recommendation names are sourced from the current menu. Wing/strip extras combine the existing menu category with an existing listed flavour, for example `Wings — Honey Gochujang`.
