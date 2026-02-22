'use client';

import { type ReactNode } from 'react';
import { useAuthPersist } from '@/lib/hooks/useAuthPersist';

export function Providers({ children }: { children: ReactNode }) {
  useAuthPersist();
  return <>{children}</>;
}
