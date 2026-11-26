# University Demonstration Script

**Philosophy:** DISCOVER → UNDERSTAND → CONNECT. **Length:** ~12 minutes + questions.

## Before the session (the day before)

- [ ] `npm run demo:seed -- --yes` (fictional demo researchers; safe to re-run)
- [ ] `npm run qa:smoke` → expect **21 passed, 0 failed** (live backend check)
- [ ] `npm run test:rules` → expect **150 passed** (security rules)
- [ ] Phone: preview APK installed, signed in as **your own approved account**
- [ ] Laptop: admin portal open and signed in (hosted URL or `cd admin-portal && npm run dev`)
- [ ] Laptop browser (second window): web app signed in as **demo.tahsin@researchhub.test** (password in `scripts/demo/.demo-credentials.json`)
- [ ] A fresh test account ready for the sign-up demo (a new email you can verify)
- [ ] Phone charged, Wi-Fi tested, screen mirroring tested, dark mode **off**

## 1. Problem & architecture (1 min)

- CSE researchers don't know who is working on what. The app makes current research discoverable and connects people.
- Expo / React Native app + separate React admin portal, sharing one Firebase backend (Auth + Firestore). No paid services, no Cloud Functions.

## 2. Onboarding & approval (3 min) — *phone + admin portal*

1. Sign up with the fresh account → verification email → tap **I've verified my email** → lands on **Complete Your Profile**.
2. Submit the profile → **pending review** screen.
3. Admin portal: the application appears in **Pending** in real time with a toast → **Review Applicant** → **Approve**.
4. Phone switches to the app automatically (real-time listener) — no restart.

*Talking point:* the profile and an audit record are written in one atomic batch; only an administrator can approve, enforced by security rules, not just the UI.

## 3. DISCOVER (2 min) — *phone, your own account*

1. **Home**: live feed of current research; topic chips with live counts; tap **Bangla NLP** to filter.
2. **Explore**: featured researchers and trending work; **Search** "IoT" or "Farhan".
3. Tap a topic → **Who's Working On This?**

## 4. UNDERSTAND (2 min)

1. Open a research card → full details, stage, tags, external link; **bookmark** it.
2. Tap the author → researcher profile (interests, current work, links). Point out: **no email or student ID** is visible anywhere — the directory is a sanitised copy.
3. Profile → **Library → Saved Items** shows the bookmark.

## 5. CONNECT (2 min) — *phone + browser as Tahsin*

1. On the phone, open **Tahsin Rahman** → **Connect**.
2. In the browser (Tahsin): the notification dot appears → **Notifications → Accept**.
3. Phone: "Tahsin accepted your connection request" arrives; Connections count increases.
4. Show the two incoming requests from Dr. Farhan Kabir and Sadia Islam → accept one, decline one.

## 6. Share (1 min)

**Share** tab → title, description, tags, stage → **Post Update** → it appears at the top of the Home feed (and in the browser for Tahsin).

## 7. Administration & security (1 min) — *admin portal*

Dashboard counts → Users directory (paginated) → suspend a demo researcher → they disappear from Explore on the phone → reinstate. Mention: rejected applicants can correct and resubmit; identity fields are locked after approval.

## 8. Engineering evidence (1 min)

- 150 automated Firestore security-rule tests (emulator) + 21-step live production smoke test.
- TypeScript strict mode, production builds for Android / iOS / web and the admin portal.
- Roadmap: Weeks 1–9 frontend, 10–13 backend integration, 14 QA & deployment (see `docs/PROJECT_GUIDE.md`).

## If something goes wrong

| Problem | Recovery |
|---|---|
| Feed says "index is being prepared" | Wait a minute and pull to refresh |
| A researcher shows "not available" | Admin portal → Overview → **Sync Public Directory** |
| Demo state is messy | `npm run demo:seed -- --yes` resets demo data |
| No network | Show screenshots / the recorded walkthrough |

## After the course

`npm run demo:clean -- --yes` removes every demo researcher, their activity and the demo sign-in accounts.
