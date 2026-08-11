package com.flashcardcatalog.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Local plugins aren't auto-discovered the way installed ones are, so
        // this registration is what makes the AnkiDroid bridge exist at all.
        registerPlugin(AnkiDroidPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
