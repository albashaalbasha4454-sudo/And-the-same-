
import React from 'react';
import type { User } from '../types';
import { Logo } from './Logo';
import { motion } from 'motion/react';
import { Menu, LogOut, ReceiptText, User as UserIcon, Search } from 'lucide-react';

interface HeaderProps {
    currentUser: User;
    onLogout: () => void;
    toggleSidebar: () => void;
    onOpenCloseTillModal: () => void;
    onOpenSearch: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, toggleSidebar, onOpenCloseTillModal, onOpenSearch }) => {
    return (
        <motion.header 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-panel h-20 flex items-center justify-between px-8 z-40 sticky top-0 flex-shrink-0 border-b border-slate-200/50"
        >
            <div className="flex items-center gap-6">
                <button 
                    onClick={toggleSidebar} 
                    className="md:hidden p-2.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-600"
                >
                    <Menu size={24} />
                </button>
                <div className="flex items-center gap-3">
                    <Logo className="h-12 w-12" />
                    <div>
                        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight hidden sm:block">سوق الكتاب</h1>
                        <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-[0.2em] hidden sm:block opacity-70">Inventory & POS v2.0</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button 
                    onClick={onOpenSearch}
                    className="flex items-center gap-2 bg-slate-50 border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 text-slate-600 hover:text-indigo-600 px-4 py-2 rounded-xl transition-all font-bold text-xs"
                    title="البحث التفصيلي الشامل (Ctrl+K)"
                >
                    <Search size={16} className="text-slate-400 group-hover:text-indigo-600" />
                    <span className="hidden md:inline">البحث الشامل والتفصيلي</span>
                </button>

                {currentUser.role === 'cashier' && (
                    <button 
                        onClick={onOpenCloseTillModal} 
                        className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-50 transition-all font-medium"
                        title="تقرير إغلاق الصندوق اليومي"
                    >
                        <ReceiptText size={20} />
                        <span className="hidden sm:inline">إغلاق الصندوق</span>
                    </button>
                )}

                <div className="h-10 w-px bg-slate-200 mx-2 hidden sm:block"></div>

                <div className="flex items-center gap-4 pl-2">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-slate-800 leading-none mb-1">{currentUser.username}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{currentUser.role === 'admin' ? 'مدير النظام' : 'كاشير'}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 shadow-inner">
                        <UserIcon size={20} />
                    </div>
                </div>

                <button 
                    onClick={onLogout} 
                    className="flex items-center gap-2 text-slate-400 hover:text-red-600 p-2.5 rounded-xl hover:bg-red-50 transition-all"
                    title="تسجيل الخروج"
                >
                    <LogOut size={22} />
                </button>
            </div>
        </motion.header>
    );
};

export default Header;
