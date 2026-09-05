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
  secondary: '#555f73'
  on-secondary: '#ffffff'
  secondary-container: '#d6e0f8'
  on-secondary-container: '#596377'
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
  secondary-fixed: '#d9e3fb'
  secondary-fixed-dim: '#bdc7de'
  on-secondary-fixed: '#111c2d'
  on-secondary-fixed-variant: '#3d475a'
  tertiary-fixed: '#ffdbcb'
  tertiary-fixed-dim: '#ffb691'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#783100'
  background: '#faf8ff'
  on-background: '#1a1b22'
  surface-variant: '#e2e1eb'
typography:
  display-lg:
    fontFamily: Source Serif 4
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg:
    fontFamily: Source Serif 4
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Source Serif 4
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Source Serif 4
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 12px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  margin-mobile: 16px
  gutter-mobile: 16px
  stack-xs: 4px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
  stack-xl: 32px
---

## Brand & Style
The design system is built upon the pillars of clarity, authority, and intellectual rigor. It targets a professional academic audience, including researchers, faculty, and doctoral candidates. The visual language balances the traditional prestige of academia with the functional efficiency of modern technology.

The aesthetic follows a **Modern Corporate** style with a focus on high legibility and structured information density. By utilizing a light-first approach with a cool-toned palette, the interface feels focused and expansive. The design avoids trendy flourishes like glassmorphism or heavy gradients in favor of a "content-first" philosophy that treats research data and networking as the primary visual interest.

## Colors
The color palette is anchored by "Deep Academic Indigo," a color that evokes stability and trust. 

- **Primary:** Used for key actions, active states, and branding elements.
- **Neutral/Background:** A very light cool gray (#F6F8FC) is used for the base background to reduce eye strain compared to pure white, while pure white (#FFFFFF) is reserved for elevated surface containers.
- **Typography:** Two levels of gray-navy are used to establish a clear information hierarchy, ensuring that citations and metadata are distinct from primary titles.
- **Semantic:** Success, Warning, and Error colors are slightly desaturated to maintain a professional, academic tone rather than a high-energy consumer feel.

## Typography
This design system employs a dual-typeface strategy to bridge the gap between traditional publishing and modern software.

- **Headlines:** Source Serif 4 provides an authoritative, book-like quality for paper titles and section headers.
- **UI & Body:** Inter is used for all functional text, navigation, and long-form body copy. It ensures high legibility on mobile screens at small sizes.
- **Mobile Scaling:** For mobile devices, use `headline-md` as the primary page title. `display-lg` should be reserved for empty states or specialized splash screens.

## Layout & Spacing
The layout relies on a strict 8px grid system to ensure vertical rhythm and consistent alignment. 

- **Grid:** On mobile, use a 4-column fluid grid with 16px side margins and 16px gutters.
- **Touch Targets:** All interactive elements (buttons, links, chips) must maintain a minimum height/width of 44px for accessibility, even if the visual element is smaller.
- **Density:** Maintain "Academic Air"—use the `stack-lg` (24px) spacing between distinct content sections to prevent the interface from feeling cluttered with data.

## Elevation & Depth
The design system avoids high-contrast shadows. Depth is communicated through a "Layered Flat" approach:

- **Level 0 (Background):** The cool gray (#F6F8FC) base.
- **Level 1 (Surface):** White (#FFFFFF) cards and containers. These use a 1px solid border (#E4E8F0) and an extremely soft shadow (e.g., `0px 2px 4px rgba(23, 32, 51, 0.04)`).
- **Level 2 (Navigation/Modals):** Elements that sit above the scroll use a slightly more defined shadow (`0px 4px 12px rgba(23, 32, 51, 0.08)`) to indicate they are in the highest stack.

## Shapes
The shape language is precise and technical. A 4px base radius (Soft) is applied to all components to soften the interface while maintaining a sharp, professional edge.

- **Standard Radius:** 4px (Buttons, Inputs, Cards).
- **Chip/Badge Radius:** 4px (Ensures a consistent blocky, technical feel rather than a playful pill shape).
- **Avatars:** Circular (Infinite radius) to provide a soft contrast to the otherwise geometric UI, making people feel more approachable.

## Components
### Buttons
- **Primary:** Solid Indigo (#3157C8) with White text.
- **Secondary:** Light tint of indigo (10% opacity) with Indigo text.
- **Outline:** Transparent background with a 1px border (#E4E8F0) and Primary text.
- **Destructive:** Soft Red (#D64545) background with White text.

### Cards & Lists
- **Research Cards:** White background, 1px border. The 'Current Work' state features a subtle 2px left-accent border in Indigo. 'Previous Research' uses a grayed-out icon set and Secondary Text for the title.
- **Lists:** Clean dividers (#E4E8F0) with 16px padding. No chevrons on list items unless they lead to a complex nested view.

### Inputs & Chips
- **Inputs:** White background, 1px border (#E4E8F0). On focus, the border changes to Primary Indigo (#3157C8) with a 2px outer glow.
- **Topic Chips:** Muted tints based on the category (e.g., Light Indigo, Light Green). Use `label-md` for text.

### Navigation
- **Bottom Nav:** Persistent bar with 4-5 items. Icons are 24px line art. Active state uses the Primary color for both icon and label.
- **Top App Bar:** Centered or left-aligned Source Serif 4 title. Use "Surface" white background with a subtle bottom border.

### Researcher Profiles
- **Avatar:** 40px (list) or 80px (profile) circles. 
- **Metadata:** Use `body-sm` for research interests and `label-sm` for citations or H-index values to give them a distinct, data-driven look.