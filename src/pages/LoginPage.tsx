import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Sparkles, User, Tv, Mail, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function LoginPage() {
  const { user, loading, loginWithEmail } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<'google' | 'email'>('email');
  
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
    <div className="h-screen flex items-center justify-center bg-bg">
      <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="h-screen bg-bg flex items-center justify-center p-6 overflow-hidden relative font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
         <div className="absolute -top-24 -left-24 w-96 h-96 bg-phoenix rounded-full blur-[100px]" />
         <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-pegasus rounded-full blur-[100px]" />
      </div>

      <div className="max-w-md w-full relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card p-10 text-center shadow-2xl relative overflow-hidden"
        >
          {/* Animated accent bar */}
          <motion.div 
            animate={{ x: [-100, 400] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 left-0 w-24 h-1 bg-gradient-to-r from-transparent via-slate-400 to-transparent"
          />

          <div className="w-16 h-16 bg-slate-dark text-white rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-6 shadow-lg">
            MH
          </div>
          <h1 className="text-3xl font-black text-slate-dark tracking-tighter">MyHouse</h1>
          <p className="text-text-muted font-medium mt-2">Enterprise House Point Management</p>

          <div className="mt-8">
            <div className="flex bg-slate-50 p-1 rounded-xl mb-6 relative z-10">
               <button 
                 onClick={() => setAuthMethod('email')}
                 className={cn(
                   "flex-1 py-2 text-[12px] font-bold rounded-lg transition-all",
                   authMethod === 'email' ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600"
                 )}
               >
                 Institutional Login
               </button>
               <button 
                 onClick={() => setAuthMethod('google')}
                 className={cn(
                   "flex-1 py-2 text-[12px] font-bold rounded-lg transition-all",
                   authMethod === 'google' ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600"
                 )}
               >
                 Google Workspace
               </button>
            </div>

            {authMethod === 'email' ? (
              <form onSubmit={handleEmailLogin} className="space-y-4 text-left relative z-10">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gmail Account / Institutional Email</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@school.com"
                      required
                      className="w-full bg-white border border-slate-200 p-3 pl-10 rounded-xl text-[14px] font-medium focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 focus:outline-none transition-all"
                    />
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Security Password</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-white border border-slate-200 p-3 pl-10 rounded-xl text-[14px] font-medium focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 focus:outline-none transition-all"
                    />
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={isAuthenticating || !email || !password}
                  className="btn-slate w-full py-3.5 text-[14px] font-black flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all mt-6"
                >
                  {isAuthenticating ? 'Authenticating...' : 'Sign In to Portal'}
                </button>
              </form>
            ) : (
              <div className="space-y-3 relative z-10">
                <button 
                  onClick={handleGoogleLogin}
                  disabled={isAuthenticating}
                  className="btn-outline w-full py-3.5 text-[14px] flex items-center justify-center gap-3 shadow-sm active:scale-95 transition-all bg-white"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                  Continue with Google
                </button>
              </div>
            )}

            <button 
              onClick={() => navigate('/live')}
              className="w-full py-3 text-[12px] font-bold text-slate-400 hover:text-slate-600 transition-colors mt-2"
            >
              Public Live Display
            </button>
          </div>

          {/* Animated Background Pulse */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.03]">
             <motion.div 
               animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
               transition={{ duration: 8, repeat: Infinity }}
               className="w-full h-full bg-slate-900 border-8 border-slate-900 rounded-full"
             />
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl text-left">
              <p className="text-red-600 text-[11px] font-bold uppercase flex items-center gap-2">
                <Shield className="w-3 h-3" /> Error Detected
              </p>
              <p className="text-red-500 text-[12px] mt-1 leading-relaxed">
                {error}
              </p>
            </div>
          )}
        </motion.div>

        <p className="text-center text-[11px] text-text-muted mt-8 font-medium uppercase tracking-[0.2em] opacity-40">
           AIS House System • Secure Cloud Sync
        </p>
      </div>
    </div>
  );
}
