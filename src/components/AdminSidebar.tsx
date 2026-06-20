'use client';

import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Library,
  ShoppingCart,
  Users,
  Bell,
  LogOut,
  BookOpen,
  Zap,
  AlertCircle,
  ChevronDown,
  BookMarked,
  ClipboardList,
  UserCheck,
  Clock,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

// ── Nav structure ──────────────────────────────────────────────────────────────

type SubItem = { name: string; icon: React.ElementType; path: string };
type NavGroup = {
  type: 'group';
  name: string;
  icon: React.ElementType;
  children: SubItem[];
};
type NavItem = {
  type: 'link';
  name: string;
  icon: React.ElementType;
  path: string;
};
type NavEntry = NavItem | NavGroup;

const NAV: NavEntry[] = [
  {
    type: 'link',
    name: 'Overview',
    icon: LayoutDashboard,
    path: '/admin',
  },
  {
    type: 'group',
    name: 'Library Operations',
    icon: Library,
    children: [
      { name: 'Books Management', icon: BookMarked,    path: '/admin/books' },
      { name: 'Direct Issue',     icon: Zap,           path: '/admin/direct-issue' },
      { name: 'Orders Queue',     icon: ShoppingCart,  path: '/admin/orders' },
      { name: 'Active Loans',     icon: ClipboardList, path: '/admin/loans' },
    ],
  },
  {
    type: 'link',
    name: 'Student Management',
    icon: Users,
    path: '/admin/students',
  },
  {
    type: 'group',
    name: 'Alerts & Notifications',
    icon: Bell,
    children: [
      { name: '2-Week Reminders', icon: Clock,         path: '/admin/alerts/2-week' },
      { name: '3rd Week Alerts',  icon: AlertCircle,   path: '/admin/alerts/3-week' },
    ],
  },
];

// ── Component ──────────────────────────────────────────────────────────────────

export default function AdminSidebar({ mobileOpen, setMobileOpen }: { mobileOpen?: boolean, setMobileOpen?: (val: boolean) => void }) {
  const pathname = usePathname();
  const router   = useRouter();

  // Determine which groups contain the active route (auto-open them on load)
  const initialOpen = NAV.reduce<Record<string, boolean>>((acc, entry) => {
    if (entry.type === 'group') {
      const isParentActive = entry.children.some(c => pathname.startsWith(c.path));
      acc[entry.name] = isParentActive;
    }
    return acc;
  }, {});

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(initialOpen);
  const [pendingOrders, setPendingOrders] = useState(0);

  useEffect(() => {
    const fetchPendingOrders = async () => {
      const { count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Reserved');
      setPendingOrders(count || 0);
    };

    fetchPendingOrders();

    const channel = supabase.channel('pending-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, fetchPendingOrders)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Re-evaluate when route changes (e.g. navigating via link)
  useEffect(() => {
    setOpenGroups(prev => {
      const next = { ...prev };
      NAV.forEach(entry => {
        if (entry.type === 'group') {
          const isParentActive = entry.children.some(c => pathname.startsWith(c.path));
          if (isParentActive) next[entry.name] = true;
        }
      });
      return next;
    });
  }, [pathname]);

  const toggleGroup = (name: string) =>
    setOpenGroups(prev => ({ ...prev, [name]: !prev[name] }));

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="sidebar-backdrop lg:hidden z-[60]"
          onClick={() => setMobileOpen?.(false)}
          aria-hidden="true"
        />
      )}
      
      <aside
        className={`
          fixed left-0 top-0 h-screen bg-primary text-cream flex flex-col p-6 z-[70]
          border-r border-secondary/10 overflow-y-auto
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:w-72
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ width: 'min(85vw, 288px)' }}
        aria-label="Admin navigation"
      >

        {/* Mobile Header with Close Button */}
        <div className="flex lg:hidden items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="bg-secondary p-1.5 rounded-lg shrink-0">
              <BookOpen className="text-primary w-5 h-5" />
            </div>
            <span className="text-xl font-amiri font-bold tracking-wide">ADMIN</span>
          </div>
          <button 
            onClick={() => setMobileOpen?.(false)}
            className="p-2 -mr-2 text-cream/70 hover:text-cream hover:bg-white/5 rounded-full transition-colors shrink-0"
            aria-label="Close sidebar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Logo - Desktop only */}
        <div className="hidden lg:flex items-center gap-3 mb-10">
        <div className="bg-secondary p-2 rounded-xl">
          <BookOpen className="text-primary w-6 h-6" />
        </div>
        <span className="text-2xl font-amiri font-bold tracking-wide">AMAN ADMIN</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {NAV.map(entry => {
          // ── Standalone link ──
          if (entry.type === 'link') {
            const isActive = pathname === entry.path;
            return (
              <Link
                key={entry.name}
                href={entry.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 ease-in-out group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                    : 'text-cream/70 hover:bg-secondary/10 hover:text-secondary'
                }`}
              >
                <entry.icon className={`w-5 h-5 shrink-0 ${!isActive && 'group-hover:scale-110 transition-transform'}`} />
                {entry.name}
              </Link>
            );
          }

          // ── Accordion group ──
          const isOpen        = !!openGroups[entry.name];
          const anyChildActive = entry.children.some(c => pathname.startsWith(c.path));

          return (
            <div key={entry.name}>
              {/* Group header button */}
              <button
                onClick={() => toggleGroup(entry.name)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 ease-in-out group relative ${
                  anyChildActive && !isOpen
                    ? 'text-secondary bg-secondary/10'
                    : anyChildActive && isOpen
                    ? 'text-secondary'
                    : 'text-cream/70 hover:bg-secondary/10 hover:text-secondary'
                }`}
              >
                <div className="relative">
                  <entry.icon className={`w-5 h-5 shrink-0 ${!anyChildActive && 'group-hover:scale-110 transition-transform'}`} />
                  {entry.name === 'Library Operations' && pendingOrders > 0 && !isOpen && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                </div>
                <span className="flex-1 text-left">{entry.name}</span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Subtabs — animated with max-height trick via Tailwind arbitrary values */}
              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{ maxHeight: isOpen ? `${entry.children.length * 56}px` : '0px' }}
              >
                <div className="mt-1 ml-4 pl-3 border-l border-secondary/10 space-y-1">
                  {entry.children.map(child => {
                    const isChildActive = pathname.startsWith(child.path);
                    return (
                      <Link
                        key={child.name}
                        href={child.path}
                        className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all group ${
                          isChildActive
                            ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                            : 'text-cream/60 hover:bg-secondary/10 hover:text-secondary'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <child.icon className={`w-4 h-4 shrink-0 ${!isChildActive && 'group-hover:scale-110 transition-transform'}`} />
                          {child.name}
                        </div>
                        {child.name === 'Orders Queue' && pendingOrders > 0 && (
                          <div className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shrink-0">
                            {pendingOrders}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto space-y-3 pt-4">
        <div className="p-4 rounded-2xl bg-secondary/5 border border-secondary/10">
          <p className="text-[10px] uppercase font-bold text-cream/40 tracking-widest mb-1">Logged in as</p>
          <p className="text-sm font-bold truncate">Librarian Admin</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
    </>
  );
}
