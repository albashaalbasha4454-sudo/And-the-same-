import { db, collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, onSnapshot, orderBy } from '../firebase';
import type { Product } from '../types';

const COLLECTION = 'products';

export const productsService = {
  subscribe: (callback: (products: Product[]) => void) => {
    const q = query(collection(db, COLLECTION), orderBy('name'));
    return onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      callback(products);
      // Cache to localStorage
      localStorage.setItem(`cache_${COLLECTION}`, JSON.stringify(products));
    }, (error) => {
      console.error(`Error subscribing to ${COLLECTION}:`, error);
      // Fallback to cache
      const cache = localStorage.getItem(`cache_${COLLECTION}`);
      if (cache) callback(JSON.parse(cache));
    });
  },

  getAll: async (): Promise<Product[]> => {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    } catch (error) {
      console.error(`Error getting all ${COLLECTION}:`, error);
      const cache = localStorage.getItem(`cache_${COLLECTION}`);
      return cache ? JSON.parse(cache) : [];
    }
  },

  add: async (product: Omit<Product, 'id'>): Promise<Product> => {
    const newDocRef = doc(collection(db, COLLECTION));
    const newProduct = { ...product, id: newDocRef.id };
    await setDoc(newDocRef, newProduct);
    return newProduct;
  },

  update: async (id: string, product: Partial<Product>): Promise<void> => {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, product);
  },

  delete: async (id: string): Promise<void> => {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  },

  batchUpdate: async (updates: { id: string, data: Partial<Product> }[]): Promise<void> => {
    // Basic implementation without formal batch for simplicity, 
    // but in a real app use writeBatch or just sequential updates if small enough
    await Promise.all(updates.map(u => updateDoc(doc(db, COLLECTION, u.id), u.data)));
  }
};
