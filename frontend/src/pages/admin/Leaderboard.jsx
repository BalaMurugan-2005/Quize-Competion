import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { Navbar } from '../../components/Navbar';
import { ArrowLeft, RefreshCw, Trophy, ShieldCheck, CheckSquare, Settings } from 'lucide-react';

export const Leaderboard = () => {
  const { addToast } = useToast();
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedRound, setSelectedRound] = useState(1);
  const [loading, setLoading] = useState(true);
  
  // Selection state
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [cutoffScore, setCutoffScore] = useState(15);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await API.get(`leaderboard/?round_id=${selectedRound}`);
      setLeaderboard(res.data);
    } catch (err) {
      addToast('Failed to load leaderboard data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedRound]);

  // Sync selected list when leaderboard loaded or round changed
  useEffect(() => {
    const qualifiedIds = leaderboard
      .filter((res) => res.qualified)
      .map((res) => res.user_details.id);
    setSelectedUserIds(qualifiedIds);
  }, [leaderboard]);

  const selectTopN = (n) => {
    const topIds = leaderboard.slice(0, n).map((res) => res.user_details.id);
    setSelectedUserIds(topIds);
    addToast(`Selected top ${Math.min(n, leaderboard.length)} participants.`, 'info');
  };

  const applyCutoffSelection = () => {
    const cutoffIds = leaderboard
      .filter((res) => res.score >= cutoffScore)
      .map((res) => res.user_details.id);
    setSelectedUserIds(cutoffIds);
    addToast(`Selected ${cutoffIds.length} participants with score >= ${cutoffScore}.`, 'info');
  };

  const handleSaveSelection = async () => {
    setSaving(true);
    try {
      await API.post('admin/publish-results/', {
        round_id: selectedRound,
        qualified_user_ids: selectedUserIds,
        action: 'save',
      });
      addToast(`Qualification selection for Round ${selectedRound} saved successfully!`, 'success');
      fetchLeaderboard();
    } catch (err) {
      addToast('Failed to save qualification selection.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishResults = async () => {
    if (
      !window.confirm(
        `Are you sure you want to publish results for Round ${selectedRound}? This will finalize and publish scores/qualification to all students and send notifications at the same time.`
      )
    ) {
      return;
    }
    setPublishing(true);
    try {
      await API.post('admin/publish-results/', {
        round_id: selectedRound,
        qualified_user_ids: selectedUserIds,
        action: 'publish',
      });
      addToast(`Qualification results for Round ${selectedRound} published and notifications sent successfully!`, 'success');
      fetchLeaderboard();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to publish results.', 'error');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-10 space-y-8">
        
        {/* Back navigation */}
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>

        {/* Top filter and actions block */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Settings panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-premium p-6 rounded-2xl border border-white/10 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Settings className="text-purple-400" size={20} />
                  <span>Qualification controls</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">Select students or use the tools below to bulk select.</p>
              </div>

              {/* Select Round */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Select Round</label>
                <select
                  value={selectedRound}
                  onChange={(e) => setSelectedRound(parseInt(e.target.value))}
                  className="w-full p-3 rounded-xl glass-input text-sm font-semibold animate-pulse-slow"
                >
                  <option value={1}>Round 1</option>
                  <option value={2}>Round 2</option>
                  <option value={3}>Final Round</option>
                </select>
              </div>

              <div className="border-t border-white/5 pt-4 space-y-4">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Selection Helpers</span>
                
                {/* Apply Cutoff */}
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-semibold block">Cutoff Score (Minimum Marks)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={cutoffScore}
                      onChange={(e) => setCutoffScore(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="e.g. 15"
                      className="w-full px-3 py-2 rounded-xl glass-input text-sm font-semibold"
                    />
                    <button
                      type="button"
                      onClick={applyCutoffSelection}
                      className="px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-bold rounded-xl transition"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                {/* Top N selection */}
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-semibold block">Select Top Students</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => selectTopN(3)}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold rounded-xl transition"
                    >
                      Top 3
                    </button>
                    <button
                      type="button"
                      onClick={() => selectTopN(5)}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold rounded-xl transition"
                    >
                      Top 5
                    </button>
                    <button
                      type="button"
                      onClick={() => selectTopN(10)}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold rounded-xl transition"
                    >
                      Top 10
                    </button>
                    <button
                      type="button"
                      onClick={() => selectTopN(20)}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold rounded-xl transition"
                    >
                      Top 20
                    </button>
                  </div>
                </div>
              </div>

              {/* Status summary */}
              <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Selected Students</span>
                <span className="text-purple-300 font-extrabold text-sm bg-purple-500/20 px-2 py-0.5 rounded-lg">
                  {selectedUserIds.length} / {leaderboard.length}
                </span>
              </div>

              {/* Actions */}
              {leaderboard.length > 0 && leaderboard[0].round_details?.results_published ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex flex-col items-center justify-center text-center space-y-2">
                  <ShieldCheck className="text-emerald-400" size={24} />
                  <div>
                    <span className="text-emerald-300 font-extrabold text-sm block">Results are Live</span>
                    <span className="text-[10px] text-slate-400">Scores & notifications have been published to students.</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {/* Save Selection Button */}
                  <button
                    disabled={saving || publishing}
                    onClick={handleSaveSelection}
                    className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm border border-white/10 transition flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                    ) : (
                      <>
                        <CheckSquare size={16} className="text-purple-400" />
                        <span>Save Selection ({selectedUserIds.length})</span>
                      </>
                    )}
                  </button>

                  {/* Publish Button */}
                  <button
                    disabled={saving || publishing}
                    onClick={handlePublishResults}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-purple-500/10 transition flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {publishing ? (
                      <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                    ) : (
                      <>
                        <Trophy size={16} />
                        <span>Publish Results & Notify</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Leaderboard Table Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-premium p-6 rounded-2xl border border-white/10 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Trophy className="text-amber-400" size={20} />
                  <span>Leaderboard Standings</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">Ranks showing participant scores and qualification statuses.</p>
              </div>
              
              <button
                onClick={fetchLeaderboard}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 transition"
              >
                <RefreshCw size={16} />
              </button>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <div className="w-12 h-12 mx-auto rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="glass p-12 rounded-2xl border border-white/5 text-center text-slate-400">
                No submissions or scores recorded for this round yet.
              </div>
            ) : (
              <div className="glass-premium rounded-2xl border border-white/10 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-slate-300 text-xs font-semibold uppercase tracking-wider">
                      <th className="p-4 pl-6 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          disabled={leaderboard.length > 0 && leaderboard[0].round_details?.results_published}
                          checked={leaderboard.length > 0 && selectedUserIds.length === leaderboard.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUserIds(leaderboard.map(res => res.user_details.id));
                            } else {
                              setSelectedUserIds([]);
                            }
                          }}
                          className="w-4 h-4 rounded border-white/20 bg-transparent text-purple-600 focus:ring-purple-500 focus:ring-offset-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                      </th>
                      <th className="p-4 w-16 text-center">Rank</th>
                      <th className="p-4">Participant</th>
                      <th className="p-4">Reg No</th>
                      <th className="p-4 text-center">Submitted At</th>
                      <th className="p-4 text-center">Questions</th>
                      <th className="p-4 text-center">Score</th>
                      <th className="p-4">Qualification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {leaderboard.map((res, index) => {
                      const rank = index + 1;
                      const isSelected = selectedUserIds.includes(res.user_details.id);
                      const isPublished = res.round_details?.results_published;
                      return (
                        <tr 
                          key={res.id} 
                          className={`hover:bg-white/5 transition-all ${
                            isPublished ? 'cursor-default' : 'cursor-pointer'
                          } ${
                            isSelected ? 'bg-purple-500/[0.04] border-l-2 border-purple-500' : ''
                          }`}
                          onClick={() => {
                            if (isPublished) return;
                            if (isSelected) {
                              setSelectedUserIds(selectedUserIds.filter(id => id !== res.user_details.id));
                            } else {
                              setSelectedUserIds([...selectedUserIds, res.user_details.id]);
                            }
                          }}
                        >
                          {/* Checkbox column */}
                          <td className="p-4 pl-6 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              disabled={isPublished}
                              checked={isSelected}
                              onChange={(e) => {
                                if (isPublished) return;
                                if (e.target.checked) {
                                  setSelectedUserIds([...selectedUserIds, res.user_details.id]);
                                } else {
                                  setSelectedUserIds(selectedUserIds.filter(id => id !== res.user_details.id));
                                }
                              }}
                              className="w-4 h-4 rounded border-white/20 bg-transparent text-purple-600 focus:ring-purple-500 focus:ring-offset-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            />
                          </td>

                          {/* Rank Icon or number */}
                          <td className="p-4 text-center font-bold">
                            {rank === 1 ? (
                              <span className="text-yellow-400 text-lg">🥇</span>
                            ) : rank === 2 ? (
                              <span className="text-slate-300 text-lg">🥈</span>
                            ) : rank === 3 ? (
                              <span className="text-amber-600 text-lg">🥉</span>
                            ) : (
                              <span className="text-slate-500 font-mono">{rank}</span>
                            )}
                          </td>

                          {/* Student profile details */}
                          <td className="p-4">
                            <div className="font-semibold text-white">{res.user_details.name}</div>
                            <div className="text-[10px] text-slate-500 uppercase">{res.user_details.department}</div>
                          </td>

                          {/* Register Number */}
                          <td className="p-4 text-slate-300 font-mono text-xs">{res.user_details.register_no}</td>

                          {/* Submitted At */}
                          <td className="p-4 text-center text-slate-300 font-mono text-xs">
                            {res.submitted_at ? (
                              <>
                                <div>{new Date(res.submitted_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  {new Date(res.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </div>
                              </>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>

                          {/* Questions */}
                          <td className="p-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold font-mono">
                              {res.questions_answered} / {res.total_questions}
                            </span>
                          </td>

                          {/* Final Score */}
                          <td className="p-4 text-center text-white font-extrabold text-base">{res.score}</td>

                          {/* Qualified badge */}
                          <td className="p-4">
                            {res.qualified ? (
                              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                                <ShieldCheck size={12} />
                                <span>Qualified</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">
                                <span>Disqualified</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
};
