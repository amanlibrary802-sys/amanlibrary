'use client';

import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface CategoryTileProps {
  name: string;
  icon: LucideIcon;
  count: number;
  color: string;
  loading?: boolean;
  onClick?: (name: string) => void;
}

export default function CategoryTile({ name, icon: Icon, count, color, loading, onClick }: CategoryTileProps) {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      onClick={() => onClick?.(name)}
      className="relative group cursor-pointer overflow-hidden rounded-2xl bg-slate-900 border border-white/5 shadow-sm hover:shadow-xl hover:border-white/10 hover:bg-slate-800 transition-all p-4 sm:p-6 flex flex-col items-center gap-3 sm:gap-4"
    >
      <div className={`p-3 sm:p-4 rounded-xl ${color} text-white group-hover:scale-110 transition-transform flex items-center justify-center`}>
        <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
      </div>

      <div className="text-center w-full">
        <h3 className="font-amiri text-[15px] sm:text-xl leading-tight sm:leading-normal font-bold text-slate-200 group-hover:text-blue-400 transition-colors break-words">
          {name}
        </h3>
        <span className="inline-block mt-1.5 sm:mt-2 bg-slate-800 text-slate-400 text-[9px] sm:text-xs font-bold px-2 py-0.5 sm:py-1 rounded-full group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors">
          {loading ? '...' : `${count} Books`}
        </span>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
    </motion.div>
  );
}
