// API Response Types

export interface EventPhoto {
  _id: string;
  image: string;
  compressed: string;
  thumbnail: string;
  uploadDate: string;
  event: string;
  isHighlight?: boolean;
  uploadedSize?: string;
  compressedSize?: string;
}

export interface WallOfFameResponse {
  success: boolean;
  message: string;
  response: EventPhoto[];
  count: number;
  totalCount: number;
  filterCount: number;
}

export interface FaceMatch {
  _id: string;
  imageId: string;
  image: string;
  thumbnail: string;
  matchDate: string;
  event: string;
  user: string;
  mobile?: string;
  name?: string;
}

export interface GroupInfo {
  groupId: string;
  totalPhotos: number;
  similarity?: number;
  linked: boolean;
}

export interface MatchResponse {
  success: boolean;
  message: string;
  matched: boolean;
  FaceMatches: FaceMatch[];
  groupInfo?: GroupInfo;
  processingTime: string;
  photos?: EventPhoto[];
  groupId?: string;
  error?: string;
}

export interface AnonymousPhoto {
  imageId: string;
  originalUrl: string;
  compressedUrl: string;
  thumbnailUrl: string;
  uploadDate: string;
}

export interface AnonymousMatchResponse {
  success: boolean;
  message: string;
  matched: boolean;
  groupId?: string;
  similarity?: number;
  photos: AnonymousPhoto[];
  processingTime: string;
}

export interface OTPResponse {
  message: string;
  otp?: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  token?: string;
  refreshToken?: string;
  userId?: string;
  user?: {
    _id: string;
    firstName: string;
    fullName: string;
    authenticationId: string;
    emailId: string;
    phoneCode: string;
    event: string;
    awsKeyImage?: string;
    formattedTicketNumber?: string;
  };
  mobile?: string;
  verified?: boolean;
  requiresSelfie?: boolean;
  photos?: FaceMatch[];
  groupId?: string;
  error?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface RegisterFormData {
  firstName: string;
  mobile: string;
  emailId: string;
  eventId: string;
  phoneCode: string;
  selfie: File;
}

export interface ErrorResponse {
  error: string;
  details?: string;
}

export interface ClusteringStats {
  totalGroups: number;
  totalFaceDetections: number;
  averageFacesPerGroup: number;
  clientMatchedGroups: number;
  unmatchedGroups: number;
  largestGroupSize: number;
  smallestGroupSize: number;
  groupSizeDistribution: Record<string, number>;
}

export interface ClusteringStatsResponse {
  success: boolean;
  eventId: string;
  statistics: ClusteringStats;
}

export interface PhotoPermission {
  _id: string;
  photoViewAccess: 'Everyone' | 'Attendees' | 'RegisteredOnly' | 'Private' | 'Public';
  enableSocialShare: boolean;
  enablePartnerSpotlights: boolean;
  enableEventHighlights: boolean;
  isWhatsappAuth: boolean;
  event: {
    _id: string;
    value: string;
  };
  name: boolean;
  whatsappNumber: boolean;
  mobileNumber: boolean;
  designation: boolean;
  company: boolean;
  gender: boolean;
  bio: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PhotoPermissionResponse {
  success: boolean;
  message: string;
  response: PhotoPermission[];
  count: number;
  totalCount: number;
  filterCount: number;
}

export interface EventHighlight {
  _id: string;
  image: string;
  compressed: string;
  thumbnail: string;
  uploadDate: string;
  event: string;
  isHighlight: boolean;
  album?: {
    _id: string;
    name: string;
    isFavourite: boolean;
  };
}

export interface EventHighlightsResponse {
  success: boolean;
  message: string;
  response: EventHighlight[];
  count: number;
  totalCount: number;
  filterCount: number;
}

export interface Person {
  _id: string;
  groupId: string;
  representativeFace: string;
  matchCount: number;
  qualityScore: number;
  eventImages: string[];
}

export interface PeopleResponse {
  success: boolean;
  people: Person[];
  totalPeople: number;
}

export interface PersonPhotosResponse {
  success: boolean;
  groupId: string;
  photos: EventPhoto[];
  totalPhotos: number;
}

export interface Album {
  _id: string;
  name: string;
  event: {
    _id: string;
    value: string;
  };
  isFavourite: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface AlbumResponse {
  success: boolean;
  message: string;
  response: Album[];
  count: number;
  totalCount: number;
  filterCount: number;
}

// UI State Types
export type UIStep = 'mobile' | 'otp' | 'selfie' | 'photos' | 'error';

export interface UIState {
  loading: boolean;
  uploading: boolean;
  analyzing: boolean;
  error: string | null;
  matched: boolean;
  photos: FaceMatch[] | AnonymousPhoto[];
  groupId: string | null;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinedAt: string;
}
