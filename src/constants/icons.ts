/**
 * src/constants/icons.ts
 *
 * One icon language for the whole app (lucide-react-native only).
 *
 * Stroke weights:
 *   - regular   2     every inline / button / header icon (lucide default)
 *   - emphasis  2.5   tiny glyphs on a solid fill (badges, check dots, FAB +)
 *   - light     1.75  large illustrative icons (empty states, hero art, >= 28px)
 *
 * Meaning (keep these consistent when adding screens):
 *   research work → BookOpen      collaboration / team → Users
 *   topic         → Hash          stage                → Layers
 *   edit          → Pencil        success              → CheckCircle2
 *   shared interest / your topic → Star
 *   personalised suggestion      → Sparkles
 *   needs attention              → BellRing
 *
 * No emoji or text glyphs (✓ ★ → 🎉) as icons — use the lucide icon.
 */
export const ICON_STROKE = {
  regular: 2,
  emphasis: 2.5,
  light: 1.75,
} as const;
