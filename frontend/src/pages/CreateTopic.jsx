import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { categories } from '../data/mockForum';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

const CreateTopic = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('adoption');
  const [tags, setTags] = useState('');
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const categoryOptions = categories.filter(cat => cat.id !== 'all');

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 9) {
      alert('最多只能上传9张图片');
      return;
    }

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert(`图片 ${file.name} 大小不能超过 5MB`);
          continue;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (event) => {
          setImagePreviews(prev => [...prev, event.target.result]);
        };
        reader.readAsDataURL(file);

        // Upload image
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
            alert(uploadData.error || '图片上传失败，请重试');
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          alert('图片上传失败，请重试');
        } finally {
          setIsUploading(false);
        }
      }
    }
  };

  const handleRemoveImage = (index) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      alert('请填写标题和内容');
      return;
    }

    if (!user?.id) {
      alert('请先登录');
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
        alert(data.error || '发布失败，请重试');
      }
    } catch (error) {
      console.error('Error creating topic:', error);
      alert('网络错误，请重试');
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

      {/* 表单 */}
      <main className="flex-1 px-6 pt-4 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
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
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                    selectedCategory === category.id
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
                  <img
                    src={preview}
                    alt={`预览 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
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
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
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
      </main>

      <BottomNav />
    </div>
  );
};

export default CreateTopic;
