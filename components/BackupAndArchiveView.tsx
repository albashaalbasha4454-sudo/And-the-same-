import React, { useState, useEffect } from 'react';
import { db, collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, getDocs, handleFirestoreError, OperationType } from '../firebase';
import { logAction } from '../utils/auditLogger';

import { useFirebase } from './FirebaseProvider';

export const BackupAndArchiveView: React.FC = () => {
    const { isAdmin: isFbAdmin, loading: fbLoading } = useFirebase();
    const [backups, setBackups] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (fbLoading || !isFbAdmin) return;

        const path = 'backups';
        const q = query(collection(db, path), orderBy('timestamp', 'desc'), limit(10));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setBackups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => {
            handleFirestoreError(error, OperationType.LIST, path);
        });
        return unsubscribe;
    }, [isFbAdmin, fbLoading]);

    const handleManualBackup = async () => {
        setLoading(true);
        try {
            // Logic to collect all data for backup
            const collections = ['products', 'invoices', 'customers', 'suppliers', 'expenses', 'transactions', 'accounts'];
            const backupData: any = {};
            
            for (const coll of collections) {
                try {
                    const snap = await getDocs(collection(db, coll));
                    backupData[coll] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                } catch (error) {
                    handleFirestoreError(error, OperationType.LIST, coll);
                }
            }

            const jsonString = JSON.stringify(backupData);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // Download as file
            const a = document.createElement('a');
            a.href = url;
            a.download = `melent_backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();

            // Log in DB correctly
            await addDoc(collection(db, 'backups'), {
                timestamp: serverTimestamp(),
                type: 'full',
                performedBy: 'user', // should get from auth
                fileSize: blob.size,
                status: 'success',
                note: 'Manual JSON export'
            });

            await logAction('BACKUP_CREATED', `Manual backup created. Size: ${(blob.size / 1024).toFixed(2)} KB`);
            alert('تم إنشاء النسخة الاحتياطية وتنزيلها بنجاح.');
        } catch (err) {
            console.error(err);
            alert('فشل إنشاء النسخة الاحتياطية.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">إدارة النسخ الاحتياطي والأرشفة</h1>
                    <p className="text-slate-500">تأمين البيانات وضمان استمرارية العمل</p>
                </div>
                <button
                    onClick={handleManualBackup}
                    disabled={loading}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
                >
                    <span className="material-symbols-outlined">backup</span>
                    {loading ? 'جاري النسخ...' : 'بدء نسخة احتياطية فورية'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                            <span className="material-symbols-outlined">check_circle</span>
                        </div>
                        <h3 className="font-bold text-slate-700">حالة النسخ اليومي</h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-2">آخر نسخة ناجحة:</p>
                    <p className="font-mono text-indigo-600 font-bold">
                        {backups[0]?.timestamp?.toDate?.()?.toLocaleString('ar-EG') || 'لا يوجد'}
                    </p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <span className="material-symbols-outlined">storage</span>
                        </div>
                        <h3 className="font-bold text-slate-700">حجم البيانات</h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-2">إجمالي النسخ المخزنة:</p>
                    <p className="font-mono text-indigo-600 font-bold">{backups.length} سجلات</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                            <span className="material-symbols-outlined">auto_delete</span>
                        </div>
                        <h3 className="font-bold text-slate-700">سياسة الأرشفة</h3>
                    </div>
                    <p className="text-sm text-slate-500">حذف تلقائي لسلة المهملات:</p>
                    <p className="font-bold text-slate-700">بعد 90 يوماً</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-700">سجل العمليات الأخير</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse text-sm">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500">
                                <th className="p-4 border-b">التاريخ</th>
                                <th className="p-4 border-b">النوع</th>
                                <th className="p-4 border-b">حجم الملف</th>
                                <th className="p-4 border-b">الحالة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {backups.map(backup => (
                                <tr key={backup.id} className="border-b hover:bg-slate-50 transition-colors">
                                    <td className="p-4 text-slate-600">
                                        {backup.timestamp?.toDate?.()?.toLocaleString('ar-EG')}
                                    </td>
                                    <td className="p-4 font-medium text-slate-800 capitalize">{backup.type}</td>
                                    <td className="p-4 text-slate-600">{(backup.fileSize / 1024).toFixed(2)} KB</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            backup.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {backup.status === 'success' ? 'نجاح' : 'فشل'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {backups.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-400">لا توجد سجلات حالياً</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
