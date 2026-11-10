import React, { useState } from 'react';
import { Download, Eye, Star, MoreVertical, Trash2, Edit3, RotateCcw } from 'lucide-react';
import { FileItem } from '../../types';
import { FileTypeIcon } from '../common/Icons';

interface FileListItemProps {
  file: FileItem;
  onPreview: (file: FileItem) => void;
  onDownload: (file: FileItem) => void;
  onToggleStar: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
  onRestore?: (file: FileItem) => void;
  onRename: (file: FileItem) => void;
}

export function FileListItem({
  file,
  onPreview,
  onDownload,
  onToggleStar,
  onDelete,
  onRestore,
  onRename,
}: FileListItemProps) {
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

  return (
    <div
      onClick={() => onPreview(file)}
      className="group relative flex items-center justify-between px-4 py-2.5 hover:bg-[#F1F3F4] dark:hover:bg-[#28292A] border-b border-[#DADCE0]/50 dark:border-[#444746]/50 transition-colors cursor-pointer text-xs"
    >
      {/* Column 1: Icon & Name */}
      <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
        <FileTypeIcon category={file.category} extension={file.extension} className="w-5 h-5 shrink-0" />
        <span className="font-medium text-[#202124] dark:text-[#E3E3E3] truncate group-hover:text-[#1A73E8] dark:group-hover:text-[#A8C7FA]">
          {file.displayName}
        </span>
      </div>

      {/* Column 2: Category (Desktop) */}
      <div className="hidden md:block w-28 text-[#5F6368] dark:text-[#AEB0B3] capitalize truncate">
        {file.category}
      </div>

      {/* Column 3: Upload Date */}
      <div className="hidden sm:block w-32 text-[#5F6368] dark:text-[#AEB0B3] font-mono tabular-nums">
        {formatDate(file.createdAt)}
      </div>

      {/* Column 4: Size */}
      <div className="w-20 text-right text-[#5F6368] dark:text-[#AEB0B3] font-mono tabular-nums">
        {formatSize(file.size)}
      </div>

      {/* Column 5: Star & Actions */}
      <div className="flex items-center gap-1 ml-4" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onToggleStar(file)}
          className={`p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${
            file.isStarred
              ? 'text-[#F4B400] fill-[#F4B400]'
              : 'text-[#5F6368] dark:text-[#AEB0B3] opacity-0 group-hover:opacity-100'
          }`}
          aria-label={file.isStarred ? 'Unstar file' : 'Star file'}
        >
          <Star className={`w-4 h-4 ${file.isStarred ? 'fill-current' : ''}`} />
        </button>

        <button
          onClick={() => onDownload(file)}
          className="p-1.5 rounded-full text-[#5F6368] dark:text-[#AEB0B3] hover:text-[#1A73E8] dark:hover:text-[#A8C7FA] hover:bg-black/5 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Download file"
          aria-label="Download file"
        >
          <Download className="w-4 h-4" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-full text-[#5F6368] dark:text-[#AEB0B3] hover:text-[#202124] dark:hover:text-[#E3E3E3] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="More actions"
          >
            <MoreVertical className="w-4 h-4" />
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
    </div>
  );
}
