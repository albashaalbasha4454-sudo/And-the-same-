import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Product, InvoiceItem, Customer } from '../types';
import ShippingOrderModal from './ShippingOrderModal';
import ReservationModal from './ReservationModal';
import Modal from './Modal';
import { 
    Search, ShoppingCart, Plus, Minus, Trash2, 
    Truck, BookmarkCheck, CheckCircle, PackageSearch,
    User, Phone, AlertCircle, ShoppingBag, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';


const RequestBookModal: React.FC<{
  productName: string;
  onClose: () => void;
  onConfirm: (customerName: string, customerPhone: string) => void;
}> = ({ productName, onClose, onConfirm }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setError('اسم العميل ورقم هاتفه مطلوبان.');
      return;
    }
    onConfirm(customerName, customerPhone);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`طلب توفير: ${productName}`}>
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <p className="text-slate-500 text-sm leading-relaxed mb-6">سيتم تسجيل طلب توفير لهذا المنتج وسيتم إخطار الإدارة لتأمين النسخة للعميل.</p>
        
        <div className="space-y-4">
            <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">اسم العميل</label>
                <div className="relative">
                    <User className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                        type="text" 
                        value={customerName} 
                        onChange={e => setCustomerName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-12 pl-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                        placeholder="أدخل اسم العميل كاملاً"
                    />
                </div>
            </div>

            <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">رقم الهاتف</label>
                <div className="relative">
                    <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                        type="tel" 
                        value={customerPhone} 
                        onChange={e => setCustomerPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-12 pl-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                        placeholder="05xxxxxxxx"
                    />
                </div>
            </div>
        </div>

        {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-rose-500 text-xs font-bold bg-rose-50 p-3 rounded-lg border border-rose-100">
                <AlertCircle size={14} />
                {error}
            </motion.div>
        )}

        <div className="flex items-center justify-end gap-3 pt-8 mt-6 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors">إلغاء</button>
          <button type="submit" className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95">إرسال الطلب</button>
        </div>
      </form>
    </Modal>
  );
};


interface POSViewProps {
  products: Product[];
  customers: Customer[];
  onCompleteSale: (items: InvoiceItem[]) => void;
  onCreateShippingOrder: (cart: InvoiceItem[], customerInfo: any, shippingFee: number, source: any) => void;
  onCreateReservation: (cart: InvoiceItem[], customerInfo: any) => void;
  onAddRequestedBook: (bookName: string, customerName: string, customerPhone: string) => void;
  lowStockThreshold: number;
}

