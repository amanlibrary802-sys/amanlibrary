'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { ShoppingCart, CheckCircle, User, Calendar, Loader2, MessageCircle, XCircle } from 'lucide-react';

export default function OrdersQueue() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState('All');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('*, books(*), students(*)')
      .eq('status', 'Reserved')
      .order('created_at', { ascending: true });
    
    setOrders(data || []);
    setLoading(false);
  };

  const getWhatsAppLink = (order: any) => {
    const phone = (order.students?.whatsapp_number || '').replace(/\D/g, '');
    const message = `Hello ${order.students?.name || 'Student'}, your request for "${order.books?.title || 'a book'}" has been approved. You can pick it up at the library.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const confirmIssue = async (order: any) => {
    // Open window synchronously to bypass browser popup blockers
    const popup = window.open('about:blank', '_blank');
    
    setConfirming(order.transaction_id);
    try {
      const response = await fetch(`/api/orders/${order.transaction_id}/confirm`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: order.book_id }),
      });

      if (response.ok) {
        fetchOrders();
        // Navigate the already-opened window
        if (popup) popup.location.href = getWhatsAppLink(order);
      } else {
        if (popup) popup.close();
        const error = await response.json();
        alert(error.error || 'Failed to confirm issue');
      }
    } catch (err) {
      if (popup) popup.close();
      alert('Network error');
    } finally {
      setConfirming(null);
    }
  };

  const getRejectWhatsAppLink = (order: any) => {
    const phone = (order.students?.whatsapp_number || '').replace(/\D/g, '');
    const message = `Hello ${order.students?.name || 'Student'}, unfortunately your request for "${order.books?.title || 'a book'}" could not be approved at this time as it is unavailable.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const rejectIssue = async (order: any) => {
    // Open window synchronously to bypass browser popup blockers
    const popup = window.open('about:blank', '_blank');
    
    setRejecting(order.transaction_id);
    try {
      const response = await fetch(`/api/orders/${order.transaction_id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: order.book_id }),
      });

      if (response.ok) {
        fetchOrders();
        // Navigate the already-opened window
        if (popup) popup.location.href = getRejectWhatsAppLink(order);
      } else {
        if (popup) popup.close();
        const error = await response.json();
        alert(error.error || 'Failed to reject issue');
      }
    } catch (err) {
      if (popup) popup.close();
      alert('Network error');
    } finally {
      setRejecting(null);
    }
  };

  const uniqueBatches = Array.from(
    new Set(orders.map(o => o.students?.batch).filter(Boolean))
  ).sort() as string[];

  const filteredOrders = orders.filter(order => 
    selectedBatch === 'All' || order.students?.batch === selectedBatch
  );

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-amiri font-bold text-primary mb-2">Orders Queue</h1>
          <p className="text-primary/60 font-medium">Pending book requests from students.</p>
        </div>

        {/* Batch Dropdown */}
        {uniqueBatches.length > 0 && (
          <div className="relative w-full sm:w-auto min-w-[200px]">
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full appearance-none bg-white border border-secondary/10 rounded-2xl py-3 pl-5 pr-10 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-secondary/50 shadow-sm cursor-pointer"
            >
              <option value="All">All Batches ({orders.length})</option>
              {uniqueBatches.map(batch => (
                <option key={batch} value={batch}>
                  {batch} ({orders.filter(o => o.students?.batch === batch).length})
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary/40">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-secondary/10 shadow-sm overflow-hidden mobile-card-table-wrapper">
        <table className="w-full text-left mobile-card-table">
          <thead className="bg-cream border-b border-secondary/10">
            <tr>
              <th className="px-8 py-5 text-xs font-bold text-primary/40 uppercase tracking-widest">Book</th>
              <th className="px-8 py-5 text-xs font-bold text-primary/40 uppercase tracking-widest">Student</th>
              <th className="px-8 py-5 text-xs font-bold text-primary/40 uppercase tracking-widest">Date</th>
              <th className="px-8 py-5 text-xs font-bold text-primary/40 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary/5">
            {filteredOrders.map((order) => (
              <tr key={order.transaction_id} className="hover:bg-cream/30 transition-colors">
                <td className="px-8 py-6" data-label="Book Title">
                  <div className="text-[14px] font-bold text-primary" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>{order.books.title}</div>
                  <div className="text-[10px] text-primary/30 font-bold uppercase tracking-widest mt-0.5">{order.books.author}</div>
                </td>
                <td className="px-8 py-6" data-label="Student">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-primary">
                        {order.students?.name} {order.students?.batch ? <span className="text-primary/40 font-normal ml-1">• {order.students.batch}</span> : ''}
                      </div>
                      <div className="text-[10px] text-primary/40 font-bold uppercase">{order.students?.whatsapp_number}</div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6" data-label="Date">
                  <div className="flex items-center gap-2 text-primary/60 text-sm font-medium">
                    <Calendar className="w-4 h-4 text-secondary/40 shrink-0" />
                    {order.order_date}
                  </div>
                </td>
                <td className="px-8 py-6 text-right actions-cell" data-label="Action">
                  <div className="flex justify-end gap-2 w-full sm:w-auto">
                    <button
                      disabled={confirming === order.transaction_id || rejecting === order.transaction_id}
                      onClick={() => confirmIssue(order)}
                      className="flex-1 sm:flex-none bg-primary text-secondary px-4 py-2.5 h-10 rounded-xl font-bold text-xs hover:bg-secondary hover:text-primary transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {confirming === order.transaction_id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5" />
                      )}
                      APPROVE
                    </button>
                    <button
                      disabled={confirming === order.transaction_id || rejecting === order.transaction_id}
                      onClick={() => rejectIssue(order)}
                      className="flex-1 sm:flex-none bg-red-50 text-red-500 px-4 py-2.5 h-10 rounded-xl font-bold text-xs hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 border border-red-100"
                    >
                      {rejecting === order.transaction_id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      REJECT
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center text-primary/30 font-bold">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  No pending orders at the moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
