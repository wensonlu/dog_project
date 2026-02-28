import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 },
};

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.message || '登录失败，请检查账号密码');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setIsSubmitting(true);
        try {
            await loginWithGoogle();
            // OAuth 会自动跳转，不需要手动 navigate
        } catch (err) {
            setError(err.message || 'Google 登录失败，请重试');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark text-[#1b120e] dark:text-[#fcf9f8] overflow-hidden relative pb-20">
            {/* 背景装饰：柔和渐变与色块 */}
            <div
                className="absolute inset-0 pointer-events-none"
                aria-hidden
            >
                <div className="absolute top-0 left-0 w-full h-[45%] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent dark:from-primary/15 dark:via-primary/5" />
                <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-warm-beige/10 dark:bg-warm-beige/5 blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute top-1/4 left-0 w-40 h-40 rounded-full bg-muted-sage/10 dark:bg-muted-sage/5 blur-2xl -translate-x-1/2" />
            </div>

            <motion.div
                className="relative max-w-[430px] mx-auto w-full flex flex-col flex-1 px-6 pt-14 pb-10"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.header className="text-center mb-8" variants={itemVariants}>
                    <motion.div
                        className="size-24 mx-auto mb-5 rounded-2xl bg-card-light dark:bg-zinc-800/80 border border-[#e7d7d0]/60 dark:border-zinc-700/60 shadow-lg shadow-primary/10 flex items-center justify-center"
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        <span className="material-symbols-outlined text-5xl text-primary">pets</span>
                    </motion.div>
                    <h1 className="text-2xl font-bold tracking-tight">欢迎回来</h1>
                    <p className="text-warm-beige dark:text-warm-beige/80 text-sm mt-1.5">登录您的 PawMate 账号</p>
                </motion.header>

                <motion.div
                    className="flex-1 rounded-2xl bg-card-light/90 dark:bg-zinc-800/60 border border-[#e7d7d0]/80 dark:border-zinc-700/80 shadow-xl shadow-black/5 dark:shadow-black/20 p-6 backdrop-blur-sm"
                    variants={itemVariants}
                >
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-600 dark:text-red-400 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-800/30"
                            >
                                {error}
                            </motion.p>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="login-email" className="text-sm font-medium text-[#1b120e]/80 dark:text-[#fcf9f8]/80 block ml-0.5">
                                邮箱 / 账号
                            </label>
                            <input
                                id="login-email"
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-14 px-4 rounded-xl border-2 border-[#e7d7d0] dark:border-zinc-600 bg-white dark:bg-zinc-800 text-[#1b120e] dark:text-[#fcf9f8] placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200"
                                placeholder="请输入邮箱"
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="login-password" className="text-sm font-medium text-[#1b120e]/80 dark:text-[#fcf9f8]/80 block ml-0.5">
                                密码
                            </label>
                            <input
                                id="login-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full h-14 px-4 rounded-xl border-2 border-[#e7d7d0] dark:border-zinc-600 bg-white dark:bg-zinc-800 text-[#1b120e] dark:text-[#fcf9f8] placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200"
                                placeholder="请输入密码"
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        <motion.button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-14 mt-2 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/30 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:pointer-events-none"
                            whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                        >
                            {isSubmitting ? '正在登录...' : '立即登录'}
                        </motion.button>

                        {/* 分割线 */}
                        <div className="relative flex items-center justify-center my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-[#e7d7d0]/60 dark:border-zinc-700/60" />
                            </div>
                            <div className="relative px-4 bg-card-light/90 dark:bg-zinc-800/60 text-sm text-[#1b120e]/60 dark:text-[#fcf9f8]/60">
                                或
                            </div>
                        </div>

                        {/* Google 登录按钮 */}
                        <motion.button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={isSubmitting}
                            className="w-full h-14 flex items-center justify-center gap-3 bg-white dark:bg-zinc-700 text-[#1b120e] dark:text-[#fcf9f8] font-medium rounded-xl border-2 border-[#e7d7d0] dark:border-zinc-600 hover:border-primary dark:hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-200 disabled:opacity-70 disabled:pointer-events-none"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z" fill="#4285F4"/>
                                <path d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z" fill="#34A853"/>
                                <path d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59z" fill="#FBBC05"/>
                                <path d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.19 5.736 7.395 3.977 10 3.977z" fill="#EA4335"/>
                            </svg>
                            使用 Google 登录
                        </motion.button>
                    </form>
                </motion.div>

                <motion.p className="text-center mt-6 text-sm text-[#1b120e]/70 dark:text-[#fcf9f8]/70" variants={itemVariants}>
                    还没有账号？
                    <Link
                        to="/register"
                        className="text-primary font-bold ml-1 underline-offset-2 hover:underline"
                    >
                        立即注册
                    </Link>
                </motion.p>
            </motion.div>

            <BottomNav />
        </div>
    );
};

export default Login;
