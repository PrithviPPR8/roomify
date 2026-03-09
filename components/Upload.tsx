import { CheckCircle2, ImageIcon, UploadIcon } from 'lucide-react';
import React, { useState } from 'react'
import { useOutletContext } from 'react-router';
import { REDIRECT_DELAY_MS, PROGRESS_INTERVAL_MS, PROGRESS_STEP } from '../lib/constants';

interface UploadProps {
  onComplete?: (base64Data: string) => void;
}

const Upload: React.FC<UploadProps> = ({ onComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);

  const { isSignedIn } = useOutletContext<AuthContext>();

  const processFile = (fileToProcess: File) => {
    if (!isSignedIn) return;

    setFile(fileToProcess);
    setProgress(0);

    const reader = new FileReader();

    reader.onload = () => {
      const base64String = reader.result as string;
      let currentProgress = 0;

      const intervalId = setInterval(() => {
        currentProgress += PROGRESS_STEP;
        setProgress(Math.min(currentProgress, 99));

        if (currentProgress >= 100) {
          clearInterval(intervalId);
          setProgress(100);

          setTimeout(() => {
            onComplete?.(base64String);
          }, REDIRECT_DELAY_MS);
        }
      }, PROGRESS_INTERVAL_MS);
    };

    reader.readAsDataURL(fileToProcess);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSignedIn) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!isSignedIn) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  return (
    <div className='upload'>
        {!file ? (
            <div 
              className={`dropzone ${isDragging ? 'is-dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
                <input 
                    type='file'
                    className='drop-input'
                    accept='.jpg,.jpeg,.png'
                    disabled={!isSignedIn}
                    onChange={handleChange}
                />

                <div className='drop-content'>
                    <div className='drop-icon'>
                        <UploadIcon size={20}/>
                    </div>
                    <p>
                        {isSignedIn ? (
                            "Click to upload or just drag and drop"
                        ) : (
                            "Sign in or sign up with Puter to upload"
                        )}
                    </p>
                    <p className='help'>Maximum file size 10 MB.</p>
                </div>
            </div>
        ): (
            <div className='upload-status'>
                <div className='status-content'>
                    <div className='status-icon'>
                        {progress === 100 ? (
                            <CheckCircle2 className='check'/>
                        ): (
                            <ImageIcon className='image'/>
                        )}
                    </div>

                    <h3>{file.name}</h3>

                    <div className='progress'>
                        <div className='bar' style={{ width: `${progress}%`}} />

                        <p className='status-text'>
                            {progress < 100 ? 'Analyzing Floor Plan ...' : 'Redirecting ...'}
                        </p>
                    </div>
                </div>
            </div>
        )}
    </div>
  )
}

export default Upload