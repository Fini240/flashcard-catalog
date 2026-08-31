package com.flashcardcatalog.app;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;

/**
 * The only thing the home-screen widget knows: a small snapshot written by the
 * app through {@link StreakWidgetPlugin} and read back by
 * {@link StreakWidgetProvider} whenever the launcher asks for a redraw.
 *
 * <p>SharedPreferences rather than anything cleverer because of where the two
 * ends live. The app's state is in the WebView's localStorage, which the
 * widget cannot reach — the widget is drawn from the launcher's process, often
 * with this app's process long dead. SharedPreferences is the one store both
 * sides can open, and the snapshot is deliberately tiny: seven values, no
 * cards, no review log, no account.
 *
 * <p><b>This class decides nothing.</b> Which mood the mascot is in is policy,
 * and policy lives in {@code src/widget.js} where it is pure and unit-tested.
 * What arrives here is that policy already resolved into a schedule —
 * {@code "0:sleepy,600:neutral,840:waiting"} — and all that happens below is a
 * lookup of which entry covers the current minute. A lookup can be wrong about
 * the clock; it cannot be wrong about the rules.
 */
final class WidgetState {

    private static final String PREFS = "streak_widget";

    static final String KEY_DAY = "day";
    static final String KEY_STREAK = "streak";
    static final String KEY_DONE = "done";
    static final String KEY_GOAL = "goal";
    static final String KEY_MASCOT = "mascot";
    static final String KEY_TODAY = "today";
    static final String KEY_NEXT_DAY = "nextDay";
    static final String KEY_MESSAGES = "messages";
    static final String KEY_NEXT_MESSAGES = "nextDayMessages";
    static final String KEY_DAYS = "days";
    static final String KEY_NEXT_DAYS = "nextDays";

    /** Marks in the day strip; mirrors DAY_* in src/widget.js. */
    static final int DAY_NONE = 0;
    static final int DAY_MET = 1;
    static final int DAY_FROZEN = 2;

    /** Mirrors DEFAULT_MASCOT in src/widget.js. */
    static final String DEFAULT_MASCOT = "owl";
    /** Mirrors MOODS[0] there — what an empty or unparseable schedule means. */
    private static final String DEFAULT_MOOD = "sleepy";
    /** Mirrors HAPPY there: the goal is met, and the flame is alight. */
    static final String HAPPY = "happy";

    private WidgetState() {}

    static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static void write(Context context, String day, int streak, int done, int goal, String mascot,
                      String today, String nextDay, String messages, String nextMessages,
                      String days, String nextDays) {
        prefs(context)
            .edit()
            .putString(KEY_DAY, day)
            .putInt(KEY_STREAK, streak)
            .putInt(KEY_DONE, done)
            .putInt(KEY_GOAL, goal)
            .putString(KEY_MASCOT, mascot)
            .putString(KEY_TODAY, today)
            .putString(KEY_NEXT_DAY, nextDay)
            .putString(KEY_MESSAGES, messages)
            .putString(KEY_NEXT_MESSAGES, nextMessages)
            .putString(KEY_DAYS, days)
            .putString(KEY_NEXT_DAYS, nextDays)
            .apply();
    }

    /** True once the snapshot was written on an earlier calendar day. */
    static boolean isStale(SharedPreferences p, Calendar now) {
        String stored = p.getString(KEY_DAY, null);
        return stored == null || !stored.equals(dayKey(now));
    }

