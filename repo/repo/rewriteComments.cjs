const fs = require('fs');
let file = fs.readFileSync('src/screens/VibesScreen.tsx', 'utf8');

const target1 = `className="absolute bottom-0 w-full h-[70%] bg-black rounded-t-2xl z-40 flex flex-col pt-2"`;
const replacement1 = `className="absolute bottom-0 w-full h-[75%] bg-[#09090b]/80 backdrop-blur-3xl shadow-[0_-10px_40px_rgba(176,38,255,0.15)] rounded-t-[32px] z-40 flex flex-col pt-2 border-t border-[#B026FF]/30"`;

const target2 = `<div className="flex justify-center items-center px-6 pb-4 border-b border-white/10">
                  <h2 className="text-white font-bold text-lg">Comments ({commentCount})</h2>
                </div>`;
const replacement2 = `<div className="flex justify-between items-center px-6 pb-4 border-b border-white/5 mx-2">
                  <h2 className="text-white font-bold text-lg flex items-center gap-2">
                    <span className="bg-gradient-to-r from-[#B026FF] to-[#00F0FF] bg-clip-text text-transparent">Vibe Chat</span>
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/70">{commentCount} comments</span>
                  </h2>
                </div>`;
                
const target3 = `<div ref={commentsScrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-6">`;
const replacement3 = `<div ref={commentsScrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-hide">`;

const targetMap = `{comments.map((c, idx) => (
                    <div key={\`\${c.commentId}_\${idx}\`}>
                      <div className="flex gap-3 animate-commentSlideIn">
                        <img src={c.avatar} className="w-[36px] h-[36px] rounded-full border border-white/10 object-cover" alt="avatar" />
                        <div className="flex-1">
                          <h4 className="text-[13px] font-bold text-white leading-tight">{c.username}</h4>
                          <p className="text-white text-[14px] leading-snug break-words mt-0.5">{c.text}</p>
                          <div className="flex gap-4 mt-1 text-[11px] text-white/50 font-semibold items-center">
                            <span>{getRelativeTime(c.createdAt)}</span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleToggleCommentLike(c.commentId); }}
                              className={\`flex items-center gap-1 transition-colors \${c.isLiked ? 'text-[#B026FF]' : 'hover:text-white'}\`}
                            >
                              <Zap className="w-3 h-3" fill={c.isLiked ? '#B026FF' : 'transparent'} /> {c.likes || 0}
                            </button>
                            <button 
                              className="hover:text-white transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReplyingTo({ id: c.commentId, username: c.username });
                                if (inputRef.current) inputRef.current.focus();
                              }}
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>
                      {c.replies && c.replies.length > 0 && (
                        <div className="ml-[48px] mt-3 space-y-3">
                          {c.replies.map((reply: any, r_idx: number) => (
                            <div key={\`\${reply.commentId}_\${r_idx}\`} className="flex gap-3 animate-commentSlideIn">
                              <img src={reply.avatar} className="w-[28px] h-[28px] rounded-full border border-white/10 object-cover" alt="avatar" />
                              <div className="flex-1">
                                <h4 className="text-[12px] font-bold text-white/80 leading-tight">{reply.username}</h4>
                                <p className="text-white/90 text-[13px] leading-snug break-words mt-0.5">{reply.text}</p>
                                <div className="flex gap-4 mt-1 text-[11px] text-white/50 font-semibold items-center">
                                  <span>{getRelativeTime(reply.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}`;
                  
