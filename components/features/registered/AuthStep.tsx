import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { formatPhoneNumber, validatePhoneNumber } from '@/lib/utils';

interface AuthStepProps {
    onSendOTP: (mobile: string) => Promise<void>;
    onVerifyOTP: (mobile: string, otp: string) => Promise<void>;
    loading: boolean;
    error: string | null;
    isNewUser?: boolean;
    onBack: () => void;
}

export function AuthStep({ onSendOTP, onVerifyOTP, loading, error, isNewUser, onBack }: AuthStepProps) {
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'mobile' | 'otp'>('mobile');

    const handleSendOTP = async () => {
        if (validatePhoneNumber(mobile)) {
            await onSendOTP(mobile);
            setStep('otp');
        }
    };

    const handleVerifyOTP = async () => {
        if (otp.length === 4) {
            await onVerifyOTP(mobile, otp);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto animate-fade-in">
            <CardHeader>
                <CardTitle>{step === 'mobile' ? 'Welcome Back' : 'Verify OTP'}</CardTitle>
                <CardDescription>
                    {step === 'mobile'
                        ? 'Enter your mobile number to access your photos.'
                        : `Enter the 4-digit code sent to ${formatPhoneNumber(mobile)}`}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {step === 'mobile' ? (
                    <Input
                        type="tel"
                        placeholder="Mobile Number"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        maxLength={10}
                        icon={<span className="text-lg">📱</span>}
                        error={error || undefined}
                    />
                ) : (
                    <div className="space-y-4">
                        <Input
                            type="text"
                            placeholder="0000"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            maxLength={4}
                            className="text-center text-2xl tracking-[1em] font-mono"
                            error={error || undefined}
                        />
                        <div className="text-center text-sm">
                            <button
                                onClick={() => setStep('mobile')}
                                className="text-primary hover:underline"
                            >
                                Change Mobile Number
                            </button>
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
                <Button
                    className="w-full"
                    size="lg"
                    onClick={step === 'mobile' ? handleSendOTP : handleVerifyOTP}
                    isLoading={loading}
                    disabled={step === 'mobile' ? mobile.length !== 10 : otp.length !== 4}
                >
                    {step === 'mobile' ? 'Send OTP' : 'Verify & Login'}
                </Button>
                <Button variant="ghost" className="w-full" onClick={onBack}>
                    Back
                </Button>
            </CardFooter>
        </Card>
    );
}
