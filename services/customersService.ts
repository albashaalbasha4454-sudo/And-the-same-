import { db, collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, onSnapshot, orderBy } from '../firebase';
import type { Customer } from '../types';

const COLLECTION = 'customers';

export const customersService = {
  subscribe: (callback: (customers: Customer[]) => void) => {
    const q = query(collection(db, COLLECTION), orderBy('name'));
    return onSnapshot(q, (snapshot) => {
      const customers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
      callback(customers);
      localStorage.setItem(`cache_${COLLECTION}`, JSON.stringify(customers));
    }, (error) => {
      console.error(`Error subscribing to ${COLLECTION}:`, error);
      const cache = localStorage.getItem(`cache_${COLLECTION}`);
      if (cache) callback(JSON.parse(cache));
    });
  },

  add: async (customer: Omit<Customer, 'id'>): Promise<Customer> => {
    const newDocRef = doc(collection(db, COLLECTION));
    const newCustomer = { ...customer, id: newDocRef.id };
    await setDoc(newDocRef, newCustomer);
    return newCustomer;
  },

  update: async (id: string, customer: Partial<Customer>): Promise<void> => {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, customer);
  },

  delete: async (id: string): Promise<void> => {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  },

  updateBalance: async (id: string, amountChange: number): Promise<void> => {
    // In a real app use a transaction, but for this overhaul we keep it simple
    const docRef = doc(db, COLLECTION, id);
    const snapshot = await getDocs(query(collection(db, COLLECTION)));
    const current = snapshot.docs.find(d => d.id === id);
    if (current) {
        const newBalance = (current.data().balance || 0) + amountChange;
        await updateDoc(docRef, { balance: newBalance });
    }
  }
};
