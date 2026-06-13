import { Zap, MessageCircle, Share2, Music, Bookmark, Heart, Instagram, Twitter, Facebook, Link as LinkIcon, Send, Sparkles, X, Mail } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { AvatarWithRing } from '../components/ui';
import { ReactionRow } from '../components/ReactionRow';
import { triggerReactionAnimation } from '../lib/animations/reactionAnimations';
import { getReels } from '../lib/mock/mockServices';
import { mockUsers } from '../lib/mock/mockData';
import { FEATURE_FLAGS } from '../lib/config/featureFlags';
import { AnimatePresence, motion } from 'framer-motion';

const getRelativeTime = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days/7)}w ago`;
};

const MOCK_COMMENTS = [
  {
    commentId: "mock_c1",
    username: "@dolly_ka_dhaba",
    displayName: "Dolly",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dolly",
    text: "This is fire! 🔥",
    createdAt: Date.now() - 3600000,
    likes: 24,
    replies: []
  },
  {
    commentId: "mock_c2",
    username: "@marcus_k",
    displayName: "Marcus",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
    text: "Absolutely loved this! 💜",
    createdAt: Date.now() - 7200000,
    likes: 12,
    replies: []
  },
  {
    commentId: "mock_c3",
    username: "@sarah_j",
    displayName: "Sarah",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    text: "Keep it up! You're amazing ⚡",
    createdAt: Date.now() - 10800000,
    likes: 8,
    replies: []
  }
];

const VibeCard = ({ reel, isSavedMap, setIsSavedMap, setToastMessage }: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [showPauseIcon, setShowPauseIcon] = useState(false);
  const [showPulseScreenFlash, setShowPulseScreenFlash] = useState(false);
  const lastTapTime = useRef(0);
  const tapTimeoutRef = useRef<any>(null);
  
  const [isPulsed, setIsPulsed] = useState(false);
  const [pulseAnim, setPulseAnim] = useState('');
  const [countAnim, setCountAnim] = useState('');
  
  const user = useCurrentUser();
  
  const currentProfile = {
      username: user?.username ? (user.username.startsWith('@') ? user.username : `@${user.username}`) : '@' + mockUsers[1].username,
      displayName: user?.displayName || user?.name || mockUsers[1].displayName,
      avatar: user?.avatar || mockUsers[1].avatar
  };

  const initialPulse = parseInt(String(reel.pulseCount).replace('K', '000').replace('M', '000000'), 10) || 0;
  const [pulseCount, setPulseCount] = useState(initialPulse);

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string, username: string } | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentCount, setCommentCount] = useState(() => {
    const saved = JSON.parse(localStorage.getItem(`skrimchat_comments_${reel.id}`) || '[]');
    return MOCK_COMMENTS.length + saved.length;
  });
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const commentsScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [showShare, setShowShare] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (showComments) {
      const key = `skrimchat_comments_${reel.id}`;
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      const allComments = [...MOCK_COMMENTS, ...saved];
      const uniqueComments = Array.from(new Map(allComments.map(c => [c.commentId, c])).values());
      
      setComments(uniqueComments);
      setCommentCount(uniqueComments.length);
      
      setTimeout(() => {
        if (commentsScrollRef.current) {
          commentsScrollRef.current.scrollTop = commentsScrollRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [showComments, reel.id]);

  const handleSendComment = () => {
    if (!commentText.trim()) return;

    const currentText = commentText.trim();
    setCommentText(''); // Clear instantly
    
    const currentUserInfo = {
      username: currentProfile.username,
      displayName: currentProfile.displayName,
      avatar: currentProfile.avatar
    };

    const newComment = {
      commentId: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      vibeId: reel.id,
      username: currentUserInfo.username,
      avatar: currentUserInfo.avatar,
      displayName: currentUserInfo.displayName,
      text: currentText,
      createdAt: Date.now(),
      likes: 0,
      isLiked: false,
      replies: []
    };

    const key = `skrimchat_comments_${reel.id}`;
    let existing = JSON.parse(localStorage.getItem(key) || '[]');
    
    if (replyingTo) {
        setComments(prev => {
            return prev.map(c => {
                if (c.commentId === replyingTo.id) {
                    return {
                        ...c,
                        replies: [...(c.replies || []), newComment]
                    };
                }
                return c;
            })
        });
        
        // Find existing parent in localStorage if real comment
        const exIdx = existing.findIndex((c: any) => c.commentId === replyingTo.id);
        if (exIdx !== -1) {
            existing[exIdx].replies = existing[exIdx].replies || [];
            existing[exIdx].replies.push(newComment);
            localStorage.setItem(key, JSON.stringify(existing));
        } else {
            const mockParent = comments.find(c => c.commentId === replyingTo.id);
            if (mockParent) {
                const clonedParent = JSON.parse(JSON.stringify(mockParent));
                clonedParent.replies = clonedParent.replies || [];
                clonedParent.replies.push(newComment);
                existing.push(clonedParent);
                localStorage.setItem(key, JSON.stringify(existing));
            }
        }
    } else {
        setComments(prev => [...prev, newComment]);
        setCommentCount(prev => prev + 1);
        existing.push(newComment);
        localStorage.setItem(key, JSON.stringify(existing));
        
        setTimeout(() => {
          if (commentsScrollRef.current) {
            commentsScrollRef.current.scrollTop = commentsScrollRef.current.scrollHeight;
          }
        }, 100);
    }

    setCommentText('');
    setReplyingTo(null);
  };

  const handleToggleCommentLike = (commentId: string) => {
    setComments(prev => prev.map(c => {
      if (c.commentId === commentId) {
        const nextLiked = !c.isLiked;
        const updated = { 
          ...c, 
          isLiked: nextLiked, 
          likes: (c.likes || 0) + (nextLiked ? 1 : -1) 
        };
        
        // Try to update in localStorage
        const key = `skrimchat_comments_${reel.id}`;
        let existing = JSON.parse(localStorage.getItem(key) || '[]');
        const idx = existing.findIndex((ec: any) => ec.commentId === commentId);
        if (idx !== -1) {
          existing[idx] = updated;
          localStorage.setItem(key, JSON.stringify(existing));
        }

        return updated;
      }
      return c;
    }));
  };

  useEffect(() => {
    const pulsed = JSON.parse(localStorage.getItem('skrimchat_pulsed_vibes') || '[]');
    setIsPulsed(pulsed.includes(reel.id));
  }, [reel.id]);

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
      
      setShowPulseScreenFlash(true);
      setTimeout(() => setShowPulseScreenFlash(false), 300);

      const container = document.getElementById(`vibes-image-${reel.id}`);
      if (container) {
          const flash = document.createElement('div');
          flash.className = 'absolute top-1/2 left-1/2 -mt-[60px] -ml-[60px] pointer-events-none z-30';
          flash.style.animation = 'bigFlash 800ms forwards';
          flash.innerHTML = '<svg width="120" height="120" viewBox="0 0 24 36" fill="#B026FF" class="drop-shadow-[0_0_30px_#B026FF] drop-shadow-[0_0_60px_rgba(176,38,255,0.5)]"><path d="M12.5 0L0 20h10l-2 16 16-24H12z"/></svg>';
          container.appendChild(flash);
          setTimeout(() => flash.remove(), 800);
      }
      
      if (!isPulsed) {
         handlePulse();
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

  const savePulseState = (vibeId: string, pulsedState: boolean) => {
    const pulsed = JSON.parse(localStorage.getItem("skrimchat_pulsed_vibes") || "[]");
    if (pulsedState) {
      if (!pulsed.includes(vibeId)) pulsed.push(vibeId);
    } else {
      const index = pulsed.indexOf(vibeId);
      if (index > -1) pulsed.splice(index, 1);
    }
    localStorage.setItem("skrimchat_pulsed_vibes", JSON.stringify(pulsed));
  };

  const handlePulse = () => {
    setPulseAnim('');
    setCountAnim('');
    setTimeout(() => {
      const nextPulsed = !isPulsed;
      setIsPulsed(nextPulsed);
      setPulseCount(prev => nextPulsed ? prev + 1 : prev - 1);
      setPulseAnim('animate-pulse-pop');
      setCountAnim(nextPulsed ? 'count-up' : 'count-down');

      if (nextPulsed) {
         const container = document.getElementById(`pulse-btn-container-${reel.id}`);
         if (container) {
           const angles = [0, 45, 90, 135, 180, 225, 270, 315];
           angles.forEach(deg => {
             const dist = 40;
             const tx = Math.cos(deg * Math.PI / 180) * dist;
             const ty = Math.sin(deg * Math.PI / 180) * dist;
             const particle = document.createElement('div');
             particle.className = 'pulse-particle flex justify-center items-center';
             particle.innerHTML = '<svg width="8" height="12" viewBox="0 0 24 36" fill="#B026FF"><path d="M12.5 0L0 20h10l-2 16 16-24H12z"/></svg>';
             particle.style.setProperty('--tx', `${tx}px`);
             particle.style.setProperty('--ty', `${ty}px`);
             container.appendChild(particle);
             setTimeout(() => particle.remove(), 500);
           });

           const ring = document.createElement('div');
           ring.className = 'energy-ring';
           container.appendChild(ring);
           setTimeout(() => ring.remove(), 600);
         }
      }
      savePulseState(reel.id, nextPulsed);
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
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace('.0', '') + 'K';
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
           onError={() => console.log('Video play error handled gracefully')}
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
        {showPulseScreenFlash && (
          <div className="absolute inset-0 bg-[#B026FF26] animate-[fadeOut_300ms_ease-out_forwards] pointer-events-none z-20" />
        )}
      </div>

      {/* Right Action Bar */}
      <div className="absolute right-4 bottom-28 flex flex-col items-center gap-6 z-10">
         <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={(e) => { e.stopPropagation(); handlePulse(); }}>
           <div id={`pulse-btn-container-${reel.id}`} className={`p-3 bg-black/40 backdrop-blur-md rounded-full transition-transform ${pulseAnim} relative`}>
             {isPulsed ? (
               <svg width="28" height="28" viewBox="0 0 24 36" fill="#B026FF" className="drop-shadow-[0_0_8px_#B026FF] drop-shadow-[0_0_16px_rgba(176,38,255,0.4)]">
                 <path d="M12.5 0L0 20h10l-2 16 16-24H12z" />
               </svg>
             ) : (
               <svg width="28" height="28" viewBox="0 0 24 36" fill="rgba(255,255,255,0.7)" className="stroke-white/20 stroke-1 transition-colors group-hover:fill-white">
                 <path d="M12.5 0L0 20h10l-2 16 16-24H12z" />
               </svg>
             )}
           </div>
           <span className={`text-xs font-semibold drop-shadow-lg overflow-hidden h-[18px] block ${isPulsed ? 'text-[#B026FF] drop-shadow-[0_0_6px_rgba(176,38,255,0.6)]' : 'text-white'}`}>
               <div className={countAnim}>{formatCount(pulseCount)}</div>
           </span>
         </div>
         
         <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={(e) => { e.stopPropagation(); setShowComments(true); }}>
           <div className="p-3 bg-black/40 backdrop-blur-md rounded-full group-active:scale-90 transition-transform">
             <MessageCircle className="w-7 h-7 text-white fill-transparent group-hover:text-[#00F0FF] transition-colors" />
           </div>
           <span className="text-xs font-semibold drop-shadow-lg text-white">{formatCount(commentCount)}</span>
         </div>
         
         <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={(e) => { e.stopPropagation(); setShowShare(true); }}>
           <div className="p-3 bg-black/40 backdrop-blur-md rounded-full group-active:scale-90 transition-transform">
             <Share2 className="w-7 h-7 text-white fill-transparent group-hover:text-blue-400 transition-colors" />
           </div>
           <span className="text-xs font-semibold drop-shadow-lg text-white">{reel.shares}</span>
         </div>

         <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={(e) => {
             e.stopPropagation();
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
               className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30"
               onClick={() => setShowComments(false)}
             />
             <motion.div
               initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 300 }}
               className="absolute bottom-0 w-full h-[80%] bg-[#0f0f12]/90 backdrop-blur-3xl shadow-[0_-10px_50px_rgba(176,38,255,0.15)] rounded-t-[32px] z-40 flex flex-col pt-2 border-t border-[#B026FF]/40"
               drag="y"
               dragConstraints={{ top: 0 }}
               onDragEnd={(e, info) => {
                  if (info.offset.y > 100) setShowComments(false);
               }}
               onPointerDown={(e) => e.stopPropagation()}
             >
               <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-2 mb-2" />
               <div className="flex justify-between items-center px-6 pb-4 border-b border-white/5 mx-2">
                 <h2 className="text-white font-bold text-lg flex items-center gap-2">
                   <span className="bg-gradient-to-r from-[#B026FF] to-[#00F0FF] bg-clip-text text-transparent italic tracking-wider">Vibe Chat</span>
                   <span className="text-[10px] bg-white/10 px-2 flex items-center justify-center font-black py-0.5 rounded-full text-white/70">{commentCount}</span>
                 </h2>
               </div>
               <div ref={commentsScrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-hide">
                 {comments.map((c, idx) => (
                   <div key={`${c.commentId}_${idx}`} className="relative animate-commentSlideIn">
                     {c.replies && c.replies.length > 0 && (
                       <div className="absolute left-[19px] top-[48px] bottom-0 w-[2px] bg-gradient-to-b from-[#B026FF]/50 to-transparent rounded-full" />
                     )}
                     
                     <div className="flex gap-3 relative z-10">
                       <div className="shrink-0">
                         <div className="w-[40px] h-[40px] rounded-full p-[2px] bg-gradient-to-tr from-[#B026FF] to-[#00F0FF] shadow-[0_0_15px_rgba(176,38,255,0.2)]">
                           <img src={c.avatar} className="w-full h-full rounded-full object-cover border-[3px] border-[#0f0f12]" alt="avatar" />
                         </div>
                       </div>
                       <div className="flex-1 group">
                         <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-2xl rounded-tl-sm p-3.5 shadow-lg relative overflow-hidden transition-colors hover:bg-white/[0.06]">
                           <div className="absolute top-0 right-0 w-24 h-24 bg-[#B026FF]/20 blur-3xl rounded-full pointer-events-none" />
                           
                           <h4 className="text-[13px] font-bold text-[#00F0FF] flex items-center gap-2 drop-shadow-[0_0_4px_rgba(0,240,255,0.3)]">
                             {c.username}
                             <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse shadow-[0_0_8px_#00F0FF]" />
                           </h4>
                           <p className="text-white/95 text-[14px] leading-relaxed break-words mt-1 relative z-10">{c.text}</p>
                         </div>
                         
                         <div className="flex gap-5 mt-2 px-1 text-[11px] text-white/50 font-bold items-center tracking-wide">
                           <span>{getRelativeTime(c.createdAt)}</span>
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleToggleCommentLike(c.commentId); }}
                             className={`flex items-center gap-1.5 transition-all active:scale-95 ${c.isLiked ? 'text-[#B026FF] drop-shadow-[0_0_5px_#B026FF]' : 'hover:text-white'}`}
                           >
                             <Zap className="w-3.5 h-3.5" fill={c.isLiked ? '#B026FF' : 'transparent'} /> {c.likes || 0}
                           </button>
                           <button 
                             className="uppercase hover:text-[#00F0FF] transition-colors active:scale-95"
                             onClick={(e) => {
                               e.stopPropagation();
                               setReplyingTo({ id: c.commentId, username: c.username });
                               if (inputRef.current) inputRef.current.focus();
                             }}
                           >
                             Reply
                           </button>
                         </div>
                       </div>
                     </div>

                     {c.replies && c.replies.length > 0 && (
                       <div className="ml-[44px] mt-4 space-y-4 relative z-10">
                         {c.replies.map((reply: any, r_idx: number) => (
                           <div key={`${reply.commentId}_${r_idx}`} className="flex gap-2.5 animate-commentSlideIn relative group">
                             <div className="absolute left-[-25px] top-[14px] w-[16px] h-[2px] bg-[#B026FF]/40 rounded-r-full" />

                             <div className="shrink-0 mt-[-2px]">
                               <div className="w-[30px] h-[30px] rounded-full p-[1px] bg-[#B026FF]/60 shadow-[0_0_10px_rgba(176,38,255,0.2)]">
                                 <img src={reply.avatar} className="w-full h-full rounded-full object-cover border-[2px] border-[#0f0f12]" alt="avatar" />
                               </div>
                             </div>
                             <div className="flex-1">
                               <div className="bg-black/60 border border-white/5 rounded-2xl rounded-tl-sm p-3 outline outline-1 outline-transparent transition-colors group-hover:outline-[#B026FF]/30">
                                 <h4 className="text-[12px] font-bold text-[#e2a8ff] flex items-center gap-1.5 drop-shadow-[0_0_3px_rgba(176,38,255,0.4)]">
                                   {reply.username}
                                 </h4>
                                 <p className="text-white/80 text-[13px] leading-relaxed break-words mt-0.5 relative z-10">{reply.text}</p>
                               </div>
                               <div className="flex gap-4 mt-1.5 px-1 text-[10px] text-white/40 font-bold uppercase tracking-wider items-center">
                                 <span>{getRelativeTime(reply.createdAt)}</span>
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 ))}
                 <div ref={commentsEndRef} />
               </div>
               <div className="border-t border-[#B026FF]/30 bg-[#0a0a0c] flex flex-col relative z-50">
                 {replyingTo && (
                    <div className="flex justify-between items-center px-4 py-2 bg-[#B026FF]/10 mx-4 mt-3 rounded-lg border border-[#B026FF]/20 shadow-inner">
                      <span className="text-xs text-[#e2a8ff]">
                        Replying to <span className="font-bold text-[#00F0FF]">{replyingTo.username}</span>
                      </span>
                      <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-3.5 h-3.5 text-white/70" />
                      </button>
                    </div>
                  )}
                 <div className="p-4 py-6 flex items-center gap-3">
                   <img src={currentProfile.avatar} className="w-[42px] h-[42px] rounded-full border border-white/20 object-cover" alt="avatar" />
                   <form 
                     className="flex-1 flex items-center gap-2"
                     onSubmit={(e) => {
                       e.preventDefault();
                       handleSendComment();
                     }}
                   >
                     <input 
                       ref={inputRef}
                       type="text" 
                       value={commentText}
                       onChange={e => setCommentText(e.target.value)}
                       placeholder="Say something nice..." 
                       className="flex-1 bg-white/5 rounded-full px-5 border border-white/10 outline-none text-white text-[15px] placeholder:text-white/30 h-[48px] focus:border-[#00F0FF]/50 focus:shadow-[0_0_15px_rgba(0,240,255,0.15)] transition-all" 
                     />
                     <button 
                       type="submit"
                       disabled={!commentText.trim()}
                       style={{
                         background: commentText.trim() ? "linear-gradient(135deg, #B026FF, #00F0FF)" : "#222",
                         border: "none",
                         borderRadius: "50%",
                         width: 48,
                         height: 48,
                         display: "flex",
                         alignItems: "center",
                         justifyContent: "center",
                         cursor: commentText.trim() ? "pointer" : "not-allowed",
                         transition: "all 300ms",
                         opacity: commentText.trim() ? 1 : 0.5,
                         boxShadow: commentText.trim() ? "0 0 20px rgba(176,38,255,0.4)" : "none"
                       }}
                     >
                       <span className="text-[#09090b] text-[18px] leading-none ml-[-2px] mt-[2px] font-black tracking-tighter">➤</span>
                     </button>
                   </form>
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
