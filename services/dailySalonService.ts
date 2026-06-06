import { db, collection, doc, setDoc, updateDoc, deleteDoc, query, onSnapshot, orderBy } from '../firebase';
import type { Poem, DailyTask, ReadingProgress } from '../types';

const POEMS_COLL = 'poems';
const TASKS_COLL = 'dailyTasks';
const PROGRESS_COLL = 'readingProgress';

export const dailySalonService = {
  // --- POEMS SERVICE ---
  subscribePoems: (callback: (poems: Poem[]) => void) => {
    const q = query(collection(db, POEMS_COLL), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const poems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Poem));
      callback(poems);
      localStorage.setItem(`cache_${POEMS_COLL}`, JSON.stringify(poems));
    }, (error) => {
      console.error(`Error subscribing to ${POEMS_COLL}:`, error);
      const cache = localStorage.getItem(`cache_${POEMS_COLL}`);
      if (cache) callback(JSON.parse(cache));
    });
  },

  addPoem: async (poem: Omit<Poem, 'id'>): Promise<Poem> => {
    const newDocRef = doc(collection(db, POEMS_COLL));
    const newPoem = { ...poem, id: newDocRef.id };
    await setDoc(newDocRef, newPoem);
    return newPoem;
  },

  updatePoem: async (id: string, poem: Partial<Poem>): Promise<void> => {
    const docRef = doc(db, POEMS_COLL, id);
    await updateDoc(docRef, poem);
  },

  deletePoem: async (id: string): Promise<void> => {
    const docRef = doc(db, POEMS_COLL, id);
    await deleteDoc(docRef);
  },

  // --- DAILY TASKS SERVICE ---
  subscribeTasks: (callback: (tasks: DailyTask[]) => void) => {
    const q = query(collection(db, TASKS_COLL), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyTask));
      callback(tasks);
      localStorage.setItem(`cache_${TASKS_COLL}`, JSON.stringify(tasks));
    }, (error) => {
      console.error(`Error subscribing to ${TASKS_COLL}:`, error);
      const cache = localStorage.getItem(`cache_${TASKS_COLL}`);
      if (cache) callback(JSON.parse(cache));
    });
  },

  addTask: async (task: Omit<DailyTask, 'id'>): Promise<DailyTask> => {
    const newDocRef = doc(collection(db, TASKS_COLL));
    const newTask = { ...task, id: newDocRef.id };
    await setDoc(newDocRef, newTask);
    return newTask;
  },

  updateTask: async (id: string, task: Partial<DailyTask>): Promise<void> => {
    const docRef = doc(db, TASKS_COLL, id);
    await updateDoc(docRef, task);
  },

  deleteTask: async (id: string): Promise<void> => {
    const docRef = doc(db, TASKS_COLL, id);
    await deleteDoc(docRef);
  },

  // --- READING PROGRESS SERVICE ---
  subscribeProgress: (callback: (progress: ReadingProgress[]) => void) => {
    const q = query(collection(db, PROGRESS_COLL), orderBy('lastReadDate', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const progress = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReadingProgress));
      callback(progress);
      localStorage.setItem(`cache_${PROGRESS_COLL}`, JSON.stringify(progress));
    }, (error) => {
      console.error(`Error subscribing to ${PROGRESS_COLL}:`, error);
      const cache = localStorage.getItem(`cache_${PROGRESS_COLL}`);
      if (cache) callback(JSON.parse(cache));
    });
  },

  addProgress: async (progress: Omit<ReadingProgress, 'id'>): Promise<ReadingProgress> => {
    const newDocRef = doc(collection(db, PROGRESS_COLL));
    const newProgress = { ...progress, id: newDocRef.id };
    await setDoc(newDocRef, newProgress);
    return newProgress;
  },

  updateProgress: async (id: string, progress: Partial<ReadingProgress>): Promise<void> => {
    const docRef = doc(db, PROGRESS_COLL, id);
    await updateDoc(docRef, progress);
  },

  deleteProgress: async (id: string): Promise<void> => {
    const docRef = doc(db, PROGRESS_COLL, id);
    await deleteDoc(docRef);
  }
};
