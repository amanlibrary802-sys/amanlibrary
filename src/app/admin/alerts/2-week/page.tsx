'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Bell, User, Calendar, Loader2, MessageCircle, Search } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function TwoWeekReminders() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    const today = new Date();
    // 14 days ago
    const startRange = new Date(new Date().setDate(today.getDate() - 14)).toISOString().split('T')[0];
    // 20 days ago (range is 14-20 days)
    const endRange = new Date(new Date().setDate(today.getDate() - 20)).toISOString().split('T')[0];

    const { data } = await supabase
      .from('transactions')
      .select('*, books(*), students(*)')
      .eq('status', 'Issued')
      .lte('issue_date', startRange)
      .gte('issue_date', endRange);
    
    setAlerts(data || []);
    setLoading(false);
  };

  const getWhatsAppLink = (alertItem: any) => {
    const phone = alertItem.students.whatsapp_number.replace(/\D/g, '');
    const message = `Hello ${alertItem.students.name}, you have 1 week remaining to return "${alertItem.books.title}".`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-amiri font-bold text-primary mb-2">2-Week Reminders</h1>
        <p className="text-primary/60 font-medium">Students who have held books for 14-20 days (1 week left).</p>
      </div>

      <div className="relative group max-w-sm">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/30 group-focus-within:text-secondary transition-colors w-4 h-4" />
        <input
          type="text"
          placeholder="Search by student or book..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-secondary/20 rounded-xl py-3 pl-11 pr-4 text-primary focus:outline-none focus:ring-2 focus:ring-secondary/50 shadow-sm transition-all text-sm font-medium"
        />
      </div>

      <div className="bg-white rounded-3xl border border-secondary/10 shadow-sm overflow-hidden mobile-card-table-wrapper">
        <table className="w-full text-left mobile-card-table">
          <thead className="bg-cream border-b border-secondary/10">
            <tr>
              <th className="px-8 py-5 text-xs font-bold text-primary/40 uppercase tracking-widest">Student</th>
              <th className="px-8 py-5 text-xs font-bold text-primary/40 uppercase tracking-widest">Book Title</th>
              <th className="px-8 py-5 text-xs font-bold text-primary/40 uppercase tracking-widest">Held Since</th>
              <th className="px-8 py-5 text-xs font-bold text-primary/40 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary/5">
            {alerts.filter(alertItem => {
              const q = searchQuery.toLowerCase();
              return alertItem.students.name.toLowerCase().includes(q) || 
                     alertItem.books.title.toLowerCase().includes(q);
            }).map((alertItem) => (
              <tr key={alertItem.transaction_id} className="hover:bg-cream/30 transition-colors">
                <td className="px-8 py-6" data-label="Student">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-primary">{alertItem.students.name}</div>
                      <div className="text-[10px] text-primary/40 font-bold uppercase">{alertItem.students.whatsapp_number}</div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6" data-label="Book Title">
                  <div className="font-bold text-primary text-sm" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>{alertItem.books.title}</div>
                </td>
                <td className="px-8 py-6" data-label="Held Since">
                  <div className="flex items-center gap-2 text-primary/60 text-xs font-bold uppercase">
                    <Calendar className="w-4 h-4 text-secondary/40 shrink-0" />
                    {formatDate(alertItem.issue_date)}
                  </div>
                </td>
                <td className="px-8 py-6 text-right actions-cell" data-label="Action">
                  <a
                    href={getWhatsAppLink(alertItem)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-auto bg-green-50 text-green-600 border border-green-100 px-4 py-2 h-9 rounded-xl font-bold text-[11px] hover:bg-green-600 hover:text-white transition-all flex items-center justify-center gap-1.5 ml-auto shadow-sm"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    REMIND
                  </a>
                </td>
              </tr>
            ))}
            {alerts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center text-primary/30 font-bold">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  No students currently at the 2-week mark.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
