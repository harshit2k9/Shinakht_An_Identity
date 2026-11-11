/* Native bridge for the Capacitor Android wrapper of शिनाख्त (Shinakht).
   Everything degrades silently in a plain browser: this file only adds powers
   a web page cannot have on its own — notifications, background location pings,
   and a real SMS fallback for SOS. */
(function () {
  var C = window.Capacitor;
  if (!C || !C.isNativePlatform) return; // running as plain PWA – nothing to do

  var Plugins = C.Plugins || {};

  function apiBase() {
    // Unified resolution lives in common.js (localStorage override -> build default
    // in api-config.js -> emulator fallback). Fall back locally if common.js is absent.
    if (window.manovaApiBase) return window.manovaApiBase() || 'http://10.0.2.2:5000';
    var def = (typeof window.__SHINAKHT_API_BASE__ === 'string' && window.__SHINAKHT_API_BASE__)
      || 'http://10.0.2.2:5000';
    return localStorage.getItem('shinakhtApiBase') || def;
  }
  window.shinakhtApiBase = apiBase;

  function post(url, body) {
    // Route through window.fetch so common.js adds the token AND rewrites
    // relative /api/ URLs to the configured server for the APK origin.
    return window.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) { return r.json().catch(function () { return {}; }); });
  }

  /* Remember who is logged in so native background services can sign their pings. */
  /* home.html stores the consent flag as smritiLocationAllowed ("true"/"false"). */
  function hasLocationConsent() {
    return localStorage.getItem('smritiLocationAllowed') === 'true';
  }

  function syncNativeSession() {
    try {
      var Native = Plugins.Native;
      if (!Native || !Native.saveSession) return;
      var uid = Number(localStorage.getItem('manovaUserId') || localStorage.getItem('manovaUid') || 0);
      var token = localStorage.getItem('manovaToken') || '';
      if (!uid || !token) return;
      Native.saveSession({ uid: uid, token: token, apiBase: apiBase() });
      if (hasLocationConsent() && localStorage.getItem('shinakhtRole') === 'patient') {
        Native.startBackgroundPing(); // foreground service keeps pinging with the screen off
      }
    } catch (e) {}
  }

  try {
    var rawFetch = window.fetch.bind(window);
    window.fetch = function (url, opts) {
      return rawFetch(url, opts).then(function (res) {
        if (typeof url === 'string' && url.indexOf('/api/login') !== -1 && res.status === 200) {
          res.clone().json().then(function (d) {
            if (d && d.user_id) {
              localStorage.setItem('manovaUid', String(d.user_id));
              localStorage.setItem('shinakhtRole', d.role || '');
              syncNativeSession();
            }
          }).catch(function () {});
        }
        return res;
      });
    };
    syncNativeSession(); // already signed in from a previous launch
  } catch (e) {}

  /* ---------- 1. Push / local notifications for SOS + alerts ---------- */
  try {
    var Push = Plugins.PushNotifications;
    if (Push) {
      Push.requestPermission().then(function () {
        Push.register();
        Push.addListener('pushNotificationReceived', function (n) {
          notify(n.title || 'शिनाख्त', n.body || '');
        });
      });
      Push.addListener('pushNotificationActionReceived', function () {});
    }
  } catch (e) {}

  function notify(title, body) {
    try {
      var Local = Plugins.LocalNotifications;
      if (Local) {
        Local.requestPermission().then(function () {
          Local.schedule({ id: Date.now() % 100000, title: title, body: body });
        });
      }
    } catch (e) {}
  }

  /* ---------- 2. Location pings while the app is open, via native geolocation ----------
     A true always-on background service needs WorkManager/GeofencingClient (see
     MainActivity.java + LocationPingService.java in android/app/src/main/java).
     Here we use @capacitor/geolocation on a timer, which the OS keeps alive for
     a foregrounded app and is far more reliable than browser geolocation. */
  try {
    var Geo = Plugins.Geolocation;
    if (Geo) {
      Geo.requestPermissions().then(function () {
        setInterval(function () {
          // Consent gate: only ping while the patient has opted in on the Profile screen.
          if (!hasLocationConsent()) return;
          var uid = Number(localStorage.getItem('manovaUserId') || localStorage.getItem('manovaUid') || 0);
          if (!uid) return;
          Geo.getCurrentPosition({ enableHighAccuracy: false, timeout: 15000 })
            .then(function (pos) {
              post('/api/update_location', {
                user_id: uid,
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude
              }).then(function (res) {
                // Server refused (consent revoked there): mirror it locally and stop.
                if (res && res.status === 403) {
                  localStorage.setItem('smritiLocationAllowed', 'false');
                  try { if (Plugins.Native && Plugins.Native.stopBackgroundPing) Plugins.Native.stopBackgroundPing(); } catch (e) {}
                }
              });
            })
            .catch(function () {});
        }, 30000); // same cadence as the PWA tracker in home.html
      }).catch(function () {});
    }
  } catch (e) {}

  /* ---------- 3. SOS SMS fallback via the built-in native plugin ----------
     com.nexusprime.identity.SmsPlugin (registered in MainActivity.java) sends a
     real, silent SMS through SmsManager once SEND_SMS was granted. Capacitor
     exposes custom plugins on window.Capacitor.Plugins just like core ones. */
  window.shinakhtNativeSms = function (phones, message) {
    var Sms = Plugins.Sms;
    if (Sms && Sms.send) {
      return Sms.send({ phones: phones, message: message })
        .then(function (r) {
          if (r && r.sent) return r;
          if (r && r.needPermission) return composerFallback(phones[0], message);
          return r || { sent: true };
        })
        .catch(function () { return composerFallback(phones[0], message); });
    }
    return composerFallback(phones[0], message);
  };

  function composerFallback(phone, message) {
    try {
      window.location.href = 'smsto:' + phone + ':' + encodeURIComponent(message);
      return Promise.resolve({ sent: false, composer: true });
    } catch (e) { return Promise.resolve({ sent: false }); }
  }

  /* ---------- 5. Hardware back button returns to home instead of closing the app ---------- */
  try {
    var App = Plugins.App;
    if (App) {
      App.addListener('backButton', function () {
        var frame = document.getElementById('app');
        if (frame && frame.contentWindow && frame.contentWindow.location.pathname !== '/home.html') {
          frame.contentWindow.location.href = '/home.html';
        } else {
          App.exitApp();
        }
      });
    }
  } catch (e) {}

  /* ---------- 6. Network recovery: flush the offline outbox immediately ---------- */
  try {
    var Conn = Plugins.Network;
    if (Conn) {
      Conn.addListener('connectionChange', function (s) {
        if (s.connected && window.manovaFlush) window.manovaFlush();
      });
    }
  } catch (e) {}

  window.addEventListener('online', function () { if (window.manovaFlush) window.manovaFlush(); });
})();

  /* ---------- 7. Consent switch: honour "stop sharing" instantly ---------- */
  try {
    var _setItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function (k, v) {
      _setItem(k, v);
      if (k === 'shinakhtShareLocation' && v === 'off' && Plugins.Native && Plugins.Native.stopBackgroundPing) {
        Plugins.Native.stopBackgroundPing();
      }
    };
  } catch (e) {}
