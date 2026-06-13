import * as fs from 'fs';

const filePath = 'src/screens/VibesScreen.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

content = content.replace('className="absolute bottom-[70px]', 'className="fixed bottom-[70px]');

fs.writeFileSync(filePath, content);
console.log('Done fixed overlay');
