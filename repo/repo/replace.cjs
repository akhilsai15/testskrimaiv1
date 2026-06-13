const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('skrimchat_my_sparks')) {
    content = content.replace(/skrimchat_my_sparks/g, 'skrimchat_sparks');
    fs.writeFileSync(filePath, content);
    console.log(`Replaced in ${filePath}`);
  }
}

['src/components/SparkViewer.tsx', 'src/screens/SignalScreen.tsx', 'src/screens/PulseScreen.tsx', 'src/screens/IdentityScreen.tsx'].forEach(replaceInFile);
