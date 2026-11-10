import React, { useState, useEffect } from 'react';
import { X, Download, Star, ExternalLink, FileText, Loader2, Copy, Check } from 'lucide-react';
import { FileItem } from '../../types';
import { FileTypeIcon } from '../common/Icons';

interface FilePreviewModalProps {
  file: FileItem | null;
  onClose: () => void;
  onDownload: (file: FileItem) => void;
  onToggleStar: (file: FileItem) => void;
}

export function FilePreviewModal({ file, onClose, onDownload, onToggleStar }: FilePreviewModalProps) {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!file) {
      setTextContent(null);
      return;
    }

    const isText =
      file.mimeType.startsWith('text/') ||
      ['.txt', '.csv', '.json', '.md', '.js', '.ts', '.html', '.css'].includes(file.extension.toLowerCase());

    if (isText) {
      setLoadingText(true);
      fetch(`/api/v1/files/${file._id}/preview`, { credentials: 'include' })
        .then((res) => (res.ok ? res.text() : 'Preview unavailable'))
        .then((text) => setTextContent(text))
        .catch(() => setTextContent('Failed to load text preview.'))
        .finally(() => setLoadingText(false));
    } else {
      setTextContent(null);
    }
  }, [file]);

  if (!file) return null;

  const previewUrl = `/api/v1/files/${file._id}/preview`;
  const isImage = file.category === 'image';
  const isVideo = file.category === 'video';
  const isAudio = file.category === 'audio';
  const isPdf = file.extension.toLowerCase() === '.pdf' || file.mimeType === 'application/pdf';

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleCopyText = () => {
    if (textContent) {
      navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[88vh] bg-[#FFFFFF] dark:bg-[#1E1F20] rounded-3xl shadow-2xl border border-[#DADCE0] dark:border-[#444746] flex flex-col overflow-hidden">
        {/* Modal Top Bar */}
        <div className="h-14 px-5 border-b border-[#DADCE0] dark:border-[#444746] flex items-center justify-between gap-4 shrink-0 bg-[#FFFFFF] dark:bg-[#1E1F20]">
          <div className="flex items-center gap-3 min-w-0">
            <FileTypeIcon category={file.category} extension={file.extension} className="w-5 h-5 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[#202124] dark:text-[#E3E3E3] truncate">
                {file.displayName}
              </h3>
              <p className="text-[11px] text-[#5F6368] dark:text-[#AEB0B3] font-mono tabular-nums">
                {formatSize(file.size)} · {file.extension.toUpperCase().replace('.', '')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onToggleStar(file)}
              className={`p-2 rounded-full hover:bg-[#F1F3F4] dark:hover:bg-[#28292A] transition-colors ${
                file.isStarred ? 'text-[#F4B400]' : 'text-[#5F6368] dark:text-[#AEB0B3]'
              }`}
              title={file.isStarred ? 'Unstar' : 'Star'}
            >
              <Star className={`w-4 h-4 ${file.isStarred ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={() => onDownload(file)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1A73E8] hover:bg-[#1558B0] dark:bg-[#A8C7FA] dark:text-[#040C19] dark:hover:bg-[#8AB4F8] rounded-full transition-colors shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-[#5F6368] dark:text-[#AEB0B3] hover:bg-[#F1F3F4] dark:hover:bg-[#28292A] rounded-full transition-colors ml-1"
              aria-label="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Viewport */}
        <div className="flex-1 bg-[#F8FAFD] dark:bg-[#131314] overflow-auto flex items-center justify-center p-4">
          {/* 1. Image Viewer */}
          {isImage && (
            <div className="max-w-full max-h-full flex items-center justify-center">
              <img
                src={previewUrl}
                alt={file.displayName}
                className="max-h-[calc(88vh-6rem)] max-w-full object-contain rounded-lg shadow-sm"
              />
            </div>
          )}

          {/* 2. PDF Viewer */}
          {isPdf && (
            <div className="w-full h-full rounded-xl overflow-hidden bg-white shadow-inner">
              <iframe
                src={`${previewUrl}#toolbar=1`}
                title={file.displayName}
                className="w-full h-full border-0"
              />
            </div>
          )}

          {/* 3. HTML5 Video Player */}
          {isVideo && (
            <div className="w-full max-w-4xl max-h-[calc(88vh-6rem)] rounded-xl overflow-hidden shadow-lg bg-black">
              <video
                controls
                autoPlay
                src={previewUrl}
                className="w-full h-full max-h-[calc(88vh-6rem)]"
              >
                Your browser does not support HTML5 video playback.
              </video>
            </div>
          )}

          {/* 4. HTML5 Audio Player */}
          {isAudio && (
            <div className="p-8 bg-[#FFFFFF] dark:bg-[#1E1F20] rounded-3xl shadow-lg border border-[#DADCE0] dark:border-[#444746] max-w-md w-full text-center">
              <div className="w-16 h-16 rounded-full bg-[#FBBC04]/10 text-[#FBBC04] flex items-center justify-center mx-auto mb-4">
                <FileTypeIcon category="audio" extension={file.extension} className="w-8 h-8" />
              </div>
              <h4 className="font-semibold text-sm text-[#202124] dark:text-[#E3E3E3] mb-1 truncate">
                {file.displayName}
              </h4>
              <p className="text-xs text-[#5F6368] dark:text-[#AEB0B3] mb-6 font-mono tabular-nums">
                {formatSize(file.size)}
              </p>
              <audio controls src={previewUrl} className="w-full" autoPlay>
                Your browser does not support audio playback.
              </audio>
            </div>
          )}

          {/* 5. Text / Code Viewer */}
          {textContent !== null && (
            <div className="w-full h-full bg-[#FFFFFF] dark:bg-[#1E1F20] rounded-2xl border border-[#DADCE0] dark:border-[#444746] flex flex-col overflow-hidden shadow-sm">
              <div className="px-4 py-2 border-b border-[#DADCE0] dark:border-[#444746] flex items-center justify-between bg-[#F1F3F4] dark:bg-[#28292A]">
                <span className="text-xs font-mono text-[#5F6368] dark:text-[#AEB0B3]">Document Preview</span>
                <button
                  onClick={handleCopyText}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#1A73E8] dark:text-[#A8C7FA] hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </button>
              </div>
              <div className="flex-1 p-4 overflow-auto">
                {loadingText ? (
                  <div className="flex items-center justify-center h-full gap-2 text-xs text-[#5F6368]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading document content...</span>
                  </div>
                ) : (
                  <pre className="font-mono text-xs text-[#202124] dark:text-[#E3E3E3] leading-relaxed whitespace-pre-wrap break-words">
                    {textContent}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* 6. Office / Archive / Unsupported Preview Fallback */}
          {!isImage && !isPdf && !isVideo && !isAudio && textContent === null && (
            <div className="text-center p-8 max-w-md bg-[#FFFFFF] dark:bg-[#1E1F20] rounded-3xl border border-[#DADCE0] dark:border-[#444746] shadow-md">
              <div className="w-16 h-16 rounded-2xl bg-[#1A73E8]/10 dark:bg-[#A8C7FA]/10 flex items-center justify-center mx-auto mb-4">
                <FileTypeIcon category={file.category} extension={file.extension} className="w-8 h-8" />
              </div>
              <h4 className="font-display font-semibold text-base text-[#202124] dark:text-[#E3E3E3] mb-1 truncate">
                {file.displayName}
              </h4>
              <p className="text-xs text-[#5F6368] dark:text-[#AEB0B3] mb-4">
                In-browser preview is not supported for {file.extension.toUpperCase()} documents. Download the original file to view on your device.
              </p>

              {file.checksum && (
                <div className="p-2 mb-6 rounded-lg bg-[#F1F3F4] dark:bg-[#28292A] text-[10px] font-mono text-[#5F6368] dark:text-[#AEB0B3] truncate">
                  SHA-256: {file.checksum}
                </div>
              )}

              <button
                onClick={() => onDownload(file)}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#1A73E8] hover:bg-[#1558B0] dark:bg-[#A8C7FA] dark:text-[#040C19] dark:hover:bg-[#8AB4F8] rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download File ({formatSize(file.size)})</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
