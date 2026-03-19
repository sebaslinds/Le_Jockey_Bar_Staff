import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { Order, OrderStatus, Employee, PaymentStatus } from '../types';

// Initialize the Gemini client
// Note: In a real app, this should be handled securely, preferably server-side.
// For this AI Studio prototype, we use the injected environment variable.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const getOrderStatusDeclaration: FunctionDeclaration = {
  name: 'getOrderStatus',
  description: 'Get the current status of a specific order by its ID or order number.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      orderId: {
        type: Type.STRING,
        description: 'The ID or order number of the order (e.g., "77", "#77", or "ORD-101").',
      },
    },
    required: ['orderId'],
  },
};

const listOpenOrdersDeclaration: FunctionDeclaration = {
  name: 'listOpenOrders',
  description: 'List all open orders currently in the system.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const checkWorkingStaffDeclaration: FunctionDeclaration = {
  name: 'checkWorkingStaff',
  description: 'Check which staff members are currently working.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const updateOrderStatusDeclaration: FunctionDeclaration = {
  name: 'updateOrderStatus',
  description: 'Update the status of a specific order.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      orderId: {
        type: Type.STRING,
        description: 'The ID or order number of the order to update (e.g., "77", "#77", or "ORD-101").',
      },
      newStatus: {
        type: Type.STRING,
        description: 'The new status for the order. Must be one of: New, Approved, Prep, Ready, Completed.',
      },
    },
    required: ['orderId', 'newStatus'],
  },
};

const updatePaymentStatusDeclaration: FunctionDeclaration = {
  name: 'updatePaymentStatus',
  description: 'Update the payment status of a specific order.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      orderId: {
        type: Type.STRING,
        description: 'The ID or order number of the order to update (e.g., "77", "#77", or "ORD-101").',
      },
      newStatus: {
        type: Type.STRING,
        description: 'The new payment status for the order. Must be one of: Paid, Unpaid.',
      },
    },
    required: ['orderId', 'newStatus'],
  },
};

