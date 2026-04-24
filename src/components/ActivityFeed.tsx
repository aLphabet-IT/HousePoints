import React, { useState } from 'react';
import { PointLog, HOUSES } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { History, Plus, Minus, Hash, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ActivityFeed({ logs, rowsPerPage = 6 }: { logs: PointLog[]; rowsPerPage?: number }) {
  const [currentPage, setCurrentPage] = useState(1);
  const scrollLock = React.useRef<number>(0);

  const totalPages = Math.ceil(logs.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentLogs = logs.slice(startIndex, startIndex + rowsPerPage);

  const goToNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const goToPrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - scrollLock.current < 600) return;
    
    if (e.deltaY > 20) {
      if (currentPage < totalPages) {
        goToNext();
        scrollLock.current = now;
      }
    } else if (e.deltaY < -20) {
      if (currentPage > 1) {
        goToPrev();
        scrollLock.current = now;
      }
    }
  };

  return (
    <div 
      className="card h-full flex flex-col"
      onWheel={handleWheel}
    >
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="panel-title text-[14px] font-bold text-text-main flex items-center gap-2">
          <History className="w-4 h-4 text-slate-grey" />
          Live Activity
        </div>
        {logs.length > rowsPerPage && (
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            Page {currentPage} of {totalPages}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
        <div className="flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {currentLogs.map((log) => {
              const houseConfig = HOUSES.find(h => h.id === log.houseId);
              const isPositive = log.points > 0;
              
              const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : (log.timestamp ? new Date(log.timestamp) : new Date());
              const isValidDate = logDate instanceof Date && !isNaN(logDate.getTime());
              
              return (
                <motion.div
                  key={log.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="pb-3 border-b border-slate-50 last:border-0"
                >
                  <div className="flex justify-between items-center text-[11px] text-text-muted mb-1 font-medium italic">
                    <span>{log.awardedBy}</span>
                    <span>{isValidDate ? `${formatDistanceToNow(logDate)} ago` : 'Just now'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[12px] font-semibold text-text-main leading-none">
                      <span className={cn(
                        "font-bold pr-1",
                        isPositive ? "text-centaur" : "text-phoenix"
                      )}>
                        {isPositive ? '+' : ''}{log.points}
                      </span>
                      to {houseConfig?.name}
                    </div>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider",
                      houseConfig?.id === 'phoenix' && "bg-red-50 text-red-700",
                      houseConfig?.id === 'pegasus' && "bg-blue-50 text-blue-700",
                      houseConfig?.id === 'centaur' && "bg-emerald-50 text-emerald-700",
                      houseConfig?.id === 'sphinx' && "bg-amber-50 text-amber-700"
                    )}>
                      {log.category}
                    </span>
                  </div>
                  
                  <div className="text-[11px] text-text-muted mt-1 truncate opacity-80">
                    {log.reason}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {logs.length === 0 && (
            <div className="py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <p className="text-text-muted text-[11px] font-semibold uppercase tracking-widest italic">Waiting for activity...</p>
            </div>
          )}
        </div>
      </div>

      {logs.length > rowsPerPage && (
        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between shrink-0">
          <button
            onClick={goToPrev}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          
          <div className="flex gap-1.5">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={cn(
                  "w-6 h-6 rounded-md text-[10px] font-black transition-all",
                  currentPage === i + 1 
                    ? "bg-slate-900 text-white shadow-sm" 
                    : "text-slate-400 hover:bg-slate-100"
                )}
              >
                {i + 1}
              </button>
            )).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))}
          </div>

          <button
            onClick={goToNext}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      )}
    </div>
  );
}
