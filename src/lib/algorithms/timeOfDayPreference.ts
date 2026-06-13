import { updateVibeScore } from './watchTimeTracking';

export const TIME_SLOTS: Record<string, { name: string, start: number, end: number, defaultMoods: string[] }> = {
  morning: {
    name: "morning",
    start: 5,
    end: 11,
    // 5 AM to 11 AM
    defaultMoods: [
      "motivation",
      "news",
      "fitness",
      "education"
    ]
  },
  afternoon: {
    name: "afternoon",
    start: 11,
    end: 17,
    // 11 AM to 5 PM
    defaultMoods: [
      "entertainment",
      "food",
      "comedy",
      "lifestyle"
    ]
  },
  evening: {
    name: "evening",
    start: 17,
    end: 22,
    // 5 PM to 10 PM
    defaultMoods: [
      "entertainment",
      "sports",
      "music",
      "social"
    ]
  },
  night: {
    name: "night",
    start: 22,
    end: 5,
    // 10 PM to 5 AM
    defaultMoods: [
      "chill",
      "asmr",
      "comedy",
      "late_night"
    ]
  }
};

export const getCurrentTimeSlot = () => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
};

export const VIBE_MOODS = [
  "motivation",
  "fitness",
  "comedy",
  "education",
  "food",
  "travel",
  "music",
  "dance",
  "gaming",
  "sports",
  "cricket",
  "entertainment",
  "lifestyle",
  "fashion",
  "beauty",
  "tech",
  "news",
  "asmr",
  "chill",
  "late_night",
  "social",
  "general"
];

export const trackTimePreference = (vibe: any, action: string) => {
  if (action !== "watch_full" && action !== "pulse" && action !== "save") return;
  // Only track strong signals

  const slot = getCurrentTimeSlot();
  const mood = vibe.mood || "general";

  const key = "skrimchat_time_prefs";
  const data = JSON.parse(localStorage.getItem(key) || "{}");

  if (!data[slot]) {
    data[slot] = {};
  }

  if (!data[slot][mood]) {
    data[slot][mood] = 0;
  }

  // Weight by action:
  const weight = action === "save" ? 3 : action === "pulse" ? 2 : 1;

  data[slot][mood] += weight;

  localStorage.setItem(key, JSON.stringify(data));
};

export const calculateTimeScore = (vibe: any) => {
  const slot = getCurrentTimeSlot();
  const mood = vibe.mood || "general";

  const prefs = JSON.parse(localStorage.getItem("skrimchat_time_prefs") || "{}");

  // No data yet → use default slot moods:
  if (!prefs[slot]) {
    const defaults = TIME_SLOTS[slot].defaultMoods;
    return defaults.includes(mood) ? 10 : 0;
  }

  // Has data → score based on history:
  const slotPrefs = prefs[slot];
  const maxScore = Math.max(...Object.values(slotPrefs) as number[], 1);
  const moodScore = slotPrefs[mood] || 0;

  // Normalize to 0-15:
  return Math.floor((moodScore / maxScore) * 15);
};

export const applyTimeScores = (allVibes: any[]) => {
  allVibes.forEach(vibe => {
    const score = calculateTimeScore(vibe);
    updateVibeScore(vibe.id, "timeOfDay", score);
  });
};
