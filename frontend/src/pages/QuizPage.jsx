import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useToast } from '../context/ToastContext';
import { Navbar } from '../components/Navbar';
import { ShieldAlert, CheckCircle, ChevronLeft, ChevronRight, HelpCircle, Save } from 'lucide-react';

export const QuizPage = () => {
  const { roundId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // format: {question_id: selected_option}
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch questions & any previously saved drafts
  const fetchQuizData = async () => {
    try {
      const res = await API.get(`questions/${roundId}/`);
      setQuestions(res.data.questions);
      
      // Load saved answers from backend submissions
      if (res.data.submissions) {
        setAnswers(res.data.submissions);
      }
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to initialize quiz. You may not be qualified or round is closed.', 'error');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizData();
  }, [roundId]);

  // Disable copy/cut/right-click/keyboard shortcuts to prevent malpractice
  useEffect(() => {
    const handleCopy = (e) => {
      e.preventDefault();
      addToast('Copying content is strictly prohibited!', 'warning');
    };

    const handleCut = (e) => {
      e.preventDefault();
      addToast('Cutting content is strictly prohibited!', 'warning');
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      addToast('Right-click context menu is disabled!', 'warning');
    };

    const handleKeyDown = (e) => {
      // Prevent Ctrl+C, Cmd+C, Ctrl+X, Cmd+X, Ctrl+U, Cmd+U, F12, Ctrl+Shift+I
      const isCopy = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c';
      const isCut = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x';
      const isViewSource = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u';
      const isDevTools = (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i') || e.key === 'F12';

      if (isCopy || isCut || isViewSource || isDevTools) {
        e.preventDefault();
        addToast('Action is disabled for security reasons!', 'warning');
      }
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [addToast]);

  // Auto save logic (triggered on selecting answers)
  const autoSaveAnswers = async (currentAnswers) => {
    setSaving(true);
    const answersList = Object.entries(currentAnswers).map(([qId, val]) => ({
      question_id: parseInt(qId),
      selected_answer: val
    }));

    try {
      await API.post('submit-answers/', {
        round_id: parseInt(roundId),
        answers: answersList,
        is_final: false
      });
    } catch (err) {
      // Silently fail or log to console for background saves
      console.error('Autosave failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const selectOption = (questionId, option) => {
    const updated = {
      ...answers,
      [questionId]: option
    };
    setAnswers(updated);
    
    // Trigger auto save
    autoSaveAnswers(updated);
  };

  const handleSubmit = async () => {
    if (!window.confirm('Are you sure you want to finish the quiz? You cannot modify answers after final submission.')) {
      return;
    }

    setLoading(true);

    const answersList = Object.entries(answers).map(([qId, val]) => ({
      question_id: parseInt(qId),
      selected_answer: val
    }));

    try {
      const res = await API.post('submit-answers/', {
        round_id: parseInt(roundId),
        answers: answersList,
        is_final: true
      });
      addToast(res.data.message || 'Quiz submitted successfully!', 'success');
      navigate('/results');
    } catch (err) {
      addToast(err.response?.data?.error || 'Submission failed.', 'error');
      setLoading(false);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center text-center p-6">
          <div className="glass-premium p-8 rounded-2xl max-w-md space-y-4">
            <HelpCircle size={48} className="mx-auto text-purple-400" />
            <h3 className="text-xl font-bold">No Questions Found</h3>
            <p className="text-slate-400">There are no questions uploaded for this round yet.</p>
            <button onClick={() => navigate('/dashboard')} className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold">
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const isSelected = answers[currentQuestion.id];

  return (
    <div className="min-h-screen flex flex-col select-none">
      <Navbar />

      {/* Main Quiz Flow */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side: Question Pane */}
        <div className="lg:col-span-3 flex flex-col space-y-6">
          
          {/* Top Panel: Title, Status, Timer */}
          <div className="glass-premium p-5 rounded-2xl border border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <span className="text-xs font-semibold text-purple-400 tracking-widest uppercase">Ongoing Quiz</span>
              <h2 className="text-xl font-bold text-white mt-0.5">Round {roundId} - Competitive Assessment</h2>
            </div>

            <div className="flex items-center space-x-6">
              {/* Auto Save Status */}
              <div className="flex items-center space-x-1.5 text-xs text-slate-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                <Save size={12} className={saving ? 'animate-pulse text-purple-400' : 'text-slate-400'} />
                <span>{saving ? 'Saving...' : 'Progress Saved'}</span>
              </div>
            </div>
          </div>

          {/* Question Details Card */}
          <div className="glass-premium p-8 rounded-2xl border border-white/10 flex-grow flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              {/* Question Number */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-purple-400">
                  Question {currentIdx + 1} of {questions.length}
                </span>
                <span className="text-xs px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300 font-medium">
                  +1.0 Marks
                </span>
              </div>

              {/* Question String */}
              <h3 className="text-xl md:text-2xl font-bold leading-relaxed text-slate-100">
                {currentQuestion.question}
              </h3>

              {/* Options list */}
              <div className="grid grid-cols-1 gap-4 pt-4">
                {[
                  { key: 'A', val: currentQuestion.option_a },
                  { key: 'B', val: currentQuestion.option_b },
                  { key: 'C', val: currentQuestion.option_c },
                  { key: 'D', val: currentQuestion.option_d },
                ].map((opt) => {
                  const isChecked = isSelected === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => selectOption(currentQuestion.id, opt.key)}
                      className={`w-full text-left p-5 rounded-xl border transition-all duration-300 flex items-center space-x-4 ${
                        isChecked
                          ? 'bg-purple-600/20 border-purple-500 text-white shadow-md shadow-purple-500/10'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-slate-300'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold border text-sm transition-all ${
                        isChecked
                          ? 'bg-purple-500 border-purple-400 text-white'
                          : 'bg-white/5 border-white/10 text-slate-400'
                      }`}>
                        {opt.key}
                      </div>
                      <span className="font-semibold text-sm md:text-base">{opt.val}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions inside Card */}
            <div className="flex justify-between items-center pt-8 border-t border-white/5">
              <button
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((prev) => prev - 1)}
                className="flex items-center space-x-1.5 px-5 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-semibold transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>

              {currentIdx === questions.length - 1 ? (
                <button
                  onClick={() => handleSubmit(false)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 font-bold text-white shadow-lg shadow-pink-500/20 transition-all flex items-center space-x-1.5"
                >
                  <CheckCircle size={16} />
                  <span>Submit Quiz</span>
                </button>
              ) : (
                <button
                  onClick={() => setCurrentIdx((prev) => prev + 1)}
                  className="flex items-center space-x-1.5 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition"
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              )}
            </div>

          </div>

        </div>

        {/* Right Side: Sidebar Navigation Grid */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-premium p-6 rounded-2xl border border-white/10 space-y-6">
            <div>
              <h4 className="font-bold text-white">Quiz Navigation</h4>
              <p className="text-xs text-slate-400 mt-0.5">Jump directly to any question.</p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-5 gap-2.5">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isCurrent = idx === currentIdx;
                
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-11 rounded-lg font-bold border transition-all text-xs flex items-center justify-center ${
                      isCurrent
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-purple-400 text-white ring-2 ring-purple-500/50'
                        : isAnswered
                        ? 'bg-purple-950/40 border-purple-500/40 text-purple-300'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-4 border-t border-white/5 space-y-2.5">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <div className="w-3.5 h-3.5 rounded bg-gradient-to-r from-purple-600 to-pink-600 border border-purple-400"></div>
                <span>Current Question</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <div className="w-3.5 h-3.5 rounded bg-purple-950/40 border border-purple-500/40"></div>
                <span>Answered</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <div className="w-3.5 h-3.5 rounded bg-white/5 border border-white/10"></div>
                <span>Unanswered</span>
              </div>
            </div>

          </div>

          {/* Security Notice */}
          <div className="glass p-5 rounded-2xl border border-white/5 flex items-start space-x-3 text-xs text-slate-400">
            <ShieldAlert className="text-pink-500 flex-shrink-0" size={16} />
            <div className="leading-relaxed">
              <strong>Instructions:</strong> Please do not refresh the page. Your progress is continuously saved to the cloud.
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};
