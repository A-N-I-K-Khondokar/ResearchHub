---
name: Academic Excellence
colors:
  surface: '#faf8ff'
  surface-dim: '#dad9e3'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f2fd'
  surface-container: '#eeedf7'
  surface-container-high: '#e8e7f1'
  surface-container-highest: '#e2e1eb'
  on-surface: '#1a1b22'
  on-surface-variant: '#444653'
  inverse-surface: '#2f3038'
  inverse-on-surface: '#f1f0fa'
  outline: '#747685'
  outline-variant: '#c4c5d6'
  surface-tint: '#2f55c6'
  primary: '#0a3daf'
  on-primary: '#ffffff'
  primary-container: '#3157c8'
  on-primary-container: '#d2d9ff'
  inverse-primary: '#b6c4ff'
  secondary: '#00696b'
  on-secondary: '#ffffff'
  secondary-container: '#84f1f3'
  on-secondary-container: '#006e70'
  tertiary: '#7a3200'
  on-tertiary: '#ffffff'
  tertiary-container: '#a04400'
  on-tertiary-container: '#ffd1bb'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#00164f'
  on-primary-fixed-variant: '#063bae'
  secondary-fixed: '#87f4f5'
  secondary-fixed-dim: '#69d7d9'
  on-secondary-fixed: '#002020'
  on-secondary-fixed-variant: '#004f51'
  tertiary-fixed: '#ffdbcb'
  tertiary-fixed-dim: '#ffb691'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#783100'
  background: '#faf8ff'
  on-background: '#1a1b22'
  surface-variant: '#e2e1eb'
typography:
  display:
    fontFamily: Source Serif 4
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Source Serif 4
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Source Serif 4
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Source Serif 4
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  code:
    fontFamily: monospace
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style
The design system is anchored in the concept of "Academic Excellence," a visual philosophy that balances the historical authority of research institutions with the efficiency of modern technology. It targets an audience of scholars, developers, and researchers who require a high-density information environment that remains legible and professional.

The style is **Modern Corporate** with a focus on editorial clarity. It utilizes a predominantly flat aesthetic with intentional use of whitespace to separate complex data sets. By merging classical serif typography with a systematic sans-serif UI, the design system evokes a sense of trustworthy innovation. Visual flourishes are kept to a minimum to ensure the focus remains on the content—peer-reviewed data and technical collaboration.

## Colors
The color palette is designed for prolonged intellectual work, reducing eye strain while maintaining clear hierarchy.

- **Primary (Academic Blue):** Used for primary actions, branding, and active states. It represents stability and knowledge.
- **Secondary (Research Teal):** Used for accents, category indicators, and success states, providing a modern technological contrast.
- **Neutral (Navy & Slate):** The typography uses a Deep Navy instead of pure black to maintain a sophisticated feel, while Slate Gray handles metadata and supporting text.
- **Surface & Background:** A subtle "Soft Scholarly Gray" background distinguishes the workspace from the "Pure White" content cards, creating a layered effect without the need for heavy shadows.

## Typography
This design system employs a dual-font strategy. **Source Serif 4** is reserved for major headings and editorial content to signal academic authority. **Inter** is used for all UI elements, navigation, and body text to ensure maximum legibility at smaller scales and technical precision.

- **Headlines:** Use tighter letter spacing and optical sizing for larger displays.
- **Body:** Standard body text is set to 16px for optimal readability in research papers and descriptions.
- **Labels:** Small labels and metadata should use a medium weight with a slight tracking increase to ensure clarity against white backgrounds.

## Layout & Spacing
The layout follows a strict 8px/16px geometric rhythm. It utilizes a **Fluid Grid** for content-heavy pages and a **Fixed Grid** for reading views to maintain line-length comfort (max 720px for text columns).

- **Grid:** 12-column system on desktop, 4-column on mobile.
- **Gutters:** Standardized 16px or 24px gutters depending on the visual density required.
- **Padding:** Containers and cards should utilize 24px (3 units) of internal padding to give academic content "room to breathe," preventing the interface from feeling cramped despite high data volume.

## Elevation & Depth
Depth in this design system is primarily communicated through **Tonal Layers** and **Low-Contrast Outlines**.

- **Level 0 (Background):** #F6F8FC — The base layer of the application.
- **Level 1 (Cards/Surfaces):** #FFFFFF — Elevated via a 1px border (#E4E8F0) and a very subtle ambient shadow (0px 2px 4px rgba(23, 32, 51, 0.04)).
- **Level 2 (Dropdowns/Modals):** #FFFFFF — Elevated with a slightly more pronounced shadow (0px 8px 16px rgba(23, 32, 51, 0.08)) to indicate interaction priority.

Avoid heavy blurs or colorful glows; depth should feel structural and quiet.

## Shapes
The shape language is "Rounded" to provide a friendly, approachable counter-balance to the formal serif typography.

- **Base Radius:** 8px (0.5rem) for standard cards and buttons.
- **Small Radius:** 4px (0.25rem) for small inputs, tags, and checkboxes.
- **Pill:** Fully rounded shapes are reserved for high-visibility badges (e.g., status indicators) and "follow" buttons.
- **Avatars:** Use a 25% border-radius (squircle) for a modern researcher profile look, or standard circular treatment.

## Components
- **Buttons:** 
  - **Primary:** Filled Academic Blue (#3157C8) with White text. 8px radius.
  - **Secondary:** Outlined with 1px Academic Blue border.
  - **Tertiary:** Slate Gray text, turns Academic Blue on hover with no background.
- **Cards:** White background, 1px Silver border. Use `headline-md` for card titles.
- **Input Fields:** 1px Silver border, 4px radius. On focus, the border changes to Academic Blue with a 2px soft outer glow.
- **Chips/Tags:** Secondary Research Teal (#159A9C) backgrounds with white text at 10% opacity (tinted) for a soft "tag" feel, or light gray for general categories.
- **Lists:** Clean rows separated by 1px Silver horizontal rules. 16px vertical padding per row.
- **Icons:** Use 24px line-style icons with a consistent 2px stroke weight. Match icon color to the text color of the parent element.