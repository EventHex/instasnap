'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { EventPhoto } from '@/lib/types';
import Image from 'next/image';
import { Footer } from '@/components/layout/Footer';
import { ArrowLeft, Download, ExternalLink, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PersonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  const [photos, setPhotos] = useState<EventPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<EventPhoto | null>(null);
  const eventId = process.env.NEXT_PUBLIC_EVENT_ID || '';

  // Generate random heights for masonry effect
  const getRandomHeight = (index: number) => {
    const heights = ['h-64', 'h-80', 'h-96', 'h-72', 'h-60'];
    return heights[index % heights.length];
  };

  useEffect(() => {
    const fetchPersonPhotos = async () => {
      try {
        const response = await api.getPersonPhotos(groupId, eventId);
        if (response.success) {
          setPhotos(response.photos);
        }
      } catch (error) {
        console.error('Failed to fetch person photos:', error);
      } finally {
        setLoading(false);
      }
    };

    if (eventId && groupId) {
      fetchPersonPhotos();
    }
  }, [eventId, groupId]);

  return (
    <div className="flex flex-col h-dvh w-full relative overflow-hidden bg-background">
      {/* Ambient Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[50%] bg-violet-500/10 rounded-full blur-[120px] animate-float pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[50%] bg-fuchsia-500/10 rounded-full blur-[120px] animate-float animate-delay-500 pointer-events-none" />

      <div className="flex-1 flex flex-col items-center pt-24 md:pt-32 py-8 px-6 animate-fade-in relative z-10 overflow-y-auto">
        <div className="w-full max-w-7xl space-y-12 pb-24">

          {/* Header with Back Button */}
          <div className="space-y-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to People</span>
            </button>

            <div className="text-center space-y-4">
              <h1 className="text-5xl md:text-7xl font-thin tracking-tighter text-white drop-shadow-2xl">
                Person <br />
                <span className="font-bold text-transparent bg-clip-text bg-linear-to-r from-violet-400 via-fuchsia-400 to-pink-400 animate-shimmer bg-size-[200%_auto]">
                  Photos
                </span>
              </h1>
              <p className="text-xl text-white/60 max-w-2xl mx-auto font-light">
                {loading ? 'Loading...' : `${photos.length} ${photos.length === 1 ? 'photo' : 'photos'} featuring this person`}
              </p>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}

          {/* Masonry Gallery Grid */}
          {!loading && photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {photos.map((photo, index) => (
                <motion.div
                  key={photo._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={`${getRandomHeight(index)} relative rounded-2xl overflow-hidden glass cursor-pointer group`}
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <Image
                    src={photo.thumbnail}
                    alt="Event photo"
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && photos.length === 0 && (
            <div className="text-center py-20">
              <h3 className="text-2xl font-bold text-white mb-2">No Photos Found</h3>
              <p className="text-white/60">This person has no photos yet.</p>
            </div>
          )}

        </div>

        {/* Lightbox Modal */}
        <AnimatePresence>
          {selectedPhoto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl"
              onClick={() => setSelectedPhoto(null)}
            >
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center rounded-full glass hover:bg-white/10 transition-colors z-10"
              >
                <X className="w-6 h-6 text-white" />
              </button>

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-7xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative w-full h-[80vh]">
                  <Image
                    src={selectedPhoto.image}
                    alt="Full size photo"
                    fill
                    className="object-contain"
                  />
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 via-black/40 to-transparent p-6">
                  <div className="flex gap-3 justify-center">
                    <a
                      href={selectedPhoto.image}
                      download
                      className="flex items-center gap-2 px-6 py-3 glass rounded-xl hover:bg-white/10 transition-colors text-white font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download className="w-5 h-5" />
                      Download
                    </a>
                    <a
                      href={selectedPhoto.image}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-3 glass rounded-xl hover:bg-white/10 transition-colors text-white font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-5 h-5" />
                      Open
                    </a>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
}
