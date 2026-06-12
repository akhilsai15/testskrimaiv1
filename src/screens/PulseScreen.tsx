import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AvatarWithRing } from '../components/ui';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Zap, SmilePlus, RefreshCw, X } from 'lucide-react';
import { getPosts, getSparks, likePost } from '../lib/mock/mockServices';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { motion, AnimatePresence } from 'motion/react';
import { SKRIM_REACTIONS } from '../lib/mock/mockData';
import { BadgeRow } from '../components/BadgeComponents';
import { ReactionRow } from '../components/ReactionRow';
import { triggerReactionAnimation } from '../lib/animations/reactionAnimations';
import { PulseCommentsSheet, PulseShareSheet } from '../components/PulseSheets';
import { generateMockStatsForBadge } from '../lib/mock/mockBadges';
import { incrementStat } from '../lib/mock/achievementEngine';

import { assembleFeed, getDefaultMood, MOODS, VELOCITY_MAP, generateSinglePost } from '../lib/mock/skrimAlgorithm';

import { SparkRow } from '../components/SparkRow';
import { SparkViewer } from '../components/SparkViewer';
import { SparkCreator } from '../components/SparkCreator';
import { StoryBehindSheet } from '../components/StoryBehindSheet';

function formatCount(num: number) {
  if (num >= 1000000) return (num/1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num/1000).toFixed(1) + 'K';
  return num.toString();
}

