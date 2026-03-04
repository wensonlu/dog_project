// Mock 用户数据
export const mockUsers = [
  {
    id: 1,
    name: '爱狗人士小王',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6ZfAu74fVn19xwt_mCCWmnG0o7CZVapQ8kcQLS4X-Bq4t9inNQHpNA2CtIDIILlKL7BEwdeDFD1ir1ExQXcadXX1G0ZeCruY06uZCg-nslkcMsFEssRFlRG9WUkpJ1A6HzO8kRmhQdRu6pihqtzjdpfK-FD-VL3z-S_AoQG8KrdjqvQ3CSQdDha2DtsEiRkV3RGcfoZHR12Ii9gsm_0C6CJ79z0Hu7LkUOIdgB5G5XcVAN8qPe5tGxLh1fauXT7-L58wrQ_eXFM0'
  },
  {
    id: 2,
    name: '宠物达人',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6ZfAu74fVn19xwt_mCCWmnG0o7CZVapQ8kcQLS4X-Bq4t9inNQHpNA2CtIDIILlKL7BEwdeDFD1ir1ExQXcadXX1G0ZeCruY06uZCg-nslkcMsFEssRFlRG9WUkpJ1A6HzO8kRmhQdRu6pihqtzjdpfK-FD-VL3z-S_AoQG8KrdjqvQ3CSQdDha2DtsEiRkV3RGcfoZHR12Ii9gsm_0C6CJ79z0Hu7LkUOIdgB5G5XcVAN8qPe5tGxLh1fauXT7-L58wrQ_eXFM0'
  },
  {
    id: 3,
    name: '金毛爱好者',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6ZfAu74fVn19xwt_mCCWmnG0o7CZVapQ8kcQLS4X-Bq4t9inNQHpNA2CtIDIILlKL7BEwdeDFD1ir1ExQXcadXX1G0ZeCruY06uZCg-nslkcMsFEssRFlRG9WUkpJ1A6HzO8kRmhQdRu6pihqtzjdpfK-FD-VL3z-S_AoQG8KrdjqvQ3CSQdDha2DtsEiRkV3RGcfoZHR12Ii9gsm_0C6CJ79z0Hu7LkUOIdgB5G5XcVAN8qPe5tGxLh1fauXT7-L58wrQ_eXFM0'
  },
  {
    id: 4,
    name: '新手铲屎官',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6ZfAu74fVn19xwt_mCCWmnG0o7CZVapQ8kcQLS4X-Bq4t9inNQHpNA2CtIDIILlKL7BEwdeDFD1ir1ExQXcadXX1G0ZeCruY06uZCg-nslkcMsFEssRFlRG9WUkpJ1A6HzO8kRmhQdRu6pihqtzjdpfK-FD-VL3z-S_AoQG8KrdjqvQ3CSQdDha2DtsEiRkV3RGcfoZHR12Ii9gsm_0C6CJ79z0Hu7LkUOIdgB5G5XcVAN8qPe5tGxLh1fauXT7-L58wrQ_eXFM0'
  },
  {
    id: 5,
    name: '柯基小主人',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6ZfAu74fVn19xwt_mCCWmnG0o7CZVapQ8kcQLS4X-Bq4t9inNQHpNA2CtIDIILlKL7BEwdeDFD1ir1ExQXcadXX1G0ZeCruY06uZCg-nslkcMsFEssRFlRG9WUkpJ1A6HzO8kRmhQdRu6pihqtzjdpfK-FD-VL3z-S_AoQG8KrdjqvQ3CSQdDha2DtsEiRkV3RGcfoZHR12Ii9gsm_0C6CJ79z0Hu7LkUOIdgB5G5XcVAN8qPe5tGxLh1fauXT7-L58wrQ_eXFM0'
  }
];

