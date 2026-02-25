'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AISuggestionsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/ai-bets');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-200 border-t-purple-600"></div>
    </div>
  );
}
