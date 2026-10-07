import { Suspense } from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div style={{ background: 'var(--bg-base)', minHeight: '100vh' }} />}>{children}</Suspense>;
}
