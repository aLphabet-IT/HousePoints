import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit, doc, increment, writeBatch, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { House, PointLog, User, HOUSES } from '../types';

export function useHouses() {
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'houses'), orderBy('totalPoints', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const housesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as House));
      
      // Only attempt initialization if houses are truly empty and user is logged in
      if (housesData.length === 0 && houses.length === 0 && auth.currentUser) {
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

      setHouses(housesData);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error in useHouses:", error);
      setLoading(false);
    });
  }, []);

  return { houses, loading };
}

export function useLogs(logsLimit = 20) {
  const [logs, setLogs] = useState<PointLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'pointsLog'), orderBy('timestamp', 'desc'), limit(logsLimit));
    return onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as PointLog));
      setLogs(logsData);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error in useLogs:", error);
      setLoading(false);
    });
  }, [logsLimit]);

  return { logs, loading };
}

export function useStudents(studentsLimit = 10) {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Note: We're filtering by role 'student' and ordering by points
    const q = query(
      collection(db, 'users'), 
      orderBy('points', 'desc'), 
      limit(studentsLimit)
    );
    return onSnapshot(q, (snapshot) => {
      const studentsData = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as User));
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
    // Ordering by points ASC for 'Needs a Boost'
    const q = query(
      collection(db, 'users'), 
      where('role', '==', 'student'),
      orderBy('points', 'asc'), 
      limit(studentsLimit)
    );
    return onSnapshot(q, (snapshot) => {
      const studentsData = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as User));
      setStudents(studentsData);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error in useNeedsBoostStudents:", error);
      setLoading(false);
    });
  }, [studentsLimit]);

  return { students, loading };
}

export async function addPoints(houseId: string, points: number, reason: string, category: string, awardedBy: string, awardedByUid: string, role: string) {
  const batch = writeBatch(db);
  
  const houseRef = doc(db, 'houses', houseId);
  batch.update(houseRef, {
    totalPoints: increment(points),
    lastUpdated: Date.now()
  });

  const logRef = doc(collection(db, 'pointsLog'));
  batch.set(logRef, {
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
}

export async function awardPointsToStudent(
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
