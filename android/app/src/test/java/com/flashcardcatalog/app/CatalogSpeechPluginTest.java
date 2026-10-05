package com.flashcardcatalog.app;

import static org.junit.Assert.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.robolectric.Shadows.shadowOf;

import android.content.Context;
import android.media.AudioAttributes;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;
import java.time.Duration;
import java.util.Collections;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.Before;
import org.junit.After;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.ArgumentCaptor;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;
import org.robolectric.annotation.LooperMode;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 34, manifest = Config.NONE)
@LooperMode(LooperMode.Mode.PAUSED)
public class CatalogSpeechPluginTest {
    private TextToSpeech engine;
    private TestPlugin plugin;

    private class TestPlugin extends CatalogSpeechPlugin {
        TextToSpeech.OnInitListener initialization;
        Handler speechHandler;
        boolean shutdownRequested;
        @Override protected void handleOnDestroy() {
            shutdownRequested = true; super.handleOnDestroy();
        }
        @Override protected Handler createSpeechHandler() {
            speechHandler = super.createSpeechHandler();
            return speechHandler;
        }
        @Override public Context getContext() { return RuntimeEnvironment.getApplication(); }
        @Override protected TextToSpeech createEngine(TextToSpeech.OnInitListener listener) {
            initialization = listener; return engine;
        }
    }

    @Before public void setup() {
        engine = mock(TextToSpeech.class);
        when(engine.setLanguage(any())).thenReturn(TextToSpeech.LANG_COUNTRY_AVAILABLE);
        when(engine.isLanguageAvailable(any())).thenReturn(TextToSpeech.LANG_COUNTRY_AVAILABLE);
        when(engine.getVoices()).thenReturn(Collections.emptySet());
        when(engine.speak(any(CharSequence.class), anyInt(), any(Bundle.class), anyString())).thenReturn(TextToSpeech.SUCCESS);
        plugin = new TestPlugin();
        plugin.load(); idle();
    }

    @After public void cleanup() {
        if (!plugin.shutdownRequested) { plugin.handleOnDestroy(); idle(); }
    }

    private void idle() {
        shadowOf(plugin.speechHandler.getLooper()).idle();
        shadowOf(Looper.getMainLooper()).idle();
    }
    private void advance(Duration duration) { shadowOf(plugin.speechHandler.getLooper()).idleFor(duration); }
    private void ready() { plugin.initialization.onInit(TextToSpeech.SUCCESS); idle(); }
    private PluginCall call(String id) {
        PluginCall call = mock(PluginCall.class);
        when(call.getCallbackId()).thenReturn(id);
        when(call.getString("lang", "en-US")).thenReturn("es-ES");
        when(call.getString("text", "")).thenReturn("el campamento");
        when(call.getFloat("rate", 0.85f)).thenReturn(0.85f);
        when(call.getFloat("pitch", 1.0f)).thenReturn(1.0f);
        return call;
    }
    private UtteranceProgressListener listener() {
        ArgumentCaptor<UtteranceProgressListener> captor = ArgumentCaptor.forClass(UtteranceProgressListener.class);
        verify(engine).setOnUtteranceProgressListener(captor.capture()); return captor.getValue();
    }

    @Test public void coldVoiceQueryWaitsForInitialization() {
        PluginCall call = call("voices"); plugin.getSupportedVoices(call); idle();
        verify(engine, never()).getVoices(); verify(call, never()).resolve(any(JSObject.class));
        ready(); verify(call).resolve(any(JSObject.class));
    }

    @Test public void firstTapWaitsThenSpeaksOnMediaStream() {
        PluginCall call = call("first"); plugin.speak(call); idle();
        verify(engine, never()).setLanguage(any());
        ready();
        verify(engine).speak(eq("el campamento"), eq(TextToSpeech.QUEUE_FLUSH), any(Bundle.class), eq("first"));
        ArgumentCaptor<AudioAttributes> audio = ArgumentCaptor.forClass(AudioAttributes.class);
        verify(engine).setAudioAttributes(audio.capture());
        assertEquals(AudioAttributes.USAGE_MEDIA, audio.getValue().getUsage());
        listener().onDone("first"); idle(); verify(call).resolve();
    }

    @Test public void immediateEngineFailureRejectsInsteadOfLeavingStopSquareForever() {
        ready(); when(engine.speak(any(CharSequence.class), anyInt(), any(Bundle.class), anyString())).thenReturn(TextToSpeech.ERROR);
        PluginCall call = call("failed"); plugin.speak(call); idle();
        verify(call).reject(anyString(), eq("PLAYBACK_ERROR"));
        advance(Duration.ofSeconds(61));
        verify(call, times(1)).reject(anyString(), anyString());
    }

