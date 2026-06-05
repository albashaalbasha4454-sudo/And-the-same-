import { db, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from '../firebase';
import type { Supplier } from '../types';

const COLLECTION_NAME = 'suppliers';

export const suppliersService = {
  subscribe: (callback: (suppliers: Supplier[]) => void) => {
    const q = query(collection(db, COLLECTION_NAME), orderBy('name', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const suppliers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier));
      callback(suppliers);
    });
  },

  add: async (supplier: Omit<Supplier, 'id'>): Promise<Supplier> => {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), supplier);
    return { id: docRef.id, ...supplier };
  },

  update: async (id: string, supplier: Partial<Supplier>) => {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, supplier);
  },

  delete: async (id: string) => {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};
