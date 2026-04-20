import React from 'react';
import { motion } from 'motion/react';
import { House, HOUSES } from '../types';
import { cn } from '../lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface HouseCardProps {
  house: House;
  isCompact?: boolean;
}

const HouseCard: React.FC<HouseCardProps> = ({ house, isCompact = false }) => {
  const houseConfig = HOUSES.find(h => h.id === house.id);
  
  if (isCompact) {
    return (
      <div className="card h-full flex flex-col justify-between">
        <div className={cn("absolute top-0 left-0 w-[4px] h-full", houseConfig?.color)} />
        <div className="flex items-center justify-between">
           <div className="house-name text-[10px] font-bold text-text-muted uppercase tracking-wider">{house.name}</div>
           <div className={cn("text-[10px] font-bold", houseConfig?.textColor)}>Rank #{house.rank}</div>
        </div>
        <div className="text-2xl font-extrabold text-text-main mt-1 leading-none">{house.totalPoints}</div>
      </div>
    );
  }

  return (
    <motion.div 
      layout
      className="card h-full flex flex-col justify-between group"
    >
      <div className={cn("absolute top-0 left-0 w-[4px] h-full", houseConfig?.color)} />
      
      <div className="flex justify-between items-start">
        <div>
          <div className="house-name text-[12px] font-bold text-text-muted uppercase tracking-widest">{house.name}</div>
          <div className="text-[28px] font-extrabold text-text-main mt-1 leading-tight">
            {house.totalPoints.toLocaleString()}
          </div>
        </div>
        <div className={cn("text-[12px] font-semibold px-2 py-0.5 rounded-md bg-opacity-10", houseConfig?.color, houseConfig?.textColor)}>
          Rank #{house.rank}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
           {house.rank === 1 ? <TrendingUp className="w-4 h-4 text-centaur" /> : <TrendingDown className="w-4 h-4 text-text-muted opacity-50" />}
           <span className="text-[11px] font-medium text-text-muted">Live sync active</span>
        </div>
      </div>
    </motion.div>
  );
};

export default HouseCard;
