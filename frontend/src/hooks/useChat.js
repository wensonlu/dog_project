// frontend/src/hooks/useChat.js

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CHAT_API } from '../config';

export function useChat(sessionId) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  // 从服务器加载历史消息（已登录用户）
  useEffect(() => {
    if (!sessionId || !user?.id) return;

    const loadHistory = async () => {
      try {
        const response = await fetch(CHAT_API.GET_SESSION(sessionId), {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load history');
        }

        const data = await response.json();
        setMessages(data.messages || []);
      } catch (err) {
        console.error('Load history error:', err);
        // 不中断流程，仅记录错误
      }
    };

    loadHistory();
  }, [sessionId, user?.id, user?.token]);

  // 发送消息
  const sendMessage = useCallback(async (content) => {
    if (!sessionId || !content.trim()) {
      setError('Invalid message or session');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      abortControllerRef.current = new AbortController();

      // 立即添加用户消息到本地
      const userMsg = { role: 'user', content, id: Date.now() };
      setMessages(prev => [...prev, userMsg]);

      // 发送消息并处理流式响应
      const response = await fetch(CHAT_API.SEND_MESSAGE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.token && { 'Authorization': `Bearer ${user.token}` })
        },
        body: JSON.stringify({
          session_id: sessionId,
          content,
          user_id: user?.id || null
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      // 处理流式响应
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let references = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.trim());

        for (const line of lines) {
          try {
            const event = JSON.parse(line);

            if (event.type === 'text_delta') {
              assistantContent += event.text;
              // 实时更新UI
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return [
                    ...prev.slice(0, -1),
                    { ...last, content: assistantContent }
                  ];
                }
                return [...prev, { role: 'assistant', content: event.text }];
              });
            } else if (event.type === 'message_stop') {
              references = event.message;
            }
          } catch (parseError) {
            console.error('Parse stream error:', parseError);
          }
        }
      }

      // 最后一次更新（添加引用）
      if (references) {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return [
              ...prev.slice(0, -1),
              { ...last, ...references }
            ];
          }
          return prev;
        });
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Send message error:', err);
        setError(err.message);
        // 移除用户消息（失败）
        setMessages(prev => prev.slice(0, -1));
      }
    } finally {
      setLoading(false);
    }
  }, [sessionId, user?.token, user?.id]);

  // 停止生成
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    stopGeneration,
    setMessages
  };
}
