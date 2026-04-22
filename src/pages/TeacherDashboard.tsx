import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useHouses, useLogs, addPoints } from '../hooks/useFirestore';
import { HOUSES, POINT_CATEGORIES } from '../types';
import HouseCard from '../components/HouseCard';
import Leaderboard from '../components/Leaderboard';
import ActivityFeed from '../components/ActivityFeed';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Plus, LogOut, Info, BarChart3, Shield } from 'lucide-react';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { houses } = useHouses();
  const { logs } = useLogs(20);
  
  const [selectedHouse, setSelectedHouse] = useState(HOUSES[0].id);
  const [points, setPoints] = useState(1);
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState(POINT_CATEGORIES[0].id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addPoints(
        selectedHouse, 
        points, 
        reason, 
        category, 
        user?.name || 'Teacher', 
        user?.uid || '', 
        'teacher'
      );
      setReason('');
      setPoints(1);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-bg overflow-hidden font-sans">
      <header className="h-16 bg-surface border-b border-border-theme flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <img 
            src="https://myalphabet.school/images/logo/aLphabet%20logo%20Light%20mode.png" 
            alt="aLphabet Logo" 
            className="h-10 w-auto"
          />
          <span className="font-bold text-[13px] text-text-muted opacity-40 uppercase tracking-widest ml-1 hidden sm:block">Teacher Portal</span>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-3 pr-4 border-r border-border-theme">
             <div className="text-right hidden sm:block">
                <p className="text-[12px] font-bold text-slate-dark leading-none">{user?.name}</p>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">Contributor</p>
             </div>
             <button onClick={logout} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-text-muted hover:text-slate-dark transition-colors">
                <LogOut className="w-4 h-4" />
             </button>
           </div>
           <button onClick={() => navigate('/live')} className="btn-outline px-4 py-1.5 h-auto">View Rankings</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <nav className="w-[220px] bg-surface border-r border-border-theme p-5 flex flex-col gap-1 shrink-0">
           <button 
             className="flex items-center gap-3 p-2.5 rounded-lg text-[14px] font-semibold bg-slate-50 text-slate-dark text-left"
           >
             <Sparkles className="w-4 h-4" /> Award Points
           </button>
           <button 
             className="flex items-center gap-3 p-2.5 rounded-lg text-[14px] font-medium text-text-muted hover:bg-slate-50 transition-colors text-left"
           >
             <Plus className="w-4 h-4" /> Recent Entries
           </button>
           <div className="my-2 border-t border-border-theme opacity-30"></div>
           <button 
             onClick={() => navigate('/points')} 
             className="flex items-center gap-3 p-2.5 rounded-lg text-[14px] font-medium text-text-muted hover:bg-slate-50 transition-colors text-left"
           >
             <Shield className="w-4 h-4" /> House Points Hub
           </button>
        </nav>

        <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
           <div className="grid grid-cols-4 gap-4 h-full min-h-[600px]">
             
             {/* Main Award Section */}
             <div className="col-span-3 space-y-4">
                <div className="card bg-slate-dark text-white border-none py-6 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center"><Info className="w-5 h-5" /></div>
                      <div>
                        <h3 className="font-bold">Ready to motivate?</h3>
                        <p className="text-[12px] text-white/60 font-medium">Add points to recognize student achievement.</p>
                      </div>
                   </div>
                </div>

                <div className="card">
                   <div className="panel-title text-[16px] font-bold mb-6">Point Contribution Form</div>
                   <form onSubmit={handleAddPoints} className="space-y-6">
                      <div className="grid grid-cols-4 gap-3">
                        {HOUSES.map((h) => (
                          <button
                            key={h.id}
                            type="button"
                            onClick={() => setSelectedHouse(h.id)}
                            className={`p-4 rounded-xl border-2 transition-all text-[12px] font-bold uppercase tracking-wider ${
                              selectedHouse === h.id 
                              ? 'border-slate-dark bg-slate-dark text-white' 
                              : 'border-slate-50 bg-white text-text-muted hover:border-border-theme'
                            }`}
                          >
                            {h.name}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                           <label className="text-[10px] font-bold text-text-muted uppercase">Amount</label>
                           <input 
                             type="number" 
                             value={points} 
                             onChange={(e) => setPoints(Number(e.target.value))}
                             className="bg-slate-50 border border-border-theme p-3 rounded-lg text-[16px] font-bold"
                           />
                        </div>
                        <div className="flex flex-col gap-2">
                           <label className="text-[10px] font-bold text-text-muted uppercase">Category</label>
                           <select 
                             value={category} 
                             onChange={(e) => setCategory(e.target.value as any)}
                             className="bg-slate-50 border border-border-theme p-3 rounded-lg text-[14px] font-semibold"
                           >
                              {POINT_CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                           </select>
                        </div>
                        <div className="col-span-2 flex flex-col gap-2">
                           <label className="text-[10px] font-bold text-text-muted uppercase">Justification</label>
                           <input 
                             type="text" 
                             placeholder="Why is this being awarded?" 
                             value={reason} 
                             onChange={(e) => setReason(e.target.value)}
                             className="bg-slate-50 border border-border-theme p-3 rounded-lg text-[14px]"
                           />
                        </div>
                      </div>

                      <button 
                        disabled={isSubmitting || !reason}
                        className="btn-slate w-full py-3.5 text-[14px]"
                      >
                        {isSubmitting ? 'Processing...' : 'Submit Entry'}
                      </button>
                   </form>
                </div>

                <div className="card h-[160px]">
                   <div className="panel-title text-[14px] font-bold mb-3">Live Rankings Summary</div>
                   <div className="grid grid-cols-4 gap-3">
                      {houses.map(house => (
                        <div key={house.id} className="h-full">
                           <HouseCard house={house} isCompact />
                        </div>
                      ))}
                   </div>
                </div>
             </div>

             {/* Activity Sidebar */}
             <div className="col-span-1">
                <ActivityFeed logs={logs} />
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
