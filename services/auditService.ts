import { db, collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot } from '../firebase';

export interface AuditLog {
  id?: string;
  action: string;
  details: string;
  timestamp: any;
  userId?: string;
  username?: string;
  relatedId?: string;
  relatedType?: string;
}

export const auditService = {
  log: async (log: Omit<AuditLog, 'timestamp'>) => {
    try {
      await addDoc(collection(db, 'auditLogs'), {
        ...log,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Failed to log action:', error);
    }
  },

  subscribe: (callback: (logs: AuditLog[]) => void) => {
    const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(100));
    return onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
      callback(logs);
    });
  }
};
