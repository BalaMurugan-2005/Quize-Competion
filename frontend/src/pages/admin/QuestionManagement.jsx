import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { Navbar } from '../../components/Navbar';
import { Plus, Trash2, Edit2, ArrowLeft, RefreshCw, X, Check, Save } from 'lucide-react';

export const QuestionManagement = () => {
  const { addToast } = useToast();
  const [questions, setQuestions] = useState([]);
  const [selectedRound, setSelectedRound] = useState(1); // Default to Round 1
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState(null); // stores question object if editing, otherwise null

  const [formData, setFormData] = useState({
    question: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    round: 1
  });

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await API.get(`admin/questions/?round_id=${selectedRound}`);
      setQuestions(res.data);
    } catch (err) {
      addToast('Failed to fetch questions.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [selectedRound]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEditClick = (q) => {
    setEditingQuestion(q.id);
    setFormData({
      question: q.question,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer,
      round: q.round
    });
  };

  const handleCancelEdit = () => {
    setEditingQuestion(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      question: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
      round: selectedRound
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.question || !formData.option_a || !formData.option_b || !formData.option_c || !formData.option_d) {
      addToast('Please fill all option fields and the question details.', 'warning');
      return;
    }

    try {
      if (editingQuestion) {
        // Update request
        await API.put(`admin/questions/${editingQuestion}/`, {
          ...formData,
          round: parseInt(selectedRound)
        });
        addToast('Question updated successfully!', 'success');
        setEditingQuestion(null);
      } else {
        // Create request
        await API.post('admin/questions/', {
          ...formData,
          round: parseInt(selectedRound)
        });
        addToast('Question added to database!', 'success');
      }
      resetForm();
      fetchQuestions();
    } catch (err) {
      addToast('Failed to save question details.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }
    try {
      await API.delete(`admin/questions/${id}/`);
      addToast('Question deleted successfully.', 'success');
      fetchQuestions();
    } catch (err) {
      addToast('Failed to delete question.', 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Column */}
        <div className="lg:col-span-1 space-y-6">
          
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </Link>

          <div className="glass-premium p-6 rounded-2xl border border-white/10 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">
                {editingQuestion ? 'Modify Question' : 'Add MCQ Question'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {editingQuestion ? 'Update question and response choices' : 'Insert a new item to current round question pool'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Question Text */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Question</label>
                <textarea
                  name="question"
                  value={formData.question}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Enter the question query..."
                  className="w-full p-3 rounded-xl glass-input text-sm leading-relaxed"
                />
              </div>

              {/* Options */}
              {['option_a', 'option_b', 'option_c', 'option_d'].map((opt, i) => {
                const label = ['A', 'B', 'C', 'D'][i];
                return (
                  <div key={opt} className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold">Option {label}</label>
                    <input
                      type="text"
                      name={opt}
                      value={formData[opt]}
                      onChange={handleInputChange}
                      placeholder={`Enter text for Option ${label}`}
                      className="w-full px-3 py-2 rounded-xl glass-input text-sm"
                    />
                  </div>
                );
              })}

              {/* Correct Answer */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Correct Answer Option</label>
                <select
                  name="correct_answer"
                  value={formData.correct_answer}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-xl glass-input text-sm"
                >
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-2">
                {editingQuestion && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 font-bold text-sm transition"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-grow py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm shadow-md transition flex items-center justify-center space-x-2"
                >
                  <Save size={16} />
                  <span>{editingQuestion ? 'Update' : 'Save'} Question</span>
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* List Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters & Header */}
          <div className="glass-premium p-6 rounded-2xl border border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Question Pool View</h2>
              <p className="text-xs text-slate-400 mt-1">Review, modify or remove uploaded MCQs.</p>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={selectedRound}
                onChange={(e) => setSelectedRound(parseInt(e.target.value))}
                className="p-2.5 rounded-xl glass-input text-sm font-semibold"
              >
                <option value={1}>Round 1</option>
                <option value={2}>Round 2</option>
                <option value={3}>Final Round</option>
              </select>
              <button
                onClick={fetchQuestions}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 transition"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          {/* List items */}
          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 mx-auto rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
            </div>
          ) : questions.length === 0 ? (
            <div className="glass p-12 rounded-2xl border border-white/5 text-center text-slate-400">
              No questions found for the selected round. Add one using the form.
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q.id} className="glass-premium p-6 rounded-2xl border border-white/5 space-y-4 relative">
                  {/* Actions */}
                  <div className="absolute top-6 right-6 flex space-x-2">
                    <button
                      onClick={() => handleEditClick(q)}
                      className="p-2 rounded-lg bg-white/5 border border-white/5 hover:border-purple-500/30 text-purple-400 transition"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-2 rounded-lg bg-white/5 border border-white/5 hover:border-rose-500/30 text-rose-400 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="space-y-2 max-w-[85%]">
                    <span className="text-xs font-semibold text-purple-400">Question #{idx + 1}</span>
                    <h4 className="text-base font-bold text-white leading-relaxed">{q.question}</h4>
                  </div>

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {[
                      { k: 'A', val: q.option_a },
                      { k: 'B', val: q.option_b },
                      { k: 'C', val: q.option_c },
                      { k: 'D', val: q.option_d },
                    ].map((opt) => {
                      const isCorrect = q.correct_answer === opt.k;
                      return (
                        <div
                          key={opt.k}
                          className={`p-3 rounded-lg text-xs font-semibold flex items-center space-x-2 border ${
                            isCorrect
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-white/5 border-white/5 text-slate-400'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] ${
                            isCorrect ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-500'
                          }`}>
                            {opt.k}
                          </div>
                          <span>{opt.val}</span>
                        </div>
                      );
                    })}
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>

      </main>
    </div>
  );
};
