import React from 'react';
import { Link } from 'react-router-dom';
import { Award, ShieldAlert, Cpu, Trophy, ArrowRight, Zap, Target, BookOpen } from 'lucide-react';
import { Navbar } from '../components/Navbar';

export const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-grow flex flex-col justify-center items-center px-6 py-20 relative overflow-hidden">
        {/* Decorative Gradients / Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-4xl text-center space-y-8 z-10">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold tracking-wider text-purple-300 uppercase shadow-inner">
            <Zap size={14} className="text-pink-500 animate-pulse" />
            <span>Annual College Hackfest Quiz 2026</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
            Decipher the Code <br />
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-400 text-transparent bg-clip-text">
              Conquer the Quiz
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            Welcome to the ultimate arena of intellect. Compete with top minds through rigorous rounds, real-time trackers, and qualify for the final grand prize.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/login"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-bold text-white shadow-lg shadow-purple-500/25 hover:shadow-pink-500/35 transition-all duration-300 group"
            >
              <span>Enter Quiz Arena</span>
              <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/admin/login"
              className="w-full sm:w-auto px-8 py-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 font-bold transition-all duration-300"
            >
              Organizer Panel
            </Link>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 px-4 z-10">
          {/* Card 1 */}
          <div className="glass-premium p-8 rounded-2xl border border-white/5 flex flex-col space-y-4 hover:border-purple-500/30 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <BookOpen size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">Multi-Round Formats</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Progress from General MCQs to advanced specialized queries, filtering competitors at each level automatically.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-premium p-8 rounded-2xl border border-white/5 flex flex-col space-y-4 hover:border-pink-500/30 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
              <Cpu size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">Live Leaderboards</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Track results in real time. Features automatic MCQ scoring, validation constraints, and immediate status checks.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-premium p-8 rounded-2xl border border-white/5 flex flex-col space-y-4 hover:border-indigo-500/30 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Trophy size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">Grand Winner Board</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Celebrate victors with high-fidelity confetti displays, direct admin-managed announcements, and digital records.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-white/5 text-center text-slate-500 text-xs mt-10">
        &copy; {new Date().getFullYear()} College Event Quiz Committee. Built with premium designs.
      </footer>
    </div>
  );
};
