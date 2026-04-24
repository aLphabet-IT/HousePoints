import React, { useState } from 'react';
import { useHouses, useStudents, awardPointsToStudent } from '../hooks/useFirestore';
import { HOUSES, POINT_CATEGORIES, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Users, 
  Star, 
  TrendingUp, 
  Plus, 
  ArrowLeft, 
  Search,
  Check,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { houses } = useHouses();
  const { students } = useStudents(10);
  
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [points, setPoints] = useState(5);
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState(POINT_CATEGORIES[0].id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived stats
  const totalPoints = houses.reduce((acc, h) => acc + h.totalPoints, 0);
  const topHouse = [...houses].sort((a, b) => b.totalPoints - a.totalPoints)[0];
  const topStudent = students[0];
  const avgPoints = (totalPoints / (students.length || 1)).toFixed(1);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Simple search in Firestore
    const q = query(
      collection(db, 'users'), 
      where('role', '==', 'student'),
      where('name', '>=', searchQuery),
      where('name', '<=', searchQuery + '\uf8ff')
    );
    const snap = await getDocs(q);
    setSearchResults(snap.docs.map(d => ({ ...d.data(), uid: d.id } as User)));
  };

  const handleAward = async () => {
    if (!selectedStudent || !reason || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await awardPointsToStudent(
        selectedStudent.uid,
        selectedStudent.name,
        selectedStudent.houseId || 'unassigned',
        points,
        reason,
        category,
        user?.name || 'Admin',
        user?.uid || '',
        user?.role || 'admin'
      );
      setShowAwardModal(false);
      setSelectedStudent(null);
      setReason('');
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="px-4 sm:px-8 py-8 sm:py-10 flex flex-col lg:flex-row lg:items-center justify-between max-w-7xl mx-auto gap-6">
        <div>
          <h1 className="text-[28px] sm:text-[40px] font-black tracking-tight leading-tight">House Points & Engagement</h1>
          <p className="text-slate-500 font-medium mt-1 sm:mt-2 text-base sm:text-lg">Leaderboards and analytics for house competitions.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-50 hover:bg-slate-100 rounded-full font-bold text-sm transition-colors border border-slate-200">
            <TrendingUp className="w-4 h-4" /> Direct Adjustment
          </button>
          <button 
            onClick={() => setShowAwardModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold text-sm transition-colors shadow-lg shadow-slate-200"
          >
            <Plus className="w-4 h-4" /> Award Student Points
          </button>
        </div>
      </header>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 px-4 sm:px-8 max-w-7xl mx-auto mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-slate-100 rounded-[24px] p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
             <span className="text-[14px] font-bold text-slate-900 uppercase tracking-tight">Total Points Awarded</span>
             <Star className="w-5 h-5 text-slate-400" />
          </div>
          <div className="text-[32px] font-black tracking-tight">{totalPoints.toLocaleString()}</div>
          <div className="text-[14px] font-medium text-slate-400 mt-1">Across all houses</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="border border-slate-100 rounded-[24px] p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
             <span className="text-[14px] font-bold text-slate-900 uppercase tracking-tight">Top House</span>
             <Trophy className="w-5 h-5 text-slate-400" />
          </div>
          <div className="text-[32px] font-black tracking-tight">{topHouse?.name || '---'}</div>
          <div className="text-[14px] font-medium text-slate-400 mt-1">{topHouse?.totalPoints?.toLocaleString() || 0} points</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="border border-slate-100 rounded-[24px] p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
             <span className="text-[14px] font-bold text-slate-900 uppercase tracking-tight">Top Student</span>
             <Users className="w-5 h-5 text-slate-400" />
          </div>
          <div className="text-[32px] font-black tracking-tight truncate">{topStudent?.name || '---'}</div>
          <div className="text-[14px] font-medium text-slate-400 mt-1">{topStudent?.points || 0} points</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="border border-slate-100 rounded-[24px] p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
             <span className="text-[14px] font-bold text-slate-900 uppercase tracking-tight">Avg. Points / Student</span>
             <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>
          <div className="text-[32px] font-black tracking-tight">{avgPoints}</div>
          <div className="text-[14px] font-medium text-slate-400 mt-1">School-wide average</div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 px-4 sm:px-8 max-w-7xl mx-auto">
        {/* House Leaderboard Chart */}
        <section>
          <div className="mb-6 sm:mb-8">
            <h2 className="text-[18px] sm:text-[20px] font-black tracking-tight">House Leaderboard</h2>
            <p className="text-slate-400 text-[10px] sm:text-[12px] font-black uppercase tracking-widest mt-1">Current house point standings.</p>
          </div>
          <div className="space-y-4 sm:space-y-6">
            {houses.map((house) => {
              const config = HOUSES.find(h => h.id === house.id);
              const percentage = (house.totalPoints / (topHouse?.totalPoints || 1)) * 100;
              return (
                <div key={house.id} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6">
                  <div className="w-20 text-left sm:text-right text-[13px] sm:text-[14px] font-bold text-slate-400 uppercase">{house.name}</div>
                  <div className="flex-1 h-8 sm:h-12 bg-slate-50 rounded-lg sm:rounded-xl overflow-hidden relative">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className={cn("h-full rounded-lg sm:rounded-xl transition-all", config?.color)}
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center text-[11px] sm:text-[13px] font-black text-slate-900 leading-none">
                      {house.totalPoints.toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Student Leaderboard */}
        <section className="mt-8 lg:mt-0">
          <div className="mb-4">
            <h2 className="text-[18px] sm:text-[20px] font-black tracking-tight">Student Leaderboard</h2>
            <p className="text-slate-400 text-[10px] sm:text-[12px] font-black uppercase tracking-widest mt-1">Top performing students based on house points.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] lg:min-w-0">
               <thead>
                  <tr className="text-left border-b border-slate-50">
                    <th className="py-4 text-[11px] sm:text-[12px] font-black text-slate-400 uppercase tracking-widest">Rank</th>
                    <th className="py-4 text-[11px] sm:text-[12px] font-black text-slate-400 uppercase tracking-widest px-4">Student</th>
                    <th className="py-4 text-[11px] sm:text-[12px] font-black text-slate-400 uppercase tracking-widest hidden xs:table-cell">House</th>
                    <th className="py-4 text-[11px] sm:text-[12px] font-black text-slate-400 uppercase tracking-widest text-right">Points</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {students.map((student, idx) => {
                    const house = HOUSES.find(h => h.id === student.houseId);
                    return (
                      <motion.tr 
                        key={student.uid}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group"
                      >
                        <td className="py-4 font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-4 px-2 sm:px-4">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-8 sm:w-10 h-8 sm:h-10 rounded-full flex items-center justify-center font-black text-[10px] sm:text-xs", house?.color.replace('bg-', 'bg-opacity-20 text-'))}>
                              {student.name.charAt(0)}
                            </div>
                            <div>
                               <div className="font-bold text-[13px] sm:text-base text-slate-900 truncate max-w-[120px] sm:max-w-none">{student.name}</div>
                               <div className="xs:hidden text-[10px] font-bold text-slate-400 uppercase">{house?.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 hidden xs:table-cell">
                          <span className={cn("px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest inline-block", house?.color.replace('bg-', 'bg-opacity-10 text-'))}>
                             {house?.name || '---'}
                          </span>
                        </td>
                        <td className="py-4 text-right font-black text-[14px] sm:text-[16px] tabular-nums">{student.points || 0}</td>
                      </motion.tr>
                    );
                  })}
               </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Award Modal */}
      <AnimatePresence>
        {showAwardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAwardModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[24px] sm:rounded-[40px] shadow-2xl p-6 sm:p-10 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">Award Student Points</h3>
                <button onClick={() => setShowAwardModal(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                   <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {!selectedStudent ? (
                <div className="space-y-4 sm:space-y-6">
                  <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search student by name..."
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl py-3 sm:py-4 pl-10 sm:pl-12 pr-4 font-bold text-[13px] sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </form>
                  
                  <div className="space-y-1 sm:space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                    {searchResults.map(s => (
                      <button 
                        key={s.uid}
                        onClick={() => setSelectedStudent(s)}
                        className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-slate-50 rounded-xl sm:rounded-2xl transition-colors group"
                      >
                        <div className="flex items-center gap-3 text-left">
                           <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs">{s.name.charAt(0)}</div>
                           <div>
                              <div className="font-bold text-sm">{s.name}</div>
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.houseId}</div>
                           </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                      </button>
                    ))}
                    {searchQuery && searchResults.length === 0 && (
                      <div className="text-center py-8 text-slate-400 font-bold text-sm">No students found matching "{searchQuery}"</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center font-black text-xs sm:text-base">{selectedStudent.name.charAt(0)}</div>
                        <span className="font-black text-sm sm:text-base">{selectedStudent.name}</span>
                     </div>
                     <button onClick={() => setSelectedStudent(null)} className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase underline">Change</button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5 sm:gap-2">
                       <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Points</label>
                       <input 
                         type="number" 
                         className="bg-slate-50 border border-slate-100 rounded-lg sm:rounded-xl p-3 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5"
                         value={points}
                         onChange={(e) => setPoints(Number(e.target.value))}
                       />
                    </div>
                    <div className="flex flex-col gap-1.5 sm:gap-2">
                       <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                       <select 
                         className="bg-slate-50 border border-slate-100 rounded-lg sm:rounded-xl p-3 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 appearance-none"
                         value={category}
                         onChange={(e) => setCategory(e.target.value as any)}
                       >
                         {POINT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                       </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 sm:gap-2">
                    <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason</label>
                    <input 
                      type="text" 
                      placeholder="Why are they being awarded?" 
                      className="bg-slate-50 border border-slate-100 rounded-lg sm:rounded-xl p-3 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>

                  <button 
                    disabled={isSubmitting || !reason}
                    onClick={handleAward}
                    className="w-full btn-slate py-3.5 sm:py-4 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    {isSubmitting ? 'Syncing...' : <> <Check className="w-4 h-4 sm:w-5 sm:h-5" /> Award Points </>}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
