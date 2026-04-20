import React from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Settings, 
  AlertCircle,
  LayoutDashboard
} from 'lucide-react';
import { useHouses, useLogs, useUserCount } from '../hooks/useFirestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { cn } from '../lib/utils';

export default function InstitutionalOverview() {
  const { houses } = useHouses();
  const { logs } = useLogs(50);
  const { count: studentCount, loading: statsLoading } = useUserCount('student');

  // Mock data for the attendance/engagement chart seen in the image
  const engagementData = [
    { day: 'Mon', value: 85, color: '#3b82f6' },
    { day: 'Tue', value: 92, color: '#10b981' },
    { day: 'Wed', value: 78, color: '#3b82f6' },
    { day: 'Thu', value: 88, color: '#3b82f6' },
    { day: 'Fri', value: 95, color: '#10b981' },
  ];

  const mainActions = [
    { id: 'setup', title: 'System Setup', subtitle: "GLOBAL ALPHABET'S LOGIC", icon: Settings, color: 'text-slate-500' },
  ];

  const stats = [
    { id: 'students', label: 'TOTAL STUDENTS', value: statsLoading ? '...' : studentCount.toString(), sublabel: 'ENROLLED ROSTER', icon: Users },
    { id: 'alerts', label: 'ACTIVE ALERTS', value: '2', sublabel: 'REQUIRES ATTENTION', icon: AlertCircle, variant: 'alert' },
  ];

  return (
    <div className="flex-1 p-8 space-y-10 custom-scrollbar overflow-y-auto bg-white/50">
      {/* Hero Section */}
      <div>
        <h1 className="text-[56px] font-black text-slate-900 tracking-tighter leading-none mb-2">
          Institutional Overview
        </h1>
        <p className="text-[14px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          Real-time Engagement and Operational Analytics.
        </p>
      </div>

      {/* Main Action Cards */}
      <div className="grid grid-cols-4 gap-6">
        {mainActions.map((action, idx) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group bg-white border border-slate-100 p-8 rounded-[32px] shadow-sm hover:shadow-xl transition-all cursor-pointer"
          >
            <action.icon className={cn("w-6 h-6 mb-6", action.color)} />
            <h3 className="text-[20px] font-extrabold text-slate-900 mb-1">{action.title}</h3>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.1em]">{action.subtitle}</p>
          </motion.div>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-5 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + idx * 0.05 }}
            className={cn(
              "bg-white border p-6 rounded-[24px] shadow-sm flex flex-col justify-between min-h-[160px]",
              stat.variant === 'alert' ? "border-red-50 bg-red-50/10" : "border-slate-50"
            )}
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
              <stat.icon className={cn("w-4 h-4", stat.variant === 'alert' ? "text-red-400" : "text-slate-200")} />
            </div>
            <div className="mt-4">
              <div className={cn("text-4xl font-black tracking-tighter", stat.variant === 'alert' ? "text-red-600" : "text-slate-900")}>
                {stat.value}
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{stat.sublabel}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-3 gap-8 pb-10">
        {/* House Standings (from Image) */}
        <div className="col-span-3 bg-white border border-slate-50 p-8 rounded-[32px] shadow-sm">
          <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">House Cup Standings</div>
          <div className="space-y-6">
            {houses.sort((a,b) => b.totalPoints - a.totalPoints).map((house, idx) => (
              <div key={house.id} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[13px] font-bold text-slate-700 capitalize">{house.name}</span>
                  <span className="text-[16px] font-black text-slate-900">{house.totalPoints.toLocaleString()}</span>
                </div>
                <div className="h-3 bg-slate-50 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (house.totalPoints / (houses[0]?.totalPoints || 1)) * 100)}%` }}
                    className={cn(
                      "h-full rounded-full",
                      house.id === 'phoenix' ? "bg-red-500" :
                      house.id === 'pegasus' ? "bg-blue-500" :
                      house.id === 'centaur' ? "bg-emerald-500" :
                      "bg-purple-500"
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
