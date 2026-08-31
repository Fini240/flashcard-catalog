package com.flashcardcatalog.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import java.util.Calendar;
import java.util.Locale;

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

    private static void render(Context context, AppWidgetManager manager, int appWidgetId) {
        SharedPreferences p = WidgetState.prefs(context);
        Calendar now = Calendar.getInstance();
        boolean stale = WidgetState.isStale(p, now);

        int streak = p.getInt(WidgetState.KEY_STREAK, 0);
        int goal = Math.max(1, p.getInt(WidgetState.KEY_GOAL, 20));
        int done = Math.min(WidgetState.done(p, stale), goal);
        String mascot = p.getString(WidgetState.KEY_MASCOT, WidgetState.DEFAULT_MASCOT);
        String mood = WidgetState.mood(p, now, stale);

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_streak);
        views.setImageViewResource(R.id.widget_mascot, WidgetState.drawableFor(context, mascot, mood));
        views.setTextViewText(R.id.widget_streak, String.valueOf(streak));
        views.setTextViewText(R.id.widget_streak_label, context.getString(R.string.widget_day_streak));
        views.setProgressBar(R.id.widget_progress, goal, done, false);
        views.setTextViewText(R.id.widget_goal,
            String.format(Locale.getDefault(), "%d / %d", done, goal));

        // The whole widget is one target — a home screen is a place for one
        // tap, not for hunting a small button.
        views.setOnClickPendingIntent(R.id.widget_root, launchApp(context));

        // Screen readers get the sentence a sighted user assembles from four
        // separate views, mood included: without it the mascot is announced as
        // an unlabelled image and the point of the widget is lost.
        views.setContentDescription(R.id.widget_root, context.getString(
            done >= goal ? R.string.widget_a11y_done : R.string.widget_a11y_todo,
            streak, done, goal));

        manager.updateAppWidget(appWidgetId, views);
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
