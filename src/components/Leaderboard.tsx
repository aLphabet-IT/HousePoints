import React from 'react';
import { House, HOUSES } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Trophy, Medal, TrendingUp } from 'lucide-react';

export default function Leaderboard({ houses }: { houses: House[] }) {
  const sortedHouses = [...houses].sort((a, b) => b.totalPoints - a.totalPoints);
  
  return (
    <div className="card h-full flex flex-col">
      <div className="panel-title text-[16px] font-bold text-text-main mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2">
           <Trophy className="w-4 h-4 text-slate-grey" />
           House Leaderboard
        </span>
        <span className="btn-outline text-[11px] py-1 px-2">Live Standings</span>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="text-left">
              <th className="p-2 border-b border-border-theme text-text-muted font-semibold uppercase tracking-wider">Rank</th>
              <th className="p-2 border-b border-border-theme text-text-muted font-semibold uppercase tracking-wider">House</th>
              <th className="p-2 border-b border-border-theme text-text-muted font-semibold uppercase tracking-wider">Total Points</th>
              <th className="p-2 border-b border-border-theme text-text-muted font-semibold uppercase tracking-wider text-right">Trend</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {sortedHouses.map((house, index) => {
                const houseConfig = HOUSES.find(h => h.id === house.id);
                const isFirst = index === 0;
                
                return (
                  <motion.tr
                    key={house.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-3 border-b border-slate-50">
                      <div className={cn(
                        "w-6 h-6 rounded flex items-center justify-center font-bold text-[11px]",
                        isFirst ? "bg-slate-dark text-white" : "bg-slate-100 text-slate-500"
                      )}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="p-3 border-b border-slate-50">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                        houseConfig?.id === 'phoenix' && "bg-red-50 text-red-700",
                        houseConfig?.id === 'pegasus' && "bg-blue-50 text-blue-700",
                        houseConfig?.id === 'centaur' && "bg-emerald-50 text-emerald-700",
                        houseConfig?.id === 'sphinx' && "bg-amber-50 text-amber-700"
                      )}>
                        {house.name}
                      </span>
                    </td>
                    <td className="p-3 border-b border-slate-50 font-bold text-text-main">
                      {house.totalPoints.toLocaleString()}
                    </td>
                    <td className="p-3 border-b border-slate-50 text-right">
                       {isFirst ? (
                         <span className="text-centaur text-[11px] font-bold flex items-center justify-end gap-1">
                           <TrendingUp className="w-3 h-3" /> Leading
                         </span>
                       ) : (
                         <span className="text-text-muted text-[11px] opacity-50">Chasing</span>
                       )}
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
