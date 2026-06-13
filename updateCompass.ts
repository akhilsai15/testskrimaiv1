import * as fs from 'fs';

const filePath = 'src/screens/VibesScreen.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const mapCode = `
const MOOD_FILTER_MAP: Record<string, string[] | null> = {
  for_you: null,
  hype: ["motivation", "sports", "gaming", "dance"],
  funny: ["comedy", "entertainment"],
  feels: ["lifestyle", "chill", "romance", "music"],
  gaming: ["gaming"],
  food: ["food"],
  gym: ["fitness"],
  cricket: ["cricket", "sports"],
  music: ["music", "dance"],
  study: ["education", "tech"],
  global: ["travel", "culture", "news"],
  culture: ["culture", "fashion", "beauty"],
  dance: ["dance", "music"]
};
`;

content = content.replace(
  'const VIBE_COMPASS_MOODS = [',
  mapCode + '\nconst VIBE_COMPASS_MOODS = ['
);

content = content.replace(
  'const [compassOpacity, setCompassOpacity] = useState(1);',
  `const [compassOpacity, setCompassOpacity] = useState(1);
  const [feedTransitioning, setFeedTransitioning] = useState(false);
  const [emptyMoodMessage, setEmptyMoodMessage] = useState<string | null>(null);`
);

const handleMoodSelectTarget = `  const handleMoodSelect = (moodId: string, e: React.MouseEvent) => {
     setSelectedMood(moodId);
     localStorage.setItem("skrimchat_selected_mood", moodId);
     resetCompassTimer();

     // Scroll to center
     const target = e.currentTarget as HTMLElement;
     target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };`;

const handleMoodSelectReplacement = `  const handleMoodSelect = (moodId: string, e: React.MouseEvent) => {
     setSelectedMood(moodId);
     localStorage.setItem("skrimchat_selected_mood", moodId);
     resetCompassTimer();

     // Scroll to center
     if (e) {
       const target = e.currentTarget as HTMLElement;
       target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
     }

     const feedContainer = document.getElementById("vibes-feed-container");
     if (feedContainer) feedContainer.scrollTop = 0;
     setActiveIndex(0);

     setFeedTransitioning(true);
     setTimeout(() => setFeedTransitioning(false), 300);

     if (moodId !== "for_you") {
        const key = "skrimchat_mood_selections";
        const data = JSON.parse(localStorage.getItem(key) || "{}");
        data[moodId] = (data[moodId] || 0) + 1;
        localStorage.setItem(key, JSON.stringify(data));
     }
  };`;

content = content.replace(handleMoodSelectTarget, handleMoodSelectReplacement);

const filteredReelsTarget = `  const filteredReels = useMemo(() => {
    let filtered = reels;
    if (selectedMood && selectedMood !== "for_you") {
       filtered = reels.filter(r => (r.mood || "").toLowerCase() === selectedMood.toLowerCase() || (r.tags && r.tags.includes(selectedMood)));
       if (filtered.length === 0) filtered = reels; // Fallback if no matching mock content
    }
    return filtered;
  }, [reels, selectedMood]);`;

const filteredReelsReplacement = `  const filteredReels = useMemo(() => {
    if (!selectedMood || selectedMood === "for_you") {
      return reels;
    }
    const targetMoods = MOOD_FILTER_MAP[selectedMood];
    if (!targetMoods) {
      return reels;
    }

    const matching = reels.filter(vibe => targetMoods.includes(vibe.mood));
    
    if (matching.length === 0) {
      return reels;
    }

    let result = matching;
    if (matching.length < 5) {
      const nonMatching = reels.filter(vibe => !targetMoods.includes(vibe.mood));
      result = [...matching, ...nonMatching];
    }
    return result;
  }, [reels, selectedMood]);

  useEffect(() => {
    if (selectedMood && selectedMood !== "for_you") {
      const targetMoods = MOOD_FILTER_MAP[selectedMood];
      if (targetMoods && reels.length > 0) {
         const matching = reels.filter(vibe => targetMoods.includes(vibe.mood));
         if (matching.length === 0) {
            const moodLabel = VIBE_COMPASS_MOODS.find(m => m.id === selectedMood)?.label || selectedMood;
            setEmptyMoodMessage(\`No \${moodLabel} vibes yet!\\nShowing similar content instead ⚡\`);
            const timer = setTimeout(() => {
               setEmptyMoodMessage(null);
               setSelectedMood("for_you");
               localStorage.setItem("skrimchat_selected_mood", "for_you");
            }, 2000);
            return () => clearTimeout(timer);
         }
      }
    }
  }, [selectedMood, reels]);`;

content = content.replace(filteredReelsTarget, filteredReelsReplacement);

content = content.replace(
  'className={`w-full h-full bg-black relative snap-y snap-mandatory overflow-y-auto no-scrollbar ${isLateNight ? \'brightness-[0.85]\' : \'\'}`} onScroll=',
  'id="vibes-feed-container" className={`w-full h-full bg-black relative snap-y snap-mandatory overflow-y-auto no-scrollbar ${isLateNight ? \'brightness-[0.85]\' : \'\'} transition-all duration-300 ${feedTransitioning ? \'opacity-0 scale-95\' : \'opacity-100 scale-100\'}`} onScroll='
);

const emptyMoodUi = `
      {emptyMoodMessage && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100] animate-in fade-in zoom-in duration-300 pointer-events-none w-[90%]">
          <div className="mx-auto bg-[rgba(20,20,20,0.95)] backdrop-blur-md border border-[#B026FF] shadow-[0_0_20px_rgba(176,38,255,0.3)] px-6 py-5 rounded-2xl flex flex-col items-center text-center gap-2 max-w-[280px]">
            <span className="text-3xl mb-1">🌙</span>
            <span className="text-white text-[15px] font-bold leading-snug whitespace-pre-line">{emptyMoodMessage}</span>
          </div>
        </div>
      )}
`;

content = content.replace('      <VibesWatchCounter />', emptyMoodUi + '\n      <VibesWatchCounter />');

fs.writeFileSync(filePath, content);
console.log('Done');
