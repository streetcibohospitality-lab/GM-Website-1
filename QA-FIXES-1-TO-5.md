# Expert QA Fixes 1–5

Applied to the zero-visual SEO build.

1. Structured data
   - Removed 78 invalid `https://schema.org/OmnivorousDiet` values.
   - Non-vegetarian menu items now omit `suitableForDiet`.
   - Vegetarian values remain `https://schema.org/VegetarianDiet`.

2. Mysore Swiggy
   - Replaced the Dineout URL with the Mysore delivery listing:
     `https://www.swiggy.com/city/mysore/grub-monkey-vv-mohalla-mysore-city-rest488396`

3. Reduced-motion CSS
   - Corrected the malformed nested `.cassette-orbit,.cassette-spin` rule.
   - The rule is now a valid sibling rule inside the reduced-motion media query.

4. Salted Fries
   - Changed the visible dietary marker from non-veg to veg.
   - Changed Salted Fries schema to `VegetarianDiet`.
   - Item name and price remain unchanged.

5. Menu SEO wording
   - Replaced `smash burgers` with `burgers` in SEO/social/schema descriptions only.
   - No visible menu heading or item copy was changed.

No other requested content or layout changes were made.
