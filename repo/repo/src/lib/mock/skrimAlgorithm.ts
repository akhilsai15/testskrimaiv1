import { generateMockStatsForBadge } from './mockBadges';

export const MOCK_USERS = [
  { user: "Bappu Bhai Sharma", handle: "@bappu_bhai", avatar: "https://i.pravatar.cc/150?u=bappu" },
  { user: "Pappu Pandey", handle: "@pappu_pass_hogaya", avatar: "https://i.pravatar.cc/150?u=pappu" },
  { user: "Sunita Williams", handle: "@sunita_not", avatar: "https://i.pravatar.cc/150?u=sunita" },
  { user: "Raju Rastogi", handle: "@raju_3idiots_fan", avatar: "https://i.pravatar.cc/150?u=raju" },
  { user: "Dolly Devi", handle: "@dolly_ka_dhaba", avatar: "https://i.pravatar.cc/150?u=dolly" },
  { user: "Chikoo Singh", handle: "@chikoo_official", avatar: "https://i.pravatar.cc/150?u=chikoo" },
  { user: "Munni Lal", handle: "@munni_badnaam_nahi", avatar: "https://i.pravatar.cc/150?u=munni" },
  { user: "Bablu Mechanic", handle: "@bablu_ka_garage", avatar: "https://i.pravatar.cc/150?u=bablu" },
  { user: "Pinky Patel", handle: "@pinky_se_pink", avatar: "https://i.pravatar.cc/150?u=pinky" },
  { user: "Golu Mishra", handle: "@golu_fitness_goals", avatar: "https://i.pravatar.cc/150?u=golu" },
];

export const INDIAN_CAPTIONS = [
  "Aaj ka chai session ☕ 😂 #ChaiLovers #DesiVibes",
  "Gym selfie mandatory hai bhai sahab 💪 Workout: 5min Selfie: 45min 😂 #FitnessGoals",
  "Mummy ne haath se banaya khana 🍛❤️ #GharKaKhana",
  "Traffic mein 2 ghante maar diye 🚗😤 #MumbaiTraffic",
  "Wedding season shuru ho gaya bhai 💍🎉 😂 #ShaadiKaKhana",
  "Baarish mein chai ☕🌧️ Life sorted hai bhai #MonsoonVibes",
  "Office se chutti li toh ghumne nikal gaye 🏔️ #Wanderlust #DesiTraveller",
  "Dosa with extra sambar please 🙏😂 #SouthIndianFood",
  "Subah ki pehli chai ☕ Baaki sab baad mein #MorningVibes",
  "Yaar ne dhoka diya but biryani ne nahi 🍛💀 #BiryaniIsLife" // Unhinged
];

export const TRENDING_AUDIO = [
  "Mumbai After Hours",
  "Chai Pe Charcha",
  "Desi Beats Vol.3",
  "Bollywood Remix 2024",
  "Street Food Vibes",
  "Monsoon Feels",
  "Late Night Thoughts"
];

export const MOODS = [
  { id: 'funny', label: 'Funny', emoji: '😂' },
  { id: 'trending', label: 'Trending', emoji: '🔥' },
  { id: 'chill', label: 'Chill', emoji: '💜' },
  { id: 'inspire', label: 'Inspire', emoji: '🚀' },
  { id: 'unhinged', label: 'Unhinged', emoji: '💀' }
];

const RELATED_MOODS: Record<string, string[]> = {
  'funny': ['trending', 'unhinged'],
  'trending': ['funny', 'inspire'],
  'chill': ['inspire'],
  'inspire': ['chill', 'trending'],
  'unhinged': ['funny']
};

export function getDefaultMood() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 9) return 'inspire';
  if (hour >= 9 && hour < 12) return 'trending';
  if (hour >= 12 && hour < 14) return 'funny';
  if (hour >= 14 && hour < 18) return 'trending';
  if (hour >= 18 && hour < 22) return 'chill';
  if (hour >= 22 && hour < 24) return 'chill';
  return 'unhinged';
}

