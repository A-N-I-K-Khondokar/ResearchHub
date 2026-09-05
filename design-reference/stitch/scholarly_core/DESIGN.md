---
name: Scholarly Core
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#331200'
  on-tertiary-container: '#cf6721'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#ffdbca'
  tertiary-fixed-dim: '#ffb68e'
  on-tertiary-fixed: '#331200'
  on-tertiary-fixed-variant: '#763300'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Source Serif 4
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Source Serif 4
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Source Serif 4
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
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
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.5px
  headline-lg-mobile:
    fontFamily: Source Serif 4
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 16px
  stack-gap-sm: 8px
  stack-gap-md: 16px
  stack-gap-lg: 24px
  section-margin: 32px
---

## Brand & Style

The design system is a synthesis of traditional academic rigor and modern computational efficiency. It targets a demographic of researchers, students, and faculty who require a high-signal, low-noise environment for knowledge discovery. 

The aesthetic is **Modern Corporate with a Literary Edge**, utilizing high-quality typography and a disciplined layout to foster an atmosphere of intellectual focus. It avoids the frenetic energy of social platforms in favor of a calm, structured, and trustworthy interface that feels like a premium digital library or a high-end research journal.

## Colors

The palette is anchored by **Deep Academic Blue** (#0F172A) for primary branding and navigation, ensuring an immediate sense of authority. **Innovation Teal** (#0D9488) serves as the functional accent, used for interactive states and technical highlights, bridging the gap between academia and technology.

**Knowledge Gold** (#B45309) is reserved for high-value highlights, such as award recognitions or featured publications. The background uses a cool **Off-White** (#F8FAFC) to reduce eye strain during long reading sessions, while white surfaces create a clear distinction for modular content cards.

## Typography

The typography system employs a "serif-for-structure, sans-for-utility" approach. **Source Serif 4** is utilized for all headings to evoke the prestige of printed journals and traditional publishing. It provides a humanistic touch to an otherwise technical platform.

**Inter** is the workhorse for body copy and UI labels. It was chosen for its exceptional legibility at small sizes and its neutral, systematic feel which complements the technical nature of CSE content. Titles of research papers should always use the Serif face, while metadata and descriptions use the Sans face.

## Layout & Spacing

This design system uses a **fluid layout model** for React Native, built on a 4px baseline grid. Content is organized into a vertical stack with generous white space to prevent information density from becoming overwhelming.

- **Mobile:** 16px horizontal margins with a single-column layout for research feeds.
- **Tablet:** 24px horizontal margins with a 2-column masonry or grid layout for researcher profiles.
- **Gutters:** Standardized at 16px to ensure breathable space between modular components like publication cards or bio snippets.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Low-Contrast Outlines** rather than aggressive shadows. 

The primary depth mechanism is a 1px border (#E2E8F0) for all cards and interactive containers. When an element requires "Lift" (e.g., a featured research highlight), a soft, diffused shadow with a 10% opacity of the Primary color is applied. This creates a "Paper-on-Table" effect, emphasizing the academic feel of physical manuscripts.

## Shapes

The shape language is consistently **Rounded (Level 2)**. A border radius of 8px is the default for buttons, input fields, and small cards. 

Larger containers, such as modal sheets or primary content blocks, utilize 16px (rounded-lg) to soften the professional aesthetic and make the platform feel more approachable. Avatars for researchers should use a circular clip to distinguish human entities from the rectangular representation of research papers.

## Components

### Buttons
Primary buttons use the Deep Academic Blue background with White text. Secondary buttons use a 1px Teal border with Teal text. All buttons have an 8px radius and use `label-md` for text.

### Research Chips
Used for "Research Interests" (e.g., Machine Learning, HCI). These have a subtle Innovation Teal background (10% opacity) with a solid Teal text. They should be non-intrusive and small, allowing for many to be displayed without clutter.

### Publication Cards
The cornerstone component. Features a Source Serif 4 title, followed by a metadata line (Authors, Year) in Inter. The entire card is wrapped in a 1px border.

### Input Fields
Clean, outlined inputs using the Neutral color for borders. On focus, the border transitions to Innovation Teal. Labels are always visible above the field in `label-md`.

### List Items
For settings or bibliographic references. Uses a simple horizontal separator (#E2E8F0) and provides high contrast between primary text and secondary descriptors.