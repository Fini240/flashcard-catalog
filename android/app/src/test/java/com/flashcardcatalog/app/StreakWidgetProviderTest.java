package com.flashcardcatalog.app;

import static org.junit.Assert.*;
import static org.robolectric.Shadows.shadowOf;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.graphics.Typeface;
import android.text.Spanned;
import android.text.style.StyleSpan;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;
import java.util.Calendar;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;
import org.robolectric.shadows.ShadowAppWidgetManager;

/**
 * Inflates the real widget layout the way a launcher does — through
 * RemoteViews — and checks what lands on it. RemoteViews refuses any view or
 * setter it does not allow, and the failure on a phone is a blank card with no
 * error anywhere the user can see, so this is the cheapest place to catch it.
 */
@RunWith(RobolectricTestRunner.class)
@Config(sdk = 34)
public class StreakWidgetProviderTest {
    private Context context;
    private ShadowAppWidgetManager widgets;

    @Before public void setup() {
        context = RuntimeEnvironment.getApplication();
        widgets = shadowOf(AppWidgetManager.getInstance(context));
    }

    /** Five days ending today, as src/widget.js encodes them. */
    private static String window(int... states) {
        Calendar c = Calendar.getInstance();
        c.add(Calendar.DAY_OF_MONTH, -(states.length - 1));
        StringBuilder out = new StringBuilder();
        for (int s : states) {
            if (out.length() > 0) out.append(',');
            out.append(WidgetState.dayKey(c)).append(':').append(s);
            c.add(Calendar.DAY_OF_MONTH, 1);
        }
        return out.toString();
    }

    private View place(int streak, String mood, String days) {
        String today = WidgetState.dayKey(Calendar.getInstance());
        WidgetState.write(context, today, streak, 0, 20, "fox",
            "0:" + mood, "0:sleepy",
            "{\"" + mood + "\":\"20 to go today\"}", "{}", days, "");
        int id = widgets.createWidget(StreakWidgetProvider.class, R.layout.widget_streak);
        StreakWidgetProvider.redrawAll(context);
        return widgets.getViewFor(id);
    }

    @Test public void drawsTheSnapshotIntoTheRealLayout() {
        View root = place(0, "waiting", window(0, 0, 0, 0, 0));
        assertNotNull(root);
        assertEquals("0 days", ((TextView) root.findViewById(R.id.widget_streak)).getText().toString());
        assertEquals("20 to go today",
            ((TextView) root.findViewById(R.id.widget_message)).getText().toString());
        // The mood colours the card, not the full-cell tap target around it.
        assertNotNull(root.findViewById(R.id.widget_card).getBackground());
        assertNull(root.getBackground());
        assertEquals(context.getColor(R.color.widget_on_dark),
            ((TextView) root.findViewById(R.id.widget_streak)).getCurrentTextColor());
    }

    @Test public void todayIsMarkedAndLabelledInBold() {
        View root = place(3, "waiting", window(1, 1, 0, 1, 0));
        ImageView todayMark = root.findViewById(R.id.widget_day4_dot);
        assertEquals(R.drawable.widget_day_today, shadowOf(todayMark.getDrawable()).getCreatedFromResId());
        ImageView missed = root.findViewById(R.id.widget_day2_dot);
        assertEquals(R.drawable.widget_day_todo, shadowOf(missed.getDrawable()).getCreatedFromResId());

        CharSequence label = ((TextView) root.findViewById(R.id.widget_day4_label)).getText();
        StyleSpan[] spans = ((Spanned) label).getSpans(0, label.length(), StyleSpan.class);
        assertEquals(1, spans.length);
        assertEquals(Typeface.BOLD, spans[0].getStyle());
        assertFalse(((TextView) root.findViewById(R.id.widget_day3_label)).getText() instanceof Spanned);

        // Only two consecutive met days join up.
        assertEquals(View.VISIBLE, root.findViewById(R.id.widget_day0_link).getVisibility());
        assertEquals(View.INVISIBLE, root.findViewById(R.id.widget_day1_link).getVisibility());
    }

    @Test public void aFinishedDayLightsTheHeadline() {
        View root = place(5, "happy", window(1, 1, 1, 1, 1));
        assertEquals(context.getColor(R.color.widget_streak_lit),
            ((TextView) root.findViewById(R.id.widget_streak)).getCurrentTextColor());
        ImageView todayMark = root.findViewById(R.id.widget_day4_dot);
        assertEquals(R.drawable.widget_day_done, shadowOf(todayMark.getDrawable()).getCreatedFromResId());
    }

    @Test @Config(qualifiers = "de")
    public void germanWeekdaysLoseTheirFullStop() {
        java.util.Locale.setDefault(java.util.Locale.GERMANY);
        try {
            View root = place(1, "waiting", window(0, 0, 0, 0, 0));
            for (int id : new int[] {R.id.widget_day0_label, R.id.widget_day4_label}) {
                String text = ((TextView) root.findViewById(id)).getText().toString();
                assertFalse(text, text.endsWith("."));
                assertTrue(text, text.length() >= 2);
            }
        } finally {
            java.util.Locale.setDefault(java.util.Locale.US);
        }
    }
}
