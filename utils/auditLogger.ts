import { db, collection, addDoc, serverTimestamp } from '../firebase';
import { auth } from '../firebase';

export async function logAction(action: string, details: string, entityId?: string, entityType?: string) {
    if (!auth.currentUser) return;

    try {
        await addDoc(collection(db, 'auditLogs'), {
            timestamp: serverTimestamp(),
            userId: auth.currentUser.uid,
            username: auth.currentUser.displayName || auth.currentUser.email || 'unknown',
            action,
            details,
            entityId: entityId || '',
            entityType: entityType || '',
            ip: '', // Client side we don't easily get this without a third party
            checksum: '' // Could implement a checksum of the affected data
        });
    } catch (err) {
        console.error('Failed to log action:', err);
    }
}
