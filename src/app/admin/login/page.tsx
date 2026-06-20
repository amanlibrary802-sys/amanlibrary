import LoginForm from '@/components/LoginForm';
import Link from 'next/link';
import { ShieldCheck, BookOpen } from 'lucide-react';

export const metadata = {
  title: 'Admin Login | Aman Library',
};

export default function AdminLoginPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* Dot grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(59,130,246,0.08) 1px, transparent 0)',
        backgroundSize: '28px 28px',
      }} />
      {/* Orbs */}
      <div style={{
        position: 'absolute', borderRadius: '50%',
        width: 380, height: 380,
        background: 'rgba(59,130,246,0.08)',
        filter: 'blur(70px)',
        top: -80, right: -80, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', borderRadius: '50%',
        width: 300, height: 300,
        background: 'rgba(59,130,246,0.05)',
        filter: 'blur(70px)',
        bottom: -60, left: -60, pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '1.25rem',
        position: 'relative', zIndex: 10, width: '100%',
      }}>
        {/* Logo */}
        <Link href="/" style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          textDecoration: 'none', opacity: 1,
        }}>
          <div style={{
            width: 48, height: 48,
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(59,130,246,0.35)',
          }}>
            <BookOpen style={{ width: 28, height: 28, color: '#ffffff' }} />
          </div>
          <div>
            <p style={{
              fontSize: '1.3rem', fontWeight: 800, color: '#ffffff',
              letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2,
            }}>Aman Library</p>
            <p style={{
              fontSize: '0.68rem', color: 'rgba(148,163,184,0.8)',
              fontWeight: 600, letterSpacing: '0.1em',
              textTransform: 'uppercase' as const, margin: 0,
            }}>Administration</p>
          </div>
        </Link>

        {/* Badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          background: 'rgba(59,130,246,0.12)',
          border: '1px solid rgba(59,130,246,0.25)',
          borderRadius: 50, padding: '0.4rem 1rem',
          fontSize: '0.72rem', fontWeight: 700,
          color: 'rgba(96,165,250,0.9)',
          letterSpacing: '0.05em', textTransform: 'uppercase' as const,
        }}>
          <ShieldCheck style={{ width: 14, height: 14 }} />
          <span>Secure Admin Access</span>
        </div>

        {/* Role Toggle Pill */}
        <div className="bg-black/20 p-1 rounded-full flex gap-1 w-full max-w-[280px] mx-auto z-10 backdrop-blur-sm border border-white/10 mt-2 mb-2">
          <Link href="/login" className="flex-1 text-center text-sm font-bold py-2 rounded-full text-white/70 hover:text-white transition-all no-underline">
            Student
          </Link>
          <div className="flex-1 text-center text-sm font-bold py-2 rounded-full bg-blue-500 text-white shadow-sm transition-all">
            Admin
          </div>
        </div>

        {/* Form Component */}
        <div className="login-card-wrapper w-full flex justify-center">
          <LoginForm />
        </div>

        <Link href="/" style={{
          fontSize: '0.82rem', color: 'rgba(255,255,255,0.3)',
          textDecoration: 'none', marginTop: '0.25rem',
        }}>
          ← Back to Homepage
        </Link>
      </div>
    </main>
  );
}
