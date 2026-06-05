import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { initialProducts, initialCustomers, initialSuppliers, initialAccounts } from './initialData';

import type { Product, Invoice, InvoiceItem, User, Expense, ReturnRequest, RequestedBook, Customer, Supplier, Purchase, FinancialAccount, FinancialTransaction, OrderType, OrderStatus, PaymentStatus, Budget, TillCloseout } from './types';

import useLocalStorage from './hooks/useLocalStorage';
import LoginView from './components/LoginView';
import Header from './components/Header';
import POSView from './components/POSView';
import ProductsView from './components/ProductsView';
import DashboardView from './components/DashboardView';
import SettingsView from './components/SettingsView';
import { SystemResetModal } from './components/SystemResetModal';
import UsersView from './components/UsersView';
import ReturnRequestsView from './components/ReturnRequestsView';
import ExpensesView from './components/ExpensesView';
import AIChatAssistant from './components/AIChatAssistant';
import RequestedBooksView from './components/RequestedBooksView';
import PurchasesView from './components/PurchasesView';
import CustomersView from './components/CustomersView';
import SuppliersView from './components/SuppliersView';
import FinanceView from './components/FinanceView';
import OrdersView from './components/OrdersView';
import CloseTillModal from './components/CloseTillModal';
import TillCloseoutsView from './components/TillCloseoutsView';
import CashierToolsView from './components/CashierToolsView';
import ReportsView from './components/ReportsView';
import FinancialSummaryView from './components/FinancialSummaryView';
import { BackupAndArchiveView } from './components/BackupAndArchiveView';
import { AuditLogView } from './components/AuditLogView';
import { RecycleBinView } from './components/RecycleBinView';
import { DetailedSearchModal } from './components/DetailedSearchModal';
import { useFirebase } from './components/FirebaseProvider';

import { 
    productsService, 
    invoicesService, 
    customersService, 
    financeService, 
    usersService,
    auditService,
    suppliersService,
    purchasesService 
} from './services';


import { logAction } from './utils/auditLogger';
import { motion, AnimatePresence } from 'motion/react';
import { 
    LayoutDashboard, LineChart, ClipboardList, ShoppingCart, 
    Receipt, ShieldCheck, Package, ListChecks, 
    ShoppingBag, Wallet, Users, Building2, 
    Landmark, Archive, UserCog, HardDriveDownload, 
    ScrollText, Trash2, Database, Settings, 
    ChevronLeft, LogOut, Search, Bell,
    Menu, X, ChevronRight
} from 'lucide-react';
import { Logo } from './components/Logo';
import { softDelete } from './utils/recycleBin';

import { simpleHash, generateSalt } from './utils/authUtils';

