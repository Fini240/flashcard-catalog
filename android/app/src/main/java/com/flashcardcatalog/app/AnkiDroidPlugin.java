package com.flashcardcatalog.app;

import android.content.Context;
import android.database.Cursor;
import android.net.Uri;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/**
 * Reads decks and notes straight out of AnkiDroid through its public content
 * provider (authority {@code com.ichi2.anki.flashcards}).
 *
 * This exists so importing doesn't require the export-a-file dance: with
 * AnkiDroid installed on the same phone, the user grants one permission and
 * their decks are simply listed.
 *
 * Only raw note fields are handed to the web layer. The HTML cleanup, cloze
 * expansion and deck-name splitting all live in ankiImport.js, shared with the
 * .apkg reader — so the two routes can't drift apart, and the tested code is
 * the code that runs for both.
 *
 * Note on package visibility: since Android 11 the provider is invisible to us
 * unless the manifest declares it under {@code <queries>}. Without that,
 * resolveContentProvider returns null even with AnkiDroid installed, and the
 * feature looks broken rather than absent.
 */
@CapacitorPlugin(
    name = "AnkiDroid",
    permissions = {
        @Permission(alias = AnkiDroidPlugin.ANKI_ALIAS, strings = { AnkiDroidPlugin.ANKI_PERMISSION })
    }
)
public class AnkiDroidPlugin extends Plugin {

    static final String ANKI_ALIAS = "ankidroid";
    static final String ANKI_PERMISSION = "com.ichi2.anki.permission.READ_WRITE_DATABASE";

    private static final String AUTHORITY = "com.ichi2.anki.flashcards";
    private static final Uri DECKS_URI = Uri.parse("content://" + AUTHORITY + "/decks");
    private static final Uri NOTES_URI = Uri.parse("content://" + AUTHORITY + "/notes");
    private static final String COL_DECK_NAME = "deck_name";
    private static final String COL_FLDS = "flds";

    /** Whether AnkiDroid is installed, and whether we may already read it. */
    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("installed", providerPresent());
        ret.put("granted", getPermissionState(ANKI_ALIAS) == com.getcapacitor.PermissionState.GRANTED);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestAnkiPermission(PluginCall call) {
        if (!providerPresent()) {
            call.reject("AnkiDroid isn't installed on this device.");
            return;
        }
        if (getPermissionState(ANKI_ALIAS) == com.getcapacitor.PermissionState.GRANTED) {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
            return;
        }
        requestPermissionForAlias(ANKI_ALIAS, call, "permissionCallback");
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("granted", getPermissionState(ANKI_ALIAS) == com.getcapacitor.PermissionState.GRANTED);
        call.resolve(ret);
    }

    /** Every deck name AnkiDroid knows about. */
    @PluginMethod
    public void listDecks(PluginCall call) {
        if (!ensureReadable(call)) return;
        JSArray decks = new JSArray();
        Cursor cursor = null;
        try {
            cursor = resolver().query(DECKS_URI, null, null, null, null);
            if (cursor == null) {
                call.reject("AnkiDroid returned nothing. Open AnkiDroid once, then try again.");
                return;
            }
            int nameIdx = cursor.getColumnIndex(COL_DECK_NAME);
            while (cursor.moveToNext()) {
                String name = nameIdx >= 0 ? cursor.getString(nameIdx) : null;
                if (name != null && !name.trim().isEmpty()) decks.put(name);
            }
        } catch (SecurityException e) {
            call.reject("AnkiDroid denied access. Grant the permission and try again.");
            return;
        } catch (Exception e) {
            call.reject("Couldn't read decks from AnkiDroid: " + e.getMessage());
            return;
        } finally {
            closeQuietly(cursor);
        }
        JSObject ret = new JSObject();
        ret.put("decks", decks);
        call.resolve(ret);
    }

    /** Raw fields of every note in a deck (its subdecks included). */
    @PluginMethod
    public void readDeck(PluginCall call) {
        String deck = call.getString("deck");
        if (deck == null || deck.trim().isEmpty()) {
            call.reject("No deck given.");
            return;
        }
        if (!ensureReadable(call)) return;

        JSArray notes = new JSArray();
        Cursor cursor = null;
        try {
            // AnkiDroid's provider takes a search string where a selection would
            // normally go. Quoting the name is what makes a deck containing
            // spaces work at all.
            String selection = "deck:\"" + deck.replace("\"", "") + "\"";
            cursor = resolver().query(NOTES_URI, null, selection, null, null);
            if (cursor == null) {
                call.reject("AnkiDroid returned nothing for that deck.");
                return;
            }
            int fldsIdx = cursor.getColumnIndex(COL_FLDS);
            if (fldsIdx < 0) {
                call.reject("AnkiDroid's notes are in an unexpected shape.");
                return;
            }
            while (cursor.moveToNext()) {
                String flds = cursor.getString(fldsIdx);
                if (flds == null) continue;
                JSObject note = new JSObject();
                note.put("flds", flds);
                notes.put(note);
            }
        } catch (SecurityException e) {
            call.reject("AnkiDroid denied access. Grant the permission and try again.");
            return;
        } catch (Exception e) {
            call.reject("Couldn't read that deck from AnkiDroid: " + e.getMessage());
            return;
        } finally {
            closeQuietly(cursor);
        }
        JSObject ret = new JSObject();
        ret.put("notes", notes);
        call.resolve(ret);
    }

    private boolean ensureReadable(PluginCall call) {
        if (!providerPresent()) {
            call.reject("AnkiDroid isn't installed on this device.");
            return false;
        }
        if (getPermissionState(ANKI_ALIAS) != com.getcapacitor.PermissionState.GRANTED) {
            call.reject("Permission to read AnkiDroid hasn't been granted.");
            return false;
        }
        return true;
    }

    private boolean providerPresent() {
        try {
            Context ctx = getContext();
            return ctx.getPackageManager().resolveContentProvider(AUTHORITY, 0) != null;
        } catch (Exception e) {
            return false;
        }
    }

    private android.content.ContentResolver resolver() {
        return getContext().getContentResolver();
    }

    private static void closeQuietly(Cursor cursor) {
        if (cursor == null) return;
        try {
            cursor.close();
        } catch (Exception ignored) {
            // Nothing useful to do; the query already succeeded or failed.
        }
    }
}
