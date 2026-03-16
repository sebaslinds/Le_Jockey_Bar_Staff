import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { Globe, Menu } from 'lucide-react';
import { Language, TRANSLATIONS } from '../constants';
import { Employee } from '../types';
import { clsx } from 'clsx';

interface TopBarProps {
  language: Language;
  onLanguageToggle: () => void;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  staff: Employee[];
  onOpenStaffModal: () => void;
}

export function TopBar({ language, onLanguageToggle, activeFilter, setActiveFilter, staff, onOpenStaffModal }: TopBarProps) {
  const t = TRANSLATIONS[language];
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateLocale = language === 'fr' ? fr : enUS;

  const filters = [
    { id: 'all', label: t.all },
    { id: 'unassigned', label: t.unassigned },
    ...staff.map(s => ({ id: s.id, label: s.name.toUpperCase() })),
  ];

  return (
    <header className="h-20 bg-brand-bg border-b border-brand-border flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-6">
        <button className="p-2 hover:bg-brand-surface rounded-lg transition-colors">
          <Menu className="w-6 h-6 text-brand-text" />
        </button>
        
        <div className="flex items-center gap-2 h-12">
          {/* Replace this src with your actual logo filename once uploaded (e.g., /logo.png or /logo.svg) */}
          <img 
            src="/logo.png" 
            alt="Le Jockey Bières & Cocktails" 
            className="h-full w-auto object-contain"
            referrerPolicy="no-referrer"
            onError={(e) => {
              // Fallback styling if image is not yet uploaded
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              if (target.nextElementSibling) {
                target.nextElementSibling.classList.remove('hidden');
              }
            }}
          />
          {/* Fallback text logo while waiting for upload */}
          <div className="hidden flex items-center gap-2">
            <div className="flex items-center font-serif text-2xl tracking-widest border border-brand-text px-2 py-1">
              <span className="font-bold">LE</span>
              <span className="text-3xl font-bold mx-1">J</span>
              <span className="font-bold">OCKEY</span>
            </div>
            <div className="flex flex-col justify-center text-[8px] tracking-widest uppercase ml-1">
              <span>Bières &</span>
              <span>Cocktails</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={clsx(
              "px-4 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors border rounded-md",
              activeFilter === filter.id
                ? "bg-brand-accent text-brand-bg border-brand-accent"
                : "bg-transparent text-neutral-400 border-brand-border hover:border-neutral-500"
            )}
          >
            {filter.label}
          </button>
        ))}
        <button
          onClick={onOpenStaffModal}
          className="px-4 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors border rounded-md bg-transparent text-neutral-400 border-brand-border hover:border-neutral-500"
        >
          {t.team}
        </button>
      </div>

      <div className="flex items-center gap-6">
        <button
          onClick={onLanguageToggle}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-border hover:bg-brand-surface transition-colors text-xs font-medium text-neutral-400"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="uppercase">{language === 'fr' ? 'en' : 'fr'}</span>
        </button>

        <div className="text-right flex flex-col items-end">
          <span className="font-serif text-2xl font-bold text-brand-accent tracking-wider">
            {format(currentTime, 'HH')} <span className="text-brand-accent/50">h</span> {format(currentTime, 'mm')}
          </span>
          <span className="text-[10px] text-neutral-500 uppercase tracking-widest">
            {format(currentTime, 'EEE. d MMM', { locale: dateLocale })}
          </span>
        </div>
      </div>
    </header>
  );
}
