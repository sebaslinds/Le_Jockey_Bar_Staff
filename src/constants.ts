import { Employee, Order, OrderStatus, Product } from './types';

export const ORDER_STATUSES: OrderStatus[] = ['New', 'Approved', 'Prep', 'Ready', 'Completed'];

export const STATUS_COLORS: Record<OrderStatus, { dot: string, text: string }> = {
  New: { dot: 'bg-blue-500', text: 'text-blue-500' },
  Approved: { dot: 'bg-purple-500', text: 'text-purple-500' },
  Prep: { dot: 'bg-orange-500', text: 'text-orange-500' },
  Ready: { dot: 'bg-green-500', text: 'text-green-500' },
  Completed: { dot: 'bg-neutral-500', text: 'text-neutral-500' },
};

export const MOCK_EMPLOYEES: Employee[] = [
  { id: 'e1', name: 'SARAH', role: 'Server', avatarUrl: 'https://i.pravatar.cc/150?u=e1' },
  { id: 'e2', name: 'MIKE', role: 'Bartender', avatarUrl: 'https://i.pravatar.cc/150?u=e2' },
  { id: 'e3', name: 'ALEX', role: 'Sommelier', avatarUrl: 'https://i.pravatar.cc/150?u=e3' },
];

export const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Old Fashioned', price: 18, category: 'Cocktails' },
  { id: 'p2', name: 'Truffle Fries', price: 12, category: 'Bar Snacks' },
  { id: 'p3', name: 'Dom Perignon 2012', price: 350, category: 'Wine' },
  { id: 'p4', name: 'Wagyu Sliders', price: 28, category: 'Food' },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-101',
    tableNumber: 'T-12',
    status: 'New',
    paymentStatus: 'Unpaid',
    items: [
      { id: 'i1', product: MOCK_PRODUCTS[0], quantity: 2 },
      { id: 'i2', product: MOCK_PRODUCTS[1], quantity: 1 },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    subtotal: 48,
    tax: 4.8,
    tip: 0,
    total: 52.8,
  },
  {
    id: 'ORD-102',
    tableNumber: 'Bar-3',
    status: 'Prep',
    paymentStatus: 'Paid',
    assignedEmployeeId: 'e2',
    items: [
      { id: 'i3', product: MOCK_PRODUCTS[2], quantity: 1 },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    subtotal: 350,
    tax: 35,
    tip: 70,
    total: 455,
  },
  {
    id: 'ORD-103',
    tableNumber: 'T-04',
    status: 'Ready',
    paymentStatus: 'Unpaid',
    assignedEmployeeId: 'e1',
    items: [
      { id: 'i4', product: MOCK_PRODUCTS[3], quantity: 2 },
      { id: 'i5', product: MOCK_PRODUCTS[0], quantity: 2 },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    subtotal: 92,
    tax: 9.2,
    tip: 0,
    total: 101.2,
  },
];

export const TRANSLATIONS = {
  en: {
    dashboard: 'Dashboard',
    totalPaid: 'Collected Revenue',
    totalUnpaid: 'Pending',
    tips: 'Tips',
    staff: 'Staff',
    reports: 'Reports',
    refresh: 'Refresh',
    new: 'New',
    approved: 'Approved',
    prep: 'Prep',
    ready: 'Ready',
    completed: 'History',
    paid: 'Paid',
    unpaid: 'Unpaid',
    table: 'Table',
    items: 'items',
    orderDetail: 'Order Detail',
    subtotal: 'Subtotal',
    tax: 'Tax',
    tip: 'Tip',
    total: 'Total',
    assignStaff: 'Assign Staff',
    updateStatus: 'Update Status',
    updatePayment: 'Update Payment',
    close: 'Close',
    staffManagement: 'Staff Management',
    addEmployee: 'Add Employee',
    name: 'Name',
    role: 'Role',
    save: 'Save',
    cancel: 'Cancel',
    chatbotPlaceholder: 'Ask BarCommand AI...',
    empty: 'EMPTY',
    all: 'ALL',
    unassigned: 'UNASSIGNED',
    team: 'TEAM'
  },
  fr: {
    dashboard: 'Tableau de bord',
    totalPaid: 'Ventes',
    totalUnpaid: 'En Attente',
    tips: 'Pourboires',
    staff: 'Personnel',
    reports: 'Rapports',
    refresh: 'Rafraîchir',
    new: 'Nouvelles',
    approved: 'Approuvées',
    prep: 'Préparation',
    ready: 'Prêt',
    completed: 'Historique',
    paid: 'Payé',
    unpaid: 'Impayé',
    table: 'Table',
    items: 'articles',
    orderDetail: 'Détail de la commande',
    subtotal: 'Sous-total',
    tax: 'Taxes',
    tip: 'Pourboire',
    total: 'Total',
    assignStaff: 'Assigner personnel',
    updateStatus: 'Mettre à jour statut',
    updatePayment: 'Mettre à jour paiement',
    close: 'Fermer',
    staffManagement: 'Gestion du personnel',
    addEmployee: 'Ajouter un employé',
    name: 'Nom',
    role: 'Rôle',
    save: 'Enregistrer',
    cancel: 'Annuler',
    chatbotPlaceholder: 'Demandez à BarCommand AI...',
    empty: 'VIDE',
    all: 'TOUS',
    unassigned: 'NON ASSIGNÉ',
    team: 'ÉQUIPE'
  }
};

export type Language = keyof typeof TRANSLATIONS;
