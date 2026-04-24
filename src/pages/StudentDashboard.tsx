import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useHouses, useLogs } from '../hooks/useFirestore';
import { HOUSES } from '../types';
import Leaderboard from '../components/Leaderboard';
import ActivityFeed from '../components/ActivityFeed';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, LogOut, Trophy, Quote, TrendingUp, Shield, History, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { houses } = useHouses();
  const { logs } = useLogs(20);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  
  const userHouse = houses.find(h => h.id === user?.houseId);

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-bg lg:overflow-hidden font-sans">
      <header className="h-16 bg-surface border-b border-border-theme flex items-center justify-between px-4 sm:px-6 shrink-0 z-30 sticky top-0 lg:relative">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 -ml-2 text-text-muted transition-colors hover:bg-slate-50 rounded-lg"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <img 
            src="https://myalphabet.school/images/logo/aLphabet%20logo%20Light%20mode.png" 
            alt="aLphabet Logo" 
            className="h-8 sm:h-10 w-auto"
          />
          <span className="font-bold text-[11px] sm:text-[13px] text-text-muted opacity-40 uppercase tracking-widest ml-1 hidden xs:block">Portal</span>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
                <p className="text-[12px] font-bold text-slate-dark leading-none">{user?.name}</p>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">{userHouse?.name || 'Unassigned'} House</p>
             </div>
             <button onClick={logout} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-text-muted hover:text-slate-dark transition-colors">
                <LogOut className="w-4 h-4" />
             </button>
           </div>
        </div>
      </header>

      <div className="flex flex-1 lg:overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {isMenuOpen && (
            <motion.nav 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                "fixed inset-y-0 left-0 w-[240px] bg-white border-r border-slate-100 p-6 flex flex-col gap-1 z-50 shadow-2xl overflow-hidden"
              )}
            >
               <div className="flex items-center justify-between mb-8">
                 <img 
                    src="https://myalphabet.school/images/logo/aLphabet%20logo%20Light%20mode.png" 
                    alt="aLphabet Logo" 
                    className="h-8"
                  />
                  <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-slate-50 rounded-lg">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
               </div>
               <button className="flex items-center gap-3 p-3 rounded-xl text-[14px] font-bold bg-[#eff6ff] text-slate-900 text-left">
                 <UserIcon className="w-4 h-4" /> My Progress
               </button>
               <button 
                  onClick={() => navigate('/points')} 
                  className="flex items-center gap-3 p-3 rounded-xl text-[14px] font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors text-left"
                >
                  <Shield className="w-4 h-4" /> House Points Hub
                </button>
               <button className="flex items-center gap-3 p-3 rounded-xl text-[14px] font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors text-left">
                 <Trophy className="w-4 h-4" /> Leaderboard
               </button>
               <button className="flex items-center gap-3 p-3 rounded-xl text-[14px] font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors text-left">
                 <History className="w-4 h-4" /> My History
               </button>
            </motion.nav>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar (Always Visible) */}
        <nav className="hidden lg:flex flex-col w-[200px] bg-white border-r border-slate-100 p-5 gap-1 shrink-0">
           <button className="flex items-center gap-3 p-2.5 rounded-lg text-[14px] font-bold bg-[#eff6ff] text-slate-900 text-left">
             <UserIcon className="w-4 h-4" /> My Progress
           </button>
           <button 
              onClick={() => navigate('/points')} 
              className="flex items-center gap-3 p-2.5 rounded-lg text-[14px] font-medium text-slate-400 hover:bg-slate-50 transition-colors text-left"
            >
              <Shield className="w-4 h-4" /> House Points Hub
            </button>
           <button className="flex items-center gap-3 p-2.5 rounded-lg text-[14px] font-medium text-slate-400 hover:bg-slate-50 transition-colors text-left">
             <Trophy className="w-4 h-4" /> Leaderboard
           </button>
           <button className="flex items-center gap-3 p-2.5 rounded-lg text-[14px] font-medium text-slate-400 hover:bg-slate-50 transition-colors text-left">
             <History className="w-4 h-4" /> My History
           </button>
        </nav>
         <div className="flex-1 p-4 sm:p-5 lg:overflow-y-auto custom-scrollbar">
           <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4 lg:gap-6 min-h-full">
             
             {/* Personal Highlights */}
             <div className="lg:col-span-3 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="card bg-slate-dark text-white border-none py-6 sm:py-8 flex flex-col justify-between">
                      <div className="text-[11px] sm:text-[12px] font-bold text-white/50 uppercase tracking-widest">My House Rank</div>
                      <div className="mt-3 sm:mt-4">
                         <div className="text-[36px] sm:text-[48px] font-black leading-none">#{userHouse?.rank || '?'}</div>
                         <div className="text-[12px] sm:text-[14px] font-medium text-white/70 mt-2">{userHouse?.name} is currently competing</div>
                      </div>
                   </div>
                   <div className="card py-6 sm:py-8 flex flex-col justify-between">
                      <div className="text-[11px] sm:text-[12px] font-bold text-text-muted uppercase tracking-widest">Total House Points</div>
                      <div className="mt-3 sm:mt-4">
                         <div className="text-[36px] sm:text-[48px] font-black leading-none">{userHouse?.totalPoints.toLocaleString() || '0'}</div>
                         <div className="flex items-center gap-2 text-centaur text-[11px] sm:text-[12px] font-bold mt-2">
                            <TrendingUp className="w-3 h-3 text-centaur" /> Live updating
                         </div>
                      </div>
                   </div>
                </div>

                <div className="card h-auto lg:h-[calc(100vh-320px)] min-h-[400px]">
                   <Leaderboard houses={houses} />
                </div>
             </div>

             {/* Activity Sidebar */}
             <div className="lg:col-span-1">
                <ActivityFeed logs={logs.filter(l => l.houseId === user?.houseId)} />
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
