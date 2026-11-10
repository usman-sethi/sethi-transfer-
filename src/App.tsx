/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  UploadCloud,
  LayoutGrid,
  List,
  ArrowUpDown,
  Filter,
  Plus,
  RefreshCw,
  FolderOpen,
  Star,
  Clock,
  Trash2,
  HardDrive,
  Shield,
  Smartphone,
  Laptop,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { api } from './services/api';
import {
  FileItem,
  ActiveTab,
  ViewMode,
  SortField,
  SortOrder,
  UploadQueueItem,
  StorageStats,
  SystemHealth,
} from './types';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { FileCard } from './components/files/FileCard';
import { FileListItem } from './components/files/FileListItem';
import { FilePreviewModal } from './components/files/FilePreviewModal';
import { RenameModal } from './components/files/RenameModal';
import { AuthModal } from './components/auth/AuthModal';
import { ConfigStatusModal } from './components/common/ConfigStatusModal';
import { UploadDropzone } from './components/files/UploadDropzone';
import { UploadProgressDrawer } from './components/files/UploadProgressDrawer';
import { StorageView } from './components/storage/StorageView';

export default function App() {
  const { user, loading: authLoading, isAuthenticated, login, register, logout, refreshUser } = useAuth();

  // Navigation & View state
  const [activeTab, setActiveTab] = useState<ActiveTab>('my-files');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // File collection state
  const [files, setFiles] = useState<FileItem[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [trashCount, setTrashCount] = useState(0);

  // Modals & Drawers state
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [renameTarget, setRenameTarget] = useState<FileItem | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'signin' | 'register'>('signin');
  const [healthModalOpen, setHealthModalOpen] = useState(false);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);

  // Upload Queue
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const activeUploadsRef = React.useRef<Map<string, () => void>>(new Map());

  // Dark mode
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
      );
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Fetch health check once on mount
  useEffect(() => {
    api.getHealth()
      .then(setSystemHealth)
      .catch((err) => console.warn('Health check error:', err));
  }, []);

  // Fetch file list based on active tab and filters
  const loadFiles = useCallback(async () => {
    if (!isAuthenticated) return;
    setFilesLoading(true);
    try {
      let isStarred: boolean | undefined = undefined;
      let isDeleted = false;

      if (activeTab === 'starred') isStarred = true;
      if (activeTab === 'trash') isDeleted = true;

      const [res, statsRes, trashRes] = await Promise.all([
        api.listFiles({
          category: selectedCategory,
          search: searchQuery,
          isStarred,
          isDeleted,
          sortBy: sortField,
          order: sortOrder,
        }),
        api.getStorageUsage().catch(() => null),
        api.listFiles({ isDeleted: true }).catch(() => ({ total: 0 })),
      ]);

      setFiles(res.files);
      if (statsRes) setStorageStats(statsRes);
      setTrashCount(trashRes.total);
    } catch (err: any) {
      console.error('Failed to load files:', err.message);
    } finally {
      setFilesLoading(false);
    }
  }, [isAuthenticated, activeTab, selectedCategory, searchQuery, sortField, sortOrder]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Upload handler
  const handleFilesSelected = useCallback(
    async (fileList: FileList | File[]) => {
      if (!isAuthenticated) {
        setAuthModalOpen(true);
        return;
      }

      const newItems: UploadQueueItem[] = Array.from(fileList).map((f) => ({
        id: Math.random().toString(36).substring(2, 9),
        file: f,
        name: f.name,
        size: f.size,
        progress: 0,
        status: 'pending',
      }));

      setUploadQueue((prev) => [...prev, ...newItems]);

      // Process each file sequentially/concurrently
      for (const item of newItems) {
        setUploadQueue((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: 'uploading' } : i))
        );

        const uploadController = api.uploadFileWithProgress(item.file, (percent) => {
          setUploadQueue((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, progress: percent } : i))
          );
        });

        activeUploadsRef.current.set(item.id, uploadController.cancel);

        try {
          await uploadController.promise;
          setUploadQueue((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, progress: 100, status: 'completed' } : i))
          );
          activeUploadsRef.current.delete(item.id);
        } catch (err: any) {
          setUploadQueue((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? { ...i, status: 'error', error: err.message || 'Upload failed' }
                : i
            )
          );
          activeUploadsRef.current.delete(item.id);
        }
      }

      // Refresh files list and storage quota
      loadFiles();
      refreshUser();
    },
    [isAuthenticated, loadFiles, refreshUser]
  );

  const handleCancelUpload = (id: string) => {
    const cancelFn = activeUploadsRef.current.get(id);
    if (cancelFn) cancelFn();
    setUploadQueue((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'cancelled' } : i))
    );
  };

  const handleClearCompletedUploads = () => {
    setUploadQueue((prev) => prev.filter((i) => i.status === 'uploading' || i.status === 'pending'));
  };

  const handleTriggerUpload = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    const input = document.getElementById('hidden-file-input') as HTMLInputElement;
    if (input) input.click();
  };

  // File action handlers
  const handleDownload = async (file: FileItem) => {
    try {
      await api.downloadFile(file);
    } catch (err: any) {
      alert(`Download error: ${err.message}`);
    }
  };

  const handleToggleStar = async (file: FileItem) => {
    try {
      const nextStarred = !file.isStarred;
      setFiles((prev) =>
        prev.map((f) => (f._id === file._id ? { ...f, isStarred: nextStarred } : f))
      );
      await api.updateFile(file._id, { isStarred: nextStarred });
    } catch {
      loadFiles();
    }
  };

  const handleDelete = async (file: FileItem) => {
    try {
      const permanent = file.isDeleted;
      setFiles((prev) => prev.filter((f) => f._id !== file._id));
      await api.deleteFile(file._id, permanent);
      loadFiles();
      refreshUser();
    } catch {
      loadFiles();
    }
  };

  const handleRestore = async (file: FileItem) => {
    try {
      setFiles((prev) => prev.filter((f) => f._id !== file._id));
      await api.restoreFile(file._id);
      loadFiles();
    } catch {
      loadFiles();
    }
  };

  const handleRename = async (file: FileItem, newName: string) => {
    try {
      await api.updateFile(file._id, { displayName: newName });
      loadFiles();
    } catch (err: any) {
      alert(`Rename error: ${err.message}`);
    }
  };

  // Header Title based on Active Tab
  const viewTitle = useMemo(() => {
    switch (activeTab) {
      case 'recent':
        return 'Recent Files';
      case 'starred':
        return 'Starred Files';
      case 'trash':
        return 'Trash';
      case 'storage':
        return 'Storage Management';
      default:
        return 'My Files';
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFD] dark:bg-[#131314] text-[#202124] dark:text-[#E3E3E3] transition-colors">
      {/* Top Navbar */}
      <Navbar
        user={user}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={logout}
        systemHealth={systemHealth}
        onOpenHealth={() => setHealthModalOpen(true)}
      />

      {/* Main Container */}
      <UploadDropzone onFilesSelected={handleFilesSelected}>
        <div className="flex-1 flex overflow-hidden">
          {isAuthenticated ? (
            <>
              {/* Desktop Left Sidebar */}
              <Sidebar
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                onTriggerUpload={handleTriggerUpload}
                user={user}
                storageStats={storageStats}
                trashCount={trashCount}
              />

              {/* Main Workspace Area */}
              <main className="flex-1 overflow-y-auto pb-24 md:pb-8 p-4 md:p-6 lg:p-8">
                {activeTab === 'storage' ? (
                  <StorageView stats={storageStats} />
                ) : (
                  <div className="max-w-7xl mx-auto">
                    {/* Viewport Header Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div>
                        <h1 className="font-display text-xl md:text-2xl font-bold tracking-tight text-[#202124] dark:text-[#E3E3E3]">
                          {viewTitle}
                        </h1>
                        <p className="text-xs text-[#5F6368] dark:text-[#AEB0B3] mt-0.5">
                          {files.length} item{files.length === 1 ? '' : 's'}
                          {searchQuery ? ` matching "${searchQuery}"` : ''}
                        </p>
                      </div>

                      {/* Controls: Category Filter, View Switch, Sort */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Category Segmented Filter Buttons */}
                        <div className="hidden lg:flex items-center gap-1 p-1 bg-[#FFFFFF] dark:bg-[#1E1F20] border border-[#DADCE0] dark:border-[#444746] rounded-xl shadow-2xs">
                          {['all', 'document', 'image', 'video', 'audio', 'archive'].map((cat) => (
                            <button
                              key={cat}
                              onClick={() => setSelectedCategory(cat)}
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors whitespace-nowrap ${
                                selectedCategory === cat
                                  ? 'bg-[#1A73E8] text-white dark:bg-[#A8C7FA] dark:text-[#040C19]'
                                  : 'text-[#5F6368] dark:text-[#AEB0B3] hover:text-[#202124] dark:hover:text-[#E3E3E3]'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>

                        {/* View Switch: Grid vs List */}
                        <div className="flex items-center p-1 bg-[#FFFFFF] dark:bg-[#1E1F20] border border-[#DADCE0] dark:border-[#444746] rounded-xl shadow-2xs">
                          <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-lg transition-colors ${
                              viewMode === 'grid'
                                ? 'bg-[#E8F0FE] text-[#1A73E8] dark:bg-[#004A77]/40 dark:text-[#A8C7FA]'
                                : 'text-[#5F6368] dark:text-[#AEB0B3] hover:text-[#202124] dark:hover:text-[#E3E3E3]'
                            }`}
                            title="Grid view"
                            aria-label="Grid view"
                          >
                            <LayoutGrid className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-lg transition-colors ${
                              viewMode === 'list'
                                ? 'bg-[#E8F0FE] text-[#1A73E8] dark:bg-[#004A77]/40 dark:text-[#A8C7FA]'
                                : 'text-[#5F6368] dark:text-[#AEB0B3] hover:text-[#202124] dark:hover:text-[#E3E3E3]'
                            }`}
                            title="List view"
                            aria-label="List view"
                          >
                            <List className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Sort Selector */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] dark:bg-[#1E1F20] border border-[#DADCE0] dark:border-[#444746] rounded-xl shadow-2xs text-xs text-[#5F6368] dark:text-[#AEB0B3]">
                          <ArrowUpDown className="w-3.5 h-3.5" />
                          <select
                            value={`${sortField}-${sortOrder}`}
                            onChange={(e) => {
                              const [f, o] = e.target.value.split('-');
                              setSortField(f as SortField);
                              setSortOrder(o as SortOrder);
                            }}
                            className="bg-transparent text-xs font-medium cursor-pointer outline-none text-[#202124] dark:text-[#E3E3E3]"
                            aria-label="Sort files"
                          >
                            <option value="createdAt-desc">Newest first</option>
                            <option value="createdAt-asc">Oldest first</option>
                            <option value="displayName-asc">Name (A-Z)</option>
                            <option value="displayName-desc">Name (Z-A)</option>
                            <option value="size-desc">Largest first</option>
                            <option value="size-asc">Smallest first</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Files Content / Empty States */}
                    {filesLoading ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {[...Array(8)].map((_, i) => (
                          <div
                            key={i}
                            className="h-44 rounded-2xl bg-[#FFFFFF] dark:bg-[#1E1F20] border border-[#DADCE0] dark:border-[#444746] animate-pulse"
                          />
                        ))}
                      </div>
                    ) : files.length === 0 ? (
                      /* Pristine Empty State */
                      <div className="py-16 px-6 text-center border-2 border-dashed border-[#DADCE0] dark:border-[#444746] rounded-3xl bg-[#FFFFFF]/60 dark:bg-[#1E1F20]/60 max-w-2xl mx-auto my-8">
                        <div className="w-16 h-16 rounded-full bg-[#1A73E8]/10 dark:bg-[#A8C7FA]/10 text-[#1A73E8] dark:text-[#A8C7FA] flex items-center justify-center mx-auto mb-4">
                          <UploadCloud className="w-8 h-8" />
                        </div>
                        <h3 className="font-display font-semibold text-base md:text-lg text-[#202124] dark:text-[#E3E3E3] mb-1">
                          {searchQuery
                            ? 'No matching files found'
                            : activeTab === 'starred'
                            ? 'No starred files yet'
                            : activeTab === 'trash'
                            ? 'Trash is empty'
                            : 'No files uploaded yet'}
                        </h3>
                        <p className="text-xs text-[#5F6368] dark:text-[#AEB0B3] max-w-sm mx-auto mb-6">
                          {searchQuery
                            ? 'Try refining your search terms or clearing the category filter.'
                            : activeTab === 'starred'
                            ? 'Click the star icon on any document or photo to pin it here.'
                            : activeTab === 'trash'
                            ? 'Items moved to trash will appear here for 30 days.'
                            : 'Drag and drop files anywhere, or click below to upload documents, presentations, videos, and photos.'}
                        </p>
                        {activeTab !== 'trash' && (
                          <button
                            onClick={handleTriggerUpload}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A73E8] hover:bg-[#1558B0] dark:bg-[#A8C7FA] dark:text-[#040C19] dark:hover:bg-[#8AB4F8] text-white font-semibold rounded-full text-xs shadow-sm transition-all"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Upload Files</span>
                          </button>
                        )}
                      </div>
                    ) : viewMode === 'grid' ? (
                      /* Grid View */
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 md:gap-4">
                        {files.map((file) => (
                          <FileCard
                            key={file._id}
                            file={file}
                            onPreview={setPreviewFile}
                            onDownload={handleDownload}
                            onToggleStar={handleToggleStar}
                            onDelete={handleDelete}
                            onRestore={handleRestore}
                            onRename={setRenameTarget}
                          />
                        ))}
                      </div>
                    ) : (
                      /* List View Table */
                      <div className="bg-[#FFFFFF] dark:bg-[#1E1F20] rounded-2xl border border-[#DADCE0] dark:border-[#444746] shadow-2xs overflow-hidden">
                        {/* Table Header */}
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#DADCE0] dark:border-[#444746] text-xs font-semibold text-[#5F6368] dark:text-[#AEB0B3] bg-[#F8FAFD] dark:bg-[#28292A]">
                          <span className="flex-1 pr-4">Name</span>
                          <span className="hidden md:block w-28">Category</span>
                          <span className="hidden sm:block w-32">Date Modified</span>
                          <span className="w-20 text-right">Size</span>
                          <span className="w-16 ml-4 text-center">Actions</span>
                        </div>

                        {/* Rows */}
                        <div className="divide-y divide-[#DADCE0]/40 dark:divide-[#444746]/40">
                          {files.map((file) => (
                            <FileListItem
                              key={file._id}
                              file={file}
                              onPreview={setPreviewFile}
                              onDownload={handleDownload}
                              onToggleStar={handleToggleStar}
                              onDelete={handleDelete}
                              onRestore={handleRestore}
                              onRename={setRenameTarget}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </main>

              {/* Mobile Bottom Navigation */}
              <MobileNav
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                onTriggerUpload={handleTriggerUpload}
              />
            </>
          ) : (
            /* Unauthenticated Clean Landing / Hero */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto my-auto animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-3xl bg-[#1A73E8]/10 dark:bg-[#A8C7FA]/10 text-[#1A73E8] dark:text-[#A8C7FA] flex items-center justify-center mb-6 shadow-sm">
                <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                  <path d="m8 17 4-4 4 4" />
                  <path d="M12 13v9" />
                </svg>
              </div>

              <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-[#202124] dark:text-[#E3E3E3] max-w-2xl mb-4 text-balance">
                Instant Personal File Transfer Across Your Devices
              </h1>

              <p className="text-sm md:text-base text-[#5F6368] dark:text-[#AEB0B3] max-w-xl mb-8 leading-relaxed">
                Eliminate sending documents through WhatsApp, Telegram, or cables. Open Sethi Transfer on your phone, upload any file, and download original quality on your laptop immediately.
              </p>

              {/* Cross-Device Flow Demonstration */}
              <div className="flex items-center justify-center gap-3 md:gap-6 mb-10 w-full max-w-lg">
                <div className="flex-1 p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#1E1F20] border border-[#DADCE0] dark:border-[#444746] shadow-xs flex flex-col items-center">
                  <Smartphone className="w-6 h-6 text-[#1A73E8] dark:text-[#A8C7FA] mb-2" />
                  <span className="text-xs font-semibold text-[#202124] dark:text-[#E3E3E3]">Mobile Phone</span>
                  <span className="text-[11px] text-[#5F6368] dark:text-[#AEB0B3]">Upload on the go</span>
                </div>

                <div className="flex flex-col items-center text-[#5F6368] dark:text-[#AEB0B3]">
                  <ArrowRight className="w-5 h-5 text-[#1A73E8] dark:text-[#A8C7FA]" />
                  <span className="text-[10px] font-mono mt-1">Cloud Sync</span>
                </div>

                <div className="flex-1 p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#1E1F20] border border-[#DADCE0] dark:border-[#444746] shadow-xs flex flex-col items-center">
                  <Laptop className="w-6 h-6 text-[#1A73E8] dark:text-[#A8C7FA] mb-2" />
                  <span className="text-xs font-semibold text-[#202124] dark:text-[#E3E3E3]">Laptop / PC</span>
                  <span className="text-[11px] text-[#5F6368] dark:text-[#AEB0B3]">Preview & Download</span>
                </div>
              </div>

              {/* Primary Call to Action */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="w-full sm:w-auto px-7 py-3 bg-[#1A73E8] hover:bg-[#1558B0] dark:bg-[#A8C7FA] dark:text-[#040C19] dark:hover:bg-[#8AB4F8] text-white font-semibold rounded-full text-sm shadow-md transition-all active:scale-[0.98]"
                >
                  Get Started with Sethi Transfer
                </button>

                <button
                  onClick={() => setHealthModalOpen(true)}
                  className="w-full sm:w-auto px-5 py-3 text-xs font-medium text-[#5F6368] dark:text-[#AEB0B3] hover:text-[#202124] dark:hover:text-[#E3E3E3] transition-colors"
                >
                  View System Architecture
                </button>
              </div>
            </div>
          )}
        </div>
      </UploadDropzone>

      {/* Floating Upload Progress Drawer */}
      <UploadProgressDrawer
        queue={uploadQueue}
        onCancelItem={handleCancelUpload}
        onClearCompleted={handleClearCompletedUploads}
      />

      {/* Modals */}
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onDownload={handleDownload}
        onToggleStar={handleToggleStar}
      />

      <RenameModal
        file={renameTarget}
        isOpen={Boolean(renameTarget)}
        onClose={() => setRenameTarget(null)}
        onRename={handleRename}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLogin={login}
        onRegister={register}
      />

      <ConfigStatusModal
        isOpen={healthModalOpen}
        onClose={() => setHealthModalOpen(false)}
        health={systemHealth}
      />
    </div>
  );
}
