"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [showModal, setShowModal] = useState(false);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50">
        <div className="bg-white border border-neutral-200 rounded-xl shadow p-8 w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4 text-neutral-800">Profile</h1>
          <p className="text-neutral-600">You are not logged in.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-8">
          <button 
            onClick={() => window.history.back()}
            className="flex items-center px-4 py-2 text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Back to Dashboard</span>
          </button>
        </div>

        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
          <div className="px-4 py-6 sm:px-8 sm:py-10">
            <div className="flex items-center justify-between border-b border-gray-200 pb-6 mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">Profile Settings</h1>
              <button
                className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                onClick={() => setShowModal(true)}
              >
                Sign Out
              </button>
            </div>

            <div className="space-y-8">
              <div>
                <div className="flex items-center mb-6">
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-4">
                    <h2 className="text-lg font-medium text-gray-900">{user.name}</h2>
                    <p className="text-sm text-gray-500">Account Owner</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Full Name</label>
                  <div className="text-lg font-medium text-black p-3 bg-white rounded-lg border border-gray-300">
                    {user.name}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Email Address</label>
                  <div className="text-lg font-medium text-black p-3 bg-white rounded-lg border border-gray-300">
                    {user.email}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowModal(false)} />
            <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-gray-900">Sign Out</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600">Are you sure you want to sign out of your account?</p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  className="px-4 py-2 text-sm text-gray-600 hover:text-black transition-colors"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                  onClick={() => { setShowModal(false); logout(); }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
