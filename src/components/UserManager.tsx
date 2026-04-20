import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { User, UserRole, HOUSES } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Shield, User as UserIcon, Trash2, Edit2, Check, UserPlus, X, DatabaseZap, Mail, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function UserManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  
  // New User form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('student');
  const [newHouseId, setNewHouseId] = useState<string>('phoenix');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as User)));
      setLoading(false);
    }, (error) => {
      console.error("UserManager Firestore error:", error);
      setLoading(false);
    });
  }, []);

  const filteredUsers = users.filter(u => {
    const name = u.name || '';
    const uid = u.uid || '';
    const email = u.email || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          uid.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleAddUser triggered", { newName, newEmail, role: newRole });
    
    if (!newName || !newEmail || !newPassword || isSubmitting) {
      console.warn("Validation failed or already submitting", { newName, newEmail, hasPassword: !!newPassword, isSubmitting });
      return;
    }

    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    // REMOVED: Strict isOfflineMode block to allow attempt even if anonymous login failed
    // The secondary app flow can work independently of the main app's auth state for the AUTH step.
    // The Firestore sync step might still fail if current user has no permissions, but we'll catch that.

    setIsSubmitting(true);
    let secondaryApp;
    try {
      console.log("Initializing secondary Firebase app for registration...");
      const secondaryAppName = `RegistrationApp_${Date.now()}`;
      // Spread config to ensure a fresh object
      secondaryApp = initializeApp({ ...firebaseConfig }, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);
      
      console.log("Creating auth user...");
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newEmail, newPassword);
      const authUser = userCredential.user;
      console.log("Auth user created:", authUser.uid);
      
      await signOut(secondaryAuth);

      console.log("Saving user profile to Firestore...");
      const newUser: User = {
        uid: authUser.uid,
        name: newName,
        email: newEmail,
        role: newRole,
      };

      if (newRole === 'student') {
        newUser.houseId = newHouseId;
        newUser.points = 0;
      }

      await setDoc(doc(db, 'users', authUser.uid), newUser);
      console.log("User profile saved successfully.");
      
      // Reset form
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setShowAddForm(false);
      alert(`Account created for ${newName}! User can now login.`);
    } catch (err: any) {
      console.error("UserManager: Failed to create user:", err);

      // CRITICAL: Cleanup orphaned auth user if Firestore write failed
      // This prevents "auth/email-already-in-use" on subsequent attempts
      if (err.message?.includes('permission-denied') || err.code === 'permission-denied') {
        const secondaryAuth = getAuth(secondaryApp);
        if (secondaryAuth.currentUser) {
          try {
            console.log("Cleaning up orphaned auth user...");
            await secondaryAuth.currentUser.delete();
          } catch (deleteErr) {
            console.warn("Could not cleanup orphaned auth user:", deleteErr);
          }
        }
      }

      // Detailed error for common Firebase issues
      let msg = err.message;
      if (err.message?.includes('permission-denied') || err.code === 'permission-denied') {
        msg = "Firestore Sync Denied. You must have correct administrative permissions to create new users in the database.";
      } else if (err.code === 'auth/email-already-in-use') {
        msg = "This email is already registered in the Authentication system.";
      } else if (err.code === 'auth/weak-password') {
        msg = "The password provided is too weak (min 6 characters required).";
      } else if (err.code === 'auth/invalid-email') {
        msg = "The email address format is invalid.";
      } else if (err.code === 'auth/operation-not-allowed') {
        msg = "Email/Password registration is currently disabled in your Firebase Console.";
      }
      
      alert(`Registration Conflict: ${msg}`);
    } finally {
      if (secondaryApp) {
        try {
          await deleteApp(secondaryApp);
        } catch (e) {
          console.warn("Error deleting secondary app:", e);
        }
      }
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async (uid: string, newRole: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', uid), { 
        role: newRole,
        // Remove house data if they are no longer a student
        houseId: newRole === 'student' ? 'phoenix' : null,
        points: newRole === 'student' ? 0 : null
      });
      setEditingId(null);
    } catch (err) {
      console.error("Failed to update role:", err);
    }
  };

  const handleUpdatePoints = async (uid: string, newPoints: number) => {
    try {
      await updateDoc(doc(db, 'users', uid), { points: newPoints });
    } catch (err) {
      console.error("Failed to update points:", err);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

  if (loading) return <div className="p-8 text-center text-text-muted">Loading user registry...</div>;

  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="panel-title text-[16px] font-bold text-text-main flex items-center gap-2">
          <Shield className="w-4 h-4 text-slate-grey" />
          System User Management
        </div>
        <div className="flex items-center gap-2">
           <div className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1.5 bg-emerald-50 text-emerald-600">
             <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-emerald-400" />
             Live Sync Enabled
           </div>
           <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className={cn(
              "btn-slate py-1.5 px-3 flex items-center gap-2 text-[12px]",
              showAddForm ? "bg-red-50 text-red-600 hover:bg-red-100" : ""
            )}
          >
            {showAddForm ? <><X className="w-3.5 h-3.5" /> Cancel</> : <><UserPlus className="w-3.5 h-3.5" /> New User</>}
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3 mb-6 bg-slate-50 p-2 rounded-xl border border-slate-100">
         <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-border-theme p-2 pl-8 rounded-lg text-[13px] font-medium focus:ring-1 focus:ring-slate-400 focus:outline-none"
            />
            <UserIcon className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
         </div>
         <select 
           value={filterRole}
           onChange={(e) => setFilterRole(e.target.value)}
           className="bg-white border border-border-theme p-2 rounded-lg text-[12px] font-bold min-w-[120px]"
         >
           <option value="all">All Roles</option>
           <option value="admin">Admins</option>
           <option value="teacher">Teachers</option>
           <option value="student">Students</option>
         </select>
      </div>

      {showAddForm && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 bg-slate-100 border border-slate-200 rounded-2xl shadow-inner"
        >
          <form onSubmit={handleAddUser} className="grid grid-cols-6 gap-4 items-end">
            <div className="col-span-1 flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Full Name</label>
              <input 
                type="text" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. John Doe"
                required
                className="bg-white border border-border-theme p-2 rounded-lg text-[13px] font-medium focus:ring-1 focus:ring-slate-400 focus:outline-none"
              />
            </div>
            <div className="col-span-1 flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  required
                  className="w-full bg-white border border-border-theme p-2 pl-8 rounded-lg text-[13px] font-medium focus:ring-1 focus:ring-slate-400 focus:outline-none"
                />
                <Mail className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div className="col-span-1 flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Set Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white border border-border-theme p-2 pl-8 rounded-lg text-[13px] font-medium focus:ring-1 focus:ring-slate-400 focus:outline-none"
                />
                <Lock className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <p className={cn(
                "text-[9px] font-medium transition-colors",
                newPassword.length > 0 && newPassword.length < 6 ? "text-red-500" : "text-slate-400"
              )}>Min. 6 characters</p>
            </div>
            <div className="col-span-1 flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">System Role</label>
              <select 
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="bg-white border border-border-theme p-2 rounded-lg text-[13px] font-bold"
              >
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
              </select>
            </div>
            <div className="col-span-1 flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider opacity-50">House (Optional)</label>
              <select 
                value={newHouseId}
                disabled={newRole !== 'student'}
                onChange={(e) => setNewHouseId(e.target.value)}
                className="bg-white border border-border-theme p-2 rounded-lg text-[13px] font-bold disabled:opacity-40"
              >
                {HOUSES.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
            <div className="col-span-1">
              <button 
                type="submit"
                disabled={isSubmitting || !newName || !newEmail || newPassword.length < 6}
                className="btn-slate w-full py-2.5 flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Creating...' : <><UserPlus className="w-4 h-4" /> Create User</>}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full border-collapse text-[13px] relative">
          <thead>
            <tr className="text-left sticky top-0 bg-white z-10">
              <th className="p-3 border-b border-border-theme text-text-muted font-bold uppercase tracking-wider text-[10px]">Registry Identity</th>
              <th className="p-3 border-b border-border-theme text-text-muted font-bold uppercase tracking-wider text-[10px]">Email Address</th>
              <th className="p-3 border-b border-border-theme text-text-muted font-bold uppercase tracking-wider text-[10px]">Points</th>
              <th className="p-3 border-b border-border-theme text-text-muted font-bold uppercase tracking-wider text-[10px]">System Role</th>
              <th className="p-3 border-b border-border-theme text-text-muted font-bold uppercase tracking-wider text-[10px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.uid} className="group hover:bg-slate-50 transition-colors">
                <td className="p-3 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-text-muted group-hover:bg-slate-200 transition-colors">
                       <UserIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-text-main flex items-center gap-2">
                        {u.name}
                        {u.houseId && (
                          <span className={cn(
                            "text-[9px] font-black border px-1.5 py-0.5 rounded uppercase tracking-tighter",
                            u.houseId === 'phoenix' ? "bg-red-50 text-red-500 border-red-100" :
                            u.houseId === 'pegasus' ? "bg-blue-50 text-blue-500 border-blue-100" :
                            u.houseId === 'centaur' ? "bg-green-50 text-green-500 border-green-100" :
                            "bg-purple-50 text-purple-500 border-purple-100"
                          )}>
                            {u.houseId}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-text-muted opacity-40 font-mono truncate max-w-[120px]">{u.uid}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3 border-b border-slate-50">
                   <div className="flex items-center gap-2 text-slate-500">
                      <Mail className="w-3 h-3 text-slate-300" />
                      <span className="font-medium">{u.email || 'No email registered'}</span>
                   </div>
                </td>
                <td className="p-3 border-b border-slate-50">
                  {u.role === 'student' ? (
                    <div className="flex items-center gap-2">
                       <input 
                         type="number"
                         value={u.points || 0}
                         onChange={(e) => handleUpdatePoints(u.uid, parseInt(e.target.value) || 0)}
                         className="w-16 bg-transparent hover:bg-white border-none p-1 rounded font-mono font-bold text-slate-600 focus:bg-white focus:ring-1 focus:ring-slate-300"
                       />
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-300 font-bold uppercase">N/A</span>
                  )}
                </td>
                <td className="p-3 border-b border-slate-50">
                  {editingId === u.uid ? (
                    <select 
                      value={u.role}
                      onChange={(e) => handleUpdateRole(u.uid, e.target.value as UserRole)}
                      className="bg-white border border-border-theme p-1 rounded font-bold text-[11px]"
                    >
                      <option value="admin">Admin</option>
                      <option value="teacher">Teacher</option>
                      <option value="student">Student</option>
                    </select>
                  ) : (
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                      u.role === 'admin' ? "bg-slate-dark text-white" : 
                      u.role === 'teacher' ? "bg-blue-50 text-blue-700 font-black" :
                      "bg-emerald-50 text-emerald-700 font-black"
                    )}>
                      {u.role}
                    </span>
                  )}
                </td>
                <td className="p-3 border-b border-slate-50 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setEditingId(editingId === u.uid ? null : u.uid)}
                      className="p-1.5 rounded hover:bg-slate-100 text-text-muted transition-colors"
                      title="Edit Role"
                    >
                      {editingId === u.uid ? <Check className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(u.uid)}
                      className="p-1.5 rounded hover:bg-red-50 text-red-400 transition-colors"
                      title="Delete User"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && !loading && (
          <div className="p-12 text-center">
             <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <UserIcon className="w-6 h-6" />
             </div>
             <p className="text-[13px] font-bold text-slate-400">No registry entries found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
