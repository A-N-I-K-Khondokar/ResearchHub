# Day 09: Phase 2E — Alerts & Notifications Feed

## Phase 2E Objective
Implement the comprehensive "Alerts & Notifications" experience (`src/app/(tabs)/notifications.tsx`) for the 4th tab of the CSE Research Hub.
The objective is to establish an academic, minimalist, typography-driven notifications feed that alerts researchers to community interactions (connection requests, accepted connections, paper/research comments, milestone likes, and topic activity) while adhering to our floating bottom tab bar clearance (`paddingBottom: 120`), dynamic theme compliance (Scholarly Crisp Light & Deep Scholar Slate Dark modes), and responsive filter mechanisms.

---

## Work Completed & Technical Implementation

1. **Screen Architecture & Floating Tab Bar Clearance**:
   - Built inside `SafeAreaView` (with `edges={['top']}`) using React Native's `SectionList`.
   - **Critical Clearance**: Added `paddingBottom: 120` to `SectionList`'s `contentContainerStyle` to guarantee that the last notification items in the feed clear the 64px floating capsule tab bar without occlusion.
   - **Chronological Section Grouping**: Notifications are split into `"New"` (recent events from the current day, e.g. `10m`, `35m`, `2h`, `4h`) and `"Earlier"` (older events, e.g. `1d`, `2d`, `3d`, `5d`).
   - Integrated native pull-to-refresh (`RefreshControl`) with theme primary tinting.

2. **Academic Header & Scrollable Category Filter Row**:
   - **Header Title**: Rendered "Alerts" in **Source Serif 4 Bold** (`fontFamilies.serifBold`), 28px in `colors.textPrimary`.
   - **Unread Counter Badge**: Displays a pill badge with the active unread count (e.g. `4 new`) in `colors.primaryMuted`.
   - **Mark All Read Action**: Header action button with `<CheckCheck size={14} />` in `colors.primary` that marks all notifications as read in a single tap.
   - **Horizontally Scrollable Filter Pills**:
     - Wrapped in a horizontal `ScrollView` with `showsHorizontalScrollIndicator={false}`, `marginHorizontal: -16`, and `gap: 8` with `16px` padding.
     - Implemented filters: `All`, `Unread` (with dynamic counter), `Connections`, `Comments`, and `Likes`.
     - **Active Pill**: Solid blue background (`backgroundColor: colors.primary`), matching border, and white text (`#FFFFFF`, `fontFamilies.sansSemiBold`).
     - **Inactive Pill**: Subtle surface (`backgroundColor: colors.surfaceSubtle`), muted border (`borderColor: colors.borderSubtle`), and muted text (`colors.textSecondary`).

3. **Notification Item UI**:
   - **Item Container**: Minimalist row layout with subtle 1px bottom border in `colors.borderSubtle`. Unread rows feature a delicate tinted background (`#F2F6FE` in light mode, `rgba(36, 113, 231, 0.08)` in dark mode).
   - **Unread Indicator Dot**: A 7px circular dot (`borderRadius: 3.5`) in solid `colors.primary` aligned to the left of the item. Read items maintain layout spacing with an empty spacer.
   - **User Avatar & Type Badge**:
     - Embedded `Avatar` (`size="md"`).
     - Overlaid an 18×18 circular type badge on the bottom-right corner of the avatar with white border:
       - Connection Request / Accepted: `<UserPlus size={10} color="#FFFFFF" strokeWidth={2.4} />` with `colors.primary`.
       - Comment: `<MessageSquare size={10} color="#FFFFFF" strokeWidth={2.4} />` with `colors.accent`.
       - Like: `<Heart size={10} color="#FFFFFF" strokeWidth={2.4} fill="#FFFFFF" />` with `#E5484D`.
       - Topic Activity: `<Sparkles size={10} color="#FFFFFF" strokeWidth={2.4} />` with `colors.secondary`.
   - **Typography & Content Hierarchy**:
     - Interacting researcher's name rendered in **Inter-SemiBold** (`14.5px`, `colors.textPrimary`).
     - Action description rendered in **Inter-Regular** (`14px`, `colors.textSecondary`).
     - Target research title rendered in **Inter-Medium** (`13px`, `colors.textPrimary`, truncated with `numberOfLines={1}`).
     - Comment quote preview formatted with a 2px left border callout and italicized caption text.
     - Timestamp cleanly positioned on the far right (`11.5px`, `colors.textMuted`).

