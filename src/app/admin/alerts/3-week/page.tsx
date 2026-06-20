'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { AlertCircle, User, Calendar, Loader2, MessageCircle, Search } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function ThreeWeekAlerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    const today = new Date();
    // 21 days ago or more
    const twentyOneDaysAgo = new Date(today.setDate(today.getDate() - 21)).toISOString().split('T')[0];

    const { data } = await supabase
      .from('transactions')
      .select('*, books(*), students(*)')
      .eq('status', 'Issued')
      .lte('issue_date', twentyOneDaysAgo);
    
    setAlerts(data || []);
    setLoading(false);
  };

  const getWhatsAppLink = (alertItem: any) => {
    const phone = alertItem.students.whatsapp_number.replace(/\D/g, '');
    const message = `Hello ${alertItem.students.name}, the 3-week return period for "${alertItem.books.title}" is complete. Please return it to the library immediately.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-200" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-amiri font-bold text-slate-200 mb-2">3rd Week Alerts</h1>
        <p className="text-slate-400 font-medium">Students who have held books for 21 days or more (Officially Due).</p>
      </div>

      <div className="relative group max-w-sm">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors w-4 h-4" />
        <input
          type="text"
          placeholder="Search by student or book..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-secondary/50 shadow-sm transition-all text-sm font-medium"
        />
      </div>

      <div className="bg-slate-900 rounded-3xl border border-white/5 shadow-sm overflow-hidden mobile-card-table-wrapper">
        <table className="w-full text-left mobile-card-table">
          <thead className="bg-slate-800 border-b border-white/5">
            <tr>
              <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Student</th>
              <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Book Title</th>
              <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Held Since</th>
              <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {alerts.filter(alertItem => {
              const q = searchQuery.toLowerCase();
              return alertItem.students.name.toLowerCase().includes(q) || 
                     alertItem.books.title.toLowerCase().includes(q);
            }).map((alertItem) => (
              <tr key={alertItem.transaction_id} className="hover:bg-slate-800/50 transition-colors">
                <td className="px-8 py-6" data-label="Student">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-200">{alertItem.students.name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{alertItem.students.whatsapp_number}</div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6" data-label="Book Title">
                  <div className="font-bold text-slate-200 text-sm" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>{alertItem.books.title}</div>
                </td>
                <td className="px-8 py-6" data-label="Held Since">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
                    <Calendar className="w-4 h-4 text-blue-400/40 shrink-0" />
                    {formatDate(alertItem.issue_date)}
                  </div>
                </td>
                <td className="px-8 py-6 text-right actions-cell" data-label="Action">
                  <a
                    href={getWhatsAppLink(alertItem)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-auto bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 h-9 rounded-xl font-bold text-[11px] hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-1.5 ml-auto shadow-sm"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WARN
                  </a>
                </td>
              </tr>
            ))}
            {alerts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  No books are currently overdue (3-week mark).
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
