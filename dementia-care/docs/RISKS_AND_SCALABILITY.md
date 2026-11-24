# Shortcomings, Failure Modes, Scalability, Feasibility and Roadmap

Companion to [`PROJECT_OVERVIEW.md`](PROJECT_OVERVIEW.md). Last updated 16 November 2026,
code at `fb8aad4`.

This document is written to survive a judge, an engineer or a clinician asking "what breaks?".
Every item is either **[CODE]** (visible in the repo, file named), **[MATH]** (arithmetic shown
so it can be checked), **[DOC]** (a platform/provider rule, linked) or **[JUDGEMENT]**
(our assessment, not a fact). Severity is about harm to a patient, not embarrassment to us.

**The honest summary:** the app's *idea* survives scrutiny; the current *build* is a demo, not
a safety system. Three things would have to be fixed before a single real family used it:
the SOS delivery path, the pairing-code access flaw, and the hardcoded fallback number.

---

## 1. The eight risks that matter most

| # | Risk | Severity | Why it matters | Fix | Effort |
|---|---|---|---|---|---|
| R1 | **No alert sender** — nothing pushes to a caregiver | **Critical** | An SOS is a document nobody is told about unless the app is already open | Firestore-triggered function → FCM to `caregivers`' tokens, plus an escalation timer | 1–2 days |
| R2 | **Pairing codes are enumerable and auto-approve** | **Critical** | `pairing_codes` is readable by *any* signed-in user, 6 digits, patient never confirms a person | Hash codes, restrict reads, show "Ravi wants to link" to the patient | 1 day |
| R3 | **Hardcoded SMS fallback number** | **Critical** | An offline SOS could text a stranger `+919315463194` | Require `caregiverPhone`; no default | 1 hour |
| R4 | **Safe-zone check only runs on one screen** | **High** | Wandering is the headline risk; monitoring stops when the app leaves that screen | Move the check into telemetry (function already exists) | 1 day |
| R5 | **Reminders never ring** | **High** | The most evidence-supported feature currently needs the patient to open the app | `zonedSchedule` alarms + exact-alarm permission | 2 days |
| R6 | **All logic is client-side, with no server reconciliation** | **High** | Offline queues, clock skew and stale data are undetectable by anyone | Server-side "device silent" and unacknowledged-SOS checks | 2–3 days |
| R7 | **No account deletion / data export** | **High** (release blocker) | Google Play requires in-app deletion for account apps; DPDP gives data-principal rights | Delete-account flow + export | 2 days |
| R8 | **Assistant matches on substrings** | Medium | "some**times** I forget" is answered with the time; erodes trust fast | Word-boundary matching + intent tests | 2 hours |

---

## 2. Failure-mode catalogue

### 2.1 Safety and emergency paths

| ID | Trigger | What happens today | Impact | Fix |
|---|---|---|---|---|
| S1 | SOS pressed with no network, profile has no `caregiverPhone` | SMS intent opens to the hardcoded constant **[CODE: `core/constants.dart`]** | Emergency message to an unknown number | Remove default; block SMS without a number |
| S2 | SOS pressed offline, phone never reconnects | Alert stays in the local Firestore queue; nothing escalates | Nobody ever knows. There is no "unacknowledged after N minutes" rule | Server timer + second-contact escalation |
| S3 | Caregiver app closed | Alert exists in Firestore, but no push sender exists **[CODE: `functions/` has only PLAN.md]** | SOS latency = whenever they next open the app | R1 |
| S4 | Patient swipes app away, or an OEM battery killer (Xiaomi/Oppo/Vivo) freezes it | `PatientTelemetry` timer stops; `lastSeen` goes stale **[CODE: `patient_writes.dart`]** | Caregiver sees "warn" after 30 min **[CODE: `common.dart` `statusFor`]** but is not notified | Foreground service (manifest has no `FOREGROUND_SERVICE` **[CODE]**), plus a "device silent" push |
| S5 | Patient leaves safe zone while on the home screen | No check runs; geofence logic lives in `consent_and_geofence_screen.dart` **[CODE]** | Silent exit; caregiver sees nothing | R4 |
| S6 | Phone locked while "Are you okay?" dialog is open | Dialog waits indefinitely; no answer is not an alert (only back-button counts as "notify") | Confused patient, no escalation | 60 s timeout → auto-notify |
| S7 | GPS fix worse than 100 m (indoors, urban canyon) | Reading dropped **[CODE: `location_service.dart`]**; SOS may send no location | Caregiver gets an alert without coordinates | Send last known good fix + accuracy flag |
| S8 | Patient near the zone boundary | Straight-line distance, no accuracy buffer; two consecutive readings required **[CODE]** | Occasional false alarms (and alert fatigue) | Inflate radius by reported accuracy; cool-down between alerts |
| S9 | Two caregivers acknowledge the same alert | Last write wins; no conflict check **[CODE: rules allow `ackedBy`/`ackedAt`/`status`]** | Double response or confusing attribution | Transactional ack with "already acknowledged by X" |
| S10 | Battery dies | No reading; `statusFor` marks warn at >30 min | Only visible if the caregiver looks | Push on silence threshold |

