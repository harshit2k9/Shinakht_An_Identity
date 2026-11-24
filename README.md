# Shinakht

**Shinakht** ("identity" / "recognition") is one Flutter Android app with a patient mode and a
caregiver mode, on Firebase. It supports engagement, routine and safety. Not a medical device;
it does not diagnose or treat.

> Renamed from its earlier working title *Smriti*. The Flutter package, Android application id,
> notification text and docs now all use the Shinakht name; the Firebase project id
> (`dementiacare-vx-7de5c`) is unchanged because a live Firebase project cannot be renamed.

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

The Flutter project itself lives in `app/shinakht` (package `shinakht`, Android application id
`com.example.shinakht`).

## Pitch deliverables

Generated from the code in this repo; `pitch/README.md` explains how to rebuild them.

| File | What it is |
|---|---|
| `pitch/shinakht_tutorial.mp4` | 6-minute narrated tutorial: setup, both modes, safety, stack, status |
| `pitch/shinakht_deck.pptx` | 5-slide deck: problem, solution, stack, status and next steps |
| `pitch/shinakht_tech_stack.pdf` | 5-page tech-stack document with architecture, rules and limits |

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

## Firestore layout (as implemented)
Rules live in `firebase/firestore.rules` and must be published for the caregiver side to work.

- users/{uid}: role, name, language, fcmToken
- pairing_codes/{code}: uid (patient), status (active|used|expired), createdAt
- pairing_requests/{id}: code, caregiverUid, status (pending|approved|denied), pid, patientName, createdAt
- assistantRequests/{id}: uid, text, language, history, createdAt, reply (backend)
- patients/{pid}: name, preferredName, age, bloodGroup, languages, homeAddress, diagnosis,
  allergies, medications, doctorName, doctorPhone, caregiverName, caregiverRelation,
  caregiverPhone, comfortPreferences, caregivers[uids], safeZone{lat,lng,radiusM},
  locationSharingEnabled, lastLocation{lat,lng,accuracy,time}, battery, lastSeen, lastActiveAt
- patients/{pid}/sessions/{id}: game (memory_pairs|shopping_basket), level, accuracy,
  avgResponseMs, language, timestamp, score, rounds, durationMs
- patients/{pid}/locationLogs/{id}: lat, lng, accuracy, battery, time, source (auto|sos|geofence)
- patients/{pid}/alerts/{id}: type (sos|geofence|offline|lowBattery), severity, message, time,
  location{lat,lng,accuracy}, status, ackedBy, ackedAt
- patients/{pid}/reminders/{id}: title, type, time ("HH:mm"), repeat, active, lastDoneOn
- patients/{pid}/contacts/{id}: name, phone, relation, isDoctor, videoUrl
- patients/{pid}/assistantChats/{id}: question, reply, language, time, source (patient|caregiver)
- patients/{pid}/profileChanges/{id}: editorUid, editorName, editorRole, at, changes

Patient writes with `lib/services/patient_writes.dart`; caregiver reads and writes through
`lib/caregiver/data/caregiver_repository.dart`. Keep both in step with the rules.

## Rules for everyone
- Words to use: supports engagement, helps caregivers notice changes early, change from baseline.
  Never: cure, treats, diagnoses, reduces symptoms, recovery.
- No secrets in git. Keys live in Firebase secrets.
- No real patient data in any AI provider. Demo data only.
- Small commits, one branch per feature, clear messages. Ask before editing someone else's folder.
- Pre-work is planning, learning and practice only. Project code is written during the event.
