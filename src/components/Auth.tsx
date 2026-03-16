import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock } from 'lucide-react';

export function Auth({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // For the sake of this demo, we'll bypass actual Supabase auth if keys are placeholders
  const isDemo = import.meta.env.VITE_SUPABASE_URL === undefined;

  useEffect(() => {
    if (isDemo) {
      setSession({ user: { id: 'demo-user' } });
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [isDemo]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo) {
      setSession({ user: { id: 'demo-user' } });
      return;
    }
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="animate-pulse text-brand-accent">Loading BarCommand AI...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-brand-surface p-8 rounded-2xl border border-brand-border shadow-2xl">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-full bg-brand-accent/10 flex items-center justify-center border border-brand-accent/30">
              <Lock className="w-8 h-8 text-brand-accent" />
            </div>
          </div>
          <h1 className="text-3xl font-serif text-center mb-2">BarCommand AI</h1>
          <p className="text-neutral-400 text-center mb-8">Authorized Personnel Only</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-brand-text focus:outline-none focus:border-brand-accent transition-colors"
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="PIN / Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-brand-text focus:outline-none focus:border-brand-accent transition-colors"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-brand-accent hover:bg-brand-accent-hover text-brand-bg font-semibold py-3 rounded-xl transition-colors"
            >
              Unlock Terminal
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