### 2.2 Security and privacy

| ID | Trigger | What happens today | Impact | Fix |
|---|---|---|---|---|
| P1 | Attacker has any account | `allow read: if signedIn()` on `pairing_codes` and the doc id is the 6-digit code **[CODE: rules]**; patient auto-approves every pending request for that code **[CODE: `pairing_code_screen.dart`]** | **Silent takeover of the caregiver relationship** — the single most serious flaw | Hash codes, read only own code, explicit patient confirmation naming the caregiver |
| P2 | Code collision | Code doc id is the 6 digits; a new `.set()` overwrites another patient's active code **[CODE]** | ~39% chance of at least one collision among 1,000 concurrently active codes **[MATH: 1 − exp(−n²/2·10⁶)]** | Check-then-insert with retry, or 8 digits |
| P3 | Spam pairing requests | Any signed-in user may create unlimited `pairing_requests` **[CODE]**, and the patient approves all matches in one snapshot loop | Harassment; multiple unwanted caregivers | Rate limit + one pending request at a time |
| P4 | Self-role change | `users/{uid}` allows the owner to write any field including `role` **[CODE]**, contradicting the README | Role is only used for routing, so impact is low today — but the README's claim is false | Split role write to an admin-only path |
| P5 | No App Check | API key in `google-services.json` (committed) can be used outside the app **[CODE]** | Abuse of the free tier; quota exhaustion as denial of service | Enable App Check with Play Integrity |
| P6 | Caregiver revoked | Their device keeps a local Firestore cache of what they could already see | Unavoidable client-cache residue | Document; add "clear cache on revoke" |
| P7 | Sensitive chat content | Every assistant turn is stored in `assistantChats`, readable by caregivers **[CODE]** | What a confused person says becomes permanent record | Retention window, patient-visible toggle |
| P8 | No email verification/MFA | Anyone can register **[CODE: `auth_service.dart`]** | Weak account security for a care product | Verify email, optional MFA |

### 2.3 Correctness and data quality

| ID | Trigger | What happens today | Impact | Fix |
|---|---|---|---|---|
| D1 | Patient clock is wrong | Reminder "done today", trend windows and staleness all use device time **[CODE: `reminder_utils.dart`, `statusFor`]** | Wrong day boundaries; a 3-hour-fast clock means "stale" never fires | Use server timestamps for comparisons; show device-time warning |
| D2 | First week of data | Trends compare 1 session with 1 session and print "12 points lower" **[CODE: `care_insights.dart`]** | Confident noise; a caregiver may act on it | Minimum-sample guard (e.g. ≥5 sessions/week) |
| D3 | Assistant substring match | `_any` uses `String.contains` **[CODE: `companion_brain.dart`]** — "sometimes", "playlist", "calligraphy" | Wrong answer at the wrong moment | Token/word-boundary match + a regression test list |
| D4 | Caregiver asks "how is the pain location" | Same substring routing in `care_insights.dart` | Wrong section returned | Same fix |
| D5 | Shared family phone | Writes target `Auth.currentUser.uid` **[CODE: `patient_writes.dart`]** | A caregiver logged into the patient's phone writes into their own (empty) patient doc; the real patient's data goes silent | Device-mode lock, or explicit pid binding |
| D6 | Offline for days | Queue drains on reconnect in one burst **[MATH: 3 days ≈ 1,440 queued writes]** | Battery drain; free-tier write quota exceeded in minutes | Backfill cap (keep latest + hourly samples) |
| D7 | Empty/deleted patient doc | Rules `exists()` check makes caregiver access deny | Caregiver screens show permission errors rather than "patient removed" | Friendly state for `permission-denied` |
| D8 | Session logged with clock skew | `Timestamp.fromDate(DateTime.now())` **[CODE]** | Ordering issues in trends | Server timestamp |

