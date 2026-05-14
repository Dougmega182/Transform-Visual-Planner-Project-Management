'use client';
import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface WeekStripProps {
  currentWeekStart: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatShort(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatDayLabel(d: Date): { day: string; date: string; isToday: boolean; isWeekend: boolean } {
  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  const dow = d.getDay();
  const isWeekend = dow === 0 || dow === 6;
  return {
    day: d.toLocaleDateString('en-GB', { weekday: 'short' }),
    date: d.getDate().toString(),
    isToday,
    isWeekend,
  };
}

export const WeekStrip: React.FC<WeekStripProps> = ({ currentWeekStart, onPrev, onNext, onToday }) => {
  const days = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  const weekEnd = addDays(currentWeekStart, 6);

  return (
    <div className="bg-gray-900/80 border-b border-gray-800 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onPrev}
            className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={onNext}
            className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronRight size={16} />
          </button>
          <span className="text-xs text-gray-300 font-medium ml-1">
            {formatShort(currentWeekStart)} — {formatShort(weekEnd)}
          </span>
        </div>
        <button
          onClick={onToday}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <Calendar size={11} />
          Today
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mt-2">
        {days.map((d, i) => {
          const label = formatDayLabel(d);
          return (
            <div
              key={i}
              className={`flex flex-col items-center py-1 rounded-md text-center transition-colors ${
                label.isToday
                  ? 'bg-blue-500/15 ring-1 ring-blue-500/30'
                  : label.isWeekend
                  ? 'bg-gray-800/40'
                  : ''
              }`}
            >
              <span
                className={`text-[9px] uppercase tracking-wider ${
                  label.isToday ? 'text-blue-400' : label.isWeekend ? 'text-gray-600' : 'text-gray-500'
                }`}
              >
                {label.day}
              </span>
              <span
                className={`text-xs font-semibold ${
                  label.isToday ? 'text-blue-300' : label.isWeekend ? 'text-gray-600' : 'text-gray-300'
                }`}
              >
                {label.date}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
