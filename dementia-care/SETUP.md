# Setup and run guide

Everything needed to take this repo from a clean machine to two phones running the
patient and caregiver flows. Roughly 20 minutes, most of it Firebase Console clicking.

---

## 0. What already exists in this repo

| Thing | Value |
|---|---|
| Firebase project | `dementiacare-vx-7de5c` (pinned in `.firebaserc`) |
| Android package | `com.example.shinakht` |
| Android config | `app/shinakht/android/app/google-services.json` (committed) |
| Gradle plugin | `com.google.gms.google-services` applied in `android/app/build.gradle.kts` |
| Firestore rules | `firebase/firestore.rules` |
| Flutter app | `app/shinakht/` |

There is **no** `lib/firebase_options.dart`, no Cloud Functions and no push sender.
That only matters for web/iOS and for remote push (see section 7).

---

## 1. Prerequisites

- Flutter **3.35+** (this code was verified on 3.50.0 / Dart 3.14.0): https://docs.flutter.dev/get-started/install
- Android Studio (for the SDK + emulator) or an Android phone with USB debugging
- `flutter doctor` should show a green Android toolchain

```bash
flutter --version
flutter doctor
```

---

## 2. Firebase Console setup (once per project)

Open https://console.firebase.google.com/project/dementiacare-vx-7de5c

1. **Authentication → Get started → Sign-in method → Email/Password → Enable → Save.**
   Without this, sign-up fails with `configuration-not-found`.
2. **Firestore Database → Create database**
   - Location: **asia-south1** (matches the project plan)
   - Mode: **Production mode**
3. **Firestore → Rules** → replace everything with the contents of
   `firebase/firestore.rules` → **Publish**.
   The old rules block nearly every caregiver write and the caregiver patient list,
   so this step is mandatory.
4. Nothing else is required: no Storage, no Functions, no billing.

> Using a **new** Firebase project instead? Project settings → Add app → Android →
> package `com.example.shinakht` → download `google-services.json` into
> `app/shinakht/android/app/`, then update the project id in `.firebaserc`.

### Deploy the rules from the CLI instead (optional)

```bash
npm install -g firebase-tools
firebase login
cd dementia-care
firebase deploy --only firestore:rules
```

`firebase.json` and `.firebaserc` are committed, so this needs no other flags.
No composite indexes are needed: every query is single-field.

---

## 3. Run the app

```bash
cd dementia-care/app/shinakht
flutter pub get
flutter devices          # confirm your phone/emulator is listed
flutter run              # debug build on the default device
```

Useful variants:

```bash
flutter run -d emulator-5554
flutter build apk --release     # demo APK: build/app/outputs/flutter-apk/app-release.apk
```

Release builds currently sign with the debug key (configured in
`android/app/build.gradle.kts`) so `flutter build apk` works for a demo without a
keystore. Add a real keystore before any store upload.

**Web/iOS:** `flutter build web` compiles, but `Firebase.initializeApp()` has no
options outside Android. Run `dart pub global activate flutterfire_cli && flutterfire configure`
to generate `lib/firebase_options.dart` if you need web/iOS.

---

## 4. Two-mode walkthrough (do this after every rules change)

Use two devices, or one device with two accounts (sign out in between).

1. **Patient account**: sign up with role **patient** → patient home appears.
   Grant location ("While using the app" is enough for the demo) and notifications.
2. **Caregiver account**: sign up with role **family** (or `ngo`) → "My family" is empty.
3. **Link them**
   - Patient home → link icon → a 6-digit code appears (valid 10 minutes, single use).
   - Caregiver app → **Link a patient** → type the code.
   - Keep the patient's code screen open: it approves the request automatically.
   - Caregiver lands on the patient screen (Overview / Activity / Location / Alerts / More).
4. **Check the six care features**
   | Feature | Where | How to produce data |
   |---|---|---|
   | Session activity log | Activity → Session log | Finish a round of Memory Pairs or Shopping Basket on the patient phone |
   | Game scores log | Activity → Game scores | Same sessions; Shopping Basket also records points |
   | Location log | Location tab | Leave the patient home screen open ~10 s (a fix uploads every 3 min) |
   | Alert log | Alerts tab | Press **EMERGENCY SOS** on the patient phone, or walk outside the safe zone and tap "Notify caregiver"; then tap **Acknowledge** |
   | Profile access + change log | More → Patient profile | Edit a field and Save; the change log shows who changed what |
   | Care assistant | More → Care assistant | Ask "give me today's briefing" |
5. **Two-way care settings**
   - Caregiver More → Reminders → add one at the next clock time → it appears on the patient's reminders screen and in the home banner.
   - Caregiver More → Contacts → add a contact → it appears on the patient's "Call Family" screen.
   - Caregiver More → Safe zone → pick a centre + radius → the patient's safe-zone screen and geofence checks use it.
   - Caregiver Care settings → Remove my access → the patient disappears from the list and loses nothing else.

---

## 5. Permissions the phone will ask for

Location (fine + background), notifications, ignore battery optimisation, microphone
(voice assistant), and external `tel:` / video / maps links. If location is denied,
telemetry silently skips uploads but SOS still writes an alert.

---

## 6. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Caregiver screen says "Firestore blocked this…" | Rules not published, or the signed-in account is not in the patient's `caregivers` list. Publish `firebase/firestore.rules`. |
| Caregiver list is empty right after pairing | The linked patient document has no data yet; it appears as soon as the patient writes anything. |
| `configuration-not-found` on sign-up/sign-in | Email/Password provider not enabled in Authentication. |
| No sessions in Activity | The patient must play a game **after** the caregiver is linked. |
| Location tab says "No location fix yet" | Patient home must be open (foreground-only tracking), permission granted, and "Share location" on. |
| Alerts tab is empty after SOS | Check the patient phone had network or reconnected; the write is queued offline and syncs later. |
| Geofence/old alerts invisible | Old docs written before this change used `createdAt` instead of `time`; new alerts use `time`. |
| Gradle `google-services` build error | `google-services.json` missing or its `package_name` differs from `applicationId`. |

---

## 7. Deliberately not implemented

- **Cloud Functions.** `assistantRequests` has no backend, so the patient's voice
  assistant falls back to a kind scripted reply. The caregiver assistant is
  rule-based and reads Firestore directly, so it always works.
- **Remote push.** No FCM sender function. In-app streams update live; a local
  notification appears when the app is in the foreground.
- **Background location service.** Telemetry runs while the patient app is open
  (a few minutes per fix). Android foreground-service tracking is the next step.
- **Web/iOS Firebase config** (see section 3).

---

## 8. Verifying this repo without a phone

```bash
cd dementia-care/app/shinakht
flutter analyze          # expect 0 errors
flutter build web --release
```

The Firestore rules were exercised against the Firestore emulator with 42
permission checks (linked/unlinked reads, session + location writes, alert
acknowledgement, caregiver field whitelist, self-removal, assistant and audit
collections). Re-run that kind of check whenever the rules change.
