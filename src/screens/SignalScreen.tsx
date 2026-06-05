import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageCircle, UserPlus, CheckCircle, Zap } from 'lucide-react';
import { getNotifications } from '../lib/mock/mockServices';
import { FEATURE_FLAGS } from '../lib/config/featureFlags';
import { AvatarWithRing } from '../components/ui';
import { Link } from 'react-router-dom';

export default function SignalScreen() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchNotifs = async () => {
      setLoading(true);
      if (FEATURE_FLAGS.MOCK_MODE) {
        const baseNotifs = await getNotifications();
        // Inject FOMO notifications
        const fomoNotifs = [
           { id: 'fomo1', user: 'NeonSamurai', avatar: 'https://i.pravatar.cc/150?img=2', type: 'fomo', text: 'just became a BLAZE CREATOR! 🔥', isRead: false, time: '2m' },
           { id: 'fomo2', user: 'CyberGhost', avatar: 'https://i.pravatar.cc/150?img=1', type: 'fomo', text: 'unlocked the FLAME CREATOR badge! ☄️', isRead: true, time: '1h' }
        ];
        // randomly insert them
        setNotifications([...fomoNotifs, ...baseNotifs]);
      }
      setLoading(false);
    };
    fetchNotifs();
  }, []);

  const markAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const filtered = notifications.filter(n => {
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'mentions') return n.type === 'mention';
    return true;
  });

  return (
    <div className="w-full h-full flex flex-col pt-6 pb-24 overflow-y-auto no-scrollbar bg-black">
      <header className="px-4 pb-4 border-b border-white/5 sticky top-0 bg-skrim-bg/90 backdrop-blur-md z-40">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold tracking-tight">Signal</h1>
          <button onClick={markAsRead} className="text-xs text-neon-purple font-medium flex items-center gap-1">
             <CheckCircle className="w-3 h-3" /> Mark Read
          </button>
        </div>
        <div className="flex gap-4">
          {['all', 'unread', 'mentions'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`text-sm font-medium pb-2 border-b-2 transition-colors ${activeTab === tab ? 'border-neon-purple text-white' : 'border-transparent text-gray-500'}`}>
               {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-col flex-1 px-4 py-2">
        {loading ? (
             <div className="flex items-center justify-center p-8"><div className="w-6 h-6 border-2 border-neon-purple/30 border-t-neon-purple rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
           <div className="flex flex-col items-center justify-center flex-1 text-center p-8 opacity-50">
             <Bell className="w-8 h-8 mb-2" />
             <p className="text-sm">No notifications here.</p>
           </div>
        ) : filtered.map(notif => (
           <div key={notif.id} className={`flex items-center gap-4 py-4 border-b border-white/5 ${!notif.isRead ? 'bg-neon-purple/5 -mx-4 px-4' : ''}`}>
              <div 
                 className="relative cursor-pointer hover:opacity-80 transition"
                 onClick={() => navigate(`/profile/${notif.user.replace(/\s+/g, '_').toLowerCase()}`)}
              >
                 <AvatarWithRing src={notif.avatar} size="md" />
                 <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-skrim-surface flex items-center justify-center border-2 border-black">
                   {notif.type === 'pulse' && <Zap className="w-2.5 h-2.5 text-[#B026FF] fill-[#B026FF]" />}
                   {notif.type === 'comment' && <MessageCircle className="w-2.5 h-2.5 text-blue-400" />}
                   {notif.type === 'mention' && <span className="text-[10px] text-neon-purple font-black">@</span>}
                   {notif.type === 'follow' && <UserPlus className="w-2.5 h-2.5 text-green-400" />}
                   {notif.type === 'fomo' && <span className="text-[10px]">🔥</span>}
                 </div>
              </div>
              <div className="flex-1">
                 <p className="text-sm">
                    <span 
                       className="font-semibold text-white cursor-pointer hover:underline"
                       onClick={() => navigate(`/profile/${notif.user.replace(/\s+/g, '_').toLowerCase()}`)}
                    >{notif.user}</span>{' '}
                    <span className="text-gray-400">{notif.text}</span>
                 </p>
                 <span className="text-[10px] text-neon-purple font-medium">{notif.time}</span>
              </div>
           </div>
        ))}
      </div>
    </div>
  );
}
