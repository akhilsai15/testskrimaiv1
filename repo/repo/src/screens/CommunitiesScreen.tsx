import React, { useState, useEffect } from 'react';
import { Users, Info, Plus } from 'lucide-react';
import { getCommunities } from '../lib/mock/mockServices';
import { FEATURE_FLAGS } from '../lib/config/featureFlags';

export default function CommunitiesScreen() {
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComms = async () => {
      setLoading(true);
      if (FEATURE_FLAGS.MOCK_MODE) {
        setCommunities(await getCommunities());
      }
      setLoading(false);
    };
    fetchComms();
  }, []);

  return (
    <div className="w-full h-full flex flex-col pt-6 pb-24 overflow-y-auto no-scrollbar bg-black">
      <header className="px-4 pb-4 border-b border-white/5 sticky top-0 bg-skrim-bg/90 backdrop-blur-md z-40 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Communities</h1>
        <div className="w-8 h-8 rounded-full bg-skrim-surface flex items-center justify-center">
          <Plus className="w-4 h-4 text-white" />
        </div>
      </header>

      <div className="p-4 flex flex-col gap-4">
        {loading ? (
             <div className="flex items-center justify-center p-8"><div className="w-6 h-6 border-2 border-neon-purple/30 border-t-neon-purple rounded-full animate-spin" /></div>
        ) : communities.map(comm => (
          <div key={comm.id} className="bg-skrim-surface rounded-2xl p-4 border border-white/5 flex gap-4 items-center relative overflow-hidden group">
             {comm.isPaid && (
               <div className="absolute top-0 right-0 bg-neon-purple text-white text-[8px] font-black px-2 py-0.5 rounded-bl-lg uppercase">Premium</div>
             )}
             <img src={comm.avatar} alt="comm" className="w-16 h-16 rounded-xl object-cover" />
             <div className="flex-1">
               <h3 className="font-bold text-lg mb-1">{comm.name}</h3>
               <p className="text-xs text-gray-400 flex items-center gap-1"><Users className="w-3 h-3" /> {comm.members}</p>
             </div>
             <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold transition-colors">
               Join
             </button>
          </div>
        ))}
        
        <div className="mt-8 p-6 bg-gradient-to-br from-neon-blue/10 to-transparent rounded-2xl border border-neon-blue/20">
          <Info className="w-6 h-6 text-neon-blue mb-2" />
          <h4 className="font-bold text-white mb-1">Create your own space</h4>
          <p className="text-xs text-gray-400 mb-4">Launch a free or premium community for your audience.</p>
          <button className="bg-neon-blue text-black font-bold text-xs px-4 py-2 rounded-xl">Create Community</button>
        </div>
      </div>
    </div>
  );
}
