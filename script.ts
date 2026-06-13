import * as fs from 'fs';

const filePath = 'src/screens/VibesScreen.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add VIBE_COMPASS_MOODS constant above VibesScreen
const moodsConst = `
const VIBE_COMPASS_MOODS = [
  { id: "for_you", label: "For You", emoji: "⚡" },
  { id: "hype", label: "Hype", emoji: "🔥" },
  { id: "funny", label: "Funny", emoji: "😂" },
  { id: "feels", label: "Feels", emoji: "💜" },
  { id: "gaming", label: "Gaming", emoji: "🎮" },
  { id: "food", label: "Food", emoji: "🍕" },
  { id: "gym", label: "Gym", emoji: "💪" },
  { id: "cricket", label: "Cricket", emoji: "🏏" },
  { id: "music", label: "Music", emoji: "🎵" },
  { id: "study", label: "Study", emoji: "📚" },
  { id: "global", label: "Global", emoji: "🌍" },
  { id: "culture", label: "Culture", emoji: "🎭" },
  { id: "dance", label: "Dance", emoji: "💃" }
];
`;

content = content.replace('export default function VibesScreen() {', moodsConst + '\nexport default function VibesScreen() {');

// 2. Add state and effect logic inside VibesScreen
const stateVars = `
  const [selectedMood, setSelectedMood] = useState<string>("for_you");
  const [compassOpacity, setCompassOpacity] = useState(1);
  const compassTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetCompassTimer = useCallback(() => {
     setCompassOpacity(1);
     if (compassTimerRef.current) clearTimeout(compassTimerRef.current);
     compassTimerRef.current = setTimeout(() => {
        setCompassOpacity(0.2);
     }, 3000);
  }, []);

  useEffect(() => {
     resetCompassTimer();
     return () => { if (compassTimerRef.current) clearTimeout(compassTimerRef.current); };
  }, [activeIndex, resetCompassTimer]);

  useEffect(() => {
     const stored = localStorage.getItem("skrimchat_selected_mood");
     if (stored) setSelectedMood(stored);
  }, []);

  const handleMoodSelect = (moodId: string, e: React.MouseEvent) => {
     setSelectedMood(moodId);
     localStorage.setItem("skrimchat_selected_mood", moodId);
     resetCompassTimer();

     // Scroll to center
     const target = e.currentTarget as HTMLElement;
     target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  const filteredReels = useMemo(() => {
    let filtered = reels;
    if (selectedMood && selectedMood !== "for_you") {
       filtered = reels.filter(r => (r.mood || "").toLowerCase() === selectedMood.toLowerCase() || (r.tags && r.tags.includes(selectedMood)));
       if (filtered.length === 0) filtered = reels; // Fallback if no matching mock content
    }
    return filtered;
  }, [reels, selectedMood]);
`;

content = content.replace('const [isSavedMap, setIsSavedMap] = useState<Record<string, boolean>>({});', 'const [isSavedMap, setIsSavedMap] = useState<Record<string, boolean>>({});\n' + stateVars);

// 3. Make sure useCallback and useMemo are imported, they might already be if we check but let's conditionally add
if (!content.includes('useCallback')) {
    content = content.replace("import React, { useState, useEffect, useRef }", "import React, { useState, useEffect, useRef, useCallback, useMemo }");
} else if (!content.includes('useMemo')) {
    content = content.replace("useCallback", "useCallback, useMemo");
}

let importChange = false;
if (!content.includes('useCallback') && content.includes('import React, { useState, useEffect, useRef } from \'react\';')) {
   content = content.replace("import React, { useState, useEffect, useRef } from 'react';", "import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';");
   importChange = true;
} else if (!content.includes('useCallback') && content.includes('{ useState, useEffect, useRef }')) {
    content = content.replace("{ useState, useEffect, useRef }", "{ useState, useEffect, useRef, useCallback, useMemo }");
    importChange = true;
} else if (!content.includes('useMemo') && content.includes('useCallback')) {
    content = content.replace("useCallback", "useCallback, useMemo");
    importChange = true;
}

if (!importChange && !content.includes('useCallback')) {
    content = "import { useCallback, useMemo } from 'react';\n" + content;
}

// 4. Update the render loop to use filteredReels instead of reels
// But wait, the rendering map is at the bottom.
content = content.replace('reels.map((reel, index) => (', 'filteredReels.map((reel, index) => (');

// 5. Add UI right before the end of return div
const compassUi = `
      {/* VIBE COMPASS */}
      <div 
        className="absolute bottom-[70px] left-0 right-0 z-[60] overflow-x-auto no-scrollbar pointer-events-auto transition-opacity duration-300 px-4 py-2 flex gap-2 w-full"
        style={{ opacity: compassOpacity }}
        onScroll={resetCompassTimer}
        onTouchStart={resetCompassTimer}
      >
         {VIBE_COMPASS_MOODS.map(mood => {
            const isSelected = selectedMood === mood.id;
            return (
               <motion.button
                 key={mood.id}
                 onClick={(e) => handleMoodSelect(mood.id, e as any)}
                 whileTap={{ scale: 0.95 }}
                 className={\`flex items-center gap-1.5 whitespace-nowrap rounded-[20px] px-[14px] py-[6px] transition-all duration-200 \${isSelected ? 'bg-[#B026FF] shadow-[0_0_12px_#B026FF] text-white font-bold scale-[1.05]' : 'bg-[rgba(20,20,30,0.5)] backdrop-blur-md border border-white/15 text-white text-[13px]'}\`}
               >
                 <span>{mood.emoji}</span>
                 <span>{mood.label}</span>
               </motion.button>
            )
         })}
      </div>
`;

content = content.replace('</AnimatePresence>\n\n    </div>', '</AnimatePresence>\n' + compassUi + '\n    </div>');

fs.writeFileSync(filePath, content);
console.log("Applied Vibe Compass modifications.")
