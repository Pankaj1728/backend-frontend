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

const editUserSchema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    mobile: Joi.string().pattern(/^(\+91|91)?[6-9]\d{9}$/).required(),
    city: Joi.string().min(2).max(50).required(),
    state: Joi.string().min(2).max(50).required(),
    country: Joi.string().min(2).max(50).required(),
    assignedStaff: Joi.string().required(),
});

interface EditUserForm {
    name: string;
    email: string;
    mobile: string;
    city: string;
    state: string;
    country: string;
    assignedStaff: string;
}

interface Staff {
    _id: string;
    name: string;
}

export default function EditUser() {
    const { user, isHydrated } = useAuthStore();
    const { register, handleSubmit, formState: { errors }, setValue } = useForm<EditUserForm>({
        resolver: joiResolver(editUserSchema),
    });
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const router = useRouter();
    const params = useParams();
    const userId = params.id as string;

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
        const fetchData = async (retryCount = 0) => {
            try {
                const [userResponse, staffResponse] = await Promise.all([
                    api.get(`/users/user/${userId}`),
                    api.get('/users/users')
                ]);

                const userData = userResponse.data.user;
                setValue('name', userData.name);
                setValue('email', userData.email);
                setValue('mobile', userData.mobile);
                setValue('city', userData.city);
                setValue('state', userData.state);
                setValue('country', userData.country);
                setValue('assignedStaff', userData.assignedStaff);

                setStaffList(staffResponse.data.staff || []);
            } catch (error: any) {
                if (retryCount < 1 && error?.code === 'ERR_NETWORK') {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    return fetchData(retryCount + 1);
                }
                const errorMsg = error?.code === 'ERR_RATE_LIMIT' ? error.message : 'Failed to fetch user data';
                toast.error(errorMsg);
                router.push('/users');
            } finally {
                setFetchingData(false);
            }
        };
        fetchData();
    }, [authorized, userId, setValue, router]);

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

    const onSubmit = async (data: EditUserForm) => {
        setLoading(true);
        try {
            await api.put(`/users/user/${userId}`, data);
            toast.success('User updated successfully');
            router.push('/users');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-2xl mx-auto"
            >
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Edit User</h1>
                    <p className="text-slate-600 dark:text-slate-300 mt-2">
                        Update user information.
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
                                Mobile (India)
                            </label>
                            <input
                                {...register('mobile')}
                                type="text"
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                            />
                            {errors.mobile && <p className="mt-1 text-sm text-red-600">{errors.mobile.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                City
                            </label>
                            <input
                                {...register('city')}
                                type="text"
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                            />
                            {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                State
                            </label>
                            <input
                                {...register('state')}
                                type="text"
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                            />
                            {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Country
                            </label>
                            <input
                                {...register('country')}
                                type="text"
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                            />
                            {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Assign to Staff
                            </label>
                            <select
                                {...register('assignedStaff')}
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                            >
                                <option value="">Select Staff</option>
                                {staffList.map((staff) => (
                                    <option key={staff._id} value={staff._id}>
                                        {staff.name}
                                    </option>
                                ))}
                            </select>
                            {errors.assignedStaff && <p className="mt-1 text-sm text-red-600">{errors.assignedStaff.message}</p>}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => router.push('/users')}
                            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Updating...' : 'Update User'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </Layout>
    );
}