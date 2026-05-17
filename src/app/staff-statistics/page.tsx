'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/lib/auth';
import api from '@/lib/api';
import { Layout } from '@/components/Layout';
import { BarChart3, Users, CheckCircle, Clock, TrendingUp, Phone, User, Calendar, List, Trash2, RotateCcw } from 'lucide-react';

interface StaffStats {
    staffId: string;
    staffName: string;
    staffEmail: string;
    total: number;
    completed: number;
    pending: number;
    completionRate: string;
}

interface DetailedStats {
    total: number;
    completed: number;
    pending: number;
    completionRate: string;
}

interface PhoneContact {
    _id: string;
    phoneNumber: string;
    status: string;
    callResult?: string;
    remarks?: string;
    completedAt?: string;
    createdAt: string;
}

interface AssignmentHistory {
    date: string;
    count: number;
}

interface DetailedData {
    completedContacts: PhoneContact[];
    pendingContacts: PhoneContact[];
    assignmentHistory: AssignmentHistory[];
    summary: {
        totalCompleted: number;
        totalPending: number;
    };
}

const callResultLabels: Record<string, string> = {
    not_interested: 'Not Interested',
    no_pickup: 'No Pickup',
    not_understood: 'Not Understood',
    callback_later: 'Callback Later',
    interested: 'Interested',
    wrong_number: 'Wrong Number',
    other: 'Other',
};

