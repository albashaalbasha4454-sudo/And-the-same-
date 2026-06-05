import React, { useState, useMemo } from 'react';
import type { FinancialAccount, FinancialTransaction, Budget } from '../types';
import AccountModal from './AccountModal';
import FinancialTransactionModal from './FinancialTransactionModal';
import BudgetModal from './BudgetModal';
import { 
    Wallet, TrendingUp, TrendingDown, Repeat, 
    Plus, History, PiggyBank, ArrowRightLeft,
    Clock, DollarSign, CreditCard, ChevronRight,
    Target, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FinanceViewProps {
  accounts: FinancialAccount[];
  accountBalances: Map<string, number>;
  transactions: FinancialTransaction[];
  budgets: Budget[];
  onSaveAccount: (data: Omit<FinancialAccount, 'id'>) => void;
  onSaveTransaction: (data: any) => void;
  onSaveBudget: (data: Omit<Budget, 'id'>) => void;
}

const FinanceView: React.FC<FinanceViewProps> = ({ accounts, accountBalances, transactions, budgets, onSaveAccount, onSaveTransaction, onSaveBudget }) => {
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<any>('expense');

  const handleOpenTransactionModal = (type: any) => {
    setTransactionType(type);
    setIsTransactionModalOpen(true);
  };
  
  const budgetProgress = useMemo(() => {
    const progress = new Map<string, number>();
    budgets.forEach(b => {
        const fundedAmount = transactions
            .filter(tx => tx.category === `تمويل: ${b.name}` && tx.type === 'transfer')
            .reduce((sum, tx) => sum + tx.amount, 0);
        progress.set(b.id, fundedAmount);
    });
    return progress;
  }, [budgets, transactions]);
  
  const getTransactionDescription = (tx: FinancialTransaction): string => {
    const from = accounts.find(a => a.id === tx.fromAccountId)?.name;
    const to = accounts.find(a => a.id === tx.toAccountId)?.name;
    switch(tx.type) {
        case 'sale_income': return `إيراد مبيعات ${tx.description}`;
        case 'expense': return `مصروف: ${tx.description} (من ${from})`;
        case 'expense_reversal': return `إلغاء مصروف: ${tx.description} (إلى ${to})`;
        case 'capital_deposit': return `إيداع رأس مال في ${to}`;
        case 'profit_withdrawal': return `سحب أرباح من ${from}`;
        case 'supplier_payment': return `دفعة لمورد من ${from}`;
        case 'transfer': return `تحويل من ${from} إلى ${to}`;
        default: return tx.description;
    }
  }


  return (
    <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
                <span className="w-8 h-1 bg-indigo-600 rounded-full"></span>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 opacity-80">Economic Hub</span>
            </div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">الإدارة المالية</h2>
            <p className="text-slate-400 font-medium text-sm">مراكز التكلفة، الحسابات البنكية، والميزانيات التشغيلية.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Content Area */}
            <div className="lg:col-span-8 space-y-8">
                {/* Accounts Section */}
                <div className="card-professional p-8 bg-white overflow-visible">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">أرصدة الحسابات</h3>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Financial Liquidity</p>
                        </div>
                        <button onClick={() => setIsAccountModalOpen(true)} className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 px-3 py-2 rounded-xl transition-all">
                            <Plus size={16} strokeWidth={3} />
                            إضافة حساب
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {accounts.map(acc => (
                            <motion.div 
                                key={acc.id} 
                                whileHover={{ scale: 1.02 }}
                                className="p-6 bg-slate-50/50 border border-slate-200/60 rounded-2xl relative overflow-hidden group"
                            >
                                <div className="absolute left-0 top-0 w-1 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-white rounded-lg text-slate-400 shadow-sm border border-slate-100">
                                        <Wallet size={18} />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Current Balance</span>
                                </div>
                                <h4 className="font-black text-slate-800 text-lg mb-1">{acc.name}</h4>
                                <p className="text-3xl font-black text-indigo-600 tracking-tighter tabular-nums">
                                    {(accountBalances.get(acc.id) || 0).toLocaleString()}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Budgets Section */}
                <div className="card-professional p-8 bg-white">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">الميزانيات المستهدفة</h3>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Budget Allocation</p>
                        </div>
                        <button onClick={() => setIsBudgetModalOpen(true)} className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 px-3 py-2 rounded-xl transition-all">
                            <Target size={16} strokeWidth={3} />
                            تخصيص جديد
                        </button>
                    </div>

                    <div className="space-y-6">
                        {budgets.map(b => {
                            const funded = budgetProgress.get(b.id) || 0;
                            const percentage = b.targetAmount > 0 ? (funded / b.targetAmount) * 100 : 0;
                            const isLow = percentage < 25;
                            return (
                                <div key={b.id} className="group">
                                    <div className="flex justify-between items-end mb-3">
                                        <div>
                                            <span className="font-black text-slate-800 text-base tracking-tight">{b.name}</span>
                                            {isLow && (
                                                <div className="flex items-center gap-1 text-rose-500 text-[9px] font-black uppercase tracking-widest mt-1">
                                                    <AlertCircle size={10} strokeWidth={3} />
                                                    قرب النفاد
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-left">
                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1">Status: {percentage.toFixed(0)}%</span>
                                            <span className={`font-black tabular-nums text-sm ${isLow ? 'text-rose-500' : 'text-slate-800'}`}>
                                                {funded.toLocaleString()} / {b.targetAmount.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-50 h-3 rounded-full border border-slate-100 overflow-hidden shadow-inner">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(percentage, 100)}%` }}
                                            className={`h-full rounded-full ${isLow ? 'bg-gradient-to-l from-rose-500 to-rose-400' : 'bg-gradient-to-l from-indigo-600 to-indigo-500'} shadow-sm shadow-indigo-200`}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="card-professional bg-white overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">السجل المالي الأخير</h3>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Transaction History</p>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-xl text-slate-300">
                             <History size={20} />
                        </div>
                    </div>
                    <div className="overflow-x-auto scrollbar-hide">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">التاريخ</th>
                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">وصف العملية</th>
                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left">القيمة</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {[...transactions].reverse().slice(0, 10).map((tx, idx) => (
                                    <motion.tr 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={tx.id} 
                                        className="group hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="p-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300">
                                                    <Clock size={14} />
                                                </div>
                                                <span className="font-bold text-slate-600 text-xs tabular-nums text-right" dir="ltr">
                                                    {new Date(tx.date).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <p className="font-bold text-slate-700 text-sm">{getTransactionDescription(tx)}</p>
                                        </td>
                                        <td className="p-5 text-left">
                                            <span className={`text-base font-black tabular-nums ${tx.toAccountId && !tx.fromAccountId ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {tx.amount.toLocaleString()}
                                            </span>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Sidebar Column */}
            <div className="lg:col-span-4 space-y-6">
                <div className="card-professional p-8 bg-slate-900 border-0 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="relative z-10">
                        <h3 className="text-xl font-black text-white tracking-tight mb-8">إجراءات الخزانة</h3>
                        
                        <div className="space-y-3">
                            <button onClick={() => handleOpenTransactionModal('expense')} className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                                        <TrendingDown size={20} strokeWidth={3} />
                                    </div>
                                    <span className="text-white font-black text-xs uppercase tracking-widest">تسجيل مصروف</span>
                                </div>
                                <ChevronRight className="text-white/20 group-hover:text-white transition-all -ml-1" size={16} />
                            </button>

                            <button onClick={() => handleOpenTransactionModal('capital_deposit')} className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                        <TrendingUp size={20} strokeWidth={3} />
                                    </div>
                                    <span className="text-white font-black text-xs uppercase tracking-widest">إيداع رأس مال</span>
                                </div>
                                <ChevronRight className="text-white/20 group-hover:text-white transition-all -ml-1" size={16} />
                            </button>

                            <button onClick={() => handleOpenTransactionModal('profit_withdrawal')} className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                                        <PiggyBank size={20} strokeWidth={3} />
                                    </div>
                                    <span className="text-white font-black text-xs uppercase tracking-widest">سحب أرباح</span>
                                </div>
                                <ChevronRight className="text-white/20 group-hover:text-white transition-all -ml-1" size={16} />
                            </button>

                            <button onClick={() => handleOpenTransactionModal('transfer')} className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                                        <ArrowRightLeft size={20} strokeWidth={3} />
                                    </div>
                                    <span className="text-white font-black text-xs uppercase tracking-widest">تحويل داخلي</span>
                                </div>
                                <ChevronRight className="text-white/20 group-hover:text-white transition-all -ml-1" size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="card-professional p-6 bg-indigo-600 border-0 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)] pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col items-center text-center p-4">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white mb-4 backdrop-blur-sm group-hover:scale-110 transition-transform">
                            <DollarSign size={32} />
                        </div>
                        <h4 className="text-white font-black text-lg tracking-tight mb-2">الرصيد الموحد</h4>
                        <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-6">Total Combined Balance</p>
                        <span className="text-white text-4xl font-black tracking-tighter tabular-nums">
                            {Array.from(accountBalances.values()).reduce((sum: number, val: number) => sum + val, 0).toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <AnimatePresence>
            {isAccountModalOpen && (
                <AccountModal 
                    account={null} 
                    onClose={() => setIsAccountModalOpen(false)} 
                    onSave={onSaveAccount} 
                />
            )}
            {isTransactionModalOpen && (
                <FinancialTransactionModal 
                    type={transactionType} 
                    accounts={accounts} 
                    budgets={budgets} 
                    onClose={() => setIsTransactionModalOpen(false)} 
                    onSave={onSaveTransaction} 
                />
            )}
            {isBudgetModalOpen && (
                <BudgetModal 
                    onClose={() => setIsBudgetModalOpen(false)} 
                    onSave={onSaveBudget} 
                />
            )}
        </AnimatePresence>
    </div>
  );
};

export default FinanceView;
