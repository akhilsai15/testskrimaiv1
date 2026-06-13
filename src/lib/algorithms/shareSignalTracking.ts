import { updateVibeScore } from './watchTimeTracking';
import { awardPoints } from '../../components/PulsePointsSystem';

export const PLATFORM_WEIGHTS: Record<string, { score: number; pts: number }> = {
  whatsapp:     { score: 20, pts: 5 },
  telegram:     { score: 18, pts: 5 },
  instagram:    { score: 15, pts: 4 },
  snapchat:     { score: 15, pts: 4 },
  sharechat:    { score: 15, pts: 4 },
  twitter:      { score: 12, pts: 3 },
  facebook:     { score: 12, pts: 3 },
  moj:          { score: 12, pts: 3 },
  josh:         { score: 12, pts: 3 },
  roposo:       { score: 12, pts: 3 },
  linkedin:     { score: 10, pts: 3 },
  pinterest:    { score: 10, pts: 2 },
  reddit:       { score: 10, pts: 2 },
  signal_chat:  { score: 8,  pts: 2 },
  sms:          { score: 8,  pts: 2 },
  email:        { score: 6,  pts: 2 },
  copy_link:    { score: 5,  pts: 1 },
  more:         { score: 5,  pts: 1 }
};

export const getShareUrl = (platform: string, vibe: any): string | null => {
  const vibeUrl = `https://skrim.chat/vibe/${vibe.id}`;
  const message = encodeURIComponent(`Check this out on SkrimChat! ⚡\n${vibe.caption || ""}\n${vibeUrl}`);

  const urls: Record<string, string | null> = {
    whatsapp: `https://api.whatsapp.com/send?text=${message}`,
    instagram: `instagram://`, // Or custom logic
    telegram: `https://t.me/share/url?url=${encodeURIComponent(vibeUrl)}&text=${message}`,
    snapchat: `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(vibeUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${message}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(vibeUrl)}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(vibeUrl)}`,
    reddit: `https://reddit.com/submit?url=${encodeURIComponent(vibeUrl)}&title=${message}`,
    sharechat: `sharechat://`,
    moj: `moj://`,
    josh: `josh://`,
    roposo: `roposo://`,
    signal_chat: null, // Handled separately
    sms: `sms:?body=${message}`,
    email: `mailto:?subject=${encodeURIComponent("Check this on SkrimChat")}&body=${message}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(vibeUrl)}`
  };

  return urls[platform] || null;
};

export const trackShare = (vibe: any, platform: string, allVibes: any[], setVibes: (vibes: any[]) => void) => {
  const weight = PLATFORM_WEIGHTS[platform] || { score: 5, pts: 1 };

  const key = "skrimchat_all_shares";
  const data = JSON.parse(
    localStorage.getItem(key) || JSON.stringify({
      shares: [],
      totalShares: 0,
      byPlatform: {},
      byMood: {},
      byLanguage: {}
    })
  );

  data.shares.push({
    vibeId: vibe.id,
    platform: platform,
    sharedAt: Date.now(),
    vibeLanguage: vibe.language,
    vibeMood: vibe.mood,
    vibeCreator: vibe.user || vibe.creatorUsername
  });

  data.totalShares++;
  data.byPlatform[platform] = (data.byPlatform[platform] || 0) + 1;

  if (vibe.mood) {
    data.byMood[vibe.mood] = (data.byMood[vibe.mood] || 0) + 1;
  }

  if (vibe.language) {
    data.byLanguage[vibe.language] = (data.byLanguage[vibe.language] || 0) + 1;
  }

  localStorage.setItem(key, JSON.stringify(data));

  awardPoints(weight.pts, `share_${platform}`);
  updateVibeScore(vibe.id, "share", weight.score);
  boostSimilarAfterShare(vibe, weight.score, allVibes, setVibes);
  
  return weight.pts; // Return points for banner
};

const boostSimilarAfterShare = (sharedVibe: any, shareScore: number, allVibes: any[], setVibes: (vibes: any[]) => void) => {
  const boostFactor = shareScore / 20;
  const scores = JSON.parse(localStorage.getItem("skrimchat_vibe_scores") || "{}");

  allVibes.forEach(vibe => {
    if (vibe.id === sharedVibe.id) return;

    let boost = 0;
    if (vibe.mood === sharedVibe.mood) boost += Math.floor(7 * boostFactor);
    if (vibe.language === sharedVibe.language) boost += Math.floor(4 * boostFactor);
    if ((vibe.user || vibe.creatorUsername) === (sharedVibe.user || sharedVibe.creatorUsername)) boost += Math.floor(10 * boostFactor);

    if (boost > 0) {
      if (!scores[vibe.id]) {
        scores[vibe.id] = { totalScore: 0, saveScore: 0, shareScore: 0 };
      }
      scores[vibe.id].shareScore = (scores[vibe.id].shareScore || 0) + boost;
      scores[vibe.id].totalScore = (scores[vibe.id].totalScore || 0) + boost;
      updateVibeScore(vibe.id, "share", boost);
    }
  });

  localStorage.setItem("skrimchat_vibe_scores", JSON.stringify(scores));

  const sorted = [...allVibes].sort((a, b) => {
    const scoreA = scores[a.id]?.totalScore || 0;
    const scoreB = scores[b.id]?.totalScore || 0;
    return scoreB - scoreA;
  });
  setVibes(sorted);
};
