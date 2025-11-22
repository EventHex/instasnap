import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { compressImage } from '@/lib/utils';

interface SelfieUploadStepProps {
    onUpload: (selfie: File) => Promise<void>;
    loading: boolean;
    error: string | null;
}

export function SelfieUploadStep({ onUpload, loading, error }: SelfieUploadStepProps) {
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

    return (
        <Card className="w-full max-w-md mx-auto animate-fade-in">
            <CardHeader>
                <CardTitle>One Last Step</CardTitle>
                <CardDescription>We need your selfie to find your photos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-input rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer relative overflow-hidden group">
                    <input
                        type="file"
                        accept="image/*"
                        capture="user"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    {preview ? (
                        <div className="relative w-40 h-40 mx-auto rounded-full overflow-hidden ring-4 ring-white shadow-lg">
                            <img src={preview} alt="Selfie" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <span className="text-4xl">🤳</span>
                        </div>
                    )}
                    <div className="mt-4">
                        <h3 className="font-medium text-foreground">
                            {preview ? 'Tap to Change' : 'Take a Selfie'}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Make sure your face is clearly visible
                        </p>
                    </div>
                </div>

                {error && <p className="text-sm text-destructive text-center">{error}</p>}
            </CardContent>
            <CardFooter>
                <Button
                    className="w-full"
                    size="lg"
                    onClick={() => selfie && onUpload(selfie)}
                    isLoading={loading}
                    disabled={!selfie}
                >
                    Find My Photos
                </Button>
            </CardFooter>
        </Card>
    );
}
