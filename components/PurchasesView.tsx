import React, { useState, useMemo } from 'react';
import type { Purchase, Product, Supplier, FinancialAccount } from '../types';
import PurchaseModal from './PurchaseModal';
import AddPaymentModal from './AddPaymentModal';
import Pagination from './common/Pagination';

interface PurchasesViewProps {
  purchases: Purchase[];
  products: Product[];
  suppliers: Supplier[];
  accounts: FinancialAccount[];
  accountBalances: Map<string, number>;
  onAddPurchase: (purchase: Omit<Purchase, 'id'>) => void | Promise<any>;
  onUpdatePurchase: (id: string, purchase: Partial<Purchase>) => void | Promise<any>;
  onDeletePurchase: (id: string) => void | Promise<any>;
  onAddSupplier: (supplier: Omit<Supplier, 'id'>) => any | Promise<any>;
  onAddPayment: (purchaseId: string, amount: number, accountId: string) => void | Promise<any>;
  createProduct: (product: Omit<Product, 'id'>) => any | Promise<any>;
  updateProduct: (id: string, product: Omit<Product, 'id'>) => void | Promise<any>;
}

const ITEMS_PER_PAGE = 10;

const StatCard = ({ title, value, icon, valueClassName }: { title: string; value: string | number; icon: string; valueClassName?: string }) => (
    <div className="bg-slate-50 p-4 rounded-xl shadow-sm flex items-center gap-4 border border-slate-200">
        <div className={`p-3 rounded-full ${valueClassName} bg-opacity-10`}>
            <span className={`material-symbols-outlined text-3xl ${valueClassName}`}>{icon}</span>
        </div>
        <div>
            <h3 className="text-slate-500 text-sm">{title}</h3>
            <p className={`text-xl font-bold ${valueClassName || 'text-slate-800'}`}>{value}</p>
        </div>
    </div>
);


const PurchasesView: React.FC<PurchasesViewProps> = ({
  purchases, products, suppliers, accounts, onAddPurchase, onUpdatePurchase, onDeletePurchase, onAddSupplier, onAddPayment, createProduct, updateProduct
}) => {
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [paymentModalPurchase, setPaymentModalPurchase] = useState<Purchase | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const sortedPurchases = useMemo(() => {
    return [...purchases].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [purchases]);

  const paginatedPurchases = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedPurchases.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedPurchases, currentPage]);

  const totalPages = Math.ceil(sortedPurchases.length / ITEMS_PER_PAGE);

  const purchaseStats = useMemo(() => {
    const totalCost = purchases.reduce((sum, p) => sum + p.totalCost, 0);
    const totalPaid = purchases.reduce((sum, p) => sum + p.payments.reduce((s, payment) => s + payment.amount, 0), 0);
    const accountsPayable = totalCost - totalPaid;
    return { totalCost, accountsPayable };
  }, [purchases]);
  
  const getStatusBadge = (status: Purchase['paymentStatus']) => {
    switch (status) {
      case 'paid': return <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">مدفوع</span>;
      case 'partial': return <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">مدفوع جزئياً</span>;
      case 'unpaid': return <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">غير مدفوع</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6">
       <div className="bg-white shadow-lg rounded-xl">
         <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">المشتريات</h2>
                <p className="text-sm text-slate-500 mt-1">إدارة فواتير الشراء من الموردين والناشرين.</p>
            </div>
            <button onClick={() => setIsPurchaseModalOpen(true)} className="flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
                <span className="material-symbols-outlined">add</span>
                إضافة فاتورة شراء
            </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-slate-50 border-b border-slate-200">
            <StatCard title="إجمالي تكلفة المشتريات" value={purchaseStats.totalCost.toFixed(2)} icon="shopping_bag" valueClassName="text-indigo-600" />
            <StatCard title="ديون الموردين (المتبقي)" value={purchaseStats.accountsPayable.toFixed(2)} icon="receipt_long" valueClassName="text-red-600" />
            <StatCard title="عدد الموردين" value={suppliers.length} icon="store" valueClassName="text-green-600" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-right">
            <thead className="bg-slate-50 text-slate-600 uppercase text-sm">
              <tr>
                <th className="py-3 px-6">التاريخ</th>
                <th className="py-3 px-6">المورد</th>
                <th className="py-3 px-6">التكلفة الإجمالية</th>
                <th className="py-3 px-6 text-center">حالة الدفع</th>
                <th className="py-3 px-6 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 text-sm">
              {paginatedPurchases.map((p) => (
                <tr key={p.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="py-3 px-6">{new Date(p.date).toLocaleDateString('ar-EG')}</td>
                  <td className="py-3 px-6 font-semibold">{p.supplierName}</td>
                  <td className="py-3 px-6 font-bold">{p.totalCost.toFixed(2)}</td>
                  <td className="py-3 px-6 text-center">{getStatusBadge(p.paymentStatus)}</td>
                  <td className="py-3 px-6 text-center">
                    <div className="flex items-center justify-center gap-1">
                        {p.paymentStatus !== 'paid' && (
                        <button onClick={() => setPaymentModalPurchase(p)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors" title="إضافة دفعة">
                            <span className="material-symbols-outlined text-lg">add_card</span>
                        </button>
                        )}
                        <button onClick={() => onDeletePurchase(p.id)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-red-600 transition-colors" title="حذف">
                            <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sortedPurchases.length === 0 && <p className="text-center py-8 text-slate-500">لا يوجد فواتير شراء لعرضها.</p>}
        </div>
        <div className="p-6 border-t border-slate-200">
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={ITEMS_PER_PAGE}
                totalItems={sortedPurchases.length}
            />
        </div>
      </div>

      {isPurchaseModalOpen && (
        <PurchaseModal
          products={products}
          suppliers={suppliers}
          onSave={(purchase) => {
            onAddPurchase(purchase);
            setIsPurchaseModalOpen(false);
          }}
          onCancel={() => setIsPurchaseModalOpen(false)}
          addSupplier={onAddSupplier}
          createProduct={createProduct}
          updateProduct={updateProduct}
        />
      )}

      {paymentModalPurchase && (
        <AddPaymentModal
          purchase={paymentModalPurchase}
          accounts={accounts}
          onClose={() => setPaymentModalPurchase(null)}
          onAddPayment={onAddPayment}
        />
      )}
    </div>
  );
};

export default PurchasesView;