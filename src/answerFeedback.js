import { useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { report } from "./report";

export const FEEDBACK_KEY = "flashcard-catalog-answer-feedback";
let preferences = { sound: true, haptics: true };
let settingsLoaded = false;

export function getFeedbackSettings() {
  if (settingsLoaded) return { ...preferences };
  settingsLoaded = true;
  try {
    const saved = JSON.parse(localStorage.getItem(FEEDBACK_KEY));
    if (saved && typeof saved === "object") {
      for (const key of ["sound", "haptics"]) {
        if (typeof saved[key] === "boolean") preferences[key] = saved[key];
      }
    }
  } catch (error) { report("answerFeedback.settings.read", error); }
  return { ...preferences };
}

export function setFeedbackSettings(next) {
  getFeedbackSettings();
  for (const key of ["sound", "haptics"]) {
    if (typeof next[key] === "boolean") preferences[key] = next[key];
  }
  try { localStorage.setItem(FEEDBACK_KEY, JSON.stringify(preferences)); }
  catch (error) { report("answerFeedback.settings.write", error); }
  return { ...preferences };
}

let audioContext;
let soundRequest = 0;
const activeTones = new Set();

function stopTones() {
  for (const tone of activeTones) tone.stop();
  activeTones.clear();
}

async function playSound(correct) {
  const request = ++soundRequest;
  try {
    const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Context) return;
    if (!audioContext || audioContext.state === "closed") {
      audioContext = new Context();
    }
    stopTones();
    // Called from the answer's click/key handler, so browsers can unlock audio.
    if (audioContext.state === "suspended") await audioContext.resume();
    if (request !== soundRequest || document.visibilityState === "hidden") return;
    const now = audioContext.currentTime;
    // A soft rising chime for recall; a short lower, descending cue for a miss.
    const notes = correct ? [660, 880] : [260, 195];
    notes.forEach((frequency, i) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const start = now + i * 0.095;
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.13);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      activeTones.add(oscillator);
      oscillator.onended = () => {
        activeTones.delete(oscillator);
        oscillator.disconnect(); gain.disconnect();
      };
      oscillator.start(start);
      oscillator.stop(start + 0.14);
    });
  } catch (error) { report("answerFeedback.sound", error); }
}

let hapticsModule;
async function playHaptics(correct) {
  try {
    if (Capacitor.isNativePlatform()) {
      const { Haptics, NotificationType } = await (hapticsModule ||= import("@capacitor/haptics"));
      await Haptics.notification({ type: correct ? NotificationType.Success : NotificationType.Error });
    } else if (typeof navigator.vibrate === "function") {
      navigator.vibrate(correct ? 35 : [45, 55, 45]);
    }
  } catch (error) { report("answerFeedback.haptics", error); }
}

export function playAnswerFeedback(correct) {
  if (document.visibilityState === "hidden") return;
  const settings = getFeedbackSettings();
  if (settings.sound) void playSound(correct);
  if (settings.haptics) void playHaptics(correct);
}

// Event-driven: restored checked answers and re-renders stay silent, and two
// rapid submissions cannot replay feedback before React updates the controls.
export function useAnswerFeedback(alreadyAnswered = false) {
  const answered = useRef(alreadyAnswered);
  return (correct) => {
    if (answered.current) return false;
    answered.current = true;
    playAnswerFeedback(correct);
    return true;
  };
}
