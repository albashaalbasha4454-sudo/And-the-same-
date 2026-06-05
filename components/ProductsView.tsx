import React, { useState, useMemo, useEffect } from 'react';
import type { Product } from '../types';
import Modal from './Modal';
import Pagination from './common/Pagination';
import { 
    Package, Users, AlertTriangle, Search, 
    Plus, Edit3, Trash2, Filter, 
    MoreHorizontal, Download, ArrowUpRight, 
    Layers, BookOpen, Settings2, Settings,
    DollarSign, Check, X, BellOff, BellRing, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductsViewProps {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Omit<Product, 'id'>) => void;
  deleteProduct: (id: string) => void;
  onBatchUpdate: (productIds: string[], discountPercent: number) => void;
  lowStockThreshold: number;
  setLowStockThreshold: (v: number) => void;
}

const ITEMS_PER_PAGE = 10;

const StatCard = ({ title, value, icon: Icon, colorClass, subtext, trend }: { 
    title: string, 
    value: string | number, 
    icon: any, 
    colorClass: string, 
    subtext?: string,
    trend?: { value: string, isUp: boolean }
}) => (
    <motion.div 
        whileHover={{ y: -4 }}
        className="card-professional p-6 flex flex-col justify-between bg-white border border-slate-200/65 shadow-sm rounded-2xl"
    >
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${colorClass.replace('text-', 'bg-').split(' ')[0]}/10 ${colorClass}`}>
                <Icon size={24} strokeWidth={2.5} />
            </div>
            {trend && (
                <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${trend.isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {trend.isUp ? <ArrowUpRight size={12} /> : <ArrowUpRight className="rotate-90" size={12} />}
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

const ProductsView: React.FC<ProductsViewProps> = ({ 
  products, 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  onBatchUpdate, 
  lowStockThreshold,
  setLowStockThreshold
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [discountPercent, setDiscountPercent] = useState('');

  // Inline Price Editing States
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlinePrice, setInlinePrice] = useState('');
  const [inlineCostPrice, setInlineCostPrice] = useState('');
  const [inlineSalePrice, setInlineSalePrice] = useState('');

  const physicalProducts = useMemo(() => products.filter(p => p.type === 'product'), [products]);
  const totalUniqueProducts = useMemo(() => products.length, [products]);
  const totalQuantity = useMemo(() => physicalProducts.reduce((sum, p) => sum + p.quantity + (p.allocated || 0), 0), [physicalProducts]);
  const lowStockCount = useMemo(() => physicalProducts.filter(p => p.quantity > 0 && p.quantity <= lowStockThreshold).length, [physicalProducts, lowStockThreshold]);

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        const matchesSearch = p.name.toLowerCase().includes(lowerSearchTerm) ||
          p.author?.toLowerCase().includes(lowerSearchTerm) ||
          p.category?.toLowerCase().includes(lowerSearchTerm);
        
        if (!matchesSearch) return false;

        if (p.type === 'service') return filter === 'all';

        switch (filter) {
          case 'low':
            return p.quantity > 0 && p.quantity <= lowStockThreshold;
          case 'out':
            return p.quantity === 0;
          default:
            return true;
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, searchTerm, filter, lowStockThreshold]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  const handleOpenModal = (product: Product | null = null) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingProduct(null);
    setIsModalOpen(false);
  };

  const handleSave = (productData: Omit<Product, 'id'>) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, productData);
    } else {
      addProduct(productData);
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      deleteProduct(id);
    }
  };
  
  const handleSelectProduct = (id: string) => {
    setSelectedProducts(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        return newSet;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
        setSelectedProducts(new Set(paginatedProducts.map(p => p.id)));
    } else {
        setSelectedProducts(new Set());
    }
  };

  const handleApplyDiscount = () => {
    const discount = parseFloat(discountPercent);
    if (selectedProducts.size === 0) {
        alert("الرجاء تحديد منتج واحد على الأقل.");
        return;
    }
    if (isNaN(discount) || discount < 0 || discount > 100) {
        alert("الرجاء إدخال نسبة خصم صالحة بين 0 و 100.");
        return;
    }
    onBatchUpdate(Array.from(selectedProducts), discount);
    setDiscountPercent('');
    setSelectedProducts(new Set());
  };

  // Inline pricing actions
  const startInlineEdit = (p: Product) => {
    setInlineEditingId(p.id);
    setInlinePrice(p.price.toString());
    setInlineCostPrice(p.costPrice?.toString() || '');
    setInlineSalePrice(p.salePrice?.toString() || '');
  };

  const saveInlineEdit = (p: Product) => {
    const numPrice = parseFloat(inlinePrice);
    if (isNaN(numPrice) || numPrice < 0) {
      alert("سعر البيع الأساسي يجب أن يكون رقماً موجباً أكبر من الصفر.");
      return;
    }
    const numCost = inlineCostPrice ? parseFloat(inlineCostPrice) : undefined;
    if (numCost !== undefined && (isNaN(numCost) || numCost < 0)) {
      alert("سعر التكلفة يجب أن يكون رقماً موجباً.");
      return;
    }
    const numSale = inlineSalePrice ? parseFloat(inlineSalePrice) : undefined;
    if (numSale !== undefined && (isNaN(numSale) || numSale < 0)) {
      alert("سعر العرض المخفض يجب أن يكون رقماً موجباً.");
      return;
    }

    const { id, ...prodData } = p;
    updateProduct(p.id, {
      ...prodData,
      price: numPrice,
      costPrice: numCost,
      salePrice: numSale
    });
    setInlineEditingId(null);
  };

  return (
    <div className="space-y-8 p-1 sm:p-2">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
                <span className="w-8 h-1 bg-indigo-600 rounded-full"></span>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 opacity-80">Inventory Management</span>
            </div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">إدارة المخزون</h2>
            <p className="text-slate-400 font-medium text-sm">إدارة وإضافة وضبط أسعار وكميات المنتجات والكتب والخدمات في النظام.</p>
          </div>

          <div className="flex items-center gap-3">
             <button onClick={() => handleOpenModal()} className="btn-primary shadow-xl shadow-indigo-600/20 py-3 px-6">
                <Plus size={20} strokeWidth={3} />
                إضافة كتاب جديد
             </button>
          </div>
      </div>

      {/* Low Stock Active Notification Warning Banner */}
      {lowStockCount > 0 && (
          <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-50 border-r-4 border-amber-500 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm"
          >
              <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
                      <AlertTriangle size={22} className="animate-pulse" />
                  </div>
                  <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">تنبيهات المخزون المنخفض ({lowStockCount} كتب)</h4>
                      <p className="text-xs text-slate-500 font-bold mt-0.5 leading-relaxed">
                          هناك أصناف قاربت كمياتها المتاحة حالياً على النفاد، كونها أقل من أو تساوي حد أمان المخزون المختار ({lowStockThreshold} قطعة).
                      </p>
                  </div>
              </div>
              <button 
                  onClick={() => setFilter('low')} 
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition-all active:scale-95 shadow-md flex items-center gap-1.5"
              >
                  <BellRing size={14} />
                  عرض الكتب التي قاربت على النفاد
              </button>
          </motion.div>
      )}

      {/* Stats Bento Grid & Stock Threshold Configuration Control */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard title="إجمالي العناوين والأصناف" value={totalUniqueProducts} icon={BookOpen} colorClass="text-indigo-600" subtext="إجمالي الكتب والخدمات المسجلة" />
          <StatCard title="إجمالي كميات المخزون المتوفرة" value={totalQuantity} icon={Layers} colorClass="text-emerald-600" subtext="عدد الوحدات الفيزيائية المتاحة" />
          <StatCard title="كتب نفذت بالكامل (0)" value={products.filter(p => p.type === 'product' && p.quantity === 0).length} icon={AlertTriangle} colorClass="text-rose-500" />
        </div>
        
        {/* Dynamic stock limit adjustment panel */}
        <div className="card-professional p-6 flex flex-col justify-between bg-white border border-slate-200/65 shadow-sm rounded-2xl">
            <div>
              <div className="flex items-center gap-2 mb-2 text-indigo-600">
                  <Settings2 size={18} strokeWidth={2.5} />
                  <span className="text-xs font-black text-slate-700">حد التنبيه للمخزون المنخفض</span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold mb-4">يتحكم هذا الرقم في متى يتم تنبيهك وعرض العناصر المنخفضة.</p>
            </div>
            
            <div className="flex items-center gap-3">
                <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={lowStockThreshold} 
                    onChange={e => setLowStockThreshold(Math.max(0, parseInt(e.target.value, 10) || 0))} 
                    className="w-20 bg-slate-50 border border-slate-200 py-2 px-3 rounded-xl text-center font-black text-sm text-indigo-600 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                />
                <span className="text-xs text-slate-500 font-bold">قطع أو أقل</span>
            </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="card-professional bg-white overflow-hidden border border-slate-200/65 shadow-sm rounded-2xl">
          {/* Controls Bar */}
          <div className="p-6 lg:p-8 flex flex-col lg:flex-row justify-between items-center gap-6 border-b border-slate-50 overflow-visible bg-slate-50/50">
            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                <div className="relative group flex-1 lg:w-80 min-w-[280px]">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-400 transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="ابحث بالاسم، المؤلف، أو التصنيف..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pr-12 pl-4 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 shadow-sm"
                    />
                </div>
                
                <div className="relative group">
                    <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                    <select 
                        value={filter} 
                        onChange={(e) => setFilter(e.target.value as any)} 
                        className="appearance-none bg-white border border-slate-200 rounded-xl py-2.5 pr-10 pl-8 text-xs font-black uppercase tracking-widest text-slate-500 hover:border-slate-300 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer shadow-sm"
                    >
                        <option value="all">الكل (شامل الخدمات)</option>
                        <option value="low">مخزون منخفض فقط</option>
                        <option value="out">المنتهي من المخزن</option>
                    </select>
                </div>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                {selectedProducts.size > 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 bg-indigo-50 p-1.5 rounded-xl border border-indigo-100"
                    >
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest px-3">{selectedProducts.size} كتاب محدد</span>
                        <div className="flex items-center gap-2">
                             <input 
                                type="number" 
                                value={discountPercent} 
                                onChange={e => setDiscountPercent(e.target.value)} 
                                placeholder="% الخصم" 
                                className="w-20 bg-white border border-indigo-200 rounded-lg py-2 px-3 text-xs font-black text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500/30" 
                            />
                            <button onClick={handleApplyDiscount} className="bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest py-2 px-4 rounded-lg hover:bg-indigo-700 transition-all active:scale-95">تطبيق</button>
                        </div>
                    </motion.div>
                ) : (
                    <div className="flex items-center gap-2 bg-indigo-50/50 text-indigo-700 font-bold px-4 py-2.5 rounded-xl text-xs">
                        <Info size={14} />
                        نصيحة: يمكنك تعديل الأسعار والتكلفة مباشرة من الجدول عبر النقر على زر الدولار الاخضر السريع.
                    </div>
                )}
            </div>
          </div>

          {/* Table Area */}
          <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-right border-collapse">
                  <thead>
                      <tr className="bg-slate-50/50">
                          <th className="p-5 w-14">
                              <input 
                                type="checkbox" 
                                onChange={handleSelectAll} 
                                className="w-5 h-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer" 
                              />
                          </th>
                          <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">الكتاب / المنتج</th>
                          <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">النوع</th>
                          <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">المخزون/الحالة</th>
                          <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left w-48">سعر البيع (مباشر)</th>
                          <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left w-36">التكلفة (مباشر)</th>
                          <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center w-48">إجراءات</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {paginatedProducts.map((p, idx) => {
                          const isLowStock = p.type === 'product' && p.quantity > 0 && p.quantity <= lowStockThreshold;
                          const isOutOfStock = p.type === 'product' && p.quantity === 0;
                          
                          return (
                              <motion.tr 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.02 }}
                                key={p.id} 
                                className={`group hover:bg-slate-50/50 transition-colors ${selectedProducts.has(p.id) ? 'bg-indigo-50/30' : ''}`}
                              >
                                  <td className="p-5">
                                      <input 
                                        type="checkbox" 
                                        checked={selectedProducts.has(p.id)} 
                                        onChange={() => handleSelectProduct(p.id)} 
                                        className="w-5 h-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer" 
                                      />
                                  </td>
                                  <td className="p-5">
                                      <div className="flex items-center gap-4">
                                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm ${isOutOfStock ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                              {p.name.charAt(0)}
                                          </div>
                                          <div>
                                              <p className="font-black text-slate-800 text-base tracking-tight leading-none mb-1">{p.name}</p>
                                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.author || p.category || 'بدون تصنيف'}</p>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="p-5 text-center">
                                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${p.type === 'service' ? 'bg-sky-50 text-sky-600 border border-sky-100' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                                          {p.type === 'service' ? 'خدمة' : 'كتاب'}
                                      </span>
                                  </td>
                                  <td className="p-5 text-center">
                                      {p.type === 'service' ? (
                                          <span className="text-emerald-500 font-black text-xs uppercase">متوفر دائماً</span>
                                      ) : (
                                          <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
                                              <span className={`w-2 h-2 rounded-full ${isOutOfStock ? 'bg-rose-500 animate-pulse' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                                              <span className={`font-black tabular-nums text-sm ${isOutOfStock ? 'text-rose-500' : isLowStock ? 'text-amber-600' : 'text-slate-700'}`}>
                                                  {p.quantity} 
                                              </span>
                                              <span className="text-[10px] text-slate-400 font-bold uppercase">قطعة</span>
                                          </div>
                                      )}
                                  </td>
                                  
                                  {/* Dynamic pricing columns with inline edit capability */}
                                  <td className="p-5 text-left">
                                      {inlineEditingId === p.id ? (
                                          <div className="flex flex-col gap-1 max-w-[140px] text-right ml-auto">
                                              <label className="text-[9px] text-slate-400 font-bold">سعر البيع</label>
                                              <input 
                                                  type="number" 
                                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-black tabular-nums outline-none focus:border-indigo-500" 
                                                  value={inlinePrice} 
                                                  onChange={e => setInlinePrice(e.target.value)} 
                                              />
                                              <label className="text-[9px] text-emerald-500 font-bold mt-1">المخفض (العرض)</label>
                                              <input 
                                                  type="number" 
                                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-black text-emerald-600 tabular-nums outline-none focus:border-indigo-500" 
                                                  value={inlineSalePrice} 
                                                  placeholder="لا يوجد"
                                                  onChange={e => setInlineSalePrice(e.target.value)} 
                                              />
                                          </div>
                                      ) : p.salePrice ? (
                                          <div className="flex flex-col items-end">
                                              <span className="line-through text-slate-400 text-[10px] font-bold tabular-nums mb-0.5">{p.price.toLocaleString()} د.أ</span>
                                              <span className="text-base font-black text-emerald-600 tabular-nums leading-none">{p.salePrice.toLocaleString()} د.أ</span>
                                          </div>
                                      ) : (
                                          <span className="text-base font-black text-slate-800 tabular-nums">{p.price.toLocaleString()} د.أ</span>
                                      )}
                                  </td>
                                  
                                  <td className="p-5 text-left">
                                      {inlineEditingId === p.id ? (
                                          <div className="flex flex-col gap-1 max-w-[120px] text-right ml-auto">
                                              <label className="text-[9px] text-slate-400 font-bold">التكلفة</label>
                                              <input 
                                                  type="number" 
                                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold tabular-nums outline-none focus:border-indigo-500" 
                                                  value={inlineCostPrice} 
                                                  onChange={e => setInlineCostPrice(e.target.value)} 
                                              />
                                          </div>
                                      ) : (
                                          <span className="text-sm font-bold text-slate-400 tabular-nums">{p.costPrice ? `${p.costPrice.toLocaleString()} د.أ` : '-'}</span>
                                      )}
                                  </td>
                                  
                                  <td className="p-5">
                                      {inlineEditingId === p.id ? (
                                          <div className="flex items-center justify-center gap-1.5">
                                              <button 
                                                  onClick={() => saveInlineEdit(p)} 
                                                  className="py-1 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all shadow-sm flex items-center gap-1"
                                                  title="حفظ التعديلات"
                                              >
                                                  <Check size={14} strokeWidth={3} />
                                                  <span>حفظ</span>
                                              </button>
                                              <button 
                                                  onClick={() => setInlineEditingId(null)} 
                                                  className="py-1 px-3.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-all flex items-center gap-1"
                                                  title="إلغاء التعديل السريع"
                                              >
                                                  <X size={14} strokeWidth={3} />
                                                  <span>إلغاء</span>
                                              </button>
                                          </div>
                                      ) : (
                                          <div className="flex items-center justify-center gap-1">
                                              <button 
                                                  onClick={() => startInlineEdit(p)} 
                                                  className="p-2.5 rounded-xl text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all"
                                                  title="تعديل سريع للأسعار"
                                              >
                                                  <DollarSign size={18} />
                                              </button>
                                              <button 
                                                  onClick={() => handleOpenModal(p)} 
                                                  className="p-2.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                                  title="تعديل الكل"
                                              >
                                                  <Edit3 size={18} />
                                              </button>
                                              <button 
                                                  onClick={() => handleDelete(p.id)} 
                                                  className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                                  title="حذف المنتج"
                                              >
                                                  <Trash2 size={18} />
                                              </button>
                                          </div>
                                      )}
                                  </td>
                              </motion.tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>

          {/* Footer / Pagination */}
          <div className="p-6 lg:p-8 flex flex-col sm:flex-row justify-between items-center gap-6 border-t border-slate-100 bg-slate-50/50">
              <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  يعرض {paginatedProducts.length} إلى {filteredProducts.length} من أصل {products.length} سجل متاح
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={ITEMS_PER_PAGE} totalItems={filteredProducts.length} />
          </div>
      </div>

      <AnimatePresence>
          {isModalOpen && <ProductModal product={editingProduct} onClose={handleCloseModal} onSave={handleSave} />}
      </AnimatePresence>
    </div>
  );
};

