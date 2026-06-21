'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  Loader2, 
  Library,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  'Religion', 'Study', 'Literature', 'Motivation and Psychology',
  'History', 'Auto and Biography', 'Science', 'Language',
  'Dictionary', 'Kithabs'
];

// Each category maps to a unique shelf prefix
const CATEGORY_PREFIX: Record<string, string> = {
  'Religion':                   'R',
  'Study':                      'S',
  'Literature':                 'L',
  'Motivation and Psychology':  'M',
  'Motivation & Psychology':    'M',  // legacy alias
  'History':                    'H',
  'Auto and Biography':         'A',
  'Autobiography':              'A',  // legacy alias
  'Science':                    'Sc',
  'Language':                   'La',
  'Dictionary':                 'D',
  'Kithabs':                    'K',
};

// Normalises any legacy category name variation to the canonical DB value.
// This keeps display consistent even if old books used different spellings.
const normalizeCategory = (cat: string): string => {
  const map: Record<string, string> = {
    'motivation & psychology':  'Motivation and Psychology',
    'motivation and psychology': 'Motivation and Psychology',
    'autobiography':            'Auto and Biography',
    'auto and biography':       'Auto and Biography',
  };
  return map[cat.toLowerCase()] ?? cat;
};

// Returns next shelf location for a category, e.g. "S-45"
const getNextShelfLoc = (category: string, existingBooks: any[]): string => {
  const prefix = CATEGORY_PREFIX[category] ?? category[0].toUpperCase();
  const count = existingBooks.filter(b =>
    (b.shelf_loc || '').toUpperCase().startsWith(prefix.toUpperCase())
  ).length;
  return `${prefix}${count + 1}`;
};

// Formats an existing shelf_loc for display.
// Legacy entries that are plain numbers get the category prefix prepended.
// Already-formatted entries (start with a letter) are returned as-is.
const formatShelfLoc = (loc: string | null | undefined, category: string): string => {
  if (!loc) return 'N/A';
  if (/^[A-Za-z]/i.test(loc)) return loc.toUpperCase(); // already has prefix
  const prefix = CATEGORY_PREFIX[category] ?? category[0].toUpperCase();
  return `${prefix}${loc}`; // legacy plain number → prefix it
};

