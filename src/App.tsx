import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Auth } from './components/Auth';
import { TopBar } from './components/TopBar';
import { MetricsRow } from './components/MetricsRow';
import { KanbanBoard } from './components/KanbanBoard';
import { OrderDetailModal } from './components/OrderDetailModal';
import { StaffManagementModal } from './components/StaffManagementModal';
import { StaffChatbot } from './components/StaffChatbot';
import { Order, Employee, OrderStatus, PaymentStatus } from './types';
import { MOCK_EMPLOYEES, Language } from './constants';
import { Info, ChevronUp } from 'lucide-react';
import { supabase } from './lib/supabase';

export default function App() {
  const [language, setLanguage] = useState<Language>('fr'); // Default to FR based on image
  const [activeFilter, setActiveFilter] = useState('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [staff, setStaff] = useState<Employee[]>(MOCK_EMPLOYEES);
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [requireStaffAssignment, setRequireStaffAssignment] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

  const filteredOrders = useMemo(() => {
    if (activeFilter === 'all') return orders;
    if (activeFilter === 'unassigned') return orders.filter(o => !o.assignedEmployeeId);
    return orders.filter(o => o.assignedEmployeeId === activeFilter);
  }, [orders, activeFilter]);

  const fetchOrders = React.useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching orders:', error);
    } else if (data) {
      // Map database fields to app types if necessary
      const formattedOrders = data.map(order => {
        const mappedItems = (order.order_items || []).map((item: any) => ({
          id: item.id || Math.random().toString(),
          quantity: item.quantity,
          product: {
            id: item.id || Math.random().toString(),
            name: item.item_name,
            price: Number(item.unit_price),
            category: 'Drink'
          },
          notes: item.alcohol_portion ? `Alcohol: ${item.alcohol_portion}` : undefined
        }));

        // Normalize status to match OrderStatus type
        let normalizedStatus = order.status;
        if (!normalizedStatus || normalizedStatus.toLowerCase() === 'new' || normalizedStatus.toLowerCase() === 'pending') {
          normalizedStatus = 'New';
        } else if (normalizedStatus.toLowerCase() === 'approved') {
          normalizedStatus = 'Approved';
        } else if (normalizedStatus.toLowerCase() === 'prep') {
          normalizedStatus = 'Prep';
        } else if (normalizedStatus.toLowerCase() === 'ready') {
          normalizedStatus = 'Ready';
        } else if (normalizedStatus.toLowerCase() === 'completed') {
          normalizedStatus = 'Completed';
        } else {
          normalizedStatus = 'New';
        }

        // Normalize payment status
        let normalizedPaymentStatus = order.payment_status || order.paymentStatus;
        if (!normalizedPaymentStatus || normalizedPaymentStatus.toLowerCase() === 'unpaid') {
          normalizedPaymentStatus = 'Unpaid';
        } else if (normalizedPaymentStatus.toLowerCase() === 'paid') {
          normalizedPaymentStatus = 'Paid';
        } else {
          normalizedPaymentStatus = 'Unpaid';
        }

        const calculatedSubtotal = mappedItems.reduce((sum: number, item: any) => sum + (item.product.price * item.quantity), 0);
        const calculatedTax = calculatedSubtotal * 0.14975; // Quebec tax rate
        const calculatedTotal = calculatedSubtotal + calculatedTax;

        return {
          ...order,
          id: String(order.id),
          orderNumber: order.order_number,
          customerName: order.customer_name || order.customerName,
          status: normalizedStatus,
          tableNumber: order.table_number || order.tableNumber || 'Takeout',
          paymentStatus: normalizedPaymentStatus,
          assignedEmployeeId: order.assigned_employee_id || order.assignedEmployeeId,
          createdAt: order.created_at || order.createdAt,
          updatedAt: order.updated_at || order.updatedAt,
          subtotal: Number(order.subtotal) || calculatedSubtotal,
          tax: Number(order.tax) || calculatedTax,
          tip: Number(order.tip) || 0,
          total: Number(order.total) || calculatedTotal,
          items: mappedItems.length > 0 ? mappedItems : (typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [])
        };
      }) as Order[];
      setOrders(formattedOrders);
      setSelectedOrder(prev => {
        if (!prev) return null;
        const updated = formattedOrders.find(o => o.id === prev.id);
        return updated || prev;
      });
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    // Subscribe to real-time changes
    const ordersSubscription = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    const orderItemsSubscription = supabase
      .channel('public:order_items')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSubscription);
      supabase.removeChannel(orderItemsSubscription);
    };
  }, [fetchOrders]);

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

  const handleExportReport = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-CA');
    const timeStr = now.toLocaleTimeString('fr-CA');
    
    // Calculate totals based on paid orders
    const totalSales = orders.reduce((sum, order) => sum + (order.paymentStatus === 'Paid' ? order.subtotal : 0), 0);
    const totalTaxes = orders.reduce((sum, order) => sum + (order.paymentStatus === 'Paid' ? order.tax : 0), 0);
    const totalTips = metrics.tips;
    const totalPaid = metrics.totalPaid;
    const totalUnpaid = metrics.totalUnpaid;

    // Create worksheet data
    const wsData = [
      ['Rapport de fermeture'],
      [`Date d'impression: ${dateStr} à ${timeStr}`],
      [],
      ['Résumé des ventes'],
      ['Total des ventes (sous-total)', totalSales.toFixed(2)],
      ['Total des taxes', totalTaxes.toFixed(2)],
      ['Total des pourboires', totalTips.toFixed(2)],
      ['Total payé (avec taxes et pourboires)', totalPaid.toFixed(2)],
      ['Total en attente (impayé)', totalUnpaid.toFixed(2)],
      [],
      ['Détail des commandes payées'],
      ['Numéro', 'Table', 'Sous-total', 'Taxes', 'Pourboire', 'Total', 'Assigné à']
    ];

    // Add paid orders details
    orders.filter(o => o.paymentStatus === 'Paid').forEach(order => {
      const employee = staff.find(s => s.id === order.assignedEmployeeId);
      wsData.push([
        order.orderNumber || order.id,
        order.tableNumber,
        order.subtotal.toFixed(2),
        order.tax.toFixed(2),
        order.tip.toFixed(2),
        order.total.toFixed(2),
        employee ? employee.name : 'Non assigné'
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rapport');

    // Generate Excel file
    XLSX.writeFile(wb, `Rapport_Fermeture_${dateStr.replace(/-/g, '')}_${timeStr.replace(/:/g, '')}.xlsx`);
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (String(o.id) === String(orderId) ? { ...o, status, updatedAt: new Date().toISOString() } : o))
    );
    if (selectedOrder && String(selectedOrder.id) === String(orderId)) {
      setSelectedOrder((prev) => (prev ? { ...prev, status } : null));
    }

    // Push to Supabase
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
      
    if (error) {
      console.error('Error updating order status:', error);
      // Ideally, revert optimistic update here if needed
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, paymentStatus: PaymentStatus) => {
    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (String(o.id) === String(orderId) ? { ...o, paymentStatus, updatedAt: new Date().toISOString() } : o))
    );
    if (selectedOrder && String(selectedOrder.id) === String(orderId)) {
      setSelectedOrder((prev) => (prev ? { ...prev, paymentStatus } : null));
    }

    // Push to Supabase
    const { error } = await supabase
      .from('orders')
      .update({ payment_status: paymentStatus })
      .eq('id', orderId);
      
    if (error) {
      console.error('Error updating payment status:', error);
    }
  };

  const handleAssignStaff = async (orderId: string, employeeId: string) => {
    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (String(o.id) === String(orderId) ? { ...o, assignedEmployeeId: employeeId, updatedAt: new Date().toISOString() } : o))
    );
    if (selectedOrder && String(selectedOrder.id) === String(orderId)) {
      setSelectedOrder((prev) => (prev ? { ...prev, assignedEmployeeId: employeeId } : null));
    }

    // Push to Supabase
    const { error } = await supabase
      .from('orders')
      .update({ assigned_employee_id: employeeId })
      .eq('id', orderId);
      
    if (error) {
      console.error('Error assigning staff:', error);
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
          staff={staff}
          onOpenStaffModal={() => setIsStaffModalOpen(true)}
        />

        <MetricsRow
          language={language}
          metrics={metrics}
          onRefresh={() => console.log('Refresh')}
          onOpenReports={handleExportReport}
        />

        <main className="flex-1 flex overflow-hidden">
          <KanbanBoard
            orders={filteredOrders}
            language={language}
            onOrderClick={(order) => {
              setSelectedOrder(order);
              setRequireStaffAssignment(false);
            }}
            onRequireStaffAssignment={(order) => {
              setSelectedOrder(order);
              setRequireStaffAssignment(true);
            }}
            staff={staff}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        </main>

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
            onClose={() => {
              setSelectedOrder(null);
              setRequireStaffAssignment(false);
            }}
            staff={staff}
            onUpdateStatus={handleUpdateOrderStatus}
            onUpdatePayment={handleUpdatePaymentStatus}
            onAssignStaff={handleAssignStaff}
            requireStaffAssignment={requireStaffAssignment}
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
