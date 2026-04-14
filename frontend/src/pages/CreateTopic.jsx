import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import BottomNav from '../components/BottomNav';
import { categories } from '../data/mockForum';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

const CreateTopic = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 模式选择：'select' | 'ai' | 'manual'
  const [mode, setMode] = useState('select');

  // AI模式状态
  const [keywords, setKeywords] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // 话题内容状态
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('领养经验');
  const [tags, setTags] = useState('');
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const categoryOptions = categories.filter(cat => cat.id !== 'all');

  // AI生成话题内容
  const handleAIGenerate = async () => {
    if (!keywords.trim()) {
      setError('请输入关键词');
      return;
    }

    if (keywords.trim().length < 3) {
      setError('关键词至少需要3个字符');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/forum/ai-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: keywords.trim() })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || '生成失败，请重试');
      }

      // 设置生成的内容
      setTitle(data.data.title);
      setContent(data.data.content);
      setSelectedCategory(data.data.category);
      setTags(data.data.tags.join(', '));
      setGeneratedContent(data.data);
      setRetryCount(prev => prev + 1);
    } catch (err) {
      console.error('AI生成失败:', err);
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // 重新生成
  const handleRetry = () => {
    if (retryCount >= 3) {
      setError('已达到最大重试次数（3次），建议编辑现有内容');
      return;
    }
    handleAIGenerate();
  };

  // 图片上传处理
  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 9) {
      setError('最多只能上传9张图片');
      return;
    }

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        if (file.size > 5 * 1024 * 1024) {
          setError(`图片 ${file.name} 大小不能超过 5MB`);
          continue;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          setImagePreviews(prev => [...prev, event.target.result]);
        };
        reader.readAsDataURL(file);

        setIsUploading(true);
        try {
          const uploadFormData = new FormData();
          uploadFormData.append('image', file);

          const uploadResponse = await fetch(`${API_BASE_URL}/upload/image`, {
            method: 'POST',
            body: uploadFormData
          });

          const uploadData = await uploadResponse.json();

          if (uploadResponse.ok && uploadData.url) {
            setImageUrls(prev => [...prev, uploadData.url]);
            setImages(prev => [...prev, file]);
          } else {
            setError(uploadData.error || '图片上传失败，请重试');
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          setError('图片上传失败，请重试');
        } finally {
          setIsUploading(false);
        }
      }
    }
  };

  const handleRemoveImage = (index) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  // 提交话题
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      setError('请填写标题和内容');
      return;
    }

    if (!user?.id) {
      setError('请先登录');
      navigate('/login');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/forum`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category: selectedCategory,
          tags: tags.split(',').map(t => t.trim()).filter(t => t),
          images: imageUrls,
          userId: user.id
        })
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/forum');
      } else {
        setError(data.error || '发布失败，请重试');
      }
    } catch (error) {
      console.error('Error creating topic:', error);
      setError('网络错误，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[430px] mx-auto min-h-screen flex flex-col bg-background-light dark:bg-background-dark pb-24">
      {/* 头部 */}
      <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-6 pt-6 pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/forum')}
            className="size-10 rounded-full bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center text-[#1b120e] dark:text-white"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold text-[#1b120e] dark:text-white flex-1">发布话题</h1>
          <div className="size-10"></div>
        </div>
      </header>

      <main className="flex-1 px-6 pt-4 overflow-y-auto">
        {/* 模式选择 */}
        {mode === 'select' && (
          <div className="space-y-4">
            <p className="text-center text-warm-beige mb-6">选择发帖方式</p>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode('ai')}
              className="w-full h-20 bg-gradient-to-r from-primary to-purple-500 text-white rounded-2xl shadow-lg flex items-center justify-center gap-3"
            >
              <span className="material-symbols-outlined text-3xl">auto_awesome</span>
              <div className="text-left">
                <div className="font-bold text-lg">AI帮我写</div>
                <div className="text-sm opacity-90">输入关键词，快速生成</div>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode('manual')}
              className="w-full h-20 bg-white dark:bg-zinc-800 text-[#1b120e] dark:text-white rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 flex items-center justify-center gap-3"
            >
              <span className="material-symbols-outlined text-3xl">edit</span>
              <div className="text-left">
                <div className="font-bold text-lg">我自己写</div>
                <div className="text-sm text-warm-beige">完整表单，自由编辑</div>
              </div>
            </motion.button>
          </div>
        )}

        {/* AI模式 */}
        {mode === 'ai' && !generatedContent && (
          <div className="space-y-4">
            <button
              onClick={() => setMode('select')}
              className="text-warm-beige text-sm flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              返回选择
            </button>

            <div>
              <label className="block text-sm font-bold text-[#1b120e] dark:text-white mb-2">
                关键词
              </label>
              <textarea
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="输入关键词，如：金毛领养经验、第一次养狗注意事项"
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#1b120e] dark:text-white placeholder-warm-beige focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
              <p className="text-xs text-warm-beige mt-1">多个关键词用逗号或空格分隔</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <button
              onClick={handleAIGenerate}
              disabled={isGenerating || !keywords.trim()}
              className="w-full h-14 bg-gradient-to-r from-primary to-purple-500 text-white rounded-xl font-bold disabled:opacity-50"
            >
              {isGenerating ? '生成中...' : '生成话题内容'}
            </button>
          </div>
        )}

        {/* AI加载动画 */}
        {mode === 'ai' && isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="size-16 mx-auto mb-3 rounded-full bg-purple-500 flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-white text-3xl">auto_awesome</span>
            </motion.div>
            <p className="text-purple-700 dark:text-purple-300 font-medium">
              AI正在为你创作内容...
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              预计需要 5-10 秒
            </p>
          </motion.div>
        )}

        {/* 卡片预览区 */}
        {mode === 'ai' && generatedContent && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <button
              onClick={() => {
                setGeneratedContent(null);
                setMode('ai');
              }}
              className="text-warm-beige text-sm flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              重新输入关键词
            </button>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-5 border border-purple-200 dark:border-purple-800">
              {/* 标题 */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-purple-700 dark:text-purple-300 mb-2">
                  标题
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-12 px-4 rounded-lg border border-purple-200 dark:border-purple-700 bg-white dark:bg-zinc-900"
                />
              </div>

              {/* 分类 */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-purple-700 dark:text-purple-300 mb-2">
                  分类
                </label>
                <div className="flex gap-2 flex-wrap">
                  {['领养经验', '日常分享', '求助问答'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                        selectedCategory === cat
                          ? 'bg-primary text-white'
                          : 'bg-white dark:bg-zinc-800 text-warm-beige border border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* 内容 */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-purple-700 dark:text-purple-300 mb-2">
                  内容
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 rounded-lg border border-purple-200 dark:border-purple-700 bg-white dark:bg-zinc-900 resize-none"
                />
              </div>

              {/* 标签 */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-purple-700 dark:text-purple-300 mb-2">
                  标签（用逗号分隔）
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full h-12 px-4 rounded-lg border border-purple-200 dark:border-purple-700 bg-white dark:bg-zinc-900"
                />
              </div>

              {/* 图片上传 */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-purple-700 dark:text-purple-300 mb-2">
                  图片（最多9张）
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-700">
                      <img src={preview} alt={`预览 ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 size-6 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ))}
                  {imagePreviews.length < 9 && (
                    <label className="aspect-square rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                      <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
                      <span className="material-symbols-outlined text-2xl text-warm-beige mb-1">add_photo_alternate</span>
                      <span className="text-xs text-warm-beige">添加图片</span>
                    </label>
                  )}
                </div>
              </div>

              {/* 成本提示 */}
              <p className="text-xs text-purple-600 dark:text-purple-400 mb-4">
                本次生成成本：约${generatedContent.cost || 0.03}
              </p>

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={retryCount >= 3}
                  className="flex-1 h-12 border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 rounded-lg font-medium disabled:opacity-50"
                >
                  重新生成 ({3 - retryCount}/3)
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !title.trim() || !content.trim()}
                  className="flex-1 h-12 bg-primary text-white rounded-lg font-medium shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? '发布中...' : '发布话题'}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* 传统模式 */}
        {mode === 'manual' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <button
              type="button"
              onClick={() => setMode('select')}
              className="text-warm-beige text-sm flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              返回选择
            </button>

            {/* 标题 */}
            <div>
              <label className="block text-sm font-bold text-[#1b120e] dark:text-white mb-2">
                标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="请输入话题标题"
                className="w-full h-12 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#1b120e] dark:text-white placeholder-warm-beige focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>

            {/* 分类 */}
            <div>
              <label className="block text-sm font-bold text-[#1b120e] dark:text-white mb-2">
                分类 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {categoryOptions.map(category => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.name)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                      selectedCategory === category.name
                        ? 'bg-primary text-white'
                        : 'bg-white dark:bg-zinc-800 text-warm-beige border border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 内容 */}
            <div>
              <label className="block text-sm font-bold text-[#1b120e] dark:text-white mb-2">
                内容 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="分享你的想法、经验或问题..."
                rows={8}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#1b120e] dark:text-white placeholder-warm-beige focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                required
              />
            </div>

            {/* 标签 */}
            <div>
              <label className="block text-sm font-bold text-[#1b120e] dark:text-white mb-2">
                标签（用逗号分隔）
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="例如：新手, 金毛, 领养"
                className="w-full h-12 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#1b120e] dark:text-white placeholder-warm-beige focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-warm-beige mt-1">多个标签请用逗号分隔</p>
            </div>

            {/* 图片上传 */}
            <div>
              <label className="block text-sm font-bold text-[#1b120e] dark:text-white mb-2">
                图片（最多9张）
              </label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-700">
                    <img src={preview} alt={`预览 ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 size-6 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                ))}
                {imagePreviews.length < 9 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
                    <span className="material-symbols-outlined text-2xl text-warm-beige mb-1">add_photo_alternate</span>
                    <span className="text-xs text-warm-beige">添加图片</span>
                  </label>
                )}
              </div>
            </div>

            {/* 提交按钮 */}
            <div className="pt-4 pb-8">
              <button
                type="submit"
                disabled={isSubmitting || !title.trim() || !content.trim()}
                className="w-full h-14 bg-primary text-white rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-lg shadow-primary/30"
              >
                {isSubmitting ? '发布中...' : '发布话题'}
              </button>
            </div>
          </form>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default CreateTopic;