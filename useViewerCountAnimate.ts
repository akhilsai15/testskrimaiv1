import * as fs from 'fs';

const filePath = 'src/screens/VibesScreen.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const animatedCounter = `
const LiveViewerCounter = ({ count }: { count: number }) => {
  const [displayCount, setDisplayCount] = useState(count);
  const [opacity, setOpacity] = useState(1);
  
  useEffect(() => {
    if (count !== displayCount) {
      setOpacity(0.5);
      const timer = setTimeout(() => {
        setDisplayCount(count);
        setOpacity(1);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [count, displayCount]);

  return (
    <span 
      className="text-white text-[11px] font-bold" 
      style={{ transition: 'opacity 150ms ease-in-out', opacity }}
    >
      👁️ {formatViewerCount(displayCount)} watching now
    </span>
  );
};
`;

content = content.replace(
  'const useLiveViewerCount = (vibe: any) => {',
  animatedCounter + '\nconst useLiveViewerCount = (vibe: any) => {'
);

const liveViewerUiOld = '<span className="text-white text-[11px] font-bold" style={{ transition: \'opacity 300ms ease\' }}>👁️ {formatViewerCount(liveViewers)} watching now</span>';
const liveViewerUiNew = '<LiveViewerCounter count={liveViewers} />';

content = content.replace(liveViewerUiOld, liveViewerUiNew);

fs.writeFileSync(filePath, content);
console.log('Update Animated Counter Done');
