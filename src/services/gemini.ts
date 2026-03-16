import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { Order, OrderStatus, Employee } from '../types';

// Initialize the Gemini client
// Note: In a real app, this should be handled securely, preferably server-side.
// For this AI Studio prototype, we use the injected environment variable.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const getOrderStatusDeclaration: FunctionDeclaration = {
  name: 'getOrderStatus',
  description: 'Get the current status of a specific order by its ID.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      orderId: {
        type: Type.STRING,
        description: 'The ID of the order (e.g., "ORD-101").',
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
        description: 'The ID of the order to update (e.g., "ORD-101").',
      },
      newStatus: {
        type: Type.STRING,
        description: 'The new status for the order. Must be one of: New, Approved, Prep, Ready, Completed.',
      },
    },
    required: ['orderId', 'newStatus'],
  },
};

export const tools = [
  {
    functionDeclarations: [
      getOrderStatusDeclaration,
      listOpenOrdersDeclaration,
      checkWorkingStaffDeclaration,
      updateOrderStatusDeclaration,
    ],
  },
];

export async function processChatbotMessage(
  message: string,
  orders: Order[],
  staff: Employee[],
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void
): Promise<string> {
  try {
    const chat = ai.chats.create({
      model: 'gemini-3.1-pro-preview',
      config: {
        systemInstruction: `You are BarCommand AI, an expert assistant for a high-end bar/restaurant POS system. 
You help staff manage orders and check status. Be concise, professional, and helpful.
If you need to perform an action, use the provided tools.`,
        tools: tools,
      },
    });

    const response = await chat.sendMessage({ message });

    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      
      if (call.name === 'getOrderStatus') {
        const orderId = call.args?.orderId as string;
        const order = orders.find(o => o.id === orderId);
        if (order) {
          return `Order ${orderId} is currently in status: ${order.status}.`;
        }
        return `I couldn't find an order with ID ${orderId}.`;
      }
      
      if (call.name === 'listOpenOrders') {
        const openOrders = orders.filter(o => o.status !== 'Completed');
        if (openOrders.length === 0) return 'There are no open orders right now.';
        const list = openOrders.map(o => `- ${o.id} (Table ${o.tableNumber}): ${o.status}`).join('\n');
        return `Here are the open orders:\n${list}`;
      }
      
      if (call.name === 'checkWorkingStaff') {
        if (staff.length === 0) return 'No staff members are currently listed.';
        const list = staff.map(s => `- ${s.name} (${s.role})`).join('\n');
        return `Currently working staff:\n${list}`;
      }
      
      if (call.name === 'updateOrderStatus') {
        const orderId = call.args?.orderId as string;
        const newStatus = call.args?.newStatus as OrderStatus;
        
        const validStatuses: OrderStatus[] = ['New', 'Approved', 'Prep', 'Ready', 'Completed'];
        if (!validStatuses.includes(newStatus)) {
          return `Invalid status: ${newStatus}. Valid statuses are: ${validStatuses.join(', ')}.`;
        }
        
        const order = orders.find(o => o.id === orderId);
        if (order) {
          onUpdateOrderStatus(orderId, newStatus);
          return `I have updated order ${orderId} to ${newStatus}.`;
        }
        return `I couldn't find an order with ID ${orderId} to update.`;
      }
    }

    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error('Gemini API Error:', error);
    return 'There was an error communicating with the AI service. Please try again.';
  }
}
