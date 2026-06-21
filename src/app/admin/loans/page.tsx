'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Users, RotateCcw, User, Calendar, Clock, Loader2, AlertCircle, MessageCircle, Search, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate, sortBatches } from '@/lib/utils';

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
    if (days < 0) return { label: 'OVERDUE', color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: AlertCircle };
    if (days <= 3) return { label: 'CRITICAL', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: Clock };
    return { label: 'ACTIVE', color: 'text-green-400 bg-green-500/10 border-green-500/20', icon: Calendar };
  };

  const uniqueBatches = sortBatches(Array.from(
    new Set(loans.map(l => l.students?.batch).filter(Boolean))
  ) as string[]);

  const filteredLoans = loans.filter((loan) => {
    const matchesBatch = selectedBatch === 'All' || loan.students?.batch === selectedBatch;
    const term = searchQuery.toLowerCase();
    const matchesSearch =
      loan.books?.title?.toLowerCase().includes(term) ||
      loan.students?.name?.toLowerCase().includes(term);
    return matchesBatch && matchesSearch;
  });

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-200" /></div>;

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-amiri font-bold text-slate-200 mb-2">Active Loans</h1>
          <p className="text-slate-400 font-medium">Tracking books currently in circulation.</p>
        </div>
        
        {/* Batch Dropdown */}
        {uniqueBatches.length > 0 && (
          <div className="relative self-start sm:self-auto w-auto sm:w-auto min-w-[200px]" ref={dropdownRef}>
            <button
              onClick={() => setIsBatchDropdownOpen(!isBatchDropdownOpen)}
              className="w-full bg-slate-900 border border-white/5 rounded-2xl py-3 pl-5 pr-10 text-sm font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-secondary/50 shadow-sm transition-all text-left flex items-center justify-between"
            >
              <span className="truncate">
                {selectedBatch === 'All' ? `All Batches (${loans.length})` : `${selectedBatch} (${loans.filter(l => l.students?.batch === selectedBatch).length})`}
              </span>
              <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-transform ${isBatchDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {isBatchDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-50 w-full mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-xl overflow-hidden py-2"
                >
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    <button
                      onClick={() => { setSelectedBatch('All'); setIsBatchDropdownOpen(false); }}
                      className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors ${selectedBatch === 'All' ? 'bg-secondary/10 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                    >
                      All Batches ({loans.length})
                    </button>
                    {uniqueBatches.map(batch => (
                      <button
                        key={batch}
                        onClick={() => { setSelectedBatch(batch); setIsBatchDropdownOpen(false); }}
                        className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors ${selectedBatch === batch ? 'bg-secondary/10 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
          <input
            type="text"
            placeholder="Search by book title or student name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-white/5 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all placeholder:text-slate-400 text-slate-200 shadow-sm"
          />
        </div>
      </div>

      <div className="bg-slate-900 rounded-3xl border border-white/5 shadow-sm overflow-hidden mobile-card-table-wrapper">
        <table className="w-full text-left mobile-card-table">
          <thead className="bg-slate-800 border-b border-white/5">
            <tr>
              <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest w-[40%]">Book &amp; Student</th>
              <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Issued On</th>
              <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Deadline</th>
              <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Status</th>
              <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredLoans.map((loan) => {
              const status = getDeadlineStatus(loan.return_deadline);
              const StatusIcon = status.icon;
              
              return (
                <tr key={loan.transaction_id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-6" data-label="Book / Student">
                    <div className="text-[14px] font-bold text-slate-200 mb-0.5 leading-tight" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>{loan.books.title}</div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      <User className="w-2.5 h-2.5 shrink-0" />
                      {loan.students?.name} {loan.students?.batch ? `• ${loan.students.batch}` : ''}
                    </div>
                  </td>
                  <td className="px-6 py-6 whitespace-nowrap" data-label="Issued On">
                    <div className="text-slate-400 text-sm font-medium">{formatDate(loan.issue_date)}</div>
                  </td>
                  <td className="px-6 py-6 whitespace-nowrap" data-label="Deadline">
                    <div className="text-slate-200 font-bold text-sm">{formatDate(loan.return_deadline)}</div>
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
                        className={`w-full sm:w-auto border rounded-xl overflow-hidden shadow-sm h-11 px-3.5 font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 group disabled:opacity-50 ${confirmReturnId === loan.transaction_id ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 ring-2 ring-amber-500/50' : 'text-slate-200 border-white/10 bg-slate-800 hover:bg-slate-700 hover:text-slate-200 hover:scale-105 active:scale-95'}`}
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
