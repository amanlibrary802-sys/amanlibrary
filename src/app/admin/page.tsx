'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { 
  BookOpen, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  Library, 
  Loader2,
  ChevronRight,
  Trophy,
  Medal,
  Frown,
  AlertTriangle,
  Calendar,
  Plus,
  Check,
  Trash2,
  Clock,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

interface LibraryEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  description?: string;
  completed: boolean;
}

export default function AdminOverview() {
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    ordered: 0,
    issued: 0
  });
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [topReaders, setTopReaders] = useState<any[]>([]);
  const [leastActive, setLeastActive] = useState<any[]>([]);
  const [rankType, setRankType] = useState<'top' | 'least'>('top');
  const [loading, setLoading] = useState(true);

  // Events State
  const [events, setEvents] = useState<LibraryEvent[]>([]);
  const [activeEventTab, setActiveEventTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '', description: '' });

  useEffect(() => {
    fetchStats();
    fetchRecentActivity();
    fetchRankings();
    loadEvents();
  }, []);

  const loadEvents = () => {
    const savedEvents = localStorage.getItem('aman_library_events');
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    } else {
      // Compute relative dates so mock data remains correctly classified on load
      const upcomingDate = new Date();
      upcomingDate.setDate(upcomingDate.getDate() + 3);
      const upcomingStr = upcomingDate.toISOString().split('T')[0];

      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 12);
      const scheduledStr = scheduledDate.toISOString().split('T')[0];

      const defaultEvents: LibraryEvent[] = [
        {
          id: '1',
          title: 'Weekly Reader Circle Meetup',
          date: upcomingStr,
          time: '04:30 PM',
          description: 'Weekly discussion on modern literary analysis and history.',
          completed: false
        },
        {
          id: '2',
          title: 'Annual Book Exhibition 2026',
          date: scheduledStr,
          time: '09:00 AM',
          description: 'Showcasing rare Islamic manuscripts and historical prints.',
          completed: false
        },
        {
          id: '3',
          title: 'Librarian Training Workshop',
          date: '2026-05-10',
          time: '10:00 AM',
          description: 'Completed onboarding session for barcode reader integration.',
          completed: true
        }
      ];
      setEvents(defaultEvents);
      localStorage.setItem('aman_library_events', JSON.stringify(defaultEvents));
    }
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date || !newEvent.time) return;

    const eventToAdd: LibraryEvent = {
      id: Date.now().toString(),
      title: newEvent.title,
      date: newEvent.date,
      time: newEvent.time,
      description: newEvent.description,
      completed: false
    };

    const updated = [eventToAdd, ...events];
    setEvents(updated);
    localStorage.setItem('aman_library_events', JSON.stringify(updated));
    setNewEvent({ title: '', date: '', time: '', description: '' });
    setShowAddEvent(false);
  };

  const handleToggleComplete = (id: string) => {
    const updated = events.map(e => e.id === id ? { ...e, completed: !e.completed } : e);
    setEvents(updated);
    localStorage.setItem('aman_library_events', JSON.stringify(updated));
  };

  const handleDeleteEvent = (id: string) => {
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    localStorage.setItem('aman_library_events', JSON.stringify(updated));
  };

  // Helper date calculations for dynamic tabs
  const getEventLists = () => {
    const upcoming = events.filter(e => !e.completed);
    const completed = events.filter(e => e.completed);
    return { upcoming, completed };
  };

  const { upcoming: upcomingEvents, completed: completedEvents } = getEventLists();

  const fetchRankings = async () => {
    const { data: students } = await supabase.from('students').select('id, name, batch').eq('role', 'student');
    const { data: txs } = await supabase.from('transactions').select('student_id, status');
    
    if (students && txs) {
      const topCounts: any = {};
      const activityCounts: any = {};
      
      students.forEach(s => {
        topCounts[s.id] = { id: s.id, name: s.name, batch: s.batch || 'No Batch', count: 0 };
        activityCounts[s.id] = { id: s.id, name: s.name, batch: s.batch || 'No Batch', count: 0 };
      });

      txs.forEach((tx: any) => {
        const student = students.find(s => s.id === tx.student_id);
        if (student) {
          if (tx.status === 'Returned') {
            topCounts[student.id].count++;
          }
          activityCounts[student.id].count++;
        }
      });

      const topRanked = Object.values(topCounts)
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 5);

      const leastRanked = Object.values(activityCounts)
        .sort((a: any, b: any) => a.count - b.count)
        .slice(0, 5);
      
      setTopReaders(topRanked);
      setLeastActive(leastRanked);
    }
  };

  const fetchRecentActivity = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('*, books(*), students(*)')
      .order('created_at', { ascending: false })
      .limit(5);
    setRecentActivity(data || []);
  };

  const fetchStats = async () => {
    let allBooks: any[] = [];
    let page = 0;
    
    while (true) {
      const { data } = await supabase
        .from('books')
        .select('status, category, total_copies')
        .range(page * 1000, (page + 1) * 1000 - 1);
        
      if (!data || data.length === 0) break;
      allBooks = [...allBooks, ...data];
      if (data.length < 1000) break;
      page++;
    }
    
    if (allBooks.length > 0) {
      const s = {
        total: allBooks.reduce((acc, b) => acc + (b.total_copies || 1), 0),
        available: allBooks.filter(b => b.status === 'Available').reduce((acc, b) => acc + (b.total_copies || 1), 0),
        ordered: allBooks.filter(b => b.status === 'Ordered').reduce((acc, b) => acc + (b.total_copies || 1), 0),
        issued: allBooks.filter(b => b.status === 'Issued').reduce((acc, b) => acc + (b.total_copies || 1), 0)
      };
      setStats(s);

      const categories = allBooks.reduce((acc: any, b) => {
        acc[b.category] = (acc[b.category] || 0) + (b.total_copies || 1);
        return acc;
      }, {});

      setCategoryStats(Object.entries(categories).map(([name, count]) => ({ name, count })));
    }
    setLoading(false);
  };

  const statCards = [
    { label: 'Total Books', value: stats.total, icon: Library, color: 'text-blue-400 bg-blue-500/10', href: '/admin/books' },
    { label: 'Available', value: stats.available, icon: BookOpen, color: 'text-green-400 bg-green-500/10', href: '/admin/books' },
    { label: 'Ordered', value: stats.ordered, icon: ShoppingCart, color: 'text-amber-400 bg-amber-500/10', href: '/admin/orders' },
    { label: 'Issued', value: stats.issued, icon: Users, color: 'text-cyan-400 bg-cyan-500/10', href: '/admin/loans' },
  ];

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-200" /></div>;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-amiri font-bold text-slate-200 mb-2">Library Overview</h1>
        <p className="text-slate-400 font-medium">Real-time status of Aman Library collection.</p>
      </div>

      {/* Stats Grid — 2 cols on mobile, 4 on desktop */}
      <div className="stat-cards-grid grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((stat, i) => (
          <Link href={stat.href} key={stat.label}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-slate-900 p-4 sm:p-6 rounded-3xl border border-white/5 shadow-sm hover:shadow-md hover:border-secondary/30 transition-all duration-300 ease-in-out cursor-pointer h-full"
            >
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl ${stat.color} flex items-center justify-center mb-3 sm:mb-4`}>
                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-200">{stat.value}</h3>
            </motion.div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* Left Column: Category Breakdown & Events */}
        <div className="flex flex-col gap-8 h-full">
          {/* Category Breakdown */}
          <section className="bg-slate-900 rounded-3xl border border-white/5 shadow-sm p-5 sm:p-8 flex-none">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 sm:mb-8">
              <h2 className="text-2xl font-amiri font-bold text-slate-200">Category Breakdown</h2>
              <div className="flex items-center gap-2 text-slate-400 text-[10px] sm:text-xs font-bold bg-slate-800 px-3 py-1.5 rounded-full uppercase shrink-0">
                <TrendingUp className="w-3 h-3" />
                Stock Levels
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {categoryStats.map((cat) => (
                <div key={cat.name} className="group cursor-pointer">
                  <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                    <span className="font-bold text-[13px] sm:text-sm text-slate-200 truncate mr-4">{cat.name}</span>
                    <span className="text-[11px] sm:text-xs font-bold text-slate-400 whitespace-nowrap">{cat.count} Books</span>
                  </div>
                  <div className="h-1.5 sm:h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(cat.count / stats.total) * 100}%` }}
                      className="h-full bg-secondary"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Library Events Section */}
          <section className="bg-slate-900 rounded-3xl border border-white/5 shadow-sm p-5 sm:p-8 flex-1 flex flex-col">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-amiri font-bold text-slate-200">Library Events</h2>
                <p className="text-xs text-slate-400 mt-1">Schedule and monitor library meetings and programs.</p>
              </div>
              <button
                onClick={() => setShowAddEvent(!showAddEvent)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-3 sm:py-2 bg-slate-800 text-white border border-white/10 hover:bg-slate-700 hover:bg-slate-700 hover:text-slate-200 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                {showAddEvent ? 'CANCEL' : 'ADD EVENT'}
              </button>
            </div>

            {/* Add Event Form */}
            {showAddEvent && (
              <motion.form 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 border border-white/5 rounded-2xl p-5 mb-6 space-y-4"
                onSubmit={handleAddEvent}
              >
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Create New Event</h3>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Event Title</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Weekly Reader Circle Meetup"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 px-3.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary/40 transition-all font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</label>
                    <input
                      required
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 px-3.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary/40 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. 04:30 PM"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 px-3.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary/40 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</label>
                  <input
                    type="text"
                    placeholder="Brief details about the program..."
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 px-3.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary/40 transition-all font-medium"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-800 text-white border border-white/10 hover:bg-slate-700 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-700 hover:text-slate-200 transition-all active:scale-95 shadow-sm"
                >
                  SAVE EVENT
                </button>
              </motion.form>
            )}

            {/* Event Tabs */}
            <div className="flex p-1 bg-slate-800 rounded-xl border border-white/5 mb-6 w-full">
              {(['upcoming', 'completed'] as const).map((tab) => {
                const count = tab === 'upcoming' 
                  ? upcomingEvents.length 
                  : completedEvents.length;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveEventTab(tab)}
                    className={`flex-1 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all ${
                      activeEventTab === tab 
                        ? 'bg-slate-800 text-white border border-white/10 hover:bg-slate-700 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab} ({count})
                  </button>
                );
              })}
            </div>

            {/* Event List */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-1 min-h-[200px] custom-scrollbar">
              {(() => {
                const currentTabEvents = activeEventTab === 'upcoming' 
                  ? upcomingEvents 
                  : completedEvents;

                if (currentTabEvents.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 font-bold italic text-xs">
                      No {activeEventTab} events found.
                    </div>
                  );
                }

                return currentTabEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    layoutId={event.id}
                    className="bg-slate-800/50 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:border-white/10 transition-all group"
                  >
                    <div className="flex items-start gap-3 w-full sm:w-auto flex-1 min-w-0">
                      <div className={`p-2.5 rounded-xl shrink-0 mt-1 sm:mt-0 ${
                        event.completed 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {event.completed ? <Check className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-bold text-slate-200 leading-snug ${event.completed ? 'line-through opacity-50' : ''}`}>
                          {event.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 font-bold uppercase mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-400" />
                            {event.time}
                          </span>
                          <span>•</span>
                          <span>{formatDate(event.date)}</span>
                        </div>
                        {event.description && (
                          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto justify-end mt-2 sm:mt-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity pt-2 sm:pt-0 border-t border-white/5 sm:border-t-0 mt-3 sm:mt-0">
                      {!event.completed && (
                        <button
                          onClick={() => handleToggleComplete(event.id)}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 sm:px-3 sm:py-2 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-600 hover:text-white font-bold text-[10px] sm:text-xs transition-colors shadow-sm flex-1 sm:flex-none"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          MARK DONE
                        </button>
                      )}
                      {event.completed && (
                        <button
                          onClick={() => handleToggleComplete(event.id)}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 sm:px-3 sm:py-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-600 hover:text-white font-bold text-[10px] sm:text-xs transition-colors shadow-sm flex-1 sm:flex-none"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          RESTORE
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-colors shadow-sm shrink-0 hover:scale-110 active:scale-95"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ));
              })()}
            </div>
          </section>
        </div>

        {/* Right Column: Top Readers & Recent Activity */}
        <div className="flex flex-col gap-8 h-full">
          <div className="bg-slate-900 rounded-3xl border border-white/5 shadow-sm p-5 sm:p-8 relative overflow-hidden group flex-none">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/islamic-art.png')] pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5 sm:mb-6">
                <h3 className="text-xl sm:text-2xl font-amiri font-bold text-slate-200">
                  {rankType === 'top' ? 'Top Readers' : 'Least Active'}
                </h3>
                <div className="flex bg-slate-900/10 p-1 rounded-xl shrink-0">
                  <button 
                    onClick={() => setRankType('top')}
                    className={`px-3 py-1 rounded-lg text-[9px] sm:text-[10px] font-black transition-all ${rankType === 'top' ? 'bg-secondary text-slate-200 shadow-lg' : 'text-blue-400/40 hover:text-blue-400'}`}
                  >
                    TOP
                  </button>
                  <button 
                    onClick={() => setRankType('least')}
                    className={`px-3 py-1 rounded-lg text-[9px] sm:text-[10px] font-black transition-all ${rankType === 'least' ? 'bg-secondary text-slate-200 shadow-lg' : 'text-blue-400/40 hover:text-blue-400'}`}
                  >
                    LEAST
                  </button>
                </div>
              </div>
              
              <div className="space-y-2.5 sm:space-y-4">
                {(rankType === 'top' ? topReaders : leastActive).map((reader, i) => (
                  <div key={reader.id} className="flex items-center justify-between bg-slate-800/50 p-2 sm:p-3 rounded-xl border border-white/5 hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center text-[9px] sm:text-[10px] font-bold ${
                        rankType === 'top' ? (
                          i === 0 ? 'bg-amber-400 text-slate-200' : 
                          i === 1 ? 'bg-slate-300 text-slate-200' : 
                          i === 2 ? 'bg-amber-700 text-white' : 
                          'bg-slate-900/10 text-blue-400'
                        ) : 'bg-red-400/20 text-red-200'
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[13px] sm:text-sm font-bold truncate max-w-[120px] sm:max-w-[150px] capitalize leading-snug text-slate-200">{reader.name}</span>
                        <span className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-wider truncate max-w-[120px] sm:max-w-[150px]">
                          {reader.batch}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold text-blue-400/60">
                      {rankType === 'top' ? (
                        <Medal className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-400/40" />
                      ) : (
                        <Frown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-400/40" />
                      )}
                      <span className="whitespace-nowrap">{reader.count} {rankType === 'top' ? 'Books Read' : 'Borrows'}</span>
                    </div>
                  </div>
                ))}
                {(rankType === 'top' ? topReaders : leastActive).length === 0 && (
                  <p className="text-center py-6 text-blue-400/30 font-bold italic">
                    {rankType === 'top' ? 'No ranking data available yet—start issuing books!' : 'All students are currently active!'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl border border-white/5 shadow-sm p-5 sm:p-8 flex-1 flex flex-col">
            <h3 className="text-xl font-amiri font-bold text-slate-200 mb-6">Recent Activity</h3>
            <div className="space-y-6 flex-1 overflow-y-auto pr-1 min-h-[200px] custom-scrollbar">
              {recentActivity.map((activity, i) => (
                <div key={activity.transaction_id} className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-blue-400">
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-slate-200">
                      <span className="text-blue-400 mr-2 uppercase text-[10px] tracking-wider">
                        {activity.status === 'Reserved' ? 'Ordered' : activity.status === 'Issued' ? 'Issued' : 'Returned'}
                      </span>
                      {activity.books?.title}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                      {activity.students?.name} • {formatDate(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <p className="text-center py-10 text-slate-400 font-bold">No recent activity found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
