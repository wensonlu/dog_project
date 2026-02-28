import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            await register(email, password);
            navigate('/');
        } catch (err) {
            setError(err.message || '注册失败，请重试');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setIsSubmitting(true);
        try {
            await loginWithGoogle();
            // OAuth 会自动跳转
        } catch (err) {
            setError(err.message || 'Google 登录失败，请重试');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-[430px] mx-auto min-h-screen flex flex-col bg-background-light dark:bg-background-dark text-[#1b120e] dark:text-[#fcf9f8] p-6 pb-24">
            <header className="py-12 text-center">
                <div className="size-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 -rotate-6">
                    <span className="material-symbols-outlined text-4xl text-primary rotate-6">person_add</span>
                </div>
                <h1 className="text-3xl font-bold">创建账号</h1>
                <p className="text-warm-beige mt-2">加入 PawMate 大家庭</p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900/20">{error}</p>}

                <div className="space-y-2">
                    <label className="text-sm font-bold ml-1 opacity-70">邮箱 / 账号</label>
                    <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-14 px-4 rounded-xl border border-[#e7d7d0] dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        placeholder="无需校验格式"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold ml-1 opacity-70">设置密码</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-14 px-4 rounded-xl border border-[#e7d7d0] dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        placeholder="请输入密码"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 bg-primary text-white font-bold rounded-xl mt-6 shadow-lg shadow-primary/20 active:scale-95 transition-transform disabled:opacity-70 disabled:pointer-events-none"
                >
                    {isSubmitting ? '正在注册...' : '立即注册'}
                </button>

                {/* 分割线 */}
                <div className="relative flex items-center justify-center my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#e7d7d0]/60 dark:border-zinc-700/60" />
                    </div>
                    <div className="relative px-4 bg-background-light dark:bg-background-dark text-sm text-[#1b120e]/60 dark:text-[#fcf9f8]/60">
                        或
                    </div>
                </div>

                {/* Google 登录按钮 */}
                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isSubmitting}
                    className="w-full h-14 flex items-center justify-center gap-3 bg-white dark:bg-zinc-700 text-[#1b120e] dark:text-[#fcf9f8] font-medium rounded-xl border border-[#e7d7d0] dark:border-zinc-600 hover:border-primary dark:hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-200 disabled:opacity-70 disabled:pointer-events-none active:scale-95"
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z" fill="#4285F4"/>
                        <path d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z" fill="#34A853"/>
                        <path d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59z" fill="#FBBC05"/>
                        <path d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.19 5.736 7.395 3.977 10 3.977z" fill="#EA4335"/>
                    </svg>
                    使用 Google 注册
                </button>
            </form>

            <p className="text-center mt-8 text-sm">
                已有账号？
                <Link to="/login" className="text-primary font-bold ml-1">直接登录</Link>
            </p>

            <BottomNav />
        </div>
    );
};

export default Register;
