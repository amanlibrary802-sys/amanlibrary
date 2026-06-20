'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import StudentNavbar from '@/components/StudentNavbar';
import BookCard from '@/components/BookCard';
import BookDetailModal from '@/components/BookDetailModal';
import { 
  Search, BookMarked, Library, Calendar, Clock, AlertTriangle, Loader2, User,
  Moon, GraduationCap, Feather, Flame, Landmark, UserCircle, FlaskConical, Languages, BookA, Scroll,
  Trophy, CalendarDays, TrendingUp, ChevronRight, Star, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_STYLES: Record<string, { icon: any, color: string, iconBg: string, boxHover: string, textHover: string }> = {
  'Religion': { icon: Moon, color: 'text-green-600', iconBg: 'bg-green-50 group-hover:bg-green-500 group-hover:text-white', boxHover: 'hover:border-green-300 hover:shadow-green-500/10', textHover: 'group-hover:text-green-700' },
  'Study': { icon: GraduationCap, color: 'text-blue-600', iconBg: 'bg-blue-50 group-hover:bg-blue-500 group-hover:text-white', boxHover: 'hover:border-blue-300 hover:shadow-blue-500/10', textHover: 'group-hover:text-blue-700' },
  'Literature': { icon: Feather, color: 'text-purple-600', iconBg: 'bg-purple-50 group-hover:bg-purple-500 group-hover:text-white', boxHover: 'hover:border-purple-300 hover:shadow-purple-500/10', textHover: 'group-hover:text-purple-700' },
  'Motivation and Psychology': { icon: Flame, color: 'text-orange-600', iconBg: 'bg-orange-50 group-hover:bg-orange-500 group-hover:text-white', boxHover: 'hover:border-orange-300 hover:shadow-orange-500/10', textHover: 'group-hover:text-orange-700' },
  'History': { icon: Landmark, color: 'text-stone-600', iconBg: 'bg-stone-50 group-hover:bg-stone-500 group-hover:text-white', boxHover: 'hover:border-stone-300 hover:shadow-stone-500/10', textHover: 'group-hover:text-stone-700' },
  'Auto and Biography': { icon: UserCircle, color: 'text-teal-600', iconBg: 'bg-teal-50 group-hover:bg-teal-500 group-hover:text-white', boxHover: 'hover:border-teal-300 hover:shadow-teal-500/10', textHover: 'group-hover:text-teal-700' },
  'Science': { icon: FlaskConical, color: 'text-cyan-600', iconBg: 'bg-cyan-50 group-hover:bg-cyan-500 group-hover:text-white', boxHover: 'hover:border-cyan-300 hover:shadow-cyan-500/10', textHover: 'group-hover:text-cyan-700' },
  'Language': { icon: Languages, color: 'text-indigo-600', iconBg: 'bg-indigo-50 group-hover:bg-indigo-500 group-hover:text-white', boxHover: 'hover:border-indigo-300 hover:shadow-indigo-500/10', textHover: 'group-hover:text-indigo-700' },
  'Dictionary': { icon: BookA, color: 'text-rose-600', iconBg: 'bg-rose-50 group-hover:bg-rose-500 group-hover:text-white', boxHover: 'hover:border-rose-300 hover:shadow-rose-500/10', textHover: 'group-hover:text-rose-700' },
  'Kithabs': { icon: Scroll, color: 'text-amber-600', iconBg: 'bg-amber-50 group-hover:bg-amber-500 group-hover:text-white', boxHover: 'hover:border-amber-300 hover:shadow-amber-500/10', textHover: 'group-hover:text-amber-700' }
};

const CATEGORIES = Object.keys(CATEGORY_STYLES);

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'Pending';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return dateStr;
  }
};


