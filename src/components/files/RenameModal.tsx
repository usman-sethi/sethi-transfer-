import React, { useState, useEffect } from 'react';
import { X, Edit3 } from 'lucide-react';
import { FileItem } from '../../types';

interface RenameModalProps {
  file: FileItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRename: (file: FileItem, newName: string) => Promise<void>;
}

export function RenameModal({ file, isOpen, onClose, onRename }: RenameModalProps) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (file) {
      setName(file.displayName || file.originalName);
    }
  }, [file]);

  if (!isOpen || !file) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onRename(file, name.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-[#FFFFFF] dark:bg-[#1E1F20] rounded-2xl shadow-xl border border-[#DADCE0] dark:border-[#444746] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#202124] dark:text-[#E3E3E3] flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-[#1A73E8] dark:text-[#A8C7FA]" />
            Rename File
          </h3>
          <button onClick={onClose} className="p-1 text-[#5F6368] hover:text-[#202124] dark:text-[#AEB0B3] dark:hover:text-[#E3E3E3]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#DADCE0] dark:border-[#444746] bg-transparent text-[#202124] dark:text-[#E3E3E3] focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/20 outline-none mb-4"
            autoFocus
          />

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#5F6368] dark:text-[#AEB0B3] hover:bg-[#F1F3F4] dark:hover:bg-[#28292A] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#1A73E8] hover:bg-[#1558B0] dark:bg-[#A8C7FA] dark:text-[#040C19] dark:hover:bg-[#8AB4F8] rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Rename'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