### 2.4 Usability, accessibility, language

| ID | Trigger | What happens today | Impact | Fix |
|---|---|---|---|---|
| U1 | Hindi TTS voice not installed | `flutter_tts` fails silently; no fallback message **[CODE]** | A non-reader gets no output at all | Detect voice availability; fall back to on-screen text + chime |
| U2 | Speech recognition fails (accent, dysarthria) | ASR errors are **>2× higher** for people with dementia **[LIT: CHI 2026]** — and we offer chips, but no "type or point" alternative beyond them | Patient cannot get an answer | Keep chips prominent; add a 6-tile picture menu |
| U3 | Web build | No `firebase_options.dart`, so `Firebase.initializeApp()` cannot initialise on web **[CODE]**; geolocation/STT also behave differently; Chrome STT sends audio to Google | The web build is a UI shell, **not** a working app, and the "nothing leaves the device" claim only holds on Android with the on-device path | Scope all claims to Android; add web config only for demo screens |
| U4 | Large system font | Layouts use fixed heights in places (SOS button, tiles) | Clipping at 200% text scale | Test at 1.3×/2.0×; use `FittedBox` sparingly |
| U5 | Other Indian languages | Only English and Hindi, strings inline via `_t()` **[CODE]** | Excludes most of the country | Move to ARB/`intl`, add Marathi/Bengali/Tamil |
| U6 | Screen-reader users | Icon-only controls (mic, status dots) partly unlabelled | Poor TalkBack experience | Semantic labels everywhere |

### 2.5 Operational

| ID | Trigger | What happens today | Impact | Fix |
|---|---|---|---|---|
| O1 | Patient changes phone number or reinstall | No recovery flow; pairing must be redone | Locked out | Account recovery runbook |
| O2 | Firebase project misconfigured | No `firebase_options.dart`; Android depends on `google-services.json` **[CODE]** | Fresh clone needs manual setup (documented in `SETUP.md`) | `flutterfire configure` + CI check |
| O3 | Rules edited without tests | Harness not committed **[CODE: no rules test in repo]** | Silent security regressions | Commit the emulator suite |
| O4 | Caregiver loses interest / data accumulates | No retention policy anywhere | Cost and privacy creep | TTL on `locationLogs`, retention doc |
| O5 | Team handover | 4 students, one-night build, no runbook beyond `SETUP.md` | Bus factor | This document + `SETUP.md` |

---

## 3. Scalability

### 3.1 The write model (measured, not estimated)

Each telemetry push does **two writes** — a merge on `patients/{pid}` and a new
`locationLogs` document **[CODE: `patient_writes.recordLocation`]**, every **3 minutes**
**[CODE: `PatientTelemetry.start`, `interval = 3 min`]**.

**[MATH]** per patient per day: 480 pushes × 2 = **960 writes/day**, and
**480 `locationLogs` documents/day** (≈14,400/month).