const completeAllOpenOrdersDeclaration: FunctionDeclaration = {
  name: 'completeAllOpenOrders',
  description: 'Close all open orders by setting their status to Completed. This moves them to the history.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const markAllOrdersAsPaidDeclaration: FunctionDeclaration = {
  name: 'markAllOrdersAsPaid',
  description: 'Mark all unpaid orders as Paid, including those in the history column.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

export const tools = [
  {
    functionDeclarations: [
      getOrderStatusDeclaration,
      listOpenOrdersDeclaration,
      checkWorkingStaffDeclaration,
      updateOrderStatusDeclaration,
      updatePaymentStatusDeclaration,
      completeAllOpenOrdersDeclaration,
      markAllOrdersAsPaidDeclaration,
    ],
  },
];

export async function processChatbotMessage(
  message: string,
  orders: Order[],
  staff: Employee[],
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void,
  onUpdatePaymentStatus: (orderId: string, status: PaymentStatus) => void
): Promise<string> {
  try {
    const chat = ai.chats.create({
      model: 'gemini-3.1-pro-preview',
      config: {
        systemInstruction: `You are BarCommand AI, an expert assistant for a high-end bar/restaurant POS system. 
You help staff manage orders and check status. Be concise, professional, and helpful.
If you need to perform an action, use the provided tools.
If the user asks to "close all bills" or "ferme tous les bills", use the completeAllOpenOrders tool to set all open orders to Completed (which moves them to history).
If the user asks to mark all bills as paid, use the markAllOrdersAsPaid tool to update all unpaid orders to Paid, even if they are in the history column.`,
        tools: tools,
      },
    });

    const response = await chat.sendMessage({ message });

    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      
      const findOrder = (idOrNumber: string) => {
        const cleanId = idOrNumber.replace('#', '').trim();
        return orders.find(o => o.id === idOrNumber || String(o.orderNumber) === cleanId);
      };

      if (call.name === 'getOrderStatus') {
        const orderId = call.args?.orderId as string;
        const order = findOrder(orderId);
        if (order) {
          return `Order ${order.orderNumber ? '#' + order.orderNumber : order.id} is currently in status: ${order.status}.`;
        }
        return `I couldn't find an order with ID or number ${orderId}.`;
      }
      
      if (call.name === 'listOpenOrders') {
        const openOrders = orders.filter(o => o.status !== 'Completed' && o.status !== 'Canceled');
        if (openOrders.length === 0) return 'There are no open orders right now.';
        const list = openOrders.map(o => `- ${o.orderNumber ? '#' + o.orderNumber : o.id} (Table ${o.tableNumber}): ${o.status}`).join('\n');
        return `Here are the open orders:\n${list}`;
      }
      
      if (call.name === 'checkWorkingStaff') {
        if (staff.length === 0) return 'No staff members are currently listed.';
        const list = staff.map(s => `- ${s.name} (${s.role})`).join('\n');
        return `Currently working staff:\n${list}`;
      }
      
      if (call.name === 'completeAllOpenOrders') {
        const openOrders = orders.filter(o => o.status !== 'Completed' && o.status !== 'Canceled');
        if (openOrders.length === 0) {
          return 'There are no open orders to close.';
        }
        
        // Update all open orders to 'Completed'
        openOrders.forEach(order => {
          onUpdateOrderStatus(order.id, 'Completed');
        });
        
        return `I have closed ${openOrders.length} open orders and moved them to history.`;
      }

      if (call.name === 'markAllOrdersAsPaid') {
        const unpaidOrders = orders.filter(o => o.paymentStatus === 'Unpaid');
        if (unpaidOrders.length === 0) {
          return 'There are no unpaid orders to mark as paid.';
        }
        
        // Update all unpaid orders to 'Paid'
        unpaidOrders.forEach(order => {
          onUpdatePaymentStatus(order.id, 'Paid');
        });
        
        return `I have marked ${unpaidOrders.length} unpaid orders as Paid, including those in the history column.`;
      }

      if (call.name === 'updatePaymentStatus') {
        const orderId = call.args?.orderId as string;
        const newStatus = call.args?.newStatus as PaymentStatus;
        
        const validStatuses: PaymentStatus[] = ['Paid', 'Unpaid'];
        if (!validStatuses.includes(newStatus)) {
          return `Invalid payment status: ${newStatus}. Valid statuses are: ${validStatuses.join(', ')}.`;
        }
        
        const order = findOrder(orderId);
        if (order) {
          onUpdatePaymentStatus(order.id, newStatus);
          return `I have updated the payment status of order ${order.orderNumber ? '#' + order.orderNumber : order.id} to ${newStatus}.`;
        }
        return `I couldn't find an order with ID or number ${orderId} to update payment status.`;
      }

      if (call.name === 'updateOrderStatus') {
        const orderId = call.args?.orderId as string;
        const newStatus = call.args?.newStatus as OrderStatus;
        
        const validStatuses: OrderStatus[] = ['New', 'Approved', 'Prep', 'Ready', 'Completed'];
        if (!validStatuses.includes(newStatus)) {
          return `Invalid status: ${newStatus}. Valid statuses are: ${validStatuses.join(', ')}.`;
        }
        
        const order = findOrder(orderId);
        if (order) {
          if (newStatus === 'Ready' && !order.assignedEmployeeId) {
            return `I cannot update order ${order.orderNumber ? '#' + order.orderNumber : order.id} to Ready because it does not have an assigned employee. Please assign an employee first.`;
          }
          onUpdateOrderStatus(order.id, newStatus);
          return `I have updated order ${order.orderNumber ? '#' + order.orderNumber : order.id} to ${newStatus}.`;
        }
        return `I couldn't find an order with ID or number ${orderId} to update.`;
      }
    }

    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error('Gemini API Error:', error);
    return 'There was an error communicating with the AI service. Please try again.';
  }
}
