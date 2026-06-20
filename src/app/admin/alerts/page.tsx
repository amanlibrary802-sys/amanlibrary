'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AlertsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/alerts/2-week');
  }, [router]);

  return null;
}