const repMap = `{comments.map((c, idx) => (
                    <div key={\`\${c.commentId}_\${idx}\`} className="relative animate-commentSlideIn">
                      {c.replies && c.replies.length > 0 && (
                        <div className="absolute left-[19px] top-[40px] bottom-0 w-[2px] bg-gradient-to-b from-[#B026FF]/50 to-transparent rounded-full" />
                      )}
                      <div className="flex gap-3 relative z-10">
                        <div className="shrink-0">
                          <div className="w-[40px] h-[40px] rounded-full p-[2px] bg-gradient-to-tr from-[#B026FF] to-[#00F0FF] shadow-[0_0_10px_rgba(176,38,255,0.3)]">
                            <img src={c.avatar} className="w-full h-full rounded-full object-cover border-2 border-[#09090b]" alt="avatar" />
                          </div>
                        </div>
                        <div className="flex-1 group">
                          <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl rounded-tl-sm p-3.5 shadow-lg relative overflow-hidden transition-colors group-hover:bg-white/[0.06]">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-[#B026FF]/30 blur-2xl rounded-full pointer-events-none" />
                            <h4 className="text-[13px] font-bold text-[#00F0FF] flex items-center gap-2">
                              {c.username}
                              <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse shadow-[0_0_5px_#00F0FF]" />
                            </h4>
                            <p className="text-white/95 text-[14px] leading-relaxed break-words mt-1 relative z-10">{c.text}</p>
                          </div>
                          <div className="flex gap-5 mt-2 px-1 text-[11px] text-white/50 font-bold items-center tracking-wide">
                            <span>{getRelativeTime(c.createdAt)}</span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleToggleCommentLike(c.commentId); }}
                              className={\`flex items-center gap-1.5 transition-colors \${c.isLiked ? 'text-[#B026FF] drop-shadow-[0_0_5px_#B026FF]' : 'hover:text-white'}\`}
                            >
                              <Zap className="w-3.5 h-3.5" fill={c.isLiked ? '#B026FF' : 'transparent'} /> {c.likes || 0}
                            </button>
                            <button 
                              className="uppercase hover:text-[#00F0FF] transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReplyingTo({ id: c.commentId, username: c.username });
                                if (inputRef.current) inputRef.current.focus();
                              }}
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>
                      {c.replies && c.replies.length > 0 && (
                        <div className="ml-[44px] mt-4 space-y-4 relative z-10">
                          {c.replies.map((reply: any, r_idx: number) => (
                            <div key={\`\${reply.commentId}_\${r_idx}\`} className="flex gap-2.5 animate-commentSlideIn relative">
                              <div className="absolute left-[-25px] top-[14px] w-[20px] h-[2px] bg-[#B026FF]/40 rounded-r-full" />
                              <div className="shrink-0 mt-[-2px]">
                                <div className="w-[30px] h-[30px] rounded-full p-[1px] bg-[#B026FF]/50 shadow-[0_0_5px_rgba(176,38,255,0.2)]">
                                  <img src={reply.avatar} className="w-full h-full rounded-full object-cover border-2 border-[#09090b]" alt="avatar" />
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="bg-black/60 border border-white/5 rounded-xl rounded-tl-sm p-3 outline outline-1 outline-white/5 transition-colors hover:outline-[#B026FF]/30">
                                  <h4 className="text-[12px] font-bold text-[#e2a8ff] flex items-center gap-1.5">
                                    {reply.username}
                                  </h4>
                                  <p className="text-white/85 text-[13px] leading-relaxed break-words mt-1 relative z-10">{reply.text}</p>
                                </div>
                                <div className="flex gap-4 mt-1.5 px-1 text-[10px] text-white/40 font-bold uppercase tracking-wider items-center">
                                  <span>{getRelativeTime(reply.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}`;
                  
let success = false;
if(file.includes(target1)) {
    file = file.replace(target1, replacement1);
    success = true;
} else {
    console.log("Failed to find target1");
    // Ignore whitespaces
    file = file.replace(/className="absolute bottom-0 w-full h-\[70%\] bg-black rounded-t-2xl z-40 flex flex-col pt-2"/g, replacement1);
}

// target2 might mismatch due to spaces. Use regex to be safe.
file = file.replace(
    /<div className="flex justify-center items-center px-6 pb-4 border-b border-white\/10">\s*<h2 className="text-white font-bold text-lg">Comments \(\{commentCount\}\)<\/h2>\s*<\/div>/g,
    replacement2
);

file = file.replace(
    /<div ref={commentsScrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-6">/g,
    replacement3
);

// Match targetMap by ignoring whitespaces
let mapRegexStr = targetMap.replace(/[\s\n\r]+/g, '\\s*').replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"); // Escape regex
try {
    let re = new RegExp(mapRegexStr, 'g');
    file = file.replace(re, repMap);
} catch(e) {
    console.log("Regex error", e);
}


fs.writeFileSync('src/screens/VibesScreen.tsx', file);
console.log("Replaced using script");
