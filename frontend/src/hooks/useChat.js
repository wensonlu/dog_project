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
  const authToken = user?.session?.access_token || user?.token || null;

  // 从服务器加载历史消息（已登录用户）
  useEffect(() => {
    if (!sessionId || !user?.id) return;

    const loadHistory = async () => {
      try {
        const response = await fetch(CHAT_API.GET_SESSION(sessionId), {
          headers: {
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
          }
        });

        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          throw new Error(`Failed to load history (${response.status}): ${errText || response.statusText}`);
        }

        const data = await response.json();
        setMessages(data.messages || []);
      } catch (err) {
        console.error('Load history error:', err);
        // 不中断流程，仅记录错误
      }
    };

    loadHistory();
  }, [sessionId, user?.id, authToken]);

  const consumeStreamResponse = useCallback(async (response) => {
    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let assistantContent = '';
    let references = null;
    let streamError = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const rawEvent of events) {
        try {
          const dataLines = rawEvent
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.startsWith('data:'))
            .map(line => line.replace(/^data:\s*/, ''));

          if (dataLines.length === 0) continue;
          const event = JSON.parse(dataLines.join(''));

          if (event.type === 'text_delta') {
            assistantContent += event.text;
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
          } else if (event.type === 'error') {
            streamError = event.error || 'Chat stream error';
            break;
          }
        } catch (parseError) {
          console.error('Parse stream error:', parseError);
        }
      }

      if (streamError) break;
    }

    if (streamError) {
      throw new Error(streamError);
    }

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
  }, []);

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
          ...(authToken && { Authorization: `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          session_id: sessionId,
          content,
          user_id: user?.id || null
        }),
        signal: abortControllerRef.current.signal
      });

      await consumeStreamResponse(response);
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
  }, [sessionId, authToken, user?.id, consumeStreamResponse]);

  const regenerateLastReply = useCallback(async () => {
    if (!sessionId || loading) return;

    const hasUserMessage = messages.some((message) => message.role === 'user');
    if (!hasUserMessage) {
      setError('暂无可重新生成的问题');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      abortControllerRef.current = new AbortController();

      // 先移除末尾助手消息，避免视觉上叠加两条答案
      setMessages((prev) => {
        const next = [...prev];
        while (next.length > 0 && next[next.length - 1]?.role === 'assistant') {
          next.pop();
        }
        return next;
      });

      const response = await fetch(CHAT_API.REGENERATE_MESSAGE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { Authorization: `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          session_id: sessionId
        }),
        signal: abortControllerRef.current.signal
      });

      await consumeStreamResponse(response);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Regenerate message error:', err);
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [sessionId, loading, messages, authToken, consumeStreamResponse]);

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
    regenerateLastReply,
    stopGeneration,
    setMessages
  };
}
