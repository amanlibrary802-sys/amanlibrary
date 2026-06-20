'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import StudentNavbar from '@/components/StudentNavbar';
import BookCard from '@/components/BookCard';
import BookDetailModal from '@/components/BookDetailModal';
import { Search, BookMarked, Library, Calendar, Clock, AlertTriangle, Loader2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  'Religion', 'Study', 'Literature', 'Motivation and Psychology',
  'History', 'Auto and Biography', 'Science', 'Language',
  'Dictionary', 'Kithabs'
];

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
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<any | null>(null);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const initCategory = categoryParam || 'All';
    if (categoryParam) setSelectedCategory(initCategory);

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('students')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(data);
        fetchBooks(initCategory);
        fetchMyTransactions(user.id);
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
        
      if (category !== 'All') {
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

  if (!profile) return (
    <div className="h-screen w-full flex items-center justify-center bg-cream">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  );

  return (
    <main className="min-h-screen bg-cream pt-20 sm:pt-24 pb-12 px-4 sm:px-6">
      <StudentNavbar name={profile?.name || 'Student'} />

      {/* Book Detail Modal */}
      <BookDetailModal
        book={selectedBook}
        onClose={() => setSelectedBook(null)}
        onOrder={handleOrder}
        onCancel={handleCancel}
        ordering={ordering === selectedBook?.book_id}
      />

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6 mb-8 sm:mb-10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-amiri font-bold text-primary leading-tight">Assalamu Alaikum, {profile?.name.split(' ')[0]}</h1>
            <p className="text-primary/60 font-medium text-sm sm:text-base mt-1">Manage your book readings and discoveries.</p>
          </div>

          <div className="flex p-1 bg-white rounded-2xl border border-secondary/10 shadow-sm self-start w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('browse')}
              className={`flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                activeTab === 'browse' ? 'bg-primary text-secondary shadow-md' : 'text-primary/40 hover:text-primary'
              }`}
            >
              <Library className="w-4 h-4" />
              BROWSE
            </button>
            <button
              onClick={() => setActiveTab('my-books')}
              className={`flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                activeTab === 'my-books' ? 'bg-primary text-secondary shadow-md' : 'text-primary/40 hover:text-primary'
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
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative group flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/30 group-focus-within:text-secondary transition-colors" />
                  <input
                    type="text"
                    placeholder="Search by title, author, or location (e.g. R1, L45, S30)..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white border border-secondary/20 rounded-2xl py-4 pl-12 pr-6 text-primary focus:outline-none focus:ring-2 focus:ring-secondary/50 shadow-sm transition-all"
                  />
                </div>
                
                <div className="relative w-full md:w-64 shrink-0">
                  <button
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    className="w-full flex items-center justify-between bg-white border border-secondary/20 rounded-2xl py-3.5 sm:py-4 pl-5 sm:pl-6 pr-4 sm:pr-5 text-primary focus:outline-none focus:ring-2 focus:ring-secondary/50 shadow-sm transition-all cursor-pointer font-bold text-sm"
                  >
                    <span className="truncate pr-2">
                      {selectedCategory === 'All' ? 'All Categories' : selectedCategory}
                    </span>
                    <svg className={`w-4 h-4 sm:w-5 sm:h-5 text-primary/40 transition-transform shrink-0 ${isCategoryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        className="absolute z-50 w-full mt-2 bg-white border border-secondary/10 rounded-2xl shadow-xl overflow-hidden"
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
                                  ? 'bg-indigo-50 text-indigo-700 font-bold border-l-2 border-indigo-600' 
                                  : 'text-primary/80 hover:bg-slate-50 font-medium border-l-2 border-transparent'
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
                    />
                  ))}
                </div>
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
                    <div key={tx.transaction_id} className="bg-white rounded-2xl p-4 sm:px-5 sm:py-4 border border-secondary/10 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 group">
                      
                      <div className="flex items-start sm:items-center gap-3 sm:gap-5 w-full sm:w-auto flex-1 min-w-0">
                        <div className="p-3 sm:p-3.5 rounded-xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-secondary transition-colors shrink-0">
                          <BookMarked className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[15px] sm:text-base font-amiri font-bold text-primary leading-tight group-hover:text-secondary transition-colors truncate" title={tx.books.title}>
                            {tx.books.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 text-primary/60 text-[11px] sm:text-xs mt-1 sm:mt-1.5">
                            <span className="flex items-center gap-1">
                              <User className="w-3 sm:w-3.5 h-3 sm:h-3.5 shrink-0" />
                              <span className="font-medium truncate max-w-[150px] sm:max-w-none">{tx.books.author}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto border-t border-secondary/5 sm:border-0 pt-3 sm:pt-0 shrink-0">
                        <div className="flex items-center gap-2 bg-cream/50 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-secondary/10 shrink-0">
                          <Calendar className="w-3.5 h-3.5 text-secondary" />
                          <div className="text-left">
                            <p className="text-[9px] sm:text-[10px] font-bold text-primary/40 uppercase leading-none">Issue</p>
                            <p className="text-[10px] sm:text-xs font-bold text-primary leading-tight mt-0.5">{formatDate(tx.issue_date)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 bg-cream/50 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-secondary/10 shrink-0">
                          <Clock className="w-3.5 h-3.5 text-secondary" />
                          <div className="text-left">
                            <p className="text-[9px] sm:text-[10px] font-bold text-primary/40 uppercase leading-none">Due</p>
                            <p className="text-[10px] sm:text-xs font-bold text-primary leading-tight mt-0.5">{formatDate(tx.return_deadline)}</p>
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
                          ${tx.status === 'Issued' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                            tx.status === 'Reserved' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            'bg-green-50 text-green-600 border-green-100'}
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
