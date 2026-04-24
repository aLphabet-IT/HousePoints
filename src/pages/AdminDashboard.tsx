import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useHouses, useLogs, addPoints, useSystemConfig } from '../hooks/useFirestore';
import { HOUSES, POINT_CATEGORIES } from '../types';
import HouseCard from '../components/HouseCard';
import Leaderboard from '../components/Leaderboard';
import ActivityFeed from '../components/ActivityFeed';
import { motion, AnimatePresence } from 'motion/react';
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
  TrendingUp,
  X,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

import UserManager from '../components/UserManager';
import PointManagementModal from '../components/PointManagementModal';
import HousePointModal from '../components/HousePointModal';
import PointSettings from '../components/PointSettings';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { config } = useSystemConfig();
  const { houses } = useHouses();
  const { logs } = useLogs(config?.academicYear, 30);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'settings'>('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [isPointModalOpen, setIsPointModalOpen] = useState(false);
  const [isHousePointModalOpen, setIsHousePointModalOpen] = useState(false);
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
      label: 'INSTITUTIONAL RESEARCH',
      items: [
        { id: 'dashboard', label: 'House Points', icon: TrendingUp },
        { id: 'users', label: 'User Management', icon: ShieldCheck },
        { id: 'settings', label: 'Point Settings', icon: Settings },
        { id: 'live', label: 'Live Display', icon: Tv, action: () => navigate('/live') },
      ]
    }
  ];

  return (
    <div className="min-h-screen lg:h-screen flex bg-[#f8fafc] lg:overflow-hidden font-sans">
      <PointManagementModal 
        isOpen={isPointModalOpen} 
        onClose={() => setIsPointModalOpen(false)} 
      />

      <HousePointModal
        isOpen={isHousePointModalOpen}
        onClose={() => setIsHousePointModalOpen(false)}
      />
      {/* Sidebar - Matching Image Style */}
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "fixed lg:relative inset-y-0 left-0 bg-white border-r border-slate-100 flex flex-col shrink-0 z-50 overflow-hidden shadow-2xl lg:shadow-none w-[240px]"
            )}
          >
            <div className="w-[240px] flex flex-col h-full">
              <div className="p-8 pb-4 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <img 
                    src="https://myalphabet.school/images/logo/aLphabet%20logo%20Light%20mode.png" 
                    alt="aLphabet Logo" 
                    className="h-10 w-auto"
                  />
               </div>
               <button 
                 onClick={() => setSidebarOpen(false)}
                 className="lg:hidden p-2 hover:bg-slate-50 rounded-xl text-slate-400"
               >
                  <X className="w-5 h-5" />
               </button>
            </div>
         <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuGroups.map(group => (
            <div key={group.label} className="space-y-1">
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
          ))}
        </nav>

        </div>
      </motion.aside>
    )}
  </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header - Matching Image Style */}
        <header className="h-[72px] bg-white border-b border-slate-100 flex items-center justify-between px-4 lg:px-10 shrink-0">
           <div className="flex items-center gap-4 lg:gap-6">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"
              >
                 <Menu className="w-5 h-5" />
              </button>
              <img 
                src="https://myalphabet.school/images/logo/aLphabet%20logo%20Light%20mode.png" 
                alt="aLphabet Logo" 
                className="h-8 lg:hidden"
              />
           </div>

           <div className="flex items-center gap-4 lg:gap-8">
              <div className="hidden sm:flex items-center gap-6 text-slate-900 font-bold text-[14px]">
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
                 <div className="flex items-center gap-2 lg:pl-4 lg:border-l lg:border-slate-100 lg:ml-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-[12px]">
                       {user?.name?.substring(0,2).toUpperCase() || 'AD'}
                    </div>
                    <button 
                      onClick={logout}
                      className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-all active:scale-95"
                      title="Sign Out"
                    >
                      <LogOut className="w-4.5 h-4.5" />
                    </button>
                 </div>
              </div>
           </div>
        </header>

        {/* Dynamic Content Body */}
        <div className="flex-1 lg:overflow-hidden relative">
          <div className="lg:absolute lg:inset-0 lg:overflow-y-auto custom-scrollbar">
            {activeTab === 'dashboard' && (
              <div className="p-4 sm:p-6 lg:p-10 space-y-6 lg:space-y-10">
                 <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div>
                      <h2 className="text-[32px] sm:text-[42px] lg:text-[56px] font-black text-slate-900 tracking-tighter leading-none mb-2">House Points</h2>
                      <p className="text-[12px] lg:text-[14px] font-bold text-slate-400 uppercase tracking-widest mt-1">Live House Metrics & Standing</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:gap-4">
                      <button 
                        onClick={() => setIsHousePointModalOpen(true)}
                        className="btn-slate py-3 sm:py-4 px-6 sm:px-8 rounded-2xl sm:rounded-full flex items-center justify-center gap-3 text-[14px] sm:text-[16px] font-black shadow-lg shadow-slate-200 active:scale-95 transition-all"
                      >
                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                        Direct House Points
                      </button>
                      <button 
                        onClick={() => setIsPointModalOpen(true)}
                        className="btn-slate py-3 sm:py-4 px-6 sm:px-8 rounded-2xl sm:rounded-full flex items-center justify-center gap-3 text-[14px] sm:text-[16px] font-black shadow-lg shadow-slate-200 active:scale-95 transition-all"
                      >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> Manage Student Points
                      </button>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                  {houses.map(house => (
                    <div key={house.id} className="h-auto sm:h-[140px]">
                      <HouseCard house={house} />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 pb-10">
                  <div className="lg:col-span-2">
                    <Leaderboard houses={houses} />
                  </div>
                  <div className="lg:col-span-1">
                    <ActivityFeed logs={logs} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="p-4 sm:p-6 lg:p-10 bg-white/50 h-full">
                 <UserManager />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="p-4 sm:p-6 lg:p-10 bg-white/50 h-full">
                 <PointSettings />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
