'use client';

import { motion } from 'framer-motion';
import { Book as BookIcon, User, MapPin, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import Image from 'next/image';

export interface Book {
  book_id?: string;
  id?: string;
  title: string;
  author: string;
  category?: string;
  status?: 'Available' | 'Ordered' | 'Issued' | string;
  shelf_loc?: string;
  coverUrl?: string;
}

interface BookCardProps {
  book: Book;
  onOrder?: (id: string) => void;
  onClick?: (book: Book) => void;
  loading?: boolean;
  variant?: 'card' | 'list' | 'grid';
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

export default function BookCard({ book, onOrder, onClick, loading, variant = 'card' }: BookCardProps) {
  const status = book.status || 'Available';
  
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Ordered':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Issued':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Available': return <CheckCircle2 className="w-3 h-3" />;
      case 'Ordered': return <Clock className="w-3 h-3" />;
      case 'Issued': return <AlertCircle className="w-3 h-3" />;
      default: return null;
    }
  };

  const getFormattedLoc = (loc?: string, category?: string) => {
    if (!loc) return 'TBA';
    if (/^[A-Za-z]/.test(loc)) return loc.toUpperCase();
    const prefix = category ? (CATEGORY_PREFIX[category] ?? category.charAt(0).toUpperCase()) : '';
    return `${prefix}${loc}`;
  };

  const handleOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOrder) onOrder(book.book_id ?? book.id ?? '');
  };

  // ── LIST VARIANT ──
  if (variant === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => onClick?.(book)}
        className={`bg-white rounded-2xl p-4 sm:px-5 sm:py-4 border border-secondary/10 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 group ${onClick ? 'cursor-pointer' : ''}`}
      >
        <div className="flex items-start sm:items-center gap-3 sm:gap-5 w-full sm:w-auto flex-1 min-w-0">
          {/* Book icon / Cover */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-secondary transition-colors shrink-0">
            <BookIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>

          {/* Title & Author */}
          <div className="flex-1 min-w-0">
            <h3 className="font-amiri text-[15px] sm:text-base font-bold text-primary leading-tight group-hover:text-secondary transition-colors truncate" title={book.title}>
              {book.title}
            </h3>
            <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 text-primary/60 text-[11px] sm:text-xs mt-1 sm:mt-1.5">
              <span className="flex items-center gap-1">
                <User className="w-3 sm:w-3.5 h-3 sm:h-3.5 shrink-0" />
                <span className="font-medium truncate max-w-[120px] sm:max-w-none">{book.author}</span>
              </span>
              <span className="w-1 h-1 rounded-full bg-primary/20 shrink-0"></span>
              <span className="flex items-center gap-1 font-medium text-primary/70">
                <MapPin className="w-3 h-3 shrink-0" />
                <span>Loc: {getFormattedLoc(book.shelf_loc, book.category)}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t border-secondary/5 sm:border-0 pt-3 sm:pt-0 shrink-0">
          {/* Status badge */}
          <div className={`flex sm:flex text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border items-center gap-1 sm:gap-1.5 shrink-0 ${getStatusStyles(status)}`}>
            {getStatusIcon(status)}
            {status}
          </div>

          {/* Action button: Opens Modal for Confirmation */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onClick) onClick(book);
            }}
            className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold text-[10px] sm:text-xs transition-all shrink-0 whitespace-nowrap shadow-sm flex-1 sm:flex-none text-center
              ${status === 'Available'
                ? 'bg-primary text-secondary hover:bg-secondary hover:text-primary active:scale-95 hover:shadow-md'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              }`}
          >
            {status === 'Available' ? 'ORDER BOOK' : 'UNAVAILABLE'}
          </button>
        </div>
      </motion.div>
    );
  }

  // ── CARD / GRID VARIANT ──
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={() => onClick?.(book)}
      className={`bg-white rounded-2xl p-5 border border-secondary/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col gap-4 relative group ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex justify-between items-start">
        <div className="p-3 rounded-xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-secondary transition-colors">
          <BookIcon className="w-6 h-6" />
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border flex items-center gap-1 ${getStatusStyles(status)}`}>
          {getStatusIcon(status)}
          {status}
        </span>
      </div>

      <div className="space-y-1">
        <h3 className="font-amiri text-[15px] font-bold text-primary leading-tight group-hover:text-secondary transition-colors" title={book.title}>
          {book.title}
        </h3>
        <div className="flex items-center gap-2 text-primary/60 text-xs">
          <User className="w-3 h-3" />
          <span className="font-medium truncate" title={book.author}>{book.author}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-auto">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[10px] font-bold text-primary/50 uppercase tracking-widest bg-cream/80 px-2 py-1.5 rounded-lg border border-secondary/5">
            <MapPin className="w-3 h-3" />
            Loc: {getFormattedLoc(book.shelf_loc, book.category)}
          </div>
          {book.category && (
            <span className="text-[10px] font-bold text-primary/40 uppercase tracking-widest truncate max-w-[80px]">
              {book.category}
            </span>
          )}
        </div>

        {onOrder && (
          <button
            type="button"
            disabled={status !== 'Available' || loading}
            onClick={(e) => {
              e.stopPropagation();
              if (onClick) onClick(book);
            }}
            className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm
              ${status === 'Available' 
                ? 'bg-primary text-secondary hover:bg-secondary hover:text-primary active:scale-95 hover:shadow-md' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              }`}
          >
            {status === 'Available' ? 'ORDER BOOK' : 'UNAVAILABLE'}
          </button>
        )}
      </div>
    </motion.div>
  );
}
