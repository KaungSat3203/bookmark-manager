'use client';

import { useState, useEffect } from 'react';
import fetchApi from '@/lib/api';
import toast from 'react-hot-toast';
import { useTags } from '@/contexts/TagsContext';

interface Bookmark {
  _id: string;
  title: string;
  url: string;
  tags?: Array<{ _id: string; name: string; }>;
  note?: string;
  collectionId?: string | null;
  meta?: {
    image?: string;
    title?: string;
    siteName?: string;
    publishedAt?: string;
  };
}

interface AllBookmarksProps {
  selectedTag?: string | null;
  onTagClick?: (tagId: string) => void;
  selectedCollection?: string | null;
  onClearCollection?: () => void;
}

export default function AllBookmarks({ selectedTag, onTagClick, selectedCollection, onClearCollection }: AllBookmarksProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<Array<{ _id: string; name: string }>>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const { refreshTags } = useTags();

  useEffect(() => {
    setPage(1);
  }, [selectedTag]);

  useEffect(() => {
    loadBookmarks();
  }, [selectedTag, page]);

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      let endpoint = '/bookmarks';
      if (selectedTag) {
        endpoint = `/bookmarks/by-tag/${selectedTag}?page=${page}&limit=10`;
      } else {
        endpoint = `/bookmarks?page=${page}&limit=10`;
      }

      const data = await fetchApi(endpoint);
      // handle paginated or array responses
      let items: any[] = [];
      let total = 0;
      let respPage = 1;
      let respPages = 1;
      if (data) {
        if (Array.isArray(data)) {
          items = data;
        } else if (Array.isArray(data.items)) {
          items = data.items;
          total = data.total || items.length;
          respPage = data.page || 1;
          respPages = data.pages || 1;
        }
      }

      const normalized = (items || []).map((b: any) => ({ ...b, tags: Array.isArray(b.tags) ? b.tags : [] }));
      setBookmarks(normalized);
      setPages(respPages);
      setPage(respPage);
    } catch (error) {
      toast.error('Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  const loadCollections = async () => {
    try {
      const data = await fetchApi('/collections');
      setCollections(Array.isArray(data) ? data : []);
    } catch (error) {
      // silently ignore
    }
  };

  // load collections once
  useEffect(() => {
    loadCollections();
  }, []);

  const updateBookmarkCollection = async (bookmarkId: string, collectionId: string | null) => {
    // optimistic update
    const prev = [...bookmarks];
    setBookmarks((cur) => cur.map(b => b._id === bookmarkId ? { ...b, collectionId } : b));

    try {
      const body: any = { collectionId };
      const updated = await fetchApi(`/bookmarks/${bookmarkId}`, { method: 'PUT', body: JSON.stringify(body) });
      setBookmarks((cur) => cur.map(b => b._id === updated._id ? updated : b));
      toast.success('Collection updated');
      try { await refreshTags(); } catch (e) { }
    } catch (error) {
      // rollback
      setBookmarks(prev);
      toast.error('Failed to update collection');
    }
  };

  const deleteBookmark = async (id: string) => {
    try {
      await fetchApi(`/bookmarks/${id}`, { method: 'DELETE' });
      setBookmarks(bookmarks.filter(b => b._id !== id));
      toast.success('Bookmark deleted');
      try { await refreshTags(); } catch (e) { }
    } catch (error) {
      toast.error('Failed to delete bookmark');
    }
  };

  if (loading) {
    if (bookmarks.length === 0) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="animate-pulse text-neutral-400">Loading bookmarks...</div>
        </div>
      );
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {selectedCollection && (
            <button onClick={() => { if (onClearCollection) onClearCollection(); }} className="text-sm text-neutral-700 hover:underline">← Back to All</button>
          )}
          <h2 className="text-xl font-semibold text-neutral-800">{selectedTag ? 'Tagged Bookmarks' : 'All Bookmarks'}</h2>
        </div>
        {loading && <div className="text-sm text-neutral-500">Loading…</div>}
      </div>
      
      {bookmarks.map((bookmark) => (
        <div key={bookmark._id} className="p-4 bg-white rounded-lg border border-neutral-200">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-start gap-3">
                {bookmark.meta?.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={bookmark.meta.image} alt={bookmark.meta.title || bookmark.title} className="w-16 h-12 object-cover rounded" />
                )}
                <div>
                  <h3 className="font-medium text-neutral-800">{bookmark.title}</h3>
                  <a 
                    href={bookmark.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-neutral-600 hover:text-neutral-800"
                  >
                    {bookmark.url}
                  </a>
                  {bookmark.meta?.siteName && <div className="text-xs text-neutral-500">{bookmark.meta.siteName}</div>}
                </div>
              </div>
            </div>
            <button
              onClick={() => deleteBookmark(bookmark._id)}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Delete
            </button>
          </div>
          
          <div className="mt-2 flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {Array.isArray(bookmark.tags) && bookmark.tags.length > 0 && bookmark.tags.map((tag) => (
                <button
                  key={tag._id}
                  onClick={() => onTagClick && onTagClick(tag._id)}
                  className="px-2 py-1 text-xs bg-neutral-100 text-neutral-600 rounded-md hover:bg-neutral-200"
                >
                  #{tag.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={bookmark.collectionId || ''}
                onChange={(e) => updateBookmarkCollection(bookmark._id, e.target.value || null)}
                className="text-sm px-2 py-1 border border-neutral-200 rounded bg-white"
              >
                <option value="">No collection</option>
                {collections.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          {bookmark.note && (
            <p className="mt-2 text-sm text-neutral-600">{bookmark.note}</p>
          )}
        </div>
      ))}
      
      {bookmarks.length === 0 && (
        <div className="text-center text-neutral-500">
          No bookmarks found. Add some using the Import button above!
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-neutral-600">Page {page} of {pages}</div>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-2 border rounded">Prev</button>
          <button disabled={page >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))} className="px-3 py-2 border rounded">Next</button>
        </div>
      </div>
    </div>
  );
}