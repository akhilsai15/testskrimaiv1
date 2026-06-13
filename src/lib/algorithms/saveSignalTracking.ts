import { updateVibeScore } from './watchTimeTracking';

export const trackSaveSignal = (vibe: any, allVibes: any[], setVibes: (vibes: any[]) => void) => {
  const key = "skrimchat_saved_vibes";
  const data = JSON.parse(
    localStorage.getItem(key) || JSON.stringify({
      saves: [],
      totalSaves: 0,
      moodSaveCounts: {},
      languageSaveCounts: {}
    })
  );

  // Check if un-saving
  const existingSaveIndex = data.saves.findIndex((s: any) => s.vibeId === vibe.id);
  const isUnsaving = existingSaveIndex !== -1;

  if (isUnsaving) {
    // Handle Unsave
    data.saves.splice(existingSaveIndex, 1);
    data.totalSaves = Math.max(0, data.totalSaves - 1);
    
    if (vibe.mood && data.moodSaveCounts[vibe.mood]) {
      data.moodSaveCounts[vibe.mood] = Math.max(0, data.moodSaveCounts[vibe.mood] - 1);
    }
    if (vibe.language && data.languageSaveCounts[vibe.language]) {
      data.languageSaveCounts[vibe.language] = Math.max(0, data.languageSaveCounts[vibe.language] - 1);
    }
    
    localStorage.setItem(key, JSON.stringify(data));
    updateVibeScore(vibe.id, "save", 0);
  } else {
    // Handle Save
    data.saves.push({
      vibeId: vibe.id,
      savedAt: Date.now(),
      vibeLanguage: vibe.language,
      vibeMood: vibe.mood,
      vibeCreatorCountry: vibe.creatorCountry,
      vibeCreatorRegion: vibe.creatorRegion
    });
    data.totalSaves++;

    if (vibe.mood) {
      data.moodSaveCounts[vibe.mood] = (data.moodSaveCounts[vibe.mood] || 0) + 1;
    }
    if (vibe.language) {
      data.languageSaveCounts[vibe.language] = (data.languageSaveCounts[vibe.language] || 0) + 1;
    }

    localStorage.setItem(key, JSON.stringify(data));
    updateVibeScore(vibe.id, "save", 15); // Save = 15 points
    boostSimilarVibes(vibe, allVibes, setVibes);
  }
};

export const boostSimilarVibes = (savedVibe: any, allVibes: any[], setVibes: (vibes: any[]) => void) => {
  const scores = JSON.parse(localStorage.getItem("skrimchat_vibe_scores") || "{}");

  allVibes.forEach(vibe => {
    if (vibe.id === savedVibe.id) return;

    let boost = 0;
    if (vibe.mood === savedVibe.mood) boost += 5;
    if (vibe.language === savedVibe.language) boost += 3;
    if (vibe.creatorUsername === savedVibe.creatorUsername || vibe.handle === savedVibe.handle) boost += 8;

    if (boost > 0) {
      if (!scores[vibe.id]) {
        scores[vibe.id] = { saveScore: 0, totalScore: 0 };
      }
      scores[vibe.id].saveScore = (scores[vibe.id].saveScore || 0) + boost;
      scores[vibe.id].totalScore = (scores[vibe.id].totalScore || 0) + boost;
    }
  });

  localStorage.setItem("skrimchat_vibe_scores", JSON.stringify(scores));

  // Refresh feed order
  const sorted = [...allVibes].sort((a, b) => {
    const scoreA = scores[a.id]?.totalScore || 0;
    const scoreB = scores[b.id]?.totalScore || 0;
    return scoreB - scoreA;
  });
  setVibes(sorted);
};