// Mock 话题数据
export const mockTopics = [
  {
    id: 1,
    title: '第一次领养狗狗需要注意什么？',
    content: '最近想领养一只金毛，但是第一次养狗，不知道需要注意哪些事项。希望有经验的朋友可以分享一下，包括：\n1. 领养前的准备工作\n2. 狗狗到家后的适应期\n3. 日常护理要点\n4. 训练建议\n\n谢谢大家！',
    author: mockUsers[0],
    category: '领养经验',
    tags: ['新手', '金毛', '领养'],
    images: [
      'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800',
      'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800'
    ],
    likes: 24,
    comments: 8,
    views: 156,
    createdAt: '2026-01-19T14:30:00Z',
    isLiked: false
  },
  {
    id: 2,
    title: '我家柯基的日常分享',
    content: '今天带我家小柯基去公园玩，它超级开心！分享几张照片给大家看看～',
    author: mockUsers[4],
    category: '日常分享',
    tags: ['柯基', '日常', '萌宠'],
    images: [
      'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800',
      'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800',
      'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800'
    ],
    likes: 45,
    comments: 12,
    views: 289,
    createdAt: '2026-01-19T10:15:00Z',
    isLiked: true
  },
  {
    id: 3,
    title: '求助：狗狗突然不吃东西怎么办？',
    content: '我家狗狗昨天开始就不怎么吃东西了，平时很爱吃的狗粮现在闻都不闻。精神状态还可以，就是食欲不好。有没有遇到过类似情况的朋友？需要带去看医生吗？',
    author: mockUsers[3],
    category: '求助问答',
    tags: ['求助', '健康', '紧急'],
    images: [],
    likes: 8,
    comments: 15,
    views: 203,
    createdAt: '2026-01-19T08:00:00Z',
    isLiked: false
  },
  {
    id: 4,
    title: '分享一个训练狗狗的好方法',
    content: '最近发现一个很有效的训练方法，分享给大家：\n\n使用正向强化训练，每次狗狗做对动作就立即给予奖励（零食或抚摸），坚持一周就能看到明显效果。关键是要有耐心，不要急躁。',
    author: mockUsers[1],
    category: '领养经验',
    tags: ['训练', '方法', '经验'],
    images: [
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800'
    ],
    likes: 32,
    comments: 6,
    views: 178,
    createdAt: '2026-01-18T16:45:00Z',
    isLiked: false
  },
  {
    id: 5,
    title: '金毛的日常护理心得',
    content: '养金毛已经三年了，总结了一些日常护理的心得：\n1. 每天梳毛很重要，可以减少掉毛\n2. 定期洗澡，但不要太频繁\n3. 注意耳朵清洁，金毛容易得耳炎\n4. 保持运动量，金毛需要大量运动\n\n希望对新手有帮助！',
    author: mockUsers[2],
    category: '日常分享',
    tags: ['金毛', '护理', '心得'],
    images: [
      'https://images.unsplash.com/photo-1534361960057-19889d0d8eae?w=800'
    ],
    likes: 56,
    comments: 9,
    views: 342,
    createdAt: '2026-01-18T12:20:00Z',
    isLiked: true
  },
  {
    id: 6,
    title: '寻找一起遛狗的小伙伴',
    content: '坐标上海，想找附近一起遛狗的朋友。我家是边牧，性格很活泼，希望能找到玩伴。周末可以一起带狗狗去公园玩！',
    author: mockUsers[0],
    category: '求助问答',
    tags: ['交友', '遛狗', '上海'],
    images: [],
    likes: 18,
    comments: 5,
    views: 124,
    createdAt: '2026-01-17T20:30:00Z',
    isLiked: false
  }
];

// Mock 评论数据
export const mockComments = [
  {
    id: 1,
    topicId: 1,
    author: mockUsers[1],
    content: '领养前一定要准备好狗狗的用品，包括狗窝、食盆、玩具等。还要提前了解狗狗的饮食习惯。',
    likes: 12,
    replies: 2,
    createdAt: '2026-01-19T15:00:00Z',
    isLiked: false
  },
  {
    id: 2,
    topicId: 1,
    author: mockUsers[2],
    content: '建议先带狗狗去宠物医院做全面体检，确保健康。然后慢慢适应新环境，不要着急。',
    likes: 8,
    replies: 1,
    createdAt: '2026-01-19T15:30:00Z',
    isLiked: true
  },
  {
    id: 3,
    topicId: 2,
    author: mockUsers[0],
    content: '太可爱了！柯基的小短腿真的好萌～',
    likes: 5,
    replies: 0,
    createdAt: '2026-01-19T11:00:00Z',
    isLiked: false
  },
  {
    id: 4,
    topicId: 2,
    author: mockUsers[3],
    content: '我家也是柯基，可以交流一下养狗心得！',
    likes: 3,
    replies: 1,
    createdAt: '2026-01-19T11:30:00Z',
    isLiked: false
  },
  {
    id: 5,
    topicId: 3,
    author: mockUsers[1],
    content: '建议尽快带去看医生，食欲不振可能是健康问题的信号。',
    likes: 15,
    replies: 3,
    createdAt: '2026-01-19T09:00:00Z',
    isLiked: true
  },
  {
    id: 6,
    topicId: 3,
    author: mockUsers[2],
    content: '可以先观察一下，看看是不是换牙期或者天气原因。如果持续两天以上还是去看医生比较保险。',
    likes: 10,
    replies: 2,
    createdAt: '2026-01-19T09:30:00Z',
    isLiked: false
  },
  {
    id: 7,
    topicId: 4,
    author: mockUsers[0],
    content: '这个方法确实有效，我试过！',
    likes: 7,
    replies: 0,
    createdAt: '2026-01-18T17:30:00Z',
    isLiked: false
  },
  {
    id: 8,
    topicId: 5,
    author: mockUsers[4],
    content: '感谢分享！作为新手很受用。',
    likes: 4,
    replies: 0,
    createdAt: '2026-01-18T13:00:00Z',
    isLiked: false
  }
];

