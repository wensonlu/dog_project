const FORUM_HISTORY_KEY = 'forum_browse_history';
const MAX_HISTORY = 50;

/**
 * 添加一条论坛浏览记录
 * @param {{ id: string|number, title: string }} item
 */
export function addForumBrowseHistory(item) {
  if (!item?.id || !item?.title) return;
  try {
    const raw = localStorage.getItem(FORUM_HISTORY_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const viewedAt = new Date().toISOString();
    const newEntry = { id: String(item.id), title: item.title, viewedAt };
    const filtered = list.filter((e) => e.id !== newEntry.id);
    const next = [newEntry, ...filtered].slice(0, MAX_HISTORY);
    localStorage.setItem(FORUM_HISTORY_KEY, JSON.stringify(next));
  } catch (_) {
    // ignore
  }
}

/**
 * 获取论坛浏览记录列表（按浏览时间倒序）
 * @returns {{ id: string, title: string, viewedAt: string }[]}
 */
export function getForumBrowseHistory() {
  try {
    const raw = localStorage.getItem(FORUM_HISTORY_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (_) {
    return [];
  }
}

/**
 * 清空浏览记录
 */
export function clearForumBrowseHistory() {
  try {
    localStorage.removeItem(FORUM_HISTORY_KEY);
  } catch (_) {}
}
