import { motion } from 'framer-motion';
import { Users, UserPlus, BarChart3, UserCircle, Upload, Phone, CheckCircle, TrendingUp, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth';

const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Staff', href: '/staff', icon: Users, roles: ['admin'] },
    { name: 'Users', href: '/users', icon: Users, roles: ['admin', 'staff'] },
    { name: 'Add Staff', href: '/add-staff', icon: UserPlus, roles: ['admin'] },
    { name: 'Add User', href: '/add-user', icon: UserPlus, roles: ['admin'] },
    { name: 'Upload Phones', href: '/upload-phones', icon: Upload, roles: ['admin'] },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy, roles: ['admin'] },
    { name: 'Staff Statistics', href: '/staff-statistics', icon: TrendingUp, roles: ['admin'] },
    { name: 'Calls', href: '/calls', icon: Phone, roles: ['staff'] },
    { name: 'Completed Calls', href: '/completed-calls', icon: CheckCircle, roles: ['admin'] },
    { name: 'Profile', href: '/profile', icon: UserCircle },
];

export const Sidebar = () => {
    const { user } = useAuthStore();

    const filteredItems = menuItems.filter(
        (item) => !item.roles || item.roles.includes(user?.role || '')
    );

    return (
        <motion.aside
            initial={{ x: -250, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="w-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-xl border-r border-blue-200/50 dark:border-blue-800/50"
        >
            <div className="p-6 border-b border-blue-100 dark:border-blue-900">
                <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">Navigation</h2>
            </div>
            <nav className="p-4">
                <ul className="space-y-2">
                    {filteredItems.map((item, index) => (
                        <motion.li
                            key={item.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Link
                                href={item.href}
                                className="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 group border border-transparent hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md"
                            >
                                <motion.div
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-800/30 transition-colors"
                                >
                                    <item.icon size={20} />
                                </motion.div>
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        </motion.li>
                    ))}
                </ul>
            </nav>
        </motion.aside>
    );
};