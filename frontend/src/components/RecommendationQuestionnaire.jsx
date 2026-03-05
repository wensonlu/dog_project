import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const QUESTIONNAIRE = [
  {
    id: 'living_space',
    question: '您的居住环境是?',
    icon: 'home',
    options: [
      { value: 'apartment_small', label: '小户型公寓', desc: '<60㎡' },
      { value: 'apartment_medium', label: '中户型公寓', desc: '60-120㎡' },
      { value: 'house', label: '独栋房屋', desc: '别墅/大house' }
    ]
  },
  {
    id: 'companion_time',
    question: '每天能陪伴宠物多久?',
    icon: 'schedule',
    options: [
      { value: 'less_2h', label: '少于2小时', desc: '上班族' },
      { value: '2_5h', label: '2-5小时', desc: '有空余时间' },
      { value: 'more_5h', label: '5小时以上', desc: '时间充裕' }
    ]
  },
  {
    id: 'family_members',
    question: '家中是否有小孩或老人?',
    icon: 'family_restroom',
    options: [
      { value: 'yes_kids', label: '有小孩', desc: '需要温顺宠物' },
      { value: 'yes_elderly', label: '有老人', desc: '需要安静宠物' },
      { value: 'no', label: '都没有', desc: '成年人家庭' }
    ]
  },
  {
    id: 'activity_level',
    question: '您希望宠物的活跃程度?',
    icon: 'directions_run',
    options: [
      { value: 'calm', label: '安静型', desc: '不爱运动' },
      { value: 'moderate', label: '适中型', desc: '偶尔散步' },
      { value: 'active', label: '活泼型', desc: '需要大量运动' }
    ]
  },
  {
    id: 'grooming_tolerance',
    question: '能否接受长毛宠物?',
    icon: 'cut',
    options: [
      { value: 'yes', label: '可以接受', desc: '愿意定期美容' },
      { value: 'no', label: '倾向短毛', desc: '打理更方便' }
    ]
  }
];

const STORAGE_KEY = 'pet_recommendation_preferences';
const EXPIRY_DAYS = 90;

export default function RecommendationQuestionnaire({ onSubmit }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 加载本地存储的偏好(如果未过期)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const { preferences, timestamp, version } = JSON.parse(stored);
        const now = Date.now();
        const expiryTime = EXPIRY_DAYS * 24 * 60 * 60 * 1000;

        if (version === '1.0' && (now - timestamp) < expiryTime) {
          setAnswers(preferences);
          if (onSubmit && Object.keys(preferences).length === 5) {
            onSubmit(preferences);
          }
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('加载偏好失败:', error);
    }
  }, []);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async () => {
    const allAnswered = QUESTIONNAIRE.every(q => answers[q.id]);
    if (!allAnswered) {
      return;
    }

    setIsSubmitting(true);

    try {
      const dataToStore = {
        preferences: answers,
        timestamp: Date.now(),
        version: '1.0'
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
      await onSubmit(answers);
      setIsExpanded(false);
    } catch (error) {
      console.error('提交失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setAnswers({});
    localStorage.removeItem(STORAGE_KEY);
    setIsExpanded(true);
  };

  // 如果已有偏好且未展开,显示简化状态
  if (!isExpanded && Object.keys(answers).length === 5) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-2xl backdrop-blur"
      >
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-200/50">
            <span className="material-symbols-outlined text-xl text-white">recommend</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">智能推荐已启用</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">基于您的偏好推荐</p>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleReset}
          className="px-4 py-2 bg-white dark:bg-zinc-800 border border-teal-200 dark:border-teal-700 text-teal-600 dark:text-teal-400 rounded-xl text-sm font-medium hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors"
        >
          重新设置
        </motion.button>
      </motion.div>
    );
  }

  // 如果未展开,显示"获取智能推荐"按钮
  if (!isExpanded) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-gradient-to-br from-rose-50 via-pink-50 to-teal-50 dark:from-rose-900/20 dark:via-pink-900/20 dark:to-teal-900/20 rounded-2xl text-center backdrop-blur"
      >
        <div className="size-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-xl shadow-rose-200/50">
          <span className="material-symbols-outlined text-3xl text-white">psychology</span>
        </div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
          获取个性化推荐
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          回答5个简单问题，为您推荐最合适的小伙伴
        </p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsExpanded(true)}
          className="px-6 py-3 bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-xl font-medium shadow-lg shadow-rose-200/50 hover:shadow-xl transition-shadow active:scale-95"
        >
          开始问卷 ✨
        </motion.button>
      </motion.div>
    );
  }

  // 展开状态: 显示完整问卷
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-6 bg-white/80 dark:bg-zinc-800/80 backdrop-blur rounded-2xl border border-rose-100 dark:border-zinc-700 shadow-xl"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl text-white">quiz</span>
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">个性化推荐问卷</h3>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsExpanded(false)}
          className="size-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 transition-colors"
        >
          <span className="material-symbols-outlined text-xl">expand_less</span>
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        <div className="space-y-5">
          {QUESTIONNAIRE.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-500 text-lg">{question.icon}</span>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {index + 1}. {question.question}
                </label>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {question.options.map(option => (
                  <motion.label
                    key={option.value}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all active:scale-98
                      ${answers[question.id] === option.value
                        ? 'bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/30 dark:to-pink-900/30 border-2 border-rose-400 dark:border-rose-500'
                        : 'bg-zinc-50 dark:bg-zinc-700/50 border border-zinc-200 dark:border-zinc-600 hover:border-rose-300 dark:hover:border-rose-600 active:bg-zinc-100 dark:active:bg-zinc-700'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <input
                        type="radio"
                        name={question.id}
                        value={option.value}
                        checked={answers[question.id] === option.value}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className="size-4 text-rose-500 focus:ring-rose-400 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{option.label}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{option.desc}</p>
                      </div>
                    </div>
                    {answers[question.id] === option.value && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="material-symbols-outlined text-rose-500 text-lg"
                      >
                        check_circle
                      </motion.span>
                    )}
                  </motion.label>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleSubmit}
        disabled={isSubmitting || Object.keys(answers).length < 5}
        className={`
          w-full mt-6 py-3 rounded-xl font-semibold transition-all shadow-lg
          ${Object.keys(answers).length === 5
            ? 'bg-gradient-to-r from-rose-400 to-pink-500 text-white hover:shadow-xl shadow-rose-200/50'
            : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
          }
        `}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            提交中...
          </span>
        ) : (
          `获取推荐 (${Object.keys(answers).length}/5)`
        )}
      </motion.button>
    </motion.div>
  );
}