| Scale | Writes/day | Reads/day (rough) | Firestore bill (Blaze list prices) | Notes |
|---|---|---|---|---|
| 10 patients | 9,600 | ~20k | **$0** (free tier: 20k writes, 50k reads/day) | Comfortable demo/pilot |
| 20 patients | 19,200 | ~40k | $0, at the edge | Free tier shuts the product off for the month if exceeded **[DOC]** |
| 100 patients | 96,000 | ~200k | ≈ **$4 writes + $3 reads/month** | Blaze required |
| 1,000 patients | 960,000 | ~2M | ≈ **$51 writes + $35 reads/month → ~₹7/patient/month** | Economically fine |
| 10,000 patients | 9.6M | ~20M | ≈ **$860/month** | Needs sharding and aggregation |

Assumptions: app open most of the day; list prices $0.18/100k writes, $0.06/100k reads,
$0.02/100k deletes **[DOC: Firebase pricing]**; no deletes. **Two things inflate this:**

1. **Security-rule reads are billed.** `isCaregiverOf()` calls `exists()` **and** `get()` on
   the patient document for every subcollection access **[CODE: rules]**, and rule reads are
   charged **[DOC]**. Expect roughly **+1,000 reads/day/patient** on top of what the caregiver
   UI asks for. That is the hidden cost of a rules-based permission model.
2. **The 3-minute cadence is a design choice, not a requirement.** Moving/still adaptive
   sampling (15 s while moving, 15 min while still) would cut writes **3–5×** without
   hurting the wandering use case **[JUDGEMENT]**.

### 3.2 Storage growth

**[MATH]** ~250 B per log document (coordinates, accuracy, battery, timestamp, source) →
120 kB/day/patient → **~3.6 MB/patient/month**. The free tier is **1 GiB**
**[DOC]**: that is ≈**280 patient-months**, i.e. ~25 patients for a year, before indexes.
Fix: 90-day TTL on `locationLogs` plus a daily rollup document; Firestore TTL deletes are
billed but make use of the retention policy possible **[DOC]**. Also archive to Cloud Storage
for anything a clinician might want.

### 3.3 Read amplification and query limits

- Dashboard opens several streams at once (patient doc, open alerts, sessions limit 200,
  alerts limit 100, location logs limit 100, reminders, contacts) **[CODE: `caregiver_repository.dart`]**.
  Each caregiver and each tab switch re-reads them. With 3 caregivers, that is 3×.
- Trends are computed **on the client** from up to 200 sessions **[CODE]**. Fine at 200; at
  5,000 sessions the app downloads data it does not show. Fix: precomputed weekly rollups.
- Location history has a hard `limit(100)` with no pagination **[CODE]**. After a week, an
  older incident cannot be found in the UI at all.
- Every `exists()`/`get()` in rules counts against **10 document-access calls per request**
  **[DOC]** — we are at 2, so there is headroom, but a richer permission model will hit it.
- Maximum concurrent listeners, per-document write rates (≈1 write/second per document) and
  document size (1 MiB) are all far above our current load **[DOC]**; the first real ceiling is
  **cost**, not Firestore capacity.

### 3.4 Organisation scale (NGO/clinical)

The data model assumes a small `caregivers` array on each patient and a per-patient page.
An NGO with 300 patients needs: pagination, search, assignment of workers, org-level roles,
and aggregate dashboards. None exists today **[CODE]**. Adding it means a second data shape
(`orgs/{id}/patients/{pid}` or claims-based roles), not a UI tweak. Budget: 1–2 weeks
[JUDGEMENT].

### 3.5 Where scalability would actually hurt first, in order

1. **Alert delivery** (no sender at all) — not a scale problem, a missing component.
2. **Support load** — every false geofence alert costs a phone call; alert quality matters more
   than server capacity.
3. **Cost at 10k patients** — solved by adaptive sampling and TTL.
4. **Rules-read overhead** — solved by claims-based roles or denormalised membership.
5. **Client-side aggregation** — solved by scheduled rollups.

---

## 4. Feasibility

### 4.1 What already works in our favour

- **No AI bill.** Both assistants are deterministic Dart **[CODE]**, so the marginal cost of a
  patient asking 100 questions is zero. This is the single biggest feasibility advantage over
  LLM-based competitors.
