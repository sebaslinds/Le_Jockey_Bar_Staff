import React, { useState } from 'react';
import { Order, OrderStatus, PaymentStatus, Employee } from '../types';
import { Language, TRANSLATIONS, ORDER_STATUSES } from '../constants';
import { X, UserPlus, CheckCircle, CreditCard, SplitSquareHorizontal } from 'lucide-react';
import { clsx } from 'clsx';
import { SplitBillModal, SplitData } from './SplitBillModal';

interface OrderDetailModalProps {
  order: Order | null;
  language: Language;
  onClose: () => void;
  staff: Employee[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onUpdatePayment: (orderId: string, status: PaymentStatus) => void;
  onAssignStaff: (orderId: string, employeeId: string) => void;
  onSplitOrder?: (orderId: string, splitData: SplitData) => void;
  requireStaffAssignment?: boolean;
}

export function OrderDetailModal({
  order,
  language,
  onClose,
  staff,
  onUpdateStatus,
  onUpdatePayment,
  onAssignStaff,
  onSplitOrder,
  requireStaffAssignment = false,
}: OrderDetailModalProps) {
  const [localRequireStaff, setLocalRequireStaff] = useState(requireStaffAssignment);
  const [isSplitting, setIsSplitting] = useState(false);

  React.useEffect(() => {
    setLocalRequireStaff(requireStaffAssignment);
  }, [requireStaffAssignment]);

  if (!order) return null;
  const t = TRANSLATIONS[language];

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <div 
          className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-brand-border bg-brand-bg/50">
            <div>
              <span className="text-brand-accent font-mono text-sm tracking-widest uppercase mb-1 block">
                {order.orderNumber ? `#${order.orderNumber}` : order.id}
              </span>
              <h2 className="text-3xl font-serif text-brand-text">
                {order.tableNumber.toLowerCase() === 'takeout' ? t.takeout : `${t.table} ${order.tableNumber}`}
                {order.customerName && <span className="text-neutral-400 ml-2 text-xl">({order.customerName})</span>}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {onSplitOrder && (
                <button
                  onClick={() => setIsSplitting(true)}
                  className="p-2 rounded-full hover:bg-brand-border transition-colors text-neutral-400 hover:text-brand-accent flex items-center gap-2"
                  title={language === 'fr' ? 'Séparer la facture' : 'Split Bill'}
                >
                  <SplitSquareHorizontal className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-brand-border transition-colors text-neutral-400 hover:text-brand-text"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col md:flex-row gap-8">
          
          {/* Left Col: Receipt */}
          <div className="flex-1 flex flex-col">
            <h3 className="text-lg font-serif text-brand-accent border-b border-brand-border pb-2 mb-4">
              {t.orderDetail}
            </h3>
            
            <div className="flex-1 space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-start">
                  <div>
                    <span className="text-brand-text font-medium">{item.product.name}</span>
                    <span className="text-neutral-500 text-sm ml-2">x{item.quantity}</span>
                    {item.notes && (
                      <p className="text-xs text-amber-500/80 italic mt-1">{item.notes}</p>
                    )}
                  </div>
                  <span className="font-mono text-neutral-300">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-brand-border mt-6 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-neutral-400">
                <span>{t.subtotal}</span>
                <span className="font-mono">${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-neutral-400">
                <span>{t.tax}</span>
                <span className="font-mono">${order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-serif text-brand-accent mt-4 pt-4 border-t border-brand-border/50">
                <span>{t.total}</span>
                <span className="font-mono">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Right Col: Actions */}
          <div className="w-full md:w-64 flex flex-col gap-6 border-t md:border-t-0 md:border-l border-brand-border pt-6 md:pt-0 md:pl-8">
            
            {/* Payment Status */}
            <div>
              <h4 className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <CreditCard className="w-3 h-3" /> {t.updatePayment}
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={() => onUpdatePayment(order.id, 'Paid')}
                  className={clsx(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-colors border",
                    order.paymentStatus === 'Paid'
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                      : "bg-brand-bg text-neutral-400 border-brand-border hover:border-emerald-500/30"
                  )}
                >
                  {t.paid}
                </button>
                <button
                  onClick={() => onUpdatePayment(order.id, 'Unpaid')}
                  className={clsx(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-colors border",
                    order.paymentStatus === 'Unpaid'
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/50"
                      : "bg-brand-bg text-neutral-400 border-brand-border hover:border-amber-500/30"
                  )}
                >
                  {t.unpaid}
                </button>
              </div>
            </div>

            {/* Order Status */}
            <div>
              <h4 className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <CheckCircle className="w-3 h-3" /> {t.updateStatus}
              </h4>
              <div className="flex flex-col gap-2">
                {ORDER_STATUSES.map((status) => {
                  const statusKey = status.toLowerCase() as keyof typeof t;
                  return (
                    <button
                      key={status}
                      onClick={() => {
                        if (status === 'Ready' && !order.assignedEmployeeId) {
                          setLocalRequireStaff(true);
                          return;
                        }
                        onUpdateStatus(order.id, status);
                      }}
                      className={clsx(
                        "w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
                        order.status === status
                          ? "bg-brand-accent/20 text-brand-accent border-brand-accent/50"
                          : "bg-brand-bg text-neutral-400 border-brand-border hover:border-brand-accent/30"
                      )}
                    >
                      {t[statusKey] || status}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Assign Staff */}
            <div className={clsx("transition-all duration-300", localRequireStaff && !order.assignedEmployeeId ? "ring-2 ring-amber-500/50 p-3 rounded-xl bg-amber-500/5 -mx-3" : "")}>
              <h4 className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <UserPlus className="w-3 h-3" /> {t.assignStaff}
              </h4>
              <div className="flex flex-col gap-2">
                {staff.map((employee) => (
                  <button
                    key={employee.id}
                    onClick={() => {
                      onAssignStaff(order.id, employee.id);
                      if (localRequireStaff) {
                        onUpdateStatus(order.id, 'Ready');
                      }
                      setLocalRequireStaff(false);
                    }}
                    className={clsx(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors border",
                      order.assignedEmployeeId === employee.id
                        ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/50"
                        : "bg-brand-bg text-neutral-400 border-brand-border hover:border-indigo-500/30"
                    )}
                  >
                    <img src={employee.avatarUrl} alt={employee.name} className="w-6 h-6 rounded-full" />
                    <span>{employee.name}</span>
                  </button>
                ))}
              </div>
              {localRequireStaff && !order.assignedEmployeeId && (
                <p className="text-xs text-amber-500 mt-3 animate-pulse">
                  {t.assignStaffFirst}
                </p>
              )}
            </div>

          </div>
        </div>
      </div>
      </div>

      {isSplitting && onSplitOrder && (
        <SplitBillModal
          order={order}
          language={language}
          onClose={() => setIsSplitting(false)}
          onConfirmSplit={(data) => {
            onSplitOrder(order.id, data);
            setIsSplitting(false);
          }}
        />
      )}
    </>
  );
}
