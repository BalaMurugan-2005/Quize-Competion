import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Award, Play, AlertCircle, CheckCircle, Clock, ShieldCheck, XCircle, ArrowRight, UserCheck, Hourglass, Trophy } from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await API.get('current-round/');
      setRounds(res.data.rounds);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to fetch round status', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getRoundConfig = (name) => {
    if (name.toLowerCase().includes('1')) {
      return { qCount: 30, desc: 'MCQ Test. Basic logical analysis and programming algorithms.' };
    } else if (name.toLowerCase().includes('2')) {
      return { qCount: 20, desc: 'MCQ Test. Intermediate technical stack and debugging capability.' };
    } else {
      return { qCount: 15, desc: 'Advanced Level MCQ Test. System design, optimizations, logical reasoning.' };
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 animate-pulse">
            <Play size={12} className="fill-emerald-300" />
            <span>LIVE NOW</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 text-xs font-semibold rounded-full bg-slate-500/20 border border-slate-500/40 text-slate-300">
            <CheckCircle size={12} />
            <span>COMPLETED</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 text-xs font-semibold rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
            <Clock size={12} />
            <span>LOCKED</span>
          </span>
        );
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
        
        {/* Welcome Banner */}
        <div className="glass-premium p-8 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none"></div>
          
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 text-purple-300 text-sm font-semibold">
              <UserCheck size={16} />
              <span>Participant Profile Verified</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Welcome back, <span className="bg-gradient-to-r from-pink-400 to-purple-400 text-transparent bg-clip-text">{user?.name}</span>
            </h1>
            <p className="text-slate-400 text-sm md:text-base">
              Department: <span className="text-slate-200 font-semibold">{user?.department}</span> | Register No: <span className="text-slate-200 font-semibold">{user?.register_no}</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link
              to="/winners"
              className="flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-gradient-to-r from-yellow-500/20 to-amber-500/20 hover:from-yellow-500/30 hover:to-amber-500/30 border border-yellow-500/35 text-yellow-300 text-sm font-bold transition-all shadow-md"
            >
              <Trophy size={18} className="text-yellow-400" />
              <span>Championship Winners</span>
            </Link>
            <Link
              to="/results"
              className="flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-sm font-bold transition-all shadow-md"
            >
              <Award size={18} />
              <span>View Scorecards & Results</span>
            </Link>
          </div>
        </div>

        {/* Rounds Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Competition Rounds</h2>
            <p className="text-sm text-slate-400">Complete each round to qualify for the next stage.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {rounds.map((round) => {
              const config = getRoundConfig(round.name);
              const isLocked = round.status === 'NOT_STARTED';
              const isLive = round.status === 'ACTIVE';
              const isFinished = round.status === 'COMPLETED';
              
              // Can enter if the round is active, user is qualified, and has not finalized already
              const canEnter = isLive && round.is_qualified && !round.finalized;

              return (
                <div 
                  key={round.id}
                  className={`glass-premium p-6 rounded-2xl border flex flex-col justify-between space-y-6 transition-all duration-300 hover:translate-y-[-4px] ${
                    canEnter 
                      ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/5' 
                      : 'border-white/5'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-bold text-white">{round.name}</h3>
                      {renderStatusBadge(round.status)}
                    </div>

                    <p className="text-slate-400 text-sm leading-relaxed">
                      {config.desc}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <div className="text-slate-400 text-xs">Questions</div>
                        <div className="text-white text-lg font-bold">{config.qCount} MCQs</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <div className="text-slate-400 text-xs">Eligibility</div>
                        <div className="text-white text-sm font-bold flex items-center space-x-1 mt-1">
                          {round.qualified && round.results_published ? (
                            <span className="text-emerald-400 flex items-center gap-1"><ShieldCheck size={14}/> Qualified</span>
                          ) : round.finalized && !round.results_published ? (
                            <span className="text-amber-400 flex items-center gap-1"><Hourglass size={14}/> Waiting for Result</span>
                          ) : round.finalized && round.results_published && !round.qualified ? (
                            <span className="text-rose-400 flex items-center gap-1"><XCircle size={14}/> Not Qualified</span>
                          ) : round.status === 'COMPLETED' && !round.finalized ? (
                            <span className="text-slate-400 flex items-center gap-1"><Clock size={14}/> Did Not Attempt</span>
                          ) : round.is_qualified ? (
                            <span className="text-emerald-400 flex items-center gap-1"><ShieldCheck size={14}/> Eligible</span>
                          ) : (
                            <span className="text-rose-400 flex items-center gap-1"><XCircle size={14}/> Not Eligible</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-white/5">
                    {canEnter ? (
                      <Link
                        to={`/quiz/${round.id}`}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 group"
                      >
                        <span>Start Test</span>
                        <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="w-full py-3.5 rounded-xl bg-white/5 text-slate-500 font-bold border border-white/5 flex items-center justify-center space-x-2 cursor-not-allowed"
                      >
                        {round.finalized && !round.results_published ? (
                          <span className="text-amber-400/80 flex items-center gap-1.5"><Hourglass size={16} /> Waiting for Result</span>
                        ) : round.finalized && round.results_published ? (
                          <span className="text-emerald-500 flex items-center gap-1.5"><ShieldCheck size={16} /> Answers Submitted</span>
                        ) : !round.is_qualified ? (
                          <span className="text-rose-400/80 flex items-center gap-1.5"><AlertCircle size={16} /> Not Eligible</span>
                        ) : isFinished ? (
                          <span>Round Finished</span>
                        ) : isLocked ? (
                          <span>Awaiting Start</span>
                        ) : (
                          <span className="text-rose-400/80 flex items-center gap-1.5"><AlertCircle size={16} /> Disqualified</span>
                        )}
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>

      </main>

      <footer className="py-8 text-center text-slate-600 text-xs">
        &copy; {new Date().getFullYear()} College Event Quiz Committee.
      </footer>
    </div>
  );
};
