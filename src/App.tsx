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
import { MOCK_EMPLOYEES, Language, TRANSLATIONS } from './constants';
import { Info, ChevronUp, AlertCircle, X } from 'lucide-react';
import { supabase } from './lib/supabase';

const mapDbOrderToAppOrder = (order: any): Order => {
  const mappedItems = (order.order_items || []).map((item: any) => ({
    id: item.id || Math.random().toString(),
    quantity: item.quantity,
    product: {
      id: item.id || Math.random().toString(),
      name: item.item_name,
      price: Number(item.unit_price),
      category: 'Drink'
    },
    alcoholChoice: item.alcohol_choice || undefined,
    alcoholPortion: item.alcohol_portion || undefined,
    notes: [
      item.alcohol_choice ? `Alcool: ${item.alcohol_choice}` : null,
      item.alcohol_portion ? `Portion: ${item.alcohol_portion}` : null,
      item.flavor_profile ? `Profil: ${item.flavor_profile}` : null
    ].filter(Boolean).join(' | ') || undefined
  }));

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

  let normalizedPaymentStatus = order.payment_status || order.paymentStatus;
  if (!normalizedPaymentStatus || normalizedPaymentStatus.toLowerCase() === 'unpaid') {
    normalizedPaymentStatus = 'Unpaid';
  } else if (normalizedPaymentStatus.toLowerCase() === 'paid') {
    normalizedPaymentStatus = 'Paid';
  } else {
    normalizedPaymentStatus = 'Unpaid';
  }

  const calculatedTotal = mappedItems.reduce((sum: number, item: any) => sum + (item.product.price * item.quantity), 0);
  const calculatedSubtotal = calculatedTotal / 1.14975;
  const calculatedTax = calculatedTotal - calculatedSubtotal;

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
    total: Number(order.total) || (calculatedTotal + (Number(order.tip) || 0)),
    items: mappedItems.length > 0 ? mappedItems : (typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [])
  };
};

