import { motion } from 'framer-motion';

export const Footer = () => {
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "CRM System";

    return (
        <motion.footer
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-blue-200/50 dark:border-blue-800/50 mt-auto"
        >
            <div className="px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                        © {new Date().getFullYear()} {siteName}. All rights reserved.
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                        <span>V1.0.0</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                            Made with ❤️ by{' '}
                            <a
                                href="https://vaibhawkumarparashar.in"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors underline decoration-dotted"
                            >
                                Vaibhaw
                            </a>
                        </span>
                    </div>
                </div>
            </div>
        </motion.footer>
    );
};