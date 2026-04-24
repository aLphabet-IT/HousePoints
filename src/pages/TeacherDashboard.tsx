import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useHouses, useLogs, addPoints, usePointReasons } from '../hooks/useFirestore';
import { HOUSES, PointReason } from '../types';
import HouseCard from '../components/HouseCard';
import Leaderboard from '../components/Leaderboard';
import ActivityFeed from '../components/ActivityFeed';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Plus, LogOut, Info, BarChart3, Shield, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { houses } = useHouses();
  const { logs } = useLogs(20);
  const { reasons } = usePointReasons();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  
  const [selectedHouse, setSelectedHouse] = useState(HOUSES[0].id);
  const [selectedReasonId, setSelectedReasonId] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [points, setPoints] = useState(1);
  const [category, setCategory] = useState('other');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReasonChange = (id: string) => {
    setSelectedReasonId(id);
    const reason = reasons.find(r => r.id === id);
    if (reason) {
      setPoints(reason.points);
      setCategory(reason.category);
      setCustomReason(reason.label);
    } else if (id === 'custom') {
      setPoints(1);
      setCategory('other');
      setCustomReason('');
    }
  };

  const handleAddPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!selectedReasonId && !customReason) || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addPoints(
        selectedHouse, 
        points, 
        customReason || "Awarded points", 
        category, 
        user?.name || 'Teacher', 
        user?.uid || '', 
        'teacher'
      );
      setSelectedReasonId('');
      setCustomReason('');
      setPoints(1);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

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
           <div className="flex items-center gap-3 pr-2 sm:pr-4 sm:border-r border-border-theme">
             <div className="text-right hidden sm:block">
                <p className="text-[12px] font-bold text-slate-dark leading-none">{user?.name}</p>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">Contributor</p>
             </div>
             <button onClick={logout} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-text-muted hover:text-slate-dark transition-colors">
                <LogOut className="w-4 h-4" />
             </button>
           </div>
           <button onClick={() => navigate('/live')} className="btn-outline px-3 sm:px-4 py-1.5 h-8 sm:h-auto text-[11px] sm:text-[13px]">Rankings</button>
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
                "fixed inset-y-0 left-0 w-[280px] bg-white border-r border-slate-100 p-6 flex flex-col gap-1 z-50 shadow-2xl overflow-hidden"
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
               <button 
                 className="flex items-center gap-3 p-3 rounded-xl text-[14px] font-bold bg-[#eff6ff] text-slate-900 text-left"
               >
                 <Sparkles className="w-4 h-4" /> Award Points
               </button>
               <button 
                 className="flex items-center gap-3 p-3 rounded-xl text-[14px] font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors text-left"
               >
                 <Plus className="w-4 h-4" /> Recent Entries
               </button>
               <div className="my-4 border-t border-slate-100"></div>
               <button 
                 onClick={() => navigate('/points')} 
                 className="flex items-center gap-3 p-3 rounded-xl text-[14px] font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors text-left"
               >
                 <Shield className="w-4 h-4" /> House Points Hub
               </button>
            </motion.nav>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar (Always Visible) */}
        <nav className="hidden lg:flex flex-col w-[240px] bg-white border-r border-slate-100 p-5 gap-1 shrink-0">
           <button 
             className="flex items-center gap-3 p-2.5 rounded-lg text-[14px] font-bold bg-[#eff6ff] text-slate-900 text-left"
           >
             <Sparkles className="w-4 h-4" /> Award Points
           </button>
           <button 
             className="flex items-center gap-3 p-2.5 rounded-lg text-[14px] font-medium text-slate-400 hover:bg-slate-50 transition-colors text-left"
           >
             <Plus className="w-4 h-4" /> Recent Entries
           </button>
           <div className="my-2 border-t border-slate-100 opacity-50"></div>
           <button 
             onClick={() => navigate('/points')} 
             className="flex items-center gap-3 p-2.5 rounded-lg text-[14px] font-medium text-slate-400 hover:bg-slate-50 transition-colors text-left"
           >
             <Shield className="w-4 h-4" /> House Points Hub
           </button>
        </nav>
         <div className="flex-1 p-4 sm:p-5 lg:overflow-y-auto custom-scrollbar">
           <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4 lg:gap-6 min-h-full">
             
             {/* Main Award Section */}
             <div className="lg:col-span-3 space-y-4">
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
                   <div className="panel-title text-[15px] sm:text-[16px] font-bold mb-4 sm:mb-6">Point Contribution Form</div>
                    <form onSubmit={handleAddPoints} className="space-y-5 sm:space-y-6">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                        {HOUSES.map((h) => (
                          <button
                            key={h.id}
                            type="button"
                            onClick={() => setSelectedHouse(h.id)}
                            className={`p-3 sm:p-4 rounded-xl border-2 transition-all text-[11px] sm:text-[12px] font-bold uppercase tracking-wider ${
                              selectedHouse === h.id 
                              ? 'border-slate-dark bg-slate-dark text-white' 
                              : 'border-slate-50 bg-white text-text-muted hover:border-border-theme'
                            }`}
                          >
                            {h.name}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                           <label className="text-[10px] font-bold text-text-muted uppercase">Reason Selection</label>
                           <select 
                             value={selectedReasonId}
                             onChange={(e) => handleReasonChange(e.target.value)}
                             className="bg-slate-50 border border-border-theme p-3 rounded-lg text-sm sm:text-[14px] font-semibold"
                           >
                             <option value="">Select a pre-configured reason</option>
                             {reasons.map(r => (
                               <option key={r.id} value={r.id}>{r.label} ({r.points > 0 ? `+${r.points}` : r.points})</option>
                             ))}
                             <option value="custom">-- Custom Reason --</option>
                           </select>
                        </div>
                        <div className="flex flex-col gap-2">
                           <label className="text-[10px] font-bold text-text-muted uppercase">Points</label>
                           <input 
                             type="number" 
                             value={points} 
                             onChange={(e) => setPoints(Number(e.target.value))}
                             className="bg-slate-50 border border-border-theme p-3 rounded-lg text-sm sm:text-[16px] font-bold"
                           />
                        </div>

                        {(selectedReasonId === 'custom' || selectedReasonId === '') && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="sm:col-span-2 space-y-4"
                          >
                            <div className="flex flex-col gap-2">
                               <label className="text-[10px] font-bold text-text-muted uppercase">Reason for Points</label>
                               <input 
                                 type="text" 
                                 placeholder="Why is this being awarded?" 
                                 value={customReason} 
                                 onChange={(e) => setCustomReason(e.target.value)}
                                 className="bg-slate-50 border border-border-theme p-3 rounded-lg text-sm sm:text-[14px]"
                               />
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {['academic', 'sport', 'behavior', 'participation', 'other'].map(cat => (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => setCategory(cat)}
                                  className={cn(
                                    "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border-2 transition-all",
                                    category === cat ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-100 text-slate-400"
                                  )}
                                >
                                  {cat}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </div>

                      <button 
                        disabled={isSubmitting || (!selectedReasonId && !customReason)}
                        className="btn-slate w-full py-3 sm:py-3.5 text-[14px]"
                      >
                        {isSubmitting ? 'Processing...' : 'Submit Entry'}
                      </button>
                   </form>
                </div>

                <div className="card h-auto sm:h-[160px]">
                   <div className="panel-title text-[13px] sm:text-[14px] font-bold mb-3">Live Rankings Summary</div>
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {houses.map(house => (
                        <div key={house.id} className="h-full">
                           <HouseCard house={house} isCompact />
                        </div>
                      ))}
                   </div>
                </div>
             </div>

             {/* Activity Sidebar */}
             <div className="lg:col-span-1">
                <ActivityFeed logs={logs} />
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
