import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../stores/authStore';
import { useState, useRef } from 'react';
import { useCreateWave } from '../hooks/useWaves';
import {
  Upload,
  Image as ImageIcon,
  Video,
  Music,
  X,
  MapPin,
  Star,
  Users,
  User,
} from 'lucide-react';
import { WaveType, MediaType, CreateWaveDto } from '@wavely/shared';
import apiClient from '../lib/apiClient';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export const Route = createFileRoute('/create')({
  beforeLoad: async () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: '/auth/login' });
    }
  },
  component: CreatePage,
});

function CreatePage() {
  const navigate = useNavigate();
  const createWaveMutation = useCreateWave();

  const [waveType, setWaveType] = useState<WaveType>(WaveType.PERSONAL);
  const [mediaType, setMediaType] = useState<MediaType>(MediaType.IMAGE);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [personalRating, setPersonalRating] = useState<number | null>(null);
  const [communityRatingScale, setCommunityRatingScale] = useState<5 | 10>(5);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter((file) => {
      if (mediaType === 'IMAGE') return file.type.startsWith('image/');
      if (mediaType === 'VIDEO') return file.type.startsWith('video/');
      if (mediaType === 'AUDIO') return file.type.startsWith('audio/');
      return false;
    });

    setSelectedFiles((prev) => [...prev, ...validFiles]);

    const newPreviewUrls = validFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadMedia = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'media');

      const response = await apiClient.post<{
        success: boolean;
        data: { url: string; key: string; size: number; contentType: string };
      }>('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.data.url;
    });

    return Promise.all(uploadPromises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      alert('Please select at least one file');
      return;
    }

    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    try {
      setIsUploading(true);

      const mediaUrls = await uploadMedia(selectedFiles);

      const waveData: CreateWaveDto = {
        title,
        content,
        category: category || undefined,
        location: location || undefined,
        mediaType,
        mediaUrls,
        waveType,
        personalRating: waveType === WaveType.PERSONAL ? (personalRating ?? undefined) : undefined,
        communityRatingScale: waveType === WaveType.COMMUNITY ? communityRatingScale : undefined,
      };

      await createWaveMutation.mutateAsync(waveData);

      setSelectedFiles([]);
      setPreviewUrls([]);
      setTitle('');
      setContent('');
      setCategory('');
      setLocation('');
      setPersonalRating(null);

      navigate({ to: '/home' });
    } catch (error) {
      console.error('Error creating wave:', error);
      alert('Failed to create wave. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const getCategoryOptions = () => {
    switch (mediaType) {
      case 'IMAGE':
        return ['Art', 'Photography', 'Nature', 'People', 'Food', 'Travel', 'Wallpaper', 'Meme'];
      case 'VIDEO':
        return [
          'Short Film',
          'Vlog',
          'Tutorial',
          'Comedy',
          'Documentary',
          'Animation',
          'Music Video',
          'Gameplay',
        ];
      case 'AUDIO':
        return [
          'Music',
          'Podcast',
          'Audiobook',
          'Sound Effects',
          'Voice Over',
          'Instrumental',
          'Mix/DJ Set',
        ];
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Create a Wave</CardTitle>
            <CardDescription>Share your experience with the community</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Wave Type */}
              <div className="space-y-3">
                <Label>Wave Type</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setWaveType(WaveType.PERSONAL)}
                    className={cn(
                      'h-auto flex-col gap-2 p-4 transition-all',
                      waveType === 'PERSONAL' && 'ring-2 ring-primary bg-primary/5 border-primary',
                    )}
                  >
                    <User className="h-6 w-6" />
                    <p className="font-semibold">Personal</p>
                    <p className="text-xs text-muted-foreground">You rate your content</p>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setWaveType(WaveType.COMMUNITY)}
                    className={cn(
                      'h-auto flex-col gap-2 p-4 transition-all',
                      waveType === 'COMMUNITY' && 'ring-2 ring-primary bg-primary/5 border-primary',
                    )}
                  >
                    <Users className="h-6 w-6" />
                    <p className="font-semibold">Community</p>
                    <p className="text-xs text-muted-foreground">Community rates your content</p>
                  </Button>
                </div>
              </div>

              {/* Media Type */}
              <div className="space-y-3">
                <Label>Media Type</Label>
                <div className="grid grid-cols-3 gap-4">
                  {(['IMAGE', 'VIDEO', 'AUDIO'] as MediaType[]).map((type) => (
                    <Button
                      key={type}
                      type="button"
                      variant="outline"
                      onClick={() => setMediaType(type)}
                      className={cn(
                        'h-auto flex-col gap-2 p-4 transition-all',
                        mediaType === type && 'ring-2 ring-primary bg-primary/5 border-primary',
                      )}
                    >
                      {type === 'IMAGE' && <ImageIcon className="h-6 w-6" />}
                      {type === 'VIDEO' && <Video className="h-6 w-6" />}
                      {type === 'AUDIO' && <Music className="h-6 w-6" />}
                      <p className="font-semibold text-sm">
                        {type.charAt(0) + type.slice(1).toLowerCase()}
                      </p>
                    </Button>
                  ))}
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-3">
                <Label>Upload Media</Label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
                >
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">Click to upload or drag and drop</p>
                  <p className="text-sm text-muted-foreground">
                    {mediaType === 'IMAGE' && 'JPG, PNG, GIF, WebP'}
                    {mediaType === 'VIDEO' && 'MP4, WebM, MOV'}
                    {mediaType === 'AUDIO' && 'MP3, WAV, OGG'}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={
                      mediaType === 'IMAGE'
                        ? 'image/*'
                        : mediaType === 'VIDEO'
                          ? 'video/*'
                          : 'audio/*'
                    }
                    onChange={handleFileSelect}
                    multiple
                    className="hidden"
                  />
                </div>

                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        {mediaType === 'IMAGE' && (
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        )}
                        {mediaType === 'VIDEO' && (
                          <video
                            src={url}
                            className="w-full h-32 object-cover rounded-lg"
                            controls
                          />
                        )}
                        {mediaType === 'AUDIO' && (
                          <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                            <Music className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => removeFile(index)}
                          className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Give your wave a title"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="content">Description</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="resize-none"
                  placeholder="Tell us about your experience..."
                />
              </div>

              {/* Category & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  >
                    <option value="">Select a category</option>
                    {getCategoryOptions().map((cat) => (
                      <option key={cat} value={cat.toLowerCase().replace(/\s+/g, '-')}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="pl-10"
                      placeholder="Add a location"
                    />
                  </div>
                </div>
              </div>

              {/* Rating (Personal Wave) */}
              {waveType === 'PERSONAL' && (
                <div className="space-y-3">
                  <Label>Your Rating (Optional)</Label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                      <Button
                        key={rating}
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setPersonalRating(rating)}
                        className={cn(
                          'font-semibold transition-all',
                          personalRating === rating &&
                            'border-yellow-500 bg-yellow-50 text-yellow-700 hover:bg-yellow-50 hover:text-yellow-700',
                        )}
                      >
                        {rating}
                      </Button>
                    ))}
                  </div>
                  {personalRating && (
                    <div className="flex items-center mt-2 text-sm text-muted-foreground">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      {personalRating}/10
                    </div>
                  )}
                </div>
              )}

              {/* Rating Scale (Community Wave) */}
              {waveType === 'COMMUNITY' && (
                <div className="space-y-3">
                  <Label>Community Rating Scale</Label>
                  <div className="flex space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCommunityRatingScale(5)}
                      className={cn(
                        'font-semibold transition-all',
                        communityRatingScale === 5 &&
                          'ring-2 ring-primary bg-primary/5 border-primary text-primary',
                      )}
                    >
                      5-Star Scale
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCommunityRatingScale(10)}
                      className={cn(
                        'font-semibold transition-all',
                        communityRatingScale === 10 &&
                          'ring-2 ring-primary bg-primary/5 border-primary text-primary',
                      )}
                    >
                      10-Point Scale
                    </Button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isUploading || selectedFiles.length === 0}
                  className="w-full text-lg font-semibold"
                >
                  {isUploading ? 'Uploading...' : 'Create Wave'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
