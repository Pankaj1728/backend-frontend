'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { useAuthStore } from '@/lib/auth';
import api from '@/lib/api';
import { Upload, Users, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

interface Staff {
    _id: string;
    name: string;
    email: string;
}

export default function UploadPhonePage() {
    const { user, isHydrated } = useAuthStore();
    const router = useRouter();
    const [staff, setStaff] = useState<Staff[]>([]);
    const [selectedStaff, setSelectedStaff] = useState('');
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [authorized, setAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);
    const [manualPhone, setManualPhone] = useState('');
    const [manualStaff, setManualStaff] = useState('');
    const [addingManual, setAddingManual] = useState(false);

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
        fetchStaff();
    }, [user, router, isHydrated]);

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
                toast.error('Please select a CSV file');
                return;
            }
            setCsvFile(file);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedStaff) {
            toast.error('Please select a staff member');
            return;
        }

        if (!csvFile) {
            toast.error('Please select a CSV file');
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('staffId', selectedStaff);
            formData.append('csvFile', csvFile);

            const response = await api.post('/phones/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            toast.success(`${response.data.newNumbers} phone numbers uploaded successfully!`);
            if (response.data.duplicates > 0) {
                toast(`${response.data.duplicates} duplicates were skipped`, { icon: 'ℹ️' });
            }

            // Reset form
            setSelectedStaff('');
            setCsvFile(null);
            const fileInput = document.getElementById('csvFile') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to upload phone numbers');
        } finally {
            setUploading(false);
        }
    };

    const handleManualAdd = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!manualStaff) {
            toast.error('Please select a staff member');
            return;
        }

        if (!manualPhone.trim()) {
            toast.error('Please enter a phone number');
            return;
        }

        setAddingManual(true);

        try {
            await api.post('/phones', {
                staffId: manualStaff,
                phoneNumber: manualPhone.trim()
            });

            toast.success('Phone number added successfully!');
            setManualPhone('');
            setManualStaff('');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to add phone number');
        } finally {
            setAddingManual(false);
        }
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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Upload Phone Numbers</h1>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Upload CSV file with phone numbers and assign to staff</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Manual Entry Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6"
                    >
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                            <Users className="mr-2 h-5 w-5 text-green-600" />
                            Add Single Number
                        </h2>

                        <form onSubmit={handleManualAdd} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Phone Number *
                                </label>
                                <input
                                    type="text"
                                    value={manualPhone}
                                    onChange={(e) => setManualPhone(e.target.value)}
                                    placeholder="Enter phone number"
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-slate-700 dark:text-white"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Assign to Staff *
                                </label>
                                <select
                                    value={manualStaff}
                                    onChange={(e) => setManualStaff(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-slate-700 dark:text-white"
                                    required
                                >
                                    <option value="">Choose staff...</option>
                                    {staff.map((s) => (
                                        <option key={s._id} value={s._id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={addingManual}
                                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {addingManual ? (
                                    <>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                                        />
                                        Adding...
                                    </>
                                ) : (
                                    <>
                                        <Users className="mr-2 h-5 w-5" />
                                        Add Number
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>

                    {/* Upload Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6"
                    >
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                            <Upload className="mr-2 h-5 w-5 text-blue-600" />
                            Upload CSV File
                        </h2>

                        <form onSubmit={handleUpload} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Select Staff Member *
                                </label>
                                <select
                                    value={selectedStaff}
                                    onChange={(e) => setSelectedStaff(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                                    required
                                >
                                    <option value="">Choose a staff member...</option>
                                    {staff.map((s) => (
                                        <option key={s._id} value={s._id}>
                                            {s.name} ({s.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    CSV File *
                                </label>
                                <input
                                    id="csvFile"
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-600 dark:file:text-blue-400"
                                    required
                                />
                                {csvFile && (
                                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                        Selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(2)} KB)
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={uploading}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {uploading ? (
                                    <>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                                        />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-5 w-5" />
                                        Upload Phone Numbers
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>

                    {/* Instructions */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 rounded-xl shadow-lg p-6"
                    >
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                            <FileText className="mr-2 h-5 w-5 text-purple-600" />
                            CSV File Instructions
                        </h2>

                        <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
                            <div>
                                <h3 className="font-semibold mb-2">📋 File Format</h3>
                                <p>Your CSV file should contain phone numbers. The column header can be named:</p>
                                <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                                    <li><code className="bg-white dark:bg-slate-600 px-1 py-0.5 rounded">phone</code></li>
                                    <li><code className="bg-white dark:bg-slate-600 px-1 py-0.5 rounded">mobile</code></li>
                                    <li><code className="bg-white dark:bg-slate-600 px-1 py-0.5 rounded">phoneNumber</code></li>
                                    <li><code className="bg-white dark:bg-slate-600 px-1 py-0.5 rounded">number</code></li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">📝 Example CSV</h3>
                                <div className="bg-white dark:bg-slate-600 rounded-lg p-3 font-mono text-xs">
                                    phone<br />
                                    9876543210<br />
                                    +919876543211<br />
                                    9876543212
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">✨ Features</h3>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Automatically removes duplicates</li>
                                    <li>Skips already assigned numbers</li>
                                    <li>Supports thousands of numbers</li>
                                    <li>Cleans phone number formatting</li>
                                </ul>
                            </div>

                            <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3">
                                <p className="text-yellow-800 dark:text-yellow-200 font-semibold">⚠️ Note</p>
                                <p className="text-yellow-700 dark:text-yellow-300 text-xs mt-1">
                                    Maximum file size: 10MB. All phone numbers will be assigned to the selected staff member.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </Layout>
    );
}
