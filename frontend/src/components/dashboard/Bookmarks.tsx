'use client';

import { useState, useEffect } from 'react';
import fetchApi from '@/lib/api';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTags } from '@/contexts/TagsContext';

interface Bookmark {
  _id: string;
  title: string;
  url: string;
  categoryId?: string;
  meta?: {
    image?: string;
    title?: string;
    siteName?: string;
    publishedAt?: string;
  };
}

interface Category {
    _id: string;
    name: string;
}

interface BookmarksProps {
  selectedCategory: string | null;
}

const bookmarkSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  url: z.string().url('Please enter a valid URL'),
  categoryId: z.string().optional(),
});

type BookmarkFormData = z.infer<typeof bookmarkSchema>;

export default function Bookmarks({ selectedCategory }: BookmarksProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<BookmarkFormData>({
    resolver: zodResolver(bookmarkSchema),
  });
  const { refreshTags } = useTags();

  const fetchBookmarks = async () => {
    try {
      setIsLoading(true);
      const query = selectedCategory ? `?categoryId=${selectedCategory}` : '';
      const data = await fetchApi(`/bookmarks${query}`);
      setBookmarks(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
        const data = await fetchApi('/categories');
        setCategories(data);
      } catch (error: any) {
        toast.error(error.message);
      }
  }

  useEffect(() => {
    fetchBookmarks();
  }, [selectedCategory]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const onSubmit = async (data: BookmarkFormData) => {
    try {
      setIsSubmitting(true);
      const apiCall = editingBookmark
        ? fetchApi(`/bookmarks/${editingBookmark._id}`, { method: 'PUT', body: JSON.stringify(data) })
        : fetchApi('/bookmarks', { method: 'POST', body: JSON.stringify(data) });

      await apiCall;
      toast.success(editingBookmark ? 'Bookmark updated!' : 'Bookmark created!');
      reset();
      setEditingBookmark(null);
  await fetchBookmarks(); // Refetch
  // refresh tags in sidebar
  try { await refreshTags(); } catch (e) { /* ignore */ }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteBookmark = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this bookmark?')) {
      try {
        await fetchApi(`/bookmarks/${id}`, { method: 'DELETE' });
        toast.success('Bookmark deleted!');
        await fetchBookmarks(); // Refetch
        try { await refreshTags(); } catch (e) { }
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const startEditing = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setValue('title', bookmark.title);
    setValue('url', bookmark.url);
    setValue('categoryId', bookmark.categoryId);
  };

  const cancelEditing = () => {
    setEditingBookmark(null);
    reset();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{editingBookmark ? 'Edit Bookmark' : 'Add Bookmark'}</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="mb-6 bg-gray-50 p-4 rounded-lg">
        <div className="space-y-4">
            <input {...register('title')} type="text" placeholder="Title" className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
            
            <input {...register('url')} type="text" placeholder="URL" className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            {errors.url && <p className="text-sm text-red-600">{errors.url.message}</p>}

            <select {...register('categoryId')} className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <option value="">No Category</option>
                {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
            </select>
        </div>
        <div className="flex gap-2 mt-4">
            <button type="submit" disabled={isSubmitting} className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {isSubmitting ? (editingBookmark ? 'Saving...' : 'Adding...') : (editingBookmark ? 'Save Changes' : 'Add Bookmark')}
            </button>
            {editingBookmark && <button type="button" onClick={cancelEditing} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300">Cancel</button>}
        </div>
      </form>

      <h2 className="text-2xl font-bold mb-4 mt-8">My Bookmarks</h2>
      {isLoading ? (
        <p>Loading bookmarks...</p>
      ) : bookmarks.length === 0 ? (
        <p className="text-gray-500">No bookmarks found. Add one to get started!</p>
      ) : (
        <ul className="space-y-3">
          {bookmarks.map(bm => (
            <li key={bm._id} className="p-4 rounded-lg border border-gray-200 flex justify-between items-center">
              <div>
                <div className="flex items-start gap-3">
                  {bm.meta?.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={bm.meta.image} alt={bm.meta.title || bm.title} className="w-16 h-12 object-cover rounded" />
                  )}
                  <div>
                    <a href={bm.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 hover:underline">{bm.title}</a>
                    <p className="text-sm text-gray-500 truncate">{bm.url}</p>
                    {bm.meta?.siteName && <div className="text-xs text-neutral-500">{bm.meta.siteName}</div>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEditing(bm)} className="text-sm font-medium text-gray-600 hover:text-gray-900">Edit</button>
                <button onClick={() => deleteBookmark(bm._id)} className="text-sm font-medium text-red-500 hover:text-red-700">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
