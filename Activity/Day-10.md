# Day 10: Phase 2F — Researcher Profile UI

## Phase 2F Objective
Inspect and fully implement the comprehensive Researcher Profile screen (`src/app/(tabs)/profile.tsx`) for the 5th tab of the CSE Research Hub.
The objective is to build a vertically-scrolling, high-density scholarly portfolio featuring a detailed Hero Card with mobile-first flexbox photo alignment and stats strip, followed by modular sections for Research Interests, Currently Working On, Research & Publications, and Academic Links Grid. All styles use pure React Native `StyleSheet` and dynamic semantic tokens, ensuring 100% theme compatibility (Scholarly Crisp Light & Deep Scholar Slate Dark modes) with strict global layout clearances (`paddingTop: insets.top + 16` and `paddingBottom: 120`).

---

## Work Completed & Technical Implementation

1. **Global Layout Standard**:
   - Outermost container utilizes standard React Native `<View>` with dynamic top safe area insets:
     $$\text{paddingTop} = \text{insets.top} + 16\text{px}$$
     (Avoiding `SafeAreaView` to maintain vertical alignment parity with Home, Explore, Share, and Notifications tabs).
   - Main `<ScrollView>` enforces `contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}` to guarantee full clearance above the 64px floating bottom capsule tab bar.

2. **Section 1: The Hero Card**:
   - **Card Container**: `backgroundColor: colors.surface`, `borderColor: colors.borderSubtle`, `borderRadius: 16`, `borderWidth: 1`, with subtle padding.
   - **Top Row (Flex Row)**:
     - **Avatar**: 88×88px circular avatar with `flexShrink: 0` to prevent photo distortion on narrower screens.
     - **Verified Badge**: Small absolute positioned circle (`backgroundColor: colors.primary`, 2px surface border, white check icon `<Check size={11} strokeWidth={3} />`) attached to the bottom-right of the avatar.
     - **Info Column**: Nested flex column (`flex: 1`, `flexShrink: 1` for proper text wrapping):
       - Name: "Anik Khondokar" in **Source Serif 4 Bold** (`fontFamilies.serifBold`, 22px, `colors.textPrimary`).
       - Credentials: "CSE • Batch 14 • Dept of CS & Engineering" with `<GraduationCap size={13} />` icon in `colors.textSecondary`.
       - Short Bio: "Focusing on applied machine learning and computer vision with an emphasis on low-resource Bangla NLP." (`colors.textSecondary`, 13px, lineHeight: 18px).
   - **Middle Row (Action Buttons)**:
     - "Connect" button: Solid primary (`backgroundColor: colors.primary`, white text `#FFFFFF`, `<UserPlus size={15} />`) with interactive toggle state to "Connected" (`<UserCheck size={15} />`).
     - "Message" button: Outline button (`borderColor: colors.borderSubtle`, `backgroundColor: colors.surfaceSubtle`, `<MessageSquare size={15} />`).
   - **Bottom Row (Stats Strip)**:
     - 3-column grid separated by vertical subtle dividers:
       - **Connections: 148**
       - **Publications: 6**
       - **Open Projects: 4**
     - Sits atop a 1px top border in `colors.borderSubtle`.

3. **Section 2: Research Interests / Topic Pills**:
   - Flex-wrap container with small outline chips:
     `#MachineLearning`, `#ComputerVision`, `#BengaliNLP`, `#DeepLearning`, `#EdgeAI`
   - Styled with `backgroundColor: colors.surfaceSubtle`, `borderColor: colors.borderSubtle`, and `color: colors.primary`.

4. **Section 3: Currently Working On**:
   - Custom card featuring "Bengali Handwritten Character Recognition" in semi-bold.
   - **Active Status Pill**: Subtle pill badge (`backgroundColor: colors.primaryMuted`, primary dot, text "Active Project").
   - Short description of the specialized vision transformer pipeline.
   - **Footer Row**: Sits above a top border with "3 Collaborators" (`<Users size={14} />`) and "Dataset Prep" (`<Layers size={14} />`).

5. **Section 4: Research & Publications**:
   - Vertical list of publication items:
     1. *"Evaluating Transformer Architectures for Bengali Optical Character Recognition"* (Conference Paper • 2025 • IEEE ICDAR).
     2. *"Quantization Strategies for Low-Power NLP Models in Regional Dialect Processing"* (Journal Article • 2025 • ACM TALIP).
   - Layout: Left-side icon box (40×40 square with `<BookOpen />` or `<FileText />`), title, conference/journal subtitle, and external link arrow `<ArrowUpRight />`.

6. **Section 5: Academic Links (2-Column Grid)**:
   - 2-column grid featuring dedicated academic profile buttons:
     1. **Google Scholar** (`<GraduationCap size={16} />`)
     2. **ResearchGate** (`<Globe size={16} />`)
     3. **GitHub** (`<Code2 size={16} />`)
     4. **ORCID** (`<ExternalLink size={16} />`)
   - Each button features a left icon + label and a right-aligned external link arrow with direct `Linking.openURL` handler.

