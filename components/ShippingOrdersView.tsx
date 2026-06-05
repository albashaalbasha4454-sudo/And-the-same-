import React, { useState, useMemo } from 'react';
import type { Invoice, PaymentStatus } from '../types';
import Pagination from './common/Pagination';

interface ShippingOrdersViewProps {
  shippingOrders: Invoice[];
  onUpdateStatus: (orderId: string, status: 'shipped' | 'completed' | 'cancelled') => void;
  onUpdatePaymentStatus: (orderId: string, paymentStatus: 'paid' | 'unpaid') => void;
}

const ITEMS_PER_PAGE = 10;

const ShippingOrdersView: React.FC<ShippingOrdersViewProps> = ({ shippingOrders, onUpdateStatus, onUpdatePaymentStatus }) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'unpaid' | 'shipped' | 'completed' | 'cancelled'>('all');
  const [filterPayment, setFilterPayment] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredOrders = useMemo(() => {
    return shippingOrders
        .filter(order => filterStatus === 'all' || order.status === filterStatus)
        .filter(order => filterPayment === 'all' || order.paymentStatus === filterPayment)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [shippingOrders, filterStatus, filterPayment]);
  
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);
  
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedOrders.map(o => o.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkUpdateStatus = (status: 'shipped' | 'completed') => {
    if (window.confirm(`هل أنت متأكد من تحديث حالة ${selectedIds.length} طلبات إلى ${status === 'shipped' ? 'تم الشحن' : 'مكتمل'}؟`)) {
      selectedIds.forEach(id => onUpdateStatus(id, status));
      setSelectedIds([]);
    }
  };

  const getShippingStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      // FIX: The status for 'قيد التجهيز' should be 'pending', not 'unpaid'.
      case 'pending': return <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">قيد التجهيز</span>;
      case 'shipped': return <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">تم الشحن</span>;
      case 'completed': return <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">مكتمل</span>;
      case 'cancelled': return <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">ملغي</span>;
      default: return null;
    }
  };

  // FIX: The function signature was updated to accept all PaymentStatus types, and a case for 'partial' was added.
  const getPaymentStatusBadge = (status?: PaymentStatus) => {
      if (status === 'paid') return <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">مدفوع</span>;
      if (status === 'unpaid') return <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">غير مدفوع</span>;
      if (status === 'partial') return <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">مدفوع جزئياً</span>;
      return null;
  }

  return (
    <div className="p-6">
       <div className="bg-white shadow-lg rounded-xl">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800">طلبات الشحن</h2>
          <p className="text-sm text-slate-500 mt-1">عرض وإدارة جميع طلبات الشحن والتوصيل.</p>
        </div>
        <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="w-full md:w-auto p-2 border border-slate-300 rounded-lg bg-white">
              <option value="all">كل حالات الشحن</option>
              <option value="pending">قيد التجهيز</option>
              <option value="shipped">تم الشحن</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغي</option>
            </select>
            <select value={filterPayment} onChange={e => setFilterPayment(e.target.value as any)} className="w-full md:w-auto p-2 border border-slate-300 rounded-lg bg-white">
              <option value="all">كل حالات الدفع</option>
              <option value="paid">مدفوع</option>
              <option value="unpaid">غير مدفوع</option>
            </select>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3 bg-indigo-50 p-2 px-4 rounded-lg border border-indigo-100 w-full md:w-auto">
              <span className="text-sm font-bold text-indigo-700">{selectedIds.length} طلبات مختارة</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleBulkUpdateStatus('shipped')}
                  className="bg-blue-600 text-white text-xs font-bold py-1.5 px-3 rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">local_shipping</span>
                  تم الشحن
                </button>
                <button 
                  onClick={() => handleBulkUpdateStatus('completed')}
                  className="bg-green-600 text-white text-xs font-bold py-1.5 px-3 rounded hover:bg-green-700 transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">task_alt</span>
                  مكتمل
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="space-y-4 md:space-y-0">
            {/* Desktop Header */}
            <div className="hidden md:grid md:grid-cols-[40px,1.5fr,1.5fr,1fr,1fr,1fr,1.5fr] gap-4 items-center bg-slate-50 text-slate-600 uppercase text-xs font-bold px-4 py-3 rounded-t-lg">
                <div className="text-center">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={selectedIds.length === paginatedOrders.length && paginatedOrders.length > 0}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>
                <div>تاريخ الطلب</div>
                <div>العميل</div>
                <div>الإجمالي</div>
                <div className="text-center">حالة الشحن</div>
                <div className="text-center">حالة الدفع</div>
                <div className="text-center">الإجراءات</div>
            </div>

            {/* Orders List / Cards */}
            <div className="space-y-3 md:space-y-0">
            {paginatedOrders.map((order) => (
                <React.Fragment key={order.id}>
                    <div className={`
                        md:grid md:grid-cols-[40px,1.5fr,1.5fr,1fr,1fr,1fr,1.5fr] md:gap-4 md:items-center
                        p-4 md:px-4 md:py-3 border-b border-slate-200 
                        hover:bg-slate-50 bg-white md:bg-transparent
                        block rounded-lg md:rounded-none shadow-sm md:shadow-none
                        ${selectedIds.includes(order.id) ? 'bg-indigo-50/30' : ''}
                    `}>
                        {/* Mobile Header */}
                        <div className="flex justify-between items-start mb-3 md:hidden">
                            <div className="flex items-center gap-3">
                                <input 
                                  type="checkbox" 
                                  checked={selectedIds.includes(order.id)}
                                  onChange={() => handleSelectOne(order.id)}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <div>
                                    <h3 className="font-bold text-slate-800">{order.customerInfo?.name}</h3>
                                    <p className="text-xs text-slate-500">{new Date(order.date).toLocaleDateString('ar-EG')}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                {getShippingStatusBadge(order.status)}
                                {getPaymentStatusBadge(order.paymentStatus)}
                            </div>
                        </div>

                        {/* Desktop Data Cells */}
                        <div className="hidden md:flex justify-center">
                          <input 
                            type="checkbox" 
                            checked={selectedIds.includes(order.id)}
                            onChange={() => handleSelectOne(order.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="hidden md:block text-xs">{new Date(order.date).toLocaleString('ar-EG')}</div>
                        <div className="hidden md:block text-xs font-semibold truncate">{order.customerInfo?.name}</div>
                        <div className="hidden md:block font-bold text-sm">{order.total.toFixed(2)}</div>
                        <div className="hidden md:block text-center">{getShippingStatusBadge(order.status)}</div>
                        <div className="hidden md:block text-center">{getPaymentStatusBadge(order.paymentStatus)}</div>

                        {/* Mobile Grid Data */}
                        <div className="grid grid-cols-2 gap-y-2 text-xs md:hidden mb-4 border-t border-slate-100 pt-3">
                            <div><span className="text-slate-500">الإجمالي:</span> <span className="font-bold">{order.total.toFixed(2)}</span></div>
                            <div><span className="text-slate-500">المصدر:</span> {order.source}</div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-center md:justify-center gap-1 border-t border-slate-100 pt-2 md:border-0 md:pt-0">
                            <button onClick={() => setExpandedId(expandedId === order.id ? null : order.id)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors" title="تفاصيل">
                                <span className="material-symbols-outlined text-lg">info</span>
                            </button>
                            {order.paymentStatus === 'unpaid' && (
                                <button onClick={() => onUpdatePaymentStatus(order.id, 'paid')} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-green-600 transition-colors" title="تمييز كمدفوع">
                                    <span className="material-symbols-outlined text-lg">payments</span>
                                </button>
                            )}
                            {order.status === 'pending' && <button onClick={() => onUpdateStatus(order.id, 'shipped')} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors" title="شحن الطلب"><span className="material-symbols-outlined text-lg">local_shipping</span></button>}
                            {order.status === 'shipped' && <button onClick={() => onUpdateStatus(order.id, 'completed')} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-green-600 transition-colors" title="إكمال الطلب"><span className="material-symbols-outlined text-lg">task_alt</span></button>}
                            {order.status !== 'completed' && order.status !== 'cancelled' && <button onClick={() => onUpdateStatus(order.id, 'cancelled')} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-red-600 transition-colors" title="إلغاء الطلب"><span className="material-symbols-outlined text-lg">cancel</span></button>}
                        </div>
                    </div>
                    {expandedId === order.id && (
                        <div className="bg-slate-50 p-4 text-xs border-b border-slate-200">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <p><strong>الهاتف:</strong> {order.customerInfo?.phone}</p>
                                    <p><strong>العنوان:</strong> {order.customerInfo?.address}</p>
                                    <p><strong>مصدر الطلب:</strong> {order.source}</p>
                                </div>
                                <div>
                                    <h4 className="font-bold mb-1">الكتب:</h4>
                                    <ul className="list-disc list-inside">
                                        {order.items.map(item => (
                                            <li key={item.productId}>{item.productName} (الكمية: {item.quantity})</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </React.Fragment>
            ))}
            </div>
            {filteredOrders.length === 0 && <p className="text-center py-8 text-slate-500">لا يوجد طلبات شحن لعرضها.</p>}
        </div>
        <div className="p-6 border-t border-slate-200">
            <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={filteredOrders.length}
            />
        </div>
      </div>
    </div>
  );
};

export default ShippingOrdersView;