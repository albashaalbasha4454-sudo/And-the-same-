import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Lock, ArrowRight, Loader2, BookOpen } from 'lucide-react';

import { useFirebase } from './FirebaseProvider';

interface LoginViewProps {
  onLogin: (username: string, password: string, systemCode: string) => Promise<boolean>;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const { error: firebaseError } = useFirebase();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [systemCode, setSystemCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !password || !systemCode) {
      setError('الرجاء إدخال اسم المستخدم وكلمة المرور والرمز.');
      return;
    }
    setIsLoading(true);
    const success = await onLogin(username, password, systemCode);
    if (!success) {
      // Error handled by provider/setError
    }
    setIsLoading(false);
  };

  const displayError = firebaseError || error;

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC] font-sans" dir="rtl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(79,70,229,0.05),transparent)] pointer-events-none"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-10">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-20 h-20 bg-slate-900 rounded-3xl mx-auto flex items-center justify-center shadow-2xl mb-6 relative group rotate-3 hover:rotate-0 transition-transform duration-500"
            >
                <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <BookOpen className="text-white relative z-10" size={40} />
            </motion.div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">أهلاً بك</h1>
            <p className="text-slate-500 font-medium">سجل الدخول للمتابعة إلى سوق الكتاب</p>
        </div>

        <div className="glass-panel p-8 shadow-2xl border border-white/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>
          
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">رقم الشركة (الرمز)</label>
              <div className="relative group">
                <ArrowRight size={18} className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  id="systemCode"
                  type="text"
                  value={systemCode}
                  onChange={(e) => setSystemCode(e.target.value)}
                  className="w-full px-5 py-4 pr-12 text-slate-700 bg-white/50 backdrop-blur-sm border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white transition-all outline-none font-bold"
                  placeholder="رقم الاشتراك"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">اسم المستخدم</label>
              <div className="relative group">
                <User size={18} className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-5 py-4 pr-12 text-slate-700 bg-white/50 backdrop-blur-sm border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white transition-all outline-none font-bold"
                  placeholder="أدخل اسمك هنا"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">كلمة المرور</label>
              <div className="relative group">
                <Lock size={18} className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-4 pr-12 text-slate-700 bg-white/50 backdrop-blur-sm border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white transition-all outline-none font-bold"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {displayError && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 text-red-500 text-[10px] font-black p-3 rounded-lg text-center border border-red-100 uppercase tracking-tight"
                >
                  {displayError}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 focus:ring-4 focus:ring-slate-200 transition-all duration-300 flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 disabled:bg-slate-400 disabled:shadow-none"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span>تسجيل الدخول</span>
                  <ArrowRight size={18} className="rotate-180" />
                </>
              )}
            </button>

            <div className="mt-4 pt-4 border-t border-slate-100 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">معلومات الدخول الأساسية</p>
              <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-3 flex flex-col gap-2 text-right">
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
                  <span>اسم المستخدم:</span>
                  <span className="font-mono bg-slate-200/50 px-2 py-0.5 rounded text-slate-800 select-all">admin</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
                  <span>كلمة المرور:</span>
                  <span className="font-mono bg-slate-200/50 px-2 py-0.5 rounded text-slate-800 select-all">albasha.123</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
                  <span>رقم الاشتراك:</span>
                  <span className="font-mono bg-indigo-50 px-2 py-0.5 rounded text-indigo-700 select-all">BK-2026</span>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
            © 2026 SOOQ ALKETAB • v2.0 Professional
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginView;
