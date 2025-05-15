import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { AdType, supabase } from '../../lib/supabase';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import Button from '../ui/Button';
import FileUpload from '../ui/FileUpload';
import Toggle from '../ui/Toggle';

interface AdFormData {
  title: string;
  description: string;
  externalLink: string;
  duration: number;
  isActive: boolean;
}

const AdUploadForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [adType, setAdType] = useState<AdType>('image');
  const [file, setFile] = useState<File | null>(null);
  
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<AdFormData>({
    defaultValues: {
      title: '',
      description: '',
      externalLink: '',
      duration: 10,
      isActive: true
    }
  });

  const isActive = watch('isActive');

  const onFileSelected = (selectedFile: File) => {
    setFile(selectedFile);
  };

  const onSubmit = async (data: AdFormData) => {
    if (!file) {
      toast.error('Please upload a file');
      return;
    }

    setIsLoading(true);
    
    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `ads/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('ads')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get the public URL for the file
      const { data: urlData } = supabase.storage
        .from('ads')
        .getPublicUrl(filePath);
        
      // Add record to the ads table
      const { error: dbError } = await supabase
        .from('ads')
        .insert({
          title: data.title,
          description: data.description,
          type: adType,
          url: urlData.publicUrl,
          external_link: data.externalLink,
          duration: adType === 'image' ? data.duration : 0,
          is_active: data.isActive
        });
        
      if (dbError) throw dbError;
      
      toast.success('Ad uploaded successfully');
      reset();
      setFile(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload ad');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Upload New Ad</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Ad Type</label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              checked={adType === 'image'}
              onChange={() => setAdType('image')}
            />
            <span className="ml-2 text-sm text-gray-700">Image</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              checked={adType === 'video'}
              onChange={() => setAdType('video')}
            />
            <span className="ml-2 text-sm text-gray-700">Video</span>
          </label>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Title"
          {...register('title', { required: 'Title is required' })}
          error={errors.title?.message}
        />
        
        <TextArea
          label="Description"
          rows={4}
          {...register('description', { required: 'Description is required' })}
          error={errors.description?.message}
        />
        
        <Input
          label="External Link (for QR Code)"
          type="url"
          {...register('externalLink', { 
            required: 'External link is required',
            pattern: {
              value: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
              message: 'Please enter a valid URL'
            }
          })}
          error={errors.externalLink?.message}
        />
        
        {adType === 'image' && (
          <Input
            label="Duration (seconds)"
            type="number"
            min={1}
            max={60}
            {...register('duration', { 
              required: 'Duration is required',
              min: {
                value: 1,
                message: 'Duration must be at least 1 second'
              },
              max: {
                value: 60,
                message: 'Duration cannot exceed 60 seconds'
              }
            })}
            error={errors.duration?.message}
          />
        )}
        
        <FileUpload
          label={`Upload ${adType === 'image' ? 'Image' : 'Video'}`}
          acceptedTypes={adType === 'image' ? 'image/*' : 'video/*'}
          onFileSelected={onFileSelected}
          error={!file ? 'File is required' : undefined}
        />
        
        <div className="py-2">
          <Toggle
            enabled={isActive}
            onChange={(value) => {
              // This will be handled by react-hook-form
            }}
            label="Active"
          />
          <input
            type="checkbox"
            className="hidden"
            {...register('isActive')}
          />
        </div>
        
        <Button
          type="submit"
          isLoading={isLoading}
          className="mt-4"
        >
          Upload Ad
        </Button>
      </form>
    </div>
  );
};

export default AdUploadForm;