    @Test public void thrownEngineFailureRejectsOnlyOnce() {
        ready(); when(engine.speak(any(CharSequence.class), anyInt(), any(Bundle.class), anyString())).thenThrow(new IllegalStateException("engine died"));
        PluginCall call = call("thrown"); plugin.speak(call); idle();
        verify(call).reject(anyString(), eq("PLAYBACK_ERROR"));
        advance(Duration.ofSeconds(61));
        verify(call, times(1)).reject(anyString(), anyString());
    }

    @Test public void missingLanguageIsReportedWithoutQueuingSilentSpeech() {
        ready(); when(engine.setLanguage(any())).thenReturn(TextToSpeech.LANG_MISSING_DATA);
        PluginCall call = call("missing"); plugin.speak(call); idle();
        verify(call).reject(anyString(), eq("NO_VOICE"));
        verify(engine, never()).speak(any(CharSequence.class), anyInt(), any(Bundle.class), anyString());
    }

    @Test public void prefersInstalledOfflineVoiceToAnAdvertisedDownloadOrNetworkVoice() {
        Voice missing = new Voice("a-missing", Locale.forLanguageTag("es-ES"), 300, 100, false, Set.of(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED));
        Voice network = new Voice("b-network", Locale.forLanguageTag("es-ES"), 300, 100, true, Set.of());
        Voice offline = new Voice("c-local", Locale.forLanguageTag("es-MX"), 300, 100, false, Set.of());
        when(engine.getVoices()).thenReturn(Set.of(missing, network, offline));
        ready(); plugin.speak(call("offline")); idle(); verify(engine).setVoice(offline);
        assertFalse(CatalogSpeechPlugin.installedVoices(Set.of(missing, network, offline)).contains(missing));
    }

    @Test public void neverSelectsAnotherLanguageAsFallback() {
        Voice german = new Voice("de-local", Locale.GERMAN, 300, 100, false, Set.of());
        assertNull(CatalogSpeechPlugin.chooseVoice(java.util.List.of(german), Locale.forLanguageTag("es-ES"), null));
    }

    @Test public void absentVoiceListStillAllowsEnginesOwnSupportedLanguageDefault() {
        ready(); when(engine.getVoices()).thenReturn(null);
        plugin.speak(call("default")); idle();
        verify(engine, never()).setVoice(any());
        verify(engine).speak(any(CharSequence.class), anyInt(), any(Bundle.class), eq("default"));
    }

    @Test public void stopDuringInitializationPreventsDelayedPlayback() {
        PluginCall speech = call("pending"); plugin.speak(speech); idle();
        plugin.stop(call("stop")); idle(); ready();
        verify(speech).reject(anyString(), eq("CANCELED"));
        verify(engine, never()).speak(any(CharSequence.class), anyInt(), any(Bundle.class), anyString());
    }

    @Test public void lateCallbackFromCanceledWordCannotFinishNewWord() {
        ready(); PluginCall first = call("one"), second = call("two");
        plugin.speak(first); idle(); plugin.speak(second); idle();
        verify(first).reject(anyString(), eq("CANCELED"));
        listener().onDone("one"); idle(); verify(second, never()).resolve();
        listener().onDone("two"); idle(); verify(second).resolve();
    }

    @Test public void engineThatNeverInitializesFailsWithinBoundedTime() {
        PluginCall call = call("not-ready"); plugin.speak(call); idle();
        advance(Duration.ofSeconds(11));
        verify(call).reject(anyString(), eq("ENGINE_UNAVAILABLE")); verify(engine).shutdown();
        plugin.initialization.onInit(TextToSpeech.SUCCESS); idle();
        verify(engine, never()).speak(any(CharSequence.class), anyInt(), any(Bundle.class), anyString());
    }

    @Test public void noStartCallbackTimesOutAndStopsEngine() {
        ready(); PluginCall call = call("silent"); plugin.speak(call); idle();
        clearInvocations(engine);
        advance(Duration.ofSeconds(16));
        verify(call).reject(anyString(), eq("PLAYBACK_TIMEOUT")); verify(engine).stop();
    }

    @Test public void startedLongAnswerHasTimeToFinish() {
        ready(); PluginCall call = call("long"); plugin.speak(call); idle(); listener().onStart("long"); idle();
        advance(Duration.ofSeconds(16));
        verify(call, never()).reject(anyString(), anyString());
        listener().onDone("long"); idle(); verify(call).resolve();
    }

