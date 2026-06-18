import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Lock, User, Mail, GraduationCap, ChevronRight, KeyRound } from 'lucide-react';
import { Navbar } from '../components/Navbar';

export const LoginPage = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    register_no: '',
    department: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
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

    try {
      if (isRegister) {
        // Validation check
        if (!formData.name || !formData.register_no || !formData.department || !formData.email || !formData.password) {
          addToast('Please fill all registration fields.', 'warning');
          setLoading(false);
          return;
        }
        await register(
          formData.name,
          formData.register_no,
          formData.department,
          formData.email,
          formData.password
        );
        addToast('Registration successful! Please login.', 'success');
        setIsRegister(false);
      } else {
        if (!formData.register_no || !formData.password) {
          addToast('Please fill all fields.', 'warning');
          setLoading(false);
          return;
        }
        const user = await login(formData.register_no, formData.password);
        addToast(`Welcome back, ${user.name}!`, 'success');
        if (user.is_staff) {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      addToast(err.message || 'Authentication failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <Navbar />

      {/* Background Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="flex-grow flex items-center justify-center px-4 py-12 z-10">
        <div className="max-w-md w-full glass-premium rounded-3xl p-8 border border-white/10 shadow-2xl relative">
          
          {/* Header */}
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight">
              {isRegister ? 'Create Account' : 'Participant Login'}
            </h2>
            <p className="text-sm text-slate-400">
              {isRegister ? 'Register your college details' : 'Enter your credentials to enter quiz arena'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {isRegister && (
              <>
                {/* Full Name */}
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Full Name"
                    className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-sm"
                  />
                </div>

                {/* Email Address */}
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email Address"
                    className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-sm"
                  />
                </div>

                {/* Department */}
                <div className="relative">
                  <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="Department (e.g. CSE, ECE)"
                    className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-sm"
                  />
                </div>
              </>
            )}

            {/* Register Number */}
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                name="register_no"
                value={formData.register_no}
                onChange={handleInputChange}
                placeholder="Register Number"
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
                placeholder="Password"
                className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-sm"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-bold text-white shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
              ) : (
                <>
                  <span>{isRegister ? 'Register Now' : 'Enter Arena'}</span>
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <div className="text-center mt-6 text-sm text-slate-400">
            {isRegister ? (
              <p>
                Already registered?{' '}
                <button
                  onClick={() => setIsRegister(false)}
                  className="text-pink-400 hover:underline font-medium"
                >
                  Login Here
                </button>
              </p>
            ) : (
              <p>
                First time?{' '}
                <button
                  onClick={() => setIsRegister(true)}
                  className="text-pink-400 hover:underline font-medium"
                >
                  Register Account
                </button>
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
