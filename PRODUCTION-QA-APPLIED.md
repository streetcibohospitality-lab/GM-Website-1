# Production QA Changes Applied

Applied after the final QA review, while intentionally leaving preview `noindex, nofollow` in place and leaving animation runtime behavior unchanged.

## Applied
- All five Grub Monkeys Instagram handles are now consistent in homepage structured data and all page footers.
- Google review links now target the exact Mangalore outlet/address query instead of a generic city search.
- Removed three superseded image assets no longer referenced by the build.
- Consolidated the historical CSS stack into `styles-base.css` and `styles-interactive.css`, preserving the original cascade order.
- Strengthened keyboard focus treatment on the live CSS team LinkedIn links.
- Added form input length limits, payload bounds, a minimum human-fill time and a 30-second same-session repeat-submit throttle to the franchise enquiry form.
- Re-checked Koramangala public hours. Current public sources still conflict: Zomato/District report dining temporarily closed, while delivery sources indicate ordering opens at 12:00. The build therefore keeps dine-in hours unverified rather than publishing an unsupported closing time.

## Not changed
- `noindex, nofollow` remains because this is still a preview/staging build.
- Existing animations continue running exactly as before; no off-screen animation pausing was added.

## Backend security note
The static frontend cannot prove Supabase Row Level Security policy configuration. Before production, the `franchise_enquiries` table should be verified in Supabase to allow anonymous INSERT only and deny anonymous SELECT/UPDATE/DELETE. The frontend anon key is expected to be public and should never be treated as a secret.
