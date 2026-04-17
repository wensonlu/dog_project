import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import ApplicationTimeline from '../components/ApplicationTimeline';

const Application = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();
    const [step, setStep] = useState(1);

    // 检查登录状态
    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        address: '',
        hasPets: false,
        housingType: '公寓'
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_BASE_URL}/applications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    dogId: id,
                    ...formData
                })
            });

            if (response.ok) {
                setStep(3); // Success step
            } else {
                alert('提交失败，请重试');
            }
        } catch (error) {
            console.error('Error submitting application:', error);
            alert('网络错误，请核对后端是否开启');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (step === 3) {
        return (
            <div className="max-w-[430px] mx-auto min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark p-6 text-center">
                <div className="size-24 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-6xl text-primary">check_circle</span>
                </div>
                <h2 className="text-3xl font-bold mb-2">申请已提交！</h2>
                <p className="text-warm-beige mb-6">我们会尽快审核您的申请，请留意消息通知。</p>
                <ApplicationTimeline status="pending" className="mb-8 w-full text-left" />
                <button
                    onClick={() => navigate('/')}
                    className="w-full bg-primary text-white font-bold h-14 rounded-xl"
                >
                    返回首页
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-[430px] mx-auto min-h-screen flex flex-col pb-10 bg-background-light dark:bg-background-dark text-[#1b120e] dark:text-[#fcf9f8]">
            <header className="flex items-center bg-background-light dark:bg-background-dark p-4 sticky top-0 z-10">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                >
                    <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
                </button>
                <h2 className="text-center text-lg font-bold leading-tight tracking-tight flex-1 mr-10">领养申请表</h2>
            </header>

            <div className="flex flex-col gap-3 px-6 py-4">
                <div className="flex gap-6 justify-between items-end">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-widest text-primary/80">步骤 {step.toString().padStart(2, '0')}</span>
                        <p className="text-xl font-bold leading-normal">{step === 1 ? '个人信息' : '住房环境'}</p>
                    </div>
                    <p className="text-sm font-medium opacity-60">{step}/2</p>
                </div>
                <div className="rounded-full bg-[#e7d7d0] dark:bg-[#3d2d26] h-2 w-full overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${(step / 2) * 100}%` }} />
                </div>
            </div>

            <main className="px-4 mt-2 flex-1">
                {step === 1 ? (
                    <div className="bg-card-light dark:bg-zinc-800 rounded-xl p-5 shadow-sm border border-[#e7d7d0]/30 dark:border-zinc-700">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">person</span>
                            关于您
                        </h3>
                        <div className="space-y-5">
                            <label className="flex flex-col w-full">
                                <p className="text-sm font-semibold mb-2 ml-1 opacity-80">您的姓名</p>
                                <input
                                    required
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-[#e7d7d0] dark:border-zinc-600 bg-background-light dark:bg-zinc-900 h-14 px-4"
                                    placeholder="请输入真实姓名"
                                />
                            </label>
                            <label className="flex flex-col w-full">
                                <p className="text-sm font-semibold mb-2 ml-1 opacity-80">联系电话</p>
                                <input
                                    required
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-[#e7d7d0] dark:border-zinc-600 bg-background-light dark:bg-zinc-900 h-14 px-4"
                                    placeholder="请输入手机号码"
                                    type="tel"
                                />
                            </label>
                            <label className="flex flex-col w-full">
                                <p className="text-sm font-semibold mb-2 ml-1 opacity-80">居住地址</p>
                                <input
                                    required
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-[#e7d7d0] dark:border-zinc-600 bg-background-light dark:bg-zinc-900 h-14 px-4"
                                    placeholder="请输入详细地址"
                                />
                            </label>
                        </div>
                    </div>
                ) : (
                    <div className="bg-card-light dark:bg-zinc-800 rounded-xl p-5 shadow-sm border border-[#e7d7d0]/30 dark:border-zinc-700">
                        <div className="mb-8">
                            <p className="text-sm font-semibold mb-4 opacity-80">您家中目前是否有其他宠物？</p>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, hasPets: true }))}
                                    className={`flex-1 h-14 rounded-lg border-2 font-medium ${formData.hasPets ? 'border-primary text-primary bg-primary/5' : 'border-[#e7d7d0] dark:border-zinc-600'}`}
                                >
                                    是
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, hasPets: false }))}
                                    className={`flex-1 h-14 rounded-lg border-2 font-medium ${!formData.hasPets ? 'border-primary text-primary bg-primary/5' : 'border-[#e7d7d0] dark:border-zinc-600'}`}
                                >
                                    否
                                </button>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-semibold mb-4 opacity-80">您的住房类型</p>
                            <div className="grid grid-cols-2 gap-4">
                                {['公寓', '带院子住宅'].map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setFormData(p => ({ ...p, housingType: type }))}
                                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${formData.housingType === type ? 'border-primary bg-primary/5 text-primary' : 'border-[#e7d7d0] dark:border-zinc-600'}`}
                                    >
                                        <span className="material-symbols-outlined text-3xl mb-2">{type === '公寓' ? 'apartment' : 'potted_plant'}</span>
                                        <span className="font-medium">{type}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <div className="px-4 pt-10 pb-6">
                <button
                    type={step === 2 ? "submit" : "button"}
                    onClick={step === 1 ? () => setStep(2) : undefined}
                    disabled={isSubmitting}
                    className="w-full bg-primary text-white font-bold h-14 rounded-xl shadow-lg flex items-center justify-center gap-2"
                >
                    {isSubmitting ? '正在提交...' : (step === 1 ? '下一步' : '提交申请')}
                    {!isSubmitting && <span className="material-symbols-outlined">arrow_forward</span>}
                </button>
            </div>
        </form>
    );
};

export default Application;
