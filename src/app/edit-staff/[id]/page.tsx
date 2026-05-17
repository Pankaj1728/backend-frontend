'use client';

import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import Joi from 'joi';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { useAuthStore } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const editStaffSchema = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    name: Joi.string().min(2).max(50).required(),
    phone: Joi.string().pattern(/^(\+91|91)?[6-9]\d{9}$/).required(),
    dateOfBirth: Joi.date().optional().allow(''),
});

interface EditStaffForm {
    username: string;
    email: string;
    name: string;
    phone: string;
    dateOfBirth?: string;
}

export default function EditStaff() {
    const { user, isHydrated } = useAuthStore();
    const { register, handleSubmit, formState: { errors }, setValue } = useForm<EditStaffForm>({
        resolver: joiResolver(editStaffSchema),
    });
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [profilePic, setProfilePic] = useState<File | null>(null);
    const [currentProfilePic, setCurrentProfilePic] = useState<string>('');
    const router = useRouter();
    const params = useParams();
    const staffId = params.id as string;

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
    }, [user, router, isHydrated]);

    useEffect(() => {
        if (!authorized) return;
        const fetchStaffData = async (retryCount = 0) => {
            try {
                const response = await api.get(`/users/staff/${staffId}`);
                const staff = response.data.staff;
                setValue('name', staff.name);
                setValue('username', staff.username);
                setValue('email', staff.email);
                setValue('phone', staff.phone);
                if (staff.dateOfBirth) {
                    setValue('dateOfBirth', new Date(staff.dateOfBirth).toISOString().split('T')[0]);
                }
                setCurrentProfilePic(staff.profilePic || '');
            } catch (error: any) {
                if (retryCount < 1 && error?.code === 'ERR_NETWORK') {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    return fetchStaffData(retryCount + 1);
                }
                const errorMsg = error?.code === 'ERR_RATE_LIMIT' ? error.message : 'Failed to fetch staff data';
                toast.error(errorMsg);
                router.push('/staff');
            } finally {
                setFetchingData(false);
            }
        };
        fetchStaffData();
    }, [authorized, staffId, setValue, router, isHydrated]);

    if (!isHydrated || !authorized || fetchingData) {
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

    const onSubmit = async (data: EditStaffForm) => {
        setLoading(true);
        try {
            const formData = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                formData.append(key, value);
            });
            if (profilePic) {
                formData.append('profilePic', profilePic);
            }

            await api.put(`/users/staff/${staffId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Staff updated successfully');
            router.push('/staff');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update staff');
        } finally {
            setLoading(false);
        }
    };

    if (!authorized || fetchingData) {
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-2xl mx-auto"
            >
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Edit Staff</h1>
                    <p className="text-slate-600 dark:text-slate-300 mt-2">
                        Update staff member information.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Name
                            </label>
                            <input
                                {...register('name')}
                                type="text"
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Username
                            </label>
                            <input
                                {...register('username')}
                                type="text"
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                            />
                            {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Email
                            </label>
                            <input
                                {...register('email')}
                                type="email"
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                            />
                            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Phone (India)
                            </label>
                            <input
                                {...register('phone')}
                                type="text"
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                            />
                            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Date of Birth
                            </label>
                            <input
                                {...register('dateOfBirth')}
                                type="date"
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                            />
                            {errors.dateOfBirth && <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Profile Picture
                            </label>
                            {currentProfilePic && (
                                <div className="mt-2 mb-3">
                                    <img
                                        src={`http://localhost:3000/uploads/${currentProfilePic}`}
                                        alt="Current profile"
                                        className="w-24 h-24 rounded-full object-cover border-4 border-blue-600"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Current profile picture</p>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setProfilePic(e.target.files?.[0] || null)}
                                className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300"
                            />
                            {profilePic && <p className="text-xs text-green-600 mt-1">New image selected: {profilePic.name}</p>}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => router.push('/staff')}
                            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Updating...' : 'Update Staff'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </Layout>
    );
}