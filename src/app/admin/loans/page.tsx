'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Users, RotateCcw, User, Calendar, Clock, Loader2, AlertCircle, MessageCircle, Search, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate } from '@/lib/utils';

export default function ActiveLoans() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [returning, setReturning] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [confirmReturnId, setConfirmReturnId] = useState<string | null>(null);
  const [isBatchDropdownOpen, setIsBatchDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBatchDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('*, books(*), students(*)')
      .eq('status', 'Issued')
      .order('return_deadline', { ascending: true });
    
    setLoans(data || []);
    setLoading(false);
  };

  const markReturned = async (txId: string, bookId: string) => {
    setReturning(txId);
    try {
      const response = await fetch(`/api/orders/${txId}/return`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId }),
      });

      if (response.ok) {
        fetchLoans();
        alert('Book marked as returned.');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to mark returned');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setReturning(null);
    }
  };

  const getWhatsAppLink = (loan: any) => {
    const phone = loan.students.whatsapp_number.replace(/\D/g, '');
    const message = encodeURIComponent(`Hello ${loan.students.name}, your book "${loan.books.title}" has been successfully returned to Aman Library. Thank you!`);
    return `https://wa.me/${phone}?text=${message}`;
  };

  const getDeadlineStatus = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: 'OVERDUE', color: 'text-red-600 bg-red-50 border-red-100', icon: AlertCircle };
    if (days <= 3) return { label: 'CRITICAL', color: 'text-amber-600 bg-amber-50 border-amber-100', icon: Clock };
    return { label: 'ACTIVE', color: 'text-green-600 bg-green-50 border-green-100', icon: Calendar };
  };

  const uniqueBatches = Array.from(
    new Set(loans.map(l => l.students?.batch).filter(Boolean))
  ).sort() as string[];

  const filteredLoans = loans.filter((loan) => {
    const matchesBatch = selectedBatch === 'All' || loan.students?.batch === selectedBatch;
    const term = searchQuery.toLowerCase();
    const matchesSearch =
      loan.books?.title?.toLowerCase().includes(term) ||
      loan.students?.name?.toLowerCase().includes(term);
    return matchesBatch && matchesSearch;
  });

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-amiri font-bold text-primary mb-2">Active Loans</h1>
          <p className="text-primary/60 font-medium">Tracking books currently in circulation.</p>
        </div>
        
        {/* Batch Dropdown */}
        {uniqueBatches.length > 0 && (
          <div className="relative self-start sm:self-auto w-auto sm:w-auto min-w-[200px]" ref={dropdownRef}>
            <button
              onClick={() => setIsBatchDropdownOpen(!isBatchDropdownOpen)}
              className="w-full bg-white border border-secondary/10 rounded-2xl py-3 pl-5 pr-10 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-secondary/50 shadow-sm transition-all text-left flex items-center justify-between"
            >
              <span className="truncate">
                {selectedBatch === 'All' ? `All Batches (${loans.length})` : `${selectedBatch} (${loans.filter(l => l.students?.batch === selectedBatch).length})`}
              </span>
              <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 transition-transform ${isBatchDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {isBatchDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-50 w-full mt-2 bg-white border border-secondary/20 rounded-2xl shadow-xl overflow-hidden py-2"
                >
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    <button
                      onClick={() => { setSelectedBatch('All'); setIsBatchDropdownOpen(false); }}
                      className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors ${selectedBatch === 'All' ? 'bg-secondary/10 text-secondary' : 'text-primary/70 hover:bg-cream hover:text-primary'}`}
                    >
                      All Batches ({loans.length})
                    </button>
                    {uniqueBatches.map(batch => (
                      <button
                        key={batch}
                        onClick={() => { setSelectedBatch(batch); setIsBatchDropdownOpen(false); }}
                        className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors ${selectedBatch === batch ? 'bg-secondary/10 text-secondary' : 'text-primary/70 hover:bg-cream hover:text-primary'}`}
                      >
                        {batch} ({loans.filter(l => l.students?.batch === batch).length})
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        
        {/* Search Bar */}
        <div className="relative w-full sm:w-[320px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-primary/40" />
          <input
            type="text"
            placeholder="Search by book title or student name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-secondary/10 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all placeholder:text-primary/30 text-primary shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-secondary/10 shadow-sm overflow-hidden mobile-card-table-wrapper">
        <table className="w-full text-left mobile-card-table">
          <thead className="bg-cream border-b border-secondary/10">
            <tr>
              <th className="px-6 py-5 text-xs font-bold text-primary/40 uppercase tracking-widest w-[40%]">Book &amp; Student</th>
              <th className="px-6 py-5 text-xs font-bold text-primary/40 uppercase tracking-widest whitespace-nowrap">Issued On</th>
              <th className="px-6 py-5 text-xs font-bold text-primary/40 uppercase tracking-widest whitespace-nowrap">Deadline</th>
              <th className="px-6 py-5 text-xs font-bold text-primary/40 uppercase tracking-widest whitespace-nowrap">Status</th>
              <th className="px-6 py-5 text-xs font-bold text-primary/40 uppercase tracking-widest text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary/5">
            {filteredLoans.map((loan) => {
              const status = getDeadlineStatus(loan.return_deadline);
              const StatusIcon = status.icon;
              
              return (
                <tr key={loan.transaction_id} className="hover:bg-cream/30 transition-colors">
                  <td className="px-6 py-6" data-label="Book / Student">
                    <div className="text-[14px] font-bold text-primary mb-0.5 leading-tight" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>{loan.books.title}</div>
                    <div className="flex items-center gap-1.5 text-[10px] text-primary/30 font-bold uppercase tracking-widest">
                      <User className="w-2.5 h-2.5 shrink-0" />
                      {loan.students?.name} {loan.students?.batch ? `• ${loan.students.batch}` : ''}
                    </div>
                  </td>
                  <td className="px-6 py-6 whitespace-nowrap" data-label="Issued On">
                    <div className="text-primary/60 text-sm font-medium">{formatDate(loan.issue_date)}</div>
                  </td>
                  <td className="px-6 py-6 whitespace-nowrap" data-label="Deadline">
                    <div className="text-primary font-bold text-sm">{formatDate(loan.return_deadline)}</div>
                  </td>
                  <td className="px-6 py-6 whitespace-nowrap" data-label="Status">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold ${status.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-right actions-cell whitespace-nowrap" data-label="Actions">
                    <div className="flex justify-end">
                      <button
                        disabled={returning === loan.transaction_id}
                        onClick={() => {
                          if (confirmReturnId === loan.transaction_id) {
                            markReturned(loan.transaction_id, loan.book_id);
                            window.open(getWhatsAppLink(loan), '_blank');
                            setConfirmReturnId(null);
                          } else {
                            setConfirmReturnId(loan.transaction_id);
                            setTimeout(() => {
                              setConfirmReturnId(prev => prev === loan.transaction_id ? null : prev);
                            }, 3000);
                          }
                        }}
                        className={`w-full sm:w-auto border rounded-xl overflow-hidden shadow-sm h-11 px-3.5 font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 group disabled:opacity-50 ${confirmReturnId === loan.transaction_id ? 'bg-amber-50 text-amber-600 border-amber-200 ring-2 ring-black' : 'text-primary border-secondary/20 bg-cream hover:bg-secondary hover:text-primary'}`}
                      >
                        {returning === loan.transaction_id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                        ) : confirmReturnId === loan.transaction_id ? (
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-45 transition-transform shrink-0" />
                        )}
                        {confirmReturnId === loan.transaction_id ? 'CONFIRM' : 'RETURN'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>


  );
}
