import React, { useMemo, useState, useEffect, useRef } from 'react';
import type { Invoice, Product, Expense } from '../types';
import { Chart, registerables } from 'chart.js';
import InputField from './common/InputField';
import { 
    TrendingUp, Wallet, ShoppingBag, BarChart3, 
    Calendar, ArrowUpRight, ArrowDownRight, Package,
    Layers, Filter, Clock, Activity, Printer, Star, FileDown
} from 'lucide-react';
import { motion } from 'motion/react';

Chart.register(...registerables);

const StatCard = ({ title, value, icon: Icon, colorClass, subtext, trend }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    colorClass: string; 
    subtext?: string;
    trend?: { value: string; isUp: boolean }
}) => (
    <motion.div 
        whileHover={{ y: -4 }}
        className="card-professional p-6 flex flex-col justify-between bg-white border border-slate-250/60 shadow-sm rounded-2xl"
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
            {subtext && <p className="text-[10px] text-slate-400 font-bold">{subtext}</p>}
        </div>
    </motion.div>
);

const ChartCard: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
    <div className="card-professional bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm h-96">
        <div className="mb-4">
            <h3 className="text-lg font-black text-slate-800 tracking-tight">{title}</h3>
            {subtitle && <p className="text-[10px] text-slate-400 font-bold mt-0.5">{subtitle}</p>}
        </div>
        <div className="relative h-72">{children}</div>
    </div>
);

