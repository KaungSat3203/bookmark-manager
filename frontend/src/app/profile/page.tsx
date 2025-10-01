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
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50">
      <div className="bg-white border border-neutral-200 rounded-xl shadow p-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4 text-neutral-800">Profile</h1>
        <div className="mb-4">
          <span className="block text-neutral-700 font-medium">Name:</span>
          <span className="block text-neutral-800">{user.name}</span>
        </div>
        <div className="mb-4">
          <span className="block text-neutral-700 font-medium">Email:</span>
          <span className="block text-neutral-800">{user.email}</span>
        </div>
        <button
          className="mt-6 px-4 py-2 rounded-lg bg-neutral-800 text-white text-sm font-medium hover:bg-neutral-700 transition"
          onClick={() => setShowModal(true)}
        >
          Logout
        </button>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgb(0,0,0,0.15)' }}>
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
              <h2 className="text-lg font-semibold mb-4">Confirm Logout</h2>
              <p className="mb-6 text-neutral-700">Are you sure you want to logout?</p>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 rounded bg-neutral-200 text-neutral-800 font-medium hover:bg-neutral-300"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded bg-red-600 text-white font-medium hover:bg-red-700"
                  onClick={() => { setShowModal(false); logout(); }}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Add more profile fields here if needed */}
      </div>
    </div>
  );
}
