import * as fs from 'fs';

const filePath = 'src/screens/VibesScreen.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// Update VibeCard argument to include activeIndex and index
content = content.replace(
  'const VibeCard = ({ reel, allVibes, setVibes, isSavedMap, setIsSavedMap, setToastMessage, setShareBanner }: any) => {',
  'const VibeCard = ({ reel, allVibes, setVibes, isSavedMap, setIsSavedMap, setToastMessage, setShareBanner, activeIndex, index }: any) => {'
);

const floatingReactionsComponent = `
const FloatingReaction = ({ emoji, id, onComplete }: any) => {
  const startX = useMemo(() => Math.random() * 40 + 70, []);
  const driftX = useMemo(() => (Math.random() - 0.5) * 80, []);
  const size = useMemo(() => Math.random() * 10 + 24, []);
  const duration = useMemo(() => Math.random() * 1000 + 2500, []);

  useEffect(() => {
    const timer = setTimeout(() => onComplete(id), duration);
    return () => clearTimeout(timer);
  }, [duration, id, onComplete]);

  return (
    <div
      className="floating-reaction pointer-events-none"
      style={{
        position: "absolute",
        right: startX + "px",
        bottom: "100px",
        fontSize: size + "px",
        animation: "floatUpReaction " + duration + "ms ease-out forwards",
        "--drift-x": driftX + "px"
      } as React.CSSProperties}
    >
      {emoji}
    </div>
  );
};
`;

// Insert the floatingReactionsComponent before VibeCard
content = content.replace(
  'const VibeCard = ({',
  floatingReactionsComponent + '\n\nconst VibeCard = ({'
);

const vibeCardStateHook = `
  const [floatingReactions, setFloatingReactions] = useState<any[]>([]);

  const addFloatingReaction = useCallback((emoji: string) => {
    setFloatingReactions(prev => {
      if (prev.length >= 15) return prev;
      const id = "reaction_" + Date.now() + "_" + Math.random();
      return [...prev, { id, emoji }];
    });
  }, []);

  const removeFloatingReaction = useCallback((id: string) => {
    setFloatingReactions(prev => prev.filter(r => r.id !== id));
  }, []);

  useEffect(() => {
    if (activeIndex !== index) return;
    
    // Check randomly
    const REACTION_POOL = ["❤️","🔥","😂","💜","😮","👏","⚡"];
    const interval = setInterval(() => {
      if (Math.random() < 0.4) {
        const emoji = REACTION_POOL[Math.floor(Math.random() * REACTION_POOL.length)];
        addFloatingReaction(emoji);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [activeIndex, index, addFloatingReaction]);
`;

// Insert inside VibeCard right after \`const user = useCurrentUser();\` for instance
content = content.replace(
  'const user = useCurrentUser();',
  'const user = useCurrentUser();\n\n' + vibeCardStateHook
);

const renderOverlay = `
      <div 
        className="floating-reactions-overlay"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
          zIndex: 30
        }}
      >
        {floatingReactions.map(r => (
          <FloatingReaction
            key={r.id}
            emoji={r.emoji}
            id={r.id}
            onComplete={removeFloatingReaction}
          />
        ))}
      </div>
`;

content = content.replace(
  '{/* Bottom Info Bar */}',
  renderOverlay + '\n\n      {/* Bottom Info Bar */}'
);

// Trigger onReact
content = content.replace(
  'if (container) triggerReactionAnimation(container, reactionId, reaction.emoji);',
  'if (container) triggerReactionAnimation(container, reactionId, reaction.emoji);\n                   addFloatingReaction(reaction.emoji);'
);

fs.writeFileSync(filePath, content);
console.log('Done script');
