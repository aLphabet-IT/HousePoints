import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useHouses, useLogs } from '../hooks/useFirestore';
import { HOUSES } from '../types';
import Leaderboard from '../components/Leaderboard';
import ActivityFeed from '../components/ActivityFeed';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, LogOut, Trophy, Quote, TrendingUp, Shield, History } from 'lucide-react';
import { cn } from '../lib/utils';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { houses } = useHouses();
  const { logs } = useLogs(20);
  
  const userHouse = houses.find(h => h.id === user?.houseId);

  return (
    <div className="h-screen flex flex-col bg-bg overflow-hidden font-sans">
      <header className="h-16 bg-surface border-b border-border-theme flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="logo-icon w-8 h-8 bg-slate-grey rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm">
            MH
          </div>
          <div className="logo text-[20px] font-black tracking-tight text-slate-dark flex items-center gap-2">
            MyHouse
            <span className="font-medium text-[14px] text-text-muted opacity-60">Student Portal</span>
          </div>
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

      <div className="flex flex-1 overflow-hidden">
        <nav className="w-[220px] bg-surface border-r border-border-theme p-5 flex flex-col gap-1 shrink-0">
           <button className="flex items-center gap-3 p-2.5 rounded-lg text-[14px] font-semibold bg-slate-50 text-slate-dark text-left">
             <UserIcon className="w-4 h-4" /> My Progress
           </button>
           <button 
              onClick={() => navigate('/points')} 
              className="flex items-center gap-3 p-2.5 rounded-lg text-[14px] font-medium text-text-muted hover:bg-slate-50 transition-colors text-left"
            >
              <Shield className="w-4 h-4" /> House Points Hub
            </button>
           <button className="flex items-center gap-3 p-2.5 rounded-lg text-[14px] font-medium text-text-muted hover:bg-slate-50 transition-colors text-left">
             <Trophy className="w-4 h-4" /> Leaderboard
           </button>
           <button className="flex items-center gap-3 p-2.5 rounded-lg text-[14px] font-medium text-text-muted hover:bg-slate-50 transition-colors text-left">
             <History className="w-4 h-4" /> My History
           </button>
        </nav>

        <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
           <div className="grid grid-cols-4 gap-4 h-full min-h-[600px]">
             
             {/* Personal Highlights */}
             <div className="col-span-3 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className="card bg-slate-dark text-white border-none py-8 flex flex-col justify-between">
                      <div className="text-[12px] font-bold text-white/50 uppercase tracking-widest">My House Rank</div>
                      <div className="mt-4">
                         <div className="text-[48px] font-black leading-none">#{userHouse?.rank || '?'}</div>
                         <div className="text-[14px] font-medium text-white/70 mt-2">{userHouse?.name} is currently competing</div>
                      </div>
                   </div>
                   <div className="card py-8 flex flex-col justify-between">
                      <div className="text-[12px] font-bold text-text-muted uppercase tracking-widest">Total House Points</div>
                      <div className="mt-4">
                         <div className="text-[48px] font-black leading-none">{userHouse?.totalPoints.toLocaleString() || '0'}</div>
                         <div className="flex items-center gap-2 text-centaur text-[12px] font-bold mt-2">
                            <TrendingUp className="w-3 h-3 text-centaur" /> Live updating
                         </div>
                      </div>
                   </div>
                </div>

                <div className="card h-full">
                   <Leaderboard houses={houses} />
                </div>
             </div>

             {/* Activity Sidebar */}
             <div className="col-span-1">
                <ActivityFeed logs={logs.filter(l => l.houseId === user?.houseId)} />
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
