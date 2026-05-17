'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/lib/auth';
import api from '@/lib/api';
import { Layout } from '@/components/Layout';
import { Trophy, TrendingUp, CheckCircle, Award, Medal, Crown } from 'lucide-react';

interface StaffRanking {
    staffId: string;
    staffName: string;
    staffEmail: string;
    total: number;
    completed: number;
    pending: number;
    completionRate: string;
}

export default function Leaderboard() {
    const router = useRouter();
    const { user, isHydrated } = useAuthStore();
    const [authorized, setAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);
    const [rankings, setRankings] = useState<StaffRanking[]>([]);

    useEffect(() => {
        if (!isHydrated) return;

        if (!user || user.role !== 'admin') {
            router.push('/dashboard');
            return;
        }

        setAuthorized(true);
        fetchRankings();
    }, [user, router, isHydrated]);

    const fetchRankings = async (retryCount = 0) => {
        try {
            setLoading(true);
            const response = await api.get('/phones/statistics');
            // Sort by completed contacts (descending)
            const sortedRankings = (response.data.statistics || []).sort(
                (a: StaffRanking, b: StaffRanking) => b.completed - a.completed
            );
            setRankings(sortedRankings);
        } catch (error: any) {
            if (retryCount < 1 && error?.code === 'ERR_NETWORK') {
                await new Promise(resolve => setTimeout(resolve, 2000));
                return fetchRankings(retryCount + 1);
            }
            const errorMsg = error?.code === 'ERR_RATE_LIMIT' ? error.message : 'Failed to fetch leaderboard';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleStaffClick = (staffId: string) => {
        router.push(`/staff-statistics?staffId=${staffId}`);
    };

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Crown className="h-8 w-8 text-yellow-500" />;
        if (rank === 2) return <Medal className="h-8 w-8 text-slate-400" />;
        if (rank === 3) return <Award className="h-8 w-8 text-amber-700" />;
        return <Trophy className="h-6 w-6 text-slate-400" />;
    };

    const getRankBadgeColor = (rank: number) => {
        if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
        if (rank === 2) return 'bg-gradient-to-r from-slate-300 to-slate-500 text-white';
        if (rank === 3) return 'bg-gradient-to-r from-amber-600 to-amber-800 text-white';
        return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
    };

    if (!isHydrated || !authorized || loading) {
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

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between"
                >
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                            Staff Leaderboard
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Top performers ranked by completed contacts
                        </p>
                    </div>
                    <Trophy className="h-10 w-10 text-yellow-600" />
                </motion.div>

                {/* Top 3 Podium */}
                {rankings.length >= 3 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="grid grid-cols-3 gap-4 mb-8"
                    >
                        {/* Second Place */}
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col items-center"
                        >
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-slate-300 to-slate-500 flex items-center justify-center mb-3 shadow-lg">
                                    <span className="text-3xl font-bold text-white">2</span>
                                </div>
                                <Medal className="absolute -top-2 -right-2 h-8 w-8 text-slate-400" />
                            </div>
                            <div
                                className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 w-full text-center cursor-pointer hover:shadow-xl transition-shadow border-2 border-slate-300 dark:border-slate-600"
                                onClick={() => handleStaffClick(rankings[1].staffId)}
                            >
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">
                                    {rankings[1].staffName}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                                    {rankings[1].staffEmail}
                                </p>
                                <div className="mt-3 text-2xl font-bold text-slate-600 dark:text-slate-300">
                                    {rankings[1].completed}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Completed
                                </p>
                            </div>
                        </motion.div>

                        {/* First Place */}
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-col items-center -mt-8"
                        >
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center mb-3 shadow-2xl">
                                    <span className="text-4xl font-bold text-white">1</span>
                                </div>
                                <Crown className="absolute -top-4 left-1/2 transform -translate-x-1/2 h-10 w-10 text-yellow-500" />
                            </div>
                            <div
                                className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full text-center cursor-pointer hover:shadow-3xl transition-shadow border-4 border-yellow-400 dark:border-yellow-600"
                                onClick={() => handleStaffClick(rankings[0].staffId)}
                            >
                                <h3 className="font-bold text-xl text-slate-900 dark:text-white truncate">
                                    {rankings[0].staffName}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                                    {rankings[0].staffEmail}
                                </p>
                                <div className="mt-4 text-3xl font-bold text-yellow-600 dark:text-yellow-500">
                                    {rankings[0].completed}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Completed
                                </p>
                            </div>
                        </motion.div>

                        {/* Third Place */}
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="flex flex-col items-center"
                        >
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-amber-600 to-amber-800 flex items-center justify-center mb-3 shadow-lg">
                                    <span className="text-3xl font-bold text-white">3</span>
                                </div>
                                <Award className="absolute -top-2 -right-2 h-8 w-8 text-amber-700" />
                            </div>
                            <div
                                className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 w-full text-center cursor-pointer hover:shadow-xl transition-shadow border-2 border-amber-600 dark:border-amber-700"
                                onClick={() => handleStaffClick(rankings[2].staffId)}
                            >
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">
                                    {rankings[2].staffName}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                                    {rankings[2].staffEmail}
                                </p>
                                <div className="mt-3 text-2xl font-bold text-amber-700 dark:text-amber-600">
                                    {rankings[2].completed}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Completed
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Rest of Rankings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-blue-100 dark:border-blue-900 overflow-hidden"
                >
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                            All Rankings
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Rank
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Staff Member
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Total Assigned
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Completed
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Pending
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Completion Rate
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                {rankings.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                            No staff data available
                                        </td>
                                    </tr>
                                ) : (
                                    rankings.map((staff, index) => (
                                        <motion.tr
                                            key={staff.staffId}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.6 + index * 0.05 }}
                                            className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                                            onClick={() => handleStaffClick(staff.staffId)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <span className={`flex items-center justify-center w-10 h-10 rounded-full ${getRankBadgeColor(index + 1)} font-bold`}>
                                                        {index + 1}
                                                    </span>
                                                    {index < 3 && (
                                                        <div className="ml-2">
                                                            {getRankIcon(index + 1)}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div>
                                                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                                                            {staff.staffName}
                                                        </div>
                                                        <div className="text-sm text-slate-500 dark:text-slate-400">
                                                            {staff.staffEmail}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {staff.total}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                                        {staff.completed}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                                                    {staff.pending}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-1 max-w-xs">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                                                {staff.completionRate}%
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                                            <div
                                                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                                                                style={{ width: `${staff.completionRate}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <TrendingUp className="ml-3 h-5 w-5 text-blue-500" />
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </Layout>
    );
}
