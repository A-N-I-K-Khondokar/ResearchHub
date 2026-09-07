# Day 03 — Main Navigation, Home Feed & Mock Data

## Date
2026-09-07

## Phase
Phase 2B

## Objective
Establish the primary application shell (5-tab navigation), realistic local relational mock data architecture for the CSE research domain, and implement the high-fidelity canonical Home Feed UI matching the Stitch design specifications.

## Work Completed
- Designed and built the relational mock data foundation across topics, researchers, active research work, completed publications, connections, and notifications in `src/data/`.
- Implemented the 5-tab navigation bar (`Home`, `Explore`, `Share`, `Notifications`, `Profile`) via Expo Router with native safe area handling and Lucide iconography.
- Created reusable card components (`CurrentWorkCard`, `ResearcherCard`, `PublicationCard`) and home feed components (`HomeHeader`, `TopicShortcutRow`).
- Implemented the canonical Home Feed (`src/app/(tabs)/index.tsx`) with topic filtering, research momentum feed, featured researcher discovery carousel, recent publications archive, and interactive state management (likes, bookmarks, connection toggles).
- Created controlled placeholder screens for the other four tabs (`explore`, `share`, `notifications`, `profile`) and safe navigation placeholder routes for research and researcher details.
- Verified TypeScript compilation and Expo bundle generation.

## Main Navigation
- Integrated 5-tab structure inside `src/app/(tabs)/_layout.tsx`:
  - `Home` (`index.tsx`): Canonical research community dashboard.
  - `Explore` (`explore.tsx`): Controlled placeholder for topic & researcher discovery (Phase 2C).
  - `Share` (`share.tsx`): Controlled placeholder for research publishing (Phase 2D).
  - `Notifications` (`notifications.tsx`): Controlled placeholder for alerts & connection updates (Phase 2E).
  - `Profile` (`profile.tsx`): Controlled placeholder for researcher profile & portfolio (Phase 2F).
- Tab bar styling complies strictly with design tokens (`#3157C8` active, `#667085` inactive, `#FFFFFF` background, `#E4E8F0` top border, height 60, native safe area insets).

## Mock Data
- Modular relational files in `src/data/`:
  - `topics.ts`: 10 core CSE research areas (Machine Learning, Computer Vision, Bangla NLP, Cybersecurity, Distributed Systems, IoT, etc.) with icons and active project counts.
  - `researchers.ts`: Active user profile (Anik Khondokar) plus 6 fictional CSE faculty and student researcher profiles.
  - `currentWork.ts`: 6 active research projects with stages (`Experimental`, `Data Collection`, `Model Training`, `Paper Drafting`, `System Building`), tags, and metrics.
  - `publications.ts`: 4 completed research papers across conference, journal, and workshop venues with DOIs.
  - `connections.ts`: Departmental network relationships and pending requests.
  - `notifications.ts`: Activity and network notification events.
  - `index.ts`: Master barrel with helper query functions (`getResearcherById`, `getCurrentWorkById`, `getFeaturedResearchers`, `getActiveCurrentWork`, etc.).

## Home Feed
- Canonical sections implemented matching `home_feed_canonical_final`:
  1. `HomeHeader`: Dynamic greeting ("Good morning / afternoon / evening"), author avatar, search shortcut, unread notification indicator badge.
  2. `TopicShortcutRow`: Horizontal carousel of research topics with interactive filter toggle.
  3. `People are working on`: Active research cards with author batch, stage badges, Source Serif headings, description previews, topic chips, and action buttons.
  4. `Researchers to Follow`: Horizontal carousel of compact researcher cards with avatar, department/batch, shared topics count, and interactive "Connect" toggle.
  5. `Recent Publications`: Archive preview with publication type tags, venues, years, and external view triggers.

## Components Created
- `src/components/cards/CurrentWorkCard.tsx`
- `src/components/cards/ResearcherCard.tsx`
- `src/components/cards/PublicationCard.tsx`
- `src/components/cards/index.ts`
- `src/components/home/HomeHeader.tsx`
- `src/components/home/TopicShortcutRow.tsx`
- `src/components/home/index.ts`

## Files Created / Modified
- `src/types/index.ts` (Added Topic interface & relational properties)
- `src/data/topics.ts` [NEW]
- `src/data/researchers.ts` [NEW]
- `src/data/currentWork.ts` [NEW]
- `src/data/publications.ts` [NEW]
- `src/data/connections.ts` [NEW]
- `src/data/notifications.ts` [NEW]
- `src/data/index.ts` [NEW]
- `src/components/cards/*` [NEW]
- `src/components/home/*` [NEW]
- `src/components/index.ts` [MODIFIED]
- `src/app/(tabs)/_layout.tsx` [NEW]
- `src/app/(tabs)/index.tsx` [NEW]
- `src/app/(tabs)/explore.tsx` [NEW]
- `src/app/(tabs)/share.tsx` [NEW]
- `src/app/(tabs)/notifications.tsx` [NEW]
- `src/app/(tabs)/profile.tsx` [NEW]
- `src/app/(research)/[id].tsx` [NEW]
- `src/app/(profile)/[id].tsx` [NEW]
- `src/app/(explore)/search.tsx` [NEW]
- `src/app/index.tsx` [MODIFIED]
- `src/app/(onboarding)/ready.tsx` [MODIFIED]
- `Activity/Day-03.md` [NEW]

## Architecture Decisions
- Relational ID mapping pattern in `src/data/` decouples mock items from screens and enables seamless future swap with Firestore collections.
- Maintained clean separation of UI components into `cards/`, `home/`, `common/`, and `layout/`.
- Isolated non-Home tab functionality behind explicit, minimal placeholder screens to respect Phase 2B scope boundaries.

## Design Decisions
- Followed Stitch canonical visual hierarchy: Primary (`#3157C8`), Secondary (`#159A9C`), Surface (`#FFFFFF`), Border (`#E4E8F0`), Inter font for body text, Source Serif 4 for scholarly titles.
- Restrained elevation shadows (shadowOpacity 0.04) and 1px border cards for clean academic aesthetic.

## Verification
- TypeScript verification passed with 0 errors (`npx tsc --noEmit`).
- Expo export verification validated successfully (`npx expo export`).

## Problems / Issues
- None. All requirements delivered within boundaries.

## Decisions for Next Day
- Ready to move to Phase 2C (Explore / Search / Topic Deep Dive & Researcher Directory).

## Status
Completed
