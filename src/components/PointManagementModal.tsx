import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, CheckCircle2, Search } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, HOUSES, PointReason } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

interface PointManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PointManagementModal({ isOpen, onClose }: PointManagementModalProps) {
  const { user } = useAuth();
  const [students, setStudents] = useState<User[]>([]);
  const [reasons, setReasons] = useState<PointReason[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedReasonId, setSelectedReasonId] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [points, setPoints] = useState(1);
  const [category, setCategory] = useState('other');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const fetchStudents = async () => {
        try {
          const q = query(collection(db, 'users'), where('role', '==', 'student'));
          const snapshot = await getDocs(q);
          setStudents(snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as User)));
        } catch (err) {
          console.error("Failed to fetch students:", err);
        }
      };
      fetchStudents();

      // Fetch point reasons
      const reasonsQuery = query(collection(db, 'pointReasons'), orderBy('label', 'asc'));
      const unsubscribeReasons = onSnapshot(reasonsQuery, (snapshot) => {
        setReasons(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as PointReason)));
      });

      return () => unsubscribeReasons();
    }
  }, [isOpen]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.houseId?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

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
    if (!selectedStudentId || (!selectedReasonId && !customReason) || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const selectedStudent = students.find(s => s.uid === selectedStudentId);
      if (!selectedStudent || !selectedStudent.houseId) throw new Error("Student data incomplete.");

      const { awardPointsToStudent } = await import('../hooks/useFirestore');
      
      await awardPointsToStudent(
        selectedStudentId,
        selectedStudent.name,
        selectedStudent.houseId,
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
        setSearchQuery('');
        setSelectedStudentId('');
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
              <div>
                <h2 className="text-[18px] sm:text-[24px] font-black text-slate-900 tracking-tight">Manage Student Points</h2>
                <p className="text-[11px] sm:text-[14px] font-medium text-slate-400 mt-1">Select a student and a reason to award or deduct points.</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-8 pt-3 sm:pt-4 space-y-5 sm:space-y-8">
              {success ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Points Submitted!</h3>
                  <p className="text-slate-400">The leaderboard has been updated.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-6">
                    {/* Student Selection */}
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[14px] sm:text-[16px] font-bold text-slate-900">Student</label>
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          {filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'} found
                        </span>
                      </div>
                      
                      <div className="space-y-2 sm:space-y-3">
                        {/* Search Input */}
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search student..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-[44px] sm:h-[48px] bg-slate-50 border border-slate-200 rounded-full px-10 text-[13px] sm:text-[14px] font-medium text-slate-600 focus:ring-2 focus:ring-slate-900 focus:outline-none focus:bg-white transition-all"
                          />
                          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          {searchQuery && (
                            <button
                              type="button"
                              onClick={() => setSearchQuery('')}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* Select Dropdown */}
                        <div className="relative">
                          <select
                            value={selectedStudentId}
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            className="w-full h-[48px] sm:h-[56px] bg-white border border-slate-200 rounded-full px-6 text-[14px] sm:text-[16px] font-medium text-slate-600 appearance-none focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all"
                          >
                            <option value="">Select a student</option>
                            {filteredStudents.map(s => (
                              <option key={s.uid} value={s.uid}>{s.name} ({s.houseId})</option>
                            ))}
                          </select>
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reason Selection */}
                    <div className="space-y-4">
                      <label className="text-[16px] font-bold text-slate-900">Reason / Configuration</label>
                      <div className="space-y-3">
                        <div className="relative">
                          <select
                            value={selectedReasonId}
                            onChange={(e) => handleReasonChange(e.target.value)}
                            className="w-full h-[48px] sm:h-[56px] bg-white border border-slate-200 rounded-full px-6 text-[14px] sm:text-[16px] font-medium text-slate-600 appearance-none focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all"
                          >
                            <option value="">Select a pre-configured reason</option>
                            {reasons.map(r => (
                              <option key={r.id} value={r.id}>{r.label} ({r.points > 0 ? `+${r.points}` : r.points})</option>
                            ))}
                            <option value="custom">-- Custom Reason --</option>
                          </select>
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
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
                              className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-full px-6 text-[14px] font-medium text-slate-600 focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all"
                            />
                            <div className="flex gap-2">
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
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[16px] font-bold text-slate-900">Points</label>
                        {selectedReasonId && selectedReasonId !== 'custom' && (
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Default value for this reason</span>
                        )}
                      </div>
                      <input 
                        type="number"
                        value={points}
                        onChange={(e) => setPoints(Number(e.target.value))}
                        className="w-full h-[56px] bg-white border border-slate-200 rounded-full px-6 text-[16px] font-medium text-slate-600 focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[13px] font-medium">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 sm:gap-4 pt-2 sm:pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 h-[48px] sm:h-[56px] border border-slate-200 rounded-full text-[14px] sm:text-[16px] font-black text-slate-900 hover:bg-slate-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedStudentId || (!selectedReasonId && !customReason) || isSubmitting}
                      className="flex-[1.5] h-[48px] sm:h-[56px] bg-[#5a7395] rounded-full text-[14px] sm:text-[16px] font-black text-white hover:bg-[#4a6385] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Points'}
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
