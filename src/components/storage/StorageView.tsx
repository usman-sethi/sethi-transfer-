import React from 'react';
import { HardDrive, FileText, Image as ImageIcon, Film, Music, Archive, File } from 'lucide-react';
import { StorageStats, FileCategory } from '../../types';

interface StorageViewProps {
  stats: StorageStats | null;
}

export function StorageView({ stats }: StorageViewProps) {
  const used = stats?.storageUsed || 0;
  const limit = stats?.storageLimit || 5 * 1024 * 1024 * 1024;
  const percentage = Math.min(100, (used / limit) * 100);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 ** 3)).toFixed(2)} GB`;
  };

  const categories: Array<{
    id: FileCategory;
    label: string;
    icon: any;
    color: string;
    bgColor: string;
  }> = [
    { id: 'document', label: 'Documents', icon: FileText, color: 'text-[#4285F4]', bgColor: 'bg-[#4285F4]' },
    { id: 'image', label: 'Photos & Images', icon: ImageIcon, color: 'text-[#EA4335]', bgColor: 'bg-[#EA4335]' },
    { id: 'video', label: 'Videos', icon: Film, color: 'text-[#FBBC04]', bgColor: 'bg-[#FBBC04]' },
    { id: 'audio', label: 'Audio & Music', icon: Music, color: 'text-[#0F9D58]', bgColor: 'bg-[#0F9D58]' },
    { id: 'archive', label: 'Archives (ZIP/RAR)', icon: Archive, color: 'text-[#AB47BC]', bgColor: 'bg-[#AB47BC]' },
    { id: 'other', label: 'Other Files', icon: File, color: 'text-[#5F6368]', bgColor: 'bg-[#5F6368]' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in duration-200">
      <div className="mb-8">
        <h2 className="font-display text-2xl font-bold text-[#202124] dark:text-[#E3E3E3] mb-1">
          Storage Breakdown
        </h2>
        <p className="text-xs text-[#5F6368] dark:text-[#AEB0B3]">
          Overview of your personal file quota and category consumption.
        </p>
      </div>

      {/* Main Storage Bar Card */}
      <div className="p-6 md:p-8 bg-[#FFFFFF] dark:bg-[#1E1F20] rounded-3xl border border-[#DADCE0] dark:border-[#444746] shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
          <div>
            <span className="text-3xl font-display font-bold text-[#202124] dark:text-[#E3E3E3] font-mono tabular-nums">
              {formatSize(used)}
            </span>
            <span className="text-sm text-[#5F6368] dark:text-[#AEB0B3] ml-2">
              of {formatSize(limit)} used ({percentage.toFixed(1)}%)
            </span>
          </div>
          <div className="text-xs font-mono text-[#5F6368] dark:text-[#AEB0B3]">
            {stats?.fileCount || 0} total files stored
          </div>
        </div>

        {/* Multi-segment Colored Bar */}
        <div className="w-full h-3 bg-[#F1F3F4] dark:bg-[#28292A] rounded-full overflow-hidden flex">
          {categories.map((cat) => {
            const bytes = stats?.categoryBreakdown[cat.id]?.bytes || 0;
            const catPercentage = (bytes / limit) * 100;
            if (catPercentage === 0) return null;
            return (
              <div
                key={cat.id}
                className={`${cat.bgColor} h-full transition-all duration-300`}
                style={{ width: `${Math.max(1, catPercentage)}%` }}
                title={`${cat.label}: ${formatSize(bytes)}`}
              />
            );
          })}
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const data = stats?.categoryBreakdown[cat.id] || { count: 0, bytes: 0 };
          return (
            <div
              key={cat.id}
              className="p-5 bg-[#FFFFFF] dark:bg-[#1E1F20] rounded-2xl border border-[#DADCE0] dark:border-[#444746] flex items-center justify-between shadow-xs"
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-10 h-10 rounded-xl bg-[#F8FAFD] dark:bg-[#28292A] flex items-center justify-center ${cat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#202124] dark:text-[#E3E3E3]">{cat.label}</h4>
                  <p className="text-[11px] text-[#5F6368] dark:text-[#AEB0B3]">
                    {data.count} file{data.count === 1 ? '' : 's'}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-semibold text-[#202124] dark:text-[#E3E3E3] font-mono tabular-nums">
                  {formatSize(data.bytes)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
