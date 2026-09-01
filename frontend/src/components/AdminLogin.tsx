import { useState } from 'react';
import { apiFetch } from '../api/client';

type AdminLoginProps = {
  onLogin: () => void;
};

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await apiFetch('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      setSuccess(true);
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Invalid admin password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-100 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl neu-flat flex items-center justify-center text-rose-500 border border-rose-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zm0 10c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-black text-white">Admin Login</h1>
            <p className="text-sm text-slate-400">Organizer access only</p>
          </div>
        </div>

        {error && (
          <div className="w-full bg-rose-900/20 border border-rose-800/50 text-rose-400 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="w-full bg-green-900/20 border border-green-800/50 text-green-400 px-4 py-3 rounded-xl text-sm">
            Login successful! Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Admin Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full bg-[#1a1f2b] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              placeholder="Enter admin password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full neu-btn bg-[#1a1f2b] border border-white/10 text-white px-6 py-3 rounded-xl font-medium transition-all hover:bg-[#242c3e] active:scale-[0.98]"
          >
            {loading ? 'Logging in...' : 'Login as Admin'}
          </button>
        </form>

        <div className="text-xs text-slate-500">
          Contact organizer for admin credentials
        </div>
      </div>
    </div>
  );
}