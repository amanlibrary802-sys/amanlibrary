'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  Search,
  Trash2,
  X,
  Check,
  Loader2,
  UserPlus,
  Phone,
  User as UserIcon,
  Users,
  Calendar,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Copy,
  Edit2,
  ChevronDown,
  Book,
  Library,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate, sortBatches } from '@/lib/utils';

export default function StudentManagement() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
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
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState('All');

  const [formData, setFormData] = useState({ name: '', mobile: '', batch: '' });
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({ name: '', mobile: '', role: 'student', batch: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedHistoryStudent, setSelectedHistoryStudent] = useState<any>(null);
  const [readingHistory, setReadingHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [confirmDeleteHistoryId, setConfirmDeleteHistoryId] = useState<string | null>(null);

  const fetchReadingHistory = async (student: any) => {
    setSelectedHistoryStudent(student);
    setHistoryModalOpen(true);
    setLoadingHistory(true);
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*, books(*)')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setReadingHistory(data);
    } else {
      setReadingHistory([]);
    }
    setLoadingHistory(false);
  };

  const deleteHistoryRecord = async (transactionId: string) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('transaction_id', transactionId);
      
    if (error) {
      showToast('error', error.message);
    } else {
      showToast('success', 'History record deleted');
      setReadingHistory(prev => prev.filter(tx => tx.transaction_id !== transactionId));
    }
    setConfirmDeleteHistoryId(null);
  };

  useEffect(() => { fetchStudents(); }, []);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchStudents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });
    setStudents(data || []);
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistering(true);
    try {
      const response = await fetch('/api/admin/students/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (response.ok) {
        setFormData({ name: '', mobile: '', batch: '' });
        setIsModalOpen(false);
        fetchStudents();
        showToast('success', `${formData.name} registered successfully!`);
      } else {
        showToast('error', result.error || 'Registration failed');
      }
    } catch {
      showToast('error', 'Network error. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({
          name: editFormData.name,
          whatsapp_number: editFormData.mobile,
          role: editFormData.role,
          batch: editFormData.batch
        })
        .eq('id', editingStudent.id);

      if (error) {
        showToast('error', error.message);
      } else {
        setIsEditModalOpen(false);
        fetchStudents();
        showToast('success', `${editFormData.name}'s details updated!`);
      }
    } catch {
      showToast('error', 'Network error. Please try again.');
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteStudent = async (id: string, name: string) => {
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) {
      showToast('error', error.message);
    } else {
      showToast('success', `${name} has been removed`);
      fetchStudents();
    }
    setConfirmDeleteId(null);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Derive unique batches (exclude null/empty), sorted by custom order
  const uniqueBatches = sortBatches(Array.from(
    new Set(students.map(s => s.batch).filter(Boolean))
  ) as string[]);

  let filteredStudents = students.filter(s => {
    const matchesBatch = selectedBatch === 'All' || s.batch === selectedBatch;
    const matchesSearch =
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.whatsapp_number?.includes(search) ||
      s.student_id?.toLowerCase().includes(search.toLowerCase());
    return matchesBatch && matchesSearch;
  });

  if (search) {
    const q = search.toLowerCase();
    filteredStudents.sort((a, b) => {
      const getScore = (item: any) => {
        const name = (item.name || '').toLowerCase();
        const phone = item.whatsapp_number || '';
        const sid = (item.student_id || '').toLowerCase();
        
        if (name === q || phone === q || sid === q) return 100;
        if (name.startsWith(q) || sid.startsWith(q)) return 80;
        if (phone.includes(q)) return 70;
        if (name.includes(q)) return 50;
        return 0;
      };
      const scoreA = getScore(a);
      const scoreB = getScore(b);
      if (scoreA !== scoreB) return scoreB - scoreA;
      return (a.name || '').localeCompare(b.name || '');
    });
  }

  const studentCount = students.filter(s => s.role === 'student').length;

  return (
    <div className="space-y-8">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold ${
              toast.type === 'success'
                ? 'bg-green-600 text-white'
                : 'bg-red-500 text-white'
            }`}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
          >
            {toast.type === 'success'
              ? <CheckCircle2 className="w-4 h-4 shrink-0" />
              : <AlertCircle className="w-4 h-4 shrink-0" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-amiri font-bold text-slate-200 mb-2">Student Registry</h1>
          <p className="text-slate-400 font-medium flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {studentCount} student{studentCount !== 1 ? 's' : ''} enrolled
          </p>
        </div>
        <motion.button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center w-full md:w-auto gap-2 bg-blue-600 text-white px-3 py-3 sm:px-6 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold hover:scale-105 transition-all shadow-lg text-sm sm:text-base mt-4 md:mt-0"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          <UserPlus className="w-4 h-4" />
          Register Student
        </motion.button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mt-8 mb-6">
        <div className="relative group flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors w-5 h-5" />
          <input
            type="text"
            placeholder={`Search${selectedBatch !== 'All' ? ` in ${selectedBatch}` : ''} by name, mobile, or student ID...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-slate-200 focus:outline-none focus:ring-2 focus:ring-secondary/50 shadow-sm transition-all text-base font-medium h-full"
          />
        </div>

        {/* Custom Batch Dropdown */}
        {uniqueBatches.length > 0 && (
          <div className="relative self-start md:self-auto w-auto md:w-64 shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setIsBatchDropdownOpen(!isBatchDropdownOpen)}
              className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 pl-6 pr-12 text-sm font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-secondary/50 shadow-sm transition-all text-left flex items-center justify-between h-full"
            >
              <span className="truncate">
                {selectedBatch === 'All' 
                  ? `All Students (${students.filter(s => s.role === 'student').length})` 
                  : `${selectedBatch} (${students.filter(s => s.batch === selectedBatch).length})`}
              </span>
              <ChevronDown className={`absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-transform ${isBatchDropdownOpen ? 'rotate-180' : ''}`} />
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
                      All Students ({students.filter(s => s.role === 'student').length})
                    </button>
                    {uniqueBatches.map(batch => (
                      <button
                        key={batch}
                        onClick={() => { setSelectedBatch(batch); setIsBatchDropdownOpen(false); }}
                        className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors ${selectedBatch === batch ? 'bg-secondary/10 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                      >
                        {batch} ({students.filter(s => s.batch === batch).length})
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Table Card */}
      <div className="bg-slate-900 rounded-3xl border border-white/5 shadow-sm overflow-hidden mobile-card-table-wrapper">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-7 h-7 animate-spin text-slate-400" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-400">
            <Users className="w-10 h-10" />
            <p className="font-medium">{search ? 'No students match your search' : 'No students registered yet'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left mobile-card-table">
              <thead className="bg-slate-800 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Student Info</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5" />
                      Credentials
                    </div>
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Mobile / WhatsApp</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Role</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredStudents.map((student, i) => (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-blue-600/[0.02] transition-colors group"
                  >
                    {/* Student Info */}
                    <td className="px-6 py-5" data-label="Name">
                      <div 
                        className="flex items-center gap-3 cursor-pointer group/name"
                        onClick={() => fetchReadingHistory(student)}
                      >
                        <div className="w-9 h-9 rounded-xl bg-blue-600 group-hover/name:bg-secondary group-hover/name:text-slate-200 text-white flex items-center justify-center text-sm font-bold shrink-0 transition-colors">
                          {student.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="font-semibold text-slate-200 group-hover/name:text-blue-400 text-sm transition-colors">{student.name}</span>
                      </div>
                    </td>

                    {/* Credentials */}
                    <td className="px-6 py-5" data-label="Credentials">
                      <div className="space-y-1.5">
                        {/* Student ID */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase w-6">ID</span>
                          <code className="text-xs font-mono bg-blue-500/10 text-slate-200 px-2 py-0.5 rounded-md border border-white/10">
                            {student.name || '—'}
                          </code>
                          {student.name && (
                            <button
                              onClick={() => copyToClipboard(student.name, `id-${student.id}`)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-blue-400"
                            >
                              {copiedId === `id-${student.id}`
                                ? <Check className="w-3.5 h-3.5 text-green-500" />
                                : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                        {/* Password / PIN */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase w-6">PW</span>
                          <code className="text-xs font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-md border border-amber-500/20">
                            {student.password || student.pin || student.whatsapp_number || '—'}
                          </code>
                          {(student.password || student.pin) && (
                            <button
                              onClick={() => copyToClipboard(student.password || student.pin, `pw-${student.id}`)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-blue-400"
                            >
                              {copiedId === `pw-${student.id}`
                                ? <Check className="w-3.5 h-3.5 text-green-500" />
                                : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Mobile */}
                    <td className="px-6 py-5" data-label="Mobile">
                      <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
                        <Phone className="w-3.5 h-3.5 shrink-0 opacity-40" />
                        {student.whatsapp_number || '—'}
                      </div>
                    </td>

                    <td className="px-6 py-5 whitespace-nowrap" data-label="Role">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        student.role === 'admin'
                          ? 'bg-secondary/10 text-blue-400 border border-white/10'
                          : 'bg-blue-500/10 text-slate-400 border border-white/10'
                      }`}>
                        {student.role || 'student'}
                      </span>
                    </td>



                    {/* Actions */}
                    <td className="px-6 py-5 text-right actions-cell" data-label="Actions">
                      <div className="flex items-center justify-end gap-2">
                        <motion.button
                          onClick={() => {
                            setEditingStudent(student);
                            setEditFormData({
                              name: student.name,
                              mobile: student.whatsapp_number || '',
                              role: student.role || 'student',
                              batch: student.batch || ''
                            });
                            setIsEditModalOpen(true);
                          }}
                          className="w-8 h-8 flex items-center justify-center shrink-0 rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </motion.button>
                        {student.role !== 'admin' && (
                          <button
                            onClick={() => {
                              if (confirmDeleteId === student.id) {
                                deleteStudent(student.id, student.name);
                              } else {
                                setConfirmDeleteId(student.id);
                                setTimeout(() => {
                                  setConfirmDeleteId(prev => prev === student.id ? null : prev);
                                }, 3000);
                              }
                            }}
                            className={`h-8 min-w-[32px] rounded-full transition-all flex items-center justify-center overflow-hidden ${confirmDeleteId === student.id ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500/50 px-3 gap-2' : 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white hover:scale-110 active:scale-95'}`}
                          >
                            <Trash2 className="w-4 h-4 shrink-0" />
                            {confirmDeleteId === student.id && (
                              <span className="text-xs font-bold pr-1">Confirm</span>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              className="relative w-full max-w-[400px] bg-slate-900 rounded-2xl shadow-2xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.93, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 30 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              {/* Modal Header */}
              <div className="bg-blue-600 px-5 py-4 flex items-center gap-3 border-b border-white/10">
                <div className="w-9 h-9 shrink-0 bg-slate-900/10 border border-white/20 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-4.5 h-4.5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-sm font-bold text-white tracking-tight">Register New Student</h2>
                  <p className="text-[10px] text-white/50 mt-0.5">Name, mobile & batch are required</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 bg-slate-900/10 hover:bg-slate-900/20 rounded-lg flex items-center justify-center text-white/60 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleRegister} className="p-5 space-y-3.5">
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-blue-500/10 border border-primary/10 rounded-lg py-2.5 pl-10 pr-4 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary/40 transition-all"
                      placeholder="e.g. Muhammed Shafeed"
                    />
                  </div>
                </div>

                {/* Mobile */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">WhatsApp / Mobile</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <input
                      required
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="w-full bg-blue-500/10 border border-primary/10 rounded-lg py-2.5 pl-10 pr-4 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary/40 transition-all"
                      placeholder="e.g. 9100000000"
                      inputMode="numeric"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 pl-1 leading-snug">
                    Student logs in with their name + mobile number.
                    <br />
                    <span className="text-blue-400/70 font-bold">Note: JD-1, JD-2, and JD-3 students log in using their Name as their Password.</span>
                  </p>
                </div>

                {/* Batch */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Batch / Class</label>
                  <div className="relative">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422A12.083 12.083 0 0112 21a12.083 12.083 0 01-6.16-3.422L12 14z" /></svg>
                    <input
                      required
                      type="text"
                      value={formData.batch}
                      onChange={(e) => {
                        const newBatch = e.target.value;
                        const isJd = ['JD-1', 'JD-2', 'JD-3'].includes(newBatch.trim().toUpperCase());
                        setFormData({ 
                          ...formData, 
                          batch: newBatch,
                          mobile: isJd ? '0000000000' : formData.mobile
                        });
                      }}
                      className="w-full bg-blue-500/10 border border-primary/10 rounded-lg py-2.5 pl-10 pr-4 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary/40 transition-all"
                      placeholder="e.g. BSc CS 2024, Batch A, Class 10"
                    />
                  </div>
                </div>

                {/* Info Banner */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 flex items-start gap-2 text-[10px] text-blue-400 leading-normal">
                  <span className="shrink-0 mt-px">ℹ</span>
                  <span>Login credentials are auto-generated. Credentials will appear in the Student Registry table after registration.</span>
                </div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={registering}
                  className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-xs font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  whileHover={!registering ? { scale: 1.02 } : {}}
                  whileTap={!registering ? { scale: 0.97 } : {}}
                >
                  {registering
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><Check className="w-4 h-4" /> Register Student</>
                  }
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && editingStudent && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
            />
            <motion.div
              className="relative w-full max-w-[400px] bg-slate-900 rounded-2xl shadow-2xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.93, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 30 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <div className="bg-blue-600 px-5 py-4 flex items-center gap-3 border-b border-white/10">
                <div className="w-9 h-9 shrink-0 bg-slate-900/10 border border-white/20 rounded-lg flex items-center justify-center">
                  <Edit2 className="w-4.5 h-4.5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-sm font-bold text-white tracking-tight">Edit User Details</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-8 h-8 bg-slate-900/10 hover:bg-slate-900/20 rounded-lg flex items-center justify-center text-white/60 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-5 space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Name</label>
                  <input
                    required
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full bg-blue-500/10 border border-primary/10 rounded-lg py-2.5 px-3 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID</label>
                    <input
                      readOnly
                      type="text"
                      value={editFormData.name || '—'}
                      className="w-full bg-blue-500/10 border border-primary/10 rounded-lg py-2.5 px-3 text-xs font-medium text-slate-400 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PW</label>
                    <input
                      readOnly
                      type="text"
                      value={editingStudent.password || editingStudent.pin || editingStudent.whatsapp_number || '—'}
                      className="w-full bg-blue-500/10 border border-primary/10 rounded-lg py-2.5 px-3 text-xs font-medium text-slate-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mobile / WhatsApp</label>
                  <input
                    required
                    type="tel"
                    value={editFormData.mobile}
                    onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                    className="w-full bg-blue-500/10 border border-primary/10 rounded-lg py-2.5 px-3 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</label>
                    <div className="relative">
                      <select
                        value={editFormData.role}
                        onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                        className="w-full bg-blue-500/10 border border-primary/10 rounded-lg py-2.5 px-3 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all appearance-none cursor-pointer"
                      >
                        <option value="student">Student</option>
                        <option value="admin">Admin</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Batch</label>
                    <input
                      type="text"
                      value={editFormData.batch}
                      onChange={(e) => {
                        const newBatch = e.target.value;
                        const isJd = ['JD-1', 'JD-2', 'JD-3'].includes(newBatch.trim().toUpperCase());
                        setEditFormData({ 
                          ...editFormData, 
                          batch: newBatch,
                          mobile: isJd ? '0000000000' : editFormData.mobile
                        });
                      }}
                      className="w-full bg-blue-500/10 border border-primary/10 rounded-lg py-2.5 px-3 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 bg-blue-500/10 text-slate-200 rounded-lg py-2.5 text-xs font-bold hover:bg-blue-600/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 text-xs font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {historyModalOpen && selectedHistoryStudent && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setHistoryModalOpen(false)}
            />
            <motion.div
              className="relative w-full max-w-2xl bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
              initial={{ opacity: 0, scale: 0.93, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 30 }}
            >
              <div className="bg-blue-600 px-6 py-5 flex items-center gap-4 border-b border-white/10 shrink-0">
                <div className="w-10 h-10 shrink-0 bg-slate-900/10 border border-white/20 rounded-xl flex items-center justify-center text-white font-bold">
                  {selectedHistoryStudent.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-white tracking-tight">{selectedHistoryStudent.name}</h2>
                  <p className="text-xs text-white/60 mt-0.5">Reading History</p>
                </div>
                <button
                  onClick={() => setHistoryModalOpen(false)}
                  className="w-8 h-8 bg-slate-900/10 hover:bg-slate-900/20 rounded-lg flex items-center justify-center text-white/60 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar bg-slate-800/50">
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                  </div>
                ) : readingHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-20 opacity-50">
                    <Library className="w-12 h-12 mb-4 text-slate-200" />
                    <p className="text-sm font-bold text-slate-200">No reading history found.</p>
                    <p className="text-xs text-slate-400 mt-1">This student hasn't issued any books yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {readingHistory.map(tx => (
                      <div key={tx.transaction_id} className="bg-slate-900 border border-white/5 p-4 rounded-xl shadow-sm flex items-start gap-4 group/item transition-all hover:border-white/10">
                        <div className="w-10 h-14 bg-blue-500/10 rounded-md border border-white/10 flex items-center justify-center shrink-0">
                          <Book className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-slate-200 truncate">{tx.books?.title || 'Unknown Book'}</h4>
                          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-0.5">{tx.books?.author || 'Unknown Author'}</p>
                          <div className="flex items-center gap-3 mt-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              tx.status === 'Returned' ? 'bg-green-500/10 text-green-400' :
                              tx.status === 'Issued' ? 'bg-blue-500/10 text-blue-400' :
                              'bg-amber-500/10 text-amber-400'
                            }`}>
                              {tx.status}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {formatDate(tx.created_at)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (confirmDeleteHistoryId === tx.transaction_id) {
                              deleteHistoryRecord(tx.transaction_id);
                            } else {
                              setConfirmDeleteHistoryId(tx.transaction_id);
                              setTimeout(() => {
                                setConfirmDeleteHistoryId(prev => prev === tx.transaction_id ? null : prev);
                              }, 3000);
                            }
                          }}
                          className={`h-8 min-w-[32px] rounded-full transition-all flex items-center justify-center overflow-hidden shrink-0 ${confirmDeleteHistoryId === tx.transaction_id ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500/50 opacity-100 px-3 gap-1.5' : 'text-red-400 hover:bg-red-500/10 hover:text-red-400 opacity-0 group-hover/item:opacity-100'}`}
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4 shrink-0" />
                          {confirmDeleteHistoryId === tx.transaction_id && (
                            <span className="text-[10px] font-bold pr-1 uppercase">Confirm</span>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
