'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  BookOpen,
  User,
  MapPin,
  Tag,
  Hash,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShoppingBag,
  BookMarked,
  Layers,
} from 'lucide-react';

export interface BookDetail {
  book_id?: string;
  id?: string;
  title: string;
  author: string;
  category?: string;
  status?: string;
  shelf_loc?: string;
  total_copies?: number;
  created_at?: string;
}

interface BookDetailModalProps {
  book: BookDetail | null;
  onClose: () => void;
  onOrder?: (id: string) => void;
  onCancel?: (id: string) => void;
  ordering?: boolean;
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
  Available: {
    label: 'Available',
    icon: <CheckCircle2 className="w-4 h-4" />,
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    border: 'border-green-500/20',
  },
  Ordered: {
    label: 'Ordered / Reserved',
    icon: <Clock className="w-4 h-4" />,
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
  },
  Issued: {
    label: 'Currently Issued',
    icon: <AlertCircle className="w-4 h-4" />,
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
  },
};

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
      <span className="mt-0.5 p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-slate-200 break-words">{value}</p>
      </div>
    </div>
  );
}

const CATEGORY_PREFIX: Record<string, string> = {
  'Religion':                   'R',
  'Study':                      'S',
  'Literature':                 'L',
  'Motivation and Psychology':  'M',
  'Motivation & Psychology':    'M',
  'History':                    'H',
  'Auto and Biography':         'A',
  'Autobiography':              'A',
  'Science':                    'Sc',
  'Language':                   'La',
  'Dictionary':                 'D',
  'Kithabs':                    'K',
};

export default function BookDetailModal({ book, onClose, onOrder, onCancel, ordering }: BookDetailModalProps) {
  if (!book) return null;

  const bookId = book.book_id ?? book.id ?? '';
  const status = book.status || 'Available';
  const st = statusConfig[status] || statusConfig['Available'];
  const isAvailable = status === 'Available';

  const handleOrder = () => {
    if (onOrder && isAvailable) onOrder(bookId);
  };

  return (
    <AnimatePresence>
      {book && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal Panel */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.93, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 30 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 cursor-pointer"
            aria-modal="true"
            role="dialog"
            onClick={onClose}
          >
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="relative w-full max-w-[360px] bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col cursor-default border border-white/10"
            >
              {/* Header */}
              <div className="bg-slate-800/50 px-6 pt-8 pb-10 relative overflow-hidden border-b border-white/5">
                {/* Decorative ring */}
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-secondary/10 pointer-events-none" />
                <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />



                <div className="flex items-center gap-4 relative z-10">
                  <div className="p-4 rounded-2xl bg-blue-500/20 text-blue-400 shrink-0">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-amiri font-bold text-slate-200 leading-tight line-clamp-2">
                      {book.title}
                    </h2>
                    <p className="text-slate-400 text-sm font-medium mt-1 truncate">{book.author}</p>
                  </div>
                </div>

                {/* Status pill */}
                <div className={`inline-flex items-center gap-2 mt-5 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider relative z-10 ${st.bg} ${st.text} ${st.border}`}>
                  {st.icon}
                  {st.label}
                </div>
              </div>

              {/* Body */}
              <div className="px-6 pb-6 flex-1 overflow-y-auto">
                <div className="divide-y divide-white/5">
                  <InfoRow
                    icon={<User className="w-4 h-4" />}
                    label="Author"
                    value={book.author}
                  />
                  {book.category && (
                    <InfoRow
                      icon={<Tag className="w-4 h-4" />}
                      label="Category"
                      value={book.category}
                    />
                  )}
                  <InfoRow
                    icon={<MapPin className="w-4 h-4" />}
                    label="Shelf Location"
                    value={(() => {
                      if (!book.shelf_loc) return 'Not assigned';
                      if (/^[A-Za-z]/.test(book.shelf_loc)) return book.shelf_loc.toUpperCase();
                      const prefix = book.category ? (CATEGORY_PREFIX[book.category] ?? book.category.charAt(0).toUpperCase()) : '';
                      return `${prefix}${book.shelf_loc}`;
                    })()}
                  />
                  {book.total_copies !== undefined && (
                    <InfoRow
                      icon={<Layers className="w-4 h-4" />}
                      label="Total Copies"
                      value={`${book.total_copies} cop${book.total_copies === 1 ? 'y' : 'ies'} in library`}
                    />
                  )}
                  {book.book_id && (
                    <InfoRow
                      icon={<Hash className="w-4 h-4" />}
                      label="Book ID"
                      value={
                        <span className="font-mono text-xs bg-slate-800 text-slate-300 border border-white/10 px-2 py-0.5 rounded-lg">
                          {book.book_id}
                        </span>
                      }
                    />
                  )}
                </div>

                {/* Action buttons */}
                <div className="mt-6 flex flex-col gap-3">
                  {onOrder && (
                    <button
                      onClick={handleOrder}
                      disabled={!isAvailable || ordering}
                      className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm
                        ${isAvailable
                          ? 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95 shadow-lg shadow-blue-500/20'
                          : 'hidden'
                        }`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      {ordering ? 'Processing...' : 'Confirm Order'}
                    </button>
                  )}

                  {!isAvailable && status === 'Ordered' && onCancel ? (
                    <button
                      onClick={() => onCancel(bookId)}
                      disabled={ordering}
                      className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white active:scale-95"
                    >
                      <X className="w-4 h-4" />
                      {ordering ? 'Processing...' : 'Cancel Order'}
                    </button>
                  ) : !isAvailable ? (
                    <button
                      disabled
                      className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm bg-slate-800/50 text-slate-500 border border-white/5 cursor-not-allowed"
                    >
                      <BookMarked className="w-4 h-4" />
                      Book Unavailable
                    </button>
                  ) : null}

                  <button
                    onClick={onClose}
                    className="w-full py-3 rounded-2xl font-bold text-sm border border-white/10 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
