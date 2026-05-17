'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { Users, Cake, Calendar, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface StaffMember {
    _id: string;
    name: string;
    email: string;
    profilePic?: string;
    role: string;
    createdAt: string;
    dateOfBirth?: string;
}

export default function RecentlyJoinedStaff() {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showProfileModal, setShowProfileModal] = useState<string | null>(null);
    const [profileData, setProfileData] = useState<any>(null);

    useEffect(() => {
        fetchRecentlyJoined();
    }, []);

    const fetchRecentlyJoined = async (retryCount = 0) => {
        try {
            const response = await api.get('/users/recently-joined');
            setStaff(response.data.staff || []);
        } catch (error: any) {
            if (retryCount < 1 && error?.code === 'ERR_NETWORK') {
                await new Promise(resolve => setTimeout(resolve, 2000));
                return fetchRecentlyJoined(retryCount + 1);
            }
        } finally {
            setLoading(false);
        }
    };

    const viewProfile = async (userId: string) => {
        try {
            const response = await api.get(`/users/staff/${userId}`);
            setProfileData(response.data.staff);
            setShowProfileModal(userId);
        } catch (error: any) {
            if (error.response?.status === 403) {
                toast.error('You can only view admin profiles');
            } else {
                toast.error('Failed to fetch profile');
            }
        }
    };

    const getRelativeTime = (date: string) => {
        const now = new Date();
        const joinDate = new Date(date);
        const diffInDays = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) return 'Today';
        if (diffInDays === 1) return 'Yesterday';
        return `${diffInDays} days ago`;
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-blue-100 dark:border-blue-900 p-6">
                <div className="flex items-center justify-center py-8">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-blue-100 dark:border-blue-900">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-2">
                        <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            New Team Members
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Joined in the last 7 days
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
                {staff.length === 0 ? (
                    <div className="p-8 text-center">
                        <Users className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="text-sm text-slate-500 dark:text-slate-400">No new members</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {staff.map((member, index) => (
                            <motion.div
                                key={member._id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                                onClick={() => viewProfile(member._id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        {member.profilePic ? (
                                            <img
                                                src={`http://localhost:3000/uploads/${member.profilePic}`}
                                                alt={member.name}
                                                className="w-12 h-12 rounded-full object-cover border-2 border-green-500"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold border-2 border-green-500">
                                                {member.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center">
                                            <span className="text-white text-xs">✓</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                            {member.name}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                            {member.email}
                                        </p>
                                        <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-0.5">
                                            {getRelativeTime(member.createdAt)}
                                        </p>
                                    </div>
                                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full capitalize">
                                        {member.role}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Profile Modal for Recently Joined Staff */}
            <AnimatePresence>
                {showProfileModal && profileData && (
                    <>
                        <div
                            className="fixed inset-0 bg-black/50 z-50"
                            onClick={() => setShowProfileModal(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                            onClick={() => setShowProfileModal(null)}
                        >
                            <div
                                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => setShowProfileModal(null)}
                                    className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <X size={20} className="text-slate-500" />
                                </button>

                                <div className="text-center">
                                    {profileData.profilePic ? (
                                        <img
                                            src={`http://localhost:3000/uploads/${profileData.profilePic}`}
                                            alt={profileData.name}
                                            className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-green-500 object-cover"
                                        />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                                            {profileData.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}

                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                        {profileData.name}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 capitalize">
                                        {profileData.role}
                                    </p>

                                    <div className="space-y-3 text-left bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Email</p>
                                            <p className="text-sm text-slate-900 dark:text-white">{profileData.email}</p>
                                        </div>
                                        {profileData.phone && (
                                            <div>
                                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Phone</p>
                                                <p className="text-sm text-slate-900 dark:text-white">{profileData.phone}</p>
                                            </div>
                                        )}
                                        {profileData.dateOfBirth && (
                                            <div>
                                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Date of Birth</p>
                                                <p className="text-sm text-slate-900 dark:text-white">
                                                    {new Date(profileData.dateOfBirth).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

export function UpcomingBirthdays() {
    const [birthdays, setBirthdays] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showProfileModal, setShowProfileModal] = useState<string | null>(null);
    const [profileData, setProfileData] = useState<any>(null);

    useEffect(() => {
        fetchUpcomingBirthdays();
    }, []);

    const fetchUpcomingBirthdays = async (retryCount = 0) => {
        try {
            const response = await api.get('/users/upcoming-birthdays');
            setBirthdays(response.data.birthdays || []);
        } catch (error: any) {
            if (retryCount < 1 && error?.code === 'ERR_NETWORK') {
                await new Promise(resolve => setTimeout(resolve, 2000));
                return fetchUpcomingBirthdays(retryCount + 1);
            }
        } finally {
            setLoading(false);
        }
    };

    const viewProfile = async (userId: string) => {
        try {
            const response = await api.get(`/users/staff/${userId}`);
            setProfileData(response.data.staff);
            setShowProfileModal(userId);
        } catch (error: any) {
            if (error.response?.status === 403) {
                toast.error('You can only view admin profiles');
            } else {
                toast.error('Failed to fetch profile');
            }
        }
    };

    const getAge = (dob: string) => {
        const birthDate = new Date(dob);
        const today = new Date();

        // Calculate current age
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const dayDiff = today.getDate() - birthDate.getDate();

        // Adjust age if birthday hasn't occurred this year yet
        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
            age--;
        }

        // If birthday is upcoming this year, they will turn age+1
        const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        if (thisYearBirthday >= today) {
            const turningAge = age + 1;
            // If the calculated age is 0 or negative, it means DOB year is wrong (future/current year)
            // Show a placeholder instead
            return turningAge <= 0 ? '—' : turningAge;
        }

        // Birthday already passed this year, next birthday they'll turn age+2
        const turningAge = age + 2;
        return turningAge <= 0 ? '—' : turningAge;
    };

    const getDaysUntilBirthday = (dob: string) => {
        const today = new Date();
        const birthDate = new Date(dob);
        const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());

        if (thisYearBirthday < today) {
            thisYearBirthday.setFullYear(today.getFullYear() + 1);
        }

        const diffTime = thisYearBirthday.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today!';
        if (diffDays === 1) return 'Tomorrow';
        return `In ${diffDays} days`;
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-purple-100 dark:border-purple-900 p-6">
                <div className="flex items-center justify-center py-8">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-purple-100 dark:border-purple-900">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-2">
                        <Cake className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Upcoming Birthdays
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Next 2 weeks
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-h-[350px] overflow-y-auto">
                {birthdays.length === 0 ? (
                    <div className="p-8 text-center">
                        <Cake className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="text-sm text-slate-500 dark:text-slate-400">No upcoming birthdays</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {birthdays.map((person, index) => (
                            <motion.div
                                key={person._id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                                onClick={() => viewProfile(person._id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        {person.profilePic ? (
                                            <img
                                                src={`http://localhost:3000/uploads/${person.profilePic}`}
                                                alt={person.name}
                                                className="w-12 h-12 rounded-full object-cover border-2 border-purple-500"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold border-2 border-purple-500">
                                                {person.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-500 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center">
                                            <Cake className="w-3 h-3 text-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                            {person.name}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Turning {getAge(person.dateOfBirth!)} years
                                        </p>
                                        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-0.5">
                                            {getDaysUntilBirthday(person.dateOfBirth!)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <Calendar className="h-5 w-5 text-purple-500 mb-1" />
                                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                            {new Date(person.dateOfBirth!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Profile Modal for Birthday Users */}
            <AnimatePresence>
                {showProfileModal && profileData && (
                    <>
                        <div
                            className="fixed inset-0 bg-black/50 z-50"
                            onClick={() => setShowProfileModal(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                            onClick={() => setShowProfileModal(null)}
                        >
                            <div
                                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => setShowProfileModal(null)}
                                    className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <X size={20} className="text-slate-500" />
                                </button>

                                <div className="text-center">
                                    {profileData.profilePic ? (
                                        <img
                                            src={`http://localhost:3000/uploads/${profileData.profilePic}`}
                                            alt={profileData.name}
                                            className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-purple-500 object-cover"
                                        />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                                            {profileData.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}

                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                        {profileData.name}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 capitalize">
                                        {profileData.role}
                                    </p>

                                    <div className="space-y-3 text-left bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Email</p>
                                            <p className="text-sm text-slate-900 dark:text-white">{profileData.email}</p>
                                        </div>
                                        {profileData.phone && (
                                            <div>
                                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Phone</p>
                                                <p className="text-sm text-slate-900 dark:text-white">{profileData.phone}</p>
                                            </div>
                                        )}
                                        {profileData.dateOfBirth && (
                                            <div>
                                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Date of Birth</p>
                                                <p className="text-sm text-slate-900 dark:text-white">
                                                    {new Date(profileData.dateOfBirth).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
