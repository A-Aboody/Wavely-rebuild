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
  const { user } = useAuthStore();
  const createWaveMutation = useCreateWave();

  const [waveType, setWaveType] = useState<WaveType>('PERSONAL');
  const [mediaType, setMediaType] = useState<MediaType>('IMAGE');
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

    // Validate file types
    const validFiles = files.filter((file) => {
      if (mediaType === 'IMAGE') return file.type.startsWith('image/');
      if (mediaType === 'VIDEO') return file.type.startsWith('video/');
      if (mediaType === 'AUDIO') return file.type.startsWith('audio/');
      return false;
    });

    setSelectedFiles((prev) => [...prev, ...validFiles]);

    // Create preview URLs
    const newPreviewUrls = validFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
  };

  const removeFile = (index: number) => {
    // Revoke URL
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

      // Upload media files
      const mediaUrls = await uploadMedia(selectedFiles);

      const waveData: CreateWaveDto = {
        title,
        content,
        category: category || undefined,
        location: location || undefined,
        mediaType,
        mediaUrls,
        waveType,
        personalRating: waveType === 'PERSONAL' ? personalRating : null,
        communityRatingScale: waveType === 'COMMUNITY' ? communityRatingScale : null,
      };

      await createWaveMutation.mutateAsync(waveData);

      // Clear form
      setSelectedFiles([]);
      setPreviewUrls([]);
      setTitle('');
      setContent('');
      setCategory('');
      setLocation('');
      setPersonalRating(null);

      // Navigate to home
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
        return ['Short Film', 'Vlog', 'Tutorial', 'Comedy', 'Documentary', 'Animation', 'Music Video', 'Gameplay'];
      case 'AUDIO':
        return ['Music', 'Podcast', 'Audiobook', 'Sound Effects', 'Voice Over', 'Instrumental', 'Mix/DJ Set'];
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create a Wave</h1>
          <p className="text-gray-600 mb-8">Share your experience with the community</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Wave Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Wave Type</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setWaveType('PERSONAL')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    waveType === 'PERSONAL'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <User className="w-6 h-6 mx-auto mb-2" />
                  <p className="font-semibold">Personal</p>
                  <p className="text-xs text-gray-500 mt-1">You rate your content</p>
                </button>
                <button
                  type="button"
                  onClick={() => setWaveType('COMMUNITY')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    waveType === 'COMMUNITY'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Users className="w-6 h-6 mx-auto mb-2" />
                  <p className="font-semibold">Community</p>
                  <p className="text-xs text-gray-500 mt-1">Community rates your content</p>
                </button>
              </div>
            </div>

            {/* Media Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Media Type</label>
              <div className="grid grid-cols-3 gap-4">
                {(['IMAGE', 'VIDEO', 'AUDIO'] as MediaType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setMediaType(type)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      mediaType === type
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {type === 'IMAGE' && <ImageIcon className="w-6 h-6 mx-auto mb-2" />}
                    {type === 'VIDEO' && <Video className="w-6 h-6 mx-auto mb-2" />}
                    {type === 'AUDIO' && <Music className="w-6 h-6 mx-auto mb-2" />}
                    <p className="font-semibold text-sm">{type.charAt(0) + type.slice(1).toLowerCase()}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Upload Media</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-500">
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

              {/* Preview */}
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
                        <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Music className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Give your wave a title"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Tell us about your experience..."
              />
            </div>

            {/* Category & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {getCategoryOptions().map((cat) => (
                    <option key={cat} value={cat.toLowerCase().replace(/\s+/g, '-')}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add a location"
                  />
                </div>
              </div>
            </div>

            {/* Rating (Personal Wave) */}
            {waveType === 'PERSONAL' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Your Rating (Optional)
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setPersonalRating(rating)}
                      className={`w-10 h-10 rounded-lg border-2 font-semibold transition-all ${
                        personalRating === rating
                          ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
                {personalRating && (
                  <div className="flex items-center mt-2 text-sm text-gray-600">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    {personalRating}/10
                  </div>
                )}
              </div>
            )}

            {/* Rating Scale (Community Wave) */}
            {waveType === 'COMMUNITY' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Community Rating Scale
                </label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setCommunityRatingScale(5)}
                    className={`px-6 py-3 rounded-lg border-2 font-semibold transition-all ${
                      communityRatingScale === 5
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    5-Star Scale
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommunityRatingScale(10)}
                    className={`px-6 py-3 rounded-lg border-2 font-semibold transition-all ${
                      communityRatingScale === 10
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    10-Point Scale
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isUploading || selectedFiles.length === 0}
                className="w-full px-6 py-4 bg-blue-500 text-white rounded-lg font-semibold text-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isUploading ? 'Uploading...' : 'Create Wave'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
