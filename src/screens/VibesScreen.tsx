import { Zap, MessageCircle, Share2, Music, Bookmark } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { AvatarWithRing } from '../components/ui';
import { ReactionRow } from '../components/ReactionRow';
import { triggerReactionAnimation } from '../lib/animations/reactionAnimations';
import { getReels } from '../lib/mock/mockServices';
import { FEATURE_FLAGS } from '../lib/config/featureFlags';

export default function VibesScreen() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [activeIndex, setActiveIndex] = useState(0);
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [isSavedMap, setIsSavedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchReels = async () => {
      setLoading(true);
      if (FEATURE_FLAGS.MOCK_MODE) {
        const fetchedReels = await getReels();
        setReels(fetchedReels);
        let savedList = JSON.parse(localStorage.getItem('skrimchat_saved_posts') || '[]');
        if (!Array.isArray(savedList)) savedList = [];
        const currentSavedMap: Record<string, boolean> = {};
        fetchedReels.forEach(r => {
           currentSavedMap[r.id] = savedList.includes(r.id);
        });
        setIsSavedMap(currentSavedMap);
      }
      setLoading(false);
    };
    fetchReels();
  }, []);

  return (
    <div className="w-full h-full bg-black relative snap-y snap-mandatory overflow-y-auto no-scrollbar">
      {toastMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 slide-out-to-top-4 duration-300 pointer-events-none">
          <div className="bg-[rgba(20,20,20,0.95)] backdrop-blur-md border border-[#B026FF] shadow-lg px-4 py-3 rounded-xl flex items-center gap-2 w-max max-w-[90vw]">
            <span className="text-white text-sm font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
      {/* Overlay Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50 pointer-events-none">
        <h1 className="text-xl font-bold text-white drop-shadow-md">Vibes</h1>
        <div className="text-white drop-shadow-md">
          <span className="text-sm font-semibold">Following</span> | <span className="text-sm font-semibold opacity-60">For You</span>
        </div>
      </div>

      {loading ? (
         <div className="w-full h-full flex items-center justify-center bg-skrim-bg">
            <div className="w-12 h-12 border-4 border-neon-purple/30 border-t-neon-purple rounded-full animate-spin" />
         </div>
      ) : reels.map((reel) => (
        <div key={reel.id} className="w-full h-full relative snap-start bg-skrim-bg shrink-0">
          {/* Mock Video Container */}
          <div id={`vibes-image-${reel.id}`} className="absolute inset-0">
            <img src={reel.videoImageHover} alt="reel" className="w-full h-full object-cover" />
            {/* Gradient Overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
          </div>

          {/* Right Action Bar */}
          <div className="absolute right-4 bottom-28 flex flex-col items-center gap-6 z-10">
             <div className="flex flex-col items-center gap-1 cursor-pointer group">
               <div className="p-3 bg-black/40 backdrop-blur-md rounded-full group-hover:scale-110 transition-transform">
                 <Zap className="w-7 h-7 text-white fill-transparent group-hover:text-[#B026FF] group-hover:fill-[#B026FF] transition-colors" />
               </div>
               <span className="text-xs font-semibold drop-shadow-lg text-white">{reel.likes}</span>
             </div>
             
             <div className="flex flex-col items-center gap-1 cursor-pointer group">
               <div className="p-3 bg-black/40 backdrop-blur-md rounded-full group-active:scale-90 transition-transform">
                 <MessageCircle className="w-7 h-7 text-white fill-transparent group-hover:text-[#00F0FF] transition-colors" />
               </div>
               <span className="text-xs font-semibold drop-shadow-lg text-white">{reel.comments}</span>
             </div>
             
             <div className="flex flex-col items-center gap-1 cursor-pointer group">
               <div className="p-3 bg-black/40 backdrop-blur-md rounded-full group-active:scale-90 transition-transform">
                 <Share2 className="w-7 h-7 text-white fill-transparent group-hover:text-blue-400 transition-colors" />
               </div>
               <span className="text-xs font-semibold drop-shadow-lg text-white">{reel.shares}</span>
             </div>

             <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => {
                 let savedList = JSON.parse(localStorage.getItem('skrimchat_saved_posts') || '[]');
                 if (!Array.isArray(savedList)) savedList = [];
                 let isSaving = false;
                 
                 if (savedList.includes(reel.id)) {
                     savedList = savedList.filter((id: string) => id !== reel.id);
                     setToastMessage("Removed from saved");
                 } else {
                     savedList.push(reel.id);
                     isSaving = true;
                     setToastMessage("✅ Saved to your collection!");
                 }
                 localStorage.setItem('skrimchat_saved_posts', JSON.stringify(savedList));
                 setTimeout(() => setToastMessage(""), 2500);

                 setIsSavedMap({ ...isSavedMap, [reel.id]: isSaving });
             }}>
               <div className="p-3 bg-black/40 backdrop-blur-md rounded-full group-hover:scale-110 transition-transform">
                 <Bookmark className={`w-7 h-7 transition-colors ${isSavedMap[reel.id] ? "text-[#B026FF] fill-[#B026FF]" : "text-white fill-transparent group-hover:text-[#B026FF]"}`} />
               </div>
               <span className="text-xs font-semibold drop-shadow-lg text-white">{isSavedMap[reel.id] ? "Saved" : "Save"}</span>
             </div>

             <div className="w-10 h-10 rounded-full mt-4 border-2 border-white overflow-hidden animate-[spin_8s_linear_infinite]">
                 <img src={reel.avatar} alt="audio" className="w-full h-full object-cover" />
             </div>
          </div>

          {/* Bottom Info Bar */}
          <div className="absolute bottom-24 left-4 right-20 z-10 flex flex-col gap-2">
            <div className="flex items-center gap-2">
               <AvatarWithRing src={reel.avatar} size="sm" isStory={true} />
               <h3 className="font-bold text-[15px] drop-shadow-lg flex items-center gap-2 text-white">
                 {reel.user}
                 <button className="text-[11px] px-2 py-0.5 rounded border border-white/50 text-white font-semibold flex items-center">Follow</button></h3>
            </div>
            <p className="text-sm font-medium text-white/90 drop-shadow-md leading-snug">
               {reel.caption.split(' ').map((word: string, i: number) => word.startsWith('#') ? <span key={i} className="font-bold text-white">{word} </span> : word + ' ')}
            </p>
            <div className="flex items-center gap-2 mt-1">
               <Music className="w-3 h-3 text-white drop-shadow" />
               <span className="text-xs text-white drop-shadow-md overflow-hidden text-ellipsis whitespace-nowrap marquee w-48">{reel.audio}</span>
            </div>
            {reel.reactions && (
              <div className="mt-2 w-64 md:w-80">
                 <ReactionRow 
                   initialReactions={reel.reactions} 
                   className="!pb-0" 
                   onReact={(reactionId, reaction) => {
                     if (reactionId && reaction) {
                       const container = document.getElementById(`vibes-image-${reel.id}`);
                       if (container) triggerReactionAnimation(container, reactionId, reaction.emoji);
                     }
                   }}
                 />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