export function calculateSkrimScore(post: any, userMood: string, userHistory: any = {}) {
  // Mock recent pulses
  const pulsesPerMin = (post.likes || 1000) / 100;
  let pulseSpeedScore = 0;
  if (pulsesPerMin >= 500) pulseSpeedScore = 100;
  else if (pulsesPerMin >= 200) pulseSpeedScore = 90;
  else if (pulsesPerMin >= 50) pulseSpeedScore = 70;
  else if (pulsesPerMin >= 10) pulseSpeedScore = 40;
  else pulseSpeedScore = 10;

  const moodScore = post.mood === userMood ? 100
    : RELATED_MOODS[userMood]?.includes(post.mood) ? 60 : 10;

  // Mock friend activity
  const friendPulses = Math.floor(Math.random() * 5);
  const friendScore = friendPulses >= 3 ? 80
    : friendPulses >= 1 ? 50 : 10;

  const hoursOld = (Date.now() - post.createdAt) / 3600000;
  const freshnessScore = 
    hoursOld < 1 ? 100
    : hoursOld < 3 ? 80
    : hoursOld < 6 ? 50
    : hoursOld < 12 ? 30 : 10;

  return (
    pulseSpeedScore * 0.40 +
    moodScore * 0.25 +
    friendScore * 0.20 +
    freshnessScore * 0.15
  );
}

export function getVibeTemperature(skrimScore: number) {
  if (skrimScore >= 90) return {
    id: 'DEAD',
    label: '💀 DEAD',
    sublabel: 'Peak viral — fading',
    color: '#888888',
    bgColor: 'rgba(136,136,136,0.15)'
  };
  if (skrimScore >= 75) return {
    id: 'NOVA',
    label: '🚀 NOVA',
    sublabel: 'Exploding right now!',
    color: '#FF2D87',
    bgColor: 'rgba(255,45,135,0.15)'
  };
  if (skrimScore >= 50) return {
    id: 'HOT',
    label: '🔥 HOT',
    sublabel: 'Trending fast',
    color: '#FF6B00',
    bgColor: 'rgba(255,107,0,0.15)'
  };
  if (skrimScore >= 25) return {
    id: 'WARMING',
    label: '😐 WARMING',
    sublabel: 'Getting attention',
    color: '#00F0FF',
    bgColor: 'rgba(0,240,255,0.15)'
  };
  return {
    id: 'COLD',
    label: '🥶 COLD',
    sublabel: 'Just posted',
    color: '#4488FF',
    bgColor: 'rgba(68,136,255,0.15)'
  };
}

export const VELOCITY_MAP: Record<string, number> = {
  'COLD': 0.1,
  'WARMING': 0.5,
  'HOT': 2.0,
  'NOVA': 5.0,
  'DEAD': 0.05
};

export const MOCK_STORIES = [
  {
    text: "So this photo was actually taken at 4AM when I couldn't sleep and decided to make chai for the entire building 😂 My neighbors still thank me for it!",
    audio: "Mumbai After Hours",
    location: "My terrace",
    time: "4:23 AM"
  },
  {
    text: "I was stuck in traffic for 2 hours and half my biryani was gone before I even reached home! 😭 Worth it though.",
    audio: "Street Food Vibes",
    location: "Andheri East",
    time: "8:15 PM"
  },
  {
    text: "First time trying this workout and I literally couldn't walk down the stairs the next day. Send help 💀",
    audio: "Desi Beats Vol.3",
    location: "The Gym",
    time: "7:00 AM"
  }
];

let generatedPostCount = 0;

export function generateSinglePost(mood: string, forceNewTime = false, idxOverride?: number) {
  const idx = idxOverride !== undefined ? idxOverride : generatedPostCount++;
  const userObj = MOCK_USERS[idx % MOCK_USERS.length];
  
  const batchOffset = Math.floor(idx / 5);
  let timeStr = forceNewTime ? "Just now" : "1h ago";
  let createdAt = Date.now();
  if (!forceNewTime) {
    if (batchOffset === 0) {
       timeStr = idx % 2 === 0 ? '1h ago' : '2h ago';
       createdAt -= (idx % 2 === 0 ? 3600000 : 7200000);
    } else {
       const hours = batchOffset * 2 + (idx % 2 === 0 ? 1 : 2);
       timeStr = `${hours}h ago`;
       createdAt -= (hours * 3600000);
    }
  }

  const reactions: Record<string, number> = {
    pulse: Math.floor(Math.random() * (8000 - 1000) + 1000),
    blaze: Math.floor(Math.random() * (5000 - 800) + 800),
    vibe:  Math.floor(Math.random() * (4000 - 500) + 500),
    nova:  Math.floor(Math.random() * (3000 - 300) + 300),
    slay:  Math.floor(Math.random() * (2000 - 200) + 200),
    haunt: Math.floor(Math.random() * (1500 - 100) + 100),
    dead:  Math.floor(Math.random() * (4000 - 500) + 500),
    wave:  Math.floor(Math.random() * (1000 - 100) + 100)
  };

  // Assign random mood to post
  const postMoods = ['funny', 'trending', 'chill', 'inspire', 'unhinged'];
  const postMood = postMoods[idx % postMoods.length];

  const hasStory = Math.random() < 0.3;

  const basePost = {
    id: `generated_post_${Date.now()}_${idx}`,
    type: 'post',
    user: userObj.user,
    handle: userObj.handle,
    avatar: userObj.avatar,
    image: `https://picsum.photos/800/600?random=${idx + Date.now()}`,
    caption: INDIAN_CAPTIONS[idx % INDIAN_CAPTIONS.length],
    likes: Math.floor(Math.random() * 49000) + 1000,
    comments: Math.floor(Math.random() * 1900) + 100,
    shares: Math.floor(Math.random() * 450) + 50,
    time: timeStr,
    createdAt,
    audioContext: TRENDING_AUDIO[idx % TRENDING_AUDIO.length],
    isLiked: false,
    isSaved: false,
    reactions,
    mood: postMood,
    hasStory,
    storyDetail: hasStory ? MOCK_STORIES[idx % MOCK_STORIES.length] : null
  };

  const score = calculateSkrimScore(basePost, mood);
  return {
    ...basePost,
    skrimScore: score,
    temperature: getVibeTemperature(score)
  };
}

