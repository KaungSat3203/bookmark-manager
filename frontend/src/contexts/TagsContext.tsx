"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import fetchApi from '@/lib/api';
import toast from 'react-hot-toast';

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
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/tags');
      setTags(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