const POSView: React.FC<POSViewProps> = ({ products, customers, onCompleteSale, onCreateShippingOrder, onCreateReservation, onAddRequestedBook, lowStockThreshold }) => {
  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [productToRequest, setProductToRequest] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const lowerSearchTerm = searchTerm.toLowerCase();
    return products.filter(p => 
        (p.name.toLowerCase().includes(lowerSearchTerm) || p.author?.toLowerCase().includes(lowerSearchTerm)) 
    ).slice(0, 10);
  }, [products, searchTerm]);

  const addToCart = (product: Product) => {
    if (product.type === 'product' && product.quantity <= 0) {
        setProductToRequest(product.name);
        setIsRequestModalOpen(true);
        return;
    }
    const existingItem = cart.find(item => item.productId === product.id);
    if (existingItem) {
      if (product.type === 'service' || existingItem.quantity < product.quantity) {
        setCart(cart.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      } else {
        alert('الكمية المطلوبة غير متوفرة في المخزون.');
      }
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.salePrice ?? product.price,
        costPrice: product.costPrice,
      }]);
    }
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const updateCartItem = (productId: string, newQuantity: number, newDiscount: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (product.type === 'product' && newQuantity > product.quantity) {
        alert('الكمية المطلوبة غير متوفرة في المخزون.');
        newQuantity = product.quantity;
    }
    
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.productId !== productId));
    } else {
      setCart(cart.map(item => item.productId === productId ? { ...item, quantity: newQuantity, discount: newDiscount } : item));
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price - (item.discount || 0)) * item.quantity, 0);

  const expectedProfit = useMemo(() => {
    return cart.reduce((sum, item) => {
      const itemTotalPrice = (item.price - (item.discount || 0)) * item.quantity;
      const itemTotalCost = (item.costPrice || 0) * item.quantity;
      return sum + (itemTotalPrice - itemTotalCost);
    }, 0);
  }, [cart]);

  const profitMarginPercent = useMemo(() => {
    if (cartTotal <= 0) return 0;
    return (expectedProfit / cartTotal) * 100;
  }, [expectedProfit, cartTotal]);

  const handleCompleteSale = () => {
    if (cart.length === 0) return;
    onCompleteSale(cart);
    setCart([]);
  };

  const handleCreateShippingOrder = (customerInfo: any, shippingFee: number, source: any) => {
      onCreateShippingOrder(cart, customerInfo, shippingFee, source);
      setIsShippingModalOpen(false);
      setCart([]);
  }
  
  const handleCreateReservation = (customerInfo: any) => {
      onCreateReservation(cart, customerInfo);
      setIsReservationModalOpen(false);
      setCart([]);
  }

  const handleRequestProductClick = () => {
    if(searchTerm.trim()) {
        setProductToRequest(searchTerm.trim());
        setIsRequestModalOpen(true);
    }
  }

  const handleConfirmRequest = (customerName: string, customerPhone: string) => {
    onAddRequestedBook(productToRequest, customerName, customerPhone);
    setIsRequestModalOpen(false);
    setSearchTerm('');
    searchInputRef.current?.focus();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-100px)]">
      {/* Product Search Area */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        <div className="card-professional p-6 lg:p-8 bg-white overflow-visible relative z-20">
            <div className="flex items-center gap-2 mb-6">
                <span className="w-8 h-1 bg-indigo-600 rounded-full"></span>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 opacity-80">Quick Order</span>
            </div>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight mb-8">نقطة البيع الكبرى</h3>
            
            <div className="relative group">
                <Search className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${searchTerm ? 'text-indigo-600' : 'text-slate-300 group-focus-within:text-indigo-400'}`} size={24} />
                <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="ابحث عن كتاب بالاسم أو المؤلف..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-4 pr-14 pl-6 text-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                />
                
                <AnimatePresence>
                    {searchTerm && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute z-30 w-full left-0 bg-white border border-slate-200 rounded-2xl mt-4 max-h-[480px] overflow-y-auto shadow-[0_20px_50px_rgba(0,0,0,0.1)] scrollbar-hide backdrop-blur-xl bg-white/95"
                        >
                            {filteredProducts.length > 0 ? filteredProducts.map(p => {
                                const isOutOfStock = p.type === 'product' && p.quantity <= 0;
                                const isLowStock = p.type === 'product' && p.quantity > 0 && p.quantity <= lowStockThreshold;
                                
                                return (
                                    <div 
                                        key={p.id} 
                                        onClick={() => !isOutOfStock && addToCart(p)} 
                                        className={`p-5 hover:bg-indigo-50/50 cursor-pointer flex justify-between items-center transition-all border-b border-slate-50 last:border-0 ${isOutOfStock ? 'opacity-60 saturate-50' : ''}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-black text-lg ${isOutOfStock ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                                {p.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800 text-lg tracking-tight mb-1">{p.name}</p>
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{p.author || p.category || 'بدون تصنيف'}</p>
                                                <div className="flex gap-2 mt-2">
                                                    {isOutOfStock && <span className="bg-rose-50 text-rose-600 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Sold Out</span>}
                                                    {isLowStock && <span className="bg-amber-50 text-amber-600 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Low Stock</span>}
                                                    {p.type === 'service' && <span className="bg-sky-50 text-sky-600 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Service</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <div className="flex items-center gap-2 mb-1">
                                                {p.salePrice && <span className="line-through text-slate-400 text-xs font-bold">{p.price.toLocaleString()}</span>}
                                                <p className="text-xl font-black text-indigo-600 tracking-tighter">{(p.salePrice ?? p.price).toLocaleString()}</p>
                                            </div>
                                            {p.type === 'product' && (
                                                <p className={`text-[10px] font-black uppercase tracking-widest ${isOutOfStock ? 'text-rose-500' : 'text-slate-400'}`}>
                                                    Stock: {p.quantity}
                                                </p>
                                            )}
                                            {isOutOfStock && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setProductToRequest(p.name); setIsRequestModalOpen(true); }}
                                                    className="mt-3 text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                >
                                                    طلب توفير
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="p-10 text-center">
                                    <div className="inline-flex p-4 bg-slate-50 rounded-full text-slate-300 mb-4">
                                        <PackageSearch size={40} />
                                    </div>
                                    <p className="text-slate-400 font-black text-xs uppercase tracking-[0.2em]">لا توجد نتائج مطابقة</p>
                                    <button onClick={handleRequestProductClick} className="mt-4 text-indigo-600 hover:underline font-black text-xs uppercase tracking-widest">هل تريد طلب هذا الكتاب؟</button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>

        <div className="flex-1 card-professional bg-slate-50/50 border-dashed border-2 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-sm flex items-center justify-center text-slate-200 mb-6">
                <ShoppingBag size={48} strokeWidth={1.5} />
            </div>
            <h4 className="text-xl font-black text-slate-400 tracking-tight">ابدأ البيع الآن</h4>
            <p className="text-slate-300 text-sm font-medium mt-2 max-w-xs">استخدم مربع البحث في الأعلى لإضافة الكتب أو الخدمات للفاتورة الحالية.</p>
        </div>
      </div>

      {/* Cart Area */}
      <div className="lg:col-span-5 flex flex-col h-full gap-6">
        <div className="card-professional flex-1 flex flex-col bg-white overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                        <ShoppingCart size={22} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-800 tracking-tight">سلة المشتريات</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{cart.length} أصناف مضافة</p>
                    </div>
                </div>
                {cart.length > 0 && (
                    <button 
                        onClick={() => { if(window.confirm('هل أنت متأكد من إفراغ السلة؟')) setCart([]); }} 
                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    >
                        <Trash2 size={20} />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                <AnimatePresence mode="popLayout">
                    {cart.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="h-full flex flex-col items-center justify-center text-center p-8"
                        >
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                                <ShoppingBag size={32} />
                            </div>
                            <p className="text-slate-400 font-bold tracking-tight">السلة فارغة حالياً</p>
                        </motion.div>
                    ) : (
                        cart.map(item => (
                            <motion.div 
                                layout
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                key={item.productId} 
                                className="group p-5 bg-slate-50/50 border border-slate-200/60 rounded-2xl relative overflow-hidden"
                            >
                                <div className="absolute left-0 top-0 w-1 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex justify-between items-start mb-4">
                                    <p className="font-black text-slate-800 text-base tracking-tight leading-tight max-w-[70%]">{item.productName}</p>
                                    <span className="text-lg font-black text-slate-800 tabular-nums">{((item.price - (item.discount || 0)) * item.quantity).toLocaleString()}</span>
                                </div>
                                
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                                        <button 
                                            onClick={() => updateCartItem(item.productId, item.quantity - 1, item.discount || 0)}
                                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                        >
                                            <Minus size={16} strokeWidth={3} />
                                        </button>
                                        <span className="w-12 text-center font-black text-lg text-slate-800 tabular-nums">{item.quantity}</span>
                                        <button 
                                            onClick={() => updateCartItem(item.productId, item.quantity + 1, item.discount || 0)}
                                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                        >
                                            <Plus size={16} strokeWidth={3} />
                                        </button>
                                    </div>

                                    <div className="relative flex-1 max-w-[140px]">
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest pointer-events-none">
                                            خصم
                                        </div>
                                        <input 
                                            type="number" 
                                            placeholder="0" 
                                            value={item.discount || ''} 
                                            onChange={e => updateCartItem(item.productId, item.quantity, parseFloat(e.target.value) || 0)} 
                                            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pr-14 pl-3 text-left font-black text-sm text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            <div className="p-10 bg-slate-900 border-t border-slate-800">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-8">
                    <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">إجمالي الفاتورة</p>
                        <h4 className="text-white text-5xl font-black tracking-tighter tabular-nums leading-none">{cartTotal.toLocaleString()} <span className="text-sm text-slate-400 font-bold">د.أ</span></h4>
                    </div>
                    {cart.length > 0 && (
                        <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl p-4 text-right w-full sm:w-auto min-w-[220px]">
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2 flex items-center justify-end gap-1">
                                <TrendingUp size={12} className="text-emerald-400" />
                                هامش الربح المتوقع
                            </p>
                            <div className="flex items-center justify-end gap-3">
                                <div className="text-left">
                                    <p className={`text-lg font-black leading-none ${
                                        profitMarginPercent > 30 ? 'text-emerald-400' :
                                        profitMarginPercent > 15 ? 'text-indigo-300' :
                                        profitMarginPercent > 0 ? 'text-amber-400' : 'text-rose-400'
                                    }`}>
                                        {expectedProfit.toLocaleString()} د.أ
                                    </p>
                                    <p className="text-[9px] text-slate-500 font-bold mt-1">صافي الربح</p>
                                </div>
                                <div className="w-px h-8 bg-slate-700"></div>
                                <div className="text-left">
                                    <p className={`text-lg font-black leading-none ${
                                        profitMarginPercent > 30 ? 'text-emerald-400' :
                                        profitMarginPercent > 15 ? 'text-indigo-300' :
                                        profitMarginPercent > 0 ? 'text-amber-400' : 'text-rose-400'
                                    }`}>
                                        {profitMarginPercent.toFixed(1)}%
                                    </p>
                                    <p className="text-[9px] text-slate-500 font-bold mt-1">هامش الربح</p>
                                </div>
                            </div>
                            
                            {profitMarginPercent <= 10 && (
                                <div className="mt-2 text-[9px] font-black text-rose-400 flex items-center justify-end gap-1 animate-pulse">
                                    <AlertCircle size={10} />
                                    <span>تنبيه: الهامش منخفض جداً!</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                <div className="space-y-4">
                    <button 
                        onClick={handleCompleteSale} 
                        disabled={cart.length === 0} 
                        className="w-full bg-emerald-500 text-white font-black py-5 px-6 rounded-2xl hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 disabled:bg-slate-800 disabled:text-slate-600 disabled:shadow-none disabled:cursor-not-allowed transition-all text-xl flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                        <CheckCircle size={24} />
                        إتمام البيع الكلي
                    </button>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => setIsReservationModalOpen(true)} 
                            disabled={cart.length === 0} 
                            className="bg-slate-800 text-slate-300 font-black py-4 px-4 rounded-2xl hover:bg-indigo-600 hover:text-white disabled:bg-slate-800/50 disabled:text-slate-700 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest active:scale-[0.98]"
                        >
                            <BookmarkCheck size={18} />
                            حجز محلي
                        </button>
                        <button 
                            onClick={() => setIsShippingModalOpen(true)} 
                            disabled={cart.length === 0} 
                            className="bg-slate-800 text-slate-300 font-black py-4 px-4 rounded-2xl hover:bg-sky-600 hover:text-white disabled:bg-slate-800/50 disabled:text-slate-700 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest active:scale-[0.98]"
                        >
                            <Truck size={18} />
                            شحن الطلب
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <AnimatePresence>
          {isShippingModalOpen && (
              <ShippingOrderModal 
                cart={cart} 
                customers={customers} 
                onClose={() => setIsShippingModalOpen(false)} 
                onConfirm={handleCreateShippingOrder} 
              />
          )}
          {isReservationModalOpen && (
              <ReservationModal 
                cart={cart} 
                customers={customers} 
                onClose={() => setIsReservationModalOpen(false)} 
                onConfirm={handleCreateReservation} 
              />
          )}
          {isRequestModalOpen && (
              <RequestBookModal 
                productName={productToRequest} 
                onClose={() => setIsRequestModalOpen(false)} 
                onConfirm={handleConfirmRequest} 
              />
          )}
      </AnimatePresence>
    </div>
  );
};

export default POSView;
