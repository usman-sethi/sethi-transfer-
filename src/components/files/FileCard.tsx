import React, { useState } from 'react';
import { Download, Eye, Star, MoreVertical, Trash2, Edit3, RotateCcw } from 'lucide-react';
import { FileItem } from '../../types';
import { FileTypeIcon } from '../common/Icons';

interface FileCardProps {
  file: FileItem;
  onPreview: (file: FileItem) => void;
  onDownload: (file: FileItem) => void;
  onToggleStar: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
  onRestore?: (file: FileItem) => void;
  onRename: (file: FileItem) => void;
}

export function FileCard({
  file,
  onPreview,
  onDownload,
  onToggleStar,
  onDelete,
  onRestore,
  onRename,
}: FileCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isImage = file.category === 'image';

  return (
    <div className="group relative bg-[#FFFFFF] dark:bg-[#1E1F20] rounded-2xl border border-[#DADCE0] dark:border-[#444746] hover:border-[#1A73E8]/50 dark:hover:border-[#A8C7FA]/50 hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
      {/* Thumbnail or Icon Viewport */}
      <div
        onClick={() => onPreview(file)}
        className="relative h-36 bg-[#F8FAFD] dark:bg-[#18191A] flex items-center justify-center p-4 cursor-pointer overflow-hidden border-b border-[#DADCE0]/60 dark:border-[#444746]/60"
      >
        {isImage && (file.cloudinaryUrl || file.storageDeliveryType === 'local') ? (
          <img
            src={`/api/v1/files/${file._id}/preview`}
            alt={file.displayName}
            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={(e) => {
              // fallback to icon if image preview fails
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <FileTypeIcon category={file.category} extension={file.extension} className="w-14 h-14" />
        )}

        {/* Hover Quick-Actions Overlay */}
        <div className="absolute inset-0 bg-black/10 dark:bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview(file);
            }}
            className="p-2 bg-white/90 dark:bg-[#28292A]/90 hover:bg-white dark:hover:bg-[#28292A] text-[#202124] dark:text-[#E3E3E3] rounded-full shadow-sm hover:scale-105 transition-all"
            title="Preview file"
            aria-label="Preview file"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload(file);
            }}
            className="p-2 bg-white/90 dark:bg-[#28292A]/90 hover:bg-white dark:hover:bg-[#28292A] text-[#1A73E8] dark:text-[#A8C7FA] rounded-full shadow-sm hover:scale-105 transition-all"
            title="Download file"
            aria-label="Download file"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Card Body & Unboxed Metadata */}
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <FileTypeIcon category={file.category} extension={file.extension} className="w-4 h-4 shrink-0" />
            <span
              className="text-xs font-semibold text-[#202124] dark:text-[#E3E3E3] truncate cursor-pointer hover:text-[#1A73E8] dark:hover:text-[#A8C7FA]"
              onClick={() => onPreview(file)}
              title={file.displayName}
            >
              {file.displayName}
            </span>
          </div>

          {/* Star Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar(file);
            }}
            className={`p-1 rounded-full hover:bg-[#F1F3F4] dark:hover:bg-[#28292A] shrink-0 transition-colors ${
              file.isStarred
                ? 'text-[#F4B400] fill-[#F4B400]'
                : 'text-[#5F6368] dark:text-[#AEB0B3] opacity-0 group-hover:opacity-100'
            }`}
            aria-label={file.isStarred ? 'Unstar file' : 'Star file'}
          >
            <Star className={`w-3.5 h-3.5 ${file.isStarred ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Unboxed Metadata Line (Anti-AI Slop Rule) */}
        <div className="flex items-center gap-1.5 text-[11px] text-[#5F6368] dark:text-[#AEB0B3] font-mono tabular-nums">
          <span>{formatSize(file.size)}</span>
          <span aria-hidden="true">·</span>
          <span>{formatDate(file.createdAt)}</span>
        </div>
      </div>

      {/* Context Menu Button */}
      <div className="absolute top-2 right-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="p-1.5 rounded-full bg-white/80 dark:bg-[#1E1F20]/80 text-[#5F6368] dark:text-[#AEB0B3] hover:text-[#202124] dark:hover:text-[#E3E3E3] shadow-xs hover:bg-white dark:hover:bg-[#28292A] transition-colors"
          aria-label="More actions"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 mt-1 w-44 bg-[#FFFFFF] dark:bg-[#1E1F20] rounded-xl shadow-xl border border-[#DADCE0] dark:border-[#444746] py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDownload(file);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-[#202124] dark:text-[#E3E3E3] hover:bg-[#F1F3F4] dark:hover:bg-[#28292A] transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-[#1A73E8] dark:text-[#A8C7FA]" />
                Download
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onRename(file);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-[#202124] dark:text-[#E3E3E3] hover:bg-[#F1F3F4] dark:hover:bg-[#28292A] transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Rename
              </button>

              {file.isDeleted && onRestore ? (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onRestore(file);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-[#1E8E3E] dark:text-[#81C995] hover:bg-[#F1F3F4] dark:hover:bg-[#28292A] transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restore
                </button>
              ) : null}

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(file);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-[#D93025] dark:text-[#F28B82] hover:bg-[#F1F3F4] dark:hover:bg-[#28292A] transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {file.isDeleted ? 'Delete permanently' : 'Move to trash'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
