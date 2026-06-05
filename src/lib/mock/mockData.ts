const funnyUsers = [
  { name: "Bappu Bhai Sharma", username: "bappu_bhai", bio: "Chai peeta hoon,\n  sapne bechta hoon ☕🚀" },
  { name: "Pappu Pandey", username: "pappu_pass_hogaya", bio: "Finally passed 12th\n  in 5th attempt 🎓😂" },
  { name: "Sunita Williams Gupta", username: "sunita_not_astronaut", bio: "Naam sunita hai\n  space mein nahi gayi main 😅" },
  { name: "Raju Rastogi", username: "raju_3idiots_fan", bio: "All izz well 🙏\n  Engineering dropout\n  turned influencer 💪" },
  { name: "Dolly Devi Tiwari", username: "dolly_ka_dhaba", bio: "Khana banati hoon,\n  reels banati hoon,\n  dil jodti hoon ❤️🍛" },
  { name: "Chikoo Singh", username: "chikoo_bhai_official", bio: "Gym jaata hoon\n  lekin sirf selfie ke liye 💪😂" },
  { name: "Munni Lal Verma", username: "munni_badnaam_nahi", bio: "Content creator 📱\n  Ghar se hi kaam,\n  pyjame mein fame 😎" },
  { name: "Bablu Mechanic", username: "bablu_ka_garage", bio: "Car theek karta hoon,\n  dil bhi theek karta hoon 🔧❤️" },
  { name: "Pinky Patel", username: "pinky_se_pink_nahi", bio: "Surat se hoon,\n  dil se Mumbaikar 🌸" },
  { name: "Golu Mishra", username: "golu_fitness_goals", bio: "Roz gym jaata hoon,\n  roz samosa bhi khata hoon 🏋️🥟" },
];

export const mockUsers = Array.from({ length: 10 }).map((_, i) => ({
  id: `user_${i + 1}`,
  username: funnyUsers[i].username,
  displayName: funnyUsers[i].name,
  avatar: `https://i.pravatar.cc/150?img=${(i % 70) + 1}`,
  isVerified: i % 3 === 0,
  bio: funnyUsers[i].bio,
  followers: Math.floor(Math.random() * 100000),
  following: Math.floor(Math.random() * 1000),
}));

export const SKRIM_REACTIONS = [
  { id: 'pulse', emoji: '⚡', name: 'PULSE', color: '#B026FF' },
  { id: 'blaze', emoji: '🔥', name: 'BLAZE', color: '#FF6B00' },
  { id: 'vibe',  emoji: '💜', name: 'VIBE',  color: '#CC44FF' },
  { id: 'nova',  emoji: '🚀', name: 'NOVA',  color: '#FFFFFF' },
  { id: 'slay',  emoji: '😤', name: 'SLAY',  color: '#FF2D87' },
  { id: 'haunt', emoji: '👻', name: 'HAUNT', color: '#88AAFF' },
  { id: 'dead',  emoji: '💀', name: 'DEAD',  color: '#666666' },
  { id: 'wave',  emoji: '🌊', name: 'WAVE',  color: '#00F0FF' },
];

const funnyCaptions = [
  "Aaj ka chai session ☕\n  Zindagi mein problems hain\n  but chai toh hai 😌\n  #ChaiLovers #DesiVibes",
  "Gym selfie mandatory hai\n  bhai sahab 💪\n  Workout: 5 min\n  Selfie: 45 min 😂\n  #FitnessGoals #DesiGym",
  "Mummy ne haath se\n  banaya khana 🍛❤️\n  5 star restaurant ko\n  sharminda kar diya\n  #GharKaKhana #MaaKaHaath",
  "Traffic mein 2 ghante\n  maar diye 🚗😤\n  Lekin playlist fire thi 🔥\n  #MumbaiTraffic #DesiLife",
  "Wedding season shuru\n  ho gaya bhai 💍🎉\n  Shaadi mein khana free\n  isliye attendance 100% 😂\n  #ShaadiKaKhana #FreeFood",
];

export const mockPosts = Array.from({ length: 20 }).map((_, i) => ({
  id: `post_${i + 1}`,
  userId: mockUsers[i % mockUsers.length].id,
  user: mockUsers[i % mockUsers.length].displayName,
  handle: `@${mockUsers[i % mockUsers.length].username}`,
  avatar: mockUsers[i % mockUsers.length].avatar,
  image: `https://picsum.photos/400/400?random=${i}`,
  caption: funnyCaptions[i % funnyCaptions.length],
  likes: Math.floor(Math.random() * 50000),
  comments: Math.floor(Math.random() * 1000),
  shares: Math.floor(Math.random() * 500),
  time: `${i + 1}h ago`,
  audioContext: `♫ Trending Audio ${i}`,
  isLiked: false,
  isSaved: false,
  reactions: {
    pulse: 4200,
    blaze: 3100,
    vibe: 2800,
    nova: 1500,
    slay: 980,
    haunt: 750,
    dead: 3400,
    wave: 620
  }
}));

