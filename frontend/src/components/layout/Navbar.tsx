'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import fetchApi from '@/lib/api';
import toast from 'react-hot-toast';
import { useTags } from '@/contexts/TagsContext';

export default function Navbar() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [showImportModal, setShowImportModal] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [collections, setCollections] = useState<Array<{ _id: string; name: string }>>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // parse tags separated by `#`, allow inputs like "#work #fun" or "work #fun"
  const tags = tagInput
    .split('#')
    .map(t => t.trim())
    .filter(t => t.length > 0);
  const { refreshTags } = useTags();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const title = form.get('title') as string;
    const url = form.get('url') as string;
    const note = form.get('note') as string;

    try {
      setIsSubmitting(true);
      await fetchApi('/bookmarks', {
        method: 'POST',
        body: JSON.stringify({ title, url, note, tags, collectionId: selectedCollection || null })
      });
      toast.success('Bookmark added');
      setShowImportModal(false);
      setTagInput('');
  setSelectedCollection('');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add bookmark');
    } finally {
      setIsSubmitting(false);
      // refresh the global tags list so Tags UI updates immediately
      try {
        await refreshTags();
      } catch (e) {
        // ignore refresh failures here
      }
    }
  };

  useEffect(() => {
    if (!showImportModal) return;
    const loadCollections = async () => {
      try {
        const data = await fetchApi('/collections');
        setCollections(Array.isArray(data) ? data : []);
      } catch (e) {
        // ignore
      }
    };
    loadCollections();
  }, [showImportModal]);

  return (
    <nav className="bg-white border-b border-neutral-200 fixed top-0 left-0 w-full z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-semibold text-neutral-800 tracking-tight">
            Bookmark Manager
          </Link>

          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="animate-pulse h-6 w-24 bg-neutral-200 rounded"></div>
            ) : isAuthenticated ? (
              <>
                <input
                  type="text"
                  placeholder="Search bookmarks..."
                  className="px-3 py-2 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300 bg-neutral-50 text-neutral-800"
                  style={{ width: '220px' }}
                />
                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 text-white text-sm font-medium hover:bg-neutral-700 transition"
                >
                  Import
                </button>
                <Link
                  href="/profile"
                  className="px-4 py-2 rounded-lg text-sm text-neutral-700 font-medium hover:bg-neutral-100 border border-neutral-200 transition"
                >
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 rounded-lg text-sm text-neutral-700 font-medium hover:bg-neutral-100 border border-neutral-200 transition">Login</Link>
                <Link href="/register" className="px-4 py-2 rounded-lg text-sm font-medium bg-neutral-800 text-white hover:bg-neutral-700 transition">Register</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgb(0,0,0,0.15)' }}>
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Add New Bookmark</h2>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <input name="title" type="text" placeholder="Title" className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-800" required />
              </div>
              <div>
                <input name="url" type="url" placeholder="URL" className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-800" required />
              </div>
              <div>
                <input value={tagInput} onChange={e => setTagInput(e.target.value)} type="text" placeholder="Tags (prefix with #, e.g. #work #reading)" className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-800" />
              </div>
              <div>
                <select value={selectedCollection} onChange={e => setSelectedCollection(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-800">
                  <option value="">No collection</option>
                  {collections.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <textarea name="note" placeholder="Note (optional)" className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-800" rows={3} />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setShowImportModal(false)} className="px-4 py-2 rounded-lg text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-neutral-800 text-white hover:bg-neutral-700 transition disabled:opacity-50">{isSubmitting ? 'Adding...' : 'Add Bookmark'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
}