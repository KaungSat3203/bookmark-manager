"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import fetchApi from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

interface Tag {
  _id: string;
  name: string;
}

interface TagsContextValue {
  tags: Tag[];
  loading: boolean;
  refreshTags: () => Promise<void>;
}

const TagsContext = createContext<TagsContextValue | undefined>(undefined);

export const TagsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false); // Start as false since we won't load immediately
  const { isAuthenticated } = useAuth();

  const load = async () => {
    if (!isAuthenticated) {
      setTags([]);
      return;
    }
    
    setLoading(true);
    try {
      const data = await fetchApi('/tags');
      setTags(Array.isArray(data) ? data : []);
    } catch (err) {
      // Only show error if we're authenticated - 401s are expected when not logged in
      if (isAuthenticated) {
        toast.error('Failed to load tags');
      }
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      load();
    } else {
      setTags([]);
    }
  }, [isAuthenticated]);

  const refreshTags = async () => {
    await load();
  };

  return (
    <TagsContext.Provider value={{ tags, loading, refreshTags }}>
      {children}
    </TagsContext.Provider>
  );
};

export const useTags = () => {
  const ctx = useContext(TagsContext);
  if (!ctx) throw new Error('useTags must be used within TagsProvider');
  return ctx;
};
