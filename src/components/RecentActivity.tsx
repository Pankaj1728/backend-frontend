'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import {
    Activity,
    Phone,
    CheckCircle,
    RotateCcw,
    User,
    UserPlus,
    Lock,
    Upload,
    Clock
} from 'lucide-react';

interface ActivityItem {
    _id: string;
    type: string;
    performedByName: string;
    performedByRole: string;
    targetUserName?: string;
    description: string;
    createdAt: string;
    metadata?: any;
}

const activityIcons: Record<string, any> = {
    contact_assigned: Upload,
    contact_completed: CheckCircle,
    contact_undone: RotateCcw,
    profile_updated: User,
    password_changed: Lock,
    user_created: UserPlus,
    staff_created: UserPlus,
    csv_uploaded: Upload,
};

const activityColors: Record<string, string> = {
    contact_assigned: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    contact_completed: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    contact_undone: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
    profile_updated: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
    password_changed: 'text-red-600 bg-red-100 dark:bg-red-900/30',
    user_created: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30',
    staff_created: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30',
    csv_uploaded: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
};

export default function RecentActivity() {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActivities();
        const interval = setInterval(fetchActivities, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchActivities = async (retryCount = 0) => {
        try {
            const response = await api.get('/activities/recent?limit=20');
            setActivities(response.data.activities || []);
        } catch (error: any) {
            if (retryCount < 1 && error?.code === 'ERR_NETWORK') {
                await new Promise(resolve => setTimeout(resolve, 2000));
                return fetchActivities(retryCount + 1);
            }
        } finally {
            setLoading(false);
        }
    };

    const getRelativeTime = (date: string) => {
        const now = new Date();
        const activityDate = new Date(date);
        const diffInSeconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return activityDate.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-blue-100 dark:border-blue-900 p-6">
                <div className="flex items-center justify-center py-12">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-blue-100 dark:border-blue-900">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2">
                            <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                                Recent Activity
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Latest system activities and events
                            </p>
                        </div>
                    </div>
                    <Clock className="h-5 w-5 text-slate-400" />
                </div>
            </div>

            <div className="max-h-[600px] overflow-y-auto">
                {activities.length === 0 ? (
                    <div className="p-12 text-center">
                        <Activity className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-500 dark:text-slate-400">No recent activity</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {activities.map((activity, index) => {
                            const Icon = activityIcons[activity.type] || Activity;
                            const colorClass = activityColors[activity.type] || 'text-slate-600 bg-slate-100';

                            return (
                                <motion.div
                                    key={activity._id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`rounded-lg p-2 ${colorClass}`}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-slate-900 dark:text-white font-medium">
                                                {activity.description}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                <span className="font-medium">
                                                    {activity.performedByName}
                                                </span>
                                                <span>•</span>
                                                <span className="capitalize">{activity.performedByRole}</span>
                                                {activity.targetUserName && (
                                                    <>
                                                        <span>•</span>
                                                        <span>Target: {activity.targetUserName}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                                            {getRelativeTime(activity.createdAt)}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