- **No server to operate** beyond Firestore rules and (eventually) two functions. A student team
  can run this; there is no Kubernetes, no queue, no VPC **[CODE]**.
- **Offline-first writes** via Firestore persistence **[CODE]**, which matches the 9.4%
  internet-use reality for over-60s **[LIT]**.
- **Cost per patient at 1,000 patients ≈ ₹7/month** **[MATH]** — cheaper than one SMS bundle,
  and within what an NGO could absorb.

### 4.2 What blocks release today

| Blocker | Evidence | Consequence |
|---|---|---|
| **In-app account deletion** absent | `grep deleteUser` → nothing **[CODE]** | Google Play rejects/removes apps that allow account creation without deletion **[DOC: Play data-deletion policy]** |
| **Package id `com.example.shinakht`** | `android/app/build.gradle.kts` **[CODE]** | Play rejects `com.example.*` |
| **Background location** declared in the manifest but no foreground service, no `FOREGROUND_SERVICE` permission | `AndroidManifest.xml` **[CODE]** | Play's background-location declaration asks for a video demo of the feature; we cannot honestly provide one yet |
| **No App Check** | **[CODE]** | API abuse; free-tier exhaustion |
| **No privacy policy / consent notice** | absent | Required by Play and by DPDP |
| **No data-retention or export path** | absent | DPDP data-principal rights |
| **Only tested on the web build** | no device CI **[CODE]** | Location, TTS, STT, notifications are Android-only behaviours |

### 4.3 Regulatory and policy reality (India)

- **DPDP Act 2023**: health data is sensitive, consent must be free, specific, informed and
  unambiguous; the data principal has rights to access, correction, erasure and grievance
  redress; breach notification is mandatory. Our consent screen is a start, **not** a compliant
  consent artefact [JUDGEMENT].
- **Medical device regulation (MDR 2017)**: because we deliberately make **no** diagnostic or
  treatment claim, we stay outside the device definition. The moment a feature says "detects
  early dementia" or "improves cognition", it becomes a regulated claim we cannot support.
  This is a *reason* to keep the current wording discipline.
- **Play Store health policies**: health apps must not make unsupported claims; data-safety
  form must be accurate; background location and exact alarms need declarations.
- **Data residency**: Firestore `asia-south1` keeps data in India **[CODE: SETUP.md]** — a
  genuine advantage for Indian procurement.

### 4.4 Non-technical feasibility (the part decks skip)

- **Who installs it?** Not the patient. A caregiver or NGO worker must set up the phone, grant
  permissions and pair. Our flow assumes a caregiver present; without one the product is inert.
- **Who pays?** ₹7/patient/month at 1k scale is trivial, but someone must run billing, support
  and a phone number. Today nobody does.
- **Who answers when it fails?** A false negative (missed SOS) is the liability case. Any real
  deployment needs a written escalation policy and someone on call — we have neither.
- **Distribution**: no clinician or NGO partner has reviewed the product. Without one, adoption
  is a hypothesis.
- **Team**: 4 students, no maintenance rota, no on-call. Fine for a hackathon; not for a pilot
  without a named owner.

---

## 5. Future improvements

### P0 — before one real family touches it (≈1 week)

1. Alert sender + escalation ladder (SOS unacknowledged 3 min → push all, 10 min → SMS/call next contact).
2. Hash pairing codes, restrict `pairing_codes` reads to the creator, patient confirms the **named** caregiver.
3. Delete the hardcoded SMS number; require `caregiverPhone`.
4. Reminder alarms via `zonedSchedule` with exact-alarm permission and per-reminder ids.
5. Move the safe-zone check into `PatientTelemetry.pushOnce` (function already exists).
6. Account deletion + data export + privacy policy + consent notice.
7. Word-boundary intent matching, with a test list of 30 phrasings including traps ("sometimes", "playlist").
8. App Check, pairing rate limits, `users` role write restricted.

### P1 — makes a pilot possible (2–3 weeks)

