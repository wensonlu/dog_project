// frontend/src/hooks/useChatSession.js

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { CHAT_API } from '../config';

const SESSION_STORAGE_KEY = 'chat_session_id';

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
        const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);

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
        if (user?.id) {
          localStorage.setItem(SESSION_STORAGE_KEY, data.session_id);
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
  }, [user?.id]);

  // 清空会话（未登录用户刷新页面时调用）
  const clearSession = useCallback(() => {
    if (!user?.id) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
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

      localStorage.removeItem(SESSION_STORAGE_KEY);
      setSessionId(null);
    } catch (err) {
      console.error('Delete session error:', err);
      setError(err.message);
    }
  }, [user?.token]);

  return {
    sessionId,
    loading,
    error,
    clearSession,
    deleteSession
  };
}
