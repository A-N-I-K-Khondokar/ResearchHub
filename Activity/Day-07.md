# Day 07: Login Page Modernization, Auth Button Bug Fixes, Create Account Card Refinement & Bottom Navigation Active State Fix

## Phase Objective
1. Execute a focused UI modernization of the Login screen (`src/app/(auth)/login.tsx` and its tightly coupled local auth UI components). Elevate the visual polish of the light-mode login experience to feel modern, crisp, and authoritative while strictly preserving the established CSE Research Hub academic identity, the "Deep Scholar Slate" dark mode, and existing navigation/authentication logic.
2. Resolve reported layout, alignment, clipping, and theme-contrast visual bugs with the "Google Sign-In" and "Skip for now" buttons across the authentication and onboarding flows.
3. Modernize the "Create Account" screen (`src/app/(auth)/sign-up.tsx`) by unifying form elements inside a structured card enclosure with ambient elevation, while vertically stacking all inputs (including Passwords and Academic Affiliation fields) for optimal mobile ergonomics.
4. Fix the bottom tab navigation active states (`src/app/(tabs)/_layout.tsx`) so that every tab dynamically highlights with the active capsule background and primary color tint when focused, without affecting the raised center Share button.

---

## Part 1: Login Page Modernization
1. **Primary Button ("Sign In")**:
   - Modernized primary CTA to the luminous Sky Azure token (`#2471E7` resting, `#1B5ECC` pressed).
   - Added subtle, tactile pressed feedback via `Pressable` with micro-scale (`scale: 0.992`) and opacity (`0.92`).
   - Configured `size="lg"` height to 50px with `fontFamilies.sansSemiBold` (`Inter-SemiBold` / `Inter_600SemiBold`).
2. **Google Sign-In Button**:
   - Upgraded to a 50px height with clean 1px subtle boundary (`colors.borderSubtle`: `#E2E7FF` light / `#16233B` dark).
   - Embedded a clean 20x20 local multicolor Google icon with 10px spacing and centered text alignment.
   - Added interactive `Pressable` feedback with scale (`0.992`) and dynamic surface highlight.
   - Refined ambient elevation (`shadowColor: '#071A3E'`, `shadowOffset: { width: 0, height: 2 }`, `shadowRadius: 6`, `shadowOpacity: 0.03` in light mode, disabled in dark mode).
3. **Input Fields (`AuthInput`)**:
   - Standardized input field height to 50px with comfortable 16px horizontal padding.
   - Crisp default border: 1px `colors.borderSubtle` (`#E2E7FF`) on subtle background (`colors.surfaceSubtle`: `#F2F3FF`).
   - Clear, elevated focus state: 1.5px solid `colors.primary` (`#2471E7`), transitioning background to clean white (`colors.surface`).
   - Refined label typography with `fontFamilies.sansSemiBold` (13px, bold, 6px bottom spacing).
4. **Card / Surface Enclosure**:
   - Refined card corner radius to `radius.lg` (24px) for a balanced academic container feel.
   - Generous interior breathing room: `padding: 24` (48px combined horizontal breathing room).
   - Replaced harsh drop shadows with an atmospheric, low-contrast ambient shadow: `shadowColor: '#071A3E'`, `shadowOffset: { width: 0, height: 6 }`, `shadowRadius: 16`, `shadowOpacity: 0.04` (zero in dark mode).
5. **Branding & Header**:
   - Main title uses `Source Serif 4` bold (`fontFamilies.serifBold`: `SourceSerif4_700Bold`) at 27px for authoritative academic identity.
   - Badge squircle modernized: 58x58 with 18px radius, `#EEF3FD` background, and `#D4E2FB` border.
   - Body & footer typography strictly bound to `Inter` (`fontFamilies.sansRegular` / `fontFamilies.sansSemiBold`).

---

## Part 2: Bug Fix — Auth Flow Buttons (Google & Skip)

### Specific Bugs Identified
1. **Google Sign-In Button (`SocialAuthButton.tsx`)**:
   - **Text Alignment / Font Clipping**: Without explicit `lineHeight` and `includeFontPadding: false`, custom `Inter` font metrics produced vertical offset against the 20x20 Google icon on Android/iOS, making text appear misaligned.
   - **Full Width / Flexbox**: Lacked explicit `width: '100%'`, which could cause inconsistent horizontal sizing relative to the primary "Sign In" button depending on container flex defaults.
   - **Dark Mode Elevation Artifact**: Hardcoded `elevation: 1` persisted in dark mode, causing Android to render an artificial grey elevation overlay on dark card surfaces despite `shadowOpacity: 0`.
2. **Skip Button (`Button.tsx`, `current-work.tsx`, `external-profiles.tsx`)**:
   - **Primary Action Confusion**: `variant="ghost"` in `Button.tsx` was hardcoded to `color: colors.primary` (`#2471E7`), making the "Skip for now" action look like an active primary link rather than a muted tertiary bypass option.
   - **Hit Slop**: Ghost/tertiary buttons lacked generous touch targets for rapid mobile tapping.
   - **Text Alignment**: `baseText` lacked `includeFontPadding: false` and `textAlignVertical: 'center'`, leading to subtle off-center text baselines.

### Work Completed & Fixes Applied
1. **`src/components/auth/SocialAuthButton.tsx`**:
   - Wrapped icon and text into a dedicated `contentRow` flex container (`flexDirection: 'row'`, `alignItems: 'center'`, `justifyContent: 'center'`).
   - Fixed `buttonText` with `fontSize: 15`, `lineHeight: 20`, `includeFontPadding: false`, and `textAlignVertical: 'center'` to mathematically align with the 20x20 Google icon.
   - Added explicit `width: '100%'` to ensure consistent alignment with the card.
   - Dynamic shadow cleanup: `shadowColor: isDark ? 'transparent' : '#071A3E'`, `shadowOpacity: isDark ? 0 : 0.03`, and `elevation: isDark ? 0 : 1`.
   - Polished interaction feedback: `opacity: pressed ? 0.92 : 1`, `transform: [{ scale: pressed ? 0.992 : 1 }]`, and `hitSlop: { top: 8, bottom: 8, left: 8, right: 8 }`.
2. **`src/components/common/Button.tsx`**:
   - Added `'tertiary'` variant to `ButtonVariant`.
   - Updated `ghost` and `tertiary` label color to `colors.textSecondary` (`#424754` in light mode, `#A5B0C8` in dark mode) with `Inter-Medium` (`fontFamilies.sansMedium`, 500 weight), clearly differentiating it from primary CTAs while maintaining WCAG AA contrast.
   - Added `hitSlop?: Insets | number` prop with a default generous target of `{ top: 12, bottom: 12, left: 12, right: 12 }` for ghost/tertiary variants.
   - Added `includeFontPadding: false` and `textAlignVertical: 'center'` to `styles.baseText`.
3. **`src/components/common/index.ts`**:
   - Re-exported `SocialAuthButton` from `@/components/common` to ensure module resolution compatibility.

---

## Part 3: Create Account UI — Unified Card Enclosure & Stacked Affiliation

### Objective
Following user review, pivot the "Create Account" screen (`src/app/(auth)/sign-up.tsx`) back to a unified card-based design while vertically stacking the Academic Affiliation fields ("Department" and "Batch / Designation") so every input enjoys 100% horizontal width.

### Work Completed
1. **Re-introduced Form Card Enclosure**:
   - Wrapped the entire registration form inside a structured card container (`styles.card`).
   - Background: `colors.surface` (`#FFFFFF` in light mode, `#0F1A30` in dark mode).
   - Corner Radius: `radius.lg` (24px) providing balanced academic framing.
   - Border: 1px solid `colors.borderSubtle` (`#E2E7FF` light / `#16233B` dark).
   - Ambient Elevation: `shadowColor: '#071A3E'`, `shadowOffset: { width: 0, height: 6 }`, `shadowRadius: 16`, `shadowOpacity: isDark ? 0 : 0.04`, `elevation: isDark ? 0 : 2`.
   - Padding: Generous 24px inner padding matching the modernized Login card.
2. **De-cluttered Interior Inputs**:
   - Removed floating dropshadows from inputs inside the card. Fields now sit cleanly with their default crisp border (`colors.borderSubtle`) and dynamic focus state (`colors.surfaceSubtle` -> `colors.surface` on focus with 1.5px `colors.primary` border).
3. **Vertically Stacked Academic Affiliation Fields**:
   - Removed the previous 50/50 side-by-side row split for "Department" and "Batch / Designation".
   - Both inputs are now full-width (100% width) stacked fields, making them easy to read and tap on compact mobile screens.
4. **Preserved Stacked Passwords & Placeholders**:
   - Kept "Password" and "Confirm Password" vertically stacked with full typing room.
   - Kept the specific Batch placeholder `"e.g., Batch 232"` and Department default `"CSE"`.
   - Main title strictly preserved in **Source Serif 4 Bold** (`SourceSerif4_700Bold`) with **Inter** for all UI body text.

---

## Part 4: Bug Fix — Bottom Tab Active States

### Specific Bug Identified
In `src/app/(tabs)/_layout.tsx`, the active visual state indicator (the rounded pill capsule background `#E5EEFF` in light mode, `#152A54` in dark mode) was hardcoded exclusively into the `index` (Home) screen configuration. 
When navigating to the other standard tabs (`explore`, `notifications`/Alerts, `profile`), their screen configurations did not include the `styles.iconWrapper` container or the dynamic capsule background logic. Consequently, while the icon tint changed, the tabs never displayed the distinctive active capsule pill, causing users to perceive the tabs as inactive or non-responsive.

### Work Completed & Fixes Applied
1. **`src/app/(tabs)/_layout.tsx`**:
   - Wrapped all standard tab icons (`Home`, `Compass`, `Bell` with badge dot, and `User`) inside `styles.iconWrapper`.
   - Dynamically applied `backgroundColor: isDark ? colors.primaryLight : '#E5EEFF'` when `focused` is true for every tab.
   - Standardized icon size to 20px with active dynamic stroke width (`focused ? 2.5 : 2`).
   - Fixed `iconWrapper` dimensions (`minWidth: 52, height: 30`) to prevent any icon jumping or layout shift when toggling between active and inactive states.
   - Ensured the center raised "Share" button (`styles.centerButton`, 44×44, 22 radius, solid `colors.primary`) remains custom and completely unaffected by standard capsule states.
   - Retained semantic theme tokens (`colors.surface`, `colors.borderSubtle`, `colors.primary`, `colors.textSecondary`, `colors.primaryLight`) for seamless light/dark mode transitions.

---

## Files Changed Across Day 07
* `src/app/(tabs)/_layout.tsx`: Fixed active capsule background and focused state logic across all 5 bottom tabs.
* `src/app/(auth)/sign-up.tsx`: Re-enclosed form inside `styles.card` (24px radius, ambient shadow), stacked Department and Batch fields vertically, removed floating drop shadows from nested inputs.
* `src/components/auth/AuthInput.tsx`: Maintained clean base input styling with dynamic focus state and optional floating support.
* `src/components/auth/SocialAuthButton.tsx`: Centered flexbox, lineHeight 20 + includeFontPadding false, 100% width, dynamic dark mode elevation suppression.
* `src/components/common/Button.tsx`: Added tertiary variant, textSecondary for ghost/tertiary, generous hitSlop defaults, and vertical text alignment normalization.
* `src/components/common/index.ts`: Re-exported `SocialAuthButton`.
* `src/components/auth/AuthHeader.tsx`: Preserved `Source Serif 4` heading, modernized squircle badge container with theme-aware background/border.
* `src/app/(auth)/login.tsx`: Refined card enclosure (24px radius, 24px padding, ambient shadow), theme-aware shadow suppression in dark mode, and `Inter` footer typography.

---

## Testing Results
1. **TypeScript Type Check**:
   - Command: `npx tsc --noEmit`
   - Result: **0 errors** (Clean compilation).
2. **Production Bundler Verification**:
   - Command: `npx expo export --output-dir /tmp/test-export-tabs-fix`
   - Result: **Success (Exit code 0)** — Web (`3.44 MB`), Android (`5.46 MB`), and iOS (`5.47 MB`) bundles generated cleanly with 99 assets.

---
*Signed off by: Senior React Native Developer & QA Systems Engineer*
