import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import Button from './Button';

interface FileUploadProps {
  acceptedTypes: string;
  onFileSelected: (file: File) => void;
  label?: string;
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  acceptedTypes, 
  onFileSelected, 
  label = 'Upload File', 
  error 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setFileName(file.name);
      onFileSelected(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mb-4">
      {label && <p className="block text-sm font-medium text-gray-700 mb-1">{label}</p>}
      <div className={`border-2 border-dashed rounded-md p-4 ${error ? 'border-red-500' : 'border-gray-300'}`}>
        <div className="flex flex-col items-center justify-center space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes}
            onChange={handleFileChange}
            className="hidden"
          />
          <Button 
            type="button" 
            variant="outline"
            onClick={handleButtonClick}
            className="flex items-center space-x-2"
          >
            <Upload size={16} />
            <span>Choose File</span>
          </Button>
          {fileName && (
            <p className="text-sm text-gray-600 truncate max-w-full">
              Selected: {fileName}
            </p>
          )}
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default FileUpload;