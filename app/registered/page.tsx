'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { FaceMatch, PhotoPermission } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import Link from 'next/link';
import Image from 'next/image';
import { Footer } from '@/components/layout/Footer';
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
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const registerSelfieInputRef = useRef<HTMLInputElement>(null);
  const eventId = process.env.NEXT_PUBLIC_EVENT_ID || '';

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
      // Try to send OTP. If it fails, we assume user needs to register.
      await api.sendOTP(mobile, eventId, countryCode);
      setUserMobile(mobile);
      setStep('otp');
    } catch (err: any) {
      // If sending OTP fails, assume user is not registered
      setIsRegistering(true);
      setError(null); // Clear error to show registration form cleanly
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
      
      if (response.verified && response.token && response.userId) {
        setToken(response.token);
        setUserId(response.userId);
        
        // Check if user needs to upload selfie or already has photos
        if (response.requiresSelfie) {
          setStep('selfie');
        } else if (response.photos && response.photos.length > 0) {
          setResults(response.photos);
          setGroupId(response.groupId || null);
          setStep('photos');
        } else {
          setStep('selfie');
        }
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
        setResults(response.FaceMatches || []);
        setGroupId(response.groupInfo?.groupId || response.groupId || null);
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

  // Handle download all
  const downloadAll = async () => {
    if (!groupId) return;

    try {
      const blob = await api.downloadZIP(groupId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `my-photos-${groupId}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download ZIP:', err);
      setError('Failed to download photos. Please try again.');
    }
  };

  // Handle logout
  const handleLogout = () => {
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

  // iOS 26 Liquid Glass Styles
  const iosCardClass = "bg-[#1c1c1e]/70 backdrop-blur-3xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] rounded-[2.5rem] overflow-hidden relative ring-1 ring-white/5 transition-all duration-500";
  const iosInputClass = "w-full px-6 py-4 bg-[#000000]/20 border border-white/5 rounded-full text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-black/40 transition-all text-lg shadow-inner";
  const iosSelectClass = "px-6 py-4 bg-[#000000]/20 border border-white/5 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-black/40 backdrop-blur-xl transition-all appearance-none cursor-pointer shadow-inner min-w-[100px]";
  const iosButtonPrimaryClass = "w-full py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-white/10 flex items-center justify-center gap-2";
  const iosButtonSecondaryClass = "w-full py-4 bg-[#2c2c2e]/80 text-white rounded-full font-semibold text-lg hover:bg-[#3a3a3c] hover:scale-[1.02] active:scale-[0.98] transition-all border border-white/5 flex items-center justify-center gap-2 backdrop-blur-md";

  return (
    <div className="flex flex-col h-dvh w-full relative overflow-hidden bg-black selection:bg-white/20 font-sans">
      {/* iOS 18 Style Background - Abstract Blurs */}
      <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[60%] bg-blue-600/20 rounded-full blur-[150px] animate-pulse-slow pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[60%] bg-purple-600/20 rounded-full blur-[150px] animate-pulse-slow delay-1000 pointer-events-none mix-blend-screen" />

      <div className="flex-1 flex flex-col items-center justify-center py-8 px-4 relative z-10 overflow-y-auto">
        <div className="w-full max-w-md space-y-8">

        {/* Header */}
        <div className="text-center space-y-6 animate-fade-in">
          <Link href="/">
            <div className="inline-flex items-center justify-center p-1 mb-4 bg-white/5 hover:bg-white/10 backdrop-blur-xl rounded-full border border-white/10 transition-all cursor-pointer group">
              <span className="px-4 py-1.5 text-xs font-semibold text-white/80 uppercase tracking-widest flex items-center gap-2">
                <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> Back
              </span>
            </div>
          </Link>
          <h1 className="text-4xl font-medium tracking-tight text-white drop-shadow-2xl">
            {step === 'photos' ? 'Your Gallery' : 'Member Access'}
          </h1>
          <p className="text-lg text-white/50 font-light">
            {step === 'mobile' && !isRegistering && 'Enter your mobile number to continue.'}
            {step === 'mobile' && isRegistering && 'Create your account to get started.'}
            {step === 'otp' && 'Enter the OTP sent to your mobile.'}
            {step === 'selfie' && 'Upload a selfie to find your photos.'}
            {step === 'photos' && `Found ${results.length} photo${results.length !== 1 ? 's' : ''} with you!`}
          </p>
        </div>

        {/* Mobile Number & Registration Form */}
        {step === 'mobile' && (
          <div className={`${iosCardClass} animate-fade-in`}>
            <div className="p-8 space-y-8 relative z-10">
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-4">Mobile Number</label>
                  <div className="flex gap-3">
                    <div className="relative">
                      <select
                        value={countryCode}
                        onChange={(e) => {
                          setCountryCode(e.target.value);
                          if (isRegistering) setIsRegistering(false);
                          if (error) setError(null);
                        }}
                        className={iosSelectClass}
                      >
                        <option value="+91" className="bg-[#1c1c1e]">+91</option>
                        <option value="+1" className="bg-[#1c1c1e]">+1</option>
                        <option value="+44" className="bg-[#1c1c1e]">+44</option>
                        <option value="+971" className="bg-[#1c1c1e]">+971</option>
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
                      className={iosInputClass}
                    />
                  </div>
                </div>

                {/* Expanded Registration Fields */}
                {isRegistering && (
                  <div className="space-y-6 animate-slide-down">
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-4">Full Name</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Enter your full name"
                        className={iosInputClass}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-4">Email Address</label>
                      <input
                        type="email"
                        value={emailId}
                        onChange={(e) => setEmailId(e.target.value)}
                        placeholder="your.email@example.com"
                        className={iosInputClass}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-4">Upload Selfie</label>
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
                    className={iosButtonPrimaryClass}
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
          </div>
        )}

        {/* OTP Entry */}
        {step === 'otp' && (
          <div className={`${iosCardClass} animate-fade-in`}>
            <div className="p-8 space-y-8 relative z-10">
              
              <div className="text-center space-y-2">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                    <Smartphone className="w-8 h-8 text-white" />
                  </div>
                </div>
                <p className="text-white/60 font-light">
                  Enter the code sent to <br />
                  <span className="text-white font-semibold">{countryCode} {userMobile}</span>
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
                    className="w-14 h-16 bg-black/20 border border-white/5 rounded-2xl text-white text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-black/40 transition-all"
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
                  className={iosButtonSecondaryClass}
                >
                  Back
                </button>
                <button
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.join('').length !== 4}
                  className={iosButtonPrimaryClass}
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
          <div className={`${iosCardClass} animate-fade-in`}>
            <div className="p-8 flex flex-col items-center space-y-8 relative z-10">
              
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative group cursor-pointer w-64 h-64 rounded-[2.5rem] flex items-center justify-center transition-all duration-500 hover:scale-105 bg-black/20 border border-white/5 overflow-hidden"
              >
                {selectedImage ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={selectedImage}
                      alt="Selfie preview"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                      <span className="text-white font-medium tracking-wide">Change</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-4 text-white/40 group-hover:text-white transition-colors">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-4xl shadow-inner ring-1 ring-white/5 group-hover:bg-white/10 transition-colors">
                      <Camera className="w-8 h-8" />
                    </div>
                    <span className="text-sm font-bold tracking-widest uppercase">Tap to Upload</span>
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
                  className={iosButtonPrimaryClass}
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
                  className={iosButtonSecondaryClass}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Photos Grid */}
        {step === 'photos' && (
          <div className="space-y-8 animate-fade-in w-full">
            <div className={iosCardClass}>
              <div className="p-8 relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-3xl shadow-inner ring-1 ring-white/5">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">
                        {results.length} Photo{results.length !== 1 ? 's' : ''}
                      </h2>
                      <p className="text-white/60 font-light">Found in gallery</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    {groupId && (
                      <button
                        onClick={downloadAll}
                        className={`${iosButtonPrimaryClass} w-auto! px-8`}
                      >
                        <Download className="w-4 h-4" />
                        Download All
                      </button>
                    )}
                    <button
                      onClick={handleLogout}
                      className={`${iosButtonSecondaryClass} w-auto! px-8`}
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map((photo, index) => (
                <div
                  key={photo._id}
                  className="group relative aspect-square rounded-[2rem] overflow-hidden bg-[#1c1c1e]/50 backdrop-blur-md border border-white/5 hover:scale-105 transition-all duration-500 animate-fade-in cursor-pointer shadow-lg"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Image
                    src={photo.thumbnail}
                    alt={`Photo ${index + 1}`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <a
                      href={photo.image}
                      download
                      className="px-6 py-3 bg-white/20 backdrop-blur-xl text-white text-sm font-bold rounded-full hover:bg-white/30 transition-colors border border-white/20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {results.length === 0 && (
              <div className={iosCardClass}>
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
                      className={iosButtonPrimaryClass}
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
