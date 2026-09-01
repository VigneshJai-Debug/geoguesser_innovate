import React, { useState } from 'react';
import { KeyRound, Users, AlertCircle, Sparkles, Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !password.trim()) {
      setError('Please enter both team name and password.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await login(teamName.trim(), password.trim());
      if (!res.success) {
        setError(res.error || 'Invalid team name or password.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 animate-fade-in">
      {/* Brand Icon */}
      <div className="relative mb-6 group">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl neu-flat flex items-center justify-center text-rose-500 border border-rose-500/20 transition-transform duration-300 group-hover:scale-105">
          <ShieldAlert className="w-12 h-12 sm:w-14 sm:h-14 text-rose-500 stroke-[1.5]" />
        </div>
        <div className="absolute -bottom-1.5 -right-1.5 bg-rose-500/20 text-rose-400 p-2 rounded-xl neu-raised border border-rose-500/30">
          <Sparkles className="w-4 h-4 text-rose-400 animate-pulse" />
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 mb-3 rounded-full neu-pressed text-xs font-bold tracking-widest text-rose-400 uppercase border border-rose-500/20">
          PRODINNO · technoVIT 2026
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
          TEAM ACCESS
        </h1>
        <p className="text-slate-400 text-sm sm:text-base mt-1 font-medium">
          Enter your assigned team credentials to begin the escape room.
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md">
        <div className="neu-card p-6 sm:p-8 rounded-3xl border border-white/5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Team Name Input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black tracking-widest text-slate-300 uppercase flex items-center gap-1.5 px-1">
                <Users className="w-3.5 h-3.5 text-rose-500" />
                TEAM NAME
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => {
                  setTeamName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g. Team Alpha"
                className="w-full text-base font-bold text-white placeholder-slate-500 py-3.5 px-5 rounded-2xl neu-inset focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all bg-transparent"
                autoComplete="username"
                disabled={isSubmitting}
              />
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black tracking-widest text-slate-300 uppercase flex items-center gap-1.5 px-1">
                <KeyRound className="w-3.5 h-3.5 text-rose-500" />
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="••••••••"
                className="w-full text-base font-bold text-white placeholder-slate-500 py-3.5 px-5 rounded-2xl neu-inset focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all bg-transparent font-mono"
                autoComplete="current-password"
                disabled={isSubmitting}
              />
            </div>

            {/* Subtle Inline Error */}
            {error && (
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-rose-300 py-2.5 px-4 rounded-xl neu-pressed bg-rose-950/40 border border-rose-500/40 animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 stroke-[2.5]" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !teamName.trim() || !password.trim()}
              className={`neu-btn mt-2 py-4 rounded-2xl text-base font-black tracking-wider uppercase text-white flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 ${
                isSubmitting || !teamName.trim() || !password.trim()
                  ? 'opacity-40 cursor-not-allowed shadow-none'
                  : 'hover:text-rose-400 hover:border-rose-500/40 active:scale-95'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-rose-400" />
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                <span>ENTER ESCAPE ROOM</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