const ReportsView: React.FC<{
  invoices: Invoice[];
  products: Product[];
  expenses: Expense[];
}> = ({ invoices, products, expenses }) => {
  const today = new Date().toISOString().split('T')[0];
  
  // States of filter
  const [timePeriod, setTimePeriod] = useState<'today' | 'weekly' | 'monthly' | 'custom'>('monthly');
  const [startDate, setStartDate] = useState(() => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(today);
  const [graphInterval, setGraphInterval] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const salesByCategoryChartRef = useRef<HTMLCanvasElement>(null);
  const topProductsChartRef = useRef<HTMLCanvasElement>(null);
  const profitExpenseChartRef = useRef<HTMLCanvasElement>(null);
  const chartInstances = useRef<{ [key: string]: any }>({});

  // Sync date ranges with quick filter selections
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (timePeriod === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (timePeriod === 'weekly') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (timePeriod === 'monthly') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(todayStr);
    }
  }, [timePeriod]);

  // Grouped datasets based on current date range
  const filteredData = useMemo(() => {
    const start = startDate ? new Date(startDate) : new Date('1970-01-01');
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999); // Include the entire end date

    const salesInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.paidDate || inv.date);
        const matchesType = inv.type === 'sale' || (inv.type === 'shipping' && inv.status === 'completed');
        return matchesType && invDate >= start && invDate <= end;
    });
    
    const filteredExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= start && expDate <= end;
    });

    return { salesInvoices, filteredExpenses };
  }, [invoices, expenses, startDate, endDate]);

  // Dynamic Statistics
  const reportStats = useMemo(() => {
    const { salesInvoices, filteredExpenses } = filteredData;
    const totalSales = salesInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalCost = salesInvoices.reduce((sum, inv) => sum + (inv.totalCost || 0), 0);
    const totalProfit = salesInvoices.reduce((sum, inv) => sum + (inv.totalProfit || 0), 0);
    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const netProfit = totalProfit - totalExpenses;
    
    return { totalSales, totalCost, totalProfit, totalExpenses, netProfit };
  }, [filteredData]);

  // Aggregate Top-Selling Products list with Rank
  const bestSellersSummary = useMemo(() => {
    const { salesInvoices } = filteredData;
    const productSales: { [key: string]: { id: string, name: string, quantity: number, category: string, total: number, profit: number } } = {};
    
    salesInvoices.forEach(inv => {
        inv.items.forEach(item => {
            const itemTotal = (item.price - (item.discount || 0)) * item.quantity;
            const itemCost = (item.costPrice || 0) * item.quantity;
            const itemProfit = itemTotal - itemCost;
            
            const product = products.find(p => p.id === item.productId);
            const category = product?.category || 'غير مصنف';
            
            if (!productSales[item.productId]) {
                productSales[item.productId] = { 
                    id: item.productId, 
                    name: item.productName, 
                    quantity: 0, 
                    category, 
                    total: 0, 
                    profit: 0 
                };
            }
            productSales[item.productId].quantity += item.quantity;
            productSales[item.productId].total += itemTotal;
            productSales[item.productId].profit += itemProfit;
        });
    });
    
    return Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10); // Top 10 best-selling
  }, [filteredData, products]);


  // Cleanup charts
  useEffect(() => {
    return () => {
        Object.keys(chartInstances.current).forEach(key => {
            const chart = chartInstances.current[key];
            if (chart) chart.destroy();
        });
    };
  }, []);

  // Update charts inside effect
  useEffect(() => {
    Object.keys(chartInstances.current).forEach(key => {
        const chart = chartInstances.current[key];
        if (chart) chart.destroy();
    });
    const { salesInvoices, filteredExpenses } = filteredData;

    // --- Chart 1: Sales by Category ---
    const salesByCategoryCtx = salesByCategoryChartRef.current?.getContext('2d');
    if (salesByCategoryCtx) {
        const categorySales: { [key: string]: number } = {};
        salesInvoices.forEach(inv => {
            inv.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                const category = product?.category || 'غير مصنف';
                const itemTotal = (item.price - (item.discount || 0)) * item.quantity;
                categorySales[category] = (categorySales[category] || 0) + itemTotal;
            });
        });
        const labels = Object.keys(categorySales);
        const data = Object.values(categorySales);

        chartInstances.current.salesByCategory = new Chart(salesByCategoryCtx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    label: 'المبيعات حسب التصنيف',
                    data,
                    backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#6b7280'],
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            font: { family: 'Cairo', size: 10, weight: 'bold' }
                        }
                    }
                }
            }
        });
    }

    // --- Chart 2: Top Selling Products (Visual representation) ---
    const topProductsCtx = topProductsChartRef.current?.getContext('2d');
    if (topProductsCtx) {
        const topProductsData = bestSellersSummary.slice(0, 5);

        chartInstances.current.topProducts = new Chart(topProductsCtx, {
            type: 'bar',
            data: {
                labels: topProductsData.map(p => p.name.length > 20 ? p.name.substring(0, 18) + '...' : p.name),
                datasets: [{
                    label: 'الكمية المباعة',
                    data: topProductsData.map(p => p.quantity),
                    backgroundColor: '#4f46e5',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: { font: { family: 'Cairo', size: 10 } }
                    },
                    y: {
                        ticks: { font: { family: 'Cairo', size: 10, weight: 'bold' } }
                    }
                }
            }
        });
    }

    // --- Chart 3: Profit vs Expense (Interval aggregations) ---
    const profitExpenseCtx = profitExpenseChartRef.current?.getContext('2d');
    if (profitExpenseCtx) {
        // Date helpers for labels
        const getWeekRangeLabel = (date: Date) => {
            const d = new Date(date);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const startOfWeek = new Date(d.setDate(diff));
            const endOfWeek = new Date(d.setDate(diff + 6));
            return `${startOfWeek.getMonth() + 1}/${startOfWeek.getDate()} - ${endOfWeek.getMonth() + 1}/${endOfWeek.getDate()}`;
        };

        const getMonthLabel = (date: Date) => {
            return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short' });
        };

        const intervalData: { [key: string]: { profit: number, expense: number } } = {};
        
        salesInvoices.forEach(inv => {
            const dateObj = new Date(inv.paidDate || inv.date);
            let key = '';
            if (graphInterval === 'daily') {
                key = dateObj.toISOString().split('T')[0];
            } else if (graphInterval === 'weekly') {
                key = getWeekRangeLabel(dateObj);
            } else {
                key = getMonthLabel(dateObj);
            }
            if (!intervalData[key]) intervalData[key] = { profit: 0, expense: 0 };
            intervalData[key].profit += inv.totalProfit || 0;
        });

        filteredExpenses.forEach(exp => {
            const dateObj = new Date(exp.date);
            let key = '';
            if (graphInterval === 'daily') {
                key = dateObj.toISOString().split('T')[0];
            } else if (graphInterval === 'weekly') {
                key = getWeekRangeLabel(dateObj);
            } else {
                key = getMonthLabel(dateObj);
            }
            if (!intervalData[key]) intervalData[key] = { profit: 0, expense: 0 };
            intervalData[key].expense += exp.amount;
        });

        const sortedKeys = Object.keys(intervalData);
        if (graphInterval === 'daily') {
            sortedKeys.sort((a, b) => a.localeCompare(b));
        }

        const labels = sortedKeys.map(key => {
            if (graphInterval === 'daily') {
                return new Date(key).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
            }
            return key;
        });

        chartInstances.current.profitExpense = new Chart(profitExpenseCtx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'إجمالي أرباح البيع',
                        data: sortedKeys.map(key => intervalData[key].profit),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.05)',
                        fill: true,
                        tension: 0.2,
                        borderWidth: 3
                    },
                    {
                        label: 'نفقات ومصروفات',
                        data: sortedKeys.map(key => intervalData[key].expense),
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.05)',
                        fill: true,
                        tension: 0.2,
                        borderWidth: 3
                    }
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { font: { family: 'Cairo', weight: 'bold', size: 11 } }
                    }
                }
            }
        });
    }

  }, [filteredData, products, graphInterval, bestSellersSummary]);

  const exportFinancialSummaryToCSV = () => {
    const headers = ["البند", "القيمة (د.أ)", "تفاصيل إضافية / الفترة الزمنية"];
    const rows = [
      ["فترة التقرير", periodLabelText, `${startDate} إلى ${endDate}`],
      ["إجمالي المبيعات", reportStats.totalSales.toFixed(2), "مجموع إيرادات المبيعات المحققة"],
      ["إجمالي تكلفة المبيعات", reportStats.totalCost.toFixed(2), "التكلفة التقديرية للبضاعة المباعة"],
      ["إجمالي أرباح البيع", reportStats.totalProfit.toFixed(2), "المبيعات الإجمالية ناقص التكلفة"],
      ["إجمالي النفقات والمصروفات", reportStats.totalExpenses.toFixed(2), "النفقات والمصاريف التشغيلية المسجلة"],
      ["صافي الأرباح المتبقية", reportStats.netProfit.toFixed(2), "الأرباح الفعلية النهائية بعد خصم النفقات"],
    ];

    rows.push(["", "", ""]);
    rows.push(["سجل الفواتير خلال هذه الفترة", "", ""]);
    rows.push(["رقم الفاتورة", "التاريخ والوقت", "الصافي الإجمالي"]);
    filteredData.salesInvoices.forEach(inv => {
      rows.push([
        inv.id.substring(0, 8).toUpperCase(),
        new Date(inv.date).toLocaleString('ar-JO'),
        inv.total.toFixed(2)
      ]);
    });

    rows.push(["", "", ""]);
    rows.push(["سجل النفقات خلال هذه الفترة", "", ""]);
    rows.push(["عنوان النفقة", "التاريخ اليومي", "القيمة"]);
    filteredData.filteredExpenses.forEach(exp => {
      rows.push([
        exp.description,
        new Date(exp.date).toLocaleDateString('ar-JO'),
        exp.amount.toFixed(2)
      ]);
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `التقرير_المالي_المفصل_${startDate}_إلى_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportBestSellersToCSV = () => {
    const headers = ["الترتيب", "الكتاب أو الصنف", "التصنيف", "الكمية المباعة", "إجمالي المبيعات (د.أ)", "أرباح المبيعات (د.أ)"];
    const rows = bestSellersSummary.map((item, index) => [
      (index + 1).toString(),
      item.name,
      item.category,
      item.quantity.toString(),
      item.total.toFixed(2),
      item.profit.toFixed(2)
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `تقرير_الأكثر_مبيعا_${startDate}_إلى_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const periodLabelText = timePeriod === 'today' ? 'اليوم' : timePeriod === 'weekly' ? 'آخر 7 أيام' : timePeriod === 'monthly' ? 'آخر 30 يوم' : 'مخصص';

  return (
    <div className="space-y-8 p-1 sm:p-2">
      {/* Upper header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
                <span className="w-8 h-1 bg-indigo-600 rounded-full"></span>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 opacity-80">Financial Analytics</span>
            </div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">التقارير المالية</h2>
            <p className="text-slate-400 font-medium text-sm">تتبع المبيعات، الأرباح، والمنتجات الأكثر طلباً في متجرك.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
             <button 
                onClick={exportFinancialSummaryToCSV} 
                className="btn-primary py-2.5 px-4 bg-emerald-600 hover:bg-emerald-550 text-white rounded-xl shadow-md transition-all font-bold flex items-center gap-2 text-xs"
             >
                <FileDown size={16} />
                تصدير ملخص مالي (CSV)
             </button>
             
             <button 
                onClick={exportBestSellersToCSV} 
                className="btn-primary py-2.5 px-4 bg-emerald-700 hover:bg-emerald-650 text-white rounded-xl shadow-md transition-all font-bold flex items-center gap-2 text-xs"
             >
                <FileDown size={16} />
                تصدير الأكثر مبيعاً (CSV)
             </button>

             <button 
                onClick={handlePrint} 
                className="btn-primary py-2.5 px-5 bg-white border border-slate-200 !text-slate-600 hover:bg-slate-50 shadow-none ring-1 ring-slate-200 gap-2 text-xs font-bold"
             >
                <Printer size={16} className="text-indigo-600" />
                طباعة التقارير
             </button>
          </div>
      </div>

      {/* Primary Filtering Panel */}
      <div className="card-professional bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-2">
                <Filter className="text-indigo-600" size={18} />
                <h3 className="text-sm font-black text-slate-800">تحديد الفترة الزمنية للتقارير:</h3>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200/60 p-1.5 rounded-2xl">
                <button 
                    onClick={() => setTimePeriod('today')} 
                    className={`px-5 py-2 rounded-xl text-xs font-black tracking-tight transition-all ${timePeriod === 'today' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    يومية (اليوم)
                </button>
                <button 
                    onClick={() => setTimePeriod('weekly')} 
                    className={`px-5 py-2 rounded-xl text-xs font-black tracking-tight transition-all ${timePeriod === 'weekly' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    أسبوعية (7 أيام)
                </button>
                <button 
                    onClick={() => setTimePeriod('monthly')} 
                    className={`px-5 py-2 rounded-xl text-xs font-black tracking-tight transition-all ${timePeriod === 'monthly' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    شهرية (30 يوم)
                </button>
                <button 
                    onClick={() => setTimePeriod('custom')} 
                    className={`px-5 py-2 rounded-xl text-xs font-black tracking-tight transition-all ${timePeriod === 'custom' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    تاريخ مخصص
                </button>
            </div>
        </div>

        {timePeriod === 'custom' && (
            <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 border-t border-slate-100 pt-4"
            >
                <InputField id="startDate" label="تاريخ البداية" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                <InputField id="endDate" label="تاريخ النهاية" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </motion.div>
        )}
      </div>

      {/* Main KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title="إجمالي المبيعات" 
            value={`${reportStats.totalSales.toLocaleString()} د.أ`} 
            icon={BarChart3} 
            colorClass="text-indigo-600" 
            subtext={`مجموع إيرادات المبيعات خلال ${periodLabelText}`} 
        />
        <StatCard 
            title="إجمالي أرباح المنتجات" 
            value={`${reportStats.totalProfit.toLocaleString()} د.أ`} 
            icon={TrendingUp} 
            colorClass="text-emerald-500" 
            subtext={`العائد الإجمالي (المبيعات - التكلفة)`} 
        />
        <StatCard 
            title="إجمالي النفقات والمصروفات" 
            value={`${reportStats.totalExpenses.toLocaleString()} د.أ`} 
            icon={ShoppingBag} 
            colorClass="text-rose-500" 
            subtext={`المصروفات النثرية والتشغيلية`} 
        />
        <StatCard 
            title="صافي الأرباح المتبقية" 
            value={`${reportStats.netProfit.toLocaleString()} د.أ`} 
            icon={Wallet} 
            colorClass={reportStats.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'} 
            subtext={`الربح الفعلي النهائي بعد المصروفات`} 
        />
      </div>

      {/* Dual Column Layout: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Financial Flow Chart */}
          <div className="lg:col-span-8 card-professional bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm min-h-[400px]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                      <h3 className="text-xl font-black text-slate-800">التدفق المالي (الأرباح مقابل المصروفات)</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Profit & Expense Breakdown</p>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/50 p-1 rounded-xl">
                      <button 
                        onClick={() => setGraphInterval('daily')} 
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${graphInterval === 'daily' ? 'bg-white text-slate-800 shadow-sm font-black' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                          يومي
                      </button>
                      <button 
                        onClick={() => setGraphInterval('weekly')} 
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${graphInterval === 'weekly' ? 'bg-white text-slate-800 shadow-sm font-black' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                          أسبوعي
                      </button>
                      <button 
                        onClick={() => setGraphInterval('monthly')} 
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${graphInterval === 'monthly' ? 'bg-white text-slate-800 shadow-sm font-black' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                          شهري
                      </button>
                  </div>
              </div>
              <div className="relative h-[300px]">
                  <canvas ref={profitExpenseChartRef}></canvas>
              </div>
          </div>

          {/* Categorized Visual Doughnut */}
          <div className="lg:col-span-4 flex flex-col gap-6">
              <ChartCard title="المبيعات حسب التصنيف" subtitle="نسبة مساهمة تصنيفات الكتب">
                  <canvas ref={salesByCategoryChartRef}></canvas>
              </ChartCard>
          </div>
      </div>

      {/* Top Sellers Visual & Detailed Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Top Selling Chart */}
          <div className="lg:col-span-4">
              <ChartCard title="الكتب الأكثر مبيعا (بياني)" subtitle="الكتب الـ 5 الأبرز من حيث الكمية">
                  <canvas ref={topProductsChartRef}></canvas>
              </ChartCard>
          </div>

          {/* Top Selling Complete Table */}
          <div className="lg:col-span-8 card-professional bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
              <div>
                  <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-4">
                      <Star size={18} className="text-amber-500 fill-amber-500" />
                      <div>
                          <h3 className="text-lg font-black text-slate-800">قائمة الأصناف الأكثر مبيعاً ونسبة الأرباح</h3>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">Top Sellers Detailed Performance List</p>
                      </div>
                  </div>

                  <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse">
                          <thead>
                              <tr className="bg-slate-50/50">
                                  <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-wider w-12 text-center">#</th>
                                  <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">الكتاب أو الصنف</th>
                                  <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">التصنيف</th>
                                  <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">الكمية المباعة</th>
                                  <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-left">مجموع المبيعات</th>
                                  <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-left">أرباح المبيعات</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                              {bestSellersSummary.length > 0 ? (
                                  bestSellersSummary.map((item, index) => (
                                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                          <td className="p-3 text-center">
                                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black ${
                                                  index === 0 ? 'bg-amber-100 text-amber-700 font-black' : 
                                                  index === 1 ? 'bg-slate-200 text-slate-700' : 
                                                  index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-400'
                                              }`}>
                                                  {index + 1}
                                              </span>
                                          </td>
                                          <td className="p-3 font-bold text-slate-800 text-sm">{item.name}</td>
                                          <td className="p-3 text-center text-xs text-slate-500 font-medium">{item.category}</td>
                                          <td className="p-3 text-center font-bold text-indigo-600 text-sm tabular-nums">{item.quantity}</td>
                                          <td className="p-3 text-left font-black text-slate-800 text-sm tabular-nums">{(item.total).toLocaleString()} د.أ</td>
                                          <td className="p-3 text-left font-black text-emerald-600 text-sm tabular-nums">{(item.profit).toLocaleString()} د.أ</td>
                                      </tr>
                                  ))
                              ) : (
                                  <tr>
                                      <td colSpan={6} className="p-8 text-center text-slate-400 italic text-sm">
                                          ليس هناك أي مبيعات مسجلة في هذه الفترة الزمنية.
                                      </td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default ReportsView;
