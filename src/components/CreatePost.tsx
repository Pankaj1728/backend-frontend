'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { ImagePlus, Video, Send, X, Hash } from 'lucide-react';
import { useAuthStore } from '@/lib/auth';

interface Staff {
    _id: string;
    name: string;
    email: string;
    profilePic?: string;
}

interface MentionSuggestion {
    staff: Staff;
    position: { top: number; left: number };
}

export default function CreatePost() {
    const { user } = useAuthStore();
    const [content, setContent] = useState('');
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [mentions, setMentions] = useState<string[]>([]);
    const [mentionNames, setMentionNames] = useState<{ [key: string]: string }>({});
    const [tags, setTags] = useState<string[]>([]);
    const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
    const [mentionSearch, setMentionSearch] = useState('');
    const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [mentionStart, setMentionStart] = useState(-1);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const response = await api.get('/users/users');
            // Combine both staff and admin users, exclude current user
            const allStaff = [...(response.data.staff || []), ...(response.data.users || [])]
                .filter(s => s._id !== user?.id);
            setStaffList(allStaff);
        } catch (error: any) {
            toast.error('Failed to load staff list');
        }
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        const cursorPos = e.target.selectionStart;

        setContent(text);
        setCursorPosition(cursorPos);

        // Check for @ mentions
        const textBeforeCursor = text.substring(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex !== -1) {
            const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
            // Check if there's a space after @, if yes, don't show suggestions
            if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
                setMentionStart(lastAtIndex);
                setMentionSearch(textAfterAt.toLowerCase());
                const filtered = staffList.filter(staff =>
                    staff.name.toLowerCase().includes(textAfterAt.toLowerCase())
                );
                setFilteredStaff(filtered);
                setShowMentionSuggestions(filtered.length > 0);
            } else {
                setShowMentionSuggestions(false);
            }
        } else {
            setShowMentionSuggestions(false);
        }

        // Extract tags from content
        const tagMatches = text.match(/#[\w]+/g);
        if (tagMatches) {
            const extractedTags = tagMatches.map(tag => tag.substring(1));
            setTags(Array.from(new Set(extractedTags)));
        }
    };

    const selectMention = (staff: Staff) => {
        if (mentionStart === -1) return;

        const beforeMention = content.substring(0, mentionStart);
        const afterMention = content.substring(cursorPosition);
        const newContent = beforeMention + `@${staff.name} ` + afterMention;

        setContent(newContent);

        // Add to mentions array
        if (!mentions.includes(staff._id)) {
            setMentions([...mentions, staff._id]);
            setMentionNames({ ...mentionNames, [staff._id]: staff.name });
        }

        setShowMentionSuggestions(false);
        setMentionStart(-1);

        // Set cursor position after the mention
        setTimeout(() => {
            if (textareaRef.current) {
                const newCursorPos = beforeMention.length + staff.name.length + 2; // +2 for @ and space
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
                textareaRef.current.focus();
            }
        }, 0);
    };

    const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setMediaFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setMediaPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeMedia = () => {
        setMediaFile(null);
        setMediaPreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!content.trim()) {
            toast.error('Please write something');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('content', content);
            formData.append('mentions', JSON.stringify(mentions));
            formData.append('tags', JSON.stringify(tags));
            if (mediaFile) {
                formData.append('media', mediaFile);
            }

            await api.post('/posts', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            toast.success('Post published successfully!');
            setContent('');
            setMediaFile(null);
            setMediaPreview(null);
            setMentions([]);
            setMentionNames({});
            setTags([]);

            window.dispatchEvent(new Event('newPost'));
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create post');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6"
        >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Create Post
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleContentChange}
                        placeholder="What's on your mind? Type @ to mention someone, # for tags..."
                        rows={4}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white resize-none"
                    />

                    {/* Mention Suggestions Dropdown */}
                    <AnimatePresence>
                        {showMentionSuggestions && filteredStaff.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute z-50 mt-1 w-full max-w-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                            >
                                {filteredStaff.map(staff => (
                                    <button
                                        key={staff._id}
                                        type="button"
                                        onClick={() => selectMention(staff)}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors text-left"
                                    >
                                        {staff.profilePic ? (
                                            <img
                                                src={`http://localhost:3000/uploads/${staff.profilePic}`}
                                                alt={staff.name}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                                                {staff.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                {staff.name}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {staff.email}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Show mentioned users */}
                {mentions.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Mentioned:</span>
                        {mentions.map(mentionId => {
                            const staff = staffList.find(s => s._id === mentionId);
                            return staff ? (
                                <span
                                    key={mentionId}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-xs"
                                >
                                    @{staff.name}
                                </span>
                            ) : null;
                        })}
                    </div>
                )}

                {/* Show tags */}
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">Tags:</span>
                        {tags.map(tag => (
                            <span
                                key={tag}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full text-xs"
                            >
                                <Hash size={12} />
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {mediaPreview && (
                    <div className="relative">
                        {mediaFile?.type.startsWith('video') ? (
                            <video
                                src={mediaPreview}
                                controls
                                className="w-full rounded-lg max-h-64 object-contain bg-slate-100 dark:bg-slate-700"
                            />
                        ) : (
                            <img
                                src={mediaPreview}
                                alt="Preview"
                                className="w-full rounded-lg max-h-64 object-contain bg-slate-100 dark:bg-slate-700"
                            />
                        )}
                        <button
                            type="button"
                            onClick={removeMedia}
                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        <label className="cursor-pointer p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="Add Image">
                            <ImagePlus size={20} className="text-slate-600 dark:text-slate-400" />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleMediaChange}
                                className="hidden"
                            />
                        </label>
                        <label className="cursor-pointer p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="Add Video">
                            <Video size={20} className="text-slate-600 dark:text-slate-400" />
                            <input
                                type="file"
                                accept="video/*"
                                onChange={handleMediaChange}
                                className="hidden"
                            />
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !content.trim()}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={18} />
                        {loading ? 'Publishing...' : 'Publish'}
                    </button>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                    💡 Tip: Type <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded">@</span> to mention someone,
                    <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded ml-1">#</span> for tags
                </p>
            </form>
        </motion.div>
    );
}
