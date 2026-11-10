import React from 'react';
import {
  Folder,
  Clock,
  Star,
  Trash2,
  HardDrive,
  Plus,
  UploadCloud,
} from 'lucide-react';
import { ActiveTab, User, StorageStats } from '../../types';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onTriggerUpload: () => void;
  user: User | null;
  storageStats: StorageStats | null;
  trashCount?: number;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  onTriggerUpload,
  user,
  storageStats,
  trashCount = 0,
}: SidebarProps) {
  const usedBytes = storageStats?.storageUsed || user?.storageUsed || 0;
  const limitBytes = storageStats?.storageLimit || user?.storageLimit || 5 * 1024 * 1024 * 1024;
  const usedPercentage = Math.min(100, Math.round((usedBytes / limitBytes) * 100));

  const navItems = [
    { id: 'my-files' as ActiveTab, label: 'My Files', icon: Folder },
    { id: 'recent' as ActiveTab, label: 'Recent', icon: Clock },
    { id: 'starred' as ActiveTab, label: 'Starred', icon: Star },
    { id: 'trash' as ActiveTab, label: 'Trash', icon: Trash2, badge: trashCount > 0 ? trashCount : undefined },
    { id: 'storage' as ActiveTab, label: 'Storage', icon: HardDrive },
  ];

  return (
    <aside className="w-64 h-[calc(100vh-4rem)] bg-[#FFFFFF] dark:bg-[#1E1F20] border-r border-[#DADCE0] dark:border-[#444746] flex flex-col justify-between p-4 shrink-0 hidden md:flex transition-colors">
      <div>
        {/* Google Drive Inspired "+ New" Upload Button */}
        <div className="mb-6">
          <button
            onClick={onTriggerUpload}
            className="group flex items-center gap-3 px-5 py-3.5 bg-[#FFFFFF] dark:bg-[#28292A] hover:bg-[#F8FAFD] dark:hover:bg-[#333537] text-[#202124] dark:text-[#E3E3E3] rounded-2xl shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] hover:shadow-[0_2px_6px_2px_rgba(60,64,67,0.15),0_8px_12px_4px_rgba(60,64,67,0.15)] transition-all font-semibold text-sm border border-transparent hover:border-[#DADCE0] dark:hover:border-[#444746] active:scale-[0.98]"
            aria-label="Upload new files"
          >
            <div className="w-7 h-7 rounded-full bg-[#1A73E8]/10 dark:bg-[#A8C7FA]/20 flex items-center justify-center text-[#1A73E8] dark:text-[#A8C7FA]">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span>New Upload</span>
          </button>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#E8F0FE] text-[#1A73E8] dark:bg-[#004A77]/40 dark:text-[#A8C7FA]'
                    : 'text-[#5F6368] dark:text-[#AEB0B3] hover:bg-[#F1F3F4] dark:hover:bg-[#28292A] hover:text-[#202124] dark:hover:text-[#E3E3E3]'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center gap-3.5 truncate">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#1A73E8] dark:text-[#A8C7FA]' : 'text-inherit'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="text-xs font-mono font-medium text-[#5F6368] dark:text-[#AEB0B3] px-2 py-0.5 rounded-full bg-[#F1F3F4] dark:bg-[#28292A]">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Storage Meter Widget */}
      <div className="pt-4 border-t border-[#DADCE0] dark:border-[#444746]">
        <div className="flex items-center justify-between text-xs text-[#5F6368] dark:text-[#AEB0B3] mb-2 font-medium">
          <span>Storage</span>
          <span className="font-mono tabular-nums">{usedPercentage}%</span>
        </div>
        <div className="w-full h-1.5 bg-[#F1F3F4] dark:bg-[#28292A] rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              usedPercentage > 90
                ? 'bg-[#D93025] dark:bg-[#F28B82]'
                : usedPercentage > 75
                ? 'bg-[#F9AB00] dark:bg-[#FDD663]'
                : 'bg-[#1A73E8] dark:bg-[#A8C7FA]'
            }`}
            style={{ width: `${Math.max(4, usedPercentage)}%` }}
          />
        </div>
        <p className="text-xs text-[#5F6368] dark:text-[#AEB0B3] font-mono tabular-nums">
          {(usedBytes / (1024 * 1024)).toFixed(1)} MB of {(limitBytes / (1024 ** 3)).toFixed(1)} GB used
        </p>

        <button
          onClick={() => onSelectTab('storage')}
          className="mt-3 w-full py-1.5 px-3 text-xs font-medium text-[#1A73E8] dark:text-[#A8C7FA] hover:bg-[#E8F0FE] dark:hover:bg-[#004A77]/30 rounded-lg text-center transition-colors border border-[#DADCE0] dark:border-[#444746]"
        >
          View Storage Details
        </button>
      </div>
    </aside>
  );
}