    /**
     * Local calendar day as {@code YYYY-MM-DD} — the same key gamification.js
     * writes, including the part that matters: a session at 23:58 belongs to
     * that day, not to whatever UTC has rolled over to.
     */
    static String dayKey(Calendar c) {
        return String.format(
            Locale.US, "%04d-%02d-%02d",
            c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH)
        );
    }

    /**
     * Cards done today. Zero once the snapshot is stale, which is not a
     * guess but the plain truth: a new calendar day starts at nothing, and the
     * app has simply not been opened yet to say so.
     */
    static int done(SharedPreferences p, boolean stale) {
        return stale ? 0 : p.getInt(KEY_DONE, 0);
    }

    /**
     * The mascot's mood right now. A stale snapshot switches to the {@code
     * nextDay} schedule the app precomputed for exactly this case — a fresh
     * day with nothing done and the streak still to protect.
     */
    static String mood(SharedPreferences p, Calendar now, boolean stale) {
        String schedule = p.getString(stale ? KEY_NEXT_DAY : KEY_TODAY, "");
        return moodAt(schedule, now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE));
    }

    /**
     * Last entry whose start minute has passed. Kept forgiving on purpose: a
     * malformed entry is skipped rather than thrown, because the cost of a
     * parse failure here is a crash inside the launcher's process, and the
     * worst a skipped entry can do is leave the mascot one mood behind.
     */
    static String moodAt(String schedule, int minuteOfDay) {
        String mood = DEFAULT_MOOD;
        if (schedule == null || schedule.isEmpty()) return mood;
        for (String part : schedule.split(",")) {
            int colon = part.indexOf(':');
            if (colon <= 0 || colon == part.length() - 1) continue;
            try {
                if (Integer.parseInt(part.substring(0, colon)) > minuteOfDay) break;
            } catch (NumberFormatException e) {
                continue;
            }
            mood = part.substring(colon + 1);
        }
        return mood;
    }

    /**
     * The line under the streak. Every mood's message is sent, not just the
     * current one, because the mood advances with the app closed — picking one
     * here would freeze the sentence at whatever it said this morning.
     */
    static String message(SharedPreferences p, String mood, boolean stale) {
        String json = p.getString(stale ? KEY_NEXT_MESSAGES : KEY_MESSAGES, "");
        if (json == null || json.isEmpty()) return "";
        try {
            return new JSONObject(json).optString(mood, "");
        } catch (Exception e) {
            // Bad JSON must not take down the launcher's process. A widget with
            // no message line still shows the streak, the strip and the mascot.
            return "";
        }
    }

    /** One entry of the day strip: a short weekday label and a state mark. */
    static final class Day {
        final String label;
        final int state;
        Day(String label, int state) {
            this.label = label;
            this.state = state;
        }
    }

    /**
     * Parses {@code 2026-08-27:1,2026-08-28:0} into labelled days.
     *
     * <p>Day *keys* travel rather than weekday names so the label can be
     * formatted here, in the phone's own locale: the app is in English, but a
     * German phone should read "Do Fr Sa".
     */
    static Day[] days(SharedPreferences p, boolean stale) {
        String encoded = p.getString(stale ? KEY_NEXT_DAYS : KEY_DAYS, "");
        if (encoded == null || encoded.isEmpty()) return new Day[0];
        String[] parts = encoded.split(",");
        Day[] out = new Day[parts.length];
        SimpleDateFormat label = new SimpleDateFormat("EEE", Locale.getDefault());
        int n = 0;
        for (String part : parts) {
            int colon = part.lastIndexOf(':');
            if (colon <= 0 || colon == part.length() - 1) continue;
            int state;
            try {
                state = Integer.parseInt(part.substring(colon + 1));
            } catch (NumberFormatException e) {
                continue;
            }
            out[n++] = new Day(labelFor(part.substring(0, colon), label), state);
        }
        if (n == out.length) return out;
        Day[] trimmed = new Day[n];
        System.arraycopy(out, 0, trimmed, 0, n);
        return trimmed;
    }

    private static String labelFor(String dayKey, SimpleDateFormat format) {
        String[] ymd = dayKey.split("-");
        if (ymd.length != 3) return "";
        try {
            Calendar c = Calendar.getInstance();
            c.clear();
            c.set(Integer.parseInt(ymd[0]), Integer.parseInt(ymd[1]) - 1, Integer.parseInt(ymd[2]));
            return format.format(c.getTime());
        } catch (NumberFormatException e) {
            return "";
        }
    }

    /** The card's background, which carries the mood as much as the face does. */
    static int backgroundFor(Context context, String mood) {
        int id = context.getResources().getIdentifier(
            "widget_bg_" + mood, "drawable", context.getPackageName());
        return id != 0 ? id : R.drawable.widget_bg_neutral;
    }

    /**
     * {@code mascot_fox_happy} and friends, looked up by name.
     *
     * <p>Resolving by name rather than a thirty-arm switch is safe here only
     * because the drawables are generated as a complete grid by
     * scripts/mascots.mjs, and because neither R8 nor resource shrinking runs
     * on this app (see minifyEnabled in app/build.gradle) — a shrinker would
     * see no code reference to any of them and strip the lot. If shrinking is
     * ever turned on, these need a keep rule or a real switch.
     */
    static int drawableFor(Context context, String mascot, String mood) {
        int id = context.getResources().getIdentifier(
            "mascot_" + mascot + "_" + mood, "drawable", context.getPackageName());
        if (id != 0) return id;
        // An unknown animal or mood must still draw something rather than
        // leaving an empty square on someone's home screen.
        id = context.getResources().getIdentifier(
            "mascot_" + DEFAULT_MASCOT + "_" + mood, "drawable", context.getPackageName());
        return id != 0 ? id : R.drawable.mascot_owl_neutral;
    }
}
