import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthStateChanged, type FirebaseUser, signInWithPopup, googleProvider, db, doc, getDoc, setDoc, collection, query, where, getDocs } from '../firebase';
import type { User } from '../types';

interface FirebaseContextType {
    user: FirebaseUser | null;
    currentUser: User | null;
    loading: boolean;
    isAdmin: boolean;
    error: string | null;
    login: () => Promise<void>;
    loginWithCredentials: (username: string, password: string, systemCode: string) => Promise<boolean>;
    logout: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

import { simpleHash } from '../utils/authUtils';
const SYSTEM_CODE = 'BK-2026';

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Persist login state in localStorage
    useEffect(() => {
        const checkAndSeed = async () => {
            try {
                // Prepare default admin data with the password 'albasha.123'
                const salt = 'default_salt';
                const adminData = {
                    username: 'admin',
                    role: 'admin',
                    passwordHash: simpleHash('albasha.123', salt),
                    salt: salt
                };

                // Use getDoc on the known bootstrap ID to avoid listing permissions if possible
                const bootstrapDoc = await getDoc(doc(db, 'users', 'bootstrap_admin'));
                
                let needsUpdate = false;
                if (bootstrapDoc.exists()) {
                    const data = bootstrapDoc.data() as User;
                    // If username is admin but the password hash is still the old one ('admin'), we must update it
                    if (data.username === 'admin' && data.passwordHash === simpleHash('admin', data.salt || 'default_salt')) {
                        needsUpdate = true;
                    }
                } else {
                    // Check if any admin exists before creating bootstrap
                    const usersRef = collection(db, 'users');
                    const q = query(usersRef, where('role', '==', 'admin'));
                    const snapshot = await getDocs(q);
                    if (snapshot.empty) {
                        needsUpdate = true;
                    }
                }

                if (needsUpdate) {
                    await setDoc(doc(db, 'users', 'bootstrap_admin'), adminData);
                    console.log('Database seeded with bootstrap admin (albasha.123)');
                    localStorage.setItem('cache_users', JSON.stringify([{ ...adminData, id: 'bootstrap_admin' }]));
                } else if (bootstrapDoc.exists()) {
                    // Update cache with online data
                    const currentData = bootstrapDoc.data() as User;
                    const cache = localStorage.getItem('cache_users');
                    let usersList: User[] = [];
                    if (cache) {
                        try { usersList = JSON.parse(cache); } catch(e) {}
                    }
                    usersList = usersList.filter(u => u.username !== 'admin');
                    usersList.push({ ...currentData, id: 'bootstrap_admin' });
                    localStorage.setItem('cache_users', JSON.stringify(usersList));
                }
            } catch (err) {
                console.warn('Seeding connection skipped (client is offline). Using local cache seed.', err);
                // Graceful fallback to make sure client is at least seeded locally with the new password
                const cache = localStorage.getItem('cache_users');
                let usersList: User[] = [];
                if (cache) {
                    try { usersList = JSON.parse(cache); } catch (e) {}
                }
                usersList = usersList.filter(u => u.username !== 'admin');
                const salt = 'default_salt';
                usersList.push({
                    id: 'bootstrap_admin',
                    username: 'admin',
                    role: 'admin',
                    passwordHash: simpleHash('albasha.123', salt),
                    salt: salt
                });
                localStorage.setItem('cache_users', JSON.stringify(usersList));
            }
        };
        checkAndSeed();

        const savedUser = localStorage.getItem('sooq_user');
        if (savedUser) {
            try {
                const parsed = JSON.parse(savedUser) as User;
                setCurrentUser(parsed);
                setIsAdmin(parsed.role === 'admin');
                setLoading(false);
            } catch (e) {
                console.error('Failed to parse saved user', e);
                localStorage.removeItem('sooq_user');
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            // Only use Google Auth for non-admins if desired, but for now we follow "Remove google login for admins"
            // If we are already logged in via credentials, ignore Google Auth state
            if (localStorage.getItem('sooq_user')) return;

            setLoading(true);
            setError(null);
            setUser(u);
            
            if (u) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', u.uid));
                    
                    if (userDoc.exists()) {
                        const userData = userDoc.data() as User;
                        if (userData.role === 'admin') {
                            // Prohibit Google Admin login as requested
                            await auth.signOut();
                            setError('تسجيل الدخول عبر جوجل غير مسموح للمسؤولين. يرجى استخدام اسم المستخدم وكلمة المرور.');
                            setCurrentUser(null);
                        } else {
                            setCurrentUser({ ...userData, id: u.uid });
                            setIsAdmin(false);
                        }
                    } else {
                        // User exists in Firebase Auth but not in our users list
                        // If they are the bootstrap admin, we used to allow it, but now we don't
                        await auth.signOut();
                        setError('عذراً، ليس لديك صلاحية للوصول إلى النظام. يرجى مراجعة المسؤول.');
                        setCurrentUser(null);
                    }
                } catch (err) {
                    console.error('Error fetching user profile:', err);
                    setError('حدث خطأ أثناء تحميل بيانات المستخدم.');
                }
            } else {
                setCurrentUser(null);
                setIsAdmin(false);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const login = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error: any) {
            console.error('Login failed:', error);
            setError('فشل تسجيل الدخول عبر جوجل.');
        }
    };

    const loginWithCredentials = async (username: string, password: string, systemCode: string): Promise<boolean> => {
        setLoading(true);
        setError(null);

        const cleanSystemCode = systemCode.trim().toUpperCase();
        if (cleanSystemCode !== SYSTEM_CODE) {
            setError('رقم الشركة (الرمز) غير صحيح.');
            setLoading(false);
            return false;
        }

        const cleanUsername = username.trim();

        try {
            let userData: User | null = null;
            let userId = '';

            try {
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('username', '==', cleanUsername));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    userData = querySnapshot.docs[0].data() as User;
                    userId = querySnapshot.docs[0].id;
                }
            } catch (dbErr) {
                console.warn('Database offline during login, checking local cache:', dbErr);
                const cache = localStorage.getItem('cache_users');
                if (cache) {
                    try {
                        const usersList = JSON.parse(cache) as User[];
                        const matched = usersList.find(u => u.username === cleanUsername);
                        if (matched) {
                            const { id, ...rest } = matched;
                            userData = rest as User;
                            userId = id;
                        }
                    } catch (e) {
                        console.error('Error parsing cached users', e);
                    }
                }
            }

            if (!userData) {
                setError('اسم المستخدم أو كلمة المرور غير صحيحة.');
                setLoading(false);
                return false;
            }

            const hashed = simpleHash(password, userData.salt);

            if (hashed === userData.passwordHash) {
                const userObj = { ...userData, id: userId };
                setCurrentUser(userObj);
                setIsAdmin(userObj.role === 'admin');
                localStorage.setItem('sooq_user', JSON.stringify(userObj));
                setLoading(false);
                return true;
            } else {
                setError('اسم المستخدم أو كلمة المرور غير صحيحة.');
                setLoading(false);
                return false;
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('حدث خطأ أثناء تسجيل الدخول.');
            setLoading(false);
            return false;
        }
    };

    const logout = async () => {
        try {
            await auth.signOut();
            setCurrentUser(null);
            setIsAdmin(false);
            localStorage.removeItem('sooq_user');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <FirebaseContext.Provider value={{ user, currentUser, loading, isAdmin, error, login, loginWithCredentials, logout }}>
            {children}
        </FirebaseContext.Provider>
    );
};

export const useFirebase = () => {
    const context = useContext(FirebaseContext);
    if (context === undefined) {
        throw new Error('useFirebase must be used within a FirebaseProvider');
    }
    return context;
};
