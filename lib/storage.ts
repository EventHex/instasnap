// Local storage utilities for caching

const STORAGE_KEYS = {
  LAST_MOBILE: 'instasnap_last_mobile',
  GROUP_ID: 'instasnap_group_id',
  PHOTOS_CACHE: 'instasnap_photos_',
  USER_SESSION: 'instasnap_user_session',
} as const;

export const storage = {
  // Mobile number
  getLastMobile(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.LAST_MOBILE);
  },

  setLastMobile(mobile: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.LAST_MOBILE, mobile);
  },

  clearLastMobile(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.LAST_MOBILE);
  },

  // Group ID for anonymous users
  getGroupId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.GROUP_ID);
  },

  setGroupId(groupId: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.GROUP_ID, groupId);
  },

  clearGroupId(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.GROUP_ID);
  },

  // Photos cache (session storage for temporary caching)
  getPhotosCache(mobile: string, eventId: string): { photos: unknown[]; groupId?: string } | null {
    if (typeof window === 'undefined') return null;
    const cacheKey = `${STORAGE_KEYS.PHOTOS_CACHE}${mobile}_${eventId}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (!cached) return null;

    try {
      const { data, timestamp } = JSON.parse(cached);
      const FIVE_MINUTES = 5 * 60 * 1000;
      
      if (Date.now() - timestamp > FIVE_MINUTES) {
        sessionStorage.removeItem(cacheKey);
        return null;
      }
      
      return data;
    } catch {
      return null;
    }
  },

  setPhotosCache(mobile: string, eventId: string, data: { photos: unknown[]; groupId?: string }): void {
    if (typeof window === 'undefined') return;
    const cacheKey = `${STORAGE_KEYS.PHOTOS_CACHE}${mobile}_${eventId}`;
    sessionStorage.setItem(
      cacheKey,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  },

  clearPhotosCache(mobile: string, eventId: string): void {
    if (typeof window === 'undefined') return;
    const cacheKey = `${STORAGE_KEYS.PHOTOS_CACHE}${mobile}_${eventId}`;
    sessionStorage.removeItem(cacheKey);
  },

  // User session
  getUserSession(): { mobile: string; eventId: string; isVerified: boolean } | null {
    if (typeof window === 'undefined') return null;
    const session = sessionStorage.getItem(STORAGE_KEYS.USER_SESSION);
    return session ? JSON.parse(session) : null;
  },

  setUserSession(mobile: string, eventId: string, isVerified: boolean): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(
      STORAGE_KEYS.USER_SESSION,
      JSON.stringify({ mobile, eventId, isVerified })
    );
  },

  clearUserSession(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(STORAGE_KEYS.USER_SESSION);
  },

  // Clear all
  clearAll(): void {
    if (typeof window === 'undefined') return;
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  },
};
