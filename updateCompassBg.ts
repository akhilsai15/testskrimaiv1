import * as fs from 'fs';

const filePath = 'src/screens/VibesScreen.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// Update Vibe compass container
content = content.replace(
  'className="fixed bottom-[70px] left-0 right-0 z-[60] overflow-x-auto no-scrollbar pointer-events-auto transition-opacity duration-300 px-4 py-2 flex gap-2 w-full"',
  'className="fixed bottom-[65px] left-0 right-0 z-[60] overflow-x-auto no-scrollbar pointer-events-auto transition-opacity duration-300 px-4 py-2 flex gap-2 w-full bg-gradient-to-t from-black/60 to-transparent backdrop-blur-[2px]"'
);

fs.writeFileSync(filePath, content);
console.log('Compass background updated')