function StudentDashboardContent() {
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'browse' | 'my-books'>('browse');
  const [books, setBooks] = useState<any[]>([]);
  const [myTransactions, setMyTransactions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<any | null>(null);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [topReaders, setTopReaders] = useState<any[]>([]);
  const [sortOrder, setSortOrder] = useState<'top'|'least'>('top');
  const [libraryEvents, setLibraryEvents] = useState<any[]>([]);

  const fetchTopReaders = async () => {
    const { data: allStudents } = await supabase.from('students').select('id, name, batch').eq('role', 'student');
    const { data: txData } = await supabase.from('transactions').select('student_id').eq('status', 'Returned');
      
    if (allStudents) {
      const counts: Record<string, { count: number, name: string, batch: string }> = {};
      allStudents.forEach((s: any) => {
        counts[s.id] = { count: 0, name: s.name, batch: s.batch };
      });
      
      if (txData) {
        txData.forEach((tx: any) => {
          if (tx.student_id && counts[tx.student_id]) {
            counts[tx.student_id].count++;
          }
        });
      }
      
      const allReaders = Object.values(counts);
      setTopReaders(allReaders);
    }
  };

  const fetchLibraryEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const events = await res.json();
        const upcoming = events.filter((e: any) => !e.completed).slice(0, 3);
        setLibraryEvents(upcoming);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('students')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(data);
        if (categoryParam) {
          fetchBooks(categoryParam);
        }
        fetchMyTransactions(user.id);
        fetchTopReaders();
        fetchLibraryEvents();
      }
    };
    checkUser();
  }, []);

  const fetchBooks = async (category = selectedCategory) => {
    setLoading(true);
    let allBooks: any[] = [];
    let page = 0;
    
    while (true) {
      let query = supabase
        .from('books')
        .select('*')
        .range(page * 1000, (page + 1) * 1000 - 1);
        
      if (category && category !== 'All') {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching books:', error);
        break;
      }
      
      if (!data || data.length === 0) break;
      allBooks = [...allBooks, ...data];
      if (data.length < 1000) break;
      page++;
    }
    allBooks.sort((a, b) => {
      const locA = a.shelf_loc || '';
      const locB = b.shelf_loc || '';
      return locA.localeCompare(locB, undefined, { numeric: true, sensitivity: 'base' });
    });
    
    setBooks(allBooks);
    setLoading(false);
  };


  const fetchMyTransactions = async (userId?: string) => {
    const id = userId || profile?.id;
    if (!id) return;
    const { data } = await supabase
      .from('transactions')
      .select('*, books(*)')
      .eq('student_id', id)
      .order('created_at', { ascending: false });
    setMyTransactions(data || []);
  };

  const handleOrder = async (bookId: string) => {
    setOrdering(bookId);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId }),
      });

      if (response.ok) {
        setSelectedBook(null);
        
        // Optimistically update the book status locally to avoid a full list reload (lag)
        setBooks(prev => prev.map(b => 
          b.book_id === bookId ? { ...b, status: 'Ordered' } : b
        ));
        
        // Silently fetch transactions in the background
        fetchMyTransactions();
        
        alert('Book ordered successfully! Please collect it from the librarian.');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to order book');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setOrdering(null);
    }
  };

  const handleCancel = async (bookId: string) => {
    setOrdering(bookId); // Reuse ordering state for loading feedback
    try {
      const response = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId }),
      });

      if (response.ok) {
        setSelectedBook(null);
        
        // Optimistically update the book status back to Available
        setBooks(prev => prev.map(b => 
          b.book_id === bookId ? { ...b, status: 'Available' } : b
        ));
        
        // Silently refresh transactions
        fetchMyTransactions();
        
        alert('Order cancelled successfully.');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to cancel order');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setOrdering(null);
    }
  };

  let filteredBooks = books.filter(b => 
    (b.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.author || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.shelf_loc || '').toLowerCase().includes(search.toLowerCase())
  );

  if (search) {
    const q = search.toLowerCase();
    filteredBooks.sort((a, b) => {
      const getScore = (item: any) => {
        const title = (item.title || '').toLowerCase();
        const author = (item.author || '').toLowerCase();
        const loc = (item.shelf_loc || '').toLowerCase();
        
        if (title === q || loc === q) return 100;
        if (author === q) return 90;
        if (title.startsWith(q) || loc.startsWith(q)) return 80;
        if (author.startsWith(q)) return 70;
        if (title.includes(q) || loc.includes(q)) return 50;
        if (author.includes(q)) return 40;
        return 0;
      };
      
      const scoreA = getScore(a);
      const scoreB = getScore(b);
      
      if (scoreA !== scoreB) return scoreB - scoreA;
      return (a.shelf_loc || '').localeCompare(b.shelf_loc || '', undefined, { numeric: true, sensitivity: 'base' });
    });
  }

  const getDeadlineColor = (days: number) => {
    if (days > 7) return 'text-green-600 bg-green-50 border-green-100';
    if (days >= 4) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-red-600 bg-red-50 border-red-100';
  };

  const sortedReaders = [...topReaders].sort((a, b) => {
    if (sortOrder === 'top') return b.count - a.count;
    return a.count - b.count;
  }).slice(0, 3);

  if (!profile) return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-950">
      <Loader2 className="w-10 h-10 animate-spin text-slate-200" />
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(30,58,138,0.15),rgba(255,255,255,0))] pt-20 sm:pt-24 pb-12 px-4 sm:px-6">
      <StudentNavbar name={profile?.name || 'Student'} />

      {/* Book Detail Modal */}
      <BookDetailModal
        book={selectedBook}
        onClose={() => setSelectedBook(null)}
        onOrder={handleOrder}
        onCancel={handleCancel}
        ordering={ordering === selectedBook?.book_id}
      />

      <div className="max-w-7xl mx-auto space-y-10 sm:space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 sm:gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-amiri font-bold text-slate-200 leading-tight">
              Assalamu Alaikum, <span className="text-blue-400 capitalize">{profile?.name.split(' ')[0]}</span>
            </h1>
            <p className="text-slate-400 font-medium text-sm sm:text-base mt-1">Welcome to Aman Library. Discover, read, and grow.</p>
          </div>
        </div>

        {/* Top Readers and Events Stack */}
        <div className="flex flex-col gap-8">
          {/* Top Readers */}
          <div className="bg-slate-900 rounded-[2rem] p-6 sm:p-10 shadow-[0_0_40px_-15px_rgba(0,0,0,0.5)] border border-white/5 flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between gap-3 mb-8">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 tracking-tight">Top Readers</h2>
              
              <div className="bg-slate-800 rounded-xl p-1 flex items-center shadow-inner">
                <button 
                  onClick={() => setSortOrder('top')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${sortOrder === 'top' ? 'bg-blue-400 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  TOP
                </button>
                <button 
                  onClick={() => setSortOrder('least')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${sortOrder === 'least' ? 'bg-blue-400 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  LEAST
                </button>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col gap-4">
              {sortedReaders.length > 0 ? sortedReaders.map((reader, idx) => {
                let badgeClass = 'bg-slate-700 text-blue-400';
                if (idx === 0 && sortOrder === 'top') badgeClass = 'bg-yellow-500 text-slate-900 shadow-md shadow-yellow-500/20';
                if (idx === 1 && sortOrder === 'top') badgeClass = 'bg-slate-300 text-slate-900 shadow-md shadow-slate-300/20';
                if (idx === 2 && sortOrder === 'top') badgeClass = 'bg-[#cd7f32] text-white shadow-md shadow-[#cd7f32]/20';

                return (
                  <div key={idx} className="bg-slate-800/40 rounded-2xl p-4 sm:p-5 border border-white/5 flex items-center justify-between gap-4 relative hover:bg-slate-800/80 hover:border-white/10 hover:shadow-lg transition-all duration-300 group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${badgeClass}`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-200 group-hover:text-blue-400 text-base truncate leading-tight mb-0.5 transition-colors">{reader.name}</h3>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{reader.batch || 'NO BATCH'}</p>
                      </div>
                    </div>
                    <div className="text-blue-400 text-sm font-bold flex items-center gap-2 shrink-0">
                      <Trophy className="w-4 h-4 opacity-70" />
                      {reader.count} <span className="hidden sm:inline opacity-80">Books Read</span>
                    </div>
                  </div>
                );
              }) : (
                <div className="flex flex-col items-center justify-center py-8 opacity-50">
                  <Award className="w-12 h-12 text-slate-500 mb-3" />
                  <p className="text-sm font-bold text-slate-400">No reading data yet.</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Upcoming Events */}
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-[0_0_40px_-15px_rgba(0,0,0,0.5)] border border-white/5 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-200 leading-tight">Library Events</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Upcoming</p>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col md:flex-row gap-4 relative z-10">
              {libraryEvents.length > 0 ? libraryEvents.map((event, idx) => {
                let badgeColor = 'bg-secondary/20 text-secondary';
                if (event.type === 'Contest') badgeColor = 'bg-purple-500/20 text-purple-300';
                if (event.type === 'Alert') badgeColor = 'bg-red-500/20 text-red-300';
                
                return (
                  <div key={idx} className="bg-slate-800/40 border border-white/5 rounded-2xl p-5 hover:bg-slate-800/80 hover:border-white/10 transition-all duration-300 cursor-pointer group flex-1 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${badgeColor}`}>{event.time || 'Upcoming'}</span>
                      <span className="text-xs font-bold text-slate-400">{event.date}</span>
                    </div>
                    <h3 className="font-bold text-base text-slate-200 mb-1.5 group-hover:text-blue-400 transition-colors">{event.title}</h3>
                    <p className="text-sm text-slate-400 line-clamp-2">{event.description}</p>
                  </div>
                );
              }) : (
                <div className="w-full text-center py-8 text-blue-300/50 font-bold text-sm bg-blue-500/5 rounded-2xl border border-blue-500/10">
                  No upcoming events currently.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Library Section */}
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-[0_0_40px_-15px_rgba(0,0,0,0.5)] border border-white/5 relative overflow-hidden mt-6">
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -ml-20 -mt-20 pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                <Library className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white leading-tight">Library Portal</h2>
                <p className="text-xs font-bold text-blue-400/60 uppercase tracking-widest mt-1">Browse & Order</p>
              </div>
            </div>

            <div className="flex p-1 bg-slate-800/80 rounded-2xl border border-white/5 shadow-inner self-start w-full sm:w-auto shrink-0 backdrop-blur-md">
              <button
                onClick={() => setActiveTab('browse')}
                className={`flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                  activeTab === 'browse' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-slate-400 hover:text-blue-300'
                }`}
              >
                <Search className="w-4 h-4" />
                BROWSE
              </button>
              <button
                onClick={() => setActiveTab('my-books')}
                className={`flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                  activeTab === 'my-books' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-slate-400 hover:text-blue-300'
                }`}
              >
                <BookMarked className="w-4 h-4" />
                MY BOOKS
              </button>
            </div>
          </div>

        <AnimatePresence mode="wait">
          {activeTab === 'browse' ? (
            <motion.div
              key="browse"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              {!selectedCategory ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {CATEGORIES.map((cat) => {
                    const style = CATEGORY_STYLES[cat];
                    const Icon = style.icon;
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          fetchBooks(cat);
                        }}
                        className={`bg-slate-800/50 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 hover:-translate-y-1 hover:bg-slate-800 hover:border-white/10 transition-all duration-300 group shadow-sm`}
                      >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${style.iconBg} ${style.color}`}>
                          <Icon className="w-7 h-7 transition-transform duration-300 group-hover:scale-110" />
                        </div>
                        <span className={`font-bold text-white text-sm leading-tight transition-colors duration-300 group-hover:text-blue-400`}>{cat}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <>
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold text-sm bg-slate-800 border border-white/10 px-4 py-2 rounded-xl shadow-sm hover:bg-slate-700"
                    >
                      &larr; Back to Categories
                    </button>
                    <div className="text-white font-bold text-lg">
                      {selectedCategory}
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-4">
                <div className="relative group flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search by title, author, or location (e.g. R1, L45, S30)..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all"
                  />
                </div>
                
                <div className="relative w-full md:w-64 shrink-0">
                  <button
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    className="w-full flex items-center justify-between bg-slate-800/50 border border-white/10 rounded-2xl py-3.5 sm:py-4 pl-5 sm:pl-6 pr-4 sm:pr-5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all cursor-pointer font-bold text-sm hover:bg-slate-800"
                  >
                    <span className="truncate pr-2">
                      {selectedCategory === 'All' ? 'All Categories' : selectedCategory}
                    </span>
                    <svg className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-400 transition-transform shrink-0 ${isCategoryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {isCategoryOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 w-full mt-2 bg-slate-800 border border-white/10 rounded-2xl shadow-xl overflow-hidden"
                      >
                        <div className="max-h-[220px] overflow-y-auto custom-scrollbar py-1">
                          {['All', ...CATEGORIES].map((cat) => (
                            <button
                              key={cat}
                              onClick={() => {
                                setSelectedCategory(cat);
                                fetchBooks(cat);
                                setIsCategoryOpen(false);
                              }}
                              className={`w-full text-left px-5 py-2.5 text-[13px] sm:text-sm transition-colors ${
                                selectedCategory === cat 
                                  ? 'bg-blue-600/20 text-blue-400 font-bold border-l-2 border-blue-500' 
                                  : 'text-slate-300 hover:bg-slate-700/50 font-medium border-l-2 border-transparent hover:text-white'
                              }`}
                            >
                              {cat === 'All' ? 'All Categories' : cat}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {loading ? (
                <div className="py-20 flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredBooks.map(book => (
                    <BookCard 
                      key={book.book_id} 
                      book={book} 
                      onOrder={handleOrder}
                      onClick={setSelectedBook}
                      loading={ordering === book.book_id}
                      variant="list"
                      theme="dark"
                    />
                  ))}
                </div>
              )}
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="my-books"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 gap-4">
                {myTransactions.map((tx) => {
                  const daysLeft = tx.return_deadline ? Math.ceil((new Date(tx.return_deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
                  
                  return (
                    <div key={tx.transaction_id} className="bg-slate-800/50 rounded-2xl p-4 sm:px-5 sm:py-4 border border-white/5 hover:bg-slate-800 hover:border-white/10 shadow-sm transition-all flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 group">
                      
                      <div className="flex items-start sm:items-center gap-3 sm:gap-5 w-full sm:w-auto flex-1 min-w-0">
                        <div className="p-3 sm:p-3.5 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors shrink-0">
                          <BookMarked className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[15px] sm:text-base font-amiri font-bold text-white leading-tight group-hover:text-blue-400 transition-colors truncate" title={tx.books.title}>
                            {tx.books.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 text-slate-400 text-[11px] sm:text-xs mt-1 sm:mt-1.5">
                            <span className="flex items-center gap-1">
                              <User className="w-3 sm:w-3.5 h-3 sm:h-3.5 shrink-0" />
                              <span className="font-medium truncate max-w-[150px] sm:max-w-none">{tx.books.author}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto border-t border-white/5 sm:border-0 pt-3 sm:pt-0 shrink-0">
                        <div className="flex items-center gap-2 bg-slate-900/50 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-white/5 shrink-0">
                          <Calendar className="w-3.5 h-3.5 text-blue-400" />
                          <div className="text-left">
                            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase leading-none">Issue</p>
                            <p className="text-[10px] sm:text-xs font-bold text-slate-300 leading-tight mt-0.5">{formatDate(tx.issue_date)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-900/50 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-white/5 shrink-0">
                          <Clock className="w-3.5 h-3.5 text-blue-400" />
                          <div className="text-left">
                            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase leading-none">Due</p>
                            <p className="text-[10px] sm:text-xs font-bold text-slate-300 leading-tight mt-0.5">{formatDate(tx.return_deadline)}</p>
                          </div>
                        </div>

                        {daysLeft !== null && (
                          <div className={`flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border font-bold shrink-0 ${getDeadlineColor(daysLeft)}`}>
                            {daysLeft <= 3 && <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />}
                            <div className="text-left">
                              <p className="text-[9px] sm:text-[10px] uppercase opacity-60 leading-none">Left</p>
                              <p className="text-[10px] sm:text-xs leading-tight mt-0.5">{daysLeft} Days</p>
                            </div>
                          </div>
                        )}

                        <div className={`flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border font-bold text-[10px] sm:text-xs uppercase shrink-0 w-full sm:w-auto mt-1 sm:mt-0
                          ${tx.status === 'Issued' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 
                            tx.status === 'Reserved' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                            'bg-green-500/20 text-green-400 border-green-500/30'}
                        `}>
                          <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                          {tx.status}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </main>
  );
}

export default function StudentDashboard() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-primary" />
      </div>
    }>
      <StudentDashboardContent />
    </Suspense>
  );
}
