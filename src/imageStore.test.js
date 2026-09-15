// @vitest-environment jsdom
//
// Card pictures moved out of localStorage and into IndexedDB because they were
// the largest thing in a budget the catalog had to share with them — see the
// header of imageStore.js. These tests cover the two halves of that move that
// can lose something: the migration, which deletes the user's only copy of a
// picture, and the fallback, which is what runs when IndexedDB isn't there at
// all (a locked-down browser, and jsdom, which has no IndexedDB either).
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// A small in-memory IndexedDB, hand-rolled rather than pulled in: imageStore
// uses four operations, and what matters here is the *ordering* it relies on —
// a request's result is set before its transaction completes, and the
// transaction completing is what says a write is durable. A double that fires
// those in the wrong order would hide exactly the bug worth catching.
function fakeIndexedDB({ failWrites = false } = {}) {
  const data = new Map();
  const later = (fn) => setTimeout(fn, 0);
  const makeDb = () => ({
    objectStoreNames: { contains: () => true },
    createObjectStore: () => {},
    transaction(_name, _mode) {
      const tx = { oncomplete: null, onerror: null, onabort: null, error: null };
      tx.objectStore = () => ({
        get: (key) => { const r = {}; later(() => { r.result = data.get(key); }); return r; },
        put: (value, key) => {
          const r = {};
          later(() => { if (!failWrites) data.set(key, value); });
          return r;
        },
        delete: (key) => { const r = {}; later(() => data.delete(key)); return r; },
        count: () => { const r = {}; later(() => { r.result = data.size; }); return r; },
      });
      // After the operation's own tick, so request.result is already set.
      later(() => later(() => {
        if (failWrites) {
          tx.error = new Error("QuotaExceededError");
          tx.onabort && tx.onabort();
        } else tx.oncomplete && tx.oncomplete();
      }));
      return tx;
    },
  });
  return {
    data,
    open() {
      const request = { onupgradeneeded: null, onsuccess: null, onerror: null, onblocked: null };
      later(() => {
        request.result = makeDb();
        request.onupgradeneeded && request.onupgradeneeded();
        request.onsuccess && request.onsuccess();
      });
      return request;
    },
  };
}

// imageStore memoizes the open database for the life of the module, so each
// test gets a fresh copy of it rather than sharing one connection.
async function freshStore(idb) {
  vi.resetModules();
  if (idb) window.indexedDB = idb;
  else delete window.indexedDB;
  return import("./imageStore");
}

const PREFIX = "fc-img-";

describe("migrating pictures out of localStorage", () => {
  beforeEach(() => { window.localStorage.clear(); window.__lastErrors = []; });
  afterEach(() => { delete window.indexedDB; });

  it("moves every picture across and frees the space", async () => {
    const idb = fakeIndexedDB();
    const store = await freshStore(idb);
    localStorage.setItem(PREFIX + "a", "data:image/jpeg;base64,AAAA");
    localStorage.setItem(PREFIX + "b", "data:image/jpeg;base64,BBBB");
    localStorage.setItem("flashcard-catalog-data", "{}");

    const { moved, freed } = await store.migrateLegacyImages();

    expect(moved).toBe(2);
    expect(freed).toBeGreaterThan(0);
    expect(idb.data.get("a")).toBe("data:image/jpeg;base64,AAAA");
    expect(localStorage.getItem(PREFIX + "a")).toBeNull();
    // The catalog is not this function's business.
    expect(localStorage.getItem("flashcard-catalog-data")).toBe("{}");
  });

  it("keeps the localStorage copy when the write fails", async () => {
    // The one way this could destroy a picture: delete the original against a
    // write that never committed. So the delete hangs off the transaction
    // completing, and a failure stops the run rather than pressing on.
    const store = await freshStore(fakeIndexedDB({ failWrites: true }));
    localStorage.setItem(PREFIX + "a", "data:image/jpeg;base64,AAAA");
    localStorage.setItem(PREFIX + "b", "data:image/jpeg;base64,BBBB");

    const { moved } = await store.migrateLegacyImages();

    expect(moved).toBe(0);
    expect(localStorage.getItem(PREFIX + "a")).toBe("data:image/jpeg;base64,AAAA");
    expect(localStorage.getItem(PREFIX + "b")).toBe("data:image/jpeg;base64,BBBB");
  });

  it("is a no-op with nothing to move, and can be run again safely", async () => {
    const idb = fakeIndexedDB();
    const store = await freshStore(idb);
    localStorage.setItem(PREFIX + "a", "data:image/jpeg;base64,AAAA");
    await store.migrateLegacyImages();
    const second = await store.migrateLegacyImages();
    expect(second.moved).toBe(0);
    expect(idb.data.get("a")).toBe("data:image/jpeg;base64,AAAA");
  });

  it("does nothing at all without IndexedDB, rather than dropping the pictures", async () => {
    const store = await freshStore(null);
    localStorage.setItem(PREFIX + "a", "data:image/jpeg;base64,AAAA");
    const { moved } = await store.migrateLegacyImages();
    expect(moved).toBe(0);
    expect(localStorage.getItem(PREFIX + "a")).toBe("data:image/jpeg;base64,AAAA");
  });
});

describe("reading a picture", () => {
  beforeEach(() => { window.localStorage.clear(); window.__lastErrors = []; });
  afterEach(() => { delete window.indexedDB; });

  it("answers from IndexedDB, and caches it so the next read doesn't wait", async () => {
    const idb = fakeIndexedDB();
    const store = await freshStore(idb);
    idb.data.set("a", "data:image/jpeg;base64,AAAA");

    expect(store.peekImage("a")).toBeUndefined();          // not known yet
    expect(await store.getImage("a")).toBe("data:image/jpeg;base64,AAAA");
    expect(store.peekImage("a")).toBe("data:image/jpeg;base64,AAAA"); // now it is
  });

  it("still finds a picture the migration hasn't reached yet", async () => {
    const store = await freshStore(fakeIndexedDB());
    localStorage.setItem(PREFIX + "a", "data:image/jpeg;base64,AAAA");
    // Synchronously, so a card drawn mid-migration doesn't flicker.
    expect(store.peekImage("a")).toBe("data:image/jpeg;base64,AAAA");
  });

  it("tells a missing picture apart from one not read yet", async () => {
    // null and undefined are not interchangeable here: three screens show
    // "not on this device" for null, and drawing that while the read is still
    // in flight would put the message on every picture card.
    const store = await freshStore(fakeIndexedDB());
    expect(store.peekImage("nope")).toBeUndefined();
    expect(await store.getImage("nope")).toBeNull();
    expect(await store.getImage(null)).toBeNull();
  });

  it("counts what this device is holding, for the diagnostics dump", async () => {
    const idb = fakeIndexedDB();
    const store = await freshStore(idb);
    idb.data.set("a", "x");
    idb.data.set("b", "y");
    expect(await store.countImages()).toBe(2);
    expect(await (await freshStore(null)).countImages()).toBeNull();
  });

  it("removes a picture from both stores", async () => {
    const idb = fakeIndexedDB();
    const store = await freshStore(idb);
    idb.data.set("a", "x");
    localStorage.setItem(PREFIX + "a", "x");
    await store.getImage("a");           // warm the cache too
    store.removeImage("a");
    await new Promise((r) => setTimeout(r, 5));
    expect(localStorage.getItem(PREFIX + "a")).toBeNull();
    expect(idb.data.has("a")).toBe(false);
    expect(await store.getImage("a")).toBeNull();
  });
});