function FastLiveCounter({ count }: { count: number }) {
  const [isLive, setIsLive] = useState(false);
  const prevCount = useRef(count);

  useEffect(() => {
    if (count !== prevCount.current) {
      setIsLive(true);
      prevCount.current = count;
      const t = setTimeout(() => setIsLive(false), 2000);
      return () => clearTimeout(t);
    }
  }, [count]);

  return (
    <span className="text-xs font-bold text-[#B026FF] flex items-center whitespace-nowrap">
      <motion.span
        key={count}
        initial={{ y: 5, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
      >
        {formatCount(count)}
      </motion.span>
      {isLive && <span className="w-1.5 h-1.5 rounded-full bg-[#FF4444] ml-1 shrink-0" style={{ animation: 'livePulse 1s infinite' }} />}
    </span>
  );
}

export default function PulseScreen() {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const [posts, setPosts] = useState<any[]>([]);
  const [sparks, setSparks] = useState<any[]>([]);
  const [activeUserIndex, setActiveUserIndex] = useState<number | null>(null);
  const [isSparkCreatorOpen, setIsSparkCreatorOpen] = useState(false);

  const [viewedSparks, setViewedSparks] = useState<Set<string>>(() => {
    let parsed = JSON.parse(localStorage.getItem('skrimchat_viewed_sparks') || '[]');
    if (!Array.isArray(parsed)) parsed = [];
    return new Set(parsed);
  });

  const groupedSparks = React.useMemo(() => {
    let blockedUsers: string[] = [];
    try {
      blockedUsers = JSON.parse(localStorage.getItem('skrimchat_blocked_users') || '[]');
    } catch(e) {}

    const groups: { [key: string]: any } = {};
    const storedEnergyStr = localStorage.getItem('skrimchat_spark_energy');
    let storedEnergy = {};
    if (storedEnergyStr) {
      try { storedEnergy = JSON.parse(storedEnergyStr); } catch(e){}
    }

    const now = Date.now();
    sparks.forEach(spark => {
      if (spark.expiresAt && spark.expiresAt <= now) return; // Expired
      
      const processUserSparks = (targetUser: any, isTargetOwn: boolean) => {
        const userId = targetUser?.id || targetUser?.username || 'unknown';
        const username = targetUser?.username || targetUser?.handle?.replace('@', '');

        if (!isTargetOwn && blockedUsers.includes(username)) return; // Filter blocked

        const groupId = userId;

        if (!groups[groupId]) {
          groups[groupId] = {
            id: groupId,
            userId: userId, 
            user: isTargetOwn ? { ...targetUser, displayName: targetUser?.fullName, avatar: targetUser?.avatar || targetUser?.avatarUrl } : targetUser,
            isOwn: isTargetOwn,
            sparks: [],
            maxEnergy: 0
          };
        }
        
        const realEnergy = (storedEnergy as any)[spark.id]?.level || 0;
        if (realEnergy > groups[groupId].maxEnergy) {
          groups[groupId].maxEnergy = realEnergy;
        }
        
        // Prevent duplicate push if same user
        if (!groups[groupId].sparks.find((s:any) => s.id === spark.id)) {
           groups[groupId].sparks.push(spark);
        }
      };

      const isOwn = spark.isOwn || (spark.user?.username && spark.user?.username === currentUser?.username);
      
      // Default processor
      processUserSparks(isOwn ? currentUser : spark.user, isOwn);

      // Collab partner processor
      if (spark.isCollab && spark.status === 'accepted' && spark.collabPartner) {
        processUserSparks(spark.collabPartner, spark.collabPartner.username && spark.collabPartner.username === currentUser?.username);
      }
    });
    
    // Check viewed status for each user group
    Object.values(groups).forEach(group => {
      // Sort sparks within group newest first
      group.sparks.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));

      group.hasViewed = group.isOwn ? false : group.sparks.every((s: any) => viewedSparks.has(s.id) || s.hasViewed);
      // Pick highest energy for the ring
      group.energy = group.maxEnergy >= 90 ? 'NOVA' : group.maxEnergy >= 75 ? 'HOT' : group.maxEnergy >= 50 ? 'WARMING' : 'COLD';
      group.isChallenge = group.sparks.some((s: any) => s.isChallenge);
      group.isCollab = group.sparks.some((s: any) => s.isCollab);
      group.expiresAt = Math.max(...group.sparks.map((s: any) => s.expiresAt || Date.now() + 24 * 3600 * 1000));
    });

    const result = Object.values(groups);
    result.sort((a, b) => {
       if (a.isOwn && !b.isOwn) return -1;
       if (!a.isOwn && b.isOwn) return 1;
       
       // Sort unviewed before viewed
       if (!a.hasViewed && b.hasViewed) return -1;
       if (a.hasViewed && !b.hasViewed) return 1;

       // Then by newest spark creation time descending
       const aNewest = Math.max(...a.sparks.map((s: any) => s.createdAt || 0));
       const bNewest = Math.max(...b.sparks.map((s: any) => s.createdAt || 0));
       return bNewest - aNewest;
    });
    return result;
  }, [sparks, currentUser, viewedSparks]);

  const handleSparkViewed = useCallback((sparkId: string) => {
    setViewedSparks(prev => {
      if (prev.has(sparkId)) return prev;
      const next = new Set(prev);
      next.add(sparkId);
      localStorage.setItem('skrimchat_viewed_sparks', JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSparks(prevSparks => {
        const now = Date.now();
        const validSparks = prevSparks.filter(s => {
          return (!s.expiresAt || s.expiresAt > now);
        });
        if (validSparks.length !== prevSparks.length) {
          // Update local storage if needed
          const mySavedSparksStr = localStorage.getItem('skrimchat_sparks');
          let mySparks = mySavedSparksStr ? JSON.parse(mySavedSparksStr) : [];
          if (Array.isArray(mySparks)) {
            mySparks = mySparks.filter((s: any) => (s.expiresAt && s.expiresAt > now));
            if (mySparks.length > 0) {
              localStorage.setItem('skrimchat_sparks', JSON.stringify(mySparks));
            } else {
              localStorage.removeItem('skrimchat_sparks');
            }
          }
          return validSparks;
        }
        return prevSparks;
      });
    }, 5 * 60 * 1000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const handleSparkClick = (group: any) => {
    const index = groupedSparks.findIndex(g => g.userId === group.userId);
    if (index !== -1) {
      setActiveUserIndex(index);
    }
  };

  const handleAddSpark = () => {
    setIsSparkCreatorOpen(true);
  };

  const handleDeleteSpark = (sparkId: string) => {
    setSparks(prev => prev.filter(s => s.id !== sparkId));
  };

  const onPostSpark = (newSparkData: any) => {
    const newSpark = {
      ...newSparkData,
      id: newSparkData.id || `spark_${Date.now()}`,
      userId: currentUser.username,
      userName: currentUser.fullName,
      userAvatar: currentUser.avatar || currentUser.avatarUrl,
      user: currentUser,
      createdAt: newSparkData.createdAt || Date.now(),
      expiresAt: newSparkData.expiresAt || (Date.now() + (24 * 60 * 60 * 1000))
    };

    const savedStr = localStorage.getItem('skrimchat_sparks');
    let mySparks = savedStr ? JSON.parse(savedStr) : [];
    if (!Array.isArray(mySparks)) mySparks = [];
    mySparks = [newSpark, ...mySparks].sort((a: any, b: any) => b.createdAt - a.createdAt);
    localStorage.setItem('skrimchat_sparks', JSON.stringify(mySparks));
    
    setSparks(prev => {
      const others = prev.filter(s => !s.isOwn);
      return [...mySparks, ...others].sort((a: any, b: any) => b.createdAt - a.createdAt);
    });

    if (newSpark.mentions && newSpark.mentions.length > 0) {
      const savedMentionsStr = localStorage.getItem('skrimchat_mention_notifs');
      let mentionNotifs = savedMentionsStr ? JSON.parse(savedMentionsStr) : [];
      if (!Array.isArray(mentionNotifs)) mentionNotifs = [];
      newSpark.mentions.forEach((mention: string) => {
         let textMsg = `mentioned you in a Spark!\n"${newSpark.text?.length > 50 ? newSpark.text.substring(0, 50) + '...' : newSpark.text}"`;
         
         if (newSpark.type === 'image') {
           textMsg = `🖼️ @${currentUser.username} tagged you in an Image Spark!`;
         } else if (newSpark.type === 'video') {
           textMsg = `🎥 @${currentUser.username} tagged you in a Video Spark!`;
         }

         mentionNotifs.push({
            id: `mention_${Date.now()}_${Math.random()}`,
            user: currentUser.username,
            avatar: currentUser.avatar || currentUser.avatarUrl,
            type: 'mention',
            text: textMsg,
            isRead: false,
            time: 'Just now',
            sparkId: newSpark.id
         });
      });
      localStorage.setItem('skrimchat_mention_notifs', JSON.stringify(mentionNotifs));
    }

    if (newSpark.isCollab && newSpark.collabPartner) {
      const invite = {
        id: `collab_invite_${Date.now()}`,
        spark: newSpark,
        status: 'pending',
        createdAt: Date.now()
      };
      const savedInvitesStr = localStorage.getItem('skrimchat_collab_invites');
      let invites = savedInvitesStr ? JSON.parse(savedInvitesStr) : [];
      if (!Array.isArray(invites)) invites = [];
      invites.push(invite);
      localStorage.setItem('skrimchat_collab_invites', JSON.stringify(invites));

      setToastMessage(`Collab invite sent to @${newSpark.collabPartner.username?.replace('@', '') || newSpark.collabPartner.displayName}! ⚡`);
    } else {
      setToastMessage('⚡ Spark posted! Your friends can see it now!');
      // Open the viewer at index 0 (which is always the grouped sparks of the current user)
      setActiveUserIndex(0);
    }
    
    setTimeout(() => setToastMessage(''), 3000);
  };

  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [selectedMood, setSelectedMood] = useState(() => localStorage.getItem('skrimchat_mood') || getDefaultMood());
  const [pickerPostId, setPickerPostId] = useState<string | null>(null);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [activeSharePostId, setActiveSharePostId] = useState<string | null>(null);
  const [storyBehindPostId, setStoryBehindPostId] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pull to refresh variables
  const touchStartY = useRef(0);
  const touchMoveY = useRef(0);

  const loadMorePosts = useCallback(() => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setPosts(prev => {
        const newPosts = assembleFeed(selectedMood, prev.length, 5);
        
        let savedList = JSON.parse(localStorage.getItem('skrimchat_saved_posts') || '[]');
        if (!Array.isArray(savedList)) savedList = [];
        let savedCounts = JSON.parse(localStorage.getItem('skrimchat_post_counts') || '{}');
        if (!savedCounts || typeof savedCounts !== 'object') savedCounts = {};
        const syncedNewPosts = newPosts.map(p => ({
          ...p,
          isSaved: savedList.includes(p.id),
          comments: savedCounts[p.id]?.comments !== undefined ? Math.max(savedCounts[p.id].comments, p.comments || 0) : p.comments || 0,
          shares: savedCounts[p.id]?.shares !== undefined ? Math.max(savedCounts[p.id].shares, p.shares || 0) : p.shares || 0,
        }));

        const combined = [...prev, ...syncedNewPosts];
        // Enforce max 50 posts in memory
        return combined.length > 50 ? combined.slice(combined.length - 50) : combined;
      });
      setIsLoadingMore(false);
    }, 800);
  }, [isLoadingMore, selectedMood]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !isLoadingMore) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );
    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }
    return () => observer.disconnect();
  }, [loading, isLoadingMore, loadMorePosts]);

  useEffect(() => {
    const interval = setInterval(() => {
       setNewPostsCount(prev => prev + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (newPostsCount > 0) {
       timeout = setTimeout(() => {
          setNewPostsCount(0);
       }, 10000);
    }
    return () => clearTimeout(timeout);
  }, [newPostsCount]);

  useEffect(() => {
    const pulseTick = setInterval(() => {
      setPosts(currentPosts => currentPosts.map(post => {
        if (post.type === 'post' || post.type === 'collab_post') {
           const velocityMultiplier = VELOCITY_MAP[post.temperature?.id || 'COLD'] || 0.1;
           const increment = Math.floor(Math.random() * velocityMultiplier * 10);
           if (increment > 0) {
             return { ...post, likes: (post.likes || 0) + increment };
           }
        }
        if (post.type === 'pulse_battle') {
           const incrementA = Math.floor(Math.random() * 5);
           const incrementB = Math.floor(Math.random() * 5);
           return { 
             ...post, 
             totalVotes: (post.totalVotes || 0) + incrementA + incrementB,
             votesA: Math.min(99, Math.max(1, Math.round(((post.votesA * (post.totalVotes||0)) + incrementA) / ((post.totalVotes||0) + incrementA + incrementB) * 100))) || post.votesA,
             votesB: 100 - (Math.min(99, Math.max(1, Math.round(((post.votesA * (post.totalVotes||0)) + incrementA) / ((post.totalVotes||0) + incrementA + incrementB) * 100))) || post.votesA)
           };
        }
        return post;
      }));
    }, 3000);
    return () => clearInterval(pulseTick);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Fake network delay before fresh reset
    setTimeout(() => {
       const freshPosts = assembleFeed(selectedMood, 0, 5);
       
       let savedList = JSON.parse(localStorage.getItem('skrimchat_saved_posts') || '[]');
       if (!Array.isArray(savedList)) savedList = [];
       let savedCounts = JSON.parse(localStorage.getItem('skrimchat_post_counts') || '{}');
       if (!savedCounts || typeof savedCounts !== 'object') savedCounts = {};
       const syncedPosts = freshPosts.map(p => ({
         ...p,
         isSaved: savedList.includes(p.id),
         comments: savedCounts[p.id]?.comments !== undefined ? Math.max(savedCounts[p.id].comments, p.comments || 0) : p.comments || 0,
         shares: savedCounts[p.id]?.shares !== undefined ? Math.max(savedCounts[p.id].shares, p.shares || 0) : p.shares || 0,
       }));
       
       setPosts(syncedPosts);
       setNewPostsCount(0);
       setRefreshing(false);
    }, 1200);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
      touchMoveY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0 && touchStartY.current > 0) {
      touchMoveY.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = () => {
    if (touchStartY.current > 0 && touchMoveY.current - touchStartY.current > 100 && !refreshing) {
      handleRefresh();
    }
    touchStartY.current = 0;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const fetchedSparks = await getSparks();
      
      const mySavedSparksStr = localStorage.getItem('skrimchat_sparks');
      let mySparks = mySavedSparksStr ? JSON.parse(mySavedSparksStr) : [];
      if (!Array.isArray(mySparks)) mySparks = [];
      const validSparksForStorage = mySparks.filter((s: any) => (s.expiresAt && s.expiresAt > Date.now()));
      if (validSparksForStorage.length > 0) {
        localStorage.setItem('skrimchat_sparks', JSON.stringify(validSparksForStorage));
      } else {
        localStorage.removeItem('skrimchat_sparks');
      }
      mySparks = validSparksForStorage.filter((s: any) => s.expiresAt && s.expiresAt > Date.now());

      setSparks([...mySparks, ...fetchedSparks]);
      
      const initialPosts = assembleFeed(selectedMood, 0, 5);

      let savedList = JSON.parse(localStorage.getItem('skrimchat_saved_posts') || '[]');
      if (!Array.isArray(savedList)) savedList = [];
      let savedCounts = JSON.parse(localStorage.getItem('skrimchat_post_counts') || '{}');
      if (!savedCounts || typeof savedCounts !== 'object') savedCounts = {};
      const syncedPosts = initialPosts.map(p => ({
        ...p,
        isSaved: savedList.includes(p.id),
        comments: savedCounts[p.id]?.comments !== undefined ? Math.max(savedCounts[p.id].comments, p.comments || 0) : p.comments || 0,
        shares: savedCounts[p.id]?.shares !== undefined ? Math.max(savedCounts[p.id].shares, p.shares || 0) : p.shares || 0,
      }));
      setPosts(syncedPosts);
      
      setLoading(false);
    };
    fetchData();
  }, [selectedMood]);

  const handlePointerDown = (postId: string) => {
    pressTimer.current = setTimeout(() => {
      setPickerPostId(postId);
    }, 500);
  };

  const handlePointerUp = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const triggerMiniReaction = (postId: string, r: typeof SKRIM_REACTIONS[0]) => {
    setPickerPostId(null);
    incrementStat('reactionsSent', 1);
    incrementStat('pulseScore', 2); // 2 points per reaction
    const container = document.getElementById(`pulse-image-${postId}`);
    if (container) {
       triggerReactionAnimation(container, r.id, r.emoji);
    }
  };

  useEffect(() => {
    if (currentUser) {
      getSparks().then(fetchedSparks => {
        const mySavedSparksStr = localStorage.getItem('skrimchat_sparks');
        let mySparks = mySavedSparksStr ? JSON.parse(mySavedSparksStr) : [];
        if (!Array.isArray(mySparks)) mySparks = [];
        const validSparksForStorage = mySparks.filter((s: any) => (s.expiresAt && s.expiresAt > Date.now()));
        if (validSparksForStorage.length !== mySparks.length) {
           localStorage.setItem('skrimchat_sparks', JSON.stringify(validSparksForStorage));
        }
        mySparks = validSparksForStorage.filter((s: any) => s.expiresAt && s.expiresAt > Date.now());
        setSparks([...mySparks, ...fetchedSparks]);
      });
    }
  }, [currentUser]);

  const handleLike = async (postId: string) => {
    const updatedPosts = posts.map(p => {
      if (p.id === postId) {
        if (!p.isLiked) {
          triggerMiniReaction(postId, SKRIM_REACTIONS[0]); // Trigger Pulse emoji animation
        }
        return { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 };
      }
      return p;
    });
    setPosts(updatedPosts);
    await likePost(postId);
  };

  const handleSave = (postId: string) => {
    let savedList = JSON.parse(localStorage.getItem('skrimchat_saved_posts') || '[]');
    if (!Array.isArray(savedList)) savedList = [];
    let isSaving = false;

    if (savedList.includes(postId)) {
        savedList = savedList.filter((id: string) => id !== postId);
        setToastMessage("Removed from saved");
    } else {
        savedList.push(postId);
        isSaving = true;
        setToastMessage("✅ Saved to your collection!");
    }
    localStorage.setItem('skrimchat_saved_posts', JSON.stringify(savedList));
    setTimeout(() => setToastMessage(''), 2500);

    const updatedPosts = posts.map(p => p.id === postId ? { ...p, isSaved: isSaving } : p);
    setPosts(updatedPosts);
  };

  const updatePostCount = (postId: string, type: 'comments' | 'shares', delta: number) => {
     setPosts(prev => prev.map(p => {
        if (p.id === postId) {
           const newCount = p[type] + delta;
           const counts = JSON.parse(localStorage.getItem('skrimchat_post_counts') || '{}');
           if (!counts[postId]) counts[postId] = {};
           counts[postId][type] = newCount;
           localStorage.setItem('skrimchat_post_counts', JSON.stringify(counts));
           return { ...p, [type]: newCount };
        }
        return p;
     }));
  };

  return (
    <div 
      className="w-full h-full overflow-y-auto no-scrollbar pb-24 relative"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence>
        {newPostsCount > 0 && !refreshing && (
          <motion.div
            initial={{ y: -100, opacity: 0, x: "-50%" }}
            animate={{ y: 80, opacity: 1, x: "-50%" }}
            exit={{ y: -100, opacity: 0, x: "-50%" }}
            className="fixed top-0 left-1/2 z-[60] cursor-pointer"
            onClick={() => {
              containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
              handleRefresh();
            }}
          >
            <div className="bg-[rgba(20,20,20,0.95)] backdrop-blur-md border border-[#B026FF] shadow-[0_0_15px_rgba(176,38,255,0.3)] px-5 py-2 rounded-full flex flex-col items-center">
              <span className="text-white text-sm font-bold flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#B026FF] fill-[#B026FF]" /> 
                {newPostsCount} new post{newPostsCount > 1 ? 's' : ''}
              </span>
              <span className="text-[10px] text-gray-400 font-medium pt-0.5">Tap to view</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {toastMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 slide-out-to-top-4 duration-300 pointer-events-none">
          <div className="bg-[rgba(20,20,20,0.95)] backdrop-blur-md border border-[#B026FF] shadow-lg px-4 py-3 rounded-xl flex items-center gap-2 w-max max-w-[90vw]">
            <span className="text-white text-sm font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-6 pb-2 sticky top-0 bg-skrim-bg/80 backdrop-blur-md z-40">
        <h1 className="text-2xl font-bold tracking-tight">Pulse</h1>
        <div className="w-8 h-8 rounded-full bg-skrim-surface flex items-center justify-center relative">
           <div className="absolute top-2 right-2 w-2 h-2 bg-neon-purple rounded-full shadow-neon-purple animate-pulse" />
           <MessageCircle className="w-4 h-4 text-white" />
        </div>
      </header>

      {refreshing && (
        <div className="flex flex-col items-center justify-center py-6 text-[#B026FF]">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span className="text-xs font-medium mt-2">Refreshing Pulse...</span>
        </div>
      )}

      {/* Mood Selector */}
      <div className="border-b border-white/5">
        <h3 className="text-white font-bold mb-3 px-4 pt-4">What's your vibe right now? ✨</h3>
        <div 
          className="vibe-tabs"
          style={{
            display: "flex",
            flexDirection: "row",
            overflowX: "auto",
            overflowY: "hidden",
            gap: "8px",
            padding: "4px 16px 16px 16px",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch"
          }}
        >
          {MOODS.map(mood => (
            <button
              key={mood.id}
              onClick={() => {
                setSelectedMood(mood.id);
                localStorage.setItem('skrimchat_mood', mood.id);
                setToastMessage(`Feed updated for ${mood.label} mode! ${mood.emoji}`);
                setTimeout(() => setToastMessage(''), 2500);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{
                flexShrink: 0,
                whiteSpace: "nowrap",
                padding: "8px 16px",
                borderRadius: "20px",
                cursor: "pointer"
              }}
              className={`flex items-center gap-1.5 border transition-all duration-300 ${
                selectedMood === mood.id 
                  ? 'border-[#B026FF] bg-[#B026FF]/10 text-[#B026FF] scale-110 shadow-[0_0_15px_rgba(176,38,255,0.3)] mx-1' 
                  : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <span className="text-lg">{mood.emoji}</span>
              <span className="font-bold text-sm tracking-wide">{mood.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sparks (Stories) */}
      <div className="border-b border-white/5 overflow-hidden">
        {loading ? (
          <div className="px-4 py-4 flex gap-4 overflow-x-auto no-scrollbar">
             {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1 min-w-[72px] opacity-50 animate-pulse">
                  <div className="w-16 h-16 rounded-full bg-skrim-surface" />
                  <div className="w-10 h-2 bg-skrim-surface rounded" />
                </div>
             ))}
          </div>
        ) : (
          <SparkRow 
             sparks={groupedSparks} 
             onSparkClick={handleSparkClick} 
             onAddSpark={handleAddSpark} 
             currentUser={currentUser} 
             activeUserId={activeUserIndex !== null ? groupedSparks[activeUserIndex]?.userId : undefined}
          />
        )}
      </div>

      {activeUserIndex !== null && (
        <SparkViewer
           groupedSparks={groupedSparks}
           initialUserIndex={activeUserIndex}
           onClose={() => setActiveUserIndex(null)}
           currentUser={currentUser}
           onSparkViewed={handleSparkViewed}
           onDelete={handleDeleteSpark}
        />
      )}

      <SparkCreator
         isOpen={isSparkCreatorOpen}
         onClose={() => setIsSparkCreatorOpen(false)}
         onPost={onPostSpark}
      />

      {/* Posts Feed */}
      <div className="flex flex-col gap-6 p-4">
        {loading ? (
          Array.from({length: 3}).map((_, i) => (
            <div key={i} className="flex flex-col gap-3 pb-6 border-b border-white/5 animate-pulse opacity-50">
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-skrim-surface"/><div className="w-24 h-4 bg-skrim-surface rounded"/></div>
              <div className="w-full aspect-square rounded-2xl bg-skrim-surface" />
              <div className="w-full h-8 bg-skrim-surface rounded" />
            </div>
          ))
        ) : posts.map(post => {
          if (post.type === 'suggested_user') {
            return (
              <div key={post.id} className="border border-white/10 bg-white/5 rounded-2xl p-4 flex flex-col gap-4 relative overflow-hidden mb-6 mx-4">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <SmilePlus className="w-4 h-4" /> Suggested for you
                </div>
                <div className="flex items-center gap-4">
                  <img src={post.user?.avatar} alt={post.user?.user} className="w-14 h-14 rounded-full object-cover" />
                  <div className="flex flex-col flex-1">
                    <span className="text-white font-bold">{post.user?.user}</span>
                    <span className="text-gray-400 text-sm">{post.user?.handle}</span>
                    <span className="text-[#ff6b00] text-xs font-bold mt-1 flex items-center gap-1">🔥 FLAME CREATOR</span>
                    <span className="text-gray-500 text-xs mt-1">3 mutual followers</span>
                  </div>
                </div>
                <div className="flex gap-2">
                   <button className="flex-1 bg-[#B026FF] text-white font-bold rounded-full py-2.5 flex items-center justify-center gap-2 mt-2 hover:opacity-90 transition-opacity">
                     <Zap className="w-4 h-4 fill-white" /> Follow
                   </button>
                   <button className="flex-1 bg-transparent border border-white/20 text-white font-bold rounded-full py-2.5 flex items-center justify-center gap-2 mt-2 hover:bg-white/5 transition-opacity">
                     <X className="w-4 h-4" /> Dismiss
                   </button>
                </div>
              </div>
            );
          }

          if (post.type === 'pulse_battle') {
            return (
              <div key={post.id} className="border border-white/10 bg-[#121212] rounded-2xl p-4 flex flex-col gap-4 relative overflow-hidden mb-6 mx-4 shadow-lg">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <Zap className="w-4 h-4 text-[#B026FF]" /> PULSE BATTLE
                </div>
                <h4 className="text-white font-bold text-lg">{post.title}</h4>
                <div className="flex relative">
                  <div className="w-1/2 pr-1 relative">
                    <img src={post.image1} alt="Battle A" className="w-full aspect-[4/5] object-cover rounded-l-xl" />
                    <div className="absolute bottom-2 left-2 bg-black/60 rounded px-2 py-1 text-xs text-white">{post.user1.handle}</div>
                  </div>
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 rounded-full w-8 h-8 flex items-center justify-center z-10 font-bold border border-white/20 text-xs text-white">VS</div>
                  <div className="w-1/2 pl-1 relative">
                    <img src={post.image2} alt="Battle B" className="w-full aspect-[4/5] object-cover rounded-r-xl" />
                    <div className="absolute bottom-2 right-2 bg-black/60 rounded px-2 py-1 text-xs text-white">{post.user2.handle}</div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-white">{post.votesA}%</span>
                    <span className="text-white">{post.votesB}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden flex">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500" style={{ width: `${post.votesA}%` }} />
                    <div className="h-full bg-gradient-to-r from-orange-500 to-pink-500 transition-all duration-500" style={{ width: `${post.votesB}%` }} />
                  </div>
                </div>
                <div className="flex gap-2 text-sm">
                   <button onClick={() => setToastMessage(`You voted for ${post.user1.handle}!`)} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full py-2 transition-colors">⚡ Vote A</button>
                   <button onClick={() => setToastMessage(`You voted for ${post.user2.handle}!`)} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full py-2 transition-colors">⚡ Vote B</button>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>⏱️ Ends in 24h</span>
                  <span>{post.totalVotes.toLocaleString()} total votes</span>
                </div>
              </div>
            );
          }

          if (post.type === 'collab_post') {
            return (
              <div key={post.id} className="flex flex-col gap-3 pb-6 border-b border-white/5 mx-0">
                <div className="flex items-center justify-between px-4">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-3">
                      <img src={post.user1.avatar} className="w-10 h-10 rounded-full border-2 border-[#121212] z-10" />
                      <img src={post.user2.avatar} className="w-10 h-10 rounded-full border-2 border-[#121212] z-0" />
                    </div>
                    <div className="flex flex-col text-sm">
                      <span className="font-semibold text-white truncate max-w-[150px]">{post.user1.handle} & {post.user2.handle}</span>
                      <span className="text-xs text-[#B026FF] flex items-center gap-1 font-medium">🤝 COLLAB POST</span>
                    </div>
                  </div>
                </div>
                <div className="w-full relative aspect-square flex border-y border-white/10">
                  <img src={post.image1} alt="Left" className="w-1/2 object-cover" />
                  <div className="w-1 h-full bg-gradient-to-b from-[#B026FF] to-transparent absolute left-1/2 -translate-x-1/2 z-10" />
                  <img src={post.image2} alt="Right" className="w-1/2 object-cover" />
                </div>
                <div className="px-4 text-sm leading-relaxed text-gray-300">
                  <span className="font-bold text-white mr-2">Collab:</span>
                  {post.caption}
                </div>
                <div className="px-4 flex gap-4 mt-2">
                  <div className="flex items-center gap-1.5 cursor-pointer">
                    <Zap className="w-6 h-6 text-[#B026FF] fill-[#B026FF]" />
                    <FastLiveCounter count={post.likes} />
                  </div>
                  <div className="flex items-center gap-1.5 cursor-pointer">
                    <MessageCircle className="w-6 h-6 text-white" />
                    <span className="text-xs font-medium text-gray-300">{formatCount(post.comments)}</span>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={post.id} className="flex flex-col gap-3 pb-6 border-b border-white/5 mx-0">
            {/* Post Header */}
            <div className="flex items-center justify-between px-4">
              <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => navigate(`/profile/${post.handle.replace('@', '')}`)}
              >
                <AvatarWithRing src={post.avatar} size="sm" isStory={true} showOnlineDot username={post.handle} />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                     <span className="text-sm font-semibold group-hover:underline text-white">{post.user}</span>
                     <BadgeRow stats={generateMockStatsForBadge(post.handle)} isSmall={true} />
                  </div>
                  <span className="text-xs text-gray-500">{post.handle} • {post.time}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {post.temperature && (
                   <div 
                     className="px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors relative overflow-hidden"
                     style={{ borderColor: post.temperature.color, color: post.temperature.color, backgroundColor: post.temperature.bgColor }}
                   >
                     {post.temperature.id === 'HOT' || post.temperature.id === 'NOVA' ? (
                        <div className="absolute inset-0 w-full h-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                     ) : null}
                     {post.temperature.label}
                   </div>
                )}
                <MoreHorizontal className="w-5 h-5 text-gray-500" />
              </div>
            </div>

            {/* Post Image */}
            <div 
              id={`pulse-image-${post.id}`}
              className="w-full overflow-hidden aspect-square relative group select-none"
              onPointerDown={() => handlePointerDown(post.id)}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onDoubleClick={(e) => { e.preventDefault(); handleLike(post.id); }}
              onContextMenu={(e) => e.preventDefault()}
            >
              <img src={post.image} alt="post" loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none" />
              <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-1.5">
                <span className="text-[10px] text-white/90 truncate max-w-[120px]">{post.audioContext}</span>
              </div>
              
              <AnimatePresence>
                {pickerPostId === post.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: [1.1, 1] }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="absolute z-50 flex gap-2 cursor-pointer bg-black/60 backdrop-blur-xl px-2 py-2 rounded-full border border-white/20 shadow-2xl left-1/2 -translate-x-1/2 bottom-1/4"
                  >
                    {SKRIM_REACTIONS.map((r) => (
                      <motion.div
                        key={r.id}
                        whileHover={{ scale: 1.4 }}
                        className="flex flex-col items-center justify-center gap-1 group relative px-1.5 transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerMiniReaction(post.id, r);
                        }}
                      >
                         <div className="absolute inset-0 rounded-full blur-lg transition-opacity opacity-0 group-hover:opacity-40" style={{ backgroundColor: r.color }} />
                         <span className="text-2xl relative z-10 drop-shadow-md">{r.emoji}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Post Actions & Caption */}
            <div className="flex flex-col gap-3 px-4">
              <div className="flex items-center w-full overflow-hidden gap-4">
                <div className="flex-none min-w-[70px] max-w-[90px] flex items-center gap-1.5 group cursor-pointer" onClick={() => handleLike(post.id)}>
                  <Zap className={`shrink-0 w-6 h-6 transition-all duration-300 active:scale-[1.4] ${post.isLiked ? 'text-[#B026FF] fill-[#B026FF] drop-shadow-[0_0_8px_rgba(176,38,255,0.8)]' : 'text-white group-hover:text-[#B026FF]'}`} />
                  <FastLiveCounter count={post.likes} />
                </div>
                <div className="flex-none min-w-[60px] flex items-center gap-1.5 group cursor-pointer" onClick={() => { incrementStat('commentsSent', 1); setActiveCommentsPostId(post.id); }}>
                  <MessageCircle className="shrink-0 w-6 h-6 text-white group-active:scale-75 transition-transform group-hover:text-[#B026FF]" />
                  <motion.span key={`commentcount-${post.id}-${post.comments}`} initial={{ scale: 1.3, color: '#B026FF' }} animate={{ scale: 1, color: '#d1d5db' }} transition={{ duration: 0.3 }} className="text-xs font-medium text-gray-300 inline-block truncate">{formatCount(post.comments)}</motion.span>
                </div>
                <div className="flex-none min-w-[60px] flex items-center gap-1.5 group cursor-pointer" onClick={() => { incrementStat('shares', 1); setActiveSharePostId(post.id); }}>
                  <Share2 className="shrink-0 w-6 h-6 text-white group-active:scale-75 transition-transform group-hover:text-[#B026FF]" />
                  <motion.span key={`sharecount-${post.id}-${post.shares}`} initial={{ scale: 1.3, color: '#B026FF' }} animate={{ scale: 1, color: '#d1d5db' }} transition={{ duration: 0.3 }} className="text-xs font-medium text-gray-300 inline-block truncate">{formatCount(post.shares)}</motion.span>
                </div>
                <div className="flex-none ml-auto flex items-center group cursor-pointer" onClick={() => handleSave(post.id)}>
                  <Bookmark className={`shrink-0 w-6 h-6 transition-all duration-300 active:scale-[1.4] ${post.isSaved ? 'text-[#B026FF] fill-[#B026FF] drop-shadow-[0_0_8px_rgba(176,38,255,0.8)]' : 'text-white group-hover:text-[#B026FF]'}`} />
                </div>
              </div>

              {/* Inline Reactions */}
              {post.reactions && Object.keys(post.reactions).length > 0 && (
                <div className="mb-2">
                  <ReactionRow 
                    initialReactions={post.reactions} 
                    onReact={(reactionId, reaction) => {
                      if (reactionId && reaction) {
                        const container = document.getElementById(`pulse-image-${post.id}`);
                        if (container) triggerReactionAnimation(container, reactionId, reaction.emoji);
                      }
                    }}
                  />
                </div>
              )}

              {/* Story Behind Link */}
              {post.hasStory && (
                <div 
                  onClick={() => setStoryBehindPostId(post.id)} 
                  className="bg-white/5 border border-white/10 rounded-lg p-2 mt-1 mb-1 cursor-pointer hover:bg-white/10 transition-colors flex items-center justify-between group"
                >
                  <span className="text-xs text-gray-300 group-hover:text-[#B026FF] transition-colors font-medium">📖 Story behind this</span>
                  <span className="text-xs text-gray-500 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              )}

              {/* Caption */}
              <div className="text-sm leading-relaxed">
                <span className="font-semibold text-white mr-2">{post.user}</span>
                <span className="text-gray-300">{(post.caption || "").split(' ').map((word: string, i: number) => word.startsWith('#') ? <span key={i} className="text-neon-blue">{word} </span> : word + ' ')}</span>
              </div>
            </div>
            </div>
          );
        })}

        <style>{`
          @keyframes pulseShimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          @keyframes livePulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.3); }
          }
        `}</style>
         {isLoadingMore && (
           <div className="flex flex-col gap-6 pt-4">
             {Array.from({length: 3}).map((_, i) => (
               <div key={`skel-${i}`} className="flex flex-col gap-3 pb-6 border-b border-white/5 relative overflow-hidden" style={{ background: '#1F1F1F', borderRadius: '16px' }}>
                 <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%)', backgroundSize: '200% 100%', animation: 'pulseShimmer 1.5s infinite linear' }} />
                 <div className="flex items-center gap-3 p-3 relative z-10">
                   <div className="w-10 h-10 rounded-full bg-white/10" />
                   <div className="w-24 h-4 bg-white/10 rounded" />
                 </div>
                 <div className="w-full aspect-square bg-white/5 relative z-10" />
                 <div className="w-full h-8 bg-white/5 rounded mx-3 relative z-10" />
               </div>
             ))}
           </div>
        )}
        <div ref={sentinelRef} className="h-10" />
      </div>

      <PulseCommentsSheet 
        isOpen={!!activeCommentsPostId} 
        onClose={() => setActiveCommentsPostId(null)} 
        currentUser={currentUser} 
        postId={activeCommentsPostId || ''}
        postCommentCount={posts.find(p => p.id === activeCommentsPostId)?.comments || 0}
        onCommentAdded={() => updatePostCount(activeCommentsPostId || '', 'comments', 1)}
      />

      <PulseShareSheet 
        isOpen={!!activeSharePostId} 
        onClose={() => setActiveSharePostId(null)} 
        onShareComplete={(type, msg) => {
          setToastMessage(msg);
          setTimeout(() => setToastMessage(''), 2500);
          updatePostCount(activeSharePostId || '', 'shares', 1);
        }}
      />

      <StoryBehindSheet 
        isOpen={!!storyBehindPostId}
        onClose={() => setStoryBehindPostId(null)}
        post={posts.find(p => p.id === storyBehindPostId)}
      />
    </div>
  );
}
