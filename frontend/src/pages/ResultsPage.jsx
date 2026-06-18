import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import { useToast } from '../context/ToastContext';
import { Navbar } from '../components/Navbar';
import { Award, CheckCircle, XCircle, ArrowLeft, Trophy, ChevronRight, Hourglass, Clock } from 'lucide-react';

export const ResultsPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchResults = async () => {
    try {
      const res = await API.get('results/');
      setResults(res.data);
    } catch (err) {
      addToast('Failed to fetch your performance scorecard.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

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

      <main className="flex-grow max-w-4xl mx-auto w-full px-6 py-10 space-y-8">
        
        {/* Navigation back */}
        <Link
          to="/dashboard"
          className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>

        {/* Top Header Card */}
        <div className="glass-premium p-8 rounded-3xl border border-white/10 text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-600/10 rounded-full blur-[100px] pointer-events-none"></div>

          <Trophy size={48} className="mx-auto text-pink-400 mb-4 animate-bounce" />
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Your Quiz Performance</h1>
          <p className="text-slate-400 text-sm md:text-base mt-2 max-w-lg mx-auto">
            Review your scores and qualification details for completed stages of the competition.
          </p>
        </div>

        {/* Detailed Breakdown */}
        {results.length === 0 ? (
          <div className="glass p-8 rounded-2xl border border-white/5 text-center text-slate-400">
            No exams submitted yet. Completed rounds will appear here.
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((res) => {
              const isPublished = res.results_published;

              return (
                <div
                  key={res.id}
                  className="glass-premium p-6 rounded-2xl border border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6"
                >
                  {/* Round Info */}
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white">{res.round_details.name}</h3>
                    <p className="text-xs text-slate-400">
                      Status: {isPublished ? (
                        <span className="text-emerald-300 font-semibold">Results Published</span>
                      ) : (
                        <span className="text-amber-300 font-semibold">Submitted — Awaiting Results</span>
                      )}
                    </p>
                  </div>

                  {/* Score & Qualification details */}
                  <div className="flex flex-wrap items-center gap-6">
                    {isPublished ? (
                      <>
                        {/* Score - only show when published */}
                        <div className="bg-white/5 px-4 py-2.5 rounded-xl border border-white/5">
                          <div className="text-slate-400 text-[10px] uppercase font-semibold">Total Score</div>
                          <div className="text-white text-lg font-extrabold">{res.score} Marks</div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center space-x-2">
                          {res.qualified ? (
                            <div className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-sm">
                              <CheckCircle size={16} />
                              <span>Qualified</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold text-sm">
                              <XCircle size={16} />
                              <span>Not Qualified</span>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      /* Waiting for Result state */
                      <div className="flex items-center space-x-3 px-5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
                        <div className="relative">
                          <Hourglass size={20} className="text-amber-400 animate-pulse" />
                        </div>
                        <div>
                          <div className="text-amber-300 font-bold text-sm">Waiting for Result</div>
                          <div className="text-amber-400/60 text-[10px] font-medium">Results will be published by the admin</div>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Global Live Leaderboard Call to action */}
        <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="font-bold text-white">Live Event Standings</h4>
            <p className="text-xs text-slate-400">See where you stand among top competitors in real-time.</p>
          </div>
          <Link
            to="/dashboard"
            className="flex items-center space-x-1 text-sm font-bold text-pink-400 hover:text-pink-300 transition"
          >
            <span>Go to Live Leaderboard</span>
            <ChevronRight size={16} />
          </Link>
        </div>

      </main>
    </div>
  );
};

