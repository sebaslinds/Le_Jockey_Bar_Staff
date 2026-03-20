export type OrderStatus = 'New' | 'Approved' | 'Prep' | 'Ready' | 'Completed' | 'Canceled';
export type PaymentStatus = 'Paid' | 'Unpaid';

export interface Employee {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface OrderItem {
  id: string;
  product: Product;
  quantity: number;
  notes?: string;
  alcoholChoice?: string;
  alcoholPortion?: string;
}

export interface Order {
  id: string;
  orderNumber?: number;
  customerName?: string;
  tableNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  items: OrderItem[];
  assignedEmployeeId?: string;
  createdAt: string;
  updatedAt: string;
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
}
