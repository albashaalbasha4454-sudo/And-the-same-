import React, { useState, useEffect } from 'react';
import { db, collection, query, orderBy, limit, onSnapshot, where, handleFirestoreError, OperationType } from '../firebase';

import { useFirebase } from './FirebaseProvider';

export const AuditLogView: React.FC = () => {
    const { isAdmin: isFbAdmin, loading: fbLoading } = useFirebase();
    const [logs, setLogs] = useState<any[]>([]);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        if (fbLoading || !isFbAdmin) return;

        const path = 'auditLogs';
        const q = query(collection(db, path), orderBy('timestamp', 'desc'), limit(50));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => {
            handleFirestoreError(error, OperationType.LIST, path);
        });
        return unsubscribe;
    }, [isFbAdmin, fbLoading]);

    const filteredLogs = logs.filter(log => 
        log.action.toLowerCase().includes(filter.toLowerCase()) ||
        log.details.toLowerCase().includes(filter.toLowerCase()) ||
        log.username.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">سجل التدقيق (Audit Log)</h1>
                    <p className="text-slate-500">مراقبة جميع التحركات والعمليات في النظام</p>
                </div>
                <div className="w-full md:w-64 relative">
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input
                        type="text"
                        placeholder="بحث في السجلات..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full pr-10 pl-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                                <th className="p-4 border-b">الوقت</th>
                                <th className="p-4 border-b">المستخدم</th>
                                <th className="p-4 border-b">العملية</th>
                                <th className="p-4 border-b">التفاصيل</th>
                                <th className="p-4 border-b">EntityType</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {filteredLogs.map(log => (
                                <tr key={log.id} className="border-b hover:bg-slate-50 transition-colors">
                                    <td className="p-4 text-slate-500 whitespace-nowrap">
                                        {log.timestamp?.toDate?.()?.toLocaleString('ar-EG')}
                                    </td>
                                    <td className="p-4 font-bold text-slate-700">{log.username}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            log.action.includes('RESET') ? 'bg-red-100 text-red-700' :
                                            log.action.includes('DELETE') ? 'bg-orange-100 text-orange-700' :
                                            log.action.includes('CREATE') ? 'bg-green-100 text-green-700' :
                                            'bg-slate-100 text-slate-700'
                                        }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-600 max-w-xs truncate" title={log.details}>
                                        {log.details}
                                    </td>
                                    <td className="p-4 text-slate-400 italic">
                                        {log.entityType || '-'}
                                    </td>
                                </tr>
                            ))}
                            {filteredLogs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-400">
                                        <span className="material-symbols-outlined text-4xl block mb-2">history</span>
                                        لا توجد سجلات مطابقة للبحث
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
