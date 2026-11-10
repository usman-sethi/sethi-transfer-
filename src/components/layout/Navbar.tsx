import React, { useState } from 'react';
import { Search, Sun, Moon, Database, Cloud, User as UserIcon, LogOut, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { User, SystemHealth } from '../../types';

interface NavbarProps {
  user: User | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  systemHealth: SystemHealth | null;
  onOpenHealth: () => void;
}

export function Navbar({
  user,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  darkMode,
  onToggleDarkMode,
  onOpenAuth,
  onLogout,
  systemHealth,
  onOpenHealth,
}: NavbarProps) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#FFFFFF] dark:bg-[#1E1F20] border-b border-[#DADCE0] dark:border-[#444746] px-4 md:px-6 flex items-center justify-between gap-4 md:gap-8 transition-colors">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-[#1A73E8]/10 dark:bg-[#A8C7FA]/10 flex items-center justify-center text-[#1A73E8] dark:text-[#A8C7FA]">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
            <path d="m8 17 4-4 4 4" />
            <path d="M12 13v9" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="font-display font-semibold text-lg tracking-tight text-[#202124] dark:text-[#E3E3E3] whitespace-nowrap">
            Sethi Transfer
          </span>
        </div>
      </div>

      {/* Zone 2: Google Drive Centered Search Bar */}
      <div className="flex-1 max-w-2xl mx-auto hidden sm:block">
        <div className="relative flex items-center bg-[#F1F3F4] dark:bg-[#28292A] rounded-full px-4 py-2 border border-transparent focus-within:border-[#1A73E8] focus-within:bg-[#FFFFFF] dark:focus-within:bg-[#1E1F20] focus-within:shadow-md transition-all">
          <Search className="w-5 h-5 text-[#5F6368] dark:text-[#AEB0B3] shrink-0 mr-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search in files, documents, photos..."
            className="w-full bg-transparent border-none outline-none text-sm text-[#202124] dark:text-[#E3E3E3] placeholder-[#5F6368] dark:placeholder-[#AEB0B3]"
            aria-label="Search files"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="p-1 text-[#5F6368] hover:text-[#202124] dark:text-[#AEB0B3] dark:hover:text-[#E3E3E3]"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Inline Category Quick Filter */}
          <div className="hidden md:flex items-center gap-1 ml-2 border-l border-[#DADCE0] dark:border-[#444746] pl-2">
            <select
              value={selectedCategory}
              onChange={(e) => onSelectCategory(e.target.value)}
              className="bg-transparent text-xs font-medium text-[#5F6368] dark:text-[#AEB0B3] cursor-pointer outline-none hover:text-[#202124] dark:hover:text-[#E3E3E3]"
              aria-label="Filter by file type"
            >
              <option value="all">All Types</option>
              <option value="document">Documents</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
              <option value="archive">Archives</option>
            </select>
          </div>
        </div>
      </div>

      {/* Zone 3: Actions & Profile */}
      <div className="flex items-center gap-2 shrink-0">
        {/* System Diagnostics Trigger */}
        <button
          onClick={onOpenHealth}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-[#5F6368] dark:text-[#AEB0B3] hover:bg-[#F1F3F4] dark:hover:bg-[#28292A] transition-colors"
          title="System Connection Diagnostics"
          aria-label="System status"
        >
          {systemHealth?.database.connected && systemHealth?.storage.configured ? (
            <CheckCircle2 className="w-4 h-4 text-[#1E8E3E] dark:text-[#81C995]" />
          ) : (
            <Database className="w-4 h-4 text-[#1A73E8] dark:text-[#A8C7FA]" />
          )}
          <span className="hidden lg:inline">
            {systemHealth?.database.connected ? 'Atlas Connected' : 'Sandbox Store'}
          </span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 text-[#5F6368] dark:text-[#AEB0B3] hover:bg-[#F1F3F4] dark:hover:bg-[#28292A] rounded-full transition-colors"
          title={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
          aria-label="Toggle theme"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* User Account Button */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-[#1A73E8]/30 transition-all focus:outline-none"
              aria-label="User account menu"
            >
              <div className="w-8 h-8 rounded-full bg-[#1A73E8] text-white flex items-center justify-center font-medium text-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </button>

            {/* Profile Menu Dropdown */}
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-[#FFFFFF] dark:bg-[#1E1F20] rounded-2xl shadow-xl border border-[#DADCE0] dark:border-[#444746] py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 border-b border-[#DADCE0] dark:border-[#444746] mb-2">
                    <p className="text-sm font-semibold text-[#202124] dark:text-[#E3E3E3] truncate">{user.name}</p>
                    <p className="text-xs text-[#5F6368] dark:text-[#AEB0B3] truncate">{user.email}</p>
                  </div>

                  <div className="px-4 py-2 text-xs text-[#5F6368] dark:text-[#AEB0B3]">
                    Storage Used: {(user.storageUsed / (1024 * 1024)).toFixed(1)} MB / {(user.storageLimit / (1024 ** 3)).toFixed(1)} GB
                  </div>

                  <div className="border-t border-[#DADCE0] dark:border-[#444746] mt-2 pt-2">
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#D93025] dark:text-[#F28B82] hover:bg-[#F1F3F4] dark:hover:bg-[#28292A] transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out of Sethi Transfer
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1A73E8] hover:bg-[#1558B0] dark:bg-[#A8C7FA] dark:text-[#040C19] dark:hover:bg-[#8AB4F8] rounded-full transition-colors whitespace-nowrap shadow-sm"
          >
            <UserIcon className="w-4 h-4" />
            Sign in
          </button>
        )}
      </div>
    </header>
  );
}
