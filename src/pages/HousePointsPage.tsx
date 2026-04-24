import React from 'react';
import { useHouses, useLogs } from '../hooks/useFirestore';
import { HOUSES } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Trophy, ArrowLeft, Sparkles, TrendingUp, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Leaderboard from '../components/Leaderboard';
import ActivityFeed from '../components/ActivityFeed';

export default function HousePointsPage() {
  const { houses, loading } = useHouses();
  const { logs, loading: logsLoading } = useLogs(50);
  const navigate = useNavigate();

  if (loading && houses.length === 0) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-white/5 border-t-white rounded-full animate-spin" />
          <div className="text-center">
            <h1 className="text-[20px] font-black text-white leading-none mb-2">Establishing Sync...</h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Authenticating with House Hub</p>
          </div>
        </div>
      </div>
    );
  }

  const sortedHouses = [...houses].sort((a, b) => b.totalPoints - a.totalPoints);
  const topHouse = sortedHouses[0];

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-pegasus selection:text-white font-sans flex flex-col">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-phoenix/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pegasus/20 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-centaur/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
      </div>

      {/* Glass Navigation */}
      <nav className="relative z-50 backdrop-blur-md bg-black/20 border-b border-white/5 px-4 sm:px-8 h-16 sm:h-20 flex-shrink-0 flex items-center justify-between sticky top-0">
        <div className="flex items-center gap-3 sm:gap-6">
          <button 
            onClick={() => navigate(-1)}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all active:scale-90"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
          </button>
          <div className="flex items-center gap-2 sm:gap-3">
             <img 
               src="https://myalphabet.school/images/logo/aLphabet%20logo%20Light%20mode.png" 
               alt="aLphabet Logo" 
               className="h-6 sm:h-10 w-auto brightness-0 invert"
             />
             <h1 className="text-sm sm:text-xl font-black tracking-tighter truncate max-w-[120px] sm:max-w-none">House Point Hub</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
           <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Live Engine</span>
        </div>
      </nav>

      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 lg:overflow-hidden flex flex-col">
        {/* Animated Hero Section */}
        <div className="mb-6 sm:mb-8 text-center flex-shrink-0">
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="inline-block"
           >
             <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 inline-block">Global Championship</span>
             <h2 className="text-3xl sm:text-5xl font-black tracking-tighter mb-2 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent leading-tight">
                Battle of the Houses
             </h2>
             <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto font-medium leading-relaxed px-4">
                The ultimate real-time battle for supremacy. Every point counts towards your legacy.
             </p>
           </motion.div>
        </div>

        {/* Feature Grid */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 sm:gap-8 flex-1 min-h-0">
           
           {/* Top 3 Podium (Animated) */}
           <div className="flex flex-col min-h-0 lg:col-span-8">
              <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end py-4 sm:py-6 flex-shrink-0">
                  {/* 2nd Place */}
                  {sortedHouses[1] && (
                    <motion.div 
                       initial={{ scale: 0.9, opacity: 0 }}
                       animate={{ scale: 1, opacity: 1 }}
                       transition={{ delay: 0.2 }}
                       className="flex flex-col items-center gap-2 sm:gap-4 flex-1"
                    >
                       <div className="w-full h-24 sm:h-32 bg-white/5 backdrop-blur-sm border border-white/10 rounded-t-[24px] sm:rounded-t-[40px] flex flex-col items-center justify-end pb-4 sm:pb-8 relative group overflow-hidden">
                          <div className="text-[40px] sm:text-[80px] font-black absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5">2</div>
                          <div className="text-lg sm:text-2xl font-black tabular-nums">{sortedHouses[1].totalPoints.toLocaleString()}</div>
                          <div className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Points</div>
                          <div className={cn("absolute bottom-0 w-full h-1", HOUSES.find(h => h.id === sortedHouses[1].id)?.color)} />
                       </div>
                       <div className="text-center">
                          <div className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">{sortedHouses[1].name}</div>
                       </div>
                    </motion.div>
                  )}

                  {/* 1st Place */}
                  {sortedHouses[0] && (
                    <motion.div 
                       initial={{ scale: 0.9, opacity: 0, y: -20 }}
                       animate={{ scale: 1, opacity: 1, y: 0 }}
                       className="flex flex-col items-center gap-2 sm:gap-4 flex-1 relative"
                    >
                       <motion.div 
                         initial={{ opacity: 0, scale: 0.5 }}
                         animate={{ opacity: 1, scale: 1 }}
                         className="absolute -top-8 sm:-top-12 -right-6 sm:-right-8 w-16 h-16 sm:w-24 sm:h-24 z-20 pointer-events-none"
                       >
                          <dotlottie-wc 
                            src="https://lottie.host/7db9475b-0625-4088-810a-871dd07f6dad/HHKsC52X5R.lottie" 
                            style={{ width: '100%', height: '100%' }} 
                            autoplay 
                            loop 
                          />
                       </motion.div>
                       <Trophy className="w-6 h-6 sm:w-10 sm:h-10 text-amber-400 mb-1 sm:mb-2 filter drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]" />
                       <div className="w-full h-32 sm:h-44 bg-white border border-white rounded-t-[24px] sm:rounded-t-[40px] flex flex-col items-center justify-end pb-4 sm:pb-8 relative shadow-[0_0_80px_rgba(255,255,255,0.1)]">
                          <div className="text-[60px] sm:text-[120px] font-black absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-900 opacity-5">1</div>
                          <div className="text-xl sm:text-4xl font-black tabular-nums text-slate-950">{sortedHouses[0].totalPoints.toLocaleString()}</div>
                          <div className="text-[9px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">Leading Points</div>
                       </div>
                       <div className="text-center">
                          <div className="text-xs sm:text-lg font-black text-white tracking-tight">{sortedHouses[0].name}</div>
                       </div>
                    </motion.div>
                  )}

                  {/* 3rd Place */}
                  {sortedHouses[2] && (
                    <motion.div 
                       initial={{ scale: 0.9, opacity: 0 }}
                       animate={{ scale: 1, opacity: 1 }}
                       transition={{ delay: 0.4 }}
                       className="flex flex-col items-center gap-2 sm:gap-4 flex-1"
                    >
                       <div className="w-full h-20 sm:h-24 bg-white/5 backdrop-blur-sm border border-white/10 rounded-t-[24px] sm:rounded-t-[40px] flex flex-col items-center justify-end pb-4 sm:pb-8 relative overflow-hidden">
                          <div className="text-[40px] sm:text-[80px] font-black absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5">3</div>
                          <div className="text-base sm:text-xl font-black tabular-nums">{sortedHouses[2].totalPoints.toLocaleString()}</div>
                          <div className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Points</div>
                          <div className={cn("absolute bottom-0 w-full h-1", HOUSES.find(h => h.id === sortedHouses[2].id)?.color)} />
                       </div>
                       <div className="text-center">
                          <div className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">{sortedHouses[2].name}</div>
                       </div>
                    </motion.div>
                  )}
              </div>

              {/* Detailed Leaderboard Wrapper */}
              <div className="bg-white/5 backdrop-blur-md rounded-[24px] sm:rounded-[48px] p-6 sm:p-8 border border-white/10 shadow-2xl flex-1 flex flex-col min-h-0">
                 <div className="flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0">
                    <h3 className="text-base sm:text-xl font-black tracking-tight flex items-center gap-2 sm:gap-3">
                       <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" /> Live Standings
                    </h3>
                    <div className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Sync: 50ms</div>
                 </div>
                 <div className="flex-1 lg:overflow-y-auto custom-scrollbar-dark pr-1 sm:pr-2">
                    <Leaderboard houses={houses} />
                 </div>
              </div>
           </div>

           {/* Sidebar Flow */}
           <div className="flex flex-col gap-6 min-h-0 lg:col-span-4">
              <div className="bg-white/5 backdrop-blur-md rounded-[24px] sm:rounded-[48px] p-6 border border-white/10 lg:flex-1 flex flex-col min-h-0">
                 <div className="flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0">
                    <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2 sm:gap-3">
                       <History className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" /> Hall of Flux
                    </h3>
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500/50" />
                 </div>
                 <div className="lg:flex-1 px-1">
                    <ActivityFeed logs={logs} rowsPerPage={4} />
                 </div>
              </div>

              {/* Quick Stats Card */}
              <div className="bg-gradient-to-br from-pegasus/20 to-phoenix/20 rounded-[24px] sm:rounded-[40px] p-5 sm:p-6 border border-white/10 relative overflow-hidden group flex-shrink-0">
                 <div className="relative z-10">
                    <div className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1 sm:mb-2">Total Competition Flux</div>
                    <div className="text-2xl sm:text-4xl font-black text-white tabular-nums tracking-tighter">
                       {houses.reduce((acc, h) => acc + h.totalPoints, 0).toLocaleString()}
                    </div>
                    <div className="text-[9px] sm:text-[10px] font-medium text-slate-400 mt-1">Combined house contributions.</div>
                 </div>
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                    <Sparkles className="w-12 h-12 sm:w-16 sm:h-16" />
                 </div>
              </div>
           </div>

        </div>
      </main>
    </div>
  );
}
