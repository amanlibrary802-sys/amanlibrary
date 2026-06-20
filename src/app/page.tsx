'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import CategoryTile from '@/components/CategoryTile';
import { 
  Book, 
  GraduationCap, 
  PenTool, 
  Brain, 
  History as HistoryIcon, 
  User, 
  Atom, 
  Languages, 
  FileText, 
  Scroll,
  Search,
  ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const CATEGORY_CONFIG = [
  { name: 'Religion', icon: Book, color: 'bg-green-800' },
  { name: 'Study', icon: GraduationCap, color: 'bg-blue-800' },
  { name: 'Literature', icon: PenTool, color: 'bg-amber-800' },
  { name: 'Motivation & Psychology', icon: Brain, color: 'bg-purple-800' },
  { name: 'History', icon: HistoryIcon, color: 'bg-stone-800' },
  { name: 'Autobiography', icon: User, color: 'bg-indigo-800' },
  { name: 'Science', icon: Atom, color: 'bg-cyan-800' },
  { name: 'Language', icon: Languages, color: 'bg-rose-800' },
  { name: 'Dictionary', icon: FileText, color: 'bg-slate-800' },
  { name: 'Kithabs', icon: Scroll, color: 'bg-yellow-800' },
];

export default function Home() {
  const router = useRouter();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [stats, setStats] = useState({ totalBooks: 0, totalDepts: 0 });
  const [loading, setLoading] = useState(true);
  const [heroSearch, setHeroSearch] = useState('');

  useEffect(() => {
    async function fetchCounts() {
      try {
        const res = await fetch('/api/books/category-counts');
        if (!res.ok) throw new Error('Failed to fetch counts');
        const json = await res.json();
        setCounts(json.counts || {});
        setStats({
          totalBooks: json.totalBooks || 0,
          totalDepts: json.totalDepts || 0,
        });
      } catch (err) {
        console.error('Error fetching category counts:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCounts();
  }, []);

  return (
    <main className="min-h-screen pt-20 pb-12 px-4 sm:px-6" style={{ overflowX: 'hidden' }}>
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto mb-16 text-center relative overflow-hidden py-14 sm:py-20 px-5 sm:px-8 rounded-3xl bg-primary text-secondary">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/islamic-art.png')] pointer-events-none" />
        
        <div className="relative z-10">
          <h1 className="hero-heading text-5xl md:text-7xl font-amiri font-bold mb-5 tracking-tight">
            Knowledge is <span className="text-white italic underline decoration-secondary decoration-4 underline-offset-8">Light</span>
          </h1>
          <p className="hero-sub text-lg md:text-2xl text-cream/80 font-poppins max-w-2xl mx-auto mb-8 leading-relaxed">
            Welcome to Aman Library. Explore our vast collection of academic and classical resources tailored for your growth.
          </p>

          <div className="flex flex-col gap-3 justify-center items-center w-full">
            <div className="relative w-full max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/50 group-focus-within:text-secondary transition-colors" />
              <input 
                type="text" 
                placeholder="Search by title, author, or location..." 
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && router.push(`/student?q=${heroSearch}`)}
                className="w-full bg-cream/10 border border-secondary/20 rounded-full py-4 pl-12 pr-6 text-white placeholder:text-cream/50 focus:outline-none focus:ring-2 focus:ring-secondary/50 backdrop-blur-sm transition-all"
              />
            </div>
            <button
              onClick={() => router.push(`/student?q=${heroSearch}`)}
              className="w-full max-w-md sm:w-auto bg-secondary text-primary px-8 py-4 rounded-full font-bold hover:bg-white hover:scale-105 transition-all flex items-center justify-center gap-2 group shadow-lg"
            >
              Explore All Books
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8 sm:mb-12">
          <div>
            <h2 className="text-2xl sm:text-3xl font-amiri font-bold text-primary mb-2">Browse by Category</h2>
            <div className="h-1 w-20 bg-secondary rounded-full" />
          </div>
          <p className="text-primary/60 font-medium hidden md:block">
            {loading ? '...' : `${stats.totalDepts} Departments | ${stats.totalBooks}+ Total Books`}
          </p>
        </div>

        <div className="category-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6">
          {CATEGORY_CONFIG.map((cat) => (
            <CategoryTile 
              key={cat.name} 
              name={cat.name} 
              icon={cat.icon} 
              count={counts[cat.name] || 0} 
              color={cat.color}
              loading={loading}
              onClick={(name) => router.push(`/student?category=${encodeURIComponent(name)}`)}
            />
          ))}
        </div>
      </section>

      {/* Footer decoration */}
      <footer className="mt-20 text-center text-primary/40 text-sm font-medium">
        <p>© 2026 Aman Library. Managed by Aman College Administration.</p>
      </footer>
    </main>
  );
}

