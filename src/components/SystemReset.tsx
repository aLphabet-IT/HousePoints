import React, { useState } from 'react';
import { useSystemConfig, performSystemReset } from '../hooks/useFirestore';
import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle, ShieldAlert, Loader2, RefreshCw, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

export default function SystemReset() {
  const { user } = useAuth();
  const { config, loading } = useSystemConfig();
  const [newYear, setNewYear] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const EXPECTED_CONFIRM = 'RESET SYSTEM';

  const handleReset = async () => {
    if (confirmText !== EXPECTED_CONFIRM) return;
    if (!newYear) {
      alert('Please enter a valid academic year (e.g. 2024-2025)');
      return;
    }

    setIsResetting(true);
    setStatus('idle');

    try {
      await performSystemReset(newYear, user?.uid || '', user?.name || 'Admin', config?.academicYear || '');
      setStatus('success');
      setConfirmText('');
      setNewYear('');
    } catch (error) {
      console.error(error);
      setStatus('error');
    } finally {
      setIsResetting(false);
    }
  };

  if (loading) return (
    <div className="py-20 flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
      <p className="text-slate-400 text-[14px] font-medium">Loading system configuration...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-[20px] font-black text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-500" /> Admin Danger Zone
        </h2>
        <p className="text-[14px] font-medium text-slate-400">Manage academic years and system resets. These actions are irreversible.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Academic Year Info */}
        <div className="p-8 bg-white border border-slate-100 rounded-[32px] shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Current Academic Year</p>
              <h3 className="text-[24px] font-black text-slate-900">{config?.academicYear || 'Not Set'}</h3>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-50 space-y-2">
            <p className="text-[12px] font-bold text-slate-400">Last System Reset</p>
            <div className="flex items-center gap-3">
              <span className="text-[14px] font-bold text-slate-600">
                {config?.lastResetAt ? new Date(config.lastResetAt).toLocaleDateString() : 'Never'}
              </span>
              {config?.resetBy && (
                <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">by {config.resetBy}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reset Action */}
        <div className="p-8 bg-red-50/30 border border-red-100 rounded-[32px] space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
              <RefreshCw className={isResetting ? "w-6 h-6 animate-spin" : "w-6 h-6"} />
            </div>
            <div>
              <h3 className="text-[18px] font-black text-red-900 leading-tight">Full System Reset</h3>
              <p className="text-[12px] font-bold text-red-700/60 uppercase tracking-widest mt-1 italic font-mono">Warning: Action irreversible</p>
            </div>
          </div>

          <div className="space-y-4">
             <div className="space-y-2">
                <label className="text-[12px] font-bold text-red-900 ml-1">New Academic Year</label>
                <input 
                  type="text"
                  placeholder="e.g. 2024-25"
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                  className="w-full h-[52px] bg-white border border-red-100 rounded-2xl px-6 text-[16px] font-bold placeholder:text-red-200 focus:ring-2 focus:ring-red-500 focus:outline-none transition-all"
                />
             </div>

             <div className="space-y-2">
                <label className="text-[12px] font-bold text-red-900 ml-1 font-medium">Confirm by typing "<span className="font-bold underline text-red-600 tracking-wider px-1">{EXPECTED_CONFIRM}</span>"</label>
                <input 
                  type="text"
                  placeholder={EXPECTED_CONFIRM}
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full h-[52px] bg-white border border-red-100 rounded-2xl px-6 text-[16px] font-bold placeholder:text-red-200 focus:ring-2 focus:ring-red-500 focus:outline-none transition-all"
                />
             </div>

             <button
               onClick={handleReset}
               disabled={isResetting || confirmText !== EXPECTED_CONFIRM || !newYear}
               className="w-full h-[56px] bg-red-600 text-white rounded-2xl text-[16px] font-black hover:bg-red-700 disabled:opacity-30 disabled:grayscale transition-all shadow-xl shadow-red-200 active:scale-95 flex items-center justify-center gap-3"
             >
               {isResetting ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
               Final System Reset
             </button>

             {status === 'success' && (
               <motion.p 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                 className="text-center text-[14px] font-bold text-emerald-600 bg-emerald-50 py-3 rounded-xl border border-emerald-100"
               >
                 System reset successful! Most data cleared.
               </motion.p>
             )}
          </div>
        </div>
      </div>

      <div className="p-6 bg-slate-900 rounded-[28px] border border-slate-800 flex gap-5">
        <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="text-[16px] font-bold text-white">What happens during a reset?</h4>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            {[
              "Current house totals are archived into historical records.",
              "House points are reset to zero for the new academic year.",
              "All student points are cleared and reset to zero.",
              "System configuration is updated to the new year.",
              "Recent logs are kept, linked to the previous year.",
              "The registry of students and staff remains intact."
            ].map((item, i) => (
              <li key={i} className="text-[12px] font-medium text-slate-400 flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-slate-700 mt-2 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
