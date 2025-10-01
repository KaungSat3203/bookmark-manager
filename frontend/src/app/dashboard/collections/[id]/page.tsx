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

  if (loading) return <div className="animate-pulse text-neutral-400">Loading...</div>;

  return (
    <ProtectedRoute>
      <div className="w-full min-h-screen bg-neutral-50 flex">
        {/* Sidebar retained from dashboard - import the same markup as page layout */}
        <aside className="w-72 min-h-screen bg-white border-r border-neutral-200 p-6 flex flex-col gap-8 fixed left-0 top-16 bottom-0">
          <div>
            <button onClick={() => router.push('/dashboard')} className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition text-neutral-600 hover:bg-neutral-50">All Bookmarks</button>
          </div>
          <div>
            <h2 className="text-sm font-semibold px-4 text-neutral-400 uppercase tracking-wider">Collections</h2>
            <button onClick={() => router.push('/dashboard?tab=collections')} className="w-full text-left mt-2 px-4 py-2 rounded-lg text-sm font-medium transition text-neutral-600 hover:bg-neutral-50">View Collections</button>
          </div>
          <div>
            <h2 className="text-sm font-semibold px-4 text-neutral-400 uppercase tracking-wider">Tags</h2>
            <button onClick={() => router.push('/dashboard')} className="w-full text-left mt-2 px-4 py-2 rounded-lg text-sm font-medium transition text-neutral-600 hover:bg-neutral-50">Manage Tags</button>
          </div>
        </aside>

        <main className="flex-1 p-10 ml-72 mt-16">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <button onClick={() => router.push('/dashboard?tab=collections')} className="text-sm text-neutral-700 hover:underline mb-2">← Back to Collections</button>
                <h1 className="text-2xl font-semibold">{collection?.name}</h1>
                {collection?.description && <p className="text-neutral-600">{collection.description}</p>}
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setEditing(true)} className="px-3 py-2 bg-neutral-100 rounded">Edit</button>
                <button onClick={handleDelete} className="px-3 py-2 bg-red-50 text-red-600 rounded">Delete</button>
              </div>
            </div>

            {editing && (
              <form onSubmit={handleEdit} className="mb-6">
                <div className="grid gap-2 mb-2">
                  <input value={name} onChange={e => setName(e.target.value)} className="px-3 py-2 border rounded" />
                  <textarea value={description} onChange={e => setDescription(e.target.value)} className="px-3 py-2 border rounded" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="px-3 py-2 bg-neutral-800 text-white rounded">Save</button>
                  <button type="button" onClick={() => setEditing(false)} className="px-3 py-2 border rounded">Cancel</button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {items.map((bookmark) => (
                <div key={bookmark._id} className="p-4 bg-white rounded-lg border border-neutral-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-neutral-800">{bookmark.title}</h3>
                      <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="text-sm text-neutral-600 hover:text-neutral-800">{bookmark.url}</a>
                    </div>
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
        </main>
      </div>
    </ProtectedRoute>
  );
}
