'use client';

import { createContext, useContext, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

const Ctx = createContext<SupabaseClient | null>(null);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  return <Ctx.Provider value={supabase}>{children}</Ctx.Provider>;
}

export const useSupabase = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSupabase must be inside SupabaseProvider');
  return ctx;
};