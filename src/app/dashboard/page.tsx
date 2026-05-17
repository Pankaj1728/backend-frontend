'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { Layout } from '@/components/Layout';
import RecentActivity from '@/components/RecentActivity';
import RecentlyJoinedStaff, { UpcomingBirthdays } from '@/components/DashboardWidgets';
import CreatePost from '@/components/CreatePost';
import PostsFeed from '@/components/PostsFeed';
import {
    BarChart3,
    Users,
    UserPlus,
    Activity,
    TrendingUp,
    Calendar,
    Clock,
    Target,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';

export default function Dashboard() {
    const { user, isHydrated } = useAuthStore();
    const router = useRouter();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        if (!isHydrated) return;
        if (!user) {
            router.push('/');
        }
    }, [user, router, isHydrated]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

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

    const quickActions = user?.role === 'admin' ? [
        {
            name: 'Add User',
            icon: UserPlus,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-800/30',
            action: () => router.push('/add-user')
        },
        {
            name: 'View Users',
            icon: Users,
            color: 'text-green-600',
            bgColor: 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-800/30',
            action: () => router.push('/users')
        },
        {
            name: 'Add Staff',
            icon: UserPlus,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-800/30',
            action: () => router.push('/add-staff')
        },
        {
            name: 'View Staff',
            icon: Users,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-800/30',
            action: () => router.push('/staff')
        },
    ] : [
        {
            name: 'My Users',
            icon: Users,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-800/30',
            action: () => router.push('/users')
        },
        {
            name: 'Edit Profile',
            icon: UserPlus,
            color: 'text-green-600',
            bgColor: 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-800/30',
            action: () => router.push('/profile')
        },
        {
            name: 'Reports',
            icon: BarChart3,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-800/30',
            action: () => { }
        },
    ];

    return (
        <Layout>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-8"
            >
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-8 text-white relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div>
                                <motion.h1
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-4xl font-bold mb-2"
                                >
                                    Welcome back, {user?.name}! 👋
                                </motion.h1>
                                <motion.p
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.6 }}
                                    className="text-blue-100 text-lg"
                                >
                                    Here's what's happening with your CRM today.
                                </motion.p>
                            </div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.8 }}
                                className="mt-4 md:mt-0 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
                            >
                                <div className="flex items-center space-x-2 text-blue-100">
                                    <Clock className="h-5 w-5" />
                                    <span className="font-medium">
                                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="text-sm text-blue-200 mt-1">
                                    {currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                    {/* Decorative elements */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full"></div>
                </motion.div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Section - Recent Activity */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Recent Activity - Use new component for admin */}
                        {user?.role === 'admin' ? (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.8 }}
                            >
                                <RecentActivity />
                            </motion.div>
                        ) : null}

                        {/* Quick Actions */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                                    <Target className="h-6 w-6 mr-3 text-green-600" />
                                    Quick Actions
                                </h2>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-2 gap-4">
                                    {quickActions.map((action, index) => (
                                        <motion.button
                                            key={action.name}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 1.2 + index * 0.1 }}
                                            whileHover={{
                                                scale: 1.05,
                                                transition: { type: "spring", stiffness: 300, damping: 20 }
                                            }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={action.action}
                                            className={`p-4 ${action.bgColor} rounded-xl transition-all duration-300 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 group`}
                                        >
                                            <action.icon className={`h-6 w-6 ${action.color} mb-2 group-hover:scale-110 transition-transform`} />
                                            <p className={`text-sm font-semibold ${action.color} group-hover:scale-105 transition-transform`}>
                                                {action.name}
                                            </p>
                                        </motion.button>
                                    ))}
                                </div>

                                {/* Additional Stats */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.6 }}
                                    className="mt-6 p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 rounded-xl"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Today's Goal</p>
                                            <p className="text-2xl font-bold text-slate-900 dark:text-white">85%</p>
                                        </div>
                                        <TrendingUp className="h-8 w-8 text-green-600" />
                                    </div>
                                    <div className="mt-3">
                                        <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: '85%' }}
                                                transition={{ delay: 1.8, duration: 1 }}
                                                className="h-2 bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">15% remaining to reach goal</p>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Sidebar - Dashboard Widgets */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.2 }}
                        className="space-y-6"
                    >
                        {/* Create Post - Admin Only */}
                        {user?.role === 'admin' && <CreatePost />}

                        {/* Posts Feed */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-4">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Activity className="h-5 w-5 text-blue-600" />
                                Team Updates
                            </h3>
                            <PostsFeed />
                        </div>

                        {/* Existing Widgets */}
                        <RecentlyJoinedStaff />
                        <UpcomingBirthdays />
                    </motion.div>
                </div>
            </motion.div>
        </Layout>
    );
}
