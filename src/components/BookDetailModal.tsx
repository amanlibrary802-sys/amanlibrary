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
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  Ordered: {
    label: 'Ordered / Reserved',
    icon: <Clock className="w-4 h-4" />,
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  Issued: {
    label: 'Currently Issued',
    icon: <AlertCircle className="w-4 h-4" />,
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
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
    <div className="flex items-start gap-3 py-3 border-b border-secondary/8 last:border-0">
      <span className="mt-0.5 p-2 rounded-lg bg-primary/5 text-primary shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary/40 mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-primary break-words">{value}</p>
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
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col cursor-default"
            >
              {/* Header */}
              <div className="bg-primary px-6 pt-8 pb-10 relative overflow-hidden">
                {/* Decorative ring */}
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-secondary/10 pointer-events-none" />
                <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />

                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-4 relative z-10">
                  <div className="p-4 rounded-2xl bg-secondary/20 text-secondary shrink-0">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-amiri font-bold text-white leading-tight line-clamp-2">
                      {book.title}
                    </h2>
                    <p className="text-cream/70 text-sm font-medium mt-1 truncate">{book.author}</p>
                  </div>
                </div>

                {/* Status pill */}
                <div className={`inline-flex items-center gap-2 mt-5 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider relative z-10 ${st.bg} ${st.text} ${st.border}`}>
                  {st.icon}
                  {st.label}
                </div>
              </div>

              {/* Scallop divider */}
              <div className="relative h-5 bg-primary">
                <div className="absolute inset-x-0 bottom-0 h-5 bg-white rounded-t-[2rem]" />
              </div>

              {/* Body */}
              <div className="px-6 pb-6 flex-1 overflow-y-auto">
                <div className="divide-y divide-secondary/8">
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
                        <span className="font-mono text-xs bg-cream px-2 py-0.5 rounded-lg">
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
                          ? 'bg-primary text-secondary hover:bg-secondary hover:text-primary active:scale-95 hover:shadow-lg'
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
                      className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 active:scale-95 border border-red-200"
                    >
                      <X className="w-4 h-4" />
                      {ordering ? 'Processing...' : 'Cancel Order'}
                    </button>
                  ) : !isAvailable ? (
                    <button
                      disabled
                      className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                    >
                      <BookMarked className="w-4 h-4" />
                      Book Unavailable
                    </button>
                  ) : null}

                  <button
                    onClick={onClose}
                    className="w-full py-3 rounded-2xl font-bold text-sm border border-secondary/20 text-primary/60 hover:bg-cream hover:text-primary transition-all"
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
