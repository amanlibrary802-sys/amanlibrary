'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  User, 
  Calendar, 
  PlusCircle, 
  Loader2, 
  Search,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Filter
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

const CATEGORIES = [
  'Religion', 'Study', 'Literature', 'Motivation & Psychology',
  'History', 'Autobiography', 'Science', 'Language',
  'Dictionary', 'Kithabs'
];


export default function DirectIssue() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  
  // Selection states
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedBook, setSelectedBook] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Search states
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [bookSearch, setBookSearch] = useState('');
  const [selectedBookCategory, setSelectedBookCategory] = useState('All');
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const studentInputRef = useRef<HTMLInputElement>(null);
  const bookInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
    if (studentInputRef.current) {
      studentInputRef.current.focus();
    }
  }, []);

  const handleSelectStudent = (id: string) => {
    setSelectedStudent(id);
    if (bookInputRef.current) {
      bookInputRef.current.focus();
    }
  };

  const fetchData = async () => {
    const { data: studentData } = await supabase
      .from('students')
      .select('id, name, whatsapp_number, batch')
      .eq('role', 'student');
    
    let allBooks: any[] = [];
    let page = 0;
    
    while (true) {
      const { data: bookData } = await supabase
        .from('books')
        .select('*')
        .eq('status', 'Available')
        .range(page * 1000, (page + 1) * 1000 - 1);
        
      if (!bookData || bookData.length === 0) break;
      allBooks = [...allBooks, ...bookData];
      if (bookData.length < 1000) break;
      page++;
    }
    allBooks.sort((a, b) => {
      const locA = a.shelf_loc || '';
      const locB = b.shelf_loc || '';
      return locA.localeCompare(locB, undefined, { numeric: true, sensitivity: 'base' });
    });
    
    setStudents(studentData || []);
    setBooks(allBooks);
  };

  const batches = Array.from(new Set(students.map(s => s.batch).filter(Boolean))).sort() as string[];

  let filteredStudents = students.filter(s => 
    (selectedBatch === 'All' || s.batch === selectedBatch) &&
    (s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.whatsapp_number?.includes(studentSearch))
  );

  if (studentSearch) {
    const q = studentSearch.toLowerCase();
    filteredStudents.sort((a, b) => {
      const getScore = (item: any) => {
        const name = (item.name || '').toLowerCase();
        const phone = item.whatsapp_number || '';
        
        if (name === q || phone === q) return 100;
        if (name.startsWith(q)) return 80;
        if (phone.includes(q)) return 70;
        if (name.includes(q)) return 50;
        return 0;
      };
      const scoreA = getScore(a);
      const scoreB = getScore(b);
      if (scoreA !== scoreB) return scoreB - scoreA;
      return a.name.localeCompare(b.name);
    });
  }

  let filteredBooks = books.filter(b => 
    (selectedBookCategory === 'All' || b.category === selectedBookCategory) &&
    (b.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
     b.author.toLowerCase().includes(bookSearch.toLowerCase()) ||
     (b.shelf_loc || '').toLowerCase().includes(bookSearch.toLowerCase()))
  );

  if (bookSearch) {
    const q = bookSearch.toLowerCase();
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


  const [success, setSuccess] = useState<any>(null);

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedBook) {
      alert('Please select both a student and a book.');
      return;
    }

    setLoading(true);
    const deadline = new Date(new Date(issueDate).setDate(new Date(issueDate).getDate() + 21))
      .toISOString().split('T')[0];

    try {
      // 1. Create Transaction
      const { error: txError } = await supabase
        .from('transactions')
        .insert([{
          student_id: selectedStudent,
          book_id: selectedBook,
          status: 'Issued',
          order_date: issueDate,
          issue_date: issueDate,
          return_deadline: deadline
        }]);

      if (txError) throw txError;

      // 2. Update Book Status
      const { error: bookError } = await supabase
        .from('books')
        .update({ status: 'Issued' })
        .eq('book_id', selectedBook);

      if (bookError) throw bookError;

      const student = students.find(s => s.id === selectedStudent);
      const book = books.find(b => b.book_id === selectedBook);

      setSuccess({
        studentName: student.name,
        phone: student.whatsapp_number.replace(/\D/g, ''),
        bookTitle: book.title,
        date: issueDate
      });
    } catch (err: any) {
      alert(err.message || 'Failed to issue book');
    } finally {
      setLoading(false);
    }
  };

  const getWhatsAppLink = () => {
    if (!success) return '';
    const message = `Hello ${success.studentName}, a book has been issued to your account: "${success.bookTitle}" on ${success.date}. Please ensure it is returned within the 3-week (21-day) period. Thank you!`;
    return `https://wa.me/${success.phone}?text=${encodeURIComponent(message)}`;
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-8">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-amiri font-bold text-primary">Issue Successful!</h1>
        <p className="text-primary/60 text-lg">
          <strong>{success.bookTitle}</strong> has been issued to <strong>{success.studentName}</strong>.
        </p>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-6">
          <a
            href={getWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto bg-[#25D366] text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-lg"
          >
            <MessageCircle className="w-6 h-6" />
            NOTIFY VIA WHATSAPP
          </a>
          <button
            onClick={() => router.push('/admin/loans')}
            className="w-full md:w-auto bg-primary text-secondary px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-secondary hover:text-primary transition-all"
          >
            VIEW ALL LOANS
          </button>
        </div>
        
        <button 
          onClick={() => {
            setSuccess(null);
            setSelectedStudent('');
            setSelectedBook('');
            fetchData();
          }}
          className="text-primary/40 font-bold text-xs uppercase tracking-widest hover:text-primary transition-colors"
        >
          Issue Another Book
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-amiri font-bold text-primary mb-1.5">Direct Issue</h1>
        <p className="text-primary/60 font-medium text-sm">Instantly record a book issuance without a student request.</p>
      </div>

      <form onSubmit={handleIssue} className="flex flex-col gap-6 relative items-start w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full relative items-start">
        {/* Step 1: Student Selection */}
        <div className={`w-full bg-white p-4 sm:p-5 rounded-2xl border border-secondary/10 shadow-sm space-y-4 relative ${isBatchOpen ? 'z-30' : 'z-20'}`}>
          <div className="flex items-center gap-3 text-primary relative z-10">
            <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-100">1</div>
            <h2 className="text-lg font-bold">Select Student</h2>
          </div>
            <div className="flex flex-col gap-4 relative z-50">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative w-full sm:w-1/3 z-30">
                  <button
                    type="button"
                    onClick={() => setIsBatchOpen(!isBatchOpen)}
                    className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl py-3 pl-4 pr-3 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 shadow-sm cursor-pointer transition-all"
                  >
                    <span className="truncate pr-2">{selectedBatch === 'All' ? 'All Batches' : selectedBatch}</span>
                    <svg className={`w-4 h-4 text-primary/40 transition-transform shrink-0 ${isBatchOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {isBatchOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 min-w-full w-max max-w-[200px] mt-2 bg-white border border-secondary/10 rounded-xl shadow-xl overflow-hidden"
                      >
                        <div className="max-h-[220px] overflow-y-auto custom-scrollbar py-1">
                          <button
                            type="button"
                            onClick={() => { setSelectedBatch('All'); setIsBatchOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedBatch === 'All' ? 'bg-indigo-50 text-indigo-700 font-bold border-l-2 border-indigo-600' : 'text-primary/80 hover:bg-slate-50 font-medium border-l-2 border-transparent'}`}
                          >
                            All Batches
                          </button>
                          {batches.map((batch) => (
                            <button
                              key={batch}
                              type="button"
                              onClick={() => { setSelectedBatch(batch); setIsBatchOpen(false); }}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedBatch === batch ? 'bg-indigo-50 text-indigo-700 font-bold border-l-2 border-indigo-600' : 'text-primary/80 hover:bg-slate-50 font-medium border-l-2 border-transparent'}`}
                            >
                              {batch}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative w-full sm:w-2/3">
                  <Search className="absolute left-4 top-3.5 w-4 h-4 text-primary/30" />
                  <input
                    ref={studentInputRef}
                    type="text"
                    placeholder="Scan or type student name..."
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="h-[200px] overflow-y-auto space-y-2 pr-1.5 sm:pr-2 custom-scrollbar relative z-10">
              {filteredStudents.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectStudent(s.id)}
                  className={`w-full text-left p-3 sm:p-4 rounded-xl transition-all border relative flex items-center justify-between group overflow-hidden ${
                    selectedStudent === s.id 
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-md ring-1 ring-indigo-500' 
                      : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  {selectedStudent === s.id && (
                    <div className="absolute inset-0 bg-indigo-500/5" />
                  )}
                  <div className="relative z-10 flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${selectedStudent === s.id ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-400'}`}>
                      <User className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className={`font-bold text-sm sm:text-[15px] truncate ${selectedStudent === s.id ? 'text-indigo-900' : 'text-slate-800'}`}>{s.name}</div>
                      <div className={`text-[10px] sm:text-[11px] font-bold uppercase mt-0.5 truncate ${selectedStudent === s.id ? 'text-indigo-600/70' : 'text-slate-400'}`}>
                        {s.batch || 'NO BATCH'} • {s.whatsapp_number}
                      </div>
                    </div>
                  </div>
                  {selectedStudent === s.id && (
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 relative z-10 shrink-0 ml-2" />
                  )}
                </button>
              ))}
              {filteredStudents.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50">
                  <User className="w-10 h-10 mb-2" />
                  <p className="text-xs font-bold">No students found</p>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Book Selection */}
          <div className={`w-full bg-white p-4 sm:p-5 rounded-2xl border border-secondary/10 shadow-sm space-y-4 relative ${isCategoryOpen ? 'z-30' : 'z-20'}`}>
            <div className="flex items-center gap-3 text-primary relative z-10">
              <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-100">2</div>
              <h2 className="text-lg font-bold">Select Book</h2>
            </div>

            <div className="flex flex-col gap-4 relative z-50">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative w-full sm:w-1/3 z-30">
                  <button
                    type="button"
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl py-3 pl-4 pr-3 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 shadow-sm cursor-pointer transition-all"
                  >
                    <span className="truncate pr-2">{selectedBookCategory === 'All' ? 'All Categories' : selectedBookCategory}</span>
                    <svg className={`w-4 h-4 text-primary/40 transition-transform shrink-0 ${isCategoryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {isCategoryOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 min-w-full w-max max-w-[200px] mt-2 bg-white border border-secondary/10 rounded-xl shadow-xl overflow-hidden"
                      >
                        <div className="max-h-[220px] overflow-y-auto custom-scrollbar py-1">
                          <button
                            type="button"
                            onClick={() => { setSelectedBookCategory('All'); setIsCategoryOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedBookCategory === 'All' ? 'bg-indigo-50 text-indigo-700 font-bold border-l-2 border-indigo-600' : 'text-primary/80 hover:bg-slate-50 font-medium border-l-2 border-transparent'}`}
                          >
                            All Categories
                          </button>
                          {CATEGORIES.map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => { setSelectedBookCategory(cat); setIsCategoryOpen(false); }}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedBookCategory === cat ? 'bg-indigo-50 text-indigo-700 font-bold border-l-2 border-indigo-600' : 'text-primary/80 hover:bg-slate-50 font-medium border-l-2 border-transparent'}`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative w-full sm:w-2/3">
                  <Search className="absolute left-4 top-3.5 w-4 h-4 text-primary/30" />
                  <input
                    ref={bookInputRef}
                    type="text"
                    placeholder="Scan or type book title, author..."
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
                    value={bookSearch}
                    onChange={(e) => setBookSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="h-[240px] overflow-y-auto space-y-2 pr-1.5 sm:pr-2 custom-scrollbar relative z-10">
              {filteredBooks.map((b) => (
                <button
                  key={b.book_id}
                  type="button"
                  onClick={() => setSelectedBook(b.book_id)}
                  className={`w-full text-left p-3 sm:p-4 rounded-xl transition-all border relative flex items-center justify-between group overflow-hidden ${
                    selectedBook === b.book_id 
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-md ring-1 ring-indigo-500' 
                      : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  {selectedBook === b.book_id && (
                    <div className="absolute inset-0 bg-indigo-500/5" />
                  )}
                  <div className="relative z-10 flex items-start gap-3 sm:gap-4 min-w-0">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 mt-0.5 rounded-full flex items-center justify-center shrink-0 transition-colors ${selectedBook === b.book_id ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-400'}`}>
                      <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0 pr-2">
                      <div className={`font-bold text-sm sm:text-[15px] leading-snug truncate ${selectedBook === b.book_id ? 'text-indigo-900' : 'text-slate-800'}`}>{b.title}</div>
                      <div className={`text-[10px] sm:text-[11px] font-bold uppercase mt-1 sm:mt-1.5 flex flex-wrap gap-x-2 gap-y-1 ${selectedBook === b.book_id ? 'text-indigo-600/70' : 'text-slate-400'}`}>
                        <span className="truncate max-w-[100px]">{b.author}</span>
                        <span className="opacity-50 shrink-0">•</span>
                        <span className="truncate max-w-[80px]">{b.category}</span>
                        {b.shelf_loc && (
                          <>
                            <span className="opacity-50 shrink-0">•</span>
                            <span className="text-indigo-500 flex items-center gap-0.5 shrink-0">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                              {/^[A-Za-z]/.test(b.shelf_loc) ? b.shelf_loc.toUpperCase() : `${b.category ? b.category.charAt(0).toUpperCase() : ''}${b.shelf_loc}`}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {selectedBook === b.book_id && (
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 relative z-10 shrink-0 ml-2" />
                  )}
                </button>
              ))}
              {filteredBooks.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50">
                  <BookOpen className="w-10 h-10 mb-2" />
                  <p className="text-xs font-bold">No books available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 3: Checkout Summary */}
        <div className="w-full">
          <div className="bg-white rounded-2xl border border-secondary/10 shadow-sm overflow-hidden flex flex-col lg:flex-row items-stretch">
            <div className="bg-slate-800 text-white p-6 lg:w-[280px] shrink-0 relative overflow-hidden flex flex-col justify-center">
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/islamic-art.png')] pointer-events-none" />
              <div className="relative z-10 flex items-center gap-3 mb-2">
                <div className="w-6 h-6 rounded-full bg-indigo-400 text-slate-900 flex items-center justify-center font-bold text-xs shrink-0">3</div>
                <h2 className="text-xl font-bold font-amiri tracking-wide">Checkout Summary</h2>
              </div>
              <p className="text-slate-300 text-xs font-medium relative z-10 ml-9">Review details before confirming</p>
            </div>

            <div className="p-6 flex-1 bg-[url('https://www.transparenttextures.com/patterns/paper.png')] flex flex-col gap-6">
              
              <div className="flex flex-col sm:flex-row gap-6">
              
              {/* Receipt Item: Student */}
              <div className="flex-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Student Details</div>
                {selectedStudent ? (() => {
                  const s = students.find(s => s.id === selectedStudent);
                  return (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-3 shadow-sm">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-800 truncate">{s?.name}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 truncate">{s?.batch || 'NO BATCH'} • {s?.whatsapp_number}</div>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-4 flex items-center justify-center text-xs font-bold text-slate-400 gap-2 h-[68px]">
                    <User className="w-4 h-4" /> No student selected
                  </div>
                )}
              </div>

              {/* Receipt Item: Book */}
              <div className="flex-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Book Details</div>
                {selectedBook ? (() => {
                  const b = books.find(b => b.book_id === selectedBook);
                  return (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-3 shadow-sm">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-800 leading-snug truncate">{b?.title}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase mt-1 truncate">{b?.author}</div>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-4 flex items-center justify-center text-xs font-bold text-slate-400 gap-2 h-[68px]">
                    <BookOpen className="w-4 h-4" /> No book selected
                  </div>
                )}
              </div>
              </div>

              <div className="border-t border-slate-200 w-full border-dashed" />

              {/* Dates & Action */}
              <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-xs font-bold text-slate-500 uppercase shrink-0">Issue Date</span>
                    </div>
                    <input
                      type="date"
                      className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 cursor-pointer w-[130px] shrink-0"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 shadow-sm">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="text-xs font-bold text-indigo-800 uppercase shrink-0">Due Date</span>
                    </div>
                    <div className="text-sm font-black text-indigo-700 shrink-0">
                      {(() => {
                        const due = new Date(issueDate);
                        due.setDate(due.getDate() + 21); // 3 weeks
                        return formatDate(due.toISOString());
                      })()}
                    </div>
                  </div>
                </div>
                
                {/* Submit Button */}
                <div className="lg:w-[220px] shrink-0">
                  <button
                    type="submit"
                    disabled={loading || !selectedStudent || !selectedBook}
                    className="w-full h-full min-h-[48px] bg-slate-800 text-white px-4 py-3 rounded-xl font-bold text-sm hover:bg-slate-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:hover:-translate-y-0 disabled:hover:shadow-none"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    ) : (
                      <PlusCircle className="w-4 h-4 shrink-0" />
                    )}
                    CONFIRM ISSUE
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
