'use client';

import { useState, useEffect } from 'react';
import fetchApi from '@/lib/api';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTags } from '@/contexts/TagsContext';
import ConfirmModal from '@/components/ui/ConfirmModal';

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
    description?: string;
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
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; bookmarkId: string | null }>({
    isOpen: false,
    bookmarkId: null,
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<BookmarkFormData>({
    resolver: zodResolver(bookmarkSchema),
  });
  const { refreshTags } = useTags();

      const fetchBookmarks = async () => {
    try {
      setIsLoading(true);
      const query = selectedCategory ? `?categoryId=${selectedCategory}` : '';
      const data = await fetchApi(`/bookmarks${query}`);
      // Ensure data is an array
      setBookmarks(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error.message);
      setBookmarks([]);
    } finally {
      setIsLoading(false);
    }
  };  const fetchCategories = async () => {
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
      let result: Bookmark;
      
      if (editingBookmark) {
        result = await fetchApi(`/bookmarks/${editingBookmark._id}`, { 
          method: 'PUT', 
          body: JSON.stringify(data) 
        });
        setBookmarks(bookmarks => 
          bookmarks.map(b => b._id === editingBookmark._id ? result : b)
        );
      } else {
        result = await fetchApi('/bookmarks', { 
          method: 'POST', 
          body: JSON.stringify(data) 
        });
        setBookmarks(bookmarks => [result, ...bookmarks]);
      }
      
      toast.success(editingBookmark ? 'Bookmark updated!' : 'Bookmark created!');
      reset();
      setEditingBookmark(null);
      try { await refreshTags(); } catch (e) { /* ignore */ }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };  const deleteBookmark = async (id: string) => {
    try {
      await fetchApi(`/bookmarks/${id}`, { method: 'DELETE' });
      toast.success('Bookmark deleted!');
      setBookmarks(bookmarks => bookmarks.filter(b => b._id !== id));
      try { await refreshTags(); } catch (e) { }
    } catch (error: any) {
      toast.error(error.message);
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

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">My Bookmarks</h2>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading bookmarks...</p>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No bookmarks found. Add one to get started!</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {bookmarks.map(bm => (
              <li key={bm._id} className="hover:bg-gray-50 transition-colors">
                <div className="p-6 flex items-start gap-4">
                  {bm.meta?.image && (
                    <div className="flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={bm.meta.image} 
                        alt={bm.meta?.title || bm.title} 
                        className="w-20 h-20 object-cover rounded-lg bg-gray-100 shadow-sm"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                        }} 
                      />
                    </div>
                  )}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <a 
                          href={bm.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-lg font-medium text-gray-900 hover:text-indigo-600 transition-colors line-clamp-1"
                        >
                          {bm.meta?.title || bm.title}
                        </a>
                        <p className="mt-1 text-sm text-gray-500 truncate max-w-2xl">{bm.url}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button 
                          onClick={() => startEditing(bm)} 
                          className="text-sm font-medium px-3 py-1.5 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => setDeleteModal({ isOpen: true, bookmarkId: bm._id })}
                          className="text-sm font-medium px-3 py-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    {(bm.meta?.siteName || bm.meta?.publishedAt) && (
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {bm.meta?.siteName && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {bm.meta.siteName}
                          </span>
                        )}
                        {bm.meta?.publishedAt && (
                          <span className="text-xs text-gray-500">
                            {new Date(bm.meta.publishedAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {bm.meta?.description && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2 max-w-2xl">
                        {bm.meta.description}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, bookmarkId: null })}
        onConfirm={() => {
          if (deleteModal.bookmarkId) {
            deleteBookmark(deleteModal.bookmarkId);
            setDeleteModal({ isOpen: false, bookmarkId: null });
          }
        }}
        title="Delete Bookmark"
        message="Are you sure you want to delete this bookmark? This action cannot be undone."
      />
    </div>
  );
}
