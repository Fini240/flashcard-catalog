package com.flashcardcatalog.app;

import android.os.Bundle;

import androidx.webkit.WebSettingsCompat;
import androidx.webkit.WebViewFeature;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Local plugins aren't auto-discovered the way installed ones are, so
        // this registration is what makes the AnkiDroid bridge exist at all.
        registerPlugin(AnkiDroidPlugin.class);
        super.onCreate(savedInstanceState);

        // For apps targeting SDK 33 and up, the WebView reports
        // prefers-color-scheme: dark only if the app opts into dark theming.
        // Without this the automatic setting would be stuck on light no matter
        // what the phone is set to — the activity theme is already DayNight, so
        // this is the only missing half.
        //
        // It does not hand the WebView licence to invert our colours: the page
        // declares `color-scheme: light dark` (src/index.css), which tells it
        // the page themes itself and only the media query is wanted.
        if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
            WebSettingsCompat.setAlgorithmicDarkeningAllowed(getBridge().getWebView().getSettings(), true);
        }
    }
}
