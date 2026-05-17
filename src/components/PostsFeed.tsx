'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import { Heart, MessageCircle, Send, Trash2, Edit, Smile } from 'lucide-react';
import toast from 'react-hot-toast';

interface Reply {
    user: string;
    userName: string;
    userProfilePic?: string;
    text: string;
    mentions?: string[];
    likes: string[];
    createdAt: string;
}

interface Comment {
    _id?: string;
    user: string;
    userName: string;
    userProfilePic?: string;
    text: string;
    likes: string[];
    replies: Reply[];
    createdAt: string;
}

interface Reaction {
    user: string;
    emoji: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';
}

interface Post {
    _id: string;
    author: string;
    authorName: string;
    authorProfilePic?: string;
    content: string;
    mentions: string[];
    tags: string[];
    mediaType?: 'image' | 'video';
    mediaUrl?: string;
    reactions: Reaction[];
    comments: Comment[];
    createdAt: string;
}

const EMOJI_MAP = {
    like: '👍',
    love: '❤️',
    haha: '😂',
    wow: '😮',
    sad: '😢',
    angry: '😠'
};

export default function PostsFeed() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
    const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
    const [showReactions, setShowReactions] = useState<string | null>(null);
    const [replyingTo, setReplyingTo] = useState<{ postId: string; commentId: string } | null>(null);
    const [editingPost, setEditingPost] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [showLikersModal, setShowLikersModal] = useState<{ type: 'post' | 'comment' | 'reply'; id: string; data?: any } | null>(null);
    const [showProfileModal, setShowProfileModal] = useState<string | null>(null);
    const [profileData, setProfileData] = useState<any>(null);
    const [staffList, setStaffList] = useState<any[]>([]);
    const { user } = useAuthStore();

    const fetchPosts = async (retryCount = 0) => {
        try {
            const response = await api.get('/posts');
            setPosts(response.data.posts || []);
        } catch (error: any) {
            if (retryCount < 1 && error?.code === 'ERR_NETWORK') {
                await new Promise(resolve => setTimeout(resolve, 2000));
                return fetchPosts(retryCount + 1);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchStaff = async (retryCount = 0) => {
        try {
            const response = await api.get('/users/users');
            const allStaff = [...(response.data.staff || []), ...(response.data.users || [])];
            setStaffList(allStaff);
        } catch (error: any) {
            if (retryCount < 1 && error?.code === 'ERR_NETWORK') {
                await new Promise(resolve => setTimeout(resolve, 2000));
                return fetchStaff(retryCount + 1);
            }
        }
    };

    useEffect(() => {
        fetchPosts();
        fetchStaff();
        const handleNewPost = () => fetchPosts();
        window.addEventListener('newPost', handleNewPost);
        return () => window.removeEventListener('newPost', handleNewPost);
    }, []);

    const handleReact = async (postId: string, emoji: keyof typeof EMOJI_MAP) => {
        try {
            await api.post(`/posts/${postId}/react`, { emoji });
            fetchPosts();
            setShowReactions(null);
        } catch (error: any) {
            toast.error('Failed to react');
        }
    };

    const handleComment = async (postId: string) => {
        const text = commentText[postId]?.trim();
        if (!text) return;

        try {
            await api.post(`/posts/${postId}/comment`, { text });
            setCommentText({ ...commentText, [postId]: '' });
            fetchPosts();
        } catch (error: any) {
            toast.error('Failed to add comment');
        }
    };

    const handleReply = async (postId: string, commentId: string) => {
        const key = `${postId}-${commentId}`;
        const text = replyText[key]?.trim();
        if (!text) return;

        try {
            // Extract mentions from reply text
            const mentionMatches = text.match(/@(\w+)/g) || [];
            const mentions: string[] = [];

            mentionMatches.forEach(mention => {
                const name = mention.substring(1); // Remove @
                const staff = staffList.find(s => s.name.toLowerCase() === name.toLowerCase());
                if (staff && staff._id !== user?.id) {
                    mentions.push(staff._id);
                }
            });

            await api.post(`/posts/${postId}/comment/${commentId}/reply`, {
                text,
                mentions
            });
            setReplyText({ ...replyText, [key]: '' });
            setReplyingTo(null);
            fetchPosts();
        } catch (error: any) {
            toast.error('Failed to add reply');
        }
    };

    const handleEditPost = async (postId: string) => {
        if (!editContent.trim()) return;

        try {
            await api.put(`/posts/${postId}`, { content: editContent });
            setEditingPost(null);
            setEditContent('');
            fetchPosts();
            toast.success('Post updated');
        } catch (error: any) {
            toast.error('Failed to update post');
        }
    };

    const handleDelete = async (postId: string) => {
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            await api.delete(`/posts/${postId}`);
            fetchPosts();
            toast.success('Post deleted');
        } catch (error: any) {
            toast.error('Failed to delete post');
        }
    };

    const handleLikeComment = async (postId: string, commentId: string) => {
        try {
            await api.post(`/posts/${postId}/comment/${commentId}/like`);
            fetchPosts();
        } catch (error: any) {
            toast.error('Failed to like comment');
        }
    };

    const handleLikeReply = async (postId: string, commentId: string, replyIndex: number) => {
        try {
            await api.post(`/posts/${postId}/comment/${commentId}/reply/${replyIndex}/like`);
            fetchPosts();
        } catch (error: any) {
            toast.error('Failed to like reply');
        }
    };

    const viewPostReactions = async (postId: string) => {
        try {
            const response = await api.get(`/posts/${postId}/reactions`);
            setShowLikersModal({ type: 'post', id: postId, data: response.data.reactions });
        } catch (error: any) {
            toast.error('Failed to fetch reactions');
        }
    };

    const viewCommentLikes = async (postId: string, commentId: string) => {
        try {
            const response = await api.get(`/posts/${postId}/comment/${commentId}/likes`);
            setShowLikersModal({ type: 'comment', id: commentId, data: response.data.likes });
        } catch (error: any) {
            toast.error('Failed to fetch likes');
        }
    };

    const viewReplyLikes = async (postId: string, commentId: string, replyIndex: number) => {
        try {
            const response = await api.get(`/posts/${postId}/comment/${commentId}/reply/${replyIndex}/likes`);
            setShowLikersModal({ type: 'reply', id: `${commentId}-${replyIndex}`, data: response.data.likes });
        } catch (error: any) {
            toast.error('Failed to fetch likes');
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
                toast.error('Failed to fetch profile: ' + (error.response?.data?.message || error.message));
            }
        }
    };

    const getRelativeTime = (date: string) => {
        const now = new Date();
        const postDate = new Date(date);
        const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return postDate.toLocaleDateString();
    };

    const getReactionCounts = (reactions: Reaction[]) => {
        const counts: { [key: string]: number } = {};
        reactions.forEach(r => {
            counts[r.emoji] = (counts[r.emoji] || 0) + 1;
        });
        return counts;
    };

    const getUserReaction = (reactions: Reaction[]) => {
        return reactions.find(r => r.user === user?.id)?.emoji;
    };

    const renderContentWithMentions = (content: string, mentionIds: string[] = []) => {
        const mentionMap: { [key: string]: string } = {};
        mentionIds.forEach(id => {
            const staff = staffList.find(s => s._id === id);
            if (staff) {
                mentionMap[`@${staff.name}`] = id;
            }
        });

        const words = content.split(' ');
        return words.map((word, index) => {
            if (word.startsWith('@')) {
                const userId = mentionMap[word];
                if (userId) {
                    return (
                        <span key={index}>
                            <span onClick={() => viewProfile(userId)}
                                className="text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer"
                            >
                                {word}
                            </span>
                            {' '}
                        </span>
                    );
                }
                return (
                    <span key={index} className="text-blue-600 dark:text-blue-400 font-medium">
                        {word}{' '}
                    </span>
                );
            } else if (word.startsWith('#')) {
                return (
                    <span key={index} className="text-green-600 dark:text-green-400 font-medium">
                        {word}{' '}
                    </span>
                );
            } else {
                return <span key={index}>{word} </span>;
            }
        });
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
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

    if (posts.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
                <MessageCircle className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">No posts yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {posts.map((post, index) => {
                const reactionCounts = getReactionCounts(post.reactions);
                const userReaction = getUserReaction(post.reactions);

                return (
                    <motion.div
                        key={post._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
                    >
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {post.authorProfilePic ? (
                                    <img
                                        src={`http://localhost:3000/uploads/${post.authorProfilePic}`}
                                        alt={post.authorName}
                                        className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => viewProfile(post.author)}
                                    />
                                ) : (
                                    <div
                                        className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => viewProfile(post.author)}
                                    >
                                        {post.authorName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <p
                                        className="text-sm font-semibold text-slate-900 dark:text-white cursor-pointer hover:underline"
                                        onClick={() => viewProfile(post.author)}
                                    >
                                        {post.authorName}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {getRelativeTime(post.createdAt)}
                                    </p>
                                </div>
                            </div>
                            {user?.role === 'admin' && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setEditingPost(post._id);
                                            setEditContent(post.content);
                                        }}
                                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(post._id)}
                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {editingPost === post._id ? (
                            <div className="px-4 pb-3 space-y-2">
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                                    rows={3}
                                />
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => setEditingPost(null)}
                                        className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleEditPost(post._id)}
                                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="px-4 pb-3">
                                <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                                    {renderContentWithMentions(post.content, post.mentions || [])}
                                </p>
                            </div>
                        )}

                        {post.mediaUrl && (
                            <div className="px-4 pb-3">
                                {post.mediaType === 'video' ? (
                                    <video
                                        src={`http://localhost:3000/uploads/${post.mediaUrl}`}
                                        controls
                                        className="w-full rounded-lg max-h-96 bg-slate-100 dark:bg-slate-700"
                                    />
                                ) : (
                                    <img
                                        src={`http://localhost:3000/uploads/${post.mediaUrl}`}
                                        alt="Post media"
                                        className="w-full rounded-lg max-h-96 object-contain bg-slate-100 dark:bg-slate-700"
                                    />
                                )}
                            </div>
                        )}

                        {post.reactions.length > 0 && (
                            <div
                                onClick={() => viewPostReactions(post._id)}
                                className="px-4 py-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 cursor-pointer hover:text-blue-600 transition-colors"
                            >
                                <div className="flex -space-x-1">
                                    {Object.entries(reactionCounts).slice(0, 3).map(([emoji]) => (
                                        <span key={emoji} className="text-lg">{EMOJI_MAP[emoji as keyof typeof EMOJI_MAP]}</span>
                                    ))}
                                </div>
                                <span>{post.reactions.length}</span>
                            </div>
                        )}

                        <div className="px-4 py-2 flex gap-2 border-t border-slate-200 dark:border-slate-700">
                            <div className="relative flex-1">
                                <button
                                    onClick={() => setShowReactions(showReactions === post._id ? null : post._id)}
                                    className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${userReaction
                                        ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {userReaction ? (
                                        <span className="text-lg">{EMOJI_MAP[userReaction]}</span>
                                    ) : (
                                        <Smile size={18} />
                                    )}
                                    <span className="text-sm font-medium">React</span>
                                </button>

                                <AnimatePresence>
                                    {showReactions === post._id && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute bottom-full mb-2 left-0 bg-white dark:bg-slate-700 rounded-full shadow-lg border border-slate-200 dark:border-slate-600 px-3 py-2 flex gap-2 z-10"
                                        >
                                            {(Object.keys(EMOJI_MAP) as Array<keyof typeof EMOJI_MAP>).map(emoji => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => handleReact(post._id, emoji)}
                                                    className="text-2xl hover:scale-125 transition-transform"
                                                >
                                                    {EMOJI_MAP[emoji]}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                <MessageCircle size={18} />
                                <span className="text-sm font-medium">{post.comments.length}</span>
                            </button>
                        </div>

                        {post.comments.length > 0 && (
                            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 space-y-3">
                                {post.comments.map((comment, commentIndex) => (
                                    <div key={comment._id} className="space-y-2">
                                        <div className="flex gap-2">
                                            {comment.userProfilePic ? (
                                                <img
                                                    src={`http://localhost:3000/uploads/${comment.userProfilePic}`}
                                                    alt={comment.userName}
                                                    className="w-8 h-8 rounded-full object-cover shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                                    onClick={() => viewProfile(comment.user)}
                                                />
                                            ) : (
                                                <div
                                                    className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                                    onClick={() => viewProfile(comment.user)}
                                                >
                                                    {comment.userName.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <div className="bg-white dark:bg-slate-800 rounded-lg p-2">
                                                    <p
                                                        className="text-xs font-semibold text-slate-900 dark:text-white cursor-pointer hover:underline"
                                                        onClick={() => viewProfile(comment.user)}
                                                    >
                                                        {comment.userName}
                                                    </p>
                                                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                                                        {comment.text}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 ml-2">
                                                    <button
                                                        onClick={() => handleLikeComment(post._id, comment._id!)}
                                                        className={`text-xs font-medium ${comment.likes.includes(user?.id || '') ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'} transition-colors`}
                                                    >
                                                        {comment.likes.includes(user?.id || '') ? 'Liked' : 'Like'}
                                                    </button>
                                                    {comment.likes.length > 0 && (
                                                        <button
                                                            onClick={() => viewCommentLikes(post._id, comment._id!)}
                                                            className="text-xs text-slate-500 hover:text-blue-600 transition-colors"
                                                        >
                                                            {comment.likes.length} {comment.likes.length === 1 ? 'like' : 'likes'}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setReplyingTo({ postId: post._id, commentId: comment._id! })}
                                                        className="text-xs text-blue-600 hover:underline"
                                                    >
                                                        Reply
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {comment.replies && comment.replies.length > 0 && (
                                            <div className="ml-10 space-y-2">
                                                {comment.replies.map((reply, replyIdx) => (
                                                    <div key={replyIdx} className="space-y-1">
                                                        <div className="flex gap-2">
                                                            {reply.userProfilePic ? (
                                                                <img
                                                                    src={`http://localhost:3000/uploads/${reply.userProfilePic}`}
                                                                    alt={reply.userName}
                                                                    className="w-6 h-6 rounded-full object-cover shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                                                    onClick={() => viewProfile(reply.user)}
                                                                />
                                                            ) : (
                                                                <div
                                                                    className="w-6 h-6 rounded-full bg-linear-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-xs font-semibold shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                                                    onClick={() => viewProfile(reply.user)}
                                                                >
                                                                    {reply.userName.charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                            <div className="flex-1">
                                                                <div className="bg-white dark:bg-slate-800 rounded-lg p-2">
                                                                    <p
                                                                        className="text-xs font-semibold text-slate-900 dark:text-white cursor-pointer hover:underline"
                                                                        onClick={() => viewProfile(reply.user)}
                                                                    >
                                                                        {reply.userName}
                                                                    </p>
                                                                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                                                                        {renderContentWithMentions(reply.text, reply.mentions || [])}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 ml-8">
                                                            <button
                                                                onClick={() => handleLikeReply(post._id, comment._id!, replyIdx)}
                                                                className={`text-xs font-medium ${reply.likes.includes(user?.id || '') ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'} transition-colors`}
                                                            >
                                                                {reply.likes.includes(user?.id || '') ? 'Liked' : 'Like'}
                                                            </button>
                                                            {reply.likes.length > 0 && (
                                                                <button
                                                                    onClick={() => viewReplyLikes(post._id, comment._id!, replyIdx)}
                                                                    className="text-xs text-slate-500 hover:text-blue-600 transition-colors"
                                                                >
                                                                    {reply.likes.length} {reply.likes.length === 1 ? 'like' : 'likes'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {replyingTo?.postId === post._id && replyingTo?.commentId === comment._id && (
                                            <div className="ml-10 flex gap-2">
                                                <input
                                                    type="text"
                                                    value={replyText[`${post._id}-${comment._id}`] || ''}
                                                    onChange={(e) => setReplyText({ ...replyText, [`${post._id}-${comment._id}`]: e.target.value })}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleReply(post._id, comment._id!)}
                                                    placeholder="Write a reply..."
                                                    className="flex-1 px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => handleReply(post._id, comment._id!)}
                                                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                >
                                                    <Send size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 flex gap-2">
                            <input
                                type="text"
                                value={commentText[post._id] || ''}
                                onChange={(e) => setCommentText({ ...commentText, [post._id]: e.target.value })}
                                onKeyPress={(e) => e.key === 'Enter' && handleComment(post._id)}
                                placeholder="Write a comment..."
                                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                            />
                            <button
                                onClick={() => handleComment(post._id)}
                                disabled={!commentText[post._id]?.trim()}
                                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </motion.div>
                );
            })}

            <AnimatePresence>
                {showLikersModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowLikersModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 max-w-md w-full max-h-96 overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                {showLikersModal.type === 'post' ? 'Reactions' : 'Likes'}
                            </h3>
                            <div className="space-y-3">
                                {showLikersModal.data && showLikersModal.data.length > 0 ? (
                                    showLikersModal.data.map((item: any, idx: number) => {
                                        const userData = showLikersModal.type === 'post' ? item.user : item;
                                        return (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                                onClick={() => {
                                                    setShowLikersModal(null);
                                                    viewProfile(userData._id || userData);
                                                }}
                                            >
                                                {userData.profilePic ? (
                                                    <img
                                                        src={`http://localhost:3000/uploads/${userData.profilePic}`}
                                                        alt={userData.name}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                                                        {(userData.name || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                        {userData.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {userData.role}
                                                    </p>
                                                </div>
                                                {showLikersModal.type === 'post' && (
                                                    <span className="text-2xl">{EMOJI_MAP[item.emoji as keyof typeof EMOJI_MAP]}</span>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-center text-slate-500 dark:text-slate-400">No {showLikersModal.type === 'post' ? 'reactions' : 'likes'} yet</p>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showProfileModal && profileData && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowProfileModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 max-w-md w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex flex-col items-center">
                                {profileData.profilePic ? (
                                    <img
                                        src={`http://localhost:3000/uploads/${profileData.profilePic}`}
                                        alt={profileData.name}
                                        className="w-24 h-24 rounded-full object-cover mb-4"
                                    />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-semibold mb-4">
                                        {profileData.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                                    {profileData.name}
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 capitalize">
                                    {profileData.role}
                                </p>
                                <div className="w-full space-y-3 text-left">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="font-semibold text-slate-700 dark:text-slate-300 w-24">Email:</span>
                                        <span className="text-slate-600 dark:text-slate-400">{profileData.email}</span>
                                    </div>
                                    {profileData.phone && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="font-semibold text-slate-700 dark:text-slate-300 w-24">Phone:</span>
                                            <span className="text-slate-600 dark:text-slate-400">{profileData.phone}</span>
                                        </div>
                                    )}
                                    {profileData.username && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="font-semibold text-slate-700 dark:text-slate-300 w-24">Username:</span>
                                            <span className="text-slate-600 dark:text-slate-400">{profileData.username}</span>
                                        </div>
                                    )}
                                    {profileData.dateOfBirth && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="font-semibold text-slate-700 dark:text-slate-300 w-24">Birthday:</span>
                                            <span className="text-slate-600 dark:text-slate-400">
                                                {new Date(profileData.dateOfBirth).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowProfileModal(null)}
                                    className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
