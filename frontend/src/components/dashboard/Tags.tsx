'use client';

import { useEffect } from 'react';
import { useTags } from '@/contexts/TagsContext';

interface TagsProps {
  onSelectTag: (tagId: string | null) => void;
  selectedTag: string | null;
}

export default function Tags({ onSelectTag, selectedTag }: TagsProps) {
  const { tags, loading } = useTags();

  if (loading) {
    return <div className="animate-pulse text-neutral-400">Loading tags...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-neutral-800 mb-6">Tags</h2>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag._id}
            onClick={() => onSelectTag(selectedTag === tag._id ? null : tag._id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              selectedTag === tag._id
                ? 'bg-neutral-800 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            {tag.name}
          </button>
        ))}
        {tags.length === 0 && (
          <p className="text-center w-full text-neutral-500 py-4">
            No tags yet. Tags will appear here as you add them to bookmarks.
          </p>
        )}
      </div>
    </div>
  );
}