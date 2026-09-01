import { useState, useEffect } from 'react';
import { apiFetch } from '../api/client';

type AdminDashboardProps = {
  onLogout: () => void;
};

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
   
  // Game Control
  const [gameState, setGameState] = useState<{
    activeEventNumber: number;
    eventOpen: boolean;
  } | null>(null);
   
  // Sets
  const [sets, setSets] = useState<Array<{ id: string; name: string; teamCount: number }>>([]);
   
  // Teams
  const [teams, setTeams] = useState<Array<{
    id: string;
    teamName: string;
    setName: string | null;
    memberCount: number;
  }>>([]);
   
  // Progress
  const [progress, setProgress] = useState<Array<any>>([]);
   
  // Submissions
  const [submissions, setSubmissions] = useState<Array<any>>([]);
 
  useEffect(() => {
    loadAdminData();
  }, []);
 
  const loadAdminData = async () => {
    try {
      setLoading(true);
       
      // Fetch all data in parallel
      const [
        gameStateRes,
        setsRes,
        teamsRes,
        progressRes,
        submissionsRes
      ] = await Promise.all([
        apiFetch<{ gameState: { activeEventNumber: number; eventOpen: boolean } }>('/api/admin/state'),
        apiFetch<{ sets: Array<{ id: string; name: string; _count: { teams: number } }> }>('/api/admin/sets'),
        apiFetch<{ teams: Array<{ id: string; teamName: string; set: { name: string | null }; members: Array<any> }> }>('/api/admin/teams'),
        apiFetch<{ progress: Array<any> }>('/api/admin/progress'),
        apiFetch<{ submissions: Array<any> }>('/api/admin/submissions'),
      ]);
       
      setGameState(gameStateRes.gameState);
      setSets(
        setsRes.sets.map((s: any) => ({
          id: s.id,
          name: s.name,
          teamCount: s._count?.teams ?? s.teamCount ?? s.teams?.length ?? 0,
        }))
      );
      setTeams(
        teamsRes.teams.map((t: any) => ({
          id: t.id,
          teamName: t.teamName,
          setName: t.set?.name || null,
          memberCount: t.members?.length ?? t.memberCount ?? 0,
        }))
      );
      setProgress(progressRes.progress);
      setSubmissions(submissionsRes.submissions);
    } catch (err: any) {
      setError(err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };
 
  const handleGameStateChange = async () => {
    if (!gameState) return;
     
    try {
      await apiFetch('/api/admin/gamestate', {
        method: 'POST',
        body: JSON.stringify(gameState),
      });
      alert('Game state updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to update game state');
    }
  };
 
  const handleCreateSet = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get('name') as string;
     
    try {
      await apiFetch('/api/admin/sets', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      await loadAdminData();
      // Reset form
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      setError(err.message || 'Failed to create set');
    }
  };
 
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const teamName = formData.get('teamName') as string;
    const setId = formData.get('setId') || undefined;
     
    // Collect members (up to 4)
    const members: Array<{ name: string; registrationNumber: string }> = [];
    for (let i = 1; i <= 4; i++) {
      const name = formData.get(`memberName${i}`) as string;
      const regNum = formData.get(`memberReg${i}`) as string;
      if (name && regNum) {
        members.push({ name, registrationNumber: regNum });
      }
    }
     
    try {
      const res = await apiFetch('/api/admin/teams', {
        method: 'POST',
        body: JSON.stringify({ teamName, members, setId }),
      });
      alert(`Team created successfully!\nGenerated password: ${res.generatedPassword}\n\nPlease share this password with the team lead.`);
      await loadAdminData();
      // Reset form
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      setError(err.message || 'Failed to create team');
    }
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
 
  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0c10] text-slate-100 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl neu-flat flex items-center justify-center text-rose-500 border border-rose-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77-1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-black text-white">Error Loading Admin Panel</h1>
              <p className="text-sm text-slate-400">{error}</p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="neu-btn bg-[#1a1f2b] border border-white/10 text-white px-6 py-3 rounded-xl font-medium transition-all hover:bg-[#242c3e] active:scale-[0.98]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
 
  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-100">
      <header className="w-full max-w-6xl mx-auto px-4 py-4 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-white/5">
        <div className="flex items-center gap-3 select-none">
          <div className="w-11 h-11 rounded-2xl neu-flat flex items-center justify-center text-rose-500 border border-rose-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zm0 10c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-black text-white">Admin Dashboard</h1>
            <p className="text-[11px] font-extrabold tracking-widest text-rose-500 uppercase">PRODINNO · technoVIT</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onLogout}
            title="Log Out"
            className="neu-btn p-2.5 rounded-2xl text-slate-400 hover:text-rose-400 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4a6 6 0 100-12 6 6 0 000 12z" />
            </svg>
          </button>
        </div>
      </header>
 
      <main className="flex-1 flex flex-col justify-center max-w-6xl w-full mx-auto pb-10 px-2 sm:px-4 space-y-8">
        {/* Game Control */}
        <section className="bg-[#111423] rounded-2xl neu-flat p-6 space-y-5">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3M6 6l6 6m0 0L6 12m6-6V4m0 0H4a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2z" />
            </svg>
            Game Control
          </h2>
           
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Active Event</label>
              <div className="neu-input bg-[#1a1f2b] border border-white/10 rounded-xl px-4 py-3">
                <select
                  value={gameState?.activeEventNumber || 1}
                  onChange={(e) => setGameState(prev => ({ ...prev!, activeEventNumber: Number(e.target.value) }))}
                  className="w-full text-white bg-transparent border-none focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map(num => (
                    <option key={num} value={num}>Event {num}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Event Status</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-slate-300">
                  <input
                    type="checkbox"
                    checked={gameState?.eventOpen || false}
                    onChange={(e) => setGameState(prev => ({ ...prev!, eventOpen: e.target.checked }))}
                    className="h-4 w-4 text-rose-500 border-gray-300 rounded"
                  />
                  Event Open
                </label>
                <span className="px-3 py-1 rounded-full text-xs font-medium">
                  {gameState?.eventOpen ? 'OPEN' : 'CLOSED'}
                </span>
              </div>
            </div>
            
            <button
              onClick={handleGameStateChange}
              className="w-full neu-btn bg-[#1a1f2b] border border-white/10 text-white px-6 py-3 rounded-xl font-medium transition-all hover:bg-[#242c3e] active:scale-[0.98]"
            >
              Update Game State
            </button>
          </div>
        </section>
 
        {/* Team Set Management */}
        <section className="bg-[#111423] rounded-2xl neu-flat p-6 space-y-5">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.029 9-11.622 0-1.504-.133-2.954-.382-4.303z" />
            </svg>
            Team Set Management
          </h2>
           
          <div className="space-y-4">
            {/* Create Set Form */}
            <form onSubmit={handleCreateSet} className="space-y-4 bg-[#1a1f2b] rounded-xl p-4 border border-white/10">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Create New Set
              </h3>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">Set Name</label>
                <input
                  type="text"
                  name="name"
                  className="w-full bg-[#1a1f2b] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>
              
              <button type="submit" className="w-full neu-btn bg-[#1a1f2b] border border-white/10 text-white px-6 py-3 rounded-xl font-medium transition-all hover:bg-[#242c3e] active:scale-[0.98]">
                Create Set
              </button>
            </form>
            
             {/* Sets List */}
             {sets.length > 0 ? (
               <div>
                 <h3 className="text-base font-black text-white flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m2 0a9 9 0 11-18 0 9 9 0 1118 0z" />
                   </svg>
                   Existing Sets ({sets.length})
                 </h3>
                 <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm">
                     <thead>
                       <tr className="border-b border-white/10">
                         <th className="px-4 py-2 text-slate-400 font-medium">Set Name</th>
                         <th className="px-4 py-2 text-slate-400 font-medium">Teams</th>
                         <th className="px-4 py-2 text-slate-400 font-medium">Actions</th>
                       </tr>
                     </thead>
                     <tbody>
                       {sets.map(set => (
                         <tr key={set.id} className="border-t border-white/5 hover:bg-[#1a1f2b]/50 transition-colors">
                           <td className="px-4 py-3 text-white">{set.name}</td>
                           <td className="px-4 py-3 text-slate-300">{set.teamCount}/6</td>
                           <td className="px-4 py-3 space-x-2">
                             <button
                               onClick={() => {
                                 const newName = prompt('Enter new set name:', set.name);
                                 if (newName !== null && newName.trim() !== '') {
                                   apiFetch(`/api/admin/sets/${set.id}`, {
                                     method: 'PUT',
                                     body: JSON.stringify({ name: newName.trim() }),
                                   })
                                     .then(loadAdminData)
                                     .catch(() => alert('Failed to update set'));
                                 }
                               }}
                               className="neu-btn px-3 py-1 rounded text-xs font-medium bg-[#1a1f2b] border border-white/10 text-white hover:bg-[#242c3e] active:scale-[0.98]"
                             >
                               Rename
                             </button>
                             <button
                               onClick={() => {
                                 if (confirm(`Are you sure you want to delete "${set.name}"? This will also remove team assignments.`)) {
                                   apiFetch(`/api/admin/sets/${set.id}`, {
                                     method: 'DELETE',
                                   })
                                     .then(loadAdminData)
                                     .catch(() => alert('Failed to delete set'));
                                 }
                               }}
                               className="neu-btn px-3 py-1 rounded text-xs font-medium bg-[#1a1f2b] border border-white/10 text-white hover:bg-[#242c3e] active:scale-[0.98]"
                             >
                               Delete
                             </button>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>
             ) : (
               <p className="text-center text-slate-400 py-8">No sets created yet. Create your first set above.</p>
             )}
          </div>
        </section>
 
        {/* Team Management */}
        <section className="bg-[#111423] rounded-2xl neu-flat p-6 space-y-5">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 18v-3a3 3 0 00-3-3H8a3 3 0 00-3 3v3m4 7h14M6 10h12" />
            </svg>
            Team Management
          </h2>
           
          <div className="space-y-4">
            {/* Create Team Form */}
            <form onSubmit={handleCreateTeam} className="space-y-4 bg-[#1a1f2b] rounded-xl p-4 border border-white/10">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Create New Team
              </h3>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">Team Name</label>
                <input
                  type="text"
                  name="teamName"
                  className="w-full bg-[#1a1f2b] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>
              
              {sets.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">Assign to Set (Optional)</label>
                  <select name="setId" className="w-full bg-[#1a1f2b] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent">
                    <option value="">No Set (Independent)</option>
                    {sets.map(set => (
                      <option key={set.id} value={set.id}>{set.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Member Fields */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.654-.126-1.283-.356-1.857M7 20v-2c0-.654.126-1.283.356-1.857m0 0a2.01 2.01 0 00-.707-2.943M12 3v2m0 9.414a4.962 4.962 0 00-3.476 1.412" />
                  </svg>
                  Team Members (Member 1 = Team Lead)
                </h4>
                <p className="text-xs text-slate-400">Member 1 is automatically the Team Lead. Password will be generated as: teamname_last4digits of lead member's registration number.</p>
                
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                      <span className="w-3 h-3 rounded bg-rose-500/20 flex items-center justify-center text-xs font-medium text-rose-500">
                        {i}
                      </span>
                      Member {i}{i === 1 ? ' (Team Lead)' : ''}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-slate-300">Name</label>
                        <input
                          type="text"
                          name={`memberName${i}`}
                          className="w-full bg-[#1a1f2b] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                          placeholder="Full name"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-slate-300">Registration Number</label>
                        <input
                          type="text"
                          name={`memberReg${i}`}
                          className="w-full bg-[#1a1f2b] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                          placeholder="e.g., 24BCE1793"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button type="submit" className="w-full neu-btn bg-[#1a1f2b] border border-white/10 text-white px-6 py-3 rounded-xl font-medium transition-all hover:bg-[#242c3e] active:scale-[0.98]">
                Create Team
              </button>
            </form>
            
                        {/* Teams List */}
            {teams.length > 0 ? (
              <>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-rose-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Teams ({teams.length})
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-4 py-2 text-slate-400 font-medium">
                          Team Name
                        </th>
                        <th className="px-4 py-2 text-slate-400 font-medium">
                          Set
                        </th>
                        <th className="px-4 py-2 text-slate-400 font-medium">
                          Members
                        </th>
                        <th className="px-4 py-2 text-slate-400 font-medium">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {teams.map((team) => (
                        <tr
                          key={team.id}
                          className="border-t border-white/5 hover:bg-[#1a1f2b]/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-white">
                            {team.teamName}
                          </td>

                          <td className="px-4 py-3 text-slate-300">
                            {team.setName || 'Independent'}
                          </td>

                          <td className="px-4 py-3 text-slate-300">
                            {team.memberCount}/4
                          </td>

                          <td className="px-4 py-3 space-x-2">
                            <button
                              onClick={() => {
                                const newName = prompt(
                                  'Enter new team name:',
                                  team.teamName
                                );

                                if (
                                  newName !== null &&
                                  newName.trim() !== ''
                                ) {
                                  apiFetch(`/api/admin/teams/${team.id}`, {
                                    method: 'PUT',
                                    body: JSON.stringify({
                                      teamName: newName.trim(),
                                    }),
                                  })
                                    .then(loadAdminData)
                                    .catch(() => alert('Failed to update team'));
                                }
                              }}
                              className="neu-btn px-3 py-1 rounded text-xs font-medium bg-[#1a1f2b] border border-white/10 text-white hover:bg-[#242c3e] active:scale-[0.98]"
                            >
                              Rename
                            </button>

                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `Are you sure you want to delete "${team.teamName}"?`
                                  )
                                ) {
                                  apiFetch(`/api/admin/teams/${team.id}`, {
                                    method: 'DELETE',
                                  })
                                    .then(loadAdminData)
                                    .catch(() => alert('Failed to delete team'));
                                }
                              }}
                              className="neu-btn px-3 py-1 rounded text-xs font-medium bg-[#1a1f2b] border border-white/10 text-white hover:bg-[#242c3e] active:scale-[0.98]"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="text-center text-slate-400 py-8">
                No teams created yet. Create your first team above.
              </p>
            )}
          </div>
        </section>

        {/* Team Progress */}
          <section className="bg-[#111423] rounded-2xl neu-flat p-6 space-y-5">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m2 0a9 9 0 11-18 0 9 9 0 1118 0z" />
              </svg>
              Team Event Progress
            </h2>
           
            {progress.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-4 py-2 text-slate-400 font-medium">Team</th>
                      <th className="px-4 py-2 text-slate-400 font-medium">Set</th>
                      <th className="px-4 py-2 text-slate-400 font-medium">Event</th>
                      <th className="px-4 py-2 text-slate-400 font-medium">Status</th>
                      <th className="px-4 py-2 text-slate-400 font-medium">Score</th>
                      <th className="px-4 py-2 text-slate-400 font-medium">Placement</th>
                      <th className="px-4 py-2 text-slate-400 font-medium">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progress.map(p => (
                      <tr key={p.id} className="border-t border-white/5 hover:bg-[#1a1f2b]/50 transition-colors">
                        <td className="px-4 py-3 text-white">{p.team?.teamName || 'Unknown'}</td>
                        <td className="px-4 py-3 text-slate-300">{p.team?.set?.name || 'Independent'}</td>
                        <td className="px-4 py-3 text-slate-300">{p.eventNumber}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            p.status === 'ACTIVE' ? 'bg-blue-900/20 text-blue-400' :
                            p.status === 'COMPLETED' ? 'bg-green-900/20 text-green-400' :
                            'bg-rose-900/20 text-rose-400'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{p.score || 0}</td>
                        <td className="px-4 py-3 text-slate-300">{p.completionNumber || '-'}</td>
                        <td className="px-4 py-3 text-slate-300">
                          {p.submittedAt ? new Date(p.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-slate-400 py-8">No event progress recorded yet.</p>
            )}
          </section>
 
          {/* Submissions */}
          <section className="bg-[#111423] rounded-2xl neu-flat p-6 space-y-5">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3M6 6l6 6m0 0L6 12m6-6V4m0 0H4a2 2 0 00-2 2v10a2 2 0 002-2V6a2 2 0 002-2z" />
              </svg>
              Event Submissions
            </h2>
           
            {submissions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-4 py-2 text-slate-400 font-medium">Team</th>
                      <th className="px-4 py-2 text-slate-400 font-medium">Event</th>
                      <th className="px-4 py-2 text-slate-400 font-medium">Submission URL</th>
                      <th className="px-4 py-2 text-slate-400 font-medium">Verification</th>
                      <th className="px-4 py-2 text-slate-400 font-medium">Submitted</th>
                      <th className="px-4 py-2 text-slate-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map(s => (
                      <tr key={s.id} className="border-t border-white/5 hover:bg-[#1a1f2b]/50 transition-colors">
                        <td className="px-4 py-3 text-white">{s.team?.teamName || 'Unknown'}</td>
                        <td className="px-4 py-3 text-slate-300">{s.eventNumber}</td>
                        <td className="px-4 py-3">
                          {s.submissionBlobUrl ? (
                            <div className="space-y-1">
                              <a
                                href={s.submissionBlobUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-400 hover:text-blue-300 underline"
                              >
                                View Screenshot
                              </a>

                              <p className="text-xs text-slate-400 truncate max-w-[200px]">
                                {s.submissionBlobUrl}
                              </p>
                            </div>
                            ) : (
                            <span className="text-slate-400">No submission</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            s.verificationStatus === 'PENDING' ? 'bg-yellow-900/20 text-yellow-400' :
                            s.verificationStatus === 'VERIFIED' ? 'bg-green-900/20 text-green-400' :
                            s.verificationStatus === 'REJECTED' ? 'bg-rose-900/20 text-rose-400' :
                            'bg-slate-900/20 text-slate-400'
                          }`}>
                            {s.verificationStatus || 'PENDING'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {s.submittedAt ? new Date(s.submittedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="px-4 py-3 space-x-2">
                 {s.eventNumber === 1 && (
                   <div>
                     <button
                       onClick={() => {
                         const newStatus = prompt('Enter verification status (PENDING, VERIFIED, REJECTED):', s.verificationStatus);
                         if (newStatus && ['PENDING', 'VERIFIED', 'REJECTED'].includes(newStatus)) {
                           apiFetch(`/api/admin/submissions/${s.id}/verification`, {
                             method: 'PATCH',
                             body: JSON.stringify({ verificationStatus: newStatus }),
                           })
                             .then(loadAdminData)
                             .catch(() => alert('Failed to update verification status'));
                         }
                       }}
                       className="neu-btn px-3 py-1 rounded text-xs font-medium bg-[#1a1f2b] border border-white/10 text-white hover:bg-[#242c3e] active:scale-[0.98]"
                     >
                       Update Verification
                     </button>
                   </div>
                 )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-slate-400 py-8">No submissions recorded yet.</p>
            )}
          </section>
        </main>
 
        <footer className="w-full py-4 text-center text-xs font-bold tracking-wider text-slate-500 uppercase">
          PRODINNO · technoVIT · VIT CHENNAI — INNOVATE TO ESCAPE
        </footer>
      </div>
  );
}