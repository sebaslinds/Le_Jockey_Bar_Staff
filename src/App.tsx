import React, { useState, useMemo } from 'react';
import { Auth } from './components/Auth';
import { TopBar } from './components/TopBar';
import { MetricsRow } from './components/MetricsRow';
import { KanbanBoard } from './components/KanbanBoard';
import { OrderDetailModal } from './components/OrderDetailModal';
import { StaffManagementModal } from './components/StaffManagementModal';
import { StaffChatbot } from './components/StaffChatbot';
import { Order, Employee, OrderStatus, PaymentStatus } from './types';
import { MOCK_ORDERS, MOCK_EMPLOYEES, Language } from './constants';
import { Info, ChevronUp } from 'lucide-react';

export default function App() {
  const [language, setLanguage] = useState<Language>('fr'); // Default to FR based on image
  const [activeFilter, setActiveFilter] = useState('all');
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [staff, setStaff] = useState<Employee[]>(MOCK_EMPLOYEES);
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

  const metrics = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        if (order.paymentStatus === 'Paid') {
          acc.totalPaid += order.total;
          acc.tips += order.tip;
        } else {
          acc.totalUnpaid += order.total;
        }
        return acc;
      },
      { totalPaid: 0, totalUnpaid: 0, tips: 0 }
    );
  }, [orders]);

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o))
    );
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status } : null));
    }
  };

  const handleUpdatePaymentStatus = (orderId: string, paymentStatus: PaymentStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, paymentStatus, updatedAt: new Date().toISOString() } : o))
    );
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, paymentStatus } : null));
    }
  };

  const handleAssignStaff = (orderId: string, employeeId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, assignedEmployeeId: employeeId, updatedAt: new Date().toISOString() } : o))
    );
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, assignedEmployeeId: employeeId } : null));
    }
  };

  const handleAddStaff = (employee: Omit<Employee, 'id'>) => {
    const newEmployee = { ...employee, id: `e${Date.now()}` };
    setStaff((prev) => [...prev, newEmployee]);
  };

  const handleUpdateStaff = (employee: Employee) => {
    setStaff((prev) => prev.map((e) => (e.id === employee.id ? employee : e)));
  };

  const handleRemoveStaff = (id: string) => {
    setStaff((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <Auth>
      <div className="h-screen w-full flex flex-col bg-brand-bg text-brand-text overflow-hidden">
        <TopBar
          language={language}
          onLanguageToggle={() => setLanguage((l) => (l === 'en' ? 'fr' : 'en'))}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
        />

        <MetricsRow
          language={language}
          metrics={metrics}
          onRefresh={() => console.log('Refresh')}
          onOpenReports={() => alert('Reports module coming soon')}
        />

        <main className="flex-1 flex overflow-hidden">
          <KanbanBoard
            orders={orders}
            language={language}
            onOrderClick={setSelectedOrder}
            staff={staff}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        </main>

        {/* Bottom Bar */}
        <div className="h-6 bg-brand-surface border-t border-brand-border flex items-center justify-end px-4 text-xs text-brand-accent gap-2 shrink-0">
          <Info className="w-3 h-3" />
          <span>3</span>
          <ChevronUp className="w-3 h-3" />
        </div>

        <StaffChatbot
          orders={orders}
          staff={staff}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          language={language}
        />

        {selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            language={language}
            onClose={() => setSelectedOrder(null)}
            staff={staff}
            onUpdateStatus={handleUpdateOrderStatus}
            onUpdatePayment={handleUpdatePaymentStatus}
            onAssignStaff={handleAssignStaff}
          />
        )}

        {isStaffModalOpen && (
          <StaffManagementModal
            staff={staff}
            language={language}
            onClose={() => setIsStaffModalOpen(false)}
            onAddStaff={handleAddStaff}
            onUpdateStaff={handleUpdateStaff}
            onRemoveStaff={handleRemoveStaff}
          />
        )}
      </div>
    </Auth>
  );
}
