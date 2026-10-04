package com.flashcardcatalog.app;

import android.content.Intent;
import android.media.AudioAttributes;
import android.os.Handler;
import android.os.Looper;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.function.Consumer;

/** Android speech with explicit readiness, cancellation and failed-request handling. */
@CapacitorPlugin(name = "CatalogSpeech")
public class CatalogSpeechPlugin extends Plugin {
    private final Handler main = new Handler(Looper.getMainLooper());
    private final List<ReadyCall> waiting = new ArrayList<>();
    private TextToSpeech engine;
    private boolean ready;
    private boolean destroyed;
    private int generation;
    private PluginCall speaking;
    private String utteranceId;
    private Runnable playbackTimeout;

    private static class ReadyCall {
        final PluginCall call;
        final Consumer<TextToSpeech> action;
        final boolean playback;
        ReadyCall(PluginCall call, Consumer<TextToSpeech> action, boolean playback) {
            this.call = call; this.action = action; this.playback = playback;
        }
    }

    // Overridable only to exercise the real bridge against a controlled engine in tests.
    protected TextToSpeech createEngine(TextToSpeech.OnInitListener listener) {
        return new TextToSpeech(getContext(), listener);
    }

    @Override public void load() { main.post(this::initialize); }

    private void initialize() {
        if (destroyed || engine != null) return;
        final int attempt = ++generation;
        try {
            engine = createEngine(status -> main.post(() -> {
                if (attempt != generation || destroyed) return;
                if (status != TextToSpeech.SUCCESS) { initializationFailed(); return; }
                engine.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                    @Override public void onStart(String id) { main.post(() -> {
                        if (id.equals(utteranceId) && playbackTimeout != null) {
                            main.removeCallbacks(playbackTimeout);
                            main.postDelayed(playbackTimeout, 60000);
                        }
                    }); }
                    @Override public void onDone(String id) { main.post(() -> finish(id, null)); }
                    @Override public void onError(String id) { onError(id, TextToSpeech.ERROR); }
                    @Override public void onError(String id, int code) {
                        main.post(() -> finish(id, code == TextToSpeech.ERROR_NOT_INSTALLED_YET
                            ? "NO_VOICE" : "PLAYBACK_ERROR"));
                    }
                    @Override public void onStop(String id, boolean interrupted) {
                        main.post(() -> finish(id, "CANCELED"));
                    }
                });
                engine.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build());
                ready = true;
                List<ReadyCall> pending = new ArrayList<>(waiting);
                waiting.clear();
                for (ReadyCall operation : pending) run(operation);
            }));
            main.postDelayed(() -> {
                if (attempt == generation && !ready && !destroyed) initializationFailed();
            }, 10000);
        } catch (Exception e) { initializationFailed(); }
    }

    private void initializationFailed() {
        ++generation;
        ready = false;
        if (engine != null) { engine.shutdown(); engine = null; }
        for (ReadyCall operation : waiting) operation.call.reject("Android speech engine is unavailable.", "ENGINE_UNAVAILABLE");
        waiting.clear();
    }

    private void whenReady(PluginCall call, Consumer<TextToSpeech> action, boolean playback) {
        main.post(() -> {
            if (destroyed) { call.reject("Speech was stopped.", "CANCELED"); return; }
            ReadyCall operation = new ReadyCall(call, action, playback);
            if (ready) run(operation);
            else { waiting.add(operation); initialize(); }
        });
    }

    private void run(ReadyCall operation) {
        try { operation.action.accept(engine); }
        catch (Exception e) {
            if (speaking == operation.call) finish(utteranceId, "PLAYBACK_ERROR");
            else operation.call.reject("Android speech engine failed.", "ENGINE_UNAVAILABLE");
        }
    }

    static List<Voice> installedVoices(Set<Voice> voices) {
        List<Voice> result = new ArrayList<>();
        if (voices != null) for (Voice voice : voices) {
            if (voice.getFeatures() == null || !voice.getFeatures().contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED)) result.add(voice);
        }
        result.sort(Comparator.comparing(Voice::getName));
        return result;
    }

    static Voice chooseVoice(List<Voice> voices, Locale locale, String preferred) {
        return voices.stream().filter(v -> v.getLocale().getLanguage().equals(locale.getLanguage()))
            .min(Comparator.comparingInt((Voice v) ->
                (v.isNetworkConnectionRequired() ? 10 : 0)
                + (v.getLocale().equals(locale) ? 0 : 2)
                + (preferred != null && preferred.equals(v.getName()) ? 0 : 1)))
            .orElse(null);
    }

    @PluginMethod public void getSupportedVoices(PluginCall call) {
        whenReady(call, tts -> {
            JSArray result = new JSArray();
            for (Voice voice : installedVoices(tts.getVoices())) {
                JSObject v = new JSObject();
                v.put("lang", voice.getLocale().toLanguageTag());
                v.put("name", voice.getName());
                v.put("voiceURI", voice.getName());
                v.put("localService", !voice.isNetworkConnectionRequired());
                v.put("default", voice.equals(tts.getVoice()));
                result.put(v);
            }
            JSObject resultObject = new JSObject(); resultObject.put("voices", result); call.resolve(resultObject);
        }, false);
    }

    @PluginMethod public void isLanguageSupported(PluginCall call) {
        whenReady(call, tts -> {
            int status = tts.isLanguageAvailable(Locale.forLanguageTag(call.getString("lang", "en-US")));
            JSObject result = new JSObject(); result.put("supported", status >= TextToSpeech.LANG_AVAILABLE); call.resolve(result);
        }, false);
    }

    @PluginMethod public void speak(PluginCall call) {
        whenReady(call, tts -> {
            cancelPlayback();
            Locale locale = Locale.forLanguageTag(call.getString("lang", "en-US"));
            int language = tts.setLanguage(locale);
            if (language < TextToSpeech.LANG_AVAILABLE) {
                call.reject("Install a voice for this language in Android's speech settings.", "NO_VOICE"); return;
            }
            Voice voice = chooseVoice(installedVoices(tts.getVoices()), locale, call.getString("voiceName"));
            if (voice != null && tts.setVoice(voice) != TextToSpeech.SUCCESS) {
                // Keep the engine's own language default if an advertised voice rejects selection.
                if (tts.setLanguage(locale) < TextToSpeech.LANG_AVAILABLE) {
                    call.reject("This language is unavailable.", "NO_VOICE"); return;
                }
            }
            tts.setSpeechRate(call.getFloat("rate", 0.85f));
            tts.setPitch(call.getFloat("pitch", 1.0f));
            Bundle params = new Bundle(); params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, 1.0f);
            speaking = call;
            utteranceId = call.getCallbackId();
            String id = utteranceId;
            playbackTimeout = () -> {
                if (id.equals(utteranceId)) { finish(id, "PLAYBACK_TIMEOUT"); tts.stop(); }
            };
            main.postDelayed(playbackTimeout, 15000);
            // ERROR can be returned without ever delivering an utterance callback.
            int status = tts.speak(call.getString("text", ""), TextToSpeech.QUEUE_FLUSH, params, id);
            if (status != TextToSpeech.SUCCESS) finish(id, "PLAYBACK_ERROR");
        }, true);
    }

    private void finish(String id, String error) {
        if (speaking == null || !id.equals(utteranceId)) return;
        PluginCall call = speaking;
        speaking = null; utteranceId = null;
        if (playbackTimeout != null) main.removeCallbacks(playbackTimeout);
        if (error == null) call.resolve();
        else call.reject("Android could not play the pronunciation.", error);
    }

    private void cancelPlayback() {
        if (speaking != null) finish(utteranceId, "CANCELED");
        if (ready && engine != null) engine.stop();
    }

    @PluginMethod public void stop(PluginCall call) {
        main.post(() -> {
            cancelPlayback();
            waiting.removeIf(operation -> {
                if (operation.playback) operation.call.reject("Speech was stopped.", "CANCELED");
                return operation.playback;
            });
            call.resolve();
        });
    }

    @PluginMethod public void openInstall(PluginCall call) {
        main.post(() -> {
            try {
                Intent intent = new Intent("com.android.settings.TTS_SETTINGS");
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
                call.resolve();
            } catch (Exception e) { call.reject("Open Android Settings and search for text-to-speech.", "SETTINGS_UNAVAILABLE"); }
        });
    }

    @Override protected void handleOnDestroy() {
        main.post(() -> {
            destroyed = true;
            cancelPlayback();
            initializationFailed();
        });
    }
}
