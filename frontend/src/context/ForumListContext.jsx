/* eslint-disable react-refresh/only-export-components -- context exports provider + hook */
import React, { createContext, useContext, useRef, useState, useCallback } from 'react';

const ForumListContext = createContext(null);

export function ForumListProvider({ children }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [scrollPosition, setScrollPosition] = useState(null);
  const listScrollRef = useRef(null);
  /** 从列表进入详情时置为 true，用于返回时跳过 refetch（避免依赖 state 时序） */
  const skipNextFetchRef = useRef(false);

  const saveScrollPosition = useCallback(() => {
    if (listScrollRef.current != null) {
      setScrollPosition(listScrollRef.current.scrollTop);
      skipNextFetchRef.current = true;
    }
  }, []);

  const value = {
    topics,
    setTopics,
    loading,
    setLoading,
    error,
    setError,
    selectedCategory,
    setSelectedCategory,
    selectedSort,
    setSelectedSort,
    searchQuery,
    setSearchQuery,
    scrollPosition,
    setScrollPosition,
    listScrollRef,
    saveScrollPosition,
    skipNextFetchRef,
  };

  return (
    <ForumListContext.Provider value={value}>
      {children}
    </ForumListContext.Provider>
  );
}

export function useForumListContext() {
  const ctx = useContext(ForumListContext);
  return ctx;
}
