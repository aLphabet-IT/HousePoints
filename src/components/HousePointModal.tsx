import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, CheckCircle2, Trophy } from 'lucide-react';
import { HOUSES, POINT_CATEGORIES } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { addPoints } from '../hooks/useFirestore';
import { cn } from '../lib/utils';

interface HousePointModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HousePointModal({ isOpen, onClose }: HousePointModalProps) {
  const { user, isOfflineMode } = useAuth();
  const [selectedHouseId, setSelectedHouseId] = useState(HOUSES[0].id);
  const [selectedReason, setSelectedReason] = useState('');
  const [points, setPoints] = useState(1);
  const [category, setCategory] = useState(POINT_CATEGORIES[0].id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHouseId || !selectedReason || isSubmitting) return;

    if (isOfflineMode) {
      setError("Cannot award points in Local Mode.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addPoints(
        selectedHouseId,
        points,
        selectedReason,
        category,
        user?.name || 'Admin',
        user?.uid || '',
        user?.role || 'admin'
      );

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setSelectedReason('');
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
            <div className="px-8 pt-8 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-[24px] font-black text-slate-900 tracking-tight">Direct House Points</h2>
                  <p className="text-[14px] font-medium text-slate-400">Award points directly to an entire house.</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6">
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
                    <div className="space-y-3">
                      <label className="text-[14px] font-bold text-slate-900 ml-1">Select House</label>
                      <div className="grid grid-cols-2 gap-3">
                        {HOUSES.map(h => (
                          <button
                            key={h.id}
                            type="button"
                            onClick={() => setSelectedHouseId(h.id)}
                            className={cn(
                              "px-4 py-3 rounded-2xl border-2 text-[13px] font-black uppercase tracking-wider transition-all",
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

                    {/* Points & Category Group */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[14px] font-bold text-slate-900 ml-1">Points</label>
                        <input 
                          type="number"
                          value={points}
                          onChange={(e) => setPoints(Number(e.target.value))}
                          className="w-full h-[52px] bg-slate-50 border border-slate-200 rounded-2xl px-5 text-[16px] font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-none focus:bg-white transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[14px] font-bold text-slate-900 ml-1">Category</label>
                        <select 
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full h-[52px] bg-slate-50 border border-slate-200 rounded-2xl px-4 text-[14px] font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-none focus:bg-white transition-all appearance-none"
                        >
                          {POINT_CATEGORIES.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                      <label className="text-[14px] font-bold text-slate-900 ml-1">Reason for Adjustment</label>
                      <input 
                        type="text"
                        placeholder="e.g. Annual Sports Meet Winner"
                        value={selectedReason}
                        onChange={(e) => setSelectedReason(e.target.value)}
                        required
                        className="w-full h-[52px] bg-slate-50 border border-slate-200 rounded-2xl px-5 text-[14px] font-medium text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-none focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[13px] font-medium">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-4 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 h-[56px] border border-slate-200 rounded-full text-[16px] font-black text-slate-900 hover:bg-slate-50 transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedHouseId || !selectedReason || isSubmitting}
                      className="flex-[1.5] h-[56px] bg-slate-900 rounded-full text-[16px] font-black text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 active:scale-95"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Award House Points'}
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
