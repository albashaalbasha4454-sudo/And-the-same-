import React, { useState, useMemo } from 'react';
import type { Expense, FinancialAccount } from '../types';
import Modal from './Modal';
import Pagination from './common/Pagination';
import { 
    Receipt, Plus, Calendar, Tag, 
    Wallet, Search, ArrowDownRight,
    TrendingDown, CreditCard, DollarSign,
    MoreVertical, Trash2, Edit3, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ExpensesViewProps {
  expenses: Expense[];
  accounts: FinancialAccount[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
}

const ITEMS_PER_PAGE = 10;

const StatCard = ({ title, value, icon: Icon, colorClass }: { 
    title: string, 
    value: string | number, 
    icon: any, 
    colorClass: string 
}) => (
    <motion.div 
        whileHover={{ y: -4 }}
        className="card-professional p-6 flex flex-col justify-between"
    >
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${colorClass.replace('text-', 'bg-').split(' ')[0]}/10 ${colorClass}`}>
                <Icon size={24} strokeWidth={2.5} />
            </div>
        </div>
        <div>
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{title}</h3>
            <p className="text-2xl font-black text-slate-800 tracking-tight leading-none">{value}</p>
        </div>
    </motion.div>
);

const ExpensesView: React.FC<ExpensesViewProps> = ({ expenses, accounts, addExpense }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const sortedExpenses = useMemo(() => {
    return [...expenses]
      .filter(exp => exp.description.toLowerCase().includes(searchTerm.toLowerCase()) || exp.category?.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, searchTerm]);
  
  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedExpenses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedExpenses, currentPage]);

  const totalPages = Math.ceil(sortedExpenses.length / ITEMS_PER_PAGE);

  const totalExpenseAmount = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
  const thisMonthExpenses = useMemo(() => {
      const now = new Date();
      return expenses
        .filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const handleSave = (expenseData: Omit<Expense, 'id'>) => {
    addExpense(expenseData);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
                <span className="w-8 h-1 bg-rose-500 rounded-full"></span>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-500 opacity-80">Expenditure Tracker</span>
            </div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">سجل المصروفات</h2>
            <p className="text-slate-400 font-medium text-sm">تتبع النفقات التشغيلية والتكاليف الجانبية للمشروع.</p>
          </div>

          <button onClick={() => setIsModalOpen(true)} className="btn-primary bg-rose-500 hover:bg-rose-600 shadow-xl shadow-rose-500/20 py-3 px-6">
              <Plus size={20} strokeWidth={3} />
              تسجيل مصروف جديد
          </button>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="إجمالي المصاريف" value={totalExpenseAmount.toLocaleString()} icon={TrendingDown} colorClass="text-rose-500" />
        <StatCard title="مصاريف الشهر" value={thisMonthExpenses.toLocaleString()} icon={Calendar} colorClass="text-indigo-600" />
        <StatCard title="أكبر حساب صرف" value={accounts[0]?.name || 'كاش'} icon={Wallet} colorClass="text-emerald-600" />
        <StatCard title="عدد القيود" value={expenses.length} icon={Receipt} colorClass="text-sky-600" />
      </div>

      <div className="card-professional bg-white overflow-hidden">
          {/* Controls Bar */}
          <div className="p-6 lg:p-8 border-b border-slate-50 flex flex-col lg:flex-row justify-between items-center gap-6">
              <div className="relative group w-full lg:w-96">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-400 transition-colors" size={18} />
                  <input 
                      type="text" 
                      placeholder="ابحث بالبيان أو التصنيف..." 
                      value={searchTerm} 
                      onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 pr-12 pl-4 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                  />
              </div>
              <div className="flex items-center gap-3">
                  <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-2">
                      <Filter size={16} />
                      Filter Category
                  </button>
              </div>
          </div>

          <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-right border-collapse">
                  <thead>
                      <tr className="bg-slate-50/50">
                          <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">التاريخ</th>
                          <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">البيان / الوصف</th>
                          <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">التصنيف</th>
                          <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">المصدر المالي</th>
                          <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left">المبلغ الافتراضي</th>
                          <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">إجراءات</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      <AnimatePresence mode="popLayout">
                          {paginatedExpenses.map((expense, idx) => (
                              <motion.tr 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.03 }}
                                key={expense.id} 
                                className="group hover:bg-slate-50/50 transition-colors"
                              >
                                  <td className="p-5">
                                      <div className="flex flex-col">
                                          <span className="font-black text-slate-800 text-sm tracking-tight">{new Date(expense.date).toLocaleDateString('ar-EG')}</span>
                                          <span className="text-[10px] text-slate-400 font-bold tabular-nums uppercase">{new Date(expense.date).toLocaleDateString('en-GB', {weekday: 'short'})}</span>
                                      </div>
                                  </td>
                                  <td className="p-5">
                                      <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                                              <ArrowDownRight size={18} strokeWidth={3} />
                                          </div>
                                          <span className="font-black text-slate-700 text-base tracking-tight">{expense.description}</span>
                                      </div>
                                  </td>
                                  <td className="p-5 text-center">
                                      <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                          {expense.category || 'عام'}
                                      </span>
                                  </td>
                                  <td className="p-5">
                                      <div className="flex items-center gap-2 text-slate-600">
                                          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                              <Wallet size={14} />
                                          </div>
                                          <span className="text-sm font-bold">{accounts.find(a => a.id === expense.accountId)?.name || 'الخزينة الرئيسية'}</span>
                                      </div>
                                  </td>
                                  <td className="p-5 text-left text-lg font-black text-rose-500 tabular-nums">
                                      {expense.amount.toLocaleString()}
                                  </td>
                                  <td className="p-5">
                                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button className="p-2.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                                              <Edit3 size={18} />
                                          </button>
                                          <button className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
                                              <Trash2 size={18} />
                                          </button>
                                          <button className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                                              <MoreVertical size={18} />
                                          </button>
                                      </div>
                                  </td>
                              </motion.tr>
                          ))}
                      </AnimatePresence>
                  </tbody>
              </table>
          </div>

          <div className="p-6 lg:p-8 flex flex-col sm:flex-row justify-between items-center gap-6 border-t border-slate-50">
              <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  Showing {paginatedExpenses.length} to {sortedExpenses.length} of {expenses.length} Records
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={ITEMS_PER_PAGE} totalItems={sortedExpenses.length} />
          </div>
      </div>

      <AnimatePresence>
          {isModalOpen && (
            <ExpenseModal
              onClose={() => setIsModalOpen(false)}
              onSave={handleSave}
              accounts={accounts}
            />
          )}
      </AnimatePresence>
    </div>
  );
};

const ExpenseModal: React.FC<{
  onClose: () => void;
  onSave: (expense: Omit<Expense, 'id'>) => void;
  accounts: FinancialAccount[];
}> = ({ onClose, onSave, accounts }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState(accounts.find(a => a.type === 'cash')?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};
    if (!description.trim()) newErrors.description = 'البيان مطلوب.';
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) newErrors.amount = 'المبلغ يجب أن يكون رقماً موجباً.';
    if (!accountId) newErrors.accountId = 'يجب تحديد حساب الدفع.';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSave({ description, amount: parseFloat(amount), category, date: new Date(date).toISOString(), accountId });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="تسجيل مصروف تجاري" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">البيان / الوصف</label>
                <div className="relative">
                    <Receipt className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                        type="text" 
                        value={description} 
                        onChange={e => setDescription(e.target.value)}
                        className={`w-full bg-slate-50 border rounded-xl py-3 pr-12 pl-4 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-bold text-slate-700 ${errors.description ? 'border-rose-500' : 'border-slate-200'}`}
                        placeholder="ما هو الغرض من هذا المصروف؟"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">المبلغ المالي</label>
                   <div className="relative">
                    <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-500" size={18} />
                    <input 
                        type="number" 
                        value={amount} 
                        onChange={e => setAmount(e.target.value)}
                        className={`w-full bg-slate-50 border rounded-xl py-3 pr-12 pl-4 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-black text-xl text-rose-500 ${errors.amount ? 'border-rose-500' : 'border-slate-200'}`}
                        placeholder="0.00"
                    />
                   </div>
                </div>
                
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">التاريخ</label>
                  <div className="relative">
                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                    <input 
                        type="date" 
                        value={date} 
                        onChange={e => setDate(e.target.value)} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-12 pl-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                    />
                  </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">مصدر الدفع</label>
                  <div className="relative">
                    <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                    <select 
                        value={accountId} 
                        onChange={e => setAccountId(e.target.value)} 
                        className={`w-full appearance-none bg-slate-50 border rounded-xl py-3 pr-12 pl-6 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-black text-xs uppercase tracking-widest text-slate-500 cursor-pointer ${errors.accountId ? 'border-rose-500' : 'border-slate-200'}`}
                    >
                        <option value="">-- اختر الحساب --</option>
                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </select>
                  </div>
                </div>
                
                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">التصنيف</label>
                   <div className="relative">
                    <Tag className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                        type="text" 
                        value={category} 
                        onChange={e => setCategory(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-12 pl-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                        placeholder="مثلاً: إيجار، رواتب، شحن"
                    />
                   </div>
                </div>
            </div>
        
        <div className="flex items-center justify-end gap-3 pt-8 mt-6 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors">إلغاء</button>
          <button type="submit" className="px-10 py-3 bg-rose-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95">تأكيد القيد</button>
        </div>
      </form>
    </Modal>
  );
};

export default ExpensesView;
