'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, User as UserIcon, Loader2, ArrowRight, BookOpen, Star, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const floatingBooks = [
  { title: 'Sahih al-Bukhari', top: '12%', left: '6%', delay: 0 },
  { title: 'The Alchemist', top: '68%', left: '4%', delay: 0.4 },
  { title: 'Atomic Habits', top: '30%', right: '5%', delay: 0.8 },
  { title: 'Sapiens', top: '72%', right: '7%', delay: 1.2 },
];

export default function StudentLoginPage() {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/resolve-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, pw }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Login failed');
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: result.email,
        password: result.password,
      });

      if (authError) throw authError;

      setSuccess(true);
      router.refresh();
      // Redirect based on role if they happen to be an admin logging in here
      if (result.role === 'admin') {
        setTimeout(() => router.push('/admin'), 800);
      } else {
        setTimeout(() => router.push('/student'), 800);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Check if already logged in to auto-redirect
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/student');
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--brand-dark)] via-[var(--brand-primary)] to-[var(--brand-dark)] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(212,175,55,0.08)_1px,transparent_0)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute rounded-full blur-[60px] pointer-events-none w-[400px] h-[400px] bg-[var(--brand-accent)]/5 -top-[100px] -left-[100px] animate-[orbPulse_8s_ease-in-out_infinite]" />
      <div className="absolute rounded-full blur-[60px] pointer-events-none w-[300px] h-[300px] bg-[var(--brand-accent)]/4 -bottom-[80px] -right-[80px] animate-[orbPulse_10s_ease-in-out_infinite_reverse]" />
      <div className="absolute rounded-full blur-[60px] pointer-events-none w-[200px] h-[200px] bg-white/2 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[orbPulse_6s_ease-in-out_infinite]" />

      {/* Floating Book Tags */}
      {floatingBooks.map((book, i) => (
        <motion.div
          key={i}
          className="absolute bg-white/5 border border-[var(--brand-accent)]/15 rounded-full px-[0.9rem] py-[0.4rem] items-center gap-[0.4rem] text-[0.7rem] text-white/55 backdrop-blur-md whitespace-nowrap pointer-events-none hidden sm:flex"
          style={{ top: book.top, left: book.left, right: book.right } as any}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: [0, -10, 0] }}
          transition={{
            opacity: { delay: book.delay, duration: 0.6 },
            y: { delay: book.delay, duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          <BookOpen className="w-3.5 h-3.5 text-[var(--brand-accent)]" />
          <span>{book.title}</span>
        </motion.div>
      ))}

      <div className="w-full max-w-[440px] flex flex-col items-center gap-6 relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/" className="flex items-center gap-3 no-underline transition-opacity hover:opacity-85">
            <div className="bg-gradient-to-br from-[var(--brand-accent)] to-[var(--brand-accent-dark)] w-12 h-12 rounded-[14px] flex items-center justify-center shadow-[0_4px_20px_rgba(212,175,55,0.3)]">
              <BookOpen className="w-7 h-7 text-[var(--brand-dark)]" />
            </div>
            <div>
              <p className="text-[1.3rem] font-extrabold text-white tracking-tight leading-tight m-0">Aman Library</p>
              <p className="text-[0.7rem] text-[var(--brand-accent)]/70 font-semibold tracking-widest uppercase m-0 mt-0.5">Student Portal</p>
            </div>
          </Link>
        </motion.div>

        {/* Role Toggle Pill */}
        <div className="bg-black/20 p-1 rounded-full flex gap-1 w-full max-w-[280px] mx-auto z-10 backdrop-blur-sm border border-white/10">
          <button className="flex-1 text-sm font-bold py-2 rounded-full bg-[var(--brand-accent)] text-[var(--brand-dark)] shadow-sm transition-all">
            Student
          </button>
          <button 
            onClick={() => router.push('/admin/login')}
            className="flex-1 text-sm font-bold py-2 rounded-full text-white/70 hover:text-white transition-all"
          >
            Admin
          </button>
        </div>

        {/* Card */}
        <motion.div
          className="w-full bg-white rounded-[24px] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.4)] border border-[var(--brand-accent)]/15 login-card"
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Card Header */}
          <div className="bg-gradient-to-br from-[var(--brand-dark)] to-[var(--brand-primary)] p-7 flex items-center gap-4 border-b border-[var(--brand-accent)]/20">
            <div className="w-12 h-12 bg-[var(--brand-accent)]/15 border border-[var(--brand-accent)]/30 rounded-[14px] flex items-center justify-center shrink-0">
              <UserIcon className="w-6 h-6 text-[var(--brand-accent)]" />
            </div>
            <div>
              <h1 className="text-[1.4rem] font-extrabold text-white tracking-tight m-0">Welcome Back</h1>
              <p className="text-[0.78rem] text-white/55 m-0 mt-1 leading-relaxed">Enter your ID & PW to access your library</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-8 flex flex-col gap-5">
            <AnimatePresence>
              {error && (
                <motion.div
                  className="bg-red-50 border border-red-200 border-l-4 border-l-red-500 rounded-lg p-3 text-red-600 text-sm font-semibold overflow-hidden"
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <span>⚠ {error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ID Field */}
            <div className="flex flex-col gap-2">
              <label className="text-[0.72rem] font-bold text-[var(--brand-dark)]/65 uppercase tracking-wider pl-1">Login ID</label>
              <div className="relative group">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[var(--brand-dark)]/30 group-focus-within:text-[var(--brand-accent)] transition-colors pointer-events-none" />
                <input
                  id="student-id"
                  name="username"
                  autoComplete="username"
                  type="text"
                  required
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  className="w-full bg-[var(--brand-bg)] border border-[var(--brand-dark)]/12 rounded-[14px] py-4 pl-12 pr-4 text-sm font-medium text-[var(--brand-dark)] outline-none transition-all focus:border-[var(--brand-accent)] focus:bg-white focus:ring-2 focus:ring-[var(--brand-accent)]/10"
                  placeholder="Enter your ID"
                />
              </div>
            </div>

            {/* PW Field */}
            <div className="flex flex-col gap-2">
              <label className="text-[0.72rem] font-bold text-[var(--brand-dark)]/65 uppercase tracking-wider pl-1">Password (PW)</label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[var(--brand-dark)]/30 group-focus-within:text-[var(--brand-accent)] transition-colors pointer-events-none" />
                <input
                  id="student-pw"
                  name="password"
                  autoComplete="current-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  className="w-full bg-[var(--brand-bg)] border border-[var(--brand-dark)]/12 rounded-[14px] py-4 pl-12 pr-12 text-sm font-medium text-[var(--brand-dark)] outline-none transition-all focus:border-[var(--brand-accent)] focus:bg-white focus:ring-2 focus:ring-[var(--brand-accent)]/10"
                  placeholder="Enter your PW"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--brand-dark)]/40 hover:text-[var(--brand-dark)]/70 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading || success}
              className="bg-gradient-to-br from-[var(--brand-dark)] to-[var(--brand-primary)] text-[var(--brand-accent)] border-none rounded-[14px] py-[1.1rem] text-sm font-bold flex items-center justify-center gap-2.5 w-full mt-2 shadow-[0_4px_20px_rgba(13,43,26,0.25)] hover:shadow-[0_6px_28px_rgba(13,43,26,0.35)] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {success ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Redirecting...
                </>
              ) : loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Access Library
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </form>

          {/* Footer Note */}
          <div className="p-5 border-t border-[var(--brand-dark)]/5 text-center">
            <p className="text-xs text-[var(--brand-dark)]/50 m-0">
              Don&apos;t have an account? <span className="text-[var(--brand-accent)] font-bold cursor-pointer">Contact the Librarian</span>
            </p>
          </div>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          className="flex gap-3 flex-wrap justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {['No password needed', 'Secure & Private', 'Instant Access'].map((badge) => (
            <div key={badge} className="flex items-center gap-1.5 text-[0.72rem] text-white/50 bg-white/5 border border-white/8 rounded-full px-3 py-1.5">
              <Star className="w-3 h-3 text-[var(--brand-accent)]" />
              <span>{badge}</span>
            </div>
          ))}
        </motion.div>

        <Link href="/" className="text-[0.82rem] text-white/35 no-underline transition-colors hover:text-[var(--brand-accent)]/80">
          ← Back to Homepage
        </Link>
      </div>

    </div>
  );
}
