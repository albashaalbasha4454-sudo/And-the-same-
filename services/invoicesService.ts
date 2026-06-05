import { db, collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, onSnapshot, orderBy, limit } from '../firebase';
import type { Invoice } from '../types';

const COLLECTION = 'invoices';

export const invoicesService = {
  subscribe: (callback: (invoices: Invoice[]) => void) => {
    const q = query(collection(db, COLLECTION), orderBy('date', 'desc'), limit(1000));
    return onSnapshot(q, (snapshot) => {
      const invoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
      callback(invoices);
      localStorage.setItem(`cache_${COLLECTION}`, JSON.stringify(invoices));
    }, (error) => {
      console.error(`Error subscribing to ${COLLECTION}:`, error);
      const cache = localStorage.getItem(`cache_${COLLECTION}`);
      if (cache) callback(JSON.parse(cache));
    });
  },

  add: async (invoice: Omit<Invoice, 'id'>): Promise<Invoice> => {
    const newDocRef = doc(collection(db, COLLECTION));
    const newInvoice = { ...invoice, id: newDocRef.id };
    await setDoc(newDocRef, newInvoice);
    return newInvoice;
  },

  updateStatus: async (id: string, status: string, paymentStatus?: string, paidDate?: string): Promise<void> => {
    const docRef = doc(db, COLLECTION, id);
    const update: any = { status };
    if (paymentStatus) update.paymentStatus = paymentStatus;
    if (paidDate) update.paidDate = paidDate;
    await updateDoc(docRef, update);
  },

  getById: async (id: string): Promise<Invoice | null> => {
    const docRef = doc(db, COLLECTION, id);
    const snapshot = await getDocs(query(collection(db, COLLECTION)));
    const docSnap = snapshot.docs.find(d => d.id === id);
    return docSnap ? (docSnap.data() as Invoice) : null;
  }
};
