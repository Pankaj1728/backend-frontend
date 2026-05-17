'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { useAuthStore } from '@/lib/auth';
import api from '@/lib/api';
import { Phone, X, Check, Clock, PhoneOff, HelpCircle, AlertCircle, PhoneIncoming } from 'lucide-react';
import toast from 'react-hot-toast';

interface PhoneNumber {
    _id: string;
    phoneNumber: string;
    createdAt: string;
}

interface CompletedPhone {
    _id: string;
    phoneNumber: string;
    callResult: string;
    remarks?: string;
    completedAt: string;
}

const callOptions = [
    { value: 'not_interested', label: 'User Not Interested', icon: X, color: 'red' },
    { value: 'no_pickup', label: 'Did Not Pick Call', icon: PhoneOff, color: 'orange' },
    { value: 'not_understood', label: 'Not Understood', icon: HelpCircle, color: 'yellow' },
    { value: 'callback_later', label: 'Callback Later', icon: Clock, color: 'blue' },
    { value: 'interested', label: 'User Interested', icon: Check, color: 'green' },
    { value: 'wrong_number', label: 'Wrong Number', icon: AlertCircle, color: 'purple' },
    { value: 'other', label: 'Other', icon: PhoneIncoming, color: 'gray' },
];

export default function CallsPage() {
    const { user, isHydrated } = useAuthStore();
    const router = useRouter();
    const [currentPhone, setCurrentPhone] = useState<PhoneNumber | null>(null);
    const [completedPhones, setCompletedPhones] = useState<CompletedPhone[]>([]);
    const [showPopup, setShowPopup] = useState(false);
    const [showInterestedModal, setShowInterestedModal] = useState(false);
    const [selectedResult, setSelectedResult] = useState('');
    const [remarks, setRemarks] = useState('');
    const [interestedUserName, setInterestedUserName] = useState('');
    const [interestedUserEmail, setInterestedUserEmail] = useState('');
    const [interestedUserState, setInterestedUserState] = useState('');
    const [interestedUserPincode, setInterestedUserPincode] = useState('');
    const [interestedUserInfo, setInterestedUserInfo] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [authorized, setAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isHydrated) return;
        if (!user) {
            router.push('/');
            return;
        }
        if (user.role !== 'staff') {
            router.push('/dashboard');
            return;
        }
        setAuthorized(true);
        fetchPhoneNumbers();
    }, [user, router, isHydrated]);

    const fetchPhoneNumbers = async (retryCount = 0) => {
        try {
            setLoading(true);
            const [pendingRes, completedRes] = await Promise.all([
                api.get('/phones/pending'),
                api.get('/phones/completed'),
            ]);

            const pending = pendingRes.data.phoneNumbers || [];
            if (pending.length > 0) {
                setCurrentPhone(pending[0]);
            } else {
                setCurrentPhone(null);
            }

            setCompletedPhones(completedRes.data.phoneNumbers || []);
        } catch (error: any) {
            if (retryCount < 1 && error?.code === 'ERR_NETWORK') {
                await new Promise(resolve => setTimeout(resolve, 2000));
                return fetchPhoneNumbers(retryCount + 1);
            }
            const errorMsg = error?.code === 'ERR_RATE_LIMIT' ? error.message : 'Failed to fetch phone numbers';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handlePhoneClick = () => {
        if (currentPhone) {
            setShowPopup(true);
        }
    };

    const handleSubmit = async () => {
        if (!selectedResult) {
            toast.error('Please select a call result');
            return;
        }

        // If interested, show the interested user details modal
        if (selectedResult === 'interested') {
            setShowPopup(false);
            setShowInterestedModal(true);
            return;
        }

        setSubmitting(true);

        try {
            await api.put(`/phones/${currentPhone!._id}/complete`, {
                callResult: selectedResult,
                remarks,
            });

            toast.success('Phone number marked as completed');
            setShowPopup(false);
            setSelectedResult('');
            setRemarks('');
            fetchPhoneNumbers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to mark as completed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleInterestedSubmit = async () => {
        if (!interestedUserName || !interestedUserEmail || !interestedUserState || !interestedUserPincode) {
            toast.error('Please fill all required fields');
            return;
        }

        setSubmitting(true);

        try {
            await api.put(`/phones/${currentPhone!._id}/complete`, {
                callResult: 'interested',
                remarks,
                interestedUserName,
                interestedUserEmail,
                interestedUserState,
                interestedUserPincode,
                interestedUserInfo,
            });

            toast.success('Interested user details saved successfully');
            setShowInterestedModal(false);
            setSelectedResult('');
            setRemarks('');
            setInterestedUserName('');
            setInterestedUserEmail('');
            setInterestedUserState('');
            setInterestedUserPincode('');
            setInterestedUserInfo('');
            fetchPhoneNumbers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save details');
        } finally {
            setSubmitting(false);
        }
    };

    const getCallResultDetails = (result: string) => {
        return callOptions.find(opt => opt.value === result) || callOptions[callOptions.length - 1];
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
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Call Management</h1>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Manage your assigned phone numbers</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Side - Current Phone Number */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 flex flex-col items-center justify-center min-h-[400px]"
                    >
                        {currentPhone ? (
                            <>
                                <Phone className="h-16 w-16 text-blue-600 mb-6" />
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                                    Next Number to Call
                                </h2>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handlePhoneClick}
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-6 rounded-2xl text-3xl font-bold shadow-xl hover:shadow-2xl transition-shadow"
                                >
                                    {currentPhone.phoneNumber}
                                </motion.button>
                                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                                    Click the number to mark the call status
                                </p>
                            </>
                        ) : (
                            <div className="text-center">
                                <Check className="h-16 w-16 text-green-600 mx-auto mb-4" />
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                    All Caught Up!
                                </h2>
                                <p className="text-slate-600 dark:text-slate-400">
                                    No pending phone numbers to call. Great job! 🎉
                                </p>
                            </div>
                        )}
                    </motion.div>

                    {/* Right Side - Completed Calls Table */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6"
                    >
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                            Completed Calls ({completedPhones.length})
                        </h2>

                        <div className="overflow-y-auto max-h-[500px]">
                            {completedPhones.length === 0 ? (
                                <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                                    No completed calls yet
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {completedPhones.map((phone, index) => {
                                        const resultDetails = getCallResultDetails(phone.callResult);
                                        const Icon = resultDetails.icon;
                                        return (
                                            <motion.div
                                                key={phone._id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center space-x-3 flex-1">
                                                        <Icon className={`h-5 w-5 text-${resultDetails.color}-600`} />
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-slate-900 dark:text-white">
                                                                {phone.phoneNumber}
                                                            </p>
                                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                                {resultDetails.label}
                                                            </p>
                                                            {phone.remarks && (
                                                                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                                                    {phone.remarks}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                                        {new Date(phone.completedAt).toLocaleString()}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            {/* Popup Modal */}
            <AnimatePresence>
                {showPopup && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => !submitting && setShowPopup(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                    Call Result
                                </h3>
                                <button
                                    onClick={() => !submitting && setShowPopup(false)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="mb-6">
                                <p className="text-center text-2xl font-bold text-blue-600 mb-4">
                                    {currentPhone?.phoneNumber}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                                    Select the call outcome:
                                </p>
                            </div>

                            <div className="space-y-2 mb-6">
                                {callOptions.map((option) => {
                                    const Icon = option.icon;
                                    return (
                                        <button
                                            key={option.value}
                                            onClick={() => setSelectedResult(option.value)}
                                            className={`w-full flex items-center space-x-3 p-3 rounded-lg border-2 transition-all ${selectedResult === option.value
                                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                                                }`}
                                        >
                                            <Icon className={`h-5 w-5 text-${option.color}-600`} />
                                            <span className="text-slate-900 dark:text-white font-medium">
                                                {option.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Remarks (Optional)
                                </label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white resize-none"
                                    placeholder="Add any additional notes..."
                                />
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => !submitting && setShowPopup(false)}
                                    disabled={submitting}
                                    className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!selectedResult || submitting}
                                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                                >
                                    {submitting ? 'Submitting...' : 'Submit'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Interested User Details Modal */}
            <AnimatePresence>
                {showInterestedModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => !submitting && setShowInterestedModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                    Interested User Details
                                </h3>
                                <button
                                    onClick={() => !submitting && setShowInterestedModal(false)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="mb-4">
                                <p className="text-center text-2xl font-bold text-green-600 mb-4">
                                    {currentPhone?.phoneNumber}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                                    Please provide interested user details:
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={interestedUserName}
                                        onChange={(e) => setInterestedUserName(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                                        placeholder="Enter user's name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={interestedUserEmail}
                                        onChange={(e) => setInterestedUserEmail(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                                        placeholder="Enter user's email"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        State <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={interestedUserState}
                                        onChange={(e) => setInterestedUserState(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                                        placeholder="Enter state"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Pincode <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={interestedUserPincode}
                                        onChange={(e) => setInterestedUserPincode(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                                        placeholder="Enter pincode"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Other Information
                                    </label>
                                    <textarea
                                        value={interestedUserInfo}
                                        onChange={(e) => setInterestedUserInfo(e.target.value)}
                                        rows={4}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white resize-none"
                                        placeholder="Add any additional information..."
                                    />
                                </div>
                            </div>

                            <div className="flex space-x-3 mt-6">
                                <button
                                    onClick={() => !submitting && setShowInterestedModal(false)}
                                    disabled={submitting}
                                    className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleInterestedSubmit}
                                    disabled={submitting}
                                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                                >
                                    {submitting ? 'Saving...' : 'Save Details'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Layout>
    );
}
