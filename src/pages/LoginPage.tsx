import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function LoginPage() {
  const { user, loading, loginWithEmail } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Email Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'teacher') navigate('/teacher');
      else navigate('/student');
    }
  }, [user, loading, navigate]);

  const handleGoogleLogin = async () => {
    try {
      setIsAuthenticating(true);
      setError(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      setIsAuthenticating(true);
      setError(null);
      await loginWithEmail(email, password);
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' 
        ? 'Invalid email or password' 
        : err.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-6 font-sans">
      <div className="max-w-[440px] w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[32px] shadow-[0_30px_80px_rgba(0,0,0,0.06)] border border-white py-6 px-10 flex flex-col items-center"
        >
          {/* Logo */}
          <img 
            src="https://myalphabet.school/images/logo/aLphabet%20logo%20Light%20mode.png" 
            alt="aLphabet Logo" 
            className="h-12 mb-4"
          />

          <h1 className="text-[21px] font-bold text-[#1E293B] mb-0.5">Welcome back</h1>
          <p className="text-[#64748B] text-[12px] font-medium mb-4 text-center leading-relaxed">Sign in to access your dashboard</p>

          <form onSubmit={handleEmailLogin} className="w-full space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#1E293B] ml-1">Email</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@alphabet.school"
                  required
                  className="w-full bg-[#F3F8FF] border border-transparent p-2.5 pl-11 rounded-xl text-[13px] font-medium text-[#1E293B] placeholder-[#94A3B8] focus:bg-white focus:border-[#CBD5E1] focus:outline-none transition-all shadow-sm"
                />
                <Mail className="w-3.5 h-3.5 absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#1E293B] ml-1">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#F3F8FF] border border-transparent p-2.5 pl-11 pr-10 rounded-xl text-[13px] font-medium text-[#1E293B] placeholder-[#94A3B8] focus:bg-white focus:border-[#CBD5E1] focus:outline-none transition-all shadow-sm"
                />
                <Lock className="w-3.5 h-3.5 absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-1">
              <input 
                type="checkbox" 
                id="remember" 
                className="w-3.5 h-3.5 rounded border-[#CBD5E1] text-[#5D7290] focus:ring-[#5D7290]"
              />
              <label htmlFor="remember" className="text-[12px] font-medium text-[#64748B] cursor-pointer">Remember me</label>
            </div>

            {error && (
              <div className="bg-red-50 p-2 rounded-xl border border-red-100">
                <p className="text-red-500 text-[11px] font-medium text-center">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={isAuthenticating || !email || !password}
              className="w-full bg-[#5D7290] hover:bg-[#4E617A] text-white py-2.5 rounded-xl text-[14px] font-bold shadow-lg shadow-slate-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 mt-1"
            >
              {isAuthenticating ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="w-full flex items-center gap-3 my-4">
            <div className="flex-1 h-[1px] bg-[#E2E8F0]" />
            <span className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-[0.2em]">OR</span>
            <div className="flex-1 h-[1px] bg-[#E2E8F0]" />
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={isAuthenticating}
            className="w-full bg-white border border-[#E2E8F0] py-2.5 rounded-xl flex items-center justify-center gap-2.5 hover:bg-slate-50 transition-all group shadow-sm active:scale-[0.98]"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4.5 h-4.5" alt="Google" />
            <span className="text-[14px] font-semibold text-[#1E293B]">Continue with Google</span>
          </button>

          <div className="mt-5 pt-4 border-t border-slate-100 w-full flex flex-col items-center gap-3">
            <button 
              onClick={() => navigate('/live')}
              className="px-5 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-[11px] font-black text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all flex items-center gap-2 group"
            >
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full group-hover:animate-ping" />
              View Live Cup Preview
            </button>
            
            <div className="text-center space-y-0.5">
              <p className="text-[9px] font-medium text-[#94A3B8]">© 2025 aLphabet internationaL schooL.</p>
              <p className="text-[9px] font-medium text-[#94A3B8]">Crafted with care - aLphabet IT Dept</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
