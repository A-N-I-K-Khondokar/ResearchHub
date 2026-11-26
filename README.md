# CSE Research Hub 🎓

A research discovery and researcher networking platform for the Computer Science & Engineering department — **DISCOVER → UNDERSTAND → CONNECT**.

Researchers share what they are currently working on, discover people and topics, and connect with collaborators. A separate admin portal reviews and approves accounts.

- **Mobile app:** Expo SDK 52 · React Native · TypeScript · Expo Router
- **Admin portal:** React 18 · Vite 6 · TypeScript (`admin-portal/`)
- **Backend:** Firebase Authentication + Cloud Firestore with tested Security Rules (Spark plan)

## 📱 Download the Android app

**[⬇️ Download CSE-Research-Hub.apk](https://github.com/A-N-I-K-Khondokar/ResearchHub/releases/latest/download/CSE-Research-Hub.apk)** — latest version · [all releases](https://github.com/A-N-I-K-Khondokar/ResearchHub/releases)

1. Open the link on an Android phone (Android 7.0+) and download the APK.
2. When prompted, allow **Install unknown apps** for your browser or Files app, then tap **Install**.
3. Create an account, verify your email and submit your profile. An administrator approves new accounts before you can access the research features.

> Preview build signed by EAS. Verify the download against the SHA-256 checksum listed in the release notes.

## Quick start (developers)

```bash
npm install
cp .env.example .env          # add your Firebase web config
npx expo start                # or: npm run web
```

Admin portal: `cd admin-portal && npm install && cp .env.example .env.local && npm run dev`

## Checks

```bash
npm run typecheck             # mobile TypeScript
npm run test:rules            # 150 Firestore security-rule tests (emulator)
npm run qa:smoke              # live backend smoke test (after npm run demo:seed -- --yes)
```

## Documentation

| Document | Contents |
|---|---|
| [docs/PROJECT_GUIDE.md](docs/PROJECT_GUIDE.md) | Architecture, features, 14-week roadmap status, setup, testing, deployment, limitations |
| [docs/FIRESTORE_DATA_MODEL.md](docs/FIRESTORE_DATA_MODEL.md) | Collections, fields, approval state machine, security rules, indexes |
| [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) | University demonstration script and checklist |
| [admin-portal/README.md](admin-portal/README.md) | Admin portal setup, actions and Firestore writes |
