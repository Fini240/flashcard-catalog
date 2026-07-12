// A LIFO stack of "back" handlers. Whatever UI layer is currently on top —
// a modal, a drilled-down folder, a study session — registers a handler
// while it's active; the Android hardware/gesture back button always
// triggers the most-recently-registered one first. When the stack is
// empty, there's nothing left for the app to close, and the caller should
// fall through to the OS (minimize the app).
const stack = [];

export function pushBackHandler(fn) {
  stack.push(fn);
  return () => {
    const idx = stack.lastIndexOf(fn);
    if (idx !== -1) stack.splice(idx, 1);
  };
}

export function consumeBack() {
  if (stack.length === 0) return false;
  stack[stack.length - 1]();
  return true;
}
