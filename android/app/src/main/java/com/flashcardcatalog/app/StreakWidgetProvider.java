package com.flashcardcatalog.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.view.View;
import android.widget.RemoteViews;

import java.util.Calendar;

/**
 * The home-screen widget: the streak, today's progress towards the daily goal,
 * and a mascot whose mood tracks how the day is going.
 *
 * <p>Redrawn from three directions, which between them cover every way the
 * picture can go out of date:
 *
 * <ol>
 *   <li>The app pushes, through {@link StreakWidgetPlugin}, whenever the
 *       numbers change — a finished session is on screen within a second.</li>
 *   <li>The system's own {@code updatePeriodMillis} (30 minutes, the platform
 *       minimum) walks the mascot up its mood ladder through the day with the
 *       app closed, and picks up the new calendar day after midnight.</li>
 *   <li>Clock and timezone changes, which move the day boundary underfoot and
 *       would otherwise leave yesterday on screen until the next tick.</li>
 * </ol>
 *
 * <p>Nothing here computes what the mood *should* be — see {@link WidgetState}.
 */
public class StreakWidgetProvider extends AppWidgetProvider {

    /** Ask the system to redraw every placed instance. Safe with none placed. */
    static void redrawAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName me = new ComponentName(context, StreakWidgetProvider.class);
        int[] ids = manager.getAppWidgetIds(me);
        if (ids.length == 0) return;
        for (int id : ids) render(context, manager, id);
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        for (int id : appWidgetIds) render(context, manager, id);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent.getAction();
        if (Intent.ACTION_TIME_CHANGED.equals(action)
            || Intent.ACTION_TIMEZONE_CHANGED.equals(action)
            || Intent.ACTION_DATE_CHANGED.equals(action)) {
            redrawAll(context);
        }
    }

    /** The five day-strip columns, in the order the layout draws them. */
    private static final int[] DAY_LABELS = {
        R.id.widget_day0_label, R.id.widget_day1_label, R.id.widget_day2_label,
        R.id.widget_day3_label, R.id.widget_day4_label,
    };
    private static final int[] DAY_DOTS = {
        R.id.widget_day0_dot, R.id.widget_day1_dot, R.id.widget_day2_dot,
        R.id.widget_day3_dot, R.id.widget_day4_dot,
    };

    private static void render(Context context, AppWidgetManager manager, int appWidgetId) {
        SharedPreferences p = WidgetState.prefs(context);
        Calendar now = Calendar.getInstance();
        boolean stale = WidgetState.isStale(p, now);

        int streak = p.getInt(WidgetState.KEY_STREAK, 0);
        String mascot = p.getString(WidgetState.KEY_MASCOT, WidgetState.DEFAULT_MASCOT);
        String mood = WidgetState.mood(p, now, stale);
        String message = WidgetState.message(p, mood, stale);
        boolean done = WidgetState.HAPPY.equals(mood);

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_streak);

        // The mood is carried by the card colour and the face together. Either
        // alone is legible; both is what makes it readable without focusing.
        views.setInt(R.id.widget_root, "setBackgroundResource",
            WidgetState.backgroundFor(context, mood));
        views.setImageViewResource(R.id.widget_mascot, WidgetState.drawableFor(context, mascot, mood));
        views.setImageViewResource(R.id.widget_flame,
            done ? R.drawable.widget_flame_lit : R.drawable.widget_flame_out);

        String headline = context.getString(
            streak == 1 ? R.string.widget_day_streak_n : R.string.widget_days_streak_n, streak);
        views.setTextViewText(R.id.widget_streak, headline);
        views.setTextViewText(R.id.widget_message, message);

        renderDays(views, WidgetState.days(p, stale));

        // The whole widget is one target — a home screen is a place for one
        // tap, not for hunting a small button.
        views.setOnClickPendingIntent(R.id.widget_root, launchApp(context));

        // Screen readers get the sentence a sighted user assembles from the
        // headline, the message and a drawing. Without it the mascot is
        // announced as an unlabelled image and the point of the widget is lost.
        views.setContentDescription(R.id.widget_root,
            context.getString(R.string.widget_a11y, headline, message));

        manager.updateAppWidget(appWidgetId, views);
    }

    /**
     * Fills the strip, hiding any column the snapshot didn't supply. Hiding
     * rather than leaving blank matters on a fresh install, where there is no
     * snapshot at all: five unlabelled empty circles look like a bug, and an
     * absent strip looks like a widget waiting for its first session.
     */
    private static void renderDays(RemoteViews views, WidgetState.Day[] days) {
        for (int i = 0; i < DAY_DOTS.length; i++) {
            if (i >= days.length) {
                views.setViewVisibility(DAY_LABELS[i], View.GONE);
                views.setViewVisibility(DAY_DOTS[i], View.GONE);
                continue;
            }
            views.setViewVisibility(DAY_LABELS[i], View.VISIBLE);
            views.setViewVisibility(DAY_DOTS[i], View.VISIBLE);
            views.setTextViewText(DAY_LABELS[i], days[i].label);
            views.setImageViewResource(DAY_DOTS[i], dotFor(days[i].state));
        }
    }

    private static int dotFor(int state) {
        if (state == WidgetState.DAY_MET) return R.drawable.widget_day_done;
        if (state == WidgetState.DAY_FROZEN) return R.drawable.widget_day_frozen;
        return R.drawable.widget_day_todo;
    }

    private static PendingIntent launchApp(Context context) {
        Intent intent = new Intent(context, MainActivity.class);
        // MainActivity is singleTask, so this brings the existing task forward
        // rather than stacking a second copy of the app behind the first.
        intent.setAction(Intent.ACTION_MAIN);
        intent.addCategory(Intent.CATEGORY_LAUNCHER);
        // FLAG_IMMUTABLE is required from Android 12 and correct everywhere:
        // nothing outside this app has any business rewriting the intent.
        return PendingIntent.getActivity(
            context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
