import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, TrendingUp, Users, Crown, Sparkles, Zap } from 'lucide-react';
import { AvatarWithRing, FollowButton } from '../components/ui';
import { searchUsers } from '../lib/mock/mockServices';
import { FEATURE_FLAGS } from '../lib/config/featureFlags';
import { BadgeRow } from '../components/BadgeComponents';
import { generateMockStatsForBadge } from '../lib/mock/mockBadges';
import { useAchievements, getTrackingStats } from '../lib/mock/achievementEngine';
import { mockSparks } from '../lib/mock/mockData';
import { motion } from 'motion/react';

function WeeklyLeaderboard() {
   const ach = useAchievements();
   // Calculate time remaining until next reset (assuming weekStartDate + 7 days)
   const endOfWeek = ach.weekStartDate + 7 * 24 * 60 * 60 * 1000;
   const diff = Math.max(0, endOfWeek - Date.now());
   const days = Math.floor(diff / (1000 * 60 * 60 * 24));
   const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
   
   // generate dummy leaderboard incorporating current user
   const tracking = getTrackingStats();
   const mockLander = [
      { id: 1, name: 'CyberGhost', handle: '@ghost', score: 15430, avatar: 'https://i.pravatar.cc/150?img=1' },
      { id: 2, name: 'NeonSamurai', handle: '@samurai', score: 14200, avatar: 'https://i.pravatar.cc/150?img=2' },
      { id: 3, name: 'You', handle: '@you', score: tracking.pulseScore, avatar: localStorage.getItem('skrimchat_avatar') || 'https://i.pravatar.cc/150?img=11', isUser: true },
      { id: 4, name: 'PixelDust', handle: '@pixel', score: 11000, avatar: 'https://i.pravatar.cc/150?img=4' },
      { id: 5, name: 'SynthWave', handle: '@synth', score: 9800, avatar: 'https://i.pravatar.cc/150?img=5' },
   ].sort((a, b) => b.score - a.score);
   
   return (
      <section className="mb-6 bg-gradient-to-br from-[#1C003D] to-[#0A001A] rounded-3xl p-5 border border-[#B026FF]/20 shadow-[0_4px_30px_#B026FF10] relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-[#B026FF]/20 blur-[50px] rounded-full" />
         
         <div className="flex justify-between items-start mb-5 relative z-10">
            <div>
               <h3 className="text-xl font-black text-white flex items-center gap-2 mb-1 tracking-widest uppercase items-center drop-shadow-[0_0_10px_#B026FF50]">
                  <Crown className="w-5 h-5 text-yellow-400" /> Pulse Ranks
               </h3>
               <p className="text-[10px] text-gray-300 font-bold tracking-widest">Resets in {days}d {hours}h</p>
            </div>
            <div className="bg-[#B026FF]/20 px-3 py-1 rounded-full border border-[#B026FF]/50 flex items-center gap-1 shadow-[0_0_15px_#B026FF30]">
               <Sparkles className="w-3 h-3 text-[#00F0FF]" />
               <span className="text-[10px] font-black text-white">TIER 1</span>
            </div>
         </div>
         
         <div className="space-y-3 relative z-10">
            {mockLander.map((u, i) => (
               <div key={u.id} className={`flex items-center justify-between p-3 rounded-2xl transition ${u.isUser ? 'bg-white/10 border-2 border-[#00F0FF] shadow-[0_0_15px_#00F0FF30]' : 'bg-black/40 border border-white/5'}`}>
                  <div className="flex items-center gap-3">
                     <span className={`w-6 text-center font-black ${i === 0 ? 'text-yellow-400 text-lg' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-gray-600 text-sm'}`}>
                        #{i + 1}
                     </span>
                     <img src={u.avatar} className="w-10 h-10 rounded-full border border-white/10 object-cover" />
                     <div className="flex flex-col">
                        <span className={`text-sm font-bold ${u.isUser ? 'text-[#00F0FF]' : 'text-white'}`}>{u.name}</span>
                        <span className="text-[10px] text-gray-400">{u.handle}</span>
                     </div>
                  </div>
                  <div className="text-right flex items-center gap-1">
                     <span className="text-sm font-black text-yellow-400 drop-shadow-md">{u.score.toLocaleString()}</span>
                     <Zap className="w-3 h-3 text-yellow-400" />
                  </div>
               </div>
            ))}
         </div>
      </section>
   );
}

