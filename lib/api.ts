import {
  WallOfFameResponse,
  OTPResponse,
  VerifyOTPResponse,
  MatchResponse,
  AnonymousMatchResponse,
  AnonymousPhoto,
  ClusteringStatsResponse,
  ErrorResponse,
  RegisterResponse,
  RegisterFormData,
  PhotoPermissionResponse,
  EventHighlightsResponse,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class InstaSnapAPI {
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: ErrorResponse = await response.json().catch(() => ({
        error: 'Network error occurred',
      }));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  async getWallOfFame(eventId: string, skip = 0, limit = 50): Promise<WallOfFameResponse> {
    const response = await fetch(
      `${API_BASE}/api/v1/insta-snap/wall-fame?event=${eventId}&skip=${skip}&limit=${limit}`
    );
    return this.handleResponse<WallOfFameResponse>(response);
  }

  async downloadPhoto(imageId: string, eventId: string): Promise<Blob> {
    const response = await fetch(
      `${API_BASE}/api/v1/insta-snap/download?imageId=${imageId}&event=${eventId}`
    );
    if (!response.ok) {
      throw new Error('Failed to download photo');
    }
    return response.blob();
  }

  async register(formData: RegisterFormData): Promise<RegisterResponse> {
    // Remove '+' from country code to match database format
    const phoneCode = formData.phoneCode.replace('+', '');

    const form = new FormData();
    form.append('mobile', formData.mobile);
    form.append('event', formData.eventId);
    form.append('phoneCode', phoneCode);
    form.append('emailId', formData.emailId);
    form.append('fullName', formData.firstName);
    form.append('file', formData.selfie);

    const response = await fetch(`${API_BASE}/api/v1/auth/signup-mobile-with-country`, {
      method: 'POST',
      body: form,
    });

    const data = await response.json();

    // Handle both success and error response formats
    if (!response.ok || data.success === false) {
      const errorMessage = data.error || data.message || 'Registration failed';
      throw new Error(errorMessage);
    }

    return data;
  }

  async sendOTP(mobile: string, eventId: string, countryCode = '+91'): Promise<OTPResponse> {
    // Remove '+' from country code to match database format
    const phoneCode = countryCode.replace('+', '');

    const response = await fetch(`${API_BASE}/api/v1/auth/login-mobile-with-country`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile,
        event: eventId,
        phoneCode: phoneCode  // Send "91" instead of "+91"
      }),
    });

    const data = await response.json();

    // Handle both success and error response formats
    if (!response.ok || data.success === false) {
      const errorMessage = data.error || data.message || 'Failed to send OTP';
      throw new Error(errorMessage);
    }

    return data;
  }

  async verifyOTP(mobile: string, enteredOtp: string, eventId: string, countryCode = '+91'): Promise<VerifyOTPResponse> {
    // Remove '+' from country code to match database format
    const phoneCode = countryCode.replace('+', '');

    const response = await fetch(`${API_BASE}/api/v1/auth/verify-otp-with-country`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile,
        otp: enteredOtp,
        event: eventId,
        phoneCode: phoneCode  // Send "91" instead of "+91"
      }),
    });

    const data = await response.json();

    // Handle both success and error response formats
    if (!response.ok || data.success === false) {
      const errorMessage = data.error || data.message || 'OTP verification failed';
      return {
        message: errorMessage,
        verified: false,
        error: errorMessage
      };
    }

    // Success response
    return {
      ...data,
      verified: true
    };
  }

  async matchRegistered(
    mobile: string,
    eventId: string,
    userId: string,
    token: string,
    file?: File,
    forceRefresh?: boolean,
    additionalData?: {
      name?: string;
      designation?: string;
      companyName?: string;
      gender?: string;
    }
  ): Promise<MatchResponse> {
    const formData = new FormData();
    formData.append('mobile', mobile);
    formData.append('eventId', eventId);
    formData.append('userId', userId);

    if (file) {
      formData.append('file', file);
    }

    if (forceRefresh) {
      formData.append('forceRefresh', 'true');
    }

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
    }

    const response = await fetch(`${API_BASE}/api/v1/mobile/instasnap/match`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    return this.handleResponse<MatchResponse>(response);
  }

  async matchAnonymous(file: File, eventId: string): Promise<AnonymousMatchResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('eventId', eventId);

    const response = await fetch(`${API_BASE}/api/v1/insta-snap/match-anonymous`, {
      method: 'POST',
      body: formData,
    });

    const data = await this.handleResponse<any>(response);

    console.log('Raw API response:', data);
    console.log('Photos from API:', data.photos);

    // Transform backend response to match frontend type
    // Backend returns: { _id, image, compressed, thumbnail }
    // Frontend expects: { imageId, originalUrl, compressedUrl, thumbnailUrl }
    const transformedPhotos: AnonymousPhoto[] = data.photos.map((photo: any) => {
      console.log('Transforming photo:', photo);
      return {
        imageId: photo._id,
        originalUrl: photo.image,
        compressedUrl: photo.compressed,
        thumbnailUrl: photo.thumbnail,
        uploadDate: photo.uploadDate,
      };
    });

    console.log('Transformed photos:', transformedPhotos);

    return {
      success: data.success,
      message: data.message,
      matched: data.matched,
      groupId: data.matchedGroup?.groupId || data.groupId,
      similarity: data.matchedGroup?.similarity || data.similarity,
      photos: transformedPhotos,
      processingTime: data.processingTime,
    };
  }

  async downloadZIP(groupId: string): Promise<Blob> {
    const response = await fetch(`${API_BASE}/api/v1/insta-snap/generate-document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId, format: 'zip' }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate ZIP');
    }
    return response.blob();
  }

  async getClusteringStats(eventId: string): Promise<ClusteringStatsResponse> {
    const response = await fetch(
      `${API_BASE}/api/v1/insta-snap/clustering-stats?eventId=${eventId}`
    );
    return this.handleResponse<ClusteringStatsResponse>(response);
  }

  async getPhotoPermission(eventId: string): Promise<PhotoPermissionResponse> {
    const response = await fetch(
      `${API_BASE}/api/v1/photo-permission?searchkey=&photoViewAccess=&event=${eventId}`
    );
    return this.handleResponse<PhotoPermissionResponse>(response);
  }

  async getEventHighlights(eventId: string, skip = 0, limit = 50): Promise<EventHighlightsResponse> {
    const response = await fetch(
      `${API_BASE}/api/v1/insta-snap?event=${eventId}&isHighlight=true`
    );

    const data = await this.handleResponse<EventHighlightsResponse>(response);

    // Transform relative paths to full S3 URLs
    const S3_BASE = 'https://event-hex-saas.s3.us-east-1.amazonaws.com';
    const transformedResponse = data.response.map((photo) => ({
      ...photo,
      image: photo.image.startsWith('http') ? photo.image : `${S3_BASE}/${photo.image}`,
      compressed: photo.compressed.startsWith('http') ? photo.compressed : `${S3_BASE}/${photo.compressed}`,
      thumbnail: photo.thumbnail.startsWith('http') ? photo.thumbnail : `${S3_BASE}/${photo.thumbnail}`,
    }));

    return {
      ...data,
      response: transformedResponse,
    };
  }

  async getAllEventPhotos(eventId: string, page = 1, limit = 50): Promise<EventHighlightsResponse> {
    const response = await fetch(
      `${API_BASE}/api/v1/insta-snap/event-images?event=${eventId}&page=${page}&limit=${limit}`
    );

    const data = await this.handleResponse<EventHighlightsResponse>(response);

    // Transform relative paths to full S3 URLs
    const S3_BASE = 'https://event-hex-saas.s3.us-east-1.amazonaws.com';
    const transformedResponse = data.response.map((photo) => ({
      ...photo,
      image: photo.image.startsWith('http') ? photo.image : `${S3_BASE}/${photo.image}`,
      compressed: photo.compressed.startsWith('http') ? photo.compressed : `${S3_BASE}/${photo.compressed}`,
      thumbnail: photo.thumbnail.startsWith('http') ? photo.thumbnail : `${S3_BASE}/${photo.thumbnail}`,
    }));

    return {
      ...data,
      response: transformedResponse,
    };
  }

  async getUserMatches(userId: string, eventId: string): Promise<{ success: boolean; matches: any[]; count: number }> {
    const response = await fetch(
      `${API_BASE}/api/v1/mobile/instasnap/user-matches?userId=${userId}&eventId=${eventId}`
    );
    return this.handleResponse<{ success: boolean; matches: any[]; count: number }>(response);
  }
}

export const api = new InstaSnapAPI();
