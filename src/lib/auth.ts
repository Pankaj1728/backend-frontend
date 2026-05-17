import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Cookies from 'js-cookie';

interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    mobile?: string;
    profilePic?: string;
    role: 'admin' | 'staff' | 'user';
}

interface AuthState {
    user: User | null;
    isHydrated: boolean;
    setHydrated: () => void;
    login: (user: User, token: string) => void;
    logout: () => void;
    reset: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isHydrated: false,
            setHydrated: () => set({ isHydrated: true }),
            login: (user, token) => {
                Cookies.set('token', token, { expires: 7, path: '/', sameSite: 'lax' });
                set({ user, isHydrated: true });
            },
            logout: () => {
                Cookies.remove('token', { path: '/' });
                localStorage.removeItem('auth-storage');
                set({ user: null, isHydrated: true });
            },
            reset: () => {
                Cookies.remove('token', { path: '/' });
                localStorage.removeItem('auth-storage');
                set({ user: null, isHydrated: false });
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ user: state.user }),
            onRehydrateStorage: () => (state) => {
                state?.setHydrated();
            },
        }
    )
);