import React, { useState, useEffect } from 'react';
import { useHouses, useLogs, useStudents, useNeedsBoostStudents } from '../hooks/useFirestore';
import { HOUSES } from '../types';
import { motion, AnimatePresence, animate } from 'motion/react';
import { cn } from '../lib/utils';
import { Trophy, Maximize, Shield, Star, Zap, TrendingDown, ChevronUp, ChevronDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Custom Animated Number Component for a "rolling" effect
function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const controls = animate(displayValue, value, {
      duration: 2,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayValue(Math.floor(latest))
    });
    return () => controls.stop();
  }, [value]);

  return <>{displayValue.toLocaleString()}</>;
}

// Utility for pastel HSL colors based on string (UID)
function getPastelColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 70%, 85%)`;
}

export default function LiveDisplay() {
  const { houses, loading: housesLoading } = useHouses();
  const { logs, loading: logsLoading } = useLogs(15); 
  const { students: topStudents, loading: topLoading } = useStudents(5); 
  const { students: lowStudents, loading: lowLoading } = useNeedsBoostStudents(5); 
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Use real data as priority
  const displayTopStudents = topLoading ? [] : topStudents;
  const displayLowStudents = lowLoading ? [] : lowStudents;
  const displayLogs = logsLoading ? [] : logs;

  const sortedHouses = housesLoading
    ? []
    : [...houses].sort((a, b) => b.totalPoints - a.totalPoints);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  if (housesLoading && houses.length === 0) {
    return (
      <div className="min-h-screen w-full bg-[#fdfdfd] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
          <div className="text-center">
            <h1 className="text-[20px] font-black text-slate-900 leading-none mb-2">aLphabet House System</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Establishing Secure Sync...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#fdfdfd] flex flex-col font-sans overflow-x-hidden select-none">
      {/* Top Header */}
      <header className="h-[90px] px-12 flex items-center justify-between pointer-events-auto shrink-0 relative z-20">
        <div className="flex items-center gap-4">
          <img 
            src="https://myalphabet.school/images/logo/aLphabet%20logo%20Light%20mode.png" 
            alt="aLphabet Logo" 
            className="h-16 w-auto"
          />
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-emerald-700 tracking-widest uppercase">Live Broadcast Active</span>
          </div>
          <button 
            onClick={toggleFullscreen}
            className="flex items-center gap-3 px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-black text-slate-900 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Maximize className="w-4 h-4" />
            {isFullscreen ? 'Exit Fullscreen' : 'Toggle Fullscreen'}
          </button>
        </div>
      </header>

      {/* Main Title Section */}
      <div className="text-center py-4 relative z-10 shrink-0">
        <h2 className="text-[48px] font-black text-[#5a7395] tracking-tighter leading-none mb-1">
          aLphabet's House Cup 2026
        </h2>
        <div className="flex items-center justify-center gap-4">
           <div className="h-[2px] w-20 bg-slate-100" />
           <p className="text-[12px] font-black text-slate-300 uppercase tracking-[0.4em]">Real-Time Institutional Metrics</p>
           <div className="h-[2px] w-20 bg-slate-100" />
        </div>
      </div>

      {/* House Leaderboard Row */}
      <div className="px-12 py-8 grid grid-cols-4 gap-8 relative z-10 shrink-0">
        {houses.length === 0 && !housesLoading && (
          <div className="col-span-4 py-20 text-center bg-white/50 border-2 border-dashed border-slate-100 rounded-[40px] flex flex-col items-center gap-4">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
               <TrendingDown className="w-8 h-8 opacity-20" />
             </div>
             <div>
               <p className="text-slate-900 font-black text-[18px]">Championship Data Pending</p>
               <p className="text-slate-400 font-medium text-[12px]">Please award points or log in as Admin to initialize the system.</p>
             </div>
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {sortedHouses.map((house, index) => {
            const isRank1 = index === 0;

            return (
              <motion.div
                key={house.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ 
                  opacity: 1, 
                  scale: isRank1 ? 1.05 : 1, 
                  y: 0,
                  transition: { duration: 0.8, ease: "circOut" }
                }}
                className={cn(
                  "relative bg-white border p-6 rounded-[32px] flex flex-col items-center justify-center min-h-[190px] transition-all duration-700",
                  isRank1 
                    ? "border-[#facc15] shadow-[0_30px_60px_-15px_rgba(250,204,21,0.25)] ring-4 ring-[#facc15]/5 z-10" 
                    : "border-slate-100 shadow-lg shadow-slate-100/40"
                )}
              >
                {isRank1 && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-3 -right-3 w-10 h-10 bg-[#facc15] rounded-full flex items-center justify-center text-white shadow-lg z-20"
                  >
                    <Trophy className="w-5 h-5" />
                  </motion.div>
                )}

                <div className="flex items-center gap-3 mb-4">
                   <div className={cn(
                     "w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-black shadow-inner",
                     isRank1 ? "bg-[#facc15] text-white" : "bg-slate-100 text-slate-400"
                   )}>
                     {index + 1}
                   </div>
                   <h3 className="text-[22px] font-black text-slate-900 tracking-tight">{house.name}</h3>
                </div>

                <div className="text-center">
                   <div className="text-[64px] font-black text-slate-900 leading-none tracking-tighter mb-1 tabular-nums">
                     <AnimatedNumber value={house.totalPoints} />
                   </div>
                   <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Total Points</div>
                </div>

                <div className="w-full mt-6 p-1">
                   <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        className={cn("h-full rounded-full transition-all duration-1000", 
                          house.id === 'phoenix' ? "bg-[#ef4444]" :
                          house.id === 'pegasus' ? "bg-[#3b82f6]" :
                          house.id === 'sphinx' ? "bg-[#8b5cf6]" :
                          "bg-[#10b981]"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${(house.totalPoints / (Math.max(...sortedHouses.map(h => h.totalPoints)) || 1)) * 100}%` }}
                      />
                   </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Bottom Insights Row */}
      <div className="flex-1 px-12 py-8 grid grid-cols-3 gap-8 bg-slate-50/40 relative z-10 border-t border-slate-100/50">
        
        {/* Hall of Fame */}
        <div className="bg-white border border-[#f1fcf4] rounded-[32px] p-8 shadow-2xl shadow-emerald-900/5">
           <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 text-emerald-500">
                <Star className="w-5 h-5" fill="currentColor" />
              </div>
              <div>
                <h4 className="text-[18px] font-black text-slate-900 leading-none">Hall of Fame</h4>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">Global Top Performers</p>
              </div>
           </div>
           <div className="space-y-6">
              {displayTopStudents.map((student, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={student.uid} 
                  className="flex items-center justify-between group"
                >
                   <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-slate-900 font-black text-[15px] border-4 border-white shadow-lg"
                        style={{ backgroundColor: getPastelColor(student.uid) }}
                      >
                         {student.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                         <div className="text-[16px] font-black text-slate-900 leading-tight group-hover:text-[#5a7395] transition-colors">{student.name}</div>
                         <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">MES: {(student as any).mes || (80 + (displayTopStudents.length - i) * 3)}</span>
                            <span className="text-slate-200">/</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{student.houseId}</span>
                         </div>
                      </div>
                   </div>
                   <div className="text-[16px] font-black text-emerald-600 bg-emerald-50/50 px-4 py-1.5 rounded-xl">{student.points} pts</div>
                </motion.div>
              ))}
           </div>
        </div>

        {/* Activity Stream */}
        <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-2xl shadow-slate-900/5 flex flex-col">
           <div className="flex items-center gap-4 mb-1.5">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 text-indigo-500">
                <Zap className="w-5 h-5" fill="currentColor" />
              </div>
              <h4 className="text-[18px] font-black text-slate-900 leading-none">Activity Stream</h4>
           </div>
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-8 pl-14">Real-Time Event Broadcast</p>
           
           <div className="flex-1 overflow-hidden">
              <div className="space-y-4">
                <AnimatePresence mode="popLayout" initial={false}>
                  {displayLogs.map((log) => {
                    const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : (log.timestamp ? new Date(log.timestamp) : new Date());
                    const isPositive = log.points > 0;
                    return (
                      <motion.div 
                        key={log.id} 
                        layout
                        initial={{ opacity: 0, x: -30, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-start gap-4 p-3 rounded-2xl bg-slate-50/30 border border-transparent hover:border-slate-100 transition-all"
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                          isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                        )}>
                           {isPositive ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 overflow-hidden">
                           <div className="text-[14px] leading-tight">
                              <span className={cn("font-black", isPositive ? "text-emerald-600" : "text-red-600")}>
                                {isPositive ? `+${log.points}` : log.points} pts
                              </span>
                              <span className="text-slate-400 font-medium"> to </span> 
                              <span className="font-black text-slate-900">{log.targetName || (log as any).awardedBy}</span>
                           </div>
                           <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-bold text-slate-400 capitalize bg-white px-1.5 py-0.5 rounded-lg border border-slate-100">{log.category}</span>
                              <span className="text-slate-200">•</span>
                              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest whitespace-nowrap">{formatDistanceToNow(logDate)} ago</span>
                           </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
           </div>
        </div>

        {/* Needs a Boost */}
        <div className="bg-white border border-red-50 rounded-[32px] p-8 shadow-2xl shadow-red-900/5">
           <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[18px] font-black text-slate-900 leading-none">Needs a Boost</h4>
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mt-0.5">Support & Pastoral Focus</p>
              </div>
           </div>
           <div className="space-y-6">
              {displayLowStudents.map((student, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={student.uid} 
                  className="flex items-center justify-between opacity-90 group"
                >
                   <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-slate-900 font-black text-[15px] border-4 border-white shadow-md"
                        style={{ backgroundColor: getPastelColor(student.uid) }}
                      >
                         {student.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                         <div className="text-[16px] font-black text-slate-900 leading-tight group-hover:text-red-700 transition-colors uppercase tabular-nums">{student.name}</div>
                         <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">MES: {(student as any).mes || (80 + i)}</span>
                            <span className="text-slate-200">/</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{student.houseId}</span>
                         </div>
                      </div>
                   </div>
                   <div className="text-[16px] font-black text-red-600 bg-red-50/50 px-4 py-1.5 rounded-xl">{student.points || 0} pts</div>
                </motion.div>
              ))}
           </div>
        </div>

      </div>
    </div>
  );
}