9. Server-side silence detection ("no location for 2 h" → caregiver), because client timers die.
10. Minimum-sample guard in trends; weekly rollups instead of client aggregation.
11. Pagination + date filter for location history; 90-day TTL.
12. Caregiver identity in the pairing dialog; multi-caregiver role labels ("daughter", "nurse").
13. Offline banner with last-sync time on both sides; queue-size visibility.
14. Accessibility pass at 200% font scale, TalkBack labels, Hindi TTS availability check.
15. Committed emulator rules tests + a few unit tests (reminder parsing, intent matching, trend maths).
16. `flutterfire configure`, real Play package id, internal-testing track build.

### P2 — after the pilot says it helps (post-validation)

17. Foreground service with Play declaration, adaptive sampling (moving vs still).
18. Caregiver handover notes; shift log; "who is on duty" — the thing families actually ask for.
19. Doctor-visit export (PDF: sessions, alerts, location summary) with consent.
20. More languages (ARB-based), picture-based patient menu for non-readers.
21. SMS gateway as a server-side fallback instead of an intent (works on feature phones via a
    caregiver's number — but see G6: never a hardcoded one).
22. Wearable/beacon support for indoor location (GPS fails indoors, which is where most time is spent).

### P3 — research bets, explicitly not claims

23. Change-from-baseline anomaly detection (engagement drop) with clinician review, evaluated
    as a screening *signal*, never a diagnosis.
24. Fall detection from accelerometer — high false-positive risk; needs a study before shipping.
25. Voice wake-word and hands-free SOS for late-stage patients.
26. ABDM/ABHA integration — a roadmap slide, not a feature; requires certification and a partner.

### Deliberately **not** building

- Cognitive training claims ("improves memory") — unsupported by evidence and medically risky.
- Risk scores or "dementia stage" prediction — diagnosis-adjacent, regulated, and we lack data.
- A general-purpose chatbot — ASR error rates for this population make open-ended conversation a
  support burden with no proven benefit **[LIT: CHI 2026]**.
- Cloud video/telehealth — out of scope, and we would be competing with dedicated tools.

---

## 6. If we had 48 hours

| Order | Task | Why first |
|---|---|---|
| 1 | Remove hardcoded SMS number | One-line change, removes a "texts a stranger" failure |
| 2 | Hash codes + patient-confirmed pairing | Removes the only silent-takeover path |
| 3 | Alert sender (single function, FCM) | Turns SOS from a log entry into a notification |
| 4 | Reminder alarms | Makes the best-evidenced feature actually function |
| 5 | Geofence into telemetry | The headline safety risk starts being monitored |
| 6 | Word-boundary intents + test list | Cheapest credibility win in the demo |
| 7 | Account deletion + privacy policy | Unblocks any store listing |
| 8 | Commit rules tests | Protects everything above from silent regression |

Do 1–4 and the product stops being *misleading*; do 5–8 and it stops being *fragile*.

---

## 7. Numbers used, and where they come from

| Number | Source |
|---|---|
| 20k writes / 50k reads / 20k deletes per day free; 1 GiB storage | Firestore pricing & quotas **[DOC]** |
| $0.18 / 100k writes, $0.06 / 100k reads, $0.02 / 100k deletes | Firebase pricing example page **[DOC]** |
| Rules `get()`/`exists()` are billed reads; 10 access calls per request | Firestore rules docs **[DOC]** |
| 960 writes and 480 log docs per patient per day | 2 writes × 480 pushes (3-min interval) **[MATH from CODE]** |
| ~3.6 MB/patient/month of location logs | 480 docs × ~250 B × 30 **[MATH]** |
| Collision risk ≈39% at 1,000 concurrent 6-digit codes | 1 − exp(−n²/(2·10⁶)) **[MATH]** |
| ASR error 0.21 vs 0.08 for dementia vs cognitively normal | CHI 2026 paper (see overview §11) |
| 9.4% of Indians 60+ use the internet | NCAER 2026 (see overview §11) |

Everything marked **[CODE]** can be re-checked today with `grep`; everything marked **[MATH]**
can be re-derived from the formulas shown. Nothing in this document depends on a measurement
we have not made except the cost projections, which are labelled as list-price arithmetic.
