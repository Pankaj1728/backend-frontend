import { motion } from 'framer-motion';
import { LogOut, User } from 'lucide-react';
import { useAuthStore } from '@/lib/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NotificationBell from './NotificationBell';

export const Header = () => {
    const { user, logout } = useAuthStore();
    const router = useRouter();
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "CRM System";

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    return (
        <motion.header
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-lg border-b border-blue-200/50 dark:border-blue-800/50 sticky top-0 z-50"
        >
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link href="/dashboard" className="flex items-center space-x-3 group">
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg"
                        >
                            <span className="text-white font-bold text-xl">{siteName.charAt(0).toUpperCase()}</span>
                        </motion.div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">{siteName}</h1>
                    </Link>
                    <div className="flex items-center space-x-3 md:space-x-4">
                        {/* Notification Bell */}
                        <NotificationBell />

                        <Link href="/profile" className="hidden md:flex items-center space-x-3 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer">
                            {user?.profilePic ? (
                                <img
                                    src={`http://localhost:3000/uploads/${user.profilePic}`}
                                    alt={user.name}
                                    className="w-8 h-8 rounded-full object-cover border-2 border-blue-600"
                                />
                            ) : (
                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                    <span className="text-white font-medium text-sm">
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {user?.name}
                            </span>
                            <User size={16} className="text-slate-500 dark:text-slate-400" />
                        </Link>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleLogout}
                            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl"
                        >
                            <LogOut size={16} />
                            <span className="hidden sm:inline">Logout</span>
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.header>
    );
};