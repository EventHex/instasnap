'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { PhotoPermission } from '@/lib/types';

export default function HomePage() {
  const [photoPermission, setPhotoPermission] = useState<PhotoPermission | null>(null);
  const [loading, setLoading] = useState(true);
  const eventId = process.env.NEXT_PUBLIC_EVENT_ID || '';

  useEffect(() => {
    const fetchPhotoPermission = async () => {
      try {
        const response = await api.getPhotoPermission(eventId);
        if (response.success && response.response.length > 0) {
          setPhotoPermission(response.response[0]);
        }
      } catch (error) {
        console.error('Failed to fetch photo permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchPhotoPermission();
    }
  }, [eventId]);

  const showAnonymousMatch = photoPermission?.photoViewAccess !== 'Everyone' && photoPermission?.photoViewAccess !== 'Attendees';
  const showRegistration = photoPermission?.photoViewAccess !== 'Public';
  const showEventHighlights = photoPermission?.enableEventHighlights === true;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              InstaSnap
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Find Your Event Photos Instantly
            </p>
            <p className="text-gray-500">
              Upload a selfie and AI will find all your photos from the event!
            </p>
          </div>

          <div className="space-y-4">
            {showAnonymousMatch && (
              <Link
                href="/anonymous"
                className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors text-center"
              >
                <div className="text-lg">Quick Match</div>
                <div className="text-sm opacity-90">No login required</div>
              </Link>
            )}

            {showRegistration && (
              <Link
                href="/registered"
                className="block w-full bg-white hover:bg-gray-50 text-indigo-600 font-semibold py-4 px-6 rounded-lg border-2 border-indigo-600 transition-colors text-center"
              >
                <div className="text-lg">
                  {photoPermission?.photoViewAccess === 'Attendees' ? 'Login' : 'Register / Login'}
                </div>
                <div className="text-sm opacity-90">
                  {photoPermission?.photoViewAccess === 'Attendees' 
                    ? 'Login required to view photos'
                    : showAnonymousMatch 
                      ? 'Save for later access' 
                      : 'Login required to view photos'}
                </div>
              </Link>
            )}

            {showEventHighlights && (
              <Link
                href="/gallery"
                className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors text-center"
              >
                <div className="text-lg">Event Highlights</div>
                <div className="text-sm opacity-90">View featured photos from the event</div>
              </Link>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">
              {showAnonymousMatch ? 'Why Register?' : 'Registration Benefits'}
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="mr-2">✅</span>
                <span>No need to upload selfie again</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✅</span>
                <span>Automatic photo updates as event continues</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✅</span>
                <span>Access across multiple events</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✅</span>
                <span>5x faster on subsequent visits</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

