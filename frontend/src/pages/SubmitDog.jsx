import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';
import { API_BASE_URL } from '../config/api';

const SubmitDog = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [step, setStep] = useState(1);
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        breed: '',
        location: '',
        image: '',
        gender: '公',
        description: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                alert('只支持图片文件 (jpeg, jpg, png, gif, webp)');
                e.target.value = ''; // Clear input
                return;
            }

            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('图片大小不能超过 5MB');
                e.target.value = ''; // Clear input
                return;
            }

            setSelectedFile(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
            debugger
            // Auto upload after selection
            await handleImageUpload(file);
        }
    };

    const handleImageUpload = async (fileToUpload = null) => {
        const file = fileToUpload || selectedFile;
        if (!file) {
            alert('请选择图片文件');
            return;
        }

        setIsUploading(true);
        try {
            const uploadFormData = new FormData();
            uploadFormData.append('image', file);

            const response = await fetch(`${API_BASE_URL}/upload/image`, {
                method: 'POST',
                body: uploadFormData
            });

            const data = await response.json();

            if (response.ok && data.url) {
                setFormData(prev => ({
                    ...prev,
                    image: data.url
                }));
                // Clear selected file after successful upload
                setSelectedFile(null);
                console.log('Image uploaded successfully, URL:', data.url);
            } else {
                alert(data.error || '图片上传失败，请重试');
                console.error('Upload error:', data);
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('网络错误，请重试');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate required fields
        const missingFields = [];
        if (!formData.name || formData.name.trim() === '') missingFields.push('名字');
        if (!formData.age || formData.age.trim() === '') missingFields.push('年龄');
        if (!formData.breed || formData.breed.trim() === '') missingFields.push('品种');
        if (!formData.location || formData.location.trim() === '') missingFields.push('位置');
        if (!formData.image || formData.image.trim() === '') {
            // Check if file is selected but not uploaded yet
            if (selectedFile) {
                alert('请先上传图片，然后再提交表单');
                return;
            }
            missingFields.push('图片');
        }
        
        if (missingFields.length > 0) {
            alert(`请填写所有必填项：${missingFields.join('、')}`);
            console.log('Form data:', formData); // Debug log
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_BASE_URL}/dog-submissions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    ...formData
                })
            });

            const data = await response.json();

            if (response.ok) {
                setStep(3); // Success step
            } else {
                alert(data.error || '提交失败，请重试');
            }
        } catch (error) {
            console.error('Error submitting dog:', error);
            alert('网络错误，请核对后端是否开启');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (step === 3) {
        return (
            <div className="max-w-[430px] mx-auto min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark p-6 text-center pb-24">
                <div className="size-24 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-6xl text-primary">check_circle</span>
                </div>
                <h2 className="text-3xl font-bold mb-2 text-[#1b120e] dark:text-white">提交成功！</h2>
                <p className="text-warm-beige mb-10">您的小狗信息已提交，我们会尽快审核，审核通过后将发布到平台上供其他用户查看。</p>
                <button
                    onClick={() => navigate('/profile')}
                    className="w-full bg-primary text-white font-bold h-14 rounded-xl"
                >
                    返回个人中心
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-[430px] mx-auto min-h-screen flex flex-col pb-24 bg-background-light dark:bg-background-dark text-[#1b120e] dark:text-[#fcf9f8]">
            <header className="flex items-center bg-background-light dark:bg-background-dark p-4 sticky top-0 z-10">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                >
                    <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
                </button>
                <h2 className="text-center text-lg font-bold leading-tight tracking-tight flex-1 mr-10">发布小狗</h2>
            </header>

            <div className="flex flex-col gap-3 px-6 py-4">
                <div className="flex gap-6 justify-between items-end">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-widest text-primary/80">步骤 {step.toString().padStart(2, '0')}</span>
                        <p className="text-xl font-bold leading-normal">{step === 1 ? '基本信息' : '详细信息'}</p>
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
                            <span className="material-symbols-outlined text-primary">pets</span>
                            小狗基本信息
                        </h3>
                        <div className="space-y-5">
                            <label className="flex flex-col w-full">
                                <p className="text-sm font-semibold mb-2 ml-1 opacity-80">名字 <span className="text-red-500">*</span></p>
                                <input
                                    required
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-[#e7d7d0] dark:border-zinc-600 bg-background-light dark:bg-zinc-900 h-14 px-4"
                                    placeholder="请输入小狗的名字"
                                />
                            </label>
                            <label className="flex flex-col w-full">
                                <p className="text-sm font-semibold mb-2 ml-1 opacity-80">年龄 <span className="text-red-500">*</span></p>
                                <input
                                    required
                                    name="age"
                                    value={formData.age}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-[#e7d7d0] dark:border-zinc-600 bg-background-light dark:bg-zinc-900 h-14 px-4"
                                    placeholder="例如：2岁、3个月"
                                />
                            </label>
                            <label className="flex flex-col w-full">
                                <p className="text-sm font-semibold mb-2 ml-1 opacity-80">品种 <span className="text-red-500">*</span></p>
                                <input
                                    required
                                    name="breed"
                                    value={formData.breed}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-[#e7d7d0] dark:border-zinc-600 bg-background-light dark:bg-zinc-900 h-14 px-4"
                                    placeholder="例如：金毛寻回犬、柯基"
                                />
                            </label>
                            <label className="flex flex-col w-full">
                                <p className="text-sm font-semibold mb-2 ml-1 opacity-80">位置 <span className="text-red-500">*</span></p>
                                <input
                                    required
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-[#e7d7d0] dark:border-zinc-600 bg-background-light dark:bg-zinc-900 h-14 px-4"
                                    placeholder="例如：北京市朝阳区"
                                />
                            </label>
                            <label className="flex flex-col w-full">
                                <p className="text-sm font-semibold mb-2 ml-1 opacity-80">小狗照片 <span className="text-red-500">*</span></p>
                                
                                {/* Image Preview */}
                                {imagePreview && (
                                    <div className="mb-3">
                                        <img 
                                            src={imagePreview} 
                                            alt="预览" 
                                            className="w-full h-48 object-cover rounded-lg border border-[#e7d7d0] dark:border-zinc-600"
                                        />
                                    </div>
                                )}

                                {/* File Input */}
                                <div className="flex gap-2">
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        id="image-upload"
                                    />
                                    <label
                                        htmlFor="image-upload"
                                        className="flex-1 h-14 rounded-lg border border-[#e7d7d0] dark:border-zinc-600 bg-background-light dark:bg-zinc-900 px-4 flex items-center justify-center cursor-pointer hover:bg-primary/5 transition-colors"
                                    >
                                        <span className="material-symbols-outlined mr-2">image</span>
                                        <span className="text-sm">{selectedFile ? selectedFile.name : '选择图片'}</span>
                                    </label>
                                    {selectedFile && !formData.image && (
                                        <button
                                            type="button"
                                            onClick={handleImageUpload}
                                            disabled={isUploading}
                                            className="px-4 h-14 bg-primary text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isUploading ? '上传中...' : '上传'}
                                        </button>
                                    )}
                                </div>

                                {/* Uploaded URL Display */}
                                {formData.image && (
                                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <p className="text-xs text-green-700 dark:text-green-300 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">check_circle</span>
                                            图片已上传
                                        </p>
                                        <p className="text-xs text-green-600 dark:text-green-400 mt-1 truncate">{formData.image}</p>
                                    </div>
                                )}

                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 ml-1">
                                    支持 jpeg, jpg, png, gif, webp 格式，最大 5MB
                                </p>
                            </label>
                        </div>
                    </div>
                ) : (
                    <div className="bg-card-light dark:bg-zinc-800 rounded-xl p-5 shadow-sm border border-[#e7d7d0]/30 dark:border-zinc-700">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">info</span>
                            详细信息
                        </h3>
                        <div className="space-y-5">
                            <div>
                                <p className="text-sm font-semibold mb-4 opacity-80">性别</p>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(p => ({ ...p, gender: '公' }))}
                                        className={`flex-1 h-14 rounded-lg border-2 font-medium ${formData.gender === '公' ? 'border-primary text-primary bg-primary/5' : 'border-[#e7d7d0] dark:border-zinc-600'}`}
                                    >
                                        公
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(p => ({ ...p, gender: '母' }))}
                                        className={`flex-1 h-14 rounded-lg border-2 font-medium ${formData.gender === '母' ? 'border-primary text-primary bg-primary/5' : 'border-[#e7d7d0] dark:border-zinc-600'}`}
                                    >
                                        母
                                    </button>
                                </div>
                            </div>
                            <label className="flex flex-col w-full">
                                <p className="text-sm font-semibold mb-2 ml-1 opacity-80">描述（可选）</p>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full rounded-lg border border-[#e7d7d0] dark:border-zinc-600 bg-background-light dark:bg-zinc-900 px-4 py-3 resize-none"
                                    placeholder="请描述小狗的性格、习惯、健康状况等信息..."
                                />
                            </label>
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
                    {isSubmitting ? '正在提交...' : (step === 1 ? '下一步' : '提交发布')}
                    {!isSubmitting && <span className="material-symbols-outlined">arrow_forward</span>}
                </button>
            </div>

            <BottomNav />
        </form>
    );
};

export default SubmitDog;
