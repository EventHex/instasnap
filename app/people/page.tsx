'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Person } from '@/lib/types';
import Image from 'next/image';
import { Footer } from '@/components/layout/Footer';
import { Users, ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const eventId = process.env.NEXT_PUBLIC_EVENT_ID || '';

  useEffect(() => {
    const fetchPeople = async () => {
      try {
        const response = await api.getPeople(eventId);
        console.log('[People] API Response:', response);
        if (response.success) {
          console.log('[People] People data:', response.people);
          setPeople(response.people);
        }
      } catch (error) {
        console.error('Failed to fetch people:', error);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchPeople();
    }
  }, [eventId]);

  return (
    <div className="flex flex-col h-dvh w-full relative overflow-hidden bg-background">
      {/* Ambient Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[50%] bg-violet-500/10 rounded-full blur-[120px] animate-float pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[50%] bg-fuchsia-500/10 rounded-full blur-[120px] animate-float animate-delay-500 pointer-events-none" />

      <div className="flex-1 flex flex-col items-center pt-24 md:pt-32 py-8 px-6 animate-fade-in relative z-10 overflow-y-auto">
        <div className="w-full max-w-7xl space-y-12 pb-24">

          {/* Header */}
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-3xl bg-linear-to-tr from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center ring-1 ring-white/10">
                <Users className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-thin tracking-tighter text-white drop-shadow-2xl">
              Event <br />
              <span className="font-bold text-transparent bg-clip-text bg-linear-to-r from-violet-400 via-fuchsia-400 to-pink-400 animate-shimmer bg-size-[200%_auto]">
                People
              </span>
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto font-light">
              {loading ? 'Loading...' : `${people.length} unique ${people.length === 1 ? 'person' : 'people'} detected at this event`}
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}

          {/* People Grid */}
          {!loading && people.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {people.map((person, index) => (
                <motion.div
                  key={person.groupId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <Link
                    href={`/people/${person.groupId}`}
                    className="block group"
                  >
                    <div className="relative aspect-square rounded-2xl md:rounded-3xl overflow-hidden glass hover:scale-105 transition-all duration-500">
                      <Image
                        src={person.representativeFace}
                        alt={`Person ${index + 1}`}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23ffffff10" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="48" fill="%23ffffff40"%3E%3F%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Photo Count Badge - Always Visible */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-center gap-2 bg-black/70 backdrop-blur-xl rounded-xl py-2 px-3">
                        <ImageIcon className="w-4 h-4 text-white" />
                        <span className="text-sm font-semibold text-white">
                          {person.matchCount} {person.matchCount === 1 ? 'photo' : 'photos'}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && people.length === 0 && (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-white/5 text-5xl mb-6 shadow-inner ring-1 ring-white/10">
                <Users className="w-12 h-12 text-white/60" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">No People Detected</h3>
              <p className="text-white/60">Check back later as more photos are uploaded.</p>
            </div>
          )}

        </div>
      </div>
      <Footer />
    </div>
  );
}
