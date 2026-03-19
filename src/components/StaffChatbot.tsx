import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Sparkles } from 'lucide-react';
import { Order, OrderStatus, Employee, PaymentStatus } from '../types';
import { processChatbotMessage } from '../services/gemini';
import { Language, TRANSLATIONS } from '../constants';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';

interface StaffChatbotProps {
  orders: Order[];
  staff: Employee[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onUpdatePaymentStatus: (orderId: string, status: PaymentStatus) => void;
  language: Language;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function StaffChatbot({ orders, staff, onUpdateOrderStatus, onUpdatePaymentStatus, language }: StaffChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Hello! I am your Staff Assistant. How can I help you manage the floor today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[language];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const responseText = await processChatbotMessage(userMsg.content, orders, staff, onUpdateOrderStatus, onUpdatePaymentStatus);

    const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: responseText };
    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={clsx(
          "fixed bottom-10 right-6 p-4 rounded-full shadow-2xl transition-all duration-300 z-40",
          "bg-brand-accent hover:bg-brand-accent-hover text-brand-bg",
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        )}
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 w-96 h-[500px] bg-brand-surface border border-brand-border rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-brand-border bg-brand-bg/80 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-accent/20 flex items-center justify-center border border-brand-accent/50">
                  <MessageSquare className="w-4 h-4 text-brand-accent" />
                </div>
                <h3 className="font-serif font-medium text-brand-text">{t.chatbotTitle}</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-brand-border transition-colors text-neutral-400 hover:text-brand-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-brand-bg/30">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={clsx(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                    msg.role === 'user'
                      ? "bg-brand-accent text-brand-bg ml-auto rounded-br-sm"
                      : "bg-brand-surface border border-brand-border text-brand-text mr-auto rounded-bl-sm"
                  )}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {msg.id === '1' ? t.chatbotInitialMessage : msg.content}
                  </p>
                </div>
              ))}
              {isLoading && (
                <div className="bg-brand-surface border border-brand-border text-brand-text mr-auto rounded-2xl rounded-bl-sm px-4 py-3 w-fit">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-accent" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-brand-border bg-brand-bg/80 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={t.chatbotPlaceholder}
                  className="flex-1 bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-sm text-brand-text focus:outline-none focus:border-brand-accent transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="p-3 bg-brand-accent hover:bg-brand-accent-hover disabled:bg-brand-surface disabled:text-neutral-500 text-brand-bg rounded-xl transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