    @Test public void missingDataCallbackReleasesRequestWithVoiceError() {
        ready(); PluginCall call = call("data"); plugin.speak(call); idle();
        listener().onError("data", TextToSpeech.ERROR_NOT_INSTALLED_YET); idle();
        verify(call).reject(anyString(), eq("NO_VOICE"));
    }

    @Test public void voiceSettingsOpensSystemTextToSpeechSettings() {
        PluginCall call = call("settings"); plugin.openInstall(call); idle();
        assertEquals("com.android.settings.TTS_SETTINGS", shadowOf(RuntimeEnvironment.getApplication()).getNextStartedActivity().getAction());
        verify(call).resolve();
    }

    @Test public void warmupWaitsForEngineWithoutPlayingOrLoadingVoiceLists() {
        PluginCall warmup = call("warmup"); plugin.prepare(warmup); idle();
        verify(warmup, never()).resolve(); ready(); verify(warmup).resolve();
        verify(engine, never()).getVoices();
        verify(engine, never()).speak(any(CharSequence.class), anyInt(), any(Bundle.class), anyString());
    }

    @Test public void consecutiveWordsReuseVoiceWithoutResettingEngineOrStoppingIdleAudio() {
        Voice voice = new Voice("es-local", Locale.forLanguageTag("es-ES"), 300, 100, false, Set.of());
        when(engine.getVoices()).thenReturn(Set.of(voice)); ready();
        plugin.speak(call("one")); idle(); listener().onDone("one"); idle();
        plugin.speak(call("two")); idle();
        verify(engine, never()).setLanguage(any()); verify(engine, times(1)).getVoices();
        verify(engine, times(1)).setVoice(voice); verify(engine, times(1)).setSpeechRate(0.85f);
        verify(engine, times(1)).setPitch(1.0f); verify(engine, never()).stop();
        verify(engine, times(2)).speak(any(CharSequence.class), eq(TextToSpeech.QUEUE_FLUSH), any(Bundle.class), anyString());
    }

    @Test public void changingLanguageAndRateReconfiguresThenReturningFromSettingsRefreshesVoice() {
        ready(); plugin.speak(call("spanish")); idle(); listener().onDone("spanish"); idle();
        PluginCall german = call("german");
        when(german.getString("lang", "en-US")).thenReturn("de-DE");
        when(german.getFloat("rate", 0.85f)).thenReturn(1.1f);
        plugin.speak(german); idle();
        verify(engine).setLanguage(Locale.forLanguageTag("de-DE")); verify(engine).setSpeechRate(1.1f);
        listener().onDone("german"); idle(); plugin.handleOnResume(); idle();
        PluginCall again = call("german-again");
        when(again.getString("lang", "en-US")).thenReturn("de-DE");
        plugin.speak(again); idle();
        verify(engine, times(2)).setLanguage(Locale.forLanguageTag("de-DE"));
    }

    @Test public void changingPreferredVoiceReloadsSelectionAndFailedPlaybackAllowsRetry() {
        Voice first = new Voice("a-local", Locale.forLanguageTag("es-ES"), 300, 100, false, Set.of());
        Voice second = new Voice("b-local", Locale.forLanguageTag("es-ES"), 300, 100, false, Set.of());
        when(engine.getVoices()).thenReturn(Set.of(first, second)); ready();
        plugin.speak(call("one")); idle(); listener().onDone("one"); idle();
        PluginCall preferred = call("two"); when(preferred.getString("voiceName")).thenReturn("b-local");
        plugin.speak(preferred); idle(); verify(engine).setVoice(second);
        listener().onError("two", TextToSpeech.ERROR_NOT_INSTALLED_YET); idle();
        PluginCall retry = call("retry"); when(retry.getString("voiceName")).thenReturn("b-local");
        plugin.speak(retry); idle(); verify(engine, times(2)).setVoice(second);
    }

    @Test public void onlyLatestWordSurvivesColdStartAndWarmupStillCompletes() {
        PluginCall warmup = call("warmup"), first = call("first"), latest = call("latest");
        plugin.prepare(warmup); plugin.speak(first); plugin.speak(latest); idle();
        verify(first).reject(anyString(), eq("CANCELED")); ready(); verify(warmup).resolve();
        verify(engine, never()).speak(any(CharSequence.class), anyInt(), any(Bundle.class), eq("first"));
        verify(engine).speak(any(CharSequence.class), anyInt(), any(Bundle.class), eq("latest"));
    }

    @Test public void rejectedAdvertisedVoiceFallsBackToSupportedLanguageDefault() {
        Voice voice = new Voice("es-local", Locale.forLanguageTag("es-ES"), 300, 100, false, Set.of());
        when(engine.getVoices()).thenReturn(Set.of(voice));
        when(engine.setVoice(voice)).thenReturn(TextToSpeech.ERROR); ready();
        plugin.speak(call("fallback")); idle();
        verify(engine).setLanguage(Locale.forLanguageTag("es-ES"));
        verify(engine).speak(any(CharSequence.class), anyInt(), any(Bundle.class), eq("fallback"));
    }

    @Test public void voiceLoadingAndPlaybackNeverRunOnScreenThread() throws Exception {
        ready();
        CountDownLatch loading = new CountDownLatch(1), release = new CountDownLatch(1);
        AtomicReference<Looper> configurationThread = new AtomicReference<>(), playbackThread = new AtomicReference<>();
        when(engine.setLanguage(any())).thenAnswer(invocation -> {
            configurationThread.set(Looper.myLooper()); loading.countDown();
            if (!release.await(5, TimeUnit.SECONDS)) throw new IllegalStateException("Voice loading test timed out");
            return TextToSpeech.LANG_COUNTRY_AVAILABLE;
        });
        when(engine.speak(any(CharSequence.class), anyInt(), any(Bundle.class), anyString())).thenAnswer(invocation -> {
            playbackThread.set(Looper.myLooper()); return TextToSpeech.SUCCESS;
        });
        plugin.speak(call("background"));
        // Drain the worker from a test thread, while the test's main thread
        // remains free to drive a real main-looper UI operation.
        Thread drain = new Thread(() -> shadowOf(plugin.speechHandler.getLooper()).idle());
        drain.start();
        try {
            assertTrue(loading.await(5, TimeUnit.SECONDS));
            assertNotEquals(Looper.getMainLooper(), configurationThread.get());
            PluginCall settings = call("settings-during-load"); plugin.openInstall(settings);
            shadowOf(Looper.getMainLooper()).idle(); verify(settings).resolve();
        } finally { release.countDown(); drain.join(5000); }
        idle();
        assertEquals(plugin.speechHandler.getLooper(), playbackThread.get());
        verify(engine).speak(any(CharSequence.class), anyInt(), any(Bundle.class), eq("background"));
    }

    @Test public void stopWhileVoiceLoadsPreventsObsoleteWordFromStarting() {
        ready(); PluginCall stopped = call("loading"), stop = call("stop-loading");
        when(engine.setLanguage(any())).thenAnswer(invocation -> {
            plugin.stop(stop);
            return TextToSpeech.LANG_COUNTRY_AVAILABLE;
        });
        plugin.speak(stopped); idle();
        verify(stopped).reject(anyString(), eq("CANCELED")); verify(stop).resolve();
        verify(engine, never()).speak(any(CharSequence.class), anyInt(), any(Bundle.class), anyString());
    }

    @Test public void destructionWhileVoiceLoadsCancelsSpeechAndShutsDownWorker() throws Exception {
        ready(); PluginCall pending = call("destroyed-loading");
        when(engine.setLanguage(any())).thenAnswer(invocation -> {
            plugin.handleOnDestroy();
            return TextToSpeech.LANG_COUNTRY_AVAILABLE;
        });
        plugin.speak(pending); idle();
        verify(pending).reject(anyString(), eq("CANCELED")); verify(engine).shutdown();
        verify(engine, never()).speak(any(CharSequence.class), anyInt(), any(Bundle.class), anyString());
        plugin.speechHandler.getLooper().getThread().join(5000);
        assertFalse(plugin.speechHandler.getLooper().getThread().isAlive());
    }

    @Test public void newTapWhileVoiceLoadsReplacesObsoleteWordBeforePlayback() {
        ready(); PluginCall first = call("old-loading"), latest = call("new-word");
        when(engine.setLanguage(any())).thenAnswer(invocation -> {
            plugin.speak(latest);
            return TextToSpeech.LANG_COUNTRY_AVAILABLE;
        });
        plugin.speak(first); idle();
        verify(first).reject(anyString(), eq("CANCELED"));
        verify(engine, never()).speak(any(CharSequence.class), anyInt(), any(Bundle.class), eq("old-loading"));
        verify(engine).speak(any(CharSequence.class), anyInt(), any(Bundle.class), eq("new-word"));
    }

}
