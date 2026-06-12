import { Zap, MessageCircle, Share2, Music, Bookmark, Heart, Instagram, Twitter, Facebook, Link as LinkIcon, Send, Sparkles, X, Mail } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { AvatarWithRing } from '../components/ui';
import { ReactionRow } from '../components/ReactionRow';
import { triggerReactionAnimation } from '../lib/animations/reactionAnimations';
import { getReels } from '../lib/mock/mockServices';
import { FEATURE_FLAGS } from '../lib/config/featureFlags';
import { AnimatePresence, motion } from 'framer-motion';

const MOCK_COMMENTS = [
  { id: 1, user: '@user1', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1', text: 'Great video! 🔥', time: '2h ago', likes: 24 },
  { id: 2, user: '@user2', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2', text: 'Amazing content 💜', time: '5h ago', likes: 12 },
];

const VibeCard = ({ reel, isSavedMap, setIsSavedMap, setToastMessage }: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [showPauseIcon, setShowPauseIcon] = useState(false);
  const [showDoubleTapFlash, setShowDoubleTapFlash] = useState(false);
  const lastTapTime = useRef(0);
  const tapTimeoutRef = useRef<any>(null);
  
  const [isLiked, setIsLiked] = useState(false);
  const [likeAnim, setLikeAnim] = useState('');
  
  const initialLikes = parseInt(String(reel.likes).replace('K', '000'), 10) || 0;
  const [likeCount, setLikeCount] = useState(initialLikes);

  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    let following = JSON.parse(localStorage.getItem('skrimchat_following') || '[]');
    if (following.includes(reel.handle)) {
      setIsFollowing(true);
    }
  }, [reel.handle]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) {
            if (!showComments && !showShare) {
                video.play().catch(() => {});
                setIsPaused(false);
            }
        } else {
            video.pause();
            video.currentTime = 0;
        }
      });
    }, { threshold: 0.7 });

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }
    return () => observer.disconnect();
  }, [showComments, showShare]);

  useEffect(() => {
    if (showComments || showShare) {
       videoRef.current?.pause();
    } else {
       if (!isPaused) {
          videoRef.current?.play().catch(() => {});
       }
    }
  }, [showComments, showShare, isPaused]);

  const handleVideoTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapTime.current < DOUBLE_TAP_DELAY) {
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      lastTapTime.current = 0;
      
      setShowDoubleTapFlash(true);
      setTimeout(() => setShowDoubleTapFlash(false), 600);
      
      if (!isLiked) {
         handleLike();
      }
      return;
    }
    
    lastTapTime.current = now;
    
    tapTimeoutRef.current = setTimeout(() => {
      if (video.paused) {
        video.play().catch(() => {});
        setIsPaused(false);
        setShowPlayIcon(true);
        setTimeout(() => setShowPlayIcon(false), 1500);
      } else {
        video.pause();
        setIsPaused(true);
        setShowPauseIcon(true);
        setTimeout(() => setShowPauseIcon(false), 1000);
      }
    }, DOUBLE_TAP_DELAY);
  };

  const handleLike = () => {
    setLikeAnim('');
    setTimeout(() => {
      if (isLiked) {
         setLikeAnim('like-pop-b');
         setLikeCount(prev => prev - 1);
      } else {
         setLikeAnim('like-pop-a');
         setLikeCount(prev => prev + 1);
         const container = document.getElementById(`vibes-image-${reel.id}`);
         if (container) {
           for(let i=0; i<5; i++) {
             const heart = document.createElement('div');
             heart.className = 'heart-particle text-red-500 font-bold';
             heart.innerText = '❤️';
             heart.style.setProperty('--tx', `${(Math.random() - 0.5) * 150}px`);
             heart.style.setProperty('--ty', `${(Math.random() - 0.5) * 150 - 50}px`);
             container.appendChild(heart);
             setTimeout(() => heart.remove(), 600);
           }
         }
      }
      setIsLiked(!isLiked);
    }, 10);
  };

  const handleFollow = () => {
    let following = JSON.parse(localStorage.getItem('skrimchat_following') || '[]');
    if (isFollowing) {
      following = following.filter((h: string) => h !== reel.handle);
      setIsFollowing(false);
    } else {
      following.push(reel.handle);
      setIsFollowing(true);
    }
    localStorage.setItem('skrimchat_following', JSON.stringify(following));
  };

  const formatCount = (num: number) => {
    if (num >= 1000) return (num/1000).toFixed(1).replace('.0','') + 'K';
    return num;
  };

  return (
    <div className="w-full h-full relative snap-start bg-skrim-bg shrink-0 overflow-hidden">
      <div id={`vibes-image-${reel.id}`} className="absolute inset-0" onClick={handleVideoTap}>
        <video 
           ref={videoRef}
           autoPlay 
           loop 
           playsInline 
           muted={false} 
           preload="auto"
           poster={reel.videoImageHover}
           className="w-full h-full object-cover"
           src="https://www.w3schools.com/html/mov_bbb.mp4"
           onError={(e) => console.log('Video play error handled gracefully', e)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
        
        {showPauseIcon && (
          <div className="absolute top-1/2 left-1/2 -mt-[48px] -ml-[48px] bg-black/60 backdrop-blur-[8px] rounded-full w-[96px] h-[96px] border-2 border-[#B026FF] flex items-center justify-center animate-spring-pop pointer-events-none z-20">
            <div className="flex gap-2">
              <svg width="28" height="40" viewBox="0 0 24 36" fill="#B026FF" className="drop-shadow-[0_0_12px_#B026FF] drop-shadow-[0_0_24px_rgba(176,38,255,0.5)]">
                <path d="M12.5 0L0 20h10l-2 16 16-24H12z" />
              </svg>
              <svg width="28" height="40" viewBox="0 0 24 36" fill="#B026FF" className="drop-shadow-[0_0_12px_#B026FF] drop-shadow-[0_0_24px_rgba(176,38,255,0.5)]">
                <path d="M12.5 0L0 20h10l-2 16 16-24H12z" />
              </svg>
            </div>
          </div>
        )}
        {showPlayIcon && (
          <div className="absolute top-1/2 left-1/2 -mt-[48px] -ml-[48px] bg-black/60 backdrop-blur-[8px] rounded-full w-[96px] h-[96px] border-2 border-[#B026FF] flex items-center justify-center animate-spring-pop pointer-events-none z-20">
            <div className="absolute w-full h-full rounded-full border-2 border-[#B026FF] animate-play-pulse" />
            <svg width="72" height="72" viewBox="0 0 24 36" fill="#B026FF" className="drop-shadow-[0_0_12px_#B026FF] drop-shadow-[0_0_24px_rgba(176,38,255,0.5)] transform translate-x-1">
               <path d="M12.5 0L0 20h10l-2 16 16-24H12z" />
            </svg>
          </div>
        )}
        {showDoubleTapFlash && (
          <div className="absolute top-1/2 left-1/2 -mt-[36px] -ml-[36px] flex items-center justify-center animate-double-tap-flash pointer-events-none z-20">
            <div className="absolute w-full h-full rounded-full border border-[#B026FF] animate-play-pulse" />
            <svg width="72" height="72" viewBox="0 0 24 36" fill="#B026FF" className="drop-shadow-[0_0_12px_#B026FF] drop-shadow-[0_0_24px_rgba(176,38,255,0.5)]">
               <path d="M12.5 0L0 20h10l-2 16 16-24H12z" />
            </svg>
          </div>
        )}
      </div>

      {/* Right Action Bar */}
      <div className="absolute right-4 bottom-28 flex flex-col items-center gap-6 z-10">
         <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={handleLike}>
           <div className={`p-3 bg-black/40 backdrop-blur-md rounded-full transition-transform ${likeAnim}`}>
             {isLiked ? (
               <Heart className="w-7 h-7 text-red-500 fill-red-500 drop-shadow-[0_0_8px_#FF0000]" />
             ) : (
               <Heart className="w-7 h-7 text-white fill-transparent transition-colors shadow-sm" />
             )}
           </div>
           <span className="text-xs font-semibold drop-shadow-lg text-white">
               {formatCount(likeCount)}
           </span>
         </div>
         
         <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => setShowComments(true)}>
           <div className="p-3 bg-black/40 backdrop-blur-md rounded-full group-active:scale-90 transition-transform">
             <MessageCircle className="w-7 h-7 text-white fill-transparent group-hover:text-[#00F0FF] transition-colors" />
           </div>
           <span className="text-xs font-semibold drop-shadow-lg text-white">{reel.comments}</span>
         </div>
         
         <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => setShowShare(true)}>
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

         <div className="w-10 h-10 rounded-full mt-4 border-2 border-white overflow-hidden/80 animate-[spin_8s_linear_infinite]">
             <img src={reel.avatar} alt="audio" className="w-full h-full object-cover" />
         </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="absolute bottom-24 left-4 right-20 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
           <AvatarWithRing src={reel.avatar} size="sm" isStory={true} />
           <h3 className="font-bold text-[15px] drop-shadow-lg flex items-center gap-2 text-white">
             {reel.user}
             <button 
               onClick={handleFollow}
               className={`text-[11px] px-2 py-0.5 rounded transition-all active:scale-90 font-semibold flex items-center ${isFollowing ? 'border border-white text-white bg-transparent' : 'border-none text-white bg-[#B026FF]'}`}
             >
               {isFollowing ? '✓ Following' : '+ Follow'}
             </button>
           </h3>
        </div>
        <p className="text-sm font-medium text-white/90 drop-shadow-md leading-snug">
           {reel.caption.split(' ').map((word: string, i: number) => word.startsWith('#') ? <span key={i} className="font-bold text-white">{word} </span> : word + ' ')}
        </p>
        <div className="flex items-center gap-2 mt-1">
           <Music className="w-3 h-3 text-white drop-shadow" />
           <span className="text-xs text-white drop-shadow-md overflow-hidden text-ellipsis whitespace-nowrap marquee w-48">{reel.audio}</span>
        </div>
        {reel.reactions && (
          <div className="mt-2 w-64 md:w-80 pointer-events-auto">
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

      {/* COMMENTS SHEET */}
      <AnimatePresence>
        {showComments && (
           <>
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/60 z-30"
               onClick={() => setShowComments(false)}
             />
             <motion.div
               initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 300 }}
               className="absolute bottom-0 w-full h-[70%] bg-[rgba(20,20,20,0.95)] backdrop-blur-xl rounded-t-3xl z-40 border-t border-white/10 flex flex-col pt-2"
               drag="y"
               dragConstraints={{ top: 0 }}
               onDragEnd={(e, info) => {
                  if (info.offset.y > 100) setShowComments(false);
               }}
             >
               <div className="w-16 h-1.5 bg-white/20 rounded-full mx-auto mt-2 mb-2" />
               <div className="flex justify-center items-center px-6 pb-4 border-b border-white/10">
                 <h2 className="text-white font-bold text-lg">💬 Comments (142)</h2>
               </div>
               <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
                 {MOCK_COMMENTS.map(c => (
                   <div key={c.id} className="flex gap-3">
                     <img src={c.avatar} className="w-10 h-10 rounded-full" alt="avatar" />
                     <div className="flex-1">
                       <h4 className="text-sm font-semibold text-white/50">{c.user}</h4>
                       <p className="text-white text-[15px] leading-snug break-words mt-1">{c.text}</p>
                       <div className="flex gap-4 mt-2 text-xs text-white/40 font-semibold items-center">
                         <span>{c.time}</span>
                         <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {c.likes}</span>
                         <button className="hover:text-white transition-colors">Reply</button>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
               <div className="p-4 border-t border-white/10 flex items-center gap-3">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=currentUser" className="w-10 h-10 rounded-full border border-white/20" alt="avatar" />
                  <div className="flex-1 bg-white/5 rounded-full px-4 py-2 border border-white/10 flex items-center gap-2 overflow-hidden">
                    <input type="text" placeholder="Type a comment..." className="bg-transparent border-none outline-none text-white w-full text-sm placeholder:text-white/30" />
                    <button className="text-[#B026FF]"><Send className="w-4 h-4" /></button>
                  </div>
               </div>
             </motion.div>
           </>
        )}
      </AnimatePresence>

      {/* SHARE SHEET */}
      <AnimatePresence>
        {showShare && (
           <>
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/60 z-30"
               onClick={() => setShowShare(false)}
             />
             <motion.div
               initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 300 }}
               className="absolute bottom-0 w-full bg-[rgba(20,20,20,0.95)] backdrop-blur-xl rounded-t-3xl z-40 border-t border-white/10 pb-8 pt-2"
               drag="y"
               dragConstraints={{ top: 0 }}
               onDragEnd={(e, info) => {
                  if (info.offset.y > 100) setShowShare(false);
               }}
             >
               <div className="w-16 h-1.5 bg-white/20 rounded-full mx-auto mt-2 mb-2" />
               <div className="flex justify-center items-center px-6 pb-4 border-b border-white/10">
                 <h2 className="text-white font-bold text-lg">Share Vibe</h2>
               </div>
               
               {/* 2x3 Grid for external apps */}
               <div className="grid grid-cols-3 gap-y-6 gap-x-2 p-6 justify-items-center">
                 <div className="flex flex-col items-center gap-2">
                   <button className="w-16 h-16 bg-[#25D366] text-white rounded-2xl flex items-center justify-center text-3xl shadow-lg">💬</button>
                   <span className="text-xs text-white/70 font-semibold">WhatsApp</span>
                 </div>
                 <div className="flex flex-col items-center gap-2">
                   <button className="w-16 h-16 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white rounded-2xl flex items-center justify-center shadow-lg"><Instagram className="w-8 h-8" /></button>
                   <span className="text-xs text-white/70 font-semibold">Instagram</span>
                 </div>
                 <div className="flex flex-col items-center gap-2">
                   <button className="w-16 h-16 bg-black border border-white/20 text-white rounded-2xl flex items-center justify-center shadow-lg">
                     <span className="text-3xl font-black">X</span>
                   </button>
                   <span className="text-xs text-white/70 font-semibold">Twitter</span>
                 </div>
                 <div className="flex flex-col items-center gap-2">
                   <button className="w-16 h-16 bg-[#0088cc] text-white rounded-2xl flex items-center justify-center text-3xl shadow-lg">✈️</button>
                   <span className="text-xs text-white/70 font-semibold">Telegram</span>
                 </div>
                 <div className="flex flex-col items-center gap-2">
                   <button className="w-16 h-16 bg-[#1877F2] text-white rounded-2xl flex items-center justify-center shadow-lg"><Facebook className="w-8 h-8 fill-white" /></button>
                   <span className="text-xs text-white/70 font-semibold">Facebook</span>
                 </div>
                 <div className="flex flex-col items-center gap-2">
                   <button className="w-16 h-16 bg-[#FFFC00] text-black rounded-2xl flex items-center justify-center text-3xl shadow-lg">👻</button>
                   <span className="text-xs text-white/70 font-semibold">Snapchat</span>
                 </div>
               </div>

               <div className="px-6 space-y-3">
                 <button className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 transition-colors py-4 rounded-2xl text-white font-bold" onClick={() => {
                     navigator.clipboard.writeText(`https://skrim.chat/vibe/${reel.id}`);
                     setToastMessage("🔗 Link copied!");
                     setShowShare(false);
                 }}>
                   <LinkIcon className="w-5 h-5" /> Copy Link
                 </button>
                 <button className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 transition-colors py-4 rounded-2xl text-white font-bold" onClick={() => {
                     setToastMessage("📨 Sent in Connect!");
                     setShowShare(false);
                 }}>
                   <Mail className="w-5 h-5" /> Send in Connect
                 </button>
                 <button className="w-full flex items-center justify-center gap-2 bg-[#B026FF] hover:bg-[#971bd6] transition-colors py-4 rounded-2xl text-white font-bold" onClick={() => {
                     setToastMessage("⚡ Shared as Spark!");
                     setShowShare(false);
                 }}>
                   <Sparkles className="w-5 h-5" /> Share as Spark
                 </button>
               </div>
             </motion.div>
           </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default function VibesScreen() {
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
    <div className="w-full h-full bg-black relative snap-y snap-mandatory overflow-y-auto no-scrollbar" onScroll={(e) => {
        // very basic active index calculation just to be a good citizen
        const t = e.currentTarget;
        const i = Math.round(t.scrollTop / t.clientHeight);
        if (i !== activeIndex) setActiveIndex(i);
    }}>
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
        <div className="text-white drop-shadow-md flex gap-3">
          <span className="text-sm font-semibold cursor-pointer pointer-events-auto">Following</span>
          <span className="text-white/40">|</span>
          <span className="text-sm font-semibold opacity-60 cursor-pointer pointer-events-auto">For You</span>
        </div>
      </div>

      {loading ? (
         <div className="w-full h-full flex items-center justify-center bg-skrim-bg">
            <div className="w-12 h-12 border-4 border-neon-purple/30 border-t-neon-purple rounded-full animate-spin" />
         </div>
      ) : reels.map((reel, index) => (
         <VibeCard 
           key={reel.id} 
           reel={reel} 
           isSavedMap={isSavedMap} 
           setIsSavedMap={setIsSavedMap} 
           setToastMessage={setToastMessage}
           activeIndex={activeIndex}
           index={index}
         />
      ))}
    </div>
  );
}
