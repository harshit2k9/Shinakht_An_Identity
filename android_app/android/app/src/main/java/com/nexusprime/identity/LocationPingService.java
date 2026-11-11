package com.nexusprime.identity;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Foreground service that keeps sending safety pings to POST /api/update_location
 * even when the app is in the background or the screen is off — the part a browser
 * PWA cannot guarantee. Consent is enforced again on the server (403 stops us),
 * but the client also refuses to start unless the patient opted in.
 * Reads token/userId/apiBase from SharedPreferences written by native-bridge.js.
 */
public class LocationPingService extends Service implements LocationListener {

    public static final String CHANNEL_ID = "shinakht_safety";
    private ExecutorService worker;
    private LocationManager lm;
    private volatile boolean running = false;

    @Override
    public void onCreate() {
        super.onCreate();
        worker = Executors.newSingleThreadExecutor();
        lm = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        startForegroundNotification();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (!running) {
            try {
                lm.requestLocationUpdates(LocationManager.PASSIVE_PROVIDER, 30_000L, 0f, this);
                running = true;
            } catch (SecurityException e) {
                Log.w("ShinakhtPing", "no location permission", e);
            }
        }
        return START_STICKY;
    }

    @Override
    public void onLocationChanged(Location loc) {
        ping(loc.getLatitude(), loc.getLongitude());
    }

    private void ping(final double lat, final double lng) {
        worker.execute(() -> {
            try {
                android.content.SharedPreferences prefs =
                    getSharedPreferences("shinakht_native", Context.MODE_PRIVATE);
                String base = prefs.getString("api_base", "http://10.0.2.2:5000");
                String token = prefs.getString("token", "");
                int uid = prefs.getInt("uid", 0);
                if (uid == 0 || token.isEmpty()) return;
                JSONObject body = new JSONObject();
                body.put("user_id", uid);
                body.put("latitude", lat);
                body.put("longitude", lng);
                HttpURLConnection c = (HttpURLConnection) new URL(base + "/api/update_location").openConnection();
                c.setRequestMethod("POST");
                c.setRequestProperty("Content-Type", "application/json");
                c.setRequestProperty("Authorization", "Bearer " + token);
                c.setDoOutput(true);
                c.setConnectTimeout(10_000);
                try (OutputStream os = c.getOutputStream()) {
                    os.write(body.toString().getBytes(StandardCharsets.UTF_8));
                }
                int code = c.getResponseCode();
                if (code == 403) { // consent revoked server-side: stop politely
                    stopSelf();
                }
            } catch (Exception ignored) {
                // offline: next fix retries; Locations are best-effort trail data
            }
        });
    }

    private void startForegroundNotification() {
        NotificationManager nm = getSystemService(NotificationManager.class);
        NotificationChannel ch = new NotificationChannel(
            CHANNEL_ID, "Safety tracking", NotificationManager.IMPORTANCE_LOW);
        nm.createNotificationChannel(ch);
        Notification n = new Notification.Builder(this, CHANNEL_ID)
            .setContentTitle("शिनाख्त safety tracking")
            .setContentText("Location sharing is active for your caregivers.")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .build();
        startForeground(2, n);
    }

    @Override
    public void onProviderEnabled(String provider) {}
    @Override
    public void onProviderDisabled(String provider) {}
    @Override
    @Deprecated
    public void onStatusChanged(String provider, int status, Bundle extras) {}

    @Override
    public void onDestroy() {
        if (lm != null && running) lm.removeUpdates(this);
        running = false;
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }
}
