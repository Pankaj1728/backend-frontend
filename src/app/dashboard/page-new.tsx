'use client';

import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { Layout } from '@/components/Layout';
import { BarChart3, Users, UserPlus, TrendingUp } from 'lucide-react';

export default function Dashboard() {
    const { user } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!user) {
            router.push('/');
        }
    }, [user, router]);

    if (!user) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
                    />
                </div>
            </Layout>
        );
    }

    const stats = [
        { name: 'Total Users', value: '1,234', icon: Users, color: 'from-blue-500 to-blue-600' },
        { name: 'Active Staff', value: '56', icon: UserPlus, color: 'from-green-500 to-green-600' },
        { name: 'Growth', value: '+12.5%', icon: TrendingUp, color: 'from-purple-500 to-purple-600' },
        { name: 'Revenue', value: '$12.3K', icon: BarChart3, color: 'from-orange-500 to-orange-600' },
    ];

    const quickActions = [
        { name: 'Add User', href: '/add-user', color: 'blue' },
        { name: 'Add Staff', href: '/add-staff', color: 'green' },
        { name: 'View Staff', href: '/staff', color: 'purple' },
        { name: 'View Users', href: '/users', color: 'orange' },
    ];

    return (
        <Layout>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
            >
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
                    <h1 className="text-2xl font-bold">Welcome back, {user?.name}!</h1>
                    <p className="text-blue-100 mt-1">Here's your CRM overview</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-lg border border-slate-200 dark:border-slate-700"
                        >
                            <div className="flex items-center justify-between">
                                <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}>
                                    <stat.icon className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <p className="text-sm text-slate-600 dark:text-slate-300">{stat.name}</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {quickActions.map((action, index) => (
                            <motion.button
                                key={action.name}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 + index * 0.1 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => router.push(action.href)}
                                className={`p-4 rounded-lg bg-${action.color}-50 dark:bg-${action.color}-900/20 hover:bg-${action.color}-100 dark:hover:bg-${action.color}-800/30 transition-colors text-${action.color}-600 dark:text-${action.color}-400 font-medium text-sm`}
                            >
                                {action.name}
                            </motion.button>
                        ))}
                    </div>
                </div>
            </motion.div>
        </Layout>
    );
}