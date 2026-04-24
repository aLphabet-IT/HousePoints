import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHouses, useLogs, useStudents, useNeedsBoostStudents } from '../hooks/useFirestore';
import { HOUSES } from '../types';
import { motion, AnimatePresence, animate } from 'motion/react';
import { cn } from '../lib/utils';
import { Trophy, Maximize, Shield, Star, Zap, TrendingDown, ChevronUp, ChevronDown, ArrowLeft } from 'lucide-react';
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
  const navigate = useNavigate();
  const { houses, loading: housesLoading } = useHouses();
  const { logs, loading: logsLoading } = useLogs(30); 
  const { students: topStudents, loading: topLoading } = useStudents(30); 
  const { students: lowStudents, loading: lowLoading } = useNeedsBoostStudents(30); 
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pagination and Scroll Handling
  const ITEMS_PER_PAGE = 6;
  const [topPage, setTopPage] = useState(0);
  const [logsPage, setLogsPage] = useState(0);
  const [lowPage, setLowPage] = useState(0);
  const scrollLock = useRef<{ [key: string]: number }>({});

  const handleWheel = (key: string, e: React.WheelEvent, setPage: React.Dispatch<React.SetStateAction<number>>, totalItems: number) => {
    const now = Date.now();
    if (now - (scrollLock.current[key] || 0) < 600) return; // Throttle scroll actions

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    if (totalPages <= 1) return;

    if (e.deltaY > 10) {
      setPage(prev => (prev + 1) % totalPages);
      scrollLock.current[key] = now;
    } else if (e.deltaY < -10) {
      setPage(prev => (prev - 1 + totalPages) % totalPages);
      scrollLock.current[key] = now;
    }
  };

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

  const toggleFullscreen = async () => {
    try {
      const container = containerRef.current;
      if (!container) return;

      if (!document.fullscreenElement) {
        // Support for standard and vendor-prefixed methods
        const requestMethod = 
          container.requestFullscreen || 
          (container as any).webkitRequestFullscreen || 
          (container as any).mozRequestFullScreen || 
          (container as any).msRequestFullscreen;

        if (requestMethod) {
          await requestMethod.call(container);
        } else {
          // Fallback to direct URL if blocked by iframe
          window.open(window.location.href, '_blank');
        }
      } else {
        const exitMethod = 
          document.exitFullscreen || 
          (document as any).webkitExitFullscreen || 
          (document as any).mozCancelFullScreen || 
          (document as any).msExitFullscreen;

        if (exitMethod) {
          await exitMethod.call(document);
        }
      }
    } catch (err) {
      console.error("Fullscreen toggle failed:", err);
      // If it fails (common in iframes), suggest opening in new tab
      alert("Note: Fullscreen might be blocked by browser security inside this frame. Try opening the app in a new tab for full broadcast mode.");
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
    <div ref={containerRef} className={cn("min-h-screen w-full bg-[#fdfdfd] flex flex-col font-sans select-none transition-all duration-500", isFullscreen ? "h-screen overflow-hidden scrollbar-hide" : "overflow-y-auto custom-scrollbar")}>
      {/* Top Header */}
      <header className="h-[70px] lg:h-[90px] px-4 md:px-8 lg:px-12 flex items-center justify-between pointer-events-auto shrink-0 relative z-20 bg-white/80 backdrop-blur-md border-b border-slate-100 lg:border-none">
        <div className="flex items-center gap-2 md:gap-6">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-[11px] md:text-[13px] font-black text-slate-600 transition-all border border-slate-100"
          >
            <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden xs:inline">Back</span>
          </button>
          
          <img 
            src="https://myalphabet.school/images/logo/aLphabet%20logo%20Light%20mode.png" 
            alt="aLphabet Logo" 
            className="h-8 md:h-12 w-auto"
          />
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          <button 
            onClick={toggleFullscreen}
            className="flex items-center gap-2 md:gap-3 px-3 md:px-6 py-2 md:py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] md:text-[13px] font-black text-slate-900 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Maximize className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">{isFullscreen ? 'Exit Fullscreen' : 'Toggle Fullscreen'}</span>
            <span className="sm:hidden">{isFullscreen ? 'Exit' : 'Full'}</span>
          </button>
        </div>
      </header>

      {/* Main Title Section */}
      <div className="text-center py-3 sm:py-4 md:py-6 lg:py-8 relative z-10 shrink-0">
        <h2 className="text-[20px] xs:text-[24px] sm:text-[36px] md:text-[42px] lg:text-[48px] font-black text-[#5a7395] tracking-tighter leading-tight mb-1 px-4">
          aLphabet's House Cup 2026
        </h2>
      </div>

      {/* House Leaderboard Row */}
      <div className="px-4 md:px-8 lg:px-12 py-3 md:py-6 lg:py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 relative z-10 shrink-0">
        {houses.length === 0 && !housesLoading && (
          <div className="col-span-1 sm:col-span-2 lg:col-span-4 py-12 md:py-20 text-center bg-white/50 border-2 border-dashed border-slate-100 rounded-[32px] md:rounded-[40px] flex flex-col items-center gap-4">
             <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
               <TrendingDown className="w-6 h-6 md:w-8 md:h-8 opacity-20" />
             </div>
             <div className="px-6">
               <p className="text-slate-900 font-black text-[16px] md:text-[18px]">Championship Data Pending</p>
               <p className="text-slate-400 font-medium text-[11px] md:text-[12px]">Please award points or log in as Admin to initialize the system.</p>
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
                  "relative bg-white border p-4 sm:p-5 md:p-6 rounded-[20px] sm:rounded-[24px] md:rounded-[32px] flex flex-col items-center justify-center min-h-[140px] sm:min-h-[160px] md:min-h-[190px] transition-all duration-700",
                  isRank1 
                    ? (house.id === 'phoenix' ? "border-red-500 shadow-[0_20px_40px_-15px_rgba(239,68,68,0.25)] sm:shadow-[0_30px_60px_-15px_rgba(239,68,68,0.25)] ring-4 ring-red-500/5 z-10" :
                       house.id === 'pegasus' ? "border-blue-500 shadow-[0_20px_40px_-15px_rgba(59,130,246,0.25)] sm:shadow-[0_30px_60px_-15px_rgba(59,130,246,0.25)] ring-4 ring-blue-500/5 z-10" :
                       house.id === 'sphinx' ? "border-amber-400 shadow-[0_20px_40px_-15px_rgba(251,191,36,0.25)] sm:shadow-[0_30px_60px_-15px_rgba(251,191,36,0.25)] ring-4 ring-amber-400/5 z-10" :
                       "border-emerald-500 shadow-[0_20px_40px_-15px_rgba(16,185,129,0.25)] sm:shadow-[0_30px_60px_-15px_rgba(16,185,129,0.25)] ring-4 ring-emerald-500/5 z-10")
                    : "border-slate-100 shadow-lg shadow-slate-100/40"
                )}
              >
                {isRank1 && (
                  <motion.div 
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="absolute -top-4 -right-4 md:-top-7 md:-right-7 w-16 h-20 md:w-24 md:h-28 z-20 flex flex-col items-center"
                  >
                    <div className="relative w-full h-full flex flex-col items-center">
                      {/* Ribbons */}
                      <div className="absolute top-[60%] w-full h-[40%] flex justify-center gap-1">
                        <div className={cn(
                          "w-4 md:w-6 h-full origin-top rotate-[15deg] rounded-b-sm shadow-sm",
                          house.id === 'phoenix' ? "bg-red-600" :
                          house.id === 'pegasus' ? "bg-blue-600" :
                          house.id === 'sphinx' ? "bg-amber-500" :
                          "bg-emerald-600"
                        )} />
                        <div className={cn(
                          "w-4 md:w-6 h-full origin-top -rotate-[15deg] rounded-b-sm shadow-sm",
                          house.id === 'phoenix' ? "bg-red-600" :
                          house.id === 'pegasus' ? "bg-blue-600" :
                          house.id === 'sphinx' ? "bg-amber-500" :
                          "bg-emerald-600"
                        )} />
                      </div>

                      {/* Jagged / Sunburst Circle Body */}
                      <div className={cn(
                        "relative w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-xl border-2 border-white/50",
                        house.id === 'phoenix' ? "bg-gradient-to-br from-red-400 to-red-600" :
                        house.id === 'pegasus' ? "bg-gradient-to-br from-blue-400 to-blue-600" :
                        house.id === 'sphinx' ? "bg-gradient-to-br from-amber-300 to-amber-500" :
                        "bg-gradient-to-br from-emerald-400 to-emerald-600"
                      )}>
                        {/* Decorative inner ring */}
                        <div className="absolute inset-1 rounded-full border border-white/20" />
                        
                        <div className="flex flex-col items-center">
                          <Trophy className="w-6 h-6 md:w-8 md:h-8 text-white drop-shadow-md" strokeWidth={2.5} />
                          <span className="text-[10px] md:text-[12px] font-black text-white uppercase tracking-tighter drop-shadow-md">1st</span>
                        </div>
                      </div>

                      {/* Rank Tag Overlay Removed */}
                    </div>
                  </motion.div>
                )}

                <div className="flex items-center gap-3 mb-2 md:mb-4">
                   <div className={cn(
                     "w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[11px] md:text-[13px] font-black shadow-inner transition-colors",
                     isRank1 
                        ? (house.id === 'phoenix' ? "bg-red-500 text-white" :
                           house.id === 'pegasus' ? "bg-blue-500 text-white" :
                           house.id === 'sphinx' ? "bg-amber-400 text-white" :
                           "bg-emerald-500 text-white")
                        : (house.id === 'phoenix' ? "bg-red-50 text-red-500" :
                           house.id === 'pegasus' ? "bg-blue-50 text-blue-500" :
                           house.id === 'sphinx' ? "bg-amber-50 text-amber-500" :
                           "bg-emerald-50 text-emerald-500")
                   )}>
                     {index + 1}
                   </div>
                   <h3 className="text-[16px] sm:text-[18px] md:text-[22px] font-black text-slate-900 tracking-tight">{house.name}</h3>
                </div>

                <div className="text-center">
                   <div className="text-[40px] sm:text-[48px] md:text-[64px] font-black text-slate-900 leading-none tracking-tighter mb-1 tabular-nums">
                     <AnimatedNumber value={house.totalPoints} />
                   </div>
                   <div className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Total Points</div>
                </div>

                <div className="w-full mt-4 md:mt-6 p-1">
                   <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        className={cn("h-full rounded-full transition-all duration-1000", 
                          house.id === 'phoenix' ? "bg-[#ef4444]" :
                          house.id === 'pegasus' ? "bg-[#3b82f6]" :
                          house.id === 'sphinx' ? "bg-[#F59D0B]" :
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
      <div className="flex-1 px-4 md:px-8 lg:px-12 py-6 md:py-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 bg-slate-50/40 relative z-10 border-t border-slate-100/50">
        
        {/* Hall of Fame */}
        <div className="bg-white border border-[#f1fcf4] rounded-[24px] md:rounded-[32px] p-6 lg:p-8 shadow-2xl shadow-emerald-900/5 flex flex-col min-h-[340px] sm:min-h-[360px] md:min-h-[400px]">
           <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" />
                </div>
                <div>
                  <h4 className="text-[15px] sm:text-[18px] font-black text-slate-900 leading-none">Hall of Fame</h4>
                  <p className="text-[8px] sm:text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">Top Performers</p>
                </div>
              </div>
           </div>
           
           <div 
             className="flex-1 overflow-hidden"
             onWheel={(e) => handleWheel('top', e, setTopPage, displayTopStudents.length)}
           >
              <AnimatePresence mode="wait">
                <motion.div
                  key={topPage}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="space-y-4"
                >
                  {displayTopStudents.slice(topPage * ITEMS_PER_PAGE, (topPage + 1) * ITEMS_PER_PAGE).map((student, i) => (
                    <div 
                      key={student.uid} 
                      className="flex items-center justify-between group"
                    >
                       <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-slate-900 font-black text-[11px] md:text-[13px] border-2 border-white shadow-md cursor-default pointer-events-none"
                            style={{ backgroundColor: getPastelColor(student.uid) }}
                          >
                             {student.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                             <div className="text-[13px] md:text-[14px] font-black text-slate-900 leading-tight group-hover:text-[#5a7395] transition-colors">{student.name}</div>
                             <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{student.houseId}</span>
                             </div>
                          </div>
                       </div>
                       <div className="text-[12px] md:text-[14px] font-black text-emerald-600 bg-emerald-50/50 px-2 md:px-3 py-1 rounded-lg">{student.points} pts</div>
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
           </div>
        </div>

        {/* Activity Stream */}
        <div className="bg-white border border-slate-100 rounded-[24px] md:rounded-[32px] p-6 md:p-8 shadow-2xl shadow-slate-900/5 flex flex-col min-h-[360px] md:min-h-[400px]">
           <div className="flex items-center justify-between mb-6 md:mb-8">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                  <Zap className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" />
                </div>
                <div>
                  <h4 className="text-[16px] md:text-[18px] font-black text-slate-900 leading-none">Activity Stream</h4>
                  <p className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mt-0.5">Event Broadcast</p>
                </div>
              </div>
           </div>
           
           <div 
             className="flex-1 overflow-hidden"
             onWheel={(e) => handleWheel('logs', e, setLogsPage, displayLogs.length)}
           >
              <AnimatePresence mode="wait">
                <motion.div
                  key={logsPage}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="space-y-3"
                >
                  {displayLogs.slice(logsPage * ITEMS_PER_PAGE, (logsPage + 1) * ITEMS_PER_PAGE).map((log) => {
                    const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : (log.timestamp ? new Date(log.timestamp) : new Date());
                    const isPositive = log.points > 0;
                    return (
                      <div 
                        key={log.id} 
                        className="flex items-start gap-3 p-2 rounded-xl bg-slate-50/30 border border-transparent hover:border-slate-100 transition-all"
                      >
                        <div className={cn(
                          "w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                          isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                        )}>
                           {isPositive ? <ChevronUp className="w-3 h-3 md:w-4 md:h-4" /> : <ChevronDown className="w-3 h-3 md:w-4 md:h-4" />}
                        </div>
                        <div className="flex-1 overflow-hidden">
                           <div className="text-[11px] sm:text-[12px] leading-tight">
                              <span className={cn("font-black", isPositive ? "text-emerald-600" : "text-red-600")}>
                                {isPositive ? `+${log.points}` : log.points} pts
                              </span>
                              <span className="text-slate-400 font-medium"> </span> 
                              <span className="font-black text-slate-900 truncate inline-block max-w-[80px] sm:max-w-[120px] align-bottom">{log.targetName || (log as any).awardedBy}</span>
                           </div>
                           <div className="flex items-center gap-1 sm:gap-2 mt-1">
                              <span className="text-[7px] sm:text-[9px] font-bold text-slate-400 capitalize bg-white px-1 sm:px-1.5 py-0.5 rounded-lg border border-slate-100">{log.category}</span>
                              <span className="text-slate-200">•</span>
                              <span className="text-[8px] sm:text-[10px] font-black text-slate-300 uppercase tracking-widest whitespace-nowrap">{formatDistanceToNow(logDate)} ago</span>
                           </div>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
           </div>
        </div>

        {/* Needs a Boost */}
        <div className="bg-white border border-red-50 rounded-[24px] md:rounded-[32px] p-6 md:p-8 shadow-2xl shadow-red-900/5 flex flex-col min-h-[360px] md:min-h-[400px] md:col-span-2 lg:col-span-1">
           <div className="flex items-center justify-between mb-6 md:mb-8">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
                  <TrendingDown className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div>
                  <h4 className="text-[16px] md:text-[18px] font-black text-slate-900 leading-none">Needs a Boost</h4>
                  <p className="text-[9px] md:text-[10px] font-black text-red-600 uppercase tracking-widest mt-0.5">Support Focus</p>
                </div>
              </div>
           </div>
           
           <div 
             className="flex-1 overflow-hidden"
             onWheel={(e) => handleWheel('low', e, setLowPage, displayLowStudents.length)}
           >
              <AnimatePresence mode="wait">
                <motion.div
                  key={lowPage}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="space-y-4"
                >
                  {displayLowStudents.slice(lowPage * ITEMS_PER_PAGE, (lowPage + 1) * ITEMS_PER_PAGE).map((student, i) => (
                    <div 
                      key={student.uid} 
                      className="flex items-center justify-between opacity-90 group"
                    >
                       <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-slate-900 font-black text-[11px] md:text-[13px] border-2 border-white shadow-md pointer-events-none"
                            style={{ backgroundColor: getPastelColor(student.uid) }}
                          >
                             {student.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                             <div className="text-[13px] md:text-[14px] font-black text-slate-900 leading-tight group-hover:text-red-700 transition-colors uppercase tabular-nums">{student.name}</div>
                             <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{student.houseId}</span>
                             </div>
                          </div>
                       </div>
                       <div className="text-[12px] md:text-[14px] font-black text-red-600 bg-red-50/50 px-2 md:px-3 py-1 rounded-lg">{student.points || 0} pts</div>
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
           </div>
        </div>

      </div>
    </div>
  );
}