const ProductModal: React.FC<{
  product: Product | null;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id'>) => void;
}> = ({ product, onClose, onSave }) => {
  const [name, setName] = useState(product?.name || '');
  const [type, setType] = useState<Product['type']>(product?.type || 'product');
  const [author, setAuthor] = useState(product?.author || '');
  const [quantity, setQuantity] = useState(product?.quantity.toString() || '0');
  const [price, setPrice] = useState(product?.price.toString() || '');
  const [salePrice, setSalePrice] = useState(product?.salePrice?.toString() || '');
  const [costPrice, setCostPrice] = useState(product?.costPrice?.toString() || '');
  const [category, setCategory] = useState(product?.category || '');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'اسم المنتج مطلوب.';
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) newErrors.price = 'السعر يجب أن يكون رقماً موجباً.';

    if (type === 'product') {
        const numQuantity = parseInt(quantity, 10);
        if (isNaN(numQuantity) || numQuantity < 0) newErrors.quantity = 'الكمية يجب أن تكون رقماً موجباً.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSave({
      name, author, category, type,
      quantity: type === 'product' ? parseInt(quantity, 10) : 9999,
      price: parseFloat(price),
      salePrice: salePrice ? parseFloat(salePrice) : undefined,
      costPrice: costPrice && type === 'product' ? parseFloat(costPrice) : undefined,
    });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={product ? 'تعديل المنتج بالتفصيل' : 'إضافة عنوان جديد'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">اسم الكتاب أو الخدمة</label>
                <div className="relative">
                    <Package className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)}
                        className={`w-full bg-slate-50 border rounded-xl py-3 pr-12 pl-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 ${errors.name ? 'border-rose-500' : 'border-slate-200'}`}
                        placeholder="أدخل اسم العنوان"
                    />
                </div>
                {errors.name && <p className="text-rose-500 text-[10px] font-bold mt-1 uppercase">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">تصنيف العنصر</label>
                  <div className="relative">
                    <Layers className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                    <select value={type} onChange={e => setType(e.target.value as Product['type'])} className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl py-3 pr-12 pl-6 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-black text-xs uppercase tracking-widest text-slate-500 cursor-pointer">
                        <option value="product">كتاب مادي (مخزون)</option>
                        <option value="service">خدمة (اشتراكات/استشارات)</option>
                    </select>
                  </div>
                </div>
                
                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">التصنيف الموضوعي</label>
                   <div className="relative">
                    <Settings2 className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                        type="text" 
                        value={category} 
                        onChange={e => setCategory(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-12 pl-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                        placeholder="مثلاً: أدب، فلسفة"
                    />
                   </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">سعر البيع الافتراضي</label>
                    <input 
                        type="number" 
                        value={price} 
                        onChange={e => setPrice(e.target.value)}
                        className={`w-full bg-slate-50 border rounded-xl py-3 px-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-black text-xl text-indigo-600 ${errors.price ? 'border-rose-500' : 'border-slate-200'}`}
                        placeholder="0.00"
                    />
                    {errors.price && <p className="text-rose-500 text-[10px] font-bold mt-1 uppercase">{errors.price}</p>}
                </div>
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">سعر العرض (تخفيض)</label>
                    <input 
                        type="number" 
                        value={salePrice} 
                        onChange={e => setSalePrice(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-black text-xl text-emerald-600"
                        placeholder="0.00"
                    />
                </div>
            </div>

            {type === 'product' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">الكمية المتوفرة</label>
                        <input 
                            type="number" 
                            value={quantity} 
                            onChange={e => setQuantity(e.target.value)}
                            className={`w-full bg-slate-50 border rounded-xl py-3 px-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-black text-lg text-slate-700 ${errors.quantity ? 'border-rose-500' : 'border-slate-200'}`}
                            placeholder="0"
                        />
                         {errors.quantity && <p className="text-rose-500 text-[10px] font-bold mt-1 uppercase">{errors.quantity}</p>}
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">سعر التكلفة</label>
                        <input 
                            type="number" 
                            value={costPrice} 
                            onChange={e => setCostPrice(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-black text-lg text-slate-400"
                            placeholder="0.00"
                        />
                    </div>
                </div>
                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">اسم المؤلف</label>
                    <input 
                        type="text" 
                        value={author} 
                        onChange={e => setAuthor(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                        placeholder="أدخل اسم المؤلف إن وجد"
                    />
                </div>
              </motion.div>
            )}
        
        <div className="flex items-center justify-end gap-3 pt-8 mt-6 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors">إلغاء</button>
          <button type="submit" className="px-10 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95">حفظ التغيرات</button>
        </div>
      </form>
    </Modal>
  );
};

export default ProductsView;
