import { useState } from 'react';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../config/api';

/**
 * AI 宠物简历生成器组件
 * 用于在宠物上传流程中生成AI简历和性格标签
 */
const AIPetBioGenerator = ({ dogId, petInfo, onGenerated }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBio, setGeneratedBio] = useState('');
  const [traits, setTraits] = useState([]);
  const [error, setError] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setShowResult(false);

    try {
      const response = await fetch(`${API_BASE_URL}/agent/${dogId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || '生成失败');
      }

      setGeneratedBio(data.data.bio);
      setTraits(data.data.traits);
      setShowResult(true);

      // 回调父组件
      if (onGenerated) {
        onGenerated({
          bio: data.data.bio,
          traits: data.data.traits,
          agentId: data.data.agentId,
        });
      }
    } catch (err) {
      console.error('AI生成失败:', err);
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditBio = (newBio) => {
    setGeneratedBio(newBio);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/agent/${dogId}/content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bio: generatedBio,
          personalityTraits: traits,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || '保存失败');
      }

      // 保存成功后隐藏结果
      setShowResult(false);
    } catch (err) {
      console.error('保存失败:', err);
      setError(err.message);
    }
  };

  return (
    <div className="mt-4">
      {/* 生成按钮 */}
      {!showResult && (
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full h-14 bg-gradient-to-r from-primary to-purple-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="size-6 border-2 border-white border-t-transparent rounded-full"
              />
              <span>AI 正在分析照片...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">auto_awesome</span>
              <span>生成 AI 简历</span>
            </>
          )}
        </button>
      )}

      {/* 加载动画 */}
      {isGenerating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="size-12 mx-auto mb-2 rounded-full bg-purple-500 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-white text-2xl">pets</span>
          </motion.div>
          <p className="text-sm text-purple-700 dark:text-purple-300">
            AI正在根据 {petInfo?.name || '宠物'} 的照片和基本信息生成领养简历...
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
            预计需要 5-10 秒
          </p>
        </motion.div>
      )}

      {/* 错误提示 */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
        >
          <p className="text-sm text-red-700 dark:text-red-300 flex items-center gap-1">
            <span className="material-symbols-outlined">error</span>
            {error}
          </p>
        </motion.div>
      )}

      {/* 生成结果 */}
      {showResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-5 border border-purple-200 dark:border-purple-800"
        >
          {/* 性格标签 */}
          <div className="mb-4">
            <p className="text-sm font-semibold mb-2 text-purple-700 dark:text-purple-300">
              性格标签
            </p>
            <div className="flex flex-wrap gap-2">
              {traits.map((trait, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="px-3 py-1 bg-primary text-white text-sm rounded-full font-medium shadow-sm"
                >
                  {trait}
                </motion.span>
              ))}
            </div>
          </div>

          {/* 简历内容 */}
          <div className="mb-4">
            <p className="text-sm font-semibold mb-2 text-purple-700 dark:text-purple-300">
              领养简历
            </p>
            <textarea
              value={generatedBio}
              onChange={(e) => handleEditBio(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-purple-200 dark:border-purple-700 bg-white dark:bg-zinc-900 px-4 py-3 resize-none text-sm leading-relaxed"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              您可以编辑简历内容，让它更贴近真实情况
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowResult(false)}
              className="flex-1 h-12 border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 rounded-lg font-medium"
            >
              重新生成
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 h-12 bg-primary text-white rounded-lg font-medium shadow-md"
            >
              保存并使用
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AIPetBioGenerator;