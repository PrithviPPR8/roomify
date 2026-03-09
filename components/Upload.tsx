import { CheckCircle2, ImageIcon, UploadIcon } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react'
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

  // Store timer IDs in refs to persist across renders and cleanup
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  const readerRef = useRef<FileReader | null>(null);

  // Cleanup function to clear any active timers
  const clearTimers = () => {
    if (intervalIdRef.current !== null) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    if (timeoutIdRef.current !== null) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  };

  const clearPendingWork = () => {
    clearTimers();
    if (readerRef.current?.readyState === FileReader.LOADING) {
      readerRef.current.abort();
    }
    readerRef.current = null;
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      clearPendingWork();
    };
  }, []);

  const processFile = (fileToProcess: File) => {
    if (!isSignedIn) return;

    const allowedTypes = new Set(["image/jpeg", "image/jpg", "image/png"]);
    const maxSizeBytes = 10 * 1024 * 1024;

    if (!allowedTypes.has(fileToProcess.type) || fileToProcess.size > maxSizeBytes) {
      return;
    }

    // Clear any existing timers before starting a new upload
    clearPendingWork();

    setFile(fileToProcess);
    setProgress(0);

    const reader = new FileReader();
    readerRef.current = reader;

    reader.onerror = reader.onabort = () => {
      if (readerRef.current === reader) {
        readerRef.current = null;
      }
      setFile(null);
      setProgress(0);
    };

    reader.onload = () => {
      if (readerRef.current !== reader) return;
      const base64String = reader.result as string;
      let currentProgress = 0;

      intervalIdRef.current = setInterval(() => {
        currentProgress += PROGRESS_STEP;
        setProgress(Math.min(currentProgress, 99));

        if (currentProgress >= 100) {
          clearInterval(intervalIdRef.current!);
          intervalIdRef.current = null;
          setProgress(100);

          timeoutIdRef.current = setTimeout(() => {
            timeoutIdRef.current = null;
            if (readerRef.current === reader) {
              readerRef.current = null;
            }
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