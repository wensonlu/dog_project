# 一级 Tab Keep-Alive + React Query 方案沉淀

## 1. 背景与问题

在移动端交互中，用户频繁在一级 Tab（探索 / 论坛 / 商城 / 故事 / 我的）之间切换。  
原始实现基于路由切换，页面组件会被卸载并重新挂载，导致：

- 页面视觉上出现“重新进入”动画和闪动；
- 列表滚动位置、输入状态等本地状态容易丢失；
- Forum / Stories 这类页面会在重新挂载时触发数据重拉。

目标是实现“像原生 App 一样”的 Tab 体验：

- 切换即时；
- 页面状态保留；
- 减少不必要请求和加载闪烁。

---

## 2. 核心原理

这个方案由两层组成，解决的是两个不同问题：

### 2.1 数据层：React Query 缓存

React Query 负责“服务端状态”：

- 接口结果缓存；
- `staleTime` 内切回页面直接用缓存；
- 统一 loading / error / retry 策略；
- 可通过 `enabled` 控制是否允许当前页面请求。

注意：React Query 只解决“是否重拉数据”，不解决“组件是否重挂载”。

### 2.2 视图层：Keep-Alive 常驻实例

一级 Tab 页面不再仅由路由直接渲染，而是在应用外层常驻挂载：

- 首次进入某个 tab 时挂载一次；
- 离开 tab 时不卸载，仅 `display: none`；
- 再次进入时直接显示，保留组件实例和本地状态。

注意：Keep-Alive 会让隐藏页面继续“活着”，所以需要控制副作用。

---

## 3. 技术方案设计

## 3.1 一级 Tab 常驻容器

在 `AppContent` 中：

- 使用 `useLocation()` 判断当前路由是否命中一级 Tab；
- 使用 `mountedTabs` 记录某个 tab 是否已挂载过；
- 常驻渲染区中根据 `isActive` 做显示/隐藏；
- `Routes` 中一级 tab 路由改为 `element={null}` 占位，避免重复实例。

实现位置：`frontend/src/App.jsx`

参考代码片段：

```jsx
const location = useLocation();
const isHomePath = location.pathname === '/';
const isForumListPath = location.pathname === '/forum';

const [mountedTabs, setMountedTabs] = useState(() => ({
  home: isHomePath,
  forum: isForumListPath,
}));

useEffect(() => {
  if (isHomePath) setMountedTabs((prev) => ({ ...prev, home: true }));
  if (isForumListPath) setMountedTabs((prev) => ({ ...prev, forum: true }));
}, [isHomePath, isForumListPath]);

{mountedTabs.home && (
  <div style={{ display: isHomePath ? 'block' : 'none' }}>
    <Home isActive={isHomePath} />
  </div>
)}
{mountedTabs.forum && (
  <div style={{ display: isForumListPath ? 'block' : 'none' }}>
    <Forum isActive={isForumListPath} />
  </div>
)}

<Routes>
  <Route path="/" element={null} />
  <Route path="/forum" element={null} />
</Routes>
```

---

## 3.2 React Query 全局配置

在应用根部挂载 `QueryClientProvider`，统一默认策略：

- `staleTime: 60_000`
- `gcTime: 10 * 60_000`
- `refetchOnWindowFocus: false`
- `retry: 1`

这样可以降低 tab 切换和前后台切换造成的频繁重拉。

实现位置：`frontend/src/App.jsx`

参考代码片段：

```jsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

<QueryClientProvider client={queryClient}>
  <Router>
    <AppContent />
  </Router>
</QueryClientProvider>
```

---

## 3.3 页面级查询策略

### Forum

- 主列表请求由 `useEffect + fetch` 改为 `useQuery`；
- `staleTime: 30_000`（论坛数据更新更频繁）；
- `enabled: isActive`（隐藏时暂停请求）；
- 保留原有筛选参数作为 queryKey 的一部分，保证缓存命中正确。

实现位置：`frontend/src/pages/Forum.jsx`

参考代码片段：

