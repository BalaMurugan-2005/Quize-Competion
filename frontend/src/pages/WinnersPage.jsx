import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { useToast } from '../context/ToastContext';
import { Navbar } from '../components/Navbar';
import { ArrowLeft, Trophy, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export const WinnersPage = () => {
  const { addToast } = useToast();
  const [winners, setWinners] = useState({ 1: null, 2: null, 3: null });
  const [loading, setLoading] = useState(true);
  const [hasWinners, setHasWinners] = useState(false);

  const fetchWinners = async () => {
    try {
      const res = await API.get('winners/');
      const winMap = { 1: null, 2: null, 3: null };
      res.data.forEach(w => {
        winMap[w.position] = w.user_details;
      });
      setWinners(winMap);
      
      const foundWinners = res.data.length > 0;
      setHasWinners(foundWinners);
      
      if (foundWinners) {
        // Run confetti after the component renders the podium
        setTimeout(triggerConfettiGlow, 500);
      }
    } catch (err) {
      addToast('Failed to load winner details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWinners();
  }, []);

  const triggerConfettiGlow = () => {
    const duration = 6 * 1000;
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
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020017] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <Navbar />

      {/* Confetti backdrop effects when live */}
      {hasWinners && (
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-t from-[#020017] via-[#0b0322]/40 to-[#020017] pointer-events-none"></div>
      )}

      <main className="flex-grow max-w-5xl mx-auto w-full px-6 py-10 space-y-12 z-10">
        
        {/* Back navigation */}
        <Link
          to="/dashboard"
          className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>

        {hasWinners ? (
          <div className="space-y-12 text-center animate-fade-in">
            {/* Header */}
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 font-bold text-xs tracking-wider uppercase animate-pulse">
                <Sparkles size={14} />
                <span>Quiz Championship Winners</span>
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
                {winners[2] ? (
                  <div className="space-y-4 text-center pb-4 animate-slide-up [animation-delay:0.3s]">
                    <div className="w-16 h-16 rounded-full bg-slate-500/20 border border-slate-500/40 flex items-center justify-center text-slate-300 font-bold text-2xl mx-auto">
                      2nd
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white">{winners[2].name}</h3>
                      <p className="text-xs text-slate-400 font-semibold">{winners[2].register_no} ({winners[2].department})</p>
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
                {winners[1] ? (
                  <div className="space-y-4 text-center pb-6 animate-slide-up">
                    <Trophy size={48} className="text-yellow-400 mx-auto animate-bounce" />
                    <div>
                      <h3 className="font-extrabold text-2xl text-yellow-300">{winners[1].name}</h3>
                      <p className="text-xs text-slate-300 font-bold">{winners[1].register_no} ({winners[1].department})</p>
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
                {winners[3] ? (
                  <div className="space-y-4 text-center pb-4 animate-slide-up [animation-delay:0.5s]">
                    <div className="w-16 h-16 rounded-full bg-amber-600/20 border border-amber-600/40 flex items-center justify-center text-amber-500 font-bold text-2xl mx-auto">
                      3rd
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white">{winners[3].name}</h3>
                      <p className="text-xs text-slate-400 font-semibold">{winners[3].register_no} ({winners[3].department})</p>
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

            {/* Replay celebration button */}
            <div className="flex justify-center pt-8 border-t border-white/5">
              <button
                onClick={triggerConfettiGlow}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold rounded-xl shadow-lg transition flex items-center space-x-2"
              >
                <Sparkles size={18} />
                <span>Replay Celebration!</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto glass-premium p-12 rounded-3xl border border-white/10 text-center space-y-6">
            <Trophy className="text-slate-600 mx-auto opacity-30" size={64} />
            <h2 className="text-2xl font-bold text-white">Winners Not Yet Announced</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              The Grand Finale winners have not been published by the quiz committee. Once the round is completed and results are evaluated, they will be posted here. Stay tuned!
            </p>
            <Link
              to="/dashboard"
              className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-md transition"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

      </main>
    </div>
  );
};
