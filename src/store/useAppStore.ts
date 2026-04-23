import { create } from 'zustand';
import { TrajectoryPoint } from '../lib/engine';
import { EventType } from '../constants';
import { db, auth } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

interface AppEvent {
  id: string;
  type: EventType;
  description: string;
  lat: number;
  lng: number;
  icf_score: number;
  timestamp: number;
  status: 'pending' | 'validated' | 'resolved';
  userId: string;
  hash_chain: string;
}

interface UserReputation {
  level: number;
  score: number;
  title: 'Observador' | 'Validador' | 'Sentinel';
}

interface AppState {
  trajectory: TrajectoryPoint[];
  events: AppEvent[];
  reputation: UserReputation;
  addTrajectoryPoint: (point: TrajectoryPoint) => void;
  addEvent: (event: Omit<AppEvent, 'id' | 'userId'>) => Promise<void>;
  updateReputation: (delta: number) => void;
  clearTrajectory: () => void;
  syncEvents: () => () => void;
  syncUser: () => () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  trajectory: [],
  events: [],
  reputation: {
    level: 1,
    score: 0,
    title: 'Observador',
  },
  addTrajectoryPoint: (point) => 
    set((state) => ({ trajectory: [...state.trajectory, point] })),
  
  addEvent: async (eventData) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const eventWithUser = { ...eventData, userId: user.uid };
      const docRef = await addDoc(collection(db, 'events'), eventWithUser);
      
      // Update local reputation after ledger write
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        score: increment(eventData.icf_score > 0.7 ? 10 : 2),
        level: get().reputation.score > 30 ? 2 : 1,
        title: get().reputation.score > 100 ? 'Sentinel' : (get().reputation.score > 30 ? 'Validador' : 'Observador')
      }, { merge: true });

    } catch (err) {
      console.error('Ledger Write Error:', err);
    }
  },

  updateReputation: (delta) => {
    // Handled by addEvent in the ledger context
  },

  clearTrajectory: () => set({ trajectory: [] }),

  // New: Listen to the ledger
  syncEvents: () => {
    const q = query(collection(db, 'events'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppEvent));
      set({ events });
    });
  },

  syncUser: () => {
    const user = auth.currentUser;
    if (!user) return () => {};
    
    return onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
         set({ reputation: doc.data() as any });
      }
    });
  }
}));
