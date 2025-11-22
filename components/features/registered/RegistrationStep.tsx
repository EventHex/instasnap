import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { formatPhoneNumber, validatePhoneNumber, compressImage } from '@/lib/utils';

interface RegistrationStepProps {
    onRegister: (data: { firstName: string; mobile: string; emailId: string; selfie: File }) => Promise<void>;
    loading: boolean;
    error: string | null;
    onBack: () => void;
}

export function RegistrationStep({ onRegister, loading, error, onBack }: RegistrationStepProps) {
    const [firstName, setFirstName] = useState('');
    const [mobile, setMobile] = useState('');
    const [emailId, setEmailId] = useState('');
    const [selfie, setSelfie] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const compressed = await compressImage(file);
                setSelfie(compressed);
                const reader = new FileReader();
                reader.onloadend = () => setPreview(reader.result as string);
                reader.readAsDataURL(compressed);
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleSubmit = () => {
        if (selfie) {
            onRegister({ firstName, mobile, emailId, selfie });
        }
    };

    return (
        <Card className="w-full max-w-lg mx-auto animate-fade-in">
            <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>Register to find and save your event photos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                    <Input
                        placeholder="Full Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                    />
                    <Input
                        type="tel"
                        placeholder="Mobile Number"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        maxLength={10}
                    />
                    <Input
                        type="email"
                        placeholder="Email Address"
                        value={emailId}
                        onChange={(e) => setEmailId(e.target.value)}
                    />

                    <div className="border-2 border-dashed border-input rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer relative overflow-hidden group">
                        <input
                            type="file"
                            accept="image/*"
                            capture="user"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        {preview ? (
                            <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden ring-4 ring-white shadow-lg">
                                <img src={preview} alt="Selfie" className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <span className="text-3xl">📷</span>
                            </div>
                        )}
                        <p className="mt-4 text-sm font-medium text-primary">
                            {preview ? 'Change Selfie' : 'Upload Selfie'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Required for face matching</p>
                    </div>
                </div>

                {error && <p className="text-sm text-destructive text-center">{error}</p>}
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
                <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSubmit}
                    isLoading={loading}
                    disabled={!firstName || !mobile || !emailId || !selfie}
                >
                    Register
                </Button>
                <Button variant="ghost" className="w-full" onClick={onBack}>
                    Back
                </Button>
            </CardFooter>
        </Card>
    );
}
