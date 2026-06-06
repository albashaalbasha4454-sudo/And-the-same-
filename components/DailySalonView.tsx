import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Sparkles, BookOpen, Calendar, Award, PenTool, Plus, Trash2, 
    CheckCircle, Circle, BookMarked, MessageSquare, Hourglass, 
    AlertCircle, Edit2, RotateCcw, Volume2, Save, FileText, Share2, CornerDownLeft
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import type { Product, Poem, DailyTask, ReadingProgress, User } from '../types';
import { dailySalonService } from '../services/dailySalonService';

interface DailySalonViewProps {
  products: Product[];
  currentUser: User;
}

// Preset classic Arabic poems to display as first-class initial items
const DEFAULT_PRESET_POEMS: Poem[] = [
  {
    id: 'preset-0',
    title: 'أراك عصي الدمع',
    author: 'أبو فراس الحمداني',
    category: 'غزل وحنين',
    content: 'أراك عصي الدمع شيمتك الصبر * أما للهوى نهي عليك ولا أمر؟\nبلى أنا مشتاق وعندي لوعة * ولكن مثلي لا يذاع له سر!\nإذا الليل أضواني بسطت يد الهوى * وأذللت دمعاً من خلائقه الكبر\nتكاد تضيء النار بين جوانحي * إذا هي أذكتها الصبابة والفكر',
    notes: 'تعتبر من عيون الشعر العربي الكلاسيكي وعبرت عن ثبات الأنفس وصون الود.',
    createdAt: new Date().toISOString(),
    userId: 'system'
  },
  {
    id: 'preset-1',
    title: 'أغنية المجد والقلم',
    author: 'أبو الطيب المتنبي',
    category: 'فخر وحكمة',
    content: 'الخيل والليل والبيداء تعرفني * والسيف والرمح والقرطاس والقلم\nصحبت في الفلوات الوحش منفرداً * حتى تعجب مني القور والأكم\nإذا رأيت نيوب الليث بارزة * فلا تظنن أن الليث يبتسم\nيا من يعز علينا أن نفارقهم * وجداننا كل شيء بعدكم عدم',
    notes: 'نظمها المتنبي فخراً بشجاعته وبراعته في الكتابة والفروسية.',
    createdAt: new Date().toISOString(),
    userId: 'system'
  },
  {
    id: 'preset-2',
    title: 'ولد الهدى',
    author: 'أحمد شوقي',
    category: 'مدح نبوي',
    content: 'ولد الهدى فالكائنات ضياء * وفم الزمان تبسم وثناء\nالروح والملأ الملائك حوله * للدين والدنيا به بشراء\nيا خير من جاء الوجود تحية * من مرسلين لواحد بك جاؤوا\nبك بشر الله السماء فزينت * وتوضعت مسكاً بك الغبراء',
    notes: 'قصيدة فصحى ذات جرس موسيقي مهيب لأمير الشعراء أحمد شوقي.',
    createdAt: new Date().toISOString(),
    userId: 'system'
  }
];

