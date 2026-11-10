import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, FolderPlus, ArrowUpCircle } from 'lucide-react';

interface UploadDropzoneProps {
  onFilesSelected: (files: FileList | File[]) => void;
  children?: React.ReactNode;
}

export function UploadDropzone({ onFilesSelected, children }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current++;
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current--;
      if (dragCounter.current === 0) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        onFilesSelected(e.dataTransfer.files);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [onFilesSelected]);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFilesSelected(e.target.files);
            e.target.value = '';
          }
        }}
        className="hidden"
        id="hidden-file-input"
        aria-label="Upload files input"
      />

      {children}

      {/* Drag & Drop Full Window Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-[#1A73E8]/10 dark:bg-[#A8C7FA]/10 backdrop-blur-xs flex items-center justify-center p-6 border-4 border-dashed border-[#1A73E8] dark:border-[#A8C7FA] animate-in fade-in duration-150 pointer-events-none">
          <div className="p-8 bg-[#FFFFFF] dark:bg-[#1E1F20] rounded-3xl shadow-2xl border border-[#DADCE0] dark:border-[#444746] text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-[#1A73E8]/10 dark:bg-[#A8C7FA]/20 text-[#1A73E8] dark:text-[#A8C7FA] flex items-center justify-center mx-auto mb-4 animate-bounce">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="font-display font-semibold text-lg text-[#202124] dark:text-[#E3E3E3] mb-1">
              Drop files to upload
            </h3>
            <p className="text-xs text-[#5F6368] dark:text-[#AEB0B3]">
              Files will be securely transferred to your private personal drive.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