4. **Actionable Connection Request Alerts**:
   - For `connection_request` items in `'pending'` status, rendered two inline action buttons:
     - **Accept Button**: Solid primary button (`backgroundColor: colors.primary`, white text `#FFFFFF`, `Inter-SemiBold`).
     - **Decline Button**: Ghost outlined button (`backgroundColor: colors.surfaceSubtle`, `borderColor: colors.borderSubtle`, `colors.textSecondary`).
   - Tapping "Accept" transitions the state to `'accepted'` and `read: true`, displaying `<Check size={14} color={colors.secondary} /> Connected`.
   - Tapping "Decline" transitions the state to `'declined'` and `read: true`, displaying `"Request dismissed"` in muted text.

5. **Empty State Component**:
   - If a filter yields zero notifications, displays a centered icon circle with `<BellOff size={32} />`, a friendly title ("No alerts found"), explanatory subtitle, and a "View all alerts" button to reset the filter.

---

## UI / Data Architecture for Notifications

### 1. Data Models (`src/types/index.ts`)
```typescript
export type NotificationType =
  | 'connection_request'
  | 'connection_accepted'
  | 'comment'
  | 'like'
  | 'research_mention'
  | 'topic_activity';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  sender?: UserProfile;
  targetId?: string;
  targetTitle?: string;
  commentPreview?: string;
  status?: 'pending' | 'accepted' | 'declined';
  actionText?: string;
}
```

### 2. Mock Alerts Dataset (`src/data/notifications.ts`)
Configured 8 rich mock items demonstrating:
- Pending Connection Request from Mou Tusi (Unread, New).
- Research Comment with edge device benchmark query from Dr. Rafiqul Islam (Unread, New).
- Current Work Like from Sarah Jin (Unread, New).
- Accepted Connection from Tanvir Ahmed (Unread, New).
- Accepted Connection Request from Nadia Ali (Read, Earlier).
- Preprint Review Feedback from Elena Vance (Read, Earlier).
- Publication Like from Mou Tusi (Read, Earlier).
- New Research Publication Announcement in #BanglaNLP from Dr. Rafiqul Islam (Read, Earlier).

---

## Files Changed
* `src/types/index.ts`: [UPDATED] Expanded `AppNotification` and `NotificationType` with comment, like, targetTitle, commentPreview, and status metadata.
* `src/data/notifications.ts`: [UPDATED] Populated 8 realistic, rich academic notification items covering all states.
* `src/app/(tabs)/notifications.tsx`: [UPDATED] Replaced placeholder with full SectionList notification feed, scrollable filter chips, unread dot indicators, actionable connection buttons, and floating tab clearance.
* `Activity/Day-09.md`: [CREATED] Documented Phase 2E implementation, architecture, and verification results.

## Part 2: UI Bug Fix — Standardize Global Header Top Padding

### Objective
Standardize the top padding across all tab screens (`index.tsx`, `explore.tsx`, `notifications.tsx`, `share.tsx`, `profile.tsx`) so that all screen titles and headers align symmetrically on the vertical Y-axis, eliminating platform-dependent `SafeAreaView` variances and disparate static offsets.

### Work Completed & Technical Implementation

1. **Standardized Formula**:
   - Inspected `src/app/(tabs)/index.tsx` and `HomeHeader.tsx` which previously relied on platform `SafeAreaView` plus `15px`/`16px` (`spacing.md`) padding.
   - Replaced platform-variable `SafeAreaView` with standard React Native `View` containers on all screens.
   - Used explicit insets calculation sourced from `useSafeAreaInsets()`:
     $$\text{paddingTop} = \text{insets.top} + 16$$
   - This guarantees that on every platform (iOS with notch/Dynamic Island, Android with status bars, and Web), all headers start at the exact same Y coordinate.

