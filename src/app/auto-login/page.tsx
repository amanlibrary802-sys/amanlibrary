'use client';

import { Suspense, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

function AutoLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Signing you in as admin...');

  useEffect(() => {
    const redirect = searchParams.get('redirect') || '/admin';

    async function autoLogin() {
      try {
        // If already logged in as admin, redirect immediately
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('students')
            .select('role')
            .eq('id', user.id)
            .single();

          if (profile?.role === 'admin') {
            router.replace(redirect);
            return;
          }
          // Logged in but not admin — sign out and re-login as admin
          await supabase.auth.signOut();
        }

        // Sign in as admin by resolving credentials first
        const res = await fetch('/api/auth/resolve-name', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: 'admin-1', pw: '7339584027' }),
        });
        const result = await res.json();
        
        if (!res.ok) throw new Error(result.error || 'Failed to resolve admin credentials');

        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: result.email,
          password: result.password,
        });

        if (authError) throw authError;

        // Verify admin role
        const { data: profile, error: profileError } = await supabase
          .from('students')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError || profile?.role !== 'admin') {
          await supabase.auth.signOut();
          throw new Error('Access denied. Not an admin account.');
        }

        setStatus('success');
        setMessage('Logged in! Redirecting...');
        router.refresh();
        setTimeout(() => router.replace(redirect), 800);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Login failed.');
      }
    }

    autoLogin();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 flex flex-col items-center gap-4 shadow-2xl">
        {status === 'loading' && <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />}
        {status === 'success' && <CheckCircle2 className="w-10 h-10 text-green-400" />}
        {status === 'error' && <AlertCircle className="w-10 h-10 text-red-400" />}
        <p className="text-white font-semibold text-lg">{message}</p>
        {status === 'error' && (
          <button
            onClick={() => router.push('/admin/login')}
            className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors"
          >
            Go to Login Page
          </button>
        )}
      </div>
    </div>
  );
}

export default function AutoLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    }>
      <AutoLoginContent />
    </Suspense>
  );
}
