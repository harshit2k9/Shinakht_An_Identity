package com.nexusprime.identity;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Small native helper exposed to native-bridge.js as Plugins.Native:
 *  - saveSession(uid, token, apiBase) -> SharedPreferences for LocationPingService
 *  - startBackgroundPing() / stopBackgroundPing() -> foreground service control
 */
@CapacitorPlugin(name = "Native")
public class NativeBridge extends Plugin {

    @PluginMethod
    public void saveSession(PluginCall call) {
        SharedPreferences prefs = getContext()
            .getSharedPreferences("shinakht_native", android.content.Context.MODE_PRIVATE);
        prefs.edit()
            .putInt("uid", call.getInt("uid", 0))
            .putString("token", call.getString("token", ""))
            .putString("api_base", call.getString("apiBase", "http://10.0.2.2:5000"))
            .apply();
        call.resolve();
    }

    @PluginMethod
    public void startBackgroundPing(PluginCall call) {
        Intent i = new Intent(getContext(), LocationPingService.class);
        if (Build.VERSION.SDK_INT >= 26) getContext().startForegroundService(i);
        else getContext().startService(i);
        call.resolve();
    }

    @PluginMethod
    public void stopBackgroundPing(PluginCall call) {
        getContext().stopService(new Intent(getContext(), LocationPingService.class));
        JSObject ret = new JSObject();
        ret.put("stopped", true);
        call.resolve(ret);
    }
}
