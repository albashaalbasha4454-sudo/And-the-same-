import { db, collection, addDoc, serverTimestamp, deleteDoc, doc } from '../firebase';
import { auth } from '../firebase';

export async function softDelete(collectionName: string, id: string, data: any) {
    if (!auth.currentUser) return;

    try {
        // 1. Move to recycle bin
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 90);

        await addDoc(collection(db, 'recycleBin'), {
            deletedAt: serverTimestamp(),
            deletedBy: auth.currentUser.uid,
            originalCollection: collectionName,
            originalId: id,
            data: data,
            expiresAt: expiresAt.toISOString()
        });

        // 2. Delete from original collection
        await deleteDoc(doc(db, collectionName, id));
        
        return true;
    } catch (err) {
        console.error('Failed to soft delete:', err);
        return false;
    }
}