export const DailySalonView: React.FC<DailySalonViewProps> = ({ products, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'planner' | 'poetry' | 'reading'>('planner');
  
  // Real-time states
  const [poems, setPoems] = useState<Poem[]>([]);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [readingProgressList, setReadingProgressList] = useState<ReadingProgress[]>([]);
  
  // UI Loading States
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  // Gemini Setup Form State
  const [aiPromptType, setAiPromptType] = useState<'continue' | 'generate' | 'analyze'>('generate');
  const [aiCustomInput, setAiCustomInput] = useState('');
  const [aiTheme, setAiTheme] = useState('الكتاب والقراءة ومصاحبة الأفكار');
  const [aiStructureType, setAiStructureType] = useState('قصيدة عمودية كلاسيكية ذات عجز وصدر');

  // Input States
  // 1. Planner Input
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newTaskTimeBlock, setNewTaskTimeBlock] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');

  // 2. Poem Input
  const [newPoemTitle, setNewPoemTitle] = useState('');
  const [newPoemAuthor, setNewPoemAuthor] = useState(currentUser.username || 'الكاتب المعاصر');
  const [newPoemCategory, setNewPoemCategory] = useState('أدبيات معاصرة');
  const [newPoemContent, setNewPoemContent] = useState('');
  const [newPoemNotes, setNewPoemNotes] = useState('');
  const [newPoemLinkedBookId, setNewPoemLinkedBookId] = useState('');

  // 3. Reading Input
  const [selectedBookIdForTracking, setSelectedBookIdForTracking] = useState('');
  const [readingTotalPages, setReadingTotalPages] = useState<number>(300);
  const [readingCurrentPage, setReadingCurrentPage] = useState<number>(0);
  const [readingStatus, setReadingStatus] = useState<'reading' | 'completed' | 'paused'>('reading');
  const [readingNotes, setReadingNotes] = useState('');

  // UI Expanded Poem viewer
  const [selectedPoemDetails, setSelectedPoemDetails] = useState<Poem | null>(null);

  // Sync database subscriptions on mount
  useEffect(() => {
    const unsubPoems = dailySalonService.subscribePoems((data) => {
      // If Firestore is empty, we show local default recipes or presets
      setPoems(data);
    });
    
    const unsubTasks = dailySalonService.subscribeTasks((data) => {
      // Filter current user's tasks if applicable (or show all for business collaboration)
      setDailyTasks(data.filter(t => t.userId === currentUser.id));
    });

    const unsubProgress = dailySalonService.subscribeProgress((data) => {
      setReadingProgressList(data.filter(p => p.userId === currentUser.id));
    });

    return () => {
      unsubPoems();
      unsubTasks();
      unsubProgress();
    };
  }, [currentUser.id]);

  // Merge database poems with presets so they always have content!
  const allPoemsArray = useMemo(() => {
    const dbUserPoems = poems.map(p => ({ ...p, isDb: true }));
    // If user has no custom poems yet, let's keep preset list visible
    return [
      ...dbUserPoems,
      ...DEFAULT_PRESET_POEMS.map((p, idx) => ({ 
        id: `preset-${idx}`, 
        title: p.title, 
        author: p.author, 
        content: p.content, 
        category: p.category, 
        notes: p.notes,
        createdAt: new Date().toISOString(),
        userId: 'system',
        isDb: false
      }))
    ];
  }, [poems]);

  // Compute daily scheduler summary stats
  const taskStats = useMemo(() => {
    const total = dailyTasks.length;
    const completed = dailyTasks.filter(t => t.status === 'completed').length;
    const high = dailyTasks.filter(t => t.priority === 'high' && t.status === 'pending').length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, high, percent };
  }, [dailyTasks]);

  // Load book items
  const booksInInventory = useMemo(() => {
    return products.filter(p => p.type === 'product');
  }, [products]);

  // --- HANDLERS ---
  
  // Tasks handlers
  const handleAddTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const todayDate = new Date().toISOString().split('T')[0];
    await dailySalonService.addTask({
      title: newTaskTitle,
      priority: newTaskPriority,
      status: 'pending',
      date: todayDate,
      timeBlock: newTaskTimeBlock || undefined,
      notes: newTaskNotes || undefined,
      userId: currentUser.id
    });

    // Reset fields
    setNewTaskTitle('');
    setNewTaskTimeBlock('');
    setNewTaskNotes('');
  };

  const handleToggleTaskStatus = async (task: DailyTask) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    await dailySalonService.updateTask(task.id, { status: nextStatus });
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('هل تريد إزالة هذه الفقرة مالتنظيم اليومي؟')) return;
    await dailySalonService.deleteTask(taskId);
  };

  // Poem Handlers
  const handleAddPoemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPoemTitle.trim() || !newPoemContent.trim()) return;

    let linkedName = '';
    if (newPoemLinkedBookId) {
      const match = booksInInventory.find(b => b.id === newPoemLinkedBookId);
      if (match) linkedName = match.name;
    }

    await dailySalonService.addPoem({
      title: newPoemTitle,
      author: newPoemAuthor || 'مؤلف مجهول',
      content: newPoemContent,
      category: newPoemCategory,
      notes: newPoemNotes || undefined,
      createdAt: new Date().toISOString(),
      userId: currentUser.id,
      linkedBookId: newPoemLinkedBookId || undefined,
      linkedBookName: linkedName || undefined
    });

    // Reset Form
    setNewPoemTitle('');
    setNewPoemContent('');
    setNewPoemNotes('');
    setNewPoemLinkedBookId('');
  };

  const handleDeletePoem = async (poemId: string) => {
    if (!window.confirm('هل تريد حذف هذه القصيدة العذبة نهائياً؟')) return;
    await dailySalonService.deletePoem(poemId);
    if (selectedPoemDetails && (selectedPoemDetails as any).id === poemId) {
      setSelectedPoemDetails(null);
    }
  };

  // Reading Tracker Handlers
  const handleAddReadingTracker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookIdForTracking) return;

    const matchedBook = booksInInventory.find(b => b.id === selectedBookIdForTracking);
    if (!matchedBook) return;

    // Check if progress already tracked
    const exists = readingProgressList.some(r => r.productId === selectedBookIdForTracking);
    if (exists) {
      alert('هذا الكتاب مضاف مسبقاً في رف المتابعة.');
      return;
    }

    await dailySalonService.addProgress({
      productId: selectedBookIdForTracking,
      productName: matchedBook.name,
      currentPage: Number(readingCurrentPage) || 0,
      totalPages: Number(readingTotalPages) || 300,
      status: readingStatus,
      notes: readingNotes || undefined,
      lastReadDate: new Date().toISOString(),
      userId: currentUser.id
    });

    // Reset
    setSelectedBookIdForTracking('');
    setReadingCurrentPage(0);
    setReadingTotalPages(300);
    setReadingNotes('');
  };

  const handleUpdateReadingPage = async (id: string, currentPage: number, total: number) => {
    const nextCurrent = Math.max(0, Math.min(currentPage, total));
    const nextStatus = nextCurrent === total ? 'completed' : 'reading';
    
    await dailySalonService.updateProgress(id, {
      currentPage: nextCurrent,
      status: nextStatus,
      lastReadDate: new Date().toISOString()
    });
  };

  const handleDeleteProgress = async (id: string) => {
    if (!window.confirm('إزالة متابعة قراءة هذا الكتاب؟')) return;
    await dailySalonService.deleteProgress(id);
  };

  // --- GEMINI POETRY MUSE (INTERACTIVE CO-WRITER) ---
  const handleQueryGeminiMuse = async () => {
    if (isAiLoading) return;
    setIsAiLoading(true);
    setAiResponse(null);

    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("عذراً، مفتاح الذكاء الاصطناعي الخاص بـ Gemini غير متصل حالياً.");
      }

      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      let systemPrompt = `أنت "شاعر الصالون ورفيق الأدب" - أديب وملمّ ببحور الشعر العربي الموزون والقوافي الكلاسيكية والحديثة.
تتكلم بلهجة لغة عربية فصحى راقية، وتساعد كتاب الروايات وهواة الشعر.`;
      
      let prompt = '';

      if (aiPromptType === 'generate') {
        prompt = `قم بتأليف قصيدة عربية رائعة مكونة من 3 إلى 5 أبيات شعرية عمودية حول موضوع: "${aiTheme}".
بحيث تبنى القصيدة بشكل تراثي أصيل، على أن يتألف كل بيت من شطرتين (الصدر و العجز) وبينهما الفاصل علامة النجمة (*).
أعد الصياغة في نهاية ردك بأسلوب شاعري بليغ يغمر نفس القارئ.`;
      } else if (aiPromptType === 'continue') {
        if (!aiCustomInput.trim()) {
          throw new Error("يرجى إدخال شطر أو صدر البيت لتكملة القصيد.");
        }
        prompt = `لديك هذا البيت أو الشطر الشعري الذي نظمه الكاتب: "${aiCustomInput}".
أكمل كتابة 3 خيارات مختلفة ومتناسقة كصدر وعجز مع هذا البيت بنفس الوزن والقافية، مع توضيح البحر الشعري المرجح له والوزن المقترح، وعلق عليها بأدب عربي رقراق.`;
      } else if (aiPromptType === 'analyze') {
        if (!aiCustomInput.trim()) {
          throw new Error("يرجى إدخال الأبيات الشعرية المراد مراجعتها.");
        }
        prompt = `يرجى مراجعة وتصحيح هذه الأبيات الشعرية التالية من الناحية اللغوية والقافية والوزن مع إرشادات لتحسينها:
"${aiCustomInput}"
قدم تحليلاً دقيقاً لبحر القصيدة ونصح للشاعر المبتدئ بشكل ملهم يطور موهبته وتجنب لغة النقد الجافة.`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        }
      });

      const responseText = response.text;
      if (responseText) {
        setAiResponse(responseText);
      } else {
        setAiResponse("لم يرجع الرفيق الشاعري أي أبيات، حاول صياغة الإلهام بشكل أبسط.");
      }

    } catch (err: any) {
      console.error(err);
      setAiResponse(`حدث خطأ أثناء الاتصال بالملهم الشاعري: ${err?.message || err}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Formatter for visual poetry listing (Splits by * into dual-hemistiches)
  const formatPoemLines = (text: string) => {
    return text.split('\n').filter(Boolean).map(line => {
      const parts = line.split('*');
      return {
        r: parts[0]?.trim() || '',
        l: parts[1]?.trim() || ''
      };
    });
  };

  return (
    <div className="space-y-8">
      {/* Banner design */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 relative overflow-hidden shadow-2xl border border-indigo-900/30">
        <div className="absolute right-0 top-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] -z-0"></div>
        <div className="absolute left-10 bottom-0 w-[200px] h-[200px] bg-slate-300/5 rounded-full blur-[50px] -z-0"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <span className="bg-indigo-500/20 text-indigo-300 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-widest border border-indigo-500/30">
              ملتقى صالون الأدب واليوميات
            </span>
            <h1 className="text-3xl font-black tracking-tight leading-none text-slate-100">سكن الكاتب والقارئ اليومي</h1>
            <p className="text-sm text-slate-300 max-w-2xl font-medium">
              مساحة متكاملة تنظم مهامك اليومية ومواعيد القراءة، وترعى شرف الأفكار وقصائد الفصحى والعامية بإلهام من الذكاء الاصطناعي المساعد لضمان جمال الكلمة ورقي الحرف.
            </p>
          </div>
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center min-w-[120px]">
              <Calendar className="w-5 h-5 text-indigo-300 mx-auto mb-1" />
              <p className="text-[10px] text-slate-400 font-bold">مهام اليوم</p>
              <p className="text-xl font-black text-indigo-200 mt-1">{taskStats.percent}%</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center min-w-[120px]">
              <PenTool className="w-5 h-5 text-indigo-300 mx-auto mb-1" />
              <p className="text-[10px] text-slate-400 font-bold">إجمالي القصائد</p>
              <p className="text-xl font-black text-indigo-200 mt-1">{allPoemsArray.length}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center min-w-[120px] col-span-2 sm:col-span-1">
              <BookOpen className="w-5 h-5 text-indigo-300 mx-auto mb-1" />
              <p className="text-[10px] text-slate-400 font-bold">مطالعة نشطة</p>
              <p className="text-xl font-black text-indigo-200 mt-1">{readingProgressList.filter(l => l.status === 'reading').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-px">
        <button 
          onClick={() => { setActiveTab('planner'); setSelectedPoemDetails(null); }}
          className={`px-6 py-3.5 font-bold transition-all flex items-center gap-2 border-b-2 text-sm relative ${
            activeTab === 'planner' 
              ? 'border-indigo-600 text-indigo-600 font-extrabold' 
              : 'border-transparent text-slate-400 hover:text-slate-800'
          }`}
        >
          <Calendar size={18} />
          <span>ترتيب يومياتي</span>
          {taskStats.high > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
              {taskStats.high} هام
            </span>
          )}
        </button>
        
        <button 
          onClick={() => setActiveTab('poetry')}
          className={`px-6 py-3.5 font-bold transition-all flex items-center gap-2 border-b-2 text-sm ${
            activeTab === 'poetry' 
              ? 'border-indigo-600 text-indigo-600 font-extrabold' 
              : 'border-transparent text-slate-400 hover:text-slate-800'
          }`}
        >
          <PenTool size={18} />
          <span>ديوان القصائد والإلهام</span>
        </button>

        <button 
          onClick={() => { setActiveTab('reading'); setSelectedPoemDetails(null); }}
          className={`px-6 py-3.5 font-bold transition-all flex items-center gap-2 border-b-2 text-sm ${
            activeTab === 'reading' 
              ? 'border-indigo-600 text-indigo-600 font-extrabold' 
              : 'border-transparent text-slate-400 hover:text-slate-800'
          }`}
        >
          <BookMarked size={18} />
          <span>رف القراءة والكتب</span>
        </button>
      </div>

      {/* RENDER ACTIVE TAB */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
        >
          
          {/* TAB 1: SCHEDULE & PLANNER */}
          {activeTab === 'planner' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Task list and timeline */}
              <div className="lg:col-span-2 space-y-6">
                <div className="card-professional p-6 space-y-4">
                  <div className="flex justify-between items-center border-b pb-3 border-slate-100">
                    <div>
                      <h3 className="text-lg font-black text-slate-800">قائمة واجبات وتنظيم اليوم</h3>
                      <p className="text-xs text-slate-400 font-medium">تتبع يومك بذكاء ونظم ساعاتك لتجمع بين العلم والإدارة</p>
                    </div>
                    {dailyTasks.length > 0 && (
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <span>المنجز:</span>
                        <span className="bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full">{taskStats.completed} / {taskStats.total}</span>
                      </div>
                    )}
                  </div>

                  {dailyTasks.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto">
                        <CheckCircle className="w-8 h-8" />
                      </div>
                      <h4 className="text-slate-700 font-bold">لا توجد مهام مضافة لليوم بعد</h4>
                      <p className="text-slate-400 text-xs max-w-md mx-auto">استخدم نموذج الإضافة المليء بالخصائص الجانبية لجدولة أعمال الفرز، ومراجعة جرد الكتب، والمطالعة أو كتابة مسودات ديوانك.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
                      {dailyTasks.map(task => (
                        <div key={task.id} className="py-4 flex gap-4 items-start group">
                          <button 
                            onClick={() => handleToggleTaskStatus(task)}
                            className="mt-0.5 text-slate-300 hover:text-indigo-600 transition-colors flex-shrink-0"
                          >
                            {task.status === 'completed' ? (
                              <CheckCircle className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-300 hover:scale-110 transition-transform" />
                            )}
                          </button>
                          
                          <div className="flex-1 min-w-0 space-y-1">
                            <p className={`text-sm font-bold leading-snug cursor-pointer ${task.status === 'completed' ? 'line-through text-slate-400 font-normal' : 'text-slate-800'}`} onClick={() => handleToggleTaskStatus(task)}>
                              {task.title}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-3 text-xs">
                              {task.timeBlock && (
                                <span className="bg-amber-50 text-amber-700 border border-amber-200/50 px-2 py-0.5 rounded font-black font-mono">
                                  {task.timeBlock}
                                </span>
                              )}
                              
                              <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                                task.priority === 'high' 
                                  ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                                  : task.priority === 'medium'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                  : 'bg-slate-50 text-slate-500 border border-slate-100'
                              }`}>
                                {task.priority === 'high' ? 'أولوية قصوى' : task.priority === 'medium' ? 'متوسطة' : 'عادية'}
                              </span>

                              {task.notes && (
                                <p className="text-slate-400 text-[11px] truncate w-full sm:w-auto sm:max-w-xs" title={task.notes}>
                                  {task.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          <button 
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="إلغاء التكليف"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ambient schedule blocks */}
                <div className="card-professional p-6 bg-indigo-900/5 border-indigo-200/50 space-y-4">
                  <h4 className="text-sm font-extrabold text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                    <Hourglass size={16} className="text-indigo-600" />
                    خط الساعات المقترحة للمثقفين
                  </h4>
                  <p className="text-xs text-slate-500">
                    أفضل الأوقات لتقسيم اليوم بين تصنيف روايات المتجر وكتابة الفصول الجديدة:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                      <span className="text-[10px] bg-sky-50 text-sky-700 font-bold px-1.5 py-0.5 rounded">الصباح الباكر</span>
                      <p className="font-bold text-xs text-slate-800">فرز المخزون والطلبات</p>
                      <p className="text-[10px] text-slate-400 font-mono">08:00 ص - 10:00 ص</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                      <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-1.5 py-0.5 rounded">ظهيرة هادئة</span>
                      <p className="font-bold text-xs text-slate-800">مناقشة مراجعات وروايات</p>
                      <p className="text-[10px] text-slate-400 font-mono">11:00 ص - 01:00 م</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                      <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded">أوقات السمر</span>
                      <p className="font-bold text-xs text-slate-800">تأمل الشِّعر ومجالس الأدب</p>
                      <p className="text-[10px] text-slate-400 font-mono">06:00 م - 09:00 م</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Sidebar form */}
              <div className="space-y-6">
                <div className="card-professional p-6 space-y-4">
                  <h3 className="text-md font-extrabold text-slate-800 border-b pb-2">تفويج وإضافة عبء لليوميات</h3>
                  
                  <form onSubmit={handleAddTaskSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">عنوان التكليف أو المقرأ اليومي *</label>
                      <input 
                        type="text"
                        placeholder="مثال: جرد ديوان أبي تمام / مراجعة حسابات الرفوف"
                        value={newTaskTitle}
                        onChange={(e)=>setNewTaskTitle(e.target.value)}
                        required
                        className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none focus:border-indigo-600 transition-all font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">مستوى الاستعجال</label>
                        <select 
                          value={newTaskPriority}
                          onChange={(e)=>setNewTaskPriority(e.target.value as any)}
                          className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 font-bold"
                        >
                          <option value="low">عادية جداً</option>
                          <option value="medium">متوسط الأهمية</option>
                          <option value="high">أولوية قصوى</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">الفترة الزمنية (اختياري)</label>
                        <input 
                          type="text"
                          placeholder="مثال: 08:00 - 10:00"
                          value={newTaskTimeBlock}
                          onChange={(e)=>setNewTaskTimeBlock(e.target.value)}
                          className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">ملاحظات توجيهية (إن وجدت)</label>
                      <textarea 
                        placeholder="تفاصيل إضافية حول التكليف..."
                        value={newTaskNotes}
                        onChange={(e)=>setNewTaskNotes(e.target.value)}
                        rows={3}
                        className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600"
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={!newTaskTitle.trim()}
                      className="btn-primary w-full text-xs py-3 rounded-xl disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed font-extrabold uppercase tracking-widest mt-2"
                    >
                      <Plus size={16} />
                      تثبيت الفقرة في خطة اليوم
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: POEMS & GEMINI MUSE */}
          {activeTab === 'poetry' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left pane: Poems collection list (3 Columns) */}
              <div className="lg:col-span-4 space-y-6 max-h-[750px] overflow-y-auto pr-1">
                <div className="card-professional p-6 space-y-4">
                  <div className="flex justify-between items-center border-b pb-3 border-slate-100">
                    <div>
                      <h3 className="text-lg font-black text-slate-800">ديوان الشاعر والملهم</h3>
                      <p className="text-xs text-slate-400 font-medium">ابدأ تدوين قصائدك، أو اختر نماذج كلاسيكية لقراءتها</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {allPoemsArray.map(p => {
                      const lines = formatPoemLines(p.content);
                      const isPreset = !p.isDb;
                      const isSelected = selectedPoemDetails && (selectedPoemDetails as any).title === p.title;

                      return (
                        <div 
                          key={p.id}
                          onClick={() => setSelectedPoemDetails(p)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer text-right relative group ${
                            isSelected 
                              ? 'bg-indigo-900 border-indigo-950 text-white shadow-lg' 
                              : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          {isPreset && (
                            <span className="absolute top-2 left-3 bg-slate-100 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded">
                              نموذج تاريخي
                            </span>
                          )}
                          {!isPreset && (
                            <span className="absolute top-2 left-3 bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-100">
                              خاصتي
                            </span>
                          )}

                          <h4 className="font-extrabold text-sm truncate leading-snug w-4/5">{p.title}</h4>
                          <p className={`text-xs mt-1 ${isSelected ? 'text-indigo-200' : 'text-slate-400'} font-bold`}>{p.author}</p>
                          
                          <div className="mt-3 flex items-center justify-between text-[10px]">
                            <span className={`px-2 py-0.5 rounded ${isSelected ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'}`}>
                              {p.category || 'عام شعر'}
                            </span>
                            
                            {p.isDb && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeletePoem(p.id); }}
                                className="text-slate-300 hover:text-rose-500 p-1 rounded hover:bg-rose-50/10 transition-colors"
                                title="حذف"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Add new custom poem */}
                <div className="card-professional p-6 space-y-4">
                  <h3 className="text-md font-extrabold text-slate-800 border-b pb-2">نظم تدوين قصيدة جديدة</h3>
                  <form onSubmit={handleAddPoemSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">عنوان القصيدة / المقطع *</label>
                      <input 
                        type="text"
                        placeholder="مثال: من وحي رفوف المعرفة"
                        value={newPoemTitle}
                        onChange={(e)=>setNewPoemTitle(e.target.value)}
                        required
                        className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">القائل أو ناظم الحرف</label>
                        <input 
                          type="text"
                          value={newPoemAuthor}
                          onChange={(e)=>setNewPoemAuthor(e.target.value)}
                          placeholder="اسم الشاعر"
                          className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">النوع / الغرض</label>
                        <input 
                          type="text"
                          value={newPoemCategory}
                          onChange={(e)=>setNewPoemCategory(e.target.value)}
                          placeholder="مثال: غزل، فلسفة، مدح"
                          className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">ربط القصيدة بكتاب من المتجر (اختياري)</label>
                      <select 
                        value={newPoemLinkedBookId}
                        onChange={(e)=>setNewPoemLinkedBookId(e.target.value)}
                        className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:outline-none"
                      >
                        <option value="">-- اضغط لربط القصيدة بكتاب --</option>
                        {booksInInventory.map(book => (
                          <option key={book.id} value={book.id}>{book.name} - لـ {book.author || 'مؤلف مجهول'}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-500">الأبيات (افصل بين شطري البيت برمز النجمة *) *</label>
                        <span className="text-[9px] bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold font-mono">الصدر * العجز</span>
                      </div>
                      <textarea 
                        rows={5}
                        required
                        placeholder="الخيل والليل والبيداء تعرفني * والسيف والرمح والقرطاس والقلم&#10;ولد الهدى فالكائنات ضياء * وفم الزمان تبسم وثناء"
                        value={newPoemContent}
                        onChange={(e)=>setNewPoemContent(e.target.value)}
                        className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 font-serif leading-loose"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">هوامش أو خواطر وتأملات (اختياري)</label>
                      <input 
                        type="text"
                        placeholder="خواطر عامة عن سياق النظم وتأثير الكلم..."
                        value={newPoemNotes}
                        onChange={(e)=>setNewPoemNotes(e.target.value)}
                        className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600"
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={!newPoemTitle.trim() || !newPoemContent.trim()}
                      className="btn-primary w-full text-xs py-3 rounded-xl disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed font-extrabold uppercase mt-1"
                    >
                      <Save size={16} />
                      تثبيت القصيدة في ديواني
                    </button>
                  </form>
                </div>
              </div>

              {/* Middle and Right pane: Visual display + Gemini Muse (8 Columns) */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Visual Display view */}
                <div className="card-professional p-6 bg-stone-50/50 relative overflow-hidden flex flex-col justify-between min-h-[420px]">
                  {/* Watermark of Arabic text */}
                  <div className="absolute left-6 bottom-0 text-[100px] text-slate-400/5 leading-none select-none -z-0 pointer-events-none font-serif font-extrabold">بَحْـر</div>
                  
                  {selectedPoemDetails ? (
                    <div className="space-y-6 relative z-10">
                      
                      {/* Title & metadata */}
                      <div className="flex justify-between items-start border-b border-stone-200/60 pb-4">
                        <div className="space-y-1">
                          <h3 className="text-xl font-black text-slate-800 tracking-tight">{selectedPoemDetails.title}</h3>
                          <p className="text-xs text-indigo-700 font-extrabold flex items-center gap-1.5 bg-indigo-50 px-2 py-0.5 rounded-full w-max">
                            <PenTool size={11} />
                            بأقلام: {selectedPoemDetails.author}
                          </p>
                        </div>

                        <div className="text-left space-y-1">
                          <span className="bg-stone-200/50 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest border border-stone-300/40">
                            {selectedPoemDetails.category || 'مقتطفات'}
                          </span>
                          {selectedPoemDetails.linkedBookName && (
                            <p className="text-[10px] text-amber-800 font-bold flex items-center justify-end gap-1 mt-1 font-sans">
                              <BookOpen size={10} />
                              مرتبط بكتاب: {selectedPoemDetails.linkedBookName}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Poetry dual hemistich template */}
                      <div className="py-6 space-y-5 text-center">
                        {formatPoemLines(selectedPoemDetails.content).map((line, idx) => (
                          <div key={idx} className="flex flex-col md:flex-row md:items-center justify-center gap-4 text-center select-all">
                            
                            {/* Hemistich R */}
                            <div className="md:flex-1 text-center md:text-left text-slate-800 font-serif text-md font-bold hover:text-indigo-900 transition-colors md:pl-2">
                              {line.r}
                            </div>
                            
                            {/* Divider star */}
                            <div className="text-[11px] text-amber-500 font-extrabold select-none opacity-40 py-1 md:py-0">
                              ✦
                            </div>
                            
                            {/* Hemistich L */}
                            <div className="md:flex-1 text-center md:text-right text-slate-800 font-serif text-md font-bold hover:text-indigo-900 transition-colors md:pr-2">
                              {line.l}
                            </div>
                            
                          </div>
                        ))}
                      </div>

                      {/* Notes & annotations */}
                      {selectedPoemDetails.notes && (
                        <div className="bg-amber-50/50 border-r-4 border-amber-300 p-4 rounded-md">
                          <p className="text-[11px] text-amber-800 font-bold flex items-center gap-1 mb-1 font-sans">
                            <FileText size={12} />
                            هوامش الشارح ورؤية الكاتب:
                          </p>
                          <p className="text-xs text-amber-900 leading-relaxed font-sans font-medium">{selectedPoemDetails.notes}</p>
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="text-center my-auto py-12 space-y-4">
                      <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center text-stone-400 mx-auto border border-stone-200 shadow-inner">
                        <PenTool className="w-7 h-7" />
                      </div>
                      <h4 className="text-slate-700 font-black text-lg">صالون القراءة والإنشاد</h4>
                      <p className="text-slate-400 text-xs max-w-sm mx-auto">
                        اضغط على أي قصيدة شعرية مثبتة لتنسيق شطرها وعجزها في اللوحة الأدبية المهيبة بشكل كلاسيكي مريح للنفس وقابل للنسخ والنسج المباشر!
                      </p>
                    </div>
                  )}
                </div>

                {/* Gemini Interactive Co-writer interface (THE MUSE) */}
                <div id="gemini-poetry-muse" className="card-professional p-6 bg-gradient-to-br from-indigo-50/70 via-white to-pink-50/40 relative overflow-hidden border-indigo-200">
                  <div className="absolute right-3 top-3 w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                      <Sparkles size={20} className="animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-md font-extrabold text-slate-800">الشاعر الرفيق وملهم البحور (Gemini AI)</h3>
                      <p className="text-[10px] text-slate-400 font-medium">مساعد كتابي فوري للقصائد، التدقيق العروضي، وتأليف القوافي</p>
                    </div>
                  </div>

                  {/* Mode switcher inside the widget */}
                  <div className="flex gap-2 p-1 bg-slate-100/70 rounded-xl mb-4 text-xs font-bold border border-slate-200/50">
                    <button 
                      onClick={() => { setAiPromptType('generate'); setAiResponse(null); }}
                      className={`flex-1 py-2 text-center rounded-lg transition-all ${
                        aiPromptType === 'generate' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-400 hover:text-slate-800'
                      }`}
                    >
                      توليد أبيات على موضوع
                    </button>
                    <button 
                      onClick={() => { setAiPromptType('continue'); setAiResponse(null); }}
                      className={`flex-1 py-2 text-center rounded-lg transition-all ${
                        aiPromptType === 'continue' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-400 hover:text-slate-800'
                      }`}
                    >
                      أكمل شطراً شعرياً
                    </button>
                    <button 
                      onClick={() => { setAiPromptType('analyze'); setAiResponse(null); }}
                      className={`flex-1 py-2 text-center rounded-lg transition-all ${
                        aiPromptType === 'analyze' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-400 hover:text-slate-800'
                      }`}
                    >
                      مصحح القافية والتفعيلة
                    </button>
                  </div>

                  {/* Inputs depending on active Gemini mode */}
                  <div className="space-y-4">
                    {aiPromptType === 'generate' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-slate-500">مغزى وموضوع القصيدة:</label>
                          <input 
                            type="text"
                            value={aiTheme}
                            onChange={(e)=>setAiTheme(e.target.value)}
                            placeholder="مثال: القهوة في الصباح الباكر، وفاء الأصدقاء"
                            className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-slate-500">النمط البنائي المفضل:</label>
                          <select 
                            value={aiStructureType}
                            onChange={(e)=>setAiStructureType(e.target.value)}
                            className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:outline-none text-slate-700 font-bold"
                          >
                            <option value="قصيدة عمودية كلاسيكية ذات عجز وصدر">عمودية كلاسيكية (صدر وعجز)</option>
                            <option value="شعر تفعيلة حر حديث موزون">شعر تفعيلة حر قصير</option>
                            <option value="أبيات عامية من وحي سجع الحكايات">عامي / زجل شعبي</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {(aiPromptType === 'continue' || aiPromptType === 'analyze') && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500">
                          {aiPromptType === 'continue' ? 'اكتب أول كلمة أو شطر نظمته ليردفك الرفيق بما يوازنه:' : 'ألصِق الأبيات الشعرية التي تريد أن يراجعها مصحح البحور والقافية:'}
                        </label>
                        <textarea 
                          rows={3}
                          value={aiCustomInput}
                          onChange={(e)=>setAiCustomInput(e.target.value)}
                          placeholder={aiPromptType === 'continue' ? 'مثال: أراك عصي الدمع شيمتك الصبر ...' : 'ألصِق قصيدتك هنا...'}
                          className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 font-serif leading-loose font-bold"
                        />
                      </div>
                    )}

                    {/* Submit action */}
                    <div className="flex justify-between items-center gap-4">
                      <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                        * يستغرق الذكاء الاصطناعي ثوانٍ معدودة لينسج الحرف. يرجى تزويده بوصف دقيق ومميز.
                      </p>
                      
                      <button 
                        onClick={handleQueryGeminiMuse}
                        disabled={isAiLoading || (aiPromptType !== 'generate' && !aiCustomInput.trim())}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-3 rounded-xl disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-100 flex items-center gap-2 flex-shrink-0"
                      >
                        {isAiLoading ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>أعبر بحور الفكر...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} className="animate-spin" />
                            <span>استدعاء الشاعر الرفيق</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Response display */}
                    {aiResponse && (
                      <div className="mt-4 p-5 bg-indigo-950 text-indigo-50 rounded-2xl border border-indigo-900 shadow-inner relative max-h-[350px] overflow-y-auto">
                        <div className="absolute left-3 top-3 bg-white/10 text-white text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                          <Sparkles size={10} />
                          استجابة الملهم
                        </div>
                        <h4 className="font-extrabold text-xs text-indigo-300 border-b border-indigo-900 pb-2 mb-2">إليك ما وُسِق ببحور الخواطر:</h4>
                        
                        <p className="whitespace-pre-line font-serif text-sm leading-loose tracking-wide pr-1 select-all">
                          {aiResponse}
                        </p>
                      </div>
                    )}

                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: READING PROGRESS TRACKER */}
          {activeTab === 'reading' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Tracker Cards List */}
              <div className="lg:col-span-2 space-y-6">
                <div className="card-professional p-6 space-y-4">
                  <div className="flex justify-between items-center border-b pb-3 border-slate-100">
                    <div>
                      <h3 className="text-lg font-black text-slate-800">رف الكتب ومتابعة المطالعة</h3>
                      <p className="text-xs text-slate-400 font-medium">خطتك لتقدم القراءة والتسجيل المعرفي لكتب والروايات</p>
                    </div>
                  </div>

                  {readingProgressList.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto">
                        <BookMarked className="w-8 h-8" />
                      </div>
                      <h4 className="text-slate-700 font-bold">لا يوجد كتب في الرف النشط لليوميات</h4>
                      <p className="text-slate-400 text-xs max-w-md mx-auto">
                        اربط تقدم قراءتك بأي من الكتب المتاحة بالمتجر أو المخزن لمطالعتها وتقسيم الأهداف اليومية!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {readingProgressList.map(item => {
                        const percent = item.totalPages > 0 ? Math.round((item.currentPage / item.totalPages) * 100) : 0;
                        const isDone = item.status === 'completed';

                        return (
                          <div 
                            key={item.id} 
                            className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                          >
                            <div className="space-y-2">
                              {/* Status Badge */}
                              <div className="flex justify-between items-start">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isDone 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                    : item.status === 'paused'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                }`}>
                                  {isDone ? 'أتممت اللقاء معرفياً' : item.status === 'paused' ? 'متوقف مؤقتاً' : 'متواصل بالقراءة'}
                                </span>

                                <button 
                                  onClick={() => handleDeleteProgress(item.id)}
                                  className="text-slate-300 hover:text-rose-600 p-1 rounded-md"
                                  title="إزالة المتابعة"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>

                              <h4 className="font-extrabold text-sm text-slate-800 line-clamp-1">{item.productName}</h4>
                              <p className="text-[10px] text-slate-400 font-bold font-mono">آخر تقدم: {new Date(item.lastReadDate).toLocaleDateString('ar-EG')}</p>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-1.5 pt-2">
                              <div className="flex justify-between text-xs font-bold text-slate-500">
                                <span>التقدم: {percent}%</span>
                                <span className="font-mono">{item.currentPage} / {item.totalPages} صفحة</span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${isDone ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                                  style={{ width: `${percent}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Quick incremental actions */}
                            <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 justify-between">
                              <button 
                                onClick={() => handleUpdateReadingPage(item.id, item.currentPage - 10, item.totalPages)}
                                disabled={item.currentPage <= 0}
                                className="px-2.5 py-1 text-xs bg-slate-50 text-slate-600 hover:bg-slate-100 border rounded-lg transition-colors font-bold flex items-center"
                                title="تراجع 10 صفحات"
                              >
                                -10
                              </button>

                              <button 
                                onClick={() => handleUpdateReadingPage(item.id, item.currentPage + 1, item.totalPages)}
                                className="flex-1 py-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-extrabold transition-colors flex items-center justify-center gap-1"
                              >
                                <span>+1 صفحة</span>
                              </button>

                              <button 
                                onClick={() => handleUpdateReadingPage(item.id, item.currentPage + 10, item.totalPages)}
                                disabled={item.currentPage >= item.totalPages}
                                className="px-2.5 py-1 text-xs bg-slate-50 text-slate-600 hover:bg-slate-100 border rounded-lg transition-colors font-bold flex items-center"
                                title="تقدم 10 صفحات"
                              >
                                +10
                              </button>
                            </div>

                            {/* Reading Notes snippet */}
                            {item.notes && (
                              <p className="text-[10px] text-slate-400 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                                "{item.notes}"
                              </p>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Add Progress tracker sidebar */}
              <div className="space-y-6">
                <div className="card-professional p-6 space-y-4">
                  <h3 className="text-md font-extrabold text-slate-800 border-b pb-2">تفويج كتاب في الرف النشط</h3>
                  
                  <form onSubmit={handleAddReadingTracker} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">اختر كتاباً من كتب المتجر *</label>
                      <select 
                        value={selectedBookIdForTracking}
                        onChange={(e)=>setSelectedBookIdForTracking(e.target.value)}
                        required
                        className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:outline-none"
                      >
                        <option value="">-- اضغط للاختيار --</option>
                        {booksInInventory.map(book => (
                          <option key={book.id} value={book.id}>{book.name} - لـ {book.author || 'مؤلف مجهول'}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">عدد الصفحات الكلي</label>
                        <input 
                          type="number"
                          value={readingTotalPages}
                          onChange={(e)=>setReadingTotalPages(Number(e.target.value))}
                          placeholder="مثال: 320"
                          min={1}
                          className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">صفحتك الحالية</label>
                        <input 
                          type="number"
                          value={readingCurrentPage}
                          onChange={(e)=>setReadingCurrentPage(Number(e.target.value))}
                          placeholder="مثال: 45"
                          min={0}
                          className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none font-bold animate"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">الحالة الأولية</label>
                      <select 
                        value={readingStatus}
                        onChange={(e)=>setReadingStatus(e.target.value as any)}
                        className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:outline-none text-slate-700 font-bold"
                      >
                        <option value="reading">قيد القراءة بنشاط</option>
                        <option value="completed">منته مكتمل</option>
                        <option value="paused">متوقف مؤقتاً</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">خاطرة سريعة أو هدف (اختياري)</label>
                      <textarea 
                        placeholder="دون انطباعاتك الحالية أو هدف قراءة كـ: 'أريد قراءته في 3 أيام'..."
                        value={readingNotes}
                        onChange={(e)=>setReadingNotes(e.target.value)}
                        rows={3}
                        className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600"
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={!selectedBookIdForTracking}
                      className="btn-primary w-full text-xs py-3 rounded-xl disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed font-extrabold uppercase mt-2"
                    >
                      <Plus size={16} />
                      تثبيت الكتاب للمتابعة النشطة
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
};
