import React from 'react';
import { Order, Employee } from '../types';
import { Language, TRANSLATIONS } from '../constants';
import { clsx } from 'clsx';
import { Clock, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface OrderCardProps {
  order: Order;
  language: Language;
  onClick: () => void;
  assignedEmployee?: Employee;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, language, onClick, assignedEmployee, draggable, onDragStart }) => {
  const t = TRANSLATIONS[language];
  const isPaid = order.paymentStatus === 'Paid';

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
      className="bg-brand-surface border border-brand-border rounded-sm p-4 cursor-grab active:cursor-grabbing hover:border-brand-accent/50 transition-colors shadow-sm group"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-xs font-mono text-neutral-500 block mb-1">{order.id}</span>
          <h3 className="font-serif text-lg text-brand-text">{t.table} {order.tableNumber}</h3>
        </div>
        <div className={clsx(
          "px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider border",
          isPaid 
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
        )}>
          {isPaid ? t.paid : t.unpaid}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-neutral-400 mb-4">
        <Clock className="w-3.5 h-3.5" />
        <span>{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}</span>
      </div>

      <div className="flex items-center justify-between border-t border-brand-border/50 pt-3 mt-2">
        <div className="flex items-center gap-2">
          {assignedEmployee ? (
            <img 
              src={assignedEmployee.avatarUrl} 
              alt={assignedEmployee.name}
              className="w-6 h-6 rounded-full border border-brand-border"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-brand-bg border border-brand-border flex items-center justify-center">
              <User className="w-3 h-3 text-neutral-500" />
            </div>
          )}
          <span className="text-xs text-neutral-300">
            {order.items.reduce((acc, item) => acc + item.quantity, 0)} {t.items}
          </span>
        </div>
        <span className="font-mono text-brand-accent font-medium">
          ${order.total.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
