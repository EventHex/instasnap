'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { EventHighlight } from '@/lib/types';
import Link from 'next/link';

export default function GalleryPage() {
  const [highlights, setHighlights] = useState<EventHighlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 50;

  const eventId = process.env.NEXT_PUBLIC_EVENT_ID || '';

  useEffect(() => {
    loadHighlights();
  }, []);

  const loadHighlights = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.getEventHighlights(eventId, skip, limit);
      
      if (response.success) {
        setHighlights(prev => [...prev, ...response.response]);
        setHasMore(response.response.length === limit);
        setSkip(prev => prev + limit);
      } else {
        setError('Failed to load event highlights');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load highlights');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="text-indigo-600 hover:text-indigo-700 font-medium">
            ← Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Highlights</h1>
          <p className="text-gray-600 mb-6">Featured photos from the event</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {highlights.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No event highlights available yet.</p>
            </div>
          )}

          {highlights.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {highlights.map((photo) => (
                <div key={photo._id} className="overflow-hidden rounded-lg" style={{ backgroundColor: '#f3f4f6' }}>
                  <img
                    src={photo.thumbnail}
                    alt="Event highlight"
                    style={{ 
                      width: '100%', 
                      height: '192px', 
                      objectFit: 'cover',
                      display: 'block'
                    }}
                    onError={(e) => {
                      e.currentTarget.src = photo.compressed;
                    }}
                  />
                  <div className="p-2 text-center">
                    <a
                      href={photo.image}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                    >
                      View Full Size
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasMore && !loading && highlights.length > 0 && (
            <div className="mt-8 text-center">
              <button
                onClick={loadHighlights}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
              >
                Load More
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading highlights...</p>
            </div>
          )}

          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-gray-600 mb-4">Want to find your photos?</p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/anonymous"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Quick Match
              </Link>
              <Link
                href="/registered"
                className="bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