```jsx
const { data: forumTopics = [], isLoading, error } = useQuery({
  queryKey: ['forum-topics', selectedCategory, selectedSort, searchQuery.trim(), user?.id || null],
  queryFn: async () => {
    const params = new URLSearchParams();
    if (selectedCategory !== 'all') params.append('category', selectedCategory);
    if (selectedSort) params.append('sort', selectedSort);
    if (searchQuery.trim()) params.append('query', searchQuery.trim());
    params.append('format', 'mcp');
    params.append('limit', '30');
    params.append('cursor', '0');
    if (user?.id) params.append('userId', user.id);

    const res = await fetch(`${FORUM_API.LIST}?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch topics');
    const data = await res.json();
    return Array.isArray(data) ? data : (data.items || []);
  },
  staleTime: 30_000,
  refetchOnWindowFocus: false,
  enabled: isActive,
});
```

### Stories

- 分页请求改为 `useInfiniteQuery`；
- `staleTime: 60_000`；
- `enabled: isActive`；
- 分页参数通过 `getNextPageParam` 维护，切换回来列表仍在。

实现位置：`frontend/src/pages/Stories.jsx`

参考代码片段：

```jsx
const {
  data,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
} = useInfiniteQuery({
  queryKey: ['stories-list'],
  queryFn: async ({ pageParam = 1 }) => {
    const res = await fetch(`${API_BASE_URL}/stories?page=${pageParam}&limit=10`);
    if (!res.ok) throw new Error('Fetch stories failed');
    const result = await res.json();
    return { list: result?.data || [], page: pageParam };
  },
  getNextPageParam: (lastPage) => (
    lastPage.list.length === 10 ? lastPage.page + 1 : undefined
  ),
  initialPageParam: 1,
  staleTime: 60_000,
  refetchOnWindowFocus: false,
  enabled: isActive,
});

const stories = data?.pages?.flatMap((p) => p.list) || [];
```

---

## 3.4 副作用 gating（激活态控制）

Keep-Alive 后，隐藏页面不会卸载，因此所有轮询/监听类 effect 必须按激活态控制。

已处理：

- Home：滚动监听、未读消息轮询仅在 `isActive` 时启用；
- Forum：上下文同步、AI summary 请求仅在 `isActive` 时启用；
- Stories：查询本身通过 `enabled` 控制。

实现位置：

- `frontend/src/pages/Home.jsx`
- `frontend/src/pages/Forum.jsx`
- `frontend/src/pages/Stories.jsx`

参考代码片段（Home 的轮询 gating）：

```jsx
useEffect(() => {
  if (!isActive) return undefined;

  const fetchUnreadCount = async () => {
    if (!user?.id) return;
    const response = await fetch(`${API_BASE_URL}/messages/unread/${user.id}`);
    if (response.ok) {
      const data = await response.json();
      setUnreadCount(data.count || 0);
    }
  };

  fetchUnreadCount();
  const interval = setInterval(fetchUnreadCount, 30000);
  return () => clearInterval(interval);
}, [user?.id, isActive]);
```

---

## 4. 方案收益

1. 交互体验更接近原生：切 tab 不再“重新进页面”。
2. 页面状态保留：滚动位置、搜索输入、列表分页等保留。
3. 数据请求更稳定：减少重复请求与 loading 闪动。
4. 策略可扩展：不同页面可以按业务设置不同 `staleTime`。

---

## 5. 风险与权衡

1. 内存占用上升  
页面常驻意味着组件实例和部分数据常驻内存，成本高于纯路由卸载方案。

2. 隐藏页副作用泄漏风险  
若忘记 `isActive` gating，隐藏页仍会轮询/监听，造成额外开销。

3. 首次复杂度上升  
需要维护路由占位、常驻挂载、激活态传递三套逻辑。

---

## 6. 适用边界

推荐使用：

- 移动端一级 Tab；
- 频繁切换且用户期望“回到原状态”的列表页；
- 请求开销较大且缓存收益明显的页面。

不建议使用：

- 高敏感实时页面（必须离开即停止一切逻辑）；
- 体量极大、内存压力明显的复杂页面（需要局部 keep-alive 策略）。

---

## 7. 落地检查清单

每新增一个 keep-alive tab，至少检查以下项：

1. 是否支持 `isActive` 入参；
2. 是否有轮询、事件监听、定时器；隐藏时是否暂停；
3. 远程数据是否走 query 层；
4. query 是否设置合理 `staleTime` 与 `enabled`；
5. 切换 20 次以上是否有闪动、内存异常、重复请求。

---

## 8. 后续优化建议

1. 抽象 `KeepAliveTabHost` 组件  
把 `mountedTabs/isActive` 模式沉淀为通用容器，降低 `App.jsx` 复杂度。

2. 接入 React Query Devtools（开发环境）  
可视化观察 query 命中、失效与重拉。

3. 建立页面副作用规范  
约定“所有轮询/监听必须受 `isActive` 或可见性控制”，减少回归。

4. 建立性能基线  
记录 tab 切换耗时、请求数、内存占用，便于后续回归对比。
