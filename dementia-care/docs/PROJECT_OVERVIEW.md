# Shinakht — Project Overview, Evidence and Honest Limits

Last updated: 16 November 2026 · Code at commit `9accbdc` (branch `main`)

This document answers six questions: what we built, what it runs on, what problem it
addresses, what it actually solves, why our approach is defensible, and whether it works.
Every factual claim is labelled with where it comes from:

| Label | Meaning |
|---|---|
| **[CODE]** | Verifiable in this repository, with the file named. Re-check any time. |
| **[LIT]** | External published evidence, cited with a link in §11. |
| **[MEASURED]** | A check we actually ran, with the command and result. |
| **[UNPROVEN]** | A belief or design intent that we have **not** tested. Treat as a hypothesis. |

**Status: prototype.** One Flutter app with patient and caregiver modes, on Firebase.
It is not a medical device. It does not diagnose, treat, cure or reduce symptoms, and
this document makes no clinical claims. We have not run it with patients, families or
clinicians outside the team, so **nothing here is evidence that the app improves health,
safety or caregiver wellbeing.** §8 and §9 say that plainly and say what would change it.

---

## 1. The problem

### 1.1 Dementia is common, costly and mostly cared for by families

- **57 million people** were living with dementia in 2021; **over 60%** live in low- and
  middle-income countries, with **nearly 10 million new cases a year**. It is among the
  leading causes of death and of disability/dependency in older people. **[LIT]** (WHO fact sheet)
- The global cost was **US$1.3 trillion in 2019**, and **about half of that is unpaid care by
  family and friends**, who provide on average **5 hours of care and supervision per day**.
  Women provide ~**70% of care hours**. **[LIT]** (WHO fact sheet)
- WHO projects ~**78 million** cases by 2030 and ~**139 million** by 2050, with cost rising to
  **US$1.7 trillion by 2030** at constant prices. **[LIT]** (WHO 2021 status report / news release)

The point for a product: the load is not mainly in clinics. It is in **households**, spread
over long hours, and it is mostly **unsupervised family labour**.

### 1.2 India specifically