export default function BookManagement() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<any>(null);
  const [bulkText, setBulkText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: 'Religion',
    shelf_loc: '',
    total_copies: 1
  });

  useEffect(() => {
    fetchBooks();
  }, []);

  // When books load, seed the default shelf_loc for the initial category
  useEffect(() => {
    if (books.length > 0 && !editingBook) {
      setFormData(prev => ({
        ...prev,
        shelf_loc: prev.shelf_loc || getNextShelfLoc(prev.category, books)
      }));
    }
  }, [books]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchBooks = async () => {
    let allBooks: any[] = [];
    let page = 0;
    
    while (true) {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * 1000, (page + 1) * 1000 - 1);
        
      if (error) {
        console.error('[fetchBooks]', error.message);
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

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    setLoading(true);
    // Snapshot current books for shelf-loc counting
    const { data: currentBooks } = await supabase.from('books').select('shelf_loc, category');
    const allBooks = currentBooks || [];
    // Track newly added prefixes within this bulk batch
    const batchCounters: Record<string, number> = {};

    const lines = bulkText.split('\n');
    const newBooks = lines.map(line => {
      const [title, author, category, shelf] = line.split(',').map(s => s.trim());
      if (!title || !author) return null;
      const resolvedCategory = normalizeCategory(
        CATEGORIES.includes(category) ? category : (category || 'Religion')
      );
      const prefix = CATEGORY_PREFIX[resolvedCategory] ?? resolvedCategory[0].toUpperCase();

      let resolvedShelf = shelf;
      if (!resolvedShelf) {
        // Count existing + already queued in this batch
        const existingCount = allBooks.filter(b =>
          (b.shelf_loc || '').toUpperCase().startsWith(prefix.toUpperCase())
        ).length;
        const batchCount = batchCounters[prefix] ?? 0;
        resolvedShelf = `${prefix}${existingCount + batchCount + 1}`;
        batchCounters[prefix] = batchCount + 1;
      }

      return {
        title,
        author,
        category: resolvedCategory,
        shelf_loc: resolvedShelf,
        total_copies: 1
      };
    }).filter(Boolean);

    if (newBooks.length > 0) {
      try {
        const response = await fetch('/api/admin/books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newBooks),
        });
        
        if (response.ok) {
          alert(`Successfully added ${newBooks.length} books!`);
          setBulkText('');
          setIsBulkModalOpen(false);
          fetchBooks();
        } else {
          const res = await response.json();
          alert(res.error || 'Failed to bulk add books');
        }
      } catch (err) {
        alert('Network error during bulk add.');
      }
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingBook) {
        const response = await fetch(`/api/admin/books/${editingBook.book_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!response.ok) {
          const res = await response.json();
          alert(res.error || 'Failed to update book');
          setLoading(false);
          return;
        }
      } else {
        const response = await fetch('/api/admin/books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([formData]), // Wrapped in array as route supports bulk/single array insert
        });
        if (!response.ok) {
          const res = await response.json();
          alert(res.error || 'Failed to add book');
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      alert('Network error');
      setLoading(false);
      return;
    }

    setFormData({ title: '', author: '', category: 'Religion', shelf_loc: getNextShelfLoc('Religion', books), total_copies: 1 });
    setEditingBook(null);
    setIsModalOpen(false);
    await fetchBooks();
  };

  const deleteBook = async (id: string) => {
    setIsDeleting(id);
    try {
      const response = await fetch(`/api/admin/books/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Failed to delete book');
      } else {
        fetchBooks();
      }
    } catch (err) {
      alert('Network error occurred while trying to delete.');
    } finally {
      setIsDeleting(null);
      setConfirmDeleteId(null);
    }
  };

  let filteredBooks = books.filter(b => {
    const catMatch =
      selectedCategory === 'All' ||
      (b.category || '').toLowerCase() === selectedCategory.toLowerCase();
    const q = search.toLowerCase().trim();
    const searchMatch =
      (b.title || '').toLowerCase().includes(q) ||
      (b.author || '').toLowerCase().includes(q) ||
      formatShelfLoc(b.shelf_loc, b.category || '').toLowerCase().includes(q);
    return catMatch && searchMatch;
  });

  if (search.trim()) {
    const q = search.toLowerCase().trim();
    filteredBooks.sort((a, b) => {
      const getScore = (item: any) => {
        const title = (item.title || '').toLowerCase();
        const author = (item.author || '').toLowerCase();
        const loc = formatShelfLoc(item.shelf_loc, item.category || '').toLowerCase();
        
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

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-amiri font-bold text-slate-200 mb-2">Book Management</h1>
          <p className="text-slate-400 font-medium">Add, update or remove books from the library.</p>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full md:w-auto mt-4 md:mt-0">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex-1 md:flex-none bg-slate-800 text-slate-200 border border-white/10 px-3 py-3 sm:px-6 sm:py-4 rounded-xl sm:rounded-2xl font-bold hover:bg-slate-700/10 transition-all shadow-sm flex items-center justify-center gap-1.5 sm:gap-2 group text-xs sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            BULK ADD
          </button>
          <button
            onClick={() => {
              setEditingBook(null);
              setFormData({ title: '', author: '', category: 'Religion', shelf_loc: getNextShelfLoc('Religion', books), total_copies: 1 });
              setIsModalOpen(true);
            }}
            className="flex-1 md:flex-none bg-slate-800 text-white border border-white/10 hover:bg-slate-700 px-3 py-3 sm:px-6 sm:py-4 rounded-xl sm:rounded-2xl font-bold hover:scale-105 transition-all shadow-lg flex items-center justify-center gap-1.5 sm:gap-2 group text-xs sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform" />
            ADD NEW
            <span className="hidden sm:inline"> BOOK</span>
          </button>
        </div>
      </div>

      {/* Search Bar & Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative group flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
          <input
            type="text"
            placeholder="Search by title, author, or location (e.g. R1, L45, S30)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 pl-16 pr-8 text-slate-200 focus:outline-none focus:ring-2 focus:ring-secondary/50 shadow-sm transition-all text-base font-medium"
          />
        </div>

        <div className="relative self-start md:self-auto w-auto md:w-64 shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
            className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 pl-6 pr-12 text-slate-200 focus:outline-none focus:ring-2 focus:ring-secondary/50 shadow-sm transition-all text-left flex items-center justify-between h-full font-bold text-sm"
          >
            <span className="truncate">
              {selectedCategory === 'All' ? 'All Categories' : selectedCategory}
            </span>
            <ChevronDown className={`absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {isCategoryDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute z-50 w-full mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-xl overflow-hidden py-2"
              >
                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                  <button
                    onClick={() => { setSelectedCategory('All'); setIsCategoryDropdownOpen(false); }}
                    className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors ${selectedCategory === 'All' ? 'bg-secondary/10 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                  >
                    All Categories
                  </button>
                  {CATEGORIES.filter(cat => books.some(b => (b.category || '').toLowerCase() === cat.toLowerCase())).map(cat => (
                    <button
                      key={cat}
                      onClick={() => { setSelectedCategory(cat); setIsCategoryDropdownOpen(false); }}
                      className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors ${selectedCategory === cat ? 'bg-secondary/10 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Books Table — card layout on mobile */}
      <div className="bg-slate-900 rounded-3xl border border-white/5 shadow-sm overflow-hidden mobile-card-table-wrapper">
        <table className="w-full text-left mobile-card-table">
          <thead className="bg-slate-800 border-b border-white/5">
            <tr>
              <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest w-[35%]">Book Info</th>
              <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest w-[25%] min-w-[160px]">Category</th>
              <th className="px-4 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap w-[10%] text-center">Location</th>
              <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap w-[15%]">Status</th>
              <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right w-[15%]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredBooks.map((book) => (
              <tr key={book.book_id} className="hover:bg-slate-800/50 transition-colors group">
                <td className="px-8 py-6" data-label="Book Info">
                  <div className="text-[13px] font-bold text-slate-200 group-hover:text-blue-400 transition-colors" title={book.title}>
                    {book.title}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{book.author}</div>
                </td>
                <td className="px-8 py-6" data-label="Category">
                  <span className="text-sm font-bold text-slate-400">{book.category}</span>
                </td>
                <td className="px-4 py-6 whitespace-nowrap text-center" data-label="Location">
                  <span className="bg-slate-800 px-3 py-1 rounded-lg border border-white/5 text-[10px] font-bold text-slate-400 uppercase">
                    {formatShelfLoc(book.shelf_loc, book.category)}
                  </span>
                </td>
                <td className="px-8 py-6 whitespace-nowrap" data-label="Status">
                  <div className={`flex items-center gap-2 text-[10px] font-bold uppercase
                    ${book.status === 'Available' ? 'text-green-600' : 
                      book.status === 'Ordered' ? 'text-amber-600' : 'text-blue-600'}
                  `}>
                    <div className={`w-1.5 h-1.5 rounded-full bg-current ${book.status !== 'Available' ? 'animate-pulse' : ''}`} />
                    {book.status}
                  </div>
                </td>
                <td className="px-8 py-6 text-right actions-cell" data-label="Actions">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingBook(book);
                        setFormData({
                          title: book.title,
                          author: book.author,
                          category: book.category,
                          shelf_loc: book.shelf_loc || getNextShelfLoc(book.category, books),
                          total_copies: book.total_copies
                        });
                        setIsModalOpen(true);
                      }}
                      className="w-8 h-8 flex items-center justify-center shrink-0 rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all hover:scale-110 active:scale-95"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      disabled={isDeleting === book.book_id}
                      onClick={() => {
                        if (confirmDeleteId === book.book_id) {
                          deleteBook(book.book_id);
                        } else {
                          setConfirmDeleteId(book.book_id);
                          setTimeout(() => {
                            setConfirmDeleteId(prev => prev === book.book_id ? null : prev);
                          }, 3000);
                        }
                      }}
                      className={`h-8 min-w-[32px] rounded-full transition-all disabled:opacity-50 flex items-center justify-center overflow-hidden hover:scale-110 active:scale-95 ${confirmDeleteId === book.book_id ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500/50 px-3 gap-2' : 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white'}`}
                    >
                      {isDeleting === book.book_id ? (
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      ) : (
                        <Trash2 className="w-4 h-4 shrink-0" />
                      )}
                      {confirmDeleteId === book.book_id && (
                        <span className="text-xs font-bold pr-1">Confirm</span>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bulk Add Modal */}
      <AnimatePresence>
        {isBulkModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBulkModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-slate-900 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="bg-secondary p-5 sm:p-6 flex justify-between items-center text-slate-200">
                <h3 className="text-2xl font-amiri font-bold">Bulk Add Books</h3>
                <button onClick={() => setIsBulkModalOpen(false)} className="text-slate-400 hover:text-slate-200 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleBulkSubmit} className="p-5 sm:p-8 space-y-4 sm:space-y-6">
                <div className="space-y-4">
                  <div className="bg-slate-800/50 p-4 rounded-xl text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest">
                    Format: Title, Author, Category, Shelf Location (one per line)
                    <br />
                    Example: Sahih Bukhari, Imam Bukhari, Religion, A1-02
                  </div>
                  <textarea
                    required
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    rows={10}
                    placeholder="Enter books here..."
                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl sm:rounded-2xl py-3 px-5 sm:py-4 sm:px-6 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-800 text-white border border-white/10 hover:bg-slate-700 py-3 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-6 h-6" />}
                  UPLOAD ALL RECORDS
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Standard Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-slate-900 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="bg-slate-800/50 p-5 sm:p-6 flex justify-between items-center border-b border-white/5">
                <h3 className="text-2xl font-amiri font-bold text-slate-200">
                  {editingBook ? 'Edit Book' : 'Add New Book'}
                </h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Book Title</label>
                    <input
                      required
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-slate-800/50 border border-white/10 rounded-xl sm:rounded-2xl py-3 px-4 sm:py-4 sm:px-6 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                      placeholder="e.g. Sahih al-Bukhari"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Author Name</label>
                    <input
                      required
                      type="text"
                      value={formData.author}
                      onChange={(e) => setFormData({...formData, author: e.target.value})}
                      className="w-full bg-slate-800/50 border border-white/10 rounded-xl sm:rounded-2xl py-3 px-4 sm:py-4 sm:px-6 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                      placeholder="e.g. Imam Bukhari"
                    />
                  </div>
                </div>



                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Category</label>
                    <div className="relative group">
                      <select
                        value={formData.category}
                        onChange={(e) => {
                          const newCat = e.target.value;
                          const prefix = CATEGORY_PREFIX[newCat] ?? newCat[0].toUpperCase();
                          const isAutoLoc = !editingBook ||
                            Object.values(CATEGORY_PREFIX).some(p =>
                              formData.shelf_loc.toUpperCase().startsWith(p.toUpperCase()) &&
                              formData.shelf_loc.toUpperCase().startsWith(
                                (CATEGORY_PREFIX[formData.category] ?? formData.category[0]).toUpperCase()
                              )
                            );
                          setFormData({
                            ...formData,
                            category: newCat,
                            shelf_loc: isAutoLoc ? getNextShelfLoc(newCat, books) : formData.shelf_loc
                          });
                        }}
                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl sm:rounded-2xl py-3 px-4 sm:py-4 sm:px-6 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium appearance-none cursor-pointer"
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1 flex flex-col xl:flex-row xl:items-center xl:gap-1">
                      <span>Shelf Loc</span>
                      <span className="text-blue-400/60 normal-case">
                        (auto: {CATEGORY_PREFIX[formData.category] ?? formData.category[0]}N)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formData.shelf_loc}
                      onChange={(e) => setFormData({...formData, shelf_loc: e.target.value})}
                      className="w-full bg-slate-800/50 border border-white/10 rounded-xl sm:rounded-2xl py-3 px-4 sm:py-4 sm:px-6 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                      placeholder={`e.g. ${CATEGORY_PREFIX[formData.category] ?? formData.category[0]}12`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Total Copies</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.total_copies}
                      onChange={(e) => setFormData({...formData, total_copies: parseInt(e.target.value)})}
                      className="w-full bg-slate-800/50 border border-white/10 rounded-xl sm:rounded-2xl py-3 px-4 sm:py-4 sm:px-6 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="pt-2 sm:pt-4">
                  <button
                    type="submit"
                    className="w-full bg-slate-800 text-white border border-white/10 hover:bg-slate-700 py-3 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
                  >
                    <Check className="w-6 h-6" />
                    {editingBook ? 'SAVE CHANGES' : 'CREATE BOOK RECORD'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
