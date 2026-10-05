package com.flashcardcatalog.app;

import android.content.Intent;
import android.media.AudioAttributes;
import android.os.Handler;
import android.os.HandlerThread;
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
import java.util.Objects;
import java.util.Set;
import java.util.function.Consumer;
import java.util.concurrent.atomic.AtomicInteger;

/** Android speech with explicit readiness, cancellation and failed-request handling. */
@CapacitorPlugin(name = "CatalogSpeech")
public class CatalogSpeechPlugin extends Plugin {
    private final Handler main = new Handler(Looper.getMainLooper());
    private HandlerThread speechThread;
    private Handler worker;
    // Updated at bridge entry, so stop/navigation can cancel even while a
    // slow voice model is still loading on the worker.
    private final AtomicInteger playbackGeneration = new AtomicInteger();
    private final List<ReadyCall> waiting = new ArrayList<>();
    private TextToSpeech engine;
    private boolean ready;
    private boolean destroyed;
    private int generation;
    private PluginCall speaking;
    private String utteranceId;
    private Runnable playbackTimeout;
    private Locale configuredLocale;
    private String configuredVoice;
    private Float configuredRate, configuredPitch;

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

    // Voice selection makes synchronous engine IPC calls. Keep the entire TTS
    // state on one serial worker so these calls cannot freeze the WebView/UI.
    protected Handler createSpeechHandler() {
        speechThread = new HandlerThread("CatalogSpeech");
        speechThread.start();
        return new Handler(speechThread.getLooper());
    }

    @Override public void load() {
        worker = createSpeechHandler();
        worker.post(this::initialize);
    }

