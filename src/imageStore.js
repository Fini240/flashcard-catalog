// Card pictures are intentionally device-local: they're kept out of the
// synced `cards` payload (which has to stay under Firestore's 1MB document
// cap). Cards only carry a small id pointing into this store, so the fact that
// a card has a picture syncs across devices even though the picture itself
// doesn't.
//
// They live in IndexedDB, and that is the whole point of this file.
//
// They used to live in localStorage, under one key each. localStorage is a
// fixed per-origin budget — about 5.2 million characters in Chromium, counted
// over keys and values together — and the entire catalog is written into that
// same budget under a single key. A picture resized to 1000px and encoded as
// base64 is ~160k characters, so roughly thirty photographed cards were enough
// to leave no room for the catalog: the save threw, nothing was written, and
// the day's work was still on screen and gone at the next launch. Measured on
// a real build, 1,200 cards and 25 pictures filled the store.
//
// IndexedDB has its own budget, a share of free disk rather than five
// megabytes, and nothing of the catalog's competes for it. Moving the pictures
// out is what actually gives the space back — `migrateLegacyImages` below
// copies the old keys across and deletes them, and it is the reason this file
// still knows what a `fc-img-` key is.
//
// Three consequences worth knowing before editing:
//
//   1. Reading a picture is asynchronous now. "Not loaded yet" must never be
//      drawn as "not on this device" — see useCardImage in cardUI.jsx, which
//      is the only thing components should use.
//   2. Everything degrades to localStorage when IndexedDB is missing or
//      refuses to open (a locked-down browser, jsdom under test). The app must
//      work either way, so every path here checks.
//   3. A picture already read stays in a small memory cache, which is what
//      keeps a card from flickering every time it is drawn.
// LEGACY_IMAGE_PREFIX is defined in report.js rather than here, and the header
// there says why: this module reports its failures through report.js, and
// report.js measures how much of the store the old picture keys still hold, so
// whichever way the constant travelled the other import would close a cycle.
import { report, LEGACY_IMAGE_PREFIX as PREFIX } from "./report";
const DB_NAME = "flashcard-catalog";
const DB_VERSION = 1;
const STORE = "images";
const MAX_DIMENSION = 1000;
const JPEG_QUALITY = 0.75;
// Enough to hold the pictures on screen and the ones just behind it. These are
// data URLs, so each is a few hundred kilobytes of string: an unbounded cache
// would trade a storage problem for a memory one.
const CACHE_LIMIT = 24;

const genId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// ---------- the memory cache ----------
// A Map iterates in insertion order, which is all the LRU bookkeeping this
// needs: re-inserting a hit moves it to the end, and the oldest key is first.
const cache = new Map();

function cachePut(id, dataUrl) {
  if (cache.has(id)) cache.delete(id);
  cache.set(id, dataUrl);
  while (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value);
}

// ---------- IndexedDB ----------
// Hand-rolled rather than pulling in a wrapper: it is three operations, and
// the failure behaviour — resolve to null and let every caller fall back — is
// the part that matters and is easier to be sure of when it is written out.
let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    let request;
    try {
      if (typeof indexedDB === "undefined" || !indexedDB) { resolve(null); return; }
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (e) {
      // Firefox in permanent private mode throws here rather than failing the
      // request, and some enterprise policies block the API outright.
      report("imageStore.open", e);
      resolve(null);
      return;
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { report("imageStore.open", request.error); resolve(null); };
    // Another tab holds an older version open. Falling back beats hanging.
    request.onblocked = () => resolve(null);
  });
  return dbPromise;
}

function idbRun(db, mode, fn) {
  return new Promise((resolve, reject) => {
    let tx;
    try {
      tx = db.transaction(STORE, mode);
    } catch (e) { reject(e); return; }
    const request = fn(tx.objectStore(STORE));
    // Resolve on the *transaction*, not the request: a write is not durable
    // until the transaction commits, and the migration deletes the localStorage
    // copy on the strength of this promise.
    tx.oncomplete = () => resolve(request ? request.result : undefined);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error("transaction aborted"));
  });
}

