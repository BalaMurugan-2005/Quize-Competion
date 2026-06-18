import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { Navbar } from '../../components/Navbar';
import { 
  Users, Layers, Award, Play, Square, Settings, FileSpreadsheet,
  ChevronRight, RefreshCw, BarChart2, BookOpen, FileText, Trophy, RotateCcw
} from 'lucide-react';

export const AdminDashboard = () => {
  const { addToast } = useToast();
  const [stats, setStats] = useState({
    totalParticipants: 0,
    rounds: []
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // stores roundId of ongoing start/end request
  const [duration, setDuration] = useState(30); // minutes for round timer

  const fetchDashboardStats = async () => {
    try {
      // Get all rounds details
      const roundRes = await API.get('current-round/');
      
      // Load all participants to count them
      // Note: We can make a lightweight backend stat query or just list submissions/results
      // Let's count unique users or get submissions
      const subRes = await API.get('admin/submissions/');
      const uniqueParticipants = new Set(subRes.data.map(s => s.user_details.id)).size;

      setStats({
        totalParticipants: uniqueParticipants || 0,
        rounds: roundRes.data.rounds
      });
    } catch (err) {
      addToast('Failed to load admin stats.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const handleStartRound = async (roundId) => {
    setActionLoading(`start-${roundId}`);
    try {
      const res = await API.post('admin/start-round/', {
        round_id: roundId,
        duration_minutes: duration
      });
      addToast(res.data.message || 'Round started successfully.', 'success');
      fetchDashboardStats();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to start round.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEndRound = async (roundId) => {
    if (!window.confirm('Are you sure you want to end this round? Unsubmitted answers will be auto-scored.')) {
      return;
    }
    setActionLoading(`end-${roundId}`);
    try {
      const res = await API.post('admin/end-round/', {
        round_id: roundId
      });
      addToast(res.data.message || 'Round ended successfully.', 'success');
      fetchDashboardStats();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to end round.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportExcel = async () => {
    try {
      addToast('Preparing Excel sheet for download...', 'info');
      const response = await API.get('admin/export-excel/', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Quiz_Competition_Data.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      addToast('Data exported successfully!', 'success');
    } catch (err) {
      addToast('Excel export failed.', 'error');
    }
  };

  const [resetting, setResetting] = useState(false);

  const handleResetCompetition = async () => {
    if (!window.confirm('WARNING: Are you sure you want to completely reset the competition? This will permanently delete all student submissions, results, and winner records, and reset all rounds to Not Started. This action cannot be undone.')) {
      return;
    }
    
    // Double confirmation to prevent accidental clicks
    const doubleCheck = window.prompt('Type "RESET" to confirm:');
    if (doubleCheck !== 'RESET') {
      addToast('Reset cancelled. Confirmation phrase did not match.', 'info');
      return;
    }

    setResetting(true);
    try {
      const res = await API.post('admin/reset-competition/');
      addToast(res.data.message || 'Competition reset successfully!', 'success');
      fetchDashboardStats();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to reset competition.', 'error');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020017] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-10 space-y-10">
        
        {/* Header Title with quick actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Admin Control Panel</h1>
            <p className="text-sm text-slate-400">Manage rounds, questions, submissions, scoring, and announce winners.</p>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={fetchDashboardStats}
              className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 transition"
              title="Refresh Dashboard"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/10 transition"
            >
              <FileSpreadsheet size={18} />
              <span>Export Competition Excel</span>
            </button>
            <button
              onClick={handleResetCompetition}
              disabled={resetting}
              className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold shadow-lg shadow-rose-500/10 transition"
            >
              <RotateCcw size={18} className={resetting ? 'animate-spin' : ''} />
              <span>Reset Competition</span>
            </button>
          </div>
        </div>

        {/* Quick Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Total Participants */}
          <div className="glass-premium p-6 rounded-2xl border border-white/10 flex items-center space-x-4">
            <div className="p-4 rounded-xl bg-purple-500/15 border border-purple-500/25 text-purple-400">
              <Users size={24} />
            </div>
            <div>
              <div className="text-slate-400 text-xs uppercase font-semibold">Total Participants</div>
              <div className="text-3xl font-extrabold text-white mt-0.5">{stats.totalParticipants} Users</div>
            </div>
          </div>

          {/* Card 2: Active Round status */}
          <div className="glass-premium p-6 rounded-2xl border border-white/10 flex items-center space-x-4">
            <div className="p-4 rounded-xl bg-pink-500/15 border border-pink-500/25 text-pink-400">
              <Layers size={24} />
            </div>
            <div>
              <div className="text-slate-400 text-xs uppercase font-semibold">Active Round Status</div>
              <div className="text-xl font-extrabold text-white mt-1">
                {stats.rounds.find(r => r.status === 'ACTIVE')?.name || 'No Active Rounds'}
              </div>
            </div>
          </div>

          {/* Card 3: Completion percentage */}
          <div className="glass-premium p-6 rounded-2xl border border-white/10 flex items-center space-x-4">
            <div className="p-4 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-400">
              <BarChart2 size={24} />
            </div>
            <div>
              <div className="text-slate-400 text-xs uppercase font-semibold">Total Rounds</div>
              <div className="text-xl font-extrabold text-white mt-1">
                {stats.rounds.filter(r => r.status === 'COMPLETED').length} / {stats.rounds.length} Finished
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links Menu */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            to="/admin/questions"
            className="glass p-5 rounded-2xl border border-white/5 hover:border-purple-500/40 flex items-center justify-between group transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="text-purple-400"><BookOpen size={20} /></div>
              <span className="font-semibold text-sm">Question Bank</span>
            </div>
            <ChevronRight size={16} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            to="/admin/submissions"
            className="glass p-5 rounded-2xl border border-white/5 hover:border-pink-500/40 flex items-center justify-between group transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="text-pink-400"><FileText size={20} /></div>
              <span className="font-semibold text-sm">Participant Submissions</span>
            </div>
            <ChevronRight size={16} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            to="/admin/leaderboard"
            className="glass p-5 rounded-2xl border border-white/5 hover:border-indigo-500/40 flex items-center justify-between group transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="text-indigo-400"><Award size={20} /></div>
              <span className="font-semibold text-sm">Qualify Leaderboard</span>
            </div>
            <ChevronRight size={16} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            to="/admin/winners"
            className="glass p-5 rounded-2xl border border-white/5 hover:border-amber-500/40 flex items-center justify-between group transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="text-amber-400"><Trophy size={20} /></div>
              <span className="font-semibold text-sm">Announce Winners</span>
            </div>
            <ChevronRight size={16} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Round controls board */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Active Round Controls</h2>
              <p className="text-sm text-slate-400">Trigger active timer, publish round exam, and close assessment window.</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Timer Limit (Mins):</span>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 30))}
                className="w-16 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-center text-sm font-bold text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {stats.rounds.map((round) => {
              const isNotStarted = round.status === 'NOT_STARTED';
              const isActive = round.status === 'ACTIVE';
              const isCompleted = round.status === 'COMPLETED';

              return (
                <div key={round.id} className="glass-premium p-6 rounded-2xl border border-white/10 space-y-6 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-white">{round.name}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        isCompleted ? 'bg-slate-500/20 text-slate-400 border border-white/10' :
                        'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      }`}>
                        {round.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Controls user visibility. Locked rounds cannot be solved by qualified students.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                    {/* Start Button */}
                    <button
                      disabled={isCompleted || isActive || actionLoading}
                      onClick={() => handleStartRound(round.id)}
                      className="flex items-center justify-center space-x-1.5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-20 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md transition"
                    >
                      <Play size={14} className="fill-white" />
                      <span>Start Round</span>
                    </button>

                    {/* End Button */}
                    <button
                      disabled={isCompleted || isNotStarted || actionLoading}
                      onClick={() => handleEndRound(round.id)}
                      className="flex items-center justify-center space-x-1.5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-20 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md transition"
                    >
                      <Square size={14} className="fill-white" />
                      <span>End Round</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
};
