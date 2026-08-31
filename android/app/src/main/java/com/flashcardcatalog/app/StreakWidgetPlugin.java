package com.flashcardcatalog.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * The web layer's one way to reach the home-screen widget.
 *
 * <p>Deliberately a single method taking a finished snapshot. The temptation
 * is to expose the game state and let the native side work things out, but
 * that would put a second copy of the streak and goal rules in Java, free to
 * drift from the tested ones in src/gamification.js. What crosses the bridge
 * is answers, not inputs — see the header of src/widget.js.
 */
@CapacitorPlugin(name = "StreakWidget")
public class StreakWidgetPlugin extends Plugin {

    @PluginMethod
    public void update(PluginCall call) {
        WidgetState.write(
            getContext(),
            call.getString("day", ""),
            call.getInt("streak", 0),
            call.getInt("done", 0),
            call.getInt("goal", 20),
            call.getString("mascot", WidgetState.DEFAULT_MASCOT),
            call.getString("today", ""),
            call.getString("nextDay", "")
        );
        // Writing without redrawing would leave the old picture up until the
        // system's next half-hourly tick, which is the difference between
        // "finished a session" and "finished a session, eventually".
        StreakWidgetProvider.redrawAll(getContext());
        call.resolve();
    }
}
