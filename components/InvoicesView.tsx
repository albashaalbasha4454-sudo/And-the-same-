import React, { useState, useMemo } from 'react';
import type { Invoice, User } from '../types';
import PrintInvoice from '../PrintInvoice';
import ReturnModal from './ReturnModal';
import RequestReturnModal from './RequestReturnModal';
import Pagination from './common/Pagination';
import { 
    FileText, Search, Filter, Printer, 
    RotateCcw, Inbox, ArrowUpRight, 
    Calendar, User as UserIcon, Hash, FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InvoicesViewProps {
  invoices: Invoice[];
  processReturn: (originalInvoiceId: string, returnItems: any[]) => void;
  sendReturnRequest: (originalInvoice: Invoice, returnItems: any[]) => void;
  currentUser: User;
  shopName: string;
  shopAddress: string;
}

const ITEMS_PER_PAGE = 10;

const InvoicesView: React.FC<InvoicesViewProps> = ({ invoices, processReturn, sendReturnRequest, currentUser, shopName, shopAddress }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [invoiceToPrint, setInvoiceToPrint] = useState<Invoice | null>(null);
  const [invoiceToReturn, setInvoiceToReturn] = useState<Invoice | null>(null);
  const [invoiceToRequestReturn, setInvoiceToRequestReturn] = useState<Invoice | null>(null);

  const sortedInvoices = useMemo(() => {
    return [...invoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return sortedInvoices.filter(inv => {
      const matchesSearch = inv.id.includes(searchTerm) || inv.customerInfo?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || inv.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [sortedInvoices, searchTerm, filterType]);
  
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInvoices.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredInvoices, currentPage]);

  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);

  const exportToCSV = () => {
    // Generate secure localized UTF-8 BOM CSV representation
    const headers = ["رقم الفاتورة", "التاريخ", "الوقت", "العميل", "الهاتف", "نوع العملية", "قيمة المبيعات الفرعية", "الخصم الإجمالي", "أجور الشحن والمناولة", "الصافي شامل للضريبة"];
    const rows = filteredInvoices.map(inv => [
      inv.id.substring(0, 8).toUpperCase(),
      new Date(inv.date).toLocaleDateString('ar-JO'),
      new Date(inv.date).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' }),
      inv.customerInfo?.name || 'عميل نقدي مباشر',
      inv.customerInfo?.phone || '-',
      inv.type === 'sale' ? 'بيع نقدي' : inv.type === 'return' ? 'مرتجع' : inv.type === 'shipping' ? 'شحن خارجي' : 'حجز مسبق',
      inv.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2),
      inv.items.reduce((sum, item) => sum + ((item.discount || 0) * item.quantity), 0).toFixed(2),
      (inv.shippingFee || 0).toFixed(2),
      inv.total.toFixed(2)
    ]);
    
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `سجل_فواتير_البيع_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProcessReturn = (originalInvoiceId: string, returnItems: any[]) => {
    processReturn(originalInvoiceId, returnItems);
    setInvoiceToReturn(null);
  };
  
  const handleSendReturnRequest = (originalInvoice: Invoice, returnItems: any[]) => {
    sendReturnRequest(originalInvoice, returnItems);
    setInvoiceToRequestReturn(null);
  };

  const getInvoiceTypeStyle = (type: Invoice['type']) => {
    const styles: Record<Invoice['type'], {label: string, className: string, icon: any}> = {
        sale: { label: 'بيع نقدي', className: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: ArrowUpRight},
        return: { label: 'مرتجع', className: 'bg-rose-50 text-rose-600 border-rose-100', icon: RotateCcw},
        shipping: { label: 'شحن خارجي', className: 'bg-sky-50 text-sky-600 border-sky-100', icon: FileText},
        reservation: { label: 'حجز مسبق', className: 'bg-amber-50 text-amber-600 border-amber-100', icon: Inbox}
    };
    return styles[type] || {label: type, className: 'bg-slate-50 text-slate-600 border-slate-100', icon: FileText};
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
                <span className="w-8 h-1 bg-indigo-600 rounded-full"></span>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 opacity-80">Ledger & History</span>
            </div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">سجل الفواتير</h2>
            <p className="text-slate-400 font-medium text-sm">أرشيف كامل لجميع العمليات المالية والحركات التجارية.</p>
          </div>
          
          <button 
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-emerald-600 text-white font-extrabold text-xs tracking-tight uppercase px-6 py-3 rounded-xl hover:bg-emerald-500 hover:scale-102 transition-all active:scale-98 shadow-md"
          >
              <FileDown size={16} />
              <span>تصدير الفواتير الحالية كـ CSV Excel</span>
          </button>
      </div>

      <div className="card-professional bg-white overflow-hidden">
          {/* Controls Bar */}
          <div className="p-6 lg:p-8 flex flex-col lg:flex-row justify-between items-center gap-6 border-b border-slate-50 overflow-visible">
            <div className="flex items-center gap-4 w-full lg:w-auto">
                <div className="relative group flex-1 lg:w-96">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-400 transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="ابحث برقم الفاتورة أو اسم العميل..." 
                        value={searchTerm} 
                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 pr-12 pl-4 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                    />
                </div>
                
                <div className="relative group">
                    <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                    <select 
                        value={filterType} 
                        onChange={e => setFilterType(e.target.value)} 
                        className="appearance-none bg-slate-50/50 border border-slate-200 rounded-xl py-3 pr-10 pl-6 text-xs font-black uppercase tracking-widest text-slate-500 hover:border-slate-300 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
                    >
                        <option value="all">كل العمليات</option>
                        <option value="sale">المبيعات</option>
                        <option value="return">المرتجعات</option>
                        <option value="shipping">الشحن</option>
                        <option value="reservation">الحجوزات</option>
                    </select>
                </div>
            </div>
          </div>

          <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-right border-collapse">
                  <thead>
                      <tr className="bg-slate-50/50">
                          <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-32">رقم الفاتورة</th>
                          <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">التاريخ والوقت</th>
                          <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">العميل</th>
                          <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">نوع العملية</th>
                          <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left">القيمة الإجمالية</th>
                          <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">إجراءات</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {paginatedInvoices.map((invoice, idx) => {
                          const typeStyle = getInvoiceTypeStyle(invoice.type);
                          const TypeIcon = typeStyle.icon;
                          
                          return (
                              <motion.tr 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                key={invoice.id} 
                                className="group hover:bg-slate-50/50 transition-colors"
                              >
                                  <td className="p-5">
                                      <div className="flex items-center gap-2">
                                          <Hash size={14} className="text-slate-300" />
                                          <span className="font-black text-sm text-slate-400 tabular-nums uppercase">{invoice.id.substring(0, 8)}</span>
                                      </div>
                                  </td>
                                  <td className="p-5">
                                      <div className="flex flex-col">
                                          <span className="font-black text-slate-800 text-sm tracking-tight">{new Date(invoice.date).toLocaleDateString('ar-EG')}</span>
                                          <span className="text-[10px] text-slate-400 font-bold tabular-nums uppercase">{new Date(invoice.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                                      </div>
                                  </td>
                                  <td className="p-5">
                                      <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                              <UserIcon size={14} />
                                          </div>
                                          <span className="font-bold text-slate-700 text-sm">{invoice.customerInfo?.name || 'عميل نقدي'}</span>
                                      </div>
                                  </td>
                                  <td className="p-5 text-center">
                                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider ${typeStyle.className}`}>
                                          <TypeIcon size={12} strokeWidth={3} />
                                          {typeStyle.label}
                                      </div>
                                  </td>
                                  <td className="p-5 text-left">
                                      <span className="text-base font-black text-slate-800 tabular-nums">{invoice.total.toLocaleString()}</span>
                                  </td>
                                  <td className="p-5">
                                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button 
                                              onClick={() => setInvoiceToPrint(invoice)} 
                                              className="p-2.5 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                                              title="طباعة الفاتورة"
                                          >
                                              <Printer size={18} />
                                          </button>
                                          {invoice.type === 'sale' && (
                                              currentUser.role === 'admin' ? (
                                                  <button 
                                                      onClick={() => setInvoiceToReturn(invoice)} 
                                                      className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                                      title="إصدار مرتجع"
                                                  >
                                                      <RotateCcw size={18} />
                                                  </button>
                                              ) : (
                                                  <button 
                                                      onClick={() => setInvoiceToRequestReturn(invoice)} 
                                                      className="p-2.5 rounded-xl text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-all"
                                                      title="طلب مرتجع"
                                                  >
                                                      <Inbox size={18} />
                                                  </button>
                                              )
                                          )}
                                      </div>
                                  </td>
                              </motion.tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>

          <div className="p-6 lg:p-8 flex flex-col sm:flex-row justify-between items-center gap-6 border-t border-slate-50">
              <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  Showing {paginatedInvoices.length} to {filteredInvoices.length} of {invoices.length} Records
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={ITEMS_PER_PAGE} totalItems={filteredInvoices.length} />
          </div>
      </div>

      <AnimatePresence>
        {invoiceToPrint && (
            <PrintInvoice 
                invoice={invoiceToPrint} 
                onClose={() => setInvoiceToPrint(null)} 
                shopName={shopName} 
                shopAddress={shopAddress} 
            />
        )}
        {invoiceToReturn && (
            <ReturnModal 
                invoice={invoiceToReturn} 
                onClose={() => setInvoiceToReturn(null)} 
                onProcessReturn={handleProcessReturn} 
            />
        )}
        {invoiceToRequestReturn && (
            <RequestReturnModal 
                invoice={invoiceToRequestReturn} 
                onClose={() => setInvoiceToRequestReturn(null)} 
                onSendRequest={handleSendReturnRequest} 
            />
        )}
      </AnimatePresence>
    </div>
  );
};

export default InvoicesView;
