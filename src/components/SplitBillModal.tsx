import React, { useState } from 'react';
import { Order } from '../types';
import { Language } from '../constants';
import { X, Percent, List, Minus, Plus } from 'lucide-react';
import { clsx } from 'clsx';

export type SplitData = 
  | { type: 'percentage', percentage: number }
  | { type: 'items', selectedItems: Record<string, number> };

interface SplitBillModalProps {
  order: Order;
  language: Language;
  onClose: () => void;
  onConfirmSplit: (splitData: SplitData) => void;
}

export function SplitBillModal({ order, language, onClose, onConfirmSplit }: SplitBillModalProps) {
  const [splitType, setSplitType] = useState<'percentage' | 'items'>('percentage');
  const [percentage, setPercentage] = useState<number>(50);
  const [customPercentage, setCustomPercentage] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});

  const handleQuantityChange = (itemId: string, delta: number, maxQuantity: number) => {
    setSelectedItems(prev => {
      const current = prev[itemId] || 0;
      const nextQty = Math.max(0, Math.min(maxQuantity, current + delta));
      const next = { ...prev };
      if (nextQty === 0) {
        delete next[itemId];
      } else {
        next[itemId] = nextQty;
      }
      return next;
    });
  };

  const handleConfirm = () => {
    if (splitType === 'percentage') {
      onConfirmSplit({ type: 'percentage', percentage: percentage });
    } else {
      const totalSelectedQty = Object.values(selectedItems).reduce((sum: number, qty: number) => sum + qty, 0);
      const totalOrderQty = order.items.reduce((sum, item) => sum + item.quantity, 0);
      
      if (totalSelectedQty === 0 || totalSelectedQty === totalOrderQty) {
        alert(language === 'fr' ? 'Veuillez sélectionner au moins un article, mais pas tous.' : 'Please select at least one item, but not all.');
        return;
      }
      onConfirmSplit({ type: 'items', selectedItems });
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-brand-border bg-brand-bg/50">
          <h2 className="text-2xl font-serif text-brand-text">{language === 'fr' ? 'Séparer la facture' : 'Split Bill'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-brand-border transition-colors text-neutral-400 hover:text-brand-text">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div className="flex gap-2 p-1 bg-brand-bg rounded-lg border border-brand-border">
            <button
              onClick={() => setSplitType('percentage')}
              className={clsx("flex-1 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2", splitType === 'percentage' ? "bg-brand-surface text-brand-text shadow-sm" : "text-neutral-400 hover:text-neutral-300")}
            >
              <Percent className="w-4 h-4" /> {language === 'fr' ? 'Par pourcentage' : 'By Percentage'}
            </button>
            <button
              onClick={() => setSplitType('items')}
              className={clsx("flex-1 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2", splitType === 'items' ? "bg-brand-surface text-brand-text shadow-sm" : "text-neutral-400 hover:text-neutral-300")}
            >
              <List className="w-4 h-4" /> {language === 'fr' ? 'Par article' : 'By Item'}
            </button>
          </div>

          {splitType === 'percentage' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[50, 33.33, 25].map(pct => (
                  <button
                    key={pct}
                    onClick={() => { setPercentage(pct); setCustomPercentage(''); }}
                    className={clsx("py-3 rounded-lg border transition-colors font-mono text-lg", percentage === pct && !customPercentage ? "bg-brand-accent/20 border-brand-accent text-brand-accent" : "bg-brand-bg border-brand-border text-neutral-400 hover:border-brand-accent/50")}
                  >
                    {pct === 33.33 ? '1/3' : pct === 25 ? '1/4' : `${pct}%`}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-neutral-400">{language === 'fr' ? 'Ou manuel:' : 'Or custom:'}</span>
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={customPercentage}
                    onChange={(e) => {
                      setCustomPercentage(e.target.value);
                      if (e.target.value) setPercentage(Number(e.target.value));
                    }}
                    placeholder="e.g. 40"
                    className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2 text-brand-text focus:outline-none focus:border-brand-accent transition-colors font-mono"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500">%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
              <p className="text-sm text-neutral-400 mb-3">{language === 'fr' ? 'Sélectionnez les quantités pour la première facture (le reste ira sur la deuxième).' : 'Select quantities for the first bill (the rest will go to the second).'}</p>
              {order.items.map(item => {
                const selectedQty = selectedItems[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className={clsx("flex items-center justify-between p-3 rounded-lg border transition-colors", selectedQty > 0 ? "bg-brand-accent/10 border-brand-accent text-brand-text" : "bg-brand-bg border-brand-border text-neutral-400 hover:border-brand-accent/30")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-brand-bg border border-brand-border rounded-lg p-1">
                        <button 
                          onClick={() => handleQuantityChange(item.id, -1, item.quantity)}
                          className="p-1 hover:bg-brand-surface rounded text-neutral-400 hover:text-brand-text transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-4 text-center font-mono text-brand-text">{selectedQty}</span>
                        <button 
                          onClick={() => handleQuantityChange(item.id, 1, item.quantity)}
                          className="p-1 hover:bg-brand-surface rounded text-neutral-400 hover:text-brand-text transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <span>/ {item.quantity} {item.product.name}</span>
                    </div>
                    <span className="font-mono">${(item.product.price * (selectedQty || 0)).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={handleConfirm}
            className="w-full bg-brand-accent hover:bg-brand-accent-hover text-brand-bg font-bold py-3 rounded-xl transition-colors mt-2"
          >
            {language === 'fr' ? 'Confirmer la séparation' : 'Confirm Split'}
          </button>
        </div>
      </div>
    </div>
  );
}
