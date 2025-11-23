// Local storage utilities for caching

const STORAGE_KEYS = {
  LAST_MOBILE: 'instasnap_last_mobile',
  GROUP_ID: 'instasnap_group_id',
  PHOTOS_CACHE: 'instasnap_photos_',
  USER_SESSION: 'instasnap_user_session',
  AUTH_TOKEN: 'instasnap_auth_token',
  REFRESH_TOKEN: 'instasnap_refresh_token',
  USER_DATA: 'instasnap_user_data',
  MATCHED_PHOTOS: 'instasnap_matched_photos',
  ANONYMOUS_SELFIE: 'instasnap_anonymous_selfie', // Store anonymous user's selfie
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

  // Authenticated user data
  getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  setAuthToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  },

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  setRefreshToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  },

  getUserData(): any | null {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  },

  setUserData(user: any): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  },

  getMatchedPhotos(): any[] | null {
    if (typeof window === 'undefined') return null;
    const photos = localStorage.getItem(STORAGE_KEYS.MATCHED_PHOTOS);
    return photos ? JSON.parse(photos) : null;
  },

  setMatchedPhotos(photos: any[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.MATCHED_PHOTOS, JSON.stringify(photos));
  },

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!this.getAuthToken() && !!this.getUserData();
  },

  // Anonymous selfie storage (for "Find More Photos" feature)
  getAnonymousSelfie(): File | null {
    if (typeof window === 'undefined') return null;
    const stored = sessionStorage.getItem(STORAGE_KEYS.ANONYMOUS_SELFIE);
    if (!stored) return null;
    
    try {
      const { dataUrl, name, type, size, timestamp } = JSON.parse(stored);
      const ONE_HOUR = 60 * 60 * 1000;
      
      // Expire after 1 hour for security
      if (Date.now() - timestamp > ONE_HOUR) {
        this.clearAnonymousSelfie();
        return null;
      }
      
      // Convert base64 back to File
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], name, { type: mime });
    } catch {
      return null;
    }
  },

  setAnonymousSelfie(file: File): void {
    if (typeof window === 'undefined') return;
    
    // Convert File to base64 for storage
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const data = {
        dataUrl,
        name: file.name,
        type: file.type,
        size: file.size,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(STORAGE_KEYS.ANONYMOUS_SELFIE, JSON.stringify(data));
    };
    reader.readAsDataURL(file);
  },

  clearAnonymousSelfie(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(STORAGE_KEYS.ANONYMOUS_SELFIE);
  },

  hasAnonymousSelfie(): boolean {
    if (typeof window === 'undefined') return false;
    return !!sessionStorage.getItem(STORAGE_KEYS.ANONYMOUS_SELFIE);
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
