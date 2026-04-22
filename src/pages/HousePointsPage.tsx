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
    <div className="min-h-screen bg-[#020617] text-white selection:bg-pegasus selection:text-white font-sans overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-phoenix/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pegasus/20 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-centaur/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
      </div>

      {/* Glass Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-black/20 border-b border-white/5 px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all active:scale-90"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div className="flex items-center gap-3">
             <img 
               src="https://myalphabet.school/images/logo/aLphabet%20logo%20Light%20mode.png" 
               alt="aLphabet Logo" 
               className="h-10 w-auto brightness-0 invert"
             />
             <h1 className="text-xl font-black tracking-tighter">House Point Hub</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Live Broadcast Engine</span>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Animated Hero Section */}
        <div className="mb-20 text-center">
           <motion.div
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             className="inline-block"
           >
             <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 inline-block">Global Championship</span>
             <h2 className="text-7xl font-black tracking-tighter mb-4 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
                Battle of the Houses
             </h2>
             <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium leading-relaxed">
                The ultimate real-time battle for supremacy. Every point counts, every contribution shapes the legacy of your house.
             </p>
           </motion.div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-12 gap-8">
           
           {/* Top 3 Podium (Animated) */}
           <div className="col-span-12 lg:col-span-8 space-y-8">
              <div className="grid grid-cols-3 gap-6 items-end py-12">
                  {/* 2nd Place */}
                  {sortedHouses[1] && (
                    <motion.div 
                       initial={{ scale: 0.9, opacity: 0 }}
                       animate={{ scale: 1, opacity: 1 }}
                       transition={{ delay: 0.2 }}
                       className="flex flex-col items-center gap-4 flex-1"
                    >
                       <div className="w-full h-48 bg-white/5 backdrop-blur-sm border border-white/10 rounded-t-[40px] flex flex-col items-center justify-end pb-8 relative group overflow-hidden">
                          <div className="text-[120px] font-black absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5">2</div>
                          <div className="text-3xl font-black tabular-nums">{sortedHouses[1].totalPoints.toLocaleString()}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Points</div>
                          <div className={cn("absolute bottom-0 w-full h-1", HOUSES.find(h => h.id === sortedHouses[1].id)?.color)} />
                       </div>
                       <div className="text-center">
                          <div className="text-sm font-black text-slate-400 uppercase tracking-widest">{sortedHouses[1].name}</div>
                       </div>
                    </motion.div>
                  )}

                  {/* 1st Place */}
                  {sortedHouses[0] && (
                    <motion.div 
                       initial={{ scale: 0.9, opacity: 0, y: -20 }}
                       animate={{ scale: 1, opacity: 1, y: 0 }}
                       className="flex flex-col items-center gap-4 flex-1"
                    >
                       <Trophy className="w-12 h-12 text-amber-400 mb-4 filter drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]" />
                       <div className="w-full h-64 bg-white border border-white rounded-t-[40px] flex flex-col items-center justify-end pb-8 relative shadow-[0_0_80px_rgba(255,255,255,0.1)]">
                          <div className="text-[160px] font-black absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-900 opacity-5">1</div>
                          <div className="text-5xl font-black tabular-nums text-slate-950">{sortedHouses[0].totalPoints.toLocaleString()}</div>
                          <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">Leading Points</div>
                       </div>
                       <div className="text-center">
                          <div className="text-xl font-black text-white tracking-tight">{sortedHouses[0].name}</div>
                       </div>
                    </motion.div>
                  )}

                  {/* 3rd Place */}
                  {sortedHouses[2] && (
                    <motion.div 
                       initial={{ scale: 0.9, opacity: 0 }}
                       animate={{ scale: 1, opacity: 1 }}
                       transition={{ delay: 0.4 }}
                       className="flex flex-col items-center gap-4 flex-1"
                    >
                       <div className="w-full h-32 bg-white/5 backdrop-blur-sm border border-white/10 rounded-t-[40px] flex flex-col items-center justify-end pb-8 relative overflow-hidden">
                          <div className="text-[100px] font-black absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5">3</div>
                          <div className="text-2xl font-black tabular-nums">{sortedHouses[2].totalPoints.toLocaleString()}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Points</div>
                          <div className={cn("absolute bottom-0 w-full h-1", HOUSES.find(h => h.id === sortedHouses[2].id)?.color)} />
                       </div>
                       <div className="text-center">
                          <div className="text-sm font-black text-slate-400 uppercase tracking-widest">{sortedHouses[2].name}</div>
                       </div>
                    </motion.div>
                  )}
              </div>

              {/* Detailed Leaderboard Wrapper */}
              <div className="bg-white/5 backdrop-blur-md rounded-[48px] p-10 border border-white/10 shadow-2xl">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
                       <TrendingUp className="w-6 h-6 text-slate-400" /> Live Standings
                    </h3>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Broadcast Refresh Rate: 50ms</div>
                 </div>
                 <Leaderboard houses={houses} />
              </div>
           </div>

           {/* Sidebar Flow */}
           <div className="col-span-12 lg:col-span-4 space-y-8">
              <div className="bg-white/5 backdrop-blur-md rounded-[48px] p-8 border border-white/10 min-h-[600px] flex flex-col">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
                       <History className="w-5 h-5 text-slate-400" /> Hall of Flux
                    </h3>
                    <Sparkles className="w-5 h-5 text-amber-500/50" />
                 </div>
                 <div className="flex-1 overflow-y-auto custom-scrollbar-dark pr-2">
                    <ActivityFeed logs={logs} />
                 </div>
              </div>

              {/* Quick Stats Card */}
              <div className="bg-gradient-to-br from-pegasus/20 to-phoenix/20 rounded-[40px] p-10 border border-white/10 relative overflow-hidden group hover:scale-[1.02] transition-transform">
                 <div className="relative z-10">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Total Competition Flux</div>
                    <div className="text-5xl font-black text-white tabular-nums tracking-tighter">
                       {houses.reduce((acc, h) => acc + h.totalPoints, 0).toLocaleString()}
                    </div>
                    <div className="text-sm font-medium text-slate-400 mt-2">Combined house contributions this term.</div>
                 </div>
                 <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
                    <Sparkles className="w-24 h-24" />
                 </div>
              </div>
           </div>

        </div>
      </main>

      {/* Floating UI Elements */}
      <div className="fixed bottom-12 right-12 z-50">
         <motion.div 
           animate={{ y: [0, -10, 0] }}
           transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
           className="bg-white text-slate-900 font-black text-[12px] px-6 py-4 rounded-full shadow-[0_20px_40px_rgba(255,255,255,0.2)] flex items-center gap-3 cursor-pointer"
           onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
         >
            <div className="w-2 h-2 rounded-full bg-slate-900 animate-pulse" />
            VIGILANT ON SYSTEM STANDINGS
         </motion.div>
      </div>
    </div>
  );
}
