import { db, collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, onSnapshot, orderBy, where } from '../firebase';
import type { User } from '../types';

const COLLECTION = 'users';

export const usersService = {
  subscribe: (callback: (users: User[]) => void) => {
    const q = query(collection(db, COLLECTION), orderBy('username'));
    return onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      callback(users);
    });
  },

  getByEmail: async (email: string): Promise<User | null> => {
    const q = query(collection(db, COLLECTION), where('email', '==', email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as User;
  },

  add: async (user: Omit<User, 'id'>): Promise<User> => {
    const newDocRef = doc(collection(db, COLLECTION));
    const newUser = { ...user, id: newDocRef.id };
    await setDoc(newDocRef, newUser);
    return newUser;
  },

  update: async (id: string, user: Partial<User>): Promise<void> => {
    await updateDoc(doc(db, COLLECTION, id), user);
  },

  delete: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTION, id));
  }
};
