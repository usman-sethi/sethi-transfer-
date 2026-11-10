import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<any>;
  onRegister: (name: string, email: string, password: string) => Promise<any>;
}

export function AuthModal({ isOpen, onClose, onLogin, onRegister }: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!name.trim()) throw new Error('Please enter your full name.');
        await onRegister(name, email, password);
      } else {
        await onLogin(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#FFFFFF] dark:bg-[#1E1F20] rounded-3xl shadow-2xl border border-[#DADCE0] dark:border-[#444746] overflow-hidden p-6 md:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-[#5F6368] dark:text-[#AEB0B3] hover:bg-[#F1F3F4] dark:hover:bg-[#28292A] rounded-full transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Icon & Heading */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#1A73E8]/10 dark:bg-[#A8C7FA]/10 text-[#1A73E8] dark:text-[#A8C7FA] flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
              <path d="m8 17 4-4 4 4" />
              <path d="M12 13v9" />
            </svg>
          </div>
          <h2 className="font-display text-xl font-bold text-[#202124] dark:text-[#E3E3E3]">
            {isRegister ? 'Create your Sethi Transfer account' : 'Sign in to Sethi Transfer'}
          </h2>
          <p className="text-xs text-[#5F6368] dark:text-[#AEB0B3] mt-1">
            Access your private files across your mobile and desktop devices.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[#D93025]/10 border border-[#D93025]/20 text-[#D93025] dark:text-[#F28B82] text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-[#5F6368] dark:text-[#AEB0B3] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#5F6368] dark:text-[#AEB0B3] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DADCE0] dark:border-[#444746] bg-[#FFFFFF] dark:bg-[#28292A] text-sm text-[#202124] dark:text-[#E3E3E3] focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/20 outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#5F6368] dark:text-[#AEB0B3] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#5F6368] dark:text-[#AEB0B3] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DADCE0] dark:border-[#444746] bg-[#FFFFFF] dark:bg-[#28292A] text-sm text-[#202124] dark:text-[#E3E3E3] focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/20 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5F6368] dark:text-[#AEB0B3] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#5F6368] dark:text-[#AEB0B3] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DADCE0] dark:border-[#444746] bg-[#FFFFFF] dark:bg-[#28292A] text-sm text-[#202124] dark:text-[#E3E3E3] focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/20 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-[#1A73E8] hover:bg-[#1558B0] dark:bg-[#A8C7FA] dark:text-[#040C19] dark:hover:bg-[#8AB4F8] text-white font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
          </button>
        </form>

        {/* Switch mode */}
        <div className="mt-6 pt-4 border-t border-[#DADCE0] dark:border-[#444746] text-center">
          <p className="text-xs text-[#5F6368] dark:text-[#AEB0B3]">
            {isRegister ? 'Already have an account?' : "Don't have an account yet?"}{' '}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-[#1A73E8] dark:text-[#A8C7FA] font-semibold hover:underline"
            >
              {isRegister ? 'Sign in' : 'Create an account'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
