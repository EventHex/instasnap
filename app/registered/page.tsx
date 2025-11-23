'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { storage } from '@/lib/storage';
import { FaceMatch, PhotoPermission } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { AIMatchingLoader } from '@/components/ui/AIMatchingLoader';
import Link from 'next/link';
import Image from 'next/image';
import { Footer } from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Sparkles, Camera, Download, Image as ImageIcon, LogOut, RefreshCw, Send, CheckCircle, ArrowRight, Smartphone, KeyRound, ChevronDown } from 'lucide-react';

type Step = 'mobile' | 'otp' | 'selfie' | 'photos';

export default function RegisteredPage() {
  const router = useRouter();
  const [photoPermission, setPhotoPermission] = useState<PhotoPermission | null>(null);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [step, setStep] = useState<Step>('mobile');
  
  // Registration/Login state
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Form Data
  const [firstName, setFirstName] = useState('');
  const [mobile, setMobile] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [emailId, setEmailId] = useState('');
  const [registerSelfie, setRegisterSelfie] = useState<File | null>(null);
  const [registerSelfiePreview, setRegisterSelfiePreview] = useState<string | null>(null);
  
  // OTP
  const [otp, setOtp] = useState(['', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Selfie matching
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  
  // Results
  const [results, setResults] = useState<FaceMatch[]>([]);
  const [groupId, setGroupId] = useState<string | null>(null);
  
  // Auth state
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userMobile, setUserMobile] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [showAILoader, setShowAILoader] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const registerSelfieInputRef = useRef<HTMLInputElement>(null);
  const eventId = process.env.NEXT_PUBLIC_EVENT_ID || '';

  // Check authentication and load user photos on mount
  useEffect(() => {
    const loadAuthenticatedUser = async () => {
      const isAuth = storage.isAuthenticated();
      const storedUserData = storage.getUserData();
      const storedToken = storage.getAuthToken();
      const storedPhotos = storage.getMatchedPhotos();

      if (isAuth && storedUserData && storedToken) {
        setUserData(storedUserData);
        setUserId(storedUserData._id);
        setToken(storedToken);
        setUserMobile(storedUserData.authenticationId);
        setFirstName(storedUserData.firstName || storedUserData.fullName);
        
        // Load existing matched photos
        if (storedPhotos && storedPhotos.length > 0) {
          setResults(storedPhotos);
          setStep('photos');
        } else {
          // Fetch from API
          try {
            const response = await api.getUserMatches(storedUserData._id, eventId);
            if (response.success && response.matches && response.matches.length > 0) {
              setResults(response.matches);
              storage.setMatchedPhotos(response.matches);
              setStep('photos');
            } else {
              // User is logged in but has no photos yet
              setStep('selfie');
            }
          } catch (error) {
            console.error('Failed to fetch user matches:', error);
            setStep('selfie');
          }
        }
      }
    };

    loadAuthenticatedUser();
  }, [eventId]);

  useEffect(() => {
    const fetchPhotoPermission = async () => {
      try {
        const response = await api.getPhotoPermission(eventId);
        if (response.success && response.response.length > 0) {
          const permission = response.response[0];
          setPhotoPermission(permission);
          
          // Redirect if registered users cannot access
          const access = permission.photoViewAccess;
          if (access === 'Private' || access === 'Public') {
            router.push('/');
            return;
          }
        }
      } catch (error) {
        console.error('Failed to fetch photo permissions:', error);
      } finally {
        setIsLoadingPermissions(false);
      }
    };

    fetchPhotoPermission();
  }, [eventId, router]);

  // Handle registration selfie upload
  const handleRegisterSelfieUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRegisterSelfie(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setRegisterSelfiePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Check Mobile (First Step)
  const handleCheckMobile = async () => {
    if (!mobile) {
      setError('Please enter your mobile number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try to send OTP. If it fails, check if registration is allowed.
      await api.sendOTP(mobile, eventId, countryCode);
      setUserMobile(mobile);
      setStep('otp');
    } catch (err: any) {
      // If sending OTP fails, check if registration is allowed
      const access = photoPermission?.photoViewAccess;
      if (access === 'Attendees') {
        // Attendees mode: No registration allowed, only login for existing users
        setError('This number is not registered. Registration is restricted to attendees only.');
        return;
      }
      
      // For Everyone/Public, allow registration
      setIsRegistering(true);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle registration
  const handleRegister = async () => {
    if (!firstName || !mobile || !emailId || !registerSelfie) {
      setError('Please fill all fields and upload a selfie');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.register({
        firstName,
        mobile,
        emailId,
        eventId,
        phoneCode: countryCode,
        selfie: registerSelfie,
      });

      if (response.success) {
        // Move to OTP step
        setUserMobile(mobile);
        setStep('otp');
        // Automatically send OTP
        await api.sendOTP(mobile, eventId, countryCode);
      } else {
        setError(response.error || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle verify OTP
  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 4) {
      setError('Please enter complete OTP');
      return;
    }

    if (!userMobile) {
      setError('Mobile number not found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.verifyOTP(userMobile, otpString, eventId, countryCode);
      
      if (response.success && response.token && response.userId && response.user) {
        // Store authentication data
        storage.setAuthToken(response.token);
        if (response.refreshToken) {
          storage.setRefreshToken(response.refreshToken);
        }
        storage.setUserData(response.user);
        
        setToken(response.token);
        setUserId(response.userId);
        setUserData(response.user);
        setFirstName(response.user.firstName || response.user.fullName);
        
        // SMART FLOW: Check if user already has photos matched during registration
        console.log('[OTP] Checking for existing matches...');
        try {
          const matchesResponse = await api.getUserMatches(response.userId, eventId);
          if (matchesResponse.success && matchesResponse.matches && matchesResponse.matches.length > 0) {
            console.log(`[OTP] User already has ${matchesResponse.matches.length} matched photos!`);
            setResults(matchesResponse.matches);
            storage.setMatchedPhotos(matchesResponse.matches);
            setStep('photos');
            return;
          }
        } catch (err) {
          console.log('[OTP] No existing matches found');
        }
        
        // Check if user has awsKeyImage stored (uploaded during registration)
        if (response.user.awsKeyImage) {
          console.log('[OTP] User has awsKeyImage but no matches - running initial match...');
          try {
            // Run AWS match using stored awsKeyImage (no file upload needed!)
            const matchResponse = await api.matchRegistered(userMobile, eventId, response.userId, response.token, undefined, true);
            if (matchResponse.success && matchResponse.matched && matchResponse.FaceMatches && matchResponse.FaceMatches.length > 0) {
              console.log(`[OTP] Found ${matchResponse.FaceMatches.length} photos using stored selfie!`);
              setResults(matchResponse.FaceMatches);
              storage.setMatchedPhotos(matchResponse.FaceMatches);
              setStep('photos');
              return;
            }
          } catch (matchErr) {
            console.log('[OTP] Match attempt failed, will show selfie upload');
          }
        }
        
        // No matches and no awsKeyImage - user needs to upload selfie
        console.log('[OTP] No matches or awsKeyImage - directing to selfie upload');
        setStep('selfie');
      } else {
        setError(response.error || 'Invalid OTP. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle selfie upload for matching
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  // Handle selfie match
  const handleMatch = async () => {
    if (!file || !userMobile || !userId || !token) {
      setError('Missing required information');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.matchRegistered(userMobile, eventId, userId, token, file);
      
      if (response.success && response.matched) {
        const matches = response.FaceMatches || [];
        setResults(matches);
        setGroupId(response.groupInfo?.groupId || response.groupId || null);
        
        // Save matched photos to storage
        storage.setMatchedPhotos(matches);
        
        setStep('photos');
      } else {
        setError(response.message || 'No matching photos found. Please try a different selfie.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to match photos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh to get new photos from admin uploads
  const handleRefreshPhotos = async () => {
    if (!userId || !eventId) {
      setError('User information not found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.getUserMatches(userId, eventId);
      if (response.success && response.matches) {
        const newMatches = response.matches;
        setResults(newMatches);
        storage.setMatchedPhotos(newMatches);
        
        // Show success message if new photos found
        const newPhotoCount = newMatches.length - results.length;
        if (newPhotoCount > 0) {
          console.log(`Found ${newPhotoCount} new photos!`);
        } else {
          console.log('No new photos found');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to refresh photos');
    } finally {
      setLoading(false);
    }
  };

  // Smart Match Again - uses existing awsKeyImage, no upload needed!
  const handleSmartMatchAgain = async () => {
    if (!userMobile || !userId || !token) {
      setError('User information not found');
      return;
    }

    // Check if user has awsKeyImage
    if (!userData?.awsKeyImage) {
      setError('No stored image found. Please upload a selfie.');
      setStep('selfie');
      return;
    }

    setShowAILoader(true);
    setLoading(true);
    setError(null);

    try {
      console.log('[SmartMatch] Using stored awsKeyImage for re-matching with AWS...');
      
      // Call match API with forceRefresh=true to skip cache and run AWS matching
      const response = await api.matchRegistered(userMobile, eventId, userId, token, undefined, true);
      
      if (response.success && response.matched) {
        const matches = response.FaceMatches || [];
        setResults(matches);
        setGroupId(response.groupInfo?.groupId || response.groupId || null);
        
        // Save matched photos to storage
        storage.setMatchedPhotos(matches);
        
        console.log(`[SmartMatch] Found ${matches.length} photos using stored image (AWS re-match)`);
      } else {
        setError(response.message || 'No matching photos found.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to match photos. Please try again.');
    } finally {
      setTimeout(() => {
        setShowAILoader(false);
        setLoading(false);
      }, 1000); // Keep loader visible for smooth transition
    }
  };

  // Handle logout
  const handleLogout = () => {
    // Clear all stored data
    storage.clearAll();
    
    setStep('mobile');
    setIsRegistering(false);
    setFirstName('');
    setMobile('');
    setEmailId('');
    setRegisterSelfie(null);
    setRegisterSelfiePreview(null);
    setOtp(['', '', '', '']);
    setSelectedImage(null);
    setFile(null);
    setResults([]);
    setGroupId(null);
    setUserId(null);
    setToken(null);
    setUserMobile(null);
    setError(null);
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    if (!userMobile) return;
    setLoading(true);
    try {
      await api.sendOTP(userMobile, eventId, countryCode);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingPermissions) {
    return (
      <div className="h-dvh flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // Updated Card & Input Styles - Match Home Page Glassmorphism
  const cardClass = "glass p-8 space-y-6 animate-fade-in hover:scale-[1.01] transition-transform duration-500";
  const inputClass = "w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-white/10 transition-all text-base backdrop-blur-xl";
  const selectClass = "px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-white/10 backdrop-blur-xl transition-all appearance-none cursor-pointer min-w-[100px]";
  
  // Button Styles - Liquid Gradient Primary
  const buttonPrimaryClass = "w-full py-4 bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 text-white rounded-2xl font-bold text-base hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] active:scale-[0.98] transition-all shadow-lg border border-white/20 flex items-center justify-center gap-2 relative overflow-hidden";
  
  const buttonSecondaryClass = "w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-semibold text-base hover:scale-[1.02] active:scale-[0.98] transition-all border border-white/10 flex items-center justify-center gap-2 backdrop-blur-xl";

  return (
    <div className="flex flex-col h-dvh w-full relative overflow-hidden bg-background">
      {/* AI Matching Loader */}
      <AIMatchingLoader show={showAILoader} />
      
      {/* Ambient Background Effects - Match Home Page */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] animate-float pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] animate-float animate-delay-500 pointer-events-none" />

      <div className="flex-1 flex flex-col items-center pt-24 md:pt-32 py-8 px-6 relative z-10 overflow-y-auto">
        <div className="w-full max-w-2xl space-y-8 pb-12">

        {/* Header */}
        <div className="text-center space-y-4 md:space-y-6 animate-fade-in">
          {step !== 'photos' && (
            <>
              <h1 className="text-4xl md:text-6xl font-thin tracking-tighter text-white drop-shadow-2xl">
                Member <br />
                <span className="font-bold text-transparent bg-clip-text bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400 animate-shimmer bg-size-[200%_auto]">
                  Access
                </span>
              </h1>
              <p className="text-base md:text-lg text-white/60 max-w-xl mx-auto text-balance font-light leading-relaxed">
                {step === 'mobile' && !isRegistering && 'Enter your mobile number to access your photos.'}
                {step === 'mobile' && isRegistering && 'Create your account to get started.'}
                {step === 'otp' && 'Enter the verification code sent to your mobile.'}
                {step === 'selfie' && (userData ? 'Upload a new selfie to discover more photos.' : 'Upload a selfie to find your photos instantly.')}
              </p>
            </>
          )}
        </div>

        {/* Mobile Number & Registration Form */}
        {step === 'mobile' && (
          <div className={cardClass}>
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-white/70 tracking-wide">Mobile Number</label>
                  <div className="flex gap-3">
                    <div className="relative">
                      <select
                        value={countryCode}
                        onChange={(e) => {
                          setCountryCode(e.target.value);
                          if (isRegistering) setIsRegistering(false);
                          if (error) setError(null);
                        }}
                        className={selectClass}
                      >
                        <option value="+91" className="bg-background">+91</option>
                        <option value="+1" className="bg-background">+1</option>
                        <option value="+44" className="bg-background">+44</option>
                        <option value="+971" className="bg-background">+971</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                    </div>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => {
                        setMobile(e.target.value);
                        if (isRegistering) setIsRegistering(false);
                        if (error) setError(null);
                      }}
                      placeholder="9876543210"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Expanded Registration Fields */}
                {isRegistering && (
                  <div className="space-y-6 animate-slide-down">
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-white/70 tracking-wide">Full Name</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Enter your full name"
                        className={inputClass}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium text-white/70 tracking-wide">Email Address</label>
                      <input
                        type="email"
                        value={emailId}
                        onChange={(e) => setEmailId(e.target.value)}
                        placeholder="your.email@example.com"
                        className={inputClass}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium text-white/70 tracking-wide">Upload Selfie</label>
                      <div
                        onClick={() => registerSelfieInputRef.current?.click()}
                        className="relative group cursor-pointer w-full aspect-square max-w-[200px] mx-auto rounded-[2rem] flex items-center justify-center transition-all duration-500 hover:scale-105 bg-black/20 border border-white/5 overflow-hidden"
                      >
                        {registerSelfiePreview ? (
                          <div className="relative w-full h-full">
                            <Image
                              src={registerSelfiePreview}
                              alt="Selfie preview"
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                              <span className="text-white font-medium tracking-wide">Change</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center space-y-3 text-white/40 group-hover:text-white transition-colors">
                            <Camera className="w-8 h-8" />
                            <span className="text-xs font-bold tracking-widest uppercase">Upload</span>
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        ref={registerSelfieInputRef}
                        onChange={handleRegisterSelfieUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm animate-slide-up backdrop-blur-md text-center">
                    {error}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={isRegistering ? handleRegister : handleCheckMobile}
                    disabled={loading || !mobile || (isRegistering && (!firstName || !emailId || !registerSelfie))}
                    className={buttonPrimaryClass}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        {isRegistering ? 'Registering...' : 'Checking...'}
                      </div>
                    ) : (isRegistering ? 'Create Account' : 'Continue')}
                  </button>
                </div>
              </div>
          </div>
        )}

        {/* OTP Entry */}
        {step === 'otp' && (
          <div className={cardClass}>
            <div className="space-y-6">
              
              <div className="text-center space-y-3">
                <div className="flex justify-center mb-2">
                  <div className="w-14 h-14 rounded-full bg-linear-to-tr from-indigo-500/20 to-purple-500/20 flex items-center justify-center ring-1 ring-white/10">
                    <Smartphone className="w-7 h-7 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white">Enter Verification Code</h3>
                <p className="text-white/60 text-sm">
                  Sent to <span className="text-white font-semibold">{countryCode} {userMobile}</span>
                </p>
              </div>

              <div className="flex justify-center gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpInputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-14 h-14 md:w-16 md:h-16 bg-white/5 border border-white/10 rounded-2xl text-white text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/10 transition-all backdrop-blur-xl"
                  />
                ))}
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm animate-slide-up backdrop-blur-md text-center">
                  {error}
                </div>
              )}

              <div className="text-center">
                <button
                  onClick={handleResendOTP}
                  className="text-sm text-white/60 hover:text-white transition-colors font-light"
                >
                  Resend Code
                </button>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => {
                    setStep('mobile');
                    setOtp(['', '', '', '']);
                    setError(null);
                  }}
                  className={buttonSecondaryClass}
                >
                  Back
                </button>
                <button
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.join('').length !== 4}
                  className={buttonPrimaryClass}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Verifying...
                    </div>
                  ) : 'Verify'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Selfie Upload */}
        {step === 'selfie' && (
          <div className={cardClass}>
            <div className="flex flex-col items-center space-y-6">
              
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative group cursor-pointer w-full max-w-xs aspect-square rounded-3xl flex items-center justify-center transition-all duration-500 hover:scale-105 glass overflow-hidden"
              >
                {selectedImage ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={selectedImage}
                      alt="Selfie preview"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                      <span className="px-6 py-3 bg-white/90 text-black font-bold rounded-xl">Change Photo</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-4 text-white/50 group-hover:text-white transition-colors p-8">
                    <div className="w-20 h-20 rounded-full bg-linear-to-tr from-indigo-500/20 to-purple-500/20 flex items-center justify-center ring-1 ring-white/10 group-hover:scale-110 transition-transform">
                      <Camera className="w-9 h-9" />
                    </div>
                    <div className="text-center">
                      <p className="text-base font-bold tracking-wide">Tap to Upload</p>
                      <p className="text-sm text-white/40 mt-1">Your selfie photo</p>
                    </div>
                  </div>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />

              {error && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm animate-slide-up backdrop-blur-md">
                  {error}
                </div>
              )}

              <div className="w-full space-y-4 pt-2">
                <button
                  onClick={handleMatch}
                  disabled={!file || loading}
                  className={buttonPrimaryClass}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Searching...
                    </div>
                  ) : 'Find Photos'}
                </button>
                
                <button
                  onClick={handleLogout}
                  className={buttonSecondaryClass}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Photos Grid */}
        {step === 'photos' && (
          <div className="space-y-6 animate-fade-in w-full">
            {/* Welcome Section - Mobile only */}
            <div className="md:hidden text-center mb-4">
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400">{firstName}!</span>
              </h1>
              <p className="text-white/60 text-sm">Found {results.length} photo{results.length !== 1 ? 's' : ''} with you</p>
            </div>

            {/* Stats Card */}
            <div className="glass p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-linear-to-tr from-indigo-500/20 to-purple-500/20 flex items-center justify-center ring-1 ring-white/10">
                    <Sparkles className="w-7 h-7 md:w-8 md:h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                      Hey {firstName}! 👋
                    </h2>
                    <p className="text-white/60 font-light text-sm md:text-base">{results.length} photo{results.length !== 1 ? 's' : ''} found in your collection</p>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-3 w-full md:w-auto">
                  <button
                    onClick={handleSmartMatchAgain}
                    disabled={loading}
                    className="px-6 py-3 bg-linear-to-br from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-white rounded-2xl font-semibold text-sm border border-purple-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 backdrop-blur-xl"
                  >
                    <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Find More
                  </button>
                </div>
              </div>
            </div>

            {/* Photos Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {results.map((photo, index) => (
                <motion.div
                  key={photo._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="group relative aspect-square rounded-2xl md:rounded-3xl overflow-hidden glass hover:scale-[1.03] transition-all duration-500 cursor-pointer"
                >
                  <Image
                    src={photo.thumbnail}
                    alt={`Photo ${index + 1}`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4">
                    <a
                      href={photo.image}
                      download
                      className="px-5 py-2.5 bg-white/90 backdrop-blur-xl text-black text-sm font-bold rounded-xl hover:bg-white transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>

            {results.length === 0 && (
              <div className={cardClass}>
                <div className="p-12 text-center space-y-4 relative z-10">
                  <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                      <Camera className="w-10 h-10 text-white/40" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white">No Photos Found</h3>
                  <p className="text-white/60 font-light max-w-md mx-auto">
                    We couldn't find any photos matching your selfie.
                  </p>
                  <div className="pt-4">
                    <button
                      onClick={() => {
                        setStep('selfie');
                        setFile(null);
                        setSelectedImage(null);
                        setError(null);
                      }}
                      className={buttonPrimaryClass}
                    >
                      <RefreshCw className="w-4 h-4" />
                      Try Another Selfie
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      </div>
      <Footer />
    </div>
  );
}
