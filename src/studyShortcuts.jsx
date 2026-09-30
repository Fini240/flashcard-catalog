import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";

export function isEditing(target) {
  return !!target?.closest?.("input, textarea, select, [contenteditable]:not([contenteditable='false']), [role='textbox']");
}

export function useStudyKeys(actions, enabled = true) {
  const latest = useRef(actions);
  latest.current = actions;
  useEffect(() => {
    if (!enabled || Capacitor.isNativePlatform()) return;
    const onKey = event => {
      if (event.defaultPrevented || event.repeat || event.isComposing || isEditing(event.target)) return;
      if (document.querySelector(".fc-study-overlay")) return;
      const modified = event.ctrlKey || event.metaKey;
      const key = modified && event.key.toLowerCase() === "z" && !event.shiftKey ? "undo" : event.key;
      if (event.altKey || (modified && key !== "undo")) return;
      // Preserve native Space/Enter activation for a focused button/link.
      if ((key === " " || key === "Enter") && event.target?.closest?.("button, a") &&
          !event.target?.closest?.("[data-study-option]")) return;
      const action = latest.current[key];
      if (!action) return;
      event.preventDefault();
      action();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}

export function KeyHint({ children }) {
  return <kbd className="fc-key-hint" aria-hidden="true">{children}</kbd>;
}

// Publish the current exercise state without making the callback itself a
// dependency. Parent renders must not reset answers or create effect loops.
export function useExerciseSnapshot(state, onChange) {
  const latest = useRef(onChange);
  latest.current = onChange;
  const encoded = JSON.stringify(state);
  useEffect(() => { latest.current?.(JSON.parse(encoded)); }, [encoded]);
}
