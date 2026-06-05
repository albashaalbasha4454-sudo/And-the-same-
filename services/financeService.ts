import { db, collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, onSnapshot, orderBy, limit } from '../firebase';
import type { FinancialAccount, FinancialTransaction, Expense } from '../types';

export const financeService = {
  subscribeAccounts: (callback: (accounts: FinancialAccount[]) => void) => {
    const q = query(collection(db, 'financialAccounts'), orderBy('name'));
    return onSnapshot(q, (snapshot) => {
      const accounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancialAccount));
      callback(accounts);
      localStorage.setItem('cache_financialAccounts', JSON.stringify(accounts));
    });
  },

  subscribeTransactions: (callback: (transactions: FinancialTransaction[]) => void) => {
    const q = query(collection(db, 'financialTransactions'), orderBy('date', 'desc'), limit(1000));
    return onSnapshot(q, (snapshot) => {
      const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancialTransaction));
      callback(transactions);
      localStorage.setItem('cache_financialTransactions', JSON.stringify(transactions));
    });
  },

  subscribeExpenses: (callback: (expenses: Expense[]) => void) => {
    const q = query(collection(db, 'expenses'), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      callback(expenses);
      localStorage.setItem('cache_expenses', JSON.stringify(expenses));
    });
  },

  addAccount: async (account: Omit<FinancialAccount, 'id'>): Promise<FinancialAccount> => {
    const newDocRef = doc(collection(db, 'financialAccounts'));
    const newAccount = { ...account, id: newDocRef.id };
    await setDoc(newDocRef, newAccount);
    return newAccount;
  },

  addTransaction: async (tx: Omit<FinancialTransaction, 'id' | 'date'>): Promise<FinancialTransaction> => {
    const newDocRef = doc(collection(db, 'financialTransactions'));
    const newTx = { ...tx, id: newDocRef.id, date: new Date().toISOString() };
    await setDoc(newDocRef, newTx);
    return newTx as FinancialTransaction;
  },

  addExpense: async (expense: Omit<Expense, 'id'>): Promise<Expense> => {
    const newDocRef = doc(collection(db, 'expenses'));
    const newExpense = { ...expense, id: newDocRef.id };
    await setDoc(newDocRef, newExpense);
    return newExpense;
  },

  deleteExpense: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'expenses', id));
  }
};
