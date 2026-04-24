import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, CheckCircle2, Trophy } from 'lucide-react';
import { HOUSES, PointReason } from '../types';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { addPoints } from '../hooks/useFirestore';
import { cn } from '../lib/utils';

interface HousePointModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HousePointModal({ isOpen, onClose }: HousePointModalProps) {
  const { user } = useAuth();
  const [selectedHouseId, setSelectedHouseId] = useState(HOUSES[0].id);
  const [reasons, setReasons] = useState<PointReason[]>([]);
  const [selectedReasonId, setSelectedReasonId] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [points, setPoints] = useState(1);
  const [category, setCategory] = useState('other');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const reasonsQuery = query(collection(db, 'pointReasons'), orderBy('label', 'asc'));
      const unsubscribe = onSnapshot(reasonsQuery, (snapshot) => {
        setReasons(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as PointReason)));
      });
      return () => unsubscribe();
    }
  }, [isOpen]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHouseId || (!selectedReasonId && !customReason) || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await addPoints(
        selectedHouseId,
        points,
        customReason || "Awarded points",
        category,
        user?.name || 'Admin',
        user?.uid || '',
        user?.role || 'admin'
      );

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setSelectedReasonId('');
        setCustomReason('');
        setPoints(1);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to submit points.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-[480px] bg-white rounded-[32px] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 sm:px-8 pt-5 sm:pt-8 pb-3 sm:pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-amber-500">
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h2 className="text-[18px] sm:text-[24px] font-black text-slate-900 tracking-tight">Direct House Points</h2>
                  <p className="text-[11px] sm:text-[14px] font-medium text-slate-400">Award points directly to an entire house.</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-8 pt-3 sm:pt-4 space-y-4 sm:space-y-6">
              {success ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">House Points Updated!</h3>
                  <p className="text-slate-400">The leaderboard reflects the change immediately.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-5">
                    {/* House Selection */}
                    <div className="space-y-2 sm:space-y-3">
                      <label className="text-[12px] sm:text-[14px] font-bold text-slate-900 ml-1">Select House</label>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        {HOUSES.map(h => (
                          <button
                            key={h.id}
                            type="button"
                            onClick={() => setSelectedHouseId(h.id)}
                            className={cn(
                              "px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl border-2 text-[11px] sm:text-[13px] font-black uppercase tracking-wider transition-all",
                              selectedHouseId === h.id 
                                ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200" 
                                : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
                            )}
                          >
                            {h.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Reason Selection */}
                    <div className="space-y-4">
                      <label className="text-[14px] font-bold text-slate-900 ml-1">Reason / Configuration</label>
                      <div className="space-y-3">
                        <div className="relative">
                          <select
                            value={selectedReasonId}
                            onChange={(e) => handleReasonChange(e.target.value)}
                            className="w-full h-[52px] bg-slate-50 border border-slate-200 rounded-2xl px-5 text-[14px] font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-none focus:bg-white transition-all appearance-none"
                          >
                            <option value="">Select a pre-configured reason</option>
                            {reasons.map(r => (
                              <option key={r.id} value={r.id}>{r.label} ({r.points > 0 ? `+${r.points}` : r.points})</option>
                            ))}
                            <option value="custom">-- Custom Reason --</option>
                          </select>
                          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                             <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                               <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                             </svg>
                          </div>
                        </div>

                        {selectedReasonId === 'custom' && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="space-y-3"
                          >
                            <input 
                              type="text"
                              placeholder="Enter custom reason..."
                              value={customReason}
                              onChange={(e) => setCustomReason(e.target.value)}
                              className="w-full h-[52px] bg-slate-50 border border-slate-200 rounded-2xl px-5 text-[14px] font-medium text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-none focus:bg-white transition-all"
                            />
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
                    </div>

                    {/* Points Input */}
                    <div className="space-y-2">
                       <div className="flex items-center justify-between ml-1">
                         <label className="text-[14px] font-bold text-slate-900">Points</label>
                         {selectedReasonId && selectedReasonId !== 'custom' && (
                           <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Default value</span>
                         )}
                       </div>
                       <input 
                         type="number"
                         value={points}
                         onChange={(e) => setPoints(Number(e.target.value))}
                         className="w-full h-[52px] bg-slate-50 border border-slate-200 rounded-2xl px-5 text-[16px] font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-none focus:bg-white transition-all"
                       />
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[13px] font-medium">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 sm:gap-4 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 h-[48px] sm:h-[56px] border border-slate-200 rounded-full text-[14px] sm:text-[16px] font-black text-slate-900 hover:bg-slate-50 transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedHouseId || (!selectedReasonId && !customReason) || isSubmitting}
                      className="flex-[1.5] h-[48px] sm:h-[56px] bg-slate-900 rounded-full text-[14px] sm:text-[16px] font-black text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 active:scale-95"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Award Points'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