export const mockStories = Array.from({ length: 10 }).map((_, i) => ({
  id: `story_${i + 1}`,
  userId: mockUsers[i % mockUsers.length].id,
  user: mockUsers[i % mockUsers.length].username,
  avatar: mockUsers[i % mockUsers.length].avatar,
  image: `https://picsum.photos/400/700?random=${i + 100}`,
  hasStory: true,
  isAdd: false,
}));

export const mockReels = Array.from({ length: 10 }).map((_, i) => ({
  id: `reel_${i + 1}`,
  user: mockUsers[i % mockUsers.length].displayName,
  handle: `@${mockUsers[i % mockUsers.length].username}`,
  avatar: mockUsers[i % mockUsers.length].avatar,
  videoImageHover: `https://picsum.photos/400/700?random=${i + 200}`,
  caption: `Watching the sunset code run! 🌇🚀 #coding #reels #${i}`,
  audio: `Original Audio - ${mockUsers[i % mockUsers.length].displayName}`,
  likes: `${Math.floor(Math.random() * 100)}K`,
  comments: `${Math.floor(Math.random() * 5)}K`,
  shares: `${Math.floor(Math.random() * 10)}K`,
  reactions: {
    pulse: 4200,
    blaze: 3100,
    vibe: 2800,
    nova: 1500,
    slay: 980,
    haunt: 750,
    dead: 3400,
    wave: 620
  }
}));

export const mockChats = Array.from({ length: 5 }).map((_, i) => ({
  id: `chat_${i + 1}`,
  name: i === 2 ? "Creator Group Hub" : mockUsers[i % mockUsers.length].displayName,
  avatar: i === 2 ? "https://picsum.photos/100/100?random=999" : mockUsers[i % mockUsers.length].avatar,
  msg: `Hey, how are things going? Let's catch up later!`,
  time: `${i * 2 + 1}m`,
  unread: i === 0 || i === 2 ? Math.floor(Math.random() * 5) + 1 : 0,
  isVeil: i % 2 !== 0,
}));

export const mockMessages = Array.from({ length: 20 }).map((_, i) => ({
  id: `msg_${i + 1}`,
  senderId: i % 2 === 0 ? "me" : mockUsers[0].id,
  text: i % 2 === 0 ? "That sounds awesome! 😎" : "Check out this new feature I built today.",
  type: "text", // text, image, voice, gif
  time: "10:00 AM",
  read: true,
}));

export const mockNotifications = Array.from({ length: 10 }).map((_, i) => ({
  id: `notif_${i + 1}`,
  type: ["pulse", "comment", "mention", "follow"][i % 4],
  user: mockUsers[i % mockUsers.length].displayName,
  avatar: mockUsers[i % mockUsers.length].avatar,
  text: ["pulsed your post ⚡", "commented on your reel", "mentioned you in a story", "started following you"][i % 4],
  time: `${i + 1}h ago`,
  isRead: i > 2,
}));

export const mockCommunities = Array.from({ length: 5 }).map((_, i) => ({
  id: `comm_${i + 1}`,
  name: ["Chai Pe Charcha ☕", "Desi Developers 💻", "Bollywood Buffs 🎬", "Cricket Ke Deewane 🏏", "Street Food Lovers 🍛"][i],
  members: `${Math.floor(Math.random() * 50) + 1}K members`,
  avatar: `https://picsum.photos/100/100?random=${500 + i}`,
  isPaid: i === 2,
}));

export const mockAds = Array.from({ length: 3 }).map((_, i) => ({
  id: `ad_${i + 1}`,
  name: `Campaign ${i + 1}`,
  status: ["Active", "Paused", "Ended"][i],
  impressions: `${Math.floor(Math.random() * 500)}K`,
  clicks: `${Math.floor(Math.random() * 50)}K`,
  spend: `$${Math.floor(Math.random() * 1000)}`,
}));

export const mockCreatorStats = {
  totalViews: "1.2M",
  followersGrowth: "25.4K",
  reach: "850K",
  engagement: "12.6%",
  chartData: [20, 45, 28, 80, 99, 43, 65]
};

export const mockAdminData = {
  reportsQueue: 153,
  contentModeration: 24,
  userManagement: "8.4K",
  chartData: [100, 150, 120, 200, 180, 250, 300]
};