export default function DiscoverScreen() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('tag') ? `#${searchParams.get('tag')}` : '');
  const [results, setResults] = useState<any[]>([]);
  const [sparkResults, setSparkResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults([]);
      setSparkResults([]);
      if (searchParams.has('tag')) {
        setSearchParams(new URLSearchParams());
      }
      return;
    }
    const doSearch = async () => {
      setSearching(true);
      if (FEATURE_FLAGS.MOCK_MODE) {
        if (query.startsWith('#')) {
          setResults([]);
          // search sparks with tags
          const searchTag = query.toLowerCase();
          const allSparks = [...mockSparks, ...(JSON.parse(localStorage.getItem('skrimchat_sparks') || '[]'))];
          const matches = allSparks.filter(s => {
             const ht = s.hashtags || [];
             return ht.some((h: string) => h?.toLowerCase() === searchTag);
          });
          setSparkResults(matches);
        } else {
          setSparkResults([]);
          const matchingUsers = await searchUsers(query);
          setResults(matchingUsers);
        }
      }
      setSearching(false);
    };
    const timer = setTimeout(doSearch, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="w-full h-full flex flex-col pt-6 pb-24 overflow-y-auto no-scrollbar">
      <header className="px-4 pb-4 bg-skrim-bg/90 backdrop-blur-md sticky top-0 z-40">
        <h1 className="text-2xl font-bold tracking-tight mb-4">Discover</h1>
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users, tags, or sounds..." 
            className="w-full bg-skrim-surface border border-white/5 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-neon-purple/50 transition-colors"
          />
        </div>
      </header>

      <div className="flex-1 px-4 mt-2">
        {query ? (
          <div className="flex flex-col gap-4">
             <h3 className="text-sm font-semibold text-gray-400">Search Results</h3>
             {searching ? (
               <div className="flex items-center justify-center p-4"><div className="w-6 h-6 border-2 border-neon-purple/30 border-t-neon-purple rounded-full animate-spin" /></div>
             ) : results.length > 0 ? (
               results.map(user => (
                  <div key={user.id} onClick={() => navigate(`/profile/${user.username.replace('@', '')}`)} className="flex items-center gap-3 p-3 bg-skrim-surface rounded-2xl cursor-pointer hover:bg-white/5 transition">
                     <AvatarWithRing src={user.avatar} size="md" showOnlineDot username={user.username} />
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                           <h4 className="font-semibold text-white group-hover:underline truncate">{user.displayName}</h4>
                           <BadgeRow stats={generateMockStatsForBadge(user.username)} isSmall={true} />
                        </div>
                        <p className="text-xs text-gray-400">@{user.username}</p>
                     </div>
                     <FollowButton username={user.username} initialCount={user.followers} />
                  </div>
               ))
             ) : sparkResults.length > 0 ? (
               <div className="grid grid-cols-3 gap-2">
                  {sparkResults.map((spark) => (
                    <div 
                      key={spark.id} 
                      onClick={() => navigate(`/identity`)} 
                      className="aspect-square rounded-xl overflow-hidden relative cursor-pointer group"
                    >
                      {spark.type === 'video' || spark.video ? (
                        <video src={spark.video || spark.image || "https://www.w3schools.com/html/mov_bbb.mp4"} className="w-full h-full object-cover group-hover:scale-105 transition-transform" muted loop autoPlay playsInline onError={() => console.log('Discover video error')} />
                      ) : spark.image ? (
                        <img src={spark.image} alt="spark" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex flex-col justify-center items-center p-2" style={{ background: spark.backgroundTheme || spark.background || '#121212' }}>
                          <p className="text-[8px] text-white font-bold leading-tight line-clamp-3 text-center">{spark.text || spark.caption}</p>
                        </div>
                      )}
                      
                      <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded flex items-center shadow">
                        <span className="text-[8px] font-bold text-white tracking-wider">
                          {(spark.type === 'video' || spark.video) ? '🎥 VIDEO' : spark.image ? '🖼️ IMAGE' : '📝 TEXT'}
                        </span>
                      </div>

                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                 ))}
               </div>
             ) : (
               <p className="text-xs text-gray-500 text-center py-4">No results found.</p>
             )}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <WeeklyLeaderboard />
            <section>
               <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4"/> Trending Hashtags</h3>
               <div className="flex flex-wrap gap-2">
                 {['#GymLife', '#Cricket', '#Food', '#Bollywood', '#Gaming'].map(tag => (
                   <span key={tag} onClick={() => setQuery(tag)} className="px-4 py-2 bg-skrim-surface rounded-xl text-sm font-medium text-white border border-white/5 hover:border-white/20 transition-colors cursor-pointer">
                     {tag}
                   </span>
                 ))}
               </div>
            </section>

            <section>
               <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2"><Users className="w-4 h-4"/> Trending Creators</h3>
               <div className="grid grid-cols-2 gap-3">
                 {[1,2,3,4].map(i => (
                    <div key={i} onClick={() => navigate(`/profile/creator_${i}`)} className="bg-skrim-surface p-4 rounded-2xl flex flex-col items-center gap-2 border border-white/5 relative overflow-hidden group cursor-pointer hover:bg-white/5 transition">
                       <div className="absolute inset-0 bg-neon-purple/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                       <AvatarWithRing src={`https://i.pravatar.cc/150?img=${i+20}`} size="lg" />
                       <div className="flex items-center gap-1.5 flex-col w-full text-center">
                         <span className="font-semibold text-sm group-hover:underline w-full truncate">Creator {i}</span>
                         <BadgeRow stats={generateMockStatsForBadge(`Creator_${i}`)} isSmall={true} />
                       </div>
                       <span className="text-[10px] text-gray-400">{(Math.random()*100).toFixed(1)}k followers</span>
                    </div>
                 ))}
               </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
