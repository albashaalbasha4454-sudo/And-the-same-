import React, { useState, useMemo } from 'react';
import type { TillCloseout } from '../types';
import Pagination from './common/Pagination';
import { motion, AnimatePresence } from 'motion/react';
import { Archive, User, Calendar, DollarSign, Wallet, FileText, ChevronDown, ChevronUp, Clock, AlertCircle } from 'lucide-react';

interface TillCloseoutsViewProps {
  tillCloseouts: TillCloseout[];
}

const ITEMS_PER_PAGE = 10;

const TillCloseoutsView: React.FC<TillCloseoutsViewProps> = ({ tillCloseouts }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const sortedCloseouts = useMemo(() => {
    return [...tillCloseouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [tillCloseouts]);

  const paginatedCloseouts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedCloseouts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedCloseouts, currentPage]);
  
  const totalPages = Math.ceil(sortedCloseouts.length / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">تقارير إغلاق الصناديق</h2>
          <p className="text-slate-500 font-medium">عرض ومراجعة جميع عمليات إغلاق الصناديق اليومية</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl text-indigo-600 font-bold border border-indigo-100">
           <Archive size={18} />
           <span className="text-sm">{tillCloseouts.length} تقرير يومي</span>
        </div>
      </div>

      <div className="card-professional overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">تاريخ الإغلاق</th>
                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">الكاشير</th>
                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">المبلغ المتوقع</th>
                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">المبلغ المعدود</th>
                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">الفارق</th>
                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence mode="popLayout">
                {paginatedCloseouts.map((c) => {
                    const isExpanded = expandedId === c.id;
                    const diffColor = c.difference === 0 ? 'text-slate-700' : c.difference > 0 ? 'text-green-600' : 'text-red-600';
                    return (
                      <React.Fragment key={c.id}>
                        <motion.tr 
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={`hover:bg-slate-50/50 transition-colors group ${isExpanded ? 'bg-indigo-50/10' : ''}`}
                        >
                          <td className="py-4 px-6 font-bold text-slate-700">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-slate-400" />
                              {new Date(c.date).toLocaleDateString('ar-EG')}
                              <span className="text-[10px] text-slate-400 font-medium mr-2">{new Date(c.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200 uppercase text-[10px] font-black">
                                {c.closedByUsername.charAt(0)}
                              </div>
                              <span className="font-bold text-slate-700">{c.closedByUsername}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-bold text-slate-600 tabular-nums">{c.netCashExpected.toLocaleString()}</td>
                          <td className="py-4 px-6 font-bold text-slate-900 tabular-nums">{c.countedCash.toLocaleString()}</td>
                          <td className={`py-4 px-6 font-black tabular-nums ${diffColor}`}>
                            <div className="flex items-center gap-1">
                              {c.difference !== 0 && (c.difference > 0 ? '+' : '')}
                              {c.difference.toLocaleString()}
                              {c.difference !== 0 && <AlertCircle size={14} />}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <button 
                              onClick={() => setExpandedId(isExpanded ? null : c.id)} 
                              className={`p-2 rounded-xl transition-all ${isExpanded ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-900'}`}
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </td>
                        </motion.tr>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.tr
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="bg-slate-50/30"
                            >
                              <td colSpan={6} className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                  <div className="card-professional p-4 bg-white">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">صافي المبيعات</p>
                                    <p className="text-xl font-black text-slate-800 tabular-nums">{c.totalSales.toLocaleString()}</p>
                                  </div>
                                  <div className="card-professional p-4 bg-white">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">صافي المرتجعات</p>
                                    <p className="text-xl font-black text-red-600 tabular-nums">{c.totalReturns.toLocaleString()}</p>
                                  </div>
                                  <div className="card-professional p-4 bg-white">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">عدد الفواتير</p>
                                    <p className="text-xl font-black text-indigo-600 tabular-nums">{c.invoiceIds.length}</p>
                                  </div>
                                  <div className="card-professional p-4 bg-white md:col-span-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">الملاحظات</p>
                                    <p className="text-sm font-bold text-slate-600 leading-relaxed italic">
                                      {c.notes || 'لا توجد ملاحظات مسجلة لهذا الإغلاق...'}
                                    </p>
                                  </div>
                                </div>
                              </td>
                            </motion.tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                })}
              </AnimatePresence>
            </tbody>
          </table>
          {sortedCloseouts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
               <Archive size={48} strokeWidth={1} className="mb-4 opacity-20" />
               <p className="font-bold">لا يوجد تقارير إغلاق لعرضها حالياً</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="p-6 border-t border-slate-100 bg-slate-50/30">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={ITEMS_PER_PAGE}
                totalItems={sortedCloseouts.length}
              />
          </div>
        )}
      </div>
    </div>
  );
};

export default TillCloseoutsView;
