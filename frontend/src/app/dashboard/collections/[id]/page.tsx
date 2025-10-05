'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import fetchApi from '@/lib/api';
import toast from 'react-hot-toast';

export default function CollectionDetail() {
  const { user } = useAuth();
  const params: any = useParams();
  const collectionId = params.id;
  const router = useRouter();

  const [collection, setCollection] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [removeConfirm, setRemoveConfirm] = useState<{ isOpen: boolean; bookmarkId: string | null }>({
    isOpen: false,
    bookmarkId: null
  });

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const col = await fetchApi(`/collections/${collectionId}`);
      setCollection(col);
      setName(col?.name || '');
      setDescription(col?.description || '');
    } catch (e) {
      // ignore
    }

    try {
      const res = await fetchApi(`/bookmarks/by-collection/${collectionId}?page=${p}&limit=10`);
      setItems(res.items || []);
      setPages(res.pages || 1);
      setPage(res.page || 1);
    } catch (e) {
      toast.error('Failed to load bookmarks for collection');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionId]);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await fetchApi(`/collections/${collectionId}`, { method: 'PUT', body: JSON.stringify({ name, description }) });
      setCollection(updated);
      setEditing(false);
      toast.success('Collection updated');
    } catch (e) {
      toast.error('Failed to update collection');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this collection? This will not delete bookmarks.')) return;
    try {
      await fetchApi(`/collections/${collectionId}`, { method: 'DELETE' });
      toast.success('Collection deleted');
      router.push('/dashboard');
    } catch (e) {
      toast.error('Failed to delete collection');
    }
  };

  const removeFromCollection = async (bookmarkId: string) => {
    try {
      await fetchApi(`/bookmarks/${bookmarkId}`, {
        method: 'PUT',
        body: JSON.stringify({ collectionId: null })
      });
      setItems(items.filter(item => item._id !== bookmarkId));
      toast.success('Removed from collection');
    } catch (error) {
      toast.error('Failed to remove from collection');
    }
    setRemoveConfirm({ isOpen: false, bookmarkId: null });
  };

  if (loading) return <div className="animate-pulse text-slate-400">Loading...</div>;

  return (
    <ProtectedRoute>
      <div className="w-full min-h-screen bg-slate-50 flex">
        <aside className="w-72 min-h-screen bg-white border-r border-slate-200 p-6 flex flex-col gap-6 fixed left-0 top-16 bottom-0">
          <nav>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
              All Bookmarks
            </button>
          </nav>

          <div>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-4">Collections</h2>
            <button
              onClick={() => router.push('/dashboard?tab=collections')}
              className="w-full flex items-center gap-3 px-4 py-2 text-indigo-600 bg-indigo-50 rounded-lg font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              View Collections
            </button>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-4">Tags</h2>
            <button
              onClick={() => router.push('/dashboard?tab=tags')}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Manage Tags
            </button>
          </div>
        </aside>

        <main className="flex-1 p-10 ml-72 mt-16">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <button 
                  onClick={() => router.push('/dashboard?tab=collections')} 
                  className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-3 transition-colors"
                >
                  <span>&larr;</span> Back to Collections
                </button>
                <h1 className="text-2xl font-bold text-slate-900">{collection?.name}</h1>
                {collection?.description && (
                  <p className="mt-2 text-base text-slate-600 leading-relaxed">{collection.description}</p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setEditing(true)} 
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Edit
                </button>
                <button 
                  onClick={handleDelete} 
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

            {editing && (
              <form onSubmit={handleEdit} className="mb-8 bg-white p-6 rounded-lg border border-slate-200">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Collection Name</label>
                    <input
                      id="name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full px-4 py-2 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-6">
                  <button 
                    type="submit" 
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors"
                  >
                    Save Changes
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setEditing(false)} 
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {items.map((bookmark) => (
                <div key={bookmark._id} className="p-4 bg-white rounded-lg border border-neutral-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {bookmark.meta?.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={bookmark.meta.image} alt={bookmark.meta.title || bookmark.title} className="w-16 h-12 object-cover rounded" />
                      )}
                      <div>
                        <h3 className="font-medium text-neutral-800">{bookmark.title}</h3>
                        <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="text-sm text-neutral-600 hover:text-neutral-800">{bookmark.url}</a>
                        {bookmark.meta?.siteName && <div className="text-xs text-neutral-500">{bookmark.meta.siteName}</div>}
                      </div>
                    </div>
                    <button
                      onClick={() => setRemoveConfirm({ isOpen: true, bookmarkId: bookmark._id })}
                      className="text-sm text-red-600 hover:text-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  </div>

                  {Array.isArray(bookmark.tags) && bookmark.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {bookmark.tags.map((tag: any) => (
                        <span key={tag._id} className="px-2 py-1 text-xs bg-neutral-100 text-neutral-600 rounded-md">#{tag.name}</span>
                      ))}
                    </div>
                  )}

                  {bookmark.note && (
                    <p className="mt-2 text-sm text-neutral-600">{bookmark.note}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-neutral-600">Page {page} of {pages}</div>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => { load(page - 1); }} className="px-3 py-2 border rounded">Prev</button>
                <button disabled={page >= pages} onClick={() => { load(page + 1); }} className="px-3 py-2 border rounded">Next</button>
              </div>
            </div>
          </div>

          {/* Remove Confirmation Modal */}
          {removeConfirm.isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="fixed inset-0" onClick={() => setRemoveConfirm({ isOpen: false, bookmarkId: null })} style={{ background: 'rgba(0, 0, 0, 0.2)' }}></div>
              <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Remove from Collection</h2>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to remove this bookmark from the collection? The bookmark itself won't be deleted.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setRemoveConfirm({ isOpen: false, bookmarkId: null })}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-black transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => removeConfirm.bookmarkId && removeFromCollection(removeConfirm.bookmarkId)}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
