# Shinakht — Dementia Care Companion

One Flutter Android app with a patient mode and a caregiver mode, on Firebase.
Supports engagement, routine and safety. Not a medical device; does not diagnose or treat.

## Where to work
Each folder below has ONE file, PLAN.md, with suggestions: sub-folders (tasks) and the files to create.
Take your folder, read its PLAN.md, then create the files you need. Nothing else is pre-made.
Who takes which folder is decided later. Read docs/WORK_AREAS.md for what each area really involves.

| Folder | What it is |
|---|---|
| app/lib/core | Shared foundation of the app: setup, login, roles, look, language, shared helpers |
| app/lib/patient | Everything the patient sees and uses |
| app/lib/caregiver | Everything the family or NGO sees and uses |
| functions | Python Cloud Functions: alerts, pairing, assistant, trend logic |
| firebase | Cloud setup: project, billing, rules, secrets, emulator, deploy |
| content | Game words, pictures, stories, Hindi + English texts |
| pitch | Deck, demo script, demo data, testing, backup video |

The Flutter project itself (pubspec.yaml, android/ etc.) is created inside app/ at event start with `flutter create`.

## Decisions so far (latest)
- App: Flutter, Android, one app, two modes. Real APK installed on phones.
- Firebase: Auth (email/password), Firestore (asia-south1), Cloud Messaging, Cloud Functions (Python, 2nd gen), Blaze plan with budget alert.
- Roles in users/{uid}.role: patient, family, ngo. Users cannot change their own role.
- Linking: caregiver account + short-lived 6-digit pairing code (hashed, 10 min, single use). No persistent public IDs.
- SOS: patient app writes an alert doc -> function -> push to caregivers -> Acknowledge. Works offline (queued) with SMS fallback. Never uses the AI.
- Location: foreground service; upload every 30-60 s moving, 5-10 min still. Geofence check runs on the phone: two readings outside, an 'Are you okay?' prompt, then an alert. Caregiver sees live location only while the map is open.
- Assistant: phone does speech-to-text and text-to-speech; a function asks an AI model for a short reply. Provider behind one switch (Claude or Gemini). Key in a Firebase secret.
- Games: Word-Picture Match and Story Comprehension, rule-based adaptive difficulty, Hindi + English, results synced later.
- Reminders: local phone alarms from synced data, work offline.
- Trends: each person against their OWN baseline. Engagement trends only, never diagnosis.
- Optional: Telegram bot alerts, NGO multi-patient view.
- Stubs (say so honestly): video call (shared link), doctor connect (contact card), ABHA (roadmap slide), background geofencing beyond the foreground service.

## Firestore layout
- users/{uid}: role, name, language, fcmToken
- patients/{pid}: name, safeZone{lat,lng,radiusM}, caregivers[uids], lastLocation, battery
- patients/{pid}/alerts/{id}: type (sos|geofence|offline|lowBattery), time, ackedBy, ackedAt, location
- patients/{pid}/sessions, daily, reminders, contacts
- pairingCodes/{hash}: pid, expiresAt, used

## Rules for everyone
- Words to use: supports engagement, helps caregivers notice changes early, change from baseline.
  Never: cure, treats, diagnoses, reduces symptoms, recovery.
- No secrets in git. Keys live in Firebase secrets.
- No real patient data in any AI provider. Demo data only.
- Small commits, one branch per feature, clear messages. Ask before editing someone else's folder.
- Pre-work is planning, learning and practice only. Project code is written during the event.

## Shared AI prompt (paste at the start of every AI chat)
---
I am a student on a 4-person hackathon team (Vihaan X, IEEE DTU, HealthTech). We are building "Dementia Care Companion":
one Flutter Android app with patient mode and caregiver mode, Firebase (Auth, Firestore asia-south1, Cloud Messaging)
and Python Cloud Functions (2nd gen). I am new to much of this: explain in simple words, keep answers short, ask my OS
before giving commands, and check current official docs because things change.
MY FOLDER: <app/lib/core | app/lib/patient | app/lib/caregiver | functions | firebase | content | pitch>
Facts: see the 'Decisions so far' and 'Firestore layout' sections of README.md (paste them here).
Rules: never put secrets in code or git; warn me before anything that costs money; no medical claims (never say treats,
cures, diagnoses, reduces symptoms, recovery; say engagement trends, change from baseline); tell me if a change touches
a folder I do not own. Project code is written during the event; before it I only learn, plan and practise.
---
