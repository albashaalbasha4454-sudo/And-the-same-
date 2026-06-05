import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Search, X, LayoutDashboard, LineChart, ClipboardList, ShoppingCart, 
    Receipt, ShieldCheck, Package, ListChecks, ShoppingBag, Wallet, 
    Users, Building2, Landmark, Archive, UserCog, HardDriveDownload, 
    ScrollText, Trash2, Database, Settings, ArrowLeftRight, ArrowDownLeft, 
    FileText, HelpCircle, Check, AlertTriangle, PlayCircle, Eye, HandCoins, Info
} from 'lucide-react';
import type { Product, Invoice, Expense, Customer, Supplier, FinancialAccount, User } from '../types';

interface DetailedSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    products: Product[];
    invoices: Invoice[];
    expenses: Expense[];
    customers: Customer[];
    suppliers: Supplier[];
    accounts: FinancialAccount[];
    users: User[];
    currentUser: User;
    onNavigate: (viewKey: string) => void;
    onOpenCloseTill?: () => void;
    onOpenReset?: () => void;
}

type CategoryType = 'all' | 'actions' | 'products' | 'invoices' | 'contacts' | 'finance';

export const DetailedSearchModal: React.FC<DetailedSearchModalProps> = ({
    isOpen,
    onClose,
    products,
    invoices,
    expenses,
    customers,
    suppliers,
    accounts,
    users,
    currentUser,
    onNavigate,
    onOpenCloseTill,
    onOpenReset
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
    
    // Detailed search filters state
    const [priceMin, setPriceMin] = useState<string>('');
    const [priceMax, setPriceMax] = useState<string>('');
    const [stockStatus, setStockStatus] = useState<'all' | 'low' | 'out' | 'available'>('all');
    const [invoiceType, setInvoiceType] = useState<'all' | 'sale' | 'reservation' | 'shipping'>('all');
    const [paymentStatus, setPaymentStatus] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');
    const [debtStatus, setDebtStatus] = useState<'all' | 'has-debt' | 'clean'>('all');

    // Register Ctrl+K shortcut to open/close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                if (isOpen) onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // List of searchable features & buttons (actions)
    const systemActions = [
        { key: 'dashboard', label: 'لوحة التحكم الرئيسية', description: 'عرض الرسوم البيانية والأرباح وإحصائيات المبيعات اليومية والمصروفات.', icon: LayoutDashboard, role: ['admin'] },
        { key: 'pos', label: 'شاشة نقطة البيع (POS)', description: 'الواجهة الرئيسية للكاشير لبيع الكتب والمستلزمات الحية وتسجيل الطلبات الفورية.', icon: ShoppingCart, role: ['admin', 'cashier'] },
        { key: 'orders', label: 'إدارة الطلبات وفواتير المبيعات', description: 'مراجعة فواتير الزبائن، طباعة الفواتير، عمليات الاسترجاع والمرتجعات والتوصيل.', icon: Receipt, role: ['admin', 'cashier'] },
        { key: 'products', label: 'إدارة المنتجات والكتب في المخزن', description: 'عرض وتعديل أسعار الكتب، الكميات، تصنيف الرفوف، وجرد المخزون بشكل جماعي.', icon: Package, role: ['admin'] },
        { key: 'purchases', label: 'إدارة فواتير المشتريات والتوريد', description: 'إضافة فواتير مشتريات جديدة من الموردين، وإدخال الكتب مباشرة في قاعدة البيانات.', icon: ShoppingBag, role: ['admin'] },
        { key: 'finance', label: 'الخزينة والحسابات البنكية', description: 'مراجعة أرصدة الخزائن الكاش والنقدية وحسابات البنوك مع تتبع حركات السحب والإيداع.', icon: Landmark, role: ['admin'] },
        { key: 'reports', label: 'التقارير التفصيلية والإحصاءات العليا', description: 'تقارير مبيعات الكتب الأكثر مبيعاً والأرباح الصافية والمصروفات حسب الفترة الزمنية.', icon: LineChart, role: ['admin'] },
        { key: 'financialSummary', label: 'الملخص والتحليل المالي القياسي', description: 'تحليل المبيعات والمشتريات وتتبع قائمة الدخل والميزانية العمومية للشركة.', icon: ClipboardList, role: ['admin'] },
        { key: 'returnRequests', label: 'طلبات إرجاع الكتب للكاشيريات', description: 'الموافقة على طلبات الاسترجاع المرسلة من قبل الكاشير لضمان الرقابة المالية والأرشفة.', icon: ShieldCheck, role: ['admin'] },
        { key: 'requestedBooks', label: 'الكتب المطلوبة من الزبائن (غير المتوفرة)', description: 'قائمة الطلبات على الكتب التي نفذ مخزونها أو غير متوفرة لتأمينها لاحقاً.', icon: ListChecks, role: ['admin'] },
        { key: 'expenses', label: 'سجل المصروفات والمصرفيات العامة', description: 'توثيق وتسجيل المصاريف التشغيلية (كهرباء، إيجار، رواتب) وربطها بالخزائن المختلفة.', icon: Wallet, role: ['admin'] },
        { key: 'customers', label: 'إدارة حسابات وديون العملاء والزبائن', description: 'إضافة عملاء، متابعة كشوف حساباتهم ومديونياتهم، وتسجيل الدفعات النقدية الواردة.', icon: Users, role: ['admin'] },
        { key: 'suppliers', label: 'إدارة الموردين وحسابات التوريد الآجل', description: 'قاعدة بيانات الموردين، مستحقاتهم المالية، معلومات التواصل والمناديب.', icon: Building2, role: ['admin'] },
        { key: 'tillCloseouts', label: 'إغلاق ومطابقة الصناديق اليومية (الوردية)', description: 'سجل عمليات إغلاق الصناديق اليومية لمعرفة العجز والزيادة ومراجعات الدخل.', icon: Archive, role: ['admin'] },
        { key: 'users', label: 'المستخدمون وإدارة الصلاحيات للموظفين', description: 'إضافة موظفين جدد (كاشير/مدراء) وتغيير كلمات السر والصلاحيات الأمنية.', icon: UserCog, role: ['admin'] },
        { key: 'backups', label: 'النسخ الاحتياطي والأرشفة السحابية', description: 'تشغيل عمليات النسخ الاحتياطي اليدوي أو فحص قاعدة البيانات محلياً وسحابياً.', icon: HardDriveDownload, role: ['admin'] },
        { key: 'auditLogs', label: 'سجل التدقيق والمراقبة الإلكترونية للحركات', description: 'تتبع ومراقبة كل عملية إلكترونية بالتفاصيل واسم المستخدم وتاريخها لضمان الأمان البشري.', icon: ScrollText, role: ['admin'] },
        { key: 'recycleBin', label: 'سلة المهملات والكتب المحذوفة بيئياً', description: 'استرجاع الكتب أو البيانات التي تم حذفها سابقاً بالخطأ دون خسارة البيانات التاريخية.', icon: Trash2, role: ['admin'] },
        { key: 'cashierTools', label: 'أدوات الكاشير وإدارة البيانات المؤقتة', description: 'إدارة مبيعات الكاشير والبيانات بدون صلاحيات الإدارة للتبسيط والأمان.', icon: Database, role: ['cashier'] },
        { key: 'settings', label: 'إعدادات النظام والتحكم العام للبرنامج', description: 'تغيير عتبة الحد الأدنى للمخزون، تصفير النظام الكامل، وتحديث الأسعار دفعة واحدة.', icon: Settings, role: ['admin'] },
        { key: 'closeTillAction', label: 'إجراء سريع: فتح نافذة إغلاق الصندوق ومطابقة الكاش', description: 'مطابقة الكاش الفعلي في الصندوق اليدوي مع الكاش الرقمي في النظام لإنهاء الوردية الحالية.', icon: FileText, role: ['cashier'], action: true },
        { key: 'systemResetAction', label: 'إجراء حرج: ضبط المصنع وإعادة تهيئة النظام الكامل', description: 'مسح جميع الفواتير والمبيعات وإغلاقات الصناديق وإعادة ضبط النظام للبدء من الصفر.', icon: AlertTriangle, role: ['admin'], action: true }
    ];

    // Search logic
    const results = useMemo(() => {
        const query = searchTerm.toLowerCase().trim();

        // 1. Actions / Buttons
        const filteredActions = systemActions
            .filter(act => act.role.includes(currentUser.role))
            .filter(act => 
                !query || 
                act.label.toLowerCase().includes(query) || 
                act.description.toLowerCase().includes(query) ||
                act.key.toLowerCase().includes(query)
            )
            .map(act => ({
                id: `act-${act.key}`,
                type: 'action' as const,
                title: act.label,
                subtitle: act.description,
                icon: act.icon,
                payload: act,
                badge: act.action ? 'إجراء سريع' : 'زر تنقّل'
            }));

        // 2. Products
        const filteredProducts = products.filter(prod => {
            const matchesQuery = !query || 
                prod.name.toLowerCase().includes(query) || 
                prod.author?.toLowerCase().includes(query) ||
                prod.publisher?.toLowerCase().includes(query) ||
                prod.isbn?.toLowerCase().includes(query) ||
                prod.id.toLowerCase().includes(query) ||
                (prod.barcode && prod.barcode.includes(query));

            // Price limitations
            const minPrice = priceMin !== '' ? parseFloat(priceMin) : -1;
            const maxPrice = priceMax !== '' ? parseFloat(priceMax) : Infinity;
            const matchesPrice = prod.price >= (minPrice === -1 ? 0 : minPrice) && prod.price <= maxPrice;

            // Stock status
            let matchesStock = true;
            if (stockStatus === 'low') {
                matchesStock = prod.type === 'product' && prod.quantity > 0 && prod.quantity <= 5; 
            } else if (stockStatus === 'out') {
                matchesStock = prod.type === 'product' && prod.quantity === 0;
            } else if (stockStatus === 'available') {
                matchesStock = prod.type === 'service' || prod.quantity > 5;
            }

            return matchesQuery && matchesPrice && matchesStock;
        }).map(prod => ({
            id: prod.id,
            type: 'product' as const,
            title: prod.name,
            subtitle: `${prod.author ? `المؤلف: ${prod.author}` : ''} | السعر: ${prod.price.toLocaleString()} ر.س | المخزن: ${prod.type === 'service' ? 'خدمة' : `${prod.quantity} حبة`} | الرف: ${prod.rackNumber || 'غير محدد'}`,
            icon: Package,
            payload: prod,
            badge: prod.type === 'service' ? 'خدمة' : (prod.quantity === 0 ? 'نفذ المخزون' : 'كتاب في المخزن')
        }));

        // 3. Invoices
        const filteredInvoices = invoices.filter(inv => {
            const matchesQuery = !query || 
                inv.id.toLowerCase().includes(query) || 
                (inv.customerInfo?.name || '').toLowerCase().includes(query) || 
                (inv.customerInfo?.phone || '').includes(query);

            // Filter by Payment Status
            const matchesPayment = paymentStatus === 'all' || inv.paymentStatus === paymentStatus;

            // Filter by Invoice type
            const matchesType = invoiceType === 'all' || inv.type === invoiceType;

            return matchesQuery && matchesPayment && matchesType;
        }).map(inv => ({
            id: inv.id,
            type: 'invoice' as const,
            title: `فاتورة رقم ${inv.id.toUpperCase()}`,
            subtitle: `العميل: ${inv.customerInfo?.name || 'بدون اسم'} | الإجمالي: ${inv.total.toLocaleString()} ر.س | الحالة: ${inv.paymentStatus === 'paid' ? 'مدفوعة' : 'آجلة'}`,
            icon: Receipt,
            payload: inv,
            badge: inv.type === 'shipping' ? 'طلب شحن' : inv.type === 'reservation' ? 'حجز عميل' : 'بيع مباشر'
        }));

        // 4. Contacts (Customers / Suppliers)
        const filteredCustomers = customers.filter(cust => {
            const matchesQuery = !query || 
                cust.name.toLowerCase().includes(query) || 
                cust.phone.includes(query) || 
                cust.email?.toLowerCase().includes(query);

            let matchesDebt = true;
            if (debtStatus === 'has-debt') {
                matchesDebt = (cust.balance || 0) < 0;
            } else if (debtStatus === 'clean') {
                matchesDebt = (cust.balance || 0) >= 0;
            }

            return matchesQuery && matchesDebt;
        }).map(cust => ({
            id: cust.id,
            type: 'contact' as const,
            title: `الزبون: ${cust.name}`,
            subtitle: `الهاتف: ${cust.phone} | الرصيد الحالي: ${(cust.balance || 0).toLocaleString()} ر.س`,
            icon: Users,
            payload: { ...cust, contactType: 'customer' },
            badge: (cust.balance || 0) < 0 ? 'مستحق ديون' : 'مستقر مالياً'
        }));

        const filteredSuppliers = suppliers.filter(sup => {
            const matchesQuery = !query || 
                sup.name.toLowerCase().includes(query) || 
                (sup.phone && sup.phone.includes(query)) || 
                (sup.contactPerson && sup.contactPerson.toLowerCase().includes(query));

            let matchesDebt = true;
            if (debtStatus === 'has-debt') {
                matchesDebt = (sup.balance || 0) > 0; // supplier has balance we need to pay
            } else if (debtStatus === 'clean') {
                matchesDebt = (sup.balance || 0) <= 0;
            }

            return matchesQuery && matchesDebt;
        }).map(sup => ({
            id: sup.id,
            type: 'contact' as const,
            title: `المورد: ${sup.name}`,
            subtitle: `الهاتف: ${sup.phone || 'غير مسجل'} | المحصل: ${sup.contactPerson || 'لا يوجد'} | الرصيد: ${(sup.balance || 0).toLocaleString()} ر.س`,
            icon: Building2,
            payload: { ...sup, contactType: 'supplier' },
            badge: 'موزع معتمد'
        }));

        // 5. Finance
        const filteredExpenses = expenses.filter(exp => {
            return !query || 
                (exp.category || '').toLowerCase().includes(query) || 
                (exp.description || '').toLowerCase().includes(query) || 
                exp.amount.toString().includes(query);
        }).map(exp => ({
            id: exp.id,
            type: 'finance' as const,
            title: `مصروف: ${exp.category}`,
            subtitle: `المبلغ: ${exp.amount.toLocaleString()} ر.س | التفاصيل: ${exp.description || 'بدون ملاحظات'} | التاريخ: ${new Date(exp.date).toLocaleDateString('ar-EG')}`,
            icon: Wallet,
            payload: exp,
            badge: 'عملية صرف'
        }));

        // Combine based on active tab
        let combined: any[] = [];
        if (activeCategory === 'all') {
            combined = [
                ...filteredActions,
                ...filteredProducts,
                ...filteredInvoices,
                ...filteredCustomers,
                ...filteredSuppliers,
                ...filteredExpenses,
            ];
        } else if (activeCategory === 'actions') {
            combined = filteredActions;
        } else if (activeCategory === 'products') {
            combined = filteredProducts;
        } else if (activeCategory === 'invoices') {
            combined = filteredInvoices;
        } else if (activeCategory === 'contacts') {
            combined = [...filteredCustomers, ...filteredSuppliers];
        } else if (activeCategory === 'finance') {
            combined = filteredExpenses;
        }

        return combined;
    }, [searchTerm, activeCategory, products, invoices, expenses, customers, suppliers, priceMin, priceMax, stockStatus, invoiceType, paymentStatus, debtStatus, currentUser.role]);

    // Handle single action execution / navigation from search
    const handleSelectResult = (item: any) => {
        if (item.type === 'action') {
            const actionKey = item.payload.key;
            if (actionKey === 'closeTillAction') {
                if (onOpenCloseTill) onOpenCloseTill();
            } else if (actionKey === 'systemResetAction') {
                if (onOpenReset) onOpenReset();
            } else {
                onNavigate(actionKey);
            }
        } else if (item.type === 'product') {
            onNavigate('products');
        } else if (item.type === 'invoice') {
            onNavigate('orders');
        } else if (item.type === 'contact') {
            if (item.payload.contactType === 'customer') {
                onNavigate('customers');
            } else {
                onNavigate('suppliers');
            }
        } else if (item.type === 'finance') {
            onNavigate('expenses');
        }
        onClose();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-start pt-[5vh] p-4 font-sans" dir="rtl">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh] overflow-hidden border border-slate-200"
                >
                    {/* Top Search Input Line */}
                    <div className="flex items-center gap-4 p-6 border-b border-slate-100 flex-shrink-0 bg-slate-50/50">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                            <Search size={22} className="animate-pulse" />
                        </div>
                        <div className="flex-1 relative">
                            <input
                                autoFocus
                                type="text"
                                placeholder="..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full text-slate-800 text-lg font-bold bg-transparent border-none outline-none placeholder:text-slate-400 focus:ring-0 pr-1"
                            />
                            {searchTerm === '' ? (
                                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 font-bold pointer-events-none text-base">
                                    ابحث عن أي زر، كتاب، فاتورة، عميل، أو مصروف...
                                </span>
                            ) : null}
                        </div>
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')} 
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                            >
                                <X size={18} />
                            </button>
                        )}
                        <div className="px-3 py-1.5 bg-slate-200/50 rounded-lg text-[10px] text-slate-400 font-bold flex items-center gap-1">
                            <span>ESC</span>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all mr-1"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Category Selector Tabs */}
                    <div className="flex items-center gap-1.5 px-6 py-3 border-b border-slate-100 bg-white flex-shrink-0 overflow-x-auto scrollbar-hide">
                        {(['all', 'actions', 'products', 'invoices', 'contacts', 'finance'] as CategoryType[]).map((cat) => {
                            const labels: Record<CategoryType, string> = {
                                all: 'الكل دمجاً',
                                actions: 'الأزرار والمهام الدقيقة',
                                products: 'الكتب والمنتجات',
                                invoices: 'الفواتير والطلبات',
                                contacts: 'العملاء والموردين',
                                finance: 'المصروفات والمالية'
                            };
                            const isActive = activeCategory === cat;
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                                        isActive 
                                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-100' 
                                        : 'bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                                >
                                    {labels[cat]}
                                </button>
                            );
                        })}
                    </div>

                    {/* Multi-Criteria Advanced Filters Panels (Displays based on Tab chosen) */}
                    <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex flex-wrap gap-4 items-center flex-shrink-0 text-sm">
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-black">
                            <Info size={14} className="text-indigo-500" />
                            <span>تخصيص الفرز والبحث المتقدم:</span>
                        </div>

                        {activeCategory === 'products' || activeCategory === 'all' ? (
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1">
                                    <span className="text-[10px] text-slate-400 font-bold">بين</span>
                                    <input 
                                        type="number" 
                                        placeholder="بداية" 
                                        value={priceMin} 
                                        onChange={e => setPriceMin(e.target.value)}
                                        className="w-14 text-xs font-bold bg-transparent outline-none border-none p-0 text-center" 
                                    />
                                    <span className="text-[10px] text-slate-400 font-bold">إلى</span>
                                    <input 
                                        type="number" 
                                        placeholder="نهاية" 
                                        value={priceMax} 
                                        onChange={e => setPriceMax(e.target.value)}
                                        className="w-14 text-xs font-bold bg-transparent outline-none border-none p-0 text-center" 
                                    />
                                    <span className="text-[10px] text-slate-500 font-bold">ر.س</span>
                                </div>
                                <select
                                    value={stockStatus}
                                    onChange={e => setStockStatus(e.target.value as any)}
                                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-500 outline-none"
                                >
                                    <option value="all">كل المخازن</option>
                                    <option value="low">مخزون منخفض (≤ 5)</option>
                                    <option value="out">نفذ تماماً</option>
                                    <option value="available">متوفر حالياً</option>
                                </select>
                            </div>
                        ) : null}

                        {activeCategory === 'invoices' || activeCategory === 'all' ? (
                            <div className="flex items-center gap-2">
                                <select
                                    value={invoiceType}
                                    onChange={e => setInvoiceType(e.target.value as any)}
                                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-500 outline-none"
                                >
                                    <option value="all">كل أنواع فواتيرك</option>
                                    <option value="sale">بيع كاش ونقدي</option>
                                    <option value="reservation">حجوزات</option>
                                    <option value="shipping">طلبات شحن</option>
                                </select>

                                <select
                                    value={paymentStatus}
                                    onChange={e => setPaymentStatus(e.target.value as any)}
                                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-500 outline-none"
                                >
                                    <option value="all">كل حالات السداد</option>
                                    <option value="paid">مدفوعة بالكامل</option>
                                    <option value="partial">مدفوع جزئي (آجل)</option>
                                    <option value="unpaid">آجل وغير مسدد</option>
                                </select>
                            </div>
                        ) : null}

                        {activeCategory === 'contacts' || activeCategory === 'all' ? (
                            <div className="flex items-center gap-2">
                                <select
                                    value={debtStatus}
                                    onChange={e => setDebtStatus(e.target.value as any)}
                                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-500 outline-none"
                                >
                                    <option value="all">كل العملاء/الموردين</option>
                                    <option value="has-debt">هناك مديونيات معلقة</option>
                                    <option value="clean">رصيد متزن/أصفر</option>
                                </select>
                            </div>
                        ) : null}

                        {(priceMin || priceMax || stockStatus !== 'all' || invoiceType !== 'all' || paymentStatus !== 'all' || debtStatus !== 'all') && (
                            <button
                                onClick={() => {
                                    setPriceMin(''); setPriceMax(''); setStockStatus('all');
                                    setInvoiceType('all'); setPaymentStatus('all'); setDebtStatus('all');
                                }}
                                className="text-rose-500 text-xs font-black hover:underline"
                            >
                                إعادة تعيين الفلاتر
                            </button>
                        )}
                    </div>

                    {/* Scrollable Results List */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/20 max-h-[50vh]">
                        {results.length > 0 ? (
                            results.map((item, idx) => {
                                const IconComp = item.icon || Info;
                                return (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: Math.min(10, idx) * 0.03 }}
                                        onClick={() => handleSelectResult(item)}
                                        className="bg-white border border-slate-100 hover:border-indigo-500 hover:shadow-lg rounded-2xl p-4 flex items-center justify-between gap-4 transition-all duration-300 group cursor-pointer relative"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                                                item.type === 'action' ? 'bg-slate-100 text-slate-800 group-hover:bg-indigo-600 group-hover:text-white' :
                                                item.type === 'product' ? 'bg-teal-50 text-teal-600' :
                                                item.type === 'invoice' ? 'bg-amber-50 text-amber-600' :
                                                item.type === 'contact' ? 'bg-sky-50 text-sky-600' :
                                                'bg-rose-50 text-rose-600'
                                            }`}>
                                                <IconComp size={20} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-black text-slate-800 text-sm">{item.title}</h3>
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                                        item.type === 'action' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100/50' :
                                                        item.type === 'product' ? 'bg-teal-50 text-teal-700' :
                                                        item.type === 'invoice' ? 'bg-amber-50 text-amber-700' :
                                                        item.type === 'contact' ? 'bg-sky-50 text-sky-700' :
                                                        'bg-rose-50 text-rose-700'
                                                    }`}>
                                                        {item.badge}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400 font-bold leading-relaxed">{item.subtitle}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-slate-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                                {item.type === 'action' ? 'انقر لتشغيل الزر' : 'توجيه للقسم'}
                                            </span>
                                            <div className="p-2 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-slate-900 group-hover:text-white transition-all transform group-hover:-translate-x-1 duration-300">
                                                <PlayCircle size={16} />
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                <Search size={48} strokeWidth={1} className="mb-4 opacity-20 animate-spin" style={{ animationDuration: '3s' }} />
                                <p className="font-extrabold text-slate-700 text-base">لا توجد نتائج بحث مطابقة تماماً</p>
                                <p className="text-xs font-bold text-slate-400 mt-2">تأكد من كتابة الاسم بدقة، أو قم بإعادة ضبط الفلاتر المحددة بالأعلى.</p>
                            </div>
                        )}
                    </div>

                    {/* Bottom Status / Help Bar */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex-shrink-0 flex items-center justify-between text-[11px] text-slate-400 font-bold">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                محرك البحث الفوري دقيق للغاية (v2.0)
                            </span>
                            <span>إجمالي المنتجات المتاحة: <strong className="text-slate-600">{products.length}</strong></span>
                            <span>إجمالي الفواتير النشطة: <strong className="text-slate-600">{invoices.length}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>للبحث الفوري اضغط على تابات الأقسام مباشرة</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
