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
import { ArrowLeft, Lock, Sparkles, Camera, Download, Image as ImageIcon, LogOut, RefreshCw, Send, CheckCircle, ArrowRight, Smartphone, KeyRound } from 'lucide-react';

type Step = 'mode' | 'register' | 'mobile' | 'otp' | 'selfie' | 'photos';

export default function RegisteredPage() {
  const router = useRouter();
  const [photoPermission, setPhotoPermission] = useState<PhotoPermission | null>(null);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [step, setStep] = useState<Step>('mode');
  
  // Mode selection
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  
  // Registration form
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

  // Handle send OTP
  const handleSendOTP = async () => {
    if (!mobile) {
      setError('Please enter your mobile number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.sendOTP(mobile, eventId, countryCode);
      setUserMobile(mobile);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
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
    setStep('mode');
    setIsNewUser(null);
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

  if (isLoadingPermissions) {
    return (
      <div className="h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh w-full relative overflow-hidden bg-background">
      {/* Ambient Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] animate-float pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] animate-float animate-delay-500 pointer-events-none" />

      <div className="flex-1 flex flex-col items-center py-12 px-4 animate-fade-in relative z-10 overflow-y-auto">
        <div className="w-full max-w-4xl space-y-12 pb-24">

        {/* Header */}
        <div className="text-center space-y-6">
          <Link href="/">
            <div className="inline-flex items-center justify-center p-1.5 mb-6 glass rounded-full hover:scale-105 transition-transform cursor-pointer">
              <span className="px-4 py-1.5 text-xs font-semibold text-white uppercase tracking-widest bg-white/10 rounded-full flex items-center gap-2">
                <ArrowLeft className="w-3 h-3" /> Back to Home
              </span>
            </div>
          </Link>
          <h1 className="text-5xl md:text-7xl font-thin tracking-tighter text-white drop-shadow-2xl">
            {step === 'photos' ? 'Your' : 'Member'} <br />
            <span className="font-bold text-transparent bg-clip-text bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400 animate-shimmer bg-size-[200%_auto]">
              {step === 'photos' ? 'Gallery' : 'Access'}
            </span>
          </h1>
          <p className="text-xl text-white/60 max-w-lg mx-auto font-light">
            {step === 'mode' && 'Login or register to access your photos.'}
            {step === 'register' && 'Create your account to get started.'}
            {step === 'mobile' && 'Enter your mobile number to continue.'}
            {step === 'otp' && 'Enter the OTP sent to your mobile.'}
            {step === 'selfie' && 'Upload a selfie to find your photos.'}
            {step === 'photos' && `Found ${results.length} photo${results.length !== 1 ? 's' : ''} with you!`}
          </p>
        </div>

        {/* Mode Selection */}
        {step === 'mode' && (
          <div className="flex flex-col gap-4 w-full max-w-md mx-auto animate-fade-in">
            {/* Existing User Card */}
            <div
              onClick={() => {
                setIsNewUser(false);
                setStep('mobile');
              }}
              className="group block transform transition-transform duration-500 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <div className="flex items-center p-3 pr-4 bg-white/5 hover:bg-white/10 backdrop-blur-2xl border border-white/10 rounded-full transition-all duration-500 group-hover:border-white/20 group-hover:shadow-[0_0_40px_-10px_rgba(148,163,184,0.3)] relative overflow-hidden w-full">
                 <div className="absolute inset-0 bg-linear-to-r from-slate-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                 
                 <div className="w-12 h-12 rounded-full bg-linear-to-tr from-white/10 to-white/5 flex items-center justify-center text-xl shadow-inner ring-1 ring-white/20 shrink-0">
                    <Lock className="w-6 h-6 text-white" />
                 </div>
                 
                 <div className="flex-1 px-4 text-left">
                    <h2 className="text-lg font-bold text-white tracking-tight">Existing User</h2>
                    <p className="text-slate-200/60 text-xs font-light">Already have an account?</p>
                 </div>
                 
                 <div className="px-5 py-2 rounded-full bg-white/10 group-hover:bg-white/20 text-white text-sm font-semibold transition-all duration-300 flex items-center gap-2 shrink-0">
                    Login <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                 </div>
              </div>
            </div>

            {/* New User Card */}
            <div
              onClick={() => {
                setIsNewUser(true);
                setStep('register');
              }}
              className="group block transform transition-transform duration-500 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <div className="flex items-center p-3 pr-4 bg-white/5 hover:bg-white/10 backdrop-blur-2xl border border-white/10 rounded-full transition-all duration-500 group-hover:border-white/20 group-hover:shadow-[0_0_40px_-10px_rgba(99,102,241,0.3)] relative overflow-hidden w-full">
                 <div className="absolute inset-0 bg-linear-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                 
                 <div className="w-12 h-12 rounded-full bg-linear-to-tr from-white/10 to-white/5 flex items-center justify-center text-xl shadow-inner ring-1 ring-white/20 shrink-0">
                    <Sparkles className="w-6 h-6 text-white" />
                 </div>
                 
                 <div className="flex-1 px-4 text-left">
                    <h2 className="text-lg font-bold text-white tracking-tight">New User</h2>
                    <p className="text-indigo-100/60 text-xs font-light">First time here?</p>
                 </div>
                 
                 <div className="px-5 py-2 rounded-full bg-white/10 group-hover:bg-white/20 text-white text-sm font-semibold transition-all duration-300 flex items-center gap-2 shrink-0">
                    Register <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* Registration Form */}
        {step === 'register' && (
          <Card className="bg-[#0a0a0a]/60 backdrop-blur-[50px] saturate-150 shadow-2xl overflow-hidden relative rounded-[2.5rem] animate-fade-in border border-white/10 ring-1 ring-white/5">
            <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent opacity-30" />
            <CardContent className="p-12 space-y-8 relative z-10">
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-white/80 uppercase tracking-widest">Full Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 backdrop-blur-xl transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-white/80 uppercase tracking-widest">Email Address</label>
                  <input
                    type="email"
                    value={emailId}
                    onChange={(e) => setEmailId(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 backdrop-blur-xl transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-white/80 uppercase tracking-widest">Mobile Number</label>
                  <div className="flex gap-3">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 backdrop-blur-xl transition-all"
                    >
                      <option value="+91" className="bg-gray-900">+91</option>
                      <option value="+1" className="bg-gray-900">+1</option>
                      <option value="+44" className="bg-gray-900">+44</option>
                      <option value="+971" className="bg-gray-900">+971</option>
                    </select>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="9876543210"
                      className="flex-1 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 backdrop-blur-xl transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-white/80 uppercase tracking-widest">Upload Selfie</label>
                  <div
                    onClick={() => registerSelfieInputRef.current?.click()}
                    className="relative group cursor-pointer w-full aspect-square max-w-xs mx-auto rounded-[2rem] flex items-center justify-center transition-all duration-500 hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent rounded-[2rem] border border-white/20 group-hover:border-white/40 transition-colors shadow-inner" />

                    {registerSelfiePreview ? (
                      <div className="relative w-full h-full rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-white/20">
                        <Image
                          src={registerSelfiePreview}
                          alt="Selfie preview"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                          <span className="text-white font-medium tracking-wide">Change Photo</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-4 text-white/60 group-hover:text-white transition-colors">
                        <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center text-4xl shadow-inner ring-1 ring-white/10 group-hover:bg-white/10 transition-colors">
                          <Camera className="w-10 h-10" />
                        </div>
                        <span className="text-sm font-medium tracking-widest uppercase">Tap to Upload</span>
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

              {error && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm animate-slide-up backdrop-blur-md">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  onClick={() => {
                    setStep('mode');
                    setError(null);
                  }}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleRegister}
                  disabled={loading || !firstName || !mobile || !emailId || !registerSelfie}
                  variant="liquid"
                  size="lg"
                  className="flex-1"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Registering...
                    </div>
                  ) : 'Register'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mobile Number Entry */}
        {step === 'mobile' && (
          <Card className="bg-[#0a0a0a]/60 backdrop-blur-[50px] saturate-150 shadow-2xl overflow-hidden relative rounded-[2.5rem] animate-fade-in border border-white/10 ring-1 ring-white/5">
            <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent opacity-30" />
            <CardContent className="p-12 space-y-8 relative z-10">
              
              <div className="space-y-3">
                <label className="text-sm font-semibold text-white/80 uppercase tracking-widest">Mobile Number</label>
                <div className="flex gap-3">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 backdrop-blur-xl transition-all"
                  >
                    <option value="+91" className="bg-gray-900">+91</option>
                    <option value="+1" className="bg-gray-900">+1</option>
                    <option value="+44" className="bg-gray-900">+44</option>
                    <option value="+971" className="bg-gray-900">+971</option>
                  </select>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="9876543210"
                    className="flex-1 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 backdrop-blur-xl transition-all text-lg"
                  />
                </div>
                <p className="text-xs text-white/40 font-light">We'll send you an OTP to verify your number</p>
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm animate-slide-up backdrop-blur-md">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  onClick={() => {
                    setStep('mode');
                    setError(null);
                  }}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSendOTP}
                  disabled={loading || !mobile}
                  variant="liquid"
                  size="lg"
                  className="flex-1"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </div>
                  ) : 'Send OTP'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* OTP Entry */}
        {step === 'otp' && (
          <Card className="bg-[#0a0a0a]/60 backdrop-blur-[50px] saturate-150 shadow-2xl overflow-hidden relative rounded-[2.5rem] animate-fade-in border border-white/10 ring-1 ring-white/5">
            <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent opacity-30" />
            <CardContent className="p-12 space-y-8 relative z-10">
              
              <div className="text-center space-y-2">
                <div className="flex justify-center mb-4">
                  <Smartphone className="w-16 h-16 text-white/80" />
                </div>
                <p className="text-white/60 font-light">
                  Enter the 4-digit code sent to <br />
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
                    className="w-14 h-16 bg-white/5 border border-white/10 rounded-2xl text-white text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 backdrop-blur-xl transition-all"
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
                  onClick={handleSendOTP}
                  className="text-sm text-indigo-300 hover:text-indigo-200 underline transition-colors font-light"
                >
                  Resend OTP
                </button>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => {
                    setStep(isNewUser ? 'register' : 'mobile');
                    setOtp(['', '', '', '']);
                    setError(null);
                  }}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.join('').length !== 4}
                  variant="liquid"
                  size="lg"
                  className="flex-1"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </div>
                  ) : 'Verify OTP'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Selfie Upload */}
        {step === 'selfie' && (
          <Card className="bg-[#0a0a0a]/60 backdrop-blur-[50px] saturate-150 shadow-2xl overflow-hidden relative rounded-[2.5rem] animate-fade-in border border-white/10 ring-1 ring-white/5">
            <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent opacity-30" />
            <CardContent className="p-12 flex flex-col items-center space-y-8 relative z-10">
              
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative group cursor-pointer w-64 h-64 rounded-[2rem] flex items-center justify-center transition-all duration-500 hover:scale-105"
              >
                <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent rounded-[2rem] border border-white/20 group-hover:border-white/40 transition-colors shadow-inner" />

                {selectedImage ? (
                  <div className="relative w-full h-full rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-white/20">
                    <Image
                      src={selectedImage}
                      alt="Selfie preview"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                      <span className="text-white font-medium tracking-wide">Change Photo</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-4 text-white/60 group-hover:text-white transition-colors">
                    <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center text-4xl shadow-inner ring-1 ring-white/10 group-hover:bg-white/10 transition-colors">
                      <Camera className="w-10 h-10" />
                    </div>
                    <span className="text-sm font-medium tracking-widest uppercase">Tap to Upload</span>
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

              <div className="w-full max-w-md space-y-4">
                <Button
                  onClick={handleMatch}
                  disabled={!file || loading}
                  variant="liquid"
                  size="lg"
                  className="w-full text-lg font-semibold tracking-wide"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Finding Photos...
                    </div>
                  ) : 'Find My Photos'}
                </Button>
                
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Photos Grid */}
        {step === 'photos' && (
          <div className="space-y-8 animate-fade-in">
            <Card className="bg-[#0a0a0a]/60 backdrop-blur-[50px] saturate-150 shadow-2xl overflow-hidden relative rounded-[2.5rem] border border-white/10 ring-1 ring-white/5">
              <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent opacity-30" />
              <CardContent className="p-8 relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-linear-to-tr from-white/20 to-white/5 backdrop-blur-md flex items-center justify-center text-3xl shadow-inner ring-1 ring-white/20">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">
                        {results.length} Photo{results.length !== 1 ? 's' : ''} Found
                      </h2>
                      <p className="text-white/60 font-light">Your moments from the event</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {groupId && (
                      <Button
                        onClick={downloadAll}
                        variant="liquid"
                        size="lg"
                        className="min-w-[180px]"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download All
                      </Button>
                    )}
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      size="lg"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map((photo, index) => (
                <div
                  key={photo._id}
                  className="group relative aspect-square rounded-[2rem] overflow-hidden glass hover:scale-105 transition-all duration-500 animate-fade-in cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Image
                    src={photo.thumbnail}
                    alt={`Photo ${index + 1}`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <a
                      href={photo.image}
                      download
                      className="block w-full py-2 bg-white/20 backdrop-blur-md text-white text-sm font-semibold rounded-xl text-center hover:bg-white/30 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {results.length === 0 && (
              <Card className="bg-[#0a0a0a]/60 backdrop-blur-[50px] saturate-150 shadow-2xl overflow-hidden relative rounded-[2.5rem] border border-white/10 ring-1 ring-white/5">
                <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent opacity-30" />
                <CardContent className="p-12 text-center space-y-4 relative z-10">
                  <div className="flex justify-center mb-4">
                    <Camera className="w-16 h-16 text-white/60" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">No Photos Found</h3>
                  <p className="text-white/60 font-light max-w-md mx-auto">
                    We couldn't find any photos matching your selfie. Try uploading a different photo.
                  </p>
                  <Button
                    onClick={() => {
                      setStep('selfie');
                      setFile(null);
                      setSelectedImage(null);
                      setError(null);
                    }}
                    variant="liquid"
                    size="lg"
                    className="mt-6"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Another Selfie
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      </div>
      <Footer />
    </div>
  );
}
