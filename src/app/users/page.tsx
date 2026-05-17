'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { useAuthStore } from '@/lib/auth';
import api from '@/lib/api';
import { UserPlus, Search, Mail, Phone, MapPin, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
    _id: string;
    name: string;
    email: string;
    mobile?: string;
    city?: string;
    state?: string;
    country?: string;
    role: string;
}

export default function UsersPage() {
    const { user, isHydrated } = useAuthStore();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = async (retryCount = 0) => {
        try {
            setLoading(true);
            const response = await api.get('/users/users');
            if (user?.role === 'staff') {
                setUsers(response.data.users || []);
            } else if (user?.role === 'admin') {
                setUsers(response.data.users || []);
            }
        } catch (error: any) {
            if (retryCount < 1 && error?.code === 'ERR_NETWORK') {
                await new Promise(resolve => setTimeout(resolve, 2000));
                return fetchUsers(retryCount + 1);
            }
            const errorMsg = error?.code === 'ERR_RATE_LIMIT' ? error.message : 'Failed to fetch users';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}?`)) {
            return;
        }

        try {
            await api.delete(`/users/user/${id}`);
            toast.success('User deleted successfully');
            fetchUsers();
        } catch (error) {
            toast.error('Failed to delete user');
        }
    };

    useEffect(() => {
        if (!isHydrated) return;
        if (!user) {
            router.push('/');
            return;
        }
        if (user.role !== 'admin' && user.role !== 'staff') {
            router.push('/dashboard');
            return;
        }
        setAuthorized(true);
        const timer = setTimeout(() => fetchUsers(), 200);
        return () => clearTimeout(timer);
    }, [user, router, isHydrated]);

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

    const filteredUsers = users.filter((u) =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Layout>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            {user?.role === 'admin' ? 'All Users' : 'My Users'}
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                            {user?.role === 'admin' ? 'Manage all users in the system' : 'Users assigned to you'}
                        </p>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Mobile</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Location</th>
                                    {user?.role === 'admin' && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {filteredUsers.map((u, index) => (
                                    <motion.tr
                                        key={u._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                                                    <span className="text-purple-600 dark:text-purple-400 font-medium text-sm">
                                                        {u.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="ml-3">
                                                    <div className="text-sm font-medium text-slate-900 dark:text-white">{u.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                                                <Mail className="h-4 w-4 mr-2 text-slate-400" />
                                                {u.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                                                <Phone className="h-4 w-4 mr-2 text-slate-400" />
                                                {u.mobile || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                                                <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                                                {u.city && u.state ? `${u.city}, ${u.state}` : '-'}
                                            </div>
                                        </td>
                                        {user?.role === 'admin' && (
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => router.push(`/edit-user/${u._id}`)}
                                                        className="inline-flex items-center px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                                                    >
                                                        <Edit className="h-4 w-4 mr-1" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(u._id, u.name)}
                                                        className="inline-flex items-center px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-1" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredUsers.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-slate-500 dark:text-slate-400">No users found</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </Layout>
    );
}