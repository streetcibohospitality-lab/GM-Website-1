# Final UI/UX Polish

Changes in this build:
- tightened Monkey TV, Story, Jukebox and Order copy without changing the brand's signature lines
- added live outlet open/closed status in India Standard Time using current business hours
- added Call actions and more precise addresses to the diner list
- New BEL Road remains the flagship and is the default selected diner
- diner selection is remembered for the browser session
- the selected diner updates the order area and routes Swiggy/Zomato buttons to that outlet when a verified direct link exists
- order platforms that are not available for a selected diner are cleanly hidden instead of sending users to an unrelated outlet
- review sourcing is clearer: 10 customer notes / 7 Google 5★
- upgraded homepage JSON-LD from a single Organization to Organization + Restaurant location entities

Intentionally NOT changed:
- menu Veg / Non-Veg / protein / heat system
- What Should I Order? source data / logic
- no “prices and availability may vary” disclaimer was added
- no additional decorative machines or looping animation were added

The existing `noindex, nofollow` meta tags are left intact because this package is still named as a preview build. Remove those tags only when deploying the final production site.