- **7.4% of Indians aged 60+** live with dementia — about **8.8 million people** — from a
  nationally representative study (LASI). Prevalence is higher in women (9.0% vs 5.8%) and in
  rural areas (8.4% vs 5.3%). **[LIT]** (Lee et al., *Alzheimer's & Dementia*, 2023)
- A stricter DSM-5 classification of the same cohort finds **17.6% mild** and **7.2% major**
  neurocognitive disorder, i.e. the true burden is larger than "dementia" alone. **[LIT]** (LASI-DAD, PLOS ONE 2024)
- Estimates differ by method (a Delphi consensus put prevalence at 2.8%, ~3.9 million), which
  is itself a finding: **even the denominator is contested**. We quote the range rather than
  one flattering number. **[LIT]**
- The **care gap is enormous**: an estimated **~80% of cases in India are undiagnosed**, and the
  treatment gap exceeds **90%** in most of the country. **[LIT]**
- Older Indians are largely offline: only **9.4% of people aged 60+ use the internet**; ~**42.5%**
  have any access, and **more than half rely solely or partly on basic/feature phones**;
  rural digital literacy measured at **11%** in one study. **[LIT]**

That last point is a constraint on *any* phone-based intervention, not a footnote. It shapes
our design (§3.4) and it caps who we can honestly claim to serve.

### 1.3 Wandering and getting lost

- **Six in ten people with dementia will wander at least once**, many repeatedly. **[LIT]** (Alzheimer's Association)
- Of those who wander and are **not found within 24 hours, up to half suffer serious injury or
  death**. **[LIT]** (Alzheimer's Association; scoping review, PMC6234917)
- Wandering increases caregiver distress and search costs, and is one of the main reasons
  families restrict a person's independent movement. **[LIT]** (scoping review; GPS feasibility study)

### 1.4 Caregiver burden, measured

- In an Asian LMIC systematic review, **India had the highest mean Zarit Burden Interview score
  (34.7)** among reporting countries, and burden prevalence as high as **64.6%**. A later
  review put India's transformed mean burden highest in the region (44.8). **[LIT]**
- In a rural Indian cohort, informal care averaged **38.6 hours/week**; **10.6%** of caregivers
  screened positive for depression; supervision time was a significant driver of burden. **[LIT]**
- Using national LASI data, **29% of informal caregivers reported depressive symptoms**, and
  about **half of those giving >40 hours/week** did. **[LIT]**

The problem statement we can defend without any medical claim:

> Families managing dementia in India carry a long, unsupervised care load, with little
> information about what happened when they were not there, and no affordable, consent-based
> way to notice a missing person or an unacknowledged emergency quickly.

---

## 2. What we built

One Android app, two modes, one Firestore data contract. 47 Dart files, ~12,400 lines under
`app/shinakht/lib` (patient 6,268 / caregiver 5,610 / shared services+core 517). **[CODE]**

### 2.1 Patient mode — [`lib/features/patients/`](app/shinakht/lib/features/patients)

| Capability | What it does | Where |
|---|---|---|
| Home screen | Five large actions (games, reminders, contacts, assistant, profile) + one red SOS; English/Hindi toggle; next-reminder strip | `screens/patient_home_screen.dart` |
| SOS | Confirm dialog → writes a **critical alert document**, refreshes location with `source: 'sos'`, and if a server read fails **opens a pre-filled SMS** with coordinates. Firestore queues the write offline. No AI involved. | `services/sos_service.dart` |
| Voice assistant | **On-device** answers: greeting, name, time, date, medicines, next reminder, caregiver, home address, calling a saved contact, SOS guidance, feelings, games. English/Hindi, spoken aloud, with large tap-able fallback questions and a one-tap **Call** button. | `services/companion_brain.dart`, `services/voice_assistant_service.dart`, `screens/voice_assistant_screen.dart` |
| Reminders | Caregiver-authored reminders appear as a checklist with "next up", 12-hour times, spoken text support | `screens/patient_reminders_screen.dart`, `services/reminder_utils.dart` |
| Games | Two games (memory pairs, shopping basket) with **adaptive difficulty 1–5** (raises on a correct fast answer, lowers after two misses or a >12 s answer); every session is logged | `screens/game1_screen.dart`, `game2_screen.dart`, `services/difficulty_engine.dart` |
| Contacts | Tap-to-call list, including the doctor | `screens/patient_contacts_screen.dart` |
| Consent & safe zone | Explanations, location-sharing toggle, safe-zone setup, and a **two-consecutive-readings** outside-zone check that raises an alert (with a simulate button for demos) | `screens/consent_and_geofence_screen.dart`, `services/geofence_service.dart` |
| Pairing | 6-digit code from `Random.secure()`, 10-minute countdown, single use, and the **patient approves** the caregiver request — the only code path that writes the `caregivers` array | `screens/pairing_code_screen.dart` |
| Telemetry | Foreground timer every 3 minutes: high-accuracy fix (drops fixes worse than 100 m), battery, `lastSeen`; respects the sharing toggle; stops when the screen closes | `services/location_service.dart`, `services/patient_writes.dart` (`PatientTelemetry`) |

### 2.2 Caregiver mode — [`lib/caregiver/`](app/shinakht/lib/caregiver)

| Capability | What it does | Where |
|---|---|---|
| Pairing | Enter the patient's code; creates a request and waits up to 45 s for the patient to approve | `pairing/link_request.dart` |
| Dashboard | 5 tabs: **Overview** (status banner, today, care-assistant card, profile snapshot), **Activity**, **Location**, **Alerts**, **More** | `dashboard/dashboard_screen.dart` |
| Location | Map card with safe-zone circle and full-screen map, sharing status, last fix, accuracy, battery, distance from zone, and location history | `location/location_log_screen.dart`, `map/live_map_screen.dart` |
| Alerts | Live list, one-tap **Acknowledge** (rules allow only `ackedBy`/`ackedAt`/`status`), jump to location | `alerts/alerts_screen.dart` |
| Trends | This patient's own week-over-week change in sessions, accuracy and answer speed | `trends/trends_screen.dart`, `assistant/care_insights.dart` |
| Care assistant | **Deterministic summaries** of stored records (briefing, location, games, alerts, reminders, contacts, trends, assistant conversations). Keyword routing, **no model call** | `assistant/care_insights.dart` |
| Settings | Safe zone, reminders, contacts, profile editor with an **append-only change log**, and self-service **Remove my access** | `settings/*.dart`, `profile/patient_profile_editor_screen.dart` |

### 2.3 Data and security

- Firestore schema (patient document + `sessions`, `locationLogs`, `alerts`, `reminders`,
  `contacts`, `assistantChats`, `profileChanges`) is documented in
  [the project README](../../README.md) and implemented in
  [`lib/services/patient_writes.dart`](app/shinakht/lib/services/patient_writes.dart) and
  [`lib/caregiver/data/caregiver_repository.dart`](app/shinakht/lib/caregiver/data/caregiver_repository.dart).
- [`firebase/firestore.rules`](firebase/firestore.rules) (215 lines) enforces, not just documents:
  - caregivers can edit **only an allowlist of profile fields**, and can remove **only
    themselves** from `caregivers` (set-difference check);
  - sessions and location logs are **patient-write**, caregiver-read;
  - alerts can be changed by a caregiver **only** in `ackedBy`, `ackedAt`, `status`;
  - `assistantChats` and `profileChanges` are **immutable to caregivers** (append-only);
  - everything unmatched is **denied by default**.
- This matters because the safety story of a care app is only as good as who can write what.

---

## 3. Tech stack and why

| Layer | Choice | Why (and what it costs us) |
|---|---|---|
| App | **Flutter 3.50.0 / Dart 3.14.0**, single codebase, Android + web build **[MEASURED]** | One codebase for two roles; web build makes demos and review easy. Cost: web cannot do background location or reliable notifications. |
| UI | `material_ui` package, large targets, high contrast, TTS everywhere **[CODE]** | The primary user may have low vision and low digital confidence. |
| Auth | Firebase Auth, email/password; role stored in `users/{uid}.role` and used for routing **[CODE]** | No custom credential handling. Cost: email/password is itself a barrier for this population; a caregiver-setup flow is the realistic path. |
| Data | **Cloud Firestore** (asia-south1), offline persistence, security rules **[CODE]** | Offline queueing is essential; security rules give server-side enforcement without a server. |
| Maps | `flutter_map` + OpenStreetMap tiles **[CODE]** | No API key or billing dependency; OSM attribution required in production. |
| Location | `geolocator` + `permission_handler` + `battery_plus` **[CODE]** | Standard, permission-explicit. Cost: battery, and OS throttling. |
| Speech | `speech_to_text` 7.5.0 (STT) + `flutter_tts` (TTS), en_IN / hi_IN **[CODE]** | No cloud speech vendor, no per-request cost, no audio leaving the device. Cost: STT quality varies by device; see §8.4. |
| Charts | `fl_chart` **[CODE]** | Trends drawn from session logs. |
| Local notifications | `flutter_local_notifications` + `firebase_messaging` client handlers **[CODE]** | Ready for alerts; see gap G2/G3 — there is no sender and no scheduling yet. |
| Assistant | **Deterministic Dart, on-device** (**[CODE]**) | Zero inference cost, instant, offline, no patient text sent to any AI provider. Cost: narrow coverage by design. |
| Backend | **None deployed.** `functions/` contains only a plan. **[CODE]** | Honest status: all logic is client-side + security rules. |

Cost profile at current design: Firebase free tier for a pilot; **no per-message AI spend**.
That is deliberate — the assistant must not become a bill that scales with a patient talking.

---

## 4. What we are solving (need → mechanism → what exists)

| Real need (evidence) | Our mechanism | Implemented? |
|---|---|---|
| Families do not know what happened while they were away **[LIT: 5 h/day supervision; 38.6 h/wk care]** | Caregiver dashboard: live-ish status, activity, location history, alert log, trends | **Yes [CODE]** (foreground telemetry, ~3 min) |
| Emergency may go unnoticed **[LIT: SOS/response time matters; half not found in 24 h are seriously hurt or die]** | One red SOS on the patient home → critical alert doc + location + SMS fallback | **Partly**: alert + SMS exist; **no push sender**, so a caregiver only sees it when the app is open (G2) |
| Getting lost **[LIT: 6 in 10 wander]** | Safe zone + two-reading outside check + live map + distance from zone | **Partly**: check and alert implemented in the consent screen; **not run continuously in the background** (G4) |
| Repeated questions ("what time is it?", "did I take my medicine?") **[LIT: caregivers report repeated questioning; 5 h/day supervision]** | On-device voice assistant grounded in profile/reminders/contacts | **Yes [CODE]**, coverage is deliberately narrow (§8.4) |
| Routine and orientation **[LIT: reminders show moderate benefit on some outcomes]** | Reminder list with next-up and spoken text | **Yes [CODE]**, but **not scheduled as device alarms** (G3) |
| Engagement without a scoreboard that shames | Two games, adaptive 1–5 difficulty, no "fail" state, sessions logged for trends | **Yes [CODE]** |
| Privacy and consent in a surveillance-shaped product | Patient approves pairing; sharing toggle; caregiver self-removal; no AI provider; rules-enforced field limits | **Yes [CODE]**, with the code-hashing gap in G5 |
| Low connectivity **[LIT: 9.4% of 60+ online]** | Offline-first writes, on-device answers, no server dependency for core flows | **Yes [CODE]** |

---

## 5. Why us (and what is not unique)

**Defensible differences, each checkable in the repo:**

1. **It works with no internet, and with no per-request cost.** The patient assistant and the
   caregiver assistant are both deterministic Dart (`companion_brain.dart`,
   `care_insights.dart`). No request leaves the phone for an answer. In a country where
   **9.4% of over-60s use the internet**, that is not a gimmick; it is the difference between
   a product that works in a village and one that does not. **[CODE][LIT]**
2. **Consent is enforced in the data layer, not the copy.** Pairing requires the patient's
   approval; the patient can pause sharing; a caregiver can remove only their own access, and
   the rules check that with a set difference. **[CODE]**
3. **Two-sided by construction.** Most cheap "dementia apps" are either a tracker or a game.
   Ours produces the caregiver-facing artefacts families actually ask for (alerts with
   acknowledgement, location history with accuracy, session trends against the person's own
   baseline) from the same patient app. **[CODE]**
4. **Bilingual, spoken, large-target interface.** Every patient surface has Hindi/English and
   TTS; the assistant answers in the language of the question. **[CODE]**
5. **A safety posture we can defend line by line.** No diagnosis, no risk scores, no
   "AI doctor", no medical claims; trends are "change from this person's own baseline".
   Our own README bans the words cure/treat/diagnose/recovery. **[CODE]**

**What is *not* unique, stated plainly:** GPS trackers for wandering already exist
commercially; reminder apps exist; smart speakers answer questions. Our claim is not
"nobody has done this". It is: **an integrated, offline-capable, consent-based, bilingual
pair of patient+caregiver tools with no recurring AI cost, built for Indian household
constraints** — and even that is a design position, not yet a measured advantage. **[UNPROVEN]**

---

## 6. Is it really necessary?

Necessity is the strongest part of the case, and it rests on independent data:

- **Scale:** 8.8 million Indians over 60 with dementia, growing with population ageing. **[LIT]**
- **Care model:** ~5 hours/day of informal supervision globally; 38.6 h/week measured in rural
  India; ~29% of Indian informal caregivers with depressive symptoms. **[LIT]**
- **Missing information:** families cannot see what happened while away, and ~80% of Indian
  cases are undiagnosed, so most families never receive structured guidance. **[LIT]**
- **Concrete harms:** 6 in 10 wander; up to half of those missing >24 h are seriously injured
  or die. **[LIT]**

So the *need* does not require our app to be proven effective — it is documented
independently. What is **not** established is that *our implementation* reduces any of it. That
is §7 and §9.

---

## 7. Is it effective? Mechanism by mechanism

This is where most student decks overreach. We separate what the literature supports from
what our build does from what remains unknown.

| Mechanism in our app | Best available evidence | Honest verdict |
|---|---|---|
| Medication/routine reminders | Systematic review of 43 studies: **moderate evidence** for some clinical outcomes (systolic BP, physical symptoms); **limited** for service use, cost, user/carer experience. Cochrane review of assistive tech for memory found **no studies of sufficient quality**. A large RCT (SMART4MD, n=1078) found a **modest** quality-of-life gain and **no** significant adherence effect. **[LIT]** | Reminders *can* help some outcomes; the effect is smaller and narrower than marketing suggests. **Our app's reminder effect is unmeasured, and currently weaker than the evidence base assumes because reminders are not scheduled as alarms (G3).** |
| Location tracking / safe zone | Pre-post study of 45 dyads with GPS trackers: more independence, **reduced carer burden and police involvement**, no adverse incidents — but no control group. Integrative review: more independence, less caregiver worry; barriers remain. Systematic review of systematic reviews: **insufficient quantity/quality of RCTs**, plus personalisation and equity problems. **[LIT]** | **Promising, not proven.** The most defensible claim is "may reduce caregiver worry and search effort". **We have not measured it.** |
| Caregiver visibility (alerts, activity, trends) | No trial evidence specific to dashboards; the caregiver-burden literature establishes the need, not the fix. **[LIT]** | **Plausible mechanism, unproven.** |
| Voice assistant for repeated questions | Older adults prefer speech over typing and find it faster; but ASR error rates for people with dementia were **more than double** those of cognitively normal peers (0.21 vs 0.08), and accuracy degrades with dysarthria severity. **[LIT]** | **Mixed by design.** This is exactly why we ship large tap-able questions as a full alternative, keep answers one or two sentences, and never put a medical decision behind speech. **No claim that STT will understand a given patient.** |
| Adaptive games / engagement | Games are used as engagement and as a *behavioural* signal, not therapy. There is no evidence here that games improve cognition, and we do not claim it. **[UNPROVEN]** | **Engagement only.** Trends exist to show change from baseline, for a human to interpret. |
| SOS | Mechanically sound (doc + location + SMS fallback), but **no outcome data**; and without a push sender the caregiver may only see it in-app. **[CODE][UNPROVEN]** | **Feature exists; response benefit unproven; delivery path incomplete (G2).** |

### Is the app "effective" today?

**No claim can be made.** What we can say with evidence:

- the **need** is real and documented (§1, §6);
- the **mechanisms** we use are the ones with at least some supporting literature, and we avoid
  the ones with none (no diagnosis, no cognitive training claims);
- the **build** compiles and the security model is testable (§9).

What we cannot say: that using it improves safety, reduces caregiver burden, improves
adherence, or delays anything. We have not run a study, not even a small one, and we have
not put it in front of a person with dementia. Any statement stronger than "designed to"
would be unsupported.

---

## 8. Gaps we are not hiding

Failure modes, scalability arithmetic, feasibility and the roadmap live in
[`RISKS_AND_SCALABILITY.md`](RISKS_AND_SCALABILITY.md).

| # | Gap | Evidence | Consequence |
|---|---|---|---|
| G1 | **No field testing at all** — no patients, families, clinicians or usability sessions | No test artifacts in repo; only the default Flutter counter test remains (`test/widget_test.dart`) | Every effectiveness statement is a hypothesis |
| G2 | **No push sender.** `functions/` contains only `PLAN.md`; client FCM handlers exist but nothing sends | `caregiver/push/push_handler.dart` present, no server | Alerts are seen only while the caregiver app is open — the single biggest delivery gap for SOS |
| G3 | **Reminders are not scheduled device alarms.** `flutter_local_notifications` is used for a demo notification and TTS, not `zonedSchedule` | `grep zonedSchedule` → none | A reminder does not buzz at 8 pm; the patient must open the app |
| G4 | **Geofence is not a background service.** The two-reading check runs inside the consent screen (plus a simulate button); `LocationService.getForegroundTrackingSettings()` is defined but unused for streaming | `consent_and_geofence_screen.dart`, unused helper | No continuous safe-zone monitoring; telemetry is a 3-minute foreground timer |
| G5 | **Pairing codes are stored in clear text** as document IDs and are readable by any signed-in user (`allow read: if signedIn()`), with client-side expiry | `firestore.rules`, `pairing_code_screen.dart` | A 6-digit code is enumerable in principle; README's "hashed" wording is **not** what the code does |
| G6 | **SMS fallback has a hardcoded default number** (`AppConstants.defaultCaregiverPhone = '+919315463194'`) | `core/constants.dart` | If the profile has no caregiver number, an SOS SMS goes to a stranger. Must be removed before any real use |
| G7 | **Assistant conversations are stored in Firestore** (`assistantChats`) | `patient_writes.dart` | Privacy trade-off: caregiver visibility vs. storing what a confused person said. Needs a retention/consent decision |
| G8 | **No automated test suite.** Rules were validated in an emulator during development (42 checks reported) but the harness is not committed | Not reproducible from the repo | Regressions in rules would be silent |
| G9 | **The root `README.md` overstates the build** (Python Cloud Functions, AI provider, scheduled reminders, hashed codes, 30–60 s uploads) | Root README vs code (its old copy at `dementia-care/README.md` was deleted in `9647d6d`) | Use this document, not the README, for claims. The README's “Decisions so far” needs marking as planned-not-built |
| G10 | **Web build is not the target.** `flutter build web` passes, but location/background/notifications are Android features | Build output plus package constraints | Demos on web show the UI, not the safety features |

These are fixable engineering items, listed in §12 — not reasons the idea is wrong, but
reasons the current artefact must not be described as a working safety system.

---

## 9. What is actually verified

| Check | Result | How |
|---|---|---|
| Static analysis | **0 errors**; 46 informational lints (pre-existing, mostly `print`/`withOpacity` in untouched files) | `flutter analyze` |
| Release build | **Succeeds** | `flutter build web --release` |
| Firestore rules | **42/42 checks passed** in the Firestore emulator during development (role checks, caregiver field allowlist, self-removal only, ack-only alert updates, immutable chats, deny-by-default) | Emulator run; harness **not committed** (G8) |
| Manual demo path | Pair → see status → press SOS → alert appears → acknowledge → location + history + trends | Not re-run for this document; requires the Firebase project in `SETUP.md` |
| Usability / clinical / field | **None** | — |

"Compiles" is not "works for a person". We are not going to blur that line.

---

## 10. What would let us claim effectiveness

A pilot we could actually run, designed to fail honestly:

- **Participants:** 20–30 patient–caregiver dyads, mild-to-moderate dementia, one city + one
  rural site, caregiver consent and patient assent; ethics approval before any data collection.
- **Design:** 4-week baseline with usual care, then 4 weeks with the app; pre/post plus
  within-person comparison. No randomisation pretence at this scale.
- **Primary (caregiver):** Zarit Burden Interview short form (ZBI-12) change; number of
  "where are they / are they okay" calls per week (self-logged).
- **Secondary:** alert acknowledgement latency (median seconds), % of days with a location
  fix, SOS end-to-end delivery success, reminder check-off rate, task completion and SUS score
  for the patient UI, uninstall/attrition.
- **Safety:** count of false geofence alerts, missed alerts, and any privacy incident.
- **Stop rules:** any missed SOS, any wrong-recipient SMS, or >30% attrition ends the pilot for
  redesign rather than re-analysis.
- **What would falsify us:** no ZBI improvement, no reduction in check-in calls, or patients
  unable to complete the home screen unaided. Any of those is a legitimate result.

Until something like this runs, the correct description is: **"designed to reduce caregiver
uncertainty and speed up noticing an emergency; not yet shown to do so."**

---

## 11. Claim ledger (every claim → proof)

| Claim | Proof |
|---|---|
| 57M people, ~10M new cases/yr, $1.3T, ~50% informal care, 5 h/day, women 70% of care hours | WHO dementia fact sheet (26 Oct 2026) |
| 78M by 2030, 139M by 2050, $1.7T by 2030 | WHO Global status report 2021 + WHO news release, 2 Sep 2021 |
| India: 7.4% of 60+, 8.8M people; female/rural gradients | Lee et al., *Alzheimer's & Dementia* 2023, doi:10.1002/alz.12928 |
| India: 17.6% mild / 7.2% major NCD | LASI-DAD, *PLOS ONE* 2024 |
| Alternative lower estimate (2.8%) | Delphi study, *Dementia* 2024 (SAGE) |
| ~80% undiagnosed in India; >90% treatment gap | ScienceDirect review 2026 citing Lee et al.; *Indian J Psychiatry* 2011 (PMC3038542) |
| 6 in 10 wander; up to half of >24 h missing are seriously injured or die | Alzheimer's Association (alz.org wandering, disaster pages); scoping review PMC6234917 |
| India highest ZBI mean (34.7), burden up to 64.6% | *Aging & Mental Health* 2025 systematic review; *Alzheimer's & Dementia* 2023 abstract |
| 38.6 h/week informal care, 10.6% caregiver depression (rural India) | *BMC Health Services Research* 2014 |
| 29% of Indian informal caregivers with depressive symptoms | *BMC Public Health* 2023 (LASI Wave I) |
| Medication reminders: moderate evidence for some outcomes, limited for cost/experience/utilisation | *Age and Ageing* 2026 systematic review |
| Assistive tech for memory: no studies met Cochrane criteria | Cochrane CD009627 (2017) |
| Digital assistive tech: insufficient RCT quantity/quality, equity and personalisation gaps | *DIGITAL HEALTH* 2025, review of 112 reviews (INTERDEM) |
| GPS trackers: more independence, less carer burden/police involvement; no control group | *Dementia* 2024, 45 dyads (Doyle et al.) |
| Location tracking: more independence, less caregiver worry; barriers | Integrative review, PMC11189016 |
| SMART4MD RCT: modest QoL gain, no adherence effect, ~40% dropout | *JMIR* 2024/2026 |
| ASR error 0.21 (dementia) vs 0.08 (cognitively normal), n=83 | CHI 2026, ACM DL 3772318.3791581 |
| ASR degrades with dysarthria severity | *Int J Speech Technology* 2021; *JSLHR* 2024 |
| Older adults prefer speech, but structured commands are a barrier | CHI 2023; *JMIR mHealth* 2021 |
| Only 9.4% of Indians 60+ use the internet; 42.5% have access; >half feature-phone-only | NCAER 2026 digital inclusion report; Ideas for India (NSS CMS:T 2025) |
| Rural older-adult digital literacy 11% | DAHLIA study, *Geriatrics* 2022 |
| App structure, features, gaps G1–G10 | This repository at `9accbdc`, file paths in §2, §8 |
| 0 analyze errors, web release builds | Commands in §9 |

---

## 12. Next engineering steps, in order of risk reduction

1. **G2 — add the alert sender.** Smallest honest version: a scheduled function or a
   Firestore-triggered function that pushes `alerts` to caregivers' FCM tokens, plus token
   hygiene. Without it, SOS is a log entry.
2. **G6 — delete the hardcoded SMS number.** Require a caregiver number from the profile;
   refuse SMS fallback otherwise.
3. **G3 — schedule reminders locally** (`zonedSchedule`, exact-alarm permission, per-reminder
   ids) so a reminder is an alarm, not a screen you must open.
4. **G4 — move the safe-zone check into the telemetry path** (reuse `recordReadingAndShouldPrompt`
   inside `PatientTelemetry.pushOnce`), and only then consider a foreground service.
5. **G5 — hash pairing codes** (store `sha256(code)`; restrict `pairing_codes` reads to the
   creator and the request path) and shorten the TTL server-side.
6. **G8 — commit the rules test harness** so the 42 checks are reproducible in CI.
7. **G9 — correct the root `README.md`** to match the code, or mark its "Decisions so far"
   section as planned-not-built.
8. Then, and only then, the pilot in §10.

---

## 13. References

1. WHO. *Dementia* fact sheet, 26 October 2026. https://www.who.int/news-room/fact-sheets/detail/dementia
2. WHO. *Global status report on the public health response to dementia*, 2021. https://iris.who.int/handle/10665/344701
3. WHO. "World failing to address dementia challenge", 2 September 2021. https://www.who.int/news/item/02-09-2021-world-failing-to-address-dementia-challenge
4. Lee J. et al. "Prevalence of dementia in India: National and state estimates from a nationwide study." *Alzheimer's & Dementia*, 2023. https://alz-journals.onlinelibrary.wiley.com/doi/10.1002/alz.12928
5. "Prevalence of DSM-5 mild and major neurocognitive disorder in India: Results from LASI-DAD." *PLOS ONE*, 2024. https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0297220
6. Farina N. et al. "Estimating the number of people living with dementia at different stages of the condition in India: a Delphi process." *Dementia*, 2024. https://journals.sagepub.com/doi/10.1177/14713012231181627
7. "Closing the treatment gap for dementia in India." *Indian Journal of Psychiatry*, 2011. https://pmc.ncbi.nlm.nih.gov/articles/PMC3038542/
8. Alzheimer's Association. *Wandering*. https://www.alz.org/help-support/caregiving/safety/wandering
9. "What do we know about strategies to manage dementia-related wandering? A scoping review." https://pmc.ncbi.nlm.nih.gov/articles/PMC6234917/
10. "Caregiver burden among dementia caregivers in low- and middle-income countries in Asia: a systematic review." *Aging & Mental Health*, 2025. https://www.tandfonline.com/doi/full/10.1080/13607863.2025.2462110
11. "Burden of caregiving to people living with dementia in LMICs in Asia: a systematic review." *Alzheimer's & Dementia*, 2023. https://alz-journals.onlinelibrary.wiley.com/doi/10.1002/alz.082857
12. "Cost and burden of informal caregiving of dependent older people in a rural Indian community." *BMC Health Services Research*, 2014. https://pmc.ncbi.nlm.nih.gov/articles/PMC4022434/
13. "Caregiving: a risk factor of poor health and depression among informal caregivers in India." *BMC Public Health*, 2023. https://bmcpublichealth.biomedcentral.com/articles/10.1186/s12889-022-14880-5
14. "Effects of using medication reminder technologies by home-dwelling older citizens: a systematic review." *Age and Ageing*, 2026. https://academic.oup.com/ageing/article/55/2/afag007/8464951
15. Cochrane. "Assistive technology for memory support in dementia." 2017. https://www.cochrane.org/evidence/CD009627_assistive-technology-memory-support-dementia
16. "Digital assistive technologies for community-dwelling people with dementia: a systematic review of systematic reviews." *DIGITAL HEALTH*, 2025. https://journals.sagepub.com/doi/10.1177/20552076251362353
17. Doyle M. et al. "Implementing global positioning system trackers for people with dementia who are at risk of wandering." *Dementia*, 2024. https://journals.sagepub.com/doi/10.1177/14713012241248556
18. "An integrative review of the feasibility and effects of location-tracking devices by persons living with cognitive impairment." https://pmc.ncbi.nlm.nih.gov/articles/PMC11189016
19. "SMART4MD: 18-month multicentre pragmatic RCT." *JMIR*, 2024. https://pmc.ncbi.nlm.nih.gov/articles/PMC13451873/
20. "Challenges in automatic speech recognition for adults with cognitive impairment." *CHI 2026*. https://dl.acm.org/doi/full/10.1145/3772318.3791581
21. "Automatic speech recognition in neurodegenerative disease." *Int J Speech Technology*, 2021. https://link.springer.com/article/10.1007/s10772-021-09836-w
22. "Studying exploration & long-term use of voice assistants by older adults." *CHI 2023*. https://dl.acm.org/doi/10.1145/3544548.3580925
23. "Exploring how older adults use a smart speaker–based voice assistant in their first interactions." *JMIR mHealth*, 2021. https://mhealth.jmir.org/2021/1/e20427
24. NCAER. *The evolving landscape of digital inclusion in India*, 2026. https://ncaer.org/wp-content/uploads/2026/06/NCAER_Report_June_26.pdf
25. Ideas for India. "Making India's digital public infrastructure work for older citizens", 2026. https://www.ideasforindia.in/topics/governance/making-indias-digital-public-infrastructure-work-for-older-citizens
26. "Exploring telehealth readiness in a resource-limited setting (DAHLIA)." *Geriatrics*, 2022. https://www.mdpi.com/2308-3417/7/2/28

---

## 14. One-paragraph summary for a pitch

Dementia affects 57 million people worldwide and about 8.8 million Indians over 60, costs
US$1.3 trillion a year of which half is unpaid family care averaging five hours a day, and
six in ten people with dementia will wander — with up to half of those missing for more than a
day seriously hurt or dead. Indian families carry this with the highest measured caregiver
burden in Asia, while roughly 80% of cases go undiagnosed and only 9.4% of over-60s use the
internet. We built one Flutter app with a caregiver mode and a large-target, bilingual,
offline patient mode on Firebase: a one-tap SOS, a safe zone with a two-reading check, live
location and history, reminders and contacts, two adaptive games that log engagement, a
caregiver dashboard with alert acknowledgement and change-from-baseline trends, and an
on-device assistant that answers everyday questions with no AI bill and no patient audio
leaving the phone. Firestore rules enforce, rather than describe, who may read and write what.
What we can prove today is the need, the build and the security model; what we cannot prove is
benefit, because we have not tested it with a single family yet. Our next steps are the alert
sender, real reminder alarms, background safe-zone checks, hashed pairing codes, and a
30-dyad pilot measuring caregiver burden and alert latency before we claim anything.
