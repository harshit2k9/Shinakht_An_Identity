/* ============================================================
   Shinakht — server address for the APK build
   ============================================================
   The WebView inside the APK is served from capacitor://localhost,
   so relative /api/ calls would never reach Flask. This file sets the
   default backend URL baked into the build.

   EDIT THIS BEFORE BUILDING FOR A REAL PHONE:
     window.__SHINAKHT_API_BASE__ = "https://your-server-ip-or-domain:5000";

   Leave it empty ("") to fall back to http://10.0.2.2:5000, which is how
   an Android EMULATOR reaches Flask running on your development machine.

   Users can also override this at runtime in the app's Settings screen
   (stored as localStorage.shinakhtApiBase); that override always wins.
   ============================================================ */
window.__SHINAKHT_API_BASE__ = "";