    private void initialize() {
        if (destroyed || engine != null) return;
        final int attempt = ++generation;
        try {
            engine = createEngine(status -> worker.post(() -> {
                if (attempt != generation || destroyed) return;
                if (status != TextToSpeech.SUCCESS) { initializationFailed(); return; }
                engine.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                    @Override public void onStart(String id) { worker.post(() -> {
                        if (id.equals(utteranceId) && playbackTimeout != null) {
                            worker.removeCallbacks(playbackTimeout);
                            worker.postDelayed(playbackTimeout, 60000);
                        }
                    }); }
                    @Override public void onDone(String id) { worker.post(() -> finish(id, null)); }
                    @Override public void onError(String id) { onError(id, TextToSpeech.ERROR); }
                    @Override public void onError(String id, int code) {
                        worker.post(() -> finish(id, code == TextToSpeech.ERROR_NOT_INSTALLED_YET
                            ? "NO_VOICE" : "PLAYBACK_ERROR"));
                    }
                    @Override public void onStop(String id, boolean interrupted) {
                        worker.post(() -> finish(id, "CANCELED"));
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
            worker.postDelayed(() -> {
                if (attempt == generation && !ready && !destroyed) initializationFailed();
            }, 10000);
        } catch (Exception e) { initializationFailed(); }
    }

    private void initializationFailed() {
        ++generation;
        ready = false;
        invalidateConfiguration();
        if (engine != null) { engine.shutdown(); engine = null; }
        for (ReadyCall operation : waiting) operation.call.reject("Android speech engine is unavailable.", "ENGINE_UNAVAILABLE");
        waiting.clear();
    }

    private void whenReady(PluginCall call, Consumer<TextToSpeech> action, boolean playback) {
        worker.post(() -> {
            if (destroyed) { call.reject("Speech was stopped.", "CANCELED"); return; }
            ReadyCall operation = new ReadyCall(call, action, playback);
            if (ready) run(operation);
            else {
                if (playback) waiting.removeIf(previous -> {
                    if (previous.playback) previous.call.reject("Speech was replaced.", "CANCELED");
                    return previous.playback;
                });
                waiting.add(operation); initialize();
            }
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

    private void invalidateConfiguration() {
        configuredLocale = null; configuredVoice = null;
        configuredRate = null; configuredPitch = null;
    }

    @PluginMethod public void prepare(PluginCall call) {
        whenReady(call, tts -> call.resolve(), false);
    }

    @PluginMethod public void getSupportedVoices(PluginCall call) {
        whenReady(call, tts -> {
            JSArray result = new JSArray();
            Voice currentVoice = tts.getVoice();
            for (Voice voice : installedVoices(tts.getVoices())) {
                JSObject v = new JSObject();
                v.put("lang", voice.getLocale().toLanguageTag());
                v.put("name", voice.getName());
                v.put("voiceURI", voice.getName());
                v.put("localService", !voice.isNetworkConnectionRequired());
                v.put("default", voice.equals(currentVoice));
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
        final int token = playbackGeneration.incrementAndGet();
        whenReady(call, tts -> {
            if (token != playbackGeneration.get()) {
                call.reject("Speech was replaced.", "CANCELED"); return;
            }
            cancelPlayback();
            Locale locale = Locale.forLanguageTag(call.getString("lang", "en-US"));
            String preferred = call.getString("voiceName");
            // setLanguage resets the engine's selected voice. Reusing it avoids
            // repeatedly loading a voice model for consecutive vocabulary words.
            if (!locale.equals(configuredLocale) || !Objects.equals(preferred, configuredVoice)) {
                invalidateConfiguration();
                Voice voice = chooseVoice(installedVoices(tts.getVoices()), locale, preferred);
                // Selecting an installed matching voice also selects its language.
                // Avoid loading a default voice only to replace it immediately.
                if (voice == null || tts.setVoice(voice) != TextToSpeech.SUCCESS) {
                    // Engines without a voice list can still provide a language default.
                    if (tts.setLanguage(locale) < TextToSpeech.LANG_AVAILABLE) {
                        call.reject("Install a voice for this language in Android's speech settings.", "NO_VOICE"); return;
                    }
                }
                configuredLocale = locale; configuredVoice = preferred;
            }
            Float rate = call.getFloat("rate", 0.85f), pitch = call.getFloat("pitch", 1.0f);
            if (!rate.equals(configuredRate) && tts.setSpeechRate(rate) == TextToSpeech.SUCCESS) configuredRate = rate;
            if (!pitch.equals(configuredPitch) && tts.setPitch(pitch) == TextToSpeech.SUCCESS) configuredPitch = pitch;
            // Voice selection can block in an engine IPC call. Never speak an
            // obsolete word after that call returns.
            if (token != playbackGeneration.get()) {
                call.reject("Speech was stopped.", "CANCELED"); return;
            }
            Bundle params = new Bundle(); params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, 1.0f);
            speaking = call;
            utteranceId = call.getCallbackId();
            String id = utteranceId;
            playbackTimeout = () -> {
                if (id.equals(utteranceId)) { finish(id, "PLAYBACK_TIMEOUT"); tts.stop(); }
            };
            worker.postDelayed(playbackTimeout, 15000);
            // ERROR can be returned without ever delivering an utterance callback.
            int status = tts.speak(call.getString("text", ""), TextToSpeech.QUEUE_FLUSH, params, id);
            if (status != TextToSpeech.SUCCESS) finish(id, "PLAYBACK_ERROR");
        }, true);
    }

    private void finish(String id, String error) {
        if (speaking == null || !id.equals(utteranceId)) return;
        PluginCall call = speaking;
        speaking = null; utteranceId = null;
        if (playbackTimeout != null) worker.removeCallbacks(playbackTimeout);
        if (error == null) call.resolve();
        else {
            if (!"CANCELED".equals(error)) invalidateConfiguration();
            call.reject("Android could not play the pronunciation.", error);
        }
    }

    private void cancelPlayback() {
        if (speaking != null) {
            finish(utteranceId, "CANCELED");
            if (ready && engine != null) engine.stop();
        }
    }

    @PluginMethod public void stop(PluginCall call) {
        playbackGeneration.incrementAndGet();
        worker.post(() -> {
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
        playbackGeneration.incrementAndGet();
        worker.post(() -> {
            destroyed = true;
            cancelPlayback();
            initializationFailed();
            worker.removeCallbacksAndMessages(null);
            if (speechThread != null) speechThread.quitSafely();
        });
    }

    @Override protected void handleOnResume() {
        // A voice may have been installed or changed while Android Settings was open.
        worker.post(this::invalidateConfiguration);
    }
}
