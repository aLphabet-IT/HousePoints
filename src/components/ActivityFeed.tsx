import React from 'react';
import { PointLog, HOUSES } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { History, Plus, Minus, Hash } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ActivityFeed({ logs }: { logs: PointLog[] }) {
  return (
    <div className="card h-full flex flex-col">
      <div className="panel-title text-[14px] font-bold text-text-main mb-4 flex items-center gap-2">
        <History className="w-4 h-4 text-slate-grey" />
        Live Activity
      </div>

      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
        <div className="flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {logs.map((log) => {
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
    </div>
  );
}
