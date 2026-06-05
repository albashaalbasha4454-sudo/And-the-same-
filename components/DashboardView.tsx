import React, { useMemo, useState, useEffect, useRef } from 'react';
import type { Invoice, Product, Expense, Customer } from '../types';
import { Chart, registerables } from 'chart.js';
import { motion } from 'motion/react';
import { 
    TrendingUp, Wallet, ShoppingBag, BarChart3, 
    AlertTriangle, History, Printer, Calendar,
    ArrowUpRight, ArrowDownRight, Package, DollarSign
} from 'lucide-react';

Chart.register(...registerables);

const StatCard = ({ title, value, icon: Icon, colorClass, subtext, trend }: { 
    title: string, 
    value: string | number, 
    icon: any, 
    colorClass: string, 
    subtext?: string,
    trend?: { value: string, isUp: boolean }
}) => {
    return (
        <motion.div 
            whileHover={{ y: -4 }}
            className="card-professional p-6 flex flex-col justify-between"
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${colorClass.replace('text-', 'bg-').split(' ')[0]}/10 ${colorClass}`}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${trend.isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {trend.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {trend.value}
                    </div>
                )}
            </div>
            <div>
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{title}</h3>
                <p className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">{value}</p>
                {subtext && <p className="text-[10px] text-slate-400 font-medium">{subtext}</p>}
            </div>
        </motion.div>
    );
};

const InfoListCard: React.FC<{ title: string; icon: any; children: React.ReactNode; }> = ({ title, icon: Icon, children }) => (
    <div className="card-professional flex flex-col h-full bg-white">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                    <Icon size={20} />
                </div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">{title}</h3>
            </div>
            <button className="text-[10px] font-bold text-indigo-600 hover:underline uppercase tracking-wider">عرض الكل</button>
        </div>
        <div className="flex-1 p-6 space-y-4 overflow-y-auto scrollbar-hide">
            {children}
        </div>
    </div>
);


const DashboardView: React.FC<{
  invoices: Invoice[];
  products: Product[];
  expenses: Expense[];
  customers: Customer[];
  lowStockThreshold: number;
}> = ({ invoices, products, expenses, customers, lowStockThreshold }) => {
  const [dateRange, setDateRange] = useState<'all' | '7' | '30'>('30');

  const profitExpenseChartRef = useRef<HTMLCanvasElement>(null);
  const chartInstances = useRef<{ [key: string]: Chart | null }>({});

  const {
    netSales, grossProfit, totalExpenses, netProfit, 
    pendingOrders, recentSales, lowStockProducts, dailyData,
    todayNetSales, todayProfit, totalCapital, grandTotal
  } = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const rangeStart = new Date();
    if (dateRange !== 'all') {
        rangeStart.setDate(today.getDate() - parseInt(dateRange));
    } else {
        rangeStart.setFullYear(1970);
    }
    rangeStart.setHours(0,0,0,0);
    
    const dateFilter = (itemDateStr: string | undefined) => {
        if (!itemDateStr) return false;
        const itemDate = new Date(itemDateStr);
        return itemDate >= rangeStart;
    };

    const isToday = (dateStr: string | undefined) => {
        if (!dateStr) return false;
        return dateStr.split('T')[0] === todayStr;
    };
    
    const completedSales = invoices.filter(inv => 
        (inv.type === 'sale' || (inv.type === 'shipping' && inv.status === 'completed' && inv.paymentStatus === 'paid')) && dateFilter(inv.paidDate)
    );

    const returns = invoices.filter(inv => inv.type === 'return' && dateFilter(inv.date));
    const filteredExpenses = expenses.filter(exp => dateFilter(exp.date));

    const totalSalesValue = completedSales.reduce((sum, inv) => sum + inv.total, 0);
    const totalReturnsValue = returns.reduce((sum, inv) => sum + inv.total, 0); 
    const netSales = totalSalesValue + totalReturnsValue;

    const cogs = completedSales.reduce((sum, inv) => sum + (inv.totalCost || 0), 0);
    const grossProfit = netSales - cogs;
    
    const totalExpensesValue = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const netProfit = grossProfit - totalExpensesValue;

    // Today's metrics
    const todaySales = invoices.filter(inv => 
        (inv.type === 'sale' || (inv.type === 'shipping' && inv.status === 'completed' && inv.paymentStatus === 'paid')) && isToday(inv.paidDate)
    );
    const todayReturns = invoices.filter(inv => inv.type === 'return' && isToday(inv.date));
    const todayNetSales = todaySales.reduce((sum, inv) => sum + inv.total, 0) + todayReturns.reduce((sum, inv) => sum + inv.total, 0);
    const todayProfit = todaySales.reduce((sum, inv) => sum + (inv.totalProfit || 0), 0) + todayReturns.reduce((sum, inv) => sum + (inv.totalProfit || 0), 0);

    // Capital
    const totalCapital = products.reduce((sum, p) => sum + (p.costPrice || 0) * p.quantity, 0);
    
    // Grand Total (Capital + Net Profit for the selected range)
    const grandTotal = totalCapital + netProfit;
    
    const pendingOrders = invoices.filter(inv => inv.status === 'pending' && (inv.type === 'shipping' || inv.type === 'reservation')).length;

    const recentSales = invoices
        .filter(i => i.type === 'sale' || (i.type === 'shipping' && i.status === 'completed'))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
        
    const lowStockProducts = products
        .filter(p => (p.quantity > 0 || p.type === 'product') && p.quantity <= lowStockThreshold)
        .sort((a, b) => a.quantity - b.quantity);

    const dailyData: { [date: string]: { profit: number, expense: number } } = {};
     [...completedSales, ...returns].forEach(inv => {
        const day = new Date(inv.date).toISOString().split('T')[0];
        if (!dailyData[day]) dailyData[day] = { profit: 0, expense: 0 };
        dailyData[day].profit += inv.totalProfit || 0;
    });
    filteredExpenses.forEach(exp => {
        const day = new Date(exp.date).toISOString().split('T')[0];
        if (!dailyData[day]) dailyData[day] = { profit: 0, expense: 0 };
        dailyData[day].expense += exp.amount;
    });

    return {
        netSales, grossProfit, totalExpenses: totalExpensesValue, netProfit, 
        pendingOrders, recentSales, lowStockProducts,
        dailyData, todayNetSales, todayProfit, totalCapital, grandTotal
    };
  }, [invoices, expenses, products, lowStockThreshold, dateRange]);

  const [printContent, setPrintContent] = useState<{ title: string, items: any[], type: 'sales' | 'profit' | 'expenses' } | null>(null);

  const handlePrint = (type: 'sales' | 'profit' | 'expenses') => {
      let title = "";
      let items: any[] = [];
      
      if (type === 'sales') {
          title = `تقرير المبيعات - ${dateRangeText}`;
          items = invoices.filter(inv => (inv.type === 'sale' || (inv.type === 'shipping' && inv.status === 'completed')) && (dateRange === 'all' || new Date(inv.date) >= new Date(new Date().setDate(new Date().getDate() - parseInt(dateRange)))));
      } else if (type === 'profit') {
          title = `تقرير الأرباح اليومي - ${new Date().toLocaleDateString()}`;
          items = invoices.filter(inv => (inv.type === 'sale' || (inv.type === 'shipping' && inv.status === 'completed')) && inv.date.split('T')[0] === new Date().toISOString().split('T')[0]);
      } else if (type === 'expenses') {
          title = `تقرير المصروفات - ${dateRangeText}`;
          items = expenses.filter(exp => (dateRange === 'all' || new Date(exp.date) >= new Date(new Date().setDate(new Date().getDate() - parseInt(dateRange)))));
      }

      setPrintContent({ title, items, type });
      setTimeout(() => {
          window.print();
          setPrintContent(null);
      }, 100);
  };

  useEffect(() => {
    Object.keys(chartInstances.current).forEach(key => chartInstances.current[key]?.destroy());
    
    const ctx = profitExpenseChartRef.current?.getContext('2d');
    if (ctx) {
        const sortedDays = Object.keys(dailyData).sort();
        
        // Gradient for charts
        const profitGradient = ctx.createLinearGradient(0, 0, 0, 400);
        profitGradient.addColorStop(0, 'rgba(79, 70, 229, 0.2)');
        profitGradient.addColorStop(1, 'rgba(79, 70, 229, 0)');

        const expenseGradient = ctx.createLinearGradient(0, 0, 0, 400);
        expenseGradient.addColorStop(0, 'rgba(239, 68, 68, 0.1)');
        expenseGradient.addColorStop(1, 'rgba(239, 68, 68, 0)');

        chartInstances.current['profitExpense'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedDays.map(d => new Date(d).toLocaleDateString('ar-EG', {month: 'short', day: 'numeric'})),
                datasets: [
                {
                    label: 'إجمالي الربح',
                    data: sortedDays.map(day => dailyData[day].profit),
                    borderColor: '#4F46E5',
                    borderWidth: 3,
                    backgroundColor: profitGradient,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#4F46E5',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2,
                },
                {
                    label: 'المصروفات',
                    data: sortedDays.map(day => dailyData[day].expense),
                    borderColor: '#EF4444',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    backgroundColor: expenseGradient,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                }
                ],
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        align: 'end',
                        labels: {
                            usePointStyle: true,
                            boxWidth: 8,
                            padding: 20,
                            font: { family: 'Cairo', weight: 'bold', size: 12 }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: '#1E293B',
                        titleFont: { family: 'Cairo', size: 14 },
                        bodyFont: { family: 'Cairo', size: 12 },
                        padding: 12,
                        cornerRadius: 12,
                    }
                },
                scales: { 
                    y: { 
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.03)', drawTicks: false },
                        border: { display: false },
                        ticks: { color: '#94a3b8', font: { size: 10, weight: 'bold' } }
                    },
                    x: {
                        grid: { display: false },
                        border: { display: false },
                        ticks: { color: '#94a3b8', font: { size: 10, weight: 'bold' } }
                    }
                } 
            }
        });
    }
    
    return () => {
        Object.keys(chartInstances.current).forEach(key => chartInstances.current[key]?.destroy());
    }
  }, [dailyData]);
  
  const dateRangeText = dateRange === 'all' ? 'كل الأوقات' : `آخر ${dateRange} يوم`;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
                <span className="w-8 h-1 bg-indigo-600 rounded-full"></span>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 opacity-80">Overview 2026</span>
            </div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">نظرة عامة</h2>
            <p className="text-slate-400 font-medium text-sm">تحليلات دقيقة لأداء مبيعاتك ومخزونك.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 bg-white/50 backdrop-blur-sm p-1.5 rounded-2xl border border-slate-200/60 shadow-sm">
                <button onClick={() => setDateRange('7')} className={`px-5 py-2 rounded-xl text-xs font-black tracking-tight transition-all ${dateRange === '7' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}>7 أيام</button>
                <button onClick={() => setDateRange('30')} className={`px-5 py-2 rounded-xl text-xs font-black tracking-tight transition-all ${dateRange === '30' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}>30 يوم</button>
                <button onClick={() => setDateRange('all')} className={`px-5 py-2 rounded-xl text-xs font-black tracking-tight transition-all ${dateRange === 'all' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}>الكل</button>
          </div>
      </div>
      
      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-5">
        <StatCard title="مبيعات اليوم" value={`${todayNetSales.toLocaleString()}`} icon={Calendar} colorClass="text-emerald-600" trend={{ value: "12%", isUp: true }} />
        <StatCard title="ربح اليوم" value={`${todayProfit.toLocaleString()}`} icon={Wallet} colorClass="text-indigo-600" />
        <StatCard title="صافي المبيعات" value={`${netSales.toLocaleString()}`} icon={BarChart3} colorClass="text-indigo-600" subtext={dateRangeText} />
        <StatCard title="إجمالي الربح" value={`${grossProfit.toLocaleString()}`} icon={TrendingUp} colorClass="text-sky-600" subtext={dateRangeText} />
        <StatCard title="المصروفات" value={`${totalExpenses.toLocaleString()}`} icon={ShoppingBag} colorClass="text-rose-500" subtext={dateRangeText} trend={{ value: "5%", isUp: false }} />
        <StatCard title="صافي الربح" value={`${netProfit.toLocaleString()}`} icon={TrendingUp} colorClass={netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'} subtext={dateRangeText}/>
        <StatCard title="قيمة المخزون" value={`${totalCapital.toLocaleString()}`} icon={Package} colorClass="text-amber-600" subtext="رأس المال العامل" />
        <StatCard title="القيمة الكلية" value={`${grandTotal.toLocaleString()}`} icon={DollarSign} colorClass="text-violet-600" subtext="إجمالي الأصول" />
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => handlePrint('sales')} className="btn-primary py-2 px-5 bg-white border border-slate-200 !text-slate-600 hover:bg-slate-50 shadow-none ring-1 ring-slate-200">
              <Printer size={18} className="text-indigo-600" />
              طباعة المبيعات
          </button>
          <button onClick={() => handlePrint('profit')} className="btn-primary py-2 px-5 bg-white border border-slate-200 !text-slate-600 hover:bg-slate-50 shadow-none ring-1 ring-slate-200">
              <Printer size={18} className="text-emerald-600" />
              تقرير الأرباح
          </button>
          <button onClick={() => handlePrint('expenses')} className="btn-primary py-2 px-5 bg-white border border-slate-200 !text-slate-600 hover:bg-slate-50 shadow-none ring-1 ring-slate-200">
              <Printer size={18} className="text-rose-600" />
              المصروفات
          </button>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 card-professional p-8 bg-white overflow-hidden relative group">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">تحليل التدفق المالي</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Cash Flow Analytics</p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-indigo-600"></span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">الأرباح</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">المصروفات</span>
                    </div>
                </div>
            </div>
            <div className="relative h-[340px] w-full">
                <canvas ref={profitExpenseChartRef}></canvas>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-8">
             <InfoListCard title="تنبيهات المخزون" icon={AlertTriangle}>
                 {lowStockProducts.length > 0 ? lowStockProducts.map(p => (
                     <div key={p.id} className="group cursor-default flex justify-between items-center p-3 rounded-xl hover:bg-amber-50/50 transition-colors border border-transparent hover:border-amber-100">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 font-bold text-xs uppercase">
                                {p.name.charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-slate-800 text-sm tracking-tight">{p.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Category: Book</p>
                            </div>
                         </div>
                         <div className="text-left">
                            <span className="block text-rose-500 font-black text-sm">{p.quantity} <span className="text-[10px]">قطعة</span></span>
                            <span className="text-[10px] text-slate-300 font-bold uppercase">Critical</span>
                         </div>
                     </div>
                 )) : <p className="text-slate-300 text-center py-10 italic">المخزون مستقر حالياً.</p>}
             </InfoListCard>

             <InfoListCard title="آخر الحركات" icon={History}>
                 {recentSales.map(inv => (
                     <div key={inv.id} className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 transition-colors">
                         <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs ${inv.type === 'sale' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                {inv.type === 'sale' ? 'SAL' : 'SHP'}
                            </div>
                            <div>
                                <p className="font-bold text-slate-800 text-sm tracking-tight truncate max-w-[120px]">{inv.customerInfo?.name || "عميل عابر"}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{new Date(inv.date).toLocaleDateString('en-GB')}</p>
                            </div>
                         </div>
                         <div className="text-left">
                            <span className="block font-black text-slate-700 text-sm">{inv.total.toLocaleString()}</span>
                            <span className="text-[10px] text-emerald-500 font-bold uppercase">Success</span>
                         </div>
                     </div>
                 ))}
             </InfoListCard>
          </div>
      </div>

      {/* Printable Area */}
      {printContent && (
          <div id="print-area" className="p-12 bg-white text-right font-sans" dir="rtl">
              <div className="flex justify-between items-center border-b-4 border-slate-800 pb-8 mb-12">
                  <div>
                    <h1 className="text-4xl font-black text-slate-800 mb-2">{printContent.title}</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Generated by Melent Systems v2.0</p>
                  </div>
                  <div className="text-left">
                    <p className="text-xl font-bold">التاريخ: {new Date().toLocaleDateString('ar-EG')}</p>
                    <p className="text-slate-400 text-sm font-medium">الوقت: {new Date().toLocaleTimeString('ar-EG')}</p>
                  </div>
              </div>
              
              <table className="w-full border-collapse">
                  <thead>
                      <tr className="bg-slate-100/50">
                          <th className="p-4 border-b-2 border-slate-800 text-right font-black uppercase text-xs tracking-wider">التاريخ</th>
                          <th className="p-4 border-b-2 border-slate-800 text-right font-black uppercase text-xs tracking-wider">البيان / الوصف</th>
                          <th className="p-4 border-b-2 border-slate-800 text-left font-black uppercase text-xs tracking-wider">المبلغ</th>
                          {printContent.type === 'profit' && <th className="p-4 border-b-2 border-slate-800 text-left font-black uppercase text-xs tracking-wider">الربح</th>}
                      </tr>
                  </thead>
                  <tbody>
                      {printContent.items.map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-100">
                              <td className="p-4 font-bold text-slate-600 italic">{new Date(item.date).toLocaleDateString()}</td>
                              <td className="p-4 font-black text-slate-800">
                                  {printContent.type === 'expenses' ? item.description : (item.customerInfo?.name || "بيع مباشر")}
                              </td>
                              <td className="p-4 text-left font-bold text-slate-700">{(item.total ?? item.amount ?? 0).toLocaleString()}</td>
                              {printContent.type === 'profit' && <td className="p-4 text-left font-black text-emerald-600">{item.totalProfit?.toLocaleString()}</td>}
                          </tr>
                      ))}
                  </tbody>
                  <tfoot>
                      <tr className="bg-slate-900 text-white font-black">
                          <td colSpan={2} className="p-6 text-right uppercase tracking-[0.2em]">الإجمالي النهائي:</td>
                          <td className="p-6 text-left text-xl">
                              {printContent.items.reduce((sum, i) => sum + (i.total ?? i.amount ?? 0), 0).toLocaleString()}
                          </td>
                          {printContent.type === 'profit' && (
                              <td className="p-6 text-left text-xl text-emerald-400">
                                  {printContent.items.reduce((sum, i) => sum + (i.totalProfit || 0), 0).toLocaleString()}
                              </td>
                          )}
                      </tr>
                  </tfoot>
              </table>
              
              <div className="mt-20 flex justify-between">
                  <div className="text-center w-64 border-t-2 border-slate-200 pt-4">
                      <p className="font-bold text-slate-400 uppercase text-xs mb-2">Approved By</p>
                      <p className="font-black text-slate-800">توقيع المسؤول</p>
                  </div>
                   <div className="text-center w-64 border-t-2 border-slate-200 pt-4">
                      <p className="font-bold text-slate-400 uppercase text-xs mb-2">Audit Verification</p>
                      <p className="font-black text-slate-800">ختم المؤسسة</p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default DashboardView;
