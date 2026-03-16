import React, { useState, useEffect } from 'react';
import { Lock, Delete } from 'lucide-react';
import { motion } from 'motion/react';

export function Auth({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  
  const TARGET_PIN = '7531';

  useEffect(() => {
    // Check local storage to see if already authenticated
    const authState = localStorage.getItem('barcommand_auth');
    if (authState === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (pin.length === 4) {
      if (pin === TARGET_PIN) {
        setIsAuthenticated(true);
        localStorage.setItem('barcommand_auth', 'true');
      } else {
        setError(true);
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 500);
      }
    }
  }, [pin]);

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError(false);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-brand-surface p-8 rounded-3xl border border-brand-border shadow-2xl flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-brand-accent/10 flex items-center justify-center border border-brand-accent/30 mb-6">
          <Lock className="w-8 h-8 text-brand-accent" />
        </div>
        
        <h1 className="text-2xl font-serif text-center mb-2">LeJockey</h1>
        <p className="text-neutral-400 text-center mb-8 text-sm">Entrez votre code d'accès</p>

        {/* PIN Display */}
        <motion.div 
          className="flex gap-6 mb-10"
          animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          {[0, 1, 2, 3].map((index) => (
            <div 
              key={index}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                pin.length > index 
                  ? 'bg-brand-accent border-brand-accent' 
                  : 'border-brand-border bg-transparent'
              } ${error ? 'bg-red-500 border-red-500' : ''}`}
            />
          ))}
        </motion.div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-y-6 gap-x-8 w-full max-w-[260px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              className="w-16 h-16 rounded-full bg-brand-bg border border-brand-border flex items-center justify-center text-2xl font-medium hover:bg-brand-accent/10 hover:border-brand-accent/30 hover:text-brand-accent transition-all active:scale-95 mx-auto"
            >
              {num}
            </button>
          ))}
          <div className="w-16 h-16" /> {/* Empty space */}
          <button
            onClick={() => handleNumberClick('0')}
            className="w-16 h-16 rounded-full bg-brand-bg border border-brand-border flex items-center justify-center text-2xl font-medium hover:bg-brand-accent/10 hover:border-brand-accent/30 hover:text-brand-accent transition-all active:scale-95 mx-auto"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="w-16 h-16 rounded-full bg-brand-bg border border-brand-border flex items-center justify-center text-neutral-400 hover:text-red-400 hover:bg-red-400/10 hover:border-red-400/30 transition-all active:scale-95 mx-auto"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
