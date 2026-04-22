import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useHouses, useLogs, addPoints } from '../hooks/useFirestore';
import { HOUSES, POINT_CATEGORIES } from '../types';
import HouseCard from '../components/HouseCard';
import Leaderboard from '../components/Leaderboard';
import ActivityFeed from '../components/ActivityFeed';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield,
  Plus, 
  LogOut, 
  Settings, 
  Users, 
  RefreshCw, 
  LayoutDashboard,
  Menu,
  Tv,
  Clock,
  TrendingUp
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

import UserManager from '../components/UserManager';
import PointManagementModal from '../components/PointManagementModal';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { houses } = useHouses();
  const { logs } = useLogs(30);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users'>('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [isPointModalOpen, setIsPointModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    fetch('/api/db-check')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'connected') setDbStatus('connected');
        else setDbStatus('error');
      })
      .catch(() => setDbStatus('error'));

    return () => clearInterval(timer);
  }, []);

  const menuGroups = [
    {
      label: 'OPERATIONS',
      items: [
        { id: 'dashboard', label: 'House Points', icon: TrendingUp },
      ]
    },
    {
      label: 'INSTITUTIONAL RESEARCH',
      items: [
        { id: 'users', label: 'Students & Staff', icon: Users },
        { id: 'live', label: 'Live Display', icon: Tv, action: () => navigate('/live') },
      ]
    }
  ];

  return (
    <div className="h-screen flex bg-[#f8fafc] overflow-hidden font-sans">
      <PointManagementModal 
        isOpen={isPointModalOpen} 
        onClose={() => setIsPointModalOpen(false)} 
      />
      {/* Sidebar - Matching Image Style */}
      <aside className={cn(
        "bg-white border-r border-slate-100 flex flex-col shrink-0 transition-all duration-300 overflow-hidden",
        sidebarOpen ? "w-[280px]" : "w-0 opacity-0 border-none"
      )}>
        <div className="w-[280px]"> {/* Fixed width container to prevent content squashing during transition */}
          <div className="p-8 mb-4">
           <div className="flex items-center gap-3">
              <img 
                src="https://myalphabet.school/images/logo/aLphabet%20logo%20Light%20mode.png" 
                alt="aLphabet Logo" 
                className="h-10 w-auto"
              />
           </div>
        </div>

        <nav className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar">
          {menuGroups.map(group => (
            <div key={group.label} className="space-y-2">
              <h3 className="px-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{group.label}</h3>
              <div className="space-y-1">
                {group.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => (item as any).action ? (item as any).action() : setActiveTab(item.id as any)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[14px] font-bold transition-all",
                      activeTab === item.id 
                        ? "bg-[#eff6ff] text-slate-900 shadow-sm" 
                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-slate-50">
           <div className="flex items-center gap-3 p-2">
              <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white text-sm font-bold">
                 {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 overflow-hidden">
                 <p className="text-[14px] font-bold text-slate-900 truncate">{user?.name}</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Super Admin</p>
              </div>
              <button onClick={logout} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
                 <LogOut className="w-4 h-4" />
              </button>
           </div>
        </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header - Matching Image Style */}
        <header className="h-[72px] bg-white border-b border-slate-100 flex items-center justify-between px-10 shrink-0">
           <div className="flex items-center gap-6">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"
              >
                 <Menu className="w-5 h-5" />
              </button>
           </div>

           <div className="flex items-center gap-8">
              <div className="flex items-center gap-6 text-slate-900 font-bold text-[14px]">
                 <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {format(currentTime, 'hh:mm:ss a')}
                 </div>
                 <div className="text-slate-300">|</div>
                 <div className="flex items-center gap-2 text-slate-400">
                    {format(currentTime, 'eee d MMM')}
                 </div>
              </div>
              
              <div className="flex items-center gap-3">
                 <div className={cn(
                   "text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full",
                   dbStatus === 'connected' ? "bg-emerald-50 text-emerald-600 border border-emerald-100/50" : "bg-red-50 text-red-500 border border-red-100/50"
                 )}>
                   {dbStatus === 'connected' ? 'Core Sync Active' : 'Offline'}
                 </div>
                 <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-[12px]">
                   {user?.name?.substring(0,2).toUpperCase() || 'AD'}
                 </div>
              </div>
           </div>
        </header>

        {/* Dynamic Content Body */}
        <div className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
            {activeTab === 'dashboard' && (
              <div className="p-10 space-y-10">
                 <div className="flex items-end justify-between">
                    <div>
                      <h2 className="text-[56px] font-black text-slate-900 tracking-tighter leading-none mb-2">House Points</h2>
                      <p className="text-[14px] font-bold text-slate-400 uppercase tracking-widest mt-1">Live House Metrics & Standing</p>
                    </div>
                    <button 
                      onClick={() => setIsPointModalOpen(true)}
                      className="btn-slate py-4 px-8 rounded-full flex items-center gap-3 text-[16px] font-black shadow-lg shadow-slate-200"
                    >
                      <Plus className="w-5 h-5" /> Manage Student Points
                    </button>
                 </div>

                 <div className="grid grid-cols-4 gap-6">
                  {houses.map(house => (
                    <div key={house.id} className="h-[140px]">
                      <HouseCard house={house} />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-8 pb-10">
                  <div className="col-span-2">
                    <Leaderboard houses={houses} />
                  </div>
                  <div className="col-span-1">
                    <ActivityFeed logs={logs} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="p-10 bg-white/50 h-full">
                 <UserManager />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
