'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { useAuthStore } from '@/lib/auth';
import api from '@/lib/api';
import { Phone, User, Calendar, FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface CompletedPhone {
    _id: string;
    phoneNumber: string;
    callResult: string;
    remarks?: string;
    interestedUserName?: string;
    interestedUserEmail?: string;
    interestedUserState?: string;
    interestedUserPincode?: string;
    interestedUserInfo?: string;
    completedAt: string;
    assignedStaff: {
        _id: string;
        name: string;
        email: string;
        username: string;
    };
}

const callResultLabels: { [key: string]: string } = {
    not_interested: 'Not Interested',
    no_pickup: 'No Pickup',
    not_understood: 'Not Understood',
    callback_later: 'Callback Later',
    interested: 'Interested',
    wrong_number: 'Wrong Number',
    other: 'Other',
};

export default function CompletedCallsPage() {
    const { user, isHydrated } = useAuthStore();
    const router = useRouter();
    const [completedPhones, setCompletedPhones] = useState<CompletedPhone[]>([]);
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterResult, setFilterResult] = useState('all');
    const [filterStaff, setFilterStaff] = useState('all');

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
        fetchCompletedPhones();
    }, [user, router, isHydrated]);

    const fetchCompletedPhones = async (retryCount = 0) => {
        try {
            setLoading(true);
            const response = await api.get('/phones/completed/all');
            setCompletedPhones(response.data.phoneNumbers || []);
        } catch (error: any) {
            if (retryCount < 1 && error?.code === 'ERR_NETWORK') {
                await new Promise(resolve => setTimeout(resolve, 2000));
                return fetchCompletedPhones(retryCount + 1);
            }
            const errorMsg = error?.code === 'ERR_RATE_LIMIT' ? error.message : 'Failed to fetch completed calls';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        const filteredData = getFilteredPhones();

        const csvContent = [
            ['Phone Number', 'Staff Name', 'Call Result', 'Remarks', 'User Name', 'User Email', 'User State', 'User Pincode', 'User Info', 'Completed At'],
            ...filteredData.map(phone => [
                phone.phoneNumber,
                phone.assignedStaff.name,
                callResultLabels[phone.callResult] || phone.callResult,
                phone.remarks || '',
                phone.interestedUserName || '',
                phone.interestedUserEmail || '',
                phone.interestedUserState || '',
                phone.interestedUserPincode || '',
                phone.interestedUserInfo || '',
                new Date(phone.completedAt).toLocaleString(),
            ])
        ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `completed-calls-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        toast.success('CSV downloaded successfully');
    };

    const getFilteredPhones = () => {
        return completedPhones.filter(phone => {
            const matchesSearch =
                phone.phoneNumber.includes(searchTerm) ||
                phone.assignedStaff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                phone.assignedStaff.email.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesResult = filterResult === 'all' || phone.callResult === filterResult;
            const matchesStaff = filterStaff === 'all' || phone.assignedStaff._id === filterStaff;

            return matchesSearch && matchesResult && matchesStaff;
        });
    };

    const uniqueStaff = Array.from(new Set(completedPhones.map(p => p.assignedStaff._id)))
        .map(id => completedPhones.find(p => p.assignedStaff._id === id)!.assignedStaff);

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

    const filteredPhones = getFilteredPhones();

    return (
        <Layout>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Completed Calls</h1>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">View all completed phone calls across staff members</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={exportToCSV}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-lg"
                    >
                        <Download size={18} />
                        <span>Export CSV</span>
                    </motion.button>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Search
                            </label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by phone or staff name..."
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Call Result
                            </label>
                            <select
                                value={filterResult}
                                onChange={(e) => setFilterResult(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                            >
                                <option value="all">All Results</option>
                                {Object.entries(callResultLabels).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Staff Member
                            </label>
                            <select
                                value={filterStaff}
                                onChange={(e) => setFilterStaff(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                            >
                                <option value="all">All Staff</option>
                                {uniqueStaff.map((staff) => (
                                    <option key={staff._id} value={staff._id}>{staff.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results Count */}
                <div className="text-sm text-slate-600 dark:text-slate-400">
                    Showing {filteredPhones.length} of {completedPhones.length} completed calls
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-700">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                        Phone Number
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                        Staff Member
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                        Result
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                        Remarks / User Details
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                        Completed At
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {filteredPhones.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                            No completed calls found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPhones.map((phone, index) => (
                                        <motion.tr
                                            key={phone._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.02 }}
                                            className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-slate-900 dark:text-white">
                                                    <Phone className="h-4 w-4 mr-2 text-blue-600" />
                                                    {phone.phoneNumber}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <User className="h-4 w-4 mr-2 text-slate-400" />
                                                    <div>
                                                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                                                            {phone.assignedStaff.name}
                                                        </div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                                            {phone.assignedStaff.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                                    {callResultLabels[phone.callResult] || phone.callResult}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {phone.callResult === 'interested' ? (
                                                    <div className="text-sm space-y-1 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                                                        <div className="font-semibold text-green-800 dark:text-green-300 mb-2">
                                                            Interested User Details:
                                                        </div>
                                                        {phone.interestedUserName && (
                                                            <div className="text-slate-700 dark:text-slate-300">
                                                                <span className="font-medium">Name:</span> {phone.interestedUserName}
                                                            </div>
                                                        )}
                                                        {phone.interestedUserEmail && (
                                                            <div className="text-slate-700 dark:text-slate-300">
                                                                <span className="font-medium">Email:</span> {phone.interestedUserEmail}
                                                            </div>
                                                        )}
                                                        {phone.interestedUserState && (
                                                            <div className="text-slate-700 dark:text-slate-300">
                                                                <span className="font-medium">State:</span> {phone.interestedUserState}
                                                            </div>
                                                        )}
                                                        {phone.interestedUserPincode && (
                                                            <div className="text-slate-700 dark:text-slate-300">
                                                                <span className="font-medium">Pincode:</span> {phone.interestedUserPincode}
                                                            </div>
                                                        )}
                                                        {phone.interestedUserInfo && (
                                                            <div className="text-slate-700 dark:text-slate-300">
                                                                <span className="font-medium">Info:</span> {phone.interestedUserInfo}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-slate-600 dark:text-slate-300 max-w-xs truncate">
                                                        {phone.remarks || '-'}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                                                    <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                                                    {new Date(phone.completedAt).toLocaleString()}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>
        </Layout>
    );
}
