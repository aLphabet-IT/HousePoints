import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit, doc, increment, writeBatch, serverTimestamp, setDoc, where, getDocs, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { House, PointLog, User, HOUSES, PointReason, PointCategory } from '../types';
import { handleFirestoreError } from '../lib/utils';

export interface SystemConfig {
  academicYear: string;
  lastResetAt?: number;
  resetBy?: string;
}

export function useSystemConfig() {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'system', 'config');
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setConfig(snapshot.data() as SystemConfig);
      } else {
        setConfig({ academicYear: new Date().getFullYear().toString() });
      }
      setLoading(false);
    });
  }, []);

  return { config, loading };
}

export async function updateAcademicYear(year: string, adminName: string) {
  try {
    const docRef = doc(db, 'system', 'config');
    await setDoc(docRef, {
      academicYear: year,
      updatedAt: Date.now(),
      updatedBy: adminName
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, 'update', 'system/config');
  }
}

export async function performSystemReset(newYear: string, currentAdminUid: string, adminName: string, currentYear: string) {
  try {
    const batch = writeBatch(db);

    // 1. Archive Current Year House Stats
    const housesSnap = await getDocs(collection(db, 'houses'));
    const houseStats: Record<string, number> = {};
    housesSnap.forEach(h => {
      houseStats[h.id] = h.data().totalPoints || 0;
    });

    const archiveRef = doc(db, 'academicYears', currentYear);
    batch.set(archiveRef, {
      id: currentYear,
      name: currentYear,
      endDate: Date.now(),
      houseStats,
      archivedBy: adminName
    });

    // 2. Update System Config
    const configRef = doc(db, 'system', 'config');
    batch.set(configRef, {
      academicYear: newYear,
      lastResetAt: Date.now(),
      resetBy: adminName
    }, { merge: true });

    // 3. Reset Houses
    housesSnap.forEach(h => {
      batch.update(h.ref, { totalPoints: 0, lastUpdated: Date.now() });
    });

    // 4. Reset Student Points (Archive historical points in logs, but zero out profile)
    // We don't delete users anymore. We just reset their points.
    const usersSnap = await getDocs(collection(db, 'users'));
    usersSnap.forEach(u => {
      if (u.data().role === 'student' || u.id === currentAdminUid) {
        batch.update(u.ref, { points: 0 });
      }
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, 'write', 'System Reset');
    throw error;
  }
}

export function usePointReasons() {
  const [reasons, setReasons] = useState<PointReason[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'pointReasons'), orderBy('label', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const reasonsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as PointReason));
      setReasons(reasonsData);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error in usePointReasons:", error);
      setLoading(false);
    });
  }, []);

  return { reasons, loading };
}

export async function addPointReason(label: string, points: number, category: PointCategory) {
  try {
    const docRef = doc(collection(db, 'pointReasons'));
    await setDoc(docRef, {
      id: docRef.id,
      label,
      points,
      category
    });
  } catch (error) {
    handleFirestoreError(error, 'create', 'pointReasons');
  }
}

export async function updatePointReason(id: string, label: string, points: number, category: PointCategory) {
  try {
    await setDoc(doc(db, 'pointReasons', id), {
      id,
      label,
      points,
      category
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, 'update', `pointReasons/${id}`);
  }
}

export async function deletePointReason(id: string) {
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'pointReasons', id));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, 'delete', `pointReasons/${id}`);
  }
}

export function useHouses() {
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'houses'), orderBy('totalPoints', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const housesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as House));
      
      // Explicitly sort local data by points DESC to guarantee rank accuracy
      const sortedByPoints = [...housesData].sort((a, b) => b.totalPoints - a.totalPoints);

      // Calculate dynamic rank based on sorted points (handling ties)
      let currentRank = 1;
      const rankedHouses = sortedByPoints.map((house, index) => {
        if (index > 0 && house.totalPoints < sortedByPoints[index - 1].totalPoints) {
          currentRank = index + 1;
        }
        return {
          ...house,
          rank: currentRank
        };
      });
      
      // Only attempt initialization if houses are truly empty
      if (rankedHouses.length === 0 && houses.length === 0 && auth.currentUser) {
        HOUSES.forEach(async (h, index) => {
          try {
            await setDoc(doc(db, 'houses', h.id), {
              id: h.id,
              name: h.name,
              totalPoints: 0,
              rank: index + 1,
              lastUpdated: Date.now()
            });
          } catch (e) {
            console.warn("Could not initialize house (likely permission issue):", h.id);
          }
        });
      }

      setHouses(rankedHouses);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error in useHouses:", error);
      setLoading(false);
    });
  }, []);

  return { houses, loading };
}

