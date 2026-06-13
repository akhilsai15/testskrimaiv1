const fs = require('fs');
let file = fs.readFileSync('src/screens/VibesScreen.tsx', 'utf8');

const replacement = `      {/* COMMENTS SHEET */}
      <AnimatePresence>
        {showComments && (
           <>
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30"
               onClick={() => setShowComments(false)}
             />
             <motion.div
               initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 300 }}
               className="absolute bottom-0 w-full h-[80%] bg-[#0f0f12]/90 backdrop-blur-3xl shadow-[0_-10px_50px_rgba(176,38,255,0.15)] rounded-t-[32px] z-40 flex flex-col pt-2 border-t border-[#B026FF]/40"
               drag="y"
               dragConstraints={{ top: 0 }}
               onDragEnd={(e, info) => {
                  if (info.offset.y > 100) setShowComments(false);
               }}
               onPointerDown={(e) => e.stopPropagation()}
             >
               <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-2 mb-2" />
               <div className="flex justify-between items-center px-6 pb-4 border-b border-white/5 mx-2">
                 <h2 className="text-white font-bold text-lg flex items-center gap-2">
                   <span className="bg-gradient-to-r from-[#B026FF] to-[#00F0FF] bg-clip-text text-transparent italic tracking-wider">Vibe Chat</span>
                   <span className="text-[10px] bg-white/10 px-2 flex items-center justify-center font-black py-0.5 rounded-full text-white/70">{commentCount}</span>
                 </h2>
               </div>
               <div ref={commentsScrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-hide">
                 {comments.map((c, idx) => (
                   <div key={\`\${c.commentId}_\${idx}\`} className="relative animate-commentSlideIn">
                     {c.replies && c.replies.length > 0 && (
                       <div className="absolute left-[19px] top-[48px] bottom-0 w-[2px] bg-gradient-to-b from-[#B026FF]/50 to-transparent rounded-full" />
                     )}
                     
                     <div className="flex gap-3 relative z-10">
                       <div className="shrink-0">
                         <div className="w-[40px] h-[40px] rounded-full p-[2px] bg-gradient-to-tr from-[#B026FF] to-[#00F0FF] shadow-[0_0_15px_rgba(176,38,255,0.2)]">
                           <img src={c.avatar} className="w-full h-full rounded-full object-cover border-[3px] border-[#0f0f12]" alt="avatar" />
                         </div>
                       </div>
                       <div className="flex-1 group">
                         <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-2xl rounded-tl-sm p-3.5 shadow-lg relative overflow-hidden transition-colors hover:bg-white/[0.06]">
                           <div className="absolute top-0 right-0 w-24 h-24 bg-[#B026FF]/20 blur-3xl rounded-full pointer-events-none" />
                           
                           <h4 className="text-[13px] font-bold text-[#00F0FF] flex items-center gap-2 drop-shadow-[0_0_4px_rgba(0,240,255,0.3)]">
                             {c.username}
                             <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse shadow-[0_0_8px_#00F0FF]" />
                           </h4>
                           <p className="text-white/95 text-[14px] leading-relaxed break-words mt-1 relative z-10">{c.text}</p>
                         </div>
                         
                         <div className="flex gap-5 mt-2 px-1 text-[11px] text-white/50 font-bold items-center tracking-wide">
                           <span>{getRelativeTime(c.createdAt)}</span>
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleToggleCommentLike(c.commentId); }}
                             className={\`flex items-center gap-1.5 transition-all active:scale-95 \${c.isLiked ? 'text-[#B026FF] drop-shadow-[0_0_5px_#B026FF]' : 'hover:text-white'}\`}
                           >
                             <Zap className="w-3.5 h-3.5" fill={c.isLiked ? '#B026FF' : 'transparent'} /> {c.likes || 0}
                           </button>
                           <button 
                             className="uppercase hover:text-[#00F0FF] transition-colors active:scale-95"
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
                           <div key={\`\${reply.commentId}_\${r_idx}\`} className="flex gap-2.5 animate-commentSlideIn relative group">
                             <div className="absolute left-[-25px] top-[14px] w-[16px] h-[2px] bg-[#B026FF]/40 rounded-r-full" />

                             <div className="shrink-0 mt-[-2px]">
                               <div className="w-[30px] h-[30px] rounded-full p-[1px] bg-[#B026FF]/60 shadow-[0_0_10px_rgba(176,38,255,0.2)]">
                                 <img src={reply.avatar} className="w-full h-full rounded-full object-cover border-[2px] border-[#0f0f12]" alt="avatar" />
                               </div>
                             </div>
                             <div className="flex-1">
                               <div className="bg-black/60 border border-white/5 rounded-2xl rounded-tl-sm p-3 outline outline-1 outline-transparent transition-colors group-hover:outline-[#B026FF]/30">
                                 <h4 className="text-[12px] font-bold text-[#e2a8ff] flex items-center gap-1.5 drop-shadow-[0_0_3px_rgba(176,38,255,0.4)]">
                                   {reply.username}
                                 </h4>
                                 <p className="text-white/80 text-[13px] leading-relaxed break-words mt-0.5 relative z-10">{reply.text}</p>
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
                 ))}
                 <div ref={commentsEndRef} />
               </div>
               <div className="border-t border-[#B026FF]/30 bg-[#0a0a0c] flex flex-col relative z-50">
                 {replyingTo && (
                    <div className="flex justify-between items-center px-4 py-2 bg-[#B026FF]/10 mx-4 mt-3 rounded-lg border border-[#B026FF]/20 shadow-inner">
                      <span className="text-xs text-[#e2a8ff]">
                        Replying to <span className="font-bold text-[#00F0FF]">{replyingTo.username}</span>
                      </span>
                      <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-3.5 h-3.5 text-white/70" />
                      </button>
                    </div>
                  )}
                 <div className="p-4 py-6 flex items-center gap-3">
                   <img src={currentProfile.avatar} className="w-[42px] h-[42px] rounded-full border border-white/20 object-cover" alt="avatar" />
                   <form 
                     className="flex-1 flex items-center gap-2"
                     onSubmit={(e) => {
                       e.preventDefault();
                       handleSendComment();
                     }}
                   >
                     <input 
                       ref={inputRef}
                       type="text" 
                       value={commentText}
                       onChange={e => setCommentText(e.target.value)}
                       placeholder="Say something nice..." 
                       className="flex-1 bg-white/5 rounded-full px-5 border border-white/10 outline-none text-white text-[15px] placeholder:text-white/30 h-[48px] focus:border-[#00F0FF]/50 focus:shadow-[0_0_15px_rgba(0,240,255,0.15)] transition-all" 
                     />
                     <button 
                       type="submit"
                       disabled={!commentText.trim()}
                       style={{
                         background: commentText.trim() ? "linear-gradient(135deg, #B026FF, #00F0FF)" : "#222",
                         border: "none",
                         borderRadius: "50%",
                         width: 48,
                         height: 48,
                         display: "flex",
                         alignItems: "center",
                         justifyContent: "center",
                         cursor: commentText.trim() ? "pointer" : "not-allowed",
                         transition: "all 300ms",
                         opacity: commentText.trim() ? 1 : 0.5,
                         boxShadow: commentText.trim() ? "0 0 20px rgba(176,38,255,0.4)" : "none"
                       }}
                     >
                       <span className="text-[#09090b] text-[18px] leading-none ml-[-2px] mt-[2px] font-black tracking-tighter">➤</span>
                     </button>
                   </form>
                 </div>
               </div>
             </motion.div>
           </>
         )}
      </AnimatePresence>`;

const startIndex = file.indexOf('{/* COMMENTS SHEET */}');
if(startIndex !== -1) {
    const endStr = '</AnimatePresence>';
    const endIndex = file.indexOf(endStr, startIndex) + endStr.length;
    file = file.substring(0, startIndex) + replacement + file.substring(endIndex);
    fs.writeFileSync('src/screens/VibesScreen.tsx', file);
    console.log("Successfully replaced Comments block");
} else {
    console.log("Could not find start index");
}
