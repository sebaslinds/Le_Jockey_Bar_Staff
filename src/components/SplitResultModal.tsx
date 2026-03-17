import React from 'react';
import { Order, Employee } from '../types';
import { Language, TRANSLATIONS } from '../constants';
import { X } from 'lucide-react';
import { OrderCard } from './OrderCard';

interface SplitResultModalProps {
  orders: Order[];
  staff: Employee[];
  language: Language;
  onClose: () => void;
  onOrderClick: (order: Order) => void;
}

export function SplitResultModal({ orders, staff, language, onClose, onOrderClick }: SplitResultModalProps) {
  const t = TRANSLATIONS[language];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-brand-border bg-brand-bg/50">
          <h2 className="text-2xl font-serif text-brand-text">
            {language === 'fr' ? 'Factures séparées avec succès' : 'Bills Split Successfully'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-brand-border transition-colors text-neutral-400 hover:text-brand-text">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {orders.map(order => (
              <div key={order.id} className="flex flex-col h-full">
                <OrderCard
                  order={order}
                  language={language}
                  assignedEmployee={staff.find(e => e.id === order.assignedEmployeeId)}
                  onClick={() => {
                    onOrderClick(order);
                    onClose();
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