export function generateCollab() {
  const u1 = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
  let u2 = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
  while (u1.handle === u2.handle) {
    u2 = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
  }

  const baseIdx = generatedPostCount++;

  const basePost = {
    id: `collab_${Date.now()}_${baseIdx}`,
    type: 'collab_post',
    user1: u1,
    user2: u2,
    image1: `https://picsum.photos/400/600?random=${baseIdx + 111}`,
    image2: `https://picsum.photos/400/600?random=${baseIdx + 222}`,
    caption: "Chai vs Coffee debate settled! ☕😂 #Collab",
    likes: Math.floor(Math.random() * 49000) + 1000,
    comments: Math.floor(Math.random() * 1900) + 100,
    shares: Math.floor(Math.random() * 450) + 50,
    time: '2h ago',
    createdAt: Date.now() - 7200000,
    mood: 'trending'
  };

  const score = calculateSkrimScore(basePost, 'trending');
  return {
    ...basePost,
    skrimScore: score,
    temperature: getVibeTemperature(score)
  };
}

export function generateBattle() {
  const u1 = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
  let u2 = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
  while (u1.handle === u2.handle) {
    u2 = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
  }
  const baseIdx = generatedPostCount++;

  return {
    id: `battle_${Date.now()}_${baseIdx}`,
    type: 'pulse_battle',
    title: '"Who made better chai content?"',
    user1: u1,
    user2: u2,
    image1: `https://picsum.photos/400/400?random=${baseIdx + 333}`,
    image2: `https://picsum.photos/400/400?random=${baseIdx + 444}`,
    votesA: 62,
    votesB: 38,
    totalVotes: Math.floor(Math.random() * 10000) + 1000,
    endTime: Date.now() + 86400000, // + 24 hours
    userVoted: null // 'A' or 'B'
  };
}

export function assembleFeed(mood: string, startIndex: number, pageSize: number = 15) {
  const posts = [];
  
  for(let i = 0; i < pageSize; i++) {
    const globalIdx = startIndex + i;
    
    // Regular post
    posts.push(generateSinglePost(mood, false, globalIdx));
    
    // Every 5 posts: suggested user
    if (i % 5 === 4) {
      posts.push({
        id: `suggested_${globalIdx}`,
        type: 'suggested_user',
        user: MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)]
      });
    }
    
    // Every 8 posts: pulse battle
    if (i % 8 === 7) {
      posts.push(generateBattle());
    }
    
    // Every 10 posts: collab post
    if (i % 10 === 9) {
      posts.push(generateCollab());
    }
  }

  // Separate posts from special cards to sort posts only
  const normalPosts = posts.filter(p => p.type === 'post' || p.type === 'collab_post');
  const specialCards = posts.filter(p => p.type === 'suggested_user' || p.type === 'pulse_battle');

  // Sort normal posts by SKRIM SCORE
  normalPosts.sort((a,b) => b.skrimScore - a.skrimScore);

  // Re-insert special cards roughly in their original relative positions
  const feed = [...normalPosts];
  let specialIndexOffset = 0;

  for (let i = 0; i < posts.length; i++) {
     if (posts[i].type === 'suggested_user' || posts[i].type === 'pulse_battle') {
        feed.splice(i, 0, posts[i]);
     }
  }

  return feed;
}