export function useLogs(limitOrYear: string | number = 20, possibleLimit: number = 20) {
  const [logs, setLogs] = useState<PointLog[]>([]);
  const [loading, setLoading] = useState(true);

  const logsLimit = typeof limitOrYear === 'number' ? limitOrYear : possibleLimit;
  const academicYear = typeof limitOrYear === 'string' ? limitOrYear : undefined;

  useEffect(() => {
    // We avoid composite index by fetching all logs and filtering client-side if academicYear is provided.
    const q = query(collection(db, 'pointsLog'), orderBy('timestamp', 'desc'), limit(academicYear ? 100 : logsLimit));
    
    return onSnapshot(q, (snapshot) => {
      let logsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as PointLog));
      
      if (academicYear) {
        logsData = logsData.filter(l => l.academicYear === academicYear).slice(0, logsLimit);
      }

      setLogs(logsData);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error in useLogs:", error);
      setLoading(false);
    });
  }, [logsLimit, academicYear]);

  return { logs, loading };
}

export function useStudents(studentsLimit = 10) {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Reverting to client-side filtering for role to avoid composite index (where + orderBy)
    const q = query(
      collection(db, 'users'), 
      orderBy('points', 'desc'), 
      limit(studentsLimit * 2) // Fetch more to ensure we get enough students
    );
    return onSnapshot(q, (snapshot) => {
      const studentsData = snapshot.docs
        .map(doc => ({ ...doc.data(), uid: doc.id } as User))
        .filter(u => u.role === 'student')
        .slice(0, studentsLimit);
        
      setStudents(studentsData);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error in useStudents:", error);
      setLoading(false);
    });
  }, [studentsLimit]);

  return { students, loading };
}

export function useNeedsBoostStudents(studentsLimit = 10) {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Reverting to client-side filtering for role to avoid composite index (where + orderBy)
    const q = query(
      collection(db, 'users'), 
      orderBy('points', 'asc'), 
      limit(studentsLimit * 3) // Fetch more to find enough students
    );
    return onSnapshot(q, (snapshot) => {
      const studentsData = snapshot.docs
        .map(doc => ({ ...doc.data(), uid: doc.id } as User))
        .filter(u => u.role === 'student')
        .slice(0, studentsLimit);
        
      setStudents(studentsData);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error in useNeedsBoostStudents:", error);
      setLoading(false);
    });
  }, [studentsLimit]);

  return { students, loading };
}


export async function addPoints(academicYear: string, houseId: string, points: number, reason: string, category: string, awardedBy: string, awardedByUid: string, role: string) {
  try {
    const batch = writeBatch(db);
    
    const houseRef = doc(db, 'houses', houseId);
    batch.update(houseRef, {
      totalPoints: increment(points),
      lastUpdated: Date.now()
    });

    const logRef = doc(collection(db, 'pointsLog'));
    batch.set(logRef, {
      academicYear,
      houseId,
      points,
      reason,
      category,
      awardedBy,
      awardedByUid,
      role,
      timestamp: serverTimestamp()
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, 'write', `houses/${houseId} + pointsLog`);
  }
}

export async function awardPointsToStudent(
  academicYear: string,
  studentId: string, 
  studentName: string,
  houseId: string, 
  points: number, 
  reason: string, 
  category: string, 
  awardedBy: string, 
  awardedByUid: string, 
  role: string
) {
  try {
    const batch = writeBatch(db);
    
    const houseRef = doc(db, 'houses', houseId);
    batch.update(houseRef, {
      totalPoints: increment(points),
      lastUpdated: Date.now()
    });

    const studentRef = doc(db, 'users', studentId);
    batch.update(studentRef, {
      points: increment(points)
    });

    const logRef = doc(collection(db, 'pointsLog'));
    batch.set(logRef, {
      academicYear,
      houseId,
      points,
      reason,
      category,
      awardedBy,
      awardedByUid,
      targetUid: studentId,
      targetName: studentName,
      role,
      timestamp: serverTimestamp()
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, 'write', `houses/${houseId} + users/${studentId} + pointsLog`);
  }
}

export function useUserCount(role?: string) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = role 
      ? query(collection(db, 'users'), where('role', '==', role))
      : query(collection(db, 'users'));
      
    return onSnapshot(q, (snapshot) => {
      setCount(snapshot.size);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error in useUserCount:", error);
      setLoading(false);
    });
  }, [role]);

  return { count, loading };
}

export function useAllUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('name', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as User));
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error in useAllUsers:", error);
      setLoading(false);
    });
  }, []);

  return { users, loading };
}
