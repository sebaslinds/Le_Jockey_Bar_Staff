import React from 'react';
import { Order, OrderStatus, Employee } from '../types';
import { ORDER_STATUSES, STATUS_COLORS, Language, TRANSLATIONS } from '../constants';
import { OrderCard } from './OrderCard';
import { clsx } from 'clsx';

interface KanbanBoardProps {
  orders: Order[];
  language: Language;
  onOrderClick: (order: Order) => void;
  onRequireStaffAssignment: (order: Order) => void;
  staff: Employee[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

export function KanbanBoard({ orders, language, onOrderClick, onRequireStaffAssignment, staff, onUpdateOrderStatus }: KanbanBoardProps) {
  const t = TRANSLATIONS[language];

  const getOrdersByStatus = (status: OrderStatus) => {
    return orders.filter((o) => o.status === status);
  };

  return (
    <div className="flex-1 grid grid-cols-5 p-6 gap-4 overflow-hidden">
      {ORDER_STATUSES.map((status) => {
        const columnOrders = getOrdersByStatus(status);
        const statusKey = status.toLowerCase() as keyof typeof t;
        const colorConfig = STATUS_COLORS[status];

        return (
          <div 
            key={status} 
            className="flex flex-col h-full min-h-0"
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => {
              e.preventDefault();
              const orderId = e.dataTransfer.getData('text/plain');
              if (orderId) {
                const order = orders.find(o => String(o.id) === orderId);
                if (status === 'Ready' && order && !order.assignedEmployeeId) {
                  onRequireStaffAssignment(order);
                  return;
                }
                onUpdateOrderStatus(orderId, status);
              }
            }}
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-brand-border bg-brand-surface border border-brand-border border-b-0 rounded-t-sm shrink-0">
              <div className="flex items-center gap-2">
                <div className={clsx("w-2 h-2 rounded-full", colorConfig.dot)} />
                <h2 className={clsx("font-sans font-bold tracking-wider uppercase text-sm", colorConfig.text)}>
                  {t[statusKey] || status}
                </h2>
              </div>
              <span className="bg-brand-bg border border-brand-border w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono text-neutral-400">
                {columnOrders.length}
              </span>
            </div>
            
            <div className="flex-1 bg-brand-bg border border-brand-border border-t-0 rounded-b-sm p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4">
              {columnOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  language={language}
                  onClick={() => onOrderClick(order)}
                  assignedEmployee={staff.find(s => s.id === order.assignedEmployeeId)}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', String(order.id));
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                />
              ))}
              {columnOrders.length === 0 && (
                <div className="h-40 border border-dashed border-brand-border/50 rounded-sm flex items-center justify-center">
                  <span className="text-neutral-600 text-xs tracking-widest font-medium uppercase">
                    {t.empty}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
