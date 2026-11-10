import React from 'react';
import { Folder, Clock, Star, HardDrive, Plus } from 'lucide-react';
import { ActiveTab } from '../../types';

interface MobileNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onTriggerUpload: () => void;
}

export function MobileNav({ activeTab, onSelectTab, onTriggerUpload }: MobileNavProps) {
  const tabs = [
    { id: 'my-files' as ActiveTab, label: 'Files', icon: Folder },
    { id: 'recent' as ActiveTab, label: 'Recent', icon: Clock },
    { id: 'starred' as ActiveTab, label: 'Starred', icon: Star },
    { id: 'storage' as ActiveTab, label: 'Storage', icon: HardDrive },
  ];

  return (
    <>
      {/* Floating Action Button for Mobile (One-handed upload) */}
      <div className="fixed right-5 bottom-20 z-40 md:hidden">
        <button
          onClick={onTriggerUpload}
          className="w-14 h-14 rounded-2xl bg-[#1A73E8] dark:bg-[#A8C7FA] text-white dark:text-[#040C19] flex items-center justify-center shadow-lg hover:shadow-xl active:scale-95 transition-all"
          aria-label="Upload files"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 h-16 bg-[#FFFFFF] dark:bg-[#1E1F20] border-t border-[#DADCE0] dark:border-[#444746] flex items-center justify-around px-2 md:hidden">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 min-w-[64px] transition-colors ${
                isActive
                  ? 'text-[#1A73E8] dark:text-[#A8C7FA]'
                  : 'text-[#5F6368] dark:text-[#AEB0B3]'
              }`}
            >
              <div
                className={`px-4 py-1 rounded-full mb-0.5 transition-colors ${
                  isActive ? 'bg-[#E8F0FE] dark:bg-[#004A77]/40' : 'bg-transparent'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
