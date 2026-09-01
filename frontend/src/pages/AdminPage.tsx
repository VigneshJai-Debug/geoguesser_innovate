import { useState, useEffect } from 'react';
import AdminLogin from '../components/AdminLogin';
import AdminDashboard from '../components/AdminDashboard';
import { apiFetch } from '../api/client';

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [teamSession, setTeamSession] = useState<boolean | null>(null); // null = unknown, true = team logged in, false = not team
  const [adminSession, setAdminSession] = useState<boolean | null>(null); // null = unknown, true = admin logged in, false = not admin

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setLoading(true);
    try {
      // Check team session
      const teamRes = await apiFetch('/api/auth/me');
      const isTeam = teamRes.authenticated !== false && !!teamRes.team;
      setTeamSession(isTeam);
    } catch (err) {
      setTeamSession(false);
    }

    try {
      // Check admin session
      await apiFetch('/api/admin/state');
      setAdminSession(true);
    } catch (err) {
      setAdminSession(false);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Team logout failed', err);
    }
    // After logging out team, re-check auth status
    checkAuthStatus();
  };

  const handleAdminLogin = () => {
    setAdminSession(true);
  };

  const handleAdminLogout = () => {
    // Logout admin and redirect to admin login
    apiFetch('/api/admin/logout', { method: 'POST' }).then(() => {
      setAdminSession(false);
      // Optionally redirect to admin login page
      window.location.href = '/admin';
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0c10] text-slate-100 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-3xl neu-flat flex items-center justify-center text-rose-500 mb-4 animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 animate-spin text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 8v4l4 4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="text-xs font-black tracking-widest text-slate-400 uppercase">LOADING ADMIN PANEL...</p>
      </div>
    );
  }

  // If user is logged in as a team, show logout prompt
  if (teamSession === true) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl neu-flat flex items-center justify-center text-rose-500 border border-rose-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-black text-white">You are logged in as a team</h1>
              <p className="text-sm text-slate-400">
                To access the admin panel, please log out from your team account first.
              </p>
            </div>
          </div>

          <button
            onClick={handleTeamLogout}
            className="w-full neu-btn bg-[#1a1f2b] border border-white/10 text-white px-6 py-3 rounded-xl font-medium transition-all hover:bg-[#242c3e] active:scale-[0.98]"
          >
            Log Out from Team
          </button>

          <p className="text-xs text-slate-500">
            After logging out, you will be redirected back to the admin login page.
          </p>
        </div>
      </div>
    );
  }

  // If admin session is active, show dashboard
  if (adminSession === true) {
    return (
      <div className="min-h-screen bg-[#0a0c10]">
        <AdminDashboard onLogout={handleAdminLogout} />
      </div>
    );
  }

  // Otherwise, show admin login form
  return (
    <div className="min-h-screen bg-[#0a0c10]">
      <AdminLogin onLogin={handleAdminLogin} />
    </div>
  );
}