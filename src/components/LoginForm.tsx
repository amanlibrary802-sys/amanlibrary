'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Loader2, ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
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
      let emailToUse = id;
      let passwordToUse = pw;

      if (!id.includes('@')) {
        // Resolve ID + PW using the API
        const res = await fetch('/api/auth/resolve-name', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, pw }),
        });

        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || 'Invalid ID or PW');
        }

        emailToUse = result.email;
        passwordToUse = result.password;
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({ email: emailToUse, password: passwordToUse });
      if (authError) throw new Error('Invalid ID or PW');

      // Verify admin role
      const { data: profile, error: profileError } = await supabase
        .from('students')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError || profile?.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('Access denied. Admin privileges required.');
      }

      setSuccess(true);
      router.refresh();
      setTimeout(() => router.push('/admin'), 800);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="w-full max-w-[420px] bg-white rounded-[24px] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.4)] border border-blue-500/15 login-card"
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay: 0.1 }}
    >
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-b border-slate-200 p-8 text-center">
        <h2 className="text-[1.6rem] font-extrabold text-slate-900 tracking-tight mb-1">Admin Sign In</h2>
        <p className="text-xs text-slate-500 leading-relaxed">Enter your ID & PW to continue</p>
      </div>

      <form onSubmit={handleLogin} className="p-8 flex flex-col gap-5">
        <AnimatePresence>
          {error && (
            <motion.div
              className="bg-red-50 border border-red-200 border-l-4 border-l-red-500 rounded-lg p-3 text-red-600 text-sm font-semibold overflow-hidden"
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              ⚠ {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ID */}
        <div className="flex flex-col gap-2">
          <label className="text-[0.72rem] font-bold text-slate-400 uppercase tracking-wider pl-1">Login ID</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-300 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
            <input
              id="admin-id"
              type="text"
              required
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-[14px] py-4 pl-12 pr-4 text-sm font-medium text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
              placeholder="e.g. admin-1 or email"
            />
          </div>
        </div>

        {/* PW */}
        <div className="flex flex-col gap-2">
          <label className="text-[0.72rem] font-bold text-slate-400 uppercase tracking-wider pl-1">Password (PW)</label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-300 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
            <input
              id="admin-pw"
              type={showPassword ? 'text' : 'password'}
              required
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-[14px] py-4 pl-12 pr-12 text-sm font-medium text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
            </button>
          </div>
        </div>

        <motion.button
          type="submit"
          disabled={loading || success}
          className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none rounded-[14px] py-[1.1rem] text-sm font-bold flex items-center justify-center gap-2.5 w-full mt-2 shadow-[0_4px_20px_rgba(15,23,42,0.25)] hover:shadow-[0_6px_28px_rgba(15,23,42,0.35)] duration-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          {success ? (
            <><CheckCircle2 className="w-5 h-5" /> Redirecting...</>
          ) : loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>Sign In <ArrowRight className="w-5 h-5" /></>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}
