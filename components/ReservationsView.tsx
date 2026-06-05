import React, { useState, useMemo } from 'react';
import type { Invoice } from '../types';
import Pagination from './common/Pagination';
import { 
    BookmarkCheck, ChevronDown, ChevronUp, 
    ShoppingCart, Trash2, Calendar, 
    User, Phone, Book
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReservationsViewProps {
  reservations: Invoice[];
  onConvertToSale: (reservation: Invoice) => void;
  onCancelReservation: (reservationId: string) => void;
}

const ITEMS_PER_PAGE = 10;

const ReservationsView: React.FC<ReservationsViewProps> = ({ reservations, onConvertToSale, onCancelReservation }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sortedReservations = useMemo(() => {
    return [...reservations].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [reservations]);
  
  const paginatedReservations = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedReservations.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedReservations, currentPage]);

  const totalPages = Math.ceil(sortedReservations.length / ITEMS_PER_PAGE);

  const handleToggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleCancel = (id: string) => {
    if (window.confirm('هل أنت متأكد من إلغاء هذا الحجز؟ ستتم إعادة الكتب إلى المخزون.')) {
        onCancelReservation(id);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
                <span className="w-8 h-1 bg-amber-500 rounded-full"></span>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500 opacity-80">Pending Pickups</span>
            </div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">إدارة الحجوزات</h2>
            <p className="text-slate-400 font-medium text-sm">متابعة الكتب المحجوزة للعملاء بانتظار الاستلام أو التحويل لمبيعات.</p>
          </div>
      </div>

      <div className="card-professional bg-white overflow-hidden">
          <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-right border-collapse">
                  <thead>
                      <tr className="bg-slate-50/50">
                          <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">تاريخ الحجز</th>
                          <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">العميل</th>
                          <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">بيانات التواصل</th>
                          <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left">قيمة الحجز</th>
                          <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">إجراءات</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {paginatedReservations.map((res, idx) => (
                          <React.Fragment key={res.id}>
                              <motion.tr 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className={`group hover:bg-slate-50/50 transition-colors ${expandedId === res.id ? 'bg-amber-50/20' : ''}`}
                              >
                                  <td className="p-5">
                                      <div className="flex items-center gap-3">
                                          <Calendar size={14} className="text-slate-300" />
                                          <span className="font-bold text-slate-600 text-xs tabular-nums">
                                              {new Date(res.date).toLocaleString('ar-EG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                      </div>
                                  </td>
                                  <td className="p-5">
                                      <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                                              <User size={14} />
                                          </div>
                                          <span className="font-black text-slate-800 text-sm tracking-tight">{res.customerInfo?.name}</span>
                                      </div>
                                  </td>
                                  <td className="p-5">
                                      <div className="flex items-center gap-2 text-slate-500">
                                          <Phone size={14} className="text-slate-300" />
                                          <span className="text-xs font-bold tabular-nums">{res.customerInfo?.phone}</span>
                                      </div>
                                  </td>
                                  <td className="p-5 text-left">
                                      <span className="text-base font-black text-slate-800 tabular-nums">{res.total.toLocaleString()}</span>
                                  </td>
                                  <td className="p-5">
                                      <div className="flex items-center justify-center gap-1">
                                          <button 
                                              onClick={() => handleToggleExpand(res.id)} 
                                              className="p-2.5 rounded-xl text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-all"
                                              title="تفاصيل الكتب"
                                          >
                                              {expandedId === res.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                          </button>
                                          <button 
                                              onClick={() => onConvertToSale(res)} 
                                              className="p-2.5 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                                              title="تحويل لمبيعات"
                                          >
                                              <ShoppingCart size={18} />
                                          </button>
                                          <button 
                                              onClick={() => handleCancel(res.id)} 
                                              className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                              title="إلغاء الحجز"
                                          >
                                              <Trash2 size={18} />
                                          </button>
                                      </div>
                                  </td>
                              </motion.tr>
                              <AnimatePresence>
                                  {expandedId === res.id && (
                                      <motion.tr 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-slate-50/50"
                                      >
                                          <td colSpan={5} className="p-8">
                                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                  {res.items.map(item => (
                                                      <div key={item.productId} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                                                          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
                                                              <Book size={18} />
                                                          </div>
                                                          <div className="flex-1">
                                                              <p className="font-black text-slate-800 text-sm leading-tight mb-1">{item.productName}</p>
                                                              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                  <span>الكمية: {item.quantity}</span>
                                                                  <span>السعر: {item.price.toLocaleString()}</span>
                                                              </div>
                                                          </div>
                                                      </div>
                                                  ))}
                                              </div>
                                          </td>
                                      </motion.tr>
                                  )}
                              </AnimatePresence>
                          </React.Fragment>
                      ))}
                  </tbody>
              </table>
          </div>

          <div className="p-6 lg:p-8 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  Total of {reservations.length} Active Reservations
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={ITEMS_PER_PAGE} totalItems={reservations.length} />
          </div>
      </div>
    </div>
  );
};

export default ReservationsView;
