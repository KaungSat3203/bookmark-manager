'use client';

import Link from 'next/link';
import fetchApi from '@/lib/api';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface Collection {
  _id: string;
  name: string;
  description?: string;
}
interface CollectionsProps {}

export default function Collections(_: CollectionsProps) {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookmarksByCollection, setBookmarksByCollection] = useState<Record<string, any[]>>({});
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; collectionId: string | null }>({
    isOpen: false,
    collectionId: null,
  });

  const loadCollections = async () => {
    try {
      const data = await fetchApi('/collections');
      if (Array.isArray(data)) {
        setCollections(data);
      } else {
        console.error('Invalid collections data:', data);
        toast.error('Failed to load collections');
      }
    } catch (error) {
      console.error('Load collections error:', error);
      toast.error('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadCollections = async () => {
      try {
        const data = await fetchApi('/collections');
        if (Array.isArray(data)) {
          setCollections(data);
        } else {
          console.error('Invalid collections data:', data);
          toast.error('Failed to load collections');
        }
      } catch (error) {
        console.error('Load collections error:', error);
        toast.error('Failed to load collections');
      } finally {
        setLoading(false);
      }
    };

    loadCollections();
  }, []);

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

  const deleteCollection = async (collectionId: string) => {
    try {
      await fetchApi(`/collections/${collectionId}`, { 
        method: 'DELETE',
      });
      
      // If we reach here, the deletion was successful
      setCollections(collections.filter(c => c._id !== collectionId));
      toast.success('Collection deleted successfully');
      setDeleteModal({ isOpen: false, collectionId: null });
    } catch (error: any) {
      console.error('Delete collection error:', error);
      toast.error(error.message || 'Failed to delete collection');
      setDeleteModal({ isOpen: false, collectionId: null });
    }
  };

  if (loading) {
    return <div className="animate-pulse text-neutral-400">Loading collections...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Collections</h2>
        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition"
        >
          New Collection
        </button>
      </div>

      <div className="grid gap-4">
        {collections.map((collection) => (
          <div 
            key={collection._id} 
            className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200" 
            onMouseEnter={() => loadBookmarksForCollection(collection._id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-grow">
                <h3 className="text-lg font-semibold text-slate-900">{collection.name}</h3>
                {collection.description && (
                  <p className="mt-2 text-sm text-slate-700 leading-relaxed">{collection.description}</p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                  {bookmarksByCollection[collection._id]?.length || 0} bookmarks
                </span>
                <button
                  onClick={() => setDeleteModal({ isOpen: true, collectionId: collection._id })}
                  className="text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-full transition-all duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="mt-4 border-t pt-4">
              <Link
                href={`/dashboard/collections/${collection._id}`}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition-colors duration-200 flex items-center gap-2"
              >
                View bookmarks 
                <span className="text-indigo-500">&rarr;</span>
              </Link>
            </div>
          </div>
        ))}
        {collections.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-slate-700 text-lg">
              No collections yet. Create one to organize your bookmarks!
            </p>
          </div>
        )}
      </div>

      {/* New Collection Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Collection</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Collection Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <textarea
                  placeholder="Description (optional)"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newName.trim()}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition text-sm font-medium disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, collectionId: null })}
        onConfirm={() => {
          if (deleteModal.collectionId) {
            deleteCollection(deleteModal.collectionId);
          }
        }}
        title="Delete Collection"
        message="Are you sure you want to delete this collection? This will not delete the bookmarks within it."
      />
    </div>
  );
}