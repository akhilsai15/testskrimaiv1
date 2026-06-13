import React, { useEffect, useState } from 'react';
import { Lock, Search, MoreVertical, Edit, Phone, Video, ArrowLeft, MessageCircle, CheckCircle, XCircle } from 'lucide-react';
import { AvatarWithRing, GlassCard } from '../components/ui';
import { getChats } from '../lib/mock/mockServices';
import { FEATURE_FLAGS } from '../lib/config/featureFlags';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getMessageRequests, acceptRequest, declineRequest } from '../lib/mock/mockSocialGraph';
import { mockUsers } from '../lib/mock/mockData';
import { BadgeRow } from '../components/BadgeComponents';
import { generateMockStatsForBadge } from '../lib/mock/mockBadges';

export default function ConnectScreen() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const targetUserParam = searchParams.get('user');
  
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all'|'requests'>('all');
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);
      let fetchedChats: any[] = [];
      if (FEATURE_FLAGS.MOCK_MODE) {
        fetchedChats = await getChats();
      }
      
      // Merge with custom chats
      const storedChatsStr = localStorage.getItem('skrimchat_custom_chats');
      const customChats = storedChatsStr ? JSON.parse(storedChatsStr) : {};
      
      const customChatEntries = Object.keys(customChats).map(key => {
         const msgs = customChats[key];
         const lastMsg = msgs[msgs.length - 1];
         return {
            id: `custom_${key}`,
            name: key,
            username: key,
            avatar: `https://i.pravatar.cc/150?u=${key}`,
            msg: lastMsg.text,
            time: 'Just now',
            unread: 0,
            isVeil: false
         };
      });

      // Filter out duplicates if any
      const finalChats = [...customChatEntries, ...fetchedChats.filter(fc => !customChatEntries.find(cc => cc.name.replace('@', '') === fc.name.replace('@', '')))];
      
      setChats(finalChats);
      setLoading(false);
    }
    fetchChats();
  }, []);

  useEffect(() => {
    const loadRequests = () => {
      setRequests(getMessageRequests());
    };
    loadRequests();
    window.addEventListener('skrimchat_requests_updated', loadRequests);
    return () => window.removeEventListener('skrimchat_requests_updated', loadRequests);
  }, []);

  if (targetUserParam) {
    const targetUserData = mockUsers.find(u => u.username === `@${targetUserParam}` || u.username === targetUserParam) || {
      username: `@${targetUserParam}`,
      displayName: targetUserParam.replace(/_/g, ' '),
      avatar: `https://i.pravatar.cc/150?u=${targetUserParam}`
    };

    // Read custom messages
    const storedChatsStr = localStorage.getItem('skrimchat_custom_chats');
    const customChats = storedChatsStr ? JSON.parse(storedChatsStr) : {};
    const chatKey = targetUserParam.replace('@', '');
    const messages = customChats[chatKey] || [];

    return (
      <div className="w-full h-full flex flex-col bg-skrim-bg relative overflow-hidden z-50">
        <header className="flex items-center justify-between px-4 py-4 border-b border-white/5 bg-skrim-bg/90 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/connect')} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition active:scale-95">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(`/profile/${targetUserParam}`)}>
              <AvatarWithRing src={targetUserData.avatar} size="sm" showOnlineDot username={targetUserParam} />
              <div className="flex flex-col">
                <h2 className="text-sm font-bold tracking-tight text-white">{targetUserData.displayName}</h2>
                <span className="text-[10px] text-gray-400">@{targetUserParam}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition">
              <Phone className="w-4 h-4 text-white" />
            </button>
            <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition">
              <Video className="w-4 h-4 text-white" />
            </button>
            <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition">
              <MoreVertical className="w-4 h-4 text-white" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto w-full flex flex-col p-4 no-scrollbar gap-4 justify-end">
          <div className="flex flex-col items-center justify-center py-10 opacity-50">
            <AvatarWithRing src={targetUserData.avatar} size="xl" className="mb-4" showOnlineDot username={targetUserParam} />
            <span className="text-sm font-medium text-white mb-1">{targetUserData.displayName}</span>
            <span className="text-xs text-gray-400">@{targetUserParam}</span>
            <span className="text-xs text-gray-500 mt-4 bg-white/5 px-4 py-1 rounded-full">New Chat Created</span>
          </div>
          
          {messages.length > 0 ? (
            messages.map((msg: any) => {
              const isMine = msg.sender !== targetUserData.username && msg.sender !== `@${targetUserParam}`;
              return (
                <div key={msg.id} className={`self-${isMine ? 'end' : 'start'} bg-${isMine ? 'neon-purple/20' : 'white/10'} border border-${isMine ? 'neon-purple/50' : 'white/10'} rounded-2xl rounded-t${isMine ? 'r' : 'l'}-sm px-4 py-2 text-sm text-white max-w-[80%] ${isMine ? 'shadow-[0_0_10px_rgba(176,38,255,0.2)]' : ''}`}>
                  {msg.text}
                </div>
              );
            })
          ) : (
            <div className="self-end bg-neon-purple/20 border border-neon-purple/50 rounded-2xl rounded-tr-sm px-4 py-2 text-sm text-white max-w-[80%] shadow-[0_0_10px_rgba(176,38,255,0.2)]">
              Hello! 👋
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/5 bg-skrim-bg/90 backdrop-blur-md">
          <div className="flex items-center gap-2 bg-skrim-surface rounded-full px-4 py-2 border border-white/10">
            <input type="text" placeholder="Message..." className="flex-1 bg-transparent border-none outline-none text-sm text-white" />
            <button className="w-8 h-8 rounded-full bg-neon-purple flex items-center justify-center -mr-2">
              <span className="text-white text-xs font-bold leading-none select-none">↑</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col pt-6 pb-24 relative overflow-hidden">
      {/* Background glow for Connect tab */}
      <div className="absolute top-20 right-[-20%] w-64 h-64 rounded-full bg-neon-purple/10 blur-[80px] pointer-events-none" />

      {/* Header */}
      <header className="flex flex-col gap-4 px-4 pb-4 border-b border-white/5 sticky top-0 bg-skrim-bg/90 backdrop-blur-md z-40">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Connect</h1>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-skrim-surface flex items-center justify-center">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <div className="w-8 h-8 rounded-full bg-skrim-surface flex items-center justify-center">
              <Edit className="w-4 h-4 text-white" />
            </div>
            <div className="w-8 h-8 rounded-full bg-skrim-surface flex items-center justify-center">
              <MoreVertical className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search messages, veiled chats..." 
            className="w-full bg-skrim-surface border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-neon-purple/50 transition-colors"
          />
        </div>
      </header>

      {/* Tabs */}
      <div className="flex px-4 border-b border-white/5">
        <button 
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'all' ? 'border-neon-purple text-white shadow-[0_4px_10px_-2px_rgba(176,38,255,0.4)]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
        >
          All Chats
        </button>
        <button 
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 flex justify-center items-center gap-2 ${activeTab === 'requests' ? 'border-neon-purple text-white shadow-[0_4px_10px_-2px_rgba(176,38,255,0.4)]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
        >
          Requests 
          {requests.length > 0 && (
            <span className="bg-neon-purple text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">{requests.length}</span>
          )}
        </button>
      </div>

      {activeTab === 'requests' ? (
        <div className="flex-1 overflow-y-auto w-full flex flex-col p-4 no-scrollbar">
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-50 py-10">
              <MessageCircle className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-1">No requests right now</h3>
              <p className="text-sm text-gray-400">When someone you don't follow sends you a message, it will appear here.</p>
            </div>
          ) : (
            requests.map((req) => (
              <div key={req.id} className="flex items-center gap-4 py-4 border-b border-white/5">
                <AvatarWithRing src={req.fromAvatar || `https://i.pravatar.cc/150?u=${req.fromUsername}`} size="lg" />
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold truncate text-white">{req.fromUsername}</h3>
                    <span className="text-[10px] text-gray-500">Just now</span>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2">{req.message}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => {
                     acceptRequest(req.id);
                     navigate(`/connect?user=${req.fromUsername.replace('@', '')}`);
                     // Note: We'll show the custom message in the chat view since we don't have a real backend
                  }} className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center hover:bg-green-500/30 transition">
                    <CheckCircle className="w-5 h-5" />
                  </button>
                  <button onClick={() => declineRequest(req.id)} className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/30 transition">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <>
          {/* Online Now / Quick Connect row */}
          <div className="px-4 py-4 border-b border-white/5">
            <div className="flex gap-4 overflow-x-auto no-scrollbar w-full whitespace-nowrap">
              {loading ? (
                 Array.from({length: 4}).map((_, i) => (
                    <div key={'skeleton-online-'+i} className="w-12 h-12 rounded-full bg-skrim-surface animate-pulse shrink-0" />
                 ))
              ) : chats.slice(0, 4).map(chat => (
                <div key={'online'+chat.id} className="relative shrink-0 cursor-pointer" onClick={() => navigate(`/connect?user=${chat.name.replace(/\s+/g, '_').toLowerCase()}`)}>
                   <AvatarWithRing src={chat.avatar} size="md" showOnlineDot username={chat.name} />
                </div>
              ))}
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto w-full flex flex-col no-scrollbar">
            {loading ? (
                Array.from({length: 4}).map((_, i) => (
                  <div key={'skeleton-chat'+i} className="flex items-center gap-4 px-4 py-3 border-b border-white/5 animate-pulse opacity-50">
                     <div className="w-16 h-16 rounded-full bg-skrim-surface shrink-0" />
                     <div className="flex-1 flex flex-col gap-2"><div className="w-1/2 h-4 bg-skrim-surface rounded"/><div className="w-3/4 h-3 bg-skrim-surface rounded"/></div>
                  </div>
                ))
            ) : chats.map(chat => (
              <div key={chat.id} onClick={() => navigate(`/connect?user=${chat.name.replace(/\s+/g, '_').toLowerCase()}`)} className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.02] active:bg-white/[0.05] transition-colors cursor-pointer border-b border-white/5 last:border-0">
                <AvatarWithRing src={chat.avatar} size="lg" showOnlineDot username={chat.name} />
                
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                       <h3 className="text-sm font-semibold truncate text-white">{chat.name}</h3>
                       <BadgeRow stats={generateMockStatsForBadge(chat.name)} isSmall={true} />
                    </div>
                    <span className={`text-[10px] flex-shrink-0 ml-2 ${chat.unread > 0 ? 'text-neon-purple font-medium' : 'text-gray-500'}`}>{chat.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    {chat.isVeil && (
                      <Lock className="w-3 h-3 text-neon-blue flex-shrink-0" />
                    )}
                    <p className={`text-xs truncate ${chat.unread > 0 ? 'text-white font-medium' : 'text-gray-400 font-normal'}`}>
                      {chat.isVeil && chat.unread > 0 ? 'Encrypted Message' : chat.msg}
                    </p>
                  </div>
                </div>

                {chat.unread > 0 && (
                  <div className="w-5 h-5 rounded-full bg-neon-purple flex items-center justify-center flex-shrink-0 shadow-neon-purple">
                    <span className="text-[10px] font-bold text-white">{chat.unread}</span>
                  </div>
                )}
              </div>
            ))}
            
            {/* Veil Promo Banner */}
            <div className="px-4 py-6 mt-4">
              <GlassCard className="flex flex-col gap-3 p-5 items-center text-center border-neon-blue/20">
                <div className="w-12 h-12 rounded-full bg-neon-blue/10 flex items-center justify-center">
                   <Lock className="w-6 h-6 text-neon-blue drop-shadow-[0_0_10px_rgba(0,240,255,0.8)]" />
                </div>
                <h4 className="text-sm font-bold text-neon-blue">Veil Mode Active</h4>
                <p className="text-[11px] text-gray-400">All direct chats in Veil are end-to-end encrypted locally via TweetNaCl. We cannot read your messages.</p>
                <button className="text-xs font-semibold text-white px-4 py-2 mt-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">Start Encrypted Chat</button>
              </GlassCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