export default function App() {
  const [language, setLanguage] = useState<Language>('fr'); // Default to FR based on image
  const [activeFilter, setActiveFilter] = useState('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [staff, setStaff] = useState<Employee[]>([]);
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [requireStaffAssignment, setRequireStaffAssignment] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const t = TRANSLATIONS[language];

  const filteredOrders = useMemo(() => {
    if (activeFilter === 'all') return orders;
    if (activeFilter === 'unassigned') return orders.filter(o => !o.assignedEmployeeId);
    return orders.filter(o => String(o.assignedEmployeeId) === String(activeFilter));
  }, [orders, activeFilter]);

  const fetchStaff = React.useCallback(async () => {
    try {
      // Try 'employees' table first, fallback to 'staff' if it fails
      let { data, error } = await supabase.from('employees').select('*').order('name');
      
      if (error) {
        console.log('Could not fetch from employees table, trying staff table...', error);
        const staffRes = await supabase.from('staff').select('*').order('name');
        data = staffRes.data;
        error = staffRes.error;
      }

      if (error) throw error;
      
      if (data) {
        const formattedStaff = data.map((e: any) => ({
          id: String(e.id),
          name: e.name,
          role: e.role || 'Staff',
          avatarUrl: e.avatar_url || e.avatarUrl
        }));
        setStaff(formattedStaff);
      }
    } catch (error: any) {
      console.error('Error fetching staff:', error);
      showError(`${t.errorFetchingStaff}${error.message || 'Network error'}`);
      // Fallback to mock if both fail so the app doesn't break
      if (staff.length === 0) setStaff(MOCK_EMPLOYEES);
    }
  }, [staff.length, t.errorFetchingStaff]);

  const fetchOrders = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        const formattedOrders = data.map(mapDbOrderToAppOrder);
        setOrders(formattedOrders);
        setSelectedOrder(prev => {
          if (!prev) return null;
          const updated = formattedOrders.find(o => o.id === prev.id);
          return updated || prev;
        });
      }
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      showError(`${t.errorFetchingOrders}${error.message || 'Network error'}`);
    }
  }, [t.errorFetchingOrders]);

  useEffect(() => {
    fetchOrders();
    fetchStaff();

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

    const employeesSubscription = supabase
      .channel('public:employees')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => {
        fetchStaff();
      })
      .subscribe();

    const staffSubscription = supabase
      .channel('public:staff')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff' }, () => {
        fetchStaff();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSubscription);
      supabase.removeChannel(orderItemsSubscription);
      supabase.removeChannel(employeesSubscription);
      supabase.removeChannel(staffSubscription);
    };
  }, [fetchOrders, fetchStaff]);

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
      ['Détail des commandes'],
      ['Nom du drink', 'Choix d\'alcool', 'Portion d\'alcool', 'No. Order', 'Montant avant taxes', 'Montant après taxes', 'Taxes', 'Quantité', 'Statut de paiement', 'Employé assigné']
    ];

    // Add order details per item
    orders.forEach(order => {
      const employee = staff.find(s => s.id === order.assignedEmployeeId);
      const employeeName = employee ? employee.name : 'Non assigné';
      const orderNumber = order.orderNumber || order.id;
      const paymentStatus = order.paymentStatus === 'Paid' ? 'Payé' : 'Impayé';

      order.items.forEach(item => {
        const itemTotalAfterTaxes = item.product.price * item.quantity;
        const itemTotalBeforeTaxes = itemTotalAfterTaxes / 1.14975;
        const itemTaxes = itemTotalAfterTaxes - itemTotalBeforeTaxes;

        wsData.push([
          item.product.name,
          item.alcoholChoice || '',
          item.alcoholPortion || '',
          orderNumber,
          itemTotalBeforeTaxes.toFixed(2),
          itemTotalAfterTaxes.toFixed(2),
          itemTaxes.toFixed(2),
          item.quantity,
          paymentStatus,
          employeeName
        ]);
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rapport');

    // Generate Excel file
    XLSX.writeFile(wb, `Rapport_Fermeture_${dateStr.replace(/-/g, '')}_${timeStr.replace(/:/g, '')}.xlsx`);
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const previousOrder = orders.find(o => String(o.id) === String(orderId));
    if (!previousOrder) return;

    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (String(o.id) === String(orderId) ? { ...o, status, updatedAt: new Date().toISOString() } : o))
    );
    if (selectedOrder && String(selectedOrder.id) === String(orderId)) {
      setSelectedOrder((prev) => (prev ? { ...prev, status } : null));
    }

    try {
      // Push to Supabase
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
        
      if (error) throw error;
    } catch (error: any) {
      console.error('Error updating order status:', error);
      showError(`${t.errorUpdatingOrder}${error.message || 'Network error'}`);
      // Revert optimistic update
      setOrders((prev) =>
        prev.map((o) => (String(o.id) === String(orderId) ? previousOrder : o))
      );
      if (selectedOrder && String(selectedOrder.id) === String(orderId)) {
        setSelectedOrder(previousOrder);
      }
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, paymentStatus: PaymentStatus) => {
    const previousOrder = orders.find(o => String(o.id) === String(orderId));
    if (!previousOrder) return;

    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (String(o.id) === String(orderId) ? { ...o, paymentStatus, updatedAt: new Date().toISOString() } : o))
    );
    if (selectedOrder && String(selectedOrder.id) === String(orderId)) {
      setSelectedOrder((prev) => (prev ? { ...prev, paymentStatus } : null));
    }

    try {
      // Push to Supabase
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: paymentStatus })
        .eq('id', orderId);
        
      if (error) throw error;
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      showError(`${t.errorUpdatingPayment}${error.message || 'Network error'}`);
      // Revert optimistic update
      setOrders((prev) =>
        prev.map((o) => (String(o.id) === String(orderId) ? previousOrder : o))
      );
      if (selectedOrder && String(selectedOrder.id) === String(orderId)) {
        setSelectedOrder(previousOrder);
      }
    }
  };

  const handleAssignStaff = async (orderId: string, employeeId: string) => {
    const previousOrder = orders.find(o => String(o.id) === String(orderId));
    if (!previousOrder) return;

    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (String(o.id) === String(orderId) ? { ...o, assignedEmployeeId: employeeId, updatedAt: new Date().toISOString() } : o))
    );
    if (selectedOrder && String(selectedOrder.id) === String(orderId)) {
      setSelectedOrder((prev) => (prev ? { ...prev, assignedEmployeeId: employeeId } : null));
    }

    try {
      // Push to Supabase
      const { error } = await supabase
        .from('orders')
        .update({ assigned_employee_id: employeeId })
        .eq('id', orderId);
        
      if (error) throw error;
    } catch (error: any) {
      console.error('Error assigning staff:', error);
      showError(`${t.errorAssigningStaff}${error.message || 'Network error'}`);
      // Revert optimistic update
      setOrders((prev) =>
        prev.map((o) => (String(o.id) === String(orderId) ? previousOrder : o))
      );
      if (selectedOrder && String(selectedOrder.id) === String(orderId)) {
        setSelectedOrder(previousOrder);
      }
    }
  };

  const handleAddStaff = async (employee: Omit<Employee, 'id'>) => {
    try {
      // Try employees table first
      let { error } = await supabase.from('employees').insert([{
        name: employee.name,
        role: employee.role,
        avatar_url: employee.avatarUrl
      }]);

      if (error) {
        // Fallback to staff table
        const staffRes = await supabase.from('staff').insert([{
          name: employee.name,
          role: employee.role,
          avatar_url: employee.avatarUrl
        }]);
        error = staffRes.error;
      }

      if (error) throw error;
      fetchStaff();
    } catch (error: any) {
      console.error('Error adding staff:', error);
      showError(`${t.errorAddingStaff}${error.message || 'Network error'}`);
    }
  };

  const handleUpdateStaff = async (employee: Employee) => {
    try {
      let { error } = await supabase.from('employees').update({
        name: employee.name,
        role: employee.role,
        avatar_url: employee.avatarUrl
      }).eq('id', employee.id);

      if (error) {
        const staffRes = await supabase.from('staff').update({
          name: employee.name,
          role: employee.role,
          avatar_url: employee.avatarUrl
        }).eq('id', employee.id);
        error = staffRes.error;
      }

      if (error) throw error;
      fetchStaff();
    } catch (error: any) {
      console.error('Error updating staff:', error);
      showError(`${t.errorUpdatingStaff}${error.message || 'Network error'}`);
    }
  };

  const handleRemoveStaff = async (id: string) => {
    try {
      let { error } = await supabase.from('employees').delete().eq('id', id);

      if (error) {
        const staffRes = await supabase.from('staff').delete().eq('id', id);
        error = staffRes.error;
      }

      if (error) throw error;
      fetchStaff();
    } catch (error: any) {
      console.error('Error removing staff:', error);
      showError(`${t.errorRemovingStaff}${error.message || 'Network error'}`);
    }
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
          onUpdatePaymentStatus={handleUpdatePaymentStatus}
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

        {/* Error Toast */}
        {error && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-5 fade-in duration-300">
            <div className="bg-brand-surface border border-red-500/50 text-red-500 px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 max-w-md">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="p-1 hover:bg-red-500/10 rounded-md transition-colors ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </Auth>
  );
}