// Mock 回复数据
export const mockReplies = [
  {
    id: 1,
    commentId: 1,
    author: mockUsers[3],
    content: '对，还要准备一些常用药品，比如驱虫药、止泻药等。',
    likes: 3,
    createdAt: '2026-01-19T15:15:00Z',
    isLiked: false
  },
  {
    id: 2,
    commentId: 1,
    author: mockUsers[4],
    content: '同意！提前准备很重要。',
    likes: 2,
    createdAt: '2026-01-19T15:20:00Z',
    isLiked: false
  },
  {
    id: 3,
    commentId: 2,
    author: mockUsers[0],
    content: '是的，体检很重要，可以提前发现问题。',
    likes: 1,
    createdAt: '2026-01-19T15:45:00Z',
    isLiked: false
  },
  {
    id: 4,
    commentId: 4,
    author: mockUsers[4],
    content: '好呀！可以加个好友交流～',
    likes: 2,
    createdAt: '2026-01-19T12:00:00Z',
    isLiked: false
  },
  {
    id: 5,
    commentId: 5,
    author: mockUsers[3],
    content: '谢谢建议，我明天就带它去看医生。',
    likes: 1,
    createdAt: '2026-01-19T10:00:00Z',
    isLiked: false
  },
  {
    id: 6,
    commentId: 5,
    author: mockUsers[4],
    content: '希望狗狗早日康复！',
    likes: 0,
    createdAt: '2026-01-19T10:15:00Z',
    isLiked: false
  },
  {
    id: 7,
    commentId: 5,
    author: mockUsers[0],
    content: '记得带好之前的疫苗本。',
    likes: 1,
    createdAt: '2026-01-19T10:30:00Z',
    isLiked: false
  },
  {
    id: 8,
    commentId: 6,
    author: mockUsers[3],
    content: '好的，我再观察一下，谢谢！',
    likes: 0,
    createdAt: '2026-01-19T10:00:00Z',
    isLiked: false
  },
  {
    id: 9,
    commentId: 6,
    author: mockUsers[1],
    content: '不客气，有问题随时问。',
    likes: 0,
    createdAt: '2026-01-19T10:45:00Z',
    isLiked: false
  }
];

// 分类列表
export const categories = [
  { id: 'all', name: '推荐' },
  { id: 'adoption', name: '领养经验' },
  { id: 'daily', name: '日常分享' },
  { id: 'help', name: '求助问答' }
];

// 排序选项
export const sortOptions = [
  { id: 'latest', name: '最新', icon: 'schedule' },
  { id: 'hot', name: '最热', icon: 'local_fire_department' },
  { id: 'comments', name: '最多评论', icon: 'comment' }
];

// 工具函数：格式化时间（评论/回复用）
// 24 小时内：xx小时前；昨天：昨天 HH:mm；早于昨天：YYYY-MM-DD
export const formatTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 24) {
    const hours = Math.floor(diffHours);
    if (hours < 1) {
      const minutes = Math.floor(diffMs / (1000 * 60));
      return minutes < 1 ? '刚刚' : `${minutes}分钟前`;
    }
    return `${hours}小时前`;
  }

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  if (date >= yesterdayStart && date < todayStart) {
    const h = date.getHours();
    const m = date.getMinutes();
    return `昨天 ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  const y = date.getFullYear();
  const mo = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

// 工具函数：获取话题的评论
export const getTopicComments = (topicId) => {
  return mockComments.filter(comment => comment.topicId === topicId);
};

// 工具函数：获取评论的回复
export const getCommentReplies = (commentId) => {
  return mockReplies.filter(reply => reply.commentId === commentId);
};
