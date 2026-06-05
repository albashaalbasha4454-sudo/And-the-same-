

import React, { useEffect, useState, useMemo } from 'react';
import type { Invoice } from './types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  Printer, FileDown, X, Percent, Check, 
  Phone, ShieldAlert, 
  MapPin, Calendar, Clock, Hash, Receipt, QrCode, Sparkles
} from 'lucide-react';

interface PrintInvoiceProps {
  invoice: Invoice;
  onClose: () => void;
  shopName: string;
  shopAddress: string;
  autoExportPDF?: boolean;
}

const PrintInvoice: React.FC<PrintInvoiceProps> = ({ invoice, onClose, shopName, shopAddress, autoExportPDF }) => {
    const [isExporting, setIsExporting] = useState(false);
    
    // Customization states
    const [taxRate, setTaxRate] = useState<number>(16); // Default 16% Jordanian tax
    const [taxType, setTaxType] = useState<'inclusive' | 'exclusive' | 'exempt'>('inclusive');
    const [taxNumber, setTaxNumber] = useState<string>('300456789'); // Merchant standard Tax Registration number
    const [buyerTaxNumber, setBuyerTaxNumber] = useState<string>('');
    const [showLogo, setShowLogo] = useState<boolean>(true);
    const [showSocials, setShowSocials] = useState<boolean>(true);
    const [showWatermark, setShowWatermark] = useState<boolean>(true);
    const [showQRCode, setShowQRCode] = useState<boolean>(true);
    const [notes, setNotes] = useState<string>('شكراً لكم على ثقتكم الغالية واختيار عائلتكم في سوق الكتاب المتميز. نسعى دوماً لتقديم الثقافة الأرقى بأفضل التنسيقات والأسعار!');

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        
        if (autoExportPDF) {
            handleExportPDF();
        }

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [onClose, autoExportPDF]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('print-area');
    if (!element) return;

    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794 // A4 width at 96 DPI
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`فاتورة_ضريبية_${invoice.id.substring(0, 8).toUpperCase()}.pdf`);
      
      if (autoExportPDF) {
        onClose();
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('حدث خطأ أثناء تصدير ملف PDF المنسق');
    } finally {
      setIsExporting(false);
    }
  };

  const subtotal = useMemo(() => {
    return invoice.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [invoice.items]);

  const totalDiscount = useMemo(() => {
    return invoice.items.reduce((sum, item) => sum + ((item.discount || 0) * item.quantity), 0);
  }, [invoice.items]);

  const itemsNetTotal = subtotal - totalDiscount;

  // Tax calculation details
  const taxCalculations = useMemo(() => {
    const rate = taxType === 'exempt' ? 0 : taxRate;
    const shipping = invoice.shippingFee || 0;
    
    let baseAmount = 0;
    let taxAmount = 0;
    let finalTotal = invoice.total;

    if (taxType === 'inclusive') {
      baseAmount = itemsNetTotal / (1 + rate / 100);
      taxAmount = itemsNetTotal - baseAmount;
      finalTotal = itemsNetTotal + shipping;
    } else if (taxType === 'exclusive') {
      baseAmount = itemsNetTotal;
      taxAmount = itemsNetTotal * (rate / 100);
      finalTotal = itemsNetTotal + taxAmount + shipping;
    } else { // exempt
      baseAmount = itemsNetTotal;
      taxAmount = 0;
      finalTotal = itemsNetTotal + shipping;
    }

    return {
      baseAmount,
      taxAmount,
      finalTotal,
      rate
    };
  }, [itemsNetTotal, taxRate, taxType, invoice.shippingFee, invoice.total]);

  // QR Code details for Electronic Compliance
  const qrCodeUrl = useMemo(() => {
    const qrData = encodeURIComponent([
      `محل: ${shopName}`,
      `رقم ضريبي: ${taxNumber}`,
      `رقم الفاتورة: #${invoice.id.substring(0, 8).toUpperCase()}`,
      `التاريخ: ${new Date(invoice.date).toLocaleDateString('ar-JO')}`,
      `الصافي شامل للضريبة: ${taxCalculations.finalTotal.toFixed(2)} د.أ`,
      `ضريبة المبيعات (${taxCalculations.rate}%): ${taxCalculations.taxAmount.toFixed(2)} د.أ`
    ].join(' | '));
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${qrData}&bgcolor=ffffff&color=1e293b`;
  }, [invoice.id, invoice.date, taxNumber, taxCalculations, shopName]);

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-50 flex flex-col xl:flex-row overflow-y-auto print:p-0 print:bg-white" dir="rtl">
      
      {/* Sidebar Settings Panel - Hidden when printed */}
      <div className="w-full xl:w-96 bg-slate-900 border-l border-slate-800 p-6 flex flex-col gap-6 text-right shrink-0 print:hidden shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-850 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Receipt size={18} />
            </div>
            <h3 className="text-white font-bold text-lg">تخصيص قالب الطباعة</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-all"
            title="إغلاق التخصيص"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form elements for tax and logo */}
        <div className="space-y-5 text-sm overflow-y-auto max-h-[calc(100vh-160px)] pr-1">
          
          {/* Logo toggle */}
          <div className="bg-slate-850/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <span className="text-xs font-black text-indigo-400 uppercase tracking-widest block mb-1">تجهيز الترويسة والشعار</span>
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-slate-300 font-bold group-hover:text-white transition-colors">إظهار شعار المحل التلقائي</span>
              <input 
                type="checkbox" 
                checked={showLogo} 
                onChange={(e) => setShowLogo(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-700 accent-indigo-500 border-slate-600 focus:ring-indigo-500"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer group mt-2">
              <span className="text-slate-300 font-bold group-hover:text-white transition-colors">إظهار العلامة المائية للبرنامج</span>
              <input 
                type="checkbox" 
                checked={showWatermark} 
                onChange={(e) => setShowWatermark(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-700 accent-indigo-500 border-slate-600 focus:ring-indigo-500"
              />
            </label>
          </div>

          {/* Tax Configurations */}
          <div className="bg-slate-850/60 p-4 rounded-xl border border-slate-800 space-y-4">
            <span className="text-xs font-black text-indigo-400 uppercase tracking-widest block">خيارات الضريبة ونظام الفوتورة</span>
            
            <div className="space-y-1.5">
              <label className="text-slate-400 font-bold block text-xs">نظام حساب الضريبة</label>
              <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setTaxType('inclusive')}
                  className={`py-1.5 text-xs font-bold rounded-md transition-all ${taxType === 'inclusive' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  ضريبة شاملة
                </button>
                <button
                  type="button"
                  onClick={() => setTaxType('exclusive')}
                  className={`py-1.5 text-xs font-bold rounded-md transition-all ${taxType === 'exclusive' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  ضريبة مضافة
                </button>
                <button
                  type="button"
                  onClick={() => setTaxType('exempt')}
                  className={`py-1.5 text-xs font-bold rounded-md transition-all ${taxType === 'exempt' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  معفى ضريبياً
                </button>
              </div>
            </div>

            {taxType !== 'exempt' && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="text-slate-400 font-bold">نسبة ضريبة المبيعات</label>
                  <span className="font-mono text-indigo-400 font-black">{taxRate}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="30" 
                  step="1"
                  value={taxRate} 
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-slate-400 font-bold block text-xs">الرقم الضريبي الوطني للمحل</label>
              <input 
                type="text" 
                value={taxNumber} 
                onChange={(e) => setTaxNumber(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs font-mono tracking-wider focus:outline-none focus:border-indigo-500 text-left"
                placeholder="مثال: 300456789"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-bold block text-xs">الرقم الضريبي للعميل (اختياري)</label>
              <input 
                type="text" 
                value={buyerTaxNumber} 
                onChange={(e) => setBuyerTaxNumber(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs font-mono tracking-wider focus:outline-none focus:border-indigo-500 text-left"
                placeholder="أدخل الرقم الضريبي للمشتري"
              />
            </div>
          </div>

          {/* Social and layout features */}
          <div className="bg-slate-850/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <span className="text-xs font-black text-indigo-400 uppercase tracking-widest block">العناصر الإضافية</span>
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-slate-300 font-bold group-hover:text-white transition-colors">إظهار رمز الاستجابة السريع QR</span>
              <input 
                type="checkbox" 
                checked={showQRCode} 
                onChange={(e) => setShowQRCode(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-700 accent-indigo-500 border-slate-600 focus:ring-indigo-500"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer group mt-1">
              <span className="text-slate-300 font-bold group-hover:text-white transition-colors">إظهار حسابات التواصل الاجتماعي</span>
              <input 
                type="checkbox" 
                checked={showSocials} 
                onChange={(e) => setShowSocials(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-700 accent-indigo-500 border-slate-600 focus:ring-indigo-500"
              />
            </label>
          </div>

          {/* Notes adjustment */}
          <div className="bg-slate-850/60 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <label className="text-xs font-black text-indigo-400 uppercase tracking-widest block">ملاحظات أسفل الفاتورة</label>
            <textarea
              rows={3}
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs leading-relaxed focus:outline-none focus:border-indigo-500"
              placeholder="اكتب رسالة شكر للعملاء..."
            />
          </div>

        </div>

        {/* Action controls */}
        <div className="mt-auto pt-4 border-t border-slate-850 flex flex-col gap-2">
          <button
            onClick={handlePrint}
            className="w-full py-3 px-4 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-500 transition-all active:scale-95 shadow-md"
          >
            <Printer size={16} />
            <span>بدء عملية الطباعة الفورية</span>
          </button>
          
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className={`w-full py-3 px-4 bg-slate-800 text-slate-200 hover:text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-750 transition-all active:scale-95 ${
              isExporting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <FileDown size={16} className={isExporting ? 'animate-bounce' : ''} />
            <span>{isExporting ? 'جاري تصدير PDF...' : 'تصدير كملف PDF'}</span>
          </button>
        </div>
      </div>

      {/* Sheet Preview Panel - Right side */}
      <div className="flex-1 bg-slate-100 p-4 sm:p-8 xl:p-12 overflow-y-auto print:p-0 print:bg-white relative">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8 sm:p-12 relative border border-slate-200 print:shadow-none print:border-none print:p-0">
          
          {/* Printable Area Target */}
          <div id="print-area" className="text-right font-sans leading-normal relative select-none print:select-text" dir="rtl">
            
            {/* Elegant Background Watermark for Premium feel */}
            {showWatermark && (
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none z-0 print:opacity-[0.02]">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[80%] h-[80%] max-w-[400px]">
                  <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.8370 4.26339 3.2011 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}

            <div className="relative z-10">
              {/* HEADER SECTION: Centered style for tax compliance */}
              <div className="flex flex-col items-center border-b-2 border-slate-900 pb-6 mb-8 text-center">
                {showLogo && (
                  <div className="w-24 h-24 bg-white rounded-2xl border border-slate-200 shadow-sm p-1.5 flex items-center justify-center overflow-hidden mb-3">
                    <img 
                      src="https://i.postimg.cc/m2f99M9X/soqalketab-logo.png" 
                      alt={shopName} 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        // SVG fallback inline if image fail
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                          svg.setAttribute("viewBox", "0 0 24 24");
                          svg.setAttribute("class", "w-16 h-16 text-slate-800");
                          svg.setAttribute("fill", "none");
                          svg.innerHTML = `
                            <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            <path d="M6.5 2H20V22H6.5V2Z" fill="currentColor" opacity="0.1"/>
                            <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.8370 4.26339 3.2011 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                          `;
                          parent.appendChild(svg);
                        }
                      }}
                    />
                  </div>
                )}
                
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{shopName}</h1>
                <p className="text-slate-500 font-extrabold tracking-widest text-[11px] uppercase mt-0.5">SOQQ ALKETAB</p>
                
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 mt-3 text-xs text-slate-600 font-bold bg-slate-50 border border-slate-150 py-1.5 px-4 rounded-full max-w-lg">
                  <span className="flex items-center gap-1"><MapPin size={12} className="text-slate-400" /> {shopAddress}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span className="flex items-center gap-1">الرقم الضريبي للمحل: <strong className="font-mono">{taxNumber}</strong></span>
                </div>
              </div>

              {/* INVOICE TITLE & METADATA SECTION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 justify-start md:justify-start">
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2 py-0.5 rounded-full">فاتورة ضريبية مبسطة</span>
                  </div>
                  <h2 className="text-xl font-black text-slate-850">فاتورة مبيعات</h2>
                  <p className="text-slate-400 text-xs mt-1">تمت المعاملة إلكترونياً وتخضع للأنظمة الضريبية</p>
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-right md:text-left text-xs border-r md:border-r-0 md:border-l border-slate-200 pr-4 md:pr-0 md:pl-4">
                  <div className="text-slate-500 font-bold">الرقم المرجعي:</div>
                  <div className="font-mono font-black text-slate-900">#{invoice.id.substring(0,8).toUpperCase()}</div>
                  
                  <div className="text-slate-500 font-bold">تاريخ الإصدار:</div>
                  <div className="font-bold text-slate-900">{new Date(invoice.date).toLocaleDateString('ar-JO')}</div>
                  
                  <div className="text-slate-500 font-bold">توقيت المعاملة:</div>
                  <div className="font-bold text-slate-900">{new Date(invoice.date).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>

              {/* BUYER / CLIENT DETAILS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-b border-dashed border-slate-200 pb-6">
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2 pb-1 border-b border-slate-100">تفاصيل العميل والوجهة</h3>
                  {invoice.customerInfo ? (
                    <div className="space-y-1 text-xs">
                      <p className="font-black text-sm text-slate-900">{invoice.customerInfo.name}</p>
                      {invoice.customerInfo.phone && <p className="text-slate-600 font-bold">هاتف: <span className="font-mono font-normal">{invoice.customerInfo.phone}</span></p>}
                      {invoice.customerInfo.address && <p className="text-slate-600">العنوان: {invoice.customerInfo.address}</p>}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-slate-600 text-xs font-bold mt-1">
                      <p className="text-slate-600">نوع العميل: بيع مباشر نقدي (زبون خارجي)</p>
                    </div>
                  )}
                </div>

                {buyerTaxNumber && (
                  <div className="text-right md:text-left flex flex-col justify-end md:items-start">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2 pb-1 border-b border-slate-100 w-full text-right md:text-left">الرقم الضريبي للمشتري</h3>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 inline-block text-right">
                      <p className="text-xs font-bold text-slate-700">رقم التسجيل الضريبي للعميل:</p>
                      <p className="font-mono text-xs font-black text-slate-900 mt-1 select-all">{buyerTaxNumber}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* ITEMS TABLE */}
              <div className="mb-8 select-none">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950 text-white font-black uppercase text-[10px] tracking-wider">
                      <th className="p-3 text-center rounded-tr-lg w-10">#</th>
                      <th className="p-3">اسم الكتاب / الصنف</th>
                      <th className="p-3 text-center w-20">الكمية</th>
                      <th className="p-3 text-left w-24">سعر الوحدة</th>
                      <th className="p-3 text-left w-24">الخصم</th>
                      <th className="p-3 text-left rounded-tl-lg w-28">الإجمالي بعد الخصم</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => {
                      const itemSub = item.price * item.quantity;
                      const itemDisc = (item.discount || 0) * item.quantity;
                      const itemNet = itemSub - itemDisc;
                      return (
                        <tr key={item.productId} className={`border-b border-slate-100 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'} page-break-inside-avoid hover:bg-slate-50 transition-colors`}>
                          <td className="p-3 text-slate-400 font-mono text-center text-xs">{index + 1}</td>
                          <td className="p-3 font-bold text-slate-900">
                            <span className="block">{item.productName}</span>
                            <span className="text-[10px] text-slate-400 font-normal">رمز الصنف: {item.productId.substring(0, 6).toUpperCase()}</span>
                          </td>
                          <td className="p-3 text-center font-black text-slate-700 font-mono text-sm">{item.quantity}</td>
                          <td className="p-3 text-left text-slate-700 font-mono">{item.price.toFixed(2)}</td>
                          <td className="p-3 text-left font-mono font-bold text-rose-600">
                            {itemDisc > 0 ? (
                              <span>-{itemDisc.toFixed(2)}</span>
                            ) : (
                              <span className="text-slate-350">-</span>
                            )}
                          </td>
                          <td className="p-3 text-left font-bold text-slate-900 font-mono text-sm bg-slate-50/20">{itemNet.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* DISCOUNTS HIGHLIGHT BANNER - Visible only if total discount > 0 */}
              {totalDiscount > 0 && (
                <div className="mb-8 border-2 border-dashed border-emerald-500/30 bg-emerald-50/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-emerald-900 leading-normal page-break-inside-avoid">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                      <Sparkles size={16} />
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-sm text-emerald-950">لقد تم تطبيق خصم خاص للفاتورة!</p>
                      <p className="text-xs text-emerald-700 mt-0.5">القيمة المالية الإجمالية التي قمنا باقتطاعها تسهيلاً لكم اليوم</p>
                    </div>
                  </div>
                  <div className="bg-emerald-500 text-white font-black px-4 py-2 rounded-xl text-md tracking-tight flex items-center gap-1 text-center scale-102">
                    <span className="text-xs font-bold">توفير:</span>
                    <span className="font-mono">{totalDiscount.toFixed(2)} د.أ</span>
                  </div>
                </div>
              )}

              {/* TOTALS & TAX CALCULATIONS / DETAILS BLOCK */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start mb-8 page-break-inside-avoid">
                
                {/* Notes & Bank details & QR */}
                <div className="md:col-span-7 space-y-4">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2.5 pb-1 border-b border-slate-200">ملاحظات الفاتورة والتسوية</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                      {notes}
                    </p>
                  </div>

                  {/* External Contact details for Professional Invoice */}
                  {showSocials && (
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-slate-500">
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-lg p-2 justify-center">
                        <Phone size={10} className="text-emerald-500" />
                        <span className="font-mono">0940392619</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-lg p-2 justify-center">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5 text-blue-600">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                        </svg>
                        <span>SooqAlketab</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-lg p-2 justify-center">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5 text-pink-600">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                        </svg>
                        <span>Sooq_alketab</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Subtotals column */}
                <div className="md:col-span-5 bg-slate-50 border border-slate-200 p-5 rounded-2xl font-bold space-y-2.5">
                  
                  {/* Item Net / Raw Subtotal before discount */}
                  <div className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-100">
                    <span className="text-slate-500 font-bold">المجموع الإجمالي للمخزون:</span>
                    <span className="font-mono text-slate-900 font-extrabold">{subtotal.toFixed(2)} د.أ</span>
                  </div>

                  {/* General Discount in subtotal panel */}
                  <div className="flex justify-between items-center text-xs text-rose-600">
                    <span>خصم الكتب الممنوح (-):</span>
                    <span className="font-mono font-black">-{totalDiscount.toFixed(2)} د.أ</span>
                  </div>

                  {/* Shipping option */}
                  {(invoice.shippingFee || 0) > 0 && (
                    <div className="flex justify-between items-center text-xs pb-1.5 text-slate-700">
                      <span className="font-semibold text-slate-500">أجور الشحن/التوصيل (+):</span>
                      <span className="font-mono font-bold">{(invoice.shippingFee || 0).toFixed(2)} د.أ</span>
                    </div>
                  )}

                  {/* TAX CALCULATIONS EXPANDED (Jordanian 16%) */}
                  {taxType !== 'exempt' && (
                    <div className="bg-slate-100/80 rounded-xl p-3 space-y-1.5 border border-slate-200 text-[11px] leading-relaxed select-text">
                      <div className="flex justify-between text-slate-500">
                        <span>الوعاء الخاضع للضريبة ({taxType === 'inclusive' ? 'شامل' : 'مستثنى'}):</span>
                        <span className="font-mono font-bold">{taxCalculations.baseAmount.toFixed(2)} د.أ</span>
                      </div>
                      <div className="flex justify-between text-slate-600 font-black">
                        <span>ضريبة المبيعات العامة ({taxCalculations.rate}%):</span>
                        <span className="font-mono text-slate-900">{taxCalculations.taxAmount.toFixed(2)} د.أ</span>
                      </div>
                    </div>
                  )}

                  {/* GRAND FINAL TOTAL */}
                  <div className="flex justify-between items-center text-sm p-3.5 bg-slate-900 text-white rounded-xl shadow-inner mt-2.5">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold block leading-none uppercase mb-1">الصافي الإجمالي النهائي</span>
                      <span className="font-black text-indigo-300">
                        {taxType === 'inclusive' ? 'شامل للضريبة' : taxType === 'exclusive' ? 'مضافاً إليه الضريبة' : 'معفى ذو قيمة صافية'}
                      </span>
                    </div>
                    <span className="text-xl font-black font-mono">
                      {taxCalculations.finalTotal.toFixed(2)} <span className="text-xs font-black">د.أ</span>
                    </span>
                  </div>
                </div>

              </div>

              {/* COMPLIANCE QR CODE & SIGNATURES */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center border-t border-slate-200 pt-6 mt-6 page-break-inside-avoid">
                {/* QR compliance representing standard electronic billing in Jordan */}
                <div className="md:col-span-4 flex items-center justify-center md:justify-start gap-4">
                  {showQRCode && (
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-20 bg-white border border-slate-350 p-1 rounded-lg">
                        <img 
                          src={qrCodeUrl} 
                          alt="QR Code" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="text-right text-[10px] text-slate-400 leading-normal max-w-[130px]">
                        <p className="font-bold text-slate-500">رابط الفاتورة الإلكترونية</p>
                        <p className="mt-0.5">امسح الكود ضوئياً للتحقق من سلامة وصلاحية الفاتورة المرجعية.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="md:col-span-4 text-center">
                  <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase">توقيع المستلم والتدقيق</p>
                  <div className="h-6 mt-1 border-b border-dashed border-slate-200"></div>
                </div>

                <div className="md:col-span-4 text-center md:text-left">
                  <p className="text-slate-400 text-[10px]">نظام إدارة سوق الكتاب الذكي والمحاسبة الضريبية</p>
                </div>
              </div>

            </div>
          </div>
          
        </div>
      </div>

      <style>{`
        @media print {
          body { 
            background: white !important; 
            color: black !important;
          }
          .print\\:hidden { 
            display: none !important; 
          }
          .page-break-inside-avoid { 
            page-break-inside: avoid; 
          }
          @page { 
            size: A4;
            margin: 1.5cm; 
          }
          tr {
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintInvoice;