package com.nexusprime.identity;

import android.Manifest;
import android.app.PendingIntent;
import android.content.Intent;
import android.telephony.SmsManager;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;

/**
 * SOS SMS fallback that never fails silently.
 * JS side (native-bridge.js) calls Plugins.Sms.send({phones:[...], message:"..."}).
 * With SEND_SMS granted we send straight through SmsManager; if the user denies
 * the permission we return needPermission=true and the web layer opens the
 * system SMS composer instead, so the alert still goes out with one tap.
 */
@CapacitorPlugin(
    name = "Sms",
    permissions = {
        @Permission(strings = { Manifest.permission.SEND_SMS }, alias = "sms")
    }
)
public class SmsPlugin extends Plugin {

    @PluginMethod
    public void send(PluginCall call) {
        if (getPermissionState("sms") != PermissionState.GRANTED) {
            requestPermissionForAlias("sms", call, "smsPermissionCallback");
            return;
        }
        doSend(call);
    }

    @PermissionCallback
    private void smsPermissionCallback(PluginCall call) {
        if (getPermissionState("sms") == PermissionState.GRANTED) {
            doSend(call);
        } else {
            JSObject ret = new JSObject();
            ret.put("sent", false);
            ret.put("needPermission", true);
            call.resolve(ret);
        }
    }

    private void doSend(PluginCall call) {
        JSArray phones = call.getArray("phones");
        String message = call.getString("message", "SOS from शिनाख्त");
        ArrayList<String> sentTo = new ArrayList<>();
        try {
            SmsManager sms = SmsManager.getDefault();
            if (phones != null) {
                for (int i = 0; i < phones.length(); i++) {
                    String number = phones.getString(i);
                    if (number == null || number.trim().isEmpty()) continue;
                    // splitMessage keeps long alerts intact on 2G/modem limits
                    ArrayList<String> parts = sms.divideMessage(message);
                    ArrayList<PendingIntent> intents = new ArrayList<>();
                    for (int p = 0; p < parts.size(); p++) {
                        intents.add(PendingIntent.getBroadcast(
                            getContext(), 0, new Intent("com.nexusprime.identity.SMS_SENT"),
                            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
                    }
                    sms.sendMultipartTextMessage(number.trim(), null, parts, intents, null);
                    sentTo.add(number.trim());
                }
            }
        } catch (Exception e) {
            call.reject("sms failed: " + e.getMessage());
            return;
        }
        JSObject ret = new JSObject();
        ret.put("sent", !sentTo.isEmpty());
        try {
            ret.put("to", new JSArray(sentTo.toArray()));
        } catch (org.json.JSONException e) {
            // non-fatal: 'sent' flag already tells the JS layer what happened
        }
        call.resolve(ret);
    }
}
