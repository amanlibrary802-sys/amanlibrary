'use client';

import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LogOut, User, BookOpen } from 'lucide-react';

interface StudentNavbarProps {
  name: string;
}

export default function StudentNavbar({ name }: StudentNavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-primary/95 backdrop-blur-sm border-b border-secondary/20 px-3 py-3 sm:px-6 sm:py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-secondary p-1.5 sm:p-2 rounded-lg">
            <BookOpen className="text-primary w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <span className="text-[15px] sm:text-2xl font-amiri font-bold text-secondary tracking-wide whitespace-nowrap">
            AMAN LIBRARY
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-secondary/10 rounded-full border border-secondary/30">
            <User className="text-secondary w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="font-bold text-xs sm:text-sm text-secondary truncate max-w-[80px] sm:max-w-[150px] whitespace-nowrap">{name}</span>
          </div>
          
          <button 
            onClick={handleLogout}
            className="text-secondary/60 hover:text-red-400 transition-colors flex items-center gap-1.5 sm:gap-2 font-bold text-xs sm:text-sm shrink-0"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">LOGOUT</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
