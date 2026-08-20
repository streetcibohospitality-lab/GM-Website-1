# Grub Monkeys — Final Detail Pass

Implemented from the latest New Motion build.

## Menu page
- Increased contrast and weight of all menu item names, multi-item rows, notes and inactive tabs.
- Reduced the wings hero photo footprint.
- Reduced the empty space above THE MENU and tightened the hero vertically.
- Preserved the existing mechanical A1–A8 split-board interaction.

## Three receipt printers
The original single printer was replaced by three printers using the same printer shell and the same existing receipt-print animation.

- KOT 063 / DINER DNA
- KOT 064 / HOUSE RULES
- KOT 065 / YOUR ROUTE

They print in a restrained 220ms sequence when the section enters view.

## Jukebox
The jukebox itself is unchanged.
Four CSS-built vinyl records rotate in unused surrounding space at different sizes/speeds/directions.

## Walk In. Stay A While.
Three red neon elements (star, lightning mark, 63) sit only in the grey header area and flicker on separate long cycles.

## Red diner typography panel
A new animated racing-checker strip runs only along the bottom of the red typography area.

## Motion discipline
- No additional animation libraries.
- Vinyl records rotate slowly.
- Neon uses occasional imperfect flickers, not rapid flashing.
- Receipt printers animate once.
- Checker movement is contained to a 26px rail.
- `prefers-reduced-motion` stops all new ambient motion.
