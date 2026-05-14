// frontend/src/hooks/useChatSession.js

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { CHAT_API } from '../config';

function getSessionStorageKey(userId) {
  return userId ? `chat_session_id_${userId}` : null;
}

export function useChatSession() {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 初始化会话
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setLoading(true);

        // 1. 检查localStorage中是否有sessionId
        const storageKey = getSessionStorageKey(user?.id);
        const storedSessionId = storageKey ? localStorage.getItem(storageKey) : null;

        if (storedSessionId) {
          setSessionId(storedSessionId);
          return;
        }

        // 2. 创建新会话
        const response = await fetch(CHAT_API.CREATE_SESSION, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(user?.token && { 'Authorization': `Bearer ${user.token}` })
          },
          body: JSON.stringify({
            user_id: user?.id || null
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to create session: ${response.statusText}`);
        }

        const data = await response.json();

        // 仅已登录用户保存sessionId
        if (storageKey) {
          localStorage.setItem(storageKey, data.session_id);
        }

        setSessionId(data.session_id);
      } catch (err) {
        console.error('Initialize session error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, [user?.id, user?.token]);

  // 清空会话（未登录用户刷新页面时调用）
  const clearSession = useCallback(() => {
    if (!user?.id) {
      const storageKey = getSessionStorageKey(user?.id);
      if (storageKey) {
        localStorage.removeItem(storageKey);
      }
      setSessionId(null);
    }
  }, [user?.id]);

  // 删除会话
  const deleteSession = useCallback(async (sid) => {
    try {
      const response = await fetch(CHAT_API.DELETE_SESSION(sid), {
        method: 'DELETE',
        headers: {
          ...(user?.token && { 'Authorization': `Bearer ${user.token}` })
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete session');
      }

      const storageKey = getSessionStorageKey(user?.id);
      if (storageKey) {
        localStorage.removeItem(storageKey);
      }
      setSessionId(null);
    } catch (err) {
      console.error('Delete session error:', err);
      setError(err.message);
    }
  }, [user?.token, user?.id]);

  return {
    sessionId,
    loading,
    error,
    clearSession,
    deleteSession
  };
}
