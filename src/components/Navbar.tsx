'use client';

import Link from 'next/link';
import { BookOpen, User, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-primary/95 backdrop-blur-sm border-b border-secondary/20 px-3 py-3 sm:px-6 sm:py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center gap-2">
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="bg-secondary p-1.5 sm:p-2 rounded-lg group-hover:rotate-12 transition-transform">
            <BookOpen className="text-primary w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <span className="text-[15px] sm:text-2xl font-amiri font-bold text-secondary tracking-wide whitespace-nowrap">
            AMAN LIBRARY
          </span>
        </Link>

        <div className="flex gap-2 sm:gap-4 shrink-0">
          <Link 
            href="/login" 
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-secondary/10 text-secondary border border-secondary/30 hover:bg-secondary hover:text-primary transition-all font-medium text-xs sm:text-sm"
          >
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Student</span>
          </Link>
          <Link 
            href="/admin/login" 
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-transparent text-secondary/80 hover:text-secondary transition-all font-medium border border-transparent hover:border-secondary/20 text-xs sm:text-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Admin</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