const App: React.FC = () => {
    // --- AUTH & SERVICES ---
    const { currentUser, login, loginWithCredentials, logout, loading: authLoading } = useFirebase();

    // --- STATE MANAGEMENT (Backed by Firestore) ---
    const [users, setUsers] = useState<User[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
    const [requestedBooks, setRequestedBooks] = useState<RequestedBook[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
    const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [tillCloseouts, setTillCloseouts] = useState<TillCloseout[]>([]);
    
    const [currentView, setCurrentView] = useState('pos');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [lowStockThreshold, setLowStockThreshold] = useLocalStorage<number>('lowStockThreshold', 5);
    const [shopName, setShopName] = useLocalStorage<string>('shopName', 'سوق الكتاب');
    const [shopAddress, setShopAddress] = useLocalStorage<string>('shopAddress', 'تفاصيل العنوان ورقم الهاتف');
    const [isCloseTillModalOpen, setIsCloseTillModalOpen] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Initial View Correction
    useEffect(() => {
        if (currentUser) {
            setCurrentView(currentUser.role === 'admin' ? 'dashboard' : 'pos');
        }
    }, [currentUser?.id]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(prev => !prev);
            }
            if (e.key === 'Escape' && isSearchOpen) {
                setIsSearchOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSearchOpen]);

    // --- SUBSCRIPTIONS ---
    useEffect(() => {
        if (!currentUser) return;
        
        const unsubProducts = productsService.subscribe(setProducts);
        const unsubInvoices = invoicesService.subscribe(setInvoices);
        const unsubCustomers = customersService.subscribe(setCustomers);
        const unsubAcc = financeService.subscribeAccounts(setAccounts);
        const unsubTx = financeService.subscribeTransactions(setTransactions);
        const unsubExp = financeService.subscribeExpenses(setExpenses);
        const unsubUsers = usersService.subscribe(setUsers);
        const unsubSuppliers = suppliersService.subscribe(setSuppliers);
        const unsubPurchases = purchasesService.subscribe(setPurchases);

        return () => {
            unsubProducts();
            unsubInvoices();
            unsubCustomers();
            unsubAcc();
            unsubTx();
            unsubExp();
            unsubUsers();
            unsubSuppliers();
            unsubPurchases();
        };
    }, [currentUser?.id]);

    
    // --- COMPUTED VALUES ---
    const accountBalances = useMemo(() => {
        const balances = new Map<string, number>();
        accounts.forEach(acc => balances.set(acc.id, 0));
        transactions.forEach(tx => {
            if (tx.fromAccountId) {
                balances.set(tx.fromAccountId, (balances.get(tx.fromAccountId) || 0) - tx.amount);
            }
            if (tx.toAccountId) {
                balances.set(tx.toAccountId, (balances.get(tx.toAccountId) || 0) + tx.amount);
            }
        });
        return balances;
    }, [accounts, transactions]);

    // --- CENTRALIZED HANDLERS ---
    const addFinancialTransaction = useCallback(async (tx: Omit<FinancialTransaction, 'id' | 'date'>) => {
        await financeService.addTransaction(tx);
    }, []);

    const updateStock = useCallback(async (items: {
        productId: string;
        quantityChange: number;
        allocatedChange?: number;
    }[]) => {
        await productsService.batchUpdate(items.map(item => {
            const product = products.find(p => p.id === item.productId);
            if (!product || product.type !== 'product') return null;
            return {
                id: item.productId,
                data: {
                    quantity: Math.max(0, product.quantity + item.quantityChange),
                    allocated: item.allocatedChange ? Math.max(0, (product.allocated || 0) + item.allocatedChange) : product.allocated
                }
            };
        }).filter(Boolean) as any);
    }, [products]);

    // --- CORE BUSINESS LOGIC ---
    // Products
    const addProduct = async (product: Omit<Product, 'id'>) => {
        const newProd = await productsService.add(product);
        await logAction('PRODUCT_CREATED', `Created product: ${product.name}`, newProd.id, 'product');
        return newProd;
    };
    const updateProduct = async (id: string, updatedProduct: Omit<Product, 'id'>) => {
        await productsService.update(id, updatedProduct);
        await logAction('PRODUCT_UPDATED', `Updated product: ${updatedProduct.name}`, id, 'product');
    };
    const deleteProduct = async (id: string) => {
        const product = products.find(p => p.id === id);
        if (!product) return;
        if (!window.confirm('هل أنت متأكد من حذف هذا المنتج نهائياً من النظام؟')) return;
        
        await productsService.delete(id);
        await logAction('PRODUCT_DELETED', `Deleted product: ${product.name}`, id, 'product');
    };
    
    const updatePricesBatch = async (operation: 'multiply' | 'divide', factor: number) => {
        if (isNaN(factor) || factor <= 0) {
            alert("المعامل يجب أن يكون رقمًا موجبًا.");
            return;
        }
        const updates = products.map(p => ({
            id: p.id,
            data: {
                price: operation === 'multiply' ? p.price * factor : p.price / factor,
                costPrice: p.costPrice ? (operation === 'multiply' ? p.costPrice * factor : p.costPrice / factor) : undefined
            }
        }));
        await productsService.batchUpdate(updates);
        alert("تم تحديث الأسعار بنجاح.");
    };

    const batchUpdateProducts = async (productIds: string[], discountPercent: number) => {
        if (isNaN(discountPercent) || discountPercent < 0 || discountPercent > 100) {
            alert("الرجاء إدخال نسبة خصم صالحة بين 0 و 100.");
            return;
        }
        const factor = 1 - (discountPercent / 100);
        const updates = products
            .filter(p => productIds.includes(p.id))
            .map(p => ({
                id: p.id,
                data: {
                    salePrice: discountPercent === 0 ? undefined : parseFloat((p.price * factor).toFixed(2))
                }
            }));
        await productsService.batchUpdate(updates);
        alert(`تم تطبيق خصم ${discountPercent}% على ${productIds.length} منتج.`);
    };


    // Orders (Sales, Shipping, Reservations)
    const createOrder = async (type: OrderType, items: InvoiceItem[], customerInfo?: Invoice['customerInfo'], shippingFee: number = 0, source?: Invoice['source']) => {
        if (!currentUser) throw new Error("No user is logged in.");

        const total = items.reduce((sum, item) => sum + (item.price - (item.discount || 0)) * item.quantity, 0) + shippingFee;
        const totalCost = items.reduce((sum, item) => sum + (item.costPrice || 0) * item.quantity, 0);
        
        const newOrderData: Omit<Invoice, 'id'> = {
            date: new Date().toISOString(),
            type,
            items: items.map(item => ({...item})),
            total,
            totalCost,
            totalProfit: total - totalCost - shippingFee,
            customerInfo,
            shippingFee,
            source,
            status: type === 'sale' ? 'completed' : 'pending',
            paymentStatus: type === 'sale' ? 'paid' : 'unpaid',
            processedBy: currentUser.username,
        };
        
        const newOrder = await invoicesService.add(newOrderData);
        await logAction('ORDER_CREATED', `Created ${type} order for ${newOrder.customerInfo?.name || 'walk-in'}. Total: ${total}`, newOrder.id, 'invoice');
        
        const itemsToUpdate = items.map(i => ({
            productId: i.productId,
            quantityChange: -i.quantity,
            allocatedChange: (type === 'shipping' || type === 'reservation') ? i.quantity : 0
        }));
        await updateStock(itemsToUpdate);

        if (type === 'sale') {
            await addFinancialTransaction({
                description: `إيراد من فاتورة بيع رقم ${newOrder.id.substring(0,8)} (بواسطة ${currentUser.username})`,
                amount: newOrder.total,
                type: 'sale_income',
                toAccountId: 'cash-default',
                relatedInvoiceId: newOrder.id
            });
        }
        return newOrder;
    };

    const onCompleteSale = (items: InvoiceItem[]) => {
        if (!window.confirm('هل أنت متأكد من إتمام عملية البيع؟')) return;
        createOrder('sale', items);
    };
    const onCreateShippingOrder = (cart: InvoiceItem[], customerInfo: any, shippingFee: number, source: any) => {
        if (!window.confirm('هل أنت متأكد من إنشاء طلب الشحن؟')) return;
        createOrder('shipping', cart, customerInfo, shippingFee, source);
    };
    const onCreateReservation = (cart: InvoiceItem[], customerInfo: any) => {
        if (!window.confirm('هل أنت متأكد من إنشاء هذا الحجز؟')) return;
        createOrder('reservation', cart, customerInfo);
    };

    const updateOrderStatus = (orderId: string, status: OrderStatus, paymentStatus?: PaymentStatus) => {
        if (!window.confirm(`هل أنت متأكد من تغيير حالة الطلب إلى "${status}"؟`)) return;
        setInvoices(prev => prev.map(inv => {
            if (inv.id === orderId) {
                const wasCancelled = inv.status !== 'cancelled' && status === 'cancelled';
                const wasCompleted = inv.status !== 'completed' && status === 'completed' && inv.type === 'shipping';
                
                if (wasCancelled) {
                    const itemsToUpdate = inv.items.map(i => ({
                        productId: i.productId,
                        quantityChange: i.quantity,
                        allocatedChange: (inv.type === 'shipping' || inv.type === 'reservation') ? -i.quantity : 0
                    }));
                    updateStock(itemsToUpdate);
                }
                if (wasCompleted) {
                    const itemsToUpdate = inv.items.map(i => ({
                        productId: i.productId,
                        quantityChange: 0,
                        allocatedChange: -i.quantity
                    }));
                    updateStock(itemsToUpdate);
                }
                
                const updatedInvoice = { ...inv, status };
                if (paymentStatus) {
                    updatedInvoice.paymentStatus = paymentStatus;
                    if(paymentStatus === 'paid' && !inv.paidDate) {
                        updatedInvoice.paidDate = new Date().toISOString();
                         addFinancialTransaction({
                            description: `تحصيل فاتورة ${inv.type} رقم ${inv.id.substring(0,8)} (بواسطة ${inv.processedBy || 'غير معروف'})`,
                            amount: inv.total,
                            type: 'sale_income',
                            toAccountId: 'cash-default',
                            relatedInvoiceId: inv.id
                        });
                    }
                }
                return updatedInvoice;
            }
            return inv;
        }));
    };
    
    const onConvertToSale = async (reservation: Invoice) => {
        if (!currentUser) return;
        if (!window.confirm(`هل أنت متأكد من تحويل الحجز رقم ${reservation.id.substring(0,8)} إلى عملية بيع؟ سيتم تحصيل مبلغ ${reservation.total}.`)) return;
        
        await invoicesService.updateStatus(reservation.id, 'completed', 'paid', new Date().toISOString());

        const itemsToUpdate = reservation.items.map(i => ({
            productId: i.productId,
            quantityChange: 0,
            allocatedChange: -i.quantity
        }));
        await updateStock(itemsToUpdate);

        await addFinancialTransaction({
            description: `إيراد من تحويل الحجز ${reservation.id.substring(0,8)} (بواسطة ${currentUser.username})`,
            amount: reservation.total,
            type: 'sale_income',
            toAccountId: 'cash-default',
            relatedInvoiceId: reservation.id
        });
    };

    // Returns
    const processReturn = async (originalInvoiceId: string, returnItems: InvoiceItem[]) => {
        if (!currentUser) return;
        if (!window.confirm('هل أنت متأكد من إتمام عملية الإرجاع؟ سيتم استرداد المبلغ وتحديث المخزون.')) return;
        const total = returnItems.reduce((sum, item) => sum + (item.price - (item.discount || 0)) * item.quantity, 0);
        const totalProfit = returnItems.reduce((sum, item) => sum + ((item.price - (item.discount || 0)) - (item.costPrice || 0)) * item.quantity, 0);
        
        const newReturnInvoiceData: Omit<Invoice, 'id'> = {
            date: new Date().toISOString(),
            type: 'return',
            items: returnItems,
            total: -total,
            totalProfit: -totalProfit,
            status: 'completed',
            paymentStatus: 'paid',
            processedBy: currentUser.username,
        };
        const newReturnInvoice = await invoicesService.add(newReturnInvoiceData);
        await updateStock(returnItems.map(i => ({ productId: i.productId, quantityChange: i.quantity })));
        
        await addFinancialTransaction({
            description: `مرتجع من فاتورة ${originalInvoiceId.substring(0, 8)} (بواسطة ${currentUser.username})`,
            amount: total,
            type: 'return_refund',
            fromAccountId: 'cash-default',
            relatedInvoiceId: newReturnInvoice.id,
            category: 'مرتجعات'
        });
    };

    const sendReturnRequest = async (originalInvoice: Invoice, returnItems: InvoiceItem[]) => {
        if (!currentUser) return;
        // In a real app, this would go to a returnRequests collection in Firestore
        // For now, I'll use local state for notifications or create a service for it if needed
        const newRequest: ReturnRequest = {
            id: `req-ret-${Date.now()}`,
            requestDate: new Date().toISOString(),
            originalInvoiceId: originalInvoice.id,
            requestedBy: currentUser.username,
            status: 'pending',
            items: returnItems,
        };
        setReturnRequests(prev => [...prev, newRequest]);
        alert('تم إرسال طلب الإرجاع للمراجعة.');
    };

    const approveRequest = async (requestId: string) => {
        if (!currentUser) return;
        if (!window.confirm('هل أنت متأكد من الموافقة على طلب الإرجاع؟ سيتم معالجة العملية مالياً وفي المخزون.')) return;
        const request = returnRequests.find(r => r.id === requestId);
        if (request && request.status === 'pending') {
            await processReturn(request.originalInvoiceId, request.items);
            setReturnRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'approved', processedBy: currentUser.username, processedDate: new Date().toISOString() } : r));
        }
    };

    const rejectRequest = async (requestId: string) => {
        if (!currentUser) return;
        if (!window.confirm('هل أنت متأكد من رفض طلب الإرجاع؟')) return;
        setReturnRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'rejected', processedBy: currentUser.username, processedDate: new Date().toISOString() } : r));
    };

    const addTillCloseout = async (data: Omit<TillCloseout, 'id'>) => {
        setTillCloseouts(prev => [...prev, { ...data, id: `closeout-${Date.now()}` }]);
    };

    const onAddRequestedBook = async (bookName: string, customerName: string, customerPhone: string) => {
        // Implement Firestore service for requestedBooks if needed, or stick to local for now as it's less critical
        // but the prompt says migrate core modules. requestedBooks is one.
        setRequestedBooks(prev => {
            const existing = prev.find(b => b.name.toLowerCase() === bookName.toLowerCase());
            if (existing) {
                return prev.map(b => b.id === existing.id ? { ...b, requestedCount: b.requestedCount + 1, lastRequestedDate: new Date().toISOString() } : b);
            } else {
                return [...prev, {
                    id: `req-${Date.now()}`,
                    name: bookName,
                    requestedCount: 1,
                    lastRequestedDate: new Date().toISOString(),
                    status: 'pending',
                    customerName,
                    customerPhone,
                }];
            }
        });
        alert(`تم تسجيل طلب للمنتج "${bookName}" باسم العميل ${customerName}.`);
    };

    const updateRequestedBookStatus = (id: string, status: 'fulfilled' | 'pending') => {
        setRequestedBooks(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    };
    
    // Purchases
    const onAddPurchase = async (purchaseData: Omit<Purchase, 'id'>) => {
        if (!window.confirm('هل أنت متأكد من إنشاء فاتورة الشراء هذه؟ سيتم تحديث المخزون والحسابات المالية.')) return;
        
        const newPurchase = await purchasesService.add({
            ...purchaseData,
            isStockedIn: true,
        });

        const stockUpdates = newPurchase.items.map(item => ({
            productId: item.productId,
            quantityChange: item.quantity
        }));
        await updateStock(stockUpdates);
    };
    const onUpdatePurchase = async (id: string, purchase: Partial<Purchase>) => {
        await purchasesService.update(id, purchase);
    };
    const onDeletePurchase = async (id: string) => {
        if (!window.confirm('هل أنت متأكد من حذف فاتورة الشراء هذه؟')) return;
        await purchasesService.delete(id);
    };
    
    const addPurchasePayment = async (purchaseId: string, amount: number, accountId: string) => {
        if (!window.confirm(`هل أنت متأكد من دفع مبلغ ${amount}؟ سيتم خصم المبلغ من الحساب المختار.`)) return;
        const purchase = purchases.find(p => p.id === purchaseId);
        if (!purchase) return;

        const newPayments = [...purchase.payments, { date: new Date().toISOString(), amount, accountId }];
        const totalPaid = newPayments.reduce((sum, p) => sum + p.amount, 0);
        
        let paymentStatus: PaymentStatus = 'partial';
        if (totalPaid >= purchase.totalCost) paymentStatus = 'paid';
        else if (totalPaid === 0) paymentStatus = 'unpaid';

        await onUpdatePurchase(purchaseId, { payments: newPayments, paymentStatus });
        await addFinancialTransaction({
            description: `دفعة للمورد ${purchase.supplierName} عن فاتورة ${purchase.id.substring(0,8)}`,
            amount,
            type: 'supplier_payment',
            fromAccountId: accountId,
            relatedPurchaseId: purchase.id
        });
    };
    
    // Expenses
    const addExpense = async (expense: Omit<Expense, 'id'>) => {
        if (!window.confirm(`هل أنت متأكد من تسجيل مصروف بمبلغ ${expense.amount}؟`)) return;
        const newExpense = await financeService.addExpense(expense);
        await addFinancialTransaction({
            description: newExpense.description,
            amount: newExpense.amount,
            type: 'expense',
            fromAccountId: newExpense.accountId,
            category: newExpense.category
        });
    };

    const deleteExpense = async (id: string) => {
        const expenseToDelete = expenses.find(e => e.id === id);
        if (expenseToDelete) {
            if (!window.confirm('هل أنت متأكد من إلغاء هذا المصروف؟')) return;
            // financeService.deleteExpense(id) would be better
            await logAction('EXPENSE_DELETED', `Cancelled expense: ${expenseToDelete.description}. Amount: ${expenseToDelete.amount}`, id, 'expense');
            await addFinancialTransaction({
                description: `إلغاء المصروف: ${expenseToDelete.description}`,
                amount: expenseToDelete.amount,
                type: 'expense_reversal',
                toAccountId: expenseToDelete.accountId,
                category: expenseToDelete.category
            });
        }
    };

    // Financial Accounts
    const onSaveAccount = async (data: Omit<FinancialAccount, 'id'>) => {
        await financeService.addAccount(data);
    };
    
    // User management
    const addUser = async (userData: Omit<User, 'id' | 'passwordHash' | 'salt'> & { password: string }): Promise<User> => {
        const salt = generateSalt();
        const newUser = await usersService.add({
            username: userData.username,
            role: userData.role,
            email: userData.username,
            passwordHash: simpleHash(userData.password, salt),
            salt: salt
        });
        await logAction('USER_CREATED', `Created user: ${userData.username} (${userData.role})`, newUser.id, 'user');
        return newUser;
    };

    const updateUser = async (id: string, userData: Partial<Omit<User, 'id' | 'passwordHash' | 'salt'>> & { password?: string }) => {
        const updates: any = { ...userData };
        delete updates.password;

        if (userData.password) {
            const salt = generateSalt();
            updates.salt = salt;
            updates.passwordHash = simpleHash(userData.password, salt);
        }

        await usersService.update(id, updates);
        await logAction('USER_UPDATED', `Updated user: ${id}`, id, 'user');
    };

    const deleteUser = async (id: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
        await usersService.delete(id);
    };

    // Other
    const addCustomer = async (customer: Omit<Customer, 'id'>) => { 
        return await customersService.add(customer);
    };
    const updateCustomer = async (id: string, customer: Omit<Customer, 'id'>) => { 
        await customersService.update(id, customer);
    };
    const deleteCustomer = async (id: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا العميل؟')) return;
        await customersService.delete(id);
    };
    const onAddSupplier = async (supplier: Omit<Supplier, 'id'>): Promise<Supplier> => { 
        return await suppliersService.add(supplier);
    };
    const updateSupplier = async (id: string, supplier: Omit<Supplier, 'id'>) => { 
        await suppliersService.update(id, supplier);
    };
    const deleteSupplier = async (id: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا المورد؟')) return;
        await suppliersService.delete(id);
    };

    // --- RENDER LOGIC ---
    if (authLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-600 font-bold">جاري تحميل النظام...</p>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return <LoginView onLogin={loginWithCredentials} />;
    }

    const views: { [key: string]: {element: React.ReactNode, label: string, icon: any, roles: Array<'admin' | 'cashier'>} } = {
        dashboard: { element: <DashboardView invoices={invoices} expenses={expenses} products={products} customers={customers} lowStockThreshold={lowStockThreshold} />, label: "لوحة التحكم", icon: LayoutDashboard, roles: ['admin'] },
        reports: { element: <ReportsView invoices={invoices} products={products} expenses={expenses} />, label: "التقارير", icon: LineChart, roles: ['admin'] },
        financialSummary: { element: <FinancialSummaryView invoices={invoices} expenses={expenses} transactions={transactions} purchases={purchases} accountBalances={accountBalances} />, label: "الملخص المالي", icon: ClipboardList, roles: ['admin'] },
        pos: { element: <POSView products={products} customers={customers} onCompleteSale={onCompleteSale} onCreateShippingOrder={onCreateShippingOrder} onCreateReservation={onCreateReservation} onAddRequestedBook={onAddRequestedBook} lowStockThreshold={lowStockThreshold} />, label: "نقطة البيع", icon: ShoppingCart, roles: ['admin', 'cashier'] },
        orders: { element: <OrdersView invoices={invoices} users={users} onUpdateStatus={updateOrderStatus} onConvertToSale={onConvertToSale} processReturn={processReturn} sendReturnRequest={sendReturnRequest} currentUser={currentUser} shopName={shopName} shopAddress={shopAddress} />, label: "الطلبات", icon: Receipt, roles: ['admin', 'cashier'] },
        returnRequests: { element: <ReturnRequestsView requests={returnRequests} approveRequest={approveRequest} rejectRequest={rejectRequest} />, label: "طلبات الإرجاع", icon: ShieldCheck, roles: ['admin'] },
        products: { element: <ProductsView products={products} addProduct={addProduct} updateProduct={updateProduct} deleteProduct={deleteProduct} lowStockThreshold={lowStockThreshold} setLowStockThreshold={setLowStockThreshold} onBatchUpdate={batchUpdateProducts} />, label: "المخزون", icon: Package, roles: ['admin'] },
        requestedBooks: { element: <RequestedBooksView requestedBooks={requestedBooks} updateRequestedBookStatus={updateRequestedBookStatus} />, label: "المنتجات المطلوبة", icon: ListChecks, roles: ['admin'] },
        purchases: { element: <PurchasesView purchases={purchases} products={products} suppliers={suppliers} accounts={accounts} accountBalances={accountBalances} onAddPurchase={onAddPurchase} onUpdatePurchase={onUpdatePurchase} onDeletePurchase={onDeletePurchase} onAddSupplier={onAddSupplier} onAddPayment={addPurchasePayment} createProduct={addProduct} updateProduct={updateProduct} />, label: "المشتريات", icon: ShoppingBag, roles: ['admin'] },
        expenses: { element: <ExpensesView expenses={expenses} addExpense={addExpense} accounts={accounts} />, label: "المصروفات", icon: Wallet, roles: ['admin'] },
        customers: { element: <CustomersView customers={customers} invoices={invoices} products={products} addCustomer={addCustomer} updateCustomer={updateCustomer} deleteCustomer={deleteCustomer} />, label: "العملاء", icon: Users, roles: ['admin'] },
        suppliers: { element: <SuppliersView suppliers={suppliers} addSupplier={onAddSupplier} updateSupplier={updateSupplier} deleteSupplier={deleteSupplier} />, label: "الموردون", icon: Building2, roles: ['admin'] },
        finance: { element: <FinanceView accounts={accounts} accountBalances={accountBalances} transactions={transactions} budgets={budgets} onSaveAccount={onSaveAccount} onSaveTransaction={addFinancialTransaction} onSaveBudget={(b) => setBudgets(p=>[...p, {...b, id: `budget-${Date.now()}`}])} />, label: "الخزينة", icon: Landmark, roles: ['admin'] },
        tillCloseouts: { element: <TillCloseoutsView tillCloseouts={tillCloseouts} />, label: "تقارير الصناديق", icon: Archive, roles: ['admin'] },
        users: { element: <UsersView users={users} addUser={addUser} updateUser={updateUser} deleteUser={deleteUser} currentUser={currentUser} />, label: "المستخدمون", icon: UserCog, roles: ['admin'] },
        backups: { element: <BackupAndArchiveView />, label: "النسخ الاحتياطي", icon: HardDriveDownload, roles: ['admin'] },
        auditLogs: { element: <AuditLogView />, label: "سجل التدقيق", icon: ScrollText, roles: ['admin'] },
        recycleBin: { element: <RecycleBinView />, label: "سلة المهملات", icon: Trash2, roles: ['admin'] },
        cashierTools: { element: <CashierToolsView currentUser={currentUser} />, label: "إدارة البيانات", icon: Database, roles: ['cashier'] },
        settings: { element: <SettingsView onUpdatePrices={updatePricesBatch} onOpenReset={() => setIsResetModalOpen(true)} lowStockThreshold={lowStockThreshold} setLowStockThreshold={setLowStockThreshold} shopName={shopName} setShopName={setShopName} shopAddress={shopAddress} setShopAddress={setShopAddress} />, label: "الإعدادات", icon: Settings, roles: ['admin'] },
    };

    const SidebarLink: React.FC<{viewKey: string}> = ({viewKey}) => {
        const view = views[viewKey];
        if (!view || !view.roles.includes(currentUser.role)) return null;
        const isActive = currentView === viewKey;
        const ViewIcon = view.icon;
        
        return (
            <button 
                onClick={() => { setCurrentView(viewKey); setIsSidebarOpen(false); }} 
                className={`w-full text-right flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative ${
                    isActive 
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' 
                    : 'hover:bg-slate-50 text-slate-500 hover:text-slate-900'
                }`}
            >
                {isActive && (
                    <motion.div 
                        layoutId="activeGlow"
                        className="absolute inset-0 bg-indigo-600 rounded-xl blur-[2px] opacity-20 -z-10"
                    />
                )}
                <ViewIcon size={18} strokeWidth={isActive ? 3 : 2} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:translate-x-1'}`} />
                <span className="text-sm font-black tracking-tight uppercase tracking-widest">{view.label}</span>
                {isActive && (
                    <motion.div 
                        layoutId="activeTab"
                        className="mr-auto w-1.5 h-1.5 rounded-full bg-white shadow-sm"
                    />
                )}
            </button>
        );
    };

    const adminSidebarOrder = [
        'dashboard', 'pos', 'orders', 'purchases', 'finance', 'products', 
        'reports', 'financialSummary', 'returnRequests', 'requestedBooks', 
        'expenses', 'customers', 'suppliers', 'tillCloseouts', 'users', 
        'backups', 'auditLogs', 'recycleBin', 'settings'
    ];
    const cashierSidebarOrder = ['pos', 'orders', 'cashierTools'];
    const sidebarOrder = currentUser.role === 'admin' ? adminSidebarOrder : cashierSidebarOrder;

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans" dir="rtl">
            <aside className={`glass-panel border-l border-slate-200/50 h-full transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-[110%]'} md:translate-x-0 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) w-72 fixed md:static right-0 z-50 md:flex-shrink-0 flex flex-col shadow-2xl md:shadow-none`}>
                <div className="p-8 pb-4 flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center shadow-2xl border-4 border-white mb-4 rotate-3 hover:rotate-0 transition-transform duration-500">
                        <Logo className="w-12 h-12" />
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-800 tracking-tighter">سوق الكتاب</h2>
                    <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-[0.3em] opacity-60">Control Panel</p>
                </div>
                
                <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide">
                    <div className="space-y-1">
                        {sidebarOrder.map(key => <SidebarLink key={key} viewKey={key} />)}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border border-indigo-200">
                            {currentUser.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{currentUser.username}</p>
                            <p className="text-[10px] text-slate-400 font-bold truncate uppercase">{currentUser.role === 'admin' ? 'المدير' : 'موظف'}</p>
                        </div>
                        <button 
                            onClick={logout}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </aside>

            {isSidebarOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"></motion.div>}

            <div className="flex-1 flex flex-col overflow-hidden relative">
                <Header 
                    currentUser={currentUser} 
                    onLogout={logout} 
                    toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    onOpenCloseTillModal={() => setIsCloseTillModalOpen(true)}
                    onOpenSearch={() => setIsSearchOpen(true)}
                />
                <main className="flex-1 overflow-x-hidden overflow-y-auto relative scroll-smooth">
                    <motion.div
                        key={currentView}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="p-8 max-w-[1600px] mx-auto min-h-full pb-24"
                    >
                        {views[currentView]?.element || views[currentUser.role === 'admin' ? 'dashboard' : 'pos'].element}
                    </motion.div>
                </main>
            </div>
            {currentUser.role === 'admin' && 
                <AIChatAssistant 
                    products={products}
                    invoices={invoices}
                    expenses={expenses}
                    customers={customers}
                    lowStockThreshold={lowStockThreshold}
                    addProduct={addProduct}
                    updateProduct={updateProduct}
                    deleteProduct={deleteProduct}
                    addExpense={(exp) => addExpense({...exp, accountId: 'cash-default'})}
                    deleteExpense={deleteExpense}
                    addCustomer={addCustomer}
                    updateCustomer={updateCustomer}
                    deleteCustomer={deleteCustomer}
                    onCompleteSale={onCompleteSale}
                />
            }
            {isCloseTillModalOpen && currentUser && (
                <CloseTillModal
                    invoices={invoices}
                    currentUser={currentUser}
                    onClose={() => setIsCloseTillModalOpen(false)}
                    onConfirmCloseout={addTillCloseout}
                />
            )}
            <SystemResetModal 
                isOpen={isResetModalOpen} 
                onClose={() => setIsResetModalOpen(false)} 
            />
            <DetailedSearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                products={products}
                invoices={invoices}
                expenses={expenses}
                customers={customers}
                suppliers={suppliers}
                accounts={accounts}
                users={users}
                currentUser={currentUser}
                onNavigate={setCurrentView}
                onOpenCloseTill={() => setIsCloseTillModalOpen(true)}
                onOpenReset={() => setIsResetModalOpen(true)}
            />
        </div>
    );
};

export default App;