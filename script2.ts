import * as fs from 'fs';

const filePath = 'src/screens/VibesScreen.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const compassStart = content.indexOf('{/* VIBE COMPASS */}');
const compassEnd = content.indexOf('</div>', compassStart);
// compass block is a big div, let's find the closing tag. It has inner stuff.
// Or wait, from "\n      {/* VIBE COMPASS */}" until "              </motion.button>\n            )\n         })}\n      </div>"

const compassBlockStart = content.indexOf('      {/* VIBE COMPASS */}');
const compassBlockEndMarker = '      </div>\n    </div>\n  );\n};\n';
let compassBlockEnd = content.indexOf(compassBlockEndMarker, compassBlockStart);

if (compassBlockStart !== -1) {
   const extractedCompass = content.substring(compassBlockStart, content.indexOf('      </div>', compassBlockStart) + '      </div>\n'.length);
   // Remove it from VibeCard
   content = content.replace(extractedCompass, '');

   // Insert before the last </div> inside VibesScreen
   // We know VibesScreen has:
   /*
   1272-  return (
   1273-    <div className={\`w-full h-full bg-black relative snap-y snap-mandatory overflow-y-auto no-scrollbar \${isLateNight ? 'brightness-[0.85]' : ''}\`} onScroll={(e) => {
   
   Wait, the end of VibesScreen is just:
       </div>
       );
     }
  */
  
   const vibesScreenEnd = content.lastIndexOf('</div>\n  );\n}\n');
   if (vibesScreenEnd !== -1) {
       content = content.substring(0, vibesScreenEnd) + extractedCompass + content.substring(vibesScreenEnd);
       fs.writeFileSync(filePath, content);
       console.log("Moved compass successfully");
   } else {
       console.log("Could not find end of VibesScreen");
   }
} else {
    console.log("Could not find compass UI block");
}
