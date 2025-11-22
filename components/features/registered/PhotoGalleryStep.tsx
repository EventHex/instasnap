import { EventPhoto } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface PhotoGalleryStepProps {
    photos: EventPhoto[];
    onDownloadAll: () => void;
    onLogout: () => void;
    loading: boolean;
}

export function PhotoGalleryStep({ photos, onDownloadAll, onLogout, loading }: PhotoGalleryStepProps) {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/50 backdrop-blur-sm p-6 rounded-2xl border border-white/20 shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Your Collection</h2>
                    <p className="text-muted-foreground">Found {photos.length} photos matching your face</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <Button variant="outline" onClick={onLogout}>
                        Logout
                    </Button>
                    <Button onClick={onDownloadAll} isLoading={loading} className="flex-1 md:flex-none">
                        Download All
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => (
                    <Card key={photo._id} className="overflow-hidden group cursor-pointer border-0 shadow-md hover:shadow-xl transition-all duration-300">
                        <div className="relative aspect-[3/4]">
                            <img
                                src={photo.thumbnail}
                                alt="Event photo"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <a
                                    href={photo.compressed}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-white/90 text-foreground px-4 py-2 rounded-full text-sm font-medium shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all"
                                >
                                    View Full
                                </a>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
