import React from 'react';
import { X, CheckCircle2, AlertTriangle, Database, Cloud, ShieldCheck, Key, Server } from 'lucide-react';
import { SystemHealth } from '../../types';

interface ConfigStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  health: SystemHealth | null;
}

export function ConfigStatusModal({ isOpen, onClose, health }: ConfigStatusModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#FFFFFF] dark:bg-[#1E1F20] rounded-3xl shadow-2xl border border-[#DADCE0] dark:border-[#444746] overflow-hidden p-6 md:p-8 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-[#5F6368] dark:text-[#AEB0B3] hover:bg-[#F1F3F4] dark:hover:bg-[#28292A] rounded-full transition-colors"
          aria-label="Close diagnostics"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-[#1A73E8]/10 dark:bg-[#A8C7FA]/10 text-[#1A73E8] dark:text-[#A8C7FA] flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-[#202124] dark:text-[#E3E3E3]">
              System Diagnostics & Cloud Setup
            </h2>
            <p className="text-xs text-[#5F6368] dark:text-[#AEB0B3]">
              Sethi Transfer live backend and credential status
            </p>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Database Card */}
          <div className="p-4 rounded-2xl bg-[#F8FAFD] dark:bg-[#28292A] border border-[#DADCE0] dark:border-[#444746]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#1A73E8] dark:text-[#A8C7FA]" />
                <span className="text-xs font-semibold text-[#202124] dark:text-[#E3E3E3]">MongoDB Atlas</span>
              </div>
              {health?.database.connected ? (
                <span className="flex items-center gap-1 text-[11px] text-[#1E8E3E] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] text-[#F9AB00] font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" /> Local Fallback
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#5F6368] dark:text-[#AEB0B3]">
              {health?.database.connected
                ? `Connected to host: ${health.database.host}`
                : health?.database.error || 'Awaiting MONGODB_URI in .env secrets'}
            </p>
          </div>

          {/* Cloudinary Card */}
          <div className="p-4 rounded-2xl bg-[#F8FAFD] dark:bg-[#28292A] border border-[#DADCE0] dark:border-[#444746]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-[#1A73E8] dark:text-[#A8C7FA]" />
                <span className="text-xs font-semibold text-[#202124] dark:text-[#E3E3E3]">Cloudinary Storage</span>
              </div>
              {health?.storage.configured ? (
                <span className="flex items-center gap-1 text-[11px] text-[#1E8E3E] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Configured
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] text-[#F9AB00] font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" /> Local Buffer
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#5F6368] dark:text-[#AEB0B3]">
              {health?.storage.configured
                ? `Cloud: ${health.storage.cloudName}`
                : 'Awaiting CLOUDINARY_* API credentials in .env'}
            </p>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="border-t border-[#DADCE0] dark:border-[#444746] pt-5">
          <h3 className="text-xs font-semibold text-[#202124] dark:text-[#E3E3E3] mb-2 flex items-center gap-1.5">
            <Key className="w-4 h-4 text-[#1A73E8] dark:text-[#A8C7FA]" />
            Configuring Secrets (.env)
          </h3>
          <p className="text-xs text-[#5F6368] dark:text-[#AEB0B3] mb-3 leading-relaxed">
            To connect your live MongoDB Atlas cluster and Cloudinary bucket for production cross-device storage, define the following variables in your environment secrets:
          </p>

          <div className="bg-[#131314] text-[#E3E3E3] p-4 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto select-all">
            <p className="text-[#AEB0B3]"># MongoDB Atlas URI</p>
            <p>MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/sethi_transfer"</p>
            <p className="mt-2 text-[#AEB0B3]"># Cloudinary Credentials</p>
            <p>CLOUDINARY_CLOUD_NAME="your_cloud_name"</p>
            <p>CLOUDINARY_API_KEY="your_api_key"</p>
            <p>CLOUDINARY_API_SECRET="your_api_secret"</p>
            <p className="mt-2 text-[#AEB0B3]"># JWT Authentication Secrets</p>
            <p>JWT_ACCESS_SECRET="production_random_key_min_32_chars"</p>
            <p>JWT_REFRESH_SECRET="production_random_key_min_32_chars"</p>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-[#1A73E8]/10 text-[#1A73E8] dark:text-[#A8C7FA] text-xs flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              The application incorporates an enterprise zero-crash adapter: while external credentials are being populated, the full UI, registration, upload, streaming download, and preview pipelines remain fully testable and responsive.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
