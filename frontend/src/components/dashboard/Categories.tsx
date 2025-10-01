'use client';

import { useState, useEffect } from 'react';
import fetchApi from '@/lib/api';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface Category {
  _id: string;
  name: string;
}

interface CategoriesProps {
  onSelectCategory: (id: string | null) => void;
  selectedCategory: string | null;
}

const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function Categories({ onSelectCategory, selectedCategory }: CategoriesProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const data = await fetchApi('/categories');
      setCategories(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onSubmit = async (data: CategoryFormData) => {
    try {
      setIsSubmitting(true);
      await fetchApi('/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      toast.success('Category created!');
      reset();
      fetchCategories(); // Refetch
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await fetchApi(`/categories/${id}`, { method: 'DELETE' });
        toast.success('Category deleted!');
        fetchCategories(); // Refetch
        onSelectCategory(null); // Deselect if it was selected
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Categories</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="mb-6">
        <div className="flex gap-2">
          <input
            {...register('name')}
            type="text"
            placeholder="New category name"
            className="flex-grow appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          <button type="submit" disabled={isSubmitting} className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {isSubmitting ? 'Adding...' : 'Add'}
          </button>
        </div>
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </form>

      {isLoading ? (
        <p>Loading categories...</p>
      ) : (
        <ul className="space-y-2">
          <li
            key="all"
            onClick={() => onSelectCategory(null)}
            className={`p-2 rounded-md cursor-pointer flex justify-between items-center ${!selectedCategory ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`}>
            All Bookmarks
          </li>
          {categories.map(cat => (
            <li
              key={cat._id}
              onClick={() => onSelectCategory(cat._id)}
              className={`p-2 rounded-md cursor-pointer flex justify-between items-center ${selectedCategory === cat._id ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`}>
              <span>{cat.name}</span>
              <button onClick={(e) => { e.stopPropagation(); deleteCategory(cat._id); }} className="text-red-500 hover:text-red-700 text-xs">Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
