'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { AnonymousPhoto } from '@/lib/types';
import { storage } from '@/lib/storage';
import { downloadBlob, compressImage } from '@/lib/utils';
import Link from 'next/link';

export default function AnonymousMatchPage() {
  const [selfie, setSelfie] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [photos, setPhotos] = useState<AnonymousPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matched, setMatched] = useState(false);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState<string>('');

  const eventId = process.env.NEXT_PUBLIC_EVENT_ID || '';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    try {
      // Compress image if needed
      const compressedFile = await compressImage(file);
      setSelfie(compressedFile);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);
    } catch {
      setError('Failed to process image');
    }
  };

  const handleMatch = async () => {
    if (!selfie) {
      setError('Please upload a selfie first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await api.matchAnonymous(selfie, eventId);
      
      setMatched(result.matched);
      setProcessingTime(result.processingTime);

      if (result.matched && result.photos) {
        setPhotos(result.photos);
        if (result.groupId) {
          setGroupId(result.groupId);
          storage.setGroupId(result.groupId);
        }
      } else {
        setError(result.message || 'No matching photos found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to match photos');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadZIP = async () => {
    if (!groupId) {
      setError('No group ID available for download');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const blob = await api.downloadZIP(groupId);
      downloadBlob(blob, `event-photos-${Date.now()}.zip`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download ZIP');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelfie(null);
    setPreview(null);
    setPhotos([]);
    setMatched(false);
    setGroupId(null);
    setError(null);
    setProcessingTime('');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-indigo-600 hover:text-indigo-700 font-medium">
            ← Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Anonymous Match</h1>
          <p className="text-gray-600 mb-6">Upload a selfie to find your photos instantly - no registration needed!</p>

          {!matched ? (
            <div className="space-y-6">
              {/* Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Your Selfie
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleFileChange}
                    className="hidden"
                    id="selfie-upload"
                  />
                  <label
                    htmlFor="selfie-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    {preview ? (
                      <img src={preview} alt="Preview" className="w-48 h-48 object-cover rounded-lg mb-4" />
                    ) : (
                      <div className="w-48 h-48 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                        <span className="text-gray-400 text-4xl">📷</span>
                      </div>
                    )}
                    <span className="text-indigo-600 font-medium">
                      {preview ? 'Change Photo' : 'Click to Upload or Take Photo'}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      Maximum file size: 10MB
                    </span>
                  </label>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                onClick={handleMatch}
                disabled={!selfie || loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {loading ? 'Analyzing...' : 'Find My Photos'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Success Message */}
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                <div className="font-semibold">Found {photos.length} photos!</div>
                <div className="text-sm">Processing time: {processingTime}</div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleDownloadZIP}
                  disabled={loading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  {loading ? 'Preparing...' : `Download All (${photos.length})`}
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Try Again
                </button>
              </div>

              {/* Photo Gallery */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo, index) => (
                  <div key={photo.imageId} className="overflow-hidden rounded-lg" style={{ backgroundColor: '#f3f4f6' }}>
                    <img
                      src={photo.thumbnailUrl}
                      alt={`Event photo ${index + 1}`}
                      style={{ 
                        width: '100%', 
                        height: '192px', 
                        objectFit: 'cover',
                        display: 'block',
                        opacity: 1,
                        filter: 'none'
                      }}
                      crossOrigin="anonymous"
                      onError={(e) => {
                        console.error('Image failed to load:', photo.thumbnailUrl);
                        e.currentTarget.src = photo.compressedUrl;
                      }}
                      onLoad={(e) => {
                        console.log('Image loaded successfully:', photo.thumbnailUrl);
                        console.log('Image dimensions:', e.currentTarget.naturalWidth, 'x', e.currentTarget.naturalHeight);
                      }}
                    />
                    <div className="p-2 text-center">
                      <a
                        href={photo.originalUrl}
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

              {/* Convert to Registered */}
              <div className="border-t pt-6">
                <p className="text-gray-600 mb-3">Want to save time on future visits?</p>
                <Link
                  href="/registered"
                  className="inline-block bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  Register with Mobile
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
