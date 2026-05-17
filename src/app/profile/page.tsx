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
import { User, Camera } from 'lucide-react';

const profileSchema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    username: Joi.string().min(3).max(30).optional().allow(''),
    phone: Joi.string().pattern(/^(\+91|91)?[6-9]\d{9}$/).optional().allow(''),
    mobile: Joi.string().pattern(/^(\+91|91)?[6-9]\d{9}$/).optional().allow(''),
    dateOfBirth: Joi.date().optional().allow(''),
    oldPassword: Joi.string().when('password', {
        is: Joi.string().min(1),
        then: Joi.string().min(8).required(),
        otherwise: Joi.optional().allow(''),
    }),
    password: Joi.string().min(8).allow('').optional(),
});

interface ProfileForm {
    name: string;
    username?: string;
    phone?: string;
    mobile?: string;
    dateOfBirth?: string;
    oldPassword?: string;
    password?: string;
}

export default function ProfilePage() {
    const { user, login, isHydrated } = useAuthStore();
    const { register, handleSubmit, formState: { errors }, setValue } = useForm<ProfileForm>({
        resolver: joiResolver(profileSchema),
        context: { role: user?.role },
    });
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);
    const [profilePic, setProfilePic] = useState<File | null>(null);
    const [currentProfilePic, setCurrentProfilePic] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (!isHydrated) return; // Wait for store to hydrate

        if (!user) {
            router.push('/');
            return;
        }
        const fetchProfile = async () => {
            try {
                let endpoint = '';
                if (user.role === 'admin' || user.role === 'staff') {
                    endpoint = `/users/staff/${user.id}`;
                } else {
                    endpoint = `/users/user/${user.id}`;
                }

                const response = await api.get(endpoint);

                const data = response.data.staff || response.data.user;

                if (!data) {
                    toast.error('Profile data not found');
                    return;
                }

                setValue('name', data.name || '');
                if (user.role === 'admin') {
                    setValue('mobile', data.mobile || '');
                    setValue('username', data.username || '');
                } else if (user.role === 'staff') {
                    setValue('username', data.username || '');
                    setValue('phone', data.phone || '');
                } else {
                    setValue('mobile', data.mobile || '');
                }
                if (data.dateOfBirth) {
                    setValue('dateOfBirth', new Date(data.dateOfBirth).toISOString().split('T')[0]);
                }
                setCurrentProfilePic(data.profilePic || '');
            } catch (error: any) {
                toast.error(error.response?.data?.message || 'Failed to fetch profile data');
            } finally {
                setFetchingData(false);
            }
        };
        fetchProfile();
    }, [user, setValue, router, isHydrated]);

    if (!isHydrated || fetchingData) {
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

    const onSubmit = async (data: ProfileForm) => {
        if (!user) return;

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', data.name);

            if (user.role === 'admin') {
                if (data.mobile) formData.append('mobile', data.mobile);
                if (data.username) formData.append('username', data.username);
            } else if (user.role === 'staff') {
                if (data.username) formData.append('username', data.username);
                if (data.phone) formData.append('phone', data.phone);
            } else {
                if (data.mobile) formData.append('mobile', data.mobile);
            }

            if (data.dateOfBirth) {
                formData.append('dateOfBirth', data.dateOfBirth);
            }

            if (data.password) {
                if (!data.oldPassword) {
                    toast.error('Old password is required to set new password');
                    setLoading(false);
                    return;
                }
                formData.append('oldPassword', data.oldPassword);
                formData.append('password', data.password);
            }

            if (profilePic) {
                formData.append('profilePic', profilePic);
            }

            let endpoint = '';
            if (user.role === 'admin' || user.role === 'staff') {
                endpoint = `/users/staff/${user.id}`;
            } else {
                endpoint = `/users/user/${user.id}`;
            }

            const response = await api.put(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const updatedUser = response.data.staff || response.data.user;

            // Update auth store with new profile pic and data
            const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
            if (token && updatedUser) {
                login({
                    id: user.id,
                    name: updatedUser.name,
                    email: user.email,
                    profilePic: updatedUser.profilePic,
                    role: user.role,
                }, token);

                // Update current profile pic state to show new image
                setCurrentProfilePic(updatedUser.profilePic || '');
                setProfilePic(null); // Clear the file input
            }

            toast.success('Profile updated successfully');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    if (fetchingData) {
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
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Edit Profile</h1>
                    <p className="text-slate-600 dark:text-slate-300 mt-2">
                        Update your profile information
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 space-y-6">
                    {/* Profile Picture */}
                    <div className="flex flex-col items-center space-y-4">
                        <div className="relative">
                            {currentProfilePic || profilePic ? (
                                <img
                                    src={profilePic ? URL.createObjectURL(profilePic) : `http://localhost:3000/uploads/${currentProfilePic}`}
                                    alt="Profile"
                                    className="w-32 h-32 rounded-full object-cover border-4 border-blue-600"
                                />
                            ) : (
                                <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                                    <User size={64} className="text-white" />
                                </div>
                            )}
                            <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                                <Camera size={20} />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setProfilePic(e.target.files?.[0] || null)}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Click camera icon to change profile picture</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
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

                        {(user?.role === 'admin' || user?.role === 'staff') && (
                            <>
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
                                        {user?.role === 'admin' ? 'Mobile (India)' : 'Phone (India)'}
                                    </label>
                                    <input
                                        {...register(user?.role === 'admin' ? 'mobile' : 'phone')}
                                        type="text"
                                        className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                                    />
                                    {user?.role === 'admin' && errors.mobile && <p className="mt-1 text-sm text-red-600">{errors.mobile.message}</p>}
                                    {user?.role === 'staff' && errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
                                </div>
                            </>
                        )}

                        {user?.role === 'user' && (
                            <div className="md:col-span-2">
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
                        )}

                        <div className="md:col-span-2">
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
                                Email (Cannot be changed)
                            </label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Old Password (Required to change password)
                            </label>
                            <input
                                {...register('oldPassword')}
                                type="password"
                                placeholder="Enter current password"
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                            />
                            {errors.oldPassword && <p className="mt-1 text-sm text-red-600">{errors.oldPassword.message}</p>}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                New Password (Leave blank to keep current)
                            </label>
                            <input
                                {...register('password')}
                                type="password"
                                placeholder="Enter new password (optional)"
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                            />
                            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => router.push('/dashboard')}
                            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Updating...' : 'Update Profile'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </Layout>
    );
}
