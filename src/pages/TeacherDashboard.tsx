import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useHouses, useLogs, addPoints, usePointReasons, useSystemConfig, useAllUsers, awardPointsToStudent } from '../hooks/useFirestore';
import { HOUSES, PointReason, User } from '../types';
import HouseCard from '../components/HouseCard';
import Leaderboard from '../components/Leaderboard';
import ActivityFeed from '../components/ActivityFeed';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Plus, LogOut, Info, BarChart3, Shield, Menu, X, Search, User as UserIcon } from 'lucide-react';
import { cn } from '../lib/utils';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { config } = useSystemConfig();
  const { houses } = useHouses();
  const { logs } = useLogs(config?.academicYear, 20);
  const { reasons } = usePointReasons();
  const { users } = useAllUsers();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  
  const [selectedHouse, setSelectedHouse] = useState(HOUSES[0].id);
  const [selectedStudentUid, setSelectedStudentUid] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
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
    if ((!selectedReasonId && !customReason) || isSubmitting || !selectedStudentUid) return;

    setIsSubmitting(true);
    try {
      const student = users.find(u => u.uid === selectedStudentUid);
      if (student) {
        await awardPointsToStudent(
          config?.academicYear || new Date().getFullYear().toString(),
          student.uid,
          student.name,
          student.houseId || selectedHouse,
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
        setSelectedStudentUid('');
        setStudentSearch('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStudents = users.filter(u => 
    u.role === 'student' && 
    (u.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
     u.grade?.toLowerCase().includes(studentSearch.toLowerCase()) ||
     u.section?.toLowerCase().includes(studentSearch.toLowerCase()))
  ).slice(0, 5);

  const selectedStudent = users.find(u => u.uid === selectedStudentUid);

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
               <button 
                 className="flex items-center gap-3 p-3 rounded-xl text-[14px] font-bold bg-[#eff6ff] text-slate-900 text-left w-full"
               >
                 <Sparkles className="w-4 h-4" /> Award Points
               </button>
            </motion.nav>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar (Always Visible) */}
        <nav className="hidden lg:flex flex-col w-[200px] bg-white border-r border-slate-100 p-5 gap-1 shrink-0">
           <button 
             className="flex items-center gap-3 p-2.5 rounded-lg text-[14px] font-bold bg-[#eff6ff] text-slate-900 text-left w-full"
           >
             <Sparkles className="w-4 h-4" /> Award Points
           </button>
        </nav>
         <div className="flex-1 p-4 sm:p-5 lg:overflow-y-auto custom-scrollbar">
           <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4 lg:gap-6 min-h-full">
             
             {/* Main Award Section */}
             <div className="lg:col-span-3 space-y-4">
                <div className="card bg-slate-dark border-none py-6 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-black/10 rounded-full flex items-center justify-center"><Info className="w-5 h-5 text-black" /></div>
                      <div>
                        <h3 className="font-bold text-black">Ready to motivate?</h3>
                        <p className="text-[12px] text-black/80 font-medium">Add points to recognize student achievement.</p>
                      </div>
                   </div>
                </div>

                 <div className="card">
                   <div className="panel-title text-[15px] sm:text-[16px] font-bold mb-4 sm:mb-6">Point Contribution Form</div>
                    <form onSubmit={handleAddPoints} className="space-y-5 sm:space-y-6">
                      <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-text-muted uppercase">Target Student</label>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                              <Search className="w-4 h-4" />
                            </div>
                            <input 
                              type="text"
                              placeholder="Search student by name, grade, or section..."
                              value={studentSearch}
                              onChange={(e) => {
                                setStudentSearch(e.target.value);
                                if (selectedStudentUid) setSelectedStudentUid('');
                              }}
                              className="w-full bg-slate-50 border border-border-theme pl-10 pr-3 py-3 rounded-lg text-sm font-semibold"
                            />
                            {studentSearch && !selectedStudentUid && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-100 rounded-xl shadow-xl z-10 overflow-hidden divide-y divide-slate-50">
                                {filteredStudents.length > 0 ? (
                                  filteredStudents.map(student => (
                                    <button
                                      key={student.uid}
                                      type="button"
                                      onClick={() => {
                                        setSelectedStudentUid(student.uid);
                                        setStudentSearch(student.name);
                                        if (student.houseId) setSelectedHouse(student.houseId);
                                      }}
                                      className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 transition-colors"
                                    >
                                      <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold uppercase",
                                        student.houseId === 'phoenix' ? "bg-phoenix" :
                                        student.houseId === 'pegasus' ? "bg-pegasus" :
                                        student.houseId === 'centaur' ? "bg-centaur" :
                                        student.houseId === 'sphinx' ? "bg-sphinx" : "bg-slate-400"
                                      )}>
                                        {student.name.substring(0, 2)}
                                      </div>
                                      <div>
                                        <p className="text-[13px] font-bold text-slate-900">{student.name}</p>
                                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                          Grade {student.grade}{student.section} • {student.houseId || 'No House'}
                                        </p>
                                      </div>
                                    </button>
                                  ))
                                ) : (
                                  <div className="px-4 py-3 text-[12px] text-slate-400 italic">No students found</div>
                                )}
                              </div>
                            )}
                          </div>
                          {selectedStudent && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200"
                            >
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center text-white",
                                selectedStudent.houseId === 'phoenix' ? "bg-phoenix" :
                                selectedStudent.houseId === 'pegasus' ? "bg-pegasus" :
                                selectedStudent.houseId === 'centaur' ? "bg-centaur" :
                                selectedStudent.houseId === 'sphinx' ? "bg-sphinx" : "bg-slate-400"
                              )}>
                                <UserIcon className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <p className="text-[14px] font-black text-slate-900">{selectedStudent.name}</p>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
                                  Grade {selectedStudent.grade}{selectedStudent.section} • {selectedStudent.houseId}
                                </p>
                              </div>
                              <button 
                                type="button"
                                onClick={() => {
                                  setSelectedStudentUid('');
                                  setStudentSearch('');
                                }}
                                className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </motion.div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                           <label className="text-[10px] font-bold text-text-muted uppercase">Reason Selection</label>
                           <select 
                             value={selectedReasonId}
                             onChange={(e) => handleReasonChange(e.target.value)}
                             className="w-full bg-slate-50 border border-border-theme p-3 rounded-lg text-sm sm:text-[14px] font-semibold"
                           >
                             <option value="">Select a pre-configured reason</option>
                             {reasons.map(r => (
                               <option key={r.id} value={r.id}>{r.label} ({r.points > 0 ? `+${r.points}` : r.points})</option>
                             ))}
                             <option value="custom">-- Custom Reason --</option>
                           </select>
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
                        disabled={isSubmitting || !selectedStudentUid || (!selectedReasonId && !customReason)}
                        className={cn(
                          "w-full py-3 sm:py-3.5 text-[14px] rounded-[8px] font-semibold transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed",
                          selectedStudentUid ? (selectedStudent?.houseId ? HOUSES.find(h => h.id === selectedStudent.houseId)?.color : "bg-slate-900") : "bg-slate-200 text-slate-400",
                          selectedStudentUid && "text-white shadow-lg shadow-slate-200"
                        )}
                      >
                        {isSubmitting ? 'Processing...' : selectedStudentUid ? 'Submit Entry' : 'Select a Student to Continue'}
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