7. **Appearance & Settings Access**:
   - Integrated `<Settings />` header button opening the system theme modal (Light / Dark / System), preserving theme switching capability cleanly.

---

## Mock Identity Data

* **Name**: Anik Khondokar
* **Degree / Credentials**: CSE • Batch 14 • Dept of CS & Engineering
* **Bio / Focus**: Focusing on applied machine learning and computer vision with an emphasis on low-resource Bangla NLP.
* **Topics**: `#MachineLearning`, `#ComputerVision`, `#BengaliNLP`, `#DeepLearning`, `#EdgeAI`
* **Stats**: Connections: 148, Publications: 6, Open Projects: 4
* **Active Project**: Bengali Handwritten Character Recognition (3 Collaborators, Dataset Prep)

---

## Files Changed
* `src/app/(tabs)/profile.tsx`: [UPDATED] Completely redesigned with the 5-section layout: Hero Card with Verified Avatar & Stats, Interests Chips, Currently Working On, Research & Publications, and Academic Links Grid.
* `Activity/Day-10.md`: [UPDATED] Documented complete layout redesign, mobile-first flexbox fixes, and test results.

---

## Testing Results

1. **TypeScript Type Check**:
   - Command: `npx tsc --noEmit`
   - Result: **0 errors** (Clean compilation).

2. **Production Bundler Verification**:
   - Command: `npx expo export --output-dir /tmp/test-export-profile-redesign`
   - Result: **Success (Exit code 0)** — Generated Android HBC (`5.52 MB`), iOS HBC (`5.52 MB`), and Web (`3.48 MB`) bundles with 99 assets.

3. **Web Distribution Sync**:
   - Command: `npx expo export -p web`
   - Result: **Success (Exit code 0)** — Synchronized `./dist` with redesigned profile.

---

## Part 3: UI Polish — Profile Typography & Layout Fixes

### Objective
Resolve typography scale inconsistencies, fix action buttons for a proper "Self-Profile" user context, and overhaul the Academic Links section from a 2-column grid into a unified, mobile-ergonomic vertical list card.

### Work Completed & Technical Implementation

1. **Typography Synchronization**:
   - Replaced all non-standard, arbitrary font sizes (22px, 13px, 15px) with standard system tokens:
     - **Name**: Rendered in 24px **Source Serif 4 Bold** (`fontFamilies.serifBold`, lineHeight: 30px), matching global header scales.
     - **Credentials & Bio**: Standardized to 14px **Inter-Medium** / **Inter-Regular** (`lineHeight: 20px`), achieving exact body typography parity with Home feed cards.
     - **Project & Publication Descriptions**: Standardized to 14px **Inter-Regular** (`lineHeight: 20px`).
     - **Stat Values**: 17px **Inter-Bold**, labels: 12px **Inter-Medium**.

2. **Self-Profile Action Button Row**:
   - Removed the peer-oriented "Connect" and "Message" buttons from the user's personal profile card.
   - Implemented self-profile management controls:
     - **Primary Action**: "Edit Profile" outline button (`flex: 1`, centered text, `<Edit3 size={15} />`, 14px semi-bold).
     - **Secondary Action**: Standalone icon button housing `<Settings size={20} />`, providing direct access to the Preferences & Theme Modal (Light / Dark / System).

3. **Academic Links List Redesign (Mobile Ergonomics)**:
   - Eliminated the cramped 2-column grid layout.
   - Replaced with a unified vertical card (`backgroundColor: colors.surface`, `borderRadius: 16`, `borderWidth: 1`, `borderColor: colors.borderSubtle`).
   - Each link (Google Scholar, ResearchGate, GitHub, ORCID) is rendered as a full-width horizontal row:
     $$\text{Left Icon (18px)} \longrightarrow \text{Label (14px Inter-Medium, flex: 1)} \longrightarrow \text{External Link Arrow } \langle\text{ExternalLink size}=\{16\}\rangle$$
   - Subtle 1px dividers (`borderColor: colors.borderSubtle`) separate each row, with the final row borderless for a clean finish.

4. **Strict Layout Clearances Preserved**:
   - Outermost container: `paddingTop: insets.top + 16` via `useSafeAreaInsets()`.
   - ScrollView container: `contentContainerStyle={{ paddingBottom: 120 }}` for full floating tab bar clearance.
   - Scope isolated strictly to `src/app/(tabs)/profile.tsx`.

---

## Testing Results

1. **TypeScript Type Check**:
   - Command: `npx tsc --noEmit`
   - Result: **0 errors** (Clean compilation).

2. **Production Bundler Verification**:
   - Command: `npx expo export --output-dir /tmp/test-export-profile-polish`
   - Result: **Success (Exit code 0)** — Generated Android HBC (`5.51 MB`), iOS HBC (`5.52 MB`), and Web (`3.48 MB`) bundles with 99 assets.

3. **Web Distribution Sync**:
   - Command: `npx expo export -p web`
   - Result: **Success (Exit code 0)** — Synchronized `./dist` with polished profile screen.

---
*Signed off by: Senior React Native Developer & UI/UX Systems Engineer*
