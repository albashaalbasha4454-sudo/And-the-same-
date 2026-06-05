import React, { useState, useMemo } from 'react';
import type { Customer, Invoice, Product } from '../types';
import Modal from './Modal';
import Pagination from './common/Pagination';
import { 
    Users, Search, Plus, Edit3, 
    Trash2, Phone, MapPin, Mail, 
    UserPlus, MoreVertical, MessageSquare,
    UserCheck, UserMinus, Clock, AlertTriangle,
    Calendar, DollarSign, Check, X, Briefcase, 
    Wrench, PlusCircle, Printer, ArrowUpRight, 
    Tag, Filter, TrendingUp, HeartHandshake, 
    User, ListChecks, FileText, Smartphone,
    MessageSquarePlus, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomersViewProps {
  customers: Customer[];
  invoices: Invoice[];
  products: Product[];
  addCustomer: (customer: Omit<Customer, 'id'>) => void | Promise<any>;
  updateCustomer: (id: string, customer: Omit<Customer, 'id'>) => void | Promise<any>;
  deleteCustomer: (id: string) => void | Promise<any>;
}

interface CRMNote {
  id: string;
  content: string;
  date: string; // ISO Timestamp
  type: 'general' | 'repair' | 'recharge' | 'debt_followup';
  author: string;
}

const ITEMS_PER_PAGE = 8;

const CRMStatCard = ({ title, value, icon: Icon, colorClass, subtext, trend }: { 
    title: string, 
    value: string | number, 
    icon: any, 
    colorClass: string, 
    subtext?: string,
    trend?: string
}) => (
    <motion.div 
        whileHover={{ y: -4 }}
        className="card-professional p-6 flex flex-col justify-between bg-white border border-slate-200/60 shadow-sm rounded-2xl"
    >
        <div className="flex justify-between items-start mb-3">
            <div className={`p-3 rounded-2xl ${colorClass.replace('text-', 'bg-').split(' ')[0]}/10 ${colorClass}`}>
                <Icon size={24} strokeWidth={2} />
            </div>
            {trend && (
                <div className="text-[10px] font-bold px-2 py-1 bg-slate-50 text-slate-500 rounded-full border border-slate-100">
                    {trend}
                </div>
            )}
        </div>
        <div>
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{title}</h3>
            <p className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">{value}</p>
            {subtext && <p className="text-[10px] text-slate-400 font-bold mt-1">{subtext}</p>}
        </div>
    </motion.div>
);

const CustomersView: React.FC<CustomersViewProps> = ({ 
  customers, 
  invoices = [], 
  products = [], 
  addCustomer, 
  updateCustomer, 
  deleteCustomer 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCRMCustomer, setSelectedCRMCustomer] = useState<Customer | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [crmCategoryFilter, setCrmCategoryFilter] = useState<'all' | 'vip' | 'debtors' | 'services' | 'inactive'>('all');

  // Parse notes for individual customer (structured JSON fallback to flat text)
  const getCustomerNotes = (notesField?: string): CRMNote[] => {
    if (!notesField) return [];
    try {
      const parsed = JSON.parse(notesField);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      // Return as legacy general notes
      if (notesField.trim() === '') return [];
      return [{
        id: 'legacy-note',
        content: notesField,
        date: new Date().toISOString(),
        type: 'general',
        author: 'النظام'
      }];
    }
    return [];
  };

  // Total Customer Lifetime Stats
  const baseStats = useMemo(() => {
    let totalSpent = 0;
    let totalOutstandingFees = 0;
    let serviceUsers = 0;

    customers.forEach(customer => {
      totalOutstandingFees += (customer.balance || 0);

      // Invoices matching this customer
      const clientInvoices = invoices.filter(inv => inv.customerInfo?.id === customer.id || (inv.customerInfo?.phone === customer.phone && customer.phone !== ''));
      const spent = clientInvoices.reduce((sum, inv) => sum + (inv.status === 'completed' ? inv.total : 0), 0);
      totalSpent += spent;

      const hasService = clientInvoices.some(inv => 
        inv.items.some(item => {
          const prod = products.find(p => p.id === item.productId);
          return prod?.type === 'service';
        })
      );
      if (hasService) serviceUsers++;
    });

    return {
      totalSpent,
      totalOutstandingFees,
      serviceUsers,
      totalNotes: customers.reduce((sum, c) => sum + getCustomerNotes(c.notes).length, 0)
    };
  }, [customers, invoices, products]);

  // Determine Customer Segments
  const getCustomerSegment = (customer: Customer) => {
    const clientInvoices = invoices.filter(inv => inv.customerInfo?.id === customer.id || (inv.customerInfo?.phone === customer.phone && customer.phone !== ''));
    const totalPurchases = clientInvoices.reduce((sum, inv) => sum + (inv.status === 'completed' ? inv.total : 0), 0);
    const balance = customer.balance || 0;
    const notesCount = getCustomerNotes(customer.notes).length;

    if (balance > 100) return { label: 'ذو مديونية ⚠️', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (totalPurchases > 1000 || clientInvoices.length >= 5) return { label: 'عميل ذهبي VIP ⭐', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    if (notesCount > 3) return { label: 'تفاعل مستمر 🛠️', color: 'bg-sky-50 text-sky-700 border-sky-200' };
    if (clientInvoices.length === 0) return { label: 'جديد / لم يشتر بعد ✨', color: 'bg-slate-100 text-slate-600 border-slate-200' };
    return { label: 'عميل عام 👤', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  // Filtering Customer List
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      // Search
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.address && customer.address.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (!matchesSearch) return false;

      // CRM Filter Segments
      const clientInvoices = invoices.filter(inv => inv.customerInfo?.id === customer.id || (inv.customerInfo?.phone === customer.phone && customer.phone !== ''));
      const balance = customer.balance || 0;

      switch(crmCategoryFilter) {
        case 'vip':
          const totalPurchases = clientInvoices.reduce((sum, inv) => sum + (inv.status === 'completed' ? inv.total : 0), 0);
          return totalPurchases > 1000 || clientInvoices.length >= 5;
        case 'debtors':
          return balance > 0;
        case 'services':
          return clientInvoices.some(inv => 
            inv.items.some(item => {
              const prod = products.find(p => p.id === item.productId);
              return prod?.type === 'service';
            })
          ) || getCustomerNotes(customer.notes).some(n => n.type === 'repair' || n.type === 'recharge');
        case 'inactive':
          return clientInvoices.length === 0 && getCustomerNotes(customer.notes).length === 0;
        default:
          return true;
      }
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, searchTerm, crmCategoryFilter, invoices, products]);

  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCustomers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCustomers, currentPage]);

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);

  const handleOpenEditModal = (customer: Customer | null = null, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingCustomer(null);
    setIsModalOpen(false);
  };

  const handleSave = async (customerData: Omit<Customer, 'id'>) => {
    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, customerData);
      // Synchronize details view if editing the active CRM customer
      if (selectedCRMCustomer && selectedCRMCustomer.id === editingCustomer.id) {
        setSelectedCRMCustomer({ ...editingCustomer, ...customerData });
      }
    } else {
      await addCustomer(customerData);
    }
    handleCloseModal();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      await deleteCustomer(id);
      if (selectedCRMCustomer?.id === id) {
        setSelectedCRMCustomer(null);
      }
    }
  };

  return (
    <div className="space-y-8 p-1 sm:p-2">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
                <span className="w-8 h-1 bg-indigo-600 rounded-full"></span>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 opacity-80">Telecom CRM & Relations</span>
            </div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">إدارة علاقات العملاء (CRM)</h2>
            <p className="text-slate-400 font-medium text-sm">قاعدة بيانات متكاملة لتتبع حسابات المشتركين، وسجل المشتريات والصيانة، وتسجيل الملاحظات.</p>
          </div>

          <button onClick={() => handleOpenEditModal()} className="btn-primary shadow-xl shadow-indigo-600/20 py-3.5 px-6">
              <UserPlus size={20} className="ml-1" strokeWidth={3} />
              تسجيل عميل جديد
          </button>
      </div>

      {/* CRM Dashboard Mini Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <CRMStatCard title="إجمالي العملاء المشتركين" value={customers.length} icon={Users} colorClass="text-indigo-600" trend="قاعدة البيانات" subtext="عملاء مسجلين محلياً" />
        <CRMStatCard title="إجمالي المبيعات للعملاء" value={`${baseStats.totalSpent.toLocaleString()} د.أ`} icon={TrendingUp} colorClass="text-emerald-600" trend="القيمة التراكمية" subtext="مبيعات الأجهزة والخدمات" />
        <CRMStatCard title="مستحقات معلقة وطالب مبيعات" value={`${baseStats.totalOutstandingFees.toLocaleString()} د.أ`} icon={AlertTriangle} colorClass="text-rose-500" trend="ديون معلقة" subtext="حسابات العملاء الدائنة" />
         <CRMStatCard title="سجل التفاعلات والصيانة" value={`${baseStats.totalNotes} ملاحظة`} icon={Wrench} colorClass="text-sky-600" trend="المتابعة الفنية" subtext="تنبيهات وأجهزة تحت الصيانة" />
      </div>

      {/* Main CRM Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Side: Customers Directory List (8 Cols) */}
        <div className="xl:col-span-8 space-y-6">
          <div className="card-professional bg-white overflow-hidden border border-slate-200/60 shadow-sm rounded-2xl">
            {/* Filtering Utilities */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between ">
                <div className="relative group w-full md:w-96">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-400 transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="ابحث باسم العميل، رقم الهاتف، أو العنوان..." 
                        value={searchTerm} 
                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                        className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pr-12 pl-4 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 shadow-sm"
                    />
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                    <button 
                      onClick={() => { setCrmCategoryFilter('all'); setCurrentPage(1); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${crmCategoryFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'}`}
                    >
                      الكل
                    </button>
                    <button 
                      onClick={() => { setCrmCategoryFilter('vip'); setCurrentPage(1); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${crmCategoryFilter === 'vip' ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'}`}
                    >
                      عملاء ذهبيين ⭐
                    </button>
                    <button 
                      onClick={() => { setCrmCategoryFilter('debtors'); setCurrentPage(1); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${crmCategoryFilter === 'debtors' ? 'bg-rose-600 text-white' : 'bg-white hover:bg-slate-100 text-rose-600 border border-rose-200'}`}
                    >
                      الديون المطلوبة ⚠️
                    </button>
                    <button 
                      onClick={() => { setCrmCategoryFilter('services'); setCurrentPage(1); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${crmCategoryFilter === 'services' ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'}`}
                    >
                      مشتركي الصيانة والباقات 🛠️
                    </button>
                    <button 
                      onClick={() => { setCrmCategoryFilter('inactive'); setCurrentPage(1); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${crmCategoryFilter === 'inactive' ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'}`}
                    >
                      جدد/غير نشطين
                    </button>
                </div>
              </div>
            </div>

            {/* Customers Interactive Directory Table */}
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50/25">
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">معلومات العميل</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">تواصل وسياق</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">التصنيف التسويقي / الحسابي</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">الرصيد المالي</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-36">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-slate-400 font-bold">
                        <Users className="mx-auto mb-3 opacity-20" size={40} />
                        لا يوجد عملاء يطابقون خيارات البحث المختارة في الوقت الحالي.
                      </td>
                    </tr>
                  ) : (
                    paginatedCustomers.map((customer, idx) => {
                      const segment = getCustomerSegment(customer);
                      const isSelected = selectedCRMCustomer?.id === customer.id;

                      return (
                        <motion.tr 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          key={customer.id} 
                          onClick={() => setSelectedCRMCustomer(customer)}
                          className={`group cursor-pointer transition-all ${isSelected ? 'bg-indigo-50/50 hover:bg-indigo-50 border-r-4 border-indigo-600' : 'hover:bg-slate-50/50'}`}
                        >
                          <td className="p-5">
                            <div className="flex items-center gap-4">
                              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                                {customer.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-black text-slate-800 text-base tracking-tight leading-none mb-1.5">{customer.name}</p>
                                <span className="text-[9px] text-slate-400 font-bold tracking-widest">ID: {customer.id.substring(0, 8).toUpperCase()}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-5">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-slate-600">
                                <Phone size={13} className="text-slate-300" />
                                <span className="text-xs font-black tabular-nums">{customer.phone}</span>
                              </div>
                              {customer.address && (
                                <div className="flex items-center gap-2 text-slate-400">
                                  <MapPin size={13} className="text-slate-300 flex-shrink-0" />
                                  <p className="text-[11px] font-bold truncate max-w-[150px]">{customer.address}</p>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-5 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black border ${segment.color}`}>
                              {segment.label}
                            </span>
                          </td>
                          <td className="p-5 text-left">
                            <div className="inline-flex flex-col items-end">
                              <span className={`text-base font-black tabular-nums leading-none ${customer.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {customer.balance.toLocaleString()} د.أ
                              </span>
                              <span className="text-[9px] text-slate-400 font-bold mt-1">
                                {customer.balance > 0 ? 'مستحق للمحل (عليه)' : 'لا يترتب عليه مبالغ'}
                              </span>
                            </div>
                          </td>
                          <td className="p-5 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <button 
                                onClick={(e) => handleOpenEditModal(customer, e)} 
                                className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                title="تعديل الحساب"
                              >
                                <Edit3 size={17} />
                              </button>
                              <button 
                                onClick={(e) => handleDelete(customer.id, e)} 
                                className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                title="حذف"
                              >
                                <Trash2 size={17} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination / Total info */}
            <div className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-100 bg-slate-50/50">
              <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                يعرض {paginatedCustomers.length} من أصل {filteredCustomers.length} نتيجة مطابقة
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={ITEMS_PER_PAGE} totalItems={filteredCustomers.length} />
            </div>
          </div>
        </div>

        {/* Right Side: CRM HUB Detail Panel (4 Cols) */}
        <div className="xl:col-span-4">
          <AnimatePresence mode="wait">
            {selectedCRMCustomer ? (
              <motion.div 
                key={selectedCRMCustomer.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <CRMDetailsPanel 
                  customer={selectedCRMCustomer} 
                  invoices={invoices} 
                  products={products}
                  onUpdateNotes={async (newSerializedNotes) => {
                    const id = selectedCRMCustomer.id;
                    const { id: _, ...rest } = selectedCRMCustomer;
                    const updated = { ...rest, notes: newSerializedNotes };
                    await updateCustomer(id, updated);
                    setSelectedCRMCustomer({ id, ...updated });
                  }}
                  onDeductBalance={async (amountToDeduct) => {
                    const id = selectedCRMCustomer.id;
                    const { id: _, ...rest } = selectedCRMCustomer;
                    const currentBalance = selectedCRMCustomer.balance || 0;
                    const updated = { ...rest, balance: Math.max(0, currentBalance - amountToDeduct) };
                    await updateCustomer(id, updated);
                    setSelectedCRMCustomer({ id, ...updated });
                  }}
                  onClose={() => setSelectedCRMCustomer(null)}
                />
              </motion.div>
            ) : (
              <div className="card-professional p-8 text-center bg-slate-50/50 border border-slate-200/60 rounded-2xl flex flex-col items-center justify-center min-h-[450px]">
                <div className="w-16 h-16 bg-white shadow-sm border border-slate-100 text-slate-300 rounded-2xl flex items-center justify-center mb-4">
                  <Smartphone className="animate-bounce" size={28} />
                </div>
                <h4 className="font-extrabold text-slate-800 text-base mb-1">مركز خدمة العملاء والمتابعة (CRM)</h4>
                <p className="text-xs text-slate-400 max-w-[280px] font-bold leading-relaxed">
                  الرجاء النقر على أي عميل في القائمة يساراً لفتح ملفه المالي، سجل الصيانة النشط، وتتبع مشترياته والخدمات المقدمة له.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

      <AnimatePresence>
          {isModalOpen && <CustomerModal customer={editingCustomer} onClose={handleCloseModal} onSave={handleSave} />}
      </AnimatePresence>
    </div>
  );
};

/* CRM Details Sub-Component Panel */
interface CRMDetailsPanelProps {
  customer: Customer;
  invoices: Invoice[];
  products: Product[];
  onUpdateNotes: (newSerializedNotes: string) => Promise<void>;
  onDeductBalance: (amountToDeduct: number) => Promise<void>;
  onClose: () => void;
}

const CRMDetailsPanel: React.FC<CRMDetailsPanelProps> = ({ 
  customer, 
  invoices, 
  products, 
  onUpdateNotes,
  onDeductBalance,
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'notes'>('overview');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteType, setNewNoteType] = useState<CRMNote['type']>('general');
  const [isDeductingModalOpen, setIsDeductingModalOpen] = useState(false);
  const [deductAmount, setDeductAmount] = useState('');
  const [showMockCommunicationMsg, setShowMockCommunicationMsg] = useState<'sms' | 'whatsapp' | null>(null);

  // Parse notes safetly
  const crmNotes = useMemo(() => {
    const notesField = customer.notes || '';
    try {
      const parsed = JSON.parse(notesField);
      if (Array.isArray(parsed)) return parsed as CRMNote[];
    } catch(e) {}
    if (notesField.trim() === '') return [];
    return [{ id: 'legacy-note', content: notesField, date: new Date().toISOString(), type: 'general' as const, author: 'من الموظف' }];
  }, [customer.notes]);

  // Combined Invoices
  const clientInvoices = useMemo(() => {
    return invoices.filter(inv => inv.customerInfo?.id === customer.id || (inv.customerInfo?.phone === customer.phone && customer.phone !== ''))
                   .sort((a,b) => b.date.localeCompare(a.date));
  }, [invoices, customer]);

  // Aggregate Customer Data
  const aggregates = useMemo(() => {
    let totalPurchased = 0;
    let actualPaid = 0;
    let itemsBrought: Array<{name: string, quantity: number, price: number, type: 'product' | 'service'}> = [];

    clientInvoices.forEach(inv => {
      if (inv.status !== 'completed') return;
      totalPurchased += inv.total;
      
      if (inv.paymentStatus === 'paid') {
        actualPaid += inv.total;
      } else if (inv.paymentStatus === 'partial') {
        // Assume has half paid style
        actualPaid += (inv.total - (customer.balance > 0 ? Math.min(inv.total, customer.balance) : 0));
      }

      inv.items.forEach(item => {
        const matchingProduct = products.find(p => p.id === item.productId);
        itemsBrought.push({
          name: item.productName,
          quantity: item.quantity,
          price: item.price,
          type: matchingProduct?.type || 'product'
        });
      });
    });

    return {
      totalPurchased,
      actualPaid,
      itemsBrought
    };
  }, [clientInvoices, products, customer.balance]);

  // Add Interactive CRM note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    const noteToAdd: CRMNote = {
      id: `note-${Date.now()}`,
      content: newNoteContent,
      date: new Date().toISOString(),
      type: newNoteType,
      author: 'المدير المالي'
    };

    const updatedNotes = [noteToAdd, ...crmNotes];
    await onUpdateNotes(JSON.stringify(updatedNotes));
    setNewNoteContent('');
  };

  // Delete CRM note
  const handleDeleteNote = async (noteIdHex: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الملاحظة الفنية للعميل؟')) {
      const updatedNotes = crmNotes.filter(n => n.id !== noteIdHex);
      await onUpdateNotes(JSON.stringify(updatedNotes));
    }
  };

  // Settle Debt / Deduct Balance Action
  const handleDeductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(deductAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('الرجاء إدخال مبلغ دفع صالح!');
      return;
    }
    await onDeductBalance(amount);
    setDeductAmount('');
    setIsDeductingModalOpen(false);
  };

  // Simulate contact template generator
  const getSimulatedMessage = (type: 'sms' | 'whatsapp') => {
    const maintenanceNotes = crmNotes.find(n => n.type === 'repair');
    const deviceDetail = maintenanceNotes ? `المتعلق بـ (${maintenanceNotes.content.substring(0, 40)}...)` : 'الخاص بك';

    if (customer.balance > 0) {
      return `مرحباً أستاذ ${customer.name}، نود تذكيرك بلطف بأن هناك رصيد ذمم مستحق لبرنامج حسابات محل الاتصالات بقيمة ${customer.balance} د.أ. يرجى التكرم بزيارتنا لتسوية الحساب. شكراً جزيلاً لك!`;
    }
    
    if (maintenanceNotes) {
      return `مرحباً أستاذ ${customer.name}، نود إعلامك من قسم الصيانة في محل الاتصالات بأن جهازك ${deviceDetail} قد تم فحصه وإصلاحه وبانتظارك لاستلامه في المحل. أهلاً بك!`;
    }

    return `مرحباً أستاذ ${customer.name}، يسعدنا تواصلك مع محل الاتصالات. نرسل لك بطاقة اشتراكك ويسعدنا دائماً تقديم أفضل عروض الهواتف والإكسسوارات والخدمات لك!`;
  };

  return (
    <div className="card-professional bg-white border border-indigo-100 shadow-xl rounded-2xl overflow-hidden relative">
      
      {/* Decorative colored badge on CRM Hub */}
      <div className="absolute top-0 right-0 left-0 h-1.5 bg-indigo-600"></div>

      {/* CRM Customer Header */}
      <div className="p-6 border-b border-slate-50 flex justify-between items-start bg-slate-50/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-700 font-black flex items-center justify-center rounded-xl text-base">
            {customer.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-base leading-none mb-1">{customer.name}</h3>
            <span className="text-[10px] text-slate-400 font-bold tabular-nums">هاتف: {customer.phone}</span>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* CRM Sheet Category Tabs */}
      <div className="flex border-b border-slate-100">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-3 text-center text-xs font-black transition-all ${activeTab === 'overview' ? 'text-indigo-600 border-b-2 border-indigo-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'}`}
        >
          نظرة عامة
        </button>
        <button 
          onClick={() => setActiveTab('invoices')}
          className={`flex-1 py-3 text-center text-xs font-black transition-all ${activeTab === 'invoices' ? 'text-indigo-600 border-b-2 border-indigo-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'}`}
        >
          المشتريات والخدمات ({clientInvoices.length})
        </button>
        <button 
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-3 text-center text-xs font-black transition-all ${activeTab === 'notes' ? 'text-indigo-600 border-b-2 border-indigo-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'}`}
        >
          الملاحظات والمتابعة ({crmNotes.length})
        </button>
      </div>

      {/* CRM Dynamic Panels */}
      <div className="p-6 min-h-[380px] max-h-[550px] overflow-y-auto custom-scrollbar">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Customer Virtual Telecom card */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-inner relative overflow-hidden">
               <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-xl"></div>
               <div className="flex justify-between items-start mb-6">
                 <div>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">بطاقة العميل المتميز</p>
                   <p className="text-sm font-black truncate max-w-[180px]">{customer.name}</p>
                 </div>
                 <Smartphone className="text-white/30" size={20} />
               </div>
               <div className="mb-4">
                 <p className="text-[10px] text-slate-400 font-bold leading-none mb-1">الرصيد المعلق (الذمم)</p>
                 <span className={`text-2xl font-black tracking-tight ${customer.balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                   {customer.balance.toLocaleString()} د.أ
                 </span>
               </div>
               <div className="flex justify-between items-end border-t border-white/5 pt-3">
                 <div>
                   <span className="text-[9px] text-slate-300 font-bold block leading-none mb-0.5">معدل الشراء</span>
                   <span className="text-xs font-extrabold tabular-nums">{(aggregates.totalPurchased / Math.max(1, clientInvoices.length)).toFixed(1)} د.أ</span>
                 </div>
                 <div>
                   <span className="text-[9px] text-slate-300 font-bold block leading-none mb-0.5">معاملات مسجلة</span>
                   <span className="text-xs font-extrabold tabular-nums">{clientInvoices.length} فواتير</span>
                 </div>
               </div>
            </div>

            {/* General details list */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl">
              <h4 className="font-bold text-xs text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-200/50 pb-1">المعلومات الأساسية</h4>
              <div className="flex gap-2 items-center text-xs justify-between">
                <span className="text-slate-400 font-bold">العنوان:</span>
                <span className="text-slate-700 font-extrabold truncate max-w-[180px]">{customer.address || 'غير مسجل'}</span>
              </div>
              <div className="flex gap-2 items-center text-xs justify-between">
                <span className="text-slate-400 font-bold">البريد الإلكتروني:</span>
                <span className="text-slate-700 font-extrabold truncate max-w-[180px]">{customer.email || 'لا يوجد'}</span>
              </div>
              <div className="flex gap-2 items-center text-xs justify-between">
                <span className="text-slate-400 font-bold">تاريخ التسجيل:</span>
                <span className="text-slate-700 font-extrabold">منذ إطلاق الحساب</span>
              </div>
            </div>

            {/* Accounts Standing */}
            <div className="space-y-3 border border-slate-100 p-4 rounded-xl">
              <h4 className="font-bold text-xs text-slate-500 uppercase tracking-widest mb-1.5">الملخص المحاسبي للعميل</h4>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl border border-emerald-100">
                  <span className="text-[9px] font-black uppercase text-emerald-500 block">إجمالي مشترياته</span>
                  <span className="text-base font-black tabular-nums">{aggregates.totalPurchased} د.أ</span>
                </div>
                <div className="bg-indigo-50 text-indigo-700 p-3 rounded-xl border border-indigo-100">
                  <span className="text-[9px] font-black uppercase text-indigo-500 block">إجمالي المقبوض منه</span>
                  <span className="text-base font-black tabular-nums">{aggregates.actualPaid} د.أ</span>
                </div>
              </div>
              
              {customer.balance > 0 && (
                <div className="pt-2">
                  <button 
                    onClick={() => setIsDeductingModalOpen(true)}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xs py-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <DollarSign size={15} />
                    تسجيل دفعة نقدية وتخفيض الدين
                  </button>
                </div>
              )}
            </div>

            {/* Quick simulated communications panel */}
            <div className="space-y-3 bg-indigo-50/30 border border-indigo-100/50 p-4 rounded-2xl">
              <h4 className="font-black text-xs text-indigo-900 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                 <MessageSquarePlus size={15} />
                 إرسال إشعارات ومتابعة سريعة
              </h4>
              <p className="text-[10px] text-indigo-700 font-bold leading-relaxed">
                أنشئ رسالة كجهاز صيانة جاهز أو تذكير الديون لتطبيق الرسائل بشكل احترافي.
              </p>
              <div className="flex gap-2 pt-1">
                <button 
                  onClick={() => setShowMockCommunicationMsg('sms')}
                  className="flex-1 bg-white hover:bg-indigo-100/50 border border-indigo-200 text-indigo-700 font-black text-[10px] py-2 rounded-xl transition-all"
                >
                  رسالة نصية SMS 💬
                </button>
                <button 
                  onClick={() => setShowMockCommunicationMsg('whatsapp')}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] py-2 rounded-xl transition-all shadow-sm"
                >
                  واتساب سريع 🟢
                </button>
              </div>

              {/* Show simulated output */}
              {showMockCommunicationMsg && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 p-3 bg-white border border-indigo-100 rounded-xl space-y-2 relative"
                >
                  <span className="text-[9px] font-black text-indigo-600 uppercase">الرسالة التلقائية المقترحة:</span>
                  <p className="text-xs text-slate-600 leading-relaxed font-bold bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {getSimulatedMessage(showMockCommunicationMsg)}
                  </p>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                    <span>* تم تخصيص الرسالة حسب ملفه المحاسبي</span>
                    <button 
                      onClick={() => setShowMockCommunicationMsg(null)}
                      className="text-indigo-600 hover:underline font-bold"
                    >
                      إغلاق المعاينة
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: INVOICES & SERVICES */}
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>سجل المشتريات وعقود الخدمات</span>
              <span className="font-bold text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{clientInvoices.length} معاملة</span>
            </h4>

            {clientInvoices.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-bold bg-slate-50 rounded-xl space-y-2">
                <FileText className="mx-auto text-slate-300" size={32} />
                <p className="text-xs">لا يوجد فواتير مسجلة باسم هذا العميل في قاعدة البيانات حتى الآن.</p>
              </div>
            ) : (
              clientInvoices.map((inv) => (
                <div key={inv.id} className="p-4 border border-slate-100 hover:border-indigo-100 rounded-xl space-y-3 bg-white transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] bg-indigo-50/80 text-indigo-600 px-2.5 py-1 rounded-lg border border-indigo-100 font-black">
                        {inv.type === 'sale' ? 'فاتورة بيع 🧾' : inv.type === 'return' ? 'إرجاع صنف ↩️' : 'طلب حجز 📌'}
                      </span>
                      <p className="text-[10px] text-slate-400 font-bold mt-1.5 flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(inv.date).toLocaleDateString('ar-JO')} {new Date(inv.date).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black text-slate-800 tabular-nums">{inv.total} د.أ</p>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full mt-1 inline-block ${
                        inv.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        inv.paymentStatus === 'unpaid' ? 'bg-rose-50 text-rose-500 border border-rose-100 animate-pulse' :
                        'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        {inv.paymentStatus === 'paid' ? 'مدفوعة كاملة' : inv.paymentStatus === 'unpaid' ? 'غير مدفوعة (دين)' : 'دفعة جزئية'}
                      </span>
                    </div>
                  </div>

                  {/* Items list detail within invoice */}
                  <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest border-b border-slate-200/50 pb-1">تفاصيل المحتوى</p>
                    {inv.items.map((item, id) => {
                      const isService = products.find(p => p.id === item.productId)?.type === 'service';
                      return (
                        <div key={id} className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${isService ? 'bg-sky-500' : 'bg-indigo-500'}`} title={isService ? 'خدمة اتصالات' : 'منتج مادي'}></span>
                            <span className="font-bold text-slate-700 truncate max-w-[150px]">{item.productName}</span>
                            <span className="text-[10px] text-slate-400 tabular-nums">({item.quantity}x)</span>
                          </div>
                          <span className="font-extrabold text-slate-500 tabular-nums">{item.price * item.quantity} د.أ</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}

            {/* Visual Guide explanation */}
            <div className="bg-sky-50 text-sky-800 p-3.5 rounded-xl text-[10px] leading-relaxed font-bold border border-sky-100 flex gap-2">
              <Smartphone size={20} className="flex-shrink-0 animate-pulse" />
              <div>
                تنبيه الألوان: الدوائر السماوية <span className="text-sky-600 font-black">●</span> تمثل خدمات اتصالات (صيانة، تفعيل شرائح أو شحن رصيد) والدوائر الداكنة تمثل مبيعات أجهزة وإكسسوارات.
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: CRM NOTES & TIMELINE */}
        {activeTab === 'notes' && (
          <div className="space-y-6">
            
            {/* Form to insert new CRM interaction note */}
            <form onSubmit={handleAddNote} className="space-y-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200/50">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1">تسجيل تفاعل / صيانة جديد</span>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <textarea 
                    value={newNoteContent}
                    onChange={e => setNewNoteContent(e.target.value)}
                    placeholder="امثلة: تبديل شاشة آيفون بسعر 35 دينار.. أو تفعيل باقة 15GB خط زين.."
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-bold focus:border-indigo-500 hover:border-slate-300 outline-none transition-all placeholder:text-slate-300"
                    rows={2}
                  />
                </div>
                <div>
                  <select 
                    value={newNoteType}
                    onChange={e => setNewNoteType(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[10px] font-black uppercase text-slate-500 outline-none cursor-pointer"
                  >
                    <option value="general">ملاحظة عامة 📂</option>
                    <option value="repair">صيانة وهواتف 🛠️</option>
                    <option value="recharge">باقات خطوط وشحن 📱</option>
                    <option value="debt_followup">ديون وتحصيل ديون ⚠️</option>
                  </select>
                </div>
                <div>
                  <button 
                    type="submit"
                    disabled={!newNoteContent.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] h-full rounded-lg transition-all active:scale-95 disabled:opacity-50"
                  >
                    إضافة تفاعل
                  </button>
                </div>
              </div>
            </form>

            <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">سجل المتابعات المجدول</h4>

            {/* Timeline Notes Feed */}
            {crmNotes.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-bold bg-slate-50 rounded-xl space-y-2">
                <MessageSquare className="mx-auto text-slate-300" size={32} />
                <p className="text-xs">لا يوجد ملاحظات مسجلة لهذا العميل. يرجى استخدام الحقول أعلاه لتسجيل تفاعل.</p>
              </div>
            ) : (
              <div className="space-y-4 relative border-r-2 border-slate-100 mr-2.5 pr-4">
                {crmNotes.map((note) => {
                  
                  const isRepair = note.type === 'repair';
                  const isRecharge = note.type === 'recharge';
                  const isDebt = note.type === 'debt_followup';

                  const badgeText = isRepair ? 'صيانة هواتف' : isRecharge ? 'باقات خطوط' : isDebt ? 'ديون ومستحقات' : 'ملاحظة عامة';
                  const badgeColor = isRepair ? 'bg-amber-50 text-amber-700 border-amber-100' : isRecharge ? 'bg-sky-50 text-sky-700 border-sky-100' : isDebt ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-slate-50 text-slate-700 border-slate-200';

                  return (
                    <div key={note.id} className="relative group/note bg-white hover:bg-slate-50 p-3 rounded-xl border border-slate-100 transition-all">
                      
                      {/* Timeline Dot Indicator */}
                      <span className={`absolute right-[-21px] top-4 w-2.5 h-2.5 rounded-full ring-4 ring-white ${isRepair ? 'bg-amber-500' : isRecharge ? 'bg-sky-500' : isDebt ? 'bg-rose-500' : 'bg-indigo-500'}`}></span>
                      
                      <div className="flex justify-between items-start gap-2">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${badgeColor}`}>
                          {badgeText}
                        </span>
                        
                        {/* Only allow deleting if it's not the legacy static note */}
                        {note.id !== 'legacy-note' && (
                          <button 
                            type="button"
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-slate-300 hover:text-rose-500 transition-colors p-0.5"
                            title="حذف الملاحظة"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-slate-700 font-bold mt-2 leading-relaxed">
                        {note.content}
                      </p>

                      <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold mt-2.5 pt-1.5 border-t border-slate-50">
                        <span>المسؤول: {note.author || 'الموظف المناوب'}</span>
                        <span className="tabular-nums">{new Date(note.date).toLocaleDateString('ar-JO')} {new Date(note.date).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

      </div>

      {/* MODAL: COLLECT DUES AND REDUCE DEBT */}
      {isDeductingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-sm text-right"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h4 className="font-extrabold text-slate-800 text-sm">تسوير وتحصيل ذمم العميل</h4>
              <button onClick={() => setIsDeductingModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleDeductSubmit} className="space-y-4">
              <div className="p-3.5 bg-rose-50 text-rose-700 rounded-xl mb-2 text-xs font-bold leading-relaxed border border-rose-100/50">
                إجمالي الدين المتبقي على العميل حالياً هو {customer.balance} د.أ.
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-wide">المبلغ المدفوع كاش لتخفيض الدين</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">د.أ</span>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0.1"
                    max={customer.balance}
                    value={deductAmount}
                    onChange={e => setDeductAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-left font-black text-lg text-emerald-600"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button 
                  type="submit" 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 rounded-xl transition-all"
                >
                  حفظ الدفعة النقدية
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsDeductingModalOpen(false)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
};


/* Custom modal component for adding/editing basic info on Customer */
const CustomerModal: React.FC<{
  customer: Customer | null;
  onClose: () => void;
  onSave: (customer: Omit<Customer, 'id'>) => void;
}> = ({ customer, onClose, onSave }) => {
  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [address, setAddress] = useState(customer?.address || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [balance, setBalance] = useState(customer?.balance?.toString() || '0');
  const [notes, setNotes] = useState(customer?.notes || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError('الاسم ورقم الهاتف حقول إلزامية.');
      return;
    }
    const numBalance = parseFloat(balance);
    if (isNaN(numBalance)) {
      setError('الرجاء إدخال قيمة صحيحة للرصيد المالي.');
      return;
    }
    onSave({ 
      name, 
      phone, 
      address, 
      email, 
      notes, 
      balance: numBalance 
    });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={customer ? 'تعديل ملف العميل' : 'تسجيل عميل جديد'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6 pt-2 text-right">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">اسم العميل بالكامل</label>
                <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                    placeholder="الاسم الثلاثي أو الثنائي للعميل"
                />
            </div>
            <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">رقم الجوال لتوصيل الإشعارات</label>
                <input 
                    type="tel" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-black text-sm tabular-nums text-left"
                    placeholder="07xxxxxxxx"
                />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">البريد الإلكتروني (اختياري)</label>
                <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                    placeholder="example@mail.com"
                />
            </div>
            <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">العنوان السكني / المحل</label>
                <input 
                    type="text" 
                    value={address} 
                    onChange={e => setAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                    placeholder="مثال: عمان، شارع الجاردنز"
                />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">الرصيد المالي الحالي للذمم (مستحق للمحل)</label>
                <input 
                    type="number" 
                    step="0.01"
                    value={balance} 
                    onChange={e => setBalance(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-black text-slate-700 text-left"
                    placeholder="0.00"
                />
                <span className="text-[9px] text-slate-400 font-bold block mt-1">القيمة 0 تعني مسدد، والقيم الإيجابية تعني مديونية مرصودة على العميل.</span>
            </div>
            <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">ملاحظة عامة أولية</label>
                <input 
                    type="text" 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-600"
                    placeholder="ملاحظات تميز العميل..."
                />
            </div>
        </div>

        {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-500 text-xs font-bold uppercase">
                <AlertTriangle size={16} />
                {error}
            </motion.div>
        )}

        <div className="flex items-center justify-end gap-3 pt-8 mt-6 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors">إلغاء</button>
          <button type="submit" className="px-10 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95">حفظ التعديلات</button>
        </div>
      </form>
    </Modal>
  );
};

export default CustomersView;
