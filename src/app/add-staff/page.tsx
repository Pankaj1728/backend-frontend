'use client';

import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import Joi from 'joi';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { useAuthStore } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const addStaffSchema = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().min(2).max(50).required(),
    phone: Joi.string().pattern(/^(\+91|91)?[6-9]\d{9}$/).required(),
    dateOfBirth: Joi.date().optional().allow(''),
});

interface AddStaffForm {
    username: string;
    email: string;
    password: string;
    name: string;
    phone: string;
    dateOfBirth?: string;
}

export default function AddStaff() {
    const { user, isHydrated } = useAuthStore();
    const { register, handleSubmit, formState: { errors } } = useForm<AddStaffForm>({
        resolver: joiResolver(addStaffSchema),
    });
    const [loading, setLoading] = useState(false);
    const [authorized, setAuthorized] = useState(false);
    const [profilePic, setProfilePic] = useState<File | null>(null);
    const router = useRouter();

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

    if (!isHydrated || !authorized) {
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

    const onSubmit = async (data: AddStaffForm) => {
        setLoading(true);
        try {
            const formData = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                formData.append(key, value);
            });
            if (profilePic) {
                formData.append('profilePic', profilePic);
            }

            await api.post('/users/staff', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Staff added successfully');
            router.push('/users');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to add staff');
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
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Add Staff</h1>
                    <p className="text-slate-600 dark:text-slate-300 mt-2">
                        Add a new staff member to your CRM system.
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
                                Password
                            </label>
                            <input
                                {...register('password')}
                                type="password"
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                            />
                            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Profile Picture
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setProfilePic(e.target.files?.[0] || null)}
                                className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Adding...' : 'Add Staff'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </Layout>
    );
}