2. **Screen-by-Screen Alignment**:
   - **Home (`src/app/(tabs)/index.tsx`)**:
     - Swapped `<SafeAreaView>` for `<View>`.
     - Passed `style={{ paddingTop: insets.top + 16 }}` to `HomeHeader`.
     - Enabled optional `style` prop in [`HomeHeader.tsx`](file:///Users/anikkhondokar/Documents/6th%20SEMESTER/App%20Dev/ResearchHub/src/components/home/HomeHeader.tsx).
   - **Explore (`src/app/(tabs)/explore.tsx`)**:
     - Swapped `<SafeAreaView>` for `<View>`.
     - Applied `paddingTop: insets.top + 16` directly to `styles.headerContainer`.
     - Removed obsolete `paddingTop: spacing.xs` (4px).
   - **Alerts / Notifications (`src/app/(tabs)/notifications.tsx`)**:
     - Swapped `<SafeAreaView>` for `<View>`.
     - Applied `paddingTop: insets.top + 16` directly to `styles.headerContainer`.
     - Removed obsolete `paddingTop: spacing.xs` (4px).
     - The "Alerts" title now matches the exact vertical baseline of "Explore" and Home's header elements.
   - **Share (`src/app/(tabs)/share.tsx`)**:
     - Swapped `<SafeAreaView>` for `<View>`.
     - Applied `paddingTop: insets.top + 16` directly to `ScrollView`'s `contentContainerStyle`.
     - Strictly preserved `paddingBottom: 120` for floating tab bar clearance.
   - **Profile (`src/app/(tabs)/profile.tsx`)**:
     - Replaced `ScreenContainer` with standard `<View>` and `<ScrollView>`.
     - Applied `paddingTop: insets.top + 16` directly to `ScrollView`'s `contentContainerStyle`.
     - Set `marginTop: 0` on `profileCard` to avoid double-offsetting.
     - Strictly preserved `paddingBottom: 120` for floating tab bar clearance.

---

## Files Changed
* `src/components/home/HomeHeader.tsx`: [UPDATED] Extended `HomeHeaderProps` with `style?: StyleProp<ViewStyle>` and merged it into the container.
* `src/app/(tabs)/index.tsx`: [UPDATED] Replaced `SafeAreaView` with `View`, imported `useSafeAreaInsets`, passed `paddingTop: insets.top + 16` to `HomeHeader`.
* `src/app/(tabs)/explore.tsx`: [UPDATED] Replaced `SafeAreaView` with `View`, applied `paddingTop: insets.top + 16` to `headerContainer`.
* `src/app/(tabs)/notifications.tsx`: [UPDATED] Replaced `SafeAreaView` with `View`, applied `paddingTop: insets.top + 16` to `headerContainer`.
* `src/app/(tabs)/share.tsx`: [UPDATED] Replaced `SafeAreaView` with `View`, applied `paddingTop: insets.top + 16` to scroll content, retained `paddingBottom: 120`.
* `src/app/(tabs)/profile.tsx`: [UPDATED] Replaced `ScreenContainer` with standard `View` + `ScrollView`, applied `paddingTop: insets.top + 16`, retained `paddingBottom: 120`.
* `Activity/Day-09.md`: [UPDATED] Documented Part 2 Global Header Top Padding standardization and verification results.

---

## Testing Results

1. **TypeScript Type Check**:
   - Command: `npx tsc --noEmit`
   - Result: **0 errors** (Clean compilation).

2. **Production Bundler Verification**:
   - Command: `npx expo export --output-dir /tmp/test-export-padding-fix`
   - Result: **Success (Exit code 0)** — Generated Android HBC (`5.50 MB`), iOS HBC (`5.51 MB`), and Web (`3.47 MB`) bundles with 99 assets.

3. **Web Distribution Sync**:
   - Command: `npx expo export -p web`
   - Result: **Success (Exit code 0)** — Synchronized `./dist` with latest standardized header layout.

---
*Signed off by: Senior React Native Developer & UI/UX Systems Engineer*
