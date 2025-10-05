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
  selectedTags: string[];
  onTagClick: (tagId: string) => void;
  selectedCollection?: string | null;
  onClearCollection?: () => void;
  searchResults?: any[];
}

export default function AllBookmarks({ selectedTags, onTagClick, selectedCollection, onClearCollection, searchResults }: AllBookmarksProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<Array<{ _id: string; name: string }>>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [addToCollectionModal, setAddToCollectionModal] = useState<{ isOpen: boolean; bookmarkId: string | null }>({
    isOpen: false,
    bookmarkId: null,
  });
  const [editModal, setEditModal] = useState<{ isOpen: boolean; bookmark: Bookmark | null }>({
    isOpen: false,
    bookmark: null,
  });
  const [editForm, setEditForm] = useState({
    title: '',
    url: '',
    note: '',
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; bookmark: Bookmark | null }>({
    isOpen: false,
    bookmark: null,
  });
  const { refreshTags } = useTags();

  useEffect(() => {
    setPage(1);
  }, [selectedTags]);

  useEffect(() => {
    loadBookmarks();
  }, [selectedTags, page]);

  // Listen for URL changes to handle search
  useEffect(() => {
    loadBookmarks();
  }, [window.location.search]);

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      let endpoint = '/bookmarks';
      const searchParams = new URLSearchParams(window.location.search);
      const searchQuery = searchParams.get('search');

      if (searchQuery) {
        endpoint = `/bookmarks/search?q=${encodeURIComponent(searchQuery)}&page=${page}&limit=10`;
      } else if (selectedTags.length > 0) {
        // Join multiple tag IDs with commas
        const tagIds = selectedTags.join(',');
        endpoint = `/bookmarks/by-tag/${tagIds}?page=${page}&limit=10`;
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

  const handleEditBookmark = async () => {
    if (!editModal.bookmark) return;

    try {
      const updated = await fetchApi(`/bookmarks/${editModal.bookmark._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editForm.title,
          url: editForm.url,
          note: editForm.note
        })
      });

      setBookmarks((cur) => cur.map(b => b._id === updated._id ? {
        ...updated,
        tags: updated.tags || [],
        meta: updated.meta || {}
      } : b));

      toast.success('Bookmark updated successfully');
      setEditModal({ isOpen: false, bookmark: null });
    } catch (error) {
      toast.error('Failed to update bookmark');
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
          <div>
            <h2 className="text-xl font-semibold text-neutral-800">
              {selectedTags.length > 0 ? 'Filtered Bookmarks' : 'All Bookmarks'}
            </h2>
            {selectedTags.length > 0 && (
              <p className="text-sm text-neutral-500 mt-1">
                Showing bookmarks with all {selectedTags.length} selected tags
              </p>
            )}
          </div>
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
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setEditModal({ isOpen: true, bookmark });
                  setEditForm({
                    title: bookmark.title,
                    url: bookmark.url,
                    note: bookmark.note || '',
                  });
                }}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                Edit
              </button>
              <button
                onClick={() => setDeleteConfirmation({ isOpen: true, bookmark })}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Delete
              </button>
            </div>
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
              <button
                onClick={() => setAddToCollectionModal({ isOpen: true, bookmarkId: bookmark._id })}
                className="text-sm px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors font-medium flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add to Collection
              </button>
            </div>
          </div>
          
          {bookmark.note && (
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">{bookmark.note}</p>
          )}
        </div>
      ))}
      
      {bookmarks.length === 0 && (
        <div className="text-center text-neutral-500">
          No bookmarks found. Add some using the Import button above!
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm font-medium text-slate-600">Page {page} of {pages}</div>
        <div className="flex gap-3">
          <button 
            disabled={page <= 1} 
            onClick={() => setPage(p => Math.max(1, p - 1))} 
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button 
            disabled={page >= pages} 
            onClick={() => setPage(p => Math.min(pages, p + 1))} 
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      {/* Add to Collection Modal */}
      {addToCollectionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900">Add to Collection</h2>
              <button
                onClick={() => setAddToCollectionModal({ isOpen: false, bookmarkId: null })}
                className="text-slate-400 hover:text-slate-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {collections.length === 0 ? (
                <p className="text-center text-slate-600 py-8">No collections yet. Create one first!</p>
              ) : (
                <div className="space-y-2">
                  {collections.map(collection => (
                    <button
                      key={collection._id}
                      onClick={() => {
                        if (addToCollectionModal.bookmarkId) {
                          updateBookmarkCollection(addToCollectionModal.bookmarkId, collection._id);
                          setAddToCollectionModal({ isOpen: false, bookmarkId: null });
                        }
                      }}
                      className="w-full px-4 py-3 text-left rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-between group"
                    >
                      <span className="text-slate-900 font-medium">{collection.name}</span>
                      <span className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">Add here →</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-black">Edit Bookmark</h2>
              <button
                onClick={() => setEditModal({ isOpen: false, bookmark: null })}
                className="text-gray-500 hover:text-black transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-3 text-base text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                  placeholder="Bookmark title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">URL</label>
                <input
                  type="url"
                  value={editForm.url}
                  onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                  className="w-full px-4 py-3 text-base text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Note</label>
                <textarea
                  value={editForm.note}
                  onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                  className="w-full px-4 py-3 text-base text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                  rows={3}
                  placeholder="Add a note about this bookmark"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setEditModal({ isOpen: false, bookmark: null })}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-black transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditBookmark}
                className="px-5 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-lg transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Delete Bookmark</h2>
            <p className="text-slate-700 dark:text-slate-300">
              Are you sure you want to delete this bookmark?
              <br />
              <span className="font-medium">{deleteConfirmation.bookmark?.title}</span>
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmation({ isOpen: false, bookmark: null })}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirmation.bookmark) {
                    deleteBookmark(deleteConfirmation.bookmark._id);
                    setDeleteConfirmation({ isOpen: false, bookmark: null });
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}