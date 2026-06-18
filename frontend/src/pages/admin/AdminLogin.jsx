import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Lock, Settings, ChevronRight, KeyRound } from 'lucide-react';
import { Navbar } from '../../components/Navbar';

export const AdminLogin = () => {
  const [formData, setFormData] = useState({
    register_no: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.register_no || !formData.password) {
      addToast('Please fill all fields.', 'warning');
      setLoading(false);
      return;
    }

    try {
      const user = await login(formData.register_no, formData.password);
      if (!user.is_staff) {
        addToast('Access denied. Admin authorization required.', 'error');
        setLoading(false);
        return;
      }
      addToast('Admin authentication successful!', 'success');
      navigate('/admin/dashboard');
    } catch (err) {
      addToast(err.message || 'Invalid admin credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <Navbar />

      {/* Admin specific red/purple background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-700/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="flex-grow flex items-center justify-center px-4 py-12 z-10">
        <div className="max-w-md w-full glass-premium rounded-3xl p-8 border border-pink-500/20 shadow-2xl relative">
          
          {/* Header */}
          <div className="text-center space-y-3 mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
              <Settings size={32} className="animate-spin [animation-duration:8s]" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-gradient-purple">
              Organizer Console
            </h2>
            <p className="text-sm text-slate-400">
              Enter administrative credentials to access command center
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Register/Username */}
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                name="register_no"
                value={formData.register_no}
                onChange={handleInputChange}
                placeholder="Admin Register/Username"
                className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-sm font-semibold tracking-wider"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Security Password"
                className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-sm"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 font-bold text-white shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
              ) : (
                <>
                  <span>Unlock Console</span>
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
