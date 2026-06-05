import React, { useState, useEffect } from 'react';
import { db, collection, query, orderBy, onSnapshot, deleteDoc, doc, addDoc, serverTimestamp, handleFirestoreError, OperationType } from '../firebase';
import { logAction } from '../utils/auditLogger';

import { useFirebase } from './FirebaseProvider';

export const RecycleBinView: React.FC = () => {
    const { isAdmin: isFbAdmin, loading: fbLoading } = useFirebase();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (fbLoading || !isFbAdmin) return;

        const path = 'recycleBin';
        const q = query(collection(db, path), orderBy('deletedAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => {
            handleFirestoreError(error, OperationType.LIST, path);
        });
        return unsubscribe;
    }, [isFbAdmin, fbLoading]);

    const handleRestore = async (item: any) => {
        if (!window.confirm('هل تريد استعادة هذا العنصر؟')) return;
        setLoading(true);
        try {
            // 1. Restore to original collection
            const { id, deletedAt, deletedBy, originalCollection, originalId, data, expiresAt, ...rest } = item;
            try {
                await addDoc(collection(db, originalCollection), {
                    ...data,
                    restoredAt: serverTimestamp()
                });
            } catch (error) {
                handleFirestoreError(error, OperationType.CREATE, originalCollection);
            }

            // 2. Delete from recycle bin
            try {
                await deleteDoc(doc(db, 'recycleBin', item.id));
            } catch (error) {
                handleFirestoreError(error, OperationType.DELETE, `recycleBin/${item.id}`);
            }
            
            await logAction('RESTORE', `Restored ${originalCollection} with ID ${originalId}`);
            alert('تمت استعادة العنصر بنجاح.');
        } catch (err) {
            console.error(err);
            alert('فشل استعادة العنصر.');
        } finally {
            setLoading(false);
        }
    };

    const handlePermanentDelete = async (item: any) => {
        if (!window.confirm('سيتم حذف هذا العنصر نهائياً. هل أنت متأكد؟')) return;
        setLoading(true);
        try {
            await deleteDoc(doc(db, 'recycleBin', item.id));
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, `recycleBin/${item.id}`);
        }
        try {
            await logAction('PERMANENT_DELETE', `Permanently deleted ${item.originalCollection} with original ID ${item.originalId}`);
            alert('تم الحذف النهائي.');
        } catch (err) {
            console.error(err);
            alert('فشل الحذف النهائي.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">سلة المهملات</h1>
                <p className="text-slate-500">العناصر المحذوفة مؤقتاً (تبقى لمدة 90 يوماً)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map(item => {
                    const daysLeft = Math.ceil((new Date(item.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    
                    return (
                        <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-slate-300 transition-all">
                            <div className="p-4 border-b border-slate-50 bg-slate-50 flex justify-between items-center">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    item.originalCollection === 'products' ? 'bg-indigo-100 text-indigo-700' :
                                    'bg-slate-200 text-slate-700'
                                }`}>
                                    {item.originalCollection}
                                </span>
                                <span className="text-xs text-slate-400 font-mono">ID: {item.originalId.slice(0, 8)}</span>
                            </div>
                            
                            <div className="p-5 flex-1">
                                <p className="font-bold text-slate-800 mb-2 truncate">
                                    {item.data.name || item.data.description || 'بدون اسم'}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                                    حُذف في: {item.deletedAt?.toDate?.()?.toLocaleDateString('ar-EG')}
                                </div>
                            </div>
                            
                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleRestore(item)}
                                        disabled={loading}
                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        title="استعادة"
                                    >
                                        <span className="material-symbols-outlined">restore</span>
                                    </button>
                                    <button
                                        onClick={() => handlePermanentDelete(item)}
                                        disabled={loading}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="حذف نهائي"
                                    >
                                        <span className="material-symbols-outlined">delete_forever</span>
                                    </button>
                                </div>
                                <div className={`text-xs font-bold ${daysLeft < 10 ? 'text-red-500 animate-pulse' : 'text-orange-500'}`}>
                                    باقي {daysLeft} يوم
                                </div>
                            </div>
                        </div>
                    );
                })}

                {items.length === 0 && (
                    <div className="col-span-full py-20 text-center text-slate-400">
                        <span className="material-symbols-outlined text-6xl block mb-4">delete_outline</span>
                        <p className="text-lg">سلة المهملات فارغة</p>
                    </div>
                )}
            </div>
        </div>
    );
};
