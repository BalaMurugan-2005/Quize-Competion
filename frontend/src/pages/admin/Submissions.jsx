import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { Navbar } from '../../components/Navbar';
import { ArrowLeft, RefreshCw, Search, ClipboardList, CheckCircle, XCircle, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export const Submissions = () => {
  const { addToast } = useToast();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roundFilter, setRoundFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUser, setExpandedUser] = useState(null); // for drill-down view

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await API.get(`admin/submissions/?round_id=${roundFilter}&search=${searchQuery}`);
      setSubmissions(res.data);
    } catch (err) {
      addToast('Failed to load submission data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [roundFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSubmissions();
  };

  // Group submissions by user + round into a summary format
  const groupedSummary = React.useMemo(() => {
    const map = {};
    submissions.forEach((sub) => {
      const key = `${sub.user_details.id}_${sub.question_details.round}`;
      if (!map[key]) {
        map[key] = {
          key,
          userId: sub.user_details.id,
          name: sub.user_details.name,
          register_no: sub.user_details.register_no,
          department: sub.user_details.department,
          round: sub.question_details.round,
          roundLabel: sub.question_details.round === 1 ? 'Round 1' : sub.question_details.round === 2 ? 'Round 2' : 'Final Round',
          answered: 0,
          correct: 0,
          incorrect: 0,
          details: [],
        };
      }
      const isCorrect = sub.selected_answer === sub.question_details.correct_answer;
      map[key].answered += 1;
      if (isCorrect) map[key].correct += 1;
      else map[key].incorrect += 1;
      map[key].details.push(sub);
    });

    return Object.values(map).sort((a, b) => a.round - b.round || a.name.localeCompare(b.name));
  }, [submissions]);

  const toggleExpand = (key) => {
    setExpandedUser(expandedUser === key ? null : key);
  };

  const getScoreBadge = (correct, answered) => {
    const pct = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    if (pct >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (pct >= 50) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
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

        {/* Header + Filters */}
        <div className="glass-premium p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <ClipboardList className="text-purple-400" size={24} />
              <span>Participant Submissions Summary</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Per-user answer count per round. Click any row to expand question-level details.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-grow sm:flex-grow-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Search name or Reg No..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-52 pl-9 pr-4 py-2.5 rounded-xl glass-input text-sm"
              />
            </div>

            {/* Round Filter */}
            <select
              value={roundFilter}
              onChange={(e) => setRoundFilter(e.target.value)}
              className="p-2.5 rounded-xl glass-input text-sm font-semibold"
            >
              <option value="">All Rounds</option>
              <option value="1">Round 1</option>
              <option value="2">Round 2</option>
              <option value="3">Final Round</option>
            </select>

            <button
              type="submit"
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl transition"
            >
              Search
            </button>
            <button
              type="button"
              onClick={fetchSubmissions}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 transition"
            >
              <RefreshCw size={16} />
            </button>
          </form>
        </div>

        {/* Stats bar */}
        {!loading && groupedSummary.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass p-4 rounded-2xl border border-white/5 text-center">
              <div className="text-2xl font-extrabold text-white">
                {new Set(groupedSummary.map(g => g.userId)).size}
              </div>
              <div className="text-xs text-slate-400 mt-1">Total Participants</div>
            </div>
            <div className="glass p-4 rounded-2xl border border-white/5 text-center">
              <div className="text-2xl font-extrabold text-white">{submissions.length}</div>
              <div className="text-xs text-slate-400 mt-1">Total Answers</div>
            </div>
            <div className="glass p-4 rounded-2xl border border-white/5 text-center">
              <div className="text-2xl font-extrabold text-emerald-400">
                {submissions.filter(s => s.selected_answer === s.question_details.correct_answer).length}
              </div>
              <div className="text-xs text-slate-400 mt-1">Correct Answers</div>
            </div>
            <div className="glass p-4 rounded-2xl border border-white/5 text-center">
              <div className="text-2xl font-extrabold text-rose-400">
                {submissions.filter(s => s.selected_answer !== s.question_details.correct_answer).length}
              </div>
              <div className="text-xs text-slate-400 mt-1">Wrong Answers</div>
            </div>
          </div>
        )}

        {/* Summary Table */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 mx-auto rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
          </div>
        ) : groupedSummary.length === 0 ? (
          <div className="glass p-12 rounded-2xl border border-white/5 text-center text-slate-400">
            No submissions found. Try adjusting the search filters.
          </div>
        ) : (
          <div className="glass-premium rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-slate-300 text-xs font-semibold uppercase tracking-wider">
                    <th className="p-4 pl-6">Participant</th>
                    <th className="p-4">Reg No</th>
                    <th className="p-4">Round</th>
                    <th className="p-4 text-center">Questions Answered</th>
                    <th className="p-4 text-center">✓ Correct</th>
                    <th className="p-4 text-center">✗ Wrong</th>
                    <th className="p-4 text-center">Score %</th>
                    <th className="p-4 text-center">Details</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {groupedSummary.map((row) => (
                    <React.Fragment key={row.key}>
                      {/* Summary Row */}
                      <tr
                        className="border-b border-white/5 hover:bg-white/5 transition-all cursor-pointer"
                        onClick={() => toggleExpand(row.key)}
                      >
                        {/* Name */}
                        <td className="p-4 pl-6">
                          <div className="font-semibold text-white">{row.name}</div>
                          <div className="text-[10px] text-slate-500 uppercase">{row.department}</div>
                        </td>

                        {/* Reg No */}
                        <td className="p-4 text-slate-300 font-mono text-xs">{row.register_no}</td>

                        {/* Round Label */}
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold">
                            {row.roundLabel}
                          </span>
                        </td>

                        {/* Questions Answered */}
                        <td className="p-4 text-center">
                          <span className="text-2xl font-extrabold text-white">{row.answered}</span>
                          <span className="text-slate-500 text-xs ml-1">Qs</span>
                        </td>

                        {/* Correct */}
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-extrabold text-lg">
                            <CheckCircle size={16} />
                            {row.correct}
                          </span>
                        </td>

                        {/* Wrong */}
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1 text-rose-400 font-extrabold text-lg">
                            <XCircle size={16} />
                            {row.incorrect}
                          </span>
                        </td>

                        {/* Score Percentage */}
                        <td className="p-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full border text-xs font-extrabold ${getScoreBadge(row.correct, row.answered)}`}>
                            {row.answered > 0 ? Math.round((row.correct / row.answered) * 100) : 0}%
                          </span>
                        </td>

                        {/* Expand toggle */}
                        <td className="p-4 text-center text-slate-400">
                          {expandedUser === row.key
                            ? <ChevronUp size={16} className="mx-auto text-purple-400" />
                            : <ChevronDown size={16} className="mx-auto" />
                          }
                        </td>
                      </tr>

                      {/* Expanded Detail Rows */}
                      {expandedUser === row.key && (
                        <tr>
                          <td colSpan={8} className="p-0">
                            <div className="bg-white/[0.02] border-b border-white/10 px-6 py-4 space-y-2">
                              <p className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-3">
                                Question-level Breakdown — {row.roundLabel}
                              </p>
                              <div className="space-y-2">
                                {row.details.map((sub, idx) => {
                                  const isCorrect = sub.selected_answer === sub.question_details.correct_answer;
                                  return (
                                    <div
                                      key={sub.id}
                                      className={`flex items-center justify-between gap-4 p-3 rounded-xl border ${
                                        isCorrect
                                          ? 'bg-emerald-500/5 border-emerald-500/20'
                                          : 'bg-rose-500/5 border-rose-500/20'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3 flex-grow min-w-0">
                                        <span className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                                          isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                                        }`}>
                                          {idx + 1}
                                        </span>
                                        <span className="text-slate-300 text-xs truncate">
                                          {sub.question_details.question}
                                        </span>
                                      </div>
                                      <div className="flex-shrink-0 flex items-center gap-3 text-xs">
                                        <span className="text-slate-400">
                                          Answered: <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded">{sub.selected_answer}</span>
                                        </span>
                                        <span className="text-slate-400">
                                          Correct: <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{sub.question_details.correct_answer}</span>
                                        </span>
                                        {isCorrect
                                          ? <span className="text-emerald-400 font-bold">✓ Correct</span>
                                          : <span className="text-rose-400 font-bold">✗ Wrong</span>
                                        }
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
