import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AvatarWithRing } from '../components/ui';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Zap, SmilePlus } from 'lucide-react';
import { getPosts, getStories, likePost } from '../lib/mock/mockServices';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { motion, AnimatePresence } from 'motion/react';
import { SKRIM_REACTIONS } from '../lib/mock/mockData';
import { BadgeRow } from '../components/BadgeComponents';
import { ReactionRow } from '../components/ReactionRow';
import { generateMockStatsForBadge } from '../lib/mock/mockBadges';
import { incrementStat } from '../lib/mock/achievementEngine';

export default function PulseScreen() {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerPostId, setPickerPostId] = useState<string | null>(null);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const [miniEmojis, setMiniEmojis] = useState<{ id: number, r: typeof SKRIM_REACTIONS[0], postId: string }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [fetchedPosts, fetchedStories] = await Promise.all([
        getPosts(),
        getStories()
      ]);
      setPosts(fetchedPosts);
      
      setLoading(false);
    };
    fetchData();
  }, []);

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
    const newEmoji = { id: Date.now() + Math.random(), r, postId };
    setMiniEmojis(prev => [...prev, newEmoji]);
    incrementStat('reactionsSent', 1);
    incrementStat('pulseScore', 2); // 2 points per reaction
    setTimeout(() => {
      setMiniEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
    }, 800);
  };

  useEffect(() => {
    if (currentUser) {
      getStories().then(fetchedStories => {
        setStories([{
          id: "your_story_add",
          user: currentUser.username || "Your Story",
          avatar: currentUser.avatar || "https://i.pravatar.cc/150?img=11",
          hasStory: false,
          isAdd: true,
        }, ...fetchedStories]);
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

  return (
    <div className="w-full h-full overflow-y-auto no-scrollbar pb-24">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-6 pb-2 sticky top-0 bg-skrim-bg/80 backdrop-blur-md z-40">
        <h1 className="text-2xl font-bold tracking-tight">Pulse</h1>
        <div className="w-8 h-8 rounded-full bg-skrim-surface flex items-center justify-center relative">
           <div className="absolute top-2 right-2 w-2 h-2 bg-neon-purple rounded-full shadow-neon-purple animate-pulse" />
           <MessageCircle className="w-4 h-4 text-white" />
        </div>
      </header>

      {/* Sparks (Stories) */}
      <div className="px-4 py-4 border-b border-white/5 overflow-hidden">
        <div className="flex gap-4 overflow-x-auto no-scrollbar w-full whitespace-nowrap">
          {loading ? (
             // Skeletons
             Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1 min-w-[72px] opacity-50 animate-pulse">
                  <div className="w-16 h-16 rounded-full bg-skrim-surface" />
                  <div className="w-10 h-2 bg-skrim-surface rounded" />
                </div>
             ))
          ) : stories.map(story => (
            <div key={story.id} className="flex flex-col items-center gap-1 min-w-[72px] shrink-0">
              <div className="relative">
                <AvatarWithRing src={story.avatar || story.image} size="lg" isStory={story.hasStory} />
                {story.isAdd && (
                  <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-neon-purple flex items-center justify-center border-2 border-skrim-bg">
                    <span className="text-white text-xs font-bold leading-none">+</span>
                  </div>
                )}
              </div>
              <span className="text-[11px] font-medium text-gray-300 truncate w-16 text-center">{story.user}</span>
            </div>
          ))}
        </div>
      </div>

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
        ) : posts.map(post => (
          <div key={post.id} className="flex flex-col gap-3 pb-6 border-b border-white/5">
            {/* Post Header */}
            <div className="flex items-center justify-between">
              <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => navigate(`/profile/${post.handle.replace('@', '')}`)}
              >
                <AvatarWithRing src={post.avatar} size="sm" isStory={true} showOnlineDot username={post.handle} />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                     <span className="text-sm font-semibold group-hover:underline">{post.user}</span>
                     <BadgeRow stats={generateMockStatsForBadge(post.handle)} isSmall={true} />
                  </div>
                  <span className="text-xs text-gray-500">{post.handle} • {post.time}</span>
                </div>
              </div>
              <MoreHorizontal className="w-5 h-5 text-gray-500" />
            </div>

            {/* Post Image */}
            <div 
              className="w-full rounded-2xl overflow-hidden aspect-square relative group select-none"
              onPointerDown={() => handlePointerDown(post.id)}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onContextMenu={(e) => e.preventDefault()}
            >
              <img src={post.image} alt="post" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none" />
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

                 {/* mini animations */}
                {miniEmojis.filter(m => m.postId === post.id).map(m => (
                   <motion.div
                      key={m.id}
                      initial={{ opacity: 1, scale: 0.5, y: "50%", x: "-50%", left: "50%", top: "70%" }}
                      animate={{ opacity: [1, 1, 0], scale: [0.5, 3, 5], y: ["50%", "-150%"] }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="absolute z-40 pointer-events-none drop-shadow-2xl"
                      style={{ filter: `drop-shadow(0 0 20px ${m.r.color})` }}
                   >
                     <span className="text-4xl">{m.r.emoji}</span>
                   </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Post Actions */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => handleLike(post.id)}>
                    <Zap className={`w-6 h-6 transition-all duration-300 active:scale-[1.4] ${post.isLiked ? 'text-[#B026FF] fill-[#B026FF] drop-shadow-[0_0_8px_rgba(176,38,255,0.8)]' : 'text-white group-hover:text-[#B026FF]'}`} />
                    <span className="text-xs font-medium text-gray-300">{post.likes >= 1000 ? parseFloat((post.likes/1000).toFixed(1)) + 'K' : post.likes}</span>
                  </div>
                  <div className="flex items-center gap-1.5 group cursor-pointer"
                       onPointerDown={() => handlePointerDown(post.id)}
                       onPointerUp={handlePointerUp}
                       onPointerLeave={handlePointerUp}
                       onClick={() => {
                         // Default action trigger top reaction or show picker
                         handlePointerDown(post.id);
                       }}
                  >
                    <SmilePlus className="w-6 h-6 text-white group-active:scale-75 transition-transform group-hover:text-blue-400" />
                  </div>
                  <div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => incrementStat('commentsSent', 1)}>
                    <MessageCircle className="w-6 h-6 text-white group-active:scale-75 transition-transform" />
                    <span className="text-xs font-medium text-gray-300">{post.comments.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => incrementStat('shares', 1)}>
                    <Share2 className="w-6 h-6 text-white group-active:scale-75 transition-transform" />
                    <span className="text-xs font-medium text-gray-300">{post.shares.toLocaleString()}</span>
                  </div>
                </div>
                <Bookmark className="w-6 h-6 text-white" />
              </div>

              {/* Inline Reactions */}
              {post.reactions && (
                <div className="mb-2">
                  <ReactionRow initialReactions={post.reactions} />
                </div>
              )}

              {/* Caption */}
              <div className="text-sm leading-relaxed">
                <span className="font-semibold mr-2">{post.user}</span>
                <span className="text-gray-300">{post.caption.split(' ').map((word: string, i: number) => word.startsWith('#') ? <span key={i} className="text-neon-blue">{word} </span> : word + ' ')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
