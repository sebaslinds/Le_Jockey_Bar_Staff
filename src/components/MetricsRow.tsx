import React from 'react';
import { RefreshCw, FileText, DollarSign, CreditCard } from 'lucide-react';
import { Language, TRANSLATIONS } from '../constants';

interface MetricsRowProps {
  language: Language;
  metrics: {
    totalPaid: number;
    totalUnpaid: number;
    tips: number;
  };
  onRefresh: () => void;
  onOpenReports: () => void;
}

export function MetricsRow({ language, metrics, onRefresh, onOpenReports }: MetricsRowProps) {
  const t = TRANSLATIONS[language];

  return (
    <div className="flex gap-6 p-6 pb-0 shrink-0">
      {/* Collected Revenue */}
      <div className="flex-1 bg-brand-surface border border-brand-border border-l-4 border-l-emerald-500 p-6 flex items-center justify-between">
        <div>
          <h3 className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest mb-2">
            {t.totalPaid}
          </h3>
          <div className="flex items-baseline gap-1">
            <span className="text-emerald-500 font-serif text-3xl font-bold">$</span>
            <span className="font-serif text-4xl font-bold text-brand-text">
              {metrics.totalPaid.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-full border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-emerald-500" />
        </div>
      </div>

      {/* Pending */}
      <div className="flex-1 bg-brand-surface border border-brand-border border-l-4 border-l-red-500 p-6 flex items-center justify-between">
        <div>
          <h3 className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest mb-2">
            {t.totalUnpaid}
          </h3>
          <div className="flex items-baseline gap-1">
            <span className="text-red-500 font-serif text-3xl font-bold">$</span>
            <span className="font-serif text-4xl font-bold text-brand-text">
              {metrics.totalUnpaid.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-full border border-red-500/20 bg-red-500/5 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-red-500" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 w-48">
        <button
          onClick={onRefresh}
          className="flex-1 flex items-center justify-center gap-3 bg-brand-surface border border-brand-border hover:bg-brand-surface-hover transition-colors text-xs font-medium tracking-widest uppercase text-neutral-300 rounded-md"
        >
          <RefreshCw className="w-4 h-4" />
          {t.refresh}
        </button>
        <button
          onClick={onOpenReports}
          className="flex-1 flex items-center justify-center gap-3 bg-brand-surface border border-brand-border hover:bg-brand-surface-hover transition-colors text-xs font-medium tracking-widest uppercase text-neutral-300 rounded-md"
        >
          <FileText className="w-4 h-4" />
          {t.reports}
        </button>
      </div>
    </div>
  );
}
