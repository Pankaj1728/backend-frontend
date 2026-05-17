'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { Bell, X, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Notification {
    _id: string;
    senderName: string;
    senderProfilePic?: string;
    type: string;
    message: string;
    postId?: string;
    isRead: boolean;
    createdAt: string;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async (retryCount = 0) => {
        try {
            const response = await api.get('/notifications');
            setNotifications(response.data.notifications || []);
            setUnreadCount(response.data.unreadCount || 0);
        } catch (error: any) {
            if (retryCount < 1 && error?.code === 'ERR_NETWORK') {
                await new Promise(resolve => setTimeout(resolve, 2000));
                return fetchNotifications(retryCount + 1);
            }
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            fetchNotifications();
        } catch (error) { }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            fetchNotifications();
        } catch (error) { }
    };

    const handleNotificationClick = (notification: Notification) => {
        markAsRead(notification._id);
        setShowDropdown(false);
        if (notification.postId) {
            router.push('/dashboard');
        }
    };

    const getRelativeTime = (date: string) => {
        const now = new Date();
        const notifDate = new Date(date);
        const diffInSeconds = Math.floor((now.getTime() - notifDate.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return notifDate.toLocaleDateString();
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
                <Bell size={20} className="text-slate-600 dark:text-slate-400" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {showDropdown && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowDropdown(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-96 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-20 max-h-[500px] overflow-hidden flex flex-col"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                                <h3 className="font-semibold text-slate-900 dark:text-white">
                                    Notifications
                                </h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                    >
                                        <Check size={14} />
                                        Mark all as read
                                    </button>
                                )}
                            </div>

                            <div className="overflow-y-auto flex-1">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                                        <Bell size={48} className="mx-auto mb-2 opacity-30" />
                                        <p>No notifications yet</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                                        {notifications.map((notification) => (
                                            <div
                                                key={notification._id}
                                                onClick={() => handleNotificationClick(notification)}
                                                className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors ${!notification.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    {notification.senderProfilePic ? (
                                                        <img
                                                            src={`http://localhost:3000/uploads/${notification.senderProfilePic}`}
                                                            alt={notification.senderName}
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                                                            {notification.senderName.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-slate-900 dark:text-white">
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                            {getRelativeTime(notification.createdAt)}
                                                        </p>
                                                    </div>
                                                    {!notification.isRead && (
                                                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
