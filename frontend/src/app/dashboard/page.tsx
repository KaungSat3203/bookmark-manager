'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import AllBookmarks from '@/components/dashboard/AllBookmarks';
import Collections from '@/components/dashboard/Collections';
import Tags from '@/components/dashboard/Tags';
import { useSearchParams } from 'next/navigation';

export default function DashboardPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialTab = (searchParams?.get('tab') as 'all' | 'collections' | 'tags') || 'all';
  const [activeTab, setActiveTab] = useState<'all' | 'collections' | 'tags'>(initialTab);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  // collections no longer act as a client-side filter

  return (
    <ProtectedRoute>
      <div className="w-full min-h-screen bg-neutral-50 flex">
        {/* Sidebar */}
        <aside className="w-72 min-h-screen bg-white border-r border-neutral-200 p-6 flex flex-col gap-8 fixed left-0 top-16 bottom-0">
          <div>
            <button
              onClick={() => { setActiveTab('all'); setSelectedTag(null); }}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'all'
                  ? 'bg-neutral-100 text-neutral-800'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              All Bookmarks
            </button>
          </div>

          <div>
            <h2 className="text-sm font-semibold px-4 text-neutral-400 uppercase tracking-wider">Collections</h2>
            <button
              onClick={() => setActiveTab('collections')}
              className={`w-full text-left mt-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'collections'
                  ? 'bg-neutral-100 text-neutral-800'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              View Collections
            </button>
          </div>

          <div>
            <h2 className="text-sm font-semibold px-4 text-neutral-400 uppercase tracking-wider">Tags</h2>
            <div className="mt-2">
              <Tags
                selectedTag={selectedTag}
                onSelectTag={(tagId) => {
                  setSelectedTag(tagId);
                  setActiveTab('all');
                }}
              />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-10 ml-72 mt-16">
          <div className="max-w-5xl mx-auto">
            <div className={activeTab === 'all' ? '' : 'hidden'}>
              <AllBookmarks
                selectedTag={selectedTag}
                onTagClick={(tagId) => {
                  setSelectedTag(tagId);
                  setActiveTab('all');
                }}
              />
            </div>

            <div className={activeTab === 'collections' ? '' : 'hidden'}>
              <Collections />
            </div>

            <div className={activeTab === 'tags' ? '' : 'hidden'}>
              <Tags
                onSelectTag={(tagId) => {
                  setSelectedTag(tagId);
                  setActiveTab('all');
                }}
                selectedTag={selectedTag}
              />
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}