export default function StaffStatistics() {
    const router = useRouter();
    const { user, isHydrated } = useAuthStore();
    const [authorized, setAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);
    const [allStaffStats, setAllStaffStats] = useState<StaffStats[]>([]);
    const [selectedStaffId, setSelectedStaffId] = useState<string>('');
    const [selectedStaffStats, setSelectedStaffStats] = useState<DetailedStats | null>(null);
    const [detailedData, setDetailedData] = useState<DetailedData | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'completed' | 'pending' | 'assignments'>('completed');

    useEffect(() => {
        if (!isHydrated) return;

        if (!user || user.role !== 'admin') {
            router.push('/dashboard');
            return;
        }

        setAuthorized(true);
        fetchAllStaffStatistics();

        // Check for staffId in URL query params
        const urlParams = new URLSearchParams(window.location.search);
        const staffIdFromUrl = urlParams.get('staffId');
        if (staffIdFromUrl) {
            setSelectedStaffId(staffIdFromUrl);
            // Fetch will be triggered by the state change
        }
    }, [user, router, isHydrated]);

    // Auto-fetch when selectedStaffId changes
    useEffect(() => {
        if (selectedStaffId && authorized) {
            fetchStaffDetails(selectedStaffId);
        }
    }, [selectedStaffId, authorized]);

    const fetchAllStaffStatistics = async (retryCount = 0) => {
        try {
            setLoading(true);
            const params: any = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const response = await api.get('/phones/statistics', { params });
            setAllStaffStats(response.data.statistics || []);
        } catch (error: any) {
            if (retryCount < 1 && error?.code === 'ERR_NETWORK') {
                await new Promise(resolve => setTimeout(resolve, 2000));
                return fetchAllStaffStatistics(retryCount + 1);
            }
            const errorMsg = error?.code === 'ERR_RATE_LIMIT' ? error.message : 'Failed to fetch staff statistics';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const fetchStaffDetails = async (staffId: string, retryCount = 0) => {
        try {
            setLoadingDetails(true);
            const params: any = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            // Fetch basic stats
            const statsResponse = await api.get(`/phones/statistics/${staffId}`, { params });
            setSelectedStaffStats(statsResponse.data);

            // Fetch detailed data
            const detailedResponse = await api.get(`/phones/detailed/${staffId}`, { params });
            setDetailedData(detailedResponse.data);
        } catch (error: any) {
            if (retryCount < 1 && error?.code === 'ERR_NETWORK') {
                await new Promise(resolve => setTimeout(resolve, 2000));
                return fetchStaffDetails(staffId, retryCount + 1);
            }
            const errorMsg = error?.code === 'ERR_RATE_LIMIT' ? error.message : 'Failed to fetch staff details';
            toast.error(errorMsg);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleRemoveCompleted = async (contactId: string) => {
        if (!confirm('Are you sure you want to move this contact back to pending? This will remove all completion data.')) {
            return;
        }

        try {
            await api.delete(`/phones/${contactId}/remove`);
            toast.success('Contact moved back to pending queue');

            // Refresh data
            if (selectedStaffId) {
                fetchStaffDetails(selectedStaffId);
                fetchAllStaffStatistics();
            }
        } catch (error) {
            toast.error('Failed to remove completed contact');
        }
    };

    const handleStaffSelect = (staffId: string) => {
        setSelectedStaffId(staffId);
        if (staffId) {
            fetchStaffDetails(staffId);
        } else {
            setSelectedStaffStats(null);
            setDetailedData(null);
        }
    };

    const handleApplyFilter = () => {
        fetchAllStaffStatistics();
        if (selectedStaffId) {
            fetchStaffDetails(selectedStaffId);
        }
    };

    const handleClearFilter = () => {
        setStartDate('');
        setEndDate('');
        // Refetch without dates
        setTimeout(() => {
            fetchAllStaffStatistics();
            if (selectedStaffId) {
                fetchStaffDetails(selectedStaffId);
            }
        }, 100);
    };

    const getSelectedStaffInfo = () => {
        return allStaffStats.find(staff => staff.staffId === selectedStaffId);
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

    const selectedStaffInfo = getSelectedStaffInfo();

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
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Staff Statistics
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            View detailed phone assignment statistics for each staff member
                        </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                </motion.div>

                {/* Date Filter */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-blue-100 dark:border-blue-900"
                >
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                        Date Range Filter
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all"
                            />
                        </div>
                        <div className="flex items-end gap-2">
                            <button
                                onClick={handleApplyFilter}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                            >
                                Apply Filter
                            </button>
                            <button
                                onClick={handleClearFilter}
                                className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Staff Selection */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-blue-100 dark:border-blue-900"
                >
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        <User className="inline h-4 w-4 mr-2" />
                        Select Staff Member
                    </label>
                    <select
                        value={selectedStaffId}
                        onChange={(e) => handleStaffSelect(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all"
                    >
                        <option value="">-- Select a staff member --</option>
                        {allStaffStats.map(staff => (
                            <option key={staff.staffId} value={staff.staffId}>
                                {staff.staffName} ({staff.staffEmail})
                            </option>
                        ))}
                    </select>
                </motion.div>

                {/* Statistics Overview */}
                {selectedStaffId && selectedStaffStats && selectedStaffInfo && (
                    <div className="space-y-6">
                        {/* Staff Info Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">{selectedStaffInfo.staffName}</h2>
                                    <p className="text-blue-100 mt-1">{selectedStaffInfo.staffEmail}</p>
                                </div>
                                <div className="bg-white/20 rounded-full p-4">
                                    <Users className="h-8 w-8" />
                                </div>
                            </div>
                        </motion.div>

                        {/* Stats Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Total Assigned */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-blue-100 dark:border-blue-900"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3">
                                        <Phone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </div>
                                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                    Total Assigned
                                </h3>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                    {selectedStaffStats.total}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                    Phone numbers assigned
                                </p>
                            </motion.div>

                            {/* Completed */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-green-100 dark:border-green-900"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-3">
                                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                                    </div>
                                </div>
                                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                    Completed
                                </h3>
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                                    {selectedStaffStats.completed}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                    Calls completed
                                </p>
                            </motion.div>

                            {/* Pending */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-orange-100 dark:border-orange-900"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="bg-orange-100 dark:bg-orange-900/30 rounded-full p-3">
                                        <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                    </div>
                                </div>
                                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                    Pending
                                </h3>
                                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                                    {selectedStaffStats.pending}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                    Awaiting completion
                                </p>
                            </motion.div>

                            {/* Completion Rate */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-purple-100 dark:border-purple-900"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-3">
                                        <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                </div>
                                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                    Completion Rate
                                </h3>
                                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                                    {selectedStaffStats.completionRate}%
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                    Overall performance
                                </p>
                            </motion.div>
                        </div>

                        {/* Progress Bar */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-blue-100 dark:border-blue-900"
                        >
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                Progress Overview
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
                                        <span>Completed</span>
                                        <span>{selectedStaffStats.completed} / {selectedStaffStats.total}</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${selectedStaffStats.completionRate}%` }}
                                            transition={{ duration: 1, delay: 0.8 }}
                                            className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
                                        <span>Pending</span>
                                        <span>{selectedStaffStats.pending} / {selectedStaffStats.total}</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{
                                                width: `${selectedStaffStats.total > 0
                                                    ? ((selectedStaffStats.pending / selectedStaffStats.total) * 100).toFixed(2)
                                                    : 0}%`
                                            }}
                                            transition={{ duration: 1, delay: 0.9 }}
                                            className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Detailed Data Tabs */}
                        {detailedData && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                                className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-blue-100 dark:border-blue-900 overflow-hidden"
                            >
                                {/* Tabs Header */}
                                <div className="flex border-b border-slate-200 dark:border-slate-700">
                                    <button
                                        onClick={() => setActiveTab('completed')}
                                        className={`flex-1 px-6 py-4 font-medium transition-colors ${activeTab === 'completed'
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                            }`}
                                    >
                                        <CheckCircle className="inline h-5 w-5 mr-2" />
                                        Completed Contacts ({detailedData.completedContacts.length})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('pending')}
                                        className={`flex-1 px-6 py-4 font-medium transition-colors ${activeTab === 'pending'
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                            }`}
                                    >
                                        <Clock className="inline h-5 w-5 mr-2" />
                                        Pending Contacts ({detailedData.pendingContacts.length})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('assignments')}
                                        className={`flex-1 px-6 py-4 font-medium transition-colors ${activeTab === 'assignments'
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                            }`}
                                    >
                                        <Calendar className="inline h-5 w-5 mr-2" />
                                        Assignment History
                                    </button>
                                </div>

                                {/* Tab Content */}
                                <div className="p-6">
                                    {/* Completed Contacts Tab */}
                                    {activeTab === 'completed' && (
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                                Completed Contacts
                                            </h3>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                                Phone Number
                                                            </th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                                Call Result
                                                            </th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                                Remarks
                                                            </th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                                Completed At
                                                            </th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                                Actions
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                                        {detailedData.completedContacts.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                                                                    No completed contacts found
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            detailedData.completedContacts.map((contact) => (
                                                                <tr key={contact._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                                                                        {contact.phoneNumber}
                                                                    </td>
                                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                                        <span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs">
                                                                            {contact.callResult ? callResultLabels[contact.callResult] || contact.callResult : 'N/A'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                                                                        {contact.remarks || '-'}
                                                                    </td>
                                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                                                                        {contact.completedAt ? new Date(contact.completedAt).toLocaleString() : '-'}
                                                                    </td>
                                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                                        <button
                                                                            onClick={() => handleRemoveCompleted(contact._id)}
                                                                            className="flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg transition-colors"
                                                                            title="Move back to pending"
                                                                        >
                                                                            <RotateCcw className="h-4 w-4" />
                                                                            <span className="text-xs font-medium">Undo</span>
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Pending Contacts Tab */}
                                    {activeTab === 'pending' && (
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                                Pending Contacts
                                            </h3>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                                Phone Number
                                                            </th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                                Assigned On
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                                        {detailedData.pendingContacts.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={2} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                                                                    No pending contacts found
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            detailedData.pendingContacts.map((contact) => (
                                                                <tr key={contact._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                                                                        {contact.phoneNumber}
                                                                    </td>
                                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                                                                        {new Date(contact.createdAt).toLocaleString()}
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Assignment History Tab */}
                                    {activeTab === 'assignments' && (
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                                Daily Assignment History
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {detailedData.assignmentHistory.length === 0 ? (
                                                    <div className="col-span-full text-center py-8 text-slate-500 dark:text-slate-400">
                                                        No assignment history found
                                                    </div>
                                                ) : (
                                                    detailedData.assignmentHistory.map((assignment, index) => (
                                                        <motion.div
                                                            key={index}
                                                            initial={{ opacity: 0, scale: 0.9 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{ delay: index * 0.05 }}
                                                            className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                                                        {new Date(assignment.date).toLocaleDateString('en-US', {
                                                                            weekday: 'short',
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                            year: 'numeric'
                                                                        })}
                                                                    </p>
                                                                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                                                        {assignment.count}
                                                                    </p>
                                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                                        contacts assigned
                                                                    </p>
                                                                </div>
                                                                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3">
                                                                    <Phone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {!selectedStaffId && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-12 text-center border border-blue-100 dark:border-blue-900"
                    >
                        <BarChart3 className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Select a Staff Member
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400">
                            Choose a staff member from the dropdown above to view their detailed statistics
                        </p>
                    </motion.div>
                )}

                {/* Loading State for Details */}
                {loadingDetails && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-center py-12"
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
                        />
                    </motion.div>
                )}
            </div>
        </Layout>
    );
}
