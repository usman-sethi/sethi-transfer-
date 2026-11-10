import React from 'react';
import {
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Archive,
  FileCode,
  FileSpreadsheet,
  Presentation,
  File as GenericFile,
} from 'lucide-react';
import { FileCategory } from '../../types';

interface FileTypeIconProps {
  category: FileCategory;
  extension?: string;
  className?: string;
}

export function FileTypeIcon({ category, extension = '', className = 'w-6 h-6' }: FileTypeIconProps) {
  const ext = extension.toLowerCase();

  if (ext === '.pdf') {
    return <FileText className={`${className} text-[#EA4335]`} aria-label="PDF Document" />;
  }
  if (['.doc', '.docx'].includes(ext)) {
    return <FileText className={`${className} text-[#4285F4]`} aria-label="Word Document" />;
  }
  if (['.xls', '.xlsx', '.csv'].includes(ext)) {
    return <FileSpreadsheet className={`${className} text-[#0F9D58]`} aria-label="Spreadsheet" />;
  }
  if (['.ppt', '.pptx'].includes(ext)) {
    return <Presentation className={`${className} text-[#F4B400]`} aria-label="Presentation" />;
  }
  if (['.js', '.ts', '.tsx', '.jsx', '.json', '.html', '.css', '.py'].includes(ext)) {
    return <FileCode className={`${className} text-[#AB47BC]`} aria-label="Code File" />;
  }

  switch (category) {
    case 'image':
      return <ImageIcon className={`${className} text-[#EA4335]`} aria-label="Image File" />;
    case 'video':
      return <Film className={`${className} text-[#EA4335]`} aria-label="Video File" />;
    case 'audio':
      return <Music className={`${className} text-[#FBBC04]`} aria-label="Audio File" />;
    case 'archive':
      return <Archive className={`${className} text-[#7B1FA2]`} aria-label="Archive File" />;
    case 'document':
      return <FileText className={`${className} text-[#4285F4]`} aria-label="Document" />;
    default:
      return <GenericFile className={`${className} text-[#5F6368] dark:text-[#AEB0B3]`} aria-label="File" />;
  }
}
