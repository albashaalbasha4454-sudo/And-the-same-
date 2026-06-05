import React, { useState, useEffect } from 'react';
import { db, collection, addDoc, serverTimestamp, query, where, onSnapshot, updateDoc, doc, limit } from '../firebase';
import { useFirebase } from './FirebaseProvider';
import { logAction } from '../utils/auditLogger';

export const SystemResetModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { user, isAdmin, loading: fbLoading } = useFirebase();
    const [request, setRequest] = useState<any>(null);
    const [confirmText, setConfirmText] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || fbLoading || !isAdmin) return;
        const q = query(collection(db, 'resetRequests'), where('status', '==', 'pending'), limit(1));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                setRequest({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
            } else {
                setRequest(null);
            }
        });
        return unsubscribe;
    }, [isOpen, isAdmin, fbLoading]);

    const handleCreateRequest = async () => {
        if (!user || !isAdmin) return;
        setLoading(true);
        try {
            const scheduledAt = new Date();
            scheduledAt.setHours(scheduledAt.getHours() + 24);

            await addDoc(collection(db, 'resetRequests'), {
                requestedAt: serverTimestamp(),
                requestedBy: user.uid,
                requestedByEmail: user.email,
                approvals: [user.uid],
                scheduledAt: scheduledAt.toISOString(),
                status: 'pending'
            });
            await logAction('RESET_REQUESTED', 'User requested a system reset');
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!user || !isAdmin || !request) return;
        if (request.approvals.includes(user.uid)) {
            alert('لقد قمت بالموافقة بالفعل.');
            return;
        }

        setLoading(true);
        try {
            const newApprovals = [...request.approvals, user.uid];
            await updateDoc(doc(db, 'resetRequests', request.id), {
                approvals: newApprovals
            });
            await logAction('RESET_APPROVED', `User approved the reset request. Total approvals: ${newApprovals.length}`);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleExecute = async () => {
        if (!request || request.approvals.length < 3) return;
        const now = new Date();
        const scheduled = new Date(request.scheduledAt);
        if (now < scheduled) {
            alert('يجب الانتظار 24 ساعة قبل التنفيذ.');
            return;
        }

        if (confirmText !== 'RESET') {
            alert('يرجى كتابة RESET للتأكيد.');
            return;
        }

        setLoading(true);
        try {
            // Implementation of wipe logic would go here
            // For now, mark as completed
            await updateDoc(doc(db, 'resetRequests', request.id), {
                status: 'completed'
            });
            await logAction('SYSTEM_RESET_EXECUTED', 'Full system reset executed.');
            alert('تم تنفيذ التصفير بنجاح (محاكاة).');
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border-t-8 border-red-600">
                <h2 className="text-2xl font-bold text-red-600 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">warning</span>
                    تصفير النظام (المنطقة الخطرة)
                </h2>

                {!request ? (
                    <div>
                        <p className="text-gray-600 mb-6">
                            تصفير النظام سيؤدي إلى حذف جميع البيانات نهائياً. يتطلب هذا الإجراء موافقة 3 مسؤولين وفترة انتظار 24 ساعة.
                        </p>
                        <button
                            onClick={handleCreateRequest}
                            disabled={loading || !isAdmin}
                            className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50"
                        >
                            {loading ? 'جاري الطلب...' : 'بدء طلب تصفير النظام'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                            <p className="font-bold text-red-800">طلب تصفير قيد المعالجة</p>
                            <p className="text-sm text-red-600">بواسطة: {request.requestedByEmail}</p>
                            <p className="text-sm text-red-600">الموافقات: {request.approvals.length} / 3</p>
                            <p className="text-sm text-red-600">موعد التنفيذ: {new Date(request.scheduledAt).toLocaleString('ar-EG')}</p>
                        </div>

                        {request.approvals.length < 3 ? (
                            <button
                                onClick={handleApprove}
                                disabled={loading || request.approvals.includes(user?.uid)}
                                className="w-full bg-orange-500 text-white py-2 rounded-lg font-bold hover:bg-orange-600 disabled:opacity-50"
                            >
                                {loading ? 'جاري الموافقة...' : 'الموافقة على الطلب'}
                            </button>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm font-medium text-gray-700">اكتب "RESET" للتأكيد النهائي:</p>
                                <input
                                    type="text"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    placeholder="RESET"
                                    className="w-full p-2 border-2 border-red-200 rounded text-center font-mono font-bold"
                                />
                                <button
                                    onClick={handleExecute}
                                    disabled={loading || confirmText !== 'RESET' || new Date() < new Date(request.scheduledAt)}
                                    className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50"
                                >
                                    {loading ? 'جاري التنفيذ...' : 'تنفيذ التصفير الشامل'}
                                </button>
                                {new Date() < new Date(request.scheduledAt) && (
                                    <p className="text-xs text-center text-gray-500">
                                        يجب الانتظار حتى يحين موعد التنفيذ المجدول.
                                    </p>
                                )}
                            </div>
                        )}
                        
                        <button
                            onClick={async () => {
                                await updateDoc(doc(db, 'resetRequests', request.id), { status: 'cancelled' });
                                await logAction('RESET_CANCELLED', 'User cancelled the reset request');
                                onClose();
                            }}
                            className="w-full text-gray-500 underline text-sm"
                        >
                            إلغاء الطلب
                        </button>
                    </div>
                )}

                <button
                    onClick={onClose}
                    className="mt-6 w-full py-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    إغلاق
                </button>
            </div>
        </div>
    );
};
