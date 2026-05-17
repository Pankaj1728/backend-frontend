'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { useAuthStore } from '@/lib/auth';
import api from '@/lib/api';
import { UserPlus, Search, Mail, Phone, Shield, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Staff {
    _id: string;
    name: string;
    email: string;
    username?: string;
    phone?: string;
    profilePic?: string;
    role: string;
}

export default function StaffPage() {
    const { user, isHydrated } = useAuthStore();
    const router = useRouter();
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchStaff = async (retryCount = 0) => {
        try {
            setLoading(true);
            const response = await api.get('/users/users');
            const staffData = response.data.staff || response.data.users || [];
            setStaff(staffData);
            if (staffData.length === 0) {
                toast('No staff members found', { icon: 'ℹ️' });
            }
        } catch (error: any) {
            if (retryCount < 1 && error?.code === 'ERR_NETWORK') {
                await new Promise(resolve => setTimeout(resolve, 2000));
                return fetchStaff(retryCount + 1);
            }
            const errorMessage = error?.code === 'ERR_RATE_LIMIT' ? error.message : (error.response?.data?.message || 'Failed to fetch staff list');
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteStaff = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}?`)) {
            return;
        }

        try {
            await api.delete(`/users/staff/${id}`);
            toast.success('Staff deleted successfully');
            fetchStaff();
        } catch (error) {
            toast.error('Failed to delete staff');
        }
    };

    useEffect(() => {
        if (!isHydrated) return;
        if (!user) {
            router.push('/');
            return;
        }
        if (user.role !== 'admin') {
            router.push('/dashboard');
            return;
        }
        setAuthorized(true);
        const timer = setTimeout(() => fetchStaff(), 200);
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

    const filteredStaff = staff.filter((s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!authorized || loading) {
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
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Staff Members</h1>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Manage your staff team</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push('/add-staff')}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg"
                    >
                        <UserPlus size={18} />
                        <span>Add Staff</span>
                    </motion.button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search staff by name or email..."
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Username</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Phone</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {filteredStaff.map((s, index) => (
                                    <motion.tr
                                        key={s._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {s.profilePic ? (
                                                    <img
                                                        src={`http://localhost:3000/uploads/${s.profilePic}`}
                                                        alt={s.name}
                                                        className="w-10 h-10 rounded-full object-cover border-2 border-blue-600"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                                        <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">
                                                            {s.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="ml-3">
                                                    <div className="text-sm font-medium text-slate-900 dark:text-white">{s.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                                            {s.username || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                                                <Mail className="h-4 w-4 mr-2 text-slate-400" />
                                                {s.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                                                <Phone className="h-4 w-4 mr-2 text-slate-400" />
                                                {s.phone || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                                <Shield className="h-3 w-3 mr-1" />
                                                {s.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex items-center space-x-3">
                                                <button
                                                    onClick={() => router.push(`/edit-staff/${s._id}`)}
                                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center space-x-1"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                    <span>Edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteStaff(s._id, s.name)}
                                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex items-center space-x-1"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    <span>Delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredStaff.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-slate-500 dark:text-slate-400">No staff members found</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </Layout>
    );
}