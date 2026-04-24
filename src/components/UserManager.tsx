import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut, setPersistence, inMemoryPersistence } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { User, UserRole, HOUSES } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Shield, User as UserIcon, Trash2, Edit2, Check, UserPlus, X, DatabaseZap, Mail, Lock, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import Papa from 'papaparse';

export default function UserManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('student');
  const [editHouseId, setEditHouseId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  
  // Bulk import state
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResults, setImportResults] = useState<{ success: number; errors: string[] } | null>(null);
  const [pendingImportData, setPendingImportData] = useState<any[] | null>(null);

  // New User form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('student');
  const [newHouseId, setNewHouseId] = useState<string>('phoenix');
  const [newPoints, setNewPoints] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole]);

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
        newUser.points = newPoints;
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

  const startEditing = (u: User) => {
    setEditingId(u.uid);
    setEditName(u.name);
    setEditRole(u.role);
    setEditHouseId(u.houseId);
  };

  const handleSaveEdit = async (uid: string) => {
    try {
      const updates: any = { 
        name: editName,
        role: editRole,
      };

      if (editRole === 'student') {
        updates.houseId = editHouseId || 'phoenix';
      } else {
        updates.houseId = null;
        updates.points = null;
      }

      await updateDoc(doc(db, 'users', uid), updates);
      setEditingId(null);
    } catch (err) {
      console.error("Failed to update user:", err);
      alert("Failed to save changes. Check permissions.");
    }
  };

  const downloadCSVTemplate = () => {
    const csvContent = "name,email,password,role,houseId,points\nJohn Doe,john.doe@alphabet.school,Student123,student,phoenix,0\nJane Smith,jane.smith@alphabet.school,Student456,student,pegasus,50\nAdmin User,admin@alphabet.school,Admin789,admin,,0";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "user_import_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportResults(null); // Clear previous results

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setPendingImportData(results.data);
        } else {
          alert("The CSV file seems to be empty.");
        }
        e.target.value = '';
      },
      error: (error) => {
        alert("CSV Parsing Error: " + error.message);
        e.target.value = '';
      }
    });
  };

  const processBulkImport = async (data: any[]) => {
    setPendingImportData(null);
    setIsImporting(true);
    setImportProgress({ current: 0, total: data.length });
    setImportResults({ success: 0, errors: [] });

    let successCount = 0;
    const errors: string[] = [];

    // Helper to normalize keys (strips BOM, trims, lowercase)
    const normalizeKey = (key: string) => key.replace(/^\uFEFF/, '').trim().toLowerCase();

    for (let i = 0; i < data.length; i++) {
      const rawRow = data[i];
      // Create a normalized row where keys are consistent
      const row: any = {};
      Object.keys(rawRow).forEach(key => {
        row[normalizeKey(key)] = rawRow[key];
      });

      const { name, email, password, role, houseid, points: rowPoints } = row;

      if (!name || !email || !password) {
        errors.push(`Row ${i + 1}: Missing required fields. Expected 'name', 'email', and 'password'. Found keys: ${Object.keys(row).join(', ')}`);
        setImportProgress(p => ({ ...p, current: i + 1 }));
        continue;
      }

      const startingPoints = parseInt(rowPoints) || 0;

      const validatedRole: UserRole = (role && ['admin', 'teacher', 'student'].includes(role.toLowerCase().trim())) 
        ? role.toLowerCase().trim() as UserRole 
        : 'student';

      let secondaryApp;
      try {
        const secondaryAppName = `Bulk_${Date.now()}_${i}`;
        secondaryApp = initializeApp({ ...firebaseConfig }, secondaryAppName);
        const secondaryAuth = getAuth(secondaryApp);
        
      // Ensure this auth doesn't disrupt main session
      console.log("Setting persistence for secondary app...");
      await setPersistence(secondaryAuth, inMemoryPersistence);
      
      console.log("Creating auth user...");
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password.trim());
      const authUser = userCredential.user;
      
      console.log("Saving student profile to Firestore...");
      const newUser: User = {
        uid: authUser.uid,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: validatedRole,
      };

      if (validatedRole === 'student') {
        newUser.houseId = (houseid || 'phoenix').toLowerCase().trim();
        newUser.points = startingPoints;
      }

      try {
        await setDoc(doc(db, 'users', authUser.uid), newUser);
        successCount++;
        console.log(`Successfully added student: ${email}`);
      } catch (firestoreErr: any) {
        console.error(`Firestore write failed for ${email}:`, firestoreErr);
        errors.push(`Row ${i + 1} (${email}): Firestore sync failed. ${firestoreErr.message || firestoreErr.code}`);
        // Attempt cleanup if auth was created but db sync failed
        try { await authUser.delete(); } catch(e) {}
      }
      
      await signOut(secondaryAuth);
      } catch (err: any) {
        console.error(`Bulk Error at Row ${i+1}:`, err);
        errors.push(`Row ${i + 1} (${email}): ${err.code || err.message}`);
      } finally {
        if (secondaryApp) {
          try { await deleteApp(secondaryApp); } catch (e) {}
        }
        setImportProgress(p => ({ ...p, current: i + 1 }));
      }
      
      // Delay to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setIsImporting(false);
    setImportResults({ success: successCount, errors });
    if (errors.length > 0) {
      alert(`Import Complete with Warnings. Created ${successCount} users. ${errors.length} errors occurred. Check the summary panel below.`);
    } else {
      alert(`Import Successful! All ${successCount} users created.`);
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

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentDisplayedUsers = filteredUsers.slice(startIndex, startIndex + rowsPerPage);

  const goToNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const goToPrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
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
           
           <div className="flex items-center gap-2">
             <input 
               type="file" 
               id="csv-upload" 
               accept=".csv" 
               className="hidden" 
               onChange={handleBulkCSV}
               disabled={isImporting}
             />
             <label 
               htmlFor="csv-upload"
               className={cn(
                 "btn-outline py-1.5 px-3 flex items-center gap-2 text-[12px] cursor-pointer",
                 isImporting && "opacity-50 pointer-events-none"
               )}
             >
               <DatabaseZap className="w-3.5 h-3.5 text-slate-grey" />
               Bulk Import (CSV)
             </label>

             <button 
               onClick={downloadCSVTemplate}
               className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-tight"
               title="Download Example CSV"
             >
               Get Template
             </button>

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
      </div>

      {/* CSV Confirmation Step */}
      {pendingImportData && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 bg-slate-900 rounded-2xl border border-slate-700 shadow-xl"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
              <DatabaseZap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-white font-black text-[16px] leading-tight">Confirm Bulk Import</h3>
              <p className="text-slate-400 text-[12px] font-medium">We found {pendingImportData.length} records in your CSV file.</p>
            </div>
          </div>
          <div className="bg-white/5 p-4 rounded-xl mb-4 border border-white/5">
             <p className="text-slate-300 text-[12px] leading-relaxed">
               This process will create real authentication accounts for all <strong>{pendingImportData.length}</strong> users. 
               The operation is sequential and may take a few minutes to complete safely without triggering rate limits.
             </p>
          </div>
          <div className="flex items-center gap-3">
             <button 
               onClick={() => processBulkImport(pendingImportData)}
               className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
             >
               <Check className="w-4 h-4" /> Start Importing Now
             </button>
             <button 
               onClick={() => setPendingImportData(null)}
               className="px-6 py-2.5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/5 transition-all"
             >
               Cancel
             </button>
          </div>
        </motion.div>
      )}

      {/* Bulk Import Progress Section */}
      {isImporting && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6 p-4 bg-slate-900 rounded-2xl border border-white/5 border-slate-800"
        >
          <div className="flex items-center justify-between mb-2">
             <span className="text-[12px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Processing Bulk Import...
             </span>
             <span className="text-[12px] font-mono text-slate-400">
                {importProgress.current} / {importProgress.total} Complete
             </span>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
             <div 
               className="h-full bg-emerald-500 transition-all duration-300"
               style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
             />
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-medium italic">
             Please keep this tab open until the process finishes. Creating Auth accounts sequentially to ensure stability.
          </p>
        </motion.div>
      )}

      {importResults && (
         <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           className={cn(
             "mb-6 p-4 rounded-2xl border",
             importResults.errors.length > 0 ? "bg-red-50/50 border-red-100" : "bg-emerald-50/50 border-emerald-100"
           )}
         >
           <div className="flex items-center justify-between">
              <div>
                 <h4 className={cn(
                   "text-[11px] font-black uppercase tracking-widest mb-1 flex items-center gap-2",
                   importResults.errors.length > 0 ? "text-red-600" : "text-emerald-600"
                 )}>
                   {importResults.errors.length > 0 ? <AlertCircle className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                   Import Complete: {importResults.success} Successful
                 </h4>
                 {importResults.errors.length > 0 && (
                   <p className="text-[10px] text-red-400 font-medium">{importResults.errors.length} errors occurred during processing.</p>
                 )}
              </div>
              <button 
               onClick={() => setImportResults(null)}
               className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-tighter"
             >
                Dismiss
             </button>
           </div>

           {importResults.errors.length > 0 && (
             <div className="mt-3 pt-3 border-t border-red-100">
               <div className="max-h-[120px] overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                  {importResults.errors.map((err, i) => (
                    <p key={i} className="text-[10px] font-medium text-red-500 font-mono">{err}</p>
                  ))}
               </div>
             </div>
           )}
         </motion.div>
      )}

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
          <form onSubmit={handleAddUser} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 items-end">
            <div className="col-span-1 flex flex-col gap-1 sm:gap-1.5">
              <label className="text-[9px] sm:text-[10px] font-bold text-text-muted uppercase tracking-wider">Full Name</label>
              <input 
                type="text" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. John Doe"
                required
                className="bg-white border border-border-theme p-2 rounded-lg text-[12px] sm:text-[13px] font-medium focus:ring-1 focus:ring-slate-400 focus:outline-none"
              />
            </div>
            <div className="col-span-1 flex flex-col gap-1 sm:gap-1.5">
              <label className="text-[9px] sm:text-[10px] font-bold text-text-muted uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  required
                  className="w-full bg-white border border-border-theme p-2 pl-8 rounded-lg text-[12px] sm:text-[13px] font-medium focus:ring-1 focus:ring-slate-400 focus:outline-none"
                />
                <Mail className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div className="col-span-1 flex flex-col gap-1 sm:gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[9px] sm:text-[10px] font-bold text-text-muted uppercase tracking-wider">Set Password</label>
                <p className={cn(
                  "text-[8px] sm:text-[9px] font-medium transition-colors",
                  newPassword.length > 0 && newPassword.length < 6 ? "text-red-500" : "text-slate-400"
                )}>Min. 6</p>
              </div>
              <div className="relative">
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white border border-border-theme p-2 pl-8 rounded-lg text-[12px] sm:text-[13px] font-medium focus:ring-1 focus:ring-slate-400 focus:outline-none"
                />
                <Lock className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div className="col-span-1 flex flex-col gap-1 sm:gap-1.5">
              <label className="text-[9px] sm:text-[10px] font-bold text-text-muted uppercase tracking-wider">System Role</label>
              <select 
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="bg-white border border-border-theme p-2 rounded-lg text-[12px] sm:text-[13px] font-bold"
              >
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
              </select>
            </div>
            <div className="col-span-1 flex flex-col gap-1 sm:gap-1.5">
              <label className="text-[9px] sm:text-[10px] font-bold text-text-muted uppercase tracking-wider opacity-50">House (Optional)</label>
              <select 
                value={newHouseId}
                disabled={newRole !== 'student'}
                onChange={(e) => setNewHouseId(e.target.value)}
                className="bg-white border border-border-theme p-2 rounded-lg text-[12px] sm:text-[13px] font-bold disabled:opacity-40"
              >
                {HOUSES.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
            <div className="col-span-1 flex flex-col gap-1 sm:gap-1.5">
              <label className="text-[9px] sm:text-[10px] font-bold text-text-muted uppercase tracking-wider">Points</label>
              <input 
                type="number"
                value={newPoints}
                disabled={newRole !== 'student'}
                onChange={(e) => setNewPoints(Number(e.target.value))}
                className="bg-white border border-border-theme p-2 rounded-lg text-[12px] sm:text-[13px] font-bold disabled:opacity-40"
              />
            </div>
            <div className="col-span-full lg:col-span-1 mt-2 lg:mt-0">
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
            {currentDisplayedUsers.map((u) => (
              <tr key={u.uid} className="group hover:bg-slate-50 transition-colors">
                <td className="p-3 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-text-muted group-hover:bg-slate-200 transition-colors">
                       <UserIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      {editingId === u.uid ? (
                        <div className="flex flex-col gap-1">
                          <input 
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="bg-white border border-border-theme p-1 rounded text-[13px] font-bold w-full"
                          />
                          {editRole === 'student' && (
                            <select 
                              value={editHouseId}
                              onChange={(e) => setEditHouseId(e.target.value)}
                              className="bg-white border border-border-theme p-1 rounded text-[10px] font-bold uppercase"
                            >
                              {HOUSES.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                            </select>
                          )}
                        </div>
                      ) : (
                        <>
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
                        </>
                      )}
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
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as UserRole)}
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
                  <div className="flex items-center justify-end gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
                    {editingId === u.uid ? (
                      <button 
                        onClick={() => handleSaveEdit(u.uid)}
                        className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600 transition-colors"
                        title="Save Changes"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => startEditing(u)}
                        className="p-1.5 rounded hover:bg-slate-100 text-text-muted transition-colors"
                        title="Edit Profile"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteUser(u.uid)}
                      className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"
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

      {/* Pagination Controls */}
      {filteredUsers.length > rowsPerPage && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Showing {startIndex + 1}-{Math.min(startIndex + rowsPerPage, filteredUsers.length)} of {filteredUsers.length} users
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrev}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                // Show first, last, and a few around current page
                const isFirst = pageNum === 1;
                const isLast = pageNum === totalPages;
                const isNearCurrent = Math.abs(pageNum - currentPage) <= 1;

                if (!isFirst && !isLast && !isNearCurrent) {
                  if (pageNum === 2 || pageNum === totalPages - 1) {
                    return <span key={pageNum} className="px-1 text-slate-300">...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      "w-7 h-7 rounded-md text-[11px] font-black transition-all",
                      currentPage === pageNum 
                        ? "bg-slate-900 text-white shadow-sm" 
                        : "text-slate-400 hover:bg-slate-100"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={goToNext}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
