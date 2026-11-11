package com.nexusprime.identity;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Custom plugins: silent SOS SMS + background safety pings.
        registerPlugin(SmsPlugin.class);
        registerPlugin(NativeBridge.class);
        super.onCreate(savedInstanceState);
    }
}
