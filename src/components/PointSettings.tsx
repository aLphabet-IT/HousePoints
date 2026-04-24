import React, { useState } from 'react';
import { usePointReasons, addPointReason, updatePointReason, deletePointReason } from '../hooks/useFirestore';
import { POINT_CATEGORIES, PointCategory } from '../types';
import { Plus, Trash2, Edit2, Check, X, Info, AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function PointSettings() {
  const { reasons, loading } = usePointReasons();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [label, setLabel] = useState('');
  const [points, setPoints] = useState(1);
  const [category, setCategory] = useState<PointCategory>('other');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setLabel('');
    setPoints(1);
    setCategory('other');
    setEditingId(null);
    setIsAdding(false);
  };

  const handleEdit = (reason: any) => {
    setEditingId(reason.id);
    setLabel(reason.label);
    setPoints(reason.points);
    setCategory(reason.category);
    setIsAdding(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updatePointReason(editingId, label, points, category);
      } else {
        await addPointReason(label, points, category);
      }
      resetForm();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this point category? This will not affect historical logs.')) return;
    try {
      await deletePointReason(id);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-black text-slate-900 tracking-tight">Point Configurations</h2>
          <p className="text-[14px] font-medium text-slate-400">Define standard reasons and point values for the whole school.</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-[13px] font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 bg-slate-50 border border-slate-100 rounded-[24px] shadow-sm"
          >
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Reason / Label</label>
                <input 
                  type="text"
                  placeholder="e.g. Exceptional Homework"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="bg-white border border-slate-200 p-3 rounded-xl text-[14px] font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Points</label>
                <input 
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  className="bg-white border border-slate-200 p-3 rounded-xl text-[14px] font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value as PointCategory)}
                  className="bg-white border border-slate-200 p-3 rounded-xl text-[14px] font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none"
                >
                  {POINT_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-full flex gap-3 mt-2">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-[48px] bg-slate-900 text-white rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingId ? 'Update Configuration' : 'Create Configuration'}
                </button>
                <button 
                  type="button"
                  onClick={resetForm}
                  className="px-6 h-[48px] bg-white border border-slate-200 rounded-xl text-[14px] font-bold text-slate-400 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
            <p className="text-slate-400 text-[14px] font-medium">Loading configurations...</p>
          </div>
        ) : reasons.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
              <Info className="w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-900 font-bold">No custom point categories yet.</p>
              <p className="text-slate-400 text-[13px]">Add common reasons to make awarding points faster for teachers.</p>
            </div>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reason / Label</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Value</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reasons.map((reason) => (
                <tr key={reason.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-8 py-5">
                    <p className="text-[14px] font-bold text-slate-900">{reason.label}</p>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className={cn(
                      "inline-flex items-center justify-center min-w-[50px] px-3 py-1 rounded-full text-[12px] font-black tabular-nums",
                      reason.points >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                    )}>
                      {reason.points >= 0 ? `+${reason.points}` : reason.points}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md">
                      {reason.category}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(reason)}
                        className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(reason.id)}
                        className="p-2 bg-red-50 text-red-300 hover:text-red-500 hover:bg-red-100 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="p-6 bg-amber-50 border border-amber-100 rounded-[24px] flex gap-4">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <p className="text-[14px] font-bold text-amber-900">Important Note</p>
          <p className="text-[12px] font-medium text-amber-700/80 leading-relaxed">
            Changing point values here will only affect NEW entries. Historical logs will retain the points they were awarded with at the time of entry.
          </p>
        </div>
      </div>
    </div>
  );
}
