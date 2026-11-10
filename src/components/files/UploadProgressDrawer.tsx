import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Loader2, StopCircle } from 'lucide-react';
import { UploadQueueItem } from '../../types';

interface UploadProgressDrawerProps {
  queue: UploadQueueItem[];
  onCancelItem: (id: string) => void;
  onClearCompleted: () => void;
}

export function UploadProgressDrawer({
  queue,
  onCancelItem,
  onClearCompleted,
}: UploadProgressDrawerProps) {
  const [minimized, setMinimized] = useState(false);

  if (queue.length === 0) return null;

  const inProgress = queue.filter((i) => i.status === 'uploading' || i.status === 'pending').length;
  const completed = queue.filter((i) => i.status === 'completed').length;

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 w-80 md:w-96 bg-[#FFFFFF] dark:bg-[#1E1F20] rounded-2xl shadow-2xl border border-[#DADCE0] dark:border-[#444746] overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
      {/* Drawer Header */}
      <div className="h-12 px-4 bg-[#202124] text-[#E3E3E3] flex items-center justify-between">
        <span className="text-xs font-semibold">
          {inProgress > 0 ? `Uploading ${inProgress} item${inProgress > 1 ? 's' : ''}` : `${completed} upload${completed > 1 ? 's' : ''} complete`}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(!minimized)}
            className="p-1 text-[#AEB0B3] hover:text-white rounded-md transition-colors"
            aria-label={minimized ? 'Expand uploads' : 'Minimize uploads'}
          >
            {minimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {inProgress === 0 && (
            <button
              onClick={onClearCompleted}
              className="p-1 text-[#AEB0B3] hover:text-white rounded-md transition-colors"
              aria-label="Dismiss upload tray"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Drawer Items Body */}
      {!minimized && (
        <div className="max-h-64 overflow-y-auto divide-y divide-[#DADCE0]/40 dark:divide-[#444746]/40 p-2">
          {queue.map((item) => (
            <div key={item.id} className="p-2.5 flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[#202124] dark:text-[#E3E3E3] truncate">{item.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  {item.status === 'uploading' && (
                    <div className="w-full bg-[#F1F3F4] dark:bg-[#28292A] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[#1A73E8] dark:bg-[#A8C7FA] h-full rounded-full transition-all duration-150"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                  <span className="text-[10px] text-[#5F6368] dark:text-[#AEB0B3] shrink-0 font-mono tabular-nums">
                    {item.status === 'uploading' ? `${item.progress}%` : formatSize(item.size)}
                  </span>
                </div>
              </div>

              {/* Status Icons */}
              <div className="shrink-0">
                {item.status === 'uploading' && (
                  <button
                    onClick={() => onCancelItem(item.id)}
                    className="p-1 text-[#5F6368] hover:text-[#D93025] dark:text-[#AEB0B3] dark:hover:text-[#F28B82] transition-colors"
                    title="Cancel upload"
                    aria-label="Cancel upload"
                  >
                    <StopCircle className="w-4 h-4" />
                  </button>
                )}
                {item.status === 'completed' && (
                  <CheckCircle2 className="w-4.5 h-4.5 text-[#1E8E3E] dark:text-[#81C995]" />
                )}
                {item.status === 'error' && (
                  <span title={item.error}>
                    <AlertCircle className="w-4.5 h-4.5 text-[#D93025] dark:text-[#F28B82]" />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
