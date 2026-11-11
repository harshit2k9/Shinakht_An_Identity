# Running the शिनाख्त (Shinakht) Android app

The Capacitor project in this folder now builds successfully — a debug APK is produced at:

```
android_app/android/app/build/outputs/apk/debug/app-debug.apk
```

## What was fixed to make it build

1. **`AndroidManifest.xml`** – `LocationPingService` was declared inside a *second, stray*
   `<application>` tag (invalid manifest). It now lives inside the main `<application>` element.
2. **`LocationPingService.java`**
   - `loc.longitude` → `loc.getLongitude()` (field access doesn't exist on `android.location.Location`).
   - Removed a call to `LocationManager.requestLocationUpdates(..., Criteria.NO_USAGE_CHECK)` —
     that constant does not exist; the plain 4-arg overload works on all supported API levels.
   - `onLocationChanged` no longer declares a checked `JSONException` the interface forbids
     (the JSON work happens inside the worker lambda, which already catches everything).
3. **`SmsPlugin.java`** – `new JSArray(...)` throws a checked `JSONException`; wrapped in try/catch.
4. Ran `npm ci` + `npx cap sync android` so `android/app/src/main/assets/public` contains the web layer.

## Prerequisites

- Node.js ≥ 18 and JDK **17** (AGP 8.2.1 requires it)
- Android SDK with `platforms;android-34`, `build-tools;34.0.0`, `platform-tools`
- Tell Gradle where the SDK is (either one):
  - create `android_app/android/local.properties` with `sdk.dir=/path/to/android-sdk`, or
  - export `ANDROID_HOME=/path/to/android-sdk`

On a fresh machine the SDK pieces can be installed with:

```bash
sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

## Build (verified — this exact sequence produces a working APK)

```bash
cd android_app
npm ci                 # installs Capacitor CLI + plugins
npx cap sync android   # copies www/ into the Android project
cd android
echo "sdk.dir=/path/to/android-sdk" > local.properties   # or export ANDROID_HOME
./gradlew assembleDebug        # -> app/build/outputs/apk/debug/app-debug.apk
# or install straight onto a connected device/emulator:
./gradlew installDebug
```

A prebuilt debug APK is checked in at `android_app/Shinakht-debug.apk` (≈4.5 MB).
It bundles the patient home, caregiver dashboard and games in one WebView shell —
a true all-in-one app. Install it directly on any Android phone
(Settings → allow unknown sources), then open **Settings** inside the app and point
it at your Flask server (e.g. `http://192.168.1.42:5000`). On an emulator the
default `http://10.0.2.2:5000` works with no configuration.

(Opening `android_app/android` in Android Studio and pressing Run works too.)

## Run the backend the app talks to

The app's web layer calls the Flask API. From the repo root:

```bash
pip install -r requirements.txt
python app.py            # serves on http://0.0.0.0:5000
```

## Pointing the app at the server

`www/native-bridge.js` defaults the API base to `http://10.0.2.2:5000`, which is how an
**Android emulator** reaches `localhost` on your dev machine — so the default works out of
the box for emulator testing (`emulator -avd <your-avd>` then `./gradlew installDebug`).

For a **physical phone**, the phone must reach your laptop over Wi-Fi:

1. Find your machine's LAN IP (e.g. `192.168.1.42`) and make sure port 5000 is open.
2. In the app (or via its settings), set `localStorage.shinakhtApiBase = "http://192.168.1.42:5000"`.
   Note: cleartext HTTP from WebView is allowed here because the API base is stored/read by
   `native-bridge.js` at runtime; if you ship a release build, put the server behind HTTPS.

## Quick smoke test

1. Start `python app.py` on the laptop.
2. Launch the app on the emulator → log in as the demo patient.
3. Enable location sharing (consent gate) — the “शिनाख्त safety tracking” foreground
   notification appears and `POST /api/update_location` pings keep flowing even with the screen off.
4. Trigger SOS — the native `Sms` plugin sends silently if permission granted, otherwise the
   system SMS composer opens as fallback.
