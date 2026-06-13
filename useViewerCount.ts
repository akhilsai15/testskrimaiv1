import * as fs from 'fs';

const filePath = 'src/screens/VibesScreen.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const baseViewerCountFunc = `
const getBaseViewerCount = (vibe: any) => {
  const pulseCount = parseInt(String(vibe.pulseCount || '1K').replace('K', '000').replace('M', '000000'), 10) || 1000;
  const percentage = 0.15 + (vibe.id.charCodeAt(0) % 10) * 0.01; // deterministic percentage for stability across re-renders for same vibe
  const deterministicPercent = 0.15 + Math.random() * 0.10;
  const base = Math.floor(pulseCount * deterministicPercent);
  return Math.max(base, 12);
};

const useLiveViewerCount = (vibe: any) => {
  const [count, setCount] = useState(() => getBaseViewerCount(vibe));

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(prev => {
        const driftPercent = -0.02 + Math.random() * 0.05;
        const change = Math.floor(prev * driftPercent);
        let next = prev + change;
        if (change === 0 && Math.random() > 0.5) next += (Math.random() > 0.5 ? 1 : -1); 
        
        const base = getBaseViewerCount(vibe);
        const min = Math.floor(base * 0.7);
        const max = Math.floor(base * 1.3);
        
        return Math.max(min, Math.min(max, next));
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [vibe.id]);

  return count;
};

const formatViewerCount = (count: number) => {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
  if (count >= 1000) return (count / 1000).toFixed(1) + "K";
  return count.toString();
};
`;

content = content.replace('const VibeCard = ({', baseViewerCountFunc + '\nconst VibeCard = ({');

const liveViewerHook = `  const liveViewers = useLiveViewerCount(reel);`;
content = content.replace('const handleFollow = () => {', liveViewerHook + '\n\n  const handleFollow = () => {');

const liveViewerUi = `
      {/* Live Viewers Pill */}
      <div className="absolute top-[110px] left-4 z-20 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md rounded-full px-2.5 h-[28px] flex items-center border border-white/10 gap-1.5 opacity-90 transition-opacity duration-300">
           <div className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.8)] animate-[pulseDot_2s_ease-in-out_infinite]" />
           <span className="text-white text-[11px] font-bold" style={{ transition: 'opacity 300ms ease' }}>👁️ {formatViewerCount(liveViewers)} watching now</span>
        </div>
      </div>
`;

content = content.replace(
  '{showLangPill && (',
  liveViewerUi + '\n\n      {showLangPill && ('
);

fs.writeFileSync(filePath, content);
console.log('Done script');