// ---------- reading ----------
// What can be answered without waiting: the memory cache, and the legacy
// localStorage keys, which are synchronous and may not have been migrated yet.
// Returns the data URL, or undefined for "don't know — ask getImage".
export function peekImage(id) {
  if (!id) return null;
  if (cache.has(id)) return cache.get(id);
  try {
    const legacy = window.localStorage.getItem(PREFIX + id);
    if (legacy) { cachePut(id, legacy); return legacy; }
  } catch (e) { /* storage unavailable; ask properly */ }
  return undefined;
}

// The data URL, or null when this device genuinely doesn't have the picture —
// which is the normal state for a card that synced from another device.
export async function getImage(id) {
  if (!id) return null;
  const known = peekImage(id);
  if (known !== undefined) return known;
  const db = await openDb();
  if (db) {
    try {
      const value = await idbRun(db, "readonly", (store) => store.get(id));
      if (value) { cachePut(id, value); return value; }
    } catch (e) {
      report("imageStore.get", e);
    }
  }
  return null;
}

// How many pictures this device is holding. For the diagnostics dump: with
// the pictures out of localStorage, the store's own size no longer says
// anything about them, and "how many pictures does this phone have" is still
// the first question to ask about a device that ran out of room.
export async function countImages() {
  const db = await openDb();
  if (!db) return null;
  try {
    return await idbRun(db, "readonly", (store) => store.count());
  } catch (e) {
    report("imageStore.count", e);
    return null;
  }
}

// ---------- writing ----------
function resizeAndCompress(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that image."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Couldn't read that image."));
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const scale = MAX_DIMENSION / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export async function saveImage(file) {
  const dataUrl = await resizeAndCompress(file);
  const id = genId();
  const db = await openDb();
  if (db) {
    try {
      await idbRun(db, "readwrite", (store) => store.put(dataUrl, id));
      cachePut(id, dataUrl);
      return id;
    } catch (e) {
      // Out of disk, or the store is gone. Fall through — localStorage is
      // small but it is better than losing the picture the user just took.
      report("imageStore.put", e);
    }
  }
  try {
    window.localStorage.setItem(PREFIX + id, dataUrl);
  } catch (e) {
    throw new Error("Couldn't save that image — your device may be low on storage.");
  }
  cachePut(id, dataUrl);
  return id;
}

// Fire-and-forget: nothing in the app waits for a picture to be gone, and a
// failure here leaks storage rather than losing anything, so it is reported
// and swallowed instead of being pushed onto the caller.
export function removeImage(id) {
  if (!id) return;
  cache.delete(id);
  try { window.localStorage.removeItem(PREFIX + id); } catch (e) { /* ignore */ }
  openDb().then((db) => {
    if (!db) return;
    return idbRun(db, "readwrite", (store) => store.delete(id));
  }).catch((e) => report("imageStore.delete", e));
}

// ---------- migration ----------
// Copy every picture still in localStorage into IndexedDB and delete the
// original. This is what gives the catalog its space back, so it is careful in
// one specific way: the localStorage key is removed only after the IndexedDB
// transaction has *committed*, and the first failure stops the run rather than
// pressing on — a half-migrated store is fine and will be finished at the next
// launch, but a key deleted against a write that never landed is a lost
// picture.
export async function migrateLegacyImages() {
  const db = await openDb();
  if (!db) return { moved: 0, freed: 0 };
  let keys = [];
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(PREFIX)) keys.push(key);
    }
  } catch (e) {
    return { moved: 0, freed: 0 };
  }
  let moved = 0;
  let freed = 0;
  for (const key of keys) {
    let value;
    try { value = window.localStorage.getItem(key); } catch (e) { break; }
    if (value == null) continue;
    try {
      await idbRun(db, "readwrite", (store) => store.put(value, key.slice(PREFIX.length)));
      window.localStorage.removeItem(key);
      moved++;
      freed += key.length + value.length;
    } catch (e) {
      report("imageStore.migrate", e);
      break;
    }
  }
  if (moved) {
    // Into the diagnostics buffer deliberately, the way sync.healedEmptySubjects
    // is: when someone asks why their cards stopped vanishing, this is the line
    // that answers it.
    report("imageStore.migrated", new Error(
      `moved ${moved} picture${moved === 1 ? "" : "s"} to IndexedDB, freeing ${Math.round(freed / 1024)}k chars of localStorage`
    ));
  }
  return { moved, freed };
}
