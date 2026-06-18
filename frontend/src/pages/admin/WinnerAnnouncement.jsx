import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { Navbar } from '../../components/Navbar';
import { ArrowLeft, RefreshCw, Trophy, Sparkles, User, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export const WinnerAnnouncement = () => {
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [winners, setWinners] = useState({
    1: null, // First position
    2: null, // Second position
    3: null  // Third position
  });
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const fetchData = async () => {
    try {
      // Load all participants to populate selections
      const userRes = await API.get('current-round/');
      // Load existing announced winners
      const winRes = await API.get('winners/');

      // Fetch all non-staff users by mapping submissions or custom endpoint
      // Let's retrieve students from submissions or default options
      // To get a list of eligible winners, we can check the participants/users
      // We can also fetch the final round leaderboard! The final round leaderboard is the perfect source of eligible winners.
      // Final round has id = 3.
      const lbRes = await API.get('leaderboard/?round_id=3');
      setUsers(lbRes.data.map(item => item.user_details));

      // Set current winners from backend data
      const winMap = { 1: null, 2: null, 3: null };
      winRes.data.forEach(w => {
        winMap[w.position] = w.user;
      });
      setWinners(winMap);

      if (winRes.data.length > 0) {
        setIsLive(true);
      }
    } catch (err) {
      addToast('Failed to fetch eligible winner candidates.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (isLive) {
      triggerConfettiGlow();
    }
  }, [isLive]);

  const triggerConfettiGlow = () => {
    // School-rally colorful confetti explosion!
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      // since particles fall down, animate a bit higher than random
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const handleSelectWinner = (position, userId) => {
    setWinners({
      ...winners,
      [position]: userId ? parseInt(userId) : null
    });
  };

  const handleAnnounceWinners = async () => {
    if (!winners[1] && !winners[2] && !winners[3]) {
      addToast('Please assign at least one prize position.', 'warning');
      return;
    }
    setPublishing(true);
    try {
      const winnersPayload = [];
      if (winners[1]) winnersPayload.push({ position: 1, user_id: winners[1] });
      if (winners[2]) winnersPayload.push({ position: 2, user_id: winners[2] });
      if (winners[3]) winnersPayload.push({ position: 3, user_id: winners[3] });

      await API.post('winners/', { winners: winnersPayload });
      addToast('Winners announced successfully!', 'success');
      setIsLive(true);
    } catch (err) {
      addToast('Failed to publish winners announcement.', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const handleReset = () => {
    setIsLive(false);
    setWinners({ 1: null, 2: null, 3: null });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020017] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  // Find user details by id helper
  const getUserDetails = (id) => {
    return users.find(u => u.id === id);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <Navbar />

      {/* Confetti backdrop effects when live */}
      {isLive && (
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-t from-[#020017] via-[#0b0322]/40 to-[#020017] pointer-events-none"></div>
      )}

      <main className="flex-grow max-w-5xl mx-auto w-full px-6 py-10 space-y-12 z-10">
        
        {/* Back navigation */}
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>

        {/* Podium / Showcase Mode */}
        {isLive ? (
          <div className="space-y-12 text-center animate-fade-in">
            {/* Header */}
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 font-bold text-xs tracking-wider uppercase animate-pulse">
                <Sparkles size={14} />
                <span>Live Announcement Board</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
                Grand Finale Winners!
              </h1>
              <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto">
                Congratulations to all victors of the Annual College Hackfest Quiz.
              </p>
            </div>

            {/* Podium Graphics */}
            <div className="flex flex-col md:flex-row justify-center items-end gap-6 md:gap-0 pt-16 max-w-3xl mx-auto">
              
              {/* Position 2 (Left) */}
              <div className="w-full md:w-1/3 flex flex-col items-center order-2 md:order-1">
                {winners[2] && getUserDetails(winners[2]) ? (
                  <div className="space-y-4 text-center pb-4 animate-slide-up [animation-delay:0.3s]">
                    <div className="w-16 h-16 rounded-full bg-slate-500/20 border border-slate-500/40 flex items-center justify-center text-slate-300 font-bold text-2xl mx-auto">
                      2nd
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white">{getUserDetails(winners[2]).name}</h3>
                      <p className="text-xs text-slate-400 font-semibold">{getUserDetails(winners[2]).register_no} ({getUserDetails(winners[2]).department})</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-16"></div>
                )}
                {/* Podium bar */}
                <div className="w-full h-32 bg-gradient-to-t from-slate-950 to-slate-800 border-t border-slate-700/50 rounded-t-2xl flex items-center justify-center">
                  <span className="text-2xl font-black text-slate-500">🥈 SECOND</span>
                </div>
              </div>

              {/* Position 1 (Center - Raised High) */}
              <div className="w-full md:w-1/3 flex flex-col items-center order-1 md:order-2">
                {winners[1] && getUserDetails(winners[1]) ? (
                  <div className="space-y-4 text-center pb-6 animate-slide-up">
                    <Trophy size={48} className="text-yellow-400 mx-auto animate-bounce" />
                    <div>
                      <h3 className="font-extrabold text-2xl text-yellow-300">{getUserDetails(winners[1]).name}</h3>
                      <p className="text-xs text-slate-300 font-bold">{getUserDetails(winners[1]).register_no} ({getUserDetails(winners[1]).department})</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-24"></div>
                )}
                {/* Podium bar */}
                <div className="w-full h-44 bg-gradient-to-t from-yellow-950 to-yellow-800 border-t-2 border-yellow-500/50 rounded-t-2xl flex items-center justify-center shadow-2xl shadow-yellow-500/5">
                  <span className="text-3xl font-black text-yellow-400">🥇 CHAMPION</span>
                </div>
              </div>

              {/* Position 3 (Right) */}
              <div className="w-full md:w-1/3 flex flex-col items-center order-3 md:order-3">
                {winners[3] && getUserDetails(winners[3]) ? (
                  <div className="space-y-4 text-center pb-4 animate-slide-up [animation-delay:0.5s]">
                    <div className="w-16 h-16 rounded-full bg-amber-600/20 border border-amber-600/40 flex items-center justify-center text-amber-500 font-bold text-2xl mx-auto">
                      3rd
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white">{getUserDetails(winners[3]).name}</h3>
                      <p className="text-xs text-slate-400 font-semibold">{getUserDetails(winners[3]).register_no} ({getUserDetails(winners[3]).department})</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-16"></div>
                )}
                {/* Podium bar */}
                <div className="w-full h-24 bg-gradient-to-t from-amber-950/80 to-amber-900/80 border-t border-amber-700/50 rounded-t-2xl flex items-center justify-center">
                  <span className="text-xl font-black text-amber-600">🥉 THIRD</span>
                </div>
              </div>

            </div>

            {/* Controls */}
            <div className="flex justify-center space-x-4 pt-8 border-t border-white/5">
              <button
                onClick={triggerConfettiGlow}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg transition"
              >
                Launch Confetti!
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white font-bold rounded-xl transition"
              >
                Reconfigure Winners
              </button>
            </div>
          </div>
        ) : (
          /* Editor Mode */
          <div className="max-w-2xl mx-auto glass-premium p-8 rounded-3xl border border-white/10 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gradient-purple flex items-center gap-2">
                <Trophy className="text-yellow-400" size={24} />
                <span>Configure Winner Podium</span>
              </h2>
              <p className="text-sm text-slate-400 mt-1">Assign participants to first, second, and third prize spots.</p>
            </div>

            {users.length === 0 ? (
              <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl text-amber-300 text-sm leading-relaxed">
                Eligible winners can only be selected from participants who completed the final round. Please qualify users and let them submit the Final Round exam.
              </div>
            ) : (
              <div className="space-y-6">
                {/* 1st Prize selection */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">🥇 First Prize Position</label>
                  <select
                    value={winners[1] || ''}
                    onChange={(e) => handleSelectWinner(1, e.target.value)}
                    className="w-full p-3.5 rounded-xl glass-input text-sm font-semibold"
                  >
                    <option value="">-- Choose Candidate --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.register_no} - {u.department})</option>
                    ))}
                  </select>
                </div>

                {/* 2nd Prize selection */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">🥈 Second Prize Position</label>
                  <select
                    value={winners[2] || ''}
                    onChange={(e) => handleSelectWinner(2, e.target.value)}
                    className="w-full p-3.5 rounded-xl glass-input text-sm font-semibold"
                  >
                    <option value="">-- Choose Candidate --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.register_no} - {u.department})</option>
                    ))}
                  </select>
                </div>

                {/* 3rd Prize selection */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">🥉 Third Prize Position</label>
                  <select
                    value={winners[3] || ''}
                    onChange={(e) => handleSelectWinner(3, e.target.value)}
                    className="w-full p-3.5 rounded-xl glass-input text-sm font-semibold"
                  >
                    <option value="">-- Choose Candidate --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.register_no} - {u.department})</option>
                    ))}
                  </select>
                </div>

                {/* Submit button */}
                <button
                  disabled={publishing}
                  onClick={handleAnnounceWinners}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
                >
                  <CheckCircle2 size={18} />
                  <span>Publish Announcements</span>
                </button>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
};
