'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import AdminSidebar from '@/components/AdminSidebar';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    // Close mobile menu on route change
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/admin/login');
        return;
      }

      const { data } = await supabase
        .from('students')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (data?.role !== 'admin') {
        router.push('/student');
        return;
      }

      setLoading(false);
    };

    checkAdmin();
  }, [router, isLoginPage]);

  // Login page: render standalone, no sidebar, no loading check
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-primary">
        <Loader2 className="w-10 h-10 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row bg-cream min-h-screen" style={{ overflowX: 'hidden' }}>
      {/* Mobile Top Bar — sticky, z-40, 44px touch targets */}
      <div className="lg:hidden flex items-center justify-between bg-primary text-secondary px-4 py-3 sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="bg-secondary p-1.5 rounded-lg shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          </div>
          <span className="text-[1.05rem] font-amiri font-bold tracking-wide leading-none">AMAN ADMIN</span>
        </div>
        {/* Hamburger — min 44×44px tap target */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="mobile-menu-btn rounded-xl bg-secondary/10 active:bg-secondary/25 transition-colors"
          aria-label="Toggle navigation menu"
          style={{ minWidth: 44, minHeight: 44 }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {mobileMenuOpen
              ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              : <><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></>
            }
          </svg>
        </button>
      </div>

      <AdminSidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />
      
      {/* Main content — proper mobile padding, no horizontal overflow */}
      <main
        className="flex-1 lg:ml-72 w-full mt-0"
        style={{ padding: 'clamp(16px, 4vw, 40px)', overflowX: 'hidden' }}
      >
        {children}
      </main>
    </div>
  );
}
