import React, { useState } from 'react';
import type { User } from '../types';
import Modal from './Modal';
import InputField from './common/InputField';
import { motion, AnimatePresence } from 'motion/react';
import { UserCog, UserPlus, Shield, ShieldCheck, Mail, Lock, Trash2, Edit3, MoreVertical, Search, CheckCircle2, XCircle } from 'lucide-react';

interface UsersViewProps {
  users: User[];
  addUser: (user: Omit<User, 'id' | 'passwordHash' | 'salt'> & { password: string }) => any | Promise<any>;
  updateUser: (id: string, user: Partial<Omit<User, 'id' | 'passwordHash' | 'salt'>> & { password?: string }) => void | Promise<any>;
  deleteUser: (id: string) => void | Promise<any>;
  currentUser: User;
}

const UsersView: React.FC<UsersViewProps> = ({ users, addUser, updateUser, deleteUser, currentUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.role === 'admin' ? 'مدير' : 'موظف').includes(searchTerm)
  );

  const handleOpenModal = (user: User | null = null) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingUser(null);
    setIsModalOpen(false);
  };

  const handleSave = (userData: any) => {
    if (editingUser) {
      updateUser(editingUser.id, userData);
    } else {
      addUser(userData);
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (id === currentUser.id) return;
    if (window.confirm('هل أنت متأكد من حذف هذا المستخدم نهائياً؟')) {
      deleteUser(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">إدارة المستخدمين</h2>
          <p className="text-slate-500 font-medium">إدارة صلاحيات الوصول والحسابات للموظفين والمديرين</p>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="btn-primary"
        >
          <UserPlus size={18} />
          <span>إضافة مستخدم جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-professional p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
            <UserCog size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجمالي الحسابات</p>
            <p className="text-2xl font-black text-slate-800">{users.length}</p>
          </div>
        </div>
        <div className="card-professional p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المسؤولون</p>
            <p className="text-2xl font-black text-slate-800">{users.filter(u => u.role === 'admin').length}</p>
          </div>
        </div>
        <div className="card-professional p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <UserCog size={24} className="text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الموظفون (كاشير)</p>
            <p className="text-2xl font-black text-slate-800">{users.filter(u => u.role === 'cashier').length}</p>
          </div>
        </div>
      </div>

      <div className="card-professional">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-4 justify-between">
           <div className="relative flex-1 max-w-md">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="البحث بالاسم أو الدور..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none font-bold text-slate-700"
              />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">المستخدم</th>
                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">الصلاحية</th>
                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">الحالة</th>
                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence mode="popLayout">
                {filteredUsers.map((user) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={user.id} 
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 ${
                          user.id === currentUser.id ? 'bg-indigo-600 text-white border-indigo-100' : 'bg-slate-100 text-slate-600 border-white shadow-sm'
                        }`}>
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 flex items-center gap-2">
                            {user.username}
                            {user.id === currentUser.id && (
                              <span className="inline-flex px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-600 text-[8px] font-black uppercase">أنت</span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">ID: {user.id.substring(0,8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black uppercase ${
                        user.role === 'admin' 
                        ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                        : 'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                        {user.role === 'admin' ? <Shield size={14} /> : <UserCog size={14} />}
                        {user.role === 'admin' ? 'مدير كامل الصلاحيات' : 'موظف مبيعات'}
                      </div>
                    </td>
                    <td className="py-5 px-6">
                       <div className="flex items-center gap-2 text-green-600 font-bold text-xs">
                          <CheckCircle2 size={14} />
                          <span>نشط</span>
                       </div>
                    </td>
                    <td className="py-5 px-6 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => handleOpenModal(user)} 
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                          title="تعديل البيانات"
                        >
                          <Edit3 size={18} />
                        </button>
                        {user.id !== currentUser.id && (
                          <button 
                            onClick={() => handleDelete(user.id)} 
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            title="حذف المستخدم"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="py-24 text-center">
               <UserCog size={48} className="mx-auto text-slate-200 mb-4" />
               <p className="text-slate-400 font-bold">لا يوجد نتائج تطابق بحثك...</p>
            </div>
          )}
        </div>
      </div>
      {isModalOpen && (
        <UserModal
          user={editingUser}
          onClose={handleCloseModal}
          onSave={handleSave}
          isEditing={!!editingUser}
        />
      )}
    </div>
  );
};

// UserModal component
const UserModal: React.FC<{
  user: User | null;
  onClose: () => void;
  onSave: (data: any) => void;
  isEditing: boolean;
}> = ({ user, onClose, onSave, isEditing }) => {
  const [username, setUsername] = useState(user?.username || '');
  const [role, setRole] = useState<'admin' | 'cashier'>(user?.role || 'cashier');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userData: any = { username, role };
    if (password) userData.password = password;
    onSave(userData);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={isEditing ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <InputField
          id="username"
          label="اسم المستخدم"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="أدخل اسم المستخدم"
        />
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">الصلاحية</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'admin' | 'cashier')}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none font-bold text-slate-700"
          >
            <option value="admin">مدير</option>
            <option value="cashier">كاشير</option>
          </select>
        </div>
        <InputField
          id="password"
          label={isEditing ? 'تغيير كلمة المرور (اتركه فارغاً للحفاظ على القديمة)' : 'كلمة المرور'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="أدخل الحماية هنا"
        />
        <div className="flex gap-4 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">
            إلغاء
          </button>
          <button type="submit" className="flex-1 btn-primary">
            {isEditing ? 'تحديث البيانات' : 'إنشاء الحساب'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UsersView;
