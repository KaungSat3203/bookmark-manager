'use client';

import Link from 'next/link';
import fetchApi from '@/lib/api';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

interface Collection {
  _id: string;
  name: string;
  description?: string;
}
interface CollectionsProps {}

export default function Collections(_: CollectionsProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookmarksByCollection, setBookmarksByCollection] = useState<Record<string, any[]>>({});
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const data = await fetchApi('/collections');
      setCollections(data);
    } catch (error) {
      toast.error('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const loadBookmarksForCollection = async (collectionId: string) => {
    try {
      const data = await fetchApi(`/bookmarks/by-collection/${collectionId}`);
      // normalize paginated or array-shaped response
      const items = Array.isArray(data)
        ? data
        : (data && Array.isArray((data as any).items) ? (data as any).items : []);
      setBookmarksByCollection(prev => ({ ...prev, [collectionId]: items }));
      setSelectedCollectionId(collectionId);
    } catch (e) {
      toast.error('Failed to load bookmarks for collection');
    }
  };

  const countBookmarks = async () => {
    try {
      const all = await fetchApi('/bookmarks');
      const items = Array.isArray(all)
        ? all
        : (all && Array.isArray((all as any).items) ? (all as any).items : []);
      const map: Record<string, any[]> = {};
      (items || []).forEach((b: any) => {
        const c = b.collectionId ? (b.collectionId._id || b.collectionId) : '';
        if (!c) return;
        map[c] = map[c] || [];
        map[c].push(b);
      });
      setBookmarksByCollection(map);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    countBookmarks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      setSubmitting(true);
      const collection = await fetchApi('/collections', {
        method: 'POST',
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim()
        })
      });
      setCollections([...collections, collection]);
      setNewName('');
      setNewDescription('');
      setShowNewModal(false);
      toast.success('Collection created!');
    } catch (error) {
      toast.error('Failed to create collection');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse text-neutral-400">Loading collections...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-neutral-800">Collections</h2>
        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 rounded-lg bg-neutral-800 text-white text-sm font-medium hover:bg-neutral-700 transition"
        >
          New Collection
        </button>
      </div>

      <div className="grid gap-4">
        {collections.map((collection) => (
          <div key={collection._id} className="p-4 bg-white rounded-lg border border-neutral-200" onMouseEnter={() => loadBookmarksForCollection(collection._id)}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-neutral-800">{collection.name}</h3>
                {collection.description && (
                  <p className="mt-1 text-sm text-neutral-600">{collection.description}</p>
                )}
              </div>
              <div className="text-sm text-neutral-600">
                {bookmarksByCollection[collection._id]?.length || 0} bookmarks
              </div>
            </div>
              <div className="mt-3">
                <Link href={`/dashboard/collections/${collection._id}`} className="text-sm text-neutral-700 hover:underline">
                  View bookmarks
                </Link>
              </div>
          </div>
        ))}
        {collections.length === 0 && (
          <p className="text-center text-neutral-500 py-8">
            No collections yet. Create one to organize your bookmarks!
          </p>
        )}
      </div>

      {/* New Collection Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgb(0,0,0,0.15)' }}>
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Create New Collection</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Collection Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-800"
                  required
                />
              </div>
              <div>
                <textarea
                  placeholder="Description (optional)"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-800"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-lg text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newName.trim()}
                  className="px-4 py-2 rounded-lg bg-neutral-800 text-white hover:bg-neutral-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
    </div>
  );
}