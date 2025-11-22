'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { EventPhoto, PhotoPermission } from '@/lib/types';
import { storage } from '@/lib/storage';
import { downloadBlob, formatPhoneNumber, validatePhoneNumber, compressImage } from '@/lib/utils';
import Link from 'next/link';

type Step = 'mode' | 'register' | 'mobile' | 'otp' | 'selfie' | 'photos';

export default function RegisteredUserPage() {
  const [step, setStep] = useState<Step>('mode');
  const [photoPermission, setPhotoPermission] = useState<PhotoPermission | null>(null);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [mobile, setMobile] = useState('');
  const [firstName, setFirstName] = useState('');
  const [emailId, setEmailId] = useState('');
  const [otp, setOtp] = useState('');
  const [selfie, setSelfie] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [photos, setPhotos] = useState<EventPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  const eventId = process.env.NEXT_PUBLIC_EVENT_ID || '';
  const countryCode = '+91'; // Default country code, can be made configurable

  useEffect(() => {
    // Fetch photo permissions
    const fetchPhotoPermission = async () => {
      try {
        const response = await api.getPhotoPermission(eventId);
        if (response.success && response.response.length > 0) {
          setPhotoPermission(response.response[0]);
          
          // If Attendees mode, set step to mobile login
          if (response.response[0].photoViewAccess === 'Attendees') {
            setStep('mobile');
          }
        }
      } catch (error) {
        console.error('Failed to fetch photo permissions:', error);
      } finally {
        setIsLoadingPermissions(false);
      }
    };

    // Check if user already has a session
    const session = storage.getUserSession();
    if (session) {
      setMobile(session.mobile);
      const cached = storage.getPhotosCache(session.mobile, eventId);
      if (cached && cached.photos.length > 0) {
        setPhotos(cached.photos as EventPhoto[]);
        if (cached.groupId) setGroupId(cached.groupId);
        setStep('photos');
        setIsLoadingPermissions(false);
        return; // Skip permission check if already logged in
      }
    } else {
      const savedMobile = storage.getLastMobile();
      if (savedMobile) {
        setMobile(savedMobile);
      }
    }

    fetchPhotoPermission();
  }, [eventId]);

  const handleRegister = async () => {
    if (!validatePhoneNumber(mobile)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!emailId || !emailId.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (!firstName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!selfie) {
      setError('Please upload a selfie');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await api.register({
        firstName,
        mobile,
        emailId,
        eventId,
        phoneCode: countryCode,
        selfie,
      });

      if (result.success) {
        setIsNewUser(true);
        storage.setLastMobile(mobile);
        setStep('otp');
      } else {
        setError(result.message || 'Registration failed');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Registration failed';
      if (errorMsg.includes('already registered')) {
        setError('You are already registered! Please use Login instead.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!validatePhoneNumber(mobile)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await api.sendOTP(mobile, eventId, countryCode);
      if (result.message) {
        storage.setLastMobile(mobile);
        setStep('otp');
      } else {
        setError(result.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 4) {
      setError('Please enter the 4-digit OTP');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await api.verifyOTP(mobile, otp, eventId, countryCode);
      
      if (result.verified && result.token && result.userId) {
        // Store authentication data
        setToken(result.token);
        setUserId(result.userId);
        storage.setUserSession(mobile, eventId, true);

        // Check if user needs to upload selfie
        if (result.requiresSelfie) {
          setStep('selfie');
        } else if (result.photos && result.photos.length > 0) {
          // User already has photos! Convert FaceMatch to EventPhoto format
          const eventPhotos = result.photos.map(match => ({
            _id: match._id,
            image: match.image,
            compressed: match.image,
            thumbnail: match.thumbnail,
            uploadDate: match.matchDate,
            event: match.event,
          }));
          
          setPhotos(eventPhotos);
          if (result.groupId) {
            setGroupId(result.groupId);
            storage.setGroupId(result.groupId);
          }
          storage.setPhotosCache(mobile, eventId, { photos: eventPhotos, groupId: result.groupId });
          setStep('photos');
        } else {
          // No photos yet, need selfie
          setStep('selfie');
        }
      } else {
        setError(result.message || result.error || 'Invalid OTP');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    try {
      const compressedFile = await compressImage(file);
      setSelfie(compressedFile);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);
    } catch {
      setError('Failed to process image');
    }
  };

  const handleMatchRegistered = async () => {
    if (!selfie) {
      setError('Please upload a selfie first');
      return;
    }

    if (!userId || !token) {
      setError('Authentication failed. Please try logging in again.');
      setStep('mobile');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fullMobile = `${countryCode}${mobile}`;
      const result = await api.matchRegistered(fullMobile, eventId, userId, token, selfie);
      
      if (result.matched && result.FaceMatches) {
        // Convert FaceMatches to EventPhoto format
        const photos = result.FaceMatches.map(match => ({
          _id: match._id,
          image: match.image,
          compressed: match.image,
          thumbnail: match.thumbnail,
          uploadDate: match.matchDate,
          event: match.event,
        }));
        
        setPhotos(photos);
        const groupId = result.groupInfo?.groupId || '';
        if (groupId) {
          setGroupId(groupId);
          storage.setGroupId(groupId);
        }
        storage.setPhotosCache(mobile, eventId, { photos, groupId });
        setStep('photos');
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

  const handleLogout = () => {
    storage.clearUserSession();
    storage.clearPhotosCache(mobile, eventId);
    setStep('mode');
    setMobile('');
    setFirstName('');
    setEmailId('');
    setOtp('');
    setSelfie(null);
    setPreview(null);
    setPhotos([]);
    setGroupId(null);
    setUserId(null);
    setToken(null);
    setError(null);
    setIsNewUser(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-indigo-600 hover:text-indigo-700 font-medium">
            ← Back to Home
          </Link>
        </div>

        {isLoadingPermissions ? (
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {step === 'mode' ? 'Welcome to InstaSnap' : step === 'register' ? 'New User Registration' : 'Login to Your Account'}
            </h1>
            <p className="text-gray-600 mb-6">
              {step === 'mode' 
                ? 'Choose how you want to access your event photos'
              : step === 'register'
              ? 'Create your account and get your photos!'
              : 'Login once and access your photos anytime!'}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {step === 'mode' && (
            <div className="space-y-4">
              <button
                onClick={() => setStep('mobile')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors text-left flex items-center justify-between"
              >
                <div>
                  <div className="text-lg">Already Registered</div>
                  <div className="text-sm text-indigo-100">Login with your mobile number</div>
                </div>
                <span className="text-2xl">→</span>
              </button>

              {photoPermission?.photoViewAccess !== 'Attendees' && (
                <button
                  onClick={() => setStep('register')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors text-left flex items-center justify-between"
                >
                  <div>
                    <div className="text-lg">New User</div>
                    <div className="text-sm text-green-100">Register now and get your photos</div>
                  </div>
                  <span className="text-2xl">→</span>
                </button>
              )}
            </div>
          )}

          {step === 'register' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  maxLength={10}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Format: {formatPhoneNumber(mobile) || '(___) ___-____'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={emailId}
                  onChange={(e) => setEmailId(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Your Selfie *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleFileChange}
                    className="hidden"
                    id="selfie-upload-register"
                  />
                  <label
                    htmlFor="selfie-upload-register"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    {preview ? (
                      <div className="w-48 h-48 bg-gray-100 rounded-lg mb-4 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-48 h-48 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                        <span className="text-gray-400 text-4xl">📷</span>
                      </div>
                    )}
                    <span className="text-green-600 font-medium">
                      {preview ? 'Change Photo' : 'Click to Upload or Take Photo'}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      This helps us find your photos automatically
                    </span>
                  </label>
                </div>
              </div>

              <button
                onClick={handleRegister}
                disabled={!mobile || !emailId || !firstName || !selfie || loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {loading ? 'Creating Account...' : 'Register & Get Photos'}
              </button>

              <button
                onClick={() => {
                  setStep('mode');
                  setError(null);
                }}
                className="w-full text-gray-600 hover:text-gray-700 font-medium"
              >
                ← Back to Options
              </button>
            </div>
          )}

          {step === 'mobile' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  maxLength={10}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Format: {formatPhoneNumber(mobile) || '(___) ___-____'}
                </p>
              </div>

              <button
                onClick={handleSendOTP}
                disabled={!mobile || loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>

              <button
                onClick={() => {
                  setStep('mode');
                  setError(null);
                }}
                className="w-full text-gray-600 hover:text-gray-700 font-medium"
              >
                ← Back to Options
              </button>
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
                {isNewUser 
                  ? `Registration successful! OTP sent to ${formatPhoneNumber(mobile)}`
                  : `OTP sent to ${formatPhoneNumber(mobile)}`}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="Enter 4-digit OTP"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-2xl tracking-widest"
                  maxLength={4}
                />
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={otp.length !== 4 || loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <button
                onClick={() => isNewUser ? setStep('register') : setStep('mobile')}
                className="w-full text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {isNewUser ? 'Change Registration Details' : 'Change Mobile Number'}
              </button>
            </div>
          )}

          {step === 'selfie' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
                {isNewUser 
                  ? 'Your account is verified! Now finding your photos...'
                  : 'First time login! Please upload a selfie to match your photos.'}
              </div>

              {!isNewUser && (
                <>
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
                        id="selfie-upload-registered"
                      />
                      <label
                        htmlFor="selfie-upload-registered"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        {preview ? (
                          <div className="w-48 h-48 bg-gray-100 rounded-lg mb-4 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                          </div>
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

                  <button
                    onClick={handleMatchRegistered}
                    disabled={!selfie || loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    {loading ? 'Analyzing...' : 'Find My Photos'}
                  </button>
                </>
              )}

              {isNewUser && (
                <button
                  onClick={handleMatchRegistered}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  {loading ? 'Finding Your Photos...' : 'Continue to Photos'}
                </button>
              )}
            </div>
          )}

          {step === 'photos' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                <div className="font-semibold">Found {photos.length} photos!</div>
                <div className="text-sm">Logged in as {formatPhoneNumber(mobile)}</div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDownloadZIP}
                  disabled={loading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  {loading ? 'Preparing...' : `Download All (${photos.length})`}
                </button>
                <button
                  onClick={handleLogout}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Logout
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <div key={photo._id} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.thumbnail}
                      alt="Event photo"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <a
                      href={photo.compressed}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg flex items-center justify-center"
                    >
                      <span className="opacity-0 group-hover:opacity-100 text-white font-medium">
                        View Full
                      </span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  );